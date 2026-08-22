'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      // A first-time Google user clicking "Continue with Google" on the
      // sign-in page gets silently transferred by Clerk into a sign-up
      // attempt (no existing account to sign in to). Without a sign-up
      // fallback here, that transfer has nowhere to complete and the
      // callback fails - exactly when there's only one Google account and
      // no account-picker interaction to "save" it with extra round trips.
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      continueSignUpUrl="/sign-up"
    />
  )
}
