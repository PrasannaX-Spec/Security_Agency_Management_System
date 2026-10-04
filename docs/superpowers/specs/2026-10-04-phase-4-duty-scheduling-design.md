# Phase 4: Duty Scheduling Architectural Design Document

- Target Phase: Phase 4 (Duty Scheduling)
- Date: 2026-10-04
- Status: Approved Design - Pending Implementation Plan
- Document: docs/superpowers/specs/2026-10-04-phase-4-duty-scheduling-design.md

---

## 1. Executive Summary & Objectives

The primary objective of Phase 4 is to deliver a reliable, race-condition-safe duty scheduling system that assigns security guards to specific duty posts at client site locations and guarantees that overlapping shifts for the same guard are rejected.

### Key Goals:
1. Extend the `DutySchedule` data model with direct foreign keys to `Client` and `Post`.
2. Centralize all shift scheduling operations in a transactional `ScheduleService`.
3. Enforce strict temporal overlap prevention (`shift_start < new_end AND shift_end > new_start`) using row-level locking (`select_for_update()`) on PostgreSQL as the production source of truth.
4. Expose clean REST endpoints with server-side role scoping (Admin, Supervisor, Client, Guard) and a structured HTTP 409 Conflict error contract.
5. Provide an interactive Web Console scheduler with a hybrid table and daily agenda view, cascading selectors, and inline collision notifications.
6. Provide a live mobile duty feed on `MyDutiesScreen` with active shift detection (`shift_start <= now < shift_end`), pull-to-refresh, and empty state handling.
7. Update the 105 seeded demo shifts and establish an automated test suite across unit, relationship, permission, advisory capacity, and PostgreSQL concurrency cases.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Client Applications                  │
│   Web Console (React/Vite)      Mobile App (Expo Go)   │
└───────────────┬──────────────────────────┬─────────────┘
                │                          │
                ▼                          ▼
┌────────────────────────────────────────────────────────┐
│                   Django REST API                      │
│        /api/schedules/            /api/schedules/my/   │
│  (Admin / Supervisor / Client)         (Guard)         │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                   ScheduleService                      │
│  - Relational consistency check (Post ∈ Site ∈ Client) │
│  - Active guard check (status == ACTIVE)               │
│  - Post capacity advisory check                        │
│  - transaction.atomic() + Guard.select_for_update()    │
│  - Overlap query: start < new_end AND end > new_start  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                 Database Layer                         │
│   PostgreSQL (Production source of truth for row lock) │
│   SQLite (Supported for local development / unit test) │
└────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Database Schema Migration

### 3.1 Model Updates (`backend/apps/schedules/models.py`)

The `DutySchedule` model will be updated with direct relationships to `clients.Client` and `locations.Post`:

