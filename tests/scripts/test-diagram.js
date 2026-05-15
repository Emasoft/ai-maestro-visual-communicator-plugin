// test-diagram.js
//
// Dev-browser script — exercises scripts/amvcp-diagram.js, the Phase-2
// consolidated diagram runtime module (visualizing backlog §3,
// TRDD-352ef46a).
//
// The module is a dependency-free dual-export (browser global
// `window.amvcpDiagram` + Node `module.exports`). This suite loads it
// AS A BROWSER GLOBAL from diagram-fixture.html — a self-contained page
// that loads amvcp-diagram.js, supplies a full --vc-* token palette via
// two :root blocks (light + a data-ve-theme="dark" override), embeds
// several scene graphs, and (because window.__vcDiagramManualInit is
// set) lets a small inline boot script inject the diagram CSS and call
// init() deterministically.
//
// The diagram module is fully DEFENSIVE — it renders with no DESIGN.md
// engine present, reading every token via var(--vc-…, fallback). This
// fixture has no engine and no runtime, so the suite proves the
// standalone path end-to-end.
//
// Coverage (diagram-spec.md §13):
//   1  every scene graph renders to an <svg> with the right node count
//   2  scene-graph nodes are data-ve-id selection atoms (diagram-node)
//   3  scene-graph edges are data-ve-id atoms + a 14px hit-area twin
//   4  a dangling-edge scene paints a red error — NOT an empty SVG
//   5  auto-placement: 3 nodes -> one row (coordinate-range assertion)
//   6  process-flow renders a numbered step badge
//   7  phase-graph: clicking a node highlights its transitive chain
//   8  grid-snap rounds node coordinates to the grid step
//   9  node fills resolve to --vc-color-* values (not literal hex)
//   10 light <-> dark theme flip changes the rendered node fill
//   11 the vc:themechange event re-themes every scene without a reload
//   12 deriveSecondary returns a valid color-mix of the accent
//   13 the blueprint preset sets --vc-* on the wrapper, NOT on :root
//   14 a role:"data" node gets a success-tinted fill
//   15 the hand-drawn preset applies an SVG feTurbulence filter, no JS
//   16 an animate:"flow" edge has an <animate stroke-dashoffset> child
//   17 an animate:"particle" edge has an <animateMotion> + <mpath>
//   18 an animate:"pulse" edge has a <filter> with animated feGaussianBlur
//   19 scroll-reveal: edges start hidden, draw on when scrolled into view
//   20 reduced-motion: animated edges render static-visible (no SMIL)
//   21 no nested scrollbars — only the document scrolls
//   22 the ASCII <pre> is overflow:visible and is one selection atom
//   23 module self-init / public API integrity (meta)
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/diagram-fixture.html";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the global is installed AND the
// inline boot script has finished (window.__vcFixtureReady).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(),
    { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpDiagram === 'object'
      && typeof window.amvcpDiagram.init === 'function'
      && (window.__vcFixtureReady === true || !!window.__vcFixtureError));
    if (ready) {
      const err = await page.evaluate(() => window.__vcFixtureError || '');
      return { ok: !err, error: err };
    }
    await page.waitForTimeout(70);
  }
  return { ok: false, error: 'fixture never became ready' };
}

// Resolve a CSS color string to its computed rgb(...) form by parking
// it on a throwaway element — lets the test compare var()-based fills.
async function resolveColor(page, cssColor) {
  return page.evaluate((c) => {
    const probe = document.createElement('span');
    probe.style.color = c;
    document.body.appendChild(probe);
    const out = getComputedStyle(probe).color;
    probe.remove();
    return out;
  }, cssColor);
}

// ── Tests ────────────────────────────────────────────────────────────

