// docs/js/charts/salary-simpson.js
// Paradoja de Simpson con salarios (Stack Overflow 2025).
// GLOBAL: quien usa IA gana menos ($75k vs $81k).
// POR PAÍS: quien usa IA gana MÁS, en todos los países.
// El agregado engaña porque los países de salario alto (EE.UU.) usan menos
// IA y los de salario bajo (India, Brasil) usan más. Dumbbell por país +
// resumen global arriba.

function initSalarySimpson(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }
  const fmt = v => '$' + (v / 1000).toFixed(0) + 'k';

  function render(container) {
    const countries = data.countries;
    const glob = data.global;
    const width = container.clientWidth || 650;
    const rowH = 30;
    const height = 120 + countries.length * rowH + 60;
    const margin = { top: 110, right: 70, bottom: 40, left: 90 };
    const W = width - margin.left - margin.right;
    const H = countries.length * rowH;

    const maxV = d3.max(countries, d => Math.max(d.uses, d.no));
    const x = d3.scaleLinear().domain([0, maxV * 1.05]).range([0, W]);
    const y = d3.scaleBand().domain(countries.map(d => d.country)).range([0, H]).padding(0.35);

    const C_USES = '#4ade80', C_NO = '#9d8cff';
    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Paradoja de Simpson: salario y uso de IA, global frente a por país');

    // --- resumen global arriba (la trampa) ---
    const gTop = svg.append('g').attr('transform', `translate(${margin.left},28)`);
    gTop.append('text').attr('x', 0).attr('y', -12)
      .attr('fill', '#cccccc').attr('font-size', '12px').attr('font-weight', '600')
      .text('En conjunto, quien usa IA parece ganar MENOS…');
    const gx = d3.scaleLinear().domain([0, d3.max([glob.uses, glob.no]) * 1.05]).range([0, W * 0.6]);
    [['No usa IA', glob.no, C_NO], ['Usa IA', glob.uses, C_USES]].forEach(([lbl, val, col], i) => {
      const yy = i * 22;
      gTop.append('rect').attr('x', 0).attr('y', yy).attr('width', gx(val)).attr('height', 16)
        .attr('rx', 3).attr('fill', col).attr('opacity', 0.85);
      gTop.append('text').attr('x', gx(val) + 8).attr('y', yy + 13)
        .attr('fill', col).attr('font-size', '12px').attr('font-weight', '700')
        .text(`${fmt(val)} · ${lbl}`);
    });

    // --- desglose por país (la realidad) ---
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('text').attr('x', 0).attr('y', -16)
      .attr('fill', '#cccccc').attr('font-size', '12px').attr('font-weight', '600')
      .text('…pero DENTRO de cada país, gana MÁS:');

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => fmt(d)))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(y).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '11px').attr('fill', '#cccccc');

    countries.forEach(d => {
      const cy = y(d.country) + y.bandwidth() / 2;
      // linea conectora
      g.append('line').attr('x1', x(d.no)).attr('x2', x(d.uses)).attr('y1', cy).attr('y2', cy)
        .attr('stroke', '#444').attr('stroke-width', 2);
      // punto "no usa"
      g.append('circle').attr('cx', x(d.no)).attr('cy', cy).attr('r', 5).attr('fill', C_NO)
        .style('cursor', 'pointer')
        .on('mouseover', e => { tip.style.opacity = '1'; tip.innerHTML = `<strong>${d.country}</strong><br>No usa IA: ${fmt(d.no)}<br>n=${d.n}`; })
        .on('mousemove', e => { tip.style.left = (e.pageX + 12) + 'px'; tip.style.top = (e.pageY - 28) + 'px'; })
        .on('mouseout', () => { tip.style.opacity = '0'; });
      // punto "usa"
      g.append('circle').attr('cx', x(d.uses)).attr('cy', cy).attr('r', 5).attr('fill', C_USES)
        .style('cursor', 'pointer')
        .on('mouseover', e => { tip.style.opacity = '1'; tip.innerHTML = `<strong>${d.country}</strong><br>Usa IA: ${fmt(d.uses)}<br>n=${d.n}`; })
        .on('mousemove', e => { tip.style.left = (e.pageX + 12) + 'px'; tip.style.top = (e.pageY - 28) + 'px'; })
        .on('mouseout', () => { tip.style.opacity = '0'; });
    });

    // leyenda
    const leg = svg.append('g').attr('transform', `translate(${margin.left}, ${height - 18})`);
    [['Usa IA', C_USES], ['No usa IA', C_NO]].forEach(([lbl, col], i) => {
      leg.append('circle').attr('cx', i * 110).attr('cy', 0).attr('r', 5).attr('fill', col);
      leg.append('text').attr('x', i * 110 + 12).attr('y', 4).attr('fill', '#aaa').attr('font-size', '11px').text(lbl);
    });
  }

  return { render };
}
