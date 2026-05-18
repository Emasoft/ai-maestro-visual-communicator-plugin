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
  > Authoring gate — logical properties only (RTL) · No nested scrollbars · Group 1 — Spatial foundation · Group 2 — Grid presets · Group 3 — Reading container · Group 4 — Page chrome: sticky header · Group 5 — In-page navigation: scroll-spy TOC · Group 6 — Print / paged layout · Group 7 — Decorative surfaces

## When to choose this category

| Request shape | Refs | Scaffold class |
|---|---|---|
| content + sidebar | [05](references/05-asymmetric-grid-2-1.md), [06](references/06-asymmetric-grid-3-1.md) | `.la-grid--2-1` / `.la-grid--3-1` |
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use 2fr : 1fr vs 3fr : 1fr · When NOT to use this grid · Why `2fr : minmax(min(300px,100%), 1fr)` instead of `2fr : 1fr` · Visual verification · Sidebar position: left vs right · Combining with sticky page header
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use 3fr : 1fr instead of 2fr : 1fr · The sticky-sidebar caveat · Visual verification · The visual ratio inspection · When to consider 4:1 (a future variant) · Comparison with `.la-grid--2-1` · Combining with the article's reading measure
| row of equal cards, aligned title/body/footer | [07](references/07-subgrid-card-row.md) | `.la-cardrow` + `.la-card` |
  > What this is · Scaffold to emit · The HARD contract on card internal markup · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this row vs the auto-fill card grid (ref 11) · Why subgrid, not `display:flex; flex-direction:column` · Visual verification
| IDE / 3-panel tool UI with collapsible sidebar | [08](references/08-ide-3-panel.md) | `.la-ide` + `[data-la-toggle]` |
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `data-la-sidebar` (DOM attribute) instead of a class? · Visual verification · The collapse animation · Persisting the collapsed state
| metrics dashboard (12-col placement) | [09](references/09-twelve-column-dashboard.md) | `.la-dashboard` + `data-span` |
  > What this is · Scaffold to emit · The allowed `data-span` values · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why 12-column instead of CSS Grid named lines · Visual verification
| at-a-glance KPI / metric strip | [10](references/10-kpi-row.md) | `.la-kpi-row` |
  > What this is · Scaffold to emit · The "warn" modifier pattern · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `auto-fit` not `auto-fill` · Visual verification · Trend indicator conventions · The KPI value display · Sparkline conventions · The compact vs expanded variants
| gallery / index / tile grid | [11](references/11-card-grid-autofill.md) | custom `auto-fill` grid |
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this grid vs the KPI row (ref 10) · When to use this grid vs the subgrid card row (ref 07) · Why min(316px, 100%) in the floor · Visual verification · The "min card width" tradeoff · Combining with subgrid · Pagination considerations
| long article / report body (with wide content) | [13](references/13-article-three-column-grid.md), [14](references/14-article-wide-bleed.md) | `.la-article` + `.la-article__wide` / `__bleed` |
  > What this is · Scaffold to emit · The HARD rule: NOT on `<main>` / `.ve-main` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why three columns instead of `max-width` + escape hatch overrides · Visual verification
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use `__wide` vs `__bleed` · Why a 92ch cap on `__wide` · Why `margin-inline: auto` on `__wide` · Visual verification
| persistent page header | [17](references/17-sticky-header.md), [18](references/18-glassmorphism-header.md) | `.la-header` (+ `--glass`) |
  > What this is · Scaffold to emit · Why an IntersectionObserver on a sentinel and NOT a scroll-event listener · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · JS-off graceful degradation · Why `transition` on `border-color` not `border-block-end` · When to use this header · Visual verification
  > What this is · Scaffold to emit · Why glass is opt-in (not default) · Lib functions called · DESIGN.md tokens used · The browser compatibility caveat · Selection / comment / decision-mini contract notes · When to use glass · Visual verification · The blur radius spectrum · The opacity in the color-mix · Combining glass with the hero (ref 29) · Performance notes · Accessibility considerations
