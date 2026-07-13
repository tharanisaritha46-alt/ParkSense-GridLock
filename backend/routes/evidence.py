import random
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from services.cv_detection import analyze_image as run_cv_analysis

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    hotspot_id: Optional[int] = Form(None, description="Cluster ID of the hotspot this photo was taken at, if known"),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    result = run_cv_analysis(contents, file.filename, hotspot_id=hotspot_id)
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
