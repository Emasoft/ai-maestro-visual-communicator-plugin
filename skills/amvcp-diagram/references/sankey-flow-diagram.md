# Sankey flow diagram

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold](#scaffold)
- [Encoding magnitude in band width](#encoding-magnitude-in-band-width)
- [Coloring bands by source](#coloring-bands-by-source)
- [Conservation check (the integrity rule)](#conservation-check-the-integrity-rule)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)
- [Cross-skill seam](#cross-skill-seam)

A diagram of FLOWS where the width of each link represents the
**magnitude** of what's flowing — energy distribution, budget
allocation, user funnel, traffic split. Lifted from the
visualizing-triage backlog. The width of the band carries
quantitative information; the topology carries the structural
information.

## When to choose this pattern

Use a Sankey when:

- You are showing **how a quantity is divided and re-divided** as
  it flows through stages.
- The reader needs to see the **proportions** at a glance — a
  thicker band = a bigger share.
- The flow has 2-4 stages and 3-8 components per stage.

Do NOT use this pattern when:

- The quantities don't conserve (a Sankey assumes the inputs
  equal the outputs at each junction; if not, the diagram lies).
- You only have one stage (use a stacked bar chart via
  `amvcp-chart`).
- The branches don't share a common scale (it's a network, not a
  flow).

## Scaffold

A Sankey is best authored as a `free`-preset diagram with hand-
calculated band widths. The engine does not auto-compute Sankey
geometries (yet).

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 480,
    "background": "plain",
    "groups": [
      { "id": "src",  "label": "Source",     "x": 40,  "y": 20,  "w": 200, "h": 440 },
      { "id": "mid",  "label": "Routing",    "x": 480, "y": 20,  "w": 240, "h": 440 },
      { "id": "out",  "label": "Outcome",    "x": 960, "y": 20,  "w": 200, "h": 440 }
    ],
    "nodes": [
      { "id": "traffic", "type": "process", "label": "1000 visitors",
        "role": "service", "x": 40, "y": 200, "w": 200, "h": 80 },

      { "id": "bot",  "type": "process", "label": "Bots (40%)",
        "role": "infra",   "x": 480, "y": 40,  "w": 240, "h": 50 },
      { "id": "ret",  "type": "process", "label": "Returning (35%)",
        "role": "data",    "x": 480, "y": 200, "w": 240, "h": 80 },
      { "id": "new",  "type": "process", "label": "New (25%)",
        "role": "accent",  "x": 480, "y": 380, "w": 240, "h": 60 },

      { "id": "buy",  "type": "process", "label": "Purchased",
        "role": "data",    "x": 960, "y": 40,  "w": 200, "h": 30 },
      { "id": "leave","type": "process", "label": "Bounced",
        "role": "infra",   "x": 960, "y": 200, "w": 200, "h": 80 },
      { "id": "subs", "type": "process", "label": "Subscribed",
        "role": "service", "x": 960, "y": 380, "w": 200, "h": 60 }
    ],
    "edges": [
      { "from": "traffic", "to": "bot",  "label": "40%", "style": "solid" },
      { "from": "traffic", "to": "ret",  "label": "35%", "style": "solid" },
      { "from": "traffic", "to": "new",  "label": "25%", "style": "solid" },

      { "from": "bot",     "to": "leave", "label": "100% of bot" },
      { "from": "ret",     "to": "buy",   "label": "30%" },
      { "from": "ret",     "to": "subs",  "label": "20%" },
      { "from": "ret",     "to": "leave", "label": "50%" },
      { "from": "new",     "to": "buy",   "label": "8%" },
      { "from": "new",     "to": "subs",  "label": "12%" },
      { "from": "new",     "to": "leave", "label": "80%" }
    ]
  }
  </script>
</div>
```

## Encoding magnitude in band width

The native engine renders all edges at the same stroke-width
(1.5px), so the "Sankey band" effect requires per-edge
`strokeWidth` overrides:

```json
{ "from": "traffic", "to": "bot",
  "label": "40%",
  "strokeWidth": 32 }   // 40% of total flow -> 32px wide
```

Calculate widths so the largest band is ~40px and others scale
proportionally. The engine respects per-edge `strokeWidth`
overrides (planned for the next API rev; for now, use a post-
render hook to set `<path stroke-width>` directly).

When the calculation matters but the engine doesn't yet support
explicit widths, fall back to using `style` semantics:

- 30%+ = solid bold edge (`style: "solid"`, default).
- 15-30% = solid normal edge.
- <15% = dashed (`style: "dashed"`).

Crude but readable.

## Coloring bands by source

Convention: tint each outgoing band with the source's role color:

- `traffic -> bot` = service-tinted (source role)
- `bot -> leave` = infra-tinted (source role)

This way the reader can trace a band's origin by its color. The
engine respects `stroke` override per edge.

## Conservation check (the integrity rule)

A Sankey MUST conserve flow:

- Inputs to a node = outputs from a node.
- All percentages on outgoing edges from one node sum to 100%.

If they don't, your diagram lies. The engine doesn't enforce this
— it's the author's responsibility. Build a small validator that
walks the scene's edges and checks each node's in/out balance;
output a warning if it doesn't match within 1% tolerance (account
for rounding).

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted node fills, edge strokes inherit source role |
| typography | `--vc-text-1` for node labels, `--vc-text-0` for edge labels (percentages) |

## Selection atoms

Standard `diagram-node` / `diagram-edge`. The edge payload
includes the magnitude:

```json
{ "sceneId": 36, "kind": "edge",
  "edgeFrom": "ret", "edgeTo": "buy",
  "label": "30%",
  "magnitude": 30 }
```

## Variations

### Multi-stage Sankey

The 3-column example above is the minimum. Add a 4th stage by
adding another group and a row of nodes; flow naturally fans out
further.

### Bidirectional Sankey (no — that's a network)

Sankeys are STRICTLY left-to-right (or top-to-bottom) flows.
Bidirectional flows mean the topology has loops, which violates
the conservation assumption. Use a graph visualization
(`amvcp-graph-diagrams`) instead.

### Tornado / inverted Sankey

For showing INVERSE proportions ("of the 80% that bounced, what
were they?"), invert the columns:

| In | Out (the 80% that bounced) |
|---|---|
| New (80% bounced) | 80% |
| Returning (50% bounced) | 50% |
| Bots (100% bounced) | 100% |

A different flow direction; same Sankey discipline.

## Anti-patterns

- Bands that don't conserve: misleading. Always validate.
- Too many bands per junction (8+): becomes spaghetti. Group
  similar bands ("Others (12 sources, 8%)") and split into
  multiple diagrams.
- Color coding by destination instead of source: confuses the
  reader. Source-color is conventional.
- Tiny bands (<2%) drawn at minimum width: they distort the
  reader's perception. Either omit them, group them as "Other",
  or annotate them with text labels.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Band widths are visibly proportional (the eye can see "this
  band is twice as wide as that one").
- Source colors propagate through the bands (a band leaving a
  service-tinted node stays service-colored).
- Junction nodes show clear in/out structure (no overlapping
  bands).

## Cross-skill seam

Sankeys are arguably also a CHART. For data with a true Sankey
shape and complex topology, the `amvcp-chart` skill should host a
proper Sankey renderer (using a charting library that computes
band widths automatically). This skill's coverage here is for
**diagrammatic** Sankeys — small flows where the manual band-
width approach is acceptable.
