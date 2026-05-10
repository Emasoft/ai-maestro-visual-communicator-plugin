---
name: amvcp-visual-communication
description: "Generate beautiful, self-contained interactive HTML pages — diagrams, diff reviews, plan reviews, slide decks, data tables, and modal-comment agent reports. Use when the user asks for a diagram, architecture overview, diff review, comparison, or any visual explanation, or proactively for ASCII tables with 4+ rows or 3+ columns. Trigger with /amvcp-generate-web-diagram, /amvcp-diff-review, /amvcp-generate-slides, or requests like \"make a diagram\" or \"render as HTML\"."
license: MIT
compatibility: "Requires a browser (Chromium-based browser strongly recommended for auto-close on click). Python 3.12+ for the selection runner."
metadata:
  author: Emasoft
---

# Visual Communication

## Overview

Generate self-contained interactive HTML pages — never ASCII art. User clicks an element, browser closes, selection returns, you ask what to do. **Proactive**: 4+ rows or 3+ columns auto-renders as HTML. Two flows: single-shot selection (default) and per-finding modal-comment threads (switch below).

## Prerequisites

Python 3.12+, Chromium, runtime, 5 env vars, runner — `./references/environment-and-runner.md`.

## Instructions

1. Pick direction (visual default, aesthetic + audience). → `./references/authoring-workflow.md`
2. Read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` always, plus per-engine cookbooks.
3. Author one self-contained `.html` with the 6-item mandatory boilerplate.
4. Open with runner: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. Never `open`/`xdg-open`.
5. React to selection — branch `selections[]` (new) vs `id` (legacy); recap labels, ask what to do.

### Choosing a rendering approach

| Content | Approach | Why |
|---|---|---|
| Architecture (text-heavy) | CSS Grid cards + arrows | Rich card content needs CSS |
| Architecture (topology) | **Mermaid** | Edges need auto-routing |
| Flowchart / pipeline | **Mermaid** | Auto node + edge routing |
| Sequence diagram | **Mermaid** `sequenceDiagram` | Lifelines need auto-layout |
| Data flow | **Mermaid** + edge labels | Connections + descriptions |
| ER / schema | **Mermaid** `erDiagram` | Relationship lines |
| State machine | **Mermaid** `stateDiagram-v2` | Labeled transitions |
| Mind map | **Mermaid** `mindmap` | Hierarchical branching |
| Class diagram | **Mermaid** `classDiagram` | Inheritance lines |
| C4 architecture | **Mermaid** `graph TD` + `subgraph` | Native `C4Context` ignores themes |
| Data table | HTML `<table>` | Semantics + accessibility |
| Timeline | CSS (line + cards) | Linear, no engine needed |
| Dashboard | CSS Grid + Chart.js | Cards with embedded charts |

### Modal-comment switch (v2/v3)

"Make commentable", "reply per finding", "interactive report", or an attached agent report → v2 flow. See `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-modal-comments/SKILL.md` + `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md`.

### Available commands

| Command | What it does |
|---|---|
| `amvcp-generate-web-diagram` | HTML diagram for any topic |
| `amvcp-generate-visual-plan` | Visual implementation plan |
| `amvcp-generate-slides` | Magazine-quality slide deck |
| `amvcp-diff-review` | Visual diff + architecture compare |
| `amvcp-plan-review` | Plan vs codebase + risk assessment |
| `amvcp-project-recap` | Mental-model snapshot for context-switch |
| `amvcp-fact-check` | Verify document against actual code |
| `amvcp-interactive-report` | Agent report → interactive HTML (v2 renderer) |
| `amvcp-respond-to-comment` | Watch queue, write per-turn replies (v2 responder) |
| `amvcp-share-page` | Deploy to Vercel for live URL |

## Output

See `./references/authoring-workflow.md` (file location, format, runner JSON).

## Error Handling

See `./references/troubleshooting.md` (8-case error matrix).

## Examples

See `./references/example-flows.md` (4 worked end-to-end flows).

## Quality Checks

See `./references/quality-checklist.md` (8-item pre-delivery checklist).

## Resources

**Shared `${CLAUDE_PLUGIN_ROOT}/references/`:** `anti-patterns`, `comment-chat-box`, `css-patterns`, `diagram-types`, `interactive-selection-base`, `libraries`, `runtime-bug-patterns`, `styling-guide`.

**Local `./references/`:** `authoring-workflow`, `environment-and-runner`, `example-flows`, `quality-checklist`, `troubleshooting`.

**Sub-skills:** `amvcp-graph-diagrams`, `amvcp-charts-and-dashboards`, `amvcp-math-and-latex`, `amvcp-choice-tables`, `amvcp-modal-comments`, `amvcp-slide-decks`, `amvcp-share-pages`, `amvcp-prose-pages`, `amvcp-regex-vis`.
