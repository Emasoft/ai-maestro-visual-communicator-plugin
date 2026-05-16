# 13 — Article 3-column grid (the gutter / measure / gutter trick)

The reading container `.la-article` is a 3-column CSS Grid:
`1fr / min(measure, 100% - 2*gutter) / 1fr`. Children land in the
middle column by default, producing a single measured reading
column with empty gutters on either side. Special children
(`.la-article__wide`, `.la-article__bleed`) can opt into wider
columns. This is the layout's solution to "wide content (tables,
code blocks, figures) inside a measured-width article without an
inner scrollbar".

## What this is

The naive approach to a measured article is `max-width: 68ch;
margin: auto`. This works for prose but fails as soon as a wide
TABLE or wide CODE BLOCK or wide DIAGRAM appears — that wide child
either overflows the `max-width` (visually ugly) or gets clamped
and develops its own inner scrollbar (violates the
no-nested-scrollbars rule, see ref 32).

The 3-column grid trick solves this:

```
┌──────────┬──────────────────────────────────────────┬──────────┐
│  gutter  │      measured reading column (68ch)      │  gutter  │
│  (1fr)   │  ← default children land here →          │  (1fr)   │
└──────────┴──────────────────────────────────────────┴──────────┘
                              ↓
              .la-article__wide  → spans cols 1-3
              .la-article__bleed → spans cols 1-3
                  (those widen toward the document edge,
                   never developing an inner scrollbar)
```

Default children land in column 2 (the measure). The `.la-article__wide`
class spans all 3 columns and caps at `--la-measure-wide` (92ch),
giving a wider-than-prose but still-readable column for figures and
tables. The `.la-article__bleed` class spans all 3 columns with no
cap, edge-to-edge of the document — useful for full-width hero
images or banners.

The `min(--la-measure, 100% - 2 * --la-gutter)` clamp on the centre
column ensures it shrinks below `--la-measure` (68ch) on narrow
viewports, leaving room for the gutters. Without the clamp, the
centre column would force its 68ch width and overflow the viewport.

## Scaffold to emit

```html
<article class="la-article" data-ve-id="article" data-ve-type="section">
  <h1>Report title</h1>
  <p>Lede paragraph that introduces the report …</p>
  <h2>Section one</h2>
  <p>Body text in the measured column …</p>

  <!-- A wide table that benefits from wider-than-prose space -->
  <figure class="la-article__wide" data-ve-id="figure-1" data-ve-type="section">
    <table>
      <thead><tr><th>Metric</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead>
      <tbody>
        <tr><td>Revenue</td><td>$1.1M</td><td>$1.3M</td><td>$1.5M</td><td>$1.7M</td></tr>
      </tbody>
    </table>
    <figcaption>Quarterly revenue, FY2026.</figcaption>
  </figure>

  <h2>Section two</h2>
  <p>More body text in the measured column …</p>

  <!-- A code block too wide for prose -->
  <pre class="la-article__bleed"><code>… deliberately wide code line that would not fit in 68ch …</code></pre>

  <p>The article continues here.</p>
</article>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-article {
  display: grid;
  grid-template-columns:
    1fr
    min(var(--la-measure), 100% - (2 * var(--la-gutter)))
    1fr;
  row-gap: var(--la-gap);
  padding-block: var(--la-gap-xl);
}
.la-article > * { grid-column: 2; }
.la-article__wide {
  grid-column: 1 / -1;
  max-inline-size: var(--la-measure-wide);
  margin-inline: auto;
}
.la-article__bleed { grid-column: 1 / -1; }
```

## The HARD rule: NOT on `<main>` / `.ve-main`

The runtime forces `main { max-width: none !important }` (and the
same for `.ve-main`) to prevent inner-scroll bugs from per-runtime
main-element styling. Putting `.la-article` on a `<main>` element
silently destroys the measure — the `max-inline-size` is
overridden by the runtime CSS.

Always use a `<div>` or `<article>` element:

```html
<!-- WRONG — the runtime forces main { max-width: none !important } -->
<main class="la-article">…</main>

<!-- RIGHT -->
<article class="la-article">…</article>

<!-- ALSO RIGHT -->
<div class="la-article">…</div>
```

