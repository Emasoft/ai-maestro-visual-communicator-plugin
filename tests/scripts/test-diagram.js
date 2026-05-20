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

// Phase 2.5 selection contract — atom states + group comment-handle.
async function testP25SelectionContract(page) {
  // Setting data-ve-selected="1" on a diagram atom must:
  //   1. trigger the .ve-scene-graph:has([data-ve-selected="1"]) ring
  //   2. mount exactly ONE .ve-comment-handle on the host
  //   3. compose data-ve-comment-id as diagram:<hostId>:<sortedAtomIds>
  //   4. clearing -> handle vanishes
  // Atom contract checks: every node + edge ships tabindex="0" and
  // role="button" so keyboard users can focus + activate them.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_p25_selection_contract', 'FAIL',
      'Phase 2.5 group-handle observer wires up', s.error);
    return;
  }
  const initial = await page.evaluate(() => {
    const host = document.getElementById('scene-p25');
    if (!host) { return { setup: false }; }
    const node = host.querySelector('g[data-ve-type="diagram-node"]');
    const edge = host.querySelector('g[data-ve-type="diagram-edge"]');
    return {
      setup: true,
      hasHandle: !!host.querySelector(':scope > .ve-comment-handle'),
      nodeFocusable: node && node.getAttribute('tabindex') === '0'
                          && node.getAttribute('role') === 'button',
      edgeFocusable: edge && edge.getAttribute('tabindex') === '0'
                          && edge.getAttribute('role') === 'button'
    };
  });
  if (!initial.setup) {
    record('diagram_p25_selection_contract', 'FAIL',
      'Phase 2.5 demo scene not found', JSON.stringify(initial));
    return;
  }
  await page.evaluate(() => {
    document.getElementById('p25d-select-node').click();
    document.getElementById('p25d-select-edge').click();
  });
  await page.waitForTimeout(120);
  const afterSelect = await page.evaluate(() => {
    const host = document.getElementById('scene-p25');
    const handle = host.querySelector(':scope > .ve-comment-handle');
    const cid = handle ? handle.getAttribute('data-ve-comment-id') : '';
    return {
      handleCount: host.querySelectorAll(':scope > .ve-comment-handle').length,
      cidPrefix: cid.slice(0, 8),
      cidIncludesNode: cid.indexOf('-node-') !== -1,
      cidIncludesEdge: cid.indexOf('-edge-') !== -1,
      handleTitle: handle ? handle.title : null,
      handleHasOverlay: handle ? handle.hasAttribute('data-ve-overlay') : false
    };
  });
  await page.evaluate(() => {
    document.getElementById('p25d-clear').click();
  });
  await page.waitForTimeout(120);
  const afterClear = await page.evaluate(() => {
    const host = document.getElementById('scene-p25');
    return {
      handleCount: host.querySelectorAll(':scope > .ve-comment-handle').length
    };
  });
  const ok = initial.hasHandle === false
    && initial.nodeFocusable === true
    && initial.edgeFocusable === true
    && afterSelect.handleCount === 1
    && afterSelect.cidPrefix === 'diagram:'
    && afterSelect.cidIncludesNode === true
    && afterSelect.cidIncludesEdge === true
    && !!afterSelect.handleTitle
    && afterSelect.handleHasOverlay === true
    && afterClear.handleCount === 0;
  record('diagram_p25_selection_contract', ok ? 'PASS' : 'FAIL',
    'select node+edge -> 1 handle with diagram:<id>; clear -> handle gone',
    JSON.stringify({ initial, afterSelect, afterClear }));
}

