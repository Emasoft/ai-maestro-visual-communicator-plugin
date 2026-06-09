# Markdown memory — recall protocol (VISUAL-COMMUNICATOR role)

The harness `# Memory` directive (injected each session) tells the agent how to
**WRITE** memories. This rule is the missing half for this plugin's role: how to
**RECALL** them, the **discipline** that makes recall work, and the **tool**
(`memgrep`) that powers it. Together they are "the memory system": authoring
(directive plus `amvcp-memory-write`), recall (this rule plus
`amvcp-memory-recall`), the search tool (memgrep), and the note corpus.

This recalls *curated, symptom-indexed markdown notes* in the project's
`memory/` dir. It is distinct from conversation/transcript search, which
searches raw chat history.

## The one law that makes memory work: index by the QUESTION, not the answer

A memory is found from the SYMPTOM, not the solution. When you write a note,
its `description:` (and `title`/`tags`) MUST carry the words a future session
will have when the problem RECURS — the user's words, the error text, the
symptom — NOT the jargon of the fix.

- WRONG `description`: "Chart.js needs a ResizeObserver detach before reattach".
  (Findable only if you already know the answer.)
- RIGHT `description`: "chart looks frozen / stops resizing after switching the
  page theme" + the ResizeObserver fact in the BODY.

Two-hop recall: a symptom query lands you on the note; the note's BODY gives
the answer. The `description` is the load-bearing surface — `memgrep recall`
ranks on `description + title + tags` ONLY (the `metadata.type` taxonomy does
NOT affect ranking). Put symptom vocabulary in `description`; put the answer in
the body.

## Recall BEFORE acting (the VISUAL-COMMUNICATOR protocol)

Recall first — "have we hit this before?" — at these moments:

1. **Before generating any visual output** (a report, diagram, slide deck,
   table, dashboard): recall house-style and preference notes. A confirmed
   preference ("always ship light + dark", "user prefers compact KPI rows")
   written last week must shape this week's page without re-asking.
2. **Before debugging a recurring runtime/test problem** (a wedged chart, a
   leaked browser page, a selection payload that never arrives): recall the
   gotcha notes before re-deriving the root cause.
3. **Before a design decision** that smells familiar (theming, composition,
   export shape): recall prior decisions and their lessons.

```bash
# memdir is the harness per-project memory dir:
MEMDIR="$HOME/.claude/projects/<project-slug>/memory"   # slug = project path, dashed
SYMPTOM="the user's words / the error / the symptom"     # NOT the answer's jargon

if command -v memgrep >/dev/null 2>&1; then
  memgrep recall "$SYMPTOM" "$MEMDIR"      # notes ranked best-first as: path — description
else
  grep -rliE "$SYMPTOM" "$MEMDIR"          # fallback: plain grep, degrade-not-break
fi
```

Read the top 1-3 notes the recall returns; the answer is in their bodies. If
recall returns nothing, the memory doesn't exist yet — solve the problem, then
capture it with `amvcp-memory-write`.

## memgrep — the recall engine

`memgrep` is `rg` for markdown (gitignore-aware tree walk, markdown-structural
filters, and the memory subcommands `recall`/`find`/`index`). Its home is the
`ai-maestro-janitor` repo (`tools/memgrep`).

- **Availability:** memgrep is a Rust binary. If `command -v memgrep` is empty,
  install it once: `cargo install --path <…>/ai-maestro-janitor/tools/memgrep`
  (puts it on `~/.cargo/bin`). Until then, the plain-`grep` fallback above
  works on note frontmatter + bodies — recall **degrades, never breaks**. Both
  memory skills in this plugin gate on `command -v memgrep` for exactly this
  reason.
- **recall** `memgrep recall "SYMPTOM" <memdir>` — symptom-ranked notes,
  precision-first, printed `path — description`, best first.
- **find** `memgrep find "+term -term" <memdir>` — note-level keyword search
  with a `+`/`-`/wildcard/phrase DSL; `--only-notes` searches the resolved
  lessons instead of pages.

## Read-the-notes rule — a memory's lessons are part of the memory

When you read ANY memory, read **all the lessons attached to it** — every
`[^N]` footnote and the `## Notes and lessons learned` entries they point to.
The lessons are *why* the facts are the way they are and *what errors not to
repeat*. This is free: `memgrep recall`/`find` auto-resolve and APPEND each
returned note's lessons by default (`--no-notes` suppresses; `--full-notes`
keeps each lesson's leading `[…]` metadata prefix).

## The note format (recall-relevant fields)

The `# Memory` harness directive is the authoring source-of-truth. On disk:

```yaml
---
name: <kebab-slug>                 # == filename stem
description: "<symptom surface — the load-bearing recall field>"
metadata:
  node_type: memory
  type: user | feedback | project | reference
---
<body: the one fact; for feedback/project add **Why:** and **How to apply:**>
```

`MEMORY.md` is the human index (`- [Title](file.md) — hook`, one line per
note) loaded each session. Recall does not need the index — it scans the notes
directly.

## Lessons-learned conventions (footnotes + per-element dates)

Memory pages grow a bottom `## Notes and lessons learned` section using
**standard markdown footnotes**: reference a lesson as `[^N]` in the body and
define it as `[^N]: <the WHY>` at the bottom. A lesson carries its own dates in
a leading `[ocd:… lmd:…]` prefix (Original Creation Date / Last Modified Date)
— these, not the file mtime, are the authoritative age. Authoring lessons (the
clean-the-fact-in-place + demote-the-error correction protocol) is the WRITE
side — see `amvcp-memory-write`.

## Evaluating / improving recall: the dual-test method

- **Test A — cold-recall:** simulate a session with NO prior recollection;
  build the query ONLY from the symptom/user's words, never the answer's
  jargon. Tests "is the right note findable from the symptom?".
- **Test B — write-then-recall:** author a note, then retrieve it. Tests the
  round-trip.

Contamination warning: after you WRITE a note you are biased toward its
wording — your own cold-recall is no longer cold. Use the user's verbatim
symptom, or a clean reframing.

## The memory system's parts (how they connect here)

| Part | Surface | Role |
|---|---|---|
| Authoring | `# Memory` harness directive + `amvcp-memory-write` skill | one fact per note; symptom-indexed `description`; the correction protocol |
| Recall | THIS rule + `amvcp-memory-recall` skill + `memgrep recall`/`find` | symptom-ranked recall, lessons auto-appended |
| Tool | `memgrep` (`ai-maestro-janitor/tools/memgrep`) | the engine both skills lean on; grep is the degrade path |
| Corpus | the project `memory/` dir + `MEMORY.md` index | the durable notes |

## Why this rule exists

Every session otherwise re-derives the same facts — house style, theming
gotchas, prior design decisions. A fresh VISUAL-COMMUNICATOR agent is blind to
the note corpus even when the answer was written down last week. This rule
makes "recall before acting" and "index by symptom" a standing discipline,
with a command surface that degrades to grep when the binary isn't present.
