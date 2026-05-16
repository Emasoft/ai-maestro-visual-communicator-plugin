# 15 — Layout: `bento` (heading + bento grid summary)

The bento slide is the visual summary — a heading + a grid of
heterogeneous cards (metrics, text, images, callouts) arranged in one
of 7 named grid templates. The bento is what an executive looks at
when they want the whole project on one slide.

The pattern comes from the Japanese bento box: a partitioned tray
where each compartment holds a different thing, but they share a
visual frame. Translated to slides: each card carries a different
type of content (number, image, list, callout), but the grid frames
them as one composition.

## What this is

`layout: "bento"` + a `grid` slide-level key picks one of 7 named
grid templates. The first block must be the `heading`; every
subsequent block becomes a card in the grid.

The 7 bento grids (defined in `BENTO_GRIDS`):

| `grid` value | Shape | Best for |
|---|---|---|
| `"hero"` | 1 big + 4 small | One feature card + 4 support cards. |
| `"gallery"` | 6-9 equal | Homogeneous list (team grid, logo wall). |
| `"asymmetric"` | 2 big + 3 small | Two main + three supporting findings. |
| `"feature"` | 1 wide + 2 narrow + 2 narrow | One main + 4 supporting. |
| `"stats"` | 4 equal columns | A row of 4 metric cards. |
| `"split"` | 50/50 | One big metric + one big image. |
| `"full"` | 1 cell | A single full-bleed card (special case). |

Each grid template lives in the layout CSS as a `data-vsd-grid="…"`
selector; the renderer stamps the attribute and the CSS handles
placement.

## Scaffold to emit

A "hero" bento (1 big + 4 small):

```jsonc
{ "layout": "bento",
  "grid": "hero",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Q3 at a glance." },
    { "type": "metric",  "value": "38%", "label": "p99 latency cut" },
    { "type": "metric",  "value": "78%", "label": "cache hit rate" },
    { "type": "metric",  "value": "14",  "label": "features shipped" },
    { "type": "metric",  "value": "247", "label": "PRs merged" },
    { "type": "callout", "variant": "tip",
      "text": "All four numbers driven by the cache rewrite." }
  ]
}
```

A "stats" bento (4 equal columns):

```jsonc
{ "layout": "bento",
  "grid": "stats",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Four numbers tell the story." },
    { "type": "metric", "value": "38%", "label": "p99 cut" },
    { "type": "metric", "value": "78%", "label": "hit rate" },
    { "type": "metric", "value": "14",  "label": "features" },
    { "type": "metric", "value": "247", "label": "PRs" }
  ]
}
```

A "gallery" bento (team grid):

```jsonc
{ "layout": "bento",
  "grid": "gallery",
  "blocks": [
    { "type": "heading", "level": 2, "text": "The cache team." },
    { "type": "metric", "value": "A.G.", "label": "Tech lead" },
    { "type": "metric", "value": "M.K.", "label": "SRE" },
    { "type": "metric", "value": "J.P.", "label": "Backend" },
    { "type": "metric", "value": "R.V.", "label": "Backend" },
    { "type": "metric", "value": "L.T.", "label": "QA" },
    { "type": "metric", "value": "S.E.", "label": "PM" }
  ]
}
```

A mixed-card-type "asymmetric" bento:

