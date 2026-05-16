# Metrics stat-band (`vc-metrics` / `vc-metric`)

The horizontal row of 3-5 stat cells that sits at the top of a status
report, implementation plan, or executive summary. Each cell carries
**ONE big number + ONE label + ONE optional delta**. The reader scans
the row in 2 seconds and either decides to read on or moves to the
next page.

The stat-band is the most-reused report-doc primitive after callouts.
It works because it follows the *progressive-disclosure rule of
numbers*: the value is the eye-anchor, the label is the context, and
the delta is the trend — three pieces of information per cell, in
descending typographic weight.

## When to use a stat-band

| Use a stat-band | Use something else |
|---|---|
| You have 3-5 quantitative facts that frame the document | Single number → a callout or hero typography block |
| The numbers belong to the *same time window or domain* | Mixed-domain numbers → a comparison table |
| The numbers don't need to be sortable | Sortable list of metrics → `amvcp-tables` |
| Reader will scan the row, not analyze it | Deep analysis needed → `amvcp-charts-and-dashboards` |
| Each metric has a one-line label | Labels need 2+ lines → metric cards (richer variant) |

## Scaffold

```html
<div class="vc-metrics">
  <div class="vc-metric">
    <div class="vc-metric-value">14</div>
    <div class="vc-metric-label">PRs merged</div>
    <div class="vc-metric-delta">+3 vs wk10</div>
  </div>
  <div class="vc-metric">
    <div class="vc-metric-value">6</div>
    <div class="vc-metric-label">Deploys</div>
    <div class="vc-metric-delta">±0</div>
  </div>
  <div class="vc-metric vc-metric--warn">
    <div class="vc-metric-value">1</div>
    <div class="vc-metric-label">Incidents</div>
    <div class="vc-metric-delta">SEV-2 · 47m</div>
  </div>
  <div class="vc-metric">
    <div class="vc-metric-value">3</div>
    <div class="vc-metric-label">Flaky tests fixed</div>
    <div class="vc-metric-delta">suite 99.1%</div>
  </div>
</div>
```

## CSS (already injected by the runtime)

```css
.vc-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-4, 16px);
  margin-block: var(--vc-space-5, 32px);
}
.vc-metric {
  flex: 1 1 8rem;
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
.vc-metric-value {
  font-size: var(--vc-text-4, 24px);
  font-weight: var(--vc-weight-bold, 700);
  font-feature-settings: "tnum";
}
.vc-metric-label {
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
}
```

The `flex: 1 1 8rem` on `.vc-metric` is the responsive trick: every
cell wants to be at least 8rem wide and otherwise share remaining
space equally. On mobile the cells wrap into 2 columns automatically;
on desktop they form a single row.

## The `--warn` modifier

A single cell can be flagged "this is the bad number" without breaking
the row alignment:

```css
.vc-metric--warn {
  border-inline-start: 4px solid var(--vc-color-warning, #a8791f);
  padding-inline-start: calc(var(--vc-space-4, 16px) - 4px);
}
.vc-metric--warn .vc-metric-delta {
  color: var(--vc-color-warning, #a8791f);
  font-weight: var(--vc-weight-bold, 700);
}
```

Use on **one cell at a time**. Two `--warn` modifiers in a row dilute
the signal — every reader sees the row as balanced. One out of four
or five is the dose.

For positive standout (e.g. a record-breaking number), there is no
`--good` modifier — successful numbers should not need to shout. Use
the row's neutrality to let the reader notice the high number on its
own.

## Number formatting discipline

Stat-band values are scanned in 2 seconds; formatting matters more
than precision.

| Type | Good | Bad |
|---|---|---|
| Counts | `14`, `6`, `3` | `14.0`, `6.00` |
| Money | `$2.4M`, `$847K` | `$2,400,000`, `$847,000.00` |
| Percentages | `99.1%`, `+3%` | `99.1342%`, `0.991342` |
| Latency | `180ms`, `1.4s` | `180.00 ms`, `0.18 sec` |
| Time | `47m`, `2h 14m` | `47 min`, `2 h, 14 m` |

