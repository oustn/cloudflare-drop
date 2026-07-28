import { Context } from 'hono'
import mine from 'mime'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import dayjs from 'dayjs'

import { Endpoint } from '../endpoint'
import { files, InsertFileType } from '../../data/schemas'
import { resolveShareDuration } from '../common'
import { selectStorage } from '../storage'
import { createNumericShareCode, isUniqueCodeConstraint } from '../shareCode'

async function sha256(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest(
    {
      name: 'SHA-256',
    },
    data,
  )
  const array = Array.from(new Uint8Array(digest))
  return array.map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface TemporaryUploadMetadata {
  size: number
  hash: string
}

function isTemporaryUploadMetadata(
  metadata: unknown,
): metadata is TemporaryUploadMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    typeof (metadata as TemporaryUploadMetadata).size === 'number' &&
    typeof (metadata as TemporaryUploadMetadata).hash === 'string'
  )
}

function combineStreams(
  kv: KVNamespace,
  objectIds: Array<{ objectId: string }>,
): ReadableStream<Uint8Array> {
  let index = 0
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  return new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          if (!reader) {
            const stream = await kv.get(objectIds[index]?.objectId, 'stream')
            if (!stream) throw new Error('分片上传的文件不存在')
            reader = stream.getReader()
          }
          const chunk = await reader.read()
          if (!chunk.done) {
            controller.enqueue(chunk.value)
            return
          }
          reader.releaseLock()
          reader = null
          index += 1
          if (index === objectIds.length) {
            controller.close()
            return
          }
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

export class FileCreate extends Endpoint {
  schema = {
    responses: {
      '200': {
        description: 'Returns the file info',

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

  private getFormDataField<T>(
    formData: FormData,
    fieldName: string,
    defaultValue: T,
  ): T {
    const value = formData.get(fieldName) as string
    if (!value) return defaultValue
    try {
      return JSON.parse(value)
    } catch (_e) {
      //
    }
    return defaultValue
  }

  async handle(c: Context) {
    let data: ArrayBuffer | null = null
    let filename: string = ''
    let type: string | null = null
    let size: number = 0
    let duration: string = c.env.SHARE_DURATION
    let isEphemeral = false
    let isEncrypted = false
    let objectId: string | Array<{ objectId: string }> = ''
    let hash = ''
    const contentType = c.req.header('Content-Type')
    if (
      contentType?.startsWith('multipart/form-data') ||
      contentType?.startsWith('application/x-www-form-urlencoded')
    ) {
      const formData = await c.req.formData()
      const file = formData.get('file') as File

      const fileInfo = this.getFormDataField<null | {
        objectId: string | Array<{ objectId: string }>
        name: string
        type?: string
        size: number
        sha: string
      }>(formData, 'fileInfo', null)

      duration = this.getFormDataField(formData, 'duration', duration)
      isEphemeral = this.getFormDataField(formData, 'isEphemeral', isEphemeral)
      isEncrypted = this.getFormDataField(formData, 'isEncrypted', isEncrypted)

      if (file) {
        data = await file.arrayBuffer()
        filename = file.name
        type = file.type ?? mine.getType(filename) ?? 'text/plain'
        size = file.size
      } else if (fileInfo) {
        filename = fileInfo.name
        type = fileInfo.type ?? mine.getType(filename) ?? 'text/plain'
        size = fileInfo.size
        objectId = fileInfo.objectId
        hash = fileInfo.sha
      }
    } else {
      const blob = await c.req.blob()
      data = await blob.arrayBuffer()
      filename = (blob as File)?.name ?? ''
      type = blob.type
      size = blob.size
    }

    if (
      (!data || data.byteLength === 0) &&
      (!objectId || (Array.isArray(objectId) && !objectId.length))
    ) {
      return this.error('分享内容为空')
    }

    const envMax = Number.parseInt(c.env.SHARE_MAX_SIZE_IN_MB, 10)
    const max = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax

    const kv = this.getKV(c)
    if (!data && typeof objectId === 'string') {
      const { metadata } =
        await kv.getWithMetadata<TemporaryUploadMetadata>(objectId)
      if (!isTemporaryUploadMetadata(metadata)) {
        return this.error('分片上传的文件信息不存在')
      }
      size = metadata.size
      hash = metadata.hash
    } else if (!data && Array.isArray(objectId)) {
      const metadata = await Promise.all(
        objectId.map(async ({ objectId }) => {
          const result =
            await kv.getWithMetadata<TemporaryUploadMetadata>(objectId)
          return result.metadata
        }),
      )
      if (!metadata.every(isTemporaryUploadMetadata)) {
        return this.error('分片上传的文件信息不存在')
      }
      size = metadata.reduce((total, item) => total + item.size, 0)
    }

    if (size > max * 1000 * 1000) {
      return this.error(`文件大于 ${max}M`)
    }

    let shareDuration: { permanent: boolean; dueDate: Date }
    try {
      shareDuration = resolveShareDuration(
        duration || c.env.SHARE_DURATION || '1hour',
      )
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : '分享有效期错误',
      )
    }

    const storage = selectStorage(c.env)
    const key = createId()
    // 直接上传
    if (data && data.byteLength) {
      await storage.put(key, data)
      hash = await sha256(data)
      // 单个
    } else if (typeof objectId === 'string') {
      const cacheFile = await kv.get(objectId, 'stream')
      if (!cacheFile) {
        return this.error('分片上传的文件不存在')
      }
      await storage.put(key, cacheFile)
      await kv.delete(objectId)
      // 分片存储
    } else if (Array.isArray(objectId) && objectId.length) {
      await storage.put(key, combineStreams(kv, objectId))
      await Promise.all(objectId.map((chunk) => kv.delete(chunk.objectId)))
    }

    const db = this.getDB(c)

    const insert: Omit<InsertFileType, 'code'> = {
      objectId: key,
      filename,
      type,
      hash,
      due_date: shareDuration.dueDate,
      size,
      is_ephemeral: isEphemeral,
      is_encrypted: isEncrypted,
      storage_provider: storage.provider,
      created_at: dayjs().toDate(),
    }

    let record:
      | {
          hash: string
          code: string
          due_date: Date
          is_ephemeral: boolean | null
          is_encrypted: boolean | null
        }
      | undefined
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
    if (!record) {
      await storage.delete(key)
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
