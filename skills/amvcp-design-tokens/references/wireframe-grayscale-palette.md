# Wireframe grayscale palette — zero-hue, zero-radius (DT-24)

## Table of Contents

- [What it is](#what-it-is)
- [When to pick](#when-to-pick)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

A pure-grayscale palette with all radii pinned to 0. The fidelity-lock
preset: no color (so no visual association can leak in), zero radius
(so no implied "polished" feel), no shadows (so no implied
elevation hierarchy). Forces low-fidelity, prevents wireframe from
becoming a mockup.

## What it is

`amvcpTokens.PRESETS['wireframe-grayscale']`. Distinguishing features:

| Token | Light | Dark |
|---|---|---|
| `canvas` | `#f4f4f4` near-grey-off-white | `#0b0b0b` near-black |
| `accent` | `#4d4d4d` mid grey | `#b3b3b3` light grey |
| `content` | `#1a1a1a` near-black | `#e8e8e8` near-white |

Every color in the entire palette is a desaturated grey
(`#1a1a1a` … `#f4f4f4` for light; `#0b0b0b` … `#e8e8e8` for dark).
The "accent" is just a darker / lighter grey than the body text —
it's an EMPHASIS, not a hue.

Typography:

- `font-heading`: `system-ui, -apple-system, Segoe UI, sans-serif` —
  same as body (no display-serif emphasis)
- `font-body`: `system-ui, -apple-system, Segoe UI, sans-serif`
- `font-mono`: `ui-monospace, Menlo, monospace`

Radius scale: `[0, 0, 0, 0, 0]` — every step is 0px. Cards are
sharp-cornered rectangles. The `full` step stays at 9999 so a
genuine pill (e.g. a filter tab) remains a pill.

## When to pick

- early-stage wireframes — "boxes and arrows" stage where committing
  to color would be premature;
- structural reviews — when the conversation is about LAYOUT and
  HIERARCHY, not BRAND;
- print-friendly tech docs — diagrams and structural artifacts that
  must reproduce on B/W printers;
- the `applyPersonalityDelta('minimal', text)` baseline — the
  minimal delta moves an existing palette toward wireframe-grayscale's
  shape (radius → 0, chroma → 0.7×) but keeps SOME accent hue; this
  preset is the asymptote.

DON'T pick for:

- final user-facing artifacts — wireframe-grayscale screams
  "unfinished";
- reports / documents that intend to be READ (the lack of color
  hierarchy makes scanning harder);
- charts / data viz (without color, chart series become
  indistinguishable — `--vc-cat-*` derivations come out as all-grey).

## Scaffold to emit

```js
window.__veDesignMd.hotSwap(amvcpTokens.PRESETS['wireframe-grayscale']);
```

For a wireframe artifact authored from scratch, set the
`<script type="text/design-md">` block to the preset text verbatim
and use ONLY the `vc-*` utility classes for layout — no color
overrides anywhere.

## Lib functions used

- `amvcpTokens.PRESETS['wireframe-grayscale']` → complete DESIGN.md
  text
- standard engine pipeline

## DESIGN.md tokens used

- writes (via the preset's text): all 15 colors × 2 themes (all
  grayscale), typography (system-only), spacing, radius
  (`[0,0,0,0,0,9999]`), elevation (the std MD3 shadows still ship —
  remove them per-artifact if you want a flat wireframe), motion,
  z-index, code (still 12 grey hexes for the syntax tokens)

## Anti-slop interaction

Wireframe-grayscale's accent (`#4d4d4d` light / `#b3b3b3` dark) is so
far from the banned indigo region (a pure mid-grey has zero chroma)
that the slop gate ALWAYS passes. The accent IS a deliberate non-color
choice — that's the structural anti-slop guarantee: a wireframe can't
look like generic AI UI because it has no hue at all.

## Selection / comment / decision-mini contract

Selection on wireframe-grayscale is a 20% grey mix against
transparent — a faint grey wash, but visible because the canvas is
pale and the wash darkens it. Focus ring is a 45% grey mix — a
medium-grey ring, less dramatic than a colorful focus indicator
(which is fine for a wireframe; the goal is structural review, not
brand-feel).

Comment threads stay grey-on-grey — the thread's chrome reads as
deliberately neutral, putting all visual weight on the COMMENT TEXT.
This is actually one of wireframe-grayscale's strengths for review
artifacts: the chrome doesn't compete with the content.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a wireframe-
grayscale sample under `dev-browser`. Screenshot in **both themes**
(R1) and verify:

1. ZERO chromatic tokens — every color is a literal grey;
   `getComputedStyle(...).getPropertyValue('--vc-color-accent')` →
   `#4d4d4d` (light) or `#b3b3b3` (dark); compute the OKLCh and
   assert chroma ≈ 0;
2. ZERO non-zero radii — every card / button / pill has
   `border-radius: 0px` (verify all `var(--vc-radius-{none,sm,md,
   lg,xl})` resolve to `0`);
3. NO inadvertent gradients — `linear-gradient(…)` in the emitted
   HTML triggers the slop gate's `gradient-bg` check; wireframe-
   grayscale never emits them by construction.
