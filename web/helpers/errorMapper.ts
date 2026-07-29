import { i18nStore } from '../i18n/store'
import { TranslationParams } from '../i18n/types'

const ERROR_CODE_ALIASES: Record<string, string> = {
  INVALID_CODE: 'invalidCode',
  SHARE_EXPIRED: 'shareExpired',
  SHARE_CLAIMED: 'shareClaimed',
  INVALID_TOKEN: 'invalidToken',
  INVALID_OBJECT_ID: 'invalidObjectId',
  EMPTY_CONTENT: 'emptyContent',
  SHARE_READ_FAILED: 'shareReadFailed',
  FILE_READ_FAILED: 'fileReadFailed',
  INVALID_DURATION_FORMAT: 'invalidDurationFormat',
  INVALID_DURATION: 'invalidDuration',
  DURATION_TOO_LONG: 'durationTooLong',
  ADMIN_DISABLED: 'adminDisabled',
  CODE_GENERATION_FAILED: 'codeGenerationFailed',
  INVALID_FILE_SIZE: 'invalidFileSize',
  FILE_TOO_LARGE: 'fileTooLarge',
  ENCRYPTED_KV_LIMIT: 'encryptedKvLimit',
  UPLOAD_SESSION_MISSING: 'uploadSessionMissing',
  FILE_PART_NUMBER_INVALID: 'filePartNumberInvalid',
  FILE_PART_EMPTY: 'filePartEmpty',
  FILE_PART_SIZE_INVALID: 'filePartSizeInvalid',
  FILE_PART_INCOMPLETE: 'filePartIncomplete',
  ENCRYPTED_FILE_INVALID: 'encryptedFileInvalid',
  UNSUPPORTED_WEB_CRYPTO: 'unsupportedWebCrypto',
  ENCRYPTED_SIZE_MISMATCH: 'encryptedSizeMismatch',
  VERSION_MISMATCH: 'versionMismatch',
  INTEGRITY_CHECK_FAILED: 'integrityCheckFailed',
  R2_STORAGE_NOT_CONFIGURED: 'r2StorageNotConfigured',
  R2_UPLOAD_SESSION_NOT_CONFIGURED: 'r2UploadSessionNotConfigured',
  NOT_FOUND: 'notFound',
  UNKNOWN_ERROR: 'unknownError',
}

const LEGACY_ERROR_ALIASES: Record<string, string> = {
  分享码无效: 'invalidCode',
  分享已过期: 'shareExpired',
  分享已被读取: 'shareClaimed',
  '无效的 token': 'invalidToken',
  '无效的 object id': 'invalidObjectId',
  分享内容为空: 'emptyContent',
  分享读取失败: 'shareReadFailed',
  文件读取失败: 'fileReadFailed',
  分享有效期格式错误: 'invalidDurationFormat',
  分享有效期错误: 'invalidDuration',
  管理功能未开启: 'adminDisabled',
  '分享码生成失败，请重试': 'codeGenerationFailed',
  文件大小信息错误: 'invalidFileSize',
  上传会话不存在: 'uploadSessionMissing',
  文件分片序号错误: 'filePartNumberInvalid',
  文件分片为空: 'filePartEmpty',
  文件分片大小错误: 'filePartSizeInvalid',
  文件分片未上传完整: 'filePartIncomplete',
  加密文件格式错误: 'encryptedFileInvalid',
  '当前环境不支持 Web Crypto': 'unsupportedWebCrypto',
  加密文件大小不匹配: 'encryptedSizeMismatch',
  文件过大: 'fileTooLargeGeneric',
  版本不匹配: 'versionMismatch',
  数据完整性校验失败: 'integrityCheckFailed',
  'R2 storage is not configured': 'r2StorageNotConfigured',
  'R2 upload session is not configured': 'r2UploadSessionNotConfigured',
  'Not found': 'notFound',
}

function toCamelCase(code: string) {
  return code
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase())
}

function translateError(key: string, params?: TranslationParams) {
  const path = `errors.${key}`
  if (!i18nStore.has(path)) return null
  return i18nStore.t(path, params)
}

function mapDynamicLegacyError(message: string) {
  const fileTooLarge = /^文件大于\s*(\d+(?:\.\d+)?)M$/.exec(message)
  if (fileTooLarge) {
    return translateError('fileTooLarge', { size: fileTooLarge[1] })
  }

  const encryptedKvLimit =
    /^KV 加密分享暂不支持大于\s*(\d+(?:\.\d+)?)M\s*的文件$/.exec(message)
  if (encryptedKvLimit) {
    return translateError('encryptedKvLimit', { size: encryptedKvLimit[1] })
  }

  const durationTooLong = /^分享有效期不能超过\s*(\d+)\s*年$/.exec(message)
  if (durationTooLong) {
    return translateError('durationTooLong', { years: durationTooLong[1] })
  }

  return null
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error === null || error === undefined) return ''
  try {
    return JSON.stringify(error)
  } catch (_error) {
    return String(error)
  }
}

export function mapError(error: unknown) {
  const message = normalizeError(error).trim()
  if (!message) return i18nStore.t('errors.unknownError')

  const dynamicMapped = mapDynamicLegacyError(message)
  if (dynamicMapped) return dynamicMapped

  const legacyKey = LEGACY_ERROR_ALIASES[message]
  if (legacyKey) return translateError(legacyKey) ?? message

  if (/^[A-Z][A-Z0-9_]+$/.test(message)) {
    const codeKey = ERROR_CODE_ALIASES[message] ?? toCamelCase(message)
    return translateError(codeKey) ?? i18nStore.t('errors.unknownError')
  }

  return message
}
