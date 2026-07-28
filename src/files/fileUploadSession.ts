import { Context } from 'hono'
import { createId } from '@paralleldrive/cuid2'
import dayjs from 'dayjs'

import { Endpoint } from '../endpoint'
import { files, InsertFileType } from '../../data/schemas'
import { resolveShareDuration } from '../common'
import { createNumericShareCode, isUniqueCodeConstraint } from '../shareCode'
import { selectStorage } from '../storage'
import { StorageProvider } from '../storage/types'

export const UPLOAD_SESSION_PART_SIZE = 5 * 1024 * 1024
const UPLOAD_SESSION_PREFIX = 'upload-session:'
const UPLOAD_SESSION_TTL = 60 * 60
const KV_ENCRYPTED_PLAINTEXT_LIMIT = 50 * 1000 * 1000
const ENCRYPTED_SESSION_OVERHEAD_ALLOWANCE = 2 * 1024 * 1024

interface UploadedPart {
  partNumber: number
  etag?: string
  objectId?: string
}

interface UploadSessionManifest {
  sessionId: string
  provider: StorageProvider
  objectId: string
  uploadId?: string
  filename: string
  type: string
  size: number
  shareSize: number
  hash: string
  duration: string
  isEphemeral: boolean
  isEncrypted: boolean
  partSize: number
  uploadedParts: UploadedPart[]
}

interface UploadSessionCreatePayload {
  filename?: string
  type?: string
  size?: number
  plaintextSize?: number
  hash?: string
  duration?: string
  isEphemeral?: boolean
  isEncrypted?: boolean
}

function sessionKey(sessionId: string) {
  return `${UPLOAD_SESSION_PREFIX}${sessionId}`
}

function normalizeType(type: string | undefined, filename = '') {
  return type || (filename.endsWith('.txt') ? 'text/plain' : '')
}

function totalParts(
  manifest: Pick<UploadSessionManifest, 'size' | 'partSize'>,
) {
  return Math.max(1, Math.ceil(manifest.size / manifest.partSize))
}

function expectedPartSize(
  manifest: Pick<UploadSessionManifest, 'size' | 'partSize'>,
  partNumber: number,
) {
  const start = (partNumber - 1) * manifest.partSize
  return Math.max(0, Math.min(manifest.partSize, manifest.size - start))
}

function validatePartNumber(
  manifest: UploadSessionManifest,
  partNumber: number,
) {
  return (
    Number.isInteger(partNumber) &&
    partNumber >= 1 &&
    partNumber <= totalParts(manifest)
  )
}

function upsertPart(
  manifest: UploadSessionManifest,
  part: UploadedPart,
): UploadSessionManifest {
  return {
    ...manifest,
    uploadedParts: [
      ...manifest.uploadedParts.filter(
        (item) => item.partNumber !== part.partNumber,
      ),
      part,
    ].sort((a, b) => a.partNumber - b.partNumber),
  }
}

async function readManifest(kv: KVNamespace, sessionId: string) {
  const raw = await kv.get(sessionKey(sessionId))
  if (!raw) return null
  return JSON.parse(raw) as UploadSessionManifest
}

async function writeManifest(kv: KVNamespace, manifest: UploadSessionManifest) {
  await kv.put(sessionKey(manifest.sessionId), JSON.stringify(manifest), {
    expirationTtl: UPLOAD_SESSION_TTL,
  })
}

function chooseProvider(env: Env, type: string): StorageProvider {
  if (type === 'plain/string') return 'kv'
  return selectStorage(env).provider
}

async function insertShareRecord(
  endpoint: Endpoint,
  c: Context,
  manifest: UploadSessionManifest,
) {
  let shareDuration: { permanent: boolean; dueDate: Date }
  try {
    shareDuration = resolveShareDuration(
      manifest.duration || c.env.SHARE_DURATION || '1hour',
    )
  } catch (error) {
    return endpoint.error(
      error instanceof Error ? error.message : '分享有效期错误',
    )
  }

  const insert: Omit<InsertFileType, 'code'> = {
    objectId: manifest.objectId,
    filename: manifest.filename,
    type: manifest.type,
    hash: manifest.hash,
    due_date: shareDuration.dueDate,
    size: manifest.shareSize,
    is_ephemeral: manifest.isEphemeral,
    is_encrypted: manifest.isEncrypted,
    storage_provider: manifest.provider,
    created_at: dayjs().toDate(),
  }

  const db = endpoint.getDB(c)
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

  if (!record) return endpoint.error('分享码生成失败，请重试')

  return {
    message: 'ok',
    result: true,
    data: {
      ...record,
      due_date: shareDuration.permanent ? null : record.due_date,
    },
  }
}

