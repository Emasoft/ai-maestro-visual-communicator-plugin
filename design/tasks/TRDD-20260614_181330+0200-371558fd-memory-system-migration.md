---
trdd-id: 371558fd-8d50-47da-a4cf-241556a335d8
title: Migrate amvcp to the global janitor-hosted 3-scope wiki memory system
column: testing
created: 2026-06-14T18:13:30+0200
updated: 2026-06-14T22:21:39+0200
current-owner: ai-maestro-visual-communicator-plugin
assignee: ai-maestro-visual-communicator-plugin
priority: 3
severity: LOW
effort: M
labels: [memory, governance, janitor, migration]
task-type: refactor
release-via: publish
delivery: pull-request
target-branch: main
feature-branch: feat/memory-migration
merge-strategy: squash
relevant-rules: [6]
impacts: [config-schema]
supersedes: [TRDD-bac00789]
parent-trdd: null
implementation-commits: []
external-refs: ["Emasoft/ai-maestro-visual-communicator-plugin#2", "Emasoft/ai-maestro-visual-communicator-plugin#3", "Emasoft/ai-maestro-janitor"]
---

# TRDD-371558fd — Migrate amvcp to the global janitor-hosted 3-scope wiki memory

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-06-14

**Goal:** replace amvcp's *per-plugin* memory adoption (issue #2, commit `11c6380`
— `rules/memory-protocol.md` + `skills/amvcp-memory-{recall,write}/`) with the
**global janitor-hosted 3-scope wiki** (issue #3) now that the janitor shipped
`/janitor-memory-bootstrap` in **0.8.5** (the gate that blocked this since the
branch was authored). User explicitly authorized: "migrate the plugin to the new
memory system."

**The 3-scope design (janitor 0.8.5, "final" per TRDD-4c3733d9):**
| Scope | Root | Git |
|---|---|---|
| LOCAL | `~/.claude/projects/<slug>/memory/` | harness-owned, never pushed |
| PROJECT | `<repo>/.claude/project/memory/` | **tracked + pushed** (in-repo) |
| USER | `~/.claude/plugins/data/ai-maestro-janitor-ai-maestro-plugins/memory/` | janitor's FIXED data dir |

Day-to-day legs are the GLOBAL skills `/janitor-memory-{recall,write,update}`
(amvcp ships NONE of its own — that is the whole point of the migration).

**✅ PHASE A — DONE (this branch, additive + verified):**
- `.gitignore` reconciled: bare `/.claude/` → `/.claude/**` (a bare dir-ignore
  prunes the tree and makes re-includes inert) + a scoped exception block
  (`!.claude/project/`, `!.claude/project/memory/`, `!.claude/project/memory/**`).
- Seeded PROJECT scope: `.claude/project/memory/architecture.md` (the hub) +
  `MEMORY.md` (the index).
- **Verified ground-truth** (not the misleading `check-ignore` exit code): `git
  add .claude/` stages ONLY the 2 memory files; `settings.json` / `history.jsonl`
  stay ignored — no over-broad leak.

**✅ PHASE B — DONE (gate cleared via rule-sync; this branch). Steps executed:**
1. `git rm rules/memory-protocol.md`
2. `git rm -r skills/amvcp-memory-recall/ skills/amvcp-memory-write/`
3. `git rm tests/test-memory-skills.py` and `git rm -r tests/fixtures/memory/`
   (4 fixtures: feedback_light_dark_themes.md, MEMORY.md,
   reference_chart_resize_wedge.md, project_selection_roundtrip.md).
4. Edit `tests/run-tests.py`: delete `run_memory_suite()` (≈ lines 385-430) AND
   its invocation block (≈ lines 432-436, `if wanted is None or
   "test-memory-skills" in wanted:`). Re-read after editing — the runner must
   still import + run clean.
5. Edit `README.md` (≈ lines 50-72, the "## Memory" section): rewrite to point at
   the GLOBAL system (`/janitor-memory-{recall,write,update}` +
   `~/.claude/rules/markdown-memory-recall.md` + the PROJECT scope at
   `.claude/project/memory/`); drop the stale `ai-maestro-janitor/tools/memgrep`
   path (memgrep now lives at `scripts/memgrep`).
6. Edit `CLAUDE.md`: add a short "## Memory" section folding the amvcp-UNIQUE
   wiring (the only content worth preserving from the removed artifacts) — the 3
   VISUAL-COMMUNICATOR recall moments (before rendering → recall house-style /
   confirmed prefs; before debugging a recurring runtime/test gotcha; before a
   familiar design decision) + the 3 write moments (confirmed style prefs →
   feedback; runtime/test gotchas → reference after autopsy; composition
   decisions → capture WHY) + a pointer to the global skills & recall rule.

**✅ THE GATE — CLEARED (2026-06-14 ~22:04):** the cutover was gated on either
(a) the janitor confirming `.claude/project/memory/` is final, OR (b) the installed
`~/.claude/rules/markdown-memory-recall.md` re-syncing to the new roots. **(b) is
met** — the installed rule is now IDENTICAL to the 0.8.10 cache (PROJECT =
`.claude/project/memory`, USER = janitor data dir), and the design held stable
across 0.8.5→0.8.7→0.8.8→0.8.10 (4 releases). The rule auto-refreshing is also the
empirical answer to janitor#37's core question (it DOES auto-refresh, on a session
reload). janitor#37 stayed unanswered (0c) but (b) is the stronger signal.

