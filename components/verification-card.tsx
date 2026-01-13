'use client'

import * as React from 'react'
import { useSignUp, useSignIn } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 60

interface VerificationCardProps {
  type: 'sign-up' | 'sign-in'
  onSuccess: (sessionId: string) => void
  onBack: () => void
}

export function VerificationCard({
  type,
  onSuccess,
  onBack,
}: VerificationCardProps) {
  const { signUp } = useSignUp()
  const { signIn } = useSignIn()
  const [verificationCode, setVerificationCode] = React.useState('')
  const [codeError, setCodeError] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [resendCooldown, setResendCooldown] = React.useState(RESEND_COOLDOWN_SECONDS)
  const [resending, setResending] = React.useState(false)

  // Countdown timer for resend button
  React.useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  // Get email from Clerk based on type
  const email = type === 'sign-up' 
    ? signUp?.emailAddress 
    : signIn?.identifier

  const title = type === 'sign-up' ? 'Verify Your Email' : 'Two-Factor Authentication'
  const backButtonText = type === 'sign-up' ? 'Back to Sign Up' : 'Back to Sign In'

  const canResend = resendCooldown <= 0

  const handleResendCode = async () => {
    if (!canResend || resending) return

    setResending(true)
    setError('')

    try {
      if (type === 'sign-up') {
        if (!signUp) {
          setError('Sign up session not found')
          return
        }
        
        console.log('Resending sign-up verification code to:', email)
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      } else {
        if (!signIn) {
          setError('Sign in session not found')
          return
        }

        console.log('Resending sign-in second factor verification code to:', email)
        await signIn.prepareSecondFactor({ strategy: 'email_code' })
      }
      // Reset cooldown after successful resend
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.errors?.[0]?.message || 'Failed to resend verification code')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit verification code')
        setLoading(false)
        return
      }

      if (type === 'sign-up') {
        if (!signUp) {
          setError('Sign up session not found')
          setLoading(false)
          return
        }

        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode,
        })

        if (result.status === 'complete' && result.createdSessionId) {
          onSuccess(result.createdSessionId)
        } else {
          console.error('Sign-up verification not complete:', result.status)
          setError('Unable to complete verification. Please try again.')
        }
      } else {
        if (!signIn) {
          setError('Sign in session not found')
          setLoading(false)
          return
        }

        const result = await signIn.attemptSecondFactor({
          strategy: 'email_code',
          code: verificationCode,
        })

        if (result.status === 'complete' && result.createdSessionId) {
          onSuccess(result.createdSessionId)
        } else {
          setError('Verification failed. Please try again.')
        }
      }
    } catch (err: any) {
      console.error('verification error:', JSON.stringify(err, null, 2))
      if (err.clerkError) {
        console.log('got Clerk error code:', err.code)
        if (err?.errors[0]?.code.includes('form_code_incorrect')) {
          setError(err.errors?.[0]?.longMessage)
          setCodeError(true)
          return
        }
      }
      setError('An unexpected error occurred. Please try again. or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setVerificationCode('')
    setError('')
    setCodeError(false)
    onBack()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            Enter the code sent to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              disabled={loading}
            >
              {backButtonText}
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
