# Architecture Patterns: Next.js + Supabase + Google Sheets QR Check-In

**Domain:** QR check-in web application
**Researched:** 2026-02-13
**Migration Context:** React+Vite SPA → Next.js App Router
**Confidence:** MEDIUM (based on training data, not verified with current docs)

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js App Router Pages (Server Components + Client)     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /app/                                                       │
│    ├─ (auth)/                 ← Auth-protected routes       │
│    │   ├─ dashboard/          ← Server Component           │
│    │   └─ check-in/           ← QR Scanner (Client)        │
│    ├─ login/                  ← Server Component           │
│    ├─ register/               ← Server Component           │
│    └─ api/                    ← API Route Handlers         │
│        ├─ checkin/route.ts    ← POST: Record check-in      │
│        └─ sheets-sync/route.ts ← POST: Sync to Sheets      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE LAYER                           │
│  middleware.ts (Supabase Auth Check)                        │
└─────────────────────────────────────────────────────────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   ▼               ▼
         ┌──────────────┐  ┌──────────────┐
         │   SUPABASE   │  │ GOOGLE SHEETS│
         │   (Primary)  │  │   (Backup)   │
         ├──────────────┤  ├──────────────┤
         │ • Auth       │  │ • Admin View │
         │ • Profiles   │  │ • CSV Export │
         │ • Check-ins  │  │ • Read-only  │
         └──────────────┘  └──────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Type |
|-----------|---------------|-------------------|------|
| **Auth Pages** (`/login`, `/register`) | User authentication forms | Supabase Auth (direct) | Server Component |
| **Dashboard** (`/dashboard`) | User profile display, check-in history | Supabase DB (via server actions) | Server Component |
| **QR Scanner** (`/check-in`) | Camera access, QR code detection | API Routes | Client Component |
| **API Route: `/api/checkin`** | Process check-in, dual-write | Supabase + Google Sheets | Route Handler |
| **API Route: `/api/sheets-sync`** | Batch sync to Sheets (cron) | Supabase + Google Sheets | Route Handler |
| **Middleware** | Auth state verification, route protection | Supabase Auth | Edge Middleware |
| **Supabase Client** | Database operations, auth | Supabase API | Server/Client SDK |
| **Sheets Client** | Append rows, read data | Google Sheets API v4 | Server-only SDK |

### Data Flow

#### 1. Authentication Flow (Registration)
```
User submits form
    ↓
Server Action in /register/page.tsx
    ↓
Supabase Auth: signUp()
    ↓
Trigger: Create profile in profiles table
    ↓
Redirect to /dashboard
```

#### 2. Authentication Flow (Login)
```
User submits credentials
    ↓
Server Action in /login/page.tsx
    ↓
Supabase Auth: signInWithPassword()
    ↓
Set auth cookie
    ↓
Redirect to /dashboard
```

#### 3. Check-In Flow (Primary)
```
QR Scanner (Client Component) scans code
    ↓
POST /api/checkin with { userId, timestamp, location }
    ↓
API Route Handler:
    1. Verify auth session
    2. INSERT into supabase.check_ins
    3. UPDATE supabase.profiles.last_checkin
    4. Async: Append to Google Sheets (non-blocking)
    ↓
Return { success, check_in_id }
    ↓
Client: Show success animation
```

#### 4. Sheets Sync Flow (Backup)
```
Cron trigger (Vercel Cron / external)
    ↓
POST /api/sheets-sync with cron secret
    ↓
API Route Handler:
    1. Verify cron secret
    2. Query Supabase: last N unsync'd check-ins
    3. Batch append to Google Sheets
    4. Mark records as sync'd
    ↓
Return { synced_count }
```

## Migration Path from Current SPA

### Phase 1: Foundation
**Goal:** Get Next.js running with existing UI, no backend yet

1. **Install Next.js**
   ```bash
   npx create-next-app@latest . --typescript --app --no-src-dir
   ```

2. **Port existing components**
   - Move `components/` to `/app/components/`
   - Convert `App.tsx` logic to route-based pages
   - Keep localStorage temporarily

