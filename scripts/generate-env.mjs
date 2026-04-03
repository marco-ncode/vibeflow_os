import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const envPath = path.join(repoRoot, '.env')
const envExamplePath = path.join(repoRoot, '.env.example')

function randomAlnum(length) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  while (out.length < length) {
    const buf = crypto.randomBytes(length)
    for (const b of buf) {
      out += alphabet[b % alphabet.length]
      if (out.length >= length) break
    }
  }
  return out
}

function readExistingEnv(file) {
  if (!fs.existsSync(file)) return null
  const text = fs.readFileSync(file, 'utf8')
  const map = new Map()
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    map.set(key, value)
  }
  return map
}

function writeEnv(file, values) {
  const lines = []
  for (const [k, v] of Object.entries(values)) {
    lines.push(`${k}=${v}`)
  }
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8')
}

const example = readExistingEnv(envExamplePath)
if (!example) {
  throw new Error('.env.example missing')
}

if (fs.existsSync(envPath)) {
  process.exit(0)
}

const siteUrl = example.get('SITE_URL') || 'http://localhost:3000'
const postgresPassword = randomAlnum(32)
const sessionSecret = crypto.randomBytes(48).toString('base64')

writeEnv(envPath, {
  POSTGRES_PASSWORD: postgresPassword,
  SESSION_SECRET: sessionSecret,
  SITE_URL: siteUrl,
})
