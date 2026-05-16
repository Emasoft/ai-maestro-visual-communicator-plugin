# Incident-postmortem shape — INC-id + TL;DR + timeline + impact + action items

The structured postmortem document for any service incident or
production outage. Canonical reference: `html-effectiveness` demo #12,
"incident-report". This shape has been refined by every major operations
team for two decades and the contract has stabilized — the document
exists to *answer questions the reader has not yet asked* in the same
order they would ask them.

The postmortem shape is **blameless by construction** — every section
forces the author to talk about systems and timing, not people. The
"action items" section is the only place individual ownership appears,
and it is forward-looking ("@alice will instrument the cache", not
backward-looking "@alice broke production").

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| A production-impacting incident occurred and is now mitigated | Bug that did not impact production → `pr-writeup-author-side-shape` |
| You need an INC-id, severity, duration | A recurring problem with no single incident → `feature-explainer-shape` (root-cause) |
| You will write follow-up action items with owners and due dates | A pre-incident "we are worried about X" memo → `architecture-explainer-shape` |
| The audience includes leadership + the on-call team | Internal team-only debrief → `retrospective-shape` |
| You will publish externally (customer-facing status page) | Confidential security incident → keep a private artifact |

## Section order (fixed)

```
1. HEADER          — INC-id, h1, severity / status / duration pill row
2. TL;DR CARD      — slate background, ivory text (the news IS the summary)
3. TIMELINE        — vertical line with typed dots (gray / clay / olive)
4. ROOT CAUSE      — narrative + slate-bg diff code panel
5. IMPACT          — mini-table, right-aligned mono numbers
6. ACTION ITEMS    — checkboxes + owner avatar + due dates
7. APPENDIX        — links to runbooks, dashboards, traces
8. FIXED TOC       — right-margin on wide screens; hidden below 1100px
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report" data-ve-prose>

<!-- 1. Header with severity / status / duration pills -->
<header class="vc-doc-header">
  <p class="vc-type-overline">Incident postmortem · INC-2026-0412</p>
  <h1>Cache stampede during slot-fill rollout</h1>
  <div class="vc-pill-row">
    <span class="vc-pill vc-pill--sev">SEV-2</span>
    <span class="vc-pill vc-pill--resolved">Resolved</span>
    <span class="vc-pill"><span class="vc-pill-k">Duration</span> <span class="vc-pill-v">47 min</span></span>
    <span class="vc-pill"><span class="vc-pill-k">Detected</span> <span class="vc-pill-v">2026-05-15 14:18 UTC</span></span>
    <span class="vc-pill"><span class="vc-pill-k">Mitigated</span> <span class="vc-pill-v">2026-05-15 15:05 UTC</span></span>
  </div>
</header>

<!-- 2. TL;DR card — slate-bg, ivory-text, the news IS the summary -->
<aside class="vc-tldr vc-tldr--slate">
  <p class="vc-tldr-eyebrow">TL;DR</p>
  <p>A slot-fill rollout triggered a cache stampede on the rate-limiter
     warm-up path. Backoff jitter is now in place; SEV-2 lasted 47 minutes;
     no data loss; 3 action items follow.</p>
</aside>

<!-- 3. Timeline with typed dots -->
<section id="timeline">
  <h2>Timeline (all times UTC)</h2>
  <ol class="vc-timeline">
    <li class="vc-timeline-event">
      <time>14:18</time>
      <span class="vc-timeline-dot"></span>
      <p>Slot-fill rollout enabled for 100% of traffic.</p>
    </li>
    <li class="vc-timeline-event vc-timeline-event--impact">
      <time>14:23</time>
      <span class="vc-timeline-dot"></span>
      <p>Cache hit rate falls from 94% to 11%; p99 latency 1.4s.</p>
    </li>
    <li class="vc-timeline-event vc-timeline-event--detect">
      <time>14:31</time>
      <span class="vc-timeline-dot"></span>
      <p>PagerDuty fires; on-call paged.</p>
    </li>
    <li class="vc-timeline-event vc-timeline-event--mitigated">
      <time>15:05</time>
      <span class="vc-timeline-dot"></span>
      <p>Rollout reverted to 0%; p99 returns to baseline within 90s.</p>
    </li>
  </ol>
</section>

<!-- 4. Root cause -->
<section id="root-cause">
  <h2>Root cause</h2>
  <p>The slot-fill warm-up runs on first request after a cache miss,
     for every key. Under 100% rollout, every node missed simultaneously
     and 12 backend services received the same fan-out within 80ms…</p>
  <pre><code class="diff"
>- const TTL = 60                          # one global TTL
+ const TTL = 60 + jitter(0, 15)           # 25% jitter on every key</code></pre>
</section>

<!-- 5. Impact mini-table -->
<section id="impact">
  <h2>Impact</h2>
  <table class="vc-impact-table">
    <tr><td>Requests affected</td>           <td class="vc-num">3,412,008</td></tr>
    <tr><td>p99 latency peak</td>            <td class="vc-num">1.43 s</td></tr>
    <tr><td>Customers seeing 5xx</td>        <td class="vc-num">0</td></tr>
    <tr><td>Revenue impact (estimated)</td>  <td class="vc-num">$0</td></tr>
    <tr><td>Cache backend load peak</td>     <td class="vc-num">8.7 ×</td></tr>
  </table>
</section>

<!-- 6. Action items with owner avatars + due dates -->
<section id="action-items">
  <h2>Action items</h2>
  <ul class="vc-action-list">
    <li class="vc-action vc-action--done">
      <input type="checkbox" checked>
      <span class="vc-action-text">Add jitter to TTL (PR #4823, merged).</span>
      <span class="vc-action-owner">@alice</span>
      <time class="vc-action-due">2026-05-16</time>
    </li>
    <li class="vc-action">
      <input type="checkbox">
      <span class="vc-action-text">Add a circuit breaker on warm-up fan-out.</span>
      <span class="vc-action-owner">@bob</span>
      <time class="vc-action-due">2026-05-23</time>
    </li>
    <li class="vc-action">
      <input type="checkbox">
      <span class="vc-action-text">Runbook entry for cache stampede recovery.</span>
      <span class="vc-action-owner">@carol</span>
      <time class="vc-action-due">2026-05-30</time>
    </li>
  </ul>
</section>

<!-- 7. Appendix -->
<section id="appendix">
  <h2>Appendix</h2>
  <ul>
    <li><a href="https://…">Runbook: cache stampede</a></li>
    <li><a href="https://…">Grafana dashboard during incident</a></li>
    <li><a href="https://…">Distributed trace ID a7c1…</a></li>
  </ul>
</section>

<!-- 8. Fixed-right TOC — hidden below 1100px -->
<nav class="vc-toc vc-toc--fixed-right" aria-label="Table of contents">
  <p class="vc-toc-title">Contents</p>
  <ol>
    <li><a href="#timeline">Timeline</a></li>
    <li><a href="#root-cause">Root cause</a></li>
    <li><a href="#impact">Impact</a></li>
    <li><a href="#action-items">Action items</a></li>
    <li><a href="#appendix">Appendix</a></li>
  </ol>
</nav>

</article>
```

