# 11 — Auto-fill card grid (a responsive thumbnail / gallery grid)

A grid of equal-shape cards (thumbnails, product tiles, gallery
items) that auto-fills the viewport with as many columns as fit at
a chosen minimum card width. Differs from the KPI row (ref 10)
because the cards do NOT stretch the row to fill — empty tracks at
the end of a row remain empty, giving the gallery a left-aligned
"index" feel rather than a "stat strip" feel.

## What this is

The standard responsive thumbnail-grid pattern:
```css
grid-template-columns: repeat(auto-fill, minmax(316px, 1fr));
gap: var(--la-gap-lg);
```

The `316px` is a typical thumbnail width. Adjustable per-layout
(use `260px` for tighter tile grids, `400px` for larger preview
cards).

`auto-fill` (not `auto-fit`) is the right choice here because:
- A gallery of product / blog / project tiles has variable card
  COUNTS. The author cannot predict whether the user's viewport
  will fit 3 or 5 columns.
- If the gallery has 5 cards and the viewport fits 6, you DO want
  one empty slot on the right (the gallery is anchored to the
  start of the row). `auto-fit` would stretch the 5 cards to fill
  the row, which makes the cards look weirdly wide.
- This matches the gallery / index page convention everywhere from
  the iOS App Store to GitHub's repo grid.

The minimum card width acts as a hard floor — viewports narrower
than the floor get 1 card per row.

## Scaffold to emit

```html
<div class="la-tile-grid" data-ve-id="gallery" data-ve-type="region">
  <article class="la-card" data-ve-id="tile-a" data-ve-type="card">
    <img src="thumb-a.jpg" alt="Project A thumbnail">
    <h3 class="la-card__title">Project A</h3>
    <div class="la-card__body">A brief description of project A …</div>
    <footer class="la-card__footer">Updated 3 days ago</footer>
  </article>
  <article class="la-card" data-ve-id="tile-b" data-ve-type="card">
    <img src="thumb-b.jpg" alt="Project B thumbnail">
    <h3 class="la-card__title">Project B</h3>
    <div class="la-card__body">…</div>
    <footer class="la-card__footer">Updated 1 week ago</footer>
  </article>
  <!-- … as many cards as needed … -->
</div>
```

The CSS is not currently in `amvcp-layout.css` (it is a downstream
custom layout); add to the consuming page's stylesheet:

```css
.la-tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(316px, 1fr));
  gap: var(--la-gap-lg);
}
.la-tile-grid > * { min-width: 0; }
```

If the cards inside need to align titles / bodies / footers across
the row (the subgrid case from ref 07), add `grid-template-rows:
auto auto auto` to `.la-tile-grid` and `grid-row: span 3;
grid-template-rows: subgrid;` to `.la-card` (this is exactly the
ref 07 pattern, applied to an `auto-fill` track).

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="card"`
  on every `.la-card` (each tile is a selectable atom). The
  `.la-tile-grid` container is NOT in the SHAPES list (layout
  containers excluded); add `data-ve-id` manually if the gallery
  itself needs to be commentable.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-lg` | 32px | gap between tiles |
| `--vc-color-surface` | (theme) | card background |
| `--vc-color-content` | (theme) | card text |
| `--vc-color-border` | (theme) | card border |
| `--vc-radius-lg` | 12px | card corners |

## Selection / comment / decision-mini contract notes

Each tile (`.la-card`) is a selectable atom. The gallery container
is not (by default; the author can stamp `data-ve-id` on it if a
gallery-wide comment is needed).

A reviewer can deny / approve / skip each tile independently. This
is useful for "shortlist" workflows: deny the tiles to remove from
the final selection, approve the tiles to keep.

## When to use this grid vs the KPI row (ref 10)

| | Auto-fill card grid (this) | KPI row (ref 10) |
|---|---|---|
| Track sizing | `auto-fill` | `auto-fit` |
| Empty trailing slots | LEFT EMPTY (gallery feel) | COLLAPSED (cards stretch) |
| Min card width | typically 260-400px | typically 180px |
| Card content | rich (image + title + body + footer) | compact (label + value + spark) |
| Typical use | gallery / index / shortlist | metrics strip |

If you cannot decide: cards with images → auto-fill (this); cards
without images → KPI row (ref 10).

