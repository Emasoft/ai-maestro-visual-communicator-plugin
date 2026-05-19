# Theme behavior — light, dark, and the desaturation guarantee

A wireframe is ALWAYS theme-correct. Both light and dark themes
are first-class; the fidelity engine guarantees grayscale-at-
wireframe regardless of which theme is active. This file documents
the contract, the hot-swap path, and the troubleshooting steps.

## Table of contents

- [The two-theme guarantee](#the-two-theme-guarantee)
- [How light + dark are derived from the DESIGN.md](#how-light--dark-are-derived-from-the-designmd)
- [Theme flip — the `ve:themechange` event](#theme-flip--the-vethemechange-event)
- [Lightness preservation — why both themes work](#lightness-preservation--why-both-themes-work)
- [Per-theme spot illustrations](#per-theme-spot-illustrations)
- [The device-frame exception (fixed dark bezel)](#the-device-frame-exception-fixed-dark-bezel)
- [Per-screen theme override (the "dark mode preview")](#per-screen-theme-override-the-dark-mode-preview)
- [Theme-toggle wireframe pattern](#theme-toggle-wireframe-pattern)
- [Common theme bugs and fixes](#common-theme-bugs-and-fixes)
- [The "screenshot in both themes" rule](#the-screenshot-in-both-themes-rule)

---

## The two-theme guarantee

Every wireframe MUST render correctly in BOTH light and dark
themes — no exceptions. This is not a "nice-to-have"; it's a
correctness invariant. A wireframe that looks broken on dark theme
is BROKEN, full stop.

How the guarantee is enforced:

1. **Every color is a `--vc-color-*` token.** No raw hex values
   except the comma-fallback (engine-absent path) and the device
   bezel (sanctioned exception).
2. **The desaturation engine PRESERVES lightness.** A light theme's
   canvas (light) desaturates to light-grey; a dark theme's canvas
   (dark) desaturates to dark-grey.
3. **Theme flips re-run desaturation.** When the runtime fires
   `ve:themechange`, every wireframe root re-publishes its scoped
   grey set from the NEW theme's tokens.
4. **Contrast ratios stay AA.** Because lightness is preserved,
   the content-on-canvas contrast ratio is identical across themes
   and fidelities.

---

## How light + dark are derived from the DESIGN.md

The DESIGN.md engine publishes TWO color sets: one keyed off
`[data-ve-theme="light"]`, one off `[data-ve-theme="dark"]`. The
active theme is set by the runtime on `<html>`:

```html
<html data-ve-theme="light">
```

When the user toggles, the runtime flips to:

```html
<html data-ve-theme="dark">
```

CSS variables cascade — every element inside `<html>` resolves
`--vc-color-*` to the active theme's value.

For the wireframe, the engine reads `--vc-color-*` off `:root`
(which inherits from `<html>`), desaturates, publishes the scoped
grey set onto every `[data-wf-root]`. The DESCENDANTS of the
wireframe see the grey set; the rest of the page sees the real
theme.

```
<html data-ve-theme="dark">
  ├─ [data-ve-theme]              → real dark tokens
  └─ [data-wf-root]
       ├─ inline --vc-color-*     → desaturated grey set
       └─ descendants             → see the grey set
```

This scoping is THE key trick — the same DESIGN.md powers both the
production look AND the wireframe look, on the same page, at the
same time.

---

## Theme flip — the `ve:themechange` event

When the active theme changes (manual toggle, OS theme change,
DESIGN.md hot-swap), the runtime dispatches a custom DOM event on
`document`:

```js
document.dispatchEvent(new CustomEvent('ve:themechange', {
  detail: { theme: 'dark' }
}));
```

The wireframe engine subscribes:

```js
document.addEventListener('ve:themechange', function () {
  _redesaturateAll(document);
});
```

`_redesaturateAll` walks every `[data-wf-root]` and re-publishes
the scoped color set from the NEW theme's `--vc-color-*` values.
The wireframe re-paints LIVE — light-grey on light theme, dark-grey
on dark theme.

This event is REQUESTED by the wireframe engine but not REQUIRED.
A host that never fires it just never gets the live re-paint — the
initial desaturation at `init()` still happened. The engine is
defensive; cross-file wiring is a later integration pass.

---

## Lightness preservation — why both themes work

The desaturation algorithm zeros out CHROMA but keeps LIGHTNESS:

```js
function desaturateToken(cssColor, fidelity, isAccent) {
  var k = fidelityFactor(fidelity, isAccent);
  if (k >= 1) { return cssColor; }
  var rgb = parseColor(cssColor);
  var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = hsl.s * k;                 // scale chroma
  // hsl.l stays exactly the same
  return _rgbToHex(hslToRgb(hsl.h, hsl.s, hsl.l));
}
```

The HSL "L" channel maps a color to a perceptually-fair midpoint
on the black-to-white scale. Lightness 0.95 is near-white;
lightness 0.10 is near-black. ALL THEMES use the same L-channel
scale.

Example with the default DESIGN.md tokens:

| Token | Light theme | Light grey-equiv | Dark theme | Dark grey-equiv |
|---|---|---|---|---|
| `--vc-color-canvas` | `#faf6ee` (L: 0.96) | `#f4f4f4` (L: 0.96) | `#1a1814` (L: 0.10) | `#1a1a1a` (L: 0.10) |
| `--vc-color-content` | `#1f1a14` (L: 0.10) | `#1a1a1a` (L: 0.10) | `#faf6ee` (L: 0.96) | `#f4f4f4` (L: 0.96) |
| `--vc-color-border` | `#e3dcc9` (L: 0.85) | `#d8d8d8` (L: 0.85) | `#3a3528` (L: 0.20) | `#333333` (L: 0.20) |

The desaturated greys preserve the LIGHTNESS of the original
tokens — light theme stays light, dark theme stays dark, and the
contrast ratios are identical between themes.

This is what makes the wireframe theme-correct without any
per-theme overrides. The engine handles BOTH themes from ONE
implementation.

---

## Per-theme spot illustrations

If a wireframe includes IMAGES (not just placeholder shapes), the
images should adapt to the theme. Two strategies:

### Strategy 1: theme-aware SVG (recommended)

Use inline SVG with `currentColor`:

```html
<svg class="wf-image-svg" viewBox="0 0 64 64"
     style="color:var(--vc-color-content);
            width:64px; height:64px;">
  <circle cx="32" cy="32" r="30"
          fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M16 32l8 8 24-24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
</svg>
```

`currentColor` resolves to the parent's `color` property — which
the wireframe sets to `var(--vc-color-content)`. Light theme →
dark icon, dark theme → light icon, auto.

### Strategy 2: pair of images, picked by theme

Two `<img>` elements; one shown per theme:

```html
<img src="hero-light.png" alt="Hero"
     class="theme-light-only">
<img src="hero-dark.png" alt="Hero"
     class="theme-dark-only">

<style>
.theme-light-only { display: block; }
.theme-dark-only { display: none; }

[data-ve-theme="dark"] .theme-light-only { display: none; }
[data-ve-theme="dark"] .theme-dark-only { display: block; }
</style>
```

Used when SVG isn't viable (photographic illustrations, complex
brand artwork). The pair MUST be content-equivalent — same subject,
different palette.

---

## The device-frame exception (fixed dark bezel)

The four device frames (`wf-frame--ios`, `--android`, `--macbook`)
use a HARDCODED dark bezel gradient:

```css
.wf-frame {
  background: linear-gradient(160deg, #2a2a2c, #1a1a1c 50%, #0e0e10);
}
```

This is the ONE place in the wireframe skill where a hardcoded
color is sanctioned. Real device hardware is DARK in every OS
theme. An iPhone bezel doesn't change color when you flip to dark
mode. A themed bezel (light grey in light theme, dark grey in
dark theme) would render WRONG every time the user expects to see
"hardware".

The browser frame (`wf-frame--browser`) is NOT an exception — it
uses `--vc-color-surface` for its background. Browsers theme with
the OS; their chrome adapts.

Status-bar glyphs INSIDE the frame DO theme-flip — they use
`currentColor` which resolves to `--vc-color-content`:

```css
.wf-frame__statusbar {
  color: var(--vc-color-content);
}
.wf-frame__statusbar svg {
  fill: currentColor;
}
```

Light theme → dark glyphs on dark bezel (fine, the bezel is dark).
Dark theme → light glyphs on dark bezel (fine, the bezel is dark
and glyphs are now light — better contrast).

---

## Per-screen theme override (the "dark mode preview")

To force a SINGLE wireframe to show as dark theme (regardless of
the page's active theme), set `data-ve-theme` directly on the
wireframe root:

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-ve-theme="dark">
  <!-- this wireframe always renders dark, even on light pages -->
</div>

<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-ve-theme="light">
  <!-- this wireframe always renders light -->
</div>
```

Use case: a "dark mode preview" section in a marketing site —
show the product on light + dark themes side-by-side, regardless
of the user's preference.

The DESIGN.md engine respects the closest `[data-ve-theme]`
ancestor, so this override scopes correctly.

---

## Theme-toggle wireframe pattern

Showing a theme-toggle CONTROL in a wireframe:

```html
<header class="wf-header">
  <span>brand</span>
  <nav>
    <a href="#screen-home">Home</a>
    <a href="#screen-docs">Docs</a>
  </nav>

  <!-- theme toggle as a button group -->
  <div style="display:flex; gap:4px;
              background:var(--vc-color-surface-sunken);
              padding:2px;
              border-radius:6px;">
    <button class="wf-button" style="padding:4px 8px;
                                       background:var(--vc-color-content);
                                       color:var(--vc-color-canvas);">☀</button>
    <button class="wf-button wf-button--ghost"
            style="padding:4px 8px;">🌙</button>
    <button class="wf-button wf-button--ghost"
            style="padding:4px 8px;">A</button>
  </div>
</header>
```

The active mode (sun = light, moon = dark, A = auto/system) has a
filled button; inactive modes are ghost. At wireframe fidelity,
all buttons desaturate to grey — the SUN/MOON GLYPHS still
distinguish them.

---

## Common theme bugs and fixes

### Bug 1: "Wireframe looks washed out on dark theme"

**Cause**: A hardcoded `#fff` or `rgba(255,255,255,…)` somewhere
in the markup. On dark theme, white-on-dark loses contrast.

**Fix**: Replace with `var(--vc-color-content)` or
`var(--vc-color-canvas)` — whichever is appropriate for the
context.

### Bug 2: "Modal overlay scrim is invisible on dark theme"

**Cause**: A hardcoded `rgba(0,0,0,0.5)` for the overlay
background. On dark theme, black-over-dark is invisible.

**Fix**: Use `color-mix(in srgb, var(--vc-color-content) 45%, transparent)`
— scrim themes off foreground color, so dark theme gets a soft-WHITE
scrim.

### Bug 3: "Accent color leaks at fidelity=wireframe"

**Cause**: A hardcoded hex (instead of `--vc-color-accent`) used
in an inline style or CSS rule. The desaturation engine only
rewrites `--vc-color-*` custom properties, not literal hex.

**Fix**: Grep your stylesheet for hex values:

```bash
grep -E '#[0-9a-fA-F]{3,6}' wireframe.css | \
  grep -v 'var(--vc-color' | \
  grep -v 'wf-frame'
```

Replace any hits with `var(--vc-color-…, <fallback>)`.

### Bug 4: "Status bar glyphs are invisible on dark theme"

**Cause**: SVG glyphs use `fill="#1f1a14"` (hardcoded dark) instead
of `currentColor`.

**Fix**: Replace `fill="#1f1a14"` with `fill="currentColor"` on
every SVG path / shape inside `.wf-frame__statusbar`. The CSS
`color: var(--vc-color-content)` on the statusbar will then drive
the SVG fill correctly.

### Bug 5: "Theme flip doesn't update the wireframe"

**Cause**: The runtime isn't firing `ve:themechange`, so the
wireframe engine's listener never runs.

**Fix**: Either configure the runtime to dispatch the event, or
manually call `amvcpWireframe.refresh(document)` after every theme
toggle. The refresh re-publishes the scoped color set with the
new theme's tokens.

---

## The "screenshot in both themes" rule

The user MEMORY rule (`feedback_light_dark_themes.md`) is explicit:
every visual MUST ship in BOTH light and dark themes. A single-theme
wireframe is a CORRECTNESS DEFECT.

For wireframe verification:

1. Render the wireframe in light theme. Screenshot.
2. Toggle to dark theme. Screenshot.
3. Compare side-by-side.

For COMPLIANCE: both screenshots must show the SAME LAYOUT, the
same focal points, the same affordances. Differences in COLOR are
expected; differences in SHAPE, POSITION, or LEGIBILITY are bugs.

This rule is enforced at WIREFRAME fidelity (where the differences
are usually subtle) AND at HI fidelity (where the brand colors
re-emerge and theme-specific tuning matters more).

For automation, use the dev-browser plugin to script both
screenshots:

```python
# 1. Light theme
page.evaluate('document.documentElement.dataset.veTheme = "light"')
page.screenshot('light.png')

# 2. Dark theme
page.evaluate('document.documentElement.dataset.veTheme = "dark"')
page.screenshot('dark.png')
```

Both must look correct before the wireframe is considered done.
