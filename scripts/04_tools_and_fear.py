# scripts/04_tools_and_fear.py
# Genera dos datasets nuevos para reforzar la narrativa:
#   - tool_share_by_year.json : cuota de cada herramienta IA entre usuarios de IA, 2023-2025
#                               (la "caida de ChatGPT" + ascenso de Cursor/Claude)
#   - fear_by_experience.json : % que elige "seguridad del empleo" como su mayor
#                               preocupacion, segun anos de experiencia (el "miedo invertido")
import pandas as pd
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "docs/data"

# --- Configuracion de columnas multi-seleccion por ano ---
# Cada ano usa un prefijo distinto y nombres de herramienta distintos.
# NOTA: 2023 (ai_tools_experience) pregunta "que has PROBADO", no "que USAS"
# realmente, por eso ChatGPT sale al 99.8%. No es comparable con 2024-2025
# (uso real) y por honestidad lo dejamos fuera del grafico de evolucion.
YEAR_TOOLS = {
    2024: {"file": str(ROOT / "data/raw/2024_sharing_data_outside.csv"),
           "prefix": "trial_ai_coding"},
    2025: {"file": str(ROOT / "data/raw/developer_ecosystem_2025_external.csv"),
           "prefix": "usage_ai_coding"},
}

# Mapeo de herramientas canonicas -> lista de sufijos posibles por ano.
# Solo seguimos las herramientas con trayectoria comparable entre anos.
TOOL_ALIASES = {
    "ChatGPT": ["ChatGPT",
                "ChatGPT web / desktop / mobile apps (not inside third-party tools)"],
    "GitHub Copilot": ["GitHub Copilot"],
    "Claude": ["Anthropic Claude",
               "Anthropic Claude Code",
               "Anthropic Claude web / desktop / mobile apps (not inside third-party tools)"],
    "Cursor": ["Cursor"],
    "Gemini": ["Google Gemini (previously Bard)",
               "Google Gemini web / mobile apps (not inside third-party tools)",
               "Gemini Code Assist (previously Duet AI for Developers)",
               "Gemini in Android Studio"],
    "Tabnine": ["Tabnine"],
}

# Sufijos que NO son herramientas reales (para contar "usuarios de IA")
NON_TOOL = {"None", "Other"}


def tool_share_by_year():
    records = []
    for year, cfg in YEAR_TOOLS.items():
        all_cols = pd.read_csv(cfg["file"], nrows=0).columns.tolist()
        prefix = cfg["prefix"]
        tool_cols = [c for c in all_cols if c.startswith(prefix + "::")]
        if not tool_cols:
            continue
        df = pd.read_csv(cfg["file"], usecols=tool_cols, low_memory=False)

        # Usuarios de IA = quienes marcaron al menos una herramienta real
        real_cols = [c for c in tool_cols if c.split("::", 1)[1] not in NON_TOOL]
        is_user = df[real_cols].notna().any(axis=1)
        n_users = int(is_user.sum())
        if n_users == 0:
            continue

        for canon, aliases in TOOL_ALIASES.items():
            # columnas que existen este ano para esta herramienta canonica
            cols = [f"{prefix}::{a}" for a in aliases if f"{prefix}::{a}" in tool_cols]
            if not cols:
                continue
            # un dev "usa" la herramienta si marco cualquiera de sus variantes
            uses = df[cols].notna().any(axis=1) & is_user
            pct = round(uses.sum() / n_users * 100, 1)
            records.append({"year": year, "tool": canon, "share": pct, "n_users": n_users})

        print(f"{year}: {n_users} usuarios de IA")

    with open(OUT / "tool_share_by_year.json", "w") as f:
        json.dump(records, f, ensure_ascii=False)
        f.write("\n")
    print(f"tool_share_by_year.json: {len(records)} registros")