async function testScenegraphRenders(page) {
  // 1 — every valid .ve-scene-graph host produces an <svg>; the
  // process-flow scene has its 5 nodes rendered as <g> groups.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_renders', 'FAIL',
      'scene graphs render to svg', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const svg = host.querySelector('svg');
    const nodes = host.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    const edges = host.querySelectorAll(
      'g[data-ve-type="diagram-edge"]');
    return {
      hasSvg: !!svg,
      nodeCount: nodes.length,
      edgeCount: edges.length
    };
  });
  const ok = res.hasSvg && res.nodeCount === 5 && res.edgeCount === 5;
  record('diagram_scenegraph_renders', ok ? 'PASS' : 'FAIL',
    'a process-flow scene renders an svg with 5 nodes and 5 edges',
    JSON.stringify(res));
}

async function testNodesSelectable(page) {
  // 2 — every node <g> carries data-ve-id + data-ve-type="diagram-node";
  // setting data-ve-selected on one is honoured (the selection atom
  // contract). The runtime's click handler would set it; the test sets
  // it directly to prove the atom shape.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_nodes_selectable', 'FAIL',
      'nodes are selection atoms', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const nodes = host.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    let allHaveId = nodes.length > 0;
    let allHaveLabel = nodes.length > 0;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].getAttribute('data-ve-id')) { allHaveId = false; }
      if (!nodes[i].getAttribute('data-ve-label')) {
        allHaveLabel = false;
      }
    }
    // Toggle selection on the first node and confirm it sticks.
    nodes[0].setAttribute('data-ve-selected', '1');
    const selOk = nodes[0].getAttribute('data-ve-selected') === '1';
    // The visible shape is a DIRECT child so the runtime's
    // g[data-ve-id] > rect|polygon CSS matches.
    const firstChild = nodes[0].firstElementChild;
    const directShape = firstChild
      && /^(rect|polygon|circle|path)$/.test(firstChild.tagName);
    return {
      count: nodes.length, allHaveId, allHaveLabel, selOk, directShape
    };
  });
  const ok = res.allHaveId && res.allHaveLabel && res.selOk
    && res.directShape;
  record('diagram_scenegraph_nodes_selectable', ok ? 'PASS' : 'FAIL',
    'every node g has data-ve-id, data-ve-label and a direct shape child',
    JSON.stringify(res));
}

async function testEdgesSelectable(page) {
  // 3 — every edge <g> has data-ve-id + data-ve-type="diagram-edge" and
  // a 14px-wide transparent hit-area twin path so thin edges click.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_edges_selectable', 'FAIL',
      'edges are selection atoms', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const edges = host.querySelectorAll(
      'g[data-ve-type="diagram-edge"]');
    let allHaveId = edges.length > 0;
    let allHaveHitArea = edges.length > 0;
    for (let i = 0; i < edges.length; i++) {
      if (!edges[i].getAttribute('data-ve-id')) { allHaveId = false; }
      // The hit-area is the FIRST path child, stroke transparent,
      // stroke-width 14.
      const paths = edges[i].querySelectorAll('path');
      let found = false;
      for (let j = 0; j < paths.length; j++) {
        if (paths[j].getAttribute('stroke') === 'transparent'
          && paths[j].getAttribute('stroke-width') === '14') {
          found = true;
        }
      }
      if (!found) { allHaveHitArea = false; }
    }
    return { count: edges.length, allHaveId, allHaveHitArea };
  });
  const ok = res.allHaveId && res.allHaveHitArea;
  record('diagram_scenegraph_edges_selectable', ok ? 'PASS' : 'FAIL',
    'every edge g has data-ve-id and a 14px transparent hit-area path',
    JSON.stringify(res));
}

async function testInvalidScenefails(page) {
  // 4 — a scene with a dangling edge paints a red error box
  // (role=alert), NOT an empty <svg>. Fail-fast, surfaced.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_invalid_json_fails', 'FAIL',
      'malformed scene fails loud', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-bad');
    const svg = host.querySelector('svg');
    const alert = host.querySelector('[role="alert"]');
    const txt = alert ? alert.textContent : '';
    return {
      hasSvg: !!svg,
      hasAlert: !!alert,
      mentionsUnknown: txt.indexOf('unknown node') !== -1,
      text: txt.slice(0, 80)
    };
  });
  // The error path replaces host contents — so NO svg, a visible alert.
  const ok = res.hasSvg === false && res.hasAlert === true
    && res.mentionsUnknown === true;
  record('diagram_scenegraph_invalid_json_fails', ok ? 'PASS' : 'FAIL',
    'a dangling-edge scene paints a red error box, not a blank svg',
    JSON.stringify(res));
}

