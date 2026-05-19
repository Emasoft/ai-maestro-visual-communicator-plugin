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
- For drag-reorder widgets, pointer-events / touch are required (mobile + desktop).

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

### `ve-slider` — themed range slider with optional ticks

```html
<div class="ve-slider" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "value": 5,
      "min":   0,
      "max":   100,
      "step":  1,
      "unit":  "%",
      "ticks": [
        { "value":   0, "label":   "0%" },
        { "value":  50, "label":  "50%" },
        { "value": 100, "label": "100%" }
      ]
    }
  </script>
</div>
```

Emits `{ kind: "slider", id, value: <number> }`. Ticks are optional;
when supplied the values land in a `<datalist>` (so HTML's native
snap-to-tick works on browsers that support it) AND in a labelled
row below the track.

### `ve-toggle` — themed boolean switch

```html
<div class="ve-toggle" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":    "<question>",
      "value":    true,
      "onLabel":  "ON",          // optional caption
      "offLabel": "OFF"
    }
  </script>
</div>
```

Emits `{ kind: "toggle", id, value: <boolean> }`. Click OR keyboard
Space/Enter flip the state. `aria-checked` and `role="switch"` are
set so screen readers announce the state. The label flips state too
(matches native `<label>` behaviour).

### `ve-rating` — 1-N star (or dot) rating

```html
<div class="ve-rating" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "max":   5,                // total slots (default 5)
      "shape": "star",           // "star" | "dot"
      "value": 3                 // initial filled count (0 = no rating)
    }
  </script>
</div>
```

Emits `{ kind: "rating", id, value: <0..max> }`. Hover paints
preview-fill; click commits. The ✕ button next to the row clears
the rating (emits 0).

### `ve-card-picker` — rich single-select cards

```html
<div class="ve-card-picker" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "options": [
        {
          "value":    "<v>",
          "label":    "<title>",
          "subtitle": "<short tag>",        // optional
          "body":     "<paragraph>",         // optional
          "icon":     "🐘"                  // optional emoji or glyph
        },
        …
      ],
      "default": "<v>"
    }
  </script>
</div>
```

Emits `{ kind: "card-picker", id, value: "<v>" }`. Cards lay out as
a responsive grid (`minmax(220px, 1fr)`), each a `role="radio"`
button with `aria-checked`. Click OR keyboard Space/Enter selects.
Use this when the choice carries enough nuance that the user needs
title + subtitle + body to decide (e.g. picking between three
database engines).

### `ve-tag-input` — typed tags with chip display + suggestions

```html
<div class="ve-tag-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":       "<question>",
      "placeholder": "type a tag + Enter…",  // optional
      "default":     ["security"],            // optional initial chips
      "suggestions": [                        // optional autocomplete
        "security", "performance", "p0", "p1",
        "breaking-change", "tech-debt"
      ]
    }
  </script>
</div>
```

Emits `{ kind: "tag-input", id, value: [<tag>, …] }`. Type into the
field; `Enter` or `,` commits the typed text as a chip. Empty-field
`Backspace` removes the trailing chip (quick fix-typo). Clicking a
suggestion chip adds it AND hides it from the suggestion row. Chip
✕ removes the tag. Blurring the field also commits a non-empty
trailing value (so a "Done" click works without first pressing
Enter).

### `ve-text-input` — single-line text with optional pattern validation

```html
<div class="ve-text-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":       "<question>",
      "value":       "1.2.0",
      "placeholder": "e.g. 1.2.0",
      "pattern":     "[0-9]+\\.[0-9]+\\.[0-9]+",
      "patternMsg":  "expected major.minor.patch like 1.2.0",
      "required":    true,
      "minLength":   3,
      "maxLength":   32
    }
  </script>
</div>
```

Emits `{ kind: "text-input", id, value: { value: "<text>", valid: <boolean> } }`.
The regex is anchored (`^(?:pattern)$`) so partial matches don't pass.
Invalid values paint a red error line under the field and the host
gets `.ve-text-input-invalid` for styling.

