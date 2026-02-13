# Architecture

**Analysis Date:** 2026-02-13

## Pattern Overview

**Overall:** Single-Page Application (SPA) with client-side state management and localStorage persistence

**Key Characteristics:**
- React-based frontend with Vite build tooling
- State-driven UI with three main auth states
- Component-based architecture with reusable UI patterns
- Client-side form handling and mock authentication
- QR code scanning capability via html5-qrcode library

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interface and handle user interactions
- Location: `components/` directory
- Contains: React functional components (GlassCard, Dashboard, QRScanner)
- Depends on: Types, utilities, Lucide icons
- Used by: App.tsx main component

**State Management Layer:**
- Purpose: Manage application state (authentication, user data, form inputs)
- Location: `App.tsx`
- Contains: React useState hooks for authState, user, formData, loading states, errors
- Depends on: localStorage for persistence
- Used by: All rendered components

**Domain/Types Layer:**
- Purpose: Define TypeScript interfaces and application constants
- Location: `types.ts`, `constants.ts`
- Contains: UserProfile, AuthState, SchoolOption interfaces and school list
- Depends on: None
- Used by: App.tsx, components

**Integration Layer:**
- Purpose: External library integrations
- Location: QRScanner component uses html5-qrcode
- Contains: QR code scanning and video stream handling
- Depends on: html5-qrcode library
- Used by: Dashboard component

## Data Flow

**Authentication Flow:**

1. User enters email/password on Login form → `App.tsx` state updated
2. `handleLogin()` validates against mock credentials (demo@example.com/password123)
3. On success: UserProfile object created and saved to localStorage
4. authState changes from 'login' to 'dashboard'
5. Dashboard component renders with user data

**Registration Flow:**

1. User fills form fields (firstName, lastName, email, school, dob, password)
2. Form state stored in `formData` object in App.tsx
3. `handleRegister()` triggered on form submit
4. New UserProfile created with generated ID
5. User data persisted to localStorage
6. authState transitions to 'dashboard'

**Check-In Flow:**

1. User taps "Effettua Check-in" button on Dashboard
2. QRScanner modal opens
3. User scans QR code via camera
4. `onScan()` callback triggered with decoded text
5. `handleCheckIn()` updates user.last_checkin with current timestamp
6. Updated user object persisted to localStorage
7. Success animation displays for 4 seconds
8. QRScanner modal closes

**State Persistence:**

- User data stored in localStorage under key `jumpin_user`
- On app load, useEffect checks localStorage for saved user
- If found, user state restored and dashboard shown automatically
- Manual logout clears localStorage and resets to login state

## Key Abstractions

**UserProfile:**
- Purpose: Represents authenticated user with personal and educational info
- Examples: `types.ts` lines 2-10
- Pattern: TypeScript interface with optional last_checkin field

**AuthState:**
- Purpose: Enumeration of three auth/navigation states
- Examples: 'login' | 'register' | 'dashboard'
- Pattern: Discriminated union type for conditional rendering

**GlassCard Component:**
- Purpose: Reusable UI container with "liquid glass" visual effect
- Examples: `components/GlassCard.tsx`
- Pattern: Presentational component that wraps children with consistent styling

**SchoolOption:**
- Purpose: Maps school values to display labels for dropdown
- Examples: `constants.ts` lines 4-13
- Pattern: Constant data structure with value/label pairs

## Entry Points

**HTML Entry Point:**
- Location: `index.html`
- Triggers: Page load in browser
- Responsibilities:
  - Mounts React root element
  - Loads Tailwind CSS and fonts
  - Defines global CSS (mesh-bg, liquid-glass, glass-input styles)
  - Sets up importmap for esm.sh CDN modules

**React Entry Point:**
- Location: `index.tsx`
- Triggers: After HTML DOM ready
- Responsibilities:
  - Creates React root
  - Renders App component
  - Error handling for missing root element

**Component Entry Point:**
- Location: `App.tsx`
- Triggers: React render phase
- Responsibilities:
  - Manages all application state
  - Routes between login/register/dashboard views
  - Handles form submission and authentication
  - Coordinates user checkout flow

## Error Handling

**Strategy:** Client-side validation with user-facing error messages

**Patterns:**
- Login errors: Display red alert box with message "Credenziali non valide..."
- Form validation: HTML5 required attributes and input type validation
- Missing root element: Throw error in `index.tsx` if no #root div found
- QR scanner cleanup: try/catch in scanner cleanup function (`components/QRScanner.tsx` line 36)
- Async operations: Loading state prevents double submission (`disabled={isLoading}`)

## Cross-Cutting Concerns

**Logging:**
- Console errors in QR scanner cleanup only
- No structured logging framework
- Limited error visibility in production

**Validation:**
- HTML5 form validation (email type, required attributes, minLength on password)
- Client-side regex validation not implemented
- No backend validation (mock auth accepts any credentials)

**Authentication:**
- Mock authentication: Hardcoded credentials (demo@example.com / password123)
- No real API calls
- No JWT or session tokens
- Entire auth logic in `App.tsx` handleLogin/handleRegister methods
- localStorage as auth persistence mechanism

**Styling:**
- Tailwind CSS for utility classes
- CSS-in-JS in index.html for complex animations and glass effects
- Responsive design with sm: breakpoints
- Custom CSS variables for color theming (--primary-orange)

---

*Architecture analysis: 2026-02-13*
