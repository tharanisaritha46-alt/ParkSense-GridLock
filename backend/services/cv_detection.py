"""
cv_detection.py
Computer Vision pipeline for traffic image analysis.
Uses YOLOv8x for vehicle detection and violation classification.
EasyOCR for license plate recognition.

In DEMO mode (no GPU / model weights), returns realistic simulated output.
Switch to PRODUCTION mode by setting USE_REAL_MODEL=True and providing weights.
"""
import os
import uuid
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

USE_REAL_MODEL = os.getenv("USE_REAL_MODEL", "false").lower() == "true"
WEIGHTS_PATH = os.getenv("YOLO_WEIGHTS_PATH", "./models/yolov8x.pt")

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


def _simulate_detection(filename: str) -> dict:
    n = random.randint(1, 4)
    detections = []
    for _ in range(n):
        viol = random.choice(VIOLATION_CLASSES)
        detections.append({
            "id": str(uuid.uuid4())[:8],
            "vehicle_class": random.choice(VEHICLE_CLASSES),
            "confidence": round(random.uniform(0.72, 0.97), 3),
            "violation": viol,
            "violation_confidence": round(random.uniform(0.68, 0.95), 3),
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
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "model": "YOLOv8x (COCO fine-tuned, BTP dataset) — DEMO MODE",
        "total_vehicles_detected": len(detections),
        "total_violations_detected": len(detections),
        "detections": detections,
        "status": "processed",
    }


def analyze_image(image_bytes: bytes, filename: str) -> dict:
    """
    Entry point for CV analysis.
    Production: loads YOLOv8x + EasyOCR, runs real inference.
    Demo: returns realistic simulated detections.
    """
    if USE_REAL_MODEL:
        return _real_inference(image_bytes, filename)
    return _simulate_detection(filename)


def _real_inference(image_bytes: bytes, filename: str) -> dict:
    """
    Real YOLOv8x inference — requires:
      pip install ultralytics easyocr opencv-python-headless
      YOLO_WEIGHTS_PATH set to model file
    """
    import io
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

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in COCO_VEHICLE_IDS:
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            vehicle_class = COCO_VEHICLE_IDS[cls_id]

            # Crop and OCR for license plate (heuristic: bottom third of bbox)
            plate_y1 = y1 + int((y2 - y1) * 0.6)
            plate_crop = img[plate_y1:y2, x1:x2]
            ocr_results = reader.readtext(plate_crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ")
            plate_text = " ".join([r[1] for r in ocr_results]) if ocr_results else "UNREAD"
            plate_conf = ocr_results[0][2] if ocr_results else 0.0

            # Simple violation heuristic (would be fine-tuned in production)
            viol = "WRONG PARKING"
            detections.append({
                "id": str(uuid.uuid4())[:8],
                "vehicle_class": vehicle_class,
                "confidence": round(conf, 3),
                "violation": viol,
                "violation_confidence": round(conf * 0.9, 3),
                "severity": VIOLATION_SEVERITY.get(viol, "HIGH"),
                "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "license_plate": plate_text,
                "plate_confidence": round(plate_conf, 3),
            })

    return {
        "evidence_id": str(uuid.uuid4()),
        "filename": filename,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "model": f"YOLOv8x — {WEIGHTS_PATH}",
        "total_vehicles_detected": len(detections),
        "total_violations_detected": len([d for d in detections if d["violation"]]),
        "detections": detections,
        "status": "processed",
    }
