'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search } from "lucide-react"
import { useTranslation } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function NotFound() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t('notFound.title')}</CardTitle>
            <CardDescription>{t('notFound.description')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                {t('notFound.backButton')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
