/*!
 * ai-maestro-visual-communicator-plugin — chart runtime module.
 *
 * Phase 2 (visualizing backlog §4, build #8): a DEPENDENCY-FREE native
 * chart renderer. The author writes a JSON-fenced code block whose info
 * string is `chart:<type>@<version>`; this module finds the block on
 * boot, parses the JSON, and replaces the <pre> with rendered SVG /
 * CSS-flex / Canvas. Zero CDN, zero D3 / Plotly / Chart.js, one
 * self-contained offline HTML file.
 *
 * Design contract (chart-spec.md):
 *   - Dependency-free. Pure SVG + CSS + Canvas, ES5-style JS. No build
 *     step, no npm runtime dep, nothing that fetches a remote script.
 *   - Theme-driven. Every fill/stroke/gap/radius/font/duration is a
 *     `--vc-*` custom property read via `var(--vc-*, <fallback>)`. Zero
 *     hardcoded colors / visual sizes. The two viewBox constants are an
 *     internal coordinate space (fluid-scaled, theme-independent) — not
 *     a rendered size. A token-less page still renders correctly via the
 *     canonical fallbacks baked into every reference.
 *   - Light + dark. Charts never store a second palette — SVG `fill` /
 *     `stroke` cascade from CSS custom properties, so a theme swap
 *     restyles them with no re-render. Canvas charts re-resolve on the
 *     `themechange` signal (re-rendered by veChartScan).
 *   - Fail-fast. A malformed spec (bad JSON, unknown type, version too
 *     new, missing required `title`/`series`) degrades the block to a
 *     VISIBLE <pre class="ve-chart-error"> keeping the original JSON +
 *     an error banner. Never a silent blank box, never an invented
 *     default dataset.
 *   - Guardrails (enforced, not opt-in): no pie charts (`pie` remaps to
 *     a sorted bar); gridlines sparse only (<=4 nice-tick rules, never
 *     vertical); no heavy libs; every chart needs an insight title.
 *   - No nested scrollbars. The <svg> is `preserveAspectRatio` fluid; a
 *     wide chart extends the page, never an inner overflow box.
 *
 * Dual export:
 *   - browser: `window.amvcpChart = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-animation.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes.
 *
 * Public API:
 *   injectChartCSS(doc)              — append the skill <style> to head
 *   scan(root)                       — find & render every chart block
 *   render(spec, type, host)         — render one parsed spec into host
 *   parseFence(preEl)                — extract type/version + parse JSON
 *   palette(n)                       — n golden-angle categorical colors
 *   ramp(t, mode)                    — OKLCH sequential/diverging ramp
 *   niceTicks(min, max, count)       — sparse "nice" tick values
 *   getSelection()                   — internal-fallback selection list
 */
