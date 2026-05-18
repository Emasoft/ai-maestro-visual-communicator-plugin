# 17 — Sticky page header (`.la-header` + scroll-state border)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Why an IntersectionObserver on a sentinel and NOT a scroll-event listener](#why-an-intersectionobserver-on-a-sentinel-and-not-a-scroll-event-listener)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [JS-off graceful degradation](#js-off-graceful-degradation)
- [Why `transition` on `border-color` not `border-block-end`](#why-transition-on-border-color-not-border-block-end)
- [When to use this header](#when-to-use-this-header)
- [Visual verification](#visual-verification)

A page-top header that sticks to the viewport via `position: sticky;
inset-block-start: 0` and gets a hairline border once the page is
scrolled. The sticky behaviour is pure CSS; the scroll-state border
is wired by `amvcp-layout.js` via an `IntersectionObserver` on a
sentinel element (NOT a scroll-event listener — see "Why IO" below).

## What this is

A standard pattern: a page header (title + TOC toggle + nav) that
remains visible at the top of the viewport as the user scrolls
down. When the page is at the very top (sentinel intersecting), the
header has no visible border — it blends with the page background.
Once the page scrolls past the sentinel, the header grows a
hairline border below it (`border-block-end-color` transitions from
transparent to `--vc-color-border`), visually separating itself
from the scrolling content.

The sticky positioning is `position: sticky; inset-block-start: 0;
z-index: var(--vc-z-sticky, 200)`. The z-index uses the engine's
optional `--vc-z-sticky` token (the `z-index` token group is
optional in the DESIGN.md schema; the `200` is a fallback).

## Scaffold to emit

```html
<header class="la-header" data-ve-id="page-header" data-ve-type="section">
  <span class="la-header__title">Report title</span>
  <nav class="la-header__nav">
    <a href="#section-1">Overview</a>
    <a href="#section-2">Details</a>
    <button class="la-ide-toggle" data-la-toggle="ide" aria-expanded="true">
      Sidebar
    </button>
  </nav>
</header>

<!-- The rest of the page content goes here. -->
<main>
  <article class="la-article" data-ve-id="article">
    …
  </article>
</main>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-header {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--vc-z-sticky, 200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--la-gap);
  padding-block: var(--la-gap-sm);
  padding-inline: var(--la-gutter);
  background: var(--vc-color-surface);
  color: var(--vc-color-content);
  border-block-end: 1px solid transparent;
  transition: border-color var(--vc-duration-quick, 200ms)
    var(--vc-easing-standard, ease);
}
.la-header.is-scrolled {
  border-block-end-color: var(--vc-color-border);
}
.la-header__title {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-weight: var(--vc-weight-bold, 700);
}
.la-header__nav {
  display: flex;
  align-items: center;
  gap: var(--la-gap-sm);
}
```

The `.is-scrolled` class is toggled by JS (see "Lib functions
called" below).

## Why an IntersectionObserver on a sentinel and NOT a scroll-event listener

This is the most important non-obvious decision in the sticky-header
implementation. From the `amvcp-layout.js` source comment:

> The scroll event coalesces with `scroll-behavior: smooth` and with
> programmatic `window.scrollTo(…)` in surprising ways — in particular
> a `scrollTo(0, 0)` issued from a test may fire only the INTERMEDIATE
> scroll positions before the wait expires, leaving `is-scrolled`
> stuck on. IntersectionObserver fires off the actual visibility of
> the sentinel rather than off scroll-events, so the class always
> matches the rendered state by the next animation frame.

The sentinel is a tiny `1px` block injected by `amvcp-layout.js`
immediately BEFORE the `.la-header` in the DOM:

```html
<div class="la-header-sentinel"
     aria-hidden="true"
     style="display:block;block-size:1px;…;visibility:hidden;"></div>
<header class="la-header">…</header>
```

The IO observes the sentinel:
- When the sentinel is intersecting the viewport (page is at top),
  `is-scrolled` is removed.
- When the sentinel scrolls out of view (page has scrolled), 
  `is-scrolled` is added.

This produces a reliable on/off toggle that is robust to programmatic
scrolling, scroll-behavior smooth, and the iOS rubber-band scroll.

## Lib functions called

- `initStickyHeader()` (in `amvcp-layout.js`, called by `boot()`):
  - Walks every `.la-header` on the page.
  - For each, calls `wireHeaderSentinel(doc, header)` which:
    - Injects a `.la-header-sentinel` div before the header if not
      already present.
    - Creates an `IntersectionObserver` with `threshold: 0` that
      toggles `is-scrolled` on the header based on the sentinel's
      visibility.
  - Returns the LAST observer (for testing / cleanup).

- `markLayoutAtoms()` does NOT stamp `.la-header` directly (it is
  not in the SHAPES list). The author hand-stamps `data-ve-id` on
  the header so the runtime treats it as a selectable atom
  (`section` type).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-z-sticky` | 200 (fallback) | header z-index |
| `--la-gap` | 16px | gap between title and nav |
| `--la-gap-sm` | 8px | header padding-block |
| `--la-gutter` | 32px | header padding-inline |
| `--vc-color-surface` | (theme) | header background |
| `--vc-color-content` | (theme) | header text |
| `--vc-color-border` | (theme) | scrolled-state border |
| `--vc-duration-quick` | 200ms | border-color transition duration |
| `--vc-easing-standard` | ease | transition easing |
| `--vc-font-heading` | Georgia | title font |
| `--vc-weight-bold` | 700 | title weight |

## Selection / comment / decision-mini contract notes

The header is a selectable atom (`data-ve-type="section"` via the
author's hand-stamped `data-ve-id`). A reviewer can comment on the
header ("add a save button", "remove the sidebar toggle"). The
title text inside is selectable via the runtime's text-snippet
mechanism (drag-select → snippet handle).

The toggle button is NOT a selectable atom (buttons are excluded
from the selection model, see `amvcp-self-debug-rules` R4). The
`<a>` nav links are similarly not selectable as atoms.

## JS-off graceful degradation

With JavaScript disabled:
- The header is STILL sticky (`position: sticky` is pure CSS).
- The scroll-state border NEVER appears (no IO to toggle it).
- The page is still navigable; only the visual scroll-state cue is
  missing.

This is the right tradeoff: the sticky behaviour is critical (the
user needs to find the title / nav while scrolling); the border is
decorative.

## Why `transition` on `border-color` not `border-block-end`

Transitioning the COLOR avoids the layout-shift bug: changing the
border width from `0` to `1px` would push the page content down by
1px when the class toggles. By keeping the border `1px solid
transparent` always and transitioning the COLOR from transparent to
the theme border, the layout is stable; only the visible pixel
changes.

## When to use this header

- A long-form report or article where the title needs to remain
  visible while scrolling.
- A documentation page with a top nav that the user needs to
  reference.
- An admin / dashboard page with persistent global controls.

When NOT to use:
- A slide deck (slides are full-viewport; a sticky header would
  consume slide real estate).
- A print-only page (the sticky behaviour is irrelevant on paper;
  see ref 26 — the `@media print` block disables sticky).
- A modal / popup (modals have their own header inside the modal,
  not a page-level sticky).

## Visual verification

Run the universal self-debug checklist before claiming the sticky
header is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For sticky header correctness specifically:

- Open dev-browser. Verify the sentinel is injected:
  ```js
  document.querySelector('.la-header-sentinel') !== null
  ```
  Should be true after `boot()` runs.
- Verify the header has no border at top:
  ```js
  // Scroll to top first
  window.scrollTo(0, 0);
  await new Promise(r => requestAnimationFrame(r));
  const header = document.querySelector('.la-header');
  console.log(header.classList.contains('is-scrolled'));  // false
  console.log(getComputedStyle(header).borderBlockEndColor);  // transparent
  ```
- Scroll the page; verify the border appears:
  ```js
  window.scrollTo(0, 200);
  await new Promise(r => setTimeout(r, 100));  // let IO fire
  console.log(header.classList.contains('is-scrolled'));  // true
  console.log(getComputedStyle(header).borderBlockEndColor);  // non-transparent
  ```
- **R1 — Light + dark themes**: switch themes; the border colour
  uses `--vc-color-border`, which is theme-adapted. The header
  background uses `--vc-color-surface`. Both must be legible in
  both themes.
- **R2 — No nested scrollbars**: the header is a flex strip;
  it should never have an inner scrollbar. If a too-long nav
  overflows, the nav should wrap or truncate, never scroll.
- The "scroll past then back to top" check: after the header has
  `.is-scrolled`, scroll back to 0; the class should be REMOVED
  on the next IO callback. If it isn't, the sentinel may have
  been removed accidentally — re-check the DOM.
