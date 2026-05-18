# 27 — Cover page + page break utilities (`.la-cover` + `.la-break-*`)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The `.la-cover` design choices](#the-la-cover-design-choices)
- [The `.la-break-after` on the cover](#the-la-break-after-on-the-cover)
- [When to use each break utility](#when-to-use-each-break-utility)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [The "force a break BEFORE my custom element" pattern](#the-force-a-break-before-my-custom-element-pattern)
- [Visual verification](#visual-verification)

A cover page (`.la-cover`) renders as a full-viewport centred page
in screen view and a full A4 page on print. The page-break utility
classes (`.la-break-before`, `.la-break-after`, `.la-break-inside-avoid`)
let authors control where the print engine breaks pages. Together
they form the canonical "structured printable document" primitives.

## What this is

A printable document typically has:
- A cover page (title + author + date).
- A TOC page (or several).
- Body content (the article).
- An appendix (optional).

Each of these is a logical "page" — visually distinct, optionally
forced to its own physical print page. The layout's primitives:

| Class | Effect |
|---|---|
| `.la-cover` | Full-viewport centred page (screen) / full A4 (print) |
| `.la-break-before` | Force a page break BEFORE this element |
| `.la-break-after` | Force a page break AFTER this element |
| `.la-break-inside-avoid` | Don't split this element across pages |
| `.no-print` | Hide this element on print |

The `break-*` properties (logical) are the modern replacement for
the legacy `page-break-*` properties. `break-before` / `break-after`
have an explicit page-fragmentation context applied; on print
media, "page" is the natural fragmentation unit.

## Scaffold to emit

A typical printable report structure:

```html
<!-- 1. Cover page — full viewport on screen, own A4 page on print -->
<section class="la-cover la-break-after" data-ve-id="cover" data-ve-type="section">
  <h1>Quarterly Engineering Review</h1>
  <p class="la-cover__meta">FY2026 Q1 · 2026-05-15 · Engineering team</p>
</section>

<!-- 2. KPI strip (kept on one page — break-inside-avoid) -->
<div class="la-kpi-row la-break-inside-avoid" data-ve-id="kpi-row">
  <article class="vc-metric">…</article>
  <article class="vc-metric">…</article>
  <article class="vc-metric">…</article>
</div>

<!-- 3. Main report content -->
<article class="la-article" data-ve-id="article">
  <h2>Highlights</h2>
  <p>…</p>
  <h2>Detail</h2>
  <p>…</p>
</article>

<!-- 4. Appendix — force to a fresh page -->
<section class="la-break-before" data-ve-id="appendix">
  <h2>Appendix A — Data sources</h2>
  <table>…</table>
</section>

<!-- 5. Page header — screen only, not printed -->
<header class="la-header no-print">
  <span class="la-header__title">Report</span>
</header>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-cover {
  min-block-size: 100dvh;
  display: grid;
  place-content: center;
  text-align: center;
  gap: var(--la-gap);
  padding: var(--la-gutter);
}
.la-cover__meta { color: var(--vc-color-content-muted, #5b5343); }

.la-break-before       { break-before: page; }
.la-break-after        { break-after: page; }
.la-break-inside-avoid { break-inside: avoid; }
```

And in the `@media print` block:

```css
@media print {
  .la-cover { min-block-size: auto; }
  /* The 100dvh is screen-only; on paper, the cover should be
     however tall its content needs (NOT force 100% of the A4 page). */
}
```

## The `.la-cover` design choices

- `min-block-size: 100dvh` on SCREEN: the cover occupies the
  full viewport (the user sees the title centred, NOT
  scrollable). On PRINT, this is overridden to `auto` (the
  cover is just the content size on its own A4 page).
- `display: grid; place-content: center`: centres the title
  both horizontally and vertically. `place-content` is shorthand
  for `align-content + justify-content`.
- `text-align: center`: centres any wrapping text within the
  centred grid item.
- `padding: var(--la-gutter)`: ensures the title has 32px of
  breathing room from the page edges.
- `gap: var(--la-gap)`: 16px between the title and the meta line.

## The `.la-break-after` on the cover

Combining `.la-cover` and `.la-break-after` forces the cover to
its own physical page on print:

- On screen: the cover takes the full viewport (`100dvh`); the
  user scrolls to see the next content.
- On print: the cover occupies the first A4 page; the `break-after:
  page` forces the next content (the KPI row, the article) to a
  fresh page.

Without `.la-break-after`, the article would start on the SAME
page as the cover (if content fits), which is rarely what you want
for a formal report.

## When to use each break utility

**`.la-break-before`** — when an element MUST start on a fresh
page. Common for:
- Appendices
- Chapter-level section headings (in a long doc)
- Glossaries / indices

**`.la-break-after`** — when an element ENDS a logical page. Common
for:
- The cover (force the next content to a fresh page)
- The TOC (force the body to a fresh page)
- The conclusion (force the appendix to a fresh page)

**`.la-break-inside-avoid`** — when an element MUST stay whole.
Common for:
- KPI rows (the strip should not split across pages)
- Tables (already covered by the print reset's
  `table { break-inside: avoid }`, but explicit on important
  tables doesn't hurt)
- Code blocks (split code is hard to read)
- Figures (caption + image stay together)

## Lib functions called

- None. Pure CSS.
- The browser's print pipeline evaluates `break-*` automatically.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | cover gap between title and meta |
| `--la-gutter` | 32px | cover padding |
| `--vc-color-content-muted` | (theme) | cover meta text colour |

## Selection / comment / decision-mini contract notes

`.la-cover` is in the SHAPES list of `markLayoutAtoms()` —
`data-ve-type="cover"`. The cover is a selectable atom; reviewers
can comment ("change the cover title", "add a company logo").

The break utility classes are styling helpers, not content — they
don't introduce selectable atoms.

## The "force a break BEFORE my custom element" pattern

If a custom element should start on a fresh page in print but
shouldn't look special on screen, just add `.la-break-before`:

```html
<section class="vc-appendix-data la-break-before" data-ve-id="appendix-data">
  <h2>Appendix B — Raw data</h2>
  <pre><code>…</code></pre>
</section>
```

On screen: the section renders inline like any other.
On print: the section starts on a fresh page.

## Visual verification

Run the universal self-debug checklist before claiming the cover
and break utilities work — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For cover + page-break correctness specifically:

- Open dev-browser. Verify the cover takes the full viewport on
  screen:
  ```js
  const cover = document.querySelector('.la-cover');
  console.log(cover.getBoundingClientRect().height);
  console.log(window.innerHeight);
  ```
  Both values should be equal (the cover is 100dvh tall).
- The cover's content is centred:
  ```js
  const cs = getComputedStyle(cover);
  console.log(cs.placeContent);  // 'center center' or similar
  ```
- Generate a PDF (Puppeteer / Playwright); verify:
  - The cover is the FIRST page, alone.
  - The KPI row is on the SECOND page (not split).
  - The appendix starts on its OWN page.
- **R1 — Light theme for print**: emit
  `<html data-ve-theme="light">`; verify the cover uses the
  light theme.
- **R2 — No nested scrollbars**: the cover should NOT have inner
  scroll on screen — its `100dvh` MIN-block-size + the content
  fitting on one screen means no scroll is needed. If the cover
  content overflows, the page scrolls (the body), never the cover.
- The "long title" check: render the cover with a very long
  title; the title should wrap but the cover should still occupy
  100dvh. If the cover height becomes too tall (>100dvh because
  of wrapping), the title is too long for a cover — shorten it
  or split into title + subtitle.
