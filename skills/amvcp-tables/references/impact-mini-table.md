# Impact mini-table — 2-col label/value with right-aligned numbers

The compact "incident impact" / "perf snapshot" / "deploy stats"
shape: a 2-column table, label on the left (prose), number on the
right (mono, right-aligned). Bounded width, no header, no sort.
The cleanest way to present 3-8 key/value pairs as a single visual.

## Table of contents

- [The shape](#the-shape)
- [Why no header row](#why-no-header-row)
- [Author it as a `data` table with `nosort` everywhere](#author-it-as-a-data-table-with-nosort-everywhere)
- [Right-aligning the value column](#right-aligning-the-value-column)
- [Mono-spaced numbers — tabular-nums](#mono-spaced-numbers--tabular-nums)
- [Max-width 460px](#max-width-460px)
- [Comparison to a list](#comparison-to-a-list)
- [Sample — incident impact](#sample--incident-impact)
- [Sample — perf snapshot](#sample--perf-snapshot)
- [Sample — deploy stats](#sample--deploy-stats)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌────────────────────────────────┐
│  Users affected         11,420 │
│  Sessions impacted      28,910 │
│  Region                   EMEA │
│  Duration               47 min │
└────────────────────────────────┘
```

A 2-column table, label on the left (free text), value on the right
(monospace number, right-aligned). 3–8 rows. Total width capped
(typically 360–500px) so the visual feels like a compact "stats
panel" rather than a wide data grid.

Often sits as a section block inside a report — e.g. the
"Impact" section of an incident postmortem (where the canonical
pattern from `12-incident-report` originated).

## Why no header row

The mini-table is a key/value list, not a data set. Headers
("Metric / Value") would be tautological — every row is a metric,
every right cell is a value. Headers waste space.

Without a header, the table is just `<tbody>`:

```html
<table data-ve-table="data" data-ve-mini-table>
  <tbody>
    <tr><td>Users affected</td><td>11,420</td></tr>
    ...
  </tbody>
</table>
```

The `data-ve-mini-table` is an AUTHOR-defined hint class for the
author's own CSS — the MODULE has no concept of mini-table. The
shape comes from layout, not from a mode flag.

## Author it as a `data` table with `nosort` everywhere

To opt into the module's sortable behaviour (which would let the
reader sort label-vs-value alphabetically — usually meaningless for
a mini-table), the `data-ve-table="data"` opt-in is mostly NOT
useful here. Two patterns:

### Option A — plain `<table>`, no module enhancement

```html
<table class="mini-stats">
  <tbody>
    <tr><td>Users affected</td><td>11,420</td></tr>
  </tbody>
</table>
```

Author CSS handles the styling. Most economical; the table is just
a layout primitive.

### Option B — `data-ve-table="data"` with no sortable header

```html
<table data-ve-table="data" class="mini-stats">
  <tbody>
    <tr><td>Users affected</td><td>11,420</td></tr>
  </tbody>
</table>
```

Without a `<thead>`, the module's sort path finds no header row and
no-ops (`firstHeaderRow` returns the first body row in that case;
the module wires it as sortable). To prevent the body row's first
cell from becoming sortable in this absent-thead path, add a
`<thead>` with a row of `data-ve-nosort` headers… which makes the
shape worse.

**Recommended:** plain `<table>` (option A). The mini-table doesn't
benefit from the module's interaction layer.

## Right-aligning the value column

The author CSS:

```css
.mini-stats {
  max-width: 460px;
  margin: 16px 0;
}
.mini-stats td:first-child {
  color: var(--vc-color-content);
  text-align: left;
}
.mini-stats td:last-child {
  text-align: right;
  font-family: var(--vc-font-mono, monospace);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
```

Last-cell right-align is the visual signature of the mini-table
— values line up at the right edge regardless of left-cell label
width. The eye trains on the column for scanning.

If the author also wants the labels right-aligned (`text-align:
right`) for a "right-anchored label / colon / value" feel:

```css
.mini-stats td:first-child {
  text-align: right;
  padding-right: 12px;
  color: var(--vc-color-content-muted);
}
.mini-stats td:first-child::after {
  content: ":";
}
```

This produces:

```
        Users affected: 11,420
   Sessions impacted: 28,910
                Region: EMEA
              Duration: 47 min
```

Both styles work; the first is more compact, the second is more
prose-like.

## Mono-spaced numbers — tabular-nums

`font-variant-numeric: tabular-nums` makes EVERY digit the same
width (the typographic feature is in all variable fonts and most
monospace fonts). Without it, proportional digit widths cause:

```
    11,420
    28,910
        47    ← misaligned because '4' and '7' have different widths
```

With `tabular-nums`:

```
    11,420
    28,910
        47    ← right-edge aligned
```

The visual matters when a column has values across multiple
magnitudes; without alignment the eye constantly recalibrates.

`var(--vc-font-mono, monospace)` is a fully-monospaced font so EVERY
character (including letters) is the same width. This is appropriate
for the value column even when the values mix numbers with units
("47 min", "EMEA"). The label column uses proportional sans-serif.

## Max-width 460px

A mini-table at 460px max-width is wide enough for:
- A 3-word label (e.g. "Sessions impacted").
- A 6-digit value with thousands separator (`28,910`).
- A bit of breathing room between label and value.

Wider becomes "look at all this data!"; narrower forces line breaks
in the label column. 460px is the canonical default from the
`12-incident-report` reference; the author can override per use.

The `max-width` (not `width`) means: this is the upper bound, but
on a narrow viewport (mobile) the table shrinks to fit. The page
extends if absolutely necessary; the table itself doesn't
horizontally scroll (no-nested-scrollbars).

## Comparison to a list

A `<dl>` (description list) is the semantically pure alternative:

```html
<dl class="mini-stats">
  <dt>Users affected</dt><dd>11,420</dd>
  <dt>Sessions impacted</dt><dd>28,910</dd>
</dl>
```

A `<dl>` is fine for the same content — and is more semantically
correct (the relationship IS term-and-definition). The table form
gets used when:
- The author wants the cell-based selection contract (per-row
  comments via the runtime).
- The author wants the same visual baseline as other report tables
  (1px borders, the project's table padding).
- The author wants CSV export.

For a one-off "here are 4 numbers" with no interaction, prefer
`<dl>`. For a "here are 4 numbers IN a report alongside other
tables", `<table>` keeps the visual rhythm.

## Sample — incident impact

```html
<table class="mini-stats">
  <tbody>
    <tr><td>Users affected</td><td>11,420</td></tr>
    <tr><td>Sessions impacted</td><td>28,910</td></tr>
    <tr><td>Region</td><td>EMEA</td></tr>
    <tr><td>Duration</td><td>47 min</td></tr>
    <tr><td>Severity</td><td>SEV-2</td></tr>
  </tbody>
</table>
```

Reads as the incident's "by-the-numbers" panel. The Region and
Severity rows mix non-numeric values with the numeric ones — fine,
the right-aligned mono treatment looks consistent.

## Sample — perf snapshot

```html
<table class="mini-stats">
  <tbody>
    <tr><td>p50 latency</td><td>32 ms</td></tr>
    <tr><td>p99 latency</td><td>180 ms</td></tr>
    <tr><td>Throughput</td><td>2,140 req/s</td></tr>
    <tr><td>Error rate</td><td>0.12 %</td></tr>
    <tr><td>Cost / 1M req</td><td>$3.80</td></tr>
  </tbody>
</table>
```

A perf snapshot — 5 KPIs for a single deploy / commit / release
window. The reader scans top-to-bottom; the right edge aligns at
the units boundary so "ms" and "req/s" and "%" and "$" all
contribute to the alignment without misreading.

## Sample — deploy stats

```html
<table class="mini-stats">
  <tbody>
    <tr><td>PRs merged</td><td>14</td></tr>
    <tr><td>Deploys</td><td>6</td></tr>
    <tr><td>Reverts</td><td>1</td></tr>
    <tr><td>Time to merge (median)</td><td>4 h 20 min</td></tr>
    <tr><td>Bundle size delta</td><td>+12 KB</td></tr>
  </tbody>
</table>
```

A weekly deploy summary. Each row is a single fact; the panel as
a whole tells the "how was this week?" story.

The `+12 KB` reads correctly (sign visible at the right edge). For
negative deltas: `−4 KB` (en dash, NOT a hyphen-minus — the en dash
is the same width as the digit `4`, so the alignment is preserved;
the hyphen-minus is narrower and would slightly misalign).

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-content` | label column color |
| `--vc-color-content-muted` | optional muted label color |
| `--vc-font-mono` | value column font family |

The runtime's baseline cell borders and 6% zebra are unchanged —
the mini-table inherits them, so the visual fits with other report
tables.

## Selection / comment / decision-mini notes

If the mini-table uses plain `<table>` (no `data-ve-table` opt-in),
the runtime still treats rows as selectable atoms (the baseline
behaviour). Each row gets `data-ve-id`, hover ring, pressed state.
The reader can comment on "Users affected" as a unit.

If the author wants per-CELL granularity (comment on the value
specifically, not the row), use `data-ve-table="compare"` with one
row per fact — the dual-stamping contract applies and each value
cell becomes its own atom.

## CSV-export contract

A mini-table with `data-ve-table-csv="1"` exports as a 2-column
CSV:

```csv
Users affected,"11,420"
Sessions impacted,"28,910"
Region,EMEA
Duration,47 min
Severity,SEV-2
```

No header row in the CSV (the table has no `<thead>`). The
receiving tool can use the first column as labels and the second as
values — exactly the key/value shape.
