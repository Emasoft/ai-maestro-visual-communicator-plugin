# 08 — IDE 3-panel shell (sidebar + main + inspector + collapse toggle)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this layout](#when-to-use-this-layout)
- [Why `data-la-sidebar` (DOM attribute) instead of a class?](#why-data-la-sidebar-dom-attribute-instead-of-a-class)
- [Visual verification](#visual-verification)
- [The collapse animation](#the-collapse-animation)
- [Persisting the collapsed state](#persisting-the-collapsed-state)

A VS-Code-style 3-panel layout: a fixed-width sidebar on the left
(navigation / file tree), a flexible main column in the centre
(editor / canvas), and a right inspector panel for output / details.
The sidebar collapses to width 0 via `data-la-sidebar="closed"` (the
`amvcp-layout.js` toggle wires the button); content inside the
sidebar gets `overflow:hidden` clipping during the collapse.

## What this is

A 3-column CSS Grid: `240px 1fr minmax(300px, 40%)`. The fixed-width
sidebar slot collapses to `0` when `data-la-sidebar="closed"` is on
the container; the middle column flexes to fill the new space.
`min-block-size: 100dvh` (NOT `height: 100vh`) lets the shell GROW
past the viewport if panel content is long — the document is the
scroll context, never an inner panel.

Why `dvh` not `vh`: on mobile, the URL bar appears/disappears and
`100vh` does not match the actual visible area at that moment. `100dvh`
("dynamic viewport height") tracks the visible area correctly.

Why `min-block-size` not `height`: a fixed `height` would clip taller
panel content. `min-block-size` lets the shell grow taller than the
viewport when needed (long file lists, deep inspectors), keeping the
no-nested-scrollbars contract (refs 32).

The sidebar `overflow: hidden` is a COLLAPSE CLIP for the 0-width
closed state — without it, the sidebar's content would visually
overflow into the main column during the collapse animation. It is
NOT a content scroller (the closed state hides everything; the open
state shows everything fitting in the 240px width).

## Scaffold to emit

```html
<button class="la-ide-toggle" data-la-toggle="ide" aria-expanded="true">
  Sidebar
</button>
<div class="la-ide" data-ve-id="ide" data-ve-type="region" data-la-sidebar="open">
  <nav class="la-ide__sidebar" data-ve-id="ide-sidebar" data-ve-type="region">
    <h3>Files</h3>
    <ul>
      <li>src/main.ts</li>
      <li>src/types.ts</li>
      <li>tests/unit.test.ts</li>
    </ul>
  </nav>
  <div class="la-ide__center" data-ve-id="ide-center" data-ve-type="region">
    <h2>main.ts</h2>
    <pre><code>… source code …</code></pre>
  </div>
  <aside class="la-ide__inspector" data-ve-id="ide-inspector" data-ve-type="region">
    <h3>Outline</h3>
    <ul>
      <li>function init()</li>
      <li>function render()</li>
    </ul>
  </aside>
</div>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-ide {
  display: grid;
  grid-template-columns: 240px 1fr minmax(300px, 40%);
  min-block-size: 100dvh;
  gap: 0;
}
.la-ide[data-la-sidebar="closed"] {
  grid-template-columns: 0 1fr minmax(300px, 40%);
}
.la-ide__sidebar {
  overflow: hidden;
  border-inline-end: 1px solid var(--vc-color-border, #e3dcc9);
  transition: all var(--vc-duration-quick, 200ms) var(--vc-easing-standard, ease);
}
.la-ide__center    { min-width: 0; }
.la-ide__inspector { min-width: 0; border-inline-start: 1px solid var(--vc-color-border, #e3dcc9); }
.la-ide-toggle {
  font: inherit;
  cursor: pointer;
  padding-block: var(--la-gap-xs);
  padding-inline: var(--la-gap-sm);
  background: var(--vc-color-surface, #ffffff);
  color: var(--vc-color-content, #1f1a14);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
```

## Lib functions called

- `initSidebarToggle()` (in `amvcp-layout.js`, called by `boot()`):
  - Walks every `[data-la-toggle]` button, attaches a click handler.
  - On click, calls `toggleSidebar(doc, btn)` which flips the
    `data-la-sidebar` attribute on the matching `[data-ve-id]`
    target, and mirrors `aria-expanded` on the button.
  - Also wires a global Ctrl+B shortcut that toggles the FIRST
    sidebar (suppressed while typing in an input — see `isTextEntry()`).
- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type` on
  every `.la-region` (each panel is a region).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-color-border` | (theme) | inter-panel dividers |
| `--vc-color-surface` | (theme) | toggle button background |
| `--vc-color-content` | (theme) | toggle button text |
| `--vc-radius-md` | 8px | toggle button corner |
| `--vc-duration-quick` | 200ms | collapse animation duration |
| `--vc-easing-standard` | ease | collapse animation easing |
| `--la-gap-xs` | 4px | toggle button padding-block |
| `--la-gap-sm` | 8px | toggle button padding-inline |

## Selection / comment / decision-mini contract notes

Each `.la-ide__sidebar`, `.la-ide__center`, `.la-ide__inspector` is a
selectable atom (`data-ve-type="region"`). The IDE container itself
is NOT (layout containers are not commentable; see `markLayoutAtoms()`
SHAPES list in `amvcp-layout.js`).

The decision-mini pill attaches per-panel. A reviewer can:
- Deny the sidebar (request a rework of the file list panel)
- Approve the centre (the editor view is fine)
- Skip the inspector (the inspector's content is out of scope)

The toggle button itself is NOT a selectable atom — it is an
interactive control. Buttons / inputs are excluded from the
selection model (see `amvcp-runtime.js` selection rules — R4 in
`amvcp-self-debug-rules/SKILL.md`).

## When to use this layout

- A tool UI that exposes multiple panes simultaneously (a debugger,
  a code editor, an admin dashboard).
- A documentation page that needs persistent navigation + content +
  inspector (less common; usually `.la-grid--3-1` plus a sticky
  TOC is enough — see ref 06).

Do NOT use this layout for:
- A report. A report wants prose flow + a TOC; `.la-grid--2-1`
  (ref 05) or `.la-grid--3-1` (ref 06) is the right choice.
- A dashboard with KPI tiles. Use `.la-dashboard` (ref 09).

## Why `data-la-sidebar` (DOM attribute) instead of a class?

A class `.la-ide.closed` works but conflates state with style. The
`data-la-sidebar="open|closed"` pattern:
- Carries semantic state in a recognisable attribute.
- Mirrors `aria-expanded` on the button cleanly.
- Is ergonomic to query in JS (`querySelectorAll('[data-la-sidebar="closed"]')`).
- Survives accidental class manipulation in downstream code (a
  `classList.add('important')` won't accidentally trigger the closed
  state).

## Visual verification

Run the universal self-debug checklist before claiming the IDE
layout is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For IDE 3-panel correctness specifically:

- Open dev-browser. Verify the open state:
  ```js
  getComputedStyle(document.querySelector('.la-ide')).gridTemplateColumns
  ```
  Should resolve to three pixel widths (`240px`, the flexible
  centre, and the inspector).
- Click the toggle (or send Ctrl+B). The sidebar should collapse to
  width 0 visually; the centre column should expand to fill.
- Verify the toggle's `aria-expanded` mirrors the state:
  ```js
  document.querySelector('[data-la-toggle]').getAttribute('aria-expanded')
  ```
  Should be `"true"` when open, `"false"` when closed.
- **R1 — Light + dark themes**: switch themes; verify the
  inter-panel borders remain visible in both.
- **R2 — No nested scrollbars**: confirm none of the three panels
  has `overflow:auto`. The sidebar's `overflow:hidden` is a
  collapse clip, NOT a scroll container (it's only visible when
  width=0). If a panel needs to display very long content, the
  shell grows taller via `min-block-size: 100dvh` and the DOCUMENT
  scrolls — never the inner panel.
- The Ctrl+B suppression check: focus a `<input>`; press Ctrl+B;
  the sidebar should NOT toggle (the keystroke goes to the input).

## The collapse animation

The IDE shell uses CSS transitions for the collapse:

```css
.la-ide__sidebar {
  transition: all var(--vc-duration-quick, 200ms) var(--vc-easing-standard, ease);
}
```

When `data-la-sidebar` flips, the grid template changes
(`240px → 0`) and the sidebar's contents are clipped by
`overflow: hidden`. The 200ms transition makes the collapse feel
smooth.

Reduce the duration for snappier feel (`100ms`) or extend for a
deliberate, theatrical collapse (`400ms`). Per
`prefers-reduced-motion`, the duration is ignored — the
transition is instant.

## Persisting the collapsed state

The IDE toggle in the layout JS is purely SESSION-LOCAL — once
the page reloads, the sidebar reverts to its HTML-authored state
(open). The TRDD-352ef46a spec calls out that the
`interactive-control` technique should ship a `data-id`
localStorage helper; when it does, the IDE toggle should
delegate to it so the collapsed state persists across reloads.

For now, authors who want persistence wire it manually:

```js
// On toggle, save to localStorage.
window.addEventListener('click', e => {
  if (e.target.matches('[data-la-toggle]')) {
    setTimeout(() => {
      const ide = document.querySelector('[data-ve-id="ide"]');
      localStorage.setItem('ide-sidebar', ide.dataset.laSidebar);
    }, 0);
  }
});
// On page load, restore.
const saved = localStorage.getItem('ide-sidebar');
if (saved) {
  document.querySelector('[data-ve-id="ide"]').dataset.laSidebar = saved;
}
```
