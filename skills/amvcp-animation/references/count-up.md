# Count-up — the rAF stat counter wired to scroll reveal

`.va-counter[data-va-stat="N"]` rolls 0 → N with an `easeOutCubic`
curve once the element scrolls into view. The count-up is the
chart skill's KPI-card primitive — also exported as
`amvcpAnimation.animateStat(el)` so any caller can run a manual
count-up.

## Markup

```html
<span class="va-counter" data-va-stat="45200">0</span>

<!-- with decimals + suffix -->
<span class="va-counter"
      data-va-stat="98.6"
      data-va-stat-decimals="1"
      data-va-stat-suffix="%">0</span>

<!-- currency-style suffix -->
<span class="va-counter"
      data-va-stat="1247"
      data-va-stat-suffix=" users">0</span>
```

The text content (the `0` between the tags) is the placeholder
shown before the counter starts. JS-off OR before the IO triggers,
the user sees the placeholder. On reveal, the count-up replaces the
placeholder text with formatted values until reaching the target.

## Attributes

| attr | type | default | role |
|---|---|---|---|
| `data-va-stat` | number | required | the target value (the final number the counter rolls to) |
| `data-va-stat-decimals` | int >= 0 | 0 | digits after the decimal point in the formatted output |
| `data-va-stat-suffix` | string | "" | appended to every formatted value (`%`, `K`, ` users`, etc.) |

Fail-fast: a non-numeric `data-va-stat` is SKIPPED — the placeholder
text stays. A negative or non-finite `data-va-stat-decimals` is
silently clamped to 0.

## The tick loop

```js
function animateStat(el) {
  if (!el || !el.getAttribute) { return; }
  var target = parseFloat(el.getAttribute('data-va-stat'));
  if (!isFinite(target)) { return; }
  var decimals = parseInt(
    el.getAttribute('data-va-stat-decimals') || '0', 10);
  if (!isFinite(decimals) || decimals < 0) { decimals = 0; }
  var suffix = el.getAttribute('data-va-stat-suffix') || '';

  function fmt(v) { return v.toFixed(decimals) + suffix; }

  // reduced-motion (or no rAF) substitute: final value immediately
  if (REDUCED || typeof requestAnimationFrame !== 'function') {
    el.textContent = fmt(target);
    return;
  }

  var dur = readDurationMs('--vc-duration-slow', DUR_SLOW_MS);
  if (dur <= 0) { el.textContent = fmt(target); return; }
  var start = null;
  function ease(t) { return 1 - Math.pow(1 - t, 3); }  // easeOutCubic
  function tick(now) {
    if (start === null) { start = now; }
    var t = (now - start) / dur;
    if (t > 1) { t = 1; }
    el.textContent = fmt(ease(t) * target);
    if (t < 1) { requestAnimationFrame(tick); }
  }
  requestAnimationFrame(tick);
}
```

Four design choices worth understanding:

1. **`easeOutCubic` is the curve, not decel.** The curve is the
   "ease-out semantic" but the easing is computed in JS not CSS —
   the cubic formula `1 - (1-t)^3` is the closed-form of the curve.
   It is mathematically equivalent to the
   `cubic-bezier(0, 0, 0.16, 1)` curve, but JS does the work; CSS
   only times the IO trigger.

2. **`now - start` is monotonic.** `start` is captured on the FIRST
   `tick` (not at the call to `animateStat`) — so the duration
   measures from the first paint frame after the IO callback, not
   from the IO callback itself. This avoids the "frame skipped on
   reveal" problem (the user sees 200ms of empty frames if the JS
   captures `start` at IO time then waits 4 frames for the next rAF).

3. **`t > 1` clamps.** The final frame ALWAYS lands on
   `fmt(ease(1) * target)` = `fmt(1 * target)` = the exact target —
   no off-by-one where the counter stops at 45,198 instead of
   45,200.

4. **`requestAnimationFrame(tick)` recursively schedules.** The
   loop self-terminates by NOT scheduling another tick when `t >= 1`.
   No `cancelAnimationFrame` needed.

## Formatting choices

