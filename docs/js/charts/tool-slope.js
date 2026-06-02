// docs/js/charts/tool-slope.js
// Slope chart: cuota de cada herramienta IA entre usuarios de IA, 2024 -> 2025.
// Cuenta la "caida de ChatGPT" (80%->52%) y el ascenso de Cursor (x6.5) y Claude.

function initToolSlope(selector, data) {
  // Colores por herramienta — destacamos ChatGPT (cae) y Cursor (sube)
  const COLORS = {
    "ChatGPT": "#ff6b9d",
    "GitHub Copilot": "#9d8cff",
    "Claude": "#ffb05c",
    "Cursor": "#4ade80",
    "Gemini": "#5cc8ff",
    "Tabnine": "#888888",
  };
  // herramientas a resaltar (linea gruesa); el resto, atenuadas
  const HIGHLIGHT = new Set(["ChatGPT", "Cursor"]);

  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 40, right: 130, bottom: 40, left: 130 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // pivot: { tool: {2024, 2025} }
    const tools = {};
    data.forEach(d => {
      tools[d.tool] = tools[d.tool] || { tool: d.tool };
      tools[d.tool][d.year] = d.share;
    });
    const series = Object.values(tools).filter(t => t[2024] != null && t[2025] != null);

    const maxVal = d3.max(series, t => Math.max(t[2024], t[2025]));
    const x = d3.scalePoint().domain([2024, 2025]).range([0, W]).padding(0);
    const y = d3.scaleLinear().domain([0, maxVal * 1.1]).range([H, 0]);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Evolucion de la cuota de herramientas de IA entre usuarios de IA, 2024 a 2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // ejes verticales (años)
    [2024, 2025].forEach(yr => {
      g.append('line')
        .attr('x1', x(yr)).attr('x2', x(yr)).attr('y1', -10).attr('y2', H)
        .attr('stroke', '#333355').attr('stroke-width', 1);
      g.append('text')
        .attr('x', x(yr)).attr('y', -20).attr('text-anchor', 'middle')
        .attr('fill', '#aaaacc').attr('font-size', '13px').attr('font-weight', '600')
        .text(yr);
    });

    // Anti-colision vertical: dado un conjunto de etiquetas con su Y ideal,
    // las separa para que respeten una distancia minima sin perder el orden.
    function declutter(labels, minGap) {
      const sorted = labels.slice().sort((a, b) => a.y - b.y);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y - sorted[i - 1].y < minGap) {
          sorted[i].y = sorted[i - 1].y + minGap;
        }
      }
      // si nos pasamos del borde inferior, empujamos hacia arriba
      const overflow = sorted.length ? sorted[sorted.length - 1].y - H : 0;
      if (overflow > 0) sorted.forEach(s => { s.y -= overflow; });
      return labels;
    }

    // lineas + puntos
    series.forEach(t => {
      const color = COLORS[t.tool] || '#888';
      const hl = HIGHLIGHT.has(t.tool);
      const opacity = hl ? 1 : 0.45;
      const sw = hl ? 3.5 : 1.8;

      g.append('line')
        .attr('x1', x(2024)).attr('y1', y(t[2024]))
        .attr('x2', x(2025)).attr('y2', y(t[2025]))
        .attr('stroke', color).attr('stroke-width', sw).attr('opacity', opacity)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          tip.style.opacity = '1';
          const diff = (t[2025] - t[2024]).toFixed(1);
          const sign = diff >= 0 ? '+' : '';
          tip.innerHTML = `<strong>${t.tool}</strong><br>2024: ${t[2024]}%<br>2025: ${t[2025]}%<br><span style="color:${diff>=0?'#4ade80':'#ff6b9d'}">${sign}${diff} pp</span>`;
        })
        .on('mousemove', event => {
          tip.style.left = (event.pageX + 12) + 'px';
          tip.style.top = (event.pageY - 28) + 'px';
        })
        .on('mouseout', () => { tip.style.opacity = '0'; });

      [2024, 2025].forEach(yr => {
        g.append('circle')
          .attr('cx', x(yr)).attr('cy', y(t[yr])).attr('r', hl ? 5 : 3.5)
          .attr('fill', color).attr('opacity', opacity);
      });
    });

    // etiquetas con anti-colision, calculadas por lado
    const meta = t => ({
      color: COLORS[t.tool] || '#888',
      hl: HIGHLIGHT.has(t.tool),
    });
    const leftLabels = declutter(
      series.map(t => ({ t, y: y(t[2024]) })), 15);
    const rightLabels = declutter(
      series.map(t => ({ t, y: y(t[2025]) })), 15);

    leftLabels.forEach(({ t, y: ly }) => {
      const { color, hl } = meta(t);
      g.append('text')
        .attr('x', x(2024) - 12).attr('y', ly).attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', color).attr('opacity', hl ? 1 : 0.6)
        .attr('font-size', hl ? '12px' : '11px').attr('font-weight', hl ? '700' : '500')
        .text(`${t.tool} ${t[2024]}%`);
    });

    rightLabels.forEach(({ t, y: ry }) => {
      const { color, hl } = meta(t);
      g.append('text')
        .attr('x', x(2025) + 12).attr('y', ry).attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', color).attr('opacity', hl ? 1 : 0.6)
        .attr('font-size', hl ? '12px' : '11px').attr('font-weight', hl ? '700' : '500')
        .text(`${t.tool} ${t[2025]}%`);
    });

    // anotacion de la historia
    g.append('text')
      .attr('x', W / 2).attr('y', H + 32).attr('text-anchor', 'middle')
      .attr('fill', '#8888aa').attr('font-size', '11px')
      .text('Cuota entre quienes usan IA para programar · n≈17k (2024), n≈20k (2025)');
  }

  return { render };
}
