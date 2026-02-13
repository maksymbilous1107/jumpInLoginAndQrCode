# JumpIn QR Check-In

## What This Is

A lightweight SaaS webapp for event check-in via QR code scanning. Users register with their personal and school info, view their profile on a dashboard, and scan a QR code to record attendance. Data syncs to Supabase (primary) and Google Sheets (backup/admin view). Built for the Rimini school community with a glassmorphism UI in Italian.

## Core Value

Users can scan a QR code to instantly check in, with their attendance reliably recorded in both Supabase and Google Sheets.

## Requirements

### Validated

- ✓ Glassmorphism UI design (login, register, dashboard views) — existing
- ✓ School dropdown with Rimini schools + "Altro" with custom input — existing
- ✓ QR code scanning via html5-qrcode with camera access — existing
- ✓ Component structure (GlassCard, Dashboard, QRScanner) — existing
- ✓ Italian language UI — existing

### Active

- [ ] Migrate from React+Vite to Next.js (App Router)
- [ ] Supabase Auth integration (email/password)
- [ ] Supabase profiles table (id, first_name, last_name, email, school, dob, last_checkin)
- [ ] Registration creates Supabase Auth user + profiles row + Google Sheets row
- [ ] Login authenticates via Supabase Auth
- [ ] Dashboard displays user profile from Supabase (read-only)
- [ ] QR scan triggers check-in: updates last_checkin timestamp in Supabase + Google Sheets
- [ ] Google Sheets sync via Next.js API routes (Service Account)
- [ ] Session persistence across browser refresh via Supabase session
- [ ] Logout clears Supabase session

### Out of Scope

- PWA / offline support — deferred, not needed for v1
- QR code content validation — QR content will be defined later; for now any scan triggers check-in
- Profile editing — data is read-only per PRD
- OAuth / social login — email/password sufficient for v1
- Push notifications — not needed for v1
- Deployment to Vercel — code should be Vercel-ready but actual deployment is manual/later

## Context

**Existing codebase:** React 19 + Vite SPA with glassmorphism design fully implemented. Currently uses mock authentication (hardcoded credentials) and localStorage for data persistence. The frontend design, component structure, school dropdown, and QR scanning are all working — the task is to wire up real backend services.

**Target architecture:** Next.js with App Router, Supabase for auth + database, Google Sheets API for backup/admin sync via Next.js API routes.

**External services status:**
- Supabase project: TODO — not yet created
- Google Service Account: TODO — not yet set up
- Google Spreadsheet: TODO — not yet created

The code must be ready to connect when credentials are provided via environment variables.

**User base:** Students from Rimini-area schools checking in to JumpIn events.

## Constraints

- **Tech stack**: Next.js, Supabase, Google Sheets API, html5-qrcode — per PRD
- **Design**: Glassmorphism style already implemented — preserve existing look and feel
- **Language**: Italian UI — all user-facing text in Italian
- **Data sync**: Every write (registration, check-in) must update both Supabase and Google Sheets
- **Security**: Google Sheets credentials must never be exposed client-side (use API routes)
- **Mobile-first**: All interactive elements min 44px height, camera modal full-screen on mobile

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate Vite → Next.js | Need server-side API routes for Google Sheets integration, Vercel deployment alignment | — Pending |
| Supabase for auth + DB | Provides Auth, Postgres, and real-time — matches PRD requirements | — Pending |
| Google Sheets as backup | Admin/organizer view without needing a separate admin panel | — Pending |
| Skip PWA for v1 | Reduces scope, webapp is sufficient for event check-in | — Pending |
| Any QR triggers check-in | QR content validation deferred to future iteration | — Pending |

---
*Last updated: 2026-02-13 after initialization*
