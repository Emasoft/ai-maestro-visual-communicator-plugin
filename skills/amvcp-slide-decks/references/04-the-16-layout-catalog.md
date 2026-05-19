# 04 — The 16-layout catalog (named compositions, by job)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Layout-by-role across a 12-slide deck](#layout-by-role-across-a-12-slide-deck)
- [When a layout choice is wrong](#when-a-layout-choice-is-wrong)
- [Source provenance](#source-provenance)

A slide layout is NOT a look — it's a job. `manifesto` does opening
declarations. `metrics` does numeric impact rows. `comparison` does
then-vs-now contrast. The 16 layouts in `amvcp-slide.js`'s `LAYOUTS` array
are the deduplicated union of five layout catalogs that the master triage
consolidated: Folio (10), bento (7 grids + 8 cards), editorial moves (8),
content templates (5), and the ghost-numeral divider. Pick by job, not by
looks.

## What this is

A slide's `layout` field is a string from this 16-name closed enum. Every
unknown layout name throws at `parseDeck()` — adding a new layout means
adding the name to `LAYOUTS`, the JS branch in `renderSlide()` (if it needs
custom rendering like bento or metrics do), and a per-layout reference.

### The 16 named layouts (with their jobs)

| `layout` | Job | When to pick | See ref |
|---|---|---|---|
| `manifesto` | Opening declarative anchor | The talk's first slide. ONE big sentence. | #05 |
| `section-divider` | Topic break + ghost numeral | Between Acts I, II, III of a long deck. | #06 |
| `statement` | Single bold claim, centred | A pivot point — "everything you've heard is wrong". | #07 |
| `content` | Heading + bullets (the default talk slide) | A point that has 2-5 supporting beats. | #08 |
| `two-column` | Heading + 2 stacks of content | A point with a left half (text) + right half (image/chart). | #09 |
| `comparison` | Left vs right contrast | Then vs now, before vs after, option A vs option B. | #10 |
| `quadrant` | 2×2 phase-space | Four options in a `position × tone` matrix. | #11 |
| `data-story` | Chart + headline + annotation | A finding driven by ONE chart with one annotation. | #12 |
| `metrics` | Heading + KPI row | Three to six numeric impact stats in one row. | #13 |
| `timeline` | Heading + horizontal timeline | A sequence of dated steps (Q1 → Q4, day 1 → 14). | #14 |
| `bento` | Heading + bento grid (7 sub-grids) | A multi-pane summary with mixed card types. | #15, #16 |
| `stack` | Heading + layered cards | A list-of-things with a strong title hierarchy. | #17 |
| `full-bleed` | Edge-to-edge image + overlay text | A purely emotional moment — hero image dominates. | #18 |
| `quote` | Oversized blockquote + cite | A line worth a slide on its own. | #19 |
| `code-focus` | Heading + ONE code block | The single hot-path snippet the audience must read. | #20 |
| `closing` | Wrap / call-to-action / next step | The last slide. ONE sentence pointing forward. | #21 |

### The folio rule

The Folio pattern catalog (SL-04 in the master triage) was the strongest
signal: 10 named editorial layout patterns, each picked by job. This skill
adopts the rule but expands the list to 16 to fold in the bento + editorial
moves + content templates that converged separately. The rule itself is
unchanged: **pick a layout because of what it DOES, not because of what it
LOOKS like.**

Two examples of the rule applied:

- "Show that latency dropped 38%" — `metrics`, NOT `data-story`. A
  single-number impact is a metric, not a chart story. (A chart story is a
  *finding*, not a *number*.)
- "Show 5 architectural principles" — `content`, NOT `bento`. A flat list
  of 5 principles wants the simple `content` slide; bento is for a
  multi-pane *summary* (mixed types, mixed sizes).

## Scaffold to emit

Each layout's full scaffold lives in its own per-layout reference (numbers 05
through 21). Here's the minimum: pick the `layout` enum, add the required blocks.

```jsonc
{ "layout": "manifesto",
  "blocks": [
    { "type": "eyebrow", "text": "Q3 2026" },
    { "type": "heading", "text": "We cut p99 latency by 38%." }
  ]
}
```

Layouts have different "expected" block sets — e.g. `metrics` expects
several `metric` blocks; `comparison` expects exactly one `comparison`
block; `code-focus` expects exactly one `code` block. The renderer doesn't
enforce these as hard requirements (a `metrics` slide with zero `metric`
blocks renders an empty row), but the convention drives the
visual-verification path: an empty `metrics` slide is a bug.

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatcher. Routes to
  `renderBentoSlide` for `bento`, `renderMetricsSlide` for `metrics`, and
  the flat-block path otherwise. Stamps `.vsd-layout-${layout}` on the
  `<section>` so per-layout CSS targets it.
- `renderBentoSlide(doc, section, slide, ctx)` — bento-specific: first
  block is the heading, the rest become `.vsd-bento-card` children of a
  `.vsd-bento-grid` with `data-vsd-grid="${slide.grid}"`.
- `renderMetricsSlide(doc, section, slide, ctx)` — metrics-specific:
  groups all `metric` blocks into a single `.vsd-metrics-row` flex/grid
  container.
- `validateSlide(slide, i)` — rejects unknown `layout` values with the
  list of valid names. Rejects unknown `grid` values when `slide.grid`
  is set.

## DESIGN.md tokens used

Each layout themes off the same engine tokens — there's no layout-specific
token family. What changes per layout is which token gets the most visual
weight:

| Token | Used most by |
|---|---|
| `--vc-color-content` | `manifesto`, `quote`, `closing` (display text dominates) |
| `--vc-color-accent` | `eyebrow` on every layout; `metric.value` on `metrics`; section-divider numeral |
| `--vc-text-5` (hero) | `manifesto`, `statement`, `closing` heading |
| `--vc-text-4` (display) | `content`, `comparison`, `data-story`, `quote` heading |
| `--vc-space-7` (xxl) | `manifesto` / `closing` padding-block (extra breathing room) |
| `--vc-space-5` (lg) | `content` / `bento` / `metrics` gap |

The DESIGN.md doesn't know which layout it's themeing — it ships the
tokens; the per-layout CSS picks which token to read most loudly.

## Selection / comment / decision-mini contract notes

Every layout produces ONE selectable slide atom (`.vsd-slide[data-ve-id]`).
The decision-mini pill attaches per slide regardless of layout. A bento
slide does NOT make each card a separate atom — the slide is the unit of
comment / agreement / disagreement. (If a reviewer wants to comment on one
bento card specifically, the comment text says "the third card from the
left".)

## When to use this reference

Open this ref when:

- Choosing a layout for a new slide — the table above is the
  job-to-layout map.
- A layout looks wrong for the content — re-read the job column, not the
  visual. The right layout is the one whose JOB matches the content's
  job.
- Considering adding a 17th layout — DON'T without a triage source
  pointing to a convergent pattern. The catalog is closed for a reason
  (the LLM-discoverable surface stays bounded).

## Don'ts

- Don't use `manifesto` for anything other than slide 1 (or rare
  in-deck anchors). Multiple manifestos in one deck reads as
  indecision.
- Don't use `full-bleed` more than once per ~10 slides. Full-bleed
  hero shots steal attention; back-to-back full-bleeds dilute the
  signal.
- Don't pick layouts to "look varied" — pick layouts because the
  content's job changed. Three `content` slides in a row is correct if
  the content's job is "list 12 supporting points".
- Don't mix `layout: "bento"` with a non-bento `grid` value. The grid
  field is bento-only; setting it on a non-bento layout is silently
  ignored (the validator only checks bento-grid enum when grid is
  set).

## Visual verification

For each new layout used, capture light + dark at 1280×720 via the
dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The layout's primary content reads from at least 6 ft away (test by
   stepping back from the monitor).
