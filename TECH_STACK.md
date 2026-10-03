# Tech Stack (v2.1)

**Changes in v2.1:** icon libraries, legal pages and consent, UI design tokens and the rule checker added (section 10). Everything else is unchanged from v2.

Companion to `PRD.md`. Backend is **Django + DRF (Python)**; web and mobile are **JavaScript (React / React Native)**.

## 1. Summary

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, Django 5, Django REST Framework |
| Database | PostgreSQL 15+ |
| Auth | JWT via `djangorestframework-simplejwt`; RBAC via custom user model + DRF permission classes |
| API docs | `drf-spectacular` (Swagger UI) |
| Real-time (optional) | Django Channels + Daphne (+ Redis for production) |
| Web app | React + Vite |
| Mobile app | React Native (Expo, development build), Android only |
| Maps | Leaflet + OpenStreetMap (attribution always shown) |
| Icons | Lucide (`lucide-react` on web, `lucide-react-native` on mobile), no emoji |
| Legal pages | Text served by the backend (`/api/legal/terms`, `/api/legal/privacy`), shown on web and mobile |
| API style | REST, JSON; polling as baseline for live updates |
| Version control | Git + GitHub (pull requests) |
| API testing | Swagger UI, Postman |

## 2. Backend (Django)

| Purpose | Library |
|---|---|
| Framework | `django`, `djangorestframework` |
| PostgreSQL driver | `psycopg[binary]` |
| JWT auth | `djangorestframework-simplejwt` |
| API docs | `drf-spectacular` |
| CORS | `django-cors-headers` |
| Filtering | `django-filter` |
| Config | `django-environ` |
| Production server | `gunicorn` (REST only) or `daphne` (if Channels is used) |
| Static files | `whitenoise` |
| Real-time (stretch) | `channels`, `daphne`, `channels-redis` |
| Testing | `pytest`, `pytest-django` |

### Suggested structure
```
backend/
  config/            settings, urls, asgi/wsgi
  apps/
    accounts/        custom User (role, availability_status, terms fields), login, accept-terms, permissions
    guards/          Guard, GuardDocument
    locations/       Location, SupervisorAssignment
    schedules/       DutySchedule + overlap validation
    attendance/      Attendance, check-in/out
    tracking/        GuardLocation pings, live endpoint
    incidents/       Incident
    panic/           PanicAlert
    requests/        GuardRequest (quick requests), supervisor availability
    reports/         attendance, schedule, performance queries
    legal/           Terms and Privacy content (content.py), public endpoints
  common/
    geo.py           haversine distance helper
    permissions.py   IsAdmin, IsSupervisor, IsGuard, scoping helpers
    responses.py     { success, data, error } wrapper
  manage.py
  requirements.txt
  .env.example
```

### RBAC in Django
- Custom user model (`AUTH_USER_MODEL`) with `role` choices: `ADMIN`, `SUPERVISOR`, `GUARD`. Set this **before the first migration**; changing it later is painful.
- Permission classes: `IsAdmin`, `IsSupervisor`, `IsGuard`, combined per view (e.g. `[IsAdmin | IsSupervisor]`).
- **Scope data in `get_queryset()`**: Admin gets everything; Supervisor is filtered to assigned locations (via `SupervisorAssignment`); Guard is filtered to their own records. This is where most RBAC bugs happen, so write tests for it.

### Core logic to write carefully
- **Haversine** helper in `common/geo.py`, used by check-in and GPS ping.
- **Legal version check:** `LEGAL_VERSION` constant in `apps/legal/content.py`. Login and `GET /auth/me` return `needs_terms_acceptance` (true when `user.terms_version` differs from `LEGAL_VERSION`). `POST /auth/accept-terms` stores `terms_accepted_at` and `terms_version`.
- **Overlap check** in the schedule serializer: `DutySchedule.objects.filter(guard=g, shift_start__lt=new_end, shift_end__gt=new_start).exclude(status="CANCELLED")`; return HTTP 409.
- **Check-in window and lateness** (15 minutes early, LATE after 10 minutes).
- **Ping handling:** save ping, compute `outside_geofence`.
- Wrap all responses in `{ success, data, error }` through a custom renderer or exception handler.

### Seed and maintenance commands
- `python manage.py seed_demo`: 1 admin, 2 supervisors, 10-20 guards, 4-5 locations (real coordinates near you), a week of shifts, some old attendance and incidents.
- `python manage.py purge_old_pings`: deletes `guard_locations` older than 30 days.
- Django Admin is enabled for quick data inspection and debugging only; the React web app is the real UI.

### Real-time strategy
1. **Baseline:** REST + polling (live map 10 s, requests and panic 5 s). No WebSockets needed.
2. **Optional (F11):** Channels consumer pushes new panic alerts and quick requests to the supervisor dashboard. Use `InMemoryChannelLayer` for local and demo; Redis for anything multi-instance.
3. GPS pings stay as HTTP POSTs, never WebSocket.
4. **Day 10 checkpoint:** if Channels is not working, drop it.

