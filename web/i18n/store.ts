import { makeAutoObservable } from 'mobx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'

import { DEFAULT_LOCALE, LOCALE_CONFIG, SUPPORTED_LOCALES } from './config'
import { LOCALES } from './locales'
import {
  Locale,
  TranslationParams,
  TranslationTree,
  TranslationValue,
} from './types'

const STORAGE_KEY = 'cloudflare-drop-locale'

dayjs.extend(relativeTime)

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  )
}

export function detectLocale(
  language?: string,
  savedLocale?: string | null,
): Locale {
  if (isLocale(savedLocale)) return savedLocale
  const normalized = language?.toLowerCase()
  if (!normalized) return DEFAULT_LOCALE
  if (
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk') ||
    normalized.startsWith('zh-mo') ||
    normalized.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }
  if (normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('en')) return 'en'
  return 'en'
}

function getSavedLocale(): Locale | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch (_error) {
    return null
  }
}

function saveLocale(locale: Locale) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch (_error) {
    // Ignore private-mode or storage permission failures.
  }
}

function applyDocumentLocale(locale: Locale) {
  dayjs.locale(LOCALE_CONFIG[locale].dayjsLocale)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

function readPath(
  tree: TranslationTree,
  path: string,
): TranslationValue | null {
  return path.split('.').reduce<TranslationValue | null>((node, segment) => {
    if (!node || typeof node === 'string') return null
    return node[segment] ?? null
  }, tree)
}

function interpolate(text: string, params?: TranslationParams) {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (placeholder, key) => {
    const value = params[key]
    if (value === undefined || value === null) return placeholder
    return String(value)
  })
}

function translate(
  locale: Locale,
  key: string,
  params?: TranslationParams,
): string {
  const value =
    readPath(LOCALES[locale], key) ?? readPath(LOCALES['zh-CN'], key)
  if (typeof value !== 'string') return key
  return interpolate(value, params)
}

class I18nStore {
  locale: Locale = getSavedLocale() ?? DEFAULT_LOCALE

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    applyDocumentLocale(this.locale)
  }

  setLocale(locale: Locale) {
    if (this.locale === locale) return
    this.locale = locale
    saveLocale(locale)
    applyDocumentLocale(locale)
  }

  t(key: string, params?: TranslationParams) {
    return translate(this.locale, key, params)
  }

  has(key: string) {
    return typeof readPath(LOCALES[this.locale], key) === 'string'
  }
}

export const i18nStore = new I18nStore()

export function t(key: string, params?: TranslationParams) {
  return i18nStore.t(key, params)
}
