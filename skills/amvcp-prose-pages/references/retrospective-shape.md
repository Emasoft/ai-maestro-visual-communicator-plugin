# Retrospective shape — four-quadrant retro + action items

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The four-quadrant grid](#the-four-quadrant-grid)
- [The "extract action items from the quadrant" rule](#the-extract-action-items-from-the-quadrant-rule)
- [The "follow-up to prior retro" section](#the-follow-up-to-prior-retro-section)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The document a team writes after a project / sprint / quarter to capture
what worked, what did not, and what should change. Canonical reference:
master catalog RD-08 (ASCII retro grid evolved into the responsive
quadrant grid below).

Distinct from a `status-report-shape` (which is recurring, descriptive,
auto-generated) and an `incident-postmortem-shape` (which is reactive,
specific to one failure). A retrospective is *deliberative*: the team
sits down together and authors it; the document is the durable artifact
of that conversation.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| End of a project, sprint, or quarter | Recurring status → `status-report-shape` |
| Multi-person input gathered before / during a meeting | Single-author analysis → `compare-n-approaches-shape` |
| Output is a small number of agreed action items | Output is a verdict → `compare-n-approaches-shape` |
| The audience is the team itself + their stakeholders | External-facing report → `whitepaper-shape` |
| Will be referenced in future retrospectives ("we said this last quarter") | One-off debrief → quick Slack thread is fine |

## Section order (fixed)

```
1. HEADER             — project/sprint name, time window, participants
2. CONTEXT            — 1 paragraph of what we set out to do
3. FOUR QUADRANTS     — Went Well / Needs Improvement / Action Items / Open Questions
4. ACTION ITEMS LIST  — extracted from the quadrant, with owners + due dates
5. FOLLOW-UP TO PRIOR — checklist of action items from the last retro
6. PROVENANCE         — attendees + facilitator + scribe + meeting date
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">Retrospective · 2026-Q1</p>
  <h1>Auth team — Q1 retrospective</h1>
  <p class="vc-doc-byline">
    Jan 6 – Mar 28, 2026 ·
    Facilitator: @bob · Scribe: @carol ·
    8 attendees
  </p>
</header>

<section id="context">
  <h2>Context</h2>
  <p>Q1 was the OIDC migration quarter. Two production incidents
     (INC-0412, INC-0498), 47 PRs merged, no missed deploys. Below:
     what we want to keep doing, what we want to change, and what we
     are committing to do next quarter.</p>
</section>

<!-- 3. Four-quadrant retro grid -->
<section id="retro" class="vc-retro">
  <article class="vc-retro-quadrant vc-retro-quadrant--went-well">
    <header><h2><span class="vc-retro-glyph">+</span> Went well</h2></header>
    <ul>
      <li>Pair-programming the OIDC verifier — caught two security bugs
          before they hit main.</li>
      <li>The "no-meeting Friday" experiment held; productivity rose.</li>
      <li>The runbook updates landed before the rollout, not after.</li>
    </ul>
  </article>

  <article class="vc-retro-quadrant vc-retro-quadrant--improve">
    <header><h2><span class="vc-retro-glyph">−</span> Needs improvement</h2></header>
    <ul>
      <li>Two incidents in a quarter — both load-related; need a load
          gate in CI.</li>
      <li>RFC-0231 took 7 weeks from draft to accepted; target is 3.</li>
      <li>Cross-team async handoffs to platform took 2-3 days roundtrip.</li>
    </ul>
  </article>

  <article class="vc-retro-quadrant vc-retro-quadrant--actions">
    <header><h2><span class="vc-retro-glyph">→</span> Action items</h2></header>
    <ul>
      <li>Add a load-test gate to CI (@alice, Q2-W2).</li>
      <li>Add an RFC weekly-review office hour (@bob, Q2-W1).</li>
      <li>Negotiate a 1-day SLA for cross-team auth questions (@carol, Q2-W3).</li>
    </ul>
  </article>

  <article class="vc-retro-quadrant vc-retro-quadrant--questions">
    <header><h2><span class="vc-retro-glyph">?</span> Open questions</h2></header>
    <ul>
      <li>Do we need a dedicated on-call rotation for auth, or stay
          shared with platform?</li>
      <li>Should pair-programming become the default on
          security-critical changes?</li>
    </ul>
  </article>
</section>

<!-- 4. Action items list (extracted from quadrant) -->
<section id="action-items">
  <h2>Commitments for Q2</h2>
  <ul class="vc-action-list">
    <li>
      <input type="checkbox">
      <span class="vc-action-text">Add a load-test gate to CI.</span>
      <span class="vc-action-owner">@alice</span>
      <time class="vc-action-due">Q2-W2 · 2026-04-13</time>
    </li>
    <li>
      <input type="checkbox">
      <span class="vc-action-text">Run weekly RFC-review office hour.</span>
      <span class="vc-action-owner">@bob</span>
      <time class="vc-action-due">Q2-W1 · 2026-04-06</time>
    </li>
    <li>
      <input type="checkbox">
      <span class="vc-action-text">Negotiate cross-team auth-question SLA.</span>
      <span class="vc-action-owner">@carol</span>
      <time class="vc-action-due">Q2-W3 · 2026-04-20</time>
    </li>
  </ul>
</section>

<!-- 5. Follow-up to prior retro -->
<section id="prior-followup">
  <h2>Follow-up: 2025-Q4 action items</h2>
  <ul class="vc-action-list">
    <li><input type="checkbox" checked>
      <span class="vc-action-text">Document the legacy auth path.</span>
      <span class="vc-action-owner">@alice</span>
      <time class="vc-action-due">DONE · 2026-01-22</time></li>
    <li><input type="checkbox" checked>
      <span class="vc-action-text">Add metric for session-create p99.</span>
      <span class="vc-action-owner">@dave</span>
      <time class="vc-action-due">DONE · 2026-02-04</time></li>
    <li><input type="checkbox">
      <span class="vc-action-text">Pair-program the OIDC verifier.</span>
      <span class="vc-action-owner">team</span>
      <time class="vc-action-due">CARRIED — Q2-W1</time></li>
  </ul>
</section>

<footer class="vc-doc-footer">
  Attendees: @alice, @bob, @carol, @dave, @ella, @frank, @gina, @harry ·
  Meeting: 2026-03-31 14:00 CET
</footer>

</article>
```

## The four-quadrant grid

```css
.vc-retro {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--vc-space-4, 16px);
  margin-block: var(--vc-space-5, 32px);
}
@media (max-width: 800px) {
  .vc-retro { grid-template-columns: 1fr; }
}
.vc-retro-quadrant {
  padding: var(--vc-space-4, 16px);
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  min-height: 200px;
}
.vc-retro-quadrant h2 {
  font-size: var(--vc-text-3, 20px);
  margin: 0 0 var(--vc-space-3, 12px);
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-2, 8px);
}
.vc-retro-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--vc-color-surface-sunken, #f1ece0);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-weight: var(--vc-weight-bold, 700);
  font-size: var(--vc-text-2, 16px);
}
.vc-retro-quadrant--went-well .vc-retro-glyph {
  background: color-mix(in srgb, var(--vc-color-success, #3a6b5c) 18%, transparent);
  color: var(--vc-color-success, #3a6b5c);
}
.vc-retro-quadrant--improve  .vc-retro-glyph {
  background: color-mix(in srgb, var(--vc-color-warning, #a8791f) 18%, transparent);
  color: var(--vc-color-warning, #a8791f);
}
.vc-retro-quadrant--actions  .vc-retro-glyph {
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 18%, transparent);
  color: var(--vc-color-accent, #b8861f);
}
.vc-retro-quadrant--questions .vc-retro-glyph {
  background: color-mix(in srgb, var(--vc-color-info, #3464a8) 18%, transparent);
  color: var(--vc-color-info, #3464a8);
}
```

The four glyphs (`+ − → ?`) are intentional — they survive copy-paste
into Slack, plaintext exports, and ASCII renderings. Emoji do not
(and they violate the no-emoji rule of the plugin's anti-slop pass).

## The "extract action items from the quadrant" rule

Action items appearing in the third quadrant are **also** copied to a
proper action-list section underneath, with explicit owners and due
dates. The quadrant gives the team the conversational view; the
action-list gives the next person reading the document a scannable
commitment register.

Without the extraction, action items hide inside the quadrant and
nothing gets done.

## The "follow-up to prior retro" section

Every retrospective MUST surface the prior retro's action items and
mark them done / carried / cancelled. This is the **single most
effective retro discipline**: it forces accountability for last
quarter's commitments before this quarter's commitments are made.

If a retro is the first in a series, this section reads: "No prior
retrospective — this is the first one."

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-success` | "Went well" glyph |
| `--vc-color-warning` | "Needs improvement" glyph |
| `--vc-color-accent` | "Action items" glyph |
| `--vc-color-info` | "Open questions" glyph |
| `--vc-color-surface` | Quadrant card background |
| `--vc-color-surface-sunken` | Glyph background |
| `--vc-color-border` | Quadrant border |
| `--vc-font-mono` | Glyph characters, due dates |
| `--vc-radius-md` | Quadrant cards |

## Composition with other skills

| Section | Embed from |
|---|---|
| Four-quadrant grid | `amvcp-prose-pages` (this skill) |
| Action items checklist | `amvcp-interactive-controls` |
| Stats in context (rare) | `amvcp-charts-and-dashboards` |
| Header byline | `amvcp-prose-pages` (this skill) |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "retro-2026-Q1");
```

## Selection / comment notes

- Each quadrant is selectable as a unit
  (`{type:"retro-quadrant", quadrant:"went-well"}`) so a reader can
  comment on a whole category.
- Each bullet in a quadrant is selectable per `<li>` — readers can
  comment "we should add this to actions, not improve".
- Action items in the extracted list are selectable per row
  (`{type:"action-item", owner:"@alice"}`) — owners can comment
  "I cannot meet this date".
- Prior-retro follow-up items are selectable independently from
  current-retro action items.

## Decision-mini hook

Quadrant items frequently produce a decision-mini for prioritization:

```html
<li>
  Do we need a dedicated on-call rotation for auth, or stay shared
  with platform?
  <div class="ve-decision" data-decision-id="retro-2026Q1-oncall-shape">
    <button data-choice="dedicated">Dedicated auth rotation</button>
    <button data-choice="shared">Stay shared with platform</button>
    <button data-choice="defer">Defer to next retro</button>
  </div>
</li>
```

## Anti-patterns

- **Skipping the prior-retro follow-up section** — without it, the
  retro becomes a ritual with no consequence.
- **Action items without owners** — every action MUST have an
  individual owner (`@alice`, not "team"). Team-owned actions are
  no-one-owned actions.
- **A "Went well" quadrant with 8+ items and a "Needs improvement"
  quadrant with 2** — the retrospective has become a self-congratulation.
  Push back; symmetry is healthier.
- **No "Open questions" quadrant** — every retrospective surfaces
  questions the team did not resolve. Omitting them signals the
  retro was too short.
- **Action items > 5** — beyond 5, the list becomes a wishlist.
  Pick the 3-5 highest-leverage and defer the rest.
- **A retro that contains a single individual's name in a negative
  quadrant** — retros are about systems, not people (same rule as
  postmortems). Reframe as a system problem.
- **No attendees footer** — accountability matters; readers should
  know who participated.
- **Emoji glyphs (`✅` / `❌` / `🔄` / `❓`)** — fail the anti-slop
  pass and break in plaintext. Use the ASCII glyphs.
