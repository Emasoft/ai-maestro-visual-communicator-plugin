---
name: amvcp-memory-write
description: "Capture a durable, reusable fact as a markdown memory note so a future session recalls it from the SYMPTOM. Use after solving a non-trivial bug, confirming a user style preference (themes, density, palette), or learning a project constraint — or when the user says 'remember this', 'save a memory', 'capture this gotcha'. Writes a schema-valid note with a symptom-indexed description and appends the MEMORY.md index line. The VISUAL-COMMUNICATOR implementation of the AI-Maestro memory-write protocol (see rules/memory-protocol.md)."
license: MIT
metadata:
  author: Emasoft
---

# amvcp memory-write

## Overview

Capture one durable fact as a memory note so a future session — which will
have the SYMPTOM, not the answer — can recall it. The load-bearing decision is
the `description`: it MUST carry the words the problem will present with (the
user's words, the error, the symptom), because recall ranks on `description`
(+ `title` + `tags`). Put the symptom in `description`; put the answer in the
body.

Only capture what is NON-OBVIOUS and reusable: gotchas, constraints not in the
code, confirmed style preferences, hard-won debugging facts. Do NOT capture
what the repo already records (code structure, git history, CLAUDE.md) or what
only matters to the current conversation.

## Instructions

1. Resolve the memory dir (same as recall):

   ```bash
   MEMDIR="$HOME/.claude/projects/$(pwd | sed 's#/#-#g')/memory"
   [ -d "$MEMDIR" ] || MEMDIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/memory"
   mkdir -p "$MEMDIR"
   ```

2. Choose `type` ∈ `user | feedback | project | reference` and a kebab slug
   (prefix the slug with the type, e.g. `feedback_…`, `reference_…`).

3. Check for an existing note that already covers this (update it rather than
   duplicate):
   `command -v memgrep >/dev/null && memgrep recall "<symptom>" "$MEMDIR"`.

4. Write the note file — filename is the type-prefixed slug plus the `.md`
   extension, inside `$MEMDIR` — with the Write tool (NOT echo), schema:

   ```yaml
   ---
   name: <type>_<slug>
   description: "<the SYMPTOM in the user's / the error's words — the words a future session will search with, NOT the answer's jargon>"
   metadata:
     node_type: memory
     type: <user|feedback|project|reference>
   ---
   <the one fact. For feedback/project, follow with **Why:** and **How to apply:** lines.
   Link related notes with [[their-name]].>
   ```

5. Append a one-line pointer to the `MEMORY.md` index in `$MEMDIR` (create the
   index if missing). Each index line is one markdown bullet: the note's title
   in square brackets linking to the note's filename in parentheses, then an
   em-dash and a one-line hook. The fixture memory index shipped with this
   plugin's tests holds three live examples.

6. Sanity-check: would a future session, having only the SYMPTOM, find this
   note by searching `description`? If the description reads like the
   *answer*, rewrite it to read like the *question*.

## VISUAL-COMMUNICATOR wiring (what to capture in this role)

- **Confirmed style preferences** — the user approves or corrects a visual
  choice ("always both themes", "denser KPI rows", "no pastel palettes"):
  capture as `type: feedback`, description carrying the question form ("which
  theme / how dense should the page be").
- **Runtime + test gotchas** — a wedged chart, a leaked page, a payload that
  never arrived: capture as `type: reference` after the bug autopsy, symptom
  in the description, mechanism in the body.
- **Composition decisions** — a nesting/layering approach that worked (or
  failed) for a composed page: capture WHY so the next composition starts
  from the lesson.

## Correcting a memory — the 2-step non-destructive protocol

When a new discovery CONTRADICTS an existing memory, change the memory
non-destructively, in exactly two steps:

1. **Clean the fact in place.** Replace the wrong statement in the body with
   the correct one — the body is the current truth, no "we used to think X"
   clutter inline.
2. **Demote the error to a lesson — the WHY is the point.** Record the error
   as a numbered entry in a `## Notes and lessons learned` section at the
   BOTTOM of the page and connect the corrected fact to it with a standard
   markdown footnote `[^N]`. The load-bearing content is *why* the previous
   statement was wrong — the root cause, not merely "this was wrong".

The *fact* is corrected, the *error* is never deleted — it is demoted to a
linked lesson so future readers don't repeat it.

## Lesson format (footnotes + per-element dates)

Lessons use **standard markdown footnotes** — `[^N]` in the body, `[^N]: …`
under `## Notes and lessons learned`. Give each lesson two intrinsic dates in
a leading `[…]` prefix: **OCD** (Original Creation Date) and **LMD** (Last
Modified Date). These — not the file mtime — are the authoritative age;
memgrep strips the prefix from the default render and restores it under
`--full-notes`.

## Output

One note file + one MEMORY.md index line. Report the note path and the
one-line description; do NOT echo the whole note back into the conversation.

## Examples

```text
After fixing the live-theme-flip chart wedge:
  description: "chart looks frozen / stops resizing after switching the page theme"
  body: the Chart.js responsive ResizeObserver mechanism + the fix.

User: remember that my reports must always ship light AND dark
  → type: feedback; description carries "which theme should the page use /
    user complained page only has one theme".
```

A corrected memory page (fact clean in the body, error demoted to a dated
`[^1]` lesson with the WHY):

```markdown
---
name: reference_chart_resize_wedge
description: "chart looks frozen / stops resizing after switching the page theme"
metadata:
  node_type: memory
  type: reference
---
Live theme flips re-create the canvas; the chart must be destroyed and
re-instantiated, not just updated.[^1]

## Notes and lessons learned
[^1]: [ocd:2026-06-09 lmd:2026-06-09] earlier this page said "call
  chart.resize() after the flip" — wrong: the canvas node is replaced, so the
  old instance observes a detached element. Lesson: verify which DOM node the
  instance is bound to before tuning its options.
```

## Scope

ONLY authors/updates memory notes + the MEMORY.md index. Does NOT recall (use
`amvcp-memory-recall`). One fact per note. Symptom-indexed description is
mandatory — it is what makes the note recallable.

## Resources

- `rules/memory-protocol.md` (this plugin) — the protocol: the one law, the
  schema, the lessons-learned conventions, the dual-test method.
- The harness `# Memory` directive — the authoring source-of-truth this skill
  follows.
- `amvcp-memory-recall` — the RECALL side (find a note before you duplicate or
  correct it; lessons come back appended).
