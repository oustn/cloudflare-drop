import axios, { AxiosProgressEvent } from 'axios'
import { getUserUUID } from '../helpers'

interface ChunkInfo {
  sha: string
  uuid: string
  size: number
  chunks: Array<{
    chunkId: number
    size: number
  }>
  finished: Array<{
    chunkId: number
    objectId: string
  }>
}

type UploadCallback = { (progressEvent: AxiosProgressEvent): void }
type UploadedChunk = { objectId: string }

export class Uploader {
  static KV_CHUNK_SIZE = 25 * 1024 * 1024
  static MAX_KV_CHUNK_SIZE = 100 * 1024 * 1024
  static CHUNK_SIZE = 5 * 1024 * 1024

  static async upload(
    formData: FormData,
    onUpload?: UploadCallback,
  ): Promise<ApiResponseType<FileUploadedType>> {
    const file: Blob | null = formData.get('file') as Blob
    // 使用默认的上传
    if (file.size <= this.CHUNK_SIZE) {
      const { data } = await axios.put('/files', formData, {
        onUploadProgress: onUpload,
      })
      return data as ApiResponseType<FileUploadedType>
    }
    if (file.size <= this.KV_CHUNK_SIZE) {
      const { objectId, sha } = await this.uploadWithChunk(file, onUpload)
      formData.delete('file') // 移除 file
      formData.append(
        'fileInfo',
        JSON.stringify({
          objectId,
          name: file.name,
          type: file.type,
          size: file.size,
          sha,
        }),
      )
      const { data } = await axios.put('/files', formData)
      return data as ApiResponseType<FileUploadedType>
    }
    if (file.size <= this.MAX_KV_CHUNK_SIZE) {
      const size = file.size
      const chunkSize = file.size / this.KV_CHUNK_SIZE
      const uploadHandler = this.createMergedProgressEventHandler(
        size,
        chunkSize,
        onUpload,
      )
      const result = []

      for (let i = 0; i < chunkSize; i++) {
        const start = i * this.KV_CHUNK_SIZE
        const end = Math.min(start + this.KV_CHUNK_SIZE, size)
        const chunk = file.slice(start, end)
        result.push(
          await this.uploadWithChunk(chunk, (e) =>
            uploadHandler.onUpload(e, i),
          ),
        )
      }
      const chunkInfo = result.flatMap((d) => d.objectId)
      uploadHandler.finished()
      formData.delete('file') // 移除 file
      formData.append(
        'fileInfo',
        JSON.stringify({
          objectId: chunkInfo,
          name: file.name,
          type: file.type,
          size: file.size,
          sha: await this.getSHA(file),
        }),
      )
      const { data } = await axios.put('/files', formData)
      return data as ApiResponseType<FileUploadedType>
    }
    throw new Error('建议使用 R2')
  }

  static async uploadWithChunk(
    blob: Blob,
    onUpload?: UploadCallback,
  ): Promise<{
    objectId: UploadedChunk[]
    sha: string
  }> {
    // 计算 md5
    const sha = await this.getSHA(blob)
    const uuid = getUserUUID()
    const size = blob.size
    const totalChunks = Math.ceil(blob.size / this.CHUNK_SIZE)
    const chunks = new Array(totalChunks).fill(1).map((_, i) => ({
      chunkId: i,
      size:
        i < totalChunks - 1
          ? this.CHUNK_SIZE
          : size + this.CHUNK_SIZE - this.CHUNK_SIZE * totalChunks,
    }))
    const chunkInfo = await this.getChunkInfo({
      sha,
      uuid,
      size,
      chunks,
    })

    const uploadHandler = this.createMergedProgressEventHandler(
      size,
      totalChunks,
      onUpload,
    )

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, size)
      const chunk = blob.slice(start, end)
      if (chunkInfo.finished.find((d) => d.chunkId === i)) {
        uploadHandler.onUpload(
          {
            loaded: end - start,
            lengthComputable: true,
            bytes: end - start,
            total: end - start,
            progress: 1,
            upload: true,
          },
          i,
        )
        continue
      }
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkId', `${i}`)
      formData.append('uuid', uuid)
      formData.append('sha', sha)
      await this.uploadChunk(formData, (e) => uploadHandler.onUpload(e, i))
    }

    uploadHandler.finished()
    return {
      objectId: chunks.map(({ chunkId }) => {
        const uploaded = chunkInfo.finished.find((d) => d.chunkId === chunkId)
        return { objectId: uploaded?.objectId ?? `${uuid}_${sha}.${chunkId}` }
      }),
      sha,
    }
  }

  private static createMergedProgressEventHandler(
    size: number,
    total: number,
    onUpload?: UploadCallback,
  ) {
    const progresses: Map<number, AxiosProgressEvent> = new Map()
    let prevTotal = 0

    return {
      onUpload: (e: AxiosProgressEvent, chunkId: number) => {
        progresses.set(chunkId, e)
        const totalLoaded = Array.from(progresses.values()).reduce(
          (sum, loaded) => sum + loaded.loaded,
          0,
        )
        if (onUpload) {
          onUpload({
            bytes: totalLoaded - prevTotal,
            lengthComputable: true,
            loaded: totalLoaded,
            total: size,
            progress: totalLoaded / size,
            upload:
              progresses.size === total &&
              Array.from(progresses.values()).every((d) => d.upload),
          })
        }
        prevTotal = totalLoaded
      },
      finished: () => {
        if (onUpload) {
          onUpload({
            bytes: 0,
            lengthComputable: true,
            loaded: size,
            total: size,
            progress: 1,
            upload: true,
          })
        }
      },
    }
  }

  private static async uploadChunk(
    formData: FormData,
    onUpload?: UploadCallback,
  ) {
    return axios.put('/files/chunks', formData, {
      onUploadProgress: onUpload,
    })
  }

  private static async getChunkInfo(
    info: Omit<ChunkInfo, 'finished'>,
  ): Promise<ChunkInfo> {
    const response = await fetch('/files/chunks', {
      method: 'POST',
      body: JSON.stringify(info),
    })

    const data: ApiResponseType<ChunkInfo> = await response.json()

    if (!data.result) {
      throw new Error('获取分片信息失败')
    }
    return data.data!
  }

  private static async getSHA(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
