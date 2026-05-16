# Swimlane diagram

A diagram split into parallel "lanes", each lane owned by a
distinct actor or system. Nodes drop into a lane to indicate who
performs the step. The classic shape for cross-functional
processes (request flows that pass through user / API / worker /
database lanes).

## When to choose this pattern

Use a swimlane when:

- A process **crosses ownership boundaries** — different actors
  perform different steps and the reader needs to see WHO does
  WHAT at a glance.
- The "who" matters as much as the "what" — a process diagram
  that ignores ownership hides important information.
- You have **2-5 lanes**. Past 5, the lanes become noise.

Do NOT use swimlanes when:

- The process is owned by a single actor (use `process-flow-
  preset.md`).
- The lanes would have wildly uneven node counts (one lane with
  8 nodes, another with 1) — the visual symmetry breaks.
- The "swimlane" is really a layered architecture (use
  `architecture-canvas-preset.md`).

## Scaffold (horizontal lanes, vertical flow)

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 560,
    "background": "plain",
    "groups": [
      { "id": "user-lane", "label": "User",
        "x": 0, "y": 0,   "w": 1200, "h": 140, "role": "client" },
      { "id": "api-lane",  "label": "API",
        "x": 0, "y": 140, "w": 1200, "h": 140, "role": "service" },
      { "id": "wkr-lane",  "label": "Worker",
        "x": 0, "y": 280, "w": 1200, "h": 140, "role": "infra" },
      { "id": "db-lane",   "label": "Database",
        "x": 0, "y": 420, "w": 1200, "h": 140, "role": "data" }
    ],
    "nodes": [
      { "id": "click",   "type": "start",   "label": "User clicks Upload",
        "group": "user-lane",
        "x": 40,   "y": 50,  "w": 200, "h": 40 },
      { "id": "post",    "type": "process", "label": "POST /upload",
        "group": "api-lane",
        "x": 260,  "y": 180, "w": 180, "h": 60, "role": "service" },
      { "id": "val",     "type": "decision","label": "Valid?",
        "group": "api-lane",
        "x": 460,  "y": 180, "w": 90,  "h": 60 },
      { "id": "enqueue", "type": "process", "label": "Enqueue job",
        "group": "api-lane",
        "x": 560,  "y": 180, "w": 160, "h": 60, "role": "service" },
      { "id": "ack",     "type": "end",     "label": "202 Accepted",
        "group": "user-lane",
        "x": 720,  "y": 50,  "w": 180, "h": 40 },
      { "id": "dequeue", "type": "process", "label": "Dequeue + process",
        "group": "wkr-lane",
        "x": 560,  "y": 320, "w": 200, "h": 60, "role": "infra" },
      { "id": "store",   "type": "process", "label": "INSERT row",
        "group": "db-lane",
        "x": 560,  "y": 460, "w": 160, "h": 60, "role": "data" },
      { "id": "notify",  "type": "process", "label": "Webhook callback",
        "group": "wkr-lane",
        "x": 800,  "y": 320, "w": 200, "h": 60, "role": "infra" }
    ],
    "edges": [
      { "from": "click",   "to": "post",    "route": "ortho" },
      { "from": "post",    "to": "val",     "route": "ortho" },
      { "from": "val",     "to": "enqueue", "label": "yes" },
      { "from": "enqueue", "to": "ack",     "route": "ortho",
        "style": "solid",  "label": "respond" },
      { "from": "enqueue", "to": "dequeue", "route": "ortho",
        "style": "dashed", "label": "async" },
      { "from": "dequeue", "to": "store",   "route": "ortho" },
      { "from": "dequeue", "to": "notify",  "route": "ortho" }
    ]
  }
  </script>