### `ve-text-area` — multi-line with character counter

```html
<div class="ve-text-area" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":       "<question>",
      "value":       "",
      "placeholder": "What changed?",
      "rows":        5,
      "maxLength":   280
    }
  </script>
</div>
```

Emits `{ kind: "text-area", id, value: "<text>" }`. The counter
reads `"<n> / <max>"` (or `"<n> chars"` if `maxLength` is omitted)
and adds `.ve-text-area-near-limit` (warning color) past 90% of
`maxLength`.

### `ve-url-input` — URL with live validation and preview link

```html
<div class="ve-url-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":            "<question>",
      "value":            "https://example.com",
      "placeholder":      "https://…",
      "allowedProtocols": ["http", "https"]
    }
  </script>
</div>
```

Emits `{ kind: "url-input", id, value: { value: "<text>", valid: <boolean> } }`.
Validation goes through the browser's `URL` constructor (so anything
`new URL(value)` accepts is valid). When valid AND the protocol is
in `allowedProtocols` (defaults to "any"), a small "open ↗" button
appears that opens the URL in a new tab. Invalid values paint a red
error line.

### `ve-tree-picker` — hierarchical single-select

```html
<div class="ve-tree-picker" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "defaultDepth": 1,        // branches at depth < N start expanded
      "default": "<value>",     // optional initial selection
      "tree": [
        {
          "label": "scripts",
          "icon":  "📁",         // optional, defaults to folder emoji
          "children": [
            { "label": "amvcp-runtime.js",
              "value": "scripts/amvcp-runtime.js" },
            { "label": "amvcp-diagram.js",
              "value": "scripts/amvcp-diagram.js" }
          ]
        },
        { "label": "README.md", "value": "README.md" }
      ]
    }
  </script>
</div>
```

Emits `{ kind: "tree-picker", id, value: "<leaf-value>" }`. The
model is a nested `{label, value?, icon?, children?}` tree. Branches
(nodes with children) expand/collapse on caret OR row click; leaves
(no children) select on row click. If a leaf has no `value`, the
emitted value is the slash-joined path from root to leaf.

**Persistence:** the SELECTION is saved under
`amvcp-form-input:<data-ve-id>` and the EXPANDED branch set is
saved separately under `amvcp-form-input:<data-ve-id>:expanded`,
so a reload restores BOTH. Branches not listed in the expanded set
fall back to `defaultDepth` (depth-0 + depth-1 open by default when
`defaultDepth = 1`).

### `ve-password-input` — masked text with strength meter

```html
<div class="ve-password-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":       "<question>",
      "placeholder": "type a strong password…",
      "minLength":   8,
      "minStrength": 3,          // 0..4 (too-short, weak, fair, good, strong)
      "persist":     false       // DEFAULT — passwords NOT saved to LS
    }
  </script>
</div>
```

Emits `{ kind: "password-input", id, value: { value: "<text>", strength: 0..4, valid: <boolean> } }`.
A 4-bar meter colours bars by strength (danger / warning / info /
success). The `👁` toggle button flips `input.type` between
`password` and `text` and updates `aria-pressed` for screen readers.

**Privacy:** `persist` defaults to **false** for password inputs — a
saved password in `localStorage` is a footgun on a shared machine.
Set `persist: true` only when the use-case is local-only and the
user is aware.

### `ve-currency-input` — monetary amount + currency switcher

```html
<div class="ve-currency-input" data-ve-id="<id>">
  <script type="application/json">
    {
      "label":      "<question>",
      "amount":     12500,
      "currency":   "USD",
      "currencies": ["USD", "EUR", "GBP", "JPY"],
      "locale":     "en-US",     // optional; formatting honours user-agent default if omitted
      "min":        0,
      "step":       1
    }
  </script>
</div>
```

