# PRD: Security Guard Information Management and Real-Time Monitoring System

**Version:** 2.2  **Team size:** 6  **Timeline:** 15 days  **Scope:** Single agency

**Changes in v2.2:** UI, content and compliance rules added (section 17); Terms and Privacy pages with first-login consent added (F12); checkpoints updated to include them.

**Changes in v2.1:** phases and checkpoints added (section 13); progress tracked in `PROGRESS.md`.

**Changes from v1:** backend moved to Django + Django REST Framework; free-text messages replaced by predefined **Quick Requests**; geolocation approach clarified (mobile background GPS is the source of truth; Browser Geolocation API has two limited uses); real-time push via Django Channels is an optional stretch, with polling as the baseline.

---

## 1. Overview

A digital platform for a security agency to manage guards, schedule duties, verify on-site attendance, and monitor guards live. It consists of:

- **Web app** (React) for Admins and Supervisors
- **Android mobile app** (React Native) for Guards
- **One backend** (Django + DRF + PostgreSQL) serving both

## 2. Problem

The agency manages guard records, schedules, attendance and reporting manually. This causes poor duty allocation, no live visibility of guards, weak communication, and unverifiable attendance.

## 3. Goals

1. Centralize guard and location records.
2. Prevent scheduling mistakes (no double-booked guards).
3. Make attendance trustworthy via geofenced check-in.
4. Give supervisors a live view of on-duty guards.
5. Let guards report incidents, raise emergency alerts, and send quick requests instantly.
6. Produce basic attendance, schedule and performance reports.

## 4. Non-Goals (Out of Scope)

Payroll, invoicing and billing, client portal, marketing landing page, testimonials or pricing pages, iOS app, free-text chat, group messaging, push notifications to a closed app (FCM), multi-agency support, AI/analytics. Mention these as future work if asked.

## 5. Users and Roles

| Role | Platform | Responsibilities |
|---|---|---|
| **Admin** | Web | Full control: users, guards, locations, schedules, reports |
| **Supervisor** | Web | Monitors assigned locations: live map, incidents, panic alerts, quick requests; sets own availability |
| **Guard** | Android app | Views duties, checks in/out, shares GPS, reports incidents, panic, quick requests |

Access is enforced by role-based access control (RBAC). Guards cannot self-register; the Admin creates all accounts.

## 6. Features and Acceptance Criteria

### F1. Authentication and RBAC
- Login with username and password; backend returns a JWT access token (8 hours) and refresh token.
- Passwords are hashed (Django default hasher).
- Every endpoint checks the token and the role through DRF permission classes.
- Data is **scoped by role**: a Supervisor sees only guards, incidents and requests for assigned locations; a Guard sees only their own data.
- **Done when:** a Guard token gets 403 on any Admin endpoint, and a Supervisor cannot see another location's guards.

### F2. Guard Management (Admin)
- Create, view, edit, deactivate guards (name, phone, ID number, DOB, address, experience, joining date).
- Creating a guard also creates their login account.
- Deactivate uses soft delete (status = INACTIVE); no hard delete.
- **Done when:** a deactivated guard cannot log in or be scheduled.

### F3. Location Management (Admin)
- Create, view, edit locations: name, address, latitude, longitude, **geofence radius in metres** (default 100).
- On the web form, a **"Use my current location"** button fills latitude and longitude using the Browser Geolocation API.
- Assign Supervisors to locations.
- **Done when:** a location with coordinates and radius can be used by scheduling and check-in.

### F4. Duty Scheduling (Admin)
- Assign guard + location + shift start + shift end.
- Backend rejects a shift that overlaps another active shift of the same guard (`new_start < existing_end AND new_end > existing_start`) with HTTP 409.
- Admin can edit or cancel upcoming shifts.
- Guard sees their upcoming and current shifts in the app.
- **Done when:** creating an overlapping shift returns a clear error and nothing is saved.

