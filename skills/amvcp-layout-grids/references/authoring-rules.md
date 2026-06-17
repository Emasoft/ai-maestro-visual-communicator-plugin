# Authoring rules + verification checklist

## Authoring rules (HARD invariants — apply to every ref AND to every sibling layout skill)

- **Spacing tokens only.** Every length is `var(--vc-space-N)`, `var(--la-*)`, or `ch` (reading measures only). NO literal pixel values for layout sizing. Documented exceptions: `768px` (the single mobile breakpoint — see ref 12), `16mm` (the print page margin — owned by sibling amvcp-layout-print-hero).
- **Engine tokens only for colour.** Every colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors everything with zero extra CSS. See ref 31.
- **No nested scrollbars.** No primitive ships `overflow:auto` / `overflow:scroll`. Wide content widens the document via `.la-article__wide` / `__bleed`. Decorative clips use `overflow: clip` (not `hidden`). See ref 32.
- **`min-width: 0` on every grid child.** Without this, wide content (table, code block) inside a grid cell forces the WHOLE GRID past the viewport. The shipped presets already do this; custom grids must too.
- **Selection contract.** Every layout-shaped element is a selectable atom via `markLayoutAtoms()` (ref 33). The 3-segment decision-mini pill (`✘` ﹅ `✔︎`) attaches to each.
- **Alias layer, not duplicate token ladder.** Define `--la-*` aliases over `--vc-space-N` — never a parallel `--space-*` scale. See ref 02.
- **Named gaps over arbitrary spacing.** Use the named-gap map (ref 03) to pick the right `--la-gap*` for the context (cardrow vs sidebar vs section vs page).
- **Reading measure in `ch`, not `px`.** A text container's `max-inline-size` is `68ch` (canonical) or `92ch` (wide variant) — never a pixel value. See ref 04.

## Verification checklist

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
