# Sortable & big-data tables — algorithm reference

How the `data` mode's sort and the big-data mode's virtualization work
inside `amvcp-tables.js`. This is the "why it is built this way" detail
for anyone debugging or extending the module.

## Table of contents

- [Sort — numeric detection](#sort--numeric-detection)
- [Sort — the 3-state cycle](#sort--the-3-state-cycle)
- [Sort — moving nodes, not cloning them](#sort--moving-nodes-not-cloning-them)
- [Sort — stability](#sort--stability)
- [Sort — spanning-cell safety](#sort--spanning-cell-safety)
- [Big-data — the no-nested-scrollbars reconciliation](#big-data--the-no-nested-scrollbars-reconciliation)
- [Big-data — row-height measurement](#big-data--row-height-measurement)
- [Big-data — the visible window](#big-data--the-visible-window)
- [Big-data — scroll-anchor](#big-data--scroll-anchor)
- [Big-data — shrink-wrap (dropped, intentionally)](#big-data--shrink-wrap-dropped-intentionally)

---

## Sort — numeric detection

A column is **numeric** iff *every non-empty* `<tbody>` cell parses as a
number. `parseCellNumber(text)` normalises a cell:

1. trim surrounding whitespace;
2. strip one optional leading currency symbol (`$ € £ ¥`);
3. strip one optional trailing `%`;
4. strip `,` thousands separators and any interior whitespace;
5. `Number()` the remainder.

`Number('')` is `0` but `Number('12abc')` is `NaN` — exactly the
discrimination wanted, so step 5 uses `Number`, not `parseFloat`
(`parseFloat('12abc')` wrongly yields `12`). An empty cell is **skipped**
(does not disqualify a numeric column); an all-empty column is treated
as string (no meaningful numeric sort). Detection runs **once per
column, lazily on the first click** of that header, and is cached on the
`<th>` (`th.__veNumeric`). A detected numeric column is right-aligned
(`text-align:right`, `font-variant-numeric:tabular-nums`) — numbers
line up visually.

## Sort — the 3-state cycle

Clicking a header advances `none → asc → desc → none`. Clicking a
*different* header starts that column at `asc` and clears the previous —
there is exactly one active sort column at a time (simpler mental model
than multi-sort). State lives on the `<table>` (`table.__veSort`). The
`none` state restores the rows to their authored order (snapshotted once
on the first sort as `table.__veOriginalOrder`).

Each sortable `<th>` gets `tabindex="0"`, an `aria-sort` attribute
updated on every cycle (`ascending`/`descending`/`none`), and responds
to `click`, `keydown` Enter and `keydown` Space (Space is
`preventDefault`-ed to stop the page scrolling). A `<span
class="ve-sort-arrow">` is injected; CSS picks the glyph (`▲ ▼ ↕`) from
`aria-sort`. The idle `↕` shows only on header hover/focus to advertise
sortability; the active arrow is solid accent and always visible.

## Sort — moving nodes, not cloning them

The single most important sort-safety property. The sort collects the
`<tr>` nodes, sorts the array, then re-appends each with
`tbody.appendChild(tr)`. **`appendChild` on an already-attached node
MOVES it** — it is not a copy. So `data-ve-id`, `data-ve-comment-id`,
`data-ve-pressed`, every attached listener, and any comment-thread
association ride along with the node untouched. Cloning rows instead of
moving them would silently break selection and comment threads — never
clone.

## Sort — stability

`Array.prototype.sort` is stable in every browser since ES2019, so equal
keys keep DOM order for free. To stay correct on a hypothetical pre-2019
engine the module decorates each row with its original index
(`{ row, index }`) and the comparator falls back to that index on a tie
— a decorate / sort / undecorate that guarantees stability regardless of
the engine. The index tiebreak is NOT negated by the sort direction:
equal keys keep DOM order in both `asc` and `desc`.

String columns sort with
`localeCompare(b, undefined, {numeric:true, sensitivity:'base'})` —
`numeric:true` gives natural ordering (`item2` before `item10`). A
non-numeric straggler in a numeric column is treated as `+Infinity` so
it sorts last in `asc`, never jumping to the top.

## Sort — spanning-cell safety

Column operations (which cell holds the sort key, right-align a column,
tint the sorted column) never use `cells[N]` or `:nth-child(N)` — those
are wrong the moment a cell spans columns. `buildCellGrid(table)` builds
a 2-D grid where a cell spanning S×R slots occupies all S×R grid
positions referencing the same node; the top-left slot is the *origin*,
the rest are *continuations* ("null-slot" pattern). Column index N then
always means grid column N. A header cell index is mapped to its grid
column by summing the colspans of the header cells before it.

If any `<tbody>` cell has `rowspan > 1`, **sorting is disabled for that
table** (reordering rows would tear the span) — the header arrows are
not injected and one `console.info` explains why. Grouped *headers*
(colspan only in `<thead>`) sort fine — the body rows are independent.

---

## Big-data — the no-nested-scrollbars reconciliation

Conventional virtualization uses an inner `overflow:auto` scroller —
**forbidden** by the no-nested-scrollbars rule and by the runtime's
`overflow:visible !important` on tables. The module resolves it with
**window-scroll virtualization**:

> There is NO inner scrollbox. The table is virtualized against the
> **document's own scroll position** (`document.scrollingElement
> .scrollTop`). The table reserves its full height with two spacer
> `<tr>`s (a top spacer of `firstVisible × rowHeight` and a bottom
> spacer of `(rowCount−1−lastVisible) × rowHeight`); as the *page*
> scrolls, the visible-row slice is recomputed. The reader uses the one
> document scrollbar.

"Frozen header" is `position:sticky; top:0` on the `<thead>` cells
(sticks to the viewport as the page scrolls); "frozen columns" are
`position:sticky; left:<offset>`. `position:sticky` needs **no** scroll
container — it sticks within normal document flow, so it composes with
the runtime's `overflow:visible`. Both frozen surfaces get an **opaque**
`var(--vc-color-surface)` background — a transparent sticky cell would
show scrolled body content bleeding through — and a `z-index` so the
header is above body cells and a frozen column is above non-frozen ones;
the header∩frozen-column cell gets the highest `z-index`.

## Big-data — row-height measurement

The module renders the first ~20 rows once, reads their heights with one
`getBoundingClientRect()` pass (all reads batched in a
`requestAnimationFrame`, before any write — read/write discipline avoids
layout thrash), and takes the **median** as a single uniform
`rowHeight`. Report tables are overwhelmingly uniform-height; one number
makes the offset math `O(1)`. A genuinely variable-height table would
need a per-row `rowHeights[]` array + a binary search — that escalation
is noted but not the default.

## Big-data — the visible window

`computeVirtualWindow({scrollY, tableTop, viewportH, rowHeight,
rowCount, overscan})` is a pure function:

- `top = scrollY − tableTop`
- `firstVisible = floor(top / rowHeight) − overscan`
- `lastVisible  = ceil((top + viewportH) / rowHeight) + overscan`
- `overscan = 3` — extra rows above/below so a fast scroll never flashes
  a blank gap.
- A table entirely outside the viewport (unclamped `lastVisible < 0` or
  unclamped `firstVisible > rowCount−1`) returns a well-formed *empty*
  window (`{firstVisible:0, lastVisible:-1}`) — render nothing rather
  than collapse two clamped values onto one row.
- Otherwise both ends clamp into `[0, rowCount−1]`.

The `scroll` listener is `passive` and throttled to one update per
animation frame.

## Big-data — scroll-anchor

When the row set changes (a sort, an insert) the row the reader was
looking at would visually jump. `computeScrollDelta({tableTop,
anchorNewIndex, rowHeight, anchorViewportOffset})` returns the `scrollY`
that keeps the anchor row pinned at the same on-screen position:
`tableTop + anchorNewIndex × rowHeight − anchorViewportOffset`. With a
uniform row height this is `O(1)`.

## Big-data — shrink-wrap (dropped, intentionally)

The original TB-09 reference binary-searched the minimum wrap-free
column width via a canvas text-measurement library. **That dependency is
rejected.** The module instead relies on the browser's native table
auto-layout (`table-layout:auto`, the runtime default) which
shrink-wraps columns to content for free. Documented here so it is not
silently re-attempted.
