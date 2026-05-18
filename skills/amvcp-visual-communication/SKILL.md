---
name: amvcp-visual-communication
description: "UMBRELLA skill — auto-routes between 13 category skills covering every visual element a Claude agent can put on a page (design tokens, layout, typography, animation, interactive controls, tables, code highlight, charts/dashboards, diagrams, icon SVGs, wireframes, slide decks, prose pages). Use when the user wants ANY visual added to a document: chart, dashboard, KPI grid, sparkline, diagram, flowchart, sequence, ER, state, mind map, sankey, swimlane, Gantt, architecture, table, sortable table, matrix, comparison, code block, syntax highlight, diff, annotated PR, math, KaTeX, TikZ, slide deck, wireframe, mockup, icon, logo, tabs, accordion, modal, kanban, slider, theme toggle, TOC, lightbox, count-up, scroll reveal, parallax, design system, OKLCH ramp, color palette, type scale, layout grid, executive summary, technical report, RFC, ADR, postmortem, retrospective, design-system doc, essay, QA-check page. Trigger with 'add a chart/diagram/table', 'visualize', 'make a dashboard', 'turn into slides', 'wireframe this', 'render code', 'design tokens', 'restyle', 'render report as HTML', 'commentable page', '/amvcp-generate-web-diagram', '/amvcp-generate-slides', '/amvcp-interactive-report', '/amvcp-diff-review', '/amvcp-fact-check'. Activates aggressively — when in doubt, load this skill first and let it route."
license: MIT
compatibility: "Chromium browser recommended; Python 3.12+ for amvcp-select.py; runtime + designmd + per-category JS libs auto-copied next to each HTML."
metadata:
  author: Emasoft
---

# Visual Communication — Umbrella Routing Skill

## Overview

This is the **routing layer** for the AI Maestro Visual Communicator plugin. The architecture is:

> **1 agent → 13 category skills → ~502 reference files**

You (the agent) load this umbrella whenever you are about to add any visual to a document. It does not emit HTML itself — it tells you **which** category skill owns the visual the user is asking for, and points you at the right SKILL.md + references for the technique you'll scaffold.

## Prerequisites

- Read this SKILL.md to know which of the 13 category skills owns the requested visual.
- The plugin's runtime scripts (`amvcp-designmd.js`, `amvcp-runtime.js`, plus the per-category JS lib) must be loaded by the emitted HTML; the category skills tell you which to copy next to the page.
- For the Python opener (`amvcp-select.py`) and the iTerm preview pane, Python 3.12+ and iTerm2 are needed.

## Instructions

1. Read the user's request and match it to the decision matrix below.
2. Identify the category skill (one of the 13) that owns the requested visual.
3. Read that category's SKILL.md plus the specific reference file(s) it points to for the technique.
4. Scaffold the HTML per the category's contract (atom IDs, `data-ve-*` attributes, runtime scripts).
5. Run the standard self-debug loop — light + dark theme screenshots, no nested scrollbars, atom contract present.
6. Open the result via the iTerm-first launcher (`scripts/amvcp-show-launcher.py`) for the user to inspect.

## The 13 categories

Every category ships its own [SKILL](SKILL.md), a `references/` folder with 30+ technique files, and a single JS library. Re-discovery from a category back to here works via the `Parent umbrella:` line at the top of every category SKILL.md.