def fear_by_experience():
    f25 = str(ROOT / "data/raw/developer_ecosystem_2025_external.csv")
    df = pd.read_csv(f25, usecols=["concerns_ai_coding", "code_yrs"], low_memory=False)
    # base: quienes expresaron una preocupacion (pregunta de respuesta unica)
    sub = df.dropna(subset=["concerns_ai_coding"])
    JOB = "Job security and future job prospects"
    order = [
        ("I don't have professional coding experience", "Sin exp. profesional"),
        ("Less than 1 year", "< 1 año"),
        ("1–2 years", "1–2 años"),
        ("3–5 years", "3–5 años"),
        ("6–10 years", "6–10 años"),
        ("11–15 years", "11–15 años"),
        ("16+ years", "16+ años"),
    ]
    records = []
    for raw, label in order:
        g = sub[sub["code_yrs"] == raw]
        n = len(g)
        if n == 0:
            continue
        pct = round((g["concerns_ai_coding"] == JOB).mean() * 100, 1)
        records.append({"experience": label, "pct_job_fear": pct, "n": n})
    with open(OUT / "fear_by_experience.json", "w") as f:
        json.dump(records, f, ensure_ascii=False)
        f.write("\n")
    print(f"fear_by_experience.json: {len(records)} registros")


def ai_benefits():
    """H16: que valoran los devs de la IA. 'Menos tiempo buscando' (74.6%)
    es lo mas citado; 'Mejor calidad de codigo' (34.6%) es lo ULTIMO."""
    f25 = str(ROOT / "data/raw/developer_ecosystem_2025_external.csv")
    cols = [c for c in pd.read_csv(f25, nrows=0).columns
            if c.startswith("ai_benefits::")]
    df = pd.read_csv(f25, usecols=cols, low_memory=False)
    base = df.notna().any(axis=1).sum()
    LABELS = {
        "Less time spent searching for information": "Menos tiempo buscando información",
        "Increased productivity": "Mayor productividad",
        "Faster completion of repetitive tasks": "Tareas repetitivas más rápidas",
        "Faster coding and development": "Programar más rápido",
        "Faster learning of new technologies, frameworks, languages, etc.": "Aprender más rápido",
        "Less mental effort required for coding and development": "Menos esfuerzo mental",
        "Better coding and development experience": "Mejor experiencia de desarrollo",
        "Better quality of code and development solutions": "Mejor calidad del código",
    }
    records = []
    for c in cols:
        name = c.split("::", 1)[1]
        if name not in LABELS:
            continue
        pct = round(df[c].notna().sum() / base * 100, 1)
        records.append({"benefit": LABELS[name], "pct": pct})
    records.sort(key=lambda r: -r["pct"])
    with open(OUT / "ai_benefits.json", "w") as f:
        json.dump({"n": int(base), "items": records}, f, ensure_ascii=False)
        f.write("\n")
    print(f"ai_benefits.json: {len(records)} beneficios (n={int(base)})")


def oss_vs_commercial():
    """OBJ 2: cuanto pesa la IA open-source frente a la comercial.
    Clasifica las herramientas de 2025 en tres grupos y reparte a cada
    usuario de IA en su grupo 'mas comercial' (un dev puede usar varias)."""
    f25 = str(ROOT / "data/raw/developer_ecosystem_2025_external.csv")
    cols = [c for c in pd.read_csv(f25, nrows=0).columns
            if c.startswith("usage_ai_coding::")]
    df = pd.read_csv(f25, usecols=cols, low_memory=False)

    # Big Four comerciales (SaaS propietario dominante)
    BIG_FOUR = [
        "ChatGPT web / desktop / mobile apps (not inside third-party tools)",
        "GitHub Copilot", "Cursor",
        "Anthropic Claude Code",
        "Anthropic Claude web / desktop / mobile apps (not inside third-party tools)",
    ]
    # Open-source / self-hosted puro (pesos abiertos o herramienta OSS)
    OSS = [
        "Aider", "Cline (previously Claude Dev)", "Continue", "CodeGeeX",
        "DeepSeek apps or self-hosted / locally installed (not inside third-party tools)",
        "Meta Llama self-hosted / locally installed (not inside third-party tools)",
    ]
    NON_TOOL = {"None", "Other"}

    def has(names):
        existing = [f"usage_ai_coding::{n}" for n in names
                    if f"usage_ai_coding::{n}" in cols]
        return df[existing].notna().any(axis=1) if existing else pd.Series(False, index=df.index)

    real_cols = [c for c in cols if c.split("::", 1)[1] not in NON_TOOL]
    is_user = df[real_cols].notna().any(axis=1)
    n_users = int(is_user.sum())

    uses_big4 = has(BIG_FOUR) & is_user
    uses_oss = has(OSS) & is_user
    # "otras comerciales": usuario de IA que no entra en OSS (resto del mercado SaaS)
    records = [
        {"group": "Big Four comerciales", "label": "ChatGPT · Copilot · Cursor · Claude",
         "pct": round(uses_big4.sum() / n_users * 100, 1)},
        {"group": "Open-source / self-hosted", "label": "Aider · Continue · Llama local",
         "pct": round(uses_oss.sum() / n_users * 100, 1)},
    ]
    with open(OUT / "oss_vs_commercial.json", "w") as f:
        json.dump({"n_users": n_users, "items": records}, f, ensure_ascii=False)
        f.write("\n")
    print(f"oss_vs_commercial.json: Big4={records[0]['pct']}% OSS={records[1]['pct']}% (n={n_users})")


