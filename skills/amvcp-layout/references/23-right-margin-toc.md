# 23 — Right-margin TOC (the `right: max(24px, calc(50vw - …))` trick)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Why a fixed `200px` TOC width](#why-a-fixed-200px-toc-width)
- [Why `max(24px, calc(…))` not just `calc(…)`](#why-max24px-calc-not-just-calc)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use right-margin instead of sticky-sidebar](#when-to-use-right-margin-instead-of-sticky-sidebar)
- [Why this is a niche pattern](#why-this-is-a-niche-pattern)
- [Visual verification](#visual-verification)
- [The math behind the calc](#the-math-behind-the-calc)

A variant of the sticky-sidebar TOC (ref 22) for pages WITHOUT a
multi-column grid: the TOC is positioned absolutely in the right
margin of the document, anchored to the right edge of the article
column regardless of viewport width. Mined from the
html-effectiveness catalog (`12-incident-report.html`,
`14-research-feature-explainer.html`).

## What this is

The right-margin TOC sits in the empty space to the RIGHT of a
measured article column. On a 1200px viewport with a 720px article
column centred, there's ~240px of empty space on each side. The
TOC is placed in the right empty space via `position: sticky` +
`right: max(24px, calc(50vw - 410px - 200px))`.

The math:
- `50vw` is the centre of the viewport.
- `- 410px` subtracts half the article column width (assuming
  820px / 2).
- `- 200px` subtracts the TOC width (so the TOC sits IN the empty
  space, not overlapping the column).
- The result is the distance from the right viewport edge to where
  the TOC's right edge should be.
- `max(24px, …)` ensures the TOC NEVER goes off-screen on narrow
  viewports — it falls back to `24px` from the right.

On wide viewports (>1100px), this places the TOC in the right
margin neatly. On narrow viewports (<1100px), the calc goes negative
(article overlaps TOC area), and the `max(24px, …)` kicks in — the
TOC sticks 24px from the right edge OR (better) is hidden via a
media query.

## Scaffold to emit

```html
<article class="la-article" data-ve-id="article" data-ve-type="section">
  <h1>Incident report INC-2026-0418</h1>
  <h2 id="tldr">TL;DR</h2>
  <p>…</p>
  <h2 id="timeline">Timeline</h2>
  <ul>…</ul>
  <h2 id="root-cause">Root cause</h2>
  <pre><code>…</code></pre>
  <h2 id="impact">Impact</h2>
  <table>…</table>
  <h2 id="actions">Action items</h2>
  <ul>…</ul>
</article>

<nav class="la-toc la-toc--right-margin"
     data-ve-id="toc"
     data-ve-type="section"
     aria-label="On this page">
  <ol class="la-toc__list"></ol>
</nav>
```

The CSS is a custom variant (not currently in `amvcp-layout.css`);
add to the consuming page:

```css
.la-toc--right-margin {
  position: sticky;
  /* Right-margin anchor: stick to the right of the article column. */
  inset-block-start: var(--la-gap-lg);
  inset-inline-end: max(var(--la-gutter), calc(50vw - 410px - 200px));
  /*                ^^ minimum 32px from edge   ^^ otherwise right of article */
  inline-size: 200px;  /* fixed TOC width */
  align-self: start;
  z-index: var(--vc-z-raised, 10);
  /* Hide on viewports where the TOC overlaps the article. */
}

@media (max-width: 1100px) {
  .la-toc--right-margin { display: none; }
}
```

The `--la-gap-lg` (32px) is the top offset, matching the standard
sticky-sidebar TOC pattern (ref 22). The `align-self: start` is
the same essential trick.

Note the use of `inset-inline-end` instead of `right` — this is
the logical property, so the TOC mirrors to the LEFT margin under
`dir="rtl"` automatically (see ref 31 — RTL logical properties).

## Why a fixed `200px` TOC width

The TOC is in the document MARGIN, not in a grid cell — it has no
natural width to inherit. A fixed `200px` (or `220px` for a more
generous variant) gives the TOC a consistent visual presence.
Don't use a percentage width here — the TOC would scale with the
viewport, breaking the right-margin alignment math.

## Why `max(24px, calc(…))` not just `calc(…)`

The bare `calc(50vw - 410px - 200px)` goes NEGATIVE on viewports
narrower than the article-+-TOC width. A negative `right` value
would push the TOC off-screen to the right (visible only if the
user horizontally scrolls — which they shouldn't have to).

`max(24px, …)` clamps the TOC's right offset to at least 24px from
the viewport edge. On viewports too narrow to fit the TOC in the
margin, the `@media (max-width: 1100px) { display: none }` hides
the TOC entirely — a cleaner solution than awkwardly overlapping
the article.

## Lib functions called

- `initTOC()` populates and highlights the TOC (see ref 21).
- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type`.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-lg` | 32px | sticky top offset |
| `--la-gutter` | 32px | minimum right edge offset |
| `--vc-z-raised` | 10 (fallback) | TOC z-index (above article body) |
| (TOC link styles from ref 21) | — | see ref 21 |

## Selection / comment / decision-mini contract notes

Same as ref 21 and ref 22. The TOC is a selectable atom; the
right-margin positioning doesn't change the selection model.

The reviewer can comment "the TOC is hard to find — move it to a
sidebar" — the layout-author then switches from the right-margin
variant to the sticky-sidebar variant (refs 22) and the comment
thread persists across the layout change (the `data-ve-id` is
unchanged).

## When to use right-margin instead of sticky-sidebar

Use the **right-margin TOC** when:
- The page does NOT use a multi-column grid (the article is
  centred and there's empty space on both sides).
- A persistent TOC is desired without committing the full
  multi-column layout.
- The page is a single-column document (an incident report, a
  blog post) but the TOC is still useful.

Use the **sticky-sidebar TOC** (ref 22) when:
- The page already uses `.la-grid--3-1` or `.la-grid--2-1`.
- The sidebar holds OTHER content too (the TOC is one of several
  panels).

If the page is multi-column AND you want the TOC in the right
margin separately from the grid columns: don't. Pick one or the
other. Mixing both produces a busy page.

## Why this is a niche pattern

The right-margin TOC works well only on very wide viewports
(>1100px). Below that, it hides. So it's a "desktop bonus" — the
TOC appears on big screens, vanishes on small. The
sticky-sidebar TOC (ref 22) is more robust because it collapses
into the article flow on mobile rather than vanishing.

Use the right-margin TOC when the article works fine WITHOUT a
TOC (it's still readable), and the TOC is a wide-screen nicety.

## Visual verification

Run the universal self-debug checklist before claiming the
right-margin TOC is correct — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For right-margin TOC correctness specifically:

- Open dev-browser. At 1280px viewport, the TOC should be
  positioned in the empty space to the right of the article
  column. Measure:
  ```js
  const toc = document.querySelector('.la-toc--right-margin');
  const article = document.querySelector('.la-article');
  console.log('toc right edge:', toc.getBoundingClientRect().right);
  console.log('viewport width:', window.innerWidth);
  console.log('toc left edge:', toc.getBoundingClientRect().left);
  console.log('article right edge:', article.getBoundingClientRect().right);
  ```
  The TOC's left edge should be >= the article's right edge
  (no overlap).
- Resize to 1000px; the TOC should be hidden (the `@media (max-width:
  1100px) { display: none }` activates).
- Scroll the page; the TOC remains in the right margin (sticky).
- **R1 — Light + dark themes**: same as the standard TOC.
- **R2 — No nested scrollbars**: same as the standard TOC.
- The "RTL" check: set `<html dir="rtl">`. The TOC should mirror
  to the LEFT margin (since `inset-inline-end` becomes the left
  edge under RTL). Verify the TOC is now on the left, not the
  right.

## The math behind the calc

The full `right` formula deserves a breakdown:

```css
inset-inline-end: max(var(--la-gutter), calc(50vw - 410px - 200px));
```

Breaking it down:
- `50vw` is the centre of the viewport.
- `410px` is half the article column width (assuming 820px
  total: 720px reading + 100px decoration on each side).
- `200px` is the TOC's own width.
- `50vw - 410px` puts the right edge of the TOC at the right
  edge of the article column.
- `- 200px` shifts the TOC LEFT by its own width, putting its
  LEFT edge at the article's right edge — but we want it
  RIGHT of the article. So actually the formula should put
  the TOC AFTER the article.

The corrected reading: `max(--la-gutter, calc(50vw - 410px - 200px))`
is the distance from the RIGHT viewport edge to where the
TOC's RIGHT edge should be. So:
- On 1200px viewport: `50vw = 600px`. `600 - 410 - 200 = -10px`.
  Negative → `max` returns `--la-gutter` (32px). The TOC right
  edge is 32px from the viewport right. That's the empty-margin
  position.
- On 1500px viewport: `50vw = 750px`. `750 - 410 - 200 = 140px`.
  The TOC right edge is 140px from the viewport right —
  comfortably in the right margin.

The exact `410px` and `200px` need to match your layout's
article column width and TOC width. Adjust per-layout.
