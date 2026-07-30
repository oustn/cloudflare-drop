interface FileType {
  id: string
  code: string
  filename: string
  hash: string
  due_date: number
  type: string
  size: number
  is_ephemeral?: boolean
  is_encrypted?: boolean
  storage_provider?: 'kv' | 'r2' | string
  created_at: number
}

interface FileUploadedType {
  hash: string
  code: string
  due_date: number
  is_encrypted?: boolean
}

interface ApiResponseType<T> {
  message: string
  result: boolean
  data: T | null
}