async function testAutoplaceCounts(page) {
  // 5 — the process-flow scene's 5 nodes are auto-placed; with no
  // explicit x/y they form a horizontal lane. Assert the first node
  // sits at the left margin and nodes march rightward in order.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_autoplace_counts', 'FAIL',
      'auto-placement by node count', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const nodes = host.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    const xs = [];
    for (let i = 0; i < nodes.length; i++) {
      const tr = nodes[i].getAttribute('transform') || '';
      const m = tr.match(/translate\(([-\d.]+),/);
      xs.push(m ? parseFloat(m[1]) : NaN);
    }
    // Ascending x means a left-to-right lane.
    let ascending = true;
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] <= xs[i - 1]) { ascending = false; }
    }
    return { xs, ascending, firstX: xs[0] };
  });
  // 5 nodes -> two rows per the count rule; but process-flow forces a
  // horizontal-first lane, so x is strictly ascending.
  const ok = res.ascending && res.firstX >= 0 && res.firstX <= 80;
  record('diagram_scenegraph_autoplace_counts', ok ? 'PASS' : 'FAIL',
    'process-flow nodes auto-place into a left-to-right lane',
    JSON.stringify(res));
}

async function testProcessFlowBadge(page) {
  // 6 — a process-flow scene renders a numbered step <circle> badge
  // above each `process`/`subprocess` step node.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_preset_process_flow', 'FAIL',
      'process-flow numbered badge', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    // A step badge is a <circle> with a negative cy (above the node).
    const circles = host.querySelectorAll('circle');
    let badges = 0;
    for (let i = 0; i < circles.length; i++) {
      const cy = parseFloat(circles[i].getAttribute('cy'));
      if (cy < 0) { badges++; }
    }
    return { circles: circles.length, badges };
  });
  // The scene has one `process` node (ingest) — exactly one badge.
  const ok = res.badges === 1;
  record('diagram_scenegraph_preset_process_flow', ok ? 'PASS' : 'FAIL',
    'process-flow draws a numbered step badge above each process node',
    JSON.stringify(res));
}

