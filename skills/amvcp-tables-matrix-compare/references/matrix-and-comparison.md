# Matrix & comparison tables — reference

How the `matrix` and `compare` modes work inside `amvcp-tables.js`. Both
are mostly CSS keyed off `data-ve-*` attributes with a small amount of
glyph / icon injection JS.

## Table of contents

- [Matrix — the `data-ve-val` grammar](#matrix--the-data-ve-val-grammar)
- [Matrix — glyph injection + accessibility](#matrix--glyph-injection--accessibility)
- [Matrix — cell tint](#matrix--cell-tint)
- [Matrix — optional column summary](#matrix--optional-column-summary)
- [Comparison — icon headers](#comparison--icon-headers)
- [Comparison — the emphasis column](#comparison--the-emphasis-column)
- [Comparison — the 2-column anti-pattern variant](#comparison--the-2-column-anti-pattern-variant)
- [Theming — light + dark by construction](#theming--light--dark-by-construction)

---

## Matrix — the `data-ve-val` grammar

A matrix table (`data-ve-table="matrix"`) is a coverage / feature-grid
table whose body cells are **status glyphs** instead of free text. Rows
are items (components, features, requirements); columns are criteria
(light theme, dark theme, mobile, RTL, a11y, …).

Each body cell carries `data-ve-val` ∈ `{pass, fail, partial, na}` and
is left **empty** — the module injects the glyph:

| `data-ve-val` | Glyph | Codepoint | Word |
|---|---|---|---|
| `pass` | `✓` | U+2713 CHECK MARK | Pass |
| `fail` | `✗` | U+2717 BALLOT X | Fail |
| `partial` | `◐` | U+25D0 CIRCLE WITH LEFT HALF BLACK | Partial |
| `na` | `—` | U+2014 EM DASH | Not applicable |

**Glyphs are plain Unicode geometric marks, never emoji.** Emoji render
inconsistently across platforms and screen readers — a hard rule shared
with `amvcp-choice-tables`. `na` ("not applicable") is the dim em-dash.

An unknown `data-ve-val` value leaves the cell untouched rather than
injecting a misleading glyph (fail-fast: do not guess). The author may
still put text in a cell — the glyph is prepended *before* it, giving a
labelled status like `✓ Verified`.

## Matrix — glyph injection + accessibility

A glyph alone is not accessible. For each `data-ve-val` cell the module
injects:

- `<span class="ve-matrix-glyph" aria-hidden="true">` — the glyph,
  `aria-hidden` so a screen reader does not read the geometric mark;
- `<span class="ve-tables-sr-only">` — the visually-hidden word
  (`Pass`/`Fail`/`Partial`/`Not applicable`), the standard 1×1px clip
  pattern, so a screen reader announces the status;
- an `aria-label` on the cell set to the same word.

The leading cell of each matrix body row is `<th scope="row">` so a
screen reader announces both the row item and the column criterion for
every status cell.

## Matrix — cell tint

Pure CSS keyed off the attribute — a faint 12% `color-mix` wash of the
status token:

```css
td[data-ve-val="pass"]    { background: color-mix(in srgb,
  var(--vc-color-success, #3a6b5c) 12%, transparent); }
td[data-ve-val="pass"] .ve-matrix-glyph { color: var(--vc-color-success, #3a6b5c); }
td[data-ve-val="fail"]    { background: color-mix(in srgb,
  var(--vc-color-danger, #a84a32) 12%, transparent); }
td[data-ve-val="partial"] { background: color-mix(in srgb,
  var(--vc-color-warning, #a8791f) 12%, transparent); }
td[data-ve-val="na"]      { /* no tint */ }
```

The 12% tint is intentionally faint — it shades the cell without
drowning the glyph and stays legible in both themes because the tint
base and the page background are `--vc-*` tokens that flip together.
Status cells are centered; the glyph is `font-size:1.1em`.

## Matrix — optional column summary

If the table has a `<tfoot>` row and the `<table>` carries
`data-ve-matrix-summary`, the module fills each footer cell with that
column's `P/F/~` counts (e.g. `2/1/0`). Off by default — the matrix is
zero-config for the common case. The summary walks the grid map so
spanning cells are counted once.

---

## Comparison — icon headers

A comparison table (`data-ve-table="compare"`) is a side-by-side table:
2–N option columns plus a leading row-label column. Each option `<th>`
carries `data-ve-col-icon="<glyph>"` — a Unicode mark (never emoji); the
module prepends a `<span class="ve-col-icon" aria-hidden="true">` with
the glyph, leaving the label text after it. The icon color is
`var(--vc-color-content-muted)`, or `var(--vc-color-accent)` on the
emphasised column. The first column ("Criterion") is the row-label
column and has no icon.

## Comparison — the emphasis column

**Zero or one** column may carry `data-ve-col-emphasis="1"` — the
"recommended" / "after" / "winner" column. The module finds that
header's grid column and tints **every cell in that column** (header +
body) with `color-mix(in srgb, var(--vc-color-accent) 10%, transparent)`
plus a 2px `var(--vc-color-accent)` `border-left` and `border-right`, so
the column reads as a highlighted lane. The column's cells are iterated
via the grid map (spanning-safe — never `:nth-child`).

**Fail-fast:** if two columns wrongly carry `data-ve-col-emphasis`, the
module logs one `console.warn` naming the table and emphasises only the
first. It does not silently tint both — ambiguous output is worse than a
visible warning.

## Comparison — the 2-column anti-pattern variant

A 2-column "anti-pattern → fix" table is just the N=2 case of `compare`
— no separate mode, no code branch. The "fix" column gets
`data-ve-col-emphasis="1"`. See `sample-readability-dataset.md` for a
ready 15-row paste-in dataset.

Sorting is off for a comparison table by default — the row order is
author-curated and meaningful (sorting "Criterion" alphabetically would
destroy a deliberate narrative). A `compare` table is not
`data-ve-table="data"`, so sort wiring does not attach.

---

## Theming — light + dark by construction

Every matrix/compare color is a `color-mix()` of a `--vc-color-*` token
emitted by `amvcp-designmd.js`. The engine emits only the *active*
theme's color tokens; a theme toggle re-resolves and re-applies them.
Because all the rules are written once against the tokens, **a theme
toggle re-themes both modes with no second stylesheet and no
`prefers-color-scheme` media query** — the token values flip underneath
the same rules. Both light and dark are first-class; neither is inferred
from the other. The fallback hex in each `var(--vc-…, <fallback>)` is
the engine's canonical light default, used only if the engine is absent.
