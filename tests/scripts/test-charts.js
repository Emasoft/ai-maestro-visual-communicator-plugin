// test-charts.js
//
// Dev-browser script — exercises scripts/amvcp-chart.js, the Phase-2
// chart runtime module (visualizing backlog §4, build #8).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpChart` + Node `module.exports`). This suite loads it AS A
// BROWSER GLOBAL from charts-runtime.html — a self-contained page that
// loads amvcp-designmd.js then amvcp-chart.js, embeds a DESIGN.md, and
// (because window.__vcManualInit is set) lets a small inline boot script
// apply the engine tokens, inject the chart CSS, and call scan()
// deterministically. The page contains one fenced `chart:<type>@1` block
// per chart family plus deliberately malformed blocks.
//
// Coverage (chart-spec.md §6 test plan):
//   testBarRenders            chart:bar -> figure.ve-chart + N rects, marked
//   testBarSparseGridlines    bar draws <=4 horizontal rules, 0 vertical
//   testPieRemapsToBar        chart:pie renders a bar figure, not a pie
//   testMissingTitleFailsLoud no title -> visible .ve-chart-error block
//   testMalformedJsonDegrades broken JSON -> .ve-chart-error keeps text
//   testLineDrawsPath         chart:line -> non-empty path; area adds grad
//   testWaterfallRiseFall     rise/fall/total bars use the right tokens
//   testMarkSelectable        clicking a bar adds it to the selection
//   testKeyboardToggle        Space on a focused mark toggles selection
//   testThemeSwapRestyles     accent swap re-themes an SVG bar live
//   testDonutSweep            chart:donut -> N arcs, a true hole, marked
//   testRadarInflate          chart:radar -> a polygon, 1 vertex per axis
//   testHeatmapRamp           chart:heatmap -> cell grid, ramp applied
//   testCanvasThreshold       >100-point bar -> a canvas + a11y <ul>
//   testUnknownTypeDegrades   unknown type -> visible error block
//   testNoNestedScrollbar     a wide chart has overflow:visible, no scroller
//   testMetricCards           chart:metric-cards -> KPI tiles, marked
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/charts-runtime.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until both globals are installed AND the
// inline boot script has finished (window.__vcFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpChart === 'object'
      && typeof window.amvcpChart.scan === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__vcFixtureReady === true || !!window.__vcFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vcFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(80);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Find the rendered <figure.ve-chart> for a given chart type. Returns a
// 0-based ordinal among same-type figures (default first).
function figureSelector(type, ordinal) {
  const idx = (ordinal || 0) + 1;
  return 'figure.ve-chart[data-ve-chart-type="' + type + '"]:nth-of-type('
    + idx + ')';
}

// ── Tests ───────────────────────────────────────────────────────────

async function testBarRenders(page) {
  // chart:bar@1 -> a <figure.ve-chart> holding N <rect.ve-chart-bar>,
  // each carrying data-ve-id + data-ve-type="chart-point".
  const s = await setup(page);
  if (!s.ok) {
    record('chart_bar_renders', 'FAIL',
      'bar block renders a figure with marked rects', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    if (!fig) { return { fig: false }; }
    const bars = fig.querySelectorAll('.ve-chart-bar');
    let marked = 0;
    for (let i = 0; i < bars.length; i++) {
      if (bars[i].getAttribute('data-ve-id')
          && bars[i].getAttribute('data-ve-type') === 'chart-point') {
        marked++;
      }
    }
    return {
      fig: true,
      isChart: fig.getAttribute('data-ve-type') === 'chart',
      barCount: bars.length,
      marked: marked,
      hasTitle: !!fig.querySelector('.ve-chart-title'),
      hasSvg: !!fig.querySelector('svg.ve-chart-svg')
    };
  });
  const ok = res.fig === true && res.isChart === true
    && res.barCount === 4 && res.marked === 4
    && res.hasTitle === true && res.hasSvg === true;
  record('chart_bar_renders', ok ? 'PASS' : 'FAIL',
    'chart:bar@1 -> figure.ve-chart with 4 marked rects + title + svg',
    JSON.stringify(res));
}

