'use client'

import * as React from 'react'
import { useState, Suspense } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { set, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { VerificationCard } from '@/components/verification-card'
import { saveRedirectUrl } from '@/lib/redirect-storage'
import { AlertCircle, Loader2, UserPlus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'
import { GoogleIcon } from '@/components/icons/google-icon'

// Schema will be created inside component to access t function
const createSignUpSchema = (t: (key: string) => string) => z.object({
  universityId: z
    .string()
    .min(9, t('validation.universityId.mustBe9Digits'))
    .max(9, t('validation.universityId.mustBe9Digits'))
    .regex(/^\d{9}$/, t('validation.universityId.exactly9Digits')),
  password: z
    .string()
    .min(8, t('validation.password.minLength')),
})

type SignUpFormValues = {
  universityId: string
  password: string
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}

function SignUpContent() {
  const { t } = useTranslation()
  const { isLoaded, signUp, setActive } = useSignUp()
  const [pendingVerification, setPendingVerification] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const signUpSchema = React.useMemo(() => createSignUpSchema(t), [t])

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      universityId: '',
      password: '',
    },
  })

  // Capture redirect_url from URL and save to localStorage
  React.useEffect(() => {
    const redirectUrl = searchParams.get('redirect_url')
    if (redirectUrl) {
      saveRedirectUrl(redirectUrl)
    }
  }, [searchParams])

  // Handle submission of the sign-up form
  const handleSignUp = async (data: SignUpFormValues) => {
    if (!isLoaded) return

    setError('')
    setLoading(true)

    const emailAddress = `${data.universityId}@qu.edu.sa`

    try {
      // Start the sign-up process using the email and password provided
      await signUp.create({
        emailAddress: emailAddress,
        password: data.password,
      })

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })

      // Set 'pendingVerification' true to display verification view
      setPendingVerification(true)
    } catch (err: any) {

      console.error('Sign-up error:', JSON.stringify(err, null, 2))
      if (err.clerkError) {
        console.log('got Clerk error code:', err.code)
        if (err?.errors[0]?.message.includes('That email address is taken')) {
          setError(t('auth.signUp.error.emailExists'))
          return
        }
        setError(err.errors?.[0]?.message)
      } else {
        setError(t('auth.signUp.error.unexpected'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle successful verification
  const handleVerificationSuccess = async (sessionId: string) => {
    if (!setActive) return
    
    await setActive({
      session: sessionId,
      navigate: async ({ session }) => {
        if (session?.currentTask) {
          console.log('Session task detected:', session.currentTask)
          router.push('/sign-up/tasks')
          return
        }

        router.push('/onboarding')
      },
    })
  }

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return
    setError('')
    setGoogleLoading(true)
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-up/sso-callback',
        redirectUrlComplete: '/onboarding',
      })
    } catch (err) {
      console.error('Google sign-up error:', err)
      setError(t('auth.signUp.error.googleUnexpected'))
      setGoogleLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  // Show verification view
  if (pendingVerification) {
    return (
      <VerificationCard
        type="sign-up"
        onSuccess={handleVerificationSuccess}
        onBack={() => setPendingVerification(false)}
      />
    )
  }

  // Show sign-up form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-t-4 border-t-green-600">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img
              src="/GDG.svg"
              alt="GDG Logo"
              width={100}
              height={100}
            />
          </div>
          <div className="flex justify-center mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {t('auth.signUp.badge')}
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.signUp.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.signUp.description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignUp}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {t('auth.signUp.continueWithGoogle')}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.signUp.orContinueWith')}
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4" autoComplete="on">
              <FormField
                control={form.control}
                name="universityId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('auth.signUp.universityId')}</FormLabel>
                    <FormControl>
                      <div className={`flex items-center rounded-md border ${fieldState.error ? 'border-destructive' : 'border-input'} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder={t('auth.signUp.universityIdPlaceholder')}
                          autoComplete="username"
                          maxLength={9}
                          className="border-0 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          disabled={loading || googleLoading}
                          {...field}
                        />
                        <span className="inline-flex items-center px-3 h-10 bg-background text-muted-foreground text-sm border-l border-input rounded-r-md">
                          {t('auth.signUp.emailSuffix')}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.signUp.password')}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t('auth.signUp.passwordPlaceholder')}
                        autoComplete="new-password"
                        disabled={loading || googleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clerk CAPTCHA - Only shows when suspicious activity is detected */}
              <div id="clerk-captcha" />

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading || googleLoading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signUp.creating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('auth.signUp.submit')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {t('auth.signUp.footer.text')}{' '}
            <Link 
              href="/sign-in" 
              className="text-primary hover:underline"
            >
              {t('auth.signUp.footer.link')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
