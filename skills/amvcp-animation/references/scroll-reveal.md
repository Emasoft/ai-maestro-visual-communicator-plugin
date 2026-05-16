# Scroll reveal — the fire-once IntersectionObserver engine

The canonical reveal primitive every other below-the-fold animated
element rides on. One observer, one threshold, four variants, fire
exactly once.

## The contract

Mark any element with `data-va-reveal[="variant"]`. The runtime
attaches a SINGLE `IntersectionObserver` (`threshold: 0.15`,
`rootMargin: '0px 0px -50px 0px'`) at init. When the element clears
the threshold, `.va-in` is added and the observer `unobserve`s the
element — the reveal NEVER plays twice on scroll-back-up.

## The four variants

```html
<section data-va-reveal>           <!-- default: fade + 30px rise -->
<section data-va-reveal="fade">    <!-- fade only, no transform -->
<section data-va-reveal="scale">   <!-- fade + scale-up from 0.94 -->
<section data-va-reveal="clip">    <!-- left-to-right clip-path wipe -->
<section data-va-reveal="stagger"> <!-- container reveal cascades children -->
```

Each variant ships in the injected CSS:

```css
@media (prefers-reduced-motion: no-preference) {
  [data-va-reveal] {
    opacity: 0;
    transform: translateY(calc(30px * var(--vc-motion-scale, 1)));
    transition: opacity var(--vc-duration-entrance, 600ms)
                  var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)),
                transform var(--vc-duration-entrance, 600ms)
                  var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1));
  }
  [data-va-reveal="fade"]  { transform: none; }
  [data-va-reveal="scale"] { transform: scale(0.94); }
  [data-va-reveal="clip"]  { clip-path: inset(0 100% 0 0);
                             transform: none; }
  [data-va-reveal].va-in   { opacity: 1; transform: none;
                             clip-path: inset(0 0 0 0); }
}
```

## When to use each variant

| variant | use case | why |
|---|---|---|
| (default) | section headings, long paragraphs, blockquotes | the all-purpose "I just appeared from below" |
| `fade` | hero text, anything centered, anything where translation feels wrong (no upward source point) | translation reads as "I came from below" — wrong for centered content |
| `scale` | cards, charts, infographics that have a focal centre | scale-up reads as "I just landed on the page" |
| `clip` | section breaks, paragraph rules, anything with a left edge to wipe from | clip-wipe reads as "the page is drawing the content in" |
| `stagger` | lists of cards / metrics / steps where each child should cascade independently | see `stagger-entry.md` |

## Threshold tuning — why 0.15 and -50px

The defaults trigger when 15% of the element is visible AND the
element is at least 50px above the bottom of the viewport. In
practice that means the user has just scrolled the element to where
they can see the top third of it — the moment they would expect
content to appear, not the moment they first see a sliver.

Edge cases that suggest a different threshold:
- **Very tall elements (full-viewport sections)** — 15% is unreachable
  before the element fills the viewport. Use `data-va-reveal-threshold="0.05"`
  on the element (a custom attribute the skill does not currently
  read — for now, accept the default; the element reveals as soon
  as the top edge clears the rootMargin).
- **Very short elements (a single line)** — 15% triggers when the
  element is half off-screen at the top. Use `data-va-reveal="fade"`
  with the default threshold; the perceptual error is invisible at
  short heights.

`rootMargin: '0px 0px -50px 0px'` shrinks the viewport bottom 50px,
making the trigger fire JUST BEFORE the element fully clears the
fold. This stops the user from briefly seeing the un-revealed
(opacity:0) state when the page scrolls fast.

## Fail-safe: no IntersectionObserver → reveal everything

```js
if (typeof IntersectionObserver === 'undefined') {
  for (idx = 0; idx < nodes.length; idx++) {
    _doReveal(nodes[idx]);
  }
  return;
}
```

This is the ONE deliberate fail-SAFE in the skill (everywhere else
the skill fails fast). Rationale: an invisible page is a worse
failure mode than an un-animated page. If a user-agent ships without
IntersectionObserver, every reveal target lands at its `.va-in`
state immediately. The page is functional, just non-animated.

Browsers without IntersectionObserver: IE11 (out of scope for the
plugin), some embedded webviews on older Android. The fail-safe
costs zero bytes when IO IS present (the `if` is checked once at
init).

## Fire-once via `unobserve`

```js
_revealObserver = new IntersectionObserver(function (entries, obs) {
  for (var j = 0; j < entries.length; j++) {
    if (!entries[j].isIntersecting) { continue; }
    _doReveal(entries[j].target);
    obs.unobserve(entries[j].target);   // fire once
  }
}, { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN });
```

`obs.unobserve(target)` removes the target from the observer's
watch list. Once a target has revealed, scrolling back up and down
does NOT re-trigger the animation — the `.va-in` class stays, the
element stays at its revealed state.

This matters because:
1. Scroll-thrashing (user reading a long page, scrolling back to
   reference a chart) would otherwise replay the reveal every time —
   distracting and meaningless.
2. The IO callback's work-per-scroll-tick scales with the number of
   active observed targets. Unobserving completed targets keeps the
   scroll handler cheap.

The `_revealCount` counter (test hook) increments on every
`_doReveal()` — a test confirms `unobserve` works by scrolling the
revealed element off and back on screen, observing that
`_revealCount` did NOT grow.

## Counter targets are also reveal targets

```js
function _doReveal(el) {
  if (el.classList && el.classList.contains('va-counter')) {
    animateStat(el);
  } else if (el.hasAttribute && el.hasAttribute('data-va-stat')) {
    animateStat(el);
  } else {
    if (el.classList) { el.classList.add('va-in'); }
  }
  _revealCount++;
}
```

