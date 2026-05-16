# Risk dot + severity badge — compact in-cell status patterns

Two compact patterns for showing per-row status WITHOUT a separate
column. The 9×9 colored circle ("risk dot") and the rounded
mono-font pill ("severity badge"). Both adopt DESIGN.md tokens and
both stay readable in light + dark.

## Table of contents

- [When to use which](#when-to-use-which)
- [Risk dot — 9×9 circle inline](#risk-dot--99-circle-inline)
- [Severity badge — rounded mono pill](#severity-badge--rounded-mono-pill)
- [Why no separate "risk" column](#why-no-separate-risk-column)
- [Token-driven color palette](#token-driven-color-palette)
- [Accessibility — the visible label is mandatory](#accessibility--the-visible-label-is-mandatory)
- [`<span>` semantics, not custom elements](#span-semantics-not-custom-elements)
- [Sample — risk dot in a status column](#sample--risk-dot-in-a-status-column)
- [Sample — severity badge in a risks/mitigations table](#sample--severity-badge-in-a-risksmitigations-table)
- [Sample — combining both](#sample--combining-both)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## When to use which

| Pattern | When | Visual cost |
|---|---|---|
| **Risk dot** (inline 9×9 circle) | inline status flag on a row of mostly-text content | minimal (one tiny circle) |
| **Severity badge** (rounded mono pill with bg + text) | per-row severity classification (HIGH / MED / LOW) | medium (a small pill the eye registers as a level) |

Use a dot for a binary or low-resolution status flag ("risk:
low/med/high") where the COLOR is the signal. Use a badge for a
classification with a TEXT label that needs to be readable
("HIGH" / "MED" / "LOW").

A dot alone is NOT screen-reader-accessible (color alone fails WCAG
1.4.1). Always pair the dot with a text label in the same cell. The
badge has its text label built in.

## Risk dot — 9×9 circle inline

```html
<td>
  <span class="risk-dot risk-low" aria-hidden="true"></span>
  Low
</td>
```

```css
.risk-dot {
  display: inline-block;
  width: 9px; height: 9px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;     /* nudge into the text baseline */
}
.risk-dot.risk-low    { background: var(--vc-color-success, #3a6b5c); }
.risk-dot.risk-medium { background: var(--vc-color-warning, #a8791f); }
.risk-dot.risk-high   { background: var(--vc-color-danger,  #a84a32); }
```

A 9×9 pixel circle is the smallest size that reads as "a dot" at
typical body font size (16px). Smaller dissolves into noise; bigger
competes with the text. The `border-radius: 50%` makes it a circle.

The `aria-hidden="true"` keeps screen readers from announcing it;
the trailing text "Low" / "Medium" / "High" is the screen-reader
announcement. The visual reader sees both; the SR user sees only
the label.

### Why 9px, not 8 or 10

8×8 reads as "too small" (perceptually under-detected by the
peripheral vision). 10×10 reads as "wearing a small badge" — too
heavy for an inline cell. 9×9 is the sweet spot tested against the
plugin's body font size; the HTML-effectiveness reference catalog
cites 9px as the established "risk dot" size in `11-status-report`.

## Severity badge — rounded mono pill

```html
<td>
  <span class="sev sev-high" aria-label="High severity">HIGH</span>
</td>
```

```css
.sev {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;        /* full pill */
  font-family: var(--vc-font-mono, monospace);
  font-size: 0.85em;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sev-high {
  background: color-mix(in srgb,
    var(--vc-color-danger, #a84a32) 18%, transparent);
  color: var(--vc-color-danger, #a84a32);
}
.sev-medium {
  background: color-mix(in srgb,
    var(--vc-color-warning, #a8791f) 18%, transparent);
  color: var(--vc-color-warning, #a8791f);
}
.sev-low {
  background: color-mix(in srgb,
    var(--vc-color-success, #3a6b5c) 18%, transparent);
  color: var(--vc-color-success, #3a6b5c);
}
```

The badge is a rounded pill (`border-radius: 999px` is the canonical
trick for full-pill rounding regardless of content width). The
background is an 18% wash of the severity token (stronger than the
matrix's 12% because the badge is a small, self-contained element
that benefits from higher contrast). The text is the same severity
token at full saturation.

`font-family: var(--vc-font-mono)` makes the badge text feel
"classification-like" (uniform width) and visually distinct from
prose. `text-transform: uppercase` + `letter-spacing: 0.06em` adds
weight without bolder weights (which can read as "loud").

### Why a wash + text in the same color

The eye reads the background tint as "this is the severity level",
then reads the text as "specifically HIGH". Same hue at different
saturations means "consistent meaning". A red background with
black text would fight ("is this red? or black?"); a red background
with red text feels coherent.

## Why no separate "risk" column

A separate `Risk` column with values "Low / Medium / High" works,
but consumes a column. For a wide table (8+ columns) the extra
column is expensive. The dot and the badge inline the same
information into an adjacent cell:

| Without dot | With dot |
|---|---|
| `Component` `Owner` `Risk` `Notes` (4 cols) | `Component` `Owner` `Status` `Notes` (4 cols, Status carries the dot) |

The dot doesn't add a column — it adds a visual prefix to existing
content. Same information density, less horizontal footprint.

## Token-driven color palette

| Severity | Token |
|---|---|
| low / safe / pass | `--vc-color-success` |
| medium / partial / warn | `--vc-color-warning` |
| high / danger / fail | `--vc-color-danger` |
| neutral / informational | `--vc-color-content-muted` |

Use the same 4-color palette across dots, badges, and matrix glyphs
— visual consistency tells the reader "green means good, regardless
of where I see it". Don't introduce a 5th color (purple, blue) for
a 4th severity — semantic dilution.

The tokens flip with theme — light-theme dark-red `#a84a32`
becomes dark-theme orange-red `#ff8a6e` for danger. The badge stays
recognisable in both.

## Accessibility — the visible label is mandatory

Color alone is NOT a sufficient signal — WCAG 1.4.1 (Use of Color).
Every dot must be paired with a text label; every badge has its
text label built in.

```html
<!-- ❌ inaccessible — color is the only signal -->
<td><span class="risk-dot risk-high"></span></td>

<!-- ✓ accessible — text + color -->
<td><span class="risk-dot risk-high" aria-hidden="true"></span> High</td>

<!-- ✓ accessible — badge with text -->
<td><span class="sev sev-high">HIGH</span></td>
```

A color-blind reader (deuteranopia, protanopia) sees the dot as
indistinguishable from the medium tint. The text label is the only
robust channel.

The badge has implicit text (the "HIGH" / "MED" / "LOW" content is
visible to all readers); the dot needs explicit text. Both should
have `aria-label` if the visible text might be confusing (e.g. a
non-Latin script).

## `<span>` semantics, not custom elements

Both patterns use plain `<span>` with CSS classes:

```html
<span class="risk-dot risk-high" aria-hidden="true"></span>
<span class="sev sev-high">HIGH</span>
```

Not `<risk-dot>` (custom elements need registration and a polyfill),
not `<i class="dot">` (`<i>` is for italicised text, not icons).
`<span>` is the inline-content element; CSS classes carry the
meaning.

The classes are NOT module-injected — the AUTHOR writes them. The
module enhances tables with sort / matrix / compare / CSV; the dot
and badge are CONTENT, not chrome. The author owns content.

## Sample — risk dot in a status column

```html
<table data-ve-table="data" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">PR</th>
      <th scope="col">Title</th>
      <th scope="col">Author</th>
      <th scope="col">Risk</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#1184</td>
      <td>Add CSV export</td>
      <td>jdoe</td>
      <td><span class="risk-dot risk-low" aria-hidden="true"></span> Low</td>
    </tr>
    <tr>
      <td>#1192</td>
      <td>Refactor selection model</td>
      <td>asmith</td>
      <td><span class="risk-dot risk-high" aria-hidden="true"></span> High</td>
    </tr>
    <tr>
      <td>#1199</td>
      <td>Bump deps</td>
      <td>bot</td>
      <td><span class="risk-dot risk-medium" aria-hidden="true"></span> Medium</td>
    </tr>
  </tbody>
</table>
```

The Risk column carries both color (the dot) and text (Low / Medium
/ High). Sortable — clicking the Risk header sorts the rows by the
text content (`localeCompare`), producing High / Low / Medium order
(alphabetical). To sort by severity intent, the author would
restructure the column to numeric (1/2/3) or to lexically-ordered
text ("1-low", "2-med", "3-high").

## Sample — severity badge in a risks/mitigations table

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Risk</th>
      <th scope="col">Sev</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">DB migration fails mid-deploy</th>
      <td><span class="sev sev-high">HIGH</span></td>
      <td>Run on canary; auto-rollback on health-check fail</td>
    </tr>
    <tr>
      <th scope="row">Client cache poisons replicas</th>
      <td><span class="sev sev-medium">MED</span></td>
      <td>Bump cache version on deploy; flush on rollback</td>
    </tr>
    <tr>
      <th scope="row">Feature-flag default mis-set</th>
      <td><span class="sev sev-low">LOW</span></td>
      <td>Default OFF; opt-in per-user via UI</td>
    </tr>
  </tbody>
</table>
```

A 3-column risks/mitigations table — exactly the shape from
`16-implementation-plan` in the HTML-effectiveness catalog. The
severity badges in column 2 are compact + token-themed; the
Mitigation column is emphasised because the reader's takeaway is
"yes, we have a fix for each".

## Sample — combining both

For a table where each row has BOTH a risk-level dot AND a severity
badge — rare but occasionally useful when the dot is a
fine-grained per-cell signal and the badge is a coarse row
classification:

```html
<tr>
  <td>#1192</td>
  <td>Refactor selection model</td>
  <td>asmith</td>
  <td>
    <span class="risk-dot risk-high" aria-hidden="true"></span>
    <span class="sev sev-high">BREAKING</span>
  </td>
</tr>
```

The dot signals "high risk"; the badge classifies the breaking
change. Both visible; both screen-reader-accessible (the dot has
its trailing word inside the dot wrapper if the badge text alone
is ambiguous).

This composition is for special cases — usually pick one.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-success` | low-severity dot background; low badge text+wash |
| `--vc-color-warning` | medium-severity dot background; medium badge text+wash |
| `--vc-color-danger` | high-severity dot background; high badge text+wash |
| `--vc-color-content-muted` | neutral/informational dot color |
| `--vc-font-mono` | badge font family |

A theme toggle re-paints all dots and badges via these tokens.
Light's pale-green low badge becomes dark's bright-green low badge;
the visual hierarchy (low < medium < high) preserves.

## Selection / comment / decision-mini notes

Dots and badges are CONTENT inside a `<td>` — they don't change
the cell's atom contract. The cell is still a selectable atom (in
a compare table) or a non-selectable cell (in a data table where
only rows are atoms). The dot/badge `<span>` is `aria-hidden` (dot)
or carries its own text (badge) — no atom contract attaches to it.

## CSV-export contract

The CSV export reads `textContent` of the cell — the dot is
invisible (no text), the trailing word IS visible. So:

```csv
"#1184","Add CSV export","jdoe","Low"
"#1192","Refactor selection model","asmith","High"
```

The dot's color information is lost in the CSV (CSV has no
formatting). The text label survives. The badge's text ("HIGH",
"MED", "LOW") survives uppercased. The receiving tool can
re-colorize from the text.