## The typed-dot timeline

Three dot colors encode timeline event class without a separate
column — the dot color *is* the column.

| Modifier | Dot color | Meaning |
|---|---|---|
| (none) | `--vc-color-content-subtle` (neutral gray) | Routine event (deploy, config change, scheduled action) |
| `--impact` | `--vc-color-warning` (clay/amber) | Impact starts — the moment users felt it |
| `--detect` | `--vc-color-info` (blue) | Detection — the moment a human or alarm noticed |
| `--mitigated` | `--vc-color-success` (olive/green) | Mitigation complete — impact stopped |
| `--ended` | `--vc-color-success` (olive/green) | Incident formally closed |

```css
.vc-timeline { list-style: none; padding-inline-start: 24px;
               border-inline-start: 1.5px solid var(--vc-color-border, #e3dcc9); }
.vc-timeline-event { position: relative; padding-block: var(--vc-space-3, 12px); }
.vc-timeline-dot {
  position: absolute; inset-inline-start: -32px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--vc-color-content-subtle, #8a8170);
  border: 2px solid var(--vc-color-canvas, #faf6ee);
}
.vc-timeline-event--impact    .vc-timeline-dot { background: var(--vc-color-warning); }
.vc-timeline-event--detect    .vc-timeline-dot { background: var(--vc-color-info); }
.vc-timeline-event--mitigated .vc-timeline-dot { background: var(--vc-color-success); }
```