| sticky controls bar above a section | [19](references/19-toolbar-sticky-bar.md) | custom sticky toolbar |
  > What this is · Scaffold to emit · The "above the playground inside the page" variant · The combined "page header + section toolbar" stack · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use a sticky toolbar · Why `position: sticky` not `position: fixed` · Visual verification
| jump-to-section nav (auto-built or static) | [21](references/21-scroll-spy-toc.md), [22](references/22-sticky-sidebar-toc.md), [23](references/23-right-margin-toc.md), [24](references/24-prefilled-static-toc.md) | `.la-toc` |
  > What this is · Scaffold to emit · Why the `-40% 0px -40% 0px` root margin · The tiebreaker logic · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use the TOC · JS-off graceful degradation · Visual verification
  > What this is · Scaffold to emit · The `align-self: start` requirement · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "TOC overflows the viewport" case · When to use this pattern · Visual verification · The "scroll-margin" coordination · The "hide TOC on print" coordination
  > What this is · Scaffold to emit · Why a fixed `200px` TOC width · Why `max(24px, calc(…))` not just `calc(…)` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use right-margin instead of sticky-sidebar · Why this is a niche pattern · Visual verification · The math behind the calc
  > What this is · Scaffold to emit · When to pre-fill the TOC · When NOT to pre-fill · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The ID-collision case · Visual verification · The hybrid approach: static template + live build · The TOC entry text contract · The data-depth attribute · Ordering and grouping · Sub-TOC for nested content
| output will be printed / PDF'd | [25](references/25-a4-page-rules.md), [26](references/26-print-reset.md), [27](references/27-cover-and-page-breaks.md) | `@page` + `.la-break-*` + `.la-cover` + `.no-print` |
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a hardcoded 16mm · When to override the default · Visual verification · The print-vs-screen mental shift · Common print pitfalls · Browser-specific print quirks · Generating PDFs programmatically
  > What this is · The full print reset (from `amvcp-layout.css`) · The `.no-print` utility class · The `print-color-adjust: exact` rule · Why `break-after: avoid` on headings · Why `break-inside: avoid` on figures / tables / code blocks · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the print reset needs extension · Visual verification
  > What this is · Scaffold to emit · The `.la-cover` design choices · The `.la-break-after` on the cover · When to use each break utility · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "force a break BEFORE my custom element" pattern · Visual verification
| device screenshot frame | [28](references/28-device-mockup-frame.md) | `.la-device` (set `--dev-*` props) |
  > What this is · Scaffold to emit · Why `box-sizing: border-box` · The `transform: translateX(-50%)` exception · The screen `overflow: hidden` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why the frame colour is `--vc-color-content`, not `#000` · Visual verification
| decorative hero band | [29](references/29-hero-with-radial-glows.md) | `.la-hero` + `data-ghost` |
  > What this is · Scaffold to emit · The critical `overflow: clip` choice · Why `color-mix(token, transparent)` not hardcoded `rgba()` · Why two glows at 28%/32% and 82%/78% · Why the ghost word at `font-size: clamp(120px, 28vw, 420px)` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use the hero · Visual verification
| two-paper rotated comparison | [30](references/30-rotated-card-comparison.md) | custom rotated cards |
  > What this is · Scaffold to emit · The transform values are the gimmick · The mobile-stack override · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this pattern · Visual verification
| fluid clamp() heading on cover / hero | [15](references/15-fluid-headings-clamp.md), [20](references/20-fluid-h1-headings.md) | `clamp(MIN, IDEAL, MAX)` |
  > What this is · When to use · Scaffold to emit · The math behind picking MIN, IDEAL, MAX · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the clamp values need adjustment · Visual verification · The clamp() variants worth knowing · The "fluid type scale" extension · Browser support · Container-query alternative (advanced) · When clamp() is the WRONG choice
  > What this is · Scaffold to emit · The letter-spacing tweak · Line-height for display headings · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this clamp on H1 · Visual verification · Picking the IDEAL value (the `Nvw`) · The fully-explicit clamp formula (advanced) · When the H1 is multi-line · The relationship to the cover (ref 27) and hero (ref 29)
