"""
hotspot_detection.py
Runs DBSCAN geospatial clustering on cleaned violation data.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"
EPS_M = 80
MIN_SAMPLES = 8
EARTH_R = 6_371_000


def cluster(df: pd.DataFrame) -> pd.DataFrame:
    coords_rad = np.radians(df[["latitude", "longitude"]].values)
    db = DBSCAN(
        eps=EPS_M / EARTH_R,
        min_samples=MIN_SAMPLES,
        algorithm="ball_tree",
        metric="haversine",
        n_jobs=-1,
    )
    df = df.copy()
    df["cluster_id"] = db.fit_predict(coords_rad)
    n_clusters = len(set(db.labels_)) - (1 if -1 in db.labels_ else 0)
    noise = (db.labels_ == -1).sum()
    print(f"  DBSCAN → {n_clusters} clusters, {noise} noise points")
    return df


if __name__ == "__main__":
    cleaned = DATA_DIR / "processed/cleaned_parking_data.csv"
    df = pd.read_csv(cleaned, low_memory=False)
    df = cluster(df)
    df.to_csv(cleaned, index=False)
    print("Cluster IDs written back to cleaned_parking_data.csv")
