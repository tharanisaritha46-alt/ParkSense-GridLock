import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"


def load_analytics():
    path = OUTPUTS / "analytics.json"
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"analytics.json not found at {path}")
    with open(path) as f:
        return json.load(f)


@router.get("/")
async def get_analytics():
    return load_analytics()


@router.get("/kpis")
async def get_kpis():
    data = load_analytics()
    return {
        "total_violations": data.get("total_violations", 0),
        "total_clusters": data.get("total_clusters", 0),
        "critical_zones": data.get("critical_zones", 0),
        "high_zones": data.get("high_zones", 0),
    }


@router.get("/hourly")
async def get_hourly():
    data = load_analytics()
    hourly = data.get("hourly_distribution", {})
    result = []
    for h, v in hourly.items():
        try:
            result.append({"hour": int(float(h)), "count": int(v)})
        except (ValueError, TypeError):
            continue
    return sorted(result, key=lambda x: x["hour"])


@router.get("/vehicles")
async def get_vehicles():
    data = load_analytics()
    breakdown = data.get("vehicle_breakdown", {})
    return sorted(
        [{"vehicle_type": k, "count": int(v)} for k, v in breakdown.items()],
        key=lambda x: x["count"], reverse=True
    )


@router.get("/violations")
async def get_violations():
    data = load_analytics()
    types = data.get("violation_types", {})
    return sorted(
        [{"violation": k, "count": int(v)} for k, v in types.items()],
        key=lambda x: x["count"], reverse=True
    )


@router.get("/trend")
async def get_trend():
    data = load_analytics()
    return data.get("daily_trend", [])


@router.get("/stations")
async def get_stations():
    data = load_analytics()
    stations = data.get("top_police_stations", {})
    return sorted(
        [{"station": k, "count": int(v)} for k, v in stations.items()],
        key=lambda x: x["count"], reverse=True
    )