## When to use this grid vs the subgrid card row (ref 07)

| | Auto-fill card grid (this) | Subgrid card row (ref 07) |
|---|---|---|
| Title / body / footer alignment | optional | required |
| Card count | many (gallery) | few (3-5 cards, typically) |
| Tracks per row | variable | adapts but typically all visible at once |

## Why min(316px, 100%) in the floor

For viewports narrower than 316px (true edge case but real on
small phones), the card collapses to 100% width via the `min(316px,
100%)` clamp. Without it, the cards would overflow on tiny
viewports.

If your gallery's minimum is larger (e.g. 400px for big preview
cards), the clamp is still `min(400px, 100%)` — the 100% catches
the truly-tiny viewport case in every variant.

## Visual verification

Run the universal self-debug checklist before claiming this gallery
is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For auto-fill gallery correctness specifically:

- Open dev-browser. With 5 tiles and a 1280px viewport, count the
  resulting columns. With `minmax(316px, 1fr)`, the math is
  `floor((1280 - gap*(N-1)) / 316)` ≈ 4 columns; the 5th tile
  drops to a second row, leaving 3 empty slots in the second row
  (correct gallery behaviour).
- Resize to 660px; should give 2 columns.
- Resize to 300px; should give 1 column (the 316px floor activates
  → 100% width).
- **R1 — Light + dark themes**: switch themes; the tile borders /
  text contrast must be correct in both. Image-thumbnail tiles
  need a dark theme variant — if the thumbnails were exported with
  a light background, they look out of place on the dark theme.
  Consider a `filter: brightness(.85)` modifier in dark theme, or
  ship two-tone thumbnails.
- **R2 — No nested scrollbars**: no tile should have
  `overflow:auto`; rich content inside a tile (long descriptions)
  should wrap or truncate — never scroll.
- The "no cards" empty-state check: render the gallery with zero
  tiles; the container should collapse to 0 height (the grid is
  empty). If you want an empty-state message, add a paragraph as
  a sibling of the gallery, not inside it.

## The "min card width" tradeoff

The minimum card width directly affects the gallery's density:

| Min width | Cards per row at 1280px | Visual feel |
|---|---|---|
| 200px | ~5-6 | Dense, "thumbnail wall" |
| 260px | ~4-5 | Standard, balanced |
| 316px | ~3-4 | Generous, "preview" |
| 400px | ~2-3 | Sparse, "feature cards" |
| 500px+ | ~1-2 | One-per-row at most viewports |

Pick by the card content:
- Thumbnails (image only) → 200-260px
- Tiles with image + title → 260-316px
- Tiles with image + title + description → 316-400px
- Featured cards with rich content → 400-500px

A gallery with mixed-shape cards (some image-only, some
text-rich) should use the largest min-width that fits the
richest cards — uniformity is more important than density.

## Combining with subgrid

If the cards inside this gallery have title/body/footer
structure that should align across rows (like the subgrid card
row in ref 07), the auto-fill grid PLUS subgrid combination
works:

```css
.la-tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(316px, 1fr));
  /* Auto-rows let each row size to its tallest card. */
  grid-auto-rows: auto;
  gap: var(--la-gap-lg);
}
.la-tile-grid > .la-card {
  /* Subgrid: each card takes 3 rows of the parent's grid. */
  grid-row: span 3;
  grid-template-rows: subgrid;
}
```

This gives all cards' titles aligned, all bodies aligned, all
footers aligned — within each row. Across rows, the row
heights vary independently (each row sizes to its own tallest
card). This is the right tradeoff: aligning every card across
the WHOLE GALLERY would force the gallery to a fixed card
height, which forces ugly truncation on cards with longer
content.

## Pagination considerations

If the gallery has many tiles (50+), consider:
- **Inline expansion:** show 12 tiles by default, "load more"
  reveals the next 12. (No pagination UI; one continuous
  gallery.)
- **Page navigation:** classic 1/2/3 pagination at the bottom.
- **Infinite scroll:** load more on scroll-near-bottom (least
  preferred — breaks the no-nested-scrollbars contract if
  poorly implemented).

The layout doesn't ship pagination — that's an interactive
control. The gallery container is the same regardless of
pagination choice.
