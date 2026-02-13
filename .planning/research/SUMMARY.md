# Project Research Summary

**Project:** JumpIn QR Check-In System
**Domain:** Event attendance / check-in management (educational context)
**Researched:** 2026-02-13
**Confidence:** MEDIUM

## Executive Summary

JumpIn is a QR check-in web application for Rimini schools that needs migration from a React+Vite SPA to Next.js App Router with production-ready authentication and data persistence. The existing frontend (glassmorphism UI, QR scanner, basic forms) works but uses localStorage mocks for auth and doesn't persist data. The recommended migration path uses Next.js 15 App Router with Supabase for authentication and database, Google Sheets API for backup/admin views, and Vercel for deployment.

The critical architectural shift is from client-only SPA to strategic server/client boundaries. Server Components handle data fetching and auth checks, while Client Components remain only for interactive features (QR scanner, form state). This requires careful auth state management using cookies (not localStorage) and understanding Next.js hydration patterns. The dual-write strategy (Supabase primary, Sheets backup) must be designed for eventual consistency, not blocking operations.

Key risks are auth hydration mismatches during migration, dual-write consistency failures between Supabase and Sheets, and Google Sheets API rate limiting during high-traffic events. These are mitigated by using Supabase's SSR package properly, implementing async queued writes with fallback sync, and batching Sheets operations to stay within quota limits. The migration complexity is medium (2-3 major phases) with well-documented patterns for each technology component.

## Key Findings

### Recommended Stack

Migration from React+Vite SPA to Next.js 15 App Router maintains React 19 compatibility while adding SSR capabilities and production infrastructure. The stack leverages established patterns with clear documentation paths.

**Core technologies:**
- **Next.js 15 App Router**: Full-stack React framework with RSC for reduced bundle size and built-in API routes for server-side logic
- **Supabase (@supabase/ssr)**: Production-ready PostgreSQL auth with RLS policies, real-time subscriptions, handles SSR cookie management
- **Google Sheets API (googleapis v137+)**: Official client for backup/admin spreadsheet sync using service account authentication
- **Vercel**: Zero-config deployment optimized for Next.js with edge middleware support and built-in HTTPS
- **Supporting libraries**: Zod for validation, date-fns for Italian locale formatting, react-hot-toast for user feedback

**Keep from existing:**
- React 19.2.4 (already in use, Next.js compatible)
- html5-qrcode (cross-browser QR scanning, works with 'use client' directive)
- Tailwind CSS + glassmorphism styling (Next.js compatible)
- lucide-react icons (Next.js compatible)

**Critical version note:** Next.js 15 was in development at Jan 2025 knowledge cutoff. Verify current stable version before starting migration.

### Expected Features

Research identifies clear table stakes requirements and differentiators based on event attendance system patterns.

**Must have (table stakes):**
- User authentication (replace localStorage mock with real Supabase auth)
- User profile storage (persist registration data beyond browser session)
- Event management (CRUD operations for events with QR codes)
- QR code generation (unique codes per event)
- Check-in recording (write attendance to Supabase with timestamp)
- Duplicate prevention (cannot check in twice to same event)
- Attendance history (user view of past check-ins)
- Basic error handling (network failures, invalid QR codes)

