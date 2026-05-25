// test-composability-lan.js
//
// PERMANENT composability regression test — proves the plugin composes
// THREE visual-element skills on ONE page, driven by three simulated source
// docs (tests/fixtures/lan-composability/source-1/2/3):
//
//   • GRAPH    (amvcp-diagram.js)  — the LAN topology: nodes + edges, the
//                                    ups01->core-sw01 link dashed (power).
//   • ICON-SVG                     — one distinct simple inline-SVG glyph per
//                                    component type, nested ON each node.
//   • CHART    (amvcp-chart.js)    — one DONUT per node (pie is banned/remap),
//                                    nested via <foreignObject> just BELOW it.
//
// The runtime (amvcp-runtime.js) boots all three modules together on
// DOMContentLoaded. The fixture composes them by NESTING (SVG is a superset
// of HTML): an overlay <svg> sharing the graph's viewBox carries, per node,
// the icon glyph and a <foreignObject> holding the donut + LAN-address chip.
// That shared boot + shared coordinate space, with every piece a self-
// contained data-ve-* atom, is the composability proof.
//
// Mirrors the harness shape of tests/scripts/test-diagram.js. Each test
// prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>
//
// Run head-less only this test:
//   cd tests && python3 run-tests.py --only test-composability-lan
// (run-tests.py auto-discovers test-*.js, syncs the runtime into fixtures/,
//  starts the server, and parses the TEST | lines above.)

const FIXTURE =
  "http://127.0.0.1:8767/lan-composability/lan-network-map.html";

// Expected scenario constants — taken from the AUTHORITATIVE source docs,
// not the build-spec prose. The prose says "24 nodes / 19 distinct types",
// but source-2-component-inventory.md actually lists 25 rows and 21 distinct
// component types, and source-3-traffic-by-team.md lists 25 traffic rows;
// source-1-network-topology.md lists 24 edges. The source files ARE the
// scenario data (the spec says so explicitly), so they win over the prose.
const EXPECT_NODES = 25;   // source-2 rows / source-3 rows
const EXPECT_EDGES = 24;   // source-1 adjacency lines
const EXPECT_TYPES = 21;   // distinct `type` values in source-2
const EXPECT_TEAMS = 5;    // Platform · DataSci · Web · Design · Ops

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || "" });
}

// Navigate-ONCE setup. The fixture is loaded a single time and the result is
// cached; every test reuses the same loaded page. Re-navigating per-test (9x)
// is both slow and, after several reloads of a page that boots three modules
// + 25 animated donuts, prone to wedging the dev-browser tab — so we load
// once and assert against that one page. Tests that mutate page state (the
// theme flip) restore it before returning.
//
// Readiness = composer finished (window.__lanReady) AND all three module
// globals installed AND the scene graph rendered to <svg> AND every donut
// <pre> swapped to a <figure.ve-chart>.
let _setupResult = null;
async function setup(page) {
  if (_setupResult) { return _setupResult; }
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({
      composerDone: window.__lanReady === true || !!window.__lanFixtureError,
      composerErr: window.__lanFixtureError || "",
      hasDiagram: typeof window.amvcpDiagram === "object",
      hasChart: typeof window.amvcpChart === "object",
      hasIconSvg: typeof window.amvcpIconSvg === "object",
      graphSvg: !!document.querySelector("#lan-graph-layer .ve-scene-graph svg"),
      figures: document.querySelectorAll("figure.ve-chart").length,
    }));
    if (state.composerErr) {
      _setupResult = { ok: false, error: "composer: " + state.composerErr };
      return _setupResult;
    }
    if (state.composerDone && state.hasDiagram && state.hasChart
      && state.hasIconSvg && state.graphSvg
      && state.figures >= EXPECT_NODES) {
      _setupResult = { ok: true, error: "" };
      return _setupResult;
    }
    await page.waitForTimeout(80);
  }
  const last = await page.evaluate(() => ({
    composerErr: window.__lanFixtureError || "",
    hasDiagram: typeof window.amvcpDiagram === "object",
    hasChart: typeof window.amvcpChart === "object",
    hasIconSvg: typeof window.amvcpIconSvg === "object",
    graphSvg: !!document.querySelector("#lan-graph-layer .ve-scene-graph svg"),
    figures: document.querySelectorAll("figure.ve-chart").length,
  }));
  _setupResult = { ok: false, error: "not ready: " + JSON.stringify(last) };
  return _setupResult;
}

