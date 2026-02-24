'use client'

import { useLanguage } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import type { Language } from '@/lib/i18n/translation'

export function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage()

  const toggleLanguage = () => {
    const newLang: Language = language === 'ar' ? 'en' : 'ar'
    changeLanguage(newLang)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === 'ar' ? 'English' : 'العربية'}
    </Button>
  )
}