**Should have (differentiators):**
- Dual storage Supabase + Sheets (resilience + admin spreadsheet familiarity)
- Real-time dashboard updates (live check-in counts via Supabase subscriptions)
- Check-in time restrictions (QR only valid during event window)
- Admin role separation (RBAC using Supabase RLS)
- School-scoped events (users only see their school's events)
- Attendance export (CSV download for record-keeping)
- Event check-in statistics (aggregate attendance metrics)

**Defer (v2+):**
- Offline check-in queue (high complexity, add based on connectivity feedback)
- Check-in notifications (email/push requires external service integration)
- Bulk user import (admin convenience, can manually enter initially)
- Advanced admin dashboard (Sheets sufficient for MVP)

**Explicitly exclude (anti-features):**
- Check-out tracking (adds complexity, not requested)
- In-app messaging (scope creep, not core attendance function)
- Social features (not relevant to attendance use case)
- Payment processing (events are free school activities)
- Multi-language support (Rimini context suggests Italian only)
- Gamification (inappropriate for mandatory school events)

### Architecture Approach

The architecture shifts from client-only SPA to strategic server/client boundaries with clear separation between Next.js App Router layers, Supabase as primary data store, and Google Sheets as async backup.

**Major components:**
1. **Server Components** (Dashboard, profile pages) — Handle data fetching directly from Supabase, no client bundle overhead, render auth-protected content
2. **Client Components** (QR scanner, interactive forms) — Marked with 'use client', handle camera access, form state, and user interactions
3. **API Route Handlers** (/api/checkin, /api/sheets-sync) — Server-side logic for check-in processing with dual-write orchestration and Sheets sync cron
4. **Middleware** (auth verification) — Edge-deployed route protection, validates Supabase session from cookies, redirects unauthenticated users
5. **Supabase Client Layer** (server.ts, client.ts) — Singleton utilities using @supabase/ssr for cookie-based auth across server/client boundary
6. **Google Sheets Client** (sheets.ts) — Server-only SDK for async append operations with service account credentials

**Key patterns:**
- **Server Components by default**: Only mark components 'use client' when needed (hooks, browser APIs, camera)
- **Server Actions for mutations**: Use for login/register forms instead of manual API routes
- **Dual-write with fallback**: Write to Supabase immediately (blocking), write to Sheets async (non-blocking), cron catches failures
- **Middleware for route protection**: Verify auth before rendering, not client-side redirects
- **Cookie-based sessions**: Use @supabase/ssr cookie handling, not localStorage (SSR requirement)

**Data flow:**
- Registration: Form → Server Action → Supabase Auth → Profile table trigger → Redirect
- Check-in: QR scan (client) → POST /api/checkin → Supabase write (blocking) → Sheets append (async) → Response
- Dashboard: Server Component → Supabase query (server-side) → Render with data → Hydrate

### Critical Pitfalls

Research identifies eight high-priority pitfalls based on Next.js migration patterns and dual-write integration complexity.

1. **Auth State Hydration Mismatch** (Phase 1) — Server doesn't have localStorage/cookies on first render, causes "text content did not match" errors and FOUC. Solution: Use @supabase/ssr's createServerClient properly, always render loading states on server, move auth checks to Server Components or middleware.

2. **Client Component Usage Explosion** (Phase 1) — Adding 'use client' to every file defeats App Router purpose, increases bundle size, exposes secrets. Solution: Default to Server Components, only mark interactive components as client, use server wrapper + client presenter pattern.

3. **Dual-Write Consistency Failure** (Phase 2) — Supabase succeeds but Sheets fails creates data inconsistency. Solution: Supabase is source of truth, Sheets is best-effort async with queued retry, implement reconciliation endpoint for admin sync.

4. **Google Sheets API Credential Exposure** (Phase 2) — Private key in client code grants full access to anyone. Solution: All Sheets operations only in API routes, never use NEXT_PUBLIC_ prefix for secrets, store service account credentials in environment variables not JSON files.

5. **Cookies vs localStorage Auth Incompatibility** (Phase 1) — Existing localStorage auth breaks in SSR because server can't access it. Solution: Migrate to cookie-based Supabase auth using @supabase/ssr, remove all localStorage.getItem('jumpin_user') code, configure middleware with cookie access.

6. **Google Sheets API Rate Limiting** (Phase 2) — 100 requests per 100 seconds causes check-in failures during mass events. Solution: Implement batched writes with queue system, exponential backoff for retries, async processing that doesn't block user operations.

7. **Route Segment Configuration Forgotten** (Phase 1) — App Router defaults to static rendering where possible, causes stale data in dashboard. Solution: Add 'export const dynamic = force-dynamic' to user-specific pages, understand when routes cache vs revalidate.

8. **Next.js Middleware Infinite Redirects** (Phase 1) — Protecting /login route in middleware creates redirect loop. Solution: Exclude public routes from middleware checks, use matcher config to only run on protected paths.

## Implications for Roadmap

Based on research, suggested phase structure follows logical dependency chain while addressing critical pitfalls early:

### Phase 1: Next.js Migration + Auth Foundation
**Rationale:** Must establish Next.js App Router structure and real authentication before any backend integration. Addresses the most critical migration pitfalls (hydration, client/server boundaries, cookies vs localStorage) that affect every subsequent phase.

**Delivers:**
- Working Next.js App Router app with existing UI components
- Supabase Auth replacing localStorage mock
- Cookie-based session management
- Middleware route protection for dashboard
- Strategic client/server component boundaries

**Addresses features:**
- User authentication (table stakes)
- Route protection (security requirement)
- Foundation for all data persistence

**Avoids pitfalls:**
- #1 Auth hydration mismatch (critical)
- #2 Client component explosion (architectural)
- #5 Cookies vs localStorage (auth blocker)
- #7 Route configuration (data staleness)
- #8 Middleware redirects (infinite loops)

**Research flag:** Standard patterns, well-documented Next.js + Supabase auth flow. Skip phase-specific research.

---

### Phase 2: Database + Check-In Core
**Rationale:** With auth foundation solid, add persistence layer and core functionality. This phase must implement dual-write pattern correctly from the start to avoid consistency issues later.

**Delivers:**
- Supabase database schema (profiles, events, check_ins tables)
- Check-in API route with validation
- QR scanner connected to backend
- Basic dashboard showing user's check-in history
- Event management (CRUD operations)
- Duplicate check-in prevention

**Addresses features:**
- User profile storage (table stakes)
- Check-in recording (core functionality)
- Event management (table stakes)
- Attendance history (table stakes)
- QR code generation (table stakes)
- Duplicate prevention (table stakes)

**Avoids pitfalls:**
- #3 Dual-write consistency (design pattern from start)
- #6 Sheets rate limiting (non-blocking async pattern)
- #10 TypeScript any types (generate Supabase types)
- #11 Camera permissions (HTTPS requirement, iOS testing)

**Research flag:** Minimal research needed. QR code format needs clarification (what data is encoded?). Multi-location support unclear (single venue or multiple?). Both are requirements questions, not technical research.

---

### Phase 3: Google Sheets Integration
**Rationale:** With core check-in functionality working and tested, add backup/admin layer. This is intentionally separated from Phase 2 to isolate Sheets-specific complexity and allow core functionality to stabilize first.

**Delivers:**
- Google Sheets service account setup
- Async Sheets append in check-in flow
- Cron job for reconciliation sync
- Admin spreadsheet view with real-time data
- Error handling and retry logic for Sheets failures

**Addresses features:**
- Dual storage Supabase + Sheets (differentiator)
- Admin-friendly spreadsheet view
- Backup resilience

**Avoids pitfalls:**
- #4 Credential exposure (API routes only, env vars)
- #6 Rate limiting (batch operations, queue system)
- #3 Consistency (fallback sync, reconciliation)

**Research flag:** Standard patterns for googleapis service account auth. Skip phase-specific research. May need to verify current quota limits if high-traffic events are expected.

---

### Phase 4: Admin Features + Polish
**Rationale:** With core MVP functional, add admin capabilities and user experience improvements. These are valuable but not blocking for basic usage.

**Delivers:**
- Admin role separation (RBAC with Supabase RLS)
- School-scoped event filtering
- Real-time dashboard updates (Supabase subscriptions)
- Check-in time restrictions
- Event statistics/analytics
- Attendance export (CSV)
- Italian date formatting (date-fns)
- Error messages and user feedback polish

**Addresses features:**
- Admin role separation (differentiator)
- School-scoped events (differentiator)
- Real-time updates (differentiator)
- Time restrictions (differentiator)
- Statistics (differentiator)
- Attendance export (differentiator)

**Avoids pitfalls:**
- #9 Supabase client duplication (singleton pattern)
- #12 Date formatting hydration (consistent locale)

**Research flag:** Supabase RLS policy patterns may need phase-specific research if complex permission requirements emerge. Real-time subscriptions are well-documented, skip research.

---

### Phase Ordering Rationale

**Dependency chain:**
```
Auth foundation (Phase 1)
    ↓
Database schema + profiles (Phase 2)
    ↓
Check-in recording (Phase 2)
    ↓
Sheets backup (Phase 3)
    ↓
Admin features (Phase 4)
```

**Why this order:**
1. **Auth before database**: Can't create profiles without auth system, server/client boundaries must be correct before data fetching
2. **Core functionality before backup**: Supabase check-ins must work reliably before adding Sheets complexity, easier to debug single system
3. **MVP before polish**: Real-time updates and admin features are valuable but not blocking for basic check-in workflow
4. **Critical pitfalls first**: Phase 1 addresses 5 of 8 critical pitfalls (hydration, client boundaries, cookies, route config, middleware) that would block all subsequent work
5. **Test each integration**: Separating Sheets (Phase 3) from core check-in (Phase 2) allows thorough testing of dual-write pattern without rushing

**Parallel opportunities:**
- UI polish (glassmorphism refinement) can happen alongside Phase 2 backend work
- Admin spreadsheet formatting can be designed during Phase 2, implemented in Phase 3
- Documentation and testing can progress continuously

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Admin Features):** If complex multi-role permission requirements emerge beyond simple admin/user split, may need research into Supabase RLS patterns and edge cases.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Next.js Migration):** Next.js App Router migration is well-documented, Supabase Auth + Next.js guide is comprehensive
- **Phase 2 (Database + Check-In):** Standard CRUD patterns, Supabase client usage is documented, html5-qrcode integration is proven
- **Phase 3 (Sheets Integration):** googleapis service account pattern is standard, dual-write strategies are established

