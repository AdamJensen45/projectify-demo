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

For showcase purposes, on the first run, the backend seeds demo users, projects, tasks, reports, and activity. Later restarts reuse the same database volume.

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
## Architecture

The app is a pretty standard React + Spring Boot setup. The frontend talks to the backend over REST, and the backend talks to PostgreSQL. Auth is JWT-based, so there’s no server-side session store.

**Backend:** Controllers handle HTTP, services contain the business logic and access rules, and JPA repositories talk to the database. Most access checks (who can see which projects and tasks) live in the services, not the controllers. Errors are centralized in a `GlobalExceptionHandler` that converts exceptions into proper HTTP status codes and JSON bodies.

**Frontend:** Pages load data, hold state, and wire up dialogs and tables. Reusable UI components sit in `components/`, and a few shared hooks (`useTaskCollection`, `useTaskFormLookups`, etc.) handle common data-fetching patterns so we don’t repeat the same logic everywhere. API calls go through a single `request()` helper that attaches the JWT and handles 401s by redirecting to login.

### Frontend component structure

Top level:

- `App.tsx` – routing and providers (`AuthProvider`, `SearchProvider`)
- `LoginPage` – public, no layout
- `ProtectedRoute` – wraps everything else; redirects to login if not authenticated
- `AppLayout` – sidebar + main content area

Inside `AppLayout`, the main pages are:

- **DashboardPage** – stats and charts (projects, tasks, activity)
- **ProjectsPage** – grid of project cards, filters, pagination. Uses `ProjectCard`, `NewProjectDialog`
- **ProjectDetailPage** – single project with tasks. Uses `TaskTable`, `NewTaskDialog`, `EditTaskDialog`, `LogProgressDialog`
- **TasksPage** – task list with filters; “my tasks” vs “all tasks” depending on role. Uses `TaskTable`, `NewTaskDialog`, `EditTaskDialog`, `MyReportsCard`, `LogProgressDialog`
- **AdminUsersPage** – user list (admin only). Uses `EditUserDialog`, `DeleteUserAlert`
- **SettingsPage** – profile and password change

Shared components:

- `components/ui/` – basic building blocks (Button, Input, Card, Dialog, Select, etc.) from Radix UI + Tailwind
- `components/auth/` – `ProtectedRoute`, `AdminRoute`
- `components/layout/` – `AppLayout`, `Sidebar`

Dialogs are self-contained: they receive `open`, `onOpenChange`, and callbacks like `onAdd` or `onSave`. Lookup data (e.g. users for assignee dropdowns) is sometimes fetched by the dialog and sometimes passed in from the parent, depending on what’s simpler.
