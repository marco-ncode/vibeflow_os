import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'

import Home from './pages/Home.tsx'
import Editor from './pages/Editor.tsx'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">VibeFlow</div>
      <div className="links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/editor" className={({ isActive }) => isActive ? 'active' : ''}>Editor</NavLink>
        {/* Help e Pricing rimossi dall'editor */}
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        {/* Route Help/Pricing rimosse */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