The `font-feature-settings: "tnum"` rule ensures digits align across
cells when they have different counts (`14` vs `1234`).

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-surface` | Cell background |
| `--vc-color-border` | Cell border |
| `--vc-color-content-muted` | Label, delta |
| `--vc-color-warning` | `--warn` modifier border + delta |
| `--vc-text-4` | Value size (24px default) |
| `--vc-text-1` | Label size (14px default) |
| `--vc-text-0` | Delta size (11px default — see below) |
| `--vc-space-3` / `--vc-space-4` / `--vc-space-5` | Padding + row margin |
| `--vc-radius-md` | Cell corner |

If your DESIGN.md ships a separate display-number font (e.g. a
condensed grotesque for stats), override at the page level:

```css
.vc-metric-value {
  font-family: var(--vc-font-display, var(--vc-font-heading));
}
```

## Composition

Stat-bands embed inside almost every report-doc shape:

| Containing shape | Typical stat count | Notes |
|---|---|---|
| `status-report-shape` | 4 | The headline-numbers row |
| `implementation-plan-shape` | 4 | Effort / surfaces / new tables / flag |
| `incident-postmortem-shape` | rarely embedded | Use the impact table instead |
| `feature-explainer-shape` | 3 | "Throughput / Latency / Memory" |
| `whitepaper-shape` | 3-5 | Executive summary band |
| `compare-n-approaches-shape` | embed PER-COLUMN as chip strip, not a band |

A stat-band is **never** in the middle of a long prose section — it
breaks the reading flow. Always at the top of a section or document.

## Selection / comment notes

- Each metric cell is selectable as a unit
  (`{type:"metric", label:"Incidents"}`) so a reviewer can comment
  "this number is wrong" without highlighting it.
- The value is selectable independently — useful for "this number
  needs a footnote" comments.
- The `--warn` modifier is meaningful selection metadata —
  `{type:"metric", label:"Incidents", warn:true}`.
- Delta text is selectable independently — useful for "the wk10
  comparison is misleading" comments.

## Decision-mini hook

The `--warn` cell occasionally hosts a decision-mini for
remediation:

```html
<div class="vc-metric vc-metric--warn">
  <div class="vc-metric-value">1</div>
  <div class="vc-metric-label">Incidents</div>
  <div class="vc-metric-delta">SEV-2 · 47m</div>
  <div class="ve-decision" data-decision-id="incident-recovery-action">
    <button data-choice="dedicated">Dedicate Q3 to reliability</button>
    <button data-choice="business-as-usual">Business as usual</button>
  </div>
</div>
```

This is rare; usually the decision belongs in a dedicated section
below the stat-band.

## Anti-patterns

- **6+ metrics in a single band** — the row stops being scannable.
  Pick the 4 that frame the document; the rest belong in a table.
- **Two-line metric values (`"2.4 million dollars"`)** — values are
  always one line. Compress (`$2.4M`) or use a smaller unit.
- **A metric without a label** — the number alone is meaningless.
  Even "Total" is a label.
- **Two `--warn` modifiers in a row** — see above.
- **Inconsistent number formatting between cells** — `2400000` next
  to `$847K` forces mental arithmetic. Pick one format per quantity
  type.
- **A delta that points the wrong way** — `Incidents: 1, +0 vs wk10`
  reads as "no change" when actually "wk10 had 0, now we have 1".
  Either say `+1 vs wk10` (delta of count) or `0 → 1` (transition).
- **Stat-band at the bottom of a document** — the band frames the
  document; placing it at the end means readers reach it after
  forming an impression. Always at the top.
- **A "trend sparkline" in every cell** — turns the stat-band into a
  mini-dashboard and breaks the 2-second scan. If sparklines matter,
  use the dashboard primitive in `amvcp-charts-and-dashboards`.
- **Animated number-counter on initial render** — looks impressive,
  delays the reader's first scan, fails the
  `prefers-reduced-motion` gate without a fallback.
