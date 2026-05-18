# 16 — The 7 bento grid templates (`hero` / `gallery` / `asymmetric` / `feature` / `stats` / `split` / `full`)

## Table of Contents

- [What this is](#what-this-is)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

The `layout: "bento"` slide picks ONE of 7 named grid templates via the
`grid` field. Each template has a specific shape, a specific card
cardinality, and a specific best-use case. This reference is the deep
spec of each template.

## What this is

A bento grid template is a CSS Grid (or Flexbox) arrangement that the
layout CSS targets via the `data-vsd-grid="${grid}"` attribute the
renderer stamps. The renderer doesn't know the shape of each grid —
the CSS handles placement via `:nth-child` selectors and
`grid-template-areas`.

The 7 grids:

### 1. `hero` — 1 big + 4 small

```
+----------------+--------+--------+
|                |        |        |
|     CARD 1     | CARD 2 | CARD 3 |
|    (hero)      |        |        |
|                +--------+--------+
|                |        |        |
|                | CARD 4 | CARD 5 |
+----------------+--------+--------+
```

Best for: one feature card + 4 supporting cards. The hero pulls the eye
first; the four supporting cards tile around it.

```css
[data-vsd-grid="hero"] {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
[data-vsd-grid="hero"] > :nth-child(1) { grid-row: 1 / 3; }
```

### 2. `gallery` — 6-9 equal cells

```
+--------+--------+--------+
| CARD 1 | CARD 2 | CARD 3 |
+--------+--------+--------+
| CARD 4 | CARD 5 | CARD 6 |
+--------+--------+--------+
```

Best for: homogeneous lists (team grids, logo walls, before/after
gallery, comparison of N options at equal weight).

```css
[data-vsd-grid="gallery"] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
}
```

### 3. `asymmetric` — 2 big + 3 small

```
+---------+---------+--------+
|         |         |        |
| CARD 1  | CARD 2  | CARD 3 |
| (big)   | (big)   |        |
|         |         +--------+
|         |         | CARD 4 |
|         |         +--------+
|         |         | CARD 5 |
+---------+---------+--------+
```

Best for: 2 main findings + 3 supporting metrics/callouts.

```css
[data-vsd-grid="asymmetric"] {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}
[data-vsd-grid="asymmetric"] > :nth-child(1),
[data-vsd-grid="asymmetric"] > :nth-child(2) { grid-row: 1 / 4; }
```

### 4. `feature` — 1 wide + 4 narrow

```
+-----------------------------+
|                             |
|         CARD 1 (wide)       |
|                             |
+--------+--------+-----------+
|        |        |           |
| CARD 2 | CARD 3 |  CARD 4   |
|        |        |           |
+--------+--------+-----------+
```

Best for: one feature announcement + 3-4 supporting details.

```css
[data-vsd-grid="feature"] {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 2fr 1fr;
}
[data-vsd-grid="feature"] > :nth-child(1) { grid-column: 1 / -1; }
```

### 5. `stats` — 4 equal columns

```
+--------+--------+--------+--------+
|        |        |        |        |
| CARD 1 | CARD 2 | CARD 3 | CARD 4 |
|        |        |        |        |
+--------+--------+--------+--------+
```

Best for: row of 4 KPI metrics. Indistinguishable from `layout:
"metrics"` for this shape — pick `metrics` if all 4 are `metric`
blocks; pick `bento` + `grid: "stats"` if 1+ is a different type
(callout, image).

```css
[data-vsd-grid="stats"] {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
```

### 6. `split` — 50/50

```
+----------------+----------------+
|                |                |
|     CARD 1     |     CARD 2     |
|                |                |
+----------------+----------------+
```

Best for: one big metric + one big image; or one big chart + one big
callout. Functionally identical to `two-column` for two blocks — pick
`bento` + `split` if the two halves are heterogeneous *cards* (visible
surface), pick `two-column` if they're content blocks (no card chrome).

```css
[data-vsd-grid="split"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

### 7. `full` — single full-bleed card

```
+----------------------------------+
|                                  |
|                                  |
|            CARD 1                |
|         (full-bleed)             |
|                                  |
|                                  |
+----------------------------------+
```

Special case: one card that fills the entire grid area. Used for an
image-as-card or a single hero callout. Indistinguishable from
`layout: "full-bleed"` — pick `full-bleed` for an image dominant
slide; pick `bento` + `grid: "full"` if the slide needs the bento
visual frame (card chrome, padding) preserved.

```css
[data-vsd-grid="full"] {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}
```

## DESIGN.md tokens used

All 7 grids share the same token contract documented in ref #15.
What differs per grid is the visual rhythm — `hero` and `feature`
emphasise one card; `gallery` and `stats` emphasise uniformity;
`asymmetric` adds spatial tension.

## When to use this reference

Open this ref when:

- Picking a `grid` value for a `layout: "bento"` slide.
- A bento composition doesn't look right — re-read the grid's shape
  table; pick a different one.
- Deciding between bento and a non-bento layout — the comparisons in
  `stats` / `split` / `full` notes above explain when to pick which.

## Don'ts

- Don't author bespoke grid CSS for a one-off bento. The 7 templates
  are the closed set; if none fits, the slide isn't a bento — pick
  a different layout.
- Don't pack a `gallery` grid with 12+ cards. The 6-9 range is the
  template's design budget; past 9 the grid wraps in unpredictable
  ways across viewports.
- Don't use `hero` with the hero card in position 2+. The CSS
  hard-codes position 1 as the hero (`:nth-child(1)`); reordering
  breaks the composition.

## Visual verification

After authoring a bento slide with a specific `grid`, verify the
shape matches the diagram above:

1. The first non-heading block lands in the position the diagram
   shows.
2. Cards span the columns/rows shown in the diagram.
3. On a 480×800 viewport (`fit: responsive`), the grid collapses to
   a single column with cards in declared order.

Capture light + dark at 1280×720 via
`skills/amvcp-self-debug-rules/SKILL.md`.

## Source provenance

- SL-07's 7 named bento grids (Hero, Gallery, Asymmetric, Feature,
  Stats, Split, Full) lifted verbatim — the names are the literal
  enum values in `BENTO_GRIDS`.
- The CSS placement strategies (`:nth-child` + `grid-row` /
  `grid-column` overrides) are the converged pattern from the
  SVG-bento-slide project (P2-SL01 in the original triage).
