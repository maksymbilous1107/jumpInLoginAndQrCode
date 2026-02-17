# Phase 1: Next.js Foundation - Research

**Researched:** 2026-02-17
**Domain:** Next.js App Router migration from Vite
**Confidence:** HIGH

## Summary

Phase 1 involves migrating a Vite-based React TypeScript SPA to Next.js App Router while maintaining current functionality as a client-side application. The current project has a simple structure (6 TypeScript files in root, no src/ directory) with Tailwind CDN, Google Fonts CDN, and @/ path aliases pointing to the project root.

Next.js 15/16 (latest as of Feb 2026) provides first-class TypeScript support, built-in Tailwind CSS integration, automatic font optimization via next/font, and powerful App Router conventions. The migration strategy is to scaffold Next.js alongside the existing code, configure it as an SPA initially, then incrementally adopt Next.js features. This phase focuses solely on infrastructure: ensuring dev server runs, builds succeed, path aliases work, Tailwind applies, and fonts render.

**Primary recommendation:** Use `create-next-app` with TypeScript and Tailwind presets, configure as SPA with `output: 'export'`, migrate Google Fonts to `next/font/google`, keep existing folder structure colocated in `app/` directory, use Tailwind v3 (stable, project-ready) rather than v4 (breaking changes, not worth migration overhead for this phase).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None. User explicitly delegated all infrastructure decisions to Claude.

### Claude's Discretion
- **Route structure**: How to map existing views (login, register, dashboard) to Next.js App Router routes
- **Folder organization**: Where components, styles, utilities, and types live in the new project structure
- **Migration strategy**: Fresh Next.js scaffold alongside existing Vite code, or in-place replacement
- **TypeScript configuration**: Strict mode, path alias setup in tsconfig
- **Tailwind configuration**: How to port existing Tailwind config and custom styles (glassmorphism, mesh gradient)
- **Font loading**: next/font vs CDN for Montserrat and Inter
- **Package management**: Which dependencies to carry over, which to replace with Next.js equivalents

User explicitly delegated all infrastructure decisions to Claude. Optimize for clean migration and developer experience.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| **MIG-01** | Project scaffolded as Next.js App Router with TypeScript | `create-next-app` with TypeScript preset, App Router is default |
| **MIG-03** | Tailwind CSS configured via package (replace CDN) | Install `tailwindcss@^3 postcss autoprefixer`, configure `tailwind.config.js` with app directory paths |
| **MIG-04** | Google Fonts (Montserrat, Inter) loaded via Next.js font optimization | `next/font/google` with Montserrat and Inter, apply via className in root layout |
| **INF-01** | Vite config replaced with Next.js config (next.config.js) | Create `next.config.mjs` with basePath, output settings |
| **INF-02** | Path aliases (@/) configured for Next.js | `tsconfig.json` paths mapping with `baseUrl: "."` and `paths: { "@/*": ["./*"] }` |
| **INF-03** | Project builds successfully with `next build` | Verify with `npm run build` after migration, Next.js validates TypeScript and builds static assets |
| **INF-04** | Development server runs with `next dev` | Verify with `npm run dev` on port 3000, Turbopack is default bundler |
| **INF-05** | Project structure follows Next.js App Router conventions (app/ directory) | Create `app/layout.tsx` (required root layout), `app/page.tsx` (root route), colocate components in app directory |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1.6 (latest) | React framework with App Router | Official React framework, App Router is recommended default as of Next.js 13+ |
| React | ^19.2.4 (canary) | UI library | Next.js App Router uses React 19 canary with stable features |
| TypeScript | ~5.8.2 | Type safety | Built-in Next.js support, automatically configured via `next dev` |
| Tailwind CSS | ^3.4.x | Utility-first CSS | Official Next.js integration, v3 is stable and production-ready |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostCSS | Latest | CSS preprocessor | Required for Tailwind CSS processing |
| Autoprefixer | Latest | CSS vendor prefixing | Required for Tailwind CSS compatibility |
| ESLint | Latest | Code linting | Recommended by Next.js, `create-next-app` includes preset |
| Turbopack | Built-in | Development bundler | Default in Next.js 16, faster than Webpack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v3 | Tailwind v4 | v4 has 70% smaller bundle, 2-5x faster builds, BUT requires CSS-first config migration, breaking changes, plugin compatibility issues. NOT worth overhead for this phase. Stick with v3. |
| next/font | CDN fonts | CDN causes FOIT/FOUT, external network requests, privacy issues, layout shift. next/font self-hosts, eliminates network requests, prevents layout shift, automatically optimizes. ALWAYS prefer next/font. |
| `output: 'export'` SPA | Full App Router SSR | SPA mode simplifies initial migration, keeps client-side behavior unchanged. SSR requires refactoring data fetching, distinguishing Server/Client Components. SPA first, then incremental adoption. |

