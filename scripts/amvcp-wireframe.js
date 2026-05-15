/*!
 * ai-maestro-visual-communicator-plugin — wireframe runtime module.
 *
 * Phase 2 (visualizing backlog §11, TRDD-352ef46a): renders navigable
 * grayscale UI WIREFRAMES — fidelity-locked placeholder blocks,
 * multi-screen anchor navigation, device-frame bezels, and a
 * wireframe -> low -> mid -> hi fidelity ramp.
 *
 * Design contract (wireframe-spec.md):
 *   - Dependency-free. Pure CSS + vanilla ES5-style JS. No CDN, no
 *     React, no Babel, no `ascui` binary, no Node CLI, no build step.
 *   - Theme-driven. Every color reads a `--vc-color-*` token resolved
 *     by the DESIGN.md engine (amvcp-designmd.js); every reference
 *     carries a hardcoded canonical fallback so a wireframe opened
 *     standalone (no engine) still renders as a legible grayscale page.
 *   - Fidelity-lock. A wireframe STAYS a wireframe. At
 *     data-wf-fidelity="wireframe" the module desaturates every
 *     `--vc-color-*` token to pure grayscale (chroma 0, lightness
 *     preserved) and re-publishes the scoped set onto the wireframe
 *     subtree. Rising fidelity (low -> mid -> hi) re-introduces the
 *     real accent. The author cannot style their way out of wireframe
 *     fidelity — the CSS rules for that level simply paint no color.
 *   - Light + dark. Desaturation preserves LIGHTNESS, so a light
 *     theme stays light-grey and a dark theme stays dark-grey. Both
 *     themes are first-class.
 *   - No nested scrollbars. Device frames / ramp rows / app sidebars
 *     all use overflow:visible — wide/tall content extends the page.
 *   - Fail-fast. An invalid data-wf-fidelity value throws loud; there
 *     is no silent coercion. The ONE graceful path is the engine-
 *     absent fallback hex (degradation of APPEARANCE, never of logic).
 *
 * Dual export:
 *   - browser: `window.amvcpWireframe = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness — the
 *              pure helpers desaturateToken / rgbToHsl / hslToRgb /
 *              fidelityFactor are unit-testable under Node).
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-animation.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes.
 *
 * Public API:
 *   init(root)                       — scan + wire every wireframe
 *   refresh(root)                    — re-scan after dynamic DOM insert
 *   applyFidelity(rootEl, fidelity)  — set + re-desaturate one subtree
 *   desaturateToken(cssColor, fid)   — pure: color string -> grayscale
 *   fidelityFactor(fid)              — pure: fidelity -> chroma factor
 *   rgbToHsl(r,g,b) / hslToRgb(h,s,l)— pure HSL conversion helpers
 *   parseColor(cssColor)             — pure: any CSS color -> {r,g,b}
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The four legal fidelity stages, in ASCENDING order. The array
  // index IS the slider value (0..3) — see wireSlider(). Ordinal, so
  // a slider can interpolate; not three discrete wrapper classes.
  var FIDELITY_STAGES = ['wireframe', 'low', 'mid', 'hi'];

  // The 15 color roles the DESIGN.md engine emits as --vc-color-<role>
  // (mirrors amvcp-designmd.js COLOR_ROLES exactly). At fidelity
  // `wireframe` the module desaturates every one of these and
  // re-publishes the scoped grayscale set onto the wireframe root.
  var COLOR_ROLES = [
    'canvas', 'surface', 'surface-raised', 'surface-sunken',
    'content', 'content-muted', 'content-subtle',
    'border', 'border-strong',
    'accent', 'on-accent',
    'success', 'warning', 'danger', 'info'
  ];

  // Per-stage chroma-retention factor `k` (wireframe-spec.md §7.1). The
  // desaturated saturation is `originalSaturation * k`:
  //   wireframe -> 0    pure grayscale
  //   low       -> 0.15 almost-grey, faint hue
  //   mid       -> 0.6  clearly colored, slightly muted
  //   hi        -> 1.0  the real token, untouched
  var CHROMA_K = { wireframe: 0, low: 0.15, mid: 0.6, hi: 1.0 };

  // Accent gets a HIGHER k at `low` than the other roles — the single
  // "this is the primary action" signal is the first color to re-emerge
  // as fidelity rises (spec §7.1). At wireframe it is still fully
  // desaturated; at mid/hi it tracks the normal factor.
  var ACCENT_K = { wireframe: 0, low: 0.35, mid: 0.6, hi: 1.0 };

  // The default 8-bit grey channel canonical fallbacks — used ONLY
  // when getComputedStyle yields nothing for a --vc-color-* token AND
  // no fallback hex was authored. Matches the spec §2 fallback table.
  var FALLBACK_HEX = {
    'canvas': '#faf6ee',
    'surface': '#ffffff',
    'surface-raised': '#fffdf8',
    'surface-sunken': '#f1ece0',
    'content': '#1f1a14',
    'content-muted': '#5b5343',
    'content-subtle': '#8a8170',
    'border': '#e3dcc9',
    'border-strong': '#c9bfa3',
    'accent': '#b8861f',
    'on-accent': '#ffffff',
    'success': '#3a6b5c',
    'warning': '#a8791f',
    'danger': '#a84a32',
    'info': '#3464a8'
  };

  // A small set of CSS color keywords the parser resolves as a best
  // effort. A wireframe authored entirely off --vc-* tokens never hits
  // this, but a hand-written fallback could be a keyword.
  var COLOR_KEYWORDS = {
    'black': '#000000', 'white': '#ffffff', 'red': '#ff0000',
    'green': '#008000', 'blue': '#0000ff', 'gray': '#808080',
    'grey': '#808080', 'silver': '#c0c0c0', 'transparent': '#00000000'
  };

  // ── pure helper: parseColor ────────────────────────────────────────
  //
  // Parse any reasonable CSS color value into an {r,g,b} object of
  // 0..255 integers. Handles #rgb / #rrggbb / #rrggbbaa, rgb()/rgba(),
  // and a handful of keywords. Returns null on an unparseable value —
  // the caller decides what a null means (desaturateToken keeps the
  // input untouched, which is the safe non-destructive choice).
  function parseColor(value) {
    if (typeof value !== 'string') { return null; }
    var v = value.trim().toLowerCase();
    if (!v) { return null; }

    // Keyword.
    if (COLOR_KEYWORDS.hasOwnProperty(v)) {
      v = COLOR_KEYWORDS[v];
    }

    // Hex — #rgb, #rgba, #rrggbb, #rrggbbaa.
    if (v.charAt(0) === '#') {
      var hex = v.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        return {
          r: parseInt(hex.charAt(0) + hex.charAt(0), 16),
          g: parseInt(hex.charAt(1) + hex.charAt(1), 16),
          b: parseInt(hex.charAt(2) + hex.charAt(2), 16)
        };
      }
      if (hex.length === 6 || hex.length === 8) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
      return null;
    }

    // rgb() / rgba().
    var m = v.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      var parts = m[1].split(/[,\s/]+/);
      if (parts.length < 3) { return null; }
      var r = parseFloat(parts[0]);
      var g = parseFloat(parts[1]);
      var b = parseFloat(parts[2]);
      if (!isFinite(r) || !isFinite(g) || !isFinite(b)) { return null; }
      // A percentage component (e.g. "50%") is scaled to 0..255.
      if (/%$/.test(parts[0])) { r = r * 2.55; }
      if (/%$/.test(parts[1])) { g = g * 2.55; }
      if (/%$/.test(parts[2])) { b = b * 2.55; }
      return {
        r: _clamp255(Math.round(r)),
        g: _clamp255(Math.round(g)),
        b: _clamp255(Math.round(b))
      };
    }
    return null;
  }

  // Clamp an integer to the 0..255 channel range.
  function _clamp255(n) {
    if (n < 0) { return 0; }
    if (n > 255) { return 255; }
    return n;
  }

  // ── pure helper: rgbToHsl ──────────────────────────────────────────
  //
  // RGB (0..255) -> HSL with h in 0..360, s and l in 0..1. Standard
  // conversion; a pure achromatic input yields s = 0.
  function rgbToHsl(r, g, b) {
    var rn = r / 255, gn = g / 255, bn = b / 255;
    var max = Math.max(rn, gn, bn);
    var min = Math.min(rn, gn, bn);
    var l = (max + min) / 2;
    var h = 0;
    var s = 0;
    var d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) {
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
      } else if (max === gn) {
        h = (bn - rn) / d + 2;
      } else {
        h = (rn - gn) / d + 4;
      }
      h = h * 60;
    }
    return { h: h, s: s, l: l };
  }

  // ── pure helper: hslToRgb ──────────────────────────────────────────
  //
  // HSL (h 0..360, s/l 0..1) -> RGB {r,g,b} of 0..255 integers.
  function hslToRgb(h, s, l) {
    var hn = ((h % 360) + 360) % 360 / 360;
    var sn = s < 0 ? 0 : (s > 1 ? 1 : s);
    var ln = l < 0 ? 0 : (l > 1 ? 1 : l);
    var r, g, b;
    if (sn === 0) {
      r = g = b = ln;   // achromatic
    } else {
      var q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
      var p = 2 * ln - q;
      r = _hue2rgb(p, q, hn + 1 / 3);
      g = _hue2rgb(p, q, hn);
      b = _hue2rgb(p, q, hn - 1 / 3);
    }
    return {
      r: _clamp255(Math.round(r * 255)),
      g: _clamp255(Math.round(g * 255)),
      b: _clamp255(Math.round(b * 255))
    };
  }

  // HSL->RGB hue component helper.
  function _hue2rgb(p, q, t) {
    var tn = t;
    if (tn < 0) { tn += 1; }
    if (tn > 1) { tn -= 1; }
    if (tn < 1 / 6) { return p + (q - p) * 6 * tn; }
    if (tn < 1 / 2) { return q; }
    if (tn < 2 / 3) { return p + (q - p) * (2 / 3 - tn) * 6; }
    return p;
  }

  // Format an {r,g,b} object as a `#rrggbb` string.
  function _rgbToHex(rgb) {
    function h2(n) {
      var s = _clamp255(Math.round(n)).toString(16);
      return s.length === 1 ? '0' + s : s;
    }
    return '#' + h2(rgb.r) + h2(rgb.g) + h2(rgb.b);
  }

  // ── pure helper: fidelityFactor ────────────────────────────────────
  //
  // Resolve a fidelity stage name to its chroma-retention factor `k`.
  // `isAccent` selects the accent-specific ramp (the accent re-emerges
  // first as fidelity rises). An unknown stage throws — fail-fast; the
  // public init() validates attributes before this is ever reached, so
  // a throw here means a programming error, not bad user input.
  function fidelityFactor(fidelity, isAccent) {
    var table = isAccent ? ACCENT_K : CHROMA_K;
    if (!table.hasOwnProperty(fidelity)) {
      throw new Error(
        'wireframe: fidelityFactor — unknown stage "' + fidelity +
        '" (expected ' + FIDELITY_STAGES.join('|') + ')'
      );
    }
    return table[fidelity];
  }

  // ── pure helper: desaturateToken ───────────────────────────────────
  //
  // The engine's core. Take a resolved CSS color value and a fidelity
  // stage; return a `#rrggbb` string whose saturation has been scaled
  // by the stage's chroma factor while LIGHTNESS is preserved exactly.
  //
  //   desaturateToken('#cc4488', 'wireframe') -> a pure grey
  //   desaturateToken('#cc4488', 'hi')        -> '#cc4488' (untouched)
  //
  // Lightness preservation is what makes the ramp theme-correct: a
  // light theme's canvas stays light-grey, a dark theme's stays
  // dark-grey. An unparseable input is returned UNCHANGED — a
  // non-destructive choice so a malformed fallback never crashes a
  // render (and `hi` returns the input verbatim regardless).
  function desaturateToken(cssColor, fidelity, isAccent) {
    var k = fidelityFactor(fidelity, isAccent);
    if (k >= 1) { return cssColor; }   // hi — real token, no work
    var rgb = parseColor(cssColor);
    if (!rgb) { return cssColor; }     // unparseable -> leave as-is
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.s = hsl.s * k;                 // scale chroma, keep lightness
    return _rgbToHex(hslToRgb(hsl.h, hsl.s, hsl.l));
  }

  // ── token resolution off :root ─────────────────────────────────────
  //
  // Read --vc-color-<role> off :root. Returns the resolved value, or
  // the canonical fallback hex when the engine has not emitted it
  // (standalone-fixture path — graceful degradation of appearance).
  function readRoleColor(role) {
    var fallback = FALLBACK_HEX[role] || '#808080';
    if (typeof document === 'undefined' || !document.documentElement) {
      return fallback;
    }
    var raw = '';
    try {
      raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--vc-color-' + role);
    } catch (e) {
      return fallback;
    }
    raw = (raw || '').trim();
    return raw || fallback;
  }

  // ── fidelity validation ────────────────────────────────────────────
  //
  // A wireframe root carries data-wf-fidelity. Resolve + validate it:
  // an absent attribute defaults to `wireframe` (the safe default — a
  // bare .wf-root is a wireframe). A PRESENT-but-invalid value throws
  // loud (spec §5.0 fail-fast) — no silent coercion.
  function resolveFidelity(el) {
    if (!el || !el.getAttribute) { return 'wireframe'; }
    var raw = el.getAttribute('data-wf-fidelity');
    if (raw === null || raw === undefined || raw === '') {
      return 'wireframe';
    }
    var v = String(raw).trim();
    for (var i = 0; i < FIDELITY_STAGES.length; i++) {
      if (FIDELITY_STAGES[i] === v) { return v; }
    }
    throw new Error(
      'wireframe: invalid data-wf-fidelity "' + v + '" — expected ' +
      FIDELITY_STAGES.join('|')
    );
  }

  // ── desaturation: publish the scoped --vc-color-* set ──────────────
  //
  // For one wireframe root at fidelity `fid`, compute the desaturated
  // value of every COLOR_ROLE and set it as an inline --vc-color-<role>
  // custom property ON THAT ROOT. Because custom properties cascade,
  // every kit class — and any nested component (a chart, a diagram) —
  // inside the subtree now reads the desaturated value. This is the
  // one thing CSS cannot do alone: `filter: grayscale()` desaturates
  // rendered pixels but cannot rewrite the custom property descendant
  // components read to paint themselves.
  //
  // At fidelity `hi` every role resolves to k>=1, desaturateToken
  // returns the input untouched, and the inline set is the real theme
  // — so the hi column shows the live DESIGN.md exactly.
  function publishScopedColors(rootEl, fid) {
    if (!rootEl || !rootEl.style) { return; }
    for (var i = 0; i < COLOR_ROLES.length; i++) {
      var role = COLOR_ROLES[i];
      var isAccent = (role === 'accent');
      var resolved = readRoleColor(role);
      var grey = desaturateToken(resolved, fid, isAccent);
      rootEl.style.setProperty('--vc-color-' + role, grey);
    }
  }

  // ── --wf-lines pass ────────────────────────────────────────────────
  //
  // Each `.wf-text` may carry data-wf-lines="N" — the count of grey
  // placeholder bars the CSS repeating-gradient draws. CSS attr() is
  // not portable inside a gradient, so the module mirrors the integer
  // into a --wf-lines custom property the gradient can consume. With
  // JS off the CSS fallback renders a fixed 3-bar block — graceful,
  // still reads as placeholder text.
  function applyTextLines(root) {
    var d = root || document;
    if (!d.querySelectorAll) { return; }
    var nodes = d.querySelectorAll('.wf-text[data-wf-lines]');
    for (var i = 0; i < nodes.length; i++) {
      var n = parseInt(nodes[i].getAttribute('data-wf-lines'), 10);
      if (!isFinite(n) || n < 1) { n = 1; }
      if (n > 12) { n = 12; }   // sanity cap — a placeholder, not an essay
      nodes[i].style.setProperty('--wf-lines', String(n));
    }
  }

  // ── applyFidelity — set + re-desaturate one subtree ────────────────
  //
  // The public per-subtree entry point. Validates `fidelity`, writes
  // the attribute, and re-publishes the scoped color set. Used by the
  // slider handler and exported for programmatic fidelity changes.
  function applyFidelity(rootEl, fidelity) {
    if (!rootEl || !rootEl.setAttribute) { return; }
    var v = String(fidelity).trim();
    var ok = false;
    for (var i = 0; i < FIDELITY_STAGES.length; i++) {
      if (FIDELITY_STAGES[i] === v) { ok = true; }
    }
    if (!ok) {
      throw new Error(
        'wireframe: applyFidelity — invalid fidelity "' + v +
        '" (expected ' + FIDELITY_STAGES.join('|') + ')'
      );
    }
    rootEl.setAttribute('data-wf-fidelity', v);
    publishScopedColors(rootEl, v);
  }

  // ── the fidelity slider (spec §7.3) ────────────────────────────────
  //
  // Wire every `input.wf-fidelity-slider[data-wf-target]`. On the
  // `input` event the slider value 0|1|2|3 maps to the matching
  // FIDELITY_STAGES entry, which is applied to the target root. The
  // underlying control is a native `<input type="range">`, so it is
  // keyboard-accessible and JS-off-degradable (with JS off it just
  // shows the wireframe-fidelity screen, the safe default).
  //
  // A `data-wf-wired` guard makes re-wiring (via refresh()) idempotent.
  function wireSliders(root) {
    var d = root || document;
    if (!d.querySelectorAll) { return; }
    var sliders = d.querySelectorAll('.wf-fidelity-slider[data-wf-target]');
    for (var i = 0; i < sliders.length; i++) {
      (function (slider) {
        if (slider.getAttribute('data-wf-wired') === '1') { return; }
        slider.setAttribute('data-wf-wired', '1');
        var targetId = slider.getAttribute('data-wf-target');
        function onInput() {
          var target = document.getElementById(targetId);
          if (!target) { return; }
          var idx = parseInt(slider.value, 10);
          if (!isFinite(idx)) { idx = 0; }
          if (idx < 0) { idx = 0; }
          if (idx > FIDELITY_STAGES.length - 1) {
            idx = FIDELITY_STAGES.length - 1;
          }
          applyFidelity(target, FIDELITY_STAGES[idx]);
        }
        slider.addEventListener('input', onInput);
        slider.addEventListener('change', onInput);
        // Prime: apply whatever the slider's initial value points at,
        // so a non-zero authored `value` is honoured on load.
        onInput();
      })(sliders[i]);
    }
  }

  // ── theme-change re-desaturation ───────────────────────────────────
  //
  // When the active theme flips (a manual toggle, or a DESIGN.md
  // hot-swap) the engine re-resolves --vc-color-* on :root. Every
  // wireframe must then re-desaturate off the NEW theme so the
  // grayscale tracks the theme (light theme -> light-grey, dark theme
  // -> dark-grey) and the hi-fi column shows the new palette.
  //
  // The runtime is REQUESTED (spec §9) to dispatch a `ve:themechange`
  // DOM event on `document` from its theme-apply path. This module
  // subscribes to that event IF it is dispatched — but it does not
  // DEPEND on it: the subscription is a passive listener, and a host
  // that never fires the event simply never triggers a re-render
  // (the initial desaturation at init() still happened). The module
  // is fully defensive; cross-file wiring is a later integration pass.
  function _onThemeChange() {
    _redesaturateAll(document);
  }

  // Re-publish the scoped color set for every wireframe root currently
  // in the document. Called on a theme-change signal and by refresh().
  function _redesaturateAll(root) {
    var d = root || document;
    if (!d.querySelectorAll) { return; }
    var roots = d.querySelectorAll('[data-wf-root]');
    for (var i = 0; i < roots.length; i++) {
      var fid = resolveFidelity(roots[i]);
      publishScopedColors(roots[i], fid);
    }
  }

  // Subscribe to the runtime's theme-change signal. Guarded so a
  // double init() does not stack listeners. No-op under Node.
  var _themeWired = false;
  function _wireThemeListener() {
    if (_themeWired) { return; }
    if (typeof document === 'undefined' || !document.addEventListener) {
      return;
    }
    _themeWired = true;
    document.addEventListener('ve:themechange', _onThemeChange);
  }

  // ── init — scan + wire every wireframe ─────────────────────────────
  //
  // The single public entry the runtime calls once from bootEverything.
  //   1. Scan for [data-wf-root] / [data-wf-fidelity]. If none -> return
  //      immediately (a report page with no wireframe pays nothing).
  //   2. For each root: validate fidelity (fail-fast on a bad value),
  //      run the desaturation, publish the scoped --vc-color-* set.
  //   3. Mirror data-wf-lines into --wf-lines on every .wf-text.
  //   4. Wire every .wf-fidelity-slider.
  //   5. Subscribe to the theme-change signal so desaturation re-runs.
  function init(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return; }

    var roots = d.querySelectorAll('[data-wf-root], [data-wf-fidelity]');
    if (!roots.length) { return; }   // no wireframe on this page — no-op

    // De-dup: an element can match both selectors.
    var seen = [];
    var unique = [];
    var i;
    for (i = 0; i < roots.length; i++) {
      var dup = false;
      for (var j = 0; j < seen.length; j++) {
        if (seen[j] === roots[i]) { dup = true; }
      }
      if (!dup) { seen.push(roots[i]); unique.push(roots[i]); }
    }

    // Validate every fidelity FIRST — a bad value throws before any
    // partial desaturation runs (fail-fast, no half-rendered state).
    var fids = [];
    for (i = 0; i < unique.length; i++) {
      fids.push(resolveFidelity(unique[i]));
    }
    // All valid — publish the scoped colors.
    for (i = 0; i < unique.length; i++) {
      publishScopedColors(unique[i], fids[i]);
    }

    applyTextLines(d);
    wireSliders(d);
    _wireThemeListener();
  }

  // ── refresh — re-scan after dynamic DOM insertion ──────────────────
  //
  // Re-runs desaturation + the --wf-lines pass + slider wiring. The
  // slider's data-wf-wired guard keeps re-wiring idempotent; already-
  // desaturated roots are simply re-published (cheap, idempotent).
  function refresh(root) {
    var d = root || document;
    _redesaturateAll(d);
    applyTextLines(d);
    wireSliders(d);
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    init: init,
    refresh: refresh,
    applyFidelity: applyFidelity,
    // Pure helpers — unit-testable under Node.
    desaturateToken: desaturateToken,
    fidelityFactor: fidelityFactor,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    parseColor: parseColor,
    resolveFidelity: resolveFidelity,
    // Exposed constants — let a test assert against the canonical sets.
    FIDELITY_STAGES: FIDELITY_STAGES,
    COLOR_ROLES: COLOR_ROLES
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpWireframe = _api;
    // Test hook — mirrors window.__veAnimation / __veDesignMd so the
    // dev-browser suite can drive the module deterministically.
    window.__veWireframe = {
      get state() {
        var roots = (typeof document !== 'undefined'
          && document.querySelectorAll)
          ? document.querySelectorAll('[data-wf-root]').length : 0;
        return { wireframeRoots: roots, themeWired: _themeWired };
      },
      init: init,
      refresh: refresh,
      applyFidelity: applyFidelity,
      desaturateToken: desaturateToken
    };

    // Self-init on DOMContentLoaded — UNLESS the host opted out via
    // window.__wfManualInit (the runtime sets this so it controls the
    // engine -> tokens -> wireframe-init ordering; the test fixture
    // also sets it for deterministic control).
    if (!window.__wfManualInit) {
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