| section header with `01` badge + meta chip | [16](references/16-section-numbered-headers.md) | custom `.la-sec-head` |
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The fake-heading concern · When to use this pattern · Why a numeric badge instead of an automatic counter in the title · Visual verification
| RTL-correct layout (Arabic, Hebrew, …) | [31](references/31-rtl-logical-properties.md) | `dir="rtl"` on root |
  > What this is · The "documented exception" rule · How to enforce · Why this matters for RTL languages · The `text-align: start` nuance · Scaffold to apply · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When a physical property is unavoidable · Visual verification

## Authoring rules (HARD invariants — apply to every ref above)

- **Spacing tokens only.** Every length is `var(--vc-space-N)` (the engine ladder), `var(--la-*)` (the layout alias layer; see [01](references/01-spatial-token-ladder.md), [02](references/02-derived-aliases.md), [03](references/03-named-gaps-semantics.md)), or `ch` (reading measures only; see [04](references/04-reading-measure-ch-based.md)). NO literal pixel values for layout sizing. Documented exceptions: `768px` (the single mobile breakpoint; see [12](references/12-mobile-collapse-breakpoint.md)), `16mm` (the print page margin; see [25](references/25-a4-page-rules.md)).
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why this is a HARD rule · When to use this reference · Visual verification · The 8px-grid rationale · Variant scales and when to use them · Cross-system consistency
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why use an alias layer instead of indexed tokens directly? · When to add a new `--la-*` alias · Visual verification · Worked example: switching to a denser scale · When DOES an alias need to be added (not just consumed)? · What NOT to alias
  > The map · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the map needs to be extended · Why this map matters more than the values themselves · Visual verification · The "pick the right gap" decision tree · Cross-technique consistency · Edge case: the "almost-right" gap
  > What this is · The ch / px conversion · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why ch, not px · Why two measures (`68ch` + `92ch`)? · When to override · Visual verification · Font-specific `ch` width · CJK languages and `ch`
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a single hardcoded breakpoint instead of a tokenized scale · When to override · Visual verification · The 768px figure in context · What "mobile collapse" means visually · The mobile-first vs desktop-first debate · Beyond mobile collapse
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a hardcoded 16mm · When to override the default · Visual verification · The print-vs-screen mental shift · Common print pitfalls · Browser-specific print quirks · Generating PDFs programmatically
- **Engine tokens only for colour.** Every colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors everything with zero extra CSS. See [31](references/31-rtl-logical-properties.md).
  > What this is · The "documented exception" rule · How to enforce · Why this matters for RTL languages · The `text-align: start` nuance · Scaffold to apply · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When a physical property is unavoidable · Visual verification
- **No nested scrollbars.** No primitive ships `overflow:auto` / `overflow:scroll`. Wide content widens the document via `.la-article__wide` / `__bleed`. Decorative clips use `overflow: clip` (not `hidden`). See [32](references/32-no-nested-scrollbars-pattern.md).
  > What this is · What is forbidden · What is allowed (text wrapping carve-out) · What is allowed (CLIP, not SCROLL) · CSS pattern to enforce in any runtime stylesheet · The escape hatch: `.la-article__wide` / `.la-article__bleed` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · How to fix a violation · When a true app-surface scrollbar is allowed · Visual verification · The `overflow: hidden` vs `overflow: clip` distinction · Browser support for `overflow: clip` · The legitimate scroll containers · Why "wide content widens the document" works · The print perspective · When the rule cannot be satisfied
