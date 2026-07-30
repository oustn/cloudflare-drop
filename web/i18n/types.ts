export { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './config'

export type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>

export type TranslationValue = string | TranslationTree

export interface TranslationTree {
  [key: string]: TranslationValue
}