`.va-counter[data-va-stat="N"]` elements are observed by the SAME
IO instance; when they cross the threshold the reveal action is
`animateStat(el)` (the count-up tick loop) instead of the `.va-in`
class. This avoids attaching a second observer just for counters.

See `count-up.md` for the counter contract.

## Combining with stagger (`data-va-reveal="stagger"`)

```html
<ul data-va-reveal="stagger">
  <li class="va-stagger-item">First</li>
  <li class="va-stagger-item">Second</li>
  <li class="va-stagger-item">Third</li>
</ul>
```

The reveal engine indexes the children up front (so `--va-index`
exists before reveal), then on intersect adds `.va-in` to the
container. The CSS selector chain
`[data-va-reveal="stagger"].va-in .va-stagger-item` flips children
to `opacity:1` with a per-`--va-index` `transition-delay`:

```css
[data-va-reveal="stagger"] .va-stagger-item {
  opacity: 0;
  transform: translateY(calc(24px * var(--vc-motion-scale, 1)));
  transition: opacity var(--vc-duration-entrance, 600ms)
                var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)),
              transform var(--vc-duration-entrance, 600ms)
                var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1));
  transition-delay: calc(var(--va-index, 0)
                     * var(--vc-duration-stagger-step, 80ms));
  animation: none;                      /* stagger-on-reveal uses
                                           transitions, not animations */
}
```

The `animation: none` override is important — without it, the
`.va-stagger-item` rule's `vaFadeSlideUp` animation also fires (on
page load, before the IO triggers), which would race the
transition. The override forces the reveal-stagger path to use only
the transition.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-entrance` (600ms default) | reveal transition duration |
| `--vc-duration-stagger-step` (80ms default) | per-child delay in stagger variant |
| `--vc-easing-decel` (decel curve) | the arrival curve |
| `--vc-motion-scale` (1 default) | damps the 30px rise / scale amount |

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  [data-va-reveal]       { opacity: 0;
                           transition: opacity 200ms ease; }
  [data-va-reveal].va-in { opacity: 1; }
  [data-va-reveal="stagger"]       { opacity: 1; }
  [data-va-reveal="stagger"] .va-stagger-item {
    opacity: 0; transition: opacity 200ms ease;
    transform: none; animation: none;
  }
  [data-va-reveal="stagger"].va-in .va-stagger-item { opacity: 1; }
}
```

The substitute KEEPS the meaning (element appears when scrolled
to) but DROPS:
- The 30px rise / scale-0.94 / clip-wipe → opacity-only.
- The 600ms duration → 200ms.
- The decel curve → generic `ease`.
- For stagger: the per-child cascade → children all fade in
  together once the container intersects.

Meaning preserved: the user still sees the section appear when they
scroll to it. The "scroll triggered the appearance" relationship is
preserved (the fade ties to the scroll position via the IO trigger,
which still fires).

## Selection + comment + decision integration

`[data-va-reveal]` elements are stamped with `data-ve-id` +
`data-ve-type="card"` by `stampAnimatedAtoms()` so each revealed
section becomes one comment-able atom. The decision mini-pill mounts
via `window.amvcpRuntime.attachDecisionMini` so each section gets a
decision tag (UNDECIDED / KEEP / REJECT / NEEDS-INFO) per the
unified contract.

Idempotency: the stamper guards against double-stamping; the pill
helper guards against double-mount. A `refresh(root)` after dynamic
insertion picks up new reveal targets without disturbing existing
ones.

## Dynamic insertion — `revealNow(el)` and `refresh(root)`

```js
amvcpAnimation.revealNow(el);
```

Force-reveals one element immediately, bypassing the scroll trigger.
Used by interactive-control-driven content that appears without a
scroll event (a modal that opens, a tab panel that toggles). The
helper:
1. Un-observes `el` if it was being observed (silent on miss).
2. Calls `_doReveal(el)` directly.

```js
amvcpAnimation.refresh(root);
```

Re-scans `root` and rebuilds the reveal observer. Already-revealed
elements keep their `.va-in` class (no flash on re-mount). New
elements are observed fresh.

## Diagnostics

- **Content stuck at opacity 0** → `data-va-reveal` attribute
  present but `amvcp-animation.js` not loaded; check the `<script>`
  tag is on the page. Fail-safe applies only if IO is missing — if
  the script itself is missing, content stays invisible.
- **Reveal fires repeatedly on scroll** → `obs.unobserve` not being
  called; check the IO callback isn't custom-overridden.
- **Reveal never fires** → `threshold: 0.15` requires 15% visible;
  for tall sections this needs more scrolling. Use
  `data-va-reveal="fade"` or scroll past the section.
- **Reveal triggers all-at-once at page load** → the section is
  ABOVE the fold; the IO callback fires immediately for visible
  elements. Use `.va-stagger` (no `data-va-reveal`) for above-the-fold.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
screenshot workflow. The reveal is best verified by:
1. Loading the page with the element below the fold (initial
   screenshot: element absent or `opacity:0`).
2. `page.evaluate(() => window.scrollTo(0, <y>))` to scroll the
   element into view.
3. Wait 700ms (entrance duration + small margin).
4. Screenshot again — element visible with `opacity:1`,
   `transform: none`.
5. Scroll back up + back down — `_revealCount` should NOT have
   incremented past 1 for that element.

For the `reduce` path, emulate `prefers-reduced-motion: reduce` in
DevTools, repeat — the reveal should be a 200ms fade with no
transform.
