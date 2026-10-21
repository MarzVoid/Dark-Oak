import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('dark_oak_language') || 'ru'
  })

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang)
      localStorage.setItem('dark_oak_language', lang)
    }
  }

  const t = (path) => {
    if (!path) return ''
    const keys = path.split('.')
    let current = translations[language] || translations.ru

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        let fallback = translations.ru
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey]
          } else {
            return path
          }
        }
        return fallback
      }
    }

    return typeof current === 'string' ? current : path
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
