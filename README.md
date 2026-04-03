# VibeFlow (stand-alone)

VibeFlow è una webapp React/TypeScript containerizzata (SPA) pensata per essere eseguita in modalità stand-alone (self-hosted) con:

- Postgres “puro” come database
- una piccola API Node.js per setup iniziale, autenticazione e CRUD principali
- Caddy come reverse proxy (unico punto di ingresso)
- Nginx dentro al container `web` solo per servire i file statici della SPA

## Requisiti

- Docker + Docker Compose
- Node.js 20+ + npm (per build, lint e generazione `.env`)

### Installare Node.js e npm

Node.js serve per eseguire gli script `npm` (es. generazione `.env`) e per lo sviluppo frontend.

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

## Avvio (stand-alone, consigliato)

1) Genera `.env` a partire da `.env.example`:

```bash
npm run env:generate
```

Se `.env` esiste già, il comando non lo sovrascrive.

2) Avvia lo stack:

```bash
docker compose up -d --build
```

Oppure:

```bash
npm run stack:up
```

3) Apri l’app:

- http://localhost:3000

### Test locale rapido (stack Docker)

Verifica che i container siano su:

```bash
docker compose ps
docker compose logs --tail=200 db api caddy web
```

Verifica setup (senza auth):

```bash
curl -i http://localhost:3000/api/setup/status
```

Bootstrap admin (una sola volta, poi torna 409):

```bash
curl -i -X POST http://localhost:3000/api/setup/init \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me-123"}'
```

Login e cookie sessione:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me-123"}'
```

Chiamata protetta (usa il cookie salvato):

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects
```

## Primo avvio (setup admin)

Al primo avvio, se non esistono utenti, l’app reindirizza automaticamente a `/setup` per creare il primo utente (admin):

- http://localhost:3000/setup

Dopo la creazione, la UI ti porta a `/login`:

- http://localhost:3000/login

## Flusso operativo (end-to-end)

### Avvio Docker

`docker compose up -d --build`:

1) Avvia `db` (Postgres) e, se il volume è vuoto, esegue lo schema [init.sql](./db/init.sql)
2) Attende `db` “healthy” e avvia `api`
3) Avvia `web` (build frontend + Nginx) e poi `caddy` come entrypoint

### Routing (Caddy)

Tutto passa da `http://localhost:3000`:

- `GET/POST/DELETE /api/*` → `api:3001`
- `/*` → `web:80` (Nginx + SPA)

Config: [Caddyfile](./Caddyfile)

### Setup iniziale

1) La SPA chiama `GET /api/setup/status`
2) Se `setupComplete=false`, mostra `/setup`
3) `POST /api/setup/init` crea il primo utente admin in `public.users`

### Autenticazione e sessioni

- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Sessione: cookie `vf_session` (HttpOnly) + tabella `public.sessions`
- Stato utente: `GET /api/auth/me`

Nel frontend le chiamate API usano `credentials: 'include'` per inviare automaticamente il cookie (vedi [api.ts](./src/lib/api.ts)).

## Stack Docker (single-host)

Lo stack è definito in [docker-compose.yml](./docker-compose.yml).

Servizi:

- `db`: Postgres 16 + schema iniziale (mount di `./db/init.sql`)
- `api`: Node.js (setup + auth + API)
- `web`: build della SPA e serving statico via Nginx
- `caddy`: reverse proxy pubblico (porta host `3000`)

Persistenza:

- DB: `./volumes/db/data`

## Variabili ambiente

File runtime: `.env` (non versionato).

Generazione consigliata: `npm run env:generate` (script: [generate-env.mjs](./scripts/generate-env.mjs)).

Chiavi:

- `POSTGRES_PASSWORD`: password dell’utente DB `vibeflow`
- `SESSION_SECRET`: segreto server-side per derivare hash token sessione
- `SITE_URL`: URL pubblico (locale: `http://localhost:3000`, produzione: `https://example.com`)

Nota:

- Non committare mai `.env`
- Se cambi `POSTGRES_PASSWORD` dopo aver già avviato Postgres con volume persistente, devi fare migrazione o reset del volume

