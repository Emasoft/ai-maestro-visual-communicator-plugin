---
trdd-id: 9GUATJL7
title: Ship amvcp v1.5.0 and resolve the owner decisions it surfaced
column: testing
created: 2026-08-08T15:07:58+0200
updated: 2026-08-11T22:35:43+0200
current-owner: ai-maestro-visual-communicator-plugin
assignee: ai-maestro-visual-communicator-plugin
priority: 2
severity: MEDIUM
effort: M
labels: [release, integration, governance, ci]
task-type: infra
release-via: publish
delivery: direct
target-branch: main
relevant-rules: []
impacts: [public-api]
parent-trdd: null
implementation-commits: []
external-refs: ["Emasoft/ai-maestro-visual-communicator-plugin#4", "Emasoft/ai-maestro-visual-communicator-plugin#5", "Emasoft/ai-maestro-visual-communicator-plugin#6", "Emasoft/ai-maestro-visual-communicator-plugin#7", "Emasoft/ai-maestro-visual-communicator-plugin#8", "Emasoft/ai-maestro-visual-communicator-plugin#9", "Emasoft/ai-maestro#132", "Emasoft/ai-maestro#134", "Emasoft/ai-maestro-janitor#235", "Emasoft/ai-maestro-plugins#17"]
---

# TRDD-9GUATJL7 — Ship amvcp v1.5.0 and resolve the owner decisions it surfaced

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-08-08

**Everything is committed on `main` (32 commits ahead of `origin/main`, tree clean).
Nothing is half-applied. The ONLY thing left is the publish — and as of 2026-08-11
the blocker is NO LONGER the host. It is a DEFECT IN THE PRE-PUSH HOOK. Read the
next section before doing anything.**

## ⛔ BLOCKER (2026-08-11) — the pre-push hook rejects our own resolver tag

The load gate was waited out and met (1-min 17.7 / 5-min 18.7, both under 20). The
pipeline then ran END-TO-END GREEN and still could not push:

- G2 ruff PASS · G3 CPV `--strict` **0 CRITICAL / 0 MAJOR / 0 MINOR / 0 NIT**
  (16 WARNING, allowed, no exemptions) · G4 **454/454 tests green** · S5 version
  consistency PASS · S6 bump 1.4.0→1.5.0 · S8 CHANGELOG regenerated (656 lines,
  30 sections — the git-cliff eraser did NOT recur) · S9 commit + both tags created.
- `git push --atomic origin HEAD v1.5.0 <name>--v1.5.0` was then **rejected by
  `git-hooks/pre-push`**:

  ```
  BLOCKED: Tag name does not match plugin version!
    Pushed tag(s): ai-maestro-visual-communicator-plugin--v1.5.0
    Expected: v1.5.0
  ```

- publish.py rolled back correctly (tags deleted, `reset --soft HEAD~1`). The repo
  was then restored by hand to clean / 1.4.0 / ahead 32 / behind 0 / no stray tags.

**TWO COMPOUNDING DEFECTS in `git-hooks/pre-push`** (tracked; live via
`core.hooksPath=git-hooks`; byte-identical to the stale `.git/hooks/pre-push` copy):

1. **`_classify_push_refs()` misclassifies the push.** It counts a branch only when
   LOCAL_REF starts with `refs/heads/`. publish.py pushes **`HEAD`**, which matches
   neither `refs/heads/` nor `refs/tags/`, so it is dropped from BOTH lists →
   `branch_refs` empty → `tag_only_push` is True for a push that is plainly
   branch+tags. **The guard fires only when `branch_refs` is empty — that it fired
   at all is the proof.** This guard was never meant to run on this push.
2. **The version check knows only one tag shape.** `expected_tag = f"v{local_version}"`,
   so the resolver twin `{name}--v{version}` — minted by publish.py itself this very
   cycle, and which DOES encode 1.5.0 — is reported as "mismatched".

Either fix alone unblocks; both are genuine. This is drift introduced BY this
release cycle: the `{name}--v{version}` resolver tag landed in publish.py and the
hook was never taught about it.

**NOT FIXED — needs the owner.** Editing a guard so it permits a push it currently
refuses is an owner decision, even though fix 1 restores intended behaviour rather
than weakening anything.

**Also fixed this session:** `.git/index.lock` was a **2-day-5.5-hour-old corpse**
(0 bytes, mtime Aug 9 16:47), not the 7–14 min staleness previously recorded. It
killed an earlier S9 at `git add`. Removed after verifying zero live git processes
in a 1001-process `ps` snapshot. NOTE: a *transient* lock also appears normally —
the `git_safety_guard` hook takes a stash backup before destructive git ops and
briefly holds the index. Retry with backoff before concluding staleness.

**NEXT ACTION — resolve the hook defect first, then:**

```bash
uv run python scripts/publish.py --minor --push \
  --message "doc-wiki visualizer, 3-pillars tooling, optional AI Maestro side-panel delivery"
```

**Do NOT run it above ~load 20.** Check `uptime` first. Four attempts failed gate
G4 with `Target crashed` / `Browser "default" is not running` / `Daemon connection
closed unexpectedly` / EAGAIN `os error 35`, on a DIFFERENT suite each time, while
every accused suite passed 100% in isolation. This host reached load average 197
with 40 concurrent Claude sessions. Full diagnosis + the two lessons:
[[test-suite-flakes-are-host-load]] (`memgrep recall "publish gate fails on a
different suite each run"`).

