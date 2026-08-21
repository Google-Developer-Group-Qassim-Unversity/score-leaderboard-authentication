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
    uni_id: number | null
    gender: "Male" | "Female"
    uni_level: number
    uni_college: string
  }
  already_exists: boolean
}

export interface MemberPointsResponse {
  member: {
    member_id: number
    member_name: string
    total_points: number | null
  }
}

export async function getMemberPoints(memberId: number): Promise<MemberPointsResponse | null> {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    console.error('[getMemberPoints] ❌ Failed to retrieve auth token')
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/points/members/${memberId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn(`[getMemberPoints] ⚠️ ${response.status}: ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to fetch member points:`, error)
    return null
  }
}

export type CreateMemberResult =
  | { ok: true; data: CreateMemberResponse }
  | { ok: false; status: number | null }

export async function createMember(): Promise<CreateMemberResult> {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    console.error('[createMember] ❌ Failed to retrieve auth token')
    return { ok: false, status: null }
  }

  try {
    console.log(`[createMember] 🔍 Creating member from JWT token...`)

    const response = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn(`[createMember] ⚠️ Failed to create member ${response.status}: ${response.statusText}`)
      return { ok: false, status: response.status }
    }

    const data: CreateMemberResponse = await response.json()
    console.log(`✅ Successfully created member ${data.member.id}\n${JSON.stringify(data)}`)
    return { ok: true, data }

  } catch (error) {
    console.error(`❌ Failed to create member:`, error)
    return { ok: false, status: null }
  }
}