// ── Tests ──────────────────────────────────────────────────────────────

// 1 — all 25 component cards (graph nodes) render and each carries its LAN
//     address from source-2 (as a nested .lan-addr chip atom).
async function testNodesAndAddresses(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_nodes_and_addresses", "FAIL",
      "25 nodes render with LAN addresses", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const nodes = document.querySelectorAll(
      '#lan-graph-layer g[data-ve-type="diagram-node"]');
    const chips = document.querySelectorAll('[data-ve-type="lan-address"]');
    // Every node id must have a matching chip whose text is a 10.0.x.y addr.
    let allHaveAddr = nodes.length > 0;
    const addrRe = /^10\.0\.\d+\.\d+$/;
    let goodAddrs = 0;
    for (let i = 0; i < chips.length; i++) {
      if (addrRe.test((chips[i].textContent || "").trim())) { goodAddrs++; }
      if (!chips[i].getAttribute("data-ve-id")) { allHaveAddr = false; }
    }
    return {
      nodeCount: nodes.length,
      chipCount: chips.length,
      goodAddrs: goodAddrs,
      allHaveAddr: allHaveAddr,
    };
  });
  const ok = r.nodeCount === EXPECT_NODES
    && r.chipCount === EXPECT_NODES
    && r.goodAddrs === EXPECT_NODES
    && r.allHaveAddr;
  record("lan_nodes_and_addresses", ok ? "PASS" : "FAIL",
    "all 25 graph nodes render; each has a LAN-address chip atom",
    JSON.stringify(r));
}

// 2 — all 21 distinct icon types are present and VISUALLY DISTINCT (their
//     inner glyph markup differs per type — no two types share geometry).
async function testIconsDistinct(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_icons_distinct", "FAIL",
      "21 distinct icon glyphs", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const icons = document.querySelectorAll('g[data-ve-type="lan-icon"]');
    // Group by the component type stamped in data-ve-label; collect the
    // glyph geometry signature (concatenated child tag+d/points/r) per type.
    const byType = {};
    for (let i = 0; i < icons.length; i++) {
      const type = icons[i].getAttribute("data-ve-label") || "?";
      // Signature = the markup of the glyph primitives, excluding the shared
      // background plate (first <rect class="lan-glyph-bg">).
      const parts = [];
      const kids = icons[i].children;
      for (let k = 0; k < kids.length; k++) {
        const cls = kids[k].getAttribute("class") || "";
        if (cls.indexOf("lan-glyph-bg") !== -1) { continue; }
        parts.push(kids[k].tagName + "|" + (kids[k].getAttribute("d")
          || kids[k].getAttribute("points")
          || kids[k].getAttribute("cx") || "")
          + (kids[k].getAttribute("r") || ""));
      }
      byType[type] = parts.join("##");
    }
    const types = Object.keys(byType);
    // Distinctness: every type's signature is unique.
    const sigs = {};
    let dup = "";
    for (let i = 0; i < types.length; i++) {
      const sig = byType[types[i]];
      if (sigs[sig]) { dup = types[i] + " == " + sigs[sig]; }
      sigs[sig] = types[i];
    }
    const uniqueSigs = Object.keys(sigs).length;
    return {
      iconCount: icons.length,
      typeCount: types.length,
      uniqueSigs: uniqueSigs,
      duplicate: dup,
    };
  });
  const ok = r.iconCount === EXPECT_NODES   // one icon per node
    && r.typeCount === EXPECT_TYPES         // 21 distinct types present
    && r.uniqueSigs === EXPECT_TYPES        // every type's geometry unique
    && r.duplicate === "";
  record("lan_icons_distinct", ok ? "PASS" : "FAIL",
    "21 distinct icon types, each with unique glyph geometry",
    JSON.stringify(r));
}

