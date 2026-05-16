# Responsive design & breakpoints in wireframes

A wireframe at one viewport width is incomplete — most products
ship on phones, tablets, AND desktops. This file documents the
breakpoint convention, the responsive grid patterns, and the
"render at three widths" practice.

## Table of contents

- [The standard breakpoint set](#the-standard-breakpoint-set)
- [Mobile-first vs desktop-first authoring](#mobile-first-vs-desktop-first-authoring)
- [The 3-viewport screenshot test](#the-3-viewport-screenshot-test)
- [Responsive grid patterns](#responsive-grid-patterns)
- [Container queries — the modern alternative](#container-queries--the-modern-alternative)
- [Show / hide per viewport](#show--hide-per-viewport)
- [Touch target sizes (44 × 44 minimum)](#touch-target-sizes-44--44-minimum)
- [Fluid typography (clamp + vw)](#fluid-typography-clamp--vw)
- [Hover-on-touch fallbacks](#hover-on-touch-fallbacks)
- [Orientation (portrait / landscape) handling](#orientation-portrait--landscape-handling)

---

## The standard breakpoint set

The wireframe skill follows a 4-breakpoint system:

| Name | Range | Devices | Test viewport |
|---|---|---|---|
| `sm` | 0 - 480px | Phones (portrait) | 390 (iPhone Pro) |
| `md` | 481 - 768px | Phones (landscape) / small tablets | 600 |
| `lg` | 769 - 1024px | Tablets / small laptops | 1024 (iPad Pro) |
| `xl` | 1025+ px | Desktop / wide screens | 1440 |

For 99% of wireframes, you'll author the `xl` (desktop) view + the
`sm` (mobile) view. The two intermediate (`md`, `lg`) often reflow
naturally if the grid uses `auto-fill` / `auto-fit`.

### CSS

```css
/* Mobile-first base (no media query — applies to sm and up) */
.my-element {
  /* small-viewport styles */
}

/* md and up */
@media (min-width: 481px) {
  .my-element {
    /* tablet styles */
  }
}

/* lg and up */
@media (min-width: 769px) {
  .my-element {
    /* small-desktop styles */
  }
}

/* xl and up */
@media (min-width: 1025px) {
  .my-element {
    /* large-desktop styles */
  }
}
```

---

## Mobile-first vs desktop-first authoring

### Mobile-first (recommended for marketing sites)

Start with the mobile layout. Add complexity for wider viewports
via `@media (min-width: …)`.

```css
.card-grid {
  display: grid;
  grid-template-columns: 1fr;     /* 1 column on mobile */
  gap: 16px;
}

@media (min-width: 769px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;     /* 2 columns on tablet+ */
  }
}

@media (min-width: 1025px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);     /* 3 columns on desktop */
  }
}
```

Mobile-first means the BASE styles work without any media queries
— good for old browsers, good for performance.

### Desktop-first (recommended for apps)

Start with the desktop layout. SIMPLIFY for narrower viewports.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);     /* 3 columns by default */
  gap: 16px;
}

@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;     /* 2 cols on tablet */
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;     /* 1 col on mobile */
  }
}
```

Desktop-first matches how MOST design tools work — you design the
canonical desktop view, then think about how it collapses.

For a WIREFRAME, either approach is fine. Pick the one that matches
your design tool's mental model.

---

## The 3-viewport screenshot test

Every wireframe MUST be verified at 3 viewport widths:

1. **390px** (iPhone Pro) — the smallest practical mobile.
2. **768px** (iPad) — the smallest tablet / largest phone.
3. **1440px** (laptop) — the default desktop.

For wireframes that will run on huge screens, add:

4. **1920px** (full HD) — desktop monitor.

### Automated screenshot test

Use the dev-browser plugin:

```js
// pseudocode
for (const width of [390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.screenshot(`wireframe-${width}.png`);
}
```

Compare the screenshots side-by-side. Look for:

- Text that gets cut off.
- Buttons that overlap.
- Layout columns that wrap unexpectedly.
- Elements that disappear off-screen.

Any of these = a bug. Fix the responsive CSS.

---

## Responsive grid patterns

### Auto-fill (wraps to N columns based on width)

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
```

- Each card is at LEAST 240px wide.
- As many cards as fit per row at that width.
- On 1440px wide: 6 columns. On 768px: 3 columns. On 390px: 1
  column (240 doesn't fit twice in 390).
- `auto-fill` keeps empty cells when fewer items than cells; for
  "shrink the LAST cards to fill the row", use `auto-fit`.

### Sidebar + content (collapses on mobile)

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;     /* sidebar + content */
  gap: 32px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;     /* stack on mobile */
  }
}
```

For an alternative — sidebar BECOMES a top nav on mobile:

```css
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .layout > .sidebar {
    display: flex;
    flex-direction: row;
    overflow: visible;     /* no horizontal scroll */
    flex-wrap: wrap;
  }
}
```

### Asymmetric responsive (2/3 + 1/3 on desktop, stack on mobile)

```css
.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```

### Hero with side-by-side image (alternating per breakpoint)

```css
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero > img {
    order: -1;     /* image first on mobile */
  }
}
```

---

## Container queries — the modern alternative

Container queries let you style based on the CONTAINER'S width,
not the viewport's. Useful for components that ship in multiple
contexts (a card might be wide on the desktop sidebar AND narrow
in a mobile feed).

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 320px) {
  .card {
    display: grid;
    grid-template-columns: 80px 1fr;
  }
}

@container card (max-width: 319px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

Container queries shipped in all major browsers in 2023. They're
the future of responsive design — use them when the component is
shared across narrow + wide contexts.

For wireframes, container queries are advanced. Media queries are
fine for 95% of cases.

---

## Show / hide per viewport

Use utility classes for show/hide:

```css
/* visible only on mobile */
.show-on-mobile { display: block; }
.hide-on-mobile { display: none; }

@media (min-width: 769px) {
  .show-on-mobile { display: none; }
  .hide-on-mobile { display: block; }
}
```

Usage in wireframe:

```html
<header class="wf-header">

  <!-- mobile only: hamburger -->
  <button class="wf-button wf-button--ghost show-on-mobile">☰</button>

  <span class="wf-text">brand</span>

  <!-- desktop only: full nav -->
  <nav class="wf-nav hide-on-mobile">
    <a class="wf-nav-item">Home</a>
    <a class="wf-nav-item">Pricing</a>
    <a class="wf-nav-item">Docs</a>
  </nav>

</header>
```

### Notes

- The HAMBURGER on mobile opens a drawer with the full nav.
- The FULL NAV on desktop replaces the hamburger.
- Both elements are in the DOM at all times; CSS shows/hides per
  viewport.

For accessibility, `display: none` correctly removes the element
from the screen-reader tree. Don't use `visibility: hidden` or
`opacity: 0` for responsive show/hide — those keep the element
in the focus order (confusing for keyboard users).

---

## Touch target sizes (44 × 44 minimum)

Touch targets MUST be at least 44 × 44 px (Apple HIG, WCAG AAA).
Smaller targets are frustrating to tap and fail accessibility.

The `wf-button` default is comfortably above 44 × 44 (24px text +
12px vertical padding × 2 = 48px tall). The DANGER targets:

- Toolbar buttons with `padding: 6px 10px` — only 26-30px tall.
  Bump padding on mobile.
- Nav items with `padding: 8px 12px` — only 32px tall. Bump
  padding on mobile.
- Icon-only buttons (`×` close, `⋮` menu) — naturally small.
  Wrap in a larger touch target.

```css
/* Default — desktop -ok */
.icon-button {
  padding: 4px;
  font-size: 16px;
}

/* On touch, bump up */
@media (pointer: coarse) {
  .icon-button {
    padding: 12px;     /* 16px text + 12 × 2 padding = 40px square (still under, bump again) */
    min-width: 44px;
    min-height: 44px;
  }
}
```

`@media (pointer: coarse)` targets touch devices (vs `pointer:
fine` for mouse).

---

## Fluid typography (clamp + vw)

Use `clamp()` for fluid type that scales smoothly between
viewport widths:

```css
:root {
  --text-xs:   clamp(11px, 1.2vw, 13px);
  --text-sm:   clamp(13px, 1.4vw, 15px);
  --text-base: clamp(15px, 1.6vw, 17px);
  --text-md:   clamp(17px, 1.8vw, 20px);
  --text-lg:   clamp(20px, 2.2vw, 24px);
  --text-xl:   clamp(24px, 3vw, 32px);
  --text-2xl:  clamp(32px, 4vw, 48px);
  --text-3xl:  clamp(48px, 6vw, 72px);
}

/* Hero display */
.hero-headline {
  font-size: clamp(48px, 7.2vw, 96px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-weight: 480;
}
```

`clamp(min, ideal, max)` reads:
- At narrow viewports, use the MIN (11px).
- At wide viewports, use the MAX (13px).
- In between, scale by IDEAL (1.2vw = 1.2% of viewport width).

The result: text smoothly grows from min to max as the viewport
widens. No media-query forest needed.

### Height breakpoints

For viewport-height-aware sizing (slides, fullscreen heroes):

```css
@media (max-height: 700px) {
  :root { --text-hero: clamp(32px, 5vw, 56px); }
}

@media (max-height: 500px) {
  :root { --text-hero: clamp(24px, 4vw, 40px); }
}
```

Useful when a presentation slide is rendered on a half-height
window — the hero shouldn't overflow.

---

## Hover-on-touch fallbacks

`:hover` doesn't fire on touch devices. Patterns that rely on
hover (tooltips, dropdown menus on hover) break on touch.

```css
/* Default: show on hover */
.tooltip-trigger:hover .tooltip {
  opacity: 1;
}

/* On touch: show always or on click */
@media (hover: none) {
  .tooltip { display: none; }     /* hide on touch */
  /* the trigger should still convey the info inline */
}
```

For DROPDOWN menus, the touch fallback is "click to open":

```css
/* Desktop: open on hover */
.menu-trigger:hover + .menu-panel {
  display: block;
}

/* Touch: open on click via JS toggle */
@media (hover: none) {
  .menu-trigger:hover + .menu-panel {
    display: none;     /* disable hover-open */
  }
  .menu-trigger.is-open + .menu-panel {
    display: block;     /* JS toggles the class */
  }
}
```

For tooltips, the touch alternative is usually a SHORT visible
label (not a hover) or a question mark icon that opens a modal.

---

## Orientation (portrait / landscape) handling

A phone in landscape is wider than tall — most layouts adapt
naturally if they're responsive.

For SPECIFIC orientation handling:

```css
/* Portrait only */
@media (orientation: portrait) {
  .full-screen-hero {
    aspect-ratio: 9 / 16;
  }
}

/* Landscape only */
@media (orientation: landscape) {
  .full-screen-hero {
    aspect-ratio: 16 / 9;
  }
}
```

For wireframes, orientation is rarely worth a media query — design
for the typical case (mobile = portrait, desktop = landscape). If
the rare orientation breaks, add a media query.

For VIDEO PLAYERS or PHOTO GALLERIES — orientation MATTERS:
landscape gets a wide aspect, portrait gets a tall aspect. Always
handle both.

---

## Common responsive bugs in wireframes

### Bug 1: text overlaps on narrow viewports

**Cause**: Two flex children both want the same width; no
`flex-wrap`.

**Fix**:

```css
.flex-row {
  display: flex;
  flex-wrap: wrap;     /* allow wrapping */
  gap: 12px;
}
```

### Bug 2: image is huge on mobile

**Cause**: Image has a fixed width.

**Fix**:

```css
.responsive-image {
  width: 100%;
  height: auto;
  max-width: 480px;     /* cap on wide viewports */
}
```

### Bug 3: button doesn't fit, gets cut off

**Cause**: Button has fixed width.

**Fix**:

```css
.wf-button {
  white-space: nowrap;     /* don't wrap inside */
  /* OR */
  min-width: 0;            /* allow shrinking in flex */
}
```

### Bug 4: sidebar narrows the main content to nothing on tablet

**Cause**: Sidebar has a fixed width that takes up most of the
viewport.

**Fix**: Collapse the sidebar to a top nav (or a drawer) on tablet
and below:

```css
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .layout > .sidebar {
    grid-row: 1;     /* move sidebar to TOP */
  }
}
```

### Bug 5: modal larger than the viewport

**Cause**: Modal uses fixed width without `min(…, 90vw)`.

**Fix**:

```css
.wf-modal {
  width: min(440px, 90vw);     /* 440px or 90% of viewport */
  margin-inline: auto;
}
```

This is the kit's default — only override if you need a wider
modal for a specific use case.
