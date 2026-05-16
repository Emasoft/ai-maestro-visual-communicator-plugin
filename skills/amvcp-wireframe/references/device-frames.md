# Device frames — 4 pure-CSS hardware bezels

Wrap a wireframe screen in a CSS-only device bezel. Four frames ship:
iOS (iPhone 15 Pro), Android (Pixel-class), MacBook, browser. All are
pure CSS — no images, no SVG, no `<iframe>`. The screen content area
is fully `--vc-*` tokenized and themes normally.

## Table of contents

- [The 4 frames — pick by device class](#the-4-frames--pick-by-device-class)
- [Frame geometry — the size, radius, border budget](#frame-geometry--the-size-radius-border-budget)
- [Frame 1 — `wf-frame--ios` (iPhone 15 Pro)](#frame-1--wf-frame--ios-iphone-15-pro)
- [Frame 2 — `wf-frame--android` (Pixel-class)](#frame-2--wf-frame--android-pixel-class)
- [Frame 3 — `wf-frame--macbook`](#frame-3--wf-frame--macbook)
- [Frame 4 — `wf-frame--browser` (desktop window chrome)](#frame-4--wf-frame--browser-desktop-window-chrome)
- [The fixed-dark-bezel exception — why it's not themed](#the-fixed-dark-bezel-exception--why-its-not-themed)
- [Status-bar glyph styling — light glyphs on dark theme](#status-bar-glyph-styling--light-glyphs-on-dark-theme)
- [No nested scrollbars — `wf-frame__content` invariant](#no-nested-scrollbars--wf-frame__content-invariant)
- [Responsive degradation — frames narrower than 460px](#responsive-degradation--frames-narrower-than-460px)
- [Customisation — overriding the per-frame geometry](#customisation--overriding-the-per-frame-geometry)

---

## The 4 frames — pick by device class

| Frame | Device | Width × Height | Radius | Bezel border |
|---|---|---|---|---|
| `wf-frame--ios` | iPhone 15 / 16 Pro | 393 × 852 | 47px | 12px |
| `wf-frame--android` | Pixel 7 / 8 Pro | 412 × 915 | 36px | 10px |
| `wf-frame--macbook` | MacBook Pro 14" | 1280 × 800 | 18px | 16px |
| `wf-frame--browser` | Desktop browser window | 1280 × 720 | 12px | 0px |

A frame is a mounting box for ONE screen — typically a mobile
archetype for `--ios` / `--android`, an app archetype for
`--macbook`, a web archetype for `--browser`.

---

## Frame geometry — the size, radius, border budget

Every frame uses the same four `--wf-frame-*` custom properties:

| Token | What it sets |
|---|---|
| `--wf-frame-w` | Width of the bezel + screen (in px) |
| `--wf-frame-h` | Min-height of the bezel + screen (in px) |
| `--wf-frame-radius` | Outer corner radius of the bezel |
| `--wf-frame-border` | Bezel padding — distance from outer edge to screen edge |

The screen content area's radius is derived:
`calc(var(--wf-frame-radius) - var(--wf-frame-border))`. So an iOS
frame with 47px outer + 12px bezel yields a 35px inner radius —
matches a real iPhone's screen corner radius.

The four per-frame classes (`wf-frame--ios`, `--android`, etc.) just
SET these four tokens. The shared `.wf-frame` rule does all the
visual work.

---

## Frame 1 — `wf-frame--ios` (iPhone 15 Pro)

```html
<div class="wf-frame wf-frame--ios">
  <div class="wf-frame__island"></div>
  <div class="wf-frame__content">
    <header class="wf-frame__statusbar">
      <span class="wf-frame__time">9:41</span>
      <span class="wf-frame__indicators">
        <svg viewBox="0 0 16 12" width="16" height="12">
          <rect x="0" y="9" width="3" height="3"/>
          <rect x="4" y="6" width="3" height="6"/>
          <rect x="8" y="3" width="3" height="9"/>
          <rect x="12" y="0" width="3" height="12"/>
        </svg>
      </span>
    </header>

    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <section class="wf-screen" id="screen-home"
               data-ve-id="screen-home"
               data-ve-type="wireframe-screen">
        <div class="wf-archetype--mobile">
          <main class="wf-main">
            <article class="wf-card">
              <header class="wf-card__title">
                <span class="wf-text" data-wf-lines="1">Today</span>
              </header>
              <p class="wf-text" data-wf-lines="3"></p>
            </article>
          </main>
        </div>
      </section>
    </div>
  </div>
  <div class="wf-frame__home"></div>
</div>
```

### Anatomy

- `wf-frame__island` — the Dynamic Island. A dark pill positioned
  absolutely, top-center, `124 × 36px`, `border-radius: 18px`.
  Background `#060608` (the SECOND sanctioned non-token value —
  device hardware feature, dark in every theme).
- `wf-frame__home` — the home indicator. A slim pill at the bottom,
  `134 × 5px`, `border-radius: 3px`, background is
  `color-mix(in srgb, var(--vc-color-content) 55%, transparent)` —
  themes off the foreground content color (dark in light theme,
  light in dark theme).
- `wf-frame--ios::before` — the LEFT side rail (volume + action
  button). 3px wide, 110px tall, positioned 110px from the top of
  the left edge of the bezel.
- `wf-frame--ios::after` — the RIGHT side rail (side button). 3px
  wide, 78px tall, positioned 150px from the top of the right edge.

### When to use

- A mobile app mockup that's targeting iPhone first.
- A B2C product where the "real device" framing helps the audience
  imagine using it.
- ANY screenshot you might paste into a marketing deck.

### Things to keep in mind

- The Dynamic Island is REAL geometry — it covers the top of the
  screen content. Account for it in the status bar: the iOS status
  bar always has the time on the LEFT (next to the island) and the
  indicators on the RIGHT.
- A long screen (a settings page with 30 rows) makes the iOS frame
  GROW vertically with the content — the home indicator floats DOWN
  with the bezel. This is intentional and correct (`overflow:
  visible` on `wf-frame__content` — see invariant below).

---

## Frame 2 — `wf-frame--android` (Pixel-class)

```html
<div class="wf-frame wf-frame--android">
  <div class="wf-frame__island"></div>   <!-- punch-hole camera -->
  <div class="wf-frame__content">
    <header class="wf-frame__statusbar">
      <span class="wf-frame__time">9:41</span>
      <span class="wf-frame__indicators">…icons…</span>
    </header>
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <section class="wf-screen" id="screen-home"
               data-ve-id="screen-home"
               data-ve-type="wireframe-screen">
        <div class="wf-archetype--mobile">…</div>
      </section>
    </div>
  </div>
</div>
```

### Differences from iOS

- Geometry: 412 × 915, 36px radius, 10px bezel — taller and narrower
  corner curvature than iPhone.
- `wf-frame__island` is RE-PURPOSED as the punch-hole camera — a
  `12px` circle (`--wf-dot-d`) instead of the iOS pill. The CSS
  override makes the same element render differently.
- NO home indicator — Android uses gesture-mode in modern Pixels, no
  visible pill.
- NO side button rails — Pixel buttons are less visually distinctive
  than iPhone's side buttons.

### When to use

- An Android-first app mockup.
- A cross-platform mockup where you want to show "here's how it
  looks on Android" alongside "here's iOS".
- A general "mobile app" mockup where the target platform isn't
  specified — Android frames are slightly less brand-coded.

---

## Frame 3 — `wf-frame--macbook`

```html
<div class="wf-frame wf-frame--macbook">
  <div class="wf-frame__island"></div>   <!-- camera dot in lid bezel -->
  <div class="wf-frame__content">
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <section class="wf-screen" id="screen-app" data-ve-id="screen-app"
               data-ve-type="wireframe-screen">
        <div class="wf-archetype--app">…</div>
      </section>
    </div>
  </div>
</div>
```

### Anatomy

- Geometry: 1280 × 800, 18px radius, 16px bezel.
- `wf-frame--macbook::after` paints the BASE WEDGE below the lid —
  108%-wide trapezoid, 22px tall, with a gradient from `#2a2a2c` to
  `#161618`. Sits below the bezel via `margin-bottom: 22px`.
- `wf-frame__island` is the camera dot in the top bezel — `6 × 6px`,
  background `#3a3a3c`.
- NO status bar — the macOS menu bar would belong INSIDE the screen
  content (use a `wf-titlebar` block from the app archetype).

### When to use

- A desktop app mockup where you want hardware framing.
- A marketing screenshot for a desktop product.
- A demo video poster.

### Things to keep in mind

- The base wedge adds 22px below the frame — DON'T tightly stack a
  `wf-frame--macbook` next to other content; leave at least 32px of
  bottom margin.
- macOS apps have their OWN titlebar (menu bar). Put that INSIDE the
  frame using `wf-titlebar`, not as part of the frame itself.

---

## Frame 4 — `wf-frame--browser` (desktop window chrome)

```html
<div class="wf-frame wf-frame--browser">
  <div class="wf-frame__chromebar">
    <span class="wf-traffic-lights">
      <span></span><span></span><span></span>
    </span>
    <div class="wf-frame__url">https://example.com/checkout</div>
  </div>
  <div class="wf-frame__content">
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <section class="wf-screen" id="screen-web" data-ve-id="screen-web"
               data-ve-type="wireframe-screen">
        <div class="wf-archetype--web">…</div>
      </section>
    </div>
  </div>
</div>
```

### Differences from device frames

- NO dark bezel — the background is `var(--vc-color-surface)`. The
  browser is a desktop application, themed off the system; a dark
  bezel would look wrong on a light theme.
- `wf-frame__chromebar` — replaces the status bar. Holds the
  traffic lights + URL pill. Sunken background
  (`--vc-color-surface-sunken`).
- `wf-frame__url` — the URL bar. Pill-shaped (`border-radius: 999px`),
  sunken text.
- Geometry: 1280 × 720, 12px radius, 0px bezel.

### When to use

- A web app mockup where the URL is part of the story.
- A landing page mockup framed as "see this in a browser".
- A multi-step flow where the URL changes per step (checkout: /cart
  → /payment → /confirm).

### Things to keep in mind

- The URL pill is the ONE place to put a real URL in a wireframe.
  Use it for navigation context: `/checkout/cart`,
  `/dashboard/users/42`, etc.
- The chrome bar is themed off `--vc-color-surface-sunken` so it
  re-styles correctly when the theme flips.

---

## The fixed-dark-bezel exception — why it's not themed

The four device frames are the ONE place in the wireframe skill where
a hardcoded color is sanctioned:

```css
.wf-frame {
  background: linear-gradient(160deg, #2a2a2c, #1a1a1c 50%, #0e0e10);
}
```

Real device hardware is DARK in every OS theme. An iPhone bezel
doesn't change color when you flip to dark mode. A themed bezel
(light grey in light theme, dark grey in dark theme) would render
wrong every time the user expects to see "hardware".

This is the audited exception. EVERY other color in the wireframe
skill reads `var(--vc-color-*, <fallback>)`. The browser frame is
NOT an exception (it has no dark bezel; its chrome is themed). Only
the three physical-device frames (`--ios`, `--android`, `--macbook`)
use the fixed gradient.

If you ever need to soften this for a high-key marketing shot, override
the gradient locally:

```html
<div class="wf-frame wf-frame--ios"
     style="background: linear-gradient(160deg, #6a6a6c, #5a5a5c 50%, #4e4e50);">
  …
</div>
```

But this should be rare — the fixed dark bezel reads as "real
device" in 99% of contexts.

---

## Status-bar glyph styling — light glyphs on dark theme

The status-bar text (`9:41`) and the indicator SVGs (signal / wifi /
battery glyphs) key off the runtime theme:

```css
.wf-frame__statusbar {
  color: var(--vc-color-content, #1f1a14);
}
.wf-frame__statusbar svg {
  fill: currentColor;
  stroke: currentColor;
}
```

- In a LIGHT theme, the status bar text is DARK (`--vc-color-content`
  resolves to a near-black).
- In a DARK theme, the status bar text is LIGHT (`--vc-color-content`
  resolves to a near-white).
- The SVG glyphs use `currentColor` so they pick up the text color
  automatically — no per-icon override needed.

This keys off the runtime's `[data-ve-theme]` attribute (the
runtime sets it on `<html>` when the theme flips). NOT the OS
`prefers-color-scheme` — the runtime owns theme; the OS only sets
the INITIAL default.

---

## No nested scrollbars — `wf-frame__content` invariant

The frame `overflow: visible` — a long screen extends the page with
the bezel growing around it. NEVER set `overflow: auto` or
`overflow: scroll` on `wf-frame__content`.

```css
.wf-frame__content {
  position: relative;
  overflow: visible;            /* invariant — never `auto` */
  min-height: calc(var(--wf-frame-h) - var(--wf-frame-border) * 2);
}
```

Why: if `wf-frame__content` had its own scrollbar, you'd have TWO
scrollbars on the page (the document's + the frame's). The reader
loses the find-in-page accuracy, can't scroll the frame with the
keyboard, screenshots are partial. See the global no-nested-scrollbars
rule for the full reasoning. Wireframe extends the page; the page
scrolls.

---

## Responsive degradation — frames narrower than 460px

A `wf-frame--ios` at 393px wide does NOT fit on a narrow phone
viewport (the phone the wireframe is BEING VIEWED ON, not the
device the wireframe represents). A media query below 460px makes
the frame shrink to fit:

```css
@media (max-width: 460px) {
  .wf-frame {
    width: 100%;
    min-height: 0;
    aspect-ratio: var(--wf-frame-w) / var(--wf-frame-h);
  }
}
```

- Width drops to 100%.
- Min-height drops to 0.
- An `aspect-ratio` rule preserves the original proportions.

The CONTENT inside the frame at narrow widths becomes very small
(the iPhone-393 screen rendered at 360 wide is 92% scale). This is
a deliberate trade-off — readability beats geometric fidelity at
small widths.

---

## Customisation — overriding the per-frame geometry

The four frames are convenient defaults. You can author your own by
setting the four custom properties:

```html
<div class="wf-frame"
     style="
       --wf-frame-w: 768px;
       --wf-frame-h: 1024px;
       --wf-frame-radius: 24px;
       --wf-frame-border: 14px;
     ">
  <div class="wf-frame__content">
    <!-- an iPad-class screen -->
  </div>
</div>
```

The shared `.wf-frame` styling (dark bezel gradient,
`overflow: visible`, content radius derivation) is reused. You only
override the geometry.

For a real-world device, look up the screen dimensions and the
corner radius from the manufacturer's spec sheet. Don't guess —
iPhones, Pixels, MacBooks all have specific values, and a 47px
radius vs a 36px radius is the difference between "this looks like
an iPhone" and "this looks like a generic touchscreen".
