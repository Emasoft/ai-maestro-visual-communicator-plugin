# Entry & scroll animation — Layers 2 + 3

Staggered entry, fire-once scroll reveal, the cinematic scroll-pattern
catalog, and the stat counter. All themed off `--vc-*`, all
`prefers-reduced-motion` safe.

## Layer 2 — staggered entry (`.va-stagger`)

Cards / list items / grid cells fade-and-rise in sequence. Each item
carries a `--va-index` custom property; the per-index delay is
`--va-index * --vc-duration-stagger-step`.

**Static markup** (works with JS off — author the index inline):

```html
<ul class="va-stagger" data-va-stagger>
  <li class="va-stagger-item" style="--va-index:0">First item</li>
  <li class="va-stagger-item" style="--va-index:1">Second item</li>
  <li class="va-stagger-item" style="--va-index:2">Third item</li>
</ul>
```

**Dynamic markup** (runtime-generated lists — the indexer fills it):

```html
<ul class="va-stagger" data-va-stagger>
  <li class="va-stagger-item">…</li>   <!-- no inline --va-index -->
</ul>
```

The `[data-va-stagger]` attribute marks the container for the indexer.
A manually-authored `--va-index` is respected — the indexer only fills
items that lack one.

`animation-fill-mode: both` is essential: it holds the item at
`opacity: 0` BEFORE its delayed animation starts. Without `both` the
items flash visible, then animate.

**reduced-motion:** the `vaFadeOnly` substitute — opacity-only, no
transform, no per-index delay. The card still appears; it just does
not travel or cascade.

## Layer 3 — fire-once scroll reveal (`data-va-reveal`)

A single `IntersectionObserver` (`threshold: 0.15`,
`rootMargin: '0px 0px -50px 0px'`) reveals each element once, then
`unobserve`s it.

```html
<section data-va-reveal>            <!-- default: fade + rise -->
<section data-va-reveal="fade">     <!-- fade only -->
<section data-va-reveal="scale">    <!-- fade + scale-up from 0.94 -->
<section data-va-reveal="clip">     <!-- clip-path wipe reveal -->
<section data-va-reveal="stagger">  <!-- children cascade on reveal -->
```

`data-va-reveal="stagger"` combines Layer 2 + Layer 3: the observer
adds `.va-in` to the container, the `.va-stagger-item` children
transition in with a per-`--va-index` `transition-delay`. The reveal
engine indexes a `stagger` container before observing it.

**Fail-safe:** if `IntersectionObserver` is unavailable the engine
reveals every target immediately. Failing visible is correct — content
must never be stuck at `opacity: 0`.

**reduced-motion:** fade-only on intersect, no transform.

## Layer 3 — stat counter (`.va-counter`)

A rAF count-up `0 → N` with an `easeOutCubic` curve. Duration from
`--vc-duration-slow`. Wired to the SAME `IntersectionObserver` — a
`.va-counter` is a reveal target whose reveal action is the count-up.

```html
<span class="va-counter" data-va-stat="45200">0</span>
<span class="va-counter" data-va-stat="98.6"
      data-va-stat-decimals="1" data-va-stat-suffix="%">0</span>
```

`data-va-stat` is the target value. `data-va-stat-decimals` (default 0)
and `data-va-stat-suffix` (default empty) are optional.

**Fail-fast:** a non-numeric `data-va-stat` is skipped — the element
keeps its placeholder text.

**reduced-motion:** the final value is set immediately, no tick loop.

`animateStat(el)` is exported on the public API — the `chart` skill
consumes it directly as a KPI-card primitive instead of re-implementing
a count-up.

## Layer 3 — cinematic scroll-pattern catalog

Opt-in classes + `data-va-scroll` attributes. Modern browsers use
native `animation-timeline: scroll()` / `view()`; older browsers get a
`--va-scroll-y` fallback fed by a passive, rAF-coalesced scroll
listener. **8 catalog entries ship** — `horizontal` is deliberately
excluded because a horizontal-scroll container creates an inner scroll
axis (no-nested-scrollbars rule).

| entry | mechanism | reduced-motion |
|---|---|---|
| `parallax` | `.va-parallax-1`..`6`, depth factors 0.10/0.25/0.50/0.80/1.00/1.20 driven by `--va-scroll-y` | no transform |
| `pinned` | `position: sticky; top: 0` + inner `view()` timeline | static |
| `stacking` | sticky cards, incrementing `z-index`, `view()` scale-down | static stack |
| `scrub` | `animation-timeline: scroll()` + `animation-range` | final frame |
| `clip-reveal` | `clip-path` inset wipe on a `view()` timeline | shown |
| `snap` | `.va-snap-root` (`scroll-snap-type` on the PAGE ROOT) + `.va-snap-item` | snap kept (no motion) |
| `rotate-3d` | `perspective` + `rotateY` on a `view()` timeline | static |
| `progress-bar` | `.va-progress-bar`, fixed 3px, `scaleX` driven by `--va-progress` | bar shown |

Parallax is **P3** — use sparingly; too many layers makes scrolling
janky. The scroll listener writes `--va-scroll-y` and `--va-progress`
on `:root` from `window.scrollY` — the document's own scroll axis,
never an inner `overflow:scroll` element.
