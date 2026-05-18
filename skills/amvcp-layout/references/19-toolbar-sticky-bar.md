# 19 — Sticky toolbar (`position: sticky` action bar above content)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The "above the playground inside the page" variant](#the-above-the-playground-inside-the-page-variant)
- [The combined "page header + section toolbar" stack](#the-combined-page-header--section-toolbar-stack)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use a sticky toolbar](#when-to-use-a-sticky-toolbar)
- [Why `position: sticky` not `position: fixed`](#why-position-sticky-not-position-fixed)
- [Visual verification](#visual-verification)

A pattern frequently seen in editor / playground pages: a
horizontal toolbar with controls (theme toggle, filters, action
buttons) that sticks to the top of its scroll container. Distinct
from the page-level sticky header (ref 17) because the toolbar
is typically INSIDE a section, not at the page top — for example,
the controls bar above a code playground, or the filter bar above
a card grid. Mined from the html-effectiveness catalog
(`02-empty-states-explorer`, `06-component-variants`,
`18-canvas-kanban-prototype`, `19-editor-feature-flags`,
`20-internal-tool-prototype`).

## What this is

A sticky `<div>` with a flat background, a thin border at the
bottom, and a higher z-index than its sibling content. The
toolbar's position is `position: sticky; inset-block-start: 0`
relative to the SCROLL CONTAINER it lives in — which is usually
the document, but can be a parent element with its own scroll if
the toolbar should only stick within that parent.

The bottom border is permanent (not scroll-triggered like the page
header in ref 17) because the toolbar is typically INSIDE other
content and needs a stable visual separator at all times.

## Scaffold to emit

A code playground with a sticky controls bar:

```html
<section class="vc-playground" data-ve-id="playground" data-ve-type="region">
  <div class="vc-playground__toolbar" data-ve-id="playground-toolbar" data-ve-type="region">
    <h3>Live regex playground</h3>
    <div class="vc-playground__controls">
      <label class="vc-toggle">
        <input type="checkbox" data-vc-action="toggle-explain">
        <span>Explain</span>
      </label>
      <select data-vc-action="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <button data-vc-action="reset">Reset</button>
    </div>
  </div>
  <div class="vc-playground__stage">
    <!-- The actual editor / playground content goes here. -->
    <textarea>…</textarea>
  </div>
</section>
```

```css
.vc-playground {
  display: grid;
  /* No height / overflow declarations; the document scrolls. */
}
.vc-playground__toolbar {
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
  border-block-end: 1px solid var(--vc-color-border);
}
.vc-playground__controls {
  display: flex;
  align-items: center;
  gap: var(--la-gap-sm);
}
```

The CSS is NOT in `amvcp-layout.css` (it's a downstream custom
layout) — add to the consuming page.

## The "above the playground inside the page" variant

A toolbar inside a `.la-article` should NOT use full-width sticky
because the article is constrained to the measured column. Use the
toolbar inside a `.la-article__wide` parent so it can extend
slightly past the prose measure:

```html
<article class="la-article">
  <p>Prose introduction …</p>

  <section class="la-article__wide vc-playground" data-ve-id="playground">
    <!-- The wide-bleed playground with its own sticky toolbar. -->
    …
  </section>

  <p>Prose continues …</p>
</article>
```

## The combined "page header + section toolbar" stack

If the page already has a sticky page header (ref 17), the section
toolbar's `inset-block-start` must offset by the header's height:

```css
.vc-playground__toolbar {
  position: sticky;
  inset-block-start: var(--la-header-height, 48px);
  /* ^ offset by the page header's height so the toolbar
     sticks BELOW the header, not behind it. */
}
```

`--la-header-height` is not currently a token in
`amvcp-layout.css`; if a page combines both, declare it locally:

```css
:root { --la-header-height: 48px; }
```

(Or measure the header's actual height in JS and set the property,
for an authoritative value.)

## Lib functions called

- None for the sticky CSS itself.
- If the toolbar contains a `[data-la-toggle]` button, the
  `initSidebarToggle()` from `amvcp-layout.js` wires the click
  handler (see ref 08).
- Custom toolbar controls (theme toggle, filters) are wired by the
  consuming layout's own JS — typically simple `addEventListener`
  on each control.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-z-sticky` | 200 (fallback) | toolbar z-index |
| `--la-gap` | 16px | gap between toolbar groups |
| `--la-gap-sm` | 8px | toolbar padding-block, control gaps |
| `--la-gutter` | 32px | toolbar padding-inline |
| `--vc-color-surface` | (theme) | toolbar background |
| `--vc-color-content` | (theme) | toolbar text |
| `--vc-color-border` | (theme) | bottom border |

## Selection / comment / decision-mini contract notes

The toolbar is a selectable atom via the author's `data-ve-id`
(`region` type). A reviewer can comment on the toolbar ("add a
download button", "remove the theme toggle"). The controls inside
are NOT atoms (buttons / inputs / selects are excluded per R4).

A reviewer who wants to deny a specific control would comment on
the toolbar as a whole and describe which control to remove.

## When to use a sticky toolbar

- A code / regex / sql playground where the controls are constantly
  used while scrolling through the editor content.
- A card filter bar above a long gallery (filter chips that need to
  remain accessible as the user scrolls).
- A multi-step form with a "Save" / "Cancel" bar that should stay
  visible.

When NOT to use:
- A standard report page (the page header already handles the
  persistent-controls case; a section toolbar would be redundant).
- A page with a single short section (no need to stick anything).

## Why `position: sticky` not `position: fixed`

`fixed` positioning takes the element OUT of the document flow,
which has three problems:
1. The toolbar always sticks to the viewport, even when the
   surrounding section is scrolled past. Visually, a toolbar
   without its content is confusing.
2. `fixed` overlays other content; without manual offsets, the
   toolbar covers the next section's title.
3. `fixed` ignores the parent's scroll context — if the toolbar is
   inside a scrolling parent, `fixed` still sticks to the viewport,
   not the parent.

`sticky` solves all three: it stays in the document flow, sticks
only within its parent, and releases when the parent is scrolled
past.

## Visual verification

Run the universal self-debug checklist before claiming the sticky
toolbar is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For sticky toolbar correctness specifically:

- Open dev-browser. Scroll the page; verify the toolbar stays at
  the top of the viewport while the surrounding content scrolls.
- Scroll past the entire `.vc-playground` section; the toolbar
  should also scroll off-screen (sticky releases when the parent
  has been fully scrolled past).
- Verify the z-index keeps the toolbar above the scrolling
  content:
  ```js
  const toolbar = document.querySelector('.vc-playground__toolbar');
  console.log(getComputedStyle(toolbar).zIndex);  // 200 or higher
  ```
- **R1 — Light + dark themes**: switch themes; the toolbar
  background uses `--vc-color-surface`, theme-correct in both.
- **R2 — No nested scrollbars**: the toolbar is a flex strip;
  its parent `.vc-playground` MUST NOT have `overflow: auto`. If
  the playground content (the textarea) is too tall, the
  textarea scrolls internally — that's the textarea's job, not
  the layout's. Other content (lists, code blocks) should not
  have any scroll.
- The "stack with page header" check: if the page has both a
  page header AND a section toolbar, both should be visible
  simultaneously at the top (one above the other). If they
  overlap, the section toolbar's `inset-block-start` is missing
  or too small.
