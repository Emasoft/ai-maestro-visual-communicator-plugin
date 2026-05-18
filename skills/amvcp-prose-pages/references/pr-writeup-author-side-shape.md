# PR-writeup (author-side) shape — TL;DR + before/after + file tour + rollout strip

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The before/after panel pair](#the-beforeafter-panel-pair)
- [The rollout strip (shared borders)](#the-rollout-strip-shared-borders)
- [Reading-order file tour vs alphabetical](#reading-order-file-tour-vs-alphabetical)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The author-facing companion to `pr-review-reviewer-side-shape.md`: the
*author's writeup of their own PR*, distinct from the GitHub PR
description (which is usually a brief paragraph). Canonical reference:
`html-effectiveness` demo #17, "pr-writeup".

The PR writeup is the author's argument for the change — it says
*why* before *what*, paints a clear before/after, walks the reviewer
through the files in **reading order** (not alphabetical), and ends with
a concrete rollout plan that pre-empts "are you sure this is safe?"
questions.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| Author publishing a substantial PR (>5 files, architectural change) | Trivial PR (≤3 files) → just write a GitHub PR description |
| You want to walk reviewers through the change in a specific reading order | Code review of someone else's PR → `pr-review-reviewer-side-shape` |
| Performance/behaviour change with measurable before/after | Pure refactor with no behaviour change → shorter prose page is fine |
| Rollout has stages (% canary, kill-switch, etc.) | Single-deploy bug fix → no rollout strip needed |
| You will publish the writeup to a wiki/blog as well as the PR | Internal review only → use the GitHub PR description |

## Section order (fixed)

```
1. TL;DR CARD            — clay-left-border, leading paragraph that says everything
2. WHY (before/after)    — two side-by-side panels: Before / After, each with bullets + metric
3. FILE TOUR             — <details> blocks in reading order: worker → call-site → plumbing
4. WHERE TO FOCUS        — 3-5 numbered cards highlighting the trickiest changes
5. TEST PLAN             — checklist of what was tested + what was NOT tested + why
6. ROLLOUT STRIP         — 3-step shared-border horizontal pipeline (Day 0 / Day 2 / Day 4)
7. PROVENANCE            — branch sha, links to issue / RFC / runbook
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--proposal" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">PR writeup · #4821 · by @alice</p>
  <h1>Switch session creation to OIDC token exchange</h1>
</header>

<!-- 1. TL;DR -->
<aside class="vc-tldr">
  <p class="vc-tldr-eyebrow">TL;DR</p>
  <p>OIDC token exchange replaces the legacy session table. New endpoints
     live behind the <code>auth_v2</code> flag (default OFF in prod);
     legacy_sessions mirrors writes for 30 days for rollback.
     <strong>p99 session-create latency: 1.4s → 180ms.</strong></p>
</aside>

<!-- 2. Why — before / after panels -->
<section id="why">
  <h2>Why</h2>
  <div class="vc-beforeafter">
    <div class="vc-beforeafter-panel vc-beforeafter-panel--before">
      <h3>Before</h3>
      <ul>
        <li>Session creation hits Postgres on every login.</li>
        <li>Token validation requires a round-trip to Redis.</li>
        <li>p99 latency 1.4s under peak load.</li>
      </ul>
      <p class="vc-beforeafter-metric">p99: <strong>1.4s</strong></p>
    </div>
    <div class="vc-beforeafter-panel vc-beforeafter-panel--after">
      <h3>After</h3>
      <ul>
        <li>OIDC token signed locally; no DB write on common path.</li>
        <li>Token validation is local JWT verify.</li>
        <li>p99 latency drops to 180ms in load test.</li>
      </ul>
      <p class="vc-beforeafter-metric">p99: <strong>180ms</strong></p>
    </div>
  </div>
</section>

<!-- 3. File tour in READING ORDER (not alphabetical) -->
<section id="file-tour">
  <h2>File tour (read in this order)</h2>

  <details open>
    <summary>
      <span class="vc-file-chevron"></span>
      <code class="vc-diff-path">src/auth/oidc.ts</code>
      <span class="vc-pill vc-pill--new">new</span>
      <span class="vc-diffstat"><span class="vc-add">+187</span></span>
    </summary>
    <p>The worker. Token exchange logic lives here…</p>
    <pre class="vc-diff">… diff …</pre>
  </details>

  <details>
    <summary>
      <span class="vc-file-chevron"></span>
      <code class="vc-diff-path">src/auth/session.ts</code>
      <span class="vc-pill vc-pill--mod">mod</span>
      <span class="vc-diffstat"><span class="vc-add">+42</span>
        <span class="vc-del">−87</span></span>
    </summary>
    <p>The call-site. Replaces the old <code>createSession</code> path with
       a thin shim that delegates to oidc.ts.</p>
    <pre class="vc-diff">… diff …</pre>
  </details>

  <details>
    <summary>
      <span class="vc-file-chevron"></span>
      <code class="vc-diff-path">src/migrate/legacy.ts</code>
      <span class="vc-pill vc-pill--new">new</span>
      <span class="vc-diffstat"><span class="vc-add">+72</span></span>
    </summary>
    <p>The plumbing. 30-day mirror write so we can rollback…</p>
    <pre class="vc-diff">… diff …</pre>
  </details>
</section>

<!-- 4. Where to focus (3-5 numbered focus cards) -->
<section id="focus">
  <h2>Where to focus</h2>
  <ol class="vc-focus-cards">
    <li>
      <span class="vc-focus-num">01</span>
      <h3><code>oidc.ts:exchangeToken</code></h3>
      <p>Network call with no timeout — reviewer @bob flagged in his review;
         <code>withTimeout(5000)</code> follow-up planned.</p>
    </li>
    <li>
      <span class="vc-focus-num">02</span>
      <h3><code>legacy.ts:mirrorWrite</code></h3>
      <p>Best-effort mirror; logs errors but never throws.
         If this writes the wrong shape, the 30-day rollback loses data.</p>
    </li>
    <li>
      <span class="vc-focus-num">03</span>
      <h3>Flag default</h3>
      <p><code>auth_v2</code> is OFF by default in prod;
         per-environment override via <code>OIDC_PHASE_2</code> env var.</p>
    </li>
  </ol>
</section>

<!-- 5. Test plan -->
<section id="test-plan">
  <h2>Test plan</h2>
  <ul class="vc-action-list">
    <li><input type="checkbox" checked> Unit tests for token exchange (12 cases).</li>
    <li><input type="checkbox" checked> Integration test against the OIDC sandbox provider.</li>
    <li><input type="checkbox" checked> Load test at 2× peak — see linked Grafana dashboard.</li>
    <li><input type="checkbox"> NOT tested: token revocation across regions
        (deferred to slice 2 — flagged in RFC-0231).</li>
  </ul>
</section>

<!-- 6. Rollout strip — 3 steps, shared borders -->
<section id="rollout">
  <h2>Rollout</h2>
  <ol class="vc-rollout-strip">
    <li class="vc-rollout-step">
      <span class="vc-rollout-day">Day 0</span>
      <span class="vc-rollout-pct">internal</span>
      <p>Flag enabled for the auth team's own logins; monitored for 24h.</p>
    </li>
    <li class="vc-rollout-step">
      <span class="vc-rollout-day">Day 2</span>
      <span class="vc-rollout-pct">10%</span>
      <p>Canary 10% of new sessions; old path still receives 90%.</p>
    </li>
    <li class="vc-rollout-step">
      <span class="vc-rollout-day">Day 4</span>
      <span class="vc-rollout-pct">100%</span>
      <p>Full rollout; legacy session-creation path removed in 7-day follow-up PR.</p>
    </li>
  </ol>
</section>

<!-- 7. Provenance -->
<footer class="vc-doc-footer">
  Issue <a href="#">AUTH-512</a> ·
  RFC <a href="#">RFC-0231</a> ·
  Runbook <a href="#">RB-0042 (rollback)</a>
</footer>

</article>
```

## The before/after panel pair

Two side-by-side panels. The "Before" panel has standard styling; the
"After" panel gets an olive border to mark the win.

```css
.vc-beforeafter {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--vc-space-4, 16px);
  margin-block: var(--vc-space-5, 32px);
}
@media (max-width: 800px) {
  .vc-beforeafter { grid-template-columns: 1fr; }
}
.vc-beforeafter-panel {
  padding: var(--vc-space-4, 16px);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface, #ffffff);
}
.vc-beforeafter-panel--after {
  border-color: var(--vc-color-success, #3a6b5c);
}
.vc-beforeafter-panel--before ul li::marker { color: var(--vc-color-content-subtle, #8a8170); }
.vc-beforeafter-panel--after  ul li::marker { color: var(--vc-color-success, #3a6b5c); }
.vc-beforeafter-metric {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-2, 16px);
  color: var(--vc-color-content-muted, #5b5343);
}
.vc-beforeafter-metric strong { color: var(--vc-color-content, #1f1a14);
                                font-size: var(--vc-text-3, 20px); }
```

## The rollout strip (shared borders)

Three horizontal cards with **shared borders** — first child has
`border-radius: 12px 0 0 12px`, last child `0 12px 12px 0`, middle has
`border-inline-start: none`. Visually reads as one connected pipeline
without arrows.

```css
.vc-rollout-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  margin: var(--vc-space-5, 32px) 0;
  padding: 0;
}
.vc-rollout-step {
  border: 1px solid var(--vc-color-border, #e3dcc9);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  background: var(--vc-color-surface, #ffffff);
}
.vc-rollout-step:first-child  { border-radius: var(--vc-radius-md, 8px) 0 0 var(--vc-radius-md, 8px); }
.vc-rollout-step:last-child   { border-radius: 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0; }
.vc-rollout-step:not(:first-child) { border-inline-start: none; }
.vc-rollout-day {
  display: block;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
}
.vc-rollout-pct {
  display: block;
  font-size: var(--vc-text-4, 24px);
  font-weight: var(--vc-weight-bold, 700);
  margin-block: var(--vc-space-1, 4px);
}
@media (max-width: 680px) {
  .vc-rollout-strip { grid-template-columns: 1fr; }
  .vc-rollout-step:first-child  { border-radius: var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0 0; }
  .vc-rollout-step:last-child   { border-radius: 0 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px); }
  .vc-rollout-step:not(:first-child) { border-inline-start: 1px solid var(--vc-color-border, #e3dcc9);
                                       border-block-start: none; }
}
```

The shared-border trick is a brilliant compact alternative to a
flowchart for linear processes — adopt for any 2-5 step pipeline.

## Reading-order file tour vs alphabetical

The single most common author-side mistake is sorting files
alphabetically. **Do not.** Sort by reading order: worker first
(the new code that does the actual work), then call-site (what was
changed in existing code to use the worker), then plumbing
(migrations, factories, config), then docs/tests last.

A reader who follows alphabetical order misunderstands the change.
A reader who follows reading order builds the same mental model the
author has.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | TL;DR border, focus-card number |
| `--vc-color-success` | After-panel border + bullets, "checked" checkbox |
| `--vc-color-content-subtle` | Before-panel bullets, rollout-day eyebrow |
| `--vc-color-surface` | All panel backgrounds |
| `--vc-color-border` | Panel borders, rollout step borders |
| `--vc-font-mono` | File paths, metrics, rollout day labels |
| `--vc-radius-md` | All cards |

## Composition with other skills

| Section | Embed from |
|---|---|
| TL;DR card | `amvcp-prose-pages` (this skill) — see `tldr-summary-card` |
| Before/after panels | `amvcp-layout` (2-col grid) + `amvcp-prose-pages` |
| File tour `<details>` | `amvcp-interactive-controls` (disclosure widgets) |
| Diff blocks inside | `amvcp-code-highlight` (diff subgrid) |
| Focus cards | `amvcp-layout` (numbered card list) |
| Test-plan checklist | `amvcp-interactive-controls` |
| Rollout strip | `amvcp-diagram` (shared-border step primitive) |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "pr-4821-writeup");
// Test-plan checkboxes are runtime-interactive; if you persist their state,
// reach for amvcp-interactive-controls' persistence helper.
```

## Selection / comment notes

- The TL;DR card is selectable as a unit so reviewers can comment on
  the headline framing.
- Each before/after panel is selectable independently
  (`{type:"beforeafter-panel", side:"after"}`).
- Each focus card is selectable
  (`{type:"focus-card", focusNum:"02"}`) so a reviewer can flag "this
  is not the trickiest part".
- Test-plan items are selectable per `<li>` (paragraph-numbered as
  `data-ve-prose` children).
- Each rollout step is selectable
  (`{type:"rollout-step", day:"Day 2"}`) so a reviewer can comment
  "the 10% canary should be longer".

## Decision-mini hook

Rollout steps frequently need a stage-extension decision:

```html
<div class="ve-decision" data-decision-id="rollout-4821-canary-extend">
  <p>Canary at 10% — long enough?</p>
  <button data-choice="ship">Ship at 100% on Day 4</button>
  <button data-choice="extend-2d">Extend canary 2 days</button>
  <button data-choice="extend-7d">Extend canary 7 days (low-risk)</button>
</div>
```

## Anti-patterns

- **Alphabetical file tour** — see above; reading order matters.
- **No "NOT tested" item in the test plan** — every PR has untested
  cases. Listing them explicitly is honest and useful; hiding them
  invites reviewer paranoia.
- **A "Conclusion" or "Wrap-up" paragraph** — the TL;DR is the
  conclusion. A second one dilutes it.
- **Before/after panels with different bullet counts** — symmetry is
  the point. If you have 3 before-bullets, write 3 after-bullets.
- **A focus card per file** — focus cards highlight TRICKY changes,
  not every file. Cap at 5.
- **Rollout strip with 1 or >5 steps** — 1 step is not a rollout, just
  a deploy (omit the section); >5 is too granular (collapse to days
  or phases).
- **Test-plan checkboxes all pre-checked** — the unchecked items are
  the future work. Pre-checking everything signals "I am done", which
  is rarely true.
- **No flag default mentioned** — every PR behind a flag MUST state
  the default. The reviewer's first question is "what happens when
  this merges?".
