---
name: amvcp-math-and-latex
description: "Author math, chemistry, and TikZ HTML pages with KaTeX (mhchem) and TikZJax (binary trees, FSMs, geometric regions). Use when the user asks to render an equation, chemistry reaction, integral, summation, matrix, ODE, tensor, TikZ figure, or geometric proof. Trigger with 'render this equation', 'LaTeX', 'KaTeX', 'math', 'chemistry equation', 'TikZ figure'."
license: MIT
metadata:
  author: Emasoft
---

# Math and LaTeX

## Overview

KaTeX (`.ve-math`) for equations + mhchem chemistry; TikZJax (`.ve-tikz`) for figures (trees, FSMs, DAGs, Karnaugh, geometry). Every formula/figure is clickable.

## Prerequisites

The runtime auto-loads KaTeX with mhchem on first ve-math element and lazy-loads TikZJax WASM on first ve-tikz element. No manual script tags.

## Instructions

1. Pick engine: KaTeX for equations/chemistry, TikZJax for figures.
2. Wrap: inline `<span class="ve-math">`; display `ve-math--block`; chemistry `ve-math--chem`; figure `<div class="ve-tikz">`.
3. Tag sub-elements with the `vecell`, `veidx`, `vebound`, `veterm`, `veop` LaTeX macros; figure parts via `data-ve-tikz-regions` JSON.
4. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" page.html`.
5. React to `math-formula`, `math-snippet`, `tikz-diagram`, `geometric-region`.

## Output

`kind:"submit"` carrying `kind:"element"` (whole), `kind:"math"` (depths 1-3), `kind:"text"` (depths 4-7). TikZ region: `type:"geometric-region"` with `regionId`, `fullDiagramLatex`.

## Error Handling

- CRITICAL — one TikZ error crashes EVERY later diagram. WASM panics on first LaTeX error, silently blanks rest. Test in isolation.
- Unsupported: `pgfplots`, `chemfig`, `circuitikz`, `automata`, `tikz-feynman`, mhchem-in-TikZ.
- KaTeX: don't override `color:`; runtime forces `color: inherit`.
- TikZ source ASCII only; unicode in surrounding HTML.

## Examples

```html
<span class="ve-math ve-math--chem">CH4 + 2 O2 -> CO2 + 2 H2O</span>
```

## Modes

This skill supports `data-ve-mode="readonly"` only. KaTeX / TikZ output is mathematical/scientific visualization — symbols and sub-elements (cells, indices, bounds, terms, operators) are selectable for comment via the macros listed below, but the per-element 3-state decision pill (R20-R23) does NOT apply. For "pick one formula from N candidates" wrap the formulas in `amvcp-choice-tables` with this skill rendering each row's content.

Comment-anchor macros (LaTeX command names used inside `.ve-math` / `.ve-tikz` source):

```latex
\vecell  \veidx  \vebound  \veterm  \veop
```

## Composability

Composes with every other amvcp-* skill on the same page (R22). KaTeX/TikZ can be embedded inside diagrams (via `<foreignObject>`), code blocks, or tables. The only exclusive skill is the overlay-runtime (R24). NOTE: one TikZ error crashes every later TikZ on the page — see R13 for the isolation contract.

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — wire format, boilerplate, payload, marking
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [libraries.md](../../references/libraries.md) — CDN (Mermaid, Chart.js, anime, fonts)
  > Mermaid.js — Diagramming Engine · Chart.js — Data Visualizations · anime.js — Orchestrated Animations · Google Fonts — Typography
  - Mermaid.js — Diagramming Engine
  - Chart.js — Data Visualizations
  - anime.js — Orchestrated Animations
  - Google Fonts — Typography
- [styling-guide.md](../../references/styling-guide.md) — palette, aesthetic, typography
  > Aesthetic directions · Typography & Color · Surfaces, Hierarchy & Animation · Engines & Illustrations
  - Aesthetic directions
  - Typography & Color
  - Surfaces, Hierarchy & Animation
  - Engines & Illustrations
- [math-cookbook.md](./references/math-cookbook.md) — flavours, macros, figures, regions
  > Three flavours · Notation coverage · Granular sub-selection inside math (matrix cells, indices, sum bounds, …) · Adding more macros · Copy-tex · What's selectable · Sub-element selection (variables, terms, operators) · Math in tables · TikZ diagrams (binary trees, FSMs, DAGs, Karnaugh maps, OBDDs, geometry, free-body diagrams) · What's selectable in TikZ diagrams · Semantic geometric regions — clicks return *named entities*, not paths · Region shapes · Calibrating regions · Workflow: iterate on a LaTeX-paper figure by clicking elements · Pattern: chemistry molecule with selectable atoms and bonds · When to use named regions vs. mouse-highlight snippets vs. whole-diagram click · Choosing between `.ve-math` and `.ve-tikz`
  - Three flavours
  - Notation coverage
  - Granular sub-selection inside math
  - Adding more macros
  - Copy-tex
  - What's selectable
  - Sub-element selection (variables, terms, operators)
  - Math in tables
  - TikZ diagrams (binary trees, FSMs, DAGs, Karnaugh maps, OBDDs, geometry, free-body diagrams)
  - What's selectable in TikZ diagrams
  - Semantic geometric regions
  - Region shapes
  - Calibrating regions
  - Workflow: iterate on a LaTeX-paper figure by clicking elements
  - Pattern: chemistry molecule with selectable atoms and bonds
  - When to use named regions vs. mouse-highlight snippets vs. whole-diagram click
  - Choosing between `.ve-math` and `.ve-tikz`
- [tikz-substitutions.md](./references/tikz-substitutions.md) — preload audit, WASM crash, substitutes
  > TikZJax preload audit (verified empirically 2026-05-05) · CRITICAL — WASM crash on first error blocks every subsequent diagram · Working substitutes by diagram category · Detecting silent failure during development · Detecting silent failure
  - TikZJax preload audit (verified empirically 2026-05-05)
  - CRITICAL — WASM crash on first error blocks every subsequent diagram
  - Working substitutes by diagram category
  - Detecting silent failure during development
  - Detecting silent failure
