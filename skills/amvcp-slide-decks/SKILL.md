---
name: amvcp-slide-decks
description: "Author magazine-quality slide decks as one self-contained interactive HTML file: opt-in 100dvh viewport, no scroll, larger typography, 10 slide types, cinematic transitions, 4 curated presets. Use when the user asks for a presentation, slide deck, talk slides, pitch deck, or to turn a plan into slides. Trigger with 'slide deck', 'presentation', 'pitch deck', 'turn this into slides', '/amvcp-generate-slides', or '--slides'."
license: MIT
metadata:
  author: Emasoft
---

# Slide Decks

## Overview

Opt-in slide deck mode. Activate only on explicit request (`/amvcp-generate-slides`, `--slides`, or "slide deck"/"pitch deck"). Each slide is exactly `100dvh`, no inner scroll, typography 2-3x larger than pages. 10 slide types: cover, section divider, content, split, diagram, dashboard, table, code, quote, full-bleed. Pick ONE of 4 curated presets per deck - mixing breaks the feel.

| Preset | Fit |
|--------|-----|
| Midnight Editorial | Investor: dark navy + gold serif |
| Warm Signal | Workshops: terracotta + sage on cream |
| Terminal Mono | Technical: green on near-black mono |
| Swiss Clean | Design / data: high-contrast B/W sans |

## Prerequisites

- Browser (Chromium for `--app=URL`) and Python 3.12+ for `scripts/amvcp-select.py`.
- `SlideEngine` JS already vendored in `scripts/amvcp-runtime.js`.
- Optional: `surf` CLI (`which surf`) for AI illustrations and full-bleed backgrounds.

## Instructions

1. Read [slide-deck-mode](./references/slide-deck-mode.md) and [slide-patterns](./references/slide-patterns.md) before any HTML.
2. Inventory the source: every section, decision, row, spec, collapsible. Map each to one or more slides; never drop content to fit a slide budget.
3. Pick ONE preset and commit.
4. Author every section as a slide from `templates/slide-deck.html`. Vary spatial composition across consecutive slides. Stamp `data-ve-id`, `data-ve-type="slide"`, `data-ve-label` on each `<section class="slide">`.
5. Set `--ve-accent` on `:root`. Add `<script src="amvcp-runtime.js"></script>` at end of `<body>`. On `DOMContentLoaded` (after Mermaid/Chart.js render): `autoFit()` then `new SlideEngine()`.
6. Run with `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <deck>.html`.

## Output

A single `.html` file with all slides inline and the runtime referenced (or inlined for portability). When opened by the runner, clicking any element emits a JSON selection payload to stdout and closes the window.

## Error Handling

- Use `100dvh`, never `100vh`: mobile address bars resize `vh` and break slides.
- Mixing 2+ presets reads as indecision. Pick one.
- Reserve cinematic transitions (anime.js) for 1-2 emphasis slides; default fade-in is enough.

## Examples

1. Turn a 12-section plan into a 22-slide Midnight Editorial deck: cover + 12 dividers + 1-2 content/diagram slides per section + closing summary.
2. Convert a 6-decision PR review into a Swiss Clean deck where every decision is its own split slide (rationale left, diff right).

## Resources

- [interactive-selection-base](../../references/interactive-selection-base.md): selection wire format
  - boilerplate; payload; selectable; routing; runner; anti-patterns; inlining
- [styling-guide](../../references/styling-guide.md): palette + typography
  - aesthetics; typography; palette; surfaces; backgrounds; animation; Mermaid; AI images
- [css-patterns](../../references/css-patterns.md): Mermaid, overflow, components
  - theme; cards; code; trees; overflow; Mermaid; grids; connectors; KPI; diff; collapsibles; prose; images
- [slide-deck-mode](./references/slide-deck-mode.md): when to switch, completeness, `--slides`
  - when to use; completeness; slide types; variety; presets; --slides flag
- [slide-patterns](./references/slide-patterns.md): engine, 10 types, transitions, nav, presets
  - planning; engine; typography; transitions; nav; SlideEngine; auto-fit; layouts; SVG; imagery; readability; density; breakpoints; presets
