# Security Guard Monitoring System — Complete Setup & Agent Bootstrap Guide

This document is a step-by-step setup guide designed for developers and AI Coding Agents pulling this codebase onto a new device or machine.

---

## 1. System Requirements

Before starting setup, ensure the following software is installed on your host system:

| Component | Minimum Version | Verified Version | Check Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.10+ | 3.14.0 / 3.12 | `python --version` |
| **Node.js** | 18.0.0+ | 20.x / 22.x | `node --version` |
| **npm** | 9.0.0+ | 10.x | `npm --version` |
| **Git** | 2.x | 2.x | `git --version` |
| **Database** | SQLite (default) / PostgreSQL 14+ | SQLite / PostgreSQL | Built-in |

---

## 2. Project Architecture Overview

```
Security_Agency_Monitoring_system/
├── backend/          # Django 5.2 REST API Server + PostgreSQL/SQLite + Pytest
├── web/              # React 18 + Vite + Tailwind CSS Web Admin Portal
├── mobile/           # React Native + Expo SDK 57 Mobile Guard App
├── scripts/          # Compliance & UI Rule scanners
├── PRD.md            # Product Requirements Document
├── PROGRESS.md       # Implementation Phase Progress Tracker
├── README.md         # General repository overview
└── SETUP_GUIDE.md    # This setup guide for agents & developers
```

---

## 3. Step-by-Step Setup Instructions

### Step 3.1: Backend Setup (`/backend`)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (`backend/.env`):**
   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   DEBUG=True
   SECRET_KEY=django-insecure-security-agency-monitoring-system-key-2026
   ALLOWED_HOSTS=*
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   # Optional: DATABASE_URL=postgres://postgres:postgres@localhost:5432/security_db
   ```
   *(If `DATABASE_URL` is omitted, Django automatically uses SQLite at `backend/db.sqlite3`.)*

5. **Apply Database Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Seed Initial Demo Data:**
   Runs the automated seeder creating default Users, Profiles, Clients, Guards, Sites, Duty Posts, and Shifts:
   ```bash
   python manage.py seed_demo
   ```

7. **Run the Backend Automated Test Suite:**
   Verify that all backend unit & integration tests pass (30 tests):
   ```bash
   pytest
   ```

8. **Start Backend Server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   - **API Endpoint:** `http://localhost:8000/api/`
   - **Interactive Swagger Docs:** `http://localhost:8000/api/docs/`

---

### Step 3.2: Web Console Setup (`/web`)

1. **Navigate to the web directory:**
   ```bash
   cd web
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`web/.env`):**
   Create a `.env` file in the `web/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start Web Console Development Server:**
   ```bash
   npm run dev
   ```
   - **Web Console Portal:** `http://localhost:5173`

---

### Step 3.3: Mobile App Setup (`/mobile`)

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`mobile/.env`):**
   Create a `.env` file in the `mobile/` directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:8000/api
   ```
   *(Replace `<YOUR_LOCAL_IP>` with your computer's local network IP address e.g. `http://192.168.1.50:8000/api` or `http://10.0.2.2:8000/api` for Android Emulator.)*

4. **Start Expo Development Server:**
   ```bash
   npx expo start -c
   ```
   - Press `a` to open in connected Android Emulator.
   - Press `w` to open in Web Browser.
   - Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## 4. Default Seeded Credentials

When `python manage.py seed_demo` is executed, the following accounts are created for testing and verification:

| Role | Username | Password | Accessible Interfaces / Portals |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Web Admin Console (`/admin/*`) |
| **Field Supervisor** | `sup_north` | `sup123` | Web Supervisor Portal (`/supervisor/*`) & Mobile App |
| **Client Account** | `metro_admin` | `client123` | Web Console & Mobile Client Portal |
| **Security Guard** | `guard_01` | `guard123` | Mobile Guard App |

---

## 5. Automated Verification Checklist for AI Agents

When an AI agent initializes this repository on a new environment, run the following verification pipeline to ensure 100% health before starting work:

```bash
# 1. Run Backend Pytest Suite (All 30 tests MUST pass)
cd backend
pytest

# 2. Verify Static UI Rules & Compliance Scanner (0 Failures)
cd ..
python scripts/check_ui_rules.py

# 3. Verify Server Startup & Health
python backend/manage.py check
```

---

## 6. Troubleshooting Common Issues

1. **`ModuleNotFoundError` in Python:**
   Ensure your virtual environment is activated (`.\venv\Scripts\activate` or `source venv/bin/activate`).
2. **Network Connection Error in Mobile App:**
   Make sure `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` points to your machine's actual local IP address (not `localhost`), and that your phone/emulator is on the same local network.
3. **Port 8000 Already in Use:**
   Kill any existing Django server process or specify a different port e.g. `python manage.py runserver 0.0.0.0:8001`.
