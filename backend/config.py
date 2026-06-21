from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
OUTPUTS_DIR = BASE_DIR / "outputs"

DBSCAN_EPS_M = 80
DBSCAN_MIN_SAMPLES = 8
EARTH_RADIUS_M = 6_371_000

CONGESTION_WEIGHTS = {
    "volume": 0.35,
    "severity": 0.25,
    "junction_proximity": 0.20,
    "vehicle_diversity": 0.10,
    "peak_hour": 0.10,
}

SEVERITY_MAP = {
    "PARKING NEAR ROAD CROSSING": 5,
    "PARKING ON FOOTPATH": 4,
    "PARKING IN A MAIN ROAD": 4,
    "WRONG PARKING": 3,
    "NO PARKING": 3,
    "DEFECTIVE NUMBER PLATE": 2,
}
