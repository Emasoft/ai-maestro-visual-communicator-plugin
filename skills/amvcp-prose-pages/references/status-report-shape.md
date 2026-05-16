# Status-report shape — weekly engineering / project status

The recurring "what shipped, what is in flight, what is blocked" report
that every team produces at every cadence. The canonical reference is
the `html-effectiveness` demo #11, "status-report" — auto-generated
weekly summary with stat band + bar chart + carryover panel + sources
footer. This shape works at any cadence (daily/weekly/sprint/quarter)
because the structure is identical; only the time window changes.

The status-report shape is *retrospective* (looks backward at completed
work); the `implementation-plan-shape` is *prospective* (looks forward
at planned work). Do not collapse them — a single doc trying to do both
fails at both.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| Recurring time-windowed report (weekly status, sprint review) | One-off planning artifact → `implementation-plan-shape` |
| You have ≥3 quantitative metrics and ≥1 narrative highlight | Decision under review → `pr-review-reviewer-side-shape` |
| Reader wants to scan in 30 seconds and click in for detail | Long-form deep-dive → `feature-explainer-shape` |
| The headline is "we shipped N things, here is the breakdown" | The headline is "here is a single shipped thing" → `pr-writeup-author-side-shape` |
| Audience is a recurring stakeholder who reads this every cycle | Audience is reviewing a one-off change → `pr-review-reviewer-side-shape` |

## Section order (fixed)

```
1. HEADER + AUTO-PILL    — title, cadence label, time window, auto-generated provenance
2. SUMMARY STAT BAND     — 4 metric cells, one optional .warn modifier
3. HIGHLIGHTS BULLETS    — 3-7 bullets, clay square-bullet markers
4. SHIPPED TABLE         — sortable-feeling table of completed work
5. VELOCITY CHART        — inline SVG bar chart, peak highlighted
6. CARRYOVER PANEL       — oat-tinted panel of in-review / blocked / slipped
7. PROVENANCE FOOTER     — sources line + generated-at timestamp
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">
    Weekly status · 2026-W19
    <span class="vc-auto-pill">auto-generated</span>
  </p>
  <h1>Platform team — week of May 12</h1>
  <p class="vc-doc-subtitle">May 12 – May 18, 2026 · 6 engineers · 1 incident</p>
</header>

<!-- 1. Summary stat band -->
<section id="summary">
  <h2><span class="vc-num">01</span> Headline numbers</h2>
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
    <!-- The .vc-metric--warn modifier marks the bad stat -->
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
</section>

<!-- 2. Highlights -->
<section id="highlights">
  <h2><span class="vc-num">02</span> Highlights</h2>
  <ul class="vc-highlights">
    <li>Auth migration to OIDC complete; legacy session table archived.</li>
    <li>Rate-limiter throughput up 4× after sliding-window rewrite.</li>
    <li>SEV-2 cache stampede on Friday — postmortem at INC-2026-0412.</li>
  </ul>
</section>

<!-- 3. Shipped table -->
<section id="shipped">
  <h2><span class="vc-num">03</span> Shipped</h2>
  <table>
    <thead>
      <tr><th>PR</th><th>Title</th><th>Author</th><th>Risk</th></tr>
    </thead>
    <tbody>
      <tr><td>#4821</td><td>OIDC migration — phase 2</td><td>@alice</td>
        <td><span class="vc-risk-dot vc-risk-dot--med"></span> med</td></tr>
      <!-- … -->
    </tbody>
  </table>
</section>

<!-- 4. Velocity chart -->
<section id="velocity">
  <h2><span class="vc-num">04</span> PRs per day</h2>
  <figure class="vc-figure">
    <svg viewBox="0 0 700 200" role="img" aria-label="Bar chart: PRs merged per day, peak Tuesday">
      <!-- hand-rolled 7 <rect> bars, peak bar uses accent fill -->
    </svg>
    <figcaption>Tuesday peak (5 PRs) coincided with the OIDC freeze lifting.</figcaption>
  </figure>
</section>

<!-- 5. Carryover -->
<section id="carryover">
  <h2><span class="vc-num">05</span> Carryover</h2>
  <div class="vc-carryover">
    <div class="vc-carryover-group"><span class="vc-tag">in-review</span> #4823, #4830</div>
    <div class="vc-carryover-group"><span class="vc-tag vc-tag--warn">blocked</span> #4825 (waiting on infra-cap-2)</div>
    <div class="vc-carryover-group"><span class="vc-tag vc-tag--danger">slipped</span> #4811 (deferred to wk20)</div>
  </div>
</section>

<!-- 6. Provenance footer -->
<footer class="vc-doc-footer">
  <span class="vc-auto-pill">auto-generated</span>
  Sources: git log main..HEAD · CI dashboard · deploy log · pagerduty
  <span class="vc-generated">generated 2026-05-18 17:02 UTC+02</span>
</footer>

</article>
```

## The `.vc-metric--warn` modifier

A single stat in the band can be flagged "this is the bad one" without
breaking the grid alignment. Mechanism: a clay left-border + a slightly
darker delta label, **nothing else changes**.

