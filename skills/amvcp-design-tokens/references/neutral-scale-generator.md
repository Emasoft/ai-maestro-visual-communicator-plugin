# Single-ink neutral scale (DT-11)

## Table of Contents

- [What it does](#what-it-does)
- [When to choose](#when-to-choose)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Single source of truth](#single-source-of-truth)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

A neutral palette derived from ONE ink color via
`color-mix(in srgb, var(--ink) N%, transparent)`. No need to specify
multiple gray hex values; the scale auto-adapts to whatever ink hue you
choose, and the transparency mixes correctly against any background —
so the same scale works on light and dark themes without a fork.

## What it does

`amvcpTokens.generateNeutralScale(inkHex, stops)` returns an array of
`{ stop, value }` objects, where `value` is the literal
`color-mix(in srgb, <ink> <p>%, transparent)` string ready to drop into
a CSS custom property.

Defaults: `inkHex` validated via `parseHex` (throws on bad seed),
`stops = [4, 8, 12, 15, 30, 50, 70, 90]` — eight tonally-locked levels
covering hairline borders → muted text → primary text.

The pattern generalises the runtime's proven `--ve-control-fg-dim`
trick (a single `--ink` declaration, dim variants composed with
`color-mix`) into a generator the agent can pre-bake.

## When to choose

Pick the neutral scale when:

- the artifact has a strong brand ink (a warm-tinted dark text on a
  cream canvas; a near-black text on white) and you want all secondary
  text / borders / dividers to inherit that ink's hue;
- you want one scale that works against ANY surface — `color-mix` with
  `transparent` lays the ink over whatever shows through;
- you would otherwise emit 5+ hand-picked gray hexes per theme (the
  scale collapses that to one ink hex + an array of percentages).

Skip it when the project's gray scale is itself a brand asset and
the grays must be specific named hexes (in that case, hand-tune the
content/border/subtle roles directly).

## Scaffold to emit

The scale isn't a DESIGN.md group on its own — its output is fed
into the **15-role color block** as the `content-muted`,
`content-subtle`, and `border` family:

```js
var scale = amvcpTokens.generateNeutralScale('#1f1a14');
// → [
//   { stop:  4, value: "color-mix(in srgb, #1f1a14 4%, transparent)" },
//   { stop:  8, value: "color-mix(in srgb, #1f1a14 8%, transparent)" },
//   ...
//   { stop: 90, value: "color-mix(in srgb, #1f1a14 90%, transparent)" },
// ];

// Assignments (example for a warm light theme):
themeColors['border']          = scale[2].value;   // 12% ink
themeColors['border-strong']   = scale[3].value;   // 15% ink
themeColors['content-subtle']  = scale[4].value;   // 30% ink
themeColors['content-muted']   = scale[5].value;   // 50% ink
themeColors['content']         = scale[7].value;   // 90% ink → near-ink
```

Both themes can share the SAME ink (`#1f1a14`) but DIFFERENT
ramps if the dark theme needs a brighter ink for contrast.

## Lib functions used

- `amvcpTokens.generateNeutralScale(inkHex, stops)` →
  `Array<{stop:number, value:string}>`
- pair with `amvcpTokens.contrastRatio` to verify content/canvas pairs

## DESIGN.md tokens used

- writes: `colors.<theme>.{content, content-muted, content-subtle,
  border, border-strong}` — typically 5 of the 15 color roles
- never writes: `accent`, semantic-state colors, `canvas`, `surface*`

## Anti-slop interaction

`color-mix(... transparent)` values are not literal hex strings, so
they never trigger the banned-hex check. The ink itself IS checked —
choose a warm off-black like `#1f1a14` or a cool near-black like
`#0e1014`, NOT pure `#000000` (which is in `BANNED_COLORS.exact`).

## Single source of truth

Every secondary surface tone in the artifact is now traceable to ONE
ink hex. To restyle, change the ink and the entire neutral family
shifts in lockstep — exactly the "centralised token + delegation"
pattern that the LaTeX `signalflowdiagram.sty` package demonstrated
(every shape's `\pathdrawcolor` defaults to `\blockdrawcolor`, so a
3-line edit re-skins all 30+ figure styles). See
`references/centralised-token-pattern.md`.

## Selection / comment / decision-mini contract

These are passive structural tokens; the contact sheet renders them
under the color panel along with the rest of the 15 roles. Selection
inside emitted prose uses the standard `--vc-selection-bg`; the
neutral scale never overrides selection.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — screenshot the contact
sheet in **both light and dark themes** (R1) and visually confirm
that `border` is barely visible, `content-subtle` reads as a hint,
`content-muted` reads as secondary, and `content` reads as primary
body text. If `content-muted` looks darker than `content`, your stop
ordering is wrong — the value at `stops[5]` must be > `stops[7]` in
visual weight (90% > 50%). The `parseHex` validation only catches
syntactic errors, not assignment mistakes.
