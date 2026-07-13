import { i18nStore } from '../i18n/store'
import { TranslationKeys } from '../i18n/types'

/**
 * 將後端回傳的錯誤碼（例如 INVALID_CODE）轉換為 camelCase（例如 invalidCode）
 */
function toCamelCase(str: string): string {
  return str
    .split('_')
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')
}

/**
 * 將後端回傳的錯誤訊息對應至 i18n 翻譯
 * @param errorMessage 後端回傳的錯誤訊息（可能是 INVALID_CODE 等錯誤碼或其他訊息）
 * @returns 經 i18n 翻譯的錯誤訊息
 */
export function mapError(errorMessage: string): string {
  // 全大寫或包含底線的錯誤訊息可能是錯誤碼
  if (/^[A-Z_]+$/.test(errorMessage)) {
    const camelCaseKey = toCamelCase(errorMessage)

    // 嘗試從 i18n errors 區塊取得翻譯
    try {
      const translated = i18nStore.t(
        'errors',
        camelCaseKey as keyof TranslationKeys['errors'],
      )
      if (translated) {
        return translated
      }
    } catch (_e) {
      // 找不到翻譯時回傳 unknownError
      return i18nStore.t('errors', 'unknownError')
    }
  }

  // 非錯誤碼格式直接回傳原始訊息，以維持向後相容
  return errorMessage || i18nStore.t('errors', 'unknownError')
}
