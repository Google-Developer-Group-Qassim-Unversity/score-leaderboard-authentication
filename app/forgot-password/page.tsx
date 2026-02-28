'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getValidatedRedirectUrl } from '@/lib/redirect-storage'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/client'
import { LanguageSwitcher } from '@/components/language-switcher'
import { BackButton } from '@/components/back-button'

const RESEND_COOLDOWN_SECONDS = 60

// Step 1: University ID schema factory
const createUniversityIdSchema = (t: any) => z.object({
  universityId: z.string()
    .min(9, t('validation.universityId.mustBe9Digits'))
    .max(9, t('validation.universityId.mustBe9Digits'))
    .regex(/^\d{9}$/, t('validation.universityId.exactly9Digits')),
})

// Step 3: New password schema factory
const createNewPasswordSchema = (t: any) => z.object({
  password: z.string()
    .min(8, t('validation.password.minLength')),
})

type UniversityIdFormValues = z.infer<ReturnType<typeof createUniversityIdSchema>>
type NewPasswordFormValues = z.infer<ReturnType<typeof createNewPasswordSchema>>

type Step = 'university-id' | 'verification' | 'new-password'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function ForgotPasswordContent() {
  const { t } = useTranslation()
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [step, setStep] = React.useState<Step>('university-id')
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Verification code state
  const [verificationCode, setVerificationCode] = React.useState('')
  const [codeError, setCodeError] = React.useState(false)
  const [resendCooldown, setResendCooldown] = React.useState(0)
  const [resending, setResending] = React.useState(false)

  // Create schemas with current translation function
  const universityIdSchema = React.useMemo(() => createUniversityIdSchema(t), [t])
  const newPasswordSchema = React.useMemo(() => createNewPasswordSchema(t), [t])

  // Forms
  const universityIdForm = useForm<UniversityIdFormValues>({
    resolver: zodResolver(universityIdSchema),
    defaultValues: {
      universityId: '',
    },
  })

  const newPasswordForm = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
    },
  })

  // Redirect if already signed in
  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/user-profile')
    }
  }, [isLoaded, isSignedIn, router])

  // Countdown timer for resend button
  React.useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const canResend = resendCooldown <= 0

  // Step 1: Send password reset code
  const onSubmitUniversityId = async (data: UniversityIdFormValues) => {
    setError('')
    if (!isLoaded) return
    setLoading(true)

    const emailAddress = `${data.universityId}@qu.edu.sa`
    setEmail(emailAddress)

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      })

      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('verification')
    } catch (err: any) {
      console.error('Reset password error:', err)
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError(t('auth.forgotPassword.step1.error.noAccount'))
      } else {
        setError(err.errors?.[0]?.longMessage || t('auth.forgotPassword.step1.error.unexpected'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend verification code
  const handleResendCode = async () => {
    if (!canResend || resending || !isLoaded) return

    setResending(true)
    setError('')

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.errors?.[0]?.message || t('auth.forgotPassword.step2.error.resendFailed'))
    } finally {
      setResending(false)
    }
  }

  // Step 2: Verify code and move to password step
  const onSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (verificationCode.length !== 6) {
      setError(t('validation.verificationCode.invalid'))
      return
    }

    // Just move to the next step - actual verification happens when setting password
    setStep('new-password')
  }

  // Step 3: Reset password with code
  const onSubmitNewPassword = async (data: NewPasswordFormValues) => {
    setError('')
    if (!isLoaded) return
    setLoading(true)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode,
        password: data.password,
      })

      if (result.status === 'needs_second_factor') {
        // Handle 2FA if needed - for now show error
        setError(t('auth.forgotPassword.step2.error.2faRequired'))
      } else if (result.status === 'complete') {
        // Password reset successful - set active session and redirect
        if (setActive && result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
          // Navigate to user-profile, let middleware handle redirect from localStorage
          router.push('/user-profile')
        }
      } else {
        console.log('Unexpected result:', result)
        setError(t('auth.forgotPassword.step3.error.resetFailed'))
      }
    } catch (err: any) {
      console.error('Password reset error:', JSON.stringify(err, null, 2))
      if (err.clerkError) {
        console.log('got Clerk error code:', err.code)
        if (err?.errors[0]?.code.includes('form_code_incorrect')) {
          setError(err.errors?.[0]?.longMessage)
          setCodeError(true)
          setStep('verification')
          return
        }
      }
      setError(err.errors?.[0]?.longMessage || t('auth.forgotPassword.step3.error.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    setError('')
    if (step === 'verification') {
      setVerificationCode('')
      setStep('university-id')
    } else if (step === 'new-password') {
      setStep('verification')
    }
  }

  if (!isLoaded || (isLoaded && isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  // Step 1: University ID Input
  if (step === 'university-id') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 left-4">
          <BackButton />
        </div>
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPassword.step1.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.forgotPassword.step1.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...universityIdForm}>
              <form onSubmit={universityIdForm.handleSubmit(onSubmitUniversityId)} className="space-y-4">
                <FormField
                  control={universityIdForm.control}
                  name="universityId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t('auth.forgotPassword.step1.universityId')}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center rounded-md border ${fieldState.error ? 'border-destructive' : 'border-input'} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder={t('auth.forgotPassword.step1.placeholder')}
                            autoComplete="username"
                            maxLength={9}
                            className="border-0 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                            disabled={loading}
                          />
                          <span className="inline-flex items-center px-3 h-10 bg-background text-muted-foreground text-sm border-l border-input rounded-r-md">
                            @qu.edu.sa
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.forgotPassword.step1.sending')}
                    </>
                  ) : (
                    t('auth.forgotPassword.step1.submit')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              {t('auth.forgotPassword.step1.footer.text')}{' '}
              <Link href="/sign-in" className="text-primary hover:underline">
                {t('auth.forgotPassword.step1.footer.link')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 2: Verification Code
  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 left-4">
          <BackButton />
        </div>
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPassword.step2.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.forgotPassword.step2.description', { email })}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={onSubmitVerification} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">{t('auth.forgotPassword.step2.verificationCode')}</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t('auth.forgotPassword.step2.placeholder')}
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setVerificationCode(value)
                    setCodeError(false)
                  }}
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  className={`text-center text-lg tracking-widest font-mono ${codeError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <div className="flex justify-center pt-1">
                  {canResend ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={resending}
                      className="text-sm h-auto p-0"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          {t('auth.forgotPassword.step2.resending')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 h-3 w-3" />
                          {t('auth.forgotPassword.step2.resend')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('auth.forgotPassword.step2.resendCountdown', { countdown: resendCooldown })}
                    </span>
                  )}
                </div>
                <div className="flex justify-center pt-2">
                  <a
                    href="https://outlook.office.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>{t('auth.forgotPassword.step2.goToOutlook')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {t('auth.forgotPassword.step2.continue')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  {t('auth.forgotPassword.step2.back')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: New Password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 left-4">
        <BackButton />
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPassword.step3.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.forgotPassword.step3.description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...newPasswordForm}>
            <form onSubmit={newPasswordForm.handleSubmit(onSubmitNewPassword)} className="space-y-4">
              <FormField
                control={newPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.forgotPassword.step3.newPassword')}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={t('auth.forgotPassword.step3.placeholder')}
                        autoComplete="new-password"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.forgotPassword.step3.resetting')}
                    </>
                  ) : (
                    t('auth.forgotPassword.step3.submit')
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  {t('auth.forgotPassword.step3.back')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
