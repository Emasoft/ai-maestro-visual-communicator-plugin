# `free` preset and explicit geometry

The `free` preset is the **escape hatch** — no auto-layout, no
auto-placement, no opinionated defaults. The agent supplies every
node's `x` and `y` and the engine places the SVG faithfully. Use
`free` for diagrams whose visual structure encodes domain meaning
that no generic layout could express: floor plans, server racks,
schematics, circuit layouts, blueprint drawings, geographic-coded
diagrams.

## When to choose `free`

Use `free` when:

- The **node positions carry meaning** — a server rack diagram has
  to put the unit in the right U position; a floor plan has to put
  the meeting room next to the elevator.
- You are drawing a **schematic** where geometry is mostly correct
  (the engine helps you snap to grid, theme the boxes, and route
  edges) but no preset's auto-placement fits.
- You need to **lock specific nodes** in place while allowing the
  rest to auto-place: supply `x`/`y` on the locked ones; the engine
  auto-places the rest.

Do NOT use `free` when:

- A simpler preset would do (you are reinventing `process-flow` by
  manually positioning a row of nodes — switch to `process-flow`).
- The diagram has no positional intent (you are placing nodes
  arbitrarily because you have to). Pick `process-flow`,
  `architecture-canvas`, or `phase-graph` — they will do a better
  job than ad-hoc coordinates.

## Scaffold (a server rack)

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "background": "grid",
    "width": 320,
    "height": 840,
    "groups": [
      { "id": "rack-frame", "label": "Rack A",
        "x": 40, "y": 20, "w": 240, "h": 800, "role": "infra" }
    ],
    "nodes": [
      { "id": "u42", "type": "process", "label": "u42  switch",
        "x": 60, "y": 40,  "w": 200, "h": 36, "role": "infra" },
      { "id": "u41", "type": "process", "label": "u41  patch panel",
        "x": 60, "y": 84,  "w": 200, "h": 36 },
      { "id": "u40", "type": "process", "label": "u40  router",
        "x": 60, "y": 128, "w": 200, "h": 36, "role": "infra" },
      { "id": "u20", "type": "subprocess", "label": "u20-u23  DB primary",
        "x": 60, "y": 600, "w": 200, "h": 152, "role": "data" },
      { "id": "u18", "type": "subprocess", "label": "u18-u19  DB replica",
        "x": 60, "y": 760, "w": 200, "h": 56, "role": "data" }
    ],
    "edges": []
  }
  </script>
