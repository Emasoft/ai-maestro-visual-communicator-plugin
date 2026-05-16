# Contact-sheet motion panel — feel the easings

The `motion` panel of the token contact sheet renders one demo chip
per easing — click a chip and a dot inside the chip traverses the
chip's width using that easing curve. The teaching artifact for the
8-easing library.

## What it does

`buildMotionPanel(designmd)` renders one `<button>` per easing in the
DESIGN.md's `motion` group. Each button:

- carries a `data-vc-copy` with the cubic-bezier string (so click-to-
  copy lifts the curve definition into the clipboard);
- contains a small dot that's positioned at the left edge initially;
- on click, the dot transitions from `left: 0%` → `left: 100%` over
  `var(--vc-duration-base)` with the button's chosen easing curve.

Static under `prefers-reduced-motion: reduce` — `attachMotionDemo`
early-returns when reduced motion is on, so the click does nothing
visible (the dot stays at 0%). This is correct behaviour: the panel's
job is to show the easings; under reduced motion, the curves are
information the reader can READ (the cubic-bezier string is visible
text), not animate.

## Why an animated demo (vs a static curve plot)

A static plot of a `cubic-bezier(0.34,1.56,0.64,1)` curve tells the
reader "it overshoots and recovers". A LIVE animation lets them
FEEL the spring on their eye — a different category of
information. Spring vs bounce vs emphasized-decel become
distinguishable in a way a chart can never quite communicate.

## Scaffold to emit

The panel template:

```html
<section data-vc-panel="motion" class="vc-sheet-panel">
  <h2>Motion library</h2>

  <h3>Durations</h3>
  <ul class="vc-sheet-motion-durations">
    <li><code>var(--vc-duration-instant)</code> 50ms — tooltip arming, focus fade-out</li>
    <li><code>var(--vc-duration-fast)</code> 100ms — hover overlays, button feedback</li>
    <!-- … 6 more … -->
  </ul>

  <h3>Easings (click to feel)</h3>
  <div class="vc-sheet-motion-easings">
    <button class="vc-sheet-motion-chip"
            data-vc-copy="cubic-bezier(0.2,0,0,1)"
            data-vc-easing-key="easing-standard">
      <span class="vc-sheet-motion-dot"></span>
      <span class="vc-sheet-motion-label">standard</span>
    </button>
    <!-- … 7 more … -->
  </div>
</section>
```

`attachMotionDemo(sheetRoot)` wires up the click handler that animates
the dot. The animation uses `transition: left var(--vc-duration-base)
<easing>` — read live from the button's `data-vc-easing-key`.

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the motion
  panel
- (internal) `buildMotionPanel(designmd)`, `attachMotionDemo(root)`,
  `wireMotionChip(chip)` — not exported

## DESIGN.md tokens used

- reads: `motion.duration-*` (eight integer ms values),
  `motion.easing-*` (eight cubic-bezier or 'linear' strings)
- emits (via the engine): `--vc-duration-instant` …
  `--vc-duration-glacial`, `--vc-easing-standard` …
  `--vc-easing-bounce`

## Anti-slop interaction

Motion tokens have no colors / fonts, so the slop lint doesn't apply.
The panel does reveal MOTION slop indirectly: if every chip
animates the dot in IDENTICAL fashion (no visible difference between
"spring" and "bounce" and "standard"), then either:

- the DESIGN.md author hardcoded the same `cubic-bezier(…)` for
  multiple easing tokens (a bad copy-paste);
- OR the `--vc-easing-*` declarations are being overridden somewhere
  downstream.

The visible animation IS the diagnostic.

## Selection / comment / decision-mini contract

Each chip is a button — click-to-copy fires the standard `[data-vc-
copied]` flash with the easing string. The chip's own animation
fires INDEPENDENTLY of the copy — both happen on the same click.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the motion panel in **both
themes** (R1). The panel doesn't have unique chrome that flips per
theme — same `vc-sheet-motion-chip` styling — but the chips' BG
adapts (it's `var(--vc-color-surface-raised)`).

Test the animation:

```js
await page.click('[data-vc-easing-key="easing-bounce"]');
await page.waitForTimeout(50);
const startLeft = await page.evaluate(
  () => getComputedStyle(document.querySelector('.vc-sheet-motion-dot')).left);
await page.waitForTimeout(300);
const endLeft = await page.evaluate(
  () => getComputedStyle(document.querySelector('.vc-sheet-motion-dot')).left);
// endLeft should be near the chip's right edge (100% of width).
// During the animation, an intermediate sample should land PAST 100%
// momentarily (the bounce overshoot) — sample at t=200ms and confirm.
```

Verify reduced-motion: emulate `prefers-reduced-motion: reduce` and
verify a click does NOT move the dot (the panel respects the
accessibility hint).
