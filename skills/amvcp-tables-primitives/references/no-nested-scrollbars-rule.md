# No nested scrollbars — the runtime invariant

Why `amvcp-tables.js` never introduces a `<div style="overflow:auto">`
wrapper, never sets `overflow:scroll` on a `<table>`, never offers a
"max-height" prop, and how virtualization + frozen columns are
designed around this constraint.

## Table of contents

- [The rule](#the-rule)
- [Why the rule exists](#why-the-rule-exists)
- [The runtime's enforcement](#the-runtimes-enforcement)
- [Wide tables — let the page widen](#wide-tables--let-the-page-widen)
- [Tall tables — let the page grow](#tall-tables--let-the-page-grow)
- [How virtualization respects this](#how-virtualization-respects-this)
- [How frozen columns respect this](#how-frozen-columns-respect-this)
- [The text-wrap exception (and why it doesn't apply to tables)](#the-text-wrap-exception-and-why-it-doesnt-apply-to-tables)
- [Common anti-patterns to remove on sight](#common-anti-patterns-to-remove-on-sight)
- [Sample — wide table with horizontal page scroll](#sample--wide-table-with-horizontal-page-scroll)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The rule

From `~/.claude/rules/no-nested-scrollbars.md`:

> Never create nested scrollviews. When content is wider or taller
> than the viewport, **let the page itself expand** to contain it.
> The document's own scrollbars are the only scrollbars permitted —
> never introduce inner `overflow:auto` / `overflow:scroll` boxes
> with their own scrollbars.

Tables are explicitly called out:

> `table { display: block; overflow-x: auto }` — common "responsive
> table" pattern that produces an inner horizontal scrollbar.
> **Forbidden.**

This rule is a HARD invariant — not a guideline, not a preference.
Every table the plugin renders obeys it. The runtime's CSS enforces
it via `!important`; the module's modes are designed around it.

## Why the rule exists

Two scrollbars in one page (the document's + an inner box's) is a
usability disaster:

| Failure | Consequence |
|---|---|
| Scroll inertia gets stolen | the reader's flick scrolls the inner box past its end, then waits for a re-flick to scroll the page; the rhythm is broken |
| Find-in-page misses content | Ctrl+F searches the visible DOM; the inner box's off-screen area is hidden, so the next match might be in the inner box AND OFF-screen — the user can't tell |
| Screen-reader navigation breaks | screen readers navigate by headings, landmarks, regions; an inner scrollbox is a navigation dead end the SR can't pop out of |
| Screenshots are partial | a screenshot captures only the visible inner-box content, not the off-screen rows; communication via screenshots fails |
| Mouse-wheel direction is ambiguous | the reader doesn't know which scrollbar will receive their scroll — depends on where the cursor sits |
| Reader's mental model breaks | one document, one scroll axis. Inner scrollers violate that model. |

These are not theoretical. Every team that has shipped an
"overflow:auto inside a report" has hit them and walked back.

## The runtime's enforcement

`amvcp-runtime.js` forces all tables and their wrappers to
`overflow: visible`:

```css
table, .ve-table-wrapper,
[data-ve-table-wrapper], [data-ve-block], [data-ve-graph] {
  overflow: visible !important;
  max-width: none !important;
}
table { display: table !important; }
```

A naive `<div style="overflow:auto"><table>...</table></div>`
gets its overflow STRIPPED — the `div` reverts to `overflow:visible`.
An author who really wanted the inner scrollbar cannot get it from
this stylesheet; they'd have to override the runtime's `!important`
with their own `!important`, which would be a violation of the rule
they'd need to consciously commit.

`!important` on user-friendly rules is generally a smell — it
indicates the author is fighting against the cascade. Here it's
correct: the rule IS the policy, and CSS cascade priority is the
enforcement mechanism.

## Wide tables — let the page widen

A table with 12 columns of varying widths might be 1800px wide on a
1280px viewport. The page extends:
- The document gets a horizontal scrollbar (the document's, not the
  table's).
- The reader scrolls right to see the right-hand columns.
- The frozen-columns affordance (see [frozen-columns-sticky.md](
  ../../amvcp-tables-sort-virt/references/frozen-columns-sticky.md)) keeps the row identifier visible.

The horizontal scroll is the document's; there is exactly one
horizontal scrollbar on the page.

If the page has other content beside the table (e.g. body text), the
other content stays the document width — the page widens, the
content reflows, the table is just one wide element among normal-
width siblings.

## Tall tables — let the page grow

A table with 2000 rows is naturally tall. The page grows; the
document scrolls vertically; the sticky `<thead>` (under
virtualization mode) pins the header to the viewport top.

A "max-height: 600px; overflow-y: auto" wrapper would have given the
table its own vertical scrollbar — and broken Find-in-page, screen-
reader navigation, scroll inertia. The rule explicitly forbids it.

For genuinely huge row counts (5000+), virtualization keeps DOM size
manageable. The virtual rows STILL extend the page to the full
2000-row height (via two spacer rows); the visible-window logic only
controls which rows are in the DOM. The reader sees the document
scrollbar represent the full 2000 rows.

## How virtualization respects this

The conventional virtualization approach is:

```html
<!-- ❌ FORBIDDEN -->
<div style="height: 600px; overflow: auto">
  <table>...thousands of rows...</table>
</div>
```

An inner 600px scrollbox is exactly what the rule forbids. The
module's virtualization is fundamentally different:

```html
<!-- ✓ correct — window-scroll virtualization -->
<table data-ve-table="data" data-ve-table-virtual="1">
  <thead><tr>...</tr></thead>
  <tbody>
    <tr data-ve-table-spacer>...top spacer reserves N×rowHeight...</tr>
    <tr>...visible rows in DOM...</tr>
    <tr data-ve-table-spacer>...bottom spacer reserves M×rowHeight...</tr>
  </tbody>
</table>
```

The table extends the full virtual height via two empty spacer rows.
The page scrollbar reflects the full virtual height. As the **page**
scrolls, the module updates which rows live in the visible window.
No inner scrollbar — see [virtualization-window-scroll.md](
../../amvcp-tables-sort-virt/references/virtualization-window-scroll.md) for the full algorithm.

## How frozen columns respect this

Frozen columns are visually identical to the "freeze first column"
Excel/Sheets affordance — first column stays visible while the rest
scrolls horizontally. The naive implementation uses
`overflow-x: auto` on a wrapper; the module instead uses
`position: sticky; left: <offset>` on the frozen cells.

`position: sticky` needs NO scroll container. It sticks relative to
the nearest scrollable ancestor, which can be the `<html>` element
(the document viewport). The frozen cells stick within the
document's horizontal scroll — no inner scrollbox required.

See [frozen-columns-sticky.md](../../amvcp-tables-sort-virt/references/frozen-columns-sticky.md) for the
full sticky-positioning implementation.

## The text-wrap exception (and why it doesn't apply to tables)

The rule has one exception: text content (paragraphs, list items,
inline prose) MAY rely on natural text-wrapping to fit the viewport
width. CSS already does this by default; the rule is about NOT
forcing `white-space: nowrap` on prose just to bend the rule.

This exception does NOT apply to tables:
- Table cells CAN wrap, but the table's COLUMN STRUCTURE is the
  table's identity; collapsing 12 columns into 3 to fit viewport
  width would destroy the table.
- Numbers in numeric columns shouldn't wrap (it breaks tabular
  alignment).
- Code snippets in cells shouldn't wrap (it breaks the snippet's
  syntax).

So tables stay wide; the page widens.

The runtime's default cell CSS is `overflow-wrap: anywhere`, which
allows prose-heavy cells to wrap. That's the only "wrapping" the
table participates in.

## Common anti-patterns to remove on sight

When auditing a page, these all violate the rule:

```css
/* ❌ all of these create inner scrollbars */
.table-wrapper { overflow-x: auto; }
.table-wrapper { overflow-y: scroll; max-height: 600px; }
table { display: block; overflow-x: auto; }
table { overflow: auto; }
.responsive-table { overflow-x: scroll; }
.scrollable-table { max-height: 80vh; overflow: auto; }
```

```html
<!-- ❌ inline equivalents -->
<div style="overflow:auto"><table>...</table></div>
<div style="max-height:400px;overflow-y:scroll"><table>...</table></div>
<table style="display:block;overflow-x:auto">...</table>
```

All forbidden. The fix: remove the overflow / max-height; let the
page expand; if it's a huge data table, opt into the module's
virtualization.

## Sample — wide table with horizontal page scroll

```html
<!-- correct shape: no wrapper overflow, no inner scrollbar -->
<table data-ve-table="data"
       data-ve-table-virtual="1"
       data-ve-freeze-cols="2">
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Name</th>
      <th scope="col">Region</th>
      <th scope="col">Sector</th>
      <th scope="col">Rev 2024</th>
      <th scope="col">Rev 2025</th>
      <th scope="col">Growth %</th>
      <th scope="col">Margin %</th>
      <th scope="col">FTEs</th>
      <th scope="col">Owner</th>
      <th scope="col">Status</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <!-- N rows -->
  </tbody>
</table>
```

On a narrow viewport this table is wider than the page. The DOCUMENT
gets a horizontal scrollbar; ID and Name stay sticky-left; the rest
scrolls. Vertically the page grows with the table's full height (via
virtualization spacers); the DOCUMENT scrollbar represents the full
row count.

Zero inner scrollbars.

## DESIGN.md tokens consumed

None — this rule is a layout invariant, not a visual one. The
runtime's `overflow: visible !important` is unconditional and
doesn't read any token.

## Selection / comment / decision-mini notes

The selection / comment / decision-mini contracts attach to row and
cell atoms. Their visual positioning uses
`getBoundingClientRect()` which returns the on-screen position
correctly whether the page is scrolled horizontally, vertically, or
both. The no-nested-scrollbars rule has zero impact on these
contracts.

A row in a virtualized table that scrolls off-screen LOSES its DOM —
along with its selection / comment / decision-mini visuals. The
underlying state (the JS-array row reference, the localStorage
decision state, the comment-thread map) is preserved; the visuals
reappear when the row scrolls back in.

## CSV-export contract

CSV export reads the full data set, not just the visible window
(see [csv-export-rfc4180.md](../../amvcp-tables-sort-virt/references/csv-export-rfc4180.md)). The
no-nested-scrollbars rule doesn't affect the export — the export is a
data operation, not a rendering operation.
