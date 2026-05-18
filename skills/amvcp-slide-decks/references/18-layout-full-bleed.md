# 18 — Layout: `full-bleed` (edge-to-edge image + overlay text)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — image source guidance](#authoring-rules--image-source-guidance)
- [Visual verification](#visual-verification)
- [Common pitfalls](#common-pitfalls)
- [Best images for slide-decks](#best-images-for-slide-decks)
- [Source provenance](#source-provenance)

The full-bleed slide is the talk's emotional anchor — a hero image
fills the entire stage, with one short headline + optional subtitle
overlaid via a gradient scrim. No other content. The image carries the
moment; the text labels it.

This is the rarest layout in any deck. A 12-slide deck has at most one
or two full-bleeds; back-to-back full-bleeds dilute the signal. The
right moment for a full-bleed is the "look at this" — the audience
should feel they're being shown something, not told.

## What this is

`layout: "full-bleed"` builds a slide with:

- One required `image` block (the hero, with `fit: "cover"`).
- One required `heading` block (the overlay text).
- One optional `text` block (the supporting subtitle).

The renderer applies `vsd-layout-full-bleed` to the section; the
layout CSS zeros out the slide padding, positions the image
absolutely to fill the stage, and overlays a gradient scrim + text
container at the bottom (or top, configurable via CSS).

## Scaffold to emit

```jsonc
{ "layout": "full-bleed",
  "blocks": [
    { "type": "image",
      "src": "data:image/jpeg;base64,…",
      "alt": "Cache hit rate climbing chart against a dark sky.",
      "fit": "cover" },
    { "type": "heading", "text": "Cache hit rate hit 78% on May 13." },
    { "type": "text", "text": "Three weeks after rollout." }
  ]
}
```

CSS gradient fallback (when no image is available):

```jsonc
{ "layout": "full-bleed",
  "blocks": [
    { "type": "image",
      "src": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23b8861f'/><stop offset='1' stop-color='%231f1a14'/></linearGradient></defs><rect width='1920' height='1080' fill='url(%23g)'/></svg>",
      "alt": "Gold-to-near-black gradient background.",
      "fit": "cover" },
    { "type": "heading", "text": "Q3 2026 — the cache rewrite." }
  ]
}
```

The slide layer doesn't have a native "no-image gradient" mode —
inline the gradient as an SVG data-URI image, or let the deck
preset's full-bleed CSS provide the fallback (some presets paint a
CSS gradient on `.vsd-layout-full-bleed` when no `<img>` is found).

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — renders the `image` block as a
  `<img class="vsd-image vsd-image--cover">`; renders the heading +
  text as overlay elements.

## DESIGN.md tokens used

| Token | Default | What it themes on full-bleed |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Behind-image fallback. |
| `--vc-color-overlay-text` | `#ffffff` (always) | Heading + text overlay colour. |
| `--vc-color-overlay-scrim` | `rgba(0,0,0,0.6)` | Bottom gradient scrim base colour. |
| `--vc-font-heading` | `Georgia, serif` | Overlay heading typeface. |
| `--vc-text-4` | `64 px` | Overlay heading size. |
| `--vc-text-2` | `28 px` | Overlay subtitle size. |
| `--vc-space-6` | `48 px` | Overlay padding-block (text inset from the image edge). |

The overlay text is HARD-CODED white (or near-white) regardless of
theme — full-bleed images are by nature dark or busy, and the overlay
needs to read at projection distance. Themes restyle the *image*
colour palette (via preset-specific full-bleed gradients), not the
overlay text.

## Selection / comment / decision-mini contract notes

The full-bleed slide is one selectable atom. The image inside is NOT
separately selectable. The selection ring paints around the slide's
edge (inset 2 px); the hover glow is muted on full-bleed slides so it
doesn't compete with the image.

## When to use this reference

Open this ref when:

- The talk's emotional centre needs an image (a product shot, a
  graph at scale, a dashboard at midnight, a team photo).
- A pivot moment benefits from a non-text visual — the previous slide
  was dense text, the next slide will be a big chart, and the
  full-bleed in between is the breather.
- The deck's opening or closing benefits from a hero image (rare —
  most decks open with `manifesto` and close with `closing`).

## Don'ts

- Don't use full-bleed without an image. The layout depends on the
  image carrying the visual weight; an "image-less" full-bleed is just
  a `statement` slide with bad padding.
- Don't use full-bleed for data. Data goes on a `data-story` slide
  with a chart. Full-bleed is for emotional anchoring, not for
  evidence.
- Don't put more than ~12 words in the overlay heading. The overlay
  is read at projection distance over a busy background; long text
  loses legibility.
- Don't use full-bleed back-to-back. Two full-bleeds in a row dilutes
  the impact of both.
- Don't pick an image without high contrast against the overlay
  scrim. Test the overlay against the image's bottom 30% — if the
  text doesn't read, pick a darker image or a darker scrim.

## Authoring rules — image source guidance

The slide module accepts any `src` the browser can load:
- `data:image/jpeg;base64,…` (self-contained, recommended for emails / PDFs)
- `https://…` (network — breaks offline)
- `./relative/path.jpg` (works when the HTML is colocated with assets)

For self-contained outputs, prefer base64 data-URIs. The `surf-cli`
workflow (from `slide-patterns.md` lines 1148-1166) generates a JPEG
+ base64-encodes it + inlines it into the deck — the whole deck
remains a single `.html` file.

## Visual verification

After authoring a full-bleed slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The image fills the entire stage (no whitespace borders).
2. The image is fit `cover` (cropped to fill, not letterboxed).
3. The overlay heading reads at projection distance — verify by
   stepping back from the monitor.
4. The bottom gradient scrim is visible (subtle dark band under the
   text); without it the text would float on the image.
5. The nav chrome (counter, dots, progress bar) remains visible on
   top of the image — the chrome's `backdrop-filter: blur` + `color-
   mix` keeps it readable.

## Common pitfalls

### Low-contrast image with light scrim → unreadable overlay

Symptom: the overlay heading vanishes into a busy background.

Fix: pick a darker image OR thicken the scrim:

```css
.vsd-layout-full-bleed .vsd-scrim {
  background: linear-gradient(to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%);
}
```

The 0.85 → 0.4 gradient is much heavier than the default; use it when
the image's bottom-third is light-coloured.

### Tall image cropped at the top → loses the subject

Symptom: a portrait image cropped to a 16:9 slide loses the subject's
head.

Fix: switch to `fit: "contain"` to letterbox the image, OR pick a
landscape-oriented image for the slide.

### Image URL fails offline / on email

Symptom: the deck renders fine in DevTools but breaks when sent as
attachment.

Fix: ALL images must be base64 data-URIs for self-contained
distribution. `https://` URLs break offline.

## Best images for slide-decks

Top sources of slide-suitable images:

| Source | Aspect | License |
|---|---|---|
| `surf-cli` AI generation | 16:9 native | Per the model's TOS |
| Stock photo libraries (Unsplash, Pexels) | Varies | Usually free-with-attribution |
| Internal screenshots (resized) | Whatever needed | Internal use |
| CSS gradients (no image) | N/A | Free |

For most slide decks, AI-generated images via `surf-cli` give the best
"matched-to-deck-palette" results — the generation prompt can include
the preset's accent colour, ensuring the image visually integrates.

## Source provenance

- SL-13 — Editorial layout move "Full Bleed Image".
- `slide-patterns.md` lines 1019-1066 spec the canonical full-bleed
  CSS (absolute-position image, gradient scrim, overlay text
  container with `z-index: 2`).
- The "no more than ~2 per deck" rule is from the compositional-
  variety discipline documented in `slide-patterns.md` lines 1178-1190.
- The surf-cli image generation workflow is from `slide-patterns.md`
  lines 1148-1166.
