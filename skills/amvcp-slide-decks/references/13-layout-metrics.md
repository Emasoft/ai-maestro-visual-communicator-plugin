# 13 — Layout: `metrics` (heading + KPI row)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — value column width](#authoring-rules--value-column-width)
- [Visual verification](#visual-verification)
- [Metric vs metrics-slide vs data-story](#metric-vs-metrics-slide-vs-data-story)
- [When metrics tells a story by itself](#when-metrics-tells-a-story-by-itself)
- [Source provenance](#source-provenance)

The metrics slide is the numeric impact row — 3 to 6 large numbers
across the stage, each with a one-word label, each driving the same
point. p99 latency, cache hit rate, PRs merged, deploys, incidents,
flaky tests fixed — the "by the numbers" slide that opens or closes a
status review.

This is different from `data-story`: data-story is ONE chart that drives
a finding; metrics is SEVERAL numbers that each drive a smaller finding,
all in support of the heading.

## What this is

`layout: "metrics"` builds a slide with:

- One required `heading` block (the row's theme).
- 3-6 required `metric` blocks (the KPIs).
- Zero or more non-metric blocks (rare — usually a closing text).

The renderer applies `vsd-layout-metrics` to the section and routes
through `renderMetricsSlide()` which groups all `metric` blocks into a
single `.vsd-metrics-row` flex/grid container.

A `metric` block has:

```jsonc
{ "type": "metric",
  "value": "38%",          // required — the big number (string)
  "label": "p99 cut",      // required — the small label (string)
  "delta": "−128 ms"       // optional — the trend annotation (string)
}
```

`value` is a string so the agent can author "38%", "$2.4M", "3.2×",
"24/7", or "247 PRs" — the renderer doesn't parse it as a number.

## Scaffold to emit

```jsonc
{ "layout": "metrics",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Q3 by the numbers." },
    { "type": "metric", "value": "38%", "label": "p99 latency cut", "delta": "−128 ms" },
    { "type": "metric", "value": "78%", "label": "cache hit rate",  "delta": "+37 pp" },
    { "type": "metric", "value": "14",  "label": "features shipped" },
    { "type": "metric", "value": "247", "label": "PRs merged" }
  ]
}
```

Six-metric variant:

```jsonc
{ "layout": "metrics",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Six numbers tell the Q3 story." },
    { "type": "metric", "value": "38%", "label": "p99 latency cut" },
    { "type": "metric", "value": "78%", "label": "cache hit rate" },
    { "type": "metric", "value": "14",  "label": "features shipped" },
    { "type": "metric", "value": "247", "label": "PRs merged" },
    { "type": "metric", "value": "0",   "label": "incidents" },
    { "type": "metric", "value": "12",  "label": "flaky tests fixed" }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — dispatches to
  `renderMetricsSlide()`.
- `renderMetricsSlide(doc, section, slide, ctx)` — groups all `metric`
  blocks into `.vsd-metrics-row` (CSS-grid container that auto-fits
  the row). Non-metric blocks (heading, text) get appended directly to
  the section.
- `renderBlock(doc, block, ctx)` — for each `metric` block, builds
  `.vsd-metric` with `.vsd-metric-value`, `.vsd-metric-label`, and
  optional `.vsd-metric-delta` spans.

## DESIGN.md tokens used

| Token | Default | What it themes on metrics |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Metric VALUE (the big number). |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Metric LABEL (the small text). |
| `--vc-color-success` | `#788C5D` / `#3fb950` | Positive `delta` (`+`, `↑`, `−` for "less is good"). |
| `--vc-color-danger` | `#b04a3f` / `#f85149` | Negative `delta` (`−`, `↓` when "less is bad"). |
| `--vc-font-heading` | `Georgia, serif` | Metric value typeface (display weight). |
| `--vc-font-mono` | `ui-monospace, monospace` | Metric label typeface. |
| `--vc-text-6` | `128 px` | Metric value size (hero tier). |
| `--vc-text-1` | `20 px` | Metric label size. |
| `--vc-space-5` | `32 px` | Inter-metric gap. |

The metric value uses `font-variant-numeric: tabular-nums` so digit
widths align across metrics — `247` and `038` take the same column
width, which is what makes a 3-metric row feel grid-aligned.

## Selection / comment / decision-mini contract notes

The metrics slide is one selectable atom. Individual metrics do NOT
get separate `data-ve-id`s — the slide is the comment unit. A
reviewer commenting on one metric says "the cache hit rate metric" in
the text.

## When to use this reference

Open this ref when:

- Opening a status review with the headline numbers.
- Closing a project recap with the impact summary.
- The audience needs a "here are the numbers, all at once" reference
  before the deep-dive slides.

## Don'ts

- Don't put more than 6 metrics. 7+ becomes a wall of digits at
  projection scale; the eye can't compare them. Split into two
  metrics slides if you must.
- Don't put fewer than 3 metrics. 1-2 metrics is a `manifesto` or
  `statement` slide with the number IN the heading.
- Don't put long values. The value column is sized for ~6 characters
  ("$2.4M", "247", "38%", "3.2×"). Longer strings ("store=false",
  "47,239 requests") break the layout. If it's longer, put it in the
  LABEL, not the value.
- Don't omit the label. The big number alone is ambiguous;
  `38%` could be cache hit rate or anything else.

## Authoring rules — value column width

Hero values fit 1-6 characters at 128 px on the stage. Examples that
fit:
- `38%` (3 chars) ✓
- `247` (3 chars) ✓
- `$2.4M` (5 chars) ✓
- `3.2×` (4 chars) ✓
- `24/7` (4 chars) ✓
- `0.05%` (5 chars) ✓

Examples that overflow:
- `247,000` (7 chars + comma) ✗ — use `247K`
- `+128 ms` (7 chars + space) ✗ — use `128ms` (no plus, no space)
- `12 features` (11 chars) ✗ — the "features" goes in the label
- `store=false` (11 chars) ✗ — this isn't a metric; rewrite as a
  callout

The `autoFit()` safety net in the runtime scales overflows down with
`transform: scale()` — but the scaled-down value reads as broken at
projection distance. Better to author short.

## Visual verification

After authoring a metrics slide, capture light + dark at 1280×720 via
the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top; the metrics row fills the bottom 60% of
   the stage.
2. All metric values are at hero tier (128 px); no value overflows
   its column.
3. Digits align vertically across metrics (tabular-nums).
4. Labels are in mono / uppercase / small / muted — the visual
   contrast with the values is what makes the values pop.
5. Delta values (when present) are coloured by direction (success /
   danger).

## Metric vs metrics-slide vs data-story

| Need | Pick |
|---|---|
| ONE big number | `manifesto` with the number in the heading |
| ONE big number + context label | `statement` with the number + label in the heading |
| 3-6 numbers in a row | `metrics` (this layout) |
| 1 number tied to a chart | `data-story` |
| Heterogeneous mix (numbers + cards + image) | `bento` with the `stats` grid |
| Time-series of one metric | `data-story` with `line` chart |

## When metrics tells a story by itself

A `metrics` slide can stand alone WITHOUT a data-story slide if the
metrics themselves carry the narrative:

```jsonc
{ "layout": "metrics",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Three numbers tell the Q3 story." },
    { "type": "metric", "value": "38%", "label": "p99 latency cut" },
    { "type": "metric", "value": "78%", "label": "cache hit rate" },
    { "type": "metric", "value": "0",   "label": "incidents in Q3" }
  ]
}
```

The "0 incidents" landing after "38% / 78%" tells a 3-step story:
went faster, became more efficient, didn't break — all from the
same change.

## Source provenance

- The "Dashboard / KPI cards at presentation scale" pattern from
  `slide-patterns.md` lines 822-875.
- SL-13 "Data Hero" editorial move — the giant-number slide.
- `font-variant-numeric: tabular-nums` on values is the converged
  digit-alignment trick from five catalogue sources.
- The 6-metric maximum is from SL-10's content-template specifications
  (lines 829-836 of `slide-patterns.md`).
