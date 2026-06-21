import React from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',            label: 'Dashboard',    icon: '⬛' },
  { to: '/hotspots',   label: 'Hotspot Map',  icon: '🗺️' },
  { to: '/analytics',  label: 'Analytics',    icon: '📊' },
  { to: '/evidence',   label: 'CV Evidence',  icon: '📷' },
  { to: '/enforcement',label: 'Enforcement',  icon: '🚔' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🅿</div>
          <div>
            <div>ParkSense</div>
            <div className="logo-sub">GridLock Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 15 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 4, color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          PS1 — BTP Hackathon 2024
        </div>
        <div>Dataset: 298,450 records</div>
        <div>City: Bengaluru, KA</div>
        <div style={{ marginTop: 6, color: 'var(--amber)' }}>● Live Pipeline</div>
      </div>
    </aside>
  )
}
