# Semantic-role color maps

## Table of Contents

- [The generic shape](#the-generic-shape)
- [The shipped maps](#the-shipped-maps)
- [The golden-angle categorical generator](#the-golden-angle-categorical-generator)
- [Seeding off the active accent](#seeding-off-the-active-accent)

A role-color map is ONE mechanism — "a named map of semantic role →
color, applied via a `data-*` attribute" — with several shipped
instances. `amvcpTokens.ROLE_MAPS` holds the data;
`amvcpTokens.renderRoleMapCss(name, seedAccentHex)` returns a `<style>`
text block of attribute selectors.

## The generic shape

```css
[data-vc-role="<name>"] {
  --vc-role-color: <derivation from --vc-*>;
  color: var(--vc-role-color);
  background: color-mix(in srgb, var(--vc-role-color) 12%, var(--vc-color-surface));
  border-color: color-mix(in srgb, var(--vc-role-color) 30%, var(--vc-color-surface));
}
```

Every role color's bg/border mixes against `--vc-color-surface` — which
flips per theme — so a `MUST` badge is a pale-red chip on light and a
dark-red chip on dark, automatically.

## The shipped maps

### Badge severity — `renderRoleMapCss('badge')`

Roles `MUST / IMO / Q / FYI`, mapped onto the engine's semantic roles so
a badge themes with the rest of the page:

| Role | Color |
|---|---|
| `MUST` | `var(--vc-color-danger)` |
| `IMO` | `var(--vc-color-info)` |
| `Q` | `var(--vc-color-warning)` |
| `FYI` | `var(--vc-color-success)` |

Apply `<span data-vc-role="MUST">`. Consumed by the `report-doc`
technique's review findings.

### Activity colors — `renderRoleMapCss('activity')`

7 roles `working / meeting / break / idle / focus / review / blocked`.
Seven roles cannot map to four semantic colors, so this map is a 7-step
**categorical** ramp — the golden-angle generator (below) rotates the
hue off the accent. Emitted as `--vc-activity-<role>` vars.

### Graph-node colors — `renderRoleMapCss('graph-node')`

6 roles `source / filter / transform / aggregate / final / target`, a
6-step golden-angle categorical ramp. Emitted as `--vc-node-<role>`
vars. **Authored here, consumed by the `diagram` technique** — diagram
sets `data-vc-role` on scene-graph nodes; design-tokens defines the
colors.

### Icon-tint — `renderRoleMapCss('icon-tint')`

A 6-color `:nth-child` rotation for icon-card backgrounds. Each
`.vc-icon-card:nth-child(6n+k)` sets `--vc-icon-color` to one stop of
the 6-step categorical ramp; the card container uses
`background: color-mix(in srgb, var(--vc-icon-color) 12%, transparent)`.
Authored here, consumed by `icon-svg`.

## The golden-angle categorical generator

`amvcpTokens.generateCategoricalHues(seedHex, count)` produces N
brand-coherent, maximally-separated hues. It takes the seed's OKLCh
lightness + chroma (clamped into a vivid mid band) and rotates the hue
by the golden angle `137.508°` for each step:

```
H[i] = seed.h + i * 137.508°   (in OKLCh, fixed L + C)
```

The golden angle maximises visual separation between any number of
categorical colors — this is the honest way to get N distinct yet
on-brand hues, instead of hand-picking unrelated colors.

## Seeding off the active accent

`renderRoleMapCss(name, seedAccentHex)` takes an optional seed accent.
Pass the loaded DESIGN.md's `accent` so the categorical ramps stay
brand-coherent with the page. The contact sheet does exactly this — its
semantic-roles panel seeds every map off the active accent.