async function testBarSparseGridlines(page) {
  // Guardrail §6 rule 2 — a bar chart draws <=4 horizontal gridlines and
  // ZERO vertical ones.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_bar_sparse_gridlines', 'FAIL',
      'bar draws <=4 horizontal gridlines, 0 vertical', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    if (!fig) { return { fig: false }; }
    const lines = fig.querySelectorAll('.ve-chart-gridline');
    let vertical = 0, horizontal = 0;
    for (let i = 0; i < lines.length; i++) {
      const x1 = parseFloat(lines[i].getAttribute('x1'));
      const x2 = parseFloat(lines[i].getAttribute('x2'));
      const y1 = parseFloat(lines[i].getAttribute('y1'));
      const y2 = parseFloat(lines[i].getAttribute('y2'));
      if (Math.abs(y1 - y2) < 0.5 && Math.abs(x1 - x2) > 0.5) {
        horizontal++;
      } else if (Math.abs(x1 - x2) < 0.5) {
        vertical++;
      }
    }
    return { fig: true, total: lines.length, horizontal, vertical };
  });
  const ok = res.fig === true && res.vertical === 0
    && res.horizontal > 0 && res.horizontal <= 4;
  record('chart_bar_sparse_gridlines', ok ? 'PASS' : 'FAIL',
    'bar gridlines: <=4 horizontal rules, zero vertical (guardrail)',
    JSON.stringify(res));
}

async function testPieRemapsToBar(page) {
  // Guardrail §6 rule 1 — chart:pie@1 must render a bar figure, never a
  // pie. The fixture's pie block is the LAST data-ve-chart-type="bar"
  // figure that is not the 120-bar canvas one.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_pie_remaps_to_bar', 'FAIL',
      'pie remaps to a sorted bar (guardrail)', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    // No figure should ever declare type "pie".
    const pieFig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="pie"]');
    // The pie block's title is "Budget split" — find that figure.
    const figs = document.querySelectorAll('figure.ve-chart');
    let budgetFig = null;
    for (let i = 0; i < figs.length; i++) {
      const cap = figs[i].querySelector('.ve-chart-title');
      if (cap && cap.textContent.indexOf('Budget split') >= 0) {
        budgetFig = figs[i];
      }
    }
    return {
      noPieFigure: !pieFig,
      budgetFound: !!budgetFig,
      budgetIsBar: budgetFig
        ? budgetFig.getAttribute('data-ve-chart-type') === 'bar' : false,
      budgetHasBars: budgetFig
        ? budgetFig.querySelectorAll('.ve-chart-bar').length : 0,
      budgetHasArcs: budgetFig
        ? budgetFig.querySelectorAll('.ve-chart-arc').length : 0
    };
  });
  const ok = res.noPieFigure === true && res.budgetFound === true
    && res.budgetIsBar === true && res.budgetHasBars === 3
    && res.budgetHasArcs === 0;
  record('chart_pie_remaps_to_bar', ok ? 'PASS' : 'FAIL',
    'chart:pie@1 renders a bar figure with 3 bars, no pie arcs',
    JSON.stringify(res));
}

async function testMissingTitleFailsLoud(page) {
  // Fail-fast — a block with no `title` becomes a VISIBLE
  // .ve-chart-error block with a banner, NOT a blank figure.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_missing_title_fails_loud', 'FAIL',
      'missing title -> visible error block', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const errs = document.querySelectorAll('.ve-chart-error');
    let titleErr = null;
    for (let i = 0; i < errs.length; i++) {
      const banner = errs[i].querySelector('.ve-chart-error-banner');
      if (banner && banner.textContent.indexOf("required 'title'") >= 0) {
        titleErr = errs[i];
      }
    }
    if (!titleErr) { return { found: false }; }
    const cs = getComputedStyle(titleErr);
    return {
      found: true,
      visible: cs.display !== 'none' && titleErr.offsetHeight > 0,
      keepsSrc: !!titleErr.querySelector('.ve-chart-error-src')
    };
  });
  const ok = res.found === true && res.visible === true
    && res.keepsSrc === true;
  record('chart_missing_title_fails_loud', ok ? 'PASS' : 'FAIL',
    'no-title block -> visible .ve-chart-error banner, not a blank box',
    JSON.stringify(res));
}