## Lib functions called

- `markLayoutAtoms()` does NOT stamp `.la-article` directly (the
  SHAPES list in `amvcp-layout.js` does not include `.la-article`).
  The article's child paragraphs are stamped by the runtime as part
  of the universal selection model. The article wrapper is the
  PARENT scope; if the author wants to comment on the article as a
  whole, they hand-stamp `data-ve-id` on it (the scaffold above
  does this).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-measure` | 68ch (≈572px @16px) | centre column width |
| `--la-measure-wide` | 92ch (≈772px @16px) | `.la-article__wide` cap |
| `--la-gutter` | 32px (`--vc-space-5`) | side gutter columns |
| `--la-gap-xl` | 64px (`--vc-space-7`) | article top/bottom padding |
| `--la-gap` | 16px (`--vc-space-3`) | row-gap between children |

## Selection / comment / decision-mini contract notes

The article's `data-ve-id` (when hand-stamped) makes the WHOLE
article a selectable atom (`section` type). Per-paragraph atoms
are stamped by the runtime (every `<p>` with selectable content
gets `data-ve-comment-id`); per-figure atoms by `data-ve-id` if
the author wants them.

A reviewer can:
- Comment on the article as a whole (the `data-ve-id="article"`
  atom) — "this article needs a TL;DR at the top".
- Comment on a specific paragraph (the runtime's per-`<p>` atom)
  — "rewrite this paragraph".
- Comment on a wide figure (the `data-ve-id="figure-1"` atom) —
  "replace this table with a chart".

The decision-mini pill attaches to each level via the runtime's
standard mechanism.

## When to use this layout

- ANY long-form report or article that includes a mix of prose +
  tables / code blocks / figures.
- The default `report-doc` template uses this layout.
- A blog post / documentation page.

Do NOT use this layout for:
- A slide (slides have fixed aspect ratio; the article doesn't fit
  the slide model).
- A dashboard (the dashboard is multi-region, not single-column).

## Why three columns instead of `max-width` + escape hatch overrides

A `max-width` approach + an escape-hatch class that does
`margin-inline: calc(-1 * --la-gutter)` would visually look similar
but:
- The escape hatch is per-element CSS; the grid is per-container.
  Authoring is simpler with the grid (just add the class to the
  child).
- The escape hatch breaks the article's logical block structure
  (the child uses negative margins to escape its parent). The grid
  preserves it (the child is column 1/-1, still inside the parent's
  logical layout).
- The grid solution is symmetric (works in RTL automatically via
  logical properties); the negative-margin solution requires
  duplicate rules for `dir="rtl"`.

## Visual verification

Run the universal self-debug checklist before claiming the article
layout is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For 3-column article correctness specifically:

- Open dev-browser. Verify the grid:
  ```js
  getComputedStyle(document.querySelector('.la-article')).gridTemplateColumns
  ```
  Should resolve to three pixel widths: left gutter, centre
  measure, right gutter.
- Verify the centre column width is `≤ --la-measure`:
  ```js
  const centre = document.querySelector('.la-article > p').getBoundingClientRect().width;
  const measureCh = 68;
  const fontPx = parseFloat(getComputedStyle(document.body).fontSize);
  const measurePx = measureCh * fontPx * 0.5;  // approximate
  console.assert(centre <= measurePx + 4, 'centre should be close to measure');
  ```
- Insert a `.la-article__wide` figure; verify it widens but not
  past `--la-measure-wide`.
- Insert a `.la-article__bleed` block; verify it spans the entire
  article width (no margin, no gutter).
- Shrink viewport to 600px; verify the centre column clamp
  activates (column width = `100% - 2 * --la-gutter`).
- **R1 — Light + dark themes**: switch themes; the article must
  render identically in both.
- **R2 — No nested scrollbars**: insert a wide table inside a
  `.la-article__bleed`; the document body's scroll must extend,
  NEVER an inner scrollbar inside the table. If a horizontal
  scrollbar appears INSIDE the article, an ancestor has
  `overflow: hidden` or the table has its own `overflow: auto`
  somewhere.
