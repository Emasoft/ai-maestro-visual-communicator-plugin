# 17 — Layout: `stack` (heading + layered cards)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — card title and description](#authoring-rules--card-title-and-description)
- [Visual verification](#visual-verification)
- [Stack vs metrics vs bullets — picking the right list layout](#stack-vs-metrics-vs-bullets--picking-the-right-list-layout)
- [Card-title vs card-description authoring](#card-title-vs-card-description-authoring)
- [Source provenance](#source-provenance)

The stack slide is for a list-of-things with strong title hierarchy —
each item gets its own card with its own title + body, but the cards
flow vertically in a single column rather than horizontally across a
row. The visual model is a deck of cards laid out vertically; the eye
reads top-to-bottom.

Stack is for when `content`'s bullets are too thin (each item needs a
header + paragraph), `bento` is too grid-y (the items aren't a
multi-pane summary — they're a sequence), and `timeline` doesn't fit
(the items aren't temporal). The stack is the "rich list" layout.

## What this is

`layout: "stack"` builds a slide with:

- One required `heading` block (the stack's name).
- 2-5 items, each a `metric` or pair of `text` blocks (the cards).

The renderer applies `vsd-layout-stack` to the section; the layout CSS
arranges the item blocks in a single vertical column with consistent
card spacing.

The simplest authoring pattern: each card = one `metric` block with
`label` as the title and `delta` as the description:

```jsonc
{ "type": "metric",
  "value": "1.",          // optional number / icon
  "label": "Per-key TTL",
  "delta": "Each key picks its own freshness window." }
```

For richer cards (multi-line description), use a heading + text pair:

```jsonc
{ "type": "heading", "level": 2, "text": "Per-key TTL" },
{ "type": "text", "text": "Each key picks its own freshness window. Cold keys get short TTLs; hot keys get long ones." }
```

## Scaffold to emit

Numbered list of architectural principles:

```jsonc
{ "layout": "stack",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Five principles drove the rewrite." },
    { "type": "metric", "value": "1.", "label": "Cache the result, not the request",
      "delta": "Request shape changes; result shape doesn't." },
    { "type": "metric", "value": "2.", "label": "TTL is per-key, not per-region",
      "delta": "Cold keys evict fast; hot keys stay warm." },
    { "type": "metric", "value": "3.", "label": "Eviction prefers stale-while-revalidate",
      "delta": "Serve stale, refetch in background." },
    { "type": "metric", "value": "4.", "label": "Warmup runs at deploy time",
      "delta": "First request hits a warm cache." },
    { "type": "metric", "value": "5.", "label": "Observability from day 1",
      "delta": "Every cache decision logged + traced." }
  ]
}
```

Decision card stack (for "decision needed" slides):

```jsonc
{ "layout": "stack",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three options for the Q4 cache work." },
    { "type": "metric", "value": "A.", "label": "Cross-region replication",
      "delta": "4 weeks. High blast radius. Permanent fix." },
    { "type": "metric", "value": "B.", "label": "Per-region read replicas",
      "delta": "2 weeks. Moderate risk. Half the latency cut." },
    { "type": "metric", "value": "C.", "label": "Defer to Q1 2027",
      "delta": "0 weeks. Production stays as-is. No cut." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — renders each metric / heading /
  text block.

## DESIGN.md tokens used

| Token | Default | What it themes on stack |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-surface` | `#f5f0e6` / `#1a2030` | Card surface. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Card titles + body. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Card descriptions. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Card numbers / icons. |
| `--vc-radius-card` | `12 px` | Card corner radius. |
| `--vc-space-3` | `24 px` | Card padding. |
| `--vc-space-4` | `40 px` | Inter-card gap. |

## Selection / comment / decision-mini contract notes

The stack SLIDE is one selectable atom. Individual cards in the stack
don't carry separate `data-ve-id`s by default. The slide is the
comment unit. A reviewer commenting on one card says "card 3 (the
warmup principle)" in the text.

## When to use this reference

Open this ref when:

- The slide shows a numbered list where each item needs its own
  title + description (too rich for bullets, too sequential for
  bento).
- Presenting design principles, architectural decisions, options for
  a decision.
- The stack contents fit best as a vertical reading order — `content`
  would put bullets in a column, but the bullets need richer
  formatting than bullet-text-only.

## Don'ts

- Don't put more than 5 cards in the stack. The vertical reading
  order at projection scale gives each card ~ 80-100 px height; 6+
  cards overflow the stage.
- Don't use stack for unrelated items. Stack implies "these items
  share a category and are listed in some order"; unrelated items go
  in a `content` slide or a `bento`.
- Don't make some cards have descriptions and others not. The visual
  rhythm breaks. Either all have descriptions or none do.
- Don't use stack to enumerate metrics — that's `metrics` (horizontal
  row) or `bento` + `stats` (4-column grid).

## Authoring rules — card title and description

The strongest stack cards have:

- A short title (3-7 words). The title is what the audience reads at a
  glance.
- A one-sentence description (5-15 words). The description is the
  body — read after the title hooks the eye.
- An optional number / icon / glyph in the `value` field of the
  metric block. Numbers establish reading order; icons categorise.

If a card needs more than one sentence of description, the card
should be its own slide — the stack is for skimmable lists, not for
deep dives.

## Visual verification

After authoring a stack slide, capture light + dark at 1280×720 via
the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top; the cards fill the bottom 75% of the
   stage.
2. Cards arrange in a single vertical column.
3. Card numbers (if present) are in the accent colour, aligned at
   the left of each card.
4. Inter-card gap is `--vc-space-4` (40 px); cards visually distinct
   from the stage background via the surface token.
5. No card overflows its row; the stack fits the stage without
   `data-vsd-overflow`.

## Stack vs metrics vs bullets — picking the right list layout

Three layouts can each render "a list of N things":

| Layout | Cards per row | Card richness | Best for |
|---|---|---|---|
| `bullets` (block in `content`) | N/A — bullets in a column | Title only (or `{text, sub}`) | Quick list, ≤6 items. |
| `metrics` | 3-6 in a horizontal row | Value + label + optional delta | Numeric impact row. |
| `stack` (this layout) | 2-5 in a vertical column | Title + description (~15 words) | Rich-card list, sequenced top-to-bottom. |

Picking:

- "I have 3-6 numeric stats" → `metrics`.
- "I have 4 short bullets" → `content` with `bullets`.
- "I have 4 architectural decisions each needing a title + 1-sentence
  description" → `stack`.
- "I have 6+ items where each needs a title + 1-sentence description"
  → split across two `stack` slides.

## Card-title vs card-description authoring

For a stack slide, each card's title and description carry different
weights:

- Title: the lookup label. ≤7 words. Read at a glance.
- Description: the explanation. ≤15 words. Read after the title hooks.

The title alone should be enough for the audience to understand what
the card is ABOUT. The description fills in the specific.

GOOD:
- Title: "Per-key TTL"
- Description: "Each key picks its own freshness window."

BAD (title too vague):
- Title: "The first change"
- Description: "Per-key TTL: each key picks its own freshness window."

The title needs to do the work; descriptions are reinforcement.

## Source provenance

- SL-04 — Folio "Stack" pattern (layered cards).
- The numbered-list-as-cards pattern is the "Five Principles" / "Six
  Decisions" structure converged across the slide-deck catalogues
  (SL-10's narrative-arc template + SL-13's typographic-rhythm move).
- The decision-card variant matches the "decision needed" slide
  pattern from `09-slide-deck.html` documented in the extended
  HTML-effectiveness mining (`reports/visualizing-triage/
  20260516_005708+0200-extended-mining-html-effectiveness.md` line
  148-152).
