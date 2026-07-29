export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>

export type TranslationValue = string | TranslationTree

export interface TranslationTree {
  [key: string]: TranslationValue
}