async function testMalformedJsonDegrades(page) {
  // Fail-fast — a syntactically broken JSON block degrades to a
  // .ve-chart-error that keeps the original text + a parser message.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_malformed_json_degrades', 'FAIL',
      'malformed JSON -> error block keeps text', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const errs = document.querySelectorAll('.ve-chart-error');
    let jsonErr = null;
    for (let i = 0; i < errs.length; i++) {
      const banner = errs[i].querySelector('.ve-chart-error-banner');
      if (banner && banner.textContent.toLowerCase()
            .indexOf('invalid json') >= 0) {
        jsonErr = errs[i];
      }
    }
    if (!jsonErr) { return { found: false }; }
    const src = jsonErr.querySelector('.ve-chart-error-src');
    return {
      found: true,
      keepsBrokenText: !!src && src.textContent.indexOf('"Broken"') >= 0,
      hasBanner: !!jsonErr.querySelector('.ve-chart-error-banner')
    };
  });
  const ok = res.found === true && res.keepsBrokenText === true
    && res.hasBanner === true;
  record('chart_malformed_json_degrades', ok ? 'PASS' : 'FAIL',
    'broken-JSON block -> .ve-chart-error keeps the source + a banner',
    JSON.stringify(res));
}

async function testLineDrawsPath(page) {
  // chart:line@1 -> a <path.ve-chart-line> with a non-empty d; the area
  // variant additionally renders <path.ve-chart-area> + a <linearGradient>.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_line_draws_path', 'FAIL',
      'line draws a path; area adds a gradient fill', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const lineFig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="line"]');
    const areaFig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="area"]');
    let lineD = '', areaD = '', hasGrad = false;
    if (lineFig) {
      const p = lineFig.querySelector('.ve-chart-line');
      lineD = p ? (p.getAttribute('d') || '') : '';
    }
    if (areaFig) {
      const a = areaFig.querySelector('.ve-chart-area');
      areaD = a ? (a.getAttribute('d') || '') : '';
      hasGrad = !!areaFig.querySelector('linearGradient');
    }
    return {
      lineFound: !!lineFig,
      lineDLen: lineD.length,
      areaFound: !!areaFig,
      areaDLen: areaD.length,
      hasGrad: hasGrad
    };
  });
  const ok = res.lineFound === true && res.lineDLen > 10
    && res.areaFound === true && res.areaDLen > 10
    && res.hasGrad === true;
  record('chart_line_draws_path', ok ? 'PASS' : 'FAIL',
    'line -> non-empty path d; area -> path + linearGradient fill',
    JSON.stringify(res));
}

async function testWaterfallRiseFall(page) {
  // chart:waterfall@1 -> rise bars use the success token, fall bars the
  // danger token, the total bar the accent token (computed fill).
  const s = await setup(page);
  if (!s.ok) {
    record('chart_waterfall_rise_fall', 'FAIL',
      'waterfall rise/fall/total use the right tokens', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="waterfall"]');
    if (!fig) { return { fig: false }; }
    function fillOf(sel) {
      const el = fig.querySelector(sel);
      return el ? getComputedStyle(el).fill : '';
    }
    const rise = fillOf('.ve-chart-wf-bar--rise');
    const fall = fillOf('.ve-chart-wf-bar--fall');
    const total = fillOf('.ve-chart-wf-bar--total');
    // Resolve the three theme tokens for comparison.
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    probe.style.color = 'var(--vc-color-success)';
    const success = getComputedStyle(probe).color;
    probe.style.color = 'var(--vc-color-danger)';
    const danger = getComputedStyle(probe).color;
    probe.style.color = 'var(--vc-color-accent)';
    const accent = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return {
      fig: true, rise, fall, total, success, danger, accent,
      riseMatch: rise === success,
      fallMatch: fall === danger,
      totalMatch: total === accent
    };
  });
  const ok = res.fig === true && res.riseMatch === true
    && res.fallMatch === true && res.totalMatch === true;
  record('chart_waterfall_rise_fall', ok ? 'PASS' : 'FAIL',
    'waterfall rise=success, fall=danger, total=accent (computed fill)',
    JSON.stringify(res));
}

