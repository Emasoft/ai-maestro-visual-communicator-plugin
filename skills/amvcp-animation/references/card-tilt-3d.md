# 3D card tilt — `.va-tilt` perspective on hover

A subtle 3D tilt that follows the mouse pointer — gives cards a
sense of physical depth without crossing into gimmick territory.
Skipped entirely under `prefers-reduced-motion: reduce` (the
static `:hover` elevation remains).

## The contract

```html
<div class="va-tilt" style="background: var(--vc-color-surface);
                            padding: 20px; border-radius: 8px;">
  card content
</div>
```

The runtime attaches `mousemove` and `mouseleave` listeners to
every `.va-tilt` at init (deferred via `requestIdleCallback`).
On `mousemove`, computes the pointer's normalized position within
the card (`x` and `y` ∈ `[-1, 1]`) and applies a `rotateY/rotateX`
transform proportional to the position.

## The CSS

```css
.va-tilt {
  transition: transform var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  transform-style: preserve-3d;
}
@media (prefers-reduced-motion: reduce) {
  .va-tilt { transition: none; }
}
```

Two CSS details:

1. **`transition: transform 120ms`** — the tilt SMOOTHS as the mouse
   moves. Without it, the tilt snaps frame-to-frame and reads as
   jittery. 120ms is short enough that the smoothing isn't laggy.

2. **`transform-style: preserve-3d`** — allows child elements to
   inherit the 3D perspective. Without it, a child element with its
   own transform doesn't compose correctly with the tilt — child
   transforms get flattened into the parent's 2D plane.

## The JS

```js
function initCardTilt(root) {
  if (REDUCED) { return; }
  var d = root || document;
  var cards = d.querySelectorAll('.va-tilt');
  if (!cards.length) { return; }
  var scale = readNumber('--vc-motion-scale', 1);
  var maxDeg = 10 * scale;
  for (var i = 0; i < cards.length; i++) {
    (function (card) {
      if (card.getAttribute('data-va-tilt-wired') === '1') { return; }
      card.setAttribute('data-va-tilt-wired', '1');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) { return; }
        var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        card.style.transform = 'perspective(800px) rotateY('
          + (x * maxDeg) + 'deg) rotateX(' + (-y * maxDeg) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform =
          'perspective(800px) rotateY(0) rotateX(0)';
      });
    })(cards[i]);
  }
}
```

Five details:

