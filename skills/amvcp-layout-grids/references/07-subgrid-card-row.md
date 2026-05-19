# 07 — Subgrid card row (titles / bodies / footers align across the row)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The HARD contract on card internal markup](#the-hard-contract-on-card-internal-markup)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this row vs the auto-fill card grid (ref 11)](#when-to-use-this-row-vs-the-auto-fill-card-grid-ref-11)
- [Why subgrid, not `display:flex; flex-direction:column`](#why-subgrid-not-displayflex-flex-directioncolumn)
- [Visual verification](#visual-verification)

A row of cards where the titles, bodies, and footers align to a
shared baseline across cards, even when one title wraps onto two
lines while another is a single line. CSS subgrid was the missing
piece that made this possible without JS measurement; it has
universal browser support since 2024, so the layout technique uses
it unapologetically.

## What this is

The `.la-cardrow` is an `auto-fit` grid of card columns. Each
`.la-card` is a 3-row SUBGRID — its three internal rows (title,
body, footer) participate in the parent grid's row sizing. The
result: the title row of all cards is the height of the tallest
title; the body row of all cards is the height of the tallest body;
the footer row of all cards is the height of the tallest footer.
Cards align vertically AND across the row, with no JS.

Without subgrid, the same effect required either:
- Hardcoding card heights (broken under variable content)
- A JS measurement pass on render (slow and flicker-prone)
- Forcing every title to one line via `white-space: nowrap`
  (truncates legitimate content)

Subgrid is the right primitive. It has been Baseline-newly-available
since 2024 in Chrome / Edge / Safari / Firefox, so no `@supports`
fallback ships in `amvcp-layout.css`.

## Scaffold to emit

```html
<div class="la-cardrow" data-ve-id="cardrow" data-ve-type="region">
  <article class="la-card" data-ve-id="card-revenue" data-ve-type="card">
    <h3 class="la-card__title">Revenue</h3>
    <div class="la-card__body">
      <span class="vc-metric-value">$4.2M</span>
      <span class="vc-metric-trend">+12% QoQ</span>
    </div>
    <footer class="la-card__footer">Updated 2 hours ago</footer>
  </article>

  <article class="la-card" data-ve-id="card-users" data-ve-type="card">
    <h3 class="la-card__title">Monthly active users (US + EU only)</h3>
    <div class="la-card__body">
      <span class="vc-metric-value">847K</span>
    </div>
    <footer class="la-card__footer">Through 2026-05-15</footer>
  </article>

  <article class="la-card" data-ve-id="card-uptime" data-ve-type="card">
    <h3 class="la-card__title">Uptime</h3>
    <div class="la-card__body">
      <span class="vc-metric-value">99.97%</span>
      <span class="vc-metric-trend">30-day rolling</span>
    </div>
    <footer class="la-card__footer">SLO target: 99.95%</footer>
  </article>
</div>
```

The three cards above have titles of different lengths ("Revenue"
vs "Monthly active users (US + EU only)") — without subgrid the
revenue card's body would start higher than the users card's body
and the row would look broken. WITH subgrid, the title row sizes to
the tallest title; both bodies and both footers start at the same
y-coordinate.

The CSS ships in `amvcp-layout.css`:

```css
.la-cardrow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  grid-auto-rows: auto;
  gap: var(--la-gap);
}
.la-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  gap: var(--la-gap-sm);
  padding: var(--la-gap);
  background: var(--vc-color-surface, #ffffff);
  color: var(--vc-color-content, #1f1a14);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-lg, 12px);
}
```

The `grid-row: span 3` and `grid-template-rows: subgrid` together
say "this card takes 3 rows of its parent's grid, and uses the
parent's rows as its own". The parent's row sizing is implicit
(`grid-auto-rows: auto`) — so the parent gets one auto-sized row per
shape, which is exactly what the card needs.

## The HARD contract on card internal markup

A `.la-card` MUST have EXACTLY three children:
1. `.la-card__title` (a heading)
2. `.la-card__body` (the main content)
3. `.la-card__footer` (a footer)

Anything else breaks the subgrid alignment because `grid-row: span 3`
depends on exactly 3 elements. If a card needs more rows
(e.g. "title + metric + body + chart + footer"), either:

- Group the extra elements inside `.la-card__body` (the body is a
  free-form container; nest anything you want there).
- Change `grid-row: span N` to match the new shape (e.g. `span 5`),
  AND apply that to EVERY card in the row, AND update
  `grid-template-rows` accordingly. This requires a custom modifier
  class — do not modify the base `.la-card`.

The 3-row contract is what makes subgrid work; flexibility is
inside `.la-card__body`.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="card"`
  on every `.la-card`. The card becomes a selectable atom; the
  reviewer can comment on the card as a whole. See ref 33.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | card-row gap, card padding |
| `--la-gap-sm` | 8px | card internal gap (between title / body / footer) |
| `--vc-color-surface` | (theme) | card background |
| `--vc-color-content` | (theme) | card text |
| `--vc-color-border` | (theme) | card border |
| `--vc-radius-lg` | 12px | card corner radius |

## Selection / comment / decision-mini contract notes

Each `.la-card` is a selectable atom (`data-ve-type="card"`). The
runtime's universal selection model treats it as a single commentable
unit — clicking the card's left-edge bubble handle opens a comment
thread keyed by the card's `data-ve-id`.

The 3-segment decision-mini pill (✘ ﹅ ✔︎) attaches per-card via
`_attachDecisionMiniSafe()` in `amvcp-layout.js`. A reviewer can:
- **Skip** the card (don't include in the report)
- **Approve** the card as-is
- **Deny** the card (change is required before approval)

The text inside the card (the title, the body paragraph, the
footer) is independently selectable via the runtime's standard
text-snippet selection (drag-select → snippet handle), so a reviewer
can comment on a specific phrase inside the body without committing
to a whole-card decision.

## When to use this row vs the auto-fill card grid (ref 11)

Use `.la-cardrow` (this one) when:
- All cards have the same 3-row title/body/footer shape AND
- Visual alignment of those rows across cards is important.

Use the auto-fill card grid (ref 11) when:
- Cards have varying shapes (some have charts, some don't, some
  have an image header, some don't).
- The card heights naturally vary and the row alignment is not
  important.

## Why subgrid, not `display:flex; flex-direction:column`

A flex column inside each card aligns the items WITHIN that card,
but does NOT align them across cards. A flex column does not see
its siblings' layout. The only way to align across cards is shared
row sizing — which is exactly what subgrid is for. Flex is the
wrong primitive here.

## Visual verification

Run the universal self-debug checklist before claiming the subgrid
alignment works — see `skills/amvcp-self-debug-rules/SKILL.md`.

For subgrid card-row correctness specifically:

- Open dev-browser. Find the top-y of each card's title, body, and
  footer:
  ```js
  const cards = document.querySelectorAll('.la-card');
  cards.forEach((c, i) => {
    const title = c.querySelector('.la-card__title');
    const body = c.querySelector('.la-card__body');
    const footer = c.querySelector('.la-card__footer');
    console.log(`card ${i}:`,
      'title=', title.getBoundingClientRect().top,
      'body=', body.getBoundingClientRect().top,
      'footer=', footer.getBoundingClientRect().top);
  });
  ```
  All cards' title-top values MUST be equal (within 1px); same for
  body-top and footer-top. If they differ, subgrid is not active —
  check the browser support, check the `grid-template-rows: subgrid`
  declaration is intact.
- Make one card's title wrap to two lines (longer text); verify
  the OTHER cards' bodies push down to align. The body-top should
  still be equal across all cards.
- **R1 — Light + dark themes**: switch themes; cards must look
  consistent in both.
- **R2 — No nested scrollbars**: a card with too-tall content
  must NOT introduce an inner scrollbar. If the content is too
  tall, the card height grows; the card-row grid is `auto-rows`
  so this just makes that row taller for all cards.
