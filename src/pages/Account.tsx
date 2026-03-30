import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Account() {
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const canUpdateEmail = useMemo(() => {
    const next = newEmail.trim()
    return next.length > 0 && next !== email && !emailSaving
  }, [newEmail, email, emailSaving])

  const canUpdatePassword = useMemo(() => {
    return newPassword.length >= 8 && newPassword === confirmPassword && !passwordSaving
  }, [newPassword, confirmPassword, passwordSaving])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setMessage(null)
      const { data, error: err } = await supabase.auth.getUser()
      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      const userEmail = data.user?.email ?? ''
      setEmail(userEmail)
      setNewEmail(userEmail)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  async function onLogout() {
    setError(null)
    setMessage(null)
    const { error: err } = await supabase.auth.signOut()
    if (err) {
      setError(err.message)
      return
    }
    navigate('/login', { replace: true })
  }

  async function onUpdateEmail() {
    if (!canUpdateEmail) return
    setEmailSaving(true)
    setError(null)
    setMessage(null)
    const { data, error: err } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (err) {
      setError(err.message)
      setEmailSaving(false)
      return
    }
    const nextEmail = data.user?.email ?? email
    setEmail(nextEmail)
    setMessage('Email aggiornabile: controlla la posta per confermare, se richiesto.')
    setEmailSaving(false)
  }

  async function onUpdatePassword() {
    if (!canUpdatePassword) return
    setPasswordSaving(true)
    setError(null)
    setMessage(null)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      setError(err.message)
      setPasswordSaving(false)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Password aggiornata.')
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
                <label>Email attuale</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <button className="btn primary" onClick={() => void onUpdateEmail()} disabled={!canUpdateEmail}>
                Aggiorna email
              </button>
            </section>

            <section className="card">
              <h2 style={{ marginTop: 0 }}>Password</h2>
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
