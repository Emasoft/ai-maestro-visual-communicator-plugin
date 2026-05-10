---
name: amvcp-modal-comments
description: "Render an agent report (audit, findings list, scan output) as an interactive HTML page with per-element comment threads and v3 approve/reject decision toggles. Use when the user wants to comment inline on each finding, reply per-paragraph, accept/reject items individually, or have a back-and-forth with Claude on each section. Trigger: 'make commentable', 'interactive report', 'reply to each finding', 'approve/reject per finding', '/amvcp-interactive-report', '/amvcp-respond-to-comment'."
license: MIT
compatibility: "Two cooperating processes (renderer + responder). Browser + Python 3.12+ via amvcp-select.py. Comment queue dir defaults to <cwd>/.ve-comments/, override with VE_COMMENT_DIR."
metadata:
  author: Emasoft
---

# Modal-Comment Agent Reports (v2/v3)

Turn a markdown report (audit, findings, scan output, comparison) into an HTML page where every paragraph, list item, table row, and code block carries a "Comment this" pill — and (v3) approve/reject toggles. The user replies inline; a separate Claude session writes per-turn replies that appear in the modal without a page reload.

## When this skill loads

Triggers: "make commentable", "interactive report", "reply to each finding", "approve/reject per finding", attaching an agent report for a clickable HTML version, or the slash commands.

Read first — this sub-skill sits on two reusable contracts:

- `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` — modal UI, wire format, atomic-write, polling, page-side guarantees (hover-bridge, polling resume, atomic save of pending placeholder).
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — `kind:"submit"` / `kind:"exit"` / `selections[]` payload; selection coexists with comments on the same page.

## Two halves of the round-trip

Both must run for ANSWER → reply to work end-to-end:

| Half | Command | Role |
|------|---------|------|
| Renderer | `/amvcp-interactive-report report.md` | Stamps `data-ve-comment-id`, ships `*.idmap.json`, boots `amvcp-select.py`. |
| Responder | `/amvcp-respond-to-comment --queue-dir <q> --watch --source report.md` | Polls queue, dereferences `commentId`, writes `<threadId>.reply.<turn+1>.json` atomically. |

Renderer alone → no replies. Responder alone → nothing to read. Always start both; responder is typically a different Claude session.

## Queue-dir contract (CRITICAL)

Both halves MUST resolve to the same on-disk path or the modal sits forever on "Waiting for Claude to reply…". Either set `VE_COMMENT_DIR=/abs/path/.ve-comments` in BOTH shells, OR pass the `[amvcp-select] queue dir: ...` line `amvcp-select.py` prints to stderr to the responder as `--queue-dir <path>`. Full rules in `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md`.

## v3 decision toggles

Each finding carries two pill switches (approve + reject) in a slate/teal/rust palette. Default: both OFF → `skip` (no opinion, no turn). Mutex: turning one ON clears the other (3 effective states). Flipping writes a decision-only turn (`text:""`, `decision:"approve"|"reject"|"skip"`, `anchorId:"ve-finding-N"`) into a per-finding JSONL. Submitting a comment from inside a finding attaches the decision as a key on the user turn. Closing the modal POSTs `<threadId>.summary.json` with `decisions`, `totals`, `closedAt`. Full schema in `./references/v3-decision-toggles.md`.

## Resources

- `./references/agent-report-flow.md` — v2/v3 flow, when to use / NOT, responding workflow.
- `./references/v3-decision-toggles.md` — toggles, decision payload, summary file, dispatch.
- `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` — modal UI, queue-dir, wire format, atomic-write, polling, page-side guarantees.
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — universal selection wire format.
- `${CLAUDE_PLUGIN_ROOT}/references/runtime-bug-patterns.md` — hover-bridge, polling-resume, atomic-save.
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — pill palette and decision-toggle tokens.
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — visual slop test; run before delivering.

## Anti-patterns

- Renderer and responder in different working directories without `VE_COMMENT_DIR` set in both shells — responder polls a different `.ve-comments/` and the modal hangs on "Waiting for Claude to reply…".
- Non-atomic reply writes (`> file.json`) — polling page reads a half-written file and crashes; write to `<file>.tmp.$$` then `mv -f`.
- v2 modal-comments for a single-click interaction — use `/amvcp-generate-web-diagram` instead.
- v2 for slide decks or pages with no per-element commentables — use `/amvcp-generate-slides` or `/amvcp-generate-web-diagram`.
