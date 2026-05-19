# Phase-graph preset

## Table of Contents

- [When to choose this preset](#when-to-choose-this-preset)
- [Scaffold and card geometry](#scaffold-and-card-geometry)
- [Auto-placement, chain-highlight, and cycles](#auto-placement-chain-highlight-and-cycles)
- [DESIGN.md tokens consumed and selection atoms](#designmd-tokens-consumed-and-selection-atoms)
- [Theming patterns and anti-patterns](#theming-patterns-and-anti-patterns)
- [Composing with other patterns and visual verification](#composing-with-other-patterns-and-visual-verification)

The `phase-graph` preset draws a **plan with dependencies** — large
`card` nodes carrying a heading + a single line of detail
(duration, owner, status), connected by bezier dependency edges.
The killer interaction: **click a card and the runtime highlights
its full transitive dependency chain**, dimming everything else.

## When to choose this preset

Use `phase-graph` when:

- You are showing a **plan, roadmap, or dependency graph** where
  the reader needs to ask "what does THIS phase depend on?" and
  see the answer at a glance.
- Each node is a chunk of work big enough to deserve a card (not a
  thin step in a pipeline). A card typically holds title +
  duration + owner.
- You want the visualization to be **navigable** — clicking
  surfaces the dependency chain rather than just selecting one
  node.

Do NOT use `phase-graph` when:

- The dependencies form a tight cycle that should be shown as a
  loop (use `dependency-chain-highlight.md` notes on cycle handling
  or hand off to `amvcp-graph-diagrams` Graphviz).
- Plain time-on-axis Gantt bars are clearer (use
  `gantt-style-bars.md` — that pattern uses the `free` preset).
- The graph has 30+ nodes (the cards become tiny; switch to
  Graphviz with auto-layout).

## Scaffold and card geometry

The basic scaffold:

```html
<div class="ve-scene-graph" data-ve-scene-preset="phase-graph">
  <script type="application/json">
  {
    "version": 1,
    "preset": "phase-graph",
    "width": 1280,
    "height": 720,
    "nodes": [
      { "id": "discover",  "type": "card", "label": "Discovery",
        "detail": "2 weeks — research",        "role": "accent" },
      { "id": "design",    "type": "card", "label": "Design",
        "detail": "3 weeks — figma + DESIGN.md" },
      { "id": "scaffold",  "type": "card", "label": "Scaffold",
        "detail": "1 week — repo + CI",        "role": "infra" },
      { "id": "implement", "type": "card", "label": "Implement",
        "detail": "6 weeks — features",        "role": "service" },
      { "id": "test",      "type": "card", "label": "Test",
        "detail": "2 weeks — fixtures + dev-browser", "role": "service" },
      { "id": "doc",       "type": "card", "label": "Document",
        "detail": "1 week — README + handoff" },
      { "id": "release",   "type": "card", "label": "Release",
        "detail": "1 week — package + publish", "role": "data" }
    ],
    "edges": [
      { "from": "discover",  "to": "design" },
      { "from": "design",    "to": "scaffold" },
      { "from": "design",    "to": "implement" },
      { "from": "scaffold",  "to": "implement" },
      { "from": "implement", "to": "test" },
      { "from": "implement", "to": "doc" },
      { "from": "test",      "to": "release" },
      { "from": "doc",       "to": "release" }
    ]
  }
  </script>
</div>
```

A `card` node defaults to 200 x 120 — big enough to hold:

- One title line (the `label`, in `--vc-text-2`).
- One detail line (`detail`, in `--vc-text-1 --vc-color-content-muted`).

If you need more room (a third line, a status pill), increase the
card's `w` and `h` in the JSON; the engine respects them. Cards
smaller than 160 x 80 look cramped; cards bigger than 320 x 180
push the layout sideways and turn the diagram into a wall.

## Auto-placement, chain-highlight, and cycles

`phase-graph` uses **longest-path layering**: each node is assigned
a rank = length of the longest dependency path ending at that node.
Rank 0 = root nodes (no incoming edges); rank N = nodes with at
least one ancestor at rank N-1.

The engine then places columns by rank (one column per rank) and
distributes the nodes of each rank vertically with even spacing.
This gives:

- Roots on the left.
- Sinks (no outgoing edges) on the right.
- Maximum visual distance between a node and its deepest ancestor.

If the graph contains a cycle the engine falls back to the standard
auto-place (a row layout) and emits a console warning — phase
graphs are DAGs by intent.

**Chain-highlight interaction.** When the user clicks a card:

1. The engine walks every outgoing edge from the clicked node,
   collecting nodes reachable via `from -> to` transitive closure.
2. It also walks every incoming edge (ancestors).
3. The clicked node and every reached node get a
   `data-ve-chain-active="1"` attribute; the rest get
   `data-ve-chain-active="0"`.
4. CSS dims the inactive nodes (`opacity: 0.35`) and brightens the
   active chain (`opacity: 1.0` + a slight stroke bump).
5. A **second click** on any node clears the chain (everything
   returns to `opacity: 1.0`).
6. Clicking another node starts a fresh chain.

The CSS is in the module's injected stylesheet — no per-page work
needed. The chain state is purely a DOM attribute, so it survives
zoom, copy-paste of HTML, and is observable by accessibility tools.

**Edge styling under chain mode.** When a chain is active:

- Edges **fully inside the chain** (both ends `data-ve-chain-active=
  "1"`) are drawn at full stroke.
- Edges with **one end outside** are drawn dimmed (matching the
  node opacity).
- Edges with **both ends outside** are dimmed.

This makes the active chain *literally pop* — the eye follows the
brightest path.

**Cycles.** A `phase-graph` should be a DAG (directed acyclic graph).
If you accidentally introduce a cycle (`a -> b -> c -> a`), the engine:

1. Detects the cycle during longest-path layering.
2. Falls back to ranking via DFS (no longest-path guarantee).
3. Console-warns: `phase-graph: cycle detected involving <ids>`.
4. The chain-highlight still works — but click-to-highlight on a
   node in a cycle will highlight ALL nodes in the cycle (because
   they are all mutually reachable).

If the cycle is intentional, switch presets — `free` with explicit
coordinates, or `amvcp-graph-diagrams` Graphviz `circo` engine.

## DESIGN.md tokens consumed and selection atoms

The preset consumes these token groups:

| Token group | Specifics |
|---|---|
| color | card fills (role-tinted), card stroke, edge stroke, dimmed-state alpha |
| typography | `--vc-font-body`, `--vc-text-2` title + `--vc-text-1` detail |
| radius | `--vc-radius-lg` for cards (cards are bigger than nodes; bigger radius reads better) |

Standard `diagram-node` / `diagram-edge` atoms. `data-ve-data` on a
card carries the extra fields the chain logic depends on:

```json
{ "sceneId": 7, "kind": "node",
  "nodeId": "design", "nodeType": "card",
  "label": "Design",
  "detail": "3 weeks — figma + DESIGN.md",
  "ancestorCount": 1, "descendantCount": 4,
  "rank": 1 }
```

`ancestorCount` and `descendantCount` are pre-computed during
auto-placement; an agent that surfaces "this phase depends on X,
blocks Y" can read them from the click payload without re-walking
the graph.

## Theming patterns and anti-patterns

**Theming patterns:**

- `default` theme — brand palette, cards in surface fill with role
  tints.
- `dark` theme — cards on near-black with bright accents; works
  beautifully for portfolio/marketing decks.
- `blueprint` — cards as engineering tickets on a cyan-on-navy
  background; pair with `background: "grid"`.

The `terminal` and `hand-drawn` presets work too but feel
inappropriate for a serious plan; pick them only when the diagram
is itself a stylistic statement (a retro CRT redesign brief,
a hand-drawn "Phase 0: napkin sketch").

**Anti-patterns:**

- Cards stuffed with paragraphs of text: the card is a teaser, not
  a brief. The full content lives in a side-panel that opens on
  click (see `click-step-detail-panel.md`).
- Dependency chains spanning 8+ ranks: the diagram becomes a long
  thin strip. Re-group: collapse the longest chain into a
  sub-phase shown as a separate diagram.
- One root with 12 leaf children and nothing else: that is a
  star, not a phase graph. Use a mind map (`mind-map-radial.md`).
- Decoration nodes that no edge touches: pollute the layout and
  produce confused click responses. Either delete them or move
  them to a separate `groups` callout.

## Composing with other patterns and visual verification

- A `phase-graph` followed by a **detail panel** (per
  `click-step-detail-panel.md`) is the canonical pattern for an
  interactive roadmap. The phase graph is the index; the detail
  panel is the page.
- Pair with `numbered-flow-scroll-reveal.md` when you want both a
  high-level dependency view AND a step-by-step walkthrough.
- A `phase-graph` can carry a `groups` array too — group cards
  into swimlanes (one row per owner / team) using horizontal
  group rects; cards stay in their swimlane vertically while the
  edges still cross.

**Visual verification.** Per `skills/amvcp-self-debug-rules/SKILL.md`:
dev-browser screenshot light + dark, plus a third screenshot AFTER
clicking one of the middle cards (verify the chain highlight visibly
works and the dimmed nodes are readable but clearly dimmed). The
post-click screenshot is the bug-catching one — chain logic breaks
silently if a CSS rule shadows the opacity transition.
