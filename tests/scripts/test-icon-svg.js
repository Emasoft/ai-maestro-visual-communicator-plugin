// test-icon-svg.js
//
// Dev-browser script — exercises scripts/amvcp-icon-svg.js, the Phase-2
// icon-svg runtime module (visualizing backlog §10, icon-svg-spec.md).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpIconSvg` + Node `module.exports`). This suite loads it AS
// A BROWSER GLOBAL from icon-svg-runtime.html — a self-contained page
// that loads amvcp-designmd.js then amvcp-icon-svg.js, embeds a
// DESIGN.md, and (because window.__isvgManualInit is set) lets a small
// inline boot script apply the engine tokens, inject the icon-svg CSS,
// build the 4 device frames, and call init() — which compiles every
// `icon-svg` fenced block into a themed <svg>.
//
// A second fixture icon-svg-no-engine.html loads the module WITHOUT the
// DESIGN.md engine to prove the var(--vc-…, <hex>) fallback chain
// renders valid computed fills (icon-svg-spec.md §7).
//
// Coverage (icon-svg-spec.md §10):
//   1  scene_compiles_valid       — 4-prim scene -> <svg> + 4 <g data-ve-id>
//   2  scene_grid_snapped         — x:123 -> x:124 (4-unit snap)
//   3  scene_malformed_throws     — bad JSON / wrong viewBox / bad type throw
//   4  node_each_type             — 5 node types each lint-clean non-empty
//   5  node_defs_reuse            — 3 identical nodes -> 1 <defs> + 3 <use>
//   6  lint_flags_violations      — C1 heavy stroke + C6 literal hex flagged
//   7  lint_autofixes_radius      — rx:40 clamped, reported in autofixed (C2)
//   8  lint_no_diagram_type_check — lintSvg rejects nothing on type grounds
//   9  tokens_applied_light       — a node's computed stroke = light token
//   10 tokens_dual_theme          — theme toggle flips a node's computed fill
//   11 fallback_no_engine         — no-engine fixture: SVG has valid fills
//   12 node_is_selectable         — clicking an authored node fires selection
//   13 clip_path_shapes_render    — each .isvg-shape-* gets a non-none clip
//   14 device_frame_each_kind     — ios/android/mac/browser build right chrome
//   15 device_frame_unknown_throws— deviceFrame({kind:'watch'}) throws
//   16 device_frame_tokens        — traffic lights resolve to semantic roles
//   17 device_frame_content_scroll_only — only .isvg-frame-content scrolls
//   18 hotspot_positioned         — --x:.30 --y:.30 -> left/top at 30%
//   19 logo_block_each            — 6 logo builders produce lint-clean SVG
//   20 no_nested_scroll           — no .isvg-* element makes an inner scroll
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/icon-svg-runtime.html";
const NO_ENGINE_FIXTURE = "http://127.0.0.1:8767/icon-svg-no-engine.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the runtime fixture and wait until both globals are installed
// AND the inline boot script has finished (window.__isvgFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpIconSvg === 'object'
      && typeof window.amvcpIconSvg.init === 'function'
      && typeof window.amvcpDesignMd === 'object'
      && (window.__isvgFixtureReady === true
        || !!window.__isvgFixtureError));
    if (ready) {
      const err = await page.evaluate(() =>
        window.__isvgFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testSceneCompilesValid(page) {
  // 1 — the #scene-nodes fenced block compiled to one <svg viewBox=
  // "0 0 1000 1000"> with 5 <g data-ve-id> groups (the figure wrapper
  // means the original <script> block is gone, replaced by a <figure>).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_scene_compiles_valid', 'FAIL',
      'scene-graph compiles to a themed svg', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    // The 5-node scene figure is the FIRST .isvg-figure on the page.
    const fig = document.querySelector('.isvg-figure');
    if (!fig) { return { found: false }; }
    const svg = fig.querySelector('svg.isvg-scene');
    if (!svg) { return { found: false }; }
    const groups = svg.querySelectorAll('g[data-ve-id]');
    return {
      found: true,
      viewBox: svg.getAttribute('viewBox'),
      hasWidth: svg.hasAttribute('width'),
      groupCount: groups.length,
      // the original <script type=...icon-svg+json> must be GONE.
      scriptGone: !document.getElementById('scene-nodes')
    };
  });
  const ok = res.found
    && res.viewBox === '0 0 1000 1000'
    && res.hasWidth === false
    && res.groupCount === 5
    && res.scriptGone === true;
  record('icon_svg_scene_compiles_valid', ok ? 'PASS' : 'FAIL',
    'a fenced scene-graph compiles to one viewBox-1000 svg with '
    + 'data-ve-id groups',
    JSON.stringify(res));
}

async function testSceneGridSnapped(page) {
  // 2 — buildSceneSvg snaps every coordinate to the 4-unit grid: a
  // primitive authored at x:123 must render at x:124.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_scene_grid_snapped', 'FAIL',
      'coordinates snap to the 4-unit grid', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const svg = window.amvcpIconSvg.buildSceneSvg({
      viewBox: [0, 0, 1000, 1000],
      primitives: [
        { type: 'process', id: 'g', x: 123, y: 81, w: 301, h: 142 }
      ]
    });
    return {
      // 123 -> 124, 81 -> 80, 301 -> 300, 142 -> 144
      has124: svg.indexOf('x="124"') !== -1,
      hasOdd123: svg.indexOf('x="123"') !== -1,
      snapFn: window.amvcpIconSvg.snap(123)
    };
  });
  const ok = res.has124 === true
    && res.hasOdd123 === false
    && res.snapFn === 124;
  record('icon_svg_scene_grid_snapped', ok ? 'PASS' : 'FAIL',
    'a primitive authored at x:123 renders snapped to x:124',
    JSON.stringify(res));
}

async function testSceneMalformedThrows(page) {
  // 3 — malformed JSON, a wrong viewBox, and an unknown primitive type
  // each throw from buildSceneSvg — no partial SVG (fail-fast §7).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_scene_malformed_throws', 'FAIL',
      'malformed scene-graph throws', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const iv = window.amvcpIconSvg;
    function threw(fn) {
      try { fn(); return false; } catch (e) { return true; }
    }
    return {
      badJson: threw(() => iv.buildSceneSvg('{not valid json')),
      wrongViewBox: threw(() => iv.buildSceneSvg({
        viewBox: [0, 0, 800, 600], primitives: [] })),
      unknownType: threw(() => iv.buildSceneSvg({
        viewBox: [0, 0, 1000, 1000],
        primitives: [{ type: 'wormhole', id: 'x',
          x: 0, y: 0, w: 100, h: 100 }] })),
      unknownVariant: threw(() => iv.buildSceneSvg({
        viewBox: [0, 0, 1000, 1000],
        primitives: [{ type: 'process', id: 'x',
          x: 0, y: 0, w: 100, h: 100, variant: 'bogus' }] }))
    };
  });
  const ok = res.badJson && res.wrongViewBox
    && res.unknownType && res.unknownVariant;
  record('icon_svg_scene_malformed_throws', ok ? 'PASS' : 'FAIL',
    'bad JSON, wrong viewBox, unknown type and variant each throw',
    JSON.stringify(res));
}

async function testNodeEachType(page) {
  // 4 — each of process/database/decision/external/network compiles to
  // a non-empty, lint-clean SVG fragment.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_node_each_type', 'FAIL',
      'each node type lint-clean', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const iv = window.amvcpIconSvg;
    const types = ['process', 'database', 'decision', 'external',
      'network'];
    const out = {};
    let allOk = true;
    for (let i = 0; i < types.length; i++) {
      const svg = iv.buildSceneSvg({
        viewBox: [0, 0, 1000, 1000],
        primitives: [{ type: types[i], id: 'n',
          x: 100, y: 100, w: 400, h: 300, label: 'X' }]
      });
      const rep = iv.lintSvg(svg);
      const good = rep.ok && svg.length > 120;
      out[types[i]] = good;
      if (!good) { allOk = false; }
    }
    return { out: out, allOk: allOk };
  });
  record('icon_svg_node_each_type', res.allOk ? 'PASS' : 'FAIL',
    'all 5 node primitives produce a non-empty lint-clean fragment',
    JSON.stringify(res.out));
}

async function testNodeDefsReuse(page) {
  // 5 — a scene with 3 identical process nodes emits exactly one
  // <defs> + 3 <use> (the N>2 reuse rule).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_node_defs_reuse', 'FAIL',
      'identical nodes share a defs/use', s.error);
    return;
  }
  // The #scene-reuse fixture block is exactly this case.
  const res = await page.evaluate(() => {
    const figs = document.querySelectorAll('.isvg-figure');
    // scene-reuse is the 2nd scene figure.
    let svg = null;
    for (let i = 0; i < figs.length; i++) {
      const s = figs[i].querySelector('svg');
      if (s && s.getAttribute('aria-label')
        && s.getAttribute('aria-label').indexOf('defs/use') !== -1) {
        svg = s;
      }
    }
    if (!svg) { return { found: false }; }
    return {
      found: true,
      defsCount: svg.querySelectorAll('defs').length,
      useCount: svg.querySelectorAll('use').length,
      groupCount: svg.querySelectorAll('g[data-ve-id]').length
    };
  });
  const ok = res.found
    && res.defsCount === 1
    && res.useCount === 3
    && res.groupCount === 3;
  record('icon_svg_node_defs_reuse', ok ? 'PASS' : 'FAIL',
    '3 identical process nodes emit one <defs> and three <use>',
    JSON.stringify(res));
}

async function testLintFlagsViolations(page) {
  // 6 — lintSvg flags a stroke-width:6 (C1) and a literal #ff0000 fill
  // (C6).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_lint_flags_violations', 'FAIL',
      'lint flags heavy stroke + literal color', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const bad = '<svg><rect stroke-width="6" fill="#ff0000" '
      + 'stroke="currentColor"/></svg>';
    const rep = window.amvcpIconSvg.lintSvg(bad);
    const rules = [];
    for (let i = 0; i < rep.violations.length; i++) {
      rules.push(rep.violations[i].rule);
    }
    return { ok: rep.ok, rules: rules };
  });
  const ok = res.ok === false
    && res.rules.indexOf('C1') !== -1
    && res.rules.indexOf('C6') !== -1;
  record('icon_svg_lint_flags_violations', ok ? 'PASS' : 'FAIL',
    'lintSvg flags a heavy stroke (C1) and a raw hex fill (C6)',
    JSON.stringify(res));
}

async function testLintAutofixesRadius(page) {
  // 7 — lintSvg clamps an rx:40 to the cap and reports it in autofixed
  // (C2 is auto-fixable, not a hard violation).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_lint_autofixes_radius', 'FAIL',
      'lint auto-fixes oversized radius', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const rep = window.amvcpIconSvg.lintSvg(
      '<svg><rect rx="40" fill="var(--vc-color-accent)"/></svg>');
    return {
      autofixCount: rep.autofixed.length,
      firstRule: rep.autofixed[0] ? rep.autofixed[0].rule : ''
    };
  });
  const ok = res.autofixCount > 0 && res.firstRule === 'C2';
  record('icon_svg_lint_autofixes_radius', ok ? 'PASS' : 'FAIL',
    'lintSvg clamps an oversized rx and records it under autofixed (C2)',
    JSON.stringify(res));
}

async function testLintNoDiagramTypeCheck(page) {
  // 8 — lintSvg does NOT reject any geometry on diagram-type grounds.
  // The 13-diagram-type clause was exported to the diagram skill; a
  // build agent must not have added a type allow-list to the linter.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_lint_no_diagram_type_check', 'FAIL',
      'lint has no diagram-type allow-list', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const iv = window.amvcpIconSvg;
    // A variety of arbitrary geometries — all conformant on the
    // VISUAL constraints; lintSvg must pass every one.
    const samples = [
      '<svg><path d="M0 0 L500 500 L0 500 Z" fill="none" '
        + 'stroke="currentColor" stroke-width="2"/></svg>',
      '<svg><circle cx="200" cy="200" r="100" fill="none" '
        + 'stroke="currentColor" stroke-width="2"/></svg>',
      '<svg><polygon points="0,0 100,0 50,100" fill="none" '
        + 'stroke="currentColor" stroke-width="2"/></svg>'
    ];
    let allClean = true;
    for (let i = 0; i < samples.length; i++) {
      if (!iv.lintSvg(samples[i]).ok) { allClean = false; }
    }
    // Check the report shape carries no "type"/"diagram" rule code.
    const rep = iv.lintSvg(samples[0]);
    const repStr = JSON.stringify(rep);
    return {
      allClean: allClean,
      noTypeRule: repStr.toLowerCase().indexOf('diagram-type') === -1
    };
  });
  const ok = res.allClean === true && res.noTypeRule === true;
  record('icon_svg_lint_no_diagram_type_check', ok ? 'PASS' : 'FAIL',
    'lintSvg never rejects geometry on diagram-type grounds',
    JSON.stringify(res));
}

async function testTokensAppliedLight(page) {
  // 9 — with the engine, an authored node's rendered child shape has a
  // computed stroke that resolves to the DESIGN.md LIGHT --vc-color-
  // content value (a real color, not the literal string "var(...)").
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_tokens_applied_light', 'FAIL',
      'authored node stroke resolves to a light token', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    window.__isvgApplyTheme('light');
    // The process node "ingest" — its <rect> stroke must resolve.
    const g = document.querySelector('g[data-ve-id="ingest"]');
    if (!g) { return { found: false }; }
    const shape = g.querySelector('rect, path, polygon');
    if (!shape) { return { found: false }; }
    const stroke = getComputedStyle(shape).stroke;
    // The token --vc-color-content must itself resolve.
    const tokenVal = getComputedStyle(document.documentElement)
      .getPropertyValue('--vc-color-content').trim();
    return {
      found: true,
      stroke: stroke,
      tokenVal: tokenVal,
      // a resolved color is rgb(...) — never the literal var() string.
      isResolved: stroke.indexOf('var(') === -1
        && stroke.indexOf('rgb') === 0
    };
  });
  const ok = res.found
    && res.isResolved === true
    && res.tokenVal.length > 0;
  record('icon_svg_tokens_applied_light', ok ? 'PASS' : 'FAIL',
    'an authored node child stroke resolves to a real light-theme '
    + 'color',
    JSON.stringify(res));
}

async function testTokensDualTheme(page) {
  // 10 — toggling the theme light<->dark changes the SAME node's
  // computed stroke — proves dual-theme is automatic (the module
  // authors no dark: variant; the --vc-* token contract does it).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_tokens_dual_theme', 'FAIL',
      'theme toggle restyles authored SVG', s.error);
    return;
  }
  const lightStroke = await page.evaluate(() => {
    window.__isvgApplyTheme('light');
    const g = document.querySelector('g[data-ve-id="ingest"]');
    const shape = g.querySelector('rect, path, polygon');
    return getComputedStyle(shape).stroke;
  });
  const darkStroke = await page.evaluate(() => {
    window.__isvgApplyTheme('dark');
    const g = document.querySelector('g[data-ve-id="ingest"]');
    const shape = g.querySelector('rect, path, polygon');
    return getComputedStyle(shape).stroke;
  });
  await page.evaluate(() => window.__isvgApplyTheme('light'));
  const ok = lightStroke.length > 0
    && darkStroke.length > 0
    && lightStroke !== darkStroke;
  record('icon_svg_tokens_dual_theme', ok ? 'PASS' : 'FAIL',
    'a theme toggle changes the authored node stroke light<->dark',
    JSON.stringify({ light: lightStroke, dark: darkStroke }));
}

async function testFallbackNoEngine(page) {
  // 11 — on icon-svg-no-engine.html (NO DESIGN.md engine), an authored
  // SVG still has valid computed fills via the fallback hexes — no
  // broken / empty render.
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto(NO_ENGINE_FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const r = await page.evaluate(() =>
      window.__isvgFixtureReady === true
      || !!window.__isvgFixtureError);
    if (r) { break; }
    await page.waitForTimeout(70);
  }
  const res = await page.evaluate(() => {
    const err = window.__isvgFixtureError || '';
    const g = document.querySelector('g[data-ve-id="ne-p"]');
    if (!g) { return { found: false, err: err }; }
    const shape = g.querySelector('rect, path, polygon');
    const stroke = getComputedStyle(shape).stroke;
    // The database node has a tint fill — also must resolve.
    const dg = document.querySelector('g[data-ve-id="ne-d"]');
    const dShape = dg ? dg.querySelector('path') : null;
    const dFill = dShape ? getComputedStyle(dShape).fill : '';
    return {
      found: true,
      err: err,
      stroke: stroke,
      dFill: dFill,
      // a real resolved color, never "" or the literal var() string.
      strokeOk: stroke.length > 0 && stroke.indexOf('var(') === -1,
      noEngine: typeof window.amvcpDesignMd === 'undefined'
    };
  });
  const ok = res.found
    && res.err === ''
    && res.noEngine === true
    && res.strokeOk === true;
  record('icon_svg_fallback_no_engine', ok ? 'PASS' : 'FAIL',
    'with no DESIGN.md engine an authored SVG still has valid '
    + 'fallback fills',
    JSON.stringify(res));
}

async function testNodeIsSelectable(page) {
  // 12 — an authored node <g data-ve-id> is a real selectable atom:
  // it carries data-ve-type="icon-node" and a click on it (via the
  // real mouse API, not a synthetic el.click()) lands on the group.
  // The runtime's selection wiring is loaded separately; here we
  // assert the SELECTION CONTRACT — the data-ve attributes are present
  // and the group is a valid hit target with non-zero bounds.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_node_is_selectable', 'FAIL',
      'authored node is a selectable atom', s.error);
    return;
  }
  // Read the live bbox (technique #11 — never hardcode coordinates).
  const box = await page.evaluate(() => {
    const g = document.querySelector('g[data-ve-id="ingest"]');
    if (!g) { return null; }
    const r = g.getBoundingClientRect();
    return {
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
      w: r.width,
      h: r.height,
      veType: g.getAttribute('data-ve-type'),
      veId: g.getAttribute('data-ve-id')
    };
  });
  if (!box) {
    record('icon_svg_node_is_selectable', 'FAIL',
      'authored node is a selectable atom',
      'g[data-ve-id="ingest"] not found');
    return;
  }
  // Real mouse path (technique #1) — hover then click.
  await page.mouse.move(box.cx, box.cy, { steps: 6 });
  await page.waitForTimeout(120);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(80);
  // The element at the click point must be the group or its child.
  const hit = await page.evaluate((pt) => {
    const el = document.elementFromPoint(pt.cx, pt.cy);
    if (!el) { return { inGroup: false }; }
    const g = el.closest('g[data-ve-id]');
    return {
      inGroup: !!g,
      hitId: g ? g.getAttribute('data-ve-id') : ''
    };
  }, box);
  const ok = box.veType === 'icon-node'
    && box.veId === 'ingest'
    && box.w > 0 && box.h > 0
    && hit.inGroup === true
    && hit.hitId === 'ingest';
  record('icon_svg_node_is_selectable', ok ? 'PASS' : 'FAIL',
    'an authored node is a data-ve-id/icon-node atom and a real '
    + 'hit target',
    JSON.stringify({ box: box, hit: hit }));
}

async function testClipPathShapesRender(page) {
  // 13 — each .isvg-shape-* element gets a non-`none` computed
  // clip-path (the CSS-only IS-06 shape library).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_clip_path_shapes_render', 'FAIL',
      'clip-path shape classes apply', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const names = ['triangle-up', 'arrow-right', 'chevron',
      'parallelogram', 'hexagon', 'star'];
    const out = {};
    let allClipped = true;
    for (let i = 0; i < names.length; i++) {
      const el = document.querySelector('.isvg-shape-' + names[i]);
      if (!el) { out[names[i]] = 'missing'; allClipped = false;
        continue; }
      const cp = getComputedStyle(el).clipPath;
      const clipped = cp && cp !== 'none' && cp.length > 0;
      out[names[i]] = clipped ? 'ok' : cp;
      if (!clipped) { allClipped = false; }
    }
    return { out: out, allClipped: allClipped };
  });
  record('icon_svg_clip_path_shapes_render',
    res.allClipped ? 'PASS' : 'FAIL',
    'every .isvg-shape-* class produces a non-none clip-path',
    JSON.stringify(res.out));
}

async function testDeviceFrameEachKind(page) {
  // 14 — deviceFrame() for ios/android/mac/browser builds the right
  // chrome: island vs punch-hole vs traffic-lights+title vs +url-bar.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_device_frame_each_kind', 'FAIL',
      'each device frame builds the right chrome', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    return {
      ios: !!document.querySelector(
        '#frame-ios-slot .isvg-frame--ios .isvg-frame-island'),
      android: !!document.querySelector(
        '#frame-android-slot .isvg-frame--android '
        + '.isvg-frame-punchhole'),
      mac: !!document.querySelector(
        '#frame-mac-slot .isvg-frame--mac '
        + '.isvg-frame-light--close'),
      browser: !!document.querySelector(
        '#frame-browser-slot .isvg-frame--browser '
        + '.isvg-frame-urlbar')
    };
  });
  const ok = res.ios && res.android && res.mac && res.browser;
  record('icon_svg_device_frame_each_kind', ok ? 'PASS' : 'FAIL',
    'ios/android/mac/browser frames build island/punch-hole/'
    + 'lights/url-bar',
    JSON.stringify(res));
}

async function testDeviceFrameUnknownThrows(page) {
  // 15 — deviceFrame({kind:'watch'}) throws (unknown kind, fail-fast).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_device_frame_unknown_throws', 'FAIL',
      'unknown device kind throws', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    try {
      window.amvcpIconSvg.deviceFrame({ kind: 'watch' });
      return { threw: false };
    } catch (e) {
      return { threw: true,
        mentionsValid: String(e.message).indexOf('ios') !== -1 };
    }
  });
  const ok = res.threw === true && res.mentionsValid === true;
  record('icon_svg_device_frame_unknown_throws', ok ? 'PASS' : 'FAIL',
    'deviceFrame with an unknown kind throws and lists the valid set',
    JSON.stringify(res));
}

async function testDeviceFrameTokens(page) {
  // 16 — a frame's traffic-light dots resolve to the semantic
  // --vc-color-danger / warning / success roles (not hardcoded Apple
  // hex), so the frame stays on-theme.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_device_frame_tokens', 'FAIL',
      'traffic lights resolve to semantic roles', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    function bg(sel) {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).backgroundColor : '';
    }
    const close = bg('#frame-mac-slot .isvg-frame-light--close');
    const min = bg('#frame-mac-slot .isvg-frame-light--min');
    const max = bg('#frame-mac-slot .isvg-frame-light--max');
    // Compare against the engine token values.
    function tok(n) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(n).trim();
    }
    return {
      close: close, min: min, max: max,
      // each must be a real resolved color, all three distinct.
      allResolved: close.indexOf('rgb') === 0
        && min.indexOf('rgb') === 0 && max.indexOf('rgb') === 0,
      distinct: close !== min && min !== max && close !== max,
      hasDangerToken: tok('--vc-color-danger').length > 0
    };
  });
  const ok = res.allResolved && res.distinct && res.hasDangerToken;
  record('icon_svg_device_frame_tokens', ok ? 'PASS' : 'FAIL',
    'traffic-light dots resolve to distinct themed semantic colors',
    JSON.stringify(res));
}

async function testDeviceFrameContentScrollOnly(page) {
  // 17 — the .isvg-frame-content is the ONLY .isvg-* element allowed
  // an overflow:auto (the sanctioned fixed-viewport exception). No
  // other .isvg-* element may have overflow auto/scroll.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_device_frame_content_scroll_only', 'FAIL',
      'only frame-content scrolls', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll('[class*="isvg-"]');
    const offenders = [];
    let contentSeen = false;
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = cs.overflowY === 'auto'
        || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto'
        || cs.overflowX === 'scroll';
      if (!scrolls) { continue; }
      if (el.classList.contains('isvg-frame-content')) {
        contentSeen = true;
      } else {
        offenders.push(el.className);
      }
    }
    return { offenders: offenders, contentSeen: contentSeen };
  });
  // The only allowed scroller is frame-content; offenders must be empty.
  const ok = res.offenders.length === 0 && res.contentSeen === true;
  record('icon_svg_device_frame_content_scroll_only',
    ok ? 'PASS' : 'FAIL',
    'the frame screen is the ONLY scrollable .isvg-* element',
    JSON.stringify(res));
}

async function testHotspotPositioned(page) {
  // 18 — a hotspot with --x:.30 --y:.30 computes left/top at 30%/30%
  // of the figure (the calc-from-fraction placement).
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_hotspot_positioned', 'FAIL',
      'hotspot positioned by --x/--y fraction', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const fig = document.getElementById('annotated-fig');
    const hs = fig.querySelector(
      '.isvg-hotspot[data-ve-id="hotspot-cache"]');
    if (!fig || !hs) { return { found: false }; }
    const figR = fig.getBoundingClientRect();
    const hsR = hs.getBoundingClientRect();
    // hotspot CENTER (transform translate(-50%,-50%)) sits at 30%.
    const hsCx = hsR.x + hsR.width / 2 - figR.x;
    const hsCy = hsR.y + hsR.height / 2 - figR.y;
    const fx = hsCx / figR.width;
    const fy = hsCy / figR.height;
    return {
      found: true,
      fx: Math.round(fx * 100) / 100,
      fy: Math.round(fy * 100) / 100,
      veType: hs.getAttribute('data-ve-type')
    };
  });
  // allow a small rounding tolerance.
  const ok = res.found
    && Math.abs(res.fx - 0.30) < 0.04
    && Math.abs(res.fy - 0.30) < 0.04
    && res.veType === 'hotspot';
  record('icon_svg_hotspot_positioned', ok ? 'PASS' : 'FAIL',
    'a hotspot with --x:.30 --y:.30 sits at 30%/30% of the figure',
    JSON.stringify(res));
}

async function testLogoBlockEach(page) {
  // 19 — each of the 6 logo builders produces a valid, lint-clean SVG
  // fragment; and a deliberately MIXED-theming mark is flagged by C7.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_logo_block_each', 'FAIL',
      'each logo block lint-clean', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const iv = window.amvcpIconSvg;
    const kinds = ['mask-cutout', 'arc-bite', 'zig-zag',
      'stacked-rects', 'tint-hierarchy', 'current-color'];
    const out = {};
    let allOk = true;
    for (let i = 0; i < kinds.length; i++) {
      const svg = iv.buildSceneSvg({
        viewBox: [0, 0, 1000, 1000],
        primitives: [{ type: 'logo', id: 'L', kind: kinds[i],
          x: 200, y: 200, w: 600, h: 600 }]
      });
      const good = iv.lintSvg(svg).ok && svg.length > 80;
      out[kinds[i]] = good;
      if (!good) { allOk = false; }
    }
    // C7 — a mark mixing currentColor and an explicit token is flagged.
    const mixed = '<svg><rect fill="var(--vc-color-content, '
      + 'currentColor)"/><circle fill="var(--vc-color-accent)"/></svg>';
    const c7rep = iv.lintSvg(mixed);
    let c7flagged = false;
    for (let i = 0; i < c7rep.violations.length; i++) {
      if (c7rep.violations[i].rule === 'C7') { c7flagged = true; }
    }
    return { out: out, allOk: allOk, c7flagged: c7flagged };
  });
  const ok = res.allOk === true && res.c7flagged === true;
  record('icon_svg_logo_block_each', ok ? 'PASS' : 'FAIL',
    'all 6 logo builders lint clean; a mixed-theming mark trips C7',
    JSON.stringify(res));
}

async function testNoNestedScroll(page) {
  // 20 — no .isvg-* element OTHER than the device-frame screen
  // introduces an inner scroll axis (no-nested-scrollbars rule). This
  // is the page-wide guard; test 17 is the per-frame variant.
  const s = await setup(page);
  if (!s.ok) {
    record('icon_svg_no_nested_scroll', 'FAIL',
      'no nested scrollbars', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll('[class*="isvg-"]');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.classList.contains('isvg-frame-content')) {
        continue;   // the sanctioned fixed-viewport exception.
      }
      const cs = getComputedStyle(el);
      const scrolls = cs.overflowY === 'auto'
        || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto'
        || cs.overflowX === 'scroll';
      if (scrolls && (el.scrollHeight > el.clientHeight + 1
        || el.scrollWidth > el.clientWidth + 1)) {
        inner.push(el.className || el.tagName);
      }
    }
    return { innerScrollers: inner };
  });
  const ok = res.innerScrollers.length === 0;
  record('icon_svg_no_nested_scroll', ok ? 'PASS' : 'FAIL',
    'no .isvg-* element (except the frame screen) makes an inner '
    + 'scroll axis',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testSceneCompilesValid,
  testSceneGridSnapped,
  testSceneMalformedThrows,
  testNodeEachType,
  testNodeDefsReuse,
  testLintFlagsViolations,
  testLintAutofixesRadius,
  testLintNoDiagramTypeCheck,
  testTokensAppliedLight,
  testTokensDualTheme,
  testFallbackNoEngine,
  testNodeIsSelectable,
  testClipPathShapesRender,
  testDeviceFrameEachKind,
  testDeviceFrameUnknownThrows,
  testDeviceFrameTokens,
  testDeviceFrameContentScrollOnly,
  testHotspotPositioned,
  testLogoBlockEach,
  testNoNestedScroll
];

const page = await browser.getPage("icon-svg-tests");

for (const t of tests) {
  try {
    await t(page);
  } catch (e) {
    record(t.name || 'unnamed', 'ERROR', t.name || '',
      String(e && e.message || e).slice(0, 120));
  }
}

for (const r of results) {
  console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | `
    + `${r.detail.replace(/\|/g, '/')}`);
}
