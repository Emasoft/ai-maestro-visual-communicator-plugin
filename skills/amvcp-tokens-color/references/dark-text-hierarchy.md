# Dark text hierarchy — 3-tier on-surface set (DT-08)

## Table of Contents

- [What it does](#what-it-does)
- [When to use which tier](#when-to-use-which-tier)
- [When to use the on-surface family vs. the engine's content roles](#when-to-use-the-on-surface-family-vs-the-engines-content-roles)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

A three-tier text hierarchy derived from the engine's single `content`
role via `color-mix` against the active surface. Works on ANY surface
because the mix percentages compose: 100% content / 72% content / 48%
content produce strong / medium / subtle text tiers that always read
correctly because they're mixed AGAINST whatever surface they're
sitting on.

## What it does

`amvcp-tokens.css` (in `ve-semantic`) ships:

```css
--vc-on-surface-strong: var(--vc-color-content);
--vc-on-surface-medium: color-mix(in srgb, var(--vc-color-content) 72%, var(--vc-color-surface));
--vc-on-surface-subtle: color-mix(in srgb, var(--vc-color-content) 48%, var(--vc-color-surface));
```

The percentages (100 / 72 / 48) are the production-proven values that
land in the WCAG-pass contrast zone for both themes when `content` and
`surface` are chosen sanely.

## When to use which tier

| Tier | Use |
|---|---|
| `--vc-on-surface-strong` | h1 / h2 / body paragraphs / primary CTAs |
| `--vc-on-surface-medium` | secondary captions, sub-labels, "Continue reading" affordances |
| `--vc-on-surface-subtle` | timestamps, helper text, microcopy, file paths |

This maps onto the broader 5-layer naming (token-vocabulary.md): tier 3
content → `content` / `content-muted` / `content-subtle`. The
on-surface family is a CSS shortcut for the same three tiers, suitable
for the most common case (text laid over `--vc-color-surface`). When
text lands on a NON-surface region (an accent button, a chip), use the
engine's explicit `content-muted` / `content-subtle` directly with
their own bg context.

## When to use the on-surface family vs. the engine's content roles

| Use `--vc-on-surface-*` when | Use `--vc-color-content-*` when |
|---|---|
| text sits over a regular `surface` (a card, a panel) | text sits over the page `canvas` (body paragraphs, hero text) |
| you want a graceful degradation to "looks darker than bg" without thinking | you want the explicit semantic role |

In practice the difference is small — `--vc-color-canvas` and
`--vc-color-surface` are close hex neighbours per theme, so the mixes
land at near-equal values.

## Scaffold to emit

Authors NEVER write this — it's a derived family in `amvcp-tokens.css`.
The agent uses it via the `.vc-on-surface-{strong,medium,subtle}`
utility classes:

```html
<article>
  <h2 class="vc-on-surface-strong">Section heading</h2>
  <p class="vc-on-surface-strong">Body text reads at full contrast.</p>
  <p class="vc-on-surface-medium">A secondary caption sits at 72%.</p>
  <small class="vc-on-surface-subtle">Last updated 2026-05-15</small>
</article>
```

(Note: the `.vc-on-surface-*` utility classes follow the same
namespacing convention as the rest of the family — if not yet shipped
in `amvcp-tokens.css`, they can be added in the `ve-component` layer
without any DESIGN.md author work.)

## Lib functions used

- (CSS only) — `amvcp-tokens.css` defines the derived
  `--vc-on-surface-{strong,medium,subtle}` set in the `ve-semantic`
  layer
- pair with `amvcpTokens.contrastRatio` to verify the mixed values
  hit WCAG when authoring an unusual `content` ↔ `surface` pairing

## DESIGN.md tokens used

- reads: `colors.<theme>.content` and `colors.<theme>.surface` (both
  themes — the mix flips per theme automatically)
- emits (derived): `--vc-on-surface-{strong, medium, subtle}`

## Anti-slop interaction

Slop is `rgba(255,255,255,0.95)` / `rgba(255,255,255,0.60)` /
`rgba(255,255,255,0.38)` hardcoded for "dark theme" — and a fork to
`rgba(0,0,0,0.95)` / `rgba(0,0,0,0.60)` / `rgba(0,0,0,0.38)` for
"light theme". The on-surface family is the structural fix — one
`content` role + `color-mix` against the active surface gives the
same hierarchy automatically, in either theme, without forks.

The fact that this is a `color-mix(... var(--vc-color-surface))`
derivation also means the family adapts to scoped theming
(`references/scoped-theming.md`) — a parchment-themed sidebar's
on-surface text reads against parchment, not against the host page's
surface, automatically.

## Selection / comment / decision-mini contract

The three on-surface tiers cooperate with selection: a `subtle`
timestamp selected by the reader still reads through the
`--vc-selection-bg` overlay because the overlay is itself a low-alpha
accent mix, not an opaque paint. Subtle text + selection overlay
remains legible — verify in both themes.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — screenshot a paragraph
that uses all three tiers in **both themes** (R1). Assert
`contrastRatio('--vc-on-surface-strong', '--vc-color-surface') >= 7.0`
(AAA for body), `>= 4.5` for medium (AA for body), `>= 3.0` for subtle
(AA for large/secondary text). Failures usually mean `content` is too
close to `surface` (a low-contrast theme); the structural fix is to
shift `content` further from `surface`, NOT to lower the mix
percentages (which would only make the subtle tier worse).