def company_adoption():
    """OBJ1/OBJ4 honesto: adopcion ORGANIZACIONAL de IA. A diferencia de
    usage_ai_coding (pregunta condicional que da ~100%), esta pregunta SI
    incluye la opcion 'No adoption', asi que mide adopcion real. El patron
    es bimodal: muchas empresas en fases tempranas, pocas 'extensive'."""
    f25 = str(ROOT / "data/raw/developer_ecosystem_2025_external.csv")
    df = pd.read_csv(f25, usecols=["level_ai_adoption_in_company"], low_memory=False)
    s = df["level_ai_adoption_in_company"].dropna()
    base = len(s)
    # orden de menos a mas adopcion + etiqueta corta en castellano
    ORDER = [
        ("No adoption – We do not use AI in our development workflows or areas", "Sin adopción"),
        ("Exploratory stage – We are researching AI but have not yet implemented it", "Exploración"),
        ("Pilot stage – We are experimenting with AI in limited workflows or areas", "Piloto"),
        ("Partial adoption – AI is used in some workflows or areas", "Adopción parcial"),
        ("Extensive adoption – AI is used in most development workflows or areas", "Adopción extensa"),
    ]
    records = []
    for raw, label in ORDER:
        n = int((s == raw).sum())
        records.append({"stage": label, "n": n, "pct": round(n / base * 100, 1)})
    with open(OUT / "company_adoption.json", "w") as f:
        json.dump({"base": base, "items": records}, f, ensure_ascii=False)
        f.write("\n")
    print(f"company_adoption.json: base={base}, sin adopción={records[0]['pct']}%, extensa={records[-1]['pct']}%")


def time_saving_evolution():
    """Serie temporal honesta (2024 vs 2025): cuanto tiempo ahorran a la
    semana quienes usan IA. Mismas categorias ambos anos, asi que es
    comparable. El grupo '8h+' se duplica: la IA rinde mas cada ano."""
    FILES = {
        2024: str(ROOT / "data/raw/2024_sharing_data_outside.csv"),
        2025: str(ROOT / "data/raw/developer_ecosystem_2025_external.csv"),
    }
    # orden de menos a mas ahorro + etiqueta corta
    ORDER = [
        ("I don’t save any time", "Nada"),
        ("Less than 1 hour", "< 1h"),
        ("From 1 to less than 2 hours", "1–2h"),
        ("From 2 to less than 4 hours", "2–4h"),
        ("From 4 to less than 8 hours", "4–8h"),
        ("8 hours or more", "8h+"),
    ]
    out = {"buckets": [lbl for _, lbl in ORDER], "years": {}}
    for yr, f in FILES.items():
        s = pd.read_csv(f, usecols=["ai_time_saving"], low_memory=False)["ai_time_saving"].dropna()
        base = len(s)
        out["years"][yr] = {"base": base,
                            "pct": [round((s == raw).sum() / base * 100, 1) for raw, _ in ORDER]}
    with open(OUT / "time_saving_evolution.json", "w") as f:
        json.dump(out, f, ensure_ascii=False)
        f.write("\n")
    p24 = out["years"][2024]["pct"][-1]
    p25 = out["years"][2025]["pct"][-1]
    print(f"time_saving_evolution.json: 8h+ 2024={p24}% -> 2025={p25}%")


if __name__ == "__main__":
    tool_share_by_year()
    fear_by_experience()
    ai_benefits()
    oss_vs_commercial()
    company_adoption()
    time_saving_evolution()
