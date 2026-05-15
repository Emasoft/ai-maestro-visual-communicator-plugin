# Progressive stepper

A vertical (or horizontal) multi-step progress indicator. Each step is
`pending` / `active` / `done` / `failed`. Done steps are click-to-navigate.
The active step's marker icon spins.

## HTML skeleton

Steps + states come from the JSON model's `steps` array. The stepper
points at the model via `data-ic-model-key="steps"`.

```html
<ol class="ic-stepper" data-ic-persist data-id="deploy-flow"
    data-ic-orient="vertical" data-ic-model-key="steps">
  <li class="ic-step ic-step--pending">
    <span class="ic-step-marker" aria-hidden="true"></span>
    <span class="ic-step-label">Plan</span>
  </li>
  <li class="ic-step ic-step--pending">
    <span class="ic-step-marker" aria-hidden="true"></span>
    <span class="ic-step-label">Build</span>
  </li>
</ol>
```

Author every `<li>` with `ic-step--pending`; `amvcp-interactive.js`
overwrites each state class from the model. `data-ic-orient` is
`vertical` (default) or `horizontal`.

## State model

`.ic-step--done` → solid success marker, click-to-navigate.
`.ic-step--failed` → solid danger marker.
`.ic-step--active` → accent ring with a transparent top edge so the spin
is visible; gets `aria-current="step"`.
`.ic-step--pending` → muted marker + label.

## JS layer

`amvcp-interactive.js`:

- reads the `steps` array and applies `ic-step--<state>` to each `<li>`,
  setting `data-step-id` and `aria-current`;
- makes each `.ic-step--done` step a `role="button"` with `tabindex="0"`,
  fires `ic:step-nav` (`detail: { stepperId, stepId }`) on click or
  Enter/Space, and persists the current step index.

## Spin keyframe — seam with the `animation` technique

The active-step spin keyframe belongs to the `animation` technique. This
skill **must not redefine** it when both ship. The two-stage contract:

1. **Defer to `animation` when present.** When a page loads both skills,
   `animation` owns one canonical rotation keyframe;
   `injectSpinKeyframe()` detects it (by `<style>` id) and skips.
2. **Self-contained fallback.** A stepper page may load *only* this
   skill, so `injectSpinKeyframe()` injects a minimal
   `@keyframes ic-spin { to { transform: rotate(360deg); } }` — **once**,
   guarded by a `data-ic-spin-injected` flag on `<html>` and an
   existing-keyframe check. Never a duplicate.

## prefers-reduced-motion

The injected keyframe block is wrapped: under
`@media (prefers-reduced-motion: reduce)` the active marker drops the
animation and uses a static solid-accent fill — a substitute, never a
bare `animation:none` on a still element.

## no-nested-scrollbars

A long stepper grows the page; never an inner scroller.