### F5. Attendance with Geofence (Guard)
- Check-in allowed from **15 minutes before** shift start until shift end.
- Backend computes the distance between the guard's GPS and the location (Haversine). Outside the radius means rejected.
- Check-in after **10 minutes past** shift start is marked LATE.
- Check-out records the end time. A missing check-out is flagged at shift end.
- **Done when:** check-in from outside the radius fails; from inside succeeds and creates an attendance record.

### F6. Live Tracking
- Source of truth is the **mobile app's background GPS** (`expo-location` + background task). The Browser Geolocation API is **not** used for tracking because it stops when the page is not in the foreground.
- While a shift is active, the app sends GPS every **30 seconds** over HTTP POST.
- Backend stores each ping and flags `outside_geofence` if it is beyond the radius.
- Web map shows each on-duty guard's last position, refreshed by **polling every 10 seconds**. Guards outside their geofence are highlighted.
- Supervisors see only guards at assigned locations; Admin sees all.
- **Done when:** walking out of the radius turns the marker red on the web map within about 40 seconds.

### F7. Incident Reporting
- Guard submits title, description, severity (LOW/MEDIUM/HIGH), with auto-attached location and time. Photo is optional (stretch).
- Supervisor and Admin see the incident list and details, and can mark it REVIEWED.

### F8. Panic Button
- One tap in the app (with a confirm step) creates an alert with the guard's current GPS.
- Web dashboard shows OPEN alerts at the top, highlighted, with an alert sound.
- Supervisor can ACKNOWLEDGE and RESOLVE.
- **Done when:** pressing panic shows an alert on the web dashboard within 10 seconds (polling every 5 seconds).

### F9. Quick Requests (replaces Messages)
Predefined options only; no free-text chat. Panic stays separate because emergencies must not be mixed with routine requests.

**Guard request options**
| Code | Label |
|---|---|
| `SUPERVISOR_AVAILABLE` | Is a supervisor available? |
| `RELIEF_BREAK` | Need relief / break |
| `BACKUP` | Need backup (non-emergency) |
| `EQUIPMENT_SITE_ISSUE` | Equipment or site issue |
| `SCHEDULE_QUERY` | Schedule query |
| `OTHER` | Other (note up to 200 characters) |

**Supervisor reply options**
| Code | Label |
|---|---|
| `ON_MY_WAY` | On my way (optional ETA in minutes) |
| `PLEASE_WAIT` | Please wait |
| `APPROVED` | Approved |
| `CALL_ME` | Call me |
| `DECLINED` | Declined (optional short reason) |

**Behaviour**
- Guard taps an option; a request is created with guard, shift and location attached.
- Request status flows `OPEN`, `REPLIED`, `RESOLVED`.
- Supervisor sees OPEN requests for assigned locations, taps a reply; Guard sees the reply in the app (polling every 5 seconds while the app is open).
- **Supervisor availability:** supervisors toggle `AVAILABLE / BUSY / OFF_DUTY`. Guards can see the status of supervisors assigned to their current location.
- **Done when:** a guard sends a request, the supervisor replies, and the guard sees the reply, all without refreshing manually.

### F10. Reports (Admin)
Filter by date range, guard or location. CSV export is a stretch.
- **Attendance report:** present, late, absent per guard.
- **Schedule report:** shifts per guard and location.
- **Performance report:** attendance rate, on-time rate, geofence violations, incidents filed.

### F11. Real-Time Push (Optional Stretch)
Only after F1-F10 work end to end. Use Django Channels (WebSocket) to push **new panic alerts and quick requests** to the supervisor dashboard instantly. Polling stays as a fallback. If this is not working by the **Day 10 checkpoint**, drop it.