(function () {
  'use strict';

  // ── Internal coordinate space ──────────────────────────────────────
  //
  // viewBox constants. NOT a rendered pixel size — the <svg> carries
  // `preserveAspectRatio="xMidYMid meet"` so it fluid-scales to its
  // container. These are the units the geometry math is expressed in;
  // they are theme-independent, so they are the ONE allowed "size"
  // (chart-spec.md §2 sub-technique 3 step 1).
  var VB_W = 640;            // default chart viewBox width
  var VB_H = 360;            // default chart viewBox height
  var VB_SQUARE = 400;       // radar / square-aspect viewBox side
  var VB_DONUT = 360;        // donut / circular viewBox side

  // Inset margins (in viewBox units) reserved for axis labels.
  var M = { t: 36, r: 20, b: 48, l: 56 };

  // Above this total mark count an SVG chart switches to a <canvas>
  // backend — the SVG DOM gets heavy past ~100 nodes (chart-spec.md
  // §2 sub-technique 9 step 1).
  var CANVAS_THRESHOLD = 100;

  // The golden angle (137.5077…°) — successive hues stepped by this are
  // maximally distinct for any series count (chart-spec.md §2 #10).
  var GOLDEN_ANGLE = 137.50776405003785;

  // Entry-animation stagger step in ms. A CSS-side fallback; the real
  // value derives from `--vc-duration-stagger-step` when present.
  var STAGGER_MS = 60;

  // The <style> id — injection is idempotent (a second call is a no-op),
  // matching the runtime's injectStyles / animation skill guard pattern.
  var STYLE_ID = 'vc-chart-styles';

  // Monotonic counter so every rendered <figure> gets a unique
  // `data-ve-id` even when the author supplied none.
  var _chartSeq = 0;

  // ── prefers-reduced-motion gate ────────────────────────────────────
  //
  // Read once at module load; re-read live on an OS toggle. JS-driven
  // animations (arc sweep, radar inflate) jump to their final frame
  // when REDUCED is true (chart-spec.md cross-cutting §Entry animation).
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
    }
    if (typeof _mql.addEventListener === 'function') {
      _mql.addEventListener('change', onChange);
    } else if (typeof _mql.addListener === 'function') {
      _mql.addListener(onChange);
    }
  }

  // ── SVG namespace + element helpers ────────────────────────────────

  var SVGNS = 'http://www.w3.org/2000/svg';

  // Create an SVG element with a flat attribute map. Numbers are
  // stringified; null/undefined attrs are skipped.
  function svg(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k)) { continue; }
        var v = attrs[k];
        if (v === null || v === undefined) { continue; }
        el.setAttribute(k, String(v));
      }
    }
    return el;
  }

  // Create an HTML element with a flat attribute map + optional text.
  function el(name, attrs, text) {
    var node = document.createElement(name);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k)) { continue; }
        var v = attrs[k];
        if (v === null || v === undefined) { continue; }
        if (k === 'className') { node.className = String(v); }
        else { node.setAttribute(k, String(v)); }
      }
    }
    if (text !== null && text !== undefined) {
      node.appendChild(document.createTextNode(String(text)));
    }
    return node;
  }

  // An SVG <title> child — native hover tooltip + accessible name.
  function svgTitle(parent, text) {
    var t = svg('title');
    t.appendChild(document.createTextNode(String(text)));
    parent.appendChild(t);
    return t;
  }

  // ── number helpers ─────────────────────────────────────────────────

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  // Format a value compactly for tooltips / value labels. Whole numbers
  // print clean; fractions keep up to 2 decimals; large numbers stay
  // readable. Never produces `NaN` for a finite input.
  function fmtNum(v) {
    if (!isNum(v)) { return String(v); }
    var a = Math.abs(v);
    if (a >= 1000000) { return (v / 1000000).toFixed(1) + 'M'; }
    if (a >= 1000) { return (v / 1000).toFixed(1) + 'k'; }
    if (v === Math.round(v)) { return String(v); }
    return (Math.round(v * 100) / 100).toString();
  }

  // ── Guardrail: niceTicks (chart-spec.md §6 rule 2) ─────────────────
  //
  // Round a [min,max] domain to human-friendly tick stops at
  // 1·/2·/5·×10ⁿ steps so the gridline count stays small (<=`count`+1)
  // and every value is a round number. Returns { top, step, ticks[] }.
  function niceTicks(min, max, count) {
    if (!isNum(min)) { min = 0; }
    if (!isNum(max)) { max = 1; }
    if (max <= min) { max = min + 1; }
    if (!isNum(count) || count < 1) { count = 4; }
    var span = max - min;
    var rawStep = span / count;
    var mag = Math.pow(10, Math.floor(Math.log(rawStep) / Math.LN10));
    var norm = rawStep / mag;            // normalised step in [1,10)
    var niceNorm;
    if (norm <= 1) { niceNorm = 1; }
    else if (norm <= 2) { niceNorm = 2; }
    else if (norm <= 5) { niceNorm = 5; }
    else { niceNorm = 10; }
    var step = niceNorm * mag;
    var niceMin = Math.floor(min / step) * step;
    var niceMax = Math.ceil(max / step) * step;
    var ticks = [];
    // Guard against a degenerate step producing a runaway loop.
    var guard = 0;
    for (var t = niceMin; t <= niceMax + step * 0.5 && guard < 64; t += step) {
      // Snap away tiny floating-point dust (e.g. 0.30000000004).
      ticks.push(Math.round(t * 1e6) / 1e6);
      guard++;
    }
    return { top: niceMax, bottom: niceMin, step: step, ticks: ticks };
  }

  // ── Linear scale factory ───────────────────────────────────────────
  //
  // Maps a value from [d0,d1] onto [r0,r1]. A zero-width domain maps
  // everything to r0 (no divide-by-zero).
  function scale(d0, d1, r0, r1) {
    var dspan = d1 - d0;
    return function (v) {
      if (dspan === 0) { return r0; }
      return r0 + ((v - d0) / dspan) * (r1 - r0);
    };
  }

  // ── Color engine (chart-spec.md §2 sub-technique 10) ───────────────
  //
  // Read a CSS custom property off :root, trimmed. Empty when absent.
  function readVar(name) {
    if (typeof document === 'undefined' || !document.documentElement) {
      return '';
    }
    try {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
    } catch (e) { return ''; }
  }

  // Extract an [L,C,H] triple from `--vc-color-accent` so the palette
  // sits in the same tonal register as the theme. The accent is usually
  // a hex literal; this parses hex -> sRGB -> a coarse OKLCH-ish triple.
  // It does NOT need to be a perfect color-space conversion — it only
  // feeds a hue rotation + a lightness/chroma anchor, and `oklch()` is
  // resolved by the browser at paint time, so light/dark stay correct.
  function _accentLCH() {
    var raw = readVar('--vc-color-accent') || '#b8861f';
    var hex = raw.replace('#', '');
    if (hex.length === 3) {
      hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1)
        + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }
    var r = parseInt(hex.slice(0, 2), 16) / 255;
    var g = parseInt(hex.slice(2, 4), 16) / 255;
    var b = parseInt(hex.slice(4, 6), 16) / 255;
    if (!isNum(r) || !isNum(g) || !isNum(b)) { r = 0.72; g = 0.53; b = 0.12; }
    // sRGB -> HSL (cheap, good enough as a hue anchor).
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var l = (mx + mn) / 2;
    var d = mx - mn;
    var h = 0, s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (mx === r) { h = ((g - b) / d) % 6; }
      else if (mx === g) { h = (b - r) / d + 2; }
      else { h = (r - g) / d + 4; }
      h *= 60;
      if (h < 0) { h += 360; }
    }
    // OKLCH lightness sits a touch above HSL lightness for mid tones;
    // chroma maps roughly off HSL saturation. These anchors are derived
    // from the accent, never hardcoded literals.
    var L = 0.55 + (l - 0.5) * 0.5;       // ~0.30..0.80
    if (L < 0.45) { L = 0.45; }
    if (L > 0.78) { L = 0.78; }
    var C = 0.07 + s * 0.10;              // ~0.07..0.17
    return { L: L, C: C, H: h };
  }

  // palette(n) — n categorical CSS color strings. Series `i` gets hue
  // = (accentHue + i*goldenAngle) mod 360, expressed in oklch() so it is
  // perceptually even and the golden-angle step keeps every hue maximally
  // distinct. Lightness + chroma are accent-derived (not hardcoded), so a
  // dark theme yields a dark-appropriate palette.
  function palette(n) {
    if (!isNum(n) || n < 1) { n = 1; }
    var base = _accentLCH();
    var out = [];
    for (var i = 0; i < n; i++) {
      var hue = (base.H + i * GOLDEN_ANGLE) % 360;
      out.push('oklch(' + base.L.toFixed(3) + ' '
        + base.C.toFixed(3) + ' ' + hue.toFixed(1) + ')');
    }
    return out;
  }

  // ramp(t, mode) — t in [0,1]. Sequential: an OKLCH color-mix from the
  // surface (cold) to the accent (hot) — no dead-gray midpoint because
  // the mix is in OKLCH space. Diverging: danger -> neutral -> success,
  // each half an OKLCH mix. The browser evaluates color-mix at paint
  // time, so both themes stay correct (chart-spec.md §2 #10).
  function ramp(t, mode) {
    if (!isNum(t)) { t = 0; }
    if (t < 0) { t = 0; }
    if (t > 1) { t = 1; }
    if (mode === 'diverging') {
      // 0 -> danger, 0.5 -> neutral surface, 1 -> success.
      if (t < 0.5) {
        var k0 = (0.5 - t) / 0.5;                    // 1 at t=0 .. 0 at t=0.5
        return 'color-mix(in oklch, var(--vc-color-surface, #ffffff) '
          + ((1 - k0) * 100).toFixed(1) + '%, var(--vc-color-danger, #a84a32))';
      }
      var k1 = (t - 0.5) / 0.5;                      // 0 at t=0.5 .. 1 at t=1
      return 'color-mix(in oklch, var(--vc-color-surface, #ffffff) '
        + ((1 - k1) * 100).toFixed(1) + '%, var(--vc-color-success, #3a6b5c))';
    }
    // sequential
    return 'color-mix(in oklch, var(--vc-color-surface, #ffffff) '
      + ((1 - t) * 100).toFixed(1) + '%, var(--vc-color-accent, #b8861f))';
  }

  // Map a value to the [0,1] ramp position. logScale keeps a sparse high
  // outlier from washing out the rest of a heatmap (chart-spec.md §11).
  function rampT(value, maxValue, logScale) {
    if (!isNum(value) || !isNum(maxValue) || maxValue <= 0) { return 0; }
    if (logScale) {
      return Math.log(1 + value) / Math.log(1 + maxValue);
    }
    return value / maxValue;
  }

  // ── geometry helpers ───────────────────────────────────────────────

  // Catmull-Rom -> cubic-Bézier path string. For each segment the two
  // control points are derived from the neighbouring vertices with
  // tension 0.5 — a smooth curve through every point, no overshoot.
  function catmullRom(points) {
    if (!points || points.length === 0) { return ''; }
    if (points.length === 1) {
      return 'M' + points[0].x + ' ' + points[0].y;
    }
    var d = 'M' + points[0].x + ' ' + points[0].y;
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2)
        + ' ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2)
        + ' ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
    }
    return d;
  }

  // A straight polyline path string through the points.
  function linePath(points) {
    if (!points || !points.length) { return ''; }
    var d = 'M' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length; i++) {
      d += ' L' + points[i].x.toFixed(2) + ' ' + points[i].y.toFixed(2);
    }
    return d;
  }

  // An orthogonal step path (used for step-area / step lines).
  function stepPath(points) {
    if (!points || !points.length) { return ''; }
    var d = 'M' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length; i++) {
      d += ' H' + points[i].x.toFixed(2)
        + ' V' + points[i].y.toFixed(2);
    }
    return d;
  }

  function polarToCartesian(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;     // 0deg = 12 o'clock
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // describeArc — an annular wedge (donut/gauge segment) as a closed
  // path. rOuter > rInner; for a full filled segment pass rInner=0.
  function describeArc(cx, cy, rOuter, rInner, a0, a1) {
    if (a1 - a0 >= 359.999) { a1 = a0 + 359.999; }   // never a full 360 (cusp)
    var oStart = polarToCartesian(cx, cy, rOuter, a1);
    var oEnd = polarToCartesian(cx, cy, rOuter, a0);
    var iStart = polarToCartesian(cx, cy, rInner, a0);
    var iEnd = polarToCartesian(cx, cy, rInner, a1);
    var large = (a1 - a0) > 180 ? 1 : 0;
    if (rInner <= 0) {
      return 'M' + oStart.x.toFixed(2) + ' ' + oStart.y.toFixed(2)
        + ' A' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 0 '
        + oEnd.x.toFixed(2) + ' ' + oEnd.y.toFixed(2)
        + ' L' + cx + ' ' + cy + ' Z';
    }
    return 'M' + oStart.x.toFixed(2) + ' ' + oStart.y.toFixed(2)
      + ' A' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 0 '
      + oEnd.x.toFixed(2) + ' ' + oEnd.y.toFixed(2)
      + ' L' + iStart.x.toFixed(2) + ' ' + iStart.y.toFixed(2)
      + ' A' + rInner + ' ' + rInner + ' 0 ' + large + ' 1 '
      + iEnd.x.toFixed(2) + ' ' + iEnd.y.toFixed(2) + ' Z';
  }

  // ── selection bridge ───────────────────────────────────────────────
  //
  // The chart module is DEFENSIVE / standalone (chart-spec.md §0): when
  // it runs inside the full runtime, `window.toggleElementSelection`
  // exists and a mark click joins the page's multi-select set. When it
  // runs alone (test fixture, offline preview) it keeps its own internal
  // selection list so the behaviour is observable without the runtime.
  // The payload shape is EXACTLY what veWireChart emits today
  // (chart-spec.md §5 integration contract 1).
  var _selection = [];

  function getSelection() { return _selection.slice(); }

  function _toggleSelection(payload) {
    if (typeof window !== 'undefined'
        && typeof window.toggleElementSelection === 'function') {
      try { window.toggleElementSelection(payload); return; }
      catch (e) { /* fall through to the internal list */ }
    }
    // Internal fallback — toggle by id.
    for (var i = 0; i < _selection.length; i++) {
      if (_selection[i].id === payload.id) {
        _selection.splice(i, 1);
        return;
      }
    }
    _selection.push(payload);
  }

  // veChartMark — stamp a data mark (a <rect>/<circle>/<path>/<li>) so
  // the runtime's selection / keyboard / comment machinery picks it up
  // with zero new wiring (chart-spec.md §2 sub-technique 3 step 6).
  function markPoint(node, info) {
    node.setAttribute('data-ve-id', info.id);
    node.setAttribute('data-ve-type', 'chart-point');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    if (info.label) {
      node.setAttribute('data-ve-label', info.label);
    }
    if (info.value !== undefined && info.value !== null) {
      node.setAttribute('data-ve-value', String(info.value));
    }
    // The selection payload — identical shape to veWireChart's.
    node.__veChartPayload = {
      id: info.id,
      type: 'chart-point',
      label: info.label || info.id,
      data: {
        chartId: info.chartId,
        datasetIndex: info.datasetIndex,
        datasetLabel: info.datasetLabel || null,
        index: info.index,
        xLabel: info.xLabel != null ? info.xLabel : null,
        value: info.value != null ? info.value : null
      }
    };
    // Phase 2.5 request #10 — every atom gets an independent 3-radio
    // Skip/Approve/Deny mini-pill via the runtime helper (sibling agent
    // p25-runtime-text-comment ships it). Defensive guard tolerates the
    // helper missing in standalone fixtures.
    _attachDecisionMini(node, info.id);
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
    } catch (_) { /* helper failed — chart stays usable, no pill */ }
  }

  // ── tooltip singleton (hover-bridge pattern) ───────────────────────
  //
  // ONE absolutely-positioned tooltip appended to <body>. Hide is
  // deferred on a ~150ms timer cancelled if the pointer enters the
  // tooltip — the standard hover-bridge that stops flicker when the
  // pointer crosses the gap between a mark and the tooltip
  // (~/.claude/rules/browser-ui-test-techniques.md §2).
  var _tip = null;
  var _tipHideTimer = null;
  var _tipLocked = false;

  function _ensureTooltip() {
    if (_tip) { return _tip; }
    if (typeof document === 'undefined' || !document.body) { return null; }
    _tip = el('div', { className: 've-chart-tooltip', role: 'status' });
    _tip.style.display = 'none';
    _tip.addEventListener('mouseover', function () {
      if (_tipHideTimer) { clearTimeout(_tipHideTimer); _tipHideTimer = null; }
    });
    _tip.addEventListener('mouseleave', function () {
      if (!_tipLocked) { _scheduleTipHide(); }
    });
    document.body.appendChild(_tip);
    return _tip;
  }

  function _showTooltip(html, clientX, clientY) {
    var tip = _ensureTooltip();
    if (!tip) { return; }
    if (_tipHideTimer) { clearTimeout(_tipHideTimer); _tipHideTimer = null; }
    tip.innerHTML = '';
    tip.appendChild(html);
    tip.style.display = 'block';
    // Position above-right of the pointer; clamp to the viewport.
    var pad = 14;
    var vw = window.innerWidth || 1024;
    var x = clientX + pad;
    var y = clientY + pad;
    var r = tip.getBoundingClientRect();
    if (x + r.width > vw - 4) { x = clientX - r.width - pad; }
    if (x < 4) { x = 4; }
    if (y < 4) { y = clientY + pad; }
    tip.style.left = (x + (window.scrollX || 0)) + 'px';
    tip.style.top = (y + (window.scrollY || 0)) + 'px';
  }

  function _scheduleTipHide() {
    if (_tipHideTimer) { clearTimeout(_tipHideTimer); }
    _tipHideTimer = setTimeout(function () {
      if (_tip && !_tipLocked) { _tip.style.display = 'none'; }
      _tipHideTimer = null;
    }, 160);
  }

  function _hideTooltipNow() {
    _tipLocked = false;
    if (_tipHideTimer) { clearTimeout(_tipHideTimer); _tipHideTimer = null; }
    if (_tip) { _tip.style.display = 'none'; }
  }

  // Build the tooltip body for a mark: a strong label line + a value.
  function _tooltipBody(label, value) {
    var box = el('div', { className: 've-chart-tooltip-inner' });
    box.appendChild(el('div', { className: 've-chart-tooltip-label' },
      label || ''));
    if (value !== undefined && value !== null) {
      box.appendChild(el('div', { className: 've-chart-tooltip-value' },
        fmtNum(value)));
    }
    return box;
  }

  // ── entry-animation trigger (fire-once IntersectionObserver) ───────
  //
  // Wraps an IO at threshold 0.3, disconnecting after the first
  // intersection so the entry animation fires exactly once. Reuses the
  // animation skill's fire-once pattern; falls back to firing
  // immediately when IO is unavailable (content is never stuck).
  function animateOnView(host, fireFn) {
    if (typeof fireFn !== 'function') { return; }
    if (REDUCED || typeof IntersectionObserver === 'undefined') {
      fireFn();
      return;
    }
    var fired = false;
    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting && !fired) {
          fired = true;
          fireFn();
          obs.disconnect();
        }
      }
    }, { threshold: 0.3 });
    io.observe(host);
  }

  // ── degrade fallback (fail-fast, chart-spec.md §3) ─────────────────
  //
  // A malformed spec replaces the <pre> with a VISIBLE error block: the
  // original JSON text is kept verbatim + a danger-colored banner with
  // the exact reason. Never a silent blank.
  function _degrade(pre, originalText, reason) {
    var wrap = el('div', { className: 've-chart-error' });
    wrap.appendChild(el('div', { className: 've-chart-error-banner' },
      'Chart error: ' + reason));
    var code = el('pre', { className: 've-chart-error-src' });
    code.appendChild(document.createTextNode(originalText || ''));
    wrap.appendChild(code);
    if (pre && pre.parentNode) {
      pre.parentNode.replaceChild(wrap, pre);
    }
    return wrap;
  }

  // ── shared chart scaffolding ───────────────────────────────────────

  // Build the <figure> host for a chart, with caption + (later) legend.
  function _buildFigure(type, spec) {
    _chartSeq++;
    var id = 've-chart-' + _chartSeq;
    var fig = el('figure', {
      className: 've-chart',
      'data-ve-chart-type': type,
      'data-ve-id': id,
      'data-ve-type': 'chart'
    });
    if (spec.title) {
      fig.appendChild(el('figcaption', { className: 've-chart-title' },
        spec.title));
    }
    if (spec.subtitle) {
      fig.appendChild(el('div', { className: 've-chart-subtitle' },
        spec.subtitle));
    }
    fig.__veChartId = id;
    return fig;
  }

  // Append a legend when there is more than one series.
  function _appendLegend(fig, labels, colors) {
    if (!labels || labels.length < 2) { return; }
    var legend = el('ul', { className: 've-chart-legend' });
    for (var i = 0; i < labels.length; i++) {
      var li = el('li', { className: 've-chart-legend-item' });
      var sw = el('span', { className: 've-chart-legend-swatch' });
      sw.style.background = colors[i % colors.length];
      li.appendChild(sw);
      li.appendChild(el('span', { className: 've-chart-legend-label' },
        labels[i]));
      legend.appendChild(li);
    }
    fig.appendChild(legend);
  }

  // Append a source attribution line.
  function _appendSource(fig, source) {
    if (!source) { return; }
    fig.appendChild(el('div', { className: 've-chart-source' }, source));
  }

  // A new <svg> sized to a viewBox, fluid-scaled (no inner scroller).
  function _newSvg(w, h, ariaLabel) {
    return svg('svg', {
      'class': 've-chart-svg',
      viewBox: '0 0 ' + w + ' ' + h,
      role: 'img',
      'aria-label': ariaLabel,
      preserveAspectRatio: 'xMidYMid meet'
    });
  }

  // Wire hover/click on every `.ve-chart-point` / `.ve-chart-bar` /
  // `.ve-chart-cell` / `.ve-chart-arc` inside a figure: hover shows the
  // tooltip, click locks it AND toggles the mark's selection.
  function _wireMarks(fig) {
    var MARK_SEL = '.ve-chart-bar, .ve-chart-point, .ve-chart-cell,'
      + ' .ve-chart-arc, .ve-chart-wf-bar, .ve-chart-mekko-cell,'
      + ' .ve-chart-funnel-stage';
    function findMark(node) {
      while (node && node !== fig) {
        if (node.classList && (
          node.classList.contains('ve-chart-bar')
          || node.classList.contains('ve-chart-point')
          || node.classList.contains('ve-chart-cell')
          || node.classList.contains('ve-chart-arc')
          || node.classList.contains('ve-chart-wf-bar')
          || node.classList.contains('ve-chart-mekko-cell')
          || node.classList.contains('ve-chart-funnel-stage'))) {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    }
    fig.addEventListener('mouseover', function (ev) {
      var mark = findMark(ev.target);
      if (!mark || !mark.__veChartPayload) { return; }
      if (_tipLocked) { return; }
      var p = mark.__veChartPayload;
      _showTooltip(_tooltipBody(p.label, p.data && p.data.value),
        ev.clientX, ev.clientY);
    });
    fig.addEventListener('mousemove', function (ev) {
      if (_tipLocked || !_tip || _tip.style.display === 'none') { return; }
      var mark = findMark(ev.target);
      if (!mark) { return; }
      var p = mark.__veChartPayload;
      _showTooltip(_tooltipBody(p.label, p.data && p.data.value),
        ev.clientX, ev.clientY);
    });
    fig.addEventListener('mouseout', function (ev) {
      var mark = findMark(ev.target);
      if (!mark) { return; }
      if (!_tipLocked) { _scheduleTipHide(); }
    });
    fig.addEventListener('click', function (ev) {
      var mark = findMark(ev.target);
      if (!mark || !mark.__veChartPayload) { return; }
      var p = mark.__veChartPayload;
      // Lock the tooltip so it survives mouseout; a second click on the
      // same mark unlocks. Click also toggles the selection.
      _tipLocked = !_tipLocked;
      if (_tipLocked) {
        _showTooltip(_tooltipBody(p.label, p.data && p.data.value),
          ev.clientX, ev.clientY);
      } else {
        _hideTooltipNow();
      }
      _toggleSelection(p);
    });
    // Keyboard parity: Space / Enter on a focused mark toggles selection.
    fig.addEventListener('keydown', function (ev) {
      var mark = findMark(ev.target);
      if (!mark || !mark.__veChartPayload) { return; }
      if (ev.key === ' ' || ev.key === 'Enter'
          || ev.keyCode === 32 || ev.keyCode === 13) {
        ev.preventDefault();
        _toggleSelection(mark.__veChartPayload);
      }
    });
    MARK_SEL = MARK_SEL;   // silence unused-var lint without dead code

    // Phase 2.5 — group-handle observer (TRDD-352ef46a contract step 3).
    // Runtime stamps data-ve-selected="1" on every [data-ve-id] in
    // veSelection but only mounts comment-handles on table/list/section
    // containers. Charts are NOT in that container list, so this module
    // mounts its own observer to mount one .ve-comment-handle on the
    // figure whenever >=1 mark is selected.
    _wireGroupHandle(fig);
  }

  // Build / update / remove the per-figure comment-handle. Idempotent.
  // The handle delegates to window.__veOpenCommentModal (runtime hook)
  // so the existing multi-turn modal is reused — no parallel UI.
  function _updateGroupHandle(fig) {
    if (!fig || !fig.querySelectorAll) { return; }
    var selected = fig.querySelectorAll('[data-ve-selected="1"]');
    var existing = fig.querySelector(':scope > .ve-comment-handle');
    if (selected.length === 0) {
      if (existing) { existing.remove(); }
      return;
    }
    var first = selected[0];
    var figRect = fig.getBoundingClientRect();
    var firstRect = first.getBoundingClientRect();
    var topPx = firstRect.top - figRect.top + firstRect.height / 2;
    var handle = existing;
    if (!handle) {
      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 've-comment-handle ve-group-handle';
      handle.textContent = '\u{1F4AC}';   /* speech-bubble glyph */
      handle.title = 'Open comment thread for selected chart marks';
      handle.setAttribute('data-ve-overlay', '1');
      handle.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var openFn = (typeof window !== 'undefined'
          && typeof window.__veOpenCommentModal === 'function')
          ? window.__veOpenCommentModal : null;
        if (openFn) { openFn(this); }
      });
      fig.appendChild(handle);
    }
    var ids = [];
    for (var i = 0; i < selected.length; i++) {
      var mid = selected[i].getAttribute('data-ve-id');
      if (mid) { ids.push(mid); }
    }
    ids.sort();
    var figId = fig.getAttribute('data-ve-id') || fig.__veChartId || 'chart';
    handle.setAttribute('data-ve-comment-id',
      'chart:' + figId + ':' + ids.join(','));
    handle.style.top = topPx + 'px';
  }

  function _wireGroupHandle(fig) {
    if (!fig || fig.__veGroupHandleWired) { return; }
    fig.__veGroupHandleWired = true;
    _updateGroupHandle(fig);
    if (typeof MutationObserver === 'undefined') { return; }
    var mo = new MutationObserver(function () {
      _updateGroupHandle(fig);
    });
    mo.observe(fig, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ve-selected']
    });
    fig.__veGroupHandleObserver = mo;
  }

  // The hard ceiling on horizontal gridlines a chart may draw — the
  // enforced sparse-gridline guardrail (chart-spec.md §6 rule 2). Even
  // if niceTicks yields more "nice" values, _drawGrid sub-samples down
  // to at most this many rules. There are NEVER vertical gridlines.
  var MAX_GRIDLINES = 4;

  // Sub-sample a tick array down to at most MAX_GRIDLINES values while
  // always keeping the first and the last (the axis floor + ceiling) so
  // the y-scale stays readable. A 5-tick array becomes 4; smaller arrays
  // pass through untouched.
  function _capTicks(ticks) {
    if (ticks.length <= MAX_GRIDLINES) { return ticks; }
    var out = [ticks[0]];
    // Stride through the interior so the kept ticks stay evenly spaced.
    var interior = ticks.length - 2;
    var keepInterior = MAX_GRIDLINES - 2;
    if (keepInterior < 0) { keepInterior = 0; }
    var stride = interior / (keepInterior + 1);
    for (var k = 1; k <= keepInterior; k++) {
      out.push(ticks[Math.round(k * stride)]);
    }
    out.push(ticks[ticks.length - 1]);
    return out;
  }

  // Draw the sparse horizontal gridlines + y-axis tick labels. ENFORCED
  // guardrail: only niceTicks values, capped at MAX_GRIDLINES rules,
  // never vertical (chart-spec.md §6).
  function _drawGrid(svgEl, ticks, yScale, x0, x1) {
    var gGrid = svg('g', { 'class': 've-chart-gridlines' });
    var gAxis = svg('g', { 'class': 've-chart-axis' });
    var capped = _capTicks(ticks);
    for (var i = 0; i < capped.length; i++) {
      var y = yScale(capped[i]);
      gGrid.appendChild(svg('line', {
        'class': 've-chart-gridline',
        x1: x0, y1: y, x2: x1, y2: y
      }));
      var lbl = svg('text', {
        'class': 've-chart-axis-label',
        x: x0 - 8, y: y + 4, 'text-anchor': 'end'
      });
      lbl.appendChild(document.createTextNode(fmtNum(capped[i])));
      gAxis.appendChild(lbl);
    }
    svgEl.appendChild(gGrid);
    svgEl.appendChild(gAxis);
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG bar family — bar, stacked-bar, diverging-bar,
  //  lollipop, dot-plot, connected-dot-plot, bullet
  //  (chart-spec.md §2 sub-technique 3)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgBar(spec, type, fig) {
    var series = spec.series;
    var opts = spec.options || {};
    var multi = series.length > 1;
    var colors = palette(multi ? series.length : 1);
    var singleFill = 'var(--vc-color-accent, #b8861f)';

    var svgEl = _newSvg(VB_W, VB_H,
      'Bar chart: ' + (spec.title || ''));

    var plotW = VB_W - M.l - M.r;
    var plotH = VB_H - M.t - M.b;
    var x0 = M.l, x1 = VB_W - M.r;
    var yBase = M.t + plotH;

    // The category axis comes from the FIRST series' x values (every
    // series shares them in a grouped/stacked chart).
    var cats = [];
    var first = series[0].data;
    for (var c = 0; c < first.length; c++) {
      cats.push(first[c].x);
    }
    var n = cats.length;

    // Per-category index ordering — optionally sorted descending.
    var order = [];
    for (var oi = 0; oi < n; oi++) { order.push(oi); }
    var sortDesc = opts.sortDescending;
    // bar defaults to sorted unless the data is explicitly time-ordered;
    // the author opts in via options.sortDescending. Honor it for the
    // single-series case only (sorting a grouped chart is ambiguous).
    if (sortDesc && !multi) {
      order.sort(function (a, b) {
        return (first[b].y || 0) - (first[a].y || 0);
      });
    }

    var isDiverging = (type === 'diverging-bar');
    var isLollipop = (type === 'lollipop');
    var isDot = (type === 'dot-plot' || type === 'connected-dot-plot');
    var isBullet = (type === 'bullet');
    var isStacked = (type === 'stacked-bar');

    // Compute the value domain.
    var dataMax = 0, dataMin = 0;
    var si, di;
    for (si = 0; si < series.length; si++) {
      var stackTotals = {};
      for (di = 0; di < series[si].data.length; di++) {
        var v = series[si].data[di].y;
        if (!isNum(v)) { continue; }
        if (isStacked) {
          stackTotals[di] = (stackTotals[di] || 0) + v;
          if (stackTotals[di] > dataMax) { dataMax = stackTotals[di]; }
        } else {
          if (v > dataMax) { dataMax = v; }
          if (v < dataMin) { dataMin = v; }
        }
        // bullet: also fold in the qualitative range + target.
        if (isBullet) {
          var pt = series[si].data[di];
          if (isNum(pt.range) && pt.range > dataMax) { dataMax = pt.range; }
          if (isNum(pt.target) && pt.target > dataMax) { dataMax = pt.target; }
        }
      }
    }

    var tk;
    if (isDiverging) {
      tk = niceTicks(dataMin, dataMax, 4);
    } else {
      tk = niceTicks(0, dataMax, 4);
    }
    var domBottom = isDiverging ? tk.bottom : 0;
    var yScale = scale(domBottom, tk.top, yBase, M.t);
    _drawGrid(svgEl, tk.ticks, yScale, x0, x1);

    var bandW = plotW / n;
    var barW = bandW * 0.62;

    var gBars = svg('g', { 'class': 've-chart-bars' });
    var gXlabels = svg('g', { 'class': 've-chart-xlabels' });
    var gVlabels = svg('g', { 'class': 've-chart-vlabels' });

    var zeroY = isDiverging ? yScale(0) : yBase;

    for (var k = 0; k < n; k++) {
      var catIdx = order[k];
      var bandStart = x0 + k * bandW;
      var bandCenter = bandStart + bandW / 2;

      // Category label under the band.
      var xl = svg('text', {
        'class': 've-chart-axis-label',
        x: bandCenter, y: yBase + 22, 'text-anchor': 'middle'
      });
      xl.appendChild(document.createTextNode(String(cats[catIdx])));
      gXlabels.appendChild(xl);

      var stackAccum = 0;
      for (si = 0; si < series.length; si++) {
        var datum = series[si].data[catIdx];
        if (!datum) { continue; }
        var val = datum.y;
        var fill = multi ? colors[si] : singleFill;
        var markId = 've-chart-' + _chartSeq + '-d' + si + '-i' + catIdx;
        var markLabel = (series[si].label ? series[si].label + ' · ' : '')
          + String(cats[catIdx]);

        if (isLollipop) {
          // Thin stem + a circle head — far less ink than a bar.
          if (!isNum(val)) { continue; }
          var hy = yScale(val);
          gBars.appendChild(svg('line', {
            'class': 've-chart-lollipop-stem',
            x1: bandCenter, y1: yBase, x2: bandCenter, y2: hy
          }));
          var head = svg('circle', {
            'class': 've-chart-bar ve-chart-lollipop-head',
            cx: bandCenter, cy: hy, r: 5,
            fill: fill
          });
          markPoint(head, {
            id: markId, label: markLabel, value: val, chartId: fig.__veChartId,
            datasetIndex: si, datasetLabel: series[si].label,
            index: catIdx, xLabel: cats[catIdx]
          });
          svgTitle(head, markLabel + ': ' + fmtNum(val));
          gBars.appendChild(head);

        } else if (isDot) {
          if (!isNum(val)) { continue; }
          var dcx = bandCenter
            + (multi ? (si - (series.length - 1) / 2) * (barW / series.length) : 0);
          var dcy = yScale(val);
          var dot = svg('circle', {
            'class': 've-chart-bar ve-chart-dot',
            cx: dcx, cy: dcy, r: 6, fill: fill
          });
          markPoint(dot, {
            id: markId, label: markLabel, value: val, chartId: fig.__veChartId,
            datasetIndex: si, datasetLabel: series[si].label,
            index: catIdx, xLabel: cats[catIdx]
          });
          svgTitle(dot, markLabel + ': ' + fmtNum(val));
          gBars.appendChild(dot);
          // connected-dot-plot: join the two dots of a paired category.
          if (type === 'connected-dot-plot' && si === series.length - 1
              && series.length === 2) {
            var d0 = series[0].data[catIdx];
            if (d0 && isNum(d0.y)) {
              gBars.insertBefore(svg('line', {
                'class': 've-chart-connector',
                x1: bandCenter, y1: yScale(d0.y),
                x2: bandCenter, y2: dcy
              }), gBars.firstChild);
            }
          }

        } else if (isBullet) {
          // Qualitative range bg + measure bar + target tick.
          if (isNum(datum.range)) {
            gBars.appendChild(svg('rect', {
              'class': 've-chart-bullet-range',
              x: bandStart + bandW * 0.1, y: yScale(datum.range),
              width: bandW * 0.8, height: yBase - yScale(datum.range)
            }));
          }
          if (isNum(val)) {
            var mh = yBase - yScale(val);
            var measure = svg('rect', {
              'class': 've-chart-bar ve-chart-bullet-measure',
              x: bandCenter - bandW * 0.18, y: yScale(val),
              width: bandW * 0.36, height: mh < 0 ? 0 : mh,
              rx: 'var(--vc-radius-sm, 4)', fill: fill
            });
            markPoint(measure, {
              id: markId, label: markLabel, value: val,
              chartId: fig.__veChartId, datasetIndex: si,
              datasetLabel: series[si].label, index: catIdx,
              xLabel: cats[catIdx]
            });
            svgTitle(measure, markLabel + ': ' + fmtNum(val));
            gBars.appendChild(measure);
          }
          if (isNum(datum.target)) {
            gBars.appendChild(svg('line', {
              'class': 've-chart-bullet-target',
              x1: bandStart + bandW * 0.18, y1: yScale(datum.target),
              x2: bandStart + bandW * 0.82, y2: yScale(datum.target)
            }));
          }

        } else {
          // bar / stacked-bar / diverging-bar
          if (!isNum(val)) { continue; }
          var rx, ry, rw, rh;
          if (isStacked) {
            var top = stackAccum + val;
            ry = yScale(top);
            rh = yScale(stackAccum) - ry;
            stackAccum = top;
            rx = bandCenter - barW / 2;
            rw = barW;
          } else if (isDiverging) {
            rx = bandCenter - barW / 2;
            rw = barW;
            if (val >= 0) {
              ry = yScale(val);
              rh = zeroY - ry;
              fill = 'var(--vc-color-success, #3a6b5c)';
            } else {
              ry = zeroY;
              rh = yScale(val) - zeroY;
              fill = 'var(--vc-color-danger, #a84a32)';
            }
          } else {
            // grouped: each series gets a slot within the band.
            var slotW = multi ? barW / series.length : barW;
            rx = bandCenter - barW / 2 + si * slotW;
            rw = slotW * (multi ? 0.86 : 1);
            ry = yScale(val);
            rh = yBase - ry;
          }
          if (rh < 0) { rh = 0; }
          var bar = svg('rect', {
            'class': 've-chart-bar',
            x: rx, y: ry, width: rw, height: rh,
            rx: 'var(--vc-radius-sm, 4)',
            fill: fill
          });
          markPoint(bar, {
            id: markId, label: markLabel, value: val,
            chartId: fig.__veChartId, datasetIndex: si,
            datasetLabel: series[si].label, index: catIdx,
            xLabel: cats[catIdx]
          });
          svgTitle(bar, markLabel + ': ' + fmtNum(val));
          // Stagger the entry: transform-origin at the baseline.
          bar.style.transformOrigin = rx + 'px ' + yBase + 'px';
          bar.style.animationDelay = (k * STAGGER_MS) + 'ms';
          gBars.appendChild(bar);

          // Value label above non-stacked bars when asked.
          if (opts.valueLabels && !isStacked) {
            var vl = svg('text', {
              'class': 've-chart-value-label',
              x: rx + rw / 2, y: ry - 6, 'text-anchor': 'middle'
            });
            vl.appendChild(document.createTextNode(fmtNum(val)));
            gVlabels.appendChild(vl);
          }
        }
      }
    }

    // The zero baseline (diverging) / x-axis baseline.
    svgEl.appendChild(svg('line', {
      'class': 've-chart-baseline',
      x1: x0, y1: zeroY, x2: x1, y2: zeroY
    }));
    svgEl.appendChild(gBars);
    svgEl.appendChild(gXlabels);
    svgEl.appendChild(gVlabels);
    fig.appendChild(svgEl);

    if (multi) {
      var labels = [];
      for (si = 0; si < series.length; si++) {
        labels.push(series[si].label || ('Series ' + (si + 1)));
      }
      _appendLegend(fig, labels, colors);
    }
    // Entry animation: add the .ve-chart-animate class once in view so
    // the CSS keyframe (which is gated by that class) runs.
    animateOnView(fig, function () {
      fig.classList.add('ve-chart-animate');
    });
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG line/area family — line, area, step-area, slope, bump
  //  (chart-spec.md §2 sub-technique 4)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgLine(spec, type, fig) {
    var series = spec.series;
    var multi = series.length > 1;
    var colors = palette(multi ? series.length : 1);
    var svgEl = _newSvg(VB_W, VB_H,
      'Line chart: ' + (spec.title || ''));

    var plotW = VB_W - M.l - M.r;
    var plotH = VB_H - M.t - M.b;
    var x0 = M.l, x1 = VB_W - M.r;
    var yBase = M.t + plotH;

    // Category axis from the first series.
    var cats = [];
    var first = series[0].data;
    for (var c = 0; c < first.length; c++) { cats.push(first[c].x); }
    var n = cats.length;

    // Value domain across every series.
    var dataMax = 0, dataMin = 0, si, di;
    var isBump = (type === 'bump');
    if (isBump) {
      // bump: y is a RANK — domain is 1..(series count).
      dataMin = 1;
      dataMax = series.length;
    } else {
      for (si = 0; si < series.length; si++) {
        for (di = 0; di < series[si].data.length; di++) {
          var v = series[si].data[di].y;
          if (!isNum(v)) { continue; }
          if (v > dataMax) { dataMax = v; }
          if (v < dataMin) { dataMin = v; }
        }
      }
    }
    var tk = niceTicks(Math.min(0, dataMin), dataMax, 4);
    var yScale, xScale;
    if (isBump) {
      // Inverted: rank 1 at the top.
      yScale = scale(1, series.length, M.t, yBase);
    } else {
      yScale = scale(tk.bottom, tk.top, yBase, M.t);
      _drawGrid(svgEl, tk.ticks, yScale, x0, x1);
    }
    // x positions at band centers.
    xScale = function (idx) {
      if (n <= 1) { return x0 + plotW / 2; }
      if (type === 'slope') {
        return idx === 0 ? x0 + plotW * 0.12 : x1 - plotW * 0.12;
      }
      return x0 + (plotW / (n - 1)) * idx;
    };

    var isArea = (type === 'area' || type === 'step-area');
    var isStep = (type === 'step-area');
    var isSlope = (type === 'slope');

    var defsAdded = false;

    var gPoints = svg('g', { 'class': 've-chart-points' });
    var gLabels = svg('g', { 'class': 've-chart-line-labels' });

    for (si = 0; si < series.length; si++) {
      var stroke = multi ? colors[si] : 'var(--vc-color-accent, #b8861f)';
      var pts = [];
      var data = series[si].data;
      for (di = 0; di < data.length; di++) {
        var yv;
        if (isBump) { yv = data[di].rank; }
        else { yv = data[di].y; }
        if (!isNum(yv)) { continue; }
        pts.push({ x: xScale(di), y: yScale(yv), v: data[di].y, idx: di });
      }
      if (!pts.length) { continue; }

      // Area fill — closed path down to the baseline, OKLCH gradient.
      if (isArea) {
        if (!defsAdded) {
          var defs = svg('defs');
          var grad = svg('linearGradient', {
            id: fig.__veChartId + '-fill', x1: 0, y1: 0, x2: 0, y2: 1
          });
          grad.appendChild(svg('stop', {
            offset: '0%', 'stop-color': 'var(--vc-color-accent, #b8861f)',
            'stop-opacity': '0.22'
          }));
          grad.appendChild(svg('stop', {
            offset: '100%', 'stop-color': 'var(--vc-color-accent, #b8861f)',
            'stop-opacity': '0'
          }));
          defs.appendChild(grad);
          svgEl.appendChild(defs);
          defsAdded = true;
        }
        var topPath = isStep ? stepPath(pts) : catmullRom(pts);
        var areaD = topPath
          + ' L' + pts[pts.length - 1].x.toFixed(2) + ' ' + yBase
          + ' L' + pts[0].x.toFixed(2) + ' ' + yBase + ' Z';
        svgEl.appendChild(svg('path', {
          'class': 've-chart-area',
          d: areaD, fill: 'url(#' + fig.__veChartId + '-fill)'
        }));
      }

      // The line itself.
      var lineD;
      if (isStep) { lineD = stepPath(pts); }
      else if (isSlope || isBump || pts.length === 2) { lineD = linePath(pts); }
      else { lineD = catmullRom(pts); }
      // bump uses the smooth curve too.
      if (isBump && pts.length > 2) { lineD = catmullRom(pts); }
      var path = svg('path', {
        'class': 've-chart-line',
        d: lineD, fill: 'none', stroke: stroke
      });
      // Draw-on entry: dash the whole path, then transition the offset
      // to 0 once in view. Uses getTotalLength when available.
      path.__veStroke = stroke;
      svgEl.appendChild(path);

      // Points — a circle per datum, marked + selectable.
      for (var pi = 0; pi < pts.length; pi++) {
        var p = pts[pi];
        var markId = 've-chart-' + _chartSeq + '-d' + si + '-i' + p.idx;
        var markLabel = (series[si].label ? series[si].label + ' · ' : '')
          + String(cats[p.idx]);
        var dot = svg('circle', {
          'class': 've-chart-point',
          cx: p.x, cy: p.y, r: 4, fill: stroke
        });
        markPoint(dot, {
          id: markId, label: markLabel, value: p.v,
          chartId: fig.__veChartId, datasetIndex: si,
          datasetLabel: series[si].label, index: p.idx,
          xLabel: cats[p.idx]
        });
        svgTitle(dot, markLabel + ': ' + fmtNum(p.v));
        gPoints.appendChild(dot);
      }

      // slope / bump: a label at each end of the series.
      if (isSlope || isBump) {
        var endP = pts[pts.length - 1];
        var lbl = svg('text', {
          'class': 've-chart-series-label',
          x: endP.x + 8, y: endP.y + 4, 'text-anchor': 'start'
        });
        lbl.appendChild(document.createTextNode(
          series[si].label || ('Series ' + (si + 1))));
        gLabels.appendChild(lbl);
      }
    }

    // Category labels along the x-axis (skip for slope — it labels ends).
    if (!isSlope) {
      var gX = svg('g', { 'class': 've-chart-xlabels' });
      for (var xi = 0; xi < n; xi++) {
        var xt = svg('text', {
          'class': 've-chart-axis-label',
          x: xScale(xi), y: yBase + 22, 'text-anchor': 'middle'
        });
        xt.appendChild(document.createTextNode(String(cats[xi])));
        gX.appendChild(xt);
      }
      svgEl.appendChild(gX);
    }
    svgEl.appendChild(gPoints);
    svgEl.appendChild(gLabels);
    fig.appendChild(svgEl);

    if (multi && !isSlope && !isBump) {
      var labels = [];
      for (si = 0; si < series.length; si++) {
        labels.push(series[si].label || ('Series ' + (si + 1)));
      }
      _appendLegend(fig, labels, colors);
    }

    // Draw-on entry animation, fired once in view.
    animateOnView(fig, function () {
      var lines = svgEl.querySelectorAll('.ve-chart-line');
      for (var i = 0; i < lines.length; i++) {
        (function (ln, ord) {
          if (REDUCED) { return; }
          var len = 0;
          try { len = ln.getTotalLength(); } catch (e) { len = 0; }
          if (!len) { return; }
          ln.style.strokeDasharray = len;
          ln.style.strokeDashoffset = len;
          // Force a reflow so the transition starts from the dashed
          // state, then animate the offset to 0.
          void ln.getBoundingClientRect();
          ln.style.transition = 'stroke-dashoffset '
            + 'var(--vc-duration-slow, 600ms) '
            + 'var(--vc-easing-decel, cubic-bezier(0,0,0,1)) '
            + (ord * 0.12) + 's';
          ln.style.strokeDashoffset = '0';
        })(lines[i], i);
      }
      fig.classList.add('ve-chart-animate');
    });
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG McKinsey flow family — waterfall, funnel, mekko
  //  (chart-spec.md §2 sub-technique 5)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgMcKinsey(spec, type, fig) {
    if (type === 'waterfall') { return _renderWaterfall(spec, fig); }
    if (type === 'funnel') { return _renderFunnel(spec, fig); }
    return _renderMekko(spec, fig);
  }

  function _renderWaterfall(spec, fig) {
    var data = spec.series[0].data;
    var svgEl = _newSvg(VB_W, VB_H, 'Waterfall: ' + (spec.title || ''));
    var plotW = VB_W - M.l - M.r;
    var plotH = VB_H - M.t - M.b;
    var x0 = M.l, x1 = VB_W - M.r;
    var yBase = M.t + plotH;

    // Walk the steps accumulating a running total to find the domain.
    var running = 0, lo = 0, hi = 0, di;
    var levels = [];
    for (di = 0; di < data.length; di++) {
      var delta = data[di].delta;
      if (data[di].isTotal) {
        levels.push({ base: 0, top: running, isTotal: true });
        if (running > hi) { hi = running; }
        if (running < lo) { lo = running; }
      } else {
        if (!isNum(delta)) { delta = 0; }
        var base = running;
        running += delta;
        levels.push({ base: base, top: running, isTotal: false, delta: delta });
        if (running > hi) { hi = running; }
        if (running < lo) { lo = running; }
        if (base > hi) { hi = base; }
        if (base < lo) { lo = base; }
      }
    }
    var tk = niceTicks(Math.min(0, lo), hi, 4);
    var yScale = scale(tk.bottom, tk.top, yBase, M.t);
    _drawGrid(svgEl, tk.ticks, yScale, x0, x1);

    var bandW = plotW / data.length;
    var barW = bandW * 0.6;
    var gWf = svg('g', { 'class': 've-chart-waterfall' });
    var gX = svg('g', { 'class': 've-chart-xlabels' });

    for (di = 0; di < levels.length; di++) {
      var lv = levels[di];
      var bandCenter = x0 + di * bandW + bandW / 2;
      var yTop = yScale(Math.max(lv.base, lv.top));
      var yBot = yScale(Math.min(lv.base, lv.top));
      var cls = 've-chart-wf-bar';
      var fill;
      if (lv.isTotal) {
        cls += ' ve-chart-wf-bar--total';
        fill = 'var(--vc-color-accent, #b8861f)';
      } else if (lv.delta >= 0) {
        cls += ' ve-chart-wf-bar--rise';
        fill = 'var(--vc-color-success, #3a6b5c)';
      } else {
        cls += ' ve-chart-wf-bar--fall';
        fill = 'var(--vc-color-danger, #a84a32)';
      }
      var h = yBot - yTop;
      var bar = svg('rect', {
        'class': cls,
        x: bandCenter - barW / 2, y: yTop, width: barW,
        height: h < 0 ? 0 : h, rx: 'var(--vc-radius-sm, 4)', fill: fill
      });
      var label = String(data[di].x != null ? data[di].x : ('Step ' + (di + 1)));
      var value = lv.isTotal ? lv.top : lv.delta;
      markPoint(bar, {
        id: 've-chart-' + _chartSeq + '-d0-i' + di,
        label: label, value: value, chartId: fig.__veChartId,
        datasetIndex: 0, datasetLabel: spec.series[0].label,
        index: di, xLabel: data[di].x
      });
      svgTitle(bar, label + ': ' + fmtNum(value));
      gWf.appendChild(bar);

      // Connector to the next step's base level.
      if (di < levels.length - 1) {
        var nextBase = levels[di + 1].isTotal ? 0 : levels[di + 1].base;
        gWf.appendChild(svg('line', {
          'class': 've-chart-wf-connector',
          x1: bandCenter + barW / 2, y1: yScale(lv.top),
          x2: bandCenter + bandW - barW / 2, y2: yScale(nextBase)
        }));
      }

      var xt = svg('text', {
        'class': 've-chart-axis-label',
        x: bandCenter, y: yBase + 22, 'text-anchor': 'middle'
      });
      xt.appendChild(document.createTextNode(label));
      gX.appendChild(xt);
    }
    svgEl.appendChild(svg('line', {
      'class': 've-chart-baseline',
      x1: x0, y1: yScale(0), x2: x1, y2: yScale(0)
    }));
    svgEl.appendChild(gWf);
    svgEl.appendChild(gX);
    fig.appendChild(svgEl);
    _appendSource(fig, spec.source);
    animateOnView(fig, function () { fig.classList.add('ve-chart-animate'); });
  }

  function _renderFunnel(spec, fig) {
    var data = spec.series[0].data;
    var svgEl = _newSvg(VB_W, VB_H, 'Funnel: ' + (spec.title || ''));
    var plotW = VB_W - M.l - M.r;
    var plotH = VB_H - M.t - M.b;
    var midX = M.l + plotW / 2;
    var n = data.length;
    var stageH = plotH / n;

    var maxV = 0, di;
    for (di = 0; di < n; di++) {
      if (isNum(data[di].y) && data[di].y > maxV) { maxV = data[di].y; }
    }
    if (maxV <= 0) { maxV = 1; }

    var gFunnel = svg('g', { 'class': 've-chart-funnel' });
    for (di = 0; di < n; di++) {
      var v = isNum(data[di].y) ? data[di].y : 0;
      var nextV = (di < n - 1 && isNum(data[di + 1].y)) ? data[di + 1].y : v;
      var wTop = (v / maxV) * plotW;
      var wBot = (nextV / maxV) * plotW;
      var yTop = M.t + di * stageH;
      var yBot = yTop + stageH * 0.82;
      // A trapezoid: wide at top, narrowing to the next stage's width.
      var pts = [
        (midX - wTop / 2) + ',' + yTop,
        (midX + wTop / 2) + ',' + yTop,
        (midX + wBot / 2) + ',' + yBot,
        (midX - wBot / 2) + ',' + yBot
      ].join(' ');
      var stage = svg('polygon', {
        'class': 've-chart-funnel-stage',
        points: pts,
        fill: ramp(1 - di / Math.max(1, n - 1), 'sequential')
      });
      var label = String(data[di].x != null ? data[di].x : ('Stage ' + (di + 1)));
      markPoint(stage, {
        id: 've-chart-' + _chartSeq + '-d0-i' + di,
        label: label, value: v, chartId: fig.__veChartId,
        datasetIndex: 0, datasetLabel: spec.series[0].label,
        index: di, xLabel: data[di].x
      });
      svgTitle(stage, label + ': ' + fmtNum(v));
      gFunnel.appendChild(stage);

      // Stage label + value centered.
      var lbl = svg('text', {
        'class': 've-chart-funnel-label',
        x: midX, y: yTop + stageH * 0.34, 'text-anchor': 'middle'
      });
      lbl.appendChild(document.createTextNode(label + '  ' + fmtNum(v)));
      gFunnel.appendChild(lbl);

      // Drop-off % to the next stage.
      if (di < n - 1 && v > 0) {
        var drop = Math.round((1 - nextV / v) * 100);
        var dlbl = svg('text', {
          'class': 've-chart-funnel-drop',
          x: midX, y: yBot + (stageH * 0.18) / 2 + 4,
          'text-anchor': 'middle'
        });
        dlbl.appendChild(document.createTextNode('↓ ' + drop + '% drop'));
        gFunnel.appendChild(dlbl);
      }
    }
    svgEl.appendChild(gFunnel);
    fig.appendChild(svgEl);
    _appendSource(fig, spec.source);
    animateOnView(fig, function () { fig.classList.add('ve-chart-animate'); });
  }

  function _renderMekko(spec, fig) {
    // Marimekko: column widths proportional to a column total (x-axis),
    // each column internally stacked 0..100% (y-axis).
    var series = spec.series;
    var svgEl = _newSvg(VB_W, VB_H, 'Marimekko: ' + (spec.title || ''));
    var plotW = VB_W - M.l - M.r;
    var plotH = VB_H - M.t - M.b;
    var x0 = M.l;
    var yTop = M.t, yBot = M.t + plotH;

    // Columns come from the first series' x values; each series is a
    // segment band. Column total = sum of every series' y at that x.
    var first = series[0].data;
    var cols = [];
    var ci, si;
    for (ci = 0; ci < first.length; ci++) {
      var total = 0;
      for (si = 0; si < series.length; si++) {
        var dv = series[si].data[ci];
        if (dv && isNum(dv.y)) { total += dv.y; }
      }
      cols.push({ x: first[ci].x, total: total });
    }
    var grandTotal = 0;
    for (ci = 0; ci < cols.length; ci++) { grandTotal += cols[ci].total; }
    if (grandTotal <= 0) { grandTotal = 1; }

    var colors = palette(series.length);
    var gMekko = svg('g', { 'class': 've-chart-mekko' });
    var gX = svg('g', { 'class': 've-chart-xlabels' });

    var cx = x0;
    for (ci = 0; ci < cols.length; ci++) {
      var colW = (cols[ci].total / grandTotal) * plotW;
      var segAccum = 0;
      var colTotal = cols[ci].total > 0 ? cols[ci].total : 1;
      for (si = 0; si < series.length; si++) {
        var seg = series[si].data[ci];
        var sv = (seg && isNum(seg.y)) ? seg.y : 0;
        var frac = sv / colTotal;
        var segH = frac * plotH;
        var segY = yTop + segAccum;
        segAccum += segH;
        var cell = svg('rect', {
          'class': 've-chart-mekko-cell',
          x: cx, y: segY, width: colW < 0 ? 0 : colW,
          height: segH < 0 ? 0 : segH, fill: colors[si]
        });
        var label = (series[si].label ? series[si].label + ' · ' : '')
          + String(cols[ci].x);
        markPoint(cell, {
          id: 've-chart-' + _chartSeq + '-d' + si + '-i' + ci,
          label: label, value: sv, chartId: fig.__veChartId,
          datasetIndex: si, datasetLabel: series[si].label,
          index: ci, xLabel: cols[ci].x
        });
        svgTitle(cell, label + ': ' + fmtNum(sv));
        gMekko.appendChild(cell);
      }
      var xt = svg('text', {
        'class': 've-chart-axis-label',
        x: cx + colW / 2, y: yBot + 22, 'text-anchor': 'middle'
      });
      xt.appendChild(document.createTextNode(String(cols[ci].x)));
      gX.appendChild(xt);
      cx += colW;
    }
    svgEl.appendChild(gMekko);
    svgEl.appendChild(gX);
    fig.appendChild(svgEl);

    var labels = [];
    for (si = 0; si < series.length; si++) {
      labels.push(series[si].label || ('Series ' + (si + 1)));
    }
    _appendLegend(fig, labels, colors);
    _appendSource(fig, spec.source);
    animateOnView(fig, function () { fig.classList.add('ve-chart-animate'); });
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG circular — donut, gauge, harvey-ball
  //  (chart-spec.md §2 sub-technique 7)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgCircular(spec, type, fig) {
    if (type === 'gauge') { return _renderGauge(spec, fig); }
    if (type === 'harvey-ball') { return _renderHarveyBall(spec, fig); }
    return _renderDonut(spec, fig);
  }

  function _renderDonut(spec, fig) {
    var data = spec.series[0].data;
    var side = VB_DONUT;
    var svgEl = _newSvg(side, side, 'Donut: ' + (spec.title || ''));
    var cx = side / 2, cy = side / 2;
    var rOuter = side * 0.40;
    var rInner = rOuter * 0.62;     // a true hole — never 0, never a pie.

    var total = 0, di;
    for (di = 0; di < data.length; di++) {
      if (isNum(data[di].y)) { total += data[di].y; }
    }
    if (total <= 0) { total = 1; }

    var colors = palette(data.length);
    var g = svg('g', { 'class': 've-chart-donut' });
    var angle = 0;
    var arcs = [];
    for (di = 0; di < data.length; di++) {
      var v = isNum(data[di].y) ? data[di].y : 0;
      var sweep = (v / total) * 360;
      var a0 = angle, a1 = angle + sweep;
      angle = a1;
      var arc = svg('path', {
        'class': 've-chart-arc',
        d: describeArc(cx, cy, rOuter, rInner, a0, a1),
        fill: colors[di]
      });
      var label = String(data[di].x != null ? data[di].x : ('Slice ' + (di + 1)));
      markPoint(arc, {
        id: 've-chart-' + _chartSeq + '-d0-i' + di,
        label: label, value: v, chartId: fig.__veChartId,
        datasetIndex: 0, datasetLabel: spec.series[0].label,
        index: di, xLabel: data[di].x
      });
      svgTitle(arc, label + ': ' + fmtNum(v)
        + ' (' + Math.round((v / total) * 100) + '%)');
      arc.__veArc = { cx: cx, cy: cy, rO: rOuter, rI: rInner, a0: a0, a1: a1 };
      g.appendChild(arc);
      arcs.push(arc);
    }
    svgEl.appendChild(g);

    // Center text — the total (or a hovered value, updated on hover).
    var center = svg('text', {
      'class': 've-chart-donut-center', x: cx, y: cy + 6,
      'text-anchor': 'middle'
    });
    center.appendChild(document.createTextNode(fmtNum(total)));
    svgEl.appendChild(center);
    fig.appendChild(svgEl);

    var labels = [];
    for (di = 0; di < data.length; di++) {
      labels.push(String(data[di].x != null ? data[di].x : ('Slice ' + (di + 1))));
    }
    _appendLegend(fig, labels, colors);
    _appendSource(fig, spec.source);

    // Sweep entry: animate each arc's end angle from a0 -> a1.
    animateOnView(fig, function () {
      if (REDUCED || typeof requestAnimationFrame !== 'function') { return; }
      var startT = null;
      var dur = 480;
      function frame(now) {
        if (startT === null) { startT = now; }
        var t = (now - startT) / dur;
        if (t > 1) { t = 1; }
        var eased = 1 - Math.pow(1 - t, 3);
        for (var i = 0; i < arcs.length; i++) {
          var a = arcs[i].__veArc;
          var stagger = i / Math.max(1, arcs.length);
          var local = (eased - stagger * 0.3) / (1 - stagger * 0.3);
          if (local < 0) { local = 0; }
          if (local > 1) { local = 1; }
          var curEnd = a.a0 + (a.a1 - a.a0) * local;
          arcs[i].setAttribute('d',
            describeArc(a.cx, a.cy, a.rO, a.rI, a.a0, curEnd));
        }
        if (t < 1) { requestAnimationFrame(frame); }
      }
      // Start every arc collapsed.
      for (var j = 0; j < arcs.length; j++) {
        var aj = arcs[j].__veArc;
        arcs[j].setAttribute('d',
          describeArc(aj.cx, aj.cy, aj.rO, aj.rI, aj.a0, aj.a0));
      }
      requestAnimationFrame(frame);
    });
  }

  function _renderGauge(spec, fig) {
    var data = spec.series[0].data;
    var opts = spec.options || {};
    var value = isNum(data[0] && data[0].y) ? data[0].y : 0;
    var maxV = isNum(opts.max) ? opts.max : 100;
    if (maxV <= 0) { maxV = 100; }
    var side = VB_DONUT;
    var svgEl = _newSvg(side, side * 0.62, 'Gauge: ' + (spec.title || ''));
    var cx = side / 2, cy = side * 0.52;
    var rOuter = side * 0.40;
    var rInner = rOuter * 0.74;
    // A 270° sweep from -135° to +135° (here expressed 0deg=12 o'clock,
    // so -135..+135 maps to the polar helper's input directly).
    var sweepSpan = 270;
    var startA = -135;
    // Track arc.
    svgEl.appendChild(svg('path', {
      'class': 've-chart-gauge-track',
      d: describeArc(cx, cy, rOuter, rInner, startA, startA + sweepSpan),
      fill: 'var(--vc-color-border, #e3dcc9)'
    }));
    var frac = value / maxV;
    if (frac < 0) { frac = 0; }
    if (frac > 1) { frac = 1; }
    var valFill = 'var(--vc-color-accent, #b8861f)';
    if (isNum(opts.warnAt) && value >= opts.warnAt) {
      valFill = 'var(--vc-color-warning, #a8791f)';
    }
    if (isNum(opts.dangerAt) && value >= opts.dangerAt) {
      valFill = 'var(--vc-color-danger, #a84a32)';
    }
    var valArc = svg('path', {
      'class': 've-chart-arc ve-chart-gauge-value',
      d: describeArc(cx, cy, rOuter, rInner, startA, startA + sweepSpan * frac),
      fill: valFill
    });
    markPoint(valArc, {
      id: 've-chart-' + _chartSeq + '-d0-i0',
      label: spec.title || 'value', value: value,
      chartId: fig.__veChartId, datasetIndex: 0,
      datasetLabel: spec.series[0].label, index: 0,
      xLabel: data[0] && data[0].x
    });
    svgTitle(valArc, (spec.title || 'value') + ': ' + fmtNum(value)
      + ' / ' + fmtNum(maxV));
    valArc.__veGauge = { cx: cx, cy: cy, rO: rOuter, rI: rInner,
      startA: startA, span: sweepSpan, frac: frac };
    svgEl.appendChild(valArc);
    // Center value text.
    var center = svg('text', {
      'class': 've-chart-donut-center', x: cx, y: cy + 4,
      'text-anchor': 'middle'
    });
    center.appendChild(document.createTextNode(fmtNum(value)));
    svgEl.appendChild(center);
    fig.appendChild(svgEl);
    _appendSource(fig, spec.source);

    animateOnView(fig, function () {
      if (REDUCED || typeof requestAnimationFrame !== 'function') { return; }
      var gz = valArc.__veGauge;
      var startT = null, dur = 520;
      function frame(now) {
        if (startT === null) { startT = now; }
        var t = (now - startT) / dur;
        if (t > 1) { t = 1; }
        var eased = 1 - Math.pow(1 - t, 3);
        valArc.setAttribute('d', describeArc(gz.cx, gz.cy, gz.rO, gz.rI,
          gz.startA, gz.startA + gz.span * gz.frac * eased));
        if (t < 1) { requestAnimationFrame(frame); }
      }
      valArc.setAttribute('d', describeArc(gz.cx, gz.cy, gz.rO, gz.rI,
        gz.startA, gz.startA));
      requestAnimationFrame(frame);
    });
  }

  function _renderHarveyBall(spec, fig) {
    // One filled circle per datum, filled 0/25/50/75/100% — the
    // McKinsey qualitative-rating glyph, laid out in a row.
    var data = spec.series[0].data;
    var n = data.length;
    var ballSide = 96;
    var gap = 24;
    var totalW = n * ballSide + (n - 1) * gap;
    var svgEl = _newSvg(Math.max(totalW + 40, 200), ballSide + 60,
      'Harvey balls: ' + (spec.title || ''));
    var g = svg('g', { 'class': 've-chart-harvey' });
    var startX = 20;
    for (var di = 0; di < n; di++) {
      var v = isNum(data[di].y) ? data[di].y : 0;
      if (v < 0) { v = 0; }
      if (v > 1) { v = v / 100; }       // accept 0..100 or 0..1
      if (v > 1) { v = 1; }
      var cx = startX + di * (ballSide + gap) + ballSide / 2;
      var cy = 20 + ballSide / 2;
      var r = ballSide / 2 - 2;
      // Outline circle.
      g.appendChild(svg('circle', {
        'class': 've-chart-harvey-ring',
        cx: cx, cy: cy, r: r,
        fill: 'var(--vc-color-surface, #ffffff)',
        stroke: 'var(--vc-color-border-strong, #c9bfa3)'
      }));
      // Filled wedge.
      if (v > 0) {
        var wedge = svg('path', {
          'class': 've-chart-arc ve-chart-harvey-fill',
          d: describeArc(cx, cy, r, 0, 0, 360 * v),
          fill: 'var(--vc-color-accent, #b8861f)'
        });
        var label = String(data[di].x != null ? data[di].x : ('Item ' + (di + 1)));
        markPoint(wedge, {
          id: 've-chart-' + _chartSeq + '-d0-i' + di,
          label: label, value: Math.round(v * 100),
          chartId: fig.__veChartId, datasetIndex: 0,
          datasetLabel: spec.series[0].label, index: di,
          xLabel: data[di].x
        });
        svgTitle(wedge, label + ': ' + Math.round(v * 100) + '%');
        g.appendChild(wedge);
      }
      // Label under the ball.
      var lbl = svg('text', {
        'class': 've-chart-axis-label',
        x: cx, y: 20 + ballSide + 22, 'text-anchor': 'middle'
      });
      lbl.appendChild(document.createTextNode(
        String(data[di].x != null ? data[di].x : ('Item ' + (di + 1)))));
      g.appendChild(lbl);
    }
    svgEl.appendChild(g);
    fig.appendChild(svgEl);
    _appendSource(fig, spec.source);
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG radar (spider)
  //  (chart-spec.md §2 sub-technique 8)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgRadar(spec, _type, fig) {
    var series = spec.series;
    var side = VB_SQUARE;
    var svgEl = _newSvg(side, side, 'Radar chart: ' + (spec.title || ''));
    var cx = side / 2, cy = side / 2;
    var rMax = side * 0.34;

    // Axes from the first series' x values.
    var axes = [];
    var first = series[0].data;
    for (var a = 0; a < first.length; a++) { axes.push(first[a].x); }
    var nAxes = axes.length;
    if (nAxes < 3) { nAxes = first.length; }   // radar needs >=3 axes ideally

    // Value domain (shared across series).
    var maxV = 0, si, di;
    for (si = 0; si < series.length; si++) {
      for (di = 0; di < series[si].data.length; di++) {
        if (isNum(series[si].data[di].y)
            && series[si].data[di].y > maxV) {
          maxV = series[si].data[di].y;
        }
      }
    }
    if (maxV <= 0) { maxV = 1; }

    function axisAngle(k) { return -90 + k * (360 / nAxes); }

    // Concentric grid rings at 25/50/75/100%.
    var gGrid = svg('g', { 'class': 've-chart-radar-grid' });
    var rings = [0.25, 0.5, 0.75, 1];
    for (var ri = 0; ri < rings.length; ri++) {
      var ringPts = [];
      for (var rk = 0; rk < nAxes; rk++) {
        var rp = polarToCartesian(cx, cy, rMax * rings[ri], axisAngle(rk) + 90);
        ringPts.push(rp.x.toFixed(2) + ',' + rp.y.toFixed(2));
      }
      gGrid.appendChild(svg('polygon', {
        'class': 've-chart-radar-ring',
        points: ringPts.join(' '), fill: 'none'
      }));
    }
    // Spokes.
    var gSpokes = svg('g', { 'class': 've-chart-radar-spokes' });
    for (var sk = 0; sk < nAxes; sk++) {
      var sp = polarToCartesian(cx, cy, rMax, axisAngle(sk) + 90);
      gSpokes.appendChild(svg('line', {
        'class': 've-chart-radar-spoke',
        x1: cx, y1: cy, x2: sp.x, y2: sp.y
      }));
    }
    svgEl.appendChild(gGrid);
    svgEl.appendChild(gSpokes);

    var colors = palette(series.length > 1 ? series.length : 1);
    var gVerts = svg('g', { 'class': 've-chart-radar-vertices' });
    var polys = [];

    for (si = 0; si < series.length; si++) {
      var color = series.length > 1
        ? colors[si] : 'var(--vc-color-accent, #b8861f)';
      var verts = [];
      for (var vk = 0; vk < nAxes; vk++) {
        var dv = series[si].data[vk];
        var val = (dv && isNum(dv.y)) ? dv.y : 0;
        var rr = rMax * (val / maxV);
        var vp = polarToCartesian(cx, cy, rr, axisAngle(vk) + 90);
        verts.push({ x: vp.x, y: vp.y, val: val, axis: axes[vk], idx: vk });
      }
      var poly = svg('polygon', {
        'class': 've-chart-radar-area',
        points: verts.map(function (p) {
          return p.x.toFixed(2) + ',' + p.y.toFixed(2);
        }).join(' '),
        fill: color, 'fill-opacity': '0.18', stroke: color
      });
      poly.__veRadar = { cx: cx, cy: cy, verts: verts };
      svgEl.appendChild(poly);
      polys.push(poly);

      // Vertex circles.
      for (var pk = 0; pk < verts.length; pk++) {
        var p = verts[pk];
        var markLabel = (series[si].label ? series[si].label + ' · ' : '')
          + String(p.axis);
        var vc = svg('circle', {
          'class': 've-chart-point',
          cx: p.x, cy: p.y, r: 4, fill: color
        });
        markPoint(vc, {
          id: 've-chart-' + _chartSeq + '-d' + si + '-i' + p.idx,
          label: markLabel, value: p.val, chartId: fig.__veChartId,
          datasetIndex: si, datasetLabel: series[si].label,
          index: p.idx, xLabel: p.axis
        });
        svgTitle(vc, markLabel + ': ' + fmtNum(p.val));
        gVerts.appendChild(vc);
      }
    }
    svgEl.appendChild(gVerts);

    // Axis labels just outside the outermost ring.
    var gLabels = svg('g', { 'class': 've-chart-radar-labels' });
    for (var lk = 0; lk < nAxes; lk++) {
      var lp = polarToCartesian(cx, cy, rMax + 22, axisAngle(lk) + 90);
      var anchor = 'middle';
      if (lp.x < cx - 4) { anchor = 'end'; }
      else if (lp.x > cx + 4) { anchor = 'start'; }
      var tl = svg('text', {
        'class': 've-chart-axis-label',
        x: lp.x, y: lp.y + 4, 'text-anchor': anchor
      });
      tl.appendChild(document.createTextNode(String(axes[lk])));
      gLabels.appendChild(tl);
    }
    svgEl.appendChild(gLabels);
    fig.appendChild(svgEl);

    if (series.length > 1) {
      var labels = [];
      for (si = 0; si < series.length; si++) {
        labels.push(series[si].label || ('Series ' + (si + 1)));
      }
      _appendLegend(fig, labels, colors);
    }
    _appendSource(fig, spec.source);

    // Inflate entry: polygon points scale 0 -> 1 from the center.
    animateOnView(fig, function () {
      if (REDUCED || typeof requestAnimationFrame !== 'function') { return; }
      var startT = null, dur = 560;
      function frame(now) {
        if (startT === null) { startT = now; }
        var t = (now - startT) / dur;
        if (t > 1) { t = 1; }
        var eased = 1 - Math.pow(1 - t, 3);
        for (var i = 0; i < polys.length; i++) {
          var rd = polys[i].__veRadar;
          var stagger = i / Math.max(1, polys.length);
          var local = (eased - stagger * 0.3) / (1 - stagger * 0.3);
          if (local < 0) { local = 0; }
          if (local > 1) { local = 1; }
          var pstr = rd.verts.map(function (p) {
            var px = rd.cx + (p.x - rd.cx) * local;
            var py = rd.cy + (p.y - rd.cy) * local;
            return px.toFixed(2) + ',' + py.toFixed(2);
          }).join(' ');
          polys[i].setAttribute('points', pstr);
        }
        if (t < 1) { requestAnimationFrame(frame); }
      }
      for (var j = 0; j < polys.length; j++) {
        var rdj = polys[j].__veRadar;
        var collapsed = [];
        for (var v = 0; v < rdj.verts.length; v++) {
          collapsed.push(rdj.cx + ',' + rdj.cy);
        }
        polys[j].setAttribute('points', collapsed.join(' '));
      }
      requestAnimationFrame(frame);
    });
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: SVG grid — heatmap, matrix, activity-heatmap
  //  (chart-spec.md §2 sub-technique 11)
  // ──────────────────────────────────────────────────────────────────

  function renderSvgGrid(spec, type, fig) {
    var opts = spec.options || {};
    // Data is a 2-D grid. Accept either `series[0].data` as rows of
    // {row,col,value} or a `grid` 2-D array under options/spec.
    var cells = _gridCells(spec);
    if (!cells.length) {
      throw new Error('heatmap needs a non-empty grid of cells');
    }
    var maxRow = 0, maxCol = 0, maxV = 0, i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i].row > maxRow) { maxRow = cells[i].row; }
      if (cells[i].col > maxCol) { maxCol = cells[i].col; }
      if (isNum(cells[i].value) && cells[i].value > maxV) {
        maxV = cells[i].value;
      }
    }
    var nRows = maxRow + 1, nCols = maxCol + 1;
    var labelL = 64, labelT = 28;
    var plotW = VB_W - labelL - M.r;
    var cell = plotW / nCols;
    var vbH = labelT + nRows * cell + 16;
    var svgEl = _newSvg(VB_W, vbH,
      (type === 'matrix' ? 'Matrix: ' : 'Heatmap: ') + (spec.title || ''));

    var gGrid = svg('g', { 'class': 've-chart-grid' });
    var gap = 2;
    var logScale = !!opts.logScale;
    var diverging = !!opts.diverging;
    for (i = 0; i < cells.length; i++) {
      var c = cells[i];
      var t = rampT(c.value, maxV, logScale);
      var rect = svg('rect', {
        'class': 've-chart-cell',
        x: labelL + c.col * cell + gap / 2,
        y: labelT + c.row * cell + gap / 2,
        width: cell - gap, height: cell - gap,
        rx: 'var(--vc-radius-sm, 4)',
        fill: ramp(t, diverging ? 'diverging' : 'sequential')
      });
      var label = (c.rowLabel || ('Row ' + (c.row + 1))) + ' × '
        + (c.colLabel || ('Col ' + (c.col + 1)));
      markPoint(rect, {
        id: 've-chart-' + _chartSeq + '-d' + c.row + '-i' + c.col,
        label: label, value: c.value, chartId: fig.__veChartId,
        datasetIndex: c.row, datasetLabel: c.rowLabel || null,
        index: c.col, xLabel: c.colLabel || null
      });
      svgTitle(rect, label + ': ' + fmtNum(c.value));
      gGrid.appendChild(rect);

      // matrix: a value glyph centered in the cell.
      if (type === 'matrix') {
        var vt = svg('text', {
          'class': 've-chart-cell-value',
          x: labelL + c.col * cell + cell / 2,
          y: labelT + c.row * cell + cell / 2 + 4,
          'text-anchor': 'middle'
        });
        vt.appendChild(document.createTextNode(fmtNum(c.value)));
        gGrid.appendChild(vt);
      }
    }
    svgEl.appendChild(gGrid);

    // Row + column labels.
    var rowLabels = _gridRowLabels(spec, nRows);
    var colLabels = _gridColLabels(spec, nCols);
    var gRow = svg('g', { 'class': 've-chart-grid-rowlabels' });
    for (i = 0; i < nRows; i++) {
      var rt = svg('text', {
        'class': 've-chart-axis-label',
        x: labelL - 8, y: labelT + i * cell + cell / 2 + 4,
        'text-anchor': 'end'
      });
      rt.appendChild(document.createTextNode(rowLabels[i]));
      gRow.appendChild(rt);
    }
    var gCol = svg('g', { 'class': 've-chart-grid-collabels' });
    for (i = 0; i < nCols; i++) {
      var ct = svg('text', {
        'class': 've-chart-axis-label',
        x: labelL + i * cell + cell / 2, y: labelT - 8,
        'text-anchor': 'middle'
      });
      ct.appendChild(document.createTextNode(colLabels[i]));
      gCol.appendChild(ct);
    }
    svgEl.appendChild(gRow);
    svgEl.appendChild(gCol);
    fig.appendChild(svgEl);
    _appendSource(fig, spec.source);
  }

  // Normalise the various grid input shapes into a flat cell list.
  function _gridCells(spec) {
    var cells = [];
    var opts = spec.options || {};
    // Shape A: options.grid — a 2-D array of numbers.
    var grid = opts.grid || spec.grid;
    if (grid && grid.length && grid[0] && grid[0].length !== undefined) {
      for (var r = 0; r < grid.length; r++) {
        for (var c = 0; c < grid[r].length; c++) {
          cells.push({ row: r, col: c, value: grid[r][c] });
        }
      }
      return cells;
    }
    // Shape B: series[0].data is a list of {row,col,value} (or x/y/value).
    var data = (spec.series && spec.series[0] && spec.series[0].data) || [];
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var row = isNum(d.row) ? d.row : (isNum(d.y) ? d.y : 0);
      var col = isNum(d.col) ? d.col : (isNum(d.x) ? d.x : i);
      cells.push({
        row: row, col: col,
        value: isNum(d.value) ? d.value : d.v,
        rowLabel: d.rowLabel, colLabel: d.colLabel
      });
    }
    return cells;
  }
  function _gridRowLabels(spec, n) {
    var opts = spec.options || {};
    var src = opts.rowLabels || [];
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(src[i] != null ? String(src[i]) : String(i + 1));
    }
    return out;
  }
  function _gridColLabels(spec, n) {
    var opts = spec.options || {};
    var src = opts.colLabels || [];
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(src[i] != null ? String(src[i]) : String(i + 1));
    }
    return out;
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: CSS-flex segmented bar
  //  (chart-spec.md §2 #2 — deep-batch-10 IDEA-061)
  // ──────────────────────────────────────────────────────────────────

  function renderCssSegmentedBar(spec, _type, fig) {
    var data = spec.series[0].data;
    var total = 0, di;
    for (di = 0; di < data.length; di++) {
      if (isNum(data[di].y)) { total += data[di].y; }
    }
    if (total <= 0) { total = 1; }
    var colors = palette(data.length);
    var track = el('div', { className: 've-chart-segmented' });
    for (di = 0; di < data.length; di++) {
      var v = isNum(data[di].y) ? data[di].y : 0;
      var pct = (v / total) * 100;
      var seg = el('div', { className: 've-chart-segment' });
      seg.style.flexGrow = String(v);
      seg.style.background = colors[di];
      var label = String(data[di].x != null ? data[di].x : ('Part ' + (di + 1)));
      markPoint(seg, {
        id: 've-chart-' + _chartSeq + '-d0-i' + di,
        label: label, value: v, chartId: fig.__veChartId,
        datasetIndex: 0, datasetLabel: spec.series[0].label,
        index: di, xLabel: data[di].x
      });
      seg.setAttribute('title', label + ': ' + fmtNum(v)
        + ' (' + Math.round(pct) + '%)');
      // A label is shown inside wide-enough segments.
      seg.appendChild(el('span', { className: 've-chart-segment-label' },
        label));
      track.appendChild(seg);
    }
    fig.appendChild(track);
    // A small legend below.
    var labels = [];
    for (di = 0; di < data.length; di++) {
      labels.push(String(data[di].x != null ? data[di].x : ('Part ' + (di + 1))));
    }
    _appendLegend(fig, labels, colors);
    _appendSource(fig, spec.source);
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: HTML/CSS metric cards (KPI tile row)
  //  (chart-spec.md §2 #5 composite — Build #8 P2)
  // ──────────────────────────────────────────────────────────────────

  function renderMetricCards(spec, _type, fig) {
    // Each datum is a KPI: { label, value, delta, unit, trend }.
    var data = spec.series[0].data;
    var grid = el('div', { className: 've-chart-metric-grid' });
    for (var di = 0; di < data.length; di++) {
      var d = data[di];
      var card = el('div', { className: 've-chart-metric-card' });
      var label = String(d.label != null ? d.label
        : (d.x != null ? d.x : ('Metric ' + (di + 1))));
      card.appendChild(el('div', { className: 've-chart-metric-label' },
        label));
      var valWrap = el('div', { className: 've-chart-metric-value' });
      var valNum = el('span', null, fmtNum(d.value != null ? d.value : d.y));
      // The animation skill exposes animateStat — use it for a count-up
      // when present, with a 0..N roll; otherwise the value is static.
      valNum.setAttribute('data-va-stat',
        String(d.value != null ? d.value : d.y));
      valNum.className = 'va-counter';
      if (d.unit) { valNum.setAttribute('data-va-stat-suffix', String(d.unit)); }
      valWrap.appendChild(valNum);
      if (d.unit) {
        valWrap.appendChild(el('span', { className: 've-chart-metric-unit' },
          String(d.unit)));
      }
      card.appendChild(valWrap);
      // Delta badge — colored by trend.
      if (d.delta !== undefined && d.delta !== null) {
        var trend = d.trend;
        if (!trend) {
          trend = isNum(d.delta) && d.delta < 0 ? 'down'
            : (isNum(d.delta) && d.delta > 0 ? 'up' : 'flat');
        }
        var badge = el('div', {
          className: 've-chart-metric-delta ve-chart-metric-delta--' + trend
        });
        var arrow = trend === 'down' ? '↓'
          : (trend === 'up' ? '↑' : '→');
        badge.appendChild(document.createTextNode(arrow + ' '
          + (isNum(d.delta) ? fmtNum(Math.abs(d.delta)) : String(d.delta))));
        card.appendChild(badge);
      }
      markPoint(card, {
        id: 've-chart-' + _chartSeq + '-d0-i' + di,
        label: label, value: d.value != null ? d.value : d.y,
        chartId: fig.__veChartId, datasetIndex: 0,
        datasetLabel: spec.series[0].label, index: di,
        xLabel: d.label != null ? d.label : d.x
      });
      grid.appendChild(card);
    }
    fig.appendChild(grid);
    _appendSource(fig, spec.source);
    // If the animation skill is loaded, let it animate the counters.
    if (typeof window !== 'undefined' && window.amvcpAnimation
        && typeof window.amvcpAnimation.refresh === 'function') {
      try { window.amvcpAnimation.refresh(fig); } catch (e) { /* noop */ }
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  BACKEND: Canvas (large-data path) — bar / line / area / dot-plot
  //  (chart-spec.md §2 sub-technique 9)
  // ──────────────────────────────────────────────────────────────────

  function renderCanvas(spec, type, fig) {
    var series = spec.series;
    // Collect a flat ordered list of marks across every series.
    var marks = [];
    var si, di;

    var canvas = el('canvas', {
      className: 've-chart-canvas',
      role: 'img',
      'aria-label': (type + ' chart') + ': ' + (spec.title || '')
    });
    fig.appendChild(canvas);

    // A visually-hidden <ul> mirrors every datum so keyboard users +
    // screen readers (and the selection path) still work without a
    // pointer — a Canvas datum has no DOM node otherwise.
    var a11y = el('ul', { className: 've-chart-a11y-data', hidden: 'hidden' });

    // Domain.
    var cats = [];
    var first = series[0].data;
    for (di = 0; di < first.length; di++) { cats.push(first[di].x); }
    var dataMax = 0, dataMin = 0;
    for (si = 0; si < series.length; si++) {
      for (di = 0; di < series[si].data.length; di++) {
        var v = series[si].data[di].y;
        if (!isNum(v)) { continue; }
        if (v > dataMax) { dataMax = v; }
        if (v < dataMin) { dataMin = v; }
      }
    }
    var tk = niceTicks(Math.min(0, dataMin), dataMax, 4);

    // Resolve token colors ONCE per render (Canvas cannot cascade CSS
    // custom properties — chart-spec.md §9 step 3). A theme hot-swap
    // re-runs scan() which re-resolves these.
    function color(name, fallback) {
      var c = readVar(name);
      return c || fallback;
    }
    var cAccent = color('--vc-color-accent', '#b8861f');
    var cBorder = color('--vc-color-border', '#e3dcc9');
    var cMuted = color('--vc-color-content-muted', '#5b5343');
    var palStrings = palette(series.length > 1 ? series.length : 1);

    function draw() {
      var cssW = canvas.clientWidth || 640;
      var cssH = Math.round(cssW * (VB_H / VB_W));
      var dpr = (typeof window !== 'undefined' && window.devicePixelRatio)
        ? window.devicePixelRatio : 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
      var ctx = canvas.getContext('2d');
      if (!ctx) { return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      var plotW = cssW - M.l - M.r;
      var plotH = cssH - M.t - M.b;
      var x0 = M.l, yBase = M.t + plotH;
      var yScale = scale(tk.bottom, tk.top, yBase, M.t);

      // Sparse gridlines + tick labels — capped to MAX_GRIDLINES, the
      // same enforced guardrail _drawGrid applies to the SVG path.
      ctx.strokeStyle = cBorder;
      ctx.fillStyle = cMuted;
      ctx.lineWidth = 1;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      var cTicks = _capTicks(tk.ticks);
      for (var gi = 0; gi < cTicks.length; gi++) {
        var gy = yScale(cTicks[gi]);
        ctx.beginPath();
        ctx.moveTo(x0, gy);
        ctx.lineTo(cssW - M.r, gy);
        ctx.stroke();
        ctx.fillText(fmtNum(cTicks[gi]), x0 - 8, gy + 4);
      }

      marks.length = 0;
      var n = cats.length;
      var bandW = plotW / n;
      var isLine = (type === 'line' || type === 'area');
      var isDot = (type === 'dot-plot');

      for (si = 0; si < series.length; si++) {
        var col = series.length > 1 ? palStrings[si] : cAccent;
        var data = series[si].data;
        var linePts = [];
        for (di = 0; di < data.length; di++) {
          var val = data[di].y;
          if (!isNum(val)) { continue; }
          var cx = x0 + bandW * di + bandW / 2;
          var cy = yScale(val);
          if (isLine) {
            linePts.push({ x: cx, y: cy });
            marks.push({ kind: 'point', x: cx, y: cy, r: 10,
              si: si, di: di, val: val });
          } else if (isDot) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            marks.push({ kind: 'point', x: cx, y: cy, r: 12,
              si: si, di: di, val: val });
          } else {
            // bar
            var slotW = series.length > 1
              ? (bandW * 0.62) / series.length : bandW * 0.62;
            var bx = cx - bandW * 0.31 + si * slotW;
            var bh = yBase - cy;
            ctx.fillStyle = col;
            ctx.fillRect(bx, cy, slotW * 0.86, bh < 0 ? 0 : bh);
            marks.push({ kind: 'bar', x: bx, y: cy,
              w: slotW * 0.86, h: bh < 0 ? 0 : bh,
              si: si, di: di, val: val });
          }
        }
        if (isLine && linePts.length) {
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(linePts[0].x, linePts[0].y);
          for (var lp = 1; lp < linePts.length; lp++) {
            ctx.lineTo(linePts[lp].x, linePts[lp].y);
          }
          ctx.stroke();
          if (type === 'area') {
            ctx.lineTo(linePts[linePts.length - 1].x, yBase);
            ctx.lineTo(linePts[0].x, yBase);
            ctx.closePath();
            ctx.globalAlpha = 0.16;
            ctx.fillStyle = col;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          // Point dots on the line.
          ctx.fillStyle = col;
          for (var pd = 0; pd < linePts.length; pd++) {
            ctx.beginPath();
            ctx.arc(linePts[pd].x, linePts[pd].y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Hit-test on mousemove: bars by bbox, points by Math.hypot radius.
    function hitTest(mx, my) {
      var best = null, bestDist = Infinity;
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (m.kind === 'bar') {
          if (mx >= m.x && mx <= m.x + m.w
              && my >= m.y && my <= m.y + m.h) {
            return m;
          }
        } else {
          var dx = mx - m.x, dy = my - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < m.r && dist < bestDist) {
            bestDist = dist;
            best = m;
          }
        }
      }
      return best;
    }

    function markPayload(m) {
      var ds = series[m.si] || {};
      var xLabel = cats[m.di];
      return {
        id: 've-chart-' + fig.__veChartId.replace('ve-chart-', '')
          + '-d' + m.si + '-i' + m.di,
        type: 'chart-point',
        label: (ds.label ? ds.label + ' · ' : '')
          + (xLabel != null ? String(xLabel) : 'index ' + m.di),
        data: {
          chartId: fig.__veChartId,
          datasetIndex: m.si,
          datasetLabel: ds.label || null,
          index: m.di,
          xLabel: xLabel != null ? xLabel : null,
          value: m.val
        }
      };
    }

    canvas.addEventListener('mousemove', function (ev) {
      var r = canvas.getBoundingClientRect();
      var m = hitTest(ev.clientX - r.left, ev.clientY - r.top);
      if (m) {
        var p = markPayload(m);
        _showTooltip(_tooltipBody(p.label, p.data.value),
          ev.clientX, ev.clientY);
      } else if (!_tipLocked) {
        _scheduleTipHide();
      }
    });
    canvas.addEventListener('mouseleave', function () {
      if (!_tipLocked) { _scheduleTipHide(); }
    });
    canvas.addEventListener('click', function (ev) {
      var r = canvas.getBoundingClientRect();
      var m = hitTest(ev.clientX - r.left, ev.clientY - r.top);
      if (m) { _toggleSelection(markPayload(m)); }
    });

    // Build the hidden a11y list — every datum, keyboard-selectable.
    for (si = 0; si < series.length; si++) {
      for (di = 0; di < series[si].data.length; di++) {
        var dv = series[si].data[di];
        if (!isNum(dv.y)) { continue; }
        var payload = markPayload({ si: si, di: di, val: dv.y });
        var li = el('li', {
          'data-ve-id': payload.id,
          'data-ve-type': 'chart-point',
          'data-ve-value': String(dv.y),
          tabindex: '0', role: 'button'
        }, payload.label + ': ' + fmtNum(dv.y));
        li.__veChartPayload = payload;
        li.addEventListener('click', function () {
          _toggleSelection(this.__veChartPayload);
        });
        li.addEventListener('keydown', function (kv) {
          if (kv.key === ' ' || kv.key === 'Enter'
              || kv.keyCode === 32 || kv.keyCode === 13) {
            kv.preventDefault();
            _toggleSelection(this.__veChartPayload);
          }
        });
        a11y.appendChild(li);
      }
    }
    fig.appendChild(a11y);

    // Initial draw + redraw on resize / theme change.
    draw();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(draw);     // a second pass once laid out
    }
    fig.__veChartRedraw = draw;        // scan() calls this on themechange
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', function () { draw(); });
    }
  }

  // ──────────────────────────────────────────────────────────────────
  //  Validation — per-type fail-fast gates (chart-spec.md §2 #2, §6)
  // ──────────────────────────────────────────────────────────────────

  // The shared envelope check — every type needs a non-empty insight
  // title and at least one non-empty series.
  function _validateEnvelope(spec) {
    if (!spec || typeof spec !== 'object') {
      return "spec is not a JSON object";
    }
    if (typeof spec.title !== 'string' || !spec.title.replace(/\s/g, '')) {
      return "chart spec missing required 'title'";
    }
    if (!spec.series || !spec.series.length) {
      return "chart spec missing required 'series'";
    }
    for (var i = 0; i < spec.series.length; i++) {
      var s = spec.series[i];
      if (!s || !s.data || s.data.length === undefined) {
        return "series[" + i + "] has no 'data' array";
      }
    }
    return null;
  }

  // bar/line family — every datum needs a numeric y (x is the category).
  function _validateXY(spec) {
    var env = _validateEnvelope(spec);
    if (env) { return env; }
    for (var si = 0; si < spec.series.length; si++) {
      var data = spec.series[si].data;
      for (var di = 0; di < data.length; di++) {
        if (!data[di] || typeof data[di] !== 'object') {
          return "series[" + si + "].data[" + di + "] is not an object";
        }
      }
    }
    return null;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Registry — the dispatch table (chart-spec.md §2 sub-technique 2)
  // ──────────────────────────────────────────────────────────────────

  var registry = {};

  function _reg(types, backend, render, validate) {
    for (var i = 0; i < types.length; i++) {
      registry[types[i]] = {
        backend: backend, render: render,
        validate: validate, maxVersion: 1
      };
    }
  }

  _reg(['bar', 'stacked-bar', 'diverging-bar', 'lollipop',
        'dot-plot', 'connected-dot-plot', 'bullet'],
       'svg', renderSvgBar, _validateXY);
  _reg(['segmented-bar'], 'css', renderCssSegmentedBar, _validateXY);
  _reg(['line', 'area', 'step-area', 'slope', 'bump'],
       'svg', renderSvgLine, _validateXY);
  _reg(['donut', 'gauge', 'harvey-ball'],
       'svg', renderSvgCircular, _validateXY);
  _reg(['radar'], 'svg', renderSvgRadar, _validateXY);
  _reg(['waterfall', 'funnel', 'mekko'],
       'svg', renderSvgMcKinsey, _validateXY);
  _reg(['heatmap', 'matrix', 'activity-heatmap'],
       'svg', renderSvgGrid, _validateEnvelope);
  _reg(['metric-cards'], 'html', renderMetricCards, _validateEnvelope);

  // Canvas-capable types — past CANVAS_THRESHOLD marks these switch
  // backend. Circular / radar / mekko / grid stay SVG (low mark count
  // by nature, or grid has its own dense path).
  var CANVAS_CAPABLE = {
    'bar': 1, 'line': 1, 'area': 1, 'dot-plot': 1
  };

  // ──────────────────────────────────────────────────────────────────
  //  render — dispatch one parsed spec into a host <figure>
  // ──────────────────────────────────────────────────────────────────

  function render(spec, type, host) {
    // Guardrail: pie -> sorted bar (chart-spec.md §6 rule 1). The chart
    // still renders — fail-SAFE, not fail-blank.
    if (type === 'pie') {
      type = 'bar';
      spec = spec || {};
      spec.options = spec.options || {};
      spec.options.sortDescending = true;
      if (typeof console !== 'undefined' && console.info) {
        console.info('[ve-chart] pie remapped to sorted bar'
          + ' — see chart guardrails');
      }
    }
    var entry = registry[type];
    if (!entry) {
      throw new Error("unknown chart type: " + type);
    }
    var verr = entry.validate(spec);
    if (verr) {
      throw new Error(verr);
    }
    var fig = host || _buildFigure(type, spec);
    // host may be a bare <figure> with no caption — make sure it has an
    // id for mark naming.
    if (!fig.__veChartId) {
      _chartSeq++;
      fig.__veChartId = 've-chart-' + _chartSeq;
      fig.setAttribute('data-ve-id', fig.__veChartId);
    }

    // Backend decision — auto-switch to Canvas past the mark threshold.
    var markCount = 0;
    for (var si = 0; si < spec.series.length; si++) {
      markCount += spec.series[si].data.length;
    }
    if (markCount > CANVAS_THRESHOLD && CANVAS_CAPABLE[type]) {
      fig.setAttribute('data-ve-chart-backend', 'canvas');
      renderCanvas(spec, type, fig);
    } else {
      fig.setAttribute('data-ve-chart-backend', entry.backend);
      entry.render(spec, type, fig);
      // SVG / HTML / CSS backends get pointer + keyboard wiring.
      _wireMarks(fig);
    }
    return fig;
  }

  // ──────────────────────────────────────────────────────────────────
  //  parseFence — extract type/version + parse JSON from a <pre><code>
  //  (chart-spec.md §2 sub-technique 1)
  // ──────────────────────────────────────────────────────────────────

  // Pull the `chart:<type>@<version>` info string off a code element's
  // class. Returns { type, version } or null if it is not a chart block.
  function _readChartTag(codeEl) {
    var cls = codeEl.className || '';
    // Reuse the runtime's language-token pattern.
    var m = cls.match(/language-(chart:[\w+@.\-]+)/);
    if (!m) { return null; }
    var tag = m[1];                       // e.g. "chart:bar@1"
    var atIdx = tag.indexOf('@');
    var version = 1;
    var namePart = tag;
    if (atIdx >= 0) {
      version = parseInt(tag.slice(atIdx + 1), 10);
      if (!isFinite(version) || version < 1) { version = 1; }
      namePart = tag.slice(0, atIdx);
    }
    var colonIdx = namePart.indexOf(':');
    var type = colonIdx >= 0 ? namePart.slice(colonIdx + 1) : namePart;
    return { type: type, version: version };
  }

  // Parse one <pre> chart block. Returns { spec, type, version } on
  // success, or { error: <reason>, text: <original> } on failure.
  function parseFence(preEl) {
    var codeEl = preEl.querySelector
      ? preEl.querySelector('code') : null;
    var carrier = codeEl || preEl;
    var tag = _readChartTag(carrier);
    if (!tag) {
      return { error: 'not a chart block', text: '' };
    }
    var raw = carrier.textContent || '';
    var spec;
    try {
      spec = JSON.parse(raw);
    } catch (e) {
      return {
        error: 'invalid JSON — ' + String(e && e.message || e),
        text: raw, type: tag.type, version: tag.version
      };
    }
    return { spec: spec, type: tag.type, version: tag.version, text: raw };
  }

  // ──────────────────────────────────────────────────────────────────
  //  scan — find & render every chart block in the document
  //  (chart-spec.md §2 sub-technique 1 + §5 boot order)
  // ──────────────────────────────────────────────────────────────────

  function scan(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return; }

    // Re-render Canvas-backed figures on a theme hot-swap (chart-spec.md
    // §5 integration contract 4). SVG figures need nothing — CSS custom
    // properties cascade. Canvas must repaint with re-resolved colors.
    var liveCanvas = d.querySelectorAll(
      'figure.ve-chart[data-ve-chart-backend="canvas"]');
    for (var lc = 0; lc < liveCanvas.length; lc++) {
      if (typeof liveCanvas[lc].__veChartRedraw === 'function') {
        try { liveCanvas[lc].__veChartRedraw(); } catch (e) { /* noop */ }
      }
    }

    // Find every un-rendered chart fenced block.
    var pres = d.querySelectorAll('pre > code[class*="language-chart:"]');
    for (var i = 0; i < pres.length; i++) {
      var codeEl = pres[i];
      var pre = codeEl.parentNode;
      if (!pre || pre.__veChartDone) { continue; }
      pre.__veChartDone = true;

      var parsed = parseFence(pre);
      if (parsed.error) {
        _degrade(pre, parsed.text, parsed.error);
        continue;
      }
      // Version guard — a future schema fails loud, not silently wrong.
      var entry = registry[parsed.type];
      if (parsed.type === 'pie') {
        // pie is handled by render()'s remap — let it through.
        entry = registry.bar;
      }
      if (!entry) {
        _degrade(pre, parsed.text, 'unknown chart type: ' + parsed.type);
        continue;
      }
      if (parsed.version > entry.maxVersion) {
        _degrade(pre, parsed.text, 'chart version ' + parsed.version
          + ' is newer than this runtime supports (max '
          + entry.maxVersion + ')');
        continue;
      }
      // Build the figure host, render, swap the <pre> out.
      var fig;
      try {
        fig = _buildFigure(parsed.type === 'pie' ? 'bar' : parsed.type,
          parsed.spec);
        render(parsed.spec, parsed.type, fig);
      } catch (err) {
        _degrade(pre, parsed.text,
          String(err && err.message || err));
        continue;
      }
      if (pre.parentNode) {
        pre.parentNode.replaceChild(fig, pre);
      }
    }
  }

  // ── CSS — the injected stylesheet ──────────────────────────────────
  //
  // Built as a line array joined with '\n' (ES5-safe, no template
  // literals). Every visual value is a `--vc-*` token with a canonical
  // fallback. The no-nested-scrollbars rule: `.ve-chart` and
  // `.ve-chart-svg` are `overflow: visible` — a wide chart extends the
  // page, never an inner scroller.
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — chart skill (injected) */',

    '.ve-chart {',
    '  margin-block: var(--vc-space-5, 32px);',
    '  overflow: visible;',
    '  max-width: none;',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',
    '.ve-chart-title {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-size: var(--vc-text-3, 20px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  margin-bottom: var(--vc-space-1, 8px);',
    '}',
    '.ve-chart-subtitle {',
    '  font-size: var(--vc-text-1, 14px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  margin-bottom: var(--vc-space-2, 12px);',
    '}',
    '.ve-chart-source {',
    '  font-size: var(--vc-text-0, 12px);',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '  margin-top: var(--vc-space-1, 8px);',
    '}',
    '.ve-chart-svg {',
    '  display: block;',
    '  width: 100%;',
    '  height: auto;',
    '  overflow: visible;',
    '  max-width: none;',
    '}',
    '.ve-chart-canvas {',
    '  display: block;',
    '  width: 100%;',
    '  overflow: visible;',
    '}',

    /* --- axis / gridlines --------------------------------------- */
    '.ve-chart-gridline {',
    '  stroke: var(--vc-color-border, #e3dcc9);',
    '  stroke-width: 1;',
    '}',
    '.ve-chart-baseline {',
    '  stroke: var(--vc-color-border-strong, #c9bfa3);',
    '  stroke-width: 1.5;',
    '}',
    '.ve-chart-axis-label {',
    '  fill: var(--vc-color-content-muted, #5b5343);',
    '  font-size: 11px;',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',
    '.ve-chart-value-label {',
    '  fill: var(--vc-color-content, #1f1a14);',
    '  font-size: 11px;',
    '  font-weight: var(--vc-weight-medium, 500);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',

    /* --- marks: focus + hover ----------------------------------- */
    '.ve-chart-bar, .ve-chart-point, .ve-chart-cell, .ve-chart-arc,',
    '.ve-chart-wf-bar, .ve-chart-mekko-cell, .ve-chart-funnel-stage {',
    '  cursor: pointer;',
    '  transition: opacity var(--vc-duration-fast, 120ms) ease,',
    '              filter var(--vc-duration-fast, 120ms) ease;',
    '}',
    '.ve-chart-bar:hover, .ve-chart-point:hover, .ve-chart-cell:hover,',
    '.ve-chart-arc:hover, .ve-chart-wf-bar:hover,',
    '.ve-chart-mekko-cell:hover, .ve-chart-funnel-stage:hover {',
    '  filter: brightness(1.08);',
    '}',
    '.ve-chart-bar:focus-visible, .ve-chart-point:focus-visible,',
    '.ve-chart-cell:focus-visible, .ve-chart-arc:focus-visible,',
    '.ve-chart-wf-bar:focus-visible, .ve-chart-mekko-cell:focus-visible,',
    '.ve-chart-funnel-stage:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 1px;',
    '}',
    /* Phase 2.5 selection contract — selected atoms paint brighter +
       bolder. The runtime stamps data-ve-selected="1" when the atom is
       in veSelection; this rule mirrors the runtime so the contract
       holds even in standalone mode (chart-spec.md §0 defensive). */
    '.ve-chart-bar[data-ve-selected="1"],',
    '.ve-chart-point[data-ve-selected="1"],',
    '.ve-chart-cell[data-ve-selected="1"],',
    '.ve-chart-arc[data-ve-selected="1"],',
    '.ve-chart-wf-bar[data-ve-selected="1"],',
    '.ve-chart-mekko-cell[data-ve-selected="1"],',
    '.ve-chart-funnel-stage[data-ve-selected="1"] {',
    '  filter: brightness(1.18);',
    '  stroke: var(--vc-color-accent, #b8861f);',
    '  stroke-width: 2;',
    '}',
    /* Hover-on-selected: keep the boost AND the hover sheen. */
    '.ve-chart-bar[data-ve-selected="1"]:hover,',
    '.ve-chart-point[data-ve-selected="1"]:hover,',
    '.ve-chart-cell[data-ve-selected="1"]:hover,',
    '.ve-chart-arc[data-ve-selected="1"]:hover,',
    '.ve-chart-wf-bar[data-ve-selected="1"]:hover,',
    '.ve-chart-mekko-cell[data-ve-selected="1"]:hover,',
    '.ve-chart-funnel-stage[data-ve-selected="1"]:hover {',
    '  filter: brightness(1.22)',
    '          drop-shadow(0 0 4px var(--vc-color-accent, #b8861f));',
    '}',
    /* Outer ring on the figure when ANY atom inside is selected — the
       same affordance the runtime gives to ul/ol/section containers. */
    '.ve-chart {',
    '  position: relative;',
    '  transition: outline-color 120ms ease, box-shadow 120ms ease;',
    '}',
    '.ve-chart:has([data-ve-selected="1"]) {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 4px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '}',
    /* The single per-figure comment-handle injected by the observer. */
    '.ve-chart > .ve-comment-handle {',
    '  position: absolute; left: -40px;',
    '  width: 28px; height: 22px;',
    '  display: inline-flex; align-items: center; justify-content: center;',
    '  background: var(--vc-color-accent, #b8861f);',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  border: 0; border-radius: 6px; padding: 0;',
    '  font: 600 13px/1 ui-sans-serif, system-ui, sans-serif;',
    '  cursor: pointer;',
    '  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.24);',
    '  transform: translateY(-50%);',
    '  z-index: 2;',
    '}',
    '.ve-chart > .ve-comment-handle:hover { filter: brightness(1.08); }',
    '.ve-chart-lollipop-stem, .ve-chart-connector,',
    '.ve-chart-wf-connector {',
    '  stroke: var(--vc-color-border-strong, #c9bfa3);',
    '  stroke-width: 1.5;',
    '}',
    '.ve-chart-connector { stroke-dasharray: 3 3; }',
    '.ve-chart-wf-connector { stroke-dasharray: 2 3; }',
    '.ve-chart-bullet-range {',
    '  fill: var(--vc-color-surface-sunken, #f1ece0);',
    '}',
    '.ve-chart-bullet-target {',
    '  stroke: var(--vc-color-content, #1f1a14);',
    '  stroke-width: 2.5;',
    '}',
    '.ve-chart-line { stroke-width: 2; stroke-linejoin: round;',
    '  stroke-linecap: round; }',

    /* --- circular ----------------------------------------------- */
    '.ve-chart-donut-center {',
    '  fill: var(--vc-color-content, #1f1a14);',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-size: var(--vc-text-4, 24px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '}',
    '.ve-chart-gauge-track { opacity: 0.9; }',

    /* --- radar -------------------------------------------------- */
    '.ve-chart-radar-ring, .ve-chart-radar-spoke {',
    '  stroke: var(--vc-color-border, #e3dcc9);',
    '  stroke-width: 1;',
    '}',
    '.ve-chart-radar-area { stroke-width: 2; stroke-linejoin: round; }',

    /* --- waterfall / funnel labels ------------------------------ */
    '.ve-chart-funnel-label {',
    '  fill: var(--vc-color-content, #1f1a14);',
    '  font-size: 12px;',
    '  font-weight: var(--vc-weight-medium, 500);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',
    '.ve-chart-funnel-drop {',
    '  fill: var(--vc-color-content-muted, #5b5343);',
    '  font-size: 10px;',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',

    /* --- grid / heatmap ----------------------------------------- */
    '.ve-chart-cell-value {',
    '  fill: var(--vc-color-content, #1f1a14);',
    '  font-size: 10px;',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',

    /* --- harvey ball -------------------------------------------- */
    '.ve-chart-harvey-ring { stroke-width: 1.5; }',

    /* --- legend ------------------------------------------------- */
    '.ve-chart-legend {',
    '  list-style: none;',
    '  padding: 0;',
    '  margin: var(--vc-space-2, 12px) 0 0;',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: var(--vc-space-2, 12px);',
    '}',
    '.ve-chart-legend-item {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: var(--vc-space-0, 4px);',
    '  font-size: var(--vc-text-0, 12px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.ve-chart-legend-swatch {',
    '  width: 12px;',
    '  height: 12px;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  flex: none;',
    '}',
    '.ve-chart-series-label, .ve-chart-radar-labels text {',
    '  fill: var(--vc-color-content, #1f1a14);',
    '  font-size: 11px;',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '}',

    /* --- CSS-flex segmented bar --------------------------------- */
    '.ve-chart-segmented {',
    '  display: flex;',
    '  width: 100%;',
    '  height: 40px;',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  overflow: hidden;',
    '}',
    '.ve-chart-segment {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  min-width: 0;',
    '  cursor: pointer;',
    '  transition: filter var(--vc-duration-fast, 120ms) ease;',
    '}',
    '.ve-chart-segment:hover { filter: brightness(1.08); }',
    '.ve-chart-segment:focus-visible {',
    '  outline: 2px solid var(--vc-color-content, #1f1a14);',
    '  outline-offset: -2px;',
    '}',
    '.ve-chart-segment-label {',
    '  font-size: var(--vc-text-0, 12px);',
    '  color: var(--vc-color-on-accent, #ffffff);',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  padding-inline: var(--vc-space-1, 8px);',
    '}',

    /* --- metric cards ------------------------------------------- */
    '.ve-chart-metric-grid {',
    '  display: grid;',
    '  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));',
    '  gap: var(--vc-space-3, 16px);',
    '}',
    '.ve-chart-metric-card {',
    '  padding: var(--vc-space-3, 16px);',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-lg, 12px);',
    '  cursor: pointer;',
    '  transition: border-color var(--vc-duration-fast, 120ms) ease;',
    '}',
    '.ve-chart-metric-card:hover {',
    '  border-color: var(--vc-color-accent, #b8861f);',
    '}',
    '.ve-chart-metric-card:focus-visible {',
    '  outline: 2px solid var(--vc-color-accent, #b8861f);',
    '  outline-offset: 1px;',
    '}',
    '.ve-chart-metric-label {',
    '  font-size: var(--vc-text-0, 12px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.04em;',
    '}',
    '.ve-chart-metric-value {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-size: var(--vc-text-5, 32px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  margin-block: var(--vc-space-0, 4px);',
    '  display: flex;',
    '  align-items: baseline;',
    '  gap: var(--vc-space-0, 4px);',
    '}',
    '.ve-chart-metric-unit {',
    '  font-size: var(--vc-text-1, 14px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.ve-chart-metric-delta {',
    '  display: inline-block;',
    '  font-size: var(--vc-text-0, 12px);',
    '  font-weight: var(--vc-weight-medium, 500);',
    '  padding: 2px var(--vc-space-1, 8px);',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '}',
    '.ve-chart-metric-delta--up {',
    '  color: var(--vc-color-success, #3a6b5c);',
    '  background: color-mix(in srgb,',
    '    var(--vc-color-success, #3a6b5c) 14%, transparent);',
    '}',
    '.ve-chart-metric-delta--down {',
    '  color: var(--vc-color-danger, #a84a32);',
    '  background: color-mix(in srgb,',
    '    var(--vc-color-danger, #a84a32) 14%, transparent);',
    '}',
    '.ve-chart-metric-delta--flat {',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  background: color-mix(in srgb,',
    '    var(--vc-color-content-muted, #5b5343) 12%, transparent);',
    '}',

    /* --- a11y data list (Canvas keyboard fallback) -------------- */
    '.ve-chart-a11y-data[hidden] { display: none; }',

    /* --- tooltip (hover-bridge singleton) ----------------------- */
    '.ve-chart-tooltip {',
    '  position: absolute;',
    '  z-index: var(--vc-z-tooltip, 200);',
    '  pointer-events: auto;',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  box-shadow: var(--vc-shadow-2,',
    '    0 4px 12px rgba(0,0,0,0.14));',
    '  padding: var(--vc-space-1, 8px) var(--vc-space-2, 12px);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '  font-size: var(--vc-text-0, 12px);',
    '  max-width: 240px;',
    '}',
    '.ve-chart-tooltip-label {',
    '  color: var(--vc-color-content, #1f1a14);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '}',
    '.ve-chart-tooltip-value {',
    '  color: var(--vc-color-accent, #b8861f);',
    '  font-weight: var(--vc-weight-medium, 500);',
    '  margin-top: 2px;',
    '}',

    /* --- error / degrade block (fail-fast) ---------------------- */
    '.ve-chart-error {',
    '  border: 1px solid var(--vc-color-danger, #a84a32);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  margin-block: var(--vc-space-4, 24px);',
    '  overflow: visible;',
    '}',
    '.ve-chart-error-banner {',
    '  background: color-mix(in srgb,',
    '    var(--vc-color-danger, #a84a32) 12%, transparent);',
    '  color: var(--vc-color-danger, #a84a32);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '  font-size: var(--vc-text-1, 14px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);',
    '}',
    '.ve-chart-error-src {',
    '  margin: 0;',
    '  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-size: var(--vc-text-0, 12px);',
    '  overflow: visible;',
    '  white-space: pre-wrap;',
    '  word-break: break-word;',
    '}',

    /* --- entry animation (gated by .ve-chart-animate) ----------- */
    '@media (prefers-reduced-motion: no-preference) {',
    '  .ve-chart-bar {',
    '    transform: scaleY(0);',
    '    transform-box: fill-box;',
    '  }',
    '  .ve-chart-animate .ve-chart-bar {',
    '    animation: veChartGrowUp var(--vc-duration-slow, 600ms)',
    '               var(--vc-easing-decel, cubic-bezier(0,0,0,1)) both;',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* substitute: bars appear at final height immediately */',
    '  .ve-chart-bar { transform: none; }',
    '}',
    '@keyframes veChartGrowUp {',
    '  from { transform: scaleY(0); }',
    '  to   { transform: scaleY(1); }',
    '}',
    ''
  ];

  var CSS_TEXT = CSS_LINES.join('\n');

  // ── injectChartCSS ─────────────────────────────────────────────────
  //
  // Idempotent — a second call is a no-op (the <style> is id-guarded).
  function injectChartCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-vc', 'chart');
    style.appendChild(d.createTextNode(CSS_TEXT));
    d.head.appendChild(style);
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    injectChartCSS: injectChartCSS,
    scan: scan,
    render: render,
    parseFence: parseFence,
    palette: palette,
    ramp: ramp,
    niceTicks: niceTicks,
    describeArc: describeArc,
    catmullRom: catmullRom,
    getSelection: getSelection,
    registry: registry,
    _cssText: CSS_TEXT
  };

  _watchReducedMotion();

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpChart = _api;
    // Test hook — exposes the gate state + handles so a dev-browser
    // suite can drive the module deterministically (mirrors the
    // animation skill's window.__veAnimation).
    window.__veChart = {
      get state() {
        return {
          reduced: REDUCED,
          chartCount: _chartSeq,
          selection: _selection.slice(),
          cssInjected: !!(document.getElementById
            && document.getElementById(STYLE_ID))
        };
      },
      get REDUCED() { return REDUCED; },
      set REDUCED(v) { REDUCED = !!v; },
      scan: scan,
      render: render,
      injectChartCSS: injectChartCSS,
      getSelection: getSelection,
      clearSelection: function () { _selection.length = 0; }
    };

    // Self-init on DOMContentLoaded UNLESS the host opted out via
    // window.__vcManualInit (the runtime sets this so IT controls the
    // engine -> tokens -> chart-CSS -> chart-scan ordering; the test
    // fixture also sets it for deterministic control).
    if (!window.__vcManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          injectChartCSS(document);
          scan(document);
        });
      } else {
        injectChartCSS(document);
        scan(document);
      }
    }
  }

  // Node export — for the test harness / sanity checks.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