```python
class DutySchedule(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    guard = models.ForeignKey(
        "guards.Guard",
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.CASCADE,
        related_name="schedules",
        verbose_name="Site Location",
    )
    post = models.ForeignKey(
        "locations.Post",
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    shift_start = models.DateTimeField()
    shift_end = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_schedules",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.2 Database Indexes
* `models.Index(fields=["guard", "shift_start", "shift_end"], name="duty_sched_guard_time_idx")`
* `models.Index(fields=["location", "shift_start"], name="duty_sched_loc_time_idx")`
* `models.Index(fields=["client", "shift_start"], name="duty_sched_cli_time_idx")`
* `models.Index(fields=["status", "shift_start"], name="duty_sched_status_time_idx")`

---

## 4. Service Layer & Concurrency Architecture

### 4.1 `ScheduleService` Core Rules (`backend/apps/schedules/services.py`)

All shift creations, modifications, and cancellations must execute strictly through `ScheduleService`. Direct model `.create()` or `.save()` calls in views or serializers are forbidden.

#### Workflow:
1. **Datetime Integrity**:
   * Assert `shift_end > shift_start`. Inverted or equal datetimes raise `ValidationError`.
2. **Active Guard Verification**:
   * Assert `guard.status == "ACTIVE"`. Inactive guards cannot be assigned to shifts.
3. **Hierarchical Consistency**:
   * Assert `post.location_id == location.id`.
   * Assert `location.client_id == client.id`.
4. **Advisory Post Capacity Counting**:
   * Count active `SCHEDULED` shifts on the same post that overlap the requested interval (`shift_start < new_end AND shift_end > new_start`), excluding the current schedule if updating.
   * If `active_post_shifts >= post.required_guard_count`:
     * Generate an advisory warning string: `Post required guard count (N) is reached or exceeded (M currently assigned).`
     * This warning is returned in the successful response payload without blocking creation (HTTP 201).
5. **Transactional Lock & Overlap Check**:
   * Execute inside `with transaction.atomic():`.
   * Acquire a row lock on the target guard: `Guard.objects.select_for_update().get(pk=guard.pk)`.
   * Check for conflicting shifts:
     ```python
     conflict = DutySchedule.objects.filter(
         guard=guard,
         status=DutySchedule.Status.SCHEDULED,
         shift_start__lt=new_end,
         shift_end__gt=new_start,
     ).exclude(pk=current_schedule_id).select_related("location", "post").first()
     ```
   * If `conflict` exists:
     * Raise `ScheduleConflictError(conflicting_schedule=conflict, message=...)`.
6. **Persistence**:
   * Create or update the `DutySchedule` record and return `(schedule_instance, advisory_warning)`.

### 4.2 Concurrency Source of Truth: PostgreSQL vs SQLite

* **Production and Concurrency Source of Truth**: **PostgreSQL**.
  `select_for_update()` issues a row-level `FOR UPDATE` lock on the target row in the `guards` table, ensuring concurrent requests for the same guard are serialized at the database engine level.
* **Development and Unit Testing Environment**: **SQLite**.
  SQLite handles database locking at the database/file level; row-level `select_for_update()` is a no-op in SQLite. SQLite is supported for fast local testing and unit validation, but true multi-worker race-condition verification is performed against PostgreSQL.

---

## 5. API Endpoints, Role Scoping & Error Contract

All responses use the standard `{ success, data, error }` envelope.

### 5.1 Endpoints

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/schedules/` | Admin, Supervisor, Client | List duty schedules with server-side role scoping. |
| `POST` | `/api/schedules/` | Admin, Supervisor | Create a new duty schedule via `ScheduleService`. |
| `GET` | `/api/schedules/{id}/` | Admin, Supervisor, Client | Retrieve shift details within permitted scope. |
| `PUT / PATCH` | `/api/schedules/{id}/` | Admin, Supervisor | Update a duty schedule via `ScheduleService`. |
| `POST` | `/api/schedules/{id}/cancel/` | Admin, Supervisor | Soft-cancel a schedule (`status=CANCELLED`). |
| `GET` | `/api/schedules/my/` | Guard | List authenticated guard's current and upcoming shifts. |

### 5.2 Server-Side Role Scoping (Tamper-Resistant)

For `GET /api/schedules/`:
1. `ADMIN`: Full agency access. Query filters (`client_id`, `location_id`, `guard_id`, `date`, `status`) filter across all records.
2. `SUPERVISOR`: Base queryset is restricted strictly to assigned locations (`location_id__in=get_supervisor_location_ids(request.user)`). Any client-supplied `location_id` or `client_id` parameter is intersected with permitted locations; querying unassigned locations yields an empty list and never leaks records.
3. `CLIENT`: Base queryset is restricted strictly to the authenticated client's sites (`location__client=request.user.client_profile`). Any query parameters are filtered within this client scope only.
4. `GUARD`: Forbidden on `/api/schedules/` (HTTP 403). Guards must access `/api/schedules/my/`.

For `GET /api/schedules/my/`:
* Restricted strictly to `guard__user=request.user`.
* Filtered to `status="SCHEDULED"` and `shift_end >= now`.
* Ordered chronologically (`shift_start ASC`).

### 5.3 Error Contract: HTTP 409 Conflict

