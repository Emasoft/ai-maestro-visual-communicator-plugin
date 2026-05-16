# Queue diagram (FIFO direction)

A specialized diagram for visualizing a **queue** — a row of job
boxes with the head highlighted as "next to run" and an explicit
direction indicator. Lifted from `10-svg-illustrations` in the
html-effectiveness catalog. Tiny but useful: shows the FIFO
ordering at a glance, without any animation or scroll.

## When to choose this pattern

Use a queue diagram when:

- You are illustrating a **work queue, message queue, or job
  pipeline** at a single moment in time.
- The reader needs to understand the **ordering** — which job
  runs next, what's behind it, what's at the back.
- The visual fits in a small section (one row, no scroll).

Do NOT use this pattern when:

- The queue's depth varies dramatically over time (use a chart
  via `amvcp-chart`).
- You want to show the queue's PROCESSING (jobs leaving the
  head) — that's an animation; use the `process-flow-preset.md`
  with `animate: "particle"` on the dispatcher edge instead.

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1000,
    "height": 160,
    "background": "plain",
    "nodes": [
      { "id": "head", "type": "process", "label": "Job #142",
        "detail": "next to run",
        "role": "accent",
        "x": 40,  "y": 60, "w": 160, "h": 60 },
      { "id": "j2",   "type": "process", "label": "Job #143",
        "x": 220, "y": 60, "w": 160, "h": 60 },
      { "id": "j3",   "type": "process", "label": "Job #144",
        "x": 400, "y": 60, "w": 160, "h": 60 },
      { "id": "j4",   "type": "process", "label": "Job #145",
        "x": 580, "y": 60, "w": 160, "h": 60 },
      { "id": "j5",   "type": "process", "label": "Job #146",
        "x": 760, "y": 60, "w": 160, "h": 60 }
    ],
    "edges": [
      { "from": "head", "to": "j2", "arrow": "none", "route": "straight" },
      { "from": "j2",   "to": "j3", "arrow": "none", "route": "straight" },
      { "from": "j3",   "to": "j4", "arrow": "none", "route": "straight" },
      { "from": "j4",   "to": "j5", "arrow": "none", "route": "straight" }
    ]
  }
  </script>
</div>
```

The head is `role: "accent"` (tinted highlight), the rest are
neutral. The connecting "edges" carry no arrows — they are just
visual separators showing the queue's continuity.

## Direction indicator

Add an arrow OUTSIDE the queue showing the FIFO direction:

```html
<svg width="1000" height="40" class="ve-queue-direction">
  <text x="20" y="24" font-family="var(--vc-font-mono)"
        font-size="14" fill="var(--vc-color-content-muted)">
    HEAD (next out)
  </text>
  <text x="900" y="24" font-family="var(--vc-font-mono)"
        font-size="14" fill="var(--vc-color-content-muted)">
    TAIL (most recent)
  </text>
  <path d="M150,18 L780,18" stroke="var(--vc-color-border)"
        stroke-width="1" stroke-dasharray="4 4" fill="none"
        marker-end="url(#vc-arrow-mini)"/>
</svg>
```

Position this `<svg>` above the queue diagram. The dashed arrow
points right; the labels at the ends name "HEAD" and "TAIL". The
reader reads: "the queue runs left-to-right, head is at the
left."

Alternative: put the arrow below the queue, pointing left (the
"jobs move toward the head" interpretation). Pick the direction
that matches your team's mental model and stick with it
project-wide.

## Variants

### Vertical queue

For a side panel, rotate the queue vertical:

```json
{ "id": "head", "x": 60, "y": 20,  "w": 160, "h": 60, "role": "accent" },
{ "id": "j2",   "x": 60, "y": 100, "w": 160, "h": 60 },
{ "id": "j3",   "x": 60, "y": 180, "w": 160, "h": 60 },
{ "id": "j4",   "x": 60, "y": 260, "w": 160, "h": 60 },
{ "id": "j5",   "x": 60, "y": 340, "w": 160, "h": 60 }
```

The arrow indicator flips vertical too — top label "HEAD", bottom
label "TAIL", arrow pointing down.

### Showing dispatch (head leaving)

For a snapshot mid-dispatch, draw the head AT A DIFFERENT y so
it visually "leaves" the queue:

```json
{ "id": "dispatching", "type": "process", "label": "Job #142",
  "detail": "executing now",
  "role": "service",
  "x": 40, "y": 10, "w": 160, "h": 60 },        // raised above the row
{ "id": "head", "type": "process", "label": "Job #143",
  "detail": "next to run",
  "role": "accent",
  "x": 40, "y": 90, "w": 160, "h": 60 },
{ "id": "j2", ..., "x": 220, "y": 90, ... },
{ "id": "j3", ..., "x": 400, "y": 90, ... }
```

Visually, the dispatching job is "out of the queue" — the reader
sees the queue snapshot at the moment the head has been pulled.

### Queue with depth indicator

Add a number badge showing the queue depth:

```html
<div class="ve-queue-depth">
  Queue depth: <span class="ve-queue-depth__n">5 jobs</span>
</div>
```

Or, more visually:

```
[1] [2] [3] [4] [5]   +0 (live)
```

The "+0" indicates no jobs added since the snapshot; "+12" would
indicate 12 new jobs arrived during the snapshot window.

### Queue with priority lanes

For a priority queue, two rows — high-priority at the top, normal
at the bottom:

```json
{ "id": "hi-head", "type": "process", "label": "Urgent #07",
  "role": "danger", "x": 40, "y": 20,  "w": 140, "h": 50 },
{ "id": "lo-head", "type": "process", "label": "Job #143",
  "role": "accent", "x": 40, "y": 100, "w": 140, "h": 50 }
```

The dispatcher always pulls from the top row first. Convey this
with a single arrow showing "dispatch order: top first".

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-accent` (head), neutral surface (others), `--vc-color-border` (separators) |
| typography | `--vc-font-body`, `--vc-text-1` for labels, `--vc-text-0` for detail |

## Selection atoms

Each job is a standard `diagram-node`. `data-ve-data`:

```json
{ "sceneId": 21, "kind": "node",
  "nodeId": "head", "nodeType": "process",
  "label": "Job #142",
  "detail": "next to run",
  "role": "accent",
  "queueIndex": 0 }
```

The agent can fetch the job details from a backend when the user
clicks. The `queueIndex` is a future field — for now derive it
from the array order in the JSON.

## Anti-patterns

- All jobs tinted accent: the head no longer stands out. ONLY the
  head gets `role: "accent"`.
- Animated jobs sliding left (the queue "moving"): a snapshot
  diagram should not animate; if you want motion, draw the
  dispatcher edge with `animate: "particle"` instead.
- 20-deep queue squeezed into one row: cells become tiny.
  Truncate ("... 14 more ...") or switch to a depth chart.
- Queue with no head highlight: the diagram becomes 5 identical
  rectangles; the visual point of "FIFO" is lost.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The head is visibly distinct from the other boxes (the accent
  tint is strong enough at both themes).
- The direction indicator arrow is readable and the labels
  ("HEAD"/"TAIL") are not clipped.
- The queue reads as a connected sequence, not as 5 disconnected
  boxes — the visual continuity between cells matters.
