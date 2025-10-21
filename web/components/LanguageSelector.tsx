import { useState, useEffect } from 'preact/hooks'
import { useLanguage, type Language } from '../helpers'

const LANGUAGE_FLAGS = {
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  en: '🇺🇸',
} as const

const LANGUAGE_LABELS = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
} as const

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.language-selector')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div
      className="language-selector"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <span style={{ fontSize: '16px' }}>{LANGUAGE_FLAGS[language]}</span>
        <span>{LANGUAGE_LABELS[language]}</span>
        <span
          style={{
            fontSize: '12px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '4px',
            minWidth: '160px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background:
                  language === lang.code
                    ? 'rgba(24, 33, 57, 0.1)'
                    : 'transparent',
                color: language === lang.code ? 'rgb(24, 33, 57)' : '#333',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                fontWeight: language === lang.code ? '600' : '400',
              }}
              onMouseEnter={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'rgba(24, 33, 57, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {LANGUAGE_FLAGS[lang.code]}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <span>{lang.nativeName}</span>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  {lang.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