2. The `data-vsd-layout="${layout}"` attribute is on the `<section>`.
3. The headline passes the assertion-evidence check (no
   `data-vsd-headline-warn`).
4. The density guard didn't fire (`data-vsd-overflow` absent).

## Layout-by-role across a 12-slide deck

A canonical 12-slide deck uses ~6 different layouts:

| # | Layout | Role |
|---|---|---|
| 01 | `manifesto` | Opening anchor — what the deck argues. |
| 02 | `section-divider` (01) | Act I title. |
| 03 | `content` | Act I evidence #1 (5 bullets). |
| 04 | `data-story` | Act I evidence #2 (chart-driven finding). |
| 05 | `metrics` | Act I summary (4-6 KPIs). |
| 06 | `section-divider` (02) | Act II title. |
| 07 | `comparison` | Then-vs-now contrast. |
| 08 | `content` | Act II evidence (5 bullets). |
| 09 | `code-focus` | Hot-path snippet. |
| 10 | `statement` | Pivot — single bold claim. |
| 11 | `content` | Implications (5 bullets). |
| 12 | `closing` | Wrap + call-to-action. |

Six distinct layouts (`manifesto`, `section-divider`, `content`,
`data-story`, `metrics`, `comparison`, `code-focus`, `statement`,
`closing`) across 12 slides — enough variety to keep the pacing
fresh without overdesigning.

## When a layout choice is wrong

Common mis-pairings:

| Author chose | Should be | Why |
|---|---|---|
| `manifesto` for slide 5 | `statement` | Manifesto is for slide 1; mid-deck claims are statements. |
| `content` for a comparison | `comparison` | Two parallel bullet lists in `content` lose the contrast. |
| `metrics` for one big number | `manifesto` or `statement` | One number wants the heading slot, not a row. |
| `bento` for a homogeneous list | `content` or `metrics` | Bento is for HETEROGENEOUS cards. |
| `data-story` for a chart with no annotation | `two-column` (chart + bullets) | Data-story REQUIRES the annotation. |
| `code-focus` for shell one-liners | `content` (bullets) | Code-focus is for ≥3-line snippets. |
| `full-bleed` for data | `data-story` | Full-bleed is emotional; data is `data-story`. |
| `quadrant` for unrelated 4 items | `bento` + `stats` grid | Quadrant requires two orthogonal axes. |

The fix is always to ask "what's the JOB of this slide?" and pick the
layout whose job matches.

## Source provenance

- Folio's 10 layouts (SL-04 in the master catalog).
- Bento's 7 grids + 8 cards (SL-07, folded as ref #15 / #16).
- Editorial 8 moves (SL-13, merged into the 16 names — no separate
  catalog).
- Content templates 5 + GSAP transitions 4 (SL-10, content half merged
  into the 16, transitions half handled in ref #22).
- Ghost numeral divider (SL-12, becomes the `section-divider` layout in
  ref #06).
- McKinsey Folio rule "pick by job, not by looks" (SL-04 commentary).
