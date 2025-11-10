import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import Editor from './pages/Editor'
import Help from './pages/Help'
import Pricing from './pages/Pricing'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">VibeFlow</div>
      <div className="links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/editor" className={({ isActive }) => isActive ? 'active' : ''}>Editor</NavLink>
        <NavLink to="/help" className={({ isActive }) => isActive ? 'active' : ''}>Help</NavLink>
        <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''}>Pricing</NavLink>
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
        <Route path="/help" element={<Help />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
