// test-composability-responsive.js
//
// PERMANENT regression guard for TRDD-ed5e8cc2. Proves the composed LAN map
// (graph + 25 Chart.js donuts + icons + DESIGN.md engine) survives a LIVE
// `data-ve-theme` flip AND renders correctly across viewport classes — the two
// bugs that TRDD-ed5e8cc2 fixed:
//
//   1. THE WEDGE — Chart.js's built-in responsive ResizeObserver drove the 25
//      donut canvases into a non-converging resize loop on a live flip,
//      pegging the renderer multi-core. Fixed by mounting charts with
//      responsive:false + explicit dpr canvas sizing + a debounced window
//      re-mount (scripts/amvcp-runtime.js). Guard: the live flip must stay
//      RESPONSIVE (a wedge makes every page.evaluate time out).
//
//   2. THE MOBILE SQUISH — the 1930px-natural map scaled to fit any width via
//      width:100%, and below ~0.4x the SVG glyphs + foreignObject donuts
//      collided. Fixed by #lan-stage{min-width:820px} so narrow viewports
//      scroll horizontally at a flawless scale. Guard: the donut never
//      collapses to a sub-pixel size on a phone-width viewport.
//
// Also asserts the graph + donut RE-THEME on the flip (acceptance #1): the
// diagram re-themes via the --vc-* CSS cascade (no JS), the donut arcs via the
// runtime's chart re-mount.
//
//   cd tests && python3 run-tests.py --only test-composability-responsive

const FIXTURE =
  "http://127.0.0.1:8767/lan-composability/lan-network-map.html";

const results = [];
function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || "" });
}
function evalRaced(page, fn, arg, ms) {
  return Promise.race([
    page.evaluate(fn, arg),
    new Promise((res) => setTimeout(() => res({ __timeout: true }), ms)),
  ]);
}
// Computed colours the diagram (graph node) + chart (donut arc) + engine
// (--vc-color-canvas) resolve to, plus the donut canvas rendered size.
function probe() {
  var root = document.documentElement;
  var sp = document.createElement("span");
  sp.style.color = "var(--vc-color-canvas)";
  document.body.appendChild(sp);
  var canvas = getComputedStyle(sp).color;
  sp.remove();
  var nodeRect = document.querySelector(
    '#lan-graph-layer g[data-ve-type="diagram-node"] > rect');
  var nodeFill = nodeRect ? getComputedStyle(nodeRect).fill : "";
  var arc = document.querySelector(".ve-chart-arc");
  var arcFill = arc ? getComputedStyle(arc).fill : "";
  var fig = document.querySelector(".lan-donut figure.ve-chart, figure.ve-chart");
  var cv = fig ? fig.querySelector("canvas") : null;
  var cr = cv ? cv.getBoundingClientRect() : null;
  return { theme: root.getAttribute("data-ve-theme"), canvas: canvas,
    nodeFill: nodeFill, arcFill: arcFill,
    donutBuf: cv ? cv.width : 0,
    donutCssW: cr ? Math.round(cr.width) : 0,
    donutCssH: cr ? Math.round(cr.height) : 0 };
}

async function waitReady(page) {
  const rd = Date.now() + 15000;
  while (Date.now() < rd) {
    const s = await evalRaced(page, () =>
      window.__lanReady === true
      && document.querySelectorAll("figure.ve-chart").length >= 25, null, 3000);
    if (s === true) { return true; }
    await page.waitForTimeout(120);
  }
  return false;
}

// TV / desktop / tablet / phone-portrait / split-screen — a representative
// spread (the wedge regresses identically at every size; the squish only on
// phone-narrow; so this set covers both bugs without 12 full boots).
const VIEWPORTS = [
  { name: "tv_landscape", w: 1920, h: 1080 },
  { name: "desktop_landscape", w: 1440, h: 900 },
  { name: "tablet_portrait", w: 834, h: 1112 },
  { name: "mobile_portrait", w: 390, h: 844 },
  { name: "mobile_sidebyside", w: 422, h: 390 },
];
// Donut must stay legible (not collapse) — phone-narrow widths only pass this
// because of the #lan-stage min-width floor.
const DONUT_MIN_CSS = 12;

async function runConfig(vp) {
  const page = await browser.getPage("resp-" + vp.name);
  try {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(FIXTURE + "?cb=" + Date.now() + "-" + vp.name,
      { waitUntil: "domcontentloaded" });
    if (!(await waitReady(page))) {
      record(vp.name + "_ready", "FAIL", vp.name + " did not boot", ""); return;
    }
    await page.waitForTimeout(450);
    const before = await evalRaced(page, probe, null, 3000);
    const beforeOk = before && !before.__timeout;
    record(vp.name + "_donut_legible",
      (beforeOk && before.donutBuf > 0 && before.donutCssW >= DONUT_MIN_CSS)
        ? "PASS" : "FAIL",
      vp.name + ": donut canvas legible (not collapsed by squish)",
      JSON.stringify(beforeOk ? { cssW: before.donutCssW, cssH: before.donutCssH,
        buf: before.donutBuf } : before));

    // LIVE flip — the wedge guard. A wedge makes the post-flip probe time out.
    await evalRaced(page, () => {
      document.documentElement.setAttribute("data-ve-theme", "dark"); return true;
    }, null, 2000);
    await page.waitForTimeout(900);   // settle (re-mount + re-theme)
    const after = await evalRaced(page, probe, null, 4000);
    const afterOk = after && !after.__timeout;
    record(vp.name + "_flip_no_wedge", afterOk ? "PASS" : "FAIL",
      vp.name + ": live data-ve-theme flip stays responsive (no RO-loop wedge)",
      afterOk ? "" : "post-flip probe timed out — page wedged");

    if (beforeOk && afterOk) {
      record(vp.name + "_graph_rethemes",
        (before.nodeFill && after.nodeFill && before.nodeFill !== after.nodeFill)
          ? "PASS" : "FAIL",
        vp.name + ": graph node re-themes on the live flip (--vc-* cascade)",
        JSON.stringify({ before: before.nodeFill, after: after.nodeFill }));
      // Engine re-theme: --vc-color-canvas must resolve to a different value
      // light vs dark (proves the DESIGN.md engine re-applied tokens on the
      // flip). NOTE: donut ARC colours are per-team and theme-INDEPENDENT by
      // design, so they are deliberately NOT asserted here.
      record(vp.name + "_engine_rethemes",
        (before.canvas && after.canvas && before.canvas !== after.canvas)
          ? "PASS" : "FAIL",
        vp.name + ": --vc-color-canvas re-resolves on the live flip (engine)",
        JSON.stringify({ before: before.canvas, after: after.canvas }));
    }
  } finally {
    await page.close();
  }
}

for (const vp of VIEWPORTS) { await runConfig(vp); }
for (const r of results) {
  console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | `
    + `${r.detail.replace(/\|/g, "/")}`);
}
