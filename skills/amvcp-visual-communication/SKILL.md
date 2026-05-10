---
name: amvcp-visual-communication
description: "Coordinator skill that generates interactive HTML pages (diagrams, dashboards, slide decks, modal-comment reports) and dispatches to 9 sub-skills. Use when the user asks for a diagram, chart, slide deck, comparison, agent report, regex viz, or any visual explanation, or proactively for ASCII tables with 4+ rows or 3+ cols. Trigger with /amvcp-generate-web-diagram, /amvcp-diff-review, /amvcp-generate-slides, or phrases like \"make a diagram\"."
license: MIT
compatibility: "Chromium browser recommended; Python 3.12+ for runner; runtime auto-copied next to each HTML."
metadata:
  author: Emasoft
---

# Visual Communication (Coordinator)

## Overview

Generate self-contained interactive HTML — never ASCII art. Every page is interactive: the runner blocks until a click; the runtime is auto-copied next to the HTML. **Proactive**: 4+ rows or 3+ cols auto-renders. Two flows: single-shot select (default) and per-finding modal-comment (v2/v3).

### Sub-skills

- amvcp-graph-diagrams — Mermaid + Graphviz
- amvcp-charts-and-dashboards — Chart.js
- amvcp-math-and-latex — KaTeX, mhchem, TikZJax
- amvcp-choice-tables — table-form Q&A
- amvcp-modal-comments — v2/v3 agent-report flow
- amvcp-slide-decks — slide decks
- amvcp-share-pages — Vercel deploy
- amvcp-prose-pages — article-style pages
- amvcp-regex-vis — regex visualizer

## Prerequisites

Chromium-based browser (recommended), Python 3.12+, runtime auto-copied. See environment-and-runner for prerequisites, env vars, runner CLI, timeout knob, optional deps, external libs.

## Instructions

1. **Pick direction** — visual default + aesthetic + audience.
2. **Read references** — always interactive-selection-base + per-engine cookbooks.
3. **Author HTML** — one self-contained `.html` with the 6-item boilerplate. See authoring-workflow for steps 1–5.
4. **Run** — `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. Never `open`/file://.
5. **React** — branch `selections[]` (new) vs `id` (legacy); recap, ask what to do.

## Output

- **Location**: `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`
- **Format**: single self-contained HTML (CSS + JS + runtime inlined or sibling)
- **Stdout**: one-line JSON `{selections:[...], id?, label?}` from runner
- See authoring-workflow §Output and example-flows.

## Error Handling

- **No Chromium** — falls back to system default; auto-close may not fire.
- **file:// direct open** — payload never returns; always use the runner.
- **Timeout without click** — non-zero exit; rerun with `--timeout` raised.
- Full matrix — see troubleshooting.

## Examples

1. *"Make me an architecture diagram"* → picks **amvcp-graph-diagrams** → Mermaid `graph TD` → runner opens → user clicks a node → label returned.
2. *"Turn this agent report into a commentable page"* → picks **amvcp-modal-comments** → v2/v3 modal threads per finding → responder watches the queue.

Quality gate — see quality-checklist.

## Resources

- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format
- [diagram-types](../../references/diagram-types.md) — visual catalogue
- [styling-guide](../../references/styling-guide.md) — aesthetics, palette
- [anti-patterns](../../references/anti-patterns.md) — author-error catalogue
- [css-patterns](../../references/css-patterns.md) — components, grids
- [libraries](../../references/libraries.md) — CDN list, fonts
- [authoring-workflow](./references/authoring-workflow.md) — 5-step flow
- [environment-and-runner](./references/environment-and-runner.md) — runner CLI
- [example-flows](./references/example-flows.md) — examples
- [troubleshooting](./references/troubleshooting.md) — error matrix
- [quality-checklist](./references/quality-checklist.md) — pre-ship gate
