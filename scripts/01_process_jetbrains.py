# scripts/01_process_jetbrains.py
import pandas as pd
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "docs/data"
OUT.mkdir(parents=True, exist_ok=True)

# Configuration per year: proglang separator and available AI columns
YEAR_CONFIG = {
    2020: {"file": str(ROOT / "data/raw/2020_sharing_data_outside.csv"),
           "proglang_sep": ".", "job_role_sep": ".", "has_gender": False, "ai_col": None},
    2021: {"file": str(ROOT / "data/raw/2021_sharing_data_outside.csv"),
           "proglang_sep": ".", "job_role_sep": ".", "has_gender": True, "ai_col": None},
    2022: {"file": str(ROOT / "data/raw/DevEcosystem_2022_sharing_data.csv"),
           "proglang_sep": ".", "job_role_sep": ".", "has_gender": True, "ai_col": None,
           "salary_col": "salary_group"},
    2023: {"file": str(ROOT / "data/raw/2023_sharing_data_outside.csv"),
           "proglang_sep": "::", "job_role_sep": "::", "has_gender": True, "ai_col": "ai_tools_experience",
           "salary_col": "salary_group"},
    2024: {"file": str(ROOT / "data/raw/2024_sharing_data_outside.csv"),
           "proglang_sep": "::", "job_role_sep": "::", "has_gender": True, "ai_col": "trial_ai_coding"},
    2025: {"file": str(ROOT / "data/raw/developer_ecosystem_2025_external.csv"),
           "proglang_sep": "::", "job_role_sep": "::", "has_gender": True, "ai_col": "usage_ai_coding"},
}

TOP_LANGS = ["Python", "JavaScript", "TypeScript", "Java", "C#", "C++",
             "Go", "Rust", "PHP", "Kotlin"]


def load_proglang_pct(path, sep, langs=TOP_LANGS):
    """Returns dict {lang: pct_usage} for a given CSV."""
    df = pd.read_csv(path, low_memory=False)
    result = {}
    for lang in langs:
        col = f"proglang{sep}{lang}"
        if col in df.columns:
            result[lang] = round(df[col].notna().mean() * 100, 2)
        else:
            result[lang] = None
    return result


def build_languages_ranking():
    data = []
    for year, cfg in YEAR_CONFIG.items():
        pcts = load_proglang_pct(cfg["file"], cfg["proglang_sep"])
        for lang, pct in pcts.items():
            if pct is not None:
                data.append({"year": year, "language": lang, "pct": pct})
    with open(OUT / "languages_ranking.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"languages_ranking.json: {len(data)} records")


def build_dev_profile():
    """Dev profile pre-AI: role distribution and experience for 2020-2022."""
    roles = []
    experience = []
    for year in [2020, 2021, 2022]:
        cfg = YEAR_CONFIG[year]
        df = pd.read_csv(cfg["file"], low_memory=False)
        sep = cfg["job_role_sep"]
        # Roles — find job_role columns
        role_prefix = f"job_role{sep}"
        role_cols = [c for c in df.columns if c.startswith(role_prefix)]
        # Fallback: 2020 may use a slightly different prefix
        if not role_cols:
            role_cols = [c for c in df.columns if c.lower().startswith("job_role")]
            role_prefix = "job_role."
        for col in role_cols:
            role_name = col.replace(role_prefix, "")
            pct = round(df[col].notna().mean() * 100, 2)
            if pct > 0:  # Skip roles with 0%
                roles.append({"year": year, "role": role_name, "pct": pct})
        # Experience (code_yrs if exists)
        if "code_yrs" in df.columns:
            exp_dist = df["code_yrs"].value_counts(normalize=True).to_dict()
            for band, pct in exp_dist.items():
                experience.append({"year": year, "band": band, "pct": round(pct * 100, 2)})
    with open(OUT / "job_roles.json", "w") as f:
        json.dump(roles, f)
        f.write("\n")
    print(f"job_roles.json: {len(roles)} records")
    with open(OUT / "experience.json", "w") as f:
        json.dump(experience, f)
        f.write("\n")
    print(f"experience.json: {len(experience)} records")


build_languages_ranking()
build_dev_profile()
