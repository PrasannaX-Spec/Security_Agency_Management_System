# Security Guard Information Management and Real-Time Monitoring System

A digital platform for a single security agency to manage guard profiles, schedule shifts, verify attendance through GPS geofencing, and monitor on-duty guards live.

## System Architecture

```
Android App (Guard, Supervisor, Client: React Native) ──┐
                                                         ├──> Django REST API (DRF) ──> PostgreSQL / SQLite
Web App (Admin, Supervisor: React) ─────────────────────┘        │
                                                                 └── Polling baseline
```

- Backend: Python 3.10+, Django 5.2, Django REST Framework, PostgreSQL / SQLite, SimpleJWT, drf-spectacular.
- Web Console: React 18, Vite, Tailwind CSS, TanStack Query, React Router, Lucide icons, Leaflet.
- Mobile Application: React Native, Expo SDK 57, React Navigation, Expo Location foreground service.

## Repository Layout

```
.
├── backend/                  # Django project root
│   ├── apps/                 # Modular domain applications
│   │   ├── accounts/         # Custom User model, RBAC, Supervisor profile, JWT endpoints
│   │   ├── attendance/       # Shift attendance check-in and check-out
│   │   ├── clients/          # Client company profiles and 1:1 user links
│   │   ├── guards/           # Guard profiles, wage configuration, soft-delete management
│   │   ├── incidents/        # Incident logging and review
│   │   ├── legal/            # Versioned Terms and Conditions and Privacy Policy
│   │   ├── locations/        # Site locations, geofence radius, and duty posts
│   │   ├── panic/            # Emergency panic alert dispatch
│   │   ├── reports/          # Operational reporting queries
│   │   ├── requests/         # Predefined guard quick requests
│   │   ├── schedules/        # Shift scheduling with overlap check
│   │   └── tracking/         # GPS ping collection and location queries
│   ├── common/               # Shared utilities (geo distance, permissions, pagination)
│   ├── config/               # Django settings, root URLs, and WSGI/ASGI
│   ├── tests/                # Automated pytest suite (30 unit and integration tests)
│   ├── manage.py
│   └── requirements.txt
├── web/                      # React + Vite web application (Admin and Supervisor)
│   ├── src/
│   │   ├── api/              # Axios client and master data API services
│   │   ├── components/       # Layouts, navigation shells, DemoDataBadge, consent modal
│   │   ├── context/          # Authentication and session state
│   │   ├── pages/            # Admin master data CRUD, Supervisor, and legal policy pages
│   │   └── routes/           # Role-based route definitions
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── mobile/                   # React Native mobile application (Guard, Supervisor, Client)
│   ├── src/
│   │   ├── api/              # Axios client with SecureStore integration
│   │   ├── context/          # Mobile auth state and consent flow
│   │   ├── navigation/       # Dynamic multi-role router (Guard, Supervisor, Client)
│   │   ├── screens/          # Login, consent, live profile, duty, and status screens
│   │   ├── services/         # Background GPS task tracking
│   │   └── theme/            # Shared color and design tokens
│   ├── app.json
│   └── package.json
├── scripts/
│   └── check_ui_rules.py     # Static scanner enforcing PRD section 17 UI rules
├── PRD.md                    # Product Requirements Document
├── PROGRESS.md               # Implementation Phase Progress Tracker
├── README.md                 # Project summary and quick start guide
├── SETUP_GUIDE.md            # Detailed setup instructions for developers and agents
└── TECH_STACK.md             # Technical Stack and Architecture Specification
```

## Current Implementation Status

Current status: Phase 3 (Master Data Management) Complete. Ready for Phase 4 (Duty Scheduling).

| Phase | Description | Status | Completion |
| :--- | :--- | :--- | :--- |
| Phase 1 | Foundation & Architecture (Auth, Models, UI Shells, Legal, Tests) | Completed | 100% |
| Phase 2 | Foundation Extension (CLIENT Role, Client/Post/Supervisor Models, Wage Fields, Multi-Role Router) | Completed | 100% |
| Phase 3 | Master Data Management (Guards, Supervisors, Clients, Sites, Posts CRUD & Web UI) | Completed | 100% |
| Phase 4 | Duty Scheduling (Shift Assignments & Overlap Prevention) | Next | 0% |
| Phases 5-12 | Attendance, Tracking, Monitoring, Incidents, Payroll, Invoicing, Release | Planned | 0% |

### Delivered Milestones Summary

1. Backend Architecture:
   - 12 modular Django apps with custom RBAC supporting ADMIN, SUPERVISOR, CLIENT, and GUARD roles.
   - JWT authentication endpoints with automatic refresh, current user profile, and terms acceptance tracking.
   - PostgreSQL / SQLite relational models with soft delete statuses, supervisor-to-site assignments, and duty posts.
   - Master data REST API endpoints with pagination envelope ({success, data, error}), search, status filtering, and atomic user creation.
   - Automated pytest suite passing with 30 unit and integration tests.

2. Web Console (Admin & Supervisor):
   - Full master data CRUD interfaces for Guards, Clients, Site Locations, Duty Posts, and Supervisors.
   - Interactive modals for creation, editing, status toggling, deactivation, and supervisor site assignment.
   - Loading states, error states, and empty states displaying "No data yet".
   - DemoDataBadge indicator for seeded records.
   - Public versioned Terms and Privacy Policy views at /terms and /privacy.

3. Mobile Application (React Native & Expo):
   - Dynamic multi-role router switching interface layout based on user role.
   - Live guard profile view connected to backend auth endpoint.
   - Safe-area compliance, foreground/background GPS permissions, and consent screen flow.

4. Quality and Compliance:
   - scripts/check_ui_rules.py reports 0 failures across 58 scanned project files.
   - Interactive OpenAPI documentation available at /api/docs/.

## Default Seeded Credentials

Run `python manage.py seed_demo` to generate the default testing accounts:

| Role | Username | Password | Accessible Interfaces |
| :--- | :--- | :--- | :--- |
| System Admin | admin | admin123 | Web Admin Console (/admin/*) |
| Field Supervisor | sup_north | sup123 | Web Supervisor Portal (/supervisor/*) & Mobile App |
| Client Account | metro_admin | client123 | Web Console & Mobile Client Portal |
| Security Guard | guard_01 | guard123 | Mobile Guard App |

## Quick Start

For detailed step-by-step setup instructions and agent bootstrapping commands, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

### 1. Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
# Copy environment variables: cp .env.example .env (or configure backend/.env)
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```

- API Base: `http://localhost:8000/api/`
- Swagger Docs: `http://localhost:8000/api/docs/`

### 2. Web Console

```bash
cd web
npm install
npm run dev
```

The web console runs at `http://localhost:5173`.

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start -c
```

Scan the QR code in the terminal with Expo Go or press `a` for Android Emulator.

### 4. Automated Testing and Verification

```bash
# Run backend pytest suite (30 passing tests)
cd backend
pytest

# Verify static compliance and UI rules (0 failures)
cd ..
python scripts/check_ui_rules.py
```
