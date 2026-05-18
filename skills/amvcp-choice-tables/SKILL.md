---
name: amvcp-choice-tables
description: "Render data tables that ask the user a question — radio (single) or checkbox (multi) per row, Submit returns selection to the agent. Use when picking from a list, comparing strategies, voting, or answering a structured question. Trigger with 'let me pick', 'comparison table to choose from', 'form to select from', 'radio/checkbox list', 'pick a strategy', 'choose between', 'vote on'."
license: MIT
metadata:
  author: Emasoft
---

# Choice Tables (Form Mode)

## Overview

Loads when the agent needs an enumerable answer as a table-form Q&A. Author a `<table>` whose `data-ve-label` IS the question and whose rows are answers; the runtime injects a radio/checkbox column plus a Submit in `<tfoot>`. The structured answer returns to the agent — replacing "ask in chat" with a tactile in-page form.

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser fallback works).
- Python 3.12+ for `scripts/amvcp-select.py`.
- `amvcp-runtime.js` colocated with the HTML — handles form-mode injection (controls, Submit, Enter-to-submit).

## Instructions

1. Design: put the question on `<table>` as `data-ve-label`; one `<tr>` per answer with `data-ve-row-id` + `data-ve-row-label`; optional last row `data-ve-row-text="1"` for a free-text "Other" `<input>`.
2. Set form attrs on `<table>`: `data-ve-id="..."`, `data-ve-type="table-form"`, `data-ve-mode="single"` (radio) OR `"multi"` (checkbox).
3. Run `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. The runtime injects controls and Submit; never hand-author them.
4. Read JSON from stdout, branch on the `table-form` payload, recap: *"You answered «question» with **«labels»**. Proceeding."*

## Output

```json
{"kind":"submit","count":1,"selections":[{
  "kind":"element","type":"table-form","id":"ve-table-<id>-submit","label":"<first-label>",
  "data":{"tableId":"<id>","question":"<data-ve-label>","mode":"single|multi",
          "selected":[{"id":"<row-id>","label":"<row-label>","text":"<opt>"}],"text":null}}]}
```

## Error Handling

- >7 single-select options: radio walls overwhelm — use a search field or filter→narrow→pick.
- Missing `data-ve-type="table-form"`: rows fall back to plain `data-ve-id` clicks; no Submit injected; form silently degrades to passive single-row click.
- Hand-authoring radio/checkbox/Submit: collides with runtime injection — duplicate columns, dead Submit. Let the runtime own it.
- Emoji status indicators forbidden — inconsistent across platforms and screen readers. Use styled `<span>` chips (see css-patterns).

## Examples

- *"Compare 3 caching strategies, let me pick one."* → Mode B `<table>` with `data-ve-mode="single"`, rows LRU / LFU / TTL plus free-text "Other"; Submit returns one `selected[]` entry.
- *"Which features should ship in v1?"* → Mode C with `data-ve-mode="multi"`, one row per feature plus free-text row; Submit returns every checked row in `selected[]`.

## Modes

This skill supports `data-ve-mode="single"` (radio semantics — exactly one row may be approved at any time; approving another auto-demotes the prior pick) and `data-ve-mode="multi"` (checkbox semantics — unbounded approvals). The default for an undeclared `<table>` is `readonly` — no decision pills (R20/R23 of `amvcp-self-debug-rules`). For "approve up to N" cardinality use `data-ve-mode="max-N"` (R21).

## Composability

Composes with every other amvcp-* skill on the same page (R22). Common composition: choice-table + math + diagram on one report page, where the table rows carry decision pills and the illustrative diagram is readonly. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — payload contract, runtime boilerplate, marking elements
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [css-patterns.md](../../references/css-patterns.md) — sticky `<thead>`, alternating rows, status indicators
  - Theme & Atmosphere
  - Layout & Containers
  - Content Blocks
  - Visual Components
  - Prose Page Elements
- [diagram-types.md](../../references/diagram-types.md) — when a table beats other visuals
  - Diagrams (Mermaid + CSS)
  - Data Visualizations
  - Documentation Layouts
  - Prose Accent Elements
- [table-form-schema.md](./references/table-form-schema.md) — Mode A/B/C, free-text row, payload spec
  > Tables — three modes · Form-mode payload · When to use form mode vs. passive mode
  - Tables — three modes
  - Form-mode payload
  - When to use form mode vs. passive mode