3. **Route structure**
   ```
   /app/
     layout.tsx          (root layout, glassmorphism styles)
     page.tsx            (redirect to /login)
     login/page.tsx      (existing login UI)
     register/page.tsx   (existing register UI)
     dashboard/
       page.tsx          (existing Dashboard component)
       layout.tsx        (auth check via middleware)
   ```

**Migration Notes:**
- All components remain client-side (`'use client'`)
- No Supabase yet, still localStorage
- Verify UI/UX matches before proceeding

---

### Phase 2: Supabase Authentication
**Goal:** Replace localStorage auth with Supabase Auth

1. **Install Supabase**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

2. **Create Supabase utilities**
   ```typescript
   // lib/supabase/server.ts (Server Components)
   // lib/supabase/client.ts (Client Components)
   // lib/supabase/middleware.ts (Middleware)
   ```

3. **Database schema**
   ```sql
   -- profiles table (created by trigger on auth.users insert)
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users,
     first_name TEXT,
     last_name TEXT,
     email TEXT,
     school TEXT,
     dob DATE,
     last_checkin TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Replace auth logic**
   - Convert `handleLogin` → Server Action using `supabase.auth.signInWithPassword()`
   - Convert `handleRegister` → Server Action using `supabase.auth.signUp()`
   - Replace `localStorage` checks → `await supabase.auth.getSession()`

5. **Add middleware**
   ```typescript
   // middleware.ts
   // Protect /dashboard routes, redirect to /login if no session
   ```

**Migration Notes:**
- User data now in Supabase profiles table
- Auth cookies handled by Supabase SSR
- Remove all localStorage auth code

---

### Phase 3: Check-In API + Database
**Goal:** Persist check-ins to Supabase

1. **Database schema**
   ```sql
   CREATE TABLE check_ins (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES profiles(id),
     checked_in_at TIMESTAMPTZ DEFAULT NOW(),
     location TEXT,
     qr_code_data TEXT,
     synced_to_sheets BOOLEAN DEFAULT FALSE
   );

   CREATE INDEX idx_check_ins_user ON check_ins(user_id);
   CREATE INDEX idx_check_ins_unsynced ON check_ins(synced_to_sheets) WHERE NOT synced_to_sheets;
   ```

2. **API Route: `/app/api/checkin/route.ts`**
   ```typescript
   export async function POST(request: Request) {
     // 1. Get session from Supabase
     // 2. Insert check_in record
     // 3. Update profile.last_checkin
     // 4. Trigger sheets sync (async, non-blocking)
     // 5. Return success
   }
   ```

3. **Update QR Scanner component**
   - Convert `handleCheckIn` to call `/api/checkin`
   - Remove localStorage persistence

**Migration Notes:**
- Check-ins now source of truth in Supabase
- Dashboard pulls from `check_ins` table
- QR Scanner remains client component (camera access)

---

### Phase 4: Google Sheets Integration
**Goal:** Sync check-ins to Sheets for admin/backup

1. **Install Google APIs**
   ```bash
   npm install googleapis
   ```

2. **Setup Service Account**
   - Create service account in Google Cloud Console
   - Download JSON key
   - Share target Sheet with service account email
   - Store credentials in env: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEETS_ID`

3. **Create Sheets client**
   ```typescript
   // lib/sheets/client.ts
   import { google } from 'googleapis';

   export async function appendCheckIn(data: CheckInRow) {
     const auth = new google.auth.GoogleAuth({
       credentials: {
         client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
         private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
       },
       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
     });

     const sheets = google.sheets({ version: 'v4', auth });
     await sheets.spreadsheets.values.append({
       spreadsheetId: process.env.SHEETS_ID,
       range: 'Check-ins!A:F',
       valueInputOption: 'USER_ENTERED',
       requestBody: {
         values: [[data.timestamp, data.name, data.email, data.school, ...]],
       },
     });
   }
   ```

