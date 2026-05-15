/*!
 * ai-maestro-visual-communicator-plugin — animation runtime module.
 *
 * Phase 2 (visualizing backlog §13): adds MOTION to any
 * visual-communicator artifact — staggered entry, scroll reveal, stat
 * counters, loading skeletons, ambient float loops, hover polish.
 *
 * Design contract (animation-spec.md):
 *   - Dependency-free. Pure CSS + vanilla ES5-style JS. No GSAP, no
 *     anime.js, no Lenis, no Three.js, no build step.
 *   - Theme-driven. Every duration/easing/stagger reads a `--vc-motion-*`
 *     / `--vc-duration-*` / `--vc-easing-*` token resolved by the
 *     DESIGN.md engine (amvcp-designmd.js). Every token reference carries
 *     a hardcoded canonical fallback so the module animates correctly
 *     even when no `motion:` group is present in the DESIGN.md.
 *   - Accessibility-correct. Every animation ships a
 *     `prefers-reduced-motion: reduce` SUBSTITUTE (meaning-preserving —
 *     never a blanket `animation: none`). The OS preference is read once
 *     at init and re-read live on change.
 *   - Light + dark. Painted animations (skeleton shimmer, pulse ring)
 *     read `--vc-color-*` so they are correct in both themes.
 *   - No nested scrollbars. Parallax/snap drive the document's own
 *     single scroll axis; never an inner overflow:scroll box.
 *   - Fail-fast. A bad `data-va-stat` is skipped; the ONE deliberate
 *     fail-SAFE is the no-IntersectionObserver path, which REVEALS
 *     content (failing visible, never failing to a blank page).
 *
 * Dual export:
 *   - browser: `window.amvcpAnimation = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-runtime.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes.
 *
 * Public API:
 *   injectAnimationCSS(doc)        — append the skill <style> to doc.head
 *   init(root)                     — wire every layer (root = document)
 *   animateStat(el)                — rAF count-up (exported for charts)
 *   createLoop(update, render)     — delta-time loop primitive
 *   revealNow(el)                  — force-reveal one element now
 *   refresh(root)                  — re-scan after dynamic DOM insertion
 */
