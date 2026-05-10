---
name: amvcp-modal-comments
description: "Render an agent report as interactive HTML with per-element comment threads and v3 approve/reject toggles. Use when the user wants to comment inline on each finding, reply per-paragraph, or accept/reject items individually. Trigger with 'make commentable', 'interactive report', '/amvcp-interactive-report', or '/amvcp-respond-to-comment'."
license: MIT
metadata:
  author: Emasoft
---

# Modal-Comment Agent Reports (v2/v3)

## Overview

Loads on the v2/v3 agent-report flow: render a markdown report (audit, findings, scan output) as interactive HTML where every paragraph, list item, table row, and code block carries a "Comment this" pill plus (v3) approve/reject toggles. User replies inline; a separate Claude session writes per-turn replies that appear in the modal without page reload.

## Prerequisites

- Browser (Chromium-class for `--app=URL`; falls back to default).
- Python 3.12+ runner (`scripts/amvcp-select.py`).
- Responder loop MUST run alongside renderer; without it the modal sits forever on "Waiting for Claude to reply...".
- For shipping a public link, pair with `vercel-deploy`.

## Instructions

1. Start renderer: `/amvcp-interactive-report report.md` — stamps `data-ve-comment-id`, ships `*.idmap.json`, boots `amvcp-select.py`.
2. Capture the `[amvcp-select] queue dir: ...` line from stderr.
3. Start responder in a separate shell: `/amvcp-respond-to-comment --queue-dir <path> --watch --source report.md`.
4. Both halves required. Either set `VE_COMMENT_DIR=/abs/.ve-comments` in BOTH shells OR pass `--queue-dir`.

## Output

- `<queue-dir>/<threadId>.jsonl` — append-only, one user turn per line.
- `<queue-dir>/<threadId>.reply.<turn>.json` — one file per agent reply (atomic).
- `<queue-dir>/<threadId>.summary.json` — aggregate decisions + totals on close.
- v3: `<queue-dir>/decision-ve-finding-N-<ts>.jsonl` — per-finding decision JSONLs.

## Error Handling

- Renderer + responder pointing at different `.ve-comments/` dirs → modal stuck on "Waiting for Claude". Fix: same `VE_COMMENT_DIR` in both shells or pass `--queue-dir`.
- Non-atomic reply write (`> file.json`) → page reads half-written file and crashes. Fix: write `<file>.tmp.$$` then `mv -f`.
- v2 for a single-click interaction → wasted overhead. Use `/amvcp-generate-web-diagram`.

## Examples

1. `/amvcp-interactive-report audit.md`; user hovers Finding 3, clicks pill, types a clarifying question, clicks ANSWER. Responder (`--watch` on same queue dir) dereferences `commentId` via `audit.idmap.json`, atomically writes `reply.2.json`; page polls and renders within ~2s.
2. v3: user toggles "reject" on Finding 1, closes modal — `summary.json` records `{"ve-finding-1":"reject"}`; responder replies one-line "Acknowledged: rejecting. <alternative>".

## Resources

- [comment-chat-box](../../references/comment-chat-box.md) — modal UI, wire format.
  - What this is
  - Queue-dir contract
  - Wire format
  - Modal layout
  - Polling cycle
  - Atomic-write pattern
  - Page-side guarantees
- [interactive-selection-base](../../references/interactive-selection-base.md) — `submit`/`exit`/`selections[]`.
  - How it works
  - Boilerplate
  - Selection payload
  - Marking elements
  - Engine routing
  - Runner pitfalls
- [runtime-bug-patterns](../../references/runtime-bug-patterns.md) — hover-bridge, polling-resume.
  - v2 hover-bridge
  - v2 resume polling
  - v2 atomic save
  - ve-regex per-mount history
  - ve-regex case-insensitive Z
  - ve-regex wide overflow
- [agent-report-flow](./references/agent-report-flow.md) — v2/v3 flow, responder.
  - When to use
  - Two halves
  - Responding to comments
  - v3 decision toggles
  - When NOT to use
- [v3-decision-toggles](./references/v3-decision-toggles.md) — state, payload, summary.
  - State model
  - Decision payload
  - Aggregate summary
  - Responder behaviour
  - When toggles do NOT fire
