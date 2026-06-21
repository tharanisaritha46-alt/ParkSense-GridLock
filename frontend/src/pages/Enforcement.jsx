import React, { useState, useEffect } from 'react'
import SeverityBadge from '../components/SeverityBadge'
import { api } from '../api/api'

const ACTION_CONFIG = {
  'Tow + Fine + CCTV Alert': { color: 'var(--red-critical)', icon: '🚨' },
  'Fine + Patrol':            { color: 'var(--amber)',        icon: '🚔' },
  'Warning + Fine':           { color: 'var(--blue-high)',    icon: '⚠️' },
  'Warning':                  { color: 'var(--teal)',         icon: '📋' },
}

export default function Enforcement() {
  const [plan, setPlan] = useState([])
  const [priority, setPriority] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.enforcement.plan(20),
      api.enforcement.priority(),
    ]).then(([p, pr]) => {
      setPlan(p.plan || [])
      setPriority(pr)
      setLoading(false)
    })
  }, [])

  const totalPatrols = plan.reduce((s, p) => s + (p.recommended_patrols || 0), 0)

  return (
    <>
      <div className="page-header">
        <div className="page-title">🚔 Enforcement Plan</div>
        <div className="page-subtitle">
          AI-RECOMMENDED PATROL ALLOCATION · TOP 20 HOTSPOTS · BTP COMMAND
        </div>
      </div>

      <div className="page-body">
        {/* Summary KPIs */}
        <div className="kpi-grid" style={{ marginBottom:20 }}>
          <div className="kpi-card red">
            <div className="kpi-label">Critical Zones</div>
            <div className="kpi-value">{priority?.critical_count ?? '—'}</div>
            <div className="kpi-meta">Require immediate deployment</div>
          </div>
          <div className="kpi-card amber">
            <div className="kpi-label">Total Patrols Needed</div>
            <div className="kpi-value">{loading ? '—' : totalPatrols}</div>
            <div className="kpi-meta">Across top 20 zones</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-label">Zones Covered</div>
            <div className="kpi-value">20</div>
            <div className="kpi-meta">AI-ranked enforcement plan</div>
          </div>
          <div className="kpi-card teal">
            <div className="kpi-label">Tow Actions</div>
            <div className="kpi-value">{plan.filter(p => p.action?.includes('Tow')).length}</div>
            <div className="kpi-meta">Critical-tier zones</div>
          </div>
        </div>

        {/* Methodology */}
        <div className="chart-card" style={{ marginBottom:20 }}>
          <div className="chart-title">How Enforcement Priority is Calculated</div>
          <div className="chart-subtitle">CONGESTION IMPACT MODEL · MULTI-FACTOR SCORING</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginTop:14 }}>
            {[
              { label:'Violation Volume', weight:'35%', color:'var(--amber)', desc:'Raw count in cluster' },
              { label:'Severity Score', weight:'25%', color:'var(--red-critical)', desc:'Avg violation gravity' },
              { label:'Junction Proximity', weight:'20%', color:'var(--blue-high)', desc:'Near critical junctions' },
              { label:'Vehicle Diversity', weight:'10%', color:'var(--teal)', desc:'Mix of vehicle types' },
              { label:'Peak Hour Share', weight:'10%', color:'#a855f7', desc:'% in rush hours' },
            ].map(f => (
              <div key={f.label} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'14px 12px', borderTop:`2px solid ${f.color}` }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, color:f.color, marginBottom:4 }}>
                  {f.weight}
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:12, color:'var(--text-primary)', marginBottom:4 }}>
                  {f.label}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan table */}
        <div className="chart-card">
          <div className="chart-title">Deployment Plan — Top 20 Hotspots</div>
          <div className="chart-subtitle">RECOMMENDED PATROL WINDOWS, TEAM SIZE, AND ACTION TYPE</div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /> Computing enforcement plan…</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Police Station</th>
                    <th>Score</th>
                    <th>Tier</th>
                    <th>Violations</th>
                    <th>Patrol Window</th>
                    <th>Teams</th>
                    <th>Action</th>
                    <th>Near Junction</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((p, i) => {
                    const ac = ACTION_CONFIG[p.action] || { color:'var(--text-secondary)', icon:'📋' }
                    return (
                      <tr key={p.cluster_id}>
                        <td>
                          <span style={{ fontFamily:'var(--font-mono)', color: i<3 ? 'var(--red-critical)' : 'var(--amber)', fontWeight:700 }}>
                            {String(i+1).padStart(2,'0')}
                          </span>
                        </td>
                        <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{p.police_station}</td>
                        <td>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--amber)', fontWeight:600 }}>
                            {p.congestion_score?.toFixed(1)}
                          </span>
                        </td>
                        <td><SeverityBadge tier={p.severity_tier} /></td>
                        <td style={{ fontFamily:'var(--font-mono)' }}>{p.violation_count?.toLocaleString('en-IN')}</td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)' }}>
                          {p.patrol_timing}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            {Array.from({ length: p.recommended_patrols || 1 }).map((_, j) => (
                              <span key={j} style={{ fontSize:16 }}>👮</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:ac.color, background:`${ac.color}18`, border:`1px solid ${ac.color}40`, padding:'3px 8px', borderRadius:6 }}>
                            {ac.icon} {p.action}
                          </span>
                        </td>
                        <td style={{ fontSize:10, color:'var(--text-muted)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.near_junction === 'No Junction' ? '—' : p.near_junction}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