async function testMarkSelectable(page) {
  // Clicking a <rect.ve-chart-bar> adds it to the selection as
  // type:'chart-point' with the veWireChart-shaped data payload. The
  // module's internal fallback selection is observable via __veChart.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_mark_selectable', 'FAIL',
      'clicking a bar adds it to the selection', s.error);
    return;
  }
  // Clear any prior selection, then click the first bar by its bbox.
  await page.evaluate(() => window.__veChart.clearSelection());
  // Wait for the bar's entry animation (CSS scaleY(0)->scaleY(1) over
  // ~600ms) to complete so the rect has its FULLY PAINTED height. The
  // previous threshold of `h > 4` was deterministic about "rendered at
  // all" but not about "animation done" — under headless Chromium the
  // poll could resolve mid-animation and the bar would still be moving
  // when the click landed, so the click missed the rect entirely.
  //
  // Two layered guards:
  // 1. Poll until height stops growing across two consecutive samples
  //    (animation has plateaued).
  // 2. Re-read the bbox immediately before clicking (R11 in
  //    ~/.claude/rules/browser-ui-test-techniques.md — stale
  //    coordinates are the #1 source of flake).
  const deadline = Date.now() + 2500;
  let prevH = -1;
  while (Date.now() < deadline) {
    const sample = await page.evaluate(() => {
      const fig = document.querySelector(
        'figure.ve-chart[data-ve-chart-type="bar"]');
      const bar = fig && fig.querySelector('.ve-chart-bar');
      return bar ? bar.getBoundingClientRect().height : 0;
    });
    if (sample > 4 && sample === prevH) { break; }
    prevH = sample;
    await page.waitForTimeout(80);
  }
  // Re-read coordinates AFTER the animation has settled — never trust
  // stale bbox values cached from earlier in the wait loop.
  const box = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    const bar = fig.querySelector('.ve-chart-bar');
    const r = bar.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  });
  await page.mouse.click(box.cx, box.cy);
  await page.waitForTimeout(150);
  const res = await page.evaluate(() => {
    const sel = window.amvcpChart.getSelection();
    if (!sel.length) { return { count: 0 }; }
    const first = sel[0];
    return {
      count: sel.length,
      type: first.type,
      hasId: !!first.id,
      hasData: !!first.data,
      dataKeys: first.data ? Object.keys(first.data).sort().join(',') : '',
      hasValue: first.data && first.data.value !== undefined
    };
  });
  const expectKeys = 'chartId,datasetIndex,datasetLabel,index,value,xLabel';
  const ok = res.count === 1 && res.type === 'chart-point'
    && res.hasId === true && res.hasData === true
    && res.dataKeys === expectKeys && res.hasValue === true;
  record('chart_mark_selectable', ok ? 'PASS' : 'FAIL',
    'click a bar -> selection has 1 chart-point with veWireChart data',
    JSON.stringify(res));
}

async function testKeyboardToggle(page) {
  // Space on a focused [data-ve-id] chart mark toggles its selection —
  // parity with the runtime's keyboard handler.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_keyboard_toggle', 'FAIL',
      'Space on a focused mark toggles selection', s.error);
    return;
  }
  await page.evaluate(() => window.__veChart.clearSelection());
  // Focus the first donut arc and press Space.
  await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="donut"]');
    const arc = fig.querySelector('.ve-chart-arc');
    arc.focus();
  });
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  const afterFirst = await page.evaluate(() =>
    window.amvcpChart.getSelection().length);
  // Press Space again — should toggle back off.
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  const afterSecond = await page.evaluate(() =>
    window.amvcpChart.getSelection().length);
  const ok = afterFirst === 1 && afterSecond === 0;
  record('chart_keyboard_toggle', ok ? 'PASS' : 'FAIL',
    'Space on a focused arc toggles selection on then off',
    JSON.stringify({ afterFirst, afterSecond }));
}

