# Teaching diagram (perturbable, slider-driven)

The highest-leverage pattern for **teaching content**: a live
diagram where the learner can perturb the parameters and
immediately see both the visual change and the numerical
consequence. Lifted from `15-research-concept-explainer` in the
html-effectiveness catalog (the hashing-ring example). Replaces
a long paragraph of "if you increase X by Y, then Z changes..."
with a slider the reader can play with.

## When to choose this pattern

Use a perturbable teaching diagram when:

- You are **explaining a concept** whose behavior depends on
  parameters (rate, threshold, count, percentage).
- A static diagram would force the reader to mentally simulate
  the parameter sweep; a slider lets them SEE it.
- The diagram fits the slider's range without becoming
  unreadable at extremes.

Do NOT use this pattern when:

- The diagram has no varying parameters (it's just an
  illustration; use a static scene graph).
- The parameter range is huge (1 to 10,000 — use a logarithmic
  slider or skip the slider entirely).
- The recompute is expensive (the slider lag will frustrate; use
  pre-rendered keyframes instead).

## The shape

```html
<div class="ve-teach-diagram" data-ve-block="teach-diagram">
  <header class="ve-teach-diagram__header">
    <h3>Consistent hashing</h3>
    <p>Move the slider to add or remove virtual nodes per server.</p>
  </header>

  <div class="ve-teach-diagram__controls">
    <label>
      Virtual nodes per server:
      <input type="range" min="1" max="200" value="40"
             data-ve-teach-param="vnodes"
             aria-describedby="vnodes-value">
      <output data-ve-teach-output="vnodes" id="vnodes-value">40</output>
    </label>
    <label>
      Servers in the ring:
      <input type="range" min="2" max="20" value="4"
             data-ve-teach-param="servers"
             aria-describedby="servers-value">
      <output data-ve-teach-output="servers" id="servers-value">4</output>
    </label>
  </div>

  <div class="ve-teach-diagram__stage" data-ve-teach-stage="ring">
    <svg viewBox="-200 -200 400 400" width="400" height="400">
      <!-- recomputed on slider change -->
    </svg>
  </div>

  <div class="ve-teach-diagram__stats" data-ve-teach-stats>
    <div class="ve-stat">
      <span class="ve-stat__label">stddev of load</span>
      <span class="ve-stat__value" data-ve-stat="stddev">0.08</span>
    </div>
    <div class="ve-stat">
      <span class="ve-stat__label">worst server</span>
      <span class="ve-stat__value" data-ve-stat="worst">25.3%</span>
    </div>
  </div>
</div>
```

The wiring (skeleton):

```js
function bindTeachDiagram(root) {
  var diagrams = root.querySelectorAll('.ve-teach-diagram');
  for (var i = 0; i < diagrams.length; i++) {
    (function (d) {
      var params = {};
      var inputs = d.querySelectorAll('input[data-ve-teach-param]');

      function rerender() {
        // Read all params.
        Array.from(inputs).forEach(function (inp) {
          params[inp.dataset.veTeachParam] = Number(inp.value);
          var out = d.querySelector(
            'output[data-ve-teach-output="' + inp.dataset.veTeachParam + '"]'
          );
          if (out) { out.value = inp.value; }
        });
        // Recompute the model + redraw.
        var model = computeModel(params);
        drawRing(d.querySelector('[data-ve-teach-stage="ring"] svg'), model);
        updateStats(d.querySelector('[data-ve-teach-stats]'), model);
      }

      Array.from(inputs).forEach(function (inp) {
        inp.addEventListener('input', rerender);
      });
      rerender();    // initial render
    })(diagrams[i]);
  }
}
```

`computeModel`, `drawRing`, `updateStats` are diagram-specific.

## Smooth transitions

Use CSS transitions on shape attributes so the redraw doesn't
feel jarring:

```css
.ve-teach-diagram svg circle,
.ve-teach-diagram svg path {
  transition: cx 200ms ease-out, cy 200ms ease-out,
              r 200ms ease-out,
              d 200ms ease-out;
}
```

CSS-transitioning SVG attributes works in modern browsers.
Failures gracefully degrade to instant updates — which is fine,
just less elegant.

Under `prefers-reduced-motion: reduce`, kill the transition:

```css
@media (prefers-reduced-motion: reduce) {
  .ve-teach-diagram svg * { transition: none; }
}
```

The diagram still works; just no smooth tween.

## The stats panel

Numerical consequences are as important as the visual:

```html
<div class="ve-teach-diagram__stats">
  <div class="ve-stat">
    <span class="ve-stat__label">stddev of load</span>
    <span class="ve-stat__value" data-ve-stat="stddev">0.08</span>
  </div>
</div>
```

Each stat re-renders on every slider tick. The label is small
(`--vc-text-0`), the value is large (`--vc-text-2`) so the eye
catches the number.

## Hover-linked glossary

The catalog example adds a glossary: hovering a term in the
prose highlights the related part of the diagram:

```html
<p>
  The <span data-ve-glossary="vnodes">virtual nodes</span>
  are distributed around the ring at hashes of
  <code>md5(server + ':' + index)</code>.
</p>
```

Wiring:

```js
document.addEventListener('mouseover', function (ev) {
  var term = ev.target.closest('[data-ve-glossary]');
  if (!term) { return; }
  var key = term.dataset.veGlossary;
  document.querySelectorAll('[data-ve-glossary-target="' + key + '"]')
    .forEach(function (el) { el.classList.add('is-highlit'); });
});
document.addEventListener('mouseout', function (ev) {
  var term = ev.target.closest('[data-ve-glossary]');
  if (!term) { return; }
  document.querySelectorAll('.is-highlit')
    .forEach(function (el) { el.classList.remove('is-highlit'); });
});
```

A beautiful interaction at zero library cost.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | the slider thumb (`--vc-color-accent`), the stat values (`--vc-color-content`), surfaces |
| typography | `--vc-text-2` (stat values), `--vc-text-1` (labels), `--vc-text-0` (param labels) |
| motion | `--vc-duration-fast` for the slider-driven transitions |

## Selection atoms

The teaching diagram as a whole is one selection atom:

```html
<div class="ve-teach-diagram"
     data-ve-id="vc-teach-1"
     data-ve-type="teaching-diagram"
     data-ve-data='{"concept":"consistent-hashing","params":["vnodes","servers"]}'>
```

The agent receiving a click on the diagram knows which concept
is being explored.

Individual slider events are NOT logged as selection atoms — they
fire too often. The agent can poll the params periodically if
needed.

## Variations

### Multi-perturbation

Two-three sliders that interact. The hash-ring example uses
"virtual nodes per server" + "number of servers"; their product
is the ring size, which affects load distribution.

### Stepper instead of slider

For discrete parameters (count = 1, 2, 3, ..., 10), use a stepper:

```html
<input type="number" min="1" max="10" step="1" value="4"
       data-ve-teach-param="servers">
```

Or a button pair:

```html
<button data-ve-teach-step="servers" data-ve-step="-1">-</button>
<output data-ve-teach-output="servers">4</output>
<button data-ve-teach-step="servers" data-ve-step="+1">+</button>
```

The stepper makes the discrete nature obvious; slider implies
continuous.

### Preset chips

Quick-jump to canonical values:

```html
<div class="ve-teach-presets">
  <button data-ve-teach-preset='{"vnodes":1,"servers":4}'>baseline</button>
  <button data-ve-teach-preset='{"vnodes":40,"servers":4}'>typical</button>
  <button data-ve-teach-preset='{"vnodes":200,"servers":4}'>fine-grained</button>
</div>
```

Clicking a preset sets all sliders to the preset values + fires
a render. Useful for guided tutorials: "click 'baseline' to see
the imbalance".

## Anti-patterns

- Slider whose effect is invisible (the diagram doesn't change
  enough at any value). Either pick a parameter that matters or
  drop the slider.
- Slider with no live stats: the visual change might be subtle;
  numerical stats anchor the reader.
- Recompute that lags > 50ms per tick: the slider feels broken.
  Either pre-compute keyframes or optimize the model.
- No `prefers-reduced-motion` guard on the transitions: fails
  accessibility.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, AT THREE SLIDER VALUES (min, mid, max).
Verify:

- Each value produces a visibly different diagram.
- The stats panel updates with each value.
- Transitions are smooth (or instant under reduce).
- The diagram doesn't break at extremes (slider at 200 vnodes
  shouldn't render a tangled mess).