## API HTTP (contratto)

Tutti gli endpoint sono sotto `/api`.

Setup:

- `GET /api/setup/status` → `{ setupComplete: boolean }`
- `POST /api/setup/init` → crea il primo utente admin (solo se non esiste nessun utente)

Auth:

- `POST /api/auth/signup` → crea un utente (richiede setup completato)
- `POST /api/auth/login` → set cookie sessione
- `POST /api/auth/logout` → invalida sessione
- `GET /api/auth/me` → `{ user: null | { id, email, is_admin, created_at, updated_at } }`
- `POST /api/auth/change-password` → cambia password (richiede sessione)

Projects:

- `GET /api/projects` → `{ projects: ProjectRow[] }` (solo dell’utente loggato)
- `POST /api/projects` → `{ project: ProjectRow }`
- `DELETE /api/projects/:id` → `{ ok: true }`

## Schema DB (minimo)

Definito in [db/init.sql](./db/init.sql).

Tabelle principali:

- `public.users` (email, password_hash, is_admin)
- `public.sessions` (token_hash, expires_at, user_id)
- `public.projects` (user_id, project_name, project_scope)
- `public.flows` (project_id, graph jsonb)

## Sviluppo (senza Docker)

Frontend:

```bash
npm install
npm run dev
```

Note:

- `VITE_SETUP_API_BASE_URL` (default `/api`) definisce la base per le chiamate al backend
- in dev, `/api/*` viene proxato a `VITE_DEV_API_TARGET` (default `http://localhost:3000`) (vedi `vite.config.ts`)

### Scenario B (locale): Vite + API Node su `:3001` + Postgres locale

Obiettivo: usare Vite in dev (porta 5173) e far proxare `/api/*` verso la API locale (porta 3001).

1) Avvia Postgres

Opzione consigliata (DB in Docker, solo per sviluppo):

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

2) Avvia la API locale (porta 3001)

```bash
export NODE_ENV=development
export PORT=3001
export SESSION_SECRET='dev-secret-change-me'
export SITE_URL='http://127.0.0.1:5173'
export DATABASE_URL='postgres://vibeflow:changeme@127.0.0.1:5432/vibeflow'

node setup-server/index.js
```

3) Avvia Vite e imposta il proxy verso la API locale

In un altro terminale:

```bash
export VITE_DEV_API_TARGET='http://127.0.0.1:3001'
npm run dev
```

4) Verifica rapida

```bash
curl -i http://127.0.0.1:3001/api/setup/status
curl -i http://127.0.0.1:5173/api/setup/status
```

Nota: in dev la CORS è permissiva solo verso `localhost/127.0.0.1`. In produzione viene accettato solo `SITE_URL`.

## VPS setup (Linux, production)

1) Clona il repo e genera `.env`:

```bash
git clone https://github.com/marco-ncode/vibeflow_os.git
cd vibeflow_os
npm ci
npm run env:generate
```

2) Imposta il dominio pubblico in `.env`:

```bash
sed -i 's|^SITE_URL=.*|SITE_URL=https://example.com|' .env
```

3) Configura Caddy per dominio + HTTPS automatico (sostituisci `:80` con il dominio):

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

4) Esporre 80/443 e persistere cert (in `docker-compose.yml`, service `caddy`):

```yml
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./Caddyfile:/etc/caddy/Caddyfile:ro
  - caddy_data:/data
  - caddy_config:/config
```

5) Avvia:

```bash
docker compose up -d --build
docker compose ps
```

Security note:

- Completa `/setup` subito dopo il bootstrap: finché non esiste un admin, l’endpoint di bootstrap è intenzionalmente pubblico.

## Comandi utili

```bash
npm run lint
npm run build
```

## Troubleshooting rapido

- Reset DB (perdita dati): `docker compose down` + cancella `./volumes/db/data` + `docker compose up -d --build`
- Controllo log: `docker compose logs -f --tail=200 db api caddy web`
- Setup non completato: verifica che `db/init.sql` sia stato eseguito (primo avvio con volume vuoto) e che `api` veda il DB come healthy
