# TikZJax Limitations & Substitutions

## Table of contents

- [TikZJax preload audit (verified empirically 2026-05-05)](#tikzjax-preload-audit-verified-empirically-2026-05-05)
- [CRITICAL — WASM crash on first error blocks every subsequent diagram](#critical--wasm-crash-on-first-error-blocks-every-subsequent-diagram)
- [Working substitutes by diagram category](#working-substitutes-by-diagram-category)
- [Detecting silent failure during development](#detecting-silent-failure-during-development)
- [Detecting silent failure](#detecting-silent-failure)

The lazy-loaded TikZJax WASM bundle does NOT carry the full LaTeX TikZ-package surface. This file enumerates which packages are preloaded vs. which fail, and gives a verified substitute recipe for every category. Read this BEFORE writing any non-trivial `.ve-tikz` block — every other package fails with `! Package pgfkeys Error` or `! LaTeX Error`, which crashes the entire WASM instance and silently blocks every later diagram on the same page.

For the TikZ rendering fundamentals (`.ve-tikz` markup, `data-ve-tikz-regions` semantic overlays, the iterate-on-a-LaTeX-paper-figure workflow) see `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-math-and-latex/references/math-cookbook.md`.

---

## TikZJax preload audit (verified empirically 2026-05-05)

The previous edition of this cookbook claimed TikZJax preloads `pgfplots`, `chemfig`, `circuitikz`, `tkz-euclide`, `tikz-feynman`, `mhchem`, and the `automata` / `shapes.gates.logic.US` libraries. **That list was wrong.** Direct probes against the production CDN (`https://tikzjax.com/v1/tikzjax.js`) show the following truth — every other package fails with `! Package pgfkeys Error: I do not know the key '/...'` or `! LaTeX Error: Environment ... undefined`, which **crashes the entire WASM instance** (see WASM crash rule below).

| Library                           | Preloaded? | Substitute (if not) |
|-----------------------------------|:---------:|---------------------|
| `tikz` core                       | ✅        | —                   |
| `tikz-cd` (commutative diagrams)  | ✅        | —                   |
| `positioning`, `arrows.meta`, `calc`, `matrix`, `shapes.geometric` | ✅ | — |
| `pgfplots` (`\begin{axis}`)       | ❌        | `\draw plot` with `domain=` + `samples=` (works for any explicit `f(x)`); for bar charts use `\foreach` with rectangles; for full charting route to **Chart.js** via `.ve-chart` |
| `automata` (`\node[state]`, `[initial]`, `[accepting]`) | ❌ | Manual styles: `state/.style={draw,circle,minimum size=8mm}` + `accepting/.style={double, double distance=1.2pt}` + an explicit initial-arrow `\draw[->] ($(q1)+(-0.9,0)$) -- (q1)` |
| `shapes.gates.logic.US` / `shapes.gates.logic.IEC` | ❌ | Manual gate paths (verbose), or **route to Mermaid** for symbolic logic flow, or static SVG |
| `circuitikz` (`\node[and port]`)  | ❌        | Same as logic gates above — manual TikZ paths or Mermaid |
| `chemfig` (`\chemfig{H_2O}`)      | ❌        | Use **KaTeX `\ce{H2O}`** in `.ve-math` (mhchem extension is loaded INTO KaTeX, not into TikZJax); for ball-and-stick structures use static SVG |
| `mhchem` inside TikZ              | ❌        | Same — KaTeX `.ve-math` only |
| `tkz-euclide` (`\tkzDefPoint`, `\tkzDrawSegment`) | ❌ | Manual TikZ primitives (`\coordinate (A) at (0,0); \draw (A) -- (B);`) |
| `tikz-feynman` (`\begin{feynman}`) | ❌       | Static SVG fallback; particle-physics diagrams are drawn rarely enough that an external image is acceptable |
| `tkz-berge` (graph-theory shortcuts) | ❌     | Use **`.ve-graph`** (Graphviz) for graph-theoretic figures |
| `forloop` (`\forLoop`)            | ❌        | Use PGF's built-in `\foreach \i in {1,...,N}`             |
| `mathrsfs` (`\mathscr`)           | ❌        | Use `\mathcal` (calligraphic) — visually similar, native  |
| `tikz-3dplot`                     | ❌        | 2D projection in plain TikZ                                |
| `physics` (`\bra`, `\ket`, `\dv`) | ❌ in TikZ | Use the runtime's KaTeX macros in `.ve-math`; for in-TikZ math expand by hand or define `\newcommand`s |
| `siunitx` (`\SI{5}{m}`)           | ❌        | `\mathrm{m}` directly in TikZ, or `\SI` KaTeX macro in `.ve-math` |

## CRITICAL — WASM crash on first error blocks every subsequent diagram

When TikZJax encounters any LaTeX error inside ONE `<script type="text/tikz">` block, the WASM runtime panics with `RuntimeError: unreachable` and **stops compiling every subsequent block on the page**. The visible result: one bad diagram silently turns the next ten into blank boxes. There is no per-diagram isolation.

Implications:
- Test every diagram in isolation (one `.ve-tikz` per page) before chaining them.
- Never ship a page that mixes "known working" and "experimental" TikZ — one experimental crash hides everything.
- If a page legitimately needs a package that isn't in the preload table, render that figure as a static PNG/SVG OR move it to a different engine (`.ve-graph`, `.ve-math`, Mermaid, Chart.js).
- The runtime cannot detect this crash from the host page — there is no event fired. The only signal is "no SVG ever appears". When debugging, open the page, inspect the JS console for the LaTeX error, identify the offending diagram, and fix or remove it.

## Working substitutes by diagram category

The Kleemans 2013 LaTeX-graphics tutorial covers eight common categories; here is the verified working recipe for each. All eight render in TikZJax v1 with the substitutes below.

| Category | Recipe |
|----------|--------|
| **Binary tree** | `tikz` `\node {root} child {node {left}} child {node {right}};` with `level distance=` and `sibling distance=`. **Don't use `qtree` / `\Tree`** — not preloaded. |
| **DAG** | Plain `tikz` with `\foreach \pos/\name/\disp in {…} \node …; \foreach \src/\dst in {…} \draw[->,thick] (\src) -- (\dst);`. Works directly. |
| **FSM** | Manual `state/.style={draw,circle,minimum size=8mm}` + `accepting/.style={double, double distance=1.2pt}`. Initial-arrow with `\draw[->] ($(q1)+(-0.9,0)$) -- (q1)`. **Don't `\usetikzlibrary{automata}`** — not preloaded. |
| **Karnaugh map** | `tikz` `\matrix [matrix of nodes, nodes={draw,minimum size=12mm}, row sep=-\pgflinewidth, column sep=-\pgflinewidth] { 1 & 0 & 1 & 1 \\ … };`. **Don't `\input kvmacros`** — not preloaded. |
| **OBDD** | Plain `tikz` with circle nodes for variables + rectangle nodes for terminals; solid `\draw[->]` for 1-edges and `\draw[->,dashed]` for 0-edges. Works directly. |
| **Logic circuit** | Don't try `circuitikz` or `shapes.gates.logic.US` — both fail. Two paths: (a) manually draw gate shapes with `\draw` paths (verbose), or (b) symbolic representation via **Mermaid flowchart** (gate name in a labelled node) or `.ve-graph` (Graphviz `dot`). For schematic-quality diagrams, embed an external SVG. |
| **General graph + functions** | Plain `tikz` for graphs (works directly). For function curves: `\draw[blue,thick,domain=-1.4:1.4,smooth,samples=80,variable=\x] plot ({\x}, {\x*\x*\x - \x});`. **Don't use `pgfplots`** — not preloaded. For complex multi-axis plots, route to `.ve-chart` (Chart.js). |
| **Misc** (signal-flow, custom shapes) | If the upstream uses a custom `.sty` or `.code.tex` (e.g. Kleemans's `signalflowdiagram`), inline its definitions inside the `<script type="text/tikz">` — TikZJax accepts arbitrary preamble before `\begin{tikzpicture}`. Verify per-diagram in isolation. |

## Detecting silent failure during development

If you generate a `.ve-tikz` figure and the user reports "I see nothing" or "only the title", the cause is almost always one of:

1. A LaTeX error in this diagram OR a previous one on the same page (WASM crash, see above)
2. A `\usepackage{...}` or `\usetikzlibrary{...}` for a non-preloaded package
3. A non-Latin1 character in the source (TikZJax expects ASCII / Latin1)
4. A complex compile that legitimately timed out (>15s — switch to a simpler representation or `.ve-graph`)

When in doubt, build a one-diagram-per-page test, capture the browser console, and look for `! LaTeX Error` or `! Package pgfkeys Error` lines. The first such line names the offending package or undefined key.

## Detecting silent failure

If you generate a `.ve-tikz` figure and the user reports "I see only the title and the legend, no graph", the cause is almost always:
1. A missing package (most common)
2. A non-Latin1 character in the TikZ source (TikZJax's internal `btoa` chokes — keep the source pure ASCII; put any unicode in surrounding HTML)
3. A complex compile that timed out (>15 s — switch to Graphviz)

The fix is the same in all three cases: **switch the figure to `.ve-graph`** for graph-shaped content, or rewrite without the offending package for static figures.
