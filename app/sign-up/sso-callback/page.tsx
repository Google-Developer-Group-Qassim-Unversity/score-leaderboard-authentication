'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      // A returning user clicking "Continue with Google" on the sign-up
      // page gets silently transferred by Clerk into a sign-in attempt
      // (an account already exists for that email). Without a sign-in
      // fallback here, that transfer has nowhere to complete.
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      continueSignUpUrl="/sign-up"
    />
  )
}
