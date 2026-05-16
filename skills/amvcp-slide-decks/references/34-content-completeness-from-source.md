# 34 — Content completeness (mapping a source document to slides)

When converting a source document (a plan, a spec, a review, a
postmortem, a status report) into a deck, the agent MUST cover every
section, every decision, every data point, every collapsible detail
from the source. A polished deck that drops 30-40% of the source is a
worse artefact than a rough deck that covers everything.

This reference is the workflow for planning a deck from source —
inventory, mapping, layout choice, image planning, verification.
It's the single most important authoring discipline in the skill.

## What this is

Five-step process (lifted from `slide-deck-mode.md` lines 26 + the
`slide-patterns.md` "Planning a Deck from a Source Document"
section):

### Step 1 — Inventory the source

Read the ENTIRE source document. Enumerate every:

- Section + subsection.
- Card / table row / list item.
- Decision (proposed, accepted, deferred).
- Specification / requirement / constraint.
- Collapsible / `<details>` detail.
- Footnote / appendix / cross-reference.

Count them. A typical plan has ~25 distinct content items:
- 7 sections × (1 divider + 2 content slides) = 21 slides
- 6 decision cards × 1 slide each = 6 slides
- 7-row file table = 1 slide
- 4 presets × 1 slide each = 4 slides
- 6 technique guides × 1 slide each = 6 slides
- 1 engine spec × 3 sub-specs = 3 slides
- 2 collapsibles × 1 slide each = 2 slides
- Manifesto + closing = 2 slides

Total: ~45 slides. NOT 13.

### Step 2 — Map source to slides

For each inventoried item, assign one or more slides. Rules:

- Every section gets a `section-divider` + 1-3 content slides
  depending on density.
- Every decision card gets its OWN slide (often `comparison` or
  `stack`).
- Every collapsible detail in the source becomes its own slide.
- Tables of >6 rows split across multiple `table` slides (or
  `data-story` slides if the table is a finding).
- Multi-card sections may need 2-3 slides to cover at readable
  density.

The output of Step 2 is a slide-by-slide outline with layout
assigned. Example for a 7-section plan:

```
Slide 01: manifesto  — "We're going to ship five caching changes in Q3."
Slide 02: section-divider — "01 — The cache architecture."
Slide 03: content — 5 architectural principles.
Slide 04: data-story — Current cache hit rate chart.
Slide 05: section-divider — "02 — The per-key TTL design."
Slide 06: content — TTL design overview.
Slide 07: two-column — TTL config schema + example.
Slide 08: code-focus — TTL config code snippet.
...
Slide 45: closing — "Approve the plan by Friday."
```

### Step 3 — Choose layouts

For each planned slide, pick a layout from the 16-name catalog
(ref #04). Vary across the sequence — three `content` slides in a
row need a `comparison` or `metrics` slide between them for
rhythm.

Layout-by-job mapping (cross-reference with ref #04):

| Source item | Layout |
|---|---|
| Section title + thesis | `section-divider` |
| Section's main thesis + bullets | `content` |
| Decision card with options | `comparison` |
| Decision card with one option | `content` |
| Decision card with 3+ options | `stack` |
| Chart-driven finding | `data-story` |
| KPI row (impact summary) | `metrics` |
| Project timeline (Q1-Q4) | `timeline` |
| Multi-pane executive summary | `bento` |
| Architecture diagram | `two-column` (text + diagram) |
| Code snippet | `code-focus` |
| Customer quote | `quote` |
| Photo / illustration | `full-bleed` |
| Architecture overview | `data-story` (with diagram) |
| Open-questions list | `stack` |

### Step 4 — Plan images

Run `which surf`. If available, plan 2-4 generated images for the
deck:

- ALWAYS: title slide background (16:9 aspect).
- ALWAYS if deck has a `full-bleed` slide: full-bleed background.
- IF room: 1-2 conceptual illustrations for content slides (1:1
  aspect in the `two-column` aside).

Generate images BEFORE writing JSON so they're ready to embed as
base64 data-URIs.

### Step 5 — Verify before writing JSON

Scan the inventory from Step 1. Is anything unmapped?

- A section without a divider slide.
- A decision without its own slide.
- A table row that didn't make it into a `data-story` or `table`
  slide.
- A collapsible detail that's missing.

If yes, ADD slides. A source with 7 sections typically produces
18-45 slides, NOT 10-13.

## The completeness test

After generating the deck, ask:

> Could a reader who has never seen the source document
> reconstruct every major point from the slides alone?

If the answer is no — if they'd miss entire sections — the deck is
incomplete. Add slides.

## Lib functions called

None — this is pure authoring discipline. The renderer doesn't
enforce content completeness (it CAN'T — it doesn't know what the
source document was).

The renderer's density guard (`MAX_BULLETS = 6`, `MAX_BODY_WORDS = 40`)
catches the *opposite* problem (overpacked slides), but
under-coverage is invisible to the validator.

## When to use this reference

Open this ref when:

- Starting a new deck from a source document.
- Asked to convert a plan / spec / review into slides.
- The user says "summarise this as a deck" (the trap — DON'T
  summarise; cover).
- A reviewer complains a section was dropped from the deck.

## Don'ts

- Don't pick a slide count and then squeeze the source to fit. The
  source determines the slide count, not the other way around.
- Don't use the slide format as an excuse to summarise. "Slides
  need to be punchy" doesn't mean dropping a section; it means
  splitting one dense bullet across two slides.
- Don't merge two source sections into one slide because "they're
  related". They're separate sections for a reason — give them
  separate divider + content slides.
- Don't skip the inventory step. Without inventory, the mapping is
  guesswork; you'll drop sections invisibly.

## Anti-patterns

### Anti-pattern 1: the "10 polished slides" trap

Source has 25 items; deck has 10 slides. 15 items dropped without
mention. The deck LOOKS great but the team's actual work is
invisible.

Fix: re-inventory. Add slides until every item is covered. A
25-item deck is probably 30-40 slides, not 10.

### Anti-pattern 2: the "merged decision" trap

Source has 6 decisions; deck has one slide listing 6 decisions in
bullets. The audience can't react to individual decisions; the
slide invites no discussion.

Fix: 6 slides, one per decision, each with the decision's options
and recommendation.

### Anti-pattern 3: the "summary instead of evidence" trap

Source has a 7-row file table with what changed in each file. Deck
has a slide saying "we modified 7 files". The 7-row detail is
gone; the audience can't verify the claim.

Fix: a `table` slide (or 2 `table` slides if the table needs
splitting) with all 7 rows shown.

## Visual verification

After authoring a deck from source:

1. List every slide's `data-vsd-layout`.
2. Cross-reference against the Step 1 inventory.
3. For each inventory item, confirm at least one slide covers it.
4. Capture the FULL deck at 1280×720 via
   `skills/amvcp-self-debug-rules/SKILL.md` — review the deck
   end-to-end as a fresh reader.

## Source provenance

- The 5-step process is lifted from `slide-patterns.md` lines
  27-46 ("Planning a Deck from a Source Document").
- The completeness rule is from `slide-deck-mode.md` lines 19-22
  ("Changing the medium does not mean dropping content").
- The "22-slide deck that covers everything beats a 13-slide deck
  that looks polished" rule is the converged anti-slop discipline
  from DM-19 (Anti-Slop Visual Gates).
- The layout-by-source-item mapping is the consolidated authoring
  guidance from the consolidated slide skill spec.
