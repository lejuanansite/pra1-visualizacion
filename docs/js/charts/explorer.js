// docs/js/charts/explorer.js
// Zona de exploración libre. Solo ofrece métricas HONESTAS y comparables:
//  - Popularidad de lenguajes por año (JetBrains, 2020-2025)
//  - Cuota de cada herramienta IA entre usuarios de IA por año (2024-2025)
//  - Distribución del tiempo ahorrado con IA por año (2024-2025)
// Se evita deliberadamente la "adopción por herramienta/género", que con
// estos datos no es medible como % poblacional (pregunta condicional).

let _explorerContainer = null;
let _explorerData = null;

function initExplorer(containerSelector, allData) {
  _explorerContainer = document.querySelector(containerSelector);
  _explorerData = allData;
  updateExplorer();
}

function updateExplorer() {
  if (!_explorerContainer || !_explorerData) return;
  _explorerContainer.innerHTML = '';

  const metric = AppState.explorerMetric;
  const year = AppState.explorerYear;
  let chartData = [];
  let note = '';

  if (metric === 'tool_share') {
    // cuota de herramienta entre usuarios de IA (toolSlopeData: year, tool, share)
    const rows = (_explorerData.toolSlopeData || []).filter(d => d.year === year);
    if (rows.length === 0) {
      note = 'Solo hay datos comparables de cuota de herramientas para 2024 y 2025.';
    }
    chartData = rows
      .map(d => ({ label: d.tool, value: d.share, group: 'tool' }))
      .sort((a, b) => b.value - a.value);
  } else if (metric === 'time_saving') {
    // distribucion del tiempo ahorrado (timeSavingData: buckets + years{pct})
    const ts = _explorerData.timeSavingData;
    const yr = ts && ts.years ? (ts.years[year] || ts.years[String(year)]) : null;
    if (!yr) {
      note = 'Solo hay datos de tiempo ahorrado para 2024 y 2025.';
    } else {
      chartData = ts.buckets.map((b, i) => ({ label: b, value: yr.pct[i], group: 'time' }));
    }
  } else {
    // por defecto: lenguajes del año seleccionado (todos los años disponibles)
    chartData = (_explorerData.langData || [])
      .filter(d => d.year === year)
      .map(d => ({ label: d.language, value: d.pct, group: 'lang' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  if (chartData.length === 0) {
    _explorerContainer.innerHTML =
      `<p style="color:#8888aa;padding:1rem">${note || 'No hay datos para esta combinación.'}</p>`;
    return;
  }

  renderExplorerBar(_explorerContainer, chartData);
  if (note) {
    const p = document.createElement('p');
    p.style.cssText = 'color:#8888aa;font-size:0.8rem;margin-top:0.5rem';
    p.textContent = note;
    _explorerContainer.appendChild(p);
  }
}

function renderExplorerBar(container, data) {
  const width = container.clientWidth || 750;
  const height = Math.max(280, data.length * 34 + 60);
  const margin = { top: 20, right: 70, bottom: 30, left: 210 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;

  const maxVal = d3.max(data, d => d.value);
  const xScale = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, W]);
  const yScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, H]).padding(0.2);

  const colorMap = {
    'lang': '#4ecdc4',
    'tool': '#ff6b9d',
    'time': '#4ade80',
  };

  const svg = d3.select(container).append('svg')
    .attr('width', width).attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', 'Gráfico de exploración de datos');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g').attr('transform', `translate(0,${H})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + '%'))
    .selectAll('text').attr('fill', '#8888aa').attr('font-size', '11px');

  g.append('g').call(d3.axisLeft(yScale).tickSize(0))
    .call(ax => ax.select('.domain').remove())
    .selectAll('text').attr('font-size', '11px').attr('fill', '#cccccc');

  g.selectAll('rect').data(data).join('rect')
    .attr('y', d => yScale(d.label))
    .attr('height', yScale.bandwidth())
    .attr('width', d => xScale(d.value))
    .attr('fill', d => colorMap[d.group] || '#4ecdc4')
    .attr('opacity', 0.85).attr('rx', 3)
    .attr('tabindex', 0)
    .attr('aria-label', d => `${d.label}: ${d.value}%`);

  g.selectAll('.val-lbl').data(data).join('text')
    .attr('class', 'val-lbl')
    .attr('x', d => xScale(d.value) + 6)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2 + 4)
    .attr('fill', '#cccccc').attr('font-size', '11px')
    .text(d => d.value.toFixed(1) + '%');
}
