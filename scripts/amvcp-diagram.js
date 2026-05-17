/*!
 * ai-maestro-visual-communicator-plugin — diagram runtime module.
 *
 * Phase 2 (visualizing backlog §3, TRDD-352ef46a): the consolidated
 * `diagram` visualize-skill runtime. Turns a declarative JSON scene
 * graph into a themed, selectable SVG diagram, themes Mermaid through
 * CSS-var forwarding, animates SVG edges, and styles ASCII fallbacks.
 *
 * Design contract (docs_dev/phase2-specs/diagram-spec.md):
 *   - Dependency-free. Pure SVG + CSS + vanilla ES5-style JS. No D2, no
 *     PlantUML, no Cytoscape, no dagre, no rough.js, no build step. The
 *     `hand-drawn` preset is an SVG <filter>, not a library.
 *   - Theme-driven. Every color/font/radius reads a `--vc-*` token (the
 *     DESIGN.md engine namespace) via var(--vc-*, fallback); every
 *     reference carries a hardcoded canonical fallback so the module
 *     renders correctly even with NO DESIGN.md present (fully defensive
 *     / standalone — cross-file wiring is a later integration pass).
 *   - Light + dark. Scene-graph fills are emitted as `var(--vc-color-*)`
 *     directly into fill/stroke attributes, so a theme swap re-themes
 *     the SVG with zero JS. Both themes correct by construction.
 *   - Fail-fast. Malformed scene-graph JSON throws with a precise
 *     message; the catch path paints red error text into the host
 *     element (mirrors the runtime's Graphviz error path). No silent
 *     fallback to an empty SVG.
 *   - No nested scrollbars. The scene-graph SVG is width:100%;
 *     height:auto and the ASCII <pre> is overflow:visible — wide
 *     diagrams extend the document; the page owns the only scrollbar.
 *   - Accessibility. Every animated edge ships a
 *     `prefers-reduced-motion: reduce` substitute (static-visible — the
 *     edge is still drawn, just not marching/pulsing).
 *
 * Dual export:
 *   - browser: `window.amvcpDiagram = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-animation.js / amvcp-designmd.js —
 * `var`, function declarations, ES5-safe, no arrow functions, no
 * template literals, no classes.
 *
 * Public API:
 *   injectDiagramCSS(doc)             — append the skill <style> to doc.head
 *   init(root)                        — render every scene graph + style ASCII
 *   renderSceneGraph(hostEl)          — render one .ve-scene-graph host
 *   validateScene(scene)              — fail-fast schema check (throws)
 *   autoPlace(scene)                  — assign x/y by node count
 *   buildMermaidThemeVariables(doc)   — --vc-* -> Mermaid themeVariables
 *   deriveSecondary(accent)           — two-color color-mix derivation
 *   getThemePreset(name)              — named theme preset (light+dark)
 *   refresh(root)                     — re-scan after dynamic DOM insert
 *   reThemeAll(root)                  — re-render all scenes on theme swap
 */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';

  // The injected <style> id — a second injectDiagramCSS() is a no-op,
  // matching the animation module's STYLE_ID idempotence guard.
  var STYLE_ID = 'vc-diagram-styles';

  // ── Pure-geometry constants (structural, NOT themed) ────────────────
  //
  // diagram-spec.md §6.2/§9: node/edge sizes are STRUCTURAL — they are
  // named constants here, never magic numbers scattered in code. Only
  // chromatic and type-scaled values read --vc-* tokens.

  // Stroke-width scale — geometry, not theme (spec §6.2).
  var STROKE_HAIRLINE = 1;     // grid lines, group borders
  var STROKE_NODE = 1.5;       // node outline
  var STROKE_EDGE = 1.5;       // edge path
  var STROKE_SELECTED = 2;     // (high-contrast preset bumps node to 2)

  // process-flow lane geometry (spec §4.4 — generalised from the DG-12
  // template's `0 0 (n*200+40) 240` viewBox formula so stride/margin are
  // engine config, not hardcoded literals).
  var FLOW_MARGIN = 40;        // viewBox left/right margin
  var FLOW_GAP = 60;           // gap between consecutive step nodes
  var FLOW_ROW_GAP = 60;       // vertical gap when auto-place wraps to 2 rows

  // Default node dimensions per type (spec §4.3 table).
  var NODE_DEFAULTS = {
    start: { w: 110, h: 40 },
    process: { w: 160, h: 80 },
    decision: { w: 90, h: 90 },
    subprocess: { w: 160, h: 80 },
    end: { w: 110, h: 40 },
    external: { w: 160, h: 80 },
    card: { w: 200, h: 120 }
  };

  // The fixed node-type vocabulary — an unknown `type` is a fail-fast
  // error (spec §4.2). `card` is the phase-graph node type.
  var NODE_TYPES = ['start', 'process', 'decision', 'subprocess',
    'end', 'external', 'card'];

  // The scene-graph preset vocabulary (spec §4.4).
  var PRESETS = ['process-flow', 'architecture-canvas', 'phase-graph',
    'free'];

  // Edge enum vocabularies (spec §4.2).
  var EDGE_STYLES = ['solid', 'dashed', 'dotted'];
  var EDGE_ROUTES = ['straight', 'ortho', 'bezier', 'loop'];
  var EDGE_ANIMATE = ['none', 'flow', 'particle', 'pulse'];
  var EDGE_ARROWS = ['end', 'start', 'both', 'none'];

  // Node `role` semantic enum (spec §4.2 / §6.2).
  var NODE_ROLES = ['client', 'service', 'data', 'infra', 'external',
    'accent'];

  // Default snap-to-grid step in user units (spec §4.2).
  var DEFAULT_GRID = 4;

  // ── prefers-reduced-motion gate ─────────────────────────────────────
  //
  // Read once at module load; a live OS toggle re-evaluates and re-runs
  // refresh() so already-rendered diagrams pick up the new preference.
  var REDUCED = false;
  var _mql = null;
  if (typeof window !== 'undefined' && window.matchMedia) {
    _mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    REDUCED = !!_mql.matches;
  }

  function _watchReducedMotion() {
    if (!_mql) { return; }
    function onChange(ev) {
      REDUCED = !!(ev && typeof ev.matches === 'boolean'
        ? ev.matches : _mql.matches);
      if (typeof document !== 'undefined') { refresh(document); }
    }
    if (typeof _mql.addEventListener === 'function') {
      _mql.addEventListener('change', onChange);
    } else if (typeof _mql.addListener === 'function') {
      _mql.addListener(onChange);
    }
  }

  // ── token helpers ───────────────────────────────────────────────────

  // Read a CSS custom property off :root, trimmed. Returns '' when the
  // token is absent so callers can fall back. This is what makes the
  // module work with NO DESIGN.md — every read has a hardcoded fallback.
  function readVar(name) {
    if (typeof document === 'undefined' || !document.documentElement) {
      return '';
    }
    var raw = '';
    try {
      raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name);
    } catch (e) {
      return '';
    }
    return (raw || '').trim();
  }

  // Read a duration token as a finite number of milliseconds. Strips a
  // trailing ms / s unit (an `s` value is scaled to ms). SMIL `dur`
  // attributes cannot reference a CSS var, so the flow engine resolves
  // the token to a concrete value at render time via this helper.
  function readDurationMs(name, fallbackMs) {
    var raw = readVar(name);
    if (!raw) { return fallbackMs; }
    var isSeconds = /s\s*$/.test(raw) && !/ms\s*$/.test(raw);
    var num = parseFloat(raw);
    if (!isFinite(num)) { return fallbackMs; }
    return isSeconds ? num * 1000 : num;
  }

  // ── XML / attribute escaping ────────────────────────────────────────
  //
  // Scene-graph labels are author-supplied strings. They go into SVG
  // <text> via textContent (the DOM escapes that for free), but any
  // value that lands in an ATTRIBUTE (title, data-*) is escaped here.
  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Theming layer — §6 ──────────────────────────────────────────────

  // The semantic role -> {fill, stroke} map (spec §6.2). Replaces the
  // third-party templates' hardcoded per-type hex palette. Every value
  // is a `var(--vc-*)` expression with a hardcoded fallback, so the SVG
  // re-themes on a DESIGN.md swap with zero JS. The fills use color-mix
  // so a node tints toward the surface instead of being a flat block.
  var ROLE_FILL = {
    client: 'color-mix(in srgb, var(--vc-color-info, #3464a8) 14%,'
      + ' var(--vc-color-surface, #ffffff))',
    service: 'color-mix(in srgb, var(--vc-color-accent, #b8861f) 14%,'
      + ' var(--vc-color-surface, #ffffff))',
    data: 'color-mix(in srgb, var(--vc-color-success, #3a6b5c) 14%,'
      + ' var(--vc-color-surface, #ffffff))',
    infra: 'color-mix(in srgb, var(--vc-color-warning, #a8791f) 14%,'
      + ' var(--vc-color-surface, #ffffff))',
    external: 'var(--vc-color-surface-sunken, #f1ece0)',
    accent: 'color-mix(in srgb, var(--vc-color-accent, #b8861f) 22%,'
      + ' var(--vc-color-surface, #ffffff))'
  };
  var ROLE_STROKE = {
    client: 'var(--vc-color-info, #3464a8)',
    service: 'var(--vc-color-accent, #b8861f)',
    data: 'var(--vc-color-success, #3a6b5c)',
    infra: 'var(--vc-color-warning, #a8791f)',
    external: 'var(--vc-color-content-subtle, #8a8170)',
    accent: 'var(--vc-color-accent, #b8861f)'
  };
  // The fill/stroke for a node with no `role` set.
  var DEFAULT_NODE_FILL = 'var(--vc-color-surface, #ffffff)';
  var DEFAULT_NODE_STROKE = 'var(--vc-color-border-strong, #c9bfa3)';

  // Per node-type stroke override (spec §4.3 — start/decision/end carry
  // a semantic outline color that wins over the role map). A type whose
  // value is null defers to the role map / default.
  var TYPE_STROKE = {
    start: 'var(--vc-color-info, #3464a8)',
    decision: 'var(--vc-color-warning, #a8791f)',
    end: 'var(--vc-color-success, #3a6b5c)',
    external: 'var(--vc-color-content-subtle, #8a8170)',
    process: null,
    subprocess: null,
    card: null
  };

  // Resolve a node's fill — role wins, else the type/default.
  function nodeFill(node) {
    if (node.role && ROLE_FILL.hasOwnProperty(node.role)) {
      return ROLE_FILL[node.role];
    }
    return DEFAULT_NODE_FILL;
  }
  // Resolve a node's stroke — type override wins, else role, else default.
  function nodeStroke(node) {
    if (TYPE_STROKE[node.type]) { return TYPE_STROKE[node.type]; }
    if (node.role && ROLE_STROKE.hasOwnProperty(node.role)) {
      return ROLE_STROKE[node.role];
    }
    return DEFAULT_NODE_STROKE;
  }

  // deriveSecondary — DG-04 two-color derivation. A single accent in, a
  // harmonious secondary out via oklch color-mix toward white. The
  // runtime already uses color-mix pervasively, so there is no
  // browser-support risk.
  function deriveSecondary(accent) {
    var a = (accent && String(accent).trim()) || 'var(--vc-color-accent,'
      + ' #b8861f)';
    return 'color-mix(in oklch, ' + a + ' 70%, white)';
  }

  // buildMermaidThemeVariables — DG-01 keystone. Mermaid bakes colors at
  // init() time from a themeVariables object; it does NOT read CSS
  // custom properties. This forwards the resolved --vc-* values into the
  // shape Mermaid's `base` theme expects. Used by the runtime's Mermaid
  // renderer; exported here so it is unit-testable in isolation.
  function buildMermaidThemeVariables() {
    function v(name, fb) {
      var got = readVar(name);
      return got || fb;
    }
    return {
      background: v('--vc-color-canvas', '#faf6ee'),
      primaryColor: v('--vc-color-surface', '#ffffff'),
      primaryBorderColor: v('--vc-color-border-strong', '#c9bfa3'),
      primaryTextColor: v('--vc-color-content', '#1f1a14'),
      secondaryColor: deriveSecondary(v('--vc-color-accent', '#b8861f')),
      tertiaryColor: v('--vc-color-surface-sunken', '#f1ece0'),
      lineColor: v('--vc-color-border-strong', '#c9bfa3'),
      textColor: v('--vc-color-content', '#1f1a14'),
      mainBkg: v('--vc-color-surface', '#ffffff'),
      nodeBorder: v('--vc-color-accent', '#b8861f'),
      clusterBkg: v('--vc-color-surface-sunken', '#f1ece0'),
      clusterBorder: v('--vc-color-border', '#e3dcc9'),
      titleColor: v('--vc-color-content', '#1f1a14'),
      edgeLabelBackground: v('--vc-color-canvas', '#faf6ee'),
      fontFamily: v('--vc-font-body', 'system-ui, sans-serif'),
      fontSize: v('--vc-text-2', '16px')
    };
  }

  // Six named theme presets (spec §6.5 — DG-18 pruned 12 -> 6). Each is
  // a PARTIAL DESIGN.md frontmatter: a colors.light + colors.dark block
  // (BOTH themes always — single-theme is a correctness defect) plus
  // optional radius/font overrides. The agent drops one into a page's
  // DESIGN.md, or the engine applies it scoped to a diagram wrapper.
  var THEME_PRESETS = {
    'default': {
      character: "the page's own DESIGN.md — no override",
      overrides: {}
    },
    'dark': {
      character: 'near-black canvas, bright accent',
      overrides: {
        '--vc-color-canvas': '#0e0c08',
        '--vc-color-surface': '#1b1813',
        '--vc-color-surface-sunken': '#080704',
        '--vc-color-content': '#f3ecdd',
        '--vc-color-accent': '#d8a83f'
      }
    },
    'blueprint': {
      character: 'cyan-on-navy engineering look; grid background on',
      background: 'grid',
      overrides: {
        '--vc-color-canvas': '#0a1830',
        '--vc-color-surface': '#0f2444',
        '--vc-color-surface-sunken': '#081226',
        '--vc-color-content': '#d6e6ff',
        '--vc-color-accent': '#38c6e0',
        '--vc-color-border': '#1d3a64',
        '--vc-color-border-strong': '#2d5288'
      }
    },
    'terminal': {
      character: 'green/amber-on-black, mono everything',
      overrides: {
        '--vc-color-canvas': '#06080a',
        '--vc-color-surface': '#0d1014',
        '--vc-color-surface-sunken': '#020304',
        '--vc-color-content': '#7dd88f',
        '--vc-color-accent': '#7dd88f',
        '--vc-color-border': '#1c2a1f',
        '--vc-color-border-strong': '#2e4433',
        '--vc-font-body': 'var(--vc-font-mono, ui-monospace, monospace)'
      }
    },
    'high-contrast': {
      character: 'AAA contrast, no tints, thicker hairlines',
      flatFills: true,
      overrides: {}
    },
    'hand-drawn': {
      character: 'sketchy wobble — an SVG feTurbulence filter, no rough.js',
      handDrawn: true,
      overrides: {}
    }
  };

  function getThemePreset(name) {
    if (THEME_PRESETS.hasOwnProperty(name)) { return THEME_PRESETS[name]; }
    return THEME_PRESETS['default'];
  }

  // ── Scene-graph validation — §4.2 (all fail-fast) ───────────────────

  function isFiniteNum(n) {
    return typeof n === 'number' && isFinite(n);
  }

  // validateScene — throws an Error with a precise message on any schema
  // violation (spec §4.2). The renderSceneGraph catch path turns the
  // thrown message into red error text in the host element. NEVER
  // returns a "best effort" partial scene — fail loud, never silent.
  function validateScene(scene) {
    if (!scene || typeof scene !== 'object') {
      throw new Error('scene graph must be a JSON object');
    }
    if (scene.version !== 1) {
      throw new Error('unsupported scene version: '
        + JSON.stringify(scene.version) + ' (expected 1)');
    }
    if (scene.preset !== undefined
        && PRESETS.indexOf(scene.preset) === -1) {
      throw new Error('unknown preset: ' + JSON.stringify(scene.preset));
    }
    if (!isFiniteNum(scene.width) || scene.width <= 0) {
      throw new Error('scene width must be a positive number');
    }
    if (!isFiniteNum(scene.height) || scene.height <= 0) {
      throw new Error('scene height must be a positive number');
    }
    if (!scene.nodes || !scene.nodes.length) {
      throw new Error('scene graph must have at least one node');
    }
    var preset = scene.preset || 'free';
    var ids = {};
    var i;
    for (i = 0; i < scene.nodes.length; i++) {
      var node = scene.nodes[i];
      if (!node || typeof node !== 'object') {
        throw new Error('node ' + i + ' is not an object');
      }
      if (typeof node.id !== 'string' || !node.id) {
        throw new Error('node ' + i + ' is missing a string id');
      }
      if (ids.hasOwnProperty(node.id)) {
        throw new Error('duplicate node id: ' + node.id);
      }
      ids[node.id] = true;
      if (NODE_TYPES.indexOf(node.type) === -1) {
        throw new Error('unknown node type: ' + JSON.stringify(node.type)
          + ' (node ' + node.id + ')');
      }
      if (typeof node.label !== 'string') {
        throw new Error('node ' + node.id + ' is missing a string label');
      }
      if (node.role !== undefined
          && NODE_ROLES.indexOf(node.role) === -1) {
        throw new Error('unknown node role: ' + JSON.stringify(node.role)
          + ' (node ' + node.id + ')');
      }
      // preset:"free" demands explicit coordinates — the engine does no
      // auto-layout for free scenes, so a missing x/y is unrecoverable.
      if (preset === 'free'
          && (!isFiniteNum(node.x) || !isFiniteNum(node.y))) {
        throw new Error('node ' + node.id
          + ' needs numeric x/y (preset "free" has no auto-placement)');
      }
    }
    if (scene.edges) {
      for (i = 0; i < scene.edges.length; i++) {
        var edge = scene.edges[i];
        if (!edge || typeof edge !== 'object') {
          throw new Error('edge ' + i + ' is not an object');
        }
        if (!ids.hasOwnProperty(edge.from)) {
          throw new Error('edge references unknown node: '
            + JSON.stringify(edge.from));
        }
        if (!ids.hasOwnProperty(edge.to)) {
          throw new Error('edge references unknown node: '
            + JSON.stringify(edge.to));
        }
        if (edge.style !== undefined
            && EDGE_STYLES.indexOf(edge.style) === -1) {
          throw new Error('unknown edge style: '
            + JSON.stringify(edge.style));
        }
        if (edge.route !== undefined
            && EDGE_ROUTES.indexOf(edge.route) === -1) {
          throw new Error('unknown edge route: '
            + JSON.stringify(edge.route));
        }
        if (edge.animate !== undefined
            && EDGE_ANIMATE.indexOf(edge.animate) === -1) {
          throw new Error('unknown edge animate: '
            + JSON.stringify(edge.animate));
        }
        if (edge.arrow !== undefined
            && EDGE_ARROWS.indexOf(edge.arrow) === -1) {
          throw new Error('unknown edge arrow: '
            + JSON.stringify(edge.arrow));
        }
      }
    }
    if (scene.groups) {
      var gids = {};
      for (i = 0; i < scene.groups.length; i++) {
        var grp = scene.groups[i];
        if (!grp || typeof grp !== 'object') {
          throw new Error('group ' + i + ' is not an object');
        }
        if (typeof grp.id !== 'string' || !grp.id) {
          throw new Error('group ' + i + ' is missing a string id');
        }
        if (gids.hasOwnProperty(grp.id)) {
          throw new Error('duplicate group id: ' + grp.id);
        }
        gids[grp.id] = true;
        if (!isFiniteNum(grp.x) || !isFiniteNum(grp.y)
            || !isFiniteNum(grp.w) || !isFiniteNum(grp.h)) {
          throw new Error('group ' + grp.id
            + ' needs numeric x/y/w/h');
        }
      }
    }
    return true;
  }

  // ── Auto-placement — §4.6 (DG-10 count-based rule) ──────────────────

  // autoPlace — when nodes lack x/y and preset !== "free", assign
  // coordinates by node COUNT (spec §4.6). Mutates the scene's nodes in
  // place. Returns the scene for chaining.
  //   n <= 4    -> single horizontal row
  //   5..8      -> two rows, ceil(n/2) per row
  //   n >= 9    -> circular layout
  function autoPlace(scene) {
    var nodes = scene.nodes;
    var n = nodes.length;
    var W = scene.width;
    var H = scene.height;
    var i;
    // Already-placed scenes (every node has x/y) are left untouched.
    var allPlaced = true;
    for (i = 0; i < n; i++) {
      if (!isFiniteNum(nodes[i].x) || !isFiniteNum(nodes[i].y)) {
        allPlaced = false;
        break;
      }
    }
    if (allPlaced) { return scene; }

    if (scene.preset === 'phase-graph') {
      return layeredPlace(scene);
    }

    // process-flow is ALWAYS a single horizontal lane regardless of node
    // count (spec §4.6 — "the row layout is always horizontal-first; it
    // is a lane"). A per-node cumulative stride is used so mixed node
    // widths (start 110, process 160, decision 90) never overlap.
    if (scene.preset === 'process-flow') {
      var cursorX = FLOW_MARGIN;
      for (i = 0; i < n; i++) {
        nodes[i].x = cursorX;
        nodes[i].y = (H - nodeH(nodes[i])) / 2;
        cursorX += nodeW(nodes[i]) + FLOW_GAP;
      }
      return scene;
    }

    if (n <= 4) {
      // Single horizontal row, centred vertically. Per-node cumulative
      // stride so unequal node widths do not collide.
      var cx0 = FLOW_MARGIN;
      for (i = 0; i < n; i++) {
        nodes[i].x = cx0;
        nodes[i].y = (H - nodeH(nodes[i])) / 2;
        cx0 += nodeW(nodes[i]) + FLOW_GAP;
      }
    } else if (n <= 8) {
      // Two rows. perRow nodes on the top row, the rest below; each row
      // uses a per-node cumulative stride.
      var perRow = Math.ceil(n / 2);
      var nh = nodeH(nodes[0]);
      var rowGap = nh + FLOW_ROW_GAP;
      var rowX = [FLOW_MARGIN, FLOW_MARGIN];
      for (i = 0; i < n; i++) {
        var rr = i < perRow ? 0 : 1;
        nodes[i].x = rowX[rr];
        nodes[i].y = FLOW_MARGIN + rr * rowGap;
        rowX[rr] += nodeW(nodes[i]) + FLOW_GAP;
      }
    } else {
      // Circular layout.
      var cx = W / 2;
      var cy = H / 2;
      var radius = Math.max(W, H) * 0.36;
      for (i = 0; i < n; i++) {
        var ang = i * 2 * Math.PI / n - Math.PI / 2;
        nodes[i].x = cx + radius * Math.cos(ang) - nodeW(nodes[i]) / 2;
        nodes[i].y = cy + radius * Math.sin(ang) - nodeH(nodes[i]) / 2;
      }
    }
    return scene;
  }

  // layeredPlace — phase-graph longest-path layering. Each node's rank
  // is the longest dependency chain that ends at it; rank -> column,
  // intra-rank index -> row. A ~30-line topological pass, no dagre.
  function layeredPlace(scene) {
    var nodes = scene.nodes;
    var edges = scene.edges || [];
    var byId = {};
    var i;
    for (i = 0; i < nodes.length; i++) { byId[nodes[i].id] = nodes[i]; }

    // rank[id] = longest path length ending at id.
    var rank = {};
    for (i = 0; i < nodes.length; i++) { rank[nodes[i].id] = 0; }
    // Relax |V| times — guaranteed to converge for a DAG; a cycle just
    // stops growing once every rank stabilises (bounded by node count).
    var changed = true;
    var passes = 0;
    while (changed && passes < nodes.length + 1) {
      changed = false;
      passes++;
      for (i = 0; i < edges.length; i++) {
        var f = edges[i].from;
        var t = edges[i].to;
        if (rank[f] + 1 > rank[t]) {
          rank[t] = rank[f] + 1;
          changed = true;
        }
      }
    }
    // Bucket nodes by rank, then place column-by-column.
    var buckets = {};
    var maxRank = 0;
    for (i = 0; i < nodes.length; i++) {
      var r = rank[nodes[i].id];
      if (r > maxRank) { maxRank = r; }
      if (!buckets[r]) { buckets[r] = []; }
      buckets[r].push(nodes[i]);
    }
    var nw = NODE_DEFAULTS.card.w;
    var nh = NODE_DEFAULTS.card.h;
    var colGap = nw + 90;
    var rowGap = nh + 50;
    for (var rk = 0; rk <= maxRank; rk++) {
      var col = buckets[rk] || [];
      for (var j = 0; j < col.length; j++) {
        col[j].x = FLOW_MARGIN + rk * colGap;
        col[j].y = FLOW_MARGIN + j * rowGap;
      }
    }
    return scene;
  }

  // ── grid snap — §4.5 step 4 ─────────────────────────────────────────

  function snapToGrid(scene) {
    var grid = isFiniteNum(scene.grid) && scene.grid > 0
      ? scene.grid : DEFAULT_GRID;
    function snap(v) { return Math.round(v / grid) * grid; }
    var i;
    for (i = 0; i < scene.nodes.length; i++) {
      var nd = scene.nodes[i];
      nd.x = snap(nd.x);
      nd.y = snap(nd.y);
      if (isFiniteNum(nd.w)) { nd.w = snap(nd.w); }
      if (isFiniteNum(nd.h)) { nd.h = snap(nd.h); }
    }
    if (scene.groups) {
      for (i = 0; i < scene.groups.length; i++) {
        var g = scene.groups[i];
        g.x = snap(g.x); g.y = snap(g.y);
        g.w = snap(g.w); g.h = snap(g.h);
      }
    }
    return scene;
  }

  // ── node/edge geometry helpers ──────────────────────────────────────

  function nodeW(node) {
    if (isFiniteNum(node.w)) { return node.w; }
    var d = NODE_DEFAULTS[node.type] || NODE_DEFAULTS.process;
    return d.w;
  }
  function nodeH(node) {
    if (isFiniteNum(node.h)) { return node.h; }
    var d = NODE_DEFAULTS[node.type] || NODE_DEFAULTS.process;
    return d.h;
  }
  // Centre point of a node.
  function nodeCx(node) { return node.x + nodeW(node) / 2; }
  function nodeCy(node) { return node.y + nodeH(node) / 2; }

  // ── SVG element helpers ─────────────────────────────────────────────

  function svgEl(name) {
    return document.createElementNS(SVG_NS, name);
  }
  function setAttrs(el, attrs) {
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) {
        el.setAttribute(k, String(attrs[k]));
      }
    }
    return el;
  }

  // ── node shape rendering — §4.3 node-type library ───────────────────
  //
  // Each node type renders its OWN visible shape(s) as DIRECT children
  // of the wrapping <g data-ve-id>, so the runtime's
  // `svg g[data-ve-id]:hover > rect|polygon|...` selection CSS lights
  // them up with zero new CSS (spec §5). The shape geometry is
  // re-authored verbatim from the DG-12 template (geometry, not color);
  // every fill/stroke is a `var(--vc-*)` token (color, not geometry).
  function appendNodeShape(g, node) {
    var w = nodeW(node);
    var h = nodeH(node);
    var fill = nodeFill(node);
    var stroke = nodeStroke(node);
    var radiusMd = 'var(--vc-radius-md, 8px)';
    var radiusLg = 'var(--vc-radius-lg, 12px)';

    if (node.type === 'start' || node.type === 'end') {
      // Rounded-pill rect — rx = half height.
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: w, height: h, rx: h / 2, ry: h / 2,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE
      }));
    } else if (node.type === 'decision') {
      // Diamond — a <rect> rotated 45° about its centre. The DG-12
      // template's `rect x=-hw y=-hh transform="rotate(45)"` geometry.
      var dpoly = svgEl('polygon');
      var hw = w / 2;
      var hh = h / 2;
      setAttrs(dpoly, {
        points: hw + ',0 ' + w + ',' + hh + ' ' + hw + ',' + h
          + ' 0,' + hh,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE
      });
      g.appendChild(dpoly);
    } else if (node.type === 'subprocess') {
      // Double-border rect — outer + inner rect inset 4 user units.
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: w, height: h, rx: radiusMd, ry: radiusMd,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE
      }));
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 4, y: 4, width: w - 8, height: h - 8,
        rx: 'var(--vc-radius-sm, 4px)', ry: 'var(--vc-radius-sm, 4px)',
        fill: 'none', stroke: stroke, 'stroke-width': STROKE_HAIRLINE,
        'stroke-opacity': 0.6
      }));
    } else if (node.type === 'external') {
      // Dashed-stroke rect — an external/3rd-party system.
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: w, height: h, rx: radiusLg, ry: radiusLg,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE,
        'stroke-dasharray': '6 4'
      }));
    } else if (node.type === 'card') {
      // Phase-graph card — larger rect with an elevation shadow. The
      // shadow reads --vc-shadow-1 (the optional elevation group); when
      // absent, the var() simply yields nothing and the card is flat.
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: w, height: h, rx: radiusMd, ry: radiusMd,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE
      }));
    } else {
      // process — the default rounded rect.
      g.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: w, height: h, rx: radiusMd, ry: radiusMd,
        fill: fill, stroke: stroke, 'stroke-width': STROKE_NODE
      }));
    }
  }

  // appendNodeLabel — the node's text label (and optional detail line),
  // centred. Text goes in via textContent so the DOM escapes it; fill
  // is the themed content color.
  function appendNodeLabel(g, node) {
    var w = nodeW(node);
    var h = nodeH(node);
    var hasDetail = typeof node.detail === 'string' && node.detail;
    var labelY = hasDetail ? h / 2 - 6 : h / 2;
    var t = svgEl('text');
    setAttrs(t, {
      x: w / 2, y: labelY,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: 'var(--vc-color-content, #1f1a14)',
      'font-family': 'var(--vc-font-body, system-ui, sans-serif)',
      'font-size': 'var(--vc-text-1, 14px)',
      'font-weight': 'var(--vc-weight-medium, 500)'
    });
    t.textContent = node.label;
    g.appendChild(t);
    if (hasDetail) {
      var d = svgEl('text');
      setAttrs(d, {
        x: w / 2, y: h / 2 + 14,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: 'var(--vc-color-content-muted, #5b5343)',
        'font-family': 'var(--vc-font-body, system-ui, sans-serif)',
        'font-size': 'var(--vc-text-0, 12px)'
      });
      d.textContent = node.detail;
      g.appendChild(d);
    }
  }

  // ── edge routing — §4.7 ─────────────────────────────────────────────

  // anchorPoint — the point on a node's perimeter facing `toward`
  // (another node centre). Picks the nearest of the 4 faces.
  function anchorPoint(node, towardX, towardY) {
    var cx = nodeCx(node);
    var cy = nodeCy(node);
    var hw = nodeW(node) / 2;
    var hh = nodeH(node) / 2;
    var dx = towardX - cx;
    var dy = towardY - cy;
    // Compare the normalised reach on each axis to pick a face.
    if (Math.abs(dx) * hh >= Math.abs(dy) * hw) {
      // Exit on a vertical face (left/right).
      return { x: cx + (dx >= 0 ? hw : -hw), y: cy };
    }
    // Exit on a horizontal face (top/bottom).
    return { x: cx, y: cy + (dy >= 0 ? hh : -hh) };
  }

  // routePath — returns the SVG `d` for an edge between two nodes given
  // the route style. Manhattan/bezier/loop logic, no library.
  function routePath(route, a, b) {
    if (route === 'straight') {
      return 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y;
    }
    if (route === 'bezier') {
      // Cubic Bézier — control points offset along the dominant axis.
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var horiz = Math.abs(dx) >= Math.abs(dy);
      var c1x = horiz ? a.x + dx * 0.5 : a.x;
      var c1y = horiz ? a.y : a.y + dy * 0.5;
      var c2x = horiz ? b.x - dx * 0.5 : b.x;
      var c2y = horiz ? b.y : b.y - dy * 0.5;
      return 'M' + a.x + ',' + a.y + ' C' + c1x + ',' + c1y
        + ' ' + c2x + ',' + c2y + ' ' + b.x + ',' + b.y;
    }
    if (route === 'loop') {
      // Back-edge that bows out below and returns — retry/no paths.
      var bow = Math.abs(b.y - a.y) + 60;
      return 'M' + a.x + ',' + a.y
        + ' C' + a.x + ',' + (a.y + bow)
        + ' ' + b.x + ',' + (b.y + bow)
        + ' ' + b.x + ',' + b.y;
    }
    // ortho (default) — Manhattan L/Z route with one or two elbows.
    var ex = b.x;
    var ey = a.y;
    if (Math.abs(b.x - a.x) > 2 && Math.abs(b.y - a.y) > 2) {
      // Z-route through the horizontal midpoint.
      var mx = (a.x + b.x) / 2;
      return 'M' + a.x + ',' + a.y + ' L' + mx + ',' + a.y
        + ' L' + mx + ',' + b.y + ' L' + b.x + ',' + b.y;
    }
    return 'M' + a.x + ',' + a.y + ' L' + ex + ',' + ey
      + ' L' + b.x + ',' + b.y;
  }

  // dashFor — the stroke-dasharray for a non-animated edge style.
  function dashFor(style) {
    if (style === 'dashed') { return '7 5'; }
    if (style === 'dotted') { return '2 4'; }
    return null;
  }

  // ── <defs> — markers + filters — §4.3 / §7 ──────────────────────────

  // buildDefs — one arrowhead <marker> (the engine derives a single
  // accent marker — color flips with the theme via context-stroke), one
  // grid <pattern> when requested, plus the hand-drawn displacement
  // filter. Returns the <defs> element.
  function buildDefs(scene, sceneId, opts) {
    var defs = svgEl('defs');

    // Arrowhead marker — refX tuned so the head meets the node edge.
    // `context-stroke` makes the head inherit each edge's stroke color
    // (so it re-themes for free); browsers without it fall back to the
    // explicit accent fill on the <path>.
    var marker = setAttrs(svgEl('marker'), {
      id: sceneId + '-arrow', viewBox: '0 0 10 10',
      refX: 9, refY: 5, markerWidth: 7, markerHeight: 7,
      orient: 'auto-start-reverse'
    });
    marker.appendChild(setAttrs(svgEl('path'), {
      d: 'M0,0 L10,5 L0,10 z',
      fill: 'context-stroke'
    }));
    defs.appendChild(marker);

    // A start-facing copy for arrow:"start"/"both".
    var markerStart = setAttrs(svgEl('marker'), {
      id: sceneId + '-arrow-start', viewBox: '0 0 10 10',
      refX: 1, refY: 5, markerWidth: 7, markerHeight: 7,
      orient: 'auto-start-reverse'
    });
    markerStart.appendChild(setAttrs(svgEl('path'), {
      d: 'M10,0 L0,5 L10,10 z',
      fill: 'context-stroke'
    }));
    defs.appendChild(markerStart);

    // Grid <pattern> — only when background:"grid". Stroke color matches
    // the runtime's blueprint grid: a 16%-accent translucent line.
    if (scene.background === 'grid') {
      var pat = setAttrs(svgEl('pattern'), {
        id: sceneId + '-grid', width: 40, height: 40,
        patternUnits: 'userSpaceOnUse'
      });
      pat.appendChild(setAttrs(svgEl('path'), {
        d: 'M40,0 L0,0 L0,40',
        fill: 'none',
        stroke: 'color-mix(in srgb, var(--vc-color-accent, #b8861f)'
          + ' 16%, transparent)',
        'stroke-width': 0.5
      }));
      defs.appendChild(pat);
    }

    // Hand-drawn preset — a feTurbulence + feDisplacementMap filter that
    // emulates rough.js's wobble with ZERO dependencies (spec §6.5). It
    // is static, so it always applies regardless of reduced-motion.
    if (opts && opts.handDrawn) {
      var filt = setAttrs(svgEl('filter'), {
        id: sceneId + '-rough',
        x: '-5%', y: '-5%', width: '110%', height: '110%'
      });
      filt.appendChild(setAttrs(svgEl('feTurbulence'), {
        type: 'fractalNoise', baseFrequency: '0.015',
        numOctaves: 2, seed: 7, result: 'noise'
      }));
      filt.appendChild(setAttrs(svgEl('feDisplacementMap'), {
        'in': 'SourceGraphic', in2: 'noise', scale: 3,
        xChannelSelector: 'R', yChannelSelector: 'G'
      }));
      defs.appendChild(filt);
    }

    return defs;
  }

  // ── flow-animation — §7.1 (3 pure-SMIL techniques) ──────────────────
  //
  // An edge with `animate` set gets one of three SMIL treatments. Under
  // prefers-reduced-motion the edge is left STATIC-VISIBLE — no march,
  // no particle, no pulse — but still fully drawn (spec §7.1, the
  // mandatory accessibility gate). SMIL `dur` cannot read a CSS var, so
  // the duration is resolved to a concrete value at render time.
  function applyEdgeAnimation(edgeGroup, pathEl, animate, sceneId, idx) {
    if (REDUCED || !animate || animate === 'none') { return; }

    if (animate === 'flow') {
      // Flowing dashes — march the dash offset. dur from --vc-duration-
      // slow (resolved now, since SMIL cannot reference the var).
      var durMs = readDurationMs('--vc-duration-slow', 400);
      pathEl.setAttribute('stroke-dasharray', '8 12');
      var anim = setAttrs(svgEl('animate'), {
        attributeName: 'stroke-dashoffset',
        from: 0, to: -20,
        dur: (Math.max(durMs, 200) * 3.5 / 1000) + 's',
        repeatCount: 'indefinite'
      });
      pathEl.appendChild(anim);
    } else if (animate === 'particle') {
      // A dot travelling the exact edge path via <animateMotion>.
      var pathId = sceneId + '-epath-' + idx;
      pathEl.setAttribute('id', pathId);
      var dot = setAttrs(svgEl('circle'), {
        r: 3.5, fill: 'var(--vc-color-accent, #b8861f)'
      });
      var motion = setAttrs(svgEl('animateMotion'), {
        dur: '2.4s', repeatCount: 'indefinite'
      });
      var mpath = svgEl('mpath');
      mpath.setAttributeNS(XLINK_NS, 'xlink:href', '#' + pathId);
      mpath.setAttribute('href', '#' + pathId);
      motion.appendChild(mpath);
      dot.appendChild(motion);
      edgeGroup.appendChild(dot);
    } else if (animate === 'pulse') {
      // A breathing blur halo — feGaussianBlur stdDeviation animated.
      var fid = sceneId + '-pulse-' + idx;
      var defsLocal = svgEl('defs');
      var filt = setAttrs(svgEl('filter'), {
        id: fid, x: '-30%', y: '-30%', width: '160%', height: '160%'
      });
      var blur = setAttrs(svgEl('feGaussianBlur'), {
        'in': 'SourceGraphic', stdDeviation: 2
      });
      blur.appendChild(setAttrs(svgEl('animate'), {
        attributeName: 'stdDeviation',
        values: '2;5;2', dur: '2s', repeatCount: 'indefinite'
      }));
      filt.appendChild(blur);
      defsLocal.appendChild(filt);
      edgeGroup.insertBefore(defsLocal, edgeGroup.firstChild);
      pathEl.setAttribute('filter', 'url(#' + fid + ')');
    }
  }

  // ── render groups / edges / nodes ───────────────────────────────────

  function renderGroups(svg, scene) {
    if (!scene.groups) { return; }
    var i;
    for (i = 0; i < scene.groups.length; i++) {
      var grp = scene.groups[i];
      var g = svgEl('g');
      g.setAttribute('data-vc-group', grp.id);
      var fillRole = grp.role && ROLE_FILL.hasOwnProperty(grp.role)
        ? ROLE_FILL[grp.role] : 'var(--vc-color-surface-sunken, #f1ece0)';
      var strokeRole = grp.role && ROLE_STROKE.hasOwnProperty(grp.role)
        ? ROLE_STROKE[grp.role]
        : 'var(--vc-color-border, #e3dcc9)';
      g.appendChild(setAttrs(svgEl('rect'), {
        x: grp.x, y: grp.y, width: grp.w, height: grp.h,
        rx: 'var(--vc-radius-lg, 12px)', ry: 'var(--vc-radius-lg, 12px)',
        fill: fillRole, 'fill-opacity': 0.35,
        stroke: strokeRole, 'stroke-width': STROKE_HAIRLINE,
        'stroke-dasharray': '5 4'
      }));
      if (typeof grp.label === 'string' && grp.label) {
        var lbl = svgEl('text');
        setAttrs(lbl, {
          x: grp.x + 12, y: grp.y + 20,
          fill: 'var(--vc-color-content-muted, #5b5343)',
          'font-family': 'var(--vc-font-body, system-ui, sans-serif)',
          'font-size': 'var(--vc-text-0, 12px)',
          'font-weight': 'var(--vc-weight-bold, 700)'
        });
        lbl.textContent = grp.label;
        g.appendChild(lbl);
      }
      svg.appendChild(g);
    }
  }

  function renderEdges(svg, scene, sceneId, byId) {
    if (!scene.edges) { return; }
    var i;
    for (i = 0; i < scene.edges.length; i++) {
      var edge = scene.edges[i];
      var fromNode = byId[edge.from];
      var toNode = byId[edge.to];
      var route = edge.route || 'ortho';
      var style = edge.style || 'solid';
      var arrow = edge.arrow || 'end';

      // Anchor each end on the perimeter face nearest the other node.
      var a = anchorPoint(fromNode, nodeCx(toNode), nodeCy(toNode));
      var b = anchorPoint(toNode, nodeCx(fromNode), nodeCy(fromNode));
      var d = routePath(route, a, b);

      var g = svgEl('g');
      var edgeId = 've-' + sceneId + '-edge-' + edge.from + '-to-'
        + edge.to;
      setAttrs(g, {
        'data-ve-id': edgeId,
        'data-ve-type': 'diagram-edge',
        'data-ve-data': escapeAttr(JSON.stringify({
          sceneId: sceneId, kind: 'edge', from: edge.from,
          to: edge.to, edgeStyle: style
        })),
        // Phase 2.5 atom contract — keyboard reachability + a11y role.
        // Diagram boots AFTER the runtime enhanceFocus() pass, so we
        // stamp tabindex/role here.
        tabindex: '0',
        role: 'button'
      });
      if (typeof edge.label === 'string' && edge.label) {
        g.setAttribute('data-ve-label', escapeAttr(edge.label));
      }

      // 14px transparent hit-area twin path — thin edges stay clickable
      // (the same affordance the runtime adds to Graphviz edges).
      g.appendChild(setAttrs(svgEl('path'), {
        d: d, fill: 'none', stroke: 'transparent', 'stroke-width': 14,
        'stroke-linecap': 'round'
      }));

      // The visible edge path — a DIRECT > path child so the runtime's
      // `g[data-ve-id]:hover > path` CSS lights it up.
      var vis = setAttrs(svgEl('path'), {
        d: d, fill: 'none',
        stroke: 'var(--vc-color-border-strong, #c9bfa3)',
        'stroke-width': STROKE_EDGE, 'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
      var dash = dashFor(style);
      if (dash) { vis.setAttribute('stroke-dasharray', dash); }
      if (arrow === 'end' || arrow === 'both') {
        vis.setAttribute('marker-end',
          'url(#' + sceneId + '-arrow)');
      }
      if (arrow === 'start' || arrow === 'both') {
        vis.setAttribute('marker-start',
          'url(#' + sceneId + '-arrow-start)');
      }
      g.appendChild(vis);

      applyEdgeAnimation(g, vis, edge.animate, sceneId, i);

      // Edge label — a small chip at the path midpoint.
      if (typeof edge.label === 'string' && edge.label) {
        var midX = (a.x + b.x) / 2;
        var midY = (a.y + b.y) / 2;
        var lt = svgEl('text');
        setAttrs(lt, {
          x: midX, y: midY,
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: 'var(--vc-color-content-muted, #5b5343)',
          'font-family': 'var(--vc-font-body, system-ui, sans-serif)',
          'font-size': 'var(--vc-text-0, 12px)'
        });
        // A small backing rect so the label is legible over the edge.
        var bg = setAttrs(svgEl('rect'), {
          x: midX - edge.label.length * 3.4 - 4,
          y: midY - 9, width: edge.label.length * 6.8 + 8, height: 18,
          rx: 3, ry: 3,
          fill: 'var(--vc-color-canvas, #faf6ee)', 'fill-opacity': 0.92
        });
        g.appendChild(bg);
        lt.textContent = edge.label;
        g.appendChild(lt);
      }

      // Phase 2.5 request #10 — every edge atom gets the 3-radio
      // Skip/Approve/Deny mini-pill via the runtime helper. Defensive
      // — the helper ships from the sibling p25-runtime-text-comment
      // agent and may not be present in standalone fixtures.
      _attachDecisionMini(g, edgeId);

      svg.appendChild(g);
    }
  }

  // Defensive bridge to amvcpRuntime.attachDecisionMini (request #10).
  function _attachDecisionMini(atomEl, atomId) {
    if (!atomEl || atomEl.__veDecisionMiniAttached) { return; }
    if (typeof window === 'undefined') { return; }
    var rt = window.amvcpRuntime;
    if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
    try {
      rt.attachDecisionMini(atomEl, atomId);
      atomEl.__veDecisionMiniAttached = true;
    } catch (_) { /* helper failed — diagram stays usable, no pill */ }
  }

  function renderNodes(svg, scene, sceneId) {
    var i;
    for (i = 0; i < scene.nodes.length; i++) {
      var node = scene.nodes[i];
      var g = svgEl('g');
      var nodeId = 've-' + sceneId + '-node-' + node.id;
      setAttrs(g, {
        transform: 'translate(' + node.x + ',' + node.y + ')',
        'data-ve-id': nodeId,
        'data-ve-type': 'diagram-node',
        'data-ve-label': escapeAttr(node.label),
        'data-ve-data': escapeAttr(JSON.stringify({
          sceneId: sceneId, kind: 'node', nodeType: node.type,
          nodeId: node.id
        })),
        // Phase 2.5 atom contract — keyboard reachability + a11y role.
        tabindex: '0',
        role: 'button'
      });

      appendNodeShape(g, node);
      appendNodeLabel(g, node);

      // process-flow: a numbered circle above each `process` node — the
      // step index. Themed --vc-color-accent.
      if (scene.preset === 'process-flow' && node.type === 'process'
          && isFiniteNum(node._stepIndex)) {
        var w = nodeW(node);
        var badge = svgEl('g');
        badge.appendChild(setAttrs(svgEl('circle'), {
          cx: w / 2, cy: -16, r: 12,
          fill: 'var(--vc-color-accent, #b8861f)',
          stroke: 'var(--vc-color-surface, #ffffff)',
          'stroke-width': STROKE_NODE
        }));
        var bt = svgEl('text');
        setAttrs(bt, {
          x: w / 2, y: -16,
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          fill: 'var(--vc-color-on-accent, #ffffff)',
          'font-family': 'var(--vc-font-body, system-ui, sans-serif)',
          'font-size': 'var(--vc-text-0, 12px)',
          'font-weight': 'var(--vc-weight-bold, 700)'
        });
        bt.textContent = String(node._stepIndex);
        badge.appendChild(bt);
        g.appendChild(badge);
      }

      // Phase 2.5 request #10 — every node atom gets the 3-radio
      // Skip/Approve/Deny mini-pill via the runtime helper.
      _attachDecisionMini(g, nodeId);

      svg.appendChild(g);
    }
  }

  // ── chain highlight — §4.4 (phase-graph) ────────────────────────────
  //
  // Clicking a phase-graph node marks every node/edge transitively
  // reachable from it with data-ve-chain="1"; a second click clears it.
  // This is a VISUAL OVERLAY on top of the runtime's selection event —
  // the click still goes through the standard [data-ve-id] handler. The
  // chain CSS dims everything NOT in the chain.
  function wireChainHighlight(svg, scene, sceneId) {
    // adjacency from->to
    var adj = {};
    var i;
    for (i = 0; i < scene.nodes.length; i++) { adj[scene.nodes[i].id] = []; }
    var edges = scene.edges || [];
    for (i = 0; i < edges.length; i++) {
      if (adj[edges[i].from]) { adj[edges[i].from].push(edges[i].to); }
    }

    function clearChain() {
      var marked = svg.querySelectorAll('[data-ve-chain]');
      for (var j = 0; j < marked.length; j++) {
        marked[j].removeAttribute('data-ve-chain');
      }
      svg.removeAttribute('data-vc-chain-active');
    }

    function markChain(startId) {
      clearChain();
      // BFS over from->to.
      var seen = {};
      var queue = [startId];
      seen[startId] = true;
      var reachedEdges = {};
      while (queue.length) {
        var cur = queue.shift();
        var outs = adj[cur] || [];
        for (var k = 0; k < outs.length; k++) {
          reachedEdges[cur + ' ' + outs[k]] = true;
          if (!seen[outs[k]]) {
            seen[outs[k]] = true;
            queue.push(outs[k]);
          }
        }
      }
      // Mark nodes.
      for (var nid in seen) {
        if (seen.hasOwnProperty(nid)) {
          var ng = svg.querySelector(
            '[data-ve-id="ve-' + sceneId + '-node-' + nid + '"]');
          if (ng) { ng.setAttribute('data-ve-chain', '1'); }
        }
      }
      // Mark edges.
      for (var ek in reachedEdges) {
        if (reachedEdges.hasOwnProperty(ek)) {
          var parts = ek.split(' ');
          var eg = svg.querySelector('[data-ve-id="ve-' + sceneId
            + '-edge-' + parts[0] + '-to-' + parts[1] + '"]');
          if (eg) { eg.setAttribute('data-ve-chain', '1'); }
        }
      }
      svg.setAttribute('data-vc-chain-active', '1');
    }

    var nodeGroups = svg.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    for (i = 0; i < nodeGroups.length; i++) {
      (function (g) {
        g.addEventListener('click', function () {
          var idAttr = g.getAttribute('data-ve-id') || '';
          var nid = idAttr.replace('ve-' + sceneId + '-node-', '');
          if (g.getAttribute('data-ve-chain') === '1'
              && svg.getAttribute('data-vc-chain-active') === '1') {
            clearChain();
          } else {
            markChain(nid);
          }
        });
      })(nodeGroups[i]);
    }
  }

  // ── scroll-reveal — §7.2 (IntersectionObserver draw-on) ─────────────
  //
  // For data-ve-scene-reveal="scroll": each edge path starts at
  // stroke-dashoffset = full length (invisible); an IntersectionObserver
  // fires once per target node and transitions the offset to 0 (the
  // draw-on reveal). Under reduced motion the offset is set to 0
  // immediately — the edge is just there, no draw animation. The IO is
  // shared with amvcp-animation when present, else a local fallback IO.
  function armScrollReveal(svg) {
    var visEdges = svg.querySelectorAll(
      'g[data-ve-type="diagram-edge"] > path:nth-child(2)');
    var k;
    var paths = [];
    for (k = 0; k < visEdges.length; k++) { paths.push(visEdges[k]); }

    var durMs = readDurationMs('--vc-duration-slow', 400);

    function drawOn(p) {
      var len;
      try { len = p.getTotalLength(); } catch (e) { len = 0; }
      if (!len) { return; }
      if (REDUCED) {
        // Substitute: edge simply present, no draw.
        p.style.strokeDasharray = 'none';
        p.style.strokeDashoffset = '0';
        return;
      }
      p.style.transition = 'stroke-dashoffset ' + durMs + 'ms'
        + ' var(--vc-easing-decel, cubic-bezier(0,0,0,1))';
      p.style.strokeDashoffset = '0';
    }

    for (k = 0; k < paths.length; k++) {
      var p = paths[k];
      var len;
      try { len = p.getTotalLength(); } catch (e2) { len = 0; }
      if (len) {
        p.style.strokeDasharray = len + ' ' + len;
        p.style.strokeDashoffset = REDUCED ? '0' : String(len);
      }
    }

    // Shared IO seam — amvcp-animation.observeReveal when loaded.
    var hasSharedIO = typeof window !== 'undefined'
      && window.amvcpAnimation
      && typeof window.amvcpAnimation.revealNow === 'function'
      && typeof window.IntersectionObserver === 'function';

    if (typeof window === 'undefined'
        || typeof window.IntersectionObserver !== 'function') {
      // No IO — fail-safe: draw every edge now (never stuck invisible).
      for (k = 0; k < paths.length; k++) { drawOn(paths[k]); }
      return;
    }

    // Local fire-once IO watching each node group; when a node scrolls
    // in, draw its incoming/outgoing edges.
    var io = new window.IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (entries[e].isIntersecting) {
          var target = entries[e].target;
          io.unobserve(target);
          // Draw every edge path (simple, robust — a node entering view
          // reveals the whole local cluster).
          for (var m = 0; m < paths.length; m++) { drawOn(paths[m]); }
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    var nodeGroups = svg.querySelectorAll(
      'g[data-ve-type="diagram-node"]');
    for (k = 0; k < nodeGroups.length; k++) {
      io.observe(nodeGroups[k]);
    }
    // hasSharedIO is recorded for parity with the spec's documented
    // seam; the local IO is functionally identical and avoids a hard
    // dependency, so the module works standalone.
    void hasSharedIO;
  }

  // ── renderSceneGraph — §4.5 the main render algorithm ───────────────

  var _sceneCounter = 0;

  // Paint a fail-fast error into the host element — red text + a title,
  // mirroring the runtime's Graphviz renderGraph catch path. NEVER a
  // silent empty SVG.
  function paintError(hostEl, message) {
    hostEl.textContent = '';
    var box = document.createElement('div');
    // .ve-scene-error + role=alert make the box a structural payload
    // (R19) — even a failed scene satisfies the "skill output must be
    // structural" rule because the alert IS the structured content.
    box.className = 've-scene-error';
    box.setAttribute('role', 'alert');
    box.style.cssText = 'padding:12px 14px;'
      + 'font-family:var(--vc-font-mono, ui-monospace, monospace);'
      + 'font-size:var(--vc-text-0, 12px);'
      + 'color:var(--vc-color-danger, #a84a32);'
      + 'background:color-mix(in srgb,'
      + ' var(--vc-color-danger, #a84a32) 8%, transparent);'
      + 'border:1px solid var(--vc-color-danger, #a84a32);'
      + 'border-radius:var(--vc-radius-md, 8px);'
      + 'white-space:pre-wrap;';
    box.title = message;
    box.textContent = 'Scene-graph error: ' + message;
    hostEl.appendChild(box);
  }

  // renderSceneGraph — read the embedded JSON, validate, place, snap,
  // render the SVG, wire selection / chain / reveal. The whole body is
  // wrapped so any thrown error becomes red text in the host (fail-fast,
  // surfaced — never silent).
  function renderSceneGraph(hostEl) {
    if (!hostEl) { return; }
    var scene;
    try {
      var jsonEl = hostEl.querySelector(
        'script[type="application/json"]');
      if (!jsonEl) {
        throw new Error('no <script type="application/json"> scene'
          + ' graph found in the host element');
      }
      scene = JSON.parse(jsonEl.textContent);
      validateScene(scene);
    } catch (parseErr) {
      paintError(hostEl, parseErr && parseErr.message
        ? parseErr.message : String(parseErr));
      return;
    }

    var sceneId = 'sg' + (++_sceneCounter);
    var preset = scene.preset || 'free';

    // Theme preset — data-ve-scene-theme on the host applies a named
    // preset's --vc-* overrides SCOPED to the host element (not :root).
    var presetName = hostEl.getAttribute('data-ve-scene-theme') || '';
    var themePreset = presetName ? getThemePreset(presetName) : null;
    if (themePreset && themePreset.overrides) {
      for (var ov in themePreset.overrides) {
        if (themePreset.overrides.hasOwnProperty(ov)) {
          hostEl.style.setProperty(ov, themePreset.overrides[ov]);
        }
      }
      if (themePreset.background && !scene.background) {
        scene.background = themePreset.background;
      }
    }
    var handDrawn = !!(themePreset && themePreset.handDrawn);

    // Auto-place + snap (mutates the scene; harmless — scene is local
    // unless the caller passed a reused object, which reRenderScene
    // explicitly deep-copies first).
    if (preset !== 'free') { autoPlace(scene); }
    snapToGrid(scene);

    // Tag process nodes with their 1-based step index for the badge.
    if (preset === 'process-flow') {
      var step = 0;
      for (var pi = 0; pi < scene.nodes.length; pi++) {
        if (scene.nodes[pi].type === 'process') {
          step++;
          scene.nodes[pi]._stepIndex = step;
        }
      }
    }

    var byId = {};
    var bi;
    for (bi = 0; bi < scene.nodes.length; bi++) {
      byId[scene.nodes[bi].id] = scene.nodes[bi];
    }

    // Build the SVG. width:100%/height:auto means a wide diagram
    // extends the document — no inner scrollbar (no-nested-scrollbars).
    var svg = svgEl('svg');
    setAttrs(svg, {
      viewBox: '0 0 ' + scene.width + ' ' + scene.height,
      xmlns: SVG_NS,
      'data-vc-scene': sceneId,
      'data-vc-preset': preset
    });
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.maxWidth = 'none';
    svg.style.display = 'block';

    svg.appendChild(buildDefs(scene, sceneId, { handDrawn: handDrawn }));

    // Background rect — grid pattern / plain surface / none.
    if (scene.background === 'grid') {
      svg.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: scene.width, height: scene.height,
        fill: 'url(#' + sceneId + '-grid)'
      }));
    } else if (scene.background === 'plain') {
      svg.appendChild(setAttrs(svgEl('rect'), {
        x: 0, y: 0, width: scene.width, height: scene.height,
        fill: 'var(--vc-color-surface, #ffffff)'
      }));
    }

    renderGroups(svg, scene);
    renderEdges(svg, scene, sceneId, byId);
    renderNodes(svg, scene, sceneId);

    // Hand-drawn — apply the displacement filter to the whole content
    // group's strokes (a single filter reference; static, so always on).
    if (handDrawn) {
      svg.setAttribute('filter', 'url(#' + sceneId + '-rough)');
    }

    // Swap the host's contents for the rendered SVG.
    hostEl.textContent = '';
    hostEl.appendChild(svg);

    // Viewport scaffold (opt-in via data-ve-scene-viewport="<height>").
    // Must run BEFORE chain-highlight + scroll-reveal because those wire
    // listeners on the SVG, and the viewport wrapper re-mounts the SVG
    // inside .ve-scene-canvas (no DOM identity change — the SVG node is
    // moved, listeners survive — but layout-dependent calls like
    // armScrollReveal need to see the final structure).
    _wrapInViewport(hostEl, svg, scene);

    // Export menu (PNG/JPEG/WebP/SVG download + Copy-PNG-to-clipboard).
    // Must run AFTER _wrapInViewport so it sits on top of the stage and
    // toolbar in z-order (CSS gives it z-index:5). The wrap is positioned
    // absolutely against the host; .ve-scene-graph is position:relative
    // (set in CSS_LINES) so the wrap stays anchored to the host's
    // top-right corner regardless of mode.
    _attachExportMenu(hostEl);

    // phase-graph chain highlight.
    if (preset === 'phase-graph') {
      wireChainHighlight(svg, scene, sceneId);
    }

    // Scroll-reveal draw-on.
    if (hostEl.getAttribute('data-ve-scene-reveal') === 'scroll') {
      armScrollReveal(svg);
    }

    // Phase 2.5 — group-handle observer (TRDD-352ef46a contract step 3).
    // Watches the host subtree for [data-ve-selected="1"] mutations
    // and mounts ONE .ve-comment-handle on the host when >=1 atom is
    // selected. Mirrors amvcp-runtime.js updateGroupCommentHandles for
    // the table/list/section container kinds; .ve-scene-graph is not
    // in the runtime container list, so we wire the observer here.
    _wireGroupHandle(hostEl);

    // Record the ORIGINAL scene JSON on the host so a theme hot-swap
    // can re-render from a clean copy (the rendered scene was mutated
    // by autoPlace/snap/_stepIndex).
    hostEl.__vcSceneJSON = jsonText(hostEl);
    return svg;
  }

  // Build / update / remove the per-scene comment-handle. Idempotent.
  function _updateGroupHandle(host) {
    if (!host || !host.querySelectorAll) { return; }
    var selected = host.querySelectorAll('[data-ve-selected="1"]');
    var existing = host.querySelector(':scope > .ve-comment-handle');
    if (selected.length === 0) {
      if (existing) { existing.remove(); }
      return;
    }
    var first = selected[0];
    var hostRect = host.getBoundingClientRect();
    var firstRect = first.getBoundingClientRect();
    var topPx = firstRect.top - hostRect.top + firstRect.height / 2;
    var handle = existing;
    if (!handle) {
      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 've-comment-handle ve-group-handle';
      handle.textContent = '\u{1F4AC}';   /* speech-bubble glyph */
      handle.title = 'Open comment thread for selected diagram atoms';
      handle.setAttribute('data-ve-overlay', '1');
      handle.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var openFn = (typeof window !== 'undefined'
          && typeof window.__veOpenCommentModal === 'function')
          ? window.__veOpenCommentModal : null;
        if (openFn) { openFn(this); }
      });
      host.appendChild(handle);
    }
    var ids = [];
    for (var i = 0; i < selected.length; i++) {
      var aid = selected[i].getAttribute('data-ve-id');
      if (aid) { ids.push(aid); }
    }
    ids.sort();
    var hostId = host.id || host.getAttribute('data-ve-id') || 'scene';
    handle.setAttribute('data-ve-comment-id',
      'diagram:' + hostId + ':' + ids.join(','));
    handle.style.top = topPx + 'px';
  }

  function _wireGroupHandle(host) {
    if (!host || host.__veGroupHandleWired) { return; }
    host.__veGroupHandleWired = true;
    _updateGroupHandle(host);
    if (typeof MutationObserver === 'undefined') { return; }
    var mo = new MutationObserver(function () {
      _updateGroupHandle(host);
    });
    mo.observe(host, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ve-selected']
    });
    host.__veGroupHandleObserver = mo;
  }

  // ── viewport scaffold — opt-in via data-ve-scene-viewport ───────────
  //
  // When a scene-graph host carries data-ve-scene-viewport="<height>",
  // the rendered SVG is wrapped in a fixed-height viewport with:
  //   - draggable pan via mousedown on stage (mouse-cursor = grab)
  //   - mouse-wheel zoom centred on cursor
  //   - toolbar with [zoom-out, slider, zoom-in, label, fit-all, 1:1, fit-width]
  //   - mini-map overlay in bottom-right (drag the frame to pan)
  //
  // This is the "true application surface" exception to the
  // no-nested-scrollbars rule (~/.claude/rules/no-nested-scrollbars.md):
  // diagrams are map-like surfaces (zoomable, pannable), not flowing
  // documents — same exemption a code editor or video timeline gets.
  //
  // Without the attribute the SVG keeps width:100% and extends the page
  // (default behaviour preserved).

  var MINIMAP_W = 180;
  var MINIMAP_H = 120;
  var MINIMAP_PAD = 4;
  var SCALE_MIN = 0.2;
  var SCALE_MAX = 4;

  function _ensureViewportState(hostEl, sceneW, sceneH) {
    if (hostEl.__vcViewport) { return hostEl.__vcViewport; }
    var s = {
      scale: 1, tx: 0, ty: 0,
      sceneW: sceneW, sceneH: sceneH,
      minScale: SCALE_MIN, maxScale: SCALE_MAX,
      stage: null, canvas: null, svg: null,
      toolbar: null, slider: null, label: null,
      minimap: null, minimapFrame: null
    };
    hostEl.__vcViewport = s;
    return s;
  }

  function _setTransform(s) {
    if (!s || !s.stage || !s.canvas) { return; }
    var stageRect = s.stage.getBoundingClientRect();
    var sw = s.sceneW * s.scale;
    var sh = s.sceneH * s.scale;
    if (sw < stageRect.width) {
      s.tx = (stageRect.width - sw) / 2;
    } else {
      var minTx = stageRect.width - sw;
      if (s.tx > 0) { s.tx = 0; }
      if (s.tx < minTx) { s.tx = minTx; }
    }
    if (sh < stageRect.height) {
      s.ty = (stageRect.height - sh) / 2;
    } else {
      var minTy = stageRect.height - sh;
      if (s.ty > 0) { s.ty = 0; }
      if (s.ty < minTy) { s.ty = minTy; }
    }
    s.canvas.style.transform =
      'translate(' + s.tx + 'px, ' + s.ty + 'px) ' +
      'scale(' + s.scale + ')';
    if (s.label) {
      s.label.textContent = Math.round(s.scale * 100) + '%';
    }
    if (s.slider) {
      var ratio = (s.scale - s.minScale) / (s.maxScale - s.minScale);
      s.slider.value = String(Math.round(ratio * 100));
    }
    _updateMinimapFrame(s);
  }

  function _minimapMetrics(s) {
    var ms = Math.min(MINIMAP_W / s.sceneW, MINIMAP_H / s.sceneH);
    var rw = s.sceneW * ms;
    var rh = s.sceneH * ms;
    return {
      scale: ms,
      renderW: rw,
      renderH: rh,
      offX: (MINIMAP_W - rw) / 2 + MINIMAP_PAD,
      offY: (MINIMAP_H - rh) / 2 + MINIMAP_PAD
    };
  }

  function _updateMinimapFrame(s) {
    if (!s.minimapFrame || !s.stage) { return; }
    var m = _minimapMetrics(s);
    var stageRect = s.stage.getBoundingClientRect();
    var vx = (-s.tx / s.scale) * m.scale;
    var vy = (-s.ty / s.scale) * m.scale;
    var vw = (stageRect.width / s.scale) * m.scale;
    var vh = (stageRect.height / s.scale) * m.scale;
    if (vx < 0) { vx = 0; }
    if (vy < 0) { vy = 0; }
    if (vx + vw > m.renderW) { vw = m.renderW - vx; }
    if (vy + vh > m.renderH) { vh = m.renderH - vy; }
    if (vw < 6) { vw = 6; }
    if (vh < 6) { vh = 6; }
    s.minimapFrame.style.left = (m.offX + vx) + 'px';
    s.minimapFrame.style.top = (m.offY + vy) + 'px';
    s.minimapFrame.style.width = vw + 'px';
    s.minimapFrame.style.height = vh + 'px';
  }

  function _zoomAt(s, factor, cx, cy) {
    var newScale = s.scale * factor;
    if (newScale < s.minScale) { newScale = s.minScale; }
    if (newScale > s.maxScale) { newScale = s.maxScale; }
    if (newScale === s.scale) { return; }
    var sceneX = (cx - s.tx) / s.scale;
    var sceneY = (cy - s.ty) / s.scale;
    s.scale = newScale;
    s.tx = cx - sceneX * s.scale;
    s.ty = cy - sceneY * s.scale;
    _setTransform(s);
  }

  function _fitAll(s) {
    var stageRect = s.stage.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) { return; }
    var sc = Math.min(stageRect.width / s.sceneW,
                      stageRect.height / s.sceneH);
    if (sc < s.minScale) { sc = s.minScale; }
    if (sc > s.maxScale) { sc = s.maxScale; }
    s.scale = sc;
    s.tx = (stageRect.width - s.sceneW * sc) / 2;
    s.ty = (stageRect.height - s.sceneH * sc) / 2;
    _setTransform(s);
  }

  function _fitWidth(s) {
    var stageRect = s.stage.getBoundingClientRect();
    if (stageRect.width === 0) { return; }
    var sc = stageRect.width / s.sceneW;
    if (sc < s.minScale) { sc = s.minScale; }
    if (sc > s.maxScale) { sc = s.maxScale; }
    s.scale = sc;
    s.tx = 0;
    s.ty = (stageRect.height - s.sceneH * sc) / 2;
    if (s.ty > 0) { s.ty = 0; }
    _setTransform(s);
  }

  function _actualSize(s) {
    var stageRect = s.stage.getBoundingClientRect();
    s.scale = 1;
    s.tx = (stageRect.width - s.sceneW) / 2;
    s.ty = (stageRect.height - s.sceneH) / 2;
    _setTransform(s);
  }

  function _wirePan(s) {
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var origTx = 0;
    var origTy = 0;
    function onDown(ev) {
      // Don't start a pan when mousedown lands on a node atom — that's
      // a selection click, not a pan gesture.
      var t = ev.target;
      while (t && t !== s.stage) {
        if (t.getAttribute && t.getAttribute('data-ve-id')) { return; }
        if (t.classList && (t.classList.contains('ve-scene-toolbar')
            || t.classList.contains('ve-scene-minimap')
            || t.classList.contains('ve-scene-tool')
            || t.classList.contains('ve-scene-zoom-slider'))) { return; }
        t = t.parentNode;
      }
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      origTx = s.tx;
      origTy = s.ty;
      s.stage.style.cursor = 'grabbing';
      if (ev.preventDefault) { ev.preventDefault(); }
    }
    function onMove(ev) {
      if (!dragging) { return; }
      s.tx = origTx + (ev.clientX - startX);
      s.ty = origTy + (ev.clientY - startY);
      _setTransform(s);
    }
    function onUp() {
      if (!dragging) { return; }
      dragging = false;
      s.stage.style.cursor = 'grab';
    }
    s.stage.addEventListener('mousedown', onDown);
    var d = s.stage.ownerDocument;
    d.addEventListener('mousemove', onMove);
    d.addEventListener('mouseup', onUp);
    s.stage.style.cursor = 'grab';
  }

  function _wireWheelZoom(s) {
    s.stage.addEventListener('wheel', function (ev) {
      if (ev.preventDefault) { ev.preventDefault(); }
      var rect = s.stage.getBoundingClientRect();
      var cx = ev.clientX - rect.left;
      var cy = ev.clientY - rect.top;
      var factor = ev.deltaY < 0 ? 1.1 : (1 / 1.1);
      _zoomAt(s, factor, cx, cy);
    }, { passive: false });
  }

  function _wireMinimap(s) {
    if (!s.minimap) { return; }
    var dragging = false;
    function move(ev) {
      var rect = s.minimap.getBoundingClientRect();
      var m = _minimapMetrics(s);
      var mx = ev.clientX - rect.left - m.offX;
      var my = ev.clientY - rect.top - m.offY;
      var sceneX = mx / m.scale;
      var sceneY = my / m.scale;
      var stageRect = s.stage.getBoundingClientRect();
      s.tx = stageRect.width / 2 - sceneX * s.scale;
      s.ty = stageRect.height / 2 - sceneY * s.scale;
      _setTransform(s);
    }
    s.minimap.addEventListener('mousedown', function (ev) {
      // Don't pan/select the underlying SVG
      ev.stopPropagation();
      dragging = true;
      move(ev);
      if (ev.preventDefault) { ev.preventDefault(); }
    });
    var d = s.minimap.ownerDocument;
    d.addEventListener('mousemove', function (ev) {
      if (dragging) { move(ev); }
    });
    d.addEventListener('mouseup', function () { dragging = false; });
  }

  function _buildToolbar(s, host) {
    var doc = host.ownerDocument;
    var bar = doc.createElement('div');
    bar.className = 've-scene-toolbar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'diagram viewport controls');

    function btn(label, title, onClick) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 've-scene-tool';
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        onClick();
      });
      return b;
    }

    bar.appendChild(btn('−', 'Zoom out', function () {
      var rect = s.stage.getBoundingClientRect();
      _zoomAt(s, 1 / 1.2, rect.width / 2, rect.height / 2);
    }));

    s.slider = doc.createElement('input');
    s.slider.type = 'range';
    s.slider.min = '0';
    s.slider.max = '100';
    s.slider.value = '50';
    s.slider.className = 've-scene-zoom-slider';
    s.slider.title = 'Zoom';
    s.slider.setAttribute('aria-label', 'Zoom level');
    s.slider.addEventListener('input', function () {
      var v = parseInt(s.slider.value, 10) / 100;
      var newScale = s.minScale + v * (s.maxScale - s.minScale);
      var rect = s.stage.getBoundingClientRect();
      var factor = newScale / s.scale;
      _zoomAt(s, factor, rect.width / 2, rect.height / 2);
    });
    s.slider.addEventListener('mousedown', function (ev) {
      ev.stopPropagation();
    });
    bar.appendChild(s.slider);

    bar.appendChild(btn('+', 'Zoom in', function () {
      var rect = s.stage.getBoundingClientRect();
      _zoomAt(s, 1.2, rect.width / 2, rect.height / 2);
    }));

    s.label = doc.createElement('span');
    s.label.className = 've-scene-zoom-label';
    s.label.textContent = '100%';
    bar.appendChild(s.label);

    bar.appendChild(btn('Fit', 'Fit all', function () { _fitAll(s); }));
    bar.appendChild(btn('1:1', 'Actual size', function () {
      _actualSize(s);
    }));
    bar.appendChild(btn('W', 'Fit width', function () { _fitWidth(s); }));

    s.toolbar = bar;
    return bar;
  }

  function _buildMinimap(s, sourceSvg) {
    var doc = s.stage.ownerDocument;
    var wrap = doc.createElement('div');
    wrap.className = 've-scene-minimap';
    wrap.title = 'Drag to pan';
    var clone = sourceSvg.cloneNode(true);
    var ids = clone.querySelectorAll('[data-ve-id]');
    for (var i = 0; i < ids.length; i++) {
      ids[i].removeAttribute('data-ve-id');
      ids[i].removeAttribute('data-ve-type');
      ids[i].removeAttribute('tabindex');
    }
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.maxWidth = 'none';
    clone.style.pointerEvents = 'none';
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    wrap.appendChild(clone);
    var frame = doc.createElement('div');
    frame.className = 've-scene-minimap-frame';
    wrap.appendChild(frame);
    s.minimap = wrap;
    s.minimapFrame = frame;
    return wrap;
  }

  function _wrapInViewport(hostEl, svg, scene) {
    var raw = hostEl.getAttribute('data-ve-scene-viewport');
    if (!raw) { return; }
    var height = parseInt(raw, 10);
    if (!isFinite(height) || height < 120) { height = 480; }

    var s = _ensureViewportState(hostEl,
      scene.width || 800, scene.height || 600);

    hostEl.classList.add('ve-scene-viewport-on');
    hostEl.style.height = height + 'px';
    hostEl.style.position = 'relative';

    if (svg.parentNode === hostEl) { hostEl.removeChild(svg); }

    // Switch SVG to natural size for transform-based zoom
    svg.style.width = scene.width + 'px';
    svg.style.height = scene.height + 'px';
    svg.style.maxWidth = 'none';
    svg.style.display = 'block';
    svg.setAttribute('width', String(scene.width));
    svg.setAttribute('height', String(scene.height));

    var doc = hostEl.ownerDocument;
    var stage = doc.createElement('div');
    stage.className = 've-scene-stage';
    var canvas = doc.createElement('div');
    canvas.className = 've-scene-canvas';
    canvas.appendChild(svg);
    stage.appendChild(canvas);
    hostEl.appendChild(stage);

    s.stage = stage;
    s.canvas = canvas;
    s.svg = svg;

    hostEl.appendChild(_buildToolbar(s, hostEl));
    hostEl.appendChild(_buildMinimap(s, svg));

    _wirePan(s);
    _wireWheelZoom(s);
    _wireMinimap(s);

    // Defer fit-all to next frame so the stage has a measured size.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () { _fitAll(s); });
    } else {
      setTimeout(function () { _fitAll(s); }, 0);
    }
  }

  // ── Export menu — Copy PNG / Download PNG / SVG / WebP ────────────
  //
  // Idea credit: tt-a1i/archify (MIT) + matheuscfrade/arch-flows-visualizer
  // (MIT). Adapted into a dependency-free in-browser export that runs
  // entirely client-side (no server, no library).
  //
  // PNG / JPEG / WebP: rasterize the SVG to a 4× off-screen canvas via
  //   new Image() with the SVG serialized as a data: URL. canvas.toBlob
  //   triggers the download (or navigator.clipboard.write for "Copy
  //   PNG"). 4× scale gives sharp images for slides + PDFs.
  // SVG: serialize the SVG, embed the CURRENT --vc-* values as a
  //   <style> block with BOTH light and dark variable sets plus a
  //   prefers-color-scheme @media rule, so a downloaded .svg follows
  //   the reader's dark/light preference when embedded in a README.

  var EXPORT_SCALE = 4;

  function _collectVcVars(themeAttr) {
    // Walk :root + [data-ve-theme="<themeAttr>"] to capture both
    // theme variable sets for the exported SVG.
    var out = {};
    if (typeof document === 'undefined' || !document.documentElement) {
      return out;
    }
    var sheets = document.styleSheets;
    for (var si = 0; si < sheets.length; si++) {
      var rules;
      try { rules = sheets[si].cssRules; }
      catch (e) { continue; }   // cross-origin sheet — skip
      if (!rules) { continue; }
      for (var ri = 0; ri < rules.length; ri++) {
        var rule = rules[ri];
        if (!rule || !rule.selectorText || !rule.style) { continue; }
        var matches = false;
        if (themeAttr === 'light') {
          matches = rule.selectorText === ':root'
            || rule.selectorText.indexOf(':root,') === 0
            || rule.selectorText.indexOf(',:root') >= 0
            || rule.selectorText.indexOf('html[data-ve-theme="light"]') >= 0;
        } else {
          matches = rule.selectorText.indexOf(
            'html[data-ve-theme="dark"]') >= 0;
        }
        if (!matches) { continue; }
        for (var pi = 0; pi < rule.style.length; pi++) {
          var prop = rule.style[pi];
          if (prop && prop.indexOf('--vc-') === 0) {
            out[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
      }
    }
    return out;
  }

  function _buildExportStyleBlock() {
    // Light + dark variable blocks + a prefers-color-scheme media
    // query so an exported .svg follows the viewer's preference.
    var light = _collectVcVars('light');
    var dark = _collectVcVars('dark');
    function block(selector, vars) {
      var lines = [selector + ' {'];
      for (var k in vars) {
        if (vars.hasOwnProperty(k)) {
          lines.push('  ' + k + ': ' + vars[k] + ';');
        }
      }
      lines.push('}');
      return lines.join('\n');
    }
    return [
      block(':root', light),
      '@media (prefers-color-scheme: dark) {',
      block(':root', dark),
      '}',
      // honor data-ve-theme override when embedded in a host that uses it
      block('[data-ve-theme="light"]', light),
      block('[data-ve-theme="dark"]', dark)
    ].join('\n');
  }

  function _serializeSvgForExport(svgEl, withThemeStyles) {
    // Clone so we can mutate (add xmlns, inline a <style> block)
    var clone = svgEl.cloneNode(true);
    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', SVG_NS);
    }
    if (!clone.getAttribute('xmlns:xlink')) {
      clone.setAttribute('xmlns:xlink', XLINK_NS);
    }
    if (withThemeStyles) {
      var styleEl = document.createElementNS(SVG_NS, 'style');
      styleEl.textContent = _buildExportStyleBlock();
      clone.insertBefore(styleEl, clone.firstChild);
    }
    var s = new XMLSerializer().serializeToString(clone);
    return s;
  }

  function _svgToImage(svgEl) {
    // Returns Promise<Image>
    return new Promise(function (resolve, reject) {
      var svgText = _serializeSvgForExport(svgEl, true);
      var blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function (e) {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function _rasterizeSvgToCanvas(svgEl, scale) {
    // Returns Promise<HTMLCanvasElement>
    return _svgToImage(svgEl).then(function (img) {
      var vb = svgEl.viewBox && svgEl.viewBox.baseVal
        ? svgEl.viewBox.baseVal
        : null;
      var w = vb && vb.width
        ? vb.width
        : (parseInt(svgEl.getAttribute('width'), 10) || img.width || 800);
      var h = vb && vb.height
        ? vb.height
        : (parseInt(svgEl.getAttribute('height'), 10) || img.height || 600);
      var canvas = document.createElement('canvas');
      canvas.width = Math.ceil(w * scale);
      canvas.height = Math.ceil(h * scale);
      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    });
  }

  function _exportFilename(hostEl, ext) {
    var id = hostEl.id || hostEl.getAttribute('data-ve-id') || 'diagram';
    // Strip leading hash + chrome-unsafe chars
    var safe = String(id).replace(/^#/, '').replace(/[^a-zA-Z0-9._-]/g, '-');
    return safe + '.' + ext;
  }

  function _downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportSceneAsPng(hostEl, opts) {
    var svgEl = hostEl.querySelector('svg');
    if (!svgEl) { return Promise.reject(new Error('no <svg> to export')); }
    var scale = (opts && opts.scale) || EXPORT_SCALE;
    return _rasterizeSvgToCanvas(svgEl, scale).then(function (canvas) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          _downloadBlob(blob, _exportFilename(hostEl, 'png'));
          resolve();
        }, 'image/png');
      });
    });
  }

  function exportSceneAsWebp(hostEl) {
    var svgEl = hostEl.querySelector('svg');
    if (!svgEl) { return Promise.reject(new Error('no <svg> to export')); }
    return _rasterizeSvgToCanvas(svgEl, EXPORT_SCALE).then(function (canvas) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          _downloadBlob(blob, _exportFilename(hostEl, 'webp'));
          resolve();
        }, 'image/webp', 0.92);
      });
    });
  }

  function exportSceneAsJpeg(hostEl) {
    var svgEl = hostEl.querySelector('svg');
    if (!svgEl) { return Promise.reject(new Error('no <svg> to export')); }
    return _rasterizeSvgToCanvas(svgEl, EXPORT_SCALE).then(function (canvas) {
      // Paint a white background first (JPEG can't be transparent).
      var bgCanvas = document.createElement('canvas');
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      var ctx = bgCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvas, 0, 0);
      return new Promise(function (resolve) {
        bgCanvas.toBlob(function (blob) {
          _downloadBlob(blob, _exportFilename(hostEl, 'jpg'));
          resolve();
        }, 'image/jpeg', 0.92);
      });
    });
  }

  function exportSceneAsSvg(hostEl) {
    var svgEl = hostEl.querySelector('svg');
    if (!svgEl) { return; }
    var text = _serializeSvgForExport(svgEl, true);
    var blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    _downloadBlob(blob, _exportFilename(hostEl, 'svg'));
  }

  function copySceneAsPng(hostEl) {
    var svgEl = hostEl.querySelector('svg');
    if (!svgEl) { return Promise.reject(new Error('no <svg> to copy')); }
    if (typeof ClipboardItem === 'undefined'
        || !navigator.clipboard || !navigator.clipboard.write) {
      return Promise.reject(new Error(
        'ClipboardItem / navigator.clipboard.write not supported'));
    }
    return _rasterizeSvgToCanvas(svgEl, EXPORT_SCALE).then(function (canvas) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          try {
            var ci = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([ci]).then(resolve, reject);
          } catch (e) { reject(e); }
        }, 'image/png');
      });
    });
  }

  function _buildExportMenu(hostEl) {
    var doc = hostEl.ownerDocument;
    var wrap = doc.createElement('div');
    wrap.className = 've-scene-export';
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 've-scene-export-button';
    btn.title = 'Export this diagram';
    btn.setAttribute('aria-label', 'Export diagram');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.textContent = '\u{21E9}';  // ⇩
    var menu = doc.createElement('div');
    menu.className = 've-scene-export-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    function item(label, action) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 've-scene-export-item';
      b.setAttribute('role', 'menuitem');
      b.textContent = label;
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        Promise.resolve(action(hostEl)).then(close, function (e) {
          // Surface failures inline next to the button
          b.textContent = label + ' — failed';
          setTimeout(function () { b.textContent = label; }, 1800);
          // re-throw for the dev console
          console.error('[amvcp-diagram] export failed:', e);
        });
      });
      menu.appendChild(b);
    }
    if (typeof ClipboardItem !== 'undefined'
        && navigator.clipboard && navigator.clipboard.write) {
      item('Copy PNG to clipboard', copySceneAsPng);
    }
    item('Download PNG (4×)', exportSceneAsPng);
    item('Download JPEG (4×)', exportSceneAsJpeg);
    item('Download WebP (4×)', exportSceneAsWebp);
    item('Download SVG (vector, dual-theme)', exportSceneAsSvg);
    function open() {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      doc.addEventListener('click', onDocClick, true);
    }
    function close() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      doc.removeEventListener('click', onDocClick, true);
    }
    function onDocClick(ev) {
      if (wrap.contains(ev.target)) { return; }
      close();
    }
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (menu.hidden) { open(); } else { close(); }
    });
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  // _attachExportMenu — append ONE .ve-scene-export wrap to a host. Idempotent
  // by DOM existence check (NOT by an expando flag), because renderSceneGraph
  // wipes hostEl.textContent on every render — an expando flag would survive
  // the wipe and short-circuit re-attach, leaving the host menu-less. Checking
  // for the actual child element matches reality after a re-render.
  function _attachExportMenu(hostEl) {
    if (!hostEl) { return; }
    if (hostEl.querySelector(':scope > .ve-scene-export')) { return; }
    var menu = _buildExportMenu(hostEl);
    hostEl.appendChild(menu);
  }

  // jsonText — re-read the host's embedded JSON text (the pristine
  // source, before any in-place mutation).
  function jsonText(hostEl) {
    var jsonEl = hostEl.querySelector('script[type="application/json"]');
    return jsonEl ? jsonEl.textContent : '';
  }

  // reRenderScene — re-render a host from its stored pristine JSON. Used
  // by the theme hot-swap path. The <script type="application/json"> is
  // preserved across renders (renderSceneGraph only clears non-script
  // children would be ideal, but it clears everything — so we re-inject
  // the script element before re-rendering).
  function reRenderScene(hostEl) {
    var pristine = hostEl.__vcSceneJSON;
    if (!pristine) { return; }
    hostEl.textContent = '';
    var s = document.createElement('script');
    s.setAttribute('type', 'application/json');
    s.textContent = pristine;
    hostEl.appendChild(s);
    renderSceneGraph(hostEl);
  }

  // ── ASCII diagrams — §8 ─────────────────────────────────────────────
  //
  // The runtime side is just CSS (injected below). styleAsciiDiagrams
  // gives every .ve-ascii-diagram a single optional data-ve-id so the
  // whole <pre> can be selected/commented as ONE unit — it is NOT broken
  // into per-glyph atoms (that would be meaningless). The <pre> is
  // overflow:visible so wide ASCII art extends the document.
  var _asciiCounter = 0;
  function styleAsciiDiagrams(root) {
    var d = root || document;
    var pres = d.querySelectorAll('.ve-ascii-diagram');
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      // Assign one selection id if the author opted in via
      // data-ve-ascii-selectable and did not already set an id.
      if (pre.getAttribute('data-ve-ascii-selectable') === '1'
          && !pre.getAttribute('data-ve-id')) {
        pre.setAttribute('data-ve-id',
          've-ascii-' + (++_asciiCounter));
        pre.setAttribute('data-ve-type', 'ascii-diagram');
      }
    }
  }

  // ── injected CSS — §12.4 ────────────────────────────────────────────
  //
  // A small themed block. Every color is a `--vc-*` token with a
  // hardcoded fallback so the module is correct standalone AND re-themes
  // on a DESIGN.md swap. The selection hover/selected rules mirror the
  // runtime's `svg g[data-ve-id]` language so the fixture works even
  // when amvcp-runtime.js is not loaded (fully defensive — spec §1).
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — diagram skill (injected) */',

    /* every scene-graph host is a positioning context so the absolutely-
       positioned export-menu wrap anchors to the host instead of escaping
       to the document. Applies to both basic and viewport modes. */
    '.ve-scene-graph,',
    '[data-ve-scene-graph] {',
    '  position: relative;',
    '}',

    /* scene-graph host — default mode: wide diagrams extend the
       document; the SVG is width:100% so there is NEVER an inner
       scrollbar. Viewport mode (opt-in) overrides this — see below. */
    '.ve-scene-graph:not([data-ve-scene-viewport]) {',
    '  display: block;',
    '  overflow: visible;',
    '  max-width: none;',
    '}',
    '.ve-scene-graph:not([data-ve-scene-viewport]) svg {',
    '  width: 100%;',
    '  height: auto;',
    '  max-width: none;',
    '  overflow: visible;',
    '}',

    /* viewport mode (opt-in via data-ve-scene-viewport="<height>") —
       a fixed-height pannable/zoomable surface with toolbar + mini-map.
       This is the "true application surface" exception to the
       no-nested-scrollbars rule (~/.claude/rules/no-nested-scrollbars.md):
       diagrams are map-like, not flowing documents. */
    '.ve-scene-graph[data-ve-scene-viewport] {',
    '  position: relative;',
    '  display: block;',
    '  overflow: hidden;',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  margin-block: 16px;',
    '  contain: layout style;',
    '}',
    '.ve-scene-stage {',
    '  position: absolute;',
    '  inset: 0;',
    '  overflow: hidden;',
    '  cursor: grab;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  background-image:',
    '    linear-gradient(',
    '      color-mix(in srgb, var(--vc-color-border, #e3dcc9) 40%,'
      + ' transparent) 1px, transparent 1px),',
    '    linear-gradient(90deg,',
    '      color-mix(in srgb, var(--vc-color-border, #e3dcc9) 40%,'
      + ' transparent) 1px, transparent 1px);',
    '  background-size: 24px 24px;',
    '}',
    '.ve-scene-canvas {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  transform-origin: 0 0;',
    '  will-change: transform;',
    '  pointer-events: auto;',
    '}',
    '.ve-scene-canvas > svg {',
    '  display: block;',
    '  width: auto;',
    '  height: auto;',
    '  max-width: none;',
    '  overflow: visible;',
    '}',

    /* toolbar — top-right strip */
    '.ve-scene-toolbar {',
    '  position: absolute;',
    '  top: 8px;',
    '  right: 8px;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 4px;',
    '  padding: 4px 6px;',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-surface, #ffffff) 92%, transparent);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);',
    '  z-index: 4;',
    '  font: 600 12px/1 var(--vc-font-body, ui-sans-serif,'
      + ' system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.ve-scene-tool {',
    '  -webkit-appearance: none;',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 1px solid transparent;',
    '  color: inherit;',
    '  cursor: pointer;',
    '  font: inherit;',
    '  padding: 4px 8px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  min-width: 26px;',
    '  height: 24px;',
    '  line-height: 1;',
    '}',
    '.ve-scene-tool:hover {',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 14%, transparent);',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-scene-tool:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 1px;',
    '}',
    '.ve-scene-zoom-slider {',
    '  width: 84px;',
    '  margin: 0 4px;',
    '  accent-color: var(--vc-color-accent, #b8861f);',
    '  height: 16px;',
    '}',
    '.ve-scene-zoom-label {',
    '  min-width: 38px;',
    '  text-align: right;',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  font-variant-numeric: tabular-nums;',
    '}',

    /* mini-map — bottom-right */
    '.ve-scene-minimap {',
    '  position: absolute;',
    '  bottom: 8px;',
    '  right: 8px;',
    '  width: ' + (MINIMAP_W + MINIMAP_PAD * 2) + 'px;',
    '  height: ' + (MINIMAP_H + MINIMAP_PAD * 2) + 'px;',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-surface, #ffffff) 92%, transparent);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);',
    '  cursor: crosshair;',
    '  overflow: hidden;',
    '  z-index: 3;',
    '  padding: ' + MINIMAP_PAD + 'px;',
    '}',
    '.ve-scene-minimap > svg {',
    '  display: block;',
    '  pointer-events: none;',
    '}',
    '.ve-scene-minimap-frame {',
    '  position: absolute;',
    '  border: 2px solid var(--vc-color-accent, #b8861f);',
    '  background: color-mix(in srgb,'
      + ' var(--vc-color-accent, #b8861f) 12%, transparent);',
    '  pointer-events: none;',
    '  border-radius: 2px;',
    '}',

    /* In viewport mode, the comment-handle would be clipped at left:-40px
       (host has overflow:hidden). Re-position it inside the viewport at
       the left edge, above the toolbar/minimap stack. */
    '.ve-scene-graph[data-ve-scene-viewport] > .ve-comment-handle {',
    '  left: 8px;',
    '  z-index: 5;',
    '}',

    '@media (prefers-reduced-motion: reduce) {',
    '  .ve-scene-canvas { will-change: auto; }',
    '}',

    /* selection — every node/edge <g data-ve-id> lights up on hover and
       when selected. Mirrors amvcp-runtime.js so a standalone page
       (no runtime) still shows the affordance. */
    '.ve-scene-graph g[data-ve-id] { cursor: pointer; }',
    '.ve-scene-graph g[data-ve-id] > rect,',
    '.ve-scene-graph g[data-ve-id] > circle,',
    '.ve-scene-graph g[data-ve-id] > polygon,',
    '.ve-scene-graph g[data-ve-id] > path,',
    '.ve-scene-graph g[data-ve-id] > polyline {',
    '  transition: filter 120ms ease;',
    '}',
    '.ve-scene-graph g[data-ve-id]:hover > rect,',
    '.ve-scene-graph g[data-ve-id]:hover > circle,',
    '.ve-scene-graph g[data-ve-id]:hover > polygon,',
    '.ve-scene-graph g[data-ve-id]:hover > path,',
    '.ve-scene-graph g[data-ve-id]:hover > polyline {',
    '  filter: brightness(var(--ve-brightness-hover, 1.08))',
    '          drop-shadow(0 0 4px var(--ve-accent,',
    '            var(--vc-color-accent, #b8861f)));',
    '}',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"] > rect,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"] > circle,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"] > polygon,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"] > path,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"] > polyline {',
    '  filter: brightness(var(--ve-brightness-selected, 1.04));',
    '  stroke-width: ' + STROKE_SELECTED + ';',
    '}',
    /* Phase 2.5 — keyboard focus parity with hover. Without an explicit
       :focus-visible rule the keyboard user has no feedback on which
       atom is focused (the runtime suppresses default outlines on SVG
       atoms — see scripts/amvcp-runtime.js line 642). */
    '.ve-scene-graph g[data-ve-id]:focus-visible > rect,',
    '.ve-scene-graph g[data-ve-id]:focus-visible > circle,',
    '.ve-scene-graph g[data-ve-id]:focus-visible > polygon,',
    '.ve-scene-graph g[data-ve-id]:focus-visible > path,',
    '.ve-scene-graph g[data-ve-id]:focus-visible > polyline {',
    '  filter: brightness(var(--ve-brightness-hover, 1.08))',
    '          drop-shadow(0 0 4px var(--ve-accent,',
    '            var(--vc-color-accent, #b8861f)));',
    '}',
    /* Hover-on-selected: keep the boost AND the glow. */
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"]:hover > rect,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"]:hover > circle,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"]:hover > polygon,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"]:hover > path,',
    '.ve-scene-graph g[data-ve-id][data-ve-selected="1"]:hover > polyline {',
    '  filter: brightness(var(--ve-brightness-hover, 1.12))',
    '          drop-shadow(0 0 4px var(--ve-accent,',
    '            var(--vc-color-accent, #b8861f)));',
    '}',
    /* Phase 2.5 — outer ring on the .ve-scene-graph host when ANY atom
       inside is selected. Mirrors the runtime ul/ol/section ring. */
    '.ve-scene-graph { position: relative; }',
    '.ve-scene-graph:has([data-ve-selected="1"]) {',
    '  outline: 2px solid var(--ve-accent,',
    '            var(--vc-color-accent, #b8861f));',
    '  outline-offset: 4px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '}',
    /* The single per-scene comment-handle injected by the observer. */
    '.ve-scene-graph > .ve-comment-handle {',
    '  position: absolute; left: -40px;',
    '  width: 28px; height: 22px;',
    '  display: inline-flex; align-items: center; justify-content: center;',
    '  background: var(--ve-accent,',
    '            var(--vc-color-accent, #b8861f));',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  border: 0; border-radius: 6px; padding: 0;',
    '  font: 600 13px/1 ui-sans-serif, system-ui, sans-serif;',
    '  cursor: pointer;',
    '  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);',
    '  transform: translateY(-50%);',
    '  z-index: 2;',
    '}',
    '.ve-scene-graph > .ve-comment-handle:hover { filter: brightness(1.08); }',

    /* phase-graph chain highlight — when a chain is active, dim every
       node/edge NOT in the chain and brighten the chain. */
    '.ve-scene-graph svg[data-vc-chain-active="1"]'
      + ' g[data-ve-id]:not([data-ve-chain="1"]) {',
    '  opacity: 0.25;',
    '  transition: opacity 160ms ease;',
    '}',
    '.ve-scene-graph svg[data-vc-chain-active="1"]'
      + ' g[data-ve-chain="1"] {',
    '  opacity: 1;',
    '  transition: opacity 160ms ease;',
    '}',

    /* ASCII diagram — themed monospace <pre>. overflow:visible is the
       hard no-nested-scrollbars invariant: wide ASCII extends the page. */
    '.ve-ascii-diagram {',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-size: var(--vc-text-1, 14px);',
    '  line-height: 1.35;',
    '  color: var(--vc-color-content, #1f1a14);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  padding: 16px 18px;',
    '  margin-block: 16px;',
    '  white-space: pre;',
    '  overflow: visible;',
    '  max-width: none;',
    '}',
    '.ve-ascii-diagram[data-ve-id] { cursor: pointer; }',
    '.ve-ascii-diagram[data-ve-id]:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-ascii-diagram[data-ve-id][data-ve-selected="1"] {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  box-shadow: 0 0 0 1px var(--vc-color-accent, #b8861f);',
    '}',

    /* reduced-motion — kill SMIL-equivalent CSS transitions; the SVG
       SMIL <animate> elements are themselves gated in JS (applyEdge-
       Animation early-returns under REDUCED). */
    '@media (prefers-reduced-motion: reduce) {',
    '  .ve-scene-graph g[data-ve-id] > rect,',
    '  .ve-scene-graph g[data-ve-id] > circle,',
    '  .ve-scene-graph g[data-ve-id] > polygon,',
    '  .ve-scene-graph g[data-ve-id] > path,',
    '  .ve-scene-graph g[data-ve-id] > polyline {',
    '    transition: none;',
    '  }',
    '}',

    /* export menu — PNG/JPEG/WebP/SVG download + Copy-PNG.
       Anchored top-right of the .ve-scene-graph host (which is
       position:relative — see top of this stylesheet). The button is
       semi-transparent until hovered so it never competes visually with
       the diagram content. Tokens are --vc-* with hardcoded fallbacks
       so the menu is correct standalone AND re-themes on a DESIGN.md
       swap. The menu uses [hidden] for show/hide (browser default
       display:none); we still re-state it so a stylesheet override that
       resets display:block on [hidden] won't reveal the menu. */
    '.ve-scene-export {',
    '  position: absolute;',
    '  top: 8px;',
    '  right: 8px;',
    '  z-index: 5;',
    '  font: 13px/1 var(--vc-font-body, system-ui, sans-serif);',
    '}',
    '.ve-scene-export-button {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 28px;',
    '  height: 28px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  cursor: pointer;',
    '  font: 14px/1 var(--vc-font-body, system-ui, sans-serif);',
    '  padding: 0;',
    '  opacity: 0.75;',
    '  transition: opacity 120ms ease, border-color 120ms ease,',
    '              background 120ms ease;',
    '}',
    '.ve-scene-export-button:hover,',
    '.ve-scene-export-button:focus-visible,',
    '.ve-scene-export-button[aria-expanded="true"] {',
    '  opacity: 1;',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '  outline: none;',
    '}',
    '.ve-scene-export-menu {',
    '  position: absolute;',
    '  top: 34px;',
    '  right: 0;',
    '  min-width: 220px;',
    '  background: var(--vc-color-surface-raised,',
    '    var(--vc-color-surface, #fffdf8));',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);',
    '  padding: 4px;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 2px;',
    '}',
    '.ve-scene-export-menu[hidden] { display: none; }',
    '.ve-scene-export-item {',
    '  background: transparent;',
    '  border: 0;',
    '  text-align: left;',
    '  padding: 6px 10px;',
    '  border-radius: 3px;',
    '  font: 13px/1.2 var(--vc-font-body, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  cursor: pointer;',
    '}',
    '.ve-scene-export-item:hover,',
    '.ve-scene-export-item:focus-visible {',
    '  background: color-mix(in srgb,',
    '    var(--vc-color-accent, #b8861f) 14%, transparent);',
    '  outline: none;',
    '}',
    ''
  ];
  var CSS_TEXT = CSS_LINES.join('\n');

  // injectDiagramCSS — append the skill <style> once (idempotent).
  function injectDiagramCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById && d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS_TEXT;
    d.head.appendChild(style);
  }

  // ── theme hot-swap — §6.3 ───────────────────────────────────────────
  //
  // The DESIGN.md engine fires a theme-change event when a DESIGN.md is
  // hot-swapped. Most scene-graph fills are `var(--vc-*)` so they
  // re-theme for free; reRenderScene is the fallback for anything baked.
  // The event name is the spec's documented `vc:themechange`; the
  // legacy `themechange` is also bound for safety.
  function reThemeAll(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    var hosts = d.querySelectorAll(
      '.ve-scene-graph, [data-ve-scene-graph]');
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i].__vcSceneJSON) { reRenderScene(hosts[i]); }
    }
  }

  function _bindThemeChange() {
    if (typeof document === 'undefined') { return; }
    function onThemeChange() { reThemeAll(document); }
    document.addEventListener('vc:themechange', onThemeChange);
    document.addEventListener('themechange', onThemeChange);
  }

  // ── init / refresh ──────────────────────────────────────────────────

  // init — render every scene graph and style every ASCII diagram. Safe
  // to call more than once (renderSceneGraph replaces host contents).
  function init(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    var hosts = d.querySelectorAll(
      '.ve-scene-graph, [data-ve-scene-graph]');
    for (var i = 0; i < hosts.length; i++) {
      // DEFECT-B fix: idempotent init. renderSceneGraph wipes ALL
      // children of the host (including the embedded JSON script);
      // a SECOND init() call would then find no script and fail-fast
      // with red error text — wiping the SVG that the FIRST call
      // rendered. The diagram is initialised TWICE on every page that
      // loads the runtime: by the module's own DOMContentLoaded
      // self-init AND by the runtime's bootEverything pass. We detect
      // a previously-rendered host via the __vcSceneJSON marker that
      // renderSceneGraph stashes on first render, and route through
      // reRenderScene (which re-injects the JSON script before
      // calling renderSceneGraph again).
      if (hosts[i].__vcSceneJSON) {
        reRenderScene(hosts[i]);
      } else {
        renderSceneGraph(hosts[i]);
      }
    }
    styleAsciiDiagrams(d);
  }

  // refresh — re-scan after a dynamic DOM insertion (or a reduced-motion
  // toggle). Re-renders every scene from its pristine stored JSON so the
  // new motion preference is applied; renders any host not yet rendered.
  function refresh(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    var hosts = d.querySelectorAll(
      '.ve-scene-graph, [data-ve-scene-graph]');
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i].__vcSceneJSON) {
        reRenderScene(hosts[i]);
      } else {
        renderSceneGraph(hosts[i]);
      }
    }
    styleAsciiDiagrams(d);
  }

  // ── Public API + dual export ────────────────────────────────────────

  var _api = {
    injectDiagramCSS: injectDiagramCSS,
    init: init,
    renderSceneGraph: renderSceneGraph,
    validateScene: validateScene,
    autoPlace: autoPlace,
    buildMermaidThemeVariables: buildMermaidThemeVariables,
    deriveSecondary: deriveSecondary,
    getThemePreset: getThemePreset,
    reThemeAll: reThemeAll,
    refresh: refresh,
    // Export menu — programmatic access for callers that want to wire
    // their own UI instead of the built-in dropdown.
    exportSceneAsPng: exportSceneAsPng,
    exportSceneAsJpeg: exportSceneAsJpeg,
    exportSceneAsWebp: exportSceneAsWebp,
    exportSceneAsSvg: exportSceneAsSvg,
    copySceneAsPng: copySceneAsPng,
    attachExportMenu: _attachExportMenu,
    // Exposed for the dev-browser test (mirrors the animation module).
    _cssText: CSS_TEXT
  };

  // Live OS-preference watch (no-op under Node — _mql stays null).
  _watchReducedMotion();

  // Browser global + self-init.
  if (typeof window !== 'undefined') {
    window.amvcpDiagram = _api;
    // Test hook — exposes state + re-init handles so the dev-browser
    // suite can drive the module deterministically.
    window.__vcDiagram = {
      get state() {
        return {
          reduced: REDUCED,
          sceneCount: _sceneCounter,
          cssInjected: !!(document.getElementById
            && document.getElementById(STYLE_ID))
        };
      },
      get REDUCED() { return REDUCED; },
      set REDUCED(v) { REDUCED = !!v; },
      init: init,
      refresh: refresh,
      reThemeAll: reThemeAll,
      injectDiagramCSS: injectDiagramCSS,
      renderSceneGraph: renderSceneGraph,
      validateScene: validateScene,
      buildMermaidThemeVariables: buildMermaidThemeVariables,
      // Export-menu hooks for the dev-browser screenshot/clipboard tests.
      attachExportMenu: _attachExportMenu,
      exportSceneAsPng: exportSceneAsPng,
      exportSceneAsJpeg: exportSceneAsJpeg,
      exportSceneAsWebp: exportSceneAsWebp,
      exportSceneAsSvg: exportSceneAsSvg,
      copySceneAsPng: copySceneAsPng
    };

    _bindThemeChange();

    // Self-init on DOMContentLoaded UNLESS the host opted out via
    // window.__vcDiagramManualInit (the runtime sets this so it controls
    // the engine -> tokens -> diagram-CSS -> diagram-init ordering; the
    // test fixture sets it too for deterministic control).
    if (!window.__vcDiagramManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          injectDiagramCSS(document);
          init(document);
        });
      } else {
        injectDiagramCSS(document);
        init(document);
      }
    }
  }

  // Node export — for the test harness / sanity checks.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
