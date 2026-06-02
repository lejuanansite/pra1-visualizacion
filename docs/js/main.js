// docs/js/main.js

window.AppState = {
  currentAct: 1,
  currentStep: null,
  explorerMetric: 'language',
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
  let langData, llmData, capabilityData, streamData,
      toolSlopeData, fearData, ossData, benefitsData, timeSavingData,
      soAdoptionData, paradoxData, frustrationData, agentsData, salaryData, mapData;

  try {
    [langData, llmData, capabilityData, streamData,
     toolSlopeData, fearData, ossData, benefitsData, timeSavingData,
     soAdoptionData, paradoxData, frustrationData, agentsData, salaryData, mapData] = await Promise.all([
      loadJSON('data/languages_ranking.json'),
      loadJSON('data/llm_timeline.json'),
      loadJSON('data/capability_vs_adoption.json'),
      loadJSON('data/streamgraph_langs.json'),
      loadJSON('data/tool_share_by_year.json'),
      loadJSON('data/fear_by_experience.json'),
      loadJSON('data/oss_vs_commercial.json'),
      loadJSON('data/ai_benefits.json'),
      loadJSON('data/time_saving_evolution.json'),
      loadJSON('data/so_ai_adoption.json'),
      loadJSON('data/so_adoption_vs_sentiment.json'),
      loadJSON('data/so_frustration.json'),
      loadJSON('data/so_agents.json'),
      loadJSON('data/so_salary_simpson.json'),
      loadJSON('data/so_adoption_map.json'),
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

  // Acto I
  tryInit('soAdoption',      () => initSoAdoption('#graphic-1', soAdoptionData));
  tryInit('adoptionMap',     () => initAdoptionMap('#graphic-1', mapData));
  // Acto II
  tryInit('llmTimeline',     () => initLLMTimeline('#graphic-2', llmData));
  tryInit('toolSlope',       () => initToolSlope('#graphic-2', toolSlopeData));
  tryInit('scatterCapability',() => initScatterCapability('#graphic-2', capabilityData));
  tryInit('ossCommercial',   () => initOssCommercial('#graphic-2', ossData));
  // Acto III
  tryInit('aiAgents',        () => initAiAgents('#graphic-3', agentsData));
  tryInit('streamgraph',     () => initStreamgraph('#graphic-3', streamData));
  tryInit('aiBenefits',      () => initAiBenefits('#graphic-3', benefitsData));
  tryInit('timeSaving',      () => initTimeSaving('#graphic-3', timeSavingData));
  tryInit('salarySimpson',   () => initSalarySimpson('#graphic-3', salaryData));
  tryInit('fearExperience',  () => initFearExperience('#graphic-3', fearData));
  tryInit('aiFrustration',   () => initAiFrustration('#graphic-3', frustrationData));
  tryInit('adoptionParadox', () => initAdoptionParadox('#graphic-3', paradoxData));

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

  // Explorer init — solo métricas honestas y comparables
  const explorerAllData = { langData, toolSlopeData, timeSavingData };
  try {
    initExplorer('#explorer-chart', explorerAllData);
  } catch(e) {
    console.warn('Explorer not available yet:', e.message);
  }

  document.getElementById('explorer-metric').addEventListener('change', e => {
    AppState.explorerMetric = e.target.value;
    try { updateExplorer(); } catch(e) { /* not ready yet */ }
  });
  document.getElementById('explorer-year').addEventListener('change', e => {
    AppState.explorerYear = parseInt(e.target.value);
    try { updateExplorer(); } catch(e) { /* not ready yet */ }
  });
}

function updateGraphicAct1(step) {
  const g = document.getElementById('graphic-1');
  if (!g) return;
  g.innerHTML = '';
  if (step === '1-2' && AppState.charts.adoptionMap) {
    // mapa: adopcion REAL de IA por pais (Sur Global > Norte rico)
    AppState.charts.adoptionMap.render(g);
  } else if (AppState.charts.soAdoption) {
    // curva real de adopcion 2023->2025 (Stack Overflow, AISelect)
    AppState.charts.soAdoption.render(g, 2025);
  }
}

function updateGraphicAct2(step) {
  const g = document.getElementById('graphic-2');
  if (!g) return;
  g.innerHTML = '';
  if (step === '2-1' && AppState.charts.llmTimeline) {
    AppState.charts.llmTimeline.render(g);
  } else if (step === '2-2' && AppState.charts.toolSlope) {
    AppState.charts.toolSlope.render(g);
  } else if (step === '2-3' && AppState.charts.scatterCapability) {
    AppState.charts.scatterCapability.render(g);
  } else if (step === '2-4' && AppState.charts.ossCommercial) {
    AppState.charts.ossCommercial.render(g);
  }
}

function updateGraphicAct3(step) {
  const g = document.getElementById('graphic-3');
  if (!g) return;
  g.innerHTML = '';
  if (step === '3-1' && AppState.charts.aiAgents) {
    AppState.charts.aiAgents.render(g);
  } else if (step === '3-2' && AppState.charts.streamgraph) {
    AppState.charts.streamgraph.render(g);
  } else if (step === '3-3' && AppState.charts.aiBenefits) {
    AppState.charts.aiBenefits.render(g);
  } else if (step === '3-4' && AppState.charts.timeSaving) {
    AppState.charts.timeSaving.render(g);
  } else if (step === '3-5' && AppState.charts.salarySimpson) {
    AppState.charts.salarySimpson.render(g);
  } else if (step === '3-6' && AppState.charts.fearExperience) {
    AppState.charts.fearExperience.render(g);
  } else if (step === '3-7' && AppState.charts.aiFrustration) {
    AppState.charts.aiFrustration.render(g);
  } else if (step === '3-8' && AppState.charts.adoptionParadox) {
    AppState.charts.adoptionParadox.render(g);
  }
}

document.addEventListener('DOMContentLoaded', initScrollytelling);
