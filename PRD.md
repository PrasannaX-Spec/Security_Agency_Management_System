Security Guard System: Detailed Phase Plan
Security Guard Information Management, Real-Time Monitoring, Attendance, Payroll and Client Billing System
Last updated: October 4, 2026. No timelines are included. Phase 1 status comes from your progress file dated October 3, 2026.
How to use this plan
•	Phases are ordered by dependency. A phase only needs things built in earlier phases.
•	Part A holds the rules that apply to every phase, including the UI, Content and Compliance rules (PRD section 17). Read it once, then check it at every pull request.
•	Part B has the 12 phases. Each lists backend, web, mobile, seed data, tests, UI checks and exit criteria.
•	Part C lists decisions the PRD leaves open, with a suggested default and the phase that needs the answer first.
•	Part D maps the 18-step demo to the phase that delivers each step.
•	Naming note: the new PRD calls the legal feature F22. The UI rules and the original PRD call it F12. They are the same feature.
Status Overview
#	Phase	Status	Relation to your earlier plan
1	Foundation, Auth, RBAC, Legal pages	Completed	Your old Phase 1
2	Foundation Extension (gap closing)	Next	New
3	Master Data Management	Planned	Old Phase 1 shells, plus new
4	Duty Scheduling	Planned	Old Phase 2, part 1
5	Geofenced Attendance	Planned	Old Phase 2, part 2
6	Consent Gate and Background GPS	Planned	Old Phase 3, part 1
7	Live Monitoring	Planned	Old Phase 3, part 2
8	Incidents, Panic, Quick Requests	Planned	Old Phase 3, part 3
9	Attendance Approval and Automation	Planned	New
10	Payroll Lite	Planned	New
11	Client Billing and Client App	Planned	New
12	Reports, Seed Completion, Hardening, Release	Planned	Old Phase 4, expanded
Part A: Rules for Every Phase
A1. Definition of done for every phase
•	Backend tests written and passing for every new endpoint: success case, validation failure, and one test per role that must be refused.
•	Every new endpoint appears in Swagger at /api/docs/ with request and response examples.
•	Every response uses the envelope {success, data, error}, including errors raised by validation, permissions and 404s.
•	Role checks are enforced in the API, never only by hiding a button in the UI.
•	python scripts/check_ui_rules.py reports 0 failures. Extend the script whenever a new file type or screen type is added.
•	python manage.py seed_demo is extended in the same phase when the phase adds new data, and the seeder still runs from an empty database.
•	Migrations apply cleanly on an empty database and on the current development database.
•	Every new screen has a loading state, an error state and an empty state that says No data yet.
•	The work is merged by pull request with at least one reviewer who checked the UI rules in section A2.
•	The progress file is updated (phase status, new endpoints, test count) in the same pull request.
A2. UI, content and compliance rules (PRD section 17)
These apply to the web app, the mobile app, the legal pages and every piece of text a user sees, including backend error messages and seed data. They are enforced in code review and by scripts/check_ui_rules.py. Design tokens and the full check procedure are in TECH_STACK.md section 10.
A2.1 Don'ts
Rule	What it means here	How to verify
No purple gradient	No gradients anywhere. Solid colors only. No purple, violet, fuchsia or indigo as brand or accent colors.	Search styles for gradient, from-, via-, to- utility classes and the color names above.
No fake reviews	No testimonials, ratings or quotes attributed to people or organizations, real or invented.	Review seed data and screens for quote blocks and star ratings.
No pill-shaped buttons	Button corner radius is 4 to 8 px. Fully rounded buttons are not allowed. Circular avatars and status dots are fine.	Search for rounded-full on button elements and for radius above 8 px on buttons, web and mobile.
No emoji icons	No emoji in buttons, labels, alerts, toasts, empty states, map markers or seed text. Icons come from Lucide only.	Run the emoji check in the script over source files, seed data, legal text and backend messages.
No em dashes	No em dash or en dash in any user-facing or legal text. Use a comma, colon, period or hyphen. Numeric ranges use a hyphen.	Scan web, mobile, legal text, backend error messages, validation messages and seed text.
No crazy scroll animation	No scroll-triggered reveals, parallax or scroll hijacking. Motion only where it has a function: loading spinner, and a 150 ms fade on dialogs and toasts. Respect reduced motion.	Search for scroll listeners that animate, and confirm a reduced-motion rule exists.
No AI slop copy	Plain, specific sentences. No filler such as seamless, revolutionary, cutting-edge, empower, unlock, leverage. No exclamation marks. Errors say what went wrong and what to do next.	Run the banned-word and exclamation-mark check. Read every error message once in review.
No fake metrics	Every number on screen comes from the database. Empty states say No data yet. No hard-coded totals, percentages, uptime or growth figures. Seed data shows a visible Demo data label.	Trace each dashboard number to a query. Divisions with a zero denominator show No data yet, not 0 or 100 percent.
No AI slop photos	No stock or AI-generated photos. A photo appears only if a user uploads their own (for example an incident photo).	Check assets folders and splash screens.
No cursor animation	No custom cursors, cursor followers or trail effects.	Search for cursor styles and mousemove effects.
No fake customer counters	No trusted by N or N guards protected counters. Live operational counts such as guards on duty now are allowed because they are database queries.	Confirm each count on a dashboard is a live query.
No vague hero text	No hero banner and no marketing landing page. The login page is the entry point with one line. Web: Sign in to manage guard duties, attendance and live locations. Mobile: Sign in to see your duties and check in.	Check the web and mobile login screens for exactly these lines.

