"""
congestion_scoring.py
Computes per-cluster congestion impact scores.
"""
import json
import pandas as pd
import numpy as np
from pathlib import Path

OUTPUTS = Path(__file__).parent.parent / "outputs"
WEIGHTS = {
    "volume": 0.35,
    "severity": 0.25,
    "junction": 0.20,
    "diversity": 0.10,
    "peak": 0.10,
}


def score_cluster(grp: pd.DataFrame) -> float:
    n = len(grp)
    avg_sev = grp["severity_score"].mean() if "severity_score" in grp else 3.0
    junction_rate = grp["near_junction"].mean() if "near_junction" in grp else 0.0
    diversity = grp["vehicle_type"].nunique() if "vehicle_type" in grp.columns else 1
    peak_rate = grp["is_peak"].mean() if "is_peak" in grp.columns else 0.5

    return round((
        WEIGHTS["volume"]   * min(n / 100, 1) +
        WEIGHTS["severity"] * avg_sev / 5 +
        WEIGHTS["junction"] * junction_rate +
        WEIGHTS["diversity"] * min(diversity / 6, 1) +
        WEIGHTS["peak"]     * peak_rate
    ) * 100, 2)


def tier(score: float) -> str:
    if score >= 80: return "CRITICAL"
    if score >= 60: return "HIGH"
    if score >= 40: return "MEDIUM"
    return "LOW"


def build_cluster_records(df: pd.DataFrame) -> list[dict]:
    clustered = df[df["cluster_id"] >= 0]
    records = []
    for cid, grp in clustered.groupby("cluster_id"):
        lat_c = grp["latitude"].mean()
        lon_c = grp["longitude"].mean()
        radius = grp.apply(
            lambda r: ((r["latitude"] - lat_c) ** 2 + (r["longitude"] - lon_c) ** 2) ** 0.5 * 111_000, axis=1
        ).max()
        s = score_cluster(grp)
        records.append({
            "cluster_id": int(cid),
            "center_lat": round(lat_c, 6),
            "center_lon": round(lon_c, 6),
            "radius_m": round(radius, 1),
            "violation_count": int(len(grp)),
            "congestion_score": s,
            "severity_tier": tier(s),
            "police_station": grp["police_station"].mode()[0] if len(grp) > 0 else "Unknown",
            "peak_hour": int(grp["hour"].mode()[0]) if "hour" in grp.columns else 8,
            "top_vehicle": grp["vehicle_type"].mode()[0] if "vehicle_type" in grp.columns else "CAR",
            "dominant_violation": grp["violation_label"].mode()[0] if "violation_label" in grp.columns else "NO PARKING",
            "near_junction": grp["junction_name"].mode()[0] if "junction_name" in grp.columns else "No Junction",
            "avg_severity": round(grp["severity_score"].mean(), 2) if "severity_score" in grp.columns else 3.0,
        })
    return sorted(records, key=lambda x: x["congestion_score"], reverse=True)


if __name__ == "__main__":
    import sys
    csv_path = Path(__file__).parent.parent.parent / "data/processed/cleaned_parking_data.csv"
    df = pd.read_csv(csv_path, low_memory=False)
    records = build_cluster_records(df)
    OUTPUTS.mkdir(exist_ok=True)
    out = OUTPUTS / "hotspot_clusters.json"
    with open(out, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} clusters → {out}")