## 3. Database

- PostgreSQL, 11 tables (see PRD section 8), created through Django models and migrations.
- Use `choices` / `TextChoices` for roles and statuses.
- No PostGIS needed; geofencing is done in Python.
- Add the indexes listed in the PRD through `Meta.indexes`.
- Hosting options: Neon, Render Postgres, Railway, or Supabase (Postgres only).

## 4. Web App (Admin and Supervisor)

| Purpose | Library |
|---|---|
| Framework | React + Vite |
| Routing | `react-router-dom` |
| HTTP | `axios` (token interceptor + refresh handling) |
| Server state and polling | `@tanstack/react-query` (`refetchInterval` for live map, panic, requests) |
| Map | `leaflet` + `react-leaflet` |
| Styling | Tailwind CSS |
| Charts | `recharts` |
| Forms | `react-hook-form` |
| Icons | `lucide-react` |
| Dates | `dayjs` |
| Geolocation | Browser Geolocation API (`navigator.geolocation`), **only** for the "Use my current location" button on the location form |

### Suggested structure
```
web/src/
  api/          axios instance + per-feature calls
  components/
  pages/        Login, Consent, Terms, Privacy, Dashboard, Guards, Locations, Schedules,
                LiveMap, Incidents, Panic, Requests, Reports
  routes/       protected route by role; /terms and /privacy are public
  hooks/
```

**Map attribution:** pass the OpenStreetMap credit to the tile layer, for example `attribution="&copy; OpenStreetMap contributors"`. Do not remove or hide it.

## 5. Mobile App (Guard, React Native)

| Purpose | Library |
|---|---|
| Framework | React Native with Expo (**development build**, not Expo Go) |
| Navigation | `@react-navigation/native` + native stack and bottom tabs |
| HTTP | `axios` |
| Secure token storage | `expo-secure-store` |
| GPS (foreground) | `expo-location` |
| GPS (background) | `expo-location` + `expo-task-manager` (Android foreground service) |
| Photos (stretch) | `expo-image-picker` |
| Icons | `lucide-react-native` + `react-native-svg` (install with `npx expo install react-native-svg`) |
| Forms | `react-hook-form` |

### Important setup notes
- The Browser Geolocation API is **not** used here and not suitable for tracking: it stops when the app or page is not in the foreground.
- Background location does **not** work reliably in Expo Go. Build a dev client with `npx expo run:android` or EAS Build.
- Request foreground permission first, then background permission.
- Use a foreground service notification ("Duty tracking active") so Android keeps the task alive.
- Start tracking on check-in, stop on check-out.
- Never request background location or start tracking before the guard has accepted the consent screen.
- Test on a **real phone** in week one. Some brands (Xiaomi, Oppo, Vivo) kill background tasks, so document battery-optimization settings.
- Build the final APK with EAS Build (`preview` profile) or `./gradlew assembleRelease`.
- Quick requests: show the six fixed options as buttons; poll `GET /requests` every 5 seconds while the screen is open. A closed app will not receive replies (no FCM), so state this limitation openly.

### Suggested structure
```
mobile/
  src/
    api/
    screens/      Login, Consent, Terms, Privacy, MyDuties, CheckIn, Incident, Panic, QuickRequests, Profile
    navigation/
    services/     locationTask.js (background GPS task)
    context/      AuthContext
  app.json
```

## 6. Deployment

| Part | Where |
|---|---|
| Backend | Render or Railway (HTTPS included); `gunicorn config.wsgi` for REST only, or `daphne config.asgi:application` if Channels is enabled |
| Database | Neon, Render Postgres, or Railway Postgres |
| Web app | Vercel or Netlify |
| Mobile | APK installed directly on test phones |

Run `collectstatic` and `migrate` on deploy. Use environment variables for secrets. Never commit `.env`.

## 7. Environment Variables

```
# backend/.env.example
DEBUG=True
SECRET_KEY=change_me
DATABASE_URL=postgres://user:password@localhost:5432/guarddb
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
ACCESS_TOKEN_LIFETIME_HOURS=8
# Only if Channels is used in production
REDIS_URL=redis://localhost:6379
```

## 8. Team Conventions

- **Branches:** `main` (stable), `dev` (integration), `feature/<name>`. Open pull requests into `dev`; at least one reviewer.
- **Commits:** short and clear, e.g. `feat: add shift overlap check`.
- **API contract:** Swagger from `drf-spectacular` is the single source of truth, frozen on Day 2. Changes are announced to everyone.
- **Response format:** always `{ success, data, error }`.
- **Naming:** `snake_case` in Python and the database; the API returns `snake_case` JSON, and web and mobile map it as needed (agree once and keep it).
- **Formatting:** `black` + `ruff` for Python; ESLint + Prettier for JavaScript.
- **README:** each of `backend`, `web` and `mobile` explains install, env setup and run commands.
- **Pull request checklist:** every PR into `dev` follows PRD section 17.5 and runs `python3 scripts/check_ui_rules.py` (use `python` on Windows).

