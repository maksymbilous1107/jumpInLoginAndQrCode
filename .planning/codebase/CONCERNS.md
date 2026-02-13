# Codebase Concerns

**Analysis Date:** 2026-02-13

## Tech Debt

**Hardcoded Authentication Credentials:**
- Issue: Demo credentials (demo@example.com / password123) hardcoded directly in login logic
- Files: `App.tsx` (lines 38-55)
- Impact: Security vulnerability; credentials visible in source code; no actual authentication system implemented
- Fix approach: Implement proper backend authentication with secure credential handling; remove hardcoded credentials; implement token-based authentication (JWT) instead of localStorage-only user persistence

**Mock Authentication System:**
- Issue: Entire auth flow uses mock setTimeout simulations instead of real API calls
- Files: `App.tsx` (lines 32-77)
- Impact: No actual user validation; anyone can register/login with any credentials (except demo); no server-side persistence; state lost on page refresh (only localStorage survives)
- Fix approach: Connect to real authentication backend; implement proper session management; add error handling for actual API failures

**Unvalidated User ID Generation:**
- Issue: User IDs generated using `Math.random().toString(36).substr(2, 9)` in registration
- Files: `App.tsx` (line 63)
- Impact: Non-cryptographic, predictable IDs; potential for ID collision; poor database performance; use of deprecated `substr` method
- Fix approach: Use UUID v4 or similar cryptographically secure ID generation; implement on backend

**localStorage as Sole Persistence Layer:**
- Issue: User profile persisted only to browser localStorage with no server-side validation
- Files: `App.tsx` (lines 25-29, 49, 73, 92)
- Impact: Data lost on browser clear; no cross-device support; no audit trail; localStorage ~5-10MB limit; easily manipulated by user
- Fix approach: Implement backend database; use localStorage only for temporary session tokens; validate all data from server on app load

**Unused API Configuration:**
- Issue: Vite config defines GEMINI_API_KEY and API_KEY environment variables but they are never used in the application
- Files: `vite.config.ts` (lines 14-15)
- Impact: Misleading configuration; suggests incomplete migration from Gemini-based version; wasted config setup
- Fix approach: Remove unused env var definitions; clarify actual authentication approach; document required environment variables for real backend

## Known Bugs

**QR Scanner Dependency Issue:**
- Symptoms: QR scanner initialization may fail silently; errors during frame scanning are intentionally ignored
- Files: `components/QRScanner.tsx` (lines 29-31)
- Trigger: Frame with no QR code present (common scenario)
- Workaround: Errors suppressed with empty catch block; scanner continues trying but user has no feedback about scan quality or issues
- Context: Library (html5-qrcode) emits many benign errors during normal operation, but this makes it impossible to detect real issues

**Missing Error Handling in Scanner Clear:**
- Symptoms: If scanner cleanup fails, error is only logged to console
- Files: `components/QRScanner.tsx` (line 36)
- Trigger: When component unmounts or scan completes
- Workaround: None; error silently logged to console
- Impact: Could leave scanner resources in memory if cleanup fails

**Race Condition in Dashboard Check-in:**
- Symptoms: If user rapidly clicks check-in button, multiple async operations could queue
- Files: `components/Dashboard.tsx` (lines 19-27)
- Trigger: Clicking camera button multiple times before previous scan completes
- Workaround: Button disabled during processing, but only UI-level protection
- Impact: Could create duplicate check-in records if implemented with real backend

**Unsafe JSON Parsing Without Try-Catch:**
- Symptoms: If corrupted data is in localStorage, app will crash on mount
- Files: `App.tsx` (line 27)
- Trigger: Manual localStorage manipulation or storage corruption
- Workaround: None; user must manually clear localStorage
- Impact: Permanent app breakage for affected user

## Security Considerations

**Exposed Credentials in Source Code:**
- Risk: Hardcoded demo credentials visible in git history and deployed app
- Files: `App.tsx` (line 38)
- Current mitigation: None; credentials are public test data only
- Recommendations: Remove hardcoded credentials entirely; use backend authentication; implement secure credential management (hashed passwords never in frontend)

**localStorage Sensitive Data Storage:**
- Risk: User profile with email stored in plaintext in localStorage; accessible to any JavaScript on the page
- Files: `App.tsx` (lines 49, 73, 92)
- Current mitigation: None
- Recommendations: Store only opaque session tokens in localStorage; keep PII on server; validate session token before using stored user data

**No HTTPS Enforcement:**
- Risk: Application transmits user credentials and data over potential HTTP connections
- Files: All authentication flows
- Current mitigation: None
- Recommendations: Enforce HTTPS only; implement HSTS headers; use secure cookies with HttpOnly flag

**XSS Vulnerability in User Input Display:**
- Risk: User profile data (names, school) displayed without sanitization in Dashboard
- Files: `components/Dashboard.tsx` (lines 64, 78, 88, 98)
- Current mitigation: React escapes by default, but reliance on this is fragile
- Recommendations: Implement content security policy; validate/sanitize all user input on backend; use TypeScript strict mode

