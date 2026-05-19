---
name: amvcp-layout-shells
description: "Application-shell layouts for visual-communicator pages — IDE 3-panel shell (sidebar + main + inspector + collapse toggle), sidebar shell, top-nav shell, split-pane shell. Use when the user asks for an IDE-style page, app shell, sidebar layout, collapsible panel, 3-panel tool UI, or split-pane workspace. Trigger with 'IDE shell', '3-panel layout', 'sidebar shell', 'app shell', 'collapsible sidebar', 'split-pane', 'tool UI', 'inspector panel'."
license: MIT
compatibility: "Browser (CSS Grid, dvh units, position:sticky). Requires scripts/amvcp-layout.css for grid presets and scripts/amvcp-layout.js for collapse-toggle wiring. Themes off the DESIGN.md engine."
metadata:
  author: Emasoft
---

# Layout Shells

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling layout skills:** [amvcp-layout](../amvcp-layout/SKILL.md) (router) · [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) · [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) · [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) · [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) · [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md).

## Overview

Application-shell layouts: persistent page chrome around a flexible workspace. Covers the IDE 3-panel shell (left sidebar + centre main + right inspector + collapse toggle) and its variants. Every shell is a CSS-Grid scaffold with a documented `data-la-*` DOM attribute for runtime toggles; `amvcp-layout.js` wires the toggle behaviour. Use this skill when the page needs persistent navigation chrome rather than a flowing document body.

## Prerequisites

- `scripts/amvcp-layout.css` linked (shell grid presets ship here).
- `scripts/amvcp-layout.js` loaded (collapse toggles, sidebar persistence).
- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — supplies every `--vc-*` token. Shells consume tokens, never define them.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop.
- Python 3.12+ for `scripts/amvcp-select.py`.

## When to choose this category

| Request shape | Ref | Scaffold class |
|---|---|---|
| IDE / 3-panel tool UI with collapsible sidebar | ref 08 | `.la-ide` + `[data-la-toggle]` |

Each ref linked in the Resources section below with its full TOC embedded.

## Authoring rules (HARD invariants)

- **Logical properties only.** Every directional declaration is logical (`margin-inline`, `inset-block-start`, `inline-size`). `dir="rtl"` mirrors the shell with zero extra CSS. See sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) for the cross-cutting RTL contract.
- **No nested scrollbars.** Shell panels do NOT introduce inner scrollbars. Wide content widens the document; the centre panel can grow vertically and the page scrolls as one unit. See sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) for the `.la-article__wide` / `__bleed` escape hatches.
- **`min-width: 0` on every shell grid child.** Without this, wide content (table, code block) inside a shell panel forces the WHOLE GRID past the viewport.
- **Selection contract.** Every shell-shaped element is a selectable atom via `markLayoutAtoms()`. The 3-segment decision-mini pill (`✘` ﹅ `✔︎`) attaches to each. See sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) ref 33.

## Instructions

1. Look up the request shape in the table above; open the cited ref.
2. Paste the scaffold from the ref (each ref includes a complete `<html>` + `<style>` snippet plus the `data-la-*` toggle wiring).
3. Set `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
4. Verify with the visual-verification section of the ref — every ref ends with a `Visual verification` section pointing at `skills/amvcp-self-debug-rules/SKILL.md`.

Copy this checklist and track your progress:

- [ ] Chose the right shell preset for the user's request
- [ ] Pasted the scaffold + linked `amvcp-layout.css` + `amvcp-layout.js`
- [ ] Stamped `data-ve-id` on every region
- [ ] Verified collapse toggle works (sidebar opens AND closes)
- [ ] Verified BOTH light and dark themes (per `amvcp-self-debug-rules` R10)
- [ ] No inner scrollbars introduced

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the shell preset, the engine `<script>` + DESIGN.md block, and `amvcp-layout.js` for the collapse toggle. Every region carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

| Symptom | Fix |
|---|---|
| Sidebar won't collapse | `amvcp-layout.js` not loaded — add the script tag. |
| Wide content forces the whole grid past the viewport | Add `min-width:0` to the shell's grid child (the preset already does this on shipped children — check custom additions). |
| Sticky inspector doesn't stick | Verify the `position: sticky` ancestor isn't `overflow: hidden` / `overflow: clip` (use `overflow: visible` on the grid container). |
| RTL layout broken | A physical property (`margin-left`, `left`, `width`) leaked in — replace with the logical equivalent (`margin-inline-start`, `inset-inline-start`, `inline-size`). |

## Examples

Input: user asks for a VS-Code-style 3-panel page (file tree on the left, editor in the middle, inspector on the right).
Output: a `.la-ide` shell with `data-la-sidebar="open"` on mount and a `[data-la-toggle]` button:

```html
<div class="la-ide" data-la-sidebar="open" data-ve-id="ide">
  <aside data-ve-id="files" data-la-pane="sidebar">
    <button data-la-toggle aria-label="Toggle file tree">≡</button>
    <ul>…</ul>
  </aside>
  <main data-ve-id="editor" data-la-pane="main">…</main>
  <aside data-ve-id="inspector" data-la-pane="inspector">…</aside>
</div>
<script src="amvcp-layout.js"></script>
```

More examples:

- A VS-Code-style editor page: `.la-ide` with file-tree sidebar (collapsible) + main editor canvas + inspector panel for terminal/output.
- An admin dashboard shell: `.la-ide` with navigation sidebar (collapsible) + main report area + right-rail filters.
- A documentation reader: `.la-ide` with TOC sidebar (collapsible on mobile) + main article + right-rail callout panel.

## Modes

This skill supports `data-ve-mode="readonly"` only. Layout shells (the 3-panel IDE scaffold) are page chrome — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Layout shells are composed with content primitives from sibling skills — drop a `amvcp-layout-grids` 12-column dashboard inside the main panel, a `amvcp-layout-chrome` sticky toolbar inside the inspector, or a `amvcp-layout-kpi` KPI row at the top of the main panel. Multiple shell instances on one page are uncommon but allowed.

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes. Exercise the collapse toggle in both directions and confirm the page does not jitter or introduce inner scrollbars.

## Resources

- [08-ide-3-panel](references/08-ide-3-panel.md) — 240px+1fr+minmax 3-panel shell + collapse toggle.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `data-la-sidebar` (DOM attribute) instead of a class? · Visual verification · The collapse animation · Persisting the collapsed state
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
