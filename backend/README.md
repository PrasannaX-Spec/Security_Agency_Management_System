# Security Guard Monitoring System - Backend

Django 5 + Django REST Framework + PostgreSQL backend.

## Prerequisites

- Python 3.11+
- PostgreSQL 15+

## PostgreSQL Setup

1. Open a PostgreSQL shell (psql) or pgAdmin.
2. Create the database and user:

```sql
CREATE DATABASE guarddb;
CREATE USER guarduser WITH PASSWORD 'guardpass';
ALTER ROLE guarduser SET client_encoding TO 'utf8';
ALTER ROLE guarduser SET default_transaction_isolation TO 'read committed';
ALTER ROLE guarduser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE guarddb TO guarduser;
```

Or, if using the default `postgres` superuser for local development, just create the database:

```sql
CREATE DATABASE guarddb;
```

## Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# Edit .env: set DATABASE_URL to match your PostgreSQL credentials
# Example: DATABASE_URL=postgres://postgres:postgres@localhost:5432/guarddb

# Run migrations
python manage.py migrate

# Seed demo data (development only)
python manage.py seed_demo

# Start the development server
python manage.py runserver
```

## API Documentation

Once the server is running, open Swagger UI at:
http://localhost:8000/api/docs/

## Demo Credentials (after seed_demo)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Supervisor | supervisor1 | super123 |
| Supervisor | supervisor2 | super123 |
| Guard | guard01 - guard15 | guard123 |

## Running Tests

```bash
pytest
```

## Key Endpoints (Phase 1)

- `POST /api/auth/login` - authenticate, returns JWT tokens
- `POST /api/auth/refresh` - refresh access token
- `GET /api/auth/me` - current user info
- `POST /api/auth/accept-terms` - accept current terms version
- `GET /api/legal/terms` - terms and conditions (public)
- `GET /api/legal/privacy` - privacy policy (public)
- `GET /api/docs/` - Swagger UI
