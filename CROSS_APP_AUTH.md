# Cross-App Authentication Setup

This authentication hub is configured to handle sign-in/sign-up for multiple applications and redirect users back to where they came from.

## How It Works

1. **Subdomain app** detects unauthenticated user
2. Redirects to this app with `?redirect_url=` parameter
3. User signs in/signs up (and completes onboarding if new)
4. User is redirected back to the original URL

## Configuration

### 1. Add Allowed Domains

Edit `lib/redirect-config.ts` and add your domains:

```typescript
export const ALLOWED_REDIRECT_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'main.test',        // Add your local test domains
  'app.main.test',
  'yourdomain.com',   // Add production domains
  'app.yourdomain.com',
]
```

### 2. Example Redirect Flow

**From subdomain app:**
```typescript
// In your subdomain app middleware
if (!userId) {
  const authUrl = new URL('http://main.test:3000/sign-in')
  authUrl.searchParams.set('redirect_url', req.url)
  return NextResponse.redirect(authUrl)
}
```

**Example URLs:**
- User visits: `http://app.main.test:3001/dashboard`
- Redirects to: `http://main.test:3000/sign-in?redirect_url=http://app.main.test:3001/dashboard`
- After auth: User returns to `http://app.main.test:3001/dashboard`

### 3. Features

- ✅ Preserves redirect URL through entire flow (sign-in → onboarding → back)
- ✅ Validates redirect URLs to prevent open redirect vulnerabilities
- ✅ Links between sign-in and sign-up preserve the redirect URL
- ✅ Supports both subdomains and cross-domain authentication

## Security Notes

- Only URLs from `ALLOWED_REDIRECT_DOMAINS` will be redirected to
- Invalid or malicious URLs fall back to default home page redirect
- Always use HTTPS in production
- Keep the allowed domains list minimal and specific

## Testing Locally

1. Add to `/etc/hosts`:
   ```
   127.0.0.1   main.test
   127.0.0.1   app.main.test
   ```

2. Run main app: `npm run dev` (port 3000)
3. Run subdomain app: `npm run dev -- -p 3001`

4. Test flow:
   - Visit `http://app.main.test:3001/protected-page`
   - Should redirect to `http://main.test:3000/sign-in?redirect_url=...`
   - After login, returns to `http://app.main.test:3001/protected-page`
