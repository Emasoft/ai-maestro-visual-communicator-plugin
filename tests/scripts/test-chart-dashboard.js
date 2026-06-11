// test-chart-dashboard.js
//
// Dev-browser suite for templates/chart-dashboard.html's load-bearing
// guarantees (audit gap fast-path, peer of test-graphviz-template.js). The
// fixture is a filled copy of the template; these tests regression-guard
// the chart fast-path's silent-failure traps:
//
//   1. FENCE TRAP — parseDesignMd is fail-fast: an embedded
//      <script type="text/design-md"> payload without `---` fences makes
//      the engine silently fall back to the BUILT-IN palette. The fixture
//      carries a SENTINEL token the built-in lacks (light surface-sunken =
//      #f1ece1; built-in: #f1ece0); test 1 asserts the sentinel applied.
//   2. RENDER TRAP — each fenced `chart:<type>@1` block must be REPLACED by
//      a non-empty <figure class="ve-chart"> (a missing/silent renderer
//      leaves a bare <pre>). Test 2 asserts every chart figure rendered a
//      real mark.
//   3. THEME TRAP — a live data-ve-theme flip must re-paint the page from
//      the dark slice (warm-dark canvas). Test 3.
//   4. NO-NEW-ELEMENTS RULE (user contract) — clicking a chart atom selects
//      it by re-painting the EXISTING mark only; it must add no new screen
//      geometry (no new children on the mark, no new direct <body> children).
//      Test 4.
//
// The fixture loads the FULL runtime (amvcp-runtime.js), so a chart click
// routes through window.toggleElementSelection -> window.veSelection ->
// repaintSelectedElements() stamps data-ve-selected="1" on the mark.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/chart-dashboard-fixture.html";

// The fixture's own DESIGN.md values — the warm parchment family
// (default_theme: light). The fixture's palette deliberately matches the
// engine's BUILT-IN default family, so the canvas value alone can no longer
// prove the embedded block parsed. The fixture therefore carries a SENTINEL
// the built-in does not have: light surface-sunken = #f1ece1 (built-in:
// #f1ece0). Test 1 asserts the sentinel — a fenceless/malformed block falls
// back to the built-in and the sentinel disappears.
const LIGHT_CANVAS = "#faf6ee";
const LIGHT_SENTINEL_SUNKEN = "#f1ece1";        // fixture-only sentinel
const DARK_CANVAS = "#16130d";

