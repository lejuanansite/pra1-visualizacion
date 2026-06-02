# Dev × IA 2020–2025: el antes y el después de la IA generativa

Visualización de datos interactiva (scrollytelling) sobre cómo la IA generativa transformó el ecosistema de desarrollo de software entre 2020 y 2025 —y qué *no* cambió.

Práctica Final (Parte 2) — Visualización de Datos · Máster en Ciencia de Datos · UOC · 2026

## Ver en línea

**https://lejuanansite.github.io/pra1-visualizacion/**

## Estructura narrativa

Scrollytelling en tres actos, con gráficos sticky en D3.js que cambian al hacer scroll:

- **Acto I — La ola de adopción (2023–2025):** la adopción real de IA (44 % → 78 %) y el mapa contraintuitivo de *quién* la adopta más (el Sur Global, no el Norte rico).
- **Acto II — La ruptura (nov 2022 → 2024):** la explosión de 855 modelos LLM, la guerra de herramientas (ChatGPT pierde un tercio en un año), capacidad técnica vs. adopción y el aplastamiento del open-source.
- **Acto III — El nuevo ecosistema (2024–2025):** agentes autónomos, (no)homogeneización del stack, para qué sirve la IA de verdad, la **paradoja de Simpson** del salario, el miedo invertido por experiencia, el problema del "casi" y la paradoja final: se usa cada vez más, gusta cada vez menos.

Además, una zona **"Explora los datos"** con métricas honestas y comparables (rankings y proporciones entre usuarios).

## Rigor metodológico: el problema del denominador

El hallazgo central del proyecto no es un gráfico, sino una decisión: **la pregunta de herramientas de IA de JetBrains es condicional** (solo la responde quien ya usa IA), así que **no mide adopción poblacional**. Usarla como "% que usa IA" sería falso.

Por eso:
- Las métricas de JetBrains se presentan **entre quienes usan IA** (cuotas de herramienta, beneficios, tiempo ahorrado, miedo).
- La **adopción real** (usa / planea / no usa) procede de **Stack Overflow**, cuya pregunta `AISelect` sí incluye la opción "No".
- Cada gráfico declara su fuente y su denominador.

## Datos

| Fuente | Uso en el proyecto |
|--------|--------------------|
| [JetBrains Developer Ecosystem Survey 2020–2025](https://www.jetbrains.com/lp/devecosystem-2025/) | ~160.000 respuestas. Cuotas de herramienta, beneficios, tiempo ahorrado, miedo, lenguajes (proporciones entre usuarios). |
| [Stack Overflow Developer Survey 2023–2025](https://survey.stackoverflow.co/) | >30.000 respuestas/año. Adopción real, sentimiento, agentes, frustraciones, salario × país (denominador limpio). |
| [LifeArchitect.ai Models Table](https://lifearchitect.ai/models-table/) | 855 modelos LLM con parámetros, MMLU y fechas de lanzamiento. |

Licencias de datos: JetBrains — uso público con atribución · Stack Overflow — ODbL 1.0 · LifeArchitect.ai — uso público con atribución al Dr. Alan D. Thompson.

## Ejecutar localmente

```bash
cd docs
python3 -m http.server 8080
# Abrir http://localhost:8080
```

No requiere instalar dependencias en el navegador: D3.js v7, Scrollama v3 y TopoJSON se cargan desde CDN.

## Reproducir el procesado de datos

Requiere [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`). La única dependencia externa es `pandas` (el resto es librería estándar), fijada en [`requirements.txt`](requirements.txt).

```bash
uv venv                          # crea el entorno en .venv
uv pip install -r requirements.txt

# pipeline completo (ejecutar en orden; cada script escribe sus JSON en docs/data/)
uv run scripts/01_process_jetbrains.py        # lenguajes, perfil, métricas base JetBrains
uv run scripts/02_process_lifearchitect.py    # tabla de modelos LLM (timeline + MMLU)
uv run scripts/03_capability_join.py          # cruce capacidad técnica × adopción
uv run scripts/04_tools_and_fear.py           # cuotas de herramienta, OSS, beneficios, tiempo, miedo
uv run scripts/05_process_stackoverflow.py    # adopción real, sentimiento, agentes, salario, mapa por país
```

Los CSV originales (`data/raw/`) no se incluyen en el repositorio por tamaño (~1,5 GB). Se descargan desde las URLs de las fuentes indicadas arriba; los de Stack Overflow vía Git LFS del repositorio oficial.

## Estructura del repositorio

```
docs/            # sitio estático servido por GitHub Pages
  index.html     # narrativa scrollytelling
  css/           # estilos
  js/
    main.js      # estado, Scrollama, carga de datos y orquestación de gráficos
    charts/      # un módulo init*() por gráfico
  data/          # JSON preprocesados que consume el sitio
scripts/         # pipeline de preprocesado en Python (01–05)
```

## Stack técnico

- **Visualización:** D3.js v7, Scrollama v3, TopoJSON (mapa coroplético)
- **Datos:** Python 3 + pandas
- **Despliegue:** GitHub Pages (estático, sin servidor)

## Licencia

MIT © 2026 Juanan
