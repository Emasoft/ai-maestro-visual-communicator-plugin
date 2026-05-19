---
name: amvcp-layout-chrome
description: "Persistent page chrome — sticky header (opaque + glass), section-numbered headers, fluid clamp() headings, sticky toolbar, scroll-spy + sticky-sidebar + right-margin + prefilled TOC variants. Use for sticky header, persistent navigation, TOC, scroll-spy, breadcrumbs, toolbar, fluid heading sizing. Trigger with 'sticky header', 'glassmorphism', 'toolbar', 'TOC', 'scroll-spy', 'sticky sidebar', 'breadcrumbs', 'fluid heading', 'section header'."
license: MIT
compatibility: "Browser (position:sticky, IntersectionObserver, color-mix, backdrop-filter, clamp()). Requires scripts/amvcp-layout.css for chrome presets and scripts/amvcp-layout.js for sticky-header + TOC scroll-spy wiring."
metadata:
  author: Emasoft
---

# Layout Chrome

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling layout skills:** [amvcp-layout](../amvcp-layout/SKILL.md) (router) · [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) · [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) · [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) · [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) · [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md).

## Overview

Persistent page chrome: sticky page header (opaque + glass), sticky in-page toolbar, scroll-spy TOC (auto-built + sticky-sidebar + right-margin + prefilled variants), section-numbered headers, and fluid `clamp()` headings used inside that chrome. Every sticky element uses `position: sticky` (NEVER `position: fixed`) so it respects document flow and prints cleanly. Every TOC variant uses `IntersectionObserver` to highlight the active section without scroll-event listeners.

## Prerequisites

- `scripts/amvcp-layout.css` linked (chrome presets ship here).
- `scripts/amvcp-layout.js` loaded for sticky-header IO sentinel + TOC scroll-spy.
- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — supplies every `--vc-*` token. Chrome consumes `--vc-z-sticky` (the sticky-layer z-index) plus color/space tokens.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop.
- Python 3.12+ for `scripts/amvcp-select.py`.

## When to choose this category

| Request shape | Refs | Scaffold class |
|---|---|---|
| fluid clamp() heading on cover / hero | [15](references/15-fluid-headings-clamp.md), [20](references/20-fluid-h1-headings.md) | `clamp(MIN, IDEAL, MAX)` |
| section header with `01` badge + meta chip | [16](references/16-section-numbered-headers.md) | `.la-sec-head` |
| persistent page header | [17](references/17-sticky-header.md), [18](references/18-glassmorphism-header.md) | `.la-header` (+ `--glass`) |
| sticky controls bar above a section | [19](references/19-toolbar-sticky-bar.md) | custom sticky toolbar |
| jump-to-section nav (auto-built or static) | [21](references/21-scroll-spy-toc.md), [22](references/22-sticky-sidebar-toc.md), [23](references/23-right-margin-toc.md), [24](references/24-prefilled-static-toc.md) | `.la-toc` |

## Authoring rules (HARD invariants)

- **Spacing tokens only.** Every length is `var(--vc-space-N)`, `var(--la-*)`, or `ch` (reading measures only). NO literal pixel values for layout sizing.
- **Engine tokens only for colour.** Every header tint / TOC active-state colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors the chrome with zero extra CSS.
- **`position: sticky`, NEVER `position: fixed`.** Sticky elements respect document flow, print cleanly, and don't break with browser zoom — `fixed` does none of these.
- **Sticky z-index from token.** Use `z-index: var(--vc-z-sticky)` — never a magic number.
- **Sticky-sidebar requires `align-self: start`.** Without this CSS-Grid alignment hint, `position: sticky` silently fails inside a grid cell.
- **Scroll-spy via `IntersectionObserver`, not scroll-event listener.** The shipped scroll-spy uses `IntersectionObserver` with `-40% 0px -40% 0px` rootMargin — never a scroll-event listener (those break with `prefers-reduced-motion`, debouncing, and passive-event policies).
- **TOC has JS-off graceful degradation.** Auto-built TOCs render an empty `<ol>` that the JS fills; prefilled TOCs work statically. Either way, an anchor click still navigates without JS.
- **No nested scrollbars.** Chrome does NOT introduce inner scrollbars. Long sticky sidebars overflow the viewport; the page itself scrolls.
- **Selection contract.** Every chrome region (header, TOC, toolbar, section header) is a selectable atom via `markLayoutAtoms()`. The 3-segment decision-mini pill attaches to each. Fake-heading risk: section-numbered headers (`16`) are NOT real `<h2>` — they're `<div class="la-sec-head">` to keep the document heading outline clean.

## Instructions

