// API utility functions for auth
'use server'
import { auth } from '@clerk/nextjs/server'
const API_BASE_URL = process.env.NEXT_PUBLIC_DEV_HOST || process.env.NEXT_PUBLIC_HOST

export interface CreateMemberResponse {
  member: {
    id: number
    name: string
    email: string
    phone_number: string
    uni_id: number
    gender: "Male" | "Female"
    uni_level: number
    uni_college: string
  }
  already_exists: boolean
}

export async function createMember(): Promise<CreateMemberResponse | null> {
  const { getToken } = await auth()
  const token = await getToken()
  
  if (!token) {
    console.error('❌ Failed to retrieve auth token')
    return null
  }

  try {
    console.log(`🔍 Creating member from JWT token...`)
    
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn(`⚠️ Skipping member creation ${response.status}: ${response.statusText}`)
      return null
    }

    const data: CreateMemberResponse = await response.json()
    console.log(`✅ Successfully created member ${data.member.id}\n${JSON.stringify(data)}`)
    return data

  } catch (error) {
    console.error(`❌ Failed to create member:`, error)
    return null
  }
}