async function testViewportScaffoldMounted(page) {
  // Viewport mode opt-in via data-ve-scene-viewport — host gets fixed
  // height, overflow:hidden, and a 4-piece scaffold (stage, canvas,
  // toolbar, mini-map). Default-mode scenes are unaffected.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_scaffold_mounted', 'FAIL',
      'viewport scaffold mounted', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-viewport');
    if (!host) return { error: 'no scene-viewport' };
    const stage   = host.querySelector(':scope > .ve-scene-stage');
    const canvas  = stage ? stage.querySelector(':scope > .ve-scene-canvas') : null;
    const svg     = canvas ? canvas.querySelector(':scope > svg') : null;
    const tb      = host.querySelector(':scope > .ve-scene-toolbar');
    const slider  = tb ? tb.querySelector('.ve-scene-zoom-slider') : null;
    const minimap = host.querySelector(':scope > .ve-scene-minimap');
    const frame   = minimap ? minimap.querySelector('.ve-scene-minimap-frame') : null;
    const cs = window.getComputedStyle(host);
    // Default-mode scene must NOT get the scaffold
    const def = document.getElementById('scene-flow');
    const defStage = def ? def.querySelector('.ve-scene-stage') : 'no-def';
    return {
      hostHeight: cs.height,
      hostOverflow: cs.overflow,
      hasStage: !!stage,
      hasCanvas: !!canvas,
      svgInsideCanvas: !!svg && svg.parentNode === canvas,
      hasToolbar: !!tb,
      hasSlider: !!slider,
      toolbarBtnTitles: tb ? Array.from(tb.querySelectorAll('button'))
        .map(b => b.title) : [],
      hasMinimap: !!minimap,
      hasMinimapFrame: !!frame,
      defaultModeUntouched: !defStage
    };
  });
  const titles = r.toolbarBtnTitles || [];
  const ok = r.hostHeight === '420px'
    && r.hostOverflow === 'hidden'
    && r.hasStage && r.hasCanvas && r.svgInsideCanvas
    && r.hasToolbar && r.hasSlider
    && titles.indexOf('Zoom out') >= 0
    && titles.indexOf('Zoom in')  >= 0
    && titles.indexOf('Fit all')  >= 0
    && titles.indexOf('Actual size') >= 0
    && titles.indexOf('Fit width') >= 0
    && r.hasMinimap && r.hasMinimapFrame
    && r.defaultModeUntouched === true;
  record('diagram_viewport_scaffold_mounted', ok ? 'PASS' : 'FAIL',
    'data-ve-scene-viewport mounts stage+canvas+toolbar+minimap; defaults untouched',
    JSON.stringify(r));
}

async function testViewportFitAllOnLoad(page) {
  // The initial transform should be a fit-all centring of the scene
  // inside the stage — scale ≈ min(stageW/sceneW, stageH/sceneH).
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_fit_all_on_load', 'FAIL',
      'viewport fit-all on load', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-viewport');
    const canvas = host.querySelector('.ve-scene-canvas');
    const stage = host.querySelector('.ve-scene-stage');
    const stageR = stage.getBoundingClientRect();
    const m = canvas.style.transform.match(/scale\(([0-9.]+)\)/);
    const scale = m ? parseFloat(m[1]) : null;
    const expectScale = Math.min(stageR.width / 1800, stageR.height / 1100);
    return {
      scale: scale,
      expect: expectScale,
      stageW: stageR.width,
      stageH: stageR.height,
      delta: scale && expectScale
        ? Math.abs(scale - expectScale) : 999
    };
  });
  const ok = r.delta < 0.01;   // fit-all within 1%
  record('diagram_viewport_fit_all_on_load', ok ? 'PASS' : 'FAIL',
    'initial canvas transform is a fit-all scale (within 1% of computed)',
    JSON.stringify(r));
}

async function testViewportZoomButtonsAndSlider(page) {
  // Zoom in / out buttons + slider mutate scale + slider value;
  // wheel zoom centres on cursor.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_zoom_controls', 'FAIL',
      'viewport zoom controls', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-viewport');
    const tb = host.querySelector('.ve-scene-toolbar');
    const btnIn  = Array.from(tb.querySelectorAll('button'))
      .find(b => b.title === 'Zoom in');
    const btnOut = Array.from(tb.querySelectorAll('button'))
      .find(b => b.title === 'Zoom out');
    const slider = tb.querySelector('.ve-scene-zoom-slider');
    function scale() {
      const m = host.querySelector('.ve-scene-canvas').style.transform
        .match(/scale\(([0-9.]+)\)/);
      return m ? parseFloat(m[1]) : null;
    }
    const s0 = scale();
    btnIn.click();
    btnIn.click();
    const s1 = scale();
    btnOut.click();
    const s2 = scale();
    // Now drive the slider to ~80%
    slider.value = '80';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    const s3 = scale();
    // Wheel zoom on stage
    const stage = host.querySelector('.ve-scene-stage');
    const r2 = stage.getBoundingClientRect();
    stage.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true, cancelable: true,
      clientX: r2.left + 50, clientY: r2.top + 50, deltaY: -120
    }));
    const s4 = scale();
    return { s0, s1, s2, s3, s4 };
  });
  const ok = r.s1 > r.s0
    && r.s2 < r.s1
    && r.s3 !== null && r.s3 > 0.5
    && r.s4 > r.s3;
  record('diagram_viewport_zoom_controls', ok ? 'PASS' : 'FAIL',
    'zoom-in/out, slider, and wheel all monotonically mutate scale',
    JSON.stringify(r));
}

