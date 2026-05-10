---
name: amvcp-regex-vis
description: "Render an interactive regex visualizer + editor (regex-vis vendored). Visualize a regex pattern as a tree of nodes/edges, edit inline with shift+click extend-select, undo/redo with Cmd-Z / Cmd-Shift-Z, and see the live live result. Use when the user asks to visualize, explain, debug, or interactively edit a regular expression. Trigger: 'visualize this regex', 'regex editor', 'regex tree', 'explain this regex', 'edit this pattern', 'regex visualizer'."
license: MIT
compatibility: "regex-vis vendored bundle auto-loaded by amvcp-runtime.js when .ve-regex is present. Browser + Python 3.12+."
metadata:
  author: Emasoft
---

# Regex Visualizer + Editor

Embed an interactive JS-flavour regex flow-graph + edit panel. The user reads the pattern as a tree, edits inline, and the agent receives original + edited + full AST.

## When this skill loads

Load when the user asks to visualize, explain, debug, or interactively edit a JS regex — phrases: "visualize this regex", "regex editor", "regex tree", "explain this regex", "edit this pattern", "regex visualizer".

Sub-skill of `amvcp-visual-communication`. The base contract `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` governs the wire format, runner, and mandatory page boilerplate (runtime script, `--ve-accent` on `:root`, `data-ve-id` per element). This skill only adds the regex element + payload.

## How to author

1. **Wrap each pattern** in a `<div class="ve-regex">` with `data-regex` (and optional `data-flags`). Multiple blocks per page are fine — each gets its own isolated Jotai store.
2. **Open with the bundled runner** (`scripts/amvcp-select.py`) — never `open` / `xdg-open`. The runtime auto-detects `.ve-regex` and lazy-loads `amvcp-regex.umd.js` + `amvcp-regex.css` (~150 KB gz, only when at least one block exists).
3. **User edits inline** — shift+click extends node selection, Cmd-Z / Cmd-Shift-Z undo/redo (per-mount, scoped to the block's store).
4. **React to the `regex-edit` payload** — compare `original` vs `edited`, walk `ast` for structured diffs, then ask what to do next.

## Mandatory wiring

```html
<div class="ve-regex" data-ve-id="rx1" data-regex="^([a-z]+)@([a-z]+)\.com$"></div>
<div class="ve-regex" data-ve-id="rx2" data-regex="\d{3}-\d{4}" data-flags="gi"></div>
```

`data-regex` is required. `data-flags` is optional (`g`, `i`, `m`, `s`, `u`, `y`). The runtime stamps `data-ve-type="regex"` and `data-ve-label="Regex: <first 60 chars>"` on mount. Background clicks still fire the standard element-toggle; Edit-tab interactions stay scoped inside the React mount.

JS-flavour parser only — do NOT use for PCRE, RE2, Ruby, or .NET regex.

## Selection payload shape

When the regenerated pattern differs from the original, the runtime pushes a `kind:"regex-edit"` entry into the multi-select list. Subsequent edits on the same wrapper REPLACE the prior entry (tracked via `data-ve-regex-entry-id`) so the agent only receives the latest version per block.

Top-level fields: `kind:"regex-edit"`, `regexId`, `original`, `edited`, `ast`. The `ast` is the upstream `AST.Regex` node tree — no re-parsing needed. For the full schema, sub-node selection variants, and mount lifecycle, read `./references/regex-vis-cookbook.md`.

If the bundle fails to load, each wrapper falls back to plain text showing the regex source. Check the JS console for `[amvcp-runtime] regex bundle disabled: …`.

## Resources

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — universal wire format, mandatory boilerplate, runner pitfalls
- `${CLAUDE_PLUGIN_ROOT}/references/runtime-bug-patterns.md` — regex sections (per-mount undo/redo, case-insensitive Z for Cmd-Shift-Z, shift+click extend-select, wide-regex per-graph scroll)
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — palette + typography (bundle ships themed CSS; just set `--ve-accent`)
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — Slop Test
- `./references/regex-vis-cookbook.md` — full payload schema, mount lifecycle, per-instance undo/redo

## Anti-patterns

- Multiple `.ve-regex` mounts sharing a module-level undo stack — fixed by per-Provider Jotai atoms in the bundled runtime; do NOT regress when editing `vendor/regex-vis/`.
- Cmd-Shift-Z handler comparing strict-lowercase `'z'` — `KeyboardEvent.key` is the produced character, so Shift case-shifts to `'Z'`. Use case-insensitive comparison or `event.code === 'KeyZ'`.
- Mutating the rendered SVG tree via `querySelector.setAttribute` — bypasses regex-vis state, AST diverges from DOM. Use the regex-vis API (atoms / Edit panel) only.
