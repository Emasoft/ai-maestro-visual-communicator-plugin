/*!
 * ai-maestro-visual-communicator-plugin — slide deck runtime module.
 *
 * Phase 2 (visualizing backlog §5, slide spec TRDD-352ef46a): renders a
 * deck of fixed-aspect "stage" slides from a JSON deck contract — the
 * top-of-stack composite that converged five third-party slide projects
 * into one consolidated, dependency-free renderer.
 *
 * Design contract (slide-spec.md):
 *   - Dependency-free. Pure CSS + vanilla ES5-style JS. No reveal.js, no
 *     GSAP, no Shiki/Mermaid CDN, no build step. ES5-safe — `var`,
 *     function declarations, no arrow functions, no template literals,
 *     no `class` keyword. Matches amvcp-designmd.js / amvcp-runtime.js.
 *   - Theme-driven. Every color/size/duration/easing reads a `--vc-*`
 *     custom property (the namespace the shipped Phase-1 engine emits —
 *     NOT the older `--ve-*`). Every token reference carries a canonical
 *     hardcoded fallback so the module is fully defensive: a deck still
 *     renders and themes correctly when the DESIGN.md engine has not run
 *     and no `--vc-*` tokens are present. Cross-file wiring (engine,
 *     sibling renderers) is deferred to a later integration pass.
 *   - Light + dark. Every painted surface reads a `--vc-color-*` token,
 *     so a deck is correct in BOTH themes by construction — zero
 *     `prefers-color-scheme` branches in the slide CSS.
 *   - No nested scrollbars. The `vsd-viewport` CLIPS the letterbox; it
 *     never scrolls. No slide or layout has `overflow:auto`. The
 *     JS-disabled <noscript> degradation expands the document, never an
 *     inner box.
 *   - Fail-fast for STRUCTURE. Unknown block type, unknown layout,
 *     malformed deck JSON, missing required field → throw, naming the
 *     offending JSON path. No silent skips, no invented defaults.
 *   - Soft for STYLE. The assertion-evidence headline rule and the
 *     content-density guard COLLECT warnings (a console.warn + a
 *     non-print data attribute) — natural language is fuzzy, a
 *     false-positive must not block a deck. This split is deliberate.
 *
 * Dual export:
 *   - browser: `window.amvcpSlideDeck = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Public API:
 *   injectSlideCSS(doc)            — append the deck <style> to doc.head
 *   parseDeck(jsonText|object)     — validate a deck; returns the deck
 *   renderDeck(deck, mountEl)      — build the deck DOM into mountEl
 *   createDeck(viewportEl)         — wire navigation; returns a Deck
 *   fitStage(viewportEl)           — recompute the letterbox scale
 *   validateHeadline(text)         — assertion-evidence soft check
 *   boot(doc)                      — full self-init from an embedded deck
 *   refresh(viewportEl)            — re-fit + re-wire after DOM changes
 */
