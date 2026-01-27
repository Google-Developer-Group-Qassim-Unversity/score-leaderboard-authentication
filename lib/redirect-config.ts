/**
 * Configuration for allowed redirect domains
 * Used to validate redirect_url parameters to prevent open redirect vulnerabilities
 */

export const ALLOWED_REDIRECT_DOMAINS = [
  // Local development
  'localhost',
  'gdg-q.com',
  
  // Production domains (without protocol)
  'event.gdg-q.com',
]

/**
 * Validates if a redirect URL is from an allowed domain
 * @param redirectUrl - The URL to validate
 * @returns true if the URL is from an allowed domain, false otherwise
 */
export function isAllowedRedirectUrl(redirectUrl: string): boolean {
  try {
    const url = new URL(redirectUrl)
    
    return ALLOWED_REDIRECT_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )
  } catch {
    // Invalid URL
    return false
  }
}