Emits `{ kind: "currency-input", id, value: { amount: <number>, currency: "<code>" } }`.
A currency-symbol chip (using ISO-4217 codes) prefixes the amount
input; an optional dropdown switches between `currencies[]`. The
preview text to the right uses `Intl.NumberFormat` for proper
locale-aware grouping (`$12,500.00`, `12.500,00 €`, `¥12,500`) but
the emitted payload is always `{ amount: <raw number>, currency: <code> }` so
downstream code doesn't have to parse formatted strings.

### `ve-gallery-picker` — single-select from N image cards

```html
<div class="ve-gallery-picker" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "options": [
        {
          "value":    "watercolor",
          "label":    "Watercolor",
          "subtitle": "soft · pastel",
          "src":      "/assets/watercolor-thumb.jpg",   // optional
          "emoji":    "🎨"                              // placeholder if no src
        },
        …
      ],
      "default": "<value>"
    }
  </script>
</div>
```

Emits `{ kind: "gallery-picker", id, value: "<v>" }`. Cards lay out
in a responsive grid (`minmax(160px, 1fr)`). Each card carries a
thumbnail (4:3 aspect-ratio), an optional caption + subtitle, and an
emoji-or-image placeholder when `src` fails to load. Use this for
art-style pickers, material galleries, image preset libraries.

### `ve-tier-list` — drag items into S/A/B/C/D tier zones

```html
<div class="ve-tier-list" data-ve-id="<id>">
  <script type="application/json">
    {
      "label": "<question>",
      "tiers": [
        { "key": "S", "label": "S", "tone": "best"  },
        { "key": "A", "label": "A", "tone": "great" },
        { "key": "B", "label": "B", "tone": "good"  },
        { "key": "C", "label": "C", "tone": "fair"  },
        { "key": "D", "label": "D", "tone": "weak"  }
      ],
      "items": [
        { "key": "feature-a", "label": "Feature A" },
        { "key": "feature-b", "label": "Feature B" }
      ]
    }
  </script>
</div>
```

Emits `{ kind: "tier-list", id, value: { S: [...], A: [...], …, unranked: [...] } }`.
Every item starts in the "unranked" bucket; drag items into the
appropriate tier zone. Tier `tone` values map to the design-token
scale: `best` → danger, `great` → warning, `good` → accent, `fair` →
info, `weak` → success (the classic tier-list red→green spectrum).
`tiers` is optional (defaults to S/A/B/C/D).

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

## Output

Each widget emits a `ve-form-change` CustomEvent (bubbles up the DOM) with `event.detail = { kind, id, value, timestamp }`:

- `kind`: widget type (`quiz-radio`, `quiz-multi`, `numeric-input`, etc.).
- `id`: the widget's `data-ve-id`.
- `value`: the current answer (type depends on widget — string, array, number, etc.).
- `timestamp`: epoch-ms when the change fired.

The widget ALSO writes `value` to `localStorage[data-ve-id]` so a page refresh restores the answer. Subscribers reading the persisted value MUST `JSON.parse` it.

## Error Handling

| Symptom | Cause | Fix |
|---|---|---|
| Widget renders blank | Missing `data-ve-form-*` config or malformed JSON | Check console — runtime fail-fasts with a clear `[amvcp-form-inputs]` error |
| `ve-form-change` never fires | Subscriber attached to wrong DOM root | Event bubbles — attach to `document` or an ancestor of the widget |
| LocalStorage not restoring | Widget missing `data-ve-id` (no persistence key) | Add a stable `data-ve-id` attribute |
| Drag-reorder unresponsive on mobile | Touch handlers gated behind `pointer-events: none` | Verify the parent's CSS doesn't disable pointer events on touch |
| Colors illegible on dark theme | Single-theme palette in author CSS | Use only `--vc-*` tokens — never hardcoded hex |

## Examples

**Example 1 — radio (single-select)**

