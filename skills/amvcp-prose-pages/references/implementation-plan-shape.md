# Implementation-plan all-in-one document shape

The canonical multi-section model for any "what we are going to build and
how" deliverable — proposals, sprint plans, design plans, migration
plans. Lifted from a reference HTML implementation (`html-effectiveness`
demo #16, "implementation-plan") that scored the highest of any single
document in the extended-mining triage. Treat this shape as the default
for `amvcp-generate-visual-plan` output.

The whole point of an implementation-plan document is that **it argues
for itself** — by the time a reader has scrolled top to bottom, every
question they would have asked in a kickoff meeting has been answered
visually. Eight named sections, in a fixed order, each backed by a
primitive that already exists in one of the other 12 element skills.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| The deliverable is "here is what I plan to build, here is why, here is the rollout" | Already-shipped retrospective → `status-report-shape` |
| You have ≥3 milestones, ≥1 data-flow, ≥1 mockup, and ≥1 risk to communicate | Pure ADR → `adr-decision-log-shape` |
| The audience is a peer reviewer who will challenge the design | Pure status → `status-report-shape` |
| You need open-questions explicitly listed so reviewers can answer them | Pure executive summary → `executive-summary-shape` |
| The output needs to support a "no-meeting kickoff" workflow | Bug postmortem → `incident-postmortem-shape` |

## Section order (fixed — do not reorder)

```
1. SUMMARY BAND       — 4 stat cells across the top
2. MILESTONES         — vertical timeline with typed dots
3. DATA-FLOW DIAGRAM  — SVG box-and-arrow, sync vs async paths
4. PAIRED MOCKUPS     — two side-by-side wireframes (before / after, or two surfaces)
5. CODE PANELS        — 2-col layout showing key snippets in context
6. RISK TABLE         — 3-col risk × likelihood × mitigation grid
7. OPEN QUESTIONS     — clay-left-border cards with question + owner
8. PROVENANCE FOOTER  — auto-pill + sources line + generated-at
```

Why this order: the reader is led from "what" (stats) to "when"
(milestones), then "how it moves" (data-flow), then "what it looks
like" (mockups), then "what changes in code" (snippets), then "what
could go wrong" (risks), then "what is not yet decided" (open
questions), then "where this came from" (provenance). Reordering breaks
the question-answer rhythm.

## Markdown scaffold

```markdown
<article class="vc-doc vc-doc--proposal" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">Implementation plan · IMP-2026-0517</p>
  <h1>Task comments — slice 1 (composer + thread + unread digest)</h1>
  <p class="vc-doc-subtitle">2 weeks · 3 packages · 2 new tables · flag <code>task_comments_v1</code></p>
  <p class="vc-doc-byline">Authored by &lt;you&gt; · 2026-05-16</p>
</header>

<!-- Section 1 — summary band -->
<section id="summary">
  <h2><span class="vc-num">01</span> Summary</h2>
  <div class="vc-metrics">
    <div class="vc-metric"><div class="vc-metric-value">~2 wks</div><div class="vc-metric-label">Effort</div></div>
    <div class="vc-metric"><div class="vc-metric-value">3</div><div class="vc-metric-label">Surfaces touched</div></div>
    <div class="vc-metric"><div class="vc-metric-value">2</div><div class="vc-metric-label">New tables</div></div>
    <div class="vc-metric"><div class="vc-metric-value">task_comments_v1</div><div class="vc-metric-label">Feature flag</div></div>
  </div>
</section>

<!-- Section 2 — milestones (typed dots) -->
<section id="milestones">
  <h2><span class="vc-num">02</span> Milestones</h2>
  <!-- per-milestone row: date / dot / body, see milestone-timeline below -->
</section>

<!-- Section 3 — data-flow svg -->
<section id="data-flow">
  <h2><span class="vc-num">03</span> How data flows</h2>
  <!-- inline SVG: rectangles for services, sync = solid, realtime = dashed -->
  <!-- see embedded-svg-diagram-conventions for the marker-def pattern -->
</section>

<!-- Section 4 — paired mockups -->
<section id="mockups">
  <h2><span class="vc-num">04</span> What it looks like</h2>
  <div class="vc-mockups">
    <div class="vc-mockup">…thread on a task card…</div>
    <div class="vc-mockup">…sidebar unread digest…</div>
  </div>
</section>

<!-- Section 5 — code panels -->
<section id="code">
  <h2><span class="vc-num">05</span> Where to focus in code</h2>
  <!-- numbered cards: each pairs a prose paragraph with a code snippet -->
</section>

<!-- Section 6 — risk table -->
<section id="risks">
  <h2><span class="vc-num">06</span> Risks &amp; mitigations</h2>
  <table>
    <thead><tr><th>Risk</th><th>Likelihood</th><th>Mitigation</th></tr></thead>
    <tbody>
      <tr><td>Comment thread becomes the chat product</td><td>med</td><td>Hard cap at 200 chars; no avatars on bubbles</td></tr>
    </tbody>
  </table>
</section>

<!-- Section 7 — open questions -->
<section id="open-questions">
  <h2><span class="vc-num">07</span> Open questions</h2>
  <article class="vc-callout vc-callout--note">
    <div class="vc-callout-glyph" aria-hidden="true"></div>
    <div class="vc-callout-body">
      <p class="vc-callout-title">Do unread digests count toward the daily-quota?</p>
      <p>Decide with @design before slice 2 — affects the cost model.</p>
    </div>
  </article>
</section>

<!-- Section 8 — provenance footer -->
<footer class="vc-doc-footer">
  <span class="vc-auto-pill">auto-generated</span>
  <span class="vc-sources">Sources: git log main..HEAD · CI dashboard · deploy log</span>
  <span class="vc-generated">generated 2026-05-16 17:42</span>
</footer>

</article>
```

