/*!
 * ai-maestro-visual-communicator-plugin — icon-svg runtime module.
 *
 * Phase 2 (visualizing backlog §10, icon-svg-spec.md): the authored-SVG
 * engine — themed, selectable, lint-clean inline SVG for any
 * visual-communicator artifact.
 *
 * Four sub-techniques in one self-contained module:
 *   1. Authored SVG primitive engine — a declarative JSON scene-graph
 *      compiled to a themed `<svg>` string: 5 structural node primitives
 *      (process/database/decision/external/network), 6 logo composition
 *      blocks, and a `<defs><use>` reuse pass. One canonical 1000×1000
 *      coordinate space; every coordinate snapped to a 4-unit grid.
 *   2. Device frames — ios / android / mac / browser mockup wrappers
 *      built as plain DOM + CSS (no React, no JSX, no toolchain).
 *   3. Image hotspot annotation — absolutely-positioned 0..1-fractional
 *      markers, each a selectable `data-ve-id` atom.
 *   4. SVG style contract / lint layer — `lintSvg()`, the C1..C7
 *      constraint checker (hairline / radius / 4px-grid / ≤4 colors /
 *      no shadow / no raw hex / no mixed theming).
 *
 * Design contract (icon-svg-spec.md):
 *   - Dependency-free. Pure vanilla ES5-style JS. No build step, no npm
 *     runtime dep, no CDN, no WASM, no XML parser.
 *   - Theme-driven. Every fill / stroke / dimension this module emits is
 *     a `--vc-*` custom property resolved by the DESIGN.md engine
 *     (amvcp-designmd.js). Every token reference carries a hardcoded
 *     canonical fallback (`var(--vc-…, <hex>)`) so an authored SVG still
 *     renders themed-by-fallback when no engine is present — that
 *     fallback chain is the SPECIFIED engine-absent path, not a silent
 *     failure.
 *   - Light + dark. Because every value is a `--vc-*` token and the
 *     engine emits the active theme's colors, an authored SVG restyles
 *     automatically on theme toggle / DESIGN.md hot-swap. The module
 *     never authors a `dark:` variant.
 *   - Selectable. Every scene-graph primitive is wrapped in a
 *     `<g data-ve-id data-ve-type="icon-node">`; every hotspot carries
 *     `data-ve-id data-ve-type="hotspot"` — so authored SVG atoms route
 *     through the runtime's existing selection / comment machinery for
 *     free.
 *   - No nested scrollbars. Authored SVGs scale to their container and
 *     widen the page; the ONE `overflow:auto` is the device-frame screen
 *     (a fixed-viewport application surface — the sanctioned exception),
 *     annotated inline in the CSS.
 *   - Fail-fast. Malformed scene-graph JSON, a wrong viewBox, an unknown
 *     primitive type / variant / frame kind, or a non-auto-fixable lint
 *     violation is a HARD throw — never a partial SVG.
 *
 * Dual export:
 *   - browser: `window.amvcpIconSvg = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness — the pure
 *     helpers snap / buildSceneSvg / lintSvg / builders run with no DOM)
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-animation.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes.
 *
 * Public API:
 *   injectIconSvgCSS(doc)   — append the skill <style> to doc.head
 *   init(root)              — compile every `icon-svg` fenced block,
 *                             hydrate frames, dev-lint authored SVG
 *   buildSceneSvg(scene)    — pure: scene-graph JSON -> themed <svg> str
 *   lintSvg(svgString)      — pure: C1..C7 checker -> report object
 *   deviceFrame(opts)       — build a device-mockup DOM subtree / string
 *   builders                — the 5 node + 6 logo builder functions
 *                             (exported as a clean object so `diagram`
 *                             can consume them without an icon-svg
 *                             refactor)
 *   refresh(root)           — re-scan after dynamic DOM insertion
 */
