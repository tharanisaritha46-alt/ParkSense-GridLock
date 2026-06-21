# System Architecture — ParkSense GridLock

## Overview

Three-layer architecture: Data Pipeline → FastAPI Backend → React Dashboard.

```
┌────────────────────────────────────────────────────────────────┐
│  RAW DATA LAYER                                                │
│  ps1_dataset.csv (298,450 rows, 24 columns)                   │
│  Lat/Lon · Violation Type · Vehicle · Station · Timestamp     │
└───────────────────────────┬────────────────────────────────────┘
                            │ services/data_cleaning.py
┌───────────────────────────▼────────────────────────────────────┐
│  PROCESSING LAYER                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ data_cleaning│  │ hotspot_     │  │ congestion_scoring   │ │
│  │ .py          │→ │ detection.py │→ │ .py                  │ │
│  │ Clean/parse  │  │ DBSCAN       │  │ 5-factor weighted    │ │
│  │ Feature eng  │  │ ε=80m n=8   │  │ score 0–100          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                               │                │
│  ┌────────────────────────────────────────────▼─────────────┐  │
│  │ enforcement_ranking.py                                   │  │
│  │ Top 20 zones · patrol count · timing · action type       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  OUTPUTS:  hotspot_clusters.json  enforcement_plan.json       │
│            analytics.json                                     │
└───────────────────────────┬────────────────────────────────────┘
                            │ JSON artifacts
┌───────────────────────────▼────────────────────────────────────┐
│  API LAYER  (FastAPI + Uvicorn)                                │
│  GET  /api/hotspots/         → paginated cluster list          │
│  GET  /api/hotspots/summary  → tier counts + top 5            │
│  GET  /api/analytics/kpis    → 4 headline KPIs                │
│  GET  /api/analytics/hourly  → 24-hour violation distribution  │
│  GET  /api/analytics/trend   → daily volume time series        │
│  GET  /api/enforcement/plan  → ranked deployment plan          │
│  POST /api/evidence/analyze  → CV detection on uploaded image  │
└───────────────────────────┬────────────────────────────────────┘
                            │ REST / HTTP
┌───────────────────────────▼────────────────────────────────────┐
│  PRESENTATION LAYER  (React 18 + Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Dashboard    │  │ Hotspot Map  │  │ Analytics            │ │
│  │ KPI cards    │  │ Leaflet.js   │  │ Recharts             │ │
│  │ Mini charts  │  │ Cluster pins │  │ Hourly/vehicle/trend │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐│
│  │ CV Evidence  │  │ Enforcement Plan                         ││
│  │ Upload zone  │  │ Ranked patrol table                      ││
│  │ Detection UI │  │ Team allocation + windows                ││
│  └──────────────┘  └──────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. Officer uploads image OR dashboard loads pre-processed JSON
2. FastAPI reads from `backend/outputs/*.json` (< 50ms response)
3. React components render charts, map pins, tables
4. For CV: FastAPI receives multipart upload → runs YOLOv8x → returns detection JSON

## Design Decisions

**Why DBSCAN over K-means?**
Road-side violations form irregular density blobs that vary by location. K-means requires specifying K upfront and forces spherical clusters. DBSCAN discovers arbitrary shapes and naturally marks isolated incidents as noise.

**Why pre-compute JSON vs. query-time pandas?**
The pipeline runs once (or on a schedule). The API serves static JSON in microseconds. For a production system, this becomes a nightly Airflow job refreshing the artifacts.

**Why FastAPI over Flask/Django?**
Auto-generated OpenAPI docs, async support, Pydantic validation, and 3–5× throughput improvement over Flask for the same hardware.

**Why React + Leaflet instead of a BI tool like Grafana/Superset?**
Custom operational dashboard with integrated map, upload functionality, and precise design control. BI tools can't embed a real-time CV pipeline or serve a police operations UI with the required UX specificity.
