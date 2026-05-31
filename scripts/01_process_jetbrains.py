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


AI_TOOLS = {
    2023: {
        "ChatGPT": "ai_tools_experience::ChatGPT",
        "GitHub Copilot": "ai_tools_experience::GitHub Copilot",
        "Tabnine": "ai_tools_experience::Tabnine",
        "Codeium": "ai_tools_experience::Codeium",
    },
    2024: {
        "ChatGPT": "trial_ai_coding::ChatGPT",
        "GitHub Copilot": "trial_ai_coding::GitHub Copilot",
        "Cursor": "trial_ai_coding::Cursor",
        "Claude": "trial_ai_coding::Anthropic Claude",
        "Gemini": "trial_ai_coding::Google Gemini (previously Bard)",
    },
    2025: {
        "ChatGPT": "usage_ai_coding::ChatGPT web / desktop / mobile apps (not inside third-party tools)",
        "GitHub Copilot": "usage_ai_coding::GitHub Copilot",
        "Cursor": "usage_ai_coding::Cursor",
        "Claude": "usage_ai_coding::Anthropic Claude web / desktop / mobile apps (not inside third-party tools)",
        "DeepSeek": "usage_ai_coding::DeepSeek apps or self-hosted / locally installed (not inside third-party tools)",
        "Windsurf": "usage_ai_coding::Windsurf",
    },
}


