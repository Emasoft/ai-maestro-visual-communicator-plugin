# Axis layout

## Table of Contents

- [What it does](#what-it-does)
- [One axis](#one-axis)
- [Two axes](#two-axes)
- [Three axes](#three-axes)
- [Why the page expands (no nested scrollbars)](#why-the-page-expands-no-nested-scrollbars)
- [The responsive grid](#the-responsive-grid)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Visual verification](#visual-verification)

The matrix lays out the variant cells along 1-3 axes. The model is
deliberately simple so the sheet stays readable: the **primary axis**
(`axes[0]`) becomes labelled section bands; the other axes are conveyed
per-cell. The variants list itself is the expanded set of cells you
supply — the renderer never multiplies axes for you.

## What it does

`buildMatrix(schema, opts)`:

1. reads `schema.axes`; the first declared key is the primary axis;
2. for each primary-axis value (in declared order), emits an
   `.vc-cvm-axis-band` header then a responsive grid of the cells whose
   `axisValues[primary]` matches that value;
3. any cell that matches no declared value lands in a trailing
   `(ungrouped)` band (fail-soft);
4. with NO axes, emits a single grid of every variant.

## One axis

A single axis (e.g. `state: ["default","hover","disabled"]`) gives one
band per value, each a grid of the variants in that state. This is the
"show every state of this button" case — one row of states, each state's
treatments side by side.

## Two axes

Declare `size` first and `state` second:
`axes:{ size:["sm","md","lg"], state:["default","focus","error"] }`. The
matrix bands by `size` (the primary axis); within each size band, the
cells convey their `state` via the variant label / sample. Author one
variant per (size, state) pair you want shown — the variants list is the
explicit product, so you include exactly the combinations that matter
(no combinatorial blow-up of irrelevant cells).

## Three axes

Add `intent` as a third axis. It still bands by the primary axis only;
`state` and `intent` are conveyed per-cell (label, sample, treatment).
Three axes is the practical ceiling for a readable single sheet — beyond
that, split into multiple matrices (one component each) rather than
nesting grids.

## Why the page expands (no nested scrollbars)

Per `~/.claude/rules/no-nested-scrollbars.md`, a variant matrix never
introduces an inner scroll viewport. When there are more cells than fit
the viewport width, the grid WRAPS to more rows and the **document**
scrolls. There is no `overflow:auto` wrapper, no `max-height`, no
table-as-block trick. A reviewer gets the page's single scroll axis and
can see every variant by scrolling the document — never trapped in an
inner box.

## The responsive grid

```css
.vc-cvm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--vc-space-3, 16px);
  align-items: start;
}
```

`auto-fill` + `minmax(240px, 1fr)` fits as many 240px-min columns as the
viewport allows, then wraps. No media queries are needed — the grid
reflows from many columns to one as the page narrows. `align-items:start`
top-aligns cells of unequal height so a band reads as a clean row.

## DESIGN.md tokens used

- reads: `--vc-space-1..5` (band margins, grid gap),
  `--vc-color-border` (band underline), `--vc-color-content`,
  `--vc-color-content-subtle` (axis name / value),
  `--vc-font-mono` (axis name), `--vc-font-heading` (axis value),
  `--vc-text-0/3` (axis name / value sizes)
- writes: NOTHING

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the matrix under
`dev-browser`. Verify:

1. one axis band per primary-axis value, in declared order;
2. the grid wraps cleanly at narrow widths (resize the viewport) with NO
   inner horizontal scrollbar — only the document scrolls;
3. the axis legend in the header lists every axis and its values;
4. both themes render the bands and grid correctly (R1, light + dark).
