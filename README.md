# VibeFlow (Stand-alone)

VibeFlow è una webapp React/TypeScript containerizzata, pensata per essere eseguita in modalità stand-alone (self-hosted) con Supabase incluso nello stack (Auth + Postgres + API).

Lo stack include anche Caddy come reverse proxy (unico punto di ingresso) e pubblica Supabase sotto `/supabase`.

## Requisiti

- Docker + Docker Compose

## Avvio (stand-alone, consigliato)

1. Genera automaticamente il file `.env` (chiavi + password) partendo da `.env.example`:

   ```bash
   npm run env:generate
   ```

   Se `.env` esiste già, il comando non lo sovrascrive.

2. Avvia lo stack:

   ```bash
   docker compose up -d --build
   ```

   In alternativa:

   ```bash
   npm run stack:up
   ```

3. Apri:

   - App: http://localhost:3000
   - Supabase Studio: http://localhost:3002
   - Supabase API: http://localhost:3000/supabase

## Primo avvio (creazione utente iniziale)

Al primo avvio, se non esistono utenti, l’app reindirizza automaticamente a `/setup` per creare il primo utente (admin):

- http://localhost:3000/setup

Dopo la creazione, effettua il login:

- http://localhost:3000/login

## Sviluppo (senza Docker)

1. Installa dipendenze:

   ```bash
   npm install
   ```

