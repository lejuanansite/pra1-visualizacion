// docs/js/charts/ai-agents.js
// La frontera de 2025: agentes de IA (no solo autocompletar — actuar por ti).
// Mientras el 78% usa IA general, solo ~31% usa agentes y el grupo mayor
// (38%) no piensa hacerlo. La IA-que-sugiere se adoptó; la IA-que-actúa-sola
// encuentra resistencia. Stack Overflow 2025.

function initAiAgents(selector, data) {
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
    const margin = { top: 30, right: 70, bottom: 55, left: 160 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, d3.max(items, d => d.pct) * 1.15]).range([0, W]);
    const y = d3.scaleBand().domain(items.map(d => d.stage)).range([0, H]).padding(0.25);

    const tip = getOrCreateTooltip();
    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Adopción de agentes de IA entre desarrolladores (Stack Overflow 2025)');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(y).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '12px').attr('fill', '#cccccc');

    g.selectAll('.bar').data(items).join('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.stage))
      .attr('width', d => x(d.pct)).attr('height', y.bandwidth())
      .attr('rx', 3).attr('fill', d => d.color)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.stage}</strong><br>${d.pct}% de los desarrolladores`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    g.selectAll('.val').data(items).join('text')
      .attr('class', 'val')
      .attr('x', d => x(d.pct) + 8).attr('y', d => y(d.stage) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', d => d.color).attr('font-size', '12px').attr('font-weight', '700')
      .text(d => d.pct.toFixed(1) + '%');

    if (base) {
      g.append('text').attr('x', W).attr('y', H + 42).attr('text-anchor', 'end')
        .attr('fill', '#8888aa').attr('font-size', '11px')
        .text(`n=${base.toLocaleString('es')}`);
    }
  }

  return { render };
}
