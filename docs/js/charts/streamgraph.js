// docs/js/charts/streamgraph.js

function initStreamgraph(selector, data) {
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

  function render(container) {
    const width = container.clientWidth || 650;
    const height = 380;
    const margin = { top: 40, right: 30, bottom: 50, left: 50 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const langs = [...new Set(data.map(d => d.language))];

    // Build stack data: array of objects {year, lang1: pct, lang2: pct, ...}
    const grouped = {};
    YEARS.forEach(y => { grouped[y] = { year: y }; langs.forEach(l => { grouped[y][l] = 0; }); });
    data.forEach(d => { if (grouped[d.year]) grouped[d.year][d.language] = d.pct; });
    const stackData = YEARS.map(y => grouped[y]);

    const stack = d3.stack().keys(langs).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut);
    const series = stack(stackData);

    const xScale = d3.scaleLinear().domain([2020, 2025]).range([0, W]);
    const yScale = d3.scaleLinear()
      .domain([
        d3.min(series, s => d3.min(s, d => d[0])),
        d3.max(series, s => d3.max(s, d => d[1]))
      ])
      .range([H, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(langs);

    const areaGen = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom);

    const tip = (() => {
      let t = document.querySelector('.tooltip');
      if (!t) { t = document.createElement('div'); t.className = 'tooltip'; document.body.appendChild(t); }
      return t;
    })();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Evolución de la cuota de lenguajes de programación 2020-2025');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    g.append('text').attr('x', 0).attr('y', -20)
      .attr('fill', '#4ecdc4').attr('font-size', '13px').attr('font-weight', '700')
      .text('Popularidad de lenguajes 2020–2025');

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => Math.round(d)))
      .selectAll('text').attr('fill', '#8888aa');

    series.forEach(s => {
      g.append('path').datum(s)
        .attr('fill', colorScale(s.key)).attr('opacity', 0.78)
        .attr('d', areaGen)
        .on('mouseover', (event) => {
          tip.style.opacity = '1';
          tip.innerHTML = `<strong>${s.key}</strong>`;
        })
        .on('mousemove', event => {
          tip.style.left = (event.pageX + 12) + 'px';
          tip.style.top = (event.pageY - 28) + 'px';
        })
        .on('mouseout', () => { tip.style.opacity = '0'; });
    });

    // ChatGPT annotation
    g.append('line')
      .attr('x1', xScale(2022.92)).attr('x2', xScale(2022.92))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#ff6b9d').attr('stroke-dasharray', '4,3').attr('stroke-width', 1.5).attr('opacity', 0.7);
    g.append('text').attr('x', xScale(2022.92) + 4).attr('y', 16)
      .attr('fill', '#ff6b9d').attr('font-size', '10px').text('ChatGPT');

    // Language labels (at 2025 position)
    series.forEach(s => {
      const last = s[s.length - 1];
      const midY = (yScale(last[0]) + yScale(last[1])) / 2;
      if (Math.abs(yScale(last[1]) - yScale(last[0])) > 15) {
        g.append('text').attr('x', xScale(2025) + 4).attr('y', midY + 4)
          .attr('fill', colorScale(s.key)).attr('font-size', '10px').text(s.key);
      }
    });
  }

  return { render };
}
