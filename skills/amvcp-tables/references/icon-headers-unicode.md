# Icon headers — `data-ve-col-icon` glyph palette

The Unicode-only icon system for `compare` table column headers.
Why no emoji, what glyphs to choose for "options vs recommended",
and how the icons re-color through DESIGN.md tokens.

## Table of contents

- [The job an icon header does](#the-job-an-icon-header-does)
- [The hard rule — Unicode geometric marks only](#the-hard-rule--unicode-geometric-marks-only)
- [Pairing icons — open vs filled, the rank signal](#pairing-icons--open-vs-filled-the-rank-signal)
- [The canonical 4-icon palette](#the-canonical-4-icon-palette)
- [Mode-specific icon idioms](#mode-specific-icon-idioms)
- [The injection — span before the header text](#the-injection--span-before-the-header-text)
- [Color is per emphasis state](#color-is-per-emphasis-state)
- [Why no icons on the row-label column](#why-no-icons-on-the-row-label-column)
- [Sample HTML](#sample-html)
- [Choosing an icon set for a specific comparison](#choosing-an-icon-set-for-a-specific-comparison)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The job an icon header does

A 3-column comparison reads top-to-bottom row by row — the reader's
eye constantly returns to the header to remember "which column was
Option A?". A leading icon in each header gives the reader a
peripheral-vision anchor: even without re-reading the column label
("Option A"), they recognise the column by its glyph.

The icon also encodes a **rank**: open shapes (`○`, `◇`) for
neutral / alternative options, filled shapes (`●`, `◆`) for the
recommended one. Combined with the [comparison-emphasis-column](
./comparison-emphasis-column.md) accent lane, the rank is doubly
signalled — once by the filled glyph, once by the lane.

## The hard rule — Unicode geometric marks only

```js
// ❌ NEVER do this in a header
<th data-ve-col-icon="🚀">Option B</th>

// ✓ correct
<th data-ve-col-icon="◆">Option B</th>
```

Emoji are forbidden for the same reasons they're forbidden as matrix
glyphs (see [matrix-glyph-injection.md](./matrix-glyph-injection.md)):

1. **Cross-platform rendering inconsistency** — `🚀` is a chunky
   colored rocket on macOS, a wireframe rocket on Windows, a beige
   rocket on Linux. `◆` is a black diamond everywhere.
2. **Screen-reader unpredictability** — emoji have lengthy
   announcement names ("rocket"). Geometric marks are pure visuals;
   the module marks them `aria-hidden="true"` so the header text is
   the announcement.
3. **Theme color control** — emoji are immutable color glyphs.
   Geometric marks inherit `color:` so they can match the accent
   tint on the emphasis column.

The module does not validate the value — it puts whatever the author
sets into the span verbatim. A author who sets `data-ve-col-icon=
"🚀"` will see the rocket render; the module will not strip it. The
**responsibility** is the author's; this reference documents the
discipline.

## Pairing icons — open vs filled, the rank signal

The canonical paired set:

| Open (alternatives) | Filled (recommended) |
|---|---|
| `○` U+25CB WHITE CIRCLE | `●` U+25CF BLACK CIRCLE |
| `◇` U+25C7 WHITE DIAMOND | `◆` U+25C6 BLACK DIAMOND |
| `△` U+25B3 WHITE UP-POINTING TRIANGLE | `▲` U+25B2 BLACK UP-POINTING TRIANGLE |
| `□` U+25A1 WHITE SQUARE | `■` U+25A0 BLACK SQUARE |

In a 3-column comparison (A / B-recommended / C), pick one open
glyph for A, the matching filled glyph for B, a different open glyph
for C. The contrast tells the reader "B is the answer" before they
read any text.

Don't reuse a glyph for two columns — each column should be
visually distinct. The point of the icon is recognition; identical
icons defeat that.

## The canonical 4-icon palette

For most reports, four glyphs cover every layout the author needs:

```
○  ◇  ●  ◆
```

- `○` (open circle) — alternative option 1 / "Before" / "Anti-pattern"
- `◇` (open diamond) — alternative option 2 / "Without X"
- `●` (filled circle) — Strong recommendation
- `◆` (filled diamond) — Strong recommendation (alternative shape)

A 2-column "Before / After" uses `○` + `◆`. A 3-column "A / B / C"
with B emphasised uses `○` + `◆` + `◇`. A 4-column "A / B / C /
D" with C emphasised uses `○` + `◇` + `●` + `□` (introduce the
square as the 4th glyph). Beyond 4 columns, the comparison usually
overflows the reader's working memory — use a `data-ve-table=
"data"` data table with sort instead.

## Mode-specific icon idioms

| Pattern | Open glyph | Filled glyph | Rationale |
|---|---|---|---|
| Recommendation | `○` `◇` ... | `◆` | Diamond rank says "this is the answer" |
| Before / After | `○` (Before) | `◆` (After) | Circle = baseline, diamond = upgrade |
| A/B test | `△` (control) | `▲` (variant) | Triangle = "experimental" |
| Buy / Build | `□` (Build) | `■` (Buy) — or reverse based on recommendation | Squares feel "industrial" |
| Win / Loss | `◇` (lost) | `◆` (won) | Diamond = trophy shape |

The pairings are conventions — the author can swap them as long as
the **filled vs open** rank is preserved. The module enforces no
particular icon-to-meaning mapping; it just renders what the author
sets.

## The injection — span before the header text

```js
if (icon && !th.querySelector('.ve-col-icon')) {
  var span = document.createElement('span');
  span.className = 've-col-icon';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = icon;
  th.insertBefore(span, th.firstChild);
}
```

The icon span is inserted as the FIRST child of the `<th>` — before
the header's text content. CSS gives it a right margin
(`margin-right: var(--vc-space-1)`) so it visually separates from
the label:

```css
table[data-ve-table="compare"] thead th .ve-col-icon {
  display: inline-block;
  margin-right: var(--vc-space-1, 8px);
  color: var(--vc-color-content-muted, #5b5343);
}
```

`aria-hidden="true"` keeps the geometric mark out of the screen
reader announcement — the header text is the announcement. The
sighted reader gets the icon for peripheral scanning; the
screen-reader user gets the column name.

Idempotency: `!th.querySelector('.ve-col-icon')` prevents a second
`init()` from prepending a second icon.

## Color is per emphasis state

```css
table[data-ve-table="compare"] thead th .ve-col-icon {
  color: var(--vc-color-content-muted, #5b5343);
}
table[data-ve-table="compare"] thead th.ve-col-emphasis .ve-col-icon {
  color: var(--vc-color-accent, #b8861f);
}
```

- Non-emphasised columns: icon is the muted token (low contrast —
  the icon is a faint scanning aid, not a focal point).
- Emphasised column: icon is the accent token (strong contrast —
  the icon is part of the lane's signal).

The cascade automatically applies the accent color to the
emphasised icon because the module adds `.ve-col-emphasis` to the
emphasised `<th>`.

## Why no icons on the row-label column

The first column of a `compare` table is the row-label column ("the
criterion column"). It is NOT an option column — the values in it
are NOT being compared. Putting an icon on it would falsely suggest
"the criterion column is also an option".

The author SHOULD NOT set `data-ve-col-icon` on the first `<th>`.
The module does not enforce this — it would inject whatever icon
the author sets — but the convention is "icons on option columns
only, never on the row-label column". The plugin's bundled samples
all follow this convention.

## Sample HTML

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Criterion</th>
      <th scope="col" data-ve-col-icon="○">Open Source</th>
      <th scope="col" data-ve-col-icon="◇">In-House</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">SaaS</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Time-to-value</th><td>2 weeks</td><td>4 weeks</td><td>1 day</td></tr>
    <tr><th scope="row">Cost / yr</th><td>$0</td><td>~$60k FTE</td><td>$3,600</td></tr>
    <tr><th scope="row">Support</th><td>Forum / GitHub</td><td>You</td><td>24/7 SLA</td></tr>
    <tr><th scope="row">Lock-in</th><td>None</td><td>None</td><td>Medium</td></tr>
  </tbody>
</table>
```

Three different open/filled glyphs distinguish the three columns at
a glance. `○` (Open Source — open circle, "community"), `◇`
(In-House — open diamond, "build"), `◆` (SaaS — filled diamond, the
recommended). The reader's eye finds the filled glyph immediately
and registers SaaS as the answer.

## Choosing an icon set for a specific comparison

A quick decision tree:

1. **Two columns** → `○` + `◆` (circle + filled diamond).
2. **Three columns** → pick `○`, `◇` for the alternatives + `◆` for
   the recommended; OR `○`, `◇`, `●` if no emphasis.
3. **Four columns** → add `□` (square) as the fourth glyph; use the
   filled square `■` for the recommended option.
4. **Subjective vs measured** — for a "this feels better" comparison
   prefer geometric shapes; for a "this benchmarks faster" comparison
   prefer arithmetic-feeling shapes (no real grammar here, but
   consistency within a report helps).
5. **More than 4 columns** — reconsider. A `compare` table is rarely
   the right format for 5+ options. Use a `data` table with sort,
   or split into multiple comparisons.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-content-muted` | non-emphasised icon color |
| `--vc-color-accent` | emphasised icon color |
| `--vc-space-1` | margin-right between icon and header label |

A theme toggle re-paints all icons (muted token flips, accent token
flips). The icon glyph itself never changes; only its color does.

## Selection / comment / decision-mini notes

The header `<th>` is NOT a selectable atom — only body `<tr>` and
body `<td>` cells are stamped with `data-ve-comment-id` /
`data-ve-id`. The icon is a presentational hint on a chrome element.
Clicking the icon does nothing (no handler attached). The reader
selects rows and cells; they don't select header icons.

## CSV-export contract

The icon is **stripped** from the CSV export — the exporter clones
the cell, removes module-injected `.ve-sort-arrow` spans, then reads
`textContent`. The same clone+strip path is used for `.ve-col-icon`
spans:

```js
// the CSV exporter's clone-and-strip pattern
var clone = cell.cloneNode(true);
clone.querySelectorAll('.ve-sort-arrow').forEach(s => s.remove());
clone.querySelectorAll('.ve-col-icon').forEach(s => s.remove());
return clone.textContent.trim();
```

So a header `<th data-ve-col-icon="◆">Option B</th>` exports as
`Option B`, NOT `◆ Option B`. The CSV is a data export; visual icons
are layout chrome and don't survive.

(Note: the current implementation strips `.ve-sort-arrow` but
relies on the icon NOT being inside the rendered header text —
verify by inspecting the export. If `.ve-col-icon` were not
stripped, the icon would appear in the CSV header field; the
fix is the strip pattern above.)
