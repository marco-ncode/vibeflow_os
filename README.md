# VibeFlow (standalone)

VibeFlow is a containerized React/TypeScript web app (SPA) meant to run in standalone (self-hosted) mode with:

- “plain” Postgres as the database
- a small Node.js API for initial setup, authentication, and core CRUD endpoints
- Caddy as the reverse proxy (single public entrypoint)
- Nginx inside the `web` container only to serve the SPA static files

## Requirements

- Docker + Docker Compose
- Node.js 20+ + npm (for build, lint, and `.env` generation)

### Install Node.js and npm

Node.js is used to run `npm` scripts (e.g. `.env` generation) and for frontend development.

#### Ubuntu/Debian (NodeSource)

```bash
sudo apt update
sudo apt install -y ca-certificates curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

#### macOS (Homebrew)

```bash
brew install node@20
node -v
npm -v
```

## Start (standalone, recommended)

1) Generate `.env` from `.env.example`:

```bash
npm run env:generate
```

If `.env` already exists, the command will not overwrite it.

2) Start the stack:

```bash
docker compose up -d --build
```

Or:

```bash
npm run stack:up
```

3) Open the app:

- http://localhost:3000

### Quick local test (Docker stack)

Check containers:

```bash
docker compose ps
docker compose logs --tail=200 db api caddy web
```

Check setup (no auth):

```bash
curl -i http://localhost:3000/api/setup/status
```

Bootstrap admin (only once, then it returns 409):

```bash
curl -i -X POST http://localhost:3000/api/setup/init \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me-123"}'
```

Login and session cookie:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me-123"}'
```

Protected call (uses the saved cookie):

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects
```

## First run (admin setup)

On first run, if there are no users, the app automatically redirects to `/setup` to create the first (admin) user:

- http://localhost:3000/setup

After creation, the UI takes you to `/login`:

- http://localhost:3000/login

After login, the landing page is `/projects`:

- http://localhost:3000/projects

## Operational flow (end-to-end)

### Docker startup

`docker compose up -d --build`:

1) Starts `db` (Postgres) and, if the volume is empty, runs the schema [init.sql](./db/init.sql)
2) Waits for `db` to be “healthy”, then starts `api`
3) Starts `web` (frontend build + Nginx), then `caddy` as the public entrypoint

### Routing (Caddy)

Everything goes through `http://localhost:3000`:

- `GET/POST/DELETE /api/*` → `api:3001`
- `/*` → `web:80` (Nginx + SPA)

Config: [Caddyfile](./Caddyfile)

### Initial setup

1) The SPA calls `GET /api/setup/status`
2) If `setupComplete=false`, it shows `/setup`
3) `POST /api/setup/init` creates the first admin user in `public.users`

### Authentication and sessions

- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Session: `vf_session` cookie (HttpOnly) + `public.sessions` table
- Current user: `GET /api/auth/me`

On the frontend, API calls use `credentials: 'include'` to automatically send the cookie (see [api.ts](./src/lib/api.ts)).

## Docker stack (single host)

Defined in [docker-compose.yml](./docker-compose.yml).

Services:

- `db`: Postgres 16 + initial schema (mount `./db/init.sql`)
- `api`: Node.js (setup + auth + API)
- `web`: SPA build + static serving via Nginx
- `caddy`: public reverse proxy (host port `3000`)

Persistence:

- DB: `./volumes/db/data`

## Environment variables

Runtime file: `.env` (not committed).

Recommended generation: `npm run env:generate` (script: [generate-env.mjs](./scripts/generate-env.mjs)).

Keys:

- `POSTGRES_PASSWORD`: password for DB user `vibeflow`
- `SESSION_SECRET`: server-side secret used to derive session token hashes
- `SITE_URL`: public URL (local: `http://localhost:3000`, production: `https://example.com`)

Notes:

- Never commit `.env`
- If you change `POSTGRES_PASSWORD` after Postgres has already been started with a persistent volume, you need to migrate or reset the volume

## HTTP API (contract)

All endpoints are under `/api`.

Setup:

- `GET /api/setup/status` → `{ setupComplete: boolean }`
- `POST /api/setup/init` → creates the first admin user (only if no users exist yet)