async function testViewportPanDrag(page) {
  // After zoom-to-actual-size, dragging the stage shifts the canvas
  // translate by the drag delta (clamped against scene bounds).
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_pan_drag', 'FAIL',
      'viewport pan drag', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-viewport');
    const tb = host.querySelector('.ve-scene-toolbar');
    const btn1to1 = Array.from(tb.querySelectorAll('button'))
      .find(b => b.title === 'Actual size');
    btn1to1.click();
    const stage = host.querySelector('.ve-scene-stage');
    const canvas = host.querySelector('.ve-scene-canvas');
    const before = canvas.style.transform;
    const r2 = stage.getBoundingClientRect();
    const cx = r2.left + r2.width / 2;
    const cy = r2.top + r2.height / 2;
    stage.dispatchEvent(new MouseEvent('mousedown',
      { bubbles: true, clientX: cx, clientY: cy, button: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove',
      { bubbles: true, clientX: cx + 100, clientY: cy + 60 }));
    const after = canvas.style.transform;
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    function tx(t) {
      const m = t.match(/translate\((-?[0-9.]+)px,\s*(-?[0-9.]+)px\)/);
      return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
    }
    const a = tx(before), b = tx(after);
    return { before, after, dx: b.x - a.x, dy: b.y - a.y };
  });
  // Clamping may shave a few pixels — accept anything in the ball-park
  const ok = r.dx > 50 && r.dx <= 100 && r.dy > 30 && r.dy <= 60;
  record('diagram_viewport_pan_drag', ok ? 'PASS' : 'FAIL',
    'mousedown+drag on stage pans canvas by the drag delta (clamped)',
    JSON.stringify(r));
}

async function testViewportMinimapFrame(page) {
  // Mini-map renders a clone of the SVG (with no data-ve-id stamps) and
  // a frame div whose left/top/width/height are non-zero. A click in
  // the mini-map updates the canvas transform to centre that point.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_minimap_frame', 'FAIL',
      'viewport mini-map frame', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-viewport');
    const minimap = host.querySelector('.ve-scene-minimap');
    const cloneSvg = minimap.querySelector('svg');
    const cloneIds = cloneSvg.querySelectorAll('[data-ve-id]').length;
    const frame = minimap.querySelector('.ve-scene-minimap-frame');
    const fl = parseFloat(frame.style.left);
    const fw = parseFloat(frame.style.width);
    const fh = parseFloat(frame.style.height);
    // Zoom in via 1:1 first so the minimap drag actually has somewhere
    // to pan to (at fit-all the canvas-clamp keeps it centred no
    // matter where the user clicks in the minimap — that is correct
    // behaviour, not a bug).
    const tb = host.querySelector('.ve-scene-toolbar');
    const btn1to1 = Array.from(tb.querySelectorAll('button'))
      .find(b => b.title === 'Actual size');
    btn1to1.click();
    const r2 = minimap.getBoundingClientRect();
    const tBefore = host.querySelector('.ve-scene-canvas').style.transform;
    minimap.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, clientX: r2.left + 20, clientY: r2.top + 20, button: 0
    }));
    const tAfter = host.querySelector('.ve-scene-canvas').style.transform;
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return {
      cloneSvgPresent: !!cloneSvg,
      cloneStrippedIds: cloneIds === 0,
      frameLeftNonZero: fl > 0,
      frameWidthNonZero: fw > 0,
      frameHeightNonZero: fh > 0,
      transformChanged: tBefore !== tAfter,
      tBefore: tBefore,
      tAfter: tAfter
    };
  });
  const ok = r.cloneSvgPresent
    && r.cloneStrippedIds
    && r.frameLeftNonZero && r.frameWidthNonZero && r.frameHeightNonZero
    && r.transformChanged;
  record('diagram_viewport_minimap_frame', ok ? 'PASS' : 'FAIL',
    'mini-map clones SVG (no atom ids), shows a frame, and pans on drag',
    JSON.stringify(r));
}

async function testViewportNonViewportSceneUnaffected(page) {
  // Scenes WITHOUT data-ve-scene-viewport keep the original behaviour:
  // SVG is width:100%, no .ve-scene-stage, host overflow:visible.
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_viewport_non_viewport_unaffected', 'FAIL',
      'non-viewport scene unaffected', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const svg = host.querySelector('svg');
    const cs = window.getComputedStyle(host);
    const sw = window.getComputedStyle(svg).width;
    return {
      hostHasViewportAttr: host.hasAttribute('data-ve-scene-viewport'),
      hostOverflow: cs.overflow,
      hasStage: !!host.querySelector('.ve-scene-stage'),
      hasToolbar: !!host.querySelector('.ve-scene-toolbar'),
      hasMinimap: !!host.querySelector('.ve-scene-minimap'),
      svgWidth: sw
    };
  });
  const ok = !r.hostHasViewportAttr
    && r.hostOverflow === 'visible'
    && !r.hasStage && !r.hasToolbar && !r.hasMinimap
    && /px$/.test(r.svgWidth);
  record('diagram_viewport_non_viewport_unaffected', ok ? 'PASS' : 'FAIL',
    'scenes without data-ve-scene-viewport keep default extend-page mode',
    JSON.stringify(r));
}

