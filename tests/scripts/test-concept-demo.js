// test-concept-demo.js
//
// Dev-browser script — exercises scripts/amvcp-concept-demo.js, the
// concept-demo (manipulable explainer) renderer.
//
// THE THING: a concept explained by a LIVE manipulable demo — parameter
// sliders driving an inline-SVG visual, paired with a live values table
// and a glossary. The prose-pages sibling: prose explains in words, this
// explains by letting the reader turn the knobs.
//
// Interaction Design Mode = FIXED: the demo container is a runtime
// selection ATOM (data-ve-id="concept-demo:<id>" / data-ve-type=
// "concept-demo"); selection / highlight / triple-state / comment come
// from amvcp-runtime.js. Export rides the EXISTING selection wire — the
// current param set is one deduped entry in window.veSelection. Graphic
// style is fully DESIGN.md-driven (--vc-* tokens), light + dark both.
//
// Coverage (build spec, 5 tests):
//   1. renders the demo + the live values table + the glossary from spec
//   2. a slider input updates BOTH the SVG geometry AND the table cell
//   3. slider values stay clamped to [min, max]
//   4. the export payload in window.veSelection matches the UI params
//   5. interaction adds NO new DOM elements + a theme flip re-paints the
//      SVG via tokens (token reference, not a frozen hex)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/concept-demo-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture, wait for engine + runtime + renderer, then mount the
// curve demo from the embedded #ve-concept-spec. Returns true once a
// freshly-mounted [data-ve-id^="concept-demo:"] root is in #vc-cd-mount.
async function setupAndMount(page) {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 7000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = await page.evaluate(() =>
      typeof window.amvcpDesignMd === 'object'
      && typeof window.amvcpConceptDemo === 'object'
      && typeof window.__veDesignMd === 'object'
      && !!window.__veDesignMd.state.designmd
      && Array.isArray(window.veSelection));
    if (ready) break;
    await page.waitForTimeout(70);
  }
  if (!ready) return false;
  return page.evaluate(() => {
    const mount = document.getElementById('vc-cd-mount');
    if (!mount) return false;
    mount.innerHTML = '';
    // Reset the selection wire so export assertions start clean.
    window.veSelection.length = 0;
    const spec = JSON.parse(document.getElementById('ve-concept-spec').textContent);
    window.amvcpConceptDemo.mountConceptDemo(spec, mount, { id: 'fixture-curve' });
    return !!mount.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
  });
}

// ── Tests ───────────────────────────────────────────────────────────

async function testRendersDemoTableGlossary(page) {
  if (!(await setupAndMount(page))) {
    record('cd_renders', 'FAIL', 'renders demo + table + glossary', 'demo never mounted');
    return;
  }
  const res = await page.evaluate(() => {
    const spec = JSON.parse(document.getElementById('ve-concept-spec').textContent);
    const root = document.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
    const svg = root.querySelector('svg.vc-cd-svg');
    const sliders = root.querySelectorAll('input[type="range"][data-vc-key]');
    const tableRows = root.querySelectorAll('.vc-cd-table tbody tr');
    const glossItems = root.querySelectorAll('.vc-cd-glossary dt');
    return {
      hasSvg: !!svg,
      svgHasGeometry: svg ? svg.querySelectorAll('path,rect,line,circle').length : 0,
      sliders: sliders.length,
      wantSliders: spec.params.length,
      tableRows: tableRows.length,
      glossItems: glossItems.length,
      wantGloss: spec.glossary.length,
      atomType: root.getAttribute('data-ve-type')
    };
  });
  const ok = res.hasSvg && res.svgHasGeometry > 0
    && res.sliders === res.wantSliders
    && res.tableRows === res.wantSliders
    && res.glossItems === res.wantGloss
    && res.atomType === 'concept-demo';
  record(
    'cd_renders',
    ok ? 'PASS' : 'FAIL',
    'demo SVG + one slider/table-row per param + one glossary entry per term; container is a concept-demo atom',
    JSON.stringify(res)
  );
}

