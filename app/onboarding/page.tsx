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
import { createMember, getMemberPoints } from '@/lib/api'
import { useTranslation } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'
const API_BASE_URL = process.env.NEXT_PUBLIC_DEV_HOST || process.env.NEXT_PUBLIC_HOST
import { OnboardingForm, type OnboardingFormValues } from '@/components/onboarding-form'
import { WelcomeBackDialog } from '@/components/welcome-back-dialog'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = React.useState('')
  const [welcomeBackPoints, setWelcomeBackPoints] = React.useState<number | null>(null)
  const [showWelcomeBack, setShowWelcomeBack] = React.useState(false)
  const { t } = useTranslation()

  // Extract uni_id from the QU-issued email (e.g. 442106350@qu.edu.sa).
  // Only applies to uni_id/password signups - a Google account's email
  // (e.g. name@gmail.com) must never be mistaken for a uni_id.
  const extractUniIdFromEmail = (email: string | undefined): string => {
    if (!email) return ''
    const match = email.match(/^(\d{9})@qu\.edu\.sa$/i)
    return match ? match[1] : ''
  }

  const uniId = extractUniIdFromEmail(user?.primaryEmailAddress?.emailAddress)

  // For Google sign-ups (no uni_id), the Google account's email IS a real personal
  // email already - use it directly instead of asking the member to type one.
  const googleEmail = !uniId ? user?.primaryEmailAddress?.emailAddress || '' : ''

  // Capture redirect_url from URL and save to localStorage
  React.useEffect(() => {
    const redirectUrl = searchParams.get('redirect_url')
    if (redirectUrl) {
      saveRedirectUrl(redirectUrl)
    }
  }, [searchParams])

  // Creates a fresh member row in the backend and navigates on to /user-profile.
  // If the backend auto-linked an existing (admin-created) record by email, show
  // a "welcome back" dialog with their existing points before moving on.
  const finishAsNewMember = async () => {
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
      router.push('/user-profile')
      return
    }

    if (memberCreated.already_exists) {
      const points = await getMemberPoints(memberCreated.member.id)
      setWelcomeBackPoints(points?.member.total_points ?? null)
      setShowWelcomeBack(true)
      return
    }

    // Trigger navigation to let middleware handle redirect.
    // Middleware will read redirect_url from localStorage and redirect appropriately
    router.push('/user-profile')
    console.log('✅ Onboarding complete, navigating to user-profile')
  }

  const handleWelcomeBackContinue = () => {
    setShowWelcomeBack(false)
    router.push('/user-profile')
  }

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
        await user?.reload() // around 300ms delay to ensure metadata is updated

        // Step 2: Create member in backend DB. If an admin-created record already
        // exists with this Clerk-verified email, the backend folds it in automatically.
        await finishAsNewMember()
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

          <OnboardingForm uniId={uniId} lockedPersonalEmail={googleEmail} onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      <WelcomeBackDialog
        open={showWelcomeBack}
        points={welcomeBackPoints}
        onContinue={handleWelcomeBackContinue}
      />
    </div>
  )
}
