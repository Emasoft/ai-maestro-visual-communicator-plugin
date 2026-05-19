# Contact-sheet state panel — interaction-state demos

## Table of Contents

- [What it does](#what-it-does)
- [Why both frozen AND live](#why-both-frozen-and-live)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)
- [Overview](#overview)

## Overview

The `state` panel of the token contact sheet renders interaction-
state demos: idle / hover / focus / pressed / disabled, side-by-
side, statically forced via the `.vc-state-demo-*` modifier classes
plus a LIVE instance the reader can actually interact with. The teaching
artifact for the MD3 state-layer model.

## What it does

`buildStatePanel()` renders one `<section data-vc-panel="state">`
with two parts:

1. a **frozen demo row** — five buttons, each forced into a state via
   the `.vc-state-demo-{hover,focus,pressed,disabled}` modifier
   classes (plus an `idle` button as the baseline). All five visible
   at once so the reader sees the WHOLE state progression in one
   glance.
2. a **live instance** — one extra button without any modifier; hover
   / focus / press it to see the SAME states fire from real
   interaction.

The MD3 state-layer model (`amvcp-tokens.css`, `.vc-state` rule)
wires the overlay opacities; see
`references/interaction-state-tokens.md` for the full mechanism.

## Why both frozen AND live

A frozen-only row tells the reader "this is what the states LOOK
LIKE" but not "this is what they FEEL LIKE". A live-only button
tells them what hover feels like but they have to MOUSE THROUGH all
five states to see the comparison. Both: complete picture in one
panel.

## Scaffold to emit

The state panel template:

```html
<section data-vc-panel="state" class="vc-sheet-panel">
  <h2>Interaction states</h2>

  <div class="vc-sheet-state-row">
    <button class="vc-state vc-sheet-state-btn" disabled>idle</button>
    <button class="vc-state vc-sheet-state-btn vc-state-demo-hover">hover</button>
    <button class="vc-state vc-sheet-state-btn vc-state-demo-focus">focus</button>
    <button class="vc-state vc-sheet-state-btn vc-state-demo-pressed">pressed</button>
    <button class="vc-state vc-sheet-state-btn vc-state-demo-disabled">disabled</button>
  </div>

  <h3>Live instance — hover / focus / press to feel the states.</h3>
  <button class="vc-state vc-sheet-state-btn">live</button>
</section>
```

The `.vc-sheet-state-btn` class provides the basic button chrome
(padding, border, accent bg, on-accent text) — it's not the SAME
button shape an artifact would ship in production, just enough for
the demo.

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the state
  panel
- (internal) `buildStatePanel()` — takes no args, the panel is
  designmd-agnostic (the OPACITIES are spec-fixed; what changes
  per-theme is the button bg/fg/border colors)

## DESIGN.md tokens used

- reads (via `.vc-state-demo-*` modifiers):
  `--vc-state-{hover,focus,pressed,disabled}-opacity` (the fixed
  ratios)
- reads (via `.vc-sheet-state-btn`):
  `--vc-color-accent`, `--vc-color-on-accent`,
  `--vc-color-border-strong`, `--vc-radius-md`, `--vc-space-*`,
  `--vc-text-1`
- reads (via `:focus-visible` + `.vc-state-demo-focus`):
  `--vc-focus-ring` (derived from accent)

## Anti-slop interaction

The five frozen states use the SAME button chrome with the SAME
overlay token applied at different opacities — they look like a
deliberately-designed family, not five hand-tuned states. The
absence of a "stop my page is too quiet, make hover BRIGHTER" hack
is the point: the structural pattern (`currentColor` overlay at MD3
opacity) doesn't need per-component tuning.

The focus-visible state uses `box-shadow: var(--vc-focus-ring)`
which is a 45% accent mix — never a `outline: 2px solid blue` hack.

## Selection / comment / decision-mini contract

The buttons are real interactive elements. The live button
participates in keyboard tab order (so `Tab` cycles through the
demos). Selection across the button labels works normally.

The frozen demo row's buttons set `disabled` on the `idle` button
(so it doesn't fire `:hover` on hover); for the other four, the
DEMO modifier overrides the natural state. A user MAY accidentally
hover-fire the demo buttons; the demo modifier wins because it sets
opacity via `::before` directly, overriding the `:hover` `::before`
opacity.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the state panel in **both
themes** (R1) and verify:

1. the five frozen buttons each render at a DIFFERENT effective
   weight: `idle < hover < focus < pressed`, `disabled` at half
   opacity. Use `page.evaluate` to read each `::before`'s computed
   `opacity` and verify the ordering matches the
   `--vc-state-*-opacity` tokens;
2. the LIVE button does not initially have any overlay; hover via
   `page.mouse.move(...)` (NOT `el.hover()` — programmatic events
   may skip the move sequence) and verify the `::before` opacity
   becomes the hover value;
3. press Tab (keyboard navigation) and verify the live button gets
   the focus-visible ring (`box-shadow: var(--vc-focus-ring)`
   resolves to a non-empty box-shadow);
4. with `prefers-reduced-motion: reduce` emulated, the overlay's
   opacity TRANSITION is suppressed (the opacity still changes,
   just instantly instead of fading).
