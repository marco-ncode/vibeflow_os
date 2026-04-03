import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

import Editor from './pages/Editor.tsx'
import Login from './pages/Login.tsx'
import Setup from './pages/Setup.tsx'
import Projects from './pages/Projects.tsx'
import Account from './pages/Account.tsx'
import { getSetupStatus } from './lib/setupApi'
import { authMe } from './lib/api'

function Navbar({
  theme,
  setTheme,
  setupComplete,
  isAuthed,
}: {
  theme: 'dark' | 'light',
  setTheme: (t: 'dark' | 'light') => void,
  setupComplete: boolean,
  isAuthed: boolean,
}) {
  return (
    <nav className="navbar">
      <div className="brand">VibeFlow</div>
      <div className="links">
        {setupComplete && isAuthed && (
          <>
            <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>Projects</NavLink>
          </>
        )}
        <div className="theme-toggle" role="group" aria-label="Theme">
          <button type="button" className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M4.93 19.07l1.41-1.41" />
              <path d="M17.66 6.34l1.41-1.41" />
            </svg>
            Light
          </button>
          <button type="button" className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
            </svg>
            Dark
          </button>
        </div>
      </div>
    </nav>
  )
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    return saved ?? 'dark'
  })

  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const status = await getSetupStatus()
        if (!cancelled) setSetupComplete(Boolean(status.setupComplete))
      } catch {
        if (!cancelled) setSetupComplete(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { user } = await authMe()
        if (cancelled) return
        setIsAuthed(Boolean(user))
      } catch {
        if (cancelled) return
        setIsAuthed(false)
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (setupComplete === null || !sessionReady) {
    return (
      <div className="container">
        <div style={{ color: 'var(--muted)' }}>Caricamento…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppRoutes theme={theme} setTheme={setTheme} setupComplete={setupComplete} isAuthed={isAuthed} />
    </BrowserRouter>
  )
}

function AppRoutes({
  theme,
  setTheme,
  setupComplete,
  isAuthed,
}: {
  theme: 'dark' | 'light',
  setTheme: (t: 'dark' | 'light') => void,
  setupComplete: boolean,
  isAuthed: boolean,
}) {
  const location = useLocation()
  const hideNavbar = location.pathname === '/login' || location.pathname === '/setup'

  return (
    <>
      {!hideNavbar && <Navbar theme={theme} setTheme={setTheme} setupComplete={setupComplete} isAuthed={isAuthed} />}
      <Routes>
        <Route
          path="/setup"
          element={setupComplete ? <Navigate to="/login" replace /> : <Setup />}
        />
        <Route
          path="/login"
          element={!setupComplete ? <Navigate to="/setup" replace /> : (isAuthed ? <Navigate to="/projects" replace /> : <Login />)}
        />
        <Route
          path="/"
          element={!setupComplete ? <Navigate to="/setup" replace /> : (isAuthed ? <Navigate to="/projects" replace /> : <Navigate to="/login" replace />)}
        />
        <Route
          path="/editor"
          element={!setupComplete ? <Navigate to="/setup" replace /> : (isAuthed ? <Editor /> : <Navigate to="/login" replace />)}
        />
        <Route
          path="/projects"
          element={!setupComplete ? <Navigate to="/setup" replace /> : (isAuthed ? <Projects /> : <Navigate to="/login" replace />)}
        />
        <Route
          path="/account"
          element={!setupComplete ? <Navigate to="/setup" replace /> : (isAuthed ? <Account /> : <Navigate to="/login" replace />)}
        />
      </Routes>
    </>
  )
}

export default App
