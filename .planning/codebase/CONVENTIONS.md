# Coding Conventions

**Analysis Date:** 2026-02-13

## Naming Patterns

**Files:**
- PascalCase for component files: `Dashboard.tsx`, `GlassCard.tsx`, `QRScanner.tsx`
- camelCase for utility/config files: `constants.ts`, `types.ts`, `vite.config.ts`, `index.tsx`, `index.html`
- HTML entry point: `index.html`, `index.tsx`

**Functions:**
- camelCase for all function names, including component handlers: `handleLogin()`, `handleRegister()`, `handleLogout()`, `handleCheckIn()`, `handleScan()`
- Event handlers prefixed with `handle`: `handleLogin`, `handleScan`, `onLogout`, `onCheckIn`, `onClose`, `onScan`
- Callback props prefixed with `on`: `onLogout`, `onCheckIn`, `onScan`, `onClose`

**Variables:**
- camelCase for state variables: `formData`, `authState`, `isLoading`, `loginError`, `showScanner`, `isProcessing`, `success`, `user`
- camelCase for local variables: `mockUser`, `timestamp`, `initials`, `rootElement`
- UPPER_SNAKE_CASE for constants: `RIMINI_SCHOOLS`, `JUMPIN_COLORS`, `GEMINI_API_KEY`

**Types & Interfaces:**
- PascalCase for all interfaces: `AuthState`, `UserProfile`, `SchoolOption`, `GlassCardProps`, `DashboardProps`, `QRScannerProps`
- Type unions use literal strings: `type AuthState = 'login' | 'register' | 'dashboard'`
- Props interfaces always end with `Props`: `GlassCardProps`, `DashboardProps`, `QRScannerProps`

## Code Style

**Formatting:**
- No formatter explicitly configured in repo (no .prettierrc or eslint config)
- Vite default formatting used
- Semicolons present on all statements
- Single quotes for imports, double quotes mixed in JSX attributes
- Spacing: 2 spaces visible in nested structures

**Linting:**
- No ESLint configuration detected
- No code style tool explicitly configured
- TypeScript strict mode implied by tsconfig.json settings

## Import Organization

**Order:**
1. React imports from 'react'
2. Internal type imports: `import { AuthState, UserProfile } from './types'`
3. Constant imports: `import { RIMINI_SCHOOLS } from './constants'`
4. Component imports: `import { GlassCard } from './components/GlassCard'`
5. Icon library imports: `import { AlertCircle, ChevronRight } from 'lucide-react'`
6. Third-party library imports: `import { Html5QrcodeScanner } from 'html5-qrcode'`

**Path Aliases:**
- Configured in `tsconfig.json`: `@/*` maps to project root
- Alias defined in `vite.config.ts` resolve section
- Actual usage in codebase: imports use relative paths (./types, ./components, ./constants) rather than @ alias

## Error Handling

**Patterns:**
- UI error display via state: `const [loginError, setLoginError] = useState<string | null>(null)`
- Validation errors rendered conditionally with error state
- Error messages shown in Italian: `'Credenziali non valide. Usa demo@example.com / password123'`
- Silent error suppression in scanner: `(error) => { /* Errors are common during scanning, we just ignore them */ }`
- Promise catch with console.error: `scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err))`
- Root element initialization error: `throw new Error("Could not find root element to mount to")`

## Logging

**Framework:** console methods

**Patterns:**
- Minimal logging in codebase
- Only used for error logging: `console.error("Failed to clear scanner", err)`
- No debug, info, or warn calls observed
- Scanner errors intentionally ignored with empty catch handler

## Comments

**When to Comment:**
- Sparse use of comments in codebase
- Comments only for non-obvious behavior: scanner error handling marked as intentional
- Single-line comments for clarification in QRScanner: `/* verbose= */ false`, `/* Errors are common during scanning */`

**JSDoc/TSDoc:**
- No JSDoc documentation observed
- Function purposes inferred from names
- Type information provided via TypeScript interfaces

## Function Design

**Size:**
- Handler functions generally compact: 5-20 lines
- Component render logic: 40-140 lines per component
- Complex JSX kept within component render, no separate template functions

**Parameters:**
- React components accept props interface: `React.FC<ComponentProps>`
- Event handlers typed with React event types: `React.FormEvent`
- Callback parameters typed explicitly: `(decodedText: string) => void`

**Return Values:**
- Components return JSX/ReactNode
- Promise-based async operations: `async () => Promise<void>`
- No early returns except in error cases
- Conditional rendering using ternary operators and && patterns

## Module Design

**Exports:**
- Named exports for components: `export const Dashboard: React.FC<DashboardProps>`
- Default export for main App component: `export default App`
- Default export for QRScanner: `export default QRScanner`
- Constants exported as named exports: `export const RIMINI_SCHOOLS`

**Barrel Files:**
- Not used in this codebase
- Each component in its own file: `components/Dashboard.tsx`, `components/GlassCard.tsx`, `components/QRScanner.tsx`
- No index.ts re-exports from components directory

## React Patterns

**Functional Components:**
- All components use React.FC<Props> type annotation
- Hooks used: useState, useEffect, useRef
- No class components

**State Management:**
- useState for form data, UI state, and user data
- Single state object for form: `formData` with email, password, firstName, lastName, etc.
- localStorage for persistence: `localStorage.getItem('jumpin_user')`, `localStorage.setItem('jumpin_user')`

**Side Effects:**
- useEffect for initialization (checking saved user on mount)
- useEffect with ref initialization for QR scanner with cleanup function
- setTimeout for simulated async operations (login delay 1200ms, registration delay 2000ms)

**Refs:**
- useRef for scanner library integration: `const scannerRef = useRef<Html5QrcodeScanner | null>(null)`
- Type annotation includes null: `Html5QrcodeScanner | null`

## CSS & Styling

**Approach:**
- Tailwind CSS via CDN in index.html
- Inline CSS classes on JSX elements
- Custom CSS classes defined in index.html style tag
- Class naming: kebab-case for custom classes: `mesh-bg`, `liquid-glass`, `glass-input`, `btn-primary-liquid`, `glow-camera-liquid`

**Custom Classes:**
- `mesh-bg`: gradient background mesh
- `liquid-glass`: glassmorphic card effect
- `glass-input`: input field with glass effect
- `btn-primary-liquid`: primary button with gradient
- `glow-camera-liquid`: camera button with glow animation

---

*Convention analysis: 2026-02-13*