4. **API Route: `/app/api/sheets-sync/route.ts`**
   ```typescript
   export async function POST(request: Request) {
     // 1. Verify cron secret
     // 2. Query unsynced check-ins from Supabase
     // 3. Batch append to Sheets
     // 4. Update synced_to_sheets = true
     // 5. Return count
   }
   ```

5. **Dual-write strategy**
   - In `/api/checkin`: Async append to Sheets (don't await)
   - Fallback: Cron job syncs any missed records
   - Mark synced records to avoid duplicates

**Migration Notes:**
- Sheets is secondary data store (Supabase is primary)
- Non-blocking append: don't fail check-in if Sheets fails
- Cron ensures eventual consistency

---

### Phase 5: Production Readiness
**Goal:** Deploy to Vercel with environment parity

1. **Environment variables**
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Google Sheets
   GOOGLE_SERVICE_ACCOUNT_EMAIL=
   GOOGLE_PRIVATE_KEY=
   SHEETS_ID=

   # Cron security
   CRON_SECRET=
   ```

2. **Setup Vercel Cron**
   ```json
   // vercel.json
   {
     "crons": [{
       "path": "/api/sheets-sync",
       "schedule": "*/15 * * * *"  // Every 15 minutes
     }]
   }
   ```

3. **Error handling**
   - Retry logic for Sheets API
   - Logging with timestamps
   - Graceful degradation if Sheets unavailable

4. **Testing**
   - Test auth flows (login/register/logout)
   - Test check-in → Supabase write
   - Test Sheets sync with sample data
   - Test middleware route protection

---

## Patterns to Follow

### Pattern 1: Server Components by Default
**What:** Use Server Components for all pages unless interactivity required

**When:** Dashboard, profile pages, static content

**Why:** Better performance, smaller bundle, direct database access

**Example:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <div>Welcome, {profile.first_name}!</div>;
}
```

---

### Pattern 2: Client Components for Interactivity
**What:** Use `'use client'` only when needed (camera, real-time updates, browser APIs)

**When:** QR Scanner (camera access), animations, form state

**Example:**
```typescript
// app/check-in/page.tsx
'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

export default function CheckIn() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10 });
    scanner.render(onScanSuccess, onScanFailure);
    return () => scanner.clear();
  }, []);

  async function onScanSuccess(decodedText: string) {
    await fetch('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({ qr_data: decodedText }),
    });
  }

  return <div id="qr-reader" />;
}
```

---

### Pattern 3: Server Actions for Mutations
**What:** Use Server Actions for form submissions instead of API routes when possible

**When:** Login, registration, profile updates

**Why:** Type-safe, no API route needed, progressive enhancement

**Example:**
```typescript
// app/login/actions.ts
'use server';

import { createServerActionClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}
```

---

### Pattern 4: Middleware for Auth Protection
**What:** Use Next.js middleware to protect routes before rendering

**When:** All `/dashboard/*` routes

**Example:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

### Pattern 5: Dual-Write with Fallback Sync
**What:** Write to primary DB immediately, async write to secondary (Sheets), cron catches failures

**When:** Check-in operations

**Why:** Fast response, eventual consistency, resilience to Sheets API failures

**Example:**
```typescript
// app/api/checkin/route.ts
export async function POST(request: Request) {
  const { user_id, qr_data } = await request.json();

  // 1. Primary write (blocking)
  const { data: checkIn, error } = await supabase
    .from('check_ins')
    .insert({ user_id, qr_code_data: qr_data })
    .select()
    .single();

  if (error) return Response.json({ error }, { status: 500 });

  // 2. Secondary write (non-blocking)
  appendToSheets(checkIn).catch(err => {
    console.error('Sheets append failed, will retry via cron:', err);
  });

  return Response.json({ success: true, id: checkIn.id });
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using Client Components Everywhere
**What:** Adding `'use client'` to every file

**Why bad:** Larger bundle, no server-side data fetching, loses streaming benefits

**Instead:** Start with Server Components, add `'use client'` only when needed (forms, camera, animations)

---

### Anti-Pattern 2: Blocking Check-In on Sheets Success
**What:** `await appendToSheets()` in check-in API route

**Why bad:**
- Sheets API can be slow (200-500ms)
- Sheets downtime breaks check-ins
- Poor user experience

**Instead:** Fire-and-forget Sheets append, rely on cron for consistency

---

### Anti-Pattern 3: Storing Secrets in Client Code
**What:** `GOOGLE_PRIVATE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client components

**Why bad:** Exposed in browser, security breach

**Instead:**
- Sheets operations only in API routes (server-side)
- Use `NEXT_PUBLIC_*` prefix only for safe keys (Supabase anon key)
- Service role key only in route handlers

---

### Anti-Pattern 4: Ignoring RLS in Supabase
**What:** Using service role key to bypass Row Level Security

**Why bad:** Users could access other users' data

**Instead:**
- Enable RLS on all tables
- Write policies: users can only read/write their own data
- Use anon key in client, service key only for admin operations

**Example:**
```sql
-- Profiles: users can only see their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

### Anti-Pattern 5: Supabase Client in API Routes
**What:** Using `@supabase/supabase-js` (client) instead of `@supabase/ssr` (server) in route handlers

**Why bad:** No cookie handling, auth session not persisted

**Instead:** Use `createRouteHandlerClient` from `@supabase/ssr` in API routes

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Auth** | Supabase Auth (built-in scaling) | Same | Same |
| **Check-ins DB** | Single Supabase region, no partitioning | Add indexes on user_id, timestamp | Consider table partitioning by date |
| **Sheets sync** | Append each check-in immediately | Batch sync every 15 min (reduce API calls) | Multiple Sheets (shard by month), parallel writes |
| **Dashboard queries** | Query all check-ins | Add pagination (10-50 per page) | Add date filters, indexed queries |
| **QR Scanner** | Client-side html5-qrcode | Same (local processing) | Same |
| **Vercel hosting** | Hobby plan | Pro plan (500GB bandwidth) | Enterprise (custom limits) |
| **Supabase DB** | Free tier (500MB) | Pro plan (8GB+) | Team/Enterprise with read replicas |

### Performance Optimizations

1. **Database Indexes** (for 10K+ users)
   ```sql
   CREATE INDEX idx_checkins_user_time ON check_ins(user_id, checked_in_at DESC);
   CREATE INDEX idx_profiles_last_checkin ON profiles(last_checkin DESC);
   ```

2. **Sheets Batching** (for 10K+ check-ins/day)
   - Switch from individual appends → batch append in sync cron
   - Collect 50-100 check-ins, append in single API call

3. **Caching** (if needed)
   - Cache profile data in dashboard (5-minute TTL)
   - Use Next.js `unstable_cache` for server components

4. **Edge Functions** (for global users)
   - Deploy middleware to edge for faster auth checks
   - Supabase supports edge auth

---

## Build Order (Dependency Chain)

**Critical path for migration:**

```
1. Next.js scaffold + UI port (no backend)
   ↓
2. Supabase setup + Auth (replaces localStorage)
   ↓
3. Profiles table + middleware (user data persistence)
   ↓
4. Check-ins table + API route (core feature)
   ↓
5. QR Scanner integration (connects to API)
   ↓
6. Google Sheets client + sync cron (backup/admin)
   ↓
7. Dashboard with check-in history (data display)
   ↓
8. Production deployment (Vercel + env vars)
```

**Parallel tracks (can be done simultaneously):**
- UI polish (glassmorphism, animations) while building API
- Sheets integration while QR scanner is being tested
- Error handling + logging while core features stabilize

---

## Technology Decisions

### Next.js App Router vs Pages Router
**Decision:** App Router

**Why:**
- Server Components reduce bundle size (glassmorphism CSS only loaded when needed)
- Server Actions simplify form handling (no manual API routes for login/register)
- Better streaming (instant shell, data loads progressively)
- Future-proof (Next.js team recommends for new projects)

### Supabase vs Firebase vs Custom Backend
**Decision:** Supabase

**Why:**
- PostgreSQL (more structured than Firestore)
- Built-in auth with email/password
- Row Level Security for data protection
- Edge functions if needed later
- Free tier sufficient for MVP

### Google Sheets vs Airtable vs CSV Export
**Decision:** Google Sheets

**Why:**
- Admins already familiar with Sheets
- Real-time collaboration (multiple admins can view)
- API well-documented, service account auth
- No additional cost
- Can export to CSV/Excel easily

### html5-qrcode vs react-qr-reader vs native APIs
**Decision:** html5-qrcode (keep existing)

**Why:**
- Already working in current SPA
- Cross-browser support (iOS Safari, Android Chrome)
- No migration cost
- Handles camera permissions well

---

## Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────┐
│           Vercel Edge Network           │
│  (Global CDN + Edge Middleware)         │
└─────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ Static Pages │   │ API Routes   │
│ (Dashboard)  │   │ (Serverless) │
└──────────────┘   └──────────────┘
         │                 │
         └────────┬────────┘
                  ▼
┌─────────────────────────────────────────┐
│         External Services               │
│  • Supabase (us-east-1 or eu-central-1) │
│  • Google Sheets API                    │
│  • Vercel Cron (15 min interval)        │
└─────────────────────────────────────────┘
```

### Environment-Specific Config

**Development (localhost:3000):**
- Local Next.js dev server
- Supabase development project
- Test Google Sheet (separate from production)
- No cron (manual trigger via API call)

**Production (vercel.app):**
- Vercel deployment (auto-deploy from `main` branch)
- Supabase production project
- Production Google Sheet (real check-ins)
- Vercel Cron enabled

---

## Open Questions / Phase-Specific Research Needed

1. **QR Code Format:** What data is encoded in QR? (user ID, timestamp, location code?)
   - **Impact:** Determines validation logic in `/api/checkin`
   - **Research in:** Phase 3 (Check-In API)

2. **Multi-Location Support:** Are there multiple check-in locations (e.g., different JumpIn facilities)?
   - **Impact:** May need `locations` table, location picker in scanner UI
   - **Research in:** Phase 3 (Check-In API)

3. **Admin Dashboard:** Do admins need a separate view in the app, or is Sheets sufficient?
   - **Impact:** May need `/admin` routes with different RLS policies
   - **Research in:** Phase 7 (post-MVP)

4. **Offline Support:** Should check-ins work without internet (PWA with sync later)?
   - **Impact:** Significant architecture change (IndexedDB, service worker)
   - **Research in:** Future milestone (not in this migration)

5. **Real-Time Updates:** Should dashboard show live check-in count (WebSocket/SSE)?
   - **Impact:** Need Supabase Realtime subscription or polling
   - **Research in:** Phase 7 (if needed)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js App Router patterns | MEDIUM | Based on training data (Jan 2025 cutoff), not verified with 2026 docs |
| Supabase Auth integration | MEDIUM | Standard patterns, but SSR package may have updates |
| Google Sheets API | MEDIUM | Service account auth is stable, but googleapis package version unknown |
| Migration path | HIGH | Logical progression, each phase builds on previous |
| Scalability estimates | MEDIUM | Based on typical Supabase/Vercel limits, not verified |
| Component boundaries | HIGH | Clear separation between client/server, well-defined |

**Verification needed:**
- [ ] Next.js 15+ App Router changes (if any since Jan 2025)
- [ ] Supabase SSR package API (may have changed)
- [ ] Vercel Cron pricing/limits for 2026
- [ ] Google Sheets API rate limits (current quotas)

---

## Sources

**Note:** Unable to verify with current documentation (no WebSearch/Context7 access).

Sources used:
- Next.js App Router documentation (training data, Jan 2025)
- Supabase documentation (training data, Jan 2025)
- Google Sheets API v4 reference (training data)
- Existing codebase analysis (`App.tsx`, `types.ts`, `components/`)

**Recommended verification sources:**
- https://nextjs.org/docs/app (official Next.js docs)
- https://supabase.com/docs/guides/auth/server-side/nextjs (Supabase + Next.js guide)
- https://developers.google.com/sheets/api/guides/concepts (Sheets API)
- https://vercel.com/docs/cron-jobs (Vercel Cron)
