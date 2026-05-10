# Comment Chat-Box — reusable modal UI + wire format

## Table of contents

- [What this is](#what-this-is)
- [Queue-dir contract — share the same path across both halves](#queue-dir-contract--share-the-same-path-across-both-halves)
- [Wire format (what lives on disk)](#wire-format-what-lives-on-disk)
- [Modal layout (the chat box)](#modal-layout-the-chat-box)
- [Polling cycle](#polling-cycle)
- [Atomic-write pattern](#atomic-write-pattern)
- [Page-side guarantees](#page-side-guarantees)

This is the **reusable UI / transport contract** for any sub-skill that wants to attach inline comment threads to elements of a generated HTML page. Today it powers the `amvcp-modal-comments` v2/v3 agent-report flow; future sub-skills can reuse it without copying the wire format.

For the agent-report-specific workflow (renderer + responder loop, v3 per-element decision toggles, when NOT to use modal comments), see `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-modal-comments/references/agent-report-flow.md` (created in Phase B).

For the cross-cutting selection wire format (`kind:"submit"`, `kind:"exit"`, `selections[]`, the depth-grammar for inline / block / math / code, etc.), see `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`.

---

## What this is

A "comment chat-box" is a modal that opens when the user hovers and clicks a "Comment this" pill on any element of the page. The chat-box is a per-element thread of `{user, agent}` turns; the user types a comment, the page POSTs it to a queue dir, and a separate responder process (`/amvcp-respond-to-comment`) writes the reply back to the same queue dir. The page polls and renders the reply inline.

The component has three observable parts:

1. The **per-element pill** (injected by the runtime on hover).
2. The **modal panel** with a thread index on the left and an active-turn pane on the right (textarea or rendered text).
3. The **disk-based queue dir** that the renderer writes user turns into and the responder writes agent replies into.

Both halves of the system are decoupled by the queue dir on purpose: a different Claude session entirely can act as the responder.

---

## Queue-dir contract — share the same path across both halves

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

---

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

The renderer also writes a sidecar `<report>.idmap.json` mapping every comment-id → `{kind, sectionId, text}` so the responder can dereference an unknown id without re-reading the source markdown.

POST body the page sends to `/__ve-comment` (the in-process transport endpoint):

```json
{ "commentId": "7e82b077",
  "threadId":  "thread-7e82b077-mou200pw",
  "sourcePath":"/path/to/report.md",
  "turn": 1,
  "text": "Why polling instead of SSE?" }
```

---

## Modal layout (the chat box)

On hover of any commentable element (any element stamped with `data-ve-comment-id="<8-char-hex>"`), the runtime injects a "Comment this" pill in the top-right corner. Click → modal opens on the right of the viewport (460 px wide), the page reflows so the modal never overlaps text (`body[data-ve-comment-modal-open="1"] main { margin-right: 480px; pointer-events: none }`), and the active anchor gets a gold outline ring.

```
----------------------------------------
|  thread  |                           |
|----------|                           |
| 1:  user |                           |
| 2: agent |  (text of the active      |
|>3:  user<|   turn; becomes an input  |
|          |   box when active is the  |
|          |   next-to-compose user    |
|          |   draft)                  |
|--------------------------------------|
|    [ANSWER]           [DONE]         |
----------------------------------------
```

- Left column: clickable thread index, one row per turn, `> N: role <` markers on the active turn.
- Right column: the active turn's text or, if it's a draft user turn, an editable textarea.
- ANSWER: when active is a draft user turn → submit it (POST `/__ve-comment`, page polls `/__ve-reply/<threadId>` every 1.5 s, the agent's reply lands in the SAME box without page reload). When active is any past turn → append a new user-draft at the bottom of the thread, focus its textarea.
- DONE: save thread to localStorage and close the modal. ESC also closes.

**Verified empirically** (2026-05-06) against the symphony-vs-amoa comparison report (570 lines, 11 H2 sections, 139 commentable elements) served by a v2-aware Python http server:
1. Hover on a `<p data-ve-comment-id="7e82b077">` → pill rendered, opacity 0.7+.
2. Click pill → modal opens with title `Comment · #7e82b077`, page reflows, anchor gets gold ring, draft turn 1 visible with focused textarea.
3. Type reply, click ANSWER → POST landed in queue; thread now `[1: user, > 2: agent <]` with "Waiting for Claude to reply…" placeholder.
4. Wrote a fake reply file → page polled, picked it up within 2 s, replaced the pending turn with Claude's text inline. Active turn = 2 (agent).
5. Click ANSWER → new draft turn 3 appended, textarea focused. Thread index shows `[1: user, 2: agent, > 3: user <]`.
6. Click row 1 in the index → right pane switches to original user comment text. Click row 2 → switches to Claude reply. Click row 3 → back to draft textarea.
7. ESC → modal closes, page restored, anchor un-ringed.
8. Re-hover same paragraph + click pill → modal reopens with full thread history (3 turns) restored from localStorage.

**Timeout/error sentinels** the runner emits when no submission arrives or when something is structurally wrong: `{"id": null, "reason": "timeout|no-file|missing-file|no-browser|...", ...}`.

---

## Polling cycle

The page polls `/__ve-reply/<threadId>` every **1.5 s** (`COMMENT_POLL_MS`). Picks up a reply within 2 s of the file landing. The polling loop survives modal close/reopen — see "Polling resume on reopen" in [Page-side guarantees](#page-side-guarantees) below.

---

## Atomic-write pattern

The page may poll a reply file at any moment. To avoid the page reading a half-written JSON, every reply MUST be written atomically: write to a tmp file in the same directory, then `mv` over the final name. `mv` within a directory is atomic on every POSIX filesystem.

```bash
TMP="<queue>/<threadId>.reply.<N+1>.json.tmp.$$"
printf '%s\n' "$JSON" > "$TMP" && mv -f "$TMP" "<queue>/<threadId>.reply.<N+1>.json"
```

The `.tmp.$$` suffix prevents concurrent responders (e.g. two `--watch` loops on the same queue dir, an unusual but possible misconfiguration) from clobbering each other's tmp files mid-write.

---

## Page-side guarantees

The runtime (`amvcp-runtime.js`) handles these for you — do not try to recreate them in your reply text:

- **Hover-bridge** (180 ms grace window so the pill stays clickable when the pointer crosses the gap from anchor to pill).
- **Polling resume on reopen** — closing the modal while a reply is outstanding is safe; reopening restarts the poll loop.
- **Atomic save of the pending placeholder** — a refresh between SEND and reply arrival preserves the pending state.
- **Per-thread `localStorage` persistence** under key `ve-comment-thread:<commentId>`.
- **Stale-state self-detection** — fetches that complete after the modal closes (or a different anchor's thread opens) bail without crashing.
