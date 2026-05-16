# 05 — Layout: `manifesto` (the opening declarative anchor)

The manifesto is the first slide. ONE big sentence that names what the talk
is going to argue. Display-tier typography (96-128 px); generous breathing
room on all sides; an `eyebrow` above the heading carrying the date /
category / context. No bullets, no metrics, no chart. The whole stage is
typography + air.

This layout is the strongest single anti-slop affordance in the deck — a
manifesto that fails the assertion-evidence rule (label, no verb, <5 words)
screams "AI-generated stock title". A real manifesto reads as a claim the
audience could disagree with.

## What this is

`layout: "manifesto"` builds a slide with:

- One optional `eyebrow` block at the top (the context/date stamp).
- One required `heading` block in display-tier size (the claim).
- One optional `text` block below (a single sentence of elaboration).

That's the canonical shape. The renderer doesn't enforce "no extra
blocks" — you CAN add a bullets list to a manifesto — but the visual
language breaks. Use `content` instead.

The renderer applies `vsd-layout-manifesto` to the section; the layout CSS
centres the content vertically and adds extra inline padding for the
"island in the middle of the stage" feel.

## Scaffold to emit

```jsonc
{ "layout": "manifesto",
  "blocks": [
    { "type": "eyebrow", "text": "Q3 2026 · Engineering Readout" },
    { "type": "heading", "text": "Latency dropped 38% after the cache rewrite shipped." },
    { "type": "text",    "text": "Every p99 path now clears 200 ms." }
  ]
}
```

A bare manifesto (just the heading) is also valid:

```jsonc
{ "layout": "manifesto",
  "blocks": [
    { "type": "heading", "text": "Caching the right keys beats caching more keys." }
  ]
}
```

The eyebrow is the most-cuttable element — drop it if the deck title in
the chrome already names the talk's context.

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to the flat-block path
  (manifesto is NOT a custom layout — no special renderer needed).
- `renderBlock(doc, block, ctx)` — renders the `eyebrow`, `heading`,
  `text` blocks.
- `validateHeadline(text)` — the assertion-evidence soft check runs on
  the heading; manifesto headings that fail it get a
  `data-vsd-headline-warn` attribute + a console warning.

## DESIGN.md tokens used

| Token | Default | What it themes on manifesto |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Optional `text` block. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Eyebrow text. |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-font-mono` | `ui-monospace, monospace` | Eyebrow typeface. |
| `--vc-text-5` | `96 px` | Heading size (display tier). |
| `--vc-text-1` | `20 px` | Eyebrow size. |
| `--vc-space-7` | `64 px` | Top padding (manifesto sits LOW on the page). |
| `--vc-space-3` | `24 px` | Eyebrow-to-heading gap. |

When the DESIGN.md swaps `--vc-font-heading` from `Georgia` to `Inter`, the
manifesto's character changes from editorial to brutalist in one paint.

## Selection / comment / decision-mini contract notes

The manifesto SLIDE is a selectable atom (`data-ve-id="s1"` typically,
since it's slide 1). The eyebrow / heading / text BLOCKS are not
individually selectable.

## When to use this reference

Open this ref when:

- Authoring slide 1 of a new deck.
- The audience needs a clear "here is what I'm going to argue" anchor
  mid-deck (rare — usually the section-divider does this).
- The heading-rule console warnings keep firing on the opener — open this
  ref to see what a passing heading looks like (see "Authoring rules"
  below).

## Don'ts

- Don't pack a manifesto with multiple ideas. One claim, one slide.
- Don't add a chart, image, or diagram to a manifesto. If the claim
  needs a chart to read, the slide is a `data-story`, not a manifesto.
- Don't write a manifesto as a label (`"Q3 Results"`, `"Engineering
  Update"`, `"Caching"`). Those fail the assertion-evidence rule and
  read as AI slop.
- Don't put more than ~12 words in the manifesto heading. Display-tier
  type at 96-128 px wraps after ~12 words; longer wraps become a wall.

