# 29 — Hero with radial glows + ghost text (`.la-hero` 4-layer)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The critical `overflow: clip` choice](#the-critical-overflow-clip-choice)
- [Why `color-mix(token, transparent)` not hardcoded `rgba()`](#why-color-mixtoken-transparent-not-hardcoded-rgba)
- [Why two glows at 28%/32% and 82%/78%](#why-two-glows-at-2832-and-8278)
- [Why the ghost word at `font-size: clamp(120px, 28vw, 420px)`](#why-the-ghost-word-at-font-size-clamp120px-28vw-420px)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use the hero](#when-to-use-the-hero)
- [Visual verification](#visual-verification)

A decorative page-top band with up to 4 visual layers: the engine's
canvas-token background, two radial-glow accents painted by
`::before`, a giant low-opacity ghost word painted by `::after`,
and the actual hero content on top. The glows use `color-mix(in
srgb, --vc-color-accent…, transparent)` over the engine's accent +
info tokens, so they recolour LIVE on a DESIGN.md swap and are
theme-coherent.

## What this is

A standard "marketing hero" / "report cover" visual: a coloured
band at the top of the page with the title, lede, and subtle
decorative effects. The layout's `.la-hero` provides the
infrastructure:

- **Layer 0 (canvas):** the engine's `--vc-color-canvas` background.
- **Layer 1 (glows):** `::before` paints two radial gradients
  — one accent-coloured glow at 28%/32%, one info-coloured glow
  at 82%/78%. Both via `color-mix(token, transparent)` so they
  recolour with the DESIGN.md.
- **Layer 2 (ghost text):** `::after` paints a giant low-opacity
  ghost word from `data-ghost` attribute. Acts as a decorative
  watermark.
- **Layer 3 (content):** `.la-hero__content` contains the actual
  title + lede, positioned above the decorative layers.

The four layers are stacked via `isolation: isolate` (which
contains the negative-z pseudo-elements) and negative z-indexes on
the decorative layers (`::before { z-index: -2 }`, `::after {
z-index: -1 }`).

## Scaffold to emit

```html
<section class="la-hero" data-ghost="REPORT" data-ve-id="hero" data-ve-type="section">
  <div class="la-hero__content">
    <h1 class="la-hero__title">Quarterly review</h1>
    <p class="la-hero__lede">A summary of FY2026 Q1 performance, highlights, and
    plans for Q2.</p>
  </div>
</section>
```

The `data-ghost` attribute determines the ghost watermark text. It
is rendered via `content: attr(data-ghost)` in CSS — so dynamically
changing the attribute updates the watermark with no JS.

The CSS ships in `amvcp-layout.css`:

```css
.la-hero {
  position: relative;
  background: var(--vc-color-canvas);
  color: var(--vc-color-content);
  overflow: clip;                           /* decoration clip — NOT a scroller */
  isolation: isolate;
}

.la-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 28% 32%,
      color-mix(in srgb, var(--vc-color-accent) 22%, transparent),
      transparent 60%),
    radial-gradient(circle at 82% 78%,
      color-mix(in srgb, var(--vc-color-info) 16%, transparent),
      transparent 55%);
}

.la-hero::after {
  content: attr(data-ghost);
  position: absolute;
  inset: 0;
  z-index: -1;
  display: grid;
  place-items: center;
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: clamp(120px, 28vw, 420px);
  font-weight: var(--vc-weight-bold, 700);
  color: var(--vc-color-content);
  opacity: 0.045;
  pointer-events: none;
  user-select: none;
}

.la-hero__content {
  position: relative;
  padding: var(--la-gap-xl) var(--la-gutter);
}
```

## The critical `overflow: clip` choice

Note the `overflow: clip` (not `overflow: hidden`). `clip`
establishes NO scroll container, so the oversized ghost-text
`::after` layer cannot make the hero programmatically scrollable.
`hidden` clips painting but leaves a SCROLLABLE BOX (testable via
`element.scrollLeft` / `scrollTop`), which violates the
no-nested-scrollbars rule.

`overflow: clip` is the CORRECT primitive for a decoration clip
(painting outside the box is hidden, but the box does not become
a scroll container). It's the only no-nested-scrollbars-compliant
choice when an oversized child needs to be visually clipped.

## Why `color-mix(token, transparent)` not hardcoded `rgba()`

A hardcoded `rgba(184, 134, 31, 0.22)` (the accent token at 22%
opacity) is:
- Theme-WRONG: the accent token's RGB values change between
  light and dark theme, but the hardcoded rgba doesn't.
- Fragile: if the DESIGN.md changes the accent token, the rgba
  doesn't follow.

`color-mix(in srgb, var(--vc-color-accent) 22%, transparent)` is:
- Theme-correct: resolves to the active theme's accent at 22%.
- Live: a DESIGN.md hot-swap updates the glow on the next paint.

## Why two glows at 28%/32% and 82%/78%

The off-centre positions (NOT 50%/50%) produce a visually rich
asymmetric background. Two glows at opposite quadrants
(upper-left + lower-right) create depth and visual interest.

The accent token (`--vc-color-accent`) is the brand's primary
colour (typically warm gold in the default theme); the info token
(`--vc-color-info`) is the secondary (typically blue). The two
glows mix at the centre, producing a subtle gradient that ties the
brand colours together.

## Why the ghost word at `font-size: clamp(120px, 28vw, 420px)`

The watermark word should be LARGE — visually "behind" the
content, but readable. The clamp:
- 120px minimum (small phone)
- 28vw ideal (~360px at desktop)
- 420px maximum (4K monitor)

The `opacity: 0.045` is very low — readable as a faint background
texture, not competing with the title.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="hero"`
  on every `.la-hero` (the SHAPES list in `amvcp-layout.js`
  includes it).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-color-canvas` | (theme) | hero base background |
| `--vc-color-content` | (theme) | title + ghost text colour |
| `--vc-color-accent` | (theme) | accent glow (upper-left) |
| `--vc-color-info` | (theme) | info glow (lower-right) |
| `--la-gap-xl` | 64px | content padding-block |
| `--la-gutter` | 32px | content padding-inline |
| `--vc-font-heading` | Georgia, serif | ghost text font |
| `--vc-weight-bold` | 700 | ghost text weight |

## Selection / comment / decision-mini contract notes

The `.la-hero` is a selectable atom (`hero` type). A reviewer can
comment ("change the ghost word to PROD", "use a different
background colour"). The hero is treated as one commentable unit;
the title inside is not independently selectable (headings are
excluded per R4).

A reviewer's "change the ghost text" comment is resolved by
mutating the `data-ghost` attribute — the CSS `content: attr(data-
ghost)` updates automatically. No JS needed.

## When to use the hero

- The top of a report / article that benefits from a visual hook.
- A landing page hero.
- A cover-like section that's not a full A4 cover but still needs
  visual weight.

When NOT to use:
- A dense dashboard (the hero takes vertical space; a dashboard
  wants every pixel for data).
- A print-only page (the print reset hides the decorative
  pseudo-layers — see ref 26).
- A formal report cover (use `.la-cover`, ref 27, for the formal
  pattern).

## Visual verification

Run the universal self-debug checklist before claiming the hero is
correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For hero correctness specifically:

- Open dev-browser. Verify the layers stack correctly:
  ```js
  const hero = document.querySelector('.la-hero');
  console.log(getComputedStyle(hero).overflow);  // 'clip'
  console.log(getComputedStyle(hero).isolation);  // 'isolate'
  ```
- The glows recolour with the DESIGN.md:
  ```js
  // Set the accent token via the DESIGN.md hot-swap path
  document.documentElement.style.setProperty('--vc-color-accent', '#ff0066');
  // The hero glow should immediately update.
  ```
- The ghost text updates with the attribute:
  ```js
  hero.setAttribute('data-ghost', 'PROD');
  // The watermark word should update on the next paint.
  ```
- **R1 — Light + dark themes**: switch themes; the glows + ghost
  text recolour with the theme (because they use `color-mix`
  over engine tokens, not hardcoded RGBA).
- **R2 — No nested scrollbars**: the `overflow: clip` is a
  decoration clip, not a content scroller. Verify the hero
  cannot be scrolled programmatically:
  ```js
  console.log(hero.scrollHeight, hero.clientHeight);
  hero.scrollTop = 100;
  console.log(hero.scrollTop);  // should still be 0 (no scroll container)
  ```
- The "ghost text bleeds" check: the ghost text is sized larger
  than the hero (`28vw` ≈ ~360px at desktop, hero is typically
  ~200-300px tall). The `overflow: clip` clips the bleed.
  Verify there's no visible overflow on the page.
