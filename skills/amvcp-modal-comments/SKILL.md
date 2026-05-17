---
name: amvcp-modal-comments
description: "Render an agent report as interactive HTML with per-element comment threads and v3 approve/reject toggles. Use when the user wants to comment inline on each finding, reply per-paragraph, or accept/reject items individually. Trigger with 'make commentable', 'interactive report', '/amvcp-interactive-report', or '/amvcp-respond-to-comment'."
license: MIT
metadata:
  author: Emasoft
---

# Modal-Comment Agent Reports (v2/v3)

## Overview

v2/v3 agent-report flow: render markdown as interactive HTML where every paragraph/list/row/code carries a "Comment this" pill plus (v3) approve/reject toggles. User replies inline; a separate Claude session writes per-turn replies.

## Prerequisites

- Browser (Chromium for `--app=URL`); Python 3.12+ runner.
- Responder loop MUST run alongside renderer.
- For public link, pair with `vercel-deploy`.

## Instructions

1. Start renderer: `/amvcp-interactive-report report.md`.
2. Capture `[amvcp-select] queue dir: ...` from stderr.
3. Start responder in separate shell: `/amvcp-respond-to-comment --queue-dir <path> --watch --source report.md`.
4. Both halves required. Same `VE_COMMENT_DIR` or pass `--queue-dir`.

## Output

- `<queue-dir>/<threadId>.jsonl` — append-only user turns.
- `<queue-dir>/<threadId>.reply.<turn>.json` — atomic per-reply.
- `<queue-dir>/<threadId>.summary.json` — aggregate on close.
- v3: `<queue-dir>/decision-ve-finding-N-<ts>.jsonl`.

## Error Handling

- Different `.ve-comments/` dirs → modal stuck. Fix: same `VE_COMMENT_DIR`.
- Non-atomic write (`> file.json`) → page crashes. Fix: `<file>.tmp.$$` then `mv -f`.
- v2 for single-click → use `/amvcp-generate-web-diagram`.

## Examples

**Input:** `/amvcp-interactive-report audit.md`; user hovers Finding 3, clicks pill, types a clarifying question, clicks ANSWER.
**Output:** Responder (`--watch` on same queue dir) dereferences `commentId` via `audit.idmap.json`, atomically writes `reply.2.json`; page polls and renders within ~2s.

## Modes

Not applicable — this skill is infrastructure for the comment/modal flow (the universal "click handle → open modal → chat with claude" path). It is loaded by the runtime on EVERY page that renders any visual element, so it carries no `data-ve-mode` of its own. The mode of each atom-host page is set by the rendering skill (R23 of `amvcp-self-debug-rules`).

## Composability

Composes with EVERY other amvcp-* skill — that is its job. Every visual element gets the comment-handle from this skill at selection time. The skill is required, not optional.

## Resources

- [comment-chat-box](../../references/comment-chat-box.md) — modal UI, wire format.
  - What this is
  - Queue-dir contract — share the same path across both halves
  - Wire format (what lives on disk)
  - Modal layout (the chat box)
  - Polling cycle
  - Atomic-write pattern
  - Page-side guarantees
- [interactive-selection-base](../../references/interactive-selection-base.md) — `submit`/`exit`/`selections[]`.
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [runtime-bug-patterns](../../references/runtime-bug-patterns.md) — hover-bridge, polling-resume.
  - v2 modal bugs
  - ve-regex bugs
  - Runtime-injected UI must inherit host palette
  - Common shape & Running tests
- [agent-report-flow](./references/agent-report-flow.md) — v2/v3 flow, responder.
  - When to use
  - Two halves of the round-trip
  - Responding to comments (the workflow respond-to-comment runs)
  - v3 — per-element decision toggles (approve / reject — both off = skip)
  - When NOT to use v2 modal comments
- [v3-decision-toggles](./references/v3-decision-toggles.md) — state, payload, summary.
  - Visual model
  - State model
  - Keyboard
  - DOM contract
  - Theming hooks
  - On-disk decision payload
  - Aggregate summary on close
  - Responder behaviour when decisions are present
  - When the control does NOT fire
