# Action items checklist (`vc-action-list`)

## Table of Contents

- [When to use](#when-to-use)
- [Scaffold (canonical 4-column row)](#scaffold-canonical-4-column-row)
- [CSS contract](#css-contract)
- [State modifiers](#state-modifiers)
- [Owner discipline](#owner-discipline)
- [Due-date discipline](#due-date-discipline)
- [Composition](#composition)
- [Lib hooks](#lib-hooks)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The structured commitment register that ends action-producing
documents (postmortems, retrospectives, PR reviews, RFCs). Each item
is a `[ checkbox ] [text] [owner] [due-date]` row. Owners and due
dates are mandatory; without them, action items are wishlist
entries.

The action-items checklist is the **only checkbox primitive in the
report-doc skill**. Unlike the test-plan checklist in a PR writeup
(which records what WAS tested), action items record what WILL be
done. They survive across documents (the next retro re-renders them
in the "Follow-up to prior retro" section).

## When to use

| Use action items | Use something else |
|---|---|
| Document needs to commit to specific future work | Document is descriptive only → no action items |
| Each action has an owner and due date | Tasks are TBD → use open-questions instead |
| Items will be tracked in subsequent documents | One-shot "remember this" → use a callout |
| ≤7 items per document | 8+ items → split into multiple documents |

For "do this someday" notes, use a `note` callout instead. Action
items are for explicit commitments.

## Scaffold (canonical 4-column row)

```html
<ul class="vc-action-list">
  <li class="vc-action vc-action--done">
    <input type="checkbox" checked>
    <span class="vc-action-text">Add jitter to TTL (PR #4823, merged).</span>
    <span class="vc-action-owner">@alice</span>
    <time class="vc-action-due">DONE · 2026-05-16</time>
  </li>
  <li class="vc-action">
    <input type="checkbox">
    <span class="vc-action-text">Add a circuit breaker on warm-up fan-out.</span>
    <span class="vc-action-owner">@bob</span>
    <time class="vc-action-due">2026-05-23</time>
  </li>
  <li class="vc-action vc-action--blocked">
    <input type="checkbox">
    <span class="vc-action-text">Runbook entry for cache stampede recovery.</span>
    <span class="vc-action-owner">@carol</span>
    <time class="vc-action-due">BLOCKED · waiting on @dave</time>
  </li>
</ul>
```

## CSS contract

```css
.vc-action-list {
  list-style: none;
  margin: var(--vc-space-3, 12px) 0;
  padding: 0;
}
.vc-action {
  display: grid;
  grid-template-columns: 24px 1fr auto auto;
  gap: var(--vc-space-3, 12px);
  align-items: baseline;
  padding-block: var(--vc-space-2, 8px);
  border-block-start: 1px solid var(--vc-color-border, #e3dcc9);
  font-size: var(--vc-text-1, 14px);
}
.vc-action:first-child { border-block-start: none; }
.vc-action input[type="checkbox"] {
  margin: 0;
  align-self: center;
  accent-color: var(--vc-color-accent, #b8861f);
}
.vc-action-text {
  min-width: 0;
}
.vc-action-owner {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  color: var(--vc-color-content-muted, #5b5343);
  white-space: nowrap;
}
.vc-action-due {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-subtle, #8a8170);
  white-space: nowrap;
}

/* State modifiers */
.vc-action--done .vc-action-text {
  text-decoration: line-through;
  color: var(--vc-color-content-muted, #5b5343);
}
.vc-action--done .vc-action-due { color: var(--vc-color-success, #3a6b5c); }
.vc-action--blocked .vc-action-due {
  color: var(--vc-color-warning, #a8791f);
  font-weight: var(--vc-weight-bold, 700);
}
.vc-action--overdue .vc-action-due {
  color: var(--vc-color-danger, #a84a32);
  font-weight: var(--vc-weight-bold, 700);
}

/* Mobile — stack the row */
@media (max-width: 600px) {
  .vc-action {
    grid-template-columns: 24px 1fr;
    gap: var(--vc-space-2, 8px);
  }
  .vc-action-owner, .vc-action-due {
    grid-column: 2;
    font-size: var(--vc-text-0, 11px);
  }
}
```

## State modifiers

| Modifier | When | Visual cue |
|---|---|---|
| (none) | Active, on track | Default styling |
| `--done` | Completed | Strikethrough text, success-color due-date |
| `--blocked` | Waiting on external dependency | Warning-color due-date with "BLOCKED" prefix |
| `--overdue` | Past due-date, not done | Danger-color due-date |
| `--carried` | Rolled forward to next cycle | Default styling, due-date shows "CARRIED — next cycle" |
| `--cancelled` | Decided not to do | Strikethrough text, due-date shows "CANCELLED" |

The modifiers are **author-applied**, not auto-computed. The
runtime does not check the current date against the due-date — that
would change the rendering depending on when the page is loaded,
which makes the document non-deterministic.

## Owner discipline

| Good owner | Bad owner |
|---|---|
| `@alice` | `Alice Smith` (long, parses as text) |
| `@alice (auth team)` | `Auth team` (no individual accountability) |
| `@platform-team` | `team` (which team?) |
| `@dave (acting for @alice on leave)` | `?` (no owner) |

Every action MUST have an `@`-prefixed handle. Non-handle owners
parse as plain text and break searches. Anonymous "TBD" or `?`
ownership signals the action is not committed.

## Due-date discipline

| Good due-date | Bad due-date |
|---|---|
| `2026-05-23` (ISO date) | `5/23` (locale-ambiguous, year-stripped) |
| `Q2-W3 · 2026-05-20` (sprint week + ISO date) | `next sprint` (vague) |
| `EOQ` + footer note "EOQ = end of Q2 = 2026-06-30" | `soon` (no commitment) |
| `DONE · 2026-05-16` | `Yesterday` |
| `CARRIED — Q2-W1` (previous-retro followup) | (empty) |

Due-dates accept slight latitude (sprint-week notation, "EOQ" with
a footer definition) but MUST be unambiguous to a reader who does
not know the team's calendar.

## Composition

| Containing shape | Action items typical placement |
|---|---|
| `incident-postmortem-shape` | Section 6 — the canonical home; the postmortem's exit |
| `retrospective-shape` | Section 4 — extracted from the third quadrant |
| `pr-review-reviewer-side-shape` | "Suggested next steps" section — usually nits |
| `pr-writeup-author-side-shape` | "Test plan" section — what was tested + what was NOT |
| `rfc-shape` | "Unresolved questions" section — sometimes structured as actions |
| `feature-explainer-shape` | Rare — feature explainers are descriptive |
| `implementation-plan-shape` | Rare — milestones serve this role |
| `status-report-shape` | Rare — status reports look backward |

The single most important practice is the **follow-up checklist** in
`retrospective-shape`: every retro re-renders the prior retro's
action items as a checklist marked with their current status. This
forces accountability across cycles.

## Lib hooks

The action-list does NOT have a runtime helper in
`amvcp-report-doc.js` — it is pure HTML/CSS. If you want
checkbox-state persistence (the user can check items and the state
survives a refresh), embed the action-list inside an
`amvcp-interactive-controls`-managed `<form>` and use that skill's
persistence helper.

For JSON export of action items (for downstream task-tracker
integration), implement a small helper:

```js
function exportActionItems(doc) {
  return Array.from(doc.querySelectorAll('.vc-action')).map(li => ({
    text:   li.querySelector('.vc-action-text')?.textContent.trim(),
    owner:  li.querySelector('.vc-action-owner')?.textContent.trim(),
    due:    li.querySelector('.vc-action-due')?.textContent.trim(),
    done:   li.classList.contains('vc-action--done'),
    blocked: li.classList.contains('vc-action--blocked'),
    overdue: li.classList.contains('vc-action--overdue')
  }));
}
```

…feeds into Linear / GitHub Issues / Jira by the orchestrator.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Checkbox accent color |
| `--vc-color-success` | Done due-date |
| `--vc-color-warning` | Blocked due-date |
| `--vc-color-danger` | Overdue due-date |
| `--vc-color-content-muted` | Owner color, done strikethrough |
| `--vc-color-content-subtle` | Default due-date |
| `--vc-color-border` | Row dividers |
| `--vc-font-mono` | Owner, due-date |
| `--vc-text-1` | Default size |
| `--vc-text-0` | Due-date size, mobile fallback |

## Selection / comment notes

- Each action item is selectable as a unit
  (`{type:"action-item", owner:"@alice"}`) — most common comment
  is "I cannot meet this due date".
- The action-text is selectable independently.
- The owner is selectable independently — useful for "reassign"
  comments.
- The due-date is selectable independently.
- The whole `<ul class="vc-action-list">` is selectable as a unit
  for "this list is missing X" comments.

## Decision-mini hook

Action items frequently host a decision-mini for owner-assignment or
deadline adjustment:

```html
<li class="vc-action">
  <input type="checkbox">
  <span class="vc-action-text">Runbook entry for cache stampede.</span>
  <span class="vc-action-owner">@carol</span>
  <time class="vc-action-due">2026-05-30</time>
  <div class="ve-decision" data-decision-id="action-runbook-due">
    <button data-choice="keep">Keep May 30</button>
    <button data-choice="push-2w">Push to June 13</button>
    <button data-choice="reassign">Reassign to @dave</button>
  </div>
</li>
```

## Anti-patterns

- **Action items without owners** — every action MUST have a
  handle. Team-owned ("everyone") = no-one-owned.
- **Action items without due dates** — same problem; the action
  becomes wishlist.
- **Vague action text** ("Improve auth", "Look into rate limiting")
  — every action MUST be concrete. "Add a load-test gate to CI" is
  a real action; "Improve testing" is not.
- **>7 action items per document** — beyond 7 the list becomes a
  wishlist. Pick the highest-leverage and defer the rest.
- **Pre-checking all items in a postmortem** — the postmortem is
  the COMMITMENT moment; checking items as "done" means the
  postmortem is being written after the fact, which is a different
  practice.
- **A "vc-action--cancelled" item that's been there for 3 retros**
  — cancelled items disappear after one cycle. If still relevant,
  reactivate with a new due-date.
- **Owner with no `@`** — breaks search and signals informal /
  unofficial ownership.
- **Date in the past with no `--done` modifier** — implies the
  action was missed without acknowledging it. Either mark
  `--overdue` (and explain) or mark `--carried`.
- **Action items as bullet points (no checkboxes)** — checkboxes
  signal "this is trackable"; bullets signal "this is prose". Use
  the right primitive.
- **No follow-up section in the next retro** — actions disappear
  into the void; the retro discipline collapses.
