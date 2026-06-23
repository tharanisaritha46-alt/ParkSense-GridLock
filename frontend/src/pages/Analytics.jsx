import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'
import { api } from '../api/api'

const COLORS = ['#ff3b5c','#f5a623','#4488ff','#00d4aa','#a855f7','#ec4899','#22d3ee','#84cc16']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-bright)', borderRadius:8, padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:11 }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--amber)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [hourly, setHourly] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [violations, setViolations] = useState([])
  const [trend, setTrend] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      api.analytics.hourly(),
      api.analytics.vehicles(),
      api.analytics.violations(),
      api.analytics.trend(),
      api.analytics.stations(),
    ]).then(([h, v, viol, tr, stn]) => {
      if (h.status === 'fulfilled') setHourly(h.value)
      if (v.status === 'fulfilled') setVehicles(v.value)
      if (viol.status === 'fulfilled') setViolations(viol.value)
      if (tr.status === 'fulfilled') setTrend(tr.value)
      if (stn.status === 'fulfilled') setStations(stn.value)

      ;[h, v, viol, tr, stn].forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Analytics API call ${i} failed:`, r.reason)
      })

      setLoading(false)
    }).catch(err => {
      console.error('Analytics fatal error:', err)
      setError(err.message)
      setLoading(false)
    })
  }, [])

  if (error) return (
    <div className="loading-state" style={{ height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ color: 'var(--red-critical)', fontSize: 18 }}>⚠️ Failed to load analytics</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 20px', background: 'var(--amber)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  )

  if (loading) return (
    <div className="loading-state" style={{ height: '60vh' }}>
      <div className="spinner" /> Loading analytics…
    </div>
  )

  const peakHour = hourly.length ? hourly.reduce((a, b) => a.count > b.count ? a : b, { hour: 0, count: 0 }) : { hour: 0 }
  const peakLabel = `${String(peakHour.hour).padStart(2,'0')}:00–${String((peakHour.hour+1)%24).padStart(2,'0')}:00`

  return (
    <>
      <div className="page-header">
        <div className="page-title">📊 Analytics</div>
        <div className="page-subtitle">DEEP DIVE · 298,450 VIOLATIONS · NOV 2023 – APR 2024</div>
      </div>

      <div className="page-body">
        <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
          <div className="stat-pill">⏰ Peak: {peakLabel}</div>
          <div className="stat-pill">🏆 Top Station: {stations[0]?.station ?? '—'}</div>
          <div className="stat-pill">🚗 Top Vehicle: {vehicles[0]?.vehicle_type ?? '—'}</div>
          <div className="stat-pill">⛔ Top Violation: {violations[0]?.violation?.replace(/"/g,'') ?? '—'}</div>
        </div>

        <div className="chart-card" style={{ marginBottom:16 }}>
          <div className="chart-title">Daily Violation Volume — Full Timeline</div>
          <div className="chart-subtitle">ALL BENGALURU PRECINCTS · RAW COUNT PER DAY</div>
          {trend.length === 0 ? (
            <div className="loading-state" style={{ color:'var(--text-muted)' }}>No trend data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill:'#505670', fontSize:9 }} tickLine={false} interval={7} />
                <YAxis tick={{ fill:'#505670', fontSize:9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#f5a623" strokeWidth={2} fill="url(#areaGrad)" name="Violations" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="charts-grid" style={{ marginBottom:16 }}>
          <div className="chart-card">
            <div className="chart-title">Hour-of-Day Pattern</div>
            <div className="chart-subtitle">RED = PEAK ENFORCEMENT HOURS (7–9AM, 5–8PM)</div>
            {hourly.length === 0 ? (
              <div className="loading-state" style={{ color:'var(--text-muted)' }}>No hourly data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourly} margin={{ top:5, right:5, bottom:0, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fill:'#505670', fontSize:9 }} tickLine={false}
                    tickFormatter={h => `${String(h).padStart(2,'0')}`} />
                  <YAxis tick={{ fill:'#505670', fontSize:9 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[3,3,0,0]} name="Count">
                    {hourly.map((d, i) => (
                      <Cell key={i} fill={[7,8,9,17,18,19,20].includes(d.hour) ? '#ff3b5c' : '#f5a623'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-title">Vehicle Type Distribution</div>
            <div className="chart-subtitle">SHARE OF TOTAL VIOLATIONS</div>
            {vehicles.length === 0 ? (
              <div className="loading-state" style={{ color:'var(--text-muted)' }}>No vehicle data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={vehicles.slice(0,6)} dataKey="count" nameKey="vehicle_type" cx="50%" cy="50%"
                    outerRadius={75} paddingAngle={2} label={({ vehicle_type, percent }) =>
                      `${vehicle_type.split(' ')[0]} ${(percent*100).toFixed(0)}%`
                    } labelLine={false}>
                    {vehicles.slice(0,6).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="charts-grid" style={{ marginBottom:16 }}>
          <div className="chart-card">
            <div className="chart-title">Violation Type Breakdown</div>
            <div className="chart-subtitle">COMPOSITE TAGS · MULTI-VIOLATION RECORDS COUNTED ONCE EACH</div>
            {violations.length === 0 ? (
              <div className="loading-state" style={{ color:'var(--text-muted)' }}>No violation data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={violations} layout="vertical" margin={{ top:0, right:8, bottom:0, left:110 }}>
                  <XAxis type="number" tick={{ fill:'#505670', fontSize:9 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="violation" type="category" tick={{ fill:'#8b92a8', fontSize:9 }} tickLine={false} axisLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#4488ff" radius={[0,4,4,0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-title">Top Police Stations by Volume</div>
            <div className="chart-subtitle">ENFORCEMENT LOAD DISTRIBUTION</div>
            {stations.length === 0 ? (
              <div className="loading-state" style={{ color:'var(--text-muted)' }}>No station data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stations} layout="vertical" margin={{ top:0, right:8, bottom:0, left:110 }}>
                  <XAxis type="number" tick={{ fill:'#505670', fontSize:9 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="station" type="category" tick={{ fill:'#8b92a8', fontSize:9 }} tickLine={false} axisLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#00d4aa" radius={[0,4,4,0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
