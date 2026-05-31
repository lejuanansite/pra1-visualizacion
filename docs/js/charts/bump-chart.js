// docs/js/charts/bump-chart.js

function initBumpChart(selector, data) {
  const TOP_N = 8;
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
  const COLORS = d3.schemeTableau10;

  function getRankings(data) {
    const byLang = {};
    YEARS.forEach(y => {
      const yearData = data.filter(d => d.year === y).sort((a, b) => b.pct - a.pct);
      yearData.forEach((d, i) => {
        if (!byLang[d.language]) byLang[d.language] = {};
        byLang[d.language][y] = i + 1;
      });
    });
    return byLang;
  }

  function render(container) {
    const width = container.clientWidth || 620;
    const height = container.clientHeight || 500;
    const margin = { top: 30, right: 130, bottom: 30, left: 40 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const rankings = getRankings(data);
    const langs = Object.keys(rankings).filter(l =>
      YEARS.some(y => (rankings[l][y] || 99) <= TOP_N)
    );
    const colorScale = d3.scaleOrdinal(COLORS).domain(langs);

    const xScale = d3.scalePoint().domain(YEARS).range([0, W]);
    const yScale = d3.scaleLinear().domain([1, TOP_N]).range([0, H]);

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Ranking de lenguajes de programación 2020-2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Year axis
    g.append('g').call(d3.axisTop(xScale).tickFormat(d => d))
      .call(g => g.select('.domain').remove())
      .selectAll('text').attr('fill', '#8888aa').attr('font-size', '12px');

    // Lines per language
    const lineGen = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.rank))
      .defined(d => d.rank !== null && d.rank <= TOP_N);

    langs.forEach(lang => {
      const lineData = YEARS.map(y => ({
        year: y,
        rank: rankings[lang][y] && rankings[lang][y] <= TOP_N ? rankings[lang][y] : null
      }));

      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(lang))
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.85)
        .attr('d', lineGen);

      // Dots
      const cls = 'dot-' + lang.replace(/[^a-zA-Z0-9]/g, '_');
      g.selectAll('.' + cls)
        .data(lineData.filter(d => d.rank !== null))
        .join('circle')
        .attr('class', cls)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.rank))
        .attr('r', 5)
        .attr('fill', colorScale(lang))
        .attr('aria-label', d => `${lang} ${d.year} rank ${d.rank}`);
    });

    // Labels on the right (2025 rank)
    langs.forEach(lang => {
      const rank2025 = rankings[lang][2025];
      if (rank2025 && rank2025 <= TOP_N) {
        g.append('text')
          .attr('x', xScale(2025) + 10)
          .attr('y', yScale(rank2025) + 4)
          .attr('fill', colorScale(lang))
          .attr('font-size', '12px')
          .text(lang);
      }
    });

    // ChatGPT milestone annotation
    const x2022 = xScale(2022);
    g.append('line')
      .attr('x1', x2022).attr('x2', x2022)
      .attr('y1', -10).attr('y2', H)
      .attr('stroke', '#ff6b9d').attr('stroke-dasharray', '4,3').attr('stroke-width', 1.5);
    g.append('text')
      .attr('x', x2022 + 5).attr('y', -2)
      .attr('fill', '#ff6b9d').attr('font-size', '11px')
      .text('ChatGPT →');
  }

  return { render };
}
