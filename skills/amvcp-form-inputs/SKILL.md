---
name: amvcp-form-inputs
description: |
  Use this skill when an agent report needs a STRUCTURED response from
  the user that is not free-text prose. Six widgets ship:
  ve-quiz-radio (single-select from N options),
  ve-quiz-multi (multi-select checkbox group),
  ve-numeric-input (number + unit dropdown),
  ve-date-input (native date picker),
  ve-color-input (native color picker + hex readout),
  ve-rank-list (drag-to-reorder list).
  Every widget emits a ve-form-change event with {kind, id, value},
  persists to localStorage so a refresh keeps the answer, themes via
  the DESIGN.md --vc-* tokens for light + dark, and fails fast on
  malformed JSON or a missing data-ve-id. The runtime's universal
  selection model wires the comment-handle so the user can ALSO add
  a free-text comment alongside the structured answer.
---

# Form-input widgets

A dependency-free runtime module that ships six structured-response
input widgets for conversational agent reports. The agent renders a
question; the user answers via a typed widget (radio, checkbox,
number+unit, date, color, rank) instead of typing prose. The result
lands in a `ve-form-change` event with a stable payload the runtime
threads into the comment-turn record.

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
| "Order these by priority."                        | `ve-rank-list`    |

For anything **open-ended** (write a paragraph, paste a snippet,
attach an image), use the comment-handle / textarea path that the
runtime already provides. Form-inputs and comments compose: a
widget answers the structured part, an optional comment alongside
captures the rationale.

## Quick start

```html
<link rel="stylesheet" href="amvcp-tokens.css">
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

## The six widgets

### `ve-quiz-radio` — single-select

```html
<div class="ve-quiz-radio" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "options": [
        { "value": "<v>", "label": "<text>" },
        …
      ],
      "default": "<v>"        // optional — the radio that starts checked
    }
  </script>
</div>
```

Emits `{ kind: "quiz-radio", id, value: "<v>" }`.

### `ve-quiz-multi` — multi-select

Same shape as `ve-quiz-radio` but `default` is an array (or omitted),
and the event payload is the FULL array of currently-checked values
(not just the last toggled one).

Emits `{ kind: "quiz-multi", id, value: ["<v1>", "<v2>", …] }`.

### `ve-numeric-input` — number + unit dropdown

```html
<div class="ve-numeric-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "value": 300,            // initial number
      "unit":  "s",            // initial unit (must be in units[])
      "units": ["s", "m", "h"],// dropdown options
      "min":   0,              // optional clamp
      "max":   3600,           // optional clamp
      "step":  1               // optional step
    }
  </script>
</div>
```

Emits `{ kind: "numeric-input", id, value: { value: <n>, unit: "<u>" } }`.

### `ve-date-input` — native date picker

```html
<div class="ve-date-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "value": "2026-06-01",    // ISO-8601 yyyy-mm-dd
      "min":   "2026-01-01",    // optional
      "max":   "2026-12-31"     // optional
    }
  </script>
</div>
```

Emits `{ kind: "date-input", id, value: "<yyyy-mm-dd>" }`.

### `ve-color-input` — native color picker + hex readout

```html
<div class="ve-color-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "value": "#b8861f"
    }
  </script>
</div>
```

Emits `{ kind: "color-input", id, value: "#rrggbb" }`. The hex text
next to the swatch updates live during drag.

### `ve-rank-list` — drag-to-reorder

```html
<div class="ve-rank-list" data-ve-id="<id>">
  <p class="ve-quiz-label">Drag to rank:</p>
  <ol>
    <li data-ve-rank-key="logs">Improve logging</li>
    <li data-ve-rank-key="metrics">Add metrics</li>
    <li data-ve-rank-key="tests">Backfill tests</li>
  </ol>
</div>
```

Emits `{ kind: "rank-list", id, value: ["<k1>", "<k2>", …] }` after
every drop. The saved order survives reloads (the runtime re-orders
the `<li>` children on init from the saved array).

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

## Reference test cases

See `tests/scripts/test-form-inputs.js`:

- `form_inputs_all_init` — every kind mounts (radio, multi, numeric,
  date, color, rank) with correct `data-ve-type`.
- `form_inputs_radio_change` — click fires `ve-form-change`, persists
  to LS.
- `form_inputs_multi_change` — checkbox toggles emit ARRAY payloads.
- `form_inputs_numeric_change` — value + unit changes emit
  `{value, unit}`.
- `form_inputs_date_color_change` — native inputs fire; hex readout
  updates live with color.
- `form_inputs_rank_drag` — drag last → first emits the new order.
- `form_inputs_persistence` — radio default is overridden by
  LS-saved value after reload.
- `form_inputs_theme_tokens` — light → dark flips card / border /
  hex color via `--vc-*`.
- `form_inputs_fail_fast_no_id` — missing `data-ve-id` paints
  `[form-input error]` and renders nothing.

The fixture is `tests/fixtures/form-inputs-fixture.html` (one of
each widget kind).
