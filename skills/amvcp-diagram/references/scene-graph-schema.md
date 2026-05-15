# Scene-graph schema

The JSON contract for `amvcp-diagram.js`. The agent emits this document
inside a `<script type="application/json">` nested in a
`<div class="ve-scene-graph">`; the runtime validates it (fail-fast)
and renders it to a themed, selectable SVG.

## The authoring surface

```html
<div class="ve-scene-graph" data-ve-scene-preset="process-flow">
  <script type="application/json">
  {
    "version": 1,
    "preset": "process-flow",
    "grid": 4,
    "width": 1040,
    "height": 240,
    "nodes": [
      { "id": "start",  "type": "start",      "label": "Start" },
      { "id": "ingest", "type": "process",    "label": "Ingest",
        "role": "service" },
      { "id": "check",  "type": "decision",   "label": "Valid?" },
      { "id": "store",  "type": "subprocess", "label": "Persist",
        "role": "data" },
      { "id": "done",   "type": "end",        "label": "Complete" }
    ],
    "edges": [
      { "from": "start",  "to": "ingest" },
      { "from": "ingest", "to": "check" },
      { "from": "check",  "to": "store", "label": "yes" },
      { "from": "store",  "to": "done" },
      { "from": "check",  "to": "start", "label": "no",
        "style": "dashed", "route": "loop" }
    ]
  }
  </script>
</div>
```

The JSON is *embedded*, never escaped — this is the XSS-safe convention
(the JSON sits in a `<script>` the browser does not execute as code).
No author writes SVG by hand.

## SceneGraph

| Field | Type | Required | Notes |
|---|---|---|---|
| `version` | `1` | yes | anything else is a fail-fast error |
| `preset` | string | no | `process-flow` \| `architecture-canvas` \| `phase-graph` \| `free` (default `free`) |
| `grid` | number | no | snap step in user units (default 4) |
| `width` | number | yes | viewBox width; must be > 0 |
| `height` | number | yes | viewBox height; must be > 0 |
| `background` | string | no | `grid` \| `plain` \| `none` (default `none`) |
| `nodes` | Node[] | yes | at least one node |
| `edges` | Edge[] | no | |
| `groups` | Group[] | no | layer/container rects, drawn first |

## Node

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | unique — a duplicate id is a fail-fast error |
| `type` | NodeType | yes | see the node-type library below |
| `label` | string | yes | the text inside the node |
| `x`, `y` | number | for `free` | auto-placed for other presets |
| `w`, `h` | number | no | defaults per node type |
| `role` | string | no | semantic fill (see the role map) |
| `detail` | string | no | a second line of text inside the node |
| `group` | string | no | a group id this node belongs to |

## Edge

| Field | Type | Required | Notes |
|---|---|---|---|
| `from`, `to` | string | yes | must reference existing node ids |
| `label` | string | no | a chip at the path midpoint |
| `style` | string | no | `solid` \| `dashed` \| `dotted` (default `solid`) |
| `route` | string | no | `straight` \| `ortho` \| `bezier` \| `loop` (default `ortho`) |
| `animate` | string | no | `none` \| `flow` \| `particle` \| `pulse` (default `none`) |
| `arrow` | string | no | `end` \| `start` \| `both` \| `none` (default `end`) |

## Group

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | unique |
| `label` | string | no | drawn at the group's top-left |
| `x`,`y`,`w`,`h` | number | yes | the group rectangle |
| `role` | string | no | tints the group fill (same enum as Node.role) |

## Validation (all fail-fast)

The renderer throws — and paints a red error box into the figure — on
any of: `version !== 1`; empty `nodes`; a duplicate node id; an unknown
node `type`; an unknown `role`/`style`/`route`/`animate`/`arrow`; an
edge whose `from`/`to` is not a node id; a node missing `x`/`y` in a
`free` scene; a non-numeric or non-positive `width`/`height`; a group
missing numeric `x`/`y`/`w`/`h`. There is NO silent fallback to an
empty SVG — a malformed scene is always surfaced.

