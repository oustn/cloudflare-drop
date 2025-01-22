interface FileType {
  code: string
  filename: string
  hash: string
  objectId: string
  due_date: number
}

interface FileUploadedType {
  hash: string
  code: string
}

interface ApiResponseType<T> {
  message: string
  result: boolean
  data: T | null
}

export async function resolveFileByCode(
  code: string,
): Promise<ApiResponseType<FileType>> {
  const response = await fetch(`/files/share/${code}`)
  return await response.json()
}

export async function uploadFile(
  data: Blob,
): Promise<ApiResponseType<FileUploadedType>> {
  const formData = new FormData()
  formData.append('file', data)
  const response = await fetch('/files', {
    method: 'PUT',
    body: formData,
  })
  return await response.json()
}
