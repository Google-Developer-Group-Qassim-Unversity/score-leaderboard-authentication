'use client'

import * as React from 'react'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { isAllowedRedirectUrl } from '@/lib/redirect-config'

const signInSchema = z.object({
  emailAddress: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormValues = z.infer<typeof signInSchema>

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isSignedIn } = useAuth() 
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [needsSecondFactor, setNeedsSecondFactor] = React.useState(false)
  const [verificationCode, setVerificationCode] = React.useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      emailAddress: '',
      password: '',
    },
  })

  // Auto-redirect if already signed in
  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      const redirectUrl = searchParams.get('redirect_url')
      if (redirectUrl) {
         window.location.href = redirectUrl
      } else {
         router.push('/user-profile')
      }
    }
  }, [isLoaded, isSignedIn, searchParams, router])

  const handleComplete = async (sessionId: string) => {
    // FIX 1: Guard clause for setActive
    if (!setActive) {
      return;
    }

    try {
      await setActive({ session: sessionId })
      
      const redirectUrl = searchParams.get('redirect_url')
      console.log("Attempting redirect to:", redirectUrl);
      
      if (redirectUrl && isAllowedRedirectUrl(redirectUrl)) {
        window.location.href = redirectUrl
      } else {
        if (redirectUrl) console.warn("Redirect URL blocked by AllowList:", redirectUrl);
        router.push('/user-profile')
      }
    } catch (err) {
      console.error("Error setting active session:", err);
      window.location.reload();
    }
  }

  const onSubmit = async (data: SignInFormValues) => {
    setError('')
    if (!isLoaded) return
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: data.emailAddress,
        password: data.password,
      })

      if (result.status === 'complete') {
        // FIX 2: Ensure session ID exists before calling handleComplete
        if (!result.createdSessionId) {
            console.error("Session complete but no ID returned")
            setError('Error creating session.')
            return
        }
        await handleComplete(result.createdSessionId)
      } else if (result.status === 'needs_second_factor') {
        const emailAddressId = result.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code'
        )?.emailAddressId

        if (!emailAddressId) {
          setError('Unable to send verification code.')
          return
        }

        await signIn.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: emailAddressId,
        })
        setNeedsSecondFactor(true)
      } else {
        setError('Unable to complete sign in.')
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      if (err.errors?.[0]?.code === 'form_password_incorrect' || 
          err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('Invalid email or password')
      } else {
        setError(err.errors?.[0]?.longMessage || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const onVerifySecondFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isLoaded || !verificationCode) return
    setLoading(true)

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: verificationCode,
      })

      if (result.status === 'complete') {
        // FIX 3: Ensure session ID exists here too
        if (!result.createdSessionId) {
            console.error("Session complete but no ID returned")
            setError('Error creating session.')
            return
        }
        await handleComplete(result.createdSessionId)
      } else {
        setError('Verification failed.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || 'Invalid verification code')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your GDG account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!needsSecondFactor ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="442106350@qu.edu.sa"
                          {...field}
                          disabled={loading}
                        />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <form onSubmit={onVerifySecondFactor} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  A verification code has been sent to your email. Please enter it below to complete sign-in.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !verificationCode}>
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
                onClick={() => {
                  setNeedsSecondFactor(false)
                  setVerificationCode('')
                  setError('')
                }}
                disabled={loading}
              >
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href={searchParams.get('redirect_url') 
                ? `/sign-up?redirect_url=${encodeURIComponent(searchParams.get('redirect_url')!)}` 
                : '/sign-up'
              } 
              className="text-primary hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}