### F12. Terms and Conditions, Privacy Policy and Consent
- Two public pages, readable without logging in: **Terms and Conditions** and **Privacy Policy**. Web routes `/terms` and `/privacy`; mobile screens reachable from the login screen and from Profile.
- Linked from the login page footer and from the footer of every logged-in web page.
- Text is served by the backend (`GET /api/legal/terms`, `GET /api/legal/privacy`) as structured content with a `version` and `updated_on`, so web and mobile show the same text and there is one place to edit it.
- **First-login consent:** a user who has not accepted the current version sees a consent screen before anything else. The guard version states plainly that location is collected from check-in to check-out. Acceptance is stored (`terms_accepted_at`, `terms_version`).
- Background location never starts until the guard has accepted and has granted the OS permission.
- If the version changes, users are asked to accept again.
- Content requirements are in section 17.3.
- **Done when:** a new guard cannot reach "My duties" before accepting; both pages open from the login screen on web and mobile; the text matches what the system really does.

## 7. Key User Flows

**Guard shift:** Login, see today's duty, Check-in (geofence validated), background GPS starts, send quick request / file incident / panic if needed, Check-out, GPS stops.

**Supervisor:** Login, set availability, live map of assigned sites, receive panic / incident / request, reply or acknowledge.

**Admin:** Add guard, add location, create schedule, review reports.

## 8. Data Model (11 tables)

| Table | Key columns |
|---|---|
| `users` | id, username, email, password, role (ADMIN/SUPERVISOR/GUARD), availability_status (supervisors only), terms_accepted_at, terms_version, status, created_at |
| `guards` | id, user_id (FK), full_name, phone, id_number, dob, address, experience_years, joining_date, status |
| `guard_documents` (optional) | id, guard_id, doc_type, doc_number, expiry_date |
| `locations` | id, name, address, latitude, longitude, radius_m, status |
| `supervisor_assignments` | id, supervisor_id (FK users), location_id (FK) |
| `duty_schedules` | id, guard_id, location_id, shift_start, shift_end, status (SCHEDULED/CANCELLED/COMPLETED), created_by |
| `attendance` | id, schedule_id, guard_id, check_in, check_out, status (PRESENT/LATE/ABSENT), check_in_lat, check_in_lng |
| `guard_locations` | id, guard_id, schedule_id, lat, lng, outside_geofence (bool), recorded_at |
| `incidents` | id, guard_id, location_id, title, description, severity, status, created_at |
| `panic_alerts` | id, guard_id, lat, lng, status (OPEN/ACKNOWLEDGED/RESOLVED), handled_by, created_at |
| `guard_requests` | id, guard_id, schedule_id, location_id, request_type, note, status, response_option, response_note, eta_minutes, handled_by, created_at, responded_at |

**Indexes:** `guard_locations(guard_id, recorded_at)`, `duty_schedules(guard_id, shift_start, shift_end)`, `attendance(guard_id, schedule_id)`, `guard_requests(location_id, status)`.
**Retention:** delete `guard_locations` older than 30 days (a Django management command is enough).

## 9. API Overview (REST, prefix `/api`)

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/accept-terms` | All (`accept-terms` and `me` need a token) |
| Legal | `GET /legal/terms`, `GET /legal/privacy` | Public |
| Guards | `GET/POST /guards`, `GET/PUT /guards/{id}`, `PATCH /guards/{id}/status` | Admin |
| Locations | `GET/POST /locations`, `PUT /locations/{id}`, `POST /locations/{id}/supervisors` | Admin (GET: Admin, Supervisor) |
| Schedules | `GET/POST /schedules`, `PUT/DELETE /schedules/{id}`, `GET /schedules/my` | Admin; `my` = Guard |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance` | Guard; list = Admin, Supervisor |
| Tracking | `POST /tracking/ping`, `GET /tracking/live` | Ping = Guard; live = Admin, Supervisor |
| Incidents | `POST /incidents`, `GET /incidents`, `PATCH /incidents/{id}` | Guard create; others read/update |
| Panic | `POST /panic`, `GET /panic`, `PATCH /panic/{id}` | Guard create; Admin, Supervisor handle |
| Quick requests | `POST /requests`, `GET /requests`, `PATCH /requests/{id}/respond`, `PATCH /requests/{id}/resolve` | Guard create and view own; Supervisor, Admin respond |
| Availability | `GET /supervisors/availability`, `PATCH /supervisors/me/status` | Guard reads; Supervisor sets |
| Reports | `GET /reports/attendance`, `/reports/schedule`, `/reports/performance` | Admin |

