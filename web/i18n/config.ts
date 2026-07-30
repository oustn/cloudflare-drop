export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'zh-CN'

export const LOCALE_CONFIG = {
  'zh-CN': {
    label: '简体中文',
    shortLabel: '简',
    dayjsLocale: 'zh-cn',
  },
  'zh-TW': {
    label: '繁體中文',
    shortLabel: '繁',
    dayjsLocale: 'zh-tw',
  },
  en: {
    label: 'English',
    shortLabel: 'EN',
    dayjsLocale: 'en',
  },
} as const satisfies Record<
  Locale,
  {
    label: string
    shortLabel: string
    dayjsLocale: string
  }
>
