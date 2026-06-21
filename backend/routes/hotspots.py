import json
from pathlib import Path
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"


def load_clusters():
    with open(OUTPUTS / "hotspot_clusters.json") as f:
        return json.load(f)


@router.get("/")
async def get_hotspots(
    tier: Optional[str] = Query(None, description="CRITICAL | HIGH | MEDIUM | LOW"),
    station: Optional[str] = Query(None),
    min_score: float = Query(0, ge=0, le=100),
    limit: int = Query(100, ge=1, le=725),
    offset: int = Query(0, ge=0),
):
    clusters = load_clusters()
    if tier:
        clusters = [c for c in clusters if c["severity_tier"] == tier.upper()]
    if station:
        clusters = [c for c in clusters if station.lower() in c["police_station"].lower()]
    clusters = [c for c in clusters if c["congestion_score"] >= min_score]
    total = len(clusters)
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": clusters[offset : offset + limit],
    }


@router.get("/summary")
async def hotspot_summary():
    clusters = load_clusters()
    tiers = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for c in clusters:
        tiers[c["severity_tier"]] = tiers.get(c["severity_tier"], 0) + 1
    total_violations = sum(c["violation_count"] for c in clusters)
    return {
        "total_clusters": len(clusters),
        "tier_breakdown": tiers,
        "total_violations_in_clusters": total_violations,
        "top_5": sorted(clusters, key=lambda x: x["congestion_score"], reverse=True)[:5],
    }


@router.get("/{cluster_id}")
async def get_cluster(cluster_id: int):
    clusters = load_clusters()
    match = [c for c in clusters if c["cluster_id"] == cluster_id]
    if not match:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Cluster not found")
    return match[0]