Response format: `{ success, data, error }`. Errors use proper HTTP codes (400, 401, 403, 404, 409 for schedule conflict).
The API contract is documented with **drf-spectacular (Swagger at `/api/docs/`)** and **frozen at end of Day 2**. Changes must be announced to the whole team.

## 10. Non-Functional Requirements (Realistic Targets)

- Normal API calls respond in under 3 seconds.
- HTTPS in deployment; passwords hashed; input validated by DRF serializers.
- Works on Chrome, Edge, Firefox (web) and Android 8+ (app).
- A seed command resets and fills the database in one step.
- Code in Git with pull requests; README explains setup.
- Daily database backup (a scheduled dump is enough).

## 11. Architecture

```
Android App (Guard) ──┐
                      ├──> Django REST API ──> PostgreSQL
Web App (Admin/Sup) ──┘        │
                               └── (optional) Channels / WebSocket push
```

Both clients talk only to the API. No direct database access. Polling is the baseline for "live" behaviour; Channels is an enhancement.

## 12. Team Split

| Members | Area |
|---|---|
| 2 | **Backend (Django):** (A) custom user + RBAC, guards, locations, schedules, Swagger docs, deployment. (B) attendance, tracking, incidents, panic, quick requests, reports, then Channels stretch. |
| 2 | **Web:** (A) management screens and scheduling. (B) live map, incidents, panic and requests dashboard, reports. |
| 2 | **Mobile:** (A) auth, duty view, check-in/out, quick requests. (B) background GPS, incidents, panic. |

Testing and the final report are shared; assign one owner each.

## 13. Phases and Checkpoints (15 Days)

Each phase ends with a **checkpoint**. Do not start the next phase's main work until the checkpoint is met, or the team agrees in writing what is being skipped. Progress is tracked in `PROGRESS.md`.

| Phase | Days | Focus | Checkpoint (exit criteria) |
|---|---|---|---|
| **0. Planning** | Before Day 1 | Analyze problem statement, fix scope, PRD, tech stack | PRD and tech stack agreed by all 6 members |
| **1. Foundation** | 1-2 | Repos, environment, custom user model, DB models, auth skeleton, seed command, **Swagger API contract frozen** | **CP1:** everyone can run backend, web and mobile locally; login works for all 3 roles; API contract frozen |
| **2. Core build** | 3-5 | Guards, locations, schedules (with overlap check), web and mobile login and shells, **background GPS spike on a real phone** | **CP2:** admin can create guard, location and shift; guard sees the shift on the phone; background GPS pings reach the backend with the screen locked |
| **3. Feature build** | 6-8 | Geofenced check-in/out, tracking and live map, incidents, panic, quick requests, supervisor availability, reports | **CP3:** every MVP feature (F1-F10 and F12) works on its own against the real API |
| **4. Integration** | 9-11 | End-to-end flows, fix API mismatches, optional Channels push (F11) | **CP4 (Day 10):** full demo script runs end to end locally; if Channels is not working, drop it and keep polling |
| **5. Testing and deploy** | 12-13 | RBAC and scoping tests, bug fixes, deploy backend and web, build APK | **CP5:** deployed system works on a real phone; APK installs; README lets a new person run it; `check_ui_rules.py` has no FAIL items |
| **6. Wrap-up** | 14-15 | Report, demo rehearsal, buffer | **CP6:** two full demo rehearsals done; report submitted; **no new features** |

