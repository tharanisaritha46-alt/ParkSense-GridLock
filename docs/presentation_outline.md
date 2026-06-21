# Presentation Outline — ParkSense GridLock

## Slide 1: The Problem (30 seconds)
- Bengaluru loses X hours/day to parking-induced congestion
- Enforcement is reactive — patrol officers go where they think, not where data says
- No system links violations to congestion impact
- Visual: photo of blocked junction / choked arterial road

## Slide 2: Our Approach (30 seconds)
- Three-word answer: Cluster → Score → Deploy
- 298,450 real violations → 725 hotspot zones → ranked enforcement plan
- Visual: before/after (scattered dots → clustered heatmap)

## Slide 3: The Data (30 seconds)
- PS1 dataset: 298K records, Nov 2023–Apr 2024, 54 police stations
- Key insight: 77% of violations are "Wrong Parking" or "No Parking" — not random, they're structurally caused by missing parking supply near commercial nodes
- Visual: pie chart of violation types + bar of vehicle types

## Slide 4: DBSCAN Hotspot Detection (45 seconds)
- Why DBSCAN: violations follow roads, not circles
- ε=80m (one block), min=8 incidents → 725 enforceable zones
- Live map demo on dashboard
- Visual: Leaflet map with colored cluster pins

## Slide 5: Congestion Impact Score (45 seconds)
- The key innovation: not just "how many violations" but "how much congestion"
- 5-factor formula: volume + severity + junction proximity + diversity + peak hours
- Junction proximity = the multiplier that separates a residential road from a KR Circle
- Visual: score breakdown chart for a sample cluster

## Slide 6: Enforcement Plan (30 seconds)
- Top 20 zones, recommended team count, patrol window, action type
- Example: Jayanagara (87.35) → 3 teams, 17:00–19:00, Tow + Fine + CCTV
- Visual: enforcement table from dashboard

## Slide 7: CV Evidence (PS3 integration) (45 seconds)
- Upload any traffic photo → auto-detect vehicles + violations + plate
- YOLOv8x pipeline: detect → classify → OCR → evidence record
- Turns every CCTV frame into structured data
- Live demo: upload image, show detection result

## Slide 8: Dashboard Demo (60 seconds)
- Walk through 5 pages: Dashboard → Map → Analytics → Evidence → Enforcement
- Show filter by tier/station on map
- Show hourly pattern chart (peak hours highlighted red)

## Slide 9: Results & Impact (30 seconds)
- 725 zones identified, top zone scores >87
- Top 20 zones = 34% of all violations — deploy 47 teams, resolve 100K+/yr
- Peak window identified: 07:00–09:00 and 17:00–20:00

## Slide 10: What's Next (30 seconds)
- Real-time integration with BTP camera network
- Speed sensor fusion (congestion proxy → actual delay minutes)
- Officer mobile app for field deployment
- Repeat offender tracking via VAHAN integration

## Slide 11: Q&A
- Have the dashboard open for live exploration
- Ready to drill into any specific station or cluster
