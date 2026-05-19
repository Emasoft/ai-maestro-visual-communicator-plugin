---
name: amvcp-diag-ascii
description: "ASCII / Unicode plaintext diagrams — process flow, state machine, tree/hierarchy. No-JS, copy-pasteable themed `<pre>` blocks that page-expand. Build-time alignment validator. Use when the output must survive without JS, paste into a terminal or comment, or be a 3-second inline sketch. Trigger with 'ASCII diagram', 'plaintext flow', 'terminal diagram', 'ASCII state machine', 'ASCII tree', 'monospace diagram'."
license: MIT
compatibility: "Any monospace renderer — terminal, browser `<pre>`, code comments. No JS dependency. Build-time alignment validator (NEVER shipped to the page)."
metadata:
  author: Emasoft
---

# Diagram — ASCII / Plaintext

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling diagram skills:** [amvcp-diagram](../amvcp-diagram/SKILL.md) (router) · [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) · [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) · [amvcp-diag-time](../amvcp-diag-time/SKILL.md) · [amvcp-diag-network](../amvcp-diag-network/SKILL.md) · [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md).

## Overview

Pure ASCII / Unicode plaintext diagrams. Renders as a themed `<pre>` block that page-expands (wide ASCII extends the document, never an inner `overflow:scroll` box). Three archetypes: general-purpose flow, state-machine, tree/hierarchy. Loads on requests where JavaScript is unavailable (terminals, plaintext channels, code comments) or where a 3-second inline sketch beats a full SVG scene-graph.

## Prerequisites

- A monospace font (every terminal; browsers default `<pre>` to monospace).
- For browser rendering, the `ve-ascii-diagram` CSS class (the diagram runtime injects it).
- No JavaScript required at runtime.

## Instructions

1. **Pick a style.** General-purpose flow → see [ascii-diagrams](references/ascii-diagrams.md) (four sub-styles). State machine → see [ascii-state-machine](references/ascii-state-machine.md). Tree/hierarchy → see [ascii-tree-and-hierarchy](references/ascii-tree-and-hierarchy.md).
2. **Author the block** in `<pre class="ve-ascii-diagram" data-ve-ascii-style="…">`. Use box-drawing characters from the chosen style's glyph vocabulary.
3. **Run the alignment validator** at build time — confirms column alignment under any monospace font. NEVER ship the validator script to the rendered page (build-time only).
4. **Verify page-expansion** — the `<pre>` MUST allow horizontal page scroll, NEVER `overflow-x: auto` on the `<pre>` itself.

Copy this checklist and track your progress:

- [ ] Style chosen (general flow / state / tree)
- [ ] Glyph vocabulary applied consistently
- [ ] Alignment validator passes (build-time)
- [ ] Page-expansion confirmed (no inner scrollbars per [`no-nested-scrollbars`](../amvcp-self-debug-rules/SKILL.md))
- [ ] Light + dark theme verified (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))

## Output

A themed `<pre class="ve-ascii-diagram">` block. Page-expands horizontally (the document scrolls, never the block). Selectable when `data-ve-ascii-selectable="1"` is set. Theme tokens read from DESIGN.md `--vc-*` palette; the block is correct in both light and dark themes for free.

## Error Handling

| Symptom | Fix |
|---|---|
| Columns misaligned in a terminal | Re-run the alignment validator — double-width characters (CJK, emoji) break monospace columns. See [ascii-diagrams](references/ascii-diagrams.md). |
| `<pre>` shows an inner horizontal scrollbar | Remove any `overflow-x: auto` rule on the block. Per [`no-nested-scrollbars`](../amvcp-self-debug-rules/SKILL.md) the document MUST scroll, not the `<pre>`. |
| Box-drawing characters render as boxes/tofu | Font lacks Unicode box-drawing glyphs. Switch to ASCII-only style (`+`, `-`, `|`) — see the glyph table in [ascii-diagrams](references/ascii-diagrams.md). |
| State transitions ambiguous | Use the explicit `[event]/[guard]` notation from [ascii-state-machine](references/ascii-state-machine.md); never mix arrow styles. |

## Examples

**Input:** "show me a quick ASCII flow of the request → validate → persist pipeline."

**Output:**

```
+---------+   request   +----------+   valid?   +----------+
|  Client | ----------> | Validate | ---------> | Persist  |
+---------+             +----------+            +----------+
                                |
                                | invalid
                                v
                          +----------+
                          |  Reject  |
                          +----------+
```

See [ascii-diagrams](references/ascii-diagrams.md) for the four sub-styles and the alignment validator workflow.

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme. The themed `<pre>` should be readable in both.

## Modes

This skill supports `data-ve-mode="readonly"` only. ASCII diagrams are explanatory visualizations; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple ASCII blocks coexist. Mix freely with SVG scene-graph diagrams from sibling skills (e.g. ASCII for a quick fallback alongside an SVG architecture canvas).

## Resources

- [ascii-diagrams](references/ascii-diagrams.md) — the four ASCII styles and the build-time alignment validator workflow.
  > When to use ASCII · The authoring surface · The four styles · Alignment validator (build-time, NEVER shipped) · Page-expansion (the hard rule)
- [ascii-state-machine](references/ascii-state-machine.md) — state machines drawn in monospace.
  > When to choose ASCII · Authoring · Glyph vocabulary · Alignment validator (build-time) · State boxes · Transitions · Self-loops · Conditional transitions (guards) · DESIGN.md tokens consumed · Selection atoms · Compactness — when to switch styles · Anti-patterns · Visual verification · Cross-skill seam
- [ascii-tree-and-hierarchy](references/ascii-tree-and-hierarchy.md) — file-system trees, package hierarchies, taxonomies.
  > When to choose ASCII trees · Authoring · Glyph vocabulary · Annotations · Alternative glyph styles · Indentation depth · Folder vs file distinction · Hot files / changed files highlighting · Authoring with the `tree` command · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
