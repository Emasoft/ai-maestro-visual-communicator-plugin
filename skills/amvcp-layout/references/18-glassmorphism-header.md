# 18 — Glassmorphism sticky header (the `.la-header--glass` modifier)

An optional flavour of the sticky header (ref 17) that uses
`backdrop-filter: blur()` over a semi-transparent surface tint to
produce the "frosted glass" effect now common in modern macOS / iOS
apps. The mechanism uses `color-mix(in srgb, --vc-color-surface 80%,
transparent)` over the engine's surface token, so the glass is
theme-correct in BOTH light and dark with no hardcoded `rgba()`.

## What this is

The glass header is the same `.la-header` from ref 17, plus a
modifier class `.la-header--glass` that:
- Replaces the opaque background with a `color-mix(…transparent)`
  derived from the engine's surface token.
- Adds `backdrop-filter: blur(14px)` to blur the page content
  behind the header.

The `color-mix()` function is the key trick: instead of hardcoding
`rgba(255, 255, 255, 0.8)` (correct in light theme, WRONG in dark),
the rule asks "give me 80% of the current surface token, mixed with
20% transparent". On light theme, that's 80% of light surface; on
dark theme, that's 80% of dark surface. The glass is theme-correct
for free.

The `backdrop-filter: blur(14px)` is the blur effect. The
`-webkit-backdrop-filter` prefix is shipped alongside for Safari
support. 14px is the canonical "comfortable but not extreme" blur
radius from iOS / macOS conventions.

## Scaffold to emit

The same header from ref 17, with the modifier class added:

```html
<header class="la-header la-header--glass" data-ve-id="page-header" data-ve-type="section">
  <span class="la-header__title">Report title</span>
  <nav class="la-header__nav">
    <a href="#section-1">Overview</a>
    <a href="#section-2">Details</a>
  </nav>
</header>
```

The CSS modifier ships in `amvcp-layout.css`:

```css
.la-header--glass {
  background: color-mix(in srgb, var(--vc-color-surface, #ffffff) 80%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}
```

Note: the base `.la-header` already declares `background:
var(--vc-color-surface)` (opaque), which the modifier overrides with
the transparent mix. The default header is OPAQUE; glass is the
opt-in.

## Why glass is opt-in (not default)

Three reasons:
1. **`backdrop-filter` has a performance cost.** Each frame, the
   browser has to apply a 14px Gaussian blur to whatever is behind
   the header. On low-end devices, this can cause scroll jank.
2. **Glass doesn't read as cleanly on busy backgrounds.** A page
   with a dense colourful chart at the top will produce a busy,
   distracting blur. A clean, opaque header is more legible in
   most cases.
3. **The glass aesthetic is fashionable, not eternal.** Default
   visual styles should be conservative; aesthetic flavours should
   be opt-in modifiers. When fashion changes, the default is
   unchanged.

The opt-in pattern means: if you want glass, add `.la-header--glass`.
If you don't, do nothing; the default is opaque.

## Lib functions called

