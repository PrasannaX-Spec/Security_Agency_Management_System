# Security Guard Monitoring System - Implementation Progress

> **Last Updated:** October 4, 2026  
> **Current Status:** Phase 4 (Duty Scheduling) Complete · Ready for Phase 5

---

## Executive Summary

| Phase | Description | Status | Completion |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Architecture** (Auth, Models, UI Shells, Legal, Tests) | **COMPLETED** | **100%** |
| **Phase 2** | **Foundation Extension (Gap Closing)** (CLIENT Role, Client/Post/Supervisor Models, Dynamic Mobile Role Router, Wage Fields, Shell Pages) | **COMPLETED** | **100%** |
| **Phase 3** | **Master Data Management** (Guards, Supervisors, Clients, Sites, Posts CRUD & Web UI) | **COMPLETED** | **100%** |
| **Phase 4** | **Duty Scheduling** (Shift Assignments, Row Locking, Overlap Prevention, Timeline & Mobile Feeds) | **COMPLETED** | **100%** |
| **Phase 5** | **Attendance & Geofencing** (GPS Check-In / Out, Haversine Verification) | *Next* | 0% |

---

## Phase 1: Foundation Breakdown (100% Completed)

### 1. Backend (Django REST Framework & PostgreSQL)
- [x] **11 Modular Django Apps:**
  - `accounts`, `guards`, `locations`, `schedules`, `attendance`, `tracking`, `incidents`, `panic`, `requests`, `reports`, `legal`
- [x] **Custom User Model & RBAC:** `ADMIN`, `SUPERVISOR`, `GUARD` roles with Terms & Privacy acceptance tracking.
- [x] **Database Schema & Migrations:** Full PostgreSQL relational models with indexes and soft-delete statuses.
- [x] **Authentication Endpoints:**
  - `POST /api/auth/login/` (JWT pair generation)
  - `POST /api/auth/refresh/` (Token refresh)
  - `GET /api/auth/me/` (Current user info & role)
  - `POST /api/auth/accept-terms/` (Terms acceptance timestamping)
- [x] **Legal Policy Endpoints:**
  - `GET /api/legal/terms/` (Public versioned terms)
  - `GET /api/legal/privacy/` (Public versioned privacy policy)
- [x] **API Documentation:** OpenAPI 3.0 schema and interactive Swagger UI at `/api/docs/`.
- [x] **Demo Data Seeder:** `python manage.py seed_demo` generating 1 Admin, 2 Supervisors, 15 Guards, 5 Sites, and 105 non-overlapping shifts.
- [x] **Backend Automated Tests:** 19 unit & integration tests passing (`100%` pass rate).

---

## Phase 2: Foundation Extension Breakdown (100% Completed)

### 1. Backend Extensions & Data Models
- [x] **CLIENT Role Integration:** Added `CLIENT = "CLIENT", "Client"` to `User.Role` TextChoices with database migrations (`accounts.0002`).
- [x] **New `clients` App:** Created `Client` model linked 1:1 with client user (`company_name`, `contact_person`, `phone`, `email`, `address`, `status`, `created_at`, `updated_at`).
- [x] **Supervisor Profiles:** Added `SupervisorProfile` model in `accounts` linked 1:1 with supervisor user (`phone`, `status`, `availability`).
- [x] **Location & Post Models:** Linked `client` ForeignKey on `Location` model. Created `Post` model in `locations` (`name`, `location`, `required_guard_count`, `status`).
- [x] **Guard Wage Fields:** Added `wage_type` (`HOURLY`, `MONTHLY`) and `wage_rate` (DecimalField) to `Guard` model.
- [x] **Scoped RBAC & Scoping Helpers:** Created `IsClient`, `IsAdminOrSupervisor`, `get_supervisor_location_ids()`, and `get_client_location_ids()`.

---

## Phase 3: Master Data Management Breakdown (100% Completed)

### 1. Backend API & Validation Rules
- [x] **Standard Envelope Integration:** Created `common.pagination.StandardResultsSetPagination` to wrap paginated responses in `{ success, data, error }`.
- [x] **Guard Management API (`/api/guards/`):** Full list (search, status filter, pagination), atomic creation with user account, update, and deactivation (`/deactivate/`).
- [x] **Client Management API (`/api/clients/`):** Full list, create, update, and status toggle (`/status/`).
- [x] **Site Location API (`/api/sites/`):** Full list, create, update with coordinate range validation (-90..90, -180..180) and geofence radius > 0.
- [x] **Duty Post API (`/api/posts/`):** Full list, create, update with required guards >= 1 validation.
- [x] **Field Supervisor API (`/api/supervisors/`):** Full list, create, update, and site assignment endpoint (`/assign-sites/`).
- [x] **Automated Test Coverage:** 30 comprehensive backend unit & integration tests passing cleanly (`100%` pass rate).

### 2. Web Console Admin Interfaces
- [x] **Master Data Helper:** Created `web/src/api/masterData.js` wrapping all CRUD backend API endpoints with Axios Bearer auth.
- [x] **Interactive Guard Management (`GuardsPage.jsx`):** Search, status filter, pagination, Add Guard modal, Edit Guard modal, Deactivate modal, and "No data yet" empty state.
- [x] **Interactive Client Management (`ClientsPage.jsx`):** Search, status filter, Add Client modal, Edit Client modal, status toggle, and "No data yet" empty state.
- [x] **Interactive Site Location Management (`LocationsPage.jsx`):** Search, status filter, Add Location modal with Client dropdown, Edit Location modal, coordinate validation, and "No data yet" empty state.
- [x] **Interactive Duty Post Management (`PostsPage.jsx`):** Search, status filter, Add Duty Post modal with Location dropdown, Edit Duty Post modal, required guards validation, and "No data yet" empty state.
- [x] **Interactive Field Supervisor Management (`SupervisorsPage.jsx`):** Search, Add Supervisor modal, Edit Supervisor modal, interactive Site Assignment modal, and "No data yet" empty state.
- [x] **Navigation & Routes:** Added `Supervisors` tab in `AdminLayout.jsx` sidebar and registered `/admin/supervisors` route in `AppRoutes.jsx`.

