# Process-flow preset

The `process-flow` preset of `amvcp-diagram.js` renders a **horizontal
step lane** — the canonical way to draw a pipeline that has a clear
start, an ordered chain of named steps, optional decisions, and an
end. The agent writes the scene graph in JSON; the engine assigns
coordinates, numbers the steps, themes the shapes off `--vc-*`
tokens, and makes every node and edge a click-to-select atom.

## When to choose this preset

Use `process-flow` when:

- The diagram tells a **linear story** that reads left-to-right (or a
  two-row wrap when there are too many steps for one row).
- Step ordering matters and the reader should be able to **count the
  steps** at a glance ("step 3 of 5").
- The vocabulary is `start` -> `process` -> `decision` -> `subprocess`
  -> `end` plus an occasional `external` actor.

Do NOT use `process-flow` when:

- You need named parallel **swim lanes** (use `swimlane-diagram.md`).
- The "process" has more than ~10 steps in a single row (the row
  becomes a tape; switch to `numbered-flow-scroll-reveal.md` for
  vertical pacing, or to `architecture-canvas-preset.md` if the
  shape is structural rather than sequential).
- You need a **back-edge** that bows back to the start without
  re-using a `loop` route — `phase-graph-preset.md` handles
  dependency cycles more cleanly.

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="process-flow"
     data-ve-scene-reveal="scroll">
  <script type="application/json">
  {
    "version": 1,
    "preset": "process-flow",
    "width": 1040,
    "height": 240,
    "nodes": [
      { "id": "src",    "type": "start",      "label": "Source" },
      { "id": "ingest", "type": "process",    "label": "Ingest",   "role": "service" },
      { "id": "check",  "type": "decision",   "label": "Valid?" },
      { "id": "store",  "type": "subprocess", "label": "Persist",  "role": "data" },
      { "id": "audit",  "type": "external",   "label": "Auditor",  "role": "external" },
      { "id": "done",   "type": "end",        "label": "Complete" }
    ],
    "edges": [
      { "from": "src",    "to": "ingest" },
      { "from": "ingest", "to": "check" },
      { "from": "check",  "to": "store",  "label": "yes" },
      { "from": "store",  "to": "done" },
      { "from": "store",  "to": "audit",  "style": "dashed", "label": "log" },
      { "from": "check",  "to": "ingest", "label": "no",
        "style": "dashed", "route": "loop" }
    ]
  }
  </script>
</div>
```

The wrapper `<div>` is the only DOM the author writes. The runtime
replaces the embedded `<script type="application/json">` body's
container with the rendered `<svg>` and keeps the JSON pristine in
`__vcSceneJSON` for re-render on theme swap.

## Auto-placement rules

`process-flow` always lays a single horizontal row first. When
`nodes.length > 8` the engine wraps to two rows; when
`nodes.length >= 9` it falls back to a circle (rare for processes —
if you hit this, the diagram has outgrown the preset). Stride and
margin are engine constants:

| Constant | Default | Meaning |
|---|---|---|
| `FLOW_MARGIN` | 40 | viewBox left/right margin |
| `FLOW_GAP` | 60 | horizontal gap between consecutive nodes |
| `FLOW_ROW_GAP` | 60 | vertical gap between rows on wrap |

You CAN override per-node by supplying explicit `x`/`y` — the engine
keeps your coordinates and auto-places only the nodes without them.

## Step badges

Every `process` and `subprocess` node gets a small **numbered step
badge** drawn above the node — a `<circle>` with the step ordinal
in `--vc-color-accent` on `--vc-color-on-accent`. `start`/`end`/
`decision`/`external` nodes do NOT get a badge — they are not
"steps" in the lane. The badge re-themes for free because both the
fill and text are `var(--vc-color-*)` references.

## Decision branching

A `decision` node has FOUR connection points (top, right, bottom,
left); the engine picks the closest two when routing the `yes` and
`no` edges. Best practice:

- The `yes` (happy-path) edge continues right toward the next step;
  leave its `label` as `"yes"`.
- The `no` edge bows back via `route: "loop"`; label it `"no"`.
- Avoid more than two outgoing edges from a `decision` — that's a
  switch statement, not a decision. Convert to `phase-graph-preset.md`
  with multiple downstream `card` nodes.

## Role tinting

`role` on a `process`/`subprocess`/`external` node tints its fill:

| `role` | Meaning |
|---|---|
| `service` | the step is owned by an application service |
| `data` | the step writes/reads persistent storage |
| `client` | the step lives on the user's machine |
| `infra` | the step is owned by infrastructure (queue, scheduler) |
| `external` | the step is owned by a third party |
| `accent` | use sparingly — highlights the critical step |

Leaving `role` off paints the node in the neutral surface color
(`--vc-color-surface`). A diagram where every node carries a `role`
becomes a rainbow; aim for **2-3 roles per diagram** at most.

## DESIGN.md tokens consumed

| Token group | Specifics |
|---|---|
| color | node fills + strokes, edge stroke, step-badge fill/text |
| typography | `--vc-font-body` for labels, `--vc-text-1` for size |
| radius | `--vc-radius-md` for `process`/`subprocess` corners |
| motion | `--vc-duration-slow` for animated edges |

The preset is **fully defensive** — every token is read via
`var(--vc-…, fallback)`, so a missing DESIGN.md gives a
working-but-unstyled diagram, not a blank SVG.

## Selection, comment, decision-mini

Each rendered node is wrapped in
`<g data-ve-id="vc-scene-N-node-K" data-ve-type="diagram-node">`;
each edge becomes `<g data-ve-id="vc-scene-N-edge-K"
data-ve-type="diagram-edge">`. `data-ve-data` carries the JSON
context the agent needs:

```json
{ "sceneId": 4, "kind": "node",
  "nodeId": "check", "nodeType": "decision", "label": "Valid?" }
```

The runtime's selection CSS lights up the SVG shape on hover
(`g[data-ve-id]:hover > rect|polygon|path` — the visible shape is a
DIRECT child of the `<g>`). A click POSTs the payload to the agent
endpoint, where the comment-thread modal opens anchored to the
node. The `phase-graph` preset adds chain-highlight on top of this;
`process-flow` does not — clicks are single-node only.

## Animation patterns that compose with process-flow

- `data-ve-scene-reveal="scroll"` on the wrapper draws each edge on
  as its destination node enters the viewport.
- `animate: "flow"` on the `src -> ingest` edge marches the dashes
  to signal "data is moving".
- `animate: "pulse"` on the `store -> audit` edge breathes the glow,
  used sparingly to mark a side-channel.

Combine reveal + flow on the same diagram — reveal handles entry;
flow runs forever (subject to `prefers-reduced-motion`).

## Anti-patterns

- 12 nodes in one row: ungainly. Split into two diagrams or move to
  `numbered-flow-scroll-reveal.md` (vertical, paced).
- Mixing `decision` and `card` in the same scene: the engine paints
  them at different sizes; the lane wobbles. Use one preset per
  diagram.
- Every node `role: "accent"`: defeats the highlight. Use accent on
  one node, neutral or thematically appropriate roles on the rest.
- Hand-authored coordinates throughout: the preset auto-places for
  you; explicit `x`/`y` should be the exception (a special case
  you need to lock in place), not the rule.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: open the rendered
HTML in dev-browser at light theme, screenshot, then again at dark
theme. Confirm both render — node strokes visible at both, no
washed-out text, badge contrast meets WCAG AA. A diagram that
works light + dark is a correct diagram.
