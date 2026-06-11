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

// The fixture's own DESIGN.md values — the warm parchment family
// (default_theme: light; the flip test asserts the warm dark slice).
// The fixture's palette deliberately matches the engine's BUILT-IN
// default family, so the canvas value alone can no longer prove the
// embedded block parsed. The fixture therefore carries a SENTINEL token
// the built-in does not have: light surface-sunken = #f1ece1 (built-in:
// #f1ece0). Test 1 asserts the sentinel — a fenceless/malformed block
// falls back to the built-in and the sentinel disappears.
const LIGHT_CANVAS = "#faf6ee";
const LIGHT_SENTINEL_SUNKEN = "#f1ece1";        // fixture-only sentinel
const LIGHT_SURFACE_RGB = "rgb(255, 254, 251)"; // #fffefb
const DARK_CANVAS = "#16130d";
const DARK_SURFACE_RGB = "rgb(33, 28, 20)";     // #211c14
const DANGER_LIGHT_RGB = "rgb(168, 74, 50)";    // #a84a32

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
    sunkenSentinel: getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-surface-sunken').trim().toLowerCase(),
    theme: document.documentElement.getAttribute('data-ve-theme')
  }));
  const ok = res.canvas === LIGHT_CANVAS
    && res.sunkenSentinel === LIGHT_SENTINEL_SUNKEN
    && res.theme === 'light';
  record('gvt_embedded_designmd_applied', ok ? 'PASS' : 'FAIL',
    'fenced embedded DESIGN.md drives tokens (sentinel proves no built-in fallback)',
    JSON.stringify(res) + ' expected sentinel ' + LIGHT_SENTINEL_SUNKEN);
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
    && res.fill === LIGHT_SURFACE_RGB;
  record('gvt_rounded_node_path_themed', ok ? 'PASS' : 'FAIL',
    'rounded node renders as <path> styled by tokens (fill = surface)',
    JSON.stringify(res) + ' expected fill ' + LIGHT_SURFACE_RGB);
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
    && res.failEdgeStroke === DANGER_LIGHT_RGB;
  record('gvt_structure_and_stamps', ok ? 'PASS' : 'FAIL',
    '4 nodes + 4 edges stamped; ve-edge-fail painted danger',
    JSON.stringify(res) + ' expected stroke ' + DANGER_LIGHT_RGB);
}

async function testLiveThemeFlipRepaintsGraph(page) {
  // 4 — flipping data-ve-theme re-paints the GRAPH from the dark slice:
  // canvas var flips to the fixture's warm-dark value and the rounded
  // node's <path> fill becomes the dark surface (both themes ship/work).
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_live_theme_flip', 'FAIL',
      'data-ve-theme flip re-paints graph from dark tokens', s.error);
    return;
  }
  const res = await page.evaluate(async () => {
    document.documentElement.setAttribute('data-ve-theme', 'dark');
    await new Promise(r => setTimeout(r, 700));
    const path = document.querySelector(
      '.ve-graph svg .node[data-ve-id="ve-node-work"] path');
    return {
      canvas: getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-canvas').trim().toLowerCase(),
      pathFill: path ? getComputedStyle(path).fill : null
    };
  });
  const ok = res.canvas === DARK_CANVAS && res.pathFill === DARK_SURFACE_RGB;
  record('gvt_live_theme_flip', ok ? 'PASS' : 'FAIL',
    'data-ve-theme flip → warm-dark canvas var + dark node <path> fill',
    JSON.stringify(res) + ' expected ' + DARK_CANVAS + ' / ' + DARK_SURFACE_RGB);
}

async function testSelectionAddsNoNewElements(page) {
  // 5 — THE NO-NEW-ELEMENTS HIGHLIGHT RULE (user contract, 2026-06-11):
  // selecting a node or an edge must only re-paint the EXISTING shapes
  // (brightness/glow/stroke) — never draw new screen geometry. Chromium
  // renders an SVG outline as the group's BOUNDING-BOX RECTANGLE, so a
  // leaked HTML outline rule shows an extra frame around nodes and a
  // huge truncated rectangle around long bezier edges. Regression-guards
  // the runtime's `:not(svg *)` exclusion on the generic state rules.
  const s = await setup(page);
  if (!s.ok) {
    record('gvt_selection_no_new_elements', 'FAIL',
      'selected node/edge g: no bbox outline, no g-level filter, no new children', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const click = (el) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true,
        clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
    };
    const node = document.querySelector('.ve-graph svg .node[data-ve-id="ve-node-work"]');
    const edge = document.querySelector('.ve-graph svg .edge[data-ve-id="ve-edge-fail"]');
    const beforeChildren = node ? node.childElementCount : -1;
    if (node) click(node);
    if (edge) click(edge);
    const gs = (el) => el ? getComputedStyle(el) : null;
    const n = gs(node), e = gs(edge);
    return {
      nodeSelected: node && node.getAttribute('data-ve-selected') === '1',
      edgeSelected: edge && edge.getAttribute('data-ve-selected') === '1',
      nodeOutlineStyle: n ? n.outlineStyle : null,   // must be 'none' (no bbox rect)
      edgeOutlineStyle: e ? e.outlineStyle : null,   // must be 'none' (no bbox rect)
      nodeGroupFilter: n ? n.filter : null,          // must be 'none' (no double-brightness)
      childrenUnchanged: node ? node.childElementCount === beforeChildren : false
    };
  });
  const ok = res.nodeSelected && res.edgeSelected
    && res.nodeOutlineStyle === 'none' && res.edgeOutlineStyle === 'none'
    && res.nodeGroupFilter === 'none' && res.childrenUnchanged;
  record('gvt_selection_no_new_elements', ok ? 'PASS' : 'FAIL',
    'selected node/edge g: no bbox outline, no g-level filter, no new children',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testEmbeddedDesignMdApplied,
  testRoundedNodeIsThemedPath,
  testGraphStructureAndSelectionStamps,
  testLiveThemeFlipRepaintsGraph,
  testSelectionAddsNoNewElements
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