## The key/value pill (`vc-pill-k` + `vc-pill-v`)

The cleanest compact-meta-row pattern. Each meta-pill is one
`<span class="vc-pill">` containing a `vc-pill-k` (label) + a
`vc-pill-v` (value, monospace). Severity-class pills (`vc-pill--sev`,
`vc-pill--resolved`) have a colored background instead of the
key/value pair.

```css
.vc-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  font-size: var(--vc-text-0, 11px);
}
.vc-pill-k { text-transform: uppercase; letter-spacing: 0.06em; }
.vc-pill-v { font-family: var(--vc-font-mono, ui-monospace, monospace);
             color: var(--vc-color-content, #1f1a14); }
.vc-pill--sev {
  background: var(--vc-color-danger, #a84a32);
  color: var(--vc-color-on-accent, #faf6ee);
  font-weight: var(--vc-weight-bold, 700);
}
.vc-pill--resolved {
  background: var(--vc-color-success, #3a6b5c);
  color: var(--vc-color-on-accent, #faf6ee);
  font-weight: var(--vc-weight-bold, 700);
}
```

## The slate TL;DR variant

Standard TL;DR cards use a clay left-border (see `tldr-summary-card.md`).
The postmortem variant uses **slate background + ivory text** because
the summary IS the news — readers who read only the TL;DR have got
the headline. The contrast inversion makes the card unmissable.

```css
.vc-tldr--slate {
  background: var(--vc-color-content, #1f1a14);
  color: var(--vc-color-canvas, #faf6ee);
  padding: var(--vc-space-4, 16px) var(--vc-space-5, 32px);
  border-radius: var(--vc-radius-md, 8px);
  margin-block: var(--vc-space-5, 32px);
}
.vc-tldr--slate .vc-tldr-eyebrow {
  color: var(--vc-color-canvas, #faf6ee);
  opacity: 0.7;
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 var(--vc-space-2, 8px);
}
```

QA Gate 2 (`wcag-contrast`) checks the slate-bg / ivory-text pair
against the WCAG normal-text 4.5:1 minimum — it MUST pass with the
DESIGN.md tokens or the variant degrades to the clay-border default.

## The fixed-right TOC

The postmortem TOC is **not** the sticky-sidebar grid pattern. On wide
screens (≥1100px) it sits in the right margin via fixed positioning,
anchored to the document column:

```css
.vc-toc--fixed-right {
  position: fixed;
  top: var(--vc-space-5, 32px);
  inset-inline-end: max(var(--vc-space-4, 16px),
                         calc(50vw - var(--vc-doc-measure) / 2 - 240px));
  width: 200px;
  font-size: var(--vc-text-1, 14px);
  border-inline-start: 1px solid var(--vc-color-border, #e3dcc9);
  padding-inline-start: var(--vc-space-3, 12px);
}
@media (max-width: 1100px) {
  .vc-toc--fixed-right { display: none; }
}
```

