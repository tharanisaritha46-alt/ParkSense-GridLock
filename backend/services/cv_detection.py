"""
cv_detection.py
Computer Vision pipeline for traffic image analysis.
Uses YOLOv8 for vehicle detection. EasyOCR for license plate recognition.

IMPORTANT — honest scoping of what the CV model actually does:
YOLO (COCO-pretrained) tells you vehicle TYPE and location in frame. It does
NOT tell you whether parking is illegal — that requires either (a) a
geofenced no-parking zone the vehicle is checked against, or (b) known
context about where the photo was taken. Uploaded field photos have no
camera calibration, so we can't do (a) reliably. Instead, when the officer
tags the upload with the hotspot they're patrolling (hotspot_id), we use
that cluster's real historical dominant_violation from the 298K-record
pipeline as the violation classification — a stronger, honestly-labeled
signal than guessing from a single frame. Without a hotspot_id, violation
type is left unclassified rather than fabricated.

In DEMO mode (no GPU / model weights), returns realistic simulated output,
clearly labeled as such in every response.
Switch to PRODUCTION mode by setting USE_REAL_MODEL=true and providing weights.
"""
import os
import json
import uuid
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

USE_REAL_MODEL = os.getenv("USE_REAL_MODEL", "false").lower() == "true"
WEIGHTS_PATH = os.getenv("YOLO_WEIGHTS_PATH", "./models/yolov8n.pt")  # v8n: CPU-viable; swap to v8x only if GPU available
OUTPUTS_DIR = Path(__file__).parent.parent / "outputs"

VEHICLE_CLASSES = ["car", "motorcycle", "scooter", "truck", "bus", "auto-rickshaw"]
VIOLATION_CLASSES = [
    "WRONG PARKING",
    "NO PARKING",
    "PARKING ON FOOTPATH",
    "PARKING NEAR ROAD CROSSING",
    "PARKING IN A MAIN ROAD",
]
VIOLATION_SEVERITY = {
    "PARKING NEAR ROAD CROSSING": "CRITICAL",
    "PARKING ON FOOTPATH": "CRITICAL",
    "PARKING IN A MAIN ROAD": "HIGH",
    "WRONG PARKING": "HIGH",
    "NO PARKING": "MEDIUM",
}
KA_SUFFIXES = ["AA", "BB", "CC", "MK", "XX", "HH", "MM", "PE", "RE", "HK"]


def _fake_plate() -> str:
    dist = random.randint(1, 99)
    suffix = random.choice(KA_SUFFIXES)
    num = random.randint(1000, 9999)
    return f"KA{dist:02d} {suffix}{num}"


def _lookup_hotspot(hotspot_id: Optional[int]) -> Optional[dict]:
    """Look up a cluster's real historical data from the DBSCAN pipeline output."""
    if hotspot_id is None:
        return None
    path = OUTPUTS_DIR / "hotspot_clusters.json"
    if not path.exists():
        return None
    with open(path) as f:
        clusters = json.load(f)
    for c in clusters:
        if c.get("cluster_id") == hotspot_id:
            return c
    return None


def _simulate_detection(filename: str, hotspot_id: Optional[int] = None) -> dict:
    hotspot = _lookup_hotspot(hotspot_id)
    n = random.randint(1, 4)
    detections = []
    for _ in range(n):
        if hotspot:
            viol = hotspot["dominant_violation"]
            viol_source = "location_context"
            viol_conf = None  # not a CV-derived confidence; it's historical cluster data
        else:
            viol = random.choice(VIOLATION_CLASSES)
            viol_source = "simulated"
            viol_conf = round(random.uniform(0.68, 0.95), 3)
        detections.append({
            "id": str(uuid.uuid4())[:8],
            "vehicle_class": random.choice(VEHICLE_CLASSES),
            "confidence": round(random.uniform(0.72, 0.97), 3),
            "violation": viol,
            "violation_confidence": viol_conf,
            "violation_source": viol_source,
            "severity": VIOLATION_SEVERITY.get(viol, "MEDIUM"),
            "bbox": {
                "x1": random.randint(40, 180),
                "y1": random.randint(40, 120),
                "x2": random.randint(280, 580),
                "y2": random.randint(220, 420),
            },
            "license_plate": _fake_plate(),
            "plate_confidence": round(random.uniform(0.65, 0.92), 3),
        })
    return {
        "evidence_id": str(uuid.uuid4()),
        "filename": filename,
        "hotspot_id": hotspot_id,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "model": "YOLOv8 — DEMO MODE (simulated detections, not live inference)",
        "total_vehicles_detected": len(detections),
        "total_violations_detected": len(detections),
        "detections": detections,
        "status": "processed",
    }