async function testThemeSwapRestyles(page) {
  // Hot-swap to a DESIGN.md with a distinct accent — an SVG bar's
  // computed fill must change with no re-render (CSS custom properties
  // cascade into SVG fill).
  const s = await setup(page);
  if (!s.ok) {
    record('chart_theme_swap_restyles', 'FAIL',
      'accent swap re-themes an SVG bar live', s.error);
    return;
  }
  const before = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    const bar = fig.querySelector('.ve-chart-bar');
    return getComputedStyle(bar).fill;
  });
  const swapped = await page.evaluate(() => window.__vcApplyAltDesign());
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    const bar = fig.querySelector('.ve-chart-bar');
    return getComputedStyle(bar).fill;
  });
  const ok = swapped === true && before !== after
    && before.length > 0 && after.length > 0;
  record('chart_theme_swap_restyles', ok ? 'PASS' : 'FAIL',
    'an SVG bar fill changes after an accent hot-swap (no re-render)',
    JSON.stringify({ before, after }));
}

async function testDonutSweep(page) {
  // chart:donut@1 -> N <path.ve-chart-arc>, a TRUE hole (the arc path
  // describes an annulus, not a filled wedge), each data-ve-id-marked.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_donut_sweep', 'FAIL',
      'donut renders marked arcs with a true hole', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="donut"]');
    if (!fig) { return { fig: false }; }
    const arcs = fig.querySelectorAll('.ve-chart-arc');
    let marked = 0, annular = 0;
    for (let i = 0; i < arcs.length; i++) {
      if (arcs[i].getAttribute('data-ve-id')) { marked++; }
      // An annular wedge path has TWO arc commands (A...A). A filled pie
      // wedge would have one A plus an L to the centre.
      const d = arcs[i].getAttribute('d') || '';
      const aCount = (d.match(/A/g) || []).length;
      if (aCount >= 2) { annular++; }
    }
    return {
      fig: true,
      arcCount: arcs.length,
      marked: marked,
      annular: annular,
      hasCenter: !!fig.querySelector('.ve-chart-donut-center')
    };
  });
  const ok = res.fig === true && res.arcCount === 4
    && res.marked === 4 && res.annular === 4
    && res.hasCenter === true;
  record('chart_donut_sweep', ok ? 'PASS' : 'FAIL',
    'donut -> 4 marked annular arcs (true hole) + a centre label',
    JSON.stringify(res));
}

async function testRadarInflate(page) {
  // chart:radar@1 -> a <polygon.ve-chart-radar-area> with exactly one
  // vertex per axis.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_radar_inflate', 'FAIL',
      'radar renders a polygon, 1 vertex per axis', s.error);
    return;
  }
  // Wait for the inflate animation to settle (the polygon points start
  // collapsed and ramp out).
  await page.waitForTimeout(900);
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="radar"]');
    if (!fig) { return { fig: false }; }
    const polys = fig.querySelectorAll('.ve-chart-radar-area');
    const rings = fig.querySelectorAll('.ve-chart-radar-ring');
    const spokes = fig.querySelectorAll('.ve-chart-radar-spoke');
    // The fixture's radar has 5 axes -> each polygon has 5 vertices.
    let firstVertexCount = 0;
    if (polys.length) {
      const pts = (polys[0].getAttribute('points') || '').trim();
      firstVertexCount = pts ? pts.split(/\s+/).length : 0;
    }
    return {
      fig: true,
      polyCount: polys.length,
      ringCount: rings.length,
      spokeCount: spokes.length,
      firstVertexCount: firstVertexCount
    };
  });
  const ok = res.fig === true && res.polyCount === 2
    && res.spokeCount === 5 && res.firstVertexCount === 5
    && res.ringCount === 4;
  record('chart_radar_inflate', ok ? 'PASS' : 'FAIL',
    'radar -> 2 polygons, 5 spokes, 5 vertices/polygon, 4 rings',
    JSON.stringify(res));
}

