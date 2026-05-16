# Range slider with live `<output>`

A `<input type="range">` paired with an `<output>` element that
displays the current value (with unit). The pattern works with no
JS via `<output for="…">` and the form's implicit input event;
the JS layer adds debouncing, formatting, and CSS-var publishing.

## What it is

`references/live-tweak.md` covers the generic "slider → CSS-var"
engine. This widget is the standalone, self-contained slider used
anywhere the user picks a magnitude: "max retries", "threshold",
"opacity", "font-size", "delay (ms)". Two roles in one widget:

- **Display the value live** — the `<output>` mirrors `input.value`
  as the user drags, with optional unit ("px", "ms", "%").
- **Publish the value** — fires `input` / `change` events the
  surrounding code listens to.

## Scaffold

```html
<form class="ic-slider" data-ic-slider data-id="opt-threshold"
      oninput="
        out.value = (parseFloat(thr.value) / 10).toFixed(1) + 'x';
      ">
  <label class="ic-slider-label" for="thr">Threshold</label>
  <input class="ic-slider-input" type="range"
         id="thr" name="thr"
         min="0" max="100" step="1" value="50">
  <output class="ic-slider-output" for="thr" name="out">5.0x</output>
</form>
```

The `oninput` in the `<form>` is the CSS-only fallback — it runs
whenever any `<input>` inside the form fires `input`, and the
formula has access to ALL named inputs by `name`. The browser owns
this; works with JS off if `<script>` is disabled but the
form-inline handler is allowed.

CSS:

```css
.ic-slider {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--vc-space-2, 12px);
  align-items: center;
  margin: var(--vc-space-2, 12px) 0;
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.3
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg, #14110b);
}
.ic-slider-label {
  font-weight: var(--vc-weight-medium, 500);
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-slider-input {
  accent-color: var(--vc-color-accent, #b8861f);
  width: 100%;
  cursor: ew-resize;
}
.ic-slider-input:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 4px;
}
.ic-slider-output {
  min-width: 3.5em;
  text-align: right;
  font-family: var(--ve-control-mono, ui-monospace, Menlo, monospace);
  font-variant-numeric: tabular-nums;
  color: var(--vc-color-accent, #b8861f);
}
@media (prefers-reduced-motion: reduce) {
  /* No transitions to disable — the slider is direct manipulation. */
}
```

`font-variant-numeric: tabular-nums` is essential — without it the
output width changes on every digit ("5.0x" → "10.0x" pushes
neighbours).

## JS-enhanced layer

```js
function initSlider(form) {
  var input  = form.querySelector('.ic-slider-input');
  var output = form.querySelector('.ic-slider-output');
  if (!input || !output) { return; }
  var unit   = form.getAttribute('data-ic-unit') || '';
  var prop   = form.getAttribute('data-ic-prop');     // optional --vc-* var to publish
  var target = form.getAttribute('data-ic-target');   // optional selector for publish target
  var fmt    = form.getAttribute('data-ic-format');   // optional format spec

  function format(v) {
    if (fmt === 'percent') { return Math.round(v) + '%'; }
    if (fmt === 'fixed1')  { return Number(v).toFixed(1) + unit; }
    return v + unit;
  }

  function apply() {
    output.value = format(input.value);
    if (prop) {
      var tgt = target ? document.querySelector(target) : document.documentElement;
      if (tgt) { tgt.style.setProperty(prop, input.value + unit); }
    }
    form.dispatchEvent(new CustomEvent('ic:slider-change', {
      bubbles: true,
      detail: {
        sliderId: form.getAttribute('data-id'),
        value: input.value
      }
    }));
  }
  input.addEventListener('input', apply);

  // Restore persisted value.
  if (form.hasAttribute('data-ic-persist')) {
    var saved = amvcpInteractive.loadState(form, null);
    if (saved !== null) { input.value = saved; }
    input.addEventListener('change', function () {
      amvcpInteractive.saveState(form, input.value);
    });
  }
  apply();
}
document.querySelectorAll('[data-ic-slider]').forEach(initSlider);
```

The optional `data-ic-prop` / `data-ic-target` lets the slider
double as a live-tweak control without any extra wiring — pick a
slider standalone, or chain it into a tweak engine, depending on
attributes.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | track + thumb tint via `accent-color` |
| `--ve-control-mono` | output font |
| `--ve-control-fg-dim` | label color |
| `--ve-control-fg` | row text |

`accent-color` (CSS spec) tints both the track + thumb of native
range/checkbox/radio without a custom slider implementation —
supported in all modern browsers, gracefully falls back to the UA
default (blue) on older ones.

## Selection / comment / decision-mini

- **The whole slider row is a selectable atom** (`data-ve-id="slider:<id>"`)
  so a reviewer can comment "lower this default" or "the unit is
  wrong".
- **Decision-mini on the row** — Approve / Deny the value or the
  whole control.

## JS-off degradation

**Slider works; output may or may not update.** With JS off:

- The `<input type="range">` is the native browser slider.
  Drag/keyboard work natively.
- The `<output for="…">` updates from the form's inline `oninput`
  handler IF `<script>` content is permitted in the page's CSP.
  Many strict CSPs (`script-src 'self'`) block inline handlers.
- Persistence and the `--vc-*` publish do NOT run.
- The form's `data-ic-prop` consumer (the live preview) stays
  static.

The slider is THE control; the live readout is its enhancement —
if the form-inline handler runs, the readout works. If not, only
the slider stays.

## Anti-patterns

- A custom slider thumb built from divs and JS. Loses the native
  keyboard (arrows, PgUp/PgDn), AT support, and `accent-color`
  theming. Almost always wrong.
- Forgetting `tabular-nums` on the output — every digit count
  shifts the layout.
- Using `change` (fires on release) when the live readout is the
  point — must be `input` (fires on every drag tick).
- Hardcoding `accent-color: orange`. Must be `var(--vc-color-accent,
  …)` so theme hot-swap recolors.
- Setting the slider's min/max via JS at boot. Author them as
  HTML attributes so the no-JS fallback knows the range.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Drag the slider (programmatic) — output reads the value.
const slider = document.querySelector('.ic-slider-input');
slider.value = 80;
slider.dispatchEvent(new Event('input', { bubbles: true }));
const out = document.querySelector('.ic-slider-output');
console.assert(out.value === '80' || out.value === '80px' || out.value === '8.0x',
               'output did not update');

// Keyboard navigation (ArrowRight) moves by step.
slider.focus();
const before = parseInt(slider.value, 10);
await page.keyboard.press('ArrowRight');
console.assert(parseInt(slider.value, 10) === before + 1,
               'arrow key did not step');
```

Capture light + dark theme screenshots; verify the `accent-color`
track/thumb tint is visible in both themes.
