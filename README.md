# 🅿 ParkSense GridLock

> **AI-Driven Parking Violation Intelligence for Bengaluru Traffic Police**
> Problem Statement 1 — BTP Hackathon 2024

---

## What This Is

ParkSense GridLock is a full-stack AI system that ingests real Bengaluru parking violation data (298,450 records, Nov 2023–Apr 2024), clusters it into enforceable hotspot zones, scores each zone's congestion impact, and recommends targeted patrol deployment — all surfaced through a live operations dashboard.

It integrates PS3's computer vision pipeline so that field officers can also upload traffic images for automatic violation detection and license plate extraction.

---

## The Problem We're Solving

On-street illegal parking and spillover near commercial areas, metro stations, and junctions chokes carriageways across Bengaluru. Enforcement today is:

- **Patrol-based and reactive** — no predictive intelligence
- **Blind to impact** — no heatmap linking violations to congestion severity
- **Impossible to prioritise** — officers don't know where to go first

ParkSense GridLock changes that.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   DATA PIPELINE                         │
│  ps1_dataset.csv → Clean → DBSCAN Cluster → Score      │
│  (298K records)    pandas   ε=80m, n=8    congestion_   │
│                             → 725 clusters  score/100   │
└───────────────────────┬─────────────────────────────────┘
                        │ JSON artifacts
┌───────────────────────▼─────────────────────────────────┐
│                   FASTAPI BACKEND                        │
│  /api/hotspots  /api/analytics  /api/enforcement        │
│  /api/evidence  — serves pre-computed + live analysis   │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│                   REACT DASHBOARD                        │
│  Dashboard · Hotspot Map · Analytics · CV Evidence      │
│  Enforcement Plan — Leaflet map, Recharts, live upload  │
└─────────────────────────────────────────────────────────┘
                        │ (optional)
┌───────────────────────▼─────────────────────────────────┐
│                   CV PIPELINE (PS3+)                    │
│  YOLOv8x → Vehicle detect → Violation classify          │
│  EasyOCR → License plate → Evidence store               │
└─────────────────────────────────────────────────────────┘
```

---

## Congestion Impact Score

Each cluster is scored 0–100 using a weighted formula:

| Factor | Weight | Signal |
|---|---|---|
| Violation volume | 35% | Raw count of incidents in cluster |
| Severity score | 25% | Gravity of violation types |
| Junction proximity | 20% | % of violations near named junctions |
| Vehicle diversity | 10% | Mix of vehicle categories |
| Peak-hour share | 10% | % of violations in 7–9 AM / 5–8 PM |

Tiers: **CRITICAL** (≥80) · **HIGH** (60–79) · **MEDIUM** (40–59) · **LOW** (<40)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data pipeline | Python 3.11, pandas, NumPy, scikit-learn DBSCAN |
| Backend API | FastAPI, Uvicorn |
| Frontend | React 18, Vite, Recharts, Leaflet / react-leaflet |
| Map tiles | CartoDB Dark Matter |
| CV pipeline | YOLOv8x (Ultralytics), EasyOCR, OpenCV |
| Type system | Space Grotesk + JetBrains Mono |

---

## Dataset

- **Source:** Bengaluru Traffic Police parking violation database (PS1 dataset FGLH)
- **Records:** 298,450 violations
- **Period:** November 2023 – April 2024
- **Fields used:** lat/lon, vehicle type, violation type, junction name, police station, created timestamp

---

## Quickstart

### Backend
```bash
pip install -r requirements.txt

# Run data pipeline (generates JSON artifacts)
cd backend
python services/data_cleaning.py

# Start API server
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Production build
```bash
cd frontend && npm run build   # outputs to dist/
```

---

## Key Results

- **725 hotspot clusters** identified across Bengaluru with DBSCAN (ε=80m, min_samples=8)
- **Top zones:** Jayanagara, Madiwala, Chamarajpet, Halasuru Gate (score >84)
- **Peak enforcement windows:** 07:00–09:00 and 17:00–20:00
- **Dominant violators:** Scooters (32%), Cars (30%), Motorcycles (14%)
- **Most congestion-inducing violation:** Parking near road crossings (severity 5/5)

---

## Project Structure

```
parksense-gridlock/
├── data/
│   ├── raw/              # Original PS1 dataset
│   └── processed/        # Cleaned, scored data
├── backend/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Tuning parameters
│   ├── routes/           # API endpoints
│   ├── services/         # Data pipeline modules
│   └── outputs/          # Pre-computed JSON artifacts
├── frontend/
│   └── src/
│       ├── pages/        # Dashboard, Hotspots, Analytics, Evidence, Enforcement
│       ├── components/   # Reusable UI components
│       ├── api/          # API client
│       └── styles/       # Design system CSS
├── notebooks/            # EDA and methodology notebooks
├── docs/                 # Architecture, methodology, final report
└── screenshots/          # Dashboard screenshots
```

---

## Team

Built for the **Bengaluru Traffic Police AI Hackathon 2024** — Problem Statement 1 (Parking-Induced Congestion) with integrated PS3 (Computer Vision) features.

---

*ParkSense GridLock — because every blocked junction has a pattern.*