| # | Category | JS lib | Owns | Path |
|---|---|---|---|---|
| 1 | **design-tokens** | `scripts/amvcp-tokens.js` (+ `amvcp-token-sheet.js`, `amvcp-tokens.css`) | DESIGN.md tokens, OKLCH/phi/MD3 scales, 13 dual-theme presets, anti-slop gate, contact sheet | [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) |
| 2 | **layout** | `scripts/amvcp-layout.js` (+ `amvcp-layout.css`) | Grids, sidebars, IDE shells, KPI rows, sticky headers, A4 print, hero backgrounds, TOC | [amvcp-layout](../amvcp-layout/SKILL.md) |
| 3 | **typography** | (no dedicated lib — pure CSS via `amvcp-designmd.js`) | Fluid clamp() scale, type roles, font pairings, drop-cap, lists, links, footnotes, kbd | [amvcp-typography](../amvcp-typography/SKILL.md) |
| 4 | **animation** | `scripts/amvcp-animation.js` | Entry, scroll reveal, count-up, skeleton, parallax, spring, SVG draw, hover polish | [amvcp-animation](../amvcp-animation/SKILL.md) |
| 5 | **interactive-controls** | `scripts/amvcp-interactive.js` (+ `amvcp-interactive.css`) | Tabs, accordion, filter pills, kanban, before/after slider, copy button, lightbox, modals | [amvcp-interactive-controls](../amvcp-interactive-controls/SKILL.md) |
| 6 | **tables** | `scripts/amvcp-tables.js` | Sortable, virtualized, matrix/coverage, comparison, CSV export, per-row pills/dots/chips | [amvcp-tables](../amvcp-tables/SKILL.md) |
| 7 | **code-highlight** | `scripts/amvcp-code-highlight.js` (+ `amvcp-code-highlight.css`) | Syntax highlight (7 langs), line numbers, diff (split + unified), PR review, tabbed code | [amvcp-code-highlight](../amvcp-code-highlight/SKILL.md) |
| 8 | **charts-and-dashboards** | `scripts/amvcp-chart.js` | bar/line/area/donut/radar/waterfall/funnel/mekko/heatmap/metric-cards/bullet/gauge/sparkline | [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) |
| 9 | **diagram** | `scripts/amvcp-diagram.js` | Process flow, architecture canvas, phase graph, swimlane, sequence, state, sankey, mind map, Gantt, ASCII | [amvcp-diagram](../amvcp-diagram/SKILL.md) |
| 10 | **icon-svg** | `scripts/amvcp-icon-svg.js` | Inline SVG icons, logos, device frames, clip-path shapes, image hotspots — 1000×1000 grid | [amvcp-icon-svg](../amvcp-icon-svg/SKILL.md) |
| 11 | **wireframe** | `scripts/amvcp-wireframe.js` (+ `amvcp-wireframe.css`) | Lo-fi UI mockups, multi-screen anchor nav, device bezels, fidelity ramp (wire→low→mid→hi) | [amvcp-wireframe](../amvcp-wireframe/SKILL.md) |
| 12 | **slide-decks** | `scripts/amvcp-slide.js` | Presentation HTML — 16 layouts, 5 entrance moods, 4 transitions, fixed-aspect letterbox | [amvcp-slide-decks](../amvcp-slide-decks/SKILL.md) |
| 13 | **prose-pages** (`report-doc`) | `scripts/amvcp-report-doc.js` | Long-form HTML reports — exec summary, RFC, ADR, postmortem, retrospective, plus QA gates | [amvcp-prose-pages](../amvcp-prose-pages/SKILL.md) |

There are also four supporting skills not in the routing matrix because they bolt on rather than scaffold a new visual: `amvcp-graph-diagrams` (Mermaid + Graphviz alternative engine for the diagram category), `amvcp-choice-tables` (form-mode `<table>` for `data-ve-type="table-form"` only), `amvcp-modal-comments` (the per-element comment-thread layer, mounted by the runtime), `amvcp-math-and-latex` (KaTeX + TikZJax for equations / chemistry / TikZ figures).

## Decision matrix — content shape → category

This is the heart of the umbrella. When you're about to add a visual, find the row that matches the user's content shape and route to that category. If two rows match, pick the one with the most specific data shape (a "process with steps" beats a "list of things").

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
| A **tabbed code sample** (JSON / YAML / curl variants) | code-highlight (`tabs` mode) — pairs with interactive-controls for the tab strip |
| A **slide deck** / **presentation** / **pitch** / **talk slides** | slide-decks |
| A **long-form static document** (executive summary, RFC, ADR, postmortem, case study, retro, whitepaper, design-system doc, essay) | prose-pages |
| Any **inline math, equation, chemistry reaction, TikZ figure** | math-and-latex |
| **Tabs / accordion / filter pills / segmented control / kanban / TOC / scroll-spy / theme toggle / search box / lightbox / modal / popover / before-after slider / copy button** | interactive-controls |
| **Entry animation, scroll reveal, count-up, skeleton, parallax, spring, hover lift, SVG line-draw** | animation |
| **The look of the page itself** (color ramp, type scale, elevation, motion tokens, brand preset, anti-slop check) | design-tokens |
| **Page chrome** — sidebar shell, KPI row layout, A4 print, sticky header, hero background, dashboard grid | layout |
| **Type system** — fluid clamp() scale, font pairing, drop-cap, lead, pull quote, footnote, kbd | typography |
| **Render an existing report as a commentable interactive HTML page** | prose-pages (scaffold) + modal-comments (per-element threads) |
| **Auto-discover what visual to use** (the user dumped raw content and said "make it visual") | start with prose-pages (it documents the technique-picker) and route from there |
| **Lint / verify / QA-check an already-rendered page** | prose-pages (it owns `runGates` — nested-scrollbars, contrast, motion, print, semantic, banned-color, banned-font) |

