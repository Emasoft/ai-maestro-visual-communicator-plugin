---
name: amvcp-respond-to-comment
description: Read pending comment-thread turns from the v2 modal-comment queue and write per-turn agent replies that the open page picks up via /__ve-reply polling.
---
# Respond to Comment

Process pending user comments emitted by the v2 modal-comment box (TRDD-eff1aa87 §6) and write per-turn agent replies into the queue directory. The open HTML page in the user's browser polls `/__ve-reply/<threadId>` every 1.5 s and renders each reply inline as soon as the file lands.

## Usage

```
/amvcp-respond-to-comment [--queue-dir <path>] [--watch] [--source <report.md>]
```

**Arguments:**

- `--queue-dir <path>` — directory holding the queue JSONL files written by `amvcp-select.py`. Defaults to `<cwd>/.ve-comments/` (matches the runner's default).
- `--watch` — loop forever, polling the queue every 2 s and replying to new turns as they arrive. Without this flag, runs once and exits.
- `--source <report.md>` — path to the source markdown report. Used to dereference unknown `commentId`s via the sidecar `<report>.idmap.json`.

## Workflow

1. List every `*.jsonl` file under `--queue-dir`.
2. For each file (one per thread):
   1. Read every line. Each line is a single user turn:
      ```json
      {"commentId":"bf917c95","threadId":"thread-bf917c95-...","sourcePath":"/path/to/report.md","turn":1,"role":"user","text":"...","decision":"approve","anchorId":"ve-finding-3","at":1714998000.0}
      ```
      The `decision` and `anchorId` keys are present on turns produced by v3 pages (TRDD-7a2dab03). On v1/v2 pages they are absent — treat the absence as `decision == "skip"` (no opinion).
   2. Find the highest `turn` for `role:"user"`.
   3. Check whether `<threadId>.reply.<turn+1>.json` already exists. If yes → already answered, skip.
   4. If no → this turn needs a reply.
3. For each turn that needs a reply:
   1. Load the source `idmap.json` to dereference `commentId` → `{kind, sectionId, text}`. **If you've already seen this commentId in the current conversation, skip the dereference and just refer to the id.** Saves tokens.
   2. Read the source `report.md` ONCE per session to load full context (when needed).
   3. Read all prior turns in the same JSONL — that's the conversation history.
   4. **Check the `decision` field FIRST** (TRDD-7a2dab03 v3 — per-element decision toggles). Each turn may carry a `decision` ∈ `{"approve","reject","skip"}` reflecting the toggle-derived state (approve toggle ON, reject toggle ON, or both OFF) at the time the user submitted (or flipped a toggle alone). The reply structure is:
      - `decision == "approve"` → "Acknowledged: approving as-is. \<one-line confirmation that addresses any clarification text\>."
      - `decision == "reject"` → "Acknowledged: rejecting. \<one-line summary of what to do instead, drawn from the comment text if present\>."
      - `decision == "skip"` (or `decision` absent) → process the comment text only; do not infer approval either way.
      Decision-only turns (empty `text`, `decision` present) get a **one-line acknowledgement** that records the new state without trying to invent a clarification (e.g. `"Acknowledged: marked as approve."`). Do not reply with full prose to a decision-only turn.
   5. Generate a **scoped per-turn reply** that:
      - Addresses ONLY this commentId's content
      - References prior turns in the same thread
      - Is concise (the user is reading a comment box, not a wall of text)
   6. Write `<queue-dir>/<threadId>.reply.<turn+1>.json`:
      ```json
      {"turn": 2, "role": "agent", "text": "..."}
      ```
4. If `--watch`, sleep 2 s and loop.

## Reply file format

Reply files are short JSON, one per turn:

```json
{
  "turn": 2,
  "role": "agent",
  "text": "Your reply text — markdown is fine, gets rendered as preformatted text in the modal."
}
```

`turn` MUST be the turn number this reply addresses (= `userTurn.turn + 1`). The page polls `?since=<lastSeenTurn>` and only picks up files where `turn > since`.

## Idempotency

Re-running `/amvcp-respond-to-comment` is safe — it skips any turn that already has a reply file. Delete the reply file to force a regeneration.

## Token-efficiency note

The `idmap.json` is the dereference table. For ANY `commentId` you have already seen in this session, refer to it by `#commentId` and skip re-reading the full text. The user gets faster replies AND less context budget burned on the same paragraph reread.

## Decision summary (TRDD-7a2dab03 §3.7)

When the user closes the modal (DONE button), the v3 runtime POSTs an aggregate `<threadId>.summary.json` with the current decision for every finding on the page:

```json
{
  "threadId": "thread-...",
  "decisions": {
    "ve-finding-1": "approve",
    "ve-finding-2": "reject",
    "ve-finding-3": "skip"
  },
  "totals": {"approve": 7, "reject": 2, "skip": 19, "total": 28},
  "closedAt": 1746725100
}
```

Read this file at the end of a review pass to get a clean machine-readable summary instead of replaying every JSONL turn. It is the canonical source for "how many findings did the user actually accept?".

## Queue-dir contract

The default queue dir is `<cwd>/.ve-comments/`, where `<cwd>` is whatever
directory THIS command's process is started from. The renderer
(`/amvcp-interactive-report`) defaults to its own cwd's `.ve-comments/` —
which means if the two halves run from different directories they
silently miss each other and the modal sits forever waiting.

**Two ways to share the queue dir:**

1. **Read the printed queue dir.** As of v1.1.7 the renderer prints
   `[amvcp-select] queue dir: /absolute/path/.ve-comments` to stderr at
   startup. Pass that path to this command as `--queue-dir`.

2. **Set `VE_COMMENT_DIR` explicitly** in the shell that launches each
   half:
   ```bash
   export VE_COMMENT_DIR=~/work/proj-A/.ve-comments
   ```
   Both `amvcp-select.py` and this command honour the env var
   unconditionally.

The same queue dir holds `<threadId>.jsonl` (user turns), `<threadId>.reply.<turn>.json` (your replies), and `<threadId>.summary.json` (decision summary on modal close).

## See also

- `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` — the reusable v2 modal-comment UI + queue-dir wire-format contract (chat box, polling cycle, atomic-write pattern).
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — cross-cutting selection wire format (`kind:"submit"`, `selections[]`, every entry kind).
- `design/tasks/TRDD-eff1aa87-cd78-4e0c-bf6c-644c419d65b3-interactive-agent-reports.md` §6 — full v2 design + decision log.
- `commands/amvcp-interactive-report.md` — v2 modal-comment thread renderer (the page side of this responder).
