'use client'

import { UserProfile, UserButton, useUser, useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignedInPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get the full Arabic name from metadata
  const fullArabicName = user?.publicMetadata?.fullArabicName as string | undefined

  const handleSignOut = async () => {
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
          <h2 className="text-2xl font-bold text-slate-900">Sign Out</h2>
          <p className="text-slate-600 max-w-md">
            Are you sure you want to sign out
          </p>
        </div>
        <Button 
          onClick={handleSignOut}
          variant="outline"
          size="lg"
          className="w-full max-w-xs"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl space-y-8 flex flex-col items-center">
        {/* Welcome Message Card */}
        <Card className="w-full bg-gradient-to-br from-green-50/50 to-white rounded-2xl shadow-lg border border-slate-200">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {fullArabicName ? `حياك، ${fullArabicName}` : 'Welcome!'}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              تم تسجيل دخولك بنجاح تقدر تتحكم بحسابك من هنا
            </CardDescription>
          </CardHeader>
        </Card>

        {/* User Profile Component */}
        <div className="w-full flex justify-center">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-xl rounded-2xl border border-slate-200",
              }
            }}
          >
            <UserProfile.Page 
              label="sign-out" 
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
