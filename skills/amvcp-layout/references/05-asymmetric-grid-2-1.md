# 05 — Asymmetric grid (2fr : 1fr) — the canonical content + sidebar

The most common 2-region page shape: a wide main content column and
a narrower sidebar. The `.la-grid--2-1` preset is the standard
recipe — `2fr : minmax(min(300px, 100%), 1fr)` columns, a one-line
mobile collapse, and `min-width: 0` on every grid child so wide
content never breaks the layout.

## What this is

Asymmetric grids dominate report and article layouts: a content
column for the main reading flow and a sidebar for navigation, notes,
metadata, callouts, or a TOC. The "2fr : 1fr" ratio is the canonical
"content-heavy" weighting (`.la-grid--2-1`); the "3fr : 1fr"
weighting (`.la-grid--3-1`, see ref 06) is the "feature-article"
weighting where the main column dominates even more strongly.

The sidebar floor `minmax(min(300px, 100%), 1fr)` ensures:
- The sidebar is at least 300px wide on viewports >300px (so
  meaningful content fits).
- On viewports narrower than 300px (truly tiny), the sidebar
  collapses to `100%` so it does not overflow.

The `min-width: 0` on every grid child cancels the implicit
`min-width: auto` that grid children inherit by default — without
this, a wide table or code block inside the main column would force
the WHOLE GRID past the viewport, ignoring the `2fr : 1fr` ratio.

## Scaffold to emit

```html
<div class="la-grid la-grid--2-1" data-ve-id="layout-main" data-ve-type="layout">
  <div class="la-region la-region--main" data-ve-id="region-content" data-ve-type="region">
    <article class="la-article" data-ve-id="article" data-ve-type="section">
      <h1>Report title</h1>
      <p>Lede paragraph that introduces the report …</p>
      <h2>Section one</h2>
      <p>…</p>
    </article>
  </div>
  <aside class="la-region la-region--side" data-ve-id="region-sidebar" data-ve-type="region">
    <nav class="la-toc" data-ve-id="toc" data-ve-type="section" aria-label="On this page">
      <ol class="la-toc__list"></ol>
    </nav>
  </aside>
</div>
```

The CSS ships in `amvcp-layout.css` already:

```css
.la-grid {
  display: grid;
  gap: var(--la-gap-lg);
  align-items: start;
}
.la-grid > * { min-width: 0; }
.la-grid--2-1 { grid-template-columns: 2fr minmax(min(300px, 100%), 1fr); }
@media (max-width: 768px) {
  .la-grid--2-1 { grid-template-columns: 1fr; }
}
```

## Lib functions called

- `markLayoutAtoms()` (in `amvcp-layout.js`) stamps `data-ve-id` and
  `data-ve-type` on every `.la-region` so the selection runtime
  picks them up. See ref 33.
- `initTOC()` (in `amvcp-layout.js`) wires the sidebar TOC if a
  `.la-toc` is inside the sidebar. See refs 21-24.