**Installation:**

```bash
# Create Next.js app (includes React, TypeScript, ESLint, Tailwind preset)
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"

# Or install Tailwind manually in existing Next.js project
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

## Architecture Patterns

### Recommended Project Structure (Colocated in app/)

Given the current project has only 6 source files (App.tsx, 3 components, constants.ts, types.ts) with no src/ directory, **colocate everything inside app/ directory** for simplicity:

```
app/
├── layout.tsx              # Root layout (REQUIRED) - wraps all pages, includes fonts and global CSS
├── page.tsx                # Root route (/) - entry point for application
├── globals.css             # Global styles (Tailwind directives, custom CSS)
├── components/             # UI components
│   ├── GlassCard.tsx
│   ├── Dashboard.tsx
│   └── QRScanner.tsx
├── lib/                    # Utilities and constants
│   ├── constants.ts        # Rimini schools, colors
│   └── types.ts            # TypeScript interfaces
└── fonts/                  # Font imports (optional, if using local fonts)

public/                     # Static assets (images, icons)

next.config.mjs             # Next.js configuration
tailwind.config.js          # Tailwind configuration
tsconfig.json               # TypeScript configuration
package.json                # Dependencies and scripts
```

**Rationale:**
- App Router allows component colocation (files are only routable if they're `page.tsx` or `route.ts`)
- Keeps migration simple: move existing files into `app/`, minimal restructuring
- `lib/` convention is widely used for utilities (vs. `utils/` or bare files in root)
- `components/` stays at app root for easy imports (`@/components/...`)
- NO src/ directory (current project doesn't use one, Next.js doesn't require it)

### Pattern 1: Root Layout with Fonts and Global Styles

**What:** The root layout is REQUIRED in Next.js App Router. It must export a React component that wraps all pages and includes `<html>` and `<body>` tags. This is where you apply global fonts and import global CSS.

**When to use:** Every Next.js App Router app (mandatory).

**Example:**
```tsx
// app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-montserrat',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-inter">{children}</body>
    </html>
  )
}
```

**Key points:**
- `next/font/google` automatically self-hosts fonts (downloads at build time, serves from same domain)
- `variable` option creates CSS variables (e.g., `--font-inter`) for use in Tailwind config
- Apply font variables to `<html>`, then use in Tailwind utilities or CSS
- Import `globals.css` here for Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)

### Pattern 2: Path Aliases Configuration

**What:** Next.js has built-in support for `tsconfig.json` path aliases. This allows `@/` imports instead of relative paths.

**When to use:** Always (improves import readability, easier refactoring).

**Example:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Key points:**
- `baseUrl: "."` makes paths relative to project root
- `@/*` maps to `./*` (entire project root)
- Next.js automatically recognizes this configuration (no additional config needed)
- Works for TypeScript AND JavaScript projects (use `jsconfig.json` for JS)

### Pattern 3: Tailwind Configuration for App Router

**What:** Tailwind v3 requires configuring content paths to scan for class names. With App Router, scan the `app/` directory.

**When to use:** When using Tailwind CSS with Next.js App Router.

**Example:**
```js
// tailwind.config.js
// Source: https://nextjs.org/docs/app/guides/tailwind-v3-css
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        montserrat: ['var(--font-montserrat)'],
      },
      colors: {
        'primary-orange': '#f97316',
        'primary-orange-light': '#fb923c',
      },
    },
  },
  plugins: [],
}
```

**Key points:**
- Include `app/**/*.{js,ts,jsx,tsx,mdx}` to scan all files in app directory
- Extend theme with custom fonts (using CSS variables from next/font)
- Extend theme with custom colors (preserving existing design system)
- Use `module.exports` (CommonJS) NOT `export default` (ESM) for Tailwind config

### Pattern 4: SPA Mode with `output: 'export'`

**What:** Configure Next.js to output a static SPA (no server-side rendering) for initial migration.

**When to use:** When migrating from Vite/CRA and want to preserve client-only behavior initially.

**Example:**
```js
// next.config.mjs
// Source: https://nextjs.org/docs/app/guides/migrating/from-vite
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  distDir: './dist', // Changes the build output directory to `./dist/`
}

