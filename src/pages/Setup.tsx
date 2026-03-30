import { useMemo, useState } from 'react'
import { initFirstUser } from '../lib/setupApi'

function Setup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length >= 8, [email, password])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return

    setBusy(true)
    setMessage(null)
    try {
      await initFirstUser({ email, password })
      setMessage('Utente iniziale creato. Ora puoi effettuare il login.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <h2>Prima configurazione</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 720 }}>
        Crea il primo utente (admin) per inizializzare l’istanza self-hosted.
      </p>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Email admin</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Password admin</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn primary" type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Attendere…' : 'Crea utente'}
            </button>
          </div>
          {message && (
            <div style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', color: 'var(--text)' }}>
              {message}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default Setup