```html
<div data-ve-id="lang-choice"
     data-ve-form="quiz-radio"
     data-ve-form-options='["Python","JavaScript","Rust","Go"]'>
</div>
<script>
document.addEventListener('ve-form-change', (e) => {
  if (e.detail.id === 'lang-choice') console.log('picked:', e.detail.value);
});
</script>
```

**Example 2 — numeric with unit dropdown**

```html
<div data-ve-id="memory-budget"
     data-ve-form="numeric-input"
     data-ve-form-units='["MB","GB","TB"]'
     data-ve-form-default='{"value": 4, "unit": "GB"}'>
</div>
```

**Example 3 — drag-to-reorder**

```html
<ol data-ve-id="priority-rank"
    data-ve-form="rank-list"
    data-ve-form-items='["Bug fixes","New features","Refactor","Docs"]'>
</ol>
```

## Resources

This skill ships SKILL.md as the single source of truth (19 widgets documented inline). For deeper integration patterns see:

- [amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) — pairing a form widget with a free-text comment thread.
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — visual verification loop, R29 (selection-overrides-tokens), R31 (responsive).
- [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) — the --vc-* token vocabulary widgets theme off.

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
- `form_inputs_slider_change` — slider renders ticks; input event
  fires; LS persists.
- `form_inputs_toggle_change` — toggle flips on click + Space;
  caption + LS update.
- `form_inputs_rating_change` — rating click fills N + emits N;
  clear empties + emits 0.
- `form_inputs_card_picker` — card-picker renders rich cards; click
  swaps selection + emits.
- `form_inputs_tag_input` — type+Enter adds; click suggestion adds;
  ✕ removes.
- `form_inputs_text_pattern` — regex pattern flags invalid + clears
  on valid; event carries `.valid`.
- `form_inputs_textarea_counter` — counter formats N/max and
  near-limit flag past 90%.
- `form_inputs_url_validation` — preview link visible only when
  URL is valid; honours `allowedProtocols`.
- `form_inputs_tree_picker` — mounts branches/leaves, caret toggles
  open/closed, leaf click selects + emits.
- `form_inputs_tree_persistence` — collapsing a branch persists
  across reload via the `:expanded` LS key.
- `form_inputs_password` — meter colors bars by strength; toggle
  flips type + aria.
- `form_inputs_currency` — renders symbol + Intl preview; typing +
  currency switch both emit.
- `form_inputs_gallery` — gallery picker mounts cards; click swaps
  selection + emits.
- `form_inputs_tier_list` — tier-list mounts S-D + unranked; drag
  moves item between buckets + emits assignment map.

The fixture is `tests/fixtures/form-inputs-fixture.html` (one of
each widget kind).

## Modes

Each widget supports the modes appropriate to its content type. **Radio-style** (`ve-quiz-radio`, `ve-card-picker`, `ve-gallery-picker`) → `data-ve-mode="single"` (default for these widgets). **Checkbox-style** (`ve-quiz-multi`, `ve-tag-input`, `ve-tier-list`, `ve-rank-list`) → `data-ve-mode="multi"` (default for these widgets). **Free-form input** (`ve-numeric-input`, `ve-date-input`, `ve-color-input`, `ve-slider`, `ve-toggle`, `ve-rating`, `ve-text-input`, `ve-text-area`, `ve-url-input`, `ve-password-input`, `ve-currency-input`, `ve-tree-picker`) → not a decision-pill atom (R20-R23 don't apply; the widget's own value IS the answer). Optional cap on a multi-select widget: set `data-ve-mode="max-N"` on the widget host (R21).

## Composability

Composes with every other amvcp-* skill on the same page (R22). Each widget has its own root class (`.ve-quiz-radio`, `.ve-card-picker`, etc.) and `data-ve-id` namespace, so multiple widgets and multiple skills coexist without interference. The only exclusive skill is the overlay-runtime (R24).