- **`min-width: 0` on every grid child.** Without this, wide content (a table, a code block) inside a grid cell forces the WHOLE GRID past the viewport. The shipped presets already do this; custom grids must too.
- **Selection contract.** Every layout-shaped element is a selectable atom via `markLayoutAtoms()` ([33](references/33-selection-atoms.md)). The 3-segment decision-mini pill (`✘` ﹅ `✔︎`) attaches to each.
  > What this is · Why layout containers are EXCLUDED · The decision-mini pill contract · Scaffold to emit · Lib functions called · DESIGN.md tokens used · The fake-heading exclusion · When to add a new shape · Idempotency · Selection / comment / decision-mini contract summary · Visual verification

## Instructions

1. Look up the request shape in the table above; open the cited refs.
2. Paste the scaffold from the ref (each ref includes a complete `<html>` + `<style>` snippet).
3. Set `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
4. Verify with the visual-verification section of each ref — every ref ends with a `Visual verification` section pointing at [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the group-1 `:root` aliases + the groups used, the engine `<script>` + DESIGN.md block, and `amvcp-layout.js` only for groups 4/5/2c. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

- **Reading measure ignored** → `.la-article` was put on `<main>`; the runtime forces `main { max-width:none !important }`. Use a `<div>`/`<article>` (see [13](references/13-article-three-column-grid.md)).
  > What this is · Scaffold to emit · The HARD rule: NOT on `<main>` / `.ve-main` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why three columns instead of `max-width` + escape hatch overrides · Visual verification
- **Wide table/code forces the whole grid past the viewport** → add `min-width:0` to the grid child (the presets already do this — check custom children).
- **Sidebar won't collapse / TOC not highlighting / no scroll border** → `amvcp-layout.js` not loaded.
- **Print drops token background tints** → the `@media print` block needs `print-color-adjust:exact` (shipped in `amvcp-layout.css` — see [26](references/26-print-reset.md)).
  > What this is · The full print reset (from `amvcp-layout.css`) · The `.no-print` utility class · The `print-color-adjust: exact` rule · Why `break-after: avoid` on headings · Why `break-inside: avoid` on figures / tables / code blocks · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the print reset needs extension · Visual verification
- **RTL layout broken** → a physical property (`margin-left`, `left`, `width`) leaked in — replace with the logical equivalent ([31](references/31-rtl-logical-properties.md)).
  > What this is · The "documented exception" rule · How to enforce · Why this matters for RTL languages · The `text-align: start` nuance · Scaffold to apply · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When a physical property is unavoidable · Visual verification
- **Sticky sidebar TOC doesn't stick** → `align-self: start` missing on the TOC ([22](references/22-sticky-sidebar-toc.md)).
  > What this is · Scaffold to emit · The `align-self: start` requirement · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "TOC overflows the viewport" case · When to use this pattern · Visual verification · The "scroll-margin" coordination · The "hide TOC on print" coordination
- **TOC links go to wrong heading** → pre-filled TOC with stale headings; either auto-build (empty `<ol>`) or sync hrefs to heading ids ([24](references/24-prefilled-static-toc.md)).
  > What this is · Scaffold to emit · When to pre-fill the TOC · When NOT to pre-fill · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The ID-collision case · Visual verification · The hybrid approach: static template + live build · The TOC entry text contract · The data-depth attribute · Ordering and grouping · Sub-TOC for nested content

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
  > Authoring gate — logical properties only (RTL) · No nested scrollbars · Group 1 — Spatial foundation · Group 2 — Grid presets · Group 3 — Reading container · Group 4 — Page chrome: sticky header · Group 5 — In-page navigation: scroll-spy TOC · Group 6 — Print / paged layout · Group 7 — Decorative surfaces
- [layout-tokens](references/layout-tokens.md) — the `--la-*` derived-token contract; the recommended DESIGN.md `spacing.scale`; the `--vc-z-sticky` and `ch`-measure rationale.
  > The `:root` alias block (Group 1 — spatial foundation) · Why this is an alias layer, not a second `--space-*` ladder · The `ch`-based reading measure (documented exception) · Recommended DESIGN.md `spacing.scale` (8px grid) · The sticky-header z-index — `--vc-z-sticky` · Other documented non-token values
- [01-spatial-token-ladder](references/01-spatial-token-ladder.md) — 8px grid spacing-token contract; hot-swap path.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why this is a HARD rule · When to use this reference · Visual verification · The 8px-grid rationale · Variant scales and when to use them · Cross-system consistency
- [02-derived-aliases](references/02-derived-aliases.md) — the semantic `--la-*` alias layer over indexed engine tokens.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why use an alias layer instead of indexed tokens directly? · When to add a new `--la-*` alias · Visual verification · Worked example: switching to a denser scale · When DOES an alias need to be added (not just consumed)? · What NOT to alias
- [03-named-gaps-semantics](references/03-named-gaps-semantics.md) — the canonical map of WHEN to use which `--la-gap*` token.
  > The map · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the map needs to be extended · Why this map matters more than the values themselves · Visual verification · The "pick the right gap" decision tree · Cross-technique consistency · Edge case: the "almost-right" gap
- [04-reading-measure-ch-based](references/04-reading-measure-ch-based.md) — why `ch`-units (not px) for reading measures.
  > What this is · The ch / px conversion · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why ch, not px · Why two measures (`68ch` + `92ch`)? · When to override · Visual verification · Font-specific `ch` width · CJK languages and `ch`
- [05-asymmetric-grid-2-1](references/05-asymmetric-grid-2-1.md) — 2fr:1fr content+sidebar (the canonical 2-region page).
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use 2fr : 1fr vs 3fr : 1fr · When NOT to use this grid · Why `2fr : minmax(min(300px,100%), 1fr)` instead of `2fr : 1fr` · Visual verification · Sidebar position: left vs right · Combining with sticky page header
- [06-asymmetric-grid-3-1](references/06-asymmetric-grid-3-1.md) — 3fr:1fr feature-article variant.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use 3fr : 1fr instead of 2fr : 1fr · The sticky-sidebar caveat · Visual verification · The visual ratio inspection · When to consider 4:1 (a future variant) · Comparison with `.la-grid--2-1` · Combining with the article's reading measure
- [07-subgrid-card-row](references/07-subgrid-card-row.md) — title/body/footer alignment across cards via subgrid.
  > What this is · Scaffold to emit · The HARD contract on card internal markup · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this row vs the auto-fill card grid (ref 11) · Why subgrid, not `display:flex; flex-direction:column` · Visual verification
- [08-ide-3-panel](references/08-ide-3-panel.md) — 240px+1fr+minmax 3-panel shell + collapse toggle.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `data-la-sidebar` (DOM attribute) instead of a class? · Visual verification · The collapse animation · Persisting the collapsed state
- [09-twelve-column-dashboard](references/09-twelve-column-dashboard.md) — `repeat(12,1fr)` grid + `data-span` placement.
  > What this is · Scaffold to emit · The allowed `data-span` values · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why 12-column instead of CSS Grid named lines · Visual verification
- [10-kpi-row](references/10-kpi-row.md) — auto-fit small-card strip for metric tiles.
  > What this is · Scaffold to emit · The "warn" modifier pattern · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `auto-fit` not `auto-fill` · Visual verification · Trend indicator conventions · The KPI value display · Sparkline conventions · The compact vs expanded variants
- [11-card-grid-autofill](references/11-card-grid-autofill.md) — `auto-fill` gallery / thumbnail grid.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this grid vs the KPI row (ref 10) · When to use this grid vs the subgrid card row (ref 07) · Why min(316px, 100%) in the floor · Visual verification · The "min card width" tradeoff · Combining with subgrid · Pagination considerations
- [12-mobile-collapse-breakpoint](references/12-mobile-collapse-breakpoint.md) — the single 768px breakpoint convention.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a single hardcoded breakpoint instead of a tokenized scale · When to override · Visual verification · The 768px figure in context · What "mobile collapse" means visually · The mobile-first vs desktop-first debate · Beyond mobile collapse
- [13-article-three-column-grid](references/13-article-three-column-grid.md) — measured reading column via 3-col grid.
  > What this is · Scaffold to emit · The HARD rule: NOT on `<main>` / `.ve-main` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why three columns instead of `max-width` + escape hatch overrides · Visual verification
- [14-article-wide-bleed](references/14-article-wide-bleed.md) — `__wide` (92ch) and `__bleed` (full) escape hatches.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use `__wide` vs `__bleed` · Why a 92ch cap on `__wide` · Why `margin-inline: auto` on `__wide` · Visual verification
- [15-fluid-headings-clamp](references/15-fluid-headings-clamp.md) — `clamp(MIN, IDEAL, MAX)` fluid sizing primer.
  > What this is · When to use · Scaffold to emit · The math behind picking MIN, IDEAL, MAX · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the clamp values need adjustment · Visual verification · The clamp() variants worth knowing · The "fluid type scale" extension · Browser support · Container-query alternative (advanced) · When clamp() is the WRONG choice
- [16-section-numbered-headers](references/16-section-numbered-headers.md) — section header with numeric badge + meta chip.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The fake-heading concern · When to use this pattern · Why a numeric badge instead of an automatic counter in the title · Visual verification
- [17-sticky-header](references/17-sticky-header.md) — `position:sticky` page header + IO sentinel for scroll state.
  > What this is · Scaffold to emit · Why an IntersectionObserver on a sentinel and NOT a scroll-event listener · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · JS-off graceful degradation · Why `transition` on `border-color` not `border-block-end` · When to use this header · Visual verification
- [18-glassmorphism-header](references/18-glassmorphism-header.md) — opt-in glass flavour via `color-mix` over surface.
  > What this is · Scaffold to emit · Why glass is opt-in (not default) · Lib functions called · DESIGN.md tokens used · The browser compatibility caveat · Selection / comment / decision-mini contract notes · When to use glass · Visual verification · The blur radius spectrum · The opacity in the color-mix · Combining glass with the hero (ref 29) · Performance notes · Accessibility considerations
- [19-toolbar-sticky-bar](references/19-toolbar-sticky-bar.md) — sticky controls bar inside a section.
  > What this is · Scaffold to emit · The "above the playground inside the page" variant · The combined "page header + section toolbar" stack · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use a sticky toolbar · Why `position: sticky` not `position: fixed` · Visual verification
- [20-fluid-h1-headings](references/20-fluid-h1-headings.md) — fluid clamp() applied to page-level H1.
  > What this is · Scaffold to emit · The letter-spacing tweak · Line-height for display headings · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this clamp on H1 · Visual verification · Picking the IDEAL value (the `Nvw`) · The fully-explicit clamp formula (advanced) · When the H1 is multi-line · The relationship to the cover (ref 27) and hero (ref 29)
- [21-scroll-spy-toc](references/21-scroll-spy-toc.md) — auto-built TOC with `IntersectionObserver` highlight.
  > What this is · Scaffold to emit · Why the `-40% 0px -40% 0px` root margin · The tiebreaker logic · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use the TOC · JS-off graceful degradation · Visual verification
- [22-sticky-sidebar-toc](references/22-sticky-sidebar-toc.md) — TOC in a sidebar with `position:sticky; align-self:start`.
  > What this is · Scaffold to emit · The `align-self: start` requirement · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "TOC overflows the viewport" case · When to use this pattern · Visual verification · The "scroll-margin" coordination · The "hide TOC on print" coordination
- [23-right-margin-toc](references/23-right-margin-toc.md) — TOC anchored to article right margin via `right:max(…)`.
  > What this is · Scaffold to emit · Why a fixed `200px` TOC width · Why `max(24px, calc(…))` not just `calc(…)` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use right-margin instead of sticky-sidebar · Why this is a niche pattern · Visual verification · The math behind the calc
- [24-prefilled-static-toc](references/24-prefilled-static-toc.md) — JS-off-safe static TOC (live highlight still works).
  > What this is · Scaffold to emit · When to pre-fill the TOC · When NOT to pre-fill · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The ID-collision case · Visual verification · The hybrid approach: static template + live build · The TOC entry text contract · The data-depth attribute · Ordering and grouping · Sub-TOC for nested content
- [25-a4-page-rules](references/25-a4-page-rules.md) — `@page { size:A4; margin:16mm }` for print / PDF.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a hardcoded 16mm · When to override the default · Visual verification · The print-vs-screen mental shift · Common print pitfalls · Browser-specific print quirks · Generating PDFs programmatically
- [26-print-reset](references/26-print-reset.md) — `@media print` reset: hide chrome, force token tints, etc.
  > What this is · The full print reset (from `amvcp-layout.css`) · The `.no-print` utility class · The `print-color-adjust: exact` rule · Why `break-after: avoid` on headings · Why `break-inside: avoid` on figures / tables / code blocks · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the print reset needs extension · Visual verification
- [27-cover-and-page-breaks](references/27-cover-and-page-breaks.md) — `.la-cover` + `.la-break-*` utilities.
  > What this is · Scaffold to emit · The `.la-cover` design choices · The `.la-break-after` on the cover · When to use each break utility · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "force a break BEFORE my custom element" pattern · Visual verification
- [28-device-mockup-frame](references/28-device-mockup-frame.md) — `.la-device` + `--dev-*` props (any device).
  > What this is · Scaffold to emit · Why `box-sizing: border-box` · The `transform: translateX(-50%)` exception · The screen `overflow: hidden` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why the frame colour is `--vc-color-content`, not `#000` · Visual verification
