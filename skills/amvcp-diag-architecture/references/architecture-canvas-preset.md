# Architecture-canvas preset

## Table of Contents

- [When to choose this preset](#when-to-choose-this-preset)
- [Scaffold](#scaffold)
- [Group geometry](#group-geometry)
- [The grid background](#the-grid-background)
- [Bezier edges across layers](#bezier-edges-across-layers)
- [Async / sync visual distinction](#async--sync-visual-distinction)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Anti-patterns](#anti-patterns)
- [Variation: vertical orientation](#variation-vertical-orientation)
- [Theme pairings](#theme-pairings)
- [Visual verification](#visual-verification)

The `architecture-canvas` preset draws a **layered system diagram** —
a stack of horizontal layers (client / service / data / infra,
typically), each layer a `group` rectangle, with services inside
each group connected by bezier edges that cross layers. The blueprint
grid background is optional; turn it on for an engineering-drawing
feel.

## When to choose this preset

Use `architecture-canvas` when:

- You are showing **how a system is composed of layers**, not a
  step-by-step process. The reader cares about which layer something
  lives in.
- You need named **groups** (a `client` layer, a `service` layer,
  a `data` layer) drawn as backdrops behind their member nodes.
- The diagram reads top-to-bottom as a stack OR left-to-right as
  parallel concerns — both are common and both work.

Do NOT use `architecture-canvas` when:

- The thing being drawn is a **process** (use
  `process-flow-preset.md`).
- The structure is a graph WITHOUT clean layer membership (a node
  belongs to multiple layers; or there are no layers at all). Drop
  the groups and use the `free` preset, or hand off to
  `amvcp-graph-diagrams` for an auto-layout graph.

## Scaffold

```html
<div class="ve-scene-graph"
     data-ve-scene-preset="architecture-canvas"
     data-ve-scene-theme="blueprint">
  <script type="application/json">
  {
    "version": 1,
    "preset": "architecture-canvas",
    "background": "grid",
    "width": 1200,
    "height": 720,
    "groups": [
      { "id": "client-layer",  "label": "Client",
        "x": 20,  "y": 20,  "w": 1160, "h": 140, "role": "client" },
      { "id": "service-layer", "label": "Service",
        "x": 20,  "y": 200, "w": 1160, "h": 200, "role": "service" },
      { "id": "data-layer",    "label": "Data",
        "x": 20,  "y": 440, "w": 1160, "h": 160, "role": "data" },
      { "id": "infra-layer",   "label": "Infra",
        "x": 20,  "y": 620, "w": 1160, "h":  80, "role": "infra" }
    ],
    "nodes": [
      { "id": "browser", "type": "process", "label": "Browser App",
        "group": "client-layer",  "role": "client",
        "x": 60,   "y": 60,  "w": 200, "h": 80 },
      { "id": "mobile",  "type": "process", "label": "Mobile App",
        "group": "client-layer",  "role": "client",
        "x": 300,  "y": 60,  "w": 200, "h": 80 },
      { "id": "api",     "type": "process", "label": "REST API",
        "group": "service-layer", "role": "service",
        "x": 60,   "y": 250, "w": 220, "h": 100 },
      { "id": "auth",    "type": "process", "label": "Auth Service",
        "group": "service-layer", "role": "service",
        "x": 320,  "y": 250, "w": 220, "h": 100 },
      { "id": "worker",  "type": "subprocess", "label": "Background Worker",
        "group": "service-layer", "role": "service",
        "x": 580,  "y": 250, "w": 220, "h": 100 },
      { "id": "pg",      "type": "subprocess", "label": "Postgres",
        "group": "data-layer", "role": "data",
        "x": 60,   "y": 480, "w": 220, "h": 100 },
      { "id": "cache",   "type": "subprocess", "label": "Redis",
        "group": "data-layer", "role": "data",
        "x": 320,  "y": 480, "w": 220, "h": 100 },
      { "id": "queue",   "type": "process", "label": "RabbitMQ",
        "group": "infra-layer", "role": "infra",
        "x": 60,   "y": 640, "w": 220, "h": 50 }
    ],
    "edges": [
      { "from": "browser", "to": "api",    "route": "bezier" },
      { "from": "mobile",  "to": "api",    "route": "bezier" },
      { "from": "api",     "to": "auth",   "route": "bezier" },
      { "from": "api",     "to": "pg",     "route": "bezier" },
      { "from": "auth",    "to": "pg",     "route": "bezier" },
      { "from": "api",     "to": "cache",  "route": "bezier" },
      { "from": "api",     "to": "queue",  "route": "bezier", "style": "dashed", "label": "async" },
      { "from": "queue",   "to": "worker", "route": "bezier", "style": "dashed" },
      { "from": "worker",  "to": "pg",     "route": "bezier" }
    ]
  }
  </script>
</div>
```

The `groups` are drawn **first** (behind the nodes) as semi-
transparent role-tinted rectangles with a label at the top-left.
The nodes sit on top.

## Group geometry

Groups carry `x`, `y`, `w`, `h` — explicit coordinates, not auto-
layout. Why explicit? Because layer geometry is a deliberate design
choice (some layers are thicker, some thinner, some left-shifted),
and an auto-layout algorithm would erase that intent.

A group is *purely visual* — it does not contain nodes structurally;
nodes claim membership via `node.group = "client-layer"`. The
engine uses that for:

- Selection scoping (clicking a node knows its layer).
- Future: auto-resizing a group to its members. Not yet implemented;
  for now you size the group manually.

## The grid background

`background: "grid"` paints a faint blueprint grid behind the whole
canvas — a 20-unit minor grid + 100-unit major grid. The grid color
is `--vc-color-border` at low alpha so it does not dominate. Use
the grid when the diagram is **engineering-themed** (blueprint
preset is the canonical pairing); turn it off (`"plain"` or
`"none"`) for a marketing-style architecture overview where the
grid would feel cluttered.

## Bezier edges across layers

Cross-layer edges always use `route: "bezier"`. The cubic curve's
control points are offset along the dominant axis (vertical here),
so the curve gently leaves one node and gently enters the next
without a hard-elbow ortho jog. Ortho routing in a layered diagram
looks like a circuit board; bezier looks like a flow.

Same-layer edges between adjacent nodes can use `route: "straight"`
or `"ortho"` — bezier between two nodes ~20px apart looks wobbly.

## Async / sync visual distinction

Convention adopted from the data-flow-diagram pattern:

- **Solid stroke** = synchronous call (request/response in the same
  call chain).
- **Dashed stroke** = asynchronous / fire-and-forget (the producer
  hands work off and continues without waiting).

The engine's `style: "dashed"` produces a clean 8-12 dasharray that
re-themes for free. Combine with a one-word `label` (`"async"`,
`"event"`, `"webhook"`) at the midpoint so a reader scanning the
diagram knows the semantic without studying the legend.

## DESIGN.md tokens consumed

| Token group | Specifics |
|---|---|
| color | group fills (role-tinted), node fills, edge stroke, grid lines |
| typography | `--vc-font-body` for labels; `--vc-text-2` for group labels |
| radius | `--vc-radius-md` for nodes; group corners share that radius |

## Selection atoms

- Each `group` becomes `<g data-ve-id data-ve-type="diagram-group">`
  with the same hover/select treatment as a node. Clicking the
  group label selects the layer as a whole.
- Each `node` is `<g data-ve-id data-ve-type="diagram-node">` with
  `data-ve-data` carrying `{sceneId, nodeId, nodeType, label,
  groupId}` — the agent knows which layer the click belongs to.
- Each `edge` is `<g data-ve-id data-ve-type="diagram-edge">` with
  `{sceneId, edgeFrom, edgeTo, edgeStyle}`.

## Anti-patterns

- A layer with zero members: empty rectangle. Either populate it or
  drop it.
- A node that crosses two layers: ambiguous. Pick one and use an
  edge with a `label` to explain the relationship if it spans
  layers.
- More than four layers: the diagram becomes cramped. Either fold
  related layers (`data` + `cache` -> `data`) or split into two
  diagrams that show different views of the system.
- Bezier edges that loop back through the same layer they came from:
  use `route: "loop"` instead — the bezier wobbles.

## Variation: vertical orientation

The default examples lay layers horizontally (top-down stack). The
preset is **orientation-agnostic** — supply vertical group columns
instead:

```json
{ "id": "frontend", "x": 20,   "y": 20, "w": 280, "h": 660 },
{ "id": "backend",  "x": 320,  "y": 20, "w": 280, "h": 660 },
{ "id": "data",     "x": 620,  "y": 20, "w": 280, "h": 660 }
```

Now reads left-to-right as parallel concerns; edges cross
horizontally with `route: "bezier"`.

## Theme pairings

- `blueprint` preset + `background: "grid"` = engineering drawing.
- `default` (DESIGN.md) + `background: "plain"` = brand-themed
  product architecture.
- `high-contrast` preset + `background: "none"` = accessibility-
  first rendering, AAA contrast for review/audit contexts.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot in light and dark, confirm group tints are visible (not
washed out) at both themes, confirm bezier curves render without
gaps, confirm dashed-stroke pattern is preserved (some browsers
have rendered it wrong in the past for thin strokes).