## Node-type library

| `type` | Shape | Default w×h | Semantic stroke |
|---|---|---|---|
| `start` | rounded pill | 110×40 | `--vc-color-info` |
| `process` | rounded rect | 160×80 | role-driven |
| `decision` | diamond | 90×90 | `--vc-color-warning` |
| `subprocess` | double-border rect | 160×80 | role-driven |
| `end` | rounded pill | 110×40 | `--vc-color-success` |
| `external` | dashed-stroke rect | 160×80 | `--vc-color-content-subtle` |
| `card` | rect (phase-graph) | 200×120 | role-driven |

Shape geometry (the diamond's rotation, the pill's radius) is
structural. Fill and stroke are themed — see the role map below.

## Role -> token fill map

A node's `role` semantically tints it off the `--vc-*` palette. The
fill is a `color-mix` toward the surface so a node is a tint, not a
flat block.

| `role` | fill | stroke |
|---|---|---|
| `client` | 14% `--vc-color-info` over surface | `--vc-color-info` |
| `service` | 14% `--vc-color-accent` over surface | `--vc-color-accent` |
| `data` | 14% `--vc-color-success` over surface | `--vc-color-success` |
| `infra` | 14% `--vc-color-warning` over surface | `--vc-color-warning` |
| `external` | `--vc-color-surface-sunken` | `--vc-color-content-subtle` |
| `accent` | 22% `--vc-color-accent` over surface | `--vc-color-accent` |
| (none) | `--vc-color-surface` | `--vc-color-border-strong` |

A node `type`'s own semantic stroke (`start`/`decision`/`end`/
`external`) wins over the role stroke. Fills are emitted as
`var(--vc-*)` expressions directly into the SVG, so a theme swap
re-themes the diagram with zero JS.

## The three presets

**`process-flow`** — a horizontal step lane. `process` nodes get a
numbered step badge above them. Auto-place lays nodes left-to-right.

**`architecture-canvas`** — a layered system diagram. `groups` are the
layers (client / service / data / infra), drawn first as semi-
transparent role-tinted rects. Use `background: "grid"` for the
blueprint grid. Connect layers with `route: "bezier"`.

**`phase-graph`** — a plan with dependencies. Nodes are larger `card`
nodes carrying a `label` + `detail` (duration / status). Edges are
`route: "bezier"` dependency links. **Clicking a node highlights its
transitive dependency chain** — every node reachable via `from->to`
edges is brightened, the rest dimmed; a second click clears it.

**`free`** — no auto-layout. The agent supplies every `x`/`y`. The
escape hatch for floor plans, racks, schematics — anything where the
agent knows the exact geometry.

## Auto-placement (presets other than `free`)

When nodes lack `x`/`y`, `autoPlace` assigns coordinates by node count:
`n <= 4` → one horizontal row; `5..8` → two rows; `n >= 9` → circular.
`process-flow` always lays the row horizontal-first (it is a lane).
`phase-graph` uses longest-path layering — rank by dependency depth,
rank → column.

## Edge routing

- `straight` — a direct line.
- `ortho` (default) — Manhattan L/Z routing through one or two elbows.
- `bezier` — a cubic Bézier; control points offset along the dominant
  axis.
- `loop` — a back-edge that bows out and returns; for retry / no paths.

Every edge gets a 14px-wide transparent twin path so thin edges stay
easy to click. Arrowheads are a single `<marker>` whose fill inherits
the edge stroke (`context-stroke`), so they re-theme for free.

## Selection

Every node is `<g data-ve-id data-ve-type="diagram-node">`; every edge
is `<g data-ve-id data-ve-type="diagram-edge">`. The visible shape is a
DIRECT child of the `<g>` so the runtime's
`svg g[data-ve-id]:hover > rect|polygon|path` selection CSS lights it
up with zero new CSS. `data-ve-data` carries `{sceneId, kind, nodeType
| edgeStyle, …}` so a click POSTs the agent enough context to act.
