interface FileType {
  code: string
  filename: string
  hash: string
  objectId: string
  due_date: number
  type: string
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
