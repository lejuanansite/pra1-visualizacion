// docs/js/charts/ai-benefits.js
// Barras horizontales: que valoran los devs de la IA (H16).
// "Menos tiempo buscando informacion" (74.6%) es lo mas citado;
// "Mejor calidad del codigo" (34.6%) es lo ULTIMO. La industria vende
// calidad; los devs valoran el buscador.

function initAiBenefits(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const items = data.items || data;
    const n = data.n || null;
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 30, right: 60, bottom: 50, left: 215 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, 80]).range([0, W]);
    const y = d3.scaleBand().domain(items.map(d => d.benefit)).range([0, H]).padding(0.22);

    // resaltamos el primero (buscar) y el ultimo (calidad) — la historia
    const first = items[0].benefit;
    const last = items[items.length - 1].benefit;
    const colorFor = d =>
      d.benefit === first ? '#4ade80' :
      d.benefit === last ? '#ff6b9d' : '#6b6b8d';

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Beneficios percibidos de la IA por los desarrolladores');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(y).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', d => d === first ? '#4ade80' : d === last ? '#ff6b9d' : '#cccccc')
      .attr('font-weight', d => (d === first || d === last) ? '700' : '400');

    g.selectAll('.bar').data(items).join('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.benefit))
      .attr('width', d => x(d.pct)).attr('height', y.bandwidth())
      .attr('rx', 3).attr('fill', colorFor)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.benefit}</strong><br>${d.pct}% lo citan`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    g.selectAll('.val').data(items).join('text')
      .attr('class', 'val')
      .attr('x', d => x(d.pct) + 8).attr('y', d => y(d.benefit) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', colorFor).attr('font-size', '12px').attr('font-weight', '700')
      .text(d => d.pct.toFixed(1) + '%');

    if (n) {
      g.append('text').attr('x', W).attr('y', H + 38).attr('text-anchor', 'end')
        .attr('fill', '#8888aa').attr('font-size', '11px')
        .text(`Respuesta múltiple · n=${n.toLocaleString('es')}`);
    }
  }

  return { render };
}