2. Esporta variabili env (o usa un file `.env.local`):

   - `VITE_SUPABASE_URL` (se omessa, usa automaticamente `${window.location.origin}/supabase`)
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SETUP_API_BASE_URL` (default `/api`)

3. Avvia:

   ```bash
   npm run dev
   ```

Durante lo sviluppo, le chiamate a `/api/*` vengono proxate a `http://localhost:3001` (vedi `vite.config.ts`).

## Comandi utili

```bash
npm run lint
npm run build
```

## Panoramica architettura

Questo repository contiene:

- Frontend: React + TypeScript + Vite (UI principale)
- Setup service: micro-servizio Node.js che gestisce il “first run” (creazione guidata del primo utente)
- Supabase self-hosted: Postgres + Auth (GoTrue) + PostgREST + Storage + Realtime + Studio
- Reverse proxy: Caddy come entrypoint unico (routing verso webapp, setup API e Supabase)

### Routing (Caddy)

Il reverse proxy espone tutto su `http://localhost:3000`:

- `GET/POST /api/*` → setup service (es. `/api/setup/status`, `/api/setup/init`)
- `/*` → webapp
- `/*` → Supabase è pubblicato sotto `/supabase/*` (es. `/supabase/auth/v1`, `/supabase/rest/v1`)

Configurazione: [Caddyfile](file:///Users/n4zgul/Documents/vibeflow/Caddyfile)

### Auth e “wizard” primo avvio

Flusso:

1. L’app controlla lo stato del setup chiamando `GET /api/setup/status`
2. Se `setupComplete=false`, reindirizza a `/setup` e consente la creazione del primo utente admin
3. Dopo la creazione del primo utente, l’accesso avviene tramite `/login`
4. Le route principali (Home/Editor) sono protette: senza sessione Supabase attiva si viene reindirizzati al login

Punti chiave:

- Routing e guard: [App.tsx](file:///Users/n4zgul/Documents/vibeflow/src/App.tsx)
- UI setup: [Setup.tsx](file:///Users/n4zgul/Documents/vibeflow/src/pages/Setup.tsx)
- UI login/signup: [Login.tsx](file:///Users/n4zgul/Documents/vibeflow/src/pages/Login.tsx)
- API client setup: [setupApi.ts](file:///Users/n4zgul/Documents/vibeflow/src/lib/setupApi.ts)
- Client Supabase: [supabase.ts](file:///Users/n4zgul/Documents/vibeflow/src/lib/supabase.ts)

## Stack Docker (sviluppo/produzione “single host”)

Lo stack è definito in [docker-compose.yml](file:///Users/n4zgul/Documents/vibeflow/docker-compose.yml).

Servizi principali:

- `caddy`: entrypoint pubblico (porta host 3000)
- `web`: webapp buildata e servita (nginx interno)
- `setup`: setup service (HTTP)
- `db`: Postgres (immagine Supabase)
- `auth`: GoTrue (Supabase Auth)
- `rest`: PostgREST
- `realtime`: Supabase Realtime
- `storage`: Supabase Storage
- `meta`: postgres-meta (dipendenza di Studio)
- `studio`: Supabase Studio (porta host 3002)
- `kong`: gateway interno usato dagli altri servizi Supabase

Persistenza:

- DB: `./volumes/db/data`
- Storage: `./volumes/storage`

## Configurazione e segreti

### `.env` (runtime)

Lo stack usa un file `.env` locale (non versionato).

- Generazione consigliata: `npm run env:generate`
- Avvio con generazione automatica: `npm run stack:up`

Script: [generate-env.mjs](file:///Users/n4zgul/Documents/vibeflow/scripts/generate-env.mjs)

### Cosa viene generato

Il generatore crea:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY` (JWT firmato con `JWT_SECRET`, `role=anon`)
- `SERVICE_ROLE_KEY` (JWT firmato con `JWT_SECRET`, `role=service_role`)
- `SECRET_KEY_BASE`
- `SITE_URL` (default `http://localhost:3000`, viene letto da `.env.example` se presente)

Importante:

- Non committare mai `.env`
- Non esporre mai `SERVICE_ROLE_KEY` nel frontend

## Dettagli Supabase self-hosted

Questo progetto usa una composizione “minimal” di Supabase self-hosted (Auth/REST/Realtime/Storage).

Configurazione Kong: [kong.yml](file:///Users/n4zgul/Documents/vibeflow/supabase/kong.yml)

Nota: in questa configurazione la protezione via API keys su Kong non è abilitata a livello gateway. Il controllo accessi sui dati va gestito tramite JWT e (quando introdotte) policy RLS su Postgres.

## Sviluppo frontend (no Docker)

Se vuoi lavorare solo sul frontend:

- `npm run dev`
- Proxy dev per `/api/*` → `http://localhost:3001` in [vite.config.ts](file:///Users/n4zgul/Documents/vibeflow/vite.config.ts)
- Supabase URL:
  - se `VITE_SUPABASE_URL` è assente, il client usa `${window.location.origin}/supabase`
  - altrimenti usa `VITE_SUPABASE_URL`

## Struttura repository (per orientarsi)

- `src/` frontend
  - `pages/` pagine (Home, Editor, Setup, Login)
  - `components/` componenti e node types ReactFlow
  - `store/` stato (Zustand)
  - `lib/` client Supabase e chiamate setup API
- `setup-server/` micro-servizio per first-run setup
- `supabase/` configurazione gateway (Kong)
- `docker-compose.yml` stack completo
- `Caddyfile` reverse proxy entrypoint
- `scripts/` utility (generazione `.env`)

## Note per contributor / agenti

- Obiettivo: rendere VibeFlow realmente multi-tenant sui dati (progetti/flow per utente) richiede:
  - persistenza su Postgres
  - schema dati (es. `projects`, `graphs`, `graph_nodes`, `graph_edges`)
  - Row Level Security (RLS) e policy per `auth.uid()`
- Il setup service usa `SERVICE_ROLE_KEY` per creare il primo utente (Admin API):
  - codice: [setup-server/index.js](file:///Users/n4zgul/Documents/vibeflow/setup-server/index.js)
  - endpoint: `POST /api/setup/init`
- Ogni modifica che tocca Auth/compose dovrebbe includere:
  - `npm run lint`
  - `npm run build`

## Troubleshooting rapido

- UI non carica dopo refresh su route: verificare che il proxy serva SPA fallback (Caddy già instrada tutto su `web`)
- Setup sempre “non completato”: controllare log `setup` e che Supabase Auth sia raggiungibile via `/supabase/auth/v1`
- Login fallisce: verificare che `ANON_KEY` nel `.env` corrisponda al `JWT_SECRET` usato dai servizi Supabase
