# 28 — Density limits + the overflow guard

The renderer enforces TWO authoring-time density limits as soft
warnings: `MAX_BULLETS = 6` bullets per slide; `MAX_BODY_WORDS = 40`
total body words per slide (across all `text` blocks). Either limit
fires `data-vsd-overflow` on the slide + a `densityWarnings` entry.
The slide STILL renders — no scrollbar, no truncation. The warning
is the signal that the slide should split.

This reference catalogues the density rules per layout, the
splitting strategies, and the no-nested-scrollbars discipline that
backs the whole design.

## What this is

The density guard runs INSIDE `renderSlide()`. Each block updates
the per-slide context:

```js
var ctx = {
  slideIndex: i,
  headlineWarnings: deck._ctx.headlineWarnings,
  bulletCount: 0,
  bodyWords: 0
};
```

- Every `bullets` block adds its `items.length` to `ctx.bulletCount`.
- Every `text` block adds its word count to `ctx.bodyWords`.

After all blocks render, the guard fires:

```js
if (ctx.bulletCount > MAX_BULLETS) {
  section.setAttribute('data-vsd-overflow',
    ctx.bulletCount + ' bullets (> ' + MAX_BULLETS + ')');
  deck._ctx.densityWarnings.push({
    slide: i, reason: ctx.bulletCount + ' bullets'
  });
} else if (ctx.bodyWords > MAX_BODY_WORDS) {
  section.setAttribute('data-vsd-overflow',
    ctx.bodyWords + ' body words (> ' + MAX_BODY_WORDS + ')');
  deck._ctx.densityWarnings.push({
    slide: i, reason: ctx.bodyWords + ' body words'
  });
}
```

The first guard wins — if both bullets AND body-words exceed, only
the bullets warning fires. This is intentional; the agent fixes one
issue at a time.

## Per-layout density limits

The renderer enforces only TWO numeric limits (bullets + body-words),
but each layout has its own "natural density budget" derived from the
visual model:

