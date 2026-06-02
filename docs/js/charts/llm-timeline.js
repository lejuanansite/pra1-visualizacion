// docs/js/charts/llm-timeline.js

function initLLMTimeline(selector, data) {
  const MILESTONES = [
    { year: 2020, month: 6,  label: "GPT-3" },
    { year: 2022, month: 11, label: "ChatGPT" },
    { year: 2023, month: 3,  label: "GPT-4" },
    { year: 2023, month: 7,  label: "Llama 2" },
    { year: 2024, month: 3,  label: "Claude 3" },
    { year: 2025, month: 1,  label: "DeepSeek R1" },
  ];

  function toDate(d) {
    return new Date(d.year, (d.month || 6) - 1, 1);
  }

  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tooltip';
      document.body.appendChild(tip);
    }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 650;
    const height = 460;
    // mas margen arriba para las etiquetas de hitos escalonadas
    const margin = { top: 64, right: 30, bottom: 50, left: 60 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    // Only plot models with MMLU and valid dates.
    // Casi no hay modelos con MMLU antes de 2019, asi que arrancamos el eje
    // en 2019 para dar aire a la zona densa (2024-2025) y no dejar medio
    // grafico vacio.
    const validData = data.filter(d => d.mmlu != null && d.year >= 2019 && d.year <= 2026);

    const xScale = d3.scaleTime()
      .domain([new Date(2019, 0, 1), new Date(2026, 6, 1)])
      .range([0, W]);

    const yScale = d3.scaleLinear()
      .domain([40, 95]).range([H, 0]).clamp(true);

    const maxParams = d3.max(validData, d => d.params_b) || 1000;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxParams]).range([2, 16]);

    const colorScale = d3.scaleOrdinal()
      .domain([true, false])
      .range(['#4ecdc4', '#ff6b9d']);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Timeline de modelos LLM 2017-2026: MMLU vs fecha de anuncio');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Axes
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y')))
      .call(ax => ax.select('.domain').attr('stroke', '#444'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .call(ax => ax.select('.domain').attr('stroke', '#444'))
      .selectAll('text').attr('fill', '#8888aa');

    g.append('text').attr('x', -H/2).attr('y', -45)
      .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
      .attr('fill', '#8888aa').attr('font-size', '11px').text('MMLU score');

    // Milestone lines — etiquetas escalonadas en dos alturas por encima del
    // area de ploteo para que no se solapen entre si ni con las burbujas.
    MILESTONES.forEach((m, i) => {
      const x = xScale(new Date(m.year, m.month - 1, 1));
      const labelY = -38 + (i % 2) * 16; // alterna dos alturas
      g.append('line')
        .attr('x1', x).attr('x2', x).attr('y1', labelY + 4).attr('y2', H)
        .attr('stroke', '#ff6b9d').attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1).attr('opacity', 0.55);
      g.append('text').attr('x', x).attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff6b9d').attr('font-size', '10px').attr('font-weight', '600')
        .text(m.label);
    });

    // Bubbles
    g.selectAll('circle')
      .data(validData)
      .join('circle')
      .attr('cx', d => xScale(toDate(d)))
      .attr('cy', d => yScale(d.mmlu))
      .attr('r', d => d.params_b != null ? radiusScale(d.params_b) : 3)
      .attr('fill', d => colorScale(d.open_source))
      .attr('opacity', 0.4)
      .attr('stroke', d => colorScale(d.open_source))
      .attr('stroke-width', 0.6)
      .attr('stroke-opacity', 0.8)
      .attr('tabindex', 0)
      .attr('aria-label', d => `${d.model} (${d.lab}), MMLU ${d.mmlu}`)
      .on('mouseover', (event, d) => {
        tip.style.opacity = '1';
        tip.innerHTML = `<strong>${d.model}</strong><br>${d.lab}<br>MMLU: ${d.mmlu}<br>Params: ${d.params_b != null ? d.params_b + 'B' : 'N/A'}<br>${d.open_source ? 'Open-source' : 'Comercial'}`;
      })
      .on('mousemove', event => {
        tip.style.left = (event.pageX + 12) + 'px';
        tip.style.top = (event.pageY - 28) + 'px';
      })
      .on('mouseout', () => { tip.style.opacity = '0'; });

    // Legend — abajo a la izquierda, donde apenas hay burbujas (2019-2021)
    const leg = g.append('g').attr('transform', `translate(10, ${H - 44})`);
    [{v: false, l: 'Comercial'}, {v: true, l: 'Open-source'}].forEach((d, i) => {
      leg.append('circle').attr('cx', 6).attr('cy', i * 20).attr('r', 6)
        .attr('fill', colorScale(d.v)).attr('opacity', 0.7);
      leg.append('text').attr('x', 16).attr('y', i * 20 + 4)
        .attr('fill', '#aaa').attr('font-size', '11px').text(d.l);
    });
  }

  return { render };
}
