'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 hover:text-primary transition-colors px-3 h-9 cursor-pointer"
            dir="ltr"
        >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back')}</span>
        </Button>
    )
}