1. **Reduced-motion early-exit.** `if (REDUCED) { return; }` —
   the function exits before wiring ANY listeners. Under
   `reduce`, the card has no listeners; no tilt; the static
   `:hover` rule (which lives in the layout skill or in the
   author's own CSS) still works because that is a separate
   media-query branch.

2. **Idempotency guard.** `card.getAttribute('data-va-tilt-wired')`
   — re-running `initCardTilt` after dynamic insertion does NOT
   double-wire the same card. The first wire sets the attribute;
   subsequent passes skip.

3. **`getBoundingClientRect()` per mouse move.** This is the
   "always-current" position — the card's rect can change between
   moves (scroll, layout shift). Caching the rect would produce a
   tilt that aims at the OLD card position.

4. **Normalized coordinates `x, y ∈ [-1, 1]`.** The math:
   `((clientX - left) / width - 0.5) * 2` maps `clientX` from
   `[left, left+width]` to `[-1, +1]`. Pointer at the LEFT edge
   is `x = -1`; pointer at the RIGHT edge is `x = +1`; pointer at
   the CENTER is `x = 0`.

5. **`rotateY(x * maxDeg) rotateX(-y * maxDeg)`** — Y-axis
   rotation tilts left/right (based on horizontal pointer); X-axis
   rotation tilts up/down (based on vertical pointer). The Y
   rotation is NEGATED because positive screen-Y is DOWN and
   positive 3D X-rotation is "looking UP" — without the negation
   the tilt feels inverted.

## The perspective formula

`perspective(800px)` is the foreshortening distance. A larger
value (e.g. `2000px`) makes the perspective gentler (the tilt
feels less pronounced); a smaller value (e.g. `400px`) makes it
more pronounced (almost a "barrel" feel). 800px is the canonical
"feels physical" value.

`rotateY(10deg)` at perspective 800px makes a 200px-wide card's
right edge appear ~5px closer to the viewer and the left edge
~5px farther. Subtle.

## The 10° max angle

`maxDeg = 10 * scale` — at `--vc-motion-scale: 1`, the max tilt
is 10°. At `scale: 0.5` it would be 5°. At `scale: 0` it would be
0° (the tilt math runs but produces a `rotateY(0) rotateX(0)`
transform).

10° was chosen because:
- Less than 5° is invisible (the tilt is too subtle).
- More than 15° crosses into "the card is FLYING toward me"
  territory — distracting.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-fast` (120ms default) | transition smoothing |
| `--vc-easing-standard` (cubic-bezier ease-in-out) | the smoothing curve |
| `--vc-motion-scale` (1 default) | damps the max tilt angle |

`scale: 0` makes the tilt math produce 0° rotations — the card
sits flat, no tilt. Same calm-mode contract as the floats.

## When to use

- **Feature cards** — a small set of cards (3-6) that benefit
  from a sense of physical presence.
- **Image cards** — product cards, portfolio tiles where the
  tilt adds tactile feel.
- **Hero cards** — single hero-section cards that get
  highlighted treatment.

When NOT to use:
- **Long lists of cards** (10+) — every card tilting on every
  hover is exhausting.
- **Cards with internal interactive elements** (forms, complex
  controls) — the tilt makes click targets feel like they're
  moving.
- **Cards with text-heavy content** — text foreshortens
  unpleasantly under perspective; tilt is better for
  image/icon-dominated cards.

## Performance

The `mousemove` handler is NOT rAF-coalesced — it runs on every
mousemove event. The handler's work is light:
`getBoundingClientRect` + arithmetic + one style write. For
modern browsers this is well within the 16ms frame budget.

If a page has 20+ `.va-tilt` cards AND the user is moving the
mouse rapidly across all of them, perf MIGHT degrade — but the
real solution is "fewer tilt cards", not "throttle the handler".

The wiring is deferred via `requestIdleCallback` so attaching
listeners doesn't block first paint.

## Reduced-motion substitute

```js
if (REDUCED) { return; }    // skip wiring entirely
```

The substitute is "don't wire the listeners". No tilt; the card
sits flat. The author's CSS `:hover` rule (which lives outside
this skill) still works — a `box-shadow` change, a `transform:
translateY(-3px)` hover lift, etc.

This is the canonical "interactive decorative animation"
substitute: the entire JS path is gated; the static CSS still
provides the affordance.

## Combining with static hover

Author this pattern in your card's own CSS (NOT in this skill):

```css
.va-tilt {
  transition: transform var(--vc-duration-fast, 120ms),
              box-shadow var(--vc-duration-normal, 200ms),
              border-color var(--vc-duration-normal, 200ms);
}
.va-tilt:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
  border-color: var(--vc-color-accent);
}
```

Under `no-preference`, the user gets BOTH the tilt AND the
hover shadow/border. Under `reduce`, the user gets ONLY the
hover shadow/border (the tilt is dead).

Note: the `transform` transition can be inherited from the
skill's CSS; you'd add the `box-shadow` and `border-color`
transitions on top.

## Selection + comment + decision integration

`.va-tilt` elements are NOT stamped as content atoms by
`stampAnimatedAtoms()` directly — the selector list is explicit
(`.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]`).

If a `.va-tilt` card should be a comment atom, ALSO mark it as
`[data-va-reveal]` or `.va-stagger-item`. A card can carry both
classes — `.va-tilt.va-stagger-item` is a card that staggers in
on load AND tilts on hover.

## Dynamic insertion

`amvcpAnimation.refresh(root)` re-runs `initCardTilt(root)` —
new cards inserted after init get wired. Existing cards keep
their `data-va-tilt-wired` flag and are skipped.

## Diagnostics

- **Tilt doesn't fire** → check `REDUCED` is `false` (devtools
  emulator or system setting), confirm the listeners attached
  (`getEventListeners(card)` in console).
- **Tilt is jittery** → `transition: transform` is missing or
  overridden. Confirm the skill's CSS is applied.
- **Tilt feels INVERTED** → the `-y * maxDeg` negation was
  removed. Restore it.
- **Multiple wires on one card** → the `data-va-tilt-wired`
  guard isn't being checked; ensure `refresh()` is the only path
  to re-wire.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-tilt` card.
2. Move mouse to center of card via `page.mouse.move(cx, cy)`.
3. Screenshot — card should be at `rotateY(0) rotateX(0)` (no
   tilt, mouse at center = `x=0, y=0`).
4. Move mouse to top-right corner via `page.mouse.move(right, top)`.
5. Screenshot — card should tilt with rotateY positive (right edge
   recedes from viewer) and rotateX positive (top edge tilts
   toward viewer).
6. `page.mouse.move(0, 0)` to leave card.
7. Screenshot — card should ease back to flat.
8. With `prefers-reduced-motion: reduce`, repeat — card should
   NEVER tilt (the listeners aren't attached).
