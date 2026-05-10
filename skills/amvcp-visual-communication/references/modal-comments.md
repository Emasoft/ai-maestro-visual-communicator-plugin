# Interactive Agent Reports & Modal Comments (v2 + v3) — workflow

## Table of contents

- [When to use](#when-to-use)
- [Two halves of the round-trip](#two-halves-of-the-round-trip)
- [Responding to comments (the workflow respond-to-comment runs)](#responding-to-comments-the-workflow-respond-to-comment-runs)
- [v3 — per-element decision toggles (approve / reject — both off = skip)](#v3--per-element-decision-toggles-approve--reject--both-off--skip)
- [When NOT to use v2 modal comments](#when-not-to-use-v2-modal-comments)

This file documents the **agent-report-specific workflow** that sits on top of the reusable comment-chat-box UI: when to invoke the v2 flow, the renderer + responder split, the v3 per-element decision toggles, and when to bail out.

For the reusable UI / wire-format contract (queue-dir resolution, on-disk wire format, modal layout, polling cycle, atomic-write pattern, page-side guarantees), read `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` first.

For the cross-cutting selection wire format (`kind:"submit"`, `kind:"exit"`, `selections[]`, the depth-grammar, etc.), see `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`.

## When to use

When the user asks you to render a report (audit, finding list, scan output, comparison) as an **interactive HTML page they can comment on inline**, use the v2 modal-comment flow. It is the right tool any time the user says things like "make this commentable", "let me reply to each finding", "interactive report", "let me ask Claude follow-ups on individual paragraphs", or simply attaches an agent report and asks for a clickable HTML version.

## Two halves of the round-trip

The v2 flow has **two cooperating halves** — both must be running for ANSWER → reply to work end-to-end:

| Half | What it does | How to start it |
|------|-------------|-----------------|
| **Renderer + transport** | Stamps every commentable element with `data-ve-comment-id`, ships an `*.idmap.json` sidecar, boots `amvcp-select.py` so the page can `POST /__ve-comment` and `GET /__ve-reply/<tid>`. | `/amvcp-interactive-report <report.md>` |
| **Responder loop** | Watches the queue dir for pending user turns and writes `<threadId>.reply.<turn+1>.json` per reply. | `/amvcp-respond-to-comment --queue-dir <q> --watch --source <report.md>` |

If only the renderer runs, the user can post comments but never see a reply. If only the responder runs, there is nothing for it to read. Always start both — the renderer command auto-spawns the transport; the responder is a separate session (often a different Claude entirely).

The queue-dir wire format and `VE_COMMENT_DIR` resolution rules live in `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` — read that before launching either half. The most common failure mode (renderer and responder pointing at different `.ve-comments/` directories) is documented there.

## Responding to comments (the workflow respond-to-comment runs)

When invoked as a responder (whether via the slash command or because the user asks "process the pending comments"):

1. List every `*.jsonl` under `--queue-dir` (default `<cwd>/.ve-comments/`).
2. For each thread file:
   1. Read every line. Each is one user turn.
   2. Find the highest `turn` whose `role == "user"`. Call it `N`.
   3. If `<threadId>.reply.<N+1>.json` already exists → already answered, skip.
   4. Otherwise: dereference `commentId` via `<source>.idmap.json` to recover the anchored text, generate a reply, write it **atomically** as `<threadId>.reply.<N+1>.json` (the atomic-write pattern is documented in `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md`).
3. With `--watch`, sleep ~2 s and repeat. Without it, run once and exit.

## v3 — per-element decision toggles (approve / reject — both off = skip)

Each finding section also carries **two pill-shaped toggle switches** (approve + reject) styled in a warm slate/teal/rust palette (TRDD-7a2dab03). The toggles are **independent** of the comment thread: the thread is for clarifications, the toggle state is the **outcome signal** Claude reads first.

- Default state: both toggles OFF → effective decision `skip` (no opinion). Loading the page does NOT emit any turn.
- Mutex: turning one toggle ON automatically clears the other. There are 3 effective states (skip / approve / reject), not 4.
- Flipping a toggle writes a **decision-only turn** (`text: ""`, `decision: "approve"|"reject"|"skip"`, `anchorId: "ve-finding-N"`) into a per-finding JSONL file (`<queue-dir>/decision-ve-finding-N-<ts>.jsonl`).
- Submitting a comment from inside a finding ANSWERs with the current decision attached as an extra `decision` key on the comment turn.
- Closing the modal POSTs an aggregate `<threadId>.summary.json` with `decisions`, `totals`, and `closedAt` so the responder can `cat` one file instead of replaying every turn.

When responding, **read the `decision` field first**:
- `approve` → "Acknowledged: approving as-is."
- `reject` → "Acknowledged: rejecting. \<one-line summary of what to do instead\>."
- `skip` (or absent) → process the comment text only.

## When NOT to use v2 modal comments

- The user just wants a **single click → return one selection** (use the v1 Interactive Selection flow described in [interactive-selection-base](${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md); that is what `/amvcp-diff-review`, `/amvcp-plan-review`, etc. already do).
- The page has no per-element commentables (a single diagram, a slide deck) — render with `/amvcp-generate-web-diagram` or `/amvcp-generate-slides` and skip v2.
- One-shot HTML the user will only read offline — no transport, no comments, no responder.
