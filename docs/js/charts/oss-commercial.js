// docs/js/charts/oss-commercial.js
// OBJ 2: ¿gana terreno la IA open-source frente a la comercial?
// Respuesta: no. Entre los usuarios de IA, el 82% usa alguna de las Big Four
// comerciales (ChatGPT/Copilot/Cursor/Claude); solo el 10% usa herramientas
// open-source o self-hosted. El mercado esta fuertemente concentrado en SaaS.

function initOssCommercial(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const items = data.items || data;
    const nUsers = data.n_users || null;
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 30, right: 80, bottom: 70, left: 215 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, 100]).range([0, W]);
    const y = d3.scaleBand().domain(items.map(d => d.group)).range([0, H]).padding(0.4);

    const COLORS = {
      "Big Four comerciales": "#ff6b9d",
      "Open-source / self-hosted": "#4ade80",
    };

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Adopcion de IA comercial frente a open-source entre usuarios de IA');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    // grupo + sublabel a la izquierda
    items.forEach(d => {
      const cy = y(d.group) + y.bandwidth() / 2;
      g.append('text').attr('x', -12).attr('y', cy - 4).attr('text-anchor', 'end')
        .attr('fill', COLORS[d.group]).attr('font-size', '13px').attr('font-weight', '700')
        .text(d.group);
      g.append('text').attr('x', -12).attr('y', cy + 12).attr('text-anchor', 'end')
        .attr('fill', '#8888aa').attr('font-size', '10px')
        .text(d.label);
    });

    g.selectAll('.bar').data(items).join('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => y(d.group))
      .attr('width', d => x(d.pct)).attr('height', y.bandwidth())
      .attr('rx', 4).attr('fill', d => COLORS[d.group])
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.group}</strong><br>${d.pct}% de los usuarios de IA`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    g.selectAll('.val').data(items).join('text')
      .attr('class', 'val')
      .attr('x', d => x(d.pct) + 10).attr('y', d => y(d.group) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', d => COLORS[d.group]).attr('font-size', '20px').attr('font-weight', '800')
      .text(d => d.pct + '%');

    // ratio destacado
    if (items.length === 2 && items[1].pct > 0) {
      const ratio = (items[0].pct / items[1].pct).toFixed(1);
      g.append('text').attr('x', W).attr('y', H + 46).attr('text-anchor', 'end')
        .attr('fill', '#8888aa').attr('font-size', '11px')
        .text(`La IA comercial se usa ${ratio}× más que la open-source`
              + (nUsers ? ` · n=${nUsers.toLocaleString('es')}` : ''));
    }
  }

  return { render };
}
