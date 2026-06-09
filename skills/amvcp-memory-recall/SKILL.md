---
name: amvcp-memory-recall
description: "Recall durable project memories from a SYMPTOM before generating a visual, debugging a recurring problem, or making a design decision. Searches the project's markdown memory notes with memgrep (degrading to plain grep when memgrep is absent), ranking notes by how well the symptom query hits each note's description/title/tags, and returns the top notes to read. Use when you think 'have we hit this before?', before rendering a page (recall house-style and confirmed preferences), or when the user says 'recall memories about X', 'did we already solve this', 'check what we learned about Y'. The VISUAL-COMMUNICATOR implementation of the AI-Maestro memory-recall protocol (see rules/memory-protocol.md)."
license: MIT
metadata:
  author: Emasoft
---

# amvcp memory-recall

## Overview

Recall is the FIRST step before generating visual output, debugging a
recurring problem, or making a design decision — "have we hit this before?".
It searches the project's curated markdown memory notes (the `memory/` dir the
harness maintains) and returns the notes whose `description`/`title`/`tags`
best match your SYMPTOM. The answer is in the matched note's body.

This is distinct from conversation/transcript search: it recalls *curated,
symptom-indexed notes*, not raw chat history.

## The one law

Query with the SYMPTOM — the user's words, the error text, the problem — NOT
the answer's jargon. A note is findable from the symptom because its author put
symptom vocabulary in `description`. (Query "chart frozen after switching
theme" and you find the ResizeObserver note from the problem; query
"ResizeObserver detach" and you only find it once you already know the answer.)

## Instructions

1. Resolve the project memory dir (the harness per-project notes dir):

   ```bash
   MEMDIR="$HOME/.claude/projects/$(pwd | sed 's#/#-#g')/memory"
   # If that path doesn't exist, fall back to a project-local memory/ dir:
   [ -d "$MEMDIR" ] || MEMDIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/memory"
   ```

2. Build a SYMPTOM query from the user's words / the error / the problem
   (never the answer's jargon), then recall — memgrep if present, plain grep
   otherwise:

   ```bash
   SYMPTOM="the symptom in the user's / the error's words"
   if command -v memgrep >/dev/null 2>&1; then
     memgrep recall "$SYMPTOM" "$MEMDIR"        # notes ranked best-first: path — description
   else
     grep -rliE "$SYMPTOM" "$MEMDIR" 2>/dev/null # fallback: degrade, never break
   fi
   ```

   If `memgrep` is not installed, install it once (it lives in the
   ai-maestro-janitor repo): `cargo install --path <…>/ai-maestro-janitor/tools/memgrep`
   — until then the grep fallback works on note frontmatter + bodies.

3. Read the top 1-3 notes the recall returns; the fact you need is in their
   bodies — INCLUDING the appended `[N] - …` lessons (memgrep resolves each
   note's `[^N]` footnotes by default; `--no-notes` suppresses them). If recall
   returns nothing, the memory doesn't exist yet — solve the problem, then
   capture it with `amvcp-memory-write`.

## VISUAL-COMMUNICATOR wiring (when this skill fires in the workflow)

- **Before generating any page** (report, diagram, deck, table, dashboard):
  recall house-style / preference notes, e.g.
  `memgrep recall "which theme should the page use" "$MEMDIR"`. Confirmed
  preferences (both themes always, density, palette choices) shape the output
  without re-asking the user.
- **Before debugging** a wedged chart, a leaked test page, a selection payload
  that never arrives: recall the gotcha first.
- **Useful flags:** `--sort lmd` (newest-modified first), `--since <ISO>`
  (recent notes only), `--top N`;
  `memgrep find "+term -term" "$MEMDIR"` for keyword search and
  `--only-notes` to search only the lessons-learned.

## Output

A short ranked list of `path — description` lines (memgrep) or matching paths
(grep fallback), best first. Read the top few; do NOT dump full note bodies
into the conversation — open the one you need.

## Examples

<example>
User: the pie chart freezes after I flip the page to dark mode
→ recall "chart frozen stops resizing after switching theme" → surfaces the
  Chart.js ResizeObserver note with its lessons appended; read it WHOLE before
  touching the runtime.
</example>

<example>
User: generate the weekly status report page
→ before rendering: recall "which theme should the page use / layout
  preferences for reports" → applies the recorded house style (e.g. always
  light + dark) without re-asking.
</example>

```text
User: recall what we decided about selection payloads
User: have we seen this leaked-browser-page problem before?
User: check the memory notes about theming gotchas
```

## Scope

ONLY searches + surfaces existing memory notes (read-only). Does NOT write
notes (use `amvcp-memory-write`). Degrades to plain grep when memgrep is
absent; never blocks on a missing binary.

## Resources

- `rules/memory-protocol.md` (this plugin) — the recall protocol: the one law,
  the note schema, the read-the-notes rule, the dual-test method.
- `amvcp-memory-write` — the WRITE side (authoring + the correction protocol).
- `ai-maestro-janitor/tools/memgrep` — the memgrep tool source + its
  reference doc.
