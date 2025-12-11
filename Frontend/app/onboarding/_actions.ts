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