```jsonc
{ "layout": "bento",
  "grid": "asymmetric",
  "blocks": [
    { "type": "heading", "level": 2, "text": "The Q3 picture." },
    { "type": "metric",  "value": "38%", "label": "p99 latency cut" },
    { "type": "metric",  "value": "78%", "label": "cache hit rate" },
    { "type": "image",   "src": "data:…", "alt": "Architecture diagram" },
    { "type": "callout", "variant": "info",
      "text": "Rollout completed May 13 — 7 days ahead of plan." },
    { "type": "text", "text": "Next: cross-region replication in Q4." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to
  `renderBentoSlide()`.
- `renderBentoSlide(doc, section, slide, ctx)` — takes the first
  `heading` block as the slide's title, wraps all subsequent blocks
  in `.vsd-bento-card` divs inside a `.vsd-bento-grid` container
  with `data-vsd-grid="${slide.grid}"`.
- `renderBlock(doc, block, ctx)` — renders each card's content
  (metric / image / callout / text / etc.).
- `validateSlide(slide, i)` — rejects unknown `grid` values with the
  list of valid bento-grid names.

## DESIGN.md tokens used

| Token | Default | What it themes on bento |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-surface` | `#f5f0e6` / `#1a2030` | Card backgrounds (tier 1 elevation). |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Card text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Card accent (metric values, callout borders). |
| `--vc-radius-card` | `12 px` | Card corner radius. |
| `--vc-space-3` | `24 px` | Card padding. |
| `--vc-space-4` | `40 px` | Inter-card gap. |
| `--vc-shadow-card` | `0 1px 3px rgba(…)` | Card elevation shadow. |

The card surface tier reads from the engine's elevation token family —
when the DESIGN.md swaps from a "flat" elevation profile to a
"raised" one, every bento card gets new shadows in the same paint.

## Selection / comment / decision-mini contract notes

The bento SLIDE is one selectable atom. Individual cards inside the
grid do NOT carry separate `data-ve-id`s — the slide is the comment
unit. A reviewer commenting on one card says "the p99 metric card" in
the text.

A future revision MAY stamp `data-ve-id="s<N>.c<M>"` on each card
(the runtime's scanner handles arbitrary `data-ve-id` shapes). The
slide-spec docs leave this as a P3 enhancement.

## When to use this reference

Open this ref when:

- The argument is "here is the multi-faceted summary at a glance".
- The slide needs heterogeneous cards (mixed types) sharing one
  visual frame.
- Executive summary slides, kickoff overviews, project recaps.

## Don'ts

- Don't use bento for homogeneous content. A list of 5 principles is
  `content`, not bento. A row of 4 metrics is `metrics`, not bento.
- Don't pack more cards than the grid template allows. The 7 named
  grids are sized for 4-9 cards each; overflowing breaks the visual
  composition.
- Don't mix bento and metrics layouts. Pick one based on whether the
  cards are homogeneous (metrics) or heterogeneous (bento).
- Don't use `grid: "full"` for anything but a special-case single
  full-bleed card. Use `full-bleed` layout instead.

## Authoring rules — grid by cardinality

| # of cards (excluding heading) | Grid to pick |
|---|---|
| 2 | `split` |
| 3 | `asymmetric` (rare — usually pick `metrics` or 3 stats) |
| 4 | `stats` (homogeneous) or `feature` (one main + three supporting) |
| 5 | `hero` (1 big + 4 small) |
| 6 | `gallery` (homogeneous) or `asymmetric` (2 main + 3 supporting + 1 callout) |
| 7-9 | `gallery` |
| 10+ | Split into two slides — past 9, the grid composition fails |

The cardinality is the strongest signal — the grid template that fits
the # of cards is usually the right one.

## Visual verification

After authoring a bento slide, capture light + dark at 1280×720 via
the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top; the grid fills the bottom 75% of the
   stage.
2. The grid template matches the `grid` value (verify visually
   against the 7-grid table above).
3. All cards share a consistent surface colour (`--vc-color-surface`).
4. Inter-card gap is `--vc-space-4` (40 px); no card overflows its
   cell.
5. On a 480×800 viewport (`fit: responsive`), the grid collapses to
   a single column.

## Source provenance

- SL-07 — SVG Bento Grid Slide (7 layouts, 8 card types) in the
  master catalog. The 7 grid names lifted directly.
- The 7 named grids are the deduplicated set across the bento-grid
  catalogues in `awesome-design-skills-main` (DM-13).
- The mixed-card-type pattern is the bento philosophy ("each
  compartment holds a different thing, sharing a visual frame").
- See ref #16 for the deep dive on each named grid template.
