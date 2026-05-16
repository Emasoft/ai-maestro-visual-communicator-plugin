# Reduced-motion substitutes — accessible hover affordances

`prefers-reduced-motion: reduce` is an OS-level user preference. When
it's ON, the icon-svg module's hover animations (the hotspot scale,
any future motion-based affordance) are REPLACED with a STATIC
visual alternative. Not "remove animation" — replace with a static
cue. The reader still gets the affordance, just without the motion.

## The contract

Every motion-bearing affordance in icon-svg has TWO CSS rules:

```css
@media (prefers-reduced-motion: no-preference) {
  /* The motion variant */
  .target:hover { transform: scale(1.18); }
}
@media (prefers-reduced-motion: reduce) {
  /* The static substitute */
  .target:hover { box-shadow: 0 0 0 3px <accent>; }
}
```

Both rules attach the SAME visible affordance — the user sees
something on hover regardless of their motion preference. The
difference is HOW the affordance manifests:

- No-preference: scale animation, smooth.
- Reduce: static ring, instant.

## The implemented case — hotspot hover

The hotspot's CSS (injected by `amvcp-icon-svg.js`):

```css
@media (prefers-reduced-motion: no-preference) {
  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {
    transform: translate(-50%, -50%) scale(1.18);
  }
}
@media (prefers-reduced-motion: reduce) {
  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb,
      var(--vc-color-accent, #b8861f) 35%, transparent);
  }
}
```

The motion variant scales the hotspot to 118%; the reduce variant
adds a 3px translucent accent ring around the hotspot. Both signal
"this is the focus / hover state" — the visual emphasis is
equivalent.

## Why "no-preference" not the default

The DEFAULT CSS (outside any media query) has NO hover affordance.
The motion rule is wrapped in `@media (prefers-reduced-motion:
no-preference)` to MAKE THE NO-MOTION CASE THE DEFAULT FALLBACK.

If we wrote:

```css
.isvg-hotspot:hover { transform: scale(1.18); }
@media (prefers-reduced-motion: reduce) {
  .isvg-hotspot:hover { transform: none; box-shadow: 0 0 0 3px ...; }
}
```

The fallback (no media-query support) would be the motion variant —
which an old browser without motion-query support would always
apply. That's wrong for accessibility.

The correct pattern (used in icon-svg's CSS):

- DEFAULT: no hover affordance.
- `@media (prefers-reduced-motion: no-preference)`: scale animation.
- `@media (prefers-reduced-motion: reduce)`: static ring.

Old browsers fall through to the default (no affordance) — which is
preferable to "always animate, no respect for reduced-motion".

## When to apply this pattern

Every motion-bearing affordance in icon-svg MUST have a reduce
substitute. Audit list:

- Hotspot hover (DONE — see above).
- Any future "appear on hover" tooltip (NOT YET — icon-svg has no
  tooltips).
- Any future animated arrow / icon transition (NOT YET — icon-svg
  has no animated icons; the `animation` skill owns animations).
- Decision-mini-pill hover (the runtime owns this — check the
  runtime's CSS).

## What kinds of substitutes work

- **Static ring** — `box-shadow: 0 0 0 Npx <color>` (used for
  hotspot).
- **Color shift** — change `background-color` / `border-color`.
- **Outline appearance** — `outline: 2px solid <color>`.
- **Underline / strikethrough** — `text-decoration` (for text
  affordances).
- **Cursor change** — `cursor: pointer` (always set, even with
  motion).

What does NOT work:

- Hiding the affordance entirely — reader thinks the element is
  unreachable.
- Using `transition: none` alone — that's "no animation" but
  doesn't tell the user the element is hoverable.

## Testing

In dev-browser, set the emulated `prefers-reduced-motion` via:

```js
await page.emulateMediaFeatures([
  { name: 'prefers-reduced-motion', value: 'reduce' }
]);
```

Then hover over hotspots and confirm:

1. NO transform / scale happens.
2. A static ring appears around the hotspot.
3. The ring uses the accent color at ~35% opacity.

Switch the emulation back:

```js
await page.emulateMediaFeatures([
  { name: 'prefers-reduced-motion', value: 'no-preference' }
]);
```

And confirm:

1. Hover does the scale animation.
2. The animation is smooth.
3. NO static ring appears.

## DESIGN.md tokens consumed

- `--vc-color-accent` — the static ring base color
- `--vc-duration-fast` / `--vc-easing-standard` — animation timing
  (no-preference case)

## Why this matters

`prefers-reduced-motion` users have:

- Vestibular disorders — motion triggers nausea / dizziness.
- Cognitive load — motion distracts from content reading.
- Battery / performance constraints — motion costs power.
- Personal preference — calm interfaces.

A page that ignores reduced-motion forces motion on users who can't
handle it. icon-svg's contract makes the affordance accessible to
everyone WITHOUT removing the visual cue.

## Visual verification

Run the self-debug rules check (R5 — reduced motion compliance) in
`skills/amvcp-self-debug-rules/SKILL.md`. Confirm every motion-bearing
affordance has a static substitute.
