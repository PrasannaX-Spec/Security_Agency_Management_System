# Web App (Admin and Supervisor)

React + Vite web application for administrators and supervisors.

## Features

- Role-based routing for Admin and Supervisor consoles
- JWT authentication with automatic refresh
- Mandatory first-login consent modal for Terms and Privacy updates
- Public `/terms` and `/privacy` policy views
- Design system complying with strict UI rules (solid colors, system fonts, Lucide icons)

## Prerequisites

- Node.js 18+ (tested with Node 20+)
- npm 9+
- Backend running at `http://localhost:8000`

## Setup

```bash
cd web
npm install
npm run dev
```

The application runs at `http://localhost:5173`.

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `VITE_DEMO_MODE`: Set to `true` to display the "Demo data" indicator in the navigation bar

## Build

```bash
npm run build
```
