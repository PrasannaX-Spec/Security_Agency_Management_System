# Security Guard Information Management and Real-Time Monitoring System

A digital platform for a single security agency to manage guard profiles, schedule shifts, verify attendance through GPS geofencing, and monitor on-duty guards live.

## System Architecture

```
Android App (Guard: React Native) ──┐
                                     ├──> Django REST API (DRF) ──> PostgreSQL
Web App (Admin / Supervisor: React) ─┘        │
                                              └── Polling baseline / Channels stretch
```

- **Backend:** Python 3.11+, Django 5, Django REST Framework, PostgreSQL, SimpleJWT, drf-spectacular.
- **Web Console:** React 18, Vite, Tailwind CSS, TanStack Query, React Router, Lucide icons, Leaflet.
- **Mobile Application:** React Native, Expo, React Navigation, Expo Location foreground service.

## Repository Layout

```
.
├── backend/                  # Django project root
│   ├── apps/                 # Modular domain applications
│   │   ├── accounts/         # Custom User model, RBAC, JWT auth endpoints
│   │   ├── attendance/       # Shift attendance check-in and check-out
│   │   ├── guards/           # Guard profiles and soft-delete management
│   │   ├── incidents/        # Incident logging and review
│   │   ├── legal/            # Versioned Terms and Conditions and Privacy Policy
│   │   ├── locations/        # Site locations and geofence configuration
│   │   ├── panic/            # Emergency panic alert dispatch
│   │   ├── reports/          # Operational reporting queries
│   │   ├── requests/         # Predefined guard quick requests
│   │   ├── schedules/        # Shift scheduling with overlap check
│   │   └── tracking/         # GPS ping collection and location queries
│   ├── common/               # Shared utilities (geo distance, permissions, rendering)
│   ├── config/               # Django settings, root URLs, and ASGI/WSGI
│   ├── tests/                # Automated pytest suite
│   ├── manage.py
│   └── requirements.txt
├── web/                      # React + Vite web application (Admin and Supervisor)
│   ├── src/
│   │   ├── api/              # Axios client and API services
│   │   ├── components/       # Layouts, navigation shells, and consent modal
│   │   ├── context/          # Authentication and session state
│   │   ├── pages/            # Admin, Supervisor, and legal policy pages
│   │   └── routes/           # Role-based route definitions
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── mobile/                   # React Native mobile application (Guard)
│   ├── src/
│   │   ├── api/              # Axios client with SecureStore integration
│   │   ├── context/          # Mobile auth state and consent flow
│   │   ├── navigation/       # Stack and tab navigators
│   │   ├── screens/          # Guard login, consent, duty, and status screens
│   │   ├── services/         # Background GPS task tracking
│   │   └── theme/            # Shared color and design tokens
│   ├── app.json
│   └── package.json
├── scripts/
│   └── check_ui_rules.py     # Static scanner enforcing PRD section 17 UI rules
├── PRD.md                    # Product Requirements Document
└── TECH_STACK.md             # Technical Stack and Architecture Specification
```

## Checkpoint 1 Status (Phase 1: Foundation)

- [x] Django 5 project initialized with 11 modular apps.
- [x] Custom User model supporting roles (`ADMIN`, `SUPERVISOR`, `GUARD`) with terms acceptance timestamps.
- [x] Full PostgreSQL data models with relationships, indexes, and soft-delete statuses.
- [x] JWT authentication endpoints (`/api/auth/login/`, `/api/auth/refresh/`, `/api/auth/me/`, `/api/auth/accept-terms/`).
- [x] Public legal policy endpoints (`/api/legal/terms/`, `/api/legal/privacy/`).
- [x] Interactive OpenAPI / Swagger documentation at `/api/docs/`.
- [x] Seed command (`python manage.py seed_demo`) creating 1 Admin, 2 Supervisors, 15 Guards, 5 Locations, and 105 non-overlapping shifts.
- [x] Automated test suite passing with 18 unit and integration tests (`pytest`).
- [x] Web console initialized with Tailwind design tokens, role routing, login, consent modal, and legal views.
- [x] Mobile guard app initialized with Expo, navigation stack, login, consent screen, and background location configuration.
- [x] Static rule checker (`scripts/check_ui_rules.py`) passing with zero failures.

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
# Configure PostgreSQL DATABASE_URL in backend/.env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Swagger API documentation is available at `http://localhost:8000/api/docs/`.

### 2. Web

```bash
cd web
npm install
npm run dev
```

The web console runs at `http://localhost:5173`.

### 3. Mobile

```bash
cd mobile
npm install
npm run start
```

### 4. UI Rules Check

```bash
python scripts/check_ui_rules.py
```