(function () {
  'use strict';

  // ── Constants — canonical default values ───────────────────────────
  //
  // The CSS rules below reference each motion token with a hardcoded
  // fallback (e.g. `var(--vc-duration-entrance, 600ms)`). These are the
  // SINGLE canonical default set (animation-spec.md §3.4): a DESIGN.md
  // with no `motion:` group still animates correctly with these values.
  // The JS side mirrors the same numbers so token-less pages behave
  // identically whether the computed style resolves the var or not.

  // ms defaults — used as the numeric fallback when a duration token is
  // absent. Names match the `--vc-duration-*` family.
  var DUR_ENTRANCE_MS = 600;   // staggered entry / scroll reveal
  var DUR_STAGGER_MS = 80;     // per-index delay in a staggered group
  var DUR_SLOW_MS = 400;       // stat counter count-up window
  var DUR_NORMAL_MS = 200;     // reduced-motion fade substitute window
  var DUR_FAST_MS = 120;       // micro-interaction (tilt reset)

  // The `<style>` element gets this id so injection is idempotent — a
  // second injectAnimationCSS() call is a no-op (matches the runtime's
  // injectStyles guard pattern).
  var STYLE_ID = 'va-animation-styles';

  // IntersectionObserver params for the fire-once scroll reveal —
  // animation-spec.md §6.1 (master catalog AN-02): trigger when 15% of
  // the element is visible, with a 50px bottom shrink so the reveal
  // fires just before the element fully clears the fold.
  var REVEAL_THRESHOLD = 0.15;
  var REVEAL_ROOT_MARGIN = '0px 0px -50px 0px';

  // The CSS selectors of every infinite ambient loop the IO-pause
  // observer toggles `animation-play-state` on (animation-spec.md §9.1).
  var LOOP_SELECTOR =
    '.va-float-y, .va-breathe, .va-orbit, .va-rotate, .va-pulse, .va-skeleton';

  // ── Selection-contract conformance (TRDD-352ef46a phase 2.5) ───────
  //
  // Every animated target the module touches is a SELECTABLE atom under
  // the unified contract: each `.va-stagger-item`, `[data-va-reveal]`,
  // and `.va-counter` is one comment-able thing. Stamp `data-ve-id` +
  // `data-ve-type` on each (idempotent — only if author left them
  // unset), then attach the per-atom decision mini-pill (NEW USER REQ
  // #10) via the runtime helper. Both stamping AND pill attachment are
  // guarded so a page WITHOUT a runtime is still rendered correctly:
  // the attribute is present but inert until the runtime later mounts.
  function _stampAtomVa(el, id, type) {
    if (!el || !el.setAttribute) { return; }
    if (!el.hasAttribute('data-ve-id')) {
      el.setAttribute('data-ve-id', String(id));
    }
    if (type && !el.hasAttribute('data-ve-type')) {
      el.setAttribute('data-ve-type', String(type));
    }
  }

  // Defensive guard: the helper is shipped by a sibling agent
  // concurrently. If absent now, queue + retry on microtask + DOM ready.
  var _animDecisionPending = [];
  function _attachDecisionMiniVa(el, id) {
    if (!el) { return; }
    var rt = (typeof window !== 'undefined') ? window.amvcpRuntime : null;
    if (rt && typeof rt.attachDecisionMini === 'function') {
      try { rt.attachDecisionMini(el, id); }
      catch (e) { /* never block reveal for one bad pill */ }
      return;
    }
    _animDecisionPending.push({ el: el, id: id });
  }
  function _flushAnimDecisionPending() {
    if (typeof window === 'undefined') { return; }
    var rt = window.amvcpRuntime;
    if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
    var q = _animDecisionPending;
    _animDecisionPending = [];
    for (var i = 0; i < q.length; i++) {
      try { rt.attachDecisionMini(q[i].el, q[i].id); }
      catch (e) { /* swallow */ }
    }
  }
  if (typeof window !== 'undefined') {
    if (typeof Promise !== 'undefined' && typeof Promise.resolve === 'function') {
      Promise.resolve().then(_flushAnimDecisionPending);
    } else if (typeof setTimeout === 'function') {
      setTimeout(_flushAnimDecisionPending, 0);
    }
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _flushAnimDecisionPending);
      } else if (typeof setTimeout === 'function') {
        setTimeout(_flushAnimDecisionPending, 100);
      }
    }
  }

  // Walk every animated atom inside `root` and ensure it has the
  // contract attributes + a decision pill. Idempotent: a re-scan after
  // dynamic insertion only stamps the new ones (existing atoms keep
  // their ids and the runtime's attachDecisionMini guards against
  // double-mount of the pill).
  function stampAnimatedAtoms(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return 0; }
    var stamped = 0;
    // Scope: explicit atom kinds only. NOT `.va-tilt`, `.va-pulse`, the
    // skeleton bones, or the loop-pause LOOP_SELECTOR matches — those
    // are decorative-only ambient animations, not content atoms. The
    // selectable ones are content blocks that REVEAL: cards, headings,
    // and counters.
    var SEL = '.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]';
    var nodes = d.querySelectorAll(SEL);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      // The card + counter atoms get distinct types so a payload reader
      // can downstream-route by kind. Counter wins if both classes
      // apply, since the count-up is the more specific behaviour.
      var type = 'card';
      if (el.classList && el.classList.contains('va-counter')) {
        type = 'counter';
      }
      var stableId = el.id
        || (el.getAttribute && el.getAttribute('data-ve-id'))
        || ('anim-' + type + '-' + i);
      _stampAtomVa(el, stableId, type);
      _attachDecisionMiniVa(el, stableId);
      stamped++;
    }
    return stamped;
  }

  // ── prefers-reduced-motion gate (Layer 1, AN-10) ───────────────────
  //
  // Read the OS preference ONCE at module load. JS engines branch on
  // REDUCED; CSS handles the no-preference-vs-reduce difference through
  // its own media queries. The matchMedia handle is kept so a live OS
  // toggle (while a report is open) updates behaviour without a reload —
  // matching the DESIGN.md hot-swap ethos.
  var REDUCED = false;
  var _mql = null;
  if (typeof window !== 'undefined' && window.matchMedia) {
    _mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    REDUCED = !!_mql.matches;
  }

  // Re-evaluate REDUCED when the OS setting changes mid-session. Both
  // the modern addEventListener and the legacy addListener forms are
  // supported (Safari < 14 only has the legacy one).
  function _watchReducedMotion() {
    if (!_mql) { return; }
    function onChange(ev) {
      // `ev` is a MediaQueryListEvent; fall back to the live list.
      REDUCED = !!(ev && typeof ev.matches === 'boolean'
        ? ev.matches : _mql.matches);
      // Re-scan so the new preference takes effect on already-mounted
      // content (e.g. a counter that has not yet ticked).
      _api.refresh(document);
    }
    if (typeof _mql.addEventListener === 'function') {
      _mql.addEventListener('change', onChange);
    } else if (typeof _mql.addListener === 'function') {
      _mql.addListener(onChange);
    }
  }

  // ── token helpers ──────────────────────────────────────────────────

  // Read a CSS custom property off :root and return it as a finite
  // number of milliseconds. Strips a trailing `ms` / `s` unit; an `s`
  // value is scaled to ms. Falls back to `fallbackMs` when the token is
  // absent, empty, or unparseable — this is what makes the module work
  // with no `motion:` group in the DESIGN.md.
  function readDurationMs(name, fallbackMs) {
    if (typeof document === 'undefined' || !document.documentElement) {
      return fallbackMs;
    }
    var raw = '';
    try {
      raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name);
    } catch (e) {
      return fallbackMs;
    }
    raw = (raw || '').trim();
    if (!raw) { return fallbackMs; }
    var isSeconds = /s\s*$/.test(raw) && !/ms\s*$/.test(raw);
    var num = parseFloat(raw);
    if (!isFinite(num)) { return fallbackMs; }
    return isSeconds ? num * 1000 : num;
  }

  // Read a numeric CSS custom property (e.g. --vc-motion-scale) as a
  // plain finite number. Falls back to `fallback` when absent/bad.
  function readNumber(name, fallback) {
    if (typeof document === 'undefined' || !document.documentElement) {
      return fallback;
    }
    var raw = '';
    try {
      raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name);
    } catch (e) {
      return fallback;
    }
    var num = parseFloat((raw || '').trim());
    return isFinite(num) ? num : fallback;
  }

  // ── Layer 0 + 1-9 CSS — the injected stylesheet ────────────────────
  //
  // Every animated class ships TWO media-query branches:
  //   (prefers-reduced-motion: no-preference) — the full motion
  //   (prefers-reduced-motion: reduce)        — the meaning-preserving
  //                                             substitute
  // Decorative-only loops (the floating presets) are the one case where
  // the `reduce` substitute is REMOVAL — motion is the entire point, so
  // omitting the animation loses no meaning (animation-spec.md §4.2).
  //
  // Built as an array of lines joined with '\n' — ES5-safe, no template
  // literals. `--vc-motion-scale` (a 0..1 master damper) multiplies
  // transform DISTANCE only, never duration; at scale 0 a keyframe still
  // fades but does not travel (animation-spec.md §3.5).
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — animation skill (injected) */',

    /* --- Layer 2: staggered entry --------------------------------- */
    '@media (prefers-reduced-motion: no-preference) {',
    '  .va-stagger-item {',
    '    --va-rise: calc(24px * var(--vc-motion-scale, 1));',
    '    animation: vaFadeSlideUp var(--vc-duration-entrance, 600ms)',
    '               var(--vc-easing-decel, cubic-bezier(0,0,0,1)) both;',
    '    animation-delay: calc(var(--va-index, 0)',
    '                     * var(--vc-duration-stagger-step, 80ms));',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* substitute: opacity-only, no transform, no per-index delay */',
    '  .va-stagger-item { animation: vaFadeOnly 200ms ease both; }',
    '}',
    '@keyframes vaFadeSlideUp {',
    '  from { opacity: 0; transform: translateY(var(--va-rise, 24px)); }',
    '  to   { opacity: 1; transform: translateY(0); }',
    '}',
    '@keyframes vaFadeOnly { from { opacity: 0; } to { opacity: 1; } }',

    /* --- Layer 3: scroll reveal ----------------------------------- */
    '@media (prefers-reduced-motion: no-preference) {',
    '  [data-va-reveal] {',
    '    opacity: 0;',
    '    transform: translateY(calc(30px * var(--vc-motion-scale, 1)));',
    '    transition: opacity var(--vc-duration-entrance, 600ms)',
    '                  var(--vc-easing-decel, cubic-bezier(0,0,0,1)),',
    '                transform var(--vc-duration-entrance, 600ms)',
    '                  var(--vc-easing-decel, cubic-bezier(0,0,0,1));',
    '  }',
    '  [data-va-reveal="fade"]  { transform: none; }',
    '  [data-va-reveal="scale"] { transform: scale(0.94); }',
    '  [data-va-reveal="clip"]  { clip-path: inset(0 100% 0 0);',
    '                             transform: none; }',
    '  [data-va-reveal].va-in   { opacity: 1; transform: none;',
    '                             clip-path: inset(0 0 0 0); }',
    '  /* stagger-on-reveal: children cascade once the container is in */',
    '  [data-va-reveal="stagger"] { opacity: 1; transform: none; }',
    '  [data-va-reveal="stagger"] .va-stagger-item {',
    '    opacity: 0;',
    '    transform: translateY(calc(24px * var(--vc-motion-scale, 1)));',
    '    transition: opacity var(--vc-duration-entrance, 600ms)',
    '                  var(--vc-easing-decel, cubic-bezier(0,0,0,1)),',
    '                transform var(--vc-duration-entrance, 600ms)',
    '                  var(--vc-easing-decel, cubic-bezier(0,0,0,1));',
    '    transition-delay: calc(var(--va-index, 0)',
    '                       * var(--vc-duration-stagger-step, 80ms));',
    '    animation: none;',
    '  }',
    '  [data-va-reveal="stagger"].va-in .va-stagger-item {',
    '    opacity: 1; transform: none;',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  [data-va-reveal]       { opacity: 0;',
    '                           transition: opacity 200ms ease; }',
    '  [data-va-reveal].va-in { opacity: 1; }',
    '  [data-va-reveal="stagger"]       { opacity: 1; }',
    '  [data-va-reveal="stagger"] .va-stagger-item {',
    '    opacity: 0; transition: opacity 200ms ease;',
    '    transform: none; animation: none;',
    '  }',
    '  [data-va-reveal="stagger"].va-in .va-stagger-item { opacity: 1; }',
    '}',

    /* --- Layer 3: scroll-pattern catalog (parallax / progress) ---- */
    '.va-parallax-1 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 0.10 * var(--vc-motion-scale,1) * -1)); }',
    '.va-parallax-2 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 0.25 * var(--vc-motion-scale,1) * -1)); }',
    '.va-parallax-3 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 0.50 * var(--vc-motion-scale,1) * -1)); }',
    '.va-parallax-4 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 0.80 * var(--vc-motion-scale,1) * -1)); }',
    '.va-parallax-5 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 1.00 * var(--vc-motion-scale,1) * -1)); }',
    '.va-parallax-6 { transform: translateY(calc(var(--va-scroll-y,0px)',
    '                 * 1.20 * var(--vc-motion-scale,1) * -1)); }',
    '@media (prefers-reduced-motion: reduce) {',
    '  .va-parallax-1, .va-parallax-2, .va-parallax-3,',
    '  .va-parallax-4, .va-parallax-5, .va-parallax-6 {',
    '    transform: none;',
    '  }',
    '}',
    '/* scroll-snap on the PAGE ROOT — never an inner overflow box */',
    '.va-snap-root { scroll-snap-type: y proximity; }',
    '.va-snap-item { scroll-snap-align: start; }',
    '/* fixed top progress bar — reads --vc-color-accent so both themes */',
    '.va-progress-bar {',
    '  position: fixed; left: 0; top: 0; height: 3px; width: 100%;',
    '  transform-origin: 0 50%; transform: scaleX(var(--va-progress, 0));',
    '  background: var(--vc-color-accent, #b8861f);',
    '  z-index: var(--vc-z-sticky, 100);',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .va-progress-bar { transition: none; }',
    '}',

    /* --- Layer 4: ambient floating presets ------------------------ */
    '@media (prefers-reduced-motion: no-preference) {',
    '  .va-float-y  { animation: vaFloatY  3s  ease-in-out infinite; }',
    '  .va-breathe  { animation: vaBreathe 4s  ease-in-out infinite; }',
    '  .va-orbit    { animation: vaOrbit   8s  linear      infinite; }',
    '  .va-rotate   { animation: vaRotate  12s linear      infinite; }',
    '}',
    '/* reduce branch: NO rule for the floats — decorative-only, so the',
    '   substitute IS removal; the element simply sits at rest. */',
    '@keyframes vaFloatY  {',
    '  0%,100% { transform: translateY(0); }',
    '  50%     { transform: translateY(',
    '              calc(-16px * var(--vc-motion-scale,1))); }',
    '}',
    '@keyframes vaBreathe {',
    '  0%,100% { transform: scale(1); }',
    '  50%     { transform: scale(',
    '              calc(1 + 0.05 * var(--vc-motion-scale,1))); }',
    '}',
    '@keyframes vaOrbit {',
    '  from { transform: rotate(0)      translateX(20px) rotate(0); }',
    '  to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }',
    '}',
    '@keyframes vaRotate {',
    '  from { transform: rotate(0); } to { transform: rotate(360deg); }',
    '}',

    /* --- Layer 4: animated link underline ------------------------- */
    '.va-link {',
    '  background: linear-gradient(currentColor, currentColor)',
    '              no-repeat 0 100%;',
    '  background-size: 0% 2px;',
    '  transition: background-size var(--vc-duration-normal, 200ms)',
    '              var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '}',
    '.va-link:hover, .va-link:focus-visible { background-size: 100% 2px; }',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* underline appears instantly on hover — no slide */',
    '  .va-link { transition: none; }',
    '}',

    /* --- Layer 4: 3D card tilt ------------------------------------ */
    '.va-tilt {',
    '  transition: transform var(--vc-duration-fast, 120ms)',
    '              var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '  transform-style: preserve-3d;',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* tilt disabled in JS; keep the static hover elevation only */',
    '  .va-tilt { transition: none; }',
    '}',

    /* --- Layer 5: pulse-ring dot ---------------------------------- */
    '.va-pulse {',
    '  width: 10px; height: 10px; border-radius: 50%;',
    '  background: var(--vc-color-accent, #b8861f);',
    '  display: inline-block;',
    '}',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .va-pulse { animation: vaPulseRing 1.6s',
    '              var(--vc-easing-decel, cubic-bezier(0,0,0,1)) infinite; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* substitute: static ring, no expansion */',
    '  .va-pulse { box-shadow: 0 0 0 4px color-mix(in srgb,',
    '              var(--vc-color-accent,#b8861f) 25%, transparent); }',
    '}',
    '@keyframes vaPulseRing {',
    '  0%   { box-shadow: 0 0 0 0 color-mix(in srgb,',
    '         var(--vc-color-accent,#b8861f) 45%, transparent); }',
    '  70%  { box-shadow: 0 0 0 12px color-mix(in srgb,',
    '         var(--vc-color-accent,#b8861f) 0%, transparent); }',
    '  100% { box-shadow: 0 0 0 0 color-mix(in srgb,',
    '         var(--vc-color-accent,#b8861f) 0%, transparent); }',
    '}',

    /* --- Layer 5: shimmer skeleton -------------------------------- */
    '.va-skeleton {',
    '  background: linear-gradient(90deg,',
    '    var(--vc-color-surface-sunken, #f1ece0) 25%,',
    '    var(--vc-color-surface, #ffffff)        50%,',
    '    var(--vc-color-surface-sunken, #f1ece0) 75%);',
    '  background-size: 200% 100%;',
    '  border-radius: var(--vc-radius-sm, 4px);',
    '  display: block;',
    '}',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .va-skeleton { animation: vaShimmer 1.5s ease-in-out infinite; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  /* substitute: flat muted block, no slide */',
    '  .va-skeleton { background: var(--vc-color-surface-sunken,#f1ece0); }',
    '}',
    '@keyframes vaShimmer {',
    '  0%   { background-position: 200% 0; }',
    '  100% { background-position: -200% 0; }',
    '}',
    '.va-skeleton--text  { height: 1em; margin-block: 0.35em; }',
    '.va-skeleton--title { height: 1.6em; margin-block: 0.5em; }',
    '.va-skeleton--block { height: 100%; min-height: 80px; }',
    ''
  ];

  // Materialised CSS string — joined once at module load.
  var CSS_TEXT = CSS_LINES.join('\n');

  // ── injectAnimationCSS — append the skill stylesheet ───────────────
  //
  // Idempotent: a second call (the runtime calls it once, a test may
  // call it again) is a no-op because the <style> is guarded by id.
  function injectAnimationCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-va', 'animation');
    style.appendChild(d.createTextNode(CSS_TEXT));
    d.head.appendChild(style);
  }

  // ── Layer 2 — the stagger indexer ──────────────────────────────────
  //
  // For dynamically-built lists, set `--va-index` per `.va-stagger-item`
  // child. AN-04's one kept lesson: READ layout (force one reflow)
  // before WRITING the style mutations, so the browser batches the
  // writes into a single paint and the cascade starts clean with no
  // flash. A manually-authored `--va-index` is respected (only absent
  // ones are filled).
  function indexStagger(container) {
    if (!container || !container.querySelectorAll) { return; }
    var items = container.querySelectorAll('.va-stagger-item');
    if (!items.length) { return; }
    // Read layout once — AN-04 read-before-write principle.
    void container.offsetHeight;
    for (var i = 0; i < items.length; i++) {
      if (!items[i].style.getPropertyValue('--va-index')) {
        items[i].style.setProperty('--va-index', String(i));
      }
    }
  }

  // ── Layer 3 — fire-once scroll reveal ──────────────────────────────
  //
  // One IntersectionObserver, `unobserve` after the first trigger so
  // each element reveals exactly once. A `.va-counter` target's reveal
  // action is animateStat(el) instead of an `is-visible` class; a
  // `[data-va-reveal="stagger"]` container is indexed before observing.
  //
  // Fail-SAFE (the one deliberate exception to fail-fast): when
  // IntersectionObserver is absent, every reveal target is shown
  // immediately. Failing visible is correct; failing to a blank page
  // (content stuck at opacity 0 forever) is not.
  //
  // `_revealCount` is a test hook — every reveal increments it, so a
  // test can prove `unobserve` worked (the count stops climbing).
  var _revealCount = 0;
  var _revealObserver = null;

  function _doReveal(el) {
    if (!el) { return; }
    if (el.classList && el.classList.contains('va-counter')) {
      animateStat(el);
    } else if (el.hasAttribute && el.hasAttribute('data-va-stat')) {
      animateStat(el);
    } else {
      if (el.classList) { el.classList.add('va-in'); }
    }
    _revealCount++;
  }

  function initScrollReveal(root) {
    var d = root || document;
    var revealNodes = d.querySelectorAll('[data-va-reveal]');
    var statNodes = d.querySelectorAll('.va-counter[data-va-stat]');
    // De-dup into one list (a node could match both selectors).
    var nodes = [];
    var seen = [];
    var idx;
    function pushUnique(n) {
      for (idx = 0; idx < seen.length; idx++) {
        if (seen[idx] === n) { return; }
      }
      seen.push(n);
      nodes.push(n);
    }
    for (idx = 0; idx < revealNodes.length; idx++) {
      pushUnique(revealNodes[idx]);
    }
    for (idx = 0; idx < statNodes.length; idx++) {
      pushUnique(statNodes[idx]);
    }
    if (!nodes.length) { return; }

    // Index any stagger-on-reveal containers up front (AN-01 + §6.2).
    for (idx = 0; idx < nodes.length; idx++) {
      if (nodes[idx].getAttribute
        && nodes[idx].getAttribute('data-va-reveal') === 'stagger') {
        indexStagger(nodes[idx]);
      }
    }

    // Fail-SAFE: no IntersectionObserver -> reveal everything now.
    if (typeof IntersectionObserver === 'undefined') {
      for (idx = 0; idx < nodes.length; idx++) {
        _doReveal(nodes[idx]);
      }
      return;
    }

    _revealObserver = new IntersectionObserver(function (entries, obs) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) { continue; }
        _doReveal(entries[j].target);
        obs.unobserve(entries[j].target);   // fire once
      }
    }, { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN });

    for (idx = 0; idx < nodes.length; idx++) {
      _revealObserver.observe(nodes[idx]);
    }
  }

  // ── Layer 3 — stat counter (AN-03) ─────────────────────────────────
  //
  // rAF count-up 0 -> N with an easeOutCubic curve. Duration from
  // `--vc-duration-slow` (falls back to 400ms). `data-va-stat` is the
  // target; `data-va-stat-decimals` / `data-va-stat-suffix` are
  // optional. Fail-fast: a non-numeric `data-va-stat` is skipped.
  // reduced-motion substitute: the final value is set immediately, no
  // tick loop. Exported on the public API — the chart skill consumes
  // it as a KPI-card primitive.
  function animateStat(el) {
    if (!el || !el.getAttribute) { return; }
    var target = parseFloat(el.getAttribute('data-va-stat'));
    if (!isFinite(target)) { return; }   // fail-fast — bad attr -> skip
    var decimals = parseInt(
      el.getAttribute('data-va-stat-decimals') || '0', 10);
    if (!isFinite(decimals) || decimals < 0) { decimals = 0; }
    var suffix = el.getAttribute('data-va-stat-suffix') || '';

    function fmt(v) { return v.toFixed(decimals) + suffix; }

    // Substitute (or no rAF host): show the final value at once.
    if (REDUCED || typeof requestAnimationFrame !== 'function') {
      el.textContent = fmt(target);
      return;
    }

    var dur = readDurationMs('--vc-duration-slow', DUR_SLOW_MS);
    if (dur <= 0) { el.textContent = fmt(target); return; }
    var start = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }   // easeOutCubic
    function tick(now) {
      if (start === null) { start = now; }
      var t = (now - start) / dur;
      if (t > 1) { t = 1; }
      el.textContent = fmt(ease(t) * target);
      if (t < 1) { requestAnimationFrame(tick); }
    }
    requestAnimationFrame(tick);
  }

  // ── Layer 3 — parallax fallback ────────────────────────────────────
  //
  // Modern browsers do scroll-driven parallax natively via the CSS
  // `.va-parallax-*` classes once `--va-scroll-y` is fed. When
  // `animation-timeline: scroll()` is NOT supported the JS feeds
  // `--va-scroll-y` from a passive, rAF-coalesced scroll listener.
  // The progress bar's `--va-progress` is fed from the same handler.
  // No-nested-scrollbars: this reads the DOCUMENT's scroll position
  // (`window.scrollY`), never an inner overflow box.
  var _parallaxRaf = 0;

  function _scrollUpdate() {
    _parallaxRaf = 0;
    var docEl = document.documentElement;
    var y = window.scrollY || window.pageYOffset || 0;
    docEl.style.setProperty('--va-scroll-y', y + 'px');
    // Progress bar — fraction of the page scrolled, 0..1.
    var max = (docEl.scrollHeight - docEl.clientHeight);
    var frac = max > 0 ? (y / max) : 0;
    if (frac < 0) { frac = 0; }
    if (frac > 1) { frac = 1; }
    docEl.style.setProperty('--va-progress', String(frac));
  }

  function initParallaxFallback(root) {
    var d = root || document;
    var hasParallax =
      !!d.querySelector('[class*="va-parallax-"]')
      || !!d.querySelector('.va-progress-bar');
    if (!hasParallax) { return; }
    // Native scroll-driven animation supported — but the progress bar
    // and the JS-driven parallax classes still need `--va-scroll-y`.
    // We attach the listener regardless; native `scroll()` timelines,
    // when present, simply do not depend on it. The listener is cheap
    // (one rAF-coalesced style write per frame) so this is safe.
    function onScroll() {
      if (!_parallaxRaf && typeof requestAnimationFrame === 'function') {
        _parallaxRaf = requestAnimationFrame(_scrollUpdate);
      } else if (typeof requestAnimationFrame !== 'function') {
        _scrollUpdate();
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    _scrollUpdate();   // prime the initial value
  }

  // ── Layer 4 — 3D card tilt (AN-09) ─────────────────────────────────
  //
  // `mousemove` rotates each `.va-tilt` toward the pointer; `mouseleave`
  // resets. reduced-motion: skipped entirely — the CSS keeps the static
  // hover elevation, no tilt. Magnitude scaled by `--vc-motion-scale`.
  function initCardTilt(root) {
    if (REDUCED) { return; }
    var d = root || document;
    var cards = d.querySelectorAll('.va-tilt');
    if (!cards.length) { return; }
    var scale = readNumber('--vc-motion-scale', 1);
    var maxDeg = 10 * scale;
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        // Mark so refresh() does not double-wire the same card.
        if (card.getAttribute('data-va-tilt-wired') === '1') { return; }
        card.setAttribute('data-va-tilt-wired', '1');
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          if (!r.width || !r.height) { return; }
          var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
          card.style.transform = 'perspective(800px) rotateY('
            + (x * maxDeg) + 'deg) rotateX(' + (-y * maxDeg) + 'deg)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform =
            'perspective(800px) rotateY(0) rotateX(0)';
        });
      })(cards[i]);
    }
  }

  // ── Layer 6 — IO-pause for off-screen loops (AN-11) ────────────────
  //
  // A SECOND IntersectionObserver toggles `animation-play-state` on
  // every infinite ambient loop so an off-screen loop costs no CPU.
  // NOT fire-once — it stays attached so the loop pauses again when
  // scrolled back off-screen.
  var _loopObserver = null;

  function initLoopPause(root) {
    var d = root || document;
    var loops = d.querySelectorAll(LOOP_SELECTOR);
    if (!loops.length || typeof IntersectionObserver === 'undefined') {
      return;
    }
    _loopObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.style.animationPlayState =
          entries[i].isIntersecting ? 'running' : 'paused';
      }
    });   // default threshold 0 — pause as soon as it fully clears
    for (var k = 0; k < loops.length; k++) {
      _loopObserver.observe(loops[k]);
    }
  }

  // ── Layer 6 — requestIdleCallback defer (AN-11) ────────────────────
  //
  // Heavy / polish init (card-tilt wiring, parallax fallback,
  // loop-pause IO) is deferred so it never blocks first paint or first
  // interaction. Safari has no requestIdleCallback -> setTimeout(1).
  function deferInit(fn) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(fn, { timeout: 2000 });
    } else if (typeof setTimeout === 'function') {
      setTimeout(fn, 1);
    } else {
      fn();
    }
  }

  // ── Layer 6 — delta-time loop primitive (AN-12) ────────────────────
  //
  // The canonical canvas game-loop: `dt` capped at 0.1s so a stalled
  // tab cannot trigger a spiral-of-death catch-up. Nothing in the
  // animation skill itself calls this — it is exported as a CORRECT
  // primitive so future canvas work (animated chart renders, etc.)
  // reuses it instead of re-inventing a fragile loop.
  function createLoop(update, render) {
    var last = 0;
    var raf = 0;
    var running = false;
    function frame(now) {
      var dt = (now - last) / 1000;
      if (dt > 0.1) { dt = 0.1; }   // cap — anti spiral-of-death
      if (dt < 0) { dt = 0; }
      last = now;
      if (typeof update === 'function') { update(dt); }
      if (typeof render === 'function') { render(); }
      if (running) { raf = requestAnimationFrame(frame); }
    }
    return {
      start: function () {
        if (running) { return; }
        running = true;
        last = (typeof performance !== 'undefined'
          && performance.now) ? performance.now() : Date.now();
        raf = requestAnimationFrame(frame);
      },
      stop: function () {
        running = false;
        if (raf && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(raf);
        }
        raf = 0;
      },
      isRunning: function () { return running; }
    };
  }

  // ── revealNow / refresh — dynamic-DOM hooks ────────────────────────

  // Force one element into its revealed state immediately (used by
  // interactive-control-driven content that appears without a scroll).
  function revealNow(el) {
    if (_revealObserver && el) {
      try { _revealObserver.unobserve(el); } catch (e) { /* noop */ }
    }
    _doReveal(el);
  }

  // Re-scan after dynamic DOM insertion. Re-runs the indexer + reveal
  // observer + tilt wiring; the tilt `data-va-tilt-wired` guard makes
  // re-wiring idempotent. The reveal observer is rebuilt — already-
  // revealed elements keep their `.va-in` class so they do not flash.
  function refresh(root) {
    var d = root || document;
    var staggers = d.querySelectorAll('[data-va-stagger]');
    for (var i = 0; i < staggers.length; i++) {
      indexStagger(staggers[i]);
    }
    if (_revealObserver) {
      try { _revealObserver.disconnect(); } catch (e) { /* noop */ }
      _revealObserver = null;
    }
    // Re-stamp atoms — idempotent on existing ones, picks up any newly
    // inserted elements added since boot. The mini-pill helper is
    // double-mount safe on the runtime side.
    stampAnimatedAtoms(d);
    initScrollReveal(d);
    initCardTilt(d);
    if (_loopObserver) {
      try { _loopObserver.disconnect(); } catch (e) { /* noop */ }
      _loopObserver = null;
    }
    initLoopPause(d);
  }

  // ── init — wire every layer ────────────────────────────────────────
  //
  // Immediate (these gate visible content — must run before first
  // paint): stagger indexer, scroll-reveal IO, counter IO.
  // Deferred via deferInit (polish / perf — safe when idle): card-tilt
  // wiring, parallax fallback, loop-pause IO.
  function init(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }

    // Immediate — content-gating layers.
    var staggers = d.querySelectorAll('[data-va-stagger]');
    for (var i = 0; i < staggers.length; i++) {
      indexStagger(staggers[i]);
    }
    // Selection-contract conformance + decision mini-pill stamping
    // (TRDD-352ef46a phase 2.5 + NEW USER REQ #10). Run BEFORE the
    // reveal observer so the atoms exist as `[data-ve-id]` from the
    // first paint — that way the runtime's hover/select CSS covers
    // them immediately, even before they reveal.
    stampAnimatedAtoms(d);
    initScrollReveal(d);

    // Deferred — polish / perf layers.
    deferInit(function () {
      initCardTilt(d);
      initParallaxFallback(d);
      initLoopPause(d);
    });
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    injectAnimationCSS: injectAnimationCSS,
    init: init,
    animateStat: animateStat,
    createLoop: createLoop,
    revealNow: revealNow,
    refresh: refresh,
    // Selection-contract conformance + decision mini-pill stamping
    // (TRDD-352ef46a phase 2.5 + NEW USER REQ #10). Exposed so a test
    // / orchestrator can re-run the scan after dynamic insertion that
    // does not go through refresh().
    stampAnimatedAtoms: stampAnimatedAtoms,
    // Exposed for the dev-browser test (mirrors window.__veDesignMd).
    _cssText: CSS_TEXT
  };

  // Live OS-preference watch (no-op under Node — _mql stays null).
  _watchReducedMotion();

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpAnimation = _api;
    // Test hook — exposes the gate state + a re-init handle so the
    // dev-browser suite can drive the module like __veDesignMd.
    window.__veAnimation = {
      get state() {
        return {
          reduced: REDUCED,
          revealCount: _revealCount,
          cssInjected: !!(document.getElementById
            && document.getElementById(STYLE_ID))
        };
      },
      get REDUCED() { return REDUCED; },
      set REDUCED(v) { REDUCED = !!v; },
      init: init,
      refresh: refresh,
      injectAnimationCSS: injectAnimationCSS,
      animateStat: animateStat,
      revealCount: function () { return _revealCount; }
    };

    // Self-init on DOMContentLoaded — UNLESS the host opted out via
    // window.__vaManualInit (the runtime sets this so it controls the
    // engine -> tokens -> animation-CSS -> animation-init ordering;
    // the test fixture also sets it for deterministic control).
    if (!window.__vaManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          injectAnimationCSS(document);
          init(document);
        });
      } else {
        injectAnimationCSS(document);
        init(document);
      }
    }
  }

  // Node export — for the test harness / sanity checks.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
