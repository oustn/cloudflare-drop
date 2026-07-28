import { Context } from 'hono'
import mine from 'mime'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import dayjs from 'dayjs'

import { Endpoint } from '../endpoint'
import { files, InsertFileType } from '../../data/schemas'
import { resolveShareDuration } from '../common'
import { selectStorage, storageForProvider } from '../storage'
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
    let hash = ''
    let providedHash: string | null = null
    const contentType = c.req.header('Content-Type')
    if (
      contentType?.startsWith('multipart/form-data') ||
      contentType?.startsWith('application/x-www-form-urlencoded')
    ) {
      const formData = await c.req.formData()
      const file = formData.get('file') as File

      duration = this.getFormDataField(formData, 'duration', duration)
      isEphemeral = this.getFormDataField(formData, 'isEphemeral', isEphemeral)
      isEncrypted = this.getFormDataField(formData, 'isEncrypted', isEncrypted)
      providedHash = this.getFormDataField<string | null>(
        formData,
        'hash',
        null,
      )
      const plaintextSize = this.getFormDataField<number | null>(
        formData,
        'plaintextSize',
        null,
      )
      const plaintextType = formData.get('plaintextType')

      if (file) {
        data = await file.arrayBuffer()
        filename = file.name
        type = file.type ?? mine.getType(filename) ?? 'text/plain'
        size = file.size
        if (isEncrypted && Number.isInteger(plaintextSize) && plaintextSize) {
          size = plaintextSize
        }
        if (isEncrypted && typeof plaintextType === 'string' && plaintextType) {
          type = plaintextType
        }
      }
    } else {
      const blob = await c.req.blob()
      data = await blob.arrayBuffer()
      filename = (blob as File)?.name ?? ''
      type = blob.type
      size = blob.size
    }

    if (!data || data.byteLength === 0) {
      return this.error('分享内容为空')
    }

    const envMax = Number.parseInt(c.env.SHARE_MAX_SIZE_IN_MB, 10)
    const max = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax

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

    const storage =
      type === 'plain/string'
        ? storageForProvider(c.env, 'kv')
        : selectStorage(c.env)
    const key = createId()
    await storage.put(key, data)
    hash = isEncrypted ? (providedHash ?? '') : await sha256(data)

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
