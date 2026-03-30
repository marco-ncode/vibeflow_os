import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
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
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Registrazione completata. Se è richiesta conferma email, controlla la casella di posta.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <h2>{mode === 'login' ? 'Accedi' : 'Registrati'}</h2>
      <p style={{ color: 'var(--muted)' }}>
        {mode === 'login' ? 'Accedi per usare VibeFlow.' : 'Crea un account per usare VibeFlow.'}
      </p>
      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Email</span>
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
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn primary" type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Attendere…' : (mode === 'login' ? 'Accedi' : 'Registrati')}
            </button>
            <button className="btn" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} disabled={busy}>
              {mode === 'login' ? 'Crea account' : 'Ho già un account'}
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

export default Login