- No grid-specific JS — the grid itself is pure CSS.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-lg` | 32px (`--vc-space-5`) | grid column gap |
| `--vc-space-5` | 32px | indirectly via `--la-gap-lg` |
| `--vc-color-surface` | (theme-dependent) | `.la-region` backgrounds (optional, when the region is on a tinted surface) |
| `--vc-color-border` | (theme-dependent) | `.la-region` border (optional) |

The `768px` mobile breakpoint is intentionally NOT a token — see ref
12 (mobile-collapse-breakpoint) for the rationale.

The `300px` sidebar floor is a content-fit minimum, not a token
either — it is the minimum width below which a meaningful sidebar
list becomes too cramped to read. If a custom layout's sidebar holds
narrower content (e.g. only icons), pass an override:

```css
.la-grid--2-1.la-grid--narrow-side {
  grid-template-columns: 2fr minmax(min(200px, 100%), 1fr);
}
```

## Selection / comment / decision-mini contract notes

The grid container itself is intentionally NOT stamped as a
selectable atom (`markLayoutAtoms()` excludes `.la-grid` from the
SHAPES list — see `amvcp-layout.js` lines 505-512). The grid is a
LAYOUT CONTAINER, not a comment-able thing. Users comment on the
regions inside the grid, on the article paragraphs inside the
regions, on the TOC inside the sidebar — each of THOSE is a
selectable atom with its own `data-ve-id`.

A reviewer can still hand-stamp the grid container with `data-ve-id`
if a comment specifically about the OVERALL LAYOUT is needed
("flip the sidebar to the left"). `markLayoutAtoms()` does not
overwrite an author-supplied `data-ve-id`.

The decision-mini pill (✘ ﹅ ✔︎) attaches to the region atoms via
`_attachDecisionMiniSafe()` in `amvcp-layout.js`. A reviewer can deny
the sidebar entirely — the runtime records the decision; the layout
itself stays put (decisions are advisory, not enforced).

## When to use 2fr : 1fr vs 3fr : 1fr

Use **2fr : 1fr** when:
- The sidebar carries real content (a list of related links, a
  callout, a deeply-populated TOC). It needs to feel like a peer
  region, not an afterthought.
- The main content has a comfortable reading measure at the 2fr
  width.

Use **3fr : 1fr** (ref 06) when:
- The sidebar is light (a few links, a small navigation, a thin
  metadata strip).
- The main content is a feature article that benefits from a
  wider reading column.
- The page is closer to "article with margin notes" than to "two
  peer regions".

## When NOT to use this grid

Do NOT use `.la-grid--2-1` for:
- A 3-panel IDE layout (use `.la-ide`, see ref 08).
- A 12-column dashboard (use `.la-dashboard`, see ref 09).
- A card grid (use `.la-cardrow` or the auto-fill grid, see refs 07,
  11).
- Anything where the sidebar is wider than the main (rare; if you
  need this, flip the ratio: `1fr : 2fr` — but you almost always
  actually want to re-think the page).

## Why `2fr : minmax(min(300px,100%), 1fr)` instead of `2fr : 1fr`

The plain `2fr : 1fr` columns work great until the viewport is
narrow. At 700px wide, `2fr : 1fr` gives the sidebar ~234px — too
cramped for any useful sidebar content. The `minmax(min(300px,100%), 1fr)`
floor:
- Forces the sidebar to AT LEAST 300px wide on viewports >300px.
  This may push the main column narrower than `2fr` would dictate,
  which is the right tradeoff — a too-narrow sidebar is worse than
  a slightly-narrower main column.
- Falls back to `100%` (the `min(300px, 100%)`) when the viewport
  is itself <300px, so the sidebar never overflows.

The `2fr : 1fr` ratio still applies once both columns are above
their floors — the sidebar grows beyond 300px proportionally with
the viewport.

## Visual verification

Run the universal self-debug checklist before claiming this grid is
correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For asymmetric-grid correctness specifically:

- Open dev-browser. Verify the grid template:
  ```js
  getComputedStyle(document.querySelector('.la-grid--2-1')).gridTemplateColumns
  ```
  Should resolve to two pixel widths whose ratio is roughly 2:1
  (NOT exactly — the sidebar floor may distort the ratio at narrow
  viewports).
- Shrink the viewport to 700px wide; verify the sidebar is still
  ≥ 300px wide.
- Shrink the viewport to <768px; verify the grid collapses to one
  column (the mobile-collapse rule, ref 12).
- Insert a deliberately wide table or code block into the main
  region; verify the WHOLE GRID does not push past the viewport
  (the `.la-article__wide` / `.la-article__bleed` escape hatches
  widen the document, not the grid). If the grid grows, `min-width: 0`
  was stripped from a child somewhere — re-add it.
- **R1 — Light + dark themes**: verify both themes render the
  grid identically.
- **R2 — No nested scrollbars**: there should be NO `overflow:auto`
  on any grid child; if a sidebar is overflowing, the sidebar's
  content needs to wrap (text) or extend the document (wide
  content), never scroll inside its own box.

## Sidebar position: left vs right

The grid template `2fr : 1fr` puts the main column FIRST (left
in LTR, right in RTL) and the sidebar SECOND. To put the
sidebar FIRST, use the alternate template:

```css
.la-grid--1-2 { grid-template-columns: minmax(min(300px, 100%), 1fr) 2fr; }
@media (max-width: 768px) {
  .la-grid--1-2 { grid-template-columns: 1fr; }
}
```

(`.la-grid--1-2` is not currently shipped in `amvcp-layout.css`;
add to the consuming page if needed.)

In LTR pages, the sidebar typically goes RIGHT (the main
content reads first, the sidebar is supplementary). In RTL,
the same `.la-grid--2-1` produces a sidebar on the LEFT (which
is the start of reading flow in RTL — also supplementary
relative to the main column). So `.la-grid--2-1` is correct in
both directions; explicit `.la-grid--1-2` is rarely needed.

## Combining with sticky page header

If the page also has a sticky header (ref 17), the grid lives
BELOW the header. The sticky header reserves vertical space at
the top; the grid fills the rest:

```html
<header class="la-header">…</header>
<div class="la-grid la-grid--2-1">
  <div class="la-region la-region--main">…</div>
  <aside class="la-region la-region--side">…</aside>
</div>
```

The grid doesn't need any modification to coexist with a sticky
header. The header sticks at the top; the grid scrolls
underneath naturally.
