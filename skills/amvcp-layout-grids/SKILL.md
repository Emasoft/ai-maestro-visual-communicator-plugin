---
name: amvcp-layout-grids
description: "Foundation grids + spatial tokens — token ladder, --la-* aliases, named gaps, ch reading measures, 2-1/3-1 sidebar grids, subgrid card row, auto-fill gallery, article 3-col + wide/bleed, RTL logical props, no-nested-scrollbars, selection atoms. Use when the user asks for a grid, content+sidebar, gallery, article body, or RTL layout. Trigger with 'grid', 'columns', 'sidebar', 'gallery', 'cards', 'article', 'reading measure', 'RTL', 'spatial tokens', 'gap'."
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
| spatial / spacing tokens (the foundation) | refs 01, 02, 03 | `var(--vc-space-N)` + `var(--la-*)` |
| reading measure (ch-based) | ref 04 | `ch` unit on text container |
| content + sidebar | refs 05, 06 | `.la-grid--2-1` / `.la-grid--3-1` |
| row of equal cards, aligned title/body/footer | ref 07 | `.la-cardrow` + `.la-card` |
| gallery / index / tile grid | ref 11 | custom `auto-fill` grid |
| mobile responsive collapse | ref 12 | `@media (max-width: 768px)` |
| long article / report body | refs 13, 14 | `.la-article` + `.la-article__wide` / `__bleed` |
| RTL-correct layout (Arabic, Hebrew, …) | ref 31 | `dir="rtl"` on root |
| no-nested-scrollbars rule | ref 32 | `overflow: visible` / `clip` |
| selection-atoms contract | ref 33 | `markLayoutAtoms()` |
| group-1 alias block + token contract | layout-tokens | `:root { --la-* }` block |
| full HTML+CSS catalog (one section per group) | layout-patterns | (catalog) |

Each ref linked in the Resources section below with its full TOC embedded.

## Authoring rules (HARD invariants — apply to every ref above AND to every sibling layout skill)

The nine HARD invariants (tokens-only lengths · token colours · logical properties · no nested scrollbars · `min-width:0` on grid children · selection contract · alias-not-duplicate-ladder · named gaps · `ch` reading measure) plus the per-build checklist live here — read before authoring any layout:

- [authoring-rules](references/authoring-rules.md) — the HARD invariants + the verification checklist.
  > Authoring rules + verification checklist · Authoring rules (HARD invariants — apply to every ref AND to every sibling layout skill) · Verification checklist

## Instructions

1. Look up the request shape in the table above; open the cited refs.
2. Paste the scaffold from the ref (each ref includes a complete `<html>` + `<style>` snippet).
3. Set `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
4. Verify with the visual-verification section of each ref — every ref ends with a `Visual verification` section pointing at [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).
5. Track progress against the per-build checklist in [authoring-rules](references/authoring-rules.md) (copy it and tick each item: right preset · tokens-only lengths · token colours · logical props · no inner scroll · `min-width:0` · `data-ve-id` · light+dark · RTL · 768px reflow).

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the group-1 `:root` aliases + the groups used, the engine `<script>` + DESIGN.md block. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

| Symptom | Fix |
|---|---|
| Reading measure ignored | `.la-article` was put on `<main>` — the runtime forces `main { max-width:none !important }`. Use a `<div>`/`<article>` (see ref 13). |
| Wide table/code forces the whole grid past the viewport | Add `min-width:0` to the grid child (the presets already do this — check custom children). |
| Card row title/body/footer don't align | Missing `subgrid` on the inner card — see ref 07 for the HARD card-internal contract. |
| Gallery card width drifts on resize | Wrong `minmax()` — use `minmax(min(316px, 100%), 1fr)` (see ref 11). |
| RTL layout broken | A physical property (`margin-left`, `left`, `width`) leaked in — replace with logical equivalent (`margin-inline-start`, `inset-inline-start`, `inline-size`) — see ref 31. |
| Inner scrollbar appeared | Forbidden — wide content must widen the document via `.la-article__wide` / `__bleed` — see refs 14, 32. |
| Mobile layout doesn't collapse | The `@media (max-width: 768px)` block is missing — see ref 12. |

## Examples

Worked example (a `.la-grid--2-1` wrapping a `.la-article` body + sticky sidebar TOC, with the full `<html>` snippet) plus four more (long-form article with `__wide`/`__bleed`, magazine subgrid cardrow, auto-fill gallery, RTL article) live in [examples](references/examples.md).

- [examples](references/examples.md) — the content+sidebar `<html>` walkthrough + four more layout examples.
  > Examples

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
- [11-card-grid-autofill](references/11-card-grid-autofill.md) — `auto-fill` gallery / thumbnail grid.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this grid vs the KPI row (ref 10) · When to use this grid vs the subgrid card row (ref 07) · Why min(316px, 100%) in the floor · Visual verification · The "min card width" tradeoff · Combining with subgrid · Pagination considerations
- [12-mobile-collapse-breakpoint](references/12-mobile-collapse-breakpoint.md) — the single 768px breakpoint convention.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a single hardcoded breakpoint instead of a tokenized scale · When to override · Visual verification · The 768px figure in context · What "mobile collapse" means visually · The mobile-first vs desktop-first debate · Beyond mobile collapse
- [13-article-three-column-grid](references/13-article-three-column-grid.md) — measured reading column via 3-col grid.
  > What this is · Scaffold to emit · The HARD rule: NOT on `<main>` / `.ve-main` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why three columns instead of `max-width` + escape hatch overrides · Visual verification
- [14-article-wide-bleed](references/14-article-wide-bleed.md) — `__wide` (92ch) and `__bleed` (full) escape hatches.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use `__wide` vs `__bleed` · Why a 92ch cap on `__wide` · Why `margin-inline: auto` on `__wide` · Visual verification
- [31-rtl-logical-properties](references/31-rtl-logical-properties.md) — the cross-cutting RTL authoring rule.
  > What this is · The "documented exception" rule · How to enforce · Why this matters for RTL languages · The `text-align: start` nuance · Scaffold to apply · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When a physical property is unavoidable · Visual verification
- [32-no-nested-scrollbars-pattern](references/32-no-nested-scrollbars-pattern.md) — the universal no-inner-scrollbars contract.
  > What this is · What is forbidden · What is allowed (text wrapping carve-out) · What is allowed (CLIP, not SCROLL) · CSS pattern to enforce in any runtime stylesheet · The escape hatch: `.la-article__wide` / `.la-article__bleed` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · How to fix a violation · When a true app-surface scrollbar is allowed · Visual verification · The `overflow: hidden` vs `overflow: clip` distinction · Browser support for `overflow: clip` · The legitimate scroll containers · Why "wide content widens the document" works · The print perspective · When the rule cannot be satisfied
- [33-selection-atoms](references/33-selection-atoms.md) — `markLayoutAtoms()` SHAPES + decision-mini pill contract.
  > What this is · Why layout containers are EXCLUDED · The decision-mini pill contract · Scaffold to emit · Lib functions called · DESIGN.md tokens used · The fake-heading exclusion · When to add a new shape · Idempotency · Selection / comment / decision-mini contract summary · Visual verification
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
- [interactive-selection-base](../../references/interactive-selection-base.md) — the selection-runtime page contract.
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
