# Before/after image slider — visual comparison

A two-image comparison widget where the user drags a vertical
handle to reveal more of the "after" image (or vice versa). Pure
CSS via `clip-path` + a custom-property slider; JS layer adds the
handle interaction.

## What it is

Wireframe → final, before-fix → after-fix screenshots, "old
metric → new metric" charts: any pair where the reader wants to
flip between the two without losing pixel alignment. A separate
side-by-side layout works but doesn't let the eye trace a single
detail; a wipe slider keeps the two registered.

## Scaffold

```html
<div class="ic-ba" data-ic-ba data-id="hero-redesign">
  <img class="ic-ba-before" src="hero-old.png"  alt="Before">
  <img class="ic-ba-after"  src="hero-new.png"  alt="After">
  <input class="ic-ba-input" type="range" min="0" max="100" value="50"
         aria-label="Reveal after / before">
  <span class="ic-ba-handle" aria-hidden="true"></span>
  <span class="ic-ba-label ic-ba-label--before">Before</span>
  <span class="ic-ba-label ic-ba-label--after">After</span>
</div>
```

CSS — the trick is to make BOTH images full-size + absolutely
positioned, then `clip-path: inset(0 calc(100% - var(--p)) 0 0)`
on the after image to reveal it left-to-right:

```css
.ic-ba {
  --p: 50%;
  position: relative;
  display: block;
  width: 100%;
  max-width: 60rem;
  aspect-ratio: 16 / 9;
  margin: var(--vc-space-3, 16px) 0;
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  overflow: hidden;
}
.ic-ba-before, .ic-ba-after {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}
.ic-ba-after {
  clip-path: inset(0 calc(100% - var(--p)) 0 0);
}
.ic-ba-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--p);
  width: 2px;
  background: var(--vc-color-accent, #b8861f);
  transform: translateX(-1px);
  pointer-events: none;
}
.ic-ba-handle::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  background: var(--vc-color-accent, #b8861f);
  border-radius: var(--vc-radius-full, 9999px);
  box-shadow: var(--vc-shadow-2, 0 4px 12px rgba(0,0,0,0.18));
}
.ic-ba-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;          /* invisible but receives input */
  cursor: ew-resize;
  /* The native range is horizontal; pin the slider thumb to span
     the whole element, transparent. */
}
.ic-ba-input:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
.ic-ba-label {
  position: absolute;
  top: var(--vc-space-1, 8px);
  padding: var(--vc-space-0, 4px) var(--vc-space-1, 8px);
  border-radius: var(--vc-radius-sm, 4px);
  background: color-mix(in srgb,
              var(--vc-color-content, #14110b) 80%, transparent);
  color: var(--vc-color-canvas, #faf6ee);
  font: var(--vc-weight-bold, 700) var(--vc-text-0, 12px)/1
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  text-transform: uppercase;
  pointer-events: none;
}
.ic-ba-label--before { left: var(--vc-space-1, 8px); }
.ic-ba-label--after  { right: var(--vc-space-1, 8px); }
```

## JS layer

The slider IS the native range input — it works without JS as a
range from 0 to 100. The JS layer's job is to map that 0–100 to
the `--p` custom property on the container so the clip-path
updates live:

```js
function initBa(rootEl) {
  var input = rootEl.querySelector('.ic-ba-input');
  if (!input) { return; }
  function apply() {
    rootEl.style.setProperty('--p', input.value + '%');
  }
  input.addEventListener('input', apply);
  apply();
}
document.querySelectorAll('[data-ic-ba]').forEach(initBa);
```

For pointer-drag of the handle (without the slider thumb in the
way) you can also wire a `pointermove` listener on the container —
but the simpler "the whole container is the slider track" makes
the whole image a touch target.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | divider line + handle |
| `--vc-shadow-2` | handle lift shadow |
| `--vc-radius-full` | handle disc |
| `--vc-color-content` | label background |
| `--vc-color-canvas` | label text |
| `--ve-control-border` | container border |
| `--vc-radius-md` | container corners |

The divider's 2 px width + 32 px handle disc are constants for
visual readability — tokens for these would be over-engineering.

## Selection / comment / decision-mini

- **The whole `.ic-ba` is a selectable atom** so a reviewer can
  comment on the comparison itself ("show this at the start, not
  the end").
- **Decision-mini.** A before/after IS a comparison — Approve /
  Deny which side wins. Attach the pill alongside.

## JS-off degradation

**Slider works; only the visual map breaks.** With JS off:

- The `<input type="range">` is fully functional natively.
- The clip-path stays at the initial `--p: 50%` (or whatever the
  CSS default is) because no JS reads `input.value` to update it.
- The labels and handle render correctly at the 50/50 position.

Fix the no-JS baseline: use a small CSS-only fallback that maps
`input:checked` of N radios (instead of the slider) to N discrete
positions:

```css
/* CSS-only 5-step fallback when JS isn't available */
@media (scripting: none) {
  .ic-ba {
    /* Hide the range; show 5 radio buttons */
  }
}
```

Or, for the gradual reader: a `<noscript>` block showing both
images stacked, each with a "Before" / "After" caption — no
slider, just sequential reveal.

## Anti-patterns

- Two `<img>` tags inside a `<picture>` with `<source>` swap. Loses
  the "drag to reveal" affordance.
- `position: absolute` without `inset: 0` + `object-fit: cover` —
  the two images may be different aspect ratios and de-register.
- `clip-path: polygon(...)` for a diagonal wipe. Looks slick but
  the reader can't tell exactly where the divider is. Stick to a
  vertical inset.
- Forgetting `pointer-events: none` on the labels — they intercept
  pointer events from the underlying range input.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Drag the slider — after-image clip updates.
const input = document.querySelector('.ic-ba-input');
input.value = 80;
input.dispatchEvent(new Event('input', { bubbles: true }));
const root = input.closest('.ic-ba');
console.assert(getComputedStyle(root).getPropertyValue('--p').trim() === '80%');

// Visual: take a screenshot and the divider should be 80% from the left.
const rect = await page.evaluate(() => {
  const handle = document.querySelector('.ic-ba-handle');
  return handle.getBoundingClientRect();
});
const root2 = await page.evaluate(() => {
  return document.querySelector('.ic-ba').getBoundingClientRect();
});
const ratio = (rect.left - root2.left) / root2.width;
console.assert(Math.abs(ratio - 0.80) < 0.05, 'divider not at 80%');
```

Screenshot light + dark with the slider at 0%, 50%, 100%. Verify
the handle disc is visible in both themes.
