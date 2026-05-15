/*!
 * ai-maestro-visual-communicator-plugin — typography helper module.
 *
 * Phase 2 (typography skill). The CSS layer `amvcp-typography.css` does
 * the bulk of the work: fluid clamp() scale, semantic hierarchy, the
 * variable-font axis layer, all driven purely by `--vc-*` tokens emitted
 * by the DESIGN.md engine. This module is the one runtime job CSS cannot
 * do alone:
 *
 *   1. generateScale(base, ratio, steps) — the modular-scale calculator.
 *      When the active scale-system (`data-ve-type-scale`) changes the
 *      px anchor array must be recomputed. The calculator NEVER calls
 *      setProperty('--vc-text-<i>') itself — that would fork the source
 *      of truth. It hands the recomputed array back so the caller can
 *      feed it through the DESIGN.md engine round-trip (the engine stays
 *      the single owner of `--vc-text-<i>`).
 *
 *   2. supportsVariableFonts() — a feature-detect. The visual fallback
 *      in the CSS layer (a static `font-weight` alongside every
 *      `font-variation-settings`) works WITHOUT this; the detect only
 *      stamps a diagnostic `data-ve-vfont="yes|no"` attribute so a
 *      specimen page can tell the user which path is live.
 *
 * Standalone & dependency-free. Dual export:
 *   - browser: `window.amvcpTypography = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-runtime.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes, no build step.
 *
 * Fail-fast: an unknown scale-system name is a HARD ERROR — the
 * calculator throws, it never guesses a ratio.
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The four named modular-scale systems and their ratios (typography
  // spec §4.4, catalog TY-02). `perfect-fourth` is the default — it
  // gives strong UI/dashboard hierarchy without the drama of `golden`.
  var SCALE_SYSTEMS = {
    'minor-third':    1.200,
    'major-third':    1.250,
    'perfect-fourth': 1.333,
    'golden':         1.618
  };

  // The default scale-system when a page opts into the fluid layer but
  // names no system. Kept as a named constant so there is one source of
  // truth for "what is the default ratio".
  var DEFAULT_SCALE_SYSTEM = 'perfect-fourth';

  // The engine's typography.scale ships seven steps (indices 0..6). The
  // calculator anchors `base` at step index 2 (the body size) so the
  // generated array brackets the body with two smaller and four larger
  // steps — exactly the shape the engine validator (checkAscendingNum-
  // Array) and the CSS layer's --vc-text-0..6 expect.
  var DEFAULT_STEP_COUNT = 7;
  var DEFAULT_BASE_INDEX = 2;

  // The readability floor. Type below this size is not comfortably
  // legible on screen, so the calculator clamps every generated step at
  // or above it. A documented constant, not a magic number.
  var MIN_LEGIBLE_PX = 11;

  // ── generateScale ──────────────────────────────────────────────────
  //
  // The modular-scale calculator. Given a base body size in px, a ratio,
  // and a step count, returns an ASCENDING px array suitable for the
  // engine's `typography.scale` token. size(exp) = base * ratio^exp,
  // rounded to a whole px; the base sits at index `baseIndex` so the
  // array has `baseIndex` steps below the body and the rest above.
  //
  // The result is what the engine's `checkAscendingNumArray` validator
  // accepts — a strictly ascending list of non-negative numbers. Each
  // step is floored at MIN_LEGIBLE_PX; if flooring two adjacent small
  // steps would collide, the upper one is bumped by 1px so the array
  // stays strictly ascending (the validator rejects equal neighbours).
  function generateScale(baseSizePx, ratio, stepCount, baseIndex) {
    if (typeof baseSizePx !== 'number' || !isFinite(baseSizePx) ||
        baseSizePx <= 0) {
      throw new Error(
        'generateScale: baseSizePx must be a positive finite number, got ' +
        describe(baseSizePx)
      );
    }
    if (typeof ratio !== 'number' || !isFinite(ratio) || ratio <= 1) {
      throw new Error(
        'generateScale: ratio must be a finite number > 1, got ' +
        describe(ratio)
      );
    }
    var steps = (typeof stepCount === 'number') ? stepCount : DEFAULT_STEP_COUNT;
    var anchor = (typeof baseIndex === 'number') ? baseIndex : DEFAULT_BASE_INDEX;
    if (steps < 1 || Math.floor(steps) !== steps) {
      throw new Error(
        'generateScale: stepCount must be a positive integer, got ' +
        describe(stepCount)
      );
    }
    if (anchor < 0 || anchor >= steps || Math.floor(anchor) !== anchor) {
      throw new Error(
        'generateScale: baseIndex must be an integer in [0, stepCount), got ' +
        describe(baseIndex)
      );
    }
    var out = [];
    var i;
    for (i = 0; i < steps; i++) {
      var exp = i - anchor;
      var size = Math.round(baseSizePx * Math.pow(ratio, exp));
      if (size < MIN_LEGIBLE_PX) {
        size = MIN_LEGIBLE_PX;
      }
      // Keep the array strictly ascending — the engine validator rejects
      // a step that is <= its predecessor. Flooring small steps at
      // MIN_LEGIBLE_PX can otherwise produce two equal values.
      if (i > 0 && size <= out[i - 1]) {
        size = out[i - 1] + 1;
      }
      out.push(size);
    }
    return out;
  }

  // Resolve a scale-system NAME to its ratio. A name outside the four
  // known systems is a hard error — fail-fast, the engine never guesses.
  function ratioForSystem(systemName) {
    if (typeof systemName !== 'string' ||
        !Object.prototype.hasOwnProperty.call(SCALE_SYSTEMS, systemName)) {
      throw new Error(
        'unknown type-scale system "' + describe(systemName) +
        '" — expected one of ' + scaleSystemNames().join(', ')
      );
    }
    return SCALE_SYSTEMS[systemName];
  }

  // Convenience: generate the px scale for a named system in one call.
  // `data-ve-type-scale="golden"` -> generateScaleForSystem('golden', 16).
  function generateScaleForSystem(systemName, baseSizePx, stepCount, baseIndex) {
    return generateScale(
      baseSizePx, ratioForSystem(systemName), stepCount, baseIndex
    );
  }

  // The list of valid scale-system names (for UI <select> population and
  // error messages). Returned as a fresh array so callers cannot mutate
  // the internal table.
  function scaleSystemNames() {
    var names = [];
    var k;
    for (k in SCALE_SYSTEMS) {
      if (Object.prototype.hasOwnProperty.call(SCALE_SYSTEMS, k)) {
        names.push(k);
      }
    }
    return names;
  }

  // ── supportsVariableFonts ──────────────────────────────────────────
  //
  // Returns true only when the browser supports `font-variation-settings`
  // AND `CSS.supports` itself exists to test it. Diagnostic only — the
  // CSS layer's static `font-weight` fallback makes the page correct
  // regardless. Fail-soft: an ancient browser with no `CSS.supports`
  // returns false (the static path) rather than throwing.
  function supportsVariableFonts() {
    if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
      return false;
    }
    try {
      return CSS.supports('font-variation-settings', '"wght" 400');
    } catch (e) {
      // Some engines throw on a malformed supports() query rather than
      // returning false — treat any throw as "not supported".
      return false;
    }
  }

  // Stamp the variable-font detection result onto an element as
  // `data-ve-vfont="yes|no"` so a specimen page / consumer can show the
  // user which rendering path is active. Defaults to the document root.
  // Returns the boolean result. No-op-safe when no document exists
  // (Node) — it just returns the detect result without stamping.
  function markVariableFontSupport(rootEl) {
    var supported = supportsVariableFonts();
    var el = rootEl;
    if (!el && typeof document !== 'undefined' && document.documentElement) {
      el = document.documentElement;
    }
    if (el && typeof el.setAttribute === 'function') {
      el.setAttribute('data-ve-vfont', supported ? 'yes' : 'no');
    }
    return supported;
  }

  // ── applyScaleSystem ───────────────────────────────────────────────
  //
  // The recalculation entry point. Given a scale-system name and the
  // engine API (window.amvcpDesignMd) plus the live parsed designmd, it:
  //   1. computes the new px anchor array,
  //   2. writes it into the designmd token tree's `typography.scale`,
  //   3. re-runs the engine resolve+apply so `--vc-text-<i>` is re-emitted
  //      BY THE ENGINE (one source of truth — this module never sets the
  //      `--vc-text-<i>` vars directly),
  //   4. sets the `--vc-text-<i>-max` vars on the root from the freshly
  //      resolved engine tokens so the CSS clamp() upper bound exactly
  //      equals the DESIGN.md anchor.
  //
  // Returns the new px array. Throws (fail-fast) on an unknown system or
  // a missing/!malformed engine API — it never silently no-ops.
  function applyScaleSystem(systemName, opts) {
    var ratio = ratioForSystem(systemName);   // throws on unknown system
    var options = opts || {};
    var engine = options.engine;
    var designmd = options.designmd;
    var rootEl = options.rootEl;
    var theme = options.theme || 'light';

    if (!engine || typeof engine.resolveTokens !== 'function' ||
        typeof engine.applyTokens !== 'function') {
      throw new Error(
        'applyScaleSystem: opts.engine must be the amvcpDesignMd API'
      );
    }
    if (!designmd || typeof designmd !== 'object' || !designmd.tokens ||
        !designmd.tokens.typography) {
      throw new Error(
        'applyScaleSystem: opts.designmd must be a parsed DESIGN.md'
      );
    }
    var ty = designmd.tokens.typography;
    // Anchor the recomputed scale on the CURRENT body size (engine step
    // index DEFAULT_BASE_INDEX) so a system switch keeps the body size
    // stable and only changes the contrast between steps.
    var currentScale = ty.scale;
    var stepCount = (currentScale && currentScale.length) || DEFAULT_STEP_COUNT;
    var baseIndex = (stepCount > DEFAULT_BASE_INDEX)
      ? DEFAULT_BASE_INDEX : 0;
    var baseSize = (currentScale && currentScale[baseIndex]) || 16;

    var newScale = generateScale(baseSize, ratio, stepCount, baseIndex);
    // Mutate the engine's token tree — the engine re-emits from here.
    ty.scale = newScale;

    var resolved = engine.resolveTokens(designmd, theme);
    var el = engine.applyTokens(resolved, rootEl);

    // Mirror each resolved --vc-text-<i> into --vc-text-<i>-max so the
    // CSS clamp() upper bound tracks the DESIGN.md anchor exactly.
    setScaleMaxVars(resolved, el);
    return newScale;
  }

  // Copy every resolved `--vc-text-<i>` value into a sibling
  // `--vc-text-<i>-max` custom property on `el`. The CSS clamp() rules
  // read `var(--vc-text-<i>-max, <literal>)` as their upper bound.
  function setScaleMaxVars(resolvedTokens, el) {
    if (!el || !el.style || typeof el.style.setProperty !== 'function') {
      return;
    }
    var key;
    for (key in resolvedTokens) {
      if (!Object.prototype.hasOwnProperty.call(resolvedTokens, key)) {
        continue;
      }
      // Match `--vc-text-<digits>` exactly — not `--vc-text-hero`, not an
      // already-suffixed `--vc-text-0-max`.
      if (/^--vc-text-\d+$/.test(key)) {
        el.style.setProperty(key + '-max', String(resolvedTokens[key]));
      }
    }
  }

  // ── Selection-contract conformance (TRDD-352ef46a phase 2.5) ───────
  //
  // The typography skill ships pure helpers — it never emits DOM. But a
  // typography specimen / report uses semantic text containers (h1-h6,
  // p, .vc-type-* utility classes) that the user wants to comment on
  // INDIVIDUALLY ("this hero looks too big", "the lead paragraph
  // contrasts wrong with the body"). Each such span is a selectable
  // atom under the unified contract.
  //
  // `markTypographyAtoms(root)` walks every typography-shaped element
  // inside `root` and stamps it with `data-ve-id` (stable: prefer
  // existing `id`, fall back to type+index) + `data-ve-type` (e.g.
  // "type-hero", "type-h1", "type-body"), then attaches the per-atom
  // 3-radio Skip/Approve/Deny mini-pill (NEW USER REQ #10) via the
  // runtime's `attachDecisionMini` helper. Both are guarded so a page
  // WITHOUT the runtime gets the attribute (inert, but ready when a
  // runtime later mounts) and a NO-OP for the pill until then.
  function markTypographyAtoms(root, opts) {
    if (typeof document === 'undefined') { return 0; }
    var d = root || document;
    if (!d.querySelectorAll) { return 0; }
    opts = opts || {};
    var attachPill = opts.attachPill !== false;
    // Selectors run in order — first match wins for the type-hint, so a
    // <h1 class="vc-type-hero"> reads as "type-hero" not "type-h1".
    // Inline <span>/<small>/<strong> runs INSIDE a paragraph are NOT
    // atoms (they would create overlapping atoms with the parent <p>);
    // standalone .vc-type-label / .vc-type-caption ARE atoms because
    // they are typically standalone badges, not inline runs.
    var SHAPES = [
      ['.vc-type-hero',    'type-hero'],
      ['.vc-type-lead',    'type-lead'],
      ['.vc-type-body-sm', 'type-body-sm'],
      ['.vc-type-body',    'type-body'],
      ['.vc-type-label',   'type-label'],
      ['.vc-type-caption', 'type-caption'],
      ['h1',               'type-h1'],
      ['h2',               'type-h2'],
      ['h3',               'type-h3'],
      ['h4',               'type-h4'],
      ['h5',               'type-h5'],
      ['h6',               'type-h6'],
      ['p',                'type-body']
    ];
    var stamped = 0;
    var s, type, sel, nodes, i, el;
    // A WeakSet would be ideal but we stay ES5; track a single-flag
    // property on the element instead. The flag (`__vcTypoStamped`)
    // makes a re-pass during the same boot a NO-OP for already-stamped
    // elements, so an `<h1 class="vc-type-hero">` never gets stamped
    // twice (first pass: .vc-type-hero, second pass: h1).
    for (s = 0; s < SHAPES.length; s++) {
      sel = SHAPES[s][0];
      type = SHAPES[s][1];
      nodes = d.querySelectorAll(sel);
      for (i = 0; i < nodes.length; i++) {
        el = nodes[i];
        if (el.__vcTypoStamped) { continue; }
        el.__vcTypoStamped = true;
        if (!el.hasAttribute('data-ve-id')) {
          el.setAttribute('data-ve-id', el.id || (type + '-' + i));
        }
        if (!el.hasAttribute('data-ve-type')) {
          el.setAttribute('data-ve-type', type);
        }
        if (attachPill) {
          _attachDecisionMiniSafe(el, el.getAttribute('data-ve-id'));
        }
        stamped++;
      }
    }
    return stamped;
  }

  // Defensive guard for the runtime helper — sibling agent ships it
  // concurrently. Queue + retry on microtask + DOM-ready so atoms still
  // pick up their pill the moment the helper appears.
  var _typoPillQueue = [];
  function _attachDecisionMiniSafe(el, id) {
    if (!el) { return; }
    var rt = (typeof window !== 'undefined') ? window.amvcpRuntime : null;
    if (rt && typeof rt.attachDecisionMini === 'function') {
      try { rt.attachDecisionMini(el, id); } catch (e) { /* swallow */ }
      return;
    }
    _typoPillQueue.push({ el: el, id: id });
  }
  function _flushTypoPillQueue() {
    if (typeof window === 'undefined') { return; }
    var rt = window.amvcpRuntime;
    if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
    var q = _typoPillQueue;
    _typoPillQueue = [];
    for (var i = 0; i < q.length; i++) {
      try { rt.attachDecisionMini(q[i].el, q[i].id); }
      catch (e) { /* swallow */ }
    }
  }
  if (typeof window !== 'undefined') {
    if (typeof Promise !== 'undefined' && typeof Promise.resolve === 'function') {
      Promise.resolve().then(_flushTypoPillQueue);
    } else if (typeof setTimeout === 'function') {
      setTimeout(_flushTypoPillQueue, 0);
    }
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _flushTypoPillQueue);
      } else if (typeof setTimeout === 'function') {
        setTimeout(_flushTypoPillQueue, 100);
      }
    }
  }

  // ── small helpers ──────────────────────────────────────────────────

  // A short, safe description of any value for an error message — never
  // throws, never dumps a huge object.
  function describe(v) {
    if (v === null) { return 'null'; }
    if (typeof v === 'undefined') { return 'undefined'; }
    if (typeof v === 'string') { return '"' + v + '"'; }
    if (typeof v === 'number' || typeof v === 'boolean') { return String(v); }
    return typeof v;
  }

  // ── Dual export ────────────────────────────────────────────────────

  var api = {
    SCALE_SYSTEMS: SCALE_SYSTEMS,
    DEFAULT_SCALE_SYSTEM: DEFAULT_SCALE_SYSTEM,
    MIN_LEGIBLE_PX: MIN_LEGIBLE_PX,
    generateScale: generateScale,
    generateScaleForSystem: generateScaleForSystem,
    ratioForSystem: ratioForSystem,
    scaleSystemNames: scaleSystemNames,
    supportsVariableFonts: supportsVariableFonts,
    markVariableFontSupport: markVariableFontSupport,
    applyScaleSystem: applyScaleSystem,
    // Selection-contract conformance + decision mini-pill stamping
    // (TRDD-352ef46a phase 2.5 + NEW USER REQ #10).
    markTypographyAtoms: markTypographyAtoms
  };

  if (typeof window !== 'undefined') {
    window.amvcpTypography = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
