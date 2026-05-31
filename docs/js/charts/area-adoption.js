// docs/js/charts/area-adoption.js

function initAreaAdoption(selector, data) {
  const MILESTONES = [
    { year: 2022.92, label: "ChatGPT" },
    { year: 2024.25, label: "Claude 3" },
  ];

  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container, upToYear) {
    const width = container.clientWidth || 650;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 65 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // Filter data up to upToYear if specified
    const visibleData = upToYear ? data.filter(d => d.year <= upToYear) : data;

    // Always keep x domain fixed 2020-2025 for visual consistency
    const xScale = d3.scaleLinear().domain([2020, 2025]).range([0, W]);
    const yScale = d3.scaleLinear().domain([0, 80]).range([H, 0]);

    const areaGen = d3.area()
      .defined(d => d.any_ai_pct != null)
      .x(d => xScale(d.year))
      .y0(H).y1(d => yScale(d.any_ai_pct))
      .curve(d3.curveMonotoneX);

    const lineGen = d3.line()
      .defined(d => d.any_ai_pct != null)
      .x(d => xScale(d.year))
      .y(d => yScale(d.any_ai_pct))
      .curve(d3.curveMonotoneX);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Índice de adopción de IA en desarrollo 2020-2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => Math.round(d)))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    // "No data" annotation for 2020-2022
    g.append('text').attr('x', xScale(2021)).attr('y', H - 10)
      .attr('text-anchor', 'middle').attr('fill', '#555').attr('font-size', '10px')
      .text('sin datos (no se preguntó)');

    g.append('path').datum(visibleData)
      .attr('fill', '#ff6b9d').attr('opacity', 0.18).attr('d', areaGen);

    g.append('path').datum(visibleData)
      .attr('fill', 'none').attr('stroke', '#ff6b9d').attr('stroke-width', 2.5)
      .attr('d', lineGen);

    // Data points
    g.selectAll('circle')
      .data(visibleData.filter(d => d.any_ai_pct != null))
      .join('circle')
      .attr('cx', d => xScale(d.year)).attr('cy', d => yScale(d.any_ai_pct))
      .attr('r', 5).attr('fill', '#ff6b9d')
      .attr('aria-label', d => `${d.year}: ${d.any_ai_pct}%`)
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.year}</strong><br>${d.any_ai_pct}% usan IA para código`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    // Milestone annotations — only show if within visible range
    const maxVisibleYear = upToYear || 2025;
    MILESTONES.filter(m => m.year <= maxVisibleYear).forEach(m => {
      g.append('line')
        .attr('x1', xScale(m.year)).attr('x2', xScale(m.year))
        .attr('y1', 0).attr('y2', H)
        .attr('stroke', '#ff6b9d').attr('stroke-dasharray', '3,3').attr('opacity', 0.6);
      g.append('text').attr('x', xScale(m.year) + 3).attr('y', 14)
        .attr('fill', '#ff6b9d').attr('font-size', '10px').text(m.label);
    });

    // Value labels on data points
    visibleData.filter(d => d.any_ai_pct != null).forEach(d => {
      g.append('text')
        .attr('x', xScale(d.year))
        .attr('y', yScale(d.any_ai_pct) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff6b9d').attr('font-size', '11px').attr('font-weight', '600')
        .text(d.any_ai_pct + '%');
    });
  }

  return { render };
}
