# Interactive Agent Reports & Modal Comments (v2 + v3)

## Table of contents

- [When to use](#when-to-use)
- [Two halves of the round-trip](#two-halves-of-the-round-trip)
- [Wire format (what lives on disk)](#wire-format-what-lives-on-disk)
- [Responding to comments (the workflow respond-to-comment runs)](#responding-to-comments-the-workflow-respond-to-comment-runs)
- [Page-side guarantees you can rely on](#page-side-guarantees-you-can-rely-on)
- [v3 — per-element decision toggles (approve / reject — both off = skip)](#v3--per-element-decision-toggles-approve--reject--both-off--skip)
- [When NOT to use v2 modal comments](#when-not-to-use-v2-modal-comments)

## When to use

When the user asks you to render a report (audit, finding list, scan output, comparison) as an **interactive HTML page they can comment on inline**, use the v2 modal-comment flow. It is the right tool any time the user says things like "make this commentable", "let me reply to each finding", "interactive report", "let me ask Claude follow-ups on individual paragraphs", or simply attaches an agent report and asks for a clickable HTML version.

## Two halves of the round-trip

The v2 flow has **two cooperating halves** — both must be running for ANSWER → reply to work end-to-end:

| Half | What it does | How to start it |
|------|-------------|-----------------|
| **Renderer + transport** | Stamps every commentable element with `data-ve-comment-id`, ships an `*.idmap.json` sidecar, boots `amvcp-select.py` so the page can `POST /__ve-comment` and `GET /__ve-reply/<tid>`. | `/amvcp-interactive-report <report.md>` |
| **Responder loop** | Watches the queue dir for pending user turns and writes `<threadId>.reply.<turn+1>.json` per reply. | `/amvcp-respond-to-comment --queue-dir <q> --watch --source <report.md>` |

If only the renderer runs, the user can post comments but never see a reply. If only the responder runs, there is nothing for it to read. Always start both — the renderer command auto-spawns the transport; the responder is a separate session (often a different Claude entirely).

### Queue-dir contract — share the same path across both halves

Both halves resolve the queue dir from the same logic:

1. `--queue-dir <path>` (responder) / `VE_COMMENT_DIR` env var (both) wins.
2. Otherwise the default is `<cwd>/.ve-comments/` — and `<cwd>` is whatever directory the process was started from.

Failure mode: if the renderer runs from `/Users/me/proj-A` but the
responder runs from `/Users/me`, the responder polls
`/Users/me/.ve-comments/` and never sees the user's comments. The
modal sits forever on "Waiting for Claude to reply…".

To avoid this, either:

- **Read the printed queue dir.** As of v1.1.7 `amvcp-select.py` (the
  renderer's transport) prints `[amvcp-select] queue dir:
  /absolute/path/.ve-comments` to stderr at startup. Pass that path
  to the responder as `--queue-dir`.
- **Set `VE_COMMENT_DIR` explicitly** in BOTH shells before launching
  either half:
  ```bash
  export VE_COMMENT_DIR=/Users/me/work/proj-A/.ve-comments
  ```

## Wire format (what lives on disk)

```
<queue-dir>/                              # default: <cwd>/.ve-comments/
  <threadId>.jsonl                        # one user turn per line, append-only
  <threadId>.reply.<turn>.json            # one file per agent reply

<report>.html                             # rendered page; <body> elements carry data-ve-comment-id
<report>.idmap.json                       # { "<commentId>": { "kind": "p"|"li"|"tr"|"pre"|…,
                                          #                    "sectionId": "…", "text": "…" } }
```

**One user turn (`*.jsonl` line):**
```json
{"commentId":"bf917c95","threadId":"thread-bf917c95-…","sourcePath":"/abs/path/report.md","turn":1,"role":"user","text":"…","at":1714998000.0}
```

**One agent reply (`*.reply.<turn>.json`):**
```json
{"turn":2,"role":"agent","text":"…"}
```

**Polling cycle is 1.5 s** (`COMMENT_POLL_MS`). The page picks up a reply within 2 s of the file landing.

## Responding to comments (the workflow respond-to-comment runs)

When invoked as a responder (whether via the slash command or because the user asks "process the pending comments"):

1. List every `*.jsonl` under `--queue-dir` (default `<cwd>/.ve-comments/`).
2. For each thread file:
   1. Read every line. Each is one user turn.
   2. Find the highest `turn` whose `role == "user"`. Call it `N`.
   3. If `<threadId>.reply.<N+1>.json` already exists → already answered, skip.
   4. Otherwise: dereference `commentId` via `<source>.idmap.json` to recover the anchored text, generate a reply, write it **atomically** as `<threadId>.reply.<N+1>.json`.
3. With `--watch`, sleep ~2 s and repeat. Without it, run once and exit.

Atomic write pattern (so the polling page never reads a half-written file):
```bash
TMP="<queue>/<threadId>.reply.<N+1>.json.tmp.$$"
printf '%s\n' "$JSON" > "$TMP" && mv -f "$TMP" "<queue>/<threadId>.reply.<N+1>.json"
```

## Page-side guarantees you can rely on

The runtime (`amvcp-runtime.js`) handles these for you — do not try to recreate them in your reply text:

- **Hover-bridge** (180 ms grace window so the pill stays clickable when the pointer crosses the gap from anchor to pill).
- **Polling resume on reopen** — closing the modal while a reply is outstanding is safe; reopening restarts the poll loop.
- **Atomic save of the pending placeholder** — a refresh between SEND and reply arrival preserves the pending state.
- **Per-thread `localStorage` persistence** under key `ve-comment-thread:<commentId>`.
- **Stale-state self-detection** — fetches that complete after the modal closes (or a different anchor's thread opens) bail without crashing.

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
