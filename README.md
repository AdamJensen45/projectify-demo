# ProjectFlow

ProjectFlow is a project dashboard application with:

- a React + TypeScript + Vite frontend
- a Spring Boot backend
- JWT-based authentication
- PostgreSQL as the default database

## Current setup

The backend now runs against PostgreSQL by default.

- Default backend port: `8080`
- Default frontend API URL: `http://localhost:8080/api`
- Default Spring profile: `postgres`

The repository is configured so a fresh PostgreSQL-backed app will seed demo data once when the database is empty. After that, the data persists across backend restarts.

That means a reviewer can clone the repository, start the app, and immediately see users, projects, tasks, reports, and activity without manually creating everything.

## Docker quick start

This repository is set up to run as a full Docker stack:

- `frontend`: production-style Vite build served by Nginx
- `backend`: Spring Boot application
- `db`: PostgreSQL with a persistent Docker volume

### Recommended startup

From the repository root:

```bash
docker compose up --build
```

Then open:

- frontend: `http://localhost`
- backend API: `http://localhost:8080/api`

### Docker dev mode with hot reload

For day-to-day development, use the separate dev stack instead of the production-style one:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Then open:

- frontend dev server: `http://localhost:5173`
- backend API: `http://localhost:8080/api`

This dev stack is configured for:

- frontend hot reload through the Vite dev server
- backend source-mounted development with `mvn spring-boot:run`
- persistent PostgreSQL data in a separate dev volume

When switching between the production stack and the dev stack, stop the other one first so ports do not clash:

```bash
docker compose down
docker compose -f docker-compose.dev.yml down
```

### Seeded demo data

The PostgreSQL container uses a named volume, so demo data is inserted on first startup and then kept across container restarts.

- First run: the application seeds users, projects, tasks, reports, and activities
- Later runs: the seeded data and any changes remain available

If you intentionally want a completely fresh database, remove the volume:

```bash
docker compose down -v
```

## Database

By default, the backend uses:

- database: `postgres`
- schema: `projectflow`
- username: `postgres`
- password: `postgres`

These are only defaults. You can override them with environment variables:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_PROFILES_ACTIVE`

The PostgreSQL profile uses a dedicated schema and creates it automatically if it does not already exist.

## Seed data behavior

Demo data is seeded only when the persistent database is empty.

- First run on a fresh PostgreSQL instance: seed data is inserted
- Later restarts: existing data is kept

## Running locally

### 1. Start PostgreSQL

Make sure PostgreSQL is running locally and that one of these is true:

1. You have a local `postgres` database with user `postgres` and password `postgres`
2. You provide your own connection details through environment variables

### 2. Start the backend

From `backend/`:

```bash
mvn spring-boot:run
```

### 3. Start the frontend

From the repository root:

```bash
npm install
npm run dev
```

The frontend reads its API base URL from `.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

If you want Docker and hot reload together, use the dev compose file above instead of `npm run dev` directly.

## Optional dev fallback

If you explicitly want the old in-memory H2 setup for temporary development, run the backend with:

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

In that profile the database is transient and will reset on restart.
