# Decision matrix — content shape → category

## Table of Contents

- [Decision matrix — content shape → category](#decision-matrix--content-shape--category)

## Decision matrix — content shape → category

This is the heart of the umbrella. When you're about to add a visual, find the row that matches the user's content shape and route to that category. If two rows match, pick the one with the most specific data shape (a "process with steps" beats a "list of things"). The category names here map 1:1 onto the [`## The 13 categories`](../SKILL.md) table (JS lib + "Owns" + path) and the supporting skills in [supporting-skills](./supporting-skills.md).

| If the user's content is … | Route to |
|---|---|
| A **data table** with rows × cols, possibly sortable | tables |
| A **comparison** of N options (before/after, anti-pattern→fix, plan A vs B vs C) | tables (`compare` mode) |
| A **coverage matrix** — N items × M criteria with pass/fail/partial | tables (`matrix` mode) |
| **Hundreds+ rows** of tabular data | tables (`virtual` mode) |
| A **form-style table** asking the user to pick (radio/checkbox per row) | choice-tables (NOT tables) |
| A **quantitative comparison** across categories (one number per category) | charts-and-dashboards (`bar`) |
| A **trend over time** | charts-and-dashboards (`line` / `area` / `step-area`) |
| A **part-of-whole** breakdown | charts-and-dashboards (`donut` / `segmented-bar` / `mekko`) — never `pie` (auto-remapped) |
| **KPIs at the top of a status report** | charts-and-dashboards (`metric-cards`) |
| A **conversion funnel** or stage drop-off | charts-and-dashboards (`funnel`) |
| A **profit bridge** / cumulative gain-loss | charts-and-dashboards (`waterfall`) |
| A **2-D intensity grid** (errors by hour × weekday, GitHub contributions) | charts-and-dashboards (`heatmap` / `activity-heatmap`) |
| **Multi-criterion radar** (compare items on N axes) | charts-and-dashboards (`radar` / `harvey-ball`) |
| A **value vs target** | charts-and-dashboards (`bullet` / `gauge`) |
| **Process steps** with order (linear or branching) | diagram (`process-flow`) |
| **System architecture** (services / data stores / external) | diagram (`architecture-canvas`) |
| **Phases with dependencies** | diagram (`phase-graph` + chain-highlight) |
| **Sequence / interaction over time between actors** | diagram (`sequence`) or graph-diagrams (Mermaid `sequenceDiagram`) |
| **State machine** (states + transitions) | diagram (`state-machine`) or graph-diagrams (Mermaid `stateDiagram`) |
| **Sankey / proportional flow bands** | diagram (`sankey-flow-diagram`) |
| **Tree** (org chart, file tree, taxonomy) or **mind map** | diagram (`tree-hierarchy` / `mind-map-radial`) |
| **Timeline / Gantt / roadmap** | diagram (`timeline-diagram` / `gantt-style-bars`) |
| **Auto-layout graph with 9+ nodes** (Mermaid terse syntax preferred) | graph-diagrams (Mermaid / Graphviz) |
| A **UI mockup / lo-fi screen / clickable prototype** | wireframe |
| A **device frame** (iPhone / Android / browser / Mac) around content | wireframe (frame only) or icon-svg (frame as art) or layout (page-level mockup) |
| An **inline icon, logo, SVG glyph** | icon-svg |
| An **annotated image with hotspots** | icon-svg (hotspot mode) |
| A **code block** with syntax highlight | code-highlight |
| A **diff** (split or unified) / **PR review** | code-highlight (`diff` mode) |
| A **rich/high-fidelity diff** — huge file, merge conflicts, streaming code, accept/reject UI | pierre-diff (vendored Pierre `<diffs-container>`) — use when code-highlight's lightweight diff is not enough |
| A **regex to visualize, explain, debug, or interactively edit** | regex-vis (vendored `.ve-regex` tree + editor) |
| A **tabbed code sample** (JSON / YAML / curl variants) | code-highlight (`tabs` mode) — pairs with interactive-controls for the tab strip |
| A **slide deck** / **presentation** / **pitch** / **talk slides** | slide-decks |
| A **long-form static document** (executive summary, RFC, ADR, postmortem, case study, retro, whitepaper, design-system doc, essay) | prose-pages |
| Any **inline math, equation, chemistry reaction, TikZ figure** | math-and-latex |
| **Tabs / accordion / filter pills / segmented control / kanban / TOC / scroll-spy / theme toggle / search box / lightbox / modal / popover / before-after slider / copy button** | interactive-controls |
| **Entry animation, scroll reveal, count-up, skeleton, parallax, spring, hover lift, SVG line-draw** | animation |
| **The look of the page itself** (color ramp, type scale, elevation, motion tokens, brand preset, anti-slop check) | design-tokens |
| **Every state / size / variant of ONE component on a sheet** (button states, card treatments, input sizes × states) | component-variant-matrix |
| A **drag triage board** the USER reorders + exports (Now/Next/Later/Cut tickets → markdown) | editor-kanban |
| A **feature-flag editor** (grouped toggles, dependency warnings, copy-diff export) | editor-toggles |
| A **prompt/template tuner** (editable {{var}} slots, live re-render, export template+values) | editor-template |
| An **animation sandbox** (one transition isolated, live duration/easing sliders, export tuned values) | anim-sandbox |
| A **manipulable concept demo** (param sliders driving a live SVG + values table + glossary) | concept-demo |
| **Compare N code APPROACHES side-by-side with trade-offs** | tables (`approaches-comparison` reference) + code-highlight |
| **Page chrome** — sidebar shell, KPI row layout, A4 print, sticky header, hero background, dashboard grid | layout |
| **Type system** — fluid clamp() scale, font pairing, drop-cap, lead, pull quote, footnote, kbd | typography |
| **Render an existing report as a commentable interactive HTML page** | prose-pages (scaffold) + modal-comments (per-element threads) |
| **Auto-discover what visual to use** (the user dumped raw content and said "make it visual") | start with prose-pages (it documents the technique-picker) and route from there |
| **Lint / verify / QA-check an already-rendered page** | prose-pages (it owns `runGates` — nested-scrollbars, contrast, motion, print, semantic, banned-color, banned-font) |