**Cut order if behind:** Channels push, then report CSV export, then incident photos, then supervisor availability toggle. **Never cut:** geofenced check-in, live map, panic button, Terms and Privacy pages.

**Checkpoint rule:** if a checkpoint is missed by more than half a day, hold a short team meeting to decide what to cut. Do not silently carry the delay forward.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Backend team not experienced with Django/DRF | Confirm experience on Day 1; if both backend developers are new, reconsider the backend choice by Day 2 |
| Background GPS stops on some Android phones | Test on a real device in week one; foreground service with visible notification; document battery settings |
| Channels and ASGI deployment complexity | Optional stretch; polling is the baseline; Day 10 checkpoint |
| Web and mobile blocked waiting for backend | Freeze Swagger contract Day 2; use mock responses |
| Integration problems late | Integrate continuously from Day 6, not only Days 9-11 |
| Scope creep (payroll, chat) | Out-of-scope list in section 4 is binding |
| Dataset arrives late or in a different shape | Build with seed data; write a one-time import command when it arrives |
| UI rules broken by template defaults or generated code (gradients, emoji, default titles) | Run `scripts/check_ui_rules.py` before every merge to `dev`; replace default template assets on Day 1 |
| Legal text says something the system does not do | The policy is written from the real behavior in this PRD; re-read it against the code before CP5; mentor reviews it |

## 15. Demo Script

1. Admin logs in, adds a location (using "Use my current location"), adds a guard, schedules a shift.
2. Guard logs in on the phone and tries to check in from outside the radius (rejected), then inside (accepted).
3. Supervisor sees the guard moving on the live map; guard walks out and the marker turns red.
4. Guard sends "Is a supervisor available?"; supervisor replies "On my way"; guard sees the reply.
5. Guard files an incident and presses panic; supervisor sees both and acknowledges.
6. Admin opens attendance and performance reports.
7. Show the Terms and Privacy pages from the login screen, and the consent screen on a new guard's first login.

## 16. Definition of Done

Every MVP feature (F1-F10 and F12) meets its acceptance criteria and runs on the deployed backend. The APK installs and works on a real Android phone. Every item in the section 17.5 checklist is ticked. The README lets a new person run everything locally.

## 17. UI, Content and Compliance Rules (Dos and Don'ts)

Applies to the web app, the mobile app, the legal pages and every piece of text a user sees. Enforced in code review and by `scripts/check_ui_rules.py`. Design tokens and the full check procedure are in `TECH_STACK.md` section 10.

### 17.1 Don'ts

| Rule | What it means in this project |
|---|---|
| No purple gradient | No gradients anywhere, solid colors only. No purple, violet, fuchsia or indigo as brand or accent colors. |
| No fake reviews | No testimonials, ratings or quotes attributed to real or invented people or organizations. |
| No pill-shaped buttons | Buttons use a corner radius of 4 to 8 px. Fully rounded buttons are not allowed. Circular avatars and status dots are not buttons and are fine. |
| No emoji icons | No emoji in buttons, labels, alerts, toasts or empty states. Icons come from the icon library (Lucide) only. |
| No em dashes | No em dash or en dash characters in any user-facing text or legal text. Use a comma, colon, period or hyphen. Numeric ranges use a hyphen. |
| No crazy scroll animation | No scroll-triggered reveals, parallax or scroll hijacking. Motion only where it has a function (loading spinner, a 150 ms fade on dialogs and toasts), and it respects the reduced-motion setting. |
| No AI slop copy | Plain, specific sentences that say what happens. No filler such as "seamless", "revolutionary", "cutting-edge", "empower", "unlock", "leverage". No exclamation marks. No chatbot phrasing. Errors say what went wrong and what to do next. |
| No fake metrics | Every number on screen comes from the database. Empty states say "No data yet". No hard-coded totals, percentages, uptime or growth figures. Seed data exists only in dev and demo environments, and those show a visible "Demo data" label. |
| No AI slop photos | No stock or AI-generated photos. The app needs no photography; the map and icons are enough. A photo appears only if a user uploads their own. |
| No cursor animation | No custom cursors, cursor followers or trail effects. |
| No fake customer counters | No "trusted by N" or "N guards protected" style counters. Operational counts on the dashboard (for example guards on duty now) are allowed because they are live database queries. |
| No vague hero text | No hero banner and no marketing landing page. The login page is the entry point and carries one specific line: "Sign in to manage guard duties, attendance and live locations." (web) and "Sign in to see your duties and check in." (mobile). |

