# Table of Contents (`vc-toc`) + scroll-spy + anchor system

## Table of Contents

- [When to add a TOC](#when-to-add-a-toc)
- [Scaffold (default — single-column doc)](#scaffold-default--single-column-doc)
- [CSS (already injected by the runtime)](#css-already-injected-by-the-runtime)
- [The scroll-spy (already implemented in `init`)](#the-scroll-spy-already-implemented-in-init)
- [Variants by layout](#variants-by-layout)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [The heading-anchor offset](#the-heading-anchor-offset)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Anti-patterns](#anti-patterns)

The structural primitive that makes long documents navigable: a
`<nav class="vc-toc">` with an ordered list of links, plus a
JavaScript scroll-spy that adds `.vc-toc-active` to the link of the
section currently in view. Includes the heading-anchor offset trick
(`scroll-margin-block-start`) that keeps a linked heading clear of
sticky chrome.

The TOC is the single most important navigability primitive — it
turns a 30-screen document into a 5-section map. Documents with 4+
top-level sections that lack a TOC routinely lose 60% of their
readers to the depth of scroll alone.

## When to add a TOC

| Add it | Skip it |
|---|---|
| Document has ≥4 top-level `<h2>` sections | ≤3 sections (TOC adds clutter) |
| Reader will use the TOC to jump and re-read | Reader reads top-to-bottom and never returns |
| The document is referenced repeatedly over time | One-off summary |
| Section names are short (≤4 words) | Section names are sentences (TOC becomes a wall) |

For 2-3 section documents, omit the TOC; readers can scroll. For 4+
sections, the TOC pays its weight.

## Scaffold (default — single-column doc)

```html
<nav class="vc-toc" aria-label="Table of contents">
  <p class="vc-toc-title">Contents</p>
  <ol>
    <li><a href="#summary">Summary</a></li>
    <li><a href="#milestones">Milestones</a></li>
    <li><a href="#data-flow">How data flows</a></li>
    <li><a href="#mockups">What it looks like</a></li>
    <li><a href="#code">Where to focus in code</a></li>
    <li><a href="#risks">Risks &amp; mitigations</a></li>
    <li class="vc-toc-sub"><a href="#high-risks">High</a></li>
    <li class="vc-toc-sub"><a href="#med-risks">Medium</a></li>
    <li><a href="#open-questions">Open questions</a></li>
  </ol>
</nav>
```

The runtime auto-numbers entries via CSS counter (`counter-increment:
vc-toc` + `decimal-leading-zero`). Hand-writing the numbers in the
link text doubles them up.

## CSS (already injected by the runtime)

```css
.vc-toc {
  counter-reset: vc-toc;
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  padding: var(--vc-space-4, 16px) var(--vc-space-5, 32px);
  margin-block: var(--vc-space-5, 32px);
}
.vc-toc-title {
  font-weight: var(--vc-weight-bold, 700);
  margin: 0 0 var(--vc-space-2, 8px);
}
.vc-toc ol { list-style: none; margin: 0; padding: 0; }
.vc-toc li {
  counter-increment: vc-toc;
  padding-block: var(--vc-space-1, 4px);
}
.vc-toc li.vc-toc-sub { padding-inline-start: var(--vc-space-4, 16px); }
.vc-toc li::before {
  content: counter(vc-toc, decimal-leading-zero);
  color: var(--vc-color-accent, #b8861f);
  font-feature-settings: "tnum";
  margin-inline-end: var(--vc-space-3, 12px);
}
.vc-toc a {
  color: var(--vc-color-content, #1f1a14);
  text-decoration: none;
}
.vc-toc a:hover { color: var(--vc-color-accent, #b8861f); }
.vc-toc a.vc-toc-active {
  color: var(--vc-color-accent, #b8861f);
  font-weight: var(--vc-weight-bold, 700);
}

/* The heading anchor offset — keeps the linked heading clear of
   sticky chrome. */
.vc-doc :target { scroll-margin-block-start: var(--vc-space-5, 32px); }
```

## The scroll-spy (already implemented in `init`)

`amvcpReportDoc.init(document)` (auto-fires on `DOMContentLoaded`)
walks every `.vc-toc` and wires an `IntersectionObserver` that
adds `.vc-toc-active` to the link whose target is currently in view.

The threshold is `rootMargin: '-10% 0px -80% 0px'` — a section is
"active" when its heading enters the top 10-20% of the viewport. This
matches the reading-eye position and works well with sticky headers.

For dynamically-inserted TOCs (e.g. the page renders new sections
mid-flight), call `amvcpReportDoc.refresh(document)` to disconnect
and rebuild the observer.

## Variants by layout

The TOC can live in three positions; pick one per document.

### Inline (default)

The TOC is part of the document flow, between the header and the
first section. Best for documents read top-to-bottom on first visit;
the reader sees the TOC, scrolls past it, and may scroll back to
re-navigate.

```html
<header class="vc-doc-header">…</header>
<nav class="vc-toc">…</nav>
<section id="summary">…</section>
```

### Sticky-left sidebar

The TOC sits to the left of the main column and stays visible as the
reader scrolls. Best for long reference documents (feature explainers,
architecture explainers).

```html
<article class="vc-doc vc-doc--has-sticky-toc">
  <nav class="vc-toc vc-toc--sticky-left">…</nav>
  <main class="vc-main">…</main>
</article>
```

```css
.vc-doc--has-sticky-toc {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--vc-space-6, 48px);
}
.vc-toc--sticky-left {
  position: sticky;
  top: var(--vc-space-5, 32px);
  align-self: start;
  max-height: calc(100dvh - 64px);
  overflow-y: auto;
  background: transparent;
  border: none;
  padding: 0;
  font-size: var(--vc-text-1, 14px);
}
@media (max-width: 920px) {
  .vc-doc--has-sticky-toc { grid-template-columns: 1fr; }
  .vc-toc--sticky-left { position: static; max-height: none; }
}
```

### Fixed-right margin

The TOC sits in the right margin, anchored to the document column,
visible only on wide screens. Best for postmortems / single-narrative
documents where the main column is the focus and the TOC is
supplementary navigation.

```css
.vc-toc--fixed-right {
  position: fixed;
  top: var(--vc-space-5, 32px);
  inset-inline-end: max(var(--vc-space-4, 16px),
                         calc(50vw - var(--vc-doc-measure) / 2 - 240px));
  width: 200px;
  font-size: var(--vc-text-1, 14px);
  background: transparent;
  border: none;
  border-inline-start: 1px solid var(--vc-color-border, #e3dcc9);
  padding-inline-start: var(--vc-space-3, 12px);
}
@media (max-width: 1100px) {
  .vc-toc--fixed-right { display: none; }
}
```

The `max(..., calc(...))` formula keeps the TOC anchored to the
document edge regardless of viewport width — see
`incident-postmortem-shape.md` for context.

### Mobile horizontal-bar variant

Below the sticky-sidebar breakpoint, a sticky horizontal bar at the
top of the page replaces the sidebar TOC:

```css
@media (max-width: 920px) {
  .vc-toc--sticky-left {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--vc-color-canvas);
    border-block-end: 1px solid var(--vc-color-border);
    padding: var(--vc-space-2, 8px) var(--vc-space-4, 16px);
    margin: 0;
  }
  .vc-toc--sticky-left ol { display: contents; }
  .vc-toc--sticky-left li {
    flex-shrink: 0;
    border-inline-start: none;
    padding-block: 6px;
    padding-inline: 10px;
    border-block-end: 2px solid transparent;
  }
  .vc-toc--sticky-left a.vc-toc-active {
    border-block-end-color: var(--vc-color-accent);
  }
  .vc-toc--sticky-left .vc-toc-title { display: none; }
}
```

The active tab auto-scrolls into view (the scroll-spy does this when
`window.innerWidth <= 920`):

```js
match.link.scrollIntoView({
  behavior: 'smooth', block: 'nearest', inline: 'center'
});
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Number color, hover color, active color |
| `--vc-color-content` | Default link color |
| `--vc-color-surface` | Inline TOC background |
| `--vc-color-border` | Inline TOC border, fixed-right TOC divider, mobile-bar divider |
| `--vc-radius-md` | Inline TOC corner |
| `--vc-text-1` | Sticky/fixed TOC link size (one notch smaller than body) |
| `--vc-space-1` / `--vc-space-3` / `--vc-space-4` / `--vc-space-5` | Padding + spacing |

## The heading-anchor offset

When the TOC link points to `#summary` and the user clicks it, the
browser scrolls so that the `<h2 id="summary">` heading sits at the
very top of the viewport. If the document has a sticky header, the
heading is hidden behind it.

The `scroll-margin-block-start` rule fixes this:

```css
.vc-doc :target { scroll-margin-block-start: var(--vc-space-5, 32px); }
```

Adjust the value to match the height of your sticky chrome. Always
use the logical property (`scroll-margin-block-start`) over the
physical (`scroll-margin-top`) for RTL-safety.

## Composition with other skills

| Embed inside | Notes |
|---|---|
| `feature-explainer-shape` | Sticky-left variant + Files-read footer |
| `architecture-explainer-shape` | Sticky-left variant + Key files / Gotchas panels |
| `incident-postmortem-shape` | Fixed-right variant |
| `whitepaper-shape` | Inline variant |
| `rfc-shape` | Inline variant (after the metadata header) |
| `implementation-plan-shape` | Inline variant |
| `compare-n-approaches-shape` | Skip — short documents |
| `tldr-summary-card` | Skip — TL;DR doesn't get a TOC entry |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);  // ships TOC CSS
window.amvcpReportDoc.init(document);                // wires scroll-spy
// after dynamic insert:
window.amvcpReportDoc.refresh(document);             // re-scans the TOC
```

## Selection / comment notes

- The TOC as a whole is selectable as a unit
  (`{type:"toc"}`) so a reviewer can comment on the structure.
- Each TOC entry is selectable per `<li>`
  (`{type:"toc-entry", section:"summary"}`) — useful for "this
  section needs renaming" comments.
- The TOC title is selectable independently.
- The active highlight is purely visual (a class added on scroll);
  it does not affect selection.

## Anti-patterns

- **TOC for a 2-section document** — clutter without value.
- **TOC with hand-numbered link text** (`01. Summary`) — collides
  with the CSS counter; the rendering shows `01  01. Summary`.
- **TOC links to non-existent ids** — clicking a broken link does
  nothing; the scroll-spy never highlights. Validate that every
  `href="#x"` matches an `id="x"`.
- **TOC link text mismatched from heading text** — confuses the
  reader and breaks "find on page". Use the same words.
- **>15 entries in a sticky-left TOC** — the sidebar overflows; the
  reader cannot scan the list. Add subsection nesting OR split into
  multiple documents.
- **Sticky-left TOC on mobile** — kills the reading area. The
  mobile-horizontal-bar variant exists for this; use the breakpoint.
- **Fixed-right TOC without the wide-screen guard** — overlaps the
  body on viewports below 1100px. Always include the
  `@media (max-width: 1100px) { display: none; }` rule.
- **Hand-coded JS scroll-spy that doesn't match `vc-toc-active`** —
  the runtime's `init()` already does this; rolling your own loses
  the standard CSS hook.
- **No `aria-label` on the `<nav>`** — screen readers say "navigation"
  with no context; use `aria-label="Table of contents"`.
- **Skipping `scroll-margin-block-start`** — every linked heading
  hides under the sticky header on click; the reader sees a blank
  page below the chrome.
