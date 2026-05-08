# TRDD-7a2dab03 — Per-element approve / reject / skip decision

**TRDD ID:** `7a2dab03-9350-458d-b4c2-7dad165018b9`
**Filename:** `design/tasks/TRDD-7a2dab03-9350-458d-b4c2-7dad165018b9-per-element-decision.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)
**Status:** Done (2026-05-08) — phases 2-7 implemented; phase 8 owned by `publish.py`
**Depends on:** TRDD-eff1aa87 (interactive agent reports — v1 inline threads, v2 modal threads)

## 1. Original user request (verbatim)

> what is the command or skill to use for visualizing the agents reports and
> set the checkbox on each paragraph/point/row so claude knows what i
> approved and what not?

Follow-up after I explained the existing v2 modal-comment thread is
free-text, not structured:

> yes, do it.. the comment/chat area is to ask clarifications, but the
> result is to approve/reject/skip the item

## 2. Problem and goal

The v2 modal-comment thread (TRDD-eff1aa87 §6) lets the user write free-text
replies per finding/element. Claude has to *interpret* whether the text
means "approved", "rejected", or "ignore". For agent-report iteration loops
where the user reviews dozens of findings, free-text interpretation is:

- **Lossy** — Claude may misread "looks fine but rename X" as approve when
  the user wants "approve only after renaming".
- **Verbose** — the user types "yes ok" 30 times to approve a long report.
- **Hard to summarise** — there is no machine-readable count of how many
  findings the user actually accepted vs rejected.

**Goal**: each finding/anchor gets a **3-state decision pill**
(approve / reject / skip) alongside the comment thread. The thread stays
free-text for **clarifications**; the pill is the **outcome signal** that
Claude reads first when processing the report.

The decision pill should default to `skip` (no opinion yet — same effect as
not interacting with the finding) so that opening a report does not
implicitly approve everything.

## 3. Design

### 3.1 UI placement

Per-finding decision pill goes **next to the comment-pill** the v2 modal
already injects (TRDD-eff1aa87 §6.5). Layout:

```
                        ┌────────────────────────────────┐
## Finding 3 …          │ [ approve ] [ reject ] [ skip ]│
                        │                                │
                        │ [ ✎ comment ]                  │
                        └────────────────────────────────┘
```

- Three-radio fieldset, segmented-control style. Only one selection per
  finding. Default state: `skip` (radio's `checked` attr).
- The existing `[ ✎ comment ]` pill stays — it opens the modal as today.
- The decision is independent of the modal: changing the radio does NOT
  open the modal; opening the modal does NOT change the decision.

### 3.2 Decision state lives in the queue payload

The v2 runtime writes one JSONL line per turn into `.ve-comments/`. The
schema gains an optional `decision` key on every line:

```json
{
  "threadId": "abc123",
  "anchorId": "ve-finding-3",
  "turn": 1,
  "role": "user",
  "text": "could you rename frob() to handleFrob?",
  "decision": "approve",
  "ts": 1746724800
}
```

- `decision` ∈ `{"approve", "reject", "skip"}`.
- The decision is the **current state at the time of the turn write**.
- If the user changes the decision later WITHOUT writing a new comment, a
  decision-only turn is appended (`role: "user"`, `text: ""`,
  `decision: "<new>"`) so the orchestrator's reply loop sees the change.
- If the user never opens the comment modal but flips the decision pill,
  one decision-only turn is written.

### 3.3 Idempotent decision-only turns

A decision-only turn is suppressed if the previous user turn for the same
`threadId` already has the same `decision` value AND empty `text`. This
keeps the queue clean when the user clicks the same radio twice.

### 3.4 Renderer change (`render-interactive-report.py`)

Per finding, emit a `<fieldset class="ve-decision">` immediately before the
existing comment-pill anchor:

```html
<fieldset class="ve-decision" data-anchor-id="ve-finding-3">
  <legend class="ve-sr-only">Decision for finding 3</legend>
  <input type="radio" id="dec-3-approve" name="dec-3" value="approve">
  <label for="dec-3-approve" class="ve-dec-approve">approve</label>
  <input type="radio" id="dec-3-reject" name="dec-3" value="reject">
  <label for="dec-3-reject" class="ve-dec-reject">reject</label>
  <input type="radio" id="dec-3-skip" name="dec-3" value="skip" checked>
  <label for="dec-3-skip" class="ve-dec-skip">skip</label>
