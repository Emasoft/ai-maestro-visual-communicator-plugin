---
name: amvcp-layout
description: "Router skill for layouts — layout surface split into 5 focused siblings (grids+foundation, shells, kpi, chrome, print-hero). Use when the user wants ANY layout task (grid, sidebar, dashboard, KPI, TOC, sticky header, print, hero, device mockup) to route to the right sibling. Trigger with 'layout', 'grid', 'sidebar', 'dashboard', 'TOC', 'print', 'A4', 'sticky header', 'glassmorphism', 'hero', 'device mockup', 'KPI', 'IDE shell'."
license: MIT
compatibility: "Browser (no build step). amvcp-layout.css + amvcp-layout.js + amvcp-runtime.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Layout (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 visual categories.

## Overview

This is the **router** for the layout surface. The layout catalogue was split into 5 focused siblings so each sibling's embedded TOC fits naturally and progressive discovery works without per-link contortion. The router emits no markup itself — pick the right sibling per the table below.

## Prerequisites

- `scripts/amvcp-layout.css` linked (every sibling's presets ship here).
- `scripts/amvcp-layout.js` loaded for chrome (sticky header IO sentinel, scroll-spy TOC) and for shells (collapse toggle). Pure-CSS siblings (grids foundation, kpi, print-hero) don't need it.
- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — every `--vc-*` token comes from here.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop.
- Python 3.12+ for `scripts/amvcp-select.py`.

## Instructions

1. Match the user's request to a row in the routing matrix below.
2. Load the matched sibling SKILL.md (often one row covers it; combine when needed).
3. Follow the sibling's Instructions; come back to this router only to route a second concern.

## Routing matrix

| Request shape | Sibling | Scaffold class |
|---|---|---|
| spatial tokens / `--la-*` aliases / named gaps / reading measure | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `var(--vc-space-N)` / `var(--la-*)` / `ch` |
| content + sidebar (2-1 or 3-1) | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `.la-grid--2-1` / `.la-grid--3-1` |
| row of equal cards aligned via subgrid | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `.la-cardrow` + `.la-card` |
| gallery / tile grid (auto-fill) | [grids+foundation](../amvcp-layout-grids/SKILL.md) | custom `auto-fill` grid |
| long article / report body | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `.la-article` + `.la-article__wide` / `__bleed` |
| mobile collapse breakpoint | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `@media (max-width: 768px)` |
| RTL-correct layout | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `dir="rtl"` on root |
| no-nested-scrollbars rule | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `overflow: visible` / `clip` |
| selection-atoms contract | [grids+foundation](../amvcp-layout-grids/SKILL.md) | `markLayoutAtoms()` |
| IDE / 3-panel tool UI + collapsible sidebar | [shells](../amvcp-layout-shells/SKILL.md) | `.la-ide` + `[data-la-toggle]` |
| at-a-glance KPI / metric strip | [kpi](../amvcp-layout-kpi/SKILL.md) | `.la-kpi-row` |
| metrics dashboard (12-col placement) | [kpi](../amvcp-layout-kpi/SKILL.md) | `.la-dashboard` + `data-span` |
| persistent page header (opaque) | [chrome](../amvcp-layout-chrome/SKILL.md) | `.la-header` |
| persistent page header (glass) | [chrome](../amvcp-layout-chrome/SKILL.md) | `.la-header.--glass` |
| sticky controls bar above a section | [chrome](../amvcp-layout-chrome/SKILL.md) | custom sticky toolbar |
| jump-to-section nav (auto-built or static) | [chrome](../amvcp-layout-chrome/SKILL.md) | `.la-toc` (4 variants) |
| section header with `01` badge + meta chip | [chrome](../amvcp-layout-chrome/SKILL.md) | `.la-sec-head` |
| fluid clamp() heading | [chrome](../amvcp-layout-chrome/SKILL.md) | `clamp(MIN, IDEAL, MAX)` |
| output printed / PDF'd | [print-hero](../amvcp-layout-print-hero/SKILL.md) | `@page` + `.la-cover` + `.la-break-*` + `.no-print` |
| device screenshot frame | [print-hero](../amvcp-layout-print-hero/SKILL.md) | `.la-device` (set `--dev-*`) |
| decorative hero band | [print-hero](../amvcp-layout-print-hero/SKILL.md) | `.la-hero` + `data-ghost` |
| two-paper rotated comparison | [print-hero](../amvcp-layout-print-hero/SKILL.md) | custom rotated cards |

## Output

The output is owned by the sibling skill. This router emits nothing.

## Error Handling

| Symptom | Fix |
|---|---|
| Don't know which sibling owns my need | Re-read the routing matrix; default to [grids+foundation](../amvcp-layout-grids/SKILL.md) when uncertain (it hosts the spatial token foundation every other sibling consumes). |
| Need spans multiple siblings | Compose — load grids+foundation first (it's the foundation), then add the siblings you need (e.g. shells + chrome + kpi for an IDE-style admin dashboard). |
| Page needs print AND chrome | Load both — chrome's sticky header gets hidden by print-hero's `@media print` reset via `.no-print`. |

## Examples

```text
User: "I want a content+sidebar article page with a sticky TOC and a sticky page header."
Route:
  - grids+foundation  → .la-grid--2-1 wrapping .la-article + sidebar
  - chrome            → .la-header (sticky) + .la-toc (sticky-sidebar variant)
```

```text
User: "I want an admin dashboard with KPI strip, charts, and a left navigation."
Route:
  - shells            → .la-ide (collapsible left navigation)
  - kpi               → .la-dashboard + .la-kpi-row inside the main panel
  - chrome            → optional .la-header on top
```

```text
User: "I want a printable invoice with token tints preserved."
Route:
  - print-hero        → A4 page rules + print reset + .la-cover (page 1)
  - grids+foundation  → .la-article for the line-items body
  - kpi               → .la-kpi-row for totals at the bottom
```

## Modes

Per-sibling: see Resources. The router itself is mode-agnostic.

## Composability

The 5 layout siblings compose freely with each other and with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). The grids+foundation sibling is mandatory whenever you use any other sibling — it hosts the spatial-token foundation every preset consumes.

## Resources

The 5 layout siblings:

- [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) — foundation: spatial token ladder, --la-* aliases, named gaps, reading measure, every grid preset (2-1, 3-1, subgrid cardrow, auto-fill, article 3-col + wide/bleed), mobile breakpoint, RTL rule, no-nested-scrollbars contract, selection-atoms contract (16 refs).
- [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) — application-shell layout: the IDE 3-panel shell (sidebar + main + inspector) + collapse toggle (1 ref).
- [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) — KPI rows, stat bands, metric strips, and the 12-column dashboard grid that hosts them (2 refs).
- [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) — persistent page chrome: sticky header (opaque + glass), sticky toolbar, scroll-spy + sticky-sidebar + right-margin + prefilled TOC variants, fluid clamp() headings, section-numbered headers (10 refs).
- [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md) — A4 print rules + cover + page breaks + print-color-adjust + decorative hero with radial glows + device mockup frames + rotated comparison hero (6 refs).