async function testPhaseChainHighlight(page) {
  // 7 — clicking a phase-graph node sets data-ve-chain="1" on it and on
  // every node transitively reachable from it; a second click clears.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_phase_chain_highlight', 'FAIL',
      'phase-graph chain highlight', s.error);
    return;
  }
  // Find the p1 node's centre and click it with a real mouse path.
  // Scroll p1 into the viewport first — the phase-graph scene sits well
  // below the fold (after the process-flow + architecture scenes), so a
  // bare getBoundingClientRect() would yield a y-coord OUTSIDE the
  // viewport and page.mouse.move() would land on nothing
  // (document.elementFromPoint returns null at off-viewport coords).
  const box = await page.evaluate(() => {
    const host = document.getElementById('scene-phase');
    const g = host.querySelector('[data-ve-id$="-node-p1"]');
    if (!g) { return null; }
    g.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = g.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  });
  if (!box) {
    record('diagram_scenegraph_phase_chain_highlight', 'FAIL',
      'phase-graph chain highlight', 'p1 node not found');
    return;
  }
  await page.mouse.move(box.cx, box.cy, { steps: 6 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(120);
  const afterClick = await page.evaluate(() => {
    const host = document.getElementById('scene-phase');
    // p1 reaches p2,p3,p4,p5 — every node is in the chain.
    const chained = host.querySelectorAll(
      'g[data-ve-type="diagram-node"][data-ve-chain="1"]');
    return chained.length;
  });
  // Second click on p1 clears the chain.
  await page.mouse.move(box.cx, box.cy, { steps: 6 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(120);
  const afterSecond = await page.evaluate(() => {
    const host = document.getElementById('scene-phase');
    return host.querySelectorAll('[data-ve-chain="1"]').length;
  });
  const ok = afterClick === 5 && afterSecond === 0;
  record('diagram_scenegraph_phase_chain_highlight', ok ? 'PASS' : 'FAIL',
    'clicking a phase node chains all 5 nodes; a second click clears it',
    JSON.stringify({ afterClick, afterSecond }));
}

async function testGridSnap(page) {
  // 8 — node coordinates in the rendered SVG are multiples of the
  // scene's grid step (4). Auto-placed coordinates are snapped too.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_scenegraph_grid_snap', 'FAIL',
      'grid snap', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const nodes = host.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    let allSnapped = nodes.length > 0;
    const sample = [];
    for (let i = 0; i < nodes.length; i++) {
      const tr = nodes[i].getAttribute('transform') || '';
      const m = tr.match(/translate\(([-\d.]+),([-\d.]+)\)/);
      if (!m) { allSnapped = false; continue; }
      const x = parseFloat(m[1]);
      const y = parseFloat(m[2]);
      sample.push(x + ',' + y);
      if (x % 4 !== 0 || y % 4 !== 0) { allSnapped = false; }
    }
    return { allSnapped, sample: sample.slice(0, 3) };
  });
  const ok = res.allSnapped;
  record('diagram_scenegraph_grid_snap', ok ? 'PASS' : 'FAIL',
    'every rendered node coordinate is a multiple of the grid step (4)',
    JSON.stringify(res));
}

async function testThemeUsesVcTokens(page) {
  // 9 — a rendered node fill is a var(--vc-color-*) expression (or its
  // resolved color), NOT a literal hardcoded hex. Read the fill attr.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_scenegraph_uses_vc_tokens', 'FAIL',
      'fills use --vc-* tokens', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const node = host.querySelector(
      'g[data-ve-type="diagram-node"]');
    const shape = node ? node.firstElementChild : null;
    const fill = shape ? shape.getAttribute('fill') : '';
    const stroke = shape ? shape.getAttribute('stroke') : '';
    return {
      fill: fill,
      stroke: stroke,
      fillUsesVar: fill.indexOf('var(--vc-') !== -1
        || fill.indexOf('color-mix') !== -1,
      strokeUsesVar: stroke.indexOf('var(--vc-') !== -1
    };
  });
  const ok = res.fillUsesVar && res.strokeUsesVar;
  record('diagram_theme_scenegraph_uses_vc_tokens', ok ? 'PASS' : 'FAIL',
    'node fill/stroke are var(--vc-*) expressions, not hardcoded hex',
    JSON.stringify(res));
}

async function testLightDarkFlip(page) {
  // 10 — toggling the theme flips the COMPUTED node fill. The fill attr
  // is a var()-based color; resolving it under light vs dark must give
  // two different rgb() values (proves it reads --vc-color-*).
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_light_dark_flip', 'FAIL',
      'light/dark fill flip', s.error);
    return;
  }
  // The `service`-role node fill is color-mix of --vc-color-accent.
  const lightFill = await page.evaluate(() => {
    window.__vcApplyTheme('light');
    const host = document.getElementById('scene-flow');
    const node = host.querySelector('[data-ve-id$="-node-ingest"]');
    const shape = node ? node.firstElementChild : null;
    return shape ? getComputedStyle(shape).fill : '';
  });
  const darkFill = await page.evaluate(() => {
    window.__vcApplyTheme('dark');
    const host = document.getElementById('scene-flow');
    const node = host.querySelector('[data-ve-id$="-node-ingest"]');
    const shape = node ? node.firstElementChild : null;
    return shape ? getComputedStyle(shape).fill : '';
  });
  await page.evaluate(() => window.__vcApplyTheme('light'));
  const ok = lightFill.length > 0 && darkFill.length > 0
    && lightFill !== darkFill;
  record('diagram_theme_light_dark_flip', ok ? 'PASS' : 'FAIL',
    'the rendered node fill differs between light and dark themes',
    JSON.stringify({ lightFill, darkFill }));
}

