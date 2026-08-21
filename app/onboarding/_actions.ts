'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return { error: 'Not authenticated' }
  }

  const client = await clerkClient()
  
  // Update Clerk public metadata
  try {
    await client.users.updateUser(userId, {
      publicMetadata: metadata,
    })


    if (process.env.NODE_ENV === 'development') {
      const user = await client.users.getUser(userId);
      const metadata = user.publicMetadata;
      console.log('✅ Successfully updated user metadata:', metadata)
    }

    return { success: true }
  } catch (err) {
    console.error('Error updating user metadata:', err)
    return { error: 'There was an error updating you data, please try again later' }
  }
}

// Links a uni_id account's typed personal email to Clerk as a verified
// secondary email. This is what lets Clerk's native account linking kick in:
// if the real owner of that email later signs up with Google, Clerk merges
// them into this account automatically instead of creating a duplicate.
//
// `verified: true` is a deliberate trust decision - we're vouching for an
// unverified, self-typed email with no OTP round-trip. Only ever applied to
// uni_id/password accounts (never Google accounts, which already own their
// primary email outright), and always best-effort: failures here must never
// block onboarding, since this only accelerates a linking optimization -
// the original manual-merge path still exists if it doesn't happen.
export async function addVerifiedPersonalEmail(personalEmail: string) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return { error: 'Not authenticated' }
  }

  const client = await clerkClient()

  try {
    const user = await client.users.getUser(userId)
    const primaryEmail = user.primaryEmailAddress?.emailAddress

    const isUniIdAccount = !!primaryEmail?.match(/^\d{9}@qu\.edu\.sa$/i)
    if (!isUniIdAccount) {
      return { success: true, skipped: 'not-a-uni-id-account' }
    }

    if (!personalEmail || personalEmail.toLowerCase() === primaryEmail?.toLowerCase()) {
      return { success: true, skipped: 'no-personal-email' }
    }

    const alreadyLinked = user.emailAddresses.some(
      (e) => e.emailAddress.toLowerCase() === personalEmail.toLowerCase()
    )
    if (alreadyLinked) {
      return { success: true, skipped: 'already-linked' }
    }

    await client.emailAddresses.createEmailAddress({
      userId,
      emailAddress: personalEmail,
      verified: true,
      primary: false,
    })

    return { success: true }
  } catch (err) {
    console.error('Error linking verified personal email:', err)
    return { error: 'Failed to link personal email' }
  }
}
