import axios, { AxiosProgressEvent } from 'axios'

interface UploadSession {
  sessionId: string
  partSize: number
  uploadedParts: Array<{
    partNumber: number
    etag?: string
    objectId?: string
  }>
}

interface UploadSessionCreatePayload {
  filename: string
  type: string
  size: number
  hash: string
  duration: string
  isEphemeral: boolean
  isEncrypted: boolean
}

type UploadCallback = { (progressEvent: AxiosProgressEvent): void }

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== 'string' || !value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (_error) {
    return fallback
  }
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as ApiResponseType<T>
  if (!data.result) throw new Error(data.message)
  return data.data as T
}

export class Uploader {
  static CHUNK_SIZE = 5 * 1024 * 1024
  static MAX_UPLOAD_SIZE = 100 * 1024 * 1024

  static async upload(
    formData: FormData,
    onUpload?: UploadCallback,
  ): Promise<ApiResponseType<FileUploadedType>> {
    const file: Blob | null = formData.get('file') as Blob
    if (!file) throw new Error('分享内容为空')

    if (file.size <= this.CHUNK_SIZE) {
      const { data } = await axios.put('/files', formData, {
        onUploadProgress: onUpload,
      })
      return data as ApiResponseType<FileUploadedType>
    }

    if (file.size <= this.MAX_UPLOAD_SIZE) {
      return await this.uploadWithSession(formData, file, onUpload)
    }

    throw new Error(`文件大于 ${this.MAX_UPLOAD_SIZE / (1000 * 1000)}M`)
  }

  private static async uploadWithSession(
    formData: FormData,
    file: Blob,
    onUpload?: UploadCallback,
  ): Promise<ApiResponseType<FileUploadedType>> {
    const hash = await this.getSHA(file)
    const session = await this.createSession({
      filename: this.getFilename(file),
      type: file.type,
      size: file.size,
      hash,
      duration: parseJsonField(formData.get('duration'), ''),
      isEphemeral: parseJsonField(formData.get('isEphemeral'), false),
      isEncrypted: parseJsonField(formData.get('isEncrypted'), false),
    })
    const totalParts = Math.ceil(file.size / session.partSize)
    let uploaded = 0

    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1
      if (
        session.uploadedParts.some((part) => part.partNumber === partNumber)
      ) {
        const skippedSize = this.partSize(file, session.partSize, index)
        uploaded += skippedSize
        this.emitProgress(uploaded, file.size, skippedSize, onUpload)
        continue
      }

      const start = index * session.partSize
      const end = Math.min(start + session.partSize, file.size)
      const chunk = file.slice(start, end)
      await this.uploadPart(session.sessionId, partNumber, chunk)
      uploaded += chunk.size
      this.emitProgress(uploaded, file.size, chunk.size, onUpload)
    }

    return await this.completeSession(session.sessionId)
  }

  private static async createSession(payload: UploadSessionCreatePayload) {
    const response = await fetch('/files/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return readApiResponse<UploadSession>(response)
  }

  private static async uploadPart(
    sessionId: string,
    partNumber: number,
    chunk: Blob,
  ) {
    const response = await fetch(
      `/files/uploads/${sessionId}/parts/${partNumber}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunk,
      },
    )
    await readApiResponse(response)
  }

  private static async completeSession(
    sessionId: string,
  ): Promise<ApiResponseType<FileUploadedType>> {
    const response = await fetch(`/files/uploads/${sessionId}/complete`, {
      method: 'POST',
    })
    return {
      result: true,
      message: 'ok',
      data: await readApiResponse<FileUploadedType>(response),
    }
  }

  private static getFilename(file: Blob) {
    return file instanceof File ? file.name : 'download'
  }

  private static partSize(file: Blob, partSize: number, index: number) {
    const start = index * partSize
    return Math.min(partSize, file.size - start)
  }

  private static emitProgress(
    loaded: number,
    total: number,
    bytes: number,
    onUpload?: UploadCallback,
  ) {
    onUpload?.({
      bytes,
      lengthComputable: true,
      loaded,
      total,
      progress: total > 0 ? loaded / total : 1,
      upload: loaded >= total,
    })
  }

  private static async getSHA(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
