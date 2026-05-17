/*!
 * ai-maestro-visual-communicator-plugin interactive selection runtime.
 *
 * Embed this script (inline or referenced) in every generated HTML page so
 * a single click on any element marked with `data-ve-id` returns the
 * selection to the calling agent and closes the window.
 *
 * Marking elements:
 *   <div data-ve-id="card-auth"
 *        data-ve-type="card"
 *        data-ve-label="Auth service">…</div>
 *
 *   - data-ve-id    (required) opaque identifier the agent receives back
 *   - data-ve-type  (optional) category hint: card, table-row, table-cell,
 *                   chart-point, mermaid-node, slide, file, kpi, timeline,
 *                   section, etc.
 *   - data-ve-label (optional) human-readable label shown to the user;
 *                   defaults to the element's trimmed text content
 *   - data-ve-data  (optional) JSON string with extra context the agent
 *                   should receive (e.g. row/col indices, file path, value)
 *
 * Mermaid integration:
 *   In a Mermaid diagram body, append `click <NodeId> call veSelectMermaid("<NodeId>","<Label>")`
 *   for every node you want clickable. veSelectMermaid is exposed on window.
 *
 * Chart.js integration:
 *   After `new Chart(...)`, call `veWireChart(chartInstance, {id: "revenue"})`.
 *
 * Custom payloads:
 *   Call `window.veSelect({id, type, label, data})` from any handler.
 *
 * Math / LaTeX:
 *   <span class="ve-math">E = mc^2</span>            (inline)
 *   <div  class="ve-math ve-math--block">\int_0^1 x^2\,dx = \tfrac13</div>
 *   <span class="ve-math ve-math--chem">H2O + CO2 -> H2CO3</span>
 *   <span class="ve-math" data-tex="\\sum_{i=1}^n i^2">…fallback…</span>
 *
 *   The runtime lazy-loads KaTeX (+ mhchem for --chem) from CDN the first
 *   time any `.ve-math` / `[data-ve-math]` element is found, renders each,
 *   and tags it as `data-ve-type="math-formula"` so a click selects the
 *   whole formula. Mouse text-highlighting inside a rendered formula
 *   activates the snippet popup with `type=math-snippet`; the payload
 *   includes the visible selection plus the full formula's LaTeX so the
 *   agent can act on a single variable / sub-term.
 *
 * TikZ diagrams (chemistry structures, physics, thermodynamic cycles, Venn,
 * geometry, circuits, Feynman, anything TikZ can express):
 *   <div class="ve-tikz">
 *     \begin{tikzpicture}
 *       \draw (0,0) circle (1cm);
 *     \end{tikzpicture}
 *   </div>
 *
 *   Lazy-loads TikZJax (a WASM port of TikZ) from CDN the first time any
 *   `.ve-tikz` / `[data-ve-tikz]` element is found. Includes pgfplots,
 *   chemfig (\chemfig{H_2O}), physics, circuitikz, tkz-euclide, and most
 *   common TikZ libraries. The rendered <svg> output replaces the wrapper.
 *   Each rendered diagram becomes `data-ve-type="tikz-diagram"` (whole
 *   diagram click) and mouse-highlight inside its SVG fires the snippet
 *   popup with `type=tikz-snippet` carrying the user's visible selection
 *   plus the full TikZ source.
 *
 * Directed graphs (Graphviz / DOT, lazy-loaded via viz.js WASM):
 *   <div class="ve-graph" data-ve-graph-engine="dot">
 *     digraph G {
 *       rankdir=LR;
 *       start  [id="ve-node-start",  label="Start"];
 *       proc   [id="ve-node-proc",   label="Process"];
 *       done   [id="ve-node-done",   label="Done"];
 *       start -> proc -> done;
 *       proc  -> start [id="ve-edge-loop", label="retry"];
 *     }
 *   </div>
 *
 *   Lazy-loads @viz-js/viz (~1 MB WASM) the first time a `.ve-graph`
 *   element is found, renders the DOT source to SVG via `dot` (default,
 *   best for directed graphs) or any other Graphviz engine via the
 *   `data-ve-graph-engine` attribute (`dot | neato | fdp | sfdp | circo |
 *   twopi | osage | patchwork`). After render, the runtime walks the SVG
 *   and any `<g class="node">` / `<g class="edge">` whose DOT id starts
 *   with `ve-` becomes a `data-ve-id` selectable (`graph-node` /
 *   `graph-edge`). The whole graph is selectable by clicking outside any
 *   tagged node/edge. When even `dot` doesn't produce a clean layout,
 *   fall back to the manual-grid pattern: a `.ve-tikz` wrapper with
 *   `\node at (col, row) {...};` + `\draw[rounded corners]` for
 *   Manhattan-routed edges, plus `data-ve-tikz-regions` for semantic
 *   node selection.
 *
 * Semantic geometric regions over TikZ diagrams:
 *   <div class="ve-tikz"
 *        data-ve-tikz-viewbox="-1 -6 10 9"
 *        data-ve-tikz-regions='[
 *          {"id":"square-hyp", "label":"Square upon the hypotenuse",
 *           "shape":"polygon",
 *           "points":[[5,3],[2,7.2],[-1.83,4.2],[1.17,0]]},
 *          {"id":"incircle", "label":"Incircle of triangle ABC",
 *           "shape":"circle","cx":2.5,"cy":1,"r":0.8}
 *        ]'>
 *     \begin{tikzpicture}…\end{tikzpicture}
 *   </div>
 *
 *   The runtime waits for TikZJax to render, then overlays an invisible
 *   <svg> with one shape per region. Hover highlights the region; click
 *   returns the SEMANTIC identity (regionId + label) to the agent — never
 *   "path[d=…]" without meaning. Payload type is `geometric-region` and
 *   includes the full TikZ source for context. Regions take precedence
 *   over the whole-diagram click because the runtime resolves the
 *   innermost [data-ve-id] ancestor at the click target.
 *
 *   Add `data-ve-tikz-debug="1"` to draw the regions visibly so the
 *   author can verify they line up with the rendered geometry.
 *
 * Prose mode (paragraph numbering + text-snippet selection):
 *   <article data-ve-prose>
 *     <h1>Title</h1>
 *     <p>Lead paragraph…</p>
 *     <h2>Section</h2>
 *     <p>Content…</p>
 *   </article>
 *
 *   Inside [data-ve-prose] the runtime walks the DOM, assigns hierarchical
 *   numbers (1, 1.1, 1.1.1, 1.1.2 …) to each heading and paragraph, and
 *   inserts a small monospace marker at the start of each. Every numbered
 *   element becomes a selectable [data-ve-id] (type=section / paragraph)
 *   so a click selects the whole element.
 *
 *   When the user highlights a text snippet (mouse selection) inside the
 *   prose container, a floating "Ask about this snippet" button appears
 *   above the selection. Clicking it submits:
 *     { id: "ve-snippet-<pnum>-<n>", type: "text-snippet",
 *       label: "<truncated snippet>",
 *       data: { text, paragraphId, paragraphNumber, paragraphText } }
 *
 * Table-as-question (form selection):
 *   <table data-ve-id="opts" data-ve-type="table-form" data-ve-mode="single|multi"
 *          data-ve-label="Pick one">
 *     <tbody>
 *       <tr data-ve-row-id="opt-1" data-ve-row-label="React">…</tr>
 *       <tr data-ve-row-id="opt-2" data-ve-row-label="Svelte">…</tr>
 *       <tr data-ve-row-id="__text" data-ve-row-text="1"
 *           data-ve-row-label="Other"><td colspan="2">
 *         <input type="text" placeholder="Write something else here:">
 *       </td></tr>
 *     </tbody>
 *   </table>
 *
 *   The runtime injects a leading <th>/<td> with a radio (mode=single) or
 *   checkbox (mode=multi) into every <tr> and a Submit button in the
 *   <tfoot>. Clicking anywhere in a row toggles its control. Typing into
 *   the free-text row auto-selects it. Submit (or Enter inside the text
 *   input) returns:
 *     { id: "<tableId>-submit",
 *       type: "table-form",
 *       label: "<2 options>",
 *       data: { tableId, mode, selected: [{id,label}…], text: "…" | null } }
 *
 * Transport:
 *   The runtime POSTs the selection to /__ve-select on the same origin.
 *   That endpoint is provided by scripts/amvcp-select.py; when the page is
 *   opened directly via file:// the runtime falls back to a copy-to-
 *   clipboard overlay so the user can paste the JSON back to the agent.
 */
(function () {
  if (window.__veInit) return;
  window.__veInit = true;

  // ─── Phase 2 INTEGRATION (TRDD-352ef46a, task #172) ─────────────────
  // The runtime DOES NOT set each module's __*ManualInit flag to true
  // here. Two reasons:
  //   1. Script load order is not guaranteed — render-interactive-
  //      report.py emits modules BEFORE amvcp-runtime.js, so each
  //      module's IIFE evaluates first and registers its own
  //      DOMContentLoaded self-boot before this runtime IIFE has a
  //      chance to flip the flag. Setting the flag here would not
  //      change that registered listener.
  //   2. The brief is explicit: "Set window.__vcManualInit = false (or
  //      simply don't set it true) so each module's own DOMContentLoaded
  //      fallback also works in standalone fixtures."
  // Every module is idempotent on a second init/scan/boot call — chart
  // re-renders to the same SVG, tables guards via document.__veTablesInit,
  // interactive guards via window.__amvcpInteractiveBooted, animation /
  // diagram / icon-svg / slide / wireframe / report-doc all replace their
  // host contents in place — so the runtime's own bootVisualizeModules()
  // pass runs harmlessly alongside each module's self-boot.

  var params = new URLSearchParams(location.search);
  var loc = location.origin || '';
  var isInteractive =
    params.get('ve_select') === '1' ||
    /^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/i.test(loc);
  // A2 (TRDD-5f41ad36) — when the runner could not locate a Chromium
  // binary it appends `&ve_mode=fallback` and opens the page in the
  // user's default browser via webbrowser.open(). window.close() is
  // denied for any tab not opened by JS, so we tell the server to
  // respond with `thanks_url` and we navigate there instead of leaving
  // the user staring at a stale report tab.
  var isFallbackBrowser = params.get('ve_mode') === 'fallback';

  var sending = false;

  function buildOverlay() {
    var el = document.createElement('div');
    el.setAttribute('data-ve-overlay', '');
    el.style.cssText = [
      'position:fixed', 'inset:0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(8,10,14,0.72)',
      'backdrop-filter:blur(6px)', '-webkit-backdrop-filter:blur(6px)',
      'z-index:2147483647',
      'font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif',
      'color:#fff', 'padding:24px', 'text-align:center',
      'animation:veFadeIn 160ms ease-out both'
    ].join(';');
    var card = document.createElement('div');
    card.style.cssText = [
      'background:#15171c',
      'border:1px solid rgba(255,255,255,0.08)',
      'border-radius:14px',
      'padding:24px 28px',
      'max-width:560px',
      'min-width:320px',
      'box-shadow:0 20px 60px rgba(0,0,0,0.5)'
    ].join(';');
    el.appendChild(card);
    document.body.appendChild(el);
    return { root: el, card: card };
  }

  function injectStyles() {
    if (document.getElementById('__ve-styles')) return;
    var s = document.createElement('style');
    s.id = '__ve-styles';
    s.textContent = [
      '@keyframes veFadeIn { from {opacity:0} to {opacity:1} }',
      '@keyframes veSlideUp { from {opacity:0;transform:translateY(4px)} to {opacity:1;transform:translateY(0)} }',
      // ─── Runtime-injected control palette (themable) ─────────────────
      // Every runtime-injected button, control, glyph, toolbar, pill, and
      // modal chrome reads its colour, surface, border, radius, shadow,
      // and font from this namespace. The fallbacks reach into the host
      // page palette FIRST (--surface, --text, --border, --bg, --accent)
      // and only fall back to neutral grey defaults when the host did not
      // expose a palette at all. Set any of these on :root in the host
      // page to brand the runtime UI; set --ve-control-bg:transparent to
      // suppress runtime backgrounds entirely.
      ':root {',
      // ─── DESIGN.md foundation bindings (Phase 1c) ────────────────────
      // The runtime's hundreds of CSS rules read a handful of FOUNDATION
      // tokens — the host palette (--bg/--surface/--text/--text-dim/
      // --border/--border-bright/--accent), --ve-blueprint-bg, and the
      // --ve-* control tokens below. Phase 1c sources each foundation
      // token from the matching DESIGN.md token (--vc-*), keeping the
      // historic hardcoded value as the var() fallback. The DESIGN.md
      // engine (bootDesignMdEngine) always applies a token set — an
      // embedded <script type="text/design-md">, or the built-in
      // DEFAULT_DESIGNMD — so --vc-* are present on :root from frame 1
      // and the fallbacks only matter if the engine script is absent.
      // Hot-swapping a DESIGN.md re-sets the --vc-* values, and because
      // every foundation token is `var(--vc-…)`, the whole page
      // restyles live with no reload. Component CSS rules are NOT
      // rewritten — they keep reading the foundation tokens unchanged.
      //
      // Host palette: --bg/--surface/--text/etc. are consumed by the
      // runtime via `var(--bg, …)` but were never defined here before.
      // Defining them now (sourced from --vc-color-*) is what lets a
      // DESIGN.md drive page background, text colour and surfaces.
      '  --bg: var(--vc-color-canvas, #faf6ee);',
      '  --surface: var(--vc-color-surface, #ffffff);',
      '  --text: var(--vc-color-content, #14110b);',
      '  --text-dim: var(--vc-color-content-muted, #5b5343);',
      '  --border: var(--vc-color-border, #e3dcc9);',
      '  --border-bright: var(--vc-color-border-strong, #c9bfa3);',
      '  --accent: var(--vc-color-accent, #b8861f);',
      // The light-theme blueprint grid + the html background both read
      // --ve-blueprint-bg; bind it to the canvas colour so the page
      // base follows the DESIGN.md.
      '  --ve-blueprint-bg: var(--vc-color-canvas, #faf6ee);',
      // --ve-accent is the single source of truth for the warm "honey
      // brown" tone used by selection cells, code-block borders, hover
      // outlines, etc. EVERY runtime CSS rule ultimately reads this.
      // Phase 1c sources it from --vc-color-accent so a DESIGN.md
      // recolours every accented surface; the hardcoded #b8861f stays
      // as the fallback so calls like `var(--ve-accent, currentColor)`
      // (which exist for backwards compat) never silently fall back to
      // currentColor — which on a light page = near-black text and
      // made hover outlines look black.
      // --ve-accent-dark is a slightly deeper brown used for the
      // outer ring on hover/focus, so the two-tone reads as "warm
      // brown getting deeper outside" instead of "gold inside, black
      // outside". DESIGN.md has no dedicated dark-accent token, so it
      // sources from --vc-color-border-strong (the deepest warm tone
      // in the palette) and keeps #6e4d18 as the fallback.
      '  --ve-accent: var(--vc-color-accent, #b8861f);',
      '  --ve-accent-dark: var(--vc-color-border-strong, #6e4d18);',
      '  --ve-control-bg: var(--vc-color-surface, var(--surface, #ffffff));',
      '  --ve-control-bg-hover: color-mix(in srgb, var(--ve-control-bg, #fff) 88%, var(--ve-accent, var(--accent, #555)) 12%);',
      '  --ve-control-fg: var(--vc-color-content, var(--text, #14110b));',
      '  --ve-control-fg-dim: var(--vc-color-content-muted, var(--text-dim, color-mix(in srgb, var(--ve-control-fg, #14110b) 60%, transparent)));',
      '  --ve-control-border: var(--vc-color-border, var(--border, rgba(0,0,0,0.12)));',
      '  --ve-control-border-strong: var(--vc-color-border-strong, var(--border-bright, color-mix(in srgb, var(--ve-control-border, rgba(0,0,0,0.12)) 100%, var(--ve-control-fg, #14110b) 18%)));',
      '  --ve-control-radius: var(--vc-radius-md, 8px);',
      '  --ve-control-radius-sm: var(--vc-radius-sm, 6px);',
      // Control + code-block fonts follow the DESIGN.md typography.
      // --ve-control-font kept `inherit` as the fallback so a host page
      // with no DESIGN.md engine still inherits its own body font.
      // --ve-control-mono is referenced by the DESIGN.md panel rules
      // (and any code chrome) — bind it to the mono family.
      '  --ve-control-font: var(--vc-font-body, inherit);',
      '  --ve-control-mono: var(--vc-font-mono, ui-monospace, Menlo, monospace);',
      '  --ve-control-shadow: 0 6px 22px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.08);',
      '  --ve-control-shadow-soft: 0 2px 8px rgba(0,0,0,0.10);',
      '  --ve-control-overlay-bg: color-mix(in srgb, var(--bg, #ffffff) 82%, transparent);',
      '  --ve-control-overlay-blur: blur(10px);',
      '  --ve-control-accent-fg: var(--ve-sel-text, #14110b);',
      // ─── Unified hover / selection brightness model ──────────────────
      // Per the user spec, ALL selectable elements (HTML divs/rows/cards,
      // SVG graphviz nodes, table-form rows, prose paragraphs, etc.) use
      // the SAME visual language: hover = brightness boost + accent glow,
      // selected = smaller brightness boost (no glow).
      //
      // Three CSS primitives, each handling a different surface:
      //   1. `filter: brightness(N)` on cells — multiplicative, brightens
      //      TEXT (and bg) inside the cell. Critical for visible text-
      //      brightness change because text colour can\'t be lifted any
      //      other way without per-element color overrides.
      //   2. `background-color: rgba(255,255,255,α)` on cells — additive
      //      bg lift. Replaces the `box-shadow: inset 9999px` trick that
      //      caused visible per-cell seams ("tiling bars" the user reported).
      //   3. `box-shadow: 0 0 8px var(--ve-accent)` on the ROW — soft
      //      outer halo around the row\'s bounding box. Replaces the
      //      `filter: drop-shadow` approach that haloed every individual
      //      glyph (made text unreadable per the user\'s screenshot).
      // Defaults match a DARK theme (positive brightness lift + white
      // additive bg overlay). detectAndStampTheme() stamps
      // data-ve-theme="light" on <html> when the page bg is bright, and
      // the :root[data-ve-theme="light"] override below mirrors every
      // value: multiplicative inverse for brightness (so the darkening
      // is perceptually symmetric to the lift on dark themes) and a
      // BLACK additive overlay instead of white. The mirror keeps the
      // selection/hover visual language consistent across themes —
      // dark theme: highlight by lifting toward white. Light theme:
      // highlight by pushing toward black. Same emphasis, opposite
      // direction.
      '  --ve-brightness-hover: 1.30;',
      '  --ve-brightness-selected: 1.15;',
      '  --ve-overlay-hover: rgba(255,255,255,0.10);',
      '  --ve-overlay-selected: rgba(255,255,255,0.05);',
      // Hover GLOW — the signature 3-layer aura: a tight inner ring + a
      // mid-distance halo + a soft long-throw spread, all in the active
      // accent. This is the effect the user remembers as "amazing" —
      // do not flatten back to a single 8px box-shadow.
      '  --ve-glow-hover:',
      '    0 0 0 1px color-mix(in srgb, var(--ve-accent, currentColor) 80%, transparent),',
      '    0 0 8px color-mix(in srgb, var(--ve-accent, currentColor) 65%, transparent),',
      '    0 0 18px color-mix(in srgb, var(--ve-accent, currentColor) 40%, transparent),',
      '    0 0 36px color-mix(in srgb, var(--ve-accent, currentColor) 20%, transparent);',
      // Code-block soft-wrap "extra indent" marker — paints the 2ch
      // hanging-indent zone on wrapped continuation rows in a darker
      // shade so the user can distinguish it from real source-code
      // whitespace. Dark theme: subtractive (push toward black).
      '  --ve-code-wrap-marker: rgba(0,0,0,0.35);',
      // Text-snippet handle (single chip that floats above drag-/multi-click-
      // selected text). Distinct from the gold item-handle so the user can
      // tell ATOMIC-ITEM selection from TEXT-RANGE selection at a glance.
      // Defaults are DARK theme (brighter teal lifted toward white so it
      // reads with equivalent perceived contrast on a near-black bg). The
      // :root[data-ve-theme="light"] block below mirrors with the deeper
      // teal that matches the existing Approve mini-segment color.
      '  --ve-snippet-handle-bg: #5fb09a;',                      // dark theme
      '  --ve-snippet-handle-fg: #0e1a17;',                      // dark theme — deep ink on bright chip
      '  --ve-snippet-highlight: rgba(95,176,154,0.28);',        // additive paint
      '  --ve-snippet-highlight-border: #5fb09a;',
      // Per-element 3-state mini decision switch — symbol colors.
      // Symbols are unicode glyphs (✘ deny, ﹅ skip, ✔︎ approve) that share
      // a SINGLE muted icon color when unselected, then take per-symbol
      // semantic colors when selected (red / blue / green). Background
      // ring tints in the same hue at 15% to keep the segment visible
      // without harsh contrast that previously washed out the glyph.
      // Dark theme defaults (lifted toward white for equivalent contrast).
      '  --ve-decision-mini-icon-fg: color-mix(in srgb, var(--text, #ede5dd) 50%, transparent);',
      '  --ve-decision-skip-symbol: #5fa3d8;',                    // bright blue for dark bg
      '  --ve-decision-approve-symbol: #5fb09a;',                 // bright green/teal for dark bg
      '  --ve-decision-deny-symbol: #d56b4a;',                    // bright red/rust for dark bg
      '}',
      ':root[data-ve-theme="light"] {',
      '  --ve-brightness-hover: 0.77;',     // 1/1.30 — perceptual mirror of dark hover
      '  --ve-brightness-selected: 0.87;',  // 1/1.15 — perceptual mirror of dark selected
      '  --ve-overlay-hover: rgba(0,0,0,0.10);',
      '  --ve-overlay-selected: rgba(0,0,0,0.05);',
      // Light theme: additive on cream — push toward warm brown so the
      // wrap-indent marker visibly contrasts against the page bg.
      '  --ve-code-wrap-marker: rgba(110,77,24,0.22);',
      // Light-theme snippet handle: deep teal #3a6b5c on cream → matches
      // the existing Approve mini-segment color. Subtractive selection
      // paint (alpha tints toward the chip color rather than away).
      '  --ve-snippet-handle-bg: #3a6b5c;',
      '  --ve-snippet-handle-fg: #fbfaf6;',                      // cream text on deep teal
      '  --ve-snippet-highlight: rgba(58,107,92,0.22);',         // subtractive paint
      '  --ve-snippet-highlight-border: #3a6b5c;',
      // Light-theme mini-switch symbol colors — deeper saturated tones
      // for adequate contrast on cream/light backgrounds.
      '  --ve-decision-mini-icon-fg: color-mix(in srgb, var(--text, #1f1a14) 45%, transparent);',
      '  --ve-decision-skip-symbol: #3464a8;',                    // deep blue for light bg
      '  --ve-decision-approve-symbol: #3a6b5c;',                 // deep teal-green for light bg
      '  --ve-decision-deny-symbol: #a84a32;',                    // deep rust-red for light bg
      '}',
      // Headings on light pages: 8% darker than the inner-border accent.
      // Same tonal family but reads as the next step down on the warm
      // brown ramp (border accent → heading → outer dark ring). Page
      // authors can override per-page by setting `--ve-heading` on :root
      // or by adding their own h1/h2/h3 rule.
      ':root[data-ve-theme="light"] h1,',
      ':root[data-ve-theme="light"] h2,',
      ':root[data-ve-theme="light"] h3 {',
      '  color:var(--ve-heading, color-mix(in srgb, var(--ve-accent, #b8861f) 92%, black 8%));',
      '}',
      // Page background MUST extend across the full document, not just
      // the initial viewport. Painting body alone breaks when content
      // is wider than the viewport (tables, code blocks, diagrams) —
      // the area past the body's right edge shows the OS native theme
      // color (often pure black on dark macOS). Paint `html` so the
      // bg covers the entire document box at all scroll positions.
      // body inherits its color via transparent so the html bg shows.
      'html { background-color:var(--bg, var(--ve-blueprint-bg, #faf6ee)); }',
      // Light-theme grid overlay — inverted-blueprint look on a cream
      // base. Applied to html so it spans the full document.
      ':root[data-ve-theme="light"] {',
      '  background-image:',
      '    linear-gradient(to right, color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px),',
      '    linear-gradient(to bottom, color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px);',
      '  background-color:var(--ve-blueprint-bg, #faf6ee);',
      '  background-size:24px 24px;',
      '}',
      ':root[data-ve-theme="light"] body {',
      '  background:transparent !important;',
      '}',
      // Dark theme: also propagate the page bg from body to html so
      // horizontal scrolling never reveals the OS native black.
      ':root[data-ve-theme="dark"] body { background:transparent !important; }',
      // ─── No nested scrollbars (~/.claude/rules/no-nested-scrollbars.md) ─
      // Wide content (tables, code blocks, diagrams, ASCII art, file
      // trees) must extend the document width — never trapped inside an
      // inner scrollview. The reader gets the ONE outer scrollbar pair;
      // inner ones break find-in-page, screen-readers, screenshots, and
      // the side-by-side comparison reading mode.
      //
      // Force `overflow:visible` + `max-width:none` on the offenders.
      // !important wins over inline styles + 3rd-party stylesheets that
      // ship with the `overflow-x:auto` "responsive table / code" trick.
      'pre, table, .ve-content-block,',
      '[data-ve-block], [data-ve-graph], [data-ve-table-wrapper] {',
      '  overflow:visible !important;',
      '  max-width:none !important;',
      '}',
      // The classic "table-as-block" responsive trick (`table { display:',
      // block; overflow-x: auto }`) forces table to be a block scroller.',
      // Revert to default table layout so the table can extend.',
      'table { display:table !important; }',
      // Outer scrollers stay on the document. Horizontal scroll appears
      // on the root window when content is wider than the viewport.
      'html, body { overflow-x:auto; }',
      // Reserve enough left-padding on body so the floating
      // .ve-comment-handle (28px wide, sits at left:-40px from its
      // parent atom — paragraph, row, list-item) never gets clipped
      // against the viewport edge in narrow viewports. The handle
      // needs ≥40px of breathing room to its parent\'s left; with
      // 48px body padding-left + 4px parent default = clean display.
      // Renderer ships body with padding:32px 24px — overrides the
      // horizontal axis only, keeping vertical 32px untouched.
      'body { padding-left:48px !important; padding-right:24px !important; }',
      // Renderer-supplied <main> often has `max-width: 86ch`. Lift the
      // ceiling so wide content can push the column open.
      'main, .ve-main { max-width:none !important; }',
      // ─── Table styling (TRDD-3d1570ab R2) ──────────────────────────
      // Tables MUST look like tables: visible cell borders, header
      // divider, alternating zebra rows. The renderer emits clean
      // <table><thead><tr><th>...<tbody><tr>...; the runtime layers
      // the visual chrome on top so any markdown-rendered table
      // inherits the look. Borders use the warm accent palette so
      // they sit inside the brown grid theme.
      'table {',
      '  border-collapse:collapse;',
      '  border:1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 35%, transparent);',
      // RESPONSIVE: fill available width, let auto-layout distribute
      // remaining space across columns. The chip column is fixed at 86px
      // so File / Component get the rest. `max-width:none !important`
      // (above) keeps the option to extend if content REQUIRES it (long
      // unwrappable strings), but width:100% prevents the table from
      // being wider than viewport when content CAN wrap.
      '  width:100%;',
      '}',
      'th, td {',
      '  border:1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 22%, transparent);',
      '  padding:8px 12px;',
      '  vertical-align:top;',
      // Allow long unbreakable strings (file paths, URLs, hashes) to
      // wrap mid-token instead of forcing the table wider than viewport.
      // `overflow-wrap:anywhere` is the modern, well-supported way.
      '  overflow-wrap:anywhere;',
      '  word-break:break-word;',
      '}',
      'thead th {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent);',
      '  border-bottom:2px solid var(--ve-accent, #b8861f);',
      '  text-align:left;',
      '  font-weight:600;',
      '}',
      // Zebra rows — every OTHER body row gets a subtle accent tint
      // so the eye can follow rows across wide tables. Tint is small
      // (6%) to stay readable in both themes.
      'tbody tr:nth-child(even) {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 6%, transparent);',
      '}',
      // ─── Universal selectable atoms (TRDD-3d1570ab R3+R6) ─────────
      // <tr>, <li>, <p data-ve-comment-id> are the SELECTABLE atoms
      // in any rendered document. Hover lifts the bg, pressed (in
      // veSelection) gives the warm brown selected highlight. Cursor
      // becomes pointer to advertise interactivity.
      'tr[data-ve-comment-id], li[data-ve-comment-id], p[data-ve-comment-id] {',
      '  cursor:pointer;',
      '  transition:background 120ms ease, box-shadow 120ms ease, outline-color 120ms ease;',
      '}',
      // ─── 3-state visual model (normal · selected ±Δ · hover ±Δ + glow) ───
      // Per the user spec: every interactive atom has THREE visually
      // distinct states. The selected delta is a clear bg/outline shift;
      // hover ALWAYS adds an outer glow on top of whatever bg state is
      // currently active. This means hover-over-selected reads as
      // "selected AND focused" — distinct from both plain selected and
      // plain hovered.
      //
      // STATE 2: Hover UNSELECTED — soft bg + outer glow halo.
      'tr[data-ve-comment-id]:hover:not([data-ve-pressed="1"]) {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent) !important;',
      '  box-shadow:0 0 10px color-mix(in srgb, var(--ve-accent, #b8861f) 45%, transparent);',
      '}',
      'li[data-ve-comment-id]:hover:not([data-ve-pressed="1"]),',
      'p[data-ve-comment-id]:hover:not([data-ve-pressed="1"]) {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent);',
      '  box-shadow:0 0 10px color-mix(in srgb, var(--ve-accent, #b8861f) 45%, transparent);',
      '}',
      // STATE 3: Selected — strong bg tint + visible accent outline,
      // NO glow (glow is reserved for hover). The outline + brighter
      // bg makes "selected" unambiguous against both "normal" and
      // "hover".
      'tr[data-ve-pressed="1"], li[data-ve-pressed="1"], p[data-ve-pressed="1"] {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 32%, transparent) !important;',
      '  outline:1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 70%, transparent);',
      '  outline-offset:2px;',
      '}',
      // STATE 4: Hover OVER selected — strongest bg + outline + glow.
      // Reads as "I\'m hovering an already-selected item" — clicks would
      // toggle off, so the visual must clearly say "this is the one
      // you\'re about to act on AND it\'s already selected".
      'tr[data-ve-pressed="1"]:hover, li[data-ve-pressed="1"]:hover, p[data-ve-pressed="1"]:hover {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 40%, transparent) !important;',
      '  outline:2px solid color-mix(in srgb, var(--ve-accent, #b8861f) 85%, transparent);',
      '  outline-offset:2px;',
      '  box-shadow:0 0 14px color-mix(in srgb, var(--ve-accent, #b8861f) 55%, transparent);',
      '}',
      // Tables get an ALWAYS-ON outer ring — per the universal selection
      // model, a table is NOT a selectable atom (only its rows are), so
      // a selection-conditional outline gives the wrong cue. The ring
      // is purely decorative chrome that frames the data; rows light up
      // independently when pressed via their own data-ve-pressed paint.
      'table {',
      '  outline:2px solid var(--ve-accent-dark, #6e4d18);',
      '  outline-offset:3px;',
      '}',
      // Other containers (lists, sections, finding bodies) keep the
      // selection-driven ring because their child atoms (li / p) are
      // grouped into the comment-handle anchor — the ring helps the user
      // see "this group of paragraphs is what the gold handle refers to".
      'ul:has(li[data-ve-pressed="1"]),',
      'ol:has(li[data-ve-pressed="1"]),',
      'section:has(> p[data-ve-pressed="1"]),',
      '.ve-finding-body:has(> p[data-ve-pressed="1"]) {',
      '  outline:2px solid var(--ve-accent-dark, #6e4d18);',
      '  outline-offset:3px;',
      '}',
      // The single per-group handle: same compact rounded-rect chip as
      // the code-block handle. Position is absolute relative to the
      // container (set inline by updateGroupCommentHandles).
      '.ve-group-handle {',
      '  position:absolute; left:-32px;',
      '  width:28px; height:22px;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '  border:0; border-radius:6px; padding:0;',
      '  font:600 13px/1 ui-sans-serif,system-ui,sans-serif;',
      '  cursor:pointer;',
      '  box-shadow:0 3px 10px rgba(0,0,0,0.24);',
      '  transform:translateY(-50%);',
      '  z-index:2;',
      '  animation:veFadeIn 120ms ease;',
      '}',
      '.ve-group-handle:hover { filter:brightness(1.08); }',
      '[data-ve-id] { cursor:pointer; transition:outline-color 120ms ease, box-shadow 120ms ease, filter 120ms ease; }',
      // HTML elements with [data-ve-id]: rectangular outline on hover —
      // matches their bbox geometry (cards, table rows, divs, etc.).
      // Phase 1 of multi-select overhaul: hover and selected use the
      // SAME accent colour (`--ve-accent`, page-overridable; defaults to
      // currentColor for backwards compat). Hover adds a soft drop-shadow
      // glow in the same colour; selected has a solid outline without
      // the glow. This way the user sees one consistent "highlight"
      // colour and the glow distinguishes "hover" from "already selected".
      //
      // The glow blur radius is small (4px) on purpose — wider blurs
      // become a smeary band on long edges instead of a soft halo, and
      // pages can always override per-element via their own CSS.
      // Exclude data-ve-type="table-form" from these table-level hover /
      // selected rules. Those tables are CONTAINERS with their own
      // checkbox-based selection model (each <tr> has an injected
      // <input data-ve-control> + .ve-form-glyph), so the table itself
      // must NOT participate in click-to-select. Without this exclusion,
      // hovering anywhere inside a table-form table makes the entire
      // <table data-ve-id="…"> match [data-ve-id]:hover and a CSS
      // filter:drop-shadow is applied to it. CSS filters cascade visually
      // to every descendant, so all text + every row appears to "glow"
      // — exactly the bug the user reported.
      // HTML hover: outline + multiplicative brightness (text) + additive
      // bg tint via background-color + outer accent glow via box-shadow.
      // Box-shadow combines the outline-style ring AND the soft outer
      // halo so they read as ONE highlight.
      // CONTAINER EXCLUSION RULE (user contract): a CONTAINER whose
      // children are atoms (table → rows; pre → code-lines) must NEVER
      // itself be a selection atom — otherwise hovering the table
      // glows the whole thing AND clicks bubble up so child rows/lines
      // become unclickable. `:not(table):not(pre)` enforces this. The
      // table/pre may still carry data-ve-id for internal bookkeeping
      // (column-highlight rules, etc.) but the GLOBAL hover/select
      // effect is suppressed on them. Their child rows/lines have
      // their own data-ve-comment-id / data-ve-id and remain fully
      // interactive.
      '[data-ve-id]:not([data-ve-type="table-form"]):not(table):not(pre):hover {',
      '  outline:2px solid var(--ve-accent, currentColor); outline-offset:3px;',
      '  background-color: var(--ve-overlay-hover);',
      '  box-shadow: var(--ve-glow-hover);',
      '  filter: brightness(var(--ve-brightness-hover));',
      '}',
      '[data-ve-id]:not([data-ve-type="table-form"]):not(table):not(pre):focus-visible {',
      '  outline:2px solid var(--ve-accent, currentColor); outline-offset:3px;',
      '}',
      // HTML selected: outline + smaller brightness + smaller bg tint, no glow.
      '[data-ve-id]:not([data-ve-type="table-form"]):not(table):not(pre)[data-ve-selected="1"] {',
      '  outline:2px solid var(--ve-accent, currentColor); outline-offset:3px;',
      '  background-color: var(--ve-overlay-selected);',
      '  filter: brightness(var(--ve-brightness-selected));',
      '}',
      // Hover-on-selected: heavier overlay + heavier brightness + glow.
      '[data-ve-id]:not([data-ve-type="table-form"]):not(table):not(pre)[data-ve-selected="1"]:hover {',
      '  background-color: var(--ve-overlay-hover);',
      '  box-shadow: var(--ve-glow-hover);',
      '  filter: brightness(var(--ve-brightness-hover));',
      '}',
      // SVG elements (Graphviz nodes/edges, geometric regions, etc.):
      // a rectangular outline around a circle / arrow / path looks wrong,
      // so suppress it and highlight the actual SHAPE instead. The
      // brightness filter is the safe default that preserves the original
      // colour palette; page-level CSS like `.ve-graph .node:hover circle`
      // wins on specificity for palette-specific recolouring.
      'svg [data-ve-id]:hover, svg [data-ve-id]:focus-visible, svg [data-ve-id]:hover *, svg [data-ve-id]:focus-visible *, svg [data-ve-id][data-ve-selected="1"], svg [data-ve-id][data-ve-selected="1"] * { outline:none !important; }',
      // Hover: brightness boost + soft glow (drop-shadow). The brightness
      // factor and the glow primitive both come from the unified :root
      // vars so SVG hover matches HTML hover perceptually.
      'svg g[data-ve-id]:hover > circle,',
      'svg g[data-ve-id]:hover > ellipse,',
      'svg g[data-ve-id]:hover > polygon,',
      'svg g[data-ve-id]:hover > rect,',
      'svg g[data-ve-id]:hover > path,',
      'svg g[data-ve-id]:hover > polyline { filter: brightness(var(--ve-brightness-hover)) drop-shadow(0 0 4px var(--ve-accent, currentColor)); }',
      // Selected: lighter brightness boost (same primitive), no glow —
      // glow stays reserved for hover.
      'svg g[data-ve-id][data-ve-selected="1"] > circle,',
      'svg g[data-ve-id][data-ve-selected="1"] > ellipse,',
      'svg g[data-ve-id][data-ve-selected="1"] > polygon,',
      'svg g[data-ve-id][data-ve-selected="1"] > rect,',
      'svg g[data-ve-id][data-ve-selected="1"] > path,',
      'svg g[data-ve-id][data-ve-selected="1"] > polyline { filter: brightness(var(--ve-brightness-selected)); }',
      // Hover-on-selected: the user is hovering an element they already
      // picked. Re-introduce the glow so the cursor still feels reactive
      // even on selected items. Without this combined-selector rule the
      // selected-only filter wins (same specificity as :hover, declared
      // later in the cascade) and the glow vanishes when the mouse moves
      // back over an already-selected element.
      'svg g[data-ve-id][data-ve-selected="1"]:hover > circle,',
      'svg g[data-ve-id][data-ve-selected="1"]:hover > ellipse,',
      'svg g[data-ve-id][data-ve-selected="1"]:hover > polygon,',
      'svg g[data-ve-id][data-ve-selected="1"]:hover > rect,',
      'svg g[data-ve-id][data-ve-selected="1"]:hover > path,',
      'svg g[data-ve-id][data-ve-selected="1"]:hover > polyline { filter: brightness(var(--ve-brightness-hover)) drop-shadow(0 0 4px var(--ve-accent, currentColor)); }',
      // Edge groups have a path + an arrowhead polygon. Hover and selected
      // both thicken; only hover adds the glow (handled by the rules above).
      'svg g.edge[data-ve-id]:hover > path { stroke-width: 2.4; opacity: 1; }',
      'svg g.edge[data-ve-id]:hover > polygon { opacity: 1; }',
      'svg g.edge[data-ve-id][data-ve-selected="1"] > path { stroke-width: 2.4; opacity: 1; }',
      'svg g.edge[data-ve-id][data-ve-selected="1"] > polygon { opacity: 1; }',
      // The hit-area twin path we inject (data-ve-hit="1") MUST stay
      // permanently invisible — never inherits hover stroke / filter from
      // page-level CSS. Without these !important resets, page CSS like
      // `.ve-graph svg .edge:hover path { stroke: var(--gold); }` would
      // override the twin\'s `stroke="transparent"` SVG attribute (CSS
      // wins over presentation attributes), leaving TWO overlapping gold
      // lines at the same coordinates → user sees a fat double / dashed
      // edge instead of a clean highlight.
      'svg path[data-ve-hit="1"] { stroke: transparent !important; fill: none !important; filter: none !important; }',
      // Phase 2/3 — default highlight for multi-click text selections.
      //
      // The text colour is FORCED to a near-black tone (`--ve-sel-text`)
      // because the highlight background is always a tint of the page's
      // accent colour. When the accent is gold/amber/orange (a common
      // editorial choice) and the page text is also a warm tone (e.g.
      // dark mode using `--gold` for body text shadows), the page text
      // colour and highlight tint sit close on the colour wheel and
      // selected text becomes nearly unreadable. Forcing the selected
      // text to near-black guarantees high contrast on every accent
      // because the highlight tint, by being mixed with `transparent`,
      // is always the LIGHTER end of the accent's luminosity range — and
      // black contrasts well against any light tint regardless of hue.
      //
      // Pages that need to override (e.g. a dark-on-dark accent palette
      // where black would be invisible) can set --ve-sel-text on :root
      // to any contrasting tone.
      ':root { --ve-sel-text: #14110b; }',
      '.ve-text-sel {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 32%, transparent);',
      '  color: var(--ve-sel-text);',
      '  border-radius: 2px;',
      '  padding: 0 1px;',
      '  cursor: text;',
      '}',
      // Phase 3 — block-level highlight for depths 4-7 (paragraph,
      // section, chapter, all). Lighter background than .ve-text-sel
      // because it covers a much larger area and darker tones become
      // overpowering. The data-ve-text-sel-block attribute carries the
      // entryId, so multiple block selections can co-exist with
      // independent IDs. Same forced text colour as .ve-text-sel.
      '[data-ve-text-sel-block] {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent);',
      '  color: var(--ve-sel-text);',
      '  border-radius: 4px;',
      '  outline: 1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 50%, transparent);',
      '  outline-offset: 2px;',
      '}',
      // Block-level selections recursively repaint descendant elements
      // so their inherited colours don\'t override --ve-sel-text. Without
      // this rule, a paragraph painted at depth 4 would have black
      // outline + accent tint + still-original text colour because the
      // paragraph\'s child elements (links, code spans, .ve-math nodes)
      // each set their own `color`.
      '[data-ve-text-sel-block] *:not([data-ve-pnum]) { color: inherit; }',
      // Phase 3 — math sub-formula highlight for depths 1-3 inside
      // .ve-math (atom, group, whole formula). Slightly brighter than the
      // block highlight (since math atoms are tiny and need a sharper
      // contrast to read), but still lighter than the prose .ve-text-sel
      // because the highlight sits on top of KaTeX-rendered glyphs that
      // can themselves be small. The selector is intentionally generic
      // (not scoped to .ve-math) so it works even if the page wraps math
      // in [data-ve-math] without the .ve-math class.
      '[data-ve-math-sel] {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 24%, transparent);',
      '  color: var(--ve-sel-text);',
      '  border-radius: 3px;',
      '  outline: 1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent);',
      '  outline-offset: 1px;',
      '}',
      // KaTeX renders glyphs with explicit `color` on inner spans (italic
      // variables, operator glyphs, etc.). Force descendant inherit so
      // the math selection actually wins.
      '[data-ve-math-sel] * { color: inherit; }',
      // Phase 3 — code highlight for <pre>/<code> blocks. Token (depth 1)
      // and line (depth 2) selections are inline; block (depth 3) wraps
      // the whole <pre>. Outline is brighter than the math selection
      // because syntax-highlighted code typically already uses many
      // colours, and a faint outline gets lost.
      '[data-ve-code-sel] {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 22%, transparent);',
      '  color: var(--ve-sel-text);',
      '  border-radius: 3px;',
      '  outline: 1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 65%, transparent);',
      '  outline-offset: 1px;',
      '}',
      // Prism / highlight.js use explicit `color` on per-token spans.
      // Force descendants to inherit so the selection wins regardless of
      // the syntax-highlight palette.
      '[data-ve-code-sel] * { color: inherit; }',
      // Block-level <pre> selection paints the whole block. Slightly
      // darker tint than the inline code-sel because it covers a much
      // larger area (full code block vs single token).
      '[data-ve-code-sel-block] {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent);',
      '  color: var(--ve-sel-text);',
      '  border-radius: 6px;',
      '  outline: 1.5px solid color-mix(in srgb, var(--ve-accent, #b8861f) 55%, transparent);',
      '  outline-offset: 3px;',
      '}',
      '[data-ve-code-sel-block] * { color: inherit; }',
      // Mermaid nodes (handled separately because their .node class isn\'t
      // wrapped in [data-ve-id] until veSelectMermaid is wired):
      '.mermaid .node { cursor:pointer; }',
      '.mermaid .node:hover > * { filter:brightness(1.15); }',
      '[data-ve-overlay] button { font:inherit; }',
      // Paragraph-number marker in prose mode. Sized BIGGER than the
      // body text (1.05em) and bold, because monospace glyphs render
      // visually shorter than serif at the same point size — without the
      // size bump the marker sits below the baseline and looks like a
      // weak afterthought. The opacity stays modest (0.55) so the marker
      // still recedes when the reader is focused on the prose; hover
      // brightens it to 0.95 to confirm it\'s clickable.
      // Numbering marker is INLINE — same font as the text it precedes,
      // no border, no background, no monospace shift. The reader sees
      // "1.1.2 The Report" as one phrase, not as a UI badge attached to
      // a heading. Color slightly dimmed (0.75) so the prose dominates
      // visually but the marker is still readable. The trailing space
      // is part of the marker so word-spacing flows naturally.
      '.ve-pnum {',
      '  display:inline; font:inherit; color:currentColor; opacity:0.75;',
      '  margin:0; padding:0; border:0; background:none;',
      '  text-decoration:none; user-select:none;',
      '  transition:opacity 120ms ease;',
      '}',
      '.ve-pnum:hover { opacity:1; text-decoration:underline dotted; }',
      '.ve-pnum::after { content:" "; }',
      // Depth-based paragraph indentation. The numberProse() function
      // stamps data-ve-pdepth (1..N) alongside data-ve-pnum; CSS keys
      // off it to indent each paragraph proportionally to its hierarchy
      // level. One-character (1ch) per depth level — narrower than a
      // tab, just enough to suggest hierarchy without burning horizontal
      // real estate. ch unit is "width of the 0 glyph in the current
      // font" which matches the user\'s "1 char" intuition.
      '[data-ve-prose] [data-ve-pdepth="1"] { margin-left: 1ch; }',
      '[data-ve-prose] [data-ve-pdepth="2"] { margin-left: 2ch; }',
      '[data-ve-prose] [data-ve-pdepth="3"] { margin-left: 3ch; }',
      '[data-ve-prose] [data-ve-pdepth="4"] { margin-left: 4ch; }',
      '[data-ve-prose] [data-ve-pdepth="5"] { margin-left: 5ch; }',
      '[data-ve-prose] [data-ve-pdepth="6"] { margin-left: 6ch; }',
      // Vertical breathing room between numbered paragraphs. ~2 lines
      // (1.4em ≈ 1.5 line-heights) so the eye groups each paragraph
      // distinctly. Headings get more space above to anchor sections.
      '[data-ve-prose] [data-ve-pnum] { margin-top: 1.4em; margin-bottom: 0.6em; }',
      '[data-ve-prose] h1[data-ve-pnum] { margin-top: 2.2em; margin-bottom: 0.8em; }',
      '[data-ve-prose] h2[data-ve-pnum] { margin-top: 2em;   margin-bottom: 0.7em; }',
      '[data-ve-prose] h3[data-ve-pnum] { margin-top: 1.8em; margin-bottom: 0.6em; }',
      '[data-ve-prose] h4[data-ve-pnum] { margin-top: 1.6em; margin-bottom: 0.5em; }',
      // Heading sizes — H1 / H2 / H3 visibly different so the user
      // perceives section depth at a glance. From H4 the gap shrinks
      // because the reader is already deep enough to lose track of
      // visual hierarchy and rely on numbering instead.
      //
      // Phase 1d — DESIGN.md typography binding. Each heading reads its
      // font-family from --vc-font-heading and its weight from
      // --vc-weight-bold so a DESIGN.md hot-swap restyles every heading
      // live. The historic literal value is kept as the var() fallback,
      // so with the engine absent the appearance is byte-identical.
      // H1/H2/H3 font-size binds to the type-scale step that matches the
      // old literal em (the default DESIGN.md scale is [12,14,16,20,24,
      // 32,48]px → text-5=32 ≈ 2em·16, text-4=24 ≈ 1.55em·16,
      // text-3=20 = 1.25em·16). H4/H5/H6 (1.1/1.05/1em) have no scale
      // step that matches, so they stay em-relative — and because em is
      // relative to the inherited body size (itself now bound to
      // --vc-text-2 below), a DESIGN.md scale change still moves them.
      // line-height stays a literal display value: --vc-line-height is
      // the BODY line-height and is deliberately looser than the tight
      // heading leading the ramp needs.
      '[data-ve-prose] h1 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-5, 2em);   font-weight: var(--vc-weight-bold, 600); line-height: 1.25; }',
      '[data-ve-prose] h2 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-4, 1.55em); font-weight: var(--vc-weight-bold, 600); line-height: 1.3; }',
      '[data-ve-prose] h3 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-3, 1.25em); font-weight: var(--vc-weight-bold, 600); line-height: 1.35; }',
      '[data-ve-prose] h4 { font-family: var(--vc-font-heading, inherit); font-size: 1.1em;  font-weight: var(--vc-weight-bold, 600); line-height: 1.4; }',
      '[data-ve-prose] h5 { font-family: var(--vc-font-heading, inherit); font-size: 1.05em; font-weight: var(--vc-weight-bold, 600); line-height: 1.4; }',
      '[data-ve-prose] h6 { font-family: var(--vc-font-heading, inherit); font-size: 1em;    font-weight: var(--vc-weight-bold, 600); line-height: 1.4; font-style: italic; }',
      // Phase 1d — prose body text binding. The [data-ve-prose] container
      // is the runtime\'s prose-numbering root; binding its font here
      // makes every numbered paragraph follow the DESIGN.md body font,
      // base size and line-height. `inherit` fallbacks keep a prose page
      // on its own host font when the DESIGN.md engine is absent — the
      // engine, when present, always applies a token set (an embedded
      // <script type="text/design-md"> or the built-in DEFAULT_DESIGNMD)
      // so --vc-* are on :root and the prose follows them. font-size
      // binds to --vc-text-2 because index 2 is the scale\'s base step
      // (the default scale [12,14,16,20,24,32,48] → text-2 = 16px, the
      // conventional body size).
      '[data-ve-prose] {',
      '  font-family: var(--vc-font-body, inherit);',
      '  font-size: var(--vc-text-2, inherit);',
      '  line-height: var(--vc-line-height, inherit);',
      '}',
      // ─── Phase 1d — DESIGN.md typography on rendered reports ──────────
      // Interactive reports are emitted by render-interactive-report.py
      // as `<article data-ve-report>` and use the renderer\'s OWN body /
      // heading typography — which predates the DESIGN.md engine and is
      // therefore NOT token-bound. These rules bind that typography to
      // --vc-* so a DESIGN.md hot-swap restyles a report\'s body prose
      // AND its headings live, the same way it already restyles colour.
      //
      // The selectors are scoped to [data-ve-report] (the article the
      // renderer stamps) so they only ever touch this plugin\'s own
      // report pages — never an arbitrary host page. The runtime style
      // element is appended to <head> AFTER the renderer\'s <style>, and
      // `[data-ve-report] h1` (specificity 0,1,1) beats the renderer\'s
      // bare `h1`/`body` (0,0,1), so these rules win. Every var()
      // fallback is the renderer\'s EXACT current value, so with the
      // DESIGN.md engine absent a report renders byte-identically.
      //
      // Body text: font-family + base font-size + line-height. The
      // article sets font-size so descendant prose inherits the bound
      // size even before initReportMode() copies data-ve-report onto
      // <body>. The font stack mirrors render-interactive-report.py\'s
      // `body { font:17px/1.6 ui-sans-serif,… }`.
      '[data-ve-report] {',
      '  font-family: var(--vc-font-body, ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif);',
      '  font-size: var(--vc-text-2, 17px);',
      '  line-height: var(--vc-line-height, 1.6);',
      '}',
      // Report headings: font-family from --vc-font-heading, weight from
      // --vc-weight-bold, size from the matching type-scale step. The
      // fallbacks are each heading\'s ACTUAL current value on a report —
      // the renderer styles only h1 (`font-style:italic; font-weight:
      // 500`) and leaves h2…h6 at UA defaults, so the per-tag weight /
      // size fallbacks differ (h1 500 / 2em, h2 700 / 1.5em, …). H1\'s
      // `font-style:italic` lives in the renderer rule and is a separate
      // property these rules never set, so the italic survives.
      '[data-ve-report] h1 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-5, 2em);    font-weight: var(--vc-weight-bold, 500); }',
      '[data-ve-report] h2 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-4, 1.5em);   font-weight: var(--vc-weight-bold, 700); }',
      '[data-ve-report] h3 { font-family: var(--vc-font-heading, inherit); font-size: var(--vc-text-3, 1.17em);  font-weight: var(--vc-weight-bold, 700); }',
      '[data-ve-report] h4 { font-family: var(--vc-font-heading, inherit); font-weight: var(--vc-weight-bold, 700); }',
      '[data-ve-report] h5 { font-family: var(--vc-font-heading, inherit); font-weight: var(--vc-weight-bold, 700); }',
      '[data-ve-report] h6 { font-family: var(--vc-font-heading, inherit); font-weight: var(--vc-weight-bold, 700); }',
      // The injected hover/selected outline adds an extra 8px padding.
      // Since we now use margin-left for indent, the inset box-shadow
      // still fires from the paragraph\'s left edge — exactly what the
      // user expects (hover ribbon hugs the indented block, not the
      // viewport edge).
      '[data-ve-prose] [data-ve-id]:hover { outline:none; box-shadow:inset 4px 0 0 currentColor; padding-left:8px; }',
      '[data-ve-prose] [data-ve-id] { transition:padding 120ms ease, box-shadow 120ms ease; padding-left:0; }',
      // Text-selection bubble handle — same compact 28×22 rounded-rect
      // shape as the gold element handle (.ve-comment-handle), but
      // teal-colored so the user knows it represents a TEXT SELECTION
      // (independent from the per-atom element selection). Both handles
      // can coexist; clicking each opens its own comment thread (text
      // snippet vs atom group). NO emoji label — clean badge matches
      // the element handle for consistency.
      '[data-ve-snippet-popup] {',
      '  position:absolute; z-index:2147483646;',
      '  width:28px; height:22px;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  background:var(--ve-snippet-handle-bg, #3a6b5c);',
      '  color:var(--ve-snippet-handle-fg, #fbfaf6);',
      '  border:0; border-radius:6px; padding:0;',
      '  cursor:pointer; user-select:none;',
      '  box-shadow:0 3px 10px rgba(0,0,0,0.34);',
      '  transition:filter 120ms ease, transform 120ms ease;',
      '  animation:veSlideUp 140ms ease-out both;',
      '}',
      '[data-ve-snippet-popup]:hover { filter:brightness(1.08); }',
      '[data-ve-snippet-popup]:active { transform:scale(0.97); }',
      '[data-ve-snippet-popup]:focus-visible {',
      '  outline:2px solid var(--ve-snippet-handle-bg, #3a6b5c);',
      '  outline-offset:2px;',
      '}',
      // Native browser text-selection tint — matches the snippet handle
      // color (teal) so users see "the selection IS what the snippet
      // handle would reference if you clicked it".
      // Paints in BOTH themes via the --ve-snippet-highlight token.
      '::selection {',
      '  background: var(--ve-snippet-highlight, rgba(58,107,92,0.22));',
      '  color: inherit;',
      '}',
      '::-moz-selection {',
      '  background: var(--ve-snippet-highlight, rgba(58,107,92,0.22));',
      '  color: inherit;',
      '}',
      // CSS Custom Highlight API — paints the preserved snippet range
      // in the same teal band as ::selection but survives focus
      // changes (when the modal\'s textarea steals focus, ::selection
      // disappears but ::highlight() does not). Chrome 105+, Safari
      // 17.2+; older browsers see no highlight while modal is open
      // (selection still restored on close, so this is a graceful
      // visual-only degradation).
      '::highlight(ve-snippet-active) {',
      '  background: var(--ve-snippet-highlight, rgba(58,107,92,0.22));',
      '  color: inherit;',
      '}',
      // TRDD-352ef46a Phase 2.5 Region 2 — same band but for the
      // generic modal-open selection-preservation hook. Applied when
      // ANY comment modal opens with a live window-selection.
      '::highlight(ve-modal-active) {',
      '  background: color-mix(in srgb, var(--ve-accent, #b8861f) 22%, transparent);',
      '  color: inherit;',
      '}',
      // ─── Phase 5: table row/column handles ────────────────────────────
      // Wrapper provides a 24-px phantom hit-zone outside the table so
      // mouse can reach the handles before drifting fully out.
      '.ve-table-wrapper {',
      '  position:relative; display:inline-block;',
      '  padding:24px; margin:-12px;',
      '}',
      '.ve-table-handles-overlay {',
      '  position:absolute; inset:24px; pointer-events:none;',
      '}',
      '.ve-table-handle {',
      '  position:absolute; width:22px; height:22px;',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 18%, transparent);',
      '  color:var(--ve-accent, #b8861f);',
      '  border:1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 70%, transparent);',
      '  border-radius:6px;',
      '  font:600 11px/20px ui-monospace,Menlo,monospace; text-align:center;',
      '  cursor:pointer; opacity:0; pointer-events:auto;',
      '  transition:opacity 140ms ease, background 120ms ease, transform 120ms ease;',
      '  user-select:none;',
      '}',
      '.ve-table-wrapper:hover .ve-table-handle { opacity:0.55; }',
      '.ve-table-handle:hover { opacity:1; transform:scale(1.08); }',
      '.ve-table-handle[data-ve-pressed="1"] {',
      '  opacity:1;',
      '  background:var(--ve-accent, #b8861f);',
      '  color:var(--ve-sel-text, #14110b);',
      '  box-shadow:inset 0 1.5px 2.5px rgba(0,0,0,0.32);',
      '}',
      '.ve-table-handle--row-left  { transform:translate(-100%, -50%); padding-right:1px; }',
      '.ve-table-handle--row-right { transform:translate(0, -50%);     padding-left:1px;  }',
      '.ve-table-handle--column-top    { transform:translate(-50%, -100%); padding-bottom:1px; }',
      '.ve-table-handle--column-bottom { transform:translate(-50%, 0);     padding-top:1px;    }',
      '.ve-table-handle--row-left:hover  { transform:translate(-100%, -50%) scale(1.12); }',
      '.ve-table-handle--row-right:hover { transform:translate(0, -50%) scale(1.12); }',
      '.ve-table-handle--column-top:hover    { transform:translate(-50%, -100%) scale(1.12); }',
      '.ve-table-handle--column-bottom:hover { transform:translate(-50%, 0) scale(1.12); }',
      // Selected row/column highlight on the table cells themselves.
      // Row uses an attribute on the <tr>; column uses dynamic per-table
      // CSS rules emitted by ensureColumnHighlightSheet().
      'tr[data-ve-row-selected="1"] > td,',
      'tr[data-ve-row-selected="1"] > th {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 18%, transparent) !important;',
      '}',
      // ─── table-form row-level visual feedback ────────────────────────
      // The table-level [data-ve-id]:hover rule is suppressed for
      // table-form tables (so the entire table doesn\'t glow when you
      // hover any descendant). Instead, give the user explicit visual
      // feedback at the ROW level. The user\'s explicit spec:
      //   • Brightness must be ADDITIVE on a 0.0-1.0 lightness scale
      //     (not multiplicative — multiplicative leaves dark colors
      //     barely changed). Selected = +0.2, Hover = +0.3 + glow.
      //   • Page-defined zebra (tr:nth-child(even)) must be PRESERVED;
      //     the page\'s own tr:hover background change (if any) must be
      //     CANCELLED so it doesn\'t fight the runtime\'s brightness boost.
      //
      // Implementation:
      //   - `box-shadow: inset 0 0 0 9999px rgba(255,255,255,α)` paints
      //     a white overlay of opacity α on top of the cell\'s existing
      //     background. White-blend approximates additive RGB → additive
      //     perceptual brightness (esp. on dark colors where multiplicative
      //     brightness fails). α = 0.20 for selected, 0.30 for hover.
      //   - `background: revert !important` on tr:hover cancels the page\'s
      //     own tr:hover bg change; the cascade then falls back to the
      //     non-hover rules (tr:nth-child(even) zebra, etc.), so the
      //     natural row bg remains visible underneath the white overlay.
      //   - Three explicit rules so cascade resolution is unambiguous:
      //       a) selected (no hover) — tint + light overlay
      //       b) hover (no selection) — natural bg + heavier overlay + glow
      //       c) hover + selected — tint + heavier overlay + glow
      // -- (a) selected, no hover -- additive bg tint + brightness on the
      // <tr> (not the cells). The TR-level filter composites the row as
      // ONE layer so the boundaries between cells don't become visible
      // seams between PICK / FEATURE / DESC columns; per-cell filters
      // create one compositing layer per <td>, and those layer edges are
      // exactly the seams we want to avoid.
      // No explicit text colour shift — the row-level brightness already
      // provides emphasis on every theme. The previous rule pushed text
      // toward `white 70%` which made selected rows readable on dark themes
      // but invisible on light themes (white-on-cream); pages that want a
      // hard text-colour change can set `--ve-text-selected` themselves.
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked) {',
      '  filter: brightness(var(--ve-brightness-selected));',
      '}',
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked) > td,',
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked) > th {',
      '  background-color: var(--ve-overlay-selected) !important;',
      // Hide page-CSS inter-cell borders inside the highlighted row so the
      // selection reads as one continuous band. The fixture / page often
      // sets `border: 1px solid rgba(0,0,0,0.12)` per cell — those vertical
      // lines are visually unobtrusive on unselected rows but pop against
      // the row-level brightness/overlay, recreating the "seam" effect.
      // `border-style: hidden` is the ONLY value that always wins in a
      // border-collapse:collapse merge — `transparent` colors lose to
      // opaque adjacent borders per CSS 2.1 §17.6.3 (border conflict
      // resolution: hidden > wider > style precedence > element type).
      '  border-left-style: hidden !important;',
      '  border-right-style: hidden !important;',
      '}',
      // -- (b) hover, no selection -- pin row bg to captured natural value
      // (suppresses page\'s tr:hover bg change), apply additive bg lift on
      // cells + brightness on the ROW (see rule (a)\'s comment for why),
      // and apply outer glow as box-shadow on each TD (TR-level box-shadow
      // doesn\'t render in border-collapse:collapse tables, but TR-level
      // filter does). Text colour intentionally NOT overridden — same
      // reasoning as rule (a): forcing `#ffffff` makes hover invisible on
      // light themes. Pages can opt in via `--ve-text-hover`.
      '[data-ve-type="table-form"] tbody tr:hover > td,',
      '[data-ve-type="table-form"] tbody tr:hover > th {',
      '  background-color: var(--ve-overlay-hover) !important;',
      // `border-style: hidden` is the ONLY value that always wins in a
      // border-collapse:collapse merge — `transparent` colors lose to
      // opaque adjacent borders per CSS 2.1 §17.6.3 (border conflict
      // resolution: hidden > wider > style precedence > element type).
      '  border-left-style: hidden !important;',
      '  border-right-style: hidden !important;',
      '  box-shadow: 0 0 6px var(--ve-accent, currentColor);',
      '}',
      '[data-ve-type="table-form"] tbody tr:hover {',
      '  background:var(--ve-row-natural-bg, transparent) !important;',
      '  filter: brightness(var(--ve-brightness-hover));',
      '}',
      // -- (c) hover-on-selected -- heavier brightness/text/overlay/glow
      // (same as plain hover, since hover dominates).
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked):hover {',
      '  background:var(--ve-row-natural-bg, transparent) !important;',
      '  filter: brightness(var(--ve-brightness-hover));',
      '}',
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked):hover > td,',
      '[data-ve-type="table-form"] tbody tr:has(input[data-ve-control]:checked):hover > th {',
      '  background-color: var(--ve-overlay-hover) !important;',
      // `border-style: hidden` is the ONLY value that always wins in a
      // border-collapse:collapse merge — `transparent` colors lose to
      // opaque adjacent borders per CSS 2.1 §17.6.3 (border conflict
      // resolution: hidden > wider > style precedence > element type).
      '  border-left-style: hidden !important;',
      '  border-right-style: hidden !important;',
      '  box-shadow: 0 0 6px var(--ve-accent, currentColor);',
      '}',
      // ─── Phase 6: code line-number gutter (CSS-counter model) ────────
      // CSS counter increment + ::before pseudo-element on each line
      // span. The pseudo is part of the line\'s own inline flow, so
      // there is NO separate gutter element, NO font/line-height sync,
      // NO baseline math — the browser\'s text layout handles alignment
      // because the number IS rendered as part of the line.
      //
      // Click affordance: the .ve-code-line span itself is clickable
      // (cursor:pointer on the line\'s leading region). The pseudo-
      // element can\'t catch clicks directly, but the whole line is the
      // gesture target — clicking anywhere on the line selects it.
      '.ve-code-block { position:relative; }',
      // Default code-block style: single brown border, ORIGINAL host-
      // page interior (no bg override). The fixture / page CSS owns the
      // interior color; we only style the border + a barely-perceptible
      // backdrop blur for a subtle frost. NO double border in default
      // state.
      //
      // The local overrides on --ve-overlay-hover / --ve-glow-hover /
      // --ve-brightness-hover NEUTRALISE the generic [data-ve-id]:hover
      // side-effects (background-color overlay, box-shadow glow,
      // brightness filter). Those side-effects were turning the pre
      // interior gray on hover. The hover affordance for the code block
      // is the OUTLINE (defined below), not an overlay.
      '.ve-code-block > pre {',
      '  margin:0;',
      '  counter-reset:ve-code-line;',
      '  border:1px solid var(--ve-accent, #b8861f);',
      // SOFT WRAP — long code lines that would otherwise overflow the
      // viewport now wrap inside the block. Per the user spec: no
      // horizontal scrollbar, no nested scrollview (you can\'t select
      // what you can\'t see). The hanging indent on .ve-code-content
      // (below) visually distinguishes wrapped continuations from new
      // source lines.
      '  white-space:pre-wrap;',
      '  word-break:break-word;',
      '  overflow-wrap:anywhere;',
      // 1.5px blur is just enough to soften the body-grid lines under
      // the pre without erasing them. 6px (earlier) was too aggressive —
      // the grid disappeared completely.
      '  -webkit-backdrop-filter:blur(1.5px);',
      '  backdrop-filter:blur(1.5px);',
      '  --ve-overlay-hover:transparent;',
      '  --ve-overlay-selected:transparent;',
      '  --ve-glow-hover:none;',
      '  --ve-brightness-hover:1;',
      '  --ve-brightness-selected:1;',
      '}',
      // ─── Code block 3-state model ───────────────────────────────────
      // Same normal · selected ±Δ · hover ±Δ + glow rule as paragraphs
      // above. Block-level transitions ride on the .ve-code-block
      // wrapper so the WHOLE block reads as one unit (not just the
      // selected line).
      //
      // The pre carries a `data-ve-id` so the generic [data-ve-id]:hover
      // rule would normally apply too. The CSS-variable overrides on
      // the pre (above: --ve-overlay-hover:transparent, --ve-glow-hover:
      // none, --ve-brightness-hover:1) neutralise the generic rule\'s
      // bg overlay / glow / brightness side-effects so only the outline
      // remains — which our STATE rules below override with stronger
      // accent + glow values.
      // CSS :has() is the native selector; supported in WKWebView (iTerm2)
      // since Safari 15.4 (2022) and Chromium 105 (2022).
      '.ve-code-block { transition:box-shadow 120ms ease, outline-color 120ms ease; }',
      '.ve-code-block > pre { transition:outline-color 120ms ease, box-shadow 120ms ease; }',
      // STATE 2: Hover UNSELECTED block — accent outline + glow halo,
      // signals "you can click a line here to select it". !important
      // because the generic [data-ve-id]:hover rule above sets outline
      // unconditionally too — without !important, source order wins
      // and ours doesn\'t reliably take effect.
      '.ve-code-block:hover:not(:has(.ve-code-line[data-ve-pressed="1"])) > pre {',
      '  outline:2px solid color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent) !important;',
      '  outline-offset:3px !important;',
      '  box-shadow:0 0 16px color-mix(in srgb, var(--ve-accent, #b8861f) 45%, transparent) !important;',
      '}',
      // STATE 3: Selected (≥1 line pressed) — strong gold outline,
      // no glow. Uses --ve-accent (the warm gold) instead of the
      // previous near-invisible --ve-accent-dark so the selection
      // reads clearly on dark backgrounds.
      '.ve-code-block:has(.ve-code-line[data-ve-pressed="1"]) > pre {',
      '  outline:2px solid var(--ve-accent, #b8861f) !important;',
      '  outline-offset:3px !important;',
      '  box-shadow:none !important;',
      '}',
      // STATE 4: Hover OVER selected block — outline + glow halo.
      '.ve-code-block:hover:has(.ve-code-line[data-ve-pressed="1"]) > pre {',
      '  outline:2px solid var(--ve-accent, #b8861f) !important;',
      '  outline-offset:3px !important;',
      '  box-shadow:0 0 20px color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent) !important;',
      '}',
      // Opt-in blueprint theme for code blocks — author adds the class
      // `ve-blueprint` to the .ve-code-block (or any ancestor) when they
      // want the graph-paper background on a specific block. Same grid
      // pattern is also used by the page-body light-theme rule below.
      '.ve-blueprint.ve-code-block > pre,',
      '.ve-blueprint .ve-code-block > pre {',
      '  background-color:var(--ve-blueprint-bg, #faf6ee);',
      '  background-image:',
      '    linear-gradient(to right, color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px),',
      '    linear-gradient(to bottom, color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px);',
      '  background-size:24px 24px;',
      '}',
      // counter-increment fires once per line span — each span gets the
      // next integer in the counter sequence.
      // display:block so each line\'s highlight covers the full row width
      // (not just the inline-text width). No literal `\n` is needed
      // between sibling spans — the block layout creates the line break.
      // Block layout with absolute-positioned linenum + hanging indent.
      // Why not flex: a flex layout treats the content as its own block
      // formatting context, which means the source\'s leading whitespace
      // (8-space indent for inner-function lines) is preserved on the
      // FIRST visual line but the wrapped continuation collapses back to
      // column 0 of the flex item — losing both the source indent AND
      // the wanted hanging-indent marker. With the block approach below,
      // the WHOLE line (linenum + content) lives in one block formatting
      // context: padding-left reserves room for the absolute linenum +
      // 2ch of hanging space, and text-indent:-2ch pulls the first line
      // back so its leading whitespace renders unchanged. Wrapped
      // continuations naturally start at padding-left (i.e. 2ch right
      // of where the first line\'s text starts), giving the visual
      // "this is a continuation" marker the user wants.
      '.ve-code-line {',
      '  display:block;',
      '  position:relative;',
      '  counter-increment:ve-code-line;',
      // Per-line dynamic hanging indent. --ve-code-indent is set inline
      // by initCodeGutter to (source-leading-whitespace + 2). Default
      // to 2 for safety if the var is missing. The math:
      //   • padding-left = gutter (4.2ch) + indent ch → wrap goes here
      //   • text-indent = -indent ch → first line pulled back to gutter
      // Net effect: the source\'s leading whitespace renders at its
      // natural position on the first visual line, and any wrap
      // continuation starts at (source-indent + 2ch) past the gutter,
      // which is always 2ch right of where the first line\'s visible
      // text begins — the universal "this is a wrap" affordance.
      '  padding-left:calc(4.2ch + var(--ve-code-indent, 2) * 1ch);',
      '  text-indent:calc(var(--ve-code-indent, 2) * -1ch);',
      '  white-space:pre-wrap;',
      '  word-break:break-word;',
      '  overflow-wrap:anywhere;',
      // EMPTY-LINE GUARD: source lines that contain only whitespace
      // (or are empty) would otherwise collapse to height 0 because
      // the absolute-positioned linenum is out of flow and the inline
      // content span has nothing to render. Matching the surrounding
      // 1.55 line-height keeps blank lines visible AND keeps the
      // drag-paint hit-test correct (drag from line N to line N+2
      // through an empty line N+1 must not skip line N+1).
      '  min-height:1.55em;',
      // ─── WRAP-CONTINUATION MARKER ────────────────────────────────────
      // Paint a darker 2ch vertical stripe at the wrap-indent column.
      // The stripe is positioned to start at y=1.55em (the first row\'s
      // height) and cover the area below — so it ONLY visible on
      // wrapped continuation rows, never on the first visual row.
      // Width = 2ch (the hanging-indent amount). Position X = the same
      // column where wrap continuations start (padding-left). Color
      // comes from --ve-code-wrap-marker (subtractive on dark, brown
      // tint on light) so wrap-indent space reads visually distinct
      // from real source-code whitespace.
      '  background-image:linear-gradient(',
      '    to right,',
      '    transparent 0,',
      '    transparent calc(4.2ch + (var(--ve-code-indent, 2) - 2) * 1ch),',
      '    var(--ve-code-wrap-marker, rgba(0,0,0,0.30)) calc(4.2ch + (var(--ve-code-indent, 2) - 2) * 1ch),',
      '    var(--ve-code-wrap-marker, rgba(0,0,0,0.30)) calc(4.2ch + var(--ve-code-indent, 2) * 1ch),',
      '    transparent calc(4.2ch + var(--ve-code-indent, 2) * 1ch)',
      '  );',
      '  background-position:0 1.55em;',                            // skip the first visual row
      '  background-repeat:no-repeat;',
      '  background-size:100% calc(100% - 1.55em);',                // covers row 2 → end
      '}',
      // Linenum gutter — ABSOLUTE-positioned so it overlays the first
      // ~4ch of the line\'s padding-left area without participating in
      // inline flow (which would interact with text-indent and break
      // the hanging indent calculation).
      // top:0; bottom:0 stretches the bbox to the FULL HEIGHT of the
      // parent .ve-code-line — critical because drag-paint uses
      // elementFromPoint(x, y) on every intermediate position; if the
      // linenum was just its intrinsic line-height (~18px), a drag
      // through the middle of a wrapped line would miss the linenum
      // and the drag-paint would skip that line. Full-height bbox
      // ensures the leftmost gutter column always catches drag hits.
      '.ve-code-linenum {',
      '  position:absolute;',
      '  left:0; top:0; bottom:0;',
      '  display:flex; align-items:flex-start; justify-content:flex-end;',
      '  box-sizing:border-box;',
      '  min-width:3.5ch; padding:0 0.6ch 0 0.3ch;',
      '  text-align:right;',
      '  text-indent:0;',                                         // re-zero so the parent\'s -2ch doesn\'t shift the gutter
      '  white-space:nowrap;',
      '  color:color-mix(in srgb, currentColor 50%, transparent);',
      '  border-right:1px solid color-mix(in srgb, currentColor 18%, transparent);',
      // WebKit (iTerm2 WKWebView, Safari) requires the -webkit- prefix
      // AND -webkit-touch-callout:none — without these, mousedown over
      // the pseudo-element digit triggers text-selection / Look-Up and
      // the click is never seen by our mousedown listener.
      '  user-select:none; -webkit-user-select:none;',
      '  -webkit-touch-callout:none;',
      '  cursor:pointer;',
      '  transition:background 100ms ease, color 100ms ease;',
      '}',
      // Content — inline span; no special styling needed (the line\'s
      // padding-left + text-indent does all the hanging-indent work).
      // Kept as a wrapper so DOM tools can target "just the code text"
      // when needed.
      '.ve-code-content { display:inline; }',
      '.ve-code-linenum::before { content:counter(ve-code-line); }',
      '.ve-code-linenum:hover {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 18%, transparent);',
      '  color:var(--ve-accent, #b8861f);',
      '}',
      '.ve-code-line[data-ve-pressed="1"] .ve-code-linenum {',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '}',
      '.ve-code-line[data-ve-preview="1"] .ve-code-linenum {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 30%, transparent);',
      '  color:var(--ve-sel-text, #14110b);',
      '}',
      // Pressed/preview state on the WHOLE line span (so the row visibly
      // selects, not just the gutter number) — the ::before above reads
      // these same attrs to update the number-cell background too. The
      // bg is a soft accent tint (not full-strength) so the row reads
      // as "highlighted" without dominating the page on either theme;
      // text colour is left alone so readability is preserved.
      '.ve-code-line[data-ve-pressed="1"] {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 28%, transparent);',
      '}',
      '.ve-code-line[data-ve-preview="1"] {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 18%, transparent);',
      '}',
      '.ve-code-line[data-ve-pressed="1"] .ve-code-linenum {',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '}',
      '.ve-code-line[data-ve-preview="1"] .ve-code-linenum {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent);',
      '  color:var(--ve-sel-text, #14110b);',
      '}',
      // ── Multi-select comment handle (Phase 1) ─────────────────────────
      // Matches the existing `.ve-comment-pill` palette so it looks at
      // home next to other commentable affordances. Pill style — gold
      // accent bg, soft shadow, rounded-full. Position: outside the
      // .ve-code-block on the left, vertically centered on the FIRST
      // selected line (so the handle doesn\'t jump as more lines are
      // added). Click → openCommentModal(handle) — reuses the existing
      // multi-turn comment thread modal with polling, decision pills,
      // connector line. NO custom dialog.
      // Left margin reserves space for the .ve-comment-handle (24px circle
      // at left:-32px → needs ≥36px of free margin to its left). Without
      // this, narrow viewports / tight body padding clip the handle.
      '.ve-code-block { position:relative; margin-left:40px; }',
      // Copy-to-clipboard button — floats top-right of every .ve-code-block.
      // Subdued by default (opacity 0.55) so it never competes with the code
      // visually; lights up on hover. Briefly flips to a checkmark + green
      // bg when the copy succeeds. The button is excluded from atom-
      // selection via [data-ve-overlay="1"] so clicking it never toggles
      // line selection, and from text-snippet via the same selector.
      '.ve-code-copy-btn {',
      '  position:absolute; top:6px; right:6px; z-index:3;',
      '  width:28px; height:24px;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  background:color-mix(in srgb, var(--ve-control-bg, #fbfaf6) 86%, transparent);',
      '  color:var(--ve-control-fg, var(--text, #14110b));',
      '  border:1px solid color-mix(in srgb, var(--ve-control-border, #d6d1c5) 60%, transparent);',
      '  border-radius:5px;',
      '  cursor:pointer;',
      '  font:600 15px/1 ui-sans-serif,system-ui,sans-serif;',
      '  opacity:0.55;',
      '  transition:opacity 120ms ease, background 120ms ease, color 120ms ease;',
      '  user-select:none; -webkit-user-select:none;',
      '}',
      '.ve-code-copy-btn:hover {',
      '  opacity:1;',
      '  background:var(--ve-accent, #b8861f);',
      '  color:var(--ve-sel-text, #14110b);',
      '}',
      '.ve-code-copy-btn--success {',
      '  opacity:1 !important;',
      '  background:var(--ve-decision-approve-symbol, #3a6b5c) !important;',
      '  color:#fff !important;',
      '  border-color:var(--ve-decision-approve-symbol, #3a6b5c) !important;',
      '}',
      // Compact rounded-rect tag — slightly wider than tall (badge shape).
      // Sits OUTSIDE the .ve-code-block with a clear gap to the block's
      // left border; the block's own `margin-left:40px` (set above) gives
      // us the room. Rounded corners (not a full circle) read as a UI
      // chip / tag rather than a status dot.
      '.ve-comment-handle {',
      '  position:absolute;',
      '  left:-40px;',
      '  width:28px; height:22px;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '  border:0; border-radius:6px;',
      '  padding:0;',
      '  font:600 13px/1 ui-sans-serif,system-ui,sans-serif;',
      '  cursor:pointer;',
      '  box-shadow:0 3px 10px rgba(0,0,0,0.24);',
      '  transform:translateY(-50%);',
      '  z-index:2;',
      '  animation:veFadeIn 120ms ease;',
      '}',
      '.ve-comment-handle:hover { filter:brightness(1.08); }',
      // ─── Phase 7: bigger hit-zones on touch devices ──────────────────
      // body[data-ve-touch="1"] is set by isTouchDevice() on first call.
      'body[data-ve-touch="1"] .ve-table-handle { width:32px; height:32px; font-size:14px; line-height:30px; }',
      'body[data-ve-touch="1"] .ve-code-line::before { padding:6px 12px 6px 10px; }',
      'body[data-ve-touch="1"] .ve-table-wrapper:hover .ve-table-handle { opacity:0.85; }',
      // ─── Interactive reports (TRDD-eff1aa87) ──────────────────────────
      '[data-ve-finding-id] {',
      '  display:block; margin:32px 0; padding:18px 22px;',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 4%, transparent);',
      '  border-left:3px solid color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent);',
      '  border-radius:6px;',
      '}',
      // Finding-card title. Phase 1d binds its font-family + weight to
      // the DESIGN.md heading tokens explicitly (rather than leaning on
      // cascade fall-through to the generic [data-ve-report] h2 rule —
      // this rule and that one tie on specificity, so being explicit
      // keeps the binding robust if either is ever reordered). font-size
      // stays the literal 1.1em: it is a deliberately compact card title
      // with no matching type-scale step, and because em is relative to
      // the inherited body size — itself bound to --vc-text-2 — a
      // DESIGN.md scale change still resizes it. Fallbacks reproduce the
      // pre-Phase-1d look (heading family inherited, UA bold weight).
      '[data-ve-finding-id] > h2 {',
      '  margin:0 0 8px;',
      '  font-family: var(--vc-font-heading, inherit);',
      '  font-size:1.1em;',
      '  font-weight: var(--vc-weight-bold, 700);',
      '}',
      '.ve-finding-meta {',
      '  display:flex; gap:10px; align-items:center; flex-wrap:wrap;',
      '  margin:0 0 14px; font-size:13px;',
      '}',
      '.ve-finding-chip {',
      '  display:inline-block; padding:2px 9px; border-radius:999px;',
      '  font:600 11px/1.4 inherit; letter-spacing:0.04em;',
      '  background:color-mix(in srgb, currentColor 12%, transparent);',
      '  text-transform:uppercase;',
      '}',
      '.ve-finding-chip--critical { color:#c0392b; background:color-mix(in srgb,#c0392b 15%, transparent); }',
      '.ve-finding-chip--major    { color:#d35400; background:color-mix(in srgb,#d35400 15%, transparent); }',
      '.ve-finding-chip--minor    { color:#7f8c8d; background:color-mix(in srgb,#7f8c8d 15%, transparent); }',
      '.ve-finding-chip--info     { color:#2980b9; background:color-mix(in srgb,#2980b9 15%, transparent); }',
      '.ve-finding-file { opacity:0.7; font:13px/1.4 ui-monospace,Menlo,monospace; }',
      '.ve-finding-body { margin-bottom:14px; }',
      '.ve-finding-thread {',
      '  margin-top:16px; padding-top:12px;',
      '  border-top:1px dashed color-mix(in srgb, var(--text, currentColor) 18%, transparent);',
      '  display:flex; flex-direction:column; gap:10px;',
      '}',
      '.ve-finding-round {',
      '  display:flex; flex-direction:column; gap:8px;',
      '  padding:12px; border-radius:6px;',
      '  background:color-mix(in srgb, var(--text, currentColor) 4%, transparent);',
      '}',
      '.ve-user-comment, .ve-claude-reply {',
      '  display:block; padding:10px 14px; border-radius:6px;',
      '  font:14px/1.55 inherit;',
      '}',
      '.ve-user-comment {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent);',
      '  border-left:2px solid var(--ve-accent, #b8861f);',
      '}',
      '.ve-claude-reply {',
      '  background:color-mix(in srgb, var(--text, currentColor) 6%, transparent);',
      '  border-left:2px solid color-mix(in srgb, var(--text, currentColor) 35%, transparent);',
      '}',
      '.ve-finding-author {',
      '  font:600 11px/1.4 ui-monospace,Menlo,monospace;',
      '  letter-spacing:0.06em; text-transform:uppercase;',
      '  opacity:0.65; margin-bottom:4px;',
      '}',
      '.ve-finding-reply {',
      '  width:100%; box-sizing:border-box; resize:vertical; min-height:64px;',
      '  padding:10px 14px; border-radius:6px;',
      '  border:1px solid color-mix(in srgb, var(--text, currentColor) 22%, transparent);',
      '  background:transparent; color:inherit;',
      '  font:14px/1.55 inherit;',
      '  transition:border-color 120ms ease, box-shadow 120ms ease;',
      '}',
      '.ve-finding-reply:focus {',
      '  outline:none;',
      '  border-color:var(--ve-accent, #b8861f);',
      '  box-shadow:0 0 0 2px color-mix(in srgb, var(--ve-accent, #b8861f) 28%, transparent);',
      '}',
      '.ve-finding-reply::placeholder {',
      '  color:color-mix(in srgb, var(--text, currentColor) 42%, transparent);',
      '}',
      // ─── v2 — modal comment threads (TRDD-eff1aa87 §6) ────────────────
      // Hover pill shown over the focused commentable element.
      '.ve-comment-pill {',
      '  position:absolute; z-index:2147483647;',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '  border:0; border-radius:999px;',
      '  padding:4px 12px; font:600 11px/1.4 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0.02em; cursor:pointer;',
      '  box-shadow:0 4px 14px rgba(0,0,0,0.28);',
      '  opacity:0; pointer-events:none;',
      '  transition:opacity 120ms ease;',
      '}',
      '.ve-comment-pill:hover { filter: brightness(1.08); }',
      // Active commentable element gets a gold ring while modal is open.
      '[data-ve-comment-active] {',
      '  outline:2px solid var(--ve-accent, #b8861f);',
      '  outline-offset:4px; border-radius:4px;',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 8%, transparent);',
      '}',
      // Page reflow when modal open.
      // The modal is now draggable so it can land anywhere on the page;
      // page-wide reflow (margin-right:480px) would be wrong once the user
      // drags the modal off the right edge. We still want the page to be
      // INERT while the modal is open (blocks accidental clicks on
      // non-comment elements behind the modal), so we keep pointer-events
      // disabled, but we no longer push main to the side.
      'body[data-ve-comment-modal-open="1"] { overflow-x:hidden; }',
      'body[data-ve-comment-modal-open="1"] main * {',
      '  pointer-events:none;', // page becomes inert
      '}',
      'body[data-ve-comment-modal-open="1"] main [data-ve-comment-active] {',
      '  pointer-events:auto;', // but the active anchor stays selectable
      '}',
      // ─── Connector overlay (z-index just BELOW the modal) ───────────────
      // SVG layer drawn full-viewport. The wide semi-transparent line goes
      // from the anchor's center to the modal's center; the modal's higher
      // z-index visually "covers" the line where they overlap, so the line
      // looks like it terminates inside the modal — preserving the visual
      // tether without getting in the way of reading the modal contents.
      '.ve-connector-overlay {',
      '  position:fixed; left:0; top:0; width:100vw; height:100vh;',
      '  pointer-events:none;', // line is decoration, never intercepts clicks
      '  z-index:2147483645;',  // ONE less than the modal (2147483646)
      '  overflow:visible;',
      '}',
      '.ve-connector-line {',
      // Stroke width >= modal header height (44px). Round linecaps make
      // the anchor-end look like a soft pin rather than a hard slab.
      '  stroke:color-mix(in srgb, var(--ve-accent, #b8861f) 30%, transparent);',
      '  stroke-width:44; stroke-linecap:round;',
      '  fill:none;',
      '}',
      // TRDD-352ef46a Phase 2.5 Region 2 — thin dashed leader line
      // drawn ON TOP of the wide tether. Points at the EXACT bbox of
      // the active selection / selected atom so the user knows what
      // they're commenting on. Style: 1px dashed border-strong.
      '.ve-leader-line {',
      '  stroke:var(--ve-control-border-strong, color-mix(in srgb, var(--ve-accent, #b8861f) 70%, transparent));',
      '  stroke-width:1; stroke-linecap:butt;',
      '  stroke-dasharray:5 4;',
      '  fill:none;',
      '}',
      // Modal box.
      // Now positioned absolute (top/left) so JS drag can move it freely.
      // Default-position JS (positionCommentModalDefault) sets top/left in
      // the absence of a stored position — we don't anchor it via CSS so
      // the JS is the single source of truth for placement.
      // Responsive sizing: width is the lesser of 460px and (viewport - 16px)
      // so on a 375px-wide viewport (iPhone SE) the modal fits with an 8px
      // gutter on each side instead of overflowing by 85px. The CSS
      // calc(100vw - 16px) handles the *initial* paint width; JS clamping in
      // applyCommentModalPosition / positionCommentModalDefault then keeps
      // the modal's left/top inside the viewport on every open and drag.
      '.ve-comment-modal {',
      '  position:fixed; top:24px; left:auto; right:24px;',
      '  width:min(460px, calc(100vw - 16px));',
      '  max-height:calc(100vh - 48px); height:auto;',
      '  z-index:2147483646;',
      '  display:flex; flex-direction:column;',
      '  background:var(--bg, #faf6ee); color:var(--text, #1f1a14);',
      '  border:1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 40%, transparent);',
      '  border-radius:8px;',
      '  box-shadow:0 18px 48px rgba(0,0,0,0.28);',
      '  font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;',
      '  animation:veFadeIn 160ms ease-out both;',
      '}',
      '.ve-comment-modal-inner {',
      '  display:flex; flex-direction:column; flex:1; min-height:0;',
      '}',
      // The header is the drag handle. cursor:grab signals the affordance,
      // cursor:grabbing flips during the actual drag (set inline by JS).
      // user-select:none prevents accidental text selection while dragging.
      '.ve-comment-modal-header {',
      '  display:flex; align-items:center; justify-content:space-between;',
      '  padding:12px 16px;',
      '  border-bottom:1px solid color-mix(in srgb, var(--text, currentColor) 12%, transparent);',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 8%, transparent);',
      '  cursor:grab; user-select:none;',
      '  border-top-left-radius:8px; border-top-right-radius:8px;',
      '}',
      '.ve-comment-modal-header:active { cursor:grabbing; }',
      // Children of the header (title text, close button) should NOT inherit
      // the grab cursor or the drag-trigger; we set them back to default so
      // clicking the [×] close button doesn't initiate a drag.
      '.ve-comment-modal-header .ve-comment-modal-close { cursor:pointer; }',
      '.ve-comment-modal-title {',
      '  font:600 13px/1.4 ui-monospace,Menlo,monospace;',
      '  letter-spacing:0.04em; opacity:0.85;',
      '}',
      '.ve-comment-modal-close {',
      '  background:transparent; border:0; color:inherit;',
      '  font:300 22px/1 ui-sans-serif,sans-serif; cursor:pointer;',
      '  padding:0 4px; opacity:0.6;',
      '}',
      '.ve-comment-modal-close:hover { opacity:1; }',
      '.ve-comment-modal-body {',
      '  display:flex; flex:1; min-height:0;',
      '}',
      '.ve-comment-thread-index {',
      '  width:120px; min-width:120px;',
      '  margin:0; padding:8px 0; list-style:none;',
      '  border-right:1px solid color-mix(in srgb, var(--text, currentColor) 12%, transparent);',
      '  overflow-y:auto;',
      '  font:13px/1.4 ui-monospace,Menlo,monospace;',
      '}',
      '.ve-comment-thread-row {',
      '  padding:6px 12px; cursor:pointer;',
      '  white-space:pre;',
      '  border-left:2px solid transparent;',
      '  transition:background 100ms ease, border-color 100ms ease;',
      '}',
      '.ve-comment-thread-row:hover {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 10%, transparent);',
      '}',
      '.ve-comment-thread-row[data-active] {',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 22%, transparent);',
      '  border-left-color:var(--ve-accent, #b8861f);',
      '  font-weight:600;',
      '}',
      '.ve-comment-thread-row[data-role="agent"] { color:color-mix(in srgb, var(--text, currentColor) 80%, transparent); }',
      '.ve-comment-active-pane {',
      '  flex:1; min-width:0; display:flex; flex-direction:column;',
      '  padding:14px 18px; overflow-y:auto;',
      '}',
      '.ve-comment-active-meta {',
      '  font:600 11px/1.4 ui-monospace,Menlo,monospace;',
      '  letter-spacing:0.06em; opacity:0.55; margin-bottom:8px;',
      '  text-transform:uppercase;',
      '}',
      '.ve-comment-active-content {',
      '  flex:1; display:flex; flex-direction:column; min-height:0;',
      '}',
      '.ve-comment-active-text {',
      '  white-space:pre-wrap; word-wrap:break-word;',
      '  padding:10px 12px; border-radius:6px;',
      '  background:color-mix(in srgb, var(--text, currentColor) 5%, transparent);',
      '  border:1px solid color-mix(in srgb, var(--text, currentColor) 12%, transparent);',
      '}',
      '.ve-comment-active-textarea {',
      '  flex:1; box-sizing:border-box; resize:none; min-height:120px;',
      '  padding:10px 12px; border-radius:6px;',
      '  border:1px solid color-mix(in srgb, var(--text, currentColor) 22%, transparent);',
      '  background:transparent; color:inherit;',
      '  font:14px/1.55 inherit;',
      '}',
      '.ve-comment-active-textarea:focus {',
      '  outline:none;',
      '  border-color:var(--ve-accent, #b8861f);',
      '  box-shadow:0 0 0 2px color-mix(in srgb, var(--ve-accent, #b8861f) 28%, transparent);',
      '}',
      '.ve-comment-active-textarea::placeholder {',
      '  color:color-mix(in srgb, var(--text, currentColor) 42%, transparent);',
      '}',
      '.ve-comment-pending {',
      '  font:italic 13px/1.5 inherit; opacity:0.65; padding:10px 0;',
      '}',
      '.ve-comment-modal-footer {',
      '  display:flex; gap:10px; justify-content:flex-end;',
      '  padding:12px 18px;',
      '  border-top:1px solid color-mix(in srgb, var(--text, currentColor) 12%, transparent);',
      '  background:color-mix(in srgb, var(--text, currentColor) 4%, transparent);',
      '}',
      '.ve-comment-answer, .ve-comment-done {',
      '  padding:8px 18px; border-radius:6px; cursor:pointer;',
      '  border:1px solid color-mix(in srgb, var(--text, currentColor) 24%, transparent);',
      '  background:transparent; color:inherit;',
      '  font:600 13px/1.2 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0.04em; text-transform:uppercase;',
      '  transition:background 120ms, color 120ms;',
      '}',
      '.ve-comment-answer:hover:not(:disabled) {',
      '  background:var(--ve-accent, #b8861f); color:var(--ve-sel-text, #14110b);',
      '  border-color:var(--ve-accent, #b8861f);',
      '}',
      '.ve-comment-answer:disabled { opacity:0.45; cursor:not-allowed; }',
      '.ve-comment-done:hover {',
      '  background:color-mix(in srgb, var(--text, currentColor) 14%, transparent);',
      '}',
      // ─── Narrow-viewport responsive layout (≤480 px) ─────────────────
      // On phones the modal is at most calc(100vw - 16px), so 360-465 px
      // wide. Keeping the 120-px-wide thread index sidebar would leave
      // ~240 px for the active-pane content — too cramped for the
      // textarea + the comment text. Stack the body vertically (index
      // ABOVE active pane), shrink padding, and force the index to
      // a flat horizontal scroll strip so it occupies just 1-2 rows
      // instead of an always-visible left rail. Also shrink the footer
      // padding and tighten the buttons so ANSWER + DONE both fit on
      // a single row of a 359-px-wide modal.
      '@media (max-width: 480px) {',
      '  .ve-comment-modal-body { flex-direction:column; }',
      '  .ve-comment-thread-index {',
      '    width:auto; min-width:0; max-height:96px;',
      '    border-right:0;',
      '    border-bottom:1px solid color-mix(in srgb, var(--text, currentColor) 12%, transparent);',
      '  }',
      '  .ve-comment-thread-row { border-left:0; border-top:2px solid transparent; }',
      '  .ve-comment-thread-row[data-active] {',
      '    border-left-color:transparent; border-top-color:var(--ve-accent, #b8861f);',
      '  }',
      '  .ve-comment-active-pane { padding:12px 14px; }',
      '  .ve-comment-modal-header { padding:10px 12px; }',
      '  .ve-comment-modal-footer { padding:10px 12px; gap:8px; }',
      '  .ve-comment-answer, .ve-comment-done {',
      '    padding:8px 12px; flex:1 1 0; min-width:0;',
      '  }',
      '  .ve-comment-active-textarea { min-height:96px; }',
      '}',
      // ─── v3.2 — per-element decision segmented control (TRDD-7a2dab03 §3.1, §3.4)
      // ONE 3-segment control per finding: [Skip] [Approve] [Reject]. Mutex is
      // visual + ARIA-enforced (radiogroup semantics) — clicking a segment
      // activates that one and deactivates the others. Default = "skip".
      //
      // Why segmented (not 2 toggles): a switch is conventionally a binary
      // INDEPENDENT setting. Two switches side-by-side imply 4 states
      // (approve on/off × reject on/off), but the actual state space is 3
      // mutex options. A segmented control makes the mutex visible at a
      // glance and matches the semantics (`role="radiogroup"`).
      //
      // Hidden inputs preserved: each of the approve/reject segments still
      // wraps an sr-only `<input type="checkbox" data-decision="...">` so
      // existing tests + DOM consumers continue to work. The skip segment
      // has no input — its "active" state is the absence of checked inputs.
      '.ve-decision {',
      '  border:0; padding:0; margin:8px 0 12px;',
      '  display:inline-flex; align-items:center;',
      '  border-radius:calc(var(--ve-control-radius, 6px) + 2px);',
      '  background:color-mix(in srgb, var(--ve-control-border, #d6d1c5) 28%, transparent);',
      '  padding:3px;',
      '  gap:0;',
      '}',
      '.ve-sr-only {',
      '  position:absolute; width:1px; height:1px;',
      '  padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0);',
      '  white-space:nowrap; border:0;',
      '}',
      // Hidden inputs (kept for test selectors + a11y).
      '.ve-decision input[type="checkbox"] {',
      '  position:absolute; opacity:0; pointer-events:none;',
      '  width:1px; height:1px; margin:-1px;',
      '}',
      // Each segment is the visible click target. Inactive = transparent
      // background + dim text. Active = filled with the per-choice colour
      // and high-contrast text. Keyboard focus ring uses --ve-accent.
      '.ve-segment {',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  min-width:64px; padding:6px 14px;',
      '  border:0; outline:0;',
      '  background:transparent;',
      '  color:color-mix(in srgb, var(--text, currentColor) 55%, transparent);',
      '  border-radius:calc(var(--ve-control-radius, 6px) - 1px);',
      '  font:600 11px/1.2 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0.08em; text-transform:uppercase;',
      '  cursor:pointer; user-select:none;',
      '  transition:background 140ms ease, color 140ms ease, box-shadow 140ms ease;',
      '}',
      '.ve-segment:hover:not([aria-checked="true"]) {',
      '  background:color-mix(in srgb, var(--text, currentColor) 8%, transparent);',
      '  color:var(--text, currentColor);',
      '}',
      '.ve-segment:focus-visible {',
      '  outline:2px solid var(--ve-accent, #b8861f); outline-offset:2px;',
      '}',
      // Active state per segment — pulled from CSS variables so host pages
      // can override (--ve-decision-skip-bg / -approve-bg / -reject-bg).
      // Defaults: skip = neutral surface; approve = teal-ish; reject = rust.
      '.ve-segment[aria-checked="true"] {',
      '  background:var(--ve-decision-skip-bg, var(--ve-control-bg, #fbfaf6));',
      '  color:var(--ve-control-fg, var(--text, currentColor));',
      '  box-shadow:0 1px 2px rgba(0,0,0,0.14);',
      '}',
      '.ve-segment-approve[aria-checked="true"] {',
      '  background:var(--ve-decision-approve-bg, #3a6b5c);', // deep teal
      '  color:var(--ve-decision-approve-fg, #fbfaf6);',
      '}',
      '.ve-segment-reject[aria-checked="true"] {',
      '  background:var(--ve-decision-reject-bg, #a84a32);', // brick rust
      '  color:var(--ve-decision-reject-fg, #fbfaf6);',
      '}',
      // ─── v4.1 (TRDD-3d1570ab R5): per-element 3-state mini-switch ───
      // The per-finding `<fieldset class="ve-decision">` is hidden in
      // report views — the user wants ONE switch per SELECTABLE atom,
      // not one per section. The hidden inputs / DOM stay so existing
      // decision-pills tests + the .summary.json wire-protocol keep
      // working; only the visible chrome moves to .ve-decision-mini.
      // Page authors who want to RESTORE the per-finding visible
      // pillset for non-report views can opt out via
      // body[data-ve-keep-finding-decision] { ... }.
      'body[data-ve-report] .ve-decision { display:none; }',
      // v4: also hide orphan per-finding chrome that the renderer still
      // emits for backward-compat — the modal-comment flow replaces them.
      // - `.ve-finding-reply` is the per-finding textarea (replaced by modal)
      // - `.ve-finding-thread` would only contain empty thread + reply
      // - `.ve-finding-meta` is an empty <div> with data-ve-comment-id stamp
      //   that would otherwise show a hover pill on a 0×0 region.
      'body[data-ve-report] .ve-finding-reply,',
      'body[data-ve-report] .ve-finding-thread { display:none !important; }',
      'body[data-ve-report] .ve-finding-meta:empty { display:none !important; }',
      // The mini switch — three single-letter slots (S / A / D) in a
      // compact pill. ~38px wide, ~14px tall — fits at the right edge
      // of any selectable atom without disturbing the row layout.
      '.ve-decision-mini {',
      '  display:inline-flex; align-items:center; vertical-align:middle;',
      '  margin-left:0.5em;',
      // Removed parent pill background — now each segment owns its own
      // visible bounds so all 3 read as equal-sized buttons. Tiny gap
      // between segments via padding+gap so they don\'t merge visually.
      '  border:0; padding:0;',
      '  gap:2px;',
      '  background:transparent;',
      '  font:600 9px/1 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0.06em; text-transform:uppercase;',
      '  user-select:none;',
      '}',
      '.ve-decision-mini-seg {',
      '  display:inline-flex; align-items:center; justify-content:center;',
      // Relative sizing: chip scales with its own font-size so it stays
      // readable at any zoom level / user font-size preference. 1.4em
      // ≈ 24px at the 17px base, gives a thumb-tappable target while
      // still being compact enough to ride at the right edge of a row.
      '  width:1.4em; height:1.4em;',
      '  border:0; outline:0; margin:0;',
      // STRONG visible button-frame on UNSELECTED segments so all 3
      // segments read as equal-sized boxes regardless of selection
      // state. Solid bg + visible inset stroke (not transparent tint)
      // — previous 18% bg was invisible against the page background
      // so unselected glyphs looked like floating icons, making the
      // selected segment appear "bigger" than the others.
      '  background:color-mix(in srgb, var(--ve-control-border, #d6d1c5) 55%, transparent);',
      '  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--text, currentColor) 22%, transparent);',
      '  color:var(--ve-decision-mini-icon-fg, color-mix(in srgb, var(--text, currentColor) 55%, transparent));',
      '  border-radius:0.25em;',                                 // also relative — scales with chip
      '  cursor:pointer;',
      // 17px base size so the SESAME DOT (U+FE45 — a naturally thin/tiny
      // Japanese emphasis stroke) reads alongside the heavier ✔︎ and ✘
      // glyphs. Override the parent pill\'s 9px font + uppercase
      // letter-spacing inheritance.
      '  font:600 17px/1 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0;',
      '  text-transform:none;',
      '  transition:background 120ms ease, color 120ms ease, box-shadow 120ms ease;',
      '}',
      // Hover on UNSELECTED: subtle bg lift + slight icon brighten so the
      // affordance reads as "you can click me" without committing color
      // semantics yet.
      '.ve-decision-mini-seg:hover:not([aria-checked="true"]) {',
      '  background:color-mix(in srgb, var(--text, currentColor) 8%, transparent);',
      '  color:color-mix(in srgb, var(--text, currentColor) 80%, transparent);',
      '}',
      // SELECTED: per-symbol semantic color (red ✘ / blue ﹅ / green ✔︎)
      // applied to BOTH the icon AND a soft 15% bg ring + 35% inset stroke
      // so the segment is unambiguously "the chosen one" without harsh
      // color-on-color contrast that previously washed out the glyph.
      '.ve-decision-mini-skip[aria-checked="true"] {',
      '  color:var(--ve-decision-skip-symbol, #3464a8);',
      '  background:color-mix(in srgb, var(--ve-decision-skip-symbol, #3464a8) 15%, transparent);',
      '  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--ve-decision-skip-symbol, #3464a8) 38%, transparent);',
      '}',
      '.ve-decision-mini-approve[aria-checked="true"] {',
      '  color:var(--ve-decision-approve-symbol, #3a6b5c);',
      '  background:color-mix(in srgb, var(--ve-decision-approve-symbol, #3a6b5c) 15%, transparent);',
      '  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--ve-decision-approve-symbol, #3a6b5c) 38%, transparent);',
      '}',
      '.ve-decision-mini-deny[aria-checked="true"] {',
      '  color:var(--ve-decision-deny-symbol, #a84a32);',
      '  background:color-mix(in srgb, var(--ve-decision-deny-symbol, #a84a32) 15%, transparent);',
      '  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--ve-decision-deny-symbol, #a84a32) 38%, transparent);',
      '}',
      // Hover on the SELECTED segment: brighten slightly so the user can
      // tell their click will toggle to "deselect" if applicable.
      '.ve-decision-mini-skip[aria-checked="true"]:hover,',
      '.ve-decision-mini-approve[aria-checked="true"]:hover,',
      '.ve-decision-mini-deny[aria-checked="true"]:hover { filter:brightness(1.10); }',
      // For table rows: append the mini-switch in a special <td> cell
      // at the row's far right. The CSS keeps it visually distinct
      // from data cells (no border-left, slightly tighter padding).
      // Decision-mini cell — INHERITS the standard `th, td` border + padding
      // + thead-th tint so the column looks like every other column (per
      // user feedback: do NOT make this cell visually different from the
      // rest of the table). Only overrides: text-align center for chip
      // placement, width to host the chip, vertical-align middle so the
      // chip sits in the row center instead of glued to the top.
      'td.ve-decision-mini-cell {',
      // Width is content-driven — the chip determines its own size via
      // em units, the cell shrinks to fit. No hardcoded pixel width
      // so the column adapts to font size, zoom, and viewport changes.
      '  width:1%;',                                            // CSS trick: forces auto-layout to give cell its content width
      '  white-space:nowrap;',                                  // chip stays on one line
      '  padding:0.5em 0.6em;',                                 // relative padding, scales with cell font
      '  text-align:center;',
      '  vertical-align:middle;',                               // chip centers vertically in the row
      '}',
      // Header cell uses the SAME styling as every other thead th —
      // inherits bg tint, border-bottom, font from `thead th` above.
      // Adds center alignment + content-driven width.
      'th.ve-decision-mini-cell {',
      '  width:1%;',                                            // shrinks to header text width ("Your choice")
      '  padding:0.5em 0.6em;',
      '  text-align:center;',
      '  white-space:nowrap;',
      '}',
      // ─── Region 3 (TRDD-352ef46a Phase 2.5 USER REQ #10) ────────────────
      // .ve-decision-mini-pill — atom-scoped 3-radio S/A/D chip
      // attached by sibling agents via window.amvcpRuntime.attachDecisionMini.
      // Visually distinct from the existing .ve-decision-mini (which
      // uses unicode glyphs and stays auto-injected per atom in report
      // mode); this variant uses S/A/D letter labels and ships from
      // sibling visualize-skill modules. Both can coexist on the page.
      '.ve-decision-mini-pill {',
      '  display:inline-flex; align-items:stretch;',
      '  position:absolute; top:6px; right:6px;',
      '  border:1px solid var(--vc-color-border, var(--ve-control-border, rgba(0,0,0,0.18)));',
      '  border-radius:var(--vc-radius-full, 9999px);',
      '  background:color-mix(in srgb, var(--bg, #faf6ee) 88%, transparent);',
      '  font:600 9px var(--ve-control-font, ui-sans-serif,system-ui,-apple-system,sans-serif);',
      '  letter-spacing:0.06em;',
      '  z-index:5;',
      '  pointer-events:auto;',
      '  user-select:none;',
      '  opacity:0.6;',
      '  transition:opacity 120ms ease, box-shadow 120ms ease;',
      '}',
      '.ve-decision-mini-pill:hover { opacity:1; }',
      '[data-ve-selected="1"] > .ve-decision-mini-pill,',
      '[data-ve-selected] > .ve-decision-mini-pill,',
      '[data-ve-comment-active] > .ve-decision-mini-pill {',
      '  opacity:1;',
      '  box-shadow:0 0 0 2px color-mix(in srgb, var(--vc-color-accent, var(--ve-accent, #b8861f)) 28%, transparent);',
      '}',
      '.ve-decision-mini-pill-radio {',
      '  position:absolute; opacity:0; width:0; height:0; pointer-events:none;',
      '  margin:0; padding:0;',
      '}',
      '.ve-decision-mini-pill-seg {',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  min-width:28px;',
      '  padding:3px 8px;',
      '  cursor:pointer;',
      '  color:color-mix(in srgb, var(--text, #1f1a14) 65%, transparent);',
      '  background:transparent;',
      '  border-right:1px solid color-mix(in srgb, var(--vc-color-border, var(--ve-control-border, rgba(0,0,0,0.18))) 80%, transparent);',
      '  transition:background 120ms ease, color 120ms ease;',
      '}',
      '.ve-decision-mini-pill-seg:last-of-type { border-right:0; }',
      '.ve-decision-mini-pill-seg:hover {',
      '  background:color-mix(in srgb, var(--vc-color-accent, var(--ve-accent, #b8861f)) 18%, transparent);',
      '  color:var(--text, #1f1a14);',
      '}',
      '.ve-decision-mini-pill-radio:checked + .ve-decision-mini-pill-seg {',
      '  background:var(--vc-color-accent, var(--ve-accent, #b8861f));',
      '  color:var(--vc-color-on-accent, var(--ve-on-accent, #fffdf9));',
      '}',
      '.ve-decision-mini-pill-seg-skip    { border-top-left-radius:var(--vc-radius-full, 9999px); border-bottom-left-radius:var(--vc-radius-full, 9999px); }',
      '.ve-decision-mini-pill-seg-deny    { border-top-right-radius:var(--vc-radius-full, 9999px); border-bottom-right-radius:var(--vc-radius-full, 9999px); }',
      '.ve-decision-mini-pill-radio:focus-visible + .ve-decision-mini-pill-seg {',
      '  outline:2px solid var(--vc-color-accent, var(--ve-accent, #b8861f));',
      '  outline-offset:2px;',
      '}',
      // ─── Bulk-default switch (in .ve-report-banner) ────────────────────
      // Lets the user mark every decision-mini in one stroke (Skip /
      // Approve / Deny). Workflow: pick a default upfront, then flip the
      // few items that should differ. Click overwrites all current
      // selections (no merge) — that is the point of "default".
      '.ve-bulk-default {',
      '  display:inline-flex; align-items:center; gap:8px; flex-wrap:wrap;',
      '  margin: 10px 0 0; padding: 6px 10px;',
      '  background:color-mix(in srgb, var(--ve-accent, currentColor) 4%, transparent);',
      '  border:1px solid color-mix(in srgb, var(--ve-accent, currentColor) 18%, transparent);',
      '  border-radius:6px;',
      '  font: 12px/1.4 inherit;',
      '}',
      '.ve-bulk-default-label {',
      '  font-weight:600;',
      '  color:color-mix(in srgb, var(--text, currentColor) 75%, transparent);',
      '  font-size:12px;',
      '  letter-spacing:0.02em;',
      '}',
      '.ve-bulk-default-pill {',
      '  display:inline-flex; align-items:center;',
      '  border-radius:5px; padding:2px;',
      '  background:color-mix(in srgb, var(--ve-control-border, #d6d1c5) 35%, transparent);',
      '}',
      '.ve-bulk-default-seg {',
      '  border:0; outline:0; margin:0;',
      '  padding:4px 10px;',
      '  background:transparent;',
      '  color:color-mix(in srgb, var(--text, currentColor) 65%, transparent);',
      '  font:600 11px/1 ui-sans-serif,system-ui,sans-serif;',
      '  letter-spacing:0.04em; text-transform:uppercase;',
      '  border-radius:3px;',
      '  cursor:pointer;',
      '  transition:background 120ms ease, color 120ms ease, transform 120ms ease;',
      '}',
      '.ve-bulk-default-seg:hover {',
      '  background:color-mix(in srgb, var(--text, currentColor) 10%, transparent);',
      '  color:var(--text, currentColor);',
      '}',
      '.ve-bulk-default-approve:hover {',
      '  background:color-mix(in srgb, var(--ve-decision-approve-bg, #3a6b5c) 22%, transparent);',
      '  color:var(--text, currentColor);',
      '}',
      '.ve-bulk-default-deny:hover {',
      '  background:color-mix(in srgb, var(--ve-decision-reject-bg, #a84a32) 22%, transparent);',
      '  color:var(--text, currentColor);',
      '}',
      '.ve-bulk-default-seg:active { transform: scale(0.96); }',
      // Symbol prefix doubles as a legend mapping the per-element mini-chip
      // glyphs (﹅/✔︎/✘) to the plain-English labels (Skip/Approve/Deny).
      // Each takes the same semantic color as the matching mini-segment.
      '.ve-bulk-default-symbol {',
      '  display:inline-block;',
      '  font-size:14px; line-height:1;',
      '  vertical-align:-1px;',
      '  letter-spacing:0;',
      '}',
      '.ve-bulk-default-skip .ve-bulk-default-symbol {',
      '  color:var(--ve-decision-skip-symbol, #3464a8);',
      '}',
      '.ve-bulk-default-approve .ve-bulk-default-symbol {',
      '  color:var(--ve-decision-approve-symbol, #3a6b5c);',
      '}',
      '.ve-bulk-default-deny .ve-bulk-default-symbol {',
      '  color:var(--ve-decision-deny-symbol, #a84a32);',
      '}',
      '.ve-bulk-default-flash {',
      '  margin-left:4px;',
      '  font-size:11px; font-weight:500;',
      '  color:color-mix(in srgb, var(--ve-accent, currentColor) 80%, transparent);',
      '  opacity:0;',
      '  transition:opacity 200ms ease;',
      '}',
      '.ve-bulk-default-flash[data-show="1"] { opacity:1; }',
      // ─── Two standalone action buttons (top-right + bottom-(left|right)) ──
      // Y-anchored to the PAGE (position:absolute on body, so they live in
      // the document flow and are reachable only by scrolling to the top
      // or bottom of the page — they NEVER overlap mid-page content),
      // X-anchored to the VIEWPORT (a scroll-listener updates `left` on
      // every horizontal scroll so they stay at the visible right/left
      // edge regardless of how wide the page is).
      //
      // Per the user-stated design contract:
      //  - "if there is a horizontal scrollbar … the button is still
      //     visible on the bottom right (if the scroll reached the bottom)"
      //  - "if the scroll did not reach the bottom, the button is not
      //     visible since it is anchored to the y of the page"
      //  - "no matter the position of the horizontal scrollbar, the top
      //     button is always at the extreme right of the viewport, and
      //     the bottom button is always at either the extreme left or
      //     the right of the viewport"
      //
      // The IDs ve-submit-tr / ve-submit-bl are PRESERVED for backwards-
      // compat with existing test selectors. They now also correspond to
      // their actual physical positions again (TR = top-right, BL =
      // bottom-(left|right)).
      //
      // Theme: each button uses --ve-control-* CSS variables so it
      // inherits the host page palette. No backdrop-blur container —
      // the user explicitly asked for two clean floating buttons, not a
      // single glass bar.
      '.ve-action-btn {',
      // position:fixed pins X+Y to the viewport. We mimic the user-asked
      // "Y anchored to PAGE" behaviour at the JS layer instead:
      // pinActionButtonsToViewport() shows the top button only when the
      // page is scrolled to the very top, and the bottom button only
      // when the page is scrolled to the very bottom. Mid-page → both
      // invisible. This is functionally equivalent to "anchored to the
      // Y of the page" without the document-width feedback loop that
      // position:absolute + dynamic-left was triggering on pages with a
      // horizontal scrollbar.
      '  position:fixed;',
      '  z-index:2147483646;',
      '}',
      '.ve-action-btn--top    { top:36px;    right:36px; }',
      '.ve-action-btn--bottom { bottom:36px; right:36px; }',
      '.ve-action-btn--bottom[data-ve-action-side="left"] { left:36px; right:auto; }',
      // Reserve space at the top + bottom of body so the action buttons
      // sit on an EMPTY band, never overlapping page content. The user-
      // stated requirement is SYMMETRIC breathing room: viewport-edge ↔
      // button must equal button ↔ content. With a 36px outer gap and a
      // ~36px tall button, each band totals 36 + 36 + 36 = 108px.
      //
      // !important is necessary because most demo pages set their own
      // body padding (often less). Opt-out for pages that need
      // edge-to-edge content: <body data-ve-no-action-padding>.
      'body:not([data-ve-no-action-padding]) {',
      '  padding-top:108px !important;',
      '  padding-bottom:108px !important;',
      '}',
      // Buttons inside the bar AND any standalone runtime button. They
      // both use the shared --ve-control-* palette so a host-page
      // override re-themes the whole runtime UI in one place.
      '.ve-floating-btn {',
      '  appearance:none; -webkit-appearance:none;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  min-width:84px; padding:9px 16px;',
      '  border-radius:var(--ve-control-radius);',
      // Border + label use the SAME deeper-brown that the code-block\'s
      // selected-state outer ring uses, so all chrome on a light page
      // shares a single dark-brown accent. Background stays neutral so
      // the button reads as a tertiary affordance, not a primary CTA.
      '  border:1px solid var(--ve-accent-dark, #6e4d18);',
      '  font:600 13px/1.2 var(--ve-control-font);',
      '  letter-spacing:0.02em;',
      '  background:var(--ve-control-bg);',
      '  color:var(--ve-accent-dark, #6e4d18);',
      '  cursor:pointer;',
      '  transition:background 120ms ease, color 120ms ease,',
      '              border-color 120ms ease, box-shadow 120ms ease,',
      '              transform 120ms ease;',
      '}',
      '.ve-floating-btn:hover { background:var(--ve-control-bg-hover); border-color:var(--ve-control-border-strong); }',
      '.ve-floating-btn:active { transform:translateY(1px); }',
      '.ve-floating-btn:focus-visible {',
      '  outline:2px solid var(--ve-accent, var(--accent, #b8861f));',
      '  outline-offset:2px;',
      '}',
      // Primary variant — used for Submit when at least one selection
      // exists. Reads --ve-accent (already shipped by the runtime for
      // the hover glow). Falls back to host --accent then to the gold
      // default. The text colour is forced to --ve-control-accent-fg
      // (default near-black via --ve-sel-text) so it stays readable on
      // every accent hue.
      '.ve-floating-btn--primary {',
      '  background:var(--ve-accent, var(--accent, #b8861f));',
      '  color:var(--ve-control-accent-fg);',
      '  border-color:transparent;',
      '  box-shadow:var(--ve-control-shadow-soft);',
      '}',
      '.ve-floating-btn--primary:hover {',
      '  background:color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 88%, black 12%);',
      '  border-color:transparent;',
      '}',
      // Tertiary variant for Clear-all (touch-only). Same chrome as the
      // secondary variant but explicitly muted so it does not compete
      // with Exit/Submit visually.
      '.ve-floating-btn--ghost {',
      '  background:transparent;',
      // Ghost variant (Cancel / Done buttons) uses the SAME deeper-brown
      // accent as the code-block selected-outline. Keeps the page chrome
      // in one warm palette so the floating action buttons read as part
      // of the brown theme rather than neutral gray.
      '  color:var(--ve-accent-dark, #6e4d18);',
      '  border-color:var(--ve-accent-dark, #6e4d18);',
      '}',
      '.ve-floating-btn--ghost:hover {',
      '  background:var(--ve-control-bg-hover);',
      '  color:var(--ve-accent-dark, #6e4d18);',
      '  border-color:var(--ve-accent-dark, #6e4d18);',
      '}',
      // ─── Form-mode custom radio / checkbox glyphs ─────────────────────
      // The runtime still injects a real <input type="radio"> /
      // <input type="checkbox"> (so existing tests selecting on
      // input[data-ve-control] keep working and screen readers still see
      // a native control), but the input is visually hidden via the
      // sr-only pattern and a styled <span class="ve-form-glyph"> is
      // rendered alongside it. The glyph picks its colour from the host
      // accent so the control sits inside the page palette instead of
      // exposing the OS\'s native chrome.
      '.ve-form-cell { position:relative; display:inline-block; }',
      '.ve-form-cell input[data-ve-control] {',
      // Standard sr-only / visually-hidden pattern — fully removes the
      // native <input> chrome from rendering on every browser/zoom level
      // (the previous opacity:0 + inset:0 trick still painted faint
      // native borders on some Chromium/WebKit revisions, which leaked
      // through next to the .ve-form-glyph). The input remains
      // focusable, Tab-reachable, Space-toggleable, and exposed to
      // assistive tech — only its pixel chrome is gone. The visible
      // affordance is the .ve-form-glyph sibling, and clicks land on
      // the row-level click handler installed in initTableForm().
      '  position:absolute;',
      '  width:1px; height:1px;',
      '  padding:0; margin:-1px;',
      '  overflow:hidden; clip:rect(0,0,0,0);',
      '  white-space:nowrap; border:0;',
      '}',
      '.ve-form-glyph {',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  width:18px; height:18px;',
      '  background:var(--ve-control-bg);',
      '  border:1.5px solid var(--ve-control-border-strong);',
      '  color:transparent;',
      '  transition:all 120ms ease-out;',
      '  cursor:pointer;', // glyph is now the visible click target
      '}',
      '.ve-form-glyph--radio { border-radius:50%; }',
      '.ve-form-glyph--check { border-radius:4px; }',
      // Hover (cell-level so the user gets feedback the moment the
      // pointer lands anywhere in the leading column).
      '.ve-form-cell:hover .ve-form-glyph {',
      '  border-color:var(--ve-accent, var(--accent, #b8861f));',
      '  background:color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 8%, var(--ve-control-bg) 92%);',
      '}',
      // Focus ring on the (invisible) input lights the glyph instead.
      // Outline + box-shadow both — outline guarantees a visible ring on
      // every renderer (spec-compliant a11y affordance for keyboard
      // users), box-shadow softens the edge so it reads as a glow rather
      // than a hard system rectangle.
      '.ve-form-cell input[data-ve-control]:focus-visible ~ .ve-form-glyph {',
      '  outline:2px solid var(--ve-accent, var(--accent, #b8861f));',
      '  outline-offset:2px;',
      '  border-color:var(--ve-accent, var(--accent, #b8861f));',
      '  box-shadow:0 0 0 3px color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 28%, transparent);',
      '}',
      // Checked state — fill the glyph with the accent and reveal the
      // inner mark (radio dot or check mark drawn by ::after).
      '.ve-form-cell input[data-ve-control]:checked ~ .ve-form-glyph {',
      '  background:var(--ve-accent, var(--accent, #b8861f));',
      '  border-color:var(--ve-accent, var(--accent, #b8861f));',
      '  color:var(--ve-control-accent-fg);',
      '}',
      // Radio dot.
      '.ve-form-glyph--radio::after {',
      '  content:""; width:8px; height:8px; border-radius:50%;',
      '  background:currentColor;',
      '  transform:scale(0); transition:transform 140ms ease;',
      '}',
      '.ve-form-cell input[data-ve-control]:checked ~ .ve-form-glyph--radio::after {',
      '  transform:scale(1);',
      '}',
      // Checkbox tick — drawn via two thin pseudo-element borders that
      // form an inverted-L. Rendered with currentColor so it inherits
      // the contrast colour set by the checked-state rule above.
      '.ve-form-glyph--check::after {',
      '  content:""; width:5px; height:9px;',
      '  border:solid currentColor; border-width:0 2px 2px 0;',
      '  transform:rotate(45deg) scale(0); margin-top:-2px;',
      '  transition:transform 140ms ease;',
      '}',
      '.ve-form-cell input[data-ve-control]:checked ~ .ve-form-glyph--check::after {',
      '  transform:rotate(45deg) scale(1);',
      '}',
      // Free-text wrapper — sits inline with the row label so the
      // <input type="text"> picks up the host palette instead of the
      // browser-default white-on-system-grey.
      '.ve-form-text-wrap input[type="text"], .ve-form-text-wrap textarea {',
      '  width:100%; box-sizing:border-box;',
      '  padding:7px 11px;',
      '  background:var(--ve-control-bg);',
      '  color:var(--ve-control-fg);',
      '  border:1px solid var(--ve-control-border);',
      '  border-radius:var(--ve-control-radius-sm);',
      '  font:var(--ve-control-font);',
      '  transition:border-color 120ms ease, box-shadow 120ms ease;',
      '}',
      '.ve-form-text-wrap input[type="text"]:focus, .ve-form-text-wrap textarea:focus {',
      '  outline:none;',
      '  border-color:var(--ve-accent, var(--accent, #b8861f));',
      '  box-shadow:0 0 0 3px color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 22%, transparent);',
      '}',
      // Submit button at the bottom of a table-form. Same chrome as the
      // floating primary button so the page reads as one design system.
      '.ve-form-submit-row { background:transparent; }',
      '.ve-form-submit-row td { background:transparent; }',
      '.ve-form-status {',
      '  opacity:0.65; font-size:13px; margin-right:14px;',
      '  color:var(--ve-control-fg-dim);',
      '}',
      '.ve-form-submit {',
      '  appearance:none; -webkit-appearance:none;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  min-width:104px; padding:9px 18px;',
      '  border-radius:var(--ve-control-radius);',
      '  border:1px solid transparent;',
      '  font:600 13px/1.2 var(--ve-control-font); letter-spacing:0.04em;',
      '  background:var(--ve-accent, var(--accent, #b8861f));',
      '  color:var(--ve-control-accent-fg);',
      '  cursor:pointer;',
      '  box-shadow:var(--ve-control-shadow-soft);',
      '  transition:background 120ms ease, transform 120ms ease,',
      '              opacity 120ms ease, box-shadow 120ms ease;',
      '}',
      '.ve-form-submit:hover:not(:disabled) {',
      '  background:color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 88%, black 12%);',
      '}',
      '.ve-form-submit:active:not(:disabled) { transform:translateY(1px); }',
      '.ve-form-submit:focus-visible {',
      '  outline:2px solid var(--ve-accent, var(--accent, #b8861f));',
      '  outline-offset:3px;',
      '}',
      '.ve-form-submit:disabled {',
      '  background:color-mix(in srgb, var(--ve-control-fg-dim, currentColor) 22%, transparent);',
      '  color:var(--ve-control-fg-dim);',
      '  cursor:not-allowed; box-shadow:none;',
      '}',
      // ─── Mermaid / Graphviz zoom controls (themable) ──────────────────
      // Replaces the previous hardcoded dark-translucent toolbar (which
      // looked great on dark themes but jarring on every warm/light page)
      // with one that reads its surface and text from --ve-control-* so
      // it sits inside the host palette automatically.
      '.ve-graph-controls {',
      '  background:var(--ve-control-overlay-bg);',
      '  -webkit-backdrop-filter:var(--ve-control-overlay-blur);',
      '  backdrop-filter:var(--ve-control-overlay-blur);',
      '  border:1px solid var(--ve-control-border);',
      '  color:var(--ve-control-fg);',
      '  box-shadow:var(--ve-control-shadow-soft);',
      '}',
      '.ve-graph-btn {',
      '  background:transparent; border:0; color:var(--ve-control-fg);',
      '  width:30px; height:30px; cursor:pointer;',
      '  border-radius:var(--ve-control-radius-sm);',
      '  font:600 14px/1 var(--ve-control-font);',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  transition:background 120ms ease, color 120ms ease;',
      '}',
      '.ve-graph-btn:hover {',
      '  background:color-mix(in srgb, var(--ve-accent, var(--accent, #b8861f)) 18%, transparent);',
      '  color:var(--ve-control-fg);',
      '}',
      '.ve-graph-btn:focus-visible {',
      '  outline:2px solid var(--ve-accent, var(--accent, #b8861f));',
      '  outline-offset:2px;',
      '}',
      '.ve-graph-zoom-label {',
      '  color:var(--ve-control-fg-dim);',
      '  padding:0 8px;',
      '  display:inline-flex; align-items:center;',
      '  font:11px/1 var(--ve-control-font);',
      '  letter-spacing:0.04em;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // F4 — deleted dead `showSendingOverlay` (~7 LOC) and
  // `showSentThenClose` (~31 LOC) per js audit M1: both were tied
  // to the synchronous-fetch + overlay flow that has been replaced
  // by sendBeacon/fetch keepalive — they had no callers anywhere
  // and the new flow doesn't need them. Confirmed via grep + git
  // log -G at audit time.
  //
  // Audit-fix re-verification (TRDD-1dcd0bd7 followup): the
  // "Selection sent — close this tab" body that USED TO live in
  // showSentThenClose was duplicated INLINE at two send-path sites
  // (after the original deletion). That duplicate is now extracted
  // into `showCloseConfirmation()` below and called from both
  // sites — the modern equivalent of the dead function's fallback
  // page, single-source-of-truth.

  function showCloseConfirmation(mode) {
    // Replace the document body with the minimal "Selection sent — close
    // this tab" page. Used after sendBeacon/fetch keepalive when
    // window.close() is denied (which is the default for any tab the user
    // opened directly rather than via Chromium --app). Idempotent: bails
    // when the document is already hidden (window.close() succeeded).
    //
    // A2 (TRDD-5f41ad36): when called with mode === 'fallback', we adjust
    // the displayed copy to "Selection received" + "The agent has your
    // selection" — the same wording as the server-rendered /__ve-thanks
    // page. This is the user-facing string for the case where the runtime
    // is loaded inside the user's default browser (no Chromium app mode)
    // and we lost the race with location.replace() to the thanks page —
    // either way the message they see is consistent.
    if (document.visibilityState === 'hidden' || !document.body) return;
    var isFallback = mode === 'fallback';
    var title = isFallback ? 'Selection received — close this tab' : 'Selection sent — close this tab';
    var heading = isFallback ? 'Selection received' : 'Selection sent';
    var subtitle = isFallback
      ? 'The agent has your selection. You can close this tab.'
      : 'You can close this tab.';
    document.title = title;
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;'
      + 'background:#0f1115;color:#e8eaee;font:15px/1.5 system-ui,-apple-system,sans-serif;'
      + 'text-align:center;padding:24px;">'
      + '<div>'
        + '<div style="font:500 11px/1 ui-monospace,Menlo,monospace;letter-spacing:0.12em;'
        + 'text-transform:uppercase;opacity:0.5;margin-bottom:14px;">ai-maestro-visual-communicator-plugin</div>'
        + '<h1 style="font-weight:500;font-size:22px;margin:0 0 6px;">' + heading + '</h1>'
        + '<p style="opacity:0.6;margin:0;">' + subtitle + '</p>'
      + '</div>'
      + '</div>';
  }

  function showStaticFallback(payload, overlay) {
    var json = JSON.stringify(payload, null, 2);
    overlay.card.style.maxWidth = '640px';
    overlay.card.innerHTML =
      '<div style="font:500 11px/1 ui-monospace,Menlo,monospace;letter-spacing:0.12em;text-transform:uppercase;opacity:0.55;margin-bottom:12px;">ai-maestro-visual-communicator-plugin · selection</div>' +
      '<div style="text-align:left;font-size:14px;line-height:1.6;margin-bottom:12px;opacity:0.85;">' +
        'This page was opened directly (not via the agent runner), so the selection cannot be sent automatically. ' +
        'Copy the payload below and paste it back to your agent.' +
      '</div>' +
      '<pre id="ve-payload" style="background:#0c0e12;color:#e8eaee;padding:14px 16px;border-radius:10px;text-align:left;overflow:auto;font:13px/1.5 ui-monospace,Menlo,monospace;margin:0 0 14px;border:1px solid rgba(255,255,255,0.05);">' + escapeHtml(json) + '</pre>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
        '<button id="ve-cancel" style="background:transparent;color:#e8eaee;border:1px solid rgba(255,255,255,0.18);padding:8px 16px;border-radius:8px;cursor:pointer;">Cancel</button>' +
        '<button id="ve-copy" style="background:#fff;color:#0f1115;border:0;padding:8px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Copy JSON</button>' +
      '</div>';
    overlay.root.querySelector('#ve-copy').addEventListener('click', function () {
      var btn = this;
      var done = function () { btn.textContent = 'Copied'; btn.disabled = true; };
      // navigator.clipboard.writeText is universally available in modern
      // browsers (Chrome 66+, Firefox 63+, Safari 13.1+). Older textarea +
      // document.execCommand('copy') fallback removed — execCommand is
      // deprecated by web standards.
      navigator.clipboard.writeText(json).then(done, done);
    });
    overlay.root.querySelector('#ve-cancel').addEventListener('click', function () {
      overlay.root.remove();
      sending = false;
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Universal tooltip / popup viewport-clamp ──────────────────────
  // Shifts a desired (top, left) PAGE coordinate so an element of the
  // given size always fits inside the currently-visible viewport, with
  // an optional padding margin from the viewport edges. Used by every
  // free-floating tooltip / popup in the runtime so none of them get
  // clipped on narrow viewports (iTerm2 split-pane, mobile, etc.).
  //
  // Inputs are PAGE coordinates (i.e. include window.scrollX/Y) — most
  // callers compute `rect.top + window.scrollY` from
  // getBoundingClientRect, which is the page coord of the viewport-
  // relative rect. The function returns adjusted page coordinates that
  // the caller can write directly to `el.style.top/left`.
  //
  // Calling pattern:
  //   var pos = clampToViewport(el, desiredTop, desiredLeft, 8);
  //   el.style.top  = pos.top  + 'px';
  //   el.style.left = pos.left + 'px';
  function clampToViewport(el, top, left, pad) {
    if (pad == null) pad = 8;
    // Element must be in the document so offsetWidth/Height are real.
    var w = el.offsetWidth || el.getBoundingClientRect().width || 0;
    var h = el.offsetHeight || el.getBoundingClientRect().height || 0;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var sx = window.scrollX || window.pageXOffset || 0;
    var sy = window.scrollY || window.pageYOffset || 0;
    // Visible-viewport range expressed in page coords.
    var minLeft = sx + pad;
    var maxLeft = sx + vw - w - pad;
    var minTop  = sy + pad;
    var maxTop  = sy + vh - h - pad;
    // If the element is wider/taller than the viewport (minus pad),
    // pin to minLeft/minTop so the LEFT/TOP edge stays visible (more
    // common case for a tooltip — user wants to see the start of it).
    if (maxLeft < minLeft) maxLeft = minLeft;
    if (maxTop  < minTop)  maxTop  = minTop;
    if (left < minLeft) left = minLeft;
    else if (left > maxLeft) left = maxLeft;
    if (top  < minTop)  top  = minTop;
    else if (top  > maxTop)  top  = maxTop;
    return { top: top, left: left };
  }

  function postSelection(payload) {
    if (sending) return;
    sending = true;

    payload = payload || {};
    if (payload.id == null && payload.label == null && payload.type == null) {
      sending = false;
      return; // nothing meaningful to send
    }
    if (typeof payload.label === 'string') {
      payload.label = payload.label.replace(/\s+/g, ' ').trim().slice(0, 240);
    }

    if (!isInteractive) {
      // Page opened directly via file:// — there is no /__ve-select
      // endpoint to talk to, so fall back to the copy-to-clipboard overlay.
      var overlay = buildOverlay();
      showStaticFallback(payload, overlay);
      return;
    }

    // Interactive mode: fire-and-forget the POST and close the window
    // immediately. sendBeacon is designed exactly for "send-on-unload"
    // semantics — the browser keeps the request in flight even after the
    // document is gone. Falls back to fetch(keepalive:true) on the small
    // number of browsers that don't expose sendBeacon.
    //
    // A2 (TRDD-5f41ad36) — in fallback-browser mode (Chromium not found,
    // launched via webbrowser.open() in the user's default browser), use
    // fetch instead of sendBeacon. fetch lets us (a) send the
    // X-Browser-Mode header so the server can echo back `thanks_url`,
    // and (b) read the response so we can `location.replace()` to the
    // thanks page — sendBeacon supports neither.
    var body = JSON.stringify(payload);
    if (isFallbackBrowser) {
      try {
        fetch('/__ve-select', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'X-Browser-Mode': 'fallback'
          },
          body: body
        }).then(function (r) {
          if (!r) return null;
          return r.json().catch(function () { return null; });
        }).then(function (j) {
          var thanks = j && typeof j.thanks_url === 'string' ? j.thanks_url : null;
          if (thanks) {
            try { location.replace(thanks); return; } catch (_) {}
          }
          showCloseConfirmation('fallback');
        }).catch(function () {
          showCloseConfirmation('fallback');
        });
      } catch (_) {
        showCloseConfirmation('fallback');
      }
      return;
    }

    var sent = false;
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: 'application/json' });
        sent = navigator.sendBeacon('/__ve-select', blob);
      } catch (_) {}
    }
    if (!sent) {
      try {
        fetch('/__ve-select', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function () {});
      } catch (_) {}
    }

    // 30 ms is long enough for sendBeacon to hand the request off to the
    // network stack and short enough to feel instant.
    setTimeout(function () {
      try { window.close(); } catch (_) {}
      // If close was denied (tab not opened by JS), show the minimal
      // close-confirmation. With Chromium --app this never runs because
      // window.close() succeeds and the document is gone.
      setTimeout(showCloseConfirmation, 120);
    }, 30);
  }

  // ─────────────────────────────────────────────────────────────────────
  // MULTI-SELECT STATE — phase 1 of TRDD-7a98 overhaul.
  //
  // veSelection is the chronological list of currently-checked items.
  // A click on any element-kind [data-ve-id] toggles its membership;
  // the user closes the window by clicking Submit/Exit (or hitting
  // Enter), not by individual clicks. ESC clears the multi-select set
  // but never touches form-mode checkboxes/radios.
  //
  // Legacy callers (table-form submit, text-snippet popup) still go
  // through the old single-shot postSelection() path until phases 4+
  // unify them; that path remains structurally identical, just under
  // a parallel API.
  // ─────────────────────────────────────────────────────────────────────
  var veSelection = [];
  // Exposed on window as a debugging hook; cast to any so the TS language
  // server doesn't flag the property assignment on the standard Window type.
  (/** @type {any} */ (window)).veSelection = veSelection;

  function entryIdFor(payload) {
    // Stable identity within the selection set. Element-kind entries
    // collapse to their data-ve-id; future kinds (text/row/column/code)
    // will each compose their own id from kind + anchor.
    return 'element:' + (payload && payload.id);
  }

  function findSelectionIndex(entryId) {
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) return i;
    }
    return -1;
  }

  function toggleElementSelection(payload) {
    if (!payload || !payload.id) return;
    var entry = {
      kind: 'element',
      entryId: entryIdFor(payload),
      id: payload.id,
      type: payload.type || null,
      label: payload.label || null,
      data: payload.data || null
    };
    var idx = findSelectionIndex(entry.entryId);
    if (idx >= 0) {
      veSelection.splice(idx, 1);
    } else {
      veSelection.push(entry);
    }
    repaintSelectedElements();
  }
  window.veToggle = toggleElementSelection;

  function repaintSelectedElements() {
    // Mark every [data-ve-id] with data-ve-selected="1" iff its id is
    // currently in veSelection. Linear pass — pages don't have thousands
    // of clickable elements, and this avoids tracking diffs.
    var inSet = {};
    for (var i = 0; i < veSelection.length; i++) {
      var e = veSelection[i];
      if (e && e.kind === 'element') inSet[e.id] = 1;
    }
    var all = document.querySelectorAll('[data-ve-id]');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var id = el.getAttribute('data-ve-id');
      if (inSet[id]) el.setAttribute('data-ve-selected', '1');
      else el.removeAttribute('data-ve-selected');
    }
    updateSubmitButtonsState();
  }

  function buildSubmissionPayload(kind) {
    // New wire format introduced in phase 1: a list of selections plus a
    // top-level kind ("submit" when there is at least one selection,
    // "exit" when the user closes with an empty set).
    //
    // We copy ALL fields per entry except `entryId` (internal dedupe key).
    // Earlier this function hard-coded the element-kind fields (id, type,
    // label, data) and dropped text-kind fields (text, depth, paragraphId,
    // paragraphText) on the floor — the agent saw `[{kind:"text"},
    // {kind:"text"}]` with no actual text. Spreading is the cleanest way
    // to keep the payload future-proof as new kinds (row/column/codeline)
    // arrive in later phases.
    var INTERNAL = {entryId: 1};
    var selections = [];
    for (var i = 0; i < veSelection.length; i++) {
      var e = veSelection[i];
      var out = {};
      for (var k in e) {
        if (INTERNAL[k]) continue;
        if (e[k] !== undefined) out[k] = e[k];
      }
      selections.push(out);
    }
    return {
      kind: kind || (selections.length ? 'submit' : 'exit'),
      count: selections.length,
      selections: selections
    };
  }

  function submitSelections(forcedKind) {
    if (sending) return;
    sending = true;
    var payload = buildSubmissionPayload(forcedKind);
    if (!isInteractive) {
      // file:// fallback — same overlay path as legacy postSelection
      // uses, but the payload is the new schema. The overlay's
      // Copy-JSON button still works because it stringifies whatever
      // we hand it.
      var overlay = buildOverlay();
      showStaticFallback(payload, overlay);
      return;
    }
    // A2 (TRDD-5f41ad36) — same fallback-browser handling as
    // postSelection(). Use fetch (not sendBeacon) when ve_mode=fallback
    // so we can send X-Browser-Mode and react to `thanks_url` in the
    // response. Single-source-of-truth would have been nicer, but the
    // two send-paths are different enough (overlay handling, payload
    // shape) that a shared helper would obscure more than it shares.
    var body = JSON.stringify(payload);
    if (isFallbackBrowser) {
      try {
        fetch('/__ve-select', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'X-Browser-Mode': 'fallback'
          },
          body: body
        }).then(function (r) {
          if (!r) return null;
          return r.json().catch(function () { return null; });
        }).then(function (j) {
          var thanks = j && typeof j.thanks_url === 'string' ? j.thanks_url : null;
          if (thanks) {
            try { location.replace(thanks); return; } catch (_) {}
          }
          showCloseConfirmation('fallback');
        }).catch(function () {
          showCloseConfirmation('fallback');
        });
      } catch (_) {
        showCloseConfirmation('fallback');
      }
      return;
    }

    var sent = false;
    if (navigator.sendBeacon) {
      try {
        sent = navigator.sendBeacon('/__ve-select', new Blob([body], { type: 'application/json' }));
      } catch (_) {}
    }
    if (!sent) {
      try {
        fetch('/__ve-select', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function () {});
      } catch (_) {}
    }
    setTimeout(function () {
      try { window.close(); } catch (_) {}
      setTimeout(showCloseConfirmation, 120);
    }, 30);
  }
  window.veSubmit = function () { submitSelections('submit'); };
  window.veExit = function () { submitSelections('exit'); };

  // Phase 7 — touch / mobile compatibility detector. Cached after first
  // call so we don't re-query the platform every selection update.
  var _isTouch = null;
  function isTouchDevice() {
    if (_isTouch !== null) return _isTouch;
    _isTouch = (typeof window !== 'undefined') && (
      ('ontouchstart' in window) ||
      (navigator && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0))
    );
    if (_isTouch && document.body) document.body.setAttribute('data-ve-touch', '1');
    return _isTouch;
  }

  function injectClearAllButton(parent) {
    // The Clear-all button is touch-only (mouse users have ESC). It now
    // lives inside the floating bar instead of as a separate fixed-pos
    // element, so the parent is the bar itself; the function still
    // tolerates a missing parent for legacy callers.
    if (!document.body) return;
    if (!isTouchDevice()) return;
    if (document.getElementById('ve-clear-all')) return;
    var btn = document.createElement('button');
    btn.id = 've-clear-all';
    btn.type = 'button';
    btn.className = 've-floating-btn ve-floating-btn--ghost';
    btn.textContent = 'Clear';
    btn.setAttribute('data-ve-overlay', '1');
    btn.style.display = 'none'; // shown on demand by updateSubmitButtonsState
    btn.addEventListener('click', function () {
      // Mirror what ESC does — wipe all selections + repaint surfaces.
      if (veSelection.length === 0) return;
      if (typeof clearAllTextSelections === 'function') clearAllTextSelections();
      veSelection.length = 0;
      if (typeof repaintSelectedElements === 'function') repaintSelectedElements();
      if (typeof repaintTableHandles === 'function') repaintTableHandles();
      if (typeof repaintCodeGutters === 'function') repaintCodeGutters();
      updateSubmitButtonsState();
    });
    (parent || document.body).appendChild(btn);
  }

  function injectSubmitButtons() {
    if (!document.body) return;
    if (document.getElementById('ve-submit-tr')) return; // idempotent
    // Two standalone floating buttons per the design contract:
    //   ve-submit-tr  → top-right of viewport, top of page (scroll up to see)
    //   ve-submit-bl  → bottom-(left|right) of viewport, bottom of page (scroll
    //                   down to see)
    // Both are position:absolute on body so the Y anchors to the document
    // (not the viewport): they NEVER overlap mid-page content. The X is
    // tracked by pinActionButtonsToViewport() below so each button stays
    // at the visible edge of the viewport regardless of horizontal scroll.
    // The bottom button's horizontal side is decided by a host-page hint
    // (`<body data-ve-bottom-button-position="left|right">`) — defaults
    // to right.
    //
    // IDs preserved for test back-compat (#ve-submit-tr / #ve-submit-bl)
    // AND now also reflect actual physical positions (top-right / bottom-
    // anchored).
    var bottomSide = (document.body.getAttribute('data-ve-bottom-button-position') || 'right').toLowerCase();
    if (bottomSide !== 'left' && bottomSide !== 'right') bottomSide = 'right';

    var specs = [
      { id: 've-submit-tr', positionClass: 've-action-btn--top',    side: 'right'    },
      { id: 've-submit-bl', positionClass: 've-action-btn--bottom', side: bottomSide },
    ];
    for (var i = 0; i < specs.length; i++) {
      var btn = document.createElement('button');
      btn.id = specs[i].id;
      btn.type = 'button';
      btn.className = 've-floating-btn ve-action-btn ' + specs[i].positionClass;
      btn.setAttribute('data-ve-overlay', '1');
      btn.setAttribute('data-ve-action-side', specs[i].side);
      (function (b) {
        // Corner buttons NEVER submit — the user contract is:
        //   • On an INPUT page (selectable elements present) the label is
        //     "Cancel" and the click sends `exit` (dismiss without action).
        //     The page\'s own visible Submit/Send affordance (e.g. the
        //     table-form\'s tfoot Submit) handles the actual submission.
        //   • On a NON-INPUT page (preview / read-only) the label is
        //     "Done" (or whatever the page declared) and the click sends
        //     `exit` (close the preview).
        // In both cases the corner click resolves the runner with an
        // exit-kind payload — no selections are forced through. Per the
        // user\'s spec ("never use \'send\', \'submit\', etc. in the corner\'s
        // buttons"), the corner is always a dismiss-only affordance.
        b.addEventListener('click', function () { submitSelections('exit'); });
      })(btn);
      document.body.appendChild(btn);
    }
    // The Clear-all (touch-only) needs a home now that the wrapping bar
    // is gone. Put it next to the bottom button on the SAME viewport side
    // so the two touch-targets are visually grouped. We re-use the same
    // pin-to-viewport mechanism, with a per-element offset.
    injectClearAllButton(document.body);
    updateSubmitButtonsState();
    pinActionButtonsToViewport();
  }

  function computeCornerLabel() {
    // Decide the corner-button label per the user contract.
    //
    // Priority 1 — explicit page override: <body data-ve-corner-label="…">
    //   accepted: "Cancel" | "Done" | "Ok" | "Exit"
    // Priority 2 — auto-detect by scanning for selectable elements. If the
    //   page has anything the runtime would treat as user-input (a
    //   [data-ve-id] picker, a [data-ve-type="table-form"], a prose
    //   selection target), it\'s an INPUT page → label = "Cancel". Else
    //   it\'s a preview/read-only page → label = "Done".
    //
    // Rationale: the corner buttons are NEVER "Submit"/"Send" affordances;
    // they dismiss/cancel the runner. The label communicates that intent:
    //   • "Cancel" — the user was asked to do something, they\'re bailing.
    //   • "Done"   — the user finished viewing, close cleanly.
    if (document.body) {
      var override = document.body.getAttribute('data-ve-corner-label');
      if (override) {
        var t = String(override).trim();
        if (t) return t;
      }
    }
    var hasSelectable = !!document.querySelector(
      '[data-ve-id]:not(svg [data-ve-id]):not([data-ve-type="table-form"]),' +
      '[data-ve-type="table-form"],' +
      '[data-ve-prose] [data-ve-id],' +
      'svg [data-ve-id]'
    );
    return hasSelectable ? 'Cancel' : 'Done';
  }

  function updateSubmitButtonsState() {
    // BOTH corner buttons carry the SAME label, per the user contract:
    //   • Input pages → "Cancel" (top + bottom)
    //   • Preview/read-only pages → "Done" (top + bottom)
    // The chrome is always "ghost" (transparent, themed) — never the
    // primary accent fill. The bottom button no longer mutates to
    // "Submit (N)" when selections exist; submission flows through the
    // page\'s own visible affordance (e.g. the table-form\'s tfoot Submit
    // button, or the regex-vis editor\'s Save button) — NOT through the
    // corner.
    var label = computeCornerLabel();
    var topBtn = document.getElementById('ve-submit-tr');
    var bottomBtn = document.getElementById('ve-submit-bl');
    if (topBtn) {
      topBtn.textContent = label;
      topBtn.className = 've-floating-btn ve-action-btn ve-action-btn--top ve-floating-btn--ghost';
      topBtn.style.display = 'inline-flex';
    }
    if (bottomBtn) {
      bottomBtn.textContent = label;
      bottomBtn.className = 've-floating-btn ve-action-btn ve-action-btn--bottom ve-floating-btn--ghost';
      bottomBtn.style.display = 'inline-flex';
    }
    // Phase 7: Clear-all is touch-only, visible only when there's
    // something to clear. Floats near the bottom button — see
    // pinActionButtonsToViewport().
    var clearBtn = document.getElementById('ve-clear-all');
    var n = veSelection.length;
    if (clearBtn) clearBtn.style.display = (isTouchDevice() && n > 0) ? 'inline-flex' : 'none';
    // Re-pin after any geometry change so the buttons stay on the
    // viewport edge even if their width changed (e.g. "Done" → "Cancel").
    pinActionButtonsToViewport();
  }

  // Mimic the user-asked "Y anchored to PAGE, X anchored to VIEWPORT"
  // contract with a position:fixed CSS layer + a JS visibility gate
  // driven by scrollY. Pure CSS would force one of two trade-offs:
  //   - position:absolute → real Y-anchoring but the dynamic-left scheme
  //     extends document width on overflow pages and fires a feedback
  //     loop with the horizontal scrollbar (verified empirically).
  //   - position:fixed → no feedback loop, but Y stays pinned to viewport
  //     forever, violating the "you need to scroll to top/bottom to see
  //     the button" requirement.
  // We pick fixed + gate visibility on scrollY so the behaviour matches
  // the spec without the layout instability.
  //
  // SCROLL_THRESHOLD_PX: how far from the top/bottom counts as "at the
  // edge". A few pixels of slack so a tiny inertial overshoot doesn't
  // flash the button off.
  function pinActionButtonsToViewport() {
    if (!document.body) return;
    var SCROLL_THRESHOLD_PX = 8;
    var topBtn = document.getElementById('ve-submit-tr');
    var bottomBtn = document.getElementById('ve-submit-bl');
    function update() {
      var doc = document.documentElement;
      var docH = Math.max(doc.scrollHeight, document.body.scrollHeight);
      var atTop = window.scrollY <= SCROLL_THRESHOLD_PX;
      var atBottom = (window.scrollY + window.innerHeight) >= (docH - SCROLL_THRESHOLD_PX);
      // Edge case: the page is shorter than the viewport (no vertical
      // scroll). Then the user is simultaneously "at the top" AND "at
      // the bottom" — show both buttons.
      var noVerticalScroll = docH <= window.innerHeight + SCROLL_THRESHOLD_PX;
      if (topBtn) topBtn.style.visibility = (atTop || noVerticalScroll) ? 'visible' : 'hidden';
      if (bottomBtn) bottomBtn.style.visibility = (atBottom || noVerticalScroll) ? 'visible' : 'hidden';
    }
    update();
    // Avoid stacking multiple listeners across re-injections.
    if (!window.__veActionButtonsPinned) {
      window.__veActionButtonsPinned = true;
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      // Layout changes that don't fire scroll/resize (dynamic content,
      // images loading, font swaps) still affect docH → re-evaluate.
      var raf = null;
      var observer = new MutationObserver(function () {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { raf = null; update(); });
      });
      observer.observe(document.body, { childList: true, subtree: false });
    }
  }

  // ESC clears multi-select; Enter triggers global Submit/Exit. Both
  // skip when an editable form control has focus, so they don't
  // hijack typing.
  function isEditableFocused() {
    var t = document.activeElement;
    if (!t) return false;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
    if (t.isContentEditable) return true;
    return false;
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (veSelection.length === 0) return;
      // Phase 2: text-kind entries also need their wrapping spans
      // unwrapped from the DOM, otherwise the gold highlight stays
      // even though veSelection is empty. clearAllTextSelections()
      // walks DOM-side spans and is defined alongside the multi-click
      // handler below.
      clearAllTextSelections();
      veSelection.length = 0;
      repaintSelectedElements();
      // Phase 5: clear table-handle pressed states + row/col highlights
      // (the function reads veSelection — now empty — so every handle
      // resets to its default state and column CSS rules are emptied).
      if (typeof repaintTableHandles === 'function') repaintTableHandles();
      // Phase 6: same idea for code-gutter pressed states.
      if (typeof repaintCodeGutters === 'function') repaintCodeGutters();
      // TRDD-eff1aa87: also empty any per-finding reply textareas so
      // the visible inputs match the (now-empty) veSelection state.
      if (typeof clearAllFindingReplyTextareas === 'function') clearAllFindingReplyTextareas();
      // v4 (TRDD-3d1570ab R3): clear the data-ve-pressed attribute on
      // every selectable atom (<tr>/<li>/<p>) AND drop any orphan
      // .ve-group-handle that's still attached to a container.
      var pressedAtoms = document.querySelectorAll(
        'tr[data-ve-pressed], li[data-ve-pressed], p[data-ve-pressed]'
      );
      for (var pa = 0; pa < pressedAtoms.length; pa++) {
        pressedAtoms[pa].removeAttribute('data-ve-pressed');
      }
      if (typeof updateGroupCommentHandles === 'function') updateGroupCommentHandles();
      // Reset multi-click chain so the next click starts depth=1.
      lastClickChain = null;
      ev.preventDefault();
      return;
    }
    if (ev.key === 'Enter') {
      // Enter on a focused [data-ve-id] toggles that element (handled by
      // the existing focused-element handler below — let it run first).
      // Enter inside a form input belongs to the input.
      var t = document.activeElement;
      if (t && t.matches && t.matches('[data-ve-id]')) return;
      if (isEditableFocused()) return;
      ev.preventDefault();
      // Same as the button click — let buildSubmissionPayload auto-derive
      // kind from the current selection count instead of forcing 'submit'.
      submitSelections();
    }
    // Ctrl-+ (or Ctrl-= since `+` requires Shift on US keyboards) — open
    // the comment modal scoped to the current selection (TRDD-3d1570ab
    // R7). No-op when selection is empty. Don't hijack when an editable
    // is focused (the user might be Cmd-+ zooming or typing).
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '+' || ev.key === '=')) {
      if (isEditableFocused()) return;
      if (veSelection.length === 0) return;
      ev.preventDefault();
      // Find any group-handle currently visible (Phase 3 will ensure
      // there's exactly one per selected group). Click the first one
      // we find — it carries the right data-ve-comment-id for the
      // selection's group.
      var handle = document.querySelector('.ve-comment-handle');
      if (handle && typeof openCommentModal === 'function') {
        openCommentModal(handle);
        return;
      }
      // Fallback: pick the first selectable element with data-ve-pressed
      // and open the modal scoped to its data-ve-comment-id.
      var pressed = document.querySelector('[data-ve-pressed="1"][data-ve-comment-id]');
      if (pressed && typeof openCommentModal === 'function') {
        openCommentModal(pressed);
      }
    }
  }, false);

  // Auto-inject buttons when DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSubmitButtons);
  } else {
    injectSubmitButtons();
  }

  function elementSelection(target) {
    var node = target.closest && target.closest('[data-ve-id]');
    if (!node) return null;
    var rawData = node.getAttribute('data-ve-data');
    var data = null;
    if (rawData) {
      try { data = JSON.parse(rawData); } catch (_) { data = { raw: rawData }; }
    }
    var label = node.getAttribute('data-ve-label');
    if (!label) {
      label = (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    }
    var sel = {
      id: node.getAttribute('data-ve-id'),
      type: node.getAttribute('data-ve-type') || 'element',
      label: label
    };
    if (data) sel.data = data;
    return sel;
  }

  function dragInProgress(target) {
    // Pan handlers (Mermaid + .ve-graph-viewport) add a temporary class;
    // respect it so a pan does not register as a click-to-select.
    var wrap = target.closest && target.closest('.mermaid-wrap, .ve-graph-viewport');
    return !!(wrap && wrap.classList.contains('is-panning'));
  }

  function isInteractiveControl(target) {
    return !!(target.closest &&
      target.closest('a[href], button, input, textarea, select, label, summary, [contenteditable="true"], .zoom-controls'));
  }

  function isInsideTableForm(target) {
    return !!(target.closest && target.closest('[data-ve-type="table-form"]'));
  }

  document.addEventListener(
    'click',
    function (ev) {
      if (sending) return;
      if (ev.defaultPrevented) return;
      if (ev.target.closest('[data-ve-overlay]')) return;
      if (isInteractiveControl(ev.target)) return;
      if (dragInProgress(ev.target)) return;
      // Inside a table-form, the form's own handlers manage row toggling
      // and submission — never auto-select on bare row click.
      if (isInsideTableForm(ev.target)) return;
      // Inside a .ve-regex wrapper, the React graph + edit panel own all
      // clicks. The pushRegexEdit() hook is the only path to push a
      // regex-related selection (kind:'regex-edit' on edit-panel commit).
      // Without this guard, clicking any glyph inside the regex graph
      // would bubble up and add a duplicate kind:'element' entry for
      // the wrapper, which has data-ve-id auto-stamped on mount.
      if (ev.target.closest('.ve-regex')) return;
      // Phase 2: inside [data-ve-prose], clicks on text content go to the
      // multi-click handler (handleProseClick at bubble phase) instead of
      // toggling the whole paragraph. The .ve-pnum number marker still
      // toggles the paragraph (it has [data-ve-id] and isn't text).
      if (ev.target.closest('[data-ve-prose]') && !ev.target.closest('.ve-pnum')) return;
      // v4 (TRDD-3d1570ab R3): clicks inside a selectable atom
      // (<tr>, <li>, <p data-ve-comment-id>) are owned by the atom-
      // selection handler. Don't ALSO toggle the wrapping
      // <table>/<ul>/<ol> as a whole-element selection — that would
      // double-count and violate the "containers are not selectable"
      // rule.
      if (ev.target.closest('tr[data-ve-comment-id], li[data-ve-comment-id], p[data-ve-comment-id]')) return;
      var sel = elementSelection(ev.target);
      if (!sel || !sel.id) return;
      ev.preventDefault();
      ev.stopPropagation();
      // Phase 1 of multi-select overhaul: clicks toggle membership in
      // veSelection instead of firing a single POST and closing the
      // window. Submit/Exit (the floating buttons or the Enter key)
      // is what closes the window now.
      toggleElementSelection(sel);
    },
    true
  );

  // Keyboard parity: Space on a focused [data-ve-id] toggles it.
  // (Enter is handled by the global submit handler unless focus is
  // exactly on a [data-ve-id], in which case it should also toggle.)
  document.addEventListener(
    'keydown',
    function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var t = document.activeElement;
      if (!t || !t.matches || !t.matches('[data-ve-id]')) return;
      if (isInteractiveControl(t)) return;
      // Same exclusion as the click handler: regex wrappers are owned
      // by the embedded React app, never by the bare element-toggle.
      if (t.closest && t.closest('.ve-regex')) return;
      var sel = elementSelection(t);
      if (!sel || !sel.id) return;
      ev.preventDefault();
      // Stop propagation so the global Enter handler doesn't ALSO
      // submit when the user is just toggling a focused element.
      ev.stopPropagation();
      toggleElementSelection(sel);
    },
    true
  );

  // Public API for direct-call sites.
  // Legacy `veSelect`: still maps to single-shot postSelection so
  // pages that call it programmatically (e.g. for non-element flows)
  // keep working; new code should call veToggle / veSubmit.
  window.veSelect = postSelection;

  window.veSelectMermaid = function (nodeId, label, extra) {
    var payload = {
      id: 've-mermaid-' + nodeId,
      type: 'mermaid-node',
      label: label || nodeId
    };
    if (extra) payload.data = extra;
    // Phase 1: mermaid nodes participate in the multi-select set.
    toggleElementSelection(payload);
  };

  window.veWireChart = function (chartInstance, opts) {
    if (!chartInstance) return;
    var chartId = (opts && opts.id) || 'chart';
    chartInstance.options = chartInstance.options || {};
    // F6 — chain (don't replace) any pre-existing onClick. If the
    // page set its own hover/zoom/highlight handler before calling
    // veWireChart, blowing it away here silently broke that feature.
    var prevOnClick = chartInstance.options.onClick;
    chartInstance.options.onClick = function (evt, elements, chart) {
      if (typeof prevOnClick === 'function') {
        try { prevOnClick.call(chartInstance, evt, elements, chart); } catch (_) {}
      }
      if (!elements || !elements.length) return;
      var el = elements[0];
      var ds = chart.data.datasets[el.datasetIndex] || {};
      var label = chart.data.labels && chart.data.labels[el.index];
      // Phase 1: chart points participate in the multi-select set.
      toggleElementSelection({
        id: 've-chart-' + chartId + '-d' + el.datasetIndex + '-i' + el.index,
        type: 'chart-point',
        label: (ds.label ? ds.label + ' · ' : '') + (label != null ? String(label) : 'index ' + el.index),
        data: {
          chartId: chartId,
          datasetIndex: el.datasetIndex,
          datasetLabel: ds.label || null,
          index: el.index,
          xLabel: label != null ? label : null,
          value: Array.isArray(ds.data) ? ds.data[el.index] : null
        }
      });
    };
    try { chartInstance.update(); } catch (_) {}
  };

  // Make any [data-ve-id] focusable for keyboard users unless the author
  // already set tabindex (defer to authoring intent in those cases).
  function enhanceFocus() {
    var els = document.querySelectorAll('[data-ve-id]:not([data-ve-type="table-form"]):not([data-ve-type="regex"]):not([tabindex])');
    for (var i = 0; i < els.length; i++) {
      // Skip nodes that contain a table-form — the form's own controls
      // are tabbable and should not double up.
      if (els[i].querySelector && els[i].querySelector('[data-ve-type="table-form"]')) continue;
      // Skip regex wrappers — the embedded React app exposes its own
      // tab-stops (input box, panel buttons). Adding a wrapper-level
      // tabindex would steal focus to a non-interactive parent first.
      if (els[i].matches && els[i].matches('.ve-regex')) continue;
      els[i].setAttribute('tabindex', '0');
      if (!els[i].hasAttribute('role')) els[i].setAttribute('role', 'button');
    }
  }

  // ---------------------------------------------------------------------
  // Table-as-question (form selection)
  // ---------------------------------------------------------------------

  function initTableForm(table) {
    if (table.__veFormInit) return;
    table.__veFormInit = true;

    var tableId = table.getAttribute('data-ve-id') || ('table-' + Math.random().toString(36).slice(2, 8));
    var mode = (table.getAttribute('data-ve-mode') || 'single').toLowerCase();
    if (mode !== 'multi') mode = 'single';
    var inputType = mode === 'multi' ? 'checkbox' : 'radio';
    var groupName = 've-form-' + tableId;
    var label = table.getAttribute('data-ve-label') || 'Make a selection';

    var rows = table.querySelectorAll('tbody > tr[data-ve-row-id]');
    if (!rows.length) return;

    // Inject the leading "select" header cell if the author left it out.
    var thead = table.querySelector('thead tr');
    if (thead && !thead.querySelector('[data-ve-form-head]')) {
      var th = document.createElement('th');
      th.setAttribute('data-ve-form-head', '');
      th.setAttribute('scope', 'col');
      th.style.width = '1%';
      th.style.whiteSpace = 'nowrap';
      th.textContent = mode === 'multi' ? 'Pick' : 'Choose';
      thead.insertBefore(th, thead.firstChild);
    }

    rows.forEach(function (row) {
      var rowId = row.getAttribute('data-ve-row-id');
      var rowLabel = row.getAttribute('data-ve-row-label')
        || (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      var isText = row.getAttribute('data-ve-row-text') === '1';

      // Insert leading cell with the form control.
      // The native <input> still ships (so screen readers see a real
      // control, Tab/Space keyboard accessibility works, and tests
      // selecting on input[data-ve-control] keep working) but it is
      // VISUALLY HIDDEN via the standard sr-only pattern (1×1px clipped
      // absolute positioning) — guarantees zero native chrome paints on
      // every browser/zoom level. A styled <span class="ve-form-glyph">
      // renders the visible radio dot or checkbox tick using --ve-accent
      // — so the control inherits the host palette instead of exposing
      // native browser chrome that looks Mac/Win/Linux-default and
      // out-of-theme everywhere. Clicks on the row toggle via the
      // row-level click handler installed below; the manual toggleRow()
      // dispatches a synthetic 'change' event so the :checked sibling
      // selector lights the glyph.
      var cell = document.createElement('td');
      cell.setAttribute('data-ve-form-cell', '');
      cell.style.width = '1%';
      cell.style.whiteSpace = 'nowrap';
      cell.style.verticalAlign = 'middle';
      cell.style.textAlign = 'center';

      var glyphWrap = document.createElement('span');
      glyphWrap.className = 've-form-cell';
      glyphWrap.style.display = 'inline-block';
      glyphWrap.style.position = 'relative';
      glyphWrap.style.width = '18px';
      glyphWrap.style.height = '18px';
      glyphWrap.style.verticalAlign = 'middle';

      var input = document.createElement('input');
      input.type = inputType;
      input.name = groupName;
      input.value = rowId;
      input.setAttribute('data-ve-control', '');
      if (isText) input.setAttribute('data-ve-text-control', '');
      input.setAttribute('aria-label', rowLabel);

      var glyph = document.createElement('span');
      glyph.className = 've-form-glyph ' + (inputType === 'radio'
        ? 've-form-glyph--radio'
        : 've-form-glyph--check');
      glyph.setAttribute('aria-hidden', 'true');

      glyphWrap.appendChild(input);
      glyphWrap.appendChild(glyph);
      cell.appendChild(glyphWrap);
      row.insertBefore(cell, row.firstChild);

      // Free-text rows: add the .ve-form-text-wrap class to the row so
      // the existing <input type="text"> picks up the host palette via
      // CSS custom properties instead of exposing the native white-on-
      // grey browser default.
      if (isText) {
        var textCells = row.querySelectorAll('td');
        for (var ti = 0; ti < textCells.length; ti++) {
          var tc = textCells[ti];
          if (tc.querySelector('input[type="text"], textarea')) {
            tc.classList.add('ve-form-text-wrap');
          }
        }
      }

      // Make the whole row toggle the control (except clicks on the text
      // input itself, which should focus & not toggle).
      row.addEventListener('click', function (ev) {
        if (ev.target.closest('input, textarea, button, a, label, select')) return;
        toggleRow(row, mode);
      });

      // Free-text rows: typing auto-selects the control; Enter submits.
      if (isText) {
        var textInput = row.querySelector('input[type="text"], textarea');
        if (textInput) {
          textInput.setAttribute('data-ve-text-input', '');
          textInput.addEventListener('input', function () {
            input.checked = true;
            updateSubmitState(table);
          });
          textInput.addEventListener('focus', function () {
            input.checked = true;
            updateSubmitState(table);
          });
          textInput.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              submitTableForm(table);
            }
          });
        }
      }

      input.addEventListener('change', function () {
        updateSubmitState(table);
      });
    });

    // Submit row in <tfoot>.
    var tfoot = table.querySelector('tfoot');
    if (!tfoot) {
      tfoot = document.createElement('tfoot');
      table.appendChild(tfoot);
    }
    var firstRow = rows[0];
    var colCount = (firstRow.children.length) || 2;
    var submitTr = document.createElement('tr');
    submitTr.setAttribute('data-ve-form-footer', '');
    submitTr.className = 've-form-submit-row';
    var submitTd = document.createElement('td');
    submitTd.colSpan = colCount;
    submitTd.style.textAlign = 'right';
    submitTd.style.padding = '14px 12px';
    // The previous implementation used `background:currentColor` +
    // `color:#fff;mix-blend-mode:difference` to invert text against the
    // page accent — clever, but unreadable on every palette where the
    // accent had low luminance contrast against white. The new button
    // uses the shared --ve-control-* palette so the Submit button reads
    // as the same primary affordance as the floating Submit, themed by
    // the host page automatically.
    submitTd.innerHTML =
      '<span data-ve-form-status class="ve-form-status">No selection yet</span>' +
      '<button type="button" data-ve-form-submit class="ve-form-submit">Submit</button>';
    submitTr.appendChild(submitTd);
    tfoot.appendChild(submitTr);

    var btn = submitTr.querySelector('[data-ve-form-submit]');
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      submitTableForm(table);
    });

    // Initialise submit state.
    updateSubmitState(table);

    // Expose label for the payload.
    table.__veFormLabel = label;
    table.__veFormMode = mode;
    table.__veFormId = tableId;

    // Capture each row\'s natural (non-hover) background so the runtime
    // hover rule can pin it back. Without this, the page\'s own
    // `tr:hover { background: ... }` rule (very common in
    // \`.data-table\`-style demos) replaces the row\'s zebra/transparent bg
    // with an arbitrary color when the user mouses over — the user\'s
    // request is for hover to ONLY brighten the row uniformly, never
    // change its base color. CSS `revert` falls back to UA default
    // (transparent) for unlayered author rules, so JS capture is the
    // robust portable way to preserve the page-defined zebra.
    //
    // requestAnimationFrame defers the read until layout has settled —
    // the bg may depend on @media queries or font loads that haven\'t
    // resolved at script-end time.
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () {
        var bodyRows = table.querySelectorAll('tbody tr');
        for (var ri = 0; ri < bodyRows.length; ri++) {
          var bg = window.getComputedStyle(bodyRows[ri]).backgroundColor;
          if (bg) bodyRows[ri].style.setProperty('--ve-row-natural-bg', bg);
        }
      });
    }
  }

  function toggleRow(row, mode) {
    var input = row.querySelector('input[data-ve-control]');
    if (!input) return;
    if (mode === 'multi') {
      input.checked = !input.checked;
    } else {
      input.checked = true;
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function updateSubmitState(table) {
    var checked = table.querySelectorAll('tbody input[data-ve-control]:checked');
    var status = table.querySelector('[data-ve-form-status]');
    var btn = table.querySelector('[data-ve-form-submit]');
    if (status) {
      if (checked.length === 0) {
        status.textContent = 'No selection yet';
      } else if (checked.length === 1) {
        status.textContent = '1 selected';
      } else {
        status.textContent = checked.length + ' selected';
      }
    }
    if (btn) {
      // The `.ve-form-submit:disabled` CSS rule handles the visual
      // dim/cursor state — no inline-style overrides needed here.
      btn.disabled = checked.length === 0;
    }
  }

  function submitTableForm(table) {
    var mode = table.__veFormMode || 'single';
    var tableId = table.__veFormId || (table.getAttribute('data-ve-id') || 'table');
    var question = table.__veFormLabel || 'Selection';
    var checked = Array.prototype.slice.call(table.querySelectorAll('tbody input[data-ve-control]:checked'));
    if (!checked.length) return;

    var selected = [];
    var freeText = null;
    checked.forEach(function (input) {
      var row = input.closest('tr');
      var rowId = row.getAttribute('data-ve-row-id');
      var rowLabel = row.getAttribute('data-ve-row-label')
        || (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (input.hasAttribute('data-ve-text-control')) {
        var textInput = row.querySelector('[data-ve-text-input]');
        var textValue = textInput ? String(textInput.value || '').trim() : '';
        freeText = textValue || null;
        if (textValue) {
          selected.push({ id: rowId, label: rowLabel, text: textValue });
        }
      } else {
        selected.push({ id: rowId, label: rowLabel });
      }
    });

    if (!selected.length && !freeText) return;

    var summary;
    if (mode === 'single') {
      summary = (selected[0] && (selected[0].text || selected[0].label)) || 'Selection';
    } else {
      var parts = selected.map(function (s) { return s.text || s.label; });
      summary = parts.length === 1
        ? parts[0]
        : parts.length + ' choices: ' + parts.slice(0, 3).join(', ') + (parts.length > 3 ? '…' : '');
    }

    postSelection({
      id: 've-table-' + tableId + '-submit',
      type: 'table-form',
      label: summary,
      data: {
        tableId: tableId,
        question: question,
        mode: mode,
        selected: selected,
        text: freeText
      }
    });
  }

  function initAllTableForms() {
    var tables = document.querySelectorAll('table[data-ve-type="table-form"]');
    for (var i = 0; i < tables.length; i++) initTableForm(tables[i]);
  }

  // ---------------------------------------------------------------------
  // Prose mode: paragraph numbering + text-snippet selection
  // ---------------------------------------------------------------------

  var HEADING_RE = /^H([1-6])$/;
  var PARA_TAGS = { P: 1, BLOCKQUOTE: 1, LI: 0, PRE: 0 }; // P/BQ get full numbering; LI/PRE only if [data-ve-prose-list]

  function numberSection(parts) {
    return parts.filter(function (n) { return n > 0; }).join('.');
  }

  function makeNumberMarker(num) {
    var marker = document.createElement('a');
    marker.className = 've-pnum';
    marker.setAttribute('href', '#ve-' + num);
    marker.setAttribute('id', 've-' + num);
    marker.setAttribute('aria-label', 'Paragraph ' + num);
    marker.setAttribute('data-ve-pnum-marker', '1');
    marker.textContent = num;
    return marker;
  }

  function initProse(container) {
    if (container.__veProseInit) return;
    container.__veProseInit = true;

    var counters = [0, 0, 0, 0, 0, 0]; // h1..h6 levels
    var paraCounter = 0;
    var lastHeadingLevel = 0;
    var orderIndex = 0;

    var nodes = Array.prototype.slice.call(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, blockquote')
    );

    nodes.forEach(function (node) {
      // Skip our own injected markers
      if (node.closest('[data-ve-overlay], [data-ve-snippet-popup]')) return;

      var hMatch = HEADING_RE.exec(node.tagName);
      if (hMatch) {
        var level = parseInt(hMatch[1], 10);
        counters[level - 1]++;
        for (var i = level; i < counters.length; i++) counters[i] = 0;
        lastHeadingLevel = level;
        paraCounter = 0;
        orderIndex++;

        var hnum = numberSection(counters);
        if (!hnum) return;

        node.setAttribute('data-ve-pnum', hnum);
        // data-ve-pdepth = number of segments in the pnum (e.g. "1.2.1" = 3).
        // Read by the CSS rules above to indent the element by depth.
        node.setAttribute('data-ve-pdepth', String(hnum.split('.').length));
        if (!node.hasAttribute('data-ve-id')) {
          node.setAttribute('data-ve-id', 've-section-' + hnum);
          node.setAttribute('data-ve-type', 'section');
          node.setAttribute(
            'data-ve-label',
            'Section ' + hnum + ' — ' + (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
          );
        }
        if (!node.querySelector(':scope > .ve-pnum')) {
          node.insertBefore(makeNumberMarker(hnum), node.firstChild);
        }
      } else if (PARA_TAGS[node.tagName]) {
        paraCounter++;
        orderIndex++;
        var pnum = (numberSection(counters.slice(0, lastHeadingLevel)) || '0') + '.' + paraCounter;
        node.setAttribute('data-ve-pnum', pnum);
        node.setAttribute('data-ve-pdepth', String(pnum.split('.').length));
        node.setAttribute('data-ve-pnum-order', String(orderIndex));
        if (!node.hasAttribute('data-ve-id')) {
          node.setAttribute('data-ve-id', 've-para-' + pnum);
          node.setAttribute('data-ve-type', 'paragraph');
          node.setAttribute(
            'data-ve-label',
            'Paragraph ' + pnum + ' — ' + (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
          );
        }
        if (!node.querySelector(':scope > .ve-pnum')) {
          node.insertBefore(makeNumberMarker(pnum), node.firstChild);
        }
      }
    });
  }

  function initAllProse() {
    var containers = document.querySelectorAll('[data-ve-prose]');
    for (var i = 0; i < containers.length; i++) initProse(containers[i]);
  }

  // ---------------------------------------------------------------------
  // Math / LaTeX (KaTeX + mhchem, lazy-loaded from CDN)
  // ---------------------------------------------------------------------

  var KATEX_VERSION = '0.16.9';
  var KATEX_BASE = 'https://cdn.jsdelivr.net/npm/katex@' + KATEX_VERSION + '/dist';
  var katexLoading = null;

  // Default macros covering the contemporary math notation that KaTeX does
  // not ship out-of-the-box (mostly the physics LaTeX package, tensor
  // shortcuts, bold vectors, set-theory blackboard letters, differential
  // operators, and a lightweight SI-unit pair).
  //
  // `\vec` is intentionally NOT overridden — KaTeX's default (small over-
  // arrow) is the conventional notation in many fields. Bold-vector folks
  // get \bv / \bvec / \vct / \hatv. Same for matrices: \mat / \bmat.
  //
  // Authors override or extend these per-page via `window.veKatexMacros`
  // (set BEFORE the runtime initialises math) or per-element via the
  // `data-tex-macros='{"\\foo":"\\bar"}'` attribute on a `.ve-math` node.
  var KATEX_DEFAULT_MACROS = {
    // ----- bold-vector / matrix conventions (additive to \vec / \mathbf) -----
    '\\bv':       '\\boldsymbol{#1}',
    '\\bvec':     '\\boldsymbol{#1}',
    '\\vct':      '\\boldsymbol{#1}',
    '\\hatv':     '\\hat{\\boldsymbol{#1}}',
    '\\unitvec':  '\\hat{\\boldsymbol{#1}}',
    '\\mat':      '\\boldsymbol{#1}',
    '\\bmat':     '\\boldsymbol{#1}',
    '\\T':        '^{\\mathsf{T}}',          // transpose, e.g. \mat A\T
    '\\inv':      '^{-1}',
    '\\hc':       '^{\\dagger}',             // hermitian conjugate (avoid clobbering \dag)

    // ----- tensor notation (physics) -----
    // \tensor{T}{^a_b} → T^a_b ; full mixed-index spacing falls back to
    // KaTeX's normal sup/sub rules: T^a{}_b{}^c writes correctly.
    '\\tensor':   '#1#2',
    '\\indices':  '#1',
    // Christoffel-style: \Gamma_{ab}^{c} also works directly.

    // ----- physics package (operators) -----
    '\\dd':       '\\mathrm{d}',
    '\\dv':       '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
    '\\pdv':      '\\frac{\\partial #1}{\\partial #2}',
    '\\fdv':      '\\frac{\\delta #1}{\\delta #2}',
    '\\dvn':      '\\frac{\\mathrm{d}^{#1}#2}{\\mathrm{d}#3^{#1}}',
    '\\pdvn':     '\\frac{\\partial^{#1}#2}{\\partial #3^{#1}}',
    '\\grad':     '\\boldsymbol{\\nabla}',
    '\\divv':     '\\boldsymbol{\\nabla}\\cdot',
    '\\curl':     '\\boldsymbol{\\nabla}\\times',
    '\\laplacian':'\\nabla^{2}',
    '\\dalembertian': '\\Box',

    // ----- physics package (delimiters / norms) -----
    '\\norm':     '\\left\\lVert #1 \\right\\rVert',
    '\\abs':      '\\left| #1 \\right|',
    '\\set':      '\\left\\{ #1 \\right\\}',
    '\\floor':    '\\left\\lfloor #1 \\right\\rfloor',
    '\\ceil':     '\\left\\lceil #1 \\right\\rceil',
    '\\inner':    '\\left\\langle #1, #2 \\right\\rangle',
    '\\eval':     '\\left. #1 \\right|',

    // ----- physics package (quantum / Dirac) -----
    '\\bra':      '\\left\\langle #1 \\right|',
    '\\ket':      '\\left| #1 \\right\\rangle',
    '\\braket':   '\\left\\langle #1 \\middle| #2 \\right\\rangle',
    '\\matrixel': '\\left\\langle #1 \\middle| #2 \\middle| #3 \\right\\rangle',
    '\\dyad':     '\\left| #1 \\right\\rangle\\!\\left\\langle #2 \\right|',
    '\\expval':   '\\left\\langle #1 \\right\\rangle',
    '\\comm':     '\\left[ #1, #2 \\right]',
    '\\anticomm': '\\left\\{ #1, #2 \\right\\}',
    '\\poissonbracket': '\\left\\{ #1, #2 \\right\\}',

    // ----- set theory / number systems -----
    '\\R':        '\\mathbb{R}',
    '\\Z':        '\\mathbb{Z}',
    '\\N':        '\\mathbb{N}',
    '\\Q':        '\\mathbb{Q}',
    '\\C':        '\\mathbb{C}',
    '\\F':        '\\mathbb{F}',
    '\\K':        '\\mathbb{K}',
    '\\H':        '\\mathbb{H}',     // quaternions
    '\\E':        '\\mathbb{E}',     // expectation / Euclidean space
    '\\P':        '\\mathbb{P}',     // probability / projective space

    // ----- common set / logic shortcuts -----
    '\\given':    '\\,\\middle|\\,',
    '\\suchthat': '\\;\\big|\\;',
    '\\Iff':      '\\Longleftrightarrow',
    '\\Implies':  '\\Longrightarrow',
    '\\impliedby':'\\Longleftarrow',
    '\\defeq':    '\\coloneqq',
    '\\eqdef':    '\\eqqcolon',

    // ----- complex analysis (\Re, \Im, \arg are KaTeX builtins, kept as-is) -----
    '\\Real':     '\\operatorname{Re}',      // upright alternative
    '\\Imag':     '\\operatorname{Im}',

    // ----- statistics (\Pr is a KaTeX builtin, kept as-is) -----
    '\\Var':      '\\operatorname{Var}',
    '\\Cov':      '\\operatorname{Cov}',
    '\\Cor':      '\\operatorname{Corr}',
    '\\Prob':     '\\operatorname{Pr}',

    // ----- linear algebra -----
    '\\rank':     '\\operatorname{rank}',
    '\\tr':       '\\operatorname{tr}',
    '\\Tr':       '\\operatorname{Tr}',
    '\\diag':     '\\operatorname{diag}',
    '\\spn':      '\\operatorname{span}',
    '\\nullspace':'\\operatorname{null}',
    '\\range':    '\\operatorname{range}',
    '\\sgn':      '\\operatorname{sgn}',

    // ----- SI units (lightweight siunitx-like) -----
    '\\SI':       '#1\\,\\mathrm{#2}',
    '\\unit':     '\\mathrm{#1}',
    '\\num':      '#1',
    '\\si':       '\\mathrm{#1}',
    '\\degC':     '^{\\circ}\\mathrm{C}',
    '\\degF':     '^{\\circ}\\mathrm{F}',
    '\\angstrom': '\\text{\\AA}',

    // ----- common math shortcuts -----
    '\\half':     '\\tfrac{1}{2}',
    '\\third':    '\\tfrac{1}{3}',
    '\\quarter':  '\\tfrac{1}{4}',
    '\\half2':    '\\tfrac{1}{2}',
    '\\eps':      '\\varepsilon',
    '\\veps':     '\\varepsilon',
    '\\phi2':     '\\varphi',
    '\\implies':  '\\Rightarrow',
    '\\iff':      '\\Leftrightarrow',

    // ====================================================================
    // Granular math selection macros — these route through KaTeX's
    // \htmlData (which we've enabled via `trust`) so the rendered HTML
    // gets `data-ve-id` / `data-ve-type` / `data-ve-label` directly.
    // The runtime's existing [data-ve-id] click handler picks them up.
    //
    // Naming convention recommended for matrix cells:
    //   \vecell{matA-r1c2}{Element a₁₂ of matrix A}{a_{12}}
    // The "rNcM" suffix lets the agent compute "select row N" from any
    // cell click, and lets the user mouse-highlight a whole row/column.
    //
    // Generic form: \veid{id}{type}{label}{content}
    // ====================================================================

    '\\veid':     '\\htmlData{ve-id=#1,ve-type=#2,ve-label=#3}{#4}',
    '\\vecell':   '\\htmlData{ve-id=#1,ve-type=matrix-cell,ve-label=#2}{#3}',
    '\\veelem':   '\\htmlData{ve-id=#1,ve-type=matrix-cell,ve-label=#2}{#3}',
    '\\verow':    '\\htmlData{ve-id=#1,ve-type=matrix-row,ve-label=#2}{#3}',
    '\\vecol':    '\\htmlData{ve-id=#1,ve-type=matrix-column,ve-label=#2}{#3}',
    '\\veidx':    '\\htmlData{ve-id=#1,ve-type=index,ve-label=#2}{#3}',
    '\\vesub':    '\\htmlData{ve-id=#1,ve-type=subscript,ve-label=#2}{#3}',
    '\\vesup':    '\\htmlData{ve-id=#1,ve-type=superscript,ve-label=#2}{#3}',
    '\\vebound':  '\\htmlData{ve-id=#1,ve-type=bound,ve-label=#2}{#3}',
    '\\veterm':   '\\htmlData{ve-id=#1,ve-type=term,ve-label=#2}{#3}',
    '\\vefactor': '\\htmlData{ve-id=#1,ve-type=factor,ve-label=#2}{#3}',
    '\\vesum':    '\\htmlData{ve-id=#1,ve-type=sum,ve-label=#2}{#3}',
    '\\veprod':   '\\htmlData{ve-id=#1,ve-type=product,ve-label=#2}{#3}',
    '\\veint':    '\\htmlData{ve-id=#1,ve-type=integral,ve-label=#2}{#3}',
    '\\velim':    '\\htmlData{ve-id=#1,ve-type=limit,ve-label=#2}{#3}',
    '\\veop':     '\\htmlData{ve-id=#1,ve-type=operator,ve-label=#2}{#3}',
    '\\vegrp':    '\\htmlData{ve-id=#1,ve-type=group,ve-label=#2}{#3}',
    '\\vevar':    '\\htmlData{ve-id=#1,ve-type=variable,ve-label=#2}{#3}',
    '\\veconst':  '\\htmlData{ve-id=#1,ve-type=constant,ve-label=#2}{#3}',
    '\\vetensor': '\\htmlData{ve-id=#1,ve-type=tensor,ve-label=#2}{#3}',
    '\\vevec':    '\\htmlData{ve-id=#1,ve-type=vector,ve-label=#2}{#3}',
    '\\vemat':    '\\htmlData{ve-id=#1,ve-type=matrix,ve-label=#2}{#3}',
    '\\vesymb':   '\\htmlData{ve-id=#1,ve-type=symbol,ve-label=#2}{#3}'
  };

  function buildKatexMacros(extra) {
    var merged = {};
    for (var k in KATEX_DEFAULT_MACROS) merged[k] = KATEX_DEFAULT_MACROS[k];
    var pageMacros = (typeof window.veKatexMacros === 'object' && window.veKatexMacros) || null;
    if (pageMacros) for (var k2 in pageMacros) merged[k2] = pageMacros[k2];
    if (extra && typeof extra === 'object') {
      for (var k3 in extra) merged[k3] = extra[k3];
    }
    return merged;
  }

  function loadKatex() {
    if (window.katex) return Promise.resolve(window.katex);
    if (katexLoading) return katexLoading;
    katexLoading = new Promise(function (resolve, reject) {
      // CSS first so layout settles before render.
      if (!document.querySelector('link[data-ve-katex-css]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = KATEX_BASE + '/katex.min.css';
        link.setAttribute('data-ve-katex-css', '1');
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
      var script = document.createElement('script');
      script.src = KATEX_BASE + '/katex.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = function () {
        // Best-effort: mhchem (chemistry) + copy-tex (right-click copies
        // back the original LaTeX source — invaluable when iterating on a
        // paper figure). Failure of either is non-fatal.
        var mh = document.createElement('script');
        mh.src = KATEX_BASE + '/contrib/mhchem.min.js';
        mh.crossOrigin = 'anonymous';
        mh.onload = function () {
          var ct = document.createElement('script');
          ct.src = KATEX_BASE + '/contrib/copy-tex.min.js';
          ct.crossOrigin = 'anonymous';
          ct.onload = function () { resolve(window.katex); };
          ct.onerror = function () { resolve(window.katex); };
          document.head.appendChild(ct);
        };
        mh.onerror = function () { resolve(window.katex); };
        document.head.appendChild(mh);
      };
      script.onerror = function () { reject(new Error('Failed to load KaTeX')); };
      document.head.appendChild(script);
    });
    return katexLoading;
  }

  function renderMathElement(el, idx, katex) {
    if (el.__veMathRendered) return;
    el.__veMathRendered = true;

    var displayMode =
      el.classList.contains('ve-math--block') ||
      el.tagName === 'DIV' ||
      el.getAttribute('data-ve-math-display') === 'block';
    var isChem = el.classList.contains('ve-math--chem');

    var src = el.getAttribute('data-tex');
    if (src == null) src = (el.textContent || '').trim();
    if (!src) return;

    var renderSrc = src;
    if (isChem && src.indexOf('\\ce{') !== 0 && src.indexOf('\\pu{') !== 0) {
      renderSrc = '\\ce{' + src + '}';
    }

    // Per-element macro overrides via data-tex-macros='{"\\foo":"\\bar"}'
    var perElementMacros = null;
    var macrosAttr = el.getAttribute('data-tex-macros');
    if (macrosAttr) {
      try { perElementMacros = JSON.parse(macrosAttr); }
      catch (_) { /* ignore bad JSON; fall back to defaults */ }
    }

    try {
      katex.render(renderSrc, el, {
        displayMode: displayMode,
        throwOnError: false,
        output: 'html',
        strict: 'ignore',
        // Whitelist ONLY the html-* commands so authors can attach
        // semantic data attributes via \vecell / \veidx / etc. \href is
        // explicitly NOT trusted (would let TikZ/math sources inject links).
        trust: function (ctx) {
          var allowed = {
            '\\htmlClass': 1,
            '\\htmlData': 1,
            '\\htmlId': 1,
            '\\htmlStyle': 1
          };
          return !!allowed[ctx.command];
        },
        macros: buildKatexMacros(perElementMacros)
      });
    } catch (err) {
      el.textContent = src;
      el.style.color = 'crimson';
      el.title = 'KaTeX render error: ' + (err && err.message ? err.message : err);
      return;
    }

    var fid = 'formula-' + (idx + 1);
    if (!el.hasAttribute('data-ve-id')) {
      el.setAttribute('data-ve-id', 've-math-' + fid);
      el.setAttribute('data-ve-type', 'math-formula');
      el.setAttribute(
        'data-ve-label',
        (isChem ? 'Chemistry' : 'Formula') + ' — ' + src.slice(0, 100)
      );
      try {
        el.setAttribute(
          'data-ve-data',
          JSON.stringify({ latex: src, chem: !!isChem, formulaId: fid })
        );
      } catch (_) {}
    }
    // Mark as a snippet-source so mouse-highlighting inside it opens the
    // snippet popup, even outside a [data-ve-prose] container.
    el.setAttribute('data-ve-snippet-source', '1');
    if (!el.hasAttribute('data-ve-math-source')) {
      el.setAttribute('data-ve-math-source', src);
    }
  }

  function initAllMath() {
    var elements = document.querySelectorAll('.ve-math, [data-ve-math]');
    if (!elements.length) return;
    loadKatex().then(function (katex) {
      for (var i = 0; i < elements.length; i++) {
        renderMathElement(elements[i], i, katex);
      }
    }).catch(function (err) {
      // KaTeX failed to load (offline / CSP): leave content as-is so the
      // raw LaTeX is at least visible and copy-pastable.
      console.warn('[ve-runtime] math rendering disabled:', err);
    });
  }

  // ---------------------------------------------------------------------
  // TikZ diagrams (TikZJax — full TikZ + chemfig + physics + circuitikz)
  // ---------------------------------------------------------------------

  var tikzLoading = null;

  function loadTikzJax() {
    if (window.__tikzjaxLoaded) return Promise.resolve(true);
    if (tikzLoading) return tikzLoading;
    tikzLoading = new Promise(function (resolve, reject) {
      // TikZJax injects its own CSS for the rendered SVGs.
      var script = document.createElement('script');
      script.src = 'https://tikzjax.com/v1/tikzjax.js';
      script.async = true;
      script.onload = function () { window.__tikzjaxLoaded = true; resolve(true); };
      script.onerror = function () { reject(new Error('Failed to load TikZJax')); };
      document.head.appendChild(script);
    });
    return tikzLoading;
  }

  function prepareTikzElement(el, idx) {
    if (el.__veTikzInit) return;
    el.__veTikzInit = true;

    // Pull the TikZ source: prefer data-tikz attribute, then text content.
    var src = el.getAttribute('data-tikz');
    if (src == null) src = (el.textContent || '').trim();
    if (!src) return;

    // Wrap bare \chemfig / non-tikzpicture sources so TikZJax accepts them.
    var needsWrap = src.indexOf('\\begin{tikzpicture}') === -1
                 && src.indexOf('\\begin{document}') === -1;
    var wrapped = needsWrap
      ? '\\begin{tikzpicture}\n' + src + '\n\\end{tikzpicture}'
      : src;

    // Internal ID used to namespace child geometric-region [data-ve-id]s.
    // We store it on a non-clickable attribute (data-ve-internal-id) and
    // deliberately do NOT set data-ve-id on the wrapper itself: that
    // would make the figure background / whitespace fire a "whole-
    // diagram" selection on click, which is almost never the intent.
    // Authors who want background clicks can set data-ve-id explicitly
    // before render — we honour that.
    if (!el.hasAttribute('data-ve-internal-id')) {
      el.setAttribute('data-ve-internal-id', 've-tikz-' + (idx + 1));
    }
    el.setAttribute('data-ve-snippet-source', '1');
    if (!el.hasAttribute('data-ve-tikz-source')) {
      el.setAttribute('data-ve-tikz-source', src);
    }

    // Replace the element's contents with the magic <script type="text/tikz">
    // tag that TikZJax looks for. TikZJax mutates the DOM in place.
    el.textContent = '';
    var scriptTag = document.createElement('script');
    scriptTag.type = 'text/tikz';
    scriptTag.textContent = wrapped;
    el.appendChild(scriptTag);
  }

  function initAllTikz() {
    var elements = document.querySelectorAll('.ve-tikz, [data-ve-tikz]');
    if (!elements.length) return;
    // Prepare DOM first so the <script type="text/tikz"> tags exist before
    // TikZJax's auto-discovery runs on load.
    for (var i = 0; i < elements.length; i++) prepareTikzElement(elements[i], i);
    // Schedule the region-overlay watcher for any wrapper that declares
    // semantic regions; runs concurrently with TikZJax's render.
    for (var k = 0; k < elements.length; k++) watchForTikzRender(elements[k]);
    loadTikzJax().catch(function (err) {
      console.warn('[ve-runtime] tikz rendering disabled:', err);
      // Restore raw source so the user at least sees the LaTeX.
      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        var src = el.getAttribute('data-ve-tikz-source');
        if (src) el.textContent = src;
      }
    });
  }

  // ---------------------------------------------------------------------
  // Semantic geometric regions — invisible SVG overlay on top of a
  // TikZJax-rendered figure. Each region is a clickable [data-ve-id]
  // with the SEMANTIC identity Claude needs to act ("the square upon the
  // hypotenuse", not "<path d='…'/>" without meaning).
  // ---------------------------------------------------------------------

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function createRegionElement(r) {
    if (r.shape === 'polygon' && Array.isArray(r.points)) {
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', r.points.map(function (p) { return p.join(','); }).join(' '));
      return poly;
    }
    if (r.shape === 'circle') {
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(r.cx));
      c.setAttribute('cy', String(r.cy));
      c.setAttribute('r', String(r.r));
      return c;
    }
    if (r.shape === 'ellipse') {
      var e = document.createElementNS(SVG_NS, 'ellipse');
      e.setAttribute('cx', String(r.cx));
      e.setAttribute('cy', String(r.cy));
      e.setAttribute('rx', String(r.rx));
      e.setAttribute('ry', String(r.ry));
      return e;
    }
    if (r.shape === 'rect') {
      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(r.x));
      rect.setAttribute('y', String(r.y));
      rect.setAttribute('width', String(r.w != null ? r.w : r.width));
      rect.setAttribute('height', String(r.h != null ? r.h : r.height));
      return rect;
    }
    if (r.shape === 'path' && r.d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', String(r.d));
      return p;
    }
    if (r.shape === 'line' && Array.isArray(r.from) && Array.isArray(r.to)) {
      // Render as a thick invisible polyline so a "line" region has a
      // clickable hit area.
      var line = document.createElementNS(SVG_NS, 'polyline');
      line.setAttribute('points', r.from.join(',') + ' ' + r.to.join(','));
      line.setAttribute('stroke-width', String(r.thickness || 0.4));
      line.setAttribute('fill', 'none');
      return line;
    }
    return null;
  }

  function applyTikzRegions(wrapperEl, svgEl, regions) {
    var vbAttr = wrapperEl.getAttribute('data-ve-tikz-viewbox');
    var vb = vbAttr ? vbAttr.trim().split(/\s+/).map(Number) : null;
    if (!vb || vb.length !== 4 || vb.some(isNaN)) {
      var svgVb = svgEl.getAttribute('viewBox');
      if (svgVb) vb = svgVb.trim().split(/\s+/).map(Number);
    }
    if (!vb || vb.length !== 4 || vb.some(isNaN)) {
      console.warn('[ve-runtime] no usable viewBox for TikZ region overlay; specify data-ve-tikz-viewbox');
      return;
    }

    var debug = wrapperEl.getAttribute('data-ve-tikz-debug') === '1';

    // Make wrapper position-relative so the absolute overlay aligns.
    var cs = window.getComputedStyle(wrapperEl);
    if (cs.position === 'static') wrapperEl.style.position = 'relative';

    var existing = wrapperEl.querySelector('[data-ve-tikz-overlay]');
    if (existing) existing.remove();

    var overlay = document.createElementNS(SVG_NS, 'svg');
    overlay.setAttribute('viewBox', vb.join(' '));
    overlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    overlay.setAttribute('data-ve-tikz-overlay', '1');
    overlay.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
      + 'overflow:visible;';

    var diagramId =
      wrapperEl.getAttribute('data-ve-id')
      || wrapperEl.getAttribute('data-ve-internal-id')
      || 've-tikz-?';
    var diagramTikz = wrapperEl.getAttribute('data-ve-tikz-source') || null;

    regions.forEach(function (r) {
      if (!r || !r.id) return;
      var el = createRegionElement(r);
      if (!el) return;

      el.setAttribute('data-ve-id', diagramId + '-region-' + r.id);
      el.setAttribute('data-ve-type', 'geometric-region');
      el.setAttribute('data-ve-label', r.label || r.id);
      try {
        el.setAttribute('data-ve-data', JSON.stringify({
          regionId: r.id,
          regionLabel: r.label || r.id,
          regionShape: r.shape,
          diagramId: diagramId,
          fullDiagramLatex: diagramTikz
        }));
      } catch (_) {}

      // Hit area: invisible by default (transparent fill, no stroke), but
      // accepts pointer events so the click registers. On hover, fill in
      // a subtle accent so the user sees what they're picking.
      el.style.cssText =
        'pointer-events:auto;cursor:pointer;'
        + 'fill:' + (debug ? 'rgba(220,38,38,0.28)' : 'transparent') + ';'
        + 'stroke:' + (debug ? 'rgba(220,38,38,0.85)' : 'transparent') + ';'
        + 'stroke-width:' + (debug ? '0.06' : '0') + ';'
        + 'transition:fill 120ms ease, stroke 120ms ease;';

      el.addEventListener('mouseenter', function () {
        if (debug) return;
        el.style.fill = 'currentColor';
        el.style.fillOpacity = '0.18';
        el.style.stroke = 'currentColor';
        el.style.strokeOpacity = '0.65';
        el.style.strokeWidth = '0.05';
      });
      el.addEventListener('mouseleave', function () {
        if (debug) return;
        el.style.fill = 'transparent';
        el.style.stroke = 'transparent';
      });

      overlay.appendChild(el);
    });

    wrapperEl.appendChild(overlay);
  }

  // ---------------------------------------------------------------------
  // Directed graphs via viz.js (Graphviz WASM)
  // ---------------------------------------------------------------------

  var VIZ_URL = 'https://cdn.jsdelivr.net/npm/@viz-js/viz/lib/viz-standalone.js';
  var vizLoading = null;
  var vizInstance = null;

  function loadViz() {
    if (vizInstance) return Promise.resolve(vizInstance);
    if (vizLoading) return vizLoading;
    vizLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = VIZ_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = function () {
        if (!window.Viz || typeof window.Viz.instance !== 'function') {
          reject(new Error('@viz-js/viz did not expose Viz.instance'));
          return;
        }
        window.Viz.instance().then(function (inst) {
          vizInstance = inst;
          resolve(inst);
        }, reject);
      };
      script.onerror = function () { reject(new Error('Failed to load viz.js')); };
      document.head.appendChild(script);
    });
    return vizLoading;
  }

  // Replace a Graphviz <text> label that looks like LaTeX math ($…$ or
  // \(...\)) with a <foreignObject> holding the KaTeX-rendered HTML. The
  // math stays inside the SVG (not absolute-positioned) so the graph
  // remains a self-contained, exportable figure for paper inclusion.
  function rerenderTextAsMath(textEl, latex, katex) {
    var fontSize = parseFloat(textEl.getAttribute('font-size'))
                || parseFloat(window.getComputedStyle(textEl).fontSize)
                || 14;

    // textEl.getBBox() returns the actual rendered bounding box (top-left
    // origin), which is the only reliable way to position the
    // foreignObject — the <text> element's `y` attribute is the BASELINE,
    // not the geometric centre, so naive `y - height/2` placement pushes
    // the math down by ~30 % of the line-height. getBBox() avoids that.
    var bbox;
    try {
      bbox = textEl.getBBox();
    } catch (e) {
      var fx = parseFloat(textEl.getAttribute('x')) || 0;
      var fy = parseFloat(textEl.getAttribute('y')) || 0;
      bbox = {
        x: fx - fontSize * 0.4,
        y: fy - fontSize * 0.85,
        width: fontSize * 0.8,
        height: fontSize * 1.0
      };
    }

    // Pad generously so KaTeX (which has its own internal margins) doesn't
    // get clipped, then re-centre on the original text's geometric centre.
    var width = Math.max(bbox.width * 2.4, fontSize * 3);
    var height = Math.max(bbox.height * 2.4, fontSize * 2.2);
    var cx = bbox.x + bbox.width / 2;
    var cy = bbox.y + bbox.height / 2;

    var fo = document.createElementNS(SVG_NS, 'foreignObject');
    fo.setAttribute('x', String(cx - width / 2));
    fo.setAttribute('y', String(cy - height / 2));
    fo.setAttribute('width', String(width));
    fo.setAttribute('height', String(height));
    fo.setAttribute('overflow', 'visible');
    fo.setAttribute('data-ve-math-label', '1');

    var div = document.createElement('div');
    div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    div.style.cssText =
      'display:flex;align-items:center;justify-content:center;'
      + 'width:100%;height:100%;font-size:' + fontSize + 'px;';
    try {
      katex.render(latex, div, {
        throwOnError: false,
        output: 'html',
        strict: 'ignore',
        trust: function (ctx) {
          var allowed = { '\\htmlClass':1, '\\htmlData':1, '\\htmlId':1, '\\htmlStyle':1 };
          return !!allowed[ctx.command];
        },
        macros: buildKatexMacros()
      });
    } catch (e) {
      div.textContent = latex;
    }
    fo.appendChild(div);

    textEl.parentNode.insertBefore(fo, textEl);
    textEl.style.display = 'none';
  }

  function applyGraphMathLabels(svgEl) {
    var texts = svgEl.querySelectorAll('text');
    if (!texts.length) return;
    var pending = [];
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      var content = (t.textContent || '').trim();
      var m = /^\$([\s\S]+?)\$$/.exec(content) || /^\\\(([\s\S]+?)\\\)$/.exec(content);
      if (!m) continue;
      pending.push({ el: t, latex: m[1] });
    }
    if (!pending.length) return;
    loadKatex().then(function (katex) {
      pending.forEach(function (item) {
        rerenderTextAsMath(item.el, item.latex, katex);
      });
    }).catch(function () {});
  }

  function decorateGraphSvg(wrapperEl, svgEl) {
    var dotSrc = wrapperEl.getAttribute('data-ve-graph-source') || null;

    // Internal id used to namespace nodes / edges / regions. We deliberately
    // do NOT set data-ve-id on the wrapper itself — that would make clicks
    // on the figure background / whitespace fire a "whole-diagram" selection,
    // which is almost never what the user wants. Authors who DO want a
    // background-clickable figure can set data-ve-id explicitly on the
    // wrapper before render; we only honor it if it was already there.
    var diagramId = wrapperEl.getAttribute('data-ve-id');
    if (!diagramId) {
      if (typeof window.__veGraphCounter !== 'number') window.__veGraphCounter = 0;
      window.__veGraphCounter += 1;
      diagramId = 've-graph-' + window.__veGraphCounter;
      // intentionally not exposed as a click target
    }

    // Walk node + edge groups. Graphviz emits <g class="node"> per node
    // and <g class="edge"> per edge. We auto-assign data-ve-id to every
    // one (deriving from Graphviz's emitted <title> like "i3->j5"), so
    // authors don't have to write id="…" on every DOT edge to make them
    // clickable. Author-supplied ids that already start with "ve-" win.
    var groups = svgEl.querySelectorAll('g.node, g.edge');
    var autoCounters = { node: 0, edge: 0 };
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var isEdge = g.classList.contains('edge');
      var kind = isEdge ? 'edge' : 'node';
      var titleEl = g.querySelector('title');
      var titleText = titleEl ? titleEl.textContent.trim() : '';

      // Resolve a stable id: explicit ve-* DOT id wins; otherwise derive
      // from <title> content (turns "i3->j5" into "ve-edge-i3-to-j5"); if
      // even that's empty, fall back to a counter.
      var id = g.getAttribute('id');
      if (!id || id.indexOf('ve-') !== 0) {
        autoCounters[kind] += 1;
        var slug = titleText
          .replace(/->/g, '-to-')
          .replace(/--/g, '-to-')
          .replace(/[^A-Za-z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (!slug) slug = String(autoCounters[kind]);
        id = 've-' + kind + '-' + slug;
        g.setAttribute('id', id);
      }

      // Human label: prefer the visible <text> for nodes; fall back to
      // the title for edges (which usually says "from->to") or to the id
      // as last resort.
      var label = titleText || id.replace(/^ve-(node|edge)-/, '');
      var textEl = g.querySelector('text');
      if (textEl && textEl.textContent.trim()) label = textEl.textContent.trim();

      g.setAttribute('data-ve-id', id);
      g.setAttribute('data-ve-type', isEdge ? 'graph-edge' : 'graph-node');
      g.setAttribute('data-ve-label', label);
      g.setAttribute('data-ve-data', JSON.stringify({
        graphId: diagramId,
        kind: isEdge ? 'edge' : 'node',
        dotSource: dotSrc
      }));
      g.style.cursor = 'pointer';

      // Edge hit-area expansion: Graphviz strokes edge paths at 1–2 px,
      // and SVG default `pointer-events: visiblePainted` only registers
      // clicks on those few painted pixels. The visual line stays thin
      // (good design), but precise clicks become frustrating. Add an
      // invisible 14 px-wide twin path as a hit area beneath the visible
      // path — same `d`, transparent stroke, `pointer-events: stroke` so
      // clicks anywhere within ~7 px of the line bubble to the edge <g>.
      if (isEdge) {
        addEdgeHitArea(g);
      }
    }
  }

  function addEdgeHitArea(edgeGroup) {
    var paths = edgeGroup.querySelectorAll('path');
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      // Don't double-clone our own hit-area paths.
      if (p.getAttribute('data-ve-hit') === '1') continue;
      // Skip if this path is the one we just inserted (in a prior pass).
      if (p.previousSibling
          && p.previousSibling.nodeType === 1
          && p.previousSibling.getAttribute
          && p.previousSibling.getAttribute('data-ve-hit') === '1') continue;
      var clone = p.cloneNode(false);
      clone.setAttribute('data-ve-hit', '1');
      clone.setAttribute('stroke', 'transparent');
      clone.setAttribute('stroke-width', '14');
      clone.setAttribute('stroke-linecap', 'round');
      clone.setAttribute('stroke-linejoin', 'round');
      clone.setAttribute('fill', 'none');
      clone.setAttribute('pointer-events', 'stroke');
      clone.style.cursor = 'pointer';
      // Insert BEFORE the visible path so the visible stroke paints on
      // top (z-order). Pointer-events still reach the hit clone for
      // clicks landing in the empty space around the visible stroke.
      p.parentNode.insertBefore(clone, p);
    }
  }

  function renderGraph(wrapperEl) {
    if (wrapperEl.__veGraphInit) return;
    wrapperEl.__veGraphInit = true;

    var src = wrapperEl.getAttribute('data-dot') || (wrapperEl.textContent || '').trim();
    if (!src) return;
    wrapperEl.setAttribute('data-ve-graph-source', src);
    wrapperEl.setAttribute('data-ve-snippet-source', '1');

    var engine = wrapperEl.getAttribute('data-ve-graph-engine') || 'dot';

    loadViz().then(function (viz) {
      var svgEl;
      try {
        svgEl = viz.renderSVGElement(src, { engine: engine });
      } catch (err) {
        wrapperEl.textContent = src;
        wrapperEl.style.color = 'crimson';
        wrapperEl.title = 'Graphviz error: ' + (err && err.message ? err.message : err);
        return;
      }
      // Make the SVG fluid in its container.
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
      wrapperEl.textContent = '';
      wrapperEl.appendChild(svgEl);
      decorateGraphSvg(wrapperEl, svgEl);
      // Re-render math labels last; the SVG is in the DOM so getBBox()
      // works for sizing the foreignObject containers.
      applyGraphMathLabels(svgEl);
      // Wrap the SVG in a zoom/pan viewport. Author can opt out by
      // setting data-ve-graph-zoom="off" on the wrapper.
      if (wrapperEl.getAttribute('data-ve-graph-zoom') !== 'off') {
        enableGraphZoom(wrapperEl, svgEl);
      }
    }).catch(function (err) {
      // Restore raw source so the user at least sees the DOT.
      console.warn('[ve-runtime] graph rendering disabled:', err);
      wrapperEl.textContent = src;
    });
  }

  function initAllGraphs() {
    var elements = document.querySelectorAll('.ve-graph, [data-ve-graph]');
    if (!elements.length) return;
    for (var i = 0; i < elements.length; i++) renderGraph(elements[i]);
  }

  // ---------------------------------------------------------------------
  // Graph zoom + pan controls — wraps a rendered Graphviz SVG in a
  // viewport with overflow:hidden + transform-based zoom + drag-to-pan.
  // Same UX pattern as the Mermaid `.diagram-shell`.
  // ---------------------------------------------------------------------

  function enableGraphZoom(wrapperEl, svgEl) {
    if (wrapperEl.__veZoomInit) return;
    wrapperEl.__veZoomInit = true;

    var minZoom = 0.2;
    var maxZoom = 8;
    var zoom = 1;
    var panX = 0;
    var panY = 0;

    // Wrap the SVG in a viewport div so overflow can be clipped while we
    // CSS-transform the SVG itself for zoom/pan.
    var viewport = document.createElement('div');
    viewport.className = 've-graph-viewport';
    viewport.style.cssText = [
      'position:relative',
      'overflow:hidden',
      'width:100%',
      'cursor:grab',
      'user-select:none',
      'touch-action:none',
      'border-radius:6px'
    ].join(';');

    svgEl.parentNode.insertBefore(viewport, svgEl);
    viewport.appendChild(svgEl);

    // Reset SVG sizing — it now lives inside the viewport and is
    // CSS-transformed for zoom/pan. The `width:100%` keeps the natural
    // unzoomed size matching the viewport's width.
    svgEl.style.maxWidth = 'none';
    svgEl.style.transformOrigin = '0 0';
    svgEl.style.transition = 'transform 80ms ease-out';
    svgEl.style.willChange = 'transform';

    // Match viewport height to the SVG's natural rendered height so the
    // "fit" baseline is the unscaled view.
    function refreshViewportHeight() {
      var h = svgEl.getBoundingClientRect().height;
      if (h > 0) viewport.style.height = h + 'px';
    }
    refreshViewportHeight();
    new ResizeObserver(refreshViewportHeight).observe(svgEl);

    function apply() {
      svgEl.style.transform =
        'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
      if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + '%';
    }

    function clampZoom(z) { return Math.max(minZoom, Math.min(maxZoom, z)); }

    function fit() { zoom = 1; panX = 0; panY = 0; apply(); }

    function zoomAtPoint(factor, viewportX, viewportY) {
      var newZoom = clampZoom(zoom * factor);
      if (newZoom === zoom) return;
      // Keep the point under the cursor stationary across the zoom.
      var ratio = newZoom / zoom;
      panX = viewportX - (viewportX - panX) * ratio;
      panY = viewportY - (viewportY - panY) * ratio;
      zoom = newZoom;
      apply();
    }

    // Controls overlay (top-right corner of the viewport). Layout
    // (position, top, right, z-index, padding, gap) is set inline
    // because it is positional, not chromatic. Colour, surface, blur,
    // border, font, shadow all read from --ve-control-* via the
    // .ve-graph-controls CSS class so the toolbar tints to the host
    // palette instead of shipping a hardcoded dark-translucent surface
    // that looked wrong on every warm/light page.
    var controls = document.createElement('div');
    controls.className = 've-graph-controls';
    controls.style.cssText = [
      'position:absolute',
      'top:8px',
      'right:8px',
      'z-index:10',
      'display:flex',
      'align-items:center',
      'gap:2px',
      'border-radius:var(--ve-control-radius, 8px)',
      'padding:4px',
      'pointer-events:auto'
    ].join(';');

    function makeBtn(label, title, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = 0;
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      // Class-based styling — colour/hover/focus all come from
      // .ve-graph-btn (themed via --ve-control-* and --ve-accent).
      b.className = 've-graph-btn';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onClick();
      });
      return b;
    }

    var zoomLabel = document.createElement('span');
    zoomLabel.className = 've-graph-zoom-label';
    zoomLabel.textContent = '100%';

    controls.appendChild(makeBtn('+', 'Zoom in (Ctrl+wheel up)',
      function () { zoomAtPoint(1.18, viewport.clientWidth / 2, viewport.clientHeight / 2); }));
    controls.appendChild(makeBtn('−', 'Zoom out (Ctrl+wheel down)',
      function () { zoomAtPoint(1 / 1.18, viewport.clientWidth / 2, viewport.clientHeight / 2); }));
    controls.appendChild(makeBtn('1:1', 'Reset to 100%', fit));
    controls.appendChild(zoomLabel);

    viewport.appendChild(controls);

    // Ctrl/Cmd + wheel → zoom at the cursor location.
    viewport.addEventListener('wheel', function (ev) {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      ev.preventDefault();
      var rect = viewport.getBoundingClientRect();
      var px = ev.clientX - rect.left;
      var py = ev.clientY - rect.top;
      var factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAtPoint(factor, px, py);
    }, { passive: false });

    // Click-and-drag to pan. Skip drag start if the press lands on a
    // selectable element (so node clicks still register cleanly). A small
    // movement threshold (4 px) prevents micro-jitter from cancelling the
    // click.
    var dragging = false;
    var dragMoved = false;
    var sx = 0, sy = 0, spx = 0, spy = 0;

    // A5 — drag handlers attach to `document` only WHILE dragging, then
    // detach on mouseup. Previously these were attached unconditionally
    // at viewport-init time, so a page with N graphs added 2N permanent
    // document-level listeners that fired on every cursor move forever.
    // Storing the bound functions so removeEventListener can find them.
    var onDragMove = function (ev) {
      if (!dragging) return;
      var dx = ev.clientX - sx;
      var dy = ev.clientY - sy;
      if (!dragMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        dragMoved = true;
        viewport.classList.add('is-panning');  // tells ve-runtime click handler to ignore the upcoming click
        viewport.style.cursor = 'grabbing';
      }
      if (dragMoved) {
        panX = spx + dx;
        panY = spy + dy;
        apply();
      }
    };
    var onDragUp = function () {
      if (!dragging) return;
      dragging = false;
      viewport.style.cursor = 'grab';
      svgEl.style.transition = 'transform 80ms ease-out';
      // Detach drag handlers so the document is clean again until the
      // user starts a new drag. Otherwise N graphs leak 2N listeners.
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragUp);
      // Defer removing the panning class so the click event that fires
      // immediately after mouseup sees it (and is therefore ignored).
      setTimeout(function () { viewport.classList.remove('is-panning'); }, 50);
    };

    viewport.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest('.ve-graph-controls, button, a[href]')) return;
      dragging = true;
      dragMoved = false;
      sx = ev.clientX; sy = ev.clientY;
      spx = panX; spy = panY;
      svgEl.style.transition = 'none';
      // Attach document-level listeners ONLY while a drag is active —
      // see onDragUp for the matching detach. Document-bound (not
      // viewport-bound) so the drag continues even if the cursor leaves
      // the viewport rectangle, matching native drag UX.
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragUp);
    });

    // Double-click anywhere in the viewport background → fit.
    viewport.addEventListener('dblclick', function (ev) {
      if (ev.target.closest('g.node, g.edge, .ve-graph-controls')) return;
      ev.preventDefault();
      fit();
    });

    // Keyboard shortcuts when the viewport is focused.
    viewport.tabIndex = 0;
    viewport.addEventListener('keydown', function (ev) {
      if (ev.key === '+' || ev.key === '=') { zoomAtPoint(1.18, viewport.clientWidth / 2, viewport.clientHeight / 2); ev.preventDefault(); }
      else if (ev.key === '-') { zoomAtPoint(1 / 1.18, viewport.clientWidth / 2, viewport.clientHeight / 2); ev.preventDefault(); }
      else if (ev.key === '0') { fit(); ev.preventDefault(); }
    });

    apply();
  }

  function watchForTikzRender(wrapperEl) {
    var regionsJson = wrapperEl.getAttribute('data-ve-tikz-regions');
    if (!regionsJson) return;
    var regions;
    try {
      regions = JSON.parse(regionsJson);
    } catch (err) {
      console.warn('[ve-runtime] invalid data-ve-tikz-regions JSON:', err);
      return;
    }
    if (!Array.isArray(regions) || !regions.length) return;

    var attempt = function () {
      // TikZJax replaces the <script type="text/tikz"> with the rendered
      // <svg>. Wait for that swap.
      var svg = wrapperEl.querySelector(':scope > svg, :scope svg');
      if (svg && svg.getAttribute('viewBox')) {
        applyTikzRegions(wrapperEl, svg, regions);
        return true;
      }
      return false;
    };

    if (attempt()) return;

    // F7 — capture the timeout handle so we can clearTimeout() it on
    // observer success. Otherwise the 60 s timer keeps a closure
    // referencing the wrapper element alive long after the SVG is
    // already painted (minor memory pressure on TikZ-heavy pages).
    var killTimer = 0;
    var observer = new MutationObserver(function () {
      if (attempt()) {
        observer.disconnect();
        if (killTimer) clearTimeout(killTimer);
      }
    });
    observer.observe(wrapperEl, { childList: true, subtree: true });

    // Hard timeout (TikZJax may fail to load or take a long time on cold
    // WASM fetch). Stop watching after 60 s so we don't leak observers.
    killTimer = setTimeout(function () { observer.disconnect(); }, 60000);
  }

  // ---------------------------------------------------------------------
  // Text-snippet selection: floating popup over a mouse selection.
  // Only active inside [data-ve-prose] so it never fights with normal
  // copy-paste behaviour on diagram pages.
  // ---------------------------------------------------------------------

  var snippetPopup = null;
  var snippetSeq = 0;
  // Preserved across the snippet → modal → close cycle so the user
  // never has to re-drag-select text just to add a second comment.
  // Cleared only when the snippet is replaced (new drag-select) or
  // when the page reloads.
  var preservedSnippetRange = null;
  // TRDD-352ef46a Phase 2.5 Region 2 — generic counterpart of
  // preservedSnippetRange. Captures whatever text range was active in
  // window.getSelection() the moment ANY comment modal opened, so the
  // user can SEE what they're commenting on even after the modal's
  // textarea steals focus and clears the ::selection paint. CSS
  // Custom Highlight API renders the band over the saved Range
  // independently of focus state.
  var preservedModalSelectionRange = null;

  function clearSnippetPopup() {
    if (snippetPopup) {
      snippetPopup.remove();
      snippetPopup = null;
    }
  }

  // Apply a visible highlight over the saved Range that survives
  // focus changes (the modal\'s textarea grabbing focus normally
  // clears the document\'s text selection). Uses CSS Custom Highlight
  // API where available (Chrome 105+, Safari 17.2+) — gracefully
  // no-ops in older browsers (the user still sees their selection
  // restored on modal close).
  function applyPreservedSnippetHighlight(range) {
    if (!range) return;
    if (typeof CSS === 'undefined' || !CSS.highlights) return;
    if (typeof Highlight === 'undefined') return;
    try {
      CSS.highlights.set('ve-snippet-active', new Highlight(range));
    } catch (_) { /* range may have detached if DOM mutated */ }
  }
  function clearPreservedSnippetHighlight() {
    if (typeof CSS === 'undefined' || !CSS.highlights) return;
    try { CSS.highlights.delete('ve-snippet-active'); } catch (_) {}
  }
  function restorePreservedSelection() {
    if (!preservedSnippetRange) return;
    var sel = window.getSelection();
    if (!sel) return;
    try {
      sel.removeAllRanges();
      sel.addRange(preservedSnippetRange);
    } catch (_) { /* range may have detached */ }
  }

  // TRDD-352ef46a Phase 2.5 Region 2 — generic modal-open selection
  // capture. Called from openCommentModal BEFORE any focus stealing;
  // saves the current Range (if any) and renders it via CSS.highlights
  // so the visible band survives the textarea grabbing focus. Called
  // for every modal open path (atom handle, snippet, hot-key) — the
  // snippet path also sets preservedSnippetRange separately because
  // its restore semantics differ.
  function applyPreservedModalHighlight(range) {
    if (!range) return;
    if (typeof CSS === 'undefined' || !CSS.highlights) return;
    if (typeof Highlight === 'undefined') return;
    try {
      CSS.highlights.set('ve-modal-active', new Highlight(range));
    } catch (_) {}
  }
  function clearPreservedModalHighlight() {
    if (typeof CSS === 'undefined' || !CSS.highlights) return;
    try { CSS.highlights.delete('ve-modal-active'); } catch (_) {}
  }
  function captureModalSelection() {
    var sel = window.getSelection ? window.getSelection() : null;
    if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
      preservedModalSelectionRange = null;
      return null;
    }
    try {
      preservedModalSelectionRange = sel.getRangeAt(0).cloneRange();
    } catch (_) {
      preservedModalSelectionRange = null;
    }
    if (preservedModalSelectionRange) {
      applyPreservedModalHighlight(preservedModalSelectionRange);
    }
    return preservedModalSelectionRange;
  }
  function releaseModalSelection() {
    clearPreservedModalHighlight();
    preservedModalSelectionRange = null;
  }

  function paragraphFromNode(node) {
    if (!node) return null;
    var el = node.nodeType === 3 ? node.parentElement : node;
    return el && el.closest ? el.closest('[data-ve-pnum]') : null;
  }

  // Text-selection bubble handle — independent from the element-selection
  // bubble handle (.ve-comment-handle). Both share the same compact
  // bubble shape (28×22 rounded-rect badge), but use different colors
  // so the user knows which kind of selection they\'re commenting on:
  //   • element handle  → gold/amber (--ve-accent)         → atom comment thread
  //   • text-snippet    → teal (--ve-snippet-handle-bg)    → text-range comment thread
  // Both open the SAME modal but with different thread keys (group:… vs
  // snippet:…) so the threads don\'t collide.
  function showSnippetPopup() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) { clearSnippetPopup(); return; }
    var text = sel.toString().trim();
    if (text.length < 1) { clearSnippetPopup(); return; }

    var range = sel.getRangeAt(0);
    var anchor = range.commonAncestorContainer;
    var anchorEl = (anchor.nodeType === 3 ? anchor.parentElement : anchor);

    // Activate inside any opt-in snippet source: prose, math, TikZ, or
    // any rendered report (which means table cells too — the report
    // wrapper has [data-ve-report] so text-select inside <td> qualifies).
    var snippetHost = anchorEl && anchorEl.closest
      ? anchorEl.closest(
          '[data-ve-prose], [data-ve-snippet-source], [data-ve-report], '
          + '.ve-math, [data-ve-math], .ve-tikz, [data-ve-tikz]'
        )
      : null;
    if (!snippetHost) { clearSnippetPopup(); return; }

    var mathHost = anchorEl && anchorEl.closest
      ? anchorEl.closest('.ve-math, [data-ve-math]') : null;
    var tikzHost = anchorEl && anchorEl.closest
      ? anchorEl.closest('.ve-tikz, [data-ve-tikz]') : null;

    var paraEl = paragraphFromNode(range.startContainer) || paragraphFromNode(range.endContainer);
    var pnum = paraEl ? paraEl.getAttribute('data-ve-pnum') : null;
    var paraText = paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim() : null;

    var mathLatex = mathHost
      ? (mathHost.getAttribute('data-ve-math-source') || mathHost.getAttribute('data-tex') || null)
      : null;
    var mathFormulaId = mathHost ? (mathHost.getAttribute('data-ve-id') || null) : null;
    var mathFormulaLabel = mathHost ? (mathHost.getAttribute('data-ve-label') || null) : null;
    var isChem = mathHost && mathHost.classList && mathHost.classList.contains('ve-math--chem');

    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { clearSnippetPopup(); return; }

    // Single-button bubble — same shape as .ve-comment-handle, distinct
    // color via --ve-snippet-handle-bg. NO emoji label (matches the
    // element handle\'s clean badge appearance).
    if (!snippetPopup) {
      snippetPopup = document.createElement('button');
      snippetPopup.type = 'button';
      snippetPopup.setAttribute('data-ve-snippet-popup', '');
      snippetPopup.title = 'Comment on the selected text';
      snippetPopup.setAttribute('aria-label', 'Open comment on the selected text snippet');
      // 💬 emoji — same as the element handle for instant recognition.
      // The teal background distinguishes "text snippet" from the gold
      // element handle.
      snippetPopup.textContent = '\u{1F4AC}';
      document.body.appendChild(snippetPopup);
    }

    var btn = snippetPopup;

    // Position chip ABOVE the selection by default; flip below if it would
    // clip off the top of the viewport. Center horizontally on the rect mid.
    var chipTop = rect.top + window.scrollY - 30;
    var chipLeft = rect.left + window.scrollX + (rect.width / 2) - 14;
    if (chipTop < window.scrollY + 8) chipTop = rect.bottom + window.scrollY + 8;
    var pos = clampToViewport(snippetPopup, chipTop, chipLeft, 8);
    snippetPopup.style.top = pos.top + 'px';
    snippetPopup.style.left = pos.left + 'px';

    // Dedupe — chip is a singleton; clear stale click handler before re-binding.
    if (btn._veSnippetClick) btn.removeEventListener('click', btn._veSnippetClick);

    var onChipClick = function () {
      snippetSeq++;
      var truncated = text.length > 120 ? text.slice(0, 117) + '…' : text;
      var payload;
      if (mathHost) {
        payload = {
          id: (mathFormulaId || 've-math-?') + '-snippet-' + snippetSeq,
          type: isChem ? 'chem-snippet' : 'math-snippet',
          label: truncated,
          data: { text: text, fullFormulaLatex: mathLatex, fullFormulaLabel: mathFormulaLabel,
                  formulaId: mathFormulaId, chem: !!isChem,
                  paragraphId: pnum, paragraphNumber: pnum }
        };
      } else if (tikzHost) {
        var tikzSrc = tikzHost.getAttribute('data-ve-tikz-source') || tikzHost.getAttribute('data-tikz') || null;
        var tikzId = tikzHost.getAttribute('data-ve-id') || null;
        var tikzLabel = tikzHost.getAttribute('data-ve-label') || null;
        payload = {
          id: (tikzId || 've-tikz-?') + '-snippet-' + snippetSeq,
          type: 'tikz-snippet',
          label: truncated,
          data: { text: text, fullDiagramLatex: tikzSrc, fullDiagramLabel: tikzLabel,
                  diagramId: tikzId, paragraphId: pnum, paragraphNumber: pnum }
        };
      } else {
        payload = {
          id: 've-snippet-' + (pnum || 'p?') + '-' + snippetSeq,
          type: 'text-snippet',
          label: truncated,
          data: { text: text, paragraphId: pnum, paragraphNumber: pnum, paragraphText: paraText }
        };
      }
      var threadKey = (mathHost ? 'math' : (tikzHost ? 'tikz' : 'snippet'))
        + ':' + (pnum || 'p?') + ':' + simpleHash(text);
      // Save the Range BEFORE doing anything that might steal focus
      // (modal open → textarea focus → window.getSelection() collapses).
      // The saved Range is what we restore when the modal closes so the
      // user can re-comment on the same text without re-dragging.
      preservedSnippetRange = range.cloneRange();
      // Visual highlight that survives focus changes — uses the CSS
      // Custom Highlight API. The modal\'s textarea focus would
      // normally clear the document\'s ::selection paint; ::highlight()
      // is independent of the selection, so the teal band stays on
      // the chosen text the whole time the modal is open.
      applyPreservedSnippetHighlight(preservedSnippetRange);
      // Build a transient invisible anchor element positioned EXACTLY
      // over the selected text bbox. The connector-line code in
      // updateConnectorLine() uses anchorEl.getBoundingClientRect() to
      // draw the line — passing the snippet chip directly would draw
      // to a 0×0 invisible point because we hide the chip on modal
      // open. Instead, the transient anchor sits over the real text
      // selection so the line points where the user expects.
      var anchorRect = range.getBoundingClientRect();
      var anchorDiv = document.createElement('div');
      anchorDiv.setAttribute('data-ve-snippet-anchor', '1');
      anchorDiv.setAttribute('data-ve-comment-id', threadKey);
      anchorDiv.dataset.veSnippetPayload = JSON.stringify(payload);
      anchorDiv.style.cssText =
        'position:absolute;'
        + 'pointer-events:none;'
        + 'left:' + (anchorRect.left + window.scrollX) + 'px;'
        + 'top:' + (anchorRect.top + window.scrollY) + 'px;'
        + 'width:' + Math.max(8, anchorRect.width) + 'px;'
        + 'height:' + Math.max(8, anchorRect.height) + 'px;'
        + 'opacity:0;z-index:0;';
      document.body.appendChild(anchorDiv);
      btn.style.display = 'none';
      try { openCommentModal(anchorDiv); }
      catch (err) {
        postSelection(payload);
        clearSnippetPopup();
        if (anchorDiv && anchorDiv.parentNode) anchorDiv.parentNode.removeChild(anchorDiv);
      }
    };
    btn._veSnippetClick = onChipClick;
    btn.addEventListener('click', onChipClick);
  }

  // 32-bit DJB2 hash → 8-char hex. Stable enough for thread-keying
  // snippets by content; collisions are tolerable since snippets are
  // already paragraph-scoped via the threadKey prefix.
  function simpleHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h | 0;
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 2 — multi-click text selection inside [data-ve-prose].
  //
  // Per TRDD-352ef46a Phase 2.5 the depth ladder has 9 levels (was 7).
  // Each successive click on the same screen point within 500ms
  // expands the selection one level wider. The very first click of a
  // chain only registers the start (no paint), matching the convention
  // that a double-click selects a word.
  //
  //   visualDepth 1 = char       (single grapheme via Intl.Segmenter)
  //   visualDepth 2 = word       (Intl.Segmenter granularity:'word')
  //   visualDepth 3 = sentence   (Intl.Segmenter granularity:'sentence')
  //   visualDepth 4 = line       (visual line — \n boundaries in source
  //                               text, falls back to the block grammar
  //                               when the text node has no newlines)
  //   visualDepth 5 = paragraph  (closest [data-ve-pnum] block)
  //   visualDepth 6 = list-item  (closest <li> ancestor; falls back to
  //                               paragraph when not inside a list)
  //   visualDepth 7 = section    (chop ONE pnum segment: "1.2.3" → "1.2")
  //   visualDepth 8 = subsection (chop TWO pnum segments: "1.2.3" → "1")
  //   visualDepth 9 = whole-doc  (every [data-ve-pnum] in the page)
  //
  // Selections are added to veSelection as kind:'text' entries. Per
  // TRDD §3.4, multi-click NEVER deselects — only mouse-drag (Phase 4)
  // does. Each new click within the chain REPLACES the previous entry
  // at a deeper depth, so the chain only ever has one entry at any
  // time. The first click in a new chain (different location, > 500ms,
  // or > 8px from the previous click) starts at chain.depth=1
  // (= visualDepth 0 = no paint).
  // ─────────────────────────────────────────────────────────────────────

  var lastClickChain = null; // {textNode, charIdx, depth, entryId, time}
  var CLICK_GRACE_MS = 500;
  var CLICK_GRACE_PX = 8;
  var veLocale = null;

  function getLocale() {
    if (veLocale) return veLocale;
    var raw = (document.documentElement.getAttribute('lang') || 'en');
    var lang = String(raw).toLowerCase().split(/[-_]/)[0];
    // Per TRDD §3.4, only `<html lang>` drives locale — never
    // navigator.language (unreliable on Safari mobile per user). If
    // unrecognised, default to US format.
    var european = ['it','de','nl','da','nb','pt','pl','tr','vi','id','is','el','ru','uk','bg','hr','cs','hu','lv','mk','ro','sk','sl','bs','mt','sr'];
    var french   = ['fr','fi','et','lt','sv'];
    if (french.indexOf(lang) >= 0)   veLocale = {lang: lang, decSep: ',', thouSep: ' '};
    else if (european.indexOf(lang) >= 0) veLocale = {lang: lang, decSep: ',', thouSep: '.'};
    else                                  veLocale = {lang: lang, decSep: '.', thouSep: ','};
    return veLocale;
  }

  function isInsideProseText(target) {
    if (!target || !target.closest) return false;
    if (target.closest('[data-ve-overlay], button, input, textarea, select, .ve-pnum, [data-ve-snippet-popup]')) return false;
    return !!target.closest('[data-ve-prose]');
  }

  function caretInfoAt(x, y) {
    // caretPositionFromPoint is the standard API (Baseline since 2024 across
    // Chrome 128+ / Safari 18.2+ / Firefox 20+). The legacy WebKit-only
    // caretRangeFromPoint fallback was removed — it is deprecated.
    if (typeof document.caretPositionFromPoint !== 'function') return null;
    var p = document.caretPositionFromPoint(x, y);
    if (!p || !p.offsetNode || p.offsetNode.nodeType !== Node.TEXT_NODE) return null;
    return {node: p.offsetNode, offset: p.offset};
  }

  function buildLetterRange(node, idx) {
    var text = node.textContent;
    if (!text || text.length === 0) return null;
    var i = Math.max(0, Math.min(idx, text.length - 1));
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      var segs = new Intl.Segmenter(getLocale().lang, {granularity: 'grapheme'}).segment(text);
      for (var s of segs) {
        if (i >= s.index && i < s.index + s.segment.length) {
          var r = document.createRange();
          r.setStart(node, s.index);
          r.setEnd(node, s.index + s.segment.length);
          return r;
        }
      }
    }
    var r2 = document.createRange();
    r2.setStart(node, i);
    r2.setEnd(node, Math.min(i + 1, text.length));
    return r2;
  }

  function buildWordRange(node, idx) {
    var text = node.textContent;
    if (!text || text.length === 0) return null;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      var segs = new Intl.Segmenter(getLocale().lang, {granularity: 'word'});
      var fallback = null;
      for (var s of segs.segment(text)) {
        if (idx >= s.index && idx < s.index + s.segment.length) {
          if (s.isWordLike) {
            var r = document.createRange();
            r.setStart(node, s.index);
            r.setEnd(node, s.index + s.segment.length);
            return r;
          }
          fallback = s;
        }
      }
      if (fallback) {
        var r2 = document.createRange();
        r2.setStart(node, fallback.index);
        r2.setEnd(node, fallback.index + fallback.segment.length);
        return r2;
      }
    }
    // Fallback: walk \w characters
    var left = idx, right = idx;
    while (left > 0 && /[A-Za-z0-9_À-ɏ]/.test(text[left-1])) left--;
    while (right < text.length && /[A-Za-z0-9_À-ɏ]/.test(text[right])) right++;
    if (left === right) return buildLetterRange(node, idx);
    var r3 = document.createRange();
    r3.setStart(node, left);
    r3.setEnd(node, right);
    return r3;
  }

  function buildBlockRange(node, idx) {
    var text = node.textContent;
    if (!text || text.length === 0) return null;
    // Stop characters: whitespace, brackets, operators, punctuation that
    // is NEVER part of a numeric literal. Comma and dot are special-cased
    // below so that 10,000.00 / 10.000,00 stay glued together.
    // The STOP set is intentionally MINIMAL: only whitespace, brackets,
    // and quote marks. Most other punctuation (.,/:;-+=*%@#&|^~!?$\)
    // routinely appears mid-token in real-world text and would split
    // every example below if listed here:
    //   - dates / times:   2026-05-04, 14:30:00, 5/4/2026, 04.05.2026
    //   - URLs / emails:   jane.doe@example.com, https://x.io/path
    //   - IDs / tickers:   IT12345678901, BRK.A, 123-45-6789
    //   - money / pct:     $100, $1.5M, 5%, 5.5%
    //   - law citations:   D.Lgs., § 823 BGB
    // The boundary still always stops at the next space / bracket /
    // quote, so multi-word names like "Apple Inc." still split on the
    // space (the user can multi-select or wait for depth=4 in phase 3).
    var STOP = /[\s\u00a0(){}\[\]<>"`'«»‹›‚„“”‘’‛‟]/;
    function isDigit(c) { return c !== undefined && c >= '0' && c <= '9'; }
    function isSep(c)   { return c === ',' || c === '.'; }

    var left = idx;
    while (left > 0) {
      var c = text[left - 1];
      if (STOP.test(c)) break;
      if (isSep(c)) {
        var prev = text[left - 2], next = text[left];
        if (!(isDigit(prev) && isDigit(next))) break;
      }
      left--;
    }
    var right = idx;
    while (right < text.length) {
      var c2 = text[right];
      if (STOP.test(c2)) break;
      if (isSep(c2)) {
        var prev2 = text[right - 1], next2 = text[right + 1];
        if (!(isDigit(prev2) && isDigit(next2))) break;
      }
      right++;
    }
    if (left === right) return buildLetterRange(node, idx);
    var r = document.createRange();
    r.setStart(node, left);
    r.setEnd(node, right);
    return r;
  }

  // visualDepth 3 — sentence around the click point. Uses
  // Intl.Segmenter(granularity:'sentence') (Baseline since Chrome 87 /
  // Safari 14.1 / Firefox 125). Trims surrounding whitespace so the
  // visible highlight ends at the punctuation, not 5 chars past.
  function buildSentenceRange(node, idx) {
    var text = node.textContent;
    if (!text || text.length === 0) return null;
    if (typeof Intl === 'undefined' || !Intl.Segmenter) {
      // No Intl.Segmenter: terminator-scan fallback. Looks for
      // [.!?…] followed by whitespace or end-of-string.
      var L = idx, R = idx;
      while (L > 0) {
        if (/[.!?…؟。！？]/.test(text.charAt(L - 1)) && /\s/.test(text.charAt(L) || ' ')) break;
        L--;
      }
      while (R < text.length) {
        var c = text.charAt(R);
        var nx = text.charAt(R + 1) || ' ';
        R++;
        if (/[.!?…؟。！？]/.test(c) && /\s/.test(nx)) break;
      }
      while (L < R && /\s/.test(text.charAt(L))) L++;
      while (R > L && /\s/.test(text.charAt(R - 1))) R--;
      if (L >= R) return buildBlockRange(node, idx);
      var fb = document.createRange();
      fb.setStart(node, L);
      fb.setEnd(node, R);
      return fb;
    }
    var segs = new Intl.Segmenter(getLocale().lang, {granularity: 'sentence'}).segment(text);
    for (var s of segs) {
      if (idx >= s.index && idx < s.index + s.segment.length) {
        var segEnd = s.index + s.segment.length;
        while (segEnd > s.index && /\s/.test(text.charAt(segEnd - 1))) segEnd--;
        var segStart = s.index;
        while (segStart < segEnd && /\s/.test(text.charAt(segStart))) segStart++;
        if (segStart >= segEnd) continue;
        var rr = document.createRange();
        rr.setStart(node, segStart);
        rr.setEnd(node, segEnd);
        return rr;
      }
    }
    // Click landed on whitespace between sentences — fall back to block.
    return buildBlockRange(node, idx);
  }

  // visualDepth 4 — visual line around the click point. Uses the text
  // node's own \n boundaries (same idea as codeLineRangeAt). For prose
  // without explicit line breaks, falls through to the sentence
  // grammar so the selection still grows monotonically.
  function buildLineRange(node, idx) {
    var text = node.textContent;
    if (!text || text.length === 0) return null;
    var i = Math.max(0, Math.min(idx, text.length));
    var L = i, R = i;
    while (L > 0 && text.charAt(L - 1) !== '\n') L--;
    while (R < text.length && text.charAt(R) !== '\n') R++;
    if (L >= R) return buildSentenceRange(node, idx);
    while (R > L && /[ \t ]/.test(text.charAt(R - 1))) R--;
    while (L < R && /[ \t ]/.test(text.charAt(L))) L++;
    if (L >= R) return buildSentenceRange(node, idx);
    var r = document.createRange();
    r.setStart(node, L);
    r.setEnd(node, R);
    return r;
  }

  // visualDepth 6 — closest <li> ancestor. Walks UP from the text node
  // looking for the nearest list item. If the click is not inside a
  // list, returns null and the caller falls back to paragraph scope.
  function listItemFromNode(node) {
    if (!node) return null;
    var el = node.nodeType === 3 ? node.parentElement : node;
    return el && el.closest ? el.closest('li') : null;
  }

  function paintTextSelection(range, depth, hostEl) {
    // Capture the range's anchor BEFORE surroundContents (the call splits
    // text nodes and reparents them, so the post-call range is no longer
    // anchored to the same DOM context). paragraphFromNode walks up from
    // the start container, which IS the actual text node we're selecting,
    // not the click event's target. The click target may be a wrapping
    // span from a prior chain or some other parent — always less reliable
    // than the range start for paragraph attribution.
    var anchor = range.startContainer;
    var paraEl = paragraphFromNode(anchor)
              || (hostEl && hostEl.closest ? hostEl.closest('[data-ve-pnum]') : null);
    var span = document.createElement('span');
    span.className = 've-text-sel';
    var entryId = 'text:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    span.setAttribute('data-ve-text-sel', entryId);
    try {
      range.surroundContents(span);
    } catch (e) {
      return null; // range crosses element boundaries — give up silently
    }
    var text = span.textContent || '';
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    var paraText = paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null;
    veSelection.push({
      kind: 'text',
      entryId: entryId,
      text: text,
      depth: depth,
      paragraphId: pnum,
      paragraphText: paraText
    });
    updateSubmitButtonsState();
    return entryId;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 3 — block-level text selection (depths 5-9 in the Phase 2.5
  // ladder; was depths 4-7 before).
  //
  // Depths 1-4 wrap a sub-paragraph fragment in a <span> via
  // surroundContents (char/word/sentence/line). Depths 5-9 span entire
  // paragraphs (or larger), so surroundContents would throw — instead
  // we mark the affected ELEMENTS with [data-ve-text-sel-block="<entryId>"]
  // and paint via CSS. Removal walks the DOM for matching elements.
  //
  // Scope by paragraph-numbering hierarchy (the existing numberProse()
  // assigns data-ve-pnum like "1.2.1"):
  //   depth 5 = paragraph    (single [data-ve-pnum] element)
  //   depth 6 = list-item    (closest <li> ancestor; resolved by the
  //                            click handler, not pnumScope)
  //   depth 7 = section      (chop ONE pnum segment: "1.2.3" → "1.2")
  //   depth 8 = subsection   (chop TWO pnum segments: "1.2.3" → "1")
  //   depth 9 = ALL prose    (every [data-ve-pnum] in the page)
  // ─────────────────────────────────────────────────────────────────────

  function pnumScope(currentPnum, depth) {
    if (!currentPnum) return null;
    if (depth === 5) return currentPnum;
    var parts = currentPnum.split('.');
    if (depth === 7) parts.pop();
    else if (depth === 8) {
      // Strip TWO segments so "1.2.3" becomes "1" — a level wider than
      // depth 7 (section). When the pnum has only 1-2 segments there is
      // nothing to strip past the first; clamp to a single-segment
      // chapter scope so the selection still expands monotonically.
      if (parts.length > 2) parts = parts.slice(0, parts.length - 2);
      else parts = [parts[0]];
    }
    return parts.join('.');
  }

  function elementsInPnumScope(scope) {
    if (!scope) return [];
    var els = document.querySelectorAll('[data-ve-prose] [data-ve-pnum]');
    var matches = [];
    var prefix = scope + '.';
    for (var i = 0; i < els.length; i++) {
      var p = els[i].getAttribute('data-ve-pnum');
      if (p === scope || p.indexOf(prefix) === 0) matches.push(els[i]);
    }
    return matches;
  }

  function paintBlockSelection(elements, depth) {
    if (!elements || elements.length === 0) return null;
    var entryId = 'text:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute('data-ve-text-sel-block', entryId);
    }
    var combined = '';
    for (var j = 0; j < elements.length; j++) {
      combined += (elements[j].textContent || '') + ' ';
      if (combined.length > 8000) break; // hard cap on collected text
    }
    combined = combined.replace(/\s+/g, ' ').trim();
    var firstPara = elements[0];
    var pnum = firstPara && firstPara.getAttribute ? firstPara.getAttribute('data-ve-pnum') : null;
    veSelection.push({
      kind: 'text',
      entryId: entryId,
      text: combined.slice(0, 5000),
      depth: depth,
      paragraphId: pnum,
      paragraphText: combined.slice(0, 240)
    });
    updateSubmitButtonsState();
    return entryId;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 3 — math sub-formula selection (depths 1-3 inside .ve-math).
  //
  // KaTeX renders LaTeX into nested <span> trees with predictable class
  // names. The smallest visible atoms carry one of: .mord (ordinary
  // letter/digit), .mbin (binary op), .mrel (relation), .mop (large
  // operator), .mopen / .mclose (delimiters), .mpunct (punctuation),
  // .minner (inner). Group containers carry .mfrac, .msupsub, .minner,
  // or are themselves nested .mord wrappers.
  //
  //   depth 1 = smallest atom under the click
  //   depth 2 = enclosing group container (parent atom/group)
  //   depth 3 = the whole .ve-math element (single formula)
  //
  // Depths 4-7 fall through to the prose block path — the math click
  // is treated as a click on its containing [data-ve-pnum] paragraph.
  // ─────────────────────────────────────────────────────────────────────

  var MATH_ATOM_SELECTOR = '.mord,.mbin,.mrel,.mop,.mopen,.mclose,.mpunct,.minner,.mfrac,.msupsub';

  function mathAtomFromPoint(x, y, mathEl) {
    if (!document.elementsFromPoint) return null;
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (!mathEl.contains(el)) continue;
      if (el.matches && el.matches(MATH_ATOM_SELECTOR)) return el;
    }
    return null;
  }

  function mathGroupFromAtom(atom, mathEl) {
    if (!atom) return null;
    var p = atom.parentElement;
    while (p && p !== mathEl) {
      if (p.matches && p.matches(MATH_ATOM_SELECTOR)) return p;
      p = p.parentElement;
    }
    return null;
  }

  function paintMathSelection(mathEl, x, y, depth) {
    if (!mathEl) return null;
    var painted = null;
    if (depth === 1) {
      painted = mathAtomFromPoint(x, y, mathEl) || mathEl;
    } else if (depth === 2) {
      var atom = mathAtomFromPoint(x, y, mathEl);
      painted = mathGroupFromAtom(atom, mathEl) || atom || mathEl;
    } else {
      painted = mathEl;
    }
    var entryId = 'math:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    painted.setAttribute('data-ve-math-sel', entryId);
    var src = mathEl.getAttribute('data-ve-math-source') || '';
    var paraEl = mathEl.closest ? mathEl.closest('[data-ve-pnum]') : null;
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    var text = (painted.textContent || '').replace(/\s+/g, ' ').trim();
    veSelection.push({
      kind: 'math',
      entryId: entryId,
      depth: depth,
      text: text.slice(0, 240),
      formulaLatex: src,
      paragraphId: pnum,
      paragraphText: paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null
    });
    updateSubmitButtonsState();
    return entryId;
  }

  function removeMathSelection(entryId) {
    var el = document.querySelector('[data-ve-math-sel="' + entryId + '"]');
    if (el) el.removeAttribute('data-ve-math-sel');
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) {
        veSelection.splice(i, 1);
        break;
      }
    }
    updateSubmitButtonsState();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 3 — code selection (depths 1-3 inside <pre>/<code> blocks).
  //
  //   depth 1 = TOKEN (single keyword/identifier/literal — Prism .token
  //              ancestor if present, otherwise word-range via caret)
  //   depth 2 = LINE  (the line containing the click, bounded by \n)
  //   depth 3 = BLOCK (the whole <pre> element)
  //   depth 4-7 = paragraph/section/chapter/all (prose hierarchy fallthrough)
  //
  // Token + line both wrap a Range via surroundContents (similar to the
  // prose inline path). Block stamps [data-ve-code-sel-block] on the
  // <pre> itself.
  // ─────────────────────────────────────────────────────────────────────

  function codeTokenAtPoint(x, y, preEl) {
    // If the click landed on a Prism .token / highlight.js .hljs-* span,
    // use that span's bounds. Otherwise fall back to a word-range from
    // the text node under the caret.
    if (document.elementsFromPoint) {
      var stack = document.elementsFromPoint(x, y);
      for (var i = 0; i < stack.length; i++) {
        var el = stack[i];
        if (!preEl.contains(el)) continue;
        var cls = el.className || '';
        if (typeof cls !== 'string') continue;
        if (cls.indexOf('token') >= 0 || cls.indexOf('hljs-') >= 0) {
          var r = document.createRange();
          r.selectNodeContents(el);
          return r;
        }
      }
    }
    var pos = caretInfoAt(x, y);
    if (!pos) return null;
    return buildWordRange(pos.node, pos.offset);
  }

  function codeLineRangeAt(x, y, preEl) {
    var pos = caretInfoAt(x, y);
    if (!pos || !pos.node || pos.node.nodeType !== 3) return null;
    // F5 — actually use the preEl arg (per js audit M2). Without
    // this guard a click in a paragraph that happened to land on a
    // text node with newlines would still produce a "code line"
    // range. preEl scopes the result to the intended <pre> block.
    if (preEl && !preEl.contains(pos.node)) return null;
    var text = pos.node.textContent || '';
    var idx = pos.offset;
    var left = idx;
    while (left > 0 && text.charAt(left - 1) !== '\n') left--;
    var right = idx;
    while (right < text.length && text.charAt(right) !== '\n') right++;
    if (left === right) {
      // Empty line — pick a single-character range so surroundContents
      // can still wrap something visible.
      if (right < text.length) right = Math.min(right + 1, text.length);
      else if (left > 0) left = Math.max(left - 1, 0);
      else return null;
    }
    var range = document.createRange();
    range.setStart(pos.node, left);
    range.setEnd(pos.node, right);
    return range;
  }

  function paintCodeInlineSelection(range, depth) {
    if (!range) return null;
    var entryId = 'code:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    var span = document.createElement('span');
    span.setAttribute('data-ve-code-sel', entryId);
    try {
      range.surroundContents(span);
    } catch (e) {
      // Range crossed element boundaries (e.g. spans Prism token
      // boundaries on a multi-character word). Re-extract as a fragment
      // and re-wrap; the visual highlight is the same.
      var frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    var pre = span.closest('pre');
    var lang = pre && pre.getAttribute('data-language')
      || (pre && pre.querySelector('code') ? pre.querySelector('code').className.replace(/.*language-([\w+-]+).*/, '$1') : null)
      || null;
    var codeId = pre && pre.getAttribute('data-ve-id') || null;
    var paraEl = pre && pre.closest ? pre.closest('[data-ve-pnum]') : null;
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    veSelection.push({
      kind: 'code',
      entryId: entryId,
      depth: depth,
      text: (span.textContent || '').slice(0, 5000),
      language: lang,
      codeId: codeId,
      paragraphId: pnum,
      paragraphText: paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null
    });
    updateSubmitButtonsState();
    return entryId;
  }

  function paintCodeBlockSelection(preEl) {
    if (!preEl) return null;
    var entryId = 'code:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    preEl.setAttribute('data-ve-code-sel-block', entryId);
    var lang = preEl.getAttribute('data-language')
      || (preEl.querySelector('code') ? preEl.querySelector('code').className.replace(/.*language-([\w+-]+).*/, '$1') : null)
      || null;
    var codeId = preEl.getAttribute('data-ve-id') || null;
    var paraEl = preEl.closest ? preEl.closest('[data-ve-pnum]') : null;
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    veSelection.push({
      kind: 'code',
      entryId: entryId,
      depth: 3,
      text: (preEl.textContent || '').slice(0, 5000),
      language: lang,
      codeId: codeId,
      paragraphId: pnum,
      paragraphText: paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null
    });
    updateSubmitButtonsState();
    return entryId;
  }

  function removeCodeSelection(entryId) {
    // Inline span entry (depths 1-2): unwrap.
    var span = document.querySelector('[data-ve-code-sel="' + entryId + '"]');
    if (span && span.parentNode) {
      var parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      if (parent.normalize) parent.normalize();
    }
    // Block entry (depth 3): clear marker on the <pre>.
    var blockEl = document.querySelector('[data-ve-code-sel-block="' + entryId + '"]');
    if (blockEl) blockEl.removeAttribute('data-ve-code-sel-block');
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) {
        veSelection.splice(i, 1);
        break;
      }
    }
    updateSubmitButtonsState();
  }

  // Dispatch helper used by the chain-bump code: an entryId's prefix tells
  // which painter ran ("math:" → math, "code:" → code, otherwise text).
  // The click handler doesn't have to remember which painter ran last.
  function removeChainSelection(entryId) {
    if (!entryId) return;
    if (entryId.indexOf('math:') === 0) removeMathSelection(entryId);
    else if (entryId.indexOf('code:') === 0) removeCodeSelection(entryId);
    else removeTextSelection(entryId);
  }

  function removeTextSelection(entryId) {
    // Inline span entry (depths 1-3): unwrap.
    var span = document.querySelector('[data-ve-text-sel="' + entryId + '"]');
    if (span && span.parentNode) {
      var parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      if (parent.normalize) parent.normalize();
    }
    // Block-attribute entry (depths 4-7): clear the marker on every
    // element that was painted under this entryId.
    var blocks = document.querySelectorAll('[data-ve-text-sel-block="' + entryId + '"]');
    for (var b = 0; b < blocks.length; b++) {
      blocks[b].removeAttribute('data-ve-text-sel-block');
    }
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) {
        veSelection.splice(i, 1);
        break;
      }
    }
    updateSubmitButtonsState();
  }

  function clearAllTextSelections() {
    var spans = document.querySelectorAll('[data-ve-text-sel]');
    for (var i = 0; i < spans.length; i++) {
      var s = spans[i];
      var parent = s.parentNode;
      if (!parent) continue;
      while (s.firstChild) parent.insertBefore(s.firstChild, s);
      parent.removeChild(s);
      if (parent.normalize) parent.normalize();
    }
    var blocks = document.querySelectorAll('[data-ve-text-sel-block]');
    for (var k = 0; k < blocks.length; k++) {
      blocks[k].removeAttribute('data-ve-text-sel-block');
    }
    var maths = document.querySelectorAll('[data-ve-math-sel]');
    for (var m = 0; m < maths.length; m++) {
      maths[m].removeAttribute('data-ve-math-sel');
    }
    var codes = document.querySelectorAll('[data-ve-code-sel]');
    for (var c = 0; c < codes.length; c++) {
      var cs = codes[c];
      var cp = cs.parentNode;
      if (!cp) continue;
      while (cs.firstChild) cp.insertBefore(cs.firstChild, cs);
      cp.removeChild(cs);
      if (cp.normalize) cp.normalize();
    }
    var codeBlocks = document.querySelectorAll('[data-ve-code-sel-block]');
    for (var cb = 0; cb < codeBlocks.length; cb++) {
      codeBlocks[cb].removeAttribute('data-ve-code-sel-block');
    }
    for (var j = veSelection.length - 1; j >= 0; j--) {
      var k2 = veSelection[j].kind;
      if (k2 === 'text' || k2 === 'math' || k2 === 'code') veSelection.splice(j, 1);
    }
  }

  function handleProseClick(ev) {
    if (sending) return;
    if (ev.defaultPrevented) return;
    var target = ev.target;
    if (!target || !target.closest) return;
    // Math/code click inside prose container? Route to the right grammar.
    var inProse = target.closest('[data-ve-prose]');
    if (!inProse) return;
    var mathEl = target.closest('.ve-math, [data-ve-math]');
    var preEl = !mathEl && target.closest('pre');
    var isMathClick = !!mathEl;
    var isCodeClick = !!preEl;
    var isProseClick = !mathEl && !preEl && isInsideProseText(target);
    if (!isProseClick && !isMathClick && !isCodeClick) return;
    // If the user is mid-drag (window selection has range), let the
    // snippet popup own that gesture — multi-click only fires for clean
    // collapsed-selection clicks.
    var winSel = window.getSelection();
    if (winSel && !winSel.isCollapsed && winSel.toString().length > 0) return;
    var now = Date.now();
    var clickX = ev.clientX, clickY = ev.clientY;
    // Track the chain by SCREEN COORDINATES, not by text-node identity.
    // surroundContents() splits the original text node into 3 siblings,
    // so the textNode reference is invalidated after the first paint —
    // the second click would otherwise look like a completely new chain
    // and reset depth to 1. Coordinates are stable across DOM mutations
    // (layout doesn't shift for a 1px-padded inline span).
    var sameChain = lastClickChain
      && (now - lastClickChain.time) < CLICK_GRACE_MS
      && Math.abs(clickX - lastClickChain.x) <= CLICK_GRACE_PX
      && Math.abs(clickY - lastClickChain.y) <= CLICK_GRACE_PX;
    if (sameChain) {
      // Remove the previous depth's selection FIRST. For text it unwraps
      // the inline span (so the text node re-unifies before re-painting);
      // for math it clears the [data-ve-math-sel] attribute. The dispatch
      // is by entryId prefix — see removeChainSelection.
      if (lastClickChain.entryId) removeChainSelection(lastClickChain.entryId);
      // 9-level ladder (TRDD-352ef46a Phase 2.5): chain counter ranges
      // 1..10 (sentinel + 9 paint levels), selection depth = chain - 1.
      lastClickChain.depth = Math.min(lastClickChain.depth + 1, 10);
    } else {
      // SHIFTED-BY-1 grammar: the FIRST click in a chain DOES NOT
      // select anything — it just registers the start. The 2nd click
      // within 500 ms is the first one that paints (visualDepth 1
      // = char), the 3rd paints depth 2 = word, …, the 10th paints
      // depth 9 (whole-doc). Matches the convention that a single
      // click is cursor-only and a double-click selects a word.
      lastClickChain = {x: clickX, y: clickY, depth: 1, entryId: null, time: now};
      lastClickChain.depth = 1; // sentinel for "no paint yet"
      return; // no selection action on the very first click of a chain
    }
    // From the 2nd click onward, depth is (chainCount - 1) clamped to 9.
    // The chain counter (lastClickChain.depth) ranges 1..10; selection
    // depth ranges 1..9. This is the only place we apply the shift.
    var visualDepth = Math.min(lastClickChain.depth - 1, 9);
    if (visualDepth < 1) return; // belt-and-braces — never paint at depth 0
    var entryId = null;
    if (isMathClick) {
      // Math grammar: depths 1-3 = atom/group/formula. Depth 4 (line)
      // = whole formula (the formula IS the smallest visual line that
      // contains the click). Depths 5-9 fall through to the prose
      // block path on the surrounding paragraph (paragraph/list-item/
      // section/subsection/whole-doc).
      if (visualDepth <= 3) {
        entryId = paintMathSelection(mathEl, clickX, clickY, visualDepth);
      } else if (visualDepth === 4) {
        // Same painted surface as depth 3 but the chain advances so
        // the next click expands further.
        entryId = paintMathSelection(mathEl, clickX, clickY, 3);
      } else {
        var mathPara = mathEl.closest('[data-ve-pnum]');
        var mathPnum = mathPara && mathPara.getAttribute ? mathPara.getAttribute('data-ve-pnum') : null;
        if (mathPnum) {
          var melements;
          if (visualDepth === 6) {
            // list-item: closest <li> ancestor of the math element.
            var mathLi = mathEl.closest ? mathEl.closest('li') : null;
            if (mathLi) {
              melements = [mathLi];
            } else {
              melements = elementsInPnumScope(pnumScope(mathPnum, 5));
            }
          } else if (visualDepth === 9) {
            melements = Array.from(document.querySelectorAll('[data-ve-prose] [data-ve-pnum]'));
          } else {
            var mscope = pnumScope(mathPnum, visualDepth);
            melements = elementsInPnumScope(mscope);
          }
          entryId = paintBlockSelection(melements, visualDepth);
        } else {
          // No numbered paragraph around the formula — degrade to depth 3
          // (whole formula).
          entryId = paintMathSelection(mathEl, clickX, clickY, 3);
          if (entryId) lastClickChain.depth = 4; // chain counter = depth+1
        }
      }
    } else if (isCodeClick) {
      // Code grammar: depth 1 = token, depth 2 = code line, depth 3 =
      // whole code block. Depths 4-9 fall through to the prose block
      // path on the surrounding paragraph.
      if (visualDepth === 1) {
        var tokenRange = codeTokenAtPoint(clickX, clickY, preEl);
        if (tokenRange) entryId = paintCodeInlineSelection(tokenRange, 1);
      } else if (visualDepth === 2) {
        var lineRange = codeLineRangeAt(clickX, clickY, preEl);
        if (lineRange) entryId = paintCodeInlineSelection(lineRange, 2);
      } else if (visualDepth === 3) {
        entryId = paintCodeBlockSelection(preEl);
      } else {
        // For depths 4-9 from a code click: find the [data-ve-pnum] anchor.
        // <pre> isn't auto-numbered (PARA_TAGS has PRE: 0), so the closest
        // ancestor often returns null. Fall back to the nearest PRECEDING
        // numbered element in document order — that's the heading or
        // paragraph that introduces this code block, which is the natural
        // scope for "select the section around this code".
        var codePara = preEl.closest('[data-ve-pnum]');
        if (!codePara) {
          var allNumbered = document.querySelectorAll('[data-ve-prose] [data-ve-pnum]');
          for (var an = allNumbered.length - 1; an >= 0; an--) {
            var cmp = preEl.compareDocumentPosition(allNumbered[an]);
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) {
              codePara = allNumbered[an];
              break;
            }
          }
        }
        var codePnum = codePara && codePara.getAttribute ? codePara.getAttribute('data-ve-pnum') : null;
        if (codePnum) {
          var celements;
          if (visualDepth === 6) {
            // list-item: closest <li> ancestor of the code block.
            var codeLi = preEl.closest ? preEl.closest('li') : null;
            if (codeLi) {
              celements = [codeLi];
            } else {
              celements = elementsInPnumScope(pnumScope(codePnum, 5));
            }
          } else if (visualDepth === 9) {
            celements = Array.from(document.querySelectorAll('[data-ve-prose] [data-ve-pnum]'));
          } else if (visualDepth === 4) {
            // "line" past the code-block depth = the paragraph that
            // introduces this code (smallest legal scope above the
            // <pre>). Mirrors the math line→formula behaviour.
            celements = elementsInPnumScope(pnumScope(codePnum, 5));
          } else {
            var cscope = pnumScope(codePnum, visualDepth);
            celements = elementsInPnumScope(cscope);
          }
          entryId = paintBlockSelection(celements, visualDepth);
        } else {
          // No numbered paragraph anywhere — degrade to depth 3 (whole
          // code block).
          entryId = paintCodeBlockSelection(preEl);
          if (entryId) lastClickChain.depth = 4;
        }
      }
    } else {
      // Prose text grammar: depths 1-4 inline (char/word/sentence/line)
      // + depths 5-9 block (paragraph/list-item/section/subsection/all).
      // Re-resolve caret AFTER any unwrap — the text node may have changed.
      var pos = caretInfoAt(clickX, clickY);
      if (!pos) {
        lastClickChain = null;
        return;
      }
      var textNode = pos.node;
      var idx = pos.offset;
      var range = null;
      if (visualDepth <= 4) {
        if (visualDepth === 1)      range = buildLetterRange(textNode, idx);
        else if (visualDepth === 2) range = buildWordRange(textNode, idx);
        else if (visualDepth === 3) range = buildSentenceRange(textNode, idx);
        else                         range = buildLineRange(textNode, idx);
        if (!range) return;
        entryId = paintTextSelection(range, visualDepth, target);
      } else {
        var paraEl = paragraphFromNode(textNode);
        var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
        if (visualDepth === 6) {
          // list-item: closest <li> ancestor of the click target. If
          // the click is not in a list, paint the SAME scope as depth
          // 5 (paragraph + descendants) so length is monotonically
          // non-decreasing; the chain still advances so the next click
          // expands further.
          var li = listItemFromNode(textNode);
          if (li) {
            entryId = paintBlockSelection([li], 6);
          } else if (pnum) {
            // Re-use the paragraph-scope expansion (which may include
            // descendants when the click is on a heading-level pnum).
            var paraScope = pnumScope(pnum, 5);
            var paraElements = elementsInPnumScope(paraScope);
            entryId = paintBlockSelection(paraElements, 6);
          } else if (paraEl) {
            entryId = paintBlockSelection([paraEl], 6);
          } else {
            range = buildLineRange(textNode, idx);
            if (range) entryId = paintTextSelection(range, 4, target);
          }
        } else if (!pnum) {
          // No numbered paragraph anywhere on this click — degrade to a
          // line-range so the selection is still painted (better than
          // nothing) and freeze the chain so the next click resets.
          range = buildLineRange(textNode, idx);
          if (range) entryId = paintTextSelection(range, 4, target);
          if (entryId) lastClickChain.depth = 5;
        } else {
          var elements;
          if (visualDepth === 9) {
            elements = Array.from(document.querySelectorAll('[data-ve-prose] [data-ve-pnum]'));
          } else {
            var scope = pnumScope(pnum, visualDepth);
            elements = elementsInPnumScope(scope);
          }
          entryId = paintBlockSelection(elements, visualDepth);
        }
      }
    }
    if (entryId) {
      lastClickChain.entryId = entryId;
      lastClickChain.time = Date.now();
    }
  }

  function setupMultiClickSelection() {
    document.addEventListener('click', handleProseClick, false);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 4 — drag text selection toggles existing entries.
  //
  // Per TRDD §3.5: standard browser drag still works. On mouseup after a
  // drag, the highlighted Range is captured. If it matches an existing
  // kind:'text' entry → REMOVE (deselect). Otherwise → ADD a new entry.
  // This is the ONLY path that can DESELECT a text entry — multi-click
  // depths 1-7 always ADD.
  //
  // Scope: prose only. Drag inside .ve-math / .ve-tikz still falls
  // through to the snippet popup → POST single-shot path because those
  // payloads carry domain-specific context (LaTeX source, TikZ source,
  // chem flag) that hasn't been multi-select-converted yet.
  //
  // Match key: normalized text content + paragraph id (when both have
  // one). This avoids false collisions across paragraphs that happen to
  // share a common phrase.
  // ─────────────────────────────────────────────────────────────────────

  function findDragMatchTextEntry(text, pnum) {
    var normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return -1;
    for (var i = 0; i < veSelection.length; i++) {
      var e = veSelection[i];
      if (e.kind !== 'text') continue;
      var eText = (e.text || '').replace(/\s+/g, ' ').trim();
      if (eText !== normalized) continue;
      // If both sides have a paragraph id, they must match. If either is
      // null, accept — this lets a drag in an unnumbered paragraph still
      // toggle a previously-saved entry of the same text.
      if (e.paragraphId && pnum && e.paragraphId !== pnum) continue;
      return i;
    }
    return -1;
  }

  function paintDragTextSelection(range) {
    var paraEl = paragraphFromNode(range.startContainer)
              || paragraphFromNode(range.endContainer);
    var entryId = 'text:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    var span = document.createElement('span');
    span.className = 've-text-sel ve-text-sel--drag';
    span.setAttribute('data-ve-text-sel', entryId);
    try {
      range.surroundContents(span);
    } catch (e) {
      // Range crosses element boundaries (e.g. spans paragraphs or
      // contains inline children). extractContents + insertNode always
      // works — the visual highlight looks the same.
      var frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    var text = (span.textContent || '').replace(/\s+/g, ' ').trim();
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    var paraText = paraEl ? (paraEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null;
    veSelection.push({
      kind: 'text',
      entryId: entryId,
      text: text,
      depth: 'drag',
      paragraphId: pnum,
      paragraphText: paraText
    });
    updateSubmitButtonsState();
    return entryId;
  }

  function handleProseDragSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return false;
    var text = sel.toString();
    if (!text || text.replace(/\s+/g, '').length < 1) return false;
    var range;
    try { range = sel.getRangeAt(0); } catch (_) { return false; }
    if (!range) return false;
    var anchor = range.commonAncestorContainer;
    var anchorEl = anchor.nodeType === 3 ? anchor.parentElement : anchor;
    if (!anchorEl || !anchorEl.closest) return false;
    // Skip drags inside our own UI surfaces.
    if (anchorEl.closest('[data-ve-overlay], [data-ve-snippet-popup], button, input, textarea, select')) return false;
    // Phase 4 owns prose drag only. Math/TikZ drag stays on the popup
    // path so their domain-specific snippet payloads keep working.
    var prose = anchorEl.closest('[data-ve-prose]');
    var math = anchorEl.closest('.ve-math, [data-ve-math]');
    var tikz = anchorEl.closest('.ve-tikz, [data-ve-tikz]');
    if (!prose || math || tikz) return false;
    var paraEl = paragraphFromNode(range.startContainer)
              || paragraphFromNode(range.endContainer);
    var pnum = paraEl && paraEl.getAttribute ? paraEl.getAttribute('data-ve-pnum') : null;
    var matchIdx = findDragMatchTextEntry(text, pnum);
    if (matchIdx >= 0) {
      // Toggle off: remove the existing entry (and its DOM marker).
      var existing = veSelection[matchIdx];
      removeChainSelection(existing.entryId);
      sel.removeAllRanges();
      clearSnippetPopup();
      return true;
    }
    // Toggle on: paint + push new entry.
    paintDragTextSelection(range);
    sel.removeAllRanges();
    clearSnippetPopup();
    return true;
  }

  function setupSnippetSelection() {
    document.addEventListener('mouseup', function (ev) {
      // Defer so the selection state has settled.
      if (ev.target.closest('[data-ve-snippet-popup], [data-ve-overlay]')) return;
      setTimeout(function () {
        // Phase 4: prose drag toggles a kind:'text' entry directly. If
        // it handled the drag, the snippet popup is bypassed. Math and
        // TikZ drags still fall through to the popup → POST flow.
        if (handleProseDragSelection()) return;
        showSnippetPopup();
      }, 30);
    });
    // Phase 7: touchend mirrors mouseup. The browser sets the selection
    // after a long-press + drag; we just run the same Phase 4 → popup
    // dispatch on touchend so touch-screen users get the same toggle.
    document.addEventListener('touchend', function (ev) {
      var target = (ev.target || document.body);
      if (target.closest && target.closest('[data-ve-snippet-popup], [data-ve-overlay]')) return;
      setTimeout(function () {
        if (handleProseDragSelection()) return;
        showSnippetPopup();
      }, 30);
    }, { passive: true });
    document.addEventListener('keyup', function (ev) {
      if (ev.shiftKey || ev.key === 'Shift') return;
      // Selection via keyboard nav: same Phase 4 → popup fallback chain.
      setTimeout(function () {
        if (handleProseDragSelection()) return;
        showSnippetPopup();
      }, 30);
    });
    document.addEventListener('mousedown', function (ev) {
      if (snippetPopup && !ev.target.closest('[data-ve-snippet-popup]')) {
        clearSnippetPopup();
      }
    });
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) clearSnippetPopup();
    });
    window.addEventListener('scroll', clearSnippetPopup, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Regex visualizer + editor (vendored Bowen7/regex-vis, MIT).
  //
  // Pages opt in by writing:
  //   <div class="ve-regex" data-regex="^(\d{3})-(\d{4})$"></div>
  //
  // The runtime lazy-loads amvcp-regex.umd.js + amvcp-regex.css from the same
  // directory it itself was loaded from (parallel to KaTeX / viz.js /
  // TikZJax — except this bundle is hosted in our own scripts/ folder
  // rather than a CDN). On mount, every edit-panel commit pushes a
  // {kind:"regex-edit", original, edited, ast} entry into veSelection
  // so the agent sees the user's modified regex on submit.
  // ─────────────────────────────────────────────────────────────────────

  var regexLoading = null;

  function veRuntimeScriptBase() {
    // Where is amvcp-runtime.js sitting? Used to compute the sibling URL for
    // amvcp-regex.umd.js / amvcp-regex.css. Three sources, in order:
    //   1. window.veRuntimeBase if the page set it explicitly
    //   2. The <script src="…/amvcp-runtime.js"> tag in the DOM
    //   3. document.currentScript (only valid synchronously)
    if (window.veRuntimeBase) return window.veRuntimeBase.replace(/\/$/, '');
    var tags = document.getElementsByTagName('script');
    for (var i = tags.length - 1; i >= 0; i--) {
      var src = tags[i].src || '';
      var m = src.match(/^(.*\/)amvcp-runtime\.js(?:\?.*)?$/);
      if (m) return m[1].replace(/\/$/, '');
    }
    if (document.currentScript && document.currentScript.src) {
      var s = document.currentScript.src;
      return s.substring(0, s.lastIndexOf('/'));
    }
    // Fallback: same-origin relative path. Works when the page is opened
    // from a file:// URL with everything in the same directory.
    return '.';
  }

  function loadRegexBundle() {
    if (window.VeRegex && typeof window.VeRegex.render === 'function') {
      return Promise.resolve(window.VeRegex);
    }
    if (regexLoading) return regexLoading;
    var base = veRuntimeScriptBase();
    regexLoading = new Promise(function (resolve, reject) {
      // Inject CSS first so it's ready when React mounts.
      if (!document.querySelector('link[data-ve-regex-css]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = base + '/amvcp-regex.css';
        link.setAttribute('data-ve-regex-css', '1');
        document.head.appendChild(link);
      }
      var script = document.createElement('script');
      script.src = base + '/amvcp-regex.umd.js';
      script.async = true;
      script.onload = function () {
        if (window.VeRegex && typeof window.VeRegex.render === 'function') {
          resolve(window.VeRegex);
        } else {
          reject(new Error('amvcp-regex.umd.js loaded but window.VeRegex.render missing'));
        }
      };
      script.onerror = function () { reject(new Error('Failed to load amvcp-regex.umd.js')); };
      document.head.appendChild(script);
    });
    return regexLoading;
  }

  function pushRegexEdit(el, original, edited, ast) {
    if (original === edited) return;
    var entryId = 'regex:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    // Replace any existing edit entry for this same wrapper so the user
    // sees only the latest change per regex block — matching the way
    // multi-click chains replace rather than accumulate.
    var existing = el.getAttribute('data-ve-regex-entry-id');
    if (existing) {
      for (var i = veSelection.length - 1; i >= 0; i--) {
        if (veSelection[i].entryId === existing) { veSelection.splice(i, 1); break; }
      }
    }
    el.setAttribute('data-ve-regex-entry-id', entryId);
    veSelection.push({
      kind: 'regex-edit',
      entryId: entryId,
      regexId: el.getAttribute('data-ve-id') || null,
      original: original,
      edited: edited,
      ast: ast || null,
    });
    updateSubmitButtonsState();
  }

  function mountRegexElement(el, VeRegex) {
    if (el.__veRegexMounted) return;
    el.__veRegexMounted = true;
    var original = el.getAttribute('data-regex') || '';
    if (!el.hasAttribute('data-ve-id')) {
      el.setAttribute('data-ve-id', 've-regex-' + Math.random().toString(36).slice(2, 8));
    }
    if (!el.hasAttribute('data-ve-type')) el.setAttribute('data-ve-type', 'regex');
    if (!el.hasAttribute('data-ve-label')) el.setAttribute('data-ve-label', 'Regex: ' + original.slice(0, 60));
    try {
      VeRegex.render(el, {
        regex: original,
        onChange: function (next) {
          pushRegexEdit(el, original, next.regex, next.ast);
        },
      });
    } catch (err) {
      console.warn('[ve-runtime] regex mount failed:', err);
      el.textContent = 'Regex render failed: ' + (err && err.message ? err.message : err);
    }
  }

  function initAllRegex() {
    var elements = document.querySelectorAll('.ve-regex[data-regex], [data-ve-regex][data-regex]');
    if (!elements.length) return;
    loadRegexBundle().then(function (VeRegex) {
      for (var i = 0; i < elements.length; i++) mountRegexElement(elements[i], VeRegex);
    }).catch(function (err) {
      console.warn('[ve-runtime] regex bundle disabled:', err);
      for (var j = 0; j < elements.length; j++) {
        var src = elements[j].getAttribute('data-regex') || '';
        elements[j].textContent = 'Regex (could not load visualizer): ' + src;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 5 — table row / column handles.
  //
  // Per TRDD-7a98 §3.6: every <table> reached by the prose / table-form
  // scanner gets a hover overlay with four small handle buttons:
  //
  //   ◀ row left, ▶ row right        — toggle the entire row
  //   ▼ col top,  ▲ col bottom       — toggle the entire column
  //
  // Click toggles a kind:'row' or kind:'column' entry. Multiple rows
  // and columns are independent (no per-cell entries at intersections).
  // Clicking individual cells does NOT deselect handles — you must
  // re-click the handle.
  //
  // Tables that ARE table-form questionnaires (data-ve-type="table-form")
  // are skipped — their own row-click handlers own that surface.
  // ─────────────────────────────────────────────────────────────────────

  function tableHandlesId(table) {
    var existing = table.getAttribute('data-ve-id');
    if (existing) return existing;
    var fresh = 've-table-' + Math.random().toString(36).slice(2, 8);
    table.setAttribute('data-ve-id', fresh);
    return fresh;
  }

  function ensureColumnHighlightSheet() {
    var s = document.getElementById('__ve-table-col-styles');
    if (s) return s;
    s = document.createElement('style');
    s.id = '__ve-table-col-styles';
    document.head.appendChild(s);
    return s;
  }

  function repaintColumnHighlights() {
    // Build a single rules string from every kind:'column' entry. Each
    // selected (table, col) becomes:
    //   table[data-ve-id="X"] tr > td:nth-child(N),
    //   table[data-ve-id="X"] tr > th:nth-child(N) { background: ...; }
    var s = ensureColumnHighlightSheet();
    var lines = [];
    for (var i = 0; i < veSelection.length; i++) {
      var e = veSelection[i];
      if (e.kind !== 'column') continue;
      var sel = 'table[data-ve-id="' + e.table + '"] tr > td:nth-child(' + e.col + '),'
              + 'table[data-ve-id="' + e.table + '"] tr > th:nth-child(' + e.col + ')';
      lines.push(sel + ' { background: color-mix(in srgb, var(--ve-accent, #b8861f) 18%, transparent) !important; }');
    }
    s.textContent = lines.join('\n');
  }

  function repaintTableHandles() {
    // Walk every handle and set [data-ve-pressed] based on whether its
    // row/col index appears in veSelection for the table it belongs to.
    var handles = document.querySelectorAll('.ve-table-handle');
    for (var i = 0; i < handles.length; i++) {
      var h = handles[i];
      var tableId = h.getAttribute('data-ve-table-id');
      var kind = h.getAttribute('data-ve-handle-kind');
      var idx = parseInt(h.getAttribute('data-ve-handle-index'), 10);
      var pressed = false;
      for (var j = 0; j < veSelection.length; j++) {
        var e = veSelection[j];
        if (e.kind !== kind) continue;
        if (e.table !== tableId) continue;
        if (kind === 'row' && e.row === idx) { pressed = true; break; }
        if (kind === 'column' && e.col === idx) { pressed = true; break; }
      }
      if (pressed) h.setAttribute('data-ve-pressed', '1');
      else h.removeAttribute('data-ve-pressed');
    }
    // Row highlights via data-ve-row-selected on each <tr>.
    var allRows = document.querySelectorAll('table[data-ve-id] tbody > tr');
    for (var r = 0; r < allRows.length; r++) {
      var row = allRows[r];
      var table = row.closest('table');
      if (!table) continue;
      var tid = table.getAttribute('data-ve-id');
      var rowIdx = -1;
      var trs = table.querySelectorAll('tbody > tr');
      for (var k = 0; k < trs.length; k++) {
        if (trs[k] === row) { rowIdx = k + 1; break; }
      }
      var sel = false;
      for (var m = 0; m < veSelection.length; m++) {
        var ent = veSelection[m];
        if (ent.kind === 'row' && ent.table === tid && ent.row === rowIdx) { sel = true; break; }
      }
      if (sel) row.setAttribute('data-ve-row-selected', '1');
      else row.removeAttribute('data-ve-row-selected');
    }
    repaintColumnHighlights();
  }

  function tableHeaderTexts(table) {
    var headerRow = table.querySelector('thead > tr')
                 || table.querySelector('tr');
    if (!headerRow) return [];
    var out = [];
    for (var i = 0; i < headerRow.children.length; i++) {
      out.push((headerRow.children[i].textContent || '').replace(/\s+/g, ' ').trim());
    }
    return out;
  }

  function rowLabelFor(row) {
    // Use the first cell's text as the row label — common for matrix
    // tables where the leftmost column is a row name.
    var first = row.children[0];
    if (!first) return null;
    return (first.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || null;
  }

  function toggleRowSelection(tableId, rowIdx, label) {
    var entryId = 'row:' + tableId + ':' + rowIdx;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) {
        veSelection.splice(i, 1);
        repaintTableHandles();
        updateSubmitButtonsState();
        return;
      }
    }
    veSelection.push({
      kind: 'row',
      entryId: entryId,
      table: tableId,
      row: rowIdx,
      header: label || null
    });
    repaintTableHandles();
    updateSubmitButtonsState();
  }

  function toggleColumnSelection(tableId, colIdx, header) {
    var entryId = 'col:' + tableId + ':' + colIdx;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) {
        veSelection.splice(i, 1);
        repaintTableHandles();
        updateSubmitButtonsState();
        return;
      }
    }
    veSelection.push({
      kind: 'column',
      entryId: entryId,
      table: tableId,
      col: colIdx,
      header: header || null
    });
    repaintTableHandles();
    updateSubmitButtonsState();
  }

  function makeHandle(symbol, kind, idx, tableId, side) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 've-table-handle ve-table-handle--' + kind + '-' + side;
    btn.textContent = symbol;
    btn.setAttribute('data-ve-table-id', tableId);
    btn.setAttribute('data-ve-handle-kind', kind);
    btn.setAttribute('data-ve-handle-index', String(idx));
    btn.setAttribute('aria-label',
      (kind === 'row' ? 'Toggle row ' : 'Toggle column ') + idx);
    return btn;
  }

  function repositionHandles(table, overlay) {
    overlay.innerHTML = '';
    var tableId = table.getAttribute('data-ve-id');
    if (!tableId) return;
    var overlayRect = overlay.getBoundingClientRect();
    var bodyRows = table.querySelectorAll('tbody > tr');
    if (!bodyRows.length) bodyRows = table.querySelectorAll('tr');
    if (!bodyRows.length) return;
    var headers = tableHeaderTexts(table);
    var firstRow = bodyRows[0];
    var colCount = firstRow.children.length;

    // Row handles (◀ and ▶ at each row's vertical centre).
    for (var r = 0; r < bodyRows.length; r++) {
      var row = bodyRows[r];
      var rect = row.getBoundingClientRect();
      var top = rect.top - overlayRect.top + (rect.height / 2);
      var rowIdx = r + 1;
      var rowLabel = rowLabelFor(row);

      var leftH = makeHandle('◀', 'row', rowIdx, tableId, 'left');
      leftH.style.top = top + 'px';
      leftH.style.left = (rect.left - overlayRect.left - 6) + 'px';
      (function (idx, lbl) {
        leftH.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggleRowSelection(tableId, idx, lbl); });
      })(rowIdx, rowLabel);
      overlay.appendChild(leftH);

      var rightH = makeHandle('▶', 'row', rowIdx, tableId, 'right');
      rightH.style.top = top + 'px';
      rightH.style.left = (rect.right - overlayRect.left + 6) + 'px';
      (function (idx, lbl) {
        rightH.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggleRowSelection(tableId, idx, lbl); });
      })(rowIdx, rowLabel);
      overlay.appendChild(rightH);
    }

    // Column handles (▼ above, ▲ below) at each column's horizontal
    // centre. Anchor against the first body row (where colspan effects
    // are usually absent).
    for (var c = 0; c < colCount; c++) {
      var cell = firstRow.children[c];
      var crect = cell.getBoundingClientRect();
      var left = crect.left - overlayRect.left + (crect.width / 2);
      var colIdx = c + 1;
      var headerText = headers[c] || null;
      var lastRow = bodyRows[bodyRows.length - 1];
      var lastRect = lastRow.getBoundingClientRect();

      var topH = makeHandle('▼', 'column', colIdx, tableId, 'top');
      topH.style.left = left + 'px';
      topH.style.top = (firstRow.getBoundingClientRect().top - overlayRect.top - 6) + 'px';
      (function (idx, hdr) {
        topH.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggleColumnSelection(tableId, idx, hdr); });
      })(colIdx, headerText);
      overlay.appendChild(topH);

      var bottomH = makeHandle('▲', 'column', colIdx, tableId, 'bottom');
      bottomH.style.left = left + 'px';
      bottomH.style.top = (lastRect.bottom - overlayRect.top + 6) + 'px';
      (function (idx, hdr) {
        bottomH.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggleColumnSelection(tableId, idx, hdr); });
      })(colIdx, headerText);
      overlay.appendChild(bottomH);
    }
    repaintTableHandles();
  }

  function initTableHandles(table) {
    if (table.__veHandlesInit) return;
    if (table.matches('[data-ve-type="table-form"]')) return;
    if (table.closest('[data-ve-type="table-form"]')) return;
    table.__veHandlesInit = true;
    tableHandlesId(table);
    var wrapper = document.createElement('div');
    wrapper.className = 've-table-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    var overlay = document.createElement('div');
    overlay.className = 've-table-handles-overlay';
    wrapper.appendChild(overlay);
    repositionHandles(table, overlay);
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () { repositionHandles(table, overlay); });
      ro.observe(table);
    }
    window.addEventListener('resize', function () {
      repositionHandles(table, overlay);
    }, { passive: true });
  }

  function initAllTableHandles() {
    // Phase 5 row/column arrow handles are OBSOLETE in v4 report mode —
    // the per-element comment chips (gold floating handle on the LEFT of
    // any selected row group) are the only handle the user needs. Skip
    // every table that lives under a [data-ve-report] root so reports
    // don\'t carry redundant row-end / column-top arrows. Tables outside
    // report mode (e.g. table-form widgets in regex-vis pages) keep the
    // legacy handles so existing flows aren\'t broken.
    if (document.querySelector('[data-ve-report]')) return;
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) initTableHandles(tables[i]);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Phase 6 — code line-number gutter.
  //
  // Per TRDD-7a98 §3.7: every <pre><code> (or .ve-code) gets a left-side
  // gutter with line numbers. The numbers are clickable and draggable:
  //
  //   1 click   = toggle a kind:'codeline' for that line (single line).
  //   drag N→M  = push a kind:'codelines' for the inclusive interval.
  //   2 clicks  = select all lines as one kind:'codelines'.
  //   3 clicks  = clear every codeline / codelines for that block.
  //
  // Re-selecting an interval that overlaps existing lines ADDS — the
  // accumulated entries can be reasoned about by the agent. The single
  // exception is "drag back over already-selected lines deselects" —
  // that within-drag deselect path is deferred (a future tweak).
  //
  // Pages opt out by stamping [data-ve-no-gutter] on the <pre>.
  // ─────────────────────────────────────────────────────────────────────

  var gutterDragStart = null;    // {blockId, line, dragging, lineCount}

  function gutterBlockId(pre) {
    var existing = pre.getAttribute('data-ve-id');
    if (existing) return existing;
    var fresh = 've-code-' + Math.random().toString(36).slice(2, 8);
    pre.setAttribute('data-ve-id', fresh);
    return fresh;
  }

  function findCodeLineButton(target) {
    if (!target || !target.closest) return null;
    // Gate on `.ve-code-linenum` — only clicks/hovers on the gutter
    // cell trigger line-select. Clicks on the source text fall through
    // to the browser's native text-selection (so users can still drag-
    // to-select code text + Cmd+C copy). The linenum span is empty in
    // the DOM (its number comes from a CSS-counter ::before pseudo) so
    // the only thing it ever catches is gutter clicks.
    var num = target.closest('.ve-code-linenum');
    if (!num) return null;
    var line = num.closest('.ve-code-line');
    if (!line) return null;
    var lineNum = parseInt(line.getAttribute('data-ve-line'), 10);
    var block = line.closest('.ve-code-block');
    var blockId = block && block.getAttribute('data-ve-block-id');
    var lineCount = block && parseInt(block.getAttribute('data-ve-line-count'), 10);
    return { btn: num, line: lineNum, blockId: blockId, lineCount: lineCount };
  }

  function repaintCodeGutters() {
    // CSS-counter model: only the .ve-code-line span carries pressed
    // state — the ::before pseudo-element reads the same attribute via
    // an attribute-selector CSS rule (`.ve-code-line[data-ve-pressed]
    // ::before { background: ... }`), so one attribute toggles BOTH
    // the line-text background AND the gutter-cell background.
    var spans = document.querySelectorAll('.ve-code-line');
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      var line = parseInt(span.getAttribute('data-ve-line'), 10);
      var blockId = span.getAttribute('data-ve-block-id');
      var pressed = false;
      for (var j = 0; j < veSelection.length; j++) {
        var e = veSelection[j];
        if (e.block !== blockId) continue;
        if (e.kind === 'codeline' && e.line === line) { pressed = true; break; }
      }
      if (pressed) span.setAttribute('data-ve-pressed', '1');
      else span.removeAttribute('data-ve-pressed');
    }
    updateCommentHandles();
  }

  function updateCommentHandles() {
    // Phase 1: per-block comment handle. For each .ve-code-block that
    // has ≥1 selected code-line, render (or update) a small chat-bubble
    // button anchored to the FIRST selected line\'s vertical center.
    // Click opens openCommentDialog(blockId, [lineNums…]).
    var blocks = document.querySelectorAll('.ve-code-block');
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      var blockId = block.getAttribute('data-ve-block-id');
      // Collect selected line numbers in this block from veSelection.
      var selected = [];
      for (var k = 0; k < veSelection.length; k++) {
        var e = veSelection[k];
        if (e.kind === 'codeline' && e.block === blockId) selected.push(e.line);
      }
      var existing = block.querySelector(':scope > .ve-comment-handle');
      if (selected.length === 0) {
        if (existing) existing.remove();
        continue;
      }
      // Anchor at the FIRST selected line\'s vertical center (smallest
      // line-num). Stable: handle doesn\'t jump as more lines are added.
      selected.sort(function (a, b2) { return a - b2; });
      var firstLine = block.querySelector(
        '.ve-code-line[data-ve-line="' + selected[0] + '"]');
      if (!firstLine) {
        if (existing) existing.remove();
        continue;
      }
      var blockRect = block.getBoundingClientRect();
      var lineRect = firstLine.getBoundingClientRect();
      var topPx = lineRect.top - blockRect.top + lineRect.height / 2;
      var handle = existing;
      if (!handle) {
        handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 've-comment-handle';
        // Speech-bubble glyph fits in the 24px circle; full "Comment" text
        // would overflow. Title attribute carries the readable label.
        handle.textContent = '\u{1F4AC}';  // 💬
        handle.title = 'Open comment thread for selected lines';
        handle.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          // Reuse the existing multi-turn comment modal — sets
          // data-ve-comment-id with the current selection's
          // canonical ref so each unique line-set has its own thread,
          // then delegates to openCommentModal which handles polling,
          // decision pills, draft persistence, and connector line.
          openCommentModal(this);
        });
        block.appendChild(handle);
      }
      var commentId = 'codeline:' + blockId + ':' + selected.join(',');
      handle.setAttribute('data-ve-comment-id', commentId);
      handle.setAttribute('data-ve-block-id', blockId);
      handle.setAttribute('data-ve-lines', selected.join(','));
      handle.style.top = topPx + 'px';
    }
    // v4 generalization (TRDD-3d1570ab R3+R4): the same handle
    // pattern applies to ANY container of selectable atoms:
    //   - <tbody> with selected <tr>
    //   - <ul>/<ol> with selected <li>
    //   - <div> / <section> with selected <p data-ve-comment-id> children
    //   - .ve-gallery with selected items, .ve-dirtree with selected nodes
    // Each container gets ONE handle at the LEFT edge of the group's
    // bbox; the handle's data-ve-comment-id encodes the container id +
    // sorted child pnums so each unique selection is its own thread.
    updateGroupCommentHandles();
  }

  function updateGroupCommentHandles() {
    // For each container kind, find groups with ≥1 pressed child and
    // add a single .ve-comment-handle at the left edge of the group's
    // first-pressed-child bbox.
    var containerSelectors = [
      // tbody groups <tr>; the table itself isn't selectable but the
      // rows are. Place handle on the table (since tbody has no
      // dimensions of its own in some renderers).
      { container: 'table', child: 'tr[data-ve-pressed="1"]', kind: 'row' },
      { container: 'ul',    child: 'li[data-ve-pressed="1"]', kind: 'li' },
      { container: 'ol',    child: 'li[data-ve-pressed="1"]', kind: 'li' },
      // Paragraph groups: a section / .ve-finding-body / article with
      // selected <p data-ve-comment-id> children. `article` is needed for
      // preamble paragraphs that live above the first <section>.
      { container: 'section, .ve-finding-body, article',
        child: 'p[data-ve-comment-id][data-ve-pressed="1"]',
        kind: 'para' },
      // Blockquote groups: section/article is the canonical container so
      // the group ID resolves to the finding-id rather than a nested div.
      { container: 'section, article',
        child: 'blockquote[data-ve-comment-id][data-ve-pressed="1"]',
        kind: 'bq' },
    ];
    for (var s = 0; s < containerSelectors.length; s++) {
      var sel = containerSelectors[s];
      var containers = document.querySelectorAll(sel.container);
      for (var c = 0; c < containers.length; c++) {
        var cont = containers[c];
        var pressed = cont.querySelectorAll(':scope ' + sel.child);
        // For paragraphs we don't want CHILD `<p>` from a NESTED
        // section to count toward the parent's group — querySelectorAll
        // descends. Use Array.from + filter to keep only direct
        // descendants (or descendants whose closest matching container
        // is THIS container).
        var ownPressed = [];
        for (var pi = 0; pi < pressed.length; pi++) {
          if (pressed[pi].closest(sel.container) === cont) {
            ownPressed.push(pressed[pi]);
          }
        }
        // Reuse handle slot on the container so we update in place.
        // CRITICAL: scope by kind so a para-handle isn't mistaken for a
        // bq-handle (when para and bq selectors share the same article/
        // section container, the second pass would otherwise clobber the
        // first pass's handle).
        var existing = cont.querySelector(
          ':scope > .ve-group-handle[data-ve-group-kind="' + sel.kind + '"]'
        );
        if (ownPressed.length === 0) {
          if (existing) existing.remove();
          continue;
        }
        // Position the handle relative to the container.
        var firstChild = ownPressed[0];
        var containerCs = getComputedStyle(cont);
        if (containerCs.position === 'static') {
          cont.style.position = 'relative';
        }
        var contRect = cont.getBoundingClientRect();
        var firstRect = firstChild.getBoundingClientRect();
        var topPx = firstRect.top - contRect.top + firstRect.height / 2;
        var handle = existing;
        if (!handle) {
          handle = document.createElement('button');
          handle.type = 'button';
          handle.className = 've-comment-handle ve-group-handle';
          handle.textContent = '\u{1F4AC}';
          handle.title = 'Open comment thread for selected items';
          handle.addEventListener('click', function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            openCommentModal(this);
          });
          cont.appendChild(handle);
        }
        // Compose a stable comment-id from container + sorted child
        // pnums (or, fallback, child indices).
        var pnums = [];
        for (var pn = 0; pn < ownPressed.length; pn++) {
          var p = ownPressed[pn].getAttribute('data-ve-pnum')
                  || ownPressed[pn].getAttribute('data-ve-comment-id')
                  || String(pn);
          pnums.push(p);
        }
        pnums.sort();
        var contId = cont.id || cont.getAttribute('data-ve-finding-id') || cont.tagName.toLowerCase();
        var commentId = 'group:' + sel.kind + ':' + contId + ':' + pnums.join(',');
        handle.setAttribute('data-ve-comment-id', commentId);
        handle.setAttribute('data-ve-group-kind', sel.kind);
        handle.style.top = topPx + 'px';
      }
    }
  }

  function isCodeLineSelected(blockId, line) {
    var entryId = 'codeline:' + blockId + ':' + line;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) return true;
    }
    return false;
  }

  function applyCodeLinePaint(blockId, line, mode) {
    // mode === 'select'   → ensure line IS in veSelection (add if absent)
    // mode === 'deselect' → ensure line is NOT in veSelection (remove if present)
    var entryId = 'codeline:' + blockId + ':' + line;
    var idx = -1;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) { idx = i; break; }
    }
    var isSel = idx !== -1;
    if (mode === 'select' && !isSel) {
      veSelection.push({ kind: 'codeline', entryId: entryId, block: blockId, line: line });
    } else if (mode === 'deselect' && isSel) {
      veSelection.splice(idx, 1);
    } else {
      return;  // already in target state — no-op
    }
    repaintCodeGutters();
    updateSubmitButtonsState();
  }

  // ─── Group-selectable elements (TRDD-3d1570ab R3) ────────────────────
  // Click on <tr>, <li>, or <p data-ve-comment-id> toggles its
  // selection state. The same drag-paint mechanic from code lines
  // applies: mousedown decides the mode (select if start was unselected,
  // deselect if it was selected), then any element of the same KIND
  // entered during the drag is painted with that mode.
  // After every toggle, repaint + run updateGroupCommentHandles() so the
  // single-per-group handle appears/disappears immediately.
  function isSelectableAtom(el) {
    if (!el || !el.tagName) return null;
    var tag = el.tagName;
    if (tag === 'TR' && el.hasAttribute('data-ve-comment-id')) return 'row';
    if (tag === 'LI' && el.hasAttribute('data-ve-comment-id')) return 'li';
    if (tag === 'P'  && el.hasAttribute('data-ve-comment-id')) {
      // Markdown "fake heading" — `**Title**` on its own line —
      // renders as <p><strong>Title</strong></p>. Visually it\'s a
      // heading; user expects it NOT to be selectable, same as a real
      // <h*>. See findCommentAnchor() for the matching gate on the
      // hover/comment-handle path.
      if (isFakeHeadingParagraph(el)) return null;
      return 'para';
    }
    if (tag === 'BLOCKQUOTE' && el.hasAttribute('data-ve-comment-id')) return 'bq';
    return null;
  }

  function findSelectableAtomFromEvent(target) {
    if (!target || !target.closest) return null;
    var el = target.closest(
      'tr[data-ve-comment-id], li[data-ve-comment-id], '
      + 'p[data-ve-comment-id], blockquote[data-ve-comment-id]'
    );
    if (!el) return null;
    var kind = isSelectableAtom(el);
    if (!kind) return null;
    return { el: el, kind: kind };
  }

  function entryIdForAtom(atom) {
    var cid = atom.el.getAttribute('data-ve-comment-id') || '';
    return atom.kind + ':' + cid;
  }

  function isAtomSelected(atom) {
    var entryId = entryIdForAtom(atom);
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) return true;
    }
    return false;
  }

  function applyAtomPaint(atom, mode) {
    var entryId = entryIdForAtom(atom);
    var idx = -1;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) { idx = i; break; }
    }
    var isSel = idx !== -1;
    if (mode === 'select' && !isSel) {
      veSelection.push({
        kind: atom.kind,
        entryId: entryId,
        commentId: atom.el.getAttribute('data-ve-comment-id'),
        pnum: atom.el.getAttribute('data-ve-pnum'),
      });
      atom.el.setAttribute('data-ve-pressed', '1');
    } else if (mode === 'deselect' && isSel) {
      veSelection.splice(idx, 1);
      atom.el.removeAttribute('data-ve-pressed');
    } else {
      return;
    }
    updateGroupCommentHandles();
    if (typeof updateSubmitButtonsState === 'function') updateSubmitButtonsState();
  }

  var atomDragStart = null;

  function setupAtomSelectionEvents() {
    // Atom (row/paragraph/li) selection coexists with text selection.
    // Disambiguation:
    //   • plain CLICK (no drag, no text selected on mouseup) → toggle atom
    //   • plain DRAG (mouse moved while button held)         → browser text
    //     selection (snippet bubble handle appears on mouseup)
    //   • SHIFT+drag                                          → atom paint
    //     (multi-atom selection across consecutive rows / paragraphs)
    // Critical: do NOT preventDefault on mousedown — that would kill the
    // browser\'s native text-selection start. We defer the atom toggle to
    // mouseup, gated on "no significant movement && no text actually
    // selected by the user during this gesture".
    document.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest && ev.target.closest(
        '[data-ve-overlay], .ve-comment-modal, .ve-comment-handle, '
        + '.ve-decision-mini, .ve-decision-mini-cell, .ve-bulk-default, '
        + '[data-ve-snippet-popup]'
      )) return;
      var atom = findSelectableAtomFromEvent(ev.target);
      if (!atom) return;
      var inner = ev.target.closest('a, button, input, textarea, select, label');
      if (inner && atom.el.contains(inner)) return;
      var startWasSelected = isAtomSelected(atom);
      atomDragStart = {
        kind: atom.kind,
        atom: atom,
        startKey: entryIdForAtom(atom),
        mode: startWasSelected ? 'deselect' : 'select',
        startX: ev.clientX,
        startY: ev.clientY,
        moved: false,
        shiftPaint: !!ev.shiftKey,
        painted: {},
      };
      // SHIFT+drag → paint mode: paint the START atom immediately and
      // suppress text selection (matches the legacy multi-row paint UX).
      if (atomDragStart.shiftPaint) {
        ev.preventDefault();
        applyAtomPaint(atom, atomDragStart.mode);
        atomDragStart.painted[atomDragStart.startKey] = true;
      }
    }, true);
    document.addEventListener('mousemove', function (ev) {
      if (!atomDragStart) return;
      // Track whether the user moved the mouse meaningfully during this
      // press — used by mouseup to decide click-vs-drag.
      var dx = ev.clientX - atomDragStart.startX;
      var dy = ev.clientY - atomDragStart.startY;
      if (!atomDragStart.moved && (dx * dx + dy * dy) > 25) {  // >5px movement
        atomDragStart.moved = true;
      }
      // Atom paint only when SHIFT is held (legacy multi-row painting).
      // Without SHIFT, we let the browser do native text selection — the
      // snippet bubble handle will appear on mouseup if any text got
      // selected.
      if (!atomDragStart.shiftPaint) return;
      if (typeof document.elementFromPoint !== 'function') return;
      var hover = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!hover) return;
      var atom = findSelectableAtomFromEvent(hover);
      if (!atom || atom.kind !== atomDragStart.kind) return;
      var key = entryIdForAtom(atom);
      if (atomDragStart.painted[key]) return;
      applyAtomPaint(atom, atomDragStart.mode);
      atomDragStart.painted[key] = true;
    }, true);
    document.addEventListener('mouseup', function () {
      if (!atomDragStart) return;
      // SHIFT+drag already painted as it went — nothing to do on release.
      // Plain click (no movement, no text selected) → toggle atom.
      if (!atomDragStart.shiftPaint && !atomDragStart.moved) {
        var sel = window.getSelection();
        var hasText = sel && !sel.isCollapsed && sel.toString().length > 0;
        if (!hasText) {
          applyAtomPaint(atomDragStart.atom, atomDragStart.mode);
        }
      }
      atomDragStart = null;
    }, true);
  }

  function setupGutterEvents() {
    // Drag-paint mode determined by start line's BEFORE state (per the
    // user spec):
    //   • start line was UNSELECTED → drag SELECTS every line passed over
    //   • start line was SELECTED   → drag DESELECTS every line passed over
    // The start line itself is also painted with the same mode (so the
    // single-click case = "toggle this one line").
    document.addEventListener('mousedown', function (ev) {
      // Two-step hit-test:
      //   1. ev.target.closest('.ve-code-linenum') — works in every
      //      browser when the target IS the linenum or its descendant.
      //   2. document.elementFromPoint(clientX, clientY) — fallback for
      //      WebKit (and some other engines) where mousedown over text
      //      content rendered by a ::before pseudo-element with
      //      `user-select:none` can route the event to an ancestor
      //      (the <pre> or <code>) instead of the linenum span.
      // The fallback also covers the "mouse moved 1px between mouse
      // event creation and dispatch" race that some hardware shows.
      var hit = findCodeLineButton(ev.target);
      if (!hit && typeof document.elementFromPoint === 'function') {
        var atPoint = document.elementFromPoint(ev.clientX, ev.clientY);
        if (atPoint) hit = findCodeLineButton(atPoint);
      }
      if (!hit) return;
      ev.preventDefault();
      var startWasSelected = isCodeLineSelected(hit.blockId, hit.line);
      gutterDragStart = {
        blockId: hit.blockId,
        line: hit.line,
        lineCount: hit.lineCount,
        mode: startWasSelected ? 'deselect' : 'select',
        // Track which lines we've painted in THIS drag so the same line
        // doesn\'t flicker on/off if the cursor crosses it twice.
        painted: {}
      };
      // Paint the start line immediately (this is the single-click
      // behavior — even if no drag happens, the start line gets toggled).
      applyCodeLinePaint(hit.blockId, hit.line, gutterDragStart.mode);
      gutterDragStart.painted[hit.line] = true;
    }, true);

    // mousemove + elementFromPoint (NOT mouseover) — mouseover only fires
    // when the cursor crosses INTO a new element, so a fast drag from line
    // 1 to line 5 can leave 2/3/4 unpainted. mousemove fires on every pixel
    // step; elementFromPoint resolves the element under the cursor exactly,
    // and our `painted` map dedups so the same line never flickers.
    document.addEventListener('mousemove', function (ev) {
      if (!gutterDragStart) return;
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      var hit = findCodeLineButton(el);
      if (!hit || hit.blockId !== gutterDragStart.blockId) return;
      if (gutterDragStart.painted[hit.line]) return;  // already painted in this drag
      applyCodeLinePaint(gutterDragStart.blockId, hit.line, gutterDragStart.mode);
      gutterDragStart.painted[hit.line] = true;
    }, true);

    document.addEventListener('mouseup', function () {
      gutterDragStart = null;
    }, true);

    // Touch parity for the drag-paint mode. touchmove uses
    // elementFromPoint because touch events don't bubble like mouseover.
    document.addEventListener('touchstart', function (ev) {
      var hit = findCodeLineButton(ev.target);
      if (!hit) {
        var t0 = ev.touches && ev.touches[0];
        if (t0 && typeof document.elementFromPoint === 'function') {
          var atPoint = document.elementFromPoint(t0.clientX, t0.clientY);
          if (atPoint) hit = findCodeLineButton(atPoint);
        }
      }
      if (!hit) return;
      // preventDefault on the line button stops the long-press selection
      // popup from hijacking the gesture on iOS.
      ev.preventDefault();
      var startWasSelected = isCodeLineSelected(hit.blockId, hit.line);
      gutterDragStart = {
        blockId: hit.blockId,
        line: hit.line,
        lineCount: hit.lineCount,
        mode: startWasSelected ? 'deselect' : 'select',
        painted: {}
      };
      applyCodeLinePaint(hit.blockId, hit.line, gutterDragStart.mode);
      gutterDragStart.painted[hit.line] = true;
    }, { passive: false, capture: true });

    document.addEventListener('touchmove', function (ev) {
      if (!gutterDragStart) return;
      var t = ev.touches && ev.touches[0];
      if (!t) return;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      var hit = findCodeLineButton(el);
      if (!hit || hit.blockId !== gutterDragStart.blockId) return;
      if (gutterDragStart.painted[hit.line]) return;
      applyCodeLinePaint(gutterDragStart.blockId, hit.line, gutterDragStart.mode);
      gutterDragStart.painted[hit.line] = true;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', function () {
      gutterDragStart = null;
    }, { passive: true, capture: true });
  }


  function initCodeGutter(pre) {
    if (pre.__veGutterInit) return;
    if (pre.matches('[data-ve-no-gutter]')) return;
    if (pre.closest('[data-ve-no-gutter]')) return;
    if (pre.closest('.ve-regex')) return; // regex graph never gets a gutter
    if (pre.closest('[data-ve-overlay], [data-ve-snippet-popup]')) return;
    pre.__veGutterInit = true;
    var blockId = gutterBlockId(pre);
    var raw = pre.textContent || '';
    // Trim trailing newline so the gutter line count matches what users see.
    if (raw.length && raw.charAt(raw.length - 1) === '\n') raw = raw.slice(0, -1);
    var lineSrc = raw.split('\n');
    var lineCount = lineSrc.length;
    if (lineCount === 0) return;

    // ── Per-line container architecture ─────────────────────────────────
    // The number button + the code text live INSIDE the SAME .ve-code-line
    // span — same line-box, same baseline, automatically aligned by the
    // browser's text layout. No JS sync needed, no parallel-column drift.
    //
    // The earlier two-column design (separate <div class="ve-code-gutter">
    // sibling of the <pre>) had a fundamental limitation: gutter and pre
    // were sibling flex children, each owning its OWN line-box stack, so
    // baselines drifted apart for reasons that don't show up in any
    // single CSS property. Per-line containers eliminate the problem at
    // the architecture level.
    //
    // The "gutter column" look is generated by the CSS counter +
    // ::before pseudo-element on each .ve-code-line span (see the
    // CSS `.ve-code-line::before` rule in injectStyles). No nested
    // markup, no font sync, no baseline math.
    //
    // Only wrap when the <pre><code> contains plain text (no Shiki /
    // Sugar-High markup); otherwise we'd corrupt existing per-token
    // spans. Per-line wrapping when highlighters are present is a
    // follow-up task (the per-line span needs to wrap each highlighter
    // line, not the raw text).
    var codeEl = pre.querySelector('code') || pre;
    var canWrap = codeEl.children.length === 0;
    if (canWrap) {
      var newHTML = '';
      for (var li = 0; li < lineSrc.length; li++) {
        // Two children per line span:
        //   <span class="ve-code-linenum"></span>   ← gutter cell
        //   …source text…                          ← rest of inline content
        // The number is rendered by `.ve-code-linenum::before { content:
        // counter(ve-code-line) }` (CSS counter increments per line).
        // The linenum span is the click-detection target for drag-select
        // — clicks on the source text DON'T trigger line-select, leaving
        // text-selection-via-drag intact for code copy.
        // Per-line dynamic hanging indent. The wrap continuation must
        // appear MORE indented than the source\'s natural leading
        // whitespace so the user reads it as "this is a wrap, not a
        // new line". A fixed 2ch hanging indent fails when the source
        // already starts with ≥2ch of indent (the wrap continuation
        // would appear LEFT of the first line\'s text, looking like an
        // outdent). Solution: count the source\'s leading whitespace,
        // set --ve-code-indent = leading + 2 as a CSS var, and let the
        // CSS apply that to padding-left + text-indent so the wrap
        // continuation always sits at "source-indent + 2ch" past the
        // gutter — i.e. always 2ch past where the first line\'s
        // visible text actually begins.
        var leadingMatch = (lineSrc[li] || '').match(/^[ \t]*/);
        var leadingLen = leadingMatch ? leadingMatch[0].length : 0;
        var indentVar = leadingLen + 2;
        newHTML += '<span class="ve-code-line" data-ve-block-id="'
          + escapeHtml(blockId) + '" data-ve-line="' + (li + 1) + '"'
          + ' style="--ve-code-indent:' + indentVar + ';">'
          + '<span class="ve-code-linenum"></span>'
          + '<span class="ve-code-content">'
          + escapeHtml(lineSrc[li])
          + '</span>'
          + '</span>';
        // No literal `\n` between block spans — `display:block` on
        // .ve-code-line gives each line its own row. Adding `\n` would
        // create a SECOND break (display:block break + literal newline
        // preserved by white-space:pre = double row spacing).
      }
      codeEl.innerHTML = newHTML;
    }

    // Outer wrapper — keeps the rounded card aesthetic optional and gives
    // the click handler a stable ancestor to read block-id from.
    var wrapper = document.createElement('div');
    wrapper.className = 've-code-block';
    wrapper.setAttribute('data-ve-block-id', blockId);
    wrapper.setAttribute('data-ve-line-count', String(lineCount));
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Stash the ORIGINAL source text on the wrapper. The copy button
    // below uses this to send the user the unmodified source — never
    // the rendered HTML (which would include line numbers as visible
    // characters and would lose CSS-only soft-wrap fidelity).
    wrapper.__veSourceText = raw;

    // Copy-to-clipboard button — floating top-right of every code block.
    // Click → writes raw source to clipboard. The line numbers come from
    // a CSS `::before` counter and the wrap-indent comes from CSS
    // padding — neither is part of the actual text content, so the
    // clipboard payload is byte-identical to the source the renderer
    // received.
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 've-code-copy-btn';
    copyBtn.title = 'Copy code to clipboard';
    copyBtn.setAttribute('aria-label', 'Copy code block to clipboard');
    copyBtn.setAttribute('data-ve-overlay', '1');                  // exempts from atom-selection mousedown
    // Inline SVG clipboard icon — guaranteed to render across every
    // browser/font without depending on the system\'s monospace font
    // fallback chain (the previous ⧉ U+29C9 glyph fell through to a
    // missing-glyph box on iTerm\'s WebKit). Two SVGs cached as
    // strings so we can swap on copy success without re-creating
    // the button.
    var SVG_CLIPBOARD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
      + '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"'
      +   ' d="M5 3h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z"/>'
      + '</svg>';
    var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
      + '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
      +   ' d="M3 8.5l3.5 3.5L13 5"/>'
      + '</svg>';
    copyBtn.innerHTML = SVG_CLIPBOARD;
    copyBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var src = wrapper.__veSourceText || '';
      var done = function () {
        copyBtn.classList.add('ve-code-copy-btn--success');
        copyBtn.innerHTML = SVG_CHECK;
        setTimeout(function () {
          copyBtn.classList.remove('ve-code-copy-btn--success');
          copyBtn.innerHTML = SVG_CLIPBOARD;
        }, 1200);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = src;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); }
        catch (_) { /* nothing else to try */ }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(src).then(done).catch(fallback);
      } else {
        fallback();
      }
    });
    wrapper.appendChild(copyBtn);
  }

  function initAllCodeGutters() {
    var pres = document.querySelectorAll('pre');
    for (var i = 0; i < pres.length; i++) initCodeGutter(pres[i]);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Interactive agent reports — TRDD-eff1aa87.
  //
  // Pages rendered by render-interactive-report.py contain one or more
  //   <textarea data-ve-finding-reply data-ve-finding-id="finding-N">…</textarea>
  // controls. Typing in any of them pushes/updates a single
  //   {kind:'finding-reply', findingId, text}
  // entry into veSelection (replace-on-keystroke, debounced 350 ms).
  // Empty (after trim) → entry removed. Submit then carries the latest
  // text per finding to the agent in the standard /__ve-select POST.
  // ─────────────────────────────────────────────────────────────────────

  var findingReplyTimers = {};
  var FINDING_REPLY_DEBOUNCE_MS = 350;

  function pushOrUpdateFindingReply(findingId, text) {
    var trimmed = (text || '').replace(/\s+$/g, '').replace(/^\s+/g, '');
    var entryId = 'finding-reply:' + findingId;
    var existingIdx = -1;
    for (var i = 0; i < veSelection.length; i++) {
      if (veSelection[i].entryId === entryId) { existingIdx = i; break; }
    }
    if (!trimmed) {
      if (existingIdx >= 0) {
        veSelection.splice(existingIdx, 1);
        updateSubmitButtonsState();
      }
      return;
    }
    if (existingIdx >= 0) {
      veSelection[existingIdx].text = trimmed;
    } else {
      veSelection.push({
        kind: 'finding-reply',
        entryId: entryId,
        findingId: findingId,
        text: trimmed
      });
    }
    updateSubmitButtonsState();
  }

  function setupFindingReplyHandlers() {
    document.addEventListener('input', function (ev) {
      var t = ev.target;
      if (!t || !t.matches || !t.matches('textarea[data-ve-finding-reply]')) return;
      var fid = t.getAttribute('data-ve-finding-id');
      if (!fid) return;
      // Debounce per-finding so rapid typing doesn't thrash veSelection.
      if (findingReplyTimers[fid]) clearTimeout(findingReplyTimers[fid]);
      findingReplyTimers[fid] = setTimeout(function () {
        delete findingReplyTimers[fid];
        pushOrUpdateFindingReply(fid, t.value);
      }, FINDING_REPLY_DEBOUNCE_MS);
    });
    // F4 — deleted no-op ESC handler per js audit M6. The body was
    // empty (early-return then a comment) and the global ESC handler
    // already does the clearing via clearAllFindingReplyTextareas().
  }

  // Phase 5 of TRDD-eff1aa87 hook — extend the global ESC handler that
  // already clears veSelection so that the visible textareas also empty
  // their values. Without this, the user typed text would still appear
  // in the box even though the entry was removed from veSelection.
  function clearAllFindingReplyTextareas() {
    var areas = document.querySelectorAll('textarea[data-ve-finding-reply]');
    for (var i = 0; i < areas.length; i++) areas[i].value = '';
    // A4 — clear pending debounce timers BEFORE reassigning the map.
    // Otherwise a debounced callback firing ~350ms after ESC would
    // re-push a finding-reply entry into the just-cleared veSelection
    // ("ghost" entry that breaks the submit-button count).
    for (var k in findingReplyTimers) {
      if (Object.prototype.hasOwnProperty.call(findingReplyTimers, k)) {
        clearTimeout(findingReplyTimers[k]);
      }
    }
    findingReplyTimers = {};
  }

  // ─────────────────────────────────────────────────────────────────────
  // v2 — modal comment threads (TRDD-eff1aa87 §6).
  //
  // Hover any [data-ve-comment-id] → "💬 Comment this" pill in the
  // top-right of the element. Click the pill → modal slides in from
  // the right; main content reflows so the modal never overlaps text.
  //
  // Inside the modal: left thread index + right active-turn pane +
  // bottom ANSWER / DONE buttons. Clicking a thread row displays that
  // turn's content in the right pane (read-only). Pressing ANSWER
  // appends a new user-turn entry at the bottom of the index, focuses
  // the right-pane textarea. SEND-on-ANSWER posts the comment to
  // /__ve-comment, then the page polls /__ve-reply/<threadId> every
  // 1.5 s for the agent's reply, which lands as a new agent-turn at
  // the bottom of the index. DONE saves and closes.
  //
  // Thread state lives in localStorage so a reload preserves history.
  // ─────────────────────────────────────────────────────────────────────

  var COMMENT_POLL_MS = 1500;
  var COMMENT_LS_PREFIX = 've-comment-thread:';
  var COMMENT_POS_PREFIX = 've-comment-modal-pos:'; // per-anchor drag persistence
  var commentModalEl = null;
  var commentModalState = null; // {commentId, threadId, anchorEl, turns:[], activeTurn:N, polling:boolean, pollHandle:any}
  // ── Drag + connector state ───────────────────────────────────────────
  // Connector overlay is a single SVG appended to <body> when the modal
  // opens; the line inside is updated on every drag move + scroll +
  // resize. We cache references so updateConnectorLine() doesn't re-query
  // the DOM on every call (drag fires at the rate of mousemove).
  var connectorOverlayEl = null;
  var connectorLineEl = null;
  // TRDD-352ef46a Phase 2.5 Region 2 — thin dashed leader-line drawn
  // ON TOP of the wide tether. Points at the actual atom (or selection
  // bbox) — the wide tether is a visual fade.
  var connectorLeaderEl = null;
  var commentModalDragState = null; // {startX, startY, startLeft, startTop} during drag

  function commentSourcePath() {
    // The original source markdown path is recorded in the page's
    // <meta name="ve-source-path"> if the renderer stamped it; otherwise
    // we fall back to location.pathname so the orchestrator can still
    // map a thread to a doc on disk.
    var meta = document.querySelector('meta[name="ve-source-path"]');
    if (meta && meta.content) return meta.content;
    return location.pathname || '';
  }

  function ensureThreadId(commentId) {
    return 'thread-' + commentId + '-' + Date.now().toString(36);
  }

  function loadThreadFromStorage(commentId) {
    try {
      var raw = localStorage.getItem(COMMENT_LS_PREFIX + commentId);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function saveThreadToStorage(state) {
    try {
      localStorage.setItem(
        COMMENT_LS_PREFIX + state.commentId,
        JSON.stringify({
          commentId: state.commentId,
          threadId: state.threadId,
          turns: state.turns,
          updatedAt: Date.now()
        })
      );
    } catch (_) {}
  }

  // ── Modal-position persistence (per anchor) ───────────────────────────
  // Stored as {left:px, top:px} in viewport coordinates because the modal
  // is `position:fixed`. We persist on every drag-end and load on every
  // openCommentModal so the user's last placement for THIS specific
  // comment is the placement they get on reopen.
  function loadCommentModalPos(commentId) {
    try {
      var raw = localStorage.getItem(COMMENT_POS_PREFIX + commentId);
      if (!raw) return null;
      var pos = JSON.parse(raw);
      if (typeof pos.left !== 'number' || typeof pos.top !== 'number') return null;
      return pos;
    } catch (_) { return null; }
  }
  function saveCommentModalPos(commentId, left, top) {
    try {
      localStorage.setItem(
        COMMENT_POS_PREFIX + commentId,
        JSON.stringify({ left: left, top: top })
      );
    } catch (_) {}
  }

  function findCommentAnchor(target) {
    if (!target || !target.closest) return null;
    var anchor = target.closest('[data-ve-comment-id]');
    if (!anchor) return null;
    // Selection-model gate (per the user's spec):
    //
    //   Selectable (hover-pill OK):
    //     paragraphs (<p>), list items (<li>), table rows (<tr>),
    //     gallery items, individual file/dir nodes, prose snippets,
    //     code-line spans, diagram parts.
    //
    //   NOT selectable as wholes — hover-pill must NOT appear even if
    //   the renderer stamped a data-ve-comment-id on them:
    //     tables (<table>) — only their <tr> children are selectable
    //     lists  (<ul>/<ol>) — only their <li> children are selectable
    //     code blocks (<pre>) — only their .ve-code-line children
    //     diagrams (whole .ve-graph / svg) — only their parts
    //     galleries — only their items
    //     headings (<h1>..<h6>) — section/chapter titles are not selectable
    //     buttons / sliders / checkboxes / radio buttons — interactive
    //       widgets, not selectable
    //     file/dir trees — only individual entries are selectable.
    //
    // The runtime is the right place to enforce this because renderers
    // upstream may not know about the user's model.
    var tag = (anchor.tagName || '').toUpperCase();
    if (tag === 'TABLE' || tag === 'UL' || tag === 'OL' || tag === 'PRE'
        || tag === 'H1' || tag === 'H2' || tag === 'H3'
        || tag === 'H4' || tag === 'H5' || tag === 'H6'
        || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT') {
      return null;
    }
    // Markdown "fake heading" detection — `**Heading**` on its own line
    // renders as `<p><strong>Heading</strong></p>`, not as `<h1>`-`<h6>`.
    // The user reads it as a heading; therefore it must NOT be
    // selectable, same as a real <h*>. We detect by: the paragraph\'s
    // entire visible content is one inline-level emphasis element
    // (<strong>, <b>, <em>, <i>) with no other text nodes alongside.
    if (tag === 'P' && isFakeHeadingParagraph(anchor)) return null;
    return anchor;
  }

  // True iff the paragraph contains exactly one emphasis element
  // (<strong>/<b>/<em>/<i>) and no other visible text. Whitespace-only
  // text nodes around the element are ignored. Used to identify
  // markdown "fake headings" (`**Title**` on its own line) so they
  // get the same non-selectable treatment as real <h*> tags.
  function isFakeHeadingParagraph(p) {
    if (!p || !p.childNodes) return false;
    var emphasis = null;
    for (var i = 0; i < p.childNodes.length; i++) {
      var n = p.childNodes[i];
      if (n.nodeType === 3) {
        // Text node — must be whitespace-only.
        if ((n.textContent || '').trim() !== '') return false;
      } else if (n.nodeType === 1) {
        var tagName = (n.tagName || '').toUpperCase();
        if (tagName === 'STRONG' || tagName === 'B' || tagName === 'EM' || tagName === 'I') {
          if (emphasis) return false;  // more than one emphasis sibling → real paragraph
          emphasis = n;
        } else {
          return false;  // non-emphasis element (link, code span, image, etc.) → real paragraph
        }
      }
    }
    return !!emphasis;
  }

  // ── Hover affordance ────────────────────────────────────────────────
  var commentHoverPill = null;
  var commentHoverTarget = null;

  function showCommentHoverPill(el) {
    // REMOVED per user request — this hover-pill ("💬 Comment this")
    // duplicated the per-atom bubble handle (.ve-comment-handle).
    // Both opened the same comment modal; having two affordances on
    // the same element confused the UX. The bubble handle (gold for
    // elements, teal for text snippets) is now the SOLE entry point.
    // Function kept as a no-op so all existing call sites stay safe;
    // tests open the modal via window.__veOpenCommentModal exposed
    // from bootEverything().
    actualHideCommentHoverPill();
    if (el) commentHoverTarget = el;  // tracked for hover-debounce only
  }

  // Standard tooltip hover-bridge pattern: schedule the hide on mouseleave
  // with a small grace window, and cancel the timer when the pointer
  // re-enters either the anchor or the pill itself. Without this, the
  // mouseleave that fires the moment the pointer crosses from the
  // commentable element onto the pill clears `commentHoverTarget` and
  // hides the pill BEFORE the click event registers — making the
  // affordance physically unreachable for real users.
  var commentPillHideTimer = null;
  function cancelCommentPillHide() {
    if (commentPillHideTimer) {
      clearTimeout(commentPillHideTimer);
      commentPillHideTimer = null;
    }
  }
  function actualHideCommentHoverPill() {
    commentPillHideTimer = null;
    if (!commentHoverPill) return;
    commentHoverPill.style.opacity = '0';
    commentHoverPill.style.pointerEvents = 'none';
    commentHoverTarget = null;
  }
  function hideCommentHoverPill() {
    cancelCommentPillHide();
    actualHideCommentHoverPill();
  }
  function scheduleHideCommentHoverPill() {
    cancelCommentPillHide();
    commentPillHideTimer = setTimeout(actualHideCommentHoverPill, 180);
  }

  function setupCommentHoverHandlers() {
    document.addEventListener('mouseover', function (ev) {
      if (commentModalEl && commentModalEl.style.display !== 'none') return;
      // Mouse is over the pill (or its child) — keep current target alive
      // and cancel any pending hide so the click can land.
      if (ev.target === commentHoverPill || (commentHoverPill && commentHoverPill.contains(ev.target))) {
        cancelCommentPillHide();
        return;
      }
      var anchor = findCommentAnchor(ev.target);
      if (!anchor) return;
      // Don't trigger inside our own modal or other overlays.
      if (anchor.closest('[data-ve-overlay], .ve-comment-modal, [data-ve-snippet-popup]')) return;
      cancelCommentPillHide();
      showCommentHoverPill(anchor);
    });
    // mouseleave doesn't bubble; capture-phase + the deferred hide gives
    // the pointer 180 ms to cross the 4 px gap onto the pill.
    document.addEventListener('mouseleave', scheduleHideCommentHoverPill, true);
    // Reposition the pill on scroll instead of hiding it.
    //
    // We previously hid the pill on every scroll event with the rationale
    // that an absolute-positioned pill would otherwise drift. That is not
    // actually true — the pill's `top:` is set to `rect.top + scrollY`
    // which is a DOCUMENT-relative coordinate, so an absolute-positioned
    // element with that top stays glued to its anchor as the page scrolls.
    //
    // The hide-on-scroll caused a hard race (browser-ui-test-techniques.md
    // rule 1): a programmatic `scrollIntoView()` queues a scroll event
    // that fires AFTER the synchronous `mouse.move()` event sequence has
    // run. So the test would: scrollIntoView → mouse.move → mouseover P
    // → showCommentHoverPill (opacity:1) → queued scroll fires → hide
    // (opacity:0). The pill flashed visible then disappeared before the
    // test could read it. Real users hit the same race after any
    // programmatic scroll (anchor focus, smooth-scroll link, in-page
    // jumps from the agent-report nav) — the pill they were about to
    // click vanished underneath them.
    //
    // The new behaviour repositions the pill if it is currently visible.
    // For body-positioned bodies the recompute is a no-op (top stays the
    // same in document coords) but it correctly handles non-trivial
    // layouts where scroll changes the anchor's document position
    // (positioned ancestors, sticky containers, etc.).
    window.addEventListener('scroll', function () {
      if (
        commentHoverTarget
        && commentHoverPill
        && commentHoverPill.style.opacity === '1'
      ) {
        var rect = commentHoverTarget.getBoundingClientRect();
        var dt = rect.top + window.scrollY + 4;
        var dl = rect.right + window.scrollX - 130;
        var pos = clampToViewport(commentHoverPill, dt, dl, 8);
        commentHoverPill.style.top = pos.top + 'px';
        commentHoverPill.style.left = pos.left + 'px';
      }
      // The anchor's viewport coords change on every scroll, so the
      // connector line's anchor end has to follow it. Modal end is
      // unchanged (modal is position:fixed) but we recompute both for
      // simplicity — single function, single source of truth.
      updateConnectorLine();
    }, { passive: true });
    // Resize changes the viewport size, which both clamps the modal
    // (we re-apply its current position so any off-screen overflow is
    // corrected) and changes the SVG viewBox. We do this in capture phase
    // to beat any per-component resize handler that might rely on the
    // modal being already clamped.
    window.addEventListener('resize', function () {
      if (commentModalEl && commentModalState) {
        var r = commentModalEl.getBoundingClientRect();
        applyCommentModalPosition(r.left, r.top);
      }
      updateConnectorLine();
    }, { passive: true });
  }

  // ── Connector overlay (SVG line from anchor to modal center) ─────────
  // Pure decoration: a wide semi-transparent line drawn UNDER the modal
  // (z-index just below it) so the modal visually "covers" the segment
  // of the line that intersects it. The line is updated on every drag
  // move, scroll, and resize so it always points at the right spot.
  //
  // We use a single <svg> overlay attached to <body> (not inside the
  // modal) because:
  //   1) the modal has its own animation/transform stack — putting the
  //      SVG inside it would force the line to inherit those transforms;
  //   2) overflow:visible on the SVG and a fixed-position viewport-sized
  //      overlay let the line draw freely across the whole page without
  //      any clipping;
  //   3) pointer-events:none on the overlay means the line never
  //      intercepts clicks even where it overlaps interactive content.
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function buildConnectorOverlay() {
    if (connectorOverlayEl) return connectorOverlayEl;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 've-connector-overlay');
    svg.setAttribute('data-ve-overlay', '1');
    // viewBox uses pixel units so SVG line coordinates equal viewport px.
    // We resize the viewBox on window resize to keep that invariant.
    svg.setAttribute('viewBox',
      '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
    svg.setAttribute('preserveAspectRatio', 'none');
    var line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 've-connector-line');
    line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
    line.setAttribute('x2', '0'); line.setAttribute('y2', '0');
    svg.appendChild(line);
    // TRDD-352ef46a Phase 2.5 Region 2 — leader line.
    var leader = document.createElementNS(SVG_NS, 'line');
    leader.setAttribute('class', 've-leader-line');
    leader.setAttribute('x1', '0'); leader.setAttribute('y1', '0');
    leader.setAttribute('x2', '0'); leader.setAttribute('y2', '0');
    svg.appendChild(leader);
    document.body.appendChild(svg);
    connectorOverlayEl = svg;
    connectorLineEl = line;
    connectorLeaderEl = leader;
    return svg;
  }

  function teardownConnectorOverlay() {
    if (connectorOverlayEl && connectorOverlayEl.parentNode) {
      connectorOverlayEl.parentNode.removeChild(connectorOverlayEl);
    }
    connectorOverlayEl = null;
    connectorLineEl = null;
    connectorLeaderEl = null;
  }

  // TRDD-352ef46a Phase 2.5 Region 2 — anchor resolution.
  // The modal anchor is sometimes the .ve-comment-handle button (a
  // tiny 24px circle on the left edge of the atom) — drawing the
  // leader line to a 24px circle is much less informative than
  // drawing it to the actual atom the handle belongs to. Walk up to
  // the parent atom in that case.
  function resolveLeaderTarget(anchor) {
    if (!anchor || !anchor.classList) return anchor;
    if (anchor.classList.contains('ve-comment-handle')
        || anchor.classList.contains('ve-group-handle')) {
      var p = anchor.parentElement;
      while (p && p !== document.body) {
        if (p.hasAttribute && p.hasAttribute('data-ve-comment-id')) return p;
        if (p.tagName === 'TR' || p.tagName === 'LI' || p.tagName === 'P'
            || p.tagName === 'BLOCKQUOTE' || p.tagName === 'TABLE'
            || (p.classList && p.classList.contains('ve-code-block'))) return p;
        p = p.parentElement;
      }
      return anchor.parentElement || anchor;
    }
    return anchor;
  }

  // Closest point on rect `rect` (viewport coords) to point (px, py).
  // Used to land the leader line on the modal edge nearest the
  // selection (NOT the modal center, which would force the dashed
  // line through the modal body).
  function closestPointOnRect(rect, px, py) {
    var x = Math.max(rect.left, Math.min(px, rect.right));
    var y = Math.max(rect.top, Math.min(py, rect.bottom));
    return { x: x, y: y };
  }

  // Recompute and apply the line's endpoints using the current anchor
  // and modal positions in viewport coordinates. Safe to call when the
  // modal is closed (no-op) — that simplifies the scroll/resize
  // listeners which fire regardless of modal state.
  function updateConnectorLine() {
    if (!commentModalState || !commentModalEl || !connectorLineEl) return;
    var anchor = commentModalState.anchorEl;
    if (!anchor) return;
    // TRDD-352ef46a Phase 2.5 Region 2 — pick the actual atom (not the
    // handle button) for the leader line so it lands where the user
    // expects.
    var leaderTarget = resolveLeaderTarget(anchor);
    var aRect = anchor.getBoundingClientRect();
    var lRect = leaderTarget ? leaderTarget.getBoundingClientRect() : aRect;
    var mRect = commentModalEl.getBoundingClientRect();
    var ax = aRect.left + aRect.width / 2;
    var ay = aRect.top + aRect.height / 2;
    var mx = mRect.left + mRect.width / 2;
    var my = mRect.top + mRect.height / 2;
    connectorLineEl.setAttribute('x1', String(ax));
    connectorLineEl.setAttribute('y1', String(ay));
    connectorLineEl.setAttribute('x2', String(mx));
    connectorLineEl.setAttribute('y2', String(my));
    var headerEl = commentModalEl.querySelector('.ve-comment-modal-header');
    var headerH = headerEl ? headerEl.getBoundingClientRect().height : 44;
    var stroke = Math.min(44, Math.max(8, headerH));
    connectorLineEl.setAttribute('stroke-width', String(stroke));
    // ── Leader line ──────────────────────────────────────────────────
    // Endpoint A: the leader-target bbox center (the actual atom).
    // Endpoint B: closest point on modal rectangle to A — the dashed
    // line lands on the modal edge nearest the selection.
    if (connectorLeaderEl) {
      var lcx = lRect.left + lRect.width / 2;
      var lcy = lRect.top + lRect.height / 2;
      var modalEdge = closestPointOnRect(mRect, lcx, lcy);
      connectorLeaderEl.setAttribute('x1', String(lcx));
      connectorLeaderEl.setAttribute('y1', String(lcy));
      connectorLeaderEl.setAttribute('x2', String(modalEdge.x));
      connectorLeaderEl.setAttribute('y2', String(modalEdge.y));
    }
    if (connectorOverlayEl) {
      connectorOverlayEl.setAttribute('viewBox',
        '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
    }
  }

  // ── Modal-position helpers ───────────────────────────────────────────
  // Minimum gap between the modal and any viewport edge. Used by both the
  // drag clamp (applyCommentModalPosition) and the initial-open clamp
  // (positionCommentModalDefault) so a narrow viewport — e.g. 375 px on
  // iPhone SE — never sees the modal overflow the screen and clip the
  // DONE button. 8 px matches the CSS gutter in the .ve-comment-modal
  // width:min(460px, calc(100vw - 16px)) rule (16 px = 8 px on each side).
  var MODAL_VIEWPORT_GUTTER = 8;

  // Apply a viewport-px (left, top) position to the modal. Clamps so the
  // modal never lands off-screen — the user is dragging from the header,
  // so we keep at least the full modal visible (no off-screen drag) AND
  // we keep an 8 px gutter on every edge so the modal corners aren't
  // flush against the viewport.
  function applyCommentModalPosition(left, top) {
    if (!commentModalEl) return;
    var rect = commentModalEl.getBoundingClientRect();
    var w = rect.width || 460;
    var h = rect.height || 200;
    var g = MODAL_VIEWPORT_GUTTER;
    // maxLeft/maxTop can go negative on viewports SMALLER than the modal —
    // in that case clamping to a negative value would push the modal
    // partially off-screen on the LEFT/TOP edge. Math.max(g, ...) keeps
    // the modal pinned to the gutter on the leading edge instead. The
    // CSS width:min(460px, calc(100vw - 16px)) rule guarantees the modal
    // is never wider than the viewport, so this clamp can always succeed.
    var maxLeft = Math.max(g, window.innerWidth - w - g);
    var maxTop = Math.max(g, window.innerHeight - h - g);
    var clampedLeft = Math.min(Math.max(g, left), maxLeft);
    var clampedTop = Math.min(Math.max(g, top), maxTop);
    commentModalEl.style.left = clampedLeft + 'px';
    commentModalEl.style.top = clampedTop + 'px';
    commentModalEl.style.right = 'auto';
  }

  // Default-position the modal next to its anchor on first open.
  // We prefer the right side of the anchor (vertical center) so the
  // connector line is short, but fall back to the left or top if the
  // anchor is near the viewport edge. The final applyCommentModalPosition
  // call clamps left/top into [gutter, viewport - size - gutter] so even
  // pathologically narrow viewports (375 px) never see the modal overflow.
  function positionCommentModalDefault(anchor) {
    if (!commentModalEl || !anchor) return;
    var aRect = anchor.getBoundingClientRect();
    // Force a layout pass so the modal has a real width/height before
    // we read it (the modal was just toggled to display:flex).
    var mRect = commentModalEl.getBoundingClientRect();
    var w = mRect.width || 460;
    var h = mRect.height || Math.min(window.innerHeight - 48, 600);
    var gap = 24;
    var g = MODAL_VIEWPORT_GUTTER;
    // Try right of anchor.
    var left = aRect.right + gap;
    // If that goes off-screen, try left of anchor; if that's also off,
    // pin to the right viewport edge with a 24px gap from the edge (the
    // applyCommentModalPosition clamp below enforces the 8px hard gutter
    // if even the 24px gap can't be honoured on a tiny viewport).
    if (left + w > window.innerWidth - g) {
      left = aRect.left - w - gap;
      if (left < g) left = Math.max(g, window.innerWidth - w - 24);
    }
    var top = aRect.top + aRect.height / 2 - h / 2;
    // applyCommentModalPosition is the single source of truth for the
    // clamping math — it enforces left ∈ [g, viewportW - w - g] and
    // top ∈ [g, viewportH - h - g] with a graceful fallback when the
    // viewport is smaller than the modal.
    applyCommentModalPosition(left, top);
  }

  // ── Drag handlers ────────────────────────────────────────────────────
  // mousedown on the header starts a drag; we attach mousemove/mouseup
  // to the document (not the header) so the drag continues even when the
  // pointer briefly leaves the header during a fast drag.
  function handleHeaderMouseDown(ev) {
    // Only start a drag on a primary-button press. Right-click and
    // middle-click are ignored so context menu still works.
    if (ev.button !== 0) return;
    // Don't start a drag if the user clicked the close button — let the
    // button's click handler run untouched.
    if (ev.target && ev.target.closest && ev.target.closest('.ve-comment-modal-close')) return;
    if (!commentModalEl) return;
    var rect = commentModalEl.getBoundingClientRect();
    commentModalDragState = {
      startX: ev.clientX,
      startY: ev.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
    document.addEventListener('mousemove', handleDocumentMouseMove, true);
    document.addEventListener('mouseup', handleDocumentMouseUp, true);
    // Prevent text-selection while dragging (the user-select:none on
    // the header takes care of header text, but a fast drag can drift
    // outside the header before we cancel selection).
    ev.preventDefault();
  }

  function handleDocumentMouseMove(ev) {
    if (!commentModalDragState) return;
    var dx = ev.clientX - commentModalDragState.startX;
    var dy = ev.clientY - commentModalDragState.startY;
    applyCommentModalPosition(
      commentModalDragState.startLeft + dx,
      commentModalDragState.startTop + dy
    );
    updateConnectorLine();
  }

  function handleDocumentMouseUp() {
    if (!commentModalDragState) return;
    commentModalDragState = null;
    document.removeEventListener('mousemove', handleDocumentMouseMove, true);
    document.removeEventListener('mouseup', handleDocumentMouseUp, true);
    // Persist the new position keyed by THIS comment's id so reopening
    // the same comment lands the modal where the user left it.
    if (commentModalEl && commentModalState) {
      var r = commentModalEl.getBoundingClientRect();
      saveCommentModalPos(commentModalState.commentId, r.left, r.top);
    }
  }

  // ── Modal ───────────────────────────────────────────────────────────
  function buildCommentModal() {
    var m = document.createElement('div');
    m.className = 've-comment-modal';
    m.setAttribute('data-ve-overlay', '1');
    m.style.display = 'none';
    m.innerHTML = ''
      + '<div class="ve-comment-modal-inner">'
      + '  <div class="ve-comment-modal-header">'
      + '    <span class="ve-comment-modal-title">Comment thread</span>'
      + '    <button type="button" class="ve-comment-modal-close" aria-label="Close">×</button>'
      + '  </div>'
      + '  <div class="ve-comment-modal-body">'
      + '    <ul class="ve-comment-thread-index"></ul>'
      + '    <div class="ve-comment-active-pane">'
      + '      <div class="ve-comment-active-meta"></div>'
      + '      <div class="ve-comment-active-content"></div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="ve-comment-modal-footer">'
      + '    <button type="button" class="ve-comment-answer">ANSWER</button>'
      + '    <button type="button" class="ve-comment-done">DONE</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(m);
    m.querySelector('.ve-comment-modal-close').addEventListener('click', closeCommentModal);
    m.querySelector('.ve-comment-done').addEventListener('click', closeCommentModal);
    m.querySelector('.ve-comment-answer').addEventListener('click', handleAnswerButton);
    // Wire the drag handle. We attach to the header (not the title span)
    // so the entire header strip — including padding — acts as the
    // grab affordance.
    m.querySelector('.ve-comment-modal-header').addEventListener('mousedown', handleHeaderMouseDown);
    return m;
  }

  function openCommentModal(anchor) {
    // TRDD-352ef46a Phase 2.5 Region 2 — capture the current text
    // selection BEFORE anything that might steal focus. The snippet
    // path also sets preservedSnippetRange separately (different
    // restore semantics); this generic capture is purely visual — it
    // keeps a ::highlight band painted over the selection while the
    // modal is open so the user can SEE what they're commenting on.
    // No-op if there is no live selection.
    captureModalSelection();
    hideCommentHoverPill();
    if (!commentModalEl) commentModalEl = buildCommentModal();
    var commentId = anchor.getAttribute('data-ve-comment-id');
    if (!commentId) return;
    // Restore thread from storage if present, else start a fresh one.
    var stored = loadThreadFromStorage(commentId);
    var turns;
    var threadId;
    if (stored) {
      turns = stored.turns || [];
      threadId = stored.threadId;
    } else {
      turns = [];
      threadId = ensureThreadId(commentId);
    }
    commentModalState = {
      commentId: commentId,
      threadId: threadId,
      anchorEl: anchor,
      turns: turns,
      activeTurn: turns.length > 0 ? turns.length : 1, // last turn or first new
      polling: false,
      pollHandle: null,
      lastSeen: turns.length
    };
    if (turns.length === 0) {
      // Fresh thread — pre-create an empty user turn so the right pane
      // is editable from the start.
      commentModalState.turns.push({ turn: 1, role: 'user', text: '', at: null, draft: true });
      commentModalState.activeTurn = 1;
    }
    document.body.setAttribute('data-ve-comment-modal-open', '1');
    anchor.setAttribute('data-ve-comment-active', '1');
    commentModalEl.style.display = 'flex';
    renderCommentModal();
    // Position the modal: a stored per-anchor position wins; otherwise
    // the default-position helper places it next to the anchor. We do
    // this in a microtask to give the renderer one tick to apply the
    // display:flex flip so getBoundingClientRect returns real numbers.
    requestAnimationFrame(function () {
      var stored = loadCommentModalPos(commentId);
      if (stored) {
        applyCommentModalPosition(stored.left, stored.top);
      } else {
        positionCommentModalDefault(anchor);
      }
      // Build the connector overlay and draw the initial line. We do
      // this AFTER positioning the modal so the line endpoints are
      // already correct on first paint (no visible "snap" frame).
      buildConnectorOverlay();
      updateConnectorLine();
    });
    // If the user closed the modal while an agent reply was still
    // outstanding, the pending placeholder is now in storage but the
    // poll loop was torn down on close. Restart it for the first
    // pending turn so a reply that landed on disk while the modal
    // was closed renders as soon as the modal reopens.
    for (var i = 0; i < commentModalState.turns.length; i++) {
      var pendingTurn = commentModalState.turns[i];
      if (pendingTurn.role === 'agent' && pendingTurn.pending) {
        pollForCommentReply(pendingTurn);
        break;
      }
    }
    // Scroll the anchor into view if the reflow would push it off-screen.
    // After scroll completes, the anchor's viewport coords change, so
    // we re-draw the connector — otherwise it would point at the
    // anchor's old position until the next mouse move.
    requestAnimationFrame(function () {
      anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
      // The smooth scroll dispatches scroll events as it animates, and
      // our scroll listener (registered in setupCommentHoverHandlers)
      // calls updateConnectorLine on every one — so the line tracks
      // the anchor across the whole scroll animation.
    });
  }

  function closeCommentModal() {
    if (!commentModalState) return;
    saveCurrentDraftIfPresent();
    saveThreadToStorage(commentModalState);
    if (commentModalState.pollHandle) {
      clearTimeout(commentModalState.pollHandle);
      commentModalState.pollHandle = null;
    }
    if (commentModalState.anchorEl) {
      commentModalState.anchorEl.removeAttribute('data-ve-comment-active');
      // Snippet-anchor divs are transient placeholders created in
      // showSnippetPopup() to give the connector line a real bbox to
      // draw to (over the selected text). When the modal closes:
      //   1. Remove the transient anchor div so it doesn\'t leak.
      //   2. Restore the original text selection so the user can
      //      re-comment on the same text without re-dragging. The
      //      visual highlight (::highlight) stays applied while the
      //      modal is open and is cleared here on close.
      if (commentModalState.anchorEl.hasAttribute('data-ve-snippet-anchor')) {
        if (commentModalState.anchorEl.parentNode) {
          commentModalState.anchorEl.parentNode.removeChild(commentModalState.anchorEl);
        }
        // Restore the user\'s text selection so they can comment again
        // on the same text. The ::selection paint comes back; the
        // ::highlight overlay we used during the modal is no longer
        // needed (selection paint covers the same bbox).
        clearPreservedSnippetHighlight();
        restorePreservedSelection();
      }
    }
    // If a drag was in progress when the close was triggered (e.g. user
    // clicked × mid-drag), tear it down explicitly — otherwise the
    // document-level mousemove/mouseup listeners would leak and the
    // next mousedown on the page would re-arm a phantom drag.
    if (commentModalDragState) {
      commentModalDragState = null;
      document.removeEventListener('mousemove', handleDocumentMouseMove, true);
      document.removeEventListener('mouseup', handleDocumentMouseUp, true);
    }
    teardownConnectorOverlay();
    // TRDD-352ef46a Phase 2.5 Region 2 — drop the generic modal-open
    // highlight band. (The snippet-specific highlight was already
    // cleared inside the snippet branch above, before
    // restorePreservedSelection.)
    releaseModalSelection();
    var threadIdAtClose = commentModalState.threadId;
    commentModalState = null;
    document.body.removeAttribute('data-ve-comment-modal-open');
    if (commentModalEl) commentModalEl.style.display = 'none';
    // TRDD-7a2dab03 §3.7 — close-modal is the natural sync point at
    // which to write the per-page decision summary. POST after we've
    // torn the modal down so a slow network does not block the UI
    // repaint. The summary is best-effort: if the POST fails, the
    // JSONL trail is still on disk, so the orchestrator can always
    // reconstruct the same totals. postPageSummary is a no-op on a
    // page with no findings (e.g. a slide deck).
    postPageSummary(threadIdAtClose);
  }

  function postPageSummary(modalThreadId) {
    var fs = document.querySelectorAll('fieldset.ve-decision');
    if (!fs.length) return;
    var body = buildSummaryPayload();
    body.threadId = modalThreadId || ('summary-page-' + Date.now().toString(36));
    fetch('/__ve-comment-summary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(function (e) {
      console.warn('[ve-decision] summary POST failed:', e);
    });
  }

  function renderCommentModal() {
    if (!commentModalEl || !commentModalState) return;
    var index = commentModalEl.querySelector('.ve-comment-thread-index');
    var active = commentModalEl.querySelector('.ve-comment-active-content');
    var meta = commentModalEl.querySelector('.ve-comment-active-meta');
    var title = commentModalEl.querySelector('.ve-comment-modal-title');
    title.textContent = 'Comment · #' + commentModalState.commentId;

    // Index — one row per turn.
    index.innerHTML = '';
    commentModalState.turns.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 've-comment-thread-row';
      li.setAttribute('data-turn', String(t.turn));
      li.setAttribute('data-role', t.role);
      var label = (commentModalState.activeTurn === t.turn ? '> ' : '   ')
                + t.turn + ': ' + t.role
                + (commentModalState.activeTurn === t.turn ? ' <' : '');
      li.textContent = label;
      if (commentModalState.activeTurn === t.turn) li.setAttribute('data-active', '1');
      li.addEventListener('click', function () {
        saveCurrentDraftIfPresent();
        commentModalState.activeTurn = t.turn;
        renderCommentModal();
      });
      index.appendChild(li);
    });

    // Auto-scroll the index so the active row is visible.
    var activeRow = index.querySelector('[data-active]');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });

    // Active pane.
    var activeT = commentModalState.turns.find(function (t) { return t.turn === commentModalState.activeTurn; });
    if (!activeT) {
      active.innerHTML = '';
      meta.textContent = '';
      return;
    }
    meta.textContent = (activeT.role === 'user' ? 'YOU' : 'CLAUDE')
      + ' · turn ' + activeT.turn
      + (activeT.at ? ' · ' + new Date(activeT.at).toLocaleTimeString() : '');
    if (activeT.role === 'user' && activeT.draft) {
      active.innerHTML = '';
      var ta = document.createElement('textarea');
      ta.className = 've-comment-active-textarea';
      ta.placeholder = 'Write your comment here…';
      ta.value = activeT.text || '';
      ta.addEventListener('input', function () {
        activeT.text = ta.value;
        // Re-evaluate ANSWER's enabled state on each keystroke so the
        // button enables/disables in lockstep with the user's typing.
        updateAnswerButtonState();
      });
      active.appendChild(ta);
      // Focus + put cursor at the end.
      requestAnimationFrame(function () {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = ta.value.length;
      });
    } else if (activeT.role === 'agent' && activeT.pending) {
      active.innerHTML = '<div class="ve-comment-pending">Waiting for Claude to reply…</div>';
    } else {
      active.innerHTML = '';
      var pre = document.createElement('div');
      pre.className = 've-comment-active-text';
      pre.textContent = activeT.text || '';
      active.appendChild(pre);
    }
    updateAnswerButtonState();
  }

  function updateAnswerButtonState() {
    if (!commentModalEl || !commentModalState) return;
    var btn = commentModalEl.querySelector('.ve-comment-answer');
    var activeT = commentModalState.turns.find(function (t) { return t.turn === commentModalState.activeTurn; });
    // ANSWER does TWO things depending on context:
    //   1) Active turn is a user-draft with text → submit it (POST + poll for reply).
    //   2) Active turn is an agent reply (or any past turn) → start a new user turn at the bottom.
    if (!activeT) { btn.disabled = true; return; }
    if (activeT.role === 'user' && activeT.draft) {
      btn.disabled = !(activeT.text || '').trim();
      btn.textContent = 'ANSWER';
    } else if (activeT.role === 'agent' && activeT.pending) {
      btn.disabled = true;
      btn.textContent = '…waiting…';
    } else {
      btn.disabled = false;
      btn.textContent = 'ANSWER';
    }
  }

  function saveCurrentDraftIfPresent() {
    if (!commentModalState) return;
    var ta = commentModalEl && commentModalEl.querySelector('.ve-comment-active-textarea');
    if (!ta) return;
    var activeT = commentModalState.turns.find(function (t) { return t.turn === commentModalState.activeTurn; });
    if (activeT && activeT.draft) activeT.text = ta.value;
  }

  function handleAnswerButton() {
    if (!commentModalState) return;
    saveCurrentDraftIfPresent();
    var activeT = commentModalState.turns.find(function (t) { return t.turn === commentModalState.activeTurn; });
    if (!activeT) return;
    if (activeT.role === 'user' && activeT.draft) {
      // SEND case: post the comment, then poll for the reply.
      var text = (activeT.text || '').trim();
      if (!text) return;
      activeT.text = text;
      activeT.draft = false;
      activeT.at = Date.now();
      // Insert a "pending" agent turn so the user sees something is happening.
      var pending = { turn: activeT.turn + 1, role: 'agent', text: '', at: null, pending: true };
      commentModalState.turns.push(pending);
      commentModalState.activeTurn = pending.turn;
      // Persist BOTH the committed user turn AND the pending agent turn
      // in one save. If the user refreshes between SEND and the reply
      // arriving, the pending placeholder is restored on next open and
      // openCommentModal restarts the poll loop for it.
      saveThreadToStorage(commentModalState);
      renderCommentModal();
      postCommentAndPoll(activeT, pending);
      return;
    }
    // ELSE: append a brand-new user-draft turn at the bottom.
    var nextTurn = (commentModalState.turns[commentModalState.turns.length - 1].turn) + 1;
    var draft = { turn: nextTurn, role: 'user', text: '', at: null, draft: true };
    commentModalState.turns.push(draft);
    commentModalState.activeTurn = nextTurn;
    saveThreadToStorage(commentModalState);
    renderCommentModal();
  }

  function postCommentAndPoll(userTurn, pendingAgentTurn) {
    // TRDD-7a2dab03 — when the comment is anchored inside a finding, also
    // ship the finding's current decision pill state. The orchestrator's
    // reply loop reads the `decision` field FIRST (see /amvcp-respond-to-
    // comment) and uses it to choose the reply template (approve / reject
    // / skip). If the anchor is outside any finding (e.g. in the preamble)
    // there is no finding-scoped decision, so the field is omitted.
    var anchorEl = commentModalState && commentModalState.anchorEl;
    var findingAnchorId = findingAnchorIdFromElement(anchorEl);
    var payload = {
      commentId: commentModalState.commentId,
      threadId: commentModalState.threadId,
      sourcePath: commentSourcePath(),
      turn: userTurn.turn,
      text: userTurn.text
    };
    if (findingAnchorId) {
      payload.anchorId = findingAnchorId;
      payload.decision = currentDecisionFor(findingAnchorId);
    }
    // A6 — bail out of polling if the POST itself failed, and surface
    // the error in the pending agent turn so the user knows the
    // comment never reached the server. Previously the .catch() ate
    // the error and .then() kept polling forever, leaving the user
    // staring at "Waiting for Claude to reply…" with no feedback.
    fetch('/__ve-comment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r || !r.ok) throw new Error('POST status ' + (r && r.status));
      return true;
    }).catch(function (e) {
      console.warn('[ve-comment] POST failed:', e);
      // Replace the pending placeholder with a visible failure so the
      // user can retype/retry instead of waiting indefinitely.
      if (commentModalState && pendingAgentTurn) {
        var idx = commentModalState.turns.indexOf(pendingAgentTurn);
        if (idx >= 0) {
          commentModalState.turns[idx] = {
            turn: pendingAgentTurn.turn,
            role: 'agent',
            text: '[Failed to send — check connection and try again]',
            failed: true,
            at: Date.now()
          };
          saveThreadToStorage(commentModalState);
          renderCommentModal();
        }
      }
      return false;
    }).then(function (ok) {
      if (ok) pollForCommentReply(pendingAgentTurn);
    });
  }

  function pollForCommentReply(pendingAgentTurn) {
    if (!commentModalState) return;
    // Capture the threadId at poll-start. A fetch in flight when the user
    // closes the modal (or opens a different anchor's thread) MUST NOT
    // mutate the new state — otherwise indexOf(pendingAgentTurn) crashes
    // on a null commentModalState, or worse, the new thread's turns get
    // a stray agent reply slotted in. The threadId guard makes every
    // async continuation self-detect a stale closure and bail.
    var ownThreadId = commentModalState.threadId;
    // F8 — exponential backoff. On consecutive 5xx / network failures
    // the delay grows 1.5 → 3 → 6 → 12 → 24 → 30 (cap), so a permanently
    // down server doesn't hammer 1.5 s polls forever. After
    // MAX_FAILS consecutive failures we surface a visible error in
    // the pending UI and stop polling. Successful responses (including
    // 204 "no reply yet") reset the counter and the delay.
    var POLL_MIN_MS = COMMENT_POLL_MS;
    var POLL_MAX_MS = 30000;
    var MAX_FAILS = 6;
    var currentDelay = POLL_MIN_MS;
    var consecutiveFails = 0;
    function noteSuccess() {
      consecutiveFails = 0;
      currentDelay = POLL_MIN_MS;
    }
    function noteFailure() {
      consecutiveFails++;
      currentDelay = Math.min(Math.round(currentDelay * 2), POLL_MAX_MS);
    }
    function showPollFailure() {
      if (!commentModalState || !pendingAgentTurn) return;
      var idx = commentModalState.turns.indexOf(pendingAgentTurn);
      if (idx < 0) return;
      commentModalState.turns[idx] = {
        turn: pendingAgentTurn.turn,
        role: 'agent',
        text: '[Polling failed after ' + MAX_FAILS + ' attempts — server unreachable]',
        failed: true,
        at: Date.now()
      };
      saveThreadToStorage(commentModalState);
      renderCommentModal();
    }
    function isStale() {
      return !commentModalState || commentModalState.threadId !== ownThreadId;
    }
    function once() {
      if (isStale()) return;
      var url = '/__ve-reply/' + encodeURIComponent(commentModalState.threadId)
        + '?since=' + (pendingAgentTurn.turn - 1);
      fetch(url, { headers: { 'accept': 'application/json' } })
        .then(function (r) {
          if (isStale()) return null;
          if (r.status === 204) {
            // Server is alive but no reply yet — counts as success.
            noteSuccess();
            schedule();
            return null;
          }
          if (!r.ok) {
            console.warn('[ve-comment] poll error', r.status);
            noteFailure();
            if (consecutiveFails >= MAX_FAILS) {
              showPollFailure();
              return null;
            }
            schedule();
            return null;
          }
          return r.json();
        })
        .then(function (data) {
          if (!data) return;
          if (isStale()) return;
          // Expect {turn, role:"agent", text}. Replace the pending entry.
          var idx = commentModalState.turns.indexOf(pendingAgentTurn);
          if (idx < 0) return;
          commentModalState.turns[idx] = {
            turn: data.turn || pendingAgentTurn.turn,
            role: 'agent',
            text: data.text || '',
            at: Date.now()
          };
          commentModalState.activeTurn = commentModalState.turns[idx].turn;
          saveThreadToStorage(commentModalState);
          renderCommentModal();
          noteSuccess();
        })
        .catch(function () {
          if (isStale()) return;
          noteFailure();
          if (consecutiveFails >= MAX_FAILS) {
            showPollFailure();
            return;
          }
          schedule();
        });
    }
    function schedule() {
      if (isStale()) return;
      // Defensive: clear any prior pending handle on this state field
      // before reassigning so a re-entrant call cannot race two pollers.
      if (commentModalState.pollHandle) {
        try { clearTimeout(commentModalState.pollHandle); } catch (_) {}
      }
      commentModalState.pollHandle = setTimeout(once, currentDelay);
    }
    once();
  }

  // ─────────────────────────────────────────────────────────────────────
  // v3 — per-element decision pill (TRDD-7a2dab03).
  //
  // Each finding section carries a `<fieldset class="ve-decision">` with
  // three radios (approve/reject/skip; default skip). Flipping the radio
  // emits a "decision-only" turn into the queue. A normal comment turn
  // (typed in the modal + ANSWER) carries the current decision for the
  // enclosing finding as an extra field.
  //
  // State is per-page (closure-scoped Maps). The runtime is loaded once
  // per page so there is exactly one instance — but we still scope the
  // state by anchorId in a Map (NOT a module-level mutable array) so
  // multiple findings in the same page can't accidentally share state.
  // See ~/.claude/rules/browser-ui-test-techniques.md §3 for the rule.
  // ─────────────────────────────────────────────────────────────────────

  // anchorId → "approve"|"reject"|"skip" (current toggle-derived state).
  var decisionState = new Map();
  // anchorId → "approve"|"reject"|"skip" — last decision actually written
  // to the queue. Used to suppress idempotent decision-only writes per
  // TRDD-7a2dab03 §3.3 ("clicking the same toggle twice is a no-op").
  var lastWrittenDecision = new Map();
  // anchorId → threadId for decision-only turns. Each finding gets its
  // own thread so all of a finding's decision flips append to the same
  // JSONL file. Minted lazily on first write.
  var decisionThreads = new Map();
  // anchorId → next turn number for decision-only writes.
  var decisionTurns = new Map();

  function findingAnchorIdFromElement(el) {
    // Walk up to the nearest `<section data-ve-finding-id="...">` and
    // map its findingId to the canonical anchorId form `ve-{findingId}`.
    if (!el || !el.closest) return null;
    var sec = el.closest('section[data-ve-finding-id]');
    if (!sec) return null;
    var fid = sec.getAttribute('data-ve-finding-id');
    if (!fid) return null;
    return 've-' + fid;
  }

  function currentDecisionFor(anchorId) {
    if (!anchorId) return 'skip';
    if (decisionState.has(anchorId)) return decisionState.get(anchorId);
    // Derive from the two hidden checkbox inputs' DOM state — these are
    // sr-only inside the v3.2 segmented control but kept so existing
    // tests + DOM consumers (e.g. /amvcp-respond-to-comment) can read
    // the decision exactly the way they used to.
    var fs = document.querySelector(
      'fieldset.ve-decision[data-anchor-id="' + anchorId.replace(/"/g, '\\"') + '"]'
    );
    if (fs) {
      var ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
      var rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
      if (ap && ap.checked) return 'approve';
      if (rj && rj.checked) return 'reject';
    }
    return 'skip';
  }

  function ensureDecisionThreadId(anchorId) {
    if (decisionThreads.has(anchorId)) return decisionThreads.get(anchorId);
    // The `_TID_OK` charset on the server is `[A-Za-z0-9._-]+`; the
    // anchorId is `ve-<findingId>` and the findingId is hyphen/dot/digit
    // only, so concatenation is safe. Append a base36 timestamp so two
    // pages opened in parallel don't collide on the same JSONL file.
    var tid = 'decision-' + anchorId + '-' + Date.now().toString(36);
    decisionThreads.set(anchorId, tid);
    return tid;
  }

  function nextDecisionTurn(anchorId) {
    var n = (decisionTurns.get(anchorId) || 0) + 1;
    decisionTurns.set(anchorId, n);
    return n;
  }

  async function postDecisionTurn(anchorId, decision, text) {
    // Atomic POST: one JSONL line per call. Idempotent suppression is
    // applied by the caller (recordDecision) — this function always
    // writes.
    var threadId = ensureDecisionThreadId(anchorId);
    var payload = {
      commentId: anchorId,    // for back-compat with v2 readers
      threadId: threadId,
      sourcePath: commentSourcePath(),
      anchorId: anchorId,
      turn: nextDecisionTurn(anchorId),
      text: text || '',
      decision: decision
    };
    return fetch('/__ve-comment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function (e) {
      console.warn('[ve-decision] POST failed:', e);
    });
  }

  function recordDecision(anchorId, decision) {
    if (!anchorId) return;
    if (decision !== 'approve' && decision !== 'reject' && decision !== 'skip') {
      // Defence in depth — the renderer only emits the closed enum, but
      // any DOM tampering would otherwise leak garbage into the queue.
      console.warn('[ve-decision] refusing unknown decision:', decision);
      return;
    }
    decisionState.set(anchorId, decision);
    // Idempotent: if the previous decision-only write for this anchor
    // had the same value AND empty text, skip. (TRDD-7a2dab03 §3.3.)
    var prev = lastWrittenDecision.get(anchorId);
    if (prev === decision) return;
    lastWrittenDecision.set(anchorId, decision);
    postDecisionTurn(anchorId, decision, '');
  }

  // ── v3.2 segmented control (TRDD-7a2dab03) ───────────────────────
  //
  // Apply a decision to a fieldset: sync the hidden checkbox inputs (so
  // currentDecisionFor + existing test selectors still observe the right
  // state) AND repaint the three .ve-segment buttons' aria-checked. This
  // is the single place that mutates DOM — every code path (segment
  // click, keyboard arrow, legacy checkbox-change dispatched by tests)
  // funnels through here so the visual + ARIA + hidden-input states can
  // never disagree.
  function applyDecisionToFieldset(fs, decision) {
    if (!fs) return;
    var ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
    var rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
    if (ap) ap.checked = (decision === 'approve');
    if (rj) rj.checked = (decision === 'reject');
    var segs = fs.querySelectorAll('.ve-segment[data-decision]');
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      var v = seg.getAttribute('data-decision');
      var on = (v === decision);
      seg.setAttribute('aria-checked', on ? 'true' : 'false');
      // Roving tabindex: only the active segment is in the tab order
      // (standard radiogroup pattern — Tab enters the group on the
      // selected option, then Arrow keys move between segments).
      seg.setAttribute('tabindex', on ? '0' : '-1');
    }
  }

  function wireDecisionPills() {
    // Three delegated listeners on document so we survive DOM changes
    // and never double-bind:
    //
    //   click  → segment-button click (the visible affordance)
    //   keydown → ArrowLeft/Right (cycle), Home/End (jump), Space/Enter
    //             (activate focused segment)
    //   change → legacy hidden-checkbox change events. Tests synthesise
    //             these directly to bypass label-click flakiness in the
    //             dev-browser sandbox; we honour them by deriving the
    //             new tri-state from the post-change checkbox values
    //             and re-applying via applyDecisionToFieldset() so the
    //             visible segments + ARIA stay in sync.
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var seg = t.closest('.ve-segment[data-decision]');
      if (!seg) return;
      var fs = seg.closest('fieldset.ve-decision');
      if (!fs) return;
      var anchorId = fs.getAttribute('data-anchor-id');
      if (!anchorId) return;
      var which = seg.getAttribute('data-decision');
      if (which !== 'skip' && which !== 'approve' && which !== 'reject') return;
      ev.preventDefault();
      applyDecisionToFieldset(fs, which);
      seg.focus();
      recordDecision(anchorId, which);
    });

    document.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if (!t || !t.classList || !t.classList.contains('ve-segment')) return;
      var fs = t.closest('fieldset.ve-decision');
      if (!fs) return;
      var anchorId = fs.getAttribute('data-anchor-id');
      if (!anchorId) return;
      var segs = Array.prototype.slice.call(fs.querySelectorAll('.ve-segment[data-decision]'));
      var idx = segs.indexOf(t);
      if (idx < 0) return;
      var nextIdx = -1;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        nextIdx = (idx + 1) % segs.length;
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        nextIdx = (idx - 1 + segs.length) % segs.length;
      } else if (ev.key === 'Home') {
        nextIdx = 0;
      } else if (ev.key === 'End') {
        nextIdx = segs.length - 1;
      } else if (ev.key === ' ' || ev.key === 'Enter') {
        // Activate the focused segment (no movement). Standard radiogroup
        // pattern — focus alone does not commit the choice; activation does.
        var which = t.getAttribute('data-decision');
        if (which === 'skip' || which === 'approve' || which === 'reject') {
          ev.preventDefault();
          applyDecisionToFieldset(fs, which);
          recordDecision(anchorId, which);
        }
        return;
      } else {
        return;
      }
      ev.preventDefault();
      var nextSeg = segs[nextIdx];
      var nextDecision = nextSeg.getAttribute('data-decision');
      // Standard radiogroup behaviour: arrow-key navigation MOVES the
      // selection (commit-on-move), not just focus. Both screen readers
      // and the wire format end up consistent because applyDecision
      // mutates the hidden inputs too.
      applyDecisionToFieldset(fs, nextDecision);
      nextSeg.focus();
      recordDecision(anchorId, nextDecision);
    });

    document.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || t.type !== 'checkbox') return;
      var fs = t.closest && t.closest('fieldset.ve-decision');
      if (!fs) return;
      var anchorId = fs.getAttribute('data-anchor-id');
      if (!anchorId) return;
      var which = t.getAttribute('data-decision');
      if (which !== 'approve' && which !== 'reject') return;
      // Tests synthesise change events that may leave both inputs checked
      // (the test wants to prove the runtime ENFORCES mutex). Derive the
      // intended new state from `which` + `t.checked` and let
      // applyDecisionToFieldset() repair both inputs + the visible segments.
      var newDecision;
      if (t.checked) {
        // Whichever checkbox just became checked wins; the other is cleared.
        newDecision = which;
      } else {
        // The user cleared this one — fall back to whatever the other
        // input still says (covers tests that explicitly clear one to
        // reach "skip"). If both are now off, decision = skip.
        var other = fs.querySelector(
          'input[type="checkbox"][data-decision="' +
            (which === 'approve' ? 'reject' : 'approve') +
            '"]'
        );
        if (other && other.checked) newDecision = (which === 'approve' ? 'reject' : 'approve');
        else newDecision = 'skip';
      }
      applyDecisionToFieldset(fs, newDecision);
      recordDecision(anchorId, newDecision);
    });

    // Initial paint — set aria-checked + roving tabindex on every
    // pre-existing fieldset so the keyboard story works on first load
    // even before any user interaction. Honours pre-checked inputs
    // (e.g. demo HTML files that hand-author `<input ... checked>`).
    var fieldsets = document.querySelectorAll('fieldset.ve-decision[data-anchor-id]');
    for (var i = 0; i < fieldsets.length; i++) {
      var fs = fieldsets[i];
      var ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
      var rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
      var initial = 'skip';
      if (ap && ap.checked) initial = 'approve';
      else if (rj && rj.checked) initial = 'reject';
      applyDecisionToFieldset(fs, initial);
    }
  }

  function buildSummaryPayload() {
    // TRDD-7a2dab03 §3.7 — collect every finding's current decision into
    // one summary object the orchestrator can `cat` instead of replaying
    // every JSONL turn.
    var decisions = {};
    var totals = { approve: 0, reject: 0, skip: 0, total: 0 };
    var fieldsets = document.querySelectorAll('fieldset.ve-decision[data-anchor-id]');
    for (var i = 0; i < fieldsets.length; i++) {
      var fs = fieldsets[i];
      var aid = fs.getAttribute('data-anchor-id');
      if (!aid) continue;
      var d = currentDecisionFor(aid);
      decisions[aid] = d;
      if (totals.hasOwnProperty(d)) totals[d] += 1;
      totals.total += 1;
    }
    return { decisions: decisions, totals: totals, closedAt: Date.now() };
  }

  function setupCommentModal() {
    setupCommentHoverHandlers();
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && commentModalState) {
        ev.preventDefault();
        closeCommentModal();
      }
    });
  }

  function detectAndStampTheme() {
    // Set data-ve-theme="light"|"dark" on <html> based on the page's
    // body background luminance, so :root[data-ve-theme="light"] CSS
    // overrides can mirror the brightness/overlay defaults. The
    // selection/hover language is the same on both themes (lift the
    // row, tint the bg, glow the accent) — only the DIRECTION flips,
    // and that direction lives entirely in CSS variables.
    //
    // Skip if the page already set the attribute explicitly (escape
    // hatch for pages that bg-detect wrong, e.g. CSS-only theme
    // toggles, transparent body, or split light/dark sections).
    var html = document.documentElement;
    if (html.hasAttribute('data-ve-theme')) return;
    var bg = document.body ? getComputedStyle(document.body).backgroundColor : '';
    var m = bg.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3 || (m.length >= 4 && +m[3] === 0)) {
      // Transparent / unset body bg → browser default (typically white)
      // shows through. Stamp "light" so the brightness/overlay direction
      // matches what the user actually sees.
      html.setAttribute('data-ve-theme', 'light');
      return;
    }
    // sRGB perceptual luminance (Rec. 709 weights). >0.5 = light page.
    var lum = (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255;
    html.setAttribute('data-ve-theme', lum > 0.5 ? 'light' : 'dark');
  }

  // ═══════════════════════════════════════════════════════════════════
  // DESIGN.md realtime style engine — runtime integration (Phase 1b,
  // TRDD-352ef46a).
  //
  // Phase 1a shipped scripts/amvcp-designmd.js — the parser + token
  // mapper, exposed as window.amvcpDesignMd. Phase 1b wires it into the
  // page: apply a DESIGN.md's tokens on boot, hot-swap a replacement
  // DESIGN.md live, and surface every token in a floating
  // style-controller pad generated from amvcpDesignMd.tokenSchema.
  //
  // Phase 1b ONLY ADDS the engine — it does NOT migrate the runtime's
  // existing --ve-* component CSS to consume the --vc-* tokens (that is
  // Phase 1c). The --vc-* custom properties land on :root so any future
  // CSS, and any host page, can read them immediately.
  // ═══════════════════════════════════════════════════════════════════

  // The built-in default DESIGN.md. Used when the page embeds no
  // <script type="text/design-md"> block, so the --vc-* tokens always
  // resolve to a coherent, schema-valid set. It is a neutral warm
  // scheme (the same "Heritage" palette the Phase-1a sample uses) with
  // both light and dark fully defined — never one inferred from the
  // other. Authored inline (no string-concat tricks) so it is trivially
  // diffable and obviously valid against the canonical v1 schema.
  var DEFAULT_DESIGNMD_TEXT = [
    '---',
    'designmd_version: 1',
    'meta:',
    '  name: "Visual Communicator default"',
    '  default_theme: light',
    'colors:',
    // The light theme is a warm parchment scheme. `surface` and
    // `on-accent` use a warm near-white (NOT pure #ffffff) — the
    // anti-AI-slop gate flags literal pure #fff/#000, so the plugin's
    // own default theme must avoid them to pass its own gate.
    '  light:',
    '    canvas:          "#faf6ee"',
    '    surface:         "#fffefb"',
    '    surface-raised:  "#fffdf8"',
    '    surface-sunken:  "#f1ece0"',
    '    content:         "#1f1a14"',
    '    content-muted:   "#5b5343"',
    '    content-subtle:  "#8a8170"',
    '    border:          "#e3dcc9"',
    '    border-strong:   "#c9bfa3"',
    '    accent:          "#b8861f"',
    '    on-accent:       "#fffdf9"',
    '    success:         "#3a6b5c"',
    '    warning:         "#a8791f"',
    '    danger:          "#a84a32"',
    '    info:            "#3464a8"',
    '  dark:',
    '    canvas:          "#16130d"',
    '    surface:         "#211c14"',
    '    surface-raised:  "#2a241a"',
    '    surface-sunken:  "#0f0d09"',
    '    content:         "#f3ecdd"',
    '    content-muted:   "#b8ad96"',
    '    content-subtle:  "#857c68"',
    '    border:          "#3a3325"',
    '    border-strong:   "#564c36"',
    '    accent:          "#e0aa3e"',
    '    on-accent:       "#16130d"',
    '    success:         "#6fae9b"',
    '    warning:         "#d8aa54"',
    '    danger:          "#dd8068"',
    '    info:            "#6f9bd8"',
    'typography:',
    '  font-heading: "Playfair Display, Georgia, serif"',
    // font-body is a system-font stack (NOT Inter). The anti-AI-slop
    // gate flags Inter/Roboto/Open Sans/Lato/Nunito as the *primary*
    // family of a body/heading stack; the plugin's own default theme
    // must pass its own gate, so the body face leads with system-ui.
    '  font-body:    "system-ui, -apple-system, Segoe UI, sans-serif"',
    '  font-mono:    "JetBrains Mono, ui-monospace, monospace"',
    '  scale:        [12, 14, 16, 20, 24, 32, 48]',
    '  weight-regular: 400',
    '  weight-medium:  500',
    '  weight-bold:    700',
    '  line-height:    1.55',
    'spacing:',
    '  scale: [4, 8, 12, 16, 24, 32, 48, 64]',
    'radius:',
    '  none: 0',
    '  sm:   4',
    '  md:   8',
    '  lg:   12',
    '  xl:   16',
    '  full: 9999',
    // elevation — the 5-level MD3 key+ambient scale plus the zero-blur
    // hairline `shadow-border` ring (a shadow used AS a border so it
    // adds no layout box). Updated in lockstep with the engine's
    // ELEVATION_KEYS expansion — the old shadow-sm/md/lg keys would now
    // be rejected as unknown.
    'elevation:',
    '  shadow-0: "none"',
    '  shadow-1: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"',
    '  shadow-2: "0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.12)"',
    '  shadow-3: "0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.14)"',
    '  shadow-4: "0 8px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.18)"',
    '  shadow-border: "0 0 0 1px rgba(0,0,0,0.08)"',
    // motion — the full 8-duration + 8-easing library so downstream
    // animation consumers always have the tokens. Durations are ms.
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
    '  easing-linear:           "linear"',
    // z-index — the 9-level stacking scale. Optional group; included so
    // scaffolded modals/overlays can key off --vc-z-* without fallbacks.
    'z-index:',
    '  behind:   -1',
    '  base:     0',
    '  raised:   10',
    '  dropdown: 100',
    '  sticky:   200',
    '  overlay:  300',
    '  modal:    400',
    '  toast:    500',
    '  tooltip:  600',
    // code — the 12-token syntax-highlight palette, derived from the
    // warm "Heritage" semantic colors so code coloring stays brand-
    // coherent. Optional group; consumed by the code-block skill.
    'code:',
    '  keyword:     "#a8791f"',
    '  string:      "#3a6b5c"',
    '  number:      "#a84a32"',
    '  comment:     "#8a8170"',
    '  type:        "#3464a8"',
    '  variable:    "#1f1a14"',
    '  function:    "#7a5c9e"',
    '  constant:    "#b8861f"',
    '  operator:    "#5b5343"',
    '  punctuation: "#8a8170"',
    '  tag:         "#a84a32"',
    '  attribute:   "#3a6b5c"',
    '---',
    '',
    '# Visual Communicator — default design system',
    '',
    'This is the runtime built-in default DESIGN.md. A page that embeds',
    'its own `<script type="text/design-md">` block overrides it; loading',
    'a replacement through the style-controller pad replaces it live.'
  ].join('\n');

  // Engine state. `designmd` is the currently-applied parsed DESIGN.md
  // (or null until the engine boots); `theme` is the theme its --vc-*
  // colors were last resolved for. A hot-swap or a theme toggle mutates
  // these in lockstep with what is actually on :root, so there is one
  // source of truth — never a copy that can drift.
  var veDesignMdState = {
    designmd: null,
    theme: 'light'
  };

  // The DOM id of the floating style-controller panel and its toggle.
  var VE_DESIGNMD_PANEL_ID = 've-designmd-panel';
  var VE_DESIGNMD_TOGGLE_ID = 've-designmd-toggle';

  // Resolve the active theme the same way the rest of the runtime does:
  // detectAndStampTheme() has already stamped data-ve-theme on <html>.
  // Falls back to the DESIGN.md's own default_theme, then to 'light'.
  function veDesignMdResolveTheme(designmd) {
    var stamped = document.documentElement.getAttribute('data-ve-theme');
    if (stamped === 'light' || stamped === 'dark') {
      return stamped;
    }
    if (designmd && designmd.meta &&
        (designmd.meta.default_theme === 'light' ||
         designmd.meta.default_theme === 'dark')) {
      return designmd.meta.default_theme;
    }
    return 'light';
  }

  // Apply a parsed designmd's tokens to :root for `theme`, and record
  // both in veDesignMdState. This is the ONLY place --vc-* values are
  // pushed to the document, so state and DOM never diverge. Throws if
  // the engine module is missing — fail-fast, no silent no-op.
  function veDesignMdApply(designmd, theme) {
    var api = window.amvcpDesignMd;
    if (!api || typeof api.resolveTokens !== 'function' ||
        typeof api.applyTokens !== 'function') {
      throw new Error(
        'DESIGN.md engine: window.amvcpDesignMd is not loaded — the ' +
        'amvcp-designmd.js script must load before amvcp-runtime.js'
      );
    }
    var map = api.resolveTokens(designmd, theme);
    api.applyTokens(map, document.documentElement);
    veDesignMdState.designmd = designmd;
    veDesignMdState.theme = theme;
  }

  // Parse `text` as a DESIGN.md and apply it for the current active
  // theme. Returns the parser result { ok, designmd, errors }. On a
  // parse failure NOTHING is applied (fail-fast — no partial token set);
  // the caller surfaces `errors`.
  function veDesignMdLoadText(text) {
    var api = window.amvcpDesignMd;
    if (!api || typeof api.parseDesignMd !== 'function') {
      return {
        ok: false,
        designmd: null,
        errors: ['DESIGN.md engine: window.amvcpDesignMd is not loaded']
      };
    }
    var res = api.parseDesignMd(text);
    if (!res.ok) {
      // Fail loud: do not touch :root with a half-valid token set.
      return res;
    }
    var theme = veDesignMdResolveTheme(res.designmd);
    veDesignMdApply(res.designmd, theme);
    return res;
  }

  // Read the embedded DESIGN.md, if the page ships one. The block is
  // <script type="text/design-md" id="ve-designmd">…</script> — a
  // non-executable script element, so its raw text is the DESIGN.md.
  //
  // The script-element wrapper inevitably introduces a leading newline
  // (the `---` fence cannot sit on the same line as the opening `>` and
  // stay readable) and usually a trailing newline before `</script>`.
  // Neither is part of the DESIGN.md payload — its content runs from
  // the `---` fence to the end of the prose — so the outer whitespace
  // is trimmed here. parseDesignMd is fail-fast about a `---` not being
  // on line 1, so this trim is what makes a hand-authored embedded
  // block parse at all.
  function veDesignMdReadEmbedded() {
    var el = document.getElementById('ve-designmd');
    if (el && el.getAttribute('type') === 'text/design-md') {
      return String(el.textContent || '').replace(/^\s+/, '').replace(/\s+$/, '');
    }
    // Tolerate the id being on a differently-typed node only when the
    // type explicitly marks it as DESIGN.md — otherwise ignore it.
    var any = document.querySelector('script[type="text/design-md"]');
    if (any) {
      return String(any.textContent || '').replace(/^\s+/, '').replace(/\s+$/, '');
    }
    return null;
  }

  // Boot the DESIGN.md engine: apply the page's embedded DESIGN.md, or
  // the built-in default when there is none, so --vc-* always resolve.
  // A malformed embedded block is a hard error — the runtime logs it
  // and falls back to the built-in default so the page still has a
  // coherent token set, but it never silently applies a partial one.
  function bootDesignMdEngine() {
    if (!window.amvcpDesignMd) {
      // The engine script was not shipped with the page. Phase 1b
      // depends on it; without it --vc-* simply will not exist. Log
      // once and continue — the runtime's existing --ve-* CSS is
      // unaffected (Phase 1c is what makes --vc-* load-bearing).
      if (window.console && console.warn) {
        console.warn(
          'DESIGN.md engine: amvcp-designmd.js not loaded — ' +
          '--vc-* tokens will be absent. Ship it before amvcp-runtime.js.'
        );
      }
      return;
    }
    var embedded = veDesignMdReadEmbedded();
    if (embedded !== null) {
      var res = veDesignMdLoadText(embedded);
      if (res.ok) {
        return;
      }
      // Embedded block is malformed — surface it, then fall through to
      // the built-in default so the page is not left token-less.
      if (window.console && console.error) {
        console.error(
          'DESIGN.md engine: embedded <script type="text/design-md"> ' +
          'is malformed — using the built-in default instead:\n  ' +
          (res.errors || []).join('\n  ')
        );
      }
    }
    var def = veDesignMdLoadText(DEFAULT_DESIGNMD_TEXT);
    if (!def.ok && window.console && console.error) {
      // The built-in default is authored against the schema, so this
      // branch should be unreachable — log loudly if it ever is not.
      console.error(
        'DESIGN.md engine: built-in default failed to parse:\n  ' +
        (def.errors || []).join('\n  ')
      );
    }
  }

  // ─── DESIGN.md token-path bridge ─────────────────────────────────────
  //
  // amvcpDesignMd.tokenSchema describes WHAT tokens exist; to read or
  // write a token's VALUE in the in-memory designmd object we need the
  // path into designmd.tokens. The schema's group + key determine it.
  // `index` is meaningful only for indexed (scale-array) tokens.
  //
  // Returns an array of path segments, or null when the group is one
  // the bridge does not handle (defensive — keeps an unexpected schema
  // entry from throwing).
  function veDesignMdTokenPath(entry, theme, index) {
    var g = entry.group;
    if (g === 'color') {
      return ['colors', theme, entry.key];
    }
    if (g === 'typography') {
      if (entry.indexed) {
        return ['typography', 'scale', index];
      }
      return ['typography', entry.key];
    }
    if (g === 'spacing') {
      return ['spacing', 'scale', index];
    }
    if (g === 'radius') {
      return ['radius', entry.key];
    }
    if (g === 'elevation' || g === 'motion') {
      return [g, entry.key];
    }
    return null;
  }

  // Read the raw value at a path in designmd.tokens. Returns undefined
  // when any segment is missing (an optional token that the loaded
  // DESIGN.md did not declare).
  function veDesignMdReadPath(designmd, path) {
    if (!designmd || !designmd.tokens || !path) {
      return undefined;
    }
    var cur = designmd.tokens;
    var i;
    for (i = 0; i < path.length; i++) {
      if (cur == null || typeof cur !== 'object') {
        return undefined;
      }
      cur = cur[path[i]];
    }
    return cur;
  }

  // Write a raw value at a path in designmd.tokens. Only writes when
  // every parent segment already exists — the controller never invents
  // a token group that the loaded DESIGN.md omitted. Returns true on a
  // successful write.
  function veDesignMdWritePath(designmd, path, value) {
    if (!designmd || !designmd.tokens || !path || path.length === 0) {
      return false;
    }
    var cur = designmd.tokens;
    var i;
    for (i = 0; i < path.length - 1; i++) {
      if (cur == null || typeof cur[path[i]] !== 'object') {
        return false;
      }
      cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = value;
    return true;
  }

  // Coerce a control's string input back to the type the schema (and
  // the YAML serializer) expect: numeric tokens become real numbers so
  // serializeDesignMd emits them bare; everything else stays a string.
  function veDesignMdCoerceValue(entry, rawString) {
    if (entry.type === 'number' || entry.type === 'length') {
      var n = parseFloat(rawString);
      if (isNaN(n) || !isFinite(n)) {
        return null;
      }
      return n;
    }
    return String(rawString);
  }

  // ─── Theme-library presets ───────────────────────────────────────────
  //
  // The pad ships an ALWAYS-AVAILABLE built-in library of curated
  // DESIGN.md presets so a fresh page (with only the default DESIGN.md
  // applied) can hot-swap to any of them with one click — no extra
  // script tag required. When `window.amvcpTokens` IS loaded (i.e. the
  // page also pulls in scripts/amvcp-tokens.js) its richer 12-entry
  // PRESETS map is folded in alongside the built-ins, deduplicated by
  // key. Both sources produce a `{ key, label, text }` row that the
  // drawer renders.
  //
  // The built-ins are complete dual-theme DESIGN.md texts authored
  // inline (NOT generated from a delta of the runtime default) so they
  // stand alone and ALL pass the engine's parseDesignMd validation —
  // every required group, both light and dark themes. Adding a new
  // built-in is a self-contained edit here; nothing else has to change.
  function veDesignMdBuiltInPresets() {
    return [
      {
        key: 'heritage',
        label: 'Heritage',
        text: DEFAULT_DESIGNMD_TEXT
      },
      {
        key: 'cyber-neon',
        label: 'Cyber-Neon',
        text: veDesignMdBuildPreset({
          name: 'Cyber-Neon',
          defaultTheme: 'dark',
          light: {
            canvas: '#f1f4f7', surface: '#fbfdff',
            surfaceRaised: '#ffffff', surfaceSunken: '#e3eaf1',
            content: '#0d1521', contentMuted: '#3a4a5e',
            contentSubtle: '#73849b', border: '#cdd6e2',
            borderStrong: '#9babbf', accent: '#0a8f7a',
            onAccent: '#fbfdff', success: '#218a4f',
            warning: '#b97a14', danger: '#b8392b',
            info: '#1e6ed8'
          },
          dark: {
            canvas: '#070b14', surface: '#0d1521',
            surfaceRaised: '#15202f', surfaceSunken: '#03060a',
            content: '#dff6f1', contentMuted: '#7fb1a8',
            contentSubtle: '#5b8079', border: '#1e3845',
            borderStrong: '#2e5468', accent: '#00ffcc',
            onAccent: '#070b14', success: '#52e0a8',
            warning: '#ffd34a', danger: '#ff7864',
            info: '#5acdff'
          },
          fontHeading: 'JetBrains Mono, ui-monospace, monospace',
          fontBody: 'JetBrains Mono, ui-monospace, monospace'
        })
      },
      {
        key: 'modernist',
        label: 'Modernist',
        text: veDesignMdBuildPreset({
          name: 'Modernist',
          defaultTheme: 'light',
          light: {
            canvas: '#f4f4f4', surface: '#fafafa',
            surfaceRaised: '#ffffff', surfaceSunken: '#e9e9e9',
            content: '#0a0a0a', contentMuted: '#555555',
            contentSubtle: '#8a8a8a', border: '#cfcfcf',
            borderStrong: '#9a9a9a', accent: '#d62828',
            onAccent: '#fafafa', success: '#1d6e3a',
            warning: '#e6a000', danger: '#d62828',
            info: '#1e3a8a'
          },
          dark: {
            canvas: '#101010', surface: '#1a1a1a',
            surfaceRaised: '#242424', surfaceSunken: '#080808',
            content: '#f0f0f0', contentMuted: '#b0b0b0',
            contentSubtle: '#7a7a7a', border: '#333333',
            borderStrong: '#525252', accent: '#ff5252',
            onAccent: '#101010', success: '#5ec98a',
            warning: '#ffc94a', danger: '#ff5252',
            info: '#7a99ff'
          },
          fontHeading: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontBody: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          radiusSm: 2, radiusMd: 3, radiusLg: 4, radiusXl: 6
        })
      },
      {
        key: 'editorial',
        label: 'Editorial',
        text: veDesignMdBuildPreset({
          name: 'Editorial',
          defaultTheme: 'light',
          light: {
            canvas: '#fcfaf6', surface: '#fffdfa',
            surfaceRaised: '#fffefb', surfaceSunken: '#f1ede4',
            content: '#1a1714', contentMuted: '#52473d',
            contentSubtle: '#86796b', border: '#dcd3c4',
            borderStrong: '#b9ad97', accent: '#a6192e',
            onAccent: '#fffdfa', success: '#2c6147',
            warning: '#a07314', danger: '#a6192e',
            info: '#264a8a'
          },
          dark: {
            canvas: '#161310', surface: '#211d18',
            surfaceRaised: '#2c261f', surfaceSunken: '#0e0c09',
            content: '#f1ebdf', contentMuted: '#b3a99a',
            contentSubtle: '#807769', border: '#3a3327',
            borderStrong: '#5a5040', accent: '#e8526b',
            onAccent: '#161310', success: '#6cb898',
            warning: '#e6b860', danger: '#e8526b',
            info: '#7da3e0'
          },
          fontHeading: 'Iowan Old Style, Georgia, serif',
          fontBody: 'system-ui, -apple-system, Segoe UI, sans-serif'
        })
      },
      {
        key: 'blueprint',
        label: 'Blueprint',
        text: veDesignMdBuildPreset({
          name: 'Blueprint',
          defaultTheme: 'dark',
          // Drafting-paper light: pale blue-white background with cyan
          // ink. Drafting-blueprint dark: deep navy paper with white/
          // cyan grid (architect's classic). Accent = drafting cyan.
          light: {
            canvas: '#e8f0fb', surface: '#f3f7fd',
            surfaceRaised: '#ffffff', surfaceSunken: '#d6e2f0',
            content: '#0c1f3a', contentMuted: '#3b4d6d',
            contentSubtle: '#6a7c9d', border: '#a5bcd9',
            borderStrong: '#6f8db6', accent: '#0a6cbe',
            onAccent: '#f3f7fd', success: '#1a6e4f',
            warning: '#a06820', danger: '#a83020',
            info: '#0a6cbe'
          },
          dark: {
            canvas: '#0a1d3f', surface: '#0f254d',
            surfaceRaised: '#152d5b', surfaceSunken: '#06132c',
            content: '#e5f1ff', contentMuted: '#9fbbe0',
            contentSubtle: '#6a86ac', border: '#1d3a6d',
            borderStrong: '#2f5394', accent: '#7adfff',
            onAccent: '#0a1d3f', success: '#7fd8b0',
            warning: '#ffc56b', danger: '#ff8475',
            info: '#7adfff'
          },
          fontHeading: 'Inter, system-ui, sans-serif',
          fontBody: 'Inter, system-ui, sans-serif',
          fontMono: 'JetBrains Mono, ui-monospace, monospace'
        })
      },
      {
        key: 'brutalist',
        label: 'Brutalist',
        text: veDesignMdBuildPreset({
          name: 'Brutalist',
          defaultTheme: 'light',
          light: {
            canvas: '#dcdcdc', surface: '#e8e8e8',
            surfaceRaised: '#f0f0f0', surfaceSunken: '#c8c8c8',
            content: '#080808', contentMuted: '#383838',
            contentSubtle: '#6a6a6a', border: '#1a1a1a',
            borderStrong: '#080808', accent: '#1a1a1a',
            onAccent: '#fafafa', success: '#194a2c',
            warning: '#7a4d10', danger: '#8a1a1a',
            info: '#1a3a8a'
          },
          dark: {
            canvas: '#181818', surface: '#252525',
            surfaceRaised: '#2f2f2f', surfaceSunken: '#0c0c0c',
            content: '#efefef', contentMuted: '#a8a8a8',
            contentSubtle: '#727272', border: '#efefef',
            borderStrong: '#fafafa', accent: '#fafafa',
            onAccent: '#080808', success: '#7ad094',
            warning: '#d8b06a', danger: '#e87878',
            info: '#92acea'
          },
          fontHeading: 'Courier New, ui-monospace, monospace',
          fontBody: 'Courier New, ui-monospace, monospace',
          radiusSm: 0, radiusMd: 0, radiusLg: 0, radiusXl: 0
        })
      }
    ];
  }

  // Build a complete DESIGN.md text (frontmatter + minimal prose) from a
  // preset descriptor. Inlining the YAML keeps every required group
  // present and explicit so parseDesignMd accepts it.
  function veDesignMdBuildPreset(d) {
    function colorBlock(theme, c) {
      return [
        '  ' + theme + ':',
        '    canvas:          "' + c.canvas + '"',
        '    surface:         "' + c.surface + '"',
        '    surface-raised:  "' + c.surfaceRaised + '"',
        '    surface-sunken:  "' + c.surfaceSunken + '"',
        '    content:         "' + c.content + '"',
        '    content-muted:   "' + c.contentMuted + '"',
        '    content-subtle:  "' + c.contentSubtle + '"',
        '    border:          "' + c.border + '"',
        '    border-strong:   "' + c.borderStrong + '"',
        '    accent:          "' + c.accent + '"',
        '    on-accent:       "' + c.onAccent + '"',
        '    success:         "' + c.success + '"',
        '    warning:         "' + c.warning + '"',
        '    danger:          "' + c.danger + '"',
        '    info:            "' + c.info + '"'
      ].join('\n');
    }
    var radiusSm = (d.radiusSm == null) ? 4 : d.radiusSm;
    var radiusMd = (d.radiusMd == null) ? 8 : d.radiusMd;
    var radiusLg = (d.radiusLg == null) ? 12 : d.radiusLg;
    var radiusXl = (d.radiusXl == null) ? 16 : d.radiusXl;
    var lines = [
      '---',
      'designmd_version: 1',
      'meta:',
      '  name: "' + d.name + '"',
      '  default_theme: ' + d.defaultTheme,
      'colors:',
      colorBlock('light', d.light),
      colorBlock('dark', d.dark),
      'typography:',
      '  font-heading: "' + d.fontHeading + '"',
      '  font-body:    "' + d.fontBody + '"',
      '  font-mono:    "JetBrains Mono, ui-monospace, monospace"',
      '  scale:        [12, 14, 16, 20, 24, 32, 48]',
      '  weight-regular: 400',
      '  weight-medium:  500',
      '  weight-bold:    700',
      '  line-height:    1.55',
      'spacing:',
      '  scale: [4, 8, 12, 16, 24, 32, 48, 64]',
      'radius:',
      '  none: 0',
      '  sm:   ' + radiusSm,
      '  md:   ' + radiusMd,
      '  lg:   ' + radiusLg,
      '  xl:   ' + radiusXl,
      '  full: 9999',
      'elevation:',
      '  shadow-0: "none"',
      '  shadow-1: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"',
      '  shadow-2: "0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.12)"',
      '  shadow-3: "0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.14)"',
      '  shadow-4: "0 8px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.18)"',
      '  shadow-border: "0 0 0 1px rgba(0,0,0,0.08)"',
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
      '  easing-linear:           "linear"',
      '---',
      '',
      '# ' + d.name + ' — DESIGN.md preset',
      '',
      'Built-in preset shipped by the visual-communicator runtime.'
    ];
    return lines.join('\n');
  }

  // Resolve the full preset list at call time (the page may have loaded
  // amvcp-tokens.js after the runtime). amvcpTokens.PRESETS is a
  // { key -> DESIGN.md text } map; convert each entry to the row shape
  // the drawer expects, deduplicated by key.
  function veDesignMdAllPresets() {
    var rows = veDesignMdBuiltInPresets();
    var seen = {};
    var i;
    for (i = 0; i < rows.length; i++) seen[rows[i].key] = true;
    var tokens = (typeof window !== 'undefined') ? window.amvcpTokens : null;
    if (tokens && tokens.PRESETS) {
      var key;
      for (key in tokens.PRESETS) {
        if (Object.prototype.hasOwnProperty.call(tokens.PRESETS, key) && !seen[key]) {
          // Pretty-print the key as a label: 'factory-dark' → 'Factory Dark'.
          var label = key.split('-').map(function (w) {
            return w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);
          }).join(' ');
          rows.push({ key: key, label: label, text: tokens.PRESETS[key] });
          seen[key] = true;
        }
      }
    }
    return rows;
  }

  // ─── Position + collapse persistence ─────────────────────────────────
  //
  // localStorage keys are namespaced under `ve-designmd-pad-*`. A bad /
  // missing JSON value is silently dropped — no fail-fast here, because
  // a corrupt position should not block the pad from rendering.
  var VE_DESIGNMD_LS_POS = 've-designmd-pad-pos';
  var VE_DESIGNMD_LS_COLLAPSED = 've-designmd-pad-collapsed';
  var VE_DESIGNMD_LS_LIB_OPEN = 've-designmd-pad-library-open';
  var VE_DESIGNMD_LS_PRESET = 've-designmd-pad-preset';

  function veDesignMdLsRead(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function veDesignMdLsWrite(key, value) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
    } catch (e) {
      /* quota exceeded / private mode — silently ignore */
    }
  }

  // Read the saved position; null when unset or corrupt. The caller
  // picks a sensible default that depends on viewport size.
  function veDesignMdLoadPosition() {
    var raw = veDesignMdLsRead(VE_DESIGNMD_LS_POS);
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number'
            && isFinite(parsed.x) && isFinite(parsed.y)) {
          return parsed;
        }
      } catch (e) { /* fall through */ }
    }
    return null;
  }
  function veDesignMdSavePosition(x, y) {
    veDesignMdLsWrite(VE_DESIGNMD_LS_POS, JSON.stringify({ x: x, y: y }));
  }

  // Place the pod at (x,y), clamped to the visible viewport so the title
  // bar always stays grabbable. The pod's own bbox feeds the clamp so
  // the calculation is correct after a collapse/expand.
  function veDesignMdPlacePod(panel, x, y) {
    if (!panel) return;
    var rect = panel.getBoundingClientRect();
    var w = rect.width || 360;
    var h = rect.height || 60;
    var maxX = Math.max(8, window.innerWidth - w - 8);
    // Use min(h, 60) so a tall pod can still be dragged near the bottom
    // — only the head needs to remain on-screen for grabability.
    var maxY = Math.max(8, window.innerHeight - Math.min(h, 60) - 8);
    var clampedX = Math.min(Math.max(8, x), maxX);
    var clampedY = Math.min(Math.max(8, y), maxY);
    panel.style.left = clampedX + 'px';
    panel.style.top = clampedY + 'px';
    // Clear bottom/right so left/top wins consistently.
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  // Pick the initial pod position when no saved one applies.
  // BOTTOM-right (TRDD-9616579c regression #2 v2): top-right blocked
  // findings header text. Bottom-right is well below typical
  // report content density. 24px offset reads as "non-blocking".
  function veDesignMdDefaultPosition(panel) {
    var rect = panel.getBoundingClientRect();
    var w = rect.width || 360;
    var h = rect.height || 60;
    return {
      x: Math.max(8, window.innerWidth - w - 24),
      y: Math.max(8, window.innerHeight - h - 24)
    };
  }

  // Auto-hide-when-idle (TRDD-9616579c regression #2, v2).
  //
  // v1 (opacity:0.35 fade) was insufficient: at the screenshot
  // resolution the pod's text tokens (color names, "Choose File",
  // "Loaded:") rendered through to overlap underlying table cells,
  // creating a visual mess. The user explicitly flagged this in
  // their second-day review: "still so messy".
  //
  // v2 strategy: when the pod is collapsed AND idle, hide the entire
  // pod (visibility:hidden) and leave ONLY a tiny "🎨" handle button
  // at the corner. Hovering the handle restores the pod to its full
  // collapsed-but-visible state; clicking expands. The pod's
  // text/color tokens never appear over content unless the user
  // intentionally summons them.
  //
  // When the pod is EXPANDED (the user is actively editing tokens)
  // it stays full-opacity — fading an active editing surface is
  // anti-UX.
  var VE_DESIGNMD_IDLE_MS = 1500;
  var VE_DESIGNMD_HANDLE_ID = 've-designmd-handle';

  function _ensureDesignMdHandle() {
    var existing = document.getElementById(VE_DESIGNMD_HANDLE_ID);
    if (existing) { return existing; }
    var btn = document.createElement('button');
    btn.id = VE_DESIGNMD_HANDLE_ID;
    btn.type = 'button';
    btn.title = 'Open theme controls';
    btn.setAttribute('aria-label', 'Open theme controls');
    btn.textContent = '\u{1F3A8}';   // 🎨
    btn.style.cssText = [
      'position:fixed',
      'right:8px',
      'bottom:8px',
      'z-index:2147483645',
      'width:36px',
      'height:36px',
      'padding:0',
      'border:1px solid var(--ve-control-border, rgba(0,0,0,0.18))',
      'border-radius:50%',
      'background:var(--ve-control-overlay-bg, rgba(255,255,255,0.92))',
      'color:var(--ve-control-fg, #14110b)',
      'font-size:18px',
      'line-height:1',
      'cursor:pointer',
      'box-shadow:0 2px 8px rgba(0,0,0,0.22)',
      'display:none',
      'transition:transform 160ms ease, box-shadow 160ms ease',
      ''
    ].join(';');
    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.08)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
    });
    document.body.appendChild(btn);
    return btn;
  }

  function veDesignMdWireAutoFade(panel) {
    if (!panel || panel.__veAutoFadeWired) { return; }
    panel.__veAutoFadeWired = true;
    panel.style.transition = (panel.style.transition
      ? panel.style.transition + ', '
      : '') + 'opacity 220ms ease-out, visibility 0ms linear 220ms';

    var handle = _ensureDesignMdHandle();
    var idleTimer = null;

    function isCollapsed() {
      return panel.getAttribute('data-collapsed') === '1';
    }
    function hidePod() {
      // Only hide when collapsed — expanded means the user is editing.
      if (!isCollapsed()) { return; }
      panel.style.opacity = '0';
      panel.style.visibility = 'hidden';
      panel.style.pointerEvents = 'none';
      handle.style.display = 'inline-flex';
    }
    function showPod() {
      panel.style.opacity = '1';
      panel.style.visibility = 'visible';
      panel.style.pointerEvents = 'auto';
      handle.style.display = 'none';
    }
    function wake() {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      showPod();
    }
    function scheduleSleep() {
      if (idleTimer) { clearTimeout(idleTimer); }
      // Don't sleep when expanded (user is editing tokens).
      if (!isCollapsed()) { return; }
      idleTimer = setTimeout(hidePod, VE_DESIGNMD_IDLE_MS);
    }

    panel.addEventListener('mouseenter', wake);
    panel.addEventListener('mouseleave', scheduleSleep);
    panel.addEventListener('touchstart', wake, { passive: true });
    panel.addEventListener('touchend', scheduleSleep, { passive: true });
    panel.addEventListener('focusin', wake);
    panel.addEventListener('focusout', scheduleSleep);

    // Handle: hover/click restores the pod
    handle.addEventListener('mouseenter', wake);
    handle.addEventListener('click', function () {
      wake();
      // Auto-focus a sensible interactive target so screen readers
      // announce that the pod is open.
      var firstBtn = panel.querySelector('.ve-designmd-theme-toggle,'
        + ' .ve-designmd-collapse');
      if (firstBtn && firstBtn.focus) { firstBtn.focus(); }
    });

    // Re-evaluate sleep on collapse-state changes (so expanding the
    // pod doesn't immediately get hidden by a pending timer).
    var mo = new MutationObserver(function () {
      if (!isCollapsed()) {
        // Expanded — cancel any pending hide
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        showPod();
      } else {
        // Just collapsed — start the idle timer fresh
        scheduleSleep();
      }
    });
    mo.observe(panel, { attributes: true,
      attributeFilter: ['data-collapsed'] });

    // First-load behaviour: if pod started collapsed, hide it right
    // away (the handle replaces it). Otherwise stay visible — the
    // user is actively editing.
    if (isCollapsed()) {
      hidePod();
    }
  }

  // Wire the title-bar drag. mousedown on the head (excluding buttons)
  // captures the pointer, sets a body flag (suppresses text selection),
  // and updates the pod position on every move. mouseup persists the
  // final coordinates. Touch events shadow the same handlers so a
  // tablet user can drag the same way.
  function veDesignMdInitDrag(panel, headEl) {
    if (!panel || !headEl) return;
    var dragging = false;
    var startX = 0, startY = 0; // pointer at down
    var startLeft = 0, startTop = 0; // pod at down
    function onDown(ev) {
      // Ignore clicks on the head's buttons — those have their own
      // semantics (close / theme toggle / collapse).
      var t = ev.target;
      if (t && (t.tagName === 'BUTTON' || (t.closest && t.closest('button')))) {
        return;
      }
      dragging = true;
      var rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = ev.clientX;
      startY = ev.clientY;
      document.body.setAttribute('data-ve-designmd-dragging', '1');
      // Prevent the head's native text-select cursor from showing.
      ev.preventDefault();
    }
    function onMove(ev) {
      if (!dragging) return;
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      veDesignMdPlacePod(panel, startLeft + dx, startTop + dy);
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      document.body.removeAttribute('data-ve-designmd-dragging');
      var rect = panel.getBoundingClientRect();
      veDesignMdSavePosition(rect.left, rect.top);
    }
    headEl.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    // Touch support — same drag, no extra code path.
    headEl.addEventListener('touchstart', function (ev) {
      var t = ev.touches && ev.touches[0];
      if (!t) return;
      onDown({
        target: ev.target,
        clientX: t.clientX,
        clientY: t.clientY,
        preventDefault: function () { ev.preventDefault(); }
      });
    }, { passive: false });
    document.addEventListener('touchmove', function (ev) {
      var t = ev.touches && ev.touches[0];
      if (!t) return;
      onMove({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    document.addEventListener('touchend', function () { onUp(); });
  }

  // Apply / clear the collapsed state. When collapsed the pod becomes a
  // small drag handle (just the head, no body) — the user re-clicks the
  // collapse button to expand. Position is preserved across the toggle.
  function veDesignMdSetCollapsed(panel, collapsed) {
    if (!panel) return;
    panel.setAttribute('data-collapsed', collapsed ? '1' : '0');
    veDesignMdLsWrite(VE_DESIGNMD_LS_COLLAPSED, collapsed ? '1' : '0');
    var btn = panel.querySelector('.ve-designmd-collapse');
    if (btn) {
      btn.textContent = collapsed ? '▢' : '–';
      btn.setAttribute('aria-label',
        collapsed ? 'Expand style controller' : 'Collapse style controller');
    }
  }

  // ─── Style-controller pad ────────────────────────────────────────────
  //
  // A FLOATING + DRAGGABLE panel, expanded by default but collapsible to
  // a small drag-handle when the user wants the page free of UI chrome.
  // Position (pre-collapse and post-collapse), open-state, and active
  // theme-library selection persist across hot-swaps + page reloads via
  // localStorage so a user who arranges the pad once never has to redo
  // it. The pad's body controls are generated ENTIRELY by iterating
  // amvcpDesignMd.tokenSchema — no hardcoded control list. Editing a
  // control immediately setProperty()s the one --vc-* var on :root and
  // updates the in-memory designmd so an Export round-trips the edit.
  //
  // Phase 2.5 rebuild (TRDD-352ef46a, p25-runtime-theme-pod):
  //   • dragable by its title-bar handle (cursor:grab → grabbing)
  //   • theme-library drawer with curated DESIGN.md presets
  //   • Load DESIGN.md (file picker + drop + paste) — already shipped
  //   • Save as .md (download via Blob + URL.createObjectURL) — already shipped
  //   • per-token live editors from tokenSchema — already shipped
  //   • collapse to a small handle button (the handle IS the drag-grip
  //     when the pod is collapsed — re-click expands the pod)
  function injectDesignMdControllerStyles() {
    if (document.getElementById('__ve-designmd-styles')) {
      return;
    }
    var s = document.createElement('style');
    s.id = '__ve-designmd-styles';
    // All chrome reads the existing --ve-control-* palette so the pad
    // matches the rest of the runtime UI on both light and dark themes.
    // The pod is its own floating element — there is no separate toggle
    // button — so its position is set inline (left/top) and persisted.
    s.textContent = [
      '#' + VE_DESIGNMD_PANEL_ID + ' {',
      '  position:fixed; z-index:2147483646;',
      '  width:360px; max-height:84vh;',
      '  display:flex; flex-direction:column;',
      '  background:var(--ve-control-overlay-bg, rgba(255,255,255,0.94));',
      '  -webkit-backdrop-filter:var(--ve-control-overlay-blur, blur(10px));',
      '  backdrop-filter:var(--ve-control-overlay-blur, blur(10px));',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.18));',
      '  border-radius:var(--ve-control-radius, 8px);',
      '  box-shadow:var(--ve-control-shadow, 0 8px 28px rgba(0,0,0,0.22));',
      '  color:var(--ve-control-fg, #14110b);',
      '  font:13px/1.4 var(--ve-control-font, inherit);',
      '}',
      // Collapsed state: only the title-bar handle is visible.
      '#' + VE_DESIGNMD_PANEL_ID + '[data-collapsed="1"] {',
      '  width:auto; max-height:none;',
      '}',
      '#' + VE_DESIGNMD_PANEL_ID + '[data-collapsed="1"] .ve-designmd-body {',
      '  display:none;',
      '}',
      '#' + VE_DESIGNMD_PANEL_ID + '[data-collapsed="1"] .ve-designmd-head {',
      '  border-bottom:none;',
      '}',
      // While dragging, suppress text selection on the whole document so
      // the cursor reads as grabbing instead of selecting prose.
      'body[data-ve-designmd-dragging="1"] {',
      '  cursor:grabbing !important;',
      '  -webkit-user-select:none; user-select:none;',
      '}',
      '.ve-designmd-head {',
      '  display:flex; align-items:center; gap:8px;',
      '  padding:8px 10px 8px 12px;',
      '  border-bottom:1px solid var(--ve-control-border, rgba(0,0,0,0.12));',
      // The whole title bar IS the drag handle.
      '  cursor:grab; user-select:none; -webkit-user-select:none;',
      '  touch-action:none;',
      '}',
      '.ve-designmd-head:active { cursor:grabbing; }',
      // Drag-grip dots — visual cue that the bar is grabable.
      '.ve-designmd-grip {',
      '  display:inline-block; width:10px; height:14px;',
      '  background-image:radial-gradient(circle, currentColor 1px, transparent 1.4px);',
      '  background-size:5px 5px; background-position:0 1px;',
      '  opacity:0.45; flex:none;',
      '}',
      '.ve-designmd-title {',
      '  font-weight:700; letter-spacing:0.02em; flex:1; min-width:0;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;',
      '  font-size:12px;',
      '}',
      '.ve-designmd-theme-toggle, .ve-designmd-close, .ve-designmd-collapse {',
      '  appearance:none; -webkit-appearance:none; cursor:pointer;',
      '  background:var(--ve-control-bg, #fff);',
      '  color:var(--ve-control-fg, #14110b);',
      '  border:1px solid var(--ve-control-border-strong, rgba(0,0,0,0.2));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  font:600 11px/1 var(--ve-control-font, inherit);',
      '  padding:5px 8px; flex:none;',
      '}',
      '.ve-designmd-theme-toggle:hover, .ve-designmd-close:hover,',
      '.ve-designmd-collapse:hover {',
      '  background:var(--ve-control-bg-hover, #f0f0f0);',
      '}',
      '.ve-designmd-body { overflow:auto; padding:8px 12px 12px; }',
      // Theme-library drawer.
      '.ve-designmd-library {',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.12));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  margin-bottom:10px;',
      '}',
      '.ve-designmd-library-head {',
      '  display:flex; align-items:center; gap:6px;',
      '  padding:6px 8px; cursor:pointer;',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  user-select:none; -webkit-user-select:none;',
      '  background:var(--ve-control-bg, #fff);',
      '}',
      '.ve-designmd-library-head:hover {',
      '  background:var(--ve-control-bg-hover, #f0f0f0);',
      '}',
      '.ve-designmd-library-caret {',
      '  display:inline-block; width:9px; transition:transform 0.12s ease;',
      '  transform:rotate(0deg); font-size:10px; line-height:1;',
      '}',
      '.ve-designmd-library[data-open="1"] .ve-designmd-library-caret {',
      '  transform:rotate(90deg);',
      '}',
      '.ve-designmd-library-label {',
      '  font-weight:700; font-size:11px; letter-spacing:0.03em;',
      '  text-transform:uppercase; flex:1;',
      '  color:var(--ve-control-fg-dim, #777);',
      '}',
      '.ve-designmd-library-list { display:none; padding:4px 8px 8px; }',
      '.ve-designmd-library[data-open="1"] .ve-designmd-library-list {',
      '  display:flex; flex-wrap:wrap; gap:4px;',
      '}',
      '.ve-designmd-preset {',
      '  appearance:none; -webkit-appearance:none; cursor:pointer;',
      '  background:var(--ve-control-bg, #fff);',
      '  color:var(--ve-control-fg, #14110b);',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.18));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  font:600 11px/1.1 var(--ve-control-font, inherit);',
      '  padding:5px 8px;',
      '}',
      '.ve-designmd-preset:hover {',
      '  background:var(--ve-control-bg-hover, #f0f0f0);',
      '  border-color:var(--ve-control-border-strong, rgba(0,0,0,0.3));',
      '}',
      '.ve-designmd-preset[aria-pressed="true"] {',
      '  background:var(--ve-accent, #b8861f);',
      '  color:var(--ve-on-accent, #fff);',
      '  border-color:var(--ve-accent, #b8861f);',
      '}',
      '.ve-designmd-load {',
      '  border:1px dashed var(--ve-control-border-strong, rgba(0,0,0,0.2));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  padding:8px; margin-bottom:10px;',
      '}',
      '.ve-designmd-load.ve-drag-over {',
      '  background:var(--ve-control-bg-hover, #f0f0f0);',
      '  border-color:var(--ve-accent, #b8861f);',
      '}',
      '.ve-designmd-load-row {',
      '  display:flex; gap:6px; align-items:center; flex-wrap:wrap;',
      '  margin-bottom:6px;',
      '}',
      '.ve-designmd-loaded-name {',
      '  display:none; padding:4px 8px; margin-top:6px;',
      '  font:11px/1.3 var(--ve-control-mono, ui-monospace, monospace);',
      '  background:color-mix(in srgb, var(--ve-accent, #b8861f) 14%, transparent);',
      '  border-left:3px solid var(--ve-accent, #b8861f);',
      '  border-radius:0 4px 4px 0;',
      '  word-break:break-all;',
      '}',
      '.ve-designmd-loaded-name[data-show="1"] { display:block; }',
      '.ve-designmd-paste {',
      '  width:100%; box-sizing:border-box; resize:vertical;',
      '  min-height:48px;',
      '  font:11px/1.4 var(--ve-control-mono, ui-monospace, monospace);',
      '  background:var(--ve-control-bg, #fff);',
      '  color:var(--ve-control-fg, #14110b);',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.12));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  padding:6px;',
      '}',
      '.ve-designmd-btn {',
      '  appearance:none; -webkit-appearance:none; cursor:pointer;',
      '  background:var(--ve-control-bg, #fff);',
      '  color:var(--ve-control-fg, #14110b);',
      '  border:1px solid var(--ve-control-border-strong, rgba(0,0,0,0.2));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  font:600 12px/1 var(--ve-control-font, inherit);',
      '  padding:6px 10px;',
      '}',
      '.ve-designmd-btn:hover { background:var(--ve-control-bg-hover, #f0f0f0); }',
      '.ve-designmd-action-row {',
      '  display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;',
      '}',
      '.ve-designmd-errors {',
      '  display:none; margin-top:6px; padding:6px 8px;',
      '  background:color-mix(in srgb, #c0392b 10%, transparent);',
      '  border-left:3px solid #c0392b;',
      '  border-radius:0 4px 4px 0;',
      '  font:11px/1.4 var(--ve-control-mono, ui-monospace, monospace);',
      '  color:var(--ve-control-fg, #14110b);',
      '  white-space:pre-wrap;',
      '}',
      '.ve-designmd-errors[data-show="1"] { display:block; }',
      '.ve-designmd-group { margin-bottom:8px; }',
      '.ve-designmd-group-label {',
      '  font-weight:700; text-transform:capitalize;',
      '  letter-spacing:0.03em; font-size:11px;',
      '  color:var(--ve-control-fg-dim, #777);',
      '  margin:8px 0 4px;',
      '}',
      '.ve-designmd-control {',
      '  display:flex; align-items:center; gap:8px;',
      '  padding:3px 0;',
      '}',
      '.ve-designmd-control-label {',
      '  flex:1; min-width:0;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;',
      '  font-size:12px;',
      '}',
      '.ve-designmd-control input[type="color"] {',
      '  width:34px; height:24px; padding:0; cursor:pointer;',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.12));',
      '  border-radius:4px; background:none;',
      '}',
      '.ve-designmd-control input[type="range"] { flex:1.4; min-width:60px; }',
      '.ve-designmd-control input[type="number"] {',
      '  width:62px;',
      '}',
      '.ve-designmd-control input[type="text"],',
      '.ve-designmd-control select {',
      '  flex:1.6; min-width:0;',
      '}',
      '.ve-designmd-control input[type="number"],',
      '.ve-designmd-control input[type="text"],',
      '.ve-designmd-control select {',
      '  box-sizing:border-box;',
      '  background:var(--ve-control-bg, #fff);',
      '  color:var(--ve-control-fg, #14110b);',
      '  border:1px solid var(--ve-control-border, rgba(0,0,0,0.12));',
      '  border-radius:var(--ve-control-radius-sm, 6px);',
      '  font:12px/1.3 var(--ve-control-font, inherit);',
      '  padding:4px 6px;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // Build (or rebuild) the body of the controller pad from the active
  // designmd + tokenSchema. Called on first open and after every
  // hot-swap / theme toggle so the controls always reflect what is
  // actually on :root.
  function veDesignMdRenderControls(panel) {
    if (!panel) {
      return;
    }
    var body = panel.querySelector('.ve-designmd-controls');
    if (!body) {
      return;
    }
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }
    var api = window.amvcpDesignMd;
    var designmd = veDesignMdState.designmd;
    if (!api || !designmd) {
      return;
    }
    var schema = api.tokenSchema || [];
    var theme = veDesignMdState.theme;

    // Group the schema entries by their `group` field, preserving the
    // first-seen order so the pad reads color → typography → spacing →
    // radius → elevation → motion (whatever order the schema declares).
    var groupOrder = [];
    var grouped = {};
    var i;
    for (i = 0; i < schema.length; i++) {
      var g = schema[i].group;
      if (!grouped[g]) {
        grouped[g] = [];
        groupOrder.push(g);
      }
      grouped[g].push(schema[i]);
    }

    var gi;
    for (gi = 0; gi < groupOrder.length; gi++) {
      var groupName = groupOrder[gi];
      var section = document.createElement('div');
      section.className = 've-designmd-group';
      section.setAttribute('data-ve-designmd-group', groupName);
      var label = document.createElement('div');
      label.className = 've-designmd-group-label';
      label.textContent = groupName;
      section.appendChild(label);

      var entries = grouped[groupName];
      var ei;
      for (ei = 0; ei < entries.length; ei++) {
        veDesignMdAppendControlsForEntry(section, entries[ei], designmd, theme);
      }
      body.appendChild(section);
    }
  }

  // Append one (or, for indexed scale tokens, several) control rows for
  // a single tokenSchema entry. Indexed entries expand to one row per
  // array element of the live designmd value.
  function veDesignMdAppendControlsForEntry(section, entry, designmd, theme) {
    if (entry.indexed) {
      var basePath = veDesignMdTokenPath(entry, theme, 0);
      // The array lives at the path minus its trailing index segment.
      var arrPath = basePath ? basePath.slice(0, basePath.length - 1) : null;
      var arr = veDesignMdReadPath(designmd, arrPath);
      if (Object.prototype.toString.call(arr) !== '[object Array]') {
        return;
      }
      var idx;
      for (idx = 0; idx < arr.length; idx++) {
        var cssVar = entry.cssVar.replace('<i>', String(idx));
        var labelText = entry.group + '.' + entry.key + '[' + idx + ']';
        section.appendChild(
          veDesignMdBuildControlRow(entry, designmd, theme, idx, cssVar, labelText)
        );
      }
      return;
    }
    // Non-indexed: a single control. An optional token absent from the
    // loaded DESIGN.md is skipped — the controller never fabricates a
    // value for a token the document did not declare.
    var path = veDesignMdTokenPath(entry, theme, null);
    var value = veDesignMdReadPath(designmd, path);
    if (value === undefined) {
      return;
    }
    section.appendChild(
      veDesignMdBuildControlRow(entry, designmd, theme, null, entry.cssVar, entry.key)
    );
  }

  // Build one control row: a label plus the typed input dictated by the
  // schema entry's `type`. `index` is non-null only for indexed tokens;
  // `cssVar` is the concrete (index-substituted) CSS custom property
  // this control drives; `labelText` is the row caption.
  function veDesignMdBuildControlRow(entry, designmd, theme, index, cssVar, labelText) {
    var row = document.createElement('div');
    row.className = 've-designmd-control';
    row.setAttribute('data-ve-designmd-control', cssVar);

    var label = document.createElement('span');
    label.className = 've-designmd-control-label';
    label.textContent = labelText;
    row.appendChild(label);

    var path = veDesignMdTokenPath(entry, theme, index);
    var rawValue = veDesignMdReadPath(designmd, path);

    // Per the schema's type: color→color input, length/number→number,
    // select→dropdown, text/shadow/easing→text input.
    var input;
    if (entry.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      // <input type=color> only accepts #rrggbb — use the value when it
      // is one, otherwise fall back to a neutral grey so the swatch is
      // still operable (the live --vc-* var keeps the original string).
      input.value = /^#[0-9a-fA-F]{6}$/.test(String(rawValue))
        ? String(rawValue)
        : '#888888';
    } else if (entry.type === 'length' || entry.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.value = String(rawValue);
      input.step = 'any';
    } else if (entry.type === 'select') {
      input = document.createElement('select');
      // The v1 schema declares no select tokens; the branch exists so a
      // future select token renders without a code change. With no
      // option metadata the current value is the sole option.
      var opt = document.createElement('option');
      opt.value = String(rawValue);
      opt.textContent = String(rawValue);
      input.appendChild(opt);
      input.value = String(rawValue);
    } else {
      // text / shadow / easing — a free-text input.
      input = document.createElement('input');
      input.type = 'text';
      input.value = String(rawValue);
    }
    input.className = 've-designmd-input';
    input.setAttribute('data-ve-designmd-cssvar', cssVar);

    // Editing a control: write the in-memory designmd AND push the one
    // --vc-* var to :root immediately (live restyle). 'input' fires on
    // every keystroke / slider drag so the page tracks the edit live.
    input.addEventListener('input', function () {
      veDesignMdHandleControlEdit(entry, designmd, theme, index, cssVar, input.value);
    });
    row.appendChild(input);
    return row;
  }

  // Apply one control's edit: coerce the value to the schema's type,
  // write it into the in-memory designmd, and setProperty the matching
  // --vc-* var on :root with the unit the schema specifies. This keeps
  // ONE source of truth — the designmd object — and the live :root in
  // sync, so a later Export serializes exactly what the user sees.
  function veDesignMdHandleControlEdit(entry, designmd, theme, index, cssVar, rawString) {
    var coerced = veDesignMdCoerceValue(entry, rawString);
    if (coerced === null) {
      // A non-numeric value typed into a numeric control — ignore it
      // rather than corrupt the designmd; the input keeps the bad text
      // so the user can correct it.
      return;
    }
    var path = veDesignMdTokenPath(entry, theme, index);
    veDesignMdWritePath(designmd, path, coerced);
    // The CSS var carries the schema's unit suffix ('px' / 'ms' / '').
    var cssValue = String(coerced) + (entry.unit || '');
    document.documentElement.style.setProperty(cssVar, cssValue);
  }

  // Show / clear the parser-error area inside the pad. Errors are shown
  // verbatim from the parser so a malformed DESIGN.md tells the user
  // exactly what is wrong — and crucially, no partial token set is ever
  // applied (veDesignMdLoadText already guarantees that).
  function veDesignMdShowErrors(panel, errors) {
    if (!panel) {
      return;
    }
    var box = panel.querySelector('.ve-designmd-errors');
    if (!box) {
      return;
    }
    if (!errors || errors.length === 0) {
      box.textContent = '';
      box.setAttribute('data-show', '0');
      return;
    }
    box.textContent = 'DESIGN.md not applied — ' + errors.length +
      ' error' + (errors.length === 1 ? '' : 's') + ':\n• ' +
      errors.join('\n• ');
    box.setAttribute('data-show', '1');
  }

  // Hot-swap entry point: parse + apply `text`, then refresh the pad. On
  // success the error area clears and every control re-reads the new
  // values; on failure the errors show and :root is left untouched.
  // `sourceName` (optional) is the human-readable label for the source
  // (filename for an imported .md, preset label for a library pick) —
  // surfaced in the .ve-designmd-loaded-name strip so the user can
  // tell at a glance which DESIGN.md is currently driving the page.
  function veDesignMdHotSwap(panel, text, sourceName) {
    var res = veDesignMdLoadText(text);
    if (res.ok) {
      veDesignMdShowErrors(panel, null);
      veDesignMdSyncPanelTitle(panel);
      veDesignMdRenderControls(panel);
      veDesignMdShowLoadedName(panel, sourceName);
    } else {
      veDesignMdShowErrors(panel, res.errors);
    }
    return res;
  }

  // Write the loaded-name strip with the given `name` (or hide it when
  // `name` is falsy). The strip is just a styled DIV under the load
  // box — purely informational, never interactive.
  function veDesignMdShowLoadedName(panel, name) {
    if (!panel) return;
    var box = panel.querySelector('.ve-designmd-loaded-name');
    if (!box) return;
    if (!name) {
      box.textContent = '';
      box.setAttribute('data-show', '0');
      return;
    }
    box.textContent = 'Loaded: ' + name;
    box.setAttribute('data-show', '1');
  }

  // Update the panel's title strip to the active DESIGN.md's name +
  // the theme its colors are currently resolved for.
  function veDesignMdSyncPanelTitle(panel) {
    if (!panel) {
      return;
    }
    var titleEl = panel.querySelector('.ve-designmd-title');
    if (!titleEl) {
      return;
    }
    var name = 'DESIGN.md';
    if (veDesignMdState.designmd && veDesignMdState.designmd.meta &&
        veDesignMdState.designmd.meta.name) {
      name = veDesignMdState.designmd.meta.name;
    }
    titleEl.textContent = name + '  ·  ' + veDesignMdState.theme;
    var toggle = panel.querySelector('.ve-designmd-theme-toggle');
    if (toggle) {
      // The button switches TO the other theme — label it accordingly.
      toggle.textContent = veDesignMdState.theme === 'light'
        ? 'Dark' : 'Light';
    }
  }

  // Toggle the active theme: re-stamp data-ve-theme on <html> and
  // re-resolve + re-apply the SAME designmd for the new theme (only the
  // colors differ — typography/spacing/radius are theme-agnostic).
  //
  // Phase 2 INTEGRATION (TRDD-352ef46a #172): after the new tokens are
  // applied, dispatch `vc:themechange` so the visualize-skill modules
  // (chart/icon-svg/slide/report-doc + diagram's own listener) can
  // re-render any inline-resolved colours. `ve:themechange` is
  // dispatched as a legacy alias for the wireframe module which binds
  // that older event name. Both events carry the new theme name in
  // detail.theme so a custom listener can branch on it.
  function veDesignMdToggleTheme(panel) {
    if (!veDesignMdState.designmd) {
      return;
    }
    var next = veDesignMdState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-ve-theme', next);
    veDesignMdApply(veDesignMdState.designmd, next);
    veDesignMdSyncPanelTitle(panel);
    veDesignMdRenderControls(panel);
    dispatchThemeChange(next);
  }

  // Dispatch the canonical `vc:themechange` event + legacy
  // `ve:themechange` alias on `document`. The diagram module binds
  // `vc:themechange` and `themechange`, the wireframe module binds
  // `ve:themechange`, and the runtime's own bootThemeRescanListener
  // binds `vc:themechange` — sending all three covers every module
  // listener with a single call. Defensive against a sandbox that
  // lacks CustomEvent (very old browsers — falls back to a plain
  // Event without detail).
  function dispatchThemeChange(theme) {
    if (typeof document === 'undefined') return;
    var detail = { theme: theme };
    var ev1, ev2, ev3;
    try {
      ev1 = new CustomEvent('vc:themechange', { detail: detail });
      ev2 = new CustomEvent('ve:themechange', { detail: detail });
      ev3 = new CustomEvent('themechange', { detail: detail });
    } catch (e) {
      // Old-IE-style fallback. The event still fires, just without
      // detail — modules read document.documentElement.dataset.veTheme
      // instead, which is already up to date by this point.
      ev1 = document.createEvent('Event');
      ev1.initEvent('vc:themechange', false, false);
      ev2 = document.createEvent('Event');
      ev2.initEvent('ve:themechange', false, false);
      ev3 = document.createEvent('Event');
      ev3.initEvent('themechange', false, false);
    }
    document.dispatchEvent(ev1);
    document.dispatchEvent(ev2);
    document.dispatchEvent(ev3);
  }

  // Export the current in-memory designmd as DESIGN.md text via the
  // engine's serializeDesignMd, then offer it as a download AND copy it
  // to the clipboard. The serialized text round-trips through
  // parseDesignMd (Phase-1a guarantee), so the exported file is itself
  // a valid DESIGN.md.
  function veDesignMdExport() {
    var api = window.amvcpDesignMd;
    if (!api || typeof api.serializeDesignMd !== 'function' ||
        !veDesignMdState.designmd) {
      return null;
    }
    var text = api.serializeDesignMd(veDesignMdState.designmd);
    // Download via a transient object-URL anchor.
    try {
      var blob = new Blob([text], { type: 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'DESIGN.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke on the next tick so the click's navigation has resolved.
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    } catch (e) {
      // A sandbox with no Blob/URL support — clipboard copy below still
      // gives the user the text, so this is non-fatal.
      if (window.console && console.warn) {
        console.warn('DESIGN.md export: download unavailable — ' + e);
      }
    }
    // Copy-to-clipboard — same pattern the runtime uses elsewhere.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {}, function () {});
    }
    return text;
  }

  // Wire the hot-swap controls inside the load box: file picker,
  // drag-and-drop of a .md file onto the box, and paste of DESIGN.md
  // text into the textarea + an Apply button.
  function veDesignMdWireLoadControls(panel) {
    var loadBox = panel.querySelector('.ve-designmd-load');
    var fileInput = panel.querySelector('.ve-designmd-file');
    var pasteArea = panel.querySelector('.ve-designmd-paste');
    var applyBtn = panel.querySelector('.ve-designmd-apply-paste');
    if (!loadBox) {
      return;
    }

    // (a) File picker.
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          veDesignMdHotSwap(panel, String(reader.result || ''), file.name);
        };
        reader.readAsText(file);
      });
    }

    // (b) Drag-and-drop of a .md file onto the load box.
    loadBox.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      loadBox.classList.add('ve-drag-over');
    });
    loadBox.addEventListener('dragleave', function () {
      loadBox.classList.remove('ve-drag-over');
    });
    loadBox.addEventListener('drop', function (ev) {
      ev.preventDefault();
      loadBox.classList.remove('ve-drag-over');
      var dt = ev.dataTransfer;
      if (!dt) {
        return;
      }
      var file = dt.files && dt.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function () {
          veDesignMdHotSwap(panel, String(reader.result || ''), file.name);
        };
        reader.readAsText(file);
        return;
      }
      // Some sources drop plain text rather than a file.
      var text = dt.getData ? dt.getData('text/plain') : '';
      if (text) {
        veDesignMdHotSwap(panel, text, 'pasted (drop)');
      }
    });

    // (c) Paste into the textarea + Apply.
    if (applyBtn && pasteArea) {
      applyBtn.addEventListener('click', function () {
        var text = pasteArea.value || '';
        if (text.replace(/\s+/g, '') === '') {
          veDesignMdShowErrors(panel, ['paste area is empty']);
          return;
        }
        veDesignMdHotSwap(panel, text, 'pasted text');
      });
    }
  }

  // Build the floating style-controller pad: ONE self-floating panel
  // (no separate toggle button), draggable by its title bar, with a
  // theme-library drawer + import/export + per-token live editors.
  // Idempotent — a second call is a no-op. The previous toggle-button
  // ID (VE_DESIGNMD_TOGGLE_ID) is kept defined for back-compat but no
  // toggle button is created — the pod's own collapse button is the
  // only show/hide affordance now.
  function injectDesignMdControllerPad() {
    if (!document.body) {
      return;
    }
    if (!window.amvcpDesignMd) {
      // No engine → no tokens → nothing for the pad to control.
      return;
    }
    if (document.getElementById(VE_DESIGNMD_PANEL_ID)) {
      return;
    }
    injectDesignMdControllerStyles();

    // The panel — its own floating element, positioned absolutely.
    var panel = document.createElement('div');
    panel.id = VE_DESIGNMD_PANEL_ID;
    panel.setAttribute('data-collapsed', '0');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'DESIGN.md style controller');

    // ── Title bar ── drag handle + title + theme toggle + collapse + close.
    var head = document.createElement('div');
    head.className = 've-designmd-head';
    var grip = document.createElement('span');
    grip.className = 've-designmd-grip';
    grip.setAttribute('aria-hidden', 'true');
    var title = document.createElement('span');
    title.className = 've-designmd-title';
    title.textContent = 'DESIGN.md';
    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 've-designmd-theme-toggle';
    themeBtn.textContent = 'Dark';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    var collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 've-designmd-collapse';
    collapseBtn.textContent = '–';
    collapseBtn.setAttribute('aria-label', 'Collapse style controller');
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 've-designmd-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Hide style controller');
    head.appendChild(grip);
    head.appendChild(title);
    head.appendChild(themeBtn);
    head.appendChild(collapseBtn);
    head.appendChild(closeBtn);

    var bodyWrap = document.createElement('div');
    bodyWrap.className = 've-designmd-body';

    // ── Theme-library drawer ── one preset pill per row in PRESETS,
    // collapsible to hide the list when not needed.
    var library = document.createElement('div');
    library.className = 've-designmd-library';
    var libraryHead = document.createElement('div');
    libraryHead.className = 've-designmd-library-head';
    var libraryCaret = document.createElement('span');
    libraryCaret.className = 've-designmd-library-caret';
    libraryCaret.textContent = '▶';
    libraryCaret.setAttribute('aria-hidden', 'true');
    var libraryLabel = document.createElement('span');
    libraryLabel.className = 've-designmd-library-label';
    libraryLabel.textContent = 'Theme library';
    libraryHead.appendChild(libraryCaret);
    libraryHead.appendChild(libraryLabel);
    var libraryList = document.createElement('div');
    libraryList.className = 've-designmd-library-list';
    library.appendChild(libraryHead);
    library.appendChild(libraryList);

    // Populate the library list.
    veDesignMdRenderLibrary(panel, libraryList);
    // Restore the drawer's open state (default: closed so a fresh page
    // does not surprise the user with a tall panel).
    var libOpen = veDesignMdLsRead(VE_DESIGNMD_LS_LIB_OPEN) === '1';
    library.setAttribute('data-open', libOpen ? '1' : '0');
    libraryHead.addEventListener('click', function () {
      var open = library.getAttribute('data-open') === '1';
      library.setAttribute('data-open', open ? '0' : '1');
      veDesignMdLsWrite(VE_DESIGNMD_LS_LIB_OPEN, open ? '0' : '1');
    });

    // ── Load box ── file picker + drag-drop + paste.
    var loadBox = document.createElement('div');
    loadBox.className = 've-designmd-load';
    var loadRow = document.createElement('div');
    loadRow.className = 've-designmd-load-row';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 've-designmd-file';
    fileInput.accept = '.md,text/markdown,text/plain';
    var dropHint = document.createElement('span');
    dropHint.style.cssText = 'font-size:11px;color:var(--ve-control-fg-dim,#777);';
    dropHint.textContent = 'or drop a .md file here';
    loadRow.appendChild(fileInput);
    loadRow.appendChild(dropHint);
    var pasteArea = document.createElement('textarea');
    pasteArea.className = 've-designmd-paste';
    pasteArea.setAttribute('placeholder', 'or paste DESIGN.md text…');
    var applyPaste = document.createElement('button');
    applyPaste.type = 'button';
    applyPaste.className = 've-designmd-btn ve-designmd-apply-paste';
    applyPaste.textContent = 'Apply pasted DESIGN.md';
    applyPaste.style.cssText = 'margin-top:6px;';
    var loadedName = document.createElement('div');
    loadedName.className = 've-designmd-loaded-name';
    loadedName.setAttribute('data-show', '0');
    var errors = document.createElement('div');
    errors.className = 've-designmd-errors';
    errors.setAttribute('data-show', '0');
    loadBox.appendChild(loadRow);
    loadBox.appendChild(pasteArea);
    loadBox.appendChild(applyPaste);
    loadBox.appendChild(loadedName);
    loadBox.appendChild(errors);

    // ── Action row ── Save as .md (export) is the only action button.
    var actionRow = document.createElement('div');
    actionRow.className = 've-designmd-action-row';
    var exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 've-designmd-btn ve-designmd-export';
    exportBtn.textContent = 'Save as .md';
    exportBtn.setAttribute('aria-label', 'Save current theme as DESIGN.md');
    actionRow.appendChild(exportBtn);

    // ── Schema-generated controls (per-token live editors) ──
    var controls = document.createElement('div');
    controls.className = 've-designmd-controls';

    bodyWrap.appendChild(library);
    bodyWrap.appendChild(loadBox);
    bodyWrap.appendChild(actionRow);
    bodyWrap.appendChild(controls);

    panel.appendChild(head);
    panel.appendChild(bodyWrap);

    document.body.appendChild(panel);

    // ── Initial position + collapsed state ── restore from localStorage
    // when present, otherwise default to top-right with a 24px offset.
    var savedPos = veDesignMdLoadPosition();
    if (savedPos) {
      veDesignMdPlacePod(panel, savedPos.x, savedPos.y);
    } else {
      var def = veDesignMdDefaultPosition(panel);
      veDesignMdPlacePod(panel, def.x, def.y);
    }
    // Default-collapsed (TRDD-9616579c regression #2): the user objected
    // that the expanded pod covers content on the right side of the page.
    // Start collapsed (just the title bar visible) unless the user
    // explicitly expanded it last session. The grip + theme/load buttons
    // remain reachable in collapsed state so the discovery affordance is
    // not lost.
    var collapsedRaw = veDesignMdLsRead(VE_DESIGNMD_LS_COLLAPSED);
    var savedCollapsed = collapsedRaw === null ? true : (collapsedRaw === '1');
    veDesignMdSetCollapsed(panel, savedCollapsed);

    // Auto-fade-when-idle (TRDD-9616579c regression #2): when the pointer
    // is far from the pod, fade to 35% opacity so underlying content is
    // readable through it. Pointer entering the pod (or its grab zone)
    // wakes it back to 100% instantly. The fade is purely visual — the
    // pod still accepts pointer events when faded.
    veDesignMdWireAutoFade(panel);

    // ── Render controls + sync title up front ── the previous design
    // built these lazily on first open, but the pod is now visible by
    // default so we render eagerly. Cost is one tokenSchema walk on
    // boot — negligible for the ~50 tokens the schema declares.
    veDesignMdSyncPanelTitle(panel);
    veDesignMdRenderControls(panel);

    // ── Wire interactions ──
    veDesignMdInitDrag(panel, head);
    closeBtn.addEventListener('click', function () {
      // "Close" hides the pod entirely (the user has no other way to
      // bring it back, but in practice no scenario calls for closing
      // permanently — collapse is the nudge-out-of-the-way affordance).
      panel.style.display = 'none';
    });
    collapseBtn.addEventListener('click', function () {
      var collapsed = panel.getAttribute('data-collapsed') === '1';
      veDesignMdSetCollapsed(panel, !collapsed);
    });
    themeBtn.addEventListener('click', function () {
      veDesignMdToggleTheme(panel);
    });
    exportBtn.addEventListener('click', veDesignMdExport);
    veDesignMdWireLoadControls(panel);

    // ── Restore the last-applied preset's "Loaded:" indicator ──
    var lastPresetKey = veDesignMdLsRead(VE_DESIGNMD_LS_PRESET);
    if (lastPresetKey) {
      var rows = veDesignMdAllPresets();
      var i;
      for (i = 0; i < rows.length; i++) {
        if (rows[i].key === lastPresetKey) {
          veDesignMdShowLoadedName(panel, rows[i].label + ' (preset)');
          break;
        }
      }
    }

    // Re-clamp the position on viewport resize so the pod never ends up
    // off-screen after a window rotation / multi-monitor unplug.
    window.addEventListener('resize', function () {
      var rect = panel.getBoundingClientRect();
      veDesignMdPlacePod(panel, rect.left, rect.top);
    });
  }

  // Render the theme-library drawer's preset list. Each row is a button
  // that, on click, calls veDesignMdHotSwap with the preset's text and
  // marks itself aria-pressed (the runtime never multi-selects — only
  // one preset can be active at a time).
  function veDesignMdRenderLibrary(panel, listEl) {
    if (!listEl) return;
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    var rows = veDesignMdAllPresets();
    var lastKey = veDesignMdLsRead(VE_DESIGNMD_LS_PRESET);
    var i;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 've-designmd-preset';
      btn.setAttribute('data-preset-key', row.key);
      btn.setAttribute('aria-pressed', row.key === lastKey ? 'true' : 'false');
      btn.textContent = row.label;
      // Bind the click via an IIFE so each button captures its own row.
      (function (r) {
        btn.addEventListener('click', function () {
          var res = veDesignMdHotSwap(panel, r.text, r.label + ' (preset)');
          if (res && res.ok) {
            veDesignMdLsWrite(VE_DESIGNMD_LS_PRESET, r.key);
            // Update aria-pressed across the row.
            var all = listEl.querySelectorAll('.ve-designmd-preset');
            var k;
            for (k = 0; k < all.length; k++) {
              all[k].setAttribute('aria-pressed',
                all[k].getAttribute('data-preset-key') === r.key ? 'true' : 'false');
            }
          }
        });
      })(row);
      listEl.appendChild(btn);
    }
  }

  // ─── Phase 2 INTEGRATION — visualize-skill module wiring ──────────
  //
  // TRDD-352ef46a, task #172. After bootDesignMdEngine() has applied
  // --vc-* to :root and injectStyles() has added the runtime's own
  // CSS, walk the canonical visualize-skill module list and call each
  // module's CSS-inject + auto-discovery entry-point. The order is
  // chosen so each module's scan operates against the final --vc-*
  // resolved values:
  //   tokens (already applied by the engine) → token-sheet (manual mount only)
  //   → layout → typography → animation → interactive → tables →
  //   code-highlight (utility, no scan) → chart → diagram → icon-svg →
  //   wireframe → slide → report-doc.
  //
  // Every call is defensively guarded so a missing module (the page
  // omitted that script) is a no-op, and an init exception in one
  // module does NOT block the others (each catch logs once and
  // continues — a bad chart fence must not block diagram/slide/code
  // rendering on the same page).
  //
  // The defensive shape is the same for every module:
  //   tryModule('amvcpFoo', function (m) {
  //     if (m.injectFooCSS) m.injectFooCSS(document);
  //     m.scan(document);  // or m.init / m.boot — see comments below
  //   });
  function tryModule(globalName, fn) {
    if (typeof window === 'undefined') return;
    var m = window[globalName];
    if (!m || typeof m !== 'object') return;
    try {
      fn(m);
    } catch (e) {
      if (window.console && console.warn) {
        console.warn(globalName + ' init:', e);
      }
    }
  }

  function bootVisualizeModules() {
    // tokens — the DESIGN.md engine (bootDesignMdEngine) already did
    // the per-frame `--vc-*` apply. amvcpTokens is a pure validator
    // module with no scan API, so there's nothing to call here.

    // token-sheet — exposes renderContactSheet/mountContactSheet only
    // (no auto-discovery scan). Mounting a contact sheet is an
    // explicit per-page choice, so we do nothing here.

    // layout — boot() runs initTOC + initStickyHeader + initSidebar.
    // No CSS-inject API; the layout CSS is the sidecar amvcp-layout.css
    // the page must <link> in.
    tryModule('amvcpLayout', function (m) {
      if (typeof m.boot === 'function') m.boot();
    });

    // typography — pure helper module: stamps data-ve-vfont and may
    // apply a default scale system. No CSS-inject API (handled by
    // amvcp-typography.css). No scan API either — applyScaleSystem is
    // explicit per-page.
    tryModule('amvcpTypography', function (m) {
      if (typeof m.markVariableFontSupport === 'function') {
        m.markVariableFontSupport(document);
      }
    });

    // animation — injectAnimationCSS + init scans every reveal/tilt/
    // loop scaffold and wires the IntersectionObserver chain.
    tryModule('amvcpAnimation', function (m) {
      if (typeof m.injectAnimationCSS === 'function') {
        m.injectAnimationCSS(document);
      }
      if (typeof m.init === 'function') m.init(document);
    });

    // interactive — boot() is idempotent and self-guarded via
    // window.__amvcpInteractiveBooted; injectFoundationCss is called
    // internally from boot(). No external CSS-inject API to call.
    tryModule('amvcpInteractive', function (m) {
      if (typeof m.boot === 'function') m.boot();
    });

    // tables — init() is idempotent and self-guarded via
    // document.__veTablesInit. No external CSS-inject API.
    tryModule('amvcpTables', function (m) {
      if (typeof m.init === 'function') m.init();
    });

    // code-highlight — DEFECT-D fix: the module now exposes a
    // `scan(root)` that walks every .ve-code-block (the wrapper
    // initCodeGutter inserts), reads each .ve-code-content's
    // textContent line-by-line, runs highlightBlock(lines, lang)
    // and replaces each .ve-code-content's innerHTML with the
    // tokenised HTML. scan() is idempotent (per-pre __veCodeHighlighted
    // flag). MUST run AFTER initAllCodeGutters wraps the lines —
    // bootVisualizeModules runs after initAllCodeGutters in
    // bootEverything (line 10417 vs 10427), so the .ve-code-content
    // structure is in place by the time we reach this point. No CSS
    // injection from this module — the page must <link>
    // amvcp-code-highlight.css for the .ve-tok-* role classes to
    // resolve.
    tryModule('amvcpCodeHighlight', function (m) {
      if (typeof m.scan === 'function') m.scan(document);
    });

    // chart — injectChartCSS + scan walks every fenced ```chart block,
    // parses the JSON, and renders to inline SVG.
    tryModule('amvcpChart', function (m) {
      if (typeof m.injectChartCSS === 'function') {
        m.injectChartCSS(document);
      }
      if (typeof m.scan === 'function') m.scan(document);
    });

    // diagram — injectDiagramCSS + init renders every .ve-scene-graph
    // host and styles every .ve-ascii-diagram. The diagram module
    // ALSO binds its own `vc:themechange` / `themechange` listeners
    // for theme hot-swap, so we do not need to re-scan it from
    // bootThemeRescanListener below — it self-heals.
    tryModule('amvcpDiagram', function (m) {
      if (typeof m.injectDiagramCSS === 'function') {
        m.injectDiagramCSS(document);
      }
      if (typeof m.init === 'function') m.init(document);
    });

    // icon-svg — injectIconSvgCSS + init compiles every `icon-svg`
    // fenced block into themed SVG.
    tryModule('amvcpIconSvg', function (m) {
      if (typeof m.injectIconSvgCSS === 'function') {
        m.injectIconSvgCSS(document);
      }
      if (typeof m.init === 'function') m.init(document);
    });

    // wireframe — init() scans every wireframe scaffold and applies
    // the fidelity desaturation. The CSS lives in the sidecar
    // amvcp-wireframe.css that the page must <link>; the module has
    // no internal CSS-inject API. The wireframe module ALSO binds
    // its own `ve:themechange` listener (note: ve: prefix, not vc:)
    // so it self-heals on theme swap when that event is dispatched.
    tryModule('amvcpWireframe', function (m) {
      if (typeof m.init === 'function') m.init(document);
    });

    // slide — injectSlideCSS + boot parses every `slide-deck` fence
    // and renders the deck stage. The browser global is named
    // amvcpSlideDeck (not amvcpSlide — verified in scripts/amvcp-slide.js).
    //
    // DEFECT-A fix: respect the slide module's own opt-out flag so a
    // multi-technique page (where the slide deck is one of MANY
    // visualisations) can defer the boot — boot() always renders the
    // deck full-bleed (position:fixed; inset:0) and would otherwise
    // bury the rest of the page. The fixture sets __vsdManualInit=true
    // and parks the deck JSON under a non-default id; a button later
    // promotes the script to id="vsd-deck" and calls boot() on demand.
    tryModule('amvcpSlideDeck', function (m) {
      if (typeof m.injectSlideCSS === 'function') {
        m.injectSlideCSS(document);
      }
      if (window.__vsdManualInit) return;
      if (typeof m.boot === 'function') m.boot(document);
    });

    // report-doc — injectReportDocCSS + init wires the report-doc
    // template (TOC scroll-spy, callouts, etc).
    tryModule('amvcpReportDoc', function (m) {
      if (typeof m.injectReportDocCSS === 'function') {
        m.injectReportDocCSS(document);
      }
      if (typeof m.init === 'function') m.init(document);
    });

    // After all modules are booted, wire the cross-module theme
    // re-scan listener (idempotent — installs only once).
    bootThemeRescanListener();
  }

  // ─── Phase 2 INTEGRATION — theme re-scan ──────────────────────────
  //
  // When the DESIGN.md engine swaps the active theme (light <-> dark)
  // it dispatches `vc:themechange` on `document`. Most modules
  // (typography, layout, tables, code-highlight, interactive,
  // animation) reflow purely via CSS vars — `--vc-color-*` resolves
  // to the new theme value on the next paint, no JS needed.
  //
  // The SVG/canvas-rendered modules paint colours INLINE into the
  // SVG (so a screenshot, an export, or a click-to-style probe sees
  // the actual hex), and inline values do NOT update on a CSS-var
  // change. Those modules expose a `scan` / `refresh` / `reThemeAll`
  // entry-point that we re-call here.
  //
  // diagram + wireframe install their own listeners for the same
  // event — calling them again here would double-render but is safe
  // (their re-render is idempotent on a stored scene JSON). For
  // determinism we call only the modules that do NOT self-bind:
  // chart, icon-svg, slide, report-doc.
  //
  // The runtime ALSO dispatches `ve:themechange` (legacy alias)
  // alongside `vc:themechange` so the wireframe module's existing
  // `ve:themechange` listener fires on every theme swap.
  function bootThemeRescanListener() {
    if (window.__vcThemeRescanBound) return;
    window.__vcThemeRescanBound = true;
    function rescan() {
      tryModule('amvcpChart', function (m) {
        if (typeof m.scan === 'function') m.scan(document);
      });
      tryModule('amvcpIconSvg', function (m) {
        if (typeof m.refresh === 'function') {
          m.refresh(document);
        } else if (typeof m.init === 'function') {
          m.init(document);
        }
      });
      tryModule('amvcpSlideDeck', function (m) {
        if (typeof m.refresh === 'function') {
          m.refresh(document);
        } else if (typeof m.boot === 'function') {
          m.boot(document);
        }
      });
      tryModule('amvcpReportDoc', function (m) {
        if (typeof m.refresh === 'function') {
          m.refresh(document);
        } else if (typeof m.init === 'function') {
          m.init(document);
        }
      });
    }
    document.addEventListener('vc:themechange', rescan);
  }

  function bootEverything() {
    detectAndStampTheme();   // MUST run before injectStyles so the
                             // :root[data-ve-theme="light"] overrides
                             // resolve to the right values from frame 1.
    // Apply the DESIGN.md tokens right after the theme is known and
    // before injectStyles(), so --vc-* are on :root from frame 1 —
    // detectAndStampTheme() decides which theme's colors resolve.
    bootDesignMdEngine();
    injectStyles();
    isTouchDevice(); // Phase 7: stamp body[data-ve-touch="1"] early so the
                     // CSS that ups handle hit-zones is in effect by the
                     // time the table/gutter overlays paint.
    initAllMath();      // KaTeX, lazy
    initAllTikz();      // TikZJax, lazy
    initAllGraphs();    // viz.js (Graphviz), lazy
    initAllRegex();     // regex-vis, lazy from same-origin scripts/
    initAllProse();
    enhanceFocus();
    initAllTableForms();
    initAllTableHandles();   // Phase 5
    initAllCodeGutters();    // Phase 6
    setupGutterEvents();     // Phase 6 + Phase 7 (touch)
    setupAtomSelectionEvents(); // v4 universal group-selection (TRDD-3d1570ab R3)
    setupSnippetSelection(); // Phase 4 + Phase 7 (touchend)
    setupMultiClickSelection();
    setupFindingReplyHandlers(); // TRDD-eff1aa87 v1 — interactive reports
    setupCommentModal();         // TRDD-eff1aa87 v2 — modal comment threads
    wireDecisionPills();         // TRDD-7a2dab03 v3 — per-element decision pills
    initReportMode();            // v4 — propagate data-ve-report to body
                                 // and inject .ve-decision-mini per atom
    bootVisualizeModules();      // Phase 2 INTEGRATION (TRDD-352ef46a #172) —
                                 // wire every visualize-skill module after
                                 // tokens are on :root and runtime CSS is in.
    injectDesignMdControllerPad(); // Phase 1b — floating DESIGN.md style pad
    // Test hook — expose openCommentModal so headless tests can open
    // the modal directly without going through the (now-removed)
    // .ve-comment-pill hover UI. The bubble handle (.ve-comment-handle)
    // remains the visible affordance for real users.
    if (typeof window !== 'undefined') {
      window.__veOpenCommentModal = openCommentModal;
      // Phase 1b test hook — exposes the DESIGN.md engine state and the
      // hot-swap / theme / export entry points so headless tests can
      // drive the engine without simulating file pickers and drops.
      window.__veDesignMd = {
        state: veDesignMdState,
        loadText: veDesignMdLoadText,
        hotSwap: function (text, sourceName) {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          return veDesignMdHotSwap(panel, text, sourceName);
        },
        toggleTheme: function () {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          veDesignMdToggleTheme(panel);
        },
        exportText: veDesignMdExport,
        defaultText: DEFAULT_DESIGNMD_TEXT,
        // Phase 2.5 (TRDD-352ef46a, p25-runtime-theme-pod) — expose the
        // pod's drag/collapse/preset surface so headless tests can
        // verify position persistence, the library drawer, and the
        // collapse handle without simulating real mouse drags.
        presets: veDesignMdAllPresets,
        applyPreset: function (key) {
          var rows = veDesignMdAllPresets();
          var i;
          for (i = 0; i < rows.length; i++) {
            if (rows[i].key === key) {
              var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
              var res = veDesignMdHotSwap(panel, rows[i].text, rows[i].label + ' (preset)');
              if (res && res.ok) {
                veDesignMdLsWrite(VE_DESIGNMD_LS_PRESET, key);
              }
              return res;
            }
          }
          return { ok: false, errors: ['unknown preset: ' + key] };
        },
        movePod: function (x, y) {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          if (!panel) return null;
          veDesignMdPlacePod(panel, x, y);
          var rect = panel.getBoundingClientRect();
          veDesignMdSavePosition(rect.left, rect.top);
          return { x: rect.left, y: rect.top };
        },
        getPodPosition: function () {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          if (!panel) return null;
          var rect = panel.getBoundingClientRect();
          return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
        },
        setCollapsed: function (collapsed) {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          if (!panel) return;
          veDesignMdSetCollapsed(panel, !!collapsed);
        },
        isCollapsed: function () {
          var panel = document.getElementById(VE_DESIGNMD_PANEL_ID);
          return !!(panel && panel.getAttribute('data-collapsed') === '1');
        }
      };
    }
  }

  // ─── v4 — Report mode init ───────────────────────────────────────────
  // The renderer stamps `<article data-ve-report>` on report pages. We
  // propagate that attribute up to <body> so the CSS gates above
  // (e.g. body[data-ve-report] .ve-decision { display:none })
  // resolve. We then walk every selectable atom (<p>/<li>/<tr> with
  // data-ve-comment-id) and insert one compact .ve-decision-mini at the
  // right edge — one switch per atom, per the user's TRDD-3d1570ab R5.
  function initReportMode() {
    var report = document.querySelector('[data-ve-report]');
    if (!report) return;
    document.body.setAttribute('data-ve-report', '');
    stampMissingBodyAtoms();
    stripFakeHeadingCommentIds();
    injectDecisionMinis();
    injectBulkDefaultSwitch();
  }

  // TRDD-9616579c regression #3 — stamp data-ve-comment-id on every body
  // paragraph / list item / blockquote / table row that is missing it.
  // The hand-authored fixture and the Python renderer have historically
  // disagreed on coverage: the renderer stamps every <p>/<li>/<tr> it
  // emits, but a fixture author who hand-writes HTML may forget. Without
  // this auto-stamp, those un-stamped elements are silently
  // non-selectable (isSelectableAtom returns null), the user can't open
  // a comment thread on them, and the decision-mini pill is never
  // injected. The user-facing complaint: "practically no paragraph or
  // bullet point is selectable as item".
  //
  // Skipped (matching the existing chrome exclusions used elsewhere):
  //   - elements already carrying data-ve-comment-id (idempotent)
  //   - elements inside <thead>, <tfoot>, <pre>, <code>, <aside>,
  //     <header>, <footer>, <figure>, <figcaption>
  //   - elements inside .ve-banner, .ve-report-banner, .ve-decision-mini,
  //     .ve-bulk-default, .ve-scene-graph, .ve-finding-round,
  //     .ve-designmd-panel, .ve-snippet-popup, .ve-modal, .ve-overlay,
  //     .ve-style-pad
  //   - "fake heading" paragraphs (<p><strong>Title</strong></p>) —
  //     they get treated as headings throughout the pipeline
  //   - empty elements (whitespace-only text)
  //
  // The data-ve-comment-id is a content-hash via simpleHash() so a
  // round-trip through the renderer would produce the same id.
  var VE_AUTOSTAMP_CHROME_SELECTOR =
    'thead,tfoot,pre,code,aside,header,footer,figure,figcaption,'
    + '.ve-banner,.ve-report-banner,.ve-decision-mini,.ve-bulk-default,'
    + '.ve-scene-graph,.ve-finding-round,'
    + '[id="ve-designmd-panel"],.ve-designmd-panel,.ve-snippet-popup,'
    + '.ve-modal,.ve-overlay,.ve-style-pad,.ve-comment-handle,'
    + '.ve-comment-modal,.ve-comment-pill';

  function stampMissingBodyAtoms() {
    var candidates = document.querySelectorAll(
      'p:not([data-ve-comment-id]),li:not([data-ve-comment-id]),'
      + 'blockquote:not([data-ve-comment-id])'
    );
    var pnumBase = 1000;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.closest(VE_AUTOSTAMP_CHROME_SELECTOR)) continue;
      // Fake-headings get the same non-selectable treatment as real <h*>.
      if (el.tagName === 'P' && isFakeHeadingParagraph(el)) continue;
      var text = (el.textContent || '').trim();
      if (text.length === 0) continue;
      // Skip degenerate single-character list bullets (e.g. nav arrows)
      if (el.tagName === 'LI' && text.length <= 2) continue;
      var cid = simpleHash((el.tagName || '') + ':' + text);
      el.setAttribute('data-ve-comment-id', cid);
      if (!el.hasAttribute('data-ve-pnum')) {
        el.setAttribute('data-ve-pnum', String(pnumBase + i));
      }
    }
  }

  // Strip data-ve-comment-id from "fake heading" paragraphs (markdown
  // `**Title**` → `<p><strong>Title</strong></p>`). Without this strip
  // they keep the cursor:pointer + hover bg/glow that the generic
  // `p[data-ve-comment-id]` CSS rules apply, even though
  // findCommentAnchor() already excludes them from selection. The
  // attribute removal makes them visually inert too, matching real
  // <h*> tag behavior. Snippet text-drag selection still works
  // normally inside them.
  function stripFakeHeadingCommentIds() {
    var ps = document.querySelectorAll('p[data-ve-comment-id]');
    for (var i = 0; i < ps.length; i++) {
      if (isFakeHeadingParagraph(ps[i])) {
        ps[i].removeAttribute('data-ve-comment-id');
      }
    }
  }

  // Inject a "Set all decisions to: Skip / Approve / Deny" switch into the
  // .ve-report-banner. Click overwrites every .ve-decision-mini in one
  // stroke. Idempotent — no duplicate insertion if already present.
  function injectBulkDefaultSwitch() {
    var banner = document.querySelector('.ve-report-banner');
    if (!banner) return;
    if (banner.querySelector('.ve-bulk-default')) return;

    var wrap = document.createElement('div');
    wrap.className = 've-bulk-default';

    var label = document.createElement('span');
    label.className = 've-bulk-default-label';
    label.textContent = 'Set all decisions to:';

    var pill = document.createElement('span');
    pill.className = 've-bulk-default-pill';
    pill.setAttribute('role', 'group');
    pill.setAttribute('aria-label', 'Bulk-default for every decision in this report');

    var flash = document.createElement('span');
    flash.className = 've-bulk-default-flash';
    flash.setAttribute('aria-live', 'polite');

    // Each label is now ⟨colored unicode symbol⟩ + word, so the bulk
    // switch ALSO works as a legend that maps the per-element mini-chip
    // glyphs (﹅ blue / ✔︎ green / ✘ red) to their plain-English meaning.
    var specs = [
      { value: 'skip',    text: 'Skip',    symbol: '﹅', cls: 've-bulk-default-skip' },
      { value: 'approve', text: 'Approve', symbol: '✔︎', cls: 've-bulk-default-approve' },
      { value: 'deny',    text: 'Deny',    symbol: '✘', cls: 've-bulk-default-deny' },
    ];
    for (var i = 0; i < specs.length; i++) {
      (function (spec) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 've-bulk-default-seg ' + spec.cls;
        // Wrap the symbol in its own span so .ve-bulk-default-symbol CSS
        // can color it independently of the surrounding word.
        var sym = document.createElement('span');
        sym.className = 've-bulk-default-symbol';
        sym.textContent = spec.symbol;
        var word = document.createElement('span');
        word.className = 've-bulk-default-word';
        word.textContent = spec.text;
        btn.appendChild(sym);
        btn.appendChild(document.createTextNode(' '));
        btn.appendChild(word);
        btn.title = 'Mark every item as ' + spec.text + ' (replaces current selections)';
        btn.setAttribute('data-bulk-default', spec.value);
        btn.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var n = applyBulkDefault(spec.value);
          flash.textContent = n + ' item' + (n === 1 ? '' : 's') + ' set to ' + spec.text + '.';
          flash.setAttribute('data-show', '1');
          setTimeout(function () { flash.removeAttribute('data-show'); }, 1800);
        });
        pill.appendChild(btn);
      })(specs[i]);
    }

    wrap.appendChild(label);
    wrap.appendChild(pill);
    wrap.appendChild(flash);
    banner.appendChild(wrap);
  }

  // Walk every .ve-decision-mini, set aria-checked according to `value`,
  // and rewrite localStorage. Returns the number of widgets affected.
  function applyBulkDefault(value) {
    var pills = document.querySelectorAll('.ve-decision-mini');
    var map = {};
    for (var i = 0; i < pills.length; i++) {
      var pill = pills[i];
      var key = pill.getAttribute('data-ve-decision-key');
      var segs = pill.querySelectorAll('.ve-decision-mini-seg');
      for (var s = 0; s < segs.length; s++) {
        segs[s].setAttribute(
          'aria-checked',
          segs[s].getAttribute('data-decision') === value ? 'true' : 'false'
        );
      }
      if (value !== 'skip' && key) map[key] = value;
    }
    saveMiniDecisions(map);
    return pills.length;
  }

  // localStorage key for per-element decision state.
  var DECISION_MINI_LS_KEY = 've-decision-mini-state';

  function loadMiniDecisions() {
    try {
      var raw = localStorage.getItem(DECISION_MINI_LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function saveMiniDecisions(map) {
    try { localStorage.setItem(DECISION_MINI_LS_KEY, JSON.stringify(map)); }
    catch (_) {}
  }

  // R20/R23 gate: an atom only gets a decision-mini pill if it lives
  // inside a host that explicitly declared a choice-variant mode via
  // data-ve-mode. Missing mode = readonly (no pill). Accepted choice
  // variants: "choice" (alias for multi, back-compat), "single",
  // "multi", and "max-N" with N >= 1.
  function isChoiceMode(mode) {
    if (!mode) return false;
    if (mode === 'choice' || mode === 'single' || mode === 'multi') return true;
    if (mode.indexOf('max-') === 0) {
      var n = parseInt(mode.slice(4), 10);
      return n >= 1;
    }
    return false;
  }
  function atomInChoiceHost(atom) {
    var host = atom.closest && atom.closest('[data-ve-mode]');
    return !!host && isChoiceMode(host.getAttribute('data-ve-mode'));
  }

  function injectDecisionMinis() {
    // Selectable atoms per R3 + the universal model: prose paragraphs,
    // list items, table rows, and blockquotes (styled prose). Containers
    // (table, ul/ol, pre, headings) deliberately excluded.
    var atoms = document.querySelectorAll(
      'p[data-ve-comment-id], li[data-ve-comment-id], '
      + 'tr[data-ve-comment-id], blockquote[data-ve-comment-id]'
    );
    var savedDecisions = loadMiniDecisions();
    // For tables we add a header column too — track which tables we've
    // augmented so we don't double-inject the header cell.
    var taggedTables = {};
    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      // Skip if already injected (idempotent on re-init).
      if (atom.querySelector(':scope > .ve-decision-mini, :scope > td.ve-decision-mini-cell')) continue;
      // Skip "fake heading" paragraphs (`**Title**` rendered as
      // <p><strong>Title</strong></p>) — visually they\'re headings,
      // user expects no chip and no selection. Same gate as
      // findCommentAnchor() / isSelectableAtom().
      if (atom.tagName === 'P' && isFakeHeadingParagraph(atom)) continue;
      // R20 + R23 gate: skip atoms that aren't inside a choice host.
      // The default (no data-ve-mode anywhere up the tree) is readonly —
      // pills are an OPT-IN by the agent, not a runtime default.
      if (!atomInChoiceHost(atom)) continue;
      var key = atom.getAttribute('data-ve-pnum')
                || atom.getAttribute('data-ve-comment-id')
                || ('atom-' + i);
      var current = savedDecisions[key] || 'skip';
      var widget = buildDecisionMini(key, current);
      if (atom.tagName === 'TR') {
        // Append a new <td> at the end of the row to host the widget.
        var td = document.createElement('td');
        td.className = 've-decision-mini-cell';
        td.appendChild(widget);
        atom.appendChild(td);
        // Add a matching <th> in the THEAD for column alignment, ONCE
        // per table.
        var table = atom.closest('table');
        var tableId = table && (table.id || (table.dataset && table.dataset.veTableTag) || ('t-' + i));
        if (table && !taggedTables[tableId]) {
          taggedTables[tableId] = true;
          var headRow = table.querySelector('thead tr');
          if (headRow && !headRow.querySelector(':scope > th.ve-decision-mini-cell')) {
            var th = document.createElement('th');
            th.className = 've-decision-mini-cell';
            th.title = 'Skip / Approve / Deny';
            th.textContent = 'Your choice';
            headRow.appendChild(th);
          }
          if (table.dataset) table.dataset.veTableTag = tableId;
        }
      } else {
        // For <p> and <li>: append the widget inline at the end. The
        // widget is inline-flex with margin-left, so it flows after the
        // last word of the text without breaking the line on its own.
        atom.appendChild(widget);
      }
    }
  }

  function buildDecisionMini(key, currentValue) {
    var span = document.createElement('span');
    span.className = 've-decision-mini';
    span.setAttribute('role', 'radiogroup');
    span.setAttribute('data-ve-decision-key', key);
    var labels = [
      // Unicode glyphs (replace prior single-letter S/A/D which had a
      // legibility bug — Skip selected painted white-on-white). Symbol
      // semantics: ﹅ U+FE45 sesame-dot = neutral/skip (blue when picked),
      // ✔︎ U+2714 + U+FE0E text-style check = approve (green), ✘ U+2718
      // heavy ballot X = deny (red). Each segment\'s color comes from the
      // symbol-color tokens defined in :root for both light and dark.
      { value: 'skip',    label: '﹅',           cls: 've-decision-mini-skip',    title: 'Skip — no opinion (default)' },
      { value: 'approve', label: '✔︎',     cls: 've-decision-mini-approve', title: 'Approve — accept this item' },
      { value: 'deny',    label: '✘',           cls: 've-decision-mini-deny',    title: 'Deny — reject this item' },
    ];
    for (var i = 0; i < labels.length; i++) {
      var spec = labels[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 've-decision-mini-seg ' + spec.cls;
      btn.textContent = spec.label;
      btn.title = spec.title;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('data-decision', spec.value);
      btn.setAttribute('aria-checked', spec.value === currentValue ? 'true' : 'false');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var newValue = this.getAttribute('data-decision');
        var parent = this.parentElement;
        var k = parent.getAttribute('data-ve-decision-key');
        // Update aria-checked across the 3 segments.
        var segs = parent.querySelectorAll('.ve-decision-mini-seg');
        for (var s = 0; s < segs.length; s++) {
          segs[s].setAttribute(
            'aria-checked',
            segs[s].getAttribute('data-decision') === newValue ? 'true' : 'false'
          );
        }
        // Persist.
        var map = loadMiniDecisions();
        if (newValue === 'skip') {
          delete map[k];
        } else {
          map[k] = newValue;
        }
        saveMiniDecisions(map);
      });
      span.appendChild(btn);
    }
    return span;
  }

  // ─── Region 3 (TRDD-352ef46a Phase 2.5 USER REQ #10) ───────────────
  // Atom-scoped 3-radio Skip/Approve/Deny mini-pill, INDEPENDENT of
  // selection state. Sibling agents (chart, diagram, icon-svg, table,
  // wireframe, etc.) call window.amvcpRuntime.attachDecisionMini(el, id)
  // once per atom they emit; the helper appends one .ve-decision-mini-pill
  // to that element with three S/A/D segments backed by hidden radios.
  // State is persisted per-id in localStorage["ve-decision-mini:" + id].

  var DECISION_PILL_LS_PREFIX = 've-decision-mini:';
  function loadPillDecision(id) {
    if (!id) return null;
    try {
      var raw = localStorage.getItem(DECISION_PILL_LS_PREFIX + id);
      return raw ? raw : null;
    } catch (_) { return null; }
  }
  function savePillDecision(id, value) {
    if (!id) return;
    try {
      if (value && value !== 'none') {
        localStorage.setItem(DECISION_PILL_LS_PREFIX + id, value);
      } else {
        localStorage.removeItem(DECISION_PILL_LS_PREFIX + id);
      }
    } catch (_) {}
  }

  function buildDecisionMiniPill(id, currentValue) {
    var span = document.createElement('span');
    span.className = 've-decision-mini-pill';
    span.setAttribute('role', 'radiogroup');
    span.setAttribute('data-ve-decision-pill-id', id);
    span.setAttribute('aria-label', 'Skip / Approve / Deny');
    var groupName = 've-decision-mini-pill-' + id.replace(/[^A-Za-z0-9_-]/g, '_');
    var specs = [
      { value: 'skip',    letter: 'S', title: 'Skip — no opinion' },
      { value: 'approve', letter: 'A', title: 'Approve — accept this item' },
      { value: 'deny',    letter: 'D', title: 'Deny — reject this item' },
    ];
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      var radioId = groupName + '-' + spec.value;
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = groupName;
      input.value = spec.value;
      input.id = radioId;
      input.className = 've-decision-mini-pill-radio';
      if (spec.value === currentValue) input.checked = true;
      var label = document.createElement('label');
      label.setAttribute('for', radioId);
      label.className = 've-decision-mini-pill-seg ve-decision-mini-pill-seg-' + spec.value;
      label.textContent = spec.letter;
      label.title = spec.title;
      // Stop propagation so segment clicks never bubble up to the
      // parent atom (which would otherwise trigger comment modal /
      // multi-click chain). Pill is its own affordance.
      var stop = function (ev) { ev.stopPropagation(); };
      label.addEventListener('mousedown', stop);
      label.addEventListener('click', stop);
      input.addEventListener('change', (function (val, theId, root) {
        return function () {
          savePillDecision(theId, val);
          var host = root.parentElement;
          if (host) host.setAttribute('data-ve-decision-mini', val);
        };
      })(spec.value, id, span));
      input.addEventListener('click', stop);
      span.appendChild(input);
      span.appendChild(label);
    }
    return span;
  }

  function attachDecisionMini(el, id) {
    if (!el || !id) return null;
    // Idempotent — never attach twice to the same host.
    var existing = el.querySelector(':scope > .ve-decision-mini-pill[data-ve-decision-pill-id="' + id.replace(/"/g, '\\"') + '"]');
    if (existing) return existing;
    var current = loadPillDecision(id);
    var pill = buildDecisionMiniPill(id, current);
    if (current) el.setAttribute('data-ve-decision-mini', current);
    // Position absolute so the pill sits in the corner without
    // competing for inline-flow space. Give the host position:relative
    // ONLY if it currently has 'static' positioning (never override an
    // already-positioned host).
    var hostCs = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (hostCs && hostCs.position === 'static') {
      el.style.position = 'relative';
    }
    el.appendChild(pill);
    return pill;
  }

  // Stamp the public namespace AS SOON AS the runtime IIFE loads, not
  // inside bootEverything — sibling-agent modules may call
  // attachDecisionMini during their own init pass that runs BEFORE
  // bootEverything completes.
  if (typeof window !== 'undefined') {
    window.amvcpRuntime = window.amvcpRuntime || {};
    window.amvcpRuntime.attachDecisionMini = attachDecisionMini;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootEverything);
  } else {
    bootEverything();
  }
})();
