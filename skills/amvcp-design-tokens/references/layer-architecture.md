# `@layer` architecture — primitive < semantic < component (DM-08)

## Table of Contents

- [What it does](#what-it-does)
- [Why this order](#why-this-order)
- [Why empty `ve-primitive`?](#why-empty-ve-primitive)
- [Host-page interactions](#host-page-interactions)
- [When to add things to which layer](#when-to-add-things-to-which-layer)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The 3-tier CSS `@layer` cascade emitted HTML uses to keep component CSS
from ever out-specifying the token tier. Documented separately from
`token-vocabulary.md` because the layer model is its own subject — when
to use which layer, how the primitive tier wins anyway, how host-page
Tailwind interacts.

## What it does

Every artifact's `<style>` opens with one declaration line:

```css
@layer ve-primitive, ve-semantic, ve-component;
```

This **declares the layer order** without putting anything in those
layers yet. Later in the same stylesheet (or in `amvcp-tokens.css`):

| Layer | Contents | Source |
|---|---|---|
| `ve-primitive` | (empty — the engine puts primitives at `:root` inline-style instead, which beats every layer) | — |
| `ve-semantic` | derived state-color split, `--vc-focus-ring`, `--vc-selection-bg`, `--vc-on-surface-{strong, medium, subtle}` | `amvcp-tokens.css` |
| `ve-component` | `.vc-state` overlay, the contact-sheet chrome, the `.vc-*` Tailwind-shaped utilities, the role-map family | `amvcp-tokens.css` |

## Why this order

Later layers win. So a component class like `.vc-bg-accent` (in
`ve-component`) beats a derived semantic-tier color, which beats a
primitive — exactly the cascade designers expect.

But the engine's `applyTokens` sets the `--vc-*` primitives as INLINE
STYLE on `document.documentElement` — inline always wins. So in
practice:

```
:root (inline style)    ← --vc-color-accent: #b8861f   ← engine
  └─ ve-semantic        ← --vc-state-success-bg: …    ← amvcp-tokens.css
       └─ ve-component  ← .vc-state, .vc-bg-canvas    ← amvcp-tokens.css
```

The inline `--vc-color-accent` always wins, semantic derivations
compose against it via `color-mix`, and component classes pull the
final value. Theme swap → engine re-applies inline → entire chain
recomputes.

## Why empty `ve-primitive`?

We declare it so a future enhancement (e.g. shipping per-theme
"primitive" tokens in CSS instead of via JS) has a layer to land in
without re-ordering. Declaring a layer empty has no cost — it's a
forward-compatibility marker.

## Host-page interactions

When the artifact is embedded in a host page that uses Tailwind v4:

- Tailwind v4's recommended `@layer reset, tokens, base, components,
  utilities;` is unaware of ours, so it lands in the un-layered tier
  that BEATS our layered tier — exactly what we want, because the
  host's component classes (e.g. `.bg-red-500`) should win over our
  `.vc-bg-accent` token-driven equivalents.
- BUT the engine's INLINE style still wins over Tailwind, so the
  page's `--vc-color-accent` stays brand-correct.
- And our `.vc-*` namespace prevents collisions outright — `vc-bg-accent`
  ≠ Tailwind's `bg-red-500`.

## When to add things to which layer

| If you are emitting … | Put it in … |
|---|---|
| a `--vc-*` derivation that needs to be theme-aware (`color-mix(... var(--vc-color-surface))`) | `ve-semantic` |
| a component class with reusable shape (a tooltip, a chip, a card) | `ve-component` |
| a one-off page-specific override (e.g. `.this-particular-card`) | un-layered (so it wins) |
| a primitive token value (a literal hex, a literal px) | NEVER write these in CSS — put them in DESIGN.md so the engine emits them |

## Scaffold to emit

The pattern is in the boilerplate every artifact ships:

```html
<style>
  @layer ve-primitive, ve-semantic, ve-component;

  /* engine sets --vc-* on :root inline at runtime */

  /* the rest of amvcp-tokens.css gets pulled in via:
     <link rel="stylesheet" href="amvcp-tokens.css">
     which already declares its rules inside ve-semantic / ve-component */
</style>
```

For per-page additions:

```html
<style>
  @layer ve-component {
    .my-callout {
      background: var(--vc-color-surface-raised);
      border: 1px solid var(--vc-color-border-strong);
      padding: var(--vc-space-3);
    }
  }
</style>
```

## Lib functions used

- (no JS) — this is a CSS architecture pattern
- `amvcp-tokens.css` ships `@layer ve-primitive, ve-semantic,
  ve-component;` and the contents of `ve-semantic` and `ve-component`

## DESIGN.md tokens used

- reads (via the layered CSS): every `--vc-*` token the artifact ends
  up using — the layer model is about CASCADE PRECEDENCE, not about
  token surface

## Anti-slop interaction

Slop-shaped artifacts pack everything into `:root { … }` and `body { … }`
with `!important` everywhere. The layered architecture is the
opposite — you almost never need `!important` because the layer order
guarantees the right tier wins.

If you find yourself writing `!important` to make a component class
beat a derived state, the right fix is usually "put the rule in
`ve-component` instead of un-layered" — by virtue of being in a later
layer, it would have won naturally.

## Selection / comment / decision-mini contract

The selection style (`::selection { background: var(--vc-selection-bg); }`)
sits in `ve-semantic` because it's a derivation of the accent. Comment
threads and decision-mini widgets put their CHROME in `ve-component`
(card shape, hairline borders, internal padding) and pull their COLORS
through the cascade — never hard-coding.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the emitted page,
inspect any element's computed `background-color` in DevTools, and
trace the source — it should resolve to a `--vc-*` token that itself
resolves to the engine's inline-`:root` value. A trace that bottoms
out in a literal hex in some component class is a smell (slop incoming).

Confirm there's NO `@media (prefers-color-scheme: dark)` in the
emitted CSS (other than the `prefers-reduced-motion` block — that's
not theme-related). The dual-theme flip is supposed to happen via the
engine's `applyTokens` swapping inline `--vc-*` values, never via a
CSS media-query fork.
