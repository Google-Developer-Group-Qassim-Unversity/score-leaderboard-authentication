export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean
      uni_id?: string
      fullArabicName?: string
      saudiPhone?: string
      gender?: 'male' | 'female'
      personalEmail?: string
      uniLevel?: number
      uniCollege?: string
    }
  }
}
