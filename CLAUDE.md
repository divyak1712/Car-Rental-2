# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-stack car rental booking app: FastAPI (Python) backend, Angular (v22, standalone
components) frontend, MySQL-compatible database (currently TiDB Cloud Serverless). Users browse
a fleet of cars, pick free-form pickup/return dates, and book; admins manage the fleet (add/edit/
delete cars) through a gated admin page.

## Commands

Run from the project root unless noted. **The Python venv at `server/venv` must be active in the
shell** before `server:dev`/`start`/`db:setup` will resolve the right `uvicorn`/`python` — on
Windows: `server\venv\Scripts\activate` (not the POSIX `source .../activate`).

- `npm run dev` — runs FastAPI (`:8000`, `--reload`) and `ng serve` (`:4200`) together via `concurrently`.
- `npm run db:setup` — applies `server/db/schema.sql` and seeds cars + a default admin user (`server/db/migrate.py`). Safe to re-run (idempotent `ON DUPLICATE KEY UPDATE id = id`).
- `npm run build` — production Angular build (`client/dist/client/browser`).
- `npm run start` — single-process prod: FastAPI serves the built Angular static files and the API from one process.
- `npm run lint` — `ng lint` + `ruff check server`.

Frontend-only equivalents live in `client/package.json` (`npm run --prefix client start` etc.);
`start` there is wired to `ng serve --proxy-config proxy.conf.json` — don't drop that flag, see
below.

Tests:
- `cd e2e && npm test` — Playwright UI suite (headed Chromium, serial). Starts both servers itself
  against a dedicated test DB; ~2 min. Single spec: `npx playwright test tests/auth.spec.ts`
  (add `-g "<title>"` for one test). `npm run report` opens the HTML report.
- `npm run --prefix client test` (`ng test`, Vitest) exists but only has the default `app.spec.ts`;
  there are no server tests.

## Architecture

### Two-process dev, one-process prod

