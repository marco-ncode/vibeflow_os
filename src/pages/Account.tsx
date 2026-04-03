import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authChangePassword, authLogout, authMe } from '../lib/api'

function Account() {
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const canUpdatePassword = useMemo(() => {
    return currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && !passwordSaving
  }, [currentPassword, newPassword, confirmPassword, passwordSaving])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setMessage(null)
      try {
        const { user } = await authMe()
        if (cancelled) return
        if (!user) {
          navigate('/login', { replace: true })
          return
        }
        setEmail(user.email)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Errore imprevisto')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [navigate])

  async function onLogout() {
    setError(null)
    setMessage(null)
    await authLogout().catch(() => null)
    window.location.replace('/login')
  }

  async function onUpdatePassword() {
    if (!canUpdatePassword) return
    setPasswordSaving(true)
    setError(null)
    setMessage(null)
    try {
      await authChangePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password aggiornata.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
      setPasswordSaving(false)
      return
    }
    setPasswordSaving(false)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Account</h1>
        <button className="btn" onClick={() => void onLogout()}>
          Logout
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: 12, color: 'var(--muted)' }}>Caricamento…</div>
      ) : (
        <>
          {error && <div style={{ marginTop: 12, color: '#fecaca' }}>{error}</div>}
          {message && <div style={{ marginTop: 12, color: 'var(--primary)' }}>{message}</div>}

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <section className="card">
              <h2 style={{ marginTop: 0 }}>Email</h2>
              <div className="field">
                <label>Email</label>
                <input value={email} readOnly />
              </div>
            </section>

            <section className="card">
              <h2 style={{ marginTop: 0 }}>Password</h2>
              <div className="field">
                <label>Password attuale</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="field">
                <label>Nuova password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimo 8 caratteri" />
              </div>
              <div className="field">
                <label>Conferma password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button className="btn primary" onClick={() => void onUpdatePassword()} disabled={!canUpdatePassword}>
                Aggiorna password
              </button>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default Account