// 3 — all 25 donuts render, each with exactly 5 segments, and team colours
//     are consistent across donuts (same team -> same colour everywhere).
async function testDonutsAndColors(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_donuts_and_colors", "FAIL",
      "25 donuts, 5 segments, consistent colours", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    // Every lan-donut wrapper must hold a <figure.ve-chart> rendered as a
    // donut (.ve-chart-donut) with exactly 5 arcs (.ve-chart-arc).
    const wraps = document.querySelectorAll('[data-ve-type="lan-donut"]');
    let donutFigures = 0;
    let allFiveSeg = wraps.length > 0;
    // Colour-consistency: for each donut, the fill of arc i (= team i) must
    // equal arc i's fill in the first donut.
    let baseline = null;
    let colorsConsistent = wraps.length > 0;
    let segCounts = [];
    for (let w = 0; w < wraps.length; w++) {
      const fig = wraps[w].querySelector("figure.ve-chart");
      if (!fig) { allFiveSeg = false; continue; }
      const donut = fig.querySelector(".ve-chart-donut");
      const arcs = fig.querySelectorAll(".ve-chart-arc");
      if (donut) { donutFigures++; }
      segCounts.push(arcs.length);
      if (arcs.length !== 5) { allFiveSeg = false; }
      const fills = [];
      for (let a = 0; a < arcs.length; a++) {
        fills.push(arcs[a].getAttribute("fill") || "");
      }
      if (baseline === null) {
        baseline = fills;
      } else if (fills.length === baseline.length) {
        for (let a = 0; a < fills.length; a++) {
          if (fills[a] !== baseline[a]) { colorsConsistent = false; }
        }
      }
    }
    // The 5 baseline colours must themselves be distinct (5 teams, 5 hues).
    const distinctBaseline = baseline
      ? Object.keys(baseline.reduce((m, c) => { m[c] = 1; return m; }, {})).length
      : 0;
    return {
      wrapCount: wraps.length,
      donutFigures: donutFigures,
      allFiveSeg: allFiveSeg,
      colorsConsistent: colorsConsistent,
      distinctBaseline: distinctBaseline,
      segCountsSample: segCounts.slice(0, 6),
    };
  });
  const ok = r.wrapCount === EXPECT_NODES
    && r.donutFigures === EXPECT_NODES
    && r.allFiveSeg
    && r.colorsConsistent
    && r.distinctBaseline === EXPECT_TEAMS;
  record("lan_donuts_and_colors", ok ? "PASS" : "FAIL",
    "25 donuts, each 5 segments; 5 distinct team colours, consistent across all",
    JSON.stringify(r));
}

// 4 — all topology edges from source-1 are drawn, and the power edge is
//     visually distinct (dashed stroke-dasharray + amber/warning stroke).
async function testEdgesAndPowerEdge(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_edges_and_power_edge", "FAIL",
      "24 edges drawn; power edge distinct", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const edges = document.querySelectorAll(
      '#lan-graph-layer g[data-ve-type="diagram-edge"]');
    // Find the power edge by its STABLE data-ve-label="power" (the diagram's
    // data-ve-id embeds an internal sceneId counter, so it is not a reliable
    // selector). The composer sets edge.label="power" on ups01->core-sw01.
    const power = document.querySelector(
      '#lan-graph-layer g[data-ve-type="diagram-edge"][data-ve-label="power"]');
    let powerDashed = false;
    let powerAmber = false;
    let powerVisStroke = "";
    if (power) {
      // The visible path is the LAST > path child (first is the 14px
      // transparent hit-area twin). It must be dashed and amber.
      const paths = power.querySelectorAll(":scope > path");
      const vis = paths[paths.length - 1];
      if (vis) {
        powerDashed = !!vis.getAttribute("stroke-dasharray");
        const stroke = getComputedStyle(vis).stroke;
        powerVisStroke = stroke;
        // amber = warning token; resolve the token on a probe to compare.
        const probe = document.createElement("span");
        probe.style.color = "var(--vc-color-warning)";
        document.body.appendChild(probe);
        const warn = getComputedStyle(probe).color;
        probe.remove();
        powerAmber = (stroke === warn);
      }
    }
    // A non-power data edge must NOT be dashed (so "distinct" is meaningful).
    // Pick any edge WITHOUT the power label as the plain reference.
    let plainDashed = true;
    let plainFound = false;
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].getAttribute("data-ve-label") === "power") { continue; }
      const pp = edges[i].querySelectorAll(":scope > path");
      const pv = pp[pp.length - 1];
      plainDashed = pv ? !!pv.getAttribute("stroke-dasharray") : true;
      plainFound = true;
      break;
    }
    return {
      edgeCount: edges.length,
      hasPower: !!power,
      powerDashed: powerDashed,
      powerAmber: powerAmber,
      powerVisStroke: powerVisStroke,
      plainEdgeDashed: plainDashed,
      plainFound: plainFound,
    };
  });
  const ok = r.edgeCount === EXPECT_EDGES
    && r.hasPower
    && r.powerDashed
    && r.powerAmber
    && r.plainEdgeDashed === false;
  record("lan_edges_and_power_edge", ok ? "PASS" : "FAIL",
    "all 24 edges drawn; power edge is dashed + amber, plain edges are not",
    JSON.stringify(r));
}