1. Match the user's request to a row in the table above; open the cited refs.
2. Paste the scaffold (each ref includes a complete `<style>` snippet).
3. For sticky header / TOC: include `scripts/amvcp-layout.js` for the IO sentinel + scroll-spy wiring.
4. For TOC variants: pick the right one — sticky-sidebar (most common), right-margin (niche, narrow content), prefilled (JS-off-safe), or scroll-spy alone (no sidebar, just highlighting an external TOC).
5. Stamp `data-ve-id` on every chrome region (auto-stamped by `markLayoutAtoms()` for SHAPES classes).
6. Verify with the visual-verification section of each ref.

Copy this checklist and track your progress:

- [ ] Picked the right chrome preset(s) — header, toolbar, TOC variant
- [ ] Pasted the scaffold + linked `amvcp-layout.css` + `amvcp-layout.js`
- [ ] (Sticky elements) z-index uses `var(--vc-z-sticky)` not a number
- [ ] (TOC sticky-sidebar) `align-self: start` IS set on the TOC
- [ ] (TOC prefilled) heading IDs match the TOC anchor hrefs
- [ ] (Fluid headings) clamp values picked deliberately for the surface (cover vs hero vs section)
- [ ] (Section-numbered headers) NOT using a real `<h2>` (use `<div class="la-sec-head">`)
- [ ] Verified BOTH light and dark themes (per `amvcp-self-debug-rules` R10)
- [ ] (Glass header) Verified the `backdrop-filter` fallback works in Firefox

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the chrome presets, the engine `<script>` + DESIGN.md block, and `amvcp-layout.js` for the IO sentinel + scroll-spy. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

| Symptom | Fix |
|---|---|
| Sticky header doesn't get the scrolled-state border | `amvcp-layout.js` not loaded — IO sentinel never fires. |
| Sticky sidebar TOC doesn't stick | `align-self: start` missing on the TOC ([22](references/22-sticky-sidebar-toc.md)). |
| TOC active section never highlights | Scroll-spy needs `amvcp-layout.js` loaded AND each section must have an `id` matching a TOC anchor href. |
| TOC links go to wrong heading | Pre-filled TOC with stale headings — either auto-build (empty `<ol>`) or sync hrefs to heading ids ([24](references/24-prefilled-static-toc.md)). |
| Header fades to white in dark mode | Hardcoded `rgba(255,255,255,0.6)` instead of `color-mix(in oklch, var(--vc-color-surface), transparent 40%)`. |
| Glass header looks opaque in Firefox | `backdrop-filter` fallback missing — provide a solid `--vc-color-surface` fallback. Firefox supports `backdrop-filter` in recent stable releases; older browsers fall through to the solid token. |
| Sticky toolbar overlaps header | Wrong z-index ordering — toolbar should be `calc(var(--vc-z-sticky) - 1)` so the page header still wins. |
| Heading too small on mobile (or too big on 4K) | `clamp()` MIN/IDEAL/MAX values need adjustment — see [15](references/15-fluid-headings-clamp.md) for the math. |
| RTL layout broken | A physical property leaked in — replace with the logical equivalent. |

## Examples

Input: user asks for a documentation page with sticky header + auto-built sticky-sidebar TOC.
Output: a `.la-header` above a 2-col grid; the sidebar holds an auto-build TOC that `amvcp-layout.js` fills:

```html
<header class="la-header" data-ve-id="header" style="position: sticky; inset-block-start: 0; z-index: var(--vc-z-sticky);">
  <div class="la-header__brand">My Docs</div>
  <nav class="la-header__nav">…</nav>
</header>
<div class="la-grid--2-1" data-ve-id="page-body">
  <main data-ve-id="article">
    <h2 id="intro">Intro</h2><p>…</p>
    <h2 id="usage">Usage</h2><p>…</p>
  </main>
  <aside style="align-self: start;">
    <nav class="la-toc" data-ve-id="toc"><ol></ol></nav>
  </aside>
</div>
<script src="amvcp-layout.js"></script>
```

More examples:

- A documentation reader: `.la-header` (opaque) + 12-column grid with `.la-grid--3-1` (article + sticky `.la-toc` sidebar with scroll-spy).
- A SaaS marketing page: `.la-header` (glass) over a hero band + below-fold sections + section-numbered headers + scroll-spy in the right margin.
- A long-form blog post: prefilled TOC at the top (JS-off-safe) + auto-built sticky sidebar TOC for JS-on readers.
- An admin app: `.la-header` + sticky toolbar above a data table (filter chips + sort dropdown).
- A magazine article: section-numbered headers with `01` / `02` / `03` badges + meta chip (date / author) for each section.

## Modes

This skill supports `data-ve-mode="readonly"` only. Chrome elements are page navigation primitives — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Chrome composes with EVERY other layout skill. The sticky header sits above everything; the sticky toolbar nests inside sections; the TOC nests inside a sidebar grid cell from sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md). Multiple sticky toolbars on one page are uncommon but allowed if z-index is coordinated.

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md`. For sticky elements: scroll the page in dev-browser and confirm the element STICKS (not just appears once). For TOC scroll-spy: scroll past each section heading and confirm the corresponding TOC entry gets the active state.

## Resources

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
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
