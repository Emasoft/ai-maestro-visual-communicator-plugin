# Data-flow diagram (sync solid + async dashed)

Lifted from `16-implementation-plan` in the html-effectiveness
catalog. A data-flow diagram visualizes **how data moves between
components** — boxes for the components, arrows for the data
paths, with a strict convention that distinguishes synchronous and
asynchronous channels.

## The convention (the discipline)

A data-flow diagram is most useful when it follows ONE rule
consistently:

| Stroke | Semantic |
|---|---|
| **Solid line** | synchronous call — request/response in the same call chain |
| **Dashed line** | asynchronous — event/queue/webhook; producer continues without waiting |

Optional second-axis convention:

| Color | Semantic |
|---|---|
| Default stroke | regular data flow |
| Accent stroke | the path the diagram is calling out (the "hot" path) |

This is a **discipline**, not an engine feature — you encode the
discipline by setting `style: "dashed"` on async edges and
`stroke` on accent edges. The engine respects whatever you set.

## Scaffold

```html
<div class="ve-scene-graph"
     data-ve-scene-preset="architecture-canvas">
  <script type="application/json">
  {
    "version": 1,
    "preset": "architecture-canvas",
    "width": 1200,
    "height": 500,
    "background": "plain",
    "nodes": [
      { "id": "browser", "type": "process", "label": "Browser",
        "role": "client",  "x": 60,   "y": 200, "w": 160, "h": 80 },
      { "id": "api",     "type": "process", "label": "API server",
        "role": "service", "x": 320,  "y": 200, "w": 200, "h": 80 },
      { "id": "queue",   "type": "subprocess", "label": "Event queue",
        "role": "infra",   "x": 620,  "y": 200, "w": 180, "h": 80 },
      { "id": "worker",  "type": "process", "label": "Worker",
        "role": "service", "x": 900,  "y": 200, "w": 180, "h": 80 },
      { "id": "db",      "type": "subprocess", "label": "Postgres",
        "role": "data",    "x": 320,  "y": 360, "w": 200, "h": 80 },
      { "id": "store",   "type": "subprocess", "label": "S3 bucket",
        "role": "data",    "x": 900,  "y": 360, "w": 180, "h": 80 }
    ],
    "edges": [
      { "from": "browser", "to": "api",
        "style": "solid",  "label": "POST /upload",  "route": "bezier" },
      { "from": "api",     "to": "db",
        "style": "solid",  "label": "INSERT",         "route": "bezier" },
      { "from": "api",     "to": "queue",
        "style": "dashed", "label": "fire event",     "route": "bezier" },
      { "from": "queue",   "to": "worker",
        "style": "dashed", "label": "consume",        "route": "bezier" },
      { "from": "worker",  "to": "store",
        "style": "solid",  "label": "PUT object",     "route": "bezier" },
      { "from": "worker",  "to": "db",
        "style": "solid",  "label": "UPDATE status",  "route": "bezier" }
    ]
  }
  </script>
</div>
```

The reader sees:

- Synchronous calls (Browser->API, API->DB, Worker->S3) drawn
  solid. These block until they return.
- Async events (API->Queue->Worker) drawn dashed. The API doesn't
  wait for the worker to finish.
- Every edge has a one-word or one-phrase label so the reader
  knows what data is moving.

## Why this pattern works

A data-flow diagram answers TWO questions at once:

1. **What components are involved?** (boxes)
2. **How does data move between them?** (lines, styles, labels)

Without the sync/async distinction, every edge looks the same and
the reader cannot answer "what happens if the worker is slow?" —
they have to read source code. With the distinction, the question
answers itself: dashed paths can buffer; solid paths cannot.

## Composition with other techniques

A data-flow diagram is often part of an implementation plan or
architecture doc:

- Pair with `architecture-canvas-preset.md` groups to show
  layers AND data flow simultaneously.
- Pair with `click-step-detail-panel.md` to make every node click
  open a panel with the actual code that runs.
- Pair with `node-type-library.md` semantics: `external` for the
  user's browser, `subprocess` for storage components.

## Tinting the "hot path"

When the diagram is illustrating a specific scenario (e.g. "the
new upload flow"), tint the edges OF THAT FLOW with the accent
color, and leave other edges in the default gray:

```json
{ "from": "api", "to": "queue", "style": "dashed",
  "label": "fire event",
  "stroke": "var(--vc-color-accent)" }
```

`stroke` is supported as an optional override on edges (any valid
CSS color). The default is `--vc-color-border-strong`. Don't tint
more than ~3 edges in any single diagram — past that, the accent
loses its "look here" function.

## Convention: edge labels go above (horizontal) / left (vertical)

The engine places the edge label at the midpoint of the path, ON
the path (offset slightly to one side). For a clean look,
authoring guidance:

- **Horizontal edges**: label above the line (the engine handles
  this automatically).
- **Vertical edges**: label to the left of the line.
- **Diagonal edges**: rotate the label with the path tangent (the
  engine does this).

Avoid long labels (>20 chars) — they collide with neighboring
nodes. If you need a long label, use a `detail` field on the
target node and a short edge label.

## Convention: every async edge is labelled

Solid lines are obvious (a function call). Dashed lines (async)
need labels to tell the reader WHAT is being sent — an event
name, a queue name, a topic name:

- `fire UserCreated`
- `enqueue email-job`
- `webhook POST /payment`

A dashed line without a label leaves the reader guessing.

## Decision points

A data-flow diagram MAY include a `decision` node when the flow
branches based on data:

```json
{ "id": "valid", "type": "decision", "label": "Valid?",
  "x": 540, "y": 200, "w": 90, "h": 90 }
```

Two outgoing edges: `valid -> proceed` (yes) and `valid -> reject`
(no, dashed, going to an error-handling external).

Limit to one decision node per diagram; more and the diagram is
hiding a state machine — use `state-machine-diagram.md` instead.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-border-strong` (default), `--vc-color-accent` (hot path), `--vc-color-danger` (failure path) |
| typography | `--vc-font-mono` for edge labels (matches the catalog convention; the engine defaults to `--vc-font-body` — override per-scene if needed) |

## Selection atoms

Standard `diagram-node` and `diagram-edge`. The `style` field is
included in the edge's `data-ve-data` so the agent receiving a
click knows whether the user clicked on a sync or async edge:

```json
{ "sceneId": 14, "kind": "edge",
  "edgeFrom": "api", "edgeTo": "queue",
  "edgeStyle": "dashed", "edgeRoute": "bezier",
  "label": "fire event" }
```

An agent can then surface different action menus based on the
edge kind (e.g. "view event schema" only for async edges).

## Anti-patterns

- All solid lines: undercommunicates; the reader doesn't know
  what's sync vs async.
- All dashed lines: same problem.
- 3+ different stroke styles (solid + dashed + dotted + accent):
  noisy; pick TWO and stick with them.
- Cyclic data flow with no labels: looks like spaghetti; either
  add labels or split into multiple diagrams.
- A `decision` node every other step: the diagram is hiding a
  state machine.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Dashed strokes are visibly dashed at both themes (some
  browsers used to under-render dashes on thin strokes).
- Solid and dashed are clearly distinguishable at thumbnail
  size — if you can't tell at small zoom, bump the dasharray.
- Accent-tinted edges actually appear accent-colored (a common
  bug: the `stroke` override doesn't pass through theme swap).
