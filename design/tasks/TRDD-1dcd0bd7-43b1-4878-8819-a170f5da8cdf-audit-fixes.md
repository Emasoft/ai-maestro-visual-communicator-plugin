# TRDD-1dcd0bd7 — Comprehensive audit fixes (v1.1.7 target)

**TRDD ID:** `1dcd0bd7-43b1-4878-8819-a170f5da8cdf`
**Filename:** `design/tasks/TRDD-1dcd0bd7-43b1-4878-8819-a170f5da8cdf-audit-fixes.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)
**Status:** In progress (2026-05-09)

## 1. Original user request (verbatim)

> audit the whole plugin. check if all scripts are doing their job, if there
> are errors in paths, wrong instructions, instructions that cannot be
> followed, outdated api or references files, conflicts, inconsistencies,
> cross platform compatibility issues, outdated protocols, missing
> modularization, waste of tokens, inefficiency, lack of checklist
> verification in skills, skills too big that needs to be reduced in size by
> extracting reference .md files and linking them, incorrect project
> configuration, missing ci pipeline scripts, outdated dependencies,
> outdated ci pipeline, unresolved issues, poor documentation of features,
> env var issues, data folder issues, logical flaws, incomplete workflows,
> missing instructions, missing tools usage instructions, race conditions
> and potential issues. fix all issues.

## 2. Audit reports

Four parallel audits ran on 2026-05-09 with read-only scope. Each produced
a report at `reports/audit-20260509/`:

| Report | Findings | LOC |
|---|---|---|
| `python-shell-correctness.md` | 4 CRITICAL, 11 MAJOR, 12 MINOR, 6 NIT | 277 |
| `javascript-runtime.md` | 4 CRITICAL, 16 MAJOR, 17 MINOR, 8 NIT | 328 |
| `docs-workflows.md` | 8 CRITICAL, 8 MAJOR, 7 MINOR, 5 NIT | 392 |
| `cicd-deps-config.md` | 0 CRITICAL, 2 MAJOR, 3 MINOR, 11 NIT | 562 |

**Read each in full before changing the corresponding files.** This TRDD
references finding IDs from those reports; the detail is in the reports.

## 3. Cross-finding overlaps (deduplication)

The same defect is reported in multiple audits — fix once, marked off in all:

| Defect | python-shell | javascript-runtime |
|---|---|---|
| `/__ve-comment-summary` endpoint missing in production | F-2 | C1 |

Cross-references between docs-workflows audit and the others:

| Defect | docs-workflows | source-of-truth |
|---|---|---|
| Cursor config stale (output dir, slash command names, paths) | C5 | docs-workflows.md |
| Templates' trailing comments reference old `../references/` path | C2 | docs-workflows.md |

## 4. Phase plan

### Phase A — CRITICAL security + correctness (must land in v1.1.7)

| # | ID | File | Fix |
|---|----|------|-----|
| A1 | python F-1 | `scripts/amvcp-select.py` | Port `_safe_tid` from `tests/server.py`. Apply to `/__ve-comment` POST and `/__ve-reply/<tid>` GET. Reject malformed threadIds with HTTP 400. |
| A2 | python F-2 / js C1 | `scripts/amvcp-select.py` | Port `/__ve-comment-summary` POST handler from `tests/server.py:174-195` (atomic tmp+rename write of `<tid>.summary.json`). |
| A3 | python F-9 | `scripts/amvcp-select.py`, `tests/server.py` | Add per-tid `threading.Lock` (use `WeakValueDictionary[str, Lock]`) before opening `<tid>.jsonl` in append mode, so concurrent writes don't tear lines past PIPE_BUF. |
| A4 | js C2 | `scripts/amvcp-runtime.js:4578` | Walk `findingReplyTimers` and `clearTimeout(t)` on each value before reassigning the map. Prevents ghost finding-reply re-pushes after ESC. |
| A5 | js C3 | `scripts/amvcp-runtime.js:2722, 2738` | Scope `enableGraphZoom`'s mousemove + mouseup listeners to the viewport (not document); detach on dragend OR use `pointerdown` + `setPointerCapture`. Stops O(N) listener leak per graph. |
| A6 | js C4 | `scripts/amvcp-runtime.js:5003-5011` | Change `.then(poll)` to bail when fetch failed. Catch returns `false`, then `.then(ok => ok && poll())`. Surface error in pending turn UI. |

### Phase B — Cross-platform claims + git half-state

| # | ID | File | Fix |
|---|----|------|-----|
| B1 | python F-3 | `scripts/amvcp-select.py:264-281, 552-555` | Gate `kill_browser_tree` body with `if os.name != "nt": <unix>` else `proc.terminate(); proc.wait(timeout=2)`. Add `AttributeError` to the except tuples for defence-in-depth. |
| B2 | python F-4 | `scripts/publish.py:431-433` | Replace two pushes with single `git push --atomic origin HEAD vX.Y.Z`. Wrap in try/except and on failure: `git tag -d` + `git reset --soft HEAD~1` + clear error. |
| B3 | python F-10 | `tests/run-tests.py:113, 68` | `"python3"` → `sys.executable`; `"uv"` → `shutil.which("uv") or sys.executable`. Same fix that publish.py:278 already does. |
| B4 | python F-27 | `tests/run-tests.py:37`, `tests/server.py:236` | `Path("/tmp/ve-comments-tests")` → `Path(tempfile.gettempdir()) / "ve-comments-tests"`. |
| B5 | python F-5 + F-6 | `scripts/amvcp-select.py:353-354`, `tests/server.py:71-78, 113-119` | Replace hand-rolled query parsing with `urllib.parse.parse_qs`. Wrap `int(since)` in try/except, return 400 on bad input. |

### Phase C — Docs broken paths (TRDD-6151a6a4 missed wave)

| # | ID | Files | Fix |
|---|----|-------|-----|
| C1 | docs C1 | 9 command files | Replace every `./references/X.md` (or `references/X.md`) with `../skills/amvcp-visual-communication/references/X.md`. Replace every `./templates/X.html` with `../templates/X.html`. Use `commands/amvcp-interactive-report.md` lines 17, 87 as the model. Specific files: `amvcp-diff-review.md`, `amvcp-fact-check.md`, `amvcp-generate-slides.md`, `amvcp-generate-visual-plan.md`, `amvcp-generate-web-diagram.md`, `amvcp-plan-review.md`, `amvcp-project-recap.md`, `amvcp-share-page.md`, `amvcp-respond-to-comment.md`. |
| C2 | docs C2 | 4 templates | `templates/architecture.html:626`, `templates/data-table.html:632`, `templates/mermaid-flowchart.html:745`, `templates/slide-deck.html:919` — each ends with `See ../references/interactive-selection.md`. Update to `../skills/amvcp-visual-communication/references/interactive-selection.md`. |
| C3 | docs C3 | `commands/amvcp-share-page.md:42` | `$CLAUDE_PROJECT_ROOT/scripts/share.py` → `$CLAUDE_PLUGIN_ROOT/scripts/share.py`. |
| C4 | docs C4 | 7 command files | Replace `<skill-dir>/scripts/amvcp-select.py` with `$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py`. Affected: `amvcp-diff-review.md`, `amvcp-fact-check.md`, `amvcp-generate-slides.md`, `amvcp-generate-visual-plan.md`, `amvcp-generate-web-diagram.md`, `amvcp-plan-review.md`, `amvcp-project-recap.md`. SKILL.md:100 already does it correctly — copy that pattern. |
| C5 | docs C5 | `configs/cursor/ai-maestro-visual-communicator.mdc` | Rewrite to match the `configs/codex/AGENTS.md` template adjusted for cursor. New plugin/skill names, new output dir (`$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`), new slash commands (`/amvcp-*`), new SKILL.md location (`skills/amvcp-visual-communication/SKILL.md`). |
| C6 | docs C6 | 5 stale slash command refs | `/share-page` → `/amvcp-share-page` (4 hits: `commands/amvcp-share-page.md:20-21`, `commands/amvcp-interactive-report.md:32`, `skills/.../references/interactive-selection.md:1938`); `/respond-to-comment` → `/amvcp-respond-to-comment` (1 hit: `commands/amvcp-respond-to-comment.md:68`). |
| C7 | docs C7 | `THIRD_PARTY_NOTICES.md` | `scripts/ve-regex.umd.js` → `scripts/amvcp-regex.umd.js`; `ve-regex.LICENSE` → `amvcp-regex.LICENSE`. Reconcile claim "vendor/ never ships" vs `package.json` listing `vendor` in `files`: keep `vendor/` shipped (the doc claim is the wrong one — vendored regex-vis source IS shipped per the build artefact pipeline; reword). |
| C8 | docs C8 | `commands/amvcp-interactive-report.md` + `commands/amvcp-respond-to-comment.md` + `skills/.../references/modal-comments.md` | Add a "Queue-dir contract" subsection in all three: document the `VE_COMMENT_DIR` env var, the default-cwd pitfall, and instruct both the renderer-launching agent and the responder-running agent to share the same path. Make `/amvcp-interactive-report` print the absolute queue dir at startup; have `/amvcp-respond-to-comment` docs say "use the path the renderer printed". |

### Phase D — Other docs/config fixes

| # | ID | File | Fix |
|---|----|------|-----|
| D1 | docs M1 | `design/tasks/TRDD-6151a6a4-….md:6` | `Status: In progress (2026-05-09)` → `Status: Done (2026-05-09 — shipped in v1.1.6)`. |
| D2 | docs M2 | `design/tasks/TRDD-7a980994-….md:6` | `Status: Not started — awaiting phase 1 approval` → `Status: Phases 1-7 shipped (verified empirically through 2026-05-06)`. |
| D3 | docs M3 | `commands/amvcp-diff-review.md:26`, `commands/amvcp-project-recap.md:20` | Drop the `~/.agent/memory/{project}/progress.md` hardcoded path. Replace with: "Read any harness-specific session memory if available (e.g., the AI Maestro inbox)." |
| D4 | docs M4 | `configs/opencode/AGENTS.md:7` | Restore the lost path: `under \`\`` → `under \`skills/amvcp-visual-communication/\``. Also update `/share-page` → `/amvcp-share-page`. |
| D5 | docs M5 | `skills/amvcp-visual-communication/SKILL.md` | Add a documented env-vars section in Prerequisites: `VE_COMMENT_DIR`, `VE_SELECT_BROWSER`, `VE_SELECT_NO_BROWSER`, `VE_SELECT_NO_APP`, `VE_SELECT_TIMEOUT` — what each does, default value, when to set. |
| D6 | docs M6 | `commands/amvcp-share-page.md:20-21` | Add `visual-communicator/` to the example output path. Update `/share-page` → `/amvcp-share-page`. |
| D7 | docs M7 | `commands/amvcp-respond-to-comment.md:97` | `commands/interactive-report.md` → `commands/amvcp-interactive-report.md` and update description: "v2 modal-comment thread renderer". |
| D8 | docs M8 | `skills/amvcp-visual-communication/SKILL.md:5, 27` | "Python 3" → "Python 3.12+". |