async function testHeatmapRamp(page) {
  // chart:heatmap@1 -> a <rect.ve-chart-cell> grid; the highest-value
  // cell's fill differs from the lowest-value cell's (the ramp applied).
  const s = await setup(page);
  if (!s.ok) {
    record('chart_heatmap_ramp', 'FAIL',
      'heatmap renders a cell grid with the ramp applied', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="heatmap"]');
    if (!fig) { return { fig: false }; }
    const cells = fig.querySelectorAll('.ve-chart-cell');
    let hi = null, lo = null, hiV = -Infinity, loV = Infinity;
    let marked = 0;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].getAttribute('data-ve-id')) { marked++; }
      const v = parseFloat(cells[i].getAttribute('data-ve-value'));
      if (v > hiV) { hiV = v; hi = cells[i]; }
      if (v < loV) { loV = v; lo = cells[i]; }
    }
    return {
      fig: true,
      cellCount: cells.length,
      marked: marked,
      hiFill: hi ? getComputedStyle(hi).fill : '',
      loFill: lo ? getComputedStyle(lo).fill : '',
      rampApplied: hi && lo
        ? getComputedStyle(hi).fill !== getComputedStyle(lo).fill : false
    };
  });
  // The fixture grid is 4 rows x 5 cols = 20 cells.
  const ok = res.fig === true && res.cellCount === 20
    && res.marked === 20 && res.rampApplied === true;
  record('chart_heatmap_ramp', ok ? 'PASS' : 'FAIL',
    'heatmap -> 20 marked cells; hi-value fill != lo-value fill',
    JSON.stringify(res));
}

async function testCanvasThreshold(page) {
  // A >100-point chart:bar@1 -> a <canvas.ve-chart-canvas> backend plus a
  // populated hidden <ul.ve-chart-a11y-data>; the a11y list nodes carry
  // data-ve-id so keyboard users can still select.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_canvas_threshold', 'FAIL',
      '>100-point bar uses a canvas backend + a11y list', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const figs = document.querySelectorAll(
      'figure.ve-chart[data-ve-chart-type="bar"]');
    let bigFig = null;
    for (let i = 0; i < figs.length; i++) {
      const cap = figs[i].querySelector('.ve-chart-title');
      if (cap && cap.textContent.indexOf('Large dataset') >= 0) {
        bigFig = figs[i];
      }
    }
    if (!bigFig) { return { found: false }; }
    const canvas = bigFig.querySelector('canvas.ve-chart-canvas');
    const a11y = bigFig.querySelector('ul.ve-chart-a11y-data');
    let a11yMarked = 0;
    if (a11y) {
      const items = a11y.querySelectorAll('li');
      for (let j = 0; j < items.length; j++) {
        if (items[j].getAttribute('data-ve-id')
            && items[j].getAttribute('data-ve-type') === 'chart-point') {
          a11yMarked++;
        }
      }
    }
    return {
      found: true,
      backend: bigFig.getAttribute('data-ve-chart-backend'),
      hasCanvas: !!canvas,
      a11yItems: a11y ? a11y.querySelectorAll('li').length : 0,
      a11yMarked: a11yMarked
    };
  });
  const ok = res.found === true && res.backend === 'canvas'
    && res.hasCanvas === true && res.a11yItems === 120
    && res.a11yMarked === 120;
  record('chart_canvas_threshold', ok ? 'PASS' : 'FAIL',
    '120-bar block -> canvas backend + 120 marked a11y list items',
    JSON.stringify(res));
}