**Open questions for requirements clarification (not research):**
- QR code format: What data is encoded? (user ID, event ID, timestamp?)
- Multi-location support: Single venue or multiple check-in locations per event?
- Admin dashboard scope: Separate in-app admin UI or is Sheets sufficient?
- Offline support: Is PWA with sync later a requirement or nice-to-have?

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | MEDIUM | Next.js 15 was in development at Jan 2025 cutoff, @supabase/ssr package may have updates. Core technologies (React 19, Supabase Auth, googleapis) are stable. Verify Next.js version and Supabase SSR package current API. |
| **Features** | MEDIUM | Table stakes features identified from common event attendance patterns, differentiators based on dual-storage requirement. Not verified against 2026 Rimini school-specific needs or current SOTA features. |
| **Architecture** | HIGH | Migration path is logical, component boundaries are clear, dual-write pattern is established. Server/client split follows Next.js App Router best practices. Build order dependency chain is sound. |
| **Pitfalls** | HIGH | Migration pitfalls verified with Next.js 16.1.6 official docs (2026-02-11). Auth hydration, client boundaries, and middleware patterns are well-documented. Dual-write and rate limiting pitfalls based on common integration patterns. |

**Overall confidence:** MEDIUM

Confidence is medium rather than high due to:
1. Version uncertainty: Next.js 15 status unclear, @supabase/ssr API may have changed since Jan 2025
2. No external verification: Context7/WebSearch unavailable, couldn't verify with current official docs or community sources
3. Domain specifics: Rimini school requirements and Italian compliance needs not verified
4. Supabase SSR details: Official docs fetch was blocked, implementation details based on training data

