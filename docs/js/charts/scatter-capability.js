// docs/js/charts/scatter-capability.js

function initScatterCapability(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 620;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 65, left: 65 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const validData = data.filter(d => d.mmlu != null && d.adoption_pct != null);

    const xScale = d3.scaleLinear()
      .domain([d3.min(validData, d => d.mmlu) - 3, d3.max(validData, d => d.mmlu) + 3])
      .range([0, W]);
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(validData, d => d.adoption_pct) * 1.15])
      .range([H, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain([true, false]).range(['#4ecdc4', '#ff6b9d']);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Capacidad técnica MMLU vs adopción declarada por desarrolladores 2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('text').attr('x', W / 2).attr('y', H + 50)
      .attr('text-anchor', 'middle').attr('fill', '#8888aa').attr('font-size', '11px')
      .text('MMLU score (calidad técnica del modelo)');

    g.append('text').attr('x', -H / 2).attr('y', -50)
      .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
      .attr('fill', '#8888aa').attr('font-size', '11px')
      .text('% desarrolladores que lo usan (2025)');

    // Dots
    g.selectAll('circle').data(validData).join('circle')
      .attr('cx', d => xScale(d.mmlu))
      .attr('cy', d => yScale(d.adoption_pct))
      .attr('r', 10)
      .attr('fill', d => colorScale(d.open_source))
      .attr('opacity', 0.82)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.tool}: MMLU ${d.mmlu}, ${d.adoption_pct}% adopción`)
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.display}</strong><br>MMLU: ${d.mmlu}<br>Adopción: ${d.adoption_pct}%<br>${d.open_source ? 'Open-source' : 'Comercial'}`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    // Tool labels
    g.selectAll('.tool-label').data(validData).join('text')
      .attr('class', 'tool-label')
      .attr('x', d => xScale(d.mmlu) + 13)
      .attr('y', d => yScale(d.adoption_pct) + 4)
      .attr('fill', '#cccccc').attr('font-size', '10px')
      .text(d => d.tool);

    // Legend
    const leg = g.append('g').attr('transform', `translate(${W - 110}, 10)`);
    [{v: false, l: 'Comercial'}, {v: true, l: 'Open-source'}].forEach((d, i) => {
      leg.append('circle').attr('cx', 6).attr('cy', i * 20).attr('r', 6)
        .attr('fill', colorScale(d.v)).attr('opacity', 0.82);
      leg.append('text').attr('x', 16).attr('y', i * 20 + 4)
        .attr('fill', '#aaa').attr('font-size', '11px').text(d.l);
    });
  }

  return { render };
}
