# Timeline with typed dots — incident, milestone, history

## Table of Contents

- [When to use a timeline](#when-to-use-a-timeline)
- [Scaffold (incident timeline)](#scaffold-incident-timeline)
- [CSS contract](#css-contract)
- [Dot-color semantics](#dot-color-semantics)
- [Time-column conventions](#time-column-conventions)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The vertical-line + typed-colored-dots pattern that postmortems,
implementation plans, and project histories use to render a sequence
of events. Each event is a `<li>` with a `<time>` + a colored dot +
a body paragraph; the dot color encodes event class without needing
a separate column.

The typed-dot timeline is the **canonical compact representation of
a chronology** in the report-doc skill. Lifted from
`html-effectiveness` demo #12 (incident report). Used by every
shape that needs to display a sequence of events.

## When to use a timeline

| Use a timeline | Use something else |
|---|---|
| 3-15 chronological events | 2 events → just write them as prose |
| Events have meaningful classes (impact / detect / mitigated) | Pure deploy log → use a table |
| Reader will scan the events in order | Reader needs to filter / sort → use a table |
| Times / dates matter | No time component → use a checklist |
| Events all happen on one day or in one window | Multi-month history → use a horizontal Gantt-style |

For chronologies spanning months/years, the vertical timeline gets
unwieldy; switch to a `amvcp-diagram`-rendered Gantt or horizontal
strip.

## Scaffold (incident timeline)

```html
<ol class="vc-timeline">

  <li class="vc-timeline-event">
    <time>14:18</time>
    <span class="vc-timeline-dot" aria-hidden="true"></span>
    <p>Slot-fill rollout enabled for 100% of traffic.</p>
  </li>

  <li class="vc-timeline-event vc-timeline-event--impact">
    <time>14:23</time>
    <span class="vc-timeline-dot" aria-hidden="true"></span>
    <p>Cache hit rate falls from 94% to 11%; p99 latency 1.4s.</p>
  </li>

  <li class="vc-timeline-event vc-timeline-event--detect">
    <time>14:31</time>
    <span class="vc-timeline-dot" aria-hidden="true"></span>
    <p>PagerDuty fires; on-call paged.</p>
  </li>

  <li class="vc-timeline-event vc-timeline-event--mitigated">
    <time>15:05</time>
    <span class="vc-timeline-dot" aria-hidden="true"></span>
    <p>Rollout reverted to 0%; p99 returns to baseline within 90s.</p>
  </li>

</ol>
```

The `<ol>` (ordered list) tag is intentional — the events have
semantic order, and screen readers benefit from "list of 4 items".

## CSS contract

```css
.vc-timeline {
  list-style: none;
  margin: var(--vc-space-5, 32px) 0;
  padding-inline-start: 24px;
  border-inline-start: 1.5px solid var(--vc-color-border, #e3dcc9);
}
.vc-timeline-event {
  position: relative;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--vc-space-3, 12px);
  align-items: baseline;
  padding-block: var(--vc-space-3, 12px);
}
.vc-timeline-event time {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
  font-feature-settings: "tnum";
}
.vc-timeline-dot {
  position: absolute;
  inset-inline-start: -32px;
  top: var(--vc-space-3, 12px);  /* align with first text line */
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--vc-color-content-subtle, #8a8170);
  border: 2px solid var(--vc-color-canvas, #faf6ee);
}
.vc-timeline-event p {
  margin: 0;
  font-size: var(--vc-text-2, 16px);
  line-height: 1.5;
}

/* Typed-dot variants */
.vc-timeline-event--impact     .vc-timeline-dot { background: var(--vc-color-warning, #a8791f); }
.vc-timeline-event--detect     .vc-timeline-dot { background: var(--vc-color-info,    #3464a8); }
.vc-timeline-event--mitigated  .vc-timeline-dot { background: var(--vc-color-success, #3a6b5c); }
.vc-timeline-event--ended      .vc-timeline-dot { background: var(--vc-color-success, #3a6b5c); }
.vc-timeline-event--escalated  .vc-timeline-dot { background: var(--vc-color-danger,  #a84a32); }

/* Done milestone (for plan timelines) */
.vc-timeline-event--done       .vc-timeline-dot { background: var(--vc-color-success, #3a6b5c); }
.vc-timeline-event--inprogress .vc-timeline-dot { background: var(--vc-color-canvas, #faf6ee);
                                                   border-color: var(--vc-color-warning, #a8791f);
                                                   border-width: 2.5px; }
.vc-timeline-event--blocked    .vc-timeline-dot { background: var(--vc-color-danger,  #a84a32); }
```

The dot's 2px border in the canvas color creates a "halo" so the
dot reads cleanly even when it overlaps the vertical line.

## Dot-color semantics

The same modifiers apply across postmortems AND implementation plans:

| Modifier | Meaning (postmortem) | Meaning (implementation plan) | Color role |
|---|---|---|---|
| (none, neutral gray) | Routine event (deploy, config change) | Future / unscheduled milestone | `--vc-color-content-subtle` |
| `--impact` | Impact starts | (rare) | `--vc-color-warning` |
| `--detect` | Detection — alarm / human noticed | (rare) | `--vc-color-info` |
| `--mitigated` | Impact stopped (still investigating) | Phase complete | `--vc-color-success` |
| `--ended` | Incident formally closed | Final milestone reached | `--vc-color-success` |
| `--escalated` | Severity rose during incident | (rare) | `--vc-color-danger` |
| `--done` | (rare in postmortem) | Milestone done | `--vc-color-success` |
| `--inprogress` | (rare in postmortem) | Currently active milestone | `--vc-color-warning` (hollow with border) |
| `--blocked` | (rare in postmortem) | Blocked milestone | `--vc-color-danger` |

The semantic mapping is **consistent across the plugin** so a reader
who learned the timeline color code in one document instantly reads
another.

## Time-column conventions

| Type of time column | Format |
|---|---|
| Same-day timeline (postmortem) | `14:18` (HH:MM, document-stated timezone in section header) |
| Multi-day timeline | `May 12 14:18` or `Day 0 — 14:18` |
| Sprint / project timeline | `Q2-W2` or `Apr 13 (Mon)` |
| Historical timeline | `2024-Q1`, `2025-03`, `2026-05-15` |

Always **left-align the time column** so the eye scans down the
chronology cleanly. Right-aligned times require horizontal eye
movement on every event.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-warning` | Impact / inprogress dots |
| `--vc-color-info` | Detect dot |
| `--vc-color-success` | Mitigated / ended / done dots |
| `--vc-color-danger` | Escalated / blocked dots |
| `--vc-color-content-subtle` | Default dot, neutral routine events |
| `--vc-color-canvas` | Dot border (halo against vertical line) |
| `--vc-color-border` | Vertical line |
| `--vc-color-content-muted` | Time-column text |
| `--vc-font-mono` | Time-column |
| `--vc-text-1` / `--vc-text-2` | Sizes |

## Composition

| Containing shape | Timeline placement |
|---|---|
| `incident-postmortem-shape` | Section 3 — the canonical home |
| `implementation-plan-shape` | Section 2 — milestone vertical timeline |
| `whitepaper-shape` | Optional — historical context |
| `case-study-shape` | Optional — project chronology |
| `architecture-explainer-shape` | Rare — substrate flow is more useful |
| `feature-explainer-shape` | Rare |
| Other shapes | Skip |

Embed the timeline inside a `<section>` with a heading; do not let
it float as the document's structure.

## Selection / comment notes

- Each timeline event is selectable as a unit
  (`{type:"timeline-event", time:"14:23"}`) so a reviewer can
  comment "the actual time was 14:24".
- The `<time>` element is selectable independently — useful for
  "wrong timezone" comments.
- The body paragraph is selectable per the normal `data-ve-prose`
  paragraph numbering.
- The dot itself is `aria-hidden="true"` — not selectable text;
  selection happens at the event-level.

## Decision-mini hook

Timeline events occasionally host a decision-mini for re-classification:

```html
<li class="vc-timeline-event vc-timeline-event--impact">
  <time>14:23</time>
  <span class="vc-timeline-dot" aria-hidden="true"></span>
  <p>Cache hit rate falls from 94% to 11%; p99 latency 1.4s.
    <div class="ve-decision" data-decision-id="postmortem-impact-time">
      <button data-choice="keep">Keep 14:23 as impact start</button>
      <button data-choice="earlier-1418">Move to 14:18 (rollout time)</button>
      <button data-choice="later-1428">Move to 14:28 (first user complaint)</button>
    </div>
  </p>
</li>
```

## Anti-patterns

- **Timeline with all-neutral dots** — defeats the typed-dot
  pattern. Even routine events benefit from being marked routine.
- **More than 5 dot variants in one timeline** — the reader cannot
  remember the color code. Stick to 3-5.
- **Times in 12-hour format** ("2:18 PM") — 24-hour avoids AM/PM
  ambiguity. Add a footer `(all times UTC)` or `(Europe/Rome)` for
  clarity.
- **Timezone changes mid-timeline** — pick one timezone for the
  whole timeline; convert if necessary.
- **Bullet markers (`<ul>` with `list-style: disc`)** — defeats
  the dot-color encoding. Use `list-style: none` and the absolute-
  positioned dot.
- **Vertical line with no dot** — readers expect a dot at every
  event. Without it the line reads as decoration.
- **Dot color independent of the variant class** — author
  hardcoded a color via `style="background: red"`. Defeats theme
  swap and breaks the semantic-color discipline.
- **Non-monospace `<time>` font** — times of different digit-counts
  (`9:00` vs `14:18`) misalign. Use mono with `tabular-nums`.
- **Timeline without `(all times UTC)` annotation** — readers
  have no way to know the timezone. Always annotate in the section
  heading or first event's prose.
- **`<ul>` instead of `<ol>`** — events have order. Use `<ol>` even
  though the markers are hidden — screen readers benefit.
