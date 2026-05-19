# State machine diagram

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold](#scaffold)
- [State node convention](#state-node-convention)
- [Transition labels (the event vocabulary)](#transition-labels-the-event-vocabulary)
- [Self-loops (the same state on different events)](#self-loops-the-same-state-on-different-events)
- [Multiple outgoing edges from one state](#multiple-outgoing-edges-from-one-state)
- [Guards / conditions](#guards--conditions)
- [Actions on entry / exit](#actions-on-entry--exit)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

A diagram of states and transitions — the canonical shape for
visualizing a finite state machine (login flow with idle / logging
in / logged in / locked out, an order's lifecycle, a connection's
disconnect / reconnect / reconnected loop). Each state is a rounded
rectangle; each transition is a labeled directed edge; self-loops
are common.

## When to choose this pattern

Use a state machine diagram when:

- You are modeling a **state-bearing process** where the current
  state determines what can happen next.
- The set of states is **finite and named** (3-12 typical).
- Transitions are **event-driven** — each edge labelled with the
  event that fires the transition.

Do NOT use this pattern when:

- The "states" are really steps in a linear process (use
  `process-flow-preset.md`).
- The states branch into a tree of sub-states (use a nested
  diagram or hand off to Mermaid `stateDiagram-v2`).
- There are 15+ states (the diagram becomes a hairball; consider
  collapsing related states or using a state-transition table
  instead).

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1000,
    "height": 480,
    "background": "plain",
    "nodes": [
      { "id": "init",    "type": "start",   "label": "Start",
        "x": 40,  "y": 220, "w": 90,  "h": 40 },

      { "id": "idle",    "type": "process", "label": "Idle",
        "role": "client",  "x": 200, "y": 200, "w": 160, "h": 80 },
      { "id": "logging", "type": "process", "label": "Logging in",
        "role": "service", "x": 460, "y": 80,  "w": 180, "h": 80 },
      { "id": "in",      "type": "process", "label": "Logged in",
        "role": "data",    "x": 460, "y": 200, "w": 180, "h": 80 },
      { "id": "locked",  "type": "process", "label": "Locked out",
        "role": "infra",   "x": 460, "y": 340, "w": 180, "h": 80 },

      { "id": "done",    "type": "end",     "label": "End",
        "x": 800, "y": 220, "w": 90, "h": 40 }
    ],
    "edges": [
      { "from": "init", "to": "idle",
        "route": "straight", "label": "open app" },

      { "from": "idle", "to": "logging",
        "route": "bezier", "label": "submit credentials" },
      { "from": "logging", "to": "in",
        "route": "bezier", "label": "ok" },
      { "from": "logging", "to": "locked",
        "route": "bezier", "label": "fail x3", "style": "dashed" },
      { "from": "logging", "to": "idle",
        "route": "bezier", "label": "fail (retry)", "style": "dashed" },

      { "from": "in", "to": "idle",
        "route": "bezier", "label": "logout" },
      { "from": "in", "to": "in",
        "route": "loop", "label": "extend session" },

      { "from": "locked", "to": "idle",
        "route": "loop", "label": "unlock (T)", "style": "dashed" },

      { "from": "in",  "to": "done",
        "route": "straight", "label": "close app" }
    ]
  }
  </script>
</div>
```

## State node convention

A state is a `process` node — rounded rectangle, role-tinted by
the state's category (`client` = user-input state, `service` =
processing state, `data` = stable state, `infra` = error /
terminal state).

Some authors use `subprocess` (double-border) for composite
states (a state that itself contains a sub-machine). This works
but the engine has no nesting support — the sub-machine should be
a separate diagram linked from the click handler.

Use `start` for the initial state (Mermaid uses a black filled
circle; here we use the engine's `start` pill).

Use `end` for terminal states (final / accept states).

## Transition labels (the event vocabulary)

Every edge MUST be labelled with the event that triggers the
transition. The label is the entire reason this is a state
machine and not just a graph:

- `submit credentials` (user action)
- `ok` (system response)
- `fail x3` (a condition)
- `timeout` (a passive event)
- `cancel` (user action)

Conventions for label brevity:

- 1-4 words.
- Lowercase except for proper names.
- No punctuation.
- Use "/" for compound events (`ok / save`).

## Self-loops (the same state on different events)

A self-loop = `from` and `to` are the same node. Use `route:
"loop"`:

```json
{ "from": "in", "to": "in",
  "route": "loop", "label": "extend session" }
```

The engine bows the loop out perpendicular to the state's
dominant axis and returns. Self-loops are common in state
machines — they represent "this event keeps you in the same
state" (a tick, a refresh, an idle timeout reset).

## Multiple outgoing edges from one state

Common when a state can transition to multiple destinations
based on different events:

```json
{ "from": "logging", "to": "in",     "label": "ok" },
{ "from": "logging", "to": "locked", "label": "fail x3" },
{ "from": "logging", "to": "idle",   "label": "fail (retry)" }
```

The engine picks the closest anchor on the source for each
outgoing edge. For visual clarity, position the destination
nodes around the source so the edges don't cross:

- `in` above the source -> exit anchor at top
- `locked` below the source -> exit anchor at bottom
- `idle` to the left -> exit anchor at left

## Guards / conditions

A state machine sometimes has a guard on a transition (a
condition that must be true for the transition to fire). Encode
in the label:

- `submit [valid]`
- `tick [count > 0]`
- `purchase [balance > 0]`

This mirrors UML state-machine notation: `event [guard] / action`.
The engine's edge label is one string; brackets are a parsing
convention for the reader.

## Actions on entry / exit

A state's entry action (something done when entering the state) is
written into the state's `detail` field:

```json
{ "id": "in", "type": "process", "label": "Logged in",
  "detail": "entry: load profile",
  "role": "data" }
```

For exit actions, append:

```json
{ "id": "in", "type": "process", "label": "Logged in",
  "detail": "entry: load profile\\nexit: clear session" }
```

The detail field is one line by default; multi-line entries
require bumping the node's `h`.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted state fills, `--vc-color-border-strong` (edges), `--vc-color-success` (start, end strokes) |
| typography | `--vc-text-1` for state labels, `--vc-text-0` for transition labels |
| radius | `--vc-radius-md` for states |

## Selection atoms

States and transitions are standard atoms. `data-ve-data` on a
transition carries the event label:

```json
{ "sceneId": 30, "kind": "edge",
  "edgeFrom": "logging", "edgeTo": "in",
  "label": "ok",
  "edgeStyle": "solid",
  "edgeRoute": "bezier" }
```

An agent surfacing "the FSM has 3 failure transitions"
information can grep the scene for edges with `style: "dashed"`
or labels matching `/fail|error|reject/`.

## Variations

### Hierarchical states (composite)

The engine has no built-in composite-state support. Workaround:

1. Draw the composite state as a `group` rectangle.
2. Place the substate `process` nodes inside.
3. Transitions into the group attach to the group's border
   (treat the group as the destination); transitions out leave
   from any substate.

```json
"groups": [
  { "id": "in-composite", "label": "Logged in",
    "x": 440, "y": 60, "w": 220, "h": 320, "role": "data" }
],
"nodes": [
  { "id": "active",  "type": "process", "label": "Active",
    "group": "in-composite",
    "x": 460, "y": 100, "w": 180, "h": 60 },
  { "id": "afk",     "type": "process", "label": "AFK",
    "group": "in-composite",
    "x": 460, "y": 180, "w": 180, "h": 60 },
  { "id": "paused",  "type": "process", "label": "Paused",
    "group": "in-composite",
    "x": 460, "y": 260, "w": 180, "h": 60 }
]
```

Transitions: `idle -> active` (into the group); `active -> afk`
(inside); `afk -> active`; `paused -> idle` (out of group).

### Activity diagram (states with actions)

An activity diagram extends a state machine — each state's
"activity" is shown explicitly. Add `detail` to every state and
the diagram doubles as a documentation artifact.

## Anti-patterns

- States named "State 1", "State 2": meaningless. Name every
  state by what it represents semantically.
- Edges without labels: removes the entire point. Every edge
  MUST have a label.
- A state with 6 outgoing edges: usually means the state is
  doing too much. Decompose.
- An "error" state reachable from every other state: clutters
  the diagram. Use a global note ("[any state] -> error on
  catastrophic failure") and omit those edges.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Self-loops are visible (the bow-out is large enough to read).
- Edge labels don't overlap their nodes or each other.
- The start state is on the left or top (reading-direction
  convention).
- Every transition's label fits in the chip without truncation.
