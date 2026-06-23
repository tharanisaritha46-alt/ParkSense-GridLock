---
title: ParkSense GridLock API
emoji: 🅿
colorFrom: yellow
colorTo: red
sdk: docker
pinned: false
app_port: 7860
---

# ParkSense GridLock — Backend API

FastAPI backend for the ParkSense GridLock parking intelligence system.

Built for BTP Hackathon 2026 — PS1 (Parking-Induced Congestion).

## Endpoints

- `GET /` — service info
- `GET /health` — health check
- `GET /api/hotspots/` — 725 DBSCAN hotspot clusters
- `GET /api/hotspots/summary` — tier counts + top 5
- `GET /api/analytics/kpis` — headline KPIs
- `GET /api/analytics/hourly` — 24h violation distribution
- `GET /api/analytics/trend` — daily volume time series
- `GET /api/enforcement/plan` — ranked patrol deployment plan
- `GET /api/evidence/samples` — sample CV evidence records
- `POST /api/evidence/analyze` — upload image for CV detection
- `GET /docs` — interactive API docs (Swagger UI)
