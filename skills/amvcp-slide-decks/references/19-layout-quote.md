# 19 — Layout: `quote` (oversized blockquote + attribution)

The quote slide gives a single line its own moment. 36-48 px italic
serif, generous breathing room, oversized opening quotation mark as a
decorative element. The attribution sits below in small caps mono.

Quotes are slides too. A customer quote, an internal Slack message, a
line from a postmortem, a maxim from a book — anything that benefits
from being read AS a quote rather than embedded in a paragraph.

## What this is

`layout: "quote"` builds a slide with:

- One required `quote` block (the quotation + optional cite).
- One optional `heading` block (a small label above — rare).

The renderer applies `vsd-layout-quote` to the section; the layout
CSS centres the quote both horizontally and vertically, draws an
oversized ghost quotation mark behind the text, and applies serif
italic typography.

A `quote` block has:

```jsonc
{ "type": "quote",
  "text": "The best code is the code you don't have to write.",
  "cite": "Jamie Zawinski"   // optional
}
```

## Scaffold to emit

```jsonc
{ "layout": "quote",
  "blocks": [
    { "type": "quote",
      "text": "Caching the right keys beats caching more keys.",
      "cite": "Internal Slack, May 6 2026" }
  ]
}
```

Customer testimonial:

```jsonc
{ "layout": "quote",
  "blocks": [
    { "type": "quote",
      "text": "After the cache rewrite, our checkout page went from a 2-second wait to instant.",
      "cite": "L.M., Enterprise customer (verbatim)" }
  ]
}
```

Postmortem snippet:

```jsonc
{ "layout": "quote",
  "blocks": [
    { "type": "quote",
      "text": "The eviction loop ran for 18 minutes before anyone noticed — the dashboard didn't surface it.",
      "cite": "INC-4421 postmortem, root cause section" }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — for the `quote` block, builds a
  `<blockquote class="vsd-quote">` with the text + optional
  `<cite class="vsd-quote-cite">` child.

## DESIGN.md tokens used

| Token | Default | What it themes on quote |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Quote text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Cite text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Decorative ghost quote mark (composited at low opacity). |
| `--vc-font-quote` | `Georgia, serif` (italic) | Quote typeface. |
| `--vc-font-mono` | `ui-monospace, monospace` | Cite typeface. |
| `--vc-text-quote` | `48 px` | Quote size (between display + h2). |
| `--vc-text-1` | `20 px` | Cite size. |
| `--vc-line-height-quote` | `1.35` | Quote leading (relaxed). |
| `--vc-space-7` | `64 px` | Quote padding-block (extreme breathing room). |

The ghost quote mark is a CSS `::before` pseudo-element with
`content: '\201C'` (Unicode left double quote), sized at 180 px and
opacity 0.08 — a typographic flourish that signals "this is a quote"
even before the reader reads.

## Selection / comment / decision-mini contract notes

The quote slide is one selectable atom. The `<blockquote>` element
inside doesn't carry a separate `data-ve-id`. The decision-mini pill
attaches to the slide, not to the quote.

## When to use this reference

Open this ref when:

- A single line deserves a whole slide on its own.
- The talk benefits from amplifying a customer / colleague's voice.
- A postmortem / RCA quotes the original incident; the quote is the
  receipt.
- The talk's pivot is best expressed as someone else's words (a maxim,
  a Slack one-liner, a book passage).

## Don'ts

- Don't put more than ~25 words / ~150 characters in the quote. The
  `autoFit()` safety net scales long quotes down — but a scaled-down
  quote loses the typographic impact that made it worth a slide.
- Don't use a quote for an unattributed claim. The cite is what
  makes it a quote; without attribution, it's just a `statement`.
- Don't put a quote on every slide. The quote layout's impact comes
  from rarity — once per deck, maybe twice.
- Don't author markdown inside the quote text. The renderer escapes
  everything; markdown shows as literal characters.

## Authoring rules — quote selection

The strongest quote slides quote something:

1. Short (≤ 25 words). Long quotes lose the typographic punch and
   become content slides.
2. Verbatim. The cite ("Internal Slack, May 6 2026" / "L.M.,
   Enterprise customer (verbatim)") matters — a paraphrased quote
   loses its evidentiary value.
3. Worth reading slowly. The quote slide's whole point is that the
   audience pauses and re-reads the line; the line has to reward
   the pause.

## Visual verification

After authoring a quote slide, capture light + dark at 1280×720 via
the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The quote sits centred vertically + horizontally on the stage.
2. The text is in italic serif, ~48 px on the stage.
3. The ghost quote mark is barely visible behind the text (opacity
   ~0.08 in the accent colour).
4. The cite sits below the quote in small caps mono (~20 px), in the
   muted content colour.
5. The slide has generous breathing room (≥ 64 px on every side).

## Quote categories (by source)

| Category | Cite format | Example |
|---|---|---|
| Customer testimonial | "L.M., Enterprise customer (verbatim)" | "Our checkout went from 2s to instant." |
| Internal Slack | "Internal Slack, #cache-team, May 6 2026" | "Cache hit 78% on the dashboard." |
| Postmortem citation | "INC-4421 postmortem, root-cause section" | "The eviction loop ran for 18 min before alerts fired." |
| Book / paper | "Author Name, Book Title (Year)" | "The best code is the code you don't write." |
| Conference talk | "Speaker Name, Conference YYYY" | "Cache invalidation is hard because…" |
| Internal RFC / spec | "RFC-2026-04, §3.2 — Per-key TTL design" | "Each key declares its own freshness window." |
| Maxim / aphorism (no cite) | (omit cite) | "Caching the right keys beats caching more keys." |

The cite IS the quote's evidentiary value — without it the quote is
just an unattributed claim, which is a `statement` layout, not a
quote.

## Quote slide as deck punctuation

Quote slides break the deck's rhythm — they switch from the agent's
voice to an external voice. Placement matters:

- **After a dense section** — a quote gives the audience a breath
  between dense content slides.
- **Before a pivot** — quoting the original problem statement sets
  up the pivot.
- **As a wrap line for a section** — "as L.M. put it, X" closes the
  section with attestation.

Don't place quotes at slide 1 (use `manifesto` instead) or as the
LAST slide (use `closing` instead). The quote is a punctuating
beat, not an anchor.

## Common quote-slide mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Paraphrased quote without "[paraphrased]" cite | Loses evidentiary value | Either paraphrase + mark, or use the verbatim quote |
| Quote longer than 25 words | Loses typographic impact at scale | Excerpt or move to `content` |
| Quote from the deck author | Internal authorship is `statement`, not `quote` | Use `statement` |
| Quote attributed to "Anonymous" | Anonymity defeats attestation | Cite the role / context instead ("Customer #14") |
| Quote on every other slide | The format's impact comes from rarity | Use 1-2 per deck max |
| Quote that the deck contradicts | Reads as setup-then-knock-down | Cite + agree, OR move to a different layout |

## Source provenance

- SL-04 — Folio "Pull Quote" pattern.
- `slide-patterns.md` lines 968-1017 spec the canonical quote
  layout — italic serif 36-48 px, ghost quote mark via `::before`,
  cite in small caps mono.
- The 25-word / 150-char limit is from the density table at lines
  1206-1217 of `slide-patterns.md`.
- The "rare; once per deck" rule is from the compositional-variety
  discipline (lines 1178-1190).
