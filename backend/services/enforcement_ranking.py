"""
enforcement_ranking.py
Generates the top-N enforcement deployment plan from scored hotspots.
"""
import json
from pathlib import Path

OUTPUTS = Path(__file__).parent.parent / "outputs"

ACTION_MAP = {
    "CRITICAL": "Tow + Fine + CCTV Alert",
    "HIGH":     "Fine + Patrol",
    "MEDIUM":   "Warning + Fine",
    "LOW":      "Warning",
}

PATROL_MAP = {
    "CRITICAL": 3,
    "HIGH":     2,
    "MEDIUM":   1,
    "LOW":      1,
}


def build_plan(clusters: list[dict], top_n: int = 20) -> list[dict]:
    plan = []
    for c in clusters[:top_n]:
        h = c["peak_hour"]
        plan.append({
            **c,
            "recommended_patrols": PATROL_MAP[c["severity_tier"]],
            "patrol_timing": f"{h:02d}:00–{(h + 2) % 24:02d}:00",
            "action": ACTION_MAP[c["severity_tier"]],
        })
    return plan


if __name__ == "__main__":
    with open(OUTPUTS / "hotspot_clusters.json") as f:
        clusters = json.load(f)
    plan = build_plan(clusters)
    with open(OUTPUTS / "enforcement_plan.json", "w") as f:
        json.dump(plan, f, indent=2)
    print(f"Enforcement plan saved ({len(plan)} zones)")
