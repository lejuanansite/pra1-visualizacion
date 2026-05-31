// docs/js/charts/explorer.js

let _explorerContainer = null;
let _explorerData = null;

function initExplorer(containerSelector, allData) {
  _explorerContainer = document.querySelector(containerSelector);
  _explorerData = allData;
  updateExplorer();
}

function updateExplorer() {
  if (!_explorerContainer || !_explorerData) return;
  _explorerContainer.innerHTML = '';

  const metric = AppState.explorerMetric;
  const segment = AppState.explorerSegment;
  const year = AppState.explorerYear;

  let chartData = [];

  if (metric === 'tool_adoption' && segment === 'gender') {
    // Tool adoption by gender (from genderData, dimension=tool_adoption)
    const rows = _explorerData.genderData.filter(d => d.dimension === 'tool_adoption');
    const tools = [...new Set(rows.map(d => d.tool))];
    tools.forEach(tool => {
      ['Male', 'Female'].forEach(gender => {
        const r = rows.find(d => d.tool === tool && d.gender === gender);
        if (r) chartData.push({ label: `${tool} (${gender === 'Male' ? 'H' : 'M'})`, value: r.pct, group: gender });
      });
    });
  } else if (metric === 'emotion' && segment === 'gender') {
    // Emotion distribution by gender (from genderData, dimension=emotion)
    const rows = _explorerData.genderData.filter(d => d.dimension === 'emotion');
    const emotions = ['Hopeful', 'Excited', 'Uncertain', 'Anxious', 'Fearful'];
    emotions.forEach(emotion => {
      ['Male', 'Female'].forEach(gender => {
        const r = rows.find(d => d.emotion === emotion && d.gender === gender);
        if (r) chartData.push({ label: `${emotion} (${gender === 'Male' ? 'H' : 'M'})`, value: r.pct, group: gender });
      });
    });
  } else if (metric === 'language') {
    // Language usage for selected year
    chartData = _explorerData.langData
      .filter(d => d.year === year)
      .map(d => ({ label: d.language, value: d.pct, group: 'lang' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  } else if (metric === 'tool_adoption' && segment === 'experience') {
    // For experience segment: show adoption by year using adoptionData
    const yearRow = _explorerData.adoptionData.find(d => d.year === year);
    if (yearRow && yearRow.tools) {
      chartData = Object.entries(yearRow.tools)
        .map(([tool, pct]) => ({ label: tool, value: pct, group: 'tool' }))
        .sort((a, b) => b.value - a.value);
    }
  } else {
    // Fallback: language for selected year
    chartData = _explorerData.langData
      .filter(d => d.year === year)
      .map(d => ({ label: d.language, value: d.pct, group: 'lang' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  if (chartData.length === 0) {
    _explorerContainer.innerHTML = '<p style="color:#8888aa;padding:1rem">No hay datos disponibles para esta combinación.</p>';
    return;
  }

  renderExplorerBar(_explorerContainer, chartData);
}

function renderExplorerBar(container, data) {
  const width = container.clientWidth || 750;
  const height = Math.max(280, data.length * 34 + 60);
  const margin = { top: 20, right: 80, bottom: 30, left: 200 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;

  const maxVal = d3.max(data, d => d.value);
  const xScale = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, W]);
  const yScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, H]).padding(0.2);

  const colorMap = {
    'Male': '#7b7bff',
    'Female': '#ff6b9d',
    'lang': '#4ecdc4',
    'tool': '#ff9f43',
  };

  const svg = d3.select(container).append('svg')
    .attr('width', width).attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', 'Gráfico de exploración de datos');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g').attr('transform', `translate(0,${H})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + '%'))
    .selectAll('text').attr('fill', '#8888aa').attr('font-size', '11px');

  g.append('g').call(d3.axisLeft(yScale).tickSize(0))
    .call(ax => ax.select('.domain').remove())
    .selectAll('text').attr('font-size', '11px').attr('fill', '#cccccc');

  g.selectAll('rect').data(data).join('rect')
    .attr('y', d => yScale(d.label))
    .attr('height', yScale.bandwidth())
    .attr('width', d => xScale(d.value))
    .attr('fill', d => colorMap[d.group] || '#4ecdc4')
    .attr('opacity', 0.8).attr('rx', 3)
    .attr('tabindex', 0)
    .attr('aria-label', d => `${d.label}: ${d.value}%`);

  // Value labels on bars
  g.selectAll('.val-lbl').data(data).join('text')
    .attr('class', 'val-lbl')
    .attr('x', d => xScale(d.value) + 5)
    .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2 + 4)
    .attr('fill', '#cccccc').attr('font-size', '11px')
    .text(d => d.value + '%');
}