- Same as ref 17: `initStickyHeader()` injects the sentinel and
  toggles `.is-scrolled`. The glass modifier doesn't affect the
  scroll-state logic.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-color-surface` | (theme) | base for the `color-mix` |
| (`14px` blur is hardcoded) | — | not a token |
| (rest is inherited from `.la-header`) | — | see ref 17 |

The `14px` blur radius is intentionally NOT a token — blur radius
is a visual-effect parameter, not a design-system primitive. The
DESIGN.md engine has no blur token group, and a single value
(14px) covers virtually all glass uses.

## The browser compatibility caveat

`backdrop-filter` has good support in 2026 (Chrome, Safari, Edge,
Firefox 103+), but is occasionally disabled by accessibility
settings ("reduce transparency" on macOS). In those cases:

- Safari respects the user setting and renders the glass as opaque
  (with the `color-mix` background showing the 80%-opacity
  surface). This is graceful — the header is still visible, just
  not blurred.
- Chrome on some Linux distributions may render the blur as a flat
  semi-transparent tint without the actual blur effect (driver
  issue). Still legible.

If glass is critical to the page aesthetic, ship a fallback:

```css
@supports not (backdrop-filter: blur(14px)) {
  .la-header--glass {
    /* No blur available — fall back to fully opaque surface. */
    background: var(--vc-color-surface);
  }
}
```

This is rare; the layout technique ships glass as an opt-in
modifier WITHOUT the `@supports` fallback (opt-in = author knows
the tradeoff).

## Selection / comment / decision-mini contract notes

Same as ref 17. The glass modifier is purely visual; it does not
change the selection model. The header is still a selectable atom
(`data-ve-type="section"`); its child links are not.

## When to use glass

- A hero header where the page-top has a decorative image / hero
  background (ref 29) and the glass tint integrates the header
  with the hero.
- A modern-feeling app shell (admin dashboards, settings pages).
- A long-form article where the glass softens the visual jump from
  full-bleed cover to body text.

When NOT to use:
- A print-only / PDF-only page (the `@media print` block already
  hides the sticky header; glass would be invisible).
- A page with a busy multi-colour background at the top (glass
  produces a messy blur).
- A low-spec target (older mobile, embedded browsers) where the
  blur cost is significant.

## Visual verification

Run the universal self-debug checklist before claiming the glass
header is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For glass header correctness specifically:

- Open dev-browser. Verify the background mix:
  ```js
  const header = document.querySelector('.la-header--glass');
  const cs = getComputedStyle(header);
  console.log('bg:', cs.background);
  console.log('backdrop-filter:', cs.backdropFilter);
  ```
  The background should resolve to a `color-mix(in srgb, …)`
  value (or the computed rgba equivalent), and `backdropFilter`
  should be `blur(14px)`.
- **R1 — Light + dark themes**: switch themes; verify both
  themes' glass is correct. The light theme should look like
  "frosted white"; the dark theme should look like "frosted
  dark" — NOT both look the same (a hardcoded `rgba(255,255,255,
  0.8)` would look wrong in dark; the `color-mix` over the surface
  token is the fix).
- The visual check: open the rendered page in dev-browser, take
  a screenshot in both themes. The glass header should integrate
  visually with the content below (its colour mixes with the
  scrolling content), NOT look like a hard-edged overlay.
- The "page has dense content behind the header" check: scroll a
  page with a chart / table near the top until the chart is
  visually behind the header. The blur should soften the chart's
  hard edges without obscuring the header text.
- **R2 — No nested scrollbars**: the glass modifier doesn't
  introduce any overflow rules; the no-nested-scrollbars check is
  unchanged from ref 17.

## The blur radius spectrum

`blur(14px)` is the canonical "comfortable" glass radius. The
spectrum:

| Radius | Effect | Use |
|---|---|---|
| `blur(2px)` | Faint blur, almost imperceptible | Not really glass — just a soft veil |
| `blur(6px)` | Subtle blur | Conservative glass, conservative aesthetic |
| `blur(14px)` | Standard glass | iOS / macOS canonical (this layout) |
| `blur(20px)` | Heavy blur | Strong glass, dominant decorative element |
| `blur(40px)` | Extreme blur | Hardcore aesthetic; performance hit |

For most uses, `14px` is right. Larger values cost more GPU
time per frame; smaller values look like a tinted overlay
without the "glass" character.

## The opacity in the color-mix

The layout uses `80%` opacity for the glass background:

```css
background: color-mix(in srgb, var(--vc-color-surface) 80%, transparent);
```

The `80%` is the surface token's contribution; the remaining
`20%` is transparent. So the header is "80% opaque surface,
20% see-through".

Variants:
- `90% surface, 10% transparent` — barely transparent, glass
  effect minimal.
- `60% surface, 40% transparent` — heavy see-through, content
  behind is more visible.
- `40% surface, 60% transparent` — very transparent, glass is
  the dominant effect.

For a header that needs the title CLEARLY visible at all
times, lean toward 80-90% surface. For a hero overlay where
the content behind is part of the design, 40-60% surface
works.

## Combining glass with the hero (ref 29)

A hero band (`.la-hero`) directly under a glass header is a
common pattern: the hero's decorative glows show THROUGH the
header glass, producing a coherent, layered visual.

```html
<header class="la-header la-header--glass">…</header>
<section class="la-hero" data-ghost="REPORT">
  <div class="la-hero__content">
    <h1>Title</h1>
  </div>
</section>
```

The hero's `::before` glow paints UNDER the header (since the
header is `position: sticky` and stays at the top while the
hero scrolls past). When the hero is at the top of the
viewport, the glow is visible through the glass; when the hero
scrolls past, the glass over the body content is opaque-ish.

## Performance notes

`backdrop-filter: blur()` is GPU-accelerated on most platforms
but can cause:
- **Scroll jank** on low-end devices when the page scrolls
  underneath.
- **Battery drain** on mobile (continuous GPU work).
- **Visual artifacts** during fast scrolling (the blur lags
  the scroll position briefly).

For most desktop browsers, the cost is negligible. For
mobile-first / battery-conscious targets, consider:
- Disabling glass on mobile via `@media (max-width: 768px) {
  .la-header--glass { background: var(--vc-color-surface);
  backdrop-filter: none; } }`.
- Using a fully-opaque header by default and only enabling
  glass on desktop.

## Accessibility considerations

The "reduce transparency" accessibility setting (macOS / iOS)
asks browsers to disable transparent UI. Safari respects this
and renders the glass as fully opaque. Chrome / Firefox are
inconsistent — some respect the setting, some don't.

For maximum accessibility, ship the glass as opt-in (which it
is — `.la-header--glass` is the modifier, NOT the default).
Users who need consistency get the opaque default; users who
want the aesthetic opt in.
