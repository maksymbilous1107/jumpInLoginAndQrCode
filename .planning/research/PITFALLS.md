# Pitfalls Research: JumpIn QR Check-In

**Domain:** React SPA to Next.js App Router Migration with Supabase Auth + Google Sheets Integration
**Researched:** 2026-02-13
**Overall Confidence:** HIGH (Next.js migration), MEDIUM (Supabase Auth patterns), MEDIUM (Google Sheets integration)

## Critical Pitfalls

### 1. Auth State Hydration Mismatch
**Risk Level:** CRITICAL
**Category:** Migration / Auth / SSR

**What goes wrong:**
When migrating from a purely client-side auth system (localStorage + React state) to Next.js with SSR, you'll encounter hydration errors if the server-rendered HTML doesn't match the client's initial render. The server doesn't have access to localStorage or cookies on first render, so if you check auth state synchronously during render, the server will render "logged out" while the client tries to render "logged in" after reading localStorage/cookies.

This manifests as:
- React hydration errors in console: "Text content did not match"
- Flash of wrong content (FOUC): logged-in users see login screen briefly
- Navigation failures: protected routes redirect incorrectly
- Supabase session state mismatches between server/client

**Warning signs:**
- Console errors mentioning "hydration" or "did not match"
- Auth state checks directly in component render (before useEffect)
- Using `useState` to hold auth state initialized from localStorage
- Dashboard renders briefly then redirects to login
- Different content on initial page load vs after hydration

**Prevention strategy:**
1. **Use Supabase's SSR helpers properly**: Import from `@supabase/ssr` not `@supabase/supabase-js`
2. **Server Components for auth checks**: Move auth checks to Server Components where possible (they run only on server)
3. **Loading states**: Always render a loading skeleton on server, hydrate with actual state on client
4. **Middleware for protection**: Use Next.js middleware for route protection, not client-side redirects
5. **Cookie-based sessions**: Ensure Supabase is configured for cookie storage, not localStorage (App Router requirement)

**Example pattern to follow:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <DashboardClient user={user} profile={profile} />
}
```

**Phase relevance:** Phase 1 (Migration + Auth Setup) - Must be addressed immediately when migrating to Next.js

---

### 2. Client Component Usage Explosion
**Risk Level:** HIGH
**Category:** Migration / Architecture

**What goes wrong:**
When migrating a React SPA (where everything is a Client Component), developers often add `'use client'` to every component file to "make it work," defeating the purpose of Next.js App Router. This happens because:

- Client-side hooks (`useState`, `useEffect`) don't work in Server Components
- Event handlers (`onClick`, `onChange`) require Client Components
- The existing codebase has hooks scattered throughout

Result: Entire app runs client-side, losing SSR benefits, increasing bundle size, and making Google Sheets API integration harder (can't use secrets in Client Components).

**Warning signs:**
- Every component file starts with `'use client'`
- Seeing "You're importing a component that needs X, but X only works in Client Components" errors
- Bundle size doesn't decrease after migration
- API routes used for every data fetch (because Server Components not utilized)
- Supabase client initialized in multiple places with client-side config

**Prevention strategy:**
1. **Default to Server Components**: Only add `'use client'` when absolutely necessary
2. **Identify actual client needs**: Interactive components need client boundary, data fetching doesn't
3. **Lift client directives down**: Keep parent layouts as Server Components, only mark interactive children as Client
4. **Pattern: Server wrapper + Client presenter**:
   - Server Component fetches data
   - Passes props to Client Component for interactivity
5. **Audit current components by interactivity**:
   - `GlassCard`: Can be Server Component (no state)
   - `Dashboard`: Needs to be Client (has QR scanner modal state)
   - Form pages: Need Client for form state
   - Layout: Should be Server

**Migration pattern:**
```typescript
// BEFORE (SPA - everything client-side)
// App.tsx
const App = () => {
  const [user, setUser] = useState(null)
  useEffect(() => { /* fetch user */ }, [])
  return <Dashboard user={user} />
}

