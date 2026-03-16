# Projectify

Projectify is a project demo and task dashboard with a React frontend, a Spring Boot API, JWT auth, and PostgreSQL.

## Quick Start

Run the full app with Docker:

```bash
docker compose up --build
```

Open:

- `http://localhost` for the app
- `http://localhost:8080/api` for the backend API

Demo accounts:

- Admin: `admin@projectify.com` / `admin123`
- Member: `sarah@projectify.com` / `sarah123`

## How It Runs

`docker-compose.yml` starts three services:

- `db`: PostgreSQL with a persistent Docker volume
- `backend`: Spring Boot API on port `8080`
- `frontend`: production build served by Nginx on port `80`

On the first run, the backend seeds demo users, projects, tasks, reports, and activity. Later restarts reuse the same database volume.

To reset to a fresh seeded database:

```bash
docker compose down -v
docker compose up --build
```

## Local Development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Default frontend env:

```env
VITE_API_URL=http://localhost:8080/api
```

## Docker Dev Mode

For Vite hot reload in Docker:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open:

- `http://localhost:5173` for the frontend dev server
- `http://localhost:8080/api` for the backend API

## Notes

- Default Spring profile: `postgres`
- Default PostgreSQL schema: `projectflow`
- Local PostgreSQL defaults: database `postgres`, user `postgres`, password `postgres`

If you explicitly want the temporary in-memory backend profile instead of PostgreSQL:

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```