async function testHotswapRerender(page) {
  // 11 — dispatching the vc:themechange event re-renders every scene
  // (the host's __vcSceneJSON is re-used). After the event the scene
  // still has its full node count — proving a re-render, not a wipe.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_hotswap_rerender', 'FAIL',
      'themechange hot-swap', s.error);
    return;
  }
  const before = await page.evaluate(() =>
    document.getElementById('scene-flow')
      .querySelectorAll('g[data-ve-type="diagram-node"]').length);
  await page.evaluate(() => window.__vcFireThemeChange());
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    return {
      nodes: host.querySelectorAll(
        'g[data-ve-type="diagram-node"]').length,
      hasSvg: !!host.querySelector('svg')
    };
  });
  const ok = before === 5 && after.nodes === 5 && after.hasSvg;
  record('diagram_theme_hotswap_rerender', ok ? 'PASS' : 'FAIL',
    'a vc:themechange event re-renders every scene without losing nodes',
    JSON.stringify({ before, after }));
}

async function testTwoColorDerivation(page) {
  // 12 — deriveSecondary(accent) returns a valid color-mix expression
  // that the browser can resolve to a real color.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_two_color_derivation', 'FAIL',
      'two-color derivation', s.error);
    return;
  }
  const expr = await page.evaluate(() =>
    window.amvcpDiagram.deriveSecondary('#b8861f'));
  const resolved = await resolveColor(page, expr);
  // Modern browsers may resolve `color-mix(in oklch, …)` to either
  // rgb(…) or oklch(…) depending on the version — both are valid; what
  // matters is the browser parsed the expression to a real color.
  const ok = expr.indexOf('color-mix') === 0
    && expr.indexOf('#b8861f') !== -1
    && /^(rgb|oklch|color\()/.test(resolved);
  record('diagram_theme_two_color_derivation', ok ? 'PASS' : 'FAIL',
    'deriveSecondary yields a color-mix the browser resolves to a color',
    JSON.stringify({ expr, resolved }));
}

async function testPresetBlueprint(page) {
  // 13 — the blueprint preset applies --vc-* overrides on the WRAPPER
  // element only, not on :root. Read the wrapper's inline custom prop
  // and confirm :root is untouched.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_preset_blueprint', 'FAIL',
      'blueprint preset scoping', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-blueprint');
    const wrapperCanvas = host.style.getPropertyValue(
      '--vc-color-canvas').trim();
    const rootCanvas = document.documentElement.style
      .getPropertyValue('--vc-color-canvas').trim();
    return {
      wrapperCanvas: wrapperCanvas,
      rootCanvasInline: rootCanvas,
      hasGridBg: !!host.querySelector('svg rect[fill^="url("]')
    };
  });
  // Wrapper carries the navy override; :root has no inline override.
  const ok = res.wrapperCanvas.length > 0
    && res.rootCanvasInline === '' && res.hasGridBg;
  record('diagram_theme_preset_blueprint', ok ? 'PASS' : 'FAIL',
    'the blueprint preset sets --vc-* on the wrapper only, not :root',
    JSON.stringify(res));
}

async function testRoleFillMap(page) {
  // 14 — a node with role:"data" gets a success-tinted fill. The fill
  // attr must reference --vc-color-success via color-mix.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_role_fill_map', 'FAIL',
      'semantic role fill map', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    // `store` is role:"data".
    const node = host.querySelector('[data-ve-id$="-node-store"]');
    const shape = node ? node.firstElementChild : null;
    const fill = shape ? shape.getAttribute('fill') : '';
    // `ingest` is role:"service".
    const svc = host.querySelector('[data-ve-id$="-node-ingest"]');
    const svcShape = svc ? svc.firstElementChild : null;
    const svcFill = svcShape ? svcShape.getAttribute('fill') : '';
    return {
      dataFill: fill,
      serviceFill: svcFill,
      dataUsesSuccess: fill.indexOf('--vc-color-success') !== -1,
      serviceUsesAccent: svcFill.indexOf('--vc-color-accent') !== -1
    };
  });
  const ok = res.dataUsesSuccess && res.serviceUsesAccent;
  record('diagram_theme_role_fill_map', ok ? 'PASS' : 'FAIL',
    'a role:data node fills with --vc-color-success, role:service accent',
    JSON.stringify(res));
}

