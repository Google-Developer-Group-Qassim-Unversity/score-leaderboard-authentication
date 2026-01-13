import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define allowed routes
const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/forgot-password(.*)'])
const isUserProfileRoute = createRouteMatcher(['/user-profile'])
const isRootRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Handle root route
  if (isRootRoute(req)) {
    if (!userId) {
      // Redirect unauthenticated users to sign-up
      return NextResponse.redirect(new URL('/sign-up', req.url))
    }
    
    if (!sessionClaims?.metadata?.onboardingComplete) {
      // Redirect authenticated but not onboarded users to onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    
    // Redirect authenticated and onboarded users to user-profile page
    return NextResponse.redirect(new URL('/user-profile', req.url))
  }

  // Allow auth routes for everyone
  if (isAuthRoute(req)) {
    return NextResponse.next()
  }

  // Allow onboarding route for authenticated users
  if (isOnboardingRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-up', req.url))
    }
    return NextResponse.next()
  }

  // Allow user-profile route only for authenticated users who completed onboarding
  if (isUserProfileRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-up', req.url))
    }
    
    if (!sessionClaims?.metadata?.onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    
    return NextResponse.next()
  }

  // Block all other routes - redirect to appropriate page
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  
  if (!sessionClaims?.metadata?.onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }
  
  return NextResponse.redirect(new URL('/user-profile', req.url))
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}