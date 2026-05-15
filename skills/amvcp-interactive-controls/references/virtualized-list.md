# Virtualized list

Renders only the visible window (+ overscan) of a long list, so a report
with thousands of rows stays fast. Uses a cumulative-offset array +
binary search → O(log n) per scroll.

## HTML skeleton

```html
<div class="ic-vlist" data-ic-vlist data-id="big-log"
     data-ic-model="ic-data" data-ic-model-key="list"></div>
<noscript>
  <ul class="ic-vlist-plain">
    <li class="ic-vrow">row 1</li>
    <li class="ic-vrow">row 2</li>
    <!-- first ~200 items, static -->
  </ul>
</noscript>
```

The `list` key of the JSON model: `{ "rowHeight": 32, "items": [ … ] }`.
Uniform `rowHeight` is the simple case; a per-item `"heights": [ … ]`
array is also supported (the cumulative-offset array makes it free).

## Critical constraint — page-level scroll, NOT an inner scroller

`~/.claude/rules/no-nested-scrollbars.md` forbids `overflow:auto` boxes.
This virtualized list is therefore **window-scrolled**:

- The `.ic-vlist` gets an explicit total height (`items.length *
  rowHeight`, or the last cumulative offset) so the **document**
  scrollbar reflects the full list.
- A `position:relative` `.ic-vlist` holds absolutely-positioned visible
  rows.
- The scroll listener is on `window`; the visible range is computed from
  `window.pageYOffset` relative to the `.ic-vlist`'s `offsetTop` (via
  `getBoundingClientRect()`), clamped to bounds.

This is the legitimate virtualization pattern that does **not** violate
the rule: the page expands to the full list height, the page's own
scrollbar drives it, and only the DOM nodes for the visible window exist.
There is no second scrollbar.

## The math (pure functions, exported for tests)

- `computeOffsets(heights)` → `offsets[i]` = sum of heights 0..i-1;
  `offsets[n]` = grand total.
- `lowerBound(arr, target)` → first index whose value is `>= target`,
  standard lower-bound binary search, O(log n).
- `getVisibleRange(offsets, scrollTop, viewportH, overscan)` → the
  `[start, end)` row range, padded by `overscan` (default 6) and clamped.

The uniform-height and per-item-height paths share **one** code path —
the offset array is built either way. One source of truth, no branch.

## Render loop

On `window` scroll (throttled to one render per frame via
`requestAnimationFrame`): compute the scroll offset relative to the
list, derive `{start,end}`, remove rows now outside, add rows newly
inside, position each at `top: offsets[i]` absolutely. Each row is built
with `createElement` + `textContent` (XSS-safe).

## Threshold — only virtualize past 200 rows

Below `VLIST_THRESHOLD = 200` items the list renders every row plainly
(no offset array, no scroll listener) — the bookkeeping costs more than
it saves for short lists. Emit a virtualized `.ic-vlist` only when
`items.length >= 200`; otherwise emit a plain `<ul>`.

## Degradation with JS off

A virtualized `.ic-vlist` would be empty with JS disabled. The scaffold
**must** also emit a `<noscript>` block containing the first ~200 items
as a static plain `<ul class="ic-vlist-plain">`, so the report is never
blank without JS.