async function testHanddrawnNoRoughjs(page) {
  // 15 — the hand-drawn preset applies an SVG <filter> with a
  // <feTurbulence> primitive and loads NO extra <script>.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_theme_handdrawn_no_roughjs', 'FAIL',
      'hand-drawn is a filter, not a library', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-handdrawn');
    const svg = host.querySelector('svg');
    const turb = host.querySelector('feTurbulence');
    const disp = host.querySelector('feDisplacementMap');
    const svgFilterAttr = svg ? svg.getAttribute('filter') : '';
    // Count scripts referencing rough.js anywhere on the page.
    const scripts = document.querySelectorAll('script[src]');
    let roughLoaded = false;
    for (let i = 0; i < scripts.length; i++) {
      if ((scripts[i].src || '').toLowerCase().indexOf('rough') !== -1) {
        roughLoaded = true;
      }
    }
    return {
      hasTurbulence: !!turb,
      hasDisplacement: !!disp,
      svgUsesFilter: svgFilterAttr.indexOf('rough') !== -1,
      roughLoaded
    };
  });
  const ok = res.hasTurbulence && res.hasDisplacement
    && res.svgUsesFilter && res.roughLoaded === false;
  record('diagram_theme_handdrawn_no_roughjs', ok ? 'PASS' : 'FAIL',
    'hand-drawn applies an feTurbulence filter and loads no rough.js',
    JSON.stringify(res));
}

async function testFlowAnimation(page) {
  // 16 — an animate:"flow" edge has an <animate> child driving
  // stroke-dashoffset.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_flow_dash_animation', 'FAIL',
      'flow dash animation', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-anim');
    // a->b is animate:"flow".
    const edge = host.querySelector('[data-ve-id$="-edge-a-to-b"]');
    if (!edge) { return { found: false }; }
    const animates = edge.querySelectorAll('animate');
    let dashAnim = false;
    for (let i = 0; i < animates.length; i++) {
      if (animates[i].getAttribute('attributeName')
        === 'stroke-dashoffset') {
        dashAnim = true;
      }
    }
    return { found: true, dashAnim };
  });
  const ok = res.found && res.dashAnim;
  record('diagram_flow_dash_animation', ok ? 'PASS' : 'FAIL',
    'an animate:flow edge has an <animate stroke-dashoffset> child',
    JSON.stringify(res));
}

async function testParticleAnimation(page) {
  // 17 — an animate:"particle" edge has an <animateMotion> with an
  // <mpath> pointing at the edge path.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_flow_particle_animation', 'FAIL',
      'particle animation', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-anim');
    // a->c is animate:"particle".
    const edge = host.querySelector('[data-ve-id$="-edge-a-to-c"]');
    if (!edge) { return { found: false }; }
    const motion = edge.querySelector('animateMotion');
    const mpath = edge.querySelector('mpath');
    return {
      found: true,
      hasMotion: !!motion,
      hasMpath: !!mpath
    };
  });
  const ok = res.found && res.hasMotion && res.hasMpath;
  record('diagram_flow_particle_animation', ok ? 'PASS' : 'FAIL',
    'an animate:particle edge has an <animateMotion> + <mpath>',
    JSON.stringify(res));
}

async function testPulseAnimation(page) {
  // 18 — an animate:"pulse" edge has a <filter> containing an animated
  // <feGaussianBlur>.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_flow_pulse_animation', 'FAIL',
      'pulse animation', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-anim');
    // c->d is animate:"pulse".
    const edge = host.querySelector('[data-ve-id$="-edge-c-to-d"]');
    if (!edge) { return { found: false }; }
    const blur = edge.querySelector('feGaussianBlur');
    const blurAnim = blur ? blur.querySelector('animate') : null;
    return {
      found: true,
      hasBlur: !!blur,
      blurAnimated: !!blurAnim
    };
  });
  const ok = res.found && res.hasBlur && res.blurAnimated;
  record('diagram_flow_pulse_animation', ok ? 'PASS' : 'FAIL',
    'an animate:pulse edge has a filter with an animated feGaussianBlur',
    JSON.stringify(res));
}

