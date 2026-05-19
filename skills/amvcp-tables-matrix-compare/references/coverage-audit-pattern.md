# Coverage audit pattern — design system / component / a11y grids

How to author a matrix table that audits N items against M criteria —
the most common production use of `data-ve-table="matrix"`. Covers
design-system audits, component grids, a11y checklists,
cross-environment compatibility tables.

## Table of contents

- [The shape](#the-shape)
- [Choosing rows and columns](#choosing-rows-and-columns)
- [Cell content discipline — never speculate](#cell-content-discipline--never-speculate)
- [Empty vs `na` — the meaningful distinction](#empty-vs-na--the-meaningful-distinction)
- [Combining glyph + context](#combining-glyph--context)
- [`<th scope="row">` is mandatory](#th-scoperow-is-mandatory)
- [Group rows by semantic family](#group-rows-by-semantic-family)
- [Use the summary footer for column verdicts](#use-the-summary-footer-for-column-verdicts)
- [Sample — design-system component audit](#sample--design-system-component-audit)
- [Sample — accessibility WCAG checklist](#sample--accessibility-wcag-checklist)
- [Sample — cross-browser compatibility](#sample--cross-browser-compatibility)
- [Anti-patterns](#anti-patterns)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

A coverage audit is a 2-D grid:
- **Rows** = items being audited (components, requirements, features,
  endpoints).
- **Columns** = criteria each item is rated against (themes, devices,
  WCAG levels, browsers).
- **Cells** = the per-item per-criterion status — pass, fail, partial,
  or not applicable.

```
            │  Light │  Dark │ Mobile │  RTL  │ A11y │
────────────┼────────┼───────┼────────┼───────┼──────┤
  Button    │   ✓    │   ✓   │   ✓    │   ◐   │  ✓   │
  Card      │   ✓    │   ✓   │   ✗    │   —   │  ◐   │
  Modal     │   ✓    │   ✓   │   ◐    │   —   │  ✗   │
  …
            │ 3/0/0  │ 3/0/0 │ 1/1/1  │       │ 1/1/1│
```

The reader scans columns to find criteria in trouble (high fail
count); scans rows to find items in trouble (mix of fail/partial
across criteria); and lands on individual cells for "what
specifically is wrong here?".

## Choosing rows and columns

| Use | Rows | Columns |
|---|---|---|
| Design-system audit | components | themes, devices, RTL, a11y |
| Accessibility audit | features | WCAG 2.1 levels: perceivable, operable, understandable, robust |
| Cross-browser audit | features | Chrome, Firefox, Safari, Edge |
| Cross-OS audit | apps | Windows, macOS, Linux, iOS, Android |
| Cross-region audit | features | EMEA, APAC, Americas, LATAM |
| Coverage by language | i18n keys | en, es, fr, de, ja, zh |
| Coverage by env | services | dev, staging, production |

**Rule of thumb:** if a row count > 50 OR column count > 8, reconsider
the audit shape. A 50×8 grid is 400 cells — the reader can't take
that in. Group items into sections (`<tbody>` per group), split into
sub-audits, or escalate to a `data` table with per-row status
columns instead.

## Cell content discipline — never speculate

Each cell's `data-ve-val` MUST reflect an actual observation:
- `pass` — verified working.
- `fail` — verified broken.
- `partial` — verified partially working (some sub-cases pass, others
  fail).
- `na` — verified the combination doesn't apply (e.g. "RTL on a
  numeric input").
- (empty cell, no `data-ve-val`) — **not yet audited**. The cell is
  visually empty; the screen reader announces only the row+column
  context.

Do NOT default unaudited cells to `pass`. The matrix is a fidelity
artefact — it shows what is known, not what is hoped. An audit with
unaudited cells should display them empty so the gap is visible.

## Empty vs `na` — the meaningful distinction

| Cell | Meaning |
|---|---|
| `<td></td>` (no `data-ve-val`) | Not yet audited / unknown |
| `<td data-ve-val="na"></td>` | Audited, confirmed N/A |
| `<td data-ve-val="pass"></td>` | Audited, passing |
| `<td data-ve-val="fail"></td>` | Audited, failing |
| `<td data-ve-val="partial"></td>` | Audited, partial |

The `na` cell shows a dim em dash (`—`) — visible commitment that
the combination was considered. An empty cell shows nothing — gap.

This distinction is critical for the column summary: `na` is
excluded from the P/F/~ count (see [matrix-summary-footer.md](
./matrix-summary-footer.md)), so a column of "all na" reports as
blank in the footer ("nothing to summarise"); a column with empty
cells alongside ratable cells reports the ratable-only count and
the empty cells are silently excluded from the denominator.

## Combining glyph + context

Add a brief note after the glyph for cells that need explanation:

```html
<td data-ve-val="partial">overflow at &lt;320px</td>
<td data-ve-val="fail">focus loop on Esc</td>
<td data-ve-val="pass">Apr 24 jdoe</td>
```

Renders as `◐ overflow at <320px`, `✗ focus loop on Esc`,
`✓ Apr 24 jdoe`. The reader sees both the status AND a context tag
(reason, date, owner) without a separate column. Keep the text
short (1–4 words); longer phrases belong in a Notes column.

For audit dates: `data-ve-val="pass">Apr 24` is concise; the year is
implicit from the report's date. For owner attribution: `data-ve-val
="pass">jdoe` (lowercase username, no `@`); use the column header
to clarify ("Audited by").

## `<th scope="row">` is mandatory

```html
<tr>
  <th scope="row">Button</th>   <!-- ← REAL HEADER -->
  <td data-ve-val="pass"></td>
  ...
</tr>
```

The leading cell of every body row must be `<th scope="row">`, NOT
`<td>`. The reason: screen readers announce a body cell as
"`<rowheader>`. `<columnheader>`. `<cell-label>`" — combining both
context pieces. With `<td>` instead of `<th scope="row">`, the row
identity is lost from the announcement and the cell becomes
ambiguous.

A `<td>` in the row-label position is a silent a11y bug. The visual
result is the same (matrix glyph in a status cell); the audit value
is destroyed for screen-reader users.

## Group rows by semantic family

For 20+ rows, break the body into multiple `<tbody>` sections, one
per family:

```html
<tbody>
  <tr><th scope="row" colspan="6">— Foundations —</th></tr>
  <tr><th scope="row">Color tokens</th><td>...</td>...</tr>
  <tr><th scope="row">Spacing tokens</th><td>...</td>...</tr>
</tbody>
<tbody>
  <tr><th scope="row" colspan="6">— Components —</th></tr>
  <tr><th scope="row">Button</th><td>...</td>...</tr>
  <tr><th scope="row">Card</th><td>...</td>...</tr>
</tbody>
```

Each `<tbody>` is a group; the spanning header is a section break.
The runtime treats every `<tbody>` row as a regular body row for
selection purposes; the section-break row is selectable too (the
reader can flag a whole section).

A simpler alternative: rely on author-visible ordering and put a
faint horizontal rule between groups via CSS. The semantic-grouping
matters for the audit ("this section: P/F/~ = 8/0/0"); the visual
grouping is the side effect.

## Use the summary footer for column verdicts

For 10+ rows, add `data-ve-matrix-summary` and a `<tfoot>` row. The
column verdicts surface at the bottom — the reader sees at a glance
which criteria are trouble columns. See [matrix-summary-footer.md](
./matrix-summary-footer.md).

For < 10 rows, the summary is usually noise — the reader can count
by eye.

## Sample — design-system component audit

```html
<table data-ve-table="matrix"
       data-ve-matrix-summary
       data-ve-table-csv="1"
       data-ve-label="Design system coverage Apr 2026">
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Light</th>
      <th scope="col">Dark</th>
      <th scope="col">Mobile</th>
      <th scope="col">Tablet</th>
      <th scope="col">RTL</th>
      <th scope="col">A11y AA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Button — primary</th>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="partial">icon mirror missing</td>
      <td data-ve-val="pass">contrast 5.1:1</td>
    </tr>
    <tr>
      <th scope="row">Card — surface</th>
      <td data-ve-val="pass">Apr 23</td>
      <td data-ve-val="pass">Apr 23</td>
      <td data-ve-val="fail">overflow on &lt;360px</td>
      <td data-ve-val="pass">Apr 23</td>
      <td data-ve-val="na"></td>
      <td data-ve-val="partial">focus order</td>
    </tr>
    <tr>
      <th scope="row">Modal — full-screen</th>
      <td data-ve-val="pass">Apr 24</td>
      <td data-ve-val="pass">Apr 24</td>
      <td data-ve-val="partial">scroll lock</td>
      <td data-ve-val="pass">Apr 24</td>
      <td data-ve-val="na"></td>
      <td data-ve-val="fail">focus loop on Esc</td>
    </tr>
    <tr>
      <th scope="row">Toast — bottom-center</th>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="pass">Apr 22</td>
      <td data-ve-val="na"></td>
      <td data-ve-val="pass">aria-live polite</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">P/F/~</th>
      <td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
  </tfoot>
</table>
```

After enhancement:
- Each cell shows glyph + brief context.
- The summary row reads `4/0/0 4/0/0 2/1/1 4/0/0 (blank) 2/1/1`.
- Mobile and A11y are flagged columns (1 fail, 1 partial each).
- RTL column is blank because every cell is `na` — the audit confirmed
  "RTL doesn't apply to any of these components in this scope".

## Sample — accessibility WCAG checklist

```html
<table data-ve-table="matrix" data-ve-matrix-summary>
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col">Perceivable</th>
      <th scope="col">Operable</th>
      <th scope="col">Understandable</th>
      <th scope="col">Robust</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Sign-in form</th>
      <td data-ve-val="pass">labels, contrast 5.2:1</td>
      <td data-ve-val="pass">keyboard, focus visible</td>
      <td data-ve-val="pass">error messages clear</td>
      <td data-ve-val="pass">SR support</td>
    </tr>
    <tr>
      <th scope="row">Data table</th>
      <td data-ve-val="pass">scope attrs</td>
      <td data-ve-val="pass">sort by keyboard</td>
      <td data-ve-val="pass">column headers descriptive</td>
      <td data-ve-val="partial">no caption</td>
    </tr>
    <tr>
      <th scope="row">Image carousel</th>
      <td data-ve-val="partial">missing alt on 2 slides</td>
      <td data-ve-val="fail">no pause, no keyboard nav</td>
      <td data-ve-val="pass">slide indicator labelled</td>
      <td data-ve-val="fail">no SR live region</td>
    </tr>
  </tbody>
  <tfoot>
    <tr><th scope="row">P/F/~</th><td></td><td></td><td></td><td></td></tr>
  </tfoot>
</table>
```

## Sample — cross-browser compatibility

```html
<table data-ve-table="matrix" data-ve-matrix-summary>
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col">Chrome 124+</th>
      <th scope="col">Firefox 125+</th>
      <th scope="col">Safari 17+</th>
      <th scope="col">Edge 124+</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">CSS subgrid</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
    </tr>
    <tr>
      <th scope="row">View Transitions</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="partial">behind flag</td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
    </tr>
    <tr>
      <th scope="row">CSS @scope</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="fail">unsupported</td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
    </tr>
  </tbody>
</table>
```

A canonical "browser support" matrix — exactly the same shape that
Can I Use serves, rendered as a tiny inline table.

## Anti-patterns

- **Defaulting unaudited cells to `pass`.** Destroys the audit's
  fidelity. Empty cells are the honest signal.
- **Mixing audit results and predictions.** "Probably passes" is
  not a valid status. Either audit, or leave empty.
- **5+ status states.** The four-state set (pass/fail/partial/na)
  is comprehensive. Adding "deferred" or "in progress" should be a
  column attribute or a separate column, not a fifth glyph.
- **No `<th scope="row">`.** Silent a11y bug — see above.
- **Tucking long notes inside status cells.** "✓ This component was
  audited on April 24, 2026 by jdoe and passes all four sub-criteria
  with notes available at …" — that belongs in a Notes column, not
  a status cell.
- **Sort-enabling a matrix.** `data-ve-table="matrix"` does not get
  sort wiring (sort by glyph is rarely meaningful). If sorting is
  needed, use `data-ve-table="data"` with text-content cells like
  "Pass" / "Fail" — and lose the glyph injection.

## DESIGN.md tokens consumed

Inherited from [matrix-glyph-injection.md](./matrix-glyph-injection.md):

| Token | Used by |
|---|---|
| `--vc-color-success` | pass glyph + tint |
| `--vc-color-danger` | fail glyph + tint |
| `--vc-color-warning` | partial glyph + tint |
| `--vc-color-content-muted` | na glyph |

## Selection / comment / decision-mini notes

Each cell is an element-kind atom (`data-ve-id="matrix-cell:<tag>:r
<r>:c<c>"`). Per-cell selection is the right granularity for an
audit: the reader flags individual cells for re-audit / discussion.
A whole-row comment would be ambiguous ("which criterion?"); a
whole-column comment would be ambiguous ("which item?").

The decision-mini pill attaches per cell, so the reader can S/A/D a
specific status assessment.

## CSV-export contract

Each cell exports the WORD: `Pass`, `Fail`, `Partial`, `Not
applicable`. Author text after the glyph (the "Apr 24" / "overflow"
notes) is **dropped** from the export — the canonical fact is the
status word. To preserve notes in the CSV, put them in a separate
Notes column.

The summary `<tfoot>` row exports too — `P/F/~,3/0/0,3/0/0,...`. The
import side can recognise it by the leading-cell content and strip
it before further processing.
