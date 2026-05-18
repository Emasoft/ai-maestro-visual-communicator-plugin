# Timeline diagram

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold (horizontal milestone timeline)](#scaffold-horizontal-milestone-timeline)
- [Vertical timeline variant](#vertical-timeline-variant)
- [Even spacing vs proportional spacing](#even-spacing-vs-proportional-spacing)
- [Event card styling](#event-card-styling)
- [Connector style](#connector-style)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

A horizontal (or vertical) line with events placed at specific
positions in time. The canonical shape for product roadmaps,
incident timelines, release histories, project schedules. Each
event is a card; the line itself is the time axis.

## When to choose this pattern

Use a timeline when:

- You are showing **events in chronological order** where the
  spacing between events matters.
- The reader cares about **when** (the time-axis position) as
  much as **what** (the event content).
- The timespan is short enough that all events fit on screen
  (or the timeline is a navigable widget).

Do NOT use this pattern when:

- The events are ranked by importance not time (use a sorted
  list or `decision-tree-diagram.md`).
- You only have 2-3 events (use a step strip).
- The time axis is more important than the events (use a chart
  via `amvcp-chart`).

## Scaffold (horizontal milestone timeline)

A horizontal timeline is well-served by the engine's `free`
preset:

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 320,
    "background": "plain",
    "nodes": [
      { "id": "axis-left",  "type": "process", "label": "",
        "x": 40,   "y": 200, "w": 1, "h": 1 },
      { "id": "axis-right", "type": "process", "label": "",
        "x": 1160, "y": 200, "w": 1, "h": 1 },

      { "id": "e1", "type": "process", "label": "Beta",
        "detail": "Jan 2026",
        "role": "client",
        "x": 80,  "y": 60, "w": 160, "h": 80 },
      { "id": "e2", "type": "process", "label": "1.0 GA",
        "detail": "Mar 2026",
        "role": "service",
        "x": 320, "y": 60, "w": 160, "h": 80 },
      { "id": "e3", "type": "process", "label": "Enterprise",
        "detail": "Jun 2026",
        "role": "accent",
        "x": 560, "y": 60, "w": 160, "h": 80 },
      { "id": "e4", "type": "process", "label": "Hosted",
        "detail": "Sep 2026",
        "role": "data",
        "x": 800, "y": 60, "w": 160, "h": 80 },
      { "id": "e5", "type": "process", "label": "v2 preview",
        "detail": "Dec 2026",
        "role": "service",
        "x": 1040, "y": 60, "w": 140, "h": 80 },

      { "id": "tick1", "type": "process", "label": "Q1",
        "x": 120, "y": 230, "w": 60, "h": 24 },
      { "id": "tick2", "type": "process", "label": "Q2",
        "x": 360, "y": 230, "w": 60, "h": 24 },
      { "id": "tick3", "type": "process", "label": "Q3",
        "x": 600, "y": 230, "w": 60, "h": 24 },
      { "id": "tick4", "type": "process", "label": "Q4",
        "x": 840, "y": 230, "w": 60, "h": 24 }
    ],
    "edges": [
      { "from": "axis-left", "to": "axis-right",
        "arrow": "none", "route": "straight" },

      { "from": "e1", "to": "tick1", "arrow": "none",
        "style": "dashed", "route": "straight" },
      { "from": "e2", "to": "tick2", "arrow": "none",
        "style": "dashed", "route": "straight" },
      { "from": "e3", "to": "tick3", "arrow": "none",
        "style": "dashed", "route": "straight" },
      { "from": "e4", "to": "tick4", "arrow": "none",
        "style": "dashed", "route": "straight" }
    ]
  }
  </script>
</div>
```

The visible architecture:

- Two invisible "axis-end" nodes at the far left and far right of
  the timeline at y=200.
- A long edge connecting them forms the time axis.
- Event nodes are placed ABOVE the axis at y=60 (their bottom
  edges sit at y=140; the axis is at y=200, so there's a 60px
  gap for the connector).
- Tiny "tick" nodes below the axis carry the date labels.
- Dashed connector edges from each event to its tick visually
  anchor the event to the timeline.

## Vertical timeline variant

For a long timeline (or a sidebar layout), rotate to vertical:

```json
{ "id": "axis-top",    "type": "process", "label": "",
  "x": 100, "y": 40,  "w": 1, "h": 1 },
{ "id": "axis-bottom", "type": "process", "label": "",
  "x": 100, "y": 760, "w": 1, "h": 1 },

{ "id": "e1", "type": "process", "label": "Beta",
  "detail": "Jan 2026",
  "x": 180, "y": 80,  "w": 200, "h": 80 },
{ "id": "e2", "type": "process", "label": "1.0 GA",
  "detail": "Mar 2026",
  "x": 180, "y": 240, "w": 200, "h": 80 }
```

Vertical timelines scroll with the page naturally — useful for
documentation that walks through a long history.

## Even spacing vs proportional spacing

Two layouts:

**Even spacing** — events placed at equal intervals regardless of
real time distance. Simple to author; can mislead the reader
about pacing.

**Proportional spacing** — event x-coordinate computed from its
date. A 3-month gap shows as a 90-unit gap; a 1-month gap shows
as a 30-unit gap.

For real timelines, use proportional spacing. The formula:

```
event_x = axis_left + (event_date - axis_start) / (axis_end - axis_start) * (axis_right - axis_left)
```

Use even spacing only for stylized "stage" timelines where the
gap is conceptual, not temporal.

## Event card styling

Each event card carries:

- `label` — the event name (one line).
- `detail` — the date (one line, often in `--vc-font-mono`).
- `role` — tints by event category (release, milestone, incident).

Cards are 160 wide x 80 tall by default. Increase `h` for events
that need a third line of description.

## Connector style

Dashed connector edges from event to tick = "this event happened
at this time". Solid would feel too rigid for a roadmap (where
exact dates often shift).

For a more decorative look, the connector can be a SHORT line
just from the event's bottom to a "marker" dot ON the axis (a
small circle node) rather than to a tick beneath.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted event fills, `--vc-color-border` for the axis |
| typography | `--vc-text-1` for labels, `--vc-text-0` for dates (mono) |
| radius | `--vc-radius-md` for cards |

## Selection atoms

Standard. Event cards carry the date in `data-ve-data`:

```json
{ "sceneId": 42, "kind": "node",
  "nodeId": "e3", "nodeType": "process",
  "label": "Enterprise",
  "detail": "Jun 2026",
  "eventDate": "2026-06-01"
}
```

The `eventDate` field is authoring guidance — emit it so an agent
can sort/filter by date.

## Variations

### Roadmap with phase swimlanes

Add `groups` for project phases that span multiple events:

```json
"groups": [
  { "id": "phase-mvp",     "label": "MVP",
    "x": 60,  "y": 0, "w": 460, "h": 320, "role": "client" },
  { "id": "phase-scale",   "label": "Scale",
    "x": 540, "y": 0, "w": 460, "h": 320, "role": "service" }
]
```

Events inside each phase are visually grouped by the tinted
backdrop.

### Incident timeline

For an incident (post-mortem), each event is a status change:

```json
{ "id": "incident-start", "type": "start", "label": "Detected",
  "detail": "14:02 UTC", "role": "danger" },
{ "id": "page",           "type": "process", "label": "Paged on-call",
  "detail": "14:03 UTC" },
{ "id": "mitigate",       "type": "process", "label": "Mitigation deployed",
  "detail": "14:21 UTC", "role": "accent" },
{ "id": "resolved",       "type": "end", "label": "Resolved",
  "detail": "14:54 UTC", "role": "success" }
```

The accent role highlights the recovery moment; the success role
on the resolved end marks the close.

### Calendar timeline (months / quarters)

Replace the bare line axis with a calendar strip:

```json
{ "id": "jan", "type": "process", "label": "Jan",
  "x": 40, "y": 200, "w": 80, "h": 40 },
{ "id": "feb", "type": "process", "label": "Feb",
  "x": 120, "y": 200, "w": 80, "h": 40 },
...
```

Each month is a slot; events drop above the slot they fall into.
Visually richer than the line + tick approach.

## Anti-patterns

- Timeline with events but no axis or ticks: the reader can't
  judge time spacing. Always show the axis with labelled ticks.
- Mixed proportional/even spacing: confusing. Pick one model.
- 20+ events squeezed onto one screen: cards overlap. Either
  scroll, fold, or split into multiple timelines.
- Events behind the time axis (z-order issue): visually wrong.
  The axis should be background; events sit on top.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The axis is visible across the full width.
- All events are visibly positioned ABOVE the axis (not
  overlapping).
- Connector lines reach from each event's bottom to the axis
  (no gaps).
- Tick labels are positioned below the axis and don't overlap
  each other.
