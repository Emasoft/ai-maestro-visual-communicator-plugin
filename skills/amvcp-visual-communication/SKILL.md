---
name: amvcp-visual-communication
description: "Coordinator skill that generates interactive HTML pages (diagrams, dashboards, slide decks, modal-comment reports) and dispatches to 9 sub-skills. Use when the user asks for any visual explanation, or proactively for ASCII tables with 4+ rows. Trigger with /amvcp-generate-web-diagram, /amvcp-diff-review, /amvcp-generate-slides, or phrases like \"make a diagram\"."
license: MIT
compatibility: "Chromium browser recommended; Python 3.12+ for runner; runtime auto-copied next to each HTML."
metadata:
  author: Emasoft
---

# Visual Communication (Coordinator)

## Overview

Generates self-contained interactive HTML — never ASCII. Runner blocks until click; runtime auto-copied. Proactive on 4+ rows / 3+ cols. Dispatches to 9 sub-skills.

## Prerequisites

Chromium + Python 3.12+. See environment-and-runner.

## Instructions

1. Pick direction.
2. Read interactive-selection-base + per-engine cookbook.
3. Author one self-contained `.html`.
4. Run: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.
5. React on `selections[]`.

## Output

HTML in `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`. Stdout: `{selections:[...]}`.

## Error Handling

- No Chromium → default browser; auto-close may not fire.
- file:// direct → payload lost; use runner.
- Timeout → raise `--timeout`.

## Examples

**Input:** "Make an architecture diagram"
**Output:** picks amvcp-graph-diagrams → Mermaid → click → `{kind:"submit", selections:[...]}`.

## Resources

- [interactive-selection-base](../../references/interactive-selection-base.md)
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [diagram-types](../../references/diagram-types.md)
  - Diagrams (Mermaid + CSS)
  - Data Visualizations
  - Documentation Layouts
  - Prose Accent Elements
- [styling-guide](../../references/styling-guide.md)
  - Aesthetic directions
  - Typography & Color
  - Surfaces, Hierarchy & Animation
  - Engines & Illustrations
- [anti-patterns](../../references/anti-patterns.md)
  - Typography
  - Color Palette
  - Section Headers
  - Layout & Hierarchy
  - Template Patterns
  - The Slop Test
- [css-patterns](../../references/css-patterns.md)
  - Theme & Atmosphere
  - Layout & Containers
  - Content Blocks
  - Visual Components
  - Prose Page Elements
- [libraries](../../references/libraries.md)
  - Mermaid.js — Diagramming Engine
  - Chart.js — Data Visualizations
  - anime.js — Orchestrated Animations
  - Google Fonts — Typography
- [authoring-workflow](./references/authoring-workflow.md)
  - Step 1 — Pick a direction (5 seconds)
  - Step 2 — Read the reference material
  - Step 3 — Author the page
  - Step 4 — Open with the interactive runner (always)
  - Step 5 — React to the selection
  - Output: file location, format, stdout shape
- [environment-and-runner](./references/environment-and-runner.md)
  - Prerequisites
  - Environment variables
  - Runner CLI
  - Timeout knob — explanatory vs interrogative pages
  - Optional dependencies
- [example-flows](./references/example-flows.md)
  - Example 1 — Quick architecture diagram
  - Example 2 — Comparison table that asks a question
  - Example 3 — Agent report as a commentable interactive page
  - Example 4 — Slide deck from a plan
- [troubleshooting](./references/troubleshooting.md)
  - No Chromium browser found
  - Page opened directly via file:// (not via the runner)
  - Timeout without a click
  - `surf` CLI missing
  - Mermaid render failure
  - TikZ / MathJax silent failures
  - Vercel deploy errors (`/amvcp-share-page`)
  - Always check the browser console first
- [quality-checklist](./references/quality-checklist.md)
  - The squint test
  - The swap test
  - Both themes
  - Information completeness
  - No overflow
  - Mermaid zoom controls
  - No anti-patterns
  - File opens cleanly