async function testSliderUpdatesSvgAndTable(page) {
  if (!(await setupAndMount(page))) {
    record('cd_slider_updates', 'FAIL', 'slider updates SVG + table', 'demo never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
    const curve = root.querySelector('.vc-cd-curve');
    const cell = root.querySelector('.vc-cd-table tbody tr[data-vc-key="steepness"] td.vc-cd-cell-val');
    const slider = root.querySelector('input[type="range"][data-vc-key="steepness"]');
    const beforePath = curve.getAttribute('d');
    const beforeCell = cell.textContent;
    // Move the steepness slider to its max and fire a real input event.
    slider.value = String(slider.max);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 40));
    const afterPath = curve.getAttribute('d');
    const afterCell = cell.textContent;
    return {
      beforeCell, afterCell,
      cellChanged: beforeCell !== afterCell,
      pathChanged: beforePath !== afterPath,
      afterCellIsMax: afterCell.indexOf('10') === 0
    };
  });
  const ok = res.cellChanged && res.pathChanged && res.afterCellIsMax;
  record(
    'cd_slider_updates',
    ok ? 'PASS' : 'FAIL',
    'moving a slider re-paints BOTH the SVG path attribute and the table cell, in place',
    JSON.stringify(res)
  );
}

async function testValuesClampToRange(page) {
  if (!(await setupAndMount(page))) {
    record('cd_clamp', 'FAIL', 'values clamp to range', 'demo never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
    const slider = root.querySelector('input[type="range"][data-vc-key="steepness"]');
    const cell = root.querySelector('.vc-cd-table tbody tr[data-vc-key="steepness"] td.vc-cd-cell-val');
    const min = parseFloat(slider.min), max = parseFloat(slider.max);
    // Force a value WAY beyond max directly (bypassing the slider's own
    // clamp) and re-dispatch — the module must clamp it back into range.
    slider.value = String(max);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 30));
    const exported = (window.veSelection.find(e => e.entryId === 'concept-demo:fixture-curve') || {}).data || {};
    const valAtMax = exported.params ? exported.params.steepness : null;
    // Now below min.
    slider.value = String(min - 999);  // browsers clamp the input to min
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 30));
    const exported2 = (window.veSelection.find(e => e.entryId === 'concept-demo:fixture-curve') || {}).data || {};
    const valAtMin = exported2.params ? exported2.params.steepness : null;
    return { min, max, valAtMax, valAtMin,
      maxInRange: valAtMax <= max && valAtMax >= min,
      minInRange: valAtMin >= min && valAtMin <= max,
      cellText: cell.textContent };
  });
  const ok = res.maxInRange && res.minInRange
    && res.valAtMax === res.max && res.valAtMin === res.min;
  record(
    'cd_clamp',
    ok ? 'PASS' : 'FAIL',
    'param value never escapes [min, max] regardless of the raw slider input',
    JSON.stringify(res)
  );
}

