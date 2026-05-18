# 32 — No nested scrollbars (the universal layout rule)

## Table of Contents

- [What this is](#what-this-is)
- [What is forbidden](#what-is-forbidden)
- [What is allowed (text wrapping carve-out)](#what-is-allowed-text-wrapping-carve-out)
- [What is allowed (CLIP, not SCROLL)](#what-is-allowed-clip-not-scroll)
- [CSS pattern to enforce in any runtime stylesheet](#css-pattern-to-enforce-in-any-runtime-stylesheet)
- [The escape hatch: `.la-article__wide` / `.la-article__bleed`](#the-escape-hatch-la-articlewide--la-articlebleed)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [How to fix a violation](#how-to-fix-a-violation)
- [When a true app-surface scrollbar is allowed](#when-a-true-app-surface-scrollbar-is-allowed)
- [Visual verification](#visual-verification)
- [The `overflow: hidden` vs `overflow: clip` distinction](#the-overflow-hidden-vs-overflow-clip-distinction)
- [Browser support for `overflow: clip`](#browser-support-for-overflow-clip)
- [The legitimate scroll containers](#the-legitimate-scroll-containers)
- [Why "wide content widens the document" works](#why-wide-content-widens-the-document-works)
- [The print perspective](#the-print-perspective)
- [When the rule cannot be satisfied](#when-the-rule-cannot-be-satisfied)

The single most important rule in the layout technique: NO INNER
SCROLLBARS. Wide content (tables, code blocks, diagrams) MUST
extend the document's width — the reader gets ONE outer scrollbar
pair, NEVER inner ones. Text content (`<p>`, `<li>`, prose) may
rely on natural wrapping. This is rule R2 in the universal
self-debug checklist and the hard invariant from
`~/.claude/rules/no-nested-scrollbars.md`.

## What this is

Two scrollbars on one page is a usability disaster:
- Scroll inertia gets stolen — the outer scroll stops because the
  pointer is now over an inner scroller.
- Screen-reader navigation breaks — the inner box is a separate
  region.
- Find-in-page misses content — the browser's find UI scrolls the
  outer document, not the inner box.
- Screenshots are partial — only the visible portion of the inner
  scroller appears.

The layout technique's stance: ONE document, ONE scroll axis. Wide
content extends the document; the reader scrolls horizontally if
needed; nothing inside the document scrolls.

## What is forbidden

- `pre { overflow-x: auto }` — wide code wraps via R9 (soft-wrap),
  never scrolls.
- `<div style="overflow-x:auto">` — wide content widens the
  document via `.la-article__wide` / `.la-article__bleed`, never
  scrolls.
- `table { display: block; overflow-x: auto }` — the "responsive
  table" pattern that puts a scrollbar around a wide table.
  Forbidden. Wide tables use `.la-article__wide` instead.
- `iframe` with its own scrollbar — embedded content should render
  inline, not in a scrolling frame.
- Modal / panel / sidebar with `max-height: …; overflow: auto` —
  the panel should be however tall its content needs; the document
  scrolls if total content exceeds viewport.

## What is allowed (text wrapping carve-out)

Text content (`<p>`, `<li>`, inline prose) MAY rely on natural
text-wrapping to fit the viewport width. CSS already does this by
default. Do NOT force `white-space: nowrap` on a paragraph just to
bend the rule.

## What is allowed (CLIP, not SCROLL)

The layout uses `overflow: hidden` or `overflow: clip` in three
specific cases. ALL ARE CLIPS, not scrollers:

1. **IDE sidebar collapse clip** (`.la-ide__sidebar { overflow:
   hidden }`): the sidebar's contents must not visually overflow
   into the centre column during the 240px-to-0 collapse animation.
   This is a clip of a COLLAPSING BOX; in normal (open) state, the
   sidebar contains its fitting content with no scroll.

2. **Device frame clip** (`.la-device__screen { overflow: hidden }`):
   the screenshot inside the device is clipped to the rounded
   screen rect. The mockup is FIXED-SIZE; the screen content is
   sized to fit; no scroll is needed.

3. **Hero decoration clip** (`.la-hero { overflow: clip }`): the
   oversized ghost text (`28vw` ≈ 360px+) is clipped to the hero
   box. Uses `clip` (not `hidden`) so the hero is not even
   programmatically scrollable — `clip` establishes NO scroll
   container, while `hidden` clips painting but leaves a scrollable
   box.

The distinction is critical: `clip` is the no-nested-scrollbars-
compliant choice for decorations. Use it whenever you need to clip
visual overflow without making the element scrollable.

## CSS pattern to enforce in any runtime stylesheet

```css
html, body { overflow-x: auto; }  /* Document is the scroll context. */

/* Kill any inner scrollers — wide content extends the document. */
pre, table, .ve-content-block,
[data-ve-block], [data-ve-graph], [data-ve-table-wrapper] {
  overflow: visible !important;
  max-width: none !important;
}

/* No max-width on the main column that would force inner scrolling. */
main, .ve-main { max-width: none; }
```

## The escape hatch: `.la-article__wide` / `.la-article__bleed`

The article's 3-column grid (ref 13) is the layout's solution for
wide content inside a measured reading column. A wide table or
code block uses `.la-article__wide` (capped at 92ch) or
`.la-article__bleed` (full document width) to extend without an
inner scrollbar.

Anything wider than the document body extends the BODY's width,
which produces a horizontal scrollbar on the body (a SINGLE outer
scrollbar, allowed). The reader can scroll horizontally to see the
full width.

## Lib functions called

- The runtime (`amvcp-runtime.js`) enforces the
  `main { max-width: none !important }` rule, preventing the
  reading container (ref 13) from being placed on `<main>`.
- `markLayoutAtoms()` doesn't enforce this directly — it stamps
  atoms regardless. Reviewers should grep for `overflow: auto` /
  `overflow: scroll` in custom layouts.

## DESIGN.md tokens used

- None. The rule is structural, not stylistic.

## Selection / comment / decision-mini contract notes

A reviewer cannot directly "comment that an inner scrollbar exists"
— they'd comment on the element containing the scroller. The fix
is for the author to remove the `overflow: auto` rule.

A page that violates R2 is a BUG. The runtime's debug tooling
(R2 in `amvcp-self-debug-rules/SKILL.md`) finds violations.

## How to fix a violation

1. Find the offending element with the debug script:
   ```js
   const innerScrollers = Array.from(document.querySelectorAll('*')).filter(el => {
     const cs = getComputedStyle(el);
     return el !== document.body && el !== document.documentElement
       && (cs.overflowX === 'auto' || cs.overflowX === 'scroll'
        || cs.overflowY === 'auto' || cs.overflowY === 'scroll');
   });
   console.log(innerScrollers);
   ```
2. For each offender:
   - Is the element a wide table / code block? Add
     `.la-article__wide` or `.la-article__bleed` to its container
     (ref 14).
   - Is it a panel that wanted to scroll? Remove the
     `max-height + overflow: auto` rules; let the panel grow
     naturally; the document scrolls.
   - Is it a clip (intentional)? Convert `overflow: hidden` to
     `overflow: clip` — `clip` establishes no scroll container.

## When a true app-surface scrollbar is allowed

The rule applies to DOCUMENTS and REPORTS. It does NOT apply to:
- A code editor (a fixed-viewport text editor surface).
- A video timeline (a fixed-viewport playback control).
- A map (a fixed-viewport pan/zoom surface).

These are APPLICATIONS, not pages. They own their viewport by
design. The rule is for pages the reader consumes top-to-bottom.

The layout technique does NOT ship app surfaces — those are
out-of-scope. Every layout primitive in this catalog follows the
no-nested-scrollbars rule.

## Visual verification

Run the universal self-debug checklist before claiming the layout
is scroll-clean — see `skills/amvcp-self-debug-rules/SKILL.md`.

For no-nested-scrollbars correctness specifically:

- Run the debug script above. The `innerScrollers` array MUST be
  empty.
- Take a screenshot of the page. There should be at most TWO
  scrollbars visible (the document's outer horizontal and
  vertical). NO inner scrollbars on any panel / table / code
  block.
- Insert a deliberately-wide table; verify the DOCUMENT scrolls
  horizontally to show the full table (not an inner scrollbar).
- Insert a deliberately-tall sidebar / panel; verify the DOCUMENT
  scrolls vertically (not an inner panel scrollbar).
- **R1 — Light + dark themes**: the scrollbar behaviour is
  theme-independent; verify in both.
- The screenshot test: take a screenshot at 1280px viewport, then
  at 600px. In neither should an inner scrollbar appear.

## The `overflow: hidden` vs `overflow: clip` distinction

Modern CSS distinguishes:

- **`overflow: hidden`** — clips the visual paint AND establishes
  a SCROLL CONTAINER. The element is programmatically
  scrollable (`element.scrollLeft`, `element.scrollTop` work),
  even though no visible scrollbar appears.
- **`overflow: clip`** — clips ONLY the visual paint. NO scroll
  container is established. The element cannot be scrolled
  programmatically (`scrollTop` stays 0).

For decorations (clipping an oversized decorative pseudo-element
to its container, e.g. the hero ghost text), `overflow: clip`
is the correct primitive. `overflow: hidden` works visually but
leaves a scrollable element, which can confuse screen readers
and breaks the no-nested-scrollbars contract.

The hero (ref 29) uses `overflow: clip` for exactly this
reason. Other layouts that need decoration clipping should also
prefer `clip` over `hidden`.

## Browser support for `overflow: clip`

`overflow: clip` is supported in:
- Chrome 90+ (April 2021)
- Edge 90+
- Firefox 81+ (October 2020)
- Safari 16+ (September 2022)

By 2026, support is universal. No `@supports` fallback needed.

## The legitimate scroll containers

ONE scroll container is allowed: the document itself
(`html` / `body`). On screen, the page may scroll vertically
(common) and/or horizontally (when wide content widens the
document via `.la-article__bleed`).

The document's scroll is the SOLE scroll surface. Everything
else inside the document is scrollbar-free.

## Why "wide content widens the document" works

A reader who needs to see a wide table:
1. Scrolls the document horizontally (browser-native).
2. The whole page shifts left; the table is now fully visible
   (along with surrounding text shifted with it).

This is INTUITIVE — the reader knows how to scroll a page.

Compare with an inner scrollbar on the table:
1. Reader sees a scrollbar inside the table.
2. Mouses over the table; outer scroll stops working.
3. Tries to scroll horizontally INSIDE the table.
4. The scrollbar moves; the table content shifts; surrounding
   text doesn't.
5. Mouses out; outer scroll resumes.
6. Tried find-in-page; only finds text in the visible portion
   of the table.

The inner scrollbar is genuinely worse for the reader.

## The print perspective

Scrollbars don't print — paper has no scrolling. But if the
SCREEN version has inner scrollbars, the print version may
show only the visible portion (the inner-scrollable content
is clipped to its visible width on paper).

This is another reason to avoid inner scrollbars: the printed
PDF will have missing content.

The layout's `.la-article__bleed` widens the document; on print,
the bleed content fits within the printable A4 width (or, if
genuinely wider, may force landscape orientation via custom
`@page` rules — see ref 25).

## When the rule cannot be satisfied

Edge cases where wide content cannot reasonably extend the
document:
- A 10,000-pixel-wide chart embedded in a 600-pixel-wide modal.
  The modal CANNOT widen the document (modals are floating UI).

For these:
- Don't put 10,000-pixel charts in modals. Render them in the
  document body where they can extend properly.
- If a modal MUST contain wide content, the modal IS an
  application surface (per the "true app surface" exception).
  The modal content can scroll; mark it clearly as such.

This is rare. The layout technique doesn't ship modals — those
are interactive-control's job.
