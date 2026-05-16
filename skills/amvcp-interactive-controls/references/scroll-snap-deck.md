# Scroll-snap deck — slide deck without a framework

A vertical scroll-snap deck where each slide is one viewport,
keyboard arrows navigate, and an `IntersectionObserver` counter
shows "current / total". The entire deck engine is `scroll-snap-type:
y mandatory` + `scroll-snap-align: start` — zero JavaScript
required for the scroll mechanic.

## What it is

Reports that need a "step through the message" sequence (project
recaps, all-hands presentations, "here's what we changed")
benefit from a deck shape. The full slide-deck skill
(`amvcp-slide-decks`) is the heavy version; this is the
**reusable mini-engine** any IC scaffold can drop in for a 6-slide
mini-deck inline with a long doc.

## Scaffold

The deck is a `<section>` flagged for scroll-snap; each slide is
one child element. The whole deck takes one viewport, but inside
the deck the user can swipe / arrow / wheel between slides.

```html
<section class="ic-deck" data-ic-deck data-id="release-deck">
  <article class="ic-deck-slide" id="slide-1">
    <h2>What shipped</h2>
    <ul>
      <li>Feature A</li>
      <li>Feature B</li>
    </ul>
  </article>
  <article class="ic-deck-slide" id="slide-2">
    <h2>Metrics</h2>
    <p>14 PRs merged, 6 deploys, 1 incident.</p>
  </article>
  <article class="ic-deck-slide" id="slide-3">
    <h2>Next</h2>
    <p>Pricing v2, billing migration, on-call rotation update.</p>
  </article>

  <aside class="ic-deck-counter" data-ic-deck-counter>
    <span data-ic-deck-num>1</span> / <span data-ic-deck-total>3</span>
  </aside>
</section>
```

CSS:

```css
.ic-deck {
  position: relative;
  height: 80vh;                /* a smaller-than-full mini deck */
  scroll-snap-type: y mandatory;
  scroll-snap-stop: always;
  overflow-y: scroll;          /* ALLOWED — this is the deck's own
                                  fixed viewport, see the rule below */
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
.ic-deck-slide {
  height: 80vh;
  scroll-snap-align: start;
  display: grid;
  place-items: center;
  padding: var(--vc-space-5, 32px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg, #14110b);
  text-align: center;
}
.ic-deck-slide:nth-child(even) {
  background: var(--vc-color-surface-sunken, #f1ece0);
}
.ic-deck-slide h2 {
  margin: 0 0 var(--vc-space-3, 16px);
  font: var(--vc-weight-bold, 700)
        clamp(1.5rem, 4vw, 2.5rem)/1.2 var(--vc-font-heading, inherit);
}
.ic-deck-counter {
  position: absolute;
  bottom: var(--vc-space-2, 12px);
  right: var(--vc-space-2, 12px);
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--vc-color-content, #14110b) 80%, transparent);
  color: var(--vc-color-canvas, #faf6ee);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}
```

### no-nested-scrollbars exception

`~/.claude/rules/no-nested-scrollbars.md` documents one exception:
"True application surfaces with a *fixed* viewport (a code editor,
a video timeline, a map). Those are not 'pages' in the sense the
rule covers — they own their viewport by design."

A slide deck IS such a surface. The deck's `overflow-y: scroll` is
legitimate — it's the deck's own owned viewport, not a content
scroller in a document. The deck must occupy a known height
(`80vh` here, or `100dvh` for full-screen) so the user perceives it
as "this is the deck, I navigate inside it".

For a **full-screen** deck (one viewport tall, the deck IS the page),
the rule does not apply at all — the page-level scrollbar IS the
deck's snap scroller.

## JS layer — arrow keys + counter