## Authoring rules — assertion-evidence

The headline rule (`validateHeadline`) is the single highest-leverage
content-quality rule in the deck. A passing manifesto heading:

1. Is at least 5 words long.
2. Contains a verb (one of `is`, `are`, `was`, `dropped`, `shipped`,
   `grew`, `rose`, `beats`, etc. — see `VERB_SIGNALS` in the source) OR
   a digit-with-context (a stat headline reads as a claim).

Pass examples:

- "Latency dropped 38% after the cache rewrite shipped." (verb +
  digit)
- "Three architectural changes paid off in Q3." (verb + digit)
- "Every p99 path now clears 200 ms." (verb + digit)
- "Editing-mode performance lags Render mode by 4×." (verb +
  digit)

Fail examples (with the warning reason):

- "Q3 Results" — 2 words. *headline is 2 words (< 5)*
- "Latency Improvements" — 2 words, no verb. *headline is 2 words (< 5)*
- "Engineering Roadmap Update" — 3 words, no verb. *headline is 3 words (< 5)*
- "The New Caching Architecture" — 4 words, no verb. *no verb detected
  — headline reads as a label, not a claim*

Fix the failures by rewriting as declarative sentences:

- "Q3 Results" → "Three of the four Q3 goals shipped on time."
- "Latency Improvements" → "Latency dropped 38% after the cache
  rewrite."
- "Engineering Roadmap Update" → "The Q4 roadmap focuses on
  cross-region replication."
- "The New Caching Architecture" → "The new cache uses per-key TTL,
  not per-region TTL."

## Visual verification

After authoring a manifesto, capture light + dark at 1280×720 via the
dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading wraps to AT MOST 3 lines at 96 px.
2. The eyebrow is in the accent colour and the mono font.
3. Console reports zero `data-vsd-headline-warn` warnings.
4. The slide is centred vertically on the stage.
5. Selecting the slide paints the `:focus-visible` ring INSIDE the
   slide bounds (not clipped by the viewport).

## Manifestos by talk type

| Talk type | Manifesto heading example |
|---|---|
| Status review (Q3 readout) | "We cut p99 latency by 38% and shipped 14 features." |
| Decision proposal | "Three options for Q4 — we recommend the second." |
| RFC walkthrough | "Per-key TTL is the single highest-leverage change to the cache." |
| Project recap | "The cache rewrite landed in 6 weeks, ahead of schedule." |
| Investor pitch | "We turned 5 enterprise pilots into 3 paid contracts in Q3." |
| Postmortem | "INC-4421 ran for 18 minutes because the eviction loop wasn't alerted." |
| Roadmap | "Q4 ships cross-region replication and the new admin API." |
| Demo / launch | "Cache analytics ship today — here's what they show." |

Each manifesto is ONE sentence that names the talk's argument. The
audience hears it once at slide 1; the next 11 slides should each
support the manifesto's claim.

## Manifesto vs subject-line vs hashtag

Three forms a manifesto can take. Pick the strongest:

- Subject-line form: "Q3 Engineering Readout — 38% latency cut + 14
  features." (long; informational)
- Hashtag form: "Q3: #latency #features #shipped" (terse;
  hashtag-style)
- Sentence form: "Latency dropped 38% after the cache rewrite
  shipped." (sentence; assertion-evidence)

The sentence form is the strongest because it PASSES the validator
AND reads as a claim. Subject-line and hashtag forms FAIL the
validator (no verb, label-style).

## Source provenance

- The 10 Folio editorial patterns (SL-04 in the master catalog) name
  "Manifesto" as the opening-anchor pattern.
- Assertion-evidence headline rule (SL-09) is the validator the renderer
  applies as a soft warning.
- Display-tier type sizing comes from the consolidated typography
  scale documented in the layout patterns (lines 87-129 of
  `slide-patterns.md`).
