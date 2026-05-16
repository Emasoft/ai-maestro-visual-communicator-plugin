# 02 — Deck navigation + nav chrome (keyboard, swipe, dots, persistence)

A deck without navigation is a stack of slides. This reference catalogues the
*usable* navigation surface `amvcp-slide.js` ships: keyboard arrows + page-up
/ page-down + Home/End + spacebar, touch-swipe with a 50 px threshold, clickable
dot row, slide counter, progress bar, keyboard hints, fullscreen toggle, and
`localStorage`-persisted slide position. All of it is wired by `createDeck()` —
the agent never hand-codes a key handler.

## What this is

Per-deck navigation chrome is built once by `buildNavChrome()` and the
behaviour is wired by four helpers (`wireKeyboard`, `wireTouch`, `wireDotClicks`,
`wireResize`). The chrome is rendered AS PART OF the viewport, NOT as separate
fixed-position widgets — that way the same DOM survives an `iframe` embed, a
poster export, or a print pass without sliding off-screen.

Five chrome elements:

| Element | Selector | Purpose |
|---|---|---|
| Progress bar | `.vsd-progress` | Top-edge 3 px bar; fill grows as `(idx+1)/total`. |
| Dot row | `.vsd-dots` | Right-edge column of `.vsd-dot` buttons; current one is `data-active="1"`. |
| Counter | `.vsd-counter` | Bottom-right `1 / 12` text in tabular-nums. |
| Hints | `.vsd-hints` | Bottom-centre `← → or scroll` text; fades after 4 s or first key. |
| Fullscreen button | `.vsd-fs-btn` | Bottom-left icon; calls `toggleFullscreen()`. |

The chrome is OMITTED entirely when `deck.kind === "poster"` — a poster is a
single-slide static export, dot/progress/counter would be noise.

## Scaffold to emit

The agent emits NOTHING for nav chrome — it's auto-built. What the agent CAN
do is influence the chrome via the deck JSON:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",   // → localStorage namespace key
  "loop": false,                       // wrap-around at last → first slide
  "slides": [ … ]
}
```

The `title` field is REQUIRED — it becomes the `localStorage` namespace
(`vsd-pos:${hashString(title)}`) so two different decks served from the same
domain don't clobber each other's positions.

The `loop` field is OPTIONAL (default `false`). When `true`, pressing `→` on
the last slide wraps to the first and vice versa — useful for kiosk decks
that play forever. When `false`, navigation clamps at the ends.

## Lib functions called

- `createDeck(viewport)` — the wiring entry point. Returns a `Deck` object
  with `go(i)` / `next()` / `prev()` / `current()` / `count()`. The boot
  path calls this exactly once. The returned object is the public API a
  custom embed uses to drive the deck programmatically.
- `buildNavChrome(doc, deck)` — builds the five chrome elements, appends
  them inside the viewport. Idempotent when called twice (re-uses
  existing elements). Skips entirely for `kind: "poster"`.
- `wireKeyboard(deck)` — `document.addEventListener('keydown', …)` with the
  full key map: `ArrowRight` / `PageDown` / ` ` (space) → next;
  `ArrowLeft` / `PageUp` → prev; `Home` → first; `End` → last; `f` →
  fullscreen. Skips when the focus is inside an `<input>` /
  `<textarea>` / `[contenteditable]` so typing in an embedded form
  doesn't navigate.
- `wireTouch(deck)` — `touchstart` → record `touchY`; `touchend` → diff
  against `touchY`, navigate if `Math.abs(dy) > 50`. Single-finger only,
  vertical drag (matches scroll-snap mental model on mobile).
- `wireDotClicks(deck)` — each `.vsd-dot` button gets an `onclick`
  calling `deck.go(i)`. The button is a real `<button>`, not a `<div>`,
  for keyboard / screen-reader accessibility.
- `toggleFullscreen(viewport)` — calls `viewport.requestFullscreen()` (or
  the WebKit-prefixed variant); calls `document.exitFullscreen()` when
  already fullscreen. Browsers that block fullscreen return null — the
  button still works as a no-op (no error).
- `attachDecisionMinisToSlides(deck)` — runs after `createDeck()` so the
  runtime's `attachDecisionMini(atomEl, atomId)` (if present on
  `window.amvcpRuntime`) can paint the agree/propose-change/disagree pill
  next to every slide. Idempotent — re-runs are safe.

## DESIGN.md tokens used

| Token | Default | What it themes |
|---|---|---|
| `--vc-color-accent` | `#b8861f` (light) / `#d4a73a` (dark) | Progress-bar fill, active dot, fullscreen icon. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Counter text, hint text, inactive dots. |
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Chrome panel background (with `color-mix(70% transparent)` blur). |
| `--vc-font-mono` | `ui-monospace, monospace` | Counter `1 / 12`, hint text. |
| `--vc-duration-fast` | `120 ms` | Dot hover / active transition. |
| `--vc-duration-normal` | `200 ms` | Progress-bar width change. |
| `--vc-duration-slow` | `400 ms` | Hint fade-out. |

The chrome themes correctly without any DESIGN.md (every `var(--vc-*, …)`
carries a canonical fallback). When a deck *does* have a DESIGN.md, the
chrome restyles in the same paint frame as the slides — there's never a
"chrome stuck on previous theme" flash.

## Selection / comment / decision-mini contract notes

The nav chrome elements (`.vsd-progress`, `.vsd-dots`, `.vsd-counter`,
`.vsd-hints`, `.vsd-fs-btn`) are **NOT selectable atoms** — they don't carry
`data-ve-id` / `data-ve-type` / `data-ve-label`. That's intentional: chrome
is plumbing, not content; selecting "the slide counter" makes no sense.