```js
function initDeck(deckEl) {
  var slides  = deckEl.querySelectorAll('.ic-deck-slide');
  var numEl   = deckEl.querySelector('[data-ic-deck-num]');
  var totalEl = deckEl.querySelector('[data-ic-deck-total]');
  if (totalEl) { totalEl.textContent = String(slides.length); }

  var current = 0;

  // IntersectionObserver counter — fires when a slide crosses center.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        var idx = Array.prototype.indexOf.call(slides, e.target);
        if (idx !== -1 && idx !== current) {
          current = idx;
          if (numEl) { numEl.textContent = String(idx + 1); }
        }
      }
    });
  }, { root: deckEl, threshold: 0.6 });
  slides.forEach(function (s) { io.observe(s); });

  // Keyboard navigation.
  deckEl.tabIndex = 0;   // make the deck focusable
  deckEl.addEventListener('keydown', function (ev) {
    var next = current;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight' ||
        ev.key === 'PageDown' || ev.key === ' ') {
      next = Math.min(slides.length - 1, current + 1);
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' ||
               ev.key === 'PageUp') {
      next = Math.max(0, current - 1);
    } else if (ev.key === 'Home') { next = 0; }
    else if (ev.key === 'End')    { next = slides.length - 1; }
    else { return; }
    ev.preventDefault();
    slides[next].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
document.querySelectorAll('[data-ic-deck]').forEach(initDeck);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` | odd slides background |
| `--vc-color-surface-sunken` | even slides background |
| `--vc-color-content` | counter background |
| `--vc-color-canvas` | counter text |
| `--vc-radius-md` | deck container roundness |
| `--vc-radius-full` | counter pill |
| `--ve-control-mono` | counter font |
| `--vc-font-heading` | slide titles |

`clamp(1.5rem, 4vw, 2.5rem)` for the title scales the type across
screen sizes without a media-query forest.

## Selection / comment / decision-mini

- **Each slide IS a selectable atom** (`data-ve-id="slide:<deck>:<n>"`)
  so a reviewer can comment "rephrase this slide" or "wrong
  metric".
- **The deck container** is not an atom — comments on the deck as
  a whole are rare and ambiguous; pin them on the first slide.
- **Decision-mini per slide** — Skip / Approve / Deny a slide.

## JS-off degradation

**Deck is scrollable; counter doesn't update.** With JS off:

- Scroll-snap is pure CSS — slides snap into place natively.
- Arrow keys, PgUp/PgDn, swipe — all work via the native scroller.
- The counter stays at `1 / N`. Acceptable: the user knows their
  position from the scroll thumb.
- No "current slide" event fires.

The deck is fully usable without JS; only the visible counter and
the keyboard's "smooth scroll to next slide" enhancement are lost.

## Anti-patterns

- A JS-only slide-positioning engine that ignores native scroll
  (animates `transform: translateY(-N * 100vh)` on the wrapper).
  Loses the native scrollbar, swipe gestures, AT linear-document
  navigation, and breaks the JS-off baseline.
- Putting `overflow: hidden` on the deck. With it, the scroll-snap
  layer can't actually scroll — the deck shows slide 1 forever.
- Hardcoding `100vh` instead of `100dvh`. Mobile Safari's dynamic
  toolbar makes `vh` units fluctuate; `dvh` accounts for it.
- A custom keyboard handler that calls `preventDefault()` on
  arrows when the cursor is inside an `<input>` on a slide — kills
  text editing.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Counter updates as the deck scrolls.
const deck = document.querySelector('[data-ic-deck]');
const num = deck.querySelector('[data-ic-deck-num]');
console.assert(num.textContent === '1');

deck.scrollTop = 1000;
await new Promise(r => setTimeout(r, 400));   // IO is async
console.assert(num.textContent !== '1', 'counter did not advance');

// Arrow keys advance.
deck.focus();
await page.keyboard.press('ArrowDown');
await new Promise(r => setTimeout(r, 500));
const numAfter = parseInt(num.textContent, 10);
console.assert(numAfter > 1, 'arrow did not advance');
```

Screenshot all slides in both themes. Verify slide titles read
clearly at small viewport widths thanks to the `clamp()` rule.