`ng serve` and Angular's CLI dev server can't be embedded inside the Python process the way Vite
can be run in middleware mode — it's a separate Node tool with its own HMR. So in dev, two
processes run side by side and `client/proxy.conf.json` makes Angular's dev server proxy `/api/*`
to FastAPI on `:8000`, so the browser only ever sees one origin (`:4200`) — no CORS, cookies just
work. In production there is only one process: FastAPI mounts the built Angular app
(`client/dist/client/browser`, the esbuild builder's one-level-deeper output path) as a catch-all
SPA static mount, registered *after* the API routers in `server/main.py` (Starlette matches
mounts in registration order).

### Server layout (`server/`)

Not a Node package — no `package.json` in here, just a Python venv.

- `database.py` — SQLAlchemy engine (PyMySQL driver), reads `DATABASE_URL`/`DB_SSL` from `.env`.
  **Named `database.py`, not `db.py`** — a sibling `db/` package (below) already exists for
  migrations, and Python's import system resolves a same-named package over a same-named module
  in one directory, so `db.py` next to `db/` silently shadows and breaks `from db import engine`.
  Don't reintroduce `db.py`.
- `auth.py` — hand-rolled auth: bcrypt password hashing, opaque `secrets.token_urlsafe(32)`
  session tokens stored as SHA-256 hashes in a `sessions` table (never the raw token), a
  `get_current_user` FastAPI dependency, and `require_admin` (checks `users.is_admin`) for the
  fleet-management endpoints.
- `data/resources.py` — seed data for the fleet (`RESOURCES` list). Each *physical car* is its
  own row (capacity always 1) rather than a shared-capacity counter — simplest correct model for
  exclusive-use rentals.
- `db/schema.sql`, `db/migrate.py` — schema application + seeding, run via `python -m db.migrate`
  (hence `db/` must stay a package, and `database.py` must stay named that). `migrate.py` also
  seeds a default admin (`admin@carrental.dev` / `admin123`) with `is_admin = TRUE`. Email must
  look like a real, non-reserved domain — `pydantic[email]`'s validator rejects `.local`/
  `.example`/etc.
- `routers/` — `auth.py`, `resources.py` (public browse + admin-only create/update/delete),
  `availability.py` (returns booked date ranges for a car — free-form-duration domain, so there's
  no fixed-slot generation, unlike a court/appointment booking system), `bookings.py`, `my_bookings.py`.
- `main.py` — wires routers under `/api/*`, and overrides FastAPI's default `{"detail": ...}`
  error shape to `{"error": ...}` so the frontend has one error contract.

**Collection routes are registered as `@router.get("")`/`@router.post("")`, not `"/"`.** FastAPI's
default `redirect_slashes` behavior turns a request to `/api/resources` into a 307 redirect to an
*absolute* URL on `:8000` (`http://localhost:8000/api/resources/`) when the route is only
registered at the trailing-slash path. Since `fetch()` follows redirects transparently, that
redirect jumps straight to `:8000`, bypassing the `:4200` dev proxy and silently breaking the
same-origin/cookie story that the whole proxy setup exists for. Keep new collection endpoints
slash-free for the same reason.

### The booking/race-safety model (`db/schema.sql`, `routers/bookings.py`)

Cars are booked over **free-form pickup/return dates**, not fixed slots — the renter proposes a
`starts_at`/`ends_at` and the server validates it, rather than the server generating candidate
slots from operating hours (contrast with a fixed-slot domain like court/appointment booking).

MySQL has no `EXCLUDE USING gist`-style range constraint, so double-booking safety is two layers:
1. `SELECT ... FOR UPDATE` on the `resources` row inside the booking transaction — serializes
   concurrent booking attempts for the same car so the second request's overlap check runs only
   after the first commits.
2. `UNIQUE(resource_id, starts_at)` on `bookings` as a belt-and-suspenders catch for exact-start
   collisions (MySQL error `1062`, translated to a 409).

Never skip the `FOR UPDATE` — without it this degrades to a classic unsafe check-then-insert race,
and the `UNIQUE` constraint alone only catches identical `starts_at` values, not partial overlaps.
`starts_at`/`ends_at` are `DATETIME` (not `TIMESTAMP`, which MySQL silently converts per-connection
time zone) — always store/compare as UTC. The server recomputes the total price server-side from
`resources.price` and the date range; it never trusts a client-supplied total.

### Auth & admin

Sessions are opaque tokens in an `httpOnly` cookie, validated by DB lookup (no JWT secret to
manage). `GET /api/auth/session` returns `null` (not a 401) when signed out — a status read, not
a protected action. Browsing cars/availability is anonymous-friendly; only submitting a booking
and `/api/my-bookings` require `get_current_user`. Fleet-management endpoints
(`POST`/`PUT`/`DELETE /api/resources/*`) require `require_admin`; there is no separate roles
table, just `users.is_admin`.

### Frontend layout (`client/src/app/`)

Generated by Angular CLI v22, which dropped the `.component` file/class suffix by default — this
app follows that convention throughout (`car-list.ts` exports `CarList`, not
`car-list.component.ts` exporting `CarListComponent`). New components should match.

- `services/api.service.ts` — thin `HttpClient` wrapper; `services/auth.service.ts` — a `signal`
  holding the current session plus a `ReplaySubject`-backed `ready$` so route guards can await the
  initial session check.
- `guards/auth.guard.ts` / `guards/admin.guard.ts` — functional `CanActivateFn`s gating
  `/account/rentals` and `/admin/fleet` respectively.
- `pages/` — `car-list`, `car-detail` (browse + date-range booking form), `sign-in`, `sign-up`,
  `my-rentals`, `admin-fleet` (admin-only CRUD table for the fleet).
- No cart/multi-item booking state — a car rental visit is one car, one date range, kept as local
  component signals in `car-detail`, never persisted to `localStorage` (a stale cached slot is
  misleading, not just inconvenient).
- Uses `@if`/`@for` control-flow syntax and `provideHttpClient(withFetch())` (registered in
  `app.config.ts`) throughout, not the older structural directives.

### E2E suite (`e2e/`)

Standalone Playwright + TypeScript project (own `package.json`), not part of the Angular client.

- **Test DB isolation is a hard rule.** `e2e/.env.e2e` (gitignored; template in `.env.e2e.example`)
  holds `E2E_DATABASE_URL`. `e2e/lib/test-db.ts` refuses to run if its host+port+database match
  `server/.env`'s `DATABASE_URL`; it's called from both `playwright.config.ts` (webServers start
  *before* `global-setup`) and `global-setup.ts`, which then runs `python -m db.migrate` against the
  test DB. Never point it at the real DB.
- `webServer` starts FastAPI via `server/venv/Scripts/python.exe -m uvicorn` (venv needn't be
  activated) with `DATABASE_URL` overridden through `env`, plus `ng serve`. `reuseExistingServer`
  is `false` on purpose — an already-running dev server is bound to the real DB, so a port
  conflict on `:8000`/`:4200` should fail the run, not be reused.
- `headless: false` and `workers: 1` are deliberate (ng serve compiles lazy routes on demand; the
  test DB pool is shared). Don't flip them.
- The test DB persists between runs. Booking specs use a dedicated car each (booking-flow → car 2,
  booking-validation → car 3) and `nextFreeOffset()` in `lib/data.ts` to start after the car's
  latest booking, so reruns never overlap. Emails are unique per test (`@playwright-tests.dev`).
- Locators are role/label based (the app has no `data-testid`s); page objects live in
  `e2e/page-objects/`.
- Known app gap: `DELETE /api/resources/{id}` on a car that has bookings will likely hit a FK
  error, so tests only delete cars they just created.

## Environment

`server/.env` (not committed) needs `DATABASE_URL` (`mysql+pymysql://user:pass@host:port/car_rental`)
and `DB_SSL` (`true` for TiDB Cloud / most managed MySQL — routes through `certifi`'s CA bundle in
`database.py`). `server/.env.example` documents the shape.
