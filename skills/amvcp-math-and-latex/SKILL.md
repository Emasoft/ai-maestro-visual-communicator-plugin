---
name: amvcp-math-and-latex
description: "Author math, chemistry, and TikZ HTML pages with KaTeX (mhchem) and TikZJax (binary trees, FSMs, geometric regions). Use when the user asks to render an equation, chemistry reaction, integral, summation, matrix, ODE, tensor, TikZ figure, or geometric proof. Trigger with 'render this equation', 'LaTeX', 'KaTeX', 'math', 'chemistry equation', 'TikZ figure'."
license: MIT
metadata:
  author: Emasoft
---

# Math and LaTeX

## Overview

Loads for math, chemistry, or LaTeX figures in an amvcp HTML page. KaTeX handles equations and mhchem chemistry; TikZJax handles standalone figures (binary trees, FSMs, DAGs, Karnaugh maps, geometric proofs). Every formula/figure is clickable.

## Prerequisites

amvcp-runtime.js auto-loads KaTeX+mhchem on first `.ve-math` and lazy-loads TikZJax WASM (~3 MB) on first `.ve-tikz`. No manual script tags. See Resources for wire format, palette, and CDN list.

## Instructions

1. Pick engine: KaTeX (`.ve-math`) for equations/chemistry, TikZJax (`.ve-tikz`) for figures.
2. Wrap: inline `<span class="ve-math">E = mc^2</span>`; display `<div class="ve-math ve-math--block">...</div>`; chemistry `<span class="ve-math ve-math--chem">H2O -> H+</span>`; figure `<div class="ve-tikz">...</div>`.
3. Tag sub-elements with `\vecell`, `\veidx`, `\vebound`, `\veterm`, `\veop`; tag figure parts via `data-ve-tikz-regions` JSON.
4. Open with `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" page.html`.
5. React to `math-formula`, `math-snippet`, `tikz-diagram`, or `geometric-region`. TikZ doubles as paper LaTeX; `\veid` tags strip via regex.

## Output

Self-contained HTML with `.ve-math` / `.ve-tikz` wrappers. Runner emits a JSON envelope on submit/exit. Math snippets are text-only (visible text + `fullFormulaLatex`); TikZ emits full-block payloads with `regionId` or `fullDiagramLatex`.

- `kind:"submit"` carrying `kind:"element"` (whole formula/figure), `kind:"math"` (depths 1-3), `kind:"text"` (depths 4-7).
- TikZ region: `type:"geometric-region"` with `regionId`, `regionLabel`, `fullDiagramLatex` for `% ve-region:` lookup. Highlight returns `math-snippet` or `chem-snippet`.

## Error Handling

- CRITICAL — one TikZ error crashes EVERY later diagram on the page. TikZJax WASM panics on the first LaTeX error and silently turns every later `.ve-tikz` into a blank box. No event fires. Test each block in isolation; if diagrams stop appearing, open the JS console — the first `! LaTeX Error` line names the offender.
- Unsupported TikZ packages crash: `pgfplots`, `chemfig`, `circuitikz`, `automata`, `shapes.gates.logic.US`, `tkz-euclide`, `tikz-feynman`, mhchem-in-TikZ.
- KaTeX: don't override `color:` on `.ve-math` — runtime forces `color: inherit` on `[data-ve-math-sel]`.
- TikZ source pure ASCII; put unicode in surrounding HTML. If CDN fails, raw source stays visible.

## Examples

Balanced chemistry:
```html
<span class="ve-math ve-math--chem">CH4 + 2 O2 -> CO2 + 2 H2O</span>
```

TikZ binary tree:
```html
<div class="ve-tikz">
\begin{tikzpicture}[level distance=12mm, sibling distance=18mm]
  \node {root}
    child {node {L} child {node {LL}} child {node {LR}}}
    child {node {R} child {node {RL}} child {node {RR}}};
\end{tikzpicture}
</div>
```

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — wire format, boilerplate, payload, marking, engine routing
- [libraries.md](../../references/libraries.md) — CDN (Mermaid, Chart.js, anime, fonts)
- [styling-guide.md](../../references/styling-guide.md) — palette, aesthetic, typography
- [math-cookbook.md](./references/math-cookbook.md) — flavours, macros, figures, regions, 24 sub-selection macros
- [tikz-substitutions.md](./references/tikz-substitutions.md) — preload audit, WASM crash, substitutes (tree, DAG, FSM, Karnaugh, OBDD, logic)
