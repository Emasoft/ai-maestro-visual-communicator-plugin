---
name: amvcp-visual-communication
description: "UMBRELLA skill — auto-routes between 13 category skills covering visuals from tokens through diagrams, slides, and prose. Use when the user wants ANY visual added to a document: chart, dashboard, diagram, table, code block, math, slide deck, wireframe, icon, design system, report. Trigger with 'add a chart/diagram/table', 'visualize', 'make a dashboard', 'turn into slides', 'wireframe this', 'render code', 'design tokens', 'restyle', 'render report as HTML', '/amvcp-generate-web-diagram'."
license: MIT
compatibility: "Chromium browser recommended; Python 3.12+ for amvcp-select.py; runtime + designmd + per-category JS libs auto-copied next to each HTML."
metadata:
  author: Emasoft
---

# Visual Communication — Umbrella Routing Skill

## Overview

This is the **routing layer** for the AI Maestro Visual Communicator plugin. The architecture is:

> **1 agent → 13 category skills (+ 6 supporting skills) → 500+ reference files**

You (the agent) load this umbrella whenever you are about to add any visual to a document. It emits no HTML itself — it tells you **which** category skill owns the requested visual and points you at the right SKILL.md + references for the technique.

**Be proactive — render, don't ASCII.** Before emitting an ASCII/box table, indented tree, hand-aligned diagram, fenced "diff", or long bullet hierarchy in chat, route here instead: rows × columns → HTML table; process/architecture → diagram; quantitative comparison → chart; before/after code → diff view. The terminal can't render hierarchy, color, or click-to-act; a generated page can, and it's selectable + comment-able.

## Prerequisites

- Read this SKILL.md to know which of the 13 category skills owns the requested visual.
- The emitted HTML must load the runtime scripts (`amvcp-designmd.js`, `amvcp-runtime.js`, plus the per-category JS lib — the category skills name which to copy next to the page).
- Python 3.12+ for the `amvcp-select.py` opener; iTerm2 for the preview pane.

## Instructions

1. Read the user's request and match it to the decision matrix below.
2. Identify the category skill (one of the 13) that owns the requested visual.
3. Read that category's SKILL.md plus the specific reference file(s) it points to for the technique.
4. Scaffold the HTML per the category's contract (atom IDs, `data-ve-*` attributes, runtime scripts).
5. Run the standard self-debug loop — light + dark theme screenshots, no nested scrollbars, atom contract present.
6. Open the result with the interactive selection runner `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html` (it blocks until the user clicks and returns the selection JSON). For a quick local preview without the selection round-trip, the iTerm-first launcher `scripts/amvcp-show-launcher.py` is also available.

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

