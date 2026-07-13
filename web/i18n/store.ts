import { observable, action, makeObservable } from 'mobx'
import dayjs from 'dayjs'
import zhTW from 'dayjs/locale/zh-tw'
import { Locale, TranslationKeys } from './types'
import { locales } from './locales'

// dayjs 語系對應
const dayjsLocaleMap: Record<Locale, string> = {
  'zh-TW': 'zh-tw',
  en: 'en',
}

// 預先載入所有語系
dayjs.locale(zhTW)

type TranslationParams = Record<string, string | number>

class I18nStore {
  private static STORAGE_KEY = 'app-locale'

  @observable accessor locale: Locale = 'zh-TW'

  constructor() {
    makeObservable(this)
    this.initLocale()
  }

  private initLocale() {
    // 1. 優先讀取 localStorage
    const saved = localStorage.getItem(I18nStore.STORAGE_KEY)
    if (saved && this.isValidLocale(saved)) {
      this.setLocale(saved as Locale)
      return
    }

    // 2. 根據瀏覽器語言自動偵測
    const browserLang = navigator.language
    if (browserLang.startsWith('zh')) {
      this.setLocale('zh-TW')
    } else {
      this.setLocale('en')
    }
  }

  private isValidLocale(locale: string): locale is Locale {
    return locale === 'zh-TW' || locale === 'en'
  }

  @action
  setLocale(locale: Locale) {
    this.locale = locale
    localStorage.setItem(I18nStore.STORAGE_KEY, locale)
    document.documentElement.lang = locale

    // 同步 dayjs locale
    dayjs.locale(dayjsLocaleMap[locale])
  }

  /**
   * 取得翻譯文字
   * @param namespace 命名空間（例如 'common', 'home'）
   * @param key 翻譯鍵
   * @param params 參數（用來取代 {param} 預留位置）
   */
  t = <N extends keyof TranslationKeys>(
    namespace: N,
    key: keyof TranslationKeys[N],
    params?: TranslationParams,
  ): string => {
    const text = locales[this.locale][namespace][key] as string

    if (!params) {
      return text
    }

    // 取代 {param} 預留位置
    return Object.entries(params).reduce(
      (result, [k, v]) => result.replace(`{${k}}`, String(v)),
      text,
    )
  }
}

export const i18nStore = new I18nStore()
