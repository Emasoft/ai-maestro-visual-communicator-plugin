# 31 — Selection + comment + decision-mini contract (Phase 2.5 conformance)

Every `.vsd-slide` is a clickable, focusable, commentable ATOM. The
runtime's universal click handler `toggleElementSelection` toggles
`data-ve-selected="1"` on the slide; the runtime's hover / focus
rules paint a 2 px outline; the modal-comments skill opens a thread
when the user clicks the slide's comment-trigger pill. The
decision-mini pill (agree / propose-change / disagree) attaches per
slide automatically when `window.amvcpRuntime` is loaded.

This reference is the deep spec of how the slide layer plugs into
the runtime's selection / comment / decision-mini contract per
Phase 2.5 (TRDD-352ef46a).

## What this is

The runtime defines a universal contract for "selectable atoms":

1. `data-ve-id` — the atom's unique id.
2. `data-ve-type` — the atom's category hint.
3. `data-ve-label` — the human-readable label for UI surfaces.
4. `tabindex="0"` — makes the atom a focus target for keyboard nav.
5. `role` + `aria-roledescription` + `aria-label` — accessibility
   metadata.

The slide layer conforms to this contract by stamping all five
attributes on every `.vsd-slide` in `renderSlide()`:

```js
section.setAttribute('data-ve-id', slideId);
section.setAttribute('data-ve-type', 'slide');
section.setAttribute('data-ve-label', 'Slide ' + (i + 1));
section.setAttribute('tabindex', '0');
section.setAttribute('role', 'group');
section.setAttribute('aria-roledescription', 'slide');
section.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + deck.slides.length);
```

`slideId` is `'s' + (i + 1)` — so slide 1 is `s1`, slide 12 is `s12`.
The id is the comment-thread key the modal-comments skill uses.

## Scaffold to emit

The agent does NOT add these attributes manually — the renderer
stamps them. The agent's only job is:

1. Use the JSON deck contract.
2. Pick a layout from the 16-name catalog.
3. Don't author the `<section>` HTML by hand.

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — stamps the 5 attributes (+
  optional `data-vsd-numeral` / `data-vsd-notes`).
- `attachDecisionMinisToSlides(deck)` — runs after `createDeck()`;
  walks the deck slides; calls `runtime.attachDecisionMini(slideEl,
  slideId)` for each. Silently skips when `window.amvcpRuntime` is
  not loaded.
- The runtime's own functions (the slide layer does NOT
  re-implement these):
  - `toggleElementSelection(el)` — sets / clears
    `data-ve-selected="1"`.
  - `attachDecisionMini(el, atomId)` — paints the
    agree/propose-change/disagree pill.
  - Universal hover / focus / selected CSS rules
    (`[data-ve-id]:hover` etc.).

## Selection-ring override (specific to slides)

The runtime's universal selection rule paints an outline at
`outline-offset: 3px` — i.e. 3 px OUTSIDE the box. Slides are
`position: absolute; inset: 0` inside a `.vsd-viewport { overflow:
hidden }` that CLIPS at the slide edge, so an outside outline is
INVISIBLE.

The slide CSS overrides this with `outline-offset: -2px !important`:

```css
.vsd-slide[data-ve-id]:hover,
.vsd-slide[data-ve-id]:focus-visible,
.vsd-slide[data-ve-id][data-ve-selected="1"],
.vsd-slide[data-ve-id][data-ve-selected="1"]:hover {
  outline-offset: -2px !important;
}
```

The `!important` beats the runtime's specificity for the same-named
property. The ring now paints INSIDE the slide bounds at 2 px from
the edge — visible inside the clipped viewport.

## Hover-glow override (specific to slides)

Similarly, the runtime's universal hover rule sets an OUTER
box-shadow glow that gets clipped by the viewport. The slide CSS
replaces it with an INSET glow:

```css
.vsd-slide[data-ve-id]:hover {
  box-shadow: inset 0 0 12px
              color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 35%, transparent)
              !important;
}
```

