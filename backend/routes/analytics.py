import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"


def load_analytics():
    with open(OUTPUTS / "analytics.json") as f:
        return json.load(f)


@router.get("/")
async def get_analytics():
    return load_analytics()


@router.get("/kpis")
async def get_kpis():
    data = load_analytics()
    return {
        "total_violations": data["total_violations"],
        "total_clusters": data["total_clusters"],
        "critical_zones": data["critical_zones"],
        "high_zones": data["high_zones"],
    }


@router.get("/hourly")
async def get_hourly():
    data = load_analytics()
    hourly = data["hourly_distribution"]
    return [{"hour": int(h), "count": int(v)} for h, v in sorted(hourly.items(), key=lambda x: int(x[0]))]


@router.get("/vehicles")
async def get_vehicles():
    data = load_analytics()
    return [{"vehicle_type": k, "count": v} for k, v in data["vehicle_breakdown"].items()]


@router.get("/violations")
async def get_violations():
    data = load_analytics()
    return [{"violation": k, "count": v} for k, v in data["violation_types"].items()]


@router.get("/trend")
async def get_trend():
    data = load_analytics()
    return data["daily_trend"]


@router.get("/stations")
async def get_stations():
    data = load_analytics()
    return [{"station": k, "count": v} for k, v in data["top_police_stations"].items()]
