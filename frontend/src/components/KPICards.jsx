import React from 'react'

const CARDS = [
  {
    key: 'total_violations',
    label: 'Total Violations',
    color: 'amber',
    format: v => v?.toLocaleString('en-IN') ?? '—',
    meta: 'Bengaluru Nov 2023 – Apr 2024',
  },
  {
    key: 'total_clusters',
    label: 'Hotspot Clusters',
    color: 'blue',
    format: v => v ?? '—',
    meta: 'DBSCAN ε=80m, min=8',
  },
  {
    key: 'critical_zones',
    label: 'Critical Zones',
    color: 'red',
    format: v => v ?? '—',
    meta: 'Score ≥ 80 — immediate action',
  },
  {
    key: 'high_zones',
    label: 'High Priority',
    color: 'teal',
    format: v => v ?? '—',
    meta: 'Score 60–79 — patrol needed',
  },
]

export default function KPICards({ data, loading }) {
  return (
    <div className="kpi-grid">
      {CARDS.map(c => (
        <div key={c.key} className={`kpi-card ${c.color}`}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">
            {loading ? <div className="spinner" style={{ margin: '8px 0' }} /> : c.format(data?.[c.key])}
          </div>
          <div className="kpi-meta">{c.meta}</div>
        </div>
      ))}
    </div>
  )
}
