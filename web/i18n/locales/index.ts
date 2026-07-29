import { en } from './en'
import { zhCN } from './zh-CN'
import { zhTW } from './zh-TW'
import { Locale, TranslationTree } from '../types'

export const LOCALES: Record<Locale, TranslationTree> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en,
}
