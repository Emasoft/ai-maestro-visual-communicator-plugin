# Virtualization — window-scroll, no inner scrollbar

How big-data tables (hundreds to millions of rows) stay performant
WITHOUT introducing an inner scrollbox. The runtime forbids nested
scrollbars; the conventional virtualization libraries assume an
`overflow:auto` container. This reference explains the window-scroll
reconciliation.

## Table of contents

- [Why this is hard](#why-this-is-hard)
- [The conventional approach — and why we reject it](#the-conventional-approach--and-why-we-reject-it)
- [Window-scroll virtualization — the design](#window-scroll-virtualization--the-design)
- [Two spacer rows reserve the page height](#two-spacer-rows-reserve-the-page-height)
- [Row-height measurement — sample + median](#row-height-measurement--sample--median)
- [`computeVirtualWindow()` — visible-row math](#computevirtualwindow--visible-row-math)
- [The scroll listener — passive + rAF-throttled](#the-scroll-listener--passive--raf-throttled)
- [`requestAnimationFrame` read/write discipline](#requestanimationframe-readwrite-discipline)
- [Find-in-page caveat](#find-in-page-caveat)
- [Print caveat](#print-caveat)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## Why this is hard

The math of virtualization is simple — only render the rows that fit
on screen, hold the rest in a JS array. The hard part is the
**container model**:

- Conventional virtualization expects a fixed-height container with
  `overflow:auto`. The scrollbar is on that container; row offsets
  are computed against `container.scrollTop`.
- This plugin forbids inner scrollboxes. Every table extends the
  page; the reader uses the document's one scrollbar.

So the table cannot have its own scrollbar to listen to. The only
scroll the module can hook is the page's. That changes every layer
of the implementation.

## The conventional approach — and why we reject it

```html
<!-- DO NOT — conventional virtualization, two scrollbars -->
<div style="height:600px;overflow:auto">
  <table>...</table>
</div>
```

A 600px inner scrollbox produces a nested scrollbar — forbidden by
`~/.claude/rules/no-nested-scrollbars.md` and visible to readers as
a UX disaster:

- Scroll inertia gets stolen as the cursor crosses container
  boundaries.
- Find-in-page misses content that isn't in the inner viewport.
- Screen reader navigation hits a wall at the container edge.
- Screenshots capture only what fits in the inner viewport.

The runtime enforces this with `table { overflow:visible !important;
display:table !important; }` so even an author who wraps the table
in `<div style="overflow:auto">` gets the wrapper's overflow
stripped. The conventional approach is not just discouraged — it is
actively blocked.

## Window-scroll virtualization — the design

```
┌─────────────────────────────────────┐  ← document viewport top
│  (other report content)             │
│  <table>                            │  ← sticky header pins here when in view
│    [thead — sticky]                 │
│    [top-spacer tr — N×rowHeight]    │  ← "rows above us" reserved height
│    [visible rows in tbody]          │  ← only these live in DOM
│    [bottom-spacer tr — M×rowHeight] │  ← "rows below us" reserved height
│  </table>                           │
│  (more report content)              │
└─────────────────────────────────────┘  ← document viewport bottom
```

The table reserves its **full** height via two spacer rows. The
document's height is correct (the page scrollbar is correctly sized).
As the page scrolls, the module updates which rows live in the
visible-row slice — but the table's overall height NEVER changes,
which means the page scrollbar position never jumps.

The header uses `position: sticky; top: 0` — needs NO scroll
container, sticks within document flow. Frozen columns use
`position: sticky; left: <offset>` — same idea, sticks within
horizontal flow.

## Two spacer rows reserve the page height

A spacer row is a single empty `<td>` spanning all columns, with a
controlled height:

```js
function makeSpacerRow(colCount) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-ve-table-spacer', '1');
  tr.setAttribute('aria-hidden', 'true');
  var td = document.createElement('td');
  td.colSpan = colCount;
  td.style.height = '0px';
  tr.appendChild(td);
  return tr;
}
```

CSS strips the spacer's borders and padding so it has zero visual
footprint at zero height:

```css
table[data-ve-table] tr[data-ve-table-spacer] td {
  padding: 0;
  border: 0;
}
```

On render, the top spacer's height is set to
`firstVisible × rowHeight` and the bottom spacer's to
`(rowCount − 1 − lastVisible) × rowHeight`. Together they reserve
exactly the right amount of off-screen height so the page scrollbar
maps to the right virtual rows.

The `data-ve-table-spacer` and `aria-hidden` attributes ensure:
- The selection scan skips them (no spurious selectable rows).
- The sort skips them (no random spacer ending up at the top).
- The screen reader skips them.

## Row-height measurement — sample + median

A virtualized table needs a numeric `rowHeight`. The module renders
the first ~20 rows once, reads their heights, takes the **median**:

```js
var sample = state.allRows.slice(0, VIRTUAL_MEASURE_SAMPLE); // 20
for (var i = 0; i < sample.length; i++) {
  state.tbody.appendChild(sample[i]);
}
// READ pass — all getBoundingClientRect calls together
var heights = [];
for (var i = 0; i < sample.length; i++) {
  var h = sample[i].getBoundingClientRect().height;
  if (h > 0) heights.push(h);
}
state.rowHeight = median(heights) || 32;
```

Report tables are overwhelmingly uniform-height (every row has the
same font size, same line-height, same padding). The median absorbs
the occasional 1px outlier from sub-pixel rounding. A single uniform
`rowHeight` makes the offset math O(1): `top = firstVisible ×
rowHeight`. A genuinely variable-height table would need a per-row
`rowHeights[]` array + a binary-search offset map — that escalation
is documented but not the default.

Median-of-20 catches the case where the very first row is taller
(`<th>`-leading totals row, etc.) and would have skewed a `mean`.

## `computeVirtualWindow()` — visible-row math

The pure function that maps `(scrollY, tableTop, viewportH,
rowHeight, rowCount)` to `{ firstVisible, lastVisible }`:

```js
function computeVirtualWindow(o) {
  var rowHeight = o.rowHeight > 0 ? o.rowHeight : 1;
  var rowCount = o.rowCount > 0 ? o.rowCount : 0;
  if (rowCount === 0) return { firstVisible: 0, lastVisible: -1 };
  var overscan = typeof o.overscan === 'number' ? o.overscan : 3;
  var top = o.scrollY - o.tableTop;
  var rawFirst = Math.floor(top / rowHeight) - overscan;
  var rawLast = Math.ceil((top + o.viewportH) / rowHeight) + overscan;
  if (rawLast < 0 || rawFirst > rowCount - 1) {
    return { firstVisible: 0, lastVisible: -1 };  // empty window
  }
  var first = rawFirst < 0 ? 0
    : (rawFirst > rowCount - 1 ? rowCount - 1 : rawFirst);
  var last = rawLast > rowCount - 1 ? rowCount - 1
    : (rawLast < 0 ? 0 : rawLast);
  return { firstVisible: first, lastVisible: last };
}
```

The function is **pure** — no DOM, no globals — so it is testable in
isolation (Node, no jsdom required).

### overscan = 3

Three rows above and below the visible window are rendered too. A
fast scroll never flashes a blank gap; the slot is always pre-warmed.
Three is the canonical balance (zero overscan = flashes; >5 overscan
= wasted DOM nodes).

### empty-window correctness

A table entirely above or entirely below the viewport returns a
well-formed **empty** window (`{firstVisible: 0, lastVisible: -1}`).
The render loop sees `last < first` and renders zero rows — instead
of collapsing two clamped values onto the same row, which would have
produced one phantom row visible on screen.

## The scroll listener — passive + rAF-throttled

The page scroll event fires every few ms during inertial scroll.
Re-rendering on every event would thrash layout. The module
throttles to one render per animation frame:

```js
function bindVirtualScroll(state) {
  var onScroll = function () {
    if (state.rafPending) return;
    state.rafPending = true;
    var run = function () {
      state.rafPending = false;
      renderVirtualWindow(state);
    };
    requestAnimationFrame(run);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}
```

- `{ passive: true }` — the listener does NOT call `preventDefault`,
  so the browser does not need to block scroll until the listener
  finishes. Critical for smooth scrolling.
- `state.rafPending` — coalesces N scroll events per frame into one
  render. Even if the page fires 30 scroll events between frames,
  only one render happens.

The `resize` listener is the same path because a viewport resize
changes which rows are visible. No separate `MutationObserver` for
font-loading shifts — those are rare and the worst case is one
"wrong" frame before the next scroll re-fixes it.

## `requestAnimationFrame` read/write discipline

Reading layout (`getBoundingClientRect`, `offsetTop`, `clientHeight`,
`scrollY`) and writing to the DOM (`appendChild`, `style.X = …`)
trigger different browser pipelines. Mixing them — read, write,
read, write — forces "layout thrash": the browser has to re-layout
on every read to make sure the answer is consistent with the writes.

The module batches: **all reads, then all writes**. The row-height
measurement and the frozen-column positioning are both written in
that pattern:

```js
// READ pass — measure
for (col = 0; col < freezeCols; col++) {
  widths.push(cells[0].getBoundingClientRect().width);
}
// WRITE pass — apply
var left = 0;
for (col = 0; col < widths.length; col++) {
  for (i = 0; i < colCells.length; i++) {
    colCells[i].style.left = left + 'px';
  }
  left += widths[col];
}
```

One layout, one paint, instead of N layouts and N paints.

## Find-in-page caveat

The browser's Find (`Cmd+F`/`Ctrl+F`) searches only the live DOM.
Rows held in the JS array (off-screen) are NOT findable. This is the
fundamental tradeoff of virtualization — there is no fix that
preserves both performance and search.

The mitigation: the module exposes the full row count in a small
top-right "showing rows N–M of T" affordance (a future enhancement —
not yet shipped). The reader who needs to find a row can also disable
virtualization for that table (remove `data-ve-table-virtual="1"`)
at the cost of performance.

## Print caveat

A virtualized table prints only the visible window — the off-screen
rows are not in the DOM, so the printer sees `firstVisible..
lastVisible` only. The print stylesheet can override this by
materializing every row before print, but the module does not do that
automatically. A print-friendly report should not virtualize the
tables it needs to print.

## Sample HTML

```html
<table data-ve-table="data"
       data-ve-table-virtual="1"
       data-ve-freeze-cols="1">
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Name</th>
      <th scope="col">Created</th>
      <th scope="col">Revenue</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <!-- N rows, the more the better for virtualization to be worth it -->
    <tr><td>0001</td><td>Acme</td><td>2024-01-12</td><td>32,450</td><td>active</td></tr>
    <tr><td>0002</td><td>Globex</td><td>2024-01-18</td><td>28,100</td><td>active</td></tr>
    <!-- … hundreds or thousands more — author them normally. The module
         virtualizes them automatically. -->
  </tbody>
</table>
```

The author writes a normal `<table>` with all rows. The module pulls
them into a JS array on enhancement and only renders the visible
window. The `data-ve-freeze-cols="1"` freezes the ID column so the
reader can horizontally scroll without losing the row identifier.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-surface` | sticky header background (must be opaque); frozen column background |
| `--vc-color-border-strong` | the 2px right-edge divider on the freeze boundary |

The header MUST be opaque — a transparent sticky cell would show
scrolled body content bleeding through. `--vc-color-surface` is
guaranteed opaque in both themes (it IS the table background). The
border-strong token is a higher-contrast border for the freeze edge
than the default cell-border token, so the reader can see where the
frozen lane ends.

## Selection / comment / decision-mini notes

The visible window rebuilds via `appendChild` (a move, not a clone —
see [row-move-not-clone.md](./row-move-not-clone.md)). Selection
state on a row that scrolls off-screen is preserved on the JS-array
node; it reactivates instantly when the row scrolls back into view
because the same node is re-attached.

Spacer rows carry `data-ve-table-spacer="1"` and `aria-hidden="true"`
— the selection scan and the screen reader both skip them. The
decision-mini pill is attached per row; off-screen rows have no
pills because they have no DOM — pills reappear when rows re-enter
the window.

## CSV-export contract

`tableToCsv()` walks the **full** row set held in the JS array — NOT
just the visible window. The export is a true snapshot of the data,
not "what was rendered". This is correct: a reader who wants the
data wants all of it; the visible window is a render optimisation,
not a data filter.

Spacer rows are excluded from the CSV walk by the
`data-ve-table-spacer` skip filter — they have no semantic content.
