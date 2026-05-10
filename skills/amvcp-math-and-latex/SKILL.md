---
name: amvcp-math-and-latex
description: "Author math, equation, chemistry, and TikZ-figure HTML pages using KaTeX (math/equations), mhchem (chemistry), and TikZJax (LaTeX figures, binary trees, FSMs, geometric regions). Use when the user asks to render an equation, math notation, chemistry equation, balanced reaction, integral, summation, matrix, ODE, TikZ figure, geometric proof, or any LaTeX-based visualization. Trigger: 'render this equation', 'LaTeX', 'KaTeX', 'math notation', 'chemistry equation', 'TikZ figure', 'geometric proof', 'integral', 'derivative', 'matrix'."
license: MIT
compatibility: "KaTeX + mhchem auto-loaded by amvcp-runtime.js when .ve-math present; TikZJax auto-loaded when .ve-tikz present (~3 MB). Browser + Python 3.12+."
metadata:
  author: Emasoft
---

# Math and LaTeX

KaTeX equations, mhchem chemistry, TikZJax figures inside amvcp HTML pages. Every formula and figure is clickable via the universal selection runtime.

## When this skill loads

Triggers: render equation, LaTeX, KaTeX, math notation, chemistry equation, TikZ figure, geometric proof, integral, derivative, matrix, ODE, tensor, Feynman diagram, free-body diagram.

Sits on `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — read first for wire format, boilerplate, runner pitfalls, payload.

## Quick decision: KaTeX vs TikZJax

| You want… | Use |
|---|---|
| Inline / display equation | `.ve-math` (+ `ve-math--block`) |
| Chemical reaction (`H2O + CO2 -> H2CO3`) | `.ve-math ve-math--chem` (mhchem) |
| Selectable matrix cell / tensor index / bound | `.ve-math` + `\vecell` / `\veidx` / `\vebound` |
| Standalone figure (tree, FSM, DAG, Karnaugh, Venn, geometry, free-body) | `.ve-tikz` |
| Named region ("incircle", "hypotenuse") | `.ve-tikz` + `data-ve-tikz-regions` JSON |
| Chemical structure / multi-axis plot | `chemfig`/`pgfplots` NOT preloaded — see substitutions |

## How to author

1. **Pick engine.** KaTeX for equations + chemistry; TikZJax for figures. Both can coexist.
2. **Wrap.** `<span class="ve-math">…</span>` (inline), `<div class="ve-math ve-math--block">…</div>` (display), `<div class="ve-tikz">\begin{tikzpicture}…\end{tikzpicture}</div>`. For named regions add `data-ve-tikz-viewbox` + `data-ve-tikz-regions='[…]'`.
3. **Open with runner.** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. KaTeX lazy-loads on first `.ve-math`; TikZJax on first `.ve-tikz`.
4. **React.** Click formula → `math-formula`. Mouse-highlight inside → `math-snippet` (text + `fullFormulaLatex`). Click TikZ region → `geometric-region` with `regionId` + source.
5. **Ship.** TikZ in `.ve-tikz` doubles as paper-ready LaTeX. KaTeX with `\veid…` tags strips back to plain LaTeX via regex.

## Mandatory wiring

```html
<span class="ve-math">E = mc^2</span>
<div class="ve-math ve-math--block">\int_0^1 x^2 \, dx = \tfrac{1}{3}</div>
<span class="ve-math ve-math--chem">H2O + CO2 -> H2CO3</span>
<div class="ve-tikz">\begin{tikzpicture}…\end{tikzpicture}</div>
```

For sub-selection (matrix cell, index, bound, term, operator) use `\vecell`, `\veidx`, `\vebound`, `\veterm`, `\veop` — they embed `data-ve-id` on the rendered span. Math snippets are auto-discovered by mouse-highlight — no `<article data-ve-prose>` needed.

## Resources

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — wire format and boilerplate (read first).
- `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` — KaTeX, mhchem, TikZJax CDN URLs.
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — palette.
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — Slop.
- `./references/math-cookbook.md` — KaTeX, mhchem, sub-selection macros, TikZ figures, regions.
- `./references/tikz-substitutions.md` — preload audit, WASM crash, substitutes.

## Anti-patterns / WASM-crash protection

- **CRITICAL — one TikZ error crashes every later diagram on the page.** TikZJax's WASM panics on the first `! LaTeX Error` and silently turns every later `.ve-tikz` into a blank box. No event fires. Test each block in isolation; if diagrams stop rendering, check the JS console — the first `! LaTeX Error` names the offender.
- **Don't use unsupported packages.** `pgfplots`, `chemfig`, `circuitikz`, `automata`, `tkz-euclide`, `tikz-feynman`, `mhchem`-in-TikZ all fail. See `./references/tikz-substitutions.md` for substitutes.
- **Don't force KaTeX glyph colours.** Runtime sets `color: inherit` on `[data-ve-math-sel]` — overriding `color:` on `.ve-math` breaks selection highlights.
- **Fallback for `.ve-tikz`.** TikZJax is ~3 MB; if the CDN is unreachable the raw source stays visible. Pair critical figures with `alt` text or static PNG. Keep TikZ source pure ASCII (`btoa` chokes on non-Latin1).
