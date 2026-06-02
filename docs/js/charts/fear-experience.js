// docs/js/charts/fear-experience.js
// Barras horizontales: % que elige "seguridad del empleo" como su MAYOR
// preocupacion ante la IA, segun anos de experiencia.
// Cuenta el "miedo invertido": los que aun no programan profesionalmente
// temen mas por el empleo (16%) que los veteranos de 16+ anos (6%).

function initFearExperience(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 650;
    const height = 420;
    const margin = { top: 30, right: 70, bottom: 50, left: 140 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // data ya viene ordenado de menos a mas experiencia
    const maxVal = d3.max(data, d => d.pct_job_fear);
    const x = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, W]);
    const yb = d3.scaleBand().domain(data.map(d => d.experience))
      .range([0, H]).padding(0.25);

    // color: degradado de "novato/teme" (rosa) a "veterano/tranquilo" (verde)
    const color = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range(["#ff6b9d", "#4ade80"]);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Porcentaje que teme por su empleo segun anos de experiencia');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // eje X
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    // etiquetas Y (experiencia)
    g.append('g').call(d3.axisLeft(yb))
      .selectAll('text').attr('fill', '#aaaacc').attr('font-size', '12px');

    // barras
    g.selectAll('.bar')
      .data(data).join('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', d => yb(d.experience))
      .attr('width', d => x(d.pct_job_fear)).attr('height', yb.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d, i) => color(i))
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.experience}</strong><br>${d.pct_job_fear}% teme por su empleo<br><span style="color:#8888aa">n=${d.n}</span>`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    // valores al final de cada barra
    g.selectAll('.val')
      .data(data).join('text')
      .attr('class', 'val')
      .attr('x', d => x(d.pct_job_fear) + 8)
      .attr('y', d => yb(d.experience) + yb.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', (d, i) => color(i)).attr('font-size', '12px').attr('font-weight', '700')
      .text(d => d.pct_job_fear.toFixed(1) + '%');

    // anotacion: flecha conceptual de los extremos
    g.append('text')
      .attr('x', W).attr('y', H + 38).attr('text-anchor', 'end')
      .attr('fill', '#8888aa').attr('font-size', '11px')
      .text('Preocupación principal = "seguridad del empleo"');
  }

  return { render };
}
