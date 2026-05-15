/*!
 * ai-maestro-visual-communicator-plugin — report-doc runtime module.
 *
 * Phase 2 (visualizing backlog §9 + §14, TRDD-352ef46a, Build #13): the
 * plugin's NON-ELEMENT, cross-cutting technique. It does two things no
 * element skill does:
 *
 * Phase 2.5 selection/comment contract conformance note (TRDD-352ef46a):
 *   This module is the CROSS-CUTTING QA-gate technique. It does NOT add
 *   its own selection atoms (slides, code-lines, paragraphs, list items
 *   are owned by the per-kind modules: amvcp-slide.js, etc.). The
 *   doc-shell elements it ships (.vc-doc article, .vc-toc nav,
 *   .vc-callout aside, .vc-rubric table, .vc-pullquote blockquote,
 *   .vc-metric div) are INERT under the runtime's selection layer —
 *   they carry NO `data-ve-id` and NO `data-ve-comment-id`, so the
 *   runtime's universal click handler ignores them. The contract is
 *   preserved by ABSENCE: if a downstream skill needs the doc shell's
 *   prose to be selectable it adds the atom markup itself; the doc
 *   shell stays the inert wrapper. The QA gates also do NOT inject any
 *   selection-related CSS rules (no `outline`, no `box-shadow`, no
 *   `[data-ve-*]` selectors), so they cannot conflict with the
 *   runtime's universal selection ring.
 *
 *   Because report-doc has NO atoms of its own, NEW USER REQ #10 (the
 *   per-atom Skip/Approve/Deny mini-pill) does not apply here — there
 *   is nothing to attach a pill to. If a downstream skill wraps doc
 *   sections as atoms, that downstream skill calls
 *   `window.amvcpRuntime.attachDecisionMini` itself.
 *
 *   The `@media print` block at the bottom DOES reach into the runtime's
 *   namespace by hiding `.ve-comment-modal`, `.ve-decision`,
 *   `.ve-finding-thread`, `.ve-report-banner` — that is INTENTIONAL: a
 *   printed page should not show interactive overlays. This is the only
 *   place the report-doc CSS touches a `.ve-*` class, and it is hide-only.
 *
 *   1. SCAFFOLD long-form, mostly-static documents — executive summaries,
 *      technical reports, case studies, proposals, whitepapers,
 *      design-system docs. This module supplies the in-page side of that:
 *      the doc-shell / template / callout / rubric / print / TOC CSS, and
 *      the TOC scroll-spy runtime.
 *   2. VERIFY the output of every other technique — the Output QA-pipeline
 *      gate runner (window.amvcpReportDoc.runGates). It closes the
 *      plugin's "rules stated but never verified" loop: no-nested-
 *      scrollbars, WCAG AA contrast, prefers-reduced-motion, print-CSS
 *      presence, semantic-HTML, banned-color / banned-font scan.
 *
 * Design contract (report-doc-spec.md §2, §15):
 *   - Dependency-free. Pure CSS + vanilla ES5-style JS. No build step,
 *     no CDN, no npm runtime dependency.
 *   - Theme-driven. Every color/size reads a `--vc-*` token resolved by
 *     the DESIGN.md engine (amvcp-designmd.js). Every token reference
 *     carries a hardcoded canonical fallback so the module is fully
 *     defensive — it renders and verifies correctly even with no engine
 *     present (cross-file wiring is deferred to a later integration
 *     pass; this module works standalone today).
 *   - Light + dark. No `@media (prefers-color-scheme)` rule, no
 *     `:root[data-ve-theme]` override — the engine swaps the `--vc-*`
 *     token VALUES underneath, so every callout / rubric / TOC recolors
 *     automatically on theme swap. The one exception is the `@media
 *     print` block, which deliberately overrides the color tokens to a
 *     print-safe ink-on-paper set.
 *   - No nested scrollbars (~/.claude/rules/no-nested-scrollbars.md).
 *     The doc shell never sets overflow:auto/scroll/max-height on `pre`,
 *     tables, figures or any wrapper — wide content extends the page.
 *     QA Gate 1 enforces this on the output of every technique.
 *   - Zero hardcoded colors/sizes. No hex / rgb() / px design value
 *     except inside a `var(--vc-…, <fallback>)` fallback slot. `1px`
 *     hairlines and `color-mix` ratio percentages are structural
 *     constants (the runtime treats them the same). The only sanctioned
 *     hex literals are the 4 print-device colors in the single
 *     `@media print` block (paper white / ink black / two greys).
 *   - Fail-fast. No silent fallbacks. The ONE sanctioned fallback is the
 *     inline banned-list copy used when the design-tokens skill is
 *     absent — and it emits a loud console.warn (spec §4.2).
 *   - RTL-correct. All layout CSS uses logical properties
 *     (margin-inline, padding-block, border-inline-start, text-align
 *     start/end). No left/right/margin-left anywhere.
 *
 * Dual export (matches scripts/amvcp-designmd.js / amvcp-animation.js):
 *   - browser: `window.amvcpReportDoc = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness / a CLI
 *     --qa step that lints an HTML file on disk)
 *
 * Style matches scripts/amvcp-designmd.js / amvcp-runtime.js — `var`,
 * function declarations, ES5-safe, no arrow functions, no template
 * literals, no classes.
 *
 * Public API:
 *   injectReportDocCSS(doc)        — append the skill <style> to doc.head
 *   init(root)                     — wire the TOC scroll-spy (root = doc)
 *   refresh(root)                  — re-scan after dynamic DOM insertion
 *   runGates(documentOrRoot)       — QA pipeline, DOM mode -> QaReport
 *   runGatesOnHtml(htmlText)       — QA pipeline, static mode -> QaReport
 *   contrastRatio(colorA, colorB)  — WCAG contrast ratio of two colors
 *   resetLoopState()               — clear the loop-detection Map
 */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────

  // The injected <style> gets this id so injection is idempotent — a
  // second injectReportDocCSS() call is a no-op (matches the runtime's
  // injectStyles guard and amvcp-animation.js's STYLE_ID pattern).
  var STYLE_ID = 've-report-doc-styles';

  // The 6 template names (report-doc-spec.md §7.1). A template is only a
  // region/layout arrangement — colors/fonts/spacing come 100% from the
  // --vc-* tokens. The CSS class on the <article> is `vc-doc--<name>`.
  var TEMPLATES = [
    'executive-summary',
    'technical-report',
    'case-study',
    'proposal',
    'whitepaper',
    'design-system-doc'
  ];

  // The 5 callout variants (spec §8.1). Each maps to one --vc-color-*
  // role; the variant -> role mapping lives in the injected CSS.
  var CALLOUT_VARIANTS = ['tip', 'warning', 'info', 'note', 'danger'];

  // WCAG AA contrast thresholds (spec §10.6). Normal text needs 4.5:1;
  // large text (>=24px, or >=18.66px bold) needs 3:1.
  var WCAG_NORMAL = 4.5;
  var WCAG_LARGE = 3.0;

  // Large-text size cutoffs in px — WCAG 2.x definition.
  var LARGE_TEXT_PX = 24;

  // ── QA fallback banned lists (spec §10.4) ──────────────────────────
  //
  // The QA pipeline's banned-color / banned-font gates delegate to the
  // `design-tokens` skill's `window.amvcpTokens` when it is present
  // (spec §4.2 — the canonical source). These inline copies are the ONE
  // sanctioned fallback in the whole skill, used only when amvcpTokens
  // is unavailable (an out-of-order build). When the fallback activates
  // the gate emits a loud console.warn so the dependency gap is visible
  // — fail-loud, never fail-silent.

  // Hue ranges on the HSL hue circle (degrees). A color is "banned" when
  // its hue lands in a range AND it has meaningful saturation — a
  // near-grey of any hue is fine (greys carry no AI-slop signal).
  var FALLBACK_BANNED_HUE_RANGES = [
    { name: 'purple/violet/indigo', minHue: 255, maxHue: 320 }
  ];

  // Pure black / pure white as a DESIGN color. Structural #000/#fff
  // inside the print block are exempt — the gate only tests the
  // --vc-color-* role values, never the print override block.
  var FALLBACK_BANNED_PURE = ['#000000', '#ffffff', '#000', '#fff'];

  // AI-slop primary fonts — flagged ONLY as the first family of a
  // --vc-font-heading / --vc-font-body stack (a later fallback is fine).
  var FALLBACK_BANNED_FONTS = [
    'inter', 'roboto', 'open sans', 'lato', 'nunito'
  ];

  // The full --vc-color-* role set the QA pipeline reads (spec §2.1).
  var COLOR_ROLES = [
    'canvas', 'surface', 'surface-raised', 'surface-sunken',
    'content', 'content-muted', 'content-subtle',
    'border', 'border-strong', 'accent', 'on-accent',
    'success', 'warning', 'danger', 'info'
  ];

  // The canonical contrast pairings Gate 2 checks (spec §10.7). Each is
  // {fg role, bg role, min ratio}. A pairing only FAILs in DOM mode if
  // the document actually uses it; static mode checks all of them.
  var CONTRAST_PAIRINGS = [
    { fg: 'content', bg: 'canvas', min: WCAG_NORMAL },
    { fg: 'content', bg: 'surface', min: WCAG_NORMAL },
    { fg: 'content', bg: 'surface-raised', min: WCAG_NORMAL },
    { fg: 'content-muted', bg: 'canvas', min: WCAG_NORMAL },
    { fg: 'content-muted', bg: 'surface', min: WCAG_NORMAL },
    { fg: 'content-subtle', bg: 'canvas', min: WCAG_LARGE },
    { fg: 'on-accent', bg: 'accent', min: WCAG_NORMAL },
    { fg: 'accent', bg: 'canvas', min: WCAG_LARGE },
    { fg: 'success', bg: 'canvas', min: WCAG_LARGE },
    { fg: 'warning', bg: 'canvas', min: WCAG_LARGE },
    { fg: 'danger', bg: 'canvas', min: WCAG_LARGE },
    { fg: 'info', bg: 'canvas', min: WCAG_LARGE }
  ];

  // ── The injected stylesheet (spec §7.3, §8.3, §9.2, §11, §12.3) ────
  //
  // Built as an array of lines joined with '\n' — ES5-safe, no template
  // literals. Every rule themes off --vc-* with a literal fallback only.
  // Light + dark are handled by the engine swapping the token VALUES;
  // there is no per-theme rule here. The one exception is the
  // `@media print` block, which redefines the 4 color roles to a
  // print-safe ink-on-paper set so EVERY component flips at once — one
  // source of truth.
  var CSS_LINES = [
    '/* ai-maestro-visual-communicator — report-doc skill (injected) */',

    /* --- the document itself widens the page; no inner scrollbar --- */
    'html, body { overflow-x: auto; }',

    /* --- shared doc shell (spec §7.3) ----------------------------- */
    '.vc-doc {',
    '  --vc-doc-measure: 68ch;',                /* templates override this */
    '  max-width: var(--vc-doc-measure);',
    '  margin-inline: auto;',                   /* RTL-safe logical prop */
    '  padding-inline: var(--vc-space-4, 16px);',
    '  padding-block: var(--vc-space-6, 48px);',
    '  background: var(--vc-color-canvas, #faf6ee);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  font-family: var(--vc-font-body, Georgia, "Iowan Old Style", serif);',
    '  font-size: var(--vc-text-2, 16px);',
    '  line-height: var(--vc-line-height, 1.55);',
    '}',
    '.vc-doc h1, .vc-doc h2, .vc-doc h3, .vc-doc h4 {',
    '  font-family: var(--vc-font-heading, Georgia, serif);',
    '  color: var(--vc-color-content, #1f1a14);',
    '  line-height: 1.25;',
    '}',
    '.vc-doc h1 { font-size: var(--vc-text-6, 48px);',
    '  margin-block: 0 var(--vc-space-4, 16px); }',
    '.vc-doc h2 { font-size: var(--vc-text-5, 32px);',
    '  margin-block-start: var(--vc-space-6, 48px); }',
    '.vc-doc h3 { font-size: var(--vc-text-4, 24px);',
    '  margin-block-start: var(--vc-space-5, 32px); }',
    '.vc-doc h4 { font-size: var(--vc-text-3, 20px);',
    '  margin-block-start: var(--vc-space-4, 16px); }',
    '.vc-doc p, .vc-doc li { margin-block: var(--vc-space-3, 12px); }',
    '.vc-doc code, .vc-doc pre {',
    '  font-family: var(--vc-font-mono, ui-monospace, "SF Mono", monospace);',
    '}',
    '.vc-doc pre {',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '}',
    /* no-nested-scrollbars: wide content extends the doc, never an
       inner overflow box (spec §7.3 / §15.2). */
    '.vc-doc pre, .vc-doc table, .vc-doc .vc-figure {',
    '  overflow: visible;',
    '  max-width: none;',
    '}',
    '.vc-doc a {',
    '  color: var(--vc-color-accent, #b8861f);',
    '  text-underline-offset: 2px;',
    '}',
    '.vc-doc table { width: 100%; border-collapse: collapse;',
    '  margin-block: var(--vc-space-5, 32px); }',
    '.vc-doc th, .vc-doc td {',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  padding: var(--vc-space-2, 8px) var(--vc-space-3, 12px);',
    '  text-align: start;',                     /* RTL-safe */
    '}',
    '.vc-doc thead th {',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '}',

    /* --- doc header ----------------------------------------------- */
    '.vc-doc-header {',
    '  margin-block-end: var(--vc-space-6, 48px);',
    '  padding-block-end: var(--vc-space-4, 16px);',
    '  border-block-end: 1px solid var(--vc-color-border, #e3dcc9);',
    '}',
    '.vc-doc-subtitle {',
    '  font-size: var(--vc-text-3, 20px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  margin-block: var(--vc-space-2, 8px);',
    '}',
    '.vc-doc-byline {',
    '  font-size: var(--vc-text-1, 14px);',
    '  color: var(--vc-color-content-subtle, #8a8170);',
    '}',
    '.vc-figure { margin-block: var(--vc-space-5, 32px); }',
    '.vc-figure figcaption {',
    '  font-size: var(--vc-text-1, 14px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  margin-block-start: var(--vc-space-2, 8px);',
    '}',
    '.vc-metrics {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: var(--vc-space-4, 16px);',
    '  margin-block: var(--vc-space-5, 32px);',
    '}',
    '.vc-metric {',
    '  flex: 1 1 8rem;',
    '  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '}',
    '.vc-metric-value {',
    '  font-size: var(--vc-text-4, 24px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  font-feature-settings: "tnum";',
    '}',
    '.vc-metric-label {',
    '  font-size: var(--vc-text-1, 14px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '}',

    /* --- the 6 template presets (spec §7.1, §7.2) ----------------- */
    /* A template ONLY varies the reading measure + (whitepaper only)
       the heading-counter style + header treatment. Nothing else. */
    '.vc-doc--executive-summary { --vc-doc-measure: 72ch; }',
    '.vc-doc--technical-report  { --vc-doc-measure: 66ch; }',
    '.vc-doc--case-study        { --vc-doc-measure: 60ch; }',
    '.vc-doc--proposal          { --vc-doc-measure: 66ch; }',
    '.vc-doc--whitepaper        { --vc-doc-measure: 64ch; }',
    '.vc-doc--design-system-doc { --vc-doc-measure: 80ch; }',
    /* executive-summary: bold oversized title block */
    '.vc-doc--executive-summary .vc-doc-header h1 {',
    '  font-size: var(--vc-text-6, 48px);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '}',
    /* whitepaper: cover-style header + decimal-leading-zero section
       numbering (spec §7.3 — re-keyed to --vc-*). */
    '.vc-doc--whitepaper .vc-doc-header {',
    '  text-align: center;',
    '  padding-block: var(--vc-space-6, 48px);',
    '}',
    '.vc-doc--whitepaper { counter-reset: vc-sec; }',
    '.vc-doc--whitepaper h2 { counter-increment: vc-sec; }',
    '.vc-doc--whitepaper h2::before {',
    '  content: counter(vc-sec, decimal-leading-zero) "  ";',
    '  color: var(--vc-color-accent, #b8861f);',
    '  font-feature-settings: "tnum";',
    '}',

    /* --- callout / admonition blocks (spec §8.3) ------------------ */
    '.vc-callout {',
    '  display: flex;',
    '  gap: var(--vc-space-3, 12px);',
    '  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);',
    '  margin-block: var(--vc-space-5, 32px);',
    '  border-inline-start: 3px solid var(--vc-callout-accent);',
    '  border-radius: 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0;',
    '  background: color-mix(in srgb, var(--vc-callout-accent) 8%,',
    '              transparent);',
    '}',
    '.vc-callout-glyph {',
    '  color: var(--vc-callout-accent);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  flex: none;',
    '}',
    '.vc-callout-title {',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  margin: 0 0 var(--vc-space-1, 4px);',
    '}',
    '.vc-callout-body { margin: 0; }',
    '.vc-callout-body > p { margin-block: var(--vc-space-2, 8px); }',
    '.vc-callout-body > p:first-child { margin-block-start: 0; }',
    '.vc-callout-body > p:last-child { margin-block-end: 0; }',
    /* variant -> which --vc-color-* role drives the accent. One line
       each — light/dark mirror automatically (the engine swaps the
       role value, color-mix re-tints over the new canvas). */
    '.vc-callout--tip     {',
    '  --vc-callout-accent: var(--vc-color-success, #3a6b5c); }',
    '.vc-callout--warning {',
    '  --vc-callout-accent: var(--vc-color-warning, #a8791f); }',
    '.vc-callout--info    {',
    '  --vc-callout-accent: var(--vc-color-info,    #3464a8); }',
    '.vc-callout--note    {',
    '  --vc-callout-accent: var(--vc-color-accent,  #b8861f); }',
    '.vc-callout--danger  {',
    '  --vc-callout-accent: var(--vc-color-danger,  #a84a32); }',
    /* glyphs are CSS ::before content — neutral geometric Unicode, no
       SVG, no icon font, no emoji (emoji are AI-slop-adjacent). */
    '.vc-callout--tip     .vc-callout-glyph::before { content: "\\25B8"; }',
    '.vc-callout--warning .vc-callout-glyph::before { content: "\\25B2"; }',
    '.vc-callout--info    .vc-callout-glyph::before { content: "\\24D8"; }',
    '.vc-callout--note    .vc-callout-glyph::before { content: "\\270E"; }',
    '.vc-callout--danger  .vc-callout-glyph::before { content: "\\25A0"; }',

    /* --- quality-rubric / scored-matrix block (spec §12.3) -------- */
    '.vc-rubric {',
    '  width: 100%;',
    '  border-collapse: collapse;',
    '  margin-block: var(--vc-space-5, 32px);',
    '}',
    '.vc-rubric caption {',
    '  caption-side: top;',
    '  text-align: start;',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  margin-block-end: var(--vc-space-2, 8px);',
    '}',
    '.vc-rubric th, .vc-rubric td {',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  padding: var(--vc-space-2, 8px) var(--vc-space-3, 12px);',
    '  text-align: start;',                     /* RTL-safe */
    '}',
    '.vc-rubric thead th {',
    '  background: var(--vc-color-surface-sunken, #f1ece0);',
    '}',
    '.vc-rubric-score, .vc-rubric-total {',
    '  font-family: var(--vc-font-mono, ui-monospace, monospace);',
    '  font-feature-settings: "tnum";',
    '  text-align: end;',                       /* RTL-safe */
    '}',
    '.vc-rubric tfoot th, .vc-rubric tfoot td {',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  background: color-mix(in srgb,',
    '              var(--vc-color-accent, #b8861f) 10%, transparent);',
    '}',

    /* --- section anchors + TOC (spec §11) ------------------------- */
    '.vc-toc {',
    '  counter-reset: vc-toc;',
    '  background: var(--vc-color-surface, #ffffff);',
    '  border: 1px solid var(--vc-color-border, #e3dcc9);',
    '  border-radius: var(--vc-radius-md, 8px);',
    '  padding: var(--vc-space-4, 16px) var(--vc-space-5, 32px);',
    '  margin-block: var(--vc-space-5, 32px);',
    '}',
    '.vc-toc-title {',
    '  font-weight: var(--vc-weight-bold, 700);',
    '  margin: 0 0 var(--vc-space-2, 8px);',
    '}',
    '.vc-toc ol { list-style: none; margin: 0; padding: 0; }',
    '.vc-toc li {',
    '  counter-increment: vc-toc;',
    '  padding-block: var(--vc-space-1, 4px);',
    '}',
    '.vc-toc li.vc-toc-sub { padding-inline-start: var(--vc-space-4, 16px); }',
    '.vc-toc li::before {',
    '  content: counter(vc-toc, decimal-leading-zero);',
    '  color: var(--vc-color-accent, #b8861f);',
    '  font-feature-settings: "tnum";',
    '  margin-inline-end: var(--vc-space-3, 12px);',
    '}',
    '.vc-toc a {',
    '  color: var(--vc-color-content, #1f1a14);',
    '  text-decoration: none;',
    '}',
    '.vc-toc a:hover { color: var(--vc-color-accent, #b8861f); }',
    /* scroll-spy active-section state — set by init()'s observer. */
    '.vc-toc a.vc-toc-active {',
    '  color: var(--vc-color-accent, #b8861f);',
    '  font-weight: var(--vc-weight-bold, 700);',
    '}',
    /* heading anchor — a stable scroll target id; the offset keeps a
       linked heading clear of any sticky chrome. */
    '.vc-doc :target { scroll-margin-block-start: var(--vc-space-5, 32px); }',

    /* --- pull-quote (case-study / whitepaper) --------------------- */
    '.vc-pullquote {',
    '  margin-inline: 0;',
    '  margin-block: var(--vc-space-5, 32px);',
    '  padding-inline-start: var(--vc-space-4, 16px);',
    '  border-inline-start: 3px solid var(--vc-color-accent, #b8861f);',
    '  font-size: var(--vc-text-3, 20px);',
    '  color: var(--vc-color-content-muted, #5b5343);',
    '  font-style: italic;',
    '}',

    /* --- @media print (spec §9.2) — browser-native PDF ------------ */
    /* The ONLY sanctioned hardcoded colors in the whole skill: the 4
       print-device constants (paper white, ink black, two greys).
       Overriding the --vc-* color roles here flips EVERY component to
       ink-on-paper in one place — one source of truth. */
    '@page { margin: 18mm 16mm; }',
    '@media print {',
    '  .vc-doc {',
    '    --vc-color-canvas:  #ffffff;',
    '    --vc-color-surface: #ffffff;',
    '    --vc-color-surface-raised: #ffffff;',
    '    --vc-color-surface-sunken: #ffffff;',
    '    --vc-color-content: #000000;',
    '    --vc-color-border:  #999999;',
    '    max-width: none;',
    '    padding: 0;',
    '    font-size: 10.5pt;',
    '    line-height: 1.45;',
    '  }',
    '  .ve-style-pad, .ve-comment-modal, .ve-hover-pill,',
    '  .ve-decision, .ve-finding-thread, .ve-report-banner,',
    '  .vc-back-to-top { display: none !important; }',
    '  .vc-doc h1, .vc-doc h2, .vc-doc h3, .vc-doc h4 {',
    '    break-after: avoid; page-break-after: avoid;',
    '  }',
    '  .vc-doc p, .vc-doc li, .vc-doc blockquote {',
    '    break-inside: avoid; page-break-inside: avoid;',
    '    orphans: 3; widows: 3;',
    '  }',
    '  .vc-callout, .vc-rubric, .vc-figure,',
    '  .vc-doc table, .vc-doc pre, .vc-metrics {',
    '    break-inside: avoid; page-break-inside: avoid;',
    '  }',
    '  .vc-doc details { border: none; }',
    '  .vc-doc details > summary { display: none; }',
    '  .vc-doc details > *:not(summary) { display: block !important; }',
    '  .vc-doc a[href]:not([href^="#"])::after {',
    '    content: " (" attr(href) ")";',
    '    font-size: 0.85em; color: #555555;',
    '  }',
    '  .vc-doc a { color: #000000; text-decoration: underline; }',
    '}',
    ''
  ];

  // Materialised CSS string — joined once at module load.
  var CSS_TEXT = CSS_LINES.join('\n');

  // ── injectReportDocCSS — append the skill stylesheet ───────────────
  //
  // Idempotent: a second call (a scaffold engine inlines the CSS into
  // the <style> at render time; a host page calls this once; a test may
  // call it again) is a no-op because the <style> is guarded by id.
  function injectReportDocCSS(doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.head) { return; }
    if (d.getElementById(STYLE_ID)) { return; }
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-vc', 'report-doc');
    style.appendChild(d.createTextNode(CSS_TEXT));
    d.head.appendChild(style);
  }

  // ── token / color helpers ──────────────────────────────────────────

  // Read a CSS custom property off :root and return its trimmed value.
  // Returns '' when the token is absent — every consumer treats '' as
  // "use a fallback", which is what makes the module work with no
  // DESIGN.md engine present.
  function readToken(name, root) {
    if (typeof getComputedStyle !== 'function') { return ''; }
    var el = root || (typeof document !== 'undefined'
      ? document.documentElement : null);
    if (!el) { return ''; }
    var raw = '';
    try {
      raw = getComputedStyle(el).getPropertyValue(name);
    } catch (e) {
      return '';
    }
    return (raw || '').trim();
  }

  // Parse a CSS color string into {r,g,b} 0..255. Handles #rgb, #rrggbb,
  // rgb()/rgba(). Returns null for anything it cannot resolve (named
  // colors, hsl(), color-mix() — the caller falls back to a computed
  // style read in DOM mode). Defensive: never throws.
  function parseColor(str) {
    if (typeof str !== 'string') { return null; }
    var s = str.trim().toLowerCase();
    if (!s) { return null; }
    // #rgb / #rrggbb
    if (s.charAt(0) === '#') {
      var hex = s.slice(1);
      if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0)
          + hex.charAt(1) + hex.charAt(1)
          + hex.charAt(2) + hex.charAt(2);
      }
      if (hex.length !== 6 || !/^[0-9a-f]{6}$/.test(hex)) { return null; }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    // rgb() / rgba()
    var m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      var parts = m[1].split(',');
      if (parts.length < 3) { return null; }
      var r = parseInt(parts[0], 10);
      var g = parseInt(parts[1], 10);
      var b = parseInt(parts[2], 10);
      if (!isFinite(r) || !isFinite(g) || !isFinite(b)) { return null; }
      return { r: clamp255(r), g: clamp255(g), b: clamp255(b) };
    }
    return null;
  }

  function clamp255(n) {
    if (n < 0) { return 0; }
    if (n > 255) { return 255; }
    return n;
  }

  // sRGB channel (0..1) -> linear-light value. The WCAG 2.x transfer
  // function (spec §10.6).
  function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  // WCAG relative luminance of an {r,g,b} 0..255 color — Rec.709
  // weights on the linearised channels (spec §10.6).
  function relativeLuminance(rgb) {
    var r = srgbToLinear(rgb.r / 255);
    var g = srgbToLinear(rgb.g / 255);
    var b = srgbToLinear(rgb.b / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // WCAG contrast ratio of two colors (each a string parseColor can
  // resolve). Returns the ratio 1..21, or 0 when either color is
  // unparseable (the caller treats 0 as "could not check"). Public API.
  function contrastRatio(colorA, colorB) {
    var a = parseColor(colorA);
    var b = parseColor(colorB);
    if (!a || !b) { return 0; }
    var la = relativeLuminance(a);
    var lb = relativeLuminance(b);
    var hi = la > lb ? la : lb;
    var lo = la > lb ? lb : la;
    return (hi + 0.05) / (lo + 0.05);
  }

  // {r,g,b} 0..255 -> HSL hue in degrees (0..360) + saturation 0..1.
  // Used by the fallback banned-color hue check.
  function rgbToHsl(rgb) {
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var hue = 0;
    if (delta !== 0) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }
      hue *= 60;
      if (hue < 0) { hue += 360; }
    }
    var light = (max + min) / 2;
    var sat = delta === 0
      ? 0
      : delta / (1 - Math.abs(2 * light - 1));
    return { hue: hue, sat: sat, light: light };
  }

  // ── QA pipeline — banned-list resolution (spec §4.2) ───────────────
  //
  // The banned-color / banned-font gates delegate to the design-tokens
  // skill's window.amvcpTokens when present (the canonical source). When
  // it is absent the inline fallback lists activate AND a loud
  // console.warn fires — the ONE sanctioned fallback in the skill,
  // fail-loud per spec §15.4. Tracked so the warn fires exactly once.
  var _bannedWarned = false;

  function bannedSourceAvailable() {
    return typeof window !== 'undefined'
      && window.amvcpTokens
      && typeof window.amvcpTokens.BANNED_FONTS !== 'undefined';
  }

  function warnBannedFallbackOnce() {
    if (_bannedWarned) { return; }
    _bannedWarned = true;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[amvcp-report-doc] design-tokens skill (amvcpTokens) '
        + 'not present — QA banned-color / banned-font gates fall back '
        + 'to the inline list. Ship amvcp-tokens.js for the canonical '
        + 'list.');
    }
  }

  // Resolve the banned-font list — amvcpTokens' copy when present,
  // otherwise the inline fallback (with the one-time warn).
  function resolveBannedFonts() {
    if (bannedSourceAvailable()
      && _isArray(window.amvcpTokens.BANNED_FONTS)) {
      return window.amvcpTokens.BANNED_FONTS;
    }
    warnBannedFallbackOnce();
    return FALLBACK_BANNED_FONTS;
  }

  function _isArray(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  }

  // Is a color value a banned design color? Pure #000/#fff (exact) OR a
  // saturated purple/violet/indigo (hue-range). A near-grey of any hue
  // passes — greys carry no slop signal. `value` is a color string.
  function isBannedColor(value) {
    if (typeof value !== 'string') { return false; }
    var norm = value.trim().toLowerCase();
    var i;
    for (i = 0; i < FALLBACK_BANNED_PURE.length; i++) {
      if (norm === FALLBACK_BANNED_PURE[i]) { return true; }
    }
    var rgb = parseColor(norm);
    if (!rgb) { return false; }
    var hsl = rgbToHsl(rgb);
    // A near-grey (low saturation) is never slop, whatever its hue.
    if (hsl.sat < 0.15) { return false; }
    for (i = 0; i < FALLBACK_BANNED_HUE_RANGES.length; i++) {
      var range = FALLBACK_BANNED_HUE_RANGES[i];
      if (hsl.hue >= range.minHue && hsl.hue <= range.maxHue) {
        return true;
      }
    }
    return false;
  }

  // Is a font-family stack's PRIMARY (first) family banned? A banned
  // name later in the stack is fine — only the first family is the
  // slop signal (spec §10.3 reconciliation rule). `stack` is the raw
  // font-family value.
  function isBannedFontStack(stack) {
    if (typeof stack !== 'string' || !stack) { return false; }
    var first = stack.split(',')[0];
    first = first.replace(/["']/g, '').trim().toLowerCase();
    if (!first) { return false; }
    var banned = resolveBannedFonts();
    for (var i = 0; i < banned.length; i++) {
      if (first === String(banned[i]).toLowerCase()) { return true; }
    }
    return false;
  }

  // ── QA pipeline — gate-result helpers ──────────────────────────────

  function makeGate(id, priority, status, detail, fixHint) {
    return {
      id: id,
      priority: priority,
      status: status,
      detail: detail || '',
      fixHint: fixHint || ''
    };
  }

  // ── QA pipeline — loop detection (spec §10.5) ──────────────────────
  //
  // If the SAME gate fails on two consecutive runGates calls for the
  // SAME page identity, escalate. The runner is stateless per call, so
  // loop state is keyed by a caller-passed pageId in a module-level Map
  // shim (cleared by resetLoopState). failedTwice is advisory — the
  // runner never auto-fixes; the caller is told to escalate.
  var _loopState = {};   // pageId -> last failing gate id

  function resetLoopState() {
    _loopState = {};
  }

  // Given a finished gate list + a pageId, return the loop descriptor
  // and update the stored state. The "gate" reported is the first P1
  // FAIL — the most actionable one.
  function detectLoop(gates, pageId) {
    var firstFail = null;
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].status === 'FAIL') {
        firstFail = gates[i].id;
        break;
      }
    }
    if (!pageId) {
      // No identity supplied — loop detection cannot run.
      return { gate: firstFail, failedTwice: false };
    }
    var prev = _loopState[pageId];
    var twice = !!(firstFail && prev && prev === firstFail);
    _loopState[pageId] = firstFail;   // store (or clear when null)
    return { gate: firstFail, failedTwice: twice };
  }

  // ── QA Gate 1 — no-nested-scrollbars (DOM mode) ────────────────────
  //
  // For every element: if computed overflow-x/y is auto|scroll AND the
  // element actually overflows (scrollWidth > clientWidth, or height),
  // it is an inner scroller -> FAIL. Exempt: textarea / contenteditable
  // (interactive widgets) and elements carrying a data-vc-app marker
  // (true app surfaces own their viewport — see no-nested-scrollbars
  // rule "does NOT apply to").
  function gateNoNestedScrollbarsDom(doc) {
    var all = doc.querySelectorAll('body *');
    var offenders = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isScrollExempt(el)) { continue; }
      var cs;
      try {
        cs = getComputedStyle(el);
      } catch (e) {
        continue;
      }
      var scrolls = cs.overflowX === 'auto' || cs.overflowX === 'scroll'
        || cs.overflowY === 'auto' || cs.overflowY === 'scroll';
      if (!scrolls) { continue; }
      if (el.scrollWidth > el.clientWidth + 1
        || el.scrollHeight > el.clientHeight + 1) {
        offenders.push(describeEl(el));
      }
    }
    if (offenders.length === 0) {
      return makeGate('no-nested-scrollbars', 'P1', 'PASS',
        'No inner scrollers — only the document scrolls.', '');
    }
    return makeGate('no-nested-scrollbars', 'P1', 'FAIL',
      offenders.length + ' element(s) with overflow:auto/scroll and an '
        + 'inner scrollbar: ' + offenders.join(', '),
      'Remove overflow:auto/scroll; let the page expand. See '
        + '~/.claude/rules/no-nested-scrollbars.md.');
  }

  function isScrollExempt(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea') { return true; }
    if (el.isContentEditable) { return true; }
    if (el.hasAttribute && el.hasAttribute('data-vc-app')) { return true; }
    return false;
  }

  function describeEl(el) {
    var tag = (el.tagName || 'el').toLowerCase();
    if (el.id) { return tag + '#' + el.id; }
    if (el.className && typeof el.className === 'string') {
      return tag + '.' + el.className.split(/\s+/)[0];
    }
    return tag;
  }

  // Gate 1 — static mode. Scan inlined CSS text for overflow:auto/scroll
  // on selectors other than textarea/contenteditable. Cannot confirm a
  // scrollbar actually appears without layout, so this is WARN.
  function gateNoNestedScrollbarsStatic(cssText) {
    var rx = /(^|[{;\s])overflow(-[xy])?\s*:\s*(auto|scroll)/gi;
    var hits = 0;
    // exec() advances rx.lastIndex (the side effect), so the assignment
    // result is unused — we only care about the null check terminating
    // the loop.
    while (rx.exec(cssText) !== null) {
      hits++;
      if (hits > 50) { break; }   // safety — do not loop forever
    }
    if (hits === 0) {
      return makeGate('no-nested-scrollbars', 'P1', 'PASS',
        'No overflow:auto/scroll declarations found in the CSS.', '');
    }
    return makeGate('no-nested-scrollbars', 'P1', 'WARN',
      hits + ' overflow:auto/scroll declaration(s) in the CSS — cannot '
        + 'confirm an inner scrollbar appears without layout. Run '
        + 'runGates(document) for a definitive check.',
      'Audit each overflow:auto/scroll; wide content should extend the '
        + 'page. See ~/.claude/rules/no-nested-scrollbars.md.');
  }

  // ── QA Gate 2 — WCAG AA contrast ───────────────────────────────────
  //
  // Resolve the --vc-color-* role set, compute the contrast ratio for
  // every canonical pairing (spec §10.7), FAIL any below threshold.
  // DOM mode reads the active theme off :root; static mode parses the
  // embedded DESIGN.md for BOTH themes (stronger — covers the inactive
  // theme too).
  function checkContrastPairings(roleColors, label) {
    var failures = [];
    for (var i = 0; i < CONTRAST_PAIRINGS.length; i++) {
      var p = CONTRAST_PAIRINGS[i];
      var fg = roleColors[p.fg];
      var bg = roleColors[p.bg];
      if (!fg || !bg) { continue; }   // role not in this token set
      var ratio = contrastRatio(fg, bg);
      if (ratio === 0) { continue; }  // unparseable — cannot judge
      if (ratio < p.min) {
        failures.push(label + p.fg + ' on ' + p.bg + ' = '
          + ratio.toFixed(2) + ':1 (needs ' + p.min + ':1)');
      }
    }
    return failures;
  }

  function gateContrastDom(doc) {
    var root = doc.documentElement;
    var roleColors = {};
    for (var i = 0; i < COLOR_ROLES.length; i++) {
      var v = readToken('--vc-color-' + COLOR_ROLES[i], root);
      if (v) { roleColors[COLOR_ROLES[i]] = v; }
    }
    var failures = checkContrastPairings(roleColors, '');
    if (failures.length === 0) {
      return makeGate('wcag-contrast', 'P1', 'PASS',
        'Every used --vc-color-* text/background pairing meets WCAG AA.',
        '');
    }
    return makeGate('wcag-contrast', 'P1', 'FAIL',
      failures.length + ' pairing(s) below WCAG AA: ' + failures.join('; '),
      'Darken/lighten the failing --vc-color-* role until the ratio '
        + 'clears 4.5:1 (body) / 3:1 (large text).');
  }

  // Static mode — parse the embedded DESIGN.md, resolve BOTH themes via
  // amvcpDesignMd, check every pairing in each. When amvcpDesignMd is
  // absent (no engine on the page being linted) the gate cannot resolve
  // tokens -> WARN.
  function gateContrastStatic(htmlText) {
    var designmd = extractDesignMd(htmlText);
    if (!designmd) {
      return makeGate('wcag-contrast', 'P1', 'WARN',
        'No <script type="text/design-md"> block found — cannot resolve '
          + '--vc-color-* tokens for a static contrast check.',
        'Embed the DESIGN.md, or run runGates(document) in a browser.');
    }
    if (typeof window === 'undefined' || !window.amvcpDesignMd) {
      return makeGate('wcag-contrast', 'P1', 'WARN',
        'DESIGN.md block found but amvcpDesignMd (the engine) is not '
          + 'loaded — cannot resolve tokens.',
        'Load amvcp-designmd.js so the static check can resolve tokens.');
    }
    var parsed;
    try {
      parsed = window.amvcpDesignMd.parseDesignMd(
        '---\n' + designmd + '\n---\n');
    } catch (e) {
      return makeGate('wcag-contrast', 'P1', 'WARN',
        'DESIGN.md present but did not parse: ' + errMsg(e), '');
    }
    if (!parsed || !parsed.ok) {
      return makeGate('wcag-contrast', 'P1', 'WARN',
        'DESIGN.md present but invalid: '
          + (parsed && parsed.errors ? parsed.errors.join('; ') : '?'),
        '');
    }
    var allFailures = [];
    var themes = ['light', 'dark'];
    for (var t = 0; t < themes.length; t++) {
      var map;
      try {
        map = window.amvcpDesignMd.resolveTokens(parsed.designmd,
          themes[t]);
      } catch (e2) {
        continue;
      }
      var roleColors = {};
      for (var r = 0; r < COLOR_ROLES.length; r++) {
        var key = '--vc-color-' + COLOR_ROLES[r];
        if (map[key]) { roleColors[COLOR_ROLES[r]] = map[key]; }
      }
      var f = checkContrastPairings(roleColors, themes[t] + ' theme: ');
      allFailures = allFailures.concat(f);
    }
    if (allFailures.length === 0) {
      return makeGate('wcag-contrast', 'P1', 'PASS',
        'Both themes: every contrast pairing meets WCAG AA.', '');
    }
    return makeGate('wcag-contrast', 'P1', 'FAIL',
      allFailures.length + ' pairing(s) below WCAG AA: '
        + allFailures.join('; '),
      'Adjust the failing --vc-color-* role in the DESIGN.md until the '
        + 'ratio clears 4.5:1 (body) / 3:1 (large text).');
  }

  // ── QA Gate 3 — prefers-reduced-motion (spec §10.3) ────────────────
  //
  // If the page defines any @keyframes or a non-trivial transition,
  // there must be a @media (prefers-reduced-motion: reduce) block.
  function gateReducedMotionDom(doc) {
    var hasMotion = false;
    var hasReduce = false;
    var sheets = doc.styleSheets;
    for (var s = 0; s < sheets.length; s++) {
      var rules;
      try {
        rules = sheets[s].cssRules || sheets[s].rules;
      } catch (e) {
        continue;   // cross-origin sheet — skip
      }
      if (!rules) { continue; }
      var scan = scanRulesForMotion(rules);
      if (scan.motion) { hasMotion = true; }
      if (scan.reduce) { hasReduce = true; }
    }
    return reducedMotionVerdict(hasMotion, hasReduce, 'DOM');
  }

  // Recursively scan a CSSRuleList for @keyframes / transition / a
  // prefers-reduced-motion media block.
  function scanRulesForMotion(rules) {
    var out = { motion: false, reduce: false };
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      // CSSKeyframesRule type === 7.
      if (rule.type === 7) { out.motion = true; }
      // CSSMediaRule type === 4.
      if (rule.type === 4 && rule.media && rule.media.mediaText) {
        if (/prefers-reduced-motion/i.test(rule.media.mediaText)) {
          out.reduce = true;
        }
        var inner = scanRulesForMotion(rule.cssRules || []);
        if (inner.motion) { out.motion = true; }
        if (inner.reduce) { out.reduce = true; }
      }
      // CSSStyleRule type === 1 — inspect its declarations.
      if (rule.type === 1 && rule.style) {
        var tr = rule.style.transition
          || rule.style.getPropertyValue('transition');
        var an = rule.style.animation
          || rule.style.getPropertyValue('animation');
        if ((tr && tr !== 'none' && tr.indexOf('0s') !== 0)
          || (an && an !== 'none')) {
          out.motion = true;
        }
      }
    }
    return out;
  }

  function gateReducedMotionStatic(cssText) {
    var hasMotion = /@keyframes/i.test(cssText)
      || /transition\s*:/i.test(cssText)
      || /animation\s*:/i.test(cssText);
    var hasReduce = /prefers-reduced-motion/i.test(cssText);
    return reducedMotionVerdict(hasMotion, hasReduce, 'static');
  }

  function reducedMotionVerdict(hasMotion, hasReduce, mode) {
    if (!hasMotion) {
      return makeGate('reduced-motion', 'P1', 'PASS',
        'Page defines no @keyframes / transition — nothing to gate.', '');
    }
    if (hasReduce) {
      return makeGate('reduced-motion', 'P1', 'PASS',
        'Motion present and a prefers-reduced-motion block exists.', '');
    }
    return makeGate('reduced-motion', 'P1', 'FAIL',
      'Page defines @keyframes / transition but has NO @media '
        + '(prefers-reduced-motion: reduce) block (' + mode + ' scan).',
      'Add a prefers-reduced-motion block with a meaning-preserving '
        + 'substitute — never a bare animation:none.');
  }

  // ── QA Gate 4 — print-css (spec §10.3) ─────────────────────────────

  function gatePrintCssDom(doc) {
    var sheets = doc.styleSheets;
    var found = false;
    for (var s = 0; s < sheets.length && !found; s++) {
      var rules;
      try {
        rules = sheets[s].cssRules || sheets[s].rules;
      } catch (e) {
        continue;
      }
      if (rules && hasPrintMediaRule(rules)) { found = true; }
    }
    return printCssVerdict(found);
  }

  function hasPrintMediaRule(rules) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.type === 4 && rule.media && rule.media.mediaText
        && /print/i.test(rule.media.mediaText)) {
        return true;
      }
      // A nested media rule (e.g. inside a @supports) — recurse.
      if (rule.type === 4 && rule.cssRules
        && hasPrintMediaRule(rule.cssRules)) {
        return true;
      }
    }
    return false;
  }

  function gatePrintCssStatic(cssText) {
    return printCssVerdict(/@media[^{]*\bprint\b/i.test(cssText));
  }

  function printCssVerdict(found) {
    if (found) {
      return makeGate('print-css', 'P1', 'PASS',
        'Page contains a @media print block — Cmd-P yields a sane PDF.',
        '');
    }
    return makeGate('print-css', 'P1', 'FAIL',
      'No @media print block — printing / PDF export will use screen '
        + 'styling.',
      'Add a @media print block (the report-doc skill ships one).');
  }

  // ── QA Gate 5 — semantic-html (spec §10.3) ─────────────────────────
  //
  // No div-soup: a doc root of <article>/<main>; headings are real
  // h1..h6; a <div> that LOOKS like a heading (heading role, or a
  // heading-sized font with no nearby real heading) is a finding.
  function gateSemanticHtmlDom(doc) {
    var problems = [];
    var hasLandmark = doc.querySelector('main, article, [role="main"]');
    if (!hasLandmark) {
      problems.push('no <main>/<article> landmark');
    }
    // div carrying a heading role.
    var roleHeadings = doc.querySelectorAll('div[role="heading"]');
    if (roleHeadings.length > 0) {
      problems.push(roleHeadings.length
        + ' <div role="heading"> — use a real h1..h6');
    }
    // div with a heading-sized font and no real heading inside it.
    var divs = doc.querySelectorAll('body div');
    var bigDivCount = 0;
    var bigThreshold = pxOf(readToken('--vc-text-4',
      doc.documentElement)) || LARGE_TEXT_PX;
    for (var i = 0; i < divs.length && bigDivCount < 20; i++) {
      var div = divs[i];
      var fs;
      try {
        fs = pxOf(getComputedStyle(div).fontSize);
      } catch (e) {
        continue;
      }
      if (fs && fs >= bigThreshold
        && div.children.length === 0
        && (div.textContent || '').trim().length > 0
        && !div.closest('h1, h2, h3, h4, h5, h6')) {
        bigDivCount++;
      }
    }
    if (bigDivCount > 0) {
      problems.push(bigDivCount + ' heading-sized <div>(s) with no real '
        + 'heading — likely div-soup headings');
    }
    if (problems.length === 0) {
      return makeGate('semantic-html', 'P2', 'PASS',
        'Real headings + a landmark root; no div-soup detected.', '');
    }
    return makeGate('semantic-html', 'P2', 'FAIL',
      problems.join('; '),
      'Use real h1..h6 elements, ul/ol lists, and an <article>/<main> '
        + 'root instead of styled <div>s.');
  }

  // Static mode — regex heuristics, WARN-level (cannot resolve computed
  // styles, so a styled-div heading cannot be confirmed).
  function gateSemanticHtmlStatic(htmlText) {
    var hasLandmark = /<(main|article)\b/i.test(htmlText)
      || /role\s*=\s*["']main["']/i.test(htmlText);
    var roleHeadingHits = (htmlText.match(
      /<div[^>]*role\s*=\s*["']heading["']/gi) || []).length;
    var problems = [];
    if (!hasLandmark) { problems.push('no <main>/<article> landmark'); }
    if (roleHeadingHits > 0) {
      problems.push(roleHeadingHits + ' <div role="heading">');
    }
    if (problems.length === 0) {
      return makeGate('semantic-html', 'P2', 'PASS',
        'A landmark root is present; no div role="heading" found '
          + '(static scan — styled-div headings need DOM mode).', '');
    }
    return makeGate('semantic-html', 'P2', 'WARN',
      problems.join('; ') + ' (static scan)',
      'Use real h1..h6 and an <article>/<main> root. Run '
        + 'runGates(document) for the full div-soup check.');
  }

  // ── QA Gate 6 — banned-color (spec §10.3) ──────────────────────────
  //
  // No AI-slop colors in the --vc-color-* role set. Delegates to
  // amvcpTokens when present; otherwise the inline hue-range check.
  function gateBannedColorDom(doc) {
    var root = doc.documentElement;
    var offenders = [];
    for (var i = 0; i < COLOR_ROLES.length; i++) {
      var role = COLOR_ROLES[i];
      var v = readToken('--vc-color-' + role, root);
      if (v && isBannedColor(v)) {
        offenders.push('--vc-color-' + role + ' = ' + v);
      }
    }
    return bannedColorVerdict(offenders);
  }

  function gateBannedColorStatic(htmlText) {
    var designmd = extractDesignMd(htmlText);
    var offenders = [];
    if (designmd && typeof window !== 'undefined' && window.amvcpDesignMd) {
      var parsed;
      try {
        parsed = window.amvcpDesignMd.parseDesignMd(
          '---\n' + designmd + '\n---\n');
      } catch (e) {
        parsed = null;
      }
      if (parsed && parsed.ok) {
        var themes = ['light', 'dark'];
        for (var t = 0; t < themes.length; t++) {
          var map;
          try {
            map = window.amvcpDesignMd.resolveTokens(parsed.designmd,
              themes[t]);
          } catch (e2) {
            continue;
          }
          for (var r = 0; r < COLOR_ROLES.length; r++) {
            var key = '--vc-color-' + COLOR_ROLES[r];
            if (map[key] && isBannedColor(map[key])) {
              offenders.push(themes[t] + ' ' + key + ' = ' + map[key]);
            }
          }
        }
      }
    }
    // Also scan any inline style= colors in the HTML.
    var inlineRx = /(#[0-9a-fA-F]{3,8})\b/g;
    var m;
    var seenInline = {};
    while ((m = inlineRx.exec(htmlText)) !== null) {
      var hex = m[1].toLowerCase();
      if (seenInline[hex]) { continue; }
      seenInline[hex] = true;
      if (isBannedColor(hex)) {
        offenders.push('inline color ' + hex);
      }
      if (Object.keys(seenInline).length > 200) { break; }
    }
    return bannedColorVerdict(offenders);
  }

  function bannedColorVerdict(offenders) {
    if (offenders.length === 0) {
      return makeGate('banned-color', 'P1', 'PASS',
        'No AI-slop colors (purple/violet/indigo, pure #000/#fff) in '
          + 'the --vc-color-* roles.', '');
    }
    return makeGate('banned-color', 'P1', 'FAIL',
      offenders.length + ' banned color(s): ' + offenders.join('; '),
      'Replace the purple/violet/indigo or pure #000/#fff role value '
        + 'with a non-slop color. See the design-tokens anti-slop list.');
  }

  // ── QA Gate 7 — banned-font (spec §10.3) ───────────────────────────

  function gateBannedFontDom(doc) {
    var root = doc.documentElement;
    var offenders = [];
    var heading = readToken('--vc-font-heading', root);
    var body = readToken('--vc-font-body', root);
    if (isBannedFontStack(heading)) {
      offenders.push('--vc-font-heading first family is banned: '
        + heading);
    }
    if (isBannedFontStack(body)) {
      offenders.push('--vc-font-body first family is banned: ' + body);
    }
    return bannedFontVerdict(offenders);
  }

  function gateBannedFontStatic(htmlText) {
    var designmd = extractDesignMd(htmlText);
    var offenders = [];
    if (designmd && typeof window !== 'undefined' && window.amvcpDesignMd) {
      var parsed;
      try {
        parsed = window.amvcpDesignMd.parseDesignMd(
          '---\n' + designmd + '\n---\n');
      } catch (e) {
        parsed = null;
      }
      if (parsed && parsed.ok && parsed.designmd
        && parsed.designmd.typography) {
        var ty = parsed.designmd.typography;
        if (isBannedFontStack(ty['font-heading'])) {
          offenders.push('font-heading first family is banned: '
            + ty['font-heading']);
        }
        if (isBannedFontStack(ty['font-body'])) {
          offenders.push('font-body first family is banned: '
            + ty['font-body']);
        }
      }
    }
    return bannedFontVerdict(offenders);
  }

  function bannedFontVerdict(offenders) {
    if (offenders.length === 0) {
      return makeGate('banned-font', 'P1', 'PASS',
        'No AI-slop primary font (Inter/Roboto/Open Sans/Lato/Nunito) '
          + 'as the first family of --vc-font-heading/body.', '');
    }
    return makeGate('banned-font', 'P1', 'FAIL',
      offenders.join('; '),
      'Move the banned font later in the stack or replace it. A banned '
        + 'name is only flagged as the FIRST family.');
  }

  // ── QA pipeline — DESIGN.md extraction (static mode helper) ────────
  //
  // Pull the text out of a <script type="text/design-md"> block in an
  // HTML string. Returns the inner text, or '' when no such block.
  function extractDesignMd(htmlText) {
    if (typeof htmlText !== 'string') { return ''; }
    var rx = /<script[^>]*type\s*=\s*["']text\/design-md["'][^>]*>([\s\S]*?)<\/script>/i;
    var m = htmlText.match(rx);
    return m ? m[1].trim() : '';
  }

  // Pull all inlined <style> CSS text out of an HTML string.
  function extractCss(htmlText) {
    if (typeof htmlText !== 'string') { return ''; }
    var rx = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    var chunks = [];
    var m;
    while ((m = rx.exec(htmlText)) !== null) {
      chunks.push(m[1]);
      if (chunks.length > 100) { break; }
    }
    return chunks.join('\n');
  }

  // px value of a CSS length string ('16px' -> 16). Returns 0 for a
  // non-px / unparseable value.
  function pxOf(value) {
    if (typeof value !== 'string') { return 0; }
    var m = value.match(/^([0-9.]+)px$/);
    return m ? parseFloat(m[1]) : 0;
  }

  function errMsg(e) {
    return (e && e.message) ? String(e.message) : String(e);
  }

  // ── QA pipeline — runGates (DOM mode) ──────────────────────────────
  //
  // Run all 7 gates against a live Document (DOM + computed styles
  // available). `pageId` is optional — when supplied it keys the
  // loop-detection Map. Returns a QaReport (spec §10.2).
  function runGates(documentOrRoot, pageId) {
    var doc = documentOrRoot
      || (typeof document !== 'undefined' ? document : null);
    if (!doc || !doc.querySelectorAll) {
      // Defensive — a non-DOM argument. Return a single ERROR-ish gate
      // rather than throwing (the runner never crashes the caller).
      return {
        ok: false,
        mode: 'dom',
        gates: [makeGate('runner', 'P1', 'FAIL',
          'runGates was not given a Document / DOM root.',
          'Pass document, or use runGatesOnHtml(htmlText).')],
        loop: { gate: 'runner', failedTwice: false }
      };
    }
    var gates = [
      gateNoNestedScrollbarsDom(doc),
      gateContrastDom(doc),
      gateReducedMotionDom(doc),
      gatePrintCssDom(doc),
      gateSemanticHtmlDom(doc),
      gateBannedColorDom(doc),
      gateBannedFontDom(doc)
    ];
    return assembleReport(gates, 'dom', pageId);
  }

  // ── QA pipeline — runGatesOnHtml (static mode) ─────────────────────
  //
  // Run all 7 gates against an HTML string (no layout). Gates that need
  // computed styles degrade to text-pattern checks and say so in their
  // result (WARN instead of FAIL/PASS where they cannot be definitive).
  // Works in Node (no `document`) — used by a CLI --qa step.
  function runGatesOnHtml(htmlText, pageId) {
    if (typeof htmlText !== 'string') {
      return {
        ok: false,
        mode: 'static',
        gates: [makeGate('runner', 'P1', 'FAIL',
          'runGatesOnHtml was not given an HTML string.', '')],
        loop: { gate: 'runner', failedTwice: false }
      };
    }
    var cssText = extractCss(htmlText);
    var gates = [
      gateNoNestedScrollbarsStatic(cssText),
      gateContrastStatic(htmlText),
      gateReducedMotionStatic(cssText),
      gatePrintCssStatic(cssText),
      gateSemanticHtmlStatic(htmlText),
      gateBannedColorStatic(htmlText),
      gateBannedFontStatic(htmlText)
    ];
    return assembleReport(gates, 'static', pageId);
  }

  // Build the QaReport: ok is true iff every P1 gate passed (a P1 WARN
  // does NOT fail the report — it is advisory; only a P1 FAIL does).
  function assembleReport(gates, mode, pageId) {
    var ok = true;
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].priority === 'P1' && gates[i].status === 'FAIL') {
        ok = false;
      }
    }
    return {
      ok: ok,
      mode: mode,
      gates: gates,
      loop: detectLoop(gates, pageId)
    };
  }

  // ── TOC scroll-spy runtime (spec §11) ──────────────────────────────
  //
  // When the doc has a `.vc-toc`, an IntersectionObserver highlights the
  // anchor link of whichever section is currently in view. Degrades to
  // plain anchor links with JS off (this code simply does not run) and
  // to plain links when IntersectionObserver is absent. This is the one
  // place report-doc touches IntersectionObserver.
  var _tocObserver = null;

  function initTocScrollSpy(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) { return; }
    var toc = d.querySelector('.vc-toc');
    if (!toc) { return; }
    var links = toc.querySelectorAll('a[href^="#"]');
    if (!links.length) { return; }

    // Map each target id -> its TOC link, so the observer can highlight.
    var linkById = {};
    var targets = [];
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var id = href.charAt(0) === '#' ? href.slice(1) : '';
      if (!id) { continue; }
      var target = d.getElementById(id);
      if (!target) { continue; }
      linkById[id] = links[i];
      targets.push(target);
    }
    if (!targets.length) { return; }

    // No IntersectionObserver -> plain links (the fail-safe: links still
    // work, just no active highlight).
    if (typeof IntersectionObserver === 'undefined') { return; }

    function clearActive() {
      for (var k = 0; k < links.length; k++) {
        links[k].classList.remove('vc-toc-active');
      }
    }

    _tocObserver = new IntersectionObserver(function (entries) {
      // Highlight the first entry currently intersecting (top-most).
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          var tid = entries[j].target.id;
          if (linkById[tid]) {
            clearActive();
            linkById[tid].classList.add('vc-toc-active');
          }
          break;
        }
      }
    }, { rootMargin: '0px 0px -65% 0px', threshold: 0 });

    for (var t = 0; t < targets.length; t++) {
      _tocObserver.observe(targets[t]);
    }
  }

  // ── init / refresh — wire the in-page runtime ──────────────────────

  function init(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    initTocScrollSpy(d);
  }

  // Re-scan after dynamic DOM insertion — rebuilds the scroll-spy
  // observer (an already-highlighted link keeps its class until the
  // next intersection, so no flash).
  function refresh(root) {
    var d = root || (typeof document !== 'undefined' ? document : null);
    if (!d) { return; }
    if (_tocObserver) {
      try { _tocObserver.disconnect(); } catch (e) { /* noop */ }
      _tocObserver = null;
    }
    initTocScrollSpy(d);
  }

  // ── Public API + dual export ───────────────────────────────────────

  var _api = {
    injectReportDocCSS: injectReportDocCSS,
    init: init,
    refresh: refresh,
    runGates: runGates,
    runGatesOnHtml: runGatesOnHtml,
    contrastRatio: contrastRatio,
    resetLoopState: resetLoopState,
    // Constants exposed for tooling / the scaffold engine / tests.
    TEMPLATES: TEMPLATES,
    CALLOUT_VARIANTS: CALLOUT_VARIANTS,
    // Exposed for the dev-browser test (mirrors amvcp-animation's
    // _cssText hook).
    _cssText: CSS_TEXT
  };

  // Browser global.
  if (typeof window !== 'undefined') {
    window.amvcpReportDoc = _api;
    // Test hook — exposes a re-init handle + the raw helpers so the
    // dev-browser suite can drive the module deterministically (mirrors
    // window.__veAnimation / window.__veDesignMd).
    window.__veReportDoc = {
      init: init,
      refresh: refresh,
      injectReportDocCSS: injectReportDocCSS,
      runGates: runGates,
      runGatesOnHtml: runGatesOnHtml,
      contrastRatio: contrastRatio,
      resetLoopState: resetLoopState,
      isBannedColor: isBannedColor,
      isBannedFontStack: isBannedFontStack,
      parseColor: parseColor,
      get cssInjected() {
        return !!(document.getElementById
          && document.getElementById(STYLE_ID));
      }
    };

    // Self-init on DOMContentLoaded — UNLESS the host opted out via
    // window.__vcReportDocManualInit (a scaffold engine / the runtime /
    // the test fixture sets this so it controls the
    // CSS-inject -> init ordering itself).
    if (!window.__vcReportDocManualInit) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          injectReportDocCSS(document);
          init(document);
        });
      } else {
        injectReportDocCSS(document);
        init(document);
      }
    }
  }

  // Node / CommonJS export — for the test harness and a CLI --qa step.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
