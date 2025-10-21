import { createContext } from 'preact'
import { useContext, useState } from 'preact/hooks'
import { ComponentChildren } from 'preact'

// Import translation files directly
import enTranslations from '../../public/locales/en.json'
import zhCNTranslations from '../../public/locales/zh-CN.json'
import zhTWTranslations from '../../public/locales/zh-TW.json'

// Language type definitions
export type Language = 'zh-CN' | 'zh-TW' | 'en'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  languages: { code: Language; name: string; nativeName: string }[]
}

// Available languages
export const AVAILABLE_LANGUAGES = [
  { code: 'zh-CN' as Language, name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW' as Language, name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
]

// Language context
export const LanguageContext = createContext<LanguageContextType | null>(null)

// Static translations object
const translations: Record<Language, any> = {
  'en': enTranslations,
  'zh-CN': zhCNTranslations,
  'zh-TW': zhTWTranslations,
}

// Translation function
function translate(
  translations: any,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.')
  let value = translations

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Replace parameters in the translation
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match
    })
  }

  return value
}

// Get browser language
function getBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'
  
  if (browserLang.startsWith('zh')) {
    // Detect Traditional Chinese regions
    const traditionalRegions = ['TW', 'HK', 'MO']
    const region = browserLang.split('-')[1]?.toUpperCase()
    
    if (region && traditionalRegions.includes(region)) {
      return 'zh-TW'
    }
    return 'zh-CN'
  }
  
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  
  return 'zh-CN' // Default fallback
}

// Get stored language
function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem('cloudflare-drop-language')
    if (stored && AVAILABLE_LANGUAGES.some(lang => lang.code === stored)) {
      return stored as Language
    }
  } catch (error) {
    console.error('Error reading stored language:', error)
  }
  return null
}

// Store language
function storeLanguage(language: Language): void {
  try {
    localStorage.setItem('cloudflare-drop-language', language)
  } catch (error) {
    console.error('Error storing language:', error)
  }
}

// Language provider hook
export function useLanguageProvider() {
  const [language, setLanguageState] = useState<Language>(() => {
    return getStoredLanguage() || getBrowserLanguage()
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    storeLanguage(lang)
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    const currentTranslations = translations[language as keyof typeof translations] || translations['en']
    return translate(currentTranslations, key, params)
  }

  return {
    language,
    setLanguage,
    t,
    languages: AVAILABLE_LANGUAGES,
  }
}

// Language Provider component
export function LanguageProvider({ children }: { children: ComponentChildren }) {
  const languageValue = useLanguageProvider()

  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