## Lib functions called

The implementation-plan shape is a **composition contract** — no single
function in `amvcp-report-doc.js` builds the whole page; the agent
authors the eight sections and the runtime supplies the document
chrome:

| Step | Lib call | What it does |
|---|---|---|
| Pick the template | `<article class="vc-doc vc-doc--proposal">` | Sets the reading measure to 66ch — `TEMPLATES` exports the 6 names |
| Inject the CSS | `amvcpReportDoc.injectReportDocCSS(document)` | Adds the `vc-doc` / `vc-metric` / `vc-callout` / `vc-rubric` / `vc-toc` rules — idempotent |
| Wire the scroll-spy | `amvcpReportDoc.init(document)` | Adds `.vc-toc-active` to the visible section's TOC link — auto-fires on `DOMContentLoaded` |
| Re-scan after dynamic insert | `amvcpReportDoc.refresh(document)` | Disconnects + rebuilds the IntersectionObserver |
| Run output QA | `amvcpReportDoc.runGates(document, "imp-2026-0517")` | 7-gate check before handing the page back — see `output-qa-pipeline-7-gates` |

## DESIGN.md tokens consumed

The implementation-plan shape is **theme-blind by design** — it reads
the same `--vc-*` tokens every other report-doc piece uses:

| Token | Used in section | Effect |
|---|---|---|
| `--vc-color-canvas` | doc background | Page color |
| `--vc-color-content` | body text | Reading color |
| `--vc-color-content-muted` | byline, subtitle, captions | Secondary text |
| `--vc-color-accent` | section numbers, "open question" border, callout `note` | The signature highlight |
| `--vc-color-success` | "done" milestone dot, `tip` callout | Mitigated / completed signal |
| `--vc-color-warning` | "in progress" milestone dot, `warning` callout | Attention without alarm |
| `--vc-color-danger` | "blocked" milestone dot, `danger` callout | Hard stop |
| `--vc-color-info` | metric value highlights, `info` callout | Neutral fact emphasis |
| `--vc-color-surface` | metric cards, mockup backgrounds | Raised plane |
| `--vc-color-surface-sunken` | TOC card, code panel backgrounds | Recessed plane |
| `--vc-color-border` | metric border, table cell border, callout border | Hairline structure |
| `--vc-text-1`…`--vc-text-6` | scale | All body / heading sizes |
| `--vc-font-heading` / `--vc-font-body` / `--vc-font-mono` | type stack | Tri-font discipline (heading = serif, body = sans, mono = labels/code) |
| `--vc-space-1`…`--vc-space-6` | spacing | All gaps / paddings / margins |
| `--vc-radius-md` | metric, callout, TOC, code panel | 8px corners |

