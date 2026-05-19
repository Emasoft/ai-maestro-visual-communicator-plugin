# Data tables & lists — every density and shape

## Table of Contents

- [Pattern 1 — Standard sortable table](#pattern-1--standard-sortable-table)
- [Pattern 2 — Compact list (denser than table)](#pattern-2--compact-list-denser-than-table)
- [Pattern 3 — Expandable rows (master-detail in one view)](#pattern-3--expandable-rows-master-detail-in-one-view)
- [Pattern 4 — Inline editable cells](#pattern-4--inline-editable-cells)
- [Pattern 5 — Drag-to-reorder (sortable list)](#pattern-5--drag-to-reorder-sortable-list)
- [Pattern 6 — Virtualized big-data (10k+ rows)](#pattern-6--virtualized-big-data-10k-rows)
- [Row selection — checkbox column + bulk action bar](#row-selection--checkbox-column--bulk-action-bar)
- [Empty table state](#empty-table-state)
- [Sticky header + sticky first column](#sticky-header--sticky-first-column)
- [Cell type conventions (text, number, date, status, action)](#cell-type-conventions-text-number-date-status-action)

Tables are 30%+ of every dashboard's surface area. Six list-shape
patterns: standard sortable table, compact list, expandable rows,
inline editable cells, drag-to-reorder, virtualized big-data.

## Table of contents

- [Pattern 1 — Standard sortable table](#pattern-1--standard-sortable-table)
- [Pattern 2 — Compact list (denser than table)](#pattern-2--compact-list-denser-than-table)
- [Pattern 3 — Expandable rows (master-detail in one view)](#pattern-3--expandable-rows-master-detail-in-one-view)
- [Pattern 4 — Inline editable cells](#pattern-4--inline-editable-cells)
- [Pattern 5 — Drag-to-reorder (sortable list)](#pattern-5--drag-to-reorder-sortable-list)
- [Pattern 6 — Virtualized big-data (10k+ rows)](#pattern-6--virtualized-big-data-10k-rows)
- [Row selection — checkbox column + bulk action bar](#row-selection--checkbox-column--bulk-action-bar)
- [Empty table state](#empty-table-state)
- [Sticky header + sticky first column](#sticky-header--sticky-first-column)
- [Cell type conventions (text, number, date, status, action)](#cell-type-conventions-text-number-date-status-action)

---

## Pattern 1 — Standard sortable table

The default — a 5-7 column table with sort arrows on headers, click
a row to navigate to detail.

```html
<article class="wf-card" style="padding:0;">
  <div class="wf-table">

    <div class="wf-table-row wf-table-row--head">
      <span class="wf-text" data-wf-lines="1">Name ↓</span>
      <span class="wf-text" data-wf-lines="1">Email</span>
      <span class="wf-text" data-wf-lines="1">Role</span>
      <span class="wf-text" data-wf-lines="1">Joined</span>
      <span class="wf-text" data-wf-lines="1">Status</span>
      <span class="wf-text" data-wf-lines="1"></span>
    </div>

    <a href="#screen-user-1" class="wf-table-row">
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="wf-avatar" style="width:32px; height:32px;"></span>
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Anna Chen</span>
      </div>
      <span class="wf-text" data-wf-lines="1"
            style="color:var(--vc-color-content-muted);">anna@example.com</span>
      <span class="wf-text" data-wf-lines="1">Admin</span>
      <span class="wf-text" data-wf-lines="1">May 10</span>
      <span class="wf-chip"
            style="background:var(--vc-color-success);
                   color:var(--vc-color-on-accent);">Active</span>
      <span class="wf-text" data-wf-lines="1">→</span>
    </a>

    <a href="#screen-user-2" class="wf-table-row">
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="wf-avatar" style="width:32px; height:32px;"></span>
        <span class="wf-text" data-wf-lines="1"
              style="font-weight:600;">Ben Park</span>
      </div>
      <span class="wf-text" data-wf-lines="1"
            style="color:var(--vc-color-content-muted);">ben@example.com</span>
      <span class="wf-text" data-wf-lines="1">Member</span>
      <span class="wf-text" data-wf-lines="1">May 5</span>
      <span class="wf-chip">Pending</span>
      <span class="wf-text" data-wf-lines="1">→</span>
    </a>

    <a href="#screen-user-3" class="wf-table-row">…</a>
    <a href="#screen-user-4" class="wf-table-row">…</a>

  </div>
</article>
```

### Notes

- Sortable headers show direction (`↓` desc, `↑` asc). The CURRENT
  sort column has the arrow; others don't.
- Each row is an anchor (`<a class="wf-table-row" href="…">`) —
  the whole row is the click target.
- First column has the entity's avatar + name (bold).
- Last column is a `→` arrow signal — visual cue for "clickable".
- Status uses semantic color chip.

---

## Pattern 2 — Compact list (denser than table)

For long lists where READABILITY beats DETAIL. No card, no
table-row structure, just rows of `<a>` elements.

```html
<nav style="display:flex; flex-direction:column;">

  <a href="#" style="display:flex; gap:12px;
                     padding:8px 16px;
                     border-bottom:1px solid var(--vc-color-border);
                     text-decoration:none;
                     align-items:center;">
    <span class="wf-avatar" style="width:24px; height:24px;"></span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Anna Chen</span>
    </div>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;
                 color:var(--vc-color-content-subtle);">2h ago</span>
  </a>

  <a href="#" style="display:flex; gap:12px;
                     padding:8px 16px;
                     border-bottom:1px solid var(--vc-color-border);
                     text-decoration:none;
                     align-items:center;">
    <span class="wf-avatar" style="width:24px; height:24px;"></span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1">Ben Park</span>
    </div>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;">5h ago</span>
  </a>

  <a href="#" style="display:flex; gap:12px;
                     padding:8px 16px;
                     border-bottom:1px solid var(--vc-color-border);
                     text-decoration:none;
                     align-items:center;">
    <span class="wf-avatar" style="width:24px; height:24px;"></span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1">Chris Doe</span>
    </div>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;">1d ago</span>
  </a>

</nav>
```

### Notes

- Tighter padding (`8px 16px` vs the default `12px`).
- Smaller avatars (24px vs the default 40px).
- Only 3 columns: avatar / name / timestamp.
- Good for 50-100 items in a small sidebar / drawer.

---

## Pattern 3 — Expandable rows (master-detail in one view)

Click a row to expand it inline — show details without leaving the
list.

```html
<article class="wf-card" style="padding:0;">
  <div class="wf-table">

    <div class="wf-table-row wf-table-row--head">
      <span class="wf-text" data-wf-lines="1">Order</span>
      <span class="wf-text" data-wf-lines="1">Date</span>
      <span class="wf-text" data-wf-lines="1">Total</span>
      <span class="wf-text" data-wf-lines="1">Status</span>
    </div>

    <details>
      <summary class="wf-table-row" style="cursor:pointer;">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">#ABC1234 ▾</span>
        <span class="wf-text" data-wf-lines="1">May 16</span>
        <span class="wf-text" data-wf-lines="1">$267.30</span>
        <span class="wf-chip"
              style="background:var(--vc-color-success);
                     color:var(--vc-color-on-accent);">Delivered</span>
      </summary>

      <div style="padding:16px;
                  background:var(--vc-color-surface-sunken);
                  border-bottom:1px solid var(--vc-color-border);
                  display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">

        <div>
          <span class="wf-label">Items</span>
          <p class="wf-text" data-wf-lines="3"></p>
        </div>

        <div>
          <span class="wf-label">Shipping to</span>
          <p class="wf-text" data-wf-lines="3"></p>
        </div>

        <div>
          <span class="wf-label">Tracking</span>
          <p class="wf-text" data-wf-lines="1"
             style="font-family:monospace;">TRK987654</p>
          <a class="wf-text" data-wf-lines="1" href="#">Track package →</a>
        </div>

      </div>
    </details>

    <details>
      <summary class="wf-table-row" style="cursor:pointer;">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">#DEF5678 ▸</span>
        <span class="wf-text" data-wf-lines="1">May 12</span>
        <span class="wf-text" data-wf-lines="1">$48.00</span>
        <span class="wf-chip"
              style="background:var(--vc-color-warning);
                     color:var(--vc-color-on-accent);">Shipped</span>
      </summary>
      <!-- collapsed body -->
    </details>

  </div>
</article>
```

### Notes

- Uses native `<details>` + `<summary>` — no JS.
- Disclosure indicator in the first cell (`▾` open, `▸` collapsed).
- Expanded body has a sunken background — visual distinction from
  the row above/below.
- For a wireframe showing the EXPANDED state, include the body
  markup. For COLLAPSED, omit it (or use empty body).

---

## Pattern 4 — Inline editable cells

Click a cell to edit it inline — no modal.

```html
<article class="wf-card" style="padding:0;">
  <div class="wf-table">

    <div class="wf-table-row wf-table-row--head">
      <span class="wf-text" data-wf-lines="1">Name</span>
      <span class="wf-text" data-wf-lines="1">Email</span>
      <span class="wf-text" data-wf-lines="1">Role</span>
    </div>

    <div class="wf-table-row">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Anna Chen</span>
      <span class="wf-text" data-wf-lines="1">anna@example.com</span>
      <span class="wf-text" data-wf-lines="1">Admin</span>
    </div>

    <!-- editing state — note the input override on the email cell -->
    <div class="wf-table-row"
         style="background:var(--vc-color-surface-sunken);">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Ben Park</span>
      <input class="wf-input"
             value="ben@example.com"
             style="border:2px solid var(--vc-color-accent);
                    padding:4px 8px;">
      <span class="wf-text" data-wf-lines="1">Member</span>
    </div>

    <div class="wf-table-row">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Chris Doe</span>
      <span class="wf-text" data-wf-lines="1">chris@example.com</span>
      <span class="wf-text" data-wf-lines="1">Viewer</span>
    </div>

  </div>
</article>
```

### Notes

- The row being edited has a sunken background — visual signal
  "you're editing this row".
- The cell being edited has an `<input>` with an accent border.
- Other cells in the editing row stay as plain text.
- Esc to cancel, Enter to commit (JS not shown in wireframe).

For a wireframe showing the editing state, render ONE row in
editing mode + the rest in display mode.

---

## Pattern 5 — Drag-to-reorder (sortable list)

A list where each row has a drag handle. The user drags to
reorder.

```html
<article class="wf-card" style="padding:0;">

  <div style="display:flex; gap:12px;
              padding:12px 16px;
              align-items:center;
              border-bottom:1px solid var(--vc-color-border);">
    <span style="cursor:grab;
                 color:var(--vc-color-content-subtle);
                 font-size:20px;">⋮⋮</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600; flex:1;">First item</span>
    <button class="wf-button wf-button--ghost">Edit</button>
  </div>

  <div style="display:flex; gap:12px;
              padding:12px 16px;
              align-items:center;
              border-bottom:1px solid var(--vc-color-border);">
    <span style="cursor:grab;
                 color:var(--vc-color-content-subtle);
                 font-size:20px;">⋮⋮</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600; flex:1;">Second item</span>
    <button class="wf-button wf-button--ghost">Edit</button>
  </div>

  <!-- the one being dragged — ghost state -->
  <div style="display:flex; gap:12px;
              padding:12px 16px;
              align-items:center;
              border-bottom:1px solid var(--vc-color-border);
              background:var(--vc-color-surface-sunken);
              outline:2px solid var(--vc-color-accent);
              transform:rotate(-1deg);
              opacity:0.7;">
    <span style="cursor:grabbing;
                 color:var(--vc-color-content);
                 font-size:20px;">⋮⋮</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600; flex:1;">Dragged item</span>
    <button class="wf-button wf-button--ghost">Edit</button>
  </div>

  <!-- drop indicator — a 2px accent line where the dragged item will land -->
  <div style="height:2px;
              background:var(--vc-color-accent);
              margin:0 16px;
              position:relative;">
    <span style="position:absolute;
                 left:-8px; top:-3px;
                 width:8px; height:8px;
                 background:var(--vc-color-accent);
                 border-radius:50%;"></span>
  </div>

  <div style="display:flex; gap:12px;
              padding:12px 16px;
              align-items:center;
              border-bottom:1px solid var(--vc-color-border);">
    <span style="cursor:grab;
                 font-size:20px;">⋮⋮</span>
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600; flex:1;">Fourth item</span>
    <button class="wf-button wf-button--ghost">Edit</button>
  </div>

</article>
```

### Notes

- The drag handle is `⋮⋮` (Unicode), `cursor: grab` for inactive
  state.
- The DRAGGED row gets: sunken background, accent outline,
  `rotate(-1deg)`, `opacity: 0.7`. The classic "this is being
  dragged" visual.
- The DROP INDICATOR is a 2px accent line with a small dot on the
  left tip — pattern from real-world drag UIs (Linear, Notion).
- For a static wireframe, show ONE row in dragged state + the
  drop indicator below it.

---

## Pattern 6 — Virtualized big-data (10k+ rows)

For tables with thousands of rows, virtualization renders only the
visible rows. From the user's perspective, the table looks normal —
the wireframe shows the same shape.

```html
<article class="wf-card" style="padding:0;">

  <header style="padding:12px 16px;
                 border-bottom:1px solid var(--vc-color-border);
                 display:flex; gap:12px; align-items:center;">
    <span class="wf-text" data-wf-lines="1">42,318 rows</span>
    <input class="wf-input" placeholder="Search" style="flex:1;">
    <button class="wf-button wf-button--ghost">Export CSV</button>
  </header>

  <div class="wf-table">
    <div class="wf-table-row wf-table-row--head">…</div>
    <div class="wf-table-row">…</div>
    <div class="wf-table-row">…</div>
    <div class="wf-table-row">…</div>
    <!-- imagine 100s more rows -->
  </div>

  <footer style="padding:12px 16px;
                 border-top:1px solid var(--vc-color-border);
                 display:flex; justify-content:space-between;
                 font-size:12px;
                 color:var(--vc-color-content-subtle);">
    <span>Showing 1–20 of 42,318</span>
    <span>Updated 2 min ago</span>
  </footer>

</article>
```

### Notes

- Row count is shown in the header AND footer ("42,318 rows" +
  "Showing 1–20 of 42,318").
- For wireframes, render ~10 rows — implicit "more rows scroll
  in".
- Critical: the table uses `overflow: visible` on the wrapping
  card. The PAGE scrolls; the table extends the page. NO inner
  scrollbar.
- Virtualization is a JS implementation detail (intersection
  observer + dummy spacers) — invisible to the user, invisible to
  the wireframe.

---

## Row selection — checkbox column + bulk action bar

For tables where the user can select multiple rows and act on
them in bulk.

```html
<article class="wf-card" style="padding:0;">

  <!-- bulk action bar — visible when 1+ rows selected -->
  <header style="padding:12px 16px;
                 background:var(--vc-color-surface-sunken);
                 border-bottom:1px solid var(--vc-color-border);
                 display:flex; gap:12px; align-items:center;">
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600;">3 selected</span>
    <button class="wf-button wf-button--ghost">Archive</button>
    <button class="wf-button wf-button--ghost">Move to…</button>
    <button class="wf-button wf-button--ghost"
            style="color:var(--vc-color-danger);">Delete</button>
    <button class="wf-button wf-button--ghost"
            style="margin-left:auto;">Clear selection</button>
  </header>

  <div class="wf-table">

    <div class="wf-table-row wf-table-row--head">
      <span style="width:24px;">
        <input type="checkbox">
      </span>
      <span class="wf-text" data-wf-lines="1">Name</span>
      <span class="wf-text" data-wf-lines="1">Email</span>
      <span class="wf-text" data-wf-lines="1">Status</span>
    </div>

    <!-- selected row -->
    <div class="wf-table-row"
         style="background:var(--vc-color-surface-sunken);">
      <span style="width:24px;">
        <input type="checkbox" checked>
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Anna</span>
      <span class="wf-text" data-wf-lines="1">anna@…</span>
      <span class="wf-chip">Active</span>
    </div>

    <!-- selected row -->
    <div class="wf-table-row"
         style="background:var(--vc-color-surface-sunken);">
      <span style="width:24px;">
        <input type="checkbox" checked>
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Ben</span>
      <span class="wf-text" data-wf-lines="1">ben@…</span>
      <span class="wf-chip">Active</span>
    </div>

    <!-- selected row -->
    <div class="wf-table-row"
         style="background:var(--vc-color-surface-sunken);">
      <span style="width:24px;">
        <input type="checkbox" checked>
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Chris</span>
      <span class="wf-text" data-wf-lines="1">chris@…</span>
      <span class="wf-chip">Pending</span>
    </div>

    <!-- unselected row -->
    <div class="wf-table-row">
      <span style="width:24px;">
        <input type="checkbox">
      </span>
      <span class="wf-text" data-wf-lines="1">Diana</span>
      <span class="wf-text" data-wf-lines="1">diana@…</span>
      <span class="wf-chip">Active</span>
    </div>

  </div>
</article>
```

### Notes

- Bulk action bar appears above the table when 1+ rows selected.
  Shows selection count + actions + Clear selection.
- Selected rows have a sunken background.
- Header has a checkbox in the FIRST column for select-all
  (renders as ∎ for partial selection, ✓ for all).
- For a wireframe showing the selected state, draw 3-4 rows
  selected.

---

## Empty table state

When the table has no rows:

```html
<article class="wf-card">
  <div style="padding:48px 16px;
              text-align:center;
              color:var(--vc-color-content-subtle);">

    <figure class="wf-image" style="width:120px; height:120px;
                                      margin:0 auto;
                                      border-radius:50%;"></figure>

    <h3 class="wf-text" data-wf-lines="1"
        style="font-size:18px;
               margin-top:16px;
               color:var(--vc-color-content);">
      No users yet
    </h3>

    <p class="wf-text" data-wf-lines="2"
       style="max-width:300px; margin:8px auto 24px;"></p>

    <button class="wf-button">Invite your first user</button>

  </div>
</article>
```

### Notes

- Centered content with icon + headline + body + CTA.
- See [`onboarding-flows.md`](onboarding-flows.md) for the full
  empty-state pattern.

---

## Sticky header + sticky first column

For wide tables that scroll horizontally (rare — wireframes
should AVOID inner scrollbars), the header row stays at the top
of the viewport when scrolling vertically.

```css
.wf-table .wf-table-row--head {
  position: sticky;
  top: 0;
  z-index: 1;
}
```

For tables with a "label" column that stays in view when scrolling
horizontally:

```css
.wf-table .wf-table-row > :first-child {
  position: sticky;
  left: 0;
  background: var(--vc-color-canvas);
  z-index: 1;
}
.wf-table .wf-table-row--head > :first-child {
  z-index: 2;   /* corner stays on top */
}
```

But REMEMBER: the wireframe rule is NO INNER SCROLLBARS. A wide
table should EXTEND the page; the page scrolls horizontally. Sticky
columns are for the production app, not the wireframe.

---

## Cell type conventions (text, number, date, status, action)

Each cell type has a conventional treatment:

### Text

```html
<span class="wf-text" data-wf-lines="1">Plain text</span>
```

Single-line `wf-text`. For multi-line cells, use `data-wf-lines="2"`.

### Number / currency

```html
<span class="wf-text" data-wf-lines="1"
      style="text-align:right; font-variant-numeric:tabular-nums;">
  $1,234.56
</span>
```

Right-aligned, monospace-numerals. `font-variant-numeric:
tabular-nums` keeps digit widths consistent so numbers in adjacent
rows align visually.

### Date

```html
<span class="wf-text" data-wf-lines="1">May 16, 2026</span>
```

Use long-form (May 16, 2026) for important dates, short-form
(May 16) for relative recency, ISO (2026-05-16) for technical
contexts.

### Status

```html
<span class="wf-chip"
      style="background:var(--vc-color-success);
             color:var(--vc-color-on-accent);">Active</span>
```

Colored chip. The COLOR + LABEL together carry meaning (color alone
isn't accessible).

### Action

```html
<a href="#screen-detail" class="wf-text" data-wf-lines="1"
   style="color:var(--vc-color-accent);">View →</a>
```

Or a small ghost button:

```html
<button class="wf-button wf-button--ghost"
        style="padding:4px 8px;">Edit</button>
```

Actions go in the LAST column. For multiple actions per row,
prefer a `⋮` menu button that opens a popover (see
[`modal-and-overlay-patterns.md`](modal-and-overlay-patterns.md)).
