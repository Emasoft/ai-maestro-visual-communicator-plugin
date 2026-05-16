# Derived state color split — fg/bg/border/icon from one semantic role

The engine ships ONE color per semantic role (`success`, `warning`,
`danger`, `info`). Real UI needs FOUR sub-tokens per role: foreground,
background, border, icon. This document covers how `amvcp-tokens.css`
derives that 4-way split with `color-mix` — automatically theme-
flipping, never a `.dark` override block.

## What it does

For every semantic state role, `amvcp-tokens.css` emits a 4-line block:

```css
--vc-state-success-fg:     var(--vc-color-success);
--vc-state-success-bg:     color-mix(in srgb, var(--vc-color-success) 12%, var(--vc-color-surface));
--vc-state-success-border: color-mix(in srgb, var(--vc-color-success) 32%, var(--vc-color-surface));
--vc-state-success-icon:   var(--vc-color-success);
```

The same block exists for `warning`, `danger`, `info`. The mix is
against `--vc-color-surface` — which itself flips between light and
dark when the theme switches — so EVERY derived `--vc-state-*-{bg,
border}` flips automatically. Zero `@media`, zero `.dark` overrides.

A `MUST` badge is therefore a pale-red chip on light theme and a
dark-red chip on dark theme without writing two color sets.

## The percentages

`12%` for `bg` and `32%` for `border` are the production-proven values
from the Anthropic-Claude design language. They land in the WCAG-pass
contrast zone for both themes (a 12%-against-surface bg is light
enough that the role's full-strength `fg` reads on top of it; a 32%
border is visible without competing with the bg).

These percentages are FIXED ratios — not brand-tunable. Tuning them
would shift the visual rhythm without solving anything that isn't
better solved by editing the role color itself.

## When to use the derived family vs. the base role

| Use the BASE role (`--vc-color-success`) when | Use the DERIVED family when |
|---|---|
| painting an SVG icon (`fill="var(--vc-color-success)"`) | painting a status chip / pill background |
| painting a 1-px progress-bar fill | painting a callout panel's border |
| as `color:` on inline text inside a regular paragraph | as `background:`/`border:` on a status alert card |

The base role is the FULL-strength color (the icon, the pixel-true
indicator). The derived family is the LOW-ALPHA composition for
chrome that needs to coexist with body text without dominating.

## Scaffold to emit

Authors NEVER write the derived family — it ships in
`amvcp-tokens.css` and resolves the moment the engine applies a
DESIGN.md. The role colors themselves are the only DESIGN.md surface:

```yaml
colors:
  light:
    success: "#3a6b5c"
    warning: "#a8791f"
    danger:  "#a84a32"
    info:    "#3464a8"
  dark:
    success: "#6fae9b"
    warning: "#d8aa54"
    danger:  "#dd8068"
    info:    "#6f9bd8"
```

The agent uses derived tokens via the `.vc-bg-*` utility classes (from
`amvcp-tokens.css`) which read the derived family:

```html
<div class="vc-bg-success vc-text-success vc-border">
  Build succeeded.
</div>
```

## Lib functions used

- (CSS only) — `amvcp-tokens.css` defines the four
  `--vc-state-{success,warning,danger,info}-{fg,bg,border,icon}` blocks
- the `.vc-bg-{success,warning,danger,info}` / `.vc-text-*` utility
  classes invoke them

## DESIGN.md tokens used

- reads: `colors.<theme>.{success, warning, danger, info}`
- emits (via CSS): `--vc-state-{role}-{fg, bg, border, icon}` × 4 roles
  = 16 derived tokens

## Anti-slop interaction

This pattern is literally the antidote to two slop signatures:

- the "hard-coded `#F0FDF4` bg / `#16A34A` text / `#BBF7D0` border" stack
  that every AI badge ships — replaced by one role color + automatic
  derivation;
- the `.dark { background: …; color: …; border: …; }` triple-fork that
  appears whenever a per-role pair is hand-tuned for dark mode —
  replaced by ZERO dark-specific code.

## Selection / comment / decision-mini contract

Derived tokens are passive — they have no selection state. A status
panel selected by the reader inherits the standard
`::selection { background: var(--vc-selection-bg); }` rule; the
selection mix sits ON TOP of the panel's derived bg without conflict.

The semantic-roles panel of the contact sheet renders one chip per
role (`MUST`, `IMO`, `Q`, `FYI`) using the derived family via the
`badge` role map (see `references/semantic-role-maps.md`); each chip
is click-to-copy (copies the CSS variable name, e.g.
`var(--vc-color-danger)`).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — screenshot the
semantic-roles panel in **both themes** (R1) and verify:

1. the `MUST` chip is a pale red on light, a dark red on dark — the
   theme flip happened automatically;
2. the `fg` on each chip reads against its derived `bg` (use
   `amvcpTokens.contrastRatio(fg, bg) >= 4.5` via `page.evaluate`);
3. no `.dark` override anywhere — `getComputedStyle(chip).backgroundColor`
   must change when the document's `data-ve-theme` flips, but the CSS
   that produced it must not contain a `@media (prefers-color-scheme)` /
   `.dark` block (audit with a regex `\.dark\s*\{` over the emitted
   stylesheet).
