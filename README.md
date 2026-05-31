# El Antes y el Después de la IA Generativa

Visualización de datos interactiva sobre cómo la IA generativa transformó el ecosistema de desarrollo software entre 2020 y 2025.

Práctica Final (Parte 2) — Visualización de Datos · Máster en Ciencia de Datos · UOC · 2026

## Ver en línea

> URL de GitHub Pages (disponible tras el despliegue)

## Estructura narrativa

La visualización sigue un scrollytelling en tres actos:

- **Acto I — El mundo antes (2020–2022):** cómo era el ecosistema de desarrollo antes de la IA generativa
- **Acto II — La ruptura (nov 2022 → 2024):** el impacto de ChatGPT, la explosión de modelos LLM y la adopción de herramientas IA
- **Acto III — El nuevo ecosistema (2024–2025):** brecha geográfica, brecha de género, diversidad del stack y sentimiento del desarrollador

## Datos

| Fuente | Descripción |
|--------|-------------|
| [JetBrains Developer Ecosystem Survey](https://www.jetbrains.com/lp/devecosystem-2025/) | 6 ediciones anuales (2020–2025), ~160.000 respuestas acumuladas |
| [LifeArchitect.ai Models Table](https://lifearchitect.ai/models-table/) | 855 modelos LLM con parámetros, benchmarks (MMLU) y fechas de lanzamiento |

Licencia de datos: JetBrains — uso público con atribución · LifeArchitect.ai — uso público con atribución al Dr. Alan D. Thompson

## Ejecutar localmente

```bash
cd docs
python3 -m http.server 8080
# Abrir http://localhost:8080
```

No requiere instalación de dependencias (D3.js, Scrollama y TopoJSON se cargan desde CDN).

## Reproducir el procesado de datos

```bash
pip install pandas
python scripts/01_process_jetbrains.py
python scripts/02_process_lifearchitect.py
python scripts/03_capability_join.py
```

Los CSVs originales (data/raw/) no se incluyen en el repositorio por tamaño. Descargables desde las URLs de las fuentes indicadas arriba.

## Stack técnico

- **Visualización:** D3.js v7, Scrollama v3, TopoJSON
- **Datos:** Python 3 + pandas
- **Despliegue:** GitHub Pages (estático, sin servidor)

## Licencia

MIT © 2026 Juanan
