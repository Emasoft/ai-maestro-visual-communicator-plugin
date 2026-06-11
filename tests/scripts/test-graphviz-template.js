// test-graphviz-template.js
//
// Dev-browser suite for templates/graphviz-diagram.html's load-bearing
// guarantees (TRDD-5d31a249, fast-path slices S2+S4). The fixture is a
// filled copy of the template; these tests regression-guard the two
// silent-failure traps that cost a real debug round-trip on 2026-06-11:
//
//   1. FENCE TRAP — parseDesignMd is fail-fast: an embedded
//      <script type="text/design-md"> payload without `---` fences makes
//      the engine silently fall back to the BUILT-IN palette. The test
//      asserts the fixture's own canvas value is what actually applied.
//   2. <path> TRAP — Graphviz style=rounded boxes render as <path>
//      (not <polygon>); node CSS targeting polygon/ellipse only silently
//      never applies. The test asserts the rounded node's <path> computed
//      fill/stroke come from the page tokens, in BOTH themes.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/graphviz-template-fixture.html";

// The fixture's own DESIGN.md values (NOT the engine's built-in default).
const DARK_CANVAS = "#0c1322";
const DARK_SURFACE_RGB = "rgb(18, 28, 48)";    // #121c30
const LIGHT_CANVAS = "#f5f7fa";
const LIGHT_SURFACE_RGB = "rgb(255, 255, 255)"; // #ffffff
const DANGER_DARK_RGB = "rgb(224, 82, 82)";     // #e05252

const results = [];
function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait for the lazy @viz-js WASM render (CDN).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      !!document.querySelector('.ve-graph svg .node'));
    if (ready) return { ok: true };
    await page.waitForTimeout(250);
  }
  return { ok: false, error: 'graph never rendered (viz WASM CDN unreachable?)' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testEmbeddedDesignMdApplied(page) {
  // 1 — the FENCED embedded DESIGN.md drives the tokens: the applied
  // canvas equals the fixture's value, proving no silent fallback to the
  // built-in palette (the fence-trap regression guard).
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_embedded_designmd_applied', 'FAIL',
      'fenced embedded DESIGN.md drives tokens (no built-in fallback)', s.error);
    return;
  }
  const res = await page.evaluate(() => ({
    canvas: getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-canvas').trim().toLowerCase(),
    theme: document.documentElement.getAttribute('data-ve-theme')
  }));
  const ok = res.canvas === '#0c1322' && res.theme === 'dark';
  record('gvt_embedded_designmd_applied', ok ? 'PASS' : 'FAIL',
    'fenced embedded DESIGN.md drives tokens (no built-in fallback)',
    JSON.stringify(res) + ' expected canvas ' + '#0c1322');
}

async function testRoundedNodeIsThemedPath(page) {
  // 2 — the rounded box renders as <path> AND the token CSS paints it
  // (the <path>-trap regression guard).
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_rounded_node_path_themed', 'FAIL',
      'rounded node renders as <path> styled by tokens', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const g = document.querySelector('.ve-graph svg .node[data-ve-id="ve-node-work"]');
    const path = g && g.querySelector('path');
    const poly = g && g.querySelector('polygon');
    return {
      nodePresent: !!g,
      shapeIsPath: !!path && !poly,
      fill: path ? getComputedStyle(path).fill : null,
      strokeWidth: path ? getComputedStyle(path).strokeWidth : null
    };
  });
  const ok = res.nodePresent && res.shapeIsPath
    && res.fill === DARK_SURFACE_RGB;
  record('gvt_rounded_node_path_themed', ok ? 'PASS' : 'FAIL',
    'rounded node renders as <path> styled by tokens (fill = surface)',
    JSON.stringify(res) + ' expected fill ' + DARK_SURFACE_RGB);
}

async function testGraphStructureAndSelectionStamps(page) {
  // 3 — all 4 nodes + 4 edges rendered; runtime stamped data-ve-id on
  // nodes and edges; the explicit ve-edge-fail id won and is danger-tinted.
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_structure_and_stamps', 'FAIL',
      'nodes/edges rendered with selection stamps + per-edge CSS', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.ve-graph svg .node[data-ve-id]');
    const edges = document.querySelectorAll('.ve-graph svg .edge[data-ve-id]');
    const fail = document.querySelector('.ve-graph svg .edge[data-ve-id="ve-edge-fail"] path:not([data-ve-hit])');
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      failEdgeStroke: fail ? getComputedStyle(fail).stroke : null
    };
  });
  const ok = res.nodeCount === 4 && res.edgeCount === 4
    && res.failEdgeStroke === DANGER_DARK_RGB;
  record('gvt_structure_and_stamps', ok ? 'PASS' : 'FAIL',
    '4 nodes + 4 edges stamped; ve-edge-fail painted danger',
    JSON.stringify(res) + ' expected stroke ' + DANGER_DARK_RGB);
}

async function testLiveThemeFlipRepaintsGraph(page) {
  // 4 — flipping data-ve-theme re-paints the GRAPH from the light slice:
  // canvas var flips to the fixture's light value and the rounded node's
  // <path> fill becomes the light surface (both themes ship, both work).
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_live_theme_flip', 'FAIL',
      'data-ve-theme flip re-paints graph from light tokens', s.error);
    return;
  }
  const res = await page.evaluate(async () => {
    document.documentElement.setAttribute('data-ve-theme', 'light');
    await new Promise(r => setTimeout(r, 700));
    const path = document.querySelector(
      '.ve-graph svg .node[data-ve-id="ve-node-work"] path');
    return {
      canvas: getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-canvas').trim().toLowerCase(),
      pathFill: path ? getComputedStyle(path).fill : null
    };
  });
  const ok = res.canvas === LIGHT_CANVAS && res.pathFill === LIGHT_SURFACE_RGB;
  record('gvt_live_theme_flip', ok ? 'PASS' : 'FAIL',
    'data-ve-theme flip → light canvas var + white node <path> fill',
    JSON.stringify(res) + ' expected ' + LIGHT_CANVAS + ' / ' + LIGHT_SURFACE_RGB);
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testEmbeddedDesignMdApplied,
  testRoundedNodeIsThemedPath,
  testGraphStructureAndSelectionStamps,
  testLiveThemeFlipRepaintsGraph
];

const page = await browser.getPage("graphviz-template-tests");

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
