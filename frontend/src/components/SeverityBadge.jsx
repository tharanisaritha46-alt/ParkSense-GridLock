import React from 'react'

const TIER_CONFIG = {
  CRITICAL: { cls: 'critical', dot: '🔴', label: 'CRITICAL' },
  HIGH:     { cls: 'high',     dot: '🟡', label: 'HIGH' },
  MEDIUM:   { cls: 'medium',   dot: '🔵', label: 'MEDIUM' },
  LOW:      { cls: 'low',      dot: '🟢', label: 'LOW' },
}

export default function SeverityBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG['LOW']
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.dot} {cfg.label}
    </span>
  )
}