## Scaffolding contract — how the agent uses this skill

1. **Identify the content shape** — read what the user typed plus any pasted data. Match against the decision matrix above.
2. **Suggest 1-3 category candidates** if the shape is ambiguous. State the trade-off in one line each. Wait for the user's pick if the choice is non-obvious.
3. **Read the picked category's [SKILL](SKILL.md)** plus 1–2 of its references (the specific technique you'll use). Do NOT load all 30+ references for the category — progressive discovery means you load only what you need.
4. **Emit the scaffold** — one self-contained HTML file with the runtime + designmd + the category's JS lib loaded in this order: `amvcp-designmd.js` → `amvcp-runtime.js` → category lib (e.g. `amvcp-chart.js`). The category SKILL.md spells out the exact `<figure>`/`<table>`/`<pre>` markup contract.
5. **Run** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html` if the page is interactive (waits for click + returns selection JSON), or just open it for explanatory pages.
6. **Verify visually** per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — light + dark theme screenshots, no nested scrollbars, atom-contract stamps present. Every visual change MUST be screenshot-tested in BOTH themes.

## Phase 2.5 contract — atom-emitting techniques

Every visual the agent emits MUST surface itself to the runtime as a click-to-select **atom**. The runtime then layers four standard affordances on top with zero per-category code:

| Affordance | Stamp on the atom | Reads | Mounted by |
|---|---|---|---|
| **3-state selection** (none → selected → hover preview) | `data-ve-id` + `data-ve-type` | Runtime CSS in `amvcp-runtime.js` | Runtime auto |
| **Comment handle** (28 px gold pill at the figure's left edge) | One+ atoms selected inside a figure | `.ve-comment-handle` class | Runtime auto |
| **Decision-mini pill** (S / A / D — Skip / Approve / Decline, 3-state) | `data-ve-id` on a row / paragraph / chart-point | `.ve-decision-mini-*` classes | Runtime auto |
| **Leader-line** (anchor in prose → visual) | `data-ve-leader-from` / `data-ve-leader-to` | `.ve-leader-line` SVG path | Runtime auto |
| **9-level multi-click for text** (paragraph → sentence → word → char etc.) | Plain prose, no extra stamp | Runtime drag-paint detector | Runtime auto |

Cross-references for the atom contract:
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — the canonical payload + selection model
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-modal-comments/SKILL.md` — the per-element comment-thread layer
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-self-debug-rules/SKILL.md` — visual verification

If a category SKILL.md tells you to emit `<figure data-ve-id="…" data-ve-type="chart">` or `<tr data-ve-id="…" data-ve-type="row">`, that is the atom contract — those stamps make the four affordances above appear automatically.

## Theme contract

Every scaffold consumes only the `--vc-*` (and a small set of `--ve-*`) CSS custom properties. **Never hardcode a color, font-size, gap, radius, duration, or z-index in any scaffold.** The DESIGN.md engine (`amvcp-designmd.js`) is the single source of truth: a theme swap re-themes every chart, table, diagram, slide, and report on the page with zero re-render. To change the look, edit DESIGN.md — never the scaffold.

The `amvcp-design-tokens` skill ([amvcp-design-tokens](../amvcp-design-tokens/SKILL.md)) owns this vocabulary: 13 named dual-theme presets, the OKLCH color ramp, the phi spacing scale, the MD3 elevation scale, the motion library, the 9-level z-index scale, and the consolidated anti-AI-slop gate. Read it once before authoring DESIGN.md from scratch.

## Examples

Worked examples — each shows how the agent matches a user request to one of the 13 categories, loads the right SKILL.md, and emits the canonical scaffold.


### Example 1 — "chart Q1 revenue by region"
1. Match the matrix: "quantitative comparison across categories" → **charts-and-dashboards (`bar`)**.
2. Read [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) plus [chart-bar](../amvcp-charts-and-dashboards/references/chart-bar.md).
3. Emit a fenced `chart:bar@1` block inside a `<figure class="ve-chart">`:
   ```html
   <figure class="ve-chart" data-ve-chart-type="bar"><pre><code class="language-chart:bar@1">
   {"title":"Q1 revenue by region","series":[{"label":"USD","data":[
     {"x":"NA","y":48200},{"x":"EU","y":32100},{"x":"APAC","y":18700},{"x":"LATAM","y":9400}
   ]}]}
   </code></pre></figure>
   ```
4. Load `amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-chart.js`. Open the file. Done.

### Example 2 — "compare three deployment plans, B is recommended"
1. Match the matrix: "comparison of N options" → **tables (`compare` mode)**.
2. Read [amvcp-tables](../amvcp-tables/SKILL.md) plus [comparison-emphasis-column](../amvcp-tables/references/comparison-emphasis-column.md) and [icon-headers-unicode](../amvcp-tables/references/icon-headers-unicode.md).
3. Emit `<table data-ve-table="compare">` with three option `<th>`s carrying `data-ve-col-icon` Unicode glyphs and `data-ve-col-emphasis="1"` on the B column.
4. Load `amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-tables.js`. Done.

### Example 3 — "turn this implementation plan into slides"
1. Match the matrix: "presentation / talk slides / pitch" → **slide-decks**.
2. Read [amvcp-slide-decks](../amvcp-slide-decks/SKILL.md) plus 1–2 layout references for the layouts you'll pick.
3. Emit a single HTML file containing the deck JSON + `amvcp-slide.js`. The renderer auto-letterboxes every slide to a fixed aspect.
4. The same plan could ALSO be emitted as a process-flow diagram (route to **diagram**) if the user wants ONE picture instead of a deck. State the trade-off and let the user pick.

## Aggressive triggering note

Trigger this umbrella whenever you are about to add ANY visual to a document. The cost of an extra umbrella read is one round-trip; the cost of skipping it is shipping a chart with hardcoded colors, a table with no atom contract, or a diagram in a category that ships an off-the-shelf preset for exactly the shape the user asked for. When in doubt, load this skill first.

## Cross-skill references

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — runtime contract, selection payload, atom stamps
- `${CLAUDE_PLUGIN_ROOT}/references/diagram-types.md` — every diagram archetype the plugin supports
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — aesthetic directions, typography + color, surfaces + hierarchy
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — the slop test, banned colors, banned fonts
- `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md` — theme + atmosphere, layout, content blocks, visual components
- `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` — when (and when NOT) to reach for Mermaid, Chart.js, anime.js, Google Fonts
- [authoring-workflow](./references/authoring-workflow.md) — the 5-step author-and-run loop in long form
  > Step 1 — Pick a direction (5 seconds) · Step 2 — Read the reference material · Step 3 — Author the page · Step 4 — Open with the interactive runner (always) · Step 5 — React to the selection · Output: file location, format, stdout shape
- [environment-and-runner](./references/environment-and-runner.md) — `amvcp-select.py` CLI, env vars, optional deps
  > Prerequisites · Environment variables · Runner CLI · Timeout knob — explanatory vs interrogative pages · Optional dependencies · External libraries (CDN, optional)
- [example-flows](./references/example-flows.md) — four end-to-end flows (architecture, comparison, agent report, slide deck)
  > Example 1 — Quick architecture diagram · Example 2 — Comparison table that asks a question · Example 3 — Agent report as a commentable interactive page · Example 4 — Slide deck from a plan
- [troubleshooting](./references/troubleshooting.md) — Chromium missing, file:// direct, timeouts, render failures
  > No Chromium browser found · Page opened directly via file:// (not via the runner) · Timeout without a click · `surf` CLI missing · Mermaid render failure · TikZ / MathJax silent failures · Vercel deploy errors (`/amvcp-share-page`) · Always check the browser console first
- [quality-checklist](./references/quality-checklist.md) — squint test, swap test, both themes, no overflow, anti-patterns
  > The squint test · The swap test · Both themes · Information completeness · No overflow · Mermaid zoom controls · No anti-patterns · File opens cleanly

## Output

A self-contained interactive HTML file at `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`. Stdout from the runner: `{kind:"submit"|"timeout", selections:[{type, data, …}, …]}`.

## Error Handling

- No Chromium → falls back to default browser; auto-close may not fire (click the page's Done button).
- Page opened directly via file:// → the selection POST is lost; always run via `amvcp-select.py`.
- Timeout without a click → raise `--timeout`; default is short on purpose for question-shaped pages.
- Visual broken in light or dark theme → that's a correctness defect; fix DESIGN.md or the scaffold's token usage, never hardcode a color.

## Modes

Not applicable directly — this is the umbrella/discovery skill that selects which OTHER skill to delegate to based on content type. It does NOT emit DOM of its own; `data-ve-mode` declarations propagate from whichever sub-skill it selected (R20-R23 of `amvcp-self-debug-rules`).

## Composability

This skill IS the orchestrator — by definition it composes the other amvcp-* skills (R22). The only exclusive sub-skill is the overlay-runtime (R24).

## Resources

Project-root shared references (loaded via `${CLAUDE_PLUGIN_ROOT}/references/`):

- [interactive-selection-base](../../references/interactive-selection-base.md) — runtime contract, selection payload, atom stamps
- [diagram-types](../../references/diagram-types.md) — every diagram archetype the plugin supports
- [styling-guide](../../references/styling-guide.md) — aesthetic directions, typography + color, surfaces + hierarchy
- [anti-patterns](../../references/anti-patterns.md) — the slop test, banned colors, banned fonts
- [css-patterns](../../references/css-patterns.md) — theme + atmosphere, layout, content blocks, visual components
- [libraries](../../references/libraries.md) — when (and when NOT) to reach for Mermaid, Chart.js, anime.js, Google Fonts

Per-skill walk-throughs (loaded via `./references/`):

- [authoring-workflow](./references/authoring-workflow.md) — the 5-step author-and-run loop in long form
  > Step 1 — Pick a direction (5 seconds) · Step 2 — Read the reference material · Step 3 — Author the page · Step 4 — Open with the interactive runner (always) · Step 5 — React to the selection · Output: file location, format, stdout shape
- [environment-and-runner](./references/environment-and-runner.md) — `amvcp-select.py` CLI, env vars, optional deps
  > Prerequisites · Environment variables · Runner CLI · Timeout knob — explanatory vs interrogative pages · Optional dependencies · External libraries (CDN, optional)
- [example-flows](./references/example-flows.md) — four end-to-end flows (architecture, comparison, agent report, slide deck)
  > Example 1 — Quick architecture diagram · Example 2 — Comparison table that asks a question · Example 3 — Agent report as a commentable interactive page · Example 4 — Slide deck from a plan
- [troubleshooting](./references/troubleshooting.md) — Chromium missing, file:// direct, timeouts, render failures
  > No Chromium browser found · Page opened directly via file:// (not via the runner) · Timeout without a click · `surf` CLI missing · Mermaid render failure · TikZ / MathJax silent failures · Vercel deploy errors (`/amvcp-share-page`) · Always check the browser console first
- [quality-checklist](./references/quality-checklist.md) — squint test, swap test, both themes, no overflow, anti-patterns
  > The squint test · The swap test · Both themes · Information completeness · No overflow · Mermaid zoom controls · No anti-patterns · File opens cleanly

Sibling skills the umbrella dispatches to (loaded via plugin skill index):

- [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) — DESIGN.md token vocabulary + 13 presets + anti-slop gate
- [amvcp-layout](../amvcp-layout/SKILL.md) — grids, sidebars, IDE shells, KPI rows, sticky headers
- [amvcp-typography](../amvcp-typography/SKILL.md) — fluid type scale, drop-cap, lists, footnotes, kbd
- [amvcp-animation](../amvcp-animation/SKILL.md) — entry, scroll-reveal, count-up, skeleton, parallax, spring
- [amvcp-interactive-controls](../amvcp-interactive-controls/SKILL.md) — tabs, accordion, filter pills, kanban, copy-button
- [amvcp-tables](../amvcp-tables/SKILL.md) — sortable, matrix, comparison, CSV export
- [amvcp-code-highlight](../amvcp-code-highlight/SKILL.md) — syntax highlight, line numbers, diff, PR review
- [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) — bar/line/donut/radar/funnel/heatmap/sparkline
- [amvcp-diagram](../amvcp-diagram/SKILL.md) — process flow, architecture canvas, sankey, mind map, Gantt
- [amvcp-icon-svg](../amvcp-icon-svg/SKILL.md) — inline SVG icons, device frames, image hotspots
- [amvcp-wireframe](../amvcp-wireframe/SKILL.md) — lo-fi UI mockups, fidelity ramp
- [amvcp-slide-decks](../amvcp-slide-decks/SKILL.md) — presentation HTML, 16 layouts, 4 transitions
- [amvcp-prose-pages](../amvcp-prose-pages/SKILL.md) — long-form HTML reports, RFC / ADR / postmortem shapes
- [amvcp-graph-diagrams](../amvcp-graph-diagrams/SKILL.md) — Mermaid + Graphviz alternative engine
- [amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) — per-element comment-thread layer
- [amvcp-math-and-latex](../amvcp-math-and-latex/SKILL.md) — KaTeX + TikZJax for equations / figures
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — R1-R41 verification rules every skill must pass