**Gate status at the last attempt** — G1 version-bump PASS · G2 ruff PASS ·
G3 CPV `--strict` **0 CRITICAL / 0 MAJOR / 0 MINOR / 0 NIT** (16-18 WARNING,
allowed) · G4 tests: 454/454 green twice when the host was quiet, flaky when not.

### What landed (all committed, none published)

- **Merges:** `chore/board-and-integration`, `feat/3-pillars-adoption` (PRRD +
  pillar resolver + lifecycle folders), `feat/doc-wiki-visualizer` (the
  `amvcp-doc-wiki` skill), plus 2 cherry-picks from
  `fix/ed5e8cc2-chartjs-resize-wedge`. `feat/strict-remediation` is SUPERSEDED —
  deliberately NOT merged, left in place, not deleted.
- **New:** `scripts/amvcp-panel-push.py` — optional AI Maestro side-panel delivery
  (amvcp is the FIRST caller of `aimaestro-panel.sh`; it had zero callers, see
  Emasoft/ai-maestro#132) + `tests/scripts/test-panel-push.py` (5 PASS).
- **Release-path fixes:** the `{name}--v{version}` resolver tag + historical
  backfill, and the git-cliff `--unreleased` changelog eraser (CHANGELOG.md went
  1 section → 30). Both in [[publish-gate-and-release-invariants]].
- **Test-runner fixes:** end-of-run daemon teardown + bounded wait for exit. A
  per-suite daemon restart was tried and REVERTED — it traded `Target crashed` for
  EAGAIN.
- **Governance:** recall-before-render in the umbrella skill, a real
  data-sensitivity warning on `amvcp-share-page`, the frozen-CLI invariant in
  `CLAUDE.md`.

### OPEN — owner decisions, none started, none safe to guess

1. **Marketplace placement.** amvcp is listed in `Emasoft/ai-maestro-plugins`
   (governed, 15 plugins) and NOT in `Emasoft/emasoft-plugins` (universal, 17) —
   measured via `gh api`. That contradicts amvcp's own `CLAUDE.md` identity as a
   universal standalone plugin. Neither catalog is this repo. → ai-maestro#134 §3.
2. **Panel wiring contract.** The ai-maestro server says do NOT build against the
   relayed contract; its TRDD will answer discovery / agent identity / size bounds
   / `delivered: 0` / which skills. My implementation uses defensible defaults and
   is optional-by-construction, so a wrong guess is a no-op, not a break. →
   ai-maestro#134 §1.
3. **agentlenspro.** Server wants it fleet-wide; their `TRDD-SLSSUIQ8` carries the
   hazard (usage rows carry NO account identity; attribution is exact 5h-cohort or
   nothing). amvcp spawns no subagents and burns no tokens of its own, so "consume
   it" may have no runtime meaning here. → ai-maestro#134 §2.
4. **`cpv-branch-rules` ruleset** (id 16148979) — redundant 4th ruleset on this
   repo, harmless because `baseline-pr-and-checks` unions over it. Deleting it is a
   baseline deviation = owner's call. → ai-maestro#134 §4.
5. **Provenance / SBOM — 4 MAJOR, unfixed.** `.github/workflows/release.yml:105`
   and `:142` build GitHub releases with NO SBOM and NO attestation anywhere in any
   workflow. Real supply-chain hardening; deliberately NOT bolted on immediately
   before a publish that is already fighting the host, and not verifiable without a
   real release.
6. **CPV `standardize . --fix`** on current CPV (5.3.0) so this repo converges on
   the canon rather than on my hand-written equivalents of the same two fixes. → #6.

### Load-bearing gotchas

- **The pre-push hook only accepts pushes whose process ancestry is `publish.py`.**
  A direct `git push` of the backfilled resolver tag was correctly refused; that is
  why the backfill lives INSIDE the pipeline.
- **`.git/index.lock` goes stale on this host under load** (observed twice, 0 bytes,
  7-14 min old, no git writer in a `ps` snapshot). Verify no live git process before
  removing it.
- **The janitor's memory agent is unavailable in this session** (`janitor#232`
  signature: the spawn error's own listing contains zero `ai-maestro-janitor:*`
  agents). Four memory passes queued behind it; `memgrep lint` sits at ~48 findings,
  1 ERROR.
- **Wikimem lessons MUST be authored via `memgrep add-atom`/`add-lesson`.** Hand-
  written ones render perfectly and parse as having NO keywords — silently
  unrecallable.

### SUPERSEDED — do NOT carry forward

- "Merge `feat/strict-remediation`" — its integration already landed on main by
  another path (`b14594d`); merging it only re-adds conflict surface.
- "The test failures are a leak inside one run" — they are host contention; the
  per-suite daemon restart built on that premise was reverted.

## 1. Acceptance criteria

- [ ] `publish.py --minor --push` completes green and v1.5.0 is on the marketplace.
- [ ] The `ai-maestro-visual-communicator-plugin--v*` resolver tags are on origin
      (the backfill runs after the release push).
- [ ] The `from → to` row is posted on `Emasoft/ai-maestro#44` (promised on #6).
- [ ] Each of the 6 open decisions above is either resolved or explicitly deferred
      by the owner.
