# Composing with other skills

How the diagram skill plays with its sibling skills in the
plugin — `chart`, `code-highlight`, `interactive-controls`,
`modal-comments`, `slide-decks`, `wireframe`, `animation`,
`tables`, `typography`. Understanding the seams lets the agent
compose richer pages without re-inventing wheels.

## The boundary map

| Other skill | What it does | Boundary with diagram |
|---|---|---|
| `chart` | numeric-axis charts | Anything with a numeric axis (line/bar/pie/scatter). Diagram hands off the moment data needs an axis. |
| `code-highlight` | code blocks | Detail panel snippets, callout code, anything in `<pre class="ve-code-block">`. Diagram never tries to syntax-highlight. |
| `interactive-controls` | toolbars, exports | Export to PNG/SVG/PDF, theme switchers, slider widgets — all live in `interactive-controls`, never bundled per-diagram. |
| `modal-comments` | comment threads | Each click on a diagram node opens a thread. Diagram emits the selection atom; modal-comments owns the thread UI. |
| `slide-decks` | slide-typed JSON | A slide's `{"type":"diagram", ...}` block delegates to this skill. Diagram doesn't know it's in a slide. |
| `wireframe` | UI wireframes | Wireframes share node primitives (boxes, devices). Diagram covers process/architecture; wireframe covers UI mockups. |
| `animation` | motion tokens, keyframes | Flow-animation duration / easing tokens live in `animation`. Diagram reads `--vc-duration-*` / `--vc-easing-*`. |
| `tables` | data tables | When a "diagram" is really a 2D matrix, hand off to `tables` (a decision table beats a decision tree at scale). |
| `typography` | type scale, fluid sizing | Diagram labels read `--vc-text-*` and `--vc-font-*` — typography owns those tokens. |

## Composition patterns

### Diagram inside a code-walkthrough

A common shape: a process flow at the top of a section, with
the prose underneath explaining each step. The diagram nodes
link (via click-step + detail panel) to code snippets:

```html
<section>
  <h2>Authentication flow</h2>

  <div class="ve-diagram-with-panel">
    <!-- Diagram from this skill -->
    <div class="ve-scene-graph" data-ve-scene-preset="process-flow">
      <script type="application/json">{ ... }</script>
    </div>

    <!-- Detail panel populated on click -->
    <aside class="ve-detail-panel">
      <h3 class="ve-detail-panel__title">Click a step</h3>
      <pre class="ve-code-block"><code class="language-ts">
// The detail panel's code uses the code-highlight skill.
      </code></pre>
    </aside>
  </div>
</section>
```

Diagram skill renders the SVG; code-highlight skill themes the
`<pre>` and tokenizes the language; interactive-controls (if
needed) supplies a "copy code" button for the snippet.

### Diagram inside a slide

A slide's JSON specifies a `diagram` block:

```json
{
  "type": "diagram",
  "preset": "phase-graph",
  "scene": { ... full scene graph ... }
}
```

The slide-decks skill renders the slide chrome (title, footer,
nav); the diagram block delegates to this skill. The diagram
re-themes naturally as the slide's DESIGN.md applies.

### Diagram with chart inline

A flow diagram with one node showing a small inline chart (a
sparkline of throughput, a tiny ring of cache hit rate):

The chart is its own selectable atom (`chart-point`); the
diagram's atom (`diagram-node`) is separate. They coexist in
the page without conflict.

For a node WITH an embedded mini-chart:

```html
<!-- Diagram node rendered -->
<g data-ve-id="vc-scene-1-node-3" data-ve-type="diagram-node">
  <rect ... />
  <text>API throughput</text>
  <!-- Foreign object hosts the chart -->
  <foreignObject x="20" y="40" width="160" height="40">
    <div class="ve-chart-sparkline" data-ve-block="chart">
      <!-- Chart skill picks up here -->
    </div>
  </foreignObject>
</g>
```

`<foreignObject>` lets HTML live inside SVG. The chart skill
handles its content; the diagram node still owns the outer
selection.

### Diagram driven by a slider

Combining `teaching-diagram-perturbable.md` with
`interactive-controls`:

```html
<div class="ve-teach-diagram">
  <!-- Slider widget from interactive-controls -->
  <input type="range" data-ve-block="control"
         data-ve-control-type="slider"
         data-ve-target="vnodes" min="1" max="200" value="40">

  <!-- Diagram from this skill -->
  <div class="ve-scene-graph" data-ve-block="diagram"
       data-ve-scene-preset="free"
       data-ve-driven-by="vnodes">
    <script type="application/json">{ ... }</script>
  </div>
</div>
```

The slider's `input` event triggers a recompute that rebuilds
the scene graph and re-renders.

### Diagram in a report-doc

Long-form docs (multiple sections, prose, tables, code blocks,
embedded diagrams). The report-doc skill is the container; this
skill is one of many block types it composes.

### Diagram with modal-comment threads

Every selectable atom in a diagram can carry a comment thread.
The thread state lives in the `modal-comments` skill's storage;
the diagram only provides the anchor point via `data-ve-id`.

When the user clicks a node:

1. The diagram skill's selection POST fires.
2. The runtime opens the modal-comments panel for that anchor.
3. The thread loads, the user comments, the agent responds.
4. The comment-thread state is associated with `nodeId` (stable
   across page renders).

## What the diagram skill OWNS vs DELEGATES

### Diagram OWNS

- The SVG scene graph and ASCII fallback.
- Node-type vocabulary (7 shapes).
- Edge routing strategies (4 modes).
- Theming primitives (the role tints).
- Flow animation tokens consumption.
- Group container rendering.
- Selection atom emission (`diagram-node`, `diagram-edge`,
  `diagram-group`).
- Chain highlight for `phase-graph`.

### Diagram DELEGATES

- Color/font/size token DEFINITIONS — to `design-tokens` /
  `typography`.
- Code snippet rendering inside detail panels — to
  `code-highlight`.
- Numeric-axis charts — to `chart`.
- Export buttons (PNG/SVG/PDF) — to `interactive-controls`.
- Comment threads on selection — to `modal-comments`.
- Slide chrome (when in a slide) — to `slide-decks`.
- Mermaid / Graphviz auto-layout graphs — to
  `amvcp-graph-diagrams`.
- Tabular data — to `tables`.
- Wireframe device frames + UI primitives — to `wireframe` /
  `icon-svg`.
- Motion tokens — to `animation`.

## When to compose vs when to hand off

**Compose** when:

- The diagram is the primary content; the other skill enriches
  it (a side panel, an export, a slider).

**Hand off** when:

- The other skill is the BETTER tool (auto-layout graphs to
  Graphviz; numeric data to chart).

The decision tree from `notation-dispatch.md` is the canonical
guide for hand-offs.

## Anti-patterns

- Re-implementing a chart inside a diagram (`free` preset with
  bars hand-positioned): use the chart skill.
- Inline-styling code blocks inside diagram detail panels: use
  the code-highlight skill.
- Diagram with built-in PNG export button: use
  interactive-controls' shared toolbar.
- Hand-rolling comment UI per-node: use modal-comments.
- Auto-layout graph hand-positioned via the `free` preset:
  use Graphviz.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: when composing
across skills, screenshot the FULL composed view at light + dark.
Verify:

- The diagram's theming matches the surrounding content (all
  tokens trace back to the same DESIGN.md).
- Selection atoms from different skills don't collide (clicks
  go to the right handler).
- Layout doesn't break (a diagram next to a code block in a
  grid layout fits without overflow).