// 5 — the FIXED-interaction contract across all 3 skills: every card, icon,
//     donut, edge, and donut-arc is a data-ve-id + data-ve-type atom. This
//     is the composability proof — one interaction model over 3 element
//     types. Also confirm the runtime's selection CSS is installed so the
//     atoms get triple-state feedback (hover/selected) for free.
async function testUniversalAtoms(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_universal_atoms", "FAIL",
      "every piece is a data-ve-id atom", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    function allHaveIdAndType(sel) {
      const els = document.querySelectorAll(sel);
      let ok = els.length > 0;
      for (let i = 0; i < els.length; i++) {
        if (!els[i].getAttribute("data-ve-id")
          || !els[i].getAttribute("data-ve-type")) { ok = false; }
      }
      return { count: els.length, ok: ok };
    }
    const nodes = allHaveIdAndType(
      '#lan-graph-layer g[data-ve-type="diagram-node"]');
    const edges = allHaveIdAndType(
      '#lan-graph-layer g[data-ve-type="diagram-edge"]');
    const icons = allHaveIdAndType('g[data-ve-type="lan-icon"]');
    const donuts = allHaveIdAndType("figure.ve-chart");
    const arcs = allHaveIdAndType(".ve-chart-arc");
    const chips = allHaveIdAndType('[data-ve-type="lan-address"]');
    // The runtime injects its global selection stylesheet — confirm a
    // style element exists and the svg-atom hover rule is present, so the
    // FIXED triple-feedback applies to nodes/icons/arcs uniformly.
    let hasSelCss = false;
    const styles = document.querySelectorAll("style");
    for (let i = 0; i < styles.length; i++) {
      if ((styles[i].textContent || "").indexOf(
        "svg g[data-ve-id]:hover") !== -1) { hasSelCss = true; }
    }
    return { nodes, edges, icons, donuts, arcs, chips, hasSelCss };
  });
  const ok = r.nodes.ok && r.nodes.count === EXPECT_NODES
    && r.edges.ok && r.edges.count === EXPECT_EDGES
    && r.icons.ok && r.icons.count === EXPECT_NODES
    && r.donuts.ok && r.donuts.count === EXPECT_NODES
    && r.arcs.ok && r.arcs.count === EXPECT_NODES * EXPECT_TEAMS
    && r.chips.ok && r.chips.count === EXPECT_NODES
    && r.hasSelCss;
  record("lan_universal_atoms", ok ? "PASS" : "FAIL",
    "nodes+edges+icons+donuts+arcs+chips are all data-ve-id atoms; sel CSS present",
    JSON.stringify(r));
}

// 6 — zero JS console errors when all 3 modules' init runs together (no
//     namespace clash). The fixture captures console.error + window.onerror
//     into window.__lanConsoleErrors from its very first script.
async function testNoConsoleErrors(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_no_console_errors", "FAIL",
      "no console errors when 3 modules co-boot", s.error);
    return;
  }
  // Give any deferred/animation callbacks a tick to surface late errors.
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({
    errors: (window.__lanConsoleErrors || []).slice(0, 8),
    count: (window.__lanConsoleErrors || []).length,
  }));
  const ok = r.count === 0;
  record("lan_no_console_errors", ok ? "PASS" : "FAIL",
    "the 3 modules init together with zero console errors (no clash)",
    JSON.stringify(r));
}

