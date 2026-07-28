import { Context } from 'hono'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import dayjs from 'dayjs'

import { Endpoint } from '../endpoint'
import { files, InsertFileType } from '../../data/schemas'
import { resolveShareDuration } from '../common'
import { selectStorage } from '../storage'
import { createNumericShareCode, isUniqueCodeConstraint } from '../shareCode'

const KV_ENCRYPTED_PLAINTEXT_LIMIT = 50 * 1000 * 1000
const ENCRYPTED_STREAM_OVERHEAD_ALLOWANCE = 2 * 1024 * 1024

class UploadTooLargeError extends Error {}

function parseBooleanHeader(value: string | undefined) {
  return value === 'true' || value === '1'
}

function parsePlaintextSize(value: string | undefined) {
  if (!value) return null
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const size = Number.parseInt(normalized, 10)
  if (!Number.isSafeInteger(size) || size < 0) return null
  return size
}

function limitStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
  message: string,
) {
  const reader = stream.getReader()
  let bytes = 0

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read()
        if (chunk.done) {
          controller.close()
          return
        }
        bytes += chunk.value.byteLength
        if (bytes > maxBytes) {
          await reader.cancel()
          controller.error(new UploadTooLargeError(message))
          return
        }
        controller.enqueue(chunk.value)
      } catch (error) {
        controller.error(error)
      }
    },
    async cancel(reason) {
      await reader.cancel(reason)
    },
  })
}

export class FileStreamCreate extends Endpoint {
  schema = {
    responses: {
      '200': {
        description: 'Returns the encrypted file info',
        content: {
          'application/json': {
            schema: z.object({
              hash: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const plaintextSize = parsePlaintextSize(c.req.header('x-plaintext-size'))
    if (plaintextSize === null) {
      return this.error('文件大小信息缺失')
    }

    const storage = selectStorage(c.env)
    const envMax = Number.parseInt(c.env.SHARE_MAX_SIZE_IN_MB, 10)
    const max = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax
    const maxBytes = max * 1000 * 1000
    if (plaintextSize > maxBytes) {
      return this.error(`文件大于 ${max}M`)
    }
    if (
      storage.provider === 'kv' &&
      plaintextSize > KV_ENCRYPTED_PLAINTEXT_LIMIT
    ) {
      return this.error('KV 加密分享暂不支持大于 50M 的文件')
    }

    const body = c.req.raw.body
    if (!body) return this.error('分享内容为空')

    let shareDuration: { permanent: boolean; dueDate: Date }
    try {
      shareDuration = resolveShareDuration(
        c.req.header('x-share-duration') || c.env.SHARE_DURATION || '1hour',
      )
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : '分享有效期错误',
      )
    }

    const objectId = createId()
    const uploadLimitBytes =
      Math.min(
        maxBytes,
        storage.provider === 'kv' ? KV_ENCRYPTED_PLAINTEXT_LIMIT : maxBytes,
      ) + ENCRYPTED_STREAM_OVERHEAD_ALLOWANCE
    const contentLength = parsePlaintextSize(c.req.header('content-length'))
    if (contentLength !== null && contentLength > uploadLimitBytes) {
      return this.error(
        storage.provider === 'kv'
          ? 'KV 加密分享暂不支持大于 50M 的文件'
          : `文件大于 ${max}M`,
      )
    }

    try {
      await storage.put(
        objectId,
        limitStream(
          body,
          uploadLimitBytes,
          storage.provider === 'kv'
            ? 'KV 加密分享暂不支持大于 50M 的文件'
            : `文件大于 ${max}M`,
        ),
      )
    } catch (error) {
      try {
        await storage.delete(objectId)
      } catch (_cleanupError) {
        //
      }
      return this.error(
        error instanceof UploadTooLargeError ? error.message : '文件上传失败',
      )
    }

    const insert: Omit<InsertFileType, 'code'> = {
      objectId,
      filename: 'encrypted-file',
      type: 'application/octet-stream',
      hash: '',
      due_date: shareDuration.dueDate,
      size: plaintextSize,
      is_ephemeral: parseBooleanHeader(c.req.header('x-share-ephemeral')),
      is_encrypted: true,
      storage_provider: storage.provider,
      created_at: dayjs().toDate(),
    }

    const db = this.getDB(c)
    let record:
      | {
          hash: string
          code: string
          due_date: Date
          is_ephemeral: boolean | null
          is_encrypted: boolean | null
        }
      | undefined
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          ;[record] = await db
            .insert(files)
            .values({ ...insert, code: createNumericShareCode() })
            .returning({
              hash: files.hash,
              code: files.code,
              due_date: files.due_date,
              is_ephemeral: files.is_ephemeral,
              is_encrypted: files.is_encrypted,
            })
          break
        } catch (error) {
          if (!isUniqueCodeConstraint(error)) throw error
        }
      }
    } catch (error) {
      await storage.delete(objectId)
      throw error
    }

    if (!record) {
      await storage.delete(objectId)
      return this.error('分享码生成失败，请重试')
    }

    return {
      message: 'ok',
      result: true,
      data: {
        ...record,
        due_date: shareDuration.permanent ? null : record.due_date,
      },
    }
  }
}
