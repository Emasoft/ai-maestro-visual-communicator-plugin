# Widget section index — internal heading map of every control reference

Each Interactive Controls reference file is self-sufficient (scaffold,
lib functions, DESIGN.md tokens, selection/comment/decision-mini notes,
JS-off degradation, anti-patterns, verification). This file is the
consolidated index of **what is inside each one** — the per-widget list
of its own section headings — so you can preview a reference's internal
structure before opening it. SKILL.md keeps the routing tables (which
widget to pick) and links each `references/<widget>.md` file directly;
this file keeps the section-level preview of each picked widget.

This file is itself an index (a map of every reference's headings), so
it intentionally carries no Table-of-Contents section of its own — it
would just be a table of contents of tables of contents. Open
`references/<widget>.md` (named below) for the full technique.

## Per-widget heading maps

- **state-plumbing** — Embedded JSON data model · localStorage persistence helper · The one allowed try/catch · Selection-system seam · 3-state mini-switch — already shipped (seam only)
- **copy-clipboard-fallback** — What it is · Helper · Toast confirmation · Standard pattern — wire a button · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **scroll-spy** — What it is · Helper · The `rootMargin` trick · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **keyboard-shortcuts** — What it is · Helper — register a shortcut · Standard bindings · Help overlay · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **panels-disclosure** — Accordion — native `<details>`/`<summary>` · Tabs — radio inputs + `:checked` + sibling combinator · Modal — `:target` · no-nested-scrollbars
- **filter-pills** — HTML skeleton · `display:contents` — the transparent wrapper · Show/hide — CSS-only baseline · JS-enhanced layer · no-nested-scrollbars
- **stepper** — HTML skeleton · State model · JS layer · Spin keyframe — seam with the `animation` technique · prefers-reduced-motion · no-nested-scrollbars
- **virtualized-list** — HTML skeleton · Critical constraint — page-level scroll, NOT an inner scroller · The math (pure functions, exported for tests) · Render loop · Threshold — only virtualize past 200 rows · Degradation with JS off
- **live-tweak** — HTML skeleton · Two modes, one engine · Bridge to the DESIGN.md engine · prefers-reduced-motion · no-nested-scrollbars
- **drag-reorder** — HTML skeleton · One source of truth · Cards · Markdown export · Persistence · Degradation with JS off · no-nested-scrollbars
- **sortable-table** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **css-only-toggle-switch** — What it is · Scaffold · Lib functions · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **persistent-checklist** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **conditional-form-warning-chain** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **light-dark-theme-toggle** — What it is · Scaffold · CSS-only theme application (the no-JS path) · JS layer · First-paint flash protection (inline preamble) · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **tabbed-code-samples** — What it is · Scaffold · JS layer — 6 lines · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **mutually-exclusive-details** — What it is · Scaffold · Lib functions · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **disclosure-summary-badge** — What it is · Scaffold · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **search-filter-list** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **sticky-table-of-contents** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **click-chip-scroll-pulse** — What it is · Scaffold · JS layer (enhancement) · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **hover-linked-glossary** — What it is · Scaffold · JS layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **breadcrumb-stack** — What it is · Scaffold · Dynamic / API · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **tooltip-on-hover** — Three tiers · Tier 1 — `title=""` baseline · Tier 2 — CSS `::after` tooltip · Tier 3 — JS popover with hover-bridge · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **popover-and-dialog** — Two patterns · `<dialog>` — true modal · `popover` attribute — non-modal disclosure · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **zoom-image-lightbox** — What it is · Scaffold — `popover` version · Scaffold — `:target` fallback · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **before-after-slider** — What it is · Scaffold · JS layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **scroll-snap-deck** — What it is · Scaffold · no-nested-scrollbars exception · JS layer — arrow keys + counter · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **range-slider-with-output** — What it is · Scaffold · JS-enhanced layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **range-double-handle** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **multi-select-with-chips** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **native-dnd-drop-indicator** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **copy-button-on-code-block** — What it is · Scaffold · JS handler · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **contenteditable-live-highlighter** — What it is · Scaffold · JS engine — caret offset save/restore · JS engine — tokenize + re-render + RAF debounce · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **live-diff-sidebar** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **textarea-autosize** — What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **iframe-sandbox-host** — What it is · Scaffold · JS engine — drop snippet, optionally postMessage · Sandbox policy table · Script clone-recreate trick · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
- **inline-svg-illustration-controls** — What it is · Scaffold · JS engine — concept-explainer "ring" · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
