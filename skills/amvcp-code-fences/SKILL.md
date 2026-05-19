---
name: amvcp-code-fences
description: "Code-as-data and editable-fence surface — distinguishes pre tag as code vs data (CSV/JSON/YAML), the data-ve-no-gutter opt-out, and the contenteditable code-editor family. Use when scaffolding a CSV/JSON data block, a live editor, an opt-out gutter block, or deciding fenced vs free-form. Trigger with 'CSV', 'JSON data', 'YAML data', 'data fence', 'opt-out gutter', 'contenteditable', 'JSON editor', 'live edit code', 'no-gutter'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires the same scripts as amvcp-code-syntax (`amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-code-highlight.js` + `.css`)."
metadata:
  author: Emasoft
---

# Code Fences

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Sibling code skills:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (load FIRST — substrate) · [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md).

## Overview

Fenced-block discipline layer — answers two related questions: (1) "Is
this `<pre>` code or data?" (CSV / JSON / YAML often masquerade as code
but are not), and (2) "Should this `<pre>` keep the runtime's gutter
chrome?" (some blocks — a regex graph, an overlay snippet — must opt
out via `data-ve-no-gutter`). Also owns the contenteditable code-
editor family: a `<pre><code contenteditable>` becomes a live editor
that re-tokenises on every input via a RAF-debounced loop, with caret
position preserved across re-renders via a TreeWalker-based
`getCaretOffset()` / `setCaretOffset()` pair, Enter-intercept to
preserve newline semantics, paste-as-plain to defeat MIME injection,
and (for JSON) live validate + character-position error highlight.

**What this skill owns.** The fenced-vs-free-form decision rule, the
`data-ve-no-gutter` opt-out attribute, the code-as-data discipline
(when CSV / JSON / YAML deserves `language-csv` / `language-json` /
`language-yaml` vs plain), the `<pre><code contenteditable>` pattern,
caret save/restore via TreeWalker, Enter-intercept and paste-as-plain
handlers, the RAF-debounced re-highlight loop, the JSON live-validate
pass with character-position error highlight, and the prompt-template
`{{slot}}` highlighter.

**What this skill does NOT own.** The syntax substrate (→
`amvcp-code-syntax`). Diff blocks and PR / postmortem compositions
(→ `amvcp-code-diff`). Multi-step walkthrough / tabbed / explainer
compositions (→ `amvcp-code-snippets`).

## Prerequisites

- `amvcp-code-syntax` loaded FIRST — the editor still tokenises via
  the same engine, and the data-fence rules still respect the
  integrity probe.
- A modern browser. No npm runtime dependency, no WASM, no build step.

## Instructions

1. **Ask: is this code or data?** A `<pre>` containing CSV rows is data — declare `language-csv`, opt out of the JS tokenizer's source-code rules, and rely on the runtime's gutter for row numbers. Same for `language-yaml` and `language-json` when the block is config or a payload, NOT source. See [csv-and-data-fences](references/csv-and-data-fences.md) for the full decision tree.
  > H3.1 The "is this code or data?" question · H3.2 JSON (data, but typically declared as `language-json`) · H3.3 YAML (data, often declared as `language-yaml`) · H3.4 CSV / TSV · H3.5 TOML / INI · H3.6 Diff data · H3.7 The "is this fence DATA-WITH-PROVENANCE?" check · H3.8 The "is this fence SAMPLE OUTPUT?" check · H3.9 The "raw data dump" fallback · H3.10 The selection model · H3.11 The runtime's class-language separation · H3.12 Author rules · H3.13 No tokens consumed (this reference) · H3.14 Cross-references
2. **Opt out of the gutter** for blocks that must NOT have the per-line gutter — a regex-graph block, an overlay snippet floating on top of a diagram, a fenced ASCII art. Set `data-ve-no-gutter` on the `<pre>` and the runtime's `initCodeGutter` will skip it. See [opting-out-pre](references/opting-out-pre.md).
  > H2.1 The attribute · H2.2 When to opt out · H2.3 What opting out preserves · H2.4 What opting out loses · H2.5 The runtime's check · H2.6 Opt-out and `data-ve-snippet-popup` · H2.7 The opt-out vs the data-block discipline · H2.8 The author's mental model · H2.9 Selection / commenting on opt-out blocks · H2.10 Re-opting-in · H2.11 The opt-out hierarchy · H2.12 No tokens consumed · H2.13 Author rules
