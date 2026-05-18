# 01 — Spatial token ladder (the 8px-grid foundation)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [Why this is a HARD rule](#why-this-is-a-hard-rule)
- [When to use this reference](#when-to-use-this-reference)
- [Visual verification](#visual-verification)
- [The 8px-grid rationale](#the-8px-grid-rationale)
- [Variant scales and when to use them](#variant-scales-and-when-to-use-them)
- [Cross-system consistency](#cross-system-consistency)

The single most important contract in the layout technique: every length
the layout CSS emits is a `var(--vc-space-N)` reference, not a hardcoded
pixel value. The DESIGN.md engine (`amvcp-designmd.js`) owns the indexed
`--vc-space-1 … --vc-space-7` scale; the layout technique only consumes
it. Hot-swapping the DESIGN.md `spacing.scale` array re-flows every
layout on the page in the same frame, with zero per-component code.

## What this is

The 8px base grid is the rhythm every other layout primitive snaps to.
`--vc-space-1 = 4px` is the half-step (a tighter row inside a card,
the gap between an icon and its label); `--vc-space-3 = 16px` is the
base layout gap (the gap between grid columns, the gap between stacked
text blocks); `--vc-space-7 = 64px` is the x-large gap (the padding-block
of a measured article). Every length in `amvcp-layout.css` is one of
those eight tokens or a layout-local alias of one (`--la-gap`, `--la-gap-lg`,
`--la-gutter`, see ref 02).

The recommended ladder is `[4, 8, 12, 16, 24, 32, 48, 64]` — 4px plus a
canonical 8px-grid sequence. The DESIGN.md frontmatter declares it:

```yaml
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
```

The engine emits one indexed token per slot: `--vc-space-1: 4px`,
`--vc-space-2: 8px`, ..., `--vc-space-7: 64px`. A second DESIGN.md with
a denser scale (e.g. `[2, 4, 8, 12, 16, 20, 28, 40]`) re-emits the same
indexed tokens at the new values and every layout re-flows on the next
paint.

## Scaffold to emit

The spatial foundation block ships at the top of `amvcp-layout.css`. A
hand-authored layout page does NOT re-emit it; it loads `amvcp-layout.css`
and the block is already there. The block is the dependency every later
group reads.

```css
/* Group 1 — Spatial foundation (already in amvcp-layout.css). */
:root {
  --la-gap-xs:  var(--vc-space-1, 4px);
  --la-gap-sm:  var(--vc-space-2, 8px);
  --la-gap:     var(--vc-space-3, 16px);
  --la-gap-lg:  var(--vc-space-5, 32px);
  --la-gap-xl:  var(--vc-space-7, 64px);
  --la-gutter:  var(--vc-space-5, 32px);
}
```

A custom layout that needs an extra non-canonical gap MUST still go
through the ladder — pick the closest `--vc-space-N`, never invent a
literal pixel. If no slot fits, the spacing ladder is wrong; the
DESIGN.md `spacing.scale` is the place to fix it (extend the array),
not the consuming CSS.

## Lib functions called

- None. The spatial token ladder is pure CSS — no JS module reads or
  writes it. The DESIGN.md engine (`amvcp-designmd.js`) is the
  producer; everything below the layout CSS is the consumer.
- The DESIGN.md hot-swap path is the only mutation: when the engine
  re-parses a fenced DESIGN.md block, it re-emits the indexed
  `--vc-space-*` tokens. Every CSS rule that reads them recomputes
  on the next paint, no further code needed.

## DESIGN.md tokens used

| Token | Default | Used by (in `amvcp-layout.css`) |
|---|---|---|
| `--vc-space-1` | 4px | `--la-gap-xs` (TOC list gap, sub-card gap) |
| `--vc-space-2` | 8px | `--la-gap-sm` (header padding-block) |
| `--vc-space-3` | 16px | `--la-gap` (base, KPI row gap, dashboard gap) |
| `--vc-space-5` | 32px | `--la-gap-lg` + `--la-gutter` (grid column gap, article side pad) |
| `--vc-space-7` | 64px | `--la-gap-xl` (article padding-block) |

`--vc-space-4` (24px) and `--vc-space-6` (48px) are reserved for
heavier-weight layouts (executive-report templates, slide presets) —
the layout technique itself does not currently consume them but the
ladder ships them so a downstream skill can.

## Selection / comment / decision-mini contract notes

The spatial foundation emits no selectable atoms — it is the rhythm
underneath every other primitive. The selection model does not stamp
`data-ve-id` on `:root`, and there is no decision-mini pill on the
spacing scale itself. The user reviews the spacing scale by opening the
DESIGN.md frontmatter and tuning `spacing.scale`; the hot-swap path
re-flows every layout, then the runtime's existing per-atom decision
pills (on cards, regions, hero, cover) carry forward — none of them
need to be rewired when the spacing changes.

If a custom DESIGN.md preset extends the array to 10 slots, the
runtime stamps the new tokens onto `:root` and the existing
`var(--vc-space-N)` references silently pick them up. No new
selectable atoms are created.

## Why this is a HARD rule

A second `--space-*` ladder declared by the layout skill (instead of an
alias over the engine's `--vc-space-*`) would create two sources of
truth: a DESIGN.md `spacing.scale` change would update one and not the
other. The result is a layout that visually drifts from the
typography / chart / table primitives that all consume the engine's
ladder. The single-source-of-truth-respecting choice is to consume the
engine token directly and alias it locally for readability.

The `4px` / `8px` / `16px` literals inside `var(--vc-space-N, 4px)` are
fallbacks — they exist ONLY so a page that failed to load the DESIGN.md
engine still renders something visible. They are never the intended
value; the engine is always authoritative.

## When to use this reference

Open this ref when:
- A custom layout needs a length that does not appear to fit any
  ladder slot — the answer is to extend the ladder, never to hardcode.
- A reviewer flags a layout for "uneven spacing" — verify every
  length is a token, find the literal and replace.
- A DESIGN.md hot-swap "doesn't update the layout" — the layout CSS
  is reading a literal (bug) instead of a token.

## Visual verification

Run the universal self-debug checklist before claiming the spatial
foundation is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.
Specifically:

- **R1 — Light + dark themes**: flip `data-ve-theme` between `light`
  and `dark` and confirm the spacing scale is identical (spacing does
  not change between themes; only colours do).
- **R2 — No nested scrollbars**: a spacing change should never
  introduce an inner scrollbar; if a wide layout child suddenly grows
  past the viewport, the `min-width: 0` on grid children may have
  been stripped — re-add it.
- The hot-swap path: open the rendered page in dev-browser, run
  `page.evaluate(() => document.querySelector('script[type="application/x-vc-design"]'))`
  to find the live DESIGN.md block, mutate its `spacing.scale` via
  JS, and confirm the layout reflows (`document.querySelector('.la-grid').getBoundingClientRect()`)
  before the next animation frame. If the layout does not reflow,
  some literal pixel value crept into the CSS — find and replace.

The pixel-floor inspection: in dev-browser, run
`getComputedStyle(document.documentElement).getPropertyValue('--vc-space-3')`
on a page with a tuned DESIGN.md. The value MUST match the
`spacing.scale[2]` entry, not the `16px` fallback.

## The 8px-grid rationale

The 8px grid is the canonical spacing system across web /
mobile / desktop UI design. Its appeal:
- 8 divides cleanly into common screen densities (8/16 = 0.5,
  8/32 = 0.25), so multiples of 8 produce sub-pixel-clean
  rendering.
- It matches the typical visual rhythm humans find pleasing —
  a 16px gap is "comfortable", a 24px gap is "comfortable +
  one notch", a 32px gap is "comfortable + two notches".
- It avoids the "1px / 2px / 3px / 5px / 7px" jitter of
  ad-hoc spacing.
- It is the convention every major design system (Bootstrap,
  Tailwind, Material, iOS HIG, Carbon) converges on.

The half-step `4px` is a useful escape valve: a single 4px
adjustment (`--la-gap-xs`) is the smallest meaningful spacing
delta. Going below (1px, 2px) produces sub-pixel rendering
inconsistencies and is rarely visually distinguishable.

## Variant scales and when to use them

| Variant | Scale | Use case |
|---|---|---|
| Default | `[4, 8, 12, 16, 24, 32, 48, 64]` | Standard web layout (the default) |
| Denser | `[2, 4, 8, 12, 16, 20, 28, 40]` | Information-dense dashboards, internal tools |
| Generous | `[6, 12, 20, 28, 40, 56, 80, 112]` | Marketing pages, hero-led landing pages |
| Editorial | `[4, 8, 16, 24, 36, 52, 76, 112]` | Long-form articles, magazine-style layouts |

Each variant is a ONE-LINE change in DESIGN.md. The layout
system reflows; the typography and component techniques follow
suit (since they also consume `--vc-space-*`).

## Cross-system consistency

The same `--vc-space-*` ladder is consumed by:
- The layout technique (this one)
- The typography technique (line-heights, paragraph spacing)
- The chart technique (margin / padding around charts)
- The table technique (cell padding)
- The diagram technique (node spacing in SVG diagrams)
- The slide technique (slide padding, content margins)
- The wireframe technique (component paddings)

Sharing one ladder means a `spacing.scale` change re-flows
EVERY visualisation type on the page coherently. A 8px-to-12px
shift propagates through the article gap, the chart axis
margin, the table cell padding, the wireframe button gap, the
slide content margin — all together, never out of sync.

This is the deep payoff of the single-source-of-truth design.
A layout-only ladder would diverge from the typography ladder
over time; consolidating them is the right architecture.
