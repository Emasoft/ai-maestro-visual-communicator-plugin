---
name: amvcp-choice-tables
description: "Render data tables that ask the user a question — radio (single-select) or checkbox (multi-select) controls per row, with a Submit button that returns the selection to the agent. Use when the user wants to pick from a list, choose between options, decide on a strategy, vote on alternatives, or answer a structured question. Trigger: 'let me pick', 'comparison table where I can choose', 'form to select from', 'radio/checkbox list', 'pick a strategy', 'choose between', 'vote on'."
license: MIT
compatibility: "Browser + Python 3.12+ via amvcp-select.py. amvcp-runtime.js injects the radio/checkbox controls + Submit button."
metadata:
  author: Emasoft
---

# Choice Tables (Form Mode)

Tables that ask a question. User picks rows via radio (one) or checkbox (many), hits Submit, and the structured answer returns to the agent — replacing "ask in chat" with a tactile in-page form.

## When this skill loads

Triggers: *"let me pick"*, *"comparison table where I can choose"*, *"form to select from"*, *"radio/checkbox list"*, *"vote on"*, *"pick a strategy"*, *"choose between"*, *"confirm the plan"*. Whenever the agent needs an enumerable answer (framework, file, scope, yes/no/with-changes), prefer a choice table.

Read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` first — it defines the `{kind, count, selections[]}` payload and `amvcp-runtime.js` boilerplate. This skill adds only the form-mode layer.

## Quick decision: form vs passive vs single-row click

| Goal | Mode |
|------|------|
| Ask a question with N enumerated answers | **table-form** — radio/checkbox + Submit |
| Display data the user might drill into | **passive** — `data-ve-id` on rows, single-click selects |
| Pick one row to act on | **passive** — single-click is enough, no Submit |

Form mode is *interrogation*. Passive mode is *display*. Adding a Submit button to a passive table? Switch to form mode.

## How to author

1. **Design**: question = `data-ve-label` on `<table>`; one row per answer; optional last row for free-text "Other".
2. **Set form attrs** on `<table>`: `data-ve-type="table-form"` + `data-ve-mode="single"` (radio) or `"multi"` (checkbox). Add `data-ve-id`.
3. **Run** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. Runtime injects the control column + Submit button in `<tfoot>`.
4. **React** to the `table-form` payload (below) — recap question + chosen labels, then act.

Mode A/B/C examples + the `data-ve-row-text="1"` "Other" row pattern: `./references/table-form-schema.md`.

## Mandatory wiring

The two attributes that flip a passive table into a form:

```html
<table data-ve-id="stack-pick"
       data-ve-type="table-form"
       data-ve-mode="single"
       data-ve-label="Which stack should we use?">
  <thead><tr><th>Stack</th><th>Why</th></tr></thead>
  <tbody>
    <tr data-ve-row-id="opt-react" data-ve-row-label="React + TS"><td>React + TS</td><td>Mature</td></tr>
    <tr data-ve-row-id="opt-svelte" data-ve-row-label="SvelteKit"><td>SvelteKit</td><td>Smaller</td></tr>
  </tbody>
</table>
```

`data-ve-label` on `<table>` IS the question. `data-ve-row-id` + `data-ve-row-label` on each `<tr>` carry the answer. Never author radio/checkbox/Submit by hand — the runtime injects them.

Submit emits `{kind: "element", count: 1, selections[0].type: "table-form"}`. Inside `data`: `question` (mirrors the table's `data-ve-label`), `mode` (`"single"`/`"multi"`), `selected[]` of `{id, label}` per chosen row (+ optional `text` for the free-text row). Recap: *"You answered «question» with **«labels»**. Proceeding."*

## Resources

Plugin-shared (`${CLAUDE_PLUGIN_ROOT}/references/`):

- **interactive-selection-base.md** — wire format, runtime boilerplate
- **css-patterns.md** — sticky `<thead>`, alternating rows, status indicators
- **styling-guide.md** — palette, typography
- **diagram-types.md** — Data Tables / Comparisons section
- **anti-patterns.md** — Slop Test

Skill-local: **`./references/table-form-schema.md`** — Mode A/B/C, free-text row, payload spec.

## Anti-patterns

- **Single-select with >7 options** — radio walls overwhelm. Use a multi-step flow (filter → narrow → pick) or a search field.
- **Forgetting `data-ve-type="table-form"`** — runtime treats rows as plain `data-ve-id` clicks; no Submit injected; form degrades.
- **Hand-authoring radio/checkbox/Submit in the HTML** — collides with the runtime's injected controls. Duplicate columns, dead Submit. Let the runtime do it.
- **Emoji status indicators in cells** — inconsistent across platforms and screen readers. Use styled `<span>` chips; see `css-patterns.md`.
