---
name: amvcp-form-inputs
description: "Structured-response widgets for conversational agent reports — radio, multi-select, numeric, date, color, rank-list, file/tag/slider/toggle. Persists to localStorage, DESIGN.md tokens. Use when an agent's question has a finite structured answer instead of free-text prose. Trigger with 'multiple choice', 'radio buttons', 'checkbox list', 'date picker', 'color picker', 'rank list', 'rating widget', 'tier list', 'tag input', 'structured response', 'form input', 'survey question'."
---

# Form-input widgets

## Overview

A dependency-free runtime module that ships nineteen structured-response
input widgets for conversational agent reports. The agent renders a
question; the user answers via a typed widget (radio, checkbox,
number+unit, date, color, slider, toggle, rating, card-picker,
tag-input, text, textarea, URL, file/folder tree, password, currency,
gallery, tier-list, rank) instead of typing prose. The result lands
in a `ve-form-change` event with a stable payload the runtime threads
into the comment-turn record.

## Prerequisites

- `scripts/amvcp-runtime.js` loaded (provides the selection model and `data-ve-form` discovery).
- `scripts/amvcp-form-inputs.js` loaded (the widget implementations).
- DESIGN.md tokens available — `--vc-color-*`, `--vc-radius-*`, `--vc-space-*` from `amvcp-designmd.js`.
- The drag widgets (`ve-rank-list`, `ve-tier-list`) drive reordering with the Pointer Events API, so drag-to-reorder works on **mouse, touch, and pen** alike — one code path, full touch parity on phones and tablets. A ~6px move threshold keeps a tap distinct from a drag (a tap still selects the widget for commenting).

## Instructions

1. Pick the widget — match the answer shape to the matrix in "When to use this skill" below.
2. Emit the widget HTML with a stable `data-ve-id` and the widget's required `data-ve-form-*` attributes.
3. Load `amvcp-runtime.js` + `amvcp-form-inputs.js` on the page.
4. Subscribe to `ve-form-change` (bubbles on the widget element) for live state, or read `localStorage[data-ve-id]` for the persisted answer.
5. Verify per the standard self-debug loop — both themes, no nested scrollbars, atom-contract stamps present.

## When to use this skill

Reach for a form-input widget whenever the agent's question has a
**finite, structured answer**:

| Question shape                                    | Widget            |
| ------------------------------------------------- | ----------------- |
| "Which one of these N choices?"                   | `ve-quiz-radio`   |
| "Which of these (zero or more) apply?"            | `ve-quiz-multi`   |
| "How many [units of X]?"                          | `ve-numeric-input`|
| "By what date should this ship?"                  | `ve-date-input`   |
| "Pick a brand colour."                            | `ve-color-input`  |
| "Tune a value on a 0–N scale."                    | `ve-slider`       |
| "On / off?"                                       | `ve-toggle`       |
| "Rate this 1–5."                                  | `ve-rating`       |
| "Pick one of these rich proposals."               | `ve-card-picker`  |
| "Apply these tags."                               | `ve-tag-input`    |
| "Type a short string (with regex validation)."    | `ve-text-input`   |
| "Type a longer note."                             | `ve-text-area`    |
| "Paste a URL (with preview)."                     | `ve-url-input`    |
| "Pick a file from this project tree."             | `ve-tree-picker`  |
| "Set a password (with strength check)."           | `ve-password-input` |
| "Enter a monetary amount + currency."             | `ve-currency-input` |
| "Pick an image / art-style preset from a gallery."| `ve-gallery-picker` |
| "Rank these into tiers (S/A/B/C/D)."              | `ve-tier-list`    |
| "Order these by priority."                        | `ve-rank-list`    |

For anything **open-ended** (write a paragraph, paste a snippet,
attach an image), use the comment-handle / textarea path that the
runtime already provides. Form-inputs and comments compose: a
widget answers the structured part, an optional comment alongside
captures the rationale.

## Quick start

```html
<!-- amvcp-form-inputs.js self-injects its own <style>; the only external
     dependency is the DESIGN.md token engine for theming (optional —
     every widget has baked --vc-* fallbacks). -->
<script src="amvcp-designmd.js"></script>
<script src="amvcp-form-inputs.js"></script>

<!-- Pick the rollout strategy -->
<div class="ve-quiz-radio" data-ve-id="quiz-radio:rollout">
  <script type="application/json">
    {
      "label": "Pick the rollout strategy:",
      "options": [
        { "value": "canary",       "label": "Canary (5 → 50 → 100%)" },
        { "value": "blue-green",   "label": "Blue/green (full switch)" },
        { "value": "feature-flag", "label": "Feature flag (off → on)" }
      ],
      "default": "canary"
    }
  </script>
</div>
```

