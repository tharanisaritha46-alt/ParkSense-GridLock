# Methodology — ParkSense GridLock

## 1. Data Cleaning

### Input
Raw PS1 dataset: 298,450 rows, 24 columns.

### Steps
1. **Coordinate validation** — drop rows where latitude or longitude is null or outside Bengaluru bounding box (Lat 12.80–13.20, Lon 77.40–77.90). Removes ~0.3% erroneous records.
2. **Datetime parsing** — convert `created_datetime` to UTC-aware pandas Timestamp; extract hour, day_of_week, month, date.
3. **Violation label parsing** — `violation_type` is stored as JSON array strings. Use `ast.literal_eval` to parse; join multiple violations with `, `.
4. **Severity scoring** — assign each violation a severity score 1–5 based on traffic impact (see table below).
5. **Feature engineering** — binary flag for peak hours (7–9, 17–20), junction proximity flag (junction_name ≠ 'No Junction').

### Severity Score Table
| Violation | Score |
|---|---|
| Parking near road crossing | 5 |
| Parking on footpath | 4 |
| Parking in main road | 4 |
| Wrong parking | 3 |
| No parking | 3 |
| Defective number plate | 2 |
| Other | 2 |

---

## 2. DBSCAN Clustering

### Why Geospatial DBSCAN
Parking violations cluster along roads, near markets, and at transit hubs — not in uniform spherical blobs. DBSCAN handles:
- Arbitrary cluster shapes (road-following density)
- Unknown number of clusters
- Natural noise separation (isolated incidents)

### Implementation
```python
from sklearn.cluster import DBSCAN
import numpy as np

coords_rad = np.radians(df[['latitude','longitude']].values)
R = 6_371_000  # Earth radius, metres
eps = 80 / R   # 80m in radians

db = DBSCAN(eps=eps, min_samples=8,
            algorithm='ball_tree', metric='haversine')
df['cluster_id'] = db.fit_predict(coords_rad)
```

### Parameter Selection
- **ε = 80m**: One typical city block in Bengaluru (~80–100m). Violations within one block are part of the same enforcement zone.
- **min_samples = 8**: At least 8 distinct incidents needed to form an actionable hotspot. Prevents over-fragmenting low-activity areas.

### Results
- **725 clusters** (enforcement zones)
- **4,373 noise points** (isolated incidents — flagged but not hotspots)
- Cluster sizes range from 8 violations (minimum) to 1,832 (Byatarayanapura mega-cluster)

---

## 3. Congestion Impact Score

### Formula
```
score = (
    0.35 × min(n / 100, 1)                          # Volume
  + 0.25 × avg_severity / 5                          # Severity
  + 0.20 × junction_proximity_rate                   # Junction proximity
  + 0.10 × min(unique_vehicle_types / 6, 1)          # Vehicle diversity
  + 0.10 × peak_hour_rate                            # Peak hour concentration
) × 100
```

### Weight Rationale
| Factor | Weight | Rationale |
|---|---|---|
| Volume | 35% | More violations = more blocking vehicles = more congestion |
| Severity | 25% | Main road / road crossing violations block more carriageway |
| Junction proximity | 20% | Named junctions are the highest-impact blocking points |
| Vehicle diversity | 10% | Mixed vehicle types indicate commercial/transit choke points |
| Peak hour share | 10% | Violations during rush hours have 2–3× congestion multiplier |

### Score Calibration
Scores are bounded to [0, 100] by capping each factor at its maximum (e.g., volume saturates at 100 violations per cluster — larger clusters don't get unbounded credit).

---

## 4. Enforcement Ranking

Top 20 zones by congestion score receive:
- **Recommended team size:** CRITICAL = 3 teams, HIGH = 2, MEDIUM/LOW = 1
- **Patrol window:** ±1 hour around cluster's modal peak hour
- **Action type:** CRITICAL → Tow + Fine + CCTV Alert; HIGH → Fine + Patrol; MEDIUM → Warning + Fine; LOW → Warning

---

## 5. Computer Vision Pipeline (PS3 Integration)

### Architecture
```
Input Image
    ↓
Preprocessing (CLAHE, noise reduction, resize to 640×640)
    ↓
YOLOv8x Inference (vehicle detection, class + bbox + confidence)
    ↓
Spatial Violation Analysis (bbox position relative to road markings)
    ↓
EasyOCR on cropped license plate region
    ↓
Evidence JSON (detections, plate, confidence, annotated image path)
```

### Model Details
- Base: YOLOv8x pre-trained on COCO (80 classes, 640px input)
- Fine-tune target: BTP traffic dataset with Bengaluru road conditions
- Target violations: Wrong parking, No parking, Footpath parking, Road crossing parking, Main road parking
- OCR: EasyOCR with English + Devanagari for Karnataka plates (KA-XX-XXXX format)

### Performance Targets
| Metric | Target |
|---|---|
| mAP@50 | ≥ 0.85 |
| Precision | ≥ 0.88 |
| Recall | ≥ 0.82 |
| Inference time | < 120ms per frame (T4 GPU) |
| Plate OCR accuracy | ≥ 78% |
