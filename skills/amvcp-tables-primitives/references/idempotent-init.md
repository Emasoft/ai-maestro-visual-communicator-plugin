# Idempotent `init()` — safe to call N times, never duplicates

How `amvcp-tables.js` guarantees that a second (third, Nth) call to
`init()` never duplicates sort arrows, never re-injects matrix
glyphs, never wires duplicate event listeners. The "safe to re-run
after dynamic content insertion" contract.

## Table of contents

- [Why idempotency matters](#why-idempotency-matters)
- [The three guard layers](#the-three-guard-layers)
- [`document.__veTablesInit` — module-level flag](#document__vetablesinit--module-level-flag)
- [Per-table mode guards](#per-table-mode-guards)
- [Per-cell glyph guards](#per-cell-glyph-guards)
- [Per-header sortable guard](#per-header-sortable-guard)
- [Per-table CSV-wrap guard](#per-table-csv-wrap-guard)
- [Style injection is single-stylesheet](#style-injection-is-single-stylesheet)
- [What re-init DOES re-do](#what-re-init-does-re-do)
- [What re-init does NOT re-do](#what-re-init-does-not-re-do)
- [Dynamic content insertion — how to use re-init](#dynamic-content-insertion--how-to-use-re-init)
- [Forgiving load order](#forgiving-load-order)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## Why idempotency matters

Three real-world scenarios force re-init:

1. **Dynamic content insertion.** An author adds a table after
   page load (via `innerHTML +=`, `appendChild`, a hot-reload, an
   inline-edit save) and needs the new table enhanced.
2. **Load-order race.** The runtime's `bootEverything()` calls
   `window.amvcpTables.init()` once; if the module loads later
   (async script), it self-init on DOMContentLoaded — a duplicate.
3. **Test fixture re-run.** A test harness calls `init()` between
   test cases to reset state on a single page.

A non-idempotent `init()` in any of these cases produces:
- Duplicate sort arrows (the column gets `▲↕` after re-init).
- Duplicate matrix glyphs (the cell gets `✓✓ Pass Pass`).
- Duplicate event listeners (one click fires the sort cycle
  twice — sorts, then immediately un-sorts).
- Duplicate CSV buttons (two "Copy CSV" buttons in the wrap).

The module ships idempotent so all three cases JUST WORK without
the author having to reason about init-state.

## The three guard layers

The module uses three layers of guards:

1. **Module-level** — `document.__veTablesInit` boolean.
2. **Per-table mode-specific** — `table.__veVirtual`,
   `table.__veCsvWired`, `table.__veSort`,
   `table.__veOriginalOrder`, `table.__veAtomTag`.
3. **Per-element granular** — `data-ve-sortable="1"` attribute,
   `cell.querySelector('.ve-matrix-glyph')` presence check.

Each layer protects different operations from re-execution; the
combination means a re-init is a no-op for every already-enhanced
piece.

## `document.__veTablesInit` — module-level flag

```js
function init() {
  if (typeof document === 'undefined') return;
  injectStyle();
  var tables = document.querySelectorAll('table[data-ve-table]');
  for (var i = 0; i < tables.length; i++) {
    var table = tables[i];
    if (isTableFormScope(table)) continue;
    var mode = table.getAttribute('data-ve-table');
    if (mode === 'data') enhanceDataTable(table);
    else if (mode === 'matrix') enhanceMatrixTable(table);
    else if (mode === 'compare') enhanceCompareTable(table);
    if (table.getAttribute('data-ve-table-virtual') !== null && mode === 'data') {
      enhanceVirtualTable(table);
    }
    enhanceCsvButton(table);
  }
  document.__veTablesInit = true;
}
```

The flag is set at the END of init(). The forgiving-load-order
self-init checks the flag:

```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.__veTablesInit) init();
  });
}
```

So if `init()` was already called (by the runtime's
`bootEverything()` or by manual code), the DOMContentLoaded self-
init skips. No duplicate first call.

For a deliberate re-init after dynamic content insertion, the
author calls `window.amvcpTables.init()` directly — the flag is
already set, but the per-element guards take over.

## Per-table mode guards

```js
function enhanceVirtualTable(table) {
  if (table.__veVirtual) return; // idempotent
  ...
  table.__veVirtual = state;
}

function enhanceCsvButton(table) {
  if (table.getAttribute('data-ve-table-csv') !== '1') return;
  if (table.__veCsvWired) return; // idempotent
  table.__veCsvWired = true;
  ...
}
```

Each mode-attaching function checks a per-table flag at its top.
If the flag is set, the function returns immediately — no second
attachment, no duplicate spacer rows, no duplicate CSV button.

The flag is a JS property on the table element (`table.__veVirtual`),
not a DOM attribute — author code shouldn't be able to break
idempotency by removing an attribute. JS properties are
script-set; they don't appear in the DOM serialisation; they're
the right scope for "module-internal state".

## Per-cell glyph guards

```js
function enhanceMatrixTable(table) {
  var cells = table.querySelectorAll('td[data-ve-val]');
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];
    if (closestTable(cell) !== table) continue;
    if (cell.querySelector('.ve-matrix-glyph')) continue;  // ← here
    ...
  }
}
```

Each matrix cell checks "do I already have a glyph?" by
`querySelector('.ve-matrix-glyph')`. If yes, skip. The presence of
the glyph child IS the "already enhanced" signal.

This guard is more granular than a per-table flag — even if a
single new cell is dynamically added to an already-enhanced
matrix table, a re-init enhances only the new cell.

## Per-header sortable guard

```js
function wireSortHeader(table, th, headerColIndex) {
  if (th.getAttribute('data-ve-sortable') !== null) return;
  th.setAttribute('data-ve-sortable', '1');
  ...
}
```

Each sortable `<th>` carries `data-ve-sortable="1"` after wiring.
A re-call sees the attribute and exits. No duplicate arrow
injection; no duplicate click handler; no duplicate `aria-sort`
attribute.

If the author dynamically adds a new column to an enhanced data
table and calls `init()`, the new column's `<th>` (without
`data-ve-sortable`) gets wired; the existing columns are skipped.

## Per-table CSV-wrap guard

```js
function enhanceCsvButton(table) {
  if (table.getAttribute('data-ve-table-csv') !== '1') return;
  if (table.__veCsvWired) return;
  table.__veCsvWired = true;
  var wrap = table.parentNode;
  if (!wrap || !hasClass(wrap, 've-table-csv-wrap')) {
    wrap = document.createElement('div');
    wrap.className = 've-table-csv-wrap';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  }
  ...
}
```

The flag guard prevents a second button. The wrap-existence check
prevents a SECOND wrapper div even on a fresh init (if the table
was already wrapped, the existing wrap is reused).

## Style injection is single-stylesheet

```js
var STYLE_ID = 've-tables-style';

function injectStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;  // ← idempotent
  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = tablesCss();
  document.head.appendChild(style);
}
```

The stylesheet has a fixed ID. `injectStyle()` checks if an
element with that ID already exists; if yes, exits. Only ONE
`<style id="ve-tables-style">` ever appears in the document head,
regardless of how many `init()` calls happen.

## What re-init DOES re-do

- **New tables.** A table that wasn't in the DOM at the last init
  but is now → enhanced.
- **New columns.** A column added to an already-enhanced data
  table → wired (per-header guard sees no `data-ve-sortable`).
- **New rows.** A row added to a virtualized table → NOT picked
  up; the virtual state has cached `allRows`. The author would
  need to call a hypothetical "add row" helper (not in current
  module). Workaround: re-init the table by clearing
  `table.__veVirtual` and re-calling.
- **New matrix cells.** A cell added to an enhanced matrix table
  → glyph injected (per-cell guard sees no `.ve-matrix-glyph`).

## What re-init does NOT re-do

- **Sort state.** `table.__veSort` and
  `table.__veOriginalOrder` persist; re-init doesn't reset them.
  The reader's chosen sort stays in place.
- **Numeric-column cache.** `th.__veNumeric` persists; re-init
  doesn't re-detect.
- **CSV wrap.** Already-wrapped tables stay wrapped.
- **Style injection.** The single stylesheet is reused.

These persistent states are FEATURES — the reader doesn't want
their sort reset every time a new row appears.

## Dynamic content insertion — how to use re-init

```js
// add a new row to an existing data table
var tbody = document.querySelector('#my-table tbody');
var tr = document.createElement('tr');
tr.innerHTML = '<td>...</td><td>...</td>';
tbody.appendChild(tr);

// re-init to pick up any new tables / columns / cells
window.amvcpTables.init();
```

The re-init costs O(N) over enhanced tables (every table is
scanned), but each enhancement function exits early via its
guards. For a page with 10 tables and 1 new row in one of them,
the re-init is microseconds.

For frequent insertion (a live dashboard), the author can target
just the new content:

```js
window.amvcpTables.init();  // safe; idempotent
// OR — call enhancement helpers directly:
// (no public per-table API yet; init() is the only public entry)
```

The lack of a public per-table API is intentional — `init()` is
the single contract; the per-mode functions are internal.

## Forgiving load order

The runtime's `bootEverything()` calls `window.amvcpTables.init()`
ONCE on boot. But:
- If the runtime loads FIRST and the module loads AFTER, the
  runtime's call to `window.amvcpTables.init()` is a no-op
  (module not yet defined). The module's self-init on
  DOMContentLoaded then fires.
- If the module loads FIRST and the runtime loads AFTER, the
  module's self-init runs on DOMContentLoaded. The runtime then
  calls `init()` again; the per-table guards make it a no-op.
- If they load SIMULTANEOUSLY (async), the order is non-
  deterministic — but both calls converge on a single enhanced
  state.

```js
if (typeof window !== 'undefined') {
  window.amvcpTables = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (!document.__veTablesInit) init();
      });
    }
  }
}
```

The `if (!document.__veTablesInit)` check is the dedup — the
module's self-init only fires if the runtime hasn't already.

## DESIGN.md tokens consumed

None — idempotency is an internal contract, no visual signal.

## Selection / comment / decision-mini notes

The runtime's atom contracts (`data-ve-id`, `data-ve-comment-id`)
are idempotent on their own — the runtime owns its own re-init
guards. The module's atom-stamping helpers
(`stampRowAtoms`, `stampMatrixCellAtoms`,
`stampCompareCellAtoms`) check for existing attributes before
setting them:

```js
if (tr.hasAttribute('data-ve-comment-id')) {
  atomId = tr.getAttribute('data-ve-comment-id');  // keep existing
} else {
  atomId = 'row:' + tag + ':' + (i + 1);
  tr.setAttribute('data-ve-comment-id', atomId);
}
attachDecisionMiniSafe(tr, atomId);  // safe; idempotent
```

So a re-init does NOT regenerate atom ids (which would lose
comment-thread state and decision-mini pill state). The atom id
is stable across re-inits — that's the entire point of the
deterministic id format.
