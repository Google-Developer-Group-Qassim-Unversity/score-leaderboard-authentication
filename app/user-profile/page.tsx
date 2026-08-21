'use client'

import { UserProfile, useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clearRedirectUrl, getValidatedRedirectUrl } from '@/lib/redirect-storage'
import * as React from 'react'
import { useTranslation, useLanguage } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'

const MAIN_APP_URL = 'https://gdg-q.com'

export default function SignedInPage() {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  
  // Check for redirect URL synchronously on first render
  const [redirectUrl] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return getValidatedRedirectUrl()
    }
    return null
  })

  // Perform redirect in useEffect
  React.useEffect(() => {
    if (redirectUrl) {
      console.log('Redirecting to:', redirectUrl)
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

  // Show loading spinner while user loads or while redirecting
  if (!isLoaded || redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get the full Arabic name from metadata
  const fullArabicName = user?.publicMetadata?.fullArabicName as string | undefined

  const handleSignOut = async () => {
    clearRedirectUrl()
    await signOut()
    router.push('/sign-in')
  }

  const SignOutIcon = () => (
    <LogOut className="w-4 h-4" />
  )

  const SignOutPage = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">{t('profile.signOutTitle')}</h2>
          <p className="text-slate-600 max-w-md">
            {t('profile.signOutDescription')}
          </p>
        </div>
        <Button 
          onClick={handleSignOut}
          variant="outline"
          size="lg"
          className="w-full max-w-xs"
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t('profile.signOutButton')}
        </Button>
      </div>
    )
  }

  const displayName = fullArabicName || t('profile.userCard.defaultName')
  const initial = (fullArabicName || user?.primaryEmailAddress?.emailAddress || '?').trim().charAt(0).toUpperCase()
  const GoArrow = isRTL ? ArrowLeft : ArrowRight

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <Card className="border-border/60">
          <CardContent className="flex flex-col sm:flex-row items-center gap-5 py-2">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover ring-1 ring-border shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold shrink-0">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0 text-center sm:text-start">
              <h1 className="text-xl font-semibold truncate">
                {fullArabicName ? t('profile.titleWithName', { name: fullArabicName }) : t('profile.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t('profile.description')}</p>
            </div>

            <Button asChild size="lg" className="shrink-0 w-full sm:w-auto">
              <a href={MAIN_APP_URL}>
                {t('profile.goToMainApp')}
                <GoArrow className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* User Profile Component */}
        <div className="w-full flex justify-center">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-sm rounded-2xl border border-border/60",
              }
            }}
          >
            <UserProfile.Page
              label={t('profile.signOutTab')}
              labelIcon={<SignOutIcon />}
              url="sign-out"
            >
              <SignOutPage />
            </UserProfile.Page>
          </UserProfile>
        </div>
      </div>
    </div>
  )
}
