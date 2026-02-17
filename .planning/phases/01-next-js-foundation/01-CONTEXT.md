# Phase 1: Next.js Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a Next.js App Router project, configure Tailwind CSS, Google Fonts (Montserrat + Inter), path aliases (@/), and verify dev server + production build work. This is the migration foundation — no UI components or auth logic yet.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Route structure: How to map existing views (login, register, dashboard) to Next.js App Router routes
- Folder organization: Where components, styles, utilities, and types live in the new project structure
- Migration strategy: Fresh Next.js scaffold alongside existing Vite code, or in-place replacement
- TypeScript configuration: Strict mode, path alias setup in tsconfig
- Tailwind configuration: How to port existing Tailwind config and custom styles (glassmorphism, mesh gradient)
- Font loading: next/font vs CDN for Montserrat and Inter
- Package management: Which dependencies to carry over, which to replace with Next.js equivalents

User explicitly delegated all infrastructure decisions to Claude. Optimize for clean migration and developer experience.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude to make sensible infrastructure choices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-next-js-foundation*
*Context gathered: 2026-02-17*
