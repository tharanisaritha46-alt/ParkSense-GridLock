import json
from pathlib import Path
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()
OUTPUTS = Path(__file__).parent.parent / "outputs"


def load_plan():
    with open(OUTPUTS / "enforcement_plan.json") as f:
        return json.load(f)


@router.get("/plan")
async def get_enforcement_plan(limit: int = Query(20, ge=1, le=50)):
    plan = load_plan()
    return {"total": len(plan), "plan": plan[:limit]}


@router.get("/priority")
async def priority_zones():
    plan = load_plan()
    critical = [p for p in plan if p["severity_tier"] == "CRITICAL"]
    return {
        "critical_count": len(critical),
        "zones": critical,
        "total_patrols_needed": sum(p["recommended_patrols"] for p in critical),
    }
