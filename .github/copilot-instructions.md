# Copilot Instructions

## Maintaining This File

**After completing a task, Copilot must autonomously decide whether this file needs updating and apply changes if so.**

Update when:
- Layer structure or directory layout changes
- Environment variables or config keys are added/removed
- Tech stack or libraries change
- Build, test, or lint commands change
- Auth or routing mechanisms change

No update needed when:
- New features follow existing patterns (e.g. new API endpoint, new page)
- Bug fixes or refactoring that don't affect structure

---

## Architecture Overview

This is a personal portfolio site with a decoupled frontend and backend, served behind Nginx.

```
Nginx (port 80)
  ├── /images/  → static files from backend/app/src/main/resources/static/images/
  └── /         → Ktor backend (port 8080)

Next.js frontend (port 3000, dev only) → NEXT_PUBLIC_API_BASE_URL → backend
```

- **Frontend**: Next.js 16 (TypeScript) in `frontend/`
- **Backend**: Ktor + Kotlin in `backend/`, runs on port 8080
- **Database**: MySQL 8 via Flyway migrations, using Exposed ORM
- **DI**: Koin (configured in `backend/app/src/main/kotlin/my/backend/di/AppModule.kt`)
- **Full stack**: `docker-compose up` from repo root

## Frontend

### Commands (run from `frontend/`)
```bash
pnpm dev          # dev server with Turbopack
pnpm build        # production build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm fix          # lint --fix + format
pnpm check        # lint + prettier check (CI)
```

### Layer Pattern
Pages are split into layers — each page composes sections, which delegate state to hooks, which call repositories:

```
src/app/ui/<feature>/page.tsx
  └── section/<FeatureSection>.tsx   ← presentational components
        └── hooks/<feature>/use<Feature>.ts  ← state/effects
              └── repository/<feature>Repository.ts  ← fetch calls to backend API
```

- Repositories use `NEXT_PUBLIC_API_BASE_URL` (set in `.env.local`) as the base URL
- Repository classes are exported as singletons (e.g. `export const blogRepository = new BlogRepository()`)
- Route constants live in `src/app/routes.ts`

### Admin Section
- `/admin/*` routes are protected by the JWT proxy (`src/proxy.ts`)
- JWT is verified using `jose` with secret/issuer/audience from env vars (`JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`)
- Auth token stored in `auth_token` cookie

### Environment Variables (frontend)
Copy `.env.local` values for local dev; the important ones:
- `NEXT_PUBLIC_API_BASE_URL` — backend base URL
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile (contact form)
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` — must match backend

## Backend

### Commands (run from `backend/`)
```bash
./gradlew :app:run           # run locally
./gradlew :app:test          # run all tests
./gradlew :app:test --tests "my.backend.routes.BlogRoutesTest"  # single test class
./gradlew :app:ktlintCheck   # lint
./gradlew :app:ktlintFormat  # auto-fix lint
./gradlew :app:buildFatJar   # build app-all.jar
```

### Layer Pattern
```
routes/<Feature>Routes.kt     ← Ktor route definitions, injects service
  └── service/<Feature>Service.kt   ← business logic
        └── repository/<Feature>Repository.kt  ← Exposed DB queries
```

- Route functions are extension functions on `Route` (e.g. `fun Route.blogRoutes(...)`)
- All routes registered in `plugins/Routing.kt` using Koin `inject()`
- Protected endpoints use `authenticate("auth-jwt") { ... }`
- Custom exceptions are in `exception/CustomExceptions.kt`, handled by `plugins/StatusPages.kt`

### Content Storage
- Blog posts and portfolios are Markdown files in `app/src/main/resources/blogs/` and `app/src/main/resources/portfolios/`
- An `index.txt` in each directory lists the filenames to serve
- Markdown is converted to HTML server-side using flexmark

### Database
- Migrations via Flyway (`src/main/resources/db/migration/`)
- Schema: `users`, `blogs`, `tags`, `blog_tags` tables
- Exposed DSL for queries; `DatabaseFactory` manages the HikariCP connection pool

### Environment / Config
- `application.yaml` (gitignored) — uses `$VAR_NAME` placeholders that Ktor substitutes from environment variables at runtime
- Env vars are injected via `docker-compose.yml` into the container and referenced directly in `application.yaml`
