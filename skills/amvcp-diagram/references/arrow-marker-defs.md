# Arrow markers and edge-semantics styling

How edge arrows are drawn, how multi-marker schemes encode edge
semantics (gray default + olive success + rust failure), and the
trade-offs around inline markers vs `<defs>` sharing.

## The single-marker base case

The engine ships ONE arrow marker per scene by default. It is
defined once in the scene's `<defs>` and referenced by every edge:

```html
<defs>
  <marker id="vc-arrow-12" markerWidth="10" markerHeight="10"
          refX="9" refY="3" orient="auto"
          markerUnits="strokeWidth">
    <path d="M0,0 L10,3 L0,6 z" fill="context-stroke"/>
  </marker>
</defs>
<path d="M40,80 L260,80" stroke="var(--vc-color-border-strong)"
      stroke-width="1.5"
      marker-end="url(#vc-arrow-12)"/>
```

The marker `id` is scoped to the scene by suffix (`-12` here is
the scene id) so multiple scenes on a page don't collide.

The marker's `fill="context-stroke"` means **the marker inherits
the edge's stroke color**. Re-theme the edge -> the arrowhead
re-themes for free; no per-marker recoloring.

## Why scene-scoped marker ids matter

If two scenes shared `id="vc-arrow"`, browsers would render only
ONE marker for both scenes (the first one wins by HTML id rules),
and the second scene's arrows would inherit the first scene's
geometry. Suffixing with the scene id avoids the collision.

## Multi-marker edge semantics (3-marker pattern)

When a diagram has multiple **kinds** of relationships — success
edges, failure edges, async edges — define one marker per kind:

```html
<defs>
  <marker id="vc-arrow-12"        ...><path d="M0,0 L10,3 L0,6 z"
        fill="context-stroke"/></marker>
  <marker id="vc-arrow-12-success" ...><path d="M0,0 L10,3 L0,6 z"
        fill="var(--vc-color-success)"/></marker>
  <marker id="vc-arrow-12-failure" ...><path d="M0,0 L10,3 L0,6 z"
        fill="var(--vc-color-danger)"/></marker>
</defs>
```

Note the success/failure markers use a fixed `fill` (not
`context-stroke`) so they retain their semantic color even when
the edge is drawn in the default stroke. This is the **3-marker
pattern** lifted from `13-flowchart-diagram` in the html-effectiveness
catalog.

Reference per edge:

```html
<path ... stroke="var(--vc-color-success)" marker-end="url(#vc-arrow-12-success)"/>
<path ... stroke="var(--vc-color-danger)"  marker-end="url(#vc-arrow-12-failure)"/>
```

The reader sees: gray default arrows for the "happy path", olive
arrows highlighting successful sub-flows, rust arrows pointing
out failure branches. The shape is identical for all three; the
COLOR carries the semantic.

## When to extend the scheme

A typical diagram should ship at most 3 marker variants — default
+ success + failure. More variants dilute the semantic. If you
need:

- A 4th color = primary/highlight = add `vc-arrow-12-primary`
  pinned to `--vc-color-accent`.
- A 5th = "asynchronous" = better signaled by `style: "dashed"`
  on the edge than by a fifth color.

Past 4 marker variants the diagram is leaking complexity and
should be split into multiple smaller diagrams or a phase-graph.

## Marker geometry

Standard arrow geometry:

```
M0,0 L10,3 L0,6 z
```

A 10x6 triangle, pointing right (the orientation rotates with the
edge — `orient="auto"`). Variants:

| Shape | `d` |
|---|---|
| filled triangle (default) | `M0,0 L10,3 L0,6 z` |
| open triangle (V) | `M0,0 L10,3 L0,6` (no `z`) |
| diamond | `M0,3 L5,0 L10,3 L5,6 z` |
| circle (no fill) | `<circle cx="3" cy="3" r="3"/>` |
| crow's foot (cardinality) | `M0,0 L0,6 M0,3 L8,0 M0,3 L8,6` |

ER diagrams use crow's foot and circle markers to encode
cardinality. The engine's `card` preset doesn't ship those by
default; for ER specifically, hand off to
`amvcp-graph-diagrams` Mermaid `erDiagram`.

## Marker units and stroke-width scaling

`markerUnits="strokeWidth"` scales the marker with the edge stroke
width. A 1.5px-stroke edge gets a 15x9 effective marker (10*1.5 x
6*1.5). This keeps arrows visually proportional to their lines.

`markerUnits="userSpaceOnUse"` makes the marker a fixed size
regardless of edge stroke — useful when you want big arrowheads
on thin trace-like lines (a flow diagram emphasizing direction
over the line itself).

## `refX` / `refY` — where the marker anchors

`refX="9"` puts the marker's anchor point at x=9 in marker
coordinates. The marker then attaches to the path endpoint with
that anchor sitting on the endpoint — so the arrow's TIP (at
x=10) extends one unit past the endpoint, and the arrow LOOKS
like it's touching the destination node's edge.

If the arrowhead overlaps the destination node's border, reduce
`refX` (e.g. `refX="11"`). If there's a visible gap between the
arrow tip and the node border, increase `refX` slightly.

Common values: `refX="9"` for a 10-wide triangle pointing into a
node; `refX="0"` for a marker that should sit at the path origin
(used for `marker-start`).

## Bidirectional edges

For `arrow: "both"`, place a marker at each end:

```html
<path ... marker-start="url(#vc-arrow-12-rev)"
          marker-end="url(#vc-arrow-12)"/>
```

The "reverse" marker is the same triangle drawn pointing the
other way (`M0,3 L10,0 L10,6 z` instead of `M0,0 L10,3 L0,6 z`).
The engine defines `vc-arrow-12-rev` when any edge in the scene
has `arrow: "both"` or `arrow: "start"`.

## Animated arrowheads

A common request: "make the arrowhead pulse to draw attention". The
engine's approach: instead of animating the marker (which is
brittle across browsers), animate the EDGE color, and the marker
follows because of `context-stroke`:

```html
<animate attributeName="stroke" values="
  var(--vc-color-border-strong);
  var(--vc-color-accent);
  var(--vc-color-border-strong)"
  dur="1.2s" repeatCount="indefinite"/>
```

The arrow tip pulses in sync with the line color. Wrap in a
`prefers-reduced-motion` guard (the engine does this automatically
for `animate: "pulse"` edges).

## DESIGN.md tokens consumed

| Token | Use |
|---|---|
| `--vc-color-border-strong` | default edge + arrow |
| `--vc-color-success` | success-marker fill |
| `--vc-color-danger` | failure-marker fill |
| `--vc-color-accent` | highlighted/animated arrow |

## Anti-patterns

- Inline `<marker>` per edge: gigantic SVG; the `<defs>` reuse
  pattern is mandatory for any non-trivial diagram.
- Markers that don't inherit `context-stroke` when they should:
  re-theme breaks (arrows stay the old color while edges
  re-color).
- Fixed-size markers with strokeWidth-scaled edges: visual
  proportions drift; pick one scaling mode and stick with it.
- Marker `id` not scoped to scene: cross-scene collision on a page
  with two diagrams.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. The arrowhead tells you immediately
whether `context-stroke` is working (arrows the same color as
their edges) or broken (arrows stuck at the old color). Take a
zoomed-in screenshot of one or two arrows to confirm `refX` is
right — the tip should TOUCH the node border, not float above or
overlap.
