# 39 — Aspect ratios deep dive (16:9 / 4:3 / 3:2 — when to pick which)

The slide module supports three deck-level aspect ratios. This
reference is the deep guide on when to pick each, what the
implications are, and how to author content that fits.

## What this is

`aspect` is a deck-level field; one aspect governs the entire deck.
The three options:

| `aspect` | Stage pixels | Aspect ratio | When to pick |
|---|---|---|---|
| `"16:9"` (default) | 1920×1080 | 1.778 | Default. Modern projectors, laptops, monitors, streaming, video conferencing. |
| `"4:3"` | 1280×960 | 1.333 | Legacy projectors, academic / lecture-hall A/V, older corporate displays. |
| `"3:2"` | 1620×1080 | 1.500 | Print cross-over (A4 landscape is ~1.414; 3:2 is closer than 16:9). Books / handouts. |

## Why 16:9 is the default

The 16:9 aspect matches:
- Every modern laptop (since ~2009).
- Every external monitor sold after ~2012.
- HD / 4K projectors.
- YouTube embedded videos.
- Zoom / Teams / Google Meet screenshare.

Picking anything else "by default" is wrong for 95% of decks.
The other two aspects are for SPECIFIC SCENARIOS.

## When 4:3 is correct

| Scenario | Why 4:3 |
|---|---|
| Academic lecture hall with a legacy projector | Many academic projectors are 4:3 native; a 16:9 deck letterboxes (wastes height). |
| University-mandated template | Some universities mandate 4:3 for accessibility / archive compatibility. |
| Corporate template (old) | Older corporate templates are 4:3. |
| Print handout that mirrors the slides | 4:3 is closer to letter paper portrait (`8.5 × 11` = `0.77`; flipped landscape = `1.30`, close to 4:3's 1.33). |

For these scenarios, `aspect: "4:3"` is correct. The stage becomes
1280×960 — slightly narrower than 16:9 by the same height.

## When 3:2 is correct

| Scenario | Why 3:2 |
|---|---|
| Conference book / handout | A4 landscape is 297×210 (1.414); 3:2 (1.5) is closer than 16:9 (1.778). |
| Slide-to-print conversion | When the deck is going to be printed at A4 landscape, 3:2 wastes less paper. |
| Photography portfolio | Print photographs are commonly 3:2 (35mm legacy). |
| Tablet-first display | Some tablets (iPad Pro) are closer to 3:2 than 16:9. |

For these, `aspect: "3:2"` gives 1620×1080 — wider than 4:3 but
narrower than 16:9.

## What changes per aspect

Picking aspect changes ONLY the stage's pixel dimensions. All other
behaviour stays identical:

- The 16-layout catalog works the same on all 3 aspects.
- The block types render the same.
- The typography scale (`--vc-text-N`) is the same.
- The space ladder (`--vc-space-N`) is the same.
- The DESIGN.md token contract is the same.

What changes is the LAYOUT EFFICIENCY — some layouts fit better in
some aspects than others.

## Layout efficiency by aspect

| Layout | 16:9 | 4:3 | 3:2 |
|---|---|---|---|
| `manifesto` | ✓ (centred display) | ✓ | ✓ |
| `section-divider` | ✓ (large numeral) | ✓ | ✓ |
| `statement` | ✓ | ✓ | ✓ |
| `content` | ✓ (3fr/2fr asymmetric) | ⚠ (narrower; bullets crowd) | ✓ |
| `two-column` | ✓ (2fr/2fr split) | ⚠ (squeezed columns) | ✓ |
| `comparison` | ✓ (left/right) | ⚠ (squeezed panes) | ✓ |
| `quadrant` | ⚠ (wide; quadrants are wide) | ✓ (square; balanced quadrants) | ✓ |
| `data-story` | ✓ | ✓ | ✓ |
| `metrics` | ✓ (wide row) | ⚠ (3-4 metrics; 5+ crowds) | ✓ |
| `timeline` | ✓ (wide horizontal) | ⚠ (3-4 events; 5+ wraps) | ✓ |
| `bento` | ✓ (wide grids) | ⚠ (square grids preferred) | ✓ |
| `stack` | ✓ | ✓ (square fits vertical stacks) | ✓ |
| `full-bleed` | ✓ (cinematic) | ✓ (more vertical info) | ✓ |
| `quote` | ✓ (wide canvas) | ✓ | ✓ |
| `code-focus` | ✓ (wide code lines fit) | ⚠ (lines wrap; shorter snippets only) | ✓ |
| `closing` | ✓ | ✓ | ✓ |

The ⚠ marks where the aspect is suboptimal but still works. Avoid
combining ⚠ layouts in a 4:3 deck — favour the ✓ ones.

## Scaffold to emit

Declare aspect at the deck level:

```jsonc
{
  "kind": "deck",
  "title": "Lecture 7 — Distributed Caching",
  "aspect": "4:3",        // <-- academic context
  "fit": "letterbox",
  "slides": [ ... ]
}
```

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",
  "aspect": "16:9",       // <-- modern projector / Zoom
  "fit": "letterbox",
  "slides": [ ... ]
}
```

```jsonc
{
  "kind": "deck",
  "title": "Conference Workshop — Cache Internals",
  "aspect": "3:2",        // <-- prints to A4 efficiently
  "fit": "letterbox",
  "slides": [ ... ]
}
```

## Mixing aspects — DON'T

The slide module enforces ONE aspect per deck (the stage size is per-
deck). If a project needs a slide at a different aspect from the
rest (e.g. a portrait infographic in the middle of a 16:9 deck), the
correct path is:

1. Emit the main deck at the primary aspect (e.g. 16:9).
2. Emit the portrait insert as a SEPARATE deck file (or a `poster`).
3. Link from the main deck to the portrait insert (or open it in a
   new window).

This is rare; 95% of decks are one consistent aspect.

## Lib functions called

- `parseDeck(input)` — validates `aspect` against `ASPECTS` keys
  (`"16:9"`, `"4:3"`, `"3:2"`). Throws on unknown.
- `renderDeck(deck, mountEl)` — reads `ASPECTS[deck.aspect]` for
  the stage width × height; stamps them on the `.vsd-stage` inline
  style.
- `fitStage(viewport)` — computes the scale based on the stage's
  natural dimensions; the scale math is aspect-agnostic.

## DESIGN.md tokens used

None directly — the aspect is a structural choice, not a theming
one. The same DESIGN.md themes any aspect.

## Selection / comment / decision-mini contract notes

Aspect doesn't affect the selection / comment / decision-mini
contract. The slide is the atom regardless of aspect.

## When to use this reference

Open this ref when:

- Picking an aspect for a new deck.
- A deck looks cramped — verify the aspect matches the layouts
  used (check the layout-efficiency table).
- A user asks about printing to A4 — 3:2 wastes less paper than
  16:9.
- A user asks about a legacy lecture-hall projector — 4:3 native.

## Don'ts

- Don't pick aspect "to look different". Aspect serves the
  display medium; picking 4:3 on a 16:9 monitor looks wrong.
- Don't mix aspects per slide. The stage is per-deck; per-slide
  aspect is not supported.
- Don't author layouts that depend on aspect-specific space.
  The layouts work across all 3 aspects; depending on "the
  manifesto has enough horizontal room because I'm on 16:9" is
  fragile.
- Don't override the stage dimensions in CSS. The renderer sets
  them from `ASPECTS[aspect]`; overriding via CSS de-syncs the
  stage from the scale math, breaking the letterbox.

## Visual verification

After picking an aspect, capture light + dark at the NATIVE stage
size via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

- 16:9 → 1920×1080.
- 4:3 → 1280×960.
- 3:2 → 1620×1080.

Then capture at a typical viewer size (1280×720) and verify the
letterbox bars are proportional (top/bottom for 16:9, left/right
for 4:3 / 3:2).

## Source provenance

- The 3-aspect support (16:9 / 4:3 / 3:2) is the slide module's
  `ASPECTS` map at the top of `amvcp-slide.js`.
- The 1920×1080 / 1280×960 / 1620×1080 stage sizes are the
  canonical "rounded to nice powers" values per aspect.
- The layout-efficiency table is the consolidated layout-aspect
  fit guidance derived from testing the 16 layouts across the 3
  aspects.
- The "one aspect per deck" rule is the slide module's per-deck
  stage-size design constraint.