**No CSRF Protection:**
- Risk: Check-in endpoint (future real implementation) vulnerable to cross-site request forgery
- Files: `App.tsx` (lines 87-94); `components/Dashboard.tsx` (lines 19-27)
- Current mitigation: None
- Recommendations: Implement CSRF token validation in backend; use SameSite cookie attribute

**Camera Permission Vulnerability:**
- Risk: QR scanner requests camera access without clear user consent explanation
- Files: `components/QRScanner.tsx` (lines 14-32)
- Current mitigation: Browser permission dialog (insufficient)
- Recommendations: Explain why camera access is needed; implement optional QR scanning; handle permission denials gracefully

## Performance Bottlenecks

**Large Monolithic App Component:**
- Problem: App.tsx handles all authentication logic, form state, and UI rendering (288 lines)
- Files: `App.tsx`
- Cause: No separation of concerns; login/register/dashboard logic mixed in single component
- Improvement path: Extract form state to custom hooks; separate auth logic into service layer; memoize components to prevent unnecessary re-renders

**Inefficient Form State Management:**
- Problem: Every keystroke in form fields triggers full form state object spread (`setFormData({...formData, ...})`)
- Files: `App.tsx` (lines 123-126, 137-140, 190-201, etc.)
- Cause: No form library; manual state management with object spreading
- Improvement path: Use React Hook Form or similar library; implement field-level validation; batch updates

**Blocking setTimeout in Auth Flows:**
- Problem: Authentication uses arbitrary delays (1200-2000ms) without real async operations
- Files: `App.tsx` (lines 37-55, 61-76)
- Cause: Mock implementation; not using real API calls
- Improvement path: Replace with actual API calls; implement proper loading states; use AbortController to cancel in-flight requests

**Unoptimized Re-renders on State Change:**
- Problem: No React.memo or useMemo used; all child components re-render when parent state changes
- Files: All components
- Cause: Functional components without memoization strategy
- Improvement path: Use React.memo for GlassCard and QRScanner; extract child components; use useCallback for event handlers

**Scanner Initialization Overhead:**
- Problem: Html5QrcodeScanner initialized on every component mount without lazy initialization
- Files: `components/QRScanner.tsx` (lines 16-20)
- Cause: No code splitting; scanner library loaded eagerly
- Improvement path: Lazy load scanner library; initialize only when camera button clicked; use dynamic imports

## Fragile Areas

**QR Scanner Integration:**
- Files: `components/QRScanner.tsx`, `components/Dashboard.tsx` (lines 19-27, 137-139)
- Why fragile: Tight coupling to html5-qrcode library; complex lifecycle management; silent error suppression; no fallback if library fails to load
- Safe modification: Wrap scanner in error boundary; implement proper error states; add loading skeleton; test on multiple device types and browsers
- Test coverage: No tests exist; scanner behavior untested; device camera permissions not tested

**Authentication State Management:**
- Files: `App.tsx` (lines 10-22, 24-30)
- Why fragile: Multiple interdependent state variables (authState, user, isLoading, loginError, formData); no single source of truth; logout doesn't fully reset formData
- Safe modification: Consolidate into single auth context; use reducer pattern; validate state transitions explicitly
- Test coverage: No tests; happy path only; error states not tested; edge cases (logout during registration) not handled

**LocalStorage Persistence:**
- Files: `App.tsx` (lines 25-29, 49, 73, 92)
- Why fragile: No error handling for quota exceeded; no data versioning; corrupted data causes app crash; no validation of stored user shape
- Safe modification: Wrap all localStorage calls in try-catch; implement data migration strategy; validate deserialized user object against type schema
- Test coverage: No tests; scenario with full localStorage not tested; corrupted data recovery not tested

**Form Validation:**
- Files: `App.tsx` (lines 181-276)
- Why fragile: Only HTML5 required attribute validation; no pattern matching for email despite email type; password minLength not enforced for login
- Safe modification: Implement comprehensive validation library (Zod, Yup); validate on client and server; show specific error messages per field
- Test coverage: No tests; edge cases (special characters in names, invalid DOB) not tested

**Hardcoded School List:**
- Files: `constants.ts`
- Why fragile: Fixed list of Rimini schools; "altro" option requires custom input but not validated; no way to add schools without code change
- Safe modification: Fetch schools from backend; implement autocomplete with validation; support user-supplied school names
- Test coverage: No tests; custom school input validation not tested

## Scaling Limits

**No Backend Architecture:**
- Current capacity: Single browser instance; no concurrent users; no data persistence across sessions
- Limit: Cannot scale beyond single-device usage; data lost on logout; no multi-device support; no analytics or check-in history
- Scaling path: Implement Node.js/Python backend with database; add API endpoints for login/register/checkin; implement proper session management; add WebSocket for real-time updates

**Browser Storage Limits:**
- Current capacity: localStorage ~5-10MB per origin
- Limit: Cannot store extensive check-in history; user profile limited to small size; no offline sync capability
- Scaling path: Implement IndexedDB for larger datasets; sync with backend; implement service workers for offline functionality

