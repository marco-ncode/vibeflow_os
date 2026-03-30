import http from 'node:http'
import { URL } from 'node:url'

const port = Number(process.env.PORT ?? 3001)
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const nodeEnv = process.env.NODE_ENV ?? 'development'
let siteOrigin = null
try {
  const raw = process.env.SITE_URL
  if (raw) siteOrigin = new URL(raw).origin
} catch {
  siteOrigin = null
}

function getCorsOrigin(req) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : null
  if (!origin) return null

  const forwardedHost = typeof req.headers['x-forwarded-host'] === 'string' ? req.headers['x-forwarded-host'] : null
  const host = forwardedHost ?? (typeof req.headers.host === 'string' ? req.headers.host : null)

  if (siteOrigin && origin === siteOrigin) return origin

  if (host && (origin === `http://${host}` || origin === `https://${host}`)) return origin

  if (nodeEnv !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin
  }

  return null
}

function sendJson(req, res, status, payload) {
  const body = JSON.stringify(payload)
  const corsOrigin = getCorsOrigin(req)
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  }
  if (corsOrigin) {
    headers['access-control-allow-origin'] = corsOrigin
    headers['vary'] = 'Origin'
  }
  res.writeHead(status, headers)
  res.end(body)
}

function sendEmpty(req, res, status) {
  const corsOrigin = getCorsOrigin(req)
  const headers = {
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  }
  if (corsOrigin) {
    headers['access-control-allow-origin'] = corsOrigin
    headers['vary'] = 'Origin'
  }
  res.writeHead(status, headers)
  res.end()
}

async function readJson(req) {
  const maxBytes = 1024 * 1024
  const chunks = []
  let total = 0

  for await (const chunk of req) {
    total += chunk.length
    if (total > maxBytes) throw new Error('Body too large')
    chunks.push(chunk)
  }

  if (chunks.length === 0) return null
  const text = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(text)
}

async function adminFetch(path, init = {}) {
  const url = `${supabaseUrl.replace(/\/$/, '')}${path}`
  const headers = new Headers(init.headers ?? {})
  headers.set('apikey', serviceRoleKey)
  headers.set('authorization', `Bearer ${serviceRoleKey}`)

  return fetch(url, { ...init, headers })
}

async function setupComplete() {
  const res = await adminFetch('/auth/v1/admin/users?page=1&per_page=1', { method: 'GET' })
  if (!res.ok) throw new Error(`Auth admin users failed: ${res.status}`)
  const data = await res.json()
  const users = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : [])
  return users.length > 0
}

async function createFirstUser(email, password) {
  const res = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { role: 'admin' } }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Create user failed: ${res.status} ${text}`.trim())
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

    if (req.method === 'OPTIONS') {
      sendEmpty(req, res, 204)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/setup/status') {
      const complete = await setupComplete().catch(() => false)
      sendJson(req, res, 200, { setupComplete: complete })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/setup/init') {
      const complete = await setupComplete().catch(() => false)
      if (complete) {
        sendJson(req, res, 409, { error: 'setup_already_completed' })
        return
      }

      const body = await readJson(req)
      const email = String(body?.email ?? '').trim()
      const password = String(body?.password ?? '')

      if (!email || password.length < 8) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      await createFirstUser(email, password)
      sendJson(req, res, 200, { ok: true })
      return
    }

    sendJson(req, res, 404, { error: 'not_found' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal_error'
    sendJson(req, res, 500, { error: nodeEnv === 'production' ? 'internal_error' : message })
  }
})

server.listen(port, '0.0.0.0')
