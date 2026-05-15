# Live-tweak visualizer

A control panel (sliders, selects, color inputs) wired to a live preview
element. Moving a slider updates a CSS custom property on the preview in
real time; choosing a select swaps a class. The reusable core behind any
"tweak a control → see it update" widget.

## HTML skeleton

A `.ic-tweak` container holds `.ic-tweak-controls` (the inputs) and
`.ic-tweak-stage` (the preview). Each control declares what it drives via
data attributes:

```html
<div class="ic-tweak" data-ic-tweak data-id="border-demo">
  <div class="ic-tweak-controls">
    <!-- continuous: drives a CSS custom property on the stage -->
    <label class="ic-tweak-row">
      <span>Radius</span>
      <input type="range" min="0" max="48" value="8"
             data-ic-prop="--demo-radius" data-ic-unit="px">
      <output class="ic-tweak-val"></output>
    </label>
    <!-- discrete: swaps a class on the stage -->
    <label class="ic-tweak-row">
      <span>Style</span>
      <select data-ic-class-group="ic-demo-style">
        <option value="ic-demo-style--solid">Solid</option>
        <option value="ic-demo-style--dashed">Dashed</option>
      </select>
    </label>
  </div>
  <div class="ic-tweak-stage" data-ic-stage>
    <div class="ic-demo-box ic-demo-style--solid"
         style="border-radius:var(--demo-radius,8px)">Preview</div>
  </div>
</div>
```

## Two modes, one engine

One generic wiring function, two modes dispatched by which data attribute
the control carries:

- **`data-ic-prop` — CONTINUOUS.** A range/color/number input produces a
  *value* that maps cleanly to a CSS custom property. `setProperty` on
  the stage is O(1) and does not touch the class list; the property
  cascades to every descendant of the preview. `data-ic-unit` is appended
  to the raw value (`px`, `em`, `%`, …). An adjacent `.ic-tweak-val`
  `<output>` shows the current value.
- **`data-ic-class-group` — DISCRETE.** A select/radio maps to a *named
  variant*, which is a class. The engine strips every class on the target
  starting with the group prefix, then adds the chosen one — exactly how
  the runtime swaps discrete states.

Continuous values map to a property; discrete values map to a class.
Dispatching by data attribute is the generalization.

## Bridge to the DESIGN.md engine

When `data-ic-prop` names a real `--vc-*` token (e.g.
`data-ic-prop="--vc-radius-md"`) the live-tweak engine becomes a
**DESIGN.md token tweaker** — moving the slider restyles every component
on the page that reads that token. Both uses are valid: tweak a
demo-local `--demo-*` prop, or tweak a global `--vc-*` token.

## prefers-reduced-motion

Live-tweak has no animation itself; the *preview* may. Any preview
transition uses `--vc-duration-*` and is reduced-motion-gated.

## no-nested-scrollbars

Controls and stage are laid out side-by-side with flex; neither gets an
inner scroller — the page expands.
