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

There are also **supporting skills** outside this routing matrix — they bolt on a specialized engine, design element, or layer (Mermaid/Graphviz, form-tables, modal-comments, KaTeX/TikZ math, regex-vis, Pierre diff, token/component sheets) plus five interactive-editor skills, rather than scaffold a generic visual. What each adds + when to reach for it (and each one's path) is in [supporting-skills](./references/supporting-skills.md); they also appear in the `## Resources` sibling-skill index below.
- [supporting-skills](./references/supporting-skills.md) — the supporting skills (engines / elements / layers), what each adds, and the trigger to reach for it
  - [Supporting skills](./references/supporting-skills.md#supporting-skills)

## Decision matrix — content shape → category

This is the heart of the umbrella: a ~52-row lookup mapping the user's content shape to the owning category (every name resolves in the `## The 13 categories` table above). When you're about to add a visual, find the row that matches the content shape and route there. If two rows match, pick the most specific data shape (a "process with steps" beats a "list of things"). The full matrix lives in the reference (moved here verbatim to keep this routing layer scannable):
- [decision-matrix](./references/decision-matrix.md) — content shape → category, the complete ~52-row lookup
  - [Decision matrix — content shape → category](./references/decision-matrix.md#decision-matrix--content-shape--category)

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
