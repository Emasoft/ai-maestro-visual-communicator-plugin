# Sub-technique C — Variable-font token layer

## Table of Contents

- [C.1 What it does](#c1-what-it-does)
- [C.2 The semantic weight tokens](#c2-the-semantic-weight-tokens)
- [C.3 The optical-size tokens](#c3-the-optical-size-tokens)
- [C.4 The variable-font axis layer](#c4-the-variable-font-axis-layer)
- [C.5 The static-font fallback — fail-soft (TY-04 requirement)](#c5-the-static-font-fallback--fail-soft-ty-04-requirement)
- [C.6 The JS feature-detect — diagnostic only](#c6-the-js-feature-detect--diagnostic-only)
- [C.7 TY-10 — stylistic alternates](#c7-ty-10--stylistic-alternates)
- [Tokens consumed / extended](#tokens-consumed--extended)

The missing *semantic weight* tokens + the variable-font axis plumbing.
Implements TY-04 (`wght` + `opsz` token system) and TY-10
(`font-feature-settings` stylistic alternates).

## C.1 What it does

The DESIGN.md engine ships only `weight-regular/medium/bold` (3 generic
weights). Real typography needs **role-named** weights — a display tier
slightly lighter than bold, a UI tier slightly heavier than medium — and
the optical-size (`opsz`) axis so large type uses the display optical
master and body type uses the text master. The layer degrades gracefully
to static `font-weight` when the loaded font is not variable.

## C.2 The semantic weight tokens

The "sweet spot" values from the catalog:

| Token | Value | Role | Static-font fallback |
|---|---|---|---|
| `--vc-weight-display` | 480 | hero / display type | 500 |
| `--vc-weight-heading` | 650 | headings H3–H6 | 600 |
| `--vc-weight-ui` | 510 | UI chrome | 500 |
| `--vc-weight-label` | 550 | badges / overlines | 500 |
| `--vc-weight-body` | 400 | body copy | 400 |

`--vc-weight-body` aliases the engine's `weight-regular`;
`--vc-weight-heading` / `display` sit between the engine's
`weight-medium` (500) and `weight-bold` (700).

These are added to the engine schema as **optional** keys
(`typography.weight-display`, `weight-heading`, `weight-ui`,
`weight-label`) by the integration pass. The CSS layer references them
through fallback chains so they work with or without the engine
emitting them:

```
var(--vc-weight-display, var(--vc-weight-bold, 700))
var(--vc-weight-heading, var(--vc-weight-medium, 500))
var(--vc-weight-label,   var(--vc-weight-medium, 500))
var(--vc-weight-body,    var(--vc-weight-regular, 400))
```

## C.3 The optical-size tokens

```css
:root {
  --vc-opsz-display: 72;   /* optical master for >=48px display type */
  --vc-opsz-text:    16;   /* optical master for body / small type   */
}
```

Plain `:root` (not gated on `data-ve-type-scale`) so they apply
whether or not the fluid layer is opted into.

## C.4 The variable-font axis layer

`font-variation-settings` drives the `wght` + `opsz` axes:

```css
.vc-type-hero, h1, h2 {
  font-variation-settings:
    "wght" var(--vc-weight-display, 480),
    "opsz" var(--vc-opsz-display, 72);
}
h3, h4, h5, h6 {
  font-variation-settings:
    "wght" var(--vc-weight-heading, 650),
    "opsz" var(--vc-opsz-text, 16);
}
p, body, .vc-type-lead, .vc-type-body-lg, .vc-type-body-sm {
  font-variation-settings:
    "wght" var(--vc-weight-body, 400),
    "opsz" var(--vc-opsz-text, 16);
}
```

## C.5 The static-font fallback — fail-soft (TY-04 requirement)

`font-variation-settings` on a static font is harmless (the browser
ignores axes the font lacks) — but a static font then renders at its
single weight, ignoring the semantic-weight intent. So the layer ALSO
sets `font-weight` referencing the **same token**:

```css
.vc-type-hero, h1, h2 { font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700)); }
h3, h4, h5, h6        { font-weight: var(--vc-weight-heading, var(--vc-weight-medium, 500)); }
.vc-type-label        { font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500)); }
p, body               { font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400)); }
```

`font-weight` and `font-variation-settings` coexist:
- on a **variable** font the variation-settings `"wght"` axis wins;
- on a **static** font only `font-weight` applies (the nearest weight).

Both reference the same token so they never disagree. This is the entire
**visual** fallback — **no JS needed** for it.

## C.6 The JS feature-detect — diagnostic only

`amvcp-typography.js` exposes:

- `supportsVariableFonts()` → `boolean` — `CSS.supports(
  'font-variation-settings', '"wght" 400')`. Fail-soft: if `CSS.supports`
  is itself missing (ancient browser) it returns `false` (the static
  path) rather than throwing.
- `markVariableFontSupport(rootEl)` → stamps `data-ve-vfont="yes|no"` on
  `<html>` (default) and returns the boolean.

This is **diagnostic only** — the visual fallback in C.5 works without
it. The specimen page reads `data-ve-vfont` to show the user "variable
axes active / static fallback".

## C.7 TY-10 — stylistic alternates

```css
.vc-type-alt {
  font-feature-settings: var(--vc-font-features, "salt" 1, "ss01" 1);
}
```

`--vc-font-features` is an optional engine key (`typography.font-features`,
string; default `"salt" 1, "ss01" 1`). Opt-in via the `.vc-type-alt`
class, display-only. On a font without `salt`/`ss*` features the
declaration is a **no-op** (the browser ignores unknown features) — so
it is fail-soft by construction.

## Tokens consumed / extended

- **Consumes:** `--vc-weight-regular/medium/bold` (engine).
- **Extends (optional engine keys, added by the integration pass):**
  `weight-display`, `weight-heading`, `weight-ui`, `weight-label` →
  `--vc-weight-*`; `font-features` → `--vc-font-features`. All optional;
  the CSS layer's fallback chains keep the page correct when they are
  absent.
