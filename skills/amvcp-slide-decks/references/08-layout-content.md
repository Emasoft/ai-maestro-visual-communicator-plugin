# 08 — Layout: `content` (heading + bullets, the default talk slide)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Content density limits](#content-density-limits)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Splitting overflowing content](#splitting-overflowing-content)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

The content slide is the workhorse — heading + 2-6 bullets. Most slides
in any talk are content slides. The talk's *argument* lives in the
manifesto + section dividers + statements + closing; the talk's
*evidence* lives in the content slides.

The content layout is asymmetric by default — content offset to one side
(typically left-heavy at 3fr 2fr), leaving room on the other side for an
optional aside (illustration, icon, mini-diagram, accent SVG). The
asymmetry is what keeps three content slides in a row from feeling
identical.

## What this is

`layout: "content"` builds a slide with:

- One optional `eyebrow` block (rarely used — content slides usually
  inherit context from the section divider).
- One required `heading` block at h2 size (`level: 2`).
- One required `bullets` OR `text` block (the evidence).
- One optional second block (a `text` summary line, a `callout`, an
  `image` aside).

The renderer applies `vsd-layout-content` to the section; the layout CSS
uses a 3fr/2fr grid by default, with the heading + bullets in the left
column.

## Scaffold to emit

Basic content slide:

```jsonc
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three caching changes drove the win." },
    { "type": "bullets",
      "items": [
        "Per-key TTL replaced per-region TTL.",
        "Cache warmup runs at deploy time.",
        "Eviction now prefers stale-while-revalidate."
      ] }
  ]
}
```

With sub-bullets:

```jsonc
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three caching changes drove the win." },
    { "type": "bullets",
      "items": [
        { "text": "Per-key TTL replaced per-region TTL.",
          "sub": "Each key picks its own freshness window." },
        { "text": "Cache warmup runs at deploy time.",
          "sub": "First request sees a warm cache, not a cold one." },
        { "text": "Eviction now prefers stale-while-revalidate.",
          "sub": "Stale data is served while the refetch is in flight." }
      ] }
  ]
}
```

With a callout summary:

```jsonc
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three caching changes drove the win." },
    { "type": "bullets",
      "items": ["Per-key TTL", "Deploy-time warmup", "stale-while-revalidate"] },
    { "type": "callout", "variant": "info",
      "text": "All three rolled out behind a single feature flag." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to flat-block path.
- `renderBlock(doc, block, ctx)` — renders the heading + bullets +
  optional callout/text. Tracks `ctx.bulletCount` against `MAX_BULLETS`.
- `renderBulletItem(doc, item)` — handles both string items and
  `{text, sub}` items.

## DESIGN.md tokens used

| Token | Default | What it themes on content |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading + bullet text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Bullet sub-text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Bullet markers (the `::before` dot). |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-font-body` | `system-ui, sans-serif` | Bullet text typeface. |
| `--vc-text-4` | `64 px` | Heading (h2) size. |
| `--vc-text-3` | `40 px` | Bullet text size. |
| `--vc-text-2` | `28 px` | Sub-bullet size. |
| `--vc-space-3` | `24 px` | Inter-bullet gap. |
| `--vc-space-4` | `40 px` | Bullet `padding-left` (room for the marker). |

## Content density limits

The renderer's density guard fires on content slides above:

- `MAX_BULLETS = 6` bullets in any one `bullets` block.
- `MAX_BODY_WORDS = 40` total words across all `text` blocks.

A slide above either limit gets `data-vsd-overflow="N bullets (> 6)"`
and a `densityWarnings` entry. The slide STILL renders — no scrollbar,
no truncation. The warning is the signal that the slide should split.

## Selection / comment / decision-mini contract notes

The content slide is a selectable atom like any other. Individual
bullets are NOT separately selectable — the comment-modal's natural
unit is the slide. A reviewer comment that needs to point at one
bullet says "the third bullet" in the text.

## When to use this reference

Open this ref when:

- The next slide has a thesis (the heading) and 2-6 supporting points
  (the bullets). This is the default workhorse layout.
- You catch yourself reaching for `bento` for "a list of things" —
  `content` is right; `bento` is for mixed-card-type summaries, not
  for a homogeneous list.
- The density guard fires — open this ref to see how to split.

## Don'ts

- Don't put more than 6 bullets on one content slide. The density
  guard fires; readability fails at projection distance; the audience
  loses the thread. Split into two slides with the same heading and
  a `(continued)` marker, or rewrite into a `bento` if the bullets
  are heterogeneous.
- Don't put paragraphs of `text` on a content slide. The 40-word
  budget across all `text` blocks is the soft limit; one bullet is
  one idea, one text block is a connective phrase.
- Don't nest more than one level of sub-bullets. The renderer renders
  the `sub` field of bullet items inline; deeper nesting fails
  visually at projection scale.
- Don't use h1-level headings on a content slide. The default `level:
  2` is correct — h1 is for `manifesto` / `statement` / `closing`.

## Splitting overflowing content

When the density guard fires, split the slide along its natural
sub-topics:

```jsonc
// BEFORE — 8 bullets, density-warn fires.
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Eight things we changed." },
    { "type": "bullets",
      "items": ["A","B","C","D","E","F","G","H"] }
  ]
}

// AFTER — two content slides.
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Four caching changes drove the latency win." },
    { "type": "bullets",
      "items": ["A","B","C","D"] }
  ]
},
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Four observability changes locked in the win." },
    { "type": "bullets",
      "items": ["E","F","G","H"] }
  ]
}
```

The rewrite is BETTER than the original — two narrower thesis statements
each grouping their own bullets, vs one omnibus "eight things" heading
that fails the assertion-evidence rule too.

## Visual verification

After authoring a content slide, capture light + dark at 1280×720 via
the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at `--vc-text-4` (64 px on the stage); bullets at
   `--vc-text-3` (40 px).
2. Bullets are visually offset to the left half of the stage (3fr/2fr
   grid).
3. Each bullet has an accent-coloured dot at its left edge.
4. `data-vsd-overflow` is absent (or the slide has been split).
5. `data-vsd-headline-warn` is absent on the heading.

## Source provenance

- The 3fr/2fr asymmetric grid is the default content layout in
  `slide-patterns.md` lines 562-595.
- Bullet dot styling (`width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);`) is the converged pattern from five
  catalogue sources, lifted into the renderer's injected CSS.
- `MAX_BULLETS = 6` and `MAX_BODY_WORDS = 40` are the values from
  slide-spec.md §10.2 the renderer enforces.