A2.2 Dos
Rule	What it means here	How to verify
Remove the Made with AI tag	No Made with, Built with, Generated by or Powered by badge for any AI tool or site builder in a footer, page title, meta generator tag, splash screen, app name, README or screenshot. Check every default template asset.	Search the repo, the built HTML, README and screenshots.
Terms and Conditions page	Required. Public page at /terms on web and readable inside the mobile app.	Page loads without login.
Privacy Policy page	Required. Public page at /privacy on web and readable inside the mobile app.	Page loads without login.
Replace template defaults	Real page title and favicon on web. Real app name, icon and splash screen on mobile. No default Vite, React or Expo branding left.	Check index.html, public folder, app.json and the asset folder.
Keep the map attribution	Every map shows the OpenStreetMap contributors credit, as the OpenStreetMap licence requires. This includes the web live map, any site location picker, and any map on mobile.	Open each map and confirm the credit is visible and not covered by other UI.

AI disclosure note: removing the AI tag from the product is a UI rule. Separately, check your institution's rules on disclosing AI assistance in the project report and code, and follow them.
A3. Engineering rules
•	Money: Use Decimal with ROUND_HALF_UP quantized to two decimal places. Never use float for payroll or billing. Store money in DecimalField, for example max_digits 12 and decimal_places 2.
•	Time: Use timezone-aware datetimes (USE_TZ on). Store in UTC and display in the agency's local time zone. Never compare naive datetimes. The server clock decides check-in windows and lateness, never the phone clock.
•	Deletion: Soft delete through a status field. Do not hard delete guards, sites, clients, shifts, attendance, payslips or invoices.
•	Timestamps: Every table has created_at and updated_at. Approvals and finalizations also store who and when.
•	API paths: Your existing endpoints use a trailing slash (for example /api/auth/login/). Use the same style for every new endpoint. The PRD lists paths without the slash, treat them as the same endpoints. A mismatch causes redirect errors on POST requests.
•	HTTP codes: 400 validation, 401 not logged in or expired token, 403 role not allowed, 404 not found or not in your scope, 409 conflict (schedule overlap, duplicate payroll run, duplicate invoice). Choose 403 or 404 for out-of-scope records once, and use it everywhere.
•	Error codes: Business-rule failures return a stable machine code (for example OUTSIDE_GEOFENCE) plus a plain message. The mobile and web apps show the message and branch on the code.
•	Duplicates: Any action a user can double-tap or retry (check-in, panic, payroll calculate, invoice create) must be safe to repeat: it returns the existing record or a 409, never a second record.
•	Concurrency: Wrap scheduling, payroll finalization and invoice finalization in transactions. Use select_for_update where two requests could pass the same check at the same time.
•	Scoping: Put role and ownership filtering in one reusable place (queryset helpers or permission classes) and reuse it. Do not repeat filters by hand in each view.
•	No new frameworks: No Celery, Redis, Firebase or other new backend technology. Scheduled work is a Django management command run by the server's scheduler (cron).
•	Fonts, icons, map: Use only what TECH_STACK.md section 10 defines. Map tiles must be OpenStreetMap with attribution.
Part B: Phases
Phase 1: Foundation, Auth, RBAC, Legal Pages
Status: Completed (progress file dated October 3, 2026)
Goal: Base project that every other module depends on.
Depends on: None.
Delivered
•	Backend: 11 Django apps (accounts, guards, locations, schedules, attendance, tracking, incidents, panic, requests, reports, legal). Custom user model with ADMIN, SUPERVISOR and GUARD roles and Terms and Privacy acceptance tracking. PostgreSQL schema with indexes and soft-delete statuses.
•	Auth endpoints: POST /api/auth/login/, POST /api/auth/refresh/, GET /api/auth/me/, POST /api/auth/accept-terms/.
•	Legal endpoints: GET /api/legal/terms/ and GET /api/legal/privacy/ (public, versioned).
•	Docs and data: OpenAPI schema and Swagger UI at /api/docs/. seed_demo creates 1 Admin, 2 Supervisors, 15 Guards, 5 Sites and 105 non-overlapping shifts. 18 backend tests passing.
•	Web: React 18, Vite, Tailwind. Role-based navigation, JWT with automatic refresh, protected routes, mandatory consent modal, public /terms and /privacy, dashboard shells.
•	Mobile: Expo SDK 57 and React Native 0.86.3. Safe-area handling, guard login with guard-only enforcement, consent flow, shells for My Duties, Duty Check-In, Incident Reporting, Emergency Panic, Quick Requests and Profile. GPS permissions and Task Manager declared in app.json.
•	Quality: scripts/check_ui_rules.py with 0 failures over 50 files. django-stubs configured.
Verify before starting Phase 2 (one-time audit against the new PRD)
•	Confirm every existing endpoint returns {success, data, error}, including login failures and legal endpoints.
•	Confirm a deactivated user is refused at login and that an already-issued access token for a deactivated user stops working at the next refresh.
•	Confirm the Terms and Privacy text covers what F22 requires: GPS disclosure, location collection period, data retention and user data rights. If the retention period is still a placeholder, record it as an open decision (see Part C).
•	Confirm the legal text, login lines and all messages contain no em dashes, en dashes, emoji or exclamation marks.
•	Confirm the login lines match exactly: web Sign in to manage guard duties, attendance and live locations. Mobile Sign in to see your duties and check in.
•	Confirm template defaults are gone: page title, favicon, app name, app icon, splash screen, meta generator tag, README wording.
•	Confirm the 105 seeded shifts pass the overlap rule from Phase 4 (new_start < existing_end AND new_end > existing_start), so the new validator does not reject the seed.
Exit criteria
Phase 1 is closed once the audit list above is ticked. No rework of the delivered code is planned beyond fixes the audit finds.
Phase 2: Foundation Extension (Gap Closing)
Status: Next
Goal: Add what the new PRD needs that Phase 1 did not build, so later phases never force a schema rewrite.
Depends on: Phase 1 audit complete. Decisions D1, D22 and D24 (Part C) settled.
Backend: roles and permissions
•	Add the CLIENT role to the user model, with a migration. Update login, /api/auth/me/ and the role enum everywhere it is used.
•	Create reusable permission classes: IsAdmin, IsSupervisor, IsGuard, IsClient, plus a combined class for views shared by several roles.
•	Create reusable scoping helpers: supervisor sees only sites assigned through supervisor_assignments; client sees only their own sites, guards and invoices; guard sees only their own records.
•	Confirm the deactivated-user rule applies to all four roles.
Backend: new and changed data models
•	clients: New app. Fields: company name, contact person, phone, email, address, status, and a one-to-one link to the client's login user. Creating a client creates the login account in one transaction.
•	supervisors: Profile model linked to the user. Fields: phone, status, availability (AVAILABLE, BUSY, OFF_DUTY). Place it in accounts or a new app, decide once.
•	supervisor_assignments: Supervisor to site, with active flag and timestamps. A supervisor can have many sites. Decide whether a site can have more than one supervisor (default: one primary supervisor on the site plus assignment rows).
•	locations (sites): Confirm fields: name, client, address, latitude, longitude, geofence radius in meters, assigned supervisor, status. Add the client link if missing.
•	posts: New model inside locations. Fields: name or number, site, required guard count, shift information, status.
•	guards: Add wage fields: wage_type (DAILY or HOURLY) and wage_rate as DecimalField. Confirm DOB, address, experience, joining date, ID number and status exist.
•	payroll and billing apps: Register empty apps now. Their models are added in Phases 10 and 11 so no unused tables exist.
•	Shared base: created_at, updated_at and a status-based soft delete on all new models.
Web
•	Add Admin navigation entries (Clients, Posts, Payroll, Billing) as shells with No data yet states. Supervisor navigation stays limited to its own pages.
•	Add the Demo data label component, driven by a backend flag (see Phase 12). The component exists now so every later screen inherits it.
Mobile
•	Remove the guard-only login rule. Add a role router after login: GUARD, SUPERVISOR and CLIENT each get their own tab set.
•	Supervisor and Client tab sets start as shells. Guard tabs stay as they are.
•	Apply the same safe-area handling to the new tab sets.
Seed data
•	Extend seed_demo with 2 clients, their login users, links from the 5 sites to clients, 2 to 3 posts per site, supervisor_assignments, and wage values on the 15 guards.
•	Re-link the 105 shifts to client and post once Phase 4 adds those columns.
Tests required
•	Each of the four roles can log in, and a wrong password is refused with a plain message.
•	Guard calls an Admin endpoint: 403. Supervisor requests a site not assigned: refused. Client requests another client's site: refused.
•	Deactivated guard, supervisor, client and admin cannot log in.
•	Creating a client creates exactly one user. If the client insert fails, no orphan user remains.
•	Wage fields reject negative values and accept only Decimal-safe input.
UI and content checks for this phase
•	Login still shows the single required line. New role tabs use Lucide icons and no emoji.
•	Shell pages say No data yet, not placeholder numbers.
Exit criteria
All four roles log in and land on the right navigation. Role and scope tests pass. New tables exist with migrations. check_ui_rules.py shows 0 failures.
Phase 3: Master Data Management
Status: Planned
Goal: Admin can create and manage every record that scheduling and attendance refer to (F2, F3, F4, F5).
Depends on: Phase 2.
Backend: endpoints
•	Guards: List, create, view, edit, deactivate. Creating a guard creates the login user in one transaction.
•	Supervisors: List, create, edit, activate and deactivate, assign to sites, view status.
•	Clients: GET and POST /api/clients/, GET and PUT /api/clients/{id}/, PATCH /api/clients/{id}/status/.
•	Sites: GET and POST /api/sites/, PUT /api/sites/{id}/.
•	Posts: GET and POST /api/posts/, PUT /api/posts/{id}/.
•	All list endpoints support pagination, search and a status filter. Supervisors, clients and guards get only the rows in their scope.
Backend: validation rules
•	Latitude between -90 and 90. Longitude between -180 and 180. Reject text, empty values and swapped coordinates where obvious.
•	Geofence radius is a positive whole number of meters. Reject zero and negative values.
•	Required guard count on a post is at least 1.
•	Phone, email and ID number formats validated, and uniqueness enforced where the business needs it (for example guard ID number).
•	A post must belong to a site, and a site to a client.
•	Deactivation is a status change. Deactivating a user sets the login to inactive. Decide the rule for a guard who still has future shifts (decision D20).
•	Initial password handling follows decision D21. Never return a password in any response.
Web
•	Admin screens for guards, supervisors, clients, sites and posts: list with search and pagination, create and edit forms, deactivate with a confirmation dialog.
•	Site form takes latitude, longitude and radius. If a map preview is added, it must be OpenStreetMap with the attribution visible.
•	Supervisor assignment screen: pick a supervisor, pick sites, save.
•	Form errors name the field and say what to fix. Example: Radius must be a whole number greater than 0.
Mobile
•	Guard Profile screen reads real data from the API. Supervisor and Client profile screens show their own details.
Seed data
•	Seeded data uses the same creation rules, so the seeder cannot create records the API would reject.
Tests required
•	Create, edit and deactivate for each entity, as Admin.
•	Supervisor sees only assigned sites. Client sees only own sites. Guard cannot list other guards.
•	Invalid coordinates, radius and guard count return 400 with clear messages.
•	Duplicate unique fields return 400, not a server error.
•	Atomic creation: failure while creating the login rolls back the guard row.
UI and content checks for this phase
•	Forms and tables use solid colors, 4 to 8 px button radius, no emoji, no exclamation marks.
•	Confirmation dialogs fade in 150 ms at most and respect reduced motion.
Exit criteria
Admin can create Client, Site, Post, Guard and Supervisor, link them together, and see them in lists. Scoped roles see only their own data.
Phase 4: Duty Scheduling
Status: Planned
Goal: Assign guards to shifts and make double booking impossible (F6).
Depends on: Phase 3.
Backend: model and validation
•	duty_schedules fields: guard, client, site, post, shift_start, shift_end, status (SCHEDULED, CANCELLED), timestamps.
•	shift_end must be later than shift_start. Overnight shifts are valid because comparison uses full datetimes.
•	The post must belong to the site, the site to the client, and the guard must be active.
•	Overlap rule: reject when new_start < existing_end AND new_end > existing_start for the same guard. Return HTTP 409 with a message naming the clashing shift time.
•	Exclude cancelled shifts from the check. When editing a shift, exclude that shift itself.
•	Back-to-back shifts (one ends exactly when the next starts) are allowed because the comparison is strict.
•	Run the check and the insert inside one transaction and lock the guard row (select_for_update) so two simultaneous requests cannot both pass.
•	Optional hardening: a PostgreSQL exclusion constraint on guard and time range (needs the btree_gist extension) as a second safety net.
•	Show assigned versus required guards for a post. Treat exceeding the requirement as a warning, not an error, unless the team decides otherwise.
Backend: endpoints
•	Admin: list (filters for date, guard, site, status), create, edit, cancel.
•	Guard: GET my duties, returning current and upcoming shifts only, ordered by start time.
•	Supervisor: shifts for assigned sites. Client: no write access.
Web
•	Scheduler screen with date filter and list or calendar view. Create form with cascading pickers: client, then site, then post, then guard.
•	A 409 from the API is shown inline with the conflicting shift time, and the form keeps the user's input.
Mobile
•	MyDutiesScreen loads real shifts: current shift highlighted, upcoming list, pull to refresh.
•	Loading, error with retry, and No duties assigned states.
Seed data
•	Validate all 105 existing shifts against the new rule. Fix any that fail. Link shifts to client and post.
Tests required
•	Overlap matrix for the same guard: identical times, new starts inside existing, new ends inside existing, new contains existing, existing contains new. All return 409.
•	Allowed cases: back-to-back shifts, a different guard at the same time, a cancelled existing shift, editing a shift without changing its own time.
•	Two simultaneous create requests for the same guard and time: exactly one succeeds.
•	Guard sees only own shifts. Supervisor sees only assigned sites.
UI and content checks for this phase
•	Times display in the agency time zone in one consistent format.
•	Conflict message is plain and specific. Example: This guard already has a shift from 08:00 to 16:00 on 12 October.
Exit criteria
An overlapping shift is rejected with 409. The guard sees today's duty on a real phone. The seed passes the same rule.
Phase 5: Geofenced Attendance
Status: Planned
Goal: Verified check-in and check-out with automatic PRESENT or LATE status (F7).
Depends on: Phase 4. Decisions D11, D12, D13 settled.
Backend: model
•	attendance fields: schedule (one attendance per shift), guard, check_in_time, check_in lat and lng, check_in_distance_m, check_out_time, check_out lat and lng, status (PRESENT, LATE, ABSENT), flags (for example MISSING_CHECKOUT), worked_minutes, approval_status (PENDING, APPROVED, REJECTED), approved_by, approved_at.
•	Approval and flag fields are created now to avoid a later migration. Their logic is built in Phase 9.
Backend: check-in rules, in this order
•	1. The user is a guard and the shift belongs to them.
•	2. The shift is SCHEDULED, not cancelled.
•	3. Server time is inside the window: from 15 minutes before shift_start until shift_end.
•	4. No check-in exists yet. A repeated request returns the existing record and creates nothing new.
•	5. Coordinates are present and valid.
•	6. Haversine distance in meters between the guard and the site is within the geofence radius. Outside: reject.
•	7. Status is PRESENT, or LATE when the check-in is later than shift_start plus 10 minutes (decision D11 fixes the exact boundary).
•	Store the distance, the coordinates and the server time on the record.
•	Stable error codes: OUTSIDE_GEOFENCE (message includes distance and allowed radius), CHECKIN_TOO_EARLY, CHECKIN_WINDOW_CLOSED, ALREADY_CHECKED_IN, NOT_YOUR_SHIFT, INVALID_COORDINATES.
•	Haversine is a pure function with its own unit tests. Use meters and a fixed earth radius constant.
Backend: check-out and history
•	Check-out requires an existing check-in and no earlier check-out. Store time and coordinates. Compute worked_minutes. Decision D12 says whether an outside-geofence check-out is rejected or only flagged.
•	GET my attendance with date filters. Supervisor and Admin list endpoints are read-only in this phase.
Mobile
•	Duty Check-In screen: shows the current shift, asks for foreground location permission at the moment of check-in, reads GPS, sends the request, and shows a clear result (accepted, late, rejected with distance).
•	Disable the button while a request is in flight to stop double taps.
•	Handle: permission denied, GPS off, no signal, timeout. Each shows a plain message and a retry. A retry after a lost response is safe because duplicates are idempotent.
•	Check-out button appears only after check-in.
•	Attendance history list for the guard.
Web
•	Read-only attendance list for Admin and Supervisor with filters. Review actions arrive in Phase 9.
Tests required
•	Check-in: before the window, at the window opening, on time, late, at shift end, after shift end.
•	Inside radius accepted, just outside rejected, exactly on the boundary behaves as the team decided.
•	Duplicate check-in returns the same record. Another guard's shift is refused. Cancelled shift refused.
•	Haversine tests against known coordinate pairs.
•	Check-out without check-in refused. Second check-out refused.
UI and content checks for this phase
•	Error messages say what happened and what to do. Example: You are 240 m from the site. Move within 100 m and try again.
Exit criteria
Check-in outside the geofence is rejected, inside is accepted with the correct status, check-out works, and history shows both on a real phone.
Phase 6: Consent Gate and Background GPS
Status: Planned
Goal: Collect location in the background only during an active shift and only after consent (F9 mobile side, F22).
Depends on: Phase 5. Decision D15 (retention period) settled.
Consent
•	Terms and Privacy acceptance already exists. Add a separate GPS disclosure consent with a version and timestamp, shown at first login. It states what is collected, that collection happens only during an active shift, how often (every 30 seconds), the retention period and the user's data rights.
•	Tracking may start only when all three are true: Terms accepted, GPS disclosure accepted, and OS location permission granted (foreground first, then background).
•	If the user declines, the app still works for everything except background tracking, and says so plainly.
•	The backend enforces the same rule: a location ping from a user without GPS consent is refused.
Backend
•	guard_locations fields: guard, schedule or attendance, latitude, longitude, accuracy, recorded_at (device time), received_at (server time), distance_to_site_m, within_geofence (computed on the server, never trusted from the phone).
•	Indexes on (guard, recorded_at) and (schedule, recorded_at).
•	POST /api/tracking/location/ accepts a ping. Accept an array so queued pings can be sent after a network outage.
•	Refuse pings when the guard is not checked in on an active shift. Ignore exact duplicates of the same guard and recorded_at.
•	Retention: a management command deletes locations older than the agreed retention period. The legal text and the command use the same number.
Mobile
•	Use expo-location with a task defined through expo-task-manager. Start after a successful check-in. Stop on check-out and also stop when the shift end time passes, as a safety net.
•	Send a point about every 30 seconds. Android may not honor the interval exactly, so measure it on the real phone and record the observed behavior.
•	Android needs a visible foreground-service notification for reliable background location. Set its title and text in plain words, with no emoji or exclamation marks.
•	Offline queue: store pings locally when the network fails, send them in order when it returns, cap the queue size, drop the oldest beyond the cap.
•	GPS unavailable: show a clear status in the app and keep trying, do not crash.
•	Test background behavior in a development build or the APK on a real phone. Expo Go may not support background location reliably, so do not treat Expo Go results as proof.
•	Test: screen off, app in background, battery saver on, phone locked for 10 minutes. Write down what happens if the user force-closes the app.
Seed data
•	Add sample guard_locations for demo shifts, including some outside the geofence.
Tests required
•	Ping without consent: refused. Ping without an active checked-in shift: refused. Valid ping: stored with a correct within_geofence value.
•	Batch upload preserves order and skips duplicates.
•	Retention command removes only old rows.
•	Real-device checklist signed off: starts only after consent, runs in background, stops on check-out.
UI and content checks for this phase
•	Consent and disclosure screens follow the text rules: plain sentences, no em dashes, no exclamation marks.
•	Terms and Privacy remain reachable from the Profile screen after first login.
Exit criteria
On a real Android phone, GPS is sent about every 30 seconds in the background during a shift, nothing starts before consent, and it stops after check-out.
Phase 7: Live Monitoring
Status: Planned
Goal: Supervisors and Admins see guards on a map and see geofence violations (F9, F10).
Depends on: Phase 6. Decisions D14 and D23 settled.
Backend
•	GET /api/tracking/live/ returns the latest location for each guard on an active shift: guard, site, latitude, longitude, last_update, geofence_status (INSIDE or OUTSIDE), activity (ACTIVE or INACTIVE).
•	INACTIVE means no ping within the stale threshold (decision D14).
•	Scope: Admin sees all. Supervisor sees only assigned sites. Client has no access.
•	Fetch the latest row per guard in one query (PostgreSQL DISTINCT ON through the ORM) with select_related. Avoid one query per guard. Response stays under 3 seconds.
•	Supervisor availability: endpoint to set AVAILABLE, BUSY or OFF_DUTY, visible to Admin.
Web
•	Live map page for Admin and Supervisor. Poll every 10 seconds. Do not start a new request while one is still running. Pause polling when the browser tab is hidden. Keep the last map visible if one poll fails and show a small error note.
•	Show each guard, site geofence circles, last update time and activity.
•	Outside the geofence: the label OUTSIDE GEOFENCE and a highlighted marker. Do not rely on color alone, the text label is required.
•	Markers are circles or Lucide icons, never emoji.
•	OpenStreetMap contributors credit visible on the map at all times.
•	Empty state: No guards on duty now.
•	Supervisor dashboard uses the same endpoint, already scoped.
Mobile (Supervisor)
•	Compact view: assigned sites, guards on duty, attendance state, last location, geofence status.
•	Availability toggle.
•	If a map is shown, it carries the same OpenStreetMap credit.
Tests required
•	Latest-per-guard logic: three pings for one guard return only the newest.
•	Outside-geofence flag appears when the newest ping is outside the radius.
•	A guard with no recent ping becomes INACTIVE.
•	Supervisor cannot see guards from unassigned sites. Client gets 403.
•	Response time with the seeded data stays under 3 seconds.
UI and content checks for this phase
•	No pulsing or animated marker effects that are not functional. Reduced motion respected.
•	Attribution is not hidden behind panels or controls on small screens.
Exit criteria
A supervisor watches a guard move on the live map, sees the OUTSIDE GEOFENCE label and highlight when the guard leaves, and sees only their own sites.
Phase 8: Incidents, Panic Alerts, Quick Requests
Status: Planned
Goal: Field communication and emergencies (F11, F12 panic, F13).
Depends on: Phase 7. Decisions D16, D17, D18 settled.
Incidents
•	Fields: title, description, severity (LOW, MEDIUM, HIGH), location (from device GPS, with the site recorded), time, status, reporter.
•	Status values follow decision D16 (suggested: OPEN, UNDER_REVIEW, RESOLVED).
•	Guard creates and sees own incidents. Supervisor and Admin see incidents for their scope, review them, and update status.
•	Photo upload is reducible. If built, only the user's own uploaded photos are shown, and file type and size are validated.
•	Decide which incident fields a Client may see later (decision D19). Build the model so those fields can be filtered.
Panic alert
•	Guard triggers it. Record guard, GPS, time, status OPEN.
•	It must work even when GPS is unavailable: send with empty location rather than fail. An emergency action must not be blocked by a validation error.
•	Repeated presses by the same guard while an alert is OPEN return the existing alert instead of creating many.
•	Status moves forward only: OPEN, ACKNOWLEDGED, RESOLVED. Store who acknowledged and who resolved, and when.
•	Supervisor and Admin see it by polling every 5 seconds.
•	Mobile: a confirm step that is quick to complete, to prevent accidental triggers. The guard sees the current status of their alert.
Quick requests
•	Predefined types: Supervisor available, Need relief, Need backup, Equipment or site issue, Schedule query, Other. No free-text chat. If Other carries a note, keep it short with a maximum length (decision D18).
•	Predefined replies: On my way, Please wait, Approved, Call me, Declined.
•	Status: OPEN, REPLIED, RESOLVED. Who may mark RESOLVED follows decision D17.
•	Guard sees the reply in the app. Supervisor and Admin poll every 5 seconds.
Web and Mobile
•	Web: panic banner with time and guard, requests inbox, incident list with filters and status update. Alerts use text and Lucide icons, no emoji.
•	Guard mobile: replace the three shells (Incident Reporting, Emergency Panic, Quick Requests) with working screens.
•	Supervisor mobile: panic, incidents and requests lists with response actions.
Seed data
•	Add sample incidents, panic alerts and requests with plain demo text that follows the content rules.
Tests required
•	Guard cannot read another guard's incident. Supervisor cannot read an unassigned site's incident.
•	Panic without GPS succeeds. Repeated panic returns the existing alert. Status cannot move backward.
•	Request status flow OPEN to REPLIED to RESOLVED, and invalid jumps are refused.
UI and content checks for this phase
•	Panic and error text is short and plain. No exclamation marks, even on emergency screens.
Exit criteria
A guard can raise an incident, a panic alert and a request, and a supervisor or admin sees each within about 5 seconds and can respond.
Phase 9: Attendance Approval and Automation
Status: Planned
Goal: Turn raw attendance into approved records that payroll can trust (F8).
Depends on: Phase 8. Decisions D9, D10 settled.
Automation (no new framework)
•	Write a management command (for example process_attendance) run by cron every few minutes. Do not add Celery or Redis.
•	The command is idempotent: running it twice changes nothing the second time.
•	Shift ended and no check-in: create or mark the attendance as ABSENT.
•	Shift ended and check-in without check-out: set the MISSING_CHECKOUT flag.
•	Both times exist: calculate worked_minutes.
•	Move processed records to PENDING review so they appear in the approval queue.
Approval
•	Endpoints: list with filters, approve, reject. Supervisor works only on assigned sites. Admin works on all.
•	Reject stores a reason. Approve and reject store who and when.
•	A flagged record follows decision D10. Suggested default: it cannot be approved until the approver enters a corrected check-out time with a reason, or rejects it.
•	State changes are explicit: PENDING to APPROVED or REJECTED. Block repeating the same action and block edits to approved records once a payroll run has used them.
•	Guard sees approved attendance in My Attendance.
•	Approved attendance is the only input to payroll.
Web and Mobile
•	Web: approval queue with filters (pending, flagged, site, date), approve and reject actions, reason dialog.
•	Supervisor mobile: attendance state view. Approval from mobile is reducible, approval on web is required.
•	Guard mobile: attendance list shows status and approval state with plain labels.
Seed data
•	Add approved and pending attendance, one missing check-out, and one absence.
Tests required
•	Run the command twice: no duplicate absences, no changed rows.
•	Missing check-out flagged. Worked minutes correct for normal, overnight and late cases.
•	Supervisor cannot approve another site's record. Double approval refused. Reject without reason refused.
•	Approved record used by a payroll run cannot be edited.
UI and content checks for this phase
•	Status labels are plain words. Flags show text, not only color.
Exit criteria
A missing check-out is flagged automatically, supervisors and admins approve or reject within their scope, and approved attendance is ready for payroll.
Phase 10: Payroll Lite
Status: Planned
Goal: Calculate and publish guard payroll from approved attendance (F14, F15).
Depends on: Phase 9. Decisions D1 to D5 settled. The provided seed or demo numbers for testing are available.
Models
•	payroll_runs: period start and end, status (DRAFT, CALCULATED, FINALIZED), created_by, finalized_at.
•	payslips: run, guard, payable days or hours, gross, total deductions, net.
•	payslip_lines: payslip, type (EARNING or DEDUCTION), code, label, quantity, rate, amount.
•	All money fields are DecimalField with two decimal places.
Calculation engine
•	Pure functions in their own module with no database or ORM calls. Inputs are plain values, outputs are Decimal.
•	Basic pay = approved payable days x daily wage, or approved hours x hourly rate, as set by wage_type.
•	Then overtime, allowances and deductions where configured, giving gross, deductions and net. Statutory rates, if any, are sample values and are labelled Sample or Demo.
•	Rounding: ROUND_HALF_UP to two decimals at the point decision D4 fixes. The lines of a payslip must add up exactly to its gross, deductions and net.
•	Never use float. Add a test or code check that no float is used in the payroll module.
•	Tested against the provided seed or demo numbers.
Rules and endpoints
•	Only APPROVED attendance inside the period counts. Pending, rejected and flagged records are excluded.
•	Payroll must not pay the same attendance twice: a finalized run locks the attendance it used, and overlapping periods are refused.
•	Duplicate calculation for the same period returns the existing DRAFT run, recalculates it, or returns 409, as the team decides. A FINALIZED run never changes.
•	GET /api/payroll/, POST /api/payroll/calculate/, GET /api/payroll/{id}/, POST /api/payroll/{id}/finalize/, GET /api/payroll/my/.
•	Admin only for everything except /my/. A guard sees only their own finalized payslips.
Web and Mobile
•	Web (Admin): choose period, calculate, review a table of guard, payable days, gross, deductions, net, finalize with a confirmation. Show how many attendance records in the period were excluded because they are not approved.
•	Mobile (Guard): list of finalized payslips and a detail view with line breakdown. Sample or Demo label where values are demo values.
•	One currency format everywhere.
Out of scope for this phase
•	PF, ESI and GST filing, bank files, advances, loans, full statutory compliance, PDF payslips.
Tests required
•	Calculation tests with known inputs and expected outputs, including values that end in .005 to prove half-up rounding.
•	Lines sum to totals. Net equals gross minus deductions.
•	Pending attendance excluded. Same period twice does not double pay. Finalized run cannot be changed.
•	Non-admin cannot calculate or finalize. Guard sees only own payslips.
UI and content checks for this phase
•	All numbers come from payslip rows. A guard with no payslip sees No data yet.
Exit criteria
Payroll calculates correctly from approved attendance, an admin finalizes it, and the guard views it on the phone.
Phase 11: Client Billing and Client App
Status: Planned
Goal: Bill clients and give them a read-only view of their operations (F16, F17, F19).
Depends on: Phase 10. Decisions D5 to D8 and D19 settled.
Models and calculation
•	invoices: client, site (optional), period start and end, invoice number, status (DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE), subtotal, tax amount, total, due date, issued_at.
•	invoice_lines: description, quantity, rate, amount.
•	Subtotal = sum of quantity x rate. Tax = subtotal x tax rate, then total. Pure functions, Decimal, ROUND_HALF_UP, same rounding rule as payroll.
•	The tax rate is a setting, not a number typed into code, and is labelled Sample tax.
•	Invoice number is generated by the server and is unique. Suggested: assign at finalization so drafts do not leave gaps.
•	Quantity source follows decision D8.
Rules and endpoints
•	Edit only while DRAFT. Finalize changes DRAFT to ISSUED and makes it read-only.
•	Duplicate creation for the same client, site and period is refused or returns the existing draft (decision D8).
•	PAID and PARTIALLY_PAID are set by Admin as status only. There is no payment allocation. OVERDUE follows decision D7 (suggested: derived from due date on read).
•	GET and POST /api/invoices/, GET and PUT /api/invoices/{id}/, POST /api/invoices/{id}/finalize/, GET /api/invoices/my/.
•	Client sees only own invoices and never sees DRAFT. One client can never open another client's invoice by changing the ID.
•	Client billing history is available to Admin from the client record.
Client mobile app
•	Tabs: Dashboard, Sites, Guards, Attendance, Incidents, Invoices.
•	Client read endpoints for each tab, scoped to the client's own sites. Guards and incidents show only the fields allowed by decision D19.
•	Dashboard values, all from queries: Active Sites, Guards On Duty, Today's Attendance percentage, Open Incidents, Pending Invoices.
•	Write each formula down before coding. Suggested: Today's Attendance = guards checked in (PRESENT or LATE) divided by guards whose shift has started today at the client's sites. If the denominator is 0, show No data yet.
•	Pending Invoices counts ISSUED, PARTIALLY_PAID and OVERDUE.
•	Invoice list, detail and history. Read-only.
Web (Admin)
•	Billing page: create invoice with lines, edit draft, finalize with confirmation, list with filters, view history per client.
Seed data
•	Add invoices in each status, with lines, and mark them as Demo data.
Tests required
•	Calculation tests with half-up rounding. Totals match lines.
•	Draft editable, issued not editable. Finalize twice is safe.
•	Client A cannot read client B invoices, sites, guards or incidents. Client never sees drafts.
•	Dashboard numbers match hand-counted values on seed data. Zero-denominator case shows No data yet.
UI and content checks for this phase
•	No chart or counter on the client dashboard that is not a live query.
•	No hero banner on the client home screen.
Exit criteria
An admin creates and finalizes an invoice, the client sees it on their phone along with sites, guards, attendance and incidents, and cannot see anyone else's data.
Phase 12: Reports, Seed Completion, Hardening, Release
Status: Planned
Goal: Prove the whole flow works on a real phone and ship it (F20 and Definition of Done).
Depends on: Phases 1 to 11.
Reports (Admin; Supervisor limited to assigned sites)
•	Attendance: Present, Late, Absent, Approved, Pending, by date range, site and guard.
•	Guard performance: attendance rate, on-time rate, geofence violations, incidents.
•	Payroll: guard, payable days, gross, deductions, net.
•	Billing: client, site, period, invoice amount, status.
•	Write each metric definition in the report screen help text. Suggested: attendance rate = PRESENT plus LATE divided by shifts that have ended. On-time rate = PRESENT divided by PRESENT plus LATE. Geofence violation = a defined count of outside-geofence events, decide whether it is pings or separate episodes.
•	CSV export is optional. If built, protect against spreadsheet formula injection by neutralizing cells that start with =, +, - or @.
•	Empty report: No data yet.
Seed completion
•	seed_demo creates every item in the PRD list: admin, supervisors, clients, guards, sites, posts, schedules, approved and pending attendance, GPS records, incidents, panic alerts, requests, payroll records, invoices.
•	Seed text follows the content rules (no em dashes, emoji or exclamation marks, no invented quotes or reviews).
•	The seeder refuses to run in a production environment unless an explicit flag is passed.
•	A backend flag tells web and mobile that demo data is present, and the Demo data label shows on every screen that displays seeded values.
•	The seeder is repeatable: running it again does not duplicate records.
Hardening
•	Reliability cases: expired JWT (refresh once, then send to login), unauthorized access, network loss, GPS unavailable, duplicate attendance, duplicate payroll calculation, duplicate invoice creation.
•	Performance: normal API responses under 3 seconds on seeded data. Review indexes for live monitoring, attendance review and reports.
•	Security: HTTPS, secrets in environment variables, DEBUG off, ALLOWED_HOSTS and CORS set, passwords hashed, no direct database access from clients.
•	Database backup scheduled, and a restore tested once.
•	README written: setup, environment variables, seed command, run commands, cron command for process_attendance. No AI-tool credit line.
Release
•	Deploy backend and web with HTTPS. Build the Android APK. Install it on a real phone and run the full flow.
•	Final compliance sweep (section A2): run check_ui_rules.py, search all text for dashes, emoji and exclamation marks, confirm the template defaults and meta tags, confirm every map shows the OpenStreetMap credit, confirm button radius and reduced motion.
•	Tick every item in the Definition of Done from the PRD.
•	Rehearse the 18-step demo (Part D) at least twice on the real phone.
Tests required
•	Full end-to-end run on a clean database seeded from scratch.
•	Role matrix: every role against every endpoint group, expected allowed or refused.
•	Real phone: login for guard, supervisor and client, check-in, background GPS, panic, check-out, payroll view, invoice view.
UI and content checks for this phase
•	Zero failures from check_ui_rules.py, plus the manual checks above.
Exit criteria
Every Definition of Done item is ticked, the APK works on a real phone, the deployment is live over HTTPS, and the 18-step demo runs without a fix during the run.
Part C: Open Decisions
The PRD leaves these points open. Settle each one before the phase that needs it. The suggested default is a starting point, not a requirement.
ID	Decision	Why it matters	Needed by	Suggested default
D1	Wage basis: daily, hourly, or both per guard	Wage fields are created in Phase 2 and drive the formula	Phase 2	Both, chosen by wage_type on each guard
D2	What counts as a payable day	Decides payroll totals	Phase 10	One approved PRESENT or LATE record is one day. Hourly guards use worked minutes.
D3	Overtime, allowances, deductions setup	PRD says where configured	Phase 10	Small configuration table with sample values labelled Sample
D4	Rounding point	Lines must add up to totals	Phase 10	Round each line to 2 decimals half-up, then sum
D5	Currency and number format	Consistent display	Phase 10	One currency, 2 decimals, set once
D6	Sample tax rate	Must be labelled demo	Phase 11	Setting value labelled Sample tax
D7	Invoice status handling	Partial payment allocation is out of scope	Phase 11	PAID and PARTIALLY_PAID set by Admin. OVERDUE derived from due date
D8	Billing quantity source and duplicate rule	Decides how invoices are built	Phase 11	Admin confirms quantity, prefilled from post guard counts. One draft per client, site, period
D9	Meaning of Supervisor approves where permitted	Approval scope	Phase 9	Supervisor approves only for assigned sites, Admin for all
D10	Approving a record with missing check-out	Payroll needs hours	Phase 9	Approver enters corrected check-out with reason, or rejects
D11	Late boundary	Edge case at start plus 10 minutes	Phase 5	Late only when later than start plus 10 minutes
D12	Check-out outside the geofence	PRD does not say	Phase 5	Accept and flag, do not reject
D13	Repeat check-in response	Retries after lost responses	Phase 5	Return the existing record
D14	Stale threshold for INACTIVE	Live map accuracy	Phase 7	2 minutes without a ping
D15	GPS retention period	Legal text and cleanup job must match	Phase 6	Agency must supply the number. Do not invent one
D16	Incident status values	PRD says update status without listing values	Phase 8	OPEN, UNDER_REVIEW, RESOLVED
D17	Who marks a quick request RESOLVED	Closing the loop	Phase 8	Supervisor or Admin
D18	Note on the Other request	Free-text chat is out of scope	Phase 8	Optional note, short maximum length
D19	What a client sees of guards and incidents	Client must not see internal information	Phase 11	Name and shift times for guards. Title, severity, status and time for incidents. No phone, ID or internal notes
D20	Deactivating a guard with future shifts	Avoids orphan schedules	Phase 3	Block with a message that lists the shifts
D21	Initial password handling	Admin creates accounts	Phase 3	Admin sets a temporary password and the user is told to change it
D22	Mobile login line for Supervisor and Client	Section 17 gives one mobile line written for guards	Phase 2	Keep the single required line for all roles
D23	Mobile map technology	OpenStreetMap tiles and credit are required on every map	Phase 7	Use an OpenStreetMap tile source with a visible credit, or list sites without a map on mobile
D24	Agency time zone	Check-in windows and reports	Phase 2	One time zone setting, stored in UTC

