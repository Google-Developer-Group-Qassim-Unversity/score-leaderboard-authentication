import { isAllowedRedirectUrl } from './redirect-config'

const REDIRECT_URL_KEY = 'redirect_url'

/**
 * Saves the redirect URL to localStorage
 * @param url - The redirect URL to save, or null to clear
 */
export function saveRedirectUrl(url: string | null): void {
  if (typeof window === 'undefined') return
  console.log('Saving redirect URL:', url)
  
  if (url) {
    console.log(`setting ${REDIRECT_URL_KEY} in localStorage to:`, url)
    localStorage.setItem(REDIRECT_URL_KEY, url)
  } else {
    localStorage.removeItem(REDIRECT_URL_KEY)
  }
}

/**
 * Retrieves the redirect URL from localStorage
 * @returns The stored redirect URL or null if not found
 */
export function getRedirectUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  return localStorage.getItem(REDIRECT_URL_KEY)
}

/**
 * Clears the redirect URL from localStorage
 */
export function clearRedirectUrl(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(REDIRECT_URL_KEY)
}

/**
 * Retrieves the redirect URL, validates it against the allowlist,
 * clears it from storage, and returns the validated URL or null
 * @returns The validated redirect URL or null if invalid/not found
 */
export function getValidatedRedirectUrl(): string | null {
  const url = getRedirectUrl()
  
  // Clear immediately to prevent reuse
  clearRedirectUrl()
  
  if (!url) return null
  
  // Validate against allowlist
  if (!isAllowedRedirectUrl(url)) {
    console.warn('Redirect URL blocked by allowlist:', url)
    return null
  }
  
  return url
}
