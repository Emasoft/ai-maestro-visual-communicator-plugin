# 09 — Layout: `two-column` (heading + 2 stacks of content)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Block-distribution algorithm](#block-distribution-algorithm)
- [Visual verification](#visual-verification)
- [Two-column variants by content type](#two-column-variants-by-content-type)
- [The "second column gives the eye a destination" rule](#the-second-column-gives-the-eye-a-destination-rule)
- [Source provenance](#source-provenance)

The two-column slide is for a single thesis with two parallel evidence
stacks — typically text on the left, supporting visual on the right
(image, icon, mini-diagram, key callout). It's the "asymmetric balance"
of the slide catalog: one half carries the argument, the other half
carries the supporting affordance.

Two-column is distinct from `comparison`: comparison is a contrast
(then vs now, left vs right of an opposition); two-column is a
*parallel* (a point and its support).

## What this is

`layout: "two-column"` builds a slide with:

- One required `heading` block (the thesis).
- A mix of blocks that the renderer auto-distributes between the two
  columns by index — odd-indexed blocks land in column 2, even-indexed
  in column 1.

Typical pattern: heading (spans both columns), then bullets + image:

```jsonc
{ "layout": "two-column",
  "blocks": [
    { "type": "heading", "level": 2, "text": "..." },
    { "type": "bullets", "items": [...] },  // column 1
    { "type": "image",   "src": "..." }     // column 2
  ]
}
```

The renderer applies `vsd-layout-two-column` to the section; the layout
CSS uses a `2fr 2fr` grid (more even than `content`'s 3fr/2fr; the
balance is what makes it read as "two parallel halves").

## Scaffold to emit

```jsonc
{ "layout": "two-column",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "The new cache uses per-key TTL." },
    { "type": "bullets",
      "items": [
        "Each key declares its own freshness window.",
        "Cold keys get short TTLs; hot keys get long ones.",
        "Eviction runs adaptively."
      ] },
    { "type": "image",
      "src": "data:image/svg+xml;base64,…",
      "alt": "Diagram showing per-key TTL bands." }
  ]
}
```

Text + callout variant:

```jsonc
{ "layout": "two-column",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Read replicas now serve 78% of read traffic." },
    { "type": "text",
      "text": "We added two new replicas in eu-central-1 and routed all read traffic through them via the geo-aware client." },
    { "type": "callout",
      "variant": "tip",
      "text": "Writes still go to the primary in us-east-1; the replicas accept reads only." }
  ]
}
```

Text + chart variant (delegated `chart` block):

```jsonc
{ "layout": "two-column",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Cache hit rate climbed from 41% to 78%." },
    { "type": "text",
      "text": "Driven by the per-key TTL change rolled out on May 6." },
    { "type": "chart",
      "chartType": "line",
      "data": { "labels": [...], "datasets": [...] } }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — renders each block; the layout CSS
  handles column placement via `:nth-child` / grid auto-flow.
- `renderDelegated(doc, block, type)` — if the second column is a
  `code` / `diagram` / `chart`, this calls the sibling module's
  `renderInto(host, spec)`.

## DESIGN.md tokens used

| Token | Default | What it themes on two-column |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading + body text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Secondary text in column 2. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Bullet markers, callout border. |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-text-4` | `64 px` | Heading size. |
| `--vc-text-3` | `40 px` | Bullet / body text. |
| `--vc-space-5` | `32 px` | Inter-column gap. |
| `--vc-space-4` | `40 px` | Block stack gap inside each column. |

## Selection / comment / decision-mini contract notes

The two-column slide is a single selectable atom. Each column does NOT
get its own `data-ve-id`. If the column 2 content is a delegated block
(code/diagram/chart), the sibling renderer may stamp its OWN
`data-ve-id` on its rendered content — that's the sibling module's
concern, not the slide layer's.

## When to use this reference

Open this ref when:

- The slide's thesis benefits from a parallel visual (illustration,
  chart, code, image).
- The content is too thin for `comparison` (no contrast — just
  parallel evidence) and too thick for `content` (the bullet column
  alone is too sparse).
- Building a "diagram + explanation" slide — left half text, right
  half a scene-graph SVG or ASCII diagram via the delegated `diagram`
  block (it renders scene-graph JSON + ASCII only — for Mermaid/Graphviz
  use the `/amvcp-generate-web-diagram` command, not a delegated block).

## Don'ts

- Don't use two-column when the two halves are an OPPOSITION (then vs
  now, before vs after). That's `comparison`, not two-column.
- Don't put more than 2 columns. The layout name is canonical;
  three-column is just bad density. Use `bento` for multi-pane.
- Don't put a bento grid inside one column. Bento is a layout, not a
  block; nest it as its own slide instead.
- Don't let the second column go empty. If the right column is
  going to be 80% whitespace, the slide is just `content` — pick
  `content` and put the bullets in the left 3fr column.

## Block-distribution algorithm

The renderer doesn't have explicit column-routing — it relies on the
layout CSS's grid auto-flow + `:nth-child` selectors to place blocks.
The convention:

- The heading spans both columns (`grid-column: 1 / -1`).
- Subsequent blocks fill columns in declared order: 2nd block → col 1,
  3rd block → col 2, 4th → col 1, 5th → col 2, …

This means: to put bullets in the left column and an image in the right,
order the blocks `[heading, bullets, image]`. To put the image left and
bullets right, order `[heading, image, bullets]`.

## Visual verification

After authoring a two-column slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading spans the full stage width.
2. The two columns split the remaining vertical space ~50/50.
3. The block order matches the JSON declaration order.
4. The inter-column gap is `--vc-space-5` (32 px).
5. On a 480×800 viewport (`fit: responsive`), the columns stack
   vertically — column 1 on top, column 2 below.

## Two-column variants by content type

| Right-column type | Best for |
|---|---|
| `image` | Hero shot, diagram, illustration. |
| `chart` (delegated) | Quick chart accompanying the bullets. |
| `code` (delegated) | "Here's the principle (left), here's the code (right)". |
| `diagram` (delegated) | Architecture diagram + explanation. |
| `callout` | Highlighted side note alongside narrative bullets. |
| `bullets` (second list) | Two parallel bullet sets that aren't a comparison. |
| `quote` | The narrative bullets cite an external voice. |

The diversity of right-column types is what makes two-column the
versatile second-most-common layout in the deck (after `content`).

## The "second column gives the eye a destination" rule

A two-column slide's value is that the right column anchors the eye
AFTER reading the bullets. If the right column is just a decorative
image with no relation to the bullets, it's eye candy — keep going,
the layout's wrong for the content.

The right column should:

1. ADD information the bullets don't carry (chart shows the
   numbers; image shows the topic; code shows the implementation).
2. INVITE the eye after the bullets finish.
3. STAND on its own at projection distance (legible at the seat
   distance).

If those three fail, use `content` (no right column needed) or
`data-story` (chart drives the slide).

## Source provenance

- The 2-column asymmetric pattern is one of the SL-13 8 editorial
  layout moves ("Split Screen"), merged into the deduplicated 16.
- The block-distribution-by-index convention comes from the SL-10
  content-template "Versus" pattern (lines 1990 of the master
  catalog), adapted from comparison to parallel.
- The "text+chart" pairing is the data-story-without-the-annotation
  variant — see ref #12 for the full data-story layout.
