# Approaches comparison — N code approaches side-by-side with inline trade-offs

The canonical recipe for "here are 2-4 ways to do the same thing —
which should I pick?" when each way carries **real code**. It composes
two already-built primitives: the `data-ve-table="compare"` emphasis
column (this skill) and the `<pre><code class="language-…">` code
block ([amvcp-code-highlight](../../amvcp-code-highlight/SKILL.md)). It
is **not a new skill and not a new runtime** — every class and
attribute below already exists; this file is the assembly instruction.

## Table of contents

- [When this recipe vs the code-snippets E9 recipe](#when-this-recipe-vs-the-code-snippets-e9-recipe)
- [The two layouts — table-based vs card-grid](#the-two-layouts--table-based-vs-card-grid)
- [Layout A — the compare table (trade-offs are rows)](#layout-a--the-compare-table-trade-offs-are-rows)
- [The recommended approach — the emphasis column](#the-recommended-approach--the-emphasis-column)
- [The code cell — a real code block inside a `<td>`](#the-code-cell--a-real-code-block-inside-a-td)
- [Inline trade-off callouts](#inline-trade-off-callouts)
- [Layout B — the free-form card grid](#layout-b--the-free-form-card-grid)
- [Selection atoms per approach](#selection-atoms-per-approach)
- [Sample HTML — table-based, 3 approaches](#sample-html--table-based-3-approaches)
- [Sample HTML — card-grid, 3 approaches](#sample-html--card-grid-3-approaches)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Anti-patterns](#anti-patterns)

---

## When this recipe vs the code-snippets E9 recipe

There are TWO homes for "compare N approaches", and they are NOT
duplicates — they differ by which axis dominates:

| You want… | Use | Lives in |
|---|---|---|
| A **scannable matrix**: criteria down the side, approaches across the top, a recommended lane highlighted, trade-offs comparable row-by-row | **this file** (`compare` table + code cell) | `amvcp-tables-matrix-compare` |
| A **read-each-approach narrative**: a numbered card per approach, each a full slate code panel + its own Pro/Con sub-table + metric chips + a closing recommendation card | [compare-n-approaches.md](../../amvcp-code-snippets/references/compare-n-approaches.md) (the E9 composition) | `amvcp-code-snippets` |

Rule of thumb: if the reader's job is to **compare a criterion across
approaches** ("which has the smallest bundle?"), the table wins — the
values line up in a column. If the reader's job is to **understand
each approach in turn** before choosing, the E9 card narrative wins —
each approach is a self-contained story. Both are valid; pick the one
that matches the reader's task, and do NOT build a third variant.

Layout B below (the card grid) is the lightweight bridge between them:
when you want cards but not the full E9 Pro/Con-plus-chips apparatus.

## The two layouts — table-based vs card-grid

- **Layout A — compare table.** One `<table data-ve-table="compare">`.
  Approaches are columns; the recommended one carries
  `data-ve-col-emphasis="1"`. A code row holds a `<pre><code>` block
  per column; trade-off rows hold short cell text. Best for 2-4
  approaches whose code is short (≤ ~12 lines each).
- **Layout B — card grid.** A CSS-grid of `<article>` cards, one per
  approach, each with a heading + a code block + a trade-off list. The
  recommended card carries an accent left-border (the `data-ve-col-
  emphasis` pattern expressed as a card, since a card grid is not a
  table). Best for free-form layouts, longer code, or when columns
  would be too narrow.

Both layouts ship **light + dark** by construction — every color is a
`var(--vc-*)` / `var(--ve-*)` token with a warm-palette fallback, so a
DESIGN.md theme swap repaints them with no extra rules.

## Layout A — the compare table (trade-offs are rows)

The substrate is the verified `data-ve-table="compare"` contract
(see [comparison-emphasis-column.md](./comparison-emphasis-column.md)
for the full attribute grammar). The approaches-comparison shape adds
one convention: **the first body row is the code row**, every later
row is a trade-off criterion.

```html
<table data-ve-table="compare" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">Approach</th>
      <th scope="col" data-ve-col-icon="○">A — inline</th>
      <th scope="col" data-ve-col-icon="◆" data-ve-col-emphasis="1">B — custom hook</th>
      <th scope="col" data-ve-col-icon="◇">C — library</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Implementation</th>
      <td>…code block…</td>
      <td>…code block…</td>
      <td>…code block…</td>
    </tr>
    <tr><th scope="row">Bundle cost</th><td>+0 kb</td><td>+0 kb</td><td>+2.1 kb</td></tr>
    <!-- more trade-off rows -->
  </tbody>
</table>
```

The leading `<th scope="col">Approach</th>` is the row-label column —
it never gets emphasis (it labels rows, not options). Each option
column header carries a `data-ve-col-icon` glyph; use `○` (open
circle) for alternatives and `◆` (filled diamond) for the recommended
one to reinforce the rank visually (see
[comparison-emphasis-column.md](./comparison-emphasis-column.md#icon-recoloring-on-the-emphasis-header)).

## The recommended approach — the emphasis column

Exactly **one** option column carries `data-ve-col-emphasis="1"`. The
runtime tints that whole column with a 10% accent wash + a 2px accent
border-left/right lane + recolors its header icon to solid accent —
the "this is the answer" cue. Zero emphasis columns = a neutral
comparison; **two or more is invalid** (the runtime `console.warn`s
and emphasises only the first). This is the single-source-of-truth
contract documented in
[comparison-emphasis-column.md](./comparison-emphasis-column.md#zero-or-one--never-two)
— do NOT re-implement the wash/border in this recipe's own CSS;
`amvcp-tables.js` already owns it.

If the comparison genuinely has no winner (the approaches are
equivalent and the reader must choose on their own constraints), omit
emphasis entirely rather than picking one arbitrarily.

## The code cell — a real code block inside a `<td>`

A code cell is just the standard author code-block contract dropped
into the `<td>` — no special wrapper, no new attribute:

```html
<td>
  <pre><code class="language-typescript">useEffect(() => {
  const id = setTimeout(() => setDebounced(query), 300);
  return () => clearTimeout(id);
}, [query]);</code></pre>
</td>
```

The `amvcp-code-highlight` runtime scans the page once and enhances
every `.ve-code-block` it builds from a `<pre><code class="language-
…">` — including ones nested in table cells — adding the gutter,
per-line selection, copy button, and syntax color. Authors write ONLY
the plain source between the tags (see
[author-vs-runtime-boundary.md](../../amvcp-code-syntax-chrome/references/author-vs-runtime-boundary.md)).
For the dark "load-bearing code" look, wrap the `<pre>` in
`<div class="ve-code-panel-slate">…</div>`.

Keep code cells **short and roughly equal height** (≤ ~12 lines): the
code row's height is the tallest cell, so a 25-line cell beside a
4-line cell wastes vertical space across the whole row. If one
approach is naturally much longer, show only its essential fragment
(and prefer Layout B, where columns can be unequal height).

A code cell exceeding ~12 lines, or more than 4 approaches, is the
signal to switch to the E9 card narrative or Layout B — three+ wide
code blocks in fixed table columns become unreadable.

## Inline trade-off callouts

Trade-offs are the comparison rows below the code row. Two grammars,
freely mixed:

1. **Plain criterion rows** — one `<th scope="row">` label, one short
   value per approach (`+0 kb`, `high`, `none`). These line up
   column-by-column so the reader compares a single criterion across
   all approaches at a glance.
2. **Pro/Con dot callout** — for a per-approach qualitative note, use
   the verified `.ve-procon` dot pattern from the E9 recipe inside the
   cell (olive dot = pro, clay/accent dot = con):

   ```html
   <td><span class="ve-procon__dot ve-procon__dot--pro"></span> No dependencies</td>
   ```

   The dot colors are `var(--vc-color-success)` (pro) and
   `var(--ve-accent, #b8861f)` (con) — see
   [compare-n-approaches.md](../../amvcp-code-snippets/references/compare-n-approaches.md#e94-the-procon-sub-grid).
   Reuse that class; do not invent a new dot class here.

Order the rows so the **most decision-relevant criterion is first**
(right under the code row). A reader who reads only two rows should
have read the code and the single trade-off that most drives the
choice.

## Layout B — the free-form card grid

When a table is too rigid (longer code, free-form prose per approach,
or a 2-up layout), use a card grid. A card grid is NOT a `<table>`, so
the emphasis cue is expressed as a card accent border rather than the
`data-ve-col-emphasis` column wash — same accent token, same meaning:

```css
.ve-approach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 20px;
}
.ve-approach-card {
  min-width: 0;                 /* code wraps; never an inner scrollbar */
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--vc-color-border, #e5dfd0);
  border-radius: var(--vc-radius-md, 10px);
  padding: 16px;
}
.ve-approach-card--recommended {
  border-left: 4px solid var(--vc-color-accent, #b8861f);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 6%, transparent);
}
```

`grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px),
1fr))` collapses the cards to one column when the viewport can't fit a
300px card — the no-nested-scrollbar rule (code wraps, the page
expands; never an inner scroll box). `min-width: 0` on the card lets
the code block wrap instead of forcing an inner horizontal scrollbar.

Each card holds a heading + a code block + a trade-off `<ul>`. The
recommended card adds `--recommended`. A closing full-width
recommendation card (the E9 clay-left-border pattern) is optional but
recommended for ≥ 3 approaches.

## Selection atoms per approach

**Do not hand-stamp selection atoms** — the runtime owns them (see
[code-atom-selection.md](../../amvcp-code-syntax-engine/references/code-atom-selection.md)
and [comparison-emphasis-column.md](./comparison-emphasis-column.md#selection--comment--decision-mini-notes)):

- **Table layout (A).** The runtime stamps every body `<td>` as a
  compare-cell atom (`data-ve-id="compare-cell:<tag>:r<row>:c<col>"` +
  `data-ve-type="compare-cell"`) and every `<tr>` as a row atom. So a
  reader can comment on a single approach's value for one criterion
  (the cell) OR a whole criterion across approaches (the row). The
  code lines inside a code cell are ALSO per-line code atoms — the
  reader can select specific lines of one approach's implementation.
  Header `<th>` cells (including the emphasis header) are deliberately
  NOT atoms.
- **Card layout (B).** Give each card a stable `data-ve-id` (e.g.
  `data-ve-id="approach:custom-hook"`) so the selection payload
  carries which approach a comment targets; the code block inside
  still gets its runtime per-line atoms automatically.

This rides the existing `amvcp-select.py` → `{selections:[…]}` JSON
round-trip — the FIXED interaction model (select → triple-state
feedback → comment/edit → re-emit). No foreign selection UX is
introduced.

## Sample HTML — table-based, 3 approaches

Complete, copy-pasteable. Requires `amvcp-tables.js` +
`amvcp-code-syntax`'s runtime stack on the page.

```html
<table data-ve-table="compare" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">Approach</th>
      <th scope="col" data-ve-col-icon="○">A — inline useEffect</th>
      <th scope="col" data-ve-col-icon="◆" data-ve-col-emphasis="1">B — custom hook</th>
      <th scope="col" data-ve-col-icon="◇">C — use-debounce lib</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Implementation</th>
      <td>
        <div class="ve-code-panel-slate"><pre><code class="language-typescript">useEffect(() => {
  const id = setTimeout(() => set(q), 300);
  return () => clearTimeout(id);
}, [q]);</code></pre></div>
      </td>
      <td>
        <div class="ve-code-panel-slate"><pre><code class="language-typescript">const debounced =
  useDebounced(q, 300);
// reusable across the app</code></pre></div>
      </td>
      <td>
        <div class="ve-code-panel-slate"><pre><code class="language-typescript">import { useDebounce } from 'use-debounce';
const [debounced] =
  useDebounce(q, 300);</code></pre></div>
      </td>
    </tr>
    <tr>
      <th scope="row">Bundle cost</th>
      <td>+0 kb</td>
      <td>+0 kb</td>
      <td>+2.1 kb</td>
    </tr>
    <tr>
      <th scope="row">Reusability</th>
      <td><span class="ve-procon__dot ve-procon__dot--con"></span> repeated everywhere</td>
      <td><span class="ve-procon__dot ve-procon__dot--pro"></span> one hook, app-wide</td>
      <td><span class="ve-procon__dot ve-procon__dot--pro"></span> reusable</td>
    </tr>
    <tr>
      <th scope="row">Testability</th>
      <td>low (effect timing)</td>
      <td>high (pure hook)</td>
      <td>high</td>
    </tr>
  </tbody>
</table>
```

## Sample HTML — card-grid, 3 approaches

```html
<section class="ve-approach-grid">
  <article class="ve-approach-card" data-ve-id="approach:inline">
    <h3>A — inline useEffect</h3>
    <div class="ve-code-panel-slate"><pre><code class="language-typescript">useEffect(() => {
  const id = setTimeout(() => set(q), 300);
  return () => clearTimeout(id);
}, [q]);</code></pre></div>
    <ul>
      <li><span class="ve-procon__dot ve-procon__dot--pro"></span> Zero dependencies</li>
      <li><span class="ve-procon__dot ve-procon__dot--con"></span> Repeated in every component</li>
    </ul>
  </article>

  <article class="ve-approach-card ve-approach-card--recommended" data-ve-id="approach:custom-hook">
    <h3>B — custom hook <span aria-hidden="true">◆</span></h3>
    <div class="ve-code-panel-slate"><pre><code class="language-typescript">const debounced = useDebounced(q, 300);
// one hook, reused across the app</code></pre></div>
    <ul>
      <li><span class="ve-procon__dot ve-procon__dot--pro"></span> +0 kb, app-wide reuse</li>
      <li><span class="ve-procon__dot ve-procon__dot--pro"></span> Pure, easy to test</li>
    </ul>
  </article>

  <article class="ve-approach-card" data-ve-id="approach:library">
    <h3>C — use-debounce library</h3>
    <div class="ve-code-panel-slate"><pre><code class="language-typescript">import { useDebounce } from 'use-debounce';
const [debounced] = useDebounce(q, 300);</code></pre></div>
    <ul>
      <li><span class="ve-procon__dot ve-procon__dot--pro"></span> Advanced opts (cancel, lead/trail)</li>
      <li><span class="ve-procon__dot ve-procon__dot--con"></span> +2.1 kb bundle</li>
    </ul>
  </article>
</section>

<aside class="ve-approach-recommendation">
  <h3>Recommendation</h3>
  <p>For most projects, the <strong>custom hook (B)</strong> wins —
     0 kb, reusable, testable. Reach for the library only when you
     need its advanced cancel/lead-trail config.</p>
</aside>
```

```css
.ve-approach-recommendation {
  margin-top: 24px;
  border-left: 4px solid var(--vc-color-accent, #b8861f);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 4%, transparent);
  border-radius: 0 8px 8px 0;
  padding: 16px 20px;
}
.ve-approach-recommendation h3 { margin: 0 0 8px; color: var(--vc-color-accent, #b8861f); }
.ve-procon__dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 6px; vertical-align: middle;
}
.ve-procon__dot--pro { background: var(--vc-color-success, #6b8f3a); }
.ve-procon__dot--con { background: var(--ve-accent, #b8861f); }
```

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-accent` (fallback `#b8861f`) | emphasis-column lane (via `amvcp-tables.js`); recommended-card border + wash; recommendation card |
| `--vc-color-content-muted` | non-emphasised header icons (via `amvcp-tables.js`) |
| `--vc-color-success` (fallback `#6b8f3a`) | Pro dot |
| `--ve-accent` (fallback `#b8861f`) | Con dot |
| `--vc-color-border` | card border |
| `--vc-radius-md` | card radius |
| `--ve-code-*` (slate panel + token palette) | the code blocks (via `amvcp-code-highlight.css`) |

A theme toggle repaints the emphasis lane, the cards, the code blocks,
and the dots with no extra rules — every value resolves to the active
theme's token.

## Anti-patterns

| Anti-pattern | Why it's wrong | Do instead |
|---|---|---|
| Two `data-ve-col-emphasis="1"` columns | Says "both are recommended", contradicting the single-answer cue; runtime warns and uses only the first | Pick ONE winner, or omit emphasis for a neutral comparison |
| Re-implementing the 10% wash / accent border in this recipe's CSS | Duplicates the contract `amvcp-tables.js` already owns → drift | Rely on `data-ve-col-emphasis`; only the **card** layout needs its own border (no table to do it) |
| Hand-stamping `data-ve-id` on code lines or `<td>` cells | The runtime owns those atoms; hand-stamping defeats `initCodeGutter` and double-paints | Let the runtime stamp them; stamp only the card `<article>` wrapper |
| 5 or more approaches as table columns, or > ~12-line code cells | Columns get too narrow / rows too tall to read | Switch to Layout B (card grid) or the E9 card narrative |
| An inner `overflow:auto` box around a wide code block | Nested scrollbars (forbidden) | `min-width: 0` on the column/card so code wraps and the page expands |
| Building a third "compare approaches" component | Two homes already exist (this + E9); a third duplicates a thing | Use the table here for matrix-scan, E9 for read-each-approach |
| Single-theme styling (hardcoded hex without a token) | Single-theme is a correctness defect | Every color a `var(--vc-*/--ve-*, fallback)`; verify light + dark |