// ── Export menu — archify-inspired (MIT) PNG/JPEG/WebP/SVG download +
//    Copy-PNG-to-clipboard. Three tests cover (a) the wrap mounts on
//    every host, (b) the button toggles open/closed with correct ARIA
//    state, (c) the wrap survives a re-render (theme hot-swap path).

async function testExportMenuMounts(page) {
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_export_menu_mounts', 'FAIL',
      'every scene-graph host gets a .ve-scene-export wrap', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    // Only renderable scenes get an export menu. Hosts whose JSON failed
    // validation render a red error box and exit before _attachExportMenu
    // — there is no SVG to export, so excluding them is correct behavior.
    const all = document.querySelectorAll('.ve-scene-graph');
    const renderable = [];
    for (let i = 0; i < all.length; i++) {
      if (all[i].querySelector(':scope > svg, :scope > .ve-scene-stage')) {
        renderable.push(all[i]);
      }
    }
    const out = { hostCount: all.length, renderableCount: renderable.length,
                  wrapped: 0, hasButton: 0, hasMenu: 0, menuHidden: 0 };
    for (let i = 0; i < renderable.length; i++) {
      const wrap = renderable[i].querySelector(
        ':scope > .ve-scene-export');
      if (wrap) { out.wrapped++; }
      if (wrap && wrap.querySelector('.ve-scene-export-button')) {
        out.hasButton++;
      }
      const m = wrap && wrap.querySelector('.ve-scene-export-menu');
      if (m) { out.hasMenu++; if (m.hidden) { out.menuHidden++; } }
    }
    return out;
  });
  const ok = r.renderableCount > 0
    && r.wrapped === r.renderableCount
    && r.hasButton === r.renderableCount
    && r.hasMenu === r.renderableCount
    && r.menuHidden === r.renderableCount;
  record('diagram_export_menu_mounts', ok ? 'PASS' : 'FAIL',
    'every .ve-scene-graph host carries a closed export menu',
    JSON.stringify(r));
}

async function testExportMenuToggle(page) {
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_export_menu_toggle', 'FAIL',
      'clicking the button toggles the menu', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const btn = host.querySelector('.ve-scene-export-button');
    const menu = host.querySelector('.ve-scene-export-menu');
    const before = { hidden: menu.hidden,
                     aria: btn.getAttribute('aria-expanded') };
    btn.click();
    const opened = { hidden: menu.hidden,
                     aria: btn.getAttribute('aria-expanded'),
                     itemCount: menu.querySelectorAll(
                       '.ve-scene-export-item').length };
    btn.click();
    const closed = { hidden: menu.hidden,
                     aria: btn.getAttribute('aria-expanded') };
    return { before, opened, closed };
  });
  const ok = r.before.hidden === true
    && r.before.aria === 'false'
    && r.opened.hidden === false
    && r.opened.aria === 'true'
    && r.opened.itemCount >= 4
    && r.closed.hidden === true
    && r.closed.aria === 'false';
  record('diagram_export_menu_toggle', ok ? 'PASS' : 'FAIL',
    'clicking the export button opens/closes the menu with ARIA state',
    JSON.stringify(r));
}

async function testExportMenuSurvivesRerender(page) {
  const s = await setup(page);
  if (!s.ok) {
    record('diagram_export_menu_survives_rerender', 'FAIL',
      'export menu re-attaches after re-render', s.error);
    return;
  }
  const r = await page.evaluate(() => {
    const host = document.getElementById('scene-flow');
    const before = !!host.querySelector(':scope > .ve-scene-export');
    // A theme hot-swap wipes hostEl.textContent and re-renders.
    window.amvcpDiagram.reThemeAll(document);
    const after = !!host.querySelector(':scope > .ve-scene-export');
    // No duplicate wraps after re-render.
    const wrapCount = host.querySelectorAll(
      ':scope > .ve-scene-export').length;
    return { before, after, wrapCount };
  });
  const ok = r.before === true && r.after === true && r.wrapCount === 1;
  record('diagram_export_menu_survives_rerender', ok ? 'PASS' : 'FAIL',
    'export menu re-attaches once after reThemeAll',
    JSON.stringify(r));
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
  testSelfInitClean,
  testP25SelectionContract,
  testViewportScaffoldMounted,
  testViewportFitAllOnLoad,
  testViewportZoomButtonsAndSlider,
  testViewportPanDrag,
  testViewportMinimapFrame,
  testViewportNonViewportSceneUnaffected,
  testExportMenuMounts,
  testExportMenuToggle,
  testExportMenuSurvivesRerender
];

const page = await browser.getPage("diagram-tests");

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
