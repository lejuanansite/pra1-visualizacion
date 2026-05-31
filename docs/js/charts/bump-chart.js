// docs/js/charts/bump-chart.js
// Before/after chart: usage % in 2020 vs 2025, sorted by 2025 value
// Shows the real magnitude of change, not just ranking

function initBumpChart(selector, data) {
  const LANGS = ["Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "PHP", "Kotlin"];

  function render(container) {
    const width = Math.max(container.clientWidth || 0, 500);
    const height = Math.max(container.clientHeight || 0, 460);
    const margin = { top: 50, right: 60, bottom: 20, left: 110 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // Build per-language {pct2020, pct2025, diff}
    const langData = LANGS.map(lang => {
      const r2020 = data.find(d => d.year === 2020 && d.language === lang);
      const r2025 = data.find(d => d.year === 2025 && d.language === lang);
      const p20 = r2020 ? r2020.pct : 0;
      const p25 = r2025 ? r2025.pct : 0;
      return { lang, pct2020: p20, pct2025: p25, diff: p25 - p20 };
    }).sort((a, b) => b.pct2025 - a.pct2025);

    const maxPct = d3.max(langData, d => Math.max(d.pct2020, d.pct2025));
    const xScale = d3.scaleLinear().domain([0, maxPct]).range([0, W]);
    const yScale = d3.scaleBand().domain(langData.map(d => d.lang)).range([0, H]).padding(0.35);

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Uso de lenguajes en 2020 vs 2025: ¿qué cambió con la IA?');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    g.append('text').attr('x', W / 2).attr('y', -30)
      .attr('text-anchor', 'middle').attr('fill', '#e8e8f0')
      .attr('font-size', '14px').attr('font-weight', '700')
      .text('Uso de lenguajes: 2020 vs 2025');

    // Axes
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + '%'))
      .call(ax => ax.select('.domain').attr('stroke', '#333'))
      .selectAll('text').attr('fill', '#8888aa').attr('font-size', '11px');

    g.append('g').call(d3.axisLeft(yScale).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '12px').attr('fill', '#cccccc');

    // Grid lines
    g.selectAll('.grid-line').data(xScale.ticks(5)).join('line')
      .attr('class', 'grid-line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#2a2a3a').attr('stroke-width', 1);

    // Per-language: connector line + two dots
    langData.forEach(d => {
      const y = yScale(d.lang) + yScale.bandwidth() / 2;
      const x20 = xScale(d.pct2020);
      const x25 = xScale(d.pct2025);

      // Connector line
      g.append('line')
        .attr('x1', x20).attr('x2', x25)
        .attr('y1', y).attr('y2', y)
        .attr('stroke', d.diff > 0 ? '#4ecdc4' : '#ff6b9d')
        .attr('stroke-width', 2).attr('opacity', 0.5);

      // 2020 dot (muted)
      g.append('circle')
        .attr('cx', x20).attr('cy', y).attr('r', 6)
        .attr('fill', '#8888aa').attr('opacity', 0.7)
        .attr('aria-label', `${d.lang} 2020: ${d.pct2020}%`);

      // 2025 dot (bright)
      g.append('circle')
        .attr('cx', x25).attr('cy', y).attr('r', 8)
        .attr('fill', d.diff > 0 ? '#4ecdc4' : '#ff6b9d')
        .attr('aria-label', `${d.lang} 2025: ${d.pct2025}%`);

      // Diff label
      const diffStr = (d.diff > 0 ? '+' : '') + d.diff.toFixed(1) + 'pp';
      g.append('text')
        .attr('x', Math.max(x20, x25) + 10)
        .attr('y', y + 4)
        .attr('fill', d.diff > 0 ? '#4ecdc4' : '#ff6b9d')
        .attr('font-size', '11px').attr('font-weight', '600')
        .text(diffStr);
    });

    // Legend
    const leg = g.append('g').attr('transform', `translate(0, -32)`);
    [{c: '#8888aa', r: 6, l: '2020'}, {c: '#4ecdc4', r: 8, l: '2025'}].forEach((d, i) => {
      leg.append('circle').attr('cx', i * 80).attr('cy', 0).attr('r', d.r).attr('fill', d.c);
      leg.append('text').attr('x', i * 80 + 14).attr('y', 4)
        .attr('fill', '#cccccc').attr('font-size', '11px').text(d.l);
    });
  }

  return { render };
}
