import React, { useEffect, useRef, useState } from 'react'

const TIER_COLORS = {
  CRITICAL: '#ff3b5c',
  HIGH: '#f5a623',
  MEDIUM: '#4488ff',
  LOW: '#00d4aa',
}

export default function HotspotMap({ hotspots = [], selectedTier = 'ALL' }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const layerGroupRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map)

    leafletMapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      leafletMapRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = window.L
    if (!L || !leafletMapRef.current || !layerGroupRef.current) return

    layerGroupRef.current.clearLayers()

    const filtered = selectedTier === 'ALL'
      ? hotspots
      : hotspots.filter(h => h.severity_tier === selectedTier)

    filtered.forEach(h => {
      const color = TIER_COLORS[h.severity_tier] || '#4488ff'
      const radius = Math.max(8, Math.min(28, h.violation_count / 50))

      const circle = L.circleMarker([h.center_lat, h.center_lon], {
        radius,
        fillColor: color,
        fillOpacity: 0.75,
        color: color,
        weight: 1.5,
        opacity: 0.9,
      })

      circle.bindPopup(`
        <div style="font-family: 'Space Grotesk', sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: ${color}">
            ${h.severity_tier} ZONE
          </div>
          <div style="font-size: 12px; margin-bottom: 4px; color: #666"><b>Station:</b> ${h.police_station}</div>
          <div style="font-size: 12px; margin-bottom: 4px; color: #666"><b>Violations:</b> ${h.violation_count.toLocaleString('en-IN')}</div>
          <div style="font-size: 12px; margin-bottom: 4px; color: #666"><b>Congestion Score:</b> ${h.congestion_score.toFixed(1)}</div>
          <div style="font-size: 12px; margin-bottom: 4px; color: #666"><b>Peak Hour:</b> ${String(h.peak_hour).padStart(2,'0')}:00</div>
          <div style="font-size: 12px; color: #666"><b>Top Vehicle:</b> ${h.top_vehicle}</div>
          <div style="font-size: 11px; margin-top: 6px; color: #999; font-style: italic">${h.dominant_violation}</div>
        </div>
      `, { maxWidth: 260 })

      layerGroupRef.current.addLayer(circle)
    })
  }, [hotspots, selectedTier])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