export default nextConfig
```

**Key points:**
- `output: 'export'` generates static HTML/CSS/JS (like Vite build)
- Compatible with client-side routing, useEffect, useState (existing Vite behavior)
- Can later remove this to enable SSR/ISR/streaming (incremental adoption)
- Use `.mjs` extension for ESM syntax (`export default` instead of `module.exports`)

### Anti-Patterns to Avoid

- **DON'T use `'use client'` everywhere:** Next.js App Router components are Server Components by default. Only add `'use client'` to components using hooks (useState, useEffect) or browser APIs. For this phase, ALL existing components need `'use client'` (they use hooks), but avoid over-using it in future phases.

- **DON'T put components in `pages/` directory:** `pages/` is for Pages Router (legacy). App Router uses `app/` directory. Mixing them causes routing conflicts.

- **DON'T forget to import global CSS in layout:** Unlike Vite (imports in main.tsx), Next.js imports global CSS in `app/layout.tsx`. Forgetting this means Tailwind won't work.

- **DON'T use Tailwind CDN in production:** CDN causes flash of unstyled content (FOUC), larger bundle size, and version inconsistencies. Always use npm package.

- **DON'T modify `<head>` directly:** Next.js manages `<head>` via Metadata API. Use `metadata` export in layout.tsx instead of manual `<head>` tags.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font optimization | Manual font loading with link tags or @import | `next/font/google` or `next/font/local` | Font optimization is complex: subsetting, font-display strategy, preloading, FOUT/FOIT prevention, layout shift calculation. next/font handles all of this automatically. |
| Image optimization | `<img>` tags with manual responsive images | `next/image` (future phase) | Automatic lazy loading, WebP/AVIF conversion, responsive srcset generation, blur placeholder, layout shift prevention. |
| Path resolution | Maintaining relative paths (`../../components`) | TypeScript path aliases with `@/` | Relative paths break during refactoring, hard to read, error-prone. Path aliases are maintainable and refactor-safe. |
| CSS bundling | Manual PostCSS setup | Next.js built-in CSS support | Next.js includes PostCSS, CSS modules, Sass support out of the box. No need to configure loaders. |
| Environment variables | Custom env loading logic | `.env.local` with `NEXT_PUBLIC_` prefix | Next.js automatically loads `.env.local`, `.env.development`, `.env.production`. Client-side vars must have `NEXT_PUBLIC_` prefix for security. |

**Key insight:** Next.js provides production-grade solutions for common web performance problems. Resist the urge to "just use a CDN" or "manually optimize later." The framework's built-in solutions are battle-tested at scale.

## Common Pitfalls

### Pitfall 1: Misunderstanding Server Components by Default

**What goes wrong:** Developers add `'use client'` to every component because they're confused about the default behavior, or forget to add it to components that need client-side interactivity, causing "useState is not a function" errors.

**Why it happens:** App Router is a paradigm shift from traditional React. Components are Server Components by default (render on server, ship no JavaScript). Client Components need explicit `'use client'` directive.

**How to avoid:**
- For this phase: ALL existing components (App.tsx, Dashboard, QRScanner, GlassCard) need `'use client'` because they use useState, useEffect, or browser APIs.
- Mark components with `'use client'` at the TOP of the file (before imports).
- Server Components CAN import Client Components, but NOT vice versa.
- Use Server Components for static content, Client Components for interactivity.

**Warning signs:**
- Error: "You're importing a component that needs X. It only works in a Client Component but none of its parents are marked with 'use client'"
- Error: "useState is not defined"
- Hydration mismatches

**Reference:** [Common mistakes with the Next.js App Router and how to fix them - Vercel](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

### Pitfall 2: Incorrect Path Alias Configuration

**What goes wrong:** Path aliases don't resolve, causing "Module not found" errors, or resolve incorrectly pointing to wrong directories.

**Why it happens:**
- Forgetting to set `baseUrl` in tsconfig.json
- Paths being relative to `baseUrl` (not project root)
- Next.js and TypeScript having different path resolution
- Mixing absolute and relative paths

**How to avoid:**
- ALWAYS set `baseUrl: "."` in tsconfig.json (makes paths relative to project root)
- ALWAYS use `"@/*": ["./*"]` pattern for simplicity
- Verify aliases work by running `next dev` and importing a file with `@/` syntax
- Run `npm run dev` after changing tsconfig.json (Next.js rebuilds type info)

**Warning signs:**
- Error: "Module not found: Can't resolve '@/components/...'"
- TypeScript can't find imports even though files exist
- Imports work in VS Code but fail at runtime

**Reference:** [Configuring: Absolute Imports and Module Path Aliases | Next.js](https://nextjs.org/docs/app/building-your-application/configuring/absolute-imports-and-module-aliases)

### Pitfall 3: Forgetting to Import Global CSS in Root Layout

**What goes wrong:** Tailwind classes don't apply styling, page is unstyled, "unknown at-rule" warnings in CSS.

**Why it happens:** Vite imports CSS in `main.tsx` (entry point), but Next.js imports global CSS in `app/layout.tsx` (root layout). Developers forget this difference during migration.

**How to avoid:**
- ALWAYS import `globals.css` in `app/layout.tsx` (not in `page.tsx` or components)
- Ensure `globals.css` contains Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- Run `next dev` and check browser console for CSS errors
- Verify Tailwind classes work by adding `className="text-red-500"` to a component

**Warning signs:**
- Tailwind classes in devtools but no styles applied
- Missing `@tailwind` directives in compiled CSS
- Console warning: "The 'tailwindcss' plugin was not found"

**Reference:** [Guides: Tailwind CSS v3 | Next.js](https://nextjs.org/docs/app/guides/tailwind-v3-css)

### Pitfall 4: Using CDN Fonts in Production

**What goes wrong:** Fonts load slowly, FOUT (Flash of Unstyled Text) or FOIT (Flash of Invisible Text), layout shift, poor Core Web Vitals (LCP/CLS), privacy concerns (external requests to Google).

**Why it happens:** Developers copy existing HTML with CDN links, unaware of Next.js font optimization capabilities.

**How to avoid:**
- ALWAYS use `next/font/google` or `next/font/local` instead of CDN
- Remove ALL `<link>` tags pointing to fonts.googleapis.com or fonts.gstatic.com
- Import fonts in `app/layout.tsx` and apply via `className` or CSS variables
- Next.js downloads fonts at BUILD TIME and self-hosts them (no runtime network requests)

**Warning signs:**
- Network tab shows requests to fonts.googleapis.com or fonts.gstatic.com
- Fonts don't load when offline
- Lighthouse flags "Eliminate render-blocking resources" for font CDN
- Layout shift when fonts load

**Reference:** [Getting Started: Font Optimization | Next.js](https://nextjs.org/docs/app/getting-started/fonts)

### Pitfall 5: Missing Root Layout or Incorrect Structure

**What goes wrong:** Error: "The root layout is missing", or pages don't render, or `<html>` and `<body>` tags duplicated.

**Why it happens:** Root layout is REQUIRED in App Router but wasn't needed in Vite. Developers forget to create it or structure it incorrectly.

**How to avoid:**
- ALWAYS create `app/layout.tsx` (REQUIRED file)
- Root layout MUST return `<html>` and `<body>` tags (no other layout can)
- Root layout MUST export a default function named `RootLayout` (or any name, but convention is `RootLayout`)
- Root layout MUST accept `children` prop and render it inside `<body>`
- Run `next dev` — Next.js will auto-create layout if missing, but better to create it yourself

**Warning signs:**
- Error: "The root layout is missing. Make sure app/layout.tsx exists"
- Error: "You're trying to use <html> in a component that's not the root layout"
- Multiple `<html>` or `<body>` tags in devtools

**Reference:** [Getting Started: Layouts and Pages | Next.js](https://nextjs.org/docs/app/getting-started/layouts-and-pages)

### Pitfall 6: Port Conflicts (Vite vs Next.js)

**What goes wrong:** `npm run dev` fails with "Port 3000 is already in use" if Vite dev server is still running.

**Why it happens:** Both Vite and Next.js default to port 3000. During migration, both configs exist and can conflict.

**How to avoid:**
- Stop Vite dev server before running `next dev`
- Or configure Next.js to use different port in `package.json`: `"dev": "next dev -p 3001"`
- Or remove Vite config after migration is complete

**Warning signs:**
- Error: "Port 3000 is already in use"
- Browser shows Vite app instead of Next.js app
- Hot reload doesn't work

## Code Examples

Verified patterns from official sources:

### Root Layout with Multiple Google Fonts

```tsx
// app/layout.tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Creates CSS variable --font-inter
  display: 'swap', // Use font-display: swap (prevents FOIT)
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Specify weights for non-variable fonts
  variable: '--font-montserrat',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-inter">{children}</body>
    </html>
  )
}
```

### Tailwind Config with Custom Fonts and Colors

```js
// tailwind.config.js
// Source: https://nextjs.org/docs/app/guides/tailwind-v3-css
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        'primary-orange': '#f97316',
        'primary-orange-light': '#fb923c',
      },
    },
  },
  plugins: [],
}
```

### Global CSS with Tailwind and Custom Styles

```css
/* app/globals.css */
/* Source: https://nextjs.org/docs/app/guides/tailwind-v3-css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS for glassmorphism and mesh background */
:root {
  --primary-orange: #f97316;
  --primary-orange-light: #fb923c;
}