### 3. Mobile Guard App Updates
- [x] **Live Profile Fetching:** Updated `ProfileScreen.js` to fetch live user profile data from `/api/auth/me/` on component mount with loading indicators and role badge display.

### 4. Quality & Compliance
- [x] **UI Rule Checker (`scripts/check_ui_rules.py`):** **0 Failures** over 58 scanned project files.
- [x] **Backend Test Suite (`pytest`):** 30 passed, 0 failed.

---

## Phase 4: Duty Scheduling Breakdown (100% Completed)

### 1. Data Model & PostgreSQL Row Locking
- [x] **Schema Enhancements:** Extended `DutySchedule` with `client`, `post`, `status` (`SCHEDULED`, `COMPLETED`, `CANCELLED`), and compound indexes (`guard + shift_start`, `location + shift_start`, `status + shift_start`). Migration applied to PostgreSQL.
- [x] **Transactional Service (`ScheduleService`):** Implemented row-level locking via `select_for_update()` on target Guard within `transaction.atomic()`.
- [x] **Overlap Prevention Formula:** Strict validation enforcing `shift_start < new_end AND shift_end > new_start` across active `SCHEDULED` shifts of the same guard.
- [x] **HTTP 409 Conflict Response:** Returns structured conflict details (conflicting schedule ID, location, post, and shift bounds) with code `SCHEDULE_CONFLICT`.
- [x] **Advisory Capacity Warnings:** Post-commit capacity calculation comparing active scheduled guards against `Post.required_guard_count` returning non-blocking advisory warnings.
- [x] **PostgreSQL Concurrency Test:** Multi-threaded concurrency integration test (`test_schedules_concurrency.py`) verifying exactly 1 success and 1 `ScheduleConflictError` under race conditions on PostgreSQL.

### 2. REST API & Server-Side Role Scoping
- [x] **List & Create (`/api/schedules/`):** Full list and creation endpoint with server-side role scoping (Supervisors scoped to assigned sites, Clients scoped to owned sites, Guards forbidden).
- [x] **Detail & Update (`/api/schedules/<id>/`):** Detail retrieval and partial update with supervisor boundary validation and Client write restriction.
- [x] **Cancel Endpoint (`/api/schedules/<id>/cancel/`):** Dedicated atomic shift cancellation for Admins and Supervisors.
- [x] **Mobile Guard Feed (`/api/schedules/my/`):** Guard-specific endpoint returning active and future scheduled duties sorted chronologically.

### 3. Web Console Scheduler (`SchedulesPage.jsx`)
- [x] **API Client (`web/src/api/schedules.js`):** Axios client covering all schedule CRUD operations.
- [x] **Hybrid Views:** Table view with sortable columns, duration computation, status badges, and action triggers; 24-hour horizontal bar Timeline view grouped by Site and Post.
- [x] **Cascading Modal:** 5-step modal (Client -> Location -> Post -> Guard -> Shift Times) with post capacity guidance and guard status hints.
- [x] **Inline Conflict & Advisory Alerts:** Red conflict banner detailing overlapping shifts; amber advisory toast for over-capacity shifts.
- [x] **Shift Cancellation Dialog:** Confirmation modal triggering atomic schedule cancellation.

### 4. Mobile Guard Application (`MyDutiesScreen.js`)
- [x] **API Client (`mobile/src/api/schedules.js`):** `getMyDuties()` client calling `/api/schedules/my/`.
- [x] **Active Shift Detection:** Precision detection (`shift_start <= now < shift_end`) highlighting current shift in dedicated card with time remaining counter.
- [x] **Upcoming Schedule Feed:** Chronologically ordered upcoming shift cards with date badges, site/post details, and client indicators.
- [x] **Empty State & Controls:** Pull-to-refresh (`RefreshControl`), error banner with retry trigger, and clear empty state.

### 5. Quality & Verification
- [x] **Backend Automated Tests:** 38 passed, 0 failed across full test suite (`100%` pass rate).
- [x] **UI Rule Checker (`scripts/check_ui_rules.py`):** **0 Failures** over 60 scanned project files.
- [x] **Database Seed Integrity:** Seed demo seeder verified: 105 shifts across 15 guards and 5 locations with valid Client -> Location -> Post -> Guard relationships and 0 conflicts.

---

## Next Steps: Phase 5 Roadmap

1. **Geofenced Check-In & Check-Out (Backend + Mobile):**
   - Haversine distance computation against location coordinates and radius.
   - Guard shift check-in and check-out validation with timestamps.
   - Creation and tracking of Attendance records linked to DutySchedule.
2. **Attendance Management (Web Console):**
   - Admin and supervisor attendance log viewer with status indicators (On Duty, Completed, Late, Absent).
3. **Automated Concurrency & Geofence Tests:**
   - GPS boundary edge cases and check-in audit trails.

---

## Quick Reference - Running Services

| Service | Command | URL / Port |
| :--- | :--- | :--- |
| **Backend API** | `python manage.py runserver 0.0.0.0:8000` | `http://localhost:8000` |
| **Swagger Docs** | *Integrated in Backend* | `http://localhost:8000/api/docs/` |
| **Web Console** | `npm run dev` (in `/web`) | `http://localhost:5173` |
| **Mobile App** | `npx expo start -c` (in `/mobile`) | Expo Go (SDK 57) |
