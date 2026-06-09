---
trdd-id: bac00789-95b9-43d6-9c49-9ea679edf8b6
title: Adopt the markdown memory system — memory-protocol rule + recall/write skills
column: complete
created: 2026-06-09T23:52:17+0200
updated: 2026-06-09T23:52:17+0200
current-owner: amvcp-dev
assignee: amvcp-dev
priority: 3
severity: MEDIUM
effort: M
labels: [memory, memgrep, issue-2]
task-type: feature
parent-trdd: null
npt: []
eht: []
blocked-by: []
relevant-rules: []
release-via: publish
delivery: pull-request
target-branch: main
feature-branch: feat/2-markdown-memory
merge-strategy: squash
must-pass-tests-before-merge: true
test-requirements: [unit]
review-requirements: [human-review]
runtime-targets: [macos, linux, windows]
impacts: []
attempts: 1
test-failures: 0
last-test-result: pass
last-test-at: 2026-06-09T23:50:00+0200
implementation-commits: []
pr-url: null
external-refs: ["github.com/Emasoft/ai-maestro-visual-communicator-plugin/issues/2"]
---

# TRDD-bac00789 — Adopt the markdown memory system

**Filename:** `design/tasks/TRDD-20260609_235217+0200-bac00789-markdown-memory-system.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)

## What

Implements GitHub issue #2: the AI-Maestro markdown memory system for the
VISUAL-COMMUNICATOR role — **{ rule · skills · tests · wiring }**.

| Piece | Path |
|---|---|
| Rule | `rules/memory-protocol.md` — recall protocol, the one law (symptom-indexed descriptions), note schema, lessons conventions, dual-test method |
| Recall skill | `skills/amvcp-memory-recall/SKILL.md` — symptom → ranked notes; gates on `command -v memgrep`, falls back to `grep -rliE` |
| Write skill | `skills/amvcp-memory-write/SKILL.md` — schema-valid note + `MEMORY.md` index line; 2-step non-destructive correction protocol |
| Tests | `tests/test-memory-skills.py` (6 tests) + `tests/fixtures/memory/` (3 schema-valid notes + index) |
| Runner wiring | `tests/run-tests.py` — `run_memory_suite()` merges the CLI suite's `TEST \|` rows into the unified table; respects `--only test-memory-skills` |
| Role-doc wiring | `README.md` "Memory (recall before you render)" section + `CLAUDE.md` standing rule |

The optional auto-recall hook from the issue was NOT added (explicitly
optional; keeps the surface opt-in-free and CPV-lean).

## Why

Every session re-derives the same facts (house style, theming gotchas, prior
decisions). A fresh VISUAL-COMMUNICATOR agent is blind to the note corpus even
when the answer was written down last week. Recall-before-render closes that
loop; symptom-indexed descriptions make notes findable from the problem, not
the answer's jargon.

## Design decisions

- **Degrade, never break:** both skills run the exact same gated snippet the
  tests exercise; with memgrep absent the grep branch returns matches and the
  memgrep-specific test asserts the gate's absence-detection instead of
  silently skipping (no fake passes, no xtests).
- **memgrep is NOT bundled:** it lives in `ai-maestro-janitor/tools/memgrep`
  (cargo install pointer documented in the rule, both skills, and README).
- **Tests are CLI-level, browser-free**, and run BEFORE the dev-browser stack
  in `run-tests.py` so a server/browser problem can't mask them.

## Verification (2026-06-09)

- `python3 tests/test-memory-skills.py` → 6/6 PASS (memgrep present).
- `python3 tests/run-tests.py --only test-memory-skills` → 6/6 PASS in the
  unified table, exit 0 (integration + `--only` filter verified).
- Fallback exercised under a minimal PATH that excludes memgrep → grep branch
  returns the fixture note.

## Acceptance mapping (issue #2)

- [x] `rules/memory-protocol.md` present + registered (referenced by both
      skills, README, CLAUDE.md; presence asserted by `memory-registration`).
- [x] `amvcp-memory-recall` + `amvcp-memory-write` skills, each tested, each
      degrading to grep when memgrep is absent.
- [x] VISUAL-COMMUNICATOR workflow wiring documented (README + CLAUDE.md).
- [x] No hook added (optional clause — intentionally skipped).
- [x] CPV-clean (validated pre-merge on the feature branch).
