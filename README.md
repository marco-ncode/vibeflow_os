# VibeFlow (Stand-alone)

VibeFlow è una webapp React/TypeScript containerizzata, pensata per essere eseguita in modalità stand-alone (self-hosted) con Supabase incluso nello stack (Auth + Postgres + API).

Lo stack include anche Caddy come reverse proxy (unico punto di ingresso) e pubblica Supabase sotto `/supabase`.

## Requisiti

- Docker + Docker Compose
- Node.js 20+ (consigliato) + npm

### Installare Node.js e npm

Node.js serve per eseguire gli script `npm` (es. generazione `.env`) e per lo sviluppo frontend senza Docker.

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

## VPS setup (Linux, production) [EN]

Prerequisites:

- Linux VPS with public IP and a DNS A/AAAA record pointing to your domain (e.g. `example.com`)
- Open ports: `22`, `80`, `443`
- Sudo user

1) Install Docker + Compose (Ubuntu/Debian)

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl gnupg git ufw

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
docker version
docker compose version
```

2) Firewall (recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

3) Clone the repository

```bash
cd ~
git clone https://github.com/marco-ncode/vibeflow_os.git
cd vibeflow_os
```

4) Generate `.env` secrets

The generator uses Node.js. If Node is not available, either install it (see “Installare Node.js e npm” above) or create `.env` manually from `.env.example`.

```bash
npm ci
npm run env:generate
```

Then set your public domain:

```bash
sed -i 's|^SITE_URL=.*|SITE_URL=https://example.com|' .env
```

5) Caddy with domain + HTTPS

Replace `:80` in `Caddyfile` with your domain:

```caddyfile
example.com {
  handle_path /supabase/* {
    reverse_proxy kong:8000
  }

  handle_path /api/* {
    reverse_proxy setup:3001
  }

  handle {
    reverse_proxy web:80
  }
}
```

6) Expose 80/443 and persist certs (docker-compose)

Edit the `caddy` service in `docker-compose.yml`:

```yml
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./Caddyfile:/etc/caddy/Caddyfile:ro
  - caddy_data:/data
  - caddy_config:/config
```

Add volumes at the end of the file if missing:

```yml
volumes:
  caddy_data:
  caddy_config:
```

Update Supabase Studio public URL to match your domain:

- `studio.environment.SUPABASE_PUBLIC_URL=https://example.com/supabase`

7) Start the stack

```bash
docker compose up -d --build
docker compose ps
```

8) Verify

- App: `https://example.com`
- First-run setup: `https://example.com/setup`
- Supabase Studio: `http://SERVER_IP:3002` (by default it is not exposed behind Caddy)

Security notes:

- Complete `/setup` immediately after bootstrapping. Until the first admin is created, the bootstrap endpoint is intentionally unauthenticated.
- Consider restricting public exposure during bootstrap (e.g., firewall allow-list/VPN).
- Backups: persist and back up `./volumes/db/data` and `./volumes/storage`.

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
- `/supabase/*` → Supabase (via Kong) (es. `/supabase/auth/v1`, `/supabase/rest/v1`)
- `/*` → webapp

Configurazione: [Caddyfile](./Caddyfile)

### Guida: configurare Caddy (dominio/HTTPS)

Questa repo include già un `Caddyfile` pronto per instradare:

- `/supabase/*` → `kong:8000`
- `/api/*` → `setup:3001`
- tutto il resto → `web:80`

#### Caso 1: locale (default)

Con lo stack Docker attuale, Caddy ascolta in container su `:80` e viene esposto sulla macchina host su `http://localhost:3000` tramite:

- `docker-compose.yml` → `caddy.ports: "3000:80"`
- `.env` → `SITE_URL=http://localhost:3000`

Non serve modificare nulla.

#### Caso 2: produzione su un dominio con HTTPS automatico

1. Punta il DNS del dominio (A/AAAA) verso il server dove gira Docker.
2. Aggiorna `.env` impostando il dominio pubblico:

   ```env
   SITE_URL=https://example.com
   ```

3. Aggiorna `docker-compose.yml` per esporre le porte standard e persistere i certificati:

   ```yml
   caddy:
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./Caddyfile:/etc/caddy/Caddyfile:ro
       - caddy_data:/data
       - caddy_config:/config
   ```

   e aggiungi (se assente) in fondo al file:

   ```yml
   volumes:
     caddy_data:
     caddy_config:
   ```

4. Aggiorna `Caddyfile` sostituendo `:80` con il tuo dominio:

   ```caddyfile
   example.com {
     handle_path /supabase/* {
       reverse_proxy kong:8000
     }

     handle_path /api/* {
       reverse_proxy setup:3001
     }

     handle {
       reverse_proxy web:80
     }
   }
   ```

5. Aggiorna la URL pubblica di Supabase Studio (in `docker-compose.yml`) per farla combaciare con il dominio:

   - `studio.environment.SUPABASE_PUBLIC_URL=https://example.com/supabase`

6. Riavvia lo stack:

   ```bash
   docker compose up -d --build
   ```

Note operative:

- HTTPS automatico richiede che il server sia raggiungibile su `80/tcp` e `443/tcp` dall’esterno.
- Se cambi il path pubblico di Supabase (diverso da `/supabase`), vanno aggiornati sia il `Caddyfile` sia il client (es. `VITE_SUPABASE_URL` oppure l’assunzione `${window.location.origin}/supabase`).

### Auth e “wizard” primo avvio

Flusso:

1. L’app controlla lo stato del setup chiamando `GET /api/setup/status`
2. Se `setupComplete=false`, reindirizza a `/setup` e consente la creazione del primo utente admin
3. Dopo la creazione del primo utente, l’accesso avviene tramite `/login`
4. Le route principali (Home/Editor) sono protette: senza sessione Supabase attiva si viene reindirizzati al login

Punti chiave:

- Routing e guard: [App.tsx](./src/App.tsx)
- UI setup: [Setup.tsx](./src/pages/Setup.tsx)
- UI login/signup: [Login.tsx](./src/pages/Login.tsx)
- API client setup: [setupApi.ts](./src/lib/setupApi.ts)
- Client Supabase: [supabase.ts](./src/lib/supabase.ts)

## Stack Docker (sviluppo/produzione “single host”)

Lo stack è definito in [docker-compose.yml](./docker-compose.yml).

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

Script: [generate-env.mjs](./scripts/generate-env.mjs)

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

Configurazione Kong: [kong.yml](./supabase/kong.yml)

Nota: in questa configurazione la protezione via API keys su Kong non è abilitata a livello gateway. Il controllo accessi sui dati va gestito tramite JWT e (quando introdotte) policy RLS su Postgres.

## Sviluppo frontend (no Docker)

Se vuoi lavorare solo sul frontend:

- `npm run dev`
- Proxy dev per `/api/*` → `http://localhost:3001` in [vite.config.ts](./vite.config.ts)
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
  - codice: [setup-server/index.js](./setup-server/index.js)
  - endpoint: `POST /api/setup/init`
- Ogni modifica che tocca Auth/compose dovrebbe includere:
  - `npm run lint`
  - `npm run build`

## Troubleshooting rapido

- UI non carica dopo refresh su route: verificare che il proxy serva SPA fallback (Caddy già instrada tutto su `web`)
- Setup sempre “non completato”: controllare log `setup` e che Supabase Auth sia raggiungibile via `/supabase/auth/v1`
- Login fallisce: verificare che `ANON_KEY` nel `.env` corrisponda al `JWT_SECRET` usato dai servizi Supabase
