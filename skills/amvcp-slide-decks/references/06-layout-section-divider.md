# 06 — Layout: `section-divider` (the ghost-numeral chapter break)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — section titles](#authoring-rules--section-titles)
- [Visual verification](#visual-verification)
- [Numeral formats — what works on the ghost mark](#numeral-formats--what-works-on-the-ghost-mark)
- [Section-divider density](#section-divider-density)
- [Divider sequence patterns](#divider-sequence-patterns)
- [Source provenance](#source-provenance)

A section divider is architectural rhythm. It tells the audience "we're
done with Act II — Act III starts now". The canonical pattern is the
**ghost numeral**: an oversized translucent chapter number (`02`, `III`)
filling the background at `opacity: 0.08`, with the section's title
centred on top at full opacity. No bullets, no metrics. The divider's
content is the rhythm itself.

This layout is what SL-12 in the triage catalogue called "Ghost Numeral
Section Divider" — folded here as one of the 16 canonical layouts. A
seven-section deck needs six dividers; without them the audience loses
their place after slide 8.

## What this is

`layout: "section-divider"` builds a slide with:

- A `numeral` slide-level key (the ghost number/Roman/Greek glyph that
  paints the background).
- One required `heading` block (the section title).
- One optional `text` block (the section's one-line thesis).

The numeral is a slide-level field (not a block) because it paints the
*background* layer, not the content layer. The renderer applies
`data-vsd-numeral="${slide.numeral}"` to the section, and the CSS uses
`content: attr(data-vsd-numeral)` on a `::before` pseudo-element to
display it at 40 vw / 0.08 opacity / ultra-light weight.

## Scaffold to emit

```jsonc
{ "layout": "section-divider",
  "numeral": "02",
  "blocks": [
    { "type": "heading", "text": "Act II — The cache rewrite." },
    { "type": "text",    "text": "How we cut p99 latency by 38%." }
  ]
}
```

Roman numerals also work — the renderer just stamps whatever string you
put in `numeral`:

```jsonc
{ "layout": "section-divider",
  "numeral": "III",
  "blocks": [
    { "type": "heading", "text": "Act III — What broke in production." }
  ]
}
```

So do dotted decimals for a tree-of-sections deck:

```jsonc
{ "layout": "section-divider",
  "numeral": "2.1",
  "blocks": [
    { "type": "heading", "text": "Per-key TTL." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to flat-block path
  (section-divider is not a custom layout). Reads `slide.numeral`,
  stamps `data-vsd-numeral` on the `<section>`.
- `renderBlock(doc, block, ctx)` — renders the heading + optional text.
- `validateHeadline(text)` — soft check on the heading; section titles
  often read as labels (`"Architecture"`, `"Results"`) — see
  Authoring-rules below.

## DESIGN.md tokens used

| Token | Default | What it themes on section-divider |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading text + ghost numeral colour (composited at 0.08 opacity). |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Optional `text` block. |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-text-4` | `64 px` | Heading size (one tier below manifesto). |

The ghost numeral inherits the slide's `color` so it picks up the
heading colour automatically — when the engine swaps the dark-mode
content token from `#1f1a14` to `#e8eaef`, the numeral swaps too,
maintaining the 0.08 opacity translucency on the new colour.

## Selection / comment / decision-mini contract notes

The section-divider slide is a selectable atom like any other. The
numeral is a CSS `::before` pseudo-element so it can't carry its own
`data-ve-id` even if we wanted (pseudo-elements don't appear in the
DOM tree). The whole divider is the selection unit.

## When to use this reference

Open this ref when:

- Building a deck of more than ~8 slides — dividers go between every
  major section.
- Naming Acts of a talk (Act I, II, III; or by topic).
- The audience keeps losing the deck's structure — too few dividers.

## Don'ts

- Don't dump narrative content on a divider. The divider IS the
  rhythm; adding bullets / charts / metrics turns it into a `content`
  slide.
- Don't number dividers out of sequence. The numeral is the spatial
  cue ("we are 2 sections in"); skipping `02` → `04` confuses the
  audience.
- Don't put more than one section-divider in a row. Two dividers
  back-to-back is a deck-flow mistake; one section ALWAYS has at
  least one content slide between dividers.
- Don't shrink the numeral. The 40 vw size is what makes the rhythm
  read at projection distance; making it smaller turns the divider
  into a busy content slide.

## Authoring rules — section titles

Section titles legitimately read as labels (`"Architecture"`,
`"Results"`, `"Next Steps"`) — they name a chunk of the deck, not a
claim. The renderer's `validateHeadline` will warn on these as
verbless labels.

Two acceptable resolutions:

1. **Embrace the warning as intentional.** Leave the headline as a
   label and ignore the `data-vsd-headline-warn` attribute. Section
   titles are the one case where labels are correct.
2. **Rewrite as a thesis statement.** "Architecture" →
   "How the new architecture handles 10× more reads." This passes
   the rule and gives the section a stronger anchor than its name.

The skill prefers option 2 when the title is for an Act ("the part of
the talk that argues X"); option 1 when the title is for a literal
section ("the architecture chapter").

## Visual verification

After authoring a section-divider, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The ghost numeral fills ~40% of the stage width.
2. The numeral is barely visible (0.08 opacity); it should read as a
   watermark, not a competing element.
3. The heading sits on top of the numeral at full opacity, centred.
4. The numeral colour MATCHES the heading colour (verify in both
   themes — common bug: numeral hard-coded to one theme's content
   colour).
5. At 1024×600 the numeral scales proportionally with the stage
   (it's still ~40 vw on the stage, even after the stage's own
   `transform: scale()`).

## Numeral formats — what works on the ghost mark

The numeral renders via `content: attr(data-vsd-numeral)` so ANY
string works. Common formats:

| Format | Examples | When to use |
|---|---|---|
| Two-digit pad | `01`, `02`, `03` | Sequential sections. Most common. |
| Roman | `I`, `II`, `III` | Editorial / book-like. |
| Decimal | `1.1`, `2.3` | Hierarchical (chapter . section). |
| Word | `One`, `Two` | Literary. Use sparingly — words break at 40 vw. |
| Glyph | `→`, `✦`, `※` | Decorative — for emphasis on the SECTION'S theme, not pagination. |

Avoid:
- Numbers > 99 (`100`, `101`) — they wrap and break the visual rhythm
  at 40 vw.
- Mixed formats in one deck (`01` then `II` then `Three`) — looks
  inconsistent.

## Section-divider density

A divider has ALMOST no density budget:
- 1 numeral (the `numeral` field).
- 1 heading (the section title, ≤ 12 words).
- 1 optional `text` block (the section thesis, ≤ 20 words).

That's it. Bullets / metrics / charts on a divider turn it into a
content slide.

## Divider sequence patterns

For a 4-section deck (16-20 slides total), the sequence:

```
Slide 01: manifesto                  — Opening claim.
Slide 02: section-divider "01"       — "Act I title."
Slide 03-05: content / data-story    — Act I content.
Slide 06: section-divider "02"       — "Act II title."
Slide 07-10: content / comparison    — Act II content.
Slide 11: section-divider "03"       — "Act III title."
Slide 12-15: content / metrics       — Act III content.
Slide 16: section-divider "04"       — "Act IV title."
Slide 17-19: content / closing       — Act IV content.
Slide 20: closing                    — Wrap.
```

The dividers are the deck's bones — the audience knows where they
are at every moment.

## Source provenance

- SL-12 — Ghost Numeral Section Divider (`reports/visualizing-triage/
  20260515_112406+0200-MASTER-CONSOLIDATED.md`).
- Lines 522-540 of `slide-patterns.md` show the canonical CSS:
  `font-size: clamp(100px, 22vw, 260px); font-weight: 200;
  opacity: 0.08; position: absolute; inset: 0; display: grid;
  place-items: center;`.
- The "Act I / Act II / Act III" framing comes from the assertion-evidence
  authoring rule (SL-09) — a deck is an argument, and the dividers are
  the argument's structural beats.