body {
  margin: 0;
  font-family: var(--font-inter), sans-serif;
  overflow-x: hidden;
  color: #1a1a1a;
}

h1, h2, h3, .font-montserrat {
  font-family: var(--font-montserrat), sans-serif;
}

.mesh-bg {
  background:
    radial-gradient(at 0% 0%, rgba(249, 115, 22, 0.1) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(251, 146, 60, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(254, 215, 170, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(255, 255, 255, 1) 0px, transparent 50%),
    #ffffff;
  background-attachment: fixed;
}

.liquid-glass {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 10px 40px -10px rgba(249, 115, 22, 0.12),
    inset 0 0 20px rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  position: relative;
  overflow: hidden;
}

/* Additional custom styles from index.html... */
```

### Client Component with Hooks

```tsx
// app/components/Dashboard.tsx
'use client' // REQUIRED: Component uses useState, useEffect, browser APIs

import React, { useState } from 'react'
import { UserProfile } from '@/lib/types'

interface DashboardProps {
  user: UserProfile
  onLogout: () => void
  onCheckIn: () => void
}

export function Dashboard({ user, onLogout, onCheckIn }: DashboardProps) {
  const [loading, setLoading] = useState(false)

  // Component implementation...
  return <div>Dashboard</div>
}
```

### TypeScript Configuration with Path Aliases

```json
// tsconfig.json
// Source: https://nextjs.org/docs/app/api-reference/config/typescript
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Next.js Configuration (SPA Mode)

```js
// next.config.mjs
// Source: https://nextjs.org/docs/app/guides/migrating/from-vite
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // SPA mode (static export)
  // distDir: './dist', // Optional: change build output directory
}

export default nextConfig
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (`pages/` directory) | App Router (`app/` directory) | Next.js 13 (Oct 2022), stable in 14+ | File-system routing, React Server Components, nested layouts, streaming, built-in loading/error states |
| `_app.tsx` for global layout | `app/layout.tsx` (root layout) | Next.js 13 | Simpler API, mandatory `<html>` and `<body>` tags, better TypeScript support |
| `next/legacy/image` | `next/image` | Next.js 13 | Improved API, better performance, automatic WebP/AVIF |
| Manual font loading (CDN or link tags) | `next/font` | Next.js 13 | Automatic self-hosting, zero layout shift, no FOUT/FOIT |
| Webpack (default) | Turbopack (default) | Next.js 16 (Feb 2026) | 10x faster dev server, faster builds, Rust-based |
| Tailwind v2 | Tailwind v3 (or v4) | Tailwind v3: Dec 2021, v4: Dec 2024 | JIT mode default (v3), CSS-first config (v4), smaller bundles |
| `getStaticProps`/`getServerSideProps` (Pages Router) | `async` Server Components, `fetch` with caching (App Router) | Next.js 13 | Simpler data fetching, built-in request deduplication, streaming |

**Deprecated/outdated:**
- **Pages Router:** Still supported but App Router is recommended for new projects. Pages Router won't get new features.
- **`next/legacy/image`:** Use `next/image` instead (automatic upgrade in Next.js 13+).
- **CDN fonts:** Use `next/font` for self-hosting and optimization.
- **Tailwind CDN in production:** Use npm package for reliability and performance.
- **`next lint` in build:** As of Next.js 16, linting is not run during `next build`. Run linter separately via npm scripts.

## Open Questions

1. **Should we use Tailwind v3 or v4?**
   - What we know: Tailwind v4 has 70% smaller bundles, 2-5x faster builds, CSS-first config. BUT it's breaking changes, requires migration, some plugins not compatible.
   - What's unclear: Is the migration overhead worth it for this small project?
   - **Recommendation:** Use Tailwind v3 for this phase. It's stable, well-documented, and the current project is already using v3-compatible patterns (CDN currently, but styles are v3). Migrate to v4 in a future phase if needed.

2. **Should we use `src/` directory or root-level `app/` directory?**
   - What we know: Next.js supports both. Current project has NO `src/` directory (everything in root).
   - What's unclear: Does adding `src/` improve organization for this small project?
   - **Recommendation:** NO `src/` directory. Keep `app/` at root for consistency with current project structure. `src/` is useful for larger projects with many top-level config files, but this project is simple.

3. **Should we keep Vite config during migration or remove it immediately?**
   - What we know: Vite config (`vite.config.ts`) is no longer used by Next.js. Keeping it may cause confusion.
   - What's unclear: Any value in keeping it for reference?
   - **Recommendation:** Remove Vite config, Vite dependencies, and `index.html` after migration is verified working. Clean break is clearer than maintaining parallel configs.

## Sources

### Primary (HIGH confidence)

- [Next.js Official Docs - App Router](https://nextjs.org/docs/app) - Complete App Router documentation (v16.1.6, updated 2026-02-11)
- [Next.js Official Docs - Installation](https://nextjs.org/docs/app/getting-started/installation) - Setup and installation guide
- [Next.js Official Docs - Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - File and folder conventions
- [Next.js Official Docs - Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) - next/font usage
- [Next.js Official Docs - Tailwind CSS v3](https://nextjs.org/docs/app/guides/tailwind-v3-css) - Tailwind integration
- [Next.js Official Docs - Migrating from Vite](https://nextjs.org/docs/app/guides/migrating/from-vite) - Vite to Next.js migration guide
- [Next.js Official Docs - TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript) - TypeScript configuration
- [Next.js Official Docs - next.config.js](https://nextjs.org/docs/app/api-reference/config/next-config-js) - Next.js configuration options
- [Tailwind CSS Official Docs - Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) - Official Tailwind setup for Next.js

### Secondary (MEDIUM confidence)

- [Common mistakes with the Next.js App Router and how to fix them - Vercel](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) - Official Vercel blog on pitfalls (verified with official docs)
- [App Router pitfalls: common Next.js mistakes and practical ways to avoid them](https://imidef.com/en/2026-02-11-app-router-pitfalls) - Community blog dated Feb 11, 2026, aligned with official guidance
- [Next.js App Router: common mistakes and how to fix them](https://upsun.com/blog/avoid-common-mistakes-with-next-js-app-router/) - Community guide, cross-verified with official docs
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) - Community guide on Tailwind v4 features and migration
- [What's New in Tailwind CSS 4.0: Migration Guide (2026)](https://designrevision.com/blog/tailwind-4-migration) - Detailed v3 to v4 comparison

### Tertiary (LOW confidence)

- [Next.js: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/nextjs-complete-guide) - Community overview, not official source
- [Migrating React + Vite to Next.js automation tool](https://medium.com/@digitaldev2024/migrating-react-vite-to-next-js-i-built-a-tool-to-automate-the-whole-process-b4010d3867d7) - Third-party tool, not verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All information from official Next.js and Tailwind docs (Feb 2026)
- Architecture: HIGH - Based on official Next.js project structure conventions and migration guide
- Pitfalls: HIGH - Verified with official Vercel blog and cross-referenced with official docs
- Tailwind v3 vs v4: MEDIUM - v4 is newer (Dec 2024), limited production case studies, but official docs are clear
- Migration strategy: HIGH - Official Next.js migration guide from Vite is comprehensive and recent

**Research date:** 2026-02-17
**Valid until:** ~30 days (Next.js stable, but check for 16.x patches)

**Key assumptions:**
- Next.js 16.x is latest stable (as of Feb 2026 search results and official docs)
- Tailwind v3 is production-ready and stable (v4 is bleeding edge)
- Current project has simple structure (6 files) suitable for colocated app/ directory approach
- Phase 1 focuses on infrastructure only (no UI refactoring, no Server Components optimization yet)
