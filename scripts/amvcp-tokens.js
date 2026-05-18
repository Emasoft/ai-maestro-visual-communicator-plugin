/*!
 * ai-maestro-visual-communicator-plugin — design-token generators,
 * anti-AI-slop gate, named-preset library and semantic role maps.
 *
 * Phase 2 Build #1 (design-tokens). This module sits ON TOP of the
 * Phase-1 DESIGN.md engine (amvcp-designmd.js): the engine parses /
 * validates / resolves / applies a DESIGN.md as `--vc-*` custom
 * properties; this module is the authoring-time / contact-sheet-time
 * helper layer — principled scale generators, a consolidated anti-slop
 * lint, ~12 dual-theme presets, and the domain semantic-role color maps.
 *
 * It is kept separate from the engine on purpose: the engine is the
 * runtime-critical parse/apply path that every page loads; the
 * generators + preset blobs + role tables are not needed by a finished
 * report page, so folding them into the engine would bloat the
 * always-loaded bundle.
 *
 * Dependency direction: this module OPTIONALLY references
 * `window.amvcpDesignMd` (to validate a generated preset) but degrades
 * to pure data when the engine is absent — it never hard-fails on a
 * missing optional peer, only on a contract violation.
 *
 * Dual export:
 *   - browser: `window.amvcpTokens = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js and scripts/amvcp-runtime.js —
 * `var`, function declarations, ES5-safe, no arrow functions, no
 * template literals, no classes, no build step, no npm runtime deps.
 *
 * All color math (sRGB <-> linear, OKLab, OKLCh, the WCAG contrast
 * formula, the golden-angle rotation, the anti-slop deltaE check) is
 * hand-written from the published math — no color library is used or
 * copied. The references that informed the math are DATA, not source.
 *
 * Public API:
 *   generatePhiSpacing(basePx, steps)        -> [int, …]
 *   generateOklchRamp(seedHex, steps, opts)  -> [hex, …]  (+ .p3 opt)
 *   generateNeutralScale(inkHex, stops)      -> [{stop,value}, …]
 *   generateElevationScale(opts)             -> {shadow-0..4, shadow-border}
 *   generateMotionLibrary()                  -> {durations:{}, easings:{}}
 *   generateZIndexScale()                    -> {behind:-1, …, tooltip:600}
 *   generateCategoricalHues(seedHex, count)  -> [hex, …]  (golden-angle)
 *   applyPersonalityDelta(designmdText, name)-> text
 *   lintTokenSet(designmdOrTokenMap)         -> { ok, violations:[…] }
 *   lintHtml(htmlString)                     -> { ok, violations:[…] }
 *   lintLiveDocument(rootEl)                 -> { ok, violations:[…] }
 *   renderRoleMapCss(name)                   -> "<style>…"
 *   PRESETS / ROLE_MAPS / BANNED_COLORS / BANNED_FONTS / BANNED_PATTERNS
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The golden ratio — drives the phi spacing scale and the phi
  // lightness-decay curve of the OKLCh ramp. A fixed mathematical
  // constant, NOT a brand value, so it is correctly hardcoded.
  var PHI = 1.618;

  // The golden angle in degrees — the hue step that maximises visual
  // separation between any N categorical colors. Also a fixed constant.
  var GOLDEN_ANGLE = 137.508;

  // Anti-slop OKLab deltaE threshold for a "near-match" against a banned
  // color. Small enough that an off-black like #0a0a0a does NOT trip the
  // pure-black rule, large enough that a one-digit-off AI purple does.
  var SLOP_DELTA_E = 0.05;

  // ── sRGB <-> linear sRGB ───────────────────────────────────────────

  // Gamma-decode one 0..255 channel to linear-light 0..1.
  function srgbChannelToLinear(c255) {
    var c = c255 / 255;
    if (c <= 0.04045) {
      return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
  }

  // Gamma-encode one linear-light 0..1 channel back to 0..255 (rounded).
  function linearToSrgbChannel(lin) {
    var c;
    if (lin <= 0.0031308) {
      c = lin * 12.92;
    } else {
      c = 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
    }
    return Math.round(clamp01(c) * 255);
  }

  function clamp01(x) {
    if (x < 0) { return 0; }
    if (x > 1) { return 1; }
    return x;
  }

  // ── hex parsing / formatting ───────────────────────────────────────

  // Parse a #rgb / #rrggbb hex into {r,g,b} 0..255. Fail-fast: an
  // unparseable seed is a contract violation, so this THROWS — callers
  // that want a soft answer (the lint) catch it.
  function parseHex(hex) {
    if (typeof hex !== 'string') {
      throw new Error('parseHex: expected a string, got ' + typeof hex);
    }
    var s = hex.replace(/^\s+|\s+$/g, '');
    if (s.charAt(0) === '#') {
      s = s.slice(1);
    }
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      return {
        r: parseInt(s.charAt(0) + s.charAt(0), 16),
        g: parseInt(s.charAt(1) + s.charAt(1), 16),
        b: parseInt(s.charAt(2) + s.charAt(2), 16)
      };
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16)
      };
    }
    throw new Error('parseHex: not a #rgb / #rrggbb hex — "' + hex + '"');
  }

  // Format {r,g,b} 0..255 as a lowercase #rrggbb string.
  function formatHex(rgb) {
    return '#' + hex2(rgb.r) + hex2(rgb.g) + hex2(rgb.b);
  }

  function hex2(n) {
    var v = Math.round(n);
    if (v < 0) { v = 0; }
    if (v > 255) { v = 255; }
    var s = v.toString(16);
    return s.length === 1 ? '0' + s : s;
  }

  // ── linear sRGB <-> OKLab <-> OKLCh ────────────────────────────────
  //
  // Björn Ottosson's OKLab — the matrices below are the published
  // forward/inverse transforms. Re-typed from the math, not copied from
  // any implementation.

  // {r,g,b} 0..255 sRGB -> {L,a,b} OKLab.
  function srgbToOklab(rgb) {
    var r = srgbChannelToLinear(rgb.r);
    var g = srgbChannelToLinear(rgb.g);
    var b = srgbChannelToLinear(rgb.b);
    return linearToOklab(r, g, b);
  }

  // linear-light r,g,b 0..1 -> {L,a,b} OKLab.
  function linearToOklab(r, g, b) {
    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    var l_ = Math.cbrt(l);
    var m_ = Math.cbrt(m);
    var s_ = Math.cbrt(s);
    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    };
  }

  // {L,a,b} OKLab -> linear-light {r,g,b} 0..1 (may be out of gamut).
  function oklabToLinear(lab) {
    var l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
    var m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
    var s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;
    var l = l_ * l_ * l_;
    var m = m_ * m_ * m_;
    var s = s_ * s_ * s_;
    return {
      r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    };
  }

  // {L,a,b} -> {L,C,h} (h in radians).
  function oklabToOklch(lab) {
    return {
      L: lab.L,
      C: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
      h: Math.atan2(lab.b, lab.a)
    };
  }

  // {L,C,h} -> {L,a,b}.
  function oklchToOklab(lch) {
    return {
      L: lch.L,
      a: lch.C * Math.cos(lch.h),
      b: lch.C * Math.sin(lch.h)
    };
  }

  // Is a linear-light triple inside the [0,1] sRGB gamut?
  function inGamut(lin) {
    return lin.r >= -0.0001 && lin.r <= 1.0001 &&
      lin.g >= -0.0001 && lin.g <= 1.0001 &&
      lin.b >= -0.0001 && lin.b <= 1.0001;
  }

  // Convert an OKLCh color to an sRGB hex. If the color is out of gamut,
  // reduce chroma toward 0 (× 0.98 per step) until it fits — NEVER clip
  // a channel directly, because clipping shifts the hue. Lightness is
  // preserved; only chroma is sacrificed.
  function oklchToHex(lch) {
    var work = { L: lch.L, C: lch.C, h: lch.h };
    var lin = oklabToLinear(oklchToOklab(work));
    var guard = 0;
    while (!inGamut(lin) && work.C > 0.0001 && guard < 200) {
      work.C = work.C * 0.98;
      lin = oklabToLinear(oklchToOklab(work));
      guard++;
    }
    return formatHex({
      r: linearToSrgbChannel(lin.r),
      g: linearToSrgbChannel(lin.g),
      b: linearToSrgbChannel(lin.b)
    });
  }

  // Convert an OKLCh color to a `color(display-p3 …)` string. The P3
  // gamut is wider, so no gamut-clip is applied — the P3 path is a
  // progressive-enhancement add-on. Channels are clamped to [0,1] only
  // as a final safety (a value just outside is rounding noise).
  function oklchToP3(lch) {
    // P3 shares OKLab's relationship with linear-light RGB only up to
    // the RGB primaries; for the progressive-enhancement use here the
    // linear sRGB triple is reused and emitted in the P3 color space —
    // browsers map it through the wider gamut, so a vivid accent that
    // sRGB would clip survives. Channels clamped as rounding guard.
    var lin = oklabToLinear(oklchToOklab(lch));
    return 'color(display-p3 ' +
      round4(clamp01(lin.r)) + ' ' +
      round4(clamp01(lin.g)) + ' ' +
      round4(clamp01(lin.b)) + ')';
  }

  function round4(x) {
    return Math.round(x * 10000) / 10000;
  }

  // ── 1a. generatePhiSpacing ─────────────────────────────────────────
  //
  // value[n] = round(basePx * PHI^n) for n = 0 … steps-1. The result
  // feeds a DESIGN.md's `spacing.scale`, which the engine requires to be
  // strictly ascending — so the generator ASSERTS ascending and throws
  // fail-fast if a pathological basePx < 3 ever collapses two steps.
  function generatePhiSpacing(basePx, steps) {
    var base = (typeof basePx === 'number') ? basePx : 4;
    var n = (typeof steps === 'number') ? steps : 9;
    if (!(base > 0) || !isFinite(base)) {
      throw new Error('generatePhiSpacing: basePx must be a positive number');
    }
    if (!(n >= 1) || Math.floor(n) !== n) {
      throw new Error('generatePhiSpacing: steps must be a positive integer');
    }
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      out.push(Math.round(base * Math.pow(PHI, i)));
    }
    // Fail-fast: the engine rejects a non-ascending scale, so a generator
    // that produced one is broken — surface it here, not at parse time.
    for (i = 1; i < out.length; i++) {
      if (out[i] <= out[i - 1]) {
        throw new Error(
          'generatePhiSpacing: scale collapsed at index ' + i +
          ' (' + out[i] + ' <= ' + out[i - 1] + ') — basePx too small'
        );
      }
    }
    return out;
  }

  // The Radix-approximating 12-stop lightness table (backgrounds →
  // accessible-text), used by generateOklchRamp's 'radix' curve mode.
  var RADIX_LIGHTNESS = [
    0.99, 0.975, 0.95, 0.92, 0.88, 0.83,
    0.77, 0.70, 0.62, 0.54, 0.44, 0.32
  ];

  // ── 1b. generateOklchRamp ──────────────────────────────────────────
  //
  // A perceptual color ramp: hold the seed's hue + chroma constant and
  // vary lightness across `steps` stops. Two curve modes:
  //   'phi'   — L[n] = Lmax * (PHI^-0.35)^n  (default)
  //   'radix' — sample the 12-stop RADIX_LIGHTNESS table
  // opts.p3 — also return a parallel `color(display-p3 …)` array.
  function generateOklchRamp(seedHex, steps, opts) {
    var n = (typeof steps === 'number') ? steps : 10;
    if (!(n >= 1) || Math.floor(n) !== n) {
      throw new Error('generateOklchRamp: steps must be a positive integer');
    }
    var o = opts || {};
    var curve = o.curve === 'radix' ? 'radix' : 'phi';
    var lmax = (typeof o.Lmax === 'number') ? o.Lmax : 0.95;
    // parseHex throws on a bad seed — that is the documented fail-fast.
    var seedLch = oklabToOklch(srgbToOklab(parseHex(seedHex)));
    var lightness = rampLightness(curve, n, lmax);
    var ramp = [];
    var p3 = [];
    var i;
    for (i = 0; i < n; i++) {
      var lch = { L: lightness[i], C: seedLch.C, h: seedLch.h };
      ramp.push(oklchToHex(lch));
      if (o.p3) {
        p3.push(oklchToP3(lch));
      }
    }
    if (o.p3) {
      // Attach the P3 array as a non-enumerable-ish sidecar property so
      // the ramp is still a plain array for the common path.
      ramp.p3 = p3;
    }
    return ramp;
  }

  // Build the lightness sequence for a ramp of `n` stops.
  function rampLightness(curve, n, lmax) {
    var out = [];
    var i;
    if (curve === 'radix') {
      if (n === 12) {
        return RADIX_LIGHTNESS.slice();
      }
      // Sample / interpolate the 12-stop table for any other length.
      for (i = 0; i < n; i++) {
        var t = (n === 1) ? 0 : (i / (n - 1)) * (RADIX_LIGHTNESS.length - 1);
        var lo = Math.floor(t);
        var hi = Math.ceil(t);
        var frac = t - lo;
        out.push(
          RADIX_LIGHTNESS[lo] * (1 - frac) + RADIX_LIGHTNESS[hi] * frac
        );
      }
      return out;
    }
    // 'phi' — phi lightness decay.
    var decay = Math.pow(PHI, -0.35);
    for (i = 0; i < n; i++) {
      out.push(lmax * Math.pow(decay, i));
    }
    return out;
  }

  // ── 1c. generateNeutralScale ───────────────────────────────────────
  //
  // A single-ink neutral scale: for each opacity percentage `p`, the
  // entry value is the string `color-mix(in srgb, <ink> p%, transparent)`.
  // This is the runtime's proven `--ve-control-fg-dim` pattern. The
  // output feeds border / content-muted / content-subtle roles when an
  // author wants them tonally locked to `content`.
  function generateNeutralScale(inkHex, stops) {
    // Validate the ink up front (throws on a bad hex — fail-fast).
    parseHex(inkHex);
    var pct = isArray(stops) ? stops : [4, 8, 12, 15, 30, 50, 70, 90];
    var out = [];
    var i;
    for (i = 0; i < pct.length; i++) {
      var p = pct[i];
      if (typeof p !== 'number' || p < 0 || p > 100) {
        throw new Error(
          'generateNeutralScale: stop ' + jsonish(p) +
          ' must be a percentage 0..100'
        );
      }
      out.push({
        stop: p,
        value: 'color-mix(in srgb, ' + normHex(inkHex) + ' ' + p +
          '%, transparent)'
      });
    }
    return out;
  }

  // ── 1d. generateElevationScale ─────────────────────────────────────
  //
  // Returns the {shadow-0 … shadow-4, shadow-border} map. opts.style:
  //   'md3'       — the MD3 two-layer key+ambient values (default)
  //   'cinematic' — a layered penumbra stack with decaying alpha
  // opts.tint (a hex) — when set, the shadow color is a brand-hued
  // color-mix instead of pure black.
  function generateElevationScale(opts) {
    var o = opts || {};
    var style = o.style === 'cinematic' ? 'cinematic' : 'md3';
    var tint = o.tint ? normHex(o.tint) : null;

    // A shadow color at alpha `a`: tinted color-mix, or plain black rgba.
    function ink(a) {
      if (tint) {
        return 'color-mix(in srgb, ' + tint + ' ' +
          Math.round(a * 100) + '%, transparent)';
      }
      return 'rgba(0,0,0,' + a + ')';
    }

    if (style === 'cinematic') {
      // A penumbra stack — each level is a stack of progressively
      // larger, fainter layers. shadow-4 is the full 6-layer stack;
      // lower levels are proportionally shorter.
      var alphas = [0.12, 0.10, 0.08, 0.06, 0.04, 0.02];
      function stack(layers) {
        var parts = [];
        var i;
        for (i = 0; i < layers; i++) {
          var d = Math.pow(2, i);   // 1,2,4,8,16,32
          parts.push('0 ' + d + 'px ' + d + 'px ' + ink(alphas[i]));
        }
        return parts.join(', ');
      }
      return {
        'shadow-0': 'none',
        'shadow-1': stack(2),
        'shadow-2': stack(3),
        'shadow-3': stack(4),
        'shadow-4': stack(6),
        'shadow-border': '0 0 0 1px ' + ink(0.08)
      };
    }

    // 'md3' — the two-layer key+ambient model.
    return {
      'shadow-0': 'none',
      'shadow-1': '0 1px 2px ' + ink(0.06) + ', 0 1px 3px ' + ink(0.10),
      'shadow-2': '0 2px 4px ' + ink(0.06) + ', 0 4px 12px ' + ink(0.12),
      'shadow-3': '0 4px 8px ' + ink(0.08) + ', 0 8px 20px ' + ink(0.14),
      'shadow-4': '0 8px 16px ' + ink(0.10) + ', 0 16px 40px ' + ink(0.18),
      'shadow-border': '0 0 0 1px ' + ink(0.08)
    };
  }

  // ── 1e. generateMotionLibrary ──────────────────────────────────────
  //
  // The canonical 8-duration + 8-easing set. A function (not a bare
  // object) for API symmetry and so a future opts.scale multiplier can
  // be added without an API break.
  function generateMotionLibrary() {
    return {
      durations: {
        'duration-instant': 50,
        'duration-fast': 100,
        'duration-quick': 200,
        'duration-base': 300,
        'duration-moderate': 400,
        'duration-slow': 500,
        'duration-lazy': 700,
        'duration-glacial': 1000
      },
      easings: {
        'easing-standard': 'cubic-bezier(0.2,0,0,1)',
        'easing-decel': 'cubic-bezier(0,0,0,1)',
        'easing-accel': 'cubic-bezier(0.3,0,1,1)',
        'easing-emphasized-decel': 'cubic-bezier(0.05,0.7,0.1,1)',
        'easing-emphasized-accel': 'cubic-bezier(0.3,0,0.8,0.15)',
        'easing-spring': 'cubic-bezier(0.175,0.885,0.32,1.275)',
        'easing-bounce': 'cubic-bezier(0.34,1.56,0.64,1)',
        'easing-linear': 'linear'
      }
    };
  }

  // ── 1f. generateZIndexScale ────────────────────────────────────────
  //
  // The canonical 9-level stacking scale.
  function generateZIndexScale() {
    return {
      behind: -1,
      base: 0,
      raised: 10,
      dropdown: 100,
      sticky: 200,
      overlay: 300,
      modal: 400,
      toast: 500,
      tooltip: 600
    };
  }

  // ── golden-angle categorical hues ──────────────────────────────────
  //
  // N brand-coherent, maximally-separated hues: take the seed's OKLCh
  // L and C, rotate the hue by the golden angle for each step. Used by
  // the activity / graph-node / icon-tint role maps.
  function generateCategoricalHues(seedHex, count) {
    var n = (typeof count === 'number') ? count : 6;
    if (!(n >= 1) || Math.floor(n) !== n) {
      throw new Error(
        'generateCategoricalHues: count must be a positive integer'
      );
    }
    var seed = oklabToOklch(srgbToOklab(parseHex(seedHex)));
    // A categorical ramp wants a vivid, consistent L/C — clamp the
    // seed's L into a mid band so a very dark or very light seed still
    // yields readable chips, and give it a healthy minimum chroma.
    var L = Math.min(0.78, Math.max(0.58, seed.L));
    var C = Math.max(0.11, seed.C);
    var step = (GOLDEN_ANGLE * Math.PI) / 180;
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      out.push(oklchToHex({ L: L, C: C, h: seed.h + step * i }));
    }
    return out;
  }

  // ── deltaE for the anti-slop near-match check ──────────────────────
  //
  // Euclidean distance in OKLab — perceptually uniform enough that a
  // small fixed threshold separates "the same color" from "a different
  // color". Used only by the lint.
  function oklabDeltaE(hexA, hexB) {
    var a = srgbToOklab(parseHex(hexA));
    var b = srgbToOklab(parseHex(hexB));
    var dL = a.L - b.L;
    var da = a.a - b.a;
    var db = a.b - b.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  // ── 7. contrastRatio (WCAG) ────────────────────────────────────────
  //
  // The WCAG 2.x contrast ratio between two hex colors. Relative
  // luminance L = 0.2126 R + 0.7152 G + 0.0722 B where each channel is
  // the gamma-decoded linear value; ratio = (Lmax + 0.05)/(Lmin + 0.05).
  // Re-authored from the WCAG spec math.
  function relativeLuminance(hex) {
    var rgb = parseHex(hex);
    return 0.2126 * srgbChannelToLinear(rgb.r) +
      0.7152 * srgbChannelToLinear(rgb.g) +
      0.0722 * srgbChannelToLinear(rgb.b);
  }

  function contrastRatio(hexA, hexB) {
    var la = relativeLuminance(hexA);
    var lb = relativeLuminance(hexB);
    var hi = Math.max(la, lb);
    var lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  // ── 6. Anti-AI-slop gate ───────────────────────────────────────────

  // Banned colors — the purple/violet/indigo AI family + a bright blue,
  // checked by OKLab near-match — plus pure black/white, checked EXACT.
  // An off-black (#0a0a0a) or off-white (#faf6ee) is correct; only the
  // literal pure values are slop.
  var BANNED_COLORS = {
    // near-match set (deltaE < SLOP_DELTA_E flags)
    near: [
      '#8b5cf6', '#a855f7', '#6366f1', '#7c3aed', '#9333ea',
      '#c4b5fd', '#3b82f6'
    ],
    // exact-match set (only the literal value is slop)
    exact: ['#000000', '#ffffff']
  };

  // Banned primary fonts — flagged ONLY as the first (primary) family of
  // a --vc-font-heading / --vc-font-body stack. As a fallback later in a
  // stack they are fine.
  var BANNED_FONTS = ['inter', 'roboto', 'open sans', 'lato', 'nunito'];

  // Banned visual patterns — substrings / regex sources the HTML & CSS
  // scanners look for. Each carries a human-readable reason.
  var BANNED_PATTERNS = [
    {
      kind: 'gradient-bg',
      reason: 'linear-gradient page/section background — AI-slop visual',
      test: /linear-gradient\s*\(/i
    },
    {
      kind: 'gradient-135',
      reason: 'linear-gradient(135deg, …) with a purple→blue pair',
      test: /linear-gradient\s*\(\s*135deg/i
    },
    {
      kind: 'glassmorphism',
      reason: 'backdrop-filter: blur() glassmorphism layer',
      test: /backdrop-filter\s*:\s*[^;]*blur\s*\(/i
    },
    {
      kind: 'gradient-text',
      reason: 'gradient text (background-clip:text on a heading)',
      test: /background-clip\s*:\s*text/i
    }
  ];

  // Normalize a color-ish string to a #rrggbb hex, or return null if it
  // is not a plain hex (the lint only flags hexes — a var() / named /
  // rgb() value cannot be a literal banned hex). Throws are swallowed.
  function tryNormHex(value) {
    if (typeof value !== 'string') {
      return null;
    }
    var s = value.replace(/^\s+|\s+$/g, '');
    if (s.charAt(0) !== '#') {
      return null;
    }
    try {
      return formatHex(parseHex(s));
    } catch (e) {
      return null;
    }
  }

  // Is `hex` (already #rrggbb lowercase) a banned color? Returns the
  // reason string or null.
  function bannedColorReason(hex) {
    var i;
    for (i = 0; i < BANNED_COLORS.exact.length; i++) {
      if (hex === BANNED_COLORS.exact[i]) {
        return 'pure ' + (hex === '#000000' ? 'black' : 'white') +
          ' (' + hex + ') — use an off-black/off-white instead';
      }
    }
    for (i = 0; i < BANNED_COLORS.near.length; i++) {
      var banned = BANNED_COLORS.near[i];
      var dE;
      try {
        dE = oklabDeltaE(hex, banned);
      } catch (e) {
        dE = 999;
      }
      if (dE < SLOP_DELTA_E) {
        return 'AI-slop purple/blue family — ' + hex +
          ' is within ' + SLOP_DELTA_E + ' OKLab deltaE of banned ' + banned;
      }
    }
    return null;
  }

  // Extract the first (primary) font family from a CSS font-family
  // string, lowercased and unquoted. "Inter, system-ui" -> "inter".
  function primaryFontFamily(stack) {
    if (typeof stack !== 'string') {
      return '';
    }
    var first = stack.split(',')[0];
    return first
      .replace(/['"]/g, '')
      .replace(/^\s+|\s+$/g, '')
      .toLowerCase();
  }

  // lintTokenSet — run the gate over a parsed designmd OR a flat
  // { '--vc-*': value } token map OR a raw DESIGN.md text string.
  // Returns { ok, violations:[{kind,token,value,reason}] }.
  function lintTokenSet(input) {
    var violations = [];
    var tokenMap = coerceToTokenMap(input);
    var key;
    for (key in tokenMap) {
      if (!Object.prototype.hasOwnProperty.call(tokenMap, key)) {
        continue;
      }
      var value = tokenMap[key];
      // Font tokens — only --vc-font-heading / --vc-font-body are
      // checked for a banned PRIMARY family.
      if (key === '--vc-font-heading' || key === '--vc-font-body') {
        var primary = primaryFontFamily(value);
        if (indexOf(BANNED_FONTS, primary) !== -1) {
          violations.push({
            kind: 'font',
            token: key,
            value: String(value),
            reason: 'banned primary font "' + primary +
              '" — fine as a fallback, not as the leading family'
          });
        }
        continue;
      }
      // Color tokens — any value that is a literal hex is checked.
      var hex = tryNormHex(value);
      if (hex) {
        var reason = bannedColorReason(hex);
        if (reason) {
          violations.push({
            kind: 'color',
            token: key,
            value: String(value),
            reason: reason
          });
        }
      }
    }
    return { ok: violations.length === 0, violations: violations };
  }

  // Turn the various accepted lintTokenSet inputs into a flat
  // { '--vc-*': value } map. A parsed designmd is run through the engine
  // (both themes merged so a slop dark color is caught too); a raw
  // string is parsed first; a flat map is used as-is.
  function coerceToTokenMap(input) {
    if (input == null) {
      throw new Error('lintTokenSet: input is null/undefined');
    }
    // Raw DESIGN.md text.
    if (typeof input === 'string') {
      var engine = getEngine();
      if (!engine) {
        throw new Error(
          'lintTokenSet: a raw DESIGN.md string needs the amvcp-designmd ' +
          'engine, which is not loaded'
        );
      }
      var parsed = engine.parseDesignMd(input);
      if (!parsed.ok) {
        throw new Error(
          'lintTokenSet: the DESIGN.md text does not parse — ' +
          (parsed.errors || []).join('; ')
        );
      }
      return mergeThemeMaps(parsed.designmd);
    }
    // A parsed designmd (has .tokens).
    if (input.tokens && typeof input.tokens === 'object') {
      return mergeThemeMaps(input);
    }
    // Otherwise assume it is already a flat token map.
    return input;
  }

  // Resolve BOTH themes of a parsed designmd and merge them so the lint
  // sees every color (a slop dark accent must be caught too). Theme-
  // agnostic tokens collide harmlessly (identical values).
  function mergeThemeMaps(designmd) {
    var engine = getEngine();
    if (!engine) {
      throw new Error(
        'lintTokenSet: resolving a parsed designmd needs the engine'
      );
    }
    var merged = {};
    var light = engine.resolveTokens(designmd, 'light');
    var dark = engine.resolveTokens(designmd, 'dark');
    var k;
    for (k in light) {
      if (Object.prototype.hasOwnProperty.call(light, k)) {
        merged[k] = light[k];
      }
    }
    for (k in dark) {
      if (Object.prototype.hasOwnProperty.call(dark, k)) {
        // Dark colors are keyed the same as light; rename so both are
        // linted without one clobbering the other.
        merged[k + '@dark'] = dark[k];
      }
    }
    return merged;
  }

  // lintHtml — scan a markup string for banned colors (literal hexes in
  // style="" / <style> blocks), banned fonts, and banned patterns.
  function lintHtml(htmlString) {
    var violations = [];
    if (typeof htmlString !== 'string') {
      throw new Error('lintHtml: expected an HTML string');
    }
    // Banned patterns — substring / regex scan over the whole document.
    var i;
    for (i = 0; i < BANNED_PATTERNS.length; i++) {
      var pat = BANNED_PATTERNS[i];
      if (pat.test.test(htmlString)) {
        violations.push({
          kind: pat.kind,
          token: null,
          value: null,
          reason: pat.reason
        });
      }
    }
    // Banned colors — every #rgb / #rrggbb literal in the markup.
    var hexRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
    var seenColors = {};
    var m;
    while ((m = hexRe.exec(htmlString)) !== null) {
      var norm = tryNormHex(m[0]);
      if (!norm || seenColors[norm]) {
        continue;
      }
      seenColors[norm] = true;
      var reason = bannedColorReason(norm);
      if (reason) {
        violations.push({
          kind: 'color',
          token: null,
          value: m[0],
          reason: reason
        });
      }
    }
    // Banned PRIMARY fonts — find `font-family:` declarations and check
    // the first family. Inter as a non-leading fallback is allowed.
    var ffRe = /font-family\s*:\s*([^;}"']+)/gi;
    var seenFonts = {};
    while ((m = ffRe.exec(htmlString)) !== null) {
      var primary = primaryFontFamily(m[1]);
      if (!primary || seenFonts[primary]) {
        continue;
      }
      seenFonts[primary] = true;
      if (indexOf(BANNED_FONTS, primary) !== -1) {
        violations.push({
          kind: 'font',
          token: null,
          value: m[1].replace(/^\s+|\s+$/g, ''),
          reason: 'banned primary font "' + primary +
            '" in a font-family declaration'
        });
      }
    }
    return { ok: violations.length === 0, violations: violations };
  }

  // lintLiveDocument — the in-browser variant. Walks the DOM under
  // rootEl, reads getComputedStyle, flags banned computed colors / fonts
  // / a gradient background, counts distinct accent hues (flags > 2),
  // and stamps `data-vc-slop-alert="<reason>"` on each offender.
  function lintLiveDocument(rootEl) {
    if (typeof document === 'undefined') {
      throw new Error('lintLiveDocument: no document — browser-only');
    }
    var root = rootEl || document.body;
    if (!root || typeof root.querySelectorAll !== 'function') {
      throw new Error('lintLiveDocument: rootEl is not a DOM element');
    }
    var violations = [];
    var nodes = root.querySelectorAll('*');
    var accentHues = {};
    var i;
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cs = window.getComputedStyle(el);
      var problems = [];

      // A gradient as the element's background-image.
      var bgImg = cs.backgroundImage || '';
      if (/linear-gradient\s*\(/i.test(bgImg)) {
        problems.push('linear-gradient background-image');
      }
      // A backdrop-filter blur (glassmorphism).
      var bf = cs.backdropFilter || cs.webkitBackdropFilter || '';
      if (/blur\s*\(/i.test(bf)) {
        problems.push('backdrop-filter blur (glassmorphism)');
      }
      // Banned computed text / background colors.
      var fg = cssColorToHex(cs.color);
      if (fg) {
        var fgReason = bannedColorReason(fg);
        if (fgReason) { problems.push(fgReason); }
        accentHues[fg] = true;
      }
      var bg = cssColorToHex(cs.backgroundColor);
      if (bg) {
        var bgReason = bannedColorReason(bg);
        if (bgReason) { problems.push(bgReason); }
      }
      // Banned PRIMARY font.
      var primary = primaryFontFamily(cs.fontFamily || '');
      if (primary && indexOf(BANNED_FONTS, primary) !== -1) {
        problems.push('banned primary font "' + primary + '"');
      }

      if (problems.length > 0) {
        var msg = problems.join('; ');
        el.setAttribute('data-vc-slop-alert', msg);
        violations.push({
          kind: 'live',
          token: null,
          value: el.tagName ? el.tagName.toLowerCase() : '?',
          reason: msg
        });
      }
    }
    // Accent-count audit — too many distinct foreground hues reads as
    // an uncoordinated palette. This is a coarse heuristic (it counts
    // every distinct text color), so the threshold is generous.
    var hueCount = 0;
    var h;
    for (h in accentHues) {
      if (Object.prototype.hasOwnProperty.call(accentHues, h)) {
        hueCount++;
      }
    }
    if (hueCount > 8) {
      violations.push({
        kind: 'accent-count',
        token: null,
        value: String(hueCount),
        reason: 'document uses ' + hueCount + ' distinct text colors — ' +
          'a coherent palette uses far fewer'
      });
    }
    return { ok: violations.length === 0, violations: violations };
  }

  // Best-effort conversion of a computed CSS color (`rgb(r, g, b)` /
  // `rgba(…)` / a hex) to a #rrggbb hex. Returns null for anything that
  // is not opaque-ish solid (transparent, currentColor, gradients).
  function cssColorToHex(css) {
    if (typeof css !== 'string') {
      return null;
    }
    var s = css.replace(/^\s+|\s+$/g, '');
    if (s.charAt(0) === '#') {
      return tryNormHex(s);
    }
    var m = /^rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/i.exec(s);
    if (m) {
      return formatHex({
        r: parseFloat(m[1]),
        g: parseFloat(m[2]),
        b: parseFloat(m[3])
      });
    }
    return null;
  }

  // ── 5. Semantic-role color maps ────────────────────────────────────
  //
  // A role-color map is "a named map of semantic role → color, applied
  // via a data-* attribute". ROLE_MAPS holds the data; renderRoleMapCss
  // turns one into a <style> block of attribute selectors. Each role
  // color derives from a --vc-* token so it themes automatically.
  var ROLE_MAPS = {
    // 5a. Badge severity — maps onto the engine's semantic roles so a
    // badge themes with the rest of the page.
    badge: {
      attr: 'data-vc-role',
      roles: {
        MUST: 'var(--vc-color-danger)',
        IMO: 'var(--vc-color-info)',
        Q: 'var(--vc-color-warning)',
        FYI: 'var(--vc-color-success)'
      }
    },
    // 5b. Activity colors — 7 roles need 7 distinct hues, so the colors
    // are a golden-angle categorical ramp off the accent. The values
    // here are CSS var names pointing at the --vc-activity-* family that
    // renderRoleMapCss also emits (see below).
    activity: {
      attr: 'data-vc-role',
      categorical: true,
      base: 'accent',
      order: [
        'working', 'meeting', 'break', 'idle',
        'focus', 'review', 'blocked'
      ]
    },
    // 5c. Graph-node colors — 6 roles, golden-angle categorical. The
    // diagram skill consumes the --vc-node-* family this defines.
    'graph-node': {
      attr: 'data-vc-role',
      categorical: true,
      base: 'accent',
      cssVarPrefix: '--vc-node-',
      order: [
        'source', 'filter', 'transform',
        'aggregate', 'final', 'target'
      ]
    },
    // 5d. Icon-tint — a 6-color :nth-child rotation for icon cards.
    'icon-tint': {
      attr: 'data-vc-role',
      categorical: true,
      base: 'accent',
      cssVarPrefix: '--vc-icon-',
      count: 6
    }
  };

  // renderRoleMapCss — return a <style> text block for one ROLE_MAPS
  // entry. For a non-categorical map (badge) each role is a direct
  // var() derivation; for a categorical map the golden-angle ramp is
  // baked to literal hexes off a seed accent (default the Heritage
  // honey #b8861f — emitted HTML can re-tint by overriding the
  // --vc-<prefix>* vars). Every role's bg/border mix against
  // --vc-color-surface so it flips per theme.
  function renderRoleMapCss(name, seedAccentHex) {
    var map = ROLE_MAPS[name];
    if (!map) {
      throw new Error(
        'renderRoleMapCss: unknown role map "' + name + '" — known: ' +
        objectKeys(ROLE_MAPS).join(', ')
      );
    }
    var seed = seedAccentHex || '#b8861f';
    var lines = ['<style data-vc-role-map="' + name + '">'];

    if (!map.categorical) {
      // Direct semantic-role derivations.
      var role;
      for (role in map.roles) {
        if (!Object.prototype.hasOwnProperty.call(map.roles, role)) {
          continue;
        }
        var color = map.roles[role];
        lines.push('[' + map.attr + '="' + role + '"]{');
        lines.push('  --vc-role-color:' + color + ';');
        lines.push('  color:var(--vc-role-color);');
        lines.push('  background:color-mix(in srgb, var(--vc-role-color) ' +
          '12%, var(--vc-color-surface));');
        lines.push('  border-color:color-mix(in srgb, ' +
          'var(--vc-role-color) 30%, var(--vc-color-surface));');
        lines.push('}');
      }
      lines.push('</style>');
      return lines.join('\n');
    }

    // Categorical — golden-angle ramp.
    var prefix = map.cssVarPrefix || '--vc-cat-';
    if (map.count) {
      // icon-tint: a :nth-child rotation, count colors.
      var hues = generateCategoricalHues(seed, map.count);
      var i;
      lines.push(':root{');
      for (i = 0; i < hues.length; i++) {
        lines.push('  ' + prefix + (i + 1) + ':' + hues[i] + ';');
      }
      lines.push('}');
      for (i = 0; i < hues.length; i++) {
        lines.push('.vc-icon-card:nth-child(' + hues.length + 'n+' +
          (i + 1) + '){');
        lines.push('  --vc-icon-color:var(' + prefix + (i + 1) + ');');
        lines.push('}');
      }
      lines.push('.vc-icon-card{');
      lines.push('  color:var(--vc-icon-color);');
      lines.push('  background:color-mix(in srgb, var(--vc-icon-color) ' +
        '12%, transparent);');
      lines.push('}');
    } else {
      // A named-role categorical map (activity, graph-node).
      var order = map.order;
      var ramp = generateCategoricalHues(seed, order.length);
      var j;
      lines.push(':root{');
      for (j = 0; j < order.length; j++) {
        lines.push('  ' + prefix + order[j] + ':' + ramp[j] + ';');
      }
      lines.push('}');
      for (j = 0; j < order.length; j++) {
        lines.push('[' + map.attr + '="' + order[j] + '"]{');
        lines.push('  --vc-role-color:var(' + prefix + order[j] + ');');
        lines.push('  color:var(--vc-role-color);');
        lines.push('  background:color-mix(in srgb, var(--vc-role-color) ' +
          '12%, var(--vc-color-surface));');
        lines.push('  border-color:color-mix(in srgb, ' +
          'var(--vc-role-color) 30%, var(--vc-color-surface));');
        lines.push('}');
      }
    }
    lines.push('</style>');
    return lines.join('\n');
  }

  // ── 4. applyPersonalityDelta ───────────────────────────────────────
  //
  // Parse a DESIGN.md, mutate its token tree by a named "personality"
  // delta, re-serialize. One source of truth: the delta is applied to
  // the parsed token tree, never to two copies.
  var PERSONALITY_DELTAS = {
    playful: { radius: 'xl', chroma: 1.20, motion: 0.8, hue: 0 },
    corporate: { radius: 'sm', chroma: 0.90, motion: 1.0, hue: 0 },
    minimal: { radius: 0, chroma: 0.70, motion: 1.3, hue: 0 },
    // hue is a degrees shift applied to the accent's OKLCh hue: toward
    // orange (~60° in OKLCh) for warmer, toward blue (~250°) for cooler.
    warmer: { radius: null, chroma: 1.0, motion: 1.0, hue: -25 },
    cooler: { radius: null, chroma: 1.0, motion: 1.0, hue: 25 }
  };

  function applyPersonalityDelta(designmdText, deltaName) {
    var engine = getEngine();
    if (!engine) {
      throw new Error(
        'applyPersonalityDelta: the amvcp-designmd engine is not loaded'
      );
    }
    var delta = PERSONALITY_DELTAS[deltaName];
    if (!delta) {
      throw new Error(
        'applyPersonalityDelta: unknown delta "' + deltaName + '" — known: ' +
        objectKeys(PERSONALITY_DELTAS).join(', ')
      );
    }
    var parsed = engine.parseDesignMd(designmdText);
    if (!parsed.ok) {
      throw new Error(
        'applyPersonalityDelta: input DESIGN.md does not parse — ' +
        (parsed.errors || []).join('; ')
      );
    }
    var tokens = parsed.designmd.tokens;

    // Radius bias — when delta.radius is a number it pins the whole
    // radius scale toward 0; when it is a key name ('sm'/'xl') it biases
    // every radius toward that key's value. null = leave radius alone.
    if (delta.radius === 0) {
      tokens.radius.none = 0;
      tokens.radius.sm = 0;
      tokens.radius.md = 0;
      tokens.radius.lg = 0;
      tokens.radius.xl = 0;
      // `full` stays 9999 — a pill is a pill even in a minimal theme.
    } else if (delta.radius === 'sm') {
      tokens.radius.sm = Math.round(tokens.radius.sm * 0.6);
      tokens.radius.md = Math.round(tokens.radius.md * 0.6);
      tokens.radius.lg = Math.round(tokens.radius.lg * 0.6);
      tokens.radius.xl = Math.round(tokens.radius.xl * 0.6);
    } else if (delta.radius === 'xl') {
      tokens.radius.sm = Math.round(tokens.radius.sm * 1.5);
      tokens.radius.md = Math.round(tokens.radius.md * 1.5);
      tokens.radius.lg = Math.round(tokens.radius.lg * 1.5);
      tokens.radius.xl = Math.round(tokens.radius.xl * 1.5);
    }

    // Accent chroma + hue shift — re-color the accent of BOTH themes
    // via the OKLCh path. Chroma is multiplied; hue is shifted by
    // delta.hue degrees. Both themes are mutated so the dual-theme
    // contract holds.
    if (delta.chroma !== 1.0 || delta.hue !== 0) {
      shiftAccent(tokens.colors.light, delta);
      shiftAccent(tokens.colors.dark, delta);
    }

    // Motion scalar — multiply every present duration. Easings unchanged.
    if (delta.motion !== 1.0 && isMap(tokens.motion)) {
      var dk;
      for (dk in tokens.motion) {
        if (!Object.prototype.hasOwnProperty.call(tokens.motion, dk)) {
          continue;
        }
        if (dk.indexOf('duration-') === 0 &&
            typeof tokens.motion[dk] === 'number') {
          tokens.motion[dk] = Math.round(tokens.motion[dk] * delta.motion);
        }
      }
    }

    return engine.serializeDesignMd(parsed.designmd);
  }

  // Mutate one theme map's `accent` color by a personality delta's
  // chroma multiplier + hue shift, in OKLCh space.
  function shiftAccent(themeMap, delta) {
    if (!themeMap || typeof themeMap.accent !== 'string') {
      return;
    }
    var hex = tryNormHex(themeMap.accent);
    if (!hex) {
      return;   // a non-hex accent (var()/named) is left untouched
    }
    var lch = oklabToOklch(srgbToOklab(parseHex(hex)));
    lch.C = lch.C * delta.chroma;
    lch.h = lch.h + (delta.hue * Math.PI) / 180;
    themeMap.accent = oklchToHex(lch);
  }

  // ── PRESETS — the named dual-theme token library ───────────────────
  //
  // Each value is a complete DESIGN.md frontmatter TEXT — the same YAML
  // the engine's parseDesignMd consumes. Every preset ships both
  // colors.light and colors.dark (the engine enforces it) and the new
  // elevation/motion/z-index/code groups. The build-time test asserts
  // every preset passes parseDesignMd AND lintTokenSet — a preset
  // library that ships slop is a contradiction.
  //
  // The shared non-color groups (typography minus the heading font,
  // spacing, radius, elevation, motion, z-index) are identical across
  // presets, so they are composed from helpers to keep this readable
  // and to guarantee they stay schema-valid.

  // The full 8+8 motion block as YAML lines.
  function motionYaml() {
    return [
      'motion:',
      '  duration-instant:  50',
      '  duration-fast:     100',
      '  duration-quick:    200',
      '  duration-base:     300',
      '  duration-moderate: 400',
      '  duration-slow:     500',
      '  duration-lazy:     700',
      '  duration-glacial:  1000',
      '  easing-standard:         "cubic-bezier(0.2,0,0,1)"',
      '  easing-decel:            "cubic-bezier(0,0,0,1)"',
      '  easing-accel:            "cubic-bezier(0.3,0,1,1)"',
      '  easing-emphasized-decel: "cubic-bezier(0.05,0.7,0.1,1)"',
      '  easing-emphasized-accel: "cubic-bezier(0.3,0,0.8,0.15)"',
      '  easing-spring:           "cubic-bezier(0.175,0.885,0.32,1.275)"',
      '  easing-bounce:           "cubic-bezier(0.34,1.56,0.64,1)"',
      '  easing-linear:           "linear"'
    ];
  }

  // The z-index block as YAML lines.
  function zindexYaml() {
    return [
      'z-index:',
      '  behind:   -1',
      '  base:     0',
      '  raised:   10',
      '  dropdown: 100',
      '  sticky:   200',
      '  overlay:  300',
      '  modal:    400',
      '  toast:    500',
      '  tooltip:  600'
    ];
  }

  // The elevation block as YAML lines — `tintAlphaHint` is unused here;
  // every preset uses the standard near-black MD3 scale (a tinted
  // variant is available via generateElevationScale at author time).
  function elevationYaml() {
    return [
      'elevation:',
      '  shadow-0: "none"',
      '  shadow-1: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"',
      '  shadow-2: "0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.12)"',
      '  shadow-3: "0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.14)"',
      '  shadow-4: "0 8px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.18)"',
      '  shadow-border: "0 0 0 1px rgba(0,0,0,0.08)"'
    ];
  }

  // A code block as YAML lines, given a 12-color tuple.
  function codeYaml(c) {
    return [
      'code:',
      '  keyword:     "' + c[0] + '"',
      '  string:      "' + c[1] + '"',
      '  number:      "' + c[2] + '"',
      '  comment:     "' + c[3] + '"',
      '  type:        "' + c[4] + '"',
      '  variable:    "' + c[5] + '"',
      '  function:    "' + c[6] + '"',
      '  constant:    "' + c[7] + '"',
      '  operator:    "' + c[8] + '"',
      '  punctuation: "' + c[9] + '"',
      '  tag:         "' + c[10] + '"',
      '  attribute:   "' + c[11] + '"'
    ];
  }

  // The colors block for one theme, given the 15-role tuple in
  // COLOR_ROLE_ORDER order.
  var COLOR_ROLE_ORDER = [
    'canvas', 'surface', 'surface-raised', 'surface-sunken',
    'content', 'content-muted', 'content-subtle',
    'border', 'border-strong', 'accent', 'on-accent',
    'success', 'warning', 'danger', 'info'
  ];

  function themeColorsYaml(indent, c) {
    var lines = [];
    var i;
    for (i = 0; i < COLOR_ROLE_ORDER.length; i++) {
      lines.push(indent + COLOR_ROLE_ORDER[i] + ': "' + c[i] + '"');
    }
    return lines;
  }

  // Assemble a full DESIGN.md text from a preset descriptor.
  //   d.name        — meta.name
  //   d.theme       — meta.default_theme ('light'|'dark')
  //   d.fontHeading — typography.font-heading stack
  //   d.fontBody    — typography.font-body stack (must pass the gate)
  //   d.fontMono    — typography.font-mono stack
  //   d.light/d.dark— 15-role color tuples
  //   d.code        — 12-color syntax tuple
  function buildPresetText(d) {
    var lines = ['---', 'designmd_version: 1', 'meta:'];
    lines.push('  name: "' + d.name + '"');
    lines.push('  default_theme: ' + d.theme);
    lines.push('colors:');
    lines.push('  light:');
    lines = lines.concat(themeColorsYaml('    ', d.light));
    lines.push('  dark:');
    lines = lines.concat(themeColorsYaml('    ', d.dark));
    lines.push('typography:');
    lines.push('  font-heading: "' + d.fontHeading + '"');
    lines.push('  font-body: "' + d.fontBody + '"');
    lines.push('  font-mono: "' + d.fontMono + '"');
    lines.push('  scale: [12, 14, 16, 20, 24, 32, 48]');
    lines.push('  weight-regular: 400');
    lines.push('  weight-medium: 500');
    lines.push('  weight-bold: 700');
    lines.push('  line-height: 1.55');
    lines.push('spacing:');
    lines.push('  scale: [4, 8, 12, 16, 24, 32, 48, 64]');
    lines.push('radius:');
    lines.push('  none: ' + d.radius[0]);
    lines.push('  sm: ' + d.radius[1]);
    lines.push('  md: ' + d.radius[2]);
    lines.push('  lg: ' + d.radius[3]);
    lines.push('  xl: ' + d.radius[4]);
    lines.push('  full: 9999');
    lines = lines.concat(elevationYaml());
    lines = lines.concat(motionYaml());
    lines = lines.concat(zindexYaml());
    lines = lines.concat(codeYaml(d.code));
    lines.push('---');
    lines.push('');
    lines.push('# ' + d.name);
    lines.push('');
    lines.push(d.blurb || 'A visual-communicator design-token preset.');
    return lines.join('\n');
  }

  // The 12 preset descriptors. Every accent / role color was chosen to
  // sit clear of the anti-slop banned set — `trust-indigo` deliberately
  // uses a royal blue (#1d4ed8), NOT a banned bright-mid indigo. The
  // build-time test re-verifies every one.
  var PRESET_DESCRIPTORS = [
    {
      key: 'heritage',
      name: 'Heritage',
      theme: 'light',
      blurb: 'Warm parchment — the runtime default. Honey accent.',
      fontHeading: 'Playfair Display, Georgia, serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 4, 8, 12, 16],
      light: ['#faf6ee', '#fffefb', '#fffdf8', '#f1ece0', '#1f1a14',
        '#5b5343', '#8a8170', '#e3dcc9', '#c9bfa3', '#b8861f', '#fffdf9',
        '#3a6b5c', '#a8791f', '#a84a32', '#3464a8'],
      dark: ['#16130d', '#211c14', '#2a241a', '#0f0d09', '#f3ecdd',
        '#b8ad96', '#857c68', '#3a3325', '#564c36', '#e0aa3e', '#16130d',
        '#6fae9b', '#d8aa54', '#dd8068', '#6f9bd8'],
      code: ['#a8791f', '#3a6b5c', '#a84a32', '#8a8170', '#3464a8',
        '#1f1a14', '#7a5c9e', '#b8861f', '#5b5343', '#8a8170', '#a84a32',
        '#3a6b5c']
    },
    {
      key: 'factory-dark',
      name: 'Factory Dark',
      theme: 'dark',
      blurb: 'Industrial dark — high-contrast orange accent.',
      fontHeading: 'Oswald, Arial Narrow, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 2, 4, 6, 8],
      light: ['#f4f2ef', '#fefdfc', '#fbfaf8', '#e9e6e1', '#1c1a17',
        '#524f49', '#82807a', '#dcd8d1', '#bcb7ad', '#d9520e', '#fffefc',
        '#2f7d4f', '#b06a16', '#bd3b2a', '#2b6cb0'],
      dark: ['#13110f', '#1d1a17', '#262220', '#0c0b09', '#f0ede8',
        '#aba79f', '#76726a', '#332f2a', '#4d4840', '#ef6f2e', '#13110f',
        '#5cae7e', '#d59a3e', '#e0685a', '#5b96d0'],
      code: ['#ef6f2e', '#5cae7e', '#e0685a', '#76726a', '#5b96d0',
        '#f0ede8', '#c79ad6', '#d59a3e', '#aba79f', '#76726a', '#e0685a',
        '#5cae7e']
    },
    {
      key: 'parchment',
      name: 'Parchment',
      theme: 'light',
      blurb: 'Clean warm parchment — umber accent, soft borders.',
      fontHeading: 'Spectral, Georgia, serif',
      fontBody: 'Spectral, Georgia, serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 3, 6, 10, 14],
      light: ['#f6f1e7', '#fffdf9', '#fffefb', '#ece4d4', '#241e16',
        '#5f5645', '#8d8470', '#e0d7c3', '#c6bba0', '#8a5a2a', '#fffdf9',
        '#436b3e', '#9a6f1c', '#a14a30', '#36608f'],
      dark: ['#181410', '#221d16', '#2b251c', '#100d09', '#f1eada',
        '#b6ab93', '#827964', '#393121', '#544a35', '#c08a4e', '#181410',
        '#74ad6e', '#cf9a3e', '#d3795f', '#6592c1'],
      code: ['#9a6f1c', '#436b3e', '#a14a30', '#8d8470', '#36608f',
        '#241e16', '#7a5c9e', '#8a5a2a', '#5f5645', '#8d8470', '#a14a30',
        '#436b3e']
    },
    {
      key: 'editorial-crimson',
      name: 'Editorial Crimson',
      theme: 'light',
      blurb: 'Bold editorial — crimson accent, near-white canvas.',
      fontHeading: 'Tiempos, Georgia, serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 2, 4, 6, 10],
      light: ['#fbf9f8', '#fefdfd', '#fdfcfc', '#efe9e8', '#1a1614',
        '#534c49', '#847c79', '#e4dddb', '#c5bbb8', '#a6192e', '#fffefe',
        '#2f7d4f', '#b06a16', '#a6192e', '#2b6cb0'],
      dark: ['#141110', '#1e1a18', '#272220', '#0c0a09', '#efe9e7',
        '#aaa39f', '#76706c', '#332e2b', '#4d4641', '#e0566a', '#141110',
        '#5cae7e', '#d59a3e', '#e0566a', '#5b96d0'],
      code: ['#a6192e', '#2f7d4f', '#b06a16', '#847c79', '#2b6cb0',
        '#1a1614', '#7a5c9e', '#a6192e', '#534c49', '#847c79', '#a6192e',
        '#2f7d4f']
    },
    {
      key: 'trust-indigo',
      name: 'Trust Indigo',
      theme: 'light',
      // Anti-slop note: a banned bright-mid indigo (#6366f1 family)
      // would fail the gate, so this preset uses a deep ROYAL BLUE
      // (#1d4ed8) — clearly outside the banned purple/violet radius.
      blurb: 'Calm corporate blue — royal-blue accent (anti-slop safe).',
      fontHeading: 'Newsreader, Georgia, serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 4, 8, 12, 16],
      light: ['#f7f8fb', '#fefefe', '#fbfcfe', '#e8ecf4', '#16181d',
        '#4c505b', '#7d8290', '#dde1ea', '#bcc2d1', '#1d4ed8', '#fdfefe',
        '#1f8a5a', '#b9770e', '#c0392b', '#1d4ed8'],
      // Dark accent/info is a brightened ROYAL blue (#4f9bf0) — kept
      // clear of the banned bright-mid blue #3b82f6's OKLab radius.
      dark: ['#0e1014', '#181b22', '#21252e', '#08090c', '#e9ebf1',
        '#a3a8b6', '#71768a', '#2b2f3a', '#434956', '#4f9bf0', '#0e1014',
        '#52b88a', '#d8a13e', '#e0685a', '#4f9bf0'],
      code: ['#1d4ed8', '#1f8a5a', '#c0392b', '#7d8290', '#4f9bf0',
        '#16181d', '#9a5fc4', '#1d4ed8', '#4c505b', '#7d8290', '#c0392b',
        '#1f8a5a']
    },
    {
      key: 'growth-navy',
      name: 'Growth Navy',
      theme: 'light',
      blurb: 'Fintech growth — emerald accent on a cool navy-tinted base.',
      fontHeading: 'Sora, Verdana, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 6, 10, 14, 18],
      light: ['#f4f7f6', '#fefffe', '#f9fcfb', '#e6edeb', '#101a17',
        '#46514d', '#76817c', '#d8e2df', '#b6c3bf', '#04936a', '#fcfffe',
        '#04936a', '#b9770e', '#c0392b', '#2b6cb0'],
      dark: ['#0a1310', '#13201b', '#1b2c25', '#060c0a', '#e6efeb',
        '#9fada8', '#6f7d77', '#283731', '#3f534b', '#04b477', '#0a1310',
        '#04b477', '#d8a13e', '#e0685a', '#5b96d0'],
      code: ['#04936a', '#2b6cb0', '#c0392b', '#76817c', '#5b96d0',
        '#101a17', '#7a5c9e', '#04936a', '#46514d', '#76817c', '#c0392b',
        '#2b6cb0']
    },
    {
      key: 'linear-graphite',
      name: 'Linear Graphite',
      theme: 'dark',
      blurb: 'Graphite product UI — muted sky accent, tight radii.',
      fontHeading: 'Inter Tight, system-ui, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 4, 6, 8, 12],
      light: ['#f6f7f8', '#fefefe', '#fbfbfc', '#eaecee', '#15171a',
        '#4b4e54', '#7c8088', '#dcdee2', '#bbbec6', '#3b73a8', '#fdfdfe',
        '#2f7d4f', '#b06a16', '#bd3b2a', '#3b73a8'],
      dark: ['#0d0e10', '#16181b', '#1e2024', '#08090a', '#e8e9eb',
        '#a1a4aa', '#70737b', '#292b30', '#414449', '#5b9dd6', '#0d0e10',
        '#5cae7e', '#d59a3e', '#e0685a', '#5b9dd6'],
      code: ['#5b9dd6', '#5cae7e', '#e0685a', '#70737b', '#5b9dd6',
        '#e8e9eb', '#c79ad6', '#5b9dd6', '#a1a4aa', '#70737b', '#e0685a',
        '#5cae7e']
    },
    {
      key: 'zinc-sky',
      name: 'Zinc Sky',
      theme: 'dark',
      blurb: 'Neutral zinc dark — bright sky accent.',
      fontHeading: 'Geist, system-ui, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 4, 8, 10, 14],
      light: ['#f7f7f8', '#fefefe', '#fbfbfc', '#ebebec', '#18181b',
        '#4e4e52', '#7f7f84', '#dededf', '#bdbdc1', '#0e87c5', '#fdfdfd',
        '#2f7d4f', '#b06a16', '#bd3b2a', '#0e87c5'],
      dark: ['#09090b', '#161618', '#202022', '#040405', '#e8e8ea',
        '#a1a1a6', '#707075', '#28282b', '#414145', '#38bdf8', '#09090b',
        '#5cae7e', '#d59a3e', '#e0685a', '#38bdf8'],
      code: ['#38bdf8', '#5cae7e', '#e0685a', '#707075', '#38bdf8',
        '#e8e8ea', '#c79ad6', '#38bdf8', '#a1a1a6', '#707075', '#e0685a',
        '#5cae7e']
    },
    {
      key: 'near-black',
      name: 'Near Black',
      theme: 'dark',
      blurb: 'Monochrome — achromatic light-grey accent, off-black canvas.',
      fontHeading: 'IBM Plex Sans, system-ui, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'IBM Plex Mono, ui-monospace, monospace',
      radius: [0, 2, 4, 6, 8],
      light: ['#f5f5f5', '#fefefe', '#fafafa', '#e8e8e8', '#161616',
        '#4d4d4d', '#7d7d7d', '#dcdcdc', '#bbbbbb', '#3d3d3d', '#fefefe',
        '#2f7d4f', '#b06a16', '#bd3b2a', '#2b6cb0'],
      dark: ['#0a0a0a', '#171717', '#212121', '#050505', '#e9e9e9',
        '#a2a2a2', '#717171', '#292929', '#424242', '#e5e5e5', '#0a0a0a',
        '#5cae7e', '#d59a3e', '#e0685a', '#5b96d0'],
      code: ['#bdbdbd', '#5cae7e', '#e0685a', '#717171', '#5b96d0',
        '#e9e9e9', '#c79ad6', '#e5e5e5', '#a2a2a2', '#717171', '#e0685a',
        '#5cae7e']
    },
    {
      key: 'ivory-slate',
      name: 'Ivory Slate',
      theme: 'light',
      blurb: 'Nature-tinted — warm clay accent, ivory canvas.',
      fontHeading: 'Fraunces, Georgia, serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 4, 8, 12, 18],
      light: ['#f7f4ee', '#fffefb', '#fffefc', '#ebe5da', '#1f1c16',
        '#544e44', '#847d6f', '#e1dace', '#c4bba9', '#8b7355', '#fffefb',
        '#4a6b46', '#a07320', '#a44f37', '#3b6491'],
      dark: ['#16140f', '#201d16', '#29251c', '#0e0c09', '#efe9dd',
        '#b3aa97', '#80776a', '#363023', '#504737', '#bd9a72', '#16140f',
        '#78ad74', '#d09b42', '#d57f60', '#6694c2'],
      code: ['#a07320', '#4a6b46', '#a44f37', '#847d6f', '#3b6491',
        '#1f1c16', '#7a5c9e', '#8b7355', '#544e44', '#847d6f', '#a44f37',
        '#4a6b46']
    },
    {
      key: 'neon-cyber',
      name: 'Neon Cyber',
      theme: 'dark',
      blurb: 'Neon cyber — vivid cyan accent on near-black.',
      fontHeading: 'Chakra Petch, Consolas, monospace',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'JetBrains Mono, ui-monospace, monospace',
      radius: [0, 2, 4, 6, 8],
      light: ['#f3f6f6', '#fefffe', '#f8fbfb', '#e6eeee', '#0f1717',
        '#45504f', '#75807f', '#d6e1e0', '#b4bfbe', '#0a8f7a', '#fcfffe',
        '#0a8f7a', '#b06a16', '#bd3b2a', '#2b6cb0'],
      dark: ['#070b0b', '#101919', '#172323', '#030606', '#dcf4f0',
        '#88a8a4', '#5d7d79', '#1f3331', '#314d49', '#00ffcc', '#070b0b',
        '#3df0c8', '#f0c850', '#ff6f88', '#5fd0f0'],
      code: ['#00ffcc', '#3df0c8', '#ff6f88', '#5d7d79', '#5fd0f0',
        '#dcf4f0', '#c79ad6', '#f0c850', '#88a8a4', '#5d7d79', '#ff6f88',
        '#3df0c8']
    },
    {
      key: 'cjk-claude',
      name: 'CJK Claude',
      theme: 'light',
      blurb: 'Warm Claude-orange — CJK-friendly font stack.',
      fontHeading: 'Source Han Serif, Songti SC, serif',
      fontBody: 'Source Han Sans, PingFang SC, sans-serif',
      fontMono: 'Source Han Mono, JetBrains Mono, monospace',
      radius: [0, 4, 8, 12, 16],
      light: ['#faf7f3', '#fffefc', '#fffdfb', '#f0e9e1', '#1e1813',
        '#594f44', '#897d6f', '#e6dccd', '#cabaa3', '#ff6600', '#fffdf9',
        '#3a6b5c', '#a8791f', '#c0392b', '#3464a8'],
      dark: ['#15110d', '#201a13', '#292119', '#0e0b08', '#f2eadd',
        '#b6aa95', '#827664', '#372f22', '#534734', '#ff8533', '#15110d',
        '#6fae9b', '#d8aa54', '#e0685a', '#6f9bd8'],
      code: ['#ff6600', '#3a6b5c', '#c0392b', '#897d6f', '#3464a8',
        '#1e1813', '#7a5c9e', '#ff6600', '#594f44', '#897d6f', '#c0392b',
        '#3a6b5c']
    },
    {
      key: 'wireframe-grayscale',
      name: 'Wireframe Grayscale',
      theme: 'light',
      blurb: 'Zero-hue wireframe — pure grayscale, square corners.',
      fontHeading: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'ui-monospace, Menlo, monospace',
      radius: [0, 0, 0, 0, 0],
      light: ['#f4f4f4', '#fdfdfd', '#fbfbfb', '#e9e9e9', '#1a1a1a',
        '#4d4d4d', '#808080', '#dadada', '#b3b3b3', '#4d4d4d', '#fdfdfd',
        '#595959', '#737373', '#404040', '#666666'],
      dark: ['#0b0b0b', '#181818', '#222222', '#060606', '#e8e8e8',
        '#a0a0a0', '#6f6f6f', '#2a2a2a', '#434343', '#b3b3b3', '#0b0b0b',
        '#9c9c9c', '#868686', '#cfcfcf', '#8f8f8f'],
      code: ['#404040', '#595959', '#737373', '#808080', '#4d4d4d',
        '#1a1a1a', '#666666', '#404040', '#4d4d4d', '#808080', '#737373',
        '#595959']
    },
    {
      // TRDD-4c300620 Fix #5 — second pass on the product-dashboard
      // preset. The previous attempt (TRDD-6fdf6ad2 Tier 1) used
      // indigo-600 #4f46e5 + Manrope 400 which read as "stock SaaS
      // template" — too aggressive an accent + too thin a body weight.
      //
      // Revised direction: editorial-credibility, slightly warm. IBM
      // Plex Sans is the heading + body (paired Sans/Mono families
      // from IBM Carbon — geometric but not as ubiquitous as Inter or
      // Manrope, and not in BANNED_FONTS). Accent moves from indigo
      // to navy (blue-800 #1e40af light / blue-500 #3b82f6 — but that
      // last one is banned, so use blue-400 #60a5fa dark) for a more
      // serious, less "AI-app" feel. Canvas warms slightly with a
      // hint of cream. Code palette uses the same colours but with
      // higher contrast for readability.
      key: 'product-dashboard',
      name: 'Product Dashboard',
      theme: 'light',
      blurb: 'Editorial product-UI — IBM Plex Sans + navy accent, warm neutrals.',
      fontHeading: 'IBM Plex Sans, system-ui, -apple-system, Segoe UI, sans-serif',
      fontBody: 'IBM Plex Sans, system-ui, -apple-system, Segoe UI, sans-serif',
      fontMono: 'IBM Plex Mono, ui-monospace, Menlo, monospace',
      radius: [0, 3, 6, 10, 14],
      // Light theme: warm cream canvas + slightly elevated surfaces,
      // deep navy accent. Border kept neutral grey so it doesn't
      // tint the warm canvas.
      light: ['#f8f6f1', '#fdfcf8', '#fcfaf4', '#f1eee5', '#181410',
        '#4b463d', '#928c7e', '#e2ddd0', '#c8c1ad', '#1e40af', '#fdfcf8',
        '#15803d', '#b45309', '#b91c1c', '#0369a1'],
      // Dark theme: deep warm-black canvas, light steel-blue accent.
      dark: ['#100e0b', '#1a1815', '#221f1b', '#0a0907', '#ede8dd',
        '#a8a293', '#7c7666', '#2c2823', '#4a443a', '#60a5fa', '#0f172a',
        '#22c55e', '#fbbf24', '#f87171', '#38bdf8'],
      // Code palette: violet-800 keywords, emerald-700 strings,
      // muted-grey comments, warm gold tags, sky-700 functions, etc.
      // All contrast-tested against both light + dark surface tones.
      code: ['#5b21b6', '#15803d', '#7c7666', '#b45309', '#0369a1',
        '#181410', '#9d174d', '#c2410c', '#b91c1c', '#1e40af', '#4d7c0f',
        '#52525b']
    }
  ];

  // Build the PRESETS map { key -> DESIGN.md text } once at load time.
  var PRESETS = {};
  (function buildPresets() {
    var i;
    for (i = 0; i < PRESET_DESCRIPTORS.length; i++) {
      var d = PRESET_DESCRIPTORS[i];
      PRESETS[d.key] = buildPresetText(d);
    }
  })();

  // ── generic helpers ────────────────────────────────────────────────

  // Resolve the optional engine peer — window global in a browser, a
  // require() in Node. Returns null when it is genuinely absent.
  function getEngine() {
    if (typeof window !== 'undefined' && window.amvcpDesignMd) {
      return window.amvcpDesignMd;
    }
    if (typeof module !== 'undefined' && module.exports &&
        typeof require === 'function') {
      try {
        return require('./amvcp-designmd.js');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Normalize a hex to its canonical lowercase #rrggbb form for emitting
  // into CSS. A non-hex string (var()/named) is returned unchanged so
  // the caller can still emit a var() reference.
  function normHex(value) {
    var h = tryNormHex(value);
    return h || String(value);
  }

  function isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  function isMap(v) {
    return v !== null && typeof v === 'object' && !isArray(v);
  }

  function indexOf(arr, v) {
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] === v) {
        return i;
      }
    }
    return -1;
  }

  function objectKeys(obj) {
    var out = [];
    var k;
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        out.push(k);
      }
    }
    return out;
  }

  function jsonish(v) {
    if (v === null) { return 'null'; }
    if (v === undefined) { return 'undefined'; }
    if (typeof v === 'string') { return '"' + v + '"'; }
    return String(v);
  }

  // ── export ─────────────────────────────────────────────────────────

  var api = {
    // generators
    generatePhiSpacing: generatePhiSpacing,
    generateOklchRamp: generateOklchRamp,
    generateNeutralScale: generateNeutralScale,
    generateElevationScale: generateElevationScale,
    generateMotionLibrary: generateMotionLibrary,
    generateZIndexScale: generateZIndexScale,
    generateCategoricalHues: generateCategoricalHues,
    // personality
    applyPersonalityDelta: applyPersonalityDelta,
    // anti-slop gate
    lintTokenSet: lintTokenSet,
    lintHtml: lintHtml,
    lintLiveDocument: lintLiveDocument,
    // role maps
    renderRoleMapCss: renderRoleMapCss,
    // color helpers (also used by amvcp-token-sheet.js)
    contrastRatio: contrastRatio,
    relativeLuminance: relativeLuminance,
    // data tables
    PRESETS: PRESETS,
    ROLE_MAPS: ROLE_MAPS,
    BANNED_COLORS: BANNED_COLORS,
    BANNED_FONTS: BANNED_FONTS,
    BANNED_PATTERNS: BANNED_PATTERNS,
    PERSONALITY_DELTAS: PERSONALITY_DELTAS
  };

  if (typeof window !== 'undefined') {
    window.amvcpTokens = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