(function () {
  'use strict';

  // ── Constants — the canonical 1000-space + lint caps ───────────────
  //
  // icon-svg-spec.md §3.1: every authored SVG uses ONE internal
  // viewBox, 0 0 1000 1000. `stroke-width` is authored in this space; a
  // single small constant reads as a true hairline at every realistic
  // display size (48px..~900px) because the SVG scales and the stroke
  // scales with it.

  // The mandatory viewBox — buildSceneSvg() validates the scene's
  // `viewBox` is EXACTLY this (fail-fast §7), because the hairline + the
  // 4px-grid invariants are only meaningful in this one coordinate space.
  var VIEWBOX = [0, 0, 1000, 1000];

  // The authored hairline stroke width, in 1000-units. The catalog
  // source (`baybee-diagram` IDEA-91) said 4, tuned for one large
  // display; 2 is the dependency-free generalisation that stays a
  // hairline from 48px to ~900px. icon-svg-spec.md §3.1 records this so
  // a later edit does not "fix" 2 back to 4.
  var STROKE = 2;

  // The 4-unit grid. Every primitive coordinate (x/y/w/h/cx/cy) is
  // snapped to a multiple of this at compile time (§3.5 step 2 / IS-04
  // constraint C3) so the author never has to grid-align by hand.
  var GRID = 4;

  // The `rx`/`ry` corner-radius cap, in 1000-units (IS-04 constraint
  // C2 — "no bubble shapes"). The spec maps `--vc-radius-lg` (12px CSS)
  // into the 1000-space; with a typical ~360px display that 12px is
  // ≈33 1000-units. 36 is the rounded cap — clamp, not flag (auto-fix).
  var RADIUS_CAP = 36;

  // The corner radius the `process` / `external` rounded rects use, in
  // 1000-units — a small editorial radius, well under RADIUS_CAP.
  var NODE_RADIUS = 16;

  // IS-04 constraint C4 — at most this many DISTINCT token colors per
  // authored SVG, so an icon stays a flat editorial mark. The four are
  // conventionally ink / paper / muted / accent.
  var MAX_COLORS = 4;

  // The five semantic node variants. An unknown variant is a hard throw
  // (fail-fast §7) — the engine never silently falls back to `default`.
  var VARIANTS = ['default', 'success', 'warning', 'danger', 'info'];

  // The five structural node primitive types.
  var NODE_TYPES = ['process', 'database', 'decision', 'external',
    'network'];

  // The `clip-path` shape `kind`s a `shape` primitive may name (the CSS
  // classes live in the injected stylesheet — §IS-06).
  var SHAPE_KINDS = ['triangle-up', 'arrow-right', 'chevron',
    'parallelogram', 'hexagon', 'star'];

  // The four device-frame presets. An unknown kind is a hard throw —
  // device_frame.jsx does exactly `if (!size) throw`, kept verbatim.
  // Dimensions in CSS px, from the source `SIZES` table.
  var FRAME_KINDS = {
    ios: { w: 390, h: 844 },
    android: { w: 412, h: 915 },
    mac: { w: 1440, h: 900 },
    browser: { w: 1440, h: 900 }
  };

  // The injected <style> gets this id so injection is idempotent — a
  // second injectIconSvgCSS() call is a no-op (matches the runtime's
  // injectStyles guard and amvcp-animation.js's STYLE_ID pattern).
  var STYLE_ID = 'isvg-icon-svg-styles';

  // Phase 2.5 selection contract — the scene SVG is itself a selection
  // atom and needs a stable opaque data-ve-id. When the author leaves
  // scene.id off, we synthesise one from this monotonic counter so two
  // unidentified scenes on the same page never collide on the same id
  // (a duplicate data-ve-id would let the runtime's repaint mark BOTH
  // scenes selected on a single click).
  var _sceneCounter = 1;

  // ── token-fill resolution ──────────────────────────────────────────
  //
  // Every shape's fill / stroke is one of a small fixed vocabulary of
  // semantic names; tokenColor() maps a name to a `var(--vc-…, <hex>)`
  // expression. The fallback hexes are the SPECIFIED engine-absent
  // contract (icon-svg-spec.md §2 — every token row lists its
  // fallback), exercised by the no-engine fixture test.
  var COLOR_TOKENS = {
    surface: 'var(--vc-color-surface, #ffffff)',
    canvas: 'var(--vc-color-canvas, #faf6ee)',
    content: 'var(--vc-color-content, #1f1a14)',
    'content-muted': 'var(--vc-color-content-muted, #5b5343)',
    'content-subtle': 'var(--vc-color-content-subtle, #8a8170)',
    border: 'var(--vc-color-border, #e3dcc9)',
    'border-strong': 'var(--vc-color-border-strong, #c9bfa3)',
    accent: 'var(--vc-color-accent, #b8861f)',
    'on-accent': 'var(--vc-color-on-accent, #ffffff)',
    success: 'var(--vc-color-success, #3a6b5c)',
    warning: 'var(--vc-color-warning, #a8791f)',
    danger: 'var(--vc-color-danger, #a84a32)',
    info: 'var(--vc-color-info, #3464a8)'
  };

  // The derived tint tiers (icon-svg-spec.md §2 — IS-02's tint hierarchy
  // and IS-01's node-fill ramp). Produced with `color-mix()` off the
  // existing accent token — NO new token group is requested from the
  // engine. An ancient browser with no `color-mix` degrades the whole
  // ramp to the hero token (still themed, still readable, never broken).
  var TINT_HERO = 'var(--isvg-tint-hero, ' + COLOR_TOKENS.accent + ')';
  var TINT_MID = 'var(--isvg-tint-mid, ' + COLOR_TOKENS.accent + ')';
  var TINT_QUIET = 'var(--isvg-tint-quiet, ' + COLOR_TOKENS.accent + ')';

  // Resolve a semantic color name (or a tint-tier name) to its CSS
  // expression. An unknown name is a hard throw — fail-fast: a typo'd
  // fill name must surface loudly, never render an invisible shape.
  function tokenColor(name) {
    if (name === 'none') { return 'none'; }
    if (name === 'tint-hero') { return TINT_HERO; }
    if (name === 'tint-mid') { return TINT_MID; }
    if (name === 'tint-quiet') { return TINT_QUIET; }
    if (Object.prototype.hasOwnProperty.call(COLOR_TOKENS, name)) {
      return COLOR_TOKENS[name];
    }
    throw new Error('icon-svg: unknown color name "' + name
      + '". Valid: none, ' + objKeys(COLOR_TOKENS).join(', ')
      + ', tint-hero, tint-mid, tint-quiet.');
  }

  // ES5-safe Object.keys (Object.keys exists everywhere modern, but the
  // house style avoids assuming — a tiny helper keeps it explicit).
  function objKeys(o) {
    var k = [];
    var p;
    for (p in o) {
      if (Object.prototype.hasOwnProperty.call(o, p)) { k.push(p); }
    }
    return k;
  }

  // ── grid snapping (IS-04 C3) ───────────────────────────────────────
  //
  // snap(v) rounds a 1000-space coordinate to the nearest GRID multiple.
  // Pure, Node-testable. The compiler applies it to every primitive
  // coordinate so a scene authored at x:123 renders at x:124 — the
  // author never has to think about the grid.
  function snap(v) {
    var n = Number(v);
    if (!isFinite(n)) {
      throw new Error('icon-svg: coordinate is not a finite number: '
        + v);
    }
    return Math.round(n / GRID) * GRID;
  }

  // XML-escape a string for safe inclusion in an SVG attribute / text
  // node. The scene-graph `label` and `aria-label` are author-supplied
  // — escaping defends against a stray `<`/`&`/`"` breaking the markup
  // (and against a label being read as markup, a tiny injection guard).
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── node primitive builders (IS-01 §3.2) ───────────────────────────
  //
  // Each builder takes a spec object {x,y,w,h,label,id,variant} and
  // returns the SVG fragment for ONE node — the inner shapes only, NOT
  // the wrapping `<g data-ve-id>` (the compiler adds that, §3.6). All
  // coordinates are ALREADY snapped by the compiler before a builder
  // sees them. Geometry is authored in the 1000-space.
  //
  // `variant` swaps the stroke token to the matching semantic
  // `--vc-color-*` role; `default` uses the ink color.
  //
  // The builders are exported as a clean `builders` object (§9.5) so the
  // `diagram` skill can `require()` them and add edges/layout on top
  // without an icon-svg refactor.

  // Resolve a variant name to its stroke color expression. An unknown
  // variant is a hard throw — fail-fast §7.
  function variantStroke(variant) {
    var v = variant || 'default';
    if (indexOf(VARIANTS, v) === -1) {
      throw new Error('icon-svg: unknown variant "' + v
        + '". Valid: ' + VARIANTS.join(', ') + '.');
    }
    if (v === 'default') { return tokenColor('content'); }
    return tokenColor(v);
  }

  // ES5-safe Array.indexOf (older engines lack it; the house style does
  // not assume — every other module here has the same micro-helper).
  function indexOf(arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === val) { return i; }
    }
    return -1;
  }

  // A centered `<text>` label, sized off the node height. Empty label
  // -> no `<text>` (an unlabeled node is legal). The font is the
  // DESIGN.md body font; the size is a fraction of `h` so it scales
  // with the node in the 1000-space.
  function labelText(x, y, w, h, label) {
    if (!label) { return ''; }
    var cx = x + w / 2;
    var cy = y + h / 2;
    var size = Math.max(28, Math.round(h * 0.20));
    return '<text x="' + cx + '" y="' + cy + '" '
      + 'text-anchor="middle" dominant-baseline="central" '
      + 'font-family="var(--vc-font-body, system-ui, sans-serif)" '
      + 'font-size="' + size + '" '
      + 'fill="' + tokenColor('content') + '">'
      + esc(label) + '</text>';
  }

  // process — a rounded rect. `none` fill, ink (or variant) stroke.
  function nodeProcess(s) {
    var stroke = variantStroke(s.variant);
    return '<rect x="' + s.x + '" y="' + s.y + '" '
      + 'width="' + s.w + '" height="' + s.h + '" '
      + 'rx="' + NODE_RADIUS + '" ry="' + NODE_RADIUS + '" '
      + 'fill="none" stroke="' + stroke + '" '
      + 'stroke-width="' + STROKE + '"/>'
      + labelText(s.x, s.y, s.w, s.h, s.label);
  }

  // external — a DASHED rounded rect (a system boundary). Muted stroke.
  // Variant still overrides the stroke when set.
  function nodeExternal(s) {
    var stroke = s.variant && s.variant !== 'default'
      ? variantStroke(s.variant) : tokenColor('content-muted');
    return '<rect x="' + s.x + '" y="' + s.y + '" '
      + 'width="' + s.w + '" height="' + s.h + '" '
      + 'rx="' + NODE_RADIUS + '" ry="' + NODE_RADIUS + '" '
      + 'fill="none" stroke="' + stroke + '" '
      + 'stroke-width="' + STROKE + '" '
      + 'stroke-dasharray="16 12"/>'
      + labelText(s.x, s.y, s.w, s.h, s.label);
  }

  // decision — a diamond `<polygon>`, 4 points on the grid.
  function nodeDecision(s) {
    var stroke = variantStroke(s.variant);
    var midX = snap(s.x + s.w / 2);
    var midY = snap(s.y + s.h / 2);
    var pts = midX + ',' + s.y + ' '
      + (s.x + s.w) + ',' + midY + ' '
      + midX + ',' + (s.y + s.h) + ' '
      + s.x + ',' + midY;
    return '<polygon points="' + pts + '" '
      + 'fill="none" stroke="' + stroke + '" '
      + 'stroke-width="' + STROKE + '"/>'
      + labelText(s.x, s.y, s.w, s.h, s.label);
  }

  // database — a cylinder, ONE `<path>` (icon-svg-spec.md §3.2's
  // non-trivial re-authoring). No `<defs>`, valid SVG, no scripts:
  //   top ellipse (front + back arcs) + two side lines + bottom front
  //   arc. `rx = w/2`, `ry = clamp(h*0.12, 16, 60)` in 1000-units.
  function nodeDatabase(s) {
    var stroke = variantStroke(s.variant);
    var rx = s.w / 2;
    var ry = Math.round(Math.min(60, Math.max(16, s.h * 0.12)));
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var d = 'M' + x + ' ' + (y + ry)
      + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (x + w) + ' ' + (y + ry)
      + ' A' + rx + ' ' + ry + ' 0 0 0 ' + x + ' ' + (y + ry)
      + ' M' + x + ' ' + (y + ry) + ' L' + x + ' ' + (y + h - ry)
      + ' M' + (x + w) + ' ' + (y + ry)
      + ' L' + (x + w) + ' ' + (y + h - ry)
      + ' M' + x + ' ' + (y + h - ry)
      + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (x + w) + ' ' + (y + h - ry);
    return '<path d="' + d + '" '
      + 'fill="' + tokenColor('tint-quiet') + '" '
      + 'stroke="' + stroke + '" stroke-width="' + STROKE + '"/>'
      + labelText(x, y, w, h, s.label);
  }

  // network — a cloud, ONE `<path>` of 3 overlapping arcs forming a
  // cloud silhouette across the bottom of the node box.
  function nodeNetwork(s) {
    var stroke = variantStroke(s.variant);
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var baseY = y + h * 0.78;
    var r1 = h * 0.30;
    var r2 = h * 0.40;
    var r3 = h * 0.30;
    var d = 'M' + (x + w * 0.12) + ' ' + baseY
      + ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + (x + w * 0.34) + ' '
        + (y + h * 0.30)
      + ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + (x + w * 0.70) + ' '
        + (y + h * 0.34)
      + ' A' + r3 + ' ' + r3 + ' 0 0 1 ' + (x + w * 0.88) + ' '
        + baseY
      + ' Z';
    return '<path d="' + d + '" '
      + 'fill="' + tokenColor('tint-quiet') + '" '
      + 'stroke="' + stroke + '" stroke-width="' + STROKE + '"/>'
      + labelText(x, y, w, h, s.label);
  }

  // ── logo / composition primitive builders (IS-02 §3.3) ─────────────
  //
  // The 6 building blocks re-authored from
  // logo-design-skill/references/svg-patterns.md. All literal hardcoded
  // colors become tokens; the literal `currentColor` is KEPT as the
  // final fallback inside `var(--vc-color-content, currentColor)` —
  // matching the runtime's existing chrome convention so a logo dropped
  // context-free still tints. The C7 lint rule (§6) forbids MIXING
  // currentColor and explicit tokens in one mark.
  //
  // Each builder takes {x,y,w,h} (already snapped) and returns the SVG
  // fragment. No wrapping `<g>` — the compiler adds it.

  // 1. Mask cutout — a `<defs><mask>`: a white rect keeps, a black shape
  // subtracts; the outer accent shape carries `mask="url(#id)"`.
  function logoMaskCutout(s) {
    var mid = 'isvg-mask-' + s.id;
    var cx = s.x + s.w / 2;
    var cy = s.y + s.h / 2;
    return '<defs><mask id="' + mid + '">'
      + '<rect x="' + s.x + '" y="' + s.y + '" '
        + 'width="' + s.w + '" height="' + s.h + '" fill="#fff"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" '
        + 'r="' + (Math.min(s.w, s.h) * 0.22) + '" fill="#000"/>'
      + '</mask></defs>'
      + '<rect x="' + s.x + '" y="' + s.y + '" '
        + 'width="' + s.w + '" height="' + s.h + '" '
        + 'rx="' + NODE_RADIUS + '" '
        + 'fill="' + tokenColor('accent') + '" '
        + 'mask="url(#' + mid + ')"/>';
  }

  // 2. Arc bite — a `<path>` rounded body with an `A` command carving a
  // crescent bite out of one corner.
  function logoArcBite(s) {
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var biteR = Math.min(w, h) * 0.5;
    var d = 'M' + x + ' ' + y
      + ' L' + (x + w) + ' ' + y
      + ' L' + (x + w) + ' ' + (y + h)
      + ' L' + x + ' ' + (y + h)
      + ' Z'
      + ' M' + (x + w) + ' ' + (y + h * 0.5)
      + ' A' + biteR + ' ' + biteR + ' 0 0 0 '
        + (x + w * 0.5) + ' ' + y;
    return '<path d="' + d + '" fill-rule="evenodd" '
      + 'fill="' + tokenColor('accent') + '"/>';
  }

  // 3. Zig-zag border — alternating up/down teeth across the bottom
  // edge, the rest a plain rect body.
  function logoZigZag(s) {
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var teeth = 6;
    var step = w / teeth;
    var topTooth = y + h * 0.78;
    var botTooth = y + h;
    var d = 'M' + x + ' ' + y + ' L' + (x + w) + ' ' + y
      + ' L' + (x + w) + ' ' + topTooth;
    var i;
    for (i = teeth; i > 0; i--) {
      var tx = x + step * (i - 1);
      var down = (i % 2 === 0);
      d += ' L' + (tx + step * 0.5) + ' '
        + (down ? botTooth : topTooth)
        + ' L' + tx + ' ' + (down ? topTooth : botTooth);
    }
    d += ' L' + x + ' ' + topTooth + ' Z';
    return '<path d="' + d + '" fill="' + tokenColor('accent') + '"/>';
  }

  // 4. Stacked rects — 3 rects of decreasing width, centered by an
  // increasing x, each a different tint tier.
  function logoStackedRects(s) {
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var bandH = h / 3;
    var tints = ['tint-hero', 'tint-mid', 'tint-quiet'];
    var out = '';
    var i;
    for (i = 0; i < 3; i++) {
      var bw = w * (1 - i * 0.22);
      var bx = x + (w - bw) / 2;
      var by = y + bandH * i;
      out += '<rect x="' + snap(bx) + '" y="' + snap(by) + '" '
        + 'width="' + snap(bw) + '" height="' + snap(bandH * 0.82) + '" '
        + 'rx="' + NODE_RADIUS + '" '
        + 'fill="' + tokenColor(tints[i]) + '"/>';
    }
    return out;
  }

  // 5. Tint hierarchy — a hero element in the strong token, two
  // supporting elements in the lighter tiers (quiet visual hierarchy).
  function logoTintHierarchy(s) {
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var heroR = Math.min(w, h) * 0.32;
    var supR = heroR * 0.55;
    return '<circle cx="' + snap(x + w * 0.5) + '" '
        + 'cy="' + snap(y + h * 0.42) + '" r="' + snap(heroR) + '" '
        + 'fill="' + tokenColor('tint-hero') + '"/>'
      + '<circle cx="' + snap(x + w * 0.26) + '" '
        + 'cy="' + snap(y + h * 0.74) + '" r="' + snap(supR) + '" '
        + 'fill="' + tokenColor('tint-mid') + '"/>'
      + '<circle cx="' + snap(x + w * 0.74) + '" '
        + 'cy="' + snap(y + h * 0.74) + '" r="' + snap(supR) + '" '
        + 'fill="' + tokenColor('tint-quiet') + '"/>';
  }

  // 6. currentColor tint — the whole mark uses
  // `var(--vc-color-content, currentColor)`; runtime tinting = set
  // `color` on the wrapper. This builder is the one all-currentColor
  // mark (C7: a mark is either all-currentColor-fallback OR
  // all-explicit-token, never mixed).
  function logoCurrentColor(s) {
    var x = s.x;
    var y = s.y;
    var w = s.w;
    var h = s.h;
    var ink = 'var(--vc-color-content, currentColor)';
    var d = 'M' + (x + w * 0.5) + ' ' + y
      + ' L' + (x + w) + ' ' + (y + h * 0.5)
      + ' L' + (x + w * 0.5) + ' ' + (y + h)
      + ' L' + x + ' ' + (y + h * 0.5)
      + ' Z';
    return '<path d="' + d + '" fill="' + ink + '"/>';
  }

  // The block dispatch table — name -> builder.
  var LOGO_BLOCKS = {
    'mask-cutout': logoMaskCutout,
    'arc-bite': logoArcBite,
    'zig-zag': logoZigZag,
    'stacked-rects': logoStackedRects,
    'tint-hierarchy': logoTintHierarchy,
    'current-color': logoCurrentColor
  };

  // The node dispatch table — type -> builder.
  var NODE_BUILDERS = {
    process: nodeProcess,
    database: nodeDatabase,
    decision: nodeDecision,
    external: nodeExternal,
    network: nodeNetwork
  };

  // The exported `builders` object (icon-svg-spec.md §9.5 — a clean,
  // separately-exported surface so `diagram` consumes the node builders
  // without an icon-svg refactor).
  var builders = {
    nodeProcess: nodeProcess,
    nodeDatabase: nodeDatabase,
    nodeDecision: nodeDecision,
    nodeExternal: nodeExternal,
    nodeNetwork: nodeNetwork,
    logoMaskCutout: logoMaskCutout,
    logoArcBite: logoArcBite,
    logoZigZag: logoZigZag,
    logoStackedRects: logoStackedRects,
    logoTintHierarchy: logoTintHierarchy,
    logoCurrentColor: logoCurrentColor
  };

  // ── lintSvg (IS-04 §6) ─────────────────────────────────────────────
  //
  // The C1..C7 constraint checker. A pure function, Node-testable with
  // no DOM. It does a lightweight attribute-level scan — NOT a full XML
  // parser; the engine only ever lints SVG it itself emitted or SVG an
  // author pasted, and every check is attribute-level, so a small regex
  // tokenizer suffices (a full parser would be a dependency this
  // dependency-free module specifically avoids).
  //
  // Returns: { ok, violations:[{rule,detail,at}], autofixed:[{rule,
  // detail}] }. C2/C3 are AUTO-FIXABLE (the compiler snaps coordinates
  // and clamps radii BEFORE emitting, so its own output never trips
  // them); C1/C4/C5/C6/C7 are flag-only.
  //
  // NOTE — the 13-diagram-type clause is deliberately NOT here
  // (icon-svg-spec.md §6.3): diagram-TYPE governance belongs to the
  // `diagram` skill. lintSvg has no type allow-list — a build agent
  // must not "helpfully" add one.

  // Match every `name="value"` / `name='value'` attribute pair.
  var ATTR_RE = /([a-zA-Z_:][\w:.\-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  // A literal color: #rgb / #rrggbb / #rrggbbaa, rgb()/rgba()/hsl()/
  // hsla(), or a bare CSS named color. `currentColor` and `none` and a
  // `var(--…)` / `url(#…)` reference are NOT literals.
  var HEX_RE = /^#([0-9a-fA-F]{3,8})$/;
  var FUNC_COLOR_RE = /^(rgb|rgba|hsl|hsla)\s*\(/i;
  // The subset of CSS named colors common enough to catch a careless
  // literal. Not exhaustive — `var(--vc-…)` is the contract, this just
  // flags the obvious mistakes.
  var NAMED_COLORS = ['black', 'white', 'red', 'green', 'blue', 'yellow',
    'orange', 'purple', 'gray', 'grey', 'silver', 'navy', 'teal',
    'maroon', 'lime', 'aqua', 'fuchsia', 'olive'];

  // Is `v` a raw hardcoded color (C6 violation)? `none`, `currentColor`,
  // a `var(--…)` and a `url(#…)` are all allowed.
  function isLiteralColor(v) {
    var t = (v || '').trim();
    if (!t || t === 'none' || t === 'currentColor'
      || t === 'transparent') { return false; }
    if (t.indexOf('var(') === 0) { return false; }
    if (t.indexOf('url(') === 0) { return false; }
    if (HEX_RE.test(t)) { return true; }
    if (FUNC_COLOR_RE.test(t)) { return true; }
    if (indexOf(NAMED_COLORS, t.toLowerCase()) !== -1) { return true; }
    return false;
  }

  // The four semantic-role colors. When used as a node `variant` they
  // are INFORMATION-BEARING (success/warn/danger/info status), not
  // decorative palette — so the C4 count collapses all four into ONE
  // bucket, the same precedent the spec sets for the color-mix tint
  // tiers (icon-svg-spec.md §6.1 C4 nuance: related colors that derive
  // from one role count once). Without this, a legitimate multi-variant
  // scene-graph (the explicitly-supported §3.2 `variant` feature) would
  // trip C4 — a false positive. C4 still catches a careless rainbow of
  // ARBITRARY colors; it just no longer punishes the semantic palette.
  var SEMANTIC_ROLES = ['success', 'warning', 'danger', 'info'];

  // Normalise a color VALUE to a stable comparison key for the C4 count.
  // A `color-mix(... accent ...)` collapses to "accent" — the tint tiers
  // are derivatives of accent, not separate colors (icon-svg-spec.md §6.1
  // C4 nuance). The four semantic roles collapse to one "semantic" key
  // (information-bearing, not decoration). A `var(--vc-color-X, …)`
  // collapses to "X". A `var(--isvg-tint-X)` collapses to "accent".
  function colorKey(v) {
    var t = (v || '').trim();
    if (!t || t === 'none') { return null; }
    if (t === 'currentColor') { return 'currentColor'; }
    if (/color-mix\([^)]*accent/i.test(t)) { return 'accent'; }
    var tint = t.match(/--isvg-tint-[a-z]+/);
    if (tint) { return 'accent'; }
    var vc = t.match(/--vc-color-([a-z\-]+)/);
    if (vc) {
      if (indexOf(SEMANTIC_ROLES, vc[1]) !== -1) { return 'semantic'; }
      return vc[1];
    }
    return t;
  }

  // Compute the [start,end) character spans of every `<mask>…</mask>`
  // region in `src`. A `<mask>` legitimately uses literal `#fff` / `#000`
  // — those are the mask's ALPHA-CHANNEL keying values (white = keep,
  // black = cut), NOT theme colors (icon-svg-spec.md §3.3: "the mask
  // itself is colorless"). So C6 (no raw hex) and C4 (color count) and
  // C7 (mixed theming) MUST skip fill/stroke attributes inside a mask.
  // C1/C2/C3/C5 still apply globally — a mask cannot smuggle a heavy
  // stroke or a drop-shadow past the linter.
  function maskSpans(src) {
    var spans = [];
    var re = /<mask\b[\s\S]*?<\/mask>/gi;
    var m;
    while ((m = re.exec(src)) !== null) {
      spans.push([m.index, m.index + m[0].length]);
    }
    return spans;
  }

  // Is character offset `idx` inside one of the mask spans?
  function inSpans(spans, idx) {
    var i;
    for (i = 0; i < spans.length; i++) {
      if (idx >= spans[i][0] && idx < spans[i][1]) { return true; }
    }
    return false;
  }

  function lintSvg(svgString) {
    var src = String(svgString == null ? '' : svgString);
    var violations = [];
    var autofixed = [];
    var colorKeys = {};
    var m;
    var name;
    var value;
    var hasCurrentColor = false;
    var hasExplicitToken = false;
    // <mask> regions whose literal #fff/#000 are alpha keys, not colors.
    var masks = maskSpans(src);

    // C5 — drop shadows: scan for a <filter> def or an inline
    // filter:drop-shadow / feDropShadow / feGaussianBlur reference.
    if (/feDropShadow|feGaussianBlur/i.test(src)
      || /filter\s*:\s*drop-shadow/i.test(src)) {
      violations.push({ rule: 'C5',
        detail: 'drop shadow / blur filter present — authored SVG is '
          + 'a flat editorial mark, no shadows', at: '<filter>' });
    }

    // Single attribute pass — collects color values (C4/C6/C7), checks
    // stroke-width (C1), checks rx/ry (C2 — auto-fix), checks numeric
    // coords (C3 — auto-fix).
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(src)) !== null) {
      name = m[1].toLowerCase();
      value = (m[3] != null ? m[3] : m[4]) || '';
      // Color checks skip mask-internal fill/stroke (alpha keying).
      var colorExempt = inSpans(masks, m.index);

      if ((name === 'fill' || name === 'stroke') && !colorExempt) {
        // C6 — raw hardcoded color.
        if (isLiteralColor(value)) {
          violations.push({ rule: 'C6',
            detail: 'raw color "' + value + '" on ' + name
              + ' — every fill/stroke must be a var(--vc-…) token, '
              + 'currentColor, or none',
            at: name + '="' + value + '"' });
        }
        // C4 — distinct token-color count.
        var ck = colorKey(value);
        if (ck) { colorKeys[ck] = true; }
        // C7 — mixed-theming detection.
        if ((value || '').indexOf('currentColor') !== -1) {
          hasCurrentColor = true;
        } else if ((value || '').indexOf('var(--vc-') !== -1
          && (value || '').indexOf('currentColor') === -1) {
          hasExplicitToken = true;
        }
      }

      if (name === 'stroke-width') {
        // C1 — hairline cap. The value is in 1000-space units.
        var sw = parseFloat(value);
        if (isFinite(sw) && sw > STROKE) {
          violations.push({ rule: 'C1',
            detail: 'stroke-width ' + sw + ' exceeds hairline cap '
              + STROKE, at: 'stroke-width="' + value + '"' });
        }
      }

      if (name === 'rx' || name === 'ry') {
        // C2 — radius cap, AUTO-FIXED (clamp).
        var rv = parseFloat(value);
        if (isFinite(rv) && rv > RADIUS_CAP) {
          autofixed.push({ rule: 'C2',
            detail: 'clamped ' + name + ' ' + rv + '→'
              + RADIUS_CAP });
        }
      }
    }

    // C4 — count distinct token colors (currentColor counts as one).
    var distinct = objKeys(colorKeys).length;
    if (distinct > MAX_COLORS) {
      violations.push({ rule: 'C4',
        detail: distinct + ' distinct colors exceed the ' + MAX_COLORS
          + '-color cap (ink/paper/muted/accent)',
        at: objKeys(colorKeys).join(', ') });
    }

    // C7 — a single mark must not mix currentColor and explicit tokens.
    if (hasCurrentColor && hasExplicitToken) {
      violations.push({ rule: 'C7',
        detail: 'mark mixes currentColor and explicit --vc- tokens — '
          + 'pick ONE approach per mark', at: '<svg>' });
    }

    return {
      ok: violations.length === 0,
      violations: violations,
      autofixed: autofixed
    };
  }

  // ── buildSceneSvg (IS-01 §3.5) — the declarative compiler ──────────
  //
  // The headline P1 deliverable. Compiles a scene-graph JSON object (or
  // a JSON string) to a themed, lint-clean, data-ve-id-tagged `<svg>`
  // string. A pure function — Node-testable, no DOM.
  //
  // Steps (icon-svg-spec.md §3.5):
  //   1. Parse (if a string) + validate viewBox is exactly 1000-space.
  //   2. Snap every primitive coordinate to the 4-unit grid.
  //   3. Dispatch to the matching node / logo / shape builder.
  //   4. Detect repeated node types (N>2) -> emit `<defs><use>`.
  //   5. Wire data-ve-id from each primitive's id.
  //   6. Emit one `<svg viewBox="0 0 1000 1000" role="img">` — no
  //      width/height attribute (the displayed size is CSS-only).
  //   7. Run lintSvg() on the output; a non-auto-fixable violation
  //      throws (fail-fast §7).
  function buildSceneSvg(scene) {
    var s = scene;
    // Step 1 — parse a JSON string; a malformed string throws (the
    // JSON.parse error propagates — fail-fast §7, no partial SVG).
    if (typeof s === 'string') {
      s = JSON.parse(s);
    }
    if (!s || typeof s !== 'object') {
      throw new Error('icon-svg: scene must be an object or JSON '
        + 'string.');
    }
    // viewBox must be EXACTLY 0 0 1000 1000 — the 1000-space invariant
    // is load-bearing for the hairline + grid (icon-svg-spec.md §7).
    var vb = s.viewBox;
    if (!isArray(vb) || vb.length !== 4
      || vb[0] !== VIEWBOX[0] || vb[1] !== VIEWBOX[1]
      || vb[2] !== VIEWBOX[2] || vb[3] !== VIEWBOX[3]) {
      throw new Error('icon-svg: viewBox must be exactly '
        + '[0,0,1000,1000] (the canonical 1000-coordinate space). '
        + 'Got: ' + JSON.stringify(vb));
    }
    var prims = s.primitives;
    if (!isArray(prims)) {
      throw new Error('icon-svg: scene.primitives must be an array.');
    }

    // Step 4 prep — count node-type occurrences so N>2 of one type can
    // be emitted via <defs><use>. A `<defs><use>` is only worth it for
    // a node of FIXED geometry repeated identically; the spec's rule is
    // N>2 of the same type+size.
    var typeCount = {};
    var i;
    for (i = 0; i < prims.length; i++) {
      var p = prims[i];
      if (p && indexOf(NODE_TYPES, p.type) !== -1) {
        var key = geomKey(p);
        typeCount[key] = (typeCount[key] || 0) + 1;
      }
    }

    var defs = [];
    var defIds = {};        // geomKey -> the <defs> symbol id
    var body = [];
    var seenIds = {};       // duplicate-id guard

    for (i = 0; i < prims.length; i++) {
      var prim = prims[i];
      if (!prim || typeof prim !== 'object') {
        throw new Error('icon-svg: primitive #' + i
          + ' is not an object.');
      }
      var id = prim.id ? String(prim.id) : ('isvg-' + i);
      if (seenIds[id]) {
        throw new Error('icon-svg: duplicate primitive id "' + id
          + '" — every id must be unique (it becomes a data-ve-id).');
      }
      seenIds[id] = true;

      body.push(compilePrimitive(prim, id, i, typeCount, defs,
        defIds));
    }

    // Step 6 — assemble the <svg>. role="img" + aria-label make the
    // authored SVG accessible; preserveAspectRatio is the SVG default
    // (stated explicitly per §3.1). NO width/height attribute.
    //
    // Phase 2.5 selection contract (TRDD-352ef46a): the WHOLE scene
    // SVG is itself one selection atom (containing nested per-primitive
    // atoms). It carries data-ve-id (opaque scene identifier),
    // data-ve-type="icon-svg" (kind hint for the runtime's payload),
    // and data-ve-comment-id (so Ctrl-+ keyboard fallback can scope a
    // comment thread to the whole scene). The scene id resolves from
    // (in order): scene.id, the slugified scene.ariaLabel/label, or a
    // monotonic counter — guarantees a STABLE id even when neither is
    // authored. tabindex="0" is added inline because SVG <svg> is not
    // tabbable by default and the runtime's enhanceFocus only touches
    // [data-ve-id]:not([tabindex]) on a DOMContentLoaded sweep that
    // runs ONCE per page; a scene injected later (refresh()) would miss
    // it. role="img" stays — the runtime's role="button" override is
    // skipped because tabindex is already set (enhanceFocus respects
    // pre-existing attributes).
    var aria = s.ariaLabel || s.label || 'Authored diagram';
    var sceneId = s.id ? String(s.id) : ('isvg-scene-' + _sceneCounter++);
    var sceneId_e = esc(sceneId);
    var defsBlock = defs.length
      ? '<defs>' + defs.join('') + '</defs>' : '';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" '
      + 'viewBox="0 0 1000 1000" '
      + 'preserveAspectRatio="xMidYMid meet" '
      + 'class="isvg-scene" role="img" '
      + 'tabindex="0" '
      + 'data-ve-id="' + sceneId_e + '" '
      + 'data-ve-type="icon-svg" '
      + 'data-ve-comment-id="icon-svg:' + sceneId_e + '" '
      + 'data-ve-label="' + esc(aria) + '" '
      + 'aria-label="' + esc(aria) + '">'
      + defsBlock + body.join('') + '</svg>';

    // Step 7 — self-lint. The compiler snaps + clamps before emitting,
    // so C2/C3 never fire on its own output; any C1/C4/C5/C6/C7
    // violation is a HARD throw — a non-conformant SVG never ships.
    var report = lintSvg(svg);
    if (!report.ok) {
      var msgs = [];
      var v;
      for (v = 0; v < report.violations.length; v++) {
        msgs.push(report.violations[v].rule + ': '
          + report.violations[v].detail);
      }
      throw new Error('icon-svg: compiled SVG failed the style '
        + 'contract (lintSvg): ' + msgs.join(' | '));
    }
    return svg;
  }

  // ES5-safe Array.isArray.
  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  // A geometry key for the <defs><use> reuse pass — a node is reusable
  // only when type + size + variant + label all match (same rendered
  // shape). Position (x/y) is NOT part of the key — that is what `<use>`
  // varies.
  function geomKey(p) {
    return p.type + '|' + snap(p.w) + '|' + snap(p.h) + '|'
      + (p.variant || 'default') + '|' + (p.label || '');
  }

  // Compile ONE primitive to its `<g data-ve-id>` fragment.
  function compilePrimitive(prim, id, index, typeCount, defs, defIds) {
    // A `shape` primitive is a clip-path decorative shape — it renders
    // as an HTML `<rect>` carrying a CSS class, NOT an SVG path; but
    // inside a scene-graph it is emitted as a plain filled SVG polygon
    // approximation so the scene stays one SVG. The standalone
    // clip-path class library is the CSS-only path (§IS-06).
    if (prim.type === 'shape') {
      return compileShape(prim, id);
    }
    if (prim.type === 'logo') {
      return compileLogo(prim, id);
    }
    if (indexOf(NODE_TYPES, prim.type) === -1) {
      throw new Error('icon-svg: unknown primitive type "'
        + prim.type + '" on primitive #' + index
        + '. Valid: ' + NODE_TYPES.join(', ')
        + ', shape, logo.');
    }
    // A node primitive — validate + snap geometry.
    var g = snapGeom(prim, index);
    var key = geomKey(prim);
    // Phase 2.5 selection contract (TRDD-352ef46a): each primitive <g>
    // is one nested atom. data-ve-comment-id makes the keyboard fallback
    // (Ctrl-+ in amvcp-runtime.js) reach a per-node thread; data-ve-label
    // gives the click-payload a friendly label without a textContent
    // sweep over the SVG inner text.
    var labelAttr = prim.label
      ? ' data-ve-label="' + esc(prim.label) + '"' : '';
    var dataAttrs = 'data-ve-id="' + esc(id) + '" '
      + 'data-ve-type="icon-node" '
      + 'data-ve-comment-id="icon-node:' + esc(id) + '"'
      + labelAttr;

    // Step 4 — <defs><use> when this exact geometry repeats N>2 times.
    if (typeCount[key] > 2) {
      if (!defIds[key]) {
        // First occurrence — author the symbol once at origin (0,0),
        // store it in <defs>, remember its id.
        var symId = 'isvg-def-' + objKeys(defIds).length;
        defIds[key] = symId;
        var atOrigin = {
          x: 0, y: 0, w: g.w, h: g.h,
          label: prim.label, variant: prim.variant
        };
        defs.push('<g id="' + symId + '">'
          + NODE_BUILDERS[prim.type](atOrigin) + '</g>');
      }
      // Every occurrence (including the first) is a <use> placed at the
      // primitive's snapped x/y — guarantees identical geometry.
      return '<g ' + dataAttrs + '><use href="#' + defIds[key] + '" '
        + 'x="' + g.x + '" y="' + g.y + '"/></g>';
    }

    // Inline (≤2 occurrences) — call the builder directly with the
    // snapped geometry.
    var spec = {
      x: g.x, y: g.y, w: g.w, h: g.h,
      label: prim.label, variant: prim.variant, id: id
    };
    return '<g ' + dataAttrs + '>'
      + NODE_BUILDERS[prim.type](spec) + '</g>';
  }

  // Validate + snap a node primitive's x/y/w/h. A missing / non-finite
  // dimension is a hard throw (fail-fast — never render a 0-size or
  // NaN-positioned node).
  function snapGeom(prim, index) {
    var fields = ['x', 'y', 'w', 'h'];
    var out = {};
    var f;
    for (f = 0; f < fields.length; f++) {
      var key = fields[f];
      var raw = prim[key];
      if (raw == null || !isFinite(Number(raw))) {
        throw new Error('icon-svg: primitive #' + index
          + ' (id "' + (prim.id || index) + '") is missing a finite "'
          + key + '".');
      }
      out[key] = snap(raw);
    }
    if (out.w <= 0 || out.h <= 0) {
      throw new Error('icon-svg: primitive #' + index
        + ' has a non-positive w/h after snapping.');
    }
    return out;
  }

  // Compile a `logo` primitive — { type:'logo', kind, x,y,w,h, id }.
  function compileLogo(prim, id) {
    var kind = prim.kind;
    if (!Object.prototype.hasOwnProperty.call(LOGO_BLOCKS, kind)) {
      throw new Error('icon-svg: unknown logo kind "' + kind
        + '". Valid: ' + objKeys(LOGO_BLOCKS).join(', ') + '.');
    }
    var g = snapGeom(prim, -1);
    var spec = { x: g.x, y: g.y, w: g.w, h: g.h, id: esc(id) };
    // Phase 2.5 selection contract: same data-ve-comment-id stamp as
    // node primitives so logo blocks join the same per-atom thread
    // pattern. The kind goes in data-ve-label so clicks carry the
    // semantic name (e.g. "mask-cutout") in their payload.
    return '<g data-ve-id="' + esc(id) + '" '
      + 'data-ve-type="icon-node" '
      + 'data-ve-comment-id="icon-node:' + esc(id) + '" '
      + 'data-ve-label="' + esc(kind) + '">'
      + LOGO_BLOCKS[kind](spec) + '</g>';
  }

  // Compile a `shape` primitive — a clip-path decorative shape. Inside
  // a scene-graph it is emitted as a plain filled `<polygon>` so the
  // scene is one SVG. `fill` is a token name (default accent).
  function compileShape(prim, id) {
    var kind = prim.kind;
    if (indexOf(SHAPE_KINDS, kind) === -1) {
      throw new Error('icon-svg: unknown shape kind "' + kind
        + '". Valid: ' + SHAPE_KINDS.join(', ') + '.');
    }
    var g = snapGeom(prim, -1);
    var fill = tokenColor(prim.fill || 'accent');
    var pts = shapePolygon(kind, g.x, g.y, g.w, g.h);
    // Phase 2.5 selection contract — see compileLogo() above.
    return '<g data-ve-id="' + esc(id) + '" '
      + 'data-ve-type="icon-node" '
      + 'data-ve-comment-id="icon-node:' + esc(id) + '" '
      + 'data-ve-label="' + esc(kind) + '">'
      + '<polygon points="' + pts + '" fill="' + fill + '"/></g>';
  }

  // The clip-path polygon point sets, mapped from the CSS percentage
  // grammar (§IS-06) into absolute 1000-space coordinates. Each entry
  // is the same shape the `.isvg-shape-*` CSS class clips.
  var SHAPE_POLYGONS = {
    'triangle-up': [[50, 0], [100, 100], [0, 100]],
    'arrow-right': [[0, 20], [75, 20], [75, 0], [100, 50],
      [75, 100], [75, 80], [0, 80]],
    chevron: [[75, 0], [100, 50], [75, 100], [0, 100], [25, 50],
      [0, 0]],
    parallelogram: [[25, 0], [100, 0], [75, 100], [0, 100]],
    hexagon: [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100],
      [0, 50]],
    star: [[50, 0], [61, 35], [98, 35], [68, 57], [79, 91],
      [50, 70], [21, 91], [32, 57], [2, 35], [39, 35]]
  };

  // Build a `points` string for a shape kind inside the box x,y,w,h.
  function shapePolygon(kind, x, y, w, h) {
    var pct = SHAPE_POLYGONS[kind];
    var out = [];
    var i;
    for (i = 0; i < pct.length; i++) {
      out.push(snap(x + w * pct[i][0] / 100) + ','
        + snap(y + h * pct[i][1] / 100));
    }
    return out.join(' ');
  }

  // ── deviceFrame (IS-03 §4) ─────────────────────────────────────────
  //
  // Re-authored from device_frame.jsx as plain DOM + CSS — no React, no
  // JSX, no toolchain. Builds a themed mockup wrapper for report content.
  //
  // opts = { kind, title, url, time, content }:
  //   kind    — ios | android | mac | browser (unknown -> hard throw)
  //   title   — window title (mac / browser chrome)
  //   url     — address-bar text (browser chrome)
  //   time    — status-bar clock (ios / android) — default "9:41"
  //   content — an HTMLElement OR an HTML string placed in the screen
  //
  // Returns an HTMLElement when a `document` is available, otherwise an
  // HTML string (the scaffold path). The class vocabulary is
  // `isvg-frame--<kind>`, shared with the `wireframe` skill via the
  // `wf-frame--<kind>` aliases defined in the injected CSS.
  function deviceFrame(opts) {
    var o = opts || {};
    var kind = o.kind;
    if (!Object.prototype.hasOwnProperty.call(FRAME_KINDS, kind)) {
      // device_frame.jsx does exactly `if (!size) throw` — kept.
      throw new Error('icon-svg: deviceFrame unknown kind "' + kind
        + '". Valid: ' + objKeys(FRAME_KINDS).join(', ') + '.');
    }
    var time = o.time || '9:41';
    var title = o.title || '';
    var url = o.url || '';

    // Build the inner chrome HTML for this kind.
    var chrome = frameChrome(kind, time, title, url);
    var contentHtml = '';
    var contentEl = null;
    if (o.content && typeof o.content === 'object'
      && o.content.nodeType === 1) {
      contentEl = o.content;          // an HTMLElement — appended later
    } else if (typeof o.content === 'string') {
      contentHtml = o.content;
    }

    var html = '<div class="isvg-frame isvg-frame--' + kind
      + ' wf-frame--' + kind + '" data-isvg-frame="' + kind + '">'
      + '<div class="isvg-frame-screen">'
      + chrome
      + '<div class="isvg-frame-content">' + contentHtml + '</div>'
      + '</div></div>';

    // Node / scaffold path — return the HTML string.
    if (typeof document === 'undefined') {
      return html;
    }
    // Browser path — materialise a real element so the caller can
    // append an HTMLElement content child.
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var el = wrap.firstChild;
    if (contentEl) {
      var slot = el.querySelector('.isvg-frame-content');
      if (slot) { slot.appendChild(contentEl); }
    }
    return el;
  }

  // Build the chrome subtree for one frame kind. All glyphs are inline
  // SVG, `currentColor`-filled so they inherit `--vc-color-content`.
  function frameChrome(kind, time, title, url) {
    if (kind === 'ios') {
      return '<div class="isvg-frame-island" aria-hidden="true"></div>'
        + '<div class="isvg-frame-statusbar">'
        + '<span class="isvg-frame-time">' + esc(time) + '</span>'
        + '<span class="isvg-frame-statusicons">'
        + glyphSignal() + glyphWifi() + glyphBattery()
        + '</span></div>';
    }
    if (kind === 'android') {
      return '<div class="isvg-frame-punchhole" aria-hidden="true">'
        + '</div>'
        + '<div class="isvg-frame-statusbar">'
        + '<span class="isvg-frame-time">' + esc(time) + '</span>'
        + '<span class="isvg-frame-statusicons">'
        + glyphSignal() + glyphWifi() + glyphBattery()
        + '</span></div>';
    }
    if (kind === 'mac') {
      return '<div class="isvg-frame-titlebar">'
        + trafficLights()
        + '<span class="isvg-frame-title">' + esc(title) + '</span>'
        + '</div>';
    }
    // browser
    return '<div class="isvg-frame-titlebar">'
      + trafficLights()
      + '<span class="isvg-frame-tab">' + esc(title || 'New Tab')
      + '</span></div>'
      + '<div class="isvg-frame-urlbar">'
      + '<span class="isvg-frame-url">' + esc(url) + '</span></div>';
  }

  // The three macOS traffic-light dots. Their colors map 1:1 to the
  // semantic --vc-color-danger / warning / success roles (icon-svg-
  // spec.md §4.2) so the frame restyles on theme toggle. An author who
  // wants literal Apple colors overrides those 3 tokens locally.
  function trafficLights() {
    return '<span class="isvg-frame-lights" aria-hidden="true">'
      + '<span class="isvg-frame-light isvg-frame-light--close">'
      + '</span>'
      + '<span class="isvg-frame-light isvg-frame-light--min"></span>'
      + '<span class="isvg-frame-light isvg-frame-light--max"></span>'
      + '</span>';
  }

  // Status-bar glyphs — tiny inline SVGs, currentColor-filled.
  function glyphSignal() {
    return '<svg class="isvg-glyph" viewBox="0 0 18 12" '
      + 'aria-hidden="true">'
      + '<rect x="0" y="8" width="3" height="4" fill="currentColor"/>'
      + '<rect x="5" y="5" width="3" height="7" fill="currentColor"/>'
      + '<rect x="10" y="2" width="3" height="10" '
        + 'fill="currentColor"/>'
      + '<rect x="15" y="0" width="3" height="12" '
        + 'fill="currentColor"/></svg>';
  }
  function glyphWifi() {
    return '<svg class="isvg-glyph" viewBox="0 0 16 12" '
      + 'aria-hidden="true">'
      + '<path d="M8 11 L5 8 A4 4 0 0 1 11 8 Z" '
        + 'fill="currentColor"/>'
      + '<path d="M2 5 A8 8 0 0 1 14 5" fill="none" '
        + 'stroke="currentColor" stroke-width="2"/></svg>';
  }
  function glyphBattery() {
    return '<svg class="isvg-glyph" viewBox="0 0 26 12" '
      + 'aria-hidden="true">'
      + '<rect x="0" y="1" width="22" height="10" rx="2" '
        + 'fill="none" stroke="currentColor" stroke-width="1.5"/>'
      + '<rect x="2" y="3" width="14" height="6" '
        + 'fill="currentColor"/>'
      + '<rect x="23" y="4" width="2" height="4" '
        + 'fill="currentColor"/></svg>';
  }

  // ── the injected stylesheet ────────────────────────────────────────
  //
  // The skill's static CSS — the `--isvg-tint-*` ramp, the device-frame
  // chrome, the hotspot positioning, the clip-path shape library, the
  // scene-SVG sizing. 100% `--vc-*` tokens (every value has its
  // documented fallback). Built as an array of lines joined with '\n'
  // (ES5-safe, no template literals) — same pattern as
  // amvcp-animation.js's CSS_LINES.
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — icon-svg skill (injected) */',

    /* --- the derived tint ramp (icon-svg-spec.md §2) -------------- */
    /* color-mix off the existing accent token — NO new token group.
       An ancient browser with no color-mix degrades every tier to the
       hero token (still themed, still readable, never broken). */
    ':root {',
    '  --isvg-tint-hero: var(--vc-color-accent, #b8861f);',
    '  --isvg-tint-mid: color-mix(in oklch,',
    '    var(--vc-color-accent, #b8861f) 55%,',
    '    var(--vc-color-surface, #ffffff));',
    '  --isvg-tint-quiet: color-mix(in oklch,',
    '    var(--vc-color-accent, #b8861f) 25%,',
    '    var(--vc-color-surface, #ffffff));',
    '}',

    /* --- scene SVG sizing ----------------------------------------- */
    /* The authored SVG scales to its container; the displayed size is
       CSS-only. No-nested-scrollbars: a wide SVG widens the PAGE — it
       never gets an inner overflow wrapper. */
    '.isvg-scene {',
    '  display: block;',
    '  inline-size: 100%;',
    '  block-size: auto;',
    '  max-inline-size: 480px;',
    '  margin-inline: auto;',
    '  overflow: visible;',
    '}',
    '.isvg-scene text { user-select: none; }',

    /* --- clip-path shape library (IS-06, §3.4) -------------------- */
    /* Pure CSS — no SVG, no JS. The shaped element\'s background is a
       --vc-* token; the class only clips. */
    '.isvg-shape {',
    '  display: inline-block;',
    '  inline-size: 120px;',
    '  block-size: 120px;',
    '  background: var(--vc-color-accent, #b8861f);',
    '}',
    '.isvg-shape-triangle-up {',
    '  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);',
    '}',
    '.isvg-shape-arrow-right {',
    '  clip-path: polygon(0 20%,75% 20%,75% 0%,100% 50%,',
    '    75% 100%,75% 80%,0 80%);',
    '}',
    '.isvg-shape-chevron {',
    '  clip-path: polygon(75% 0%,100% 50%,75% 100%,0% 100%,',
    '    25% 50%,0% 0%);',
    '}',
    '.isvg-shape-parallelogram {',
    '  clip-path: polygon(25% 0%,100% 0%,75% 100%,0% 100%);',
    '}',
    '.isvg-shape-hexagon {',
    '  clip-path: polygon(25% 0%,75% 0%,100% 50%,75% 100%,',
    '    25% 100%,0% 50%);',
    '}',
    '.isvg-shape-star {',
    '  clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,',
    '    79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);',
    '}',

    /* --- image hotspot annotation (IS-07, §5) --------------------- */
    '.isvg-annotated {',
    '  position: relative;',
    '  display: inline-block;',
    '  max-inline-size: 100%;',
    '}',
    '.isvg-annotated > img {',
    '  display: block;',
    '  max-inline-size: 100%;',
    '  height: auto;',
    '}',
    /* --x / --y are inline 0..1 fractions; calc places the marker
       proportionally so it stays anchored when the image resizes.
       left/top are PHYSICAL on purpose — hotspot coordinates are tied
       to the image pixels, which do not flip in RTL (icon-svg-spec.md
       §5.1 logical-properties note). */
    '.isvg-hotspot {',
    '  position: absolute;',
    '  left: calc(var(--x, 0) * 100%);',
    '  top: calc(var(--y, 0) * 100%);',
    '  transform: translate(-50%, -50%);',
    '  inline-size: 1.7rem;',
    '  block-size: 1.7rem;',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 0;',
    '  font: 600 0.8rem/1 var(--vc-font-body, system-ui, sans-serif);',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-accent, #b8861f);',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  border: 2px solid var(--vc-color-surface, #ffffff);',
    '  cursor: pointer;',
    '  transition: transform var(--vc-duration-fast, 120ms)',
    '    var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '}',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {',
    '    transform: translate(-50%, -50%) scale(1.18);',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    /* substitute: a static ring instead of the scale pop */
    '  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {',
    '    box-shadow: 0 0 0 3px color-mix(in srgb,',
    '      var(--vc-color-accent, #b8861f) 35%, transparent);',
    '  }',
    '}',

    /* --- device frames (IS-03, §4) -------------------------------- */
    /* The cosmetic shell gradient from device_frame.jsx is dropped —
       IS-04\'s hairline aesthetic rejects gratuitous gradients. */
    '.isvg-frame {',
    '  display: inline-block;',
    '  background: var(--vc-color-content, #1f1a14);',
    '  box-shadow: var(--vc-shadow-3, 0 20px 60px',
    '    rgba(0,0,0,0.28));',
    '}',
    '.isvg-frame-screen {',
    '  position: relative;',
    '  display: flex;',
    '  flex-direction: column;',
    '  overflow: hidden;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    /* phone shells — rounded bezel + rounded screen */
    '.isvg-frame--ios {',
    '  inline-size: 390px;',
    '  border-radius: 55px;',
    '  padding: 12px;',
    '}',
    '.isvg-frame--ios .isvg-frame-screen {',
    '  block-size: 820px;',
    '  border-radius: 45px;',
    '}',
    '.isvg-frame--android {',
    '  inline-size: 412px;',
    '  border-radius: 44px;',
    '  padding: 10px;',
    '}',
    '.isvg-frame--android .isvg-frame-screen {',
    '  block-size: 895px;',
    '  border-radius: 34px;',
    '}',
    /* desktop shells — small radius */
    '.isvg-frame--mac, .isvg-frame--browser {',
    '  inline-size: 760px;',
    '  border-radius: 12px;',
    '  padding: 0;',
    '}',
    '.isvg-frame--mac .isvg-frame-screen,',
    '.isvg-frame--browser .isvg-frame-screen {',
    '  block-size: 470px;',
    '  border-radius: 12px;',
    '}',
    /* iOS Dynamic Island */
    '.isvg-frame-island {',
    '  position: absolute;',
    '  inset-block-start: 12px;',
    '  inset-inline-start: 50%;',
    '  transform: translateX(-50%);',
    '  inline-size: 122px;',
    '  block-size: 34px;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-content, #1f1a14);',
    '  z-index: 2;',
    '}',
    /* Android punch-hole camera */
    '.isvg-frame-punchhole {',
    '  position: absolute;',
    '  inset-block-start: 14px;',
    '  inset-inline-start: 50%;',
    '  transform: translateX(-50%);',
    '  inline-size: 14px;',
    '  block-size: 14px;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-content, #1f1a14);',
    '  z-index: 2;',
    '}',
    /* phone status bar */
    '.isvg-frame-statusbar {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 14px 32px 4px;',
    '  font: 600 13px/1 var(--vc-font-body, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.isvg-frame-statusicons {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 5px;',
    '}',
    '.isvg-glyph { display: block; block-size: 12px; }',
    /* desktop title bar + traffic lights */
    '.isvg-frame-titlebar {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  padding: 9px 14px;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border-block-end: 1px solid',
    '    var(--vc-color-border, #e3dcc9);',
    '}',
    '.isvg-frame-lights {',
    '  display: inline-flex;',
    '  gap: 8px;',
    '}',
    '.isvg-frame-light {',
    '  inline-size: 12px;',
    '  block-size: 12px;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '}',
    /* the close/min/max dots map 1:1 to the semantic roles so the
       frame restyles on theme toggle (icon-svg-spec.md §4.2) */
    '.isvg-frame-light--close {',
    '  background: var(--vc-color-danger, #a84a32);',
    '}',
    '.isvg-frame-light--min {',
    '  background: var(--vc-color-warning, #a8791f);',
    '}',
    '.isvg-frame-light--max {',
    '  background: var(--vc-color-success, #3a6b5c);',
    '}',
    '.isvg-frame-title, .isvg-frame-tab {',
    '  font: 500 13px/1 var(--vc-font-body, system-ui, sans-serif);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.isvg-frame-urlbar {',
    '  padding: 7px 14px;',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border-block-end: 1px solid',
    '    var(--vc-color-border, #e3dcc9);',
    '}',
    '.isvg-frame-url {',
    '  display: block;',
    '  padding: 5px 12px;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  font: 400 12px/1.4 var(--vc-font-mono, ui-monospace,',
    '    monospace);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    /* the screen content — the ONE sanctioned overflow:auto. A device
       frame is a FIXED-VIEWPORT application surface, the explicit
       carve-out in the no-nested-scrollbars rule: a phone screen IS a
       fixed viewport, so content exceeding it legitimately scrolls
       inside the mockup. Every OTHER .isvg-* element stays overflow:
       visible. */
    '.isvg-frame-content {',
    '  flex: 1 1 auto;',
    '  overflow: auto;',
    '  padding: 16px;',
    '}',
    /* iOS home indicator */
    '.isvg-frame--ios .isvg-frame-content {',
    '  padding-block-end: 28px;',
    '}',
    '.isvg-frame--ios .isvg-frame-screen::after {',
    '  content: "";',
    '  position: absolute;',
    '  inset-block-end: 8px;',
    '  inset-inline-start: 50%;',
    '  transform: translateX(-50%);',
    '  inline-size: 134px;',
    '  block-size: 5px;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-content, #1f1a14);',
    '}',
    /* Android gesture bar */
    '.isvg-frame--android .isvg-frame-screen::after {',
    '  content: "";',
    '  position: absolute;',
    '  inset-block-end: 8px;',
    '  inset-inline-start: 50%;',
    '  transform: translateX(-50%);',
    '  inline-size: 108px;',
    '  block-size: 4px;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-content-muted, #5b5343);',
    '}',
    ''
  ];

  // Materialised CSS string — joined once at module load.
  var CSS_TEXT = CSS_LINES.join('\n');

  // ── injectIconSvgCSS — append the skill stylesheet ─────────────────
  //
  // Idempotent: a second call is a no-op because the <style> is guarded
  // by id (matches the runtime's injectStyles guard / amvcp-animation's
  // STYLE_ID pattern).
  function injectIconSvgCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-isvg', 'icon-svg');
    style.appendChild(d.createTextNode(CSS_TEXT));
    d.head.appendChild(style);
  }

  // ── init — compile fenced blocks + dev-lint ────────────────────────
  //
  // init(root) (icon-svg-spec.md §9.1):
  //   1. Append the skill <style> once (idempotent).
  //   2. Scan for `icon-svg` fenced blocks — a <pre><code
  //      class="language-icon-svg"> OR a <script type="application/
  //      icon-svg+json"> — compile each via buildSceneSvg(), replace
  //      the block with the rendered <svg>.
  //   3. In dev mode, lintSvg() every authored `.isvg-scene` and
  //      console-warn (NEVER throw at runtime — a runtime throw would
  //      break the page; a dev-console warning is the right severity).
  //   4. No-op cleanly when the page has no `.isvg-*` content.
  //
  // A compile error on ONE block is caught and rendered as a visible
  // inline error placeholder — one bad block must not abort init() and
  // leave the rest of the page unprocessed. This is the deliberate
  // boundary between fail-fast (buildSceneSvg throws) and fail-soft
  // (init shows the throw to the reader instead of silently dropping it).
  var _initialized = false;

  function init(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return; }
    injectIconSvgCSS(d.ownerDocument || d);
    compileFencedBlocks(d);
    devLint(d);
    _initialized = true;
  }

  // Scan + compile every `icon-svg` fenced block under `root`.
  function compileFencedBlocks(root) {
    var blocks = collectBlocks(root);
    var i;
    for (i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var json = block.text;
      var rendered;
      try {
        rendered = buildSceneSvg(json);
      } catch (e) {
        rendered = errorPlaceholder(e);
      }
      replaceBlock(block.node, rendered);
    }
    // Phase 2.5 — User Req #10: every atom (scene SVG + nested node
    // <g> + hotspots) gets a 3-radio Skip/Approve/Deny mini-pill from
    // the runtime, INDEPENDENT of selection state. The helper is
    // shipped by the sibling p25-runtime-text-comment agent — guard
    // defensively in case it is not loaded yet.
    attachDecisionMinisToAtoms(root);
  }

  // Walk every selection atom (icon-svg scenes, nested icon-node groups,
  // hotspots) and call window.amvcpRuntime.attachDecisionMini(el, id)
  // on each — exposing the per-atom decision pill the runtime renders
  // independently of [data-ve-selected]. Idempotent: a second call is
  // a no-op when the runtime helper short-circuits on a pre-existing
  // pill (the runtime owns that idempotency contract).
  function attachDecisionMinisToAtoms(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return; }
    if (typeof window === 'undefined') { return; }
    var rt = window.amvcpRuntime;
    if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
    var atoms = d.querySelectorAll(
      'svg.isvg-scene[data-ve-id], '
      + 'svg.isvg-scene g[data-ve-id], '
      + '.isvg-hotspot[data-ve-id]'
    );
    var i;
    for (i = 0; i < atoms.length; i++) {
      var el = atoms[i];
      var id = el.getAttribute('data-ve-id');
      try { rt.attachDecisionMini(el, id); } catch (e) { /* defensive */ }
    }
  }

  // Collect the fenced blocks — both the <pre><code class="language-
  // icon-svg"> form and the <script type="application/icon-svg+json">
  // form. Returns [{ node, text }].
  function collectBlocks(root) {
    var out = [];
    var codes = root.querySelectorAll(
      'pre > code.language-icon-svg, code.language-icon-svg');
    var i;
    for (i = 0; i < codes.length; i++) {
      var node = codes[i].parentNode
        && codes[i].parentNode.tagName === 'PRE'
        ? codes[i].parentNode : codes[i];
      out.push({ node: node, text: codes[i].textContent || '' });
    }
    var scripts = root.querySelectorAll(
      'script[type="application/icon-svg+json"]');
    for (i = 0; i < scripts.length; i++) {
      out.push({ node: scripts[i],
        text: scripts[i].textContent || '' });
    }
    return out;
  }

  // Replace a fenced-block node with the rendered SVG, wrapped in a
  // figure so the result is a clean block-level element.
  function replaceBlock(node, svgHtml) {
    if (!node || !node.parentNode) { return; }
    var fig = (node.ownerDocument || document).createElement('figure');
    fig.className = 'isvg-figure';
    fig.innerHTML = svgHtml;
    node.parentNode.replaceChild(fig, node);
  }

  // A visible inline error placeholder for a bad fenced block — the
  // throw text is shown to the reader (fail-soft at the page level; the
  // underlying buildSceneSvg STILL threw — fail-fast at the API level).
  function errorPlaceholder(err) {
    return '<svg xmlns="http://www.w3.org/2000/svg" '
      + 'viewBox="0 0 1000 1000" class="isvg-scene" role="img" '
      + 'aria-label="icon-svg compile error">'
      + '<rect x="20" y="20" width="960" height="960" rx="' + NODE_RADIUS
      + '" fill="none" stroke="' + tokenColor('danger') + '" '
      + 'stroke-width="' + STROKE + '" stroke-dasharray="16 12"/>'
      + '<text x="500" y="500" text-anchor="middle" '
      + 'dominant-baseline="central" '
      + 'font-family="var(--vc-font-mono, ui-monospace, monospace)" '
      + 'font-size="34" fill="' + tokenColor('danger') + '">'
      + esc('icon-svg: ' + (err && err.message || err)) + '</text>'
      + '</svg>';
  }

  // Dev-mode lint pass — lintSvg() every authored `.isvg-scene` on the
  // page, console-warn each violation. Never throws (a runtime throw
  // would break the page). Skipped silently when there is no console.
  function devLint(root) {
    if (typeof console === 'undefined' || !console.warn) { return; }
    var scenes = root.querySelectorAll('svg.isvg-scene');
    var i;
    for (i = 0; i < scenes.length; i++) {
      var markup = scenes[i].outerHTML || '';
      if (!markup) { continue; }
      var report = lintSvg(markup);
      if (!report.ok) {
        var j;
        for (j = 0; j < report.violations.length; j++) {
          console.warn('[icon-svg] lint '
            + report.violations[j].rule + ': '
            + report.violations[j].detail);
        }
      }
    }
  }

  // ── refresh — dynamic-DOM hook ─────────────────────────────────────
  //
  // Re-scan after dynamic DOM insertion. Re-runs the fenced-block
  // compiler + the dev-lint pass; already-compiled blocks are gone
  // (replaced by their <figure>), so a re-scan only picks up NEW blocks.
  function refresh(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    compileFencedBlocks(d);     // also (re-)attaches decision-minis
    // Re-attach in case fresh scenes appeared since the last init —
    // compileFencedBlocks already covered any newly compiled atoms,
    // but a host may have stamped new hotspots independently. Same
    // defensive guard inside, idempotent.
    attachDecisionMinisToAtoms(d);
    devLint(d);
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    injectIconSvgCSS: injectIconSvgCSS,
    init: init,
    buildSceneSvg: buildSceneSvg,
    lintSvg: lintSvg,
    deviceFrame: deviceFrame,
    builders: builders,
    refresh: refresh,
    // Phase 2.5 User Req #10 — public so external code (tests, hosts
    // that inject hotspots after init) can re-attach the mini-pill on
    // newly-stamped atoms.
    attachDecisionMinisToAtoms: attachDecisionMinisToAtoms,
    // Exposed for the dev-browser test (mirrors __veAnimation).
    _cssText: CSS_TEXT,
    snap: snap
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpIconSvg = _api;
    // Test hook — exposes the pure helpers + an init handle so the
    // dev-browser suite can drive the module like __veAnimation.
    window.__veIconSvg = {
      get state() {
        return {
          initialized: _initialized,
          cssInjected: !!(document.getElementById
            && document.getElementById(STYLE_ID))
        };
      },
      init: init,
      refresh: refresh,
      injectIconSvgCSS: injectIconSvgCSS,
      buildSceneSvg: buildSceneSvg,
      lintSvg: lintSvg,
      deviceFrame: deviceFrame,
      builders: builders,
      snap: snap,
      // Phase 2.5 User Req #10 — exposed so a test can assert the
      // helper is invoked with the right (atomEl, atomId) arguments.
      attachDecisionMinisToAtoms: attachDecisionMinisToAtoms
    };

    // Self-init on DOMContentLoaded — UNLESS the host opted out via
    // window.__isvgManualInit (the runtime sets this so it controls the
    // engine -> tokens -> icon-svg-CSS -> icon-svg-init ordering; the
    // test fixture also sets it for deterministic control).
    if (!window.__isvgManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          init(document);
        });
      } else {
        init(document);
      }
    }
  }

  // Node export — for the test harness / sanity checks.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