The module auto-boots on `DOMContentLoaded` and injects its own CSS.
For deterministic tests, set `window.__vcFormInputsManualInit = true`
BEFORE loading the script, then call
`window.amvcpFormInputs.injectStyles(document)` +
`window.amvcpFormInputs.init(document)` yourself.

## The nineteen widgets

The HTML schema + `ve-form-change` payload for each widget lives in
[references/widget-reference.md](references/widget-reference.md) — pick the
widget from the matrix above, then copy its schema. Complete TOC:

- [The nineteen widgets — HTML schemas + emit payloads](references/widget-reference.md)
  - The nineteen widgets — HTML schemas + emit payloads
    - `ve-quiz-radio` — single-select
    - `ve-quiz-multi` — multi-select
    - `ve-numeric-input` — number + unit dropdown
    - `ve-date-input` — native date picker
    - `ve-color-input` — native color picker + hex readout
    - `ve-slider` — themed range slider with optional ticks
    - `ve-toggle` — themed boolean switch
    - `ve-rating` — 1-N star (or dot) rating
    - `ve-card-picker` — rich single-select cards
    - `ve-tag-input` — typed tags with chip display + suggestions
    - `ve-text-input` — single-line text with optional pattern validation
    - `ve-text-area` — multi-line with character counter
    - `ve-url-input` — URL with live validation and preview link
    - `ve-tree-picker` — hierarchical single-select
    - `ve-password-input` — masked text with strength meter
    - `ve-currency-input` — monetary amount + currency switcher
    - `ve-gallery-picker` — single-select from N image cards
    - `ve-tier-list` — drag items into S/A/B/C/D tier zones
    - `ve-rank-list` — drag-to-reorder

## Event handling

Listen for changes on `document`:

```js
document.addEventListener('ve-form-change', function (ev) {
  // ev.detail = { kind, id, value }
  console.log('answer:', ev.detail);
});
```

The runtime's comment-turn writer already subscribes — every
`ve-form-change` becomes a turn entry with the same `id` as the
widget's `data-ve-id`, so the agent's next round can read the
structured answer.

## Persistence

Every widget writes to `localStorage` under
`amvcp-form-input:<data-ve-id>`. On boot, the saved value overrides
the JSON `default` so a refresh keeps the answer. Safari private
mode (which throws on `setItem`) is the documented graceful-
degradation exception — the widget still works in-memory, it just
doesn't survive a refresh.

## Fail-fast contract

| Failure                                | Visible effect                  |
| -------------------------------------- | ------------------------------- |
| Missing `data-ve-id`                   | red `[form-input error]` box    |
| Malformed `<script type="application/json">` | red box w/ JSON parser msg |
| `ve-quiz-radio` with < 2 options       | red box                          |
| `ve-rank-list` without `<ol>`/`<ul>`   | red box                          |

A red box replaces the widget body in-place; the rest of the page
remains usable. This matches the diagram skill's failure mode.

## Theming

Every visual reads `--vc-*` tokens via `var(--vc-*, fallback)`. A
DESIGN.md theme swap re-themes the card surfaces, borders, radio /
checkbox accent color (via `accent-color`), and hex readout
automatically — no JS re-render needed. Both light and dark themes
correct by construction.

## Selection-model integration

Every widget root carries `data-ve-id` and `data-ve-type`. The
runtime's universal selection model wires hover / focus-visible /
click-to-select for free. A `.ve-comment-handle` appears at the left
edge when the user selects the widget, opening a free-text comment
modal alongside the structured answer.

## No nested scrollbars