// 7 — no nested scrollbars: only the document scrolls. No element introduces
//     an inner overflow:auto/scroll box that actually clips its content.
async function testNoNestedScroll(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_no_nested_scroll", "FAIL",
      "no nested scrollbars", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const all = document.querySelectorAll("body *");
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = (cs.overflowY === "auto" || cs.overflowY === "scroll"
        || cs.overflowX === "auto" || cs.overflowX === "scroll");
      if (scrolls && (el.scrollHeight > el.clientHeight + 1
        || el.scrollWidth > el.clientWidth + 1)) {
        inner.push((el.id || el.className || el.tagName).toString().slice(0, 40));
      }
    }
    return { innerScrollers: inner };
  });
  const ok = r.innerScrollers.length === 0;
  record("lan_no_nested_scroll", ok ? "PASS" : "FAIL",
    "no element creates an inner scroll axis — only the document scrolls",
    JSON.stringify(r));
}

// 8 — light AND dark both theme correctly. Proven by loading the page ONCE
//     PER THEME via the fixture's ?theme= param (which sets data-ve-theme
//     before boot, so the page renders that theme from frame 1) and comparing
//     resolved colours. We deliberately do NOT flip data-ve-theme at runtime:
//     a live flip routes through the runtime's DESIGN.md re-theme path, and on
//     this composed page (graph + 25 donuts + the default DESIGN.md) that path
//     wedges the main thread — a real runtime bug, reported separately. Boot-
//     in-theme is also closer to how a shared page is actually opened. The
//     dev-browser sandbox forbids absolute screenshot paths, so — like
//     test-component-variants.js — both-themes is asserted by resolved-token
//     comparison here; the PNG screenshots for the report are captured
//     separately during build verification (Chrome DevTools), saved to
//     $MAIN_ROOT/reports/screenshots/.
async function testLightDarkThemes(page) {
  // This test drives its own navigations (light page, then dark page); it does
  // not reuse the navigate-once cache. It restores the light page at the end
  // so any later test still sees a populated, light-themed page.
  async function loadTheme(theme) {
    await page.goto(FIXTURE + "?theme=" + theme + "&cb=" + Date.now(),
      { waitUntil: "domcontentloaded" });
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const ready = await page.evaluate(() =>
        window.__lanReady === true
        && document.querySelectorAll("figure.ve-chart").length >= 25
        && !!document.querySelector("#lan-graph-layer .ve-scene-graph svg"));
      if (ready) { return true; }
      await page.waitForTimeout(80);
    }
    return false;
  }
  function capture() {
    return page.evaluate(() => {
      const root = document.documentElement;
      const probe = document.createElement("span");
      probe.style.color = "var(--vc-color-canvas)";
      document.body.appendChild(probe);
      const canvas = getComputedStyle(probe).color;
      probe.remove();
      const nodeRect = document.querySelector(
        '#lan-graph-layer g[data-ve-type="diagram-node"] > rect');
      const nodeFill = nodeRect ? getComputedStyle(nodeRect).fill : "";
      const arc = document.querySelector(".ve-chart-arc");
      const arcFill = arc ? getComputedStyle(arc).fill : "";
      return {
        theme: root.getAttribute("data-ve-theme"),
        canvas: canvas, nodeFill: nodeFill, arcFill: arcFill,
        errs: (window.__lanConsoleErrors || []).length,
      };
    });
  }
  const lightOk = await loadTheme("light");
  const light = lightOk ? await capture() : null;
  const darkOk = await loadTheme("dark");
  const dark = darkOk ? await capture() : null;
  // Restore the default (light) page for any later test.
  await loadTheme("light");
  const ok = !!light && !!dark
    && light.theme === "light" && dark.theme === "dark"
    && light.canvas && dark.canvas && light.canvas !== dark.canvas
    && light.nodeFill && dark.nodeFill && light.nodeFill !== dark.nodeFill
    && light.arcFill && dark.arcFill && light.arcFill !== dark.arcFill
    && light.errs === 0 && dark.errs === 0;
  record("lan_light_dark_themes", ok ? "PASS" : "FAIL",
    "light+dark each boot cleanly; canvas+node+arc colours differ; 0 errors",
    JSON.stringify({ light, dark }));
}