## 9. Tools

VS Code, Postman, pgAdmin or DBeaver, Android Studio (emulator and SDK), GitHub Projects or Trello for task tracking.

## 10. UI Rules, Design Tokens and Checks

The rules themselves are in `PRD.md` section 17. This section is how to follow them in code.

### 10.1 Design tokens
Define these once (CSS variables in `web/src/index.css`, a `theme.js` in `mobile/src`) and use only these. Contrast ratios were calculated against WCAG AA (4.5:1 for normal text); all pass.

| Token | Value | Use |
|---|---|---|
| `background` | `#F8FAFC` | Page background |
| `surface` | `#FFFFFF` | Cards, tables, dialogs |
| `border` | `#E2E8F0` | Dividers, input borders |
| `text` | `#0F172A` | Main text (17.1:1 on background) |
| `text-muted` | `#475569` | Secondary text (7.2:1 on background) |
| `accent` | `#1D4ED8` | Primary buttons, links (white text on it 6.7:1) |
| `accent-hover` | `#1E40AF` | Hover and pressed state |
| `success` | `#15803D` | Status only (5.0:1 on white) |
| `warning` | `#B45309` | Status only (5.0:1 on white) |
| `danger` | `#B91C1C` | Errors, panic, outside geofence (6.5:1 on white) |

Other defaults:
- **Shape:** buttons and inputs 6 px radius, cards 8 px. Nothing above 8 px except circular avatars and status dots.
- **Fill:** solid colors only. No gradients, no shadows heavier than a subtle card shadow.
- **Font:** system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) on web, system default on mobile. No external font download.
- **Icons:** Lucide, 20 px, default stroke. No emoji, including in toasts, alerts and empty states.
- **Status is never color alone:** pair the color with text or an icon (for example "Outside geofence" with an icon), so it is readable without color.
- **Motion:** 150 ms ease for dialogs and toasts and a loading spinner, nothing else. Disable it under `prefers-reduced-motion` on web and `AccessibilityInfo.isReduceMotionEnabled` on mobile. No scroll animation libraries (`framer-motion`, `gsap`, `aos`), no `IntersectionObserver` reveals, no custom cursors.
- **Tailwind:** do not use `bg-gradient-*`, `from-*`, `via-*`, `to-*`, or any `purple`, `violet`, `fuchsia`, `indigo` class. Use `rounded-md` for buttons; `rounded-full` only on avatars and status dots.

### 10.2 Copy rules in practice
- Write sentences that say what happens: "Check-in rejected. You are 240 m from the site." not "Oops! Something went wrong."
- Sentence case, no exclamation marks, no em dashes, no filler words.
- Numbers come from API responses. If a list is empty, show "No data yet", never a sample number.
- The login page text is fixed in PRD section 17.1.
- **Demo data label:** when `VITE_DEMO_MODE=true` (web) or `EXPO_PUBLIC_DEMO_MODE=true` (mobile), show a small text label "Demo data" in the header. Set it on every environment that was filled by `seed_demo`.
- **Seed safety:** `seed_demo` refuses to run when `DEBUG=False` unless `--force` is passed, so fake data cannot reach a real database by accident.

### 10.3 Legal content in the backend
```
backend/apps/legal/
  content.py     LEGAL_VERSION = "1.0"
                 TERMS   = { title, version, updated_on, sections: [{ heading, body }] }
                 PRIVACY = { title, version, updated_on, sections: [{ heading, body }] }
  views.py       public (AllowAny) GET /api/legal/terms and /api/legal/privacy
```
- Write the text from the real behavior in the PRD (tracking window, 30-day retention, who sees location, third parties). Content requirements are in PRD section 17.3.
- Change the text only together with a new `LEGAL_VERSION` and `updated_on`, so users are asked to accept again.
- Clients render the `sections` list; they do not copy the text into their own code.

### 10.4 Day 1 template cleanup
- **Web:** set the real `<title>` and favicon in `index.html`; delete the default Vite logo, counter demo and sample text; remove any `<meta name="generator">`.
- **Mobile:** set the real `name`, `slug`, icon and splash screen in `app.json`; delete the default `App` demo screen.
- **Both:** no "Made with" or "Built with" text anywhere, including the README.

### 10.5 Rule checker
```
python3 scripts/check_ui_rules.py            # default folders (web/src, mobile/src, backend/apps/legal, ...)
python3 scripts/check_ui_rules.py web/src    # specific folders
```
- **FAIL** items must be fixed: em or en dashes, emoji and dingbat symbols, gradients and purple-family colors, AI or builder tags, template or placeholder text.
- **REVIEW** items need a human decision: `rounded-full` (fine on an avatar, not on a button), filler marketing words, cursor or scroll animation code.
- Run it before every PR into `dev` and again before submission. It exits with code 1 when anything FAILs, so it can later be added to CI.
- The script cannot judge copy quality, fake metrics or photos. Those are checked by reviewing the screens against PRD section 17.5.