</div>
```

A rack diagram is a perfect `free` candidate: every node is *at* a
specific U position; the position encodes the rack-unit number; no
auto-layout would preserve that.

## Coordinate space

The scene's `width`/`height` define the SVG `viewBox`. The viewBox
units are an **arbitrary user space** — they are NOT pixels. Common
patterns:

- `width: 1000, height: 1000` — easy mental math; one unit ~= 1
  conceptual pixel at default zoom.
- `width: 1280, height: 720` — 16:9, slide-deck friendly.
- `width: 100, height: 100` — schematic where you think in
  percentages.

The browser renders the SVG `width: 100%; height: auto`, so the
viewBox is reflowed by the page width. A 1000-wide viewBox at 50%
page width renders at 500 CSS pixels.

## Grid snapping

`grid: <N>` in the scene rounds every node's `x`, `y`, `w`, `h` to
the nearest multiple of N at render time. Default `grid: 4`. A 4-
unit grid is fine enough that the snapping is invisible to the eye
but tight enough that nodes align perfectly.

If you want NO snapping (you authored exact coordinates and want
them preserved), set `grid: 1`. If you want stronger snapping (a
schematic on a 20-unit grid), set `grid: 20`.

## Background grid

`background: "grid"` paints a faint blueprint grid. In a `free`
diagram, the grid is especially helpful — the reader can SEE the
snap step and judge alignments. Combine with the `blueprint`
theme for a full engineering-drawing look.

`background: "plain"` paints `--vc-color-surface-sunken` as a
faint backdrop (subtle separation from the page background).
`background: "none"` leaves the SVG transparent — useful when the
diagram sits on a tinted hero panel.

## Mixing auto-placed and explicit nodes

Even in `free`, you can leave some nodes' coordinates off; the
engine will auto-place those nodes among the gaps. But the auto-
place algorithm is the count-based one (1 row / 2 rows / circle)
which usually clashes with whatever explicit coordinates you've
chosen. In practice: use `free` either ENTIRELY explicit or
switch to a placed preset.

The one exception: a `free` floor plan with a few labelled hot-
spots (a doorway, a stair) you DON'T care about positioning
exactly — leave them coordinate-free and the engine will tuck
them into the lower-right.

## Edges in a `free` diagram

Routing in `free` is the same as anywhere else: `straight`,
`ortho`, `bezier`, `loop`. **Choose `ortho` for schematics** — it
mirrors the right-angled paths of real circuit traces and rack
cable runs. `bezier` is wrong for engineering drawings.

## Groups as containers

A group rect in `free` mode is the standard way to draw a
container: a rack frame, a building outline, a chassis. The
group's `role` tints the fill, the `label` appears at the top-
left, and clicks on the group select the whole container.

Containers can nest visually (one group inside another spatially)
but the engine has no parent/child group model — each group is
drawn independently. If you need nested containers, just position
the inner group inside the outer one's coordinates.

## DESIGN.md tokens consumed

Same as the other presets — color, typography, radius, and the
grid line color. The `free` preset adds no new token consumption.

## Selection atoms

Standard `diagram-node` / `diagram-edge` / `diagram-group` atoms.
`data-ve-data` on a node carries the explicit coordinates so the
agent can act on geometry:

```json
{ "sceneId": 11, "kind": "node",
  "nodeId": "u20", "nodeType": "subprocess",
  "label": "u20-u23  DB primary",
  "x": 60, "y": 600, "w": 200, "h": 152 }
```

## Use-case archetypes

### Floor plan

```json
{ "id": "lobby", "type": "process", "label": "Lobby",
  "x": 0,   "y": 0,   "w": 200, "h": 80 },
{ "id": "elev", "type": "process", "label": "Elevator",
  "x": 200, "y": 0,   "w": 80,  "h": 80 },
{ "id": "mtg",  "type": "process", "label": "Mtg Room A",
  "x": 0,   "y": 80,  "w": 140, "h": 100 }
```

Geometry = the room. Edges are doorways (1-unit-wide rects, or
short ortho lines).

### Server rack

See the scaffold above. Each U is a node; nodes are 36-tall
(1U) or multiples thereof.

### Circuit-board layout

A schematic where each component (resistor, IC, capacitor) is a
node placed by its physical position on the board. Edges are
traces; `route: "ortho"` mirrors real PCB traces.

### Geographic mini-map

Cities as nodes, transit links as edges. Coordinates are scaled
lat/lon. The map is approximate — for accurate maps, use a real
map renderer; `free` is fine for "here's how the three offices
are connected" sketches.

## Anti-patterns

- Re-implementing `process-flow` in `free`: every node manually
  placed in a left-to-right row. Switch presets.
- Coordinates with arbitrary numbers (`x: 137.4`): use the grid
  (multiples of 4 or whatever your `grid` is set to). Arbitrary
  coordinates produce visual jitter.
- Forgetting to set `width`/`height` to enclose the nodes:
  contents render outside the viewBox and the page-level overflow
  rules clip them or trigger an unwanted scrollbar.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot at light and dark. Pay special attention to whether
the coordinates render where you intended — `free` mode has no
auto-correction, so a miscount in the JSON produces a visually
"off" diagram that is hard to spot in code review but obvious in
a screenshot. Confirm the grid background aligns with node
edges (a sign your nodes are correctly snapped).
