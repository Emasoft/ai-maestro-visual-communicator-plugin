# Layout — pattern catalog

## Table of Contents

- [Authoring gate — logical properties only (RTL)](#authoring-gate--logical-properties-only-rtl)
- [No nested scrollbars](#no-nested-scrollbars)
- [Group 1 — Spatial foundation](#group-1--spatial-foundation)
- [Group 2 — Grid presets](#group-2--grid-presets)
- [Group 3 — Reading container](#group-3--reading-container)
- [Group 4 — Page chrome: sticky header](#group-4--page-chrome-sticky-header)
- [Group 5 — In-page navigation: scroll-spy TOC](#group-5--in-page-navigation-scroll-spy-toc)
- [Group 6 — Print / paged layout](#group-6--print--paged-layout)
- [Group 7 — Decorative surfaces](#group-7--decorative-surfaces)

The full HTML + CSS catalog for the layout technique. One section per
group. The CSS lives in `scripts/amvcp-layout.css`; the JS in
`scripts/amvcp-layout.js`. Link the CSS and (for groups 4/5/2c) the JS;
paste a scaffold; set `data-ve-id` on every region.

## Authoring gate — logical properties only (RTL)

**Every directional declaration in a layout page MUST use logical
properties.** This is a hard review gate — a leaked physical property
silently breaks `dir="rtl"`.

| Physical (forbidden) | Logical (required) |
|---|---|
| `margin-left/right` | `margin-inline-start/end`, `margin-inline` |
| `padding-left/right` | `padding-inline-start/end`, `padding-inline` |
| `border-left/right` | `border-inline-start/end` |
| `left/right` offsets | `inset-inline-start/end` |
| `top/bottom` | `inset-block-start/end` |
| `width/height` | `inline-size/block-size` |
| `text-align: left` | `text-align: start` |

With every rule authored this way, `dir="rtl"` on the root mirrors all
grids, sidebars, TOC indents, and headers with zero extra CSS. The one
exception: `transform: translateX(-50%)` for symmetric self-centring
(the device notch) is direction-neutral and therefore fine.

## No nested scrollbars

No layout pattern emits `overflow:auto`/`overflow:scroll`. Wide content
(a table, a code block) widens the *document* — use the
`.la-article__wide` / `.la-article__bleed` escape hatches. The three
`overflow:hidden` uses (IDE collapse clip, device frame clip, hero
decoration clip) are clips of fixed-size or collapsing boxes, never
content scrollers.

---

## Group 1 — Spatial foundation

The `:root` `--la-*` alias block. See `layout-tokens.md` for the full
contract. It is emitted once at the top of every layout page (it ships
in `amvcp-layout.css`).

---

## Group 2 — Grid presets

### 2a — Asymmetric content + sidebar

```html
<div class="la-grid la-grid--2-1" data-ve-id="layout-main" data-ve-type="layout">
  <div class="la-region la-region--main"   data-ve-id="region-content">…</div>
  <aside class="la-region la-region--side" data-ve-id="region-sidebar">…</aside>
</div>
```

`.la-grid--2-1` is a `2fr : minmax(min(300px,100%),1fr)` grid;
`.la-grid--3-1` is `3fr : minmax(min(280px,100%),1fr)`. The sidebar
floor `minmax(min(300px,100%),1fr)` means on a viewport narrower than
300px the `min()` yields `100%` so the sidebar still fits. Both
collapse to a single column at the 768px breakpoint. Every grid child
gets `min-width:0` so wide content cannot force the grid past the
viewport.

### 2b — Subgrid card row

```html
<div class="la-cardrow" data-ve-id="cardrow">
  <article class="la-card" data-ve-id="card-1" data-ve-type="card">
    <h3 class="la-card__title">…</h3>
    <div class="la-card__body">…</div>
    <footer class="la-card__footer">…</footer>
  </article>
  <!-- more .la-card, identical 3-row internal structure -->
</div>
```

Each `.la-card` is a 3-row subgrid (`grid-template-rows: subgrid`,
`grid-row: span 3`), so titles / bodies / footers align across the
whole row even when one title wraps onto two lines. **Contract: a
card's internal markup MUST be exactly title / body / footer** — the
`span 3` depends on it. Subgrid has universal 2026 support, so no
`@supports` fallback ships.

### 2c — IDE 3-panel

```html
<button class="la-ide-toggle" data-la-toggle="ide" aria-expanded="true">Sidebar</button>
<div class="la-ide" data-ve-id="ide" data-la-sidebar="open">
  <nav   class="la-ide__sidebar"   data-ve-id="ide-sidebar">…</nav>
  <div   class="la-ide__center"    data-ve-id="ide-center">…</div>
  <aside class="la-ide__inspector" data-ve-id="ide-inspector">…</aside>
</div>
```

`240px 1fr minmax(300px,40%)` grid, `min-block-size:100dvh` (the shell
can *grow* past the viewport — long panel content extends the document,
it does not scroll inside a box; `dvh` avoids the mobile URL-bar bug).
The closed state collapses the sidebar track to `0`; the sidebar's
`overflow:hidden` is the collapse clip for that 0-width state.
`amvcp-layout.js` wires the toggle: clicking `[data-la-toggle]` flips
`data-la-sidebar` and mirrors `aria-expanded`; an optional Ctrl+B
toggles the first sidebar (suppressed while typing in an input).

### 2d — 12-column dashboard

```html
<div class="la-dashboard" data-ve-id="dashboard">
  <div class="la-kpi-row" data-span="12" data-ve-id="kpi-row">
    <!-- KPI / metric card CONTENT is the chart skill's job -->
  </div>
  <section data-span="8" data-ve-id="dash-chart">…</section>
  <aside   data-span="4" data-ve-id="dash-detail">…</aside>
</div>
```

`repeat(12, 1fr)` grid. `data-span="N"` (N ∈ 1,2,3,4,6,8,12) sets
`grid-column: span N`. `.la-kpi-row` is an auto-fit sub-grid for metric
cards. On mobile every `data-span` becomes full width. Layout owns only
the placement + the KPI-row container — the metric value / sparkline
inside a KPI card is rendered by the chart technique.

---

## Group 3 — Reading container

```html
<article class="la-article" data-ve-id="article" data-ve-type="section">
  <h1>…</h1>
  <p>…</p>
  <figure class="la-article__wide"  data-ve-id="wide-figure">…</figure>
  <pre    class="la-article__bleed">…wide code block…</pre>
</article>
```

**Must NOT be a `<main>` / `.ve-main` element.** The runtime forces
`main { max-width:none !important }`, which silently destroys a measure
set on `<main>`. Scaffold it as `<article>` (or `<div>`).

A 3-column grid — `1fr / measured-content / 1fr`. Default children land
in the measured centre column. `.la-article__wide` and
`.la-article__bleed` opt wider (`grid-column: 1 / -1`) — that is how a
wide table or code block extends WITHOUT an inner scrollbar (it widens
the page). The `min(measure, 100% - 2*gutter)` clamp keeps the column
fitting on narrow viewports.

---

## Group 4 — Page chrome: sticky header

```html
<header class="la-header" data-ve-id="page-header" data-ve-type="section">
  <span class="la-header__title">Report title</span>
  <nav class="la-header__nav">…TOC toggle / links…</nav>
</header>
```

`position:sticky; inset-block-start:0`. A hairline `border-block-end`
appears once the page is scrolled — `amvcp-layout.js` toggles
`.is-scrolled` (rAF-throttled scroll listener). `z-index` uses the
engine `--vc-z-sticky` token (fallback `200`). The `.la-header--glass`
modifier adds a backdrop-blur glass flavour — opt-in only; its
`background` is `color-mix(… transparent)` over the engine surface
token, so it is theme-correct in both light and dark (never a
hardcoded `rgba`). With JS off the header is still sticky, just without
the scroll border.

---

## Group 5 — In-page navigation: scroll-spy TOC

```html
<nav class="la-toc" data-ve-id="toc" data-ve-type="section" aria-label="On this page">
  <ol class="la-toc__list"><!-- auto-populated by amvcp-layout.js --></ol>
</nav>
```

`amvcp-layout.js` builds the `<ol>` from the document's `h2`/`h3`
headings (overridable via `data-la-toc-headings` on `.la-toc`),
generating slug ids for un-IDed headings. An `IntersectionObserver`
(`rootMargin: '-20% 0px -70% 0px'`) highlights the link of the heading
in the mid-viewport band by adding `.is-active`. The observer fires
*repeatedly* — links re-activate when scrolling back up.

**JS-off safety:** if the author pre-fills the `<ol>` with static
`<a href="#…">` links, `amvcp-layout.js` skips the build step and only
adds the live highlight — so the anchors work with JS off. With JS on
and an empty `<ol>`, JS builds it. `scroll-behavior:smooth` is enabled
but disabled under `prefers-reduced-motion`.

---

## Group 6 — Print / paged layout

```html
<section class="la-cover la-break-after" data-ve-id="cover">
  <h1>Report title</h1><p class="la-cover__meta">…date / author…</p>
</section>
<div class="la-kpi-row la-break-inside-avoid">…</div>
<section class="la-break-before">…</section>
<header class="la-header no-print">…</header>
```

`@page { size: A4; margin: 16mm }`. Utility classes:
`.la-break-before` / `.la-break-after` (force a page boundary),
`.la-break-inside-avoid` (keep a block whole), `.no-print` (hide in
print). `.la-cover` is a full-viewport centred cover page. The
`@media print` block hides all chrome (`.la-header`, `.la-toc`,
`.la-ide-toggle`), turns the sticky header static, drops shadows and
decorative pseudo-layers, flattens the `.la-article` grid (a reading
measure is pointless on a fixed A4 page), and adds
`print-color-adjust:exact` so token background tints survive into the
PDF. Print should use the **light** theme — emit `<html
data-ve-theme="light">` for the print path (the technique does not
force white, so a deliberately-dark DESIGN.md is respected).

---

## Group 7 — Decorative surfaces

### 7a — Generalized device-mockup frame

```html
<div class="la-device"
     style="--dev-w:393px; --dev-h:852px; --dev-radius:47px; --dev-notch-w:126px; --dev-notch-h:37px;"
     data-ve-id="device-mockup" data-ve-type="card">
  <div class="la-device__screen">…screenshot / embedded content…</div>
</div>
```

Any device is one inline style — set the five `--dev-*` props. Add
`.la-device--no-notch` for a desktop / browser frame. `.la-device` is
`box-sizing:border-box`, so `--dev-w`/`--dev-h` are the FULL frame
size (the bezel padding is inside that figure) — set `--dev-w:393px`
and the rendered frame is 393px wide. The frame colour is the darkest
engine token (`--vc-color-content`), never `#000` — so it works in
both themes. `.la-device__screen`'s `overflow:hidden` is a frame clip
(clipping the screenshot to the rounded screen rect), not a content
scroller — the mockup is fixed-size.

### 7b — 4-layer hero background

```html
<section class="la-hero" data-ghost="REPORT" data-ve-id="hero" data-ve-type="section">
  <div class="la-hero__content">…title, lede…</div>
</section>
```

A layered decorative page-top band: `::before` paints two radial
accent glows (`color-mix` over the engine accent + info tokens — so the
glow recolours live on a DESIGN.md swap and is theme-coherent),
`::after` paints a giant low-opacity ghost word from `data-ghost`.
`isolation:isolate` + negative `z-index` keep the pseudo-layers behind
the content. `.la-hero` uses `overflow:clip` (not `hidden`): `clip`
establishes NO scroll container, so the oversized ghost-text layer can
never make the hero programmatically scrollable — `hidden` clips paint
but leaves a scrollable box. `clip` is the correct decoration-clip
primitive and the no-nested-scrollbars-compliant choice.