When the slide is selected, the outer glow is REMOVED entirely (the
ring + background already mark selection — a glow on top is noise):

```css
.vsd-slide[data-ve-id][data-ve-selected="1"] {
  box-shadow: none !important;
}
```

When the slide is BOTH selected AND hovered, the inset glow comes
back with higher intensity:

```css
.vsd-slide[data-ve-id][data-ve-selected="1"]:hover {
  box-shadow: inset 0 0 16px
              color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 50%, transparent)
              !important;
}
```

## When to use this reference

Open this ref when:

- Debugging "why doesn't my slide select" — verify the 5 contract
  attributes are stamped.
- Debugging "why doesn't the comment modal open" — verify
  `data-ve-id` is present and matches a known thread.
- A keyboard user reports they can't focus a slide — verify
  `tabindex="0"` is on the section.
- A screen-reader user reports the slide isn't announced properly
  — verify `role="group"` + `aria-roledescription="slide"` +
  `aria-label="Slide N of M"`.

## Don'ts

- Don't strip the `data-ve-*` attributes from a slide. Every slide
  MUST carry them; without them the slide is not commentable.
- Don't change `data-ve-type` to anything other than `"slide"`. The
  runtime's category hint exists for the scanner's filter; mixing
  types breaks the filter.
- Don't add `data-ve-id` to individual blocks (bullets, metrics,
  cards) without coordinating with the runtime team. The current
  contract is one ID per slide; per-block IDs are a future
  enhancement that needs cross-layer agreement.
- Don't override the `outline-offset: -2px` rule. The clipped
  viewport requires the inset ring; flipping to outside makes the
  ring invisible.
- Don't paint your own hover effects. The runtime's universal
  hover rule + the slide's inset-glow override cover the visual
  affordance.

## Decision-mini attachment timing

`attachDecisionMinisToSlides(deck)` runs after `createDeck()`:

```js
function boot(doc) {
  // ... read JSON, build deck ...
  var viewport = renderDeck(deck, mount);
  var deckCtl = createDeck(viewport);
  attachDecisionMinisToSlides(deckCtl);
  // ...
}
```

The function walks every slide via `deck.slides` (the controller's
slide-element accessor) and calls
`window.amvcpRuntime.attachDecisionMini(slideEl, slideId)`. The
runtime paints the pill next to each slide; clicking the pill opens
a 3-option modal (agree / propose-change / disagree); clicking an
option records the user's stance in the comment-modal's storage.

If `window.amvcpRuntime` is undefined (the runtime isn't loaded),
the call is silently skipped — the deck still renders, just without
the pills. The runtime is a soft dependency.

## Visual verification

After a render, verify the contract via DevTools:

1. `document.querySelectorAll('[data-ve-id]')` returns one entry
   per slide.
2. Each entry has `data-ve-type="slide"`, `data-ve-label="Slide N"`,
   `tabindex="0"`, `role="group"`,
   `aria-roledescription="slide"`, `aria-label="Slide N of M"`.
3. Tab through the deck; each slide grows a `:focus-visible` ring
   INSIDE its bounds.
4. Click a slide; verify `data-ve-selected="1"` is added.
5. Click again; verify it's removed.
6. Hover a slide; verify the inset glow appears in the accent
   colour.
7. If runtime is loaded: verify a decision-mini pill appears next
   to each slide.

## Source provenance

- Phase 2.5 / TRDD-352ef46a — Selection / Comment Contract
  Conformance.
- The 5-attribute contract (`data-ve-id`, `data-ve-type`,
  `data-ve-label`, `tabindex="0"`, `role + aria-roledescription`)
  is the runtime's universal scanner format.
- The `outline-offset: -2px` + inset-glow overrides are the
  slide-layer-specific solution to the
  `viewport { overflow: hidden }` clip problem documented in the
  slide module's source comments at lines 217-250.
- The decision-mini pill API
  (`window.amvcpRuntime.attachDecisionMini(el, atomId)`) is the
  runtime's public attachment surface.
