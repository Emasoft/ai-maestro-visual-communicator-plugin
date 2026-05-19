---
name: amvcp-layout-grids
description: "Foundation grids + spatial tokens for visual-communicator pages — spatial token ladder, --la-* aliases, named gaps, reading measures, 2-1 + 3-1 asymmetric grids, subgrid card row, auto-fill card grid, mobile breakpoint, three-column article grid, wide-bleed escape hatches, RTL logical props, no-nested-scrollbars rule, selection-atoms contract. Use when the user asks for a grid, content+sidebar layout, gallery, article body, RTL layout, or the underlying spatial-token foundation. Trigger with 'grid', 'columns', 'sidebar', 'gallery', 'cards', 'article', 'reading measure', 'RTL', 'spatial tokens', 'gap'."
license: MIT
compatibility: "Browser (CSS Grid, subgrid, logical properties, color-mix, ch units, dvh units). Themes off the DESIGN.md engine (amvcp-designmd.js). Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Layout Grids + Foundation

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling layout skills:** [amvcp-layout](../amvcp-layout/SKILL.md) (router) · [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) · [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) · [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) · [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) · [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md).

## Overview

The foundation skill of the layout family. Hosts the spatial-token ladder (`--vc-space-N` indexed scale), the semantic `--la-*` alias layer, the named-gap map, the `ch`-based reading measure, and every responsive grid preset — 2fr:1fr (content+sidebar), 3fr:1fr (feature article), subgrid card row (aligned title/body/footer), auto-fill card grid (gallery), three-column article grid (measured reading + wide-bleed escape hatches), the single 768px mobile-collapse breakpoint, the cross-cutting RTL logical-properties rule, the no-nested-scrollbars contract, and the `markLayoutAtoms()` selection-atoms contract. Sibling layout skills consume these primitives.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — supplies every `--vc-*` token. Layout consumes them; layout NEVER sets a `--vc-*` value (only defines `--la-*` aliases over them).
- `scripts/amvcp-layout.css` linked (every grid preset ships here).
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop (optional — pages render without it; selection just won't fire).
- Python 3.12+ for `scripts/amvcp-select.py`.

## When to choose this category

| Request shape | Refs | Scaffold class |
|---|---|---|
| spatial / spacing tokens (the foundation) | [01](references/01-spatial-token-ladder.md), [02](references/02-derived-aliases.md), [03](references/03-named-gaps-semantics.md) | `var(--vc-space-N)` + `var(--la-*)` |
| reading measure (ch-based) | [04](references/04-reading-measure-ch-based.md) | `ch` unit on text container |
| content + sidebar | [05](references/05-asymmetric-grid-2-1.md), [06](references/06-asymmetric-grid-3-1.md) | `.la-grid--2-1` / `.la-grid--3-1` |
| row of equal cards, aligned title/body/footer | [07](references/07-subgrid-card-row.md) | `.la-cardrow` + `.la-card` |
| gallery / index / tile grid | [11](references/11-card-grid-autofill.md) | custom `auto-fill` grid |
| mobile responsive collapse | [12](references/12-mobile-collapse-breakpoint.md) | `@media (max-width: 768px)` |
| long article / report body | [13](references/13-article-three-column-grid.md), [14](references/14-article-wide-bleed.md) | `.la-article` + `.la-article__wide` / `__bleed` |
| RTL-correct layout (Arabic, Hebrew, …) | [31](references/31-rtl-logical-properties.md) | `dir="rtl"` on root |
| no-nested-scrollbars rule | [32](references/32-no-nested-scrollbars-pattern.md) | `overflow: visible` / `clip` |
| selection-atoms contract | [33](references/33-selection-atoms.md) | `markLayoutAtoms()` |
| group-1 alias block + token contract | [layout-tokens](references/layout-tokens.md) | `:root { --la-* }` block |
| full HTML+CSS catalog (one section per group) | [layout-patterns](references/layout-patterns.md) | (catalog) |

## Authoring rules (HARD invariants — apply to every ref above AND to every sibling layout skill)

- **Spacing tokens only.** Every length is `var(--vc-space-N)`, `var(--la-*)`, or `ch` (reading measures only). NO literal pixel values for layout sizing. Documented exceptions: `768px` (the single mobile breakpoint — see [12](references/12-mobile-collapse-breakpoint.md)), `16mm` (the print page margin — owned by sibling [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md)).
- **Engine tokens only for colour.** Every colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors everything with zero extra CSS. See [31](references/31-rtl-logical-properties.md).
- **No nested scrollbars.** No primitive ships `overflow:auto` / `overflow:scroll`. Wide content widens the document via `.la-article__wide` / `__bleed`. Decorative clips use `overflow: clip` (not `hidden`). See [32](references/32-no-nested-scrollbars-pattern.md).
- **`min-width: 0` on every grid child.** Without this, wide content (table, code block) inside a grid cell forces the WHOLE GRID past the viewport. The shipped presets already do this; custom grids must too.
- **Selection contract.** Every layout-shaped element is a selectable atom via `markLayoutAtoms()` ([33](references/33-selection-atoms.md)). The 3-segment decision-mini pill (`✘` ﹅ `✔︎`) attaches to each.
- **Alias layer, not duplicate token ladder.** Define `--la-*` aliases over `--vc-space-N` — never a parallel `--space-*` scale. See [02](references/02-derived-aliases.md).
- **Named gaps over arbitrary spacing.** Use the named-gap map ([03](references/03-named-gaps-semantics.md)) to pick the right `--la-gap*` for the context (cardrow vs sidebar vs section vs page).
- **Reading measure in `ch`, not `px`.** A text container's `max-inline-size` is `68ch` (canonical) or `92ch` (wide variant) — never a pixel value. See [04](references/04-reading-measure-ch-based.md).

## Instructions

1. Look up the request shape in the table above; open the cited refs.
2. Paste the scaffold from the ref (each ref includes a complete `<html>` + `<style>` snippet).
3. Set `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
4. Verify with the visual-verification section of each ref — every ref ends with a `Visual verification` section pointing at [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

Copy this checklist and track your progress:

- [ ] Chose the right grid preset (2-1 / 3-1 / subgrid cardrow / auto-fill / article)
- [ ] All lengths via `var(--vc-space-N)` / `var(--la-*)` / `ch` — no literal px (except documented exceptions)
- [ ] All colors via `--vc-color-*` tokens — no hardcoded `#NNN` / `rgb()`
- [ ] All directional declarations logical (`margin-inline`, `inset-block-start`, …)
- [ ] No `overflow: auto` / `overflow: scroll` introduced
- [ ] `min-width: 0` set on every custom grid child
- [ ] `data-ve-id` stamped on every region
- [ ] Verified BOTH light and dark themes (per `amvcp-self-debug-rules` R10)
- [ ] Verified RTL via `dir="rtl"` on root (mirrors correctly without extra CSS)
- [ ] Verified mobile reflow at 768px breakpoint

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the group-1 `:root` aliases + the groups used, the engine `<script>` + DESIGN.md block. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

| Symptom | Fix |
|---|---|
| Reading measure ignored | `.la-article` was put on `<main>` — the runtime forces `main { max-width:none !important }`. Use a `<div>`/`<article>` (see [13](references/13-article-three-column-grid.md)). |
| Wide table/code forces the whole grid past the viewport | Add `min-width:0` to the grid child (the presets already do this — check custom children). |
| Card row title/body/footer don't align | Missing `subgrid` on the inner card — see [07](references/07-subgrid-card-row.md) for the HARD card-internal contract. |
| Gallery card width drifts on resize | Wrong `minmax()` — use `minmax(min(316px, 100%), 1fr)` (see [11](references/11-card-grid-autofill.md)). |
| RTL layout broken | A physical property (`margin-left`, `left`, `width`) leaked in — replace with logical equivalent (`margin-inline-start`, `inset-inline-start`, `inline-size`) ([31](references/31-rtl-logical-properties.md)). |
| Inner scrollbar appeared | Forbidden — wide content must widen the document via `.la-article__wide` / `__bleed` ([14](references/14-article-wide-bleed.md), [32](references/32-no-nested-scrollbars-pattern.md)). |
| Mobile layout doesn't collapse | The `@media (max-width: 768px)` block is missing — see [12](references/12-mobile-collapse-breakpoint.md). |

## Examples

- A content+sidebar report: `.la-grid--2-1` wrapping a `.la-article` main region + a sticky sidebar (sidebar chrome from sibling [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md)).
- A long-form article: `.la-article` (3-col grid) with `.la-article__wide` for a chart and `.la-article__bleed` for a full-bleed hero image.
- A magazine cardrow: `.la-cardrow` of 3 `.la-card`s using subgrid to align titles, bodies, and footers across cards.
- A gallery: `auto-fill` grid with `minmax(min(316px, 100%), 1fr)` — reflows naturally from many-across to one-across on phones.
- An RTL article (Arabic): same scaffold, just `dir="rtl"` on the root — every logical property mirrors automatically.

## Modes

This skill supports `data-ve-mode="readonly"` only. Grids and the spatial foundation are page scaffolding — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

This skill is foundational — every sibling layout skill (shells, kpi, chrome, print-hero) is composed inside one of its grid presets. Multiple grid primitives on one page are allowed (e.g. shell wrapping a dashboard grid). The only exclusive skill is the overlay-runtime (R24).

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes AT three widths (1280px desktop, 768px tablet boundary, 360px phone). Test RTL by setting `dir="rtl"` and confirming the layout mirrors without breakage.

## Resources

- [layout-patterns](references/layout-patterns.md) — full HTML+CSS catalog (one section per group); the RTL authoring gate; the no-nested-scrollbars note.
  > Authoring gate — logical properties only (RTL) · No nested scrollbars · Group 1 — Spatial foundation · Group 2 — Grid presets · Group 3 — Reading container · Group 4 — Page chrome: sticky header · Group 5 — In-page navigation: scroll-spy TOC · Group 6 — Print / paged layout · Group 7 — Decorative surfaces
- [layout-tokens](references/layout-tokens.md) — the `--la-*` derived-token contract; the recommended DESIGN.md `spacing.scale`; the `--vc-z-sticky` and `ch`-measure rationale.
  > The `:root` alias block (Group 1 — spatial foundation) · Why this is an alias layer, not a second `--space-*` ladder · The `ch`-based reading measure (documented exception) · Recommended DESIGN.md `spacing.scale` (8px grid) · The sticky-header z-index — `--vc-z-sticky` · Other documented non-token values
- [01-spatial-token-ladder](references/01-spatial-token-ladder.md) — 8px grid spacing-token contract; hot-swap path.
- [02-derived-aliases](references/02-derived-aliases.md) — the semantic `--la-*` alias layer over indexed engine tokens.
- [03-named-gaps-semantics](references/03-named-gaps-semantics.md) — the canonical map of WHEN to use which `--la-gap*` token.
- [04-reading-measure-ch-based](references/04-reading-measure-ch-based.md) — why `ch`-units (not px) for reading measures.
- [05-asymmetric-grid-2-1](references/05-asymmetric-grid-2-1.md) — 2fr:1fr content+sidebar (the canonical 2-region page).
- [06-asymmetric-grid-3-1](references/06-asymmetric-grid-3-1.md) — 3fr:1fr feature-article variant.
- [07-subgrid-card-row](references/07-subgrid-card-row.md) — title/body/footer alignment across cards via subgrid.
- [11-card-grid-autofill](references/11-card-grid-autofill.md) — `auto-fill` gallery / thumbnail grid.
- [12-mobile-collapse-breakpoint](references/12-mobile-collapse-breakpoint.md) — the single 768px breakpoint convention.
- [13-article-three-column-grid](references/13-article-three-column-grid.md) — measured reading column via 3-col grid.
- [14-article-wide-bleed](references/14-article-wide-bleed.md) — `__wide` (92ch) and `__bleed` (full) escape hatches.
- [31-rtl-logical-properties](references/31-rtl-logical-properties.md) — the cross-cutting RTL authoring rule.
- [32-no-nested-scrollbars-pattern](references/32-no-nested-scrollbars-pattern.md) — the universal no-inner-scrollbars contract.
- [33-selection-atoms](references/33-selection-atoms.md) — `markLayoutAtoms()` SHAPES + decision-mini pill contract.
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
- [interactive-selection-base](../../references/interactive-selection-base.md) — the selection-runtime page contract.
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