async function testUnknownTypeDegrades(page) {
  // An unregistered type degrades to a visible error block naming the
  // unknown type.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_unknown_type_degrades', 'FAIL',
      'unknown type -> visible error block', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const errs = document.querySelectorAll('.ve-chart-error');
    let typeErr = null, verErr = null;
    for (let i = 0; i < errs.length; i++) {
      const banner = errs[i].querySelector('.ve-chart-error-banner');
      const txt = banner ? banner.textContent : '';
      if (txt.indexOf('unknown chart type: teapot') >= 0) {
        typeErr = errs[i];
      }
      if (txt.indexOf('newer than this runtime') >= 0) {
        verErr = errs[i];
      }
    }
    return {
      typeFound: !!typeErr,
      typeVisible: typeErr ? typeErr.offsetHeight > 0 : false,
      versionFound: !!verErr,
      versionVisible: verErr ? verErr.offsetHeight > 0 : false
    };
  });
  const ok = res.typeFound === true && res.typeVisible === true
    && res.versionFound === true && res.versionVisible === true;
  record('chart_unknown_type_degrades', ok ? 'PASS' : 'FAIL',
    'unknown type AND too-new version both -> visible error blocks',
    JSON.stringify(res));
}

async function testNoNestedScrollbar(page) {
  // No .ve-chart / .ve-chart-svg / .ve-chart-canvas element introduces
  // an inner scroll axis — only the document scrolls.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_no_nested_scrollbar', 'FAIL',
      'no chart element creates an inner scroll axis', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll(
      '.ve-chart, .ve-chart-svg, .ve-chart-canvas, .ve-chart-error,'
      + ' .ve-chart-metric-grid, .ve-chart-segmented');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = (cs.overflowY === 'auto' || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto' || cs.overflowX === 'scroll');
      if (scrolls && (el.scrollHeight > el.clientHeight + 2
        || el.scrollWidth > el.clientWidth + 2)) {
        inner.push(el.className || el.tagName);
      }
    }
    return { checked: all.length, innerScrollers: inner };
  });
  const ok = res.innerScrollers.length === 0 && res.checked > 0;
  record('chart_no_nested_scrollbar', ok ? 'PASS' : 'FAIL',
    'no .ve-chart* element creates an inner scroll axis',
    JSON.stringify(res));
}

async function testMetricCards(page) {
  // chart:metric-cards@1 -> a KPI tile row; each tile data-ve-id-marked,
  // the delta badge colored by the trend token.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_metric_cards', 'FAIL',
      'metric-cards renders marked KPI tiles', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="metric-cards"]');
    if (!fig) { return { fig: false }; }
    const cards = fig.querySelectorAll('.ve-chart-metric-card');
    let marked = 0;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('data-ve-id')
          && cards[i].getAttribute('data-ve-type') === 'chart-point') {
        marked++;
      }
    }
    const up = fig.querySelector('.ve-chart-metric-delta--up');
    const down = fig.querySelector('.ve-chart-metric-delta--down');
    // Resolve success/danger to compare against the badge text color.
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    probe.style.color = 'var(--vc-color-success)';
    const success = getComputedStyle(probe).color;
    probe.style.color = 'var(--vc-color-danger)';
    const danger = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return {
      fig: true,
      cardCount: cards.length,
      marked: marked,
      upColored: up ? getComputedStyle(up).color === success : false,
      downColored: down ? getComputedStyle(down).color === danger : false
    };
  });
  const ok = res.fig === true && res.cardCount === 4
    && res.marked === 4 && res.upColored === true
    && res.downColored === true;
  record('chart_metric_cards', ok ? 'PASS' : 'FAIL',
    'metric-cards -> 4 marked tiles; up/down deltas use trend tokens',
    JSON.stringify(res));
}

