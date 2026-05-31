// docs/js/main.js

window.AppState = {
  currentAct: 1,
  currentStep: null,
  explorerMetric: 'tool_adoption',
  explorerSegment: 'gender',
  explorerYear: 2025,
  charts: {},
};

window.DataCache = {};

async function loadJSON(path) {
  if (DataCache[path]) return DataCache[path];
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to load ${path}: ${resp.status}`);
  DataCache[path] = await resp.json();
  return DataCache[path];
}

window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
});

window.scrollToAct = function(n) {
  const el = document.getElementById(`act-${n}`);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

async function initScrollytelling() {
  let langData, profileData, expData, llmData, adoptionData,
      capabilityData, countryData, genderData, streamData, sentimentData;

  try {
    [langData, profileData, expData, llmData, adoptionData,
     capabilityData, countryData, genderData, streamData, sentimentData] = await Promise.all([
      loadJSON('data/languages_ranking.json'),
      loadJSON('data/job_roles.json'),
      loadJSON('data/experience.json'),
      loadJSON('data/llm_timeline.json'),
      loadJSON('data/adoption_by_year.json'),
      loadJSON('data/capability_vs_adoption.json'),
      loadJSON('data/adoption_by_country.json'),
      loadJSON('data/gender_adoption.json'),
      loadJSON('data/streamgraph_langs.json'),
      loadJSON('data/sentiment_by_experience.json'),
    ]);
  } catch (e) {
    console.error('Error loading data:', e);
    return;
  }

  // Initialize charts — wrapped in try/catch since chart files may not exist yet
  function tryInit(name, fn) {
    try {
      AppState.charts[name] = fn();
    } catch(e) {
      console.warn(`Chart ${name} not available yet:`, e.message);
    }
  }

  tryInit('areaAdoptionAct1',() => initAreaAdoption('#graphic-1', adoptionData));
  tryInit('llmTimeline',     () => initLLMTimeline('#graphic-2', llmData));
  tryInit('areaAdoption',    () => initAreaAdoption('#graphic-2', adoptionData));
  tryInit('scatterCapability',() => initScatterCapability('#graphic-2', capabilityData));
  tryInit('choropleth',      () => initChoropleth('#graphic-3', countryData));
  tryInit('barGender',       () => initBarGender('#graphic-3', genderData));
  tryInit('streamgraph',     () => initStreamgraph('#graphic-3', streamData));
  tryInit('divergingBars',   () => initDivergingBars('#graphic-3', sentimentData));

  // Scrollama — Acto I
  const scrolly1 = scrollama();
  scrolly1.setup({ step: '#scrolly-1 .step', offset: 0.5 })
    .onStepEnter(({ element }) => {
      AppState.currentStep = element.dataset.step;
      updateGraphicAct1(element.dataset.step);
    });

  // Scrollama — Acto II
  const scrolly2 = scrollama();
  scrolly2.setup({ step: '#scrolly-2 .step', offset: 0.5 })
    .onStepEnter(({ element }) => {
      AppState.currentStep = element.dataset.step;
      updateGraphicAct2(element.dataset.step);
    });

  // Scrollama — Acto III
  const scrolly3 = scrollama();
  scrolly3.setup({ step: '#scrolly-3 .step', offset: 0.5 })
    .onStepEnter(({ element }) => {
      AppState.currentStep = element.dataset.step;
      updateGraphicAct3(element.dataset.step);
    });

  // Explorer init
  const explorerAllData = { langData, genderData, adoptionData };
  try {
    initExplorer('#explorer-chart', explorerAllData);
  } catch(e) {
    console.warn('Explorer not available yet:', e.message);
  }

  document.getElementById('explorer-metric').addEventListener('change', e => {
    AppState.explorerMetric = e.target.value;
    try { updateExplorer(); } catch(e) { /* not ready yet */ }
  });
  document.getElementById('explorer-segment').addEventListener('change', e => {
    AppState.explorerSegment = e.target.value;
    try { updateExplorer(); } catch(e) { /* not ready yet */ }
  });
  document.getElementById('explorer-year').addEventListener('change', e => {
    AppState.explorerYear = parseInt(e.target.value);
    try { updateExplorer(); } catch(e) { /* not ready yet */ }
  });
}

function updateGraphicAct1(step) {
  const g = document.getElementById('graphic-1');
  if (!g || !AppState.charts.areaAdoptionAct1) return;
  g.innerHTML = '';
  // Show progressive data: frozen at 2022 → ChatGPT moment → full chart
  AppState.charts.areaAdoptionAct1.render(g, 2025);
}

function updateGraphicAct2(step) {
  const g = document.getElementById('graphic-2');
  if (!g) return;
  g.innerHTML = '';
  if (step === '2-1' && AppState.charts.llmTimeline) {
    AppState.charts.llmTimeline.render(g);
  } else if (step === '2-2' && AppState.charts.llmTimeline) {
    AppState.charts.llmTimeline.render(g);
  } else if (step === '2-3' && AppState.charts.areaAdoption) {
    AppState.charts.areaAdoption.render(g);
  } else if (step === '2-4' && AppState.charts.scatterCapability) {
    AppState.charts.scatterCapability.render(g);
  }
}

function updateGraphicAct3(step) {
  const g = document.getElementById('graphic-3');
  if (!g) return;
  g.innerHTML = '';
  if (step === '3-1' && AppState.charts.choropleth) {
    AppState.charts.choropleth.render(g);
  } else if (step === '3-2' && AppState.charts.barGender) {
    AppState.charts.barGender.render(g);
  } else if (step === '3-3' && AppState.charts.streamgraph) {
    AppState.charts.streamgraph.render(g);
  } else if (step === '3-4' && AppState.charts.divergingBars) {
    AppState.charts.divergingBars.render(g);
  }
}

document.addEventListener('DOMContentLoaded', initScrollytelling);