const results = [];
function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait for amvcp-chart.js to render real chart DOM
// (each fenced block becomes a <figure class="ve-chart"> with a rendered
// mark inside — svg / canvas / metric-card). Poll up to 20s.
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const fig = document.querySelector('figure.ve-chart[data-ve-chart-type="bar"]');
      // "rendered" = a real chart mark exists inside the bar figure.
      return !!(fig && fig.querySelector('.ve-chart-bar'));
    });
    if (ready) return { ok: true };
    await page.waitForTimeout(250);
  }
  return { ok: false, error: 'charts never rendered (amvcp-chart.js boot failed?)' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testEmbeddedDesignMdApplied(page) {
  // 1 — the FENCED embedded DESIGN.md drives the tokens: the applied
  // canvas equals the fixture's value AND the fixture-only sentinel
  // surface-sunken applied, proving no silent fallback to the built-in
  // palette (the fence-trap regression guard).
  const s = await setup(page);
  if (!s.ok) {
    record('gvtcd_embedded_designmd_applied', 'FAIL',
      'fenced embedded DESIGN.md drives tokens (no built-in fallback)', s.error);
    return;
  }
  const res = await page.evaluate(() => ({
    canvas: getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim().toLowerCase(),
    sunkenSentinel: getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-surface-sunken').trim().toLowerCase(),
    theme: document.documentElement.getAttribute('data-ve-theme')
  }));
  const ok = res.canvas === LIGHT_CANVAS
    && res.sunkenSentinel === LIGHT_SENTINEL_SUNKEN
    && res.theme === 'light';
  record('gvtcd_embedded_designmd_applied', ok ? 'PASS' : 'FAIL',
    'fenced embedded DESIGN.md drives tokens (sentinel proves no built-in fallback)',
    JSON.stringify(res) + ' expected sentinel ' + LIGHT_SENTINEL_SUNKEN);
}

async function testChartsRender(page) {
  // 2 — every fenced chart:<type>@1 block is REPLACED by a non-empty
  // <figure class="ve-chart">: the metric-cards row, the bar chart, and
  // the area chart each produced a real rendered mark (a bare <pre> means
  // the renderer never ran).
  const s = await setup(page);
  if (!s.ok) {
    record('gvtcd_charts_render', 'FAIL',
      'each fenced chart block renders a non-empty figure', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const figOf = (type) =>
      document.querySelector('figure.ve-chart[data-ve-chart-type="' + type + '"]');
    const metric = figOf('metric-cards');
    const bar = figOf('bar');
    const area = figOf('area');
    return {
      metricCards: metric ? metric.querySelectorAll('.ve-chart-metric-card').length : 0,
      bars: bar ? bar.querySelectorAll('.ve-chart-bar').length : 0,
      areaPath: area ? !!area.querySelector('.ve-chart-area') : false,
      // A bare <pre> left behind means the renderer never swapped the block.
      leftoverPres: document.querySelectorAll('pre code[class^="language-chart:"]').length
    };
  });
  const ok = res.metricCards === 3 && res.bars === 4
    && res.areaPath === true && res.leftoverPres === 0;
  record('gvtcd_charts_render', ok ? 'PASS' : 'FAIL',
    '3 metric cards + 4 bars + 1 area path rendered; no leftover <pre>',
    JSON.stringify(res));
}

async function testLiveThemeFlip(page) {
  // 3 — flipping data-ve-theme re-paints the page from the dark slice:
  // the canvas var flips to the fixture's warm-dark value (both themes
  // ship/work).
  const s = await setup(page);
  if (!s.ok) {
    record('gvtcd_live_theme_flip', 'FAIL',
      'data-ve-theme flip re-paints from dark tokens', s.error);
    return;
  }
  // Flip the theme, then read the canvas var. This evaluate is guarded by a
  // driver-side timeout: if the page's main thread is locked (see the
  // KNOWN-ISSUE note below) the in-page promise never settles, so a bare
  // `await` would hang the WHOLE suite forever. Race it against a timer so a
  // lock is recorded as a bounded FAIL instead of poisoning the run.
  //
  // KNOWN ISSUE (out of this fast-path's scope — runtime ↔ chart-lib): on a
  // page that loads the FULL runtime AND has rendered `.ve-chart` figures,
  // setting data-ve-theme drives the runtime's `vc:themechange` rescan, which
  // deadlocks the page. Isolation proof: charts present → hang; chart lib
  // loaded but zero charts → flip works; graphviz template (no chart lib) →
  // flip works; waiting for entry animations to settle first → still hangs.
  // The fix lives in amvcp-runtime.js / amvcp-chart.js, not in these 4
  // fast-path files. This test is the regression guard that goes green once
  // that runtime bug is fixed.
  const flip = page.evaluate(async () => {
    document.documentElement.setAttribute('data-ve-theme', 'dark');
    await new Promise(r => setTimeout(r, 700));
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim().toLowerCase();
  });
  const guard = new Promise((resolve) => setTimeout(() => resolve('__HUNG__'), 6000));
  const canvas = await Promise.race([flip, guard]);
  if (canvas === '__HUNG__') {
    record('gvtcd_live_theme_flip', 'FAIL',
      'data-ve-theme flip → warm-dark canvas var',
      'page locked on theme flip (runtime↔chart-lib vc:themechange deadlock; out-of-scope, see test note)');
    return;
  }
  const ok = canvas === DARK_CANVAS;
  record('gvtcd_live_theme_flip', ok ? 'PASS' : 'FAIL',
    'data-ve-theme flip → warm-dark canvas var',
    JSON.stringify({ canvas: canvas }) + ' expected ' + DARK_CANVAS);
}

async function testSelectionNoNewElements(page) {
  // 4 — THE NO-NEW-ELEMENTS HIGHLIGHT RULE (user contract): clicking a
  // chart atom must select it by re-painting the EXISTING mark only —
  // window.veSelection gains the atom, the runtime stamps
  // data-ve-selected="1" on it, but the mark gains NO new child elements
  // and the document body gains NO new direct children. (The decision-mini
  // pill attaches at MOUNT, and the group comment-handle mounts on the
  // <figure> — never on the <rect> atom nor as a direct <body> child — so
  // both counts measured here stay stable across the click.)
  const s = await setup(page);
  if (!s.ok) {
    record('gvtcd_selection_no_new_elements', 'FAIL',
      'click a chart atom: selects + no new children on mark/body', s.error);
    return;
  }
  // Let the bar entry animation (scaleY(0)->scaleY(1) ~600ms) settle so the
  // mark is fully painted, then capture BEFORE counts, dispatch a real
  // MouseEvent('click') on the atom (the repo's full-runtime-fixture pattern,
  // matching test-graphviz-template.js — no page.mouse daemon round-trip),
  // and read the AFTER counts. Counts are taken AFTER initial load settled so
  // the runtime's pre-existing injected UI (submit bar, etc.) is excluded.
  await page.waitForTimeout(900);
  const res = await page.evaluate(async () => {
    const bar = document.querySelector(
      'figure.ve-chart[data-ve-chart-type="bar"] .ve-chart-bar[data-ve-id]');
    if (!bar) { return { found: false }; }
    const before = {
      markChildren: bar.childElementCount,
      bodyChildren: document.body.childElementCount
    };
    const r = bar.getBoundingClientRect();
    bar.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2
    }));
    await new Promise(rs => setTimeout(rs, 200));
    return {
      found: true,
      veSelLen: Array.isArray(window.veSelection) ? window.veSelection.length : -1,
      markSelected: bar.getAttribute('data-ve-selected') === '1',
      beforeMarkChildren: before.markChildren,
      afterMarkChildren: bar.childElementCount,
      beforeBodyChildren: before.bodyChildren,
      afterBodyChildren: document.body.childElementCount
    };
  });
  const ok = res.found === true
    && res.veSelLen >= 1
    && res.markSelected === true
    && res.afterMarkChildren === res.beforeMarkChildren
    && res.afterBodyChildren === res.beforeBodyChildren;
  record('gvtcd_selection_no_new_elements', ok ? 'PASS' : 'FAIL',
    'click atom → veSelection >=1 + mark stamped; no new mark/body children',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testEmbeddedDesignMdApplied,
  testChartsRender,
  testSelectionNoNewElements,
  // The theme-flip test runs LAST: on a charts page it can lock the page
  // (the out-of-scope runtime↔chart-lib deadlock documented in the test).
  // Running it last keeps tests 1-3 on a healthy page; its own evaluate is
  // timeout-guarded so a lock is a bounded FAIL, not a suite-wide hang.
  testLiveThemeFlip
];

const page = await browser.getPage("chart-dashboard-tests");

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
  // Defensive close: if the theme-flip test locked the page (out-of-scope
  // runtime deadlock), page.close() can itself hang — race it against a timer
  // so the script always exits and the harness can render the table.
  await Promise.race([
    page.close().catch(() => {}),
    new Promise((r) => setTimeout(r, 4000))
  ]);
}
