'use client'

import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/config'
import { useEffect } from 'react'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set initial direction and lang based on i18n language
    const currentLang = i18n.language
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLang
    
    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lng
    }
    
    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])
  
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