### Phase E — CI/CD fixes

| # | ID | File | Fix |
|---|----|------|-----|
| E1 | ci M1 | `.github/workflows/ci.yml:46-51` | Move `SCANDIR` from `env:` to `with:`. Use `scandir: './scripts'` + `additional_files: 'tests/server.py .githooks/pre-push'` + `ignore_paths: vendor`. Bump action version (per E2). |
| E2 | ci M2 | `.github/workflows/ci.yml`, `.github/workflows/notify-marketplace.yml` | `peter-evans/repository-dispatch@v3` → `@v4` (or current latest); `ludeeus/action-shellcheck@master` → tag-pin to current latest (then optionally SHA-pin via pinact later). Verify no breaking input changes. |
| E3 | ci n3 | `.github/workflows/notify-marketplace.yml:34-36` | Lift `${{ github.event.repository.name }}` and `${{ github.sha }}` into a step `env:` block per the project's gh-actions.md rule. |
| E4 | ci n11/.gitignore | `.gitignore` | Add bare `node_modules/` entry so a top-level `npm install` is gitignored (currently only `vendor/*/node_modules/` is). |

### Phase F — Renderer + minor scripts

| # | ID | File | Fix |
|---|----|------|-----|
| F1 | python F-22 | `scripts/render-interactive-report.py:702-706` | Atomic write of `idmap.json`: `tmp = path.with_suffix(".json.tmp"); tmp.write_text(...); tmp.replace(path)`. |
| F2 | python F-26 | `scripts/render-interactive-report.py:54-57` | Lowercase the META_COMMENT_RE attr keys during parsing so `Severity="major"` matches `if "severity" in f.meta`. |
| F3 | python F-14 | `scripts/share.py:113-118` | Add `if not shutil.which("bash"): _eprint("bash not on PATH; install Git-for-Windows or run inside WSL"); return 1` pre-check before invoking bash. |
| F4 | js M1 / M6 | `scripts/amvcp-runtime.js` | Delete dead code: `showSendingOverlay` (lines 811-817), `showSentThenClose` (lines 819-849), no-op ESC handler (lines 4564-4568), `lastClickChain.firstClickOnly` dead assignment (line 3558). |
| F5 | js M2 | `scripts/amvcp-runtime.js:3333` | Use the `preEl` arg: `if (!preEl.contains(pos.node)) return null;` OR drop the unused arg. |
| F6 | js M9 | `scripts/amvcp-runtime.js:1406` | Chain `chartInstance.options.onClick` instead of replacing — preserve any pre-existing handler. |
| F7 | js M10 | `scripts/amvcp-runtime.js:2791-2798` | Capture `setTimeout` handle, `clearTimeout` it on observer success in `watchForTikzRender`. |
| F8 | js M11 | `scripts/amvcp-runtime.js:5060` | Add exponential backoff (1.5 → 3 → 6 → 12s, cap 30s) and max-retry counter to `pollForCommentReply`. After N consecutive failures, surface an error in the pending UI. |

