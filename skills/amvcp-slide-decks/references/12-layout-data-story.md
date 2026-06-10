# 12 — Layout: `data-story` (chart + headline + annotation)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Authoring rules — chart type by job](#authoring-rules--chart-type-by-job)
- [Visual verification](#visual-verification)
- [Anti-patterns for data-story slides](#anti-patterns-for-data-story-slides)
- [Source provenance](#source-provenance)

The data-story is the slide that lets a chart drive the argument. ONE
chart, one annotation pointing at the chart's important moment, one
headline that names the finding the chart shows. The annotation is
critical — a chart without annotation is a chart; a chart WITH
annotation is a story.

The data-story embodies the rule: "every chart on a slide is a finding,
not a status report". If the audience has to look at the chart to figure
out what it's saying, the slide failed. The headline says what it's
saying; the chart is the evidence.

## What this is

`layout: "data-story"` builds a slide with:

- One required `heading` block (the finding — what the chart shows).
- One required `chart` block (delegated to `window.amvcpChart`).
- One required `text` or `callout` block (the annotation — what to
  notice in the chart).

The renderer applies `vsd-layout-data-story` to the section; the layout
CSS reserves the top ~25% for the heading + annotation and the bottom
~75% for the chart.

## Scaffold to emit

Basic:

```jsonc
{ "layout": "data-story",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Cache hit rate climbed from 41% to 78% in three weeks." },
    { "type": "chart",
      "chartType": "line",
      "data": {
        "labels": ["Apr 22","Apr 29","May 6","May 13","May 20"],
        "datasets": [
          { "label": "Cache hit %",
            "data": [41, 48, 62, 71, 78] }
        ] } },
    { "type": "callout", "variant": "info",
      "text": "The jump on May 6 corresponds to the per-key TTL rollout." }
  ]
}
```

With a bar chart:

```jsonc
{ "layout": "data-story",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "p99 latency cut by 38% across all paths." },
    { "type": "chart",
      "chartType": "bar",
      "data": {
        "labels": ["/search","/read","/write","/delete"],
        "datasets": [
          { "label": "Q2 p99 (ms)", "data": [540, 410, 220, 180] },
          { "label": "Q3 p99 (ms)", "data": [335, 290, 180, 175] }
        ] } },
    { "type": "text",
      "text": "Write and delete saw smaller wins because they don't hit the cache." }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path.
- `renderBlock(doc, block, ctx)` — renders the heading + delegates the
  `chart` block.
- `renderDelegated(doc, block, "chart")` — calls
  `window.amvcpChart.renderInto(host, {chartType, data})`. Throws with
  a clear "amvcp-chart.js not loaded" error if the sibling module is
  missing.

## DESIGN.md tokens used

| Token | Default | What it themes on data-story |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Heading + annotation text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Chart accent (the chart module reads this). |
| `--vc-color-accent-2` | `#788C5D` / `#d4a73a` | Second-series chart colour. |
| `--vc-color-callout-info-bg` | `#f0f5fc` / `#1a2a3e` | Annotation callout background. |
| `--vc-text-4` | `64 px` | Heading size. |
| `--vc-text-2` | `28 px` | Annotation text size. |
| `--vc-space-4` | `40 px` | Heading-to-chart gap. |

The chart's typography (axis labels, legend) themes via the chart
module's own DESIGN.md token contract — see the `amvcp-charts-and-
dashboards` skill for that layer.

## Selection / comment / decision-mini contract notes

The data-story slide is one selectable atom. The chart inside is
rendered by the delegated `amvcp-chart.js` module, which MAY stamp
its own `data-ve-id` on its container — that's the chart layer's
business, not the slide layer's. The reviewer's comment on a
data-story is typically about the FINDING (the heading), not about
the chart's rendering.

## When to use this reference

Open this ref when:

- A finding is best shown as a chart — the data has a shape (trend,
  contrast, distribution) that text can't carry.
- The chart needs a one-line "look at THIS" annotation pointing at a
  specific moment in the data (the May 6 jump, the third-quartile
  outlier, the crossover point).
- The argument is "this number changed and HERE is why" — the chart
  is the evidence, the annotation is the causal explanation.

## Don'ts

- Don't put a chart on a data-story without an annotation. The
  annotation is what makes it a *story*; without it the chart is a
  status report.
- Don't put two charts on one data-story. Two charts = two findings
  = two slides. The 1-chart-per-slide rule is the whole point of the
  layout.
- Don't write a label-style heading ("Cache hit rate"). The chart's
  axis label says that. The heading says the FINDING ("Cache hit
  rate climbed from 41% to 78%").
- Don't pick a chart type that doesn't fit the finding. Line for
  trends; bar for comparisons; donut for parts-of-whole; scatter for
  correlations. The chart type IS the finding's shape.

## Authoring rules — chart type by job

| Finding shape | Chart type |
|---|---|
| Trend over time | `line` |
| Comparison between categories | `bar` |
| Parts of a whole | `donut` (or `pie` for ≤4 slices) |
| Correlation between two variables | `scatter` |
| Distribution of a single variable | `histogram` |
| Ranked list | `bar` (horizontal) |
| Two-axis comparison | `bar` (grouped) or `line` (with two series) |

The slide module doesn't pick the chart type — the agent does, via the
`chartType` key. Pick by the finding's shape; the table above is the
mapping.

## Visual verification

After authoring a data-story slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top (~25% of the stage); the chart
   dominates the bottom (~70%); the annotation sits in the remaining
   ~5%.
2. The chart's axes are labelled (the chart module's responsibility,
   but verify).
3. The annotation references something visible in the chart (the May 6
   jump, the highest bar, etc.).
4. The chart palette matches the deck's accent (the chart module
   reads `--vc-color-accent`).
5. Console reports zero "amvcp-chart.js not loaded" errors.

## Anti-patterns for data-story slides

### Multi-chart "dashboard" on a data-story

A data-story slide is ONE chart. Putting 4 small charts on one
slide is a dashboard — that's `bento` + `grid: "stats"` territory,
not data-story. The audience can't focus on 4 charts at projection
distance; they tune out.

### "Q3 Cache Hit Rate" headline

The chart already labels itself. The heading should be the FINDING:
"Cache hit rate climbed from 41% to 78% in three weeks." The chart
shows the climb; the heading names what the climb means.

### Annotation that doesn't point at the chart

Bad: "The cache rewrite was effective." (vague — doesn't point at
the chart).
Good: "The jump on May 6 corresponds to the per-key TTL rollout."
(points at a specific moment in the chart).

The annotation's job is to direct the eye to the ONE thing in the
chart the audience should notice.

## Source provenance

- SL-04 — Folio "Data Story" pattern (chart + annotation).
- SL-09 — Assertion-Evidence headline rule applied here as "the
  heading IS the finding the chart shows".
- The chart type by finding shape mapping comes from CH-12 (McKinsey
  chart types) in the chart classification, lifted as the data-story
  authoring rule.
- The "one chart, one annotation, one finding" rule is the data-
  story design discipline documented in DM-19 (Anti-Slop Visual
  Gates).
