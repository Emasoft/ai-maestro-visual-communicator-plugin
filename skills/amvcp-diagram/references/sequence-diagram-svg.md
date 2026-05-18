# Sequence diagram (SVG, not Mermaid)

## Table of Contents

- [When to choose SVG over Mermaid](#when-to-choose-svg-over-mermaid)
- [Scaffold](#scaffold)
- [Message arrows](#message-arrows)
- [Activation bars](#activation-bars)
- [Notes / annotations](#notes--annotations)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)
- [When you should just use Mermaid](#when-you-should-just-use-mermaid)

A native-SVG sequence diagram — actors as columns, time as a
vertical axis, messages as horizontal arrows. The engine renders
it from a `free`-preset scene graph. Use this when the diagram
must be themed off DESIGN.md tokens and selectable atom-by-atom,
properties Mermaid's `sequenceDiagram` cannot match.

## When to choose SVG over Mermaid

Mermaid's `sequenceDiagram` is the right pick for QUICK sequence
diagrams in markdown — terse syntax, no styling work. But when
the diagram must:

- Theme via `--vc-*` tokens (Mermaid bakes colors at init time,
  needs forwarding).
- Become a selection atom per message (Mermaid's selection model
  is per-node).
- Live in a larger scene-graph diagram alongside other shapes.
- Survive a hot-swap of the DESIGN.md without re-init.

...use the SVG scene-graph approach below.

For everything else, hand off to `amvcp-graph-diagrams` Mermaid.

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1000,
    "height": 720,
    "background": "plain",
    "nodes": [
      { "id": "user-hdr",   "type": "process", "label": "User",
        "role": "client",  "x": 60,  "y": 20, "w": 140, "h": 40 },
      { "id": "client-hdr", "type": "process", "label": "Client",
        "role": "client",  "x": 280, "y": 20, "w": 140, "h": 40 },
      { "id": "api-hdr",    "type": "process", "label": "API",
        "role": "service", "x": 500, "y": 20, "w": 140, "h": 40 },
      { "id": "db-hdr",     "type": "process", "label": "Database",
        "role": "data",    "x": 720, "y": 20, "w": 140, "h": 40 },

      { "id": "user-anchor",   "type": "process", "label": "",
        "x": 60,  "y": 700, "w": 140, "h": 1 },
      { "id": "client-anchor", "type": "process", "label": "",
        "x": 280, "y": 700, "w": 140, "h": 1 },
      { "id": "api-anchor",    "type": "process", "label": "",
        "x": 500, "y": 700, "w": 140, "h": 1 },
      { "id": "db-anchor",     "type": "process", "label": "",
        "x": 720, "y": 700, "w": 140, "h": 1 },

      { "id": "msg1-from", "type": "process", "label": "",
        "x": 130, "y": 100, "w": 1, "h": 1 },
      { "id": "msg1-to",   "type": "process", "label": "",
        "x": 350, "y": 100, "w": 1, "h": 1 }
    ],
    "edges": [
      { "from": "user-hdr",   "to": "user-anchor",
        "route": "straight", "arrow": "none", "style": "dashed" },
      { "from": "client-hdr", "to": "client-anchor",
        "route": "straight", "arrow": "none", "style": "dashed" },
      { "from": "api-hdr",    "to": "api-anchor",
        "route": "straight", "arrow": "none", "style": "dashed" },
      { "from": "db-hdr",     "to": "db-anchor",
        "route": "straight", "arrow": "none", "style": "dashed" },

      { "from": "msg1-from", "to": "msg1-to",
        "route": "straight", "label": "click Upload" }
    ]
  }
  </script>
</div>
```

The headers are the **actor lifelines** at the top; the anchors
at y=700 are invisible (h=1) endpoints that the lifelines
(vertical dashed lines) terminate at. Messages are short
horizontal edges connecting two invisible message-endpoint nodes
positioned at the right y for that message's time.

This is awkward to author by hand for a long sequence. Two
alternatives:

1. **Helper builder** — a separate authoring helper that takes
   a friendly `{actors, messages}` array and emits the verbose
   scene graph. The agent should expose this as a utility (not
   currently part of the engine).
2. **Hand off to Mermaid** — for sequences > 6 messages, just
   use Mermaid via `amvcp-graph-diagrams`. The styling loss is
   minor compared to the authoring cost.

## Message arrows

Each message is an edge with:

- `from`/`to` — invisible point-nodes positioned at the source
  and target lifeline's x, both at the same y (the message's
  time).
- `label` — the message name ("POST /upload", "200 OK", "INSERT
  row").
- `arrow: "end"` (default) — arrow at the receiver.
- `style: "solid"` for synchronous (call); `style: "dashed"` for
  asynchronous (response, event).

Convention:

- **Solid arrow** = a call (request).
- **Dashed arrow** = a return (response).
- An "activation bar" (a small rectangle along a lifeline) shows
  when an actor is processing — draw as a thin `process` node
  positioned on the lifeline at the right y for the duration.

## Activation bars

An activation bar = a `process` node on the lifeline:

```json
{ "id": "api-activation", "type": "process", "label": "",
  "x": 495, "y": 200, "w": 10, "h": 80,
  "role": "service" }
```

The bar's `x` is the lifeline x minus 5 (half the bar's 10-wide).
The `y` is the start time of the activation; `h` is the duration.

## Notes / annotations

A note is a small text box placed alongside a lifeline. Draw as
a `process` node with a custom narrow shape:

```json
{ "id": "note1", "type": "process",
  "label": "Validates against the JSON schema",
  "x": 550, "y": 230, "w": 200, "h": 50,
  "role": "accent" }
```

Position the note next to the activation it annotates. The
accent role tints it so it visually separates from the diagram
content.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | header fills (role-tinted), lifeline strokes (`--vc-color-border`), message strokes (`--vc-color-border-strong`), activation fills (role-tinted) |
| typography | `--vc-font-body` for headers and message labels; `--vc-text-1` size |

## Selection atoms

The headers and the messages are independent selection atoms:

- Click a header -> select the actor.
- Click a message -> select that interaction.
- Click an activation bar -> select that activation period.

Click `data-ve-data`:

```json
{ "sceneId": 27, "kind": "edge",
  "edgeFrom": "msg1-from", "edgeTo": "msg1-to",
  "label": "POST /upload",
  "messageIndex": 1 }
```

## Variations

### With time-stamps on the left

Add a column of time markers on the left:

```json
{ "id": "t0", "type": "process", "label": "t=0",
  "x": 0, "y": 100, "w": 40, "h": 20 },
{ "id": "t1", "type": "process", "label": "t=1",
  "x": 0, "y": 250, "w": 40, "h": 20 },
{ "id": "t2", "type": "process", "label": "t=2",
  "x": 0, "y": 400, "w": 40, "h": 20 }
```

Time markers anchor the messages to specific moments — useful
when the diagram covers a long timespan or when relative timing
matters.

### With async-event symbols

For an event that's NOT a direct message between two actors (a
broadcast, a webhook delivered by a third party), draw it as a
small "burst" icon:

```json
{ "id": "event-burst", "type": "process",
  "label": "kafka.user_created",
  "x": 580, "y": 350, "w": 200, "h": 30,
  "role": "infra" }
```

with a labeled arrow from the producer's lifeline to the burst
and another arrow from the burst to any consumer lifelines.

## Anti-patterns

- Too many activations on one lifeline: the lifeline becomes a
  solid colored strip. Either trim or convert to a swimlane
  diagram.
- Sequence diagram with 20+ messages: unreadable. Split into
  multiple sub-sequences, each diagramming one phase.
- Bezier-routed messages: violates the sequence-diagram
  convention. Use `route: "straight"` for all messages.
- Activation bars stacked outside their lifeline (wrong x): a
  common author bug. Always position activation `x = lifelineX -
  barWidth/2`.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Lifelines (vertical dashed lines) run from the header to the
  bottom of the diagram, no gaps.
- Messages are clearly horizontal (no slope).
- Activations align with their lifelines (the bar visibly sits
  ON the line).
- Labels don't overlap each other (cluttered labels = bug; spread
  messages further in y).

## When you should just use Mermaid

This pattern works but the JSON is verbose. For most sequences:

```
sequenceDiagram
  User->>API: POST /upload
  API->>Database: INSERT row
  Database-->>API: row id
  API-->>User: 202 Accepted
```

That's 4 lines vs 40 lines of JSON. Hand off via
`amvcp-graph-diagrams` Mermaid unless you specifically need the
theming/selection properties this skill provides.