The skill formats via `v.toFixed(decimals)` — gives
`45200.toFixed(0) = "45200"`. There is INTENTIONALLY no thousands
separator: locale-aware formatting (`v.toLocaleString()`) is hard
to roll back on `reduce` (the final value formats differently if
you change locale mid-page) and the test suite would need locale
fixtures. If the user wants `45,200` instead of `45200`:

```html
<span class="va-counter" data-va-stat="45.2" data-va-stat-decimals="1"
      data-va-stat-suffix="K">0</span>
```

This is the canonical workaround for "I want commas" — express the
target in thousands or millions and use the suffix. The count-up
runs from `0K` → `45.2K` and reads as you'd expect.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-slow` (400ms default) | count-up window — how long the roll takes |

The counter does NOT consume `--vc-easing-*` tokens (the curve is
computed in JS), `--vc-motion-scale` (a numeric counter has no
transform distance to damp), or any colour tokens (the placeholder
inherits text colour from the surrounding context).

## Reduced-motion substitute

```js
if (REDUCED || typeof requestAnimationFrame !== 'function') {
  el.textContent = fmt(target);
  return;
}
```

The reduce branch sets the final value INSTANTLY — no tick loop,
no easing. The information (the target number) is preserved 100%.
The animation (the roll) is dropped. This is the textbook
information-preserving substitute.

Fallback path: when `requestAnimationFrame` is unavailable (very
old user agent, certain test harnesses), the same instant-final
branch fires. The counter is never broken.

## Selection + comment + decision integration

`.va-counter[data-va-stat]` elements are stamped with `data-ve-id`
+ `data-ve-type="counter"` (distinct from `card` for the stagger
items and the reveal sections — so a payload reader can downstream-
route by type). The decision mini-pill is attached too.

`type = 'counter'` wins over `type = 'card'` when both classes
apply (a `.va-stagger-item.va-counter` is counted as a counter
because the count-up is the more specific behaviour).

## Hot-swap with DESIGN.md

Changing `motion.duration-slow` from 400 to 800 in the controller
pad re-emits `--vc-duration-slow: 800ms`. The next counter that
fires (via IO scroll-reveal or a manual `animateStat()` call) runs
for the new duration. Counters already mid-flight keep their
captured duration (the `var dur = …` is captured at `animateStat`
entry, not on every tick).

## Chart skill consumer

The chart skill calls `amvcpAnimation.animateStat(el)` directly for
its KPI-card values — same count-up, same easing, same
reduced-motion handling, no re-implementation. The contract is:
pass an element with `data-va-stat` (+ optional decimals/suffix);
the helper does the rest.

## Diagnostics

- **Counter shows `NaN`** → `data-va-stat` is not a number (e.g.
  `data-va-stat="N/A"`). The fail-fast check (`if (!isFinite(target))
  return`) skips the element entirely — the `NaN` you see is the
  placeholder text, not the rolled value. Audit the markup.
- **Counter shows the final value immediately on load** → the
  element was above the fold when the IO scanned it; the IO
  callback fires for all initially-visible elements at init. This
  is correct — counters above the fold ARE visible at page load,
  so they count up immediately.
- **Counter rolls to a value ≠ target** → either the target had
  more decimals than `data-va-stat-decimals` allowed (so `toFixed`
  rounded), or the placeholder text is being concatenated to the
  formatted value. Check that the placeholder text inside the tag
  is overwritten by `el.textContent = fmt(...)` (which it is, by
  design — `textContent` replaces all children).
- **Counter runs but the `reduce` substitute also fires** →
  impossible — the `if (REDUCED) { return }` early-exits before the
  tick loop. If you see both, the `_watchReducedMotion` listener is
  flipping `REDUCED` mid-roll. Confirm the OS preference isn't
  bouncing.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow. A 5-frame strip at t=0, 100, 200, 300, 400ms should show
the counter at:
- t=0: `0` (or the placeholder text)
- t=100: somewhere around 30% of target (cube ramp ~0.66)
- t=200: somewhere around 50% (cube ramp ~0.875)
- t=300: somewhere around 70-80%
- t=400: the exact target value

The non-linearity (`easeOutCubic` is fast at the start, slow at
the end) is the giveaway: a linear ramp would show 25/50/75/100% at
those frames. The cubic feels like the counter "lands" rather than
hitting the target abruptly.

For the `reduce` path, the counter should display its final value
at the very first frame — no tick visible.