Switching the DESIGN.md theme reskins the whole document without
re-rendering — the page reads the tokens live via `getComputedStyle`.

## Composition with the 12 element skills

The implementation-plan shape is **the canonical compositional
deliverable**: it embeds 7 of the 12 element skills as sub-blocks. The
table below tells the agent which skill to reach for at each section.

| Section | Embedded skill | What it renders |
|---|---|---|
| Summary band | `amvcp-charts-and-dashboards` (metric-card primitive) | The 4 stat cells via `<div class="vc-metric">` |
| Milestones | `amvcp-diagram` (timeline primitive) | Vertical timeline; typed dots for done/in-progress/blocked |
| Data-flow | `amvcp-graph-diagrams` or `amvcp-diagram` | SVG box-and-arrow with `<marker>` defs for solid/dashed paths |
| Paired mockups | `amvcp-wireframe` | Two cards rendered in grayscale wireframe mode |
| Code panels | `amvcp-code-highlight` | Slate-bg code blocks with `--code-*` token highlight |
| Risk table | `amvcp-tables` | 3-col grid with severity-pill cells (see `metadata-keypill-strip`) |
| Open questions | `amvcp-prose-pages` (callout) | `<article class="vc-callout vc-callout--note">` per question |

Sections the agent SHOULD NOT add: a chart of "tasks per developer over
time" (that is a `status-report-shape` artifact), animated transitions
(unless reduced-motion-safe; reach for `amvcp-animation`).

## Selection / comment notes

- Wrap the article in `data-ve-prose` so every paragraph gets a numeric
  id and is independently selectable (`{kind:"element",
  type:"paragraph"}`).
- Each section is its own `<section id="...">` — clicking a section
  heading sends `{kind:"element", type:"section", sectionId:"summary"}`.
- Open-question callouts are selectable as a unit so a reviewer can
  comment "here is the answer to question #3" without highlighting the
  body text.
- The provenance footer is **not** selectable — it is decoration. Add
  `data-ve-omit-selection` on the `<footer>` to suppress.

## Decision-mini hook

A decision-mini block can sit at the top of section 7 (Open questions):

```html
<div class="ve-decision" data-decision-id="task_comments_v1-shape">
  <p>Should comment threads support emoji reactions?</p>
  <button data-choice="yes-deferred">Yes, but later</button>
  <button data-choice="no">No, hard cap</button>
  <button data-choice="defer">Defer to slice 2</button>
</div>
```

…answered by the reviewer in-context. See
`../../../amvcp-modal-comments/SKILL.md` for the runtime contract.

## Verification

After authoring, run the QA pipeline:

```js
const report = window.amvcpReportDoc.runGates(document, "imp-2026-0517");
console.assert(report.ok, "QA failed", report.gates.filter(g => g.status === "FAIL"));
```

For visual verification (light + dark + print), see
`skills/amvcp-self-debug-rules/SKILL.md`.

## Anti-patterns

- **Reordering the 8 sections** — the question-answer rhythm breaks.
- **>1 pull-quote per page** — implementation plans are not editorial;
  one pull-quote is enough to highlight the headline risk.
- **A "results" or "outcomes" section** — this is a *plan*, not a
  retrospective. Move post-rollout discussion to a sibling document
  using `status-report-shape`.
- **Hand-numbering the section headings** — the whitepaper template's
  CSS counter (`counter(vc-sec, decimal-leading-zero)`) does this
  automatically, and the section-number eyebrow (`<span class="vc-num">`)
  uses a separate counter. Hand-numbers collide.
- **Embedding a live event-stream dashboard** — that is `RD-10` and a
  *separate runtime* (EventSource). Implementation plans are static.
- **A "team" section with avatars** — implementation plans focus on
  the work, not the workers. Authors go in the byline; reviewers go in
  the open-question owner footer.
