# Range double-handle — min/max picker

A two-handle slider for picking a numeric range (min..max). Two
overlapping `<input type="range">` elements + a CSS-driven track
between them. Each handle independently keyboard- and AT-
operable; the visible "selected" portion of the track narrows as
either handle moves.

## What it is

Pick a range:

- "Severity ≥ 3 and ≤ 8"
- "Filter to PRs merged between week 12 and week 16"
- "Show files with lines 100..2000"

Custom JS double-handle libraries fight the platform. The
**two-stacked-natives** pattern uses real `<input type="range">`s
— each is fully accessible, keyboard-navigable, AT-readable.

## Scaffold

```html
<div class="ic-rg2" data-ic-rg2 data-id="lines-range">
  <label class="ic-rg2-label">Lines</label>
  <div class="ic-rg2-track" style="--min:0; --max:5000; --lo:100; --hi:2000;">
    <input class="ic-rg2-input ic-rg2-input--lo" type="range"
           min="0" max="5000" step="1" value="100"
           data-ic-rg2-lo aria-label="Lower bound">
    <input class="ic-rg2-input ic-rg2-input--hi" type="range"
           min="0" max="5000" step="1" value="2000"
           data-ic-rg2-hi aria-label="Upper bound">
  </div>
  <div class="ic-rg2-readout">
    <output data-ic-rg2-lo-out>100</output>
    <span> … </span>
    <output data-ic-rg2-hi-out>2000</output>
  </div>
</div>
```

The container's CSS variables (`--min` / `--max` / `--lo` /
`--hi`) drive both the readout and the track-fill bar visually.

CSS:

```css
.ic-rg2 {
  margin: var(--vc-space-3, 16px) 0;
}
.ic-rg2-label {
  display: block;
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
  margin-bottom: var(--vc-space-1, 8px);
}
.ic-rg2-track {
  position: relative;
  height: 1.6em;
  /* The "selected" portion of the track — visual fill. */
  background:
    linear-gradient(to right,
      var(--ve-control-border, #e3dcc9)
        calc(100% * (var(--lo) - var(--min)) / (var(--max) - var(--min))),
      var(--vc-color-accent, #b8861f)
        calc(100% * (var(--lo) - var(--min)) / (var(--max) - var(--min))),
      var(--vc-color-accent, #b8861f)
        calc(100% * (var(--hi) - var(--min)) / (var(--max) - var(--min))),
      var(--ve-control-border, #e3dcc9)
        calc(100% * (var(--hi) - var(--min)) / (var(--max) - var(--min)))
    );
  border-radius: var(--vc-radius-full, 9999px);
}
.ic-rg2-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  pointer-events: none;     /* the thumb is the only interactive part */
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
}
.ic-rg2-input::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  -webkit-appearance: none;
  width: 1.4em;
  height: 1.4em;
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--ve-control-bg, #ffffff);
  border: 2px solid var(--vc-color-accent, #b8861f);
  cursor: ew-resize;
}
.ic-rg2-input::-moz-range-thumb {
  pointer-events: auto;
  width: 1.4em;
  height: 1.4em;
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--ve-control-bg, #ffffff);
  border: 2px solid var(--vc-color-accent, #b8861f);
  cursor: ew-resize;
}
.ic-rg2-input:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
.ic-rg2-readout {
  margin-top: var(--vc-space-1, 8px);
  font-family: var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg-dim, #5b5343);
  font-variant-numeric: tabular-nums;
}
```

The track background is one `linear-gradient` with 4 stops, each
positioned via the `calc(…)` of the CSS variables. As `--lo` /
`--hi` change, the gradient stops move — no JS to paint, no canvas.

## JS engine

```js
function initRg2(rootEl) {
  var track = rootEl.querySelector('.ic-rg2-track');
  var lo    = rootEl.querySelector('[data-ic-rg2-lo]');
  var hi    = rootEl.querySelector('[data-ic-rg2-hi]');
  var loOut = rootEl.querySelector('[data-ic-rg2-lo-out]');
  var hiOut = rootEl.querySelector('[data-ic-rg2-hi-out]');
  if (!track || !lo || !hi) { return; }

  function apply() {
    var lv = parseInt(lo.value, 10);
    var hv = parseInt(hi.value, 10);
    // Force non-crossing — if the user pushes the lo above hi, clamp.
    if (lv > hv) { lo.value = hv; lv = hv; }
    if (hv < lv) { hi.value = lv; hv = lv; }
    track.style.setProperty('--lo', String(lv));
    track.style.setProperty('--hi', String(hv));
    if (loOut) { loOut.value = String(lv); }
    if (hiOut) { hiOut.value = String(hv); }
    rootEl.dispatchEvent(new CustomEvent('ic:rg2-change', {
      bubbles: true,
      detail: { rg2Id: rootEl.getAttribute('data-id'), lo: lv, hi: hv }
    }));
  }
  lo.addEventListener('input', apply);
  hi.addEventListener('input', apply);
  apply();
}
document.querySelectorAll('[data-ic-rg2]').forEach(initRg2);
```

The non-crossing clamp is the only "logic" the JS adds — the rest
is CSS-driven.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | active track + handle border |
| `--ve-control-border` | inactive track |
| `--ve-control-bg` | handle fill |
| `--vc-radius-full` | track + handle pills |
| `--ve-control-mono` | readout font |

## Selection / comment / decision-mini

- **The whole `.ic-rg2` is a selectable atom** — comments attach
  to the range itself ("change the default range", "wider scale").
- **Decision-mini on the range** — Skip / Approve / Deny.

## JS-off degradation

**Two stacked native ranges; non-crossing clamp does not work.**
With JS off:

- Each handle moves natively via mouse / keyboard.
- The visual track fill stays at the initial state — no live update
  to `--lo` / `--hi`.
- The readout stays at the HTML default values.
- The user can push the lo above the hi (no clamp).

The control remains operable; the visual feedback degrades.

## Anti-patterns

- One `<input type="range">` with custom JS to "split" — no
  keyboard control of one half independently.
- Forgetting `pointer-events: none` on the input + `auto` on the
  thumb. Without this, the topmost input intercepts all clicks
  and only one handle is reachable.
- Hardcoding the gradient stops in JS instead of using CSS calc().
  CSS calc is automatic on `--lo` change; JS would have to repaint.
- `min`/`max` mismatched between the two inputs. Always identical
  values on both inputs.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Drag the lo handle past the hi — gets clamped.
const lo = document.querySelector('[data-ic-rg2-lo]');
const hi = document.querySelector('[data-ic-rg2-hi]');
lo.value = 4000;
lo.dispatchEvent(new Event('input', { bubbles: true }));
console.assert(parseInt(lo.value, 10) <= parseInt(hi.value, 10),
               'non-crossing clamp failed');

// Visual fill is between lo and hi.
const track = document.querySelector('.ic-rg2-track');
const loVar = track.style.getPropertyValue('--lo');
const hiVar = track.style.getPropertyValue('--hi');
console.assert(parseInt(loVar, 10) === parseInt(lo.value, 10));
console.assert(parseInt(hiVar, 10) === parseInt(hi.value, 10));
```

Screenshot light + dark in 3 positions: closed (lo=hi), wide,
narrow. Verify the active track (accent) and inactive track
(border) read in both themes.
