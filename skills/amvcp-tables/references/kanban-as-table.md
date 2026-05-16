# Kanban as table — 4-column "Now / Next / Later / Cut" pattern

A 4-column kanban-style triage table where each column has a
distinct top-border color (clay / olive / gray-500 / gray-200) and
rows are tickets. Optionally drag-to-reorder; always export-as-
markdown. The compact alternative to a full kanban board for "we
need to triage 24 items" use cases.

## Table of contents

- [The shape](#the-shape)
- [Why a table instead of cards](#why-a-table-instead-of-cards)
- [The 4-column convention — Now / Next / Later / Cut](#the-4-column-convention--now--next--later--cut)
- [Column-top color border = the priority signal](#column-top-color-border--the-priority-signal)
- [One ticket per cell](#one-ticket-per-cell)
- [Ragged columns — columns of unequal length](#ragged-columns--columns-of-unequal-length)
- [Optional drag-to-reorder (out of scope for tables module)](#optional-drag-to-reorder-out-of-scope-for-tables-module)
- [Export as markdown — the "throwaway editor" pattern](#export-as-markdown--the-throwaway-editor-pattern)
- [Sample HTML — static kanban table](#sample-html--static-kanban-table)
- [Sample HTML — kanban with summary footer counts](#sample-html--kanban-with-summary-footer-counts)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ NOW (clay)  │ NEXT (olive)│ LATER (g500)│ CUT (g200)  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ #1184 fix   │ #1192 deps  │ #1199 docs  │ #1201 spike │
│ #1186 perf  │ #1195 refac │ #1200 test  │             │
│ #1188 api   │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

A regular `<table>` with one `<thead>` row for the column titles
(each with its priority color as a top-border) and N `<tbody>` rows
holding the tickets. The reader scans columns top-to-bottom to see
the bucket's contents.

Used for: PR triage, ticket grooming, design exploration backlog,
release planning, retrospective bins. Wherever the answer is
"sort these into priority buckets".

## Why a table instead of cards

The kanban-board metaphor (separate columns of draggable cards) is
common but heavy. The table form is lighter when:
- The items are short labels (1–3 words each), not full cards with
  descriptions / avatars / labels.
- The total count is small enough to fit on one screen (10–30 items).
- The output is "a markdown summary the reader can paste into a
  ticket / doc / email" rather than "an evolving live board".

The pattern is from `18-editor-triage-board` (re-framed as a table
instead of a JS kanban app — same data shape, lighter ergonomics).

## The 4-column convention — Now / Next / Later / Cut

The canonical bucket labels:
- **Now** — being worked on / next up this cycle.
- **Next** — planned for the cycle after.
- **Later** — deferred but not abandoned.
- **Cut** — explicitly dropped (the visible record of "we
  considered this and said no").

The fourth column ("Cut") is critical — without it, dropped items
disappear from the record and someone re-raises them next cycle.

Alternative bucket sets:
- **MoSCoW** — Must / Should / Could / Won't (the requirements
  prioritisation framework).
- **High / Med / Low / N/A** — for risk-style triage.
- **Done / Doing / Blocked / Cut** — for in-progress tracking.

Pick a convention per report and stay consistent across the project's
backlog so the reader builds up the convention's meaning.

## Column-top color border = the priority signal

Each column header carries a 3px top border in its priority color:

```css
.kanban th { padding: 10px 12px; text-align: left; font-weight: 600; }
.kanban th.now    { border-top: 3px solid var(--vc-color-danger,  #D97757); }
.kanban th.next   { border-top: 3px solid var(--vc-color-success, #788C5D); }
.kanban th.later  { border-top: 3px solid var(--vc-color-content-muted, #5b5343); }
.kanban th.cut    { border-top: 3px solid var(--vc-color-border-strong, #c9bfa3); }
```

The colors descend in attention weight:
- **Clay/danger** (Now) — loud, says "look here first".
- **Olive/success** (Next) — calm but present.
- **Mid-gray** (Later) — recedes.
- **Light gray** (Cut) — visually faded.

The reader's eye lands on Now without being told to.

The choice of `--vc-color-danger` for "Now" might seem aggressive —
but Now does carry urgency, and the reader expects the loudest
color on the urgent column. If "Now" feels too alarming, swap to
`--vc-color-accent` (the project's main accent — typically gold/
amber) for a calmer Now signal.

## One ticket per cell

Each body row has 4 cells (one per column); each cell either holds
ONE ticket or is empty:

```html
<tr>
  <td>#1184 — fix sort + virtualization</td>
  <td>#1192 — bump runtime deps</td>
  <td>#1199 — write skill docs</td>
  <td>#1201 — spike: 3D table view</td>
</tr>
```

Each ticket fits on one row of its cell (1–8 words). If a ticket
description is longer, it belongs in a separate document (a ticket
tracker, a PRD); the kanban table is a TRIAGE artefact, not a
specification.

The ticket id (`#1184`) is the primary identifier — the title is
context. Use the same ID format throughout the report (always with
`#`, always with the leading zeros if your tracker pads).

## Ragged columns — columns of unequal length

The Now column might have 4 tickets while the Cut column has 1. The
shorter columns just have empty cells in the lower rows:

```html
<tr>
  <td>#1186 — perf regression</td>
  <td></td>
  <td></td>
  <td></td>
</tr>
```

Empty cells stay borderless visually (the runtime's standard 1px
border still draws, but the empty interior reads as "this column has
nothing here for this row"). The reader scans column-by-column and
ignores empties; the row count is determined by the longest column.

This is preferred to "rebalancing" by reordering tickets across rows
— the row position has no meaning in a kanban; only the column does.

## Optional drag-to-reorder (out of scope for tables module)

The `18-editor-triage-board` reference had full drag-and-drop
reordering. The tables module does NOT ship this — it is interactive
UI, not a static table feature. An author who wants drag-to-reorder
needs to compose:
- The static kanban table from this reference.
- A draggable-row helper from `amvcp-interactive-controls` (not yet
  shipped; planned).
- A "Copy as markdown" button from the author's own code.

For most reports, the static kanban-as-table is enough — the
author updates the source HTML in the next render of the report.

## Export as markdown — the "throwaway editor" pattern

A kanban table's natural export is markdown:

```markdown
## Now
- #1184 — fix sort + virtualization
- #1186 — perf regression
- #1188 — api stabilisation

## Next
- #1192 — bump runtime deps
- #1195 — refactor selection model

## Later
- #1199 — write skill docs
- #1200 — exhaustive sort test

## Cut
- #1201 — spike: 3D table view
```

The author can hand-author this markdown form OR include it
alongside the HTML table. The CSV export is also available
(`data-ve-table-csv="1"`), but markdown is the more natural format
for a triage list a reader will paste into a ticket comment or a
team chat.

A future enhancement could add a "Copy as markdown" button
alongside the "Copy CSV" button (one extra opt-in attribute,
`data-ve-table-markdown="1"`). Not shipped today.

## Sample HTML — static kanban table

```html
<table class="kanban" data-ve-table="data" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col" class="now">NOW</th>
      <th scope="col" class="next">NEXT</th>
      <th scope="col" class="later">LATER</th>
      <th scope="col" class="cut">CUT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#1184 — fix sort + virtualization</td>
      <td>#1192 — bump runtime deps</td>
      <td>#1199 — write skill docs</td>
      <td>#1201 — spike: 3D table view</td>
    </tr>
    <tr>
      <td>#1186 — perf regression</td>
      <td>#1195 — refactor selection model</td>
      <td>#1200 — exhaustive sort test</td>
      <td></td>
    </tr>
    <tr>
      <td>#1188 — api stabilisation</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>
```

The `data-ve-table="data"` opt-in gives the reader the option to
sort columns — usually undesired in a kanban (the row positions are
not meaningful), so consider adding `<th data-ve-nosort>` to every
column. Or drop the `data-ve-table` opt-in entirely and use a plain
`<table class="kanban">` — the styling is in author CSS, not the
module.

## Sample HTML — kanban with summary footer counts

```html
<table class="kanban">
  <thead>
    <tr>
      <th scope="col" class="now">NOW</th>
      <th scope="col" class="next">NEXT</th>
      <th scope="col" class="later">LATER</th>
      <th scope="col" class="cut">CUT</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>#1184</td><td>#1192</td><td>#1199</td><td>#1201</td></tr>
    <tr><td>#1186</td><td>#1195</td><td>#1200</td><td></td></tr>
    <tr><td>#1188</td><td></td><td></td><td></td></tr>
  </tbody>
  <tfoot>
    <tr>
      <td>3 now</td>
      <td>2 next</td>
      <td>2 later</td>
      <td>1 cut</td>
    </tr>
  </tfoot>
</table>
```

The footer surfaces the per-column count — the reader sees the
shape ("3 / 2 / 2 / 1") without counting cells. Author CSS can
style the footer differently (border-top, italic) to mark it as
summary.

The matrix-summary attribute (`data-ve-matrix-summary`) is for
glyph-cell counts, NOT for kanban counts; it doesn't help here.
Hand-author the footer row.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-danger` | Now column top-border |
| `--vc-color-success` | Next column top-border |
| `--vc-color-content-muted` | Later column top-border |
| `--vc-color-border-strong` | Cut column top-border |

The pattern relies on the 4 colors being distinguishable in both
themes. The DESIGN.md engine ensures that — light theme has 4
visually-distinct colors, dark theme has 4 visually-distinct
colors (brighter, but still in the same hue families).

## Selection / comment / decision-mini notes

Each `<tr>` is a row-atom — selectable as a group of 4 tickets
across the columns. Useful for "comment on this row" if rows have
some meaning (e.g. rows are grouped by team or week).

Each `<td>` is NOT a per-cell atom by default in `data` mode — only
`compare` mode dual-stamps. To make each ticket cell its own atom
(comment on a specific ticket), use `data-ve-table="compare"` (the
compare mode stamps each body `<td>`):

```html
<table data-ve-table="compare" class="kanban">
  ...
</table>
```

This gives per-ticket comment + decision-mini affordance — useful
when the kanban is the triage canvas for a real discussion.

## CSV-export contract

With `data-ve-table-csv="1"`, the export is a 4-column CSV:

```csv
NOW,NEXT,LATER,CUT
#1184 — fix sort + virtualization,#1192 — bump runtime deps,#1199 — write skill docs,#1201 — spike: 3D table view
#1186 — perf regression,#1195 — refactor selection model,#1200 — exhaustive sort test,
#1188 — api stabilisation,,,
```

Empty cells become empty fields. The receiving spreadsheet sees a
4-column ragged table; pandas / Sheets / Excel handle it correctly.

For the markdown export (a separate format), the author would
serialise each column as a `## NOW` / `## NEXT` / … section with
bullet rows — but that's a separate render path, not the CSV.
