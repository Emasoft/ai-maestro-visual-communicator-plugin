# Example Flows

Four worked, end-to-end examples of how the `amvcp-visual-communication`
coordinator picks a sub-skill, authors a page, runs the selection runner,
and reacts to the click.

## Table of contents

- [Example 1 — Quick architecture diagram](#example-1--quick-architecture-diagram)
- [Example 2 — Comparison table that asks a question](#example-2--comparison-table-that-asks-a-question)
- [Example 3 — Agent report as a commentable interactive page](#example-3--agent-report-as-a-commentable-interactive-page)
- [Example 4 — Slide deck from a plan](#example-4--slide-deck-from-a-plan)

---

## Example 1 — Quick architecture diagram

User: *"Show me the architecture of the auth subsystem."*

1. Author `auth-architecture.html` with `flowchart TD` (8 nodes, gold accent,
   Editorial aesthetic).
2. Wire each node with `click X call veSelectMermaid("X","Label")`.
3. Run the selection runner with the default 600s timeout.
4. The user clicks the `JWT` node → runner emits
   `{"kind":"submit","count":1,"selections":[{"kind":"element","id":"ve-node-JWT","type":"mermaid-node","label":"JWT"}]}`.
5. Reply: *"You selected the element **JWT** (`mermaid-node: ve-node-JWT`).
   What do you want me to do about it?"*

Sub-skill loaded: `amvcp-graph-diagrams` (Mermaid integration).

## Example 2 — Comparison table that asks a question

User: *"Compare these three caching strategies and let me pick one."*

1. Author `caching-comparison.html` with a `<table data-ve-type="table-form"
   data-ve-mode="single">`. Each row is a strategy. The runtime injects radio
   controls + a Submit button.
2. Open with the runner.
3. The user picks "LRU with TTL" → runner emits
   `{...,"selections":[{"kind":"element","data":{"question":"Pick a strategy","selected":[{"label":"LRU with TTL"}]}}]}`.
4. Reply: *"You answered **Pick a strategy** with **LRU with TTL**.
   Proceeding."*

Sub-skill loaded: `amvcp-choice-tables` (table-form schema).

## Example 3 — Agent report as a commentable interactive page

User: *"Render this audit report as an interactive page so I can comment on
each finding."*

1. Run `/amvcp-interactive-report audit.md` (renderer + transport).
2. In a separate session, run `/amvcp-respond-to-comment --queue-dir <q>
   --watch --source audit.md` (responder loop).
3. The user opens the page, types a reply on Finding 3, hits Submit.
4. The responder picks up `<threadId>.jsonl`, dereferences `commentId` via
   `audit.idmap.json`, writes `<threadId>.reply.2.json` atomically.
5. The page polls and renders the reply within ~2s. Per-finding decision
   toggles (approve/reject — both off = skip) emit decision-only turns into
   per-finding JSONL files. See the `amvcp-modal-comments` sub-skill for the
   full schema and the shared `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md`
   for the modal UI contract.

Sub-skill loaded: `amvcp-modal-comments` (v2/v3 agent-report flow).

## Example 4 — Slide deck from a plan

User: *"Turn this implementation plan into a slide deck."*

1. Read the slide-deck-mode and slide-patterns references inside the
   `amvcp-slide-decks` sub-skill. Inventory the source (sections, decisions,
   file lists, etc.).
2. Pick a preset (Midnight Editorial, Warm Signal, Terminal Mono, Swiss
   Clean) and commit.
3. Author the deck — every section, decision, data point from the source
   must appear as a slide. A 22-slide deck that covers everything beats a
   13-slide deck that drops 40% of content.
4. Open with the runner (the deck is interactive; clicking a slide element
   returns its label).

Sub-skill loaded: `amvcp-slide-decks` (slide patterns + deck mode).
