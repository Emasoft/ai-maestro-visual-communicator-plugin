# Ambient & loading — Layers 4 + 5

## Table of Contents

- [Layer 4 — four floating presets](#layer-4--four-floating-presets)
- [Layer 4 — animated link underline (`.va-link`)](#layer-4--animated-link-underline-va-link)
- [Layer 4 — 3D card tilt (`.va-tilt`)](#layer-4--3d-card-tilt-va-tilt)
- [Layer 5 — pulse-ring dot (`.va-pulse`)](#layer-5--pulse-ring-dot-va-pulse)
- [Layer 5 — shimmer skeleton (`.va-skeleton`)](#layer-5--shimmer-skeleton-va-skeleton)

Decorative ambient loops, hover polish, and loading-state placeholders.
All `prefers-reduced-motion` gated, all driven by `--vc-*` tokens.

## Layer 4 — four floating presets

Named CSS utility classes for decorative elements (hero ornaments,
cover-page accents). Use sparingly.

```html
<div class="va-float-y">…</div>   <!-- vertical bob, 3s -->
<div class="va-breathe">…</div>   <!-- scale pulse, 4s -->
<div class="va-orbit">…</div>     <!-- circular orbit, 8s -->
<div class="va-rotate">…</div>    <!-- full spin, 12s -->
```

Loop durations (3s/4s/8s/12s) are intentionally NOT tokenized — they
are preset character, not design-system tokens. The amplitudes (`-16px`
bob distance, `1.05` breathe scale) ARE multiplied by
`--vc-motion-scale` so a theme can damp ambient motion.

**reduced-motion:** these are the ONE case where the substitute is
**removal** — motion is the entire point of a decorative loop, so
omitting the animation loses no meaning. The element sits at rest. The
`reduce` media query simply has no rule for `.va-float-y` etc.

## Layer 4 — animated link underline (`.va-link`)

A CSS-only underline that grows from the left on hover/focus. Built
from a `currentColor` gradient so it inherits the text color — themed
by construction, no `--vc-color-*` reference needed.

```html
<a href="…" class="va-link">a link with an animated underline</a>
```

`:focus-visible` is included so keyboard users get the same affordance
as mouse users.

**reduced-motion:** `transition: none` — the underline appears at full
width instantly on hover.

## Layer 4 — 3D card tilt (`.va-tilt`)

`perspective` + mouse-position `rotateX/rotateY`. The card tilts toward
the pointer; `mouseleave` eases it back to flat.

```html
<div class="va-tilt">card content</div>
```

Tilt magnitude (`10deg` max) is scaled by `--vc-motion-scale`. The
`mouseleave` reset eases via `transition: transform
var(--vc-duration-fast)`.

**reduced-motion:** tilt is disabled entirely (the JS skips wiring).
Keep a static `box-shadow` hover on `.va-tilt` in your own CSS so the
card still responds to hover without the tilt.

## Layer 5 — pulse-ring dot (`.va-pulse`)

An expanding-ring loading indicator for a section that is awaiting
content. The ring is built with `box-shadow` + `color-mix()` so no
`-rgb` companion token is needed — `--vc-color-accent` is a hex string
and `color-mix()` handles the transparency.

```html
<span class="va-pulse" aria-label="loading"></span>
```

**reduced-motion:** a static ring (single `box-shadow`, no expansion).

## Layer 5 — shimmer skeleton (`.va-skeleton`)

A sliding-gradient placeholder for streamed / awaited content. The
gradient is built from `--vc-color-surface-sunken` and
`--vc-color-surface` — the engine resolves both per active theme, so
the skeleton is automatically correct in light AND dark with zero
hardcoded greys.

```html
<div class="va-skeleton va-skeleton--title"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--block"></div>
```

Shape helpers:
- `.va-skeleton--text` — one line, `height: 1em` + vertical margin.
- `.va-skeleton--title` — taller line for a heading placeholder.
- `.va-skeleton--block` — full-height card placeholder.

**reduced-motion:** a flat muted block (`--vc-color-surface-sunken`),
no slide.

When the real content arrives, replace the skeleton node — do not
fade-swap (a fade-swap would itself need a `reduce` branch; a straight
replace is simpler and meaning-equivalent).
