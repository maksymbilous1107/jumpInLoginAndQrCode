# Technology Stack

**Project:** JumpIn QR Check-In
**Migration:** React+Vite SPA → Next.js App Router + Supabase + Google Sheets
**Researched:** 2026-02-13
**Overall Confidence:** MEDIUM (based on training data through Jan 2025, requires verification)

## Executive Summary

Migrating from React+Vite SPA to Next.js App Router with Supabase authentication and Google Sheets integration. The recommended stack leverages Next.js 15+ with App Router for SSR/SSG capabilities, Supabase for authentication and database, Google Sheets API v4 for backup/admin views, and Vercel for deployment. This stack provides production-ready auth, real-time data sync, and maintains the existing React components with minimal refactoring.

**Key Migration Points:**
- Next.js App Router (not Pages Router) for modern React Server Components
- Supabase Auth with built-in session management
- Google Sheets API v4 with service account authentication
- Vercel-optimized deployment (zero-config)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Next.js** | 15.x | Full-stack React framework | App Router for RSC, built-in API routes, SSR/SSG, Vercel-optimized, maintains React 19 compatibility | MEDIUM* |
| **React** | 19.x | UI library | Already using 19.2.4, Next.js 15 supports React 19 | HIGH |
| **TypeScript** | 5.8.x | Type safety | Already configured, Next.js has excellent TS support | HIGH |

*Next.js 15 was in development/RC at my knowledge cutoff. Verify current stable version.

**Rationale:**
- **App Router over Pages Router:** RSC reduces client bundle, better data fetching patterns, native async components
- **Why Next.js over staying with Vite:** Need SSR for SEO, API routes for server-side auth logic, better production performance
- **React 19 compatibility:** Your existing components should migrate with minimal changes (keep html5-qrcode, lucide-react)

---

### Authentication & Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Supabase** | Latest | Auth + Postgres DB | Production-ready auth, RLS policies, real-time subscriptions, generous free tier | HIGH |
| **@supabase/supabase-js** | 2.x | Supabase client | Official client library | HIGH |
| **@supabase/ssr** | 0.x | Next.js SSR support | Handles auth cookies in RSC/middleware/route handlers | MEDIUM* |

*@supabase/ssr package was new at my knowledge cutoff. Verify this is the current recommended approach.

**Rationale:**
- **Supabase over Firebase:** Better Postgres integration, simpler RLS, better DX with SQL, EU data centers (closer to Rimini)
- **Supabase over Auth0/Clerk:** Free tier sufficient for school events, includes database, less vendor lock-in
- **@supabase/ssr package:** Critical for Next.js App Router - handles session management across server/client boundary

**Auth Configuration:**
```typescript
// Supabase supports:
// - Email/password (recommended for admin accounts)
// - Magic links (good for teachers - no password management)
// - OAuth (Google) if needed for @school.edu accounts
```

---

### Google Sheets Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **googleapis** | 137.x | Google Sheets API v4 | Official Google API client, supports service accounts | MEDIUM* |
| **google-auth-library** | (included in googleapis) | Service account auth | Required for server-side Sheets access | MEDIUM* |

*Version number based on Jan 2025 knowledge. Verify current stable version.

**Rationale:**
- **googleapis over google-spreadsheet:** Official library, more features, better maintained, supports all API v4 features
- **Service Account over OAuth:** Server-side access, no user consent flow, simpler for admin tools
- **API v4 over v3:** v3 deprecated, v4 supports batch operations, better performance

**Google Sheets Configuration:**
```typescript
// Service account setup:
// 1. Create service account in Google Cloud Console
// 2. Generate JSON key
// 3. Share spreadsheet with service account email
// 4. Store credentials in environment variables (not the JSON file)
```

---

### Styling (Keep Existing)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Tailwind CSS** | 3.x or 4.x | Utility-first CSS | Likely what you're using for glassmorphism, works perfectly with Next.js | HIGH |
| **lucide-react** | ^0.563.0 | Icons | Already using, Next.js compatible | HIGH |

**Note:** If you're using inline styles for glassmorphism, Tailwind can stay or be added. Your existing CSS approach should work in Next.js.

---

### QR Code Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **html5-qrcode** | ^2.3.8 | QR scanning | Already using, works in Next.js with 'use client' directive | HIGH |

**Migration Note:**
```typescript
// Mark QR scanner component as client component
'use client'

// Rest of your code stays the same
```

---