3. **Live editor.** `<pre><code contenteditable spellcheck="false">` plus the 4 building blocks: caret save/restore via TreeWalker (`getCaretOffset()` / `setCaretOffset()`), Enter-intercept (insert `\n` instead of `<br>` / `<div>`), paste-as-plain (`clipboardData.getData('text/plain')`), RAF-debounced re-highlight. See [contenteditable-code-editor](references/contenteditable-code-editor.md).
  > F1.1 The pattern · F1.2 Why contenteditable, not textarea · F1.3 The 4 building blocks · F1.4 Intercepting Enter · F1.5 Intercepting paste · F1.6 The slot-finder regex pattern · F1.7 Per-slot validation · F1.8 The 3-sample preview pattern · F1.9 Selection / commenting · F1.10 The localStorage save pattern · F1.11 Tokens consumed · F1.12 When to use · F1.13 Author rules · F1.14 Mined source attribution · Overview
4. **JSON editor.** Compose the live editor with a validate pass: parse on every input, highlight the error character position, expose a Format (Prettify) button and a Copy-as-JSON button. See [json-editor-with-validation](references/json-editor-with-validation.md).
  > F3.1 The pattern · F3.2 The validation pass · F3.3 The error highlight at a character position · F3.4 The Format (Prettify) button · F3.5 The Copy button · F3.6 Schema-aware validation (optional) · F3.7 Integration with the runtime's gutter · F3.8 Selection / commenting · F3.9 Compose with live-diff-sidebar · F3.10 Light + dark verification · F3.11 Tokens consumed · F3.12 Author rules

Copy this checklist and track your progress:

- [ ] Decided code vs data (right `language-*` declared)
- [ ] `data-ve-no-gutter` set on every block that must skip the gutter
- [ ] Live editor uses `contenteditable spellcheck="false"`
- [ ] Caret save/restore via TreeWalker (NOT `selection.getRangeAt(0).startOffset`)
- [ ] Enter and paste intercepted (no `<br>` or `<div>` insertions)
- [ ] RAF-debounced re-highlight (not on-every-keystroke)
- [ ] JSON validate runs on every input + character-position error highlight present
- [ ] Screenshot-tested in BOTH light + dark themes (R41)

## Output

A self-contained HTML page where data fences are declared correctly
(`language-csv`/`-json`/`-yaml`, not source-language), opt-out blocks
skip the gutter cleanly, live editors preserve caret position across
re-renders, and JSON editors flag syntax errors at the offending
character. Themes re-paint on a DESIGN.md token swap.

## Error Handling

| Symptom | Fix |
|---|---|
| CSV block highlighted as code (random tokens) | Declared as `language-py` or similar — switch to `language-csv` (or omit `language-*` for plain) |
| Regex graph block has stray line numbers in gutter | Missing `data-ve-no-gutter` on the `<pre>`; the runtime cannot guess |
| Live editor loses caret on every keystroke | Caret save uses `selection.getRangeAt(0)` instead of TreeWalker; the offset is invalidated when the tokenizer rebuilds the DOM |
| Enter inserts `<br>` or `<div>` | Missing `keydown` interceptor for Enter; insert `\n` via `document.execCommand('insertText', false, '\n')` or modern Range API |
| Paste inserts colored text from another tab | Missing `paste` interceptor; read `clipboardData.getData('text/plain')` and insert as plain |
| Re-highlight thrashes on rapid typing | Missing RAF debounce; rebuild on `requestAnimationFrame` not every `input` event |
| JSON error highlight at wrong character | Parser returned line+column; convert to character offset via cumulative line-length |

## Examples

**Example 1 — CSV data fence**

```html
<pre data-ve-code="auto" data-ve-lang="csv" data-ve-no-gutter><code>
name,email,role
Alice,alice@example.com,admin
Bob,bob@example.com,viewer
</code></pre>
```

The `language-csv` declaration tells the tokenizer to apply CSV-
specific row/column styling; the gutter is suppressed because row
numbers would duplicate the implicit row index.

