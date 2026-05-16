# 01 — Stage + letterbox fitting (the fixed-pixel canvas)

The single most-replicated pattern in the slide-deck triage (five independent
projects converged on the exact same idea): every slide is rendered onto a
**fixed-pixel "stage"** sized for one of three aspect ratios, then the whole
stage is `transform: scale(ratio)`-ed to fit the current viewport. The stage
is the absolute coordinate system the JSON deck contract authors against; the
viewport scaling is the cosmetic letterbox that hides the gap between the
stage and the browser window.

`amvcp-slide.js` owns this — `renderDeck()` builds a `.vsd-viewport` with a
`.vsd-stage` child sized in `px` from `ASPECTS[deck.aspect]`, and `fitStage()`
recomputes the scale on every resize via a `ResizeObserver`. The agent never
authors transforms or breakpoints — it picks an `aspect`, picks a `fit`, and
the renderer takes over.

## What this is

The stage is a *non-scrolling* fixed-aspect drawing surface. Every layout,
every typography rule, every padding number is denominated in the stage's
pixel coordinate system (e.g. `1920×1080` for 16:9). The renderer then scales
the whole stage uniformly so it fits the viewport with letterbox bars on the
short side. The reader sees a pixel-perfect, never-reflowed slide; the
authoring engine sees a single stable coordinate system to lay out on.

The three supported aspects:

| `aspect` value | Stage pixels | Use when |
|---|---|---|
| `"16:9"` | 1920×1080 | Default. Standard projector / monitor / streaming aspect. |
| `"4:3"` | 1280×960 | Legacy / academic projector. Older A/V hardware. |
| `"3:2"` | 1620×1080 | Print-deck-cross-over (closer to A4 landscape than 16:9). |

The agent picks ONE aspect for the whole deck — mixing aspects per slide is
NOT supported (the stage size is per-deck). Posters get a separate `kind:
"poster"` codepath with a poster-specific stage size.

Two `fit` modes:

| `fit` value | Behaviour | When to pick |
|---|---|---|
| `"letterbox"` *(default)* | Stage stays at its fixed pixel size; transformed via `scale(min(vw/W, vh/H))` to fit the viewport; the unused axis becomes letterbox. | Talks, projector display, fullscreen kiosk. Pixel-perfect at any size. |
| `"responsive"` | Stage flag-flips: each slide becomes `100dvh` tall, `position: static`, transform cleared. No letterbox, no scale. | Mobile review, scroll-snap fallback, in-article-embed reading. |

## Scaffold to emit

The agent NEVER writes the stage or viewport CSS — `amvcp-slide.js`
auto-injects it (`injectSlideCSS(doc)` on `boot()`). What the agent writes is
the deck JSON declaring aspect + fit:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",
  "aspect": "16:9",     // 16:9 / 4:3 / 3:2
  "fit": "letterbox",   // letterbox / responsive
  "mood": "minimal",
  "transition": "crossfade",
  "slides": [ /* ... */ ]
}
```

The HTML page just embeds the JSON in a `<script type="application/json"
id="vsd-deck">…</script>` block and includes the two libs:

```html
<script src="./amvcp-designmd.js"></script>
<script src="./amvcp-slide.js"></script>
<script type="application/json" id="vsd-deck">
{"kind":"deck", … }
</script>
```

`boot()` reads `#vsd-deck` on `DOMContentLoaded`, calls `parseDeck()` →
`renderDeck()` → `createDeck()` → `fitStage()` — done. No build step, no CDN.

## Lib functions called

The agent never calls these directly (the boot path does), but they are the
contract that authors the stage:

- `parseDeck(jsonText|object)` — validates the deck JSON; throws on any
  unknown `aspect`, `fit`, `mood`, `transition`, or `kind`. Returns the
  normalised deck object with documented defaults filled in.
- `renderDeck(deck, mountEl)` — scaffolds the `.vsd-viewport` > `.vsd-stage`
  pair, sets `stage.style.width / .height` from `ASPECTS[aspect]`, attaches
  every rendered slide as a `position:absolute; inset:0` child of the stage.
  Sets `data-vsd-fit="letterbox|responsive"` on the viewport so the CSS
  branch selects the right path.
- `fitStage(viewport)` — reads `viewport.clientWidth / .clientHeight`,
  computes `scale = min(vw/stageW, vh/stageH)`, writes the
  `transform: scale(…)` and `transform-origin: top left` onto the stage,
  centers it via the leftover margin. No-op when `data-vsd-fit="responsive"`.
- `wireResize(viewport)` — `new ResizeObserver(() => fitStage(viewport))`
  observing both `viewport` and `document.body` so the scale tracks
  window-resize + container-resize + DevTools-pane-toggle.
- `refresh(viewport)` — public re-fit hook for callers that mutated the DOM
  inside a slide (e.g. lazy-loaded chart resized its SVG); idempotent.

## DESIGN.md tokens used

The stage's pixel dimensions are NOT tokens — they're the authoring contract
(an aspect ratio is a structural choice, not a theming choice). But every
visible surface on the stage themes off the engine's `--vc-color-*` tokens:

| Token | Default | What it themes |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` (light) / `#0f1217` (dark) | The viewport background — what fills the letterbox bars. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Default text colour the stage inherits. |
| `--vc-font-body` | `system-ui, sans-serif` | Stage's default `font-family`. |

The viewport explicitly reads `var(--vc-color-canvas, #ffffff)` so the
letterbox bars match the slide background — the eye reads the bars as
"continuation of the slide", not "extra browser chrome". When the DESIGN.md
swaps the canvas token from a cream to a deep navy, the bars swap in the
same paint frame as the slides.

## Selection / comment / decision-mini contract notes