Optional and reducible items
•	Django Channels and WebSockets (polling is the baseline)
•	CSV export
•	Incident photos
•	Advanced reports
•	Advanced client dashboard
•	Supervisor mobile extras such as approving attendance from the phone
These come after the core works and can be cut if needed.
Must-keep core
Authentication and RBAC, guard management, sites and posts, scheduling, geofenced attendance, background GPS, live monitoring, attendance approval, Payroll Lite, client billing and invoicing.
Part D: Demo Scenario Mapped to Phases
Step	Demo action	Delivered in
1	Admin logs in on web	Phase 1
2	Admin creates client, site, post, guard, supervisor	Phase 3
3	Admin creates a guard shift	Phase 4
4	Guard logs in on Android	Phase 1
5	Guard sees today's duty	Phase 4
6	Check-in outside geofence is rejected	Phase 5
7	Guard enters site, check-in accepted	Phase 5
8	Background GPS begins	Phase 6
9	Supervisor sees guard moving on the live map	Phase 7
10	Guard leaves the site, OUTSIDE GEOFENCE shows	Phase 7
11	Guard sends a quick request or incident	Phase 8
12	Guard triggers a panic alert	Phase 8
13	Guard checks out	Phase 5
14	Supervisor approves attendance	Phase 9
15	System calculates payroll	Phase 10
16	Guard views payroll on the phone	Phase 10
17	Admin creates a client invoice	Phase 11
18	Client logs in and views site, attendance, incidents, invoice, billing history	Phase 11

