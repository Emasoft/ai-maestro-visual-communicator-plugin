# Before / after — the 2-column compare variant

The single most common comparison shape: "this was wrong, this is
right". Two columns, the right one emphasised, the rest is curated
content. Variants for anti-pattern→fix, baseline→improvement, and
prose-style A/B.

## Table of contents

- [Why the 2-column case is special](#why-the-2-column-case-is-special)
- [The canonical shape](#the-canonical-shape)
- [Choosing the emphasis side](#choosing-the-emphasis-side)
- [Picking icons — open vs filled](#picking-icons--open-vs-filled)
- [Author the criterion column with intent](#author-the-criterion-column-with-intent)
- [Inline code in cells — `<code>` is fine](#inline-code-in-cells--code-is-fine)
- [Showing metrics — left + right + the delta](#showing-metrics--left--right--the-delta)
- [Sample — anti-pattern → fix (the readability bundled set)](#sample--anti-pattern--fix-the-readability-bundled-set)
- [Sample — baseline → improvement (perf)](#sample--baseline--improvement-perf)
- [Sample — A/B prose style](#sample--ab-prose-style)
- [Pairing with the per-row pill](#pairing-with-the-per-row-pill)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## Why the 2-column case is special

Three-and-up comparisons typically present neutral options for the
reader to pick from; the 2-column case is almost always
**asymmetric** — one side is wrong (or worse, or before), one side
is right (or better, or after). The author has a verdict and uses
the table to argue for it.

The emphasis column is the verdict. The reader's eye lands on the
accent lane and reads the criterion column to understand WHAT
specifically the verdict is about, then reads the wrong side for
WHAT'S WRONG. This is the inverted reading flow of a 3-column
recommendation table.

## The canonical shape

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">{Criterion column header}</th>
      <th scope="col" data-ve-col-icon="○">{Wrong side label}</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">{Right side label}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">{criterion 1}</th>
      <td>{wrong value}</td>
      <td>{right value}</td>
    </tr>
    ...
  </tbody>
</table>
```

Three header cells: criterion / wrong / right. N body rows, each
with a `<th scope="row">` criterion label and two values. The right
column carries the emphasis attribute and the filled icon.

## Choosing the emphasis side

By convention the emphasis sits on the **right** — Western reading
order, so the eye lands on it last and remembers it. The "before"
side is on the left.

| Style | Left column | Right (emphasised) |
|---|---|---|
| Anti-pattern → fix | Anti-pattern | Fix |
| Before / After | Before | After |
| Without X / With X | Without X | With X |
| Baseline → Improvement | Baseline | Improvement |
| Bad practice / Good practice | Bad | Good |
| Slow path / Fast path | Slow | Fast |

The exception: if the "answer" is the leftmost option in a 3-column
comparison (rare; usually means a recommendation against an option),
the emphasis can sit on the left. Don't fight conventions if there's
no reason to.

## Picking icons — open vs filled

The 2-column case uses:

| Wrong side | Right side |
|---|---|
| `○` (open circle) | `◆` (filled diamond) |

The asymmetry of shape (circle vs diamond) reinforces the asymmetry
of meaning. Same shape on both sides (`○` and `●`) would also work;
mixing shapes is preferred because the eye discriminates faster.

If the comparison is about progress/improvement specifically, an
arrow shape is intuitive:

| Wrong side | Right side |
|---|---|
| `▽` (open down triangle — going wrong way) | `△` (open up triangle — going right way) |

Or for "regression / recovery":

| Wrong side | Right side |
|---|---|
| `▼` (filled down) | `▲` (filled up) |

The icon is the author's call; the rank (open vs filled, or
direction) is what carries the meaning.

## Author the criterion column with intent

The criterion column's header label communicates the AXIS of
comparison:

| Bad header label | Good header label |
|---|---|
| `Item` (too generic) | `CSS property` (specific) |
| `Thing` | `Metric` |
| `Row` | `Aspect` |

A "Aspect" or "Criterion" or "Metric" reads as "what this row is
about" — even before the body cells make the comparison concrete.

The criterion cells (`<th scope="row">`) name a single dimension:
"Line length" (not "Width-related stuff"); "Hyphenation" (not
"Word-break"); "p99 latency" (not "Speed").

## Inline code in cells — `<code>` is fine

The cells routinely carry inline code:

```html
<td><code>width: 100%</code> on a prose column</td>
<td><code>max-width: 65ch; margin-inline: auto</code></td>
```

The `<code>` element keeps the snippet visually distinct (monospace)
and selectable as a unit. The runtime's default `<code>` styling
(small monospace, surface background) is fine; no special table
class needed.

For multi-line code, prefer a separate `<pre>` block outside the
table — table cells should hold short comparisons, not full snippets.

## Showing metrics — left + right + the delta

For a metrics comparison, lead with the metric, then the two values,
then optionally the delta:

```html
<tr>
  <th scope="row">p99 latency</th>
  <td>1.4 s</td>
  <td>180 ms <small>(−87%)</small></td>
</tr>
```

The delta sits inside the emphasised cell to keep the "after" lane
self-contained. Use `<small>` for the delta so it visually subordinates
to the main number.

Don't pre-compute the delta if it would lie ("−87%" is correct for
1400 → 180 ms; "−87.14%" would be over-precise). Round to whole
percent.

## Sample — anti-pattern → fix (the readability bundled set)

The plugin ships [sample-readability-dataset.md](
../../amvcp-tables-primitives/references/sample-readability-dataset.md) — a 15-row paste-in for prose
readability anti-patterns. Excerpt:

```html
<table data-ve-table="compare" data-ve-table-csv="1"
       data-ve-label="Prose readability — anti-patterns and fixes">
  <thead>
    <tr>
      <th scope="col">Aspect</th>
      <th scope="col" data-ve-col-icon="○">Anti-pattern</th>
      <th scope="col" data-ve-col-icon="◆" data-ve-col-emphasis="1">Fixed</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Line length</th>
        <td><code>width: 100%</code> on a prose column</td>
        <td><code>max-width: 65ch; margin-inline: auto</code></td></tr>
    <tr><th scope="row">Text alignment</th>
        <td><code>text-align: justify</code> (rivers of whitespace)</td>
        <td><code>text-align: start</code></td></tr>
    <!-- ... 13 more rows in the bundled sample ... -->
  </tbody>
</table>
```

## Sample — baseline → improvement (perf)

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Metric</th>
      <th scope="col" data-ve-col-icon="▽">Baseline</th>
      <th scope="col" data-ve-col-icon="△"
          data-ve-col-emphasis="1">After SSR + edge cache</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">p99 latency</th>
      <td>1.4 s</td>
      <td>180 ms <small>(−87%)</small></td>
    </tr>
    <tr>
      <th scope="row">Time-to-first-byte</th>
      <td>820 ms</td>
      <td>42 ms <small>(−95%)</small></td>
    </tr>
    <tr>
      <th scope="row">Cost per 1M requests</th>
      <td>$24.10</td>
      <td>$3.80 <small>(−84%)</small></td>
    </tr>
    <tr>
      <th scope="row">Error rate (5xx)</th>
      <td>2.1%</td>
      <td>0.12% <small>(−94%)</small></td>
    </tr>
  </tbody>
</table>
```

The down/up arrow icons reinforce the direction of the change. The
deltas inside the right column read as a victory lap; the
unemphasized left column reads as the "before" baseline the right
column eclipses.

## Sample — A/B prose style

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Style aspect</th>
      <th scope="col" data-ve-col-icon="○">Draft A — first attempt</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Draft B — chosen</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Opening line</th>
      <td>"There are many factors to consider when…"</td>
      <td>"The first thing to know:"</td>
    </tr>
    <tr>
      <th scope="row">Section headings</th>
      <td>Generic ("Introduction", "Background")</td>
      <td>Specific ("Why this is the wrong shape", "Three options")</td>
    </tr>
    <tr>
      <th scope="row">Bullet density</th>
      <td>3+ levels of nested bullets</td>
      <td>Flat; sub-points become numbered steps</td>
    </tr>
  </tbody>
</table>
```

A 2-column compare table is a particularly effective way to argue
for an editorial choice — show the two versions side-by-side and
the reader sees the improvement.

## Pairing with the per-row pill

The decision-mini pill (S/A/D — Skip / Approve / Deny) attaches per
ROW in compare tables (the row IS the criterion; "Approve this
fix" or "Deny this fix" is the natural granularity).

This pairing means the reader can:
1. Read the table to absorb the comparison.
2. S/A/D each row to record their verdict per-criterion.
3. Optionally select rows for a group comment.

The pill state persists to localStorage keyed on the row's
`data-ve-comment-id`. A page refresh restores the per-row decisions.

## DESIGN.md tokens consumed

Inherited from [comparison-emphasis-column.md](
../../amvcp-tables-matrix-compare/references/comparison-emphasis-column.md) and
[icon-headers-unicode.md](../../amvcp-tables-cells-badges/references/icon-headers-unicode.md):

| Token | Used by |
|---|---|
| `--vc-color-accent` | emphasis lane (10% wash + 2px borders + icon recolor) |
| `--vc-color-content-muted` | non-emphasised icon color |
| `--vc-space-1` | icon-to-label margin |

## Selection / comment / decision-mini notes

- Each `<tr>` is a row-atom — "comment on the whole criterion".
- Each body `<td>` is an element-kind atom — "comment on this
  specific value". The dual contract is the same as 3-column
  compare (see [comparison-emphasis-column.md](
  ../../amvcp-tables-matrix-compare/references/comparison-emphasis-column.md)).
- Header `<th>` cells are not atoms.
- The decision-mini pill attaches to rows and cells.

## CSV-export contract

The 2-column compare exports as a 3-field CSV: criterion, wrong,
right. The icon and emphasis are NOT in the export:

```csv
Aspect,Anti-pattern,Fixed
Line length,"width: 100% on a prose column","max-width: 65ch; margin-inline: auto"
Text alignment,"text-align: justify (rivers of whitespace)","text-align: start"
```

The receiving spreadsheet sees a normal 3-column CSV. If the author
wants the CSV to carry the verdict, put "(recommended)" in the
right-column header text — that string exports verbatim and survives
through the spreadsheet.