The decision-mini pill attaches to the slide *atoms* (`.vsd-slide`), not to
the chrome. It paints next to the slide's selection ring, INSIDE the
clipped viewport — `attachDecisionMinisToSlides()` walks the deck and calls
`runtime.attachDecisionMini(slideEl, slideId)` for each slide. If the
runtime isn't loaded (`window.amvcpRuntime === undefined`), the call is
silently skipped — the deck still renders, just without the pills.

Position persistence (`localStorage`'s `vsd-pos:${hash}` key) only stores
the slide index, NOT the selection state. Refreshing the page restores the
current slide but clears any open comment thread — the comment thread state
lives in the modal-comments skill's own storage, not in the deck's.

## When to use this reference

Open this ref when:

- The author wants to know which keys advance / rewind the deck (it's the
  full standard set — no surprises).
- A custom embed needs to drive the deck programmatically — use the `Deck`
  object returned by `createDeck()`, never simulate key events.
- The deck is in `kind: "poster"` mode and the chrome is missing — that's
  by design; if you actually want chrome on a single-slide page, set
  `kind: "deck"` with a one-slide `slides` array.
- The localStorage position keeps coming back wrong — check that the
  `title` is unique per deck; two decks with the same title share the same
  storage key.

## Don'ts

- Don't add a `Tab` key handler that intercepts focus changes — Tab moves
  focus between the slide and the comment-modal trigger; intercepting it
  breaks the runtime's `:focus-visible` selection ring path.
- Don't bind navigation to the wheel event. Wheel events compete with the
  user's scroll-zoom of embedded diagrams and code blocks (they trigger
  `event.preventDefault()` on every scroll, which feels broken on a
  trackpad). Use keyboard + touch + dots; that's enough.
- Don't paint a separate "current slide" highlight on top of the dot row.
  The dot's `data-active="1"` already drives the styling via
  `[data-active="1"]` selectors; a duplicate highlight glitches when
  `loop: true` wraps.
- Don't hide the chrome via `display: none` on a per-slide basis. If the
  current slide should be chromeless (e.g. a `full-bleed` photo), the
  chrome's `opacity` + `mix-blend-mode: difference` already keeps it
  readable on any background. Hiding chrome for one slide breaks the
  user's mental model of "the chrome is always there".

## Visual verification

After every chrome-touching change, capture a screenshot at 1280×720 light
+ dark via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`, then exercise:

1. `→` key advances; `←` rewinds; `Home` jumps to slide 1; `End` jumps to
   last slide; `Space` advances; `f` toggles fullscreen.
2. Click a non-active dot; verify the deck jumps to that slide and the
   counter updates.
3. Reload the page; verify the deck restores to the last-viewed slide.
4. Drag a finger >50 px vertically on a mobile viewport; verify
   next/prev navigation fires.
5. Open the comment modal on a slide; verify the chrome stays clickable.

## Programmatic navigation

A custom embed driving the deck (e.g. an auto-advancing kiosk) uses
the `Deck` object returned by `createDeck(viewport)`:

```js
var viewport = renderDeck(deck, mount);
var deckCtl = createDeck(viewport);

// Advance every 5 seconds:
setInterval(function () {
  if (deckCtl.current() === deckCtl.count() - 1) {
    deckCtl.go(0);   // wrap
  } else {
    deckCtl.next();
  }
}, 5000);
```

The `Deck` API:

| Method | Returns | Effect |
|---|---|---|
| `current()` | number (0-indexed) | Current slide index. |
| `count()` | number | Total slide count. |
| `next()` | (void) | Advance one slide (clamps at end unless `loop`). |
| `prev()` | (void) | Rewind one slide (clamps at start unless `loop`). |
| `go(i)` | (void) | Jump to slide `i` (0-indexed). |

The auto-advance loop is the canonical "kiosk-mode" implementation —
hand the user no controls, just cycle through the deck forever. For
this use case, set `loop: true` in the JSON so the wrap-around
happens without `current() === count() - 1` arithmetic.

## Chrome visibility on mixed-background decks

When a deck mixes light and dark slides (especially with `full-bleed`
photos), the chrome needs to remain visible on every slide. The
injected CSS uses two tricks:

1. `backdrop-filter: blur(4px)` + `color-mix(in srgb, var(--vc-color-canvas)
   70%, transparent)` → the chrome panels become semi-translucent so
   the slide colour bleeds through but text stays legible.
2. `text-shadow: 0 1px 3px rgba(0,0,0,0.3)` on the counter and hint
   text → the dropshadow keeps text readable on any background.

The two tricks combined mean the chrome stays visible on a
chocolate-coloured `full-bleed` slide AND on a paper-white
`manifesto` slide without per-slide chrome restyling.

## Source provenance

- Five-key navigation + dot row + counter is the consolidated chrome from
  the SlideEngine catalogued in `slide-patterns.md` lines 314-426.
- `localStorage` position persistence comes from SL-14 / the deck-stage
  pattern catalogued in
  `reports/visualizing-triage/20260515_112406+0200-MASTER-CONSOLIDATED.md`.
- 50 px touch-swipe threshold is the converged value from the SlideEngine
  source — under 50 px is too sensitive (every scroll triggers a slide
  change); over 100 px feels unresponsive on a 4-inch phone.
- The chrome-on-mixed-backgrounds tricks (`backdrop-filter` +
  `text-shadow`) are documented in `slide-patterns.md` lines 290-307.
