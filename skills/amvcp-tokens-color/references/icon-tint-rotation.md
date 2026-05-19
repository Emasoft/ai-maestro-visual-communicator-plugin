# Icon-tint rotation — 6-color `:nth-child` rotation (DT-12 + DT-15)

## Table of Contents

- [What it does](#what-it-does)
- [When to use](#when-to-use)
- [Scaffold to emit](#scaffold-to-emit)
- [DT-15 — the `--icon-color-rgb` legacy alternative](#dt-15--the---icon-color-rgb-legacy-alternative)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

A 6-color `:nth-child` rotation for icon-card backgrounds. Each
`.vc-icon-card:nth-child(6n+k)` sets `--vc-icon-color` to one stop of
a 6-step golden-angle categorical ramp; the card container uses
`background: color-mix(in srgb, var(--vc-icon-color) 12%, transparent)`.
Authored here, consumed by the `icon-svg` technique.

## What it does

`amvcpTokens.ROLE_MAPS['icon-tint']` declares:

```js
'icon-tint': {
  attr: 'data-vc-role',
  categorical: true,
  base: 'accent',
  cssVarPrefix: '--vc-icon-',
  count: 6
}
```

`renderRoleMapCss('icon-tint', seedAccentHex)` baked-output:

```css
:root {
  --vc-icon-1: <hue0>;   /* seed accent */
  --vc-icon-2: <hue1>;   /* seed + 137.508° */
  --vc-icon-3: <hue2>;
  --vc-icon-4: <hue3>;
  --vc-icon-5: <hue4>;
  --vc-icon-6: <hue5>;
}

.vc-icon-card:nth-child(6n+1) { --vc-icon-color: var(--vc-icon-1); }
.vc-icon-card:nth-child(6n+2) { --vc-icon-color: var(--vc-icon-2); }
.vc-icon-card:nth-child(6n+3) { --vc-icon-color: var(--vc-icon-3); }
.vc-icon-card:nth-child(6n+4) { --vc-icon-color: var(--vc-icon-4); }
.vc-icon-card:nth-child(6n+5) { --vc-icon-color: var(--vc-icon-5); }
.vc-icon-card:nth-child(6n+6) { --vc-icon-color: var(--vc-icon-6); }

.vc-icon-card {
  color: var(--vc-icon-color);
  background: color-mix(in srgb, var(--vc-icon-color) 12%, transparent);
}
```

The 6 hues are golden-angle-rotated off the seed accent. The
`:nth-child(6n+k)` rotation means a list of 18 cards cycles through
all 6 colors three times — no manual color assignment per card.

## When to use

The pattern is for ICON GRIDS — a list of feature cards, a benefits
section, a "what we do" overview where each card carries an icon and
a label. The visual differentiation is automatic; the author writes
nothing per card except the icon and the label.

Don't use the rotation when:

- the icons have INTRINSIC color meaning (a "warning" icon shouldn't
  be tinted blue because it lands at `:nth-child(6n+3)`);
- the cards are in a specific narrative order (the rotation breaks the
  ordering — `:nth-child(7)` is the same color as `:nth-child(1)`).

In those cases, set `--vc-icon-color` explicitly per card or use a
semantic role (`MUST`/`IMO`/etc.).

## Scaffold to emit

```html
<script>
  var accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--vc-color-accent').trim();
  document.head.insertAdjacentHTML('beforeend',
    amvcpTokens.renderRoleMapCss('icon-tint', accent));
</script>

<section class="vc-icon-grid">
  <div class="vc-icon-card">
    <svg class="vc-icon"><!-- icon 1 --></svg>
    <h3>Analytics</h3>
    <p>Real-time dashboards over your business KPIs.</p>
  </div>
  <div class="vc-icon-card">
    <svg class="vc-icon"><!-- icon 2 --></svg>
    <h3>Revenue</h3>
    <p>MRR / ARR tracking with cohort analysis.</p>
  </div>
  <!-- … 4 more cards … -->
</section>
```

The CSS layout (`vc-icon-grid` as a CSS grid; `vc-icon-card` as a
flex column) lives in the icon-svg skill — design-tokens just
defines the tint behaviour.

## DT-15 — the `--icon-color-rgb` legacy alternative

DT-15 documented a parallel pattern using a bare RGB triple variable:

```css
.icon-analytics { --icon-color-rgb: 37, 99, 235; }
.icon-container {
  background: rgba(var(--icon-color-rgb), 0.12);
  color:      rgb(var(--icon-color-rgb));
}
```

This works but introduces a SECOND token vocabulary (`--icon-color-rgb`
vs the rest of the artifact's `--vc-*`). The icon-tint role-map
supersedes it: use `--vc-icon-color` everywhere and let `color-mix`
handle the tint. DT-15 is documented here for COMPLETENESS — don't
emit it in new artifacts.

## Lib functions used

- `amvcpTokens.renderRoleMapCss('icon-tint', seedAccentHex)` →
  `<style>` text block
- `amvcpTokens.generateCategoricalHues(seedAccentHex, 6)` — the raw
  hue array

## DESIGN.md tokens used

- reads (typical): `colors.<theme>.accent`
- emits: `--vc-icon-1` … `--vc-icon-6` + the `.vc-icon-card` rotation
- reads (per icon-card): `--vc-icon-color` (set by the rotation)

## Anti-slop interaction

Same guarantees as every categorical role map: no banned hex (the
seed is linted, the rotation moves away from the banned region), no
gradients, no glassmorphism. The tint is a `color-mix(...
transparent)` so it composes against ANY surface (the card can sit
on `surface`, `canvas`, or `surface-raised` — the tint reads
correctly).

## Selection / comment / decision-mini contract

Icon cards are interactive surfaces — they typically link somewhere
or expand on click. Wrap them in `<a class="vc-state vc-icon-card">`
to get the standard hover overlay; selection inside the card's
label / prose works normally.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render a grid of 12
icon cards (forcing the rotation to repeat once) under `dev-browser`.
Screenshot in **both themes** (R1) and verify:

1. cards 1–6 each have a distinct tint;
2. cards 7–12 repeat the same sequence as 1–6 (proof the rotation
   wraps correctly via `:nth-child(6n+k)`);
3. on dark theme, tints are still visible but darker (the
   `color-mix(... transparent)` correctly composes against the dark
   canvas);
4. no card's tint reads as "the same hue as the body text" (a sign
   the seed was too desaturated — the chroma clamp in
   `generateCategoricalHues` should prevent this, but verify).
