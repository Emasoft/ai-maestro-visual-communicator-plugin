# Stat card row — `.warn` modifier for "the one bad stat"

A horizontal row of stat-cards (Big Number + small label + delta)
with one card flagged via a `.warn` left-border modifier. The
pattern lets the author surface "this metric needs attention"
without breaking the symmetric grid.

## Table of contents

- [The shape](#the-shape)
- [Why a row, not a grid](#why-a-row-not-a-grid)
- [The `.warn` modifier — left-border + extra padding](#the-warn-modifier--left-border--extra-padding)
- [Card anatomy — number + label + delta](#card-anatomy--number--label--delta)
- [Delta typography — small, signed, muted unless emphasized](#delta-typography--small-signed-muted-unless-emphasized)
- [`.warn` vs `.good` — only flag exceptions](#warn-vs-good--only-flag-exceptions)
- [Wrapping on narrow viewports](#wrapping-on-narrow-viewports)
- [Sample — weekly status report header](#sample--weekly-status-report-header)
- [Sample — implementation plan summary band](#sample--implementation-plan-summary-band)
- [Relationship to the mini-table](#relationship-to-the-mini-table)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The shape

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  14          │  6           │  1   ◄──     │  3           │
│  PRs merged  │  Deploys     │  Incidents   │  Flaky tests │
│  +3 vs wk10  │  ±0          │  SEV-2 47m   │  fixed       │
└──────────────┴──────────────┴──────────────┴──────────────┘
                            ↑
                  clay left-border (warn)
```

4 cards in a horizontal row. Each card carries:
1. **Big number** (top, large type)
2. **Label** (middle, body type)
3. **Delta or context** (bottom, small mono type)

One card has the `.warn` class — a 3-pixel accent border on its
left edge, slightly wider padding, otherwise the same shape. The
reader's eye lands on it.

The pattern is from `11-status-report` in the HTML-effectiveness
catalog. The brief: "give the reader 4 key numbers at the top of a
report; flag the one bad one without breaking the row symmetry".

## Why a row, not a grid

A 2×2 grid of 4 cards would also work. The row is preferred when:
- The cards represent a single time window's worth of stats
  (this week, this release, this incident).
- The reader is expected to scan horizontally, NOT compare
  vertically.
- The page is wide enough to fit 4 cards on one row (usually >800px).

For 6+ stats or a narrow page, the row wraps to 2-card and 3-card
rows — keep the visual rhythm by ensuring each card's "big number"
is the same vertical position.

## The `.warn` modifier — left-border + extra padding

```css
.stat-card {
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  padding: 16px;
  background: var(--vc-color-surface, #ffffff);
}
.stat-card.warn {
  border-left: 3px solid var(--vc-color-danger, #D97757);
  padding-left: 20px;       /* 16 + 3 + 1 — keep the inner content aligned */
}
```

The `.warn` modifier:
- Replaces the 1px border on the left with a 3px accent border.
- Adds 4px of extra left padding so the content does NOT shift
  relative to other cards (the 3px border + 1px adjustment moves
  the original 16px padding's inner edge by exactly 4px outward).

The visual: a vertical accent stripe on the left of the warn card.
The card's body content sits at the same horizontal position as
the body of every other card — only the border decoration changes.

## Card anatomy — number + label + delta

```html
<div class="stat-card warn">
  <div class="num">1</div>
  <div class="label">Incidents</div>
  <div class="delta">SEV-2 47m</div>
</div>
```

Three children: `.num`, `.label`, `.delta`. The CSS:

```css
.stat-card .num {
  font-size: 2em;
  font-weight: 700;
  line-height: 1;
  color: var(--vc-color-content, #1f1a14);
  font-variant-numeric: tabular-nums;
}
.stat-card .label {
  margin-top: 4px;
  font-size: 1em;
  color: var(--vc-color-content, #1f1a14);
}
.stat-card .delta {
  margin-top: 6px;
  font-size: 0.85em;
  font-family: var(--vc-font-mono, monospace);
  color: var(--vc-color-content-muted, #5b5343);
}
```

The hierarchy: number is the biggest element (the reader's eye
lands on it); label is secondary (1em body type); delta is tertiary
(small mono in muted color).

For a warn card, an alternative is to color the .num itself in
`--vc-color-danger` — but the left-border alone is usually enough,
and recoloring the number can read as "this number IS the danger
color", which is a different signal.

## Delta typography — small, signed, muted unless emphasized

The delta cell carries metadata: `+3 vs wk10`, `±0`, `SEV-2 47m`,
`fixed`. Conventions:

| Format | Meaning |
|---|---|
| `+N vs <baseline>` | week-over-week change, positive |
| `−N vs <baseline>` | week-over-week change, negative (en dash, not hyphen-minus) |
| `±0` or `flat` | no change |
| `<category> <count>` | non-numeric context (e.g. `SEV-2 47m`) |
| `<status>` | one-word context (e.g. `done`, `green`) |

For monetary deltas: `+$240`, `−$1.2k` (the dollar sign before the
number, the en dash before the sign). For percent: `+12%`, `−3.4%`.

To EMPHASIZE a delta (e.g. a particularly good positive change),
add a `.delta-good` modifier:

```css
.stat-card .delta.delta-good { color: var(--vc-color-success); }
.stat-card .delta.delta-bad  { color: var(--vc-color-danger);  }
```

Use sparingly — coloring every delta drowns the signal.

## `.warn` vs `.good` — only flag exceptions

A row of 4 cards, 4 of them `.good`, defeats the modifier's purpose
(it should single out the exception, not be applied to all). The
canonical use: 0 or 1 `.warn` per row, rarely 2.

If multiple cards need attention, the report's HEADER is the wrong
place to convey it — escalate to a "Things needing attention"
section below the stat row with prose explaining each.

## Wrapping on narrow viewports

```css
.stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.stat-card {
  flex: 1 1 180px;        /* shrink to 180px, grow to fill */
  min-width: 180px;
}
```

On a wide viewport: 4 cards in a row. On a narrow viewport: cards
wrap to 2-card rows (or 1-card column). The `.warn` left-border
stays consistent across breakpoints — the reader still sees the
exception card.

The `flex: 1 1 180px` lets cards grow to fill available space when
fewer than 4 fit on a row; they always stay at least 180px wide.

## Sample — weekly status report header

```html
<div class="stat-row">
  <div class="stat-card">
    <div class="num">14</div>
    <div class="label">PRs merged</div>
    <div class="delta">+3 vs wk10</div>
  </div>
  <div class="stat-card">
    <div class="num">6</div>
    <div class="label">Deploys</div>
    <div class="delta">±0</div>
  </div>
  <div class="stat-card warn">
    <div class="num">1</div>
    <div class="label">Incidents</div>
    <div class="delta">SEV-2 47m</div>
  </div>
  <div class="stat-card">
    <div class="num">3</div>
    <div class="label">Flaky tests fixed</div>
    <div class="delta">suite now 99.1%</div>
  </div>
</div>
```

The reader's eye lands on the Incidents card (3rd from left) thanks
to the left-border accent. The bottom-line numbers tell the
week's story; the warn modifier surfaces "this is the one thing to
discuss".

## Sample — implementation plan summary band

```html
<div class="stat-row">
  <div class="stat-card">
    <div class="num">~2</div>
    <div class="label">Weeks of effort</div>
    <div class="delta">2 engineers</div>
  </div>
  <div class="stat-card">
    <div class="num">3</div>
    <div class="label">Packages touched</div>
    <div class="delta">api / web / docs</div>
  </div>
  <div class="stat-card">
    <div class="num">2</div>
    <div class="label">New tables</div>
    <div class="delta">comments, threads</div>
  </div>
  <div class="stat-card">
    <div class="num">1</div>
    <div class="label">Feature flag</div>
    <div class="delta">task_comments_v1</div>
  </div>
</div>
```

A summary band at the top of an implementation plan (from
`16-implementation-plan`). No warn — every card is informational,
no exception to flag.

## Relationship to the mini-table

The stat-card row and the [mini-table](./impact-mini-table.md) are
related shapes for related data:

| Stat card row | Mini-table |
|---|---|
| Horizontal, 3–5 cards | Vertical, 3–8 rows |
| Big numbers, big visual weight | Small numbers, low visual weight |
| Sits at top of report (banner) | Sits inside a section |
| 1 `.warn` per row max | No warn (the panel is uniform) |

A report often uses BOTH: a stat-card row at the top to anchor the
high-level numbers, and a mini-table inside each section for the
detailed numbers in that section's scope.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-surface` | card background |
| `--vc-color-border` | card 1px border |
| `--vc-color-danger` | `.warn` left-border accent |
| `--vc-color-success` | optional `.delta-good` color |
| `--vc-color-content` | number + label color |
| `--vc-color-content-muted` | delta color |
| `--vc-radius-md` | card border-radius |
| `--vc-font-mono` | delta font family |

A theme toggle re-paints every card. The warn accent flips between
light-theme dark clay (`#a84a32`) and dark-theme bright clay
(`#ff8a6e`); the exception still reads as exceptional.

## Selection / comment / decision-mini notes

A stat card row is OUTSIDE the `<table>` system — there's no
`<tr>`, no `<td>`. Each card can opt into the runtime's atom
contract by carrying `data-ve-id`:

```html
<div class="stat-card warn" data-ve-id="stat-incidents">
  ...
</div>
```

Then the card becomes a selectable atom — the reader can comment
on "the Incidents stat" or attach a decision-mini pill.

Without `data-ve-id`, the card is presentational content; no
contract attaches. Most reports use the `data-ve-id` opt-in so the
cards are first-class selectable atoms.
