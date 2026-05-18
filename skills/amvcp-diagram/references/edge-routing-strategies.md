# Edge routing strategies

## Table of Contents

- [The four routes](#the-four-routes)
- [`straight` — the bare line](#straight--the-bare-line)
- [`ortho` — the workhorse](#ortho--the-workhorse)
- [`bezier` — the curve](#bezier--the-curve)
- [`loop` — the back-edge](#loop--the-back-edge)
- [Edge anchors](#edge-anchors)
- [Edge labels](#edge-labels)
- [Edge styles](#edge-styles)
- [Arrowheads](#arrowheads)
- [The 14px hit-area twin](#the-14px-hit-area-twin)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

The four edge routing modes the engine ships — `straight`, `ortho`,
`bezier`, `loop` — plus authoring guidance on when each is the
right pick.

## The four routes

| `route` | Path shape | Geometry |
|---|---|---|
| `straight` | direct line | A single line segment from anchor A to anchor B |
| `ortho` (default) | Manhattan L/Z | One or two right-angled elbows between A and B |
| `bezier` | cubic curve | Cubic Bezier with control points offset along the dominant axis |
| `loop` | back-edge | A path that bows out perpendicular to the dominant axis and returns |

The default is `ortho` because it matches the visual language of
flowcharts: edges look like circuit traces, snap to right angles,
and rarely cross each other when the layout is right.

## `straight` — the bare line

A single line segment. Use when:

- The two nodes are close together AND aligned (horizontally or
  vertically) — a straight line is the most concise.
- The diagram aesthetic is **minimal** (hand-drawn preset, sketchy
  flow) and the right angles of ortho feel too engineered.
- The edge is a short, axis-aligned annotation (a callout from a
  label to its target).

Do NOT use `straight` for:

- Crossing many other edges — straight lines on a busy diagram
  produce a tangled mess.
- Long edges across the diagram — they cut through any node in the
  way; ortho would route around.

## `ortho` — the workhorse

One or two right-angled elbows. The engine picks the elbow position
to:

1. Leave the source node from the anchor closest to the target.
2. Make the first leg perpendicular to the source's exit face.
3. Make the elbow at the midpoint (or 1/3 / 2/3 if a 2-elbow Z is
   needed to clear an obstacle).
4. Enter the target on its closest face.

`ortho` reads as "data flows through these boxes" — the right
angles emphasize the structure. Use as the default for:

- Process flows (the `process-flow` preset uses `ortho` by
  default).
- Architecture diagrams (when not crossing layers — see `bezier`
  below).
- Floor plans / schematics where right angles match the domain.

## `bezier` — the curve

Cubic Bezier with control points offset along the dominant axis.
The curve gently leaves one node and gently enters the next; no
hard elbow.

Use when:

- The two nodes are in **different layers** of an architecture
  canvas — the curve crosses layers gracefully where an ortho
  jog would look like a circuit board.
- The graph is a **phase graph** with dependency edges that span
  multiple ranks — `phase-graph` defaults to `bezier`.
- You want a softer, more organic feel (a sequence diagram message
  arrow, a sankey-style flow).

The control-point offset distance scales with the edge length —
short bezier edges look almost straight (because the offset
collapses); long bezier edges bow out gracefully. The engine
computes this automatically.

Do NOT use `bezier` for:

- Schematic diagrams (it looks wrong — real circuits don't curve).
- Adjacent-node edges (you'll get a slight wobble where you wanted
  a straight line).

## `loop` — the back-edge

A path that bows OUT perpendicular to the dominant axis and returns.
Use for:

- A retry edge in a process flow (`check -> ingest` after a
  validation failure).
- A self-loop on a state machine (a state that transitions back to
  itself on an event).
- Any back-edge that would otherwise cross the rest of the diagram.

The loop bows out by ~80 units from the dominant axis (configurable
per-edge via `loopOffset` in a future API; for now use the default).

Loops should be labelled — "no", "retry", "again", "again on
error" — so the reader knows what triggers the back-edge.

## Edge anchors

The engine picks anchor points on the four-direction model (top,
right, bottom, left). For a given edge `A -> B`:

1. Compute the centers of A and B.
2. The exit anchor of A is on A's edge closest to B's center.
3. The entry anchor of B is on B's edge closest to A's center.

This is good enough for 95% of layouts. When it's wrong (the
engine picks the bottom of A but you wanted the right side), you
can force the routing by **adding a waypoint** — supply an
intermediate empty node positioned where you want the elbow.

## Edge labels

Set `label: "yes"` on an edge to get a small chip drawn at the
midpoint of the path. The chip is `--vc-color-surface` with a
1px border in `--vc-color-border` so it visually separates from
the line behind it.

Multiple labels on the same edge are not supported (one chip per
edge). For multi-part annotations, break the edge into multiple
edges connecting via a hidden waypoint.

## Edge styles

| `style` | Stroke pattern |
|---|---|
| `solid` (default) | continuous line |
| `dashed` | 8-12 dasharray (clearly broken segments) |
| `dotted` | 2-3 dasharray (dots) |

Convention:

- `solid` = synchronous / always-happens-this-way
- `dashed` = asynchronous / event-driven / fire-and-forget
- `dotted` = logical / reference / "X is implemented by Y"

Mix sparingly — every style in one diagram is noise. Pick the
SINGLE style that carries meaning in this particular diagram and
use it consistently.

## Arrowheads

`arrow: "end"` (default) puts an arrowhead at the destination.
Other options:

| `arrow` | Where |
|---|---|
| `end` | one arrow at the destination |
| `start` | one arrow at the source (rare — "comes from") |
| `both` | bidirectional ("A and B talk to each other") |
| `none` | no arrowhead (a relationship without direction) |

The arrowhead is a single `<marker>` whose fill inherits the edge
stroke (`context-stroke`), so it re-themes for free.

Use `arrow: "none"` for:

- Containment edges (one node "belongs to" another) — often a
  group rect is cleaner.
- "Same as" edges (showing that A and B are equivalent).

Use `arrow: "both"` sparingly — it makes the edge feel undirected,
which is rarely what flowcharts mean.

## The 14px hit-area twin

Every edge gets a 14px-wide TRANSPARENT twin path layered behind
the visible stroke. The twin's wider hit area lets the reader
click thin edges without missing. The CSS:

```css
.ve-scene-graph g[data-ve-type="diagram-edge"] path.hit {
  stroke: transparent;
  stroke-width: 14;
  pointer-events: stroke;
}
.ve-scene-graph g[data-ve-type="diagram-edge"] path.visible {
  stroke: var(--vc-color-border-strong);
  stroke-width: 1.5;
  pointer-events: none;
}
```

The `<g>` carries the `data-ve-id`; the hit-area handles clicks;
the visible path takes the styling. This is a standard SVG
interaction pattern and is invisible to the reader.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-border-strong` (default edge), `--vc-color-accent` (highlighted edge) |
| typography | `--vc-font-body` for edge labels |
| motion | `--vc-duration-slow` for animated edges |

## Anti-patterns

- Bezier in a schematic: looks wrong; ortho mirrors real circuit
  paths.
- Ortho in a phase graph crossing many ranks: produces a circuit-
  board mess; bezier is graceful.
- Straight edges across a busy diagram: tangled; ortho or bezier
  routes around.
- 5 different edge styles in one diagram: noise; the reader can't
  decode.
- No arrowheads on a directed graph: ambiguous; the reader can't
  tell which way data flows.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, then click an edge to verify the
selection lights it up (hover state and selected state). Confirm
the arrowhead is visible at both themes (a common bug — the
arrowhead's fill stops inheriting on theme swap).
