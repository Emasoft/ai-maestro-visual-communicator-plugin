# 10 — Layout: `comparison` (left vs right contrast)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — item alignment](#authoring-rules--item-alignment)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

The comparison slide is for opposition. Then vs now. Before vs after.
Option A vs option B. The visual model is two side-by-side panes with
matching titles + matching item lists; the eye reads them in parallel
and the contrast pops out.

Comparison is one of the highest-impact layouts in the catalog because
the contrast does all the cognitive work — the audience sees the delta
visually before reading it textually. A "p99 = 540 ms" on the left and
"p99 = 335 ms" on the right is a 200-millisecond improvement the
audience FEELS before they consciously subtract.

## What this is

`layout: "comparison"` builds a slide with:

- One optional `heading` block (the contrast's name).
- One required `comparison` block (the contrast itself).

A `comparison` block has two required keys:

```jsonc
{ "type": "comparison",
  "left":  { "title": "Q2 (before)", "items": [...] },
  "right": { "title": "Q3 (after)",  "items": [...] }
}
```

Both `left` and `right` are objects with a `title` (string) and `items`
(array of strings or `{text, sub}` objects, same shape as `bullets`).

The renderer produces two `.vsd-compare-pane` divs side-by-side, each
with the title at the top + a `.vsd-bullets` list below. The CSS
applies a subtle vertical divider between them so the boundary is
visible.

## Scaffold to emit

```jsonc
{ "layout": "comparison",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Then vs Now." },
    { "type": "comparison",
      "left": {
        "title": "Q2 (before)",
        "items": [
          "p99 = 540 ms",
          "Cache hit rate 41%",
          "Cold-start latency 1.2 s",
          "Eviction policy: LRU"
        ]
      },
      "right": {
        "title": "Q3 (after)",
        "items": [
          "p99 = 335 ms",
          "Cache hit rate 78%",
          "Cold-start latency 280 ms",
          "Eviction policy: SWR + per-key TTL"
        ]
      } }
  ]
}
```

Pro/Con variant:

```jsonc
{ "layout": "comparison",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Option A vs Option B." },
    { "type": "comparison",
      "left": {
        "title": "Option A — rewrite the cache layer",
        "items": [
          { "text": "+ Cleanest long-term design",   "sub": "Removes legacy hot-paths" },
          { "text": "+ Better observability",         "sub": "OpenTelemetry from day 1" },
          { "text": "− 4 weeks of work",              "sub": "Two engineers full-time" },
          { "text": "− High blast radius",            "sub": "Touches every request path" }
        ]
      },
      "right": {
        "title": "Option B — add per-key TTL",
        "items": [
          { "text": "+ Ships in 3 days",              "sub": "One engineer" },
          { "text": "+ Reversible behind a flag",     "sub": "Roll back without redeploy" },
          { "text": "− Doesn't fix the eviction bug", "sub": "Issue #4218 still open" },
          { "text": "− Adds another config knob",     "sub": "More to forget" }
        ]
      } }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — for the `comparison` block, builds
  the wrapping `.vsd-comparison` div + two `.vsd-compare-pane`
  children.
- `renderComparisonPane(doc, pane)` — internal; builds one pane (title
  with bullet list).
- `renderBulletItem(doc, item)` — handles each item (string or
  `{text, sub}`).

## DESIGN.md tokens used

| Token | Default | What it themes on comparison |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Item text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Pane titles + sub-items. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Bullet markers. |
| `--vc-color-divider` | `#e1ddd1` / `#2a2e35` | Vertical divider between panes. |
| `--vc-font-heading` | `Georgia, serif` | Slide heading + pane titles. |
| `--vc-text-3` | `40 px` | Item text size. |
| `--vc-text-2` | `28 px` | Pane title size + sub-item text. |
| `--vc-space-5` | `32 px` | Inter-pane gap. |

## Selection / comment / decision-mini contract notes

The comparison slide is a single selectable atom. The two panes do
NOT get separate `data-ve-id`s — the contrast IS the unit of meaning;
selecting "the left pane" alone doesn't capture what the reviewer is
reacting to.

## When to use this reference

Open this ref when:

- The next slide's job is to show a contrast (before/after, then/now,
  option A vs option B, our approach vs alternative approach).
- Symmetric data benefits from parallel visual placement — the eye
  does the subtraction automatically.
- Pro/con or for/against debate — the comparison layout's left/right
  symmetry mirrors the rhetorical structure.

## Don'ts

- Don't use comparison for THREE alternatives — that's a `bento` or
  `quadrant` layout. The "left vs right" mental model breaks down at 3.
- Don't put unrelated bullets in the two panes. The eye expects items
  at the same vertical position to correspond. Misaligned items
  break the contrast.
- Don't write the left and right titles in different forms ("Q2" vs
  "Q3 (after)"). Match the form so the contrast is in the items, not
  the labels.
- Don't put more than 5 items per pane. The visual scan starts to
  break down past 5; the density guard fires at 6.

## Authoring rules — item alignment

The strongest comparison slides have items at corresponding positions
that match in length / form / structure:

GOOD:
```
left.items:                    right.items:
"p99 = 540 ms"                 "p99 = 335 ms"
"Cache hit rate 41%"           "Cache hit rate 78%"
"Cold-start latency 1.2 s"     "Cold-start latency 280 ms"
"Eviction policy: LRU"         "Eviction policy: SWR + per-key TTL"
```

The reader's eye matches by vertical alignment; the numbers do the
talking.

BAD:
```
left.items:                    right.items:
"p99 was slow"                 "We added per-key TTL"
"Cache thrashed"               "p99 = 335 ms"
"The eviction policy was LRU"  "Cache hit rate 78%"
```

Items don't align in structure — the eye can't do the contrast. The
audience has to re-read each row to understand what changed.

## Visual verification

After authoring a comparison slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The two panes split the stage 50/50 horizontally.
2. A vertical divider runs between them (subtle, in
   `--vc-color-divider`).
3. Pane titles are aligned at the top, item lists below.
4. Items at the same row index on each side are visually
   parallel (the contrast READS at a glance).
5. On a 480×800 viewport (`fit: responsive`), the panes stack
   vertically.

## Source provenance

- SL-10 content-template "Versus" pattern (comparison with VS
  divider) — adapted here without the literal "VS" glyph (the
  vertical divider is the visual VS).
- "Then vs Now" / "Before vs After" framing is the canonical use case
  documented in the slide-decks spec discovery notes.
- Pro/Con table format is from SL-13's "Split Screen" editorial move,
  enriched with `{text, sub}` item shape for the supporting
  explanation.
