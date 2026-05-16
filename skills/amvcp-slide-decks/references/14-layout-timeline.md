# 14 — Layout: `timeline` (heading + horizontal sequence)

The timeline slide shows a sequence of dated events horizontally. Q1 →
Q4, day 1 → 14, milestone A → E. Each event is a card with a label, a
date, and a one-line description; the cards connect via arrows or a
running track underneath so the eye reads them in order.

This is one of the highest-impact layouts for project plans and
postmortems — the temporal axis is the argument's spine. A timeline that
says "Q1 design, Q2 prototype, Q3 ship, Q4 measure" tells the audience
exactly where in the work cycle the proposal currently sits.

## What this is

`layout: "timeline"` builds a slide with:

- One required `heading` block (the timeline's name).
- 3-7 required `metric` OR `text` blocks (the timeline events).
- Optional leading/trailing text (intro/outro narrative).

The renderer applies `vsd-layout-timeline` to the section; the layout
CSS arranges the event blocks horizontally in a flexbox row with
auto-track and arrow connectors via `::after` pseudo-elements.

Each event is best authored as a `metric` block with:
- `value` = the date or step number (e.g. `"Q1"`, `"Day 3"`, `"01"`)
- `label` = the event name (e.g. `"Design"`, `"Prototype"`)
- `delta` (optional) = a one-line description

## Scaffold to emit

Quarterly timeline:

```jsonc
{ "layout": "timeline",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "The cache rewrite shipped across four quarters." },
    { "type": "metric", "value": "Q1", "label": "Design",     "delta": "RFC merged" },
    { "type": "metric", "value": "Q2", "label": "Prototype",  "delta": "Behind feature flag" },
    { "type": "metric", "value": "Q3", "label": "Ship",       "delta": "10% rollout → 100%" },
    { "type": "metric", "value": "Q4", "label": "Measure",    "delta": "p99 cut 38%" }
  ]
}
```

Day-by-day incident timeline:

```jsonc
{ "layout": "timeline",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "Incident INC-4421 — May 6 to May 9." },
    { "type": "metric", "value": "May 6 14:02", "label": "Detection", "delta": "Pager fires" },
    { "type": "metric", "value": "May 6 14:18", "label": "Diagnosis", "delta": "Cache eviction loop" },
    { "type": "metric", "value": "May 6 14:35", "label": "Mitigation","delta": "Flag rollback" },
    { "type": "metric", "value": "May 7 09:00", "label": "Root cause","delta": "PR #4218 review" },
    { "type": "metric", "value": "May 9 16:00", "label": "Postmortem","delta": "Published + signed" }
  ]
}
```

Build-step timeline (text-based):

```jsonc
{ "layout": "timeline",
  "blocks": [
    { "type": "heading", "level": 2,
      "text": "The build pipeline runs in five stages." },
    { "type": "text", "text": "01 — Lint" },
    { "type": "text", "text": "02 — Type check" },
    { "type": "text", "text": "03 — Test" },
    { "type": "text", "text": "04 — Build" },
    { "type": "text", "text": "05 — Deploy" }
  ]
}
```

## Lib functions called

- `renderSlide(doc, slide, i, deck)` — flat-block path. The layout CSS
  handles the horizontal arrangement.
- `renderBlock(doc, block, ctx)` — renders each event block. The
  `metric` blocks each become a `.vsd-metric` card; the layout CSS
  arranges them in a flexbox row with connectors.

## DESIGN.md tokens used

| Token | Default | What it themes on timeline |
|---|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` | Event labels + delta text. |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` | Event date/value + connector arrows. |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` | Inactive / future events. |
| `--vc-color-divider` | `#e1ddd1` / `#2a2e35` | Connector track line. |
| `--vc-text-3` | `40 px` | Event date/value. |
| `--vc-text-2` | `28 px` | Event label. |
| `--vc-text-1` | `20 px` | Event delta description. |
| `--vc-space-4` | `40 px` | Inter-event gap. |

## Selection / comment / decision-mini contract notes

The timeline slide is one selectable atom. Individual events are NOT
separately commentable — the slide is the unit. A reviewer commenting
on a specific event says "the Q3 event" in the text.

## When to use this reference

Open this ref when:

- Presenting a project plan / roadmap with phases.
- Reconstructing an incident timeline.
- Showing a build/deploy/release pipeline as a sequence.
- The argument's spine is temporal — "first this happened, then this,
  then this".

## Don'ts

- Don't put more than 7 events. The horizontal arrangement gets
  cramped past 7 (each event card needs ~150 px at projection scale);
  the 8th event wraps to a second row, which breaks the temporal
  reading flow.
- Don't mix event card sizes (some with `delta`, some without). The
  inconsistency breaks the visual rhythm. Either all have delta or
  none do.
- Don't use timeline for non-temporal sequences. A list of 5
  principles isn't a timeline; it's a `content` slide. Timeline
  implies "this happens before this".
- Don't put markdown / formatted text in event labels. The label
  field is rendered as plain text; markdown shows as literal
  characters.

## Authoring rules — event count vs zoom level

The timeline's natural zoom level is set by how many events you have:

- 3-4 events → broad strokes (Quarter / Phase). "Design / Prototype /
  Ship / Measure".
- 5-7 events → medium detail (Month / Step). "Plan / Spec / Build /
  Test / Deploy / Monitor / Iterate".
- 8+ events → ZOOM IN. Split into multiple timelines, each covering a
  sub-period at higher detail.

A timeline trying to show 12 weeks worth of events is unreadable; show
the 4-phase overview, then in a later slide zoom into one phase's 6
weekly steps.

## Visual verification

After authoring a timeline slide, capture light + dark at 1280×720
via the dev-browser path in `skills/amvcp-self-debug-rules/SKILL.md`:

1. The heading is at the top; the event row fills the bottom 70% of
   the stage.
2. Events arrange horizontally; no event wraps to a second row.
3. The connector track / arrows run between events left-to-right.
4. Event dates are in accent colour; event labels in default content
   colour.
5. On a 480×800 viewport (`fit: responsive`), events stack
   vertically with the connector running top-to-bottom.

## Timeline vs Gantt vs roadmap

Three layouts that all show "things over time":

| Layout / format | Best for | Visual model |
|---|---|---|
| `timeline` (this skill) | 3-7 sequential events | Horizontal row of cards with arrows. |
| `data-story` with Gantt-style chart | 5-15 overlapping tasks | Chart with horizontal bars per task. |
| Roadmap (prose-pages format) | 20+ items grouped by quarter / theme | Long table or column-per-theme view. |

The slide format wants the simplest of the three — sequential events
with cards. Anything more complex (overlapping work, dependency
graphs, milestones with sub-tasks) belongs in a chart, not a
timeline layout.

## Examples by timeline scope

### Quarterly project plan

```jsonc
{ "metric": [
  {"value": "Q1", "label": "Design",    "delta": "RFC merged"},
  {"value": "Q2", "label": "Prototype", "delta": "Feature flag"},
  {"value": "Q3", "label": "Ship",      "delta": "10% → 100% rollout"},
  {"value": "Q4", "label": "Measure",   "delta": "p99 cut 38%"}
] }
```

### Sprint timeline

```jsonc
{ "metric": [
  {"value": "Day 1", "label": "Kickoff",      "delta": "Scope locked"},
  {"value": "Day 3", "label": "Spike done",   "delta": "Feasibility +"},
  {"value": "Day 5", "label": "Build start",  "delta": "Branched"},
  {"value": "Day 8", "label": "Code freeze",  "delta": "Review opens"},
  {"value": "Day 10","label": "Ship",         "delta": "Production"}
] }
```

### Incident timeline (post-mortem)

```jsonc
{ "metric": [
  {"value": "14:02", "label": "Pager",      "delta": "First alert"},
  {"value": "14:18", "label": "Triage",     "delta": "On-call online"},
  {"value": "14:35", "label": "Mitigation", "delta": "Flag rollback"},
  {"value": "16:00", "label": "Recovery",   "delta": "Normal traffic"},
  {"value": "+1 day","label": "RCA",        "delta": "Root cause filed"}
] }
```

## Source provenance

- SL-04 — Folio "Timeline" pattern (horizontal sequence).
- SL-10 — content-template "Timeline (horizontal with dates)"
  pattern, lifted into the deduplicated 16.
- The 3-7 event range is from the LayoutCSS `pipeline__step` density
  guidance in `slide-patterns.md` lines 728-820.
- The "metric block as event card" reuse pattern is the slide
  module's deliberate choice to NOT add a new block type for events
  (metric already has value + label + optional delta — exact fit).