Per Phase 2.5 (TRDD-352ef46a), every slide is a clickable **atom** the
runtime's selection layer can highlight + comment on. `renderSlide()` stamps:

- `data-ve-id="s<N>"` — the atom id the universal click handler reads.
- `data-ve-type="slide"` — the category hint (the only `slide` use already
  existing in `amvcp-runtime.js` line 15).
- `data-ve-label="Slide N"` — the human-readable label for the comment modal.
- `tabindex="0"` + `role="group"` + `aria-roledescription="slide"` so the
  `:focus-visible` keyboard selection ring fires (without `tabindex` the
  keyboard branch of the runtime's 3-state visual model is dead).

A custom selection-ring override (`outline-offset: -2px !important`) lives
in the injected CSS because the viewport's `overflow:hidden` letterbox clip
would eat any outside outline. The hover glow likewise hoists to `inset
box-shadow` so it stays visible inside the slide's clipped bounds.

The decision-mini pill (the small "agree / propose change / disagree" widget
the modal-comments skill paints next to atoms) attaches to slides via
`attachDecisionMinisToSlides()` after the deck is built — see the deck-nav
reference (#02) for the per-event attachment timing.

## When to use this reference

Open this ref when:

- The author needs to pick an aspect ratio and doesn't know which one is
  default (16:9 — always pick 16:9 unless the user explicitly asked for a
  square / academic / print-cross-over deck).
- The deck looks tiny / huge / cropped at an unusual viewport — the
  letterbox path is doing exactly what it's supposed to; the fix is usually
  to switch to `fit: "responsive"` for mobile reviews, not to fight the
  scale.
- A custom embed needs the stage to mount inside a 500×280 panel — same
  letterbox path works at any container size; just call `refresh(viewport)`
  after the container resizes.
- The print path doesn't paginate — the renderer's `@media print` block
  restores the natural stage size and unhides every slide; one slide per
  page comes free. If pagination is wrong, the print CSS is the place to
  inspect, NOT the renderer JS.

## Don'ts

- Don't mix aspects per slide. The stage is per-deck; one aspect ratio
  governs the entire deck. If a single slide needs a different aspect,
  emit two decks and link them.
- Don't author transforms / scale / breakpoints in slide content. The
  renderer owns the scale; any author-side transform composites with the
  stage scale and breaks at every viewport.
- Don't hard-code stage pixel sizes in CSS — they come from
  `ASPECTS[aspect]` at render time. Hard-coded literals collide with the
  per-deck aspect choice.
- Don't add `overflow: scroll` to a slide. The stage is fixed-pixel; the
  density guard (≤6 bullets, ≤40 body words) prevents overflow. The
  no-nested-scrollbars rule applies — if the slide is too dense, add a
  slide, don't add a scrollbar.

## Visual verification

After authoring a deck, verify the letterbox fit lands correctly using the
dev-browser screenshot path described in
`skills/amvcp-self-debug-rules/SKILL.md` — at minimum capture a 1280×720 and
a 480×800 viewport in both light and dark themes; the stage MUST appear
centered with proportional letterbox bars in the canvas colour, no
horizontal scrollbar at any tested size, and every slide selectable.

## Resize behaviour deep dive

The `fitStage()` function recomputes the scale on every resize via
`wireResize()`'s `ResizeObserver`. The math:

```js
function fitStage(viewport) {
  var stage = viewport.querySelector('.vsd-stage');
  if (!stage || viewport.getAttribute('data-vsd-fit') === 'responsive') {
    return;
  }
  var stageW = parseFloat(stage.style.width) || ASPECTS[deck.aspect].w;
  var stageH = parseFloat(stage.style.height) || ASPECTS[deck.aspect].h;
  var availW = viewport.clientWidth;
  var availH = viewport.clientHeight;
  var ratio = Math.min(availW / stageW, availH / stageH);
  stage.style.transform = 'scale(' + ratio + ')';
  // Centre the scaled stage in the viewport:
  var scaledW = stageW * ratio;
  var scaledH = stageH * ratio;
  stage.style.left = ((availW - scaledW) / 2) + 'px';
  stage.style.top  = ((availH - scaledH) / 2) + 'px';
}
```

Three properties make this robust:

1. The scale uses `Math.min(...)` so the stage NEVER overflows the
   viewport (no scrollbars).
2. The stage's `transform-origin: top left` (in the CSS) + the
   inline `left` / `top` adjustments centre the scaled box without
   needing flex/grid centring (which would compete with the
   transform).
3. The scale is computed in CSS pixels (`clientWidth`/`Height`), so
   the math is DPR-independent — Retina displays render at 2× pixel
   density but the math stays simple.

## Print path: the same stage at natural size

The `@media print` block restores the stage to its natural pixel
dimensions and unhides every slide:

```css
@media print {
  .vsd-stage { transform: none !important; width: 1920px !important; }
  .vsd-slide[hidden] { display: flex !important; }
  .vsd-slide { break-after: page; page-break-after: always; }
}
```

The result: when the user picks Cmd-P → "Save as PDF", the print
preview shows ONE slide per page at the stage's natural size. No
custom export pipeline, no headless browser, no Puppeteer. The
browser does it natively because the print CSS told it how.

See ref #33 for the full print + PDF discussion.

## Source provenance

- Five projects converged on `transform:scale(min(vw/W, vh/H))` fixed-stage
  letterbox — see SL-01 in
  `reports/visualizing-triage/20260515_112406+0200-MASTER-CONSOLIDATED.md`.
- Mandatory viewport-fit CSS (`100dvh`, `clamp()`, height breakpoints) is
  the `fit: "responsive"` fallback documented in SL-05.
- Print-CSS one-slide-per-page is SL-01's `@media print { transform:none;
  width:1920px }` pattern, lifted verbatim into the renderer's injected CSS.
