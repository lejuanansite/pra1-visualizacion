# scripts/05_process_stackoverflow.py
# Procesa la Stack Overflow Developer Survey (2023-2025) para obtener una
# medida HONESTA de adopcion de IA. A diferencia de JetBrains —cuya pregunta
# de herramientas es condicional y no permite medir adopcion poblacional—,
# SO pregunta `AISelect` con opcion "No" explicita, asi que el % que usa IA
# es comparable y defendible.
#
# Fuente: Stack Overflow Annual Developer Survey (ODbL 1.0).
# CSV en data/raw/stackoverflow/so_{anio}.csv (Git LFS).
import pandas as pd
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data/raw/stackoverflow"
OUT = ROOT / "docs/data"


def ai_adoption():
    """Serie 2023-2025 de adopcion de IA segun AISelect.
    Categorias: usa / planea usar / no usa ni planea."""
    records = []
    for year in (2023, 2024, 2025):
        f = RAW / f"so_{year}.csv"
        s = pd.read_csv(f, usecols=["AISelect"], low_memory=False)["AISelect"].dropna()
        base = len(s)
        # En 2025 el "Yes" se desglosa en daily/weekly/monthly -> unificamos.
        uses = int(s.str.startswith("Yes").sum())
        plan = int(s.str.contains("plan to soon").sum())
        no = int(s.str.contains("don't plan").sum())
        records.append({
            "year": year,
            "n": base,
            "uses_pct": round(uses / base * 100, 1),
            "plans_pct": round(plan / base * 100, 1),
            "no_pct": round(no / base * 100, 1),
        })
        print(f"{year}: usa={records[-1]['uses_pct']}%  planea={records[-1]['plans_pct']}%  "
              f"no={records[-1]['no_pct']}%  (n={base:,})")
    with open(OUT / "so_ai_adoption.json", "w") as fp:
        json.dump(records, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_ai_adoption.json: {len(records)} años")


def adoption_vs_sentiment():
    """La paradoja de la adopcion: la IA se usa cada vez mas (AISelect) pero
    gusta cada vez menos (AISent). Dos series 2023-2025 para cruzar."""
    records = []
    for year in (2023, 2024, 2025):
        f = RAW / f"so_{year}.csv"
        df = pd.read_csv(f, usecols=["AISelect", "AISent"], low_memory=False)
        sel = df["AISelect"].dropna()
        uses = round(sel.str.startswith("Yes").sum() / len(sel) * 100, 1)
        sent = df["AISent"].dropna()
        # categorias exactas (cuidado: "Unfavorable" contiene "favorable")
        fav = round(sent.isin(["Favorable", "Very favorable"]).sum() / len(sent) * 100, 1)
        unfav = round(sent.isin(["Unfavorable", "Very unfavorable"]).sum() / len(sent) * 100, 1)
        records.append({
            "year": year,
            "uses_pct": uses,
            "favorable_pct": fav,
            "unfavorable_pct": unfav,
            "n_sent": len(sent),
        })
        print(f"{year}: usa={uses}%  favorable={fav}%  desfavorable={unfav}%")
    with open(OUT / "so_adoption_vs_sentiment.json", "w") as fp:
        json.dump(records, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_adoption_vs_sentiment.json: {len(records)} años")


def ai_frustration():
    """Por que cae el entusiasmo: las frustraciones con la IA (2025, multi).
    La nº1 es 'casi correcto pero no del todo' (66%). La IA vive en el 'casi'."""
    f = RAW / "so_2025.csv"
    s = pd.read_csv(f, usecols=["AIFrustration"], low_memory=False)["AIFrustration"].dropna()
    base = len(s)
    from collections import Counter
    cnt = Counter()
    for v in s:
        for opt in str(v).split(";"):
            cnt[opt.strip()] += 1
    # etiquetas cortas en castellano para las principales
    LABELS = {
        "AI solutions that are almost right, but not quite": "Soluciones “casi” correctas",
        "Debugging AI-generated code is more time-consuming": "Depurar su código lleva más tiempo",
        "I’ve become less confident in my own problem-solving": "Menos confianza en mí mismo",
        "It’s hard to understand how or why the code works": "Cuesta entender por qué funciona",
    }
    records = []
    for raw, label in LABELS.items():
        if raw in cnt:
            records.append({"frustration": label, "pct": round(cnt[raw] / base * 100, 1)})
    records.sort(key=lambda r: -r["pct"])
    with open(OUT / "so_frustration.json", "w") as fp:
        json.dump({"base": base, "items": records}, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_frustration.json: top='{records[0]['frustration']}' {records[0]['pct']}% (n={base:,})")


def ai_agents():
    """La frontera de 2025: agentes de IA (no solo autocompletar, sino actuar).
    Comparado con el 78% que usa IA general, los agentes encuentran mucha mas
    resistencia. Agrupamos AIAgents en 4 posturas."""
    f = RAW / "so_2025.csv"
    s = pd.read_csv(f, usecols=["AIAgents"], low_memory=False)["AIAgents"].dropna()
    base = len(s)
    uses = int(s.str.startswith("Yes").sum())
    plans = int((s == "No, but I plan to").sum())
    copilot = int(s.str.contains("copilot/autocomplete").sum())
    no = int((s == "No, and I don't plan to").sum())
    records = [
        {"stage": "Ya usa agentes", "pct": round(uses / base * 100, 1), "color": "#4ade80"},
        {"stage": "Planea usarlos", "pct": round(plans / base * 100, 1), "color": "#9d8cff"},
        {"stage": "Solo modo copiloto", "pct": round(copilot / base * 100, 1), "color": "#5cc8ff"},
        {"stage": "No, ni piensa", "pct": round(no / base * 100, 1), "color": "#ff6b9d"},
    ]
    with open(OUT / "so_agents.json", "w") as fp:
        json.dump({"base": base, "items": records}, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_agents.json: usa={records[0]['pct']}%  no_ni_piensa={records[3]['pct']}%  (n={base:,})")


def salary_simpson():
    """Paradoja de Simpson: en GLOBAL quienes usan IA ganan menos, pero
    DENTRO de cada país ganan más. El agregado engaña porque EEUU (salarios
    altos) usa menos IA y el Sur Global (salarios bajos) usa más.
    Salario = ConvertedCompYearly (USD). Mediana, sin outliers."""
    f = RAW / "so_2025.csv"
    df = pd.read_csv(f, usecols=["Country", "ConvertedCompYearly", "AISelect"], low_memory=False)
    df = df.dropna(subset=["ConvertedCompYearly", "AISelect"])
    df = df[(df["ConvertedCompYearly"] > 1000) & (df["ConvertedCompYearly"] < 500000)].copy()
    df["uses"] = df["AISelect"].str.startswith("Yes")

    # global
    glob = df.groupby("uses")["ConvertedCompYearly"].median()
    out = {
        "global": {"uses": round(float(glob[True])), "no": round(float(glob[False]))},
        "countries": [],
    }
    # nombres cortos
    SHORT = {
        "United States of America": "EE. UU.",
        "Germany": "Alemania",
        "United Kingdom of Great Britain and Northern Ireland": "Reino Unido",
        "India": "India",
        "France": "Francia",
        "Canada": "Canadá",
        "Brazil": "Brasil",
        "Netherlands": "P. Bajos",
    }
    for raw, short in SHORT.items():
        g = df[df["Country"] == raw]
        m = g.groupby("uses")["ConvertedCompYearly"].median()
        if True in m.index and False in m.index and len(g) > 80:
            out["countries"].append({
                "country": short,
                "uses": round(float(m[True])),
                "no": round(float(m[False])),
                "n": int(len(g)),
            })
    # ordenar por salario "usa" desc
    out["countries"].sort(key=lambda d: -d["uses"])
    with open(OUT / "so_salary_simpson.json", "w") as fp:
        json.dump(out, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_salary_simpson.json: global usa={out['global']['uses']} no={out['global']['no']} "
          f"| {len(out['countries'])} países")


def adoption_by_country():
    """Adopción REAL de IA por país (AISelect, con opción "No" → denominador
    limpio). Hallazgo contraintuitivo: el Sur Global adopta MÁS que el Norte
    rico. Mapa coroplético — id = ISO 3166-1 numeric (compatible world-atlas).
    Explica el mecanismo de la paradoja de Simpson (Norte rico = poca IA)."""
    f = RAW / "so_2025.csv"
    df = pd.read_csv(f, usecols=["Country", "AISelect"], low_memory=False).dropna()
    df["uses"] = df["AISelect"].str.startswith("Yes")

    # nombre SO -> (ISO numeric, nombre corto). ISO 3166-1 numeric = id del TopoJSON.
    ISO = {
        "United States of America": (840, "EE. UU."), "India": (356, "India"),
        "Germany": (276, "Alemania"), "United Kingdom of Great Britain and Northern Ireland": (826, "Reino Unido"),
        "France": (250, "Francia"), "Canada": (124, "Canadá"), "Brazil": (76, "Brasil"),
        "Netherlands": (528, "P. Bajos"), "Poland": (616, "Polonia"), "Spain": (724, "España"),
        "Australia": (36, "Australia"), "Italy": (380, "Italia"), "Ukraine": (804, "Ucrania"),
        "Sweden": (752, "Suecia"), "Switzerland": (756, "Suiza"), "Austria": (40, "Austria"),
        "Czech Republic": (203, "Chequia"), "Romania": (642, "Rumanía"), "Belgium": (56, "Bélgica"),
        "Denmark": (208, "Dinamarca"), "Norway": (578, "Noruega"), "Finland": (246, "Finlandia"),
        "Israel": (376, "Israel"), "Turkey": (792, "Turquía"), "Mexico": (484, "México"),
        "Argentina": (32, "Argentina"), "Pakistan": (586, "Pakistán"), "China": (156, "China"),
        "Greece": (300, "Grecia"), "Hungary": (348, "Hungría"), "Portugal": (620, "Portugal"),
        "Ireland": (372, "Irlanda"), "New Zealand": (554, "N. Zelanda"), "Bulgaria": (100, "Bulgaria"),
        "South Africa": (710, "Sudáfrica"),
    }
    # Norte Global (economías de renta alta) para el resumen del contraste
    NORTE = {840, 826, 276, 250, 124, 36, 752, 208, 528, 756, 56, 40, 578, 246, 372, 554, 376}

    rows = []
    for raw, (iso, short) in ISO.items():
        g = df[df["Country"] == raw]
        if len(g) >= 200:
            rows.append({"id": iso, "name": short, "adopt": round(g["uses"].mean() * 100, 1),
                         "n": int(len(g)), "bloc": "norte" if iso in NORTE else "sur"})
    rows.sort(key=lambda r: -r["adopt"])

    # resumen agregado Norte vs Resto (mismo criterio, todos los respondientes)
    df["bloc"] = df["Country"].map(lambda c: "norte" if ISO.get(c, (0,))[0] in NORTE else "sur")
    agg = df.groupby("bloc")["uses"].agg(["mean", "size"])
    summary = {b: {"adopt": round(agg.loc[b, "mean"] * 100, 1), "n": int(agg.loc[b, "size"])}
               for b in ("norte", "sur")}

    out = {"countries": rows, "summary": summary}
    with open(OUT / "so_adoption_map.json", "w") as fp:
        json.dump(out, fp, ensure_ascii=False)
        fp.write("\n")
    print(f"so_adoption_map.json: {len(rows)} países · Norte={summary['norte']['adopt']}% "
          f"Sur={summary['sur']['adopt']}%")


if __name__ == "__main__":
    ai_adoption()
    adoption_vs_sentiment()
    ai_frustration()
    ai_agents()
    salary_simpson()
    adoption_by_country()
