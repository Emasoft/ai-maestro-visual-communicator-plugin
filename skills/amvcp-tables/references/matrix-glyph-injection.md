# Matrix glyph injection — `data-ve-val` → `✓ ✗ ◐ —` + accessible word

How a `data-ve-table="matrix"` body cell's `data-ve-val` attribute
becomes a centered status glyph PLUS an accessible word screen readers
announce. Why emoji are forbidden, why the glyph is `aria-hidden`,
and how the cell tint reads from DESIGN.md tokens.

## Table of contents

- [The four allowed values](#the-four-allowed-values)
- [Why Unicode geometric marks, not emoji](#why-unicode-geometric-marks-not-emoji)
- [The injection — glyph + sr-only word + aria-label](#the-injection--glyph--sr-only-word--aria-label)
- [The `.ve-tables-sr-only` clip pattern](#the-ve-tables-sr-only-clip-pattern)
- [Cell-tint colors come from DESIGN.md tokens](#cell-tint-colors-come-from-designmd-tokens)
- [The 12% tint — faint, never drowning](#the-12-tint--faint-never-drowning)
- [`na` — "not applicable" reads as a dim dash](#na--not-applicable-reads-as-a-dim-dash)
- [Unknown values are left untouched](#unknown-values-are-left-untouched)
- [Combining glyph + author text](#combining-glyph--author-text)
- [Why `<th scope="row">` on the leading cell](#why-th-scoperow-on-the-leading-cell)
- [Idempotent re-init](#idempotent-re-init)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The four allowed values

```js
var MATRIX_GLYPH = {
  pass: '✓',     // U+2713 CHECK MARK
  fail: '✗',     // U+2717 BALLOT X
  partial: '◐',  // U+25D0 CIRCLE WITH LEFT HALF BLACK
  na: '—'        // U+2014 EM DASH
};
var MATRIX_WORD = {
  pass: 'Pass',
  fail: 'Fail',
  partial: 'Partial',
  na: 'Not applicable'
};
```

Four states. Four glyphs. Four words. The set is closed — adding a
fifth would dilute the "at-a-glance" scan that makes a coverage
matrix readable. If a fifth status is needed (e.g. "deferred"), it
should be encoded as text in an adjacent column, not a fifth glyph.

The `aria-label` on the cell is set to the same word: `aria-label=
"Pass"` for a `pass` cell. The visually-hidden word is a redundant
belt-and-braces channel — some screen readers prefer `aria-label`,
some prefer text content, this covers both.

## Why Unicode geometric marks, not emoji

A status-grid cell could be `✅ ❌ 🔶 ⬛` (emoji) instead of `✓ ✗ ◐
—` (geometric marks). The module **forbids emoji** for three reasons:

1. **Cross-platform rendering.** Emoji rendering differs per OS, per
   browser, per font fallback chain. The same `✅` is a green
   checkmark on macOS, a yellow checkmark on Windows, a beige
   checkmark on Linux. Geometric marks render identically everywhere
   — they ARE the font.
2. **Screen reader inconsistency.** VoiceOver pronounces `✅` as
   "white heavy check mark". NVDA pronounces it "white check mark
   button". JAWS pronounces "checked". A non-emoji `✓` is just
   "check mark" everywhere.
3. **Theme color control.** Geometric marks inherit `color:` from
   CSS, so a `pass` glyph can be tinted with `--vc-color-success` to
   match the cell tint. Emoji are immutable color glyphs — they can't
   theme.

A `pass` cell shows `✓` tinted with the same token that tints its
background. That visual coherence is impossible with `✅`. Same rule
shared with `amvcp-choice-tables`.

## The injection — glyph + sr-only word + aria-label

Per `data-ve-val` cell:

```js
var glyph = document.createElement('span');
glyph.className = 've-matrix-glyph';
glyph.setAttribute('aria-hidden', 'true');
glyph.textContent = MATRIX_GLYPH[val];

var srWord = document.createElement('span');
srWord.className = 've-tables-sr-only';
srWord.textContent = MATRIX_WORD[val];

cell.insertBefore(srWord, cell.firstChild);
cell.insertBefore(glyph, cell.firstChild);
cell.setAttribute('aria-label', MATRIX_WORD[val]);
```

Two children prepended; one `aria-label` attribute. Why prepend (not
append)? An author who put text after the cell's empty body
(`<td data-ve-val="pass">Verified Apr 24</td>`) would see the glyph
ahead of the text — exactly the "label + text" reading order. The
text comes naturally after.

The `aria-hidden="true"` on the glyph stops screen readers from
announcing the geometric mark; the sr-only `<span>` provides the
announcement instead. **DO NOT** style the glyph as `display:none`
— that would also hide it from sighted users.

## The `.ve-tables-sr-only` clip pattern

The classic screen-reader-only CSS:

```css
.ve-tables-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

The element is laid out (so the screen reader's reading order finds
it) but visually clipped to a 1×1 pixel with overflow hidden — the
sighted reader cannot see it. `position: absolute` + `margin: -1px`
move it outside layout; `clip: rect(0 0 0 0)` clips its render to
nothing. `white-space: nowrap` prevents a layout break.

This is the standard a11y community pattern (sometimes called
`visually-hidden` or `sr-only`). The `.ve-tables-` prefix is to
avoid colliding with a host page's own `.sr-only` rule.

## Cell-tint colors come from DESIGN.md tokens

Pure CSS, keyed off the attribute:

```css
td[data-ve-val="pass"] {
  background: color-mix(in srgb,
    var(--vc-color-success, #3a6b5c) 12%, transparent);
}
td[data-ve-val="pass"] .ve-matrix-glyph {
  color: var(--vc-color-success, #3a6b5c);
}
td[data-ve-val="fail"]    { background: color-mix(in srgb,
  var(--vc-color-danger, #a84a32) 12%, transparent); }
td[data-ve-val="partial"] { background: color-mix(in srgb,
  var(--vc-color-warning, #a8791f) 12%, transparent); }
td[data-ve-val="na"]      { /* no tint */ }
```

`color-mix(in srgb, T 12%, transparent)` produces a wash that blends
the status token at 12% over the underlying surface. The tint reads
correctly in light AND dark themes because:
- The token (`--vc-color-success` etc.) flips with the theme — light
  green vs dark green.
- The cell background it overlays is `transparent`, so the parent's
  background bleeds through — and that parent's background is the
  table's surface, which also flips.

A theme toggle re-paints all four glyph colors and all four cell
tints with NO second stylesheet and NO `prefers-color-scheme` media
query.

## The 12% tint — faint, never drowning

12% is intentionally low. A 30% tint would drown the glyph; a 5%
tint would be invisible. 12% is the sweet spot where:
- The cell color is unambiguous at a glance — a row of mostly-pass
  cells looks faintly green.
- The glyph is solid accent — the `✓` is the dominant signal.
- The cell text (if any) stays legible — no contrast crisis.

The same 12% is reused for the sort-tinted column (`.ve-col-sorted`)
and the matrix tint — one perceptual scale. The 10% (lower) is
reserved for compare-emphasis, which lights an ENTIRE column and so
needs to be more subtle to avoid visual overload.

## `na` — "not applicable" reads as a dim dash

`na` is the "this combination doesn't apply" cell — e.g. checking
"RTL support" on a component that has no directional content. The
glyph is `—` (em dash), tinted with `--vc-color-content-muted`. No
background tint; the cell reads as visually empty with a placeholder
that says "yes, we considered this; no, it doesn't apply".

This is distinct from `<td></td>` (literally no value — the cell is
also empty but no glyph is injected). An empty `<td>` means "not
yet audited"; `data-ve-val="na"` means "audited and confirmed N/A".
The semantic difference matters for honest reporting.

## Unknown values are left untouched

```js
var val = cell.getAttribute('data-ve-val');
if (!hasOwn(MATRIX_GLYPH, val)) continue;  // fail-fast
```

A typo (`data-ve-val="passed"` instead of `"pass"`) leaves the cell
untouched — no glyph, no tint. The cell renders with whatever text
the author put in it (likely empty). The error is visible — the
reader sees a blank cell where the rest of the row has glyphs — so
the author can spot and fix the typo.

The alternative (default to "pass" on unknown, or silently render
the typo as text) is worse — silent wrong output is the worst kind
of bug.

## Combining glyph + author text

The glyph + sr-word are PREPENDED to the cell's existing content,
not used as a replacement:

```html
<td data-ve-val="pass">Verified Apr 24</td>
<!-- renders as: ✓ Verified Apr 24 -->
```

Use this pattern when the cell needs:
- A date stamp (`✓ Apr 24`)
- An author name (`✓ jdoe`)
- A ticket number (`✓ #1184`)
- A short verb phrase (`✓ Verified`)

The visual is "status + context"; the screen reader announces "Pass.
Verified Apr 24". Keep the text short — a long phrase competes with
the glyph for the cell's space.

For text that needs more room, use a separate column instead:

| Component | Light | Dark | Notes |
|---|---|---|---|
| Button | pass | pass | Audited by jdoe Apr 24 |

vs cramming the note into the status cell.

## Why `<th scope="row">` on the leading cell

The leading cell of each matrix body row should be `<th scope="row">`
— a real header, not a `<td>`:

```html
<tr>
  <th scope="row">Button</th>
  <td data-ve-val="pass"></td>
  <td data-ve-val="pass"></td>
</tr>
```

A screen reader announcing the second `<td>` says: "Button. Dark.
Pass." — combining the row header ("Button"), the column header
("Dark"), and the cell label ("Pass"). All three context pieces. If
the leading cell were a `<td>`, the reader would say "Dark. Pass."
— missing the row identity.

This is the standard a11y pattern for any matrix table — feature
grids, coverage reports, comparison matrices.

## Idempotent re-init

```js
if (cell.querySelector('.ve-matrix-glyph')) continue;  // already enhanced
```

A second `init()` call (after dynamic content insertion) re-runs
cleanly: cells that already have a `.ve-matrix-glyph` child are
skipped. The author can call `window.amvcpTables.init()` from any
DOM-mutation hook without fear of duplicate glyphs.

## Sample HTML

```html
<table data-ve-table="matrix" data-ve-matrix-summary>
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Light</th>
      <th scope="col">Dark</th>
      <th scope="col">Mobile</th>
      <th scope="col">RTL</th>
      <th scope="col">A11y</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Button</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="partial"></td>
      <td data-ve-val="pass"></td>
    </tr>
    <tr>
      <th scope="row">Card</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="fail"></td>
      <td data-ve-val="na"></td>
      <td data-ve-val="partial"></td>
    </tr>
    <tr>
      <th scope="row">Modal</th>
      <td data-ve-val="pass">Apr 24</td>
      <td data-ve-val="pass">Apr 24</td>
      <td data-ve-val="partial">overflow</td>
      <td data-ve-val="na"></td>
      <td data-ve-val="fail">focus loop</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">P/F/~</th>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
  </tfoot>
</table>
```

The `data-ve-matrix-summary` triggers per-column `P/F/~` counts in
the `<tfoot>` row — see [matrix-summary-footer.md](
./matrix-summary-footer.md).

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-success` | `pass` glyph color + 12% cell tint |
| `--vc-color-danger` | `fail` glyph color + 12% cell tint |
| `--vc-color-warning` | `partial` glyph color + 12% cell tint |
| `--vc-color-content-muted` | `na` glyph color (no cell tint) |

A theme toggle re-paints all four tints and glyphs with no second
stylesheet — the `color-mix` rules are written once, the token
values flip underneath.

## Selection / comment / decision-mini notes

Every matrix cell is an element-kind atom (`data-ve-id="matrix-cell:
<tag>:r<rowIdx>:c<colIdx>"` + `data-ve-type="matrix-cell"`) — clicks
toggle the selection of that single cell. No group-handle: matrix
cells are atomic facts, not prose-grouped atoms. Per-cell selection
makes sense for coverage matrices ("flag THIS cell as needing
re-audit").

The S/A/D decision pill (Skip / Approve / Deny) attaches per cell,
persisted to localStorage keyed on the cell's `data-ve-id`. The pill
is INDEPENDENT of selection state — every cell always carries the
pill regardless of `data-ve-selected`. See the runtime's
`attachDecisionMini` helper.

## CSV-export contract

Matrix cells export the WORD, not the glyph:

| Cell HTML | CSV field |
|---|---|
| `<td data-ve-val="pass"></td>` | `Pass` |
| `<td data-ve-val="fail"></td>` | `Fail` |
| `<td data-ve-val="partial"></td>` | `Partial` |
| `<td data-ve-val="na"></td>` | `Not applicable` |
| `<td data-ve-val="pass">Apr 24</td>` | `Pass` (the trailing author text is dropped — the canonical fact is the `data-ve-val`) |
| `<td></td>` (no `data-ve-val`) | (empty) |

The receiving spreadsheet can filter on "Pass" / "Fail" / "Partial"
without parsing Unicode glyphs. To keep the author text in the
export, the author should put it in an adjacent column.