**Phase B catch (recheck saved this):** the first reference scan used a malformed
`grep -rnED` (the `-D` flag swallowed the pattern) → false "no external refs". A
correct re-scan found two MISSED references, both now handled: (1) `CLAUDE.md`
(the memory bullet — rewritten to the global system + the folded amvcp wiring),
and (2) `TRDD-bac00789` (the issue-#2 per-plugin adoption, ALREADY on main) —
marked `superseded` with `superseded-by: [TRDD-371558fd]` (bidirectional).

**NEXT ACTION:** verify `tests/run-tests.py` runs clean (memory suite removed) →
commit Phase B on `feat/memory-migration` → the OWNER merges after
`feat/3-pillars-adoption` (no-direct-push) → close the loop on amvcp#3 + janitor#37.

**Load-bearing facts / gotchas:**
- Base = `main` (f348b5d). `design/tasks/` ALREADY exists on main (it holds
  `TRDD-bac00789` — the earlier "only 3-pillars introduces design/tasks/" note was
  WRONG, caught by the recheck). This branch adds `TRDD-371558fd` + edits bac00789;
  `feat/3-pillars-adoption` adds its own distinct TRDDs, so a merge UNIONS
  `design/tasks/` with no conflict (different files). `.gitignore`, `CLAUDE.md`,
  `README.md` overlap: 3-pillars touched README.md (+22 lines, different section)
  but NOT `.gitignore` / `CLAUDE.md` — so order the merge 3-pillars → memory and
  resolve the README hunk if the squash collides.
- Removing the 2 skills is safe: NO code / plugin.json `allow_orchestrator_traversal`
  reference them (verified by full-repo grep).

**Durable artifacts to read before acting:**
- The bootstrap procedure: janitor 0.8.5
  `skills/janitor-memory-bootstrap/SKILL.md` (the 5 steps + the gitignore-exception
  logic + the proactive-use contract).
- amvcp issue #3 — the janitor's migration spec + amvcp's verified state comments.

## 1. User direction

"be sure to follow the instructions you received via github repo issues to
migrate the plugin to the new memory system." Supersedes the per-plugin adoption
(#2) with the global janitor 3-scope wiki (#3).

## 2. Acceptance criteria

- PROJECT scope live at `.claude/project/memory/` (hub + index), git-trackable
  with no over-broad `.claude/` leak. ✅ (Phase A)
- amvcp ships ZERO per-plugin memory skills/rules/tests; the global
  `/janitor-memory-*` skills + `~/.claude/rules/markdown-memory-recall.md` are the
  only memory surface. ⏳ (Phase B, gated)
- amvcp-unique recall/write wiring preserved in `CLAUDE.md`. ⏳ (Phase B)
- `tests/run-tests.py` runs clean after the memory-suite removal. ⏳ (Phase B)
- OWNER merges after `feat/3-pillars-adoption`; `publish.py` release. ⏳
