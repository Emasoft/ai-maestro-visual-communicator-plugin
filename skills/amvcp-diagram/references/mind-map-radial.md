# Mind map (radial)

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold](#scaffold)
- [Radial layout math](#radial-layout-math)
- [Branch coloring](#branch-coloring)
- [Edges convention](#edges-convention)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)
- [Cross-skill seam](#cross-skill-seam)

A diagram with a central topic and branches radiating outward.
Used for brainstorms, topic maps, knowledge structures. The
center is the "everything connects here" hub; each branch is a
sub-topic; each leaf is a detail.

## When to choose this pattern

Use a radial mind map when:

- You have a **single central topic** with 3-8 main branches.
- Each branch has 2-6 sub-nodes.
- You want the **visual to feel organic / explorable** — the
  radial layout invites the eye to follow each branch.

Do NOT use a radial mind map when:

- Sub-topics share children (it's a graph, not a tree).
- The "tree" is really linear (use `process-flow-preset.md`).
- The diagram has 30+ nodes (the radial layout becomes
  cluttered; use a hierarchical tree instead).

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1000,
    "height": 800,
    "background": "plain",
    "nodes": [
      { "id": "core", "type": "process", "label": "Diagram engine",
        "role": "accent",
        "x": 420, "y": 360, "w": 160, "h": 80 },

      { "id": "auth", "type": "process", "label": "Authoring",
        "role": "client",
        "x": 100, "y": 100, "w": 160, "h": 60 },
      { "id": "thm",  "type": "process", "label": "Theming",
        "role": "service",
        "x": 780, "y": 100, "w": 160, "h": 60 },
      { "id": "rdr",  "type": "process", "label": "Rendering",
        "role": "data",
        "x": 100, "y": 660, "w": 160, "h": 60 },
      { "id": "anim", "type": "process", "label": "Animation",
        "role": "infra",
        "x": 780, "y": 660, "w": 160, "h": 60 },

      { "id": "json", "type": "process", "label": "JSON scene",
        "x": 20,  "y": 40,  "w": 140, "h": 40 },
      { "id": "ascii","type": "process", "label": "ASCII fallback",
        "x": 20,  "y": 160, "w": 140, "h": 40 },

      { "id": "vct", "type": "process", "label": "--vc-* tokens",
        "x": 840, "y": 40,  "w": 140, "h": 40 },
      { "id": "prst","type": "process", "label": "6 presets",
        "x": 840, "y": 160, "w": 140, "h": 40 },

      { "id": "svg", "type": "process", "label": "SVG output",
        "x": 20,  "y": 600, "w": 140, "h": 40 },
      { "id": "sel", "type": "process", "label": "data-ve-id atoms",
        "x": 20,  "y": 720, "w": 140, "h": 40 },

      { "id": "flw", "type": "process", "label": "flow edges",
        "x": 840, "y": 600, "w": 140, "h": 40 },
      { "id": "rev", "type": "process", "label": "scroll reveal",
        "x": 840, "y": 720, "w": 140, "h": 40 }
    ],
    "edges": [
      { "from": "core", "to": "auth", "arrow": "none", "route": "bezier" },
      { "from": "core", "to": "thm",  "arrow": "none", "route": "bezier" },
      { "from": "core", "to": "rdr",  "arrow": "none", "route": "bezier" },
      { "from": "core", "to": "anim", "arrow": "none", "route": "bezier" },

      { "from": "auth", "to": "json",  "arrow": "none", "route": "straight" },
      { "from": "auth", "to": "ascii", "arrow": "none", "route": "straight" },

      { "from": "thm",  "to": "vct",  "arrow": "none", "route": "straight" },
      { "from": "thm",  "to": "prst", "arrow": "none", "route": "straight" },

      { "from": "rdr",  "to": "svg",  "arrow": "none", "route": "straight" },
      { "from": "rdr",  "to": "sel",  "arrow": "none", "route": "straight" },

      { "from": "anim", "to": "flw",  "arrow": "none", "route": "straight" },
      { "from": "anim", "to": "rev",  "arrow": "none", "route": "straight" }
    ]
  }
  </script>
</div>
```

## Radial layout math

The engine doesn't auto-compute radial coordinates; the author
does. The formula:

For N branches off the central node at radius R:

```
angle_i = (2 * pi * i) / N   (i = 0, 1, ..., N-1)
x_i = center_x + R * cos(angle_i)
y_i = center_y + R * sin(angle_i)
```

For 4 branches at R = 280 from a center at (500, 400):

- branch 0 (right): (780, 400)
- branch 1 (down): (500, 680)
- branch 2 (left): (220, 400)
- branch 3 (up): (500, 120)

For each branch's sub-leaves, repeat with a smaller R (~120) and
center on the branch's position.

In practice, hand-place the nodes for visual clarity (the math
gives a starting point, but you fine-tune so labels don't
overlap and the diagram balances visually).

## Branch coloring

Tint each branch with a distinct `role`:

- `service` (accent)
- `client` (info)
- `data` (success)
- `infra` (warning)

The branch's color propagates to all its sub-leaves visually
(via the role-tinted fill). This gives the reader four
color-coded "zones" of the mind map; an at-a-glance "this whole
quadrant is about Y".

The center is `role: "accent"` for maximum visibility.

## Edges convention

Mind map edges are undirected (`arrow: "none"`) — they show
RELATIONSHIP, not direction. The reader's eye traces from center
outward; arrows would feel like commands.

Use `route: "bezier"` for hub-to-branch edges (organic curves
suit the radial layout). Use `route: "straight"` for
branch-to-leaf edges (more compact).

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted fills per branch quadrant |
| typography | `--vc-text-1` for branch labels, `--vc-text-0` for leaf labels |
| radius | `--vc-radius-md` for nodes |

## Selection atoms

Standard. The agent can compute the "branch quadrant" from the
node's position (sign of x-center, y-center). Useful for actions
like "expand this branch" or "hide all leaves of this branch".

## Variations

### Fishbone / Ishikawa diagram

A fishbone is a 1D variant of a mind map — central spine, ribs
branching out at angles. Used for root-cause analysis. Author
as a `free` diagram with the spine as a long edge and the ribs
as angled `process` nodes:

```json
{ "id": "spine-end", "type": "end", "label": "Problem",
  "x": 900, "y": 280, "w": 140, "h": 50, "role": "danger" },
{ "id": "spine-start", "type": "process", "label": "",
  "x": 40,  "y": 280, "w": 1, "h": 1 },

{ "id": "people",  "type": "process", "label": "People",
  "x": 160, "y": 80,  "w": 120, "h": 40, "role": "client" },
{ "id": "process", "type": "process", "label": "Process",
  "x": 320, "y": 80,  "w": 120, "h": 40, "role": "service" },
{ "id": "tools",   "type": "process", "label": "Tools",
  "x": 480, "y": 80,  "w": 120, "h": 40, "role": "infra" },

{ "id": "envir",   "type": "process", "label": "Environment",
  "x": 160, "y": 460, "w": 120, "h": 40, "role": "data" },
{ "id": "method",  "type": "process", "label": "Method",
  "x": 320, "y": 460, "w": 120, "h": 40, "role": "service" },
{ "id": "measur",  "type": "process", "label": "Measurement",
  "x": 480, "y": 460, "w": 120, "h": 40, "role": "warning" }
```

The spine is a single edge from spine-start to spine-end. Each
rib edges from its label to a point on the spine.

### Concept map (relationships labelled)

A mind map's cousin — like a mind map but with LABELLED edges
showing the kind of relationship:

- "is a kind of" (subtype)
- "has a" (composition)
- "depends on" (sequence)
- "is opposed to" (contradiction)

Use `label` on every edge. The reader can read the diagram as a
network of typed propositions.

## Anti-patterns

- 12+ main branches: cluttered radial; use a tree instead.
- All branches the same `role`: lose the color-coding benefit;
  vary by branch category.
- Sub-leaves overlapping their parent branch's neighbors:
  recompute the radial layout with more spacing.
- Mind map with directed arrows: undermines the "relationships"
  semantic; use `arrow: "none"`.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The center is visually dominant (size + accent tint).
- Branches are spaced evenly around the center (no clustering
  on one side).
- Sub-leaves of each branch are visually grouped near their
  parent branch.
- No label overlaps another label.

## Cross-skill seam

For massive mind maps (50+ nodes) or auto-layout, hand off to
Mermaid `mindmap` via `amvcp-graph-diagrams`. The trade-off:
lose theming granularity but gain auto-layout.
