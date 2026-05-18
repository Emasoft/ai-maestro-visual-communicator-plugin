# Node-type library

## Table of Contents

- [The seven node types](#the-seven-node-types)
- [`start` and `end`](#start-and-end)
- [`process`](#process)
- [`decision`](#decision)
- [`subprocess`](#subprocess)
- [`external`](#external)
- [`card`](#card)
- [Authoring shape correctness](#authoring-shape-correctness)
- [Size customization](#size-customization)
- [Role tinting per type](#role-tinting-per-type)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

Reference for the seven shapes the diagram engine ships. Each shape
is a deliberate choice — picking the right `type` for a node is the
single highest-leverage authoring decision because shape carries
semantic meaning the reader decodes without reading the label.

## The seven node types

| `type` | Shape | Default w x h | Semantic |
|---|---|---|---|
| `start` | rounded pill | 110 x 40 | the entry point |
| `process` | rounded rect | 160 x 80 | a regular step |
| `decision` | diamond | 90 x 90 | a yes/no branch |
| `subprocess` | double-border rect | 160 x 80 | a step that is itself a process |
| `end` | rounded pill | 110 x 40 | the exit point |
| `external` | dashed-stroke rect | 160 x 80 | an actor outside the system |
| `card` | rect (phase-graph) | 200 x 120 | a phase with title + detail |

## `start` and `end`

Rounded pills. Stroke is semantic: `start` = `--vc-color-info`,
`end` = `--vc-color-success`. The pair conventionally bookends a
process — the engine does NOT enforce "exactly one start, exactly
one end" because some diagrams legitimately have multiple entry
points (a webhook handler triggered by 4 different events) or
multiple exits (success / failure / retry).

**Authoring rule:** never use `start`/`end` for anything that is
NOT actually a start or end. A "decision-after-deciding" intermediate
node is a `process`, not a second `start`. Misuse trains the reader
to ignore the shape.

```json
{ "id": "in",   "type": "start", "label": "HTTP request arrives" }
{ "id": "ok",   "type": "end",   "label": "200 OK returned" }
{ "id": "fail", "type": "end",   "label": "5xx returned" }
```

## `process`

Rounded rectangle, the workhorse. Use `process` for any active step:
"validate input", "compute hash", "fetch from DB", "send email". A
process has an action verb in its label. If the label reads as a
noun ("input data"), it's probably a `subprocess` (a thing happens
to it) or an `external` (the data is a thing produced elsewhere).

Default 160 x 80 fits one line of label and one optional `detail`
line. For longer labels, increase `w`.

## `decision`

Diamond. Stroke is `--vc-color-warning` (yellow/amber). A decision
has TWO outgoing edges — one labelled `yes`, one labelled `no`. The
diamond shape is universally recognized as a branch; misusing it as
"a fancy node" confuses the reader.

Some diagrams have a 3-way or 4-way decision (a switch statement).
For 3 outcomes, two diamonds in series is clearer:

```
[decision A?] --no--> [decision B?]
       |yes                  |yes
       v                     v
     [path 1]             [path 2]
                            no|
                              v
                          [path 3]
```

For 4+ outcomes, drop the diamond and use a `process` with
multiple labelled outgoing edges — the diamond was always a
binary-decision symbol.

## `subprocess`

Double-border rectangle. The classic flowchart "this step is
itself another diagram" annotation. Use `subprocess` when:

- The step has a separate detailed diagram you can link to (the
  agent should expose that link when the node is clicked).
- The step is a known module/library function whose internals are
  out of scope for the current diagram.
- You want to visually distinguish a "you'll go deep into this
  later" step from the routine `process` steps.

A diagram of 10 `subprocess` nodes is wrong — every step can't be
"deeper than this diagram shows". Use 1-3 `subprocess` nodes per
diagram at most.

## `external`

Dashed-stroke rectangle. Stroke is `--vc-color-content-subtle`. An
`external` node represents a thing outside the system being drawn:
a third-party API, a customer, a regulator, a downstream consumer.
The dashed stroke signals "we don't control this".

```json
{ "id": "stripe", "type": "external", "label": "Stripe API",
  "role": "external" }
```

Use `role: "external"` together with `type: "external"` so the fill
also visually signals "outside". The stroke is already in the
external palette; the role gives the fill a matching tint.

## `card`

The bigger rectangle for `phase-graph`. Default 200 x 120 to hold
a title (the `label`) and a detail line. Cards are intentionally
big — they ARE the unit of work, not a step in a smaller process.

A `card` has a stronger role tint than a `process` (it is bigger,
so the tint reads more strongly without overwhelming). Pair with
the `phase-graph` preset; using `card` in `process-flow` clashes
with the lane geometry.

## Authoring shape correctness

A common authoring mistake: picking the shape that "looks nice"
instead of the shape that carries the right semantic. The fix is
to read the diagram out loud:

- If you say "first we DO X" — `process`.
- If you say "first we CHECK X" — `decision`.
- If you say "first we START" — `start`.
- If you say "X is provided by ANOTHER SERVICE" — `external`.
- If you say "X is its own MINI-PROCESS" — `subprocess`.

When the spoken description matches the shape, the diagram is
self-explaining.

## Size customization

Every node type has default `w` and `h`; supplying explicit `w`/`h`
overrides them. Use this when:

- A label is unusually long ("Asynchronous job submission with
  retry-on-failure") — bump `w`.
- A `subprocess` wraps two lines of label + detail — bump `h`.
- A `decision` needs to hold "Valid against the JSON schema?" —
  bump both (diamonds need width to hold long text).

Avoid shrinking below defaults; smaller nodes break the visual
rhythm and crowd the labels.

## Role tinting per type

| `role` | What it does to the node |
|---|---|
| `client` | 14% info tint, info stroke |
| `service` | 14% accent tint, accent stroke |
| `data` | 14% success tint, success stroke |
| `infra` | 14% warning tint, warning stroke |
| `external` | sunken surface, subtle stroke |
| `accent` | 22% accent tint, accent stroke (the "look here" role) |

A node `type`'s own semantic stroke (`start`/`decision`/`end`/
`external`) wins over the role stroke. The fill is always role-
driven (or surface neutral if no role).

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | every node fill + stroke is a `--vc-color-*` reference |
| typography | `--vc-font-body`, `--vc-text-1` (label), `--vc-text-0` (detail) |
| radius | `--vc-radius-sm` (start/end pills), `--vc-radius-md` (rects), `--vc-radius-lg` (cards) |

## Selection atoms

Every rendered node is wrapped:

```html
<g data-ve-id="vc-scene-12-node-3"
   data-ve-type="diagram-node"
   data-ve-data='{"nodeId":"check","nodeType":"decision",...}'>
  <polygon points="..." fill="var(--vc-color-surface)" stroke="var(--vc-color-warning)"/>
  <text>Valid?</text>
</g>
```

The visible shape (here a `<polygon>`) is a DIRECT child of the
`<g>` so the runtime's selection CSS lights it up on hover:

```css
svg g[data-ve-id]:hover > rect,
svg g[data-ve-id]:hover > polygon,
svg g[data-ve-id]:hover > path {
  filter: brightness(1.08);
  cursor: pointer;
}
```

## Anti-patterns

- Using `decision` for "input check" (no two-way branch follows):
  use `process` instead; the diamond promises a branch.
- Using `process` for "user clicks button" (the user is external):
  use `external`.
- Inventing a new type by overriding `w`/`h` to look like a
  trapezoid or hexagon: the engine only ships these seven shapes
  on purpose. Inventing more dilutes the vocabulary.
- Mixing `card` and `process` in one diagram: card is for
  `phase-graph`; process is for the other presets. One per scene.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Verify shapes are immediately
identifiable — pill = round, diamond = pointy, double-border =
clearly two strokes, dashed = visibly dashed. A screenshot at
~50% browser zoom is the acid test: if the shapes still read
correctly at small scale, they will read in a presentation.
