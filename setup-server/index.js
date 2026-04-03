import http from 'node:http'
import crypto from 'node:crypto'
import { URL } from 'node:url'
import pg from 'pg'

const port = Number(process.env.PORT ?? 3001)
const databaseUrl = process.env.DATABASE_URL
const sessionSecret = process.env.SESSION_SECRET

if (!databaseUrl) throw new Error('Missing DATABASE_URL')
if (!sessionSecret) throw new Error('Missing SESSION_SECRET')

const nodeEnv = process.env.NODE_ENV ?? 'development'
let siteOrigin = null
try {
  const raw = process.env.SITE_URL
  if (raw) siteOrigin = new URL(raw).origin
} catch {
  siteOrigin = null
}

const { Pool } = pg
const pool = new Pool({ connectionString: databaseUrl })

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
    'access-control-allow-methods': 'GET,POST,OPTIONS,DELETE',
    'access-control-allow-headers': 'content-type',
  }
  if (corsOrigin) {
    headers['access-control-allow-origin'] = corsOrigin
    headers['vary'] = 'Origin'
    headers['access-control-allow-credentials'] = 'true'
  }
  res.writeHead(status, headers)
  res.end(body)
}

function sendEmpty(req, res, status) {
  const corsOrigin = getCorsOrigin(req)
  const headers = {
    'access-control-allow-methods': 'GET,POST,OPTIONS,DELETE',
    'access-control-allow-headers': 'content-type',
  }
  if (corsOrigin) {
    headers['access-control-allow-origin'] = corsOrigin
    headers['vary'] = 'Origin'
    headers['access-control-allow-credentials'] = 'true'
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

function parseCookies(req) {
  const header = typeof req.headers.cookie === 'string' ? req.headers.cookie : ''
  const out = new Map()
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const k = trimmed.slice(0, idx).trim()
    const v = trimmed.slice(idx + 1).trim()
    out.set(k, v)
  }
  return out
}

function setCookieHeader(name, value, opts) {
  const parts = [`${name}=${value}`]
  if (opts?.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts?.path) parts.push(`Path=${opts.path}`)
  if (opts?.httpOnly) parts.push('HttpOnly')
  if (opts?.secure) parts.push('Secure')
  if (opts?.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  return parts.join('; ')
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function validEmail(email) {
  if (!email) return false
  if (email.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function encodeBase64Url(buf) {
  return Buffer.from(buf).toString('base64url')
}

function hashSessionToken(rawToken) {
  return crypto.createHash('sha256').update(`${rawToken}.${sessionSecret}`).digest('hex')
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { cost: 16384, blockSize: 8, parallelization: 1 }, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
  const saltPart = encodeBase64Url(salt)
  const hashPart = encodeBase64Url(key)
  return ['scrypt', '16384', '8', '1', '', saltPart, hashPart].join('$')
}

async function verifyPassword(password, stored) {
  const parts = String(stored ?? '').split('$')
  if (parts.length !== 6 && parts.length !== 7) return false
  if (parts[0] !== 'scrypt') return false
  const cost = Number(parts[1])
  const blockSize = Number(parts[2])
  const parallelization = Number(parts[3])
  const saltIndex = parts.length === 7 ? 5 : 4
  const hashIndex = parts.length === 7 ? 6 : 5
  const salt = Buffer.from(parts[saltIndex], 'base64url')
  const hash = Buffer.from(parts[hashIndex], 'base64url')
  const key = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, hash.length, { cost, blockSize, parallelization }, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
  return crypto.timingSafeEqual(hash, key)
}

async function setupComplete() {
  const { rows } = await pool.query('select exists (select 1 from public.users limit 1) as exists')
  return Boolean(rows?.[0]?.exists)
}

async function createFirstUser(email, password) {
  const passwordHash = await hashPassword(password)
  await pool.query(
    'insert into public.users (email, password_hash, is_admin) values ($1, $2, true)',
    [email, passwordHash],
  )
}

async function createUser(email, password) {
  const passwordHash = await hashPassword(password)
  const { rows } = await pool.query(
    'insert into public.users (email, password_hash, is_admin) values ($1, $2, false) returning id, email, is_admin',
    [email, passwordHash],
  )
  return rows[0] ?? null
}

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'select id, email, password_hash, is_admin from public.users where email = $1 limit 1',
    [email],
  )
  return rows[0] ?? null
}

async function getUserById(id) {
  const { rows } = await pool.query(
    'select id, email, is_admin, created_at, updated_at from public.users where id = $1 limit 1',
    [id],
  )
  return rows[0] ?? null
}

async function createSession(userId) {
  const rawToken = encodeBase64Url(crypto.randomBytes(32))
  const tokenHash = hashSessionToken(rawToken)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  await pool.query(
    'insert into public.sessions (user_id, token_hash, expires_at) values ($1, $2, $3)',
    [userId, tokenHash, expiresAt],
  )
  return { rawToken, expiresAt }
}

async function deleteSessionByToken(rawToken) {
  const tokenHash = hashSessionToken(rawToken)
  await pool.query('delete from public.sessions where token_hash = $1', [tokenHash])
}

async function authFromRequest(req) {
  const cookies = parseCookies(req)
  const rawToken = cookies.get('vf_session')
  if (!rawToken) return null
  const tokenHash = hashSessionToken(rawToken)
  const { rows } = await pool.query(
    'select user_id from public.sessions where token_hash = $1 and expires_at > now() limit 1',
    [tokenHash],
  )
  const userId = rows?.[0]?.user_id
  if (!userId) return null
  const user = await getUserById(userId)
  if (!user) return null
  return user
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
      const email = normalizeEmail(body?.email)
      const password = String(body?.password ?? '')

      if (!validEmail(email) || password.length < 8) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      await createFirstUser(email, password)
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
      const complete = await setupComplete().catch(() => false)
      if (!complete) {
        sendJson(req, res, 409, { error: 'setup_required' })
        return
      }

      const body = await readJson(req)
      const email = normalizeEmail(body?.email)
      const password = String(body?.password ?? '')

      if (!validEmail(email) || password.length < 8) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      try {
        const user = await createUser(email, password)
        sendJson(req, res, 200, { user: { id: user.id, email: user.email, is_admin: user.is_admin } })
        return
      } catch (err) {
        sendJson(req, res, 409, { error: 'email_taken' })
        return
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readJson(req)
      const email = normalizeEmail(body?.email)
      const password = String(body?.password ?? '')

      if (!validEmail(email) || !password) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const row = await getUserByEmail(email)
      if (!row) {
        sendJson(req, res, 401, { error: 'invalid_credentials' })
        return
      }

      const ok = await verifyPassword(password, row.password_hash)
      if (!ok) {
        sendJson(req, res, 401, { error: 'invalid_credentials' })
        return
      }

      const { rawToken } = await createSession(row.id)
      const cookie = setCookieHeader('vf_session', rawToken, {
        httpOnly: true,
        secure: nodeEnv === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
      res.setHeader('set-cookie', cookie)
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const cookies = parseCookies(req)
      const rawToken = cookies.get('vf_session')
      if (rawToken) await deleteSessionByToken(rawToken).catch(() => {})
      res.setHeader('set-cookie', setCookieHeader('vf_session', '', {
        httpOnly: true,
        secure: nodeEnv === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }))
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 200, { user: null })
        return
      }
      sendJson(req, res, 200, { user })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/change-password') {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const body = await readJson(req)
      const currentPassword = String(body?.currentPassword ?? '')
      const newPassword = String(body?.newPassword ?? '')
      if (!currentPassword || newPassword.length < 8) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const row = await getUserByEmail(user.email)
      if (!row) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const ok = await verifyPassword(currentPassword, row.password_hash)
      if (!ok) {
        sendJson(req, res, 401, { error: 'invalid_credentials' })
        return
      }

      const passwordHash = await hashPassword(newPassword)
      await pool.query('update public.users set password_hash = $1 where id = $2', [passwordHash, user.id])
      sendJson(req, res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const { rows } = await pool.query(
        'select id, project_name, project_scope, created_at, updated_at from public.projects where user_id = $1 order by created_at desc',
        [user.id],
      )
      sendJson(req, res, 200, { projects: rows ?? [] })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const body = await readJson(req)
      const projectName = String(body?.project_name ?? '').trim()
      const projectScope = String(body?.project_scope ?? '').trim()
      if (!projectName) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const { rows } = await pool.query(
        'insert into public.projects (user_id, project_name, project_scope) values ($1, $2, $3) returning id, project_name, project_scope, created_at, updated_at',
        [user.id, projectName, projectScope || null],
      )
      sendJson(req, res, 200, { project: rows?.[0] ?? null })
      return
    }

    if (req.method === 'GET' && /^\/api\/projects\/\d+\/flows$/.test(url.pathname)) {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const parts = url.pathname.split('/')
      const projectId = Number(parts[3])
      if (!Number.isFinite(projectId)) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const { rows: owned } = await pool.query('select 1 from public.projects where id = $1 and user_id = $2 limit 1', [projectId, user.id])
      if (!owned?.length) {
        sendJson(req, res, 404, { error: 'not_found' })
        return
      }

      const { rows } = await pool.query(
        'select id, flow_name, created_at, updated_at from public.flows where project_id = $1 order by created_at desc',
        [projectId],
      )
      sendJson(req, res, 200, { flows: rows ?? [] })
      return
    }

    if (req.method === 'POST' && /^\/api\/projects\/\d+\/flows$/.test(url.pathname)) {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const parts = url.pathname.split('/')
      const projectId = Number(parts[3])
      if (!Number.isFinite(projectId)) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const { rows: owned } = await pool.query('select 1 from public.projects where id = $1 and user_id = $2 limit 1', [projectId, user.id])
      if (!owned?.length) {
        sendJson(req, res, 404, { error: 'not_found' })
        return
      }

      const body = await readJson(req)
      const flowName = String(body?.flow_name ?? '').trim()

      const { rows } = await pool.query(
        'insert into public.flows (project_id, flow_name) values ($1, $2) returning id, flow_name, created_at, updated_at',
        [projectId, flowName || null],
      )
      sendJson(req, res, 200, { flow: rows?.[0] ?? null })
      return
    }

    if (req.method === 'PUT' && /^\/api\/projects\/\d+$/.test(url.pathname)) {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const id = Number(url.pathname.split('/').pop())
      if (!Number.isFinite(id)) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const body = await readJson(req)
      const projectName = String(body?.project_name ?? '').trim()
      const projectScope = String(body?.project_scope ?? '').trim()
      if (!projectName) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      const { rows } = await pool.query(
        'update public.projects set project_name = $1, project_scope = $2 where id = $3 and user_id = $4 returning id, project_name, project_scope, created_at, updated_at',
        [projectName, projectScope || null, id, user.id],
      )
      const project = rows?.[0] ?? null
      if (!project) {
        sendJson(req, res, 404, { error: 'not_found' })
        return
      }
      sendJson(req, res, 200, { project })
      return
    }

    if (req.method === 'DELETE' && /^\/api\/projects\/\d+$/.test(url.pathname)) {
      const user = await authFromRequest(req)
      if (!user) {
        sendJson(req, res, 401, { error: 'unauthorized' })
        return
      }

      const id = Number(url.pathname.split('/').pop())
      if (!Number.isFinite(id)) {
        sendJson(req, res, 400, { error: 'invalid_input' })
        return
      }

      await pool.query('delete from public.projects where id = $1 and user_id = $2', [id, user.id])
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
