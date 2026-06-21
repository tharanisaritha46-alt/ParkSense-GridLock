import json
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"

# Simulated CV detection results (representative of real YOLOv8 output)
VEHICLE_CLASSES = ["car", "motorcycle", "scooter", "truck", "bus", "auto-rickshaw"]
VIOLATION_CLASSES = [
    "WRONG PARKING", "NO PARKING", "PARKING ON FOOTPATH",
    "PARKING NEAR ROAD CROSSING", "PARKING IN A MAIN ROAD"
]


def simulate_cv_detection(filename: str) -> dict:
    """
    Simulates YOLOv8-based detection results.
    In production, this calls the actual YOLO model on the uploaded image.
    """
    n_vehicles = random.randint(1, 4)
    detections = []
    for i in range(n_vehicles):
        viol = random.choice(VIOLATION_CLASSES)
        detections.append({
            "id": str(uuid.uuid4())[:8],
            "vehicle_class": random.choice(VEHICLE_CLASSES),
            "confidence": round(random.uniform(0.72, 0.97), 3),
            "violation": viol,
            "violation_confidence": round(random.uniform(0.68, 0.95), 3),
            "bbox": {
                "x1": random.randint(50, 200),
                "y1": random.randint(50, 150),
                "x2": random.randint(300, 600),
                "y2": random.randint(250, 450),
            },
            "license_plate": f"KA{random.randint(1,99):02d} {random.choice(['AA','BB','CC','MK','XX'])}{random.randint(1000,9999)}",
            "plate_confidence": round(random.uniform(0.65, 0.92), 3),
        })

    return {
        "evidence_id": str(uuid.uuid4()),
        "filename": filename,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "model": "YOLOv8x (COCO fine-tuned, BTP dataset)",
        "total_vehicles_detected": len(detections),
        "total_violations_detected": len([d for d in detections if d["violation"]]),
        "detections": detections,
        "annotated_image_url": f"/static/evidence/annotated_{filename}",
        "status": "processed",
    }


@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    result = simulate_cv_detection(file.filename)
    return result


@router.get("/samples")
async def get_sample_evidence():
    """Returns pre-processed sample evidence records for demo."""
    samples = []
    sample_violations = [
        ("Koramangala_18th_Main.jpg", "WRONG PARKING", "KA05 MK4729"),
        ("Madiwala_Market.jpg", "NO PARKING", "KA01 AA9283"),
        ("Frazer_Town_Coles_Rd.jpg", "NO PARKING", "KA04 BB1122"),
        ("Gandhi_Nagar_Main.jpg", "PARKING IN A MAIN ROAD", "KA03 CC5566"),
        ("Shivajinagar_Dispensary.jpg", "PARKING NEAR ROAD CROSSING", "KA02 XX7788"),
    ]
    for fname, viol, plate in sample_violations:
        samples.append({
            "evidence_id": str(uuid.uuid4())[:12],
            "filename": fname,
            "location": fname.replace("_", " ").replace(".jpg", ""),
            "violation": viol,
            "license_plate": plate,
            "confidence": round(random.uniform(0.82, 0.97), 3),
            "processed_at": "2024-03-15T08:30:00+00:00",
            "status": "processed",
        })
    return {"count": len(samples), "samples": samples}
