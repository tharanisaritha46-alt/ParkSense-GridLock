"""
data_cleaning.py
Cleans and feature-engineers the raw PS1 parking dataset.
Run: python services/data_cleaning.py
"""
import ast
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SEVERITY_MAP = {
    "PARKING NEAR ROAD CROSSING": 5,
    "PARKING ON FOOTPATH": 4,
    "PARKING IN A MAIN ROAD": 4,
    "WRONG PARKING": 3,
    "NO PARKING": 3,
    "DEFECTIVE NUMBER PLATE": 2,
}


def parse_violations(s: str) -> str:
    try:
        lst = ast.literal_eval(s)
        return ", ".join(lst) if isinstance(lst, list) else str(s)
    except Exception:
        return str(s)


def compute_severity(viol_str: str) -> int:
    score = 0
    for k, v in SEVERITY_MAP.items():
        if k in str(viol_str):
            score = max(score, v)
    return score if score > 0 else 2


def clean(input_path: Path = DATA_DIR / "raw/ps1_dataset.csv",
          output_path: Path = DATA_DIR / "processed/cleaned_parking_data.csv") -> pd.DataFrame:
    print(f"Loading {input_path} ...")
    df = pd.read_csv(input_path, low_memory=False)
    print(f"  Raw shape: {df.shape}")

    # Coordinates
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df = df.dropna(subset=["latitude", "longitude"])
    df = df[df["latitude"].between(12.8, 13.2) & df["longitude"].between(77.4, 77.9)]

    # Datetimes
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], utc=True, errors="coerce")
    df["hour"] = df["created_datetime"].dt.hour
    df["day_of_week"] = df["created_datetime"].dt.day_name()
    df["month"] = df["created_datetime"].dt.month_name()
    df["date"] = df["created_datetime"].dt.date
    df["is_peak"] = df["hour"].isin([7, 8, 9, 17, 18, 19, 20]).astype(int)

    # Violations
    df["violation_label"] = df["violation_type"].apply(parse_violations)
    df["severity_score"] = df["violation_label"].apply(compute_severity)
    df["near_junction"] = (df["junction_name"] != "No Junction").astype(int)

    print(f"  Clean shape: {df.shape}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"  Saved → {output_path}")
    return df


if __name__ == "__main__":
    clean()
