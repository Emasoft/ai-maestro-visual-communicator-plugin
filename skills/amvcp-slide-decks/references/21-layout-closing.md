# 21 — Layout: `closing` (wrap / call-to-action / next step)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — closing types](#authoring-rules--closing-types)
- [Visual verification](#visual-verification)
- [Closing-slide examples by talk type](#closing-slide-examples-by-talk-type)
- [Strong closing headlines](#strong-closing-headlines)
- [Closing pairs (`manifesto` + `closing`)](#closing-pairs-manifesto--closing)
- [Source provenance](#source-provenance)

The closing slide is the deck's last slide. ONE sentence pointing
forward. Either a wrap ("we shipped X, Y, Z"), a call-to-action
("approve the Q4 proposal"), or a next step ("read the RFC at the
link in the chat"). The closing's job is to leave the audience with a
single takeaway they can carry out of the room.

Like `manifesto`, closing is display-tier typography on a centred
stage. The difference is direction: manifesto opens an argument;
closing lands it.

## What this is

`layout: "closing"` builds a slide with:

- One required `heading` block (the closing line).
- One optional `text` block (the call-to-action / link / next step).
- One optional `eyebrow` block (a closing label like "Thanks." /
  "Questions?" / "Q4 starts Monday.").

The renderer applies `vsd-layout-closing` to the section; the layout
CSS centres the content vertically with extra padding for the "land
the plane" feel.

## Scaffold to emit

Wrap:

```jsonc
{ "layout": "closing",
  "blocks": [
    { "type": "heading", "text": "Q4: ship cross-region replication." }
  ]
}
```

Call-to-action:

```jsonc
{ "layout": "closing",
  "blocks": [
    { "type": "heading", "text": "Approve the Q4 proposal by Friday." },
    { "type": "text",    "text": "RFC link in the chat. Vote in #cache-team." }
  ]
}
```

Thanks-and-questions:

```jsonc
{ "layout": "closing",
  "blocks": [
    { "type": "eyebrow", "text": "Thanks." },
    { "type": "heading", "text": "Questions?" }
  ]
}
```

With a referent (the page goes home):

```jsonc
{ "layout": "closing",
  "blocks": [
    { "type": "heading", "text": "The team did this in 6 weeks." },
    { "type": "text",    "text": "Engineering — Q3 2026 Readout — emanuele@team.com" }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — renders the heading + optional
  text + optional eyebrow.
- `validateHeadline(text)` — assertion-evidence soft check.

## DESIGN.md tokens used

| Token | Default | What it themes on closing |
|---|---|---|
| `--vc-color-canvas` | `#ffffff` / `#0f1217` | Stage background. |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading text. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Optional text / call-to-action. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Eyebrow / link colour. |
| `--vc-font-heading` | `Georgia, serif` | Heading typeface. |
| `--vc-text-5` | `96 px` | Heading size (display tier). |
| `--vc-text-1` | `20 px` | Eyebrow / text size. |
| `--vc-space-7` | `64 px` | Padding-block (closing sits LOW + CENTRED on the page). |

## Selection / comment / decision-mini contract notes

The closing slide is one selectable atom. The decision-mini pill on
the closing is especially valuable — it's the audience's last chance
to register agreement / disagreement / propose-change before the deck
ends.

## When to use this reference

Open this ref when:

- Authoring the LAST slide of a deck.
- The deck's job is to extract a decision / next step from the
  audience.
- The talk ends with a question ("Questions?" / "What did we miss?").

## Don'ts

- Don't have a deck without a closing slide. Every deck ends with
  ONE slide that lands the argument. A deck that ends on its second-
  to-last `content` slide feels abandoned.
- Don't pack the closing with bullets / metrics / charts. The
  closing is ONE takeaway; bullets dilute it.
- Don't repeat the manifesto verbatim. The closing should reflect
  what was JUST argued — different from the opening claim, even if
  thematically linked.
- Don't write a label closing ("Thank you." / "End."). The closing
  is an *action* the audience takes — a takeaway, a question, a
  next step.

## Authoring rules — closing types

Three canonical patterns:

1. **The wrap** — "We shipped X, Y, Z." Past tense; affirmative;
   summarises the work. Best for status reviews, project recaps.
2. **The call-to-action** — "Approve the Q4 proposal by Friday."
   Future tense; imperative or interrogative; demands a response.
   Best for decision-required talks.
3. **The handoff** — "RFC link in the chat. Vote in #cache-team."
   Action-oriented; points the audience at where to go next. Best
   for talks that are one step in a longer process.

Pick the pattern that matches the talk's purpose. A status review
that ends with "approve the proposal" is asking for the wrong thing;
a decision talk that ends with "thanks" leaves the decision unmade.

## Visual verification

After authoring a closing slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading sits centred on the stage (vertically + horizontally).
2. The heading is at display tier (≥ 96 px on the stage).
3. The optional eyebrow / text sits above / below the heading.
4. Console reports zero `data-vsd-headline-warn` warnings.
5. The slide is the LAST slide in `deck.slides`; the dot row's last
   dot is `data-active="1"` when the slide is shown.

## Closing-slide examples by talk type

| Talk type | Closing pattern | Example |
|---|---|---|
| Status review | Wrap | "Q3: cache cut p99 by 38% — Q4: cross-region replication." |
| Decision proposal | CTA | "Approve the Q4 proposal in #cache-team by Friday." |
| RFC walkthrough | Handoff | "RFC at design/2026/q4-cache.md — comments by Wed." |
| Project recap | Wrap | "The team shipped 14 features in 6 weeks." |
| Investor pitch | CTA | "We're raising a $5M seed — let's talk after the talk." |
| Conference talk | Q&A | "Questions? — emanuele@team.com" |
| Postmortem | Wrap + action items pointer | "INC-4421 is closed; action items in #ops by Mon." |
| Roadmap presentation | Handoff + CTA combo | "Vote on the priority ordering by Friday — link in chat." |

## Strong closing headlines

A strong closing heading:

1. Names ONE takeaway (not three).
2. Points forward (not backward — the closing is the deck's exit, not
   its recap).
3. Passes the assertion-evidence rule (≥5 words + verb/digit).
4. Is short enough to fit at display tier (≤12 words).

Pass examples:

- "Approve the Q4 cache proposal by Friday."
- "Q4: ship cross-region replication."
- "We're hiring two backend engineers — referrals welcome."
- "The team did this in 6 weeks — thanks for the support."

Fail examples (rewrite needed):

- "Thank you." (verbless, label) → "Thanks — questions?"
- "End of presentation" (verbless) → "Q4 starts Monday."
- "Conclusion" (1 word, label) → "Three Q3 wins set up the Q4 plan."

## Closing pairs (`manifesto` + `closing`)

The opening manifesto and the closing should pair. Two examples:

```
Manifesto: "We cut p99 latency by 38% in Q3."
Closing:   "Q4: ship cross-region replication."
```

The manifesto claims the past achievement; the closing points to
the next step. Together they form the deck's arc — "we did X; we'll
do Y".

```
Manifesto: "Three options for Q4 — we recommend the second."
Closing:   "Approve the proposal by Friday."
```

The manifesto names the question; the closing requests the answer.

The pairing is the deck's INTEGRITY — without it the closing feels
abandoned (no claim to land) or the manifesto feels rhetorical (no
action to extract).

## Source provenance

- SL-04 — Folio "Narrative Arc (3-act structure)" — the third act
  (the resolution) is what `closing` encodes.
- SL-09 — Assertion-Evidence headline rule applied to the closing
  ("the closing heading should be a takeaway the audience can take
  with them").
- The three canonical closing patterns (wrap, CTA, handoff) are
  documented in the slide-spec authoring rules section.
- Display-tier sizing comes from the typography scale documented in
  `slide-patterns.md` lines 87-129.
