# 32 — Poster mode (`kind: "poster"` — single-slide static export)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [When to pick poster vs single-slide deck](#when-to-pick-poster-vs-single-slide-deck)
- [Don'ts](#donts)
- [Poster aspect ratio](#poster-aspect-ratio)
- [Print / export workflow](#print--export-workflow)
- [Visual verification](#visual-verification)
- [Best layouts for posters](#best-layouts-for-posters)
- [Use cases for posters in practice](#use-cases-for-posters-in-practice)
- [Source provenance](#source-provenance)

The slide module's secondary kind. A poster is a single-slide
"export" rendered onto a fixed-pixel stage WITHOUT nav chrome, ready
to PNG-export or print as a one-page document. Used for shareable
infographics, conference posters, or one-pagers that aren't
presentations.

Poster mode reuses 90% of the slide rendering pipeline — the same
JSON contract, the same layout catalog, the same block types — but
the stage is a different size and the chrome is omitted.

## What this is

`kind: "poster"` builds the deck with:

- ONE slide in the `slides` array (additional slides are accepted
  but only the first renders; this is a deck-of-decks anti-pattern
  the renderer doesn't enforce hard).
- Stage sized to `POSTER_STAGE` (1080×1920 portrait by default —
  the inverted 16:9, suitable for share-card aspect).
- No nav chrome: no dots, no counter, no progress bar, no hints,
  no fullscreen button.
- Same selection / comment contract (the slide IS still an atom).
- Same DESIGN.md theming.

## Scaffold to emit

```jsonc
{
  "kind": "poster",
  "title": "Q3 in one page",
  "slides": [
    { "layout": "bento",
      "grid": "hero",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Q3 in one page." },
        { "type": "metric",  "value": "38%", "label": "p99 latency cut" },
        { "type": "metric",  "value": "78%", "label": "cache hit rate" },
        { "type": "metric",  "value": "14",  "label": "features shipped" },
        { "type": "metric",  "value": "247", "label": "PRs merged" },
        { "type": "callout", "variant": "info",
          "text": "All driven by the cache rewrite." }
      ]
    }
  ]
}
```

A poster with a wide hero image:

```jsonc
{
  "kind": "poster",
  "title": "Cache rewrite shipped",
  "slides": [
    { "layout": "full-bleed",
      "blocks": [
        { "type": "image",
          "src": "data:image/jpeg;base64,…",
          "alt": "Cache hit rate climbing chart.",
          "fit": "cover" },
        { "type": "heading", "text": "78% hit rate, May 13 2026." },
        { "type": "text",    "text": "Three weeks after rollout." }
      ]
    }
  ]
}
```

## Lib functions called

- `parseDeck(input)` — validates `kind: "poster"` against
  `DECK_KINDS`.
- `renderDeck(deck, mountEl)` — detects poster kind, uses
  `POSTER_STAGE` for the stage size, omits the nav chrome build.
- `buildNavChrome(doc, deck)` — early-returns when
  `deck.kind === "poster"`.
- `fitStage(viewport)` — same as deck mode (the letterbox path
  works at any stage aspect).
- `wireResize` / `wireKeyboard` / `wireTouch` — still wired (a
  poster CAN be scaled by resize / fullscreen via F11, even without
  nav).

## DESIGN.md tokens used

Same as deck mode (see ref #30). The poster reads the same
`--vc-*` token family; no poster-specific tokens.

## Selection / comment / decision-mini contract notes

The poster slide is one selectable atom — `data-ve-id="s1"`,
`data-ve-type="slide"`. Same as deck mode. The decision-mini pill
attaches if the runtime is loaded.

This is what makes posters useful as one-page reports: the reader
can click the poster, leave a comment, register a decision —
without any nav chrome cluttering the view.

## When to use this reference

Open this ref when:

- Generating a one-page infographic / share-card / poster.
- A "tl;dr" summary slide that needs to stand alone as an artefact.
- A status-report cover image that the team shares in chat.
- A conference poster (printable, embedded image).

## When to pick poster vs single-slide deck

| Need | Pick |
|---|---|
| Static one-pager, no nav | `kind: "poster"` |
| Single slide WITH nav (counter, dots) | `kind: "deck"` with one slide |
| Share-card aspect (1080×1920 portrait) | `kind: "poster"` (the default poster stage) |
| Print-as-PDF deck | `kind: "deck"` (the print CSS handles pagination) |

## Don'ts

- Don't put multiple slides in a poster. The renderer accepts the
  array but only renders the first; the additional slides are
  silently ignored. Convert to `kind: "deck"` if you want
  navigation.
- Don't try to navigate a poster with arrow keys. The keyboard
  handler is still wired but there's nothing to navigate to.
- Don't omit the nav chrome from a multi-slide deck by overriding
  CSS — convert to poster mode instead. The chrome's absence is
  the SIGNAL to the reader "this is one page, not a deck".
- Don't pick a poster when the content is genuinely a sequence.
  Posters are for stand-alone artefacts; sequences are decks.

## Poster aspect ratio

The default poster stage is 1080×1920 (portrait, inverted 16:9 —
ideal for social-card share). To change it, override
`POSTER_STAGE` in a custom fork OR (preferred) wait for the
forthcoming `posterAspect` field that lets the JSON declare poster
aspect like decks declare aspect:

```jsonc
// FUTURE — not yet supported:
{ "kind": "poster",
  "posterAspect": "9:16",   // or "1:1" / "4:5"
  ... }
```

For now, the default 1080×1920 works for share cards; for other
aspect, generate a custom HTML wrapper that sets the stage
dimensions inline.

## Print / export workflow

Posters export well via:

1. **PNG screenshot** — use the dev-browser path; the poster fills
   the viewport.
2. **Browser "Save as PDF"** — the print CSS restores the natural
   stage size; the poster becomes one page.
3. **Headless Playwright screenshot** — the `vsd-viewport` selector
   is stable; capture at the stage's native pixel size for
   pixel-perfect output.

## Visual verification

After authoring a poster, capture at 1080×1920 (native portrait)
via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. Stage fills the viewport (portrait orientation).
2. NO chrome elements visible (no dots, no counter, no progress,
   no hints, no fullscreen button).
3. The slide is selectable (click → `data-ve-selected="1"`).
4. The decision-mini pill appears (if runtime is loaded).
5. Print preview shows one page filling the paper.

## Best layouts for posters

A poster is one slide — pick a layout that maximises the single-slide
information density:

| Layout | Best for poster |
|---|---|
| `bento` + `grid: "hero"` | One feature + 4 supporting facts. |
| `bento` + `grid: "stats"` | Four KPIs as a row. |
| `bento` + `grid: "asymmetric"` | Heterogeneous summary. |
| `metrics` | A row of 4-6 numbers — "by the numbers" poster. |
| `full-bleed` | Hero image + overlay headline + tagline. |
| `manifesto` | Bare-claim poster — one big sentence. |
| `comparison` | Then-vs-now poster (less common). |

Avoid for posters:

- `quote` — quote layouts are deck-pacing beats; alone they feel
  unfinished.
- `closing` — closings are wrap slides; alone they're confusing.
- `code-focus` — code on a poster has the wrong aspect; use
  `full-bleed` with a screenshot of the code instead.

## Use cases for posters in practice

| Use case | Layout |
|---|---|
| LinkedIn announcement of a launch | `manifesto` or `full-bleed` |
| Q3 numbers as a tweet card | `bento` + `stats` grid |
| Team status update card | `metrics` |
| Project kickoff one-pager | `bento` + `hero` grid |
| RFC summary poster | `bento` + `asymmetric` |
| Conference printable | `bento` + `hero` or `full-bleed` |
| Internal Slack share-card | `metrics` or `manifesto` |

## Source provenance

- The two-kind contract (`"deck"` | `"poster"`) is documented in
  `DECK_KINDS` enum in `amvcp-slide.js`.
- The POSTER_STAGE 1080×1920 portrait aspect is chosen for social-
  card share — the canonical Instagram / LinkedIn / Twitter portrait
  aspect ratio.
- The "no chrome on posters" rule is the slide module's deliberate
  design choice — chrome is for navigation; a poster doesn't
  navigate.
- The shared selection / comment contract makes posters first-class
  citizens of the runtime's review surface.
