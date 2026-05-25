# Math / LaTeX Cookbook (KaTeX, with chemistry via mhchem)

## Table of contents

- [Three flavours](#three-flavours)
- [Notation coverage](#notation-coverage)
- [Granular sub-selection inside math](#granular-sub-selection-inside-math-matrix-cells-indices-sum-bounds-)
- [Adding more macros](#adding-more-macros)
- [Copy-tex](#copy-tex)
- [What's selectable](#whats-selectable)
- [Sub-element selection (variables, terms, operators)](#sub-element-selection-variables-terms-operators)
- [Math in tables](#math-in-tables)
- [TikZ diagrams (binary trees, FSMs, DAGs, Karnaugh maps, OBDDs, geometry, free-body diagrams)](#tikz-diagrams-binary-trees-fsms-dags-karnaugh-maps-obdds-geometry-free-body-diagrams)
- [What's selectable in TikZ diagrams](#whats-selectable-in-tikz-diagrams)
- [Semantic geometric regions](#semantic-geometric-regions--clicks-return-named-entities-not-paths)
- [Region shapes](#region-shapes)
- [Calibrating regions](#calibrating-regions)
- [Workflow: iterate on a LaTeX-paper figure by clicking elements](#workflow-iterate-on-a-latex-paper-figure-by-clicking-elements)
- [Pattern: chemistry molecule with selectable atoms and bonds](#pattern-chemistry-molecule-with-selectable-atoms-and-bonds)
- [When to use named regions vs. mouse-highlight snippets vs. whole-diagram click](#when-to-use-named-regions-vs-mouse-highlight-snippets-vs-whole-diagram-click)
- [Choosing between `.ve-math` and `.ve-tikz`](#choosing-between-ve-math-and-ve-tikz)

For mathematical formulas, geometrical expressions, physics equations, statistics, and chemistry, the runtime ships with on-demand KaTeX rendering. Wrap any LaTeX with `class="ve-math"` and the runtime renders it the first time a `.ve-math` element is found on the page (KaTeX + the mhchem extension are lazy-loaded from `cdn.jsdelivr.net`; both fail gracefully if the network is offline — the raw LaTeX stays visible).

For the cross-cutting selection wire format and the multi-click math depth-grammar (`kind:"math"` with depth 1=atom, 2=group, 3=formula, 4-7=paragraph/section/chapter/all), read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` first. For TikZJax preload limitations and per-package substitution recipes (no `pgfplots`, no `chemfig`, no `circuitikz`, no `automata`, no `mhchem` inside TikZ, etc.), read `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-math-and-latex/references/tikz-substitutions.md`.

---

## Three flavours

```html
<!-- Inline math (default) -->
Einstein famously wrote <span class="ve-math">E = mc^2</span>.

<!-- Block / display math -->
<div class="ve-math ve-math--block">\int_0^1 x^2 \, dx = \tfrac{1}{3}</div>

<!-- Chemistry (mhchem) — auto-wrapped in \ce{…} -->
The reaction <span class="ve-math ve-math--chem">H2O + CO2 -> H2CO3</span>.

<!-- LaTeX kept out of HTML text via data-tex -->
<span class="ve-math" data-tex="\sum_{i=1}^n i^2 = \tfrac{n(n+1)(2n+1)}{6}">…</span>
```

## Notation coverage

The runtime ships KaTeX with **86 default macros** covering contemporary math/physics/engineering notation. KaTeX's stock LaTeX support already handles:

- All standard math: fractions, roots, sums, integrals, products, limits, sub/superscripts, accents, decorations
- All matrix environments: `pmatrix`, `bmatrix`, `vmatrix`, `Vmatrix`, `Bmatrix`, `matrix`, `smallmatrix`, `array`, `aligned`, `cases`, `gather`, `multline`
- Greek (lower + upper), blackboard letters (\mathbb{}), calligraphic (\mathcal{}), fraktur (\mathfrak{}), bold (\mathbf{}, \boldsymbol{})
- All standard operators, relations, arrows, set notation, logic
- Color via `\color{}` and `\textcolor{}`
- mhchem chemistry (`\ce{H2SO4}`, equilibria, isotopes)

The runtime adds these on top:

| Family                | Macros |
|-----------------------|--------|
| **Bold vectors**      | `\bv`, `\bvec`, `\vct`, `\hatv`, `\unitvec` (KaTeX's stock `\vec` over-arrow stays as-is) |
| **Matrices**          | `\mat`, `\bmat`, `\T` (transpose), `\inv` (^-1), `\hc` (hermitian conjugate ^†) |
| **Tensors**           | `\tensor{T}{^a_b}`, `\indices{}`. For mixed-index spacing use empty groups: `T^a{}_b{}^c` |
| **Calculus operators**| `\dd`, `\dv{f}{x}`, `\pdv{f}{x}`, `\fdv{F}{φ}`, `\dvn{n}{f}{x}`, `\pdvn{n}{f}{x}` |
| **Vector calculus**   | `\grad`, `\divv`, `\curl`, `\laplacian` (∇²), `\dalembertian` (□) |
| **Delimiters**        | `\norm`, `\abs`, `\set`, `\floor`, `\ceil`, `\inner{a}{b}`, `\eval{}` |
| **Quantum / Dirac**   | `\bra{ψ}`, `\ket{ψ}`, `\braket{ψ}{φ}`, `\matrixel{ψ}{Ô}{φ}`, `\dyad{ψ}{φ}`, `\expval{Ô}`, `\comm{A}{B}`, `\anticomm{A}{B}`, `\poissonbracket{A}{B}` |
| **Number systems**    | `\R`, `\Z`, `\N`, `\Q`, `\C`, `\F`, `\K`, `\H` (quaternions), `\E`, `\P` |
| **Logic**             | `\Iff`, `\Implies`, `\impliedby`, `\implies`, `\iff`, `\defeq` (≔), `\eqdef` (≕), `\given`, `\suchthat` |
| **Complex analysis**  | `\Real` / `\Imag` (upright variants of stock `\Re` / `\Im`) |
| **Statistics**        | `\Var`, `\Cov`, `\Cor`, `\Prob` |
| **Linear algebra**    | `\rank`, `\tr`, `\Tr`, `\diag`, `\spn`, `\nullspace`, `\range`, `\sgn` |
| **SI units**          | `\SI{5}{m/s}`, `\unit{m/s^2}`, `\si{Hz}`, `\degC`, `\degF`, `\angstrom` |
| **Shortcuts**         | `\half`, `\third`, `\quarter`, `\eps` (ε), `\veps` (ε), `\phi2` (φ) |

Examples:

```html
<!-- Vector calculus -->
<span class="ve-math">\divv \bv E = \rho/\epsilon_0</span>
<span class="ve-math">\curl \bv B - \pdv{\bv E}{t} = \mu_0 \bv J</span>

<!-- Matrix transposition + inverse -->
<span class="ve-math">(\mat A \mat B)\T = \mat B\T \mat A\T</span>
<span class="ve-math">\mat A\inv \mat A = \mat I</span>

<!-- Tensor / Riemann-Christoffel -->
<span class="ve-math">R^{\rho}{}_{\sigma\mu\nu} = \partial_\mu \Gamma^{\rho}{}_{\nu\sigma} - \partial_\nu \Gamma^{\rho}{}_{\mu\sigma} + \Gamma^{\rho}{}_{\mu\lambda}\Gamma^{\lambda}{}_{\nu\sigma} - \Gamma^{\rho}{}_{\nu\lambda}\Gamma^{\lambda}{}_{\mu\sigma}</span>

<!-- Quantum mechanics -->
<span class="ve-math">\matrixel{\psi}{\hat H}{\psi} = E \braket{\psi}{\psi}</span>
<span class="ve-math">\comm{\hat x}{\hat p} = i\hbar</span>
<span class="ve-math">\rho = \sum_i p_i \dyad{\psi_i}{\psi_i}</span>

<!-- Statistics -->
<span class="ve-math">\Var(X+Y) = \Var(X) + \Var(Y) + 2\Cov(X,Y)</span>

<!-- SI units -->
<span class="ve-math">v = \SI{299{,}792{,}458}{m/s}</span>
<span class="ve-math">T = \SI{310.15}{K} = 37\degC</span>

<!-- Block-display matrix -->
<div class="ve-math ve-math--block">
\mat A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix},\quad
\det \mat A = a_{11}a_{22} - a_{12}a_{21}
</div>
```

Every one of these renders, every one is a clickable `math-formula`, and every sub-expression (the `\rho`, the `\partial_\mu`, the `\bv E`, a single matrix entry) is selectable via mouse-highlight.

## Granular sub-selection inside math (matrix cells, indices, sum bounds, …)

For figures where the user must pick **named sub-elements of a formula** (a single matrix entry, a tensor index, the lower bound of a summation, the n-th term of a series, an Einstein-summed index, an operator), the runtime exposes 24 selection macros that route through KaTeX's `\htmlData` (whitelisted via `trust`) to set `data-ve-id` / `data-ve-type` / `data-ve-label` directly on the rendered HTML span. The runtime's existing click handler then picks up those spans automatically — no new wiring needed per page.

**Generic form:** `\veid{id}{type}{label}{content}`

**Specific forms** — each pre-fills `type`:

| Macro                    | Type                | When to use                                |
|--------------------------|---------------------|--------------------------------------------|
| `\vecell{id}{label}{c}`  | `matrix-cell`       | Single entry of a matrix or table          |
| `\veelem{id}{label}{c}`  | `matrix-cell`       | Alias of `\vecell`                          |
| `\verow{id}{label}{c}`   | `matrix-row`        | Whole-row tag (works on a row's first cell as a marker) |
| `\vecol{id}{label}{c}`   | `matrix-column`     | Whole-column tag (likewise)                |
| `\veidx{id}{label}{c}`   | `index`             | A tensor / Einstein / Christoffel index    |
| `\vesub{id}{label}{c}`   | `subscript`         | A subscript (e.g. species subscript in chemistry) |
| `\vesup{id}{label}{c}`   | `superscript`       | A superscript / power                      |
| `\vebound{id}{label}{c}` | `bound`             | Lower / upper bound of `\sum`, `\prod`, `\int`, `\bigcup` |
| `\veterm{id}{label}{c}`  | `term`              | One term of a series / sum                 |
| `\vefactor{id}{label}{c}`| `factor`            | One factor of a product                    |
| `\vesum{id}{label}{c}`   | `sum`               | The whole `\sum` operator                  |
| `\veprod{id}{label}{c}`  | `product`           | The whole `\prod`                          |
| `\veint{id}{label}{c}`   | `integral`          | The whole `\int` (or multiple)             |
| `\velim{id}{label}{c}`   | `limit`             | A `\lim` expression                        |
| `\veop{id}{label}{c}`    | `operator`          | Custom operator span (`\hat H`, `\nabla`, etc.) |
| `\vegrp{id}{label}{c}`   | `group`             | A grouped sub-expression `(…)` `[…]`       |
| `\vevar{id}{label}{c}`   | `variable`          | A single variable                          |
| `\veconst{id}{label}{c}` | `constant`          | A single constant                          |
| `\vetensor{id}{label}{c}`| `tensor`            | A whole tensor / multi-index symbol        |
| `\vevec{id}{label}{c}`   | `vector`            | A whole vector                             |
| `\vemat{id}{label}{c}`   | `matrix`            | A whole matrix                             |
| `\vesymb{id}{label}{c}`  | `symbol`            | A standalone symbol                        |

### Example: 2×2 matrix with selectable cells, rows, columns

```html
<div class="ve-math ve-math--block">
\mat A = \begin{pmatrix}
  \vecell{matA-r1c1}{Element a_{11}}{a_{11}} & \vecell{matA-r1c2}{Element a_{12}}{a_{12}} \\
  \vecell{matA-r2c1}{Element a_{21}}{a_{21}} & \vecell{matA-r2c2}{Element a_{22}}{a_{22}}
\end{pmatrix}
</div>
```

A click on the `a_{12}` cell sends:
```json
{ "id": "matA-r1c2", "type": "matrix-cell", "label": "Element a_{12}" }
```

**Naming convention** — encode row/column in the id (`r1c2`, `r2c1`) so the agent can compute "row 1 = all cells with `r1`" or "column 2 = all cells with `c2`" from a single cell click. To select a whole row/column visually, the user mouse-highlights across multiple cells; the snippet popup catches the visible text and the formula's full LaTeX (the agent infers from context which row/column).

### Example: Einstein summation with selectable indices

```html
<div class="ve-math ve-math--block">
\vetensor{stress}{Stress-energy tensor T^{\mu\nu}}{T^{\veidx{mu-up}{contravariant μ}{\mu}\veidx{nu-up}{contravariant ν}{\nu}}}
=
\vesum{einstein-sum}{Einstein summation over α, β}{
  \veidx{alpha}{summation index α}{\alpha}\veidx{beta}{summation index β}{\beta}
  \,\eta^{\veidx{mu-eta}{η contravariant μ}{\mu}\veidx{alpha-eta}{η contravariant α}{\alpha}}
  \,\eta^{\veidx{nu-eta}{η contravariant ν}{\nu}\veidx{beta-eta}{η contravariant β}{\beta}}
  \,T_{\veidx{alpha-T}{T covariant α}{\alpha}\veidx{beta-T}{T covariant β}{\beta}}
}
</div>
```

Each `\mu`, `\nu`, `\alpha`, `\beta` in the rendering is now its own selectable index. Click the `\alpha` in the inner contraction → `id: "alpha-T"`, `label: "T covariant α"`. The agent knows exactly which Einstein-summed index the user picked.

### Example: Christoffel symbols with named components

```html
<div class="ve-math ve-math--block">
\veid{christoffel-rho-mu-nu}{tensor}{Christoffel Γᵖ_{μν}}{
  \Gamma^{\veidx{ch-rho}{ρ index}{\rho}}{}_{\veidx{ch-mu}{μ index}{\mu}\veidx{ch-nu}{ν index}{\nu}}
}
=
\half g^{\veidx{ch-rho2}{ρ index (g)}{\rho}\veidx{ch-sigma}{σ index (contracted)}{\sigma}}
\left(
  \pdv{g_{\veidx{g1-sigma}{σ}{\sigma}\veidx{g1-mu}{μ}{\mu}}}{x^{\veidx{x-nu}{ν}{\nu}}}
  + \pdv{g_{\veidx{g2-sigma}{σ}{\sigma}\veidx{g2-nu}{ν}{\nu}}}{x^{\veidx{x-mu}{μ}{\mu}}}
  - \pdv{g_{\veidx{g3-mu}{μ}{\mu}\veidx{g3-nu}{ν}{\nu}}}{x^{\veidx{x-sigma}{σ}{\sigma}}}
\right)
</div>
```

### Example: summation with selectable bounds and per-term tags

```html
<span class="ve-math">
\sum_{\vebound{geom-lo}{lower bound i = 1}{i=1}}^{\vebound{geom-hi}{upper bound n}{n}}
\veterm{geom-term}{i-th term of the geometric series}{a r^{i-1}}
=
\veid{geom-sum-closed}{result}{closed-form sum}{a \dfrac{1 - r^n}{1 - r}}
</span>
```

The user can click the lower bound, the upper bound, the summand template, or the closed-form result — each comes back with its semantic identity.

### Example: integral with selectable limits and integrand

```html
<div class="ve-math ve-math--block">
\veint{moment-integral}{first moment of f}{
  \int_{\vebound{lo-x}{lower limit a}{a}}^{\vebound{hi-x}{upper limit b}{b}}
  \veterm{integrand-x}{integrand x f(x)}{x \, f(x)}
  \, \dd x
}
</div>
```

### Example: group-theoretic operation with selectable operands

```html
<span class="ve-math">
\vegrp{lhs}{left-hand-side coset}{(g_1 H)} \cdot \vegrp{rhs}{right-hand-side coset}{(g_2 H)}
=
\vegrp{result}{product coset g_1 g_2 H}{(g_1 g_2) H}
</span>
```

### Cookbook summary

- **Single matrix entry?** `\vecell{id}{label}{...}` with `rNcM` ids
- **Tensor index?** `\veidx{id}{label}{\mu}` — works for Christoffel, Einstein, Riemann, etc.
- **Sum/product/integral bound?** `\vebound{id}{label}{...}`
- **A specific term?** `\veterm{id}{label}{...}`
- **A whole operator?** `\veop{id}{label}{\hat H}` or `\vesum{id}{label}{...}`
- **A symbol that doesn't fit elsewhere?** `\vesymb{id}{label}{...}` or fall back to `\veid{id}{type}{label}{...}` with a custom type

The agent (Claude) generates these tags as part of the LaTeX. From the user's perspective, the formula renders normally; from the runtime's perspective, every tagged span is a `[data-ve-id]` selectable. The visible LaTeX-paper-friendly source contains only the `\ve*` tags — strip them with a regex (`s/\\ve\w+\{[^}]*\}\{[^}]*\}/<arg3>/g` in spirit) when shipping the formula into the user's `.tex` paper, or leave them in if the paper also uses KaTeX.

## Adding more macros

Per-page (in a `<script>` tag before the runtime initialises):

```html
<script>
  window.veKatexMacros = {
    "\\foo": "\\mathrm{Foo}",
    "\\bar": "\\overline{#1}",
    "\\norm2": "\\left\\| #1 \\right\\|_2"
  };
</script>
```

Per-element (overrides + adds, never removes defaults):

```html
<span class="ve-math" data-tex-macros='{"\\loc":"\\hat{\\bv x}_{\\text{loc}}"}'>
  \loc + \bv v t
</span>
```

## Copy-tex

The runtime also loads KaTeX's `copy-tex` extension. **Right-click any rendered formula → Copy** puts the original LaTeX source on the clipboard (not the rendered MathML). Critical for moving formulas back into a LaTeX paper.

## What's selectable

After rendering, every `.ve-math` element gains:

- `data-ve-id="ve-math-formula-N"` (auto-numbered)
- `data-ve-type="math-formula"`
- `data-ve-label` (the original LaTeX, truncated)
- `data-ve-data` containing `{ latex, chem, formulaId }`

So a **single click** on a formula selects the whole formula:

```json
{
  "id": "ve-math-formula-1",
  "type": "math-formula",
  "label": "Formula — E = mc^2",
  "data": { "latex": "E = mc^2", "chem": false, "formulaId": "formula-1" }
}
```

## Sub-element selection (variables, terms, operators)

Inside any rendered formula, the **mouse-highlight** snippet popup (the same one used in prose mode) activates automatically — no `data-ve-prose` wrapper needed. The user can highlight a single variable (`m`), an exponent (`^2`), a sub-expression (`mc^2`), or an operator (`=`) and submit:

```json
{
  "id": "ve-math-formula-1-snippet-1",
  "type": "math-snippet",
  "label": "mc²",
  "data": {
    "text": "mc²",
    "fullFormulaLatex": "E = mc^2",
    "fullFormulaLabel": "Formula — E = mc^2",
    "formulaId": "ve-math-formula-1",
    "chem": false,
    "paragraphId": null
  }
}
```

For chemistry formulas the `type` flips to `chem-snippet` and `chem: true`.

> **Limitation:** the agent receives the *visible text* of the user's selection, not the underlying LaTeX of the sub-expression. KaTeX does not expose a render-to-source mapping. The agent has the full formula's LaTeX (`fullFormulaLatex`) plus the visible selection (`text`), and that's almost always enough to act ("rewrite the `c^2` term as `(c*c)`", "explain why `m` here is rest mass not relativistic mass", "swap `mc^2` for `pc` in the relativistic-energy form").

## Math in tables

Math elements work inside table cells exactly like anywhere else — they're discovered globally by the runtime, regardless of where they sit in the DOM:

```html
<table>
  <thead><tr><th>Quantity</th><th>Symbol</th><th>Equation</th></tr></thead>
  <tbody>
    <tr>
      <td>Kinetic energy</td>
      <td><span class="ve-math">K</span></td>
      <td><span class="ve-math">K = \tfrac{1}{2} m v^2</span></td>
    </tr>
    <tr>
      <td>pH (chemistry)</td>
      <td><span class="ve-math">\mathrm{pH}</span></td>
      <td><span class="ve-math">\mathrm{pH} = -\log_{10}[\mathrm{H^+}]</span></td>
    </tr>
  </tbody>
</table>
```

Each formula is independently clickable; clicking the formula sends `math-formula`, highlighting a sub-expression sends `math-snippet`. Clicking the cell *outside* the formula falls through to whatever `data-ve-id` the row/cell carries (passive table mode) or to the cell's own selection if the table is in `table-form` mode.

## TikZ diagrams (binary trees, FSMs, DAGs, Karnaugh maps, OBDDs, geometry, free-body diagrams)

KaTeX handles inline formulas, but it cannot draw. For diagrammatic LaTeX — Karnaugh maps, OBDDs, binary trees, DAGs, finite-state machines, free-body / thermodynamic / Venn / geometry constructions — the runtime ships with **TikZJax** (a WASM port of TikZ + LaTeX that renders fully in the browser). **Read the TikZJax limitations & substitutions reference (`${CLAUDE_PLUGIN_ROOT}/skills/amvcp-math-and-latex/references/tikz-substitutions.md`) before generating anything** — TikZJax preloads only `tikz` core + `tikz-cd` + a handful of standard libraries, so `chemfig`, `circuitikz`, `pgfplots`, `automata`, `shapes.gates.logic.US`, `tkz-euclide`, `tikz-feynman`, and `mhchem` all FAIL inside a `.ve-tikz` block. Every category in the working-substitutes table over there has a verified TikZ recipe that does work.

Wrap any TikZ source in `class="ve-tikz"`. **All examples below render in TikZJax v1 — chemistry / pgfplots / circuitikz examples have been removed because those packages are NOT preloaded** (see the substitutions reference for the full audit and the substitution table):

```html
<!-- Physics: free-body diagram of a block on an incline -->
<div class="ve-tikz">
\begin{tikzpicture}[scale=1.2]
  \draw[thick] (0,0) -- (4,0) -- (4,2) -- cycle;
  \draw[fill=gray!20] (1.4,0.7) -- (2.0,1.0) -- (2.4,0.5) -- (1.8,0.2) -- cycle;
  \draw[->,thick,red]   (1.9,0.6) -- (1.9,-0.4) node[below] {$mg$};
  \draw[->,thick,blue]  (1.9,0.6) -- (2.4,1.5) node[above right] {$N$};
  \draw[->,thick,green!50!black] (1.9,0.6) -- (3.0,1.1) node[above] {$f$};
\end{tikzpicture}
</div>

<!-- Function curve — direct \draw plot (no pgfplots) -->
<div class="ve-tikz">
\begin{tikzpicture}[scale=1.5]
  \draw[->] (-1.6,0) -- (1.6,0) node[right] {$x$};
  \draw[->] (0,-2.2) -- (0,2.2) node[above] {$y$};
  \draw[blue, very thick, domain=-1.4:1.4, smooth, samples=80, variable=\x]
       plot ({\x}, {\x*\x*\x - \x});
  \node[blue, anchor=west] at (0.9, 0.6) {$y=x^3-x$};
\end{tikzpicture}
</div>

<!-- Venn diagram, all in TikZ -->
<div class="ve-tikz">
\begin{tikzpicture}
  \draw (-1,0) circle (1.4) node[left=1.5cm] {$A$};
  \draw ( 1,0) circle (1.4) node[right=1.5cm] {$B$};
  \node at (0,0) {$A\cap B$};
\end{tikzpicture}
</div>

<!-- Chemistry: NOT in .ve-tikz — use .ve-math with mhchem instead -->
<span class="ve-math ve-math--chem">H2O + CO2 -> H2CO3</span>
```

`<div class="ve-tikz">` works for block diagrams; for an inline TikZ snippet inside text, use `<span class="ve-tikz">`. Source can also be passed via `data-tikz="…"` to keep the original LaTeX out of the page's text content (useful when special characters would otherwise be HTML-escaped). When the source doesn't already contain `\begin{tikzpicture}`, the runtime auto-wraps it.

## What's selectable in TikZ diagrams

After TikZJax renders, every `.ve-tikz` element gains:

- `data-ve-id="ve-tikz-N"` (auto-numbered)
- `data-ve-type="tikz-diagram"`
- `data-ve-label` (the original TikZ source, truncated)
- `data-ve-data` containing `{ tikz, diagramId }`

So a **single click** on a diagram selects the whole diagram. **Mouse-highlight** inside the rendered SVG (a single atom, a vector arrow, a region label, a curve segment) opens the snippet popup with `type=tikz-snippet`:

```json
{
  "id": "ve-tikz-1-snippet-1",
  "type": "tikz-snippet",
  "label": "mg",
  "data": {
    "text": "mg",
    "fullDiagramLatex": "\\begin{tikzpicture}\\draw[->,thick,red] (1.9,0.6) -- (1.9,-0.4) node[below] {$mg$}; …",
    "fullDiagramLabel": "Diagram — \\begin{tikzpicture}…",
    "diagramId": "ve-tikz-1",
    "paragraphId": null
  }
}
```

The agent receives the visible label of the user's pick plus the *complete* TikZ source, which is enough to act: "rotate the gravity vector to point along the slope direction", "relabel this atom node", "scale the Carnot cycle to compress the isotherms".

> **Cost note.** TikZJax is a ~3 MB WASM bundle (downloaded once, cached by the browser). Don't add `class="ve-tikz"` on a page that has no TikZ — it would lazy-load TikZJax for nothing. The runtime only triggers the load when at least one `.ve-tikz` element is in the DOM.

## Semantic geometric regions — clicks return *named entities*, not paths

The above patterns let the user single-click a whole figure or highlight a sub-string of its rendered text. For figures with **named geometric entities** (the hypotenuse, the incircle, the angle at C, an atom in a molecule, a force vector in a free-body diagram), declare a JSON sidecar of regions on the wrapper. The runtime overlays an invisible SVG with one shape per region; each region is a `data-ve-id` selectable. Clicks return the **semantic identity** — `regionId: "incircle"` plus `label: "Incircle of triangle ABC"` — and the full TikZ source for context. Never a meaningless `path[d="…"]` string.

```html
<div class="ve-tikz"
     data-ve-tikz-viewbox="-1 -6 10 9"
     data-ve-tikz-regions='[
       {"id":"square-hyp","label":"Square upon the hypotenuse",
        "shape":"polygon","points":[[5,3],[2,7.2],[-1.83,4.2],[1.17,0]]},
       {"id":"square-leg-a","label":"Square upon leg a (vertical)",
        "shape":"polygon","points":[[5,0],[5,3],[8,3],[8,0]]},
       {"id":"square-leg-b","label":"Square upon leg b (horizontal)",
        "shape":"polygon","points":[[0,0],[5,0],[5,-5],[0,-5]]},
       {"id":"incircle","label":"Incircle of triangle ABC",
        "shape":"circle","cx":3.2,"cy":1,"r":0.85},
       {"id":"angle-A","label":"Angle at A","shape":"circle","cx":0,"cy":0,"r":0.4},
       {"id":"angle-B","label":"Angle at B","shape":"circle","cx":5,"cy":3,"r":0.4},
       {"id":"angle-C","label":"Right angle at C",
        "shape":"rect","x":4.6,"y":0,"w":0.4,"h":0.4},
       {"id":"hypotenuse","label":"Hypotenuse AB",
        "shape":"line","from":[0,0],"to":[5,3],"thickness":0.4}
     ]'>
% ve-region: triangle
\begin{tikzpicture}[scale=0.6]
  \coordinate (A) at (0,0);
  \coordinate (B) at (5,3);
  \coordinate (C) at (5,0);
  \draw[thick] (A) -- (B) -- (C) -- cycle;

  % ve-region: square-leg-b
  \draw (A) -- (5,0) -- (5,-5) -- (0,-5) -- cycle;
  % ve-region: square-leg-a
  \draw (5,0) -- (8,0) -- (8,3) -- (5,3) -- cycle;
  % ve-region: square-hyp  (square on the hypotenuse, drawn outward)
  \draw (B) -- ($(B)+(-3,4.2)$) -- ($(A)+(-1.83,4.2)$) -- (A) -- cycle;

  % ve-region: incircle
  \tkzInCircle[R](A,B,C)

  % ve-region: angle-C
  \draw (4.6,0) rectangle (5,0.4); % right angle marker
\end{tikzpicture}</div>
```

A click on the inner overlay polygon for the hypotenuse-square sends:

```json
{
  "id": "ve-tikz-1-region-square-hyp",
  "type": "geometric-region",
  "label": "Square upon the hypotenuse",
  "data": {
    "regionId": "square-hyp",
    "regionLabel": "Square upon the hypotenuse",
    "regionShape": "polygon",
    "diagramId": "ve-tikz-1",
    "fullDiagramLatex": "% ve-region: triangle\n\\begin{tikzpicture}[scale=0.6]\n  …"
  }
}
```

The agent now has both the semantic name (`square-hyp`) **and** the full TikZ source, which is enough to find the right `\draw …` line and modify it.

## Region shapes

| `shape`     | Required props                              |
|-------------|---------------------------------------------|
| `polygon`   | `points: [[x,y], …]`                        |
| `circle`    | `cx`, `cy`, `r`                             |
| `ellipse`   | `cx`, `cy`, `rx`, `ry`                      |
| `rect`      | `x`, `y`, `w` (or `width`), `h` (or `height`) |
| `path`      | `d` (raw SVG path-data string)              |
| `line`      | `from: [x,y]`, `to: [x,y]`, optional `thickness` (default 0.4) |

All coordinates are in the **same coordinate system as the rendered SVG's `viewBox`**. Specify the viewBox explicitly via `data-ve-tikz-viewbox="x y w h"` to be safe; otherwise the runtime falls back to the rendered SVG's own `viewBox` attribute.

## Calibrating regions

Add `data-ve-tikz-debug="1"` to draw all regions in red so you can see where the hit areas land relative to the rendered geometry. Tweak coordinates, then remove the debug flag.

```html
<div class="ve-tikz" data-ve-tikz-debug="1" data-ve-tikz-regions='[…]'>
  …
</div>
```

## Workflow: iterate on a LaTeX-paper figure by clicking elements

This is the key use case the geometric-region pattern enables.

1. **Generate.** The agent writes the TikZ for a figure (a Pythagoras illustration, a chemical structure, a free-body diagram, a thermodynamic cycle) and a JSON sidecar of semantic regions matching the named entities. Each region's `id` is anchored to the source via a `% ve-region: <id>` comment line directly above the relevant `\draw` / `\node` / `\tkzInCircle` command.

2. **Open.** The agent opens the page via `amvcp-select.py`. The figure renders in the browser.

3. **Pick.** The user clicks a region — say "the square on the hypotenuse". The window closes; the agent receives `{regionId: "square-hyp", fullDiagramLatex: "…"}`.

4. **Ask.** The agent's reply opens with:
   > You selected **Square upon the hypotenuse** (`geometric-region: square-hyp`). What would you like to change — colour, fill, label, rotation, or something else?

5. **Modify.** The user replies "fill it red, label it `c²`". The agent finds the `% ve-region: square-hyp` comment in the source, modifies the `\draw …` command on the next line, regenerates the page, and re-opens it.

6. **Iterate.** Repeat picks until the figure is right.

7. **Ship.** When the figure is final, the agent prints the **pure TikZ source** — no JS markup, no JSON sidecar — for the user to paste straight into the LaTeX paper. The semantic-region JSON is tooling metadata; the TikZ is the deliverable.

This means the same figure source flies through the iteration loop *and* lands in the published paper unchanged.

## Pattern: chemistry molecule with selectable atoms and bonds

`chemfig` is NOT preloaded in TikZJax (see [tikz-substitutions](./tikz-substitutions.md) — it crashes the WASM instance). Draw ball-and-stick structures with **manual TikZ primitives** (atom nodes + bond lines), which also match the semantic regions one-to-one:

```html
<div class="ve-tikz"
     data-ve-tikz-viewbox="0 0 6 4"
     data-ve-tikz-regions='[
       {"id":"atom-O", "label":"Oxygen atom",      "shape":"circle","cx":3.0,"cy":2.0,"r":0.4},
       {"id":"atom-H1","label":"First hydrogen",   "shape":"circle","cx":1.5,"cy":1.0,"r":0.4},
       {"id":"atom-H2","label":"Second hydrogen",  "shape":"circle","cx":4.5,"cy":1.0,"r":0.4},
       {"id":"bond-OH1","label":"O–H bond (left)",  "shape":"line","from":[1.7,1.2],"to":[2.7,1.85],"thickness":0.25},
       {"id":"bond-OH2","label":"O–H bond (right)", "shape":"line","from":[3.3,1.85],"to":[4.3,1.2],"thickness":0.25},
       {"id":"angle-HOH","label":"H–O–H bond angle","shape":"circle","cx":3.0,"cy":1.7,"r":0.4}
     ]'>
% ve-region: water-molecule
\begin{tikzpicture}
  \coordinate (O)  at (3.0,2.0);
  \coordinate (H1) at (1.5,1.0);
  \coordinate (H2) at (4.5,1.0);
  % ve-region: bond-OH1
  \draw[thick] (O) -- (H1);
  % ve-region: bond-OH2
  \draw[thick] (O) -- (H2);
  \node[circle,draw,fill=red!20]  at (O)  {O};
  \node[circle,draw,fill=blue!10] at (H1) {H};
  \node[circle,draw,fill=blue!10] at (H2) {H};
\end{tikzpicture}
</div>
```

Click "O–H bond (right)" → `regionId: "bond-OH2"` → agent says "you picked the right O–H bond — change its angle, length, or remove it?" → user replies → source updated.

## When to use named regions vs. mouse-highlight snippets vs. whole-diagram click

| Goal                                                            | Mechanism                          |
|-----------------------------------------------------------------|------------------------------------|
| Pick a *named* element of the figure (incircle, atom, vector)   | `data-ve-tikz-regions` (this section) |
| Pick a *visible* sub-string of a label or annotation            | Mouse-highlight → `tikz-snippet`   |
| Act on the figure as a whole ("scale this 2×", "redo entirely") | Click outside any region → whole `tikz-diagram` |

All three coexist on the same figure. The runtime picks the innermost match for any given click.

---

## Choosing between `.ve-math` and `.ve-tikz`

| You want…                                          | Use         |
|----------------------------------------------------|-------------|
| Inline equation in a paragraph                     | `.ve-math`  |
| Block-display equation                             | `.ve-math ve-math--block` |
| Chemical reaction (linear: `H2O + CO2 -> H2CO3`)   | `.ve-math ve-math--chem` (mhchem) |
| Chemical structure (atoms, bonds, rings)           | `.ve-tikz` with **manual** atom/bond primitives (chemfig is NOT preloaded — it crashes; see [tikz-substitutions](./tikz-substitutions.md)) |
| Physics equation                                   | `.ve-math`  |
| Physics diagram (free body, optics)                | `.ve-tikz` (manual primitives; `circuitikz` is NOT preloaded) |
| Thermodynamic cycle (PV, TS, hS)                   | `.ve-tikz` with `\draw plot` + `domain=`/`samples=` (`pgfplots` is NOT preloaded), or route to `.ve-chart` (Chart.js) |
| Statistical chart (histogram, scatter)             | `.ve-chart` (Chart.js) — see `${CLAUDE_PLUGIN_ROOT}/references/libraries.md`. `pgfplots` is NOT preloaded in TikZJax. |
| Venn diagram                                       | `.ve-tikz`  |
| Geometry construction                              | `.ve-tikz`  |
| Feynman diagram                                    | Static SVG fallback — `tikz-feynman` is NOT preloaded in TikZJax (see [tikz-substitutions](./tikz-substitutions.md)) |
| State machine / flowchart                          | Mermaid (existing pattern, much faster to author) |
