# Colored-cell board — compact game-board / matrix-grid pattern

A small fixed-grid table whose cells carry color + an optional
glyph or number — chess board, sudoku grid, 3×3 demos, dot-matrix
illustrations, color-coded state diagrams. The compact pattern when
the cells ARE the content (not labels).

## Table of contents

- [The shape](#the-shape)
- [Distinct from a matrix table](#distinct-from-a-matrix-table)
- [Cell-driven color via `data-cell-color`](#cell-driven-color-via-data-cell-color)
- [Optional cell glyph or number](#optional-cell-glyph-or-number)
- [Fixed table-layout for uniform cells](#fixed-table-layout-for-uniform-cells)
- [Square cells via `aspect-ratio: 1`](#square-cells-via-aspect-ratio-1)
- [Chess-board alternating colors](#chess-board-alternating-colors)
- [Sample — 3×3 colored-cell demo](#sample--33-colored-cell-demo)
- [Sample — chess-board with piece glyphs](#sample--chess-board-with-piece-glyphs)
- [Sample — sudoku 9×9 grid](#sample--sudoku-99-grid)
- [Sample — color-coded heat board](#sample--color-coded-heat-board)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌───┬───┬───┐
│ R │ G │ B │
├───┼───┼───┤
│ G │ B │ R │
├───┼───┼───┤
│ B │ R │ G │
└───┴───┴───┘
```

A small grid where every cell carries:
- A color (the cell's background tint, often via `data-cell-color`).
- An optional glyph (a chess piece, a letter, a number).
- A border (always — the grid lines ARE part of the visual).

Common uses: game boards (chess, go, tic-tac-toe), state diagrams
(cell colors encode states), demo grids (showing a 3×3 of a pattern),
heatmaps for tiny datasets (5×5 or smaller).

The pattern is from `#20` in the kleemans LaTeX cookbook — "Generic
pattern for any small 'coloured-cell table'".

## Distinct from a matrix table

A matrix table (`data-ve-table="matrix"`) carries semantic status
(pass/fail/partial/na) and is for COVERAGE AUDITS. Its rows have
headers (`<th scope="row">`), columns have headers, cells encode
"how this item rates on this criterion".

A colored-cell board is geometric — there are usually no row/column
headers, the cells ARE the content, and the meaning is the visual
pattern itself. Different mode entirely:

| | Matrix table | Colored-cell board |
|---|---|---|
| Row/column headers | Required | Optional / absent |
| Semantic per cell | pass/fail/partial/na | RGB / state / piece / number |
| Module mode | `data-ve-table="matrix"` | Plain `<table>` + author CSS |
| Visual emphasis | Borders & padding for legibility | Square cells, grid lines |
| Selectable per cell | Yes (matrix-cell atom) | Yes (if `data-ve-id` per cell) |

The module does NOT have a `data-ve-table="board"` mode — colored-
cell boards are pure HTML+CSS, no JS enhancement. This reference
documents the pattern; the author writes it directly.

## Cell-driven color via `data-cell-color`

```html
<td data-cell-color="r">R</td>
<td data-cell-color="g">G</td>
<td data-cell-color="b">B</td>
```

```css
td[data-cell-color="r"] { background: var(--vc-color-danger,  #a84a32); color: white; }
td[data-cell-color="g"] { background: var(--vc-color-success, #3a6b5c); color: white; }
td[data-cell-color="b"] { background: var(--vc-color-accent,  #b8861f); color: white; }
```

A small palette of cell colors, keyed off an author-defined
attribute. The palette uses DESIGN.md tokens so the theme flip
applies to the board too — the colors don't lock to specific
hexcodes.

The author can extend the palette per use:

```css
td[data-cell-color="x"] { background: color-mix(in srgb,
  var(--vc-color-content) 12%, transparent); }
```

…for tinted states, e.g. "this cell is in state X".

## Optional cell glyph or number

The cell's `textContent` is the glyph or number:

```html
<td data-cell-color="r">♛</td>     <!-- queen glyph -->
<td data-cell-color="b">7</td>      <!-- sudoku digit -->
<td data-cell-color="g"></td>       <!-- empty colored cell -->
```

For chess pieces, use Unicode chess characters (U+2654..U+265F):

```
♔ ♕ ♖ ♗ ♘ ♙   white: king queen rook bishop knight pawn
♚ ♛ ♜ ♝ ♞ ♟   black: same order
```

For other game boards, use whatever Unicode geometric or symbolic
character matches — `●` for go stones, `X` and `O` for tic-tac-toe,
digit characters for sudoku. NOT emoji (see [matrix-glyph-injection
.md](../../amvcp-tables-matrix-compare/references/matrix-glyph-injection.md) for why).

## Fixed table-layout for uniform cells

```css
.board {
  table-layout: fixed;        /* every column the same width */
  border-collapse: collapse;
  width: max-content;          /* shrink-wrap to content */
}
.board td {
  width: 32px;
  text-align: center;
  vertical-align: middle;
}
```

`table-layout: fixed` ignores content-based column widths and gives
every column an equal width. Without it, a column with a wide
character would be wider than its neighbors — destroying the grid.

The board is `width: max-content` so it shrink-wraps to its
content; no horizontal scroll, no flex / grid wrapper needed.

## Square cells via `aspect-ratio: 1`

For genuinely square cells (a chess board needs squares; a sudoku
grid needs squares):

```css
.board td {
  width: 32px;
  height: 32px;
  /* OR: */
  aspect-ratio: 1;
  width: 32px;
}
```

`aspect-ratio: 1` (CSS3+) is the modern way. The width alone is
NOT enough — without a height, the cell's text fontsize / padding
determines the height, which may not equal the width. Set both
explicitly OR use `aspect-ratio`.

For a heatmap with non-square cells, omit `aspect-ratio` and pick
explicit width + height per the design.

## Chess-board alternating colors

A chess board uses a 2-color alternating pattern that doesn't fit
the per-cell `data-cell-color` model. Use CSS `:nth-child`:

```css
.chess td:nth-child(odd)  { background: var(--vc-color-surface, #ffffff); }
.chess td:nth-child(even) { background: var(--vc-color-surface-2, #f3eee0); }
/* invert on odd rows so the pattern alternates */
.chess tr:nth-child(even) td:nth-child(odd)  { background: var(--vc-color-surface-2, #f3eee0); }
.chess tr:nth-child(even) td:nth-child(even) { background: var(--vc-color-surface, #ffffff); }
```

Light cell = `--vc-color-surface`; dark cell = `--vc-color-surface-2`
(or another low-contrast token). The colors flip with theme — the
board still reads as "chess board" in both modes.

The piece glyph color is inherited from the cell — usually black on
the light cell, near-white on the dark cell. For chess specifically,
the piece color is encoded in the Unicode character itself (♔ vs ♚)
so the cell color is purely positional, not semantic.

## Sample — 3×3 colored-cell demo

```html
<table class="board">
  <tbody>
    <tr>
      <td data-cell-color="r">R</td>
      <td data-cell-color="g">G</td>
      <td data-cell-color="b">B</td>
    </tr>
    <tr>
      <td data-cell-color="g">G</td>
      <td data-cell-color="b">B</td>
      <td data-cell-color="r">R</td>
    </tr>
    <tr>
      <td data-cell-color="b">B</td>
      <td data-cell-color="r">R</td>
      <td data-cell-color="g">G</td>
    </tr>
  </tbody>
</table>
```

A 3×3 demo grid showing a rotational color permutation. Each cell
carries both the color and the letter — the letter is for accessible
readout / colorblind-safe identification.

## Sample — chess-board with piece glyphs

The "game-board state as a one-line tuple list" idea from
`#21 Kleemans chess board` reframed for HTML — author the cells
directly:

```html
<table class="board chess" aria-label="Chess position">
  <tbody>
    <tr><td></td><td></td><td>♚</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td>♟</td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td>♙</td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td>♔</td><td></td><td></td><td></td></tr>
  </tbody>
</table>
```

An 8×8 chess board. The alternating cell colors come from the
`:nth-child` CSS pattern above; the pieces come from Unicode chess
characters in the cells. `aria-label` on the table gives the screen
reader a description.

For programmatic boards, the author can write a tiny inline-JS that
parses a notation string and emits the table — out of scope for
the tables module but cleanly compatible (the JS emits the same
HTML shape).

## Sample — sudoku 9×9 grid

```html
<table class="board sudoku">
  <tbody>
    <tr>
      <td>5</td><td>3</td><td></td>
      <td></td><td>7</td><td></td>
      <td></td><td></td><td></td>
    </tr>
    <tr>
      <td>6</td><td></td><td></td>
      <td>1</td><td>9</td><td>5</td>
      <td></td><td></td><td></td>
    </tr>
    <!-- ... rows 3-9 ... -->
  </tbody>
</table>
```

```css
.sudoku td { font-size: 1.2em; font-weight: 600; }
/* 3-cell box dividers — thicker borders every 3rd cell */
.sudoku td:nth-child(3n) { border-right: 2px solid var(--vc-color-content); }
.sudoku tr:nth-child(3n) td { border-bottom: 2px solid var(--vc-color-content); }
```

The 3×3 box dividers (the sudoku visual) are encoded via
`:nth-child(3n)` — every 3rd column right-border and every 3rd
row bottom-border get the thicker line.

## Sample — color-coded heat board

```html
<table class="board heat">
  <tbody>
    <tr>
      <td data-heat="0">0</td>
      <td data-heat="3">3</td>
      <td data-heat="7">7</td>
      <td data-heat="9">9</td>
      <td data-heat="2">2</td>
    </tr>
    <!-- ... -->
  </tbody>
</table>
```

```css
.heat td[data-heat="0"] { background: color-mix(in oklch,
  var(--vc-color-surface) 100%, var(--vc-color-danger) 0%); }
.heat td[data-heat="9"] { background: color-mix(in oklch,
  var(--vc-color-surface) 0%,   var(--vc-color-danger) 100%); }
/* ... gradient steps for 1..8 ... */
```

A heatmap visualizing intensity 0..9 — cell color goes from neutral
(0) to fully-saturated danger (9). `color-mix(in oklch, ...)`
gives perceptually-even color steps (better than `srgb`
interpolation which has a "dead gray" midpoint).

For 5+ heat steps, generate the gradient steps programmatically or
use a CSS preprocessor; hand-authoring 10 separate rules is
boilerplate.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-danger`, `--vc-color-success`, `--vc-color-accent` | per-cell color palette |
| `--vc-color-surface`, `--vc-color-surface-2` | chess-board alternating colors |
| `--vc-color-content` | text color; sudoku divider color |
| `--vc-color-border` | default cell border |

The board re-themes automatically on a theme toggle — the colors
flip via the tokens; the visual identity (RGB, chess pattern,
sudoku grid) preserves.

## Selection / comment / decision-mini notes

A colored-cell board can be a static visual (no `data-ve-id`, no
atom contract) OR a selectable surface (each cell carries
`data-ve-id`). The runtime's atom contract attaches to cells with
`data-ve-id`; the per-cell decision-mini pill also attaches.

For a board where each cell IS a fact the reader might comment on
(a sudoku puzzle the reader is solving and wants to annotate; a
chess position the reader wants to discuss), the per-cell `data-ve-
id` opt-in is the right move:

```html
<td data-ve-id="board-cell-r3-c5" data-cell-color="b">B</td>
```

The runtime stamps the cell as an element-kind atom; the reader
can select it, comment on it, attach a decision.

## CSV-export contract

A board with `data-ve-table-csv="1"` exports as a regular CSV — one
row per `<tr>`, one field per `<td>`. The cell's textContent is the
field; the cell color is NOT in the CSV (no formatting).

```csv
R,G,B
G,B,R
B,R,G
```

For a chess board, the empty cells are empty fields; the piece
glyphs are the field text. The receiving spreadsheet renders the
glyphs (most can; the Unicode chess characters are in standard
fonts).
