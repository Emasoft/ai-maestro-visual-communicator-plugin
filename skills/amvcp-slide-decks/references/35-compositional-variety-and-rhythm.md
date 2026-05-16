# 35 — Compositional variety + deck pacing rhythm

Three consecutive slides with the same spatial composition feel
identical even when the content is different. The fix is layout
variety — alternate centred slides with off-axis slides, dense
slides with sparse slides, full-bleed moments with content slides.

This reference is the deck-level rhythm discipline: how to plan a
sequence so the audience stays awake.

## What this is

Six canonical spatial compositions a slide can take:

| Composition | Layouts that produce it |
|---|---|
| Centred | `manifesto`, `statement`, `quote`, `closing`, `section-divider` |
| Left-heavy | `content` (default 3fr/2fr) |
| Right-heavy | `two-column` (with image on the left → text shifts right) |
| Edge-aligned | `full-bleed` (text at bottom or top edge) |
| Split | `comparison`, `two-column`, `bento` + `split` |
| Full-bleed | `full-bleed`, `bento` + `full` |

The rule: consecutive slides should NOT share a composition. Three
centred slides in a row reads as the same slide three times. Three
left-heavy content slides feels like a bullet-point waterfall.

## What this is NOT

The rule is NOT "use every layout once". A deck of 12 different
layouts is overdesigned. The rule is "don't repeat the same
composition back-to-back".

## Scaffold to emit

A well-paced 12-slide deck:

| # | Layout | Composition |
|---|---|---|
| 01 | `manifesto` | Centred |
| 02 | `section-divider` (01) | Centred |
| 03 | `content` | Left-heavy |
| 04 | `metrics` | Split (horizontal row) |
| 05 | `content` | Left-heavy |
| 06 | `data-story` | Centred (chart) |
| 07 | `section-divider` (02) | Centred |
| 08 | `comparison` | Split (left vs right) |
| 09 | `code-focus` | Centred |
| 10 | `content` | Left-heavy |
| 11 | `full-bleed` | Full-bleed |
| 12 | `closing` | Centred |

The composition column shows the variety: never three centred in a
row, never three left-heavy in a row.

A poorly-paced 12-slide deck (every slide is content):

| # | Layout | Composition |
|---|---|---|
| 01 | `content` | Left-heavy |
| 02 | `content` | Left-heavy |
| 03 | `content` | Left-heavy |
| 04 | `content` | Left-heavy |
| ... | ... | ... |

This is the "bullet-point waterfall" — 12 slides of the same shape
with different words. The audience tunes out by slide 5.

## Pacing rules

### Rule 1: Vary the composition

After two slides of the same composition, the third MUST be
different. The varied slide can be:

- A divider (between sections)
- A statement (a pivot)
- A chart (a finding)
- A quote (a different voice)
- A full-bleed (an emotional anchor)

### Rule 2: Pair dense with sparse

A dense slide (6 bullets, lots of text) should be followed by a
sparse one (a quote, a statement, a single metric). The eye needs
to REST between dense slides.

| Dense slide | Sparse follow-up |
|---|---|
| `content` with 6 bullets | `metrics` row of 3-4 KPIs |
| `bento` with 6 cards | `statement` or `quote` |
| `data-story` with packed chart | `text`-only slide or `manifesto` |
| `code-focus` with 10 lines | `callout` slide or `closing` |

### Rule 3: Anchor with dividers

Every section (3+ slides on the same topic) gets a `section-divider`
before its first content slide. The divider is the rhythm beat;
without it the audience loses the deck's structure.

A 12-slide deck typically has 2-4 dividers (one per Act / chapter).

### Rule 4: Open and close with anchors

The first slide is ALWAYS `manifesto` (anchors what the talk argues).
The last slide is ALWAYS `closing` (lands what the talk argued).
Skipping either makes the deck feel abandoned at the start or end.

### Rule 5: Reserve full-bleed for the moment

A `full-bleed` slide is the talk's emotional centre. Use it ONCE
per ~10 slides (a 12-slide deck has 0-2 full-bleeds; a 30-slide
deck has 1-4). Two full-bleeds in a row dilutes BOTH of them.

## Lib functions called

None — composition planning is the agent's pre-render
responsibility. The renderer doesn't track composition; it just
renders what it's given.

## When to use this reference

Open this ref when:

- Planning the layout sequence for a new deck.
- A deck feels monotonous in review — apply the variation table.
- A reviewer says "this drags" — usually a pacing issue (dense
  without sparse, or too many of the same composition).

## Pacing-test workflow

After writing the JSON, generate a pacing table:

```js
const pacing = deck.slides.map((s, i) => ({
  num: i + 1,
  layout: s.layout,
  composition: COMPOSITION_MAP[s.layout]   // see table above
}));
```

Walk the array; check for runs of identical compositions. Any run
of 3+ is a pacing bug — change one slide's layout.

For each section (slides between dividers), check the dense /
sparse alternation. Two dense slides in a row → insert a sparse
slide between (a `statement` or a `metrics` row).

## Don'ts

- Don't pick layouts to "look varied" without considering content
  job. The layout SERVES the content; "varying for variety" leads
  to confusing slides.
- Don't insert filler slides for rhythm. If a slide doesn't have
  content, don't add it. Fix the pacing by reordering or merging,
  not by padding.
- Don't break the open/close anchor rule. A deck that opens
  without a `manifesto` feels in-progress; one that ends without
  a `closing` feels abandoned.
- Don't repeat `full-bleed` slides for "visual punch". The
  full-bleed's punch comes from rarity; back-to-back full-bleeds
  dilute both.

## Composition table (canonical map)

| Layout | Default composition |
|---|---|
| `manifesto` | Centred |
| `section-divider` | Centred (numeral background) |
| `statement` | Centred |
| `content` | Left-heavy (3fr/2fr default) |
| `two-column` | Split (2fr/2fr default) — composition varies by block order |
| `comparison` | Split (1fr/1fr) |
| `quadrant` | Cross-split (2×2) |
| `data-story` | Stacked (heading + chart + annotation) |
| `metrics` | Horizontal row |
| `timeline` | Horizontal row |
| `bento` | Mixed grid (varies by `grid` value) |
| `stack` | Vertical stack (single column) |
| `full-bleed` | Full-bleed (image dominates) |
| `quote` | Centred |
| `code-focus` | Centred |
| `closing` | Centred |

## Visual verification

After authoring a deck, validate pacing:

1. List the layouts in order: `deck.slides.map(s => s.layout)`.
2. Map each to its composition (table above).
3. Look for runs of identical compositions ≥ 3 — these are pacing
   bugs.
4. Walk the deck in the browser; check dense/sparse alternation by
   eye.
5. If review feels monotonous, re-order or swap layouts.

Capture the deck end-to-end at 1280×720 via
`skills/amvcp-self-debug-rules/SKILL.md` and step through it as a
fresh reader.

## Source provenance

- The 6-composition list is from `slide-patterns.md` lines
  1178-1190 ("Compositional Variety").
- The "vary across the sequence" rule is the converged
  compositional discipline from SL-04 + SL-13.
- The dense/sparse alternation rule is from SL-09's "narrative
  pacing" guidance.
- The open/close anchor rule (`manifesto` + `closing`) is the
  Folio 3-act-structure pattern (SL-10's content-template
  "Narrative Arc").
