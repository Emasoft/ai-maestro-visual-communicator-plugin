# Golden-angle categorical hue generator

## Table of Contents

- [What it does](#what-it-does)
- [When to use](#when-to-use)
- [Why golden-angle vs. evenly-spaced (`360 / N`)](#why-golden-angle-vs-evenly-spaced-360--n)
- [When to seed from the active accent](#when-to-seed-from-the-active-accent)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

`amvcpTokens.generateCategoricalHues(seedHex, count)` produces N
brand-coherent, maximally-separated hues by rotating the seed's OKLCh
hue by the golden angle 137.508° for each step. The function holds the
seed's lightness + chroma constant (clamped into a vivid mid band) and
varies hue only.

## What it does

```
H[i] = seed.h + i * 137.508°    (in OKLCh, fixed L + C)
```

The golden angle is the unique angle that MAXIMISES separation between
any number of points distributed around a circle (the same reason
sunflower seeds spiral at this angle — every subsequent seed lands as
far from its neighbours as possible). For categorical colors, it means
N hues are spread as evenly as possible without any two reading as
"the same color".

The function clamps:

- **L** into `[0.58, 0.78]` — a vivid mid band, so a very-dark or
  very-light seed still yields READABLE chips (a 0.95-L seed would
  produce N pastel ghosts; clamping prevents that);
- **C** to `>= 0.11` — a minimum chroma floor, so a near-grey seed
  still yields visible chips.

Output: a `string[]` of `#rrggbb` values, length `count`.

Fail-fast: bad seed hex throws; non-positive-integer count throws.

## When to use

The function is the engine behind every CATEGORICAL role map (activity,
graph-node, icon-tint — see `references/semantic-role-maps.md`). Call
it directly when you need:

- N distinct hues for a series (a stacked bar chart with 7 series, a
  network diagram with 10 node types, an icon grid with 8 categories);
- the resulting ramp to STAY ON-BRAND (the seed defines the family;
  the golden-angle rotation defines the spread);
- AUTOMATIC RECOMPUTATION when the brand accent changes (re-seed,
  re-bake, re-render — no hand-tuning of N hex literals).

## Why golden-angle vs. evenly-spaced (`360 / N`)

A naive 360°/N spacing produces SUB-PATTERNS that read as "same hue
family" for some N. E.g. 360/3 = 120° gives RGB primaries — three
unmistakeable hues but they read as a "primary colors" set, very
saturated and primary-school. 360/6 = 60° gives RGB+CMY — six hues
arranged on the colour wheel poles.

Golden-angle never produces a regular sub-pattern. The first 7 hues
are all DIFFERENT from "rotate by 60°"; the first 12 hues are all
DIFFERENT from "rotate by 30°". The set keeps looking like a
deliberately-chosen accent ramp at any N.

## When to seed from the active accent

```js
// Bake categorical hues off the page's current accent (the contact
// sheet does this).
var accentHex = getComputedStyle(document.documentElement)
  .getPropertyValue('--vc-color-accent').trim();
var hues = amvcpTokens.generateCategoricalHues(accentHex, 6);
// → 6 hex strings, brand-coherent rotation off the active accent
```

This is the difference between a brand-coherent categorical set (every
hue feels related to the brand) and a generic "rainbow" categorical
set (every hue feels random / unrelated).

## Scaffold to emit

The output is a flat `string[]` — feed it into a CSS variable family,
a SVG `<pattern>`, or a chart's color array:

```css
:root {
  --vc-node-source:    #1d4ed8;  /* hues[0] */
  --vc-node-filter:    #2eb56a;  /* hues[1] */
  --vc-node-transform: #d97757;  /* hues[2] */
  --vc-node-aggregate: #7c5ed1;  /* hues[3] */
  --vc-node-final:     #ad7d39;  /* hues[4] */
  --vc-node-target:    #2bb4b6;  /* hues[5] */
}
```

For a chart series the same hues power `data-series-color-N`
attributes.

## Lib functions used

- `amvcpTokens.generateCategoricalHues(seedHex, count)` → `string[]`
- the same function powers `amvcpTokens.renderRoleMapCss('activity' |
  'graph-node' | 'icon-tint', seed)` — call `renderRoleMapCss`
  directly when you want a styled `<style>` block instead of just
  the hex array

## DESIGN.md tokens used

- reads: typically `colors.<theme>.accent` as the seed
- writes: nothing directly — the generated hues are baked into a CSS
  block or attribute, not into the DESIGN.md (they're DERIVATIONS,
  not source-of-truth values)

## Anti-slop interaction

Categorical ramps generated this way pass the slop lint because the
seed clamps to chroma `>= 0.11` and L into `[0.58, 0.78]` — far from
the pure `#fff` / `#000` (exact-banned) and far from the banned
indigo-family OKLab radius (the seed's hue rotates 137° each step, so
even if step 0 was indigo, step 1 is clearly green-yellow, step 2 is
violet-red, etc).

A seed that itself lands in the banned region (a user-supplied
`#6366F1` accent) will produce a step-0 that's flagged, but step-1
through step-N are rotated 137° off and are safe. The right fix is
to choose a different seed; clamping the OUTPUT to avoid banned hues
would silently shift away from the user's brand and is the wrong
behaviour.

## Selection / comment / decision-mini contract

Categorical hues are passive — they don't have selection state. They
DO appear in the semantic-roles panel of the contact sheet (labelled
chip rows for `activity`, `graph-node`, `icon-tint`), and the
panel's click-to-copy on a chip copies the rotated hex value (so a
designer can paste it elsewhere).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — generate a 6-hue ramp
under `dev-browser`, lay the 6 chips out in a horizontal strip, and
visually verify NO two adjacent chips read as "the same color". For
N=7 the 7th chip lands far from the 6th — that's the golden angle
working. For N >= 12 the ramp may include hues you would not have
hand-picked (e.g. a chartreuse step) — that's expected; the spread
is mathematically optimal even if individual stops feel surprising.

Take screenshots in **both themes** (R1) — the categorical hues are
themselves theme-independent (they're literal hex), but their CHROME
(the chip background mix against `--vc-color-surface`) flips per
theme automatically.
