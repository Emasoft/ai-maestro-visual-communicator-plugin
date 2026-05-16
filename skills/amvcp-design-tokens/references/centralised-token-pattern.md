# Centralised token pattern — one source-of-truth for all primitives

Prior art: the LaTeX `signalflowdiagram.sty` package
(kleemans 2026-05-16 mining report) defines EVERY drawable primitive's
stroke weight, fill color, and size via named macros at the top of one
file. Every shape definition reads from those macros, so a 3-line edit
re-skins all 30+ figure styles consistently. This is the same pattern
AMVCP's DESIGN.md uses — and this document is the proof / lesson.

## What it demonstrates

The LaTeX package declares (paraphrased):

```latex
\newcommand{\diagramlinewidth}{2pt}
\newcommand{\pathlinewidth}{1pt}
\newcommand{\operatorlinewidth}{1.5pt}
\newcommand{\blocklinewidth}{1.2pt}

\newcommand{\pathdrawcolor}{black}
\newcommand{\pathfillcolor}{white}
\newcommand{\operatordrawcolor}{black}
\newcommand{\operatorfillcolor}{white!90!black}
\newcommand{\blockdrawcolor}{black}
\newcommand{\blockfillcolor}{white!95!black}

\newcommand{\nodesize}{4mm}
\newcommand{\terminalsize}{3mm}
\newcommand{\operatorsize}{6mm}
\newcommand{\delaysize}{5mm}
\newcommand{\blockwidth}{14mm}
\newcommand{\blockheight}{10mm}
```

Every TikZ style downstream is THEN:

```latex
\tikzstyle{node style} = [
  draw       = \pathdrawcolor,
  fill       = \pathfillcolor,
  line width = \pathlinewidth,
  minimum size = \terminalsize
]
```

A user can drop a custom `.sty` next to the source and override any of
those `\newcommand`s — every shape re-skins because every shape READS
the macro, never hardcodes the value.

## The AMVCP equivalent

DESIGN.md `--vc-*` tokens are the macros; the engine's `applyTokens` is
the equivalent of the LaTeX expand-time substitution; per-component CSS
reading `var(--vc-color-border)` is the equivalent of TikZ styles
reading `\blockdrawcolor`.

The same 3-line-edit-restyles-everything property holds:

```yaml
# Edit these three lines in DESIGN.md:
colors:
  light:
    accent: "#d9520e"    # was #b8861f
    border: "#dcd8d1"    # was #e3dcc9
    canvas: "#f4f2ef"    # was #faf6ee
```

→ every button, every card border, every section background re-skins.

The structural lesson is the same:

> **Every primitive value (stroke, color, size, radius, shadow,
> duration) MUST live in ONE place, and every consumer MUST read
> through a variable indirection. No hardcoded literals downstream.**

This is the rule that the slop gate (`amvcpTokens.lintHtml`) enforces:
a literal `#3b82f6` in the emitted HTML is flagged, because the right
shape is `var(--vc-color-accent)` (or `var(--vc-color-info)` —
whichever role applies).

## When to invoke this lesson

Cite this pattern when:

- a contributor proposes hardcoding a "just this once" hex into a
  component style (the LaTeX example proves there's no "just this
  once" — every hardcode becomes a maintenance debt);
- a contributor proposes a parallel "tokens.css" file alongside
  DESIGN.md (the LaTeX example shows a single umbrella file is the
  right cardinality — the engine IS the umbrella);
- a reviewer asks "why can't components define their own colors when
  needed?" (the LaTeX example is the proof: one file owns all
  primitives, and the project's 30+ figure styles all benefit when
  you change one line).

## Default-color delegation chain (companion pattern)

The LaTeX package goes further: `\newcommand{\pathdrawcolor}{\blockdrawcolor}` —
operator and path colors *default to* the block color until explicitly
overridden. A FALLBACK CHAIN so a user editing one token cascades
through three sibling primitives.

The CSS analogue uses `var()` fallbacks:

```css
:root {
  --vc-path-color: var(--vc-block-color, currentColor);
  --vc-arrow-color: var(--vc-path-color);    /* arrows delegate to path */
}
```

The engine's existing token vocabulary already uses this idea: derived
state tokens (`--vc-state-success-bg`) read `var(--vc-color-success)`,
which itself comes from the engine's resolved theme. The user only
needs to override `--vc-color-success` to re-color every state-success
chrome in the artifact — without writing a `*-bg` / `*-border` / `*-fg`
trio per chip.

## Separate-file token + vendor overrides (companion pattern)

The LaTeX package ships as a 5-file split:

```
signalflowdiagram.sty             — umbrella (token declarations)
tikzlibrarysignalflowdiagram.code.tex
tikzlibrarysignalflowarrows.code.tex
tikzlibrarysignalflowoperators.code.tex
tikzlibrarysignalflowblocks.code.tex
```

The umbrella declares tokens; the four library files declare pure
shapes that READ those tokens. A user drops a custom `.sty` next to
the source — it overrides token declarations without touching the
libraries.

AMVCP mirrors this: a project's `DESIGN.md` is a USER-SIDE OVERRIDE of
the runtime's default `--vc-*` declarations. The engine
(`amvcp-designmd.js`) is the umbrella; the per-skill libraries
(`amvcp-tables.js`, `amvcp-chart.js`, etc.) read those tokens; the
project's DESIGN.md is the vendor-side override that re-tokens
everything without touching library code.

## Lib functions used

- (no JS code) — this document is a design rationale and rule, not a
  callable API
- the rule is ENFORCED by `amvcpTokens.lintHtml` (flags literal hexes)
  and by the engine's contract (every `--vc-*` value comes from the
  resolved DESIGN.md, never from per-component CSS)

## DESIGN.md tokens used

- ALL — this pattern is about the topology of the entire token
  surface, not any single token

## Anti-slop interaction

A page with HARDCODED component colors fails the slop gate on the
banned-hex check. A page with VARIABLE-REFERENCED colors that
themselves come from a clean DESIGN.md passes. This document is the
explanation for WHY the lint enforces what it enforces — the
centralised-token pattern is what makes a "themed artifact" possible
in the first place.

## Selection / comment / decision-mini contract

This is a meta-rule, not a feature with chrome. The selection /
comment / decision-mini contracts of every other technique INHERIT
from this rule: their colors come from tokens, so they participate
in the same single-source-of-truth.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — search the emitted HTML
for any literal `#[0-9a-fA-F]{3,6}` outside of a `<style
data-vc-role-map="…">` block (which IS allowed — the role-map ramps
are baked-out categorical hues). Any other literal hex is a violation.
The `lintHtml` lint catches this automatically; visual verification
is the screenshot-side smoke test (a screenshot in a non-default
theme that STILL shows the "default" color of a hardcoded element is
the symptom of a leaked literal).