### Phase G — Verify + publish

| # | Step |
|---|------|
| G1 | `python3 tests/run-all-tests.py` → 32/32 PASS |
| G2 | `ruff check scripts/ tests/` → clean |
| G3 | `uvx --from git+https://github.com/Emasoft/claude-plugins-validation --with pyyaml cpv-remote-validate plugin . --strict` → CRITICAL=0, MAJOR=0, MINOR=0, NIT=0 (WARNINGs OK) |
| G4 | Commit (with descriptive message referencing this TRDD) |
| G5 | `uv run python scripts/publish.py --patch --push` → publishes v1.1.7, all 3 GitHub workflows green |

## 5. Hard constraints

1. **`vendor/regex-vis/` untouched** (frozen upstream).
2. **DOM/CSS namespace `ve-*` stays** (per TRDD-6151a6a4 §4) — only renaming is in script file names, never in `data-ve-*` or `.ve-*` symbols.
3. **localStorage key `ve-comment-thread:` stays** — would orphan persisted user drafts.
4. **All 32 dev-browser tests must continue to pass.**
5. **`ruff check scripts/ tests/` clean.**
6. **No `--no-verify`, no skipped gates.** Every fix is real, not a CPV-config workaround.
7. **CHANGELOG history immutable** — git-cliff appends the new release section on publish.
8. Every fix must be **minimally invasive** — do not refactor what isn't on the fix list.
9. **Use `git mv` if a file is renamed.** Don't delete-then-create.
10. Stage with explicit file names (per the `never-git-add-all` rule).

