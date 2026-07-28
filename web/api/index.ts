import axios, { AxiosProgressEvent } from 'axios'
import { Encryptor } from '../helpers'
import { Uploader } from './uploader.ts'

export async function processResponse(response: Response) {
  if (response.ok) return await response.json()

  return {
    result: false,
    data: null,
    message: await response.text(),
  }
}

export async function resolveFileByCode(
  code: string,
): Promise<ApiResponseType<FileType & { token: string }>> {
  const response = await fetch(`/files/share/${code}`)
  return processResponse(response)
}

async function uploadEncryptedFile(
  payload: {
    data: Blob
    isEphemeral: boolean
    duration: string
    password: string
  },
  onUpload?: (progressEvent: AxiosProgressEvent) => void,
): Promise<ApiResponseType<FileUploadedType>> {
  const { data, isEphemeral, duration, password } = payload
  const encrypted = await Encryptor.encryptStream(password, data)
  return Uploader.uploadStream(
    {
      stream: encrypted.stream,
      size: encrypted.size,
      plaintextSize: data.size,
      filename: 'encrypted-file',
      type: data.type || 'application/octet-stream',
      hash: '',
      duration,
      isEphemeral,
      isEncrypted: true,
    },
    onUpload,
  )
}

export async function uploadFile(
  payload: {
    data: Blob
    isEphemeral?: boolean
    duration?: string | null
    password?: string
  },
  onUpload?: (progressEvent: AxiosProgressEvent) => void,
): Promise<ApiResponseType<FileUploadedType>> {
  try {
    const { data, isEphemeral = false, duration = '', password } = payload
    if (password) {
      if (data.type === 'plain/string') {
        const formData = new FormData()
        formData.append('file', await Encryptor.encrypt(password, data))
        formData.append('isEphemeral', JSON.stringify(isEphemeral))
        formData.append('duration', JSON.stringify(duration))
        formData.append('isEncrypted', JSON.stringify(true))
        formData.append('plaintextSize', JSON.stringify(data.size))
        formData.append('plaintextType', data.type)
        formData.append('hash', JSON.stringify(''))
        return await Uploader.upload(formData, onUpload)
      }
      return await uploadEncryptedFile(
        { data, isEphemeral, duration: duration ?? '', password },
        onUpload,
      )
    }

    const formData = new FormData()
    formData.append('file', data)
    formData.append('isEphemeral', JSON.stringify(isEphemeral))
    formData.append('duration', JSON.stringify(duration))
    return await Uploader.upload(formData, onUpload)
  } catch (e) {
    return {
      result: false,
      data: null,
      message: (e as Error)?.message ?? JSON.stringify(e),
    }
  }
}

export async function fetchSharedBlob(
  id: string,
  token?: string,
): Promise<Blob> {
  const response = await fetch(`/files/${id}?token=${token}`)
  if (!response.ok) throw new Error(await response.text())
  return response.blob()
}

export async function decryptPlainText(
  password: string,
  blob: Blob,
): Promise<string> {
  const decrypted = await Encryptor.decryptWithMetadata(password, blob)
  return decrypted.blob.text()
}

export async function fetchPlainText(
  id: string,
  password?: string,
  token?: string,
): Promise<string> {
  const response = await fetch(`/files/${id}?token=${token}`)
  if (!response.ok) throw new Error(await response.text())
  if (!password) {
    return response.text()
  }
  return decryptPlainText(password, await response.blob())
}

export async function fetchFile(
  cacheFile: Blob | null,
  id: string,
  password: string,
  filename: string,
  token?: string,
  onDownload?: (e: AxiosProgressEvent) => void,
): Promise<[file: Blob, error: Error | null]> {
  let blob: Blob
  if (!cacheFile) {
    const response = await axios.get(`/files/${id}?token=${token}`, {
      responseType: 'blob',
      onDownloadProgress: onDownload,
    })
    blob = response.data
  } else {
    blob = cacheFile
  }
  try {
    const decrypted = await Encryptor.decryptWithMetadata(password, blob)
    const file = new File(
      [decrypted.blob],
      decrypted.metadata.filename || filename,
      {
        type: decrypted.metadata.type || decrypted.blob.type,
      },
    )
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.addEventListener('click', (event) => {
      event.stopPropagation()
    })
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    return [blob, e as Error]
  }
  return [blob, null]
}

export function createAdminApi(token: string) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  return {
    list: async <T>(
      page = 1,
      size = 10,
      orderBy = '',
      order = '',
    ): Promise<ApiResponseType<T>> => {
      const search = new URLSearchParams({
        size: `${size}`,
        page: `${page}`,
      })
      if (orderBy && order) {
        search.append('orderBy', orderBy)
        search.append('order', order)
      }
      const response = await fetch(`/api/admin/shares?${search.toString()}`, {
        headers,
      })
      return processResponse(response)
    },

    delete: async (
      id: string | readonly string[],
    ): Promise<ApiResponseType<unknown>> => {
      const response = await fetch(`/api/admin/shares`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(Array.isArray(id) ? id : [id]),
      })
      return processResponse(response)
    },
  }
}
