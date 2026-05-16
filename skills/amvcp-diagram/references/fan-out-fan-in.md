# Fan-out / fan-in diagram

A specific topology — a single source node, several parallel
branches, and a single sink node. Used to visualize sharding,
parallel processing, parallel HTTP calls, map-reduce, or any
"split then merge" computation. Lifted from `10-svg-illustrations`
in the html-effectiveness catalog.

## When to choose this pattern

Use fan-out / fan-in when:

- You are illustrating **parallel work**: a single producer
  splits a job into N independent tasks, the tasks complete
  independently, and a final step merges the results.
- The reader needs to **count the parallel branches** (3-shard
  database, 5-worker job, 8-region replication).
- The visual symmetry of "split + merge" carries the meaning —
  the diagram is partly the structure.

Do NOT use this pattern when:

- The branches aren't parallel (they have ordering / dependencies
  among themselves — use `phase-graph-preset.md`).
- The branches aren't symmetric (each branch is a different kind
  of work — use `architecture-canvas-preset.md` with explicit
  groups).
- There's no merge at the end (you have a fan-out without fan-in;
  use a simpler one-to-many diagram).

## Scaffold

A fan-out / fan-in is a `free`-preset diagram with explicit
coordinates that produce the symmetric layout:

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1000,
    "height": 360,
    "background": "plain",
    "nodes": [
      { "id": "source", "type": "process", "label": "Source job",
        "role": "service",
        "x": 60, "y": 140, "w": 160, "h": 80 },

      { "id": "shard1", "type": "subprocess", "label": "Shard 1",
        "role": "data",
        "x": 400, "y": 20,  "w": 160, "h": 60 },
      { "id": "shard2", "type": "subprocess", "label": "Shard 2",
        "role": "data",
        "x": 400, "y": 100, "w": 160, "h": 60 },
      { "id": "shard3", "type": "subprocess", "label": "Shard 3",
        "role": "data",
        "x": 400, "y": 180, "w": 160, "h": 60 },
      { "id": "shard4", "type": "subprocess", "label": "Shard 4",
        "role": "data",
        "x": 400, "y": 260, "w": 160, "h": 60 },

      { "id": "merge", "type": "process", "label": "Merge",
        "role": "service",
        "x": 760, "y": 140, "w": 160, "h": 80 }
    ],
    "edges": [
      { "from": "source", "to": "shard1", "route": "bezier", "animate": "flow" },
      { "from": "source", "to": "shard2", "route": "bezier", "animate": "flow" },
      { "from": "source", "to": "shard3", "route": "bezier", "animate": "flow" },
      { "from": "source", "to": "shard4", "route": "bezier", "animate": "flow" },
      { "from": "shard1", "to": "merge",  "route": "bezier" },
      { "from": "shard2", "to": "merge",  "route": "bezier" },
      { "from": "shard3", "to": "merge",  "route": "bezier" },
      { "from": "shard4", "to": "merge",  "route": "bezier" }
    ]
  }
  </script>
</div>
```

The layout is hand-coded with `free` because the fan-out
geometry is intrinsic to the meaning — the shards stack
vertically at one x-coordinate, the source and merge are
horizontally centered. Auto-layout would not enforce this
symmetry.

## Fan-out vs fan-in arrow style

A common visual convention:

- **Fan-out edges** (source -> shards): animated with `animate:
  "flow"` to convey "the source is dispatching".
- **Fan-in edges** (shards -> merge): solid, no animation, to
  convey "the merge waits for all shards".

The reader's eye picks up the asymmetry: motion entering the
shards, stillness leaving them. The merge node feels like a
collection point.

## Labels above the fan-out and fan-in arcs

The catalog version adds two ARC labels above and below the
parallel structure to name the operations:

```
              fan-out
             ↙ ↙ ↙ ↙
   [source]              [merge]
             ↘ ↘ ↘ ↘
              fan-in
```

To draw these arc labels, add two SVG `<path>` elements with text
along them, OR (simpler) add two plain text labels positioned
above and below the bundle:

```json
{ "id": "_fanout-label", "type": "process", "label": "fan-out",
  "x": 460, "y": -10, "w": 80, "h": 24,
  "role": "accent" }
```

Use a "ghost node" for the label only — the engine will draw it
as a normal node, but you can style it to look like a label by
making it small and tint-only. Alternative (cleaner): inject the
labels via a `<text>` element in the post-render hook.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted fills, edge strokes |
| typography | `--vc-font-body`, `--vc-text-1` for shard labels |
| motion | `--vc-duration-slow` for fan-out flow animation |

## Selection atoms

Each shard is a standard `diagram-node`. The source and merge are
distinguishable by their `role: "service"`; the shards by their
`role: "data"`.

`data-ve-data` on a shard:

```json
{ "sceneId": 18, "kind": "node",
  "nodeId": "shard2", "nodeType": "subprocess",
  "label": "Shard 2",
  "role": "data" }
```

An agent can act on the fan-out as a unit by selecting all
shards (the dock UI's group-select mode).

## Variations

### Asymmetric fan-out

If the shards are not symmetric (e.g. one shard is faster than
the others, or one shard is "primary"), tint the differing
shard with `role: "accent"`:

```json
{ "id": "shard2", "type": "subprocess", "label": "Shard 2 (primary)",
  "role": "accent",
  "x": 400, "y": 100, "w": 160, "h": 60 }
```

The accent tint pulls the eye to the primary shard.

### N-way scatter to N-way merge

A more general pattern: M sources, N shards, K merges. The
engine handles it as `free` with explicit coordinates. The
layout discipline:

- Sources stack vertically on the left.
- Shards stack vertically in the middle.
- Merges stack vertically on the right.
- Edges fan out and fan back in twice.

Keep the layout symmetric; an asymmetric scatter is just a
graph (use `amvcp-graph-diagrams`).

### Time-based fan-out (the queue pattern)

A fan-out where the shards represent SEQUENTIAL jobs landing in
a queue (not simultaneous workers):

```json
{ "id": "job1", "type": "process", "label": "Job 1",
  "role": "infra", "x": 400, "y": 80,  "w": 160, "h": 50 },
{ "id": "job2", "type": "process", "label": "Job 2",
  "role": "infra", "x": 400, "y": 140, "w": 160, "h": 50 },
{ "id": "job3", "type": "process", "label": "Job 3 (next)",
  "role": "accent", "x": 400, "y": 200, "w": 160, "h": 50 }
```

The "next" job (head of the queue) is tinted accent. See
`queue-diagram-fifo.md` for the full queue pattern.

## Anti-patterns

- Shards drawn with different shapes (one circle, one rect, one
  diamond): breaks the symmetry; the reader thinks they are
  different things.
- Edges with text labels each (`shard 1 -> merge: result 1`):
  noise; the position already encodes the pairing.
- 12+ shards: the parallel branches stack into a tall narrow
  strip; switch to a heatmap or a count-only visualization
  (`5 shards processed` text).
- Different routing per fan-out edge (some straight, some
  bezier): noise; pick one route style and use it for all
  fan-out edges, another for all fan-in edges.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The vertical alignment of the shards is exact (off-by-one in
  the coordinate JSON is visible immediately).
- The bezier curves don't cross each other — fan-out from a
  single source to vertically-stacked targets should produce a
  symmetric "spray".
- The fan-out animation (if used) doesn't trigger
  `prefers-reduced-motion` failures.
