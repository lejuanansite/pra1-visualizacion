// docs/js/charts/time-saving.js
// Serie temporal honesta: horas/semana ahorradas con IA, 2024 vs 2025.
// Mismas categorias ambos anos (comparable). La distribucion se desplaza a
// la derecha: el grupo "8h+" se duplica (6,9%->16,4%). La IA rinde mas.

function initTimeSaving(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const buckets = data.buckets;
    const y24 = data.years['2024'] || data.years[2024];
    const y25 = data.years['2025'] || data.years[2025];

    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 40, right: 30, bottom: 55, left: 50 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x0 = d3.scaleBand().domain(buckets).range([0, W]).padding(0.22);
    const x1 = d3.scaleBand().domain(['2024', '2025']).range([0, x0.bandwidth()]).padding(0.12);
    const maxV = d3.max([...y24.pct, ...y25.pct]);
    const y = d3.scaleLinear().domain([0, maxV * 1.12]).range([H, 0]);

    const COL = { '2024': '#6b6b8d', '2025': '#4ade80' };
    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Horas semanales ahorradas con IA, comparación 2024 y 2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('fill', '#cccccc').attr('font-size', '12px');

    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    // eje X label
    g.append('text').attr('x', W / 2).attr('y', H + 44).attr('text-anchor', 'middle')
      .attr('fill', '#8888aa').attr('font-size', '11px')
      .text('Horas/semana ahorradas con IA (entre quienes usan IA)');

    buckets.forEach((b, i) => {
      [['2024', y24.pct[i]], ['2025', y25.pct[i]]].forEach(([yr, val]) => {
        g.append('rect')
          .attr('x', x0(b) + x1(yr)).attr('y', y(val))
          .attr('width', x1.bandwidth()).attr('height', H - y(val))
          .attr('rx', 2).attr('fill', COL[yr])
          .style('cursor', 'pointer')
          .on('mouseover', (event) => {
            tip.style.opacity = '1';
            tip.innerHTML = `<strong>${b} · ${yr}</strong><br>${val}% de los usuarios de IA`;
          })
          .on('mousemove', event => {
            tip.style.left = (event.pageX + 12) + 'px';
            tip.style.top = (event.pageY - 28) + 'px';
          })
          .on('mouseout', () => { tip.style.opacity = '0'; });
      });
    });

    // leyenda
    const leg = g.append('g').attr('transform', `translate(${W - 120}, -28)`);
    [['2024', COL['2024']], ['2025', COL['2025']]].forEach(([lbl, c], i) => {
      leg.append('rect').attr('x', i * 62).attr('y', 0).attr('width', 12).attr('height', 12)
        .attr('fill', c).attr('rx', 2);
      leg.append('text').attr('x', i * 62 + 16).attr('y', 10)
        .attr('fill', '#aaa').attr('font-size', '11px').text(lbl);
    });
  }

  return { render };
}
