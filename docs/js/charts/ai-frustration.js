// docs/js/charts/ai-frustration.js
// Por que cae el entusiasmo (Stack Overflow 2025): las frustraciones con la
// IA. La nº1, con diferencia, es "soluciones casi correctas, pero no del
// todo" (66%). La IA vive en el "casi": ni acierta del todo ni falla del
// todo. Explica la paradoja del paso siguiente.

function initAiFrustration(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const items = data.items || data;
    const base = data.base || null;
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 30, right: 70, bottom: 55, left: 210 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, d3.max(items, d => d.pct) * 1.15]).range([0, W]);
    const y = d3.scaleBand().domain(items.map(d => d.frustration)).range([0, H]).padding(0.25);

    const first = items[0].frustration; // "casi correctas" — la destacamos
    const colorFor = d => d.frustration === first ? '#ff6b9d' : '#6b6b8d';

    const tip = getOrCreateTooltip();
    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Principales frustraciones con la IA (Stack Overflow 2025)');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(y).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', d => d === first ? '#ff6b9d' : '#cccccc')
      .attr('font-weight', d => d === first ? '700' : '400');

    g.selectAll('.bar').data(items).join('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.frustration))
      .attr('width', d => x(d.pct)).attr('height', y.bandwidth())
      .attr('rx', 3).attr('fill', colorFor)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.frustration}</strong><br>${d.pct}% lo citan`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    g.selectAll('.val').data(items).join('text')
      .attr('class', 'val')
      .attr('x', d => x(d.pct) + 8).attr('y', d => y(d.frustration) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', colorFor).attr('font-size', '12px').attr('font-weight', '700')
      .text(d => d.pct.toFixed(0) + '%');

    if (base) {
      g.append('text').attr('x', W).attr('y', H + 42).attr('text-anchor', 'end')
        .attr('fill', '#8888aa').attr('font-size', '11px')
        .text(`Respuesta múltiple · n=${base.toLocaleString('es')}`);
    }
  }

  return { render };
}