Auth:

- `POST /api/auth/signup` → creates a user (requires setup to be completed)
- `POST /api/auth/login` → sets the session cookie
- `POST /api/auth/logout` → invalidates the session
- `GET /api/auth/me` → `{ user: null | { id, email, is_admin, created_at, updated_at } }`
- `POST /api/auth/change-password` → change password (requires session)

Projects:

- `GET /api/projects` → `{ projects: ProjectRow[] }` (only for the logged-in user)
- `POST /api/projects` → `{ project: ProjectRow }`
- `DELETE /api/projects/:id` → `{ ok: true }`

## DB schema (minimal)

Defined in [db/init.sql](./db/init.sql).

Main tables:

- `public.users` (email, password_hash, is_admin)
- `public.sessions` (token_hash, expires_at, user_id)
- `public.projects` (user_id, project_name, project_scope)
- `public.flows` (project_id, graph jsonb)

## Development (without Docker)

Frontend:

```bash
npm install
npm run dev
```

Notes:

- `VITE_SETUP_API_BASE_URL` (default `/api`) defines the base URL for backend calls
- in dev, `/api/*` is proxied to `VITE_DEV_API_TARGET` (default `http://localhost:3000`) (see `vite.config.ts`)

### Scenario B (local): Vite + Node API on `:3001` + local Postgres

Goal: run Vite in dev (port 5173) and proxy `/api/*` to the local API (port 3001).

1) Start Postgres

Recommended option (DB in Docker, for development only):

```bash
docker run --name vibeflow-db \
  -e POSTGRES_USER=vibeflow \
  -e POSTGRES_DB=vibeflow \
  -e POSTGRES_PASSWORD=changeme \
  -p 5432:5432 \
  -v "$PWD/volumes/db/data:/var/lib/postgresql/data" \
  -v "$PWD/db/init.sql:/docker-entrypoint-initdb.d/00-init.sql:ro" \
  -d postgres:16-alpine
```

2) Start the local API (port 3001)

```bash
export NODE_ENV=development
export PORT=3001
export SESSION_SECRET='dev-secret-change-me'
export SITE_URL='http://127.0.0.1:5173'
export DATABASE_URL='postgres://vibeflow:changeme@127.0.0.1:5432/vibeflow'

node setup-server/index.js
```

3) Start Vite and set the proxy to the local API

In another terminal:

```bash
export VITE_DEV_API_TARGET='http://127.0.0.1:3001'
npm run dev
```

4) Quick verification

```bash
curl -i http://127.0.0.1:3001/api/setup/status
curl -i http://127.0.0.1:5173/api/setup/status
```

Note: in development, CORS accepts only `localhost/127.0.0.1`. In production, only `SITE_URL` is accepted.

## VPS setup (Linux, production)

1) Clone the repo and generate `.env`:

```bash
git clone https://github.com/marco-ncode/vibeflow_os.git
cd vibeflow_os
npm ci
npm run env:generate
```

2) Set the public domain in `.env`:

```bash
sed -i 's|^SITE_URL=.*|SITE_URL=https://example.com|' .env
```

3) Configure Caddy for domain + automatic HTTPS (replace `:80` with your domain):

```caddyfile
example.com {
  handle /api/* {
    reverse_proxy api:3001
  }

  handle {
    reverse_proxy web:80
  }
}
```

4) Expose 80/443 and persist certificates (in `docker-compose.yml`, `caddy` service):

```yml
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./Caddyfile:/etc/caddy/Caddyfile:ro
  - caddy_data:/data
  - caddy_config:/config
```

5) Start:

```bash
docker compose up -d --build
docker compose ps
```

Security note:

- Complete `/setup` immediately after the first bootstrap: until an admin exists, the bootstrap endpoint is intentionally public.

## Useful commands

```bash
npm run lint
npm run build
```

## Quick troubleshooting

- Reset DB (data loss): `docker compose down` + delete `./volumes/db/data` + `docker compose up -d --build`
- Logs: `docker compose logs -f --tail=200 db api caddy web`
- Setup not completed: verify that `db/init.sql` ran (first start with an empty volume) and that `api` sees DB as healthy
