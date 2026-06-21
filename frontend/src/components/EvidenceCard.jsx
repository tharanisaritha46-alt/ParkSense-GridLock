import React from 'react'
import SeverityBadge from './SeverityBadge'

const VIOL_ICONS = {
  'WRONG PARKING': '🚫',
  'NO PARKING': '⛔',
  'PARKING ON FOOTPATH': '🚶',
  'PARKING NEAR ROAD CROSSING': '🛑',
  'PARKING IN A MAIN ROAD': '🚦',
}

export default function EvidenceCard({ sample }) {
  const tier = ['PARKING NEAR ROAD CROSSING','PARKING ON FOOTPATH','PARKING IN A MAIN ROAD'].includes(sample.violation)
    ? 'CRITICAL'
    : 'HIGH'

  const icon = VIOL_ICONS[sample.violation] || '🚗'
  const conf = Math.round((sample.confidence || 0.88) * 100)

  return (
    <div className="evidence-card">
      <div className="evidence-img">{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
            {sample.location}
          </span>
          <SeverityBadge tier={tier} />
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
          {sample.violation}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="stat-pill">🪪 {sample.license_plate}</span>
          <span className="stat-pill">🎯 {conf}% conf</span>
          <span className="stat-pill">✅ {sample.status}</span>
        </div>
      </div>
    </div>
  )
}
