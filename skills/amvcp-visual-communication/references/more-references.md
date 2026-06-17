# More references — shared + per-skill walk-throughs

## Table of Contents

- [Project-root shared references](#project-root-shared-references)
- [Per-skill walk-throughs](#per-skill-walk-throughs)

## Project-root shared references

Loaded via `${CLAUDE_PLUGIN_ROOT}/references/`. Each file's own complete `## Table of Contents` is in the file; the one-line previews below are the section list.

- [interactive-selection-base](../../../references/interactive-selection-base.md) — runtime contract, selection payload, atom stamps
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
- [diagram-types](../../../references/diagram-types.md) — every diagram archetype the plugin supports
  > Diagrams (Mermaid + CSS) · Data Visualizations · Documentation Layouts · Prose Accent Elements
- [styling-guide](../../../references/styling-guide.md) — aesthetic directions, typography + color, surfaces + hierarchy
  > Aesthetic directions · Typography & Color · Surfaces, Hierarchy & Animation · Engines & Illustrations
- [anti-patterns](../../../references/anti-patterns.md) — the slop test, banned colors, banned fonts
  > Typography · Color Palette · Section Headers · Layout & Hierarchy · Template Patterns · The Slop Test
- [css-patterns](../../../references/css-patterns.md) — theme + atmosphere, layout, content blocks, visual components
  > Theme & Atmosphere · Layout & Containers · Visual Components · Prose Page Elements · Generated Images
- [libraries](../../../references/libraries.md) — when (and when NOT) to reach for Mermaid, Chart.js, anime.js, Google Fonts
  > Mermaid.js — Diagramming Engine · Chart.js — Data Visualizations · anime.js — Orchestrated Animations · Google Fonts — Typography

## Per-skill walk-throughs

Loaded via `./references/` next to the umbrella SKILL.md.

- [authoring-workflow](./authoring-workflow.md) — the 5-step author-and-run loop in long form
  > Step 1 — Pick a direction (5 seconds) · Step 2 — Read the reference material · Step 3 — Author the page · Step 4 — Open with the interactive runner (always) · Step 5 — React to the selection · Output: file location, format, stdout shape
- [environment-and-runner](./environment-and-runner.md) — `amvcp-select.py` CLI, env vars, optional deps
  > Prerequisites · Environment variables · Runner CLI · Timeout knob — explanatory vs interrogative pages · Optional dependencies · External libraries (CDN, optional)
- [example-flows](./example-flows.md) — four end-to-end flows (architecture, comparison, agent report, slide deck)
  > Example 1 — Quick architecture diagram · Example 2 — Comparison table that asks a question · Example 3 — Agent report as a commentable interactive page · Example 4 — Slide deck from a plan
- [troubleshooting](./troubleshooting.md) — Chromium missing, file:// direct, timeouts, render failures
  > No Chromium browser found · Page opened directly via file:// (not via the runner) · Timeout without a click · `surf` CLI missing · Mermaid render failure · TikZ / MathJax silent failures · Vercel deploy errors (`/amvcp-share-page`) · Always check the browser console first
- [quality-checklist](./quality-checklist.md) — squint test, swap test, both themes, no overflow, anti-patterns
  > The squint test · The swap test · Both themes · Information completeness · No overflow · Mermaid zoom controls · No anti-patterns · File opens cleanly
