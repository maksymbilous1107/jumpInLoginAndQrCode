# Feature Landscape: QR Check-In Event Attendance

**Domain:** Event attendance / check-in management (educational context)
**Researched:** 2026-02-13
**Confidence:** MEDIUM-LOW (based on training data only - no external verification available)

**Context:** This research focuses on backend integration features for a QR check-in webapp where frontend UI (login, register, dashboard, QR scanner) already exists. Target users are Rimini schools.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **User Authentication** | Security requirement - must verify who's checking in | Medium | Already in frontend (mock), needs real Supabase auth |
| **QR Code Generation** | Core mechanism - each event needs unique scannable code | Low | Backend generates/stores unique codes per event |
| **Check-In Recording** | Core function - persist attendance records | Low | Write timestamp + user + event to Supabase |
| **User Profile Storage** | Registration data must persist (name, school, personal info) | Low | Already planned with Supabase schema |
| **Event List/Management** | Users/admins need to know what events exist | Low-Medium | CRUD for events (name, date, location, QR code) |
| **Duplicate Check-In Prevention** | Can't allow same user to check in twice to same event | Low | Database constraint or validation logic |
| **Attendance History** | Users expect to see "I attended X events" | Low | Query check-ins by user ID |
| **Data Persistence** | Data must survive browser refresh, app restart | Low | Already planned (Supabase primary storage) |
| **Basic Error Handling** | Network failures, invalid QR codes must not crash app | Medium | Try-catch, user feedback, retry logic |

---

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dual Storage (Supabase + Google Sheets)** | Resilience + admin familiarity with spreadsheets | Medium | Already planned - backup/admin view in Sheets |
| **Offline Check-In Queue** | Works in poor connectivity (common at events) | High | Store check-ins locally, sync when online |
| **Real-Time Dashboard Updates** | See attendance count update live as people check in | Medium | Supabase real-time subscriptions |
| **Event Check-In Statistics** | Show "X% attended", "Y people checked in" per event | Low | Aggregate queries on attendance table |
| **Check-In Time Restrictions** | QR only works during event time window | Low | Validate current time against event start/end |
| **Multiple Event Types** | Categorize events (assembly, field trip, club meeting) | Low | Add event_type field to events table |
| **Admin Role Separation** | Admins can create events, view all attendance; users can only check in | Medium | Role-based access control (RBAC) in Supabase |
| **Bulk User Import** | Upload CSV of students instead of manual entry | Medium | Parse CSV, validate, batch insert users |
| **Check-In Notifications** | Confirm successful check-in (email/push) | Medium-High | Requires email service (Supabase Auth) or push setup |
| **Attendance Export** | Download attendance as CSV/PDF for records | Low-Medium | Query + format conversion |
| **School-Scoped Events** | Users only see events for their school | Low | Filter events by school_id from user profile |
| **QR Code Expiry** | Old event QRs stop working after event ends | Low | Check event end_date before allowing check-in |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Check-Out Tracking** | Adds complexity, not requested, schools rarely track exit | Just track entry | Focus on check-in only |
| **In-App Messaging** | Scope creep, maintenance burden, not core to attendance | Use existing school communication tools | Stay focused on attendance |
| **Social Features** (friend lists, likes, comments) | Not relevant to attendance use case | N/A | Keep it professional/educational |
| **Payment Processing** | Not mentioned in requirements, significant compliance overhead | N/A | Events are free school activities |
| **Custom QR Design/Branding** | Aesthetic feature that doesn't affect function | Standard QR codes work fine | Premature optimization |
| **Multi-Language Support** | Added complexity, Rimini context suggests Italian only | Single language (Italian) | Add later if needed |
| **Complex Approval Workflows** | "Admin approves each check-in" adds friction | Automatic check-in recording | Trust users, flag anomalies instead |
| **Gamification** (points, badges, leaderboards) | Not requested, could feel inappropriate for mandatory school events | N/A | Keep it straightforward |
| **Video/Photo Check-In Proof** | Privacy concerns with minors, storage costs, overkill | Trust QR scan + timestamp | QR possession is proof enough |
| **Custom Mobile Apps** | Web app already works on mobile, native apps = 3x maintenance | PWA if needed | Stick with web |

---

## Feature Dependencies

```
User Authentication → User Profile Storage (must auth to have profile)
User Profile Storage → Check-In Recording (need user_id for attendance)
Event Management → QR Code Generation (can't generate QR without event)
QR Code Generation → Check-In Recording (scan QR to create check-in)
Check-In Recording → Attendance History (history queries check-ins)
Check-In Recording → Duplicate Prevention (need check-in table to check)
Admin Role Separation → Event Management (admins create/manage events)
School-Scoped Events → Event List (filter depends on school data)

Optional chains:
Check-In Recording → Real-Time Dashboard (only if real-time subscribed)
Check-In Recording → Check-In Notifications (only if notifications enabled)
```

---

## MVP Recommendation

**Prioritize (Phase 1 - Replace Mock Auth):**

1. **User Authentication** (Supabase Auth integration)
   - Rationale: Currently mocked, must be real for production

2. **User Profile Storage** (Persist registration data)
   - Rationale: User data currently not saved between sessions

3. **Event Management (Basic CRUD)**
   - Rationale: Need events to exist before anyone can check in

4. **QR Code Generation**
   - Rationale: Core mechanism, relatively simple

5. **Check-In Recording** (Write to Supabase)
   - Rationale: Core functionality - must persist attendance

6. **Duplicate Check-In Prevention**
   - Rationale: Data integrity, simple to implement with unique constraint

7. **Attendance History (User View)**
   - Rationale: Table stakes - users expect to see their history

