# Interaction-state opacity tokens (DT-03 + DT-21)

The MD3 canonical state-layer model + surface-pressed / selection-
highlight / focus-ring extensions. ONE technique with five shipped
opacities; ONE component (`.vc-state` on any element) makes every
interactive surface respond consistently — no per-component hover-color
fork.

## What it does

`amvcp-tokens.css` ships the five fixed opacities as derived semantic
tokens:

```css
--vc-state-hover-opacity:    0.08;
--vc-state-focus-opacity:    0.10;
--vc-state-pressed-opacity:  0.10;
--vc-state-disabled-opacity: 0.38;
--vc-state-drag-opacity:     0.16;
```

These are RATIOS (fixed by the MD3 spec — not brand-tunable), so they
sit in the `ve-semantic` layer at `:root` and don't change per theme.

The companion `.vc-state` class wires them onto any element via a
`::before` overlay:

```css
.vc-state              { position: relative; }
.vc-state::before {
  content: ""; position: absolute; inset: 0;
  border-radius: inherit;
  background: currentColor;      /* adapts to the host's text color */
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--vc-duration-quick) var(--vc-easing-standard);
}
.vc-state:hover::before          { opacity: var(--vc-state-hover-opacity); }
.vc-state:focus-visible::before  { opacity: var(--vc-state-focus-opacity); }
.vc-state:active::before         { opacity: var(--vc-state-pressed-opacity); }
.vc-state[aria-disabled="true"]  { opacity: var(--vc-state-disabled-opacity); }
.vc-state:focus-visible          { outline: none; box-shadow: var(--vc-focus-ring); }
```

The trick: `background: currentColor` means the overlay is the host's
own text color, faded. On a dark surface where text is light, the
overlay is light → it LIGHTENS the surface. On a light surface where
text is dark, the overlay DARKENS. Zero theme-specific code.

## When to use

Apply `class="vc-state"` to ANY interactive element — buttons, links,
cards-as-clickable, list-row hover, tab pills. The overlay works on
the element's existing background; you don't need to declare hover
colors per component.

DO NOT use on disabled-by-default elements (the overlay would still
fire on hover). Apply `aria-disabled="true"` instead.

## Scaffold to emit

The tokens come for free with `amvcp-tokens.css` — no DESIGN.md author
work needed. The agent emits the class:

```html
<button class="vc-state vc-rounded-md vc-p-3">Click me</button>

<a href="/foo" class="vc-state vc-text">Go to foo</a>
```

The contact sheet's `state` panel renders four side-by-side demo
buttons frozen into idle / hover / focus / pressed / disabled states
using the `.vc-state-demo-*` modifier classes — those force the same
overlay opacities statically so all five states are visible at once.

## Lib functions used

- (CSS only) — `amvcp-tokens.css` provides `.vc-state` + the
  `.vc-state-demo-{hover,focus,pressed,disabled}` modifiers used by
  the contact-sheet's state panel
- `--vc-duration-quick` and `--vc-easing-standard` (from the motion
  library) drive the overlay's fade-in/out

## DESIGN.md tokens used

- reads (via inherited theme): `--vc-color-accent` (for the focus ring,
  via the `--vc-focus-ring` derived token)
- reads: `--vc-duration-quick`, `--vc-easing-standard` (transition)
- writes: nothing — the state opacities are spec-fixed ratios

## Anti-slop interaction

Slop is per-component hover colors that don't match anywhere else
(e.g. `:hover { background: #f3f4f6; }` repeated 200 times with subtly
different greys). The `currentColor + 8%` overlay is the structural
fix — the hover always relates to the host's TEXT color, never an
ungrounded gray.

## Selection / comment / decision-mini contract

Selection (`::selection`) uses `--vc-selection-bg` (a 20%-accent mix),
which itself overlays on whatever surface — same mechanism, fixed at
20%. Focus ring uses `--vc-focus-ring` (a 45%-accent mix as a 3px box-
shadow), which composes WITH the `.vc-state` overlay: focus-visible
fires both the box-shadow AND the 10% overlay simultaneously, so a
focused-and-pressed button reads as "focused" (the ring) AND "pressed"
(the deepened overlay).

The `data-vc-copied` flash that the contact sheet uses for click-to-
copy is a separate `::after` decoration — it does NOT use the state
overlay (the flash is informational, not a state).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact sheet
under `dev-browser`, screenshot the `state` panel in **both themes** (R1).
Verify the four demo buttons show the right gradient of "weight": idle
< hover < focus < pressed, with disabled at half opacity. Use
`page.mouse.move(...)` (not `el.click()`) to test the LIVE button — a
single `click()` skips the move/leave/over sequence and hides
hover-state bugs (this is the "trust real mouse paths" lesson from the
browser-ui-test-techniques rule).

Also verify `prefers-reduced-motion: reduce` kills the overlay's fade
transition (the `@media` block in `amvcp-tokens.css` sets
`transition: none`). State changes still fire immediately — only the
animation is suppressed.
