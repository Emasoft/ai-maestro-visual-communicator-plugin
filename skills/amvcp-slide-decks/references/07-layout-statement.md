# 07 — Layout: `statement` (the single bold claim, centred)

A statement is a pivot. Where the manifesto opens, the statement turns —
"everything you've heard so far is about to be contradicted by the next
sentence". One bold claim, centred on the stage, no eyebrow, no
elaboration, no chart. The whole slide is the claim itself.

Statements are rare. A deck with three statements is a deck of pivots,
which is incoherent. A deck of 12 slides has at most one or two — the
moment where you stop building up and start landing.

## What this is

`layout: "statement"` builds a slide with:

- One required `heading` block at hero-tier size (the claim).
- Optional `text` block (a single supporting clause).

The renderer applies `vsd-layout-statement` to the section; the layout CSS
centres the content both horizontally and vertically and bumps the heading
size up to hero tier (`--vc-text-5` plus a per-statement boost).

The difference from `manifesto`: a manifesto opens an argument; a
statement turns it. Visually they look similar; functionally they're
different roles in the deck's pacing.

## Scaffold to emit

```jsonc
{ "layout": "statement",
  "blocks": [
    { "type": "heading", "text": "Caching the right keys beats caching more keys." }
  ]
}
```

With a supporting clause:

```jsonc
{ "layout": "statement",
  "blocks": [
    { "type": "heading", "text": "We were optimizing the wrong axis." },
    { "type": "text",    "text": "Throughput was fine. The tail latency was the problem." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to flat-block path.
- `renderBlock(doc, block, ctx)` — renders the heading + optional text.
- `validateHeadline(text)` — assertion-evidence soft check. Statements
  ALMOST ALWAYS pass the rule because they're written as claims by
  construction.

## DESIGN.md tokens used

| Token | Default | What it themes on statement |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Optional clause. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Optional underline / left-bar decoration. |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-text-5` | `96 px` (often boosted to 128 px on statement) | Hero size. |
| `--vc-line-height` | `1.15` | Tight leading at hero scale. |

## Selection / comment / decision-mini contract notes

The statement slide is a selectable atom like any other. The decision-
mini pill is especially valuable on statements — the reviewer's
agree/propose-change/disagree affordance lets the audience react to the
talk's pivot point.

## When to use this reference

Open this ref when:

- The deck needs a turning point — "before this slide, the talk was
  about X; after this slide, it's about Y".
- A single insight deserves its own moment, not buried in a content
  slide's third bullet.
- The talk's thesis can be expressed in one sentence, and you want to
  show that sentence as its own destination.

## Don'ts

- Don't add bullets to a statement. If the claim has sub-points, it's a
  `content` slide.
- Don't use more than 2 statements in a 12-slide deck. The pivot point
  loses its impact if every other slide is also a pivot.
- Don't put a statement after another statement. Statements need a
  content slide on each side for contrast.
- Don't bury the verb. "Cache hit rates matter" is a statement;
  "Cache hit rates" is a label. The validator catches the label form.

## Authoring rules

Statements are claims by construction — they're the easiest layout to
write well *because* they're constrained. One sentence. Has a verb. ≥5
words. Most violations are accidental:

- Using a noun-phrase title: "Cache hit rates" → "Cache hit rates
  drove the latency win."
- Using a question: "What changed?" → "Three caching decisions
  changed everything." (Questions don't read as claims; the audience
  doesn't know what to disagree with.)
- Using a directive: "Cache the right keys" → "Caching the right keys
  beats caching more keys." (Directives are advice; claims are
  arguments.)

## Visual verification

After authoring a statement, capture light + dark at 1280×720 via the
dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at hero tier (≥ 96 px on the stage; ≥ 64 px on a
   compact viewport).
2. The heading is vertically centred on the stage.
3. Console reports zero `data-vsd-headline-warn` warnings.
4. The slide reads as ONE object — no competing visual elements.

## Placement in the deck

Where statements live in a well-structured deck:

| Slide # | Layout | Role |
|---|---|---|
| 01 | `manifesto` | Opening claim. |
| 02 | `section-divider` | Act I title. |
| 03 | `content` | Act I evidence #1. |
| 04 | `content` | Act I evidence #2. |
| 05 | `statement` | Pivot — "but here's the surprise". |
| 06 | `section-divider` | Act II title. |
| 07-11 | (various) | Act II evidence. |
| 12 | `closing` | Wrap. |

The single statement at slide 5 is the deck's hinge — Act I built up the
expected story; the statement turns it; Act II argues for the new claim.

## Comparison to other layouts

| Layout | Difference |
|---|---|
| `manifesto` | Opens an argument. Statement TURNS one. |
| `closing` | Lands an argument. Statement PIVOTS one. |
| `quote` | An external voice. Statement is the DECK author's voice. |
| `section-divider` | A structural beat. Statement is a SEMANTIC beat. |

The four "centred display" layouts all look similar but serve different
roles in the deck's rhythm. The right one is the one whose ROLE matches
the moment, not the one that "looks right".

## Statement frequency in well-structured decks

| Deck length | Suggested number of statements |
|---|---|
| 6 slides (lightning talk) | 0-1 |
| 12 slides (standard talk) | 1-2 |
| 20 slides (long-form review) | 2-3 |
| 30+ slides (workshop / deep-dive) | 3-4 |

The pattern: about one statement per ~10 slides, placed at the
pivot points of the talk. More than that dilutes the pivot;
fewer than that makes the talk feel flat.

## Statement examples by argument type

| Argument type | Statement example |
|---|---|
| Pivot to a counter-claim | "Caching the right keys beats caching more keys." |
| Concession + redirect | "Yes the rewrite was expensive — but it shipped on time." |
| Reframe | "The problem isn't latency; it's the tail." |
| Constraint reveal | "We can't add a second cache layer — and we don't need to." |
| Hidden lever | "The bottleneck wasn't the cache; it was the eviction loop." |
| Industry truism | "Cache invalidation is hard. Per-key TTL makes it tractable." |
| Author's strong take | "The architecture should optimise for read latency, period." |

Each is a single sentence the audience can agree or disagree with —
not a label, not a question, not a directive.

## Source provenance

- SL-04 — 10 Folio editorial patterns; the "Manifesto" entry actually
  covers both the opening anchor and the mid-deck statement (the
  triage merged them, but the deduplicated catalog here splits them
  back out by job).
- SL-09 — Assertion-Evidence headline rule, which a statement satisfies
  by construction.
- Hero-tier sizing matches the `Display` row of the typography scale
  table at lines 132-139 of `slide-patterns.md`.
- The "deck-as-argument-with-pivot" structure is the 3-act narrative arc
  from SL-10's content-templates.
