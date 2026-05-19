# 06 — Asymmetric grid (3fr : 1fr) — the feature-article variant

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use 3fr : 1fr instead of 2fr : 1fr](#when-to-use-3fr--1fr-instead-of-2fr--1fr)
- [The sticky-sidebar caveat](#the-sticky-sidebar-caveat)
- [Visual verification](#visual-verification)
- [The visual ratio inspection](#the-visual-ratio-inspection)
- [When to consider 4:1 (a future variant)](#when-to-consider-41-a-future-variant)
- [Comparison with `.la-grid--2-1`](#comparison-with-la-grid--2-1)
- [Combining with the article's reading measure](#combining-with-the-articles-reading-measure)

The "more content, less sidebar" weighting. Where `.la-grid--2-1`
(ref 05) treats the sidebar as a peer region, `.la-grid--3-1` treats
it as a margin — a thin column of TOC anchors, page metadata, or a
small navigation. The main column dominates strongly.

## What this is

`.la-grid--3-1` uses `3fr : minmax(min(280px, 100%), 1fr)` columns —
the main column is three times as wide as the sidebar, and the
sidebar floor is slightly lower (280px instead of 300px) because a
narrower sidebar in this variant is intentionally meant to feel
like a margin, not a peer.

The single most common use case is the standard "long-form article
with a sticky TOC" layout that nearly every documentation site
ships: the article extends across most of the viewport, the TOC sits
in a 280-340px column on the right (or left under `dir="rtl"`), and
the eye stays glued to the article.

## Scaffold to emit

```html
<div class="la-grid la-grid--3-1" data-ve-id="layout-main" data-ve-type="layout">
  <div class="la-region la-region--main" data-ve-id="region-content" data-ve-type="region">
    <article class="la-article" data-ve-id="article" data-ve-type="section">
      <h1>Long-form feature article</h1>
      <p>…</p>
      <h2>Section</h2>
      <p>…</p>
    </article>
  </div>
  <aside class="la-region la-region--side" data-ve-id="region-margin"
         data-ve-type="region" style="position:sticky; inset-block-start:var(--la-gap-xl);">
    <nav class="la-toc" data-ve-id="toc" data-ve-type="section" aria-label="On this page">
      <ol class="la-toc__list"></ol>
    </nav>
  </aside>
</div>
```

The `position:sticky; inset-block-start: var(--la-gap-xl)` on the
sidebar makes the TOC scroll with the article until it hits the
sticky offset, then stick to the top — a hallmark of long-form
documentation pages. The `--la-gap-xl` (64px) offset ensures the
sticky sidebar starts well below the page header.

The CSS for the grid itself ships in `amvcp-layout.css`:

```css
.la-grid--3-1 { grid-template-columns: 3fr minmax(min(280px, 100%), 1fr); }
@media (max-width: 768px) {
  .la-grid--3-1 { grid-template-columns: 1fr; }
}
```

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type` on every
  `.la-region` (see ref 33).
- `initTOC()` wires the scroll-spy TOC inside the sidebar (see
  refs 21-24).
- The sticky-sidebar behaviour is pure CSS (`position: sticky`),
  no JS.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-lg` | 32px | grid column gap |
| `--la-gap-xl` | 64px | sticky-sidebar top offset |
| `--vc-color-border` | (theme) | TOC indent border |
| `--vc-color-accent` | (theme) | active TOC link |

## Selection / comment / decision-mini contract notes

Same as `.la-grid--2-1` (ref 05): the grid container is NOT a
selectable atom; its child `.la-region` elements are. The
`data-la-sticky` data attribute (if added) is purely decorative —
the runtime does not change behaviour based on it.

A reviewer comment on the sidebar ("make the TOC sticky on this
page only") becomes an inline `style="position:sticky"` on the
sidebar; the change is local to the page and does not require
modifying the grid preset CSS.

## When to use 3fr : 1fr instead of 2fr : 1fr

- The sidebar is just a TOC + a few metadata pills (not a full
  navigation panel).
- The article is the page's REASON FOR EXISTING (a docs page, a
  blog post, a feature explainer) and should dominate.
- The sticky-TOC pattern is desired (a tall sidebar sticks while
  the article scrolls past).

If the sidebar holds significant content (a "Related articles" list
with thumbnails, a "Recent comments" panel, a long author bio),
use `.la-grid--2-1` instead — the heavier sidebar earns the
2fr-vs-1fr equality.

## The sticky-sidebar caveat

`position: sticky` only works if:
- The sticky element has a `top` (or `inset-block-start`) value.
- The sticky element's parent (the grid cell) is taller than the
  sticky element itself. Once the parent is fully scrolled past,
  the sticky element scrolls with it.
- No ancestor has `overflow: hidden` / `auto` / `scroll` — those
  trap the sticky positioning context. The layout technique avoids
  inner scrollers entirely (see ref 32), so this should not occur,
  but a downstream custom CSS that adds `overflow:hidden` to a grid
  cell will break the sticky.

If `position:sticky` "doesn't work", the root cause is almost always
an overflow-clipping ancestor. The fix is to remove the overflow
constraint, NEVER to switch to `position:fixed` (fixed positioning
breaks the no-nested-scrollbars contract and behaves wrong on mobile
in many ways).

## Visual verification

Run the universal self-debug checklist before claiming this grid is
correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For 3fr-1fr grid correctness specifically:

- Open dev-browser. Verify:
  ```js
  const cs = getComputedStyle(document.querySelector('.la-grid--3-1'));
  console.log('cols:', cs.gridTemplateColumns);
  ```
  Should resolve to two pixel widths with ratio approximately 3:1
  (sidebar floor may distort it at narrow viewports).
- Scroll the page. If the sidebar has `position:sticky`, the TOC
  must stay visible at the top of the viewport while the article
  scrolls past.
- **R1 — Light + dark themes**: switch themes; the grid must
  render identically.
- **R2 — No nested scrollbars**: the sidebar must NOT have
  `overflow: auto`. If TOC entries are too tall to fit in the
  viewport, the sticky behaviour is the right answer (they
  scroll with the article); an inner-scrolling TOC is wrong.
- Test at 768px wide and below: the grid must collapse to one
  column.

## The visual ratio inspection

A pure `3fr : 1fr` should render the sidebar at ~25% of the
viewport's content area (after gutters). The sidebar floor
`minmax(min(280px, 100%), 1fr)` distorts this at narrow
viewports — at 1024px viewport with 32px gutters, the sidebar
wants to be `(1024 - 32) / 4 = 248px` (below the 280px floor),
so the floor activates and the sidebar takes 280px, the main
column takes the remaining `1024 - 32 - 280 = 712px`.

This deliberate distortion preserves usability: a sub-280px
sidebar is too cramped for a TOC. The 3:1 ratio is preserved
on viewports >1232px (where `(1232 - 32) / 4 = 300px > 280px`
floor); on narrower viewports, the sidebar holds its 280px
minimum and the main column shrinks proportionally.

## When to consider 4:1 (a future variant)

For exceptionally text-heavy articles, a `4fr : 1fr` ratio is
even more main-column-dominant. The layout doesn't currently
ship `.la-grid--4-1` — but it would be a 5-line addition:

```css
.la-grid--4-1 { grid-template-columns: 4fr minmax(min(240px, 100%), 1fr); }
@media (max-width: 768px) {
  .la-grid--4-1 { grid-template-columns: 1fr; }
}
```

If a downstream layout needs 4:1, add it to the consuming page's
CSS (no need to extend `amvcp-layout.css` for one-off ratios).

The `240px` sidebar floor is appropriate for 4:1 because the
sidebar is intended as a margin (typically just a TOC), not a
peer region.

## Comparison with `.la-grid--2-1`

| | `.la-grid--2-1` (ref 05) | `.la-grid--3-1` (this) |
|---|---|---|
| Ratio | 2fr : 1fr | 3fr : 1fr |
| Sidebar floor | min(300px, 100%) | min(280px, 100%) |
| Main column dominates? | Slightly | Strongly |
| Sidebar feels like... | A peer region | A margin |
| Common use | Reports with rich sidebar | Articles with thin TOC |
| Sticky-sidebar fit | OK (heavy sidebar may not stick well) | Excellent (thin sticky TOC) |

Choose by the WEIGHT of the sidebar content, not by the visual
preference. A heavy sidebar in a 3:1 grid feels squashed; a
thin sidebar in a 2:1 grid feels under-filled.

## Combining with the article's reading measure

The 3:1 grid puts the main column at ~75% of the content area.
At 1280px viewport with 32px gutters, that's `(1280 - 32) * 0.75
= 936px`. But the article's reading measure (`--la-measure: 68ch`)
caps the column at ~572px (at 16px font).

So inside the 936px main column, the article ITSELF only fills
~572px (centred via the article's 3-column grid). The remaining
~364px is empty article gutter — visually present but unused.

This is INTENTIONAL — the reading measure is the typographic
correctness; the grid template is the visual proportion. The
unused gutter isn't waste; it's the breathing room around the
prose.

If you want the article to fill the whole 75% main column, use
`.la-article__bleed` for that content (ref 14) — but that
defeats the reading measure. Pick one or the other.
