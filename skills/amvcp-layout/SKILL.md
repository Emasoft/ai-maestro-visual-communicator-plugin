---
name: amvcp-layout
description: "Build DESIGN.md-themed HTML layouts — asymmetric content+sidebar grids, 3-panel IDE shells, 12-column dashboards, KPI rows, gallery grids, measured reading containers with wide-bleed escape hatches, scroll-spy TOCs (auto-built, sticky-sidebar, right-margin, static), sticky page headers (opaque + glassmorphism), sticky toolbars, fluid clamp() headings, section-numbered headers, A4 print layouts with covers + page breaks, parameterised device-mockup frames, 4-layer hero backgrounds, RTL-correct logical properties, no inner scrollbars. Use when the user asks for a layout, grid, two-column, sidebar, dashboard, 3-panel, KPI, gallery, TOC, table of contents, scroll-spy, print, PDF, A4, cover, reading, article, sticky header, glassmorphism, toolbar, hero, banner, fluid heading, section header, device mockup, iPhone mockup, RTL."
license: MIT
compatibility: "Browser (CSS Grid, subgrid, logical properties, color-mix, @page, position:sticky, IntersectionObserver, dvh units). Themes off the DESIGN.md engine (amvcp-designmd.js). Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Layout

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads on requests for a layout, grid, dashboard, reading page, KPI row, table of contents, sticky header, toolbar, hero, print / PDF layout, cover page, device mockup, or RTL-aware document. Produces one self-contained `.html` themed entirely by the DESIGN.md engine — every region is a `data-ve-id` selectable atom and every length is a `--vc-space-*` token or a `--la-*` alias. The layout system is greenfield: named CSS-Grid presets, a measured reading container with wide-bleed escape hatches, a scroll-spy TOC, print rules with page breaks and cover pages, sticky page chrome (opaque + glass), and decorative surfaces.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — it supplies every `--vc-*` token. Layout NEVER sets a `--vc-*` value; it only reads them and defines `--la-*` aliases.
- `scripts/amvcp-layout.css` linked (the whole CSS surface) and `scripts/amvcp-layout.js` loaded ONLY when groups 4/5/2c (sticky header, TOC, IDE collapse) are used — the other groups are pure CSS.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop (optional — a layout page renders correctly without it; selection just won't fire).
- Python 3.12+ for `scripts/amvcp-select.py`. See [layout-patterns](references/layout-patterns.md) for the base contract.

## When to choose this category

| Request shape | Refs | Scaffold class |
|---|---|---|
| content + sidebar | [05](references/05-asymmetric-grid-2-1.md), [06](references/06-asymmetric-grid-3-1.md) | `.la-grid--2-1` / `.la-grid--3-1` |
| row of equal cards, aligned title/body/footer | [07](references/07-subgrid-card-row.md) | `.la-cardrow` + `.la-card` |
| IDE / 3-panel tool UI with collapsible sidebar | [08](references/08-ide-3-panel.md) | `.la-ide` + `[data-la-toggle]` |
| metrics dashboard (12-col placement) | [09](references/09-twelve-column-dashboard.md) | `.la-dashboard` + `data-span` |
| at-a-glance KPI / metric strip | [10](references/10-kpi-row.md) | `.la-kpi-row` |
| gallery / index / tile grid | [11](references/11-card-grid-autofill.md) | custom `auto-fill` grid |
| long article / report body (with wide content) | [13](references/13-article-three-column-grid.md), [14](references/14-article-wide-bleed.md) | `.la-article` + `.la-article__wide` / `__bleed` |
| persistent page header | [17](references/17-sticky-header.md), [18](references/18-glassmorphism-header.md) | `.la-header` (+ `--glass`) |
| sticky controls bar above a section | [19](references/19-toolbar-sticky-bar.md) | custom sticky toolbar |
| jump-to-section nav (auto-built or static) | [21](references/21-scroll-spy-toc.md), [22](references/22-sticky-sidebar-toc.md), [23](references/23-right-margin-toc.md), [24](references/24-prefilled-static-toc.md) | `.la-toc` |
| output will be printed / PDF'd | [25](references/25-a4-page-rules.md), [26](references/26-print-reset.md), [27](references/27-cover-and-page-breaks.md) | `@page` + `.la-break-*` + `.la-cover` + `.no-print` |
| device screenshot frame | [28](references/28-device-mockup-frame.md) | `.la-device` (set `--dev-*` props) |
| decorative hero band | [29](references/29-hero-with-radial-glows.md) | `.la-hero` + `data-ghost` |
| two-paper rotated comparison | [30](references/30-rotated-card-comparison.md) | custom rotated cards |
| fluid clamp() heading on cover / hero | [15](references/15-fluid-headings-clamp.md), [20](references/20-fluid-h1-headings.md) | `clamp(MIN, IDEAL, MAX)` |
| section header with `01` badge + meta chip | [16](references/16-section-numbered-headers.md) | custom `.la-sec-head` |
| RTL-correct layout (Arabic, Hebrew, …) | [31](references/31-rtl-logical-properties.md) | `dir="rtl"` on root |

## Authoring rules (HARD invariants — apply to every ref above)

- **Spacing tokens only.** Every length is `var(--vc-space-N)` (the engine ladder), `var(--la-*)` (the layout alias layer; see [01](references/01-spatial-token-ladder.md), [02](references/02-derived-aliases.md), [03](references/03-named-gaps-semantics.md)), or `ch` (reading measures only; see [04](references/04-reading-measure-ch-based.md)). NO literal pixel values for layout sizing. Documented exceptions: `768px` (the single mobile breakpoint; see [12](references/12-mobile-collapse-breakpoint.md)), `16mm` (the print page margin; see [25](references/25-a4-page-rules.md)).
- **Engine tokens only for colour.** Every colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors everything with zero extra CSS. See [31](references/31-rtl-logical-properties.md).
- **No nested scrollbars.** No primitive ships `overflow:auto` / `overflow:scroll`. Wide content widens the document via `.la-article__wide` / `__bleed`. Decorative clips use `overflow: clip` (not `hidden`). See [32](references/32-no-nested-scrollbars-pattern.md).
- **`min-width: 0` on every grid child.** Without this, wide content (a table, a code block) inside a grid cell forces the WHOLE GRID past the viewport. The shipped presets already do this; custom grids must too.
- **Selection contract.** Every layout-shaped element is a selectable atom via `markLayoutAtoms()` ([33](references/33-selection-atoms.md)). The 3-segment decision-mini pill (`✘` ﹅ `✔︎`) attaches to each.

## Instructions

1. Look up the request shape in the table above; open the cited refs.
2. Paste the scaffold from the ref (each ref includes a complete `<html>` + `<style>` snippet).
3. Set `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
4. Verify with the visual-verification section of each ref — every ref ends with a `Visual verification` section pointing at [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the group-1 `:root` aliases + the groups used, the engine `<script>` + DESIGN.md block, and `amvcp-layout.js` only for groups 4/5/2c. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

- **Reading measure ignored** → `.la-article` was put on `<main>`; the runtime forces `main { max-width:none !important }`. Use a `<div>`/`<article>` (see [13](references/13-article-three-column-grid.md)).
- **Wide table/code forces the whole grid past the viewport** → add `min-width:0` to the grid child (the presets already do this — check custom children).
- **Sidebar won't collapse / TOC not highlighting / no scroll border** → `amvcp-layout.js` not loaded.
- **Print drops token background tints** → the `@media print` block needs `print-color-adjust:exact` (shipped in `amvcp-layout.css` — see [26](references/26-print-reset.md)).
- **RTL layout broken** → a physical property (`margin-left`, `left`, `width`) leaked in — replace with the logical equivalent ([31](references/31-rtl-logical-properties.md)).
- **Sticky sidebar TOC doesn't stick** → `align-self: start` missing on the TOC ([22](references/22-sticky-sidebar-toc.md)).
- **TOC links go to wrong heading** → pre-filled TOC with stale headings; either auto-build (empty `<ol>`) or sync hrefs to heading ids ([24](references/24-prefilled-static-toc.md)).

## Examples

- A content+sidebar report with auto-built sticky TOC: `.la-header` + `.la-grid--3-1` wrapping a `.la-article` main region + a sticky `.la-toc` sidebar.
- A printed dashboard: `.la-cover` + `.la-kpi-row` + `.la-dashboard` with `data-span` regions + `.la-break-before` appendix.
- A device mockup gallery: `.la-cardrow` of `.la-device` frames, each with different `--dev-*` props for iPhone / iPad / Pixel.
- A hero-led landing page: `.la-hero` with `data-ghost` watermark + fluid `clamp()` H1 + KPI row below.

## Modes

This skill supports `data-ve-mode="readonly"` only. Layout primitives (grids, sidebars, dashboards, TOCs, headers, hero backgrounds, print layouts, device frames) are page scaffolding — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

This skill is foundational — every other amvcp-* skill is composed inside one of its layouts (R22). Multiple layout primitives on one page are allowed (e.g. sidebar shell wrapping a dashboard grid). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [layout-patterns](references/layout-patterns.md) — full HTML+CSS catalog (one section per group); the RTL authoring gate; the no-nested-scrollbars note.
- [layout-tokens](references/layout-tokens.md) — the `--la-*` derived-token contract; the recommended DESIGN.md `spacing.scale`; the `--vc-z-sticky` and `ch`-measure rationale.
- [01-spatial-token-ladder](references/01-spatial-token-ladder.md) — 8px grid spacing-token contract; hot-swap path.
- [02-derived-aliases](references/02-derived-aliases.md) — the semantic `--la-*` alias layer over indexed engine tokens.
- [03-named-gaps-semantics](references/03-named-gaps-semantics.md) — the canonical map of WHEN to use which `--la-gap*` token.
- [04-reading-measure-ch-based](references/04-reading-measure-ch-based.md) — why `ch`-units (not px) for reading measures.
- [05-asymmetric-grid-2-1](references/05-asymmetric-grid-2-1.md) — 2fr:1fr content+sidebar (the canonical 2-region page).
- [06-asymmetric-grid-3-1](references/06-asymmetric-grid-3-1.md) — 3fr:1fr feature-article variant.
- [07-subgrid-card-row](references/07-subgrid-card-row.md) — title/body/footer alignment across cards via subgrid.
- [08-ide-3-panel](references/08-ide-3-panel.md) — 240px+1fr+minmax 3-panel shell + collapse toggle.
- [09-twelve-column-dashboard](references/09-twelve-column-dashboard.md) — `repeat(12,1fr)` grid + `data-span` placement.
- [10-kpi-row](references/10-kpi-row.md) — auto-fit small-card strip for metric tiles.
- [11-card-grid-autofill](references/11-card-grid-autofill.md) — `auto-fill` gallery / thumbnail grid.
- [12-mobile-collapse-breakpoint](references/12-mobile-collapse-breakpoint.md) — the single 768px breakpoint convention.
- [13-article-three-column-grid](references/13-article-three-column-grid.md) — measured reading column via 3-col grid.
- [14-article-wide-bleed](references/14-article-wide-bleed.md) — `__wide` (92ch) and `__bleed` (full) escape hatches.
- [15-fluid-headings-clamp](references/15-fluid-headings-clamp.md) — `clamp(MIN, IDEAL, MAX)` fluid sizing primer.
- [16-section-numbered-headers](references/16-section-numbered-headers.md) — section header with numeric badge + meta chip.
- [17-sticky-header](references/17-sticky-header.md) — `position:sticky` page header + IO sentinel for scroll state.
- [18-glassmorphism-header](references/18-glassmorphism-header.md) — opt-in glass flavour via `color-mix` over surface.
- [19-toolbar-sticky-bar](references/19-toolbar-sticky-bar.md) — sticky controls bar inside a section.
- [20-fluid-h1-headings](references/20-fluid-h1-headings.md) — fluid clamp() applied to page-level H1.
- [21-scroll-spy-toc](references/21-scroll-spy-toc.md) — auto-built TOC with `IntersectionObserver` highlight.
- [22-sticky-sidebar-toc](references/22-sticky-sidebar-toc.md) — TOC in a sidebar with `position:sticky; align-self:start`.
- [23-right-margin-toc](references/23-right-margin-toc.md) — TOC anchored to article right margin via `right:max(…)`.
- [24-prefilled-static-toc](references/24-prefilled-static-toc.md) — JS-off-safe static TOC (live highlight still works).
- [25-a4-page-rules](references/25-a4-page-rules.md) — `@page { size:A4; margin:16mm }` for print / PDF.
- [26-print-reset](references/26-print-reset.md) — `@media print` reset: hide chrome, force token tints, etc.
- [27-cover-and-page-breaks](references/27-cover-and-page-breaks.md) — `.la-cover` + `.la-break-*` utilities.
- [28-device-mockup-frame](references/28-device-mockup-frame.md) — `.la-device` + `--dev-*` props (any device).
- [29-hero-with-radial-glows](references/29-hero-with-radial-glows.md) — 4-layer decorative hero (canvas + glows + ghost + content).
- [30-rotated-card-comparison](references/30-rotated-card-comparison.md) — two-paper rotated comparison hero.
- [31-rtl-logical-properties](references/31-rtl-logical-properties.md) — the cross-cutting RTL authoring rule.
- [32-no-nested-scrollbars-pattern](references/32-no-nested-scrollbars-pattern.md) — the universal no-inner-scrollbars contract.
- [33-selection-atoms](references/33-selection-atoms.md) — `markLayoutAtoms()` SHAPES + decision-mini pill contract.
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
- [interactive-selection-base](../../references/interactive-selection-base.md) — the selection-runtime page contract.