async function testScrollReveal(page) {
  // 19 — with data-ve-scene-reveal="scroll", the reveal scene's edges
  // start with a stroke-dasharray = full length (hidden draw state);
  // scrolling the scene into view draws them (dashoffset -> 0).
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_flow_scroll_reveal', 'FAIL',
      'scroll reveal draw-on', s.error);
    return;
  }
  // Read the initial offset BEFORE scrolling — the scene is far below
  // the fold, so its edges should be in the hidden draw state.
  const before = await page.evaluate(() => {
    const host = document.getElementById('scene-reveal');
    const path = host.querySelector(
      'g[data-ve-type="diagram-edge"] > path:nth-child(2)');
    if (!path) { return { found: false }; }
    return {
      found: true,
      offset: path.style.strokeDashoffset,
      dashArray: path.style.strokeDasharray
    };
  });
  // Scroll the reveal scene into view.
  await page.evaluate(() => {
    document.getElementById('scene-reveal')
      .scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    const host = document.getElementById('scene-reveal');
    const path = host.querySelector(
      'g[data-ve-type="diagram-edge"] > path:nth-child(2)');
    return { offset: path ? path.style.strokeDashoffset : '' };
  });
  // Before: a non-zero offset (hidden). After: offset 0 (drawn).
  const beforeHidden = before.found
    && before.offset !== '' && before.offset !== '0'
    && before.dashArray !== '' && before.dashArray !== 'none';
  const afterDrawn = after.offset === '0';
  const ok = beforeHidden && afterDrawn;
  record('diagram_flow_scroll_reveal', ok ? 'PASS' : 'FAIL',
    'reveal edges start hidden, then draw to offset 0 on scroll-in',
    JSON.stringify({ before, after }));
}

async function testReducedMotion(page) {
  // 20 — with prefers-reduced-motion: reduce emulated, animated edges
  // render STATIC-VISIBLE: no <animate>/<animateMotion> SMIL children
  // at all (the applyEdgeAnimation early-return). The edge path itself
  // is still drawn.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const s = await setup(page);
  if (!s.ok) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    record('diagram_flow_reduced_motion', 'FAIL',
      'reduced-motion static substitute', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('scene-anim');
    const smil = host.querySelectorAll(
      'animate, animateMotion, animateTransform');
    // The edges themselves must still be drawn (visible path present).
    const edges = host.querySelectorAll(
      'g[data-ve-type="diagram-edge"]');
    let edgesDrawn = edges.length > 0;
    for (let i = 0; i < edges.length; i++) {
      if (!edges[i].querySelector('path')) { edgesDrawn = false; }
    }
    return {
      reduced: window.amvcpDiagram
        && window.__vcDiagram ? window.__vcDiagram.REDUCED : null,
      smilCount: smil.length,
      edgesDrawn
    };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const ok = res.reduced === true && res.smilCount === 0
    && res.edgesDrawn;
  record('diagram_flow_reduced_motion', ok ? 'PASS' : 'FAIL',
    'under reduced motion, animated edges render static (no SMIL)',
    JSON.stringify(res));
}

async function testNoNestedScroll(page) {
  // 21 — only the document scrolls; no diagram element introduced an
  // inner scroll axis. Wide diagrams extend the page.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_no_nested_scroll', 'FAIL',
      'no nested scrollbars', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const all = document.querySelectorAll('body *');
    const inner = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const cs = getComputedStyle(el);
      const scrolls = (cs.overflowY === 'auto' || cs.overflowY === 'scroll'
        || cs.overflowX === 'auto' || cs.overflowX === 'scroll');
      if (scrolls && (el.scrollHeight > el.clientHeight + 1
        || el.scrollWidth > el.clientWidth + 1)) {
        inner.push(el.className || el.tagName);
      }
    }
    return { innerScrollers: inner };
  });
  const ok = res.innerScrollers.length === 0;
  record('diagram_no_nested_scroll', ok ? 'PASS' : 'FAIL',
    'no diagram element creates an inner scroll axis — only the document',
    JSON.stringify(res));
}

