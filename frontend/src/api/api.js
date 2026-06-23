const BASE = import.meta.env.VITE_API_URL || 'https://saritha-1-parksense-gridlock-api.hf.space'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  hotspots: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/api/hotspots/?${q}`)
    },
    summary: () => get('/api/hotspots/summary'),
    get: (id) => get(`/api/hotspots/${id}`),
  },
  analytics: {
    all: () => get('/api/analytics/'),
    kpis: () => get('/api/analytics/kpis'),
    hourly: () => get('/api/analytics/hourly'),
    vehicles: () => get('/api/analytics/vehicles'),
    violations: () => get('/api/analytics/violations'),
    trend: () => get('/api/analytics/trend'),
    stations: () => get('/api/analytics/stations'),
  },
  enforcement: {
    plan: (limit = 20) => get(`/api/enforcement/plan?limit=${limit}`),
    priority: () => get('/api/enforcement/priority'),
  },
  evidence: {
    samples: () => get('/api/evidence/samples'),
    analyze: async (file) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE}/api/evidence/analyze`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('CV analysis failed')
      return res.json()
    },
  },
}