(function () {
  'use strict';

  // ── Constants — the documented literal set ─────────────────────────
  //
  // slide-spec.md §13: the ONLY literal values permitted in this module.
  // A deck's pixel grid is intentionally fixed; everything ELSE (color,
  // type, spacing, radius, duration, easing) flows through `--vc-*`.

  // Named aspect ratios → fixed stage pixel dimensions. One per deck.
  var ASPECTS = {
    '16:9': { w: 1920, h: 1080 },
    '4:3': { w: 1280, h: 960 },
    '3:2': { w: 1620, h: 1080 }
  };
  // A poster (kind:"poster") uses its own fixed stage and caps scale at 1.
  var POSTER_STAGE = { w: 1600, h: 900 };

  // Touch-swipe distance threshold (px) before a swipe counts as nav.
  var SWIPE_THRESHOLD_PX = 50;

  // The <style> element id — injection is idempotent (a second call is a
  // no-op), matching the runtime's injectStyles guard.
  var STYLE_ID = 'vsd-slide-styles';

  // The embedded deck JSON / preset DESIGN.md <script> element ids.
  var DECK_SCRIPT_ID = 'vsd-deck';
  var PRESET_SCRIPT_ID = 'vsd-preset';

  // Density limits — slide-spec.md §10.2. Exceeding either collects a
  // soft `data-vsd-overflow` warning; no scrollbar is ever added.
  var MAX_BULLETS = 6;
  var MAX_BODY_WORDS = 40;

  // Assertion-evidence headline rule — slide-spec.md §10.1. A headline
  // shorter than this word count, with no verb signal and no stat, is
  // flagged (soft warning, never thrown).
  var MIN_HEADLINE_WORDS = 5;

  // ── Schema vocabulary — every accepted enum value ──────────────────

  // Deck `kind`.
  var DECK_KINDS = ['deck', 'poster'];
  // Deck `fit` mode — letterbox (fixed stage + transform:scale) or
  // responsive (each slide 100dvh, no fixed stage).
  var FIT_MODES = ['letterbox', 'responsive'];
  // Entrance moods (slide-spec.md §9.3).
  var MOODS = ['minimal', 'editorial', 'dramatic', 'playful', 'techy'];
  // Slide→slide transitions (slide-spec.md §9.4).
  var TRANSITIONS = ['crossfade', 'slide-left', 'zoom', 'page-turn'];

  // The 16-layout deduplicated catalog (slide-spec.md §6.3). A slide's
  // `layout` MUST be one of these — an unknown value throws.
  var LAYOUTS = [
    'manifesto', 'section-divider', 'statement', 'content',
    'two-column', 'comparison', 'quadrant', 'data-story',
    'metrics', 'timeline', 'bento', 'stack',
    'full-bleed', 'quote', 'code-focus', 'closing'
  ];

  // The 7 named bento grid templates (slide-spec.md §6.4).
  var BENTO_GRIDS = [
    'hero', 'gallery', 'asymmetric', 'feature', 'stats', 'split', 'full'
  ];

  // Block types the slide skill renders itself. `code` / `diagram` /
  // `chart` are DELEGATED — see DELEGATED_BLOCKS.
  var SLIDE_OWNED_BLOCKS = [
    'eyebrow', 'heading', 'text', 'bullets', 'metric', 'callout',
    'quote', 'comparison', 'image', 'spacer'
  ];
  // Blocks delegated to a sibling renderer module. The slide module
  // calls `window.<module>.renderInto(el, spec)`; absent module → throw.
  var DELEGATED_BLOCKS = {
    code: { global: 'amvcpCodeBlock', label: 'code-block (amvcp-codeblock.js)' },
    diagram: { global: 'amvcpDiagram', label: 'diagram (amvcp-graphdiagram.js)' },
    chart: { global: 'amvcpChart', label: 'chart (amvcp-charts.js)' }
  };
  // Callout tints — maps to a `--vc-color-*` semantic role.
  var CALLOUT_VARIANTS = {
    info: 'info', tip: 'success', warning: 'warning', danger: 'danger'
  };

  // A small verb-signal list for the assertion-evidence heuristic. NOT
  // exhaustive — the morphology check (-ed / -ing / a stat) catches the
  // rest. slide-spec.md §10.1: a soft nudge, never a hard gate.
  var VERB_SIGNALS = [
    'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
    'do', 'does', 'did', 'will', 'shows', 'show', 'drives', 'drive',
    'cuts', 'cut', 'grew', 'grow', 'grows', 'rose', 'rise', 'rises',
    'fell', 'fall', 'falls', 'dropped', 'drop', 'drops', 'beats',
    'beat', 'wins', 'win', 'lost', 'lose', 'gains', 'gain', 'saves',
    'save', 'makes', 'make', 'made', 'lets', 'let', 'turns', 'turn',
    'means', 'mean', 'gives', 'give', 'gave', 'needs', 'need',
    'reached', 'reach', 'shipped', 'ship', 'ships', 'matters',
    'matter', 'now', 'every', 'each'
  ];

  // ── token helper ───────────────────────────────────────────────────
  //
  // Read a CSS custom property off :root and return its trimmed value,
  // or `fallback` when the token is absent / empty / unreadable. This is
  // what makes the module fully defensive — a deck themes correctly even
  // when the DESIGN.md engine has not applied any `--vc-*` tokens.
  function readToken(name, fallback) {
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
    raw = (raw || '').trim();
    return raw ? raw : fallback;
  }

  // ── Deck CSS — the injected stylesheet ─────────────────────────────
  //
  // Built as an array of lines joined with '\n' — ES5-safe, no template
  // literals. EVERY color / size / duration / easing is a `var(--vc-*,
  // fallback)`; the fallback is the canonical default so the deck looks
  // correct standalone. Layout CSS has ZERO `prefers-color-scheme`
  // branches — the engine swaps the `--vc-color-*` set, the CSS only
  // ever references the token (slide-spec.md §13).
  //
  // The reduced-motion gate (slide-spec.md §9.5) substitutes every
  // entrance/transition with an opacity-only / instant variant — never
  // an `animation:none` that leaves a block stuck at opacity 0.
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — slide deck skill (injected) */',

    /* --- viewport: the letterbox CLIP. Never a scroller. ---------- */
    '.vsd-viewport {',
    '  position: fixed; inset: 0; overflow: hidden;',
    '  background: var(--vc-color-canvas, #ffffff);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '/* responsive fit: no fixed stage — each slide is 100dvh. */',
    '.vsd-viewport[data-vsd-fit="responsive"] {',
    '  position: static; overflow: visible;',
    '}',

    /* --- stage: the fixed-pixel grid that gets transform:scale --- */
    '.vsd-stage {',
    '  position: absolute; top: 0; left: 0;',
    '  transform-origin: top left;',
    '  background: var(--vc-color-canvas, #ffffff);',
    '}',
    '.vsd-viewport[data-vsd-fit="responsive"] .vsd-stage {',
    '  position: static; width: 100% !important;',
    '  height: auto !important; transform: none !important;',
    '}',

    /* --- slide: exactly one visible at a time (others [hidden]). - */
    '.vsd-slide {',
    '  position: absolute; inset: 0;',
    '  display: flex; flex-direction: column;',
    '  box-sizing: border-box;',
    '  padding: var(--vc-space-6, 64px) var(--vc-space-6, 64px);',
    '  background: var(--vc-color-canvas, #ffffff);',
    '  overflow: visible;',
    '  outline-offset: -2px;',          /* ring INSIDE the slide bounds */
    '}',
    '.vsd-slide[hidden] { display: none; }',
    /* --- selection ring override (Phase 2.5 contract conformance) ---
       The runtime's universal `[data-ve-id]:hover|:focus-visible|
       [data-ve-selected]` rules paint a 2px outline at outline-offset:
       3px — i.e. 3px OUTSIDE the box. Slides are `position:absolute;
       inset:0` inside a `.vsd-viewport { overflow:hidden }` that CLIPS
       at the slide edge, so an outside outline is invisible. We hoist
       the outline INSIDE with `outline-offset:-2px` (above) so the ring
       paints just inside the edge and stays visible. The `!important`
       beats the runtime's specificity for the same-named property. */
    '.vsd-slide[data-ve-id]:hover,',
    '.vsd-slide[data-ve-id]:focus-visible,',
    '.vsd-slide[data-ve-id][data-ve-selected="1"],',
    '.vsd-slide[data-ve-id][data-ve-selected="1"]:hover {',
    '  outline-offset: -2px !important;',
    '}',
    /* The runtime hover rule sets an OUTER box-shadow glow that gets
       clipped by the viewport. Replace with an INSET glow so the
       hover affordance stays visible inside the slide bounds. */
    '.vsd-slide[data-ve-id]:hover {',
    '  box-shadow: inset 0 0 12px',
    '              color-mix(in srgb,',
    '              var(--vc-color-accent, #b8861f) 35%, transparent)',
    '              !important;',
    '}',
    '.vsd-slide[data-ve-id][data-ve-selected="1"] {',
    '  box-shadow: none !important;',     /* selected = ring + bg, no glow */
    '}',
    '.vsd-slide[data-ve-id][data-ve-selected="1"]:hover {',
    '  box-shadow: inset 0 0 16px',
    '              color-mix(in srgb,',
    '              var(--vc-color-accent, #b8861f) 50%, transparent)',
    '              !important;',
    '}',
    '.vsd-viewport[data-vsd-fit="responsive"] .vsd-slide {',
    '  position: relative; inset: auto;',
    '  min-height: 100dvh;',           // 100dvh — mobile address-bar safe
    '}',

    /* --- block primitives ---------------------------------------- */
    '.vsd-eyebrow {',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-size: var(--vc-text-1, 20px);',
    '  letter-spacing: 0.12em; text-transform: uppercase;',
    '  color: var(--vc-color-accent, #b8861f);',
    '  margin: 0 0 var(--vc-space-3, 24px) 0;',
    '}',
    '.vsd-heading {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-weight: var(--vc-weight-bold, 800);',
    '  font-size: var(--vc-text-5, 96px);',
    '  line-height: var(--vc-line-height, 1.15);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  margin: 0 0 var(--vc-space-4, 40px) 0;',
    '}',
    '.vsd-heading--2 { font-size: var(--vc-text-4, 64px); }',
    '.vsd-text {',
    '  font-size: var(--vc-text-3, 40px);',
    '  line-height: var(--vc-line-height, 1.3);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  margin: 0 0 var(--vc-space-3, 24px) 0;',
    '}',
    '.vsd-bullets {',
    '  list-style: none; margin: 0; padding: 0;',
    '  display: flex; flex-direction: column;',
    '  gap: var(--vc-space-3, 24px);',
    '}',
    '.vsd-bullet {',
    '  position: relative; padding-left: var(--vc-space-4, 40px);',
    '  font-size: var(--vc-text-3, 40px);',
    '  line-height: var(--vc-line-height, 1.3);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.vsd-bullet::before {',
    '  content: ""; position: absolute;',
    '  left: 0; top: 0.55em;',
    '  width: var(--vc-space-2, 12px); height: var(--vc-space-2, 12px);',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-accent, #b8861f);',
    '}',
    '.vsd-bullet-sub {',
    '  display: block; margin-top: var(--vc-space-1, 8px);',
    '  font-size: var(--vc-text-2, 28px);',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.vsd-metric {',
    '  display: flex; flex-direction: column;',
    '  gap: var(--vc-space-1, 8px);',
    '}',
    '.vsd-metric-value {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-weight: var(--vc-weight-bold, 800);',
    '  font-size: var(--vc-text-6, 140px);',
    '  line-height: 1;',
    '  color: var(--vc-color-accent, #b8861f);',
    '}',
    '.vsd-metric-label {',
    '  font-size: var(--vc-text-2, 28px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',
    '.vsd-metric-delta {',
    '  font-size: var(--vc-text-1, 20px);',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  color: var(--vc-color-success, #3a6b5c);',
    '}',
    '.vsd-callout {',
    '  border-left: 4px solid var(--vc-color-info, #3464a8);',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  border-radius: var(--vc-radius-md, 10px);',
    '  padding: var(--vc-space-3, 24px) var(--vc-space-4, 40px);',
    '  font-size: var(--vc-text-2, 28px);',
    '  color: var(--vc-color-content, #1f1a14);',
    '}',
    '.vsd-callout[data-vsd-variant="tip"] {',
    '  border-left-color: var(--vc-color-success, #3a6b5c);',
    '}',
    '.vsd-callout[data-vsd-variant="warning"] {',
    '  border-left-color: var(--vc-color-warning, #a8791f);',
    '}',
    '.vsd-callout[data-vsd-variant="danger"] {',
    '  border-left-color: var(--vc-color-danger, #a84a32);',
    '}',
    '.vsd-quote {',
    '  position: relative;',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-size: var(--vc-text-4, 64px);',
    '  line-height: var(--vc-line-height, 1.25);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  padding-left: var(--vc-space-5, 96px);',
    '}',
    '.vsd-quote::before {',
    '  content: "\\201C"; position: absolute;',
    '  left: 0; top: -0.2em;',
    '  font-size: var(--vc-text-6, 140px);',
    '  color: var(--vc-color-accent, #b8861f);',
    '  opacity: 0.4; line-height: 1;',
    '}',
    '.vsd-quote-cite {',
    '  display: block; margin-top: var(--vc-space-3, 24px);',
    '  font-family: var(--vc-font-body, system-ui, sans-serif);',
    '  font-size: var(--vc-text-2, 28px);',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.vsd-quote-cite::before { content: "\\2014\\00a0"; }',
    '.vsd-spacer { flex: 1 1 auto; min-height: var(--vc-space-3, 24px); }',
    '.vsd-image {',
    '  display: block; max-width: 100%;',
    '  border-radius: var(--vc-radius-lg, 20px);',
    '}',
    '.vsd-image--cover { width: 100%; height: 100%; object-fit: cover; }',
    '.vsd-image--contain { object-fit: contain; }',
    '.vsd-delegate {',
    '  flex: 1 1 auto; min-height: 0;',
    '  display: flex; align-items: center; justify-content: center;',
    '}',

    /* --- comparison: two-pane VS block --------------------------- */
    '.vsd-comparison {',
    '  display: grid; grid-template-columns: 1fr 1fr;',
    '  gap: var(--vc-space-4, 40px); flex: 1 1 auto; min-height: 0;',
    '}',
    '.vsd-compare-pane {',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-lg, 20px);',
    '  padding: var(--vc-space-4, 40px);',
    '  display: flex; flex-direction: column; gap: var(--vc-space-3, 24px);',
    '}',
    '.vsd-compare-title {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-weight: var(--vc-weight-bold, 800);',
    '  font-size: var(--vc-text-3, 40px);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  margin: 0;',
    '}',

    /* --- layout primitives: singleton / split / meta-visual ------ */
    '.vsd-layout-manifesto, .vsd-layout-statement,',
    '.vsd-layout-quote, .vsd-layout-closing,',
    '.vsd-layout-code-focus {',
    '  justify-content: center;',
    '}',
    '.vsd-layout-content { justify-content: center; }',
    '.vsd-layout-two-column, .vsd-layout-quadrant,',
    '.vsd-layout-data-story, .vsd-layout-stack {',
    '  display: grid;',
    '  grid-template-columns: 36fr 64fr;',
    '  gap: var(--vc-space-5, 96px);',
    '  align-items: center;',
    '}',
    '.vsd-layout-comparison, .vsd-layout-metrics {',
    '  justify-content: center;',
    '}',
    '.vsd-layout-metrics .vsd-metrics-row {',
    '  display: grid;',
    '  grid-auto-flow: column; grid-auto-columns: 1fr;',
    '  gap: var(--vc-space-5, 96px);',
    '}',
    '.vsd-layout-timeline .vsd-bullets {',
    '  flex-direction: row; gap: var(--vc-space-5, 96px);',
    '}',
    '.vsd-layout-timeline .vsd-bullet { flex: 1 1 0; }',
    '.vsd-layout-full-bleed {',
    '  padding: 0; position: relative;',
    '}',
    '.vsd-layout-full-bleed .vsd-image--cover {',
    '  position: absolute; inset: 0;',
    '}',
    '.vsd-layout-full-bleed .vsd-caption {',
    '  position: relative; margin-top: auto;',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border-radius: var(--vc-radius-lg, 20px);',
    '  padding: var(--vc-space-4, 40px);',
    '  margin: var(--vc-space-5, 96px);',
    '}',

    /* --- bento grid catalog (slide-spec.md §6.4) ----------------- */
    '.vsd-layout-bento { display: flex; flex-direction: column;',
    '  gap: var(--vc-space-3, 24px); }',
    '.vsd-bento-grid {',
    '  flex: 1 1 auto; display: grid; gap: var(--vc-space-3, 24px);',
    '  min-height: 0;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="gallery"] {',
    '  grid-template-columns: repeat(3, 1fr);',
    '  grid-auto-rows: 1fr;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="hero"] {',
    '  grid-template-columns: repeat(3, 1fr);',
    '  grid-template-rows: 2fr 1fr;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="hero"] > :first-child {',
    '  grid-column: 1 / -1;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="asymmetric"] {',
    '  grid-template-columns: 2fr 1fr;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="feature"] {',
    '  grid-template-columns: 1fr 1fr;',
    '  grid-template-rows: 1fr 1fr;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="feature"] > :first-child {',
    '  grid-row: 1 / -1;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="stats"] {',
    '  grid-template-columns: repeat(4, 1fr);',
    '}',
    '.vsd-bento-grid[data-vsd-grid="split"] {',
    '  grid-template-columns: 1fr 1fr;',
    '  grid-auto-rows: 1fr;',
    '}',
    '.vsd-bento-grid[data-vsd-grid="full"] {',
    '  grid-template-columns: 1fr;',
    '}',
    '.vsd-bento-card {',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-lg, 20px);',
    '  padding: var(--vc-space-4, 40px);',
    '  display: flex; flex-direction: column;',
    '  justify-content: center;',
    '}',

    /* --- section-divider: the SL-12 ghost numeral ---------------- */
    '.vsd-layout-section-divider {',
    '  position: relative;',
    '  align-items: center; justify-content: center;',
    '  text-align: center;',
    '}',
    '.vsd-layout-section-divider[data-vsd-numeral]::before {',
    '  content: attr(data-vsd-numeral);',
    '  position: absolute; inset: 0;',
    '  display: grid; place-items: center;',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  font-weight: var(--vc-weight-bold, 800);',
    '  font-size: 40vmin;',                 // vmin — tracks the rendered stage
    '  color: var(--vc-color-content, #1f1a14);',
    '  opacity: 0.06;',                     // the "ghost" — token color, low alpha
    '  pointer-events: none; z-index: 0;',
    '}',
    '.vsd-layout-section-divider > * { position: relative; z-index: 1; }',

    /* --- navigation chrome --------------------------------------- */
    '.vsd-nav {',
    '  position: absolute; left: 50%; bottom: var(--vc-space-3, 24px);',
    '  transform: translateX(-50%);',
    '  display: flex; gap: var(--vc-space-2, 12px);',
    '  z-index: 10;',
    '}',
    '.vsd-dot {',
    '  width: 12px; height: 12px; padding: 0;',
    '  border: none; cursor: pointer;',
    '  border-radius: var(--vc-radius-full, 9999px);',
    '  background: var(--vc-color-border, #e3dcc9);',
    '  transition: background var(--vc-duration-fast, 120ms)',
    '              var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '}',
    '.vsd-dot:hover { background: var(--vc-color-border-strong, #c9bfa3); }',
    '.vsd-dot[aria-current="true"] {',
    '  background: var(--vc-color-accent, #b8861f);',
    '}',
    '.vsd-counter {',
    '  position: absolute; right: var(--vc-space-3, 24px);',
    '  bottom: var(--vc-space-3, 24px);',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-size: var(--vc-text-1, 20px);',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '  z-index: 10;',
    '}',
    '.vsd-progress {',
    '  position: absolute; left: 0; top: 0;',
    '  height: 4px; width: 100%; z-index: 10;',
    '  background: var(--vc-color-border, #e3dcc9);',
    '}',
    '.vsd-progress-fill {',
    '  height: 100%; width: 0%;',
    '  background: var(--vc-color-accent, #b8861f);',
    '  transition: width var(--vc-duration-normal, 200ms)',
    '              var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '}',

    /* --- theme HUD (hot-swap, slide-spec.md §8) ------------------ */
    '.vsd-theme-hud {',
    '  position: absolute; right: var(--vc-space-3, 24px);',
    '  top: var(--vc-space-3, 24px); z-index: 11;',
    '  background: var(--vc-color-surface-raised, #fffdf8);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 10px);',
    '  padding: var(--vc-space-1, 8px) var(--vc-space-3, 24px);',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-size: var(--vc-text-1, 20px);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  opacity: 0;',
    '  transition: opacity var(--vc-duration-slow, 400ms)',
    '              var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '}',
    '.vsd-theme-hud.vsd-hud-show { opacity: 1; }',

    /* --- entrance moods (slide-spec.md §9.3) — CSS-only ---------- */
    '@media (prefers-reduced-motion: no-preference) {',
    '  .vsd-slide[data-vsd-mood] .vsd-block {',
    '    opacity: 0;',
    '  }',
    '  .vsd-slide[data-vsd-mood].vsd-revealed .vsd-block {',
    '    opacity: 1;',
    '    transition: opacity var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-decel, cubic-bezier(0,0,0,1)),',
    '              transform var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-decel, cubic-bezier(0,0,0,1)),',
    '              letter-spacing var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-decel, cubic-bezier(0,0,0,1)),',
    '              clip-path var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-decel, cubic-bezier(0,0,0,1));',
    '    transition-delay: calc(var(--vsd-index, 0)',
    '              * var(--vc-motion-stagger, 60ms));',
    '  }',
    /* editorial: rise */
    '  .vsd-slide[data-vsd-mood="editorial"] .vsd-block {',
    '    transform: translateY(16px);',
    '  }',
    /* dramatic: clip-path wipe */
    '  .vsd-slide[data-vsd-mood="dramatic"] .vsd-block {',
    '    clip-path: inset(0 100% 0 0);',
    '  }',
    '  .vsd-slide[data-vsd-mood="dramatic"].vsd-revealed .vsd-block {',
    '    clip-path: inset(0 0 0 0);',
    '  }',
    /* playful: bigger rise */
    '  .vsd-slide[data-vsd-mood="playful"] .vsd-block {',
    '    transform: translateY(24px);',
    '  }',
    /* techy: heading letter-spacing settle */
    '  .vsd-slide[data-vsd-mood="techy"] .vsd-heading {',
    '    letter-spacing: 0.3em;',
    '  }',
    '  .vsd-slide[data-vsd-mood="techy"].vsd-revealed .vsd-heading {',
    '    letter-spacing: normal;',
    '  }',
    '  .vsd-slide[data-vsd-mood].vsd-revealed .vsd-block {',
    '    transform: translateY(0);',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    /* substitute: opacity-only, instant; NEVER stuck at opacity 0. */
    '  .vsd-slide[data-vsd-mood] .vsd-block { opacity: 0; }',
    '  .vsd-slide[data-vsd-mood].vsd-revealed .vsd-block {',
    '    opacity: 1; transform: none; clip-path: none;',
    '    letter-spacing: normal;',
    '    transition: opacity 200ms ease;',
    '  }',
    '}',

    /* --- transitions (slide-spec.md §9.4) — CSS-only ------------- */
    '@media (prefers-reduced-motion: no-preference) {',
    '  .vsd-slide.vsd-entering, .vsd-slide.vsd-leaving {',
    '    transition: opacity var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-standard, cubic-bezier(0.2,0,0,1)),',
    '              transform var(--vc-duration-normal, 320ms)',
    '                var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));',
    '  }',
    /* crossfade */
    '  .vsd-stage[data-vsd-transition="crossfade"] .vsd-leaving {',
    '    opacity: 0;',
    '  }',
    /* slide-left */
    '  .vsd-stage[data-vsd-transition="slide-left"] .vsd-entering {',
    '    transform: translateX(0);',
    '  }',
    '  .vsd-stage[data-vsd-transition="slide-left"] .vsd-leaving {',
    '    transform: translateX(-100%); opacity: 0;',
    '  }',
    /* zoom */
    '  .vsd-stage[data-vsd-transition="zoom"] .vsd-leaving {',
    '    opacity: 0; transform: scale(1.04);',
    '  }',
    /* page-turn: 40px slide + shadow depth cue */
    '  .vsd-stage[data-vsd-transition="page-turn"] .vsd-leaving {',
    '    opacity: 0; transform: translateX(40px);',
    '    box-shadow: var(--vc-shadow-lg, 0 24px 64px rgba(0,0,0,0.3));',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    /* substitute: instant swap, no transform / scale / shadow. */
    '  .vsd-slide.vsd-entering, .vsd-slide.vsd-leaving {',
    '    transition: none; transform: none; box-shadow: none;',
    '  }',
    '}',

    /* --- print: native "Save as PDF", one slide per page --------- */
    '@media print {',
    '  .vsd-viewport { position: static; overflow: visible; }',
    '  .vsd-stage {',
    '    position: static; transform: none !important;',
    '    width: auto !important; height: auto !important;',
    '  }',
    '  .vsd-slide {',
    '    position: relative; inset: auto;',
    '    page-break-after: always; break-inside: avoid;',
    '    min-height: 90vh;',
    '  }',
    '  .vsd-slide[hidden] { display: flex !important; }',
    '  .vsd-nav, .vsd-counter, .vsd-progress, .vsd-theme-hud {',
    '    display: none !important;',
    '  }',
    '}',
    ''
  ];

  // Materialised CSS string — joined once at module load.
  var CSS_TEXT = CSS_LINES.join('\n');

  // ── injectSlideCSS — append the deck stylesheet ────────────────────
  //
  // Idempotent: a second call (boot + a test, say) is a no-op because
  // the <style> is guarded by id.
  function injectSlideCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-vsd', 'slide');
    style.appendChild(d.createTextNode(CSS_TEXT));
    d.head.appendChild(style);
  }

  // ── small validation helpers ───────────────────────────────────────

  function isPlainObject(v) {
    return v !== null && typeof v === 'object'
      && Object.prototype.toString.call(v) === '[object Object]';
  }

  function inList(value, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] === value) { return true; }
    }
    return false;
  }

  // Fail-fast: throw an Error naming the offending JSON path. Used for
  // every STRUCTURAL violation (slide-spec.md §13).
  function deckError(path, message) {
    throw new Error('amvcp-slide: ' + path + ': ' + message);
  }

  // ── parseDeck — validate a deck JSON document ──────────────────────
  //
  // Accepts either a JSON string or an already-parsed object. Validates
  // every enum and every required field; any violation throws with the
  // offending path (e.g. `slides[3].blocks[1]: unknown block type
  // "mermaidd"`). Returns the validated, normalised deck object.
  //
  // Fail-fast — no invented defaults beyond the documented optional-key
  // fallbacks (kind→deck, aspect→16:9, fit→letterbox, mood→minimal,
  // transition→crossfade, loop→false). Those ARE documented defaults,
  // not silent error recovery.
  function parseDeck(input) {
    var deck;
    if (typeof input === 'string') {
      try {
        deck = JSON.parse(input);
      } catch (e) {
        deckError('deck', 'not valid JSON — ' + (e && e.message || e));
      }
    } else if (isPlainObject(input)) {
      deck = input;
    } else {
      deckError('deck', 'must be a JSON string or an object');
    }
    if (!isPlainObject(deck)) {
      deckError('deck', 'top-level value must be a JSON object');
    }

    // kind — optional, default "deck".
    deck.kind = deck.kind === undefined ? 'deck' : deck.kind;
    if (!inList(deck.kind, DECK_KINDS)) {
      deckError('deck.kind',
        'must be one of ' + DECK_KINDS.join(', ') + ' (got "'
        + deck.kind + '")');
    }
    // aspect — optional, default "16:9".
    deck.aspect = deck.aspect === undefined ? '16:9' : deck.aspect;
    if (!ASPECTS[deck.aspect]) {
      deckError('deck.aspect',
        'must be one of 16:9, 4:3, 3:2 (got "' + deck.aspect + '")');
    }
    // fit — optional, default "letterbox".
    deck.fit = deck.fit === undefined ? 'letterbox' : deck.fit;
    if (!inList(deck.fit, FIT_MODES)) {
      deckError('deck.fit',
        'must be one of letterbox, responsive (got "' + deck.fit + '")');
    }
    // mood — optional, default "minimal".
    deck.mood = deck.mood === undefined ? 'minimal' : deck.mood;
    if (!inList(deck.mood, MOODS)) {
      deckError('deck.mood',
        'must be one of ' + MOODS.join(', ') + ' (got "' + deck.mood
        + '")');
    }
    // transition — optional, default "crossfade".
    deck.transition = deck.transition === undefined
      ? 'crossfade' : deck.transition;
    if (!inList(deck.transition, TRANSITIONS)) {
      deckError('deck.transition',
        'must be one of ' + TRANSITIONS.join(', ') + ' (got "'
        + deck.transition + '")');
    }
    // loop — optional, default false.
    deck.loop = deck.loop === undefined ? false : !!deck.loop;
    // title — required (used for the localStorage namespace fallback).
    if (typeof deck.title !== 'string' || !deck.title) {
      deckError('deck.title', 'a non-empty string title is required');
    }
    // slides — required, non-empty array.
    if (!deck.slides || Object.prototype.toString.call(deck.slides)
        !== '[object Array]' || !deck.slides.length) {
      deckError('deck.slides', 'a non-empty array of slides is required');
    }

    for (var s = 0; s < deck.slides.length; s++) {
      validateSlide(deck.slides[s], s);
    }
    return deck;
  }

  // Validate one slide. `i` is its index, for error paths.
  function validateSlide(slide, i) {
    var path = 'slides[' + i + ']';
    if (!isPlainObject(slide)) {
      deckError(path, 'each slide must be a JSON object');
    }
    if (typeof slide.layout !== 'string' || !slide.layout) {
      deckError(path + '.layout', 'a layout name is required');
    }
    if (!inList(slide.layout, LAYOUTS)) {
      deckError(path + '.layout',
        'unknown layout "' + slide.layout + '" — must be one of '
        + LAYOUTS.join(', '));
    }
    // grid — optional, bento-only.
    if (slide.grid !== undefined && !inList(slide.grid, BENTO_GRIDS)) {
      deckError(path + '.grid',
        'unknown bento grid "' + slide.grid + '" — must be one of '
        + BENTO_GRIDS.join(', '));
    }
    if (!slide.blocks || Object.prototype.toString.call(slide.blocks)
        !== '[object Array]' || !slide.blocks.length) {
      deckError(path + '.blocks',
        'a non-empty array of blocks is required');
    }
    for (var b = 0; b < slide.blocks.length; b++) {
      validateBlock(slide.blocks[b], path + '.blocks[' + b + ']');
    }
  }

  // Validate one block. `path` is the full JSON path, for errors.
  function validateBlock(block, path) {
    if (!isPlainObject(block)) {
      deckError(path, 'each block must be a JSON object');
    }
    var t = block.type;
    if (typeof t !== 'string' || !t) {
      deckError(path + '.type', 'a block type is required');
    }
    var isOwned = inList(t, SLIDE_OWNED_BLOCKS);
    var isDelegated = Object.prototype.hasOwnProperty.call(
      DELEGATED_BLOCKS, t);
    if (!isOwned && !isDelegated) {
      deckError(path, 'unknown block type "' + t + '"');
    }
    // Per-type required-key checks — fail-fast on a missing field.
    if (t === 'eyebrow' || t === 'heading' || t === 'text'
        || t === 'quote') {
      if (typeof block.text !== 'string') {
        deckError(path + '.text',
          'block type "' + t + '" requires a string "text"');
      }
    }
    if (t === 'bullets') {
      if (Object.prototype.toString.call(block.items) !== '[object Array]'
          || !block.items.length) {
        deckError(path + '.items',
          'block type "bullets" requires a non-empty "items" array');
      }
    }
    if (t === 'metric') {
      if (block.value === undefined || block.label === undefined) {
        deckError(path,
          'block type "metric" requires "value" and "label"');
      }
    }
    if (t === 'callout') {
      if (!Object.prototype.hasOwnProperty.call(
          CALLOUT_VARIANTS, block.variant)) {
        deckError(path + '.variant',
          'callout "variant" must be info, tip, warning, or danger');
      }
      if (typeof block.text !== 'string') {
        deckError(path + '.text', 'callout requires a string "text"');
      }
    }
    if (t === 'comparison') {
      if (!isPlainObject(block.left) || !isPlainObject(block.right)) {
        deckError(path,
          'block type "comparison" requires "left" and "right" objects');
      }
    }
    if (t === 'image') {
      if (typeof block.src !== 'string' || !block.src) {
        deckError(path + '.src', 'image block requires a string "src"');
      }
    }
    if (t === 'code') {
      if (typeof block.source !== 'string') {
        deckError(path + '.source', 'code block requires "source"');
      }
    }
    if (t === 'diagram') {
      if (typeof block.source !== 'string') {
        deckError(path + '.source', 'diagram block requires "source"');
      }
    }
    if (t === 'chart') {
      if (block.chartType === undefined) {
        deckError(path + '.chartType', 'chart block requires "chartType"');
      }
    }
  }

  // ── validateHeadline — the assertion-evidence soft check ───────────
  //
  // slide-spec.md §10.1: a slide heading should be a complete declarative
  // sentence, not a verbless label. Heuristic — (a) ≥ MIN_HEADLINE_WORDS
  // words, AND (b) contains a verb signal OR a digit-with-unit (a stat
  // headline reads as a claim). Returns {ok, reason}. NEVER throws — a
  // false positive must not block a deck; the caller surfaces a warning.
  function validateHeadline(text) {
    if (typeof text !== 'string' || !text.trim()) {
      return { ok: false, reason: 'empty headline' };
    }
    var words = text.trim().split(/\s+/);
    if (words.length < MIN_HEADLINE_WORDS) {
      return {
        ok: false,
        reason: 'headline is ' + words.length + ' words (< '
          + MIN_HEADLINE_WORDS + ') — write a full sentence'
      };
    }
    // A digit anywhere reads as a stat-driven claim ("38% faster").
    if (/\d/.test(text)) {
      return { ok: true, reason: '' };
    }
    // Verb signal: an explicit verb from the list, OR a word with
    // -ed / -ing / a plural-s morphology (a rough finite-verb tell).
    for (var i = 0; i < words.length; i++) {
      var w = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (!w) { continue; }
      if (inList(w, VERB_SIGNALS)) {
        return { ok: true, reason: '' };
      }
      if (w.length > 3 && (/(ed|ing)$/.test(w)
          || (/s$/.test(w) && !/(ss|us|is)$/.test(w)))) {
        return { ok: true, reason: '' };
      }
    }
    return {
      ok: false,
      reason: 'no verb detected — headline reads as a label, not a '
        + 'claim; rewrite as a declarative sentence'
    };
  }

  // ── block renderers ────────────────────────────────────────────────
  //
  // One `renderBlock(doc, block, ctx)` dispatcher. `ctx` collects soft
  // warnings (headline rule). Every rendered element gets the `.vsd-block`
  // class so the entrance-mood CSS targets it. An unknown type cannot
  // reach here — parseDeck already threw — but renderBlock re-guards as a
  // defence-in-depth fail-fast.

  function el(doc, tag, cls) {
    var node = doc.createElement(tag);
    if (cls) { node.className = cls; }
    return node;
  }

  // bullets item → <li>. An item is a string or {text, sub?}.
  function renderBulletItem(doc, item) {
    var li = el(doc, 'li', 'vsd-bullet');
    if (isPlainObject(item)) {
      li.appendChild(doc.createTextNode(String(item.text)));
      if (item.sub !== undefined) {
        var sub = el(doc, 'span', 'vsd-bullet-sub');
        sub.appendChild(doc.createTextNode(String(item.sub)));
        li.appendChild(sub);
      }
    } else {
      li.appendChild(doc.createTextNode(String(item)));
    }
    return li;
  }

  function renderComparisonPane(doc, pane) {
    var box = el(doc, 'div', 'vsd-compare-pane');
    var title = el(doc, 'h3', 'vsd-compare-title');
    title.appendChild(doc.createTextNode(String(pane.title || '')));
    box.appendChild(title);
    var ul = el(doc, 'ul', 'vsd-bullets');
    var items = pane.items || [];
    for (var i = 0; i < items.length; i++) {
      ul.appendChild(renderBulletItem(doc, items[i]));
    }
    box.appendChild(ul);
    return box;
  }

  // Render a delegated block (code / diagram / chart). The slide module
  // OWNS the `renderInto(el, spec)` calling convention; if the sibling
  // module is absent, throw a CLEAR error naming it — never a blank
  // placeholder (slide-spec.md §5.4, §12.2).
  function renderDelegated(doc, block, type) {
    var meta = DELEGATED_BLOCKS[type];
    var host = el(doc, 'div', 'vsd-delegate');
    host.setAttribute('data-vsd-delegate', type);
    var mod = (typeof window !== 'undefined') ? window[meta.global] : null;
    if (!mod || typeof mod.renderInto !== 'function') {
      throw new Error('amvcp-slide: block type "' + type
        + '" needs the ' + meta.label + ' renderer module, but '
        + 'window.' + meta.global + '.renderInto is not available. '
        + 'Include that module\'s <script> in the deck.');
    }
    var spec;
    if (type === 'code') {
      spec = { lang: block.lang, source: block.source };
    } else if (type === 'diagram') {
      spec = { notation: block.notation, source: block.source };
    } else {
      spec = { chartType: block.chartType, data: block.data };
    }
    mod.renderInto(host, spec);
    return host;
  }

  function renderBlock(doc, block, ctx) {
    var t = block.type;
    var node;
    if (t === 'eyebrow') {
      node = el(doc, 'p', 'vsd-eyebrow');
      node.appendChild(doc.createTextNode(String(block.text)));
    } else if (t === 'heading') {
      var lvl = block.level === 2 ? 2 : 1;
      node = el(doc, lvl === 2 ? 'h2' : 'h1',
        'vsd-heading' + (lvl === 2 ? ' vsd-heading--2' : ''));
      node.appendChild(doc.createTextNode(String(block.text)));
      // Assertion-evidence soft check — collect, never throw.
      var verdict = validateHeadline(String(block.text));
      if (!verdict.ok && ctx) {
        ctx.headlineWarnings.push({
          slide: ctx.slideIndex,
          text: String(block.text),
          reason: verdict.reason
        });
        node.setAttribute('data-vsd-headline-warn', verdict.reason);
      }
    } else if (t === 'text') {
      node = el(doc, 'p', 'vsd-text');
      node.appendChild(doc.createTextNode(String(block.text)));
      if (ctx) { ctx.bodyWords += String(block.text).split(/\s+/).length; }
    } else if (t === 'bullets') {
      node = el(doc, 'ul', 'vsd-bullets');
      for (var i = 0; i < block.items.length; i++) {
        node.appendChild(renderBulletItem(doc, block.items[i]));
      }
      if (ctx) { ctx.bulletCount += block.items.length; }
    } else if (t === 'metric') {
      node = el(doc, 'div', 'vsd-metric');
      var val = el(doc, 'span', 'vsd-metric-value');
      val.appendChild(doc.createTextNode(String(block.value)));
      node.appendChild(val);
      var lab = el(doc, 'span', 'vsd-metric-label');
      lab.appendChild(doc.createTextNode(String(block.label)));
      node.appendChild(lab);
      if (block.delta !== undefined) {
        var d = el(doc, 'span', 'vsd-metric-delta');
        d.appendChild(doc.createTextNode(String(block.delta)));
        node.appendChild(d);
      }
    } else if (t === 'callout') {
      node = el(doc, 'div', 'vsd-callout');
      node.setAttribute('data-vsd-variant',
        CALLOUT_VARIANTS[block.variant] === 'info'
          ? 'info' : block.variant);
      node.appendChild(doc.createTextNode(String(block.text)));
    } else if (t === 'quote') {
      node = el(doc, 'blockquote', 'vsd-quote');
      node.appendChild(doc.createTextNode(String(block.text)));
      if (block.cite !== undefined) {
        var cite = el(doc, 'cite', 'vsd-quote-cite');
        cite.appendChild(doc.createTextNode(String(block.cite)));
        node.appendChild(cite);
      }
    } else if (t === 'comparison') {
      node = el(doc, 'div', 'vsd-comparison');
      node.appendChild(renderComparisonPane(doc, block.left));
      node.appendChild(renderComparisonPane(doc, block.right));
    } else if (t === 'image') {
      node = el(doc, 'img', 'vsd-image'
        + (block.fit === 'contain' ? ' vsd-image--contain'
          : ' vsd-image--cover'));
      node.setAttribute('src', String(block.src));
      node.setAttribute('alt', String(block.alt || ''));
    } else if (t === 'spacer') {
      node = el(doc, 'div', 'vsd-spacer');
      if (block.size !== undefined) {
        node.style.minHeight = 'var(--vc-space-' + String(block.size)
          + ', 24px)';
      }
    } else if (t === 'code' || t === 'diagram' || t === 'chart') {
      node = renderDelegated(doc, block, t);
    } else {
      // Defence-in-depth: parseDeck already rejects unknown types.
      throw new Error('amvcp-slide: renderBlock: unknown type "' + t
        + '"');
    }
    // Tag every block element so the entrance-mood CSS targets it, and
    // index it so the --vsd-index stagger works past 8 children
    // (slide-spec.md §9.3 — NOT :nth-child, which caps at 8).
    if (node.classList) { node.classList.add('vsd-block'); }
    return node;
  }

  // ── renderSlide / renderDeck ───────────────────────────────────────

  // Build one <section class="vsd-slide">. `i` is the slide index.
  function renderSlide(doc, slide, i, deck) {
    var section = el(doc, 'section',
      'vsd-slide vsd-layout-' + slide.layout);
    // Selection-wiring attributes — the runtime's scanner picks these up
    // unchanged so a deck stays click-selectable / commentable.
    //
    // Phase 2.5 (TRDD-352ef46a) selection/comment contract conformance:
    //   1. data-ve-id + data-ve-type identify the atom (slide). The
    //      runtime's universal click handler `toggleElementSelection`
    //      toggles `data-ve-selected="1"` on click.
    //   2. tabindex="0" makes the slide a real focus target so the
    //      runtime's `:focus-visible` selection ring fires for keyboard
    //      users (without tabindex the keyboard branch of the 3-state
    //      visual model is dead).
    //   3. role="group" + aria-roledescription="slide" tell screen
    //      readers that this section is one logical slide. aria-label
    //      carries "Slide N of M" so the focus announcement is clear.
    var slideId = 's' + (i + 1);
    section.setAttribute('data-ve-id', slideId);
    section.setAttribute('data-ve-type', 'slide');
    section.setAttribute('data-ve-label', 'Slide ' + (i + 1));
    section.setAttribute('data-vsd-layout', slide.layout);
    section.setAttribute('data-vsd-mood', deck.mood);
    section.setAttribute('tabindex', '0');
    section.setAttribute('role', 'group');
    section.setAttribute('aria-roledescription', 'slide');
    section.setAttribute('aria-label',
      'Slide ' + (i + 1) + ' of ' + deck.slides.length);
    if (i !== 0) { section.setAttribute('hidden', 'hidden'); }
    if (slide.numeral !== undefined) {
      section.setAttribute('data-vsd-numeral', String(slide.numeral));
    }
    if (slide.notes !== undefined) {
      section.setAttribute('data-vsd-notes', String(slide.notes));
    }

    var ctx = {
      slideIndex: i,
      headlineWarnings: deck._ctx.headlineWarnings,
      bulletCount: 0,
      bodyWords: 0
    };

    // The bento layout splits heading-then-cards; everything else is a
    // flat block list (the metrics row + timeline get a wrapping
    // element so their CSS grid applies).
    if (slide.layout === 'bento') {
      renderBentoSlide(doc, section, slide, ctx);
    } else if (slide.layout === 'metrics') {
      renderMetricsSlide(doc, section, slide, ctx);
    } else {
      var blocks = slide.blocks;
      var blockIndex = 0;
      for (var b = 0; b < blocks.length; b++) {
        var node = renderBlock(doc, blocks[b], ctx);
        node.style.setProperty('--vsd-index', String(blockIndex));
        section.appendChild(node);
        blockIndex++;
      }
    }

    // Content-density guard (slide-spec.md §10.2) — a soft warning, no
    // scrollbar. Layout-time overflow is also checked post-mount in
    // measureOverflow(); this is the authoring-budget pre-check.
    if (ctx.bulletCount > MAX_BULLETS) {
      section.setAttribute('data-vsd-overflow',
        ctx.bulletCount + ' bullets (> ' + MAX_BULLETS + ')');
      deck._ctx.densityWarnings.push({
        slide: i, reason: ctx.bulletCount + ' bullets'
      });
    } else if (ctx.bodyWords > MAX_BODY_WORDS) {
      section.setAttribute('data-vsd-overflow',
        ctx.bodyWords + ' body words (> ' + MAX_BODY_WORDS + ')');
      deck._ctx.densityWarnings.push({
        slide: i, reason: ctx.bodyWords + ' body words'
      });
    }
    return section;
  }

  // bento: first block is the heading, the rest are cards in a grid.
  function renderBentoSlide(doc, section, slide, ctx) {
    var blocks = slide.blocks;
    var grid = el(doc, 'div', 'vsd-bento-grid');
    grid.setAttribute('data-vsd-grid', slide.grid || 'gallery');
    var blockIndex = 0;
    for (var b = 0; b < blocks.length; b++) {
      if (blocks[b].type === 'heading' && b === 0) {
        var head = renderBlock(doc, blocks[b], ctx);
        head.style.setProperty('--vsd-index', String(blockIndex));
        section.appendChild(head);
        blockIndex++;
        continue;
      }
      var card = el(doc, 'div', 'vsd-bento-card vsd-block');
      card.style.setProperty('--vsd-index', String(blockIndex));
      card.appendChild(renderBlock(doc, blocks[b], ctx));
      grid.appendChild(card);
      blockIndex++;
    }
    section.appendChild(grid);
  }

  // metrics: heading then a metrics row (CSS grid spreads the stats).
  function renderMetricsSlide(doc, section, slide, ctx) {
    var blocks = slide.blocks;
    var row = el(doc, 'div', 'vsd-metrics-row vsd-block');
    var blockIndex = 0;
    var rowAttached = false;
    for (var b = 0; b < blocks.length; b++) {
      var node = renderBlock(doc, blocks[b], ctx);
      node.style.setProperty('--vsd-index', String(blockIndex));
      if (blocks[b].type === 'metric') {
        row.appendChild(node);
        if (!rowAttached) {
          row.style.setProperty('--vsd-index', String(blockIndex));
          rowAttached = true;
        }
      } else {
        section.appendChild(node);
      }
      blockIndex++;
    }
    if (rowAttached) { section.appendChild(row); }
  }

  // renderDeck — build the full deck DOM into `mountEl` (a .vsd-viewport
  // the renderer scaffolds, or a host the caller supplies). Returns the
  // built `.vsd-viewport` element. Throws on any structural error.
  function renderDeck(deckInput, mountEl) {
    var doc = (mountEl && mountEl.ownerDocument)
      || (typeof document !== 'undefined' ? document : null);
    if (!doc) {
      throw new Error('amvcp-slide: renderDeck needs a document');
    }
    var deck = parseDeck(deckInput);
    // Per-render context — collects the soft warnings.
    deck._ctx = { headlineWarnings: [], densityWarnings: [] };

    var isPoster = deck.kind === 'poster';
    var stageDim = isPoster ? POSTER_STAGE : ASPECTS[deck.aspect];

    // Scaffold: viewport > stage > slides + nav chrome.
    var viewport = el(doc, 'div', 'vsd-viewport');
    viewport.setAttribute('data-vsd-fit', deck.fit);
    viewport.setAttribute('data-vsd-kind', deck.kind);

    var stage = el(doc, 'div', 'vsd-stage');
    stage.setAttribute('data-vsd-transition', deck.transition);
    stage.style.width = stageDim.w + 'px';
    stage.style.height = stageDim.h + 'px';

    for (var i = 0; i < deck.slides.length; i++) {
      stage.appendChild(renderSlide(doc, deck.slides[i], i, deck));
    }
    viewport.appendChild(stage);

    // Navigation chrome — omitted for a single-slide poster.
    if (!isPoster && deck.slides.length > 1) {
      viewport.appendChild(buildNavChrome(doc, deck));
    }

    // Surface the collected soft warnings (slide-spec.md §10.1-10.2):
    // a console.warn AND a non-print data attribute the test reads.
    if (deck._ctx.headlineWarnings.length && typeof console !== 'undefined'
        && console.warn) {
      for (var h = 0; h < deck._ctx.headlineWarnings.length; h++) {
        var hw = deck._ctx.headlineWarnings[h];
        console.warn('amvcp-slide: slide ' + (hw.slide + 1)
          + ' headline weak — "' + hw.text + '" — ' + hw.reason);
      }
    }

    // Mount: replace mountEl's children with the viewport, or return it.
    if (mountEl && mountEl !== viewport) {
      while (mountEl.firstChild) {
        mountEl.removeChild(mountEl.firstChild);
      }
      mountEl.appendChild(viewport);
    }
    // Stash the parsed deck on the viewport so createDeck can read it.
    viewport.__vsdDeck = deck;
    return viewport;
  }

  // Build the dots + counter + progress chrome.
  function buildNavChrome(doc, deck) {
    var frag = doc.createDocumentFragment();
    var nav = el(doc, 'nav', 'vsd-nav');
    nav.setAttribute('aria-label', 'Slide navigation');
    for (var i = 0; i < deck.slides.length; i++) {
      var dot = el(doc, 'button', 'vsd-dot');
      dot.setAttribute('type', 'button');
      dot.setAttribute('data-vsd-goto', String(i));
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) { dot.setAttribute('aria-current', 'true'); }
      nav.appendChild(dot);
    }
    frag.appendChild(nav);

    var counter = el(doc, 'div', 'vsd-counter');
    counter.setAttribute('aria-live', 'polite');
    counter.appendChild(doc.createTextNode('1 / ' + deck.slides.length));
    frag.appendChild(counter);

    var progress = el(doc, 'div', 'vsd-progress');
    progress.setAttribute('role', 'presentation');
    var fill = el(doc, 'div', 'vsd-progress-fill');
    progress.appendChild(fill);
    frag.appendChild(progress);
    return frag;
  }

  // ── fitStage — the letterbox scale ─────────────────────────────────
  //
  // slide-spec.md §3.3: scale a fixed-pixel stage to fill the viewport,
  // letterboxed, with NO media queries and NO inner scroll. The poster
  // kind caps the ratio at 1 (never upscales past 1:1, slide-spec §3.5);
  // a deck does NOT cap — a projector should scale a 1920 stage up.
  function fitStage(viewport) {
    if (!viewport || !viewport.querySelector) { return; }
    if (viewport.getAttribute('data-vsd-fit') === 'responsive') {
      return;                                // responsive: no transform
    }
    var stage = viewport.querySelector('.vsd-stage');
    if (!stage) { return; }
    var stageW = parseFloat(stage.style.width) || ASPECTS['16:9'].w;
    var stageH = parseFloat(stage.style.height) || ASPECTS['16:9'].h;
    var vw = viewport.clientWidth;
    var vh = viewport.clientHeight;
    if (!vw || !vh) { return; }
    var ratio = Math.min(vw / stageW, vh / stageH);
    if (viewport.getAttribute('data-vsd-kind') === 'poster') {
      ratio = Math.min(ratio, 1);            // poster: cap at 1:1
    }
    stage.style.transform = 'scale(' + ratio + ')';
    stage.style.transformOrigin = 'top left';
    // Centre the letterboxed stage inside the viewport.
    stage.style.left = ((vw - stageW * ratio) / 2) + 'px';
    stage.style.top = ((vh - stageH * ratio) / 2) + 'px';
  }

  // ── Deck — the navigation controller ───────────────────────────────
  //
  // ONE source of truth for "which slide is current": `Deck._current`.
  // Nothing reads the current index by scraping the DOM; subscribers
  // listen for the `vsd:slidechange` event (slide-spec.md §4.5).
  class Deck {
    constructor(viewport) {
      this.viewport = viewport;
      this.deck = viewport.__vsdDeck || null;
      this.slides = viewport.querySelectorAll('.vsd-slide');
      this.stage = viewport.querySelector('.vsd-stage');
      this._current = 0;
      // Per-deck localStorage namespace — an explicit JSON id, else a
      // hash of the title, so two decks in two tabs do not collide.
      var d = this.deck;
      this.deckId = (d && d.id) ? String(d.id)
        : 'deck-' + hashString(d && d.title ? d.title : 'untitled');
      this.loop = !!(d && d.loop);
    }

    count() { return this.slides.length; }
    current() { return this._current; }

    // go(index) — clamp, swap, persist, fire the event. The single
    // mutation path for "current slide".
    go(index) {
      var n = this.slides.length;
      if (!n) { return; }
      var target = index;
      if (this.loop) {
        target = ((target % n) + n) % n;       // wrap
      } else {
        target = Math.max(0, Math.min(n - 1, target));
      }
      if (target === this._current
          && !this.slides[target].hasAttribute('hidden')) {
        return;                                // already there
      }
      var prev = this._current;
      var outgoing = this.slides[prev];
      var incoming = this.slides[target];

      // Transition: cross-class, then hide the leaver after the duration.
      if (outgoing !== incoming) {
        outgoing.classList.add('vsd-leaving');
        incoming.classList.add('vsd-entering');
        incoming.removeAttribute('hidden');
        var dur = readDurationMs('--vc-duration-normal', 320);
        window.setTimeout(function () {
          outgoing.setAttribute('hidden', 'hidden');
          outgoing.classList.remove('vsd-leaving', 'vsd-revealed');
          incoming.classList.remove('vsd-entering');
          // Trigger the entrance: add .vsd-revealed on the next frame so
          // the CSS transition runs from the start state.
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function () {
              incoming.classList.add('vsd-revealed');
            });
          } else {
            incoming.classList.add('vsd-revealed');
          }
        }, dur);
      } else {
        incoming.removeAttribute('hidden');
        incoming.classList.add('vsd-revealed');
      }

      this._current = target;
      this._syncChrome();
      this._persist();
      this._emitChange();
      return target;
    }

    next() { return this.go(this._current + 1); }
    prev() { return this.go(this._current - 1); }

    // Update dots / counter / progress to match _current.
    _syncChrome() {
      var dots = this.viewport.querySelectorAll('.vsd-dot');
      for (var i = 0; i < dots.length; i++) {
        if (i === this._current) {
          dots[i].setAttribute('aria-current', 'true');
        } else {
          dots[i].removeAttribute('aria-current');
        }
      }
      var counter = this.viewport.querySelector('.vsd-counter');
      if (counter) {
        counter.textContent = (this._current + 1) + ' / '
          + this.slides.length;
      }
      var fill = this.viewport.querySelector('.vsd-progress-fill');
      if (fill) {
        var pct = this.slides.length > 1
          ? (this._current / (this.slides.length - 1)) * 100 : 100;
        fill.style.width = pct + '%';
      }
    }

    // Persist the position — namespaced by deckId (slide-spec.md §4.3).
    _persist() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('vsd:' + this.deckId + ':pos',
            String(this._current));
        }
      } catch (e) { /* storage disabled — non-fatal */ }
    }

    // Read the persisted position; clamp to range; default 0.
    _restore() {
      var pos = 0;
      try {
        if (typeof localStorage !== 'undefined') {
          var raw = localStorage.getItem('vsd:' + this.deckId + ':pos');
          var n = parseInt(raw, 10);
          if (isFinite(n) && n >= 0 && n < this.slides.length) {
            pos = n;
          }
        }
      } catch (e) { /* storage disabled */ }
      return pos;
    }

    // Fire vsd:slidechange — the single "current slide" event bus.
    _emitChange() {
      if (typeof document === 'undefined' || !document.dispatchEvent) {
        return;
      }
      var detail = {
        index: this._current,
        total: this.slides.length,
        slide: this.slides[this._current],
        deckId: this.deckId
      };
      // CustomEvent has been universally supported for years; the legacy
      // initCustomEvent fallback is deprecated. Construct directly.
      var ev = new CustomEvent('vsd:slidechange', {
        bubbles: false,
        cancelable: false,
        detail: detail
      });
      document.dispatchEvent(ev);
    }
  }

  // A tiny deterministic string hash (djb2) — for the localStorage key.
  function hashString(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  }

  // Read a `--vc-duration-*` token as a number of ms; fall back when the
  // token is absent — keeps the module defensive.
  function readDurationMs(name, fallbackMs) {
    var raw = readToken(name, '');
    if (!raw) { return fallbackMs; }
    var isSeconds = /s\s*$/.test(raw) && !/ms\s*$/.test(raw);
    var num = parseFloat(raw);
    if (!isFinite(num)) { return fallbackMs; }
    return isSeconds ? num * 1000 : num;
  }

  // ── createDeck — wire navigation, return a Deck ────────────────────
  //
  // Binds keyboard, touch-swipe, dot-click, fullscreen, and theme-cycle.
  // Auto-selects responsive fit on a narrow viewport (a 1920px stage
  // scaled to a phone is unreadable — slide-spec.md §3.3 Mode B).
  function createDeck(viewport) {
    if (!viewport) {
      throw new Error('amvcp-slide: createDeck needs a .vsd-viewport');
    }
    // Auto-responsive on a narrow viewport.
    if (typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(max-width: 640px)').matches) {
      viewport.setAttribute('data-vsd-fit', 'responsive');
    }

    var deck = new Deck(viewport);
    deck._current = deck._restore();

    // Show the restored slide (others stay hidden); reveal it.
    for (var i = 0; i < deck.slides.length; i++) {
      if (i === deck._current) {
        deck.slides[i].removeAttribute('hidden');
        deck.slides[i].classList.add('vsd-revealed');
      } else {
        deck.slides[i].setAttribute('hidden', 'hidden');
        deck.slides[i].classList.remove('vsd-revealed');
      }
    }
    deck._syncChrome();

    // Initial fit + a ResizeObserver-coalesced refit.
    fitStage(viewport);
    wireResize(viewport);
    wireKeyboard(deck);
    wireTouch(deck);
    wireDotClicks(deck);

    // Phase 2.5 (TRDD-352ef46a) NEW USER REQ #10 — every visual atom
    // gets a 3-radio Skip/Approve/Deny mini-pill, INDEPENDENT of
    // selection state. The runtime ships the helper as
    // `window.amvcpRuntime.attachDecisionMini(atomEl, atomId)`. We call
    // it for every .vsd-slide here, AFTER the deck is fully wired but
    // BEFORE the first slidechange. The defensive guard handles the
    // concurrent-shipment of the runtime helper: when the runtime is
    // not loaded (e.g. the standalone slide-fixture without runtime),
    // the call is a no-op and the deck still renders correctly.
    attachDecisionMinisToSlides(deck);

    // Fire the first slidechange so subscribers (entrance, presenter)
    // see the boot slide.
    deck._emitChange();
    return deck;
  }

  // Walk every .vsd-slide and ask the runtime to attach a decision-mini
  // pill (Skip / Approve / Deny) to it. The runtime helper is the single
  // source of truth for the pill's HTML, CSS, persistence, and click
  // wiring; this function only DECIDES which DOM elements get one. The
  // defensive guard is required by spec — the runtime helper ships in a
  // sibling Phase 2.5 build (p25-runtime-text-comment), so the helper
  // may be absent at the moment this module loads.
  function attachDecisionMinisToSlides(deck) {
    if (typeof window === 'undefined') { return; }
    var runtime = window.amvcpRuntime;
    if (!runtime || typeof runtime.attachDecisionMini !== 'function') {
      // Runtime helper not available — defensive no-op. The deck still
      // renders; when the runtime later loads, its `initReportMode()`
      // walks the existing atoms and stamps them.
      return;
    }
    for (var i = 0; i < deck.slides.length; i++) {
      var slide = deck.slides[i];
      var slideId = slide.getAttribute('data-ve-id');
      if (!slideId) { continue; }
      try {
        runtime.attachDecisionMini(slide, slideId);
      } catch (e) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('amvcp-slide: attachDecisionMini failed for '
            + slideId + ' — ' + (e && e.message || e));
        }
      }
    }
  }

  // ResizeObserver on the VIEWPORT (not window) — catches container
  // resizes a bare `resize` listener misses (devtools docking, etc.).
  // rAF-coalesced so a drag-resize fires fitStage once per frame.
  function wireResize(viewport) {
    var pending = false;
    function refit() {
      pending = false;
      fitStage(viewport);
    }
    function schedule() {
      if (pending) { return; }
      pending = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(refit);
      } else {
        refit();
      }
    }
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(schedule);
      ro.observe(viewport);
      viewport.__vsdResizeObserver = ro;
    }
    // Always also bind window resize — RO is the primary, this is the
    // belt-and-braces for engines without RO.
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', schedule);
    }
  }

  // Keyboard: arrows / space / page / home / end / f (fullscreen).
  function wireKeyboard(deck) {
    if (typeof document === 'undefined') { return; }
    document.addEventListener('keydown', function (e) {
      // Skip when the user is typing in an input / contenteditable.
      var tgt = e.target;
      if (tgt && (tgt.isContentEditable
          || tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA'
          || tgt.tagName === 'SELECT')) {
        return;
      }
      var key = e.key;
      // Case-insensitive single-letter compare — Shift+T arrives as the
      // uppercase 'T' (slide-spec.md §4.4 — the KeyboardEvent.key
      // case-shift bug).
      var lower = (typeof key === 'string') ? key.toLowerCase() : '';
      if (key === 'ArrowRight' || key === 'ArrowDown' || key === ' '
          || key === 'Spacebar' || key === 'PageDown') {
        e.preventDefault();
        deck.next();
      } else if (key === 'ArrowLeft' || key === 'ArrowUp'
          || key === 'PageUp') {
        e.preventDefault();
        deck.prev();
      } else if (key === 'Home') {
        e.preventDefault();
        deck.go(0);
      } else if (key === 'End') {
        e.preventDefault();
        deck.go(deck.slides.length - 1);
      } else if (lower === 'f') {
        toggleFullscreen(deck.viewport);
      }
    });
  }

  // Touch swipe: HORIZONTAL (slides advance horizontally on a stage).
  function wireTouch(deck) {
    var vp = deck.viewport;
    if (!vp || !vp.addEventListener) { return; }
    var startX = 0;
    var startY = 0;
    vp.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches.length) { return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    vp.addEventListener('touchend', function (e) {
      if (!e.changedTouches || !e.changedTouches.length) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) { return; }
      if (Math.abs(dx) <= Math.abs(dy)) { return; }  // vertical-dominant
      if (dx < 0) { deck.next(); } else { deck.prev(); }
    }, { passive: true });
  }

  // Dot clicks → go(thatIndex).
  function wireDotClicks(deck) {
    var dots = deck.viewport.querySelectorAll('.vsd-dot');
    for (var i = 0; i < dots.length; i++) {
      (function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(dot.getAttribute('data-vsd-goto'), 10);
          if (isFinite(idx)) { deck.go(idx); }
        });
      })(dots[i]);
    }
  }

  // Fullscreen toggle on the viewport (Escape exits — browser-native).
  function toggleFullscreen(viewport) {
    if (typeof document === 'undefined') { return; }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) { document.exitFullscreen(); }
    } else if (viewport.requestFullscreen) {
      viewport.requestFullscreen();
    }
  }

  // ── refresh — re-fit + re-sync after dynamic DOM changes ───────────
  function refresh(viewport) {
    if (!viewport) { return; }
    fitStage(viewport);
  }

  // ── boot — full self-init from an embedded deck ────────────────────
  //
  // Reads the embedded deck JSON <script type="application/json"
  // id="vsd-deck">, optionally applies the embedded preset DESIGN.md via
  // the Phase-1 engine, injects the CSS, renders the deck, wires nav.
  // Used by a self-contained emitted deck page. A page with no embedded
  // deck script is a no-op (boot is safe to call unconditionally).
  function boot(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) { return null; }
    var deckScript = d.getElementById(DECK_SCRIPT_ID);
    if (!deckScript) { return null; }       // no deck on this page

    // Optionally theme via the embedded preset DESIGN.md + the engine.
    // The slide module does NOT re-implement token resolution — it calls
    // window.amvcpDesignMd (slide-spec.md §7.5). Absent engine → the
    // deck still renders, themed by the CSS `--vc-*` fallbacks.
    var presetScript = d.getElementById(PRESET_SCRIPT_ID);
    if (presetScript && typeof window !== 'undefined'
        && window.amvcpDesignMd
        && typeof window.amvcpDesignMd.parseDesignMd === 'function') {
      try {
        var raw = presetScript.textContent || '';
        // The engine expects fenced frontmatter; add fences if absent.
        if (raw.indexOf('---') !== 0) {
          raw = '---\n' + raw + '\n---\n';
        }
        var parsed = window.amvcpDesignMd.parseDesignMd(raw);
        if (parsed.ok) {
          var theme = (parsed.designmd.meta
            && parsed.designmd.meta.default_theme) || 'light';
          d.documentElement.setAttribute('data-ve-theme', theme);
          var map = window.amvcpDesignMd.resolveTokens(
            parsed.designmd, theme);
          window.amvcpDesignMd.applyTokens(map, d.documentElement);
        } else if (typeof console !== 'undefined' && console.warn) {
          console.warn('amvcp-slide: preset DESIGN.md did not parse — '
            + parsed.errors.join('; '));
        }
      } catch (e) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('amvcp-slide: preset apply failed — '
            + (e && e.message || e));
        }
      }
    }

    injectSlideCSS(d);
    var deckJson = deckScript.textContent || '';
    var viewport = renderDeck(deckJson, d.body);
    return createDeck(viewport);
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    injectSlideCSS: injectSlideCSS,
    parseDeck: parseDeck,
    renderDeck: renderDeck,
    createDeck: createDeck,
    fitStage: fitStage,
    validateHeadline: validateHeadline,
    boot: boot,
    refresh: refresh,
    Deck: Deck,
    // Exposed for the dev-browser test (mirrors the runtime's pattern).
    _cssText: CSS_TEXT,
    _constants: {
      ASPECTS: ASPECTS,
      POSTER_STAGE: POSTER_STAGE,
      LAYOUTS: LAYOUTS,
      BENTO_GRIDS: BENTO_GRIDS,
      MOODS: MOODS,
      TRANSITIONS: TRANSITIONS,
      MAX_BULLETS: MAX_BULLETS,
      MAX_BODY_WORDS: MAX_BODY_WORDS,
      MIN_HEADLINE_WORDS: MIN_HEADLINE_WORDS
    }
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpSlideDeck = _api;
    // Test hook — a re-init handle so the dev-browser suite can drive
    // the module deterministically (mirrors window.__veAnimation).
    window.__veSlideDeck = {
      injectSlideCSS: injectSlideCSS,
      parseDeck: parseDeck,
      renderDeck: renderDeck,
      createDeck: createDeck,
      fitStage: fitStage,
      validateHeadline: validateHeadline,
      boot: boot
    };

    // Self-init on DOMContentLoaded — UNLESS the host opted out via
    // window.__vsdManualInit (the runtime / a test fixture sets this so
    // it controls the engine → tokens → slide-render ordering).
    if (!window.__vsdManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          boot(document);
        });
      } else {
        boot(document);
      }
    }
  }

  // Node export — for the test harness / sanity checks.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