// Phase 2.5 selection contract — atom states + group comment-handle.
async function testP25SelectionContract(page) {
  // Setting data-ve-selected="1" on chart marks must:
  //   1. trigger .ve-chart:has([data-ve-selected="1"]) outer ring
  //   2. mount exactly ONE .ve-comment-handle on the figure
  //   3. compose data-ve-comment-id as chart:<figId>:<sortedMarkIds>
  //   4. clearing -> handle vanishes
  // Atom contract checks: tabindex="0" + role="button" so keyboard
  // users can focus/activate the marks.
  const s = await setup(page);
  if (!s.ok) {
    record('chart_p25_selection_contract', 'FAIL',
      'Phase 2.5 group-handle observer wires up', s.error);
    return;
  }
  // Locate the demo figure by its title text (the <pre> id is consumed
  // by the chart renderer when it swaps in <figure>).
  const initial = await page.evaluate(() => {
    const figs = document.querySelectorAll('figure.ve-chart');
    let demo = null;
    for (const f of figs) {
      const cap = f.querySelector('.ve-chart-title');
      if (cap && cap.textContent.indexOf('Phase 2.5 demo') >= 0) {
        demo = f; break;
      }
    }
    if (!demo) { return { setup: false }; }
    const bars = demo.querySelectorAll('.ve-chart-bar');
    return {
      setup: true,
      barCount: bars.length,
      barTabindex: bars[0] ? bars[0].getAttribute('tabindex') : null,
      barRole: bars[0] ? bars[0].getAttribute('role') : null,
      hasHandle: !!demo.querySelector(':scope > .ve-comment-handle')
    };
  });
  if (!initial.setup) {
    record('chart_p25_selection_contract', 'FAIL',
      'Phase 2.5 demo figure not found', JSON.stringify(initial));
    return;
  }
  // Drive selection via the fixture buttons.
  await page.evaluate(() => {
    document.getElementById('p25-select-first').click();
    document.getElementById('p25-select-second').click();
  });
  await page.waitForTimeout(120);
  const afterSelect = await page.evaluate(() => {
    const figs = document.querySelectorAll('figure.ve-chart');
    let demo = null;
    for (const f of figs) {
      const cap = f.querySelector('.ve-chart-title');
      if (cap && cap.textContent.indexOf('Phase 2.5 demo') >= 0) {
        demo = f; break;
      }
    }
    const handle = demo.querySelector(':scope > .ve-comment-handle');
    const cid = handle ? handle.getAttribute('data-ve-comment-id') : '';
    return {
      handleCount: demo.querySelectorAll(':scope > .ve-comment-handle').length,
      cidPrefix: cid.slice(0, 6),
      cidIdCount: (cid.match(/ve-chart-[0-9]+-d[0-9]+-i[0-9]+/g) || []).length,
      handleHasOverlay: handle ? handle.hasAttribute('data-ve-overlay') : false
    };
  });
  await page.evaluate(() => {
    document.getElementById('p25-clear').click();
  });
  await page.waitForTimeout(120);
  const afterClear = await page.evaluate(() => {
    const figs = document.querySelectorAll('figure.ve-chart');
    let demo = null;
    for (const f of figs) {
      const cap = f.querySelector('.ve-chart-title');
      if (cap && cap.textContent.indexOf('Phase 2.5 demo') >= 0) {
        demo = f; break;
      }
    }
    return {
      handleCount: demo.querySelectorAll(':scope > .ve-comment-handle').length
    };
  });
  const ok = initial.barCount > 0
    && initial.barTabindex === '0' && initial.barRole === 'button'
    && initial.hasHandle === false
    && afterSelect.handleCount === 1
    && afterSelect.cidPrefix === 'chart:'
    && afterSelect.cidIdCount === 2
    && afterSelect.handleHasOverlay === true
    && afterClear.handleCount === 0;
  record('chart_p25_selection_contract', ok ? 'PASS' : 'FAIL',
    'select 2 bars -> 1 handle with chart:<id>:<ids>; clear -> handle gone',
    JSON.stringify({ initial, afterSelect, afterClear }));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testBarRenders,
  testBarSparseGridlines,
  testPieRemapsToBar,
  testMissingTitleFailsLoud,
  testMalformedJsonDegrades,
  testLineDrawsPath,
  testWaterfallRiseFall,
  testMarkSelectable,
  testKeyboardToggle,
  testThemeSwapRestyles,
  testDonutSweep,
  testRadarInflate,
  testHeatmapRamp,
  testCanvasThreshold,
  testUnknownTypeDegrades,
  testNoNestedScrollbar,
  testMetricCards,
  testP25SelectionContract
];

const page = await browser.getPage("chart-tests");

try {
  for (const t of tests) {
    try {
      await t(page);
    } catch (e) {
      record(t.name || 'unnamed', 'ERROR', t.name || '',
        String(e && e.message || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
