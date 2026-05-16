# 22 — Moods + transitions (5 entrance moods, 4 section transitions)

Decks have moods. A minimal mood opens with a clean fade; a dramatic
mood opens with a clip-path wipe; a playful mood bounces; an editorial
mood does a serif character stagger; a techy mood scrambles characters
in monospace. The mood is a deck-level choice declared once and
applied to every slide's entrance.

Section transitions are the OTHER motion — what happens BETWEEN slides
when the user presses `→`. The four supported transitions are
`crossfade`, `slide-left`, `zoom`, and `page-turn`. The transition is
also a deck-level choice; mixing transitions per slide is NOT
supported.

## What this is

Two deck-level fields:

```jsonc
{
  "mood": "minimal",       // minimal | editorial | dramatic | playful | techy
  "transition": "crossfade" // crossfade | slide-left | zoom | page-turn
}
```

Both are enums; the renderer rejects unknown values at `parseDeck()`.

### The 5 entrance moods

Mood is the way blocks INSIDE a slide enter when the slide becomes
visible. Each block (every `.vsd-block` element) gets a staggered
`--vsd-index` CSS variable; the per-mood CSS uses it to compute a
per-block animation delay.

| `mood` | Entrance pattern | Block-by-block delay | Best for |
|---|---|---|---|
| `minimal` *(default)* | Opacity fade-in. No transform. | 0 ms (all at once) | Default. Clean, fast, never wrong. |
| `editorial` | Opacity fade + 8 px lift, serif italic accent. | 80 ms × `--vsd-index` | Talk-track decks. Editorial / magazine tone. |
| `dramatic` | Clip-path wipe reveal from left. | 150 ms × `--vsd-index` | Reveals, big-number reveals, "ta-da" moments. |
| `playful` | Bounce-in with overshoot. | 60 ms × `--vsd-index` | Kickoff decks, lighter status reviews. |
| `techy` | Character scramble (mono) + fade. | 120 ms × `--vsd-index` | Engineering deep-dives, terminal aesthetic. |

The renderer stamps `data-vsd-mood="${mood}"` on every slide; the
per-mood CSS selectors target that attribute.

### The 4 section transitions

Transition is what happens between TWO slides when navigation fires.
The renderer stamps `data-vsd-transition="${transition}"` on the stage;
the CSS picks up the matching set of keyframes.

| `transition` | Animation | Duration | Best for |
|---|---|---|---|
| `crossfade` *(default)* | Outgoing fades out; incoming fades in. | 320 ms | Default. Never wrong. |
| `slide-left` | Outgoing slides left out; incoming slides left in. | 400 ms | Strong forward direction; status reviews. |
| `zoom` | Outgoing zooms out; incoming zooms in. | 350 ms | Pivot moments; statement → next section. |
| `page-turn` | Outgoing curls out from the right; incoming reveals underneath. | 500 ms | Magazine / editorial decks. |

## Scaffold to emit