**Example 2 — live JSON editor**

```html
<pre data-ve-code="auto" data-ve-lang="json"><code contenteditable spellcheck="false">{
  "name": "alice",
  "role": "admin"
}</code></pre>
```

Wire the 4 building blocks per
[contenteditable-code-editor](references/contenteditable-code-editor.md)
plus the validate pass per
[json-editor-with-validation](references/json-editor-with-validation.md).

## Visual verification

Every fence and editor MUST be screenshot-tested in BOTH light AND
dark themes. See
[../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md).
Verify (a) data fences render with the correct language tokens (CSV
columns aligned, JSON keys vs values, YAML keys vs values), (b) opt-
out blocks show NO gutter / line numbers / wrap-marker stripe, (c) the
live editor's caret returns to the same character offset after every
re-highlight, (d) JSON syntax errors highlight the right character.

## Modes

Supports `data-ve-mode="readonly"` for static fences and
`data-ve-mode="edit"` for the contenteditable family. The per-element
3-state decision pill (R20-R23) does NOT apply (fences are data
display, editors are direct user input).

## Composability

Composes with every other amvcp-* skill on the same page (R22).
Multiple fences and editors coexist independently. The only exclusive
skill is the overlay-runtime (R24).

## Resources

### Code-as-data discipline
- [csv-and-data-fences](references/csv-and-data-fences.md) — when a `<pre>` is data (CSV / JSON / YAML) not code, and the right author-side attributes.
  > H3.1 The "is this code or data?" question · H3.2 JSON (data, but typically declared as `language-json`) · H3.3 YAML (data, often declared as `language-yaml`) · H3.4 CSV / TSV · H3.5 TOML / INI · H3.6 Diff data · H3.7 The "is this fence DATA-WITH-PROVENANCE?" check · H3.8 The "is this fence SAMPLE OUTPUT?" check · H3.9 The "raw data dump" fallback · H3.10 The selection model · H3.11 The runtime's class-language separation · H3.12 Author rules · H3.13 No tokens consumed (this reference) · H3.14 Cross-references

### Opt-out attribute
- [opting-out-pre](references/opting-out-pre.md) — `data-ve-no-gutter` (skip `initCodeGutter`), why some `<pre>`s (regex graph, overlay snippets) must opt out.
  > H2.1 The attribute · H2.2 When to opt out · H2.3 What opting out preserves · H2.4 What opting out loses · H2.5 The runtime's check · H2.6 Opt-out and `data-ve-snippet-popup` · H2.7 The opt-out vs the data-block discipline · H2.8 The author's mental model · H2.9 Selection / commenting on opt-out blocks · H2.10 Re-opting-in · H2.11 The opt-out hierarchy · H2.12 No tokens consumed · H2.13 Author rules

### Editable fences (live editors)
- [contenteditable-code-editor](references/contenteditable-code-editor.md) — `getCaretOffset()` / `setCaretOffset()` via TreeWalker, Enter-intercept, paste-as-plain, RAF-debounced re-highlight, prompt-template `{{slot}}` highlighter.
  > F1.1 The pattern · F1.2 Why contenteditable, not textarea · F1.3 The 4 building blocks · F1.4 Intercepting Enter · F1.5 Intercepting paste · F1.6 The slot-finder regex pattern · F1.7 Per-slot validation · F1.8 The 3-sample preview pattern · F1.9 Selection / commenting · F1.10 The localStorage save pattern · F1.11 Tokens consumed · F1.12 When to use · F1.13 Author rules · F1.14 Mined source attribution · Overview
- [json-editor-with-validation](references/json-editor-with-validation.md) — fenced JSON block + live-validate + error highlight + Copy-as-JSON button.
  > F3.1 The pattern · F3.2 The validation pass · F3.3 The error highlight at a character position · F3.4 The Format (Prettify) button · F3.5 The Copy button · F3.6 Schema-aware validation (optional) · F3.7 Integration with the runtime's gutter · F3.8 Selection / commenting · F3.9 Compose with live-diff-sidebar · F3.10 Light + dark verification · F3.11 Tokens consumed · F3.12 Author rules
