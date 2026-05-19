# Heading anchors and table-of-contents typography

## Table of Contents

- [What it is](#what-it-is)
- [The heading-anchor contract](#the-heading-anchor-contract)
- [Scaffold — heading with anchor](#scaffold--heading-with-anchor)
- [TOC contract](#toc-contract)
- [Scaffold — TOC](#scaffold--toc)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why mono for the anchor "#"](#why-mono-for-the-anchor-)
- [Why the TOC uses `border-left` for hover state](#why-the-toc-uses-border-left-for-hover-state)
- [Sticky TOC and `no-nested-scrollbars`](#sticky-toc-and-no-nested-scrollbars)
- [TOC right-side variant — the fixed sidebar](#toc-right-side-variant--the-fixed-sidebar)
- [Skip link integration](#skip-link-integration)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Accessibility — `aria-label` on `<nav>`](#accessibility--aria-label-on-nav)
- [When NOT to add heading anchors](#when-not-to-add-heading-anchors)
- [When NOT to add a TOC](#when-not-to-add-a-toc)
- [Selection-contract conformance](#selection-contract-conformance)
- [Verification](#verification)
- [Cross-references](#cross-references)

Every section heading on a long page should be deep-linkable — a
URL with a `#fragment` jumps to that heading. The typography skill
ships the `.vc-heading-anchor` modifier (a small "#" link that
appears on hover) and the `.vc-toc` utility class for the
table-of-contents element.

## What it is

Two related patterns:

1. **Heading anchor** — every `<h2>` / `<h3>` etc. with a generated
   `id` gets an invisible "#" link beside it that becomes visible on
   hover. Clicking copies the anchor URL to the clipboard.
2. **Table of contents (TOC)** — a list of links to each heading,
   typically rendered as a sidebar (sticky) or as a section at the
   top of the document.

Both depend on every heading having a stable `id`. The typography
skill ships the *styling*; the *id generation* is owned by the
runtime (the `[data-ve-prose]` heading walker that emits `<h2 id="…">`
from the heading's text-content slug).

## The heading-anchor contract

```css
/* The anchor link inside a heading. */
.vc-heading-anchor {
  margin-left: 0.4em;
  font-size: 0.8em;                    /* smaller than the heading */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  /* Invisible by default. */
  opacity: 0;
  /* Smooth fade. */
  transition: opacity 0.15s ease-in-out;
  color: inherit;
  text-decoration: none;
}

/* Visible on heading hover. */
h1:hover .vc-heading-anchor,
h2:hover .vc-heading-anchor,
h3:hover .vc-heading-anchor,
h4:hover .vc-heading-anchor,
h5:hover .vc-heading-anchor,
h6:hover .vc-heading-anchor {
  opacity: 0.5;
}

/* Full opacity when the anchor itself is hovered. */
.vc-heading-anchor:hover,
.vc-heading-anchor:focus-visible {
  opacity: 1 !important;
  color: var(--vc-color-accent, currentColor);
}

/* Always visible if the heading is the current scroll target. */
:target .vc-heading-anchor {
  opacity: 0.7;
}
```

## Scaffold — heading with anchor

```html
<h2 id="executive-summary">
  Executive Summary
  <a class="vc-heading-anchor" href="#executive-summary"
     aria-label="Link to this heading">#</a>
</h2>
```

The "#" appears on heading hover, in mono small. Click copies the URL
to clipboard (the runtime's JS handles the copy; the typography skill
ships the styling).

## TOC contract

```css
.vc-toc {
  font-family: var(--vc-font-body, inherit);
  font-size: var(--vc-text-1);         /* smaller than body */
  line-height: 1.4;
}

.vc-toc ol,
.vc-toc ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.vc-toc li {
  margin: 0.3em 0;
}

/* Nested entries — H3 under H2. */
.vc-toc ol ol,
.vc-toc ul ul {
  padding-left: 1.2em;
  margin: 0.2em 0;
  font-size: var(--vc-text-0);         /* even smaller for nested */
}

.vc-toc a {
  text-decoration: none;
  color: inherit;
  display: block;
  padding: 0.15em 0;
  border-left: 2px solid transparent;
  padding-left: 0.5em;
  transition: border-color 0.15s, color 0.15s;
}

.vc-toc a:hover {
  color: var(--vc-color-accent, currentColor);
  border-left-color: var(--vc-color-accent, currentColor);
}

/* The current section — highlighted. */
.vc-toc a.vc-active {
  color: var(--vc-color-accent, currentColor);
  border-left-color: var(--vc-color-accent, currentColor);
  font-weight: var(--vc-weight-heading, var(--vc-weight-medium, 500));
}

/* Sticky TOC variant — for sidebars. */
.vc-toc-sticky {
  position: sticky;
  top: 1em;
  /* Don't sit too tall — scrollable interior if needed.
     BUT — this would create an inner scrollbar, which violates
     no-nested-scrollbars. The right answer is to let the TOC
     extend; if it's too long, that's the page author's signal to
     split the document. */
  /* NO max-height + overflow:auto. */
}
```

## Scaffold — TOC

```html
<nav class="vc-toc vc-toc-sticky" aria-label="Table of contents">
  <p class="vc-type-overline">Contents</p>
  <ol>
    <li>
      <a href="#executive-summary">Executive Summary</a>
    </li>
    <li>
      <a href="#root-cause">Root Cause</a>
      <ol>
        <li><a href="#timeline">Timeline</a></li>
        <li><a href="#impact">Impact</a></li>
      </ol>
    </li>
    <li>
      <a href="#action-items">Action Items</a>
    </li>
  </ol>
</nav>
```

## Tokens consumed / extended

- **Consumes:** `--vc-font-mono`, `--vc-font-body`, `--vc-text-0`,
  `--vc-text-1`, `--vc-weight-body`, `--vc-weight-heading`,
  `--vc-weight-medium`, `--vc-color-accent`.
- **Extends:** nothing.

## Why mono for the anchor "#"

The heading anchor is a code-flavoured glyph — `#` is a programmatic
mark, more at home in mono than in body. The mono face also visually
distinguishes the anchor from the heading's prose content.

The opacity transition (0 → 0.5 on hover) is the canonical "subtle
affordance" — the reader sees the anchor only when they hover the
heading; it doesn't add visual noise to the resting state.

## Why the TOC uses `border-left` for hover state

A left border on the TOC link forms a "rail" — as the reader hovers
down the TOC, the border lights up under each link. This is the
canonical "sidebar nav" pattern from GitHub, Notion, and most modern
docs sites.

The active link (the section currently in view) has the same border
in the engine accent colour. The runtime's IntersectionObserver
(scroll spy) is responsible for adding `.vc-active` to the correct
link as the reader scrolls; the typography skill ships only the
styling.

## Sticky TOC and `no-nested-scrollbars`

A sticky TOC sits in a sidebar and stays visible as the reader
scrolls. A LONG TOC (40+ entries) may want to scroll internally so
the visible TOC doesn't grow beyond the viewport.

THIS IS FORBIDDEN by `no-nested-scrollbars.md`. The typography skill's
contract does NOT add a `max-height + overflow: auto` to
`.vc-toc-sticky`. Instead:

- If the TOC is too long for the viewport, the page author splits
  the document.
- Or: the TOC is rendered NOT sticky; it sits at the top of the
  document, scrolling with the page.
- Or: the TOC uses a CSS `position: fixed` with `max-height: 100vh`
  and no scroll (the bottom entries are clipped at the viewport edge).

The cost of inner scrollers (broken find-in-page, broken keyboard
nav, broken screen-reader announcement) is higher than the cost of a
slightly-clipped TOC.

## TOC right-side variant — the fixed sidebar

The Anthropic-Claude reference corpus uses a right-side TOC pattern
(`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.2 "Sticky right-margin TOC anchored to doc column"):

```css
.vc-toc-right {
  position: fixed;
  right: max(24px, calc(50vw - 410px - 200px));
  top: 24px;
  width: 200px;
  /* Only visible on wide viewports. */
}
@media (max-width: 1100px) {
  .vc-toc-right { display: none; }
}
```

The `right` calculation anchors the TOC to the right edge of the
document column (assuming a 820px-wide content column). On narrow
viewports the TOC is hidden — the reader uses the inline TOC at the
top of the document or the browser's "find" instead.

## Skip link integration

The TOC complements the "skip to content" link (see
[accessibility-and-screen-reader.md](../../amvcp-typo-i18n-print/references/accessibility-and-screen-reader.md)).
The skip link is for the first focus stop; the TOC is for navigating
between sections after the page is loaded. Both are required for
full accessibility.

## Light + dark — fully covered

The contract uses `var(--vc-color-accent, currentColor)` for the
hover / active states, and `inherit` for the default colour. Themed
correctly in both themes.

## Accessibility — `aria-label` on `<nav>`

The TOC `<nav>` should have `aria-label="Table of contents"` so screen
readers announce it as "Table of contents navigation". Without the
label, the screen reader announces "navigation" (uninformative).

```html
<nav class="vc-toc" aria-label="Table of contents">…</nav>
```

The typography skill doesn't ship `aria-label` (it's HTML, not CSS);
the agent provides it.

## When NOT to add heading anchors

- **Slide decks** — slides are not deep-linkable in the same way; the
  deck navigation handles section jumping.
- **Single-section pages** — no point in linking to "the one section".
- **Reports printed to PDF** — anchors are useless on paper. The
  print stylesheet (see [print-and-paged-media.md](../../amvcp-typo-i18n-print/references/print-and-paged-media.md))
  suppresses the anchor rendering via the `a[href^="#"]::after` rule.

## When NOT to add a TOC

- Pages with 1-3 sections — a TOC is overhead.
- Slide decks — the deck navigation IS the TOC.
- Dashboards — non-linear content; a TOC is wrong.
- Status pages — same as dashboards.

The TOC is for **linear long-form** content: reports, articles,
documentation, postmortems.

## Selection-contract conformance

The TOC `<nav>` and the heading anchor `<a>` are NOT typography atoms
— they are navigation. The `markTypographyAtoms` walker stamps the
parent heading; the anchor is part of the heading's content. The TOC
is its own non-typography element.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with multiple headings + a TOC.
2. Hover each heading — confirm the "#" anchor fades in.
3. Click an anchor — confirm the URL fragment is set; navigate
   directly to the fragment URL in a fresh tab; confirm scroll
   lands on the heading.
4. Hover a TOC link — confirm the left border lights up in the
   accent colour.
5. Scroll the page — confirm the TOC's `.vc-active` link advances
   to the current section.
6. Confirm in light + dark themes.
7. Print the page — confirm anchors are NOT rendered as visible
   text (per the print stylesheet).

## Cross-references

- [code-and-mono.md](../../amvcp-typo-code-keys/references/code-and-mono.md) — the mono face the anchor
  "#" uses.
- [eyebrow-overline-label.md](../../amvcp-typo-editorial/references/eyebrow-overline-label.md) — the TOC
  header uses `.vc-type-overline` ("CONTENTS").
- [accessibility-and-screen-reader.md](../../amvcp-typo-i18n-print/references/accessibility-and-screen-reader.md)
  — TOC accessibility integrates with the skip-link and landmark
  pattern.
- [print-and-paged-media.md](../../amvcp-typo-i18n-print/references/print-and-paged-media.md) — print
  suppresses anchor rendering.
