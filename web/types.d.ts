interface FileType {
  id: string
  code: string
  filename: string
  hash: string
  due_date: number | null
  type: string
  size: number
  is_ephemeral?: boolean
  is_encrypted?: boolean
  created_at: number
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
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
