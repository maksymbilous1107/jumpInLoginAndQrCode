# Testing Patterns

**Analysis Date:** 2026-02-13

## Test Framework

**Runner:**
- Not detected - No test framework configured
- No vitest.config.ts or jest.config.ts found
- No test dependencies in package.json

**Assertion Library:**
- Not applicable - No testing framework installed

**Run Commands:**
- Not available - Testing not configured in this project
- package.json scripts only include: `dev`, `build`, `preview`

## Test File Organization

**Location:**
- No test files found in codebase
- Testing not implemented

**Naming:**
- Not applicable - No test files exist

**Structure:**
- Not applicable - No test directory structure

## Test Structure

**Suite Organization:**
- Not implemented in this project

**Patterns:**
- Not applicable - No tests exist

## Mocking

**Framework:**
- Not configured - No mocking library installed

**Patterns:**
- Not applicable - No mocking examples

**What to Mock:**
- localStorage operations could be mocked for unit tests of App.tsx
- Html5QrcodeScanner library used in QRScanner.tsx component would need mocking for tests
- setTimeout delays in handleLogin() and handleRegister() could use fake timers
- React components could be mocked when testing components that depend on them

**What NOT to Mock:**
- React itself (use React.FC typed components)
- Type definitions and interfaces
- Lucide-react icon library for visual testing
- DOM elements (use testing library)

## Fixtures and Factories

**Test Data:**
- No fixtures or factories currently used

**Potential Test Data:**
- Mock UserProfile object with structure: `{ id, first_name, last_name, email, school, dob, last_checkin }`
- Example from code: `{ id: 'demo-123', first_name: 'Demo', last_name: 'User', email: 'demo@example.com', school: 'JumpIn Testing School', dob: '2000-01-01', last_checkin: new Date().toISOString() }`
- School options from `RIMINI_SCHOOLS` constant for form testing

**Location:**
- If implemented, fixtures should go in `tests/fixtures/` directory
- Test data factories could go in `tests/factories/` directory

## Coverage

**Requirements:**
- Not enforced - No test coverage tool configured

**View Coverage:**
- Not available - No test setup exists

## Test Types

**Unit Tests:**
- Should test: Individual functions in `App.tsx` like `handleLogin()`, `handleRegister()`, `handleLogout()`, `handleCheckIn()`
- Should test: Components in isolation: `GlassCard.tsx`, `Dashboard.tsx`, `QRScanner.tsx`
- Should test: Utility functions and constants from `constants.ts`, `types.ts`
- Approach: Test handler functions with mock state setters, test component rendering with React Testing Library

**Integration Tests:**
- Should test: Form submission flow (input → validation → state update → localStorage)
- Should test: Authentication flow (login → dashboard navigation → logout)
- Should test: QR scanning integration with scanner library
- Should test: localStorage persistence and retrieval
- Scope: Multi-step user workflows combining multiple components

**E2E Tests:**
- Not implemented
- Could use Cypress or Playwright for full user journey testing
- Test scenarios: User registration → login → check-in → logout

## Async Testing

**Pattern:**
- Components use async handlers: `const handleScan = async (decodedText: string) => { ... }`
- Simulated async with setTimeout: `setTimeout(() => { ... }, 1200)` (login), `setTimeout(() => { ... }, 2000)` (register)
- When tests are added, use async/await pattern:

```typescript
it('should handle login submission', async () => {
  // arrange
  const { getByText, getByPlaceholderText } = render(<App />);

  // act
  fireEvent.change(getByPlaceholderText('name@example.com'), { target: { value: 'demo@example.com' } });
  fireEvent.change(getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
  fireEvent.click(getByText('Continua'));

  // assert
  await waitFor(() => {
    expect(getByText('Profilo Attivo')).toBeInTheDocument();
  });
});
```

## Error Testing

**Pattern:**
- Error state managed with `useState<string | null>`: `const [loginError, setLoginError] = useState<string | null>(null);`
- Errors cleared on user input: `if (loginError) setLoginError(null);`
- Errors displayed conditionally with error alert UI

Example error test pattern:

```typescript
it('should display login error for invalid credentials', async () => {
  const { getByText, getByPlaceholderText } = render(<App />);

  // Enter invalid credentials
  fireEvent.change(getByPlaceholderText('name@example.com'), { target: { value: 'wrong@example.com' } });
  fireEvent.change(getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } });
  fireEvent.click(getByText('Continua'));

  // Error message should appear
  await waitFor(() => {
    expect(getByText('Credenziali non valide. Usa demo@example.com / password123')).toBeInTheDocument();
  });
});
```

## Setup Recommendations

**To implement testing, add:**

1. Test dependencies:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

2. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

3. Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

4. Add test script to package.json:
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

5. Directory structure:
```
tests/
├── setup.ts
├── fixtures/
│   └── user.ts
├── mocks/
│   └── html5-qrcode.ts
├── unit/
│   ├── App.test.tsx
│   ├── components/
│   │   ├── Dashboard.test.tsx
│   │   ├── GlassCard.test.tsx
│   │   └── QRScanner.test.tsx
│   └── constants.test.ts
└── integration/
    ├── auth-flow.test.tsx
    └── checkin-flow.test.tsx
```

## Component Testing Strategy

**App.tsx:**
- Test login handler with valid/invalid credentials
- Test registration handler and form data accumulation
- Test logout clears user state and localStorage
- Test state persistence from localStorage on mount
- Test navigation between login → register → dashboard states

**Dashboard.tsx:**
- Test user profile display with provided UserProfile data
- Test check-in button click triggers onCheckIn callback
- Test success state display and timeout
- Test QR scanner modal opens/closes
- Test logout button click triggers onLogout callback

**GlassCard.tsx:**
- Test renders children correctly
- Test applies custom className prop
- Test renders with default classes (liquid-glass, p-8, rounded-[2rem])

**QRScanner.tsx:**
- Mock Html5QrcodeScanner library
- Test scanner initialization on mount
- Test onScan callback fires with decoded text
- Test onClose button calls onClose callback
- Test cleanup function clears scanner

---

*Testing analysis: 2026-02-13*