</div>
```

The lanes are the `groups` — full-width horizontal strips, each
tinted by the actor's role. Nodes are positioned with `group:
"<lane-id>"` declaring membership AND `y` coordinates inside the
lane's vertical band.

Edges cross lanes naturally — the eye follows the line as the
flow handoff happens between actors.

## Lane geometry conventions

For 4 horizontal lanes in a 560-tall canvas:

- Lane height = 140 (canvas height / lane count).
- Lane title (the group `label`) is drawn at the top-left of the
  lane.
- Nodes sit centered vertically inside the lane (here, `y = 50`
  inside a 140-tall lane that starts at `y = 0`, putting the
  node from y=50 to y=90, centered visually).

For 3 lanes: lane height = 187 (close enough to 180 for clean
visual).

For 5 lanes: lane height = 112 (getting tight; consider 4).

## Vertical lanes (horizontal flow)

A common variant — vertical lanes, the flow reads left-to-right
within and between lanes:

```json
"groups": [
  { "id": "user-lane", "label": "User",
    "x": 0,    "y": 0, "w": 240, "h": 600, "role": "client" },
  { "id": "api-lane",  "label": "API",
    "x": 240,  "y": 0, "w": 240, "h": 600, "role": "service" },
  { "id": "wkr-lane",  "label": "Worker",
    "x": 480,  "y": 0, "w": 240, "h": 600, "role": "infra" },
  { "id": "db-lane",   "label": "Database",
    "x": 720,  "y": 0, "w": 240, "h": 600, "role": "data" }
]
```

Nodes inside each lane stack vertically; edges run mostly
horizontal (with vertical hops within a lane). This is the right
choice when the process has more handoffs between actors than
sequential work within an actor.

## Cross-lane edge styling

Cross-lane edges (an edge whose source and target are in
different lanes) are visually significant — they represent a
handoff. Tint them with `style: "solid"` and a label:

```json
{ "from": "post",    "to": "val",   "route": "ortho" },          // intra-lane
{ "from": "enqueue", "to": "dequeue",
  "route": "ortho", "style": "dashed", "label": "async" },        // cross-lane handoff
```

Same-lane edges can be unlabeled (the actor stays the same, the
process moves forward); cross-lane edges should be labeled (the
actor changes, the reader needs to know what triggered it).

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted lane fills (per group), node fills, edge strokes |
| typography | `--vc-text-2` lane labels, `--vc-text-1` node labels |
| radius | `--vc-radius-md` for nodes, group corners share radius |

## Selection atoms

Each lane is a `diagram-group` atom (clickable to select the
actor as a whole). Each node has the standard payload PLUS its
group:

```json
{ "sceneId": 24, "kind": "node",
  "nodeId": "post", "nodeType": "process",
  "label": "POST /upload",
  "role": "service",
  "groupId": "api-lane" }
```

An agent can filter by lane — "show me everything the worker
does" — by reading `groupId` from clicked payloads.

## Anti-patterns

- A lane with zero nodes: empty band. Either populate or remove
  the lane.
- A node positioned outside its declared lane: visually
  confusing (the eye sees the node in lane X but the data says
  lane Y). Keep coordinates consistent with declared group.
- 6+ lanes: each lane becomes a thin strip; node labels are
  cramped. Fold related lanes or split into multiple diagrams.
- Edges that cross 3+ lanes in one bezier: bend the eye too
  hard; route through an intermediate "API" node so the handoff
  has visible layers.

## Variation: with timeline header

Add an explicit time-axis above the lanes:

```
            t=0     t=1     t=2    t=3      t=4
          ┌────────┬───────┬──────┬────────┬─────────────┐
 User     │ click  │       │      │  202   │             │
          ├────────┼───────┼──────┼────────┼─────────────┤
 API      │        │ POST  │ Val  │ Enqueue│             │
          ├────────┼───────┼──────┼────────┼─────────────┤
 Worker   │        │       │      │        │ Dequeue+... │
          ├────────┼───────┼──────┼────────┼─────────────┤
 Database │        │       │      │        │     INSERT  │
          └────────┴───────┴──────┴────────┴─────────────┘
```

The time-axis turns the swimlane into a sequence-diagram
hybrid — each column = a time step, each row = an actor. Useful
for distributed-systems flows where ordering and parallelism
both matter.

To draw this in the engine: use `free` preset, add a top-row of
"header" nodes (one per time step), tint them subtly to read as
labels not data.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Lane tints are visible (one-color blocks) but don't drown out
  the node fills.
- Lane labels are at the top-left of each lane (a common bug:
  the engine's default label position can fall outside the
  visible area for narrow lanes).
- Cross-lane edges are clearly identifiable (they visibly cross
  a lane border).
