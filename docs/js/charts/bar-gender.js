// docs/js/charts/bar-gender.js

function initBarGender(selector, data) {
  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 620;
    const height = 420;
    const margin = { top: 40, right: 30, bottom: 20, left: 140 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const genders = ['Male', 'Female'];
    const toolData = data.filter(d => d.dimension === 'tool_adoption' && genders.includes(d.gender));
    const tools = [...new Set(toolData.map(d => d.tool))];

    const colorGender = d3.scaleOrdinal().domain(genders).range(['#7b7bff', '#ff6b9d']);

    const xScale = d3.scaleLinear().domain([0, 60]).range([0, W]);
    const yScale = d3.scaleBand().domain(tools).range([0, H]).padding(0.3);
    const yInner = d3.scaleBand().domain(genders).range([0, yScale.bandwidth()]).padding(0.08);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Adopción de herramientas IA por género en 2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    g.append('text').attr('x', 0).attr('y', -20)
      .attr('fill', '#4ecdc4').attr('font-size', '13px').attr('font-weight', '700')
      .text('Adopción de IA por género (2025)');

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(yScale).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '11px').attr('fill', '#cccccc');

    tools.forEach(tool => {
      genders.forEach(gender => {
        const d = toolData.find(r => r.tool === tool && r.gender === gender);
        if (!d) return;
        g.append('rect')
          .attr('y', yScale(tool) + yInner(gender))
          .attr('height', yInner.bandwidth())
          .attr('width', xScale(d.pct))
          .attr('fill', colorGender(gender))
          .attr('opacity', 0.8).attr('rx', 2)
          .attr('tabindex', 0)
          .attr('aria-label', `${gender} ${tool}: ${d.pct}%`)
          .on('mouseover', (event) => {
            tip.style.opacity = '1';
            tip.innerHTML = `<strong>${tool}</strong><br>${gender}: ${d.pct}%<br>n=${d.n}`;
          })
          .on('mousemove', event => {
            tip.style.left = (event.pageX + 12) + 'px';
            tip.style.top = (event.pageY - 28) + 'px';
          })
          .on('mouseout', () => { tip.style.opacity = '0'; });
      });
    });

    // Legend
    const leg = g.append('g').attr('transform', `translate(${W - 110}, -20)`);
    genders.forEach((gender, i) => {
      leg.append('rect').attr('x', i * 80).attr('width', 12).attr('height', 12)
        .attr('fill', colorGender(gender)).attr('opacity', 0.8);
      leg.append('text').attr('x', i * 80 + 16).attr('y', 10)
        .attr('fill', '#ccc').attr('font-size', '11px').text(gender);
    });
  }

  return { render };
}
