# v3 — per-element decision toggles (approve / reject — both off = skip)

Each finding section in a v3 interactive agent report carries **two pill-shaped toggle switches** (approve + reject) styled in a warm slate/teal/rust palette (TRDD-7a2dab03). The toggles are **independent** of the comment thread: the thread is for clarifications, the toggle state is the **outcome signal** Claude reads first when processing the user's response.

This file documents the toggle behaviour, the on-disk decision payload, the responder workflow when decisions are present, and the aggregate summary written when the modal closes.

## State model

- **Default state:** both toggles OFF → effective decision `skip` (no opinion). Loading the page does NOT emit any turn — only an explicit user action does.
- **Mutex behaviour:** turning one toggle ON automatically clears the other. There are 3 effective states (`skip` / `approve` / `reject`), not 4. The "both ON" state is unreachable by user interaction.
- **No persistence to localStorage of the toggle state itself** — the decision is the on-disk JSONL payload. Re-opening the modal reads the latest decision from the JSONL tail.

## On-disk decision payload

Flipping a toggle writes a **decision-only turn** (no comment text) into a per-finding JSONL file:

```
<queue-dir>/decision-ve-finding-N-<ts>.jsonl
```

One line per toggle event:

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

## When the toggles do NOT fire

- The user opens the modal, clicks the body text without touching toggles, closes → no decision turn, no summary entry for that finding.
- The user toggles approve, then changes mind and toggles reject → two decision turns land (one per click), latest wins. The summary file reflects the LAST decision at close time.
- The user has v2 enabled but not v3 (older renderer) → no toggles rendered, no decision-only turns; behaves as pure v2.