// AFTER (App Router - strategic client boundaries)
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const user = await getUser() // Server-side
  const profile = await getProfile(user.id) // Server-side
  return <DashboardClient user={user} profile={profile} />
}

// app/dashboard/DashboardClient.tsx
'use client'
export function DashboardClient({ user, profile }) {
  const [showQR, setShowQR] = useState(false) // Client-only state
  return <div onClick={() => setShowQR(true)}>...</div>
}
```

**Phase relevance:** Phase 1 (Migration) - Fundamental architectural decision that affects everything

---

### 3. Dual-Write Consistency Failure
**Risk Level:** CRITICAL
**Category:** Integration / Data Integrity

**What goes wrong:**
Writing to both Supabase and Google Sheets creates a distributed transaction problem. If Supabase write succeeds but Google Sheets fails (or vice versa), data becomes inconsistent:

- User registers → Supabase succeeds → Sheets fails → user can log in but doesn't appear in admin view
- User checks in → Sheets succeeds → Supabase fails → timestamp in Sheets but not in database, breaks dashboard
- Network timeout during Sheets write → user sees error → retries → duplicate rows in Sheets

Common failure modes:
- Google Sheets API rate limits (100 requests per 100 seconds per user)
- Network timeouts (Sheets API can be slow)
- Invalid auth tokens (Service Account key expires/misconfigured)
- Malformed data (Sheets expects different format than Supabase)

**Warning signs:**
- User reports "registration successful" but can't log in
- Check-ins appear in Sheets but not dashboard (or vice versa)
- Intermittent "failed to update" errors
- Duplicate entries in Google Sheets
- API route timeouts during registration/check-in
- 429 "Too Many Requests" errors from Google Sheets

**Prevention strategy:**
1. **Primary-backup pattern**: Supabase is source of truth, Sheets is best-effort backup
2. **Async queue for Sheets**: Don't block user operations on Sheets writes
3. **Retry with exponential backoff**: Sheets writes should retry on failure
4. **Idempotency**: Use user ID/timestamp as key to prevent duplicates
5. **Error handling hierarchy**:
   ```typescript
   try {
     await supabase.insert(data) // Critical - must succeed
     try {
       await appendToSheets(data) // Best effort
     } catch (sheetsError) {
       // Log but don't fail the operation
       console.error('Sheets sync failed:', sheetsError)
       // TODO: Queue for retry
     }
   } catch (supabaseError) {
     // Fail the operation - show error to user
     throw supabaseError
   }
   ```
6. **Rate limit awareness**: Batch Sheets writes if possible, implement request throttling
7. **Reconciliation endpoint**: Admin endpoint to sync missing records from Supabase → Sheets

**Implementation pattern:**
```typescript
// app/api/checkin/route.ts
export async function POST(request: Request) {
  const { userId } = await request.json()
  const timestamp = new Date().toISOString()

  // 1. Write to Supabase (critical path)
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ last_checkin: timestamp })
    .eq('id', userId)

  if (dbError) {
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  // 2. Write to Sheets (best effort, async)
  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'CheckIns!A:C',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[userId, timestamp, 'checkin']]
      }
    })
  } catch (sheetsError) {
    // Log for later reconciliation but don't fail request
    console.error('Sheets write failed, needs reconciliation:', {
      userId,
      timestamp,
      error: sheetsError
    })
  }

  return Response.json({ success: true, timestamp })
}
```

**Phase relevance:** Phase 2 (Backend Integration) - Must be designed correctly from the start

---

### 4. Google Sheets API Credential Exposure
**Risk Level:** CRITICAL
**Category:** Security

**What goes wrong:**
Google Service Account credentials contain a private key that grants full access to the linked Google Sheets. If exposed client-side:

- Private key visible in browser DevTools or bundle
- Anyone can write/delete data in your Sheets
- Credential revocation requires creating new Service Account + updating deployed app
- Malicious users could exhaust API quotas

Common exposure paths:
- Importing Sheets client in a Client Component
- Environment variables without `NEXT_PUBLIC_` prefix used client-side (Next.js won't strip them)
- Service Account JSON committed to Git
- API key in client-side fetch() calls

**Warning signs:**
- Environment variables with `NEXT_PUBLIC_` prefix containing `private_key`
- Google Sheets API client imported in files with `'use client'`
- Service Account JSON in project root or public directory
- Webpack/Vite bundle contains "service_account" strings
- API calls to Google Sheets directly from browser (Network tab)

**Prevention strategy:**
1. **API Routes only**: All Google Sheets operations must go through Next.js API routes (Server Components can't make mutations)
2. **Environment variable hygiene**:
   ```env
   # .env.local (NEVER commit)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_SHEETS_ID=...

   # NO NEXT_PUBLIC_ prefix for secrets
   ```
3. **gitignore**: Ensure `.env.local` and `*.json` (Service Account files) are in `.gitignore`
4. **Server-only imports**: Use `google-auth-library` only in API routes or Server Components
5. **Runtime checks**:
   ```typescript
   // app/api/sheets/route.ts
   if (typeof window !== 'undefined') {
     throw new Error('Sheets client must only run on server')
   }
   ```
6. **Vercel deployment**: Use environment variables in Vercel dashboard, never in code

**Phase relevance:** Phase 2 (Backend Integration) - Security requirement from day one

---

### 5. Cookies vs. localStorage Auth Incompatibility
**Risk Level:** HIGH
**Category:** Auth / Migration

**What goes wrong:**
The existing React SPA uses localStorage for session persistence. Next.js App Router with SSR requires cookies for auth state because:

- Server can't access localStorage (browser API only)
- Supabase SSR helpers require cookie-based storage
- Middleware needs auth state to protect routes (only has access to cookies)

Attempting to keep localStorage-based auth leads to:
- Auth state lost on page refresh (server doesn't see it)
- Middleware can't protect routes (redirects fail)
- Users logged out unexpectedly
- Session not shared between tabs

**Warning signs:**
- Auth works in development (client-only) but breaks in production (SSR)
- User logged in but middleware redirects to login
- `supabase.auth.getSession()` returns null on server but works on client
- Dashboard requires manual refresh after login
- Incognito/private mode behaves differently

**Prevention strategy:**
1. **Use Supabase's cookie storage**: Configure with `@supabase/ssr` package
2. **Remove all localStorage references**: Delete existing `localStorage.getItem('jumpin_user')` code
3. **Server + Client Supabase clients**:
   ```typescript
   // utils/supabase/server.ts
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export async function createClient() {
     const cookieStore = await cookies()
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return cookieStore.get(name)?.value
           },
         },
       }
     )
   }

   // utils/supabase/client.ts
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   }
   ```
4. **Middleware for route protection**:
   ```typescript
   // middleware.ts
   import { createServerClient } from '@supabase/ssr'
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export async function middleware(request: NextRequest) {
     const response = NextResponse.next()
     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return request.cookies.get(name)?.value
           },
           set(name: string, value: string, options: any) {
             response.cookies.set({ name, value, ...options })
           },
         },
       }
     )

     const { data: { user } } = await supabase.auth.getUser()

     if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url))
     }

     return response
   }

   export const config = {
     matcher: ['/dashboard/:path*']
   }
   ```

**Phase relevance:** Phase 1 (Migration + Auth Setup) - Must be handled during initial migration

---

### 6. Google Sheets API Rate Limiting
**Risk Level:** HIGH
**Category:** Integration / Performance

**What goes wrong:**
Google Sheets API has strict rate limits:
- **100 requests per 100 seconds per user** (Service Account counts as one user)
- **Quota exhaustion during events**: If 50 students check in within 2 minutes, you'll hit the limit

This causes:
- Check-ins fail with 429 errors
- User sees "Error checking in" repeatedly
- Angry users retrying = more requests = longer lockout
- Some users successfully check in, others don't

**Warning signs:**
- HTTP 429 "Rate Limit Exceeded" errors in API route logs
- Check-ins work individually but fail during mass check-in scenarios
- Errors spike at event start times
- Inconsistent behavior: sometimes works, sometimes doesn't
- Users report "it worked for my friend but not for me"

**Prevention strategy:**
1. **Batch writes**: Accumulate check-ins, write in batches every 10-30 seconds
2. **Async queue**: Use a queue system (even simple in-memory array) to throttle requests
3. **Exponential backoff**: Retry failed requests with increasing delays
4. **Request prioritization**: Registration > check-in in terms of importance
5. **Implementation pattern**:
   ```typescript
   // Simple in-memory queue for MVP
   const sheetsQueue: Array<{ userId: string; timestamp: string; type: string }> = []
   let isProcessing = false

   export function queueSheetsWrite(data: any) {
     sheetsQueue.push(data)
     processSheetsQueue() // Non-blocking
   }

   async function processSheetsQueue() {
     if (isProcessing || sheetsQueue.length === 0) return

     isProcessing = true
     const batch = sheetsQueue.splice(0, 10) // Process 10 at a time

     try {
       await sheetsClient.spreadsheets.values.append({
         spreadsheetId: process.env.GOOGLE_SHEETS_ID,
         range: 'CheckIns!A:C',
         valueInputOption: 'RAW',
         requestBody: {
           values: batch.map(item => [item.userId, item.timestamp, item.type])
         }
       })
     } catch (error) {
       // Re-queue failed items
       sheetsQueue.unshift(...batch)
     } finally {
       isProcessing = false
       if (sheetsQueue.length > 0) {
         setTimeout(processSheetsQueue, 2000) // Wait 2s before next batch
       }
     }
   }
   ```
6. **Monitoring**: Log queue length and rate limit hits
7. **User feedback**: Show "Check-in recorded" immediately (from Supabase), don't wait for Sheets

**Phase relevance:** Phase 2 (Backend Integration) - Design pattern needed from start, can optimize later

---

### 7. Route Segment Configuration Forgotten
**Risk Level:** MEDIUM
**Category:** Migration / Performance

**What goes wrong:**
Next.js App Router has per-route configuration options that drastically affect behavior. Forgetting to configure routes leads to:

- Dashboard data cached when it should be dynamic (user sees stale check-in time)
- Login page statically generated at build time (why?)
- API routes cached incorrectly
- Revalidation not happening

The existing SPA is fully dynamic. After migration, you might accidentally make pages static because App Router defaults to static where possible.

**Warning signs:**
- User checks in, refreshes page, sees old timestamp
- Profile updates don't appear until app redeployment
- Different users see the same dashboard content
- Data "stuck" at build-time values
- `console.log()` in Server Components only appears during build

**Prevention strategy:**
1. **Understand the defaults**: App Router tries to static render when possible
2. **Force dynamic for auth pages**:
   ```typescript
   // app/dashboard/page.tsx
   export const dynamic = 'force-dynamic' // Always run on server per request

   export default async function DashboardPage() {
     // This will run on every request, not cached
   }
   ```
3. **Route segment config options**:
   ```typescript
   export const dynamic = 'force-dynamic' // Don't cache this route
   export const revalidate = 0 // Disable ISR
   export const runtime = 'nodejs' // Or 'edge' for faster cold starts
   export const fetchCache = 'force-no-store' // Don't cache fetches
   ```
4. **When to use what**:
   - **Login/Register pages**: Can be static (no user data) - default is fine
   - **Dashboard**: Must be `dynamic = 'force-dynamic'` (user-specific data)
   - **API routes**: Default to dynamic (correct)
   - **QR check-in**: Dynamic (creates side effects)
5. **Testing**: Test with different users to ensure no data leakage between sessions

**Phase relevance:** Phase 1 (Migration) - Easy to miss, causes subtle bugs in production

---

### 8. Next.js Middleware Infinite Redirects
**Risk Level:** MEDIUM
**Category:** Auth / Routing

**What goes wrong:**
Poorly configured middleware can create redirect loops:

1. User visits `/login`
2. Middleware checks auth → not logged in → redirects to `/login`
3. Infinite loop → browser shows "Too many redirects"

Also happens when:
- Middleware protects `/login` route (it shouldn't)
- Redirect URL is also protected by middleware
- Auth check fails for technical reasons, always returns "not logged in"

**Warning signs:**
- Browser error: "ERR_TOO_MANY_REDIRECTS"
- Page stuck loading infinitely
- Network tab shows repeated requests to same URL
- Cannot access login page
- Middleware logs show repeated execution

**Prevention strategy:**
1. **Exclude public routes from middleware**:
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
     // Don't protect login/register
     const publicRoutes = ['/login', '/register', '/']
     if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
       return NextResponse.next()
     }

     // Protect dashboard
     const supabase = createServerClient(...)
     const { data: { user } } = await supabase.auth.getUser()

     if (!user) {
       const redirectUrl = new URL('/login', request.url)
       return NextResponse.redirect(redirectUrl)
     }

     return NextResponse.next()
   }
   ```
