// docs/js/charts/choropleth.js

function initChoropleth(selector, countryData) {
  const adoptionMap = {};
  countryData.forEach(d => {
    adoptionMap[d.country.toLowerCase()] = d;
  });

  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 700;
    const height = 400;

    const colorScale = d3.scaleSequential()
      .domain([0, 80])
      .interpolator(d3.interpolateBlues);

    const tip = getOrCreateTooltip();

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Mapa de adopción de herramientas IA por país en 2025');

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2]);
    const pathGen = d3.geoPath().projection(projection);

    // Background
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#0f1117');

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
      const countries = topojson.feature(world, world.objects.countries);

      svg.selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => {
          const name = (d.properties && d.properties.name) ? d.properties.name.toLowerCase() : '';
          const match = adoptionMap[name];
          return match ? colorScale(match.adoption_pct) : '#2a2a3a';
        })
        .attr('stroke', '#1a1a2a').attr('stroke-width', 0.3)
        .attr('tabindex', 0)
        .attr('aria-label', d => {
          const name = d.properties && d.properties.name ? d.properties.name : '';
          const match = adoptionMap[name.toLowerCase()];
          return match ? `${name}: ${match.adoption_pct}% adopción IA` : name;
        })
        .on('mouseover', (event, d) => {
          const name = d.properties && d.properties.name ? d.properties.name : '';
          const match = adoptionMap[name.toLowerCase()];
          if (match) {
            tip.style.opacity = '1';
            tip.innerHTML = `<strong>${name}</strong><br>Adopción IA: ${match.adoption_pct}%<br>n=${match.n}`;
          }
        })
        .on('mousemove', event => {
          tip.style.left = (event.pageX + 12) + 'px';
          tip.style.top = (event.pageY - 28) + 'px';
        })
        .on('mouseout', () => { tip.style.opacity = '0'; });

      // Color legend
      const legendW = 150, legendH = 10;
      const legendX = width - legendW - 20;
      const legendY = height - 30;
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'choro-grad');
      grad.append('stop').attr('offset', '0%').attr('stop-color', colorScale(0));
      grad.append('stop').attr('offset', '100%').attr('stop-color', colorScale(80));
      svg.append('rect').attr('x', legendX).attr('y', legendY)
        .attr('width', legendW).attr('height', legendH)
        .attr('fill', 'url(#choro-grad)').attr('rx', 2);
      svg.append('text').attr('x', legendX).attr('y', legendY - 4)
        .attr('fill', '#8888aa').attr('font-size', '9px').text('0%');
      svg.append('text').attr('x', legendX + legendW).attr('y', legendY - 4)
        .attr('text-anchor', 'end').attr('fill', '#8888aa').attr('font-size', '9px').text('80%+');
    });
  }

  return { render };
}
