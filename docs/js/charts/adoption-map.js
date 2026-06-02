// docs/js/charts/adoption-map.js
// Mapa coroplético de la adopción REAL de IA por país (Stack Overflow 2025,
// AISelect con opción "No" → denominador limpio). Hallazgo contraintuitivo:
// el Sur Global adopta MÁS que el Norte rico. id = ISO 3166-1 numeric.
// Carga el TopoJSON world-atlas de forma perezosa (solo este chart lo usa).

function initAdoptionMap(selector, data) {
  const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  let worldPromise = null;
  const loadWorld = () => (worldPromise ||= fetch(WORLD_URL).then(r => r.json()));

  function getOrCreateTooltip() {
    let tip = document.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; document.body.appendChild(tip); }
    return tip;
  }

  function render(container) {
    const width = container.clientWidth || 700;
    const height = 460;
    const byId = new Map(data.countries.map(d => [d.id, d]));

    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Mapa de adopción de IA por país: el Sur Global adopta más que el Norte rico');

    // escala de color: el rango real (~67–92%) es estrecho, así que estiramos
    // el dominio para que el contraste Norte (pálido) / Sur (intenso) se lea.
    const ext = d3.extent(data.countries, d => d.adopt);
    const color = d3.scaleSequential(t => d3.interpolateViridis(0.15 + t * 0.8))
      .domain([ext[0] - 2, ext[1]]);
    const tip = getOrCreateTooltip();

    loadWorld().then(world => {
      if (typeof topojson === 'undefined') return;
      const countries = topojson.feature(world, world.objects.countries);
      const projection = d3.geoNaturalEarth1().fitSize([width, height - 40], countries);
      const path = d3.geoPath(projection);

      const g = svg.append('g');
      g.selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
          const rec = byId.get(+d.id);
          return rec ? color(rec.adopt) : '#222230';
        })
        .attr('stroke', '#0d0d12').attr('stroke-width', 0.4)
        .style('cursor', d => byId.get(+d.id) ? 'pointer' : 'default')
        .on('mouseover', (e, d) => {
          const rec = byId.get(+d.id);
          if (!rec) return;
          tip.style.opacity = '1';
          tip.innerHTML = `<strong>${rec.name}</strong><br>Usa IA: ${rec.adopt}%<br>n=${rec.n.toLocaleString('es')}`;
        })
        .on('mousemove', e => { tip.style.left = (e.pageX + 12) + 'px'; tip.style.top = (e.pageY - 28) + 'px'; })
        .on('mouseout', () => { tip.style.opacity = '0'; });

      drawLegend(svg, color, ext, width);
      drawSummary(svg, data.summary, width, height, color);
    });
  }

  function drawLegend(svg, color, ext, width) {
    const w = 160, h = 10, x0 = width - w - 16, y0 = 14;
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'mapgrad');
    d3.range(0, 1.01, 0.1).forEach(t => {
      grad.append('stop').attr('offset', `${t * 100}%`)
        .attr('stop-color', color(ext[0] - 5 + t * (ext[1] - (ext[0] - 5))));
    });
    svg.append('rect').attr('x', x0).attr('y', y0).attr('width', w).attr('height', h)
      .attr('rx', 2).attr('fill', 'url(#mapgrad)');
    [[ext[0], x0], [ext[1], x0 + w]].forEach(([v, xx], i) => {
      svg.append('text').attr('x', xx).attr('y', y0 - 4)
        .attr('text-anchor', i ? 'end' : 'start')
        .attr('fill', '#8888aa').attr('font-size', '10px').text(`${Math.round(v)}%`);
    });
    svg.append('text').attr('x', x0).attr('y', y0 + h + 14)
      .attr('fill', '#aaa').attr('font-size', '10px').text('% que usa IA para programar');
  }

  function drawSummary(svg, s, width, height, color) {
    const g = svg.append('g').attr('transform', `translate(16, ${height - 56})`);
    const rows = [
      ['Sur Global / emergentes', s.sur.adopt, color(s.sur.adopt)],
      ['Norte Global (rico)', s.norte.adopt, color(s.norte.adopt)],
    ];
    g.append('text').attr('x', 0).attr('y', -8)
      .attr('fill', '#cccccc').attr('font-size', '11px').attr('font-weight', '600')
      .text('Adopción media de IA por bloque:');
    rows.forEach(([lbl, val, col], i) => {
      const yy = i * 18;
      g.append('rect').attr('x', 0).attr('y', yy).attr('width', val * 1.4).attr('height', 12)
        .attr('rx', 2).attr('fill', col).attr('opacity', 0.85);
      g.append('text').attr('x', val * 1.4 + 8).attr('y', yy + 10)
        .attr('fill', '#dddddd').attr('font-size', '11px').attr('font-weight', '700')
        .text(`${val}% · ${lbl}`);
    });
  }

  return { render };
}
