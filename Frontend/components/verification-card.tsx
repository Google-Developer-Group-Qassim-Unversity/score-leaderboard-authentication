'use client'

import * as React from 'react'
import { useSignUp, useSignIn } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

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
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Get email from Clerk based on type
  const email = type === 'sign-up' 
    ? signUp?.emailAddress 
    : signIn?.identifier

  const title = type === 'sign-up' ? 'Verify Your Email' : 'Two-Factor Authentication'
  const backButtonText = type === 'sign-up' ? 'Back to Sign Up' : 'Back to Sign In'

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
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || err.errors?.[0]?.longMessage || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setVerificationCode('')
    setError('')
    onBack()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification code to{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Please enter it below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="verificationCode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={loading}
                maxLength={6}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest"
              />
            </div>

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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
