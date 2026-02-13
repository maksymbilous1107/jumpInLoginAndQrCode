# Technology Stack

**Analysis Date:** 2026-02-13

## Languages

**Primary:**
- TypeScript ~5.8.2 - Type-safe development for all application code
- JavaScript (ES2022) - Runtime target and configuration files
- HTML5 - Page markup and structure

**Secondary:**
- CSS - Inline styles via Tailwind CSS

## Runtime

**Environment:**
- Node.js - Server-side runtime for development and build processes

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.4 - UI framework and component library

**Build/Dev:**
- Vite 6.2.0 - Fast build tool and development server
  - Config: `vite.config.ts`
  - Dev server runs on port 3000 (host 0.0.0.0)
- @vitejs/plugin-react 5.0.0 - React integration for Vite

**Styling:**
- Tailwind CSS (CDN) - Utility-first CSS framework loaded via CDN in `index.html`
- Custom CSS - Inline styles defined in `index.html` for glassmorphism effects

## Key Dependencies

**Critical:**
- react-dom 19.2.4 - React DOM rendering library
- html5-qrcode 2.3.8 - QR code scanning library for camera-based QR detection
- lucide-react 0.563.0 - Icon library with 500+ SVG icons

**UI & Components:**
- No external component library - Custom components built from scratch

**Type Definitions:**
- @types/node 22.14.0 - Node.js type definitions for development

## Configuration

**Environment:**
- `.env.local` - Local environment configuration (required for development)
  - `GEMINI_API_KEY` - Google Gemini API key (referenced in `vite.config.ts` via `process.env.GEMINI_API_KEY`)
  - Currently exposed via `define` configuration in Vite for client-side access
- Vite environment loading via `loadEnv()` in `vite.config.ts`

**Build:**
- `vite.config.ts` - Vite configuration
  - React plugin enabled
  - Path alias: `@/*` resolves to project root
  - Environment variables exposed to client via `define`
- `tsconfig.json` - TypeScript configuration
  - Target: ES2022
  - Module: ESNext
  - JSX: react-jsx (automatic transform)
  - Path alias support for `@/` imports
  - Strict module detection and isolated modules enabled

**Fonts:**
- Montserrat (400, 600, 700) - Headings and display text
- Inter (300, 400, 500, 600) - Body text
- Loaded via Google Fonts CDN in `index.html`

## Platform Requirements

**Development:**
- Node.js (required)
- Modern browser with camera API support (for QR scanning)
- `.env.local` file with Gemini API credentials

**Production:**
- Static hosting capable of serving SPA
- Browser with camera/media permissions support
- ES2022 JavaScript support

## Scripts

**Available Commands:**
- `npm run dev` - Start Vite development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

---

*Stack analysis: 2026-02-13*
