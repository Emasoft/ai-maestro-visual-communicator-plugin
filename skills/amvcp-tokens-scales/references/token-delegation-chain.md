# Token delegation chain — fallback `var()` strategy

## Table of Contents

- [What it is](#what-it-is)
- [Why both uses](#why-both-uses)
- [When to use delegation](#when-to-use-delegation)
- [When to use fallback](#when-to-use-fallback)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

A scaling strategy: let SECONDARY tokens *delegate* to PRIMARY ones
via `var(--primary, fallback)`, rather than declaring every token
explicitly. Reduces DESIGN.md surface area without losing override
precision. The CSS analogue of the LaTeX `\newcommand{\pathdrawcolor}
{\blockdrawcolor}` macro chain (see
`references/centralised-token-pattern.md`).

## What it is

Two complementary uses of CSS `var(--name, fallback)`:

### 1. Cascade delegation — "secondary defaults to primary"

```css
:root {
  --vc-color-accent: #b8861f;
  --vc-color-link: var(--vc-color-accent);   /* delegates */
  --vc-color-arrow: var(--vc-color-link, currentColor);   /* delegates further */
}
```

The author only needs to override `--vc-color-accent` to re-color
everything downstream — link color, arrow color, and any other
delegated token recompute via inheritance.

### 2. Safety fallback — "if the upstream is missing, use this"

```css
.my-card {
  background: var(--vc-color-surface-raised, #fff);
  padding: var(--vc-space-3, 16px);
}
```

If a DESIGN.md ships WITHOUT a `spacing` group, the engine doesn't
mint `--vc-space-3`, and the `var()` reference would resolve to its
fallback — `16px`. The card stays usable instead of collapsing to
0-padding.

## Why both uses

- **Delegation** is for SCALING the token surface. Without it, every
  derived role needs an explicit declaration; with it, one root
  change propagates.
- **Fallback** is for ROBUSTNESS against partial DESIGN.md inputs.
  A library / widget that uses `var(--vc-color-accent, #2e6fdb)`
  works even if dropped into a page without a DESIGN.md (the
  fallback is the runtime default's heritage honey).

## When to use delegation

- when you're shipping multiple components that should ALL track a
  single brand color (link, arrow, focus-ring, badge accent — all
  delegate to `--vc-color-accent`);
- when you're authoring a derived family that needs to flip with a
  parent token (the entire `--vc-state-*` family in
  `amvcp-tokens.css` delegates to `--vc-color-success/warning/...`).

## When to use fallback

- in EVERY CSS that READS a `--vc-*` token (a widget shouldn't
  assume the host page loaded the engine — fail gracefully with a
  sensible default);
- as the LAST link in a delegation chain (`var(--primary, var(--
  secondary, var(--tertiary, currentColor)))`) — the final fallback
  is `currentColor` or a literal default.

## Scaffold to emit

A library widget that consumes design-tokens with graceful fallback:

```css
.my-widget {
  background: var(--vc-color-surface, white);
  color:      var(--vc-color-content, #1f1a14);
  border:     1px solid var(--vc-color-border, rgba(0, 0, 0, 0.1));
  padding:    var(--vc-space-3, 16px);
  border-radius: var(--vc-radius-md, 8px);
  box-shadow: var(--vc-shadow-2, 0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Delegation chain — derived role tracks the brand accent. */
.my-widget-link {
  color: var(--vc-color-link, var(--vc-color-accent, #2e6fdb));
}
```

A DESIGN.md author who wants to override `link` separately from
`accent` declares both; an author who wants link = accent declares
only accent. Both work.

## Lib functions used

- (no JS — this is a pure CSS authoring pattern)
- the engine's `applyTokens` writes inline-style `--vc-*` values on
  `:root`, which the `var(--vc-…, fallback)` declarations read

## DESIGN.md tokens used

- DEPENDS on the chain's design — every link in the chain reads ONE
  upstream token + a final fallback literal

## Anti-slop interaction

Fallbacks help the slop gate succeed: a widget that always reads
through `var(--vc-color-accent, ...)` has NO literal hex in its
authored CSS (the fallback hex is only used if the engine isn't
loaded — and in that case, the user IS getting a default theme,
which itself is anti-slop heritage honey).

A delegation chain that bottoms out in `currentColor` is even
better — it has NO literal at all, just relies on the inherited
text color of the host.

## Selection / comment / decision-mini contract

The delegation pattern means selection / comment / decision-mini
chrome AUTOMATICALLY tracks any upstream token override. A scoped
theming call (`references/scoped-theming.md`) that changes
`--vc-color-accent` on a sidebar AUTOMATICALLY changes the
sidebar's selection mark, focus ring, link color — every delegated
token recomputes.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — load a custom widget
that uses fallback chains into a page WITHOUT the engine, then WITH
the engine. Screenshot both states in **both themes** (R1):

- without engine — widget uses fallback literals; renders as the
  documented defaults (heritage-ish honey / cream);
- with engine — widget uses engine values; re-themes per the loaded
  DESIGN.md.

The widget's appearance should DIFFER between the two states
exactly as designed (engine values override the fallbacks).

Verify the delegation chain works as expected:

```js
// Override an upstream token and verify the downstream variable's
// computed value tracks it.
document.documentElement.style.setProperty('--vc-color-accent', '#ff6600');
await page.waitForTimeout(0);  // synchronous re-style
const linkColor = await page.evaluate(
  () => getComputedStyle(document.querySelector('.my-widget-link')).color);
// linkColor should be rgb(255, 102, 0) — the new accent — because
// --vc-color-link delegates to --vc-color-accent.
```
