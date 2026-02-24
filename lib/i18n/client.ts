'use client'

import { useTranslation as useTranslationOriginal } from 'react-i18next'
import type { Language } from './translation'

export function useTranslation() {
  return useTranslationOriginal()
}

export function useLanguage() {
  const { i18n } = useTranslationOriginal()
  
  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang)
    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
  }
  
  return {
    language: i18n.language as Language,
    changeLanguage,
    isRTL: i18n.language === 'ar',
  }
}
