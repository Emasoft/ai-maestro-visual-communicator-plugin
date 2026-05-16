# 11 — Layout: `quadrant` (2×2 phase-space)

The quadrant slide is the rhetorical 2×2 — the BCG matrix, the Eisenhower
box, the impact/effort grid. Four labelled regions arranged in a
two-by-two cross, with axes printed on the cross's edges. The audience
locates each option in its quadrant; the *position* in the matrix is the
argument.

This is the Folio "Phase Space" pattern (SL-04). It's powerful precisely
because the layout itself encodes the analysis — "which quadrant is your
proposal in?" is a question the slide answers visually.

## What this is

`layout: "quadrant"` builds a slide with:

- One required `heading` block (the matrix's name).
- One required `text` or `bullets` block per quadrant (4 total), in
  reading order: top-left, top-right, bottom-left, bottom-right.
- Optional `eyebrow` blocks for the axis labels.

The renderer applies `vsd-layout-quadrant` to the section; the layout
CSS uses a `grid-template-columns: 1fr 1fr / 1fr 1fr` cross + an axis
divider drawn via `::before` and `::after` pseudo-elements.

## Scaffold to emit

The simplest quadrant slide (text per quadrant):

```jsonc
{ "layout": "quadrant",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Impact vs effort for the Q4 backlog." },
    { "type": "text", "text": "Q1 — High impact, low effort. Per-key TTL." },
    { "type": "text", "text": "Q2 — High impact, high effort. Cross-region replication." },
    { "type": "text", "text": "Q3 — Low impact, low effort. Logging cleanup." },
    { "type": "text", "text": "Q4 — Low impact, high effort. Custom alerting DSL." }
  ]
}
```

With per-quadrant labels via eyebrow + bullets:

```jsonc
{ "layout": "quadrant",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "How we're going to spend Q4." },
    { "type": "eyebrow", "text": "↑ High Impact" },
    { "type": "eyebrow", "text": "← Low Effort" },
    { "type": "eyebrow", "text": "→ High Effort" },
    { "type": "eyebrow", "text": "↓ Low Impact" },
    { "type": "bullets", "items": ["Per-key TTL", "Cache warmup"] },
    { "type": "bullets", "items": ["Cross-region replication", "New cache layer"] },
    { "type": "bullets", "items": ["Logging cleanup"] },
    { "type": "bullets", "items": ["Custom alerting DSL"] }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path. The renderer
  doesn't have a `renderQuadrantSlide` — the CSS handles the
  2×2 placement via `:nth-child` selectors.
- `renderBlock(doc, block, ctx)` — renders each text/bullets block.

## DESIGN.md tokens used

| Token | Default | What it themes on quadrant |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Quadrant text + heading. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Axis labels (eyebrows). |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Axis cross lines, focal-quadrant highlight. |
| `--vc-color-divider` | `#e1ddd1` / `#2a2e35` | Inter-quadrant divider lines. |
| `--vc-text-2` | `28 px` | Quadrant body text. |
| `--vc-text-1` | `20 px` | Axis labels (small, in the margins). |
| `--vc-space-4` | `40 px` | Inter-quadrant padding. |

## Selection / comment / decision-mini contract notes

The quadrant slide is one selectable atom. Each quadrant is NOT a
separately commentable region — the comment-modal's natural unit is
the whole slide. A reviewer commenting on a specific quadrant says
"the top-left quadrant" in the text.

## When to use this reference

Open this ref when:

- Presenting a 2×2 matrix decision (impact/effort, urgency/importance,
  buy/build, in/out of scope).
- The talk needs to LOCATE proposals in a phase-space — "we're not
  arguing about which to do, we're arguing about which quadrant they
  belong in".
- The audience is going to ask "where does X fit?" — answer it with
  the quadrant pre-built.

## Don'ts

- Don't use a 2×2 for unrelated lists. The quadrant only works when
  the four regions share two orthogonal axes. Four bullets without a
  matrix structure is a `content` slide, not a quadrant.
- Don't pack more than 3-4 items per quadrant. The 2×2 splits the
  stage into four small panes; each pane has room for ~3 short
  bullets at projection scale.
- Don't put a chart inside one quadrant. Quadrants are text-only by
  convention; a chart wants its own slide (`data-story`).
- Don't make the axes "Pros" and "Cons" — that's a `comparison`
  layout, not a quadrant. The quadrant requires two orthogonal
  continuous axes.

## Authoring rules — axis labelling

The strongest quadrant slides label all four axis ends so the reader
doesn't have to infer:

```
            ↑ High Impact
             |
   Q1: Do    |    Q2: Plan
   first     |    quarterly
─────────────┼─────────────
   Q3: Drop  |    Q4: Negotiate
             |    away
             |
            ↓ Low Impact
   ← Low Effort      → High Effort
```

Four eyebrow blocks (`↑ High Impact`, `↓ Low Impact`, `← Low Effort`,
`→ High Effort`) plus four content blocks (one per quadrant) is the
canonical structure. The renderer places eyebrows in the margins via
CSS positioning.

## Visual verification

After authoring a quadrant slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The 2×2 grid splits the stage symmetrically.
2. The axis cross lines are visible (the centre + / × where the four
   quadrants meet).
3. Axis labels (if provided) sit in the margins (top, bottom, left,
   right of the cross), not inside the quadrants.
4. Each quadrant's content is centred within its quadrant.
5. The reading order (top-left → top-right → bottom-left → bottom-
   right) matches the JSON block order.

## Canonical 2×2 matrix examples

| Matrix name | Axes | Quadrant labels |
|---|---|---|
| Impact / Effort | High impact ↑↓ Low impact / Low effort ← → High effort | Q1: Do first / Q2: Plan / Q3: Drop / Q4: Negotiate away |
| Eisenhower | Urgent ←→ Not urgent / Important ↑↓ Not important | Do / Plan / Delegate / Drop |
| BCG (growth/share) | Growth ↑↓ / Share ←→ | Stars / Question marks / Cash cows / Dogs |
| RACI | Accountability ↑↓ / Responsibility ←→ | Owner / Doer / Informed / Consulted |
| Risk / Reward | Reward ↑↓ / Risk ←→ | High reward low risk / High reward high risk / etc. |
| User / Use-frequency | Many users ↑↓ / Frequent use ←→ | Core / Frequent / Occasional / Rare |

Each fits the `quadrant` layout's structure: 2 orthogonal axes + 4
labelled regions.

## Naming the quadrants

The clearest quadrant labels combine the axis values:

```
            ↑ High Impact
             |
   "High impact, |  "High impact,
    low effort"  |   high effort"
─────────────┼─────────────
   "Low impact,  |  "Low impact,
    low effort"  |   high effort"
             |
            ↓ Low Impact
   ← Low Effort      → High Effort
```

vs the abbreviated "Q1 / Q2 / Q3 / Q4" labels. The full-description form
is clearer for the audience; the Q-prefix form is shorter for the
author. Pick based on the deck's overall information-density.

## When NOT to use quadrant

| Situation | Pick instead |
|---|---|
| Four items without two orthogonal axes | `content` with 4 bullets |
| Two-axis matrix with 9+ items per quadrant | `bento` with `gallery` grid |
| Items with continuous positions (scatter-plot) | `data-story` with `scatter` chart |
| Hierarchical 2×2 → 4×4 zoom-in | Two slides: one 2×2 + one zoomed sub-matrix |
| Three axes (3D phase space) | (slide format doesn't support; use a real visualisation) |

## Source provenance

- SL-04 — Folio "Phase Space" pattern. The exact 2×2 grid + axis
  labels + centred cross.
- BCG matrix / Eisenhower box are the prototypical examples; both
  use the same visual model the layout encodes.
- The "label all four axis ends" convention is from the McKinsey
  slide-design playbook documented in SL-09's notes — clarity demands
  explicit axis labels at projection distance.