## 6. Deliberately deferred (not in this TRDD)

The audits surfaced significant work that doesn't belong in v1.1.7:

- **JS modularization** (split `amvcp-runtime.js` into 5 modules per js audit §"Modularization candidates"). High value, but ~5000 LOC refactor needs its own TRDD with a phased rollout plan.
- **CSS extraction** (move 600 LOC inline CSS to `amvcp-runtime.css` sibling). Same — separate TRDD.
- **Test coverage gap** (the 17 untested runtime features per js audit CC4). Each missing test category (table-form, prose, math, TikZ, graph zoom, etc.) is its own dev-browser test file.
- **`actionlint` step in CI** (ci n1). Would have caught E1 — add in a follow-up.
- **macOS smoke matrix** (ci m2). Add in a follow-up.
- **Conventional-commit gate** (ci n6). Worth doing but separate concern.
- **`RC-DATA-INSTALLER-001`** (SessionStart hook installing deps into `${CLAUDE_PLUGIN_DATA}`). Already deferred per TRDD-6151a6a4.
- **`RC-PIPELINE-DRIFT-001`** (publish.py + workflows + cliff.toml + .markdownlint.json migration to latest CPV canonical templates). Already deferred per TRDD-6151a6a4.
- **`webbrowser.open` UX overlay** (python F-17). UX polish.
- **`find_chromium_binary` X_OK check** (python F-20).
- **JSON content-length DoS bound** (python observation §6 in cross-cutting).
- **`os.chdir` process-wide side effect** (python F-32).
- **`Path.home() / ".pi"` Pi-Windows latent assumption** (python F-21).
- **OL_RE / inline regex edge cases** (python F-24, F-25).
- **`escapeHtml` cleanup** (js m2, m3).
- **`ResizeObserver` disconnect path** (js m4).
- **Various JS NITs** (`'use strict'`, `var`→`let/const`, eslint config, prefix consistency in console.warn).
- **TRDD historical "Plugin: visual-explainer" lines in 3 TRDDs** (docs N4) — historical artefacts.
- **Reference file size split** (interactive-selection.md 1957 lines etc.) — defensible as-is per docs audit verdict.

These will land in subsequent TRDDs after v1.1.7 ships clean.

## 7. Out of scope

- Vendor build pipeline changes.
- `tests/scenarios/` (handled by separate scenario test runner).
- `vendor/regex-vis/` source.
- DOM/CSS migration.
- Migrating the on-disk plugin folder name.

## 8. Acceptance criteria

- [ ] All Phase A items resolved (CRITICAL security + correctness).
- [ ] All Phase B items resolved (cross-platform + git half-state).
- [ ] All Phase C items resolved (docs broken paths).
- [ ] All Phase D items resolved (other docs/config fixes).
- [ ] All Phase E items resolved (CI/CD fixes).
- [ ] All Phase F items resolved (renderer + JS quick-wins).
- [ ] G1-G5 verification all green; v1.1.7 published.
- [ ] All 4 audit reports in `reports/audit-20260509/` referenced from this TRDD remain on disk for traceability.
- [ ] A short follow-up report at `reports/trdd-1dcd0bd7/<ts>-implementation.md` summarising what landed and what was deliberately deferred to next TRDDs.

## 9. Open questions

None blocking. All design decisions explicit in §4-§7.
