# 23 — Blocks: `eyebrow` + `heading` (the title family)

## Table of Contents

- [What this is](#what-this-is)
- [Level selection](#level-selection)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Assertion-evidence rule](#assertion-evidence-rule)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

The `eyebrow` + `heading` pair is the title family that appears on
almost every slide. The eyebrow is the small context line above the
heading — a date, a section name, a category tag. The heading is the
main title at display or h2 tier. Together they form the canonical
"label + main statement" pattern.

## What this is

### `eyebrow` block

```jsonc
{ "type": "eyebrow", "text": "Q3 2026 · Engineering Readout" }
```

Required: `text` (string).
Renders as: `<p class="vsd-eyebrow">`.

Styling:
- Mono typeface (`--vc-font-mono`).
- Uppercase + tracked (`letter-spacing: 0.12em`).
- Accent colour (`--vc-color-accent`).
- Small (`--vc-text-1 = 20 px`).
- Margin-bottom `--vc-space-3 = 24 px` to separate from the heading.

### `heading` block

```jsonc
{ "type": "heading", "text": "...", "level": 1 }   // or level: 2
```

Required: `text` (string).
Optional: `level` (1 or 2; default 1).

Renders as: `<h1 class="vsd-heading">` or `<h2 class="vsd-heading
vsd-heading--2">` depending on level.

Styling:
- Heading typeface (`--vc-font-heading` — typically serif).
- Display-tier size for level 1 (`--vc-text-5 = 96 px`).
- H2-tier size for level 2 (`--vc-text-4 = 64 px`).
- Bold weight (`--vc-weight-bold = 800`).
- Tight leading (`--vc-line-height = 1.15`).
- Default content colour (`--vc-color-content`).
- Margin-bottom `--vc-space-4 = 40 px`.

## Level selection

| Layout | Default `level` | Notes |
|---|---|---|
| `manifesto` | 1 | Display tier; ONE per deck. |
| `statement` | 1 | Display tier (often boosted to 128 px). |
| `closing` | 1 | Display tier. |
| `section-divider` | 1 | Display tier; section title. |
| `quote` | (no heading) | The quote IS the headline. |
| `full-bleed` | 1 | Display tier; overlaid white on image. |
| All others (`content`, `two-column`, `comparison`, `quadrant`, `data-story`, `metrics`, `timeline`, `bento`, `stack`, `code-focus`) | 2 | H2 tier. |

The convention: ONE level-1 heading per deck "act" (1 manifesto + 1
closing + N section-dividers); every other slide uses level-2.

## Scaffold to emit

Eyebrow + heading combination (canonical for `manifesto`):

```jsonc
{ "type": "eyebrow", "text": "Q3 2026 · Engineering Readout" },
{ "type": "heading", "text": "We cut p99 latency by 38%." }
```

Heading-only (canonical for `closing` / `statement`):

```jsonc
{ "type": "heading", "text": "Q4: ship cross-region replication." }
```

H2 heading (canonical for `content` / `comparison` / `data-story` /
…):

```jsonc
{ "type": "heading", "level": 2,
  "text": "Three caching changes drove the win." }
```

## Lib functions called

- `renderBlock(doc, block, ctx)` — the dispatcher; routes `eyebrow`
  + `heading` to their respective branches.
- `validateHeadline(text)` — the assertion-evidence soft check.
  Runs on EVERY `heading` block regardless of level. Failures
  stamp `data-vsd-headline-warn` and log a `console.warn`.

## DESIGN.md tokens used

### `eyebrow`

| Token | Default |
|---|---|
| `--vc-font-mono` | `ui-monospace, monospace` |
| `--vc-text-1` | `20 px` |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` |
| `--vc-space-3` | `24 px` |

### `heading` (both levels)

| Token | Default |
|---|---|
| `--vc-font-heading` | `Georgia, serif` |
| `--vc-weight-bold` | `800` |
| `--vc-line-height` | `1.15` |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` |
| `--vc-text-5` | `96 px` (level 1) |
| `--vc-text-4` | `64 px` (level 2) |
| `--vc-space-4` | `40 px` |

## Selection / comment / decision-mini contract notes

Neither block carries its own `data-ve-id`. They're rendered as
children of the slide's `<section data-ve-id="s<N>">`. The slide is
the comment unit; an eyebrow / heading is part of the slide's
content.

## When to use this reference

Open this ref when:

- Authoring any slide — almost every layout includes a heading.
- Heading-warn warnings keep firing — see "Assertion-evidence rule"
  below.
- Deciding between level 1 and level 2 — see the level selection
  table above.

## Don'ts

- Don't put markdown in `text` — the renderer escapes; markdown
  shows as literal characters.
- Don't put HTML in `text` — same reason. Plain text only.
- Don't use level 1 on a `content` slide. The level-1 / level-2
  hierarchy is what gives the deck rhythm; a level-1 on every slide
  flattens the rhythm.
- Don't use multiple headings on one slide. The standard pattern is
  ONE heading per slide; multiple headings break the assertion-
  evidence model (which heading IS the slide's claim?).

## Assertion-evidence rule

Every heading runs through `validateHeadline()`. The rule:

1. At least `MIN_HEADLINE_WORDS = 5` words.
2. EITHER a verb signal (matched against `VERB_SIGNALS` array) OR a
   digit anywhere (a stat headline reads as a claim by construction).

Verb signals (excerpt from the literal array in `amvcp-slide.js`):

```
is, are, was, were, has, have, had, do, does, did, will,
shows, show, drives, drive, cuts, cut, grew, grow, rose, rise,
fell, fall, dropped, drop, beats, beat, wins, win, lost, lose,
gains, gain, saves, save, makes, make, lets, let, turns, turn,
means, mean, gives, give, needs, need, reached, reach, shipped, ship,
matters, matter, now, every, each
```

Plus a morphology check: words ending in `-ed`, `-ing`, or `-s` (but
not `-ss` / `-us` / `-is`) count as a verb signal (rough finite-verb
tell).

Pass examples:
- "Latency dropped 38%." → digit + verb ("dropped")
- "Three changes shipped in Q3." → digit + verb ("shipped")
- "Every p99 path now clears 200 ms." → digit + verb ("clears")
- "Caching the right keys beats caching more keys." → verb ("beats")

Fail examples:
- "Q3 Results" → 2 words.
- "The New Architecture" → 3 words.
- "Latency Improvements" → 2 words, no verb.
- "Engineering Roadmap" → 2 words, no verb.
- "The Architecture Of Our New Caching System" → 7 words, NO verb,
  NO digit. Reads as a noun phrase.

Fix the failures by rewriting as declarative sentences:
- "Q3 Results" → "Three of four Q3 goals shipped on time."
- "The Architecture Of Our New Caching System" → "The new caching
  system uses per-key TTL, not per-region TTL."

The validator is INTENTIONALLY a soft check — it never blocks
rendering. False positives (a legitimate label that the verb
heuristic missed) are acceptable; the warning is informational, not
a gate.

## Visual verification

After authoring an eyebrow + heading pair, capture light + dark at
1280×720 via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. The eyebrow is in the accent colour, mono, uppercase, tracked.
2. The heading is in the heading typeface (serif by default), bold.
3. The heading wraps to AT MOST 3 lines at its tier size.
4. Console reports zero `data-vsd-headline-warn` warnings (or the
   warnings are acknowledged as intentional).
5. The eyebrow-to-heading gap is `--vc-space-3` (24 px).

## Source provenance

- The "eyebrow + heading" pair is the converged title structure
  from five catalogue sources.
- `validateHeadline()` implements SL-09 (Assertion-Evidence
  principle) as a soft check.
- Level-1 vs level-2 split is the typography scale convention
  from `slide-patterns.md` lines 87-129.