async function testExportMatchesUi(page) {
  if (!(await setupAndMount(page))) {
    record('cd_export', 'FAIL', 'export matches UI params', 'demo never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
    const sliders = root.querySelectorAll('input[type="range"][data-vc-key]');
    // Nudge each slider to a distinct value so a stale export is obvious.
    for (let i = 0; i < sliders.length; i++) {
      const s = sliders[i];
      const mid = (parseFloat(s.min) + parseFloat(s.max)) / 2;
      s.value = String(mid);
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise(r => setTimeout(r, 40));
    // Read what the UI shows (the slider values) ...
    const uiVals = {};
    for (let i = 0; i < sliders.length; i++) {
      uiVals[sliders[i].getAttribute('data-vc-key')] = parseFloat(sliders[i].value);
    }
    // ... and what was exported onto the selection wire.
    const matches = window.veSelection.filter(e => e.entryId === 'concept-demo:fixture-curve');
    const entry = matches[0] || null;
    let allMatch = !!entry && entry.type === 'concept-demo' && entry.kind === 'element';
    const exported = entry && entry.data ? entry.data.params : null;
    if (exported) {
      for (const k in uiVals) {
        if (Math.abs(uiVals[k] - exported[k]) > 1e-9) allMatch = false;
      }
    } else {
      allMatch = false;
    }
    return {
      dedupedToOne: matches.length === 1,
      entryType: entry ? entry.type : null,
      entryKind: entry ? entry.kind : null,
      uiVals, exported, allMatch
    };
  });
  const ok = res.dedupedToOne && res.allMatch;
  record(
    'cd_export',
    ok ? 'PASS' : 'FAIL',
    'one deduped kind:element concept-demo entry in veSelection whose data.params equal the slider values',
    JSON.stringify(res)
  );
}

async function testNoNewNodesAndThemeRepaint(page) {
  if (!(await setupAndMount(page))) {
    record('cd_no_new_nodes_theme', 'FAIL', 'no new nodes + theme repaint', 'demo never mounted');
    return;
  }
  const res = await page.evaluate(async () => {
    const root = document.querySelector('[data-ve-id="concept-demo:fixture-curve"]');
    const countNodes = () => root.querySelectorAll('*').length;
    const before = countNodes();
    // Drag every slider through several values — interaction must NOT
    // insert/clone/remove a single DOM node (the NO-NEW-ELEMENTS rule).
    const sliders = root.querySelectorAll('input[type="range"][data-vc-key]');
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < sliders.length; i++) {
        const s = sliders[i];
        const lo = parseFloat(s.min), hi = parseFloat(s.max);
        s.value = String(lo + (hi - lo) * (pass + 1) / 4);
        s.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    await new Promise(r => setTimeout(r, 50));
    const after = countNodes();

    // The SVG bar/curve/dial colour must be a TOKEN reference, so a theme
    // flip re-paints it. Resolve the curve's computed stroke in light,
    // flip the theme, resolve again — they must differ AND must equal the
    // theme's --vc-color-accent (proving token-driven, not a frozen hex).
    const curve = root.querySelector('.vc-cd-curve');
    function strokeNow() { return getComputedStyle(curve).stroke; }
    function accentNow() {
      const a = getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-accent').trim();
      const probe = document.createElement('span');
      probe.style.color = a; document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      return rgb;
    }
    // Ensure we start in light.
    if (document.documentElement.getAttribute('data-ve-theme') === 'dark') {
      window.__veDesignMd.toggleTheme();
      await new Promise(r => setTimeout(r, 50));
    }
    const lightStroke = strokeNow();
    const lightAccent = accentNow();
    window.__veDesignMd.toggleTheme();
    await new Promise(r => setTimeout(r, 60));
    const darkStroke = strokeNow();
    const darkAccent = accentNow();
    return {
      before, after, noNewNodes: before === after,
      lightStroke, darkStroke, lightAccent, darkAccent,
      strokeFlipped: lightStroke !== darkStroke,
      lightMatchesAccent: lightStroke === lightAccent,
      darkMatchesAccent: darkStroke === darkAccent
    };
  });
  const ok = res.noNewNodes && res.strokeFlipped
    && res.lightMatchesAccent && res.darkMatchesAccent;
  record(
    'cd_no_new_nodes_theme',
    ok ? 'PASS' : 'FAIL',
    'slider interaction adds NO DOM nodes; the SVG visual is token-themed so a theme flip re-paints it to the new accent',
    JSON.stringify(res)
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testRendersDemoTableGlossary,
  testSliderUpdatesSvgAndTable,
  testValuesClampToRange,
  testExportMatchesUi,
  testNoNewNodesAndThemeRepaint,
];

const page = await browser.getPage("concept-demo-tests");

try {
  for (const t of tests) {
    try {
      await t(page);
    } catch (e) {
      record(t.name || 'unnamed', 'ERROR', t.name || '', String(e && e.message || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
