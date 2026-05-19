# Decision tree diagram

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold](#scaffold)
- [Tree geometry conventions](#tree-geometry-conventions)
- [Decision node labels](#decision-node-labels)
- [Outcome node convention](#outcome-node-convention)
- [Edge labels (the answer to the question)](#edge-labels-the-answer-to-the-question)
- [Routing convention](#routing-convention)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

A tree of decisions and outcomes — the canonical shape for "how do
I pick X?" content. Each interior node is a decision (`yes/no` or
`A/B/C` branch); each leaf is an outcome. Use to visualize
flowcharts that route to a set of recommendations, troubleshooting
guides, or any "answer these N questions to reach an answer"
pattern.

## When to choose this pattern

Use a decision tree when:

- The diagram answers "**how do I choose between options?**" with
  a hierarchical series of questions.
- Each branch terminates at a specific outcome.
- The tree fits on one screen (3-15 nodes total).

Do NOT use this pattern when:

- The decisions can branch back to each other (it's a state
  machine, not a tree — use `state-machine-diagram.md`).
- The tree has 20+ nodes (becomes a wall; consider a decision
  table or a guided wizard).
- Each decision has 5+ branches (the tree gets sparse; consider
  a switch-style flowchart).

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 560,
    "background": "plain",
    "nodes": [
      { "id": "q1", "type": "decision",
        "label": "Numeric data?",
        "x": 540, "y": 20, "w": 120, "h": 90 },

      { "id": "q2", "type": "decision",
        "label": "Time series?",
        "x": 220, "y": 180, "w": 120, "h": 90 },
      { "id": "q3", "type": "decision",
        "label": "Categorical?",
        "x": 860, "y": 180, "w": 120, "h": 90 },

      { "id": "out-line", "type": "process",
        "label": "Line chart",
        "role": "service", "x": 40,  "y": 360, "w": 180, "h": 70 },
      { "id": "out-bar",  "type": "process",
        "label": "Bar chart",
        "role": "service", "x": 260, "y": 360, "w": 180, "h": 70 },
      { "id": "out-pie",  "type": "process",
        "label": "Pie / donut",
        "role": "service", "x": 540, "y": 360, "w": 180, "h": 70 },
      { "id": "out-table","type": "process",
        "label": "Table",
        "role": "data",    "x": 760, "y": 360, "w": 180, "h": 70 },
      { "id": "out-flow", "type": "process",
        "label": "Flowchart",
        "role": "service", "x": 980, "y": 360, "w": 180, "h": 70 }
    ],
    "edges": [
      { "from": "q1", "to": "q2", "label": "yes" },
      { "from": "q1", "to": "q3", "label": "no" },

      { "from": "q2", "to": "out-line", "label": "yes" },
      { "from": "q2", "to": "out-bar",  "label": "no" },

      { "from": "q3", "to": "out-pie",   "label": "<5 categories" },
      { "from": "q3", "to": "out-table", "label": "5-20 cats" },
      { "from": "q3", "to": "out-flow",  "label": ">20 cats" }
    ]
  }
  </script>
</div>
```

## Tree geometry conventions

- The root decision is **centered** at the top of the canvas.
- Each branch splits left/right at the next level.
- Leaves (outcomes) are at the bottom, evenly spaced.
- Edges run top-to-bottom (so the reading direction is "down" =
  "deeper into the tree").

Levels of the tree map to y-coordinates:

| Level | Typical y range |
|---|---|
| Root | 20-110 |
| Level 1 | 180-270 |
| Level 2 | 360-470 (if a 3-deep tree) |

Spacing between siblings should be ~200 units wide (enough for the
decision diamond and the edge label).

## Decision node labels

Each decision node is a `decision` diamond. Label conventions:

- One-line questions ending with `?`.
- Optionally with a `detail` field for context.
- Avoid yes/no boolean branches when more interesting splits
  exist (`<5` / `5-20` / `>20` instead of just `<5` / `>=5`).

```json
{ "id": "q3", "type": "decision",
  "label": "Categorical?",
  "detail": "discrete values",
  "x": 860, "y": 180, "w": 120, "h": 90 }
```

## Outcome node convention

Each leaf is a `process` (or `subprocess` if the outcome itself
opens a further sub-process). Tint with `role`:

- `role: "service"` for "do X" outcomes (an action).
- `role: "data"` for outcomes that name a data structure.
- `role: "accent"` for the **recommended** outcome (the one
  most users land on); use sparingly.

Pair the outcome node's label with a short one-line `detail` for
context:

```json
{ "id": "out-bar", "type": "process",
  "label": "Bar chart",
  "detail": "best for comparing 3-12 categories",
  "role": "service",
  "x": 260, "y": 360, "w": 220, "h": 90 }
```

## Edge labels (the answer to the question)

Each edge label is the ANSWER to the source's question:

- `yes` / `no` for binary decisions.
- `<5 categories` / `5-20 cats` / `>20 cats` for ranged splits.
- `mobile` / `desktop` for platform splits.

Brevity wins — the label sits in a 40-wide chip; long labels wrap
or get cut off.

## Routing convention

Use `route: "ortho"` (default) for clean right-angled edges that
look like tree branches. Bezier would suggest a less rigid
relationship.

For trees deeper than 3 levels, alternate the bend direction so
edges don't pile up: level 0 -> level 1 uses straight-down ortho;
level 1 -> level 2 uses ortho with a slight left/right bend
depending on which branch.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | decision strokes (`--vc-color-warning`), outcome fills (role-tinted), accent outcome (`--vc-color-accent`) |
| typography | `--vc-text-1` for decision labels, `--vc-text-0` for edge labels |
| radius | `--vc-radius-md` for outcomes (none for the diamond shape itself) |

## Selection atoms

Standard `diagram-node` / `diagram-edge`. The agent receives:

```json
{ "sceneId": 33, "kind": "node",
  "nodeId": "q3", "nodeType": "decision",
  "label": "Categorical?",
  "detail": "discrete values" }
```

A click on a decision can surface "if you answer YES, you'll land
at outcome X" guidance — the agent walks the outgoing edges from
the JSON to compute the path.

## Variations

### Recommendation tree with one highlighted path

Tint ONE path through the tree with the accent color — the
recommended route. Useful for "if you're not sure, do this":

- Tint all decisions on the path with `role: "accent"`.
- Tint the destination outcome with `role: "accent"`.
- All other edges use `style: "dashed"` to de-emphasize.

The reader sees the recommended path immediately; alternative
paths are visible but visually de-emphasized.

### Decision table (alternative when tree is too big)

When the decision tree grows past 15 nodes, switch to a decision
TABLE — columns = decision attributes, rows = combinations,
cells = outcomes:

```
| Numeric | TimeSeries | Categorical | Outcome     |
|---------|------------|-------------|-------------|
| yes     | yes        | -           | Line chart  |
| yes     | no         | -           | Bar chart   |
| no      | -          | <5          | Pie chart   |
| no      | -          | 5-20        | Table       |
| no      | -          | >20         | Flowchart   |
```

A decision table is more compact for many-attribute cases but
loses the visual reading. Hand off to the `amvcp-tables` skill.

### Tree with branch probabilities

For probabilistic trees (a recommender, a forecast), label each
edge with its probability:

```json
{ "from": "q1", "to": "q2", "label": "yes (62%)" }
```

This turns the tree into a Bayesian decision tree. Be honest
about the numbers; made-up probabilities mislead.

## Anti-patterns

- A tree where every leaf has the same `role`: lose the
  semantic distinction. Vary by outcome category.
- Unlabeled edges: makes the tree unreadable.
- Too many levels (5+): the tree becomes tall and thin; consider
  collapsing related decisions into one multi-branch decision.
- Outcomes that aren't actually different (two leaves pointing
  at "Use a chart"): collapse them or distinguish.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The root decision is at the top-center (not auto-placed wrong).
- The leaves are evenly spaced at the bottom (uneven spacing
  reads as "missing branches").
- The diamond shapes for decisions are clearly different from
  the rectangle outcomes — at small zoom, the shape distinction
  is the only cue.
- Edge labels are readable (not clipped by neighboring nodes).
