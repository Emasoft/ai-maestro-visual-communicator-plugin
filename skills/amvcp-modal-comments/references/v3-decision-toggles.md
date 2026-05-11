# v3 — per-element decision control (segmented [Skip] [Approve] [Reject])

Each finding section in a v3 interactive agent report carries **one 3-segment radiogroup** (Skip / Approve / Reject) styled in a warm slate/teal/rust palette (TRDD-7a2dab03). The control is **independent** of the comment thread: the thread is for clarifications, the decision is the **outcome signal** Claude reads first when processing the user's response.

This file documents the control behaviour, the on-disk decision payload, the responder workflow when decisions are present, and the aggregate summary written when the modal closes.

## Visual model

```
┌────────┬─────────┬─────────┐
│▣ Skip  │ Approve │ Reject  │  ← default state (skip active)
└────────┴─────────┴─────────┘

┌────────┬─────────┬─────────┐
│ Skip   │▣Approve │ Reject  │  ← user picked Approve (filled with --ve-decision-approve-bg, teal default)
└────────┴─────────┴─────────┘

┌────────┬─────────┬─────────┐
│ Skip   │ Approve │▣Reject  │  ← user picked Reject (filled with --ve-decision-reject-bg, rust default)
└────────┴─────────┴─────────┘
```

The control replaces the v3.1 two-switch design (TRDD-7a2dab03 §3.1, original spec). The two-switch design was structurally a binary independent setting × 2 — it visually suggested 4 possible states even though the runtime enforced mutex to collapse to 3. The segmented control makes the mutex **visible at a glance**: clicking a segment activates that one and deactivates the others, the way a radio group should.

## State model

- **Default state:** Skip is active → effective decision `skip` (no opinion). Loading the page does NOT emit any turn — only an explicit user action does.
- **Mutex BY DESIGN:** the visible contract is "exactly one segment is active". The runtime enforces this through `applyDecisionToFieldset()` which mutates both the visible `aria-checked` attributes AND the hidden checkbox inputs in one atomic step. There are 3 effective states (`skip` / `approve` / `reject`), period.
- **No persistence to localStorage of the segment state itself** — the decision is the on-disk JSONL payload. Re-opening the modal reads the latest decision from the JSONL tail.

## Keyboard

Standard radiogroup behaviour (WAI-ARIA `radiogroup`):

- **Tab** enters the group on the currently-selected segment.
- **ArrowRight / ArrowDown** moves selection forward (Skip → Approve → Reject → Skip).
- **ArrowLeft / ArrowUp** moves selection backward.
- **Home** jumps to Skip; **End** jumps to Reject.
- **Space / Enter** activates the focused segment (no movement).
- Selection commits on move (the standard radiogroup pattern) — moving with ArrowRight from Skip to Approve emits a `decision="approve"` turn the same way a click would.

## DOM contract

```html
<fieldset class="ve-decision" data-anchor-id="ve-finding-1"
          role="radiogroup" aria-label="Decision for finding-1">
  <legend class="ve-sr-only">Decision for finding-1</legend>

  <!-- Hidden inputs (sr-only) kept so existing selectors keep working.
       The runtime mutates these in lockstep with the segment buttons. -->
  <input type="checkbox" class="ve-sr-only"
         data-decision="approve" data-anchor-id="ve-finding-1"
         tabindex="-1" aria-hidden="true">
  <input type="checkbox" class="ve-sr-only"
         data-decision="reject" data-anchor-id="ve-finding-1"
         tabindex="-1" aria-hidden="true">

  <button type="button" class="ve-segment ve-segment-skip"
          data-decision="skip" role="radio" aria-checked="true"
          tabindex="0">Skip</button>
  <button type="button" class="ve-segment ve-segment-approve"
          data-decision="approve" role="radio" aria-checked="false"
          tabindex="-1">Approve</button>
  <button type="button" class="ve-segment ve-segment-reject"
          data-decision="reject" role="radio" aria-checked="false"
          tabindex="-1">Reject</button>
</fieldset>
```

