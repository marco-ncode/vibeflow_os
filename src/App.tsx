import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

import Home from './pages/Home.tsx'
import Editor from './pages/Editor.tsx'

function Navbar({ theme, setTheme }: { theme: 'dark' | 'light', setTheme: (t: 'dark' | 'light') => void }) {
  return (
    <nav className="navbar">
      <div className="brand">VibeFlow</div>
      <div className="links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/editor" className={({ isActive }) => isActive ? 'active' : ''}>Editor</NavLink>
        {/* Help e Pricing rimossi dall'editor */}
        <label className="theme-label" htmlFor="theme-select">Tema</label>
        <select id="theme-select" className="theme-select" value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
          <option value="dark">Scuro</option>
          <option value="light">Chiaro</option>
        </select>
      </div>
    </nav>
  )
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    return saved ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Navbar theme={theme} setTheme={setTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        {/* Route Help/Pricing rimosse */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
