---
name: amvcp-slide-decks
description: "Author magazine-quality slide decks as one self-contained interactive HTML file: opt-in 100dvh viewport, no scroll, larger typography, 10 slide types, cinematic transitions, 4 curated presets. Use when the user asks for a presentation, slide deck, talk slides, pitch deck, or to turn a plan into slides. Trigger with 'slide deck', 'presentation', 'pitch deck', 'turn this into slides', '/amvcp-generate-slides', or '--slides'."
license: MIT
metadata:
  author: Emasoft
---

# Slide Decks

## Overview

Opt-in slide deck mode. Activate only on explicit request. Each slide exactly `100dvh`, no inner scroll, typography 2-3x larger. 10 slide types: cover, divider, content, split, diagram, dashboard, table, code, quote, full-bleed. Pick ONE of 4 curated presets: Midnight Editorial (investor), Warm Signal (workshop), Terminal Mono (technical), Swiss Clean (design/data).

## Prerequisites

Chromium + Python 3.12+; `SlideEngine` vendored in runtime; optional `surf` CLI.

## Instructions

1. Read slide-deck-mode + slide-patterns first.
2. Inventory source: never drop content to fit slide budget.
3. Pick ONE preset, commit.
4. Author each section as `<section class="slide">` with `data-ve-id`, `data-ve-type="slide"`, `data-ve-label`. Vary composition.
5. `--ve-accent` on `:root`. On `DOMContentLoaded`: `autoFit()` then `new SlideEngine()`.
6. Run: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <deck>.html`.

## Output

Single `.html` with all slides inline + runtime. Click emits JSON payload.

## Error Handling

- `100dvh` not `100vh`: mobile address bars break vh.
- Mixing presets reads as indecision.
- Reserve anime.js transitions for 1-2 emphasis slides.

## Examples

**Input:** Turn a 12-section plan into a 22-slide Midnight Editorial deck.
**Output:** cover + 12 dividers + 1-2 content/diagram slides per section + closing summary, all in one self-contained `.html`.

## Resources

- [interactive-selection-base](../../references/interactive-selection-base.md): selection wire format
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [styling-guide](../../references/styling-guide.md): palette + typography
  - Aesthetic directions
  - Typography & Color
  - Surfaces, Hierarchy & Animation
  - Engines & Illustrations
- [css-patterns](../../references/css-patterns.md): Mermaid, overflow, components
  - Theme & Atmosphere
  - Layout & Containers
  - Content Blocks
  - Visual Components
  - Prose Page Elements
- [slide-deck-mode](./references/slide-deck-mode.md): when to switch, completeness, `--slides`
  - When to use slide deck mode
  - Content completeness
  - Slide types and visual richness
  - Compositional variety
  - Curated presets
  - The --slides flag on existing prompts
- [slide-patterns](./references/slide-patterns.md): engine, 10 types, transitions, nav, presets
  - Planning a Deck from a Source Document
  - Slide Engine Base
  - Typography Scale
  - Cinematic Transitions
  - Navigation Chrome
  - SlideEngine JavaScript
  - Auto-Fit
  - Slide Type Layouts
  - Decorative SVG Elements
  - Proactive Imagery
  - Compositional Variety
  - Presentation Readability
  - Content Density Limits
  - Responsive Height Breakpoints
  - Curated Presets
