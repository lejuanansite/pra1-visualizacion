// docs/js/charts/adoption-paradox.js
// La paradoja de la adopcion (Stack Overflow 2023-2025): la IA se usa cada
// vez MAS (44->78%) pero gusta cada vez MENOS (76->60% favorable). Dos lineas
// que se separan: el uso sube, el entusiasmo baja. La usamos a regañadientes.

function initAdoptionParadox(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const rows = data.slice().sort((a, b) => a.year - b.year);
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 40, right: 150, bottom: 50, left: 50 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const x = d3.scalePoint().domain(rows.map(d => d.year)).range([0, W]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);

    const LINES = [
      { key: 'uses_pct', label: 'Usa IA', color: '#4ade80' },
      { key: 'favorable_pct', label: 'La ve con buenos ojos', color: '#ff6b9d' },
    ];

    const tip = getOrCreateTooltip();
    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Adopción de IA frente a sentimiento favorable, 2023-2025 (Stack Overflow)');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', '#8888aa');
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    const lineGen = key => d3.line()
      .x(d => x(d.year)).y(d => y(d[key])).curve(d3.curveMonotoneX);

    LINES.forEach(L => {
      g.append('path').datum(rows)
        .attr('fill', 'none').attr('stroke', L.color).attr('stroke-width', 3.5)
        .attr('d', lineGen(L.key));

      rows.forEach(d => {
        g.append('circle').attr('cx', x(d.year)).attr('cy', y(d[L.key]))
          .attr('r', 5).attr('fill', L.color)
          .style('cursor', 'pointer')
          .on('mouseover', (event) => {
            tip.style.opacity = '1';
            tip.innerHTML = `<strong>${d.year} · ${L.label}</strong><br>${d[L.key]}%`;
          })
          .on('mousemove', event => {
            tip.style.left = (event.pageX + 12) + 'px';
            tip.style.top = (event.pageY - 28) + 'px';
          })
          .on('mouseout', () => { tip.style.opacity = '0'; });
        // valor sobre cada punto
        g.append('text').attr('x', x(d.year)).attr('y', y(d[L.key]) - 12)
          .attr('text-anchor', 'middle').attr('fill', L.color)
          .attr('font-size', '11px').attr('font-weight', '700')
          .text(d[L.key].toFixed(1) + '%');
      });

      // etiqueta de la linea al final
      const last = rows[rows.length - 1];
      g.append('text').attr('x', x(last.year) + 12).attr('y', y(last[L.key])).attr('dy', '0.35em')
        .attr('fill', L.color).attr('font-size', '12px').attr('font-weight', '700')
        .text(L.label);
    });
  }

  return { render };
}