</fieldset>
```

CSS injected by `ve-runtime.js` styles the segmented-control look (the
runtime already owns `injectStyles` — same path as the existing
comment-pill CSS).

### 3.5 Runtime change (`ve-runtime.js`)

- New `wireDecisionPills()` function called from `init()`. Listens for
  `change` events on `fieldset.ve-decision input[type="radio"]`. On
  change, it calls `recordDecision(anchorId, decision)`.
- `recordDecision(anchorId, decision)` writes a new turn to the queue if
  the decision differs from the last-known state for that anchor.
- The existing `submitTurn()` (which writes a turn when ANSWER is clicked
  in the modal) reads `currentDecisionFor(anchorId)` from a per-instance
  Jotai-style atom (one `decisionsAtom` per Provider — see
  `browser-ui-test-techniques.md` §3) and includes it in the payload.

### 3.6 Reply command change (`/aimvc-respond-to-comment`)

The command's prompt that ships to Claude is amended:

> For every pending user turn, **first** check the `decision` field. The
> reply structure should be:
> - `decision == "approve"` → "Acknowledged: approving as-is. <one-line
>   confirmation that addresses any clarification text>."
> - `decision == "reject"` → "Acknowledged: rejecting. <one-line summary
>   of what to do instead, drawn from the comment text if present>."
> - `decision == "skip"` → process the comment text only; do not infer
>   approval either way.

Decision-only turns (empty `text`) get a one-line acknowledgement that
records the new state without trying to invent a clarification.

### 3.7 Aggregation hook for the orchestrator

When the open page is closed (modal DONE button) the runtime POSTs a
final `summary.json` to `.ve-comments/<threadId>.summary.json` with:

```json
{
  "threadId": "abc123",
  "decisions": {
    "ve-finding-1": "approve",
    "ve-finding-2": "reject",
    "ve-finding-3": "skip",
    …
  },
  "totals": {"approve": 7, "reject": 2, "skip": 19, "total": 28},
  "closedAt": 1746725100
}
```

Claude can `cat` this file at the end of a review pass to get a clean
summary instead of replaying every turn.

## 4. Phased build plan

| Phase | Scope                                                    | Files touched                              | LOC |
|-------|----------------------------------------------------------|--------------------------------------------|-----|
| 1     | TRDD spec (this file)                                    | design/tasks/TRDD-7a2dab03-….md            | ~250|
| 2     | Renderer: fieldset injection per finding                 | scripts/render-interactive-report.py       | ~30 |
| 3     | Runtime: pill wiring + atom + queue payload `decision`   | scripts/ve-runtime.js                      | ~80 |
| 4     | CSS: segmented-control style (in `injectStyles`)         | scripts/ve-runtime.js                      | ~40 |
| 5     | Reply command: prompt amendment                          | commands/aimvc-respond-to-comment.md       | ~30 |
| 6     | Tests: 3 new dev-browser tests                           | tests/                                     | ~120|
| 7     | SKILL.md + README docs                                   | SKILL.md, README.md                        | ~25 |
| 8     | Bump v1.1.4 + publish                                    | (publish.py auto)                          | n/a |

v1 ships all 8 phases — no carve-out.

## 5. Test scenarios

Three new dev-browser tests must pass before bump:

1. **`modal_decision_default_skip`** — open report, verify every finding's
   decision pill renders with `skip` checked. Queue dir empty.
2. **`modal_decision_changes_emit_turn`** — flip Finding 1 to `approve`,
   Finding 2 to `reject`. Verify two new JSONL lines in queue dir,
   `text:""` and `decision` set correctly.
3. **`modal_decision_with_comment`** — open Finding 3 modal, type "rename
   frob to handleFrob", flip the pill to `approve`, click ANSWER.
   Verify one JSONL line with `text` set AND `decision: "approve"`.

The existing 28-test suite must continue to pass unchanged.

## 6. Security considerations

- Decision is a string from a closed enum; the renderer only accepts
  `approve|reject|skip` and refuses to write any other value to the
  queue. No user-controlled data flows into the decision field beyond
  the radio's hard-coded `value` attribute.
- The summary JSON is written to the same `.ve-comments/` dir that
  already has the JSONL queue — same gitignored, same permissions, no
  new attack surface.

## 6.5 v3.1 amendment — radios → toggle switches (2026-05-08)

After the v3 segmented-control radios shipped in v1.1.4, the user asked
for the toggle-switch UI from
<https://raw.githubusercontent.com/ThariqS/html-effectiveness/refs/heads/main/19-editor-feature-flags.html>
("Birchline feature flags"), with a different palette.

**Mapping 2-state toggles to a 3-state decision:** **two toggles per
finding** (approve + reject) with mutex enforced by the runtime. Both
OFF = skip (default). Approve ON + reject OFF = approve. Approve OFF +
reject ON = reject. Approve ON + reject ON is invalid; turning one ON
auto-clears the other in `wireDecisionPills`.

**Palette** (distinct from Birchline's olive/clay):

- approve toggle ON: `#3a6b5c` (deep teal — go/trust, cooler than olive)
- reject toggle ON: `#a84a32` (brick rust — stop, warm not electric)
- track OFF: `#d6d1c5` (warm taupe)
- thumb: `#fbfaf6` (warm off-white) with `0 1px 2px rgba(42,40,37,0.20)` shadow

**Files touched:** `scripts/render-interactive-report.py` (fieldset
swap to two `<label class="ve-toggle">`), `scripts/ve-runtime.js`
(CSS rewrite + `wireDecisionPills` mutex + `currentDecisionFor`
re-derive from checkboxes), `tests/scripts/test-decision-pills.js`
(updated selectors + new `modal_decision_mutex` test = 4 tests now).
Wire format and `/__ve-comment` payload schema unchanged — the toggle
UI derives the same `approve`/`reject`/`skip` enum the JSONL has
always carried.

## 7. Out of scope (deliberately)

- **Per-paragraph decisions for v1 inline threads** (TRDD-eff1aa87 §3).
  v3 only enhances the v2 modal-thread path.
- **Approval workflows / sign-off / multi-user voting** — single user.
- **A "approve all remaining" bulk button** — possible v4 enhancement;
  v3 keeps every decision explicit per finding.

## 8. Open questions

None — the design is ready to implement.
