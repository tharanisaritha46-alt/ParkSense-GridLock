import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Hotspots from './pages/Hotspots'
import Analytics from './pages/Analytics'
import Evidence from './pages/Evidence'
import Enforcement from './pages/Enforcement'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hotspots" element={<Hotspots />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/enforcement" element={<Enforcement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