### Deployment

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| **Vercel** | Hosting + CI/CD | Zero-config Next.js deployment, edge functions, automatic HTTPS, git integration | HIGH |
| **Vercel Edge Config** (optional) | Feature flags | Fast global config without DB queries | MEDIUM |

**Rationale:**
- **Vercel over Netlify:** Built by Next.js team, better SSR performance, edge middleware support
- **Vercel over Railway/Render:** Simpler for Next.js, better DX, generous free tier for school project
- **Environment Variables:** Use Vercel's env vars UI for secrets (Supabase keys, Google service account)

---

### Development Tools

| Tool | Version | Purpose | Why | Confidence |
|------|---------|---------|-----|------------|
| **Prettier** | 3.x | Code formatting | Consistency, Vercel uses it | HIGH |
| **ESLint** | 9.x | Linting | Next.js includes eslint-config-next | HIGH |
| **Husky** (optional) | 9.x | Git hooks | Pre-commit linting/formatting | MEDIUM |

---

## Supporting Libraries

### Recommended Additions

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **zod** | 3.x | Schema validation | Validate QR data, API inputs, env vars | HIGH |
| **date-fns** | 3.x | Date utilities | Format timestamps, handle Italian locale | HIGH |
| **react-hot-toast** | 2.x | Toast notifications | Check-in confirmations, error messages | HIGH |
| **@tanstack/react-query** | 5.x | Data fetching/caching | Optional: manage Supabase queries, handle optimistic UI | MEDIUM |

**Rationale:**
- **zod:** TypeScript-first validation, works great with Next.js server actions, validates env vars at build time
- **date-fns over moment.js:** Smaller bundle, tree-shakeable, better TS support
- **react-hot-toast over sonner:** Simpler API, smaller bundle, sufficient for toast needs
- **React Query:** Optional but recommended if you need optimistic UI updates for check-ins

### Optional (Not Recommended for V1)

| Library | Why Skip |
|---------|----------|
| **NextAuth.js** | Redundant with Supabase Auth, adds complexity |
| **Prisma** | Supabase client is sufficient, Prisma adds ORM layer overhead |
| **tRPC** | Overkill for this project size, Next.js API routes + zod is enough |
| **Shadcn/UI** | Your glassmorphism design is custom, component library adds unused code |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not | Confidence |
|----------|-------------|-------------|---------|------------|
| **Framework** | Next.js 15 App Router | Remix | Smaller ecosystem, less Vercel optimization | MEDIUM |
| **Framework** | Next.js 15 App Router | Next.js Pages Router | Outdated pattern, App Router is the future | HIGH |
| **Auth** | Supabase | NextAuth.js | More complex setup, need separate DB anyway | HIGH |
| **Auth** | Supabase | Clerk | More expensive at scale, overkill for school events | MEDIUM |
| **Sheets** | googleapis | google-spreadsheet | Wrapper library, less control, smaller community | HIGH |
| **Hosting** | Vercel | Netlify | Less optimized for Next.js SSR/ISR | HIGH |
| **Hosting** | Vercel | Cloudflare Pages | Next.js support is limited, some features unsupported | MEDIUM* |

*Cloudflare Pages Next.js support was improving at my knowledge cutoff. Verify current status if cost is a concern.

---

## Migration Path: Vite → Next.js

### Phase 1: Next.js Setup
```bash
# Install Next.js dependencies
npm install next@latest react@latest react-dom@latest

# Install Supabase
npm install @supabase/supabase-js @supabase/ssr

# Install Google Sheets
npm install googleapis

# Install utilities
npm install zod date-fns react-hot-toast

# Dev dependencies
npm install -D @types/react @types/react-dom eslint-config-next
```

### Phase 2: File Structure Migration
```
Old (Vite):               New (Next.js App Router):
src/
  components/          →  app/
  App.tsx                   layout.tsx
  main.tsx                  page.tsx
                           components/
                           lib/
                             supabase.ts
                             sheets.ts
                           api/
                             [...api routes]
```

### Phase 3: Component Migration
- Add `'use client'` to components using hooks, html5-qrcode, browser APIs
- Move auth logic to Supabase client
- Convert routes to Next.js app directory structure
- Keep existing CSS/styling approach

### Phase 4: Environment Variables
```bash
# .env.local (not committed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-side only
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
```

---

## Package.json Changes

### Remove
```json
"vite": "^6.2.0",
"@vitejs/plugin-react": "^5.0.0"
```

### Add
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "googleapis": "^137.0.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

---

## Configuration Files

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel auto-configures most settings
  reactStrictMode: true,

  // If using images from external sources
  images: {
    domains: [], // Add if needed
  },

  // For Italian locale
  i18n: {
    locales: ['it'],
    defaultLocale: 'it',
  },
}