A deck with editorial mood + slide-left transition:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Readout",
  "mood": "editorial",
  "transition": "slide-left",
  "slides": [ /* … */ ]
}
```

A deck with minimal mood + crossfade transition (the safe default):

```jsonc
{
  "kind": "deck",
  "title": "Q3 Readout",
  "slides": [ /* … */ ]
}
```

(Omitting `mood` / `transition` gets the defaults — `minimal` +
`crossfade`.)

## Lib functions called

- `parseDeck(input)` — validates `mood` and `transition` against
  `MOODS` and `TRANSITIONS`. Throws with the list of valid values on
  unknown.
- `renderSlide(doc, slide, i, deck)` — stamps `data-vsd-mood` on each
  slide.
- `renderDeck(deck, mountEl)` — stamps `data-vsd-transition` on the
  stage.
- `injectSlideCSS(doc)` — the injected stylesheet contains all 5 mood
  selectors + all 4 transition keyframe sets (~600 lines of CSS).

## DESIGN.md tokens used

| Token | Default | What it themes on motion |
|---|---|---|
| `--vc-duration-fast` | `120 ms` | Hover / dot-active transitions. |
| `--vc-duration-normal` | `200 ms` | Most block fade-ins. |
| `--vc-duration-slow` | `400 ms` | Slide-left transition; hint fade. |
| `--vc-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Block entrance easing (the converged "swift-out" curve). |
| `--vc-ease-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounce overshoot. |

The motion tokens are OPTIONAL in DESIGN.md — every animation rule
carries a canonical fallback. A DESIGN.md without a `motion:` group
still themes the slides correctly (the falls used are the values in
the table above).

## Selection / comment / decision-mini contract notes

Motion does NOT interact with selection / comment state — the entrance
animation runs once per slide first-visible; subsequent
selection/hover/focus events use the runtime's own transitions (the
ones from `amvcp-runtime.js`, NOT the per-mood CSS). This separation
is what keeps the selection ring stable when the user opens a comment
modal mid-deck.

## When to use this reference

Open this ref when:

- Picking `mood` / `transition` for a new deck.
- A deck's motion feels wrong — see "Mood by tone" / "Transition by
  pacing" tables below.
- A user reports motion sickness — the `prefers-reduced-motion`
  override below is the answer.

## Mood by tone

| Tone | Mood |
|---|---|
| Status review, default professional | `minimal` |
| Engineering deep-dive, terminal aesthetic | `techy` |
| Magazine / editorial / talk-track | `editorial` |
| Kickoff, team-building, lighter | `playful` |
| Reveal-driven (big number, before/after) | `dramatic` |

## Transition by pacing

| Pacing | Transition |
|---|---|
| Fast forward / status review | `slide-left` |
| Default / professional | `crossfade` |
| Pivot moment / statement-to-section | `zoom` |
| Editorial / magazine | `page-turn` |

## Don'ts

- Don't mix moods per slide. Mood is a deck-level choice; per-slide
  variation reads as indecision.
- Don't mix transitions per slide. Same reason.
- Don't pick `playful` for a high-stakes decision deck. The bouncy
  entrance undermines the gravity.
- Don't pick `dramatic` for every reveal. Used once or twice it
  earns the "ta-da"; used on every slide it becomes annoying.
- Don't rely on motion to carry the deck. The deck must read with
  `prefers-reduced-motion: reduce` (no animation, instant entrance).
  The reduced-motion gate substitutes EVERY entrance/transition with
  opacity-only / instant — verified per the
  `prefers-reduced-motion` rule in the slide-spec.

## Reduced-motion gate

The renderer respects `prefers-reduced-motion: reduce`. Every per-mood
CSS rule has a matching reduced-motion override that substitutes the
animation with an opacity-only / instant variant — NEVER an
`animation: none` that leaves a block stuck at opacity 0.

```css
@media (prefers-reduced-motion: reduce) {
  .vsd-slide[data-vsd-mood] .vsd-block {
    animation: none !important;
    transition: opacity 80ms ease-out !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

The opacity-1 + transform-none + animation-none combination is the
"correct" reduced-motion default — instant + visible. The 80 ms
opacity transition is for selection state changes (hover, focus),
not for the entrance.

## Visual verification

After picking a mood + transition for a new deck, capture each slide
at 1280×720 in BOTH light and dark via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`. Then:

1. Open `chrome://settings → Accessibility → Reduce motion` and
   verify the deck still renders correctly (no stuck-at-opacity-0
   blocks).
2. Press `→` rapidly through the deck; verify every transition
   completes within ~500 ms (no lag, no skipped frames).
3. Verify the mood's entrance pattern matches the table above (a
   `dramatic` deck should have visible clip-path wipes on each
   block; a `minimal` deck should have a simple fade).
4. The chrome (dots, counter, progress) does NOT participate in the
   per-mood entrance — verify it appears at slide-load, not on a
   delay.

## Source provenance

- SL-08 — Mood-to-Animation Mapping (5 moods → entrance patterns).
  The 5 named moods (minimal, editorial, dramatic, playful, techy)
  are lifted directly.
- SL-10 — 5 content templates + 4 GSAP motion patterns. The 4
  transitions (crossfade, slide-left, zoom-in/zoom, page-turn) are
  the GSAP-motion half, reimplemented as CSS-only (the
  "CSS-only-by-default, GSAP optional" rule from the consolidated
  plan).
- The reduced-motion gate is from slide-spec.md §9.5 — every
  entrance / transition has a matching opacity-only / instant
  reduced-motion variant.
- The "mood ≠ transition" separation (moods are intra-slide,
  transitions are inter-slide) is the converged framing from five
  catalogue sources.
