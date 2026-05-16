# Tree / hierarchy diagram

A diagram of a tree — a root, branches, leaves. The canonical
shape for an org chart, a file-system tree, a taxonomy, a class
hierarchy. Each parent connects downward (or rightward) to its
children.

## When to choose this pattern

Use a tree diagram when:

- You have a **single-rooted hierarchy** (one item at the top,
  branches descending).
- Each child has **exactly one parent** (no cycles, no shared
  children).
- The tree has 3-30 nodes.

Do NOT use this pattern when:

- Nodes have multiple parents (it's a DAG — use `phase-graph-
  preset.md` or hand off to Graphviz).
- The hierarchy is implicit / fuzzy (use a layered architecture
  canvas instead).
- The tree has 50+ nodes (becomes unreadable; use a collapsible
  tree control or a navigable list).

## Scaffold (top-down org-chart style)

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 640,
    "background": "plain",
    "nodes": [
      { "id": "ceo", "type": "process", "label": "CEO",
        "detail": "Alice",
        "role": "accent",
        "x": 520, "y": 40, "w": 160, "h": 60 },

      { "id": "vp-eng", "type": "process", "label": "VP Engineering",
        "detail": "Bob",
        "role": "service",
        "x": 60,  "y": 180, "w": 200, "h": 70 },
      { "id": "vp-prod", "type": "process", "label": "VP Product",
        "detail": "Carol",
        "role": "client",
        "x": 320, "y": 180, "w": 200, "h": 70 },
      { "id": "vp-rev", "type": "process", "label": "VP Revenue",
        "detail": "Dan",
        "role": "data",
        "x": 580, "y": 180, "w": 200, "h": 70 },
      { "id": "vp-ops", "type": "process", "label": "VP Ops",
        "detail": "Eve",
        "role": "infra",
        "x": 840, "y": 180, "w": 200, "h": 70 },

      { "id": "lead-fe", "type": "process", "label": "Frontend Lead",
        "detail": "8 engineers", "role": "service",
        "x": 20,  "y": 340, "w": 160, "h": 60 },
      { "id": "lead-be", "type": "process", "label": "Backend Lead",
        "detail": "12 engineers", "role": "service",
        "x": 200, "y": 340, "w": 160, "h": 60 },

      { "id": "pm-grow",  "type": "process", "label": "PM Growth",
        "detail": "Frank", "role": "client",
        "x": 320, "y": 340, "w": 200, "h": 60 },

      { "id": "lead-ent", "type": "process", "label": "Enterprise Sales",
        "detail": "6 reps", "role": "data",
        "x": 540, "y": 340, "w": 200, "h": 60 },
      { "id": "lead-smb", "type": "process", "label": "SMB Sales",
        "detail": "4 reps", "role": "data",
        "x": 760, "y": 340, "w": 200, "h": 60 }
    ],
    "edges": [
      { "from": "ceo", "to": "vp-eng",  "arrow": "none", "route": "ortho" },
      { "from": "ceo", "to": "vp-prod", "arrow": "none", "route": "ortho" },
      { "from": "ceo", "to": "vp-rev",  "arrow": "none", "route": "ortho" },
      { "from": "ceo", "to": "vp-ops",  "arrow": "none", "route": "ortho" },

      { "from": "vp-eng",  "to": "lead-fe", "arrow": "none", "route": "ortho" },
      { "from": "vp-eng",  "to": "lead-be", "arrow": "none", "route": "ortho" },
      { "from": "vp-prod", "to": "pm-grow", "arrow": "none", "route": "ortho" },
      { "from": "vp-rev",  "to": "lead-ent","arrow": "none", "route": "ortho" },
      { "from": "vp-rev",  "to": "lead-smb","arrow": "none", "route": "ortho" }
    ]
  }
  </script>
</div>
```

Note `arrow: "none"` — org-chart edges are undirected lines
showing relationship, not directed flow.

## Tree layout conventions

- **Root at top, leaves at bottom** (top-down) — the classic org
  chart. Edges run downward.
- **Root at left, leaves at right** (left-to-right) — better for
  trees that are wide and shallow.
- **Root in center, leaves radially** — see `mind-map-radial.md`
  for the radial variant.

For top-down trees, vertical spacing between levels is ~140 units
(level y = level_index * 140 + 40). Horizontal positioning of
nodes within a level is computed by centering each subtree:

- Level 0: 1 node, centered (x = canvas_width / 2 - node_width / 2)
- Level 1: 4 nodes, evenly spaced
- Level 2: each subtree's nodes are clustered under their parent

For a hand-authored tree, eyeball the centering by:

1. Place every leaf first, evenly spaced horizontally.
2. Place each parent at the average x of its children's x's.

## Routing convention

Use `route: "ortho"` for org charts (clean right-angled lines
that show "this person reports to that person"). The bend
happens just below the parent (a horizontal line connects all
the children at the same x-axis level, then drops to each
child).

For a cleaner look, the engine's ortho routing produces a Z-elbow
that works well for tree branches. Avoid `bezier` — too organic;
the tree's hard-edges convention is part of the visual language.

## File-system tree variation

For a file-system tree, use left-to-right layout with indented
children:

```json
{ "id": "src",    "type": "process", "label": "src/",
  "x": 40,  "y": 40, "w": 120, "h": 30 },
{ "id": "comp",   "type": "process", "label": "components/",
  "x": 200, "y": 40, "w": 180, "h": 30 },
{ "id": "btn",    "type": "process", "label": "Button.tsx",
  "x": 420, "y": 40, "w": 140, "h": 30 },
{ "id": "frm",    "type": "process", "label": "Form.tsx",
  "x": 420, "y": 80, "w": 140, "h": 30 }
```

Use small node heights (30) and slim widths (120-180) to mimic
the typography of a real file tree. Set `--vc-font-mono` for the
label font.

## Class hierarchy variation

For an OOP class hierarchy:

- Nodes carry the class name as `label` and the field count as
  `detail`.
- Edges have `arrow: "end"` POINTING UPWARD (the inheritance
  arrow conventionally points from subclass to superclass).
- Use a different `style` for "implements" vs "extends":
  - `style: "solid"` = extends (class to class).
  - `style: "dashed"` = implements (class to interface).

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted node fills, `--vc-color-border-strong` for edges |
| typography | `--vc-text-1` for labels, `--vc-text-0` for detail |
| radius | `--vc-radius-md` for nodes |

## Selection atoms

Standard `diagram-node` / `diagram-edge`. Tree-specific payload
fields the agent benefits from:

```json
{ "sceneId": 39, "kind": "node",
  "nodeId": "vp-eng", "nodeType": "process",
  "label": "VP Engineering",
  "detail": "Bob",
  "parentId": "ceo",            // computed from incoming edges
  "childCount": 2                // computed from outgoing edges
}
```

These are not in the base engine yet — they're authoring guidance
to compute and include in `data-ve-data` when emitting the JSON.

## Variations

### Collapsible tree

Add `data-ve-collapsible="1"` to each parent node. The runtime
attaches a click handler that hides every descendant when the
parent is clicked (collapse) and re-shows them on second click
(expand). Useful for big trees where most of the time the user
wants a summarized view.

This requires the engine to support per-node collapsible state
(planned but not yet shipped). Workaround: render two diagrams,
one collapsed and one expanded, and use a tab switcher.

### Tree with badges

Each node can carry a small badge (a count, a status, an icon)
in the upper-right corner. Author the badge as a sibling `<text>`
or `<g>` element via a post-render hook (the engine doesn't
support badges natively).

```html
<g class="vc-node-badge"
   transform="translate(150, -10)">
  <circle r="8" fill="var(--vc-color-accent)"/>
  <text font-size="10" text-anchor="middle"
        fill="var(--vc-color-on-accent)">5</text>
</g>
```

## Anti-patterns

- Tree edges with arrows: org charts don't have arrows; the
  hierarchy is implied by position. Arrows are wrong.
- Multi-parent children: it's not a tree. Use a DAG.
- 5+ levels of depth: gets visually long. Either fold middle
  levels or split into multiple diagrams.
- Inconsistent node sizes (one big, one small): breaks the
  visual grid. Pick a size and stick with it across the tree.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The root is visually distinct (often via `role: "accent"`).
- The tree is centered horizontally in the canvas.
- Edges don't cross (cross-edges in a tree usually indicate
  miscounted x-coordinates).
- Labels don't overlap their neighboring nodes' labels.

## Cross-skill seam

For a truly big org chart (50+ people), this skill's manual
layout becomes painful. Hand off to `amvcp-graph-diagrams`
Graphviz with `dot` engine — it auto-lays out hierarchies
beautifully. The trade-off: lose `data-ve-id` per-node selection
for the heavy auto-layout.