- [29-hero-with-radial-glows](references/29-hero-with-radial-glows.md) — 4-layer decorative hero (canvas + glows + ghost + content).
  > What this is · Scaffold to emit · The critical `overflow: clip` choice · Why `color-mix(token, transparent)` not hardcoded `rgba()` · Why two glows at 28%/32% and 82%/78% · Why the ghost word at `font-size: clamp(120px, 28vw, 420px)` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use the hero · Visual verification
- [30-rotated-card-comparison](references/30-rotated-card-comparison.md) — two-paper rotated comparison hero.
  > What this is · Scaffold to emit · The transform values are the gimmick · The mobile-stack override · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this pattern · Visual verification
- [31-rtl-logical-properties](references/31-rtl-logical-properties.md) — the cross-cutting RTL authoring rule.
  > What this is · The "documented exception" rule · How to enforce · Why this matters for RTL languages · The `text-align: start` nuance · Scaffold to apply · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When a physical property is unavoidable · Visual verification
- [32-no-nested-scrollbars-pattern](references/32-no-nested-scrollbars-pattern.md) — the universal no-inner-scrollbars contract.
  > What this is · What is forbidden · What is allowed (text wrapping carve-out) · What is allowed (CLIP, not SCROLL) · CSS pattern to enforce in any runtime stylesheet · The escape hatch: `.la-article__wide` / `.la-article__bleed` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · How to fix a violation · When a true app-surface scrollbar is allowed · Visual verification · The `overflow: hidden` vs `overflow: clip` distinction · Browser support for `overflow: clip` · The legitimate scroll containers · Why "wide content widens the document" works · The print perspective · When the rule cannot be satisfied
- [33-selection-atoms](references/33-selection-atoms.md) — `markLayoutAtoms()` SHAPES + decision-mini pill contract.
  > What this is · Why layout containers are EXCLUDED · The decision-mini pill contract · Scaffold to emit · Lib functions called · DESIGN.md tokens used · The fake-heading exclusion · When to add a new shape · Idempotency · Selection / comment / decision-mini contract summary · Visual verification
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
- [interactive-selection-base](../../references/interactive-selection-base.md) — the selection-runtime page contract.