**QR Scanner Performance:**
- Current capacity: Single scanner instance; ~10 FPS as configured
- Limit: High-latency devices may see lag; scanning speed depends on device CPU; no batch scanning support
- Scaling path: Implement batch QR code detection; add device-specific performance profiles; consider server-side QR validation

**Mock Data Not Scalable:**
- Current capacity: Single hardcoded school list; single demo user
- Limit: Cannot test with real user data; no performance testing possible; school list outdated as Rimini schools change
- Scaling path: Implement actual database; implement data seeding; add admin panel for data management

## Dependencies at Risk

**html5-qrcode Library:**
- Risk: Popular library but development appears slower; multiple unresolved issues in repository; no TypeScript definitions (using implicit any)
- Impact: QR scanning breaks if library stops working; cannot easily migrate to newer scanner library
- Migration plan: Alternative: jsQR (lightweight), ZXing (more robust), native BarcodeDetector API (modern browsers)

**Tailwind CDN Delivery:**
- Risk: Application loads Tailwind CSS from CDN (index.html line 8: cdn.tailwindcss.com)
- Impact: Requires internet connection; additional HTTP request; no control over version updates; potential for unavailability
- Migration plan: Use npm-installed Tailwind CSS; implement build-time compilation; reduce CSS payload by removing unused utilities

**Outdated Dependencies:**
- Risk: No lock file best practices; package.json uses caret ranges (^) allowing minor version updates automatically
- Impact: Potential for breaking changes in dependencies; version drift between environments
- Migration plan: Enforce locked versions in package-lock.json; implement automated dependency updating with tests; use renovate bot

**React 19 (Beta):**
- Risk: React 19.2.4 is relatively new; potential for undiscovered bugs; ecosystem package support may lag
- Impact: Unexpected breaking changes; slower community support; type definition gaps
- Migration plan: Pin major versions; implement end-to-end tests; monitor React changelog; plan migration strategy for major version bumps

**Missing Testing Infrastructure:**
- Risk: No test framework (Jest, Vitest) installed; no test coverage; no CI/CD pipeline
- Impact: Regressions go undetected; refactoring is risky; cannot confidently add new features
- Migration plan: Install Vitest or Jest; add unit tests for authentication logic; add integration tests for full auth flows; set up GitHub Actions for CI

## Missing Critical Features

**Backend Integration:**
- Problem: No actual backend API exists; all authentication is mock with localStorage persistence only
- Blocks: Real user management; persistent data storage; multi-device support; analytics; actual security
- Priority: Critical - must implement before production

**Input Validation:**
- Problem: Only HTML5 form validation; no server-side validation; no sanitization
- Blocks: Cannot prevent invalid data; vulnerable to injection attacks
- Priority: Critical - security issue

**Error Recovery:**
- Problem: No error handling for network failures, permission denials, or unexpected states
- Blocks: User stuck if anything goes wrong; unclear error messages; no retry mechanism
- Priority: High - impacts user experience

**Internationalization (i18n):**
- Problem: All UI text hardcoded in Italian; no translation system
- Blocks: Cannot serve non-Italian users; text is embedded in components
- Priority: Medium - needed for expansion

**Offline Support:**
- Problem: No offline capability; no service worker; requires online to load
- Blocks: Cannot use in offline scenarios
- Priority: Medium - nice-to-have for resilience

**Accessibility (a11y):**
- Problem: No ARIA labels; no keyboard navigation; camera button not announced properly; form labels may not be associated with inputs
- Blocks: Screen reader users cannot use app; keyboard-only users cannot navigate
- Priority: High - legal compliance requirement in many jurisdictions

## Test Coverage Gaps

**Authentication Flow:**
- What's not tested: Login with valid credentials, login with invalid credentials, registration with duplicate email, registration with weak password
- Files: `App.tsx` (lines 32-77)
- Risk: Auth logic breaks silently; no validation that login/register actually work
- Priority: Critical

**QR Scanner Component:**
- What's not tested: Scanner initialization, successful scan, error during scanning, camera permission denial, scanner cleanup
- Files: `components/QRScanner.tsx`
- Risk: Scanner may not work on deploy; errors undetectable; resources may leak
- Priority: Critical

**State Persistence:**
- What's not tested: localStorage save/load, corrupted localStorage, quota exceeded, app reload with saved user
- Files: `App.tsx` (localStorage operations)
- Risk: App crashes on corrupted data; user sessions lost unexpectedly
- Priority: High

**Form Validation:**
- What's not tested: Email format validation, password requirements, DOB parsing, custom school input, form reset on logout
- Files: `App.tsx` (lines 181-276)
- Risk: Invalid data submitted; form state inconsistent after logout
- Priority: High

**Component Rendering:**
- What's not tested: Dashboard rendering with different user data, login/register/dashboard state transitions, button disabled states, error message display
- Files: `components/Dashboard.tsx`, `App.tsx`
- Risk: UI breaks with edge case data; animations fail; buttons remain disabled
- Priority: Medium

**Integration Tests:**
- What's not tested: Full auth flow (register → dashboard → logout → login), QR scan → check-in → success state, browser reload during auth
- Files: All components combined
- Risk: Happy path works but complex scenarios break
- Priority: High

---

*Concerns audit: 2026-02-13*
