# Dev × IA 2020–2025

Visualización interactiva (scrollytelling) sobre cómo la IA generativa transformó el ecosistema de desarrollo de software entre 2020 y 2025 —y qué *no* cambió.

Práctica Final (Parte 2) · Visualización de Datos · Máster en Ciencia de Datos · UOC · 2026

**▶ En vivo: https://lejuanansite.github.io/pra1-visualizacion/**

## La narrativa

Scrollytelling en tres actos con gráficos D3.js que cambian al hacer scroll:

- **Acto I — La ola de adopción.** La adopción real de IA (44 % → 78 %) y el mapa contraintuitivo de quién la adopta más: el Sur Global, no el Norte rico.
- **Acto II — La ruptura.** 855 modelos LLM, la guerra de herramientas (ChatGPT pierde un tercio en un año), capacidad técnica vs. adopción y el aplastamiento del open-source.
- **Acto III — El nuevo ecosistema.** Agentes autónomos, el stack que no se homogeneizó, la paradoja de Simpson del salario, el miedo invertido por experiencia y la paradoja final: se usa cada vez más, gusta cada vez menos.

Más una zona **"Explora los datos"** con métricas comparables entre usuarios.

> **Nota metodológica.** La pregunta de herramientas de IA de JetBrains es condicional (solo la responde quien ya usa IA), así que no mide adopción poblacional. Por eso JetBrains se usa solo para proporciones *entre usuarios*, y la adopción real (usa / planea / no) procede de Stack Overflow (`AISelect` incluye "No"). Cada gráfico declara su fuente y denominador.

## Datos

| Fuente | Uso | Licencia |
|--------|-----|----------|
| [JetBrains Developer Ecosystem Survey 2020–2025](https://www.jetbrains.com/lp/devecosystem-2025/) | Cuotas de herramienta, beneficios, tiempo ahorrado, miedo, lenguajes (~160.000 resp.) | Pública con atribución |
| [Stack Overflow Developer Survey 2023–2025](https://survey.stackoverflow.co/) | Adopción real, sentimiento, agentes, salario × país (>30.000 resp./año) | ODbL 1.0 |
| [LifeArchitect.ai Models Table](https://lifearchitect.ai/models-table/) | 855 modelos LLM: parámetros, MMLU, fechas | Pública con atribución (Dr. Alan D. Thompson) |

## Uso

**Ver el sitio en local** (sin dependencias; D3, Scrollama y TopoJSON vienen de CDN):

```bash
python3 -m http.server 8080 --directory docs   # → http://localhost:8080
```

**Reproducir el procesado de datos** con [uv](https://docs.astral.sh/uv/) (única dependencia: `pandas`):

```bash
uv venv && uv pip install -r requirements.txt
uv run scripts/01_process_jetbrains.py        # JetBrains: lenguajes, perfil, métricas base
uv run scripts/02_process_lifearchitect.py    # modelos LLM (timeline + MMLU)
uv run scripts/03_capability_join.py          # capacidad técnica × adopción
uv run scripts/04_tools_and_fear.py           # cuotas, OSS, beneficios, tiempo, miedo
uv run scripts/05_process_stackoverflow.py    # adopción, sentimiento, agentes, salario, mapa
```

Los CSV originales (`data/raw/`, ~1,5 GB) no se versionan; se descargan de las fuentes de arriba.

## Estructura

```
docs/        # sitio estático (GitHub Pages): index.html, css/, js/main.js, js/charts/, data/
scripts/     # pipeline de preprocesado en Python (01–05)
```

## Licencia

- **Código** (sitio y scripts): [MIT](LICENSE) © 2026 Juanan.
- **Datos** (`docs/data/`): son derivados de las fuentes de arriba y conservan **su** licencia, no la MIT. En particular, los datos de Stack Overflow están bajo [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) (atribución + *share-alike*); JetBrains y LifeArchitect.ai, uso público con atribución.
