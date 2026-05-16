# Compact metric chip strip — horizontal `<span>` row alternative

The lightweight cousin of the stat-card row: a horizontal strip of
small chips like `[Bundle: +0kb]` `[Latency: -120ms]` `[Tests:
+12]`. Same data, less visual weight. The right shape when the
metrics are decoration, not the headline.

## Table of contents

- [The shape](#the-shape)
- [Chip vs card vs pill — visual weight ladder](#chip-vs-card-vs-pill--visual-weight-ladder)
- [Anatomy — label colon value](#anatomy--label-colon-value)
- [Inline `<strong>` on the value](#inline-strong-on-the-value)
- [Wrap behavior](#wrap-behavior)
- [Colored chip variants — `.chip-good` / `.chip-bad`](#colored-chip-variants--chip-good--chip-bad)
- [Sample — PR change-summary strip](#sample--pr-change-summary-strip)
- [Sample — release notes meta strip](#sample--release-notes-meta-strip)
- [Sample — test result strip](#sample--test-result-strip)
- [Combining with a table](#combining-with-a-table)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The shape

```
[Bundle: +0kb]  [Latency: -120ms]  [Tests: +12]  [Coverage: 87.4%]  [Build: 4m22s]
```

A horizontal row of small chips, each carrying a `label: value`
pair. Lighter than a stat-card row (which has a big number); lighter
than a meta-pill row (which carries semantic status). The chip strip
is for "supplementary metrics" — the reader notices them, scans for
anything unusual, moves on.

The pattern is from `01-exploration-code-approaches` in the
HTML-effectiveness catalog ("alternative to a row of stat cards" —
when the row would feel heavy).

## Chip vs card vs pill — visual weight ladder

| Element | When to use | Vertical footprint |
|---|---|---|
| Chip | Supplementary metrics, label-colon-value | ~24px (one line) |
| Pill | Status / classification, key-value-with-semantic-color | ~28px (one line) |
| Stat card | Headline KPI, big number | ~80px (3 lines: num, label, delta) |

A page might combine all three:
- **Top:** stat-card row (headline numbers).
- **Middle:** pill meta-row (severity, status, owner).
- **Within a section:** chip strips (supplementary metrics).

Don't use a chip strip when the metrics ARE the headline — use stat
cards. Don't use a chip strip when the metrics are categorical —
use pills.

## Anatomy — label colon value

```html
<span class="chip">
  Bundle:&nbsp;<strong>+0 KB</strong>
</span>
```

The chip is one `<span>`. Inside:
- The label text (`Bundle:`).
- A `&nbsp;` (non-breaking space) so the label-value pair never
  breaks across lines.
- A `<strong>` (or `<b>`) wrapping the value to bold it.

CSS:

```css
.chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--vc-color-surface-2, #f3eee0);
  color: var(--vc-color-content-muted, #5b5343);
  font-size: 0.9em;
  font-family: var(--vc-font-base, sans-serif);
  border: 1px solid transparent;
}
.chip strong {
  color: var(--vc-color-content, #1f1a14);
  font-weight: 600;
}
```

The label is muted (it's just context), the value is bold (it's the
data). The pill-style border-radius keeps the strip visually
distinct from prose-text.

## Inline `<strong>` on the value

Use `<strong>` (semantic — "this is important") for the value
rather than `<b>` (presentational — "make this visually bold").
Screen readers don't usually announce `<strong>` content
differently, but the semantic markup signals intent to other
tooling (RSS readers, summarisers, search indexing).

For the very rare case where the strong-emphasis announcement is
distracting (e.g. a screen reader user listening to a long list
of chips), wrap in `<span class="chip-value">` and bold via CSS
instead.

## Wrap behavior

```css
.chip-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
```

The chip strip wraps onto multiple lines on a narrow viewport. The
`gap: 6px` controls both inter-chip horizontal spacing AND inter-
row vertical spacing. The page extends vertically as chips wrap; no
horizontal page scroll.

A wide page might fit 6 chips on one row; a narrow page (mobile)
might fit 2 chips per row. The visual stays consistent because each
chip is its own visual unit — the wrap just stacks them.

## Colored chip variants — `.chip-good` / `.chip-bad`

For chips where the value's sign is meaningful (a delta, a
classification), add a color modifier:

```css
.chip.chip-good {
  background: color-mix(in srgb,
    var(--vc-color-success, #788C5D) 12%, transparent);
  border: 1px solid color-mix(in srgb,
    var(--vc-color-success, #788C5D) 40%, transparent);
}
.chip.chip-good strong { color: var(--vc-color-success, #788C5D); }

.chip.chip-bad {
  background: color-mix(in srgb,
    var(--vc-color-danger, #D97757) 12%, transparent);
  border: 1px solid color-mix(in srgb,
    var(--vc-color-danger, #D97757) 40%, transparent);
}
.chip.chip-bad strong { color: var(--vc-color-danger, #D97757); }
```

A 12% wash background + a 40% colored border + a full-saturation
value text. The chip reads as "this metric improved" (good) or
"this metric regressed" (bad) without the author writing prose.

Use sparingly — coloring every chip drowns the signal. The default
neutral chip is the right pick for most metrics; the colored
variant is for the EXCEPTIONS.

## Sample — PR change-summary strip

```html
<div class="chip-strip">
  <span class="chip">Files:&nbsp;<strong>14</strong></span>
  <span class="chip">Lines:&nbsp;<strong>+340 / -120</strong></span>
  <span class="chip chip-good">Bundle:&nbsp;<strong>−12 KB</strong></span>
  <span class="chip">Tests:&nbsp;<strong>23 / 23 ✓</strong></span>
  <span class="chip chip-bad">Coverage:&nbsp;<strong>87.4% (−1.2)</strong></span>
  <span class="chip">Build:&nbsp;<strong>4m 22s</strong></span>
</div>
```

A PR-summary strip showing 6 metrics. The "Bundle: −12 KB" is
chip-good (smaller bundle is better); the "Coverage: 87.4% (−1.2)"
is chip-bad (coverage dropped). The neutral chips are
informational; the color chips draw attention.

## Sample — release notes meta strip

```html
<div class="chip-strip">
  <span class="chip">Version:&nbsp;<strong>v1.4.2</strong></span>
  <span class="chip">Date:&nbsp;<strong>2026-04-24</strong></span>
  <span class="chip">Commit:&nbsp;<strong>a3f9c12</strong></span>
  <span class="chip">PRs:&nbsp;<strong>14</strong></span>
  <span class="chip">Contributors:&nbsp;<strong>5</strong></span>
</div>
```

A release notes header — version, date, commit, PR count,
contributor count. All neutral chips (informational). Sits at the
top of a release document; the prose explaining the release comes
below.

## Sample — test result strip

```html
<div class="chip-strip">
  <span class="chip chip-good">Passed:&nbsp;<strong>241</strong></span>
  <span class="chip chip-bad">Failed:&nbsp;<strong>2</strong></span>
  <span class="chip">Skipped:&nbsp;<strong>7</strong></span>
  <span class="chip">Time:&nbsp;<strong>3m 14s</strong></span>
  <span class="chip">Snapshot churn:&nbsp;<strong>+3 / -1</strong></span>
</div>
```

A test-result strip — pass/fail/skip counts. The Passed chip is
chip-good (any value is good, the bigger the better); the Failed
chip is chip-bad (any non-zero is bad). The neutral chips are
informational context.

## Combining with a table

A chip strip often sits ABOVE a table — the strip is the summary,
the table is the detail. Or BESIDE a table on a wide screen:

```html
<section>
  <h3>Test results — week 16</h3>
  <div class="chip-strip">
    <span class="chip chip-good">Passed:&nbsp;<strong>241</strong></span>
    <span class="chip chip-bad">Failed:&nbsp;<strong>2</strong></span>
    <span class="chip">Time:&nbsp;<strong>3m 14s</strong></span>
  </div>
  <table data-ve-table="data" data-ve-table-csv="1">
    <thead>
      <tr>
        <th scope="col">Suite</th>
        <th scope="col">Pass</th>
        <th scope="col">Fail</th>
        <th scope="col">Time</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>tables.spec</td><td>87</td><td>0</td><td>42s</td></tr>
      <tr><td>matrix.spec</td><td>32</td><td>0</td><td>18s</td></tr>
      <tr><td>compare.spec</td><td>45</td><td>2</td><td>26s</td></tr>
      <tr><td>virtual.spec</td><td>77</td><td>0</td><td>1m 48s</td></tr>
    </tbody>
  </table>
</section>
```

The strip surfaces the WEEK's totals; the table breaks them down by
suite. The reader sees the strip first (the headline) and the table
second (the detail) — natural reading flow.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-surface-2` | neutral chip background |
| `--vc-color-content` | value text color (strong) |
| `--vc-color-content-muted` | label text color |
| `--vc-color-success` | chip-good background + border + value text |
| `--vc-color-danger` | chip-bad background + border + value text |
| `--vc-font-base` | chip font family (inherit from body) |

A theme toggle re-paints every chip via these tokens. The
chip-good/chip-bad colors flip — light's olive becomes dark's sage,
light's clay becomes dark's coral; the "good" or "bad" semantic
stays clear.

## Selection / comment / decision-mini notes

A chip strip is OUTSIDE the table system — chips are not atoms by
default. Each chip can opt into the runtime's atom contract by
carrying `data-ve-id`:

```html
<span class="chip" data-ve-id="metric-bundle">
  Bundle:&nbsp;<strong>−12 KB</strong>
</span>
```

…then the chip becomes a selectable atom. The reader can comment on
"the Bundle metric" or attach a decision-mini ("approve this
regression" / "deny this — should investigate").

Without `data-ve-id`, the chips are presentational. Most uses
don't need the atom contract — chips are summaries, not facts to
discuss.
