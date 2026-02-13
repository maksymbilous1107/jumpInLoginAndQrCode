# External Integrations

**Analysis Date:** 2026-02-13

## APIs & External Services

**Google Gemini API:**
- Reference: Mentioned in `vite.config.ts` and `README.md`
- Purpose: AI functionality (currently configured but not actively used in application code)
- SDK/Client: Native API client (configuration-ready)
- Auth: `GEMINI_API_KEY` environment variable
- Config Location: `.env.local` (required for setup, see `README.md` line 18)

## Data Storage

**Databases:**
- Local Storage only
  - Browser localStorage used for client-side user session persistence
  - Key: `jumpin_user` - Stores serialized `UserProfile` object
  - Located in: `App.tsx` lines 25-30, 49, 73, 81, 92

**File Storage:**
- Local filesystem only - No external file storage

**Caching:**
- None - No external caching service

## Authentication & Identity

**Auth Provider:**
- Custom mock implementation (development only)

**Implementation:**
- Login: Hardcoded demo credentials in `App.tsx` line 38
  - Email: `demo@example.com`
  - Password: `password123`
- Registration: Creates mock user with client-generated ID in `App.tsx` line 63
- Session: Stored in browser localStorage under key `jumpin_user`
- Profile data structure: `UserProfile` interface defined in `types.ts`

## Hardware & Media Integration

**Camera Access:**
- Platform: Requested in `metadata.json` (lines 4-6)
- Implementation: `Html5QrcodeScanner` from `html5-qrcode` library
- Location: `components/QRScanner.tsx`
- Permissions: Requires camera permission from browser/device
- Vibration API: Optional haptic feedback via `navigator.vibrate()` in `Dashboard.tsx` line 25

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console errors only - Basic error handling in `QRScanner.tsx` line 36
  - Catches scanner cleanup errors during component unmount
- No external logging service

## CI/CD & Deployment

**Hosting:**
- Static hosting required (no backend)
- Vite-built SPA deployment
- Build output: Vite `build` command generates static files

**CI Pipeline:**
- None configured

**Deployment:**
- Build command: `npm run build`
- Compatible with Vercel, Netlify, GitHub Pages, or any static host

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - Google Gemini API key (referenced in `vite.config.ts` line 14-15)

**Local Development:**
- File: `.env.local` (must be created locally)
- Not committed to git (in `.gitignore`)
- See `README.md` for setup instructions

**Secrets Location:**
- `.env.local` - Local file (development only)
- Not stored in repository

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## External CSS & Fonts

**CDN Resources:**
- Tailwind CSS: `https://cdn.tailwindcss.com` (loaded in `index.html` line 8)
- Google Fonts:
  - Montserrat: `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700...`
  - Inter: `...family=Inter:wght@300;400;500;600...`
  - Loaded in `index.html` line 9

## Import Maps (Browser-Based Module Resolution)

**Configured in `index.html` (lines 104-114):**
- `react@^19.2.4` → `https://esm.sh/react@^19.2.4`
- `react-dom/` → `https://esm.sh/react-dom@^19.2.4/`
- `react/` → `https://esm.sh/react@^19.2.4/`
- `lucide-react@^0.563.0` → `https://esm.sh/lucide-react@^0.563.0`
- `html5-qrcode@^2.3.8` → `https://esm.sh/html5-qrcode@^2.3.8`

Note: Import maps enable ES module resolution for packages served via esm.sh CDN.

---

*Integration audit: 2026-02-13*
