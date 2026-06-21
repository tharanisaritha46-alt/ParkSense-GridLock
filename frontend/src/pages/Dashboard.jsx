import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import KPICards from '../components/KPICards'
import SeverityBadge from '../components/SeverityBadge'
import { api } from '../api/api'

const COLORS = ['#ff3b5c', '#f5a623', '#4488ff', '#00d4aa', '#a855f7', '#ec4899', '#22d3ee', '#84cc16']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--amber)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [hourly, setHourly] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [violations, setViolations] = useState([])
  const [trend, setTrend] = useState([])
  const [top5, setTop5] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.analytics.kpis(),
      api.analytics.hourly(),
      api.analytics.vehicles(),
      api.analytics.violations(),
      api.analytics.trend(),
      api.hotspots.summary(),
    ]).then(([k, h, v, viol, tr, hs]) => {
      setKpis(k)
      setHourly(h)
      setVehicles(v.slice(0, 7))
      setViolations(viol.slice(0, 6))
      setTrend(tr.slice(-30))
      setTop5(hs.top_5 || [])
      setLoading(false)
    }).catch(console.error)
  }, [])

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          ⬛ Command Dashboard
        </div>
        <div className="page-subtitle">
          BENGALURU TRAFFIC POLICE · PARKING VIOLATION INTELLIGENCE · PS1
        </div>
      </div>

      <div className="page-body">
        <KPICards data={kpis} loading={loading} />

        <div className="charts-grid two-one" style={{ marginBottom: 16 }}>
          <div className="chart-card">
            <div className="chart-title">Daily Violation Trend</div>
            <div className="chart-subtitle">LAST 30 DAYS · BENGALURU CITY</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ambGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#505670', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#505670', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#f5a623" strokeWidth={2} fill="url(#ambGrad)" name="Violations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Violation Types</div>
            <div className="chart-subtitle">DISTRIBUTION BY CATEGORY</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={violations} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 80 }}>
                <XAxis type="number" tick={{ fill: '#505670', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="violation" type="category" tick={{ fill: '#8b92a8', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f5a623" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-grid" style={{ marginBottom: 16 }}>
          <div className="chart-card">
            <div className="chart-title">Hourly Violation Pattern</div>
            <div className="chart-subtitle">PEAK HOURS IDENTIFY PATROL WINDOWS</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fill: '#505670', fontSize: 9 }} tickLine={false}
                  tickFormatter={h => `${String(h).padStart(2,'0')}:00`} interval={2} />
                <YAxis tick={{ fill: '#505670', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Violations">
                  {hourly.map((d, i) => (
                    <Cell key={i} fill={[7,8,9,17,18,19,20].includes(d.hour) ? '#ff3b5c' : '#f5a623'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Vehicle Type Breakdown</div>
            <div className="chart-subtitle">TOP OFFENDING CATEGORIES</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={vehicles} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="vehicle_type" tick={{ fill: '#505670', fontSize: 8 }} tickLine={false} />
                <YAxis tick={{ fill: '#505670', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Count">
                  {vehicles.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Hotspots */}
        <div className="chart-card">
          <div className="chart-title">⚠️ Top 5 Critical Hotspots</div>
          <div className="chart-subtitle">RANKED BY CONGESTION IMPACT SCORE</div>
          {loading ? (
            <div className="loading-state"><div className="spinner" /> Loading hotspots…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Police Station</th>
                  <th>Violations</th>
                  <th>Congestion Score</th>
                  <th>Tier</th>
                  <th>Peak Hour</th>
                  <th>Near Junction</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((h, i) => (
                  <tr key={h.cluster_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 600 }}>
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{h.police_station}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.violation_count.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="score-bar">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', minWidth: 36 }}>
                          {h.congestion_score.toFixed(1)}
                        </span>
                        <div className="score-track">
                          <div className="score-fill" style={{
                            width: `${h.congestion_score}%`,
                            background: h.congestion_score >= 80 ? 'var(--red-critical)'
                              : h.congestion_score >= 60 ? 'var(--amber)'
                              : 'var(--blue-high)'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td><SeverityBadge tier={h.severity_tier} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {String(h.peak_hour).padStart(2,'0')}:00
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.near_junction === 'No Junction' ? '—' : h.near_junction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
