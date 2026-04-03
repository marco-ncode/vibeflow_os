import { useMemo, useState } from 'react'
import { authLogin, authSignup } from '../lib/api'

function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        await authLogin({ email, password })
        window.location.replace('/projects')
      } else {
        await authSignup({ email, password })
        setMessage('Registrazione completata.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-head">
          <img className="auth-logo" src="/dark.png" width={80} height={80} alt="VibeFlow" />
          <div className="auth-title">{mode === 'login' ? 'SIGN IN' : 'SIGN UP'}</div>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label" htmlFor="email">E-mail</label>
          <input
            id="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
          />

          <label className="auth-label" htmlFor="password">Password</label>
          <div className="auth-password">
            <input
              id="password"
              className="auth-input auth-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              disabled={busy}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {mode === 'login' && (
            <button
              type="button"
              className="auth-link"
              onClick={() => setMessage('Per reimpostare la password, contatta un admin.')}
              disabled={busy}
            >
              Forgot your password?
            </button>
          )}

          <button className="btn primary auth-submit" type="submit" disabled={!canSubmit || busy}>
            {busy ? 'Attendere…' : (mode === 'login' ? 'SIGN IN' : 'SIGN UP')}
          </button>

          <div className="auth-footer">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button className="auth-inline" type="button" onClick={() => setMode('signup')} disabled={busy}>
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="auth-inline" type="button" onClick={() => setMode('login')} disabled={busy}>
                  SIGN IN
                </button>
              </>
            )}
          </div>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
