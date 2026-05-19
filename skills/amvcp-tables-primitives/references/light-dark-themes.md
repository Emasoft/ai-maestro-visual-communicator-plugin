# Light + dark themes — token-driven, no second stylesheet

Every visual in `amvcp-tables.js` ships BOTH a light AND a dark
variant. A theme toggle re-paints every mode (data, matrix, compare,
virtualization, CSV button) with NO `prefers-color-scheme` media
query and NO second stylesheet. The mechanic is one set of rules
written against `--vc-*` tokens whose values flip underneath.

## Table of contents

- [The rule](#the-rule)
- [Why "single-theme is a defect"](#why-single-theme-is-a-defect)
- [The token contract — engine emits ONLY the active theme](#the-token-contract--engine-emits-only-the-active-theme)
- [`color-mix` over tokens — why it works in both themes](#color-mix-over-tokens--why-it-works-in-both-themes)
- [Every fallback hex is the canonical LIGHT default](#every-fallback-hex-is-the-canonical-light-default)
- [What the theme toggle re-paints](#what-the-theme-toggle-re-paints)
- [Mechanical tricks for light vs dark](#mechanical-tricks-for-light-vs-dark)
- [The sticky-cell background — must be opaque in BOTH themes](#the-sticky-cell-background--must-be-opaque-in-both-themes)
- [Testing the theme flip](#testing-the-theme-flip)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The rule

From the per-project MEMORY:

> **Always design light + dark themes.** Every visual must ship
> BOTH themes; single-theme is a correctness defect.

This is not a feature; it's a quality bar. A reader on a dark-mode
operating system who hits a single-theme report gets eye strain. A
reader on a light-mode OS who hits a dark-only report gets visual
overload. A correct visual ships BOTH.

The plugin's runtime tokens (`--vc-color-*`, `--vc-text-*`,
`--vc-space-*`, `--vc-radius-*`, `--vc-shadow-*`, etc.) are
emitted with a per-theme value resolved by `amvcp-designmd.js`.
Toggling the theme switches the resolved values; the CSS rules that
read them re-paint automatically.

## Why "single-theme is a defect"

A report viewed at 7am in a sunlit room and again at 11pm in bed
needs to look right in both contexts. The human eye adapts to
brightness; the page should adapt with it.

| Symptom | Cause |
|---|---|
| White report at 11pm | the page is bright, but the room is dark — eye strain, washed-out content |
| Dark report at 7am | the page is dark, the room is bright — content fights the ambient light, reflections obscure text |
| Light theme defaults but dark page surrounds | inconsistent palette across the report — a single matrix cell missing the dark variant breaks the visual |

The plugin's `prefers-color-scheme: dark` fallback (when no theme is
explicitly set) gives the reader's OS preference. The DESIGN.md
engine's explicit toggle overrides that. Either way: BOTH themes
must work, BOTH must be tested, BOTH must read.

## The token contract — engine emits ONLY the active theme

The DESIGN.md engine reads two parallel sections of `DESIGN.md` (one
for light, one for dark) and emits the ACTIVE theme's values as
`--vc-color-*` (and friends) custom properties on `:root`. There is
no second stylesheet for the inactive theme — the engine simply
re-emits when toggled.

```
DESIGN.md
─────────
## Colors — Light theme
- success: #3a6b5c
- danger:  #a84a32
- warning: #a8791f
- accent:  #b8861f

## Colors — Dark theme
- success: #6bdba8
- danger:  #ff8a6e
- warning: #ffba56
- accent:  #ffc04f
```

After parsing, `:root` carries:

```css
/* with the engine in LIGHT */
:root {
  --vc-color-success: #3a6b5c;
  --vc-color-danger:  #a84a32;
  --vc-color-warning: #a8791f;
  --vc-color-accent:  #b8861f;
  ...
}

/* with the engine in DARK */
:root {
  --vc-color-success: #6bdba8;
  --vc-color-danger:  #ff8a6e;
  --vc-color-warning: #ffba56;
  --vc-color-accent:  #ffc04f;
  ...
}
```

The module's CSS reads the variable name; the engine controls the
value; toggling the theme is a single attribute change on `<html>`
that re-emits the variable values. Every rule that reads them
re-paints.

## `color-mix` over tokens — why it works in both themes

The module's tints look like:

```css
td[data-ve-val="pass"] {
  background: color-mix(in srgb,
    var(--vc-color-success, #3a6b5c) 12%, transparent);
}
```

In LIGHT theme: `color-mix(#3a6b5c 12%, transparent)` → faint sage
wash over the table's white surface → reads as "very pale green".

In DARK theme: `color-mix(#6bdba8 12%, transparent)` → faint mint
wash over the table's dark surface → reads as "very pale teal".

Both readable; both signal "pass"; same percentage; same rule. The
token values do the work.

The same trick is used for:
- the sorted-column tint (`color-mix(--vc-color-accent 8%,
  transparent)`)
- the emphasised-column lane (`color-mix(--vc-color-accent 10%,
  transparent)`)
- the matrix glyph color (`var(--vc-color-success)`, no mix)
- the focus outline (`var(--vc-color-accent)`, no mix)

Every visual in the module is a `color-mix` of a token + transparent
OR a direct token reference. No hardcoded hex anywhere except
fallbacks.

## Every fallback hex is the canonical LIGHT default

```css
color: var(--vc-color-accent, #b8861f);
```

The `#b8861f` is the canonical LIGHT-theme accent. It is the
fallback used when the DESIGN.md engine is ABSENT (e.g. a standalone
test fixture, a Jest test using jsdom, an `--app` browser without
the runtime loaded).

Why light-theme defaults? Because the runtime's own default theme
(absent DESIGN.md) is light. A table rendered without the engine
should look like the light-theme version, not "default unspecified".
The dark theme requires the engine to be active.

This is documented in [matrix-glyph-injection.md](
../../amvcp-tables-matrix-compare/references/matrix-glyph-injection.md) and elsewhere; the pattern is consistent.

## What the theme toggle re-paints

Every theme-aware element in the module:

| Mode | Element | Token |
|---|---|---|
| data | sort arrow (active) | `--vc-color-accent` |
| data | sort arrow (idle) | `--vc-color-content-muted` (60% mix) |
| data | sorted-column tint | `--vc-color-accent` (8% mix) |
| data | focus outline on header | `--vc-color-accent` |
| virtual | sticky header background | `--vc-color-surface` (opaque) |
| virtual | frozen column background | `--vc-color-surface` (opaque) |
| virtual | freeze edge border | `--vc-color-border-strong` |
| matrix | pass glyph color | `--vc-color-success` |
| matrix | pass cell tint | `--vc-color-success` (12% mix) |
| matrix | fail glyph color | `--vc-color-danger` |
| matrix | fail cell tint | `--vc-color-danger` (12% mix) |
| matrix | partial glyph color | `--vc-color-warning` |
| matrix | partial cell tint | `--vc-color-warning` (12% mix) |
| matrix | na glyph color | `--vc-color-content-muted` |
| compare | header icon (non-emphasised) | `--vc-color-content-muted` |
| compare | header icon (emphasised) | `--vc-color-accent` |
| compare | emphasised column tint | `--vc-color-accent` (10% mix) |
| compare | emphasised column borders | `--vc-color-accent` (solid 2px) |
| CSV | button background | `--vc-color-surface` |
| CSV | button border | `--vc-color-border` |
| CSV | button text | `--vc-color-content` |
| CSV | button hover | `--vc-color-accent` (12% mix over surface) |

Every one re-paints on theme toggle. Zero of them have a `@media
(prefers-color-scheme: dark)` rule.

## Mechanical tricks for light vs dark

The DESIGN.md engine's per-theme color tables follow a few patterns
that make the flip read correctly:

1. **Borders ↔ Backgrounds.** Light theme: dark border on light bg
   (a 1px dark line on white). Dark theme: light border on dark bg
   (a 1px lighter line on near-black). The contrast direction flips;
   the structural meaning ("divider between cells") is constant.

2. **Text ↔ Background.** Light theme: near-black text on white.
   Dark theme: near-white text on near-black. The `--vc-color-content`
   and `--vc-color-surface` tokens flip together.

3. **Selection emphasis is SUBTRACTIVE in light vs ADDITIVE in dark.**
   Light: push the selected cell toward black (darker tint). Dark:
   push the selected cell toward white (lighter tint). The 12%
   `color-mix` with the token automatically does this because the
   accent token's brightness flips between themes.

4. **The accent token brightens in dark.** Light theme accent is
   ochre-gold (`#b8861f`); dark theme accent is butter-gold
   (`#ffc04f`) — same family, brighter in dark to read against the
   darker background. The 8%/10%/12% mixes scale proportionally.

## The sticky-cell background — must be opaque in BOTH themes

The virtualization mode's sticky header and frozen columns rely on
an OPAQUE background:

```css
table[data-ve-table-virtual] thead th {
  background: var(--vc-color-surface, #ffffff);
}
```

A transparent sticky cell would let scrolled body content bleed
through. `--vc-color-surface` is the table's own background —
guaranteed opaque in both themes:

- Light: `--vc-color-surface = #ffffff` (or near-white).
- Dark: `--vc-color-surface = #1a1612` (or near-black).

Both fully opaque. A theme toggle changes which opaque color is
shown; the sticky overlay continues to mask scrolled content
underneath.

If a DESIGN.md author defined `--vc-color-surface` as a
semi-transparent color (e.g. `rgba(255,255,255,0.9)`), the sticky
cells would bleed. This is a DESIGN.md authoring bug, not a module
bug — the module relies on the engine's contract that surface
tokens are opaque.

## Testing the theme flip

A manual test:

1. Load a page with the module + DESIGN.md engine.
2. Open every mode: a `data` table, a `matrix` table, a `compare`
   table, ideally one with virtualization + frozen columns.
3. Toggle the theme — usually a button or `<html data-theme="dark">`
   attribute switch.
4. For every visual signal (sort arrow, glyph color, cell tint,
   emphasis lane, focus outline, freeze edge, CSV button), confirm:
   - It is VISIBLE in both themes.
   - It has DISTINCT colors in light vs dark (not literally the
     same hex).
   - It reads as the same SEMANTIC (pass is still green-family in
     both; danger is still red-family).

A "verify in three places" pass (see the project's
browser-ui-test-techniques rule): check the DOM, the rendered
canvas, AND the localStorage state where applicable.

See [skills/amvcp-self-debug-rules/SKILL.md](
../../amvcp-self-debug-rules/SKILL.md) for the full visual debug
checklist including the dev-browser snippets.

## DESIGN.md tokens consumed

This reference is itself about token consumption — see the table in
[What the theme toggle re-paints](#what-the-theme-toggle-re-paints)
above. Every value the module reads is a `--vc-*` token, never a
literal color outside the fallback hex.

## Selection / comment / decision-mini notes

Selection / comment / decision-mini visuals are owned by the
runtime, NOT this module. The runtime's own theming follows the same
single-stylesheet pattern: rules reference tokens, tokens flip on
theme toggle, the visuals re-paint. Cross-module consistency: a
row's pressed-state ring in the runtime, the sort arrow in this
module, and the matrix glyph color all flip together when the theme
toggles.
