'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { updateUserMetadata} from './_actions'
import { isAllowedRedirectUrl } from '@/lib/redirect-config'
import { saveRedirectUrl, getValidatedRedirectUrl } from '@/lib/redirect-storage'
import { UserAccountCard } from '@/components/user-account-card'
import { createMember } from '@/lib/api'
import { useTranslation } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'
const API_BASE_URL = process.env.NEXT_PUBLIC_DEV_HOST || process.env.NEXT_PUBLIC_HOST
import { OnboardingForm, type OnboardingFormValues } from '@/components/onboarding-form'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = React.useState('')
  const { t } = useTranslation()

  // Extract uni_id from user's email
  const extractUniIdFromEmail = (email: string | undefined): string => {
    if (!email) return ''
    const localPart = email.split('@')[0]
    return localPart
  }

  const uniId = extractUniIdFromEmail(user?.primaryEmailAddress?.emailAddress)

  // Capture redirect_url from URL and save to localStorage
  React.useEffect(() => {
    const redirectUrl = searchParams.get('redirect_url')
    if (redirectUrl) {
      saveRedirectUrl(redirectUrl)
    }
  }, [searchParams])

  const handleSubmit = async (data: OnboardingFormValues) => {
    setError('')

    try {
      // Step 1: Update Clerk JWT metadata with the form data
      const result = await updateUserMetadata({...data, onboardingComplete: true })
      

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {

        // Step 2: Create member in backend DB.
        await user?.reload() // around 300ms delay to ensure metadata is updated
        const memberCreated = await createMember()
        if (!memberCreated) {
          console.log('⚠️ Skipping member creation in backend!')
          console.log(`request was made to: ${process.env.NEXT_PUBLIC_HOST}/members`)
          console.log(`member data: ${user?.publicMetadata.fullArabicName}`)
          console.log(`member data: ${user?.publicMetadata.saudiPhone}`)
          console.log(`member data: ${user?.publicMetadata.gender}`)
          console.log(`member data: ${user?.publicMetadata.uniLevel}`)
          console.log(`member data: ${user?.publicMetadata.uniCollege}`)
          console.log(`member data: ${user?.publicMetadata.personalEmail}`)
        }

        // Step 3: Trigger navigation to let middleware handle redirect
        // Middleware will read redirect_url from localStorage and redirect appropriately
        router.push('/user-profile')
        console.log('✅ Onboarding complete, navigating to user-profile')
      } else {
        setError('Unexpected response from server. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/* Clerk User Button for account management */}
          <UserAccountCard />
          
          <CardTitle className="text-2xl font-bold">{t('onboarding.title')}</CardTitle>
          <CardDescription>
            {t('onboarding.description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <OnboardingForm uniId={uniId} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
