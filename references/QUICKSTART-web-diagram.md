# QUICKSTART — /amvcp-generate-web-diagram (one read, then build)

The condensed load-bearing contract for generating a diagram page **fast**.
Read THIS first; open the deep references only for what this doesn't cover.
Target: goal → pixels in under 60 seconds.

## 0. Fast path (default)

1. **Copy the template** `templates/graphviz-diagram.html` (directed graphs)
   or `templates/mermaid-flowchart.html` (simple ≤10-node flowcharts) into
   `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<name>.html`.
2. Fill every `<!-- FILL: … -->` slot — content transplant, no re-authoring.
3. `cp scripts/amvcp-designmd.js scripts/amvcp-runtime.js <same dir>/`
4. Open: `python3 scripts/amvcp-select.py <file>.html` (background it; the
   submit/exit POST comes back on stdout as `{kind, count, selections:[…]}`).
5. Verify BOTH themes in one pass (flip `data-ve-theme` on `<html>`,
   screenshot light + dark). Single-theme is a correctness defect.

**Batch your reads.** If you must open references, read them ALL in one
parallel tool-call message — never serially.

## 1. Engine routing (one line each)

| Shape | Engine |
|---|---|
| Non-trivial directed graph (9+ nodes, loops, forks, clusters) | `.ve-graph` (Graphviz `dot`) — the template |
| Quick flowchart / simple state machine (≤10 nodes) | Mermaid (`templates/mermaid-flowchart.html`) |
| Force / radial layout | `.ve-graph` + `data-ve-graph-engine="neato|sfdp|circo|twopi"` |
| Positions carry physical meaning | `.ve-tikz` manual grid |

## 2. The six traps (each cost a real debug round-trip once)

0. **No-new-elements highlight rule** — hover/selection only re-paint the
   EXISTING element (brightness + glow + stroke re-color). Never add frames,
   rings, fills-on-top, or outlines; an `outline` on an SVG group renders as
   its bounding-box RECTANGLE (extra frame on nodes; a huge clipped rectangle
   on long bezier edges). Page CSS re-colors strokes only — the runtime owns
   the brightness/glow state deltas (a page fill-tint stacks into mud).

1. **DESIGN.md fences** — the embedded `<script type="text/design-md">`
   payload MUST open with `---` on line 1 and close with `---`.
   `parseDesignMd` is fail-fast; without fences the engine **silently**
   falls back to the built-in palette (your custom theme never applies —
   the only symptom is a `console.error`). Page CSS var() fallbacks mask it.
2. **Rounded boxes are `<path>`** — Graphviz `style=rounded` nodes emit
   `<path>`, plain boxes `<polygon>`, ovals `<ellipse>`. Node CSS must
   target `path, polygon, ellipse` or fills/strokes silently never apply.
3. **Never style `path[data-ve-hit="1"]`** — that's the runtime's invisible
   edge hit-area twin; painting it doubles every edge on hover.
4. **Never `fill:` an edge `path`** — open curves close implicitly and
   paint a giant blob. Paths get `stroke` only; arrowhead `polygon`s get both.
5. **Mirror every `:hover` rule to `[data-ve-selected="1"]`** — hover and
   selected use the same paint; the runtime adds the glow on hover only.

## 3. Page contract (already satisfied by the template)

- Load order: `amvcp-designmd.js` → `amvcp-runtime.js`, copied next to the
  page, referenced relatively. The runtime auto-boots the DESIGN.md engine,
  renders `.ve-graph` (lazy @viz-js WASM from CDN), wires selection, and
  injects zoom/pan controls.
- `:root { --ve-accent: var(--vc-color-accent, …) }` — the hover-glow color.
- **Every color/font/radius reads a `--vc-*` token** with the default-theme
  value as the `var()` fallback. Never hardcode in scaffold rules — a theme
  flip must re-paint everything, including the graph (DOT colors are
  structural only; CSS overrides win over SVG presentation attributes).
- Atoms: the runtime stamps `data-ve-id="ve-node-<name>"` /
  `ve-edge-<from>-to-<to>` on every node/edge automatically; author-supplied
  DOT `id="ve-…"` wins. Stamp supporting cards/rows/callouts with
  `data-ve-id` + `data-ve-type` + `data-ve-label`; don't stamp `<button>`,
  `<a>`, decorative prose, or `<body>`.
- No nested scrollbars: `html,body{overflow-x:auto}`, `.ve-graph{overflow:
  visible}`, **no `max-height` on the SVG** — the page expands.

## 4. DOT defaults that work (baked into the template)

```dot
rankdir=TB; splines=spline; bgcolor="transparent"; nodesep=0.42; ranksep=0.52;
node [shape=box, style="rounded,filled", penwidth=1.6, fontname="Courier",
      fontsize=15, margin="0.24,0.14"];
edge [penwidth=1.3, arrowsize=0.8, fontname="Courier", fontsize=12];
```

- `TB` for complex graphs (LR only for short linear flows).
- Multi-line labels: `\n` inside the label string. `$…$` → KaTeX.
- Loop-back / secondary edges: `constraint=false` keeps ranks linear.
- `{ rank=same; a; b; }` pins siblings to one layer.
- Per-group color coding: target nodes in CSS via
  `.ve-graph svg .node[data-ve-id="ve-node-x"] path { stroke: var(--vc-color-info) }`.

## 5. Aesthetics in 20 seconds

Vary per page. Banned: Inter/Roboto body, indigo-violet `#8b5cf6`-family
accents, cyan+magenta neon, gradient text, animated glows. Good pairings:
IBM Plex Sans+Mono · DM Sans+Fira Code · Instrument Serif+JetBrains Mono.
Good accents: deep blue+gold · teal+slate · terracotta+sage. Subtle grid or
radial atmosphere beats flat backgrounds; staggered `fadeUp` entry behind
`prefers-reduced-motion` is almost always worth it.

## 6. Deep references (only when needed)

- `references/interactive-selection-base.md` — full selection/runner contract
- `skills/amvcp-graph-diagrams/references/graphviz-cookbook.md` — DOT recipes
- `skills/amvcp-graph-diagrams/references/mermaid-integration.md` — Mermaid clicks
- `references/styling-guide.md` + `references/anti-patterns.md` — aesthetics
- `references/css-patterns.md` — page chrome patterns
