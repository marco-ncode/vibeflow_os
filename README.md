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