The hidden `<input type="checkbox" data-decision="approve">` and `<input type="checkbox" data-decision="reject">` are preserved from v3.1 so existing test scripts and responder code can still observe the decision via the same selectors. The visible affordance is the three `.ve-segment` buttons; the runtime keeps both layers in sync via `applyDecisionToFieldset()` in `amvcp-runtime.js`.

## Theming hooks

The control reads these CSS variables (falls back to sensible defaults if unset):

| Variable                       | Default        | Used for                                |
|--------------------------------|----------------|-----------------------------------------|
| `--ve-decision-skip-bg`        | `--ve-control-bg` | Skip-active segment background       |
| `--ve-decision-approve-bg`     | `#3a6b5c` (teal) | Approve-active segment background    |
| `--ve-decision-approve-fg`     | `#fbfaf6`      | Approve-active segment text color       |
| `--ve-decision-reject-bg`      | `#a84a32` (rust) | Reject-active segment background     |
| `--ve-decision-reject-fg`      | `#fbfaf6`      | Reject-active segment text color        |
| `--ve-control-radius`          | `6px`          | Outer + inner border radius             |
| `--ve-control-border`          | inherited      | Container fill (28% mix)                |
| `--ve-accent`                  | `#b8861f`      | Keyboard focus ring                     |

Inactive segments stay transparent with `color-mix(currentColor 55%, transparent)` text — they don't compete visually with the active one.

## On-disk decision payload

Activating a segment writes a **decision-only turn** (no comment text) into a per-finding JSONL file:

```
<queue-dir>/decision-ve-finding-N-<ts>.jsonl
```

One line per activation:

```json
{"anchorId":"ve-finding-N","decision":"approve|reject|skip","text":"","at":1714998000.0,"role":"user","turn":1}
```

Submitting a comment from inside a finding ANSWERs with the current decision attached as an extra `decision` key on the comment turn:

```json
{"commentId":"bf917c95","threadId":"thread-…","sourcePath":"/abs/path/report.md",
 "turn":2,"role":"user","text":"clarifying question…","decision":"reject","at":1714998120.0}
```

## Aggregate summary on close

Closing the modal POSTs an aggregate file so the responder can `cat` one file instead of replaying every per-finding JSONL:

```
<queue-dir>/<threadId>.summary.json
```

```json
{
  "threadId": "thread-bf917c95-…",
  "sourcePath": "/abs/path/report.md",
  "decisions": {
    "ve-finding-1": "approve",
    "ve-finding-2": "reject",
    "ve-finding-3": "skip",
    "ve-finding-4": "approve"
  },
  "totals": {"approve": 2, "reject": 1, "skip": 1, "total": 4},
  "closedAt": 1714998900.0
}
```

## Responder behaviour when decisions are present

When the responder loop processes a thread file or the summary file, **read the `decision` field first** before parsing comment text:

- `approve` → reply with "Acknowledged: approving as-is." (one line, no further action)
- `reject` → reply with "Acknowledged: rejecting. \<one-line summary of what to do instead\>." (state the alternative concisely)
- `skip` (or absent) → process the comment text only as a normal v2 turn

The decision short-circuits long replies: an approve+no-comment is a no-op, a reject+no-comment gets a one-line "what to do instead", and only a comment with `decision: "skip"` (or no decision) triggers the full responder loop.

## When the control does NOT fire

- The user opens the modal, clicks the body text without touching the segments, closes → no decision turn, no summary entry for that finding.
- The user picks Approve, then changes mind and picks Reject → two decision turns land (one per activation), latest wins. The summary file reflects the LAST decision at close time.
- Re-clicking the already-active segment is a no-op on the wire (idempotent — `lastWrittenDecision` map suppresses duplicate POSTs).
- The user has v2 enabled but not v3 (older renderer) → no segments rendered, no decision-only turns; behaves as pure v2.