Every widget is a single-row control (radio / multi options flow
vertically inside their card, but the cards themselves don't scroll).
The rank list naturally extends the page if it grows tall — the
document owns the only scrollbar.

## Output

Each widget emits a `ve-form-change` CustomEvent (bubbles up the DOM) with `event.detail = { kind, id, value, timestamp }`:

- `kind`: widget type (`quiz-radio`, `quiz-multi`, `numeric-input`, etc.).
- `id`: the widget's `data-ve-id`.
- `value`: the current answer (type depends on widget — string, array, number, etc.).
- `timestamp`: epoch-ms when the change fired.

The widget ALSO writes `value` to `localStorage["amvcp-form-input:" + data-ve-id]` so a page refresh restores the answer. Subscribers reading the persisted value MUST `JSON.parse` it.

## Error Handling

| Symptom | Cause | Fix |
|---|---|---|
| Widget renders blank | Missing or malformed inner `<script type="application/json">` model | Check console — runtime fail-fasts with a clear `[form-input error]` box in place of the widget |
| `ve-form-change` never fires | Subscriber attached to wrong DOM root | Event bubbles — attach to `document` or an ancestor of the widget |
| LocalStorage not restoring | Widget missing `data-ve-id` (no persistence key) | Add a stable `data-ve-id` attribute |
| Drag-reorder fires on a tap, not just a drag | A tap below the ~6px threshold is treated as a click (selects the widget), not a reorder | Working as intended — move the pointer past ~6px to start a drag; a tap selects the widget for commenting. `ve-rank-list` / `ve-tier-list` use Pointer Events, so reordering works on mouse, touch, and pen |
| Page won't scroll while touching a rank/tier item | `touch-action:none` is set on the draggable items so a touch-drag reorders instead of scrolling | Expected — it is scoped to the items only; scroll by touching the page outside the draggable items |
| Colors illegible on dark theme | Single-theme palette in author CSS | Use only `--vc-*` tokens — never hardcoded hex |

## Examples

**Example 1 — radio (single-select)**

```html
<div class="ve-quiz-radio" data-ve-id="lang-choice">
  <script type="application/json">
    {
      "label": "Pick a language:",
      "options": [
        { "value": "python",     "label": "Python" },
        { "value": "javascript", "label": "JavaScript" },
        { "value": "rust",       "label": "Rust" },
        { "value": "go",         "label": "Go" }
      ]
    }
  </script>
</div>
<script>
document.addEventListener('ve-form-change', (e) => {
  if (e.detail.id === 'lang-choice') console.log('picked:', e.detail.value);
});
</script>
```

**Example 2 — numeric with unit dropdown**

```html
<div class="ve-numeric-input" data-ve-id="memory-budget">
  <script type="application/json">
    {
      "label": "Memory budget:",
      "value": 4,
      "unit":  "GB",
      "units": ["MB", "GB", "TB"]
    }
  </script>
</div>
```

**Example 3 — drag-to-reorder**

```html
<div class="ve-rank-list" data-ve-id="priority-rank">
  <p class="ve-quiz-label">Drag to rank:</p>
  <ol>
    <li data-ve-rank-key="bugs">Bug fixes</li>
    <li data-ve-rank-key="features">New features</li>
    <li data-ve-rank-key="refactor">Refactor</li>
    <li data-ve-rank-key="docs">Docs</li>
  </ol>
</div>
```

## Resources

The 19 widget schemas live in
[references/widget-reference.md](references/widget-reference.md) (TOC under
"The nineteen widgets" above); the test descriptions live in
[references/test-cases.md](references/test-cases.md). For deeper integration
patterns see these sibling skills (complete TOC embedded after each):

- [amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) — pairing a form widget with a free-text comment thread.
  - Modal-Comment Agent Reports (v2/v3)
    - Overview
    - Prerequisites
    - Instructions
    - Output
    - Error Handling
    - Examples
    - Modes
    - Composability
    - Resources
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — visual verification loop, R29 (selection-overrides-tokens), R31 (responsive).
  - Self-debug rules — visual-communicator
    - Overview
    - Prerequisites
    - Instructions
    - How to debug
    - Rules index
    - Output
    - Error Handling
    - Examples
    - Resources
    - Modes
    - Composability
    - See also
- [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) — the --vc-* token vocabulary widgets theme off.
  - Design Tokens — Router
    - Overview
    - Prerequisites
    - Instructions
    - Output
    - Error Handling
    - Examples
    - When to choose this category
    - Modes
    - Composability
    - Resources

## Reference test cases

The per-test descriptions for `tests/scripts/test-form-inputs.js`
(all 23 cases) live in
[references/test-cases.md](references/test-cases.md). Complete TOC:

- [Reference test cases](references/test-cases.md)
  - Reference test cases

The fixture is `tests/fixtures/form-inputs-fixture.html` (one of
each widget kind).

## Modes

Each widget supports the modes appropriate to its content type. **Radio-style** (`ve-quiz-radio`, `ve-card-picker`, `ve-gallery-picker`) → `data-ve-mode="single"` (default for these widgets). **Checkbox-style** (`ve-quiz-multi`, `ve-tag-input`, `ve-tier-list`, `ve-rank-list`) → `data-ve-mode="multi"` (default for these widgets). **Free-form input** (`ve-numeric-input`, `ve-date-input`, `ve-color-input`, `ve-slider`, `ve-toggle`, `ve-rating`, `ve-text-input`, `ve-text-area`, `ve-url-input`, `ve-password-input`, `ve-currency-input`, `ve-tree-picker`) → not a decision-pill atom (R20-R23 don't apply; the widget's own value IS the answer). Optional cap on a multi-select widget: set `data-ve-mode="max-N"` on the widget host (R21).

## Composability

Composes with every other amvcp-* skill on the same page (R22). Each widget has its own root class (`.ve-quiz-radio`, `.ve-card-picker`, etc.) and `data-ve-id` namespace, so multiple widgets and multiple skills coexist without interference. The only exclusive skill is the overlay-runtime (R24).
