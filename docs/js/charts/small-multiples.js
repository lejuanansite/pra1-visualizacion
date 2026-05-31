// docs/js/charts/small-multiples.js

function initSmallMultiples(selector, data) {
  function render(container) {
    const width = container.clientWidth || 620;
    const height = 420;
    const margin = { top: 30, right: 20, bottom: 20, left: 160 };
    const years = [2020, 2021, 2022];
    const panelW = (width - margin.left - margin.right) / years.length;
    const H = height - margin.top - margin.bottom;

    // Top 6 roles by average pct across years
    const roleAvg = {};
    data.forEach(d => {
      if (!roleAvg[d.role]) roleAvg[d.role] = [];
      roleAvg[d.role].push(d.pct);
    });
    const topRoles = Object.entries(roleAvg)
      .map(([role, vals]) => ({ role, avg: vals.reduce((a,b) => a+b, 0) / vals.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
      .map(d => d.role);

    const maxPct = d3.max(data.filter(d => topRoles.includes(d.role)), d => d.pct);

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Distribución de roles de desarrollador 2020-2022');

    years.forEach((year, i) => {
      const yearData = data.filter(d => d.year === year && topRoles.includes(d.role))
        .sort((a, b) => b.pct - a.pct);

      const xScale = d3.scaleLinear()
        .domain([0, maxPct]).range([0, panelW - 10]);
      const yScale = d3.scaleBand()
        .domain(topRoles).range([margin.top, margin.top + H]).padding(0.25);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left + i * panelW}, 0)`);

      // Panel year label
      g.append('text').attr('x', 0).attr('y', 18)
        .attr('font-size', '13px').attr('fill', '#7b7bff').attr('font-weight', '700')
        .text(year);

      // Bars
      g.selectAll('rect').data(yearData).join('rect')
        .attr('y', d => yScale(d.role))
        .attr('height', yScale.bandwidth())
        .attr('width', d => xScale(d.pct))
        .attr('fill', '#7b7bff').attr('opacity', 0.72).attr('rx', 2)
        .attr('aria-label', d => `${d.role} ${year}: ${d.pct}%`);

      // Left axis only on first panel
      if (i === 0) {
        g.append('g')
          .call(d3.axisLeft(yScale).tickSize(0))
          .call(g => g.select('.domain').remove())
          .selectAll('text').attr('font-size', '10px').attr('fill', '#8888aa');
      }
    });
  }

  return { render };
}