def analyze_image(image_bytes: bytes, filename: str, hotspot_id: Optional[int] = None) -> dict:
    """
    Entry point for CV analysis.
    Production: loads YOLO + EasyOCR, runs real vehicle detection; violation
    type comes from hotspot_id context if provided (see module docstring).
    Demo: returns simulated detections, clearly labeled as such.
    """
    if USE_REAL_MODEL:
        return _real_inference(image_bytes, filename, hotspot_id)
    return _simulate_detection(filename, hotspot_id)


def _real_inference(image_bytes: bytes, filename: str, hotspot_id: Optional[int] = None) -> dict:
    """
    Real YOLO inference — requires:
      pip install ultralytics easyocr opencv-python-headless
      YOLO_WEIGHTS_PATH set to a model file (yolov8n.pt recommended for CPU deploys;
      yolov8x.pt is 68M params and will be slow/likely to time out on free-tier CPU hosting)
    """
    import cv2
    import numpy as np
    from ultralytics import YOLO
    import easyocr

    model = YOLO(WEIGHTS_PATH)
    reader = easyocr.Reader(["en"])

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(img, conf=0.35, iou=0.45, verbose=False)
    detections = []

    COCO_VEHICLE_IDS = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}
    hotspot = _lookup_hotspot(hotspot_id)

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in COCO_VEHICLE_IDS:
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            vehicle_class = COCO_VEHICLE_IDS[cls_id]

            # Crop and OCR for license plate (heuristic: bottom third of bbox —
            # a dedicated plate-detector step would improve this; see notes)
            plate_y1 = y1 + int((y2 - y1) * 0.6)
            plate_crop = img[plate_y1:y2, x1:x2]
            ocr_results = reader.readtext(plate_crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ")
            plate_text = " ".join([r[1] for r in ocr_results]) if ocr_results else "UNREAD"
            plate_conf = ocr_results[0][2] if ocr_results else 0.0

            # Violation type: only assign one if we have real location context.
            # We do NOT claim to visually classify legality from vehicle pixels alone.
            if hotspot:
                viol = hotspot["dominant_violation"]
                viol_source = "location_context"
                viol_conf = None
            else:
                viol = "UNCLASSIFIED — vehicle detected, no location context provided"
                viol_source = "none"
                viol_conf = None

            detections.append({
                "id": str(uuid.uuid4())[:8],
                "vehicle_class": vehicle_class,
                "confidence": round(conf, 3),
                "violation": viol,
                "violation_confidence": viol_conf,
                "violation_source": viol_source,
                "severity": VIOLATION_SEVERITY.get(viol, "UNKNOWN"),
                "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "license_plate": plate_text,
                "plate_confidence": round(plate_conf, 3),
            })

    return {
        "evidence_id": str(uuid.uuid4()),
        "filename": filename,
        "hotspot_id": hotspot_id,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "model": f"YOLO — {WEIGHTS_PATH}",
        "total_vehicles_detected": len(detections),
        "total_violations_detected": len([d for d in detections if d["violation_source"] == "location_context"]),
        "detections": detections,
        "status": "processed",
    }
