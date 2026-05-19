---
name: amvcp-layout-print-hero
description: "Print and decorative-hero layouts — A4 page rules, @media print reset, cover pages, page-break helpers, print-color-adjust, hero with radial glows, device-mockup frames, rotated comparison hero. Use when the user asks for print, PDF, A4, cover page, page break, hero background, device mockup, or two-paper comparison hero. Trigger with 'print', 'A4', 'PDF', 'page break', 'cover page', 'print-color-adjust', 'hero', 'radial glow', 'ghost text', 'device mockup', 'rotated cards', 'comparison hero'."
license: MIT
compatibility: "Browser (CSS @page, print-color-adjust, color-mix, overflow:clip, position:absolute). Requires scripts/amvcp-layout.css for print reset and decorative-hero presets. Themes off the DESIGN.md engine."
metadata:
  author: Emasoft
---

# Layout Print + Hero

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling layout skills:** [amvcp-layout](../amvcp-layout/SKILL.md) (router) · [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) · [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) · [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) · [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) · [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md).

## Overview

Print layouts and decorative hero surfaces. The print side covers `@page` size + margin for A4, the full `@media print` reset (hide chrome, force token tints via `print-color-adjust:exact`), cover pages, and the `.la-break-before` / `.la-break-after` / `.la-break-avoid` page-break utilities. The hero side covers the 4-layer `.la-hero` (canvas + radial glows + ghost watermark + content), generalised `.la-device` mockup frames (any device via `--dev-*` CSS props), and the rotated two-paper comparison hero.

## Prerequisites

- `scripts/amvcp-layout.css` linked (print reset + hero presets ship here).
- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — supplies every `--vc-*` token. Hero presets MUST consume tokens (e.g. `color-mix(in oklch, var(--vc-color-accent), transparent 70%)`) — never hardcoded `rgba()`.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop.
- Python 3.12+ for `scripts/amvcp-select.py`.
- For programmatic PDF generation: Puppeteer / Playwright / Chrome headless.

## When to choose this category

| Request shape | Refs | Scaffold class |
|---|---|---|
| output will be printed / PDF'd | [25](references/25-a4-page-rules.md), [26](references/26-print-reset.md), [27](references/27-cover-and-page-breaks.md) | `@page` + `.la-break-*` + `.la-cover` + `.no-print` |
| device screenshot frame | [28](references/28-device-mockup-frame.md) | `.la-device` (set `--dev-*` props) |
| decorative hero band | [29](references/29-hero-with-radial-glows.md) | `.la-hero` + `data-ghost` |
| two-paper rotated comparison | [30](references/30-rotated-card-comparison.md) | custom rotated cards |

## Authoring rules (HARD invariants)

- **Spacing tokens only.** Every length is `var(--vc-space-N)`, `var(--la-*)`, or a print exception. Documented exception: `16mm` (the A4 page margin — see ref 25).
- **Engine tokens only for colour.** Every glow / device-frame / cover surface colour is a `--vc-color-*` engine token via `color-mix(...)` — never a hardcoded `rgba()` or `#000`. Light + dark fall out for free.
- **Logical properties only.** `dir="rtl"` mirrors hero content with zero extra CSS.
- **Decorative clips use `overflow: clip`, not `overflow: hidden`.** Hero overflow uses `clip` so screen-readers and selection still work past the visual bounds. See sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) for the no-nested-scrollbars contract.
- **Print MUST set `print-color-adjust: exact`.** Without it, every token tint is stripped on the printed page. The `amvcp-layout.css` print reset does this — verify it's not overridden.
- **Selection contract.** Every hero / device / cover atom is a selectable atom via `markLayoutAtoms()`. Decorative glow layers are EXCLUDED (decorative-only).

## Instructions

1. Match the user's request to a row in the table above; open the cited refs.
2. Paste the scaffold (each ref includes a complete `<style>` snippet + minimal HTML).
3. For print: include `@page { size: A4; margin: 16mm }` and the print reset (already in `amvcp-layout.css`). Add `.no-print` to chrome elements (header, TOC, navigation).
4. For cover pages: place `.la-cover` as the first child of `<main>` and add `.la-break-after` so the body starts on page 2.
5. For hero: pick `.la-hero` for the radial-glow variant, `.la-device` for a device frame, or the rotated-cards pattern for two-paper comparisons.
6. Stamp `data-ve-id` on every region.
7. Verify with the visual-verification section of each ref.

Copy this checklist and track your progress:

- [ ] Picked the right preset (print vs hero vs device vs rotated)
- [ ] Pasted the scaffold + linked `amvcp-layout.css`
- [ ] (Print) `@page` rules set, `.no-print` on chrome, `.la-break-*` between sections
- [ ] (Print) Verified `print-color-adjust: exact` IS active (preview with browser print dialog)
- [ ] (Hero) All colors via `--vc-color-*` tokens, never hardcoded
- [ ] (Hero) Decorative layers use `overflow: clip` (NOT `hidden`)
- [ ] Verified BOTH light and dark themes (per `amvcp-self-debug-rules` R10)
- [ ] (Print) Verified the printed output retains tint colors

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the print rules / hero presets, the engine `<script>` + DESIGN.md block. Every selectable atom carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime. Decorative glow / ghost layers do NOT get atoms.