8. **Google Sheets Sync (Backup)**
   - Rationale: Already planned, provides admin value immediately

**Defer to Phase 2:**

- **Offline Check-In Queue:** High complexity, can launch without it, add based on connectivity issues
- **Real-Time Dashboard:** Nice-to-have, not critical for MVP
- **Check-In Notifications:** Adds external service dependency, can validate need first
- **Bulk User Import:** Admin convenience, can do manual entry initially
- **Admin Role Separation:** Can use simple "is_admin" boolean, elaborate later
- **Attendance Export:** Admins can use Google Sheets for now
- **Event Check-In Statistics:** Can calculate manually or in Sheets initially

**Explicitly Exclude:**

- All anti-features listed above

---

## Backend-Specific Considerations

Since frontend UI exists, backend must support:

### API Endpoints Required

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/auth/login` | POST | Authenticate user | P0 (MVP) |
| `/api/auth/register` | POST | Create new user account | P0 (MVP) |
| `/api/auth/logout` | POST | End session | P0 (MVP) |
| `/api/user/profile` | GET | Fetch current user data | P0 (MVP) |
| `/api/user/profile` | PUT | Update user profile | P1 (Post-MVP) |
| `/api/events` | GET | List available events (scoped to user's school) | P0 (MVP) |
| `/api/events/:id` | GET | Get single event details | P0 (MVP) |
| `/api/events` | POST | Create event (admin only) | P0 (MVP) |
| `/api/events/:id/qr` | GET | Generate/retrieve QR code for event | P0 (MVP) |
| `/api/checkin` | POST | Record attendance (validates QR data) | P0 (MVP) |
| `/api/user/attendance` | GET | Get user's check-in history | P0 (MVP) |
| `/api/events/:id/attendees` | GET | Get who attended event (admin only) | P1 (Post-MVP) |
| `/api/events/:id/stats` | GET | Get attendance statistics | P1 (Post-MVP) |

### Database Schema Requirements

| Table | Key Fields | Purpose |
|-------|------------|---------|
| `users` | id, email, password_hash, name, school_id, role | Store user accounts |
| `schools` | id, name, location | Support multi-school if needed |
| `events` | id, name, date, location, qr_code, school_id, start_time, end_time | Event definitions |
| `check_ins` | id, user_id, event_id, timestamp, UNIQUE(user_id, event_id) | Attendance records |

### External Service Integrations

| Service | Purpose | Complexity |
|---------|---------|------------|
| Supabase Auth | User authentication | Low (well-documented) |
| Supabase Database | Primary data storage | Low (already chosen) |
| Supabase Realtime | Live dashboard updates | Medium (optional feature) |
| Google Sheets API | Backup/admin sync | Medium (OAuth setup) |

### Data Validation Rules

| Validation | Where | Why |
|------------|-------|-----|
| Email format | Registration | Prevent typos, ensure contact validity |
| Required fields | Registration | Can't create account without school info |
| QR code matches event | Check-in | Prevent wrong QR usage |
| Event time window | Check-in | Only allow check-in during event |
| User belongs to school | Event listing | Privacy/scoping |
| Duplicate check-in | Check-in | Data integrity |

---

## Edge Cases to Handle

| Edge Case | Impact | Mitigation |
|-----------|--------|------------|
| User scans QR for wrong school's event | Confusion, invalid data | Validate user.school_id == event.school_id |
| User tries to check in after event ended | Outdated QR codes | Check event.end_time > now() |
| Network drops mid-check-in | Lost attendance record | Retry logic + offline queue (Phase 2) |
| QR code screenshot shared | Multiple people use same QR | Acceptable for now - event-level QR, not user-level |
| User changes schools mid-year | Orphaned attendance data | Allow school transfer in profile update |
| Admin deletes event with check-ins | Orphaned check-ins | Soft delete events or prevent deletion if attended |
| Simultaneous check-ins (high traffic) | Database race conditions | Use database transactions |

---

## Research Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes Features | MEDIUM | Based on common patterns in attendance systems, but not verified with 2026 sources |
| Differentiators | MEDIUM-LOW | Some features (offline queue, real-time) are trends, but couldn't verify current best practices |
| Anti-Features | HIGH | These are clearly out of scope based on project description |
| Backend Requirements | MEDIUM | Standard patterns for auth + CRUD + check-in, but specific to Supabase ecosystem |
| Edge Cases | MEDIUM | Common scenarios, but school-specific edge cases may exist |

---

## Gaps & Open Questions

### Could Not Verify

- **Current SOTA in QR attendance apps (2026):** What features have become standard since 2025?
- **Supabase-specific best practices:** Are there Supabase features that make certain patterns easier?
- **Italian school regulations:** Are there compliance requirements for storing student data?
- **Rimini-specific needs:** Are there local expectations or norms for attendance tracking?

### Recommend Phase-Specific Research

- **Before Phase 2 (Offline Support):** Research Progressive Web App + Service Workers + IndexedDB for offline queue
- **Before Admin Features:** Research Supabase Row Level Security (RLS) patterns for role-based access
- **Before Google Sheets Integration:** Verify Google Sheets API quotas and OAuth flow for school context

---

## Sources

**Disclaimer:** This research is based on training data (knowledge cutoff January 2025) without verification from:
- Context7 (not available)
- Official documentation (web search not available)
- Current community sources (web search not available)

Confidence is marked MEDIUM-LOW for this reason. Recommend validating findings with:
- Supabase official documentation for auth/database patterns
- Existing QR attendance apps (Eventbrite, Whova, AttendanceBot) for feature comparison
- School stakeholders in Rimini for specific requirements

This research represents **informed hypothesis** based on common patterns in event management systems, but should be validated before committing to roadmap.
