# scripts/02_process_lifearchitect.py
import pandas as pd
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "docs/data"

def load_lifearchitect():
    """Load CSV — row 0 is metadata, row 1 is the real headers."""
    df_raw = pd.read_csv(ROOT / "data/raw/LifeArchitect_Models.csv", header=None)
    headers = df_raw.iloc[1].tolist()
    df = df_raw.iloc[2:].copy()
    df.columns = headers
    df = df.reset_index(drop=True)
    return df

def parse_year_month(ann_str):
    """Extract year and month from strings like 'Nov/2022', 'Mar/2023', '2021'."""
    MONTHS = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,
              "Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12}
    if not isinstance(ann_str, str):
        return None, None
    m = re.match(r'([A-Za-z]+)/(\d{4})', ann_str.strip())
    if m:
        return int(m.group(2)), MONTHS.get(m.group(1).capitalize())
    m2 = re.match(r'(\d{4})', ann_str.strip())
    if m2:
        return int(m2.group(1)), None
    return None, None

def build_llm_timeline():
    df = load_lifearchitect()
    ann_col = "Announced\n▼"  # exact column name including newline

    OPEN_SOURCE_LABS = {
        "Meta AI", "Mistral", "DeepSeek-AI", "EleutherAI",
        "Stability AI", "01.AI", "Cohere", "xAI", "TII", "Falcon",
        "Allen Institute for AI", "BigScience", "BLOOM", "Cerebras",
    }

    records = []
    for _, row in df.iterrows():
        year, month = parse_year_month(str(row.get(ann_col, "")))
        if year is None or year < 2017 or year > 2026:
            continue
        # Parse params — remove commas, convert to float
        params_raw = str(row.get("Params\n(total, B)", "")).replace(",", "")
        params = pd.to_numeric(params_raw, errors="coerce")
        mmlu = pd.to_numeric(row.get("MMLU"), errors="coerce")
        lab = str(row.get("Lab", ""))
        open_source = lab in OPEN_SOURCE_LABS
        records.append({
            "model": str(row.get("Model", "")),
            "lab": lab,
            "year": year,
            "month": int(month) if month is not None else None,
            "params_b": float(params) if not pd.isna(params) else None,
            "mmlu": float(mmlu) if not pd.isna(mmlu) else None,
            "open_source": open_source,
        })

    with open(OUT / "llm_timeline.json", "w") as f:
        json.dump(records, f)
        f.write("\n")
    print(f"llm_timeline.json: {len(records)} models")
    by_year = {}
    for r in records:
        by_year[r["year"]] = by_year.get(r["year"], 0) + 1
    for y in sorted(by_year):
        print(f"  {y}: {by_year[y]} models")

build_llm_timeline()
