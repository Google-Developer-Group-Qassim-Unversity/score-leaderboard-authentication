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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const RESEND_COOLDOWN_SECONDS = 60

// Step 1: University ID schema
const universityIdSchema = z.object({
  universityId: z.string()
    .min(9, 'University ID must be 9 digits')
    .max(9, 'University ID must be 9 digits')
    .regex(/^\d{9}$/, 'University ID must be exactly 9 digits'),
})

// Step 3: New password schema
const newPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
})

type UniversityIdFormValues = z.infer<typeof universityIdSchema>
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>

type Step = 'university-id' | 'verification' | 'new-password'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function ForgotPasswordContent() {
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
        setError('No account found with this University ID')
      } else {
        setError(err.errors?.[0]?.longMessage || 'An unexpected error occurred.')
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
      setError(err.errors?.[0]?.message || 'Failed to resend verification code')
    } finally {
      setResending(false)
    }
  }

  // Step 2: Verify code and move to password step
  const onSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
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
        setError('Two-factor authentication is required. Please contact support.')
      } else if (result.status === 'complete') {
        // Password reset successful - set active session and redirect
        if (setActive && result.createdSessionId) {
          await setActive({ session: result.createdSessionId })
          router.push('/user-profile')
        }
      } else {
        console.log('Unexpected result:', result)
        setError('Unable to reset password. Please try again.')
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
      setError(err.errors?.[0]?.longMessage || 'An unexpected error occurred. Please try again or contact support.')
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
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // Step 1: University ID Input
  if (step === 'university-id') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
            <CardDescription className="text-center">
              Enter your University ID to receive a password reset code
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
                      <FormLabel>University ID</FormLabel>
                      <FormControl>
                        <div className={`flex items-center rounded-md border ${fieldState.error ? 'border-destructive' : 'border-input'} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="442106350"
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
                      Sending Code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign In
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Enter Reset Code</CardTitle>
            <CardDescription className="text-center">
              We sent a password reset code to <span className="font-medium text-foreground">{email}</span>
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
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
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
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 h-3 w-3" />
                          Resend code
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Resend code in {resendCooldown}s
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || verificationCode.length !== 6}
                >
                  Continue
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password
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
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Enter new password"
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
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
