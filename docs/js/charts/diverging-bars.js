// docs/js/charts/diverging-bars.js

function initDivergingBars(selector, data) {
  function render(container) {
    const width = container.clientWidth || 620;
    const height = 420;
    const margin = { top: 40, right: 30, bottom: 50, left: 120 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // Compute net sentiment per experience band
    const POS = ['Hopeful', 'Excited'];
    const NEG = ['Anxious', 'Fearful'];
    const bands = [...new Set(data.map(d => d.code_yrs))];

    const scores = bands.map(band => {
      const rows = data.filter(d => d.code_yrs === band);
      const pos = POS.reduce((s, e) => s + (rows.find(r => r.emotion === e)?.pct || 0), 0);
      const neg = NEG.reduce((s, e) => s + (rows.find(r => r.emotion === e)?.pct || 0), 0);
      return { band, positive: pos, negative: neg, net: pos - neg };
    }).sort((a, b) => a.net - b.net);

    const maxVal = d3.max(scores, d => Math.max(d.positive, d.negative));

    const xScale = d3.scaleLinear().domain([-maxVal, maxVal]).range([0, W]);
    const yScale = d3.scaleBand().domain(scores.map(d => d.band)).range([0, H]).padding(0.2);

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Sentimiento ante la IA por años de experiencia de programación');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    g.append('text').attr('x', 0).attr('y', -20)
      .attr('fill', '#4ecdc4').attr('font-size', '13px').attr('font-weight', '700')
      .text('Sentimiento ante la IA por experiencia');

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => (d > 0 ? '+' : '') + Math.round(d) + '%'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g').call(d3.axisLeft(yScale).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '10px').attr('fill', '#cccccc');

    // Center line
    g.append('line')
      .attr('x1', xScale(0)).attr('x2', xScale(0))
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', '#444').attr('stroke-width', 1);

    scores.forEach(d => {
      // Positive (hopeful + excited)
      g.append('rect')
        .attr('x', xScale(0)).attr('y', yScale(d.band))
        .attr('width', xScale(d.positive) - xScale(0))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#4ecdc4').attr('opacity', 0.78).attr('rx', 2)
        .attr('aria-label', `${d.band}: positivo ${d.positive.toFixed(1)}%`);

      // Negative (anxious + fearful)
      g.append('rect')
        .attr('x', xScale(-d.negative)).attr('y', yScale(d.band))
        .attr('width', xScale(0) - xScale(-d.negative))
        .attr('height', yScale.bandwidth())
        .attr('fill', '#ff6b9d').attr('opacity', 0.78).attr('rx', 2)
        .attr('aria-label', `${d.band}: negativo ${d.negative.toFixed(1)}%`);
    });

    // Legend
    const leg = g.append('g').attr('transform', `translate(${W - 160}, -20)`);
    [{c: '#4ecdc4', l: 'Hopeful + Excited'}, {c: '#ff6b9d', l: 'Anxious + Fearful'}].forEach((d, i) => {
      leg.append('rect').attr('x', 0).attr('y', i * 16).attr('width', 12).attr('height', 12)
        .attr('fill', d.c).attr('opacity', 0.78);
      leg.append('text').attr('x', 16).attr('y', i * 16 + 10)
        .attr('fill', '#aaa').attr('font-size', '10px').text(d.l);
    });
  }

  return { render };
}