The `max(..., calc(...))` formula keeps the TOC anchored to the
document edge regardless of viewport width.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-danger` | SEV pill background |
| `--vc-color-success` | Resolved pill, mitigated timeline dot |
| `--vc-color-warning` | Impact timeline dot, `vc-action--blocked` |
| `--vc-color-info` | Detection timeline dot |
| `--vc-color-content` | Slate TL;DR background, body text |
| `--vc-color-canvas` | Slate TL;DR text (inverted), normal page bg |
| `--vc-color-on-accent` | SEV/Resolved pill text |
| `--vc-color-surface-sunken` | Default pill background, code panel |
| `--vc-color-border` | Timeline vertical line, table cell border, fixed-TOC border |
| `--vc-font-mono` | All numeric values, pill values, timestamps |
| `--vc-radius-md` | TL;DR card, impact-table cells |

## Composition with other skills

| Section | Embed from |
|---|---|
| Header pill row | `amvcp-prose-pages` (this skill) |
| TL;DR slate variant | `amvcp-prose-pages` |
| Timeline | `amvcp-diagram` (timeline-with-typed-dots primitive) |
| Root-cause diff | `amvcp-code-highlight` (diff with row-tinted bg) |
| Impact table | `amvcp-tables` (right-aligned mono numbers) |
| Action items | `amvcp-prose-pages` + `amvcp-interactive-controls` (checkboxes) |
| Fixed-right TOC | `amvcp-prose-pages` (this skill) |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);     // TOC scroll-spy
// QA matters extra here — wcag-contrast must pass for the slate TL;DR
const report = window.amvcpReportDoc.runGates(document, "INC-2026-0412");
if (!report.ok) {
  console.error("postmortem failed QA, refusing to publish", report);
}
```

## Selection / comment notes

- Each timeline event is selectable (`{type:"timeline-event",
  eventTime:"14:23"}`) so a reviewer can comment "the actual time was
  14:24".
- Each action item is selectable (`{type:"action-item",
  owner:"@bob"}`) so the owner can comment "I cannot meet this due
  date".
- Pills carry `data-ve-id="pill-sev"` so a reviewer can comment "this
  should be SEV-1".
- The slate TL;DR card is a **single selectable unit** — reviewers
  comment on the framing of the summary, not individual words.

## Decision-mini hook

Action items frequently need a decision-mini for owner-assignment or
deadline adjustment:

```html
<div class="ve-decision" data-decision-id="incident-0412-runbook-due">
  <p>Runbook entry — is May 30 realistic given @carol's vacation?</p>
  <button data-choice="keep">Keep May 30</button>
  <button data-choice="push-jun-13">Push to June 13</button>
  <button data-choice="reassign">Reassign to @dave</button>
</div>
```

## Anti-patterns

- **Naming individuals as the cause** — postmortems are blameless.
  Talk about systems, configuration, defaults, missing alerts.
- **Skipping the impact section because "no users complained"** —
  always quantify. Even `$0 revenue impact, 0 customer 5xx` is
  information; an empty impact section signals "we did not check".
- **Action items without owners or due dates** — every action item
  MUST have both, or it never gets done.
- **A single SEV pill in the header without a Resolved / Investigating
  pill** — status is mandatory. Publishing without it implies the
  incident is ongoing.
- **>3 action items per postmortem** — beyond 3, the list becomes a
  wishlist and nothing gets done. If you have 8 candidate actions,
  pick the 3 highest-leverage and defer the rest to a follow-up.
- **An ASCII timeline** — use the typed-dot timeline. ASCII timelines
  do not survive copy-paste and break in screen readers.
- **Embedded video / GIF of the incident** — does not survive offline,
  inflates the file, fails the no-CDN invariant. Use a still SVG of
  the timeline + a code snippet of the actual log line.
- **No fixed-right TOC on a long postmortem** — readers will not scroll
  back to find sections. The TOC pays for itself the first time someone
  says "wait, what was the impact again?".
