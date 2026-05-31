# scripts/03_capability_join.py
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "docs/data"

# Manual mapping: JetBrains tool name → LifeArchitect model pattern to match
# Each tool resolves to one representative model for the scatterplot
TOOL_TO_MODEL = {
    "ChatGPT":       {"pattern": "GPT-4o",              "display": "ChatGPT / GPT-4o"},
    "GitHub Copilot":{"pattern": "GPT-4o",              "display": "GitHub Copilot (GPT-4o)"},
    "Cursor":        {"pattern": "Claude 3.5 Sonnet",   "display": "Cursor (Claude 3.5)"},
    "Claude":        {"pattern": "Claude 3.5 Sonnet",   "display": "Claude 3.5 Sonnet"},
    "Gemini":        {"pattern": "Gemini 1.5 Pro",      "display": "Google Gemini 1.5 Pro"},
    "DeepSeek":      {"pattern": "DeepSeek-V3",         "display": "DeepSeek V3"},
    "Windsurf":      {"pattern": "Claude 3.5 Sonnet",   "display": "Windsurf (Claude 3.5)"},
}

def build_capability_vs_adoption():
    adoption_data = json.load(open(OUT / "adoption_by_year.json"))
    llm_data = json.load(open(OUT / "llm_timeline.json"))

    # Get 2025 tool adoption dict
    adoption_2025 = next((r for r in adoption_data if r["year"] == 2025), None)
    if not adoption_2025:
        raise ValueError("No 2025 data in adoption_by_year.json")
    tools_2025 = adoption_2025["tools"]

    records = []
    for tool_name, meta in TOOL_TO_MODEL.items():
        adoption_pct = tools_2025.get(tool_name)
        if adoption_pct is None:
            print(f"  WARNING: {tool_name} not found in 2025 adoption data")
            continue

        # Find best matching model in LifeArchitect (has MMLU)
        pattern = meta["pattern"].lower()
        candidates = [
            m for m in llm_data
            if pattern in m["model"].lower() and m["mmlu"] is not None
        ]
        # Pick the one with highest MMLU if multiple match
        la_model = max(candidates, key=lambda m: m["mmlu"]) if candidates else None

        records.append({
            "tool": tool_name,
            "display": meta["display"],
            "adoption_pct": adoption_pct,
            "mmlu": la_model["mmlu"] if la_model else None,
            "params_b": la_model["params_b"] if la_model else None,
            "open_source": la_model["open_source"] if la_model else False,
            "model_matched": la_model["model"] if la_model else None,
        })

    with open(OUT / "capability_vs_adoption.json", "w") as f:
        json.dump(records, f)
        f.write("\n")
    print(f"capability_vs_adoption.json: {len(records)} tools")
    for r in records:
        print(f"  {r['tool']}: adoption={r['adoption_pct']}%, MMLU={r['mmlu']}, model={r['model_matched']}")

build_capability_vs_adoption()