```css
.vc-metric--warn {
  border-inline-start: 4px solid var(--vc-color-warning, #a8791f);
  padding-inline-start: calc(var(--vc-space-4, 16px) - 4px); /* preserve the row */
}
.vc-metric--warn .vc-metric-delta {
  color: var(--vc-color-warning, #a8791f);
  font-weight: var(--vc-weight-bold, 700);
}
```

Use only on the stat that is actually concerning. Two `.vc-metric--warn`
modifiers in a row signals nothing — every reader sees the row as
balanced. One out of four is the dose.

## The `vc-auto-pill` provenance pill

A small monospace rounded chip with the text "auto-generated" sits
**inside the header eyebrow line**, not as a separate row. It tells the
reader at a glance "this was emitted by an agent, not hand-written";
combined with the provenance footer, it discharges the *show your
work* duty without theatre.

```css
.vc-auto-pill {
  display: inline-flex;
  align-items: center;
  margin-inline-start: var(--vc-space-2, 8px);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.04em;
  text-transform: lowercase;
}
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-warning` | `.vc-metric--warn` border + delta; `vc-tag--warn` |
| `--vc-color-danger` | `vc-tag--danger`; `.vc-risk-dot--high` |
| `--vc-color-accent` | peak bar in velocity chart; section numbers |
| `--vc-color-surface-sunken` | carryover panel background; auto-pill |
| `--vc-color-content-muted` | byline, footer text |
| `--vc-text-0` (mono) | auto-pill text |
| `--vc-font-mono` | auto-pill, generated-at timestamp, PR numbers |
| `--vc-radius-md` | metric cards, carryover panel |
| `--vc-space-*` | all gaps |

The auto-pill MUST use the surface-sunken / content-muted pair so it
stays low-key — making it accent-colored would steal attention from
the actual numbers.

## Composition with other skills

| Section | Embed from |
|---|---|
| Stat band | `amvcp-charts-and-dashboards` metric-card primitive |
| Highlights bullets | `amvcp-prose-pages` — plain `<ul>` with `vc-highlights` for the clay square bullets |
| Shipped table | `amvcp-tables` — sortable-feeling read-only table |
| Velocity chart | `amvcp-charts-and-dashboards` SVG bar chart |
| Carryover tags | `amvcp-tables` chip primitive |

## Lib functions called

```js
// 1. Inject the report-doc CSS (idempotent)
window.amvcpReportDoc.injectReportDocCSS(document);

// 2. Wire the TOC scroll-spy if you added a sticky TOC
window.amvcpReportDoc.init(document);

// 3. Run the 7-gate QA pipeline before handing back
const report = window.amvcpReportDoc.runGates(document, "status-2026-W19");
```

The auto-pill text is **agent-controlled** — the QA pipeline does not
verify "auto-generated" is the text. If the doc is human-authored, omit
the pill or change the text to "hand-written"; lying here breaks reader
trust.

## Selection / comment notes

- Each stat cell is selectable as a unit
  (`{kind:"element", type:"metric", metricLabel:"Incidents"}`) so a
  reader can comment "this number is wrong" without highlighting it.
- Highlight bullets are individually selectable as `data-ve-prose`
  paragraphs — `paragraphId:"2.1"` for highlight #1.
- The shipped table is selectable per-row
  (`{kind:"element", type:"table-row", rowId:"#4821"}`) — comments
  attach to specific PRs.
- The velocity chart's peak bar carries `data-ve-id="velocity-peak"`
  so a reader can comment "is this real or a calendar artefact?".

## Decision-mini hook

Status reports are descriptive, not deliberative — they rarely host
decision-minis. The one exception is the **carryover panel**, where a
slipped item may need a re-prioritization decision:

```html
<div class="ve-decision" data-decision-id="carryover-4811-wk20">
  <p>#4811 slipped — should we re-prioritize?</p>
  <button data-choice="yes-wk20">Yes, wk20</button>
  <button data-choice="yes-wk21">Yes, wk21</button>
  <button data-choice="deprioritize">Deprioritize entirely</button>
</div>
```

## Anti-patterns

- **A "lessons learned" section** — that belongs in
  `retrospective-shape`, not the recurring status. Status is a
  *what*-and-*when*; lessons are *why* and *how-to-change*.
- **Per-engineer breakdown columns in the shipped table** — incentivizes
  vanity metrics. The author column is enough.
- **More than one stat with `.vc-metric--warn`** — dilutes the signal.
- **A "next week" section** — that is a *plan*, use
  `implementation-plan-shape` for it. Status reports look backward.
- **Hiding the SEV-2 / incident behind a friendly delta** — a stat band
  that shows `Incidents: 1` with no warning modifier and no delta value
  is dishonest. The `.vc-metric--warn` modifier exists specifically to
  surface the bad stat.
- **An auto-pill on a hand-written report** — the pill MEANS
  "auto-generated"; using it as decoration breaks the convention.
- **>1 peak bar highlighted in the velocity chart** — the peak rule is
  "one bar, accent color, others surface". Two highlighted bars =
  no peak.
- **No carryover panel** — if everything completed, write the panel
  anyway with "No carryover this cycle." The empty-state confirms to
  the reader the section is intentional, not omitted.
