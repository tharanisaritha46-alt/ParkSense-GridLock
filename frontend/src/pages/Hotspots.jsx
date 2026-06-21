import React, { useState, useEffect } from 'react'
import HotspotMap from '../components/HotspotMap'
import SeverityBadge from '../components/SeverityBadge'
import { api } from '../api/api'

export default function Hotspots() {
  const [hotspots, setHotspots] = useState([])
  const [filtered, setFiltered] = useState([])
  const [tier, setTier] = useState('ALL')
  const [station, setStation] = useState('')
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState([])

  useEffect(() => {
    api.hotspots.list({ limit: 725 }).then(res => {
      setHotspots(res.results || [])
      const stns = [...new Set((res.results || []).map(h => h.police_station))].sort()
      setStations(stns)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let f = hotspots
    if (tier !== 'ALL') f = f.filter(h => h.severity_tier === tier)
    if (station) f = f.filter(h => h.police_station === station)
    setFiltered(f)
  }, [hotspots, tier, station])

  const tierCounts = ['CRITICAL','HIGH','MEDIUM','LOW'].map(t => ({
    tier: t,
    count: hotspots.filter(h => h.severity_tier === t).length
  }))

  return (
    <>
      <div className="page-header">
        <div className="page-title">🗺️ Hotspot Map</div>
        <div className="page-subtitle">
          {filtered.length} CLUSTERS SHOWN · DBSCAN ε=80m · {hotspots.length} TOTAL
        </div>
      </div>

      <div className="page-body">
        {/* Tier summary pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {tierCounts.map(({ tier: t, count }) => (
            <div key={t} className="stat-pill" style={{ cursor: 'pointer' }}
              onClick={() => setTier(tier === t ? 'ALL' : t)}>
              <SeverityBadge tier={t} />
              <span style={{ marginLeft: 4, color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <select className="filter-select" value={tier} onChange={e => setTier(e.target.value)}>
            <option value="ALL">All Tiers</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟡 High</option>
            <option value="MEDIUM">🔵 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          <select className="filter-select" value={station} onChange={e => setStation(e.target.value)}>
            <option value="">All Police Stations</option>
            {stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button className="btn btn-ghost" onClick={() => { setTier('ALL'); setStation('') }}>
            Reset
          </button>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Showing {filtered.length} / {hotspots.length} clusters
          </span>
        </div>

        {/* Map */}
        <div className="map-container" style={{ marginBottom: 20 }}>
          {loading
            ? <div className="loading-state"><div className="spinner" /> Loading map data…</div>
            : <HotspotMap hotspots={filtered} selectedTier={tier} />
          }
        </div>

        {/* Table */}
        <div className="chart-card">
          <div className="chart-title">Hotspot Cluster Details</div>
          <div className="chart-subtitle">SORTED BY CONGESTION SCORE DESCENDING</div>
          <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                <tr>
                  <th>Cluster</th>
                  <th>Station</th>
                  <th>Violations</th>
                  <th>Score</th>
                  <th>Tier</th>
                  <th>Top Vehicle</th>
                  <th>Peak Hr</th>
                  <th>Lat, Lon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map(h => (
                  <tr key={h.cluster_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{h.cluster_id}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{h.police_station}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.violation_count.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="score-bar">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)', minWidth: 32 }}>
                          {h.congestion_score.toFixed(1)}
                        </span>
                        <div className="score-track" style={{ width: 60 }}>
                          <div className="score-fill" style={{
                            width: `${h.congestion_score}%`,
                            background: h.congestion_score >= 80 ? 'var(--red-critical)' : h.congestion_score >= 60 ? 'var(--amber)' : 'var(--blue-high)'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td><SeverityBadge tier={h.severity_tier} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{h.top_vehicle}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{String(h.peak_hour).padStart(2,'0')}:00</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {h.center_lat.toFixed(4)}, {h.center_lon.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
