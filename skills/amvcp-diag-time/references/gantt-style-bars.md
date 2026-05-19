# Gantt-style bars

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Scaffold](#scaffold)
- [Authoring math (bar position and width)](#authoring-math-bar-position-and-width)
- [Dependency edges](#dependency-edges)
- [Bar role tinting](#bar-role-tinting)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atoms](#selection-atoms)
- [Variations](#variations)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)
- [Cross-skill seam](#cross-skill-seam)

A diagram of tasks-as-bars on a time axis. Each task is a
horizontal bar from its start date to its end date; tasks are
stacked vertically; dependencies (optional) are arrows connecting
the end of one bar to the start of another.

## When to choose this pattern

Use Gantt-style bars when:

- You are showing **scheduled work** where each task has a
  duration and a position on a time axis.
- The reader needs to see **overlap** — which tasks happen in
  parallel, which serialize.
- The schedule has 5-30 tasks (past that, becomes a wall).

Do NOT use this pattern when:

- The tasks have no real durations (use `phase-graph-preset.md`).
- You're showing high-level phases (use `timeline-diagram.md`).
- The diagram needs interactive editing (use a Gantt library —
  this is for static visualization).

## Scaffold

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1,
    "preset": "free",
    "width": 1200,
    "height": 480,
    "background": "grid",
    "groups": [
      { "id": "header", "label": "",
        "x": 240, "y": 20, "w": 940, "h": 40 }
    ],
    "nodes": [
      { "id": "wk1", "type": "process", "label": "W1",
        "x": 240, "y": 22, "w": 78, "h": 36 },
      { "id": "wk2", "type": "process", "label": "W2",
        "x": 320, "y": 22, "w": 78, "h": 36 },
      { "id": "wk3", "type": "process", "label": "W3",
        "x": 400, "y": 22, "w": 78, "h": 36 },
      { "id": "wk4", "type": "process", "label": "W4",
        "x": 480, "y": 22, "w": 78, "h": 36 },
      { "id": "wk5", "type": "process", "label": "W5",
        "x": 560, "y": 22, "w": 78, "h": 36 },
      { "id": "wk6", "type": "process", "label": "W6",
        "x": 640, "y": 22, "w": 78, "h": 36 },
      { "id": "wk7", "type": "process", "label": "W7",
        "x": 720, "y": 22, "w": 78, "h": 36 },
      { "id": "wk8", "type": "process", "label": "W8",
        "x": 800, "y": 22, "w": 78, "h": 36 },

      { "id": "row1-label", "type": "process", "label": "Discovery",
        "x": 40, "y": 80, "w": 180, "h": 40, "role": "client" },
      { "id": "row1-bar",   "type": "process", "label": "",
        "x": 240, "y": 80, "w": 158, "h": 40, "role": "client" },

      { "id": "row2-label", "type": "process", "label": "Design",
        "x": 40, "y": 140, "w": 180, "h": 40, "role": "service" },
      { "id": "row2-bar",   "type": "process", "label": "",
        "x": 320, "y": 140, "w": 238, "h": 40, "role": "service" },

      { "id": "row3-label", "type": "process", "label": "Scaffold",
        "x": 40, "y": 200, "w": 180, "h": 40, "role": "infra" },
      { "id": "row3-bar",   "type": "process", "label": "",
        "x": 480, "y": 200, "w": 78, "h": 40, "role": "infra" },

      { "id": "row4-label", "type": "process", "label": "Implement",
        "x": 40, "y": 260, "w": 180, "h": 40, "role": "service" },
      { "id": "row4-bar",   "type": "process", "label": "",
        "x": 480, "y": 260, "w": 398, "h": 40, "role": "service" },

      { "id": "row5-label", "type": "process", "label": "Test",
        "x": 40, "y": 320, "w": 180, "h": 40, "role": "service" },
      { "id": "row5-bar",   "type": "process", "label": "",
        "x": 720, "y": 320, "w": 158, "h": 40, "role": "service" },

      { "id": "row6-label", "type": "process", "label": "Release",
        "x": 40, "y": 380, "w": 180, "h": 40, "role": "data" },
      { "id": "row6-bar",   "type": "process", "label": "",
        "x": 800, "y": 380, "w": 78, "h": 40, "role": "accent" }
    ],
    "edges": [
      { "from": "row1-bar", "to": "row2-bar",
        "route": "ortho", "style": "dashed", "arrow": "end" },
      { "from": "row2-bar", "to": "row3-bar",
        "route": "ortho", "style": "dashed", "arrow": "end" },
      { "from": "row3-bar", "to": "row4-bar",
        "route": "ortho", "style": "dashed", "arrow": "end" },
      { "from": "row4-bar", "to": "row5-bar",
        "route": "ortho", "style": "dashed", "arrow": "end" },
      { "from": "row5-bar", "to": "row6-bar",
        "route": "ortho", "style": "dashed", "arrow": "end" }
    ]
  }
  </script>
</div>
```

Bar widths encode duration in time-axis units. With weeks W1-W8
at 80 units wide each, a 2-week task is 158 wide (2 * 80 - 2 for
the 1px borders), a 5-week task is 398 wide.

## Authoring math (bar position and width)

For a task starting at week `S` and ending at week `E`:

```
bar_x = label_column_width + (S - 1) * week_width
bar_w = (E - S + 1) * week_width - 2     // subtract 2 for the borders
```

With `label_column_width = 240` and `week_width = 80`:

- Week 1-1 (one week): x = 240, w = 78
- Week 1-2 (two weeks): x = 240, w = 158
- Week 4-8 (five weeks): x = 480, w = 398

## Dependency edges

Dependency edges go from the END of one bar to the START of
another. With ortho routing, the engine draws an L-shape going
right-then-down.

Dashed style for "should happen after" (soft dependency);
solid style for "MUST happen after" (hard dependency).

For an FF (finish-to-finish) dependency, the edge connects the
end of one bar to the end of another. For SS (start-to-start),
connect starts.

## Bar role tinting

Tint bars by their **owner team** (similar to swimlanes):

- `client` = frontend team
- `service` = backend team
- `data` = database team
- `infra` = devops / CI team
- `accent` = critical-path / release-blocking task

A reader scanning the diagram sees ownership immediately.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | role-tinted bar fills, `--vc-color-border` for header/grid |
| typography | `--vc-text-1` for row labels, `--vc-text-0` for week headers |
| radius | `--vc-radius-sm` for bars (small radius reads as "bar", not "card") |

## Selection atoms

Each bar carries the schedule info:

```json
{ "sceneId": 45, "kind": "node",
  "nodeId": "row4-bar", "nodeType": "process",
  "label": "Implement",
  "startWeek": 4, "endWeek": 8, "duration": 5,
  "owner": "backend" }
```

The agent can answer "what's planned for week 6?" by walking the
scene's bars and checking which intersect week 6.

## Variations

### Today line

For an in-progress schedule, add a vertical "today" line:

```json
{ "id": "today-top", "type": "process", "label": "",
  "x": 560, "y": 60, "w": 1, "h": 1 },
{ "id": "today-bot", "type": "process", "label": "",
  "x": 560, "y": 440, "w": 1, "h": 1 }
```

And an edge:

```json
{ "from": "today-top", "to": "today-bot",
  "arrow": "none", "style": "solid",
  "stroke": "var(--vc-color-danger)" }
```

The danger-red line cuts vertically through the chart; tasks
to the LEFT are past, to the RIGHT are future.

### Completion percentage

Render each bar as a "frame + fill" pair — an outer rectangle of
the planned duration, an inner filled rectangle of the
completed portion:

```json
{ "id": "row1-plan", "type": "process", "label": "",
  "x": 240, "y": 80, "w": 158, "h": 40,
  "role": "client" },
{ "id": "row1-done", "type": "process", "label": "",
  "x": 240, "y": 80, "w": 80, "h": 40,
  "role": "accent" }    // 50% done
```

The accent-tinted inner shows progress; the role-tinted outer
shows plan. Visually rich and easy to scan.

### Milestone markers

For one-day milestones (a release, a code-freeze), render as a
DIAMOND on the time axis (use the `decision` type):

```json
{ "id": "milestone-rc1", "type": "decision", "label": "RC1",
  "x": 640, "y": 380, "w": 40, "h": 40,
  "role": "accent" }
```

The diamond breaks the bar visual rhythm, marking the event as
"different from a regular task".

## Anti-patterns

- Bars of different heights: breaks the visual grid. All bars
  same height; vary only by width.
- 50 rows: scroll-only; consider folding to phases.
- Tasks without clear durations rendered as Gantt bars: lies.
  Use a `phase-graph-preset.md` instead.
- No today line on an in-progress schedule: the reader can't
  judge progress.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- Bar widths are visibly proportional to durations.
- Dependency arrows go from the END of one bar to the START of
  another (a common bug: arrows pointing wrong direction).
- Today line (if used) cuts cleanly through every row.
- Row labels are left-aligned in their column, not overflowing
  into the bar area.

## Cross-skill seam

For interactive Gantt charts (drag-to-reschedule, live
updates), this skill is the wrong tool. Hand off to a dedicated
Gantt library (vis-timeline, frappe-gantt). This pattern is
for STATIC visualization of a schedule snapshot.
