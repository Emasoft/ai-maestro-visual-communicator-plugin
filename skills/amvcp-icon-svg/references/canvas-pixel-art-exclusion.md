# Canvas pixel art (IS-05) — out of scope

## Table of Contents

- [Why it's out of scope](#why-its-out-of-scope)
- [The use cases pixel art ostensibly serves](#the-use-cases-pixel-art-ostensibly-serves)
- [When a user REALLY wants pixel art](#when-a-user-really-wants-pixel-art)
- [What would the runtime gain by including pixel art?](#what-would-the-runtime-gain-by-including-pixel-art)
- [The C5 lint constraint informs this exclusion](#the-c5-lint-constraint-informs-this-exclusion)
- [What if the project DID want pixel art](#what-if-the-project-did-want-pixel-art)
- [Cross-skill seam — none](#cross-skill-seam--none)
- [Visual verification](#visual-verification)
- [Source citation](#source-citation)

The original IS-05 source proposed a `<canvas>`-based pixel-art
rendering library: `drawPixelRect(ctx, x, y, w, h, color, scale)`,
`drawSprite(ctx, sprite, x, y, scale)`, `drawText8x8(ctx, text, x,
y, color, scale)`, with an 8x8 bitmap font included as a data
array. The classification phase marked this **SKIP / P3**. This
reference documents WHY and where to go if you really need it.

## Why it's out of scope

icon-svg's mandate is THEMABLE, SELECTABLE, LINT-CLEAN INLINE SVG
for HTML reports. Pixel art via canvas fails every one of those
adjectives:

| Mandate | Canvas pixel art |
|---|---|
| Themable | No — rasters bake colors at draw time; a theme swap requires re-draw, not a CSS recompute |
| Selectable | No — canvas pixels carry no `data-ve-id`; the runtime's selection machinery can't see them |
| Lint-clean | N/A — `lintSvg()` doesn't parse canvas; the C1..C7 contract is meaningless on rasters |
| Inline SVG | No — canvas is a different element with a different rendering model |
| DESIGN.md tokens | No — canvas fillStyle is set imperatively in JS; `--vc-*` tokens require a CSS-cascade-resolved value |

A canvas pixel-art rendering would be a SECOND visualization runtime
inside the same plugin — duplicating the selection machinery, the
theme integration, the comment threads, the decision pills, the
export pipeline. The architectural cost is enormous; the use-case
value is niche.

## The use cases pixel art ostensibly serves

1. **8-bit / 16-bit aesthetic mark** — a retro logo or icon.
2. **Sprite-based animation** — an animated mascot or fictional UI.
3. **8x8 bitmap font rendering** — a "ZX Spectrum" feel.
4. **Game-style visualization** — health bars, inventory tiles.

For each, the in-scope alternative is:

| Use case | In-scope alternative |
|---|---|
| Retro logo | A `logo` block (`stacked-rects` or `mask-cutout`) in SVG — still themable and selectable. |
| Sprite animation | An inline `<svg>` with SMIL `<animate>` or CSS keyframes — the `animation` skill. |
| Bitmap font | A web font (`--vc-font-mono`) at a small pixel size — text rendering. |
| Game-style visualization | Hand-author a `<svg>` with `<rect>` tiles — same visual idiom, themable. |

## When a user REALLY wants pixel art

Direct them to:

- A dedicated graphics library (Phaser, Pixi.js) — outside the
  visual-communicator plugin scope.
- A static `.png` / `.gif` asset they embed via `<img>` — outside
  the inline-SVG architecture.
- A custom `<canvas>` block in their report HTML — the runtime
  ignores it but it'll render.

The runtime's `init()` does NOT touch `<canvas>` elements (the
selectors `pre > code.language-icon-svg` and `script[type=
"application/icon-svg+json"]` won't match). A user-authored canvas
sits inside the report uncatalogued — that's fine, it's not
icon-svg's problem.

## What would the runtime gain by including pixel art?

Nearly nothing for the report-doc use case. Reports show:

- Process diagrams.
- Architecture mockups.
- Charts.
- Slide decks.
- Wireframes.
- Annotated screenshots.

None of these benefit from 8x8 pixel art. The use cases that DO
benefit (retro games, sprite editors) are not what visual-
communicator addresses.

## The C5 lint constraint informs this exclusion

C5 forbids drop shadows + blur filters in authored SVG. The
underlying principle: AUTHORED EDITORIAL marks are FLAT, not
photographic. Pixel art is a different aesthetic (raster, often with
deliberate aliasing, sometimes with dithering). Adding pixel art
would mix aesthetics — a report would have hairline-vector
diagrams AND pixelated raster glyphs in the same page, visually
clashing.

The icon-svg style contract chose ONE aesthetic — flat editorial
vector. Pixel art is a different choice.

## What if the project DID want pixel art

Then it would be a NEW skill (`amvcp-pixel-art` or similar), with:

- Its own runtime module.
- Its own scaffold contract.
- Its own selection machinery (or none).
- Its own theme integration (or none — pixel art often resists
  theming).
- Its own lint contract (or none).

icon-svg would NOT be the home. The new skill would be a sibling.

## Cross-skill seam — none

icon-svg has NO integration with canvas. The runtime initializes
exactly one type of asset: themed inline SVG primitives. A canvas
element next to an icon-svg figure is invisible to the icon-svg
module.

## Visual verification

There is no pixel art to verify in icon-svg. If you find canvas
calls in `scripts/amvcp-icon-svg.js`, the invariant has been
violated. The expected count: zero.

```bash
grep -c 'canvas\|getContext\|drawImage' scripts/amvcp-icon-svg.js
# expected: 0
```

## Source citation

The IS-05 exclusion is documented in:

- `reports/visualizing-triage/20260515_123638+0200-classify-icon-svg.md`
  (line 31, IS-05 status SKIP P3).
- `reports/visualizing-triage/20260515_124436+0200-PHASE2-BUILD-BACKLOG.md`
  (excluded list).

The skip decision is permanent unless an explicit unsplit is
proposed via a TRDD.
