# Multi-column body layout — CSS Columns with widows / orphans

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [When to choose multi-column](#when-to-choose-multi-column)
- [Why `column-width` AND `column-count`](#why-column-width-and-column-count)
- [The widow/orphan tuning](#the-widoworphan-tuning)
- [Heading fragmentation](#heading-fragmentation)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Browser support](#browser-support)
- [A heading that spans all columns](#a-heading-that-spans-all-columns)
- [When the multi-column collapses to 1](#when-the-multi-column-collapses-to-1)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to use multi-column](#when-not-to-use-multi-column)
- [Forbidden — fixed-height multi-columns](#forbidden--fixed-height-multi-columns)
- [Cross-references](#cross-references)

Some deliverables (long-form prose reports, magazine-style features,
slide-deck body slides) read better as **multi-column** body text
rather than a single-column page. CSS Columns (`column-count`,
`column-width`) is the right tool — pure CSS, no JS, automatic
balancing.

This reference describes the `.vc-type-multicol` utility — a typography
opt-in that turns body text into a magazine-style 2-or-3-column
layout, with widow / orphan controls so paragraphs don't break
ugly across column boundaries.

## What it is

CSS Columns let the browser flow text into N columns automatically,
maintaining vertical balance. Two declarations control it:

- `column-count: N` — exactly N columns, regardless of width.
- `column-width: Wem` — as many columns as fit at W width each.

Both can combine (`columns: 30ch 3` — at most 3 columns, each at
least 30ch wide; below that the browser auto-collapses).

Two further declarations control breaking:

- `column-rule: 1px solid currentColor` — a thin separator between
  columns.
- `column-gap: 2em` — horizontal spacing between columns.

Two declarations control paragraph fragmentation:

- `widows: N` — a paragraph never leaves fewer than N lines at the
  bottom of a column (preventing a single line being orphaned at the
  bottom).
- `orphans: N` — a paragraph never leaves fewer than N lines at the
  top of a column (preventing a single line stranded at the top of
  the next column).

The CSS Columns layout was designed for *paged media* (print) — the
widows/orphans controls assume the content can flow into a paginated
view. They also work in screen-based CSS Columns, with one caveat:
they only fire when the column has enough content to actually fragment.

## The contract

```css
.vc-type-multicol {
  /* 2 columns at most, each at least 30ch wide. Below 60ch viewport
     width the layout collapses to 1 column automatically. */
  column-count: 2;
  column-width: 30ch;
  column-gap: 2em;
  /* Thin hairline separator using currentColor (themes correctly). */
  column-rule: 1px solid color-mix(in srgb, currentColor 20%, transparent);
}

.vc-type-multicol p,
.vc-type-multicol li,
.vc-type-multicol blockquote {
  /* Never leave a paragraph orphan/widow at column boundaries. */
  widows: 2;
  orphans: 2;
  /* A heading inside a multi-column should NEVER break across a
     column boundary. Force a column break BEFORE it if it would
     otherwise straddle. */
}

.vc-type-multicol h1,
.vc-type-multicol h2,
.vc-type-multicol h3,
.vc-type-multicol h4 {
  /* Don't break inside a heading. */
  break-inside: avoid;
  /* Don't leave a heading at the bottom of a column with its
     paragraph starting in the next column. */
  break-after: avoid;
}

/* For a 3-column variant. */
.vc-type-multicol-3 {
  column-count: 3;
  column-width: 24ch;
  column-gap: 1.5em;
  column-rule: 1px solid color-mix(in srgb, currentColor 20%, transparent);
}
```

## Scaffold

```html
<!-- 2-column body for an editorial report -->
<section class="vc-type-multicol">
  <p>The first body paragraph flows into column one, wraps to the
     bottom of column one, then the second paragraph continues into
     column two without breaking awkwardly.</p>
  <p>The column balance is automatic — the browser splits content so
     both columns end roughly at the same vertical position.</p>
  <p>Headings inside the multi-column never break across the column
     gap — they sit cleanly at the top of one column or the other.</p>
</section>

<!-- 3-column for a magazine-style feature -->
<section class="vc-type-multicol-3">
  <p>Three columns of body text — most useful at viewport widths
     ≥1100 px (a slide-deck body slide, a desktop report).</p>
  <p>Each column is ~24 characters wide — narrower than the optimal
     measure, but for magazine reading the visual rhythm wins.</p>
</section>
```

## Tokens consumed / extended

- **Consumes:** nothing — the utility is a pure CSS rule with no
  token dependency.
- **Extends:** nothing.

The `column-rule` uses `currentColor` mixed at 20% with transparent,
so the hairline picks up the inherited text colour — themed
correctly in light and dark.

## When to choose multi-column

| Deliverable | Use multi-column? |
|---|---|
| Long-form editorial article (≥1500 words) | YES — magazine 2-column. |
| Technical report with mixed prose + tables + code | NO — single column. Tables and code don't fragment well across columns. |
| Slide-deck body slide (text-heavy) | YES — 2-column. |
| Dashboard | NO — dashboards use grid, not column-flow. |
| Status page | NO — status pages use cards, not flowed text. |
| Postmortem / incident report | NO — chronological structure breaks column flow. |
| Prose page on a technical concept | OPTIONAL — 2-column if very long, single-column otherwise. |

The rule of thumb: multi-column is for *prose that flows continuously*.
The moment the content has *structural breaks* (figures, tables,
code, sidebars, callouts) the column flow gets jagged and the
reader's eye loses the column-boundary rhythm.

## Why `column-width` AND `column-count`

The `columns: <width> <count>` shorthand specifies BOTH a width and
a count. Both together produce the right responsive behaviour:

- At wide viewports → renders N columns each at least `width` wide.
- At narrow viewports → collapses to fewer columns rather than
  shrinking the per-column width below `width`.
- At very narrow viewports → collapses to 1 column.

This is the "fluid responsive" behaviour. Setting only `column-count`
(without `column-width`) makes the columns shrink indefinitely on
narrow viewports — illegible. Setting only `column-width` (without
`column-count`) makes the layout grow unboundedly on wide viewports
— too many columns to track.

## The widow/orphan tuning

`widows: 2` is the editorial minimum — never leave a 1-line widow at
the bottom of a column. Some heavy typesetting books recommend `3`
or even `4` for novels. For AMVCP, `2` is the right balance:

- `2` prevents the worst-case eye-sore (a 1-word last line).
- `3` would force the browser to push more paragraphs forward,
  occasionally producing visible *gaps* at column bottoms in
  short-paragraph prose.
- `4`+ is for paged-media typography only.

`orphans: 2` symmetric — never leave a 1-line orphan at the top of a
column.

## Heading fragmentation

Headings inside a multi-column have two constraints:

1. `break-inside: avoid` — a heading must not split across a column
   boundary. (A 2-line heading would otherwise become "first line at
   bottom of column 1, second line at top of column 2".)
2. `break-after: avoid` — if a heading lands at the bottom of column 1
   and its following paragraph starts in column 2, the reader has to
   eye-track across the column gap. The heading should push to the
   top of column 2 along with its paragraph.

These two together produce magazine-grade heading behaviour — every
heading sits at the top of its column with its paragraph below it.

## Light + dark — fully covered

The contract sets only layout properties (column count / width /
gap) and a single `column-rule` using `currentColor` for the colour.
Themed correctly: light-theme text colour produces a light hairline;
dark-theme text colour produces a dark hairline.

NO hardcoded colour. NO theme-specific overrides needed.

## Browser support

- `column-count`, `column-width`, `column-gap`, `column-rule` —
  universal (since ~2017).
- `widows`, `orphans` — universal IN paged media; partial in screen
  CSS Columns (Chrome works, Safari works, Firefox is recent).
- `break-inside`, `break-after`, `break-before` — universal.
- `column-span: all` (a heading spans every column) — universal.

Fail-soft: a browser that ignores `widows` produces slightly worse
fragmentation but still renders. The page is correct in every
browser the runtime supports.

## A heading that spans all columns

Sometimes a section heading should span the *full width* of the
multi-column, with the columns starting BELOW it:

```css
.vc-type-multicol h1,
.vc-type-multicol h2 {
  column-span: all;
}
```

This is the magazine convention — section H1 sits across the page
width, then body flows into columns below. The typography skill's
`.vc-type-multicol` utility ships this by default for h1 and h2 (h3
and below stay column-internal).

## When the multi-column collapses to 1

When the viewport is narrower than `2 × column-width + column-gap`
(typically ~62ch ≈ 500 px), the layout auto-collapses to 1 column.
The transition is smooth — no media query needed.

At 1 column the text is *no longer multi-column* — it is a normal
single-flow paragraph stream. Widows / orphans are moot. Headings
flow naturally.

This is why the responsive layout is good without any per-breakpoint
override.

## Selection-contract conformance

Each paragraph / heading inside the multi-column is a typography
atom — the `markTypographyAtoms` walker treats them no differently
than single-column atoms. The decision-mini-pill anchors per
paragraph; the multi-column wrapper itself is NOT an atom (it is a
container).

## When NOT to use multi-column

- Pages with **wide** content that wants the full viewport (tables,
  charts, code blocks ≥ column width).
- **Short** content — multi-column with 3 paragraphs total looks
  awkward (column 1 has 2 paragraphs, column 2 has 1, the visual
  imbalance is glaring).
- **Heading-heavy** content — every heading break disrupts the column
  flow.
- **List-heavy** content — long lists fragment badly; the eye loses
  count.
- **Mobile-first** pages — at narrow viewports the column auto-
  collapses, so the multi-column adds nothing the single-column
  doesn't already give you. Still safe to use (the collapse is free),
  but the *visual identity* doesn't read until the wide viewport.

## Forbidden — fixed-height multi-columns

`.vc-type-multicol { height: 800px; }` is a trap. A fixed-height
multi-column means: "fit the content in N columns within 800 px
vertically; if the content overflows, **clip it**". This is the
*inner scroller* anti-pattern from `no-nested-scrollbars.md` — the
overflowing content is invisible to the reader, the page does not
extend, the reader cannot scroll to see it.

NEVER set `height` on `.vc-type-multicol`. The column flow should
naturally extend the page; let the page own its scroll.

## Cross-references

- [measure-and-readability.md](./measure-and-readability.md) — each
  multi-column column is its own measure; the per-column width
  setting (`30ch`, `24ch`) IS the per-column measure.
- [hyphenation-and-justification.md](../../amvcp-typo-microtype/references/hyphenation-and-justification.md)
  — multi-column columns are narrow; pair with `.vc-type-justify`
  for newspaper-grade typography.
- [print-and-paged-media.md](../../amvcp-typo-i18n-print/references/print-and-paged-media.md) — multi-
  column behaviour in print is identical to screen; this reference's
  rules carry over.
- `layout` skill — page-level grid; multi-column sits inside a grid
  cell.