## Error Handling

| Symptom | Fix |
|---|---|
| Print drops token background tints | The `@media print` block needs `print-color-adjust:exact` (shipped in `amvcp-layout.css` — see [26](references/26-print-reset.md)). Browser may also need user-side "Background graphics" toggle. |
| Page breaks happen mid-heading | Add `break-after: avoid` to the heading or wrap the section in `.la-break-avoid` (see [27](references/27-cover-and-page-breaks.md)). |
| Cover page bleeds onto page 2 | Add `.la-break-after` to the cover. |
| Hero glows leak past the section | The hero needs `overflow: clip` (NOT `hidden`, NOT `auto`) — see [29](references/29-hero-with-radial-glows.md). |
| Device frame too narrow / wide | Override `--dev-width` / `--dev-aspect` on the `.la-device` instance — see [28](references/28-device-mockup-frame.md). |
| Hero colour wrong in dark mode | Hardcoded `rgba()` instead of `color-mix(in oklch, var(--vc-color-*), transparent X%)` — replace. |

## Examples

Input: user asks for a printable audit report (A4) with a cover page + page-break-managed body + a hero band at the top of page 1.
Output: A4 `@page` rules + `.la-cover` (with `.la-break-after`) on page 1, then the body on page 2:

```html
<style>
  @page { size: A4; margin: 16mm; }
  @media print { .no-print { display: none !important; } }
</style>
<main>
  <section class="la-cover la-break-after" data-ve-id="cover">
    <h1 style="font-size: clamp(48px, 6vw, 96px)">Q4 Audit Report</h1>
    <p>Prepared by Acme Co · 2026-05-18</p>
  </section>
  <section class="la-hero" data-ghost="Q4" data-ve-id="hero">
    <h2>Executive summary</h2>
  </section>
  <article class="la-article" data-ve-id="body">…</article>
</main>
```

More examples:

- A printed audit report: `.la-cover` (with title + date + author) → `.la-break-after` → KPI summary → body → appendix with `.la-break-before`.
- A SaaS landing page: `.la-hero` band at the top with the product name as `data-ghost` watermark + 4 radial glows + headline + CTA.
- A device-gallery showcase: a row of `.la-device` frames, each with `--dev-width` / `--dev-aspect` / `--dev-bezel` set to iPhone / iPad / Pixel.
- A two-product comparison hero: rotated-cards pattern with one card per product, slight `rotate(-3deg)` / `rotate(3deg)`.
- A printable invoice: A4 page rules + no chrome + token tints preserved via `print-color-adjust:exact`.

## Modes

This skill supports `data-ve-mode="readonly"` only. Print / hero / device layouts are page presentation — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Print rules compose with EVERY other layout skill — the `@media print` reset hides chrome (TOC, sticky header, navigation) and strips inner scrollers so the document expands cleanly to printable pages. Hero bands typically sit ABOVE the main body and below the sticky header (from sibling `amvcp-layout-chrome`). Device mockups live inside reading articles or hero bands.

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md`. For print specifically: use browser's "Print preview" (Cmd-P) and confirm token tints appear in the preview. For hero: dev-browser screenshots in BOTH light and dark themes.

## Resources

- [25-a4-page-rules](references/25-a4-page-rules.md) — `@page { size: A4; margin: 16mm }` for print / PDF.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why a hardcoded 16mm · When to override the default · Visual verification · The print-vs-screen mental shift · Common print pitfalls · Browser-specific print quirks · Generating PDFs programmatically
- [26-print-reset](references/26-print-reset.md) — `@media print` reset: hide chrome, force token tints, page-break gates.
  > What this is · The full print reset (from `amvcp-layout.css`) · The `.no-print` utility class · The `print-color-adjust: exact` rule · Why `break-after: avoid` on headings · Why `break-inside: avoid` on figures / tables / code blocks · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When the print reset needs extension · Visual verification
- [27-cover-and-page-breaks](references/27-cover-and-page-breaks.md) — `.la-cover` + `.la-break-*` utilities.
  > What this is · Scaffold to emit · The `.la-cover` design choices · The `.la-break-after` on the cover · When to use each break utility · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · The "force a break BEFORE my custom element" pattern · Visual verification
- [28-device-mockup-frame](references/28-device-mockup-frame.md) — `.la-device` + `--dev-*` props (any device).
  > What this is · Scaffold to emit · Why `box-sizing: border-box` · The `transform: translateX(-50%)` exception · The screen `overflow: hidden` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · Why the frame colour is `--vc-color-content`, not `#000` · Visual verification
- [29-hero-with-radial-glows](references/29-hero-with-radial-glows.md) — 4-layer decorative hero (canvas + glows + ghost + content).
  > What this is · Scaffold to emit · The critical `overflow: clip` choice · Why `color-mix(token, transparent)` not hardcoded `rgba()` · Why two glows at 28%/32% and 82%/78% · Why the ghost word at `font-size: clamp(120px, 28vw, 420px)` · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use the hero · Visual verification
- [30-rotated-card-comparison](references/30-rotated-card-comparison.md) — two-paper rotated comparison hero.
  > What this is · Scaffold to emit · The transform values are the gimmick · The mobile-stack override · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this pattern · Visual verification
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
