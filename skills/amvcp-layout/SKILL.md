---
name: amvcp-layout
description: "Build page layouts as self-contained DESIGN.md-themed HTML — asymmetric content+sidebar grids, 3-panel IDE shells, 12-column dashboards, measured reading containers, scroll-spy tables of contents, sticky headers, A4 print layout, and device-mockup frames. Use when the user asks for a layout, grid, two-column page, sidebar, dashboard, 3-panel UI, table of contents, scroll-spy, print/PDF layout, reading layout, sticky header, or device mockup. Trigger with 'layout', 'grid', 'two-column', 'sidebar', 'dashboard', '3-panel', 'TOC', 'table of contents', 'scroll-spy', 'print layout', 'PDF layout', 'reading layout', 'device mockup', 'sticky header', 'hero background'."
license: MIT
compatibility: "Browser (CSS Grid, subgrid, logical properties, color-mix, @page). Themes off the DESIGN.md engine (amvcp-designmd.js). Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Layout

## Overview

Loads on requests for a layout, grid, dashboard, reading page, table of contents, sticky header, print/PDF layout, or device mockup. Produces one self-contained `.html` themed entirely by the DESIGN.md engine — every region is a `data-ve-id` selectable atom. The layout system is greenfield: named CSS-Grid presets, a measured reading container, a scroll-spy TOC, print rules, and decorative surfaces.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — it supplies every `--vc-*` token. Layout NEVER sets a `--vc-*` value; it only reads them and defines `--la-*` aliases.
- `scripts/amvcp-layout.css` linked (the whole CSS surface) and `scripts/amvcp-layout.js` loaded ONLY when groups 4/5/2c (sticky header, TOC, IDE collapse) are used — the other groups are pure CSS.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop (optional — a layout page renders correctly without it; selection just won't fire).
- Python 3.12+ for `scripts/amvcp-select.py`. See Resources for the base contract.

## Instructions

Pick the group whose scaffold matches the request shape, paste it, set `data-ve-id` on every region:

| Request shape | Scaffold class |
|---|---|
| content + sidebar | `.la-grid--2-1` / `.la-grid--3-1` |
| row of equal cards, aligned internals | `.la-cardrow` + `.la-card` (title/body/footer) |
| IDE / 3-panel tool UI | `.la-ide` + `[data-la-toggle]` |
| metrics dashboard | `.la-dashboard` + `data-span` (KPI card content ← chart skill) |
| long article / report body | `.la-article` — NOT on `<main>` (see Error Handling) |
| persistent page header | `.la-header` (+ `--glass` opt-in) |
| jump-to-section nav | `.la-toc` (+ `amvcp-layout.js` builds + highlights it) |
| output will be printed / PDF'd | `@page` + `.la-break-*` + `.la-cover` + `.no-print` |
| device screenshot frame | `.la-device` (set `--dev-w/-h/-radius/-notch-w/-notch-h`) |
| decorative hero band | `.la-hero` + `data-ghost` |

Rules: every length is a `--vc-space-*`/`--vc-radius-*` token or a `--la-*` alias; every colour is a `--vc-color-*` token (light + dark fall out for free); every directional property is logical (`margin-inline`, `inset-block-start`, `inline-size`) so `dir="rtl"` mirrors everything. Heavy CSS + scaffolds: `references/layout-patterns.md`.

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the group-1 `:root` aliases + the groups used, the engine `<script>` + DESIGN.md block, and `amvcp-layout.js` only for groups 4/5/2c. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

- **Reading measure ignored** → `.la-article` was put on `<main>`; the runtime forces `main { max-width:none !important }`. Use a `<div>`/`<article>`.
- **Wide table/code forces the whole grid past the viewport** → add `min-width:0` to the grid child (the presets already do this — check custom children).
- **Sidebar won't collapse / TOC not highlighting / no scroll border** → `amvcp-layout.js` not loaded.
- **Print drops token background tints** → the `@media print` block needs `print-color-adjust:exact` (shipped in `amvcp-layout.css`).
- **RTL layout broken** → a physical property (`margin-left`, `left`, `width`) leaked in — replace with the logical equivalent.

## Examples

- A content+sidebar report: `.la-header` + `.la-toc` + `.la-grid--2-1` wrapping a `.la-article` main region.
- A printed dashboard: `.la-cover` + `.la-dashboard` with `data-span` regions + `.la-break-before` appendix.

## Resources

- `references/layout-patterns.md` — full HTML+CSS catalog, one section per group, the RTL authoring gate, the no-nested-scrollbars note.
- `references/layout-tokens.md` — the `--la-*` derived-token contract, the recommended DESIGN.md `spacing.scale`, the `--vc-z-sticky` and `ch`-measure rationale.
- `interactive-selection-base.md` — the selection-runtime page contract.
