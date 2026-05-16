# CSS-only toggle switch

The 38×22 px iOS-style on/off rocker, implemented as a `<label>` wrapping
a hidden `<input type="checkbox">` plus a `.track` whose `::after`
pseudo-element is the moving thumb. Zero JavaScript — the toggle is
fully functional with JS disabled, because the source of truth is the
checkbox's native `:checked` state.

## What it is

A binary switch that styles a real `<input type="checkbox">` as an
animated rocker:

- **Off** — neutral border, thumb on the left, transparent track.
- **On** — accent-tinted track (`--vc-color-success` or
  `--vc-color-accent`), thumb slid 16 px to the right, brief 180 ms
  spring-feel transition.

The control is keyboard-native (Space toggles, Tab focuses), AT-friendly
(it IS a real checkbox), and form-submittable (the underlying
`<input name="foo" value="on">` posts when wrapped in a `<form>`).

## Scaffold

```html
<label class="ic-switch" for="ic-sw-notify">
  <input class="ic-switch-input" type="checkbox" id="ic-sw-notify"
         name="notify" data-ic-persist data-id="opt-notify">
  <span class="ic-switch-track" aria-hidden="true"></span>
  <span class="ic-switch-label">Notifications</span>
</label>
```

The CSS spine (drop into `amvcp-interactive.css` or the scaffold's
`<style>`):

```css
.ic-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-2, 12px);
  cursor: pointer;
  user-select: none;
}
.ic-switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
}
.ic-switch-track {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--ve-control-bg, #ffffff);
  border: 1px solid var(--ve-control-border-strong, #c9bfa3);
  transition: background var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease),
              border-color var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease);
}
.ic-switch-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--vc-color-surface, #ffffff);
  box-shadow: var(--vc-shadow-1, 0 1px 2px rgba(0, 0, 0, 0.12));
  transition: transform var(--vc-duration-fast, 120ms)
              var(--vc-easing-out, cubic-bezier(.2, .6, .2, 1));
}
.ic-switch-input:checked ~ .ic-switch-track {
  background: var(--vc-color-success, #3a6b5c);
  border-color: var(--vc-color-success, #3a6b5c);
}
.ic-switch-input:checked ~ .ic-switch-track::after {
  transform: translateX(16px);
}
.ic-switch-input:focus-visible ~ .ic-switch-track {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ic-switch-track,
  .ic-switch-track::after { transition: none; }
}
```

## Lib functions

This widget is **pure CSS** — no `amvcp-interactive.js` initializer is
required. It plugs into the existing infrastructure two ways:

- **Persistence.** If the `<input>` carries `data-ic-persist` and
  `data-id`, treat it as a state-plumbing client. A 6-line helper (or a
  thin wrapper around `loadState` / `saveState` from
  `references/state-plumbing.md`) restores `checked` on boot and saves
  on `change`:

  ```js
  function wireSwitch(input) {
    if (!input.hasAttribute('data-ic-persist')) return;
    var saved = amvcpInteractive.loadState(input, null);
    if (saved !== null) { input.checked = !!saved; }
    input.addEventListener('change', function () {
      amvcpInteractive.saveState(input, input.checked);
    });
  }
  document.querySelectorAll('.ic-switch-input').forEach(wireSwitch);
  ```

- **Events.** A host page reading the switch should listen to the
  native `change` event on the `<input>`. No custom `ic:*` event is
  needed — adding one duplicates the platform.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-success` | "on" track + border |
| `--ve-control-bg` | "off" track |
| `--ve-control-border-strong` | "off" border |
| `--vc-color-surface` | thumb |
| `--vc-radius-full` | track + thumb roundness |
| `--vc-shadow-1` | thumb shadow |
| `--vc-duration-fast` | track + thumb transitions |
| `--vc-easing-out` | thumb slide curve |
| `--vc-color-accent` | focus ring |

A `data-ic-color="accent"` modifier may swap the "on" color from
`--vc-color-success` to `--vc-color-accent` — the chosen color is the
single line of CSS to override.

## Selection / comment / decision-mini

- **Selection.** A standalone toggle row IS a selectable atom — author
  the `<label class="ic-switch">` with `data-ve-id` / `data-ve-type`
  so the runtime click delegation pins it. The native `<input>` swallow
  no clicks since it has `pointer-events: none`.
- **Decision-mini.** Append `attachDecisionMini(label, atomId)` after
  stamping; the S/A/D pill sits alongside the switch so a reader can
  Skip / Approve / Deny the toggled setting itself.
- **Comments.** The atom carries the comment-anchor; threads attach to
  the `data-ve-id` of the `<label>`, not the `<input>`.

## JS-off degradation

**Fully functional.** The toggle is a real checkbox; toggling it
flips the `:checked` pseudo-class instantly, which the CSS reads to
slide the thumb and tint the track. With JS off:

- The checkbox toggles on click and Space.
- The track + thumb animate via the CSS transition.
- A submit-button form posts the checkbox state.
- Persistence (the `data-ic-persist` autosave) does NOT run, so the
  toggle resets to its `checked`/unchecked HTML default on each reload
  — graceful loss of a non-essential feature, never broken behaviour.

The `prefers-reduced-motion` block flattens the slide to an instant
swap without disabling the toggle itself.

## Anti-patterns

- A `<div role="switch" tabindex="0">` faking a switch with JS. You
  lose form submission, native keyboard, the AT contract, and the
  JS-off baseline.
- An `aria-checked="true|false"` written by JS into the `<label>` —
  redundant once a real `<input type="checkbox">` is inside. The AT
  reads the checkbox state directly.
- A `display: none` on the input — that removes it from the
  tab order. Use the visually-hidden trick (`opacity: 0; width: 1px;
  height: 1px; pointer-events: none`).
- Hand-tinting the thumb the same color as the track — the user can no
  longer see the slide finish.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the scaffold in
`dev-browser`, then check:

```js
// Toggle responds to Space key (native checkbox behaviour).
const input = document.querySelector('.ic-switch-input');
input.focus();
const before = input.checked;
await page.keyboard.press('Space');
console.assert(input.checked !== before, 'space did not toggle');

// Thumb is in the on/off position the CSS expects.
const track = input.nextElementSibling;
const thumbX = getComputedStyle(track, '::after').transform;
console.assert(thumbX.indexOf('16') !== -1, 'thumb did not slide');
```

Capture light + dark theme screenshots and verify both contrasts pass
the WCAG AA contrast checker on the thumb-vs-track pair in both states.