async function testAsciiOverflowVisible(page) {
  // 22 — the ASCII <pre> is overflow:visible (the hard no-nested-
  // scrollbars invariant for wide ASCII art) and carries one
  // data-ve-id selection atom for the whole block.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_ascii_overflow_visible', 'FAIL',
      'ascii pre is overflow visible + one atom', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const pre = document.getElementById('ascii-1');
    const cs = getComputedStyle(pre);
    return {
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      whiteSpace: cs.whiteSpace,
      hasVeId: !!pre.getAttribute('data-ve-id'),
      veType: pre.getAttribute('data-ve-type') || ''
    };
  });
  const ok = res.overflowX === 'visible' && res.overflowY === 'visible'
    && res.whiteSpace === 'pre' && res.hasVeId
    && res.veType === 'ascii-diagram';
  record('diagram_ascii_overflow_visible', ok ? 'PASS' : 'FAIL',
    'the ASCII pre is overflow:visible and is one ascii-diagram atom',
    JSON.stringify(res));
}

async function testSelfInitClean(page) {
  // 23 — module self-init / dual-export integrity. The public API
  // surface is intact, the CSS is injected, and validateScene throws on
  // a malformed scene (the fail-fast contract).
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_runtime_self_init_clean', 'FAIL',
      'module self-init clean', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const api = window.amvcpDiagram;
    const need = ['injectDiagramCSS', 'init', 'renderSceneGraph',
      'validateScene', 'autoPlace', 'buildMermaidThemeVariables',
      'deriveSecondary', 'getThemePreset', 'reThemeAll', 'refresh'];
    let allFns = true;
    for (let i = 0; i < need.length; i++) {
      if (typeof api[need[i]] !== 'function') { allFns = false; }
    }
    // validateScene must THROW on a bad version (fail-fast).
    let threw = false;
    try {
      api.validateScene({ version: 9, width: 1, height: 1,
        nodes: [{ id: 'x', type: 'start', label: 'X', x: 0, y: 0 }] });
    } catch (e) { threw = true; }
    // buildMermaidThemeVariables returns a populated object.
    const tv = api.buildMermaidThemeVariables();
    const tvOk = tv && typeof tv === 'object'
      && typeof tv.primaryColor === 'string'
      && tv.primaryColor.length > 0;
    return {
      allFns,
      cssInjected: !!document.getElementById('vc-diagram-styles'),
      validateThrows: threw,
      themeVarsOk: tvOk,
      fixtureError: window.__vcFixtureError || ''
    };
  });
  const ok = res.allFns && res.cssInjected && res.validateThrows
    && res.themeVarsOk && res.fixtureError === '';
  record('diagram_runtime_self_init_clean', ok ? 'PASS' : 'FAIL',
    'public API intact, CSS injected, validateScene fail-fast holds',
    JSON.stringify(res));
}

// ── Runner ───────────────────────────────────────────────────────────

const tests = [
  testScenegraphRenders,
  testNodesSelectable,
  testEdgesSelectable,
  testInvalidScenefails,
  testAutoplaceCounts,
  testProcessFlowBadge,
  testPhaseChainHighlight,
  testGridSnap,
  testThemeUsesVcTokens,
  testLightDarkFlip,
  testHotswapRerender,
  testTwoColorDerivation,
  testPresetBlueprint,
  testRoleFillMap,
  testHanddrawnNoRoughjs,
  testFlowAnimation,
  testParticleAnimation,
  testPulseAnimation,
  testScrollReveal,
  testReducedMotion,
  testNoNestedScroll,
  testAsciiOverflowVisible,
  testSelfInitClean
];

const page = await browser.getPage("diagram-tests");

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