There are also supporting skills not in the 13-category routing matrix because they bolt on a specialized engine, design element, or layer rather than scaffold a generic visual: `amvcp-graph-diagrams` (Mermaid + Graphviz alternative engine for the diagram category), `amvcp-choice-tables` (form-mode `<table>` for `data-ve-type="table-form"` only), `amvcp-modal-comments` (the per-element comment-thread layer, mounted by the runtime), `amvcp-math-and-latex` (KaTeX + TikZJax for equations / chemistry / TikZ figures), `amvcp-regex-vis` (the vendored interactive regex visualizer + editor — `.ve-regex`), `amvcp-pierre-diff` (the high-fidelity vendored Pierre diff viewer — Shiki highlight, merge-conflict resolver, huge-file virtualizer; reach for it when `amvcp-code-highlight`'s lightweight diff isn't enough), `amvcp-tokens-contact-sheet` (the DESIGN.md "living design page" sheeting every *token* visually), `amvcp-component-variant-matrix` (a sheet of every size · state · intent of ONE *component* — distinct from the token contact sheet), and the five **interactive-editor skills** from the html-effectiveness import — `amvcp-editor-kanban` (drag triage board → markdown export), `amvcp-editor-toggles` (feature-flag editor + dependency warnings + copy-diff), `amvcp-editor-template` (prompt/template tuner with live {{var}} re-render), `amvcp-anim-sandbox` (live duration/easing tuner for one transition), and `amvcp-concept-demo` (manipulable concept explainer) — each exporting its edited state back through the standard selection round-trip. There is also `amvcp-doc-wiki` (a coordinator that composes prose-pages + tables + interactive-controls + modal-comments into ONE self-contained, hash-routed navigable wiki of a project's TRDD / PRRD / kanban / wikimem markdown — Wikipedia-style cross-file links, browser back/forward, breadcrumb, search).

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
| A **rich/high-fidelity diff** — huge file, merge conflicts, streaming code, accept/reject UI | pierre-diff (vendored Pierre `<diffs-container>`) — use when code-highlight's lightweight diff is not enough |
| A **regex to visualize, explain, debug, or interactively edit** | regex-vis (vendored `.ve-regex` tree + editor) |
| A **tabbed code sample** (JSON / YAML / curl variants) | code-highlight (`tabs` mode) — pairs with interactive-controls for the tab strip |
| A **slide deck** / **presentation** / **pitch** / **talk slides** | slide-decks |
| A **long-form static document** (executive summary, RFC, ADR, postmortem, case study, retro, whitepaper, design-system doc, essay) | prose-pages |
| Any **inline math, equation, chemistry reaction, TikZ figure** | math-and-latex |
| **Tabs / accordion / filter pills / segmented control / kanban / TOC / scroll-spy / theme toggle / search box / lightbox / modal / popover / before-after slider / copy button** | interactive-controls |
| **Entry animation, scroll reveal, count-up, skeleton, parallax, spring, hover lift, SVG line-draw** | animation |
| **The look of the page itself** (color ramp, type scale, elevation, motion tokens, brand preset, anti-slop check) | design-tokens |
| A **set of TRDD / PRRD / kanban / wikimem markdown** files to browse as one cross-linked wiki | doc-wiki (coordinator) |
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

## Scaffolding contract — how the agent uses this skill

The 6-step author-and-run loop (shape → candidates → read category SKILL + refs → emit scaffold → run `amvcp-select.py` → verify both themes) plus the SPEED RULES:
- [scaffolding-contract](./references/scaffolding-contract.md) — the 6-step author-and-run loop (shape match, candidate suggestion, SPEED RULES, scaffold emission, runner, visual verification)
  - [Scaffolding contract](./references/scaffolding-contract.md#scaffolding-contract)

## Phase 2.5 contract — atom-emitting techniques

Every visual MUST surface itself to the runtime as a click-to-select **atom**; the runtime then layers four standard affordances (3-state selection, comment handle, decision-mini pill, leader-line, 9-level text multi-click) on it with zero per-category code:
- [atom-contract](./references/atom-contract.md) — the four runtime affordances, the `data-ve-*` stamp each reads, and the atom cross-references
  - [Phase 2.5 contract](./references/atom-contract.md#phase-25-contract)

## Theme contract

Every scaffold consumes only the `--vc-*` (and a small set of `--ve-*`) CSS custom properties. **Never hardcode a color, font-size, gap, radius, duration, or z-index in any scaffold.** The DESIGN.md engine (`amvcp-designmd.js`) is the single source of truth: a theme swap re-themes every chart, table, diagram, slide, and report on the page with zero re-render. To change the look, edit DESIGN.md — never the scaffold.

The [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) skill owns this vocabulary (13 dual-theme presets, OKLCH color ramp, phi spacing scale, MD3 elevation scale, motion library, 9-level z-index scale, anti-AI-slop gate) — read it once before authoring DESIGN.md from scratch.

## Examples

Three end-to-end worked examples (request → category → scaffold, with the exact markup emitted) are in:
- [worked-examples](./references/worked-examples.md) — chart Q1 revenue → bar; compare three deployment plans → emphasis-column table; implementation plan → slide deck
  - [Example 1 — "chart Q1 revenue by region"](./references/worked-examples.md#example-1--chart-q1-revenue-by-region)
  - [Example 2 — "compare three deployment plans, B is recommended"](./references/worked-examples.md#example-2--compare-three-deployment-plans-b-is-recommended)
  - [Example 3 — "turn this implementation plan into slides"](./references/worked-examples.md#example-3--turn-this-implementation-plan-into-slides)

## Aggressive triggering note

Trigger this umbrella whenever you are about to add ANY visual to a document. The cost of an extra umbrella read is one round-trip; the cost of skipping it is a chart with hardcoded colors, a table with no atom contract, or a diagram authored from scratch when a category ships an off-the-shelf preset for that exact shape. When in doubt, load this skill first.

## Output

A self-contained interactive HTML file at `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`. Stdout from the runner: `{kind:"submit"|"timeout", selections:[{type, data, …}, …]}`.

## Error Handling

- Visual broken in light or dark theme → that's a correctness defect; fix DESIGN.md or the scaffold's token usage, never hardcode a color.
- Runner/render failures (no Chromium, page opened via file://, timeout without a click, `surf` missing, Mermaid/TikZ/MathJax failures, Vercel deploy errors) → see the [troubleshooting](./references/troubleshooting.md) reference (indexed under `## Resources` → [more-references](./references/more-references.md), with its complete section list).
  Complete TOC of `troubleshooting.md`:
  - No Chromium browser found
  - Page opened directly via file:// (not via the runner)
  - Timeout without a click
  - `surf` CLI missing
  - Mermaid render failure
  - TikZ / MathJax silent failures
  - Vercel deploy errors (`/amvcp-share-page`)
  - Always check the browser console first

## Modes

Not applicable directly — this is the umbrella/discovery skill that selects which OTHER skill to delegate to based on content type. It does NOT emit DOM of its own; `data-ve-mode` declarations propagate from whichever sub-skill it selected (R20-R23 of `amvcp-self-debug-rules`).

## Composability

This skill IS the orchestrator — by definition it composes the other amvcp-* skills (R22). The only exclusive sub-skill is the overlay-runtime (R24).

## Resources

The project-root shared references (runtime contract, diagram types, styling guide, anti-patterns, css-patterns, libraries — loaded via `${CLAUDE_PLUGIN_ROOT}/references/`) and the per-skill walk-throughs (authoring-workflow, environment-and-runner, example-flows, troubleshooting, quality-checklist — loaded via `./references/`) are consolidated, each with its own section-list preview, in:
- [more-references](./references/more-references.md) — the project-root shared references + the per-skill walk-throughs, each with its TOC preview
  - [Project-root shared references](./references/more-references.md#project-root-shared-references)
  - [Per-skill walk-throughs](./references/more-references.md#per-skill-walk-throughs)

Sibling skills the umbrella dispatches to (the 13 routing categories live in `## The 13 categories` above with their JS libs + "Owns"; the 9 supporting skills live in [supporting-skills](./references/supporting-skills.md) with their triggers). The flat one-line index across ALL 21 dispatchable skills + `amvcp-self-debug-rules` is in:
- [skill-index](./references/skill-index.md) — every amvcp-* skill the umbrella dispatches to, one line each (the 13 categories, the 9 supporting skills, and the self-debug-rules verification skill)
  - [Sibling-skill index](./references/skill-index.md#sibling-skill-index)
