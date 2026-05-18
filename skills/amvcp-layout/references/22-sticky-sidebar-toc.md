# 22 — Sticky-sidebar TOC (the canonical "TOC in left/right column" pattern)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The `align-self: start` requirement](#the-align-self-start-requirement)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [The "TOC overflows the viewport" case](#the-toc-overflows-the-viewport-case)
- [When to use this pattern](#when-to-use-this-pattern)
- [Visual verification](#visual-verification)
- [The "scroll-margin" coordination](#the-scroll-margin-coordination)
- [The "hide TOC on print" coordination](#the-hide-toc-on-print-coordination)

The most common TOC presentation: a `.la-toc` placed inside a
sidebar (the second column of `.la-grid--2-1` or `.la-grid--3-1`)
with `position: sticky; top: 24px; align-self: start`. The TOC
scrolls with the article until it hits the sticky offset, then
sticks to the viewport top, remaining visible as the user reads
through the article. The `align-self: start` inside the grid is
non-obvious but essential.

## What this is

Sticky-sidebar TOC = scroll-spy TOC (ref 21) + sticky positioning
applied to the TOC's CONTAINER. Mechanically:

```css
.la-toc {
  position: sticky;
  inset-block-start: var(--la-gap-lg);   /* 32px below viewport top */
  align-self: start;                      /* prevents grid stretching */
}
```

The `align-self: start` is the non-obvious piece: CSS Grid items
default to `align-self: stretch`, meaning the TOC would expand to
match the article's height. If the TOC is stretched to e.g. 3000px
tall, `position: sticky` doesn't have any room to act — the TOC is
the same height as the entire grid cell, so it never "sticks" (it
takes up the whole vertical space).

Setting `align-self: start` makes the TOC its natural height (just
the height of its items), leaving room in the grid cell for the
sticky behaviour to actually function.

## Scaffold to emit

A two-column page with a sticky-sidebar TOC:

```html
<div class="la-grid la-grid--3-1" data-ve-id="layout-main" data-ve-type="layout">
  <div class="la-region la-region--main" data-ve-id="region-content" data-ve-type="region">
    <article class="la-article" data-ve-id="article" data-ve-type="section">
      <h1>Long-form article</h1>
      <h2 id="intro">Introduction</h2>
      <p>…lots of prose…</p>
      <h2 id="design">Design</h2>
      <p>…</p>
      <h2 id="impl">Implementation</h2>
      <p>…</p>
    </article>
  </div>

  <aside class="la-region la-region--side" data-ve-id="region-sidebar" data-ve-type="region">
    <nav class="la-toc"
         data-ve-id="toc"
         data-ve-type="section"
         aria-label="On this page">
      <ol class="la-toc__list"></ol>
    </nav>
  </aside>
</div>
```

The CSS additions (the base TOC styles ship in `amvcp-layout.css`;
the sticky behaviour is a per-page rule):

```css
.la-grid--3-1 > .la-region--side {
  /* The sidebar column itself stays grid-aligned;
     the TOC inside is what we make sticky. */
}
.la-grid--3-1 .la-toc {
  position: sticky;
  /* Offset from viewport top — 32px is a comfortable visual gap. */
  inset-block-start: var(--la-gap-lg);
  /* CRITICAL: prevents grid from stretching the TOC. */
  align-self: start;
}
```

If there is ALSO a sticky page header (ref 17), offset the TOC
below the header:

```css
.la-grid--3-1 .la-toc {
  position: sticky;
  /* Header height (48px) + visual gap (32px) = 80px. */
  inset-block-start: calc(var(--la-header-height, 48px) + var(--la-gap-lg));
  align-self: start;
}
```

## The `align-self: start` requirement

CSS Grid items default to stretching to fill the grid cell. The
TOC, in a 3000px tall article column, would expand to 3000px tall —
which makes `position: sticky` useless (the TOC IS the column, so
nothing to stick within).

`align-self: start` shrinks the TOC to its natural height (just the
items + padding). Now the TOC is e.g. 240px tall, the grid cell is
3000px tall, and the TOC can stick at the top of the viewport while
the article scrolls past for the remaining 2760px.

This rule is invisible until you see the failure: a TOC that
"doesn't stick" is almost always missing `align-self: start`. Fix
it before suspecting any other cause.

## Lib functions called

- `initTOC()` builds and highlights the TOC (see ref 21).
- The sticky positioning itself is pure CSS — no JS needed.
- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type` on the
  sidebar region (see ref 33).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-lg` | 32px | sticky offset from viewport top |
| `--la-header-height` | (none — set per-page) | sticky offset when header is present |
| (TOC link styles inherit from ref 21) | — | see ref 21 |

## Selection / comment / decision-mini contract notes

Same as ref 21. The TOC is a selectable atom; the sticky
positioning doesn't change the selection model.

A reviewer can comment on the TOC ("make it floating", "hide on
narrow viewports") — the comment is keyed by the TOC's `data-ve-id`,
not by the sticky behaviour.

## The "TOC overflows the viewport" case

If the TOC has 30+ entries and the sticky positioning keeps it
fixed at the top, the BOTTOM entries may scroll off below the
viewport — no inner scrollbar (per R2), so they're just hidden.

The correct fix is NOT to add `max-height: 100vh; overflow: auto`
on the TOC (violates R2). Instead:
- Reduce the TOC depth (only `h2`, not `h2, h3`).
- Group related sections under a parent heading and only TOC the
  parent.
- Use a "compact" TOC variant with smaller font / tighter gaps.

If the TOC genuinely needs to scroll independently of the article
(rare), the page is too dense — break it into multiple pages.

## When to use this pattern

- Long-form documentation pages (this is THE canonical pattern).
- Multi-section reports where the TOC needs to remain visible.
- A pull-request review page with file navigation that should
  remain visible as the user scrolls through diffs.

When NOT to use:
- A short article with 2-3 sections (a TOC at the top is enough).
- A page without a sidebar (use the right-margin TOC, ref 23).

## Visual verification

Run the universal self-debug checklist before claiming this
sticky-sidebar TOC is correct — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For sticky-sidebar TOC correctness specifically:

- Open dev-browser. Verify the TOC is sticky:
  ```js
  const toc = document.querySelector('.la-toc');
  console.log(getComputedStyle(toc).position);  // 'sticky'
  console.log(getComputedStyle(toc).insetBlockStart);  // '32px' or similar
  console.log(getComputedStyle(toc).alignSelf);  // 'start'
  ```
  All three must be correct. `align-self: start` is the most often
  missed.
- Scroll the page; the TOC should remain at the top of the
  viewport while the article scrolls past.
- After the entire grid cell has been scrolled past (the article
  ends), the TOC should also scroll off-screen (sticky releases).
- **R1 — Light + dark themes**: switch themes; the TOC is
  theme-correct via `--vc-color-*` tokens (ref 21).
- **R2 — No nested scrollbars**: the TOC must NOT have
  `overflow: auto`. If the TOC is too tall to fit the viewport,
  reduce the depth — never add inner scroll.
- **R5 — Two independent bubble handles**: the TOC as a whole is
  a selectable atom (left-edge bubble handle); the headings the
  TOC links to are independently selectable. Both should work
  while the TOC is sticky.
- The mobile-collapse check: at <768px viewport, the grid
  collapses to one column (ref 12) and the TOC drops INTO the
  article flow. The sticky behaviour stops working (no
  multi-column layout), which is correct — on mobile, the TOC
  is just inline at the top.

## The "scroll-margin" coordination

When the user clicks a TOC link, the browser scrolls to the
target heading. With a sticky page header AND a sticky-sidebar
TOC, the heading would land BEHIND the sticky chrome unless the
heading has `scroll-margin-block-start`.

The layout's CSS already sets this for all headings:

```css
h1, h2, h3, h4, h5, h6 {
  scroll-margin-block-start: var(--la-gap-xl, 64px);
}
```

The 64px offset gives the heading 64px of breathing room from
the viewport top after a TOC click, ensuring it appears just
below the sticky header.

If the page has a TALLER sticky header (e.g. 80px), increase
the scroll-margin proportionally:

```css
h1, h2, h3, h4, h5, h6 {
  scroll-margin-block-start: 96px;  /* header + visual gap */
}
```

## The "hide TOC on print" coordination

Per the print reset (ref 26), the TOC is hidden in print:

```css
@media print {
  .la-toc { display: none !important; }
}
```

The sticky-sidebar TOC is sticky on screen but invisible on
paper. The article fills the printed page width.
