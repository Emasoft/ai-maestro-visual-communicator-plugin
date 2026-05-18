---
name: amvcp-regex-vis
description: "Render an interactive JS-regex visualizer + editor (vendored regex-vis): tree of nodes, inline edit, shift+click extend, Cmd-Z/Cmd-Shift-Z undo/redo, live result. Use when the user asks to visualize, explain, debug, or interactively edit a regex. Trigger with 'visualize this regex', 'regex editor', 'regex tree', 'explain this regex', 'edit this pattern', 'regex visualizer'."
license: MIT
metadata:
  author: Emasoft
---

# Regex Visualizer + Editor

## Overview

Loads when the user wants to visualize, explain, debug, or edit a JS regex. Sub-skill of `amvcp-visual-communication`: vendored regex-vis renders the pattern as a tree with an Edit panel. The user mutates inline; the agent receives `original`, `edited`, and the full `AST.Regex`.

## Prerequisites

- Browser (Chromium preferred for `--app=URL`).
- Python 3.12+ runner (`scripts/amvcp-select.py`).
- `amvcp-runtime.js` injected — auto-detects `.ve-regex` and lazy-loads `amvcp-regex.umd.js` + `.css` (~150 KB gz, only when present).
- `:root { --ve-accent: <colour>; }` set per the base contract.
- JS regex only (NOT PCRE, RE2, Ruby, .NET).

## Instructions

1. Wrap each pattern in `<div class="ve-regex" data-ve-id="rx1" data-regex="...">` (optional `data-flags="gi"`). Multiple blocks per page is fine — each gets its own Jotai store.
2. Open with `scripts/amvcp-select.py <file.html>` — never `open` / `xdg-open`. The runner serves on a free localhost port and launches Chromium in `--app=URL` mode.
3. The user explores the graph, shift+clicks to extend selection, edits via the Edit panel, undoes with Cmd-Z, redoes with Cmd-Shift-Z (per-mount).
4. On Submit, read the `kind:"regex-edit"` entry from the multi-select payload; subsequent edits on the same wrapper REPLACE the prior entry (via `data-ve-regex-entry-id`).
5. Compare `original` vs `edited`; walk `ast` for structured diffs; ask the user what to do next.

## Output

Per-edit entry pushed into `selections[]`:

```json
{"kind":"regex-edit","regexId":"ve-regex-8ksd42",
 "original":"^([a-z]+)@([a-z]+)\\.com$",
 "edited":"^([a-z]+)@([a-z]+)\\.(com|org|net)$",
 "ast":{"type":"regex","body":[...],"flags":[],"literal":true}}
```

A click on the wrapper background still fires the Phase 1 element-toggle; Edit-tab clicks stay scoped inside the React mount.

## Error Handling

- **Bundle fails to load** → wrapper falls back to plain text; check console for `[amvcp-runtime] regex bundle disabled: ...`.
- **Multi-mount module-level state** → never regress to module-level `undoStack` arrays in vendor folder; per-mount Jotai atoms are mandatory.
- **Cmd-Shift-Z silently no-ops** → `KeyboardEvent.key` shifts to `'Z'` under Shift; compare case-insensitively or use `event.code === 'KeyZ'`.
- **DOM mutation breaking state** → never `querySelector.setAttribute` on the rendered SVG; use the regex-vis API only.

## Examples

**Input:** A numeric regex pattern (see code block) lets the user widen it to also match negatives.

```html
<div class="ve-regex" data-ve-id="rx-num" data-regex="\d+(\.\d+)?"></div>
```

**Output:** User opens Edit, prepends `-?`, presses Submit. Agent receives `kind:"regex-edit"` with the edited pattern and full AST.

## Modes

This skill supports `data-ve-mode="readonly"` only. The regex visualizer is an interactive editor — nodes are selectable for comment, but the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. The visualizer's OWN edit UI (shift+click extend, Cmd-Z undo, etc.) is not part of the decision-pill system.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple regex-vis instances coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — wire format + boilerplate
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [runtime-bug-patterns.md](../../references/runtime-bug-patterns.md) — bug catalogue
  - v2 modal bugs
  - ve-regex bugs
  - Runtime-injected UI must inherit host palette
  - Common shape & Running tests
- [regex-vis-cookbook.md](./references/regex-vis-cookbook.md) — payload schema
  > What `.ve-regex` does · Auto-stamped attributes · Wire-format payload — `kind:"regex-edit"` · Authoring guidance · Failure handling
  - What `.ve-regex` does
  - Auto-stamped attributes
  - Wire-format payload — `kind:"regex-edit"`
  - Authoring guidance
  - Failure handling