### 17.2 Dos

| Rule | What it means in this project |
|---|---|
| Remove the "Made with AI" tag | No "Made with", "Built with", "Generated by" or "Powered by" badge for any AI tool or site builder, in a footer, page title, `<meta name="generator">`, splash screen, app name, README or screenshot. Check every default template asset. |
| Add a Terms and Conditions page | Required. See F12 and 17.3. |
| Add a Privacy Policy page | Required. See F12 and 17.3. |
| Replace template defaults | Set a real page title and favicon on web, and a real app name, icon and splash screen on mobile. No default Vite, React or Expo branding left. |
| Keep the map attribution | Every map shows the "OpenStreetMap contributors" credit, as the OpenStreetMap licence requires. |

Note on the AI tag: removing it from the product is a UI rule. Separately, check your institution's rules on disclosing AI assistance in the project report and code, and follow them.

### 17.3 Legal page content requirements

Both pages are written in plain language, from what the system actually does, with a version number and a real "last updated" date.

**Terms and Conditions must cover:** who the service is for (the agency's staff and guards); account responsibility and no sharing of credentials; acceptable use; that guards are tracked by GPS during duty and agree to it by accepting; accuracy of records and reports; availability without guarantees (no promise of 99% uptime or similar); changes to the terms and how users are told; a real contact for questions.

**Privacy Policy must cover:** what is collected (name, contact details, ID number, date of birth, address, experience, attendance, shift records, incident reports, quick requests, login details); location is collected only from check-in to check-out, every 30 seconds, and kept for 30 days; who can see it (Admins and the Supervisors assigned to that site); why it is collected (attendance verification, safety, reporting); where data is stored and how it is protected (state only protections that really exist, such as HTTPS and hashed passwords); that data is not sold, and the third parties involved (hosting provider and OpenStreetMap map tiles); how long other records are kept; how a user asks to see, correct or delete their data (through the agency Admin); a real contact.

**Never include:** placeholder text, "Lorem ipsum", fake company names, claims that are not true (certifications, "bank-grade security", "military-grade encryption"), or legal clauses copied without being read.

**Disclaimer:** these pages are written for a student project and are not legal advice. Have your mentor review them. If this system ever goes to real use, a lawyer must review them under the data protection law that applies.

### 17.4 Visual defaults (details in TECH_STACK.md section 10)
Solid neutral surfaces, one blue accent, status colors (green, amber, red) used only for status, system font, 6 px corner radius, Lucide icons, no decorative imagery.

### 17.5 Review checklist (every merge to `dev`, and again before submission)
- [ ] `python3 scripts/check_ui_rules.py` shows no FAIL items; REVIEW items checked by hand
- [ ] No emoji, gradients, purple-family colors or em dashes anywhere in the UI
- [ ] Buttons are not pill-shaped
- [ ] No AI or builder tag; page title, favicon, app name and icon are the project's own
- [ ] Every number shown is from the database; empty states use "No data yet"
- [ ] No testimonials, counters, stock or AI photos
- [ ] `/terms` and `/privacy` open without login on web, and from the login screen on mobile
- [ ] Legal text matches the real behavior of the system (retention, tracking window, third parties)
- [ ] First-login consent works and background GPS does not start before acceptance