def build_adoption_by_year():
    """Build AI tool adoption % per year → docs/data/adoption_by_year.json."""
    data = []
    for year in [2020, 2021, 2022, 2023, 2024, 2025]:
        if year not in AI_TOOLS:
            data.append({"year": year, "any_ai_pct": 0, "tools": {}})
            continue
        cfg = YEAR_CONFIG[year]
        tool_cols = list(AI_TOOLS[year].values())
        # Load only the relevant columns
        df = pd.read_csv(cfg["file"], usecols=tool_cols, low_memory=False)
        # any_ai_pct: rows where at least one AI column is non-null
        any_ai = df.notna().any(axis=1).mean() * 100
        tools = {}
        for tool_name, col in AI_TOOLS[year].items():
            tools[tool_name] = round(df[col].notna().mean() * 100, 2)
        data.append({"year": year, "any_ai_pct": round(any_ai, 2), "tools": tools})
    with open(OUT / "adoption_by_year.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"adoption_by_year.json: {len(data)} records")


def build_gender_adoption():
    """Build gender vs AI adoption dimensions → docs/data/gender_adoption.json."""
    cfg25 = YEAR_CONFIG[2025]
    GENDERS = ["Male", "Female", "Non-binary, genderqueer, or gender non-conforming"]
    EMOTIONS = ["Hopeful", "Excited", "Uncertain", "Anxious", "Fearful"]
    data = []

    # Load 2025 full dataset needed columns
    ai_cols_25 = list(AI_TOOLS[2025].values())
    cols_needed = ["gender", "emotions_about_ai_society", "activities_kinds::AI engineering"] + ai_cols_25
    df25 = pd.read_csv(cfg25["file"], usecols=cols_needed, low_memory=False)
    df25 = df25[df25["gender"].isin(GENDERS)]

    # 1. tool_adoption
    for gender in GENDERS:
        gdf = df25[df25["gender"] == gender]
        n = len(gdf)
        if n < 30:
            continue
        for tool_name, col in AI_TOOLS[2025].items():
            pct = round(gdf[col].notna().mean() * 100, 2)
            data.append({"dimension": "tool_adoption", "gender": gender, "tool": tool_name, "pct": pct, "n": n})

    # 2. emotion
    for gender in GENDERS:
        gdf = df25[df25["gender"] == gender]
        n = len(gdf)
        if n < 30:
            continue
        for emotion in EMOTIONS:
            emo_pct = round((gdf["emotions_about_ai_society"] == emotion).mean() * 100, 2)
            data.append({"dimension": "emotion", "gender": gender, "emotion": emotion, "pct": emo_pct, "n": n})

    # 3. ai_engineering_role
    for gender in GENDERS:
        gdf = df25[df25["gender"] == gender]
        n = len(gdf)
        if n < 30:
            continue
        pct = round(gdf["activities_kinds::AI engineering"].notna().mean() * 100, 2)
        data.append({"dimension": "ai_engineering_role", "gender": gender, "pct": pct, "n": n})

    # 4. salary_group — 2022 and 2023, Male and Female only
    for year in [2022, 2023]:
        cfg = YEAR_CONFIG[year]
        df_sal = pd.read_csv(cfg["file"], usecols=["gender", "salary_group"], low_memory=False)
        df_sal = df_sal[df_sal["gender"].isin(["Male", "Female"])]
        for gender in ["Male", "Female"]:
            gdf = df_sal[df_sal["gender"] == gender]
            n = len(gdf)
            if n < 30:
                continue
            total = len(gdf)
            for salary_level, cnt in gdf["salary_group"].value_counts().items():
                pct = round(cnt / total * 100, 2)
                data.append({
                    "dimension": "salary_group",
                    "year": year,
                    "gender": gender,
                    "salary_level": salary_level,
                    "pct": pct,
                    "n": n,
                })

    with open(OUT / "gender_adoption.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"gender_adoption.json: {len(data)} records")


def build_sentiment_by_experience():
    """Build emotion distribution by coding experience → docs/data/sentiment_by_experience.json."""
    cfg25 = YEAR_CONFIG[2025]
    EMOTIONS = ["Hopeful", "Excited", "Uncertain", "Anxious", "Fearful"]
    df = pd.read_csv(cfg25["file"], usecols=["code_yrs", "emotions_about_ai_society"], low_memory=False)
    df = df.dropna(subset=["code_yrs", "emotions_about_ai_society"])
    data = []
    for band, gdf in df.groupby("code_yrs"):
        n = len(gdf)
        if n < 30:
            continue
        for emotion in EMOTIONS:
            pct = round((gdf["emotions_about_ai_society"] == emotion).mean() * 100, 2)
            data.append({"code_yrs": band, "emotion": emotion, "pct": pct, "n": n})
    with open(OUT / "sentiment_by_experience.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"sentiment_by_experience.json: {len(data)} records")


def build_adoption_by_country():
    """Build AI adoption % by country (2025) → docs/data/adoption_by_country.json."""
    cfg25 = YEAR_CONFIG[2025]
    df_full = pd.read_csv(cfg25["file"], low_memory=False)
    ai_cols = [c for c in df_full.columns if c.startswith("usage_ai_coding::") and c != "usage_ai_coding::None"]
    df = df_full[["country"] + ai_cols].copy()
    data = []
    for country, gdf in df.groupby("country"):
        n = len(gdf)
        if n < 20:
            continue
        adoption_pct = round(gdf[ai_cols].notna().any(axis=1).mean() * 100, 2)
        data.append({"country": country, "adoption_pct": adoption_pct, "n": n})
    data.sort(key=lambda x: -x["adoption_pct"])
    with open(OUT / "adoption_by_country.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"adoption_by_country.json: {len(data)} countries")


def build_streamgraph_langs():
    """Build language usage over time for streamgraph → docs/data/streamgraph_langs.json."""
    TOP8 = TOP_LANGS[:8]  # Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust
    data = []
    for year, cfg in YEAR_CONFIG.items():
        pcts = load_proglang_pct(cfg["file"], cfg["proglang_sep"], langs=TOP8)
        for lang in TOP8:
            pct = pcts.get(lang)
            if pct is not None:
                data.append({"year": year, "language": lang, "pct": pct})
    with open(OUT / "streamgraph_langs.json", "w") as f:
        json.dump(data, f)
        f.write("\n")
    print(f"streamgraph_langs.json: {len(data)} records")


build_languages_ranking()
build_dev_profile()
build_adoption_by_year()
build_gender_adoption()
build_sentiment_by_experience()
build_adoption_by_country()
build_streamgraph_langs()