module.exports = nextConfig
```

### tsconfig.json Updates
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Next.js Core** | MEDIUM | Version 15 was in development at my cutoff, verify current stable |
| **Supabase Integration** | HIGH | Well-established pattern, @supabase/ssr is key package |
| **Google Sheets API** | HIGH | googleapis is stable, v4 API is current |
| **React 19 Compatibility** | HIGH | You're already using 19.2.4, Next.js supports it |
| **Vercel Deployment** | HIGH | Standard deployment target for Next.js |
| **Migration Approach** | HIGH | App Router is the documented migration path |

---

## Critical Verification Needed

**BEFORE starting migration, verify:**

1. **Next.js version:** Check if 15.x is stable or if 14.x is current production recommendation
2. **@supabase/ssr:** Confirm this is still the recommended package for Next.js App Router auth
3. **googleapis version:** Verify current stable version (137.x was latest at my cutoff)
4. **Vercel free tier limits:** Confirm sufficient for school event traffic patterns
5. **React 19 + Next.js:** Verify no breaking changes in Next.js React 19 support

**Official documentation sources:**
- Next.js: https://nextjs.org/docs
- Supabase Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Google Sheets API: https://developers.google.com/sheets/api/guides/concepts
- Vercel deployment: https://vercel.com/docs/frameworks/nextjs

---

## Anti-Patterns to Avoid

### ❌ DON'T: Mix Pages Router and App Router
**Why:** Causes confusion, doubles bundle size, incompatible patterns
**Instead:** Full migration to App Router (it's the future)

### ❌ DON'T: Use Supabase client directly in Server Components
**Why:** Auth cookies won't work, session management breaks
**Instead:** Use @supabase/ssr's createServerClient in Server Components

### ❌ DON'T: Commit Google service account JSON key
**Why:** Security risk, credential leak
**Instead:** Extract values to environment variables

### ❌ DON'T: Use 'use client' everywhere
**Why:** Loses RSC benefits, increases client bundle
**Instead:** Only mark components that use hooks, browser APIs, or client-side libraries

### ❌ DON'T: Store secrets in NEXT_PUBLIC_ env vars
**Why:** Exposed to client bundle
**Instead:** Use NEXT_PUBLIC_ only for public keys (Supabase anon key), keep service keys private

---

## Installation Script

```bash
#!/bin/bash
# Migration script for JumpIn QR Check-In

echo "📦 Installing Next.js dependencies..."
npm install next@latest react@latest react-dom@latest

echo "🔐 Installing Supabase..."
npm install @supabase/supabase-js @supabase/ssr

echo "📊 Installing Google Sheets API..."
npm install googleapis

echo "🛠️ Installing utilities..."
npm install zod date-fns react-hot-toast

echo "🧹 Installing dev dependencies..."
npm install -D eslint-config-next

echo "🗑️ Removing Vite dependencies..."
npm uninstall vite @vitejs/plugin-react

echo "✅ Dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Create .env.local with Supabase and Google credentials"
echo "2. Create app/ directory structure"
echo "3. Migrate components (add 'use client' where needed)"
echo "4. Update scripts in package.json"
echo "5. Delete vite.config.ts"
echo "6. Create next.config.js"
```

---

## Stack Decision Summary

**Core:** Next.js 15 App Router + TypeScript 5.8
**Auth & DB:** Supabase (via @supabase/ssr)
**Integration:** googleapis for Sheets API v4
**Deployment:** Vercel
**Keep from existing:** React 19, html5-qrcode, lucide-react, glassmorphism styling

**Migration complexity:** Medium (file restructure, auth integration, client/server boundary)
**Timeline estimate:** 2-3 phases in roadmap (setup, migration, integration)

---

## Sources

**Note:** This research is based on training data through January 2025. Version numbers and package recommendations should be verified against current official documentation:

- Next.js Documentation: https://nextjs.org/docs (verify App Router current patterns)
- Supabase Next.js Guide: https://supabase.com/docs/guides/auth/server-side/nextjs (verify @supabase/ssr usage)
- Google Sheets API: https://developers.google.com/sheets/api (verify googleapis package version)
- Vercel Next.js Deployment: https://vercel.com/docs/frameworks/nextjs (verify deployment best practices)

**Confidence note:** Without access to Context7 or WebSearch tools, this research relies entirely on training data. All version numbers and package recommendations marked MEDIUM confidence should be verified before implementation.