Confidence is not low because:
1. Architecture patterns are sound and follow established practices
2. Technology choices are mainstream with large communities
3. Migration path is logical with clear phase dependencies
4. Critical pitfalls identified from official Next.js docs (2026-02-11)

### Gaps to Address

**Technical verification needed before Phase 1:**
- [ ] Next.js current stable version (15.x or 14.x?)
- [ ] @supabase/ssr package current API (createServerClient, createBrowserClient)
- [ ] Vercel free tier limits for expected traffic (school events = 50-200 simultaneous users?)
- [ ] googleapis package current version (137.x was Jan 2025)

**Requirements clarification needed:**
- [ ] QR code content format: Confirm what data is encoded (affects validation logic)
- [ ] Multi-location support: Single venue or multiple check-in points? (affects schema)
- [ ] Admin dashboard: In-app UI needed or is Sheets export sufficient? (affects Phase 4 scope)
- [ ] Compliance: Italian regulations for storing student data in Supabase (EU data centers)

**Phase-specific gaps:**
- **Phase 1:** Supabase SSR cookie configuration details (official docs blocked, verify during implementation)
- **Phase 2:** Offline fallback priority (defer to post-MVP or include in Phase 2 if connectivity is known issue)
- **Phase 3:** Google Sheets quotas for expected event scale (100 req/100s = 50 students checking in simultaneously works?)
- **Phase 4:** Real-time subscription performance at scale (Supabase free tier limits)

**How to handle:**
- Verification gaps: Check official docs at project start, update version numbers in STACK.md
- Requirements gaps: Clarify with stakeholders during Phase 0 (planning), document in requirements phase
- Phase-specific gaps: Research during phase planning (before sprint), not blocking for roadmap creation
- Performance unknowns: Build monitoring into Phase 2 (log queue lengths, API response times), optimize in Phase 4 based on data

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 App Router Migration Guide (official, 2026-02-11): https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration
- Existing codebase: /Users/fattorcomune/Programming/vibes/jumpInLogin (App.tsx, types.ts, components/) — confirms React 19, html5-qrcode, localStorage auth pattern

### Secondary (MEDIUM confidence)
- Next.js documentation (training data, Jan 2025): App Router patterns, Server Components, Server Actions
- Supabase documentation (training data, Jan 2025): Auth patterns, RLS policies, real-time subscriptions
- Google Sheets API v4 reference (training data): Service account auth, rate limits (100 req/100s), googleapis package
- Event attendance system patterns (training data): Common features, table stakes requirements

### Tertiary (LOW confidence, needs validation)
- @supabase/ssr package API (training data, Jan 2025) — official docs fetch blocked, verify current implementation
- Next.js 15 status (development/RC at Jan 2025 cutoff) — verify current stable version
- Vercel deployment limits (training data) — verify current pricing/quotas for hobby/pro tiers
- Rimini school specific requirements (inferred from context) — validate with stakeholders

### Attempted but unavailable
- Context7 library search: Not available during research
- WebSearch for current docs: Not available during research
- Supabase official Next.js guide: Fetch blocked, couldn't verify current SSR patterns

---

*Research completed: 2026-02-13*
*Ready for roadmap: Yes*

**Next step:** Roadmap creation using this summary as foundation. Phase structure suggested above can be starting point, refined during roadmap planning with detailed milestones and technical tasks.
