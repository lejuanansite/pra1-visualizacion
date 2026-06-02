// docs/js/charts/so-adoption.js
// Adopcion REAL de IA segun Stack Overflow (AISelect), 2023-2025.
// Area apilada: usa / planea usar / no usa ni planea. La franja "usa"
// crece (44->78%) y los indecisos se desploman (26->5%): la IA pasa de
// "lo voy a probar" a "ya lo uso". Queda un nucleo que se resiste.
//
// A diferencia de la pregunta de JetBrains (condicional, no medible como
// adopcion poblacional), AISelect incluye "No" explicito -> dato honesto.

function initSoAdoption(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  // upToYear permite revelar la serie progresivamente (gancho del Acto I)
  function render(container, upToYear) {
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 40, right: 120, bottom: 50, left: 50 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const all = data.slice().sort((a, b) => a.year - b.year);
    const series = upToYear ? all.filter(d => d.year <= upToYear) : all;

    const CATS = [
      { key: 'uses_pct', label: 'Usa IA', color: '#4ade80' },
      { key: 'plans_pct', label: 'Planea usarla', color: '#9d8cff' },
      { key: 'no_pct', label: 'No, ni piensa', color: '#ff6b9d' },
    ];

    const x = d3.scalePoint().domain(all.map(d => d.year)).range([0, W]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);

    const tip = getOrCreateTooltip();
    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Adopción de IA entre desarrolladores 2023-2025 (Stack Overflow)');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // ejes
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', '#8888aa');
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    // apilado: usa (abajo) -> planea -> no
    const stack = d3.stack().keys(CATS.map(c => c.key))(series);
    const areaGen = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0])).y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    stack.forEach((layer, i) => {
      g.append('path').datum(layer)
        .attr('fill', CATS[i].color).attr('opacity', 0.82).attr('d', areaGen);
    });

    // etiqueta de cada capa al final (en el ultimo año visible)
    if (series.length) {
      const last = series[series.length - 1];
      let cum = 0;
      CATS.forEach(c => {
        const val = last[c.key];
        const yMid = y(cum + val / 2);
        cum += val;
        g.append('text').attr('x', x(last.year) + 12).attr('y', yMid).attr('dy', '0.35em')
          .attr('fill', c.color).attr('font-size', '12px').attr('font-weight', '700')
          .text(`${c.label} ${val}%`);
      });
    }

    // puntos + tooltip sobre la franja "usa"
    series.forEach(d => {
      g.append('circle').attr('cx', x(d.year)).attr('cy', y(d.uses_pct))
        .attr('r', 4).attr('fill', '#fff').attr('stroke', '#4ade80').attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          tip.style.opacity = '1';
          tip.innerHTML = `<strong>${d.year}</strong><br>Usa IA: ${d.uses_pct}%<br>Planea: ${d.plans_pct}%<br>No, ni piensa: ${d.no_pct}%<br><span style="color:#8888aa">n=${d.n.toLocaleString('es')}</span>`;
        })
        .on('mousemove', event => {
          tip.style.left = (event.pageX + 12) + 'px';
          tip.style.top = (event.pageY - 28) + 'px';
        })
        .on('mouseout', () => { tip.style.opacity = '0'; });
    });
  }

  return { render };
}
