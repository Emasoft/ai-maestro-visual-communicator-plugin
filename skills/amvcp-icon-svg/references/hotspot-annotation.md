# Image hotspot annotation (.isvg-annotated + .isvg-hotspot)

## Table of Contents

- [What it renders](#what-it-renders)
- [The `--x` / `--y` contract](#the---x----y-contract)
- [CSS contract (injected by amvcp-icon-svg.js)](#css-contract-injected-by-amvcp-icon-svgjs)
- [Hover state (reduced-motion-aware)](#hover-state-reduced-motion-aware)
- [Why `<span role="button">` and NOT `<button>`?](#why-span-rolebutton-and-not-button)
- [Selection / comment / decision-mini integration](#selection--comment--decision-mini-integration)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Numbered annotations](#numbered-annotations)
  - [Letter annotations](#letter-annotations)
  - [Colored hotspots (override accent locally)](#colored-hotspots-override-accent-locally)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The hotspot annotation system places absolutely-positioned, themed,
selectable markers on top of an image (`<img>`, inline `<svg>`, or
any block element). Each marker is a `<span class="isvg-hotspot">`
with inline `--x` / `--y` 0..1 fraction custom properties placing it
proportionally on the underlying image. Every hotspot is a
`data-ve-id` selection atom and joins the runtime's
selection / comment / decision-pill machinery for free.

## What it renders

```html
<figure class="isvg-annotated"
        data-ve-id="anatomy-fig"
        data-ve-type="figure"
        data-ve-comment-id="figure:anatomy-fig"
        tabindex="0" role="img">
  <img src="diagram.svg" alt="System architecture">
  <span class="isvg-hotspot"
        style="--x: 0.30; --y: 0.30"
        data-ve-id="hotspot-cache"
        data-ve-type="hotspot"
        data-ve-comment-id="hotspot:hotspot-cache"
        data-ve-label="Cache layer"
        role="button" tabindex="0"
        aria-label="Cache layer">1</span>
  <span class="isvg-hotspot"
        style="--x: 0.74; --y: 0.70"
        data-ve-id="hotspot-db"
        data-ve-type="hotspot"
        data-ve-comment-id="hotspot:hotspot-db"
        data-ve-label="Database"
        role="button" tabindex="0"
        aria-label="Database">2</span>
</figure>
```

The image fills the figure (`max-inline-size: 100%; height: auto`),
and each hotspot is absolutely positioned at
`calc(var(--x) * 100%)` across and `calc(var(--y) * 100%)` down,
with `transform: translate(-50%, -50%)` to center the marker on the
hotspot point.

## The `--x` / `--y` contract

- Both are inline CSS custom properties.
- Both are 0..1 fractions of the image's RENDERED size.
- They are PHYSICAL (not logical) properties — hotspot coordinates
  are tied to the image PIXELS, which do not flip in RTL. This is
  intentional per the icon-svg-spec §5.1.
- `0, 0` is the top-left corner of the image.
- `1, 1` is the bottom-right corner.
- Hotspots stay anchored when the image resizes (responsive design).

## CSS contract (injected by amvcp-icon-svg.js)

```css
.isvg-annotated {
  position: relative;
  display: inline-block;
  max-inline-size: 100%;
}
.isvg-annotated > img {
  display: block;
  max-inline-size: 100%;
  height: auto;
}
.isvg-hotspot {
  position: absolute;
  left: calc(var(--x, 0) * 100%);
  top: calc(var(--y, 0) * 100%);
  transform: translate(-50%, -50%);
  inline-size: 1.7rem;
  block-size: 1.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font: 600 0.8rem/1 var(--vc-font-body, system-ui, sans-serif);
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--vc-color-accent, #b8861f);
  color: var(--vc-color-on-accent, #ffffff);
  border: 2px solid var(--vc-color-surface, #ffffff);
  cursor: pointer;
  transition: transform var(--vc-duration-fast, 120ms)
    var(--vc-easing-standard, cubic-bezier(0.2,0,0,1));
}
```

The hotspot is a 1.7rem circle (accent background, on-accent text, a
2px surface-color knockout ring for contrast over any image color),
with a subtle hover scale transition.

## Hover state (reduced-motion-aware)

```css
@media (prefers-reduced-motion: no-preference) {
  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {
    transform: translate(-50%, -50%) scale(1.18);
  }
}
@media (prefers-reduced-motion: reduce) {
  .isvg-hotspot:hover, .isvg-hotspot:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb,
      var(--vc-color-accent, #b8861f) 35%, transparent);
  }
}
```

When the OS prefers-reduced-motion is OFF, hover scales the hotspot
to 118%. When it's ON, hover ADDS a 3px ring around the hotspot
instead (no scale animation). The substitute is a STATIC affordance,
not just "remove animation" — the user still gets a clear hover cue.

## Why `<span role="button">` and NOT `<button>`?

The runtime's click handler in `amvcp-runtime.js` BAILS on `<button>`
targets (it treats them as interactive controls, not selection
atoms). Using `<span role="button" tabindex="0">` keeps the SAME a11y
semantics (announced as a button, focusable, Enter and Space activate)
WITHOUT triggering the bail-out, so the click reaches
`toggleElementSelection` and the hotspot enters `veSelection`. The
selection contract was designed deliberately around this distinction.

## Selection / comment / decision-mini integration

Every hotspot with `data-ve-id` is automatically attached to the
runtime's selection machinery on the next `init()` / `refresh()` call.
The `attachDecisionMinisToAtoms()` helper also stamps a 3-radio
Skip / Approve / Deny mini-pill on every hotspot.

The `data-ve-comment-id="hotspot:<id>"` is the SCOPE KEY for the
Ctrl-+ keyboard comment-thread fallback — opening a comment thread on
a hotspot creates a thread scoped to that specific hotspot, not the
whole figure.

## When to use

- Annotating a system architecture diagram.
- Marking points on an anatomical figure.
- Labeling a UI screenshot with feature callouts.
- A map with numbered points of interest.
- A workflow diagram with step markers.
- ANY image + N markers visualization.

## When NOT to use

- For a list of bullet points — that's just text.
- For chart data points — that's the `chart` skill.
- For interactive editing — that's `interactive-control`.
- For markers on a real geographic map — use a map library; the
  hotspot system doesn't do projection.

## Common authoring patterns

### Numbered annotations

```html
<figure class="isvg-annotated" data-ve-id="my-diagram">
  <img src="arch.svg" alt="Architecture">
  <span class="isvg-hotspot" style="--x: 0.20; --y: 0.50"
        data-ve-id="hs-1" data-ve-type="hotspot"
        role="button" tabindex="0"
        aria-label="Frontend">1</span>
  <span class="isvg-hotspot" style="--x: 0.50; --y: 0.50"
        data-ve-id="hs-2" data-ve-type="hotspot"
        role="button" tabindex="0"
        aria-label="API">2</span>
  <span class="isvg-hotspot" style="--x: 0.80; --y: 0.50"
        data-ve-id="hs-3" data-ve-type="hotspot"
        role="button" tabindex="0"
        aria-label="Database">3</span>
</figure>
```

### Letter annotations

```html
<span class="isvg-hotspot" style="--x: 0.30; --y: 0.20"
      data-ve-id="hs-a" aria-label="Pin A">A</span>
```

### Colored hotspots (override accent locally)

```html
<style>
  .my-hotspots .isvg-hotspot {
    --vc-color-accent: var(--vc-color-danger);
  }
</style>
<figure class="isvg-annotated my-hotspots" ...>
  ...
</figure>
```

## DESIGN.md tokens consumed

- `--vc-color-accent` — hotspot background
- `--vc-color-on-accent` — hotspot text
- `--vc-color-surface` — knockout ring
- `--vc-radius-full` — hotspot border-radius
- `--vc-font-body` — hotspot text font
- `--vc-duration-fast` / `--vc-easing-standard` — hover transition

## What NOT to do

- Do NOT use `<button>` for the hotspot — the runtime bails on
  `<button>` targets.
- Do NOT use percentages > 100% or < 0% for `--x`/`--y` — the marker
  goes off-image.
- Do NOT animate the hotspot ignoring `prefers-reduced-motion` —
  always provide a static hover substitute.
- Do NOT skip `aria-label` — the hotspot text is too short to convey
  meaning to a screen reader.

## Visual verification

In both light AND dark, confirm:

- Hotspots are positioned proportionally on the image (resize the
  page — they should stay anchored).
- Hotspot text is readable (accent background, on-accent foreground,
  and surface-colored knockout ring).
- Hover state works (scale OR static ring, per
  prefers-reduced-motion).
- Clicking a hotspot makes it the selected atom (the runtime adds
  `data-ve-selected="true"`).
- Tab key cycles focus through hotspots in DOM order.