export class FileUploadSessionCreate extends Endpoint {
  async handle(c: Context) {
    const payload = (await c.req.json()) as UploadSessionCreatePayload
    const filename = payload.filename ?? 'download'
    const type = normalizeType(payload.type, filename)
    const size = payload.size ?? -1
    if (!Number.isInteger(size) || size <= 0) {
      return this.error('文件大小信息错误')
    }
    const shareSize =
      payload.isEncrypted && payload.plaintextSize !== undefined
        ? payload.plaintextSize
        : size
    if (!Number.isInteger(shareSize) || shareSize <= 0) {
      return this.error('文件大小信息错误')
    }

    const envMax = Number.parseInt(c.env.SHARE_MAX_SIZE_IN_MB, 10)
    const max = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax
    const maxBytes = max * 1000 * 1000
    if (shareSize > maxBytes) {
      return this.error(`文件大于 ${max}M`)
    }
    if (!payload.isEncrypted && size > maxBytes) {
      return this.error(`文件大于 ${max}M`)
    }
    if (
      payload.isEncrypted &&
      size > maxBytes + ENCRYPTED_SESSION_OVERHEAD_ALLOWANCE
    ) {
      return this.error(`文件大于 ${max}M`)
    }

    const sessionId = createId()
    const objectId = createId()
    const provider = chooseProvider(c.env, type)
    if (
      provider === 'kv' &&
      payload.isEncrypted &&
      shareSize > KV_ENCRYPTED_PLAINTEXT_LIMIT
    ) {
      return this.error('KV 加密分享暂不支持大于 50M 的文件')
    }
    const manifest: UploadSessionManifest = {
      sessionId,
      provider,
      objectId,
      filename,
      type,
      size,
      shareSize,
      hash: payload.hash ?? '',
      duration: payload.duration ?? '',
      isEphemeral: Boolean(payload.isEphemeral),
      isEncrypted: Boolean(payload.isEncrypted),
      partSize: UPLOAD_SESSION_PART_SIZE,
      uploadedParts: [],
    }

    if (provider === 'r2') {
      if (!c.env.FILES) return this.error('R2 storage is not configured')
      const multipart = await c.env.FILES.createMultipartUpload(objectId)
      manifest.uploadId = multipart.uploadId
    }

    await writeManifest(this.getKV(c), manifest)

    return this.success({
      sessionId,
      partSize: manifest.partSize,
      uploadedParts: [],
    })
  }
}

export class FileUploadSessionPartCreate extends Endpoint {
  async handle(c: Context) {
    const sessionId = c.req.param('sessionId')
    if (!sessionId) return this.error('上传会话不存在')
    const partNumber = Number.parseInt(c.req.param('partNumber') ?? '', 10)
    const kv = this.getKV(c)
    const manifest = await readManifest(kv, sessionId)
    if (!manifest) return this.error('上传会话不存在')
    if (!validatePartNumber(manifest, partNumber)) {
      return this.error('文件分片序号错误')
    }

    if (manifest.provider === 'r2') {
      if (!c.env.FILES || !manifest.uploadId) {
        return this.error('R2 upload session is not configured')
      }
      const body = c.req.raw.body
      if (!body) return this.error('文件分片为空')
      const multipart = c.env.FILES.resumeMultipartUpload(
        manifest.objectId,
        manifest.uploadId,
      )
      const uploaded = await multipart.uploadPart(partNumber, body)
      const next = upsertPart(manifest, {
        partNumber: uploaded.partNumber,
        etag: uploaded.etag,
      })
      await writeManifest(kv, next)
      return this.success({
        partNumber: uploaded.partNumber,
        etag: uploaded.etag,
      })
    }

    const bytes = await c.req.arrayBuffer()
    const expected = expectedPartSize(manifest, partNumber)
    if (bytes.byteLength !== expected) {
      return this.error('文件分片大小错误')
    }
    const objectId = `${manifest.objectId}.chunk.${partNumber - 1}`
    await kv.put(objectId, bytes)
    const next = upsertPart(manifest, { partNumber, objectId })
    await writeManifest(kv, next)
    return this.success({ partNumber, objectId })
  }
}

export class FileUploadSessionComplete extends Endpoint {
  async handle(c: Context) {
    const sessionId = c.req.param('sessionId')
    if (!sessionId) return this.error('上传会话不存在')
    const kv = this.getKV(c)
    const manifest = await readManifest(kv, sessionId)
    if (!manifest) return this.error('上传会话不存在')
    const expectedParts = totalParts(manifest)
    if (manifest.uploadedParts.length !== expectedParts) {
      return this.error('文件分片未上传完整')
    }

    if (manifest.provider === 'r2') {
      if (!c.env.FILES || !manifest.uploadId) {
        return this.error('R2 upload session is not configured')
      }
      const uploadedParts = manifest.uploadedParts.map((part) => ({
        partNumber: part.partNumber,
        etag: part.etag!,
      }))
      const multipart = c.env.FILES.resumeMultipartUpload(
        manifest.objectId,
        manifest.uploadId,
      )
      await multipart.complete(uploadedParts)
    } else {
      const chunks = manifest.uploadedParts.map((part) => ({
        objectId: part.objectId!,
        chunkId: part.partNumber - 1,
      }))
      await kv.put(manifest.objectId, '', { metadata: chunks })
    }

    const response = await insertShareRecord(this, c, manifest)
    if ('result' in response && response.result) {
      await kv.delete(sessionKey(sessionId))
    }
    return response
  }
}