2. **Matcher config**: Use Next.js matcher to only run middleware on specific paths
   ```typescript
   export const config = {
     matcher: [
       '/dashboard/:path*',
       '/api/checkin/:path*',
       // Explicitly exclude public paths
       '/((?!login|register|_next/static|_next/image|favicon.ico).*)'
     ]
   }
   ```
3. **Fail-open for errors**: If auth check fails technically, allow access (log error, don't redirect)
4. **Test scenarios**:
   - Logged out user visits `/login` → should load
   - Logged in user visits `/login` → optional: redirect to dashboard
   - Logged out user visits `/dashboard` → redirect to `/login`

**Phase relevance:** Phase 1 (Migration + Auth Setup) - Configure middleware correctly from the start

---

## Moderate Pitfalls

### 9. Supabase Client Initialization Duplication
**Risk Level:** MEDIUM
**Category:** Auth / Architecture

**What goes wrong:**
Creating multiple Supabase client instances throughout the app leads to:
- Inconsistent auth state across components
- Multiple subscriptions to auth changes
- Increased memory usage
- Confusion about which client to use where

**Prevention strategy:**
1. Create two singleton utilities: `supabase/server.ts` and `supabase/client.ts`
2. Use `server.ts` in Server Components, `client.ts` in Client Components
3. Never instantiate `createClient()` directly in components
4. For auth state changes in Client Components:
   ```typescript
   'use client'
   import { createClient } from '@/utils/supabase/client'
   import { useEffect, useState } from 'react'

   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null)
     const supabase = createClient()

     useEffect(() => {
       const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         setUser(session?.user ?? null)
       })

       return () => subscription.unsubscribe()
     }, [supabase])

     return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
   }
   ```

**Phase relevance:** Phase 1 (Migration + Auth Setup)

---

### 10. TypeScript `any` Types from Supabase
**Risk Level:** LOW
**Category:** Developer Experience

**What goes wrong:**
Without generated types from Supabase, all database queries return `any`, losing type safety and IntelliSense.

**Prevention strategy:**
1. Install Supabase CLI: `npm i -D supabase`
2. Generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`
3. Use typed client:
   ```typescript
   import { Database } from '@/types/supabase'
   const supabase = createClient<Database>(...)

   // Now typed!
   const { data } = await supabase.from('profiles').select('*')
   // data is Profile[] not any
   ```
4. Regenerate types when schema changes
5. Add to development workflow

**Phase relevance:** Phase 2 (Backend Integration) - Quality of life improvement

---

### 11. Camera Permissions in QR Scanner
**Risk Level:** MEDIUM
**Category:** Feature Migration

**What goes wrong:**
`html5-qrcode` works in Vite dev mode but may have issues in Next.js due to:
- SSR: camera APIs don't exist on server
- Hydration: scanner initialized before DOM ready
- Permissions: HTTPS required for camera in production

**Prevention strategy:**
1. QR scanner must be Client Component with `'use client'`
2. Check `typeof window !== 'undefined'` before initializing
3. Use `useEffect` to initialize scanner after mount
4. Handle permission denial gracefully:
   ```typescript
   'use client'
   import { useEffect, useRef, useState } from 'react'
   import { Html5QrcodeScanner } from 'html5-qrcode'

   export function QRScanner() {
     const scannerRef = useRef<Html5QrcodeScanner>()
     const [error, setError] = useState<string>()

     useEffect(() => {
       if (typeof window === 'undefined') return

       const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false)
       scannerRef.current = scanner

       scanner.render(
         (decodedText) => { /* handle success */ },
         (error) => {
           if (error.includes('Permission')) {
             setError('Permesso fotocamera negato')
           }
         }
       )

       return () => scanner.clear()
     }, [])

     return <div id="reader" />
   }
   ```
5. Test on real mobile devices (iOS Safari, Android Chrome)
6. Ensure Vercel deployment has HTTPS (it does by default)

**Phase relevance:** Phase 3 (Feature Migration) - Test thoroughly on mobile

---

### 12. Italian Date Formatting Inconsistencies
**Risk Level:** LOW
**Category:** Localization

**What goes wrong:**
Date formatting differs between server (Node.js) and client (browser), especially with Italian locale:
- Server renders "13/02/2026"
- Client hydrates with "2/13/2026"
- Hydration mismatch error

**Prevention strategy:**
1. Use consistent formatting library: `date-fns` with `it` locale
2. Format dates in same component (Server or Client, not both)
3. Or format server-side and pass as string to client:
   ```typescript
   // Server Component
   const formatted = new Date(user.dob).toLocaleDateString('it-IT')
   return <ClientComponent dob={formatted} />
   ```

**Phase relevance:** Phase 3 (Feature Migration) - Polish phase

---

## Summary

### Most Critical Risks

1. **Auth hydration mismatch** - Will break the entire auth flow if not handled correctly from day one
2. **Dual-write consistency** - Data integrity issue that affects core functionality
3. **Credential exposure** - Security vulnerability that could compromise the entire system

### Phase-Specific Focus

| Phase | Critical Pitfalls to Address |
|-------|----------------------------|
| **Phase 1: Migration + Auth** | #1 (Hydration), #2 (Client Components), #5 (Cookies), #7 (Route Config), #8 (Middleware) |
| **Phase 2: Backend Integration** | #3 (Dual-Write), #4 (Credentials), #6 (Rate Limits) |
| **Phase 3: Feature Polish** | #11 (Camera), #12 (Dates) |

### Quick Decision Matrix

| Situation | Right Approach | Wrong Approach |
|-----------|---------------|----------------|
| Need auth state in component | Server Component: `await supabase.auth.getUser()` | Client Component with `useEffect` + `useState` |
| Protect a route | Middleware + redirect | Client-side redirect in `useEffect` |
| Write to Sheets | API route with try/catch, non-blocking | Client-side direct call, blocking operation |
| Store secrets | `.env.local` without `NEXT_PUBLIC_` | `NEXT_PUBLIC_*` or committed files |
| Handle rate limits | Queue + batch writes | Synchronous writes, no retry |
| Initialize Supabase | Singleton utils (`supabase/server.ts`) | `createClient()` in every component |

### Confidence Notes

- **HIGH confidence** on Next.js migration pitfalls: Based on official Next.js 16.1.6 documentation (2026-02-11)
- **MEDIUM confidence** on Supabase patterns: Based on training data + attempted fetch of official docs (blocked)
- **MEDIUM confidence** on Google Sheets integration: Based on training data about API limits and common patterns
- **LOW confidence** gaps: Specific Supabase SSR implementation details (official docs fetch failed), would benefit from Context7 verification

### Sources

1. Next.js App Router Migration Guide (v16.1.6, official, 2026-02-11): https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration
2. Project codebase analysis: Current React+Vite implementation with localStorage auth pattern
3. Training data: Supabase Auth SSR patterns, Google Sheets API rate limits, common migration pitfalls

### Recommended Next Steps

1. **Before starting Phase 1**: Read Supabase SSR documentation thoroughly (official docs fetch was blocked)
2. **During Phase 1**: Create a simple auth test page to verify hydration works before migrating full app
3. **Before Phase 2**: Prototype the dual-write pattern in isolation to understand failure modes
4. **Throughout**: Test with network throttling to simulate Sheets API delays
