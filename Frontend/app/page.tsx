import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function RootPage() {
  const { userId, sessionClaims } = await auth()

  // Redirect unauthenticated users to sign-up
  if (!userId) {
    redirect('/sign-up')
  }

  // Redirect authenticated but not onboarded users to onboarding
  if (!sessionClaims?.metadata?.onboardingComplete) {
    redirect('/onboarding')
  }

  // Redirect authenticated and onboarded users to user-profile page
  redirect('/user-profile')
}
