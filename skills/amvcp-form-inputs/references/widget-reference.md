# The nineteen widgets — HTML schemas + emit payloads

## Table of Contents

- [`ve-quiz-radio` — single-select](#ve-quiz-radio--single-select)
- [`ve-quiz-multi` — multi-select](#ve-quiz-multi--multi-select)
- [`ve-numeric-input` — number + unit dropdown](#ve-numeric-input--number--unit-dropdown)
- [`ve-date-input` — native date picker](#ve-date-input--native-date-picker)
- [`ve-color-input` — native color picker + hex readout](#ve-color-input--native-color-picker--hex-readout)
- [`ve-slider` — themed range slider with optional ticks](#ve-slider--themed-range-slider-with-optional-ticks)
- [`ve-toggle` — themed boolean switch](#ve-toggle--themed-boolean-switch)
- [`ve-rating` — 1-N star (or dot) rating](#ve-rating--1-n-star-or-dot-rating)
- [`ve-card-picker` — rich single-select cards](#ve-card-picker--rich-single-select-cards)
- [`ve-tag-input` — typed tags with chip display + suggestions](#ve-tag-input--typed-tags-with-chip-display--suggestions)
- [`ve-text-input` — single-line text with optional pattern validation](#ve-text-input--single-line-text-with-optional-pattern-validation)
- [`ve-text-area` — multi-line with character counter](#ve-text-area--multi-line-with-character-counter)
- [`ve-url-input` — URL with live validation and preview link](#ve-url-input--url-with-live-validation-and-preview-link)
- [`ve-tree-picker` — hierarchical single-select](#ve-tree-picker--hierarchical-single-select)
- [`ve-password-input` — masked text with strength meter](#ve-password-input--masked-text-with-strength-meter)
- [`ve-currency-input` — monetary amount + currency switcher](#ve-currency-input--monetary-amount--currency-switcher)
- [`ve-gallery-picker` — single-select from N image cards](#ve-gallery-picker--single-select-from-n-image-cards)
- [`ve-tier-list` — drag items into S/A/B/C/D tier zones](#ve-tier-list--drag-items-into-sabcd-tier-zones)
- [`ve-rank-list` — drag-to-reorder](#ve-rank-list--drag-to-reorder)

Per-widget JSON model and `ve-form-change` payload for each of the
nineteen form-input widgets. Pick the widget from the matrix in
SKILL.md ("When to use this skill"), then copy the matching schema
below.

## `ve-quiz-radio` — single-select

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

## `ve-quiz-multi` — multi-select

Same shape as `ve-quiz-radio` but `default` is an array (or omitted),
and the event payload is the FULL array of currently-checked values
(not just the last toggled one).

Emits `{ kind: "quiz-multi", id, value: ["<v1>", "<v2>", …] }`.

## `ve-numeric-input` — number + unit dropdown

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

## `ve-date-input` — native date picker

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

## `ve-color-input` — native color picker + hex readout

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

## `ve-slider` — themed range slider with optional ticks

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

## `ve-toggle` — themed boolean switch

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

## `ve-rating` — 1-N star (or dot) rating

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

## `ve-card-picker` — rich single-select cards

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

## `ve-tag-input` — typed tags with chip display + suggestions

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

## `ve-text-input` — single-line text with optional pattern validation

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

## `ve-text-area` — multi-line with character counter

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

## `ve-url-input` — URL with live validation and preview link

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

## `ve-tree-picker` — hierarchical single-select

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

## `ve-password-input` — masked text with strength meter

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

## `ve-currency-input` — monetary amount + currency switcher

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

## `ve-gallery-picker` — single-select from N image cards

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

## `ve-tier-list` — drag items into S/A/B/C/D tier zones

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
appropriate tier zone. Dragging uses Pointer Events, so it works on
mouse, touch, and pen. Tier `tone` values map to the design-token
scale: `best` → danger, `great` → warning, `good` → accent, `fair` →
info, `weak` → success (the classic tier-list red→green spectrum).
`tiers` is optional (defaults to S/A/B/C/D).

## `ve-rank-list` — drag-to-reorder

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
every drop. Dragging uses Pointer Events, so reordering works on mouse,
touch, and pen alike. The saved order survives reloads (the runtime
re-orders the `<li>` children on init from the saved array).