| Layout | Natural budget | Renderer-enforced |
|---|---|---|
| `manifesto` | 1 eyebrow + 1 heading (≤12 words) + 1 text (≤20 words) | body-words ≤ 40 |
| `section-divider` | 1 heading + 1 text (≤20 words) | body-words ≤ 40 |
| `statement` | 1 heading (≤15 words) + 1 text (≤20 words) | body-words ≤ 40 |
| `content` | 1 heading + 5-6 bullets (≤2 lines each) | bullets ≤ 6, body-words ≤ 40 |
| `two-column` | 1 heading + 2 columns of mixed content | bullets ≤ 6, body-words ≤ 40 |
| `comparison` | 1 heading + 2 panes × ≤5 items | (bullets is the items count) |
| `quadrant` | 1 heading + 4 quadrants × ≤3 items | bullets ≤ 6 (items count) |
| `data-story` | 1 heading + 1 chart + 1 annotation (≤20 words) | body-words ≤ 40 |
| `metrics` | 1 heading + 3-6 metrics | (no bullets/text; metric blocks aren't counted) |
| `timeline` | 1 heading + 3-7 events | (events are metric blocks) |
| `bento` | 1 heading + 4-9 cards (per grid) | (varies — see ref #15) |
| `stack` | 1 heading + 2-5 cards (each: title + 1-sentence desc) | (cards are metric blocks) |
| `full-bleed` | 1 image + 1 heading (≤12 words) + 1 text (≤15 words) | body-words ≤ 40 |
| `quote` | 1 quote (≤25 words) + 1 cite | (not counted as body-words) |
| `code-focus` | 1 heading + 1 code block (≤10 lines) + 1 callout | (code lines not counted) |
| `closing` | 1 heading (≤12 words) + 1 text (≤20 words) | body-words ≤ 40 |

The renderer's two limits catch the most common overpacking cases
(bullet lists, paragraph blocks); other density issues (too many
metrics, too many bento cards, too many timeline events, too many
code lines) fall under the layout's natural budget — not enforced
numerically, but flagged in visual verification.

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — runs the density accumulator
  + the post-render check.
- `MAX_BULLETS` / `MAX_BODY_WORDS` — the two literal constants at
  the top of `amvcp-slide.js`.
- `deck._ctx.densityWarnings` — the per-render array of `{slide,
  reason}` entries. A custom embed can inspect it after
  `renderDeck()` and report warnings to the user.

## When to use this reference

Open this ref when:

- The `data-vsd-overflow` attribute appears on a slide — open this
  ref to see the splitting strategy.
- A console warning mentions density — same.
- An agent wants to estimate "how many slides for N source
  bullets" — divide by 5-6 (rounded up).

## Splitting overflowing content

Three canonical splitting strategies:

### 1. Split by sub-topic

```jsonc
// BEFORE — 8 bullets, density-warn fires.
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Eight things we changed." },
    { "type": "bullets",
      "items": ["A","B","C","D","E","F","G","H"] }
  ]
}

// AFTER — two content slides with narrower thesis statements.
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Four caching changes drove the latency win." },
    { "type": "bullets", "items": ["A","B","C","D"] }
  ]
},
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Four observability changes locked in the win." },
    { "type": "bullets", "items": ["E","F","G","H"] }
  ]
}
```

The split is BETTER than the original — two narrower thesis
statements each grouping their own bullets. The original "Eight
things we changed" fails the assertion-evidence rule too (no
specific claim).

### 2. Split by tier (overview + detail)

```jsonc
// BEFORE — 10 items in a stack, density-warn fires.
{ "layout": "stack",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Ten architectural decisions in Q3." },
    { "type": "metric", "value": "1.", "label": "...", "delta": "..." },
    // ... 10 metric cards ...
  ]
}

// AFTER — one summary slide + per-decision deep-dives.
{ "layout": "metrics",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Ten decisions cluster into four themes." },
    { "type": "metric", "value": "3", "label": "caching" },
    { "type": "metric", "value": "2", "label": "observability" },
    { "type": "metric", "value": "3", "label": "deployment" },
    { "type": "metric", "value": "2", "label": "testing" }
  ]
},
{ "layout": "stack",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three caching decisions." },
    { "type": "metric", "value": "1.", "label": "Per-key TTL" },
    { "type": "metric", "value": "2.", "label": "Deploy warmup" },
    { "type": "metric", "value": "3.", "label": "SWR eviction" }
  ]
}
// ... etc per theme.
```

The overview-then-detail pattern is the strongest split — the
audience sees the structure first, then dives in.

### 3. Promote a bullet to a slide

```jsonc
// BEFORE — 7 bullets, one is heavy (per-key TTL).
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Seven changes shipped." },
    { "type": "bullets",
      "items": ["A","B","Per-key TTL (with sub-points)","D","E","F","G"] }
  ]
}

// AFTER — six bullets + a dedicated slide for the heavy item.
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Six surface changes shipped." },
    { "type": "bullets", "items": ["A","B","D","E","F","G"] }
  ]
},
{ "layout": "content",
  "blocks": [
    { "type": "heading", "level": 2, "text": "Per-key TTL changed the cache contract." },
    { "type": "bullets",
      "items": [
        "Each key declares its own TTL.",
        "The TTL is the per-key config, not a global.",
        "Eviction respects the per-key TTL."
      ] }
  ]
}
```

The heavy bullet got its own slide; the overview slide stayed at 6.

## No-nested-scrollbars discipline

The renderer NEVER adds a scrollbar to a slide. The density guard's
job is to flag overflow BEFORE it becomes a layout failure. A slide
that overflows visually (the layout CSS pushes content beyond the
stage bounds) is a BUG — open the dev-browser inspector + look for
content clipped by `.vsd-viewport`'s `overflow: hidden`.

The no-nested-scrollbars rule (from
`~/.claude/rules/no-nested-scrollbars.md`) applies: don't add
`overflow: auto` to fix overflow; split the content. Inner scrollers
are a usability disaster on slides (the keyboard navigation steals
focus from the deck nav).

## Visual verification

After every authoring pass, check the deck for density warnings:

1. Open the page in dev-browser via
   `skills/amvcp-self-debug-rules/SKILL.md`.
2. Open the console; look for `console.warn` entries about density.
3. Inspect each `.vsd-slide` for the `data-vsd-overflow` attribute
   (DevTools: `$$('[data-vsd-overflow]')`).
4. For each flagged slide, apply one of the three splitting
   strategies above.

## Source provenance

- `MAX_BULLETS = 6` and `MAX_BODY_WORDS = 40` are from slide-spec.md
  §10.2.
- The per-layout density table is the consolidated version of the
  density table in `slide-patterns.md` lines 1206-1217.
- The three splitting strategies are the consolidated authoring
  guidance from the Folio patterns documentation (SL-04) + the
  content-completeness rule from the slide-deck-mode reference
  (lines 21-22).
- The no-nested-scrollbars discipline is the hard invariant from
  `~/.claude/rules/no-nested-scrollbars.md`.