// 9 (meta) — the three element modules truly co-exist: each global is
//     installed with its public API intact AND the graph, donuts, and icons
//     all rendered into ONE page (not three separate sections). Confirms the
//     donut is nested under each icon's node (foreignObject inside the
//     overlay svg that also hosts the icon), i.e. genuinely composed.
async function testThreeModulesComposed(page) {
  const s = await setup(page);
  if (!s.ok) {
    record("lan_three_modules_composed", "FAIL",
      "3 modules genuinely composed on one page", s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const api = {
      diagram: typeof window.amvcpDiagram === "object"
        && typeof window.amvcpDiagram.init === "function",
      chart: typeof window.amvcpChart === "object"
        && typeof window.amvcpChart.scan === "function"
        && typeof window.amvcpChart.palette === "function",
      iconSvg: typeof window.amvcpIconSvg === "object"
        && typeof window.amvcpIconSvg.init === "function",
    };
    // Composition geometry: for a sample node, the icon <g>, the graph node
    // <g>, and the donut <figure> all exist and the donut's foreignObject
    // lives inside the SAME overlay svg as the icon (nesting proof). The
    // icon/donut/chip use OUR stable ids (lan-icon-/lan-donut-<id>); the
    // graph node uses the diagram's data-ve-data{nodeId} (its data-ve-id
    // embeds the volatile sceneId counter).
    const overlay = document.getElementById("lan-icon-layer");
    const sampleIcon = document.querySelector(
      '[data-ve-id="lan-icon-core-sw01"]');
    const sampleNode = document.querySelector(
      '#lan-graph-layer g[data-ve-type="diagram-node"][data-ve-data*="core-sw01"]');
    const sampleDonutWrap = document.querySelector(
      '[data-ve-id="lan-donut-core-sw01"]');
    const sampleDonutFig = sampleDonutWrap
      ? sampleDonutWrap.querySelector("figure.ve-chart") : null;
    const donutFO = sampleDonutWrap
      ? sampleDonutWrap.closest("foreignObject") : null;
    const iconInOverlay = !!(sampleIcon && overlay
      && overlay.contains(sampleIcon));
    const donutNestedInOverlay = !!(donutFO && overlay
      && overlay.contains(donutFO));
    // The donut's foreignObject y must be BELOW the node box (nested below).
    let donutBelowNode = false;
    if (donutFO && sampleNode) {
      const foY = parseFloat(donutFO.getAttribute("y") || "0");
      const tr = sampleNode.getAttribute("transform") || "";
      const m = tr.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      const nodeY = m ? parseFloat(m[2]) : 0;
      donutBelowNode = foY > nodeY;   // foreignObject sits below node top
    }
    return {
      api,
      iconInOverlay,
      donutNestedInOverlay,
      donutBelowNode,
      sampleNodeExists: !!sampleNode,
      sampleDonutFigExists: !!sampleDonutFig,
    };
  });
  const ok = r.api.diagram && r.api.chart && r.api.iconSvg
    && r.iconInOverlay
    && r.donutNestedInOverlay
    && r.donutBelowNode
    && r.sampleNodeExists
    && r.sampleDonutFigExists;
  record("lan_three_modules_composed", ok ? "PASS" : "FAIL",
    "all 3 module APIs intact; icon + donut nested at the same graph node",
    JSON.stringify(r));
}

// ── Runner ───────────────────────────────────────────────────────────────

const tests = [
  testNodesAndAddresses,
  testIconsDistinct,
  testDonutsAndColors,
  testEdgesAndPowerEdge,
  testUniversalAtoms,
  testNoConsoleErrors,
  testNoNestedScroll,
  testLightDarkThemes,
  testThreeModulesComposed,
];

const page = await browser.getPage("composability-lan-tests");

// Per-test watchdog: a single hung assertion must not wedge the whole
// suite (and, under the runner, the 180s dev-browser timeout). Each test
// races a 30s timer; a timeout is recorded as ERROR and the loop moves on.
function withTimeout(fn, label, msLimit) {
  return Promise.race([
    fn(page),
    new Promise((_, reject) => setTimeout(
      () => reject(new Error("timeout after " + msLimit + "ms")), msLimit)),
  ]);
}

try {
  for (const t of tests) {
    try {
      await withTimeout(t, t.name, 30000);
    } catch (e) {
      record(t.name || "unnamed", "ERROR", t.name || "",
        String((e && e.message) || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | `
      + `${r.detail.replace(/\|/g, "/")}`);
  }
} finally {
  await page.close();
}