When a shift overlap is detected:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "Guard is already scheduled from 2026-10-06 08:00 to 20:00 at Metro Central Hub (North Gate Post).",
    "conflicting_schedule": {
      "id": 85,
      "shift_start": "2026-10-06T08:00:00Z",
      "shift_end": "2026-10-06T20:00:00Z",
      "location_name": "Metro Central Hub",
      "post_name": "North Gate Post"
    }
  }
}
```

---

## 6. Web Console & Mobile UI Integration

### 6.1 Web Console (`web/src/pages/SchedulesPage.jsx` & `web/src/api/schedules.js`)

1. **Header & View Switcher**:
   * Title and subtitle with no exclamation marks or banned words.
   * Date navigation bar: Previous Day, Today, Next Day, and specific Date Picker.
   * View toggle button group: Table View (default) vs Daily Timeline View.
2. **Table View (Default)**:
   * Columns: Shift Window, Guard Name & ID, Client, Site Location, Duty Post, Status Badge (`SCHEDULED`, `CANCELLED`), Actions (Edit, Cancel).
   * Filter controls: Client filter, Location filter, Post filter, Guard filter, Status filter.
   * Empty state: Displays "No data yet".
3. **Daily Timeline / Agenda View**:
   * Renders rows grouped by Post or Guard across time blocks for the selected day.
   * Visual indicators for scheduled coverage and post capacity warnings.
4. **New Shift Modal**:
   * Cascading selection flow:
     - Select Client $\rightarrow$ populates Locations.
     - Select Location $\rightarrow$ populates Posts.
     - Select Post $\rightarrow$ displays live post capacity badge (`Required: N, Assigned: M`).
     - Select Active Guard $\rightarrow$ displays Guard ID and wage type.
     - Select Shift Start & Shift End datetimes.
   * Conflict Handling:
     - On HTTP 409, keeps form inputs intact and renders an inline alert displaying the clashing shift details.
   * Advisory Warning:
     - If HTTP 201 returns with `data.warning`, displays a non-blocking advisory notification.
5. **Cancel Shift Modal**:
   * Confirmation dialog with 150ms fade animation and 4-8px rounded corners.

### 6.2 Mobile Application (`mobile/src/screens/MyDutiesScreen.js`)

1. **Live API Integration**:
   * Connects to `/api/schedules/my/` using Axios with token auth.
2. **Current Shift Detection**:
   * Evaluated as: `shift_start <= now < shift_end`.
   * Highlighted card at top of screen with solid border, site name, post name, shift hours, and status.
3. **Upcoming Shifts Feed**:
   * Chronological list of future shifts (`now < shift_start`).
   * Displays date, start time, end time, location name, and post name.
4. **State Handling & Refresh**:
   * Loading spinner during fetch.
   * Error state with a "Try Again" retry button.
   * Empty state card displaying "No duties assigned".
   * Pull-to-refresh via native `RefreshControl`.
5. **Compliance**:
   * Solid design tokens, Lucide icons only, zero emoji, no em dashes.

---

## 7. Seed Data Updates & Automated Test Plan

### 7.1 Seed Data (`seed_demo.py`)
* Update shift creation to assign both `client` (from `location.client`) and `post` (distributed across posts of each location).
* Ensure all 105 seeded shifts pass the overlap check with 0 conflicts.
* Run automated validation assertion at completion of seeder.

### 7.2 Automated Test Suites (`backend/apps/schedules/tests/`)

1. **Suite 1: Overlap Matrix (Unit/Service Tests)**:
   * Identical interval $\rightarrow$ 409.
   * New starts inside existing $\rightarrow$ 409.
   * New ends inside existing $\rightarrow$ 409.
   * New encompasses existing $\rightarrow$ 409.
   * Existing encompasses new $\rightarrow$ 409.
   * Back-to-back shift (`shift_start == existing_end`) $\rightarrow$ 201 (Allowed).
   * Different guard at same post/time $\rightarrow$ 201 (Allowed).
   * Overlap with `CANCELLED` shift $\rightarrow$ 201 (Allowed).
   * Updating a shift without time change (self-exclusion) $\rightarrow$ 200 (Allowed).
2. **Suite 2: Relational & Context Validations**:
   * `shift_end <= shift_start` $\rightarrow$ 400.
   * Assigning inactive guard $\rightarrow$ 400.
   * Post not in Location $\rightarrow$ 400.
   * Location not in Client $\rightarrow$ 400.
3. **Suite 3: Role Scoping & Tamper Resistance**:
   * Guard on `/api/schedules/` $\rightarrow$ 403.
   * Guard on `/api/schedules/my/` $\rightarrow$ 200 (only own shifts).
   * Supervisor on `/api/schedules/` $\rightarrow$ only assigned sites; querying unassigned site returns empty list.
   * Client on `/api/schedules/` $\rightarrow$ only own client sites.
4. **Suite 4: Advisory Capacity Warnings**:
   * Overlapping shifts on post meeting/exceeding `required_guard_count` $\rightarrow$ returns 201 with warning string.
5. **Suite 5: PostgreSQL Concurrency Verification**:
   * Multi-threaded execution using `concurrent.futures.ThreadPoolExecutor` against PostgreSQL.
   * Two simultaneous requests attempting to book the same guard for overlapping times.
   * Exactly 1 request succeeds with 201; the competing request is rejected with 409.
   * Environment check flags SQLite limitations when run under SQLite.

---

## 8. Compliance & UI Rules Verification

* `scripts/check_ui_rules.py` must report 0 failures after all Web and Mobile changes.
* No emoji icons, no em dashes, no exclamation marks in user-facing strings.
* Solid color tokens, 4-8px button radii, and OpenStreetMap attribution maintained.
