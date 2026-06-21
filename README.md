---
title: ParkSense GridLock API
emoji: 🅿
colorFrom: yellow
colorTo: red
sdk: docker
pinned: false
app_port: 7860
---

# 🅿 ParkSense GridLock

> **AI-Driven Parking Violation Intelligence for Bengaluru Traffic Police**
> Problem Statement 1 — BTP Hackathon 2024

## What This Is

ParkSense GridLock ingests 298,450 real Bengaluru parking violation records, clusters them into 725 enforceable hotspot zones using DBSCAN, scores each zone's congestion impact, and recommends targeted patrol deployment — all surfaced through a live React dashboard.

## Live URLs

- **Dashboard (Vercel):** _set after Vercel deploy_
- **API (HF Space):** this Space
- **API Docs:** `/docs`

## Tech Stack

| Layer | Technology |
|---|---|
| Data pipeline | Python 3.11, pandas, scikit-learn DBSCAN |
| Backend API | FastAPI, Uvicorn |
| Frontend | React 18, Vite, Recharts, Leaflet |
| CV pipeline | YOLOv8x, EasyOCR |
| Backend hosting | Hugging Face Spaces (Docker) |
| Frontend hosting | Vercel |

## Quickstart (local)

```bash
pip install -r requirements.txt
cd backend && uvicorn main:app --reload --port 8000

cd frontend && npm install && npm run dev
```

## Key Results

- **725 hotspot clusters** across Bengaluru (DBSCAN ε=80m)
- **Top zone:** Jayanagara — congestion score 87.35
- **Peak enforcement windows:** 07:00–09:00, 17:00–20:00
- **39 CRITICAL zones** requiring immediate tow + fine action

---
*BTP AI Hackathon 2024 — PS1 + PS3 integrated submission*
