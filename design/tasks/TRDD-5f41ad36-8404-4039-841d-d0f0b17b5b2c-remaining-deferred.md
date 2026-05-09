# TRDD-5f41ad36 — Remaining deferred items from prior audits

**TRDD ID:** `5f41ad36-8404-4039-841d-d0f0b17b5b2c`
**Filename:** `design/tasks/TRDD-5f41ad36-8404-4039-841d-d0f0b17b5b2c-remaining-deferred.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)
**Status:** In progress (2026-05-09)

## 1. User direction

> do the remaining

Plus the prior clarification:

> no need to split the js into 5 modules. the loc limit only applies to skills.

So: take the deferred-list from `TRDD-1dcd0bd7 §6` and finish whatever is
both (a) actionable now and (b) not vetoed. The runtime-LOC-driven
refactors (`amvcp-runtime.js` 5-way split + sibling CSS extraction)
are now permanently off the list and are removed from the deferred
catalogue here too.

## 2. Items in scope (this TRDD)

| # | ID | Source | Severity | Effort |
|---|----|--------|----------|--------|
| 1 | content-length DoS bound | python audit cross-cutting §6 | safety | trivial |
| 2 | `webbrowser.open` stale-tab UX | python audit F-17 | UX | small |
| 3 | actionlint step in CI | ci audit n1 | guard | small |
| 4 | conventional-commit gate on PRs | ci audit n6 | guard | small |
| 5 | macOS smoke matrix in CI | ci audit m2 | coverage | small |
| 6 | SHA-pin third-party actions (`peter-evans/repository-dispatch`, `ludeeus/action-shellcheck`) | ci audit M2 follow-up | supply-chain | small |
| 7 | `regex_live_value_edit` flake investigation | js audit notes | reliability | medium |
| 8 | First wave of test-coverage gap-fill (5 features, not all 17) | js audit CC4 | coverage | medium |

## 3. Items deliberately removed from the deferred list

Per the user's clarification:

| # | Item | Reason |
|---|------|--------|
| - | JS modularization (`amvcp-runtime.js` 5-way split) | LOC limit applies only to SKILL.md. Runtime is loaded once per browser page; size doesn't tax Claude's token budget. |
| - | CSS extraction to sibling `amvcp-runtime.css` | Same rationale — cosmetic file-size split with no real-world payoff. Revisit only if a real coupling problem appears. |
| - | Reference-file size split (interactive-selection.md 1957 LOC, css-patterns.md 1836, slide-patterns.md 1424) | Docs audit verdict was "defensible as-is — none orphans, all single-topic with TOCs". Splitting just for size moves zero needles. |

## 4. Items deferred to their own follow-up TRDDs (not this one)

These need richer scope discussion than fits this TRDD:

| # | Item | Why deferred |
|---|------|--------------|
| - | `RC-DATA-INSTALLER-001` (SessionStart hook installing deps into `${CLAUDE_PLUGIN_DATA}`) | The plugin has zero JS/Python runtime deps (verified by `pyproject.toml` + `package.json`). The CPV WARNING fires because the canonical pattern expects a SessionStart hook even when there's nothing to install. Fixing it cleanly requires either a no-op hook (cosmetic) or a CPV upstream issue to relax the rule for dep-less plugins. Either way: separate decision, separate TRDD. |
| - | `RC-PIPELINE-DRIFT-001` (publish.py + workflows + cliff.toml + .markdownlint.json migration to latest CPV canonical templates) | The plugin's pipeline is heavily customised (atomic git push, --gate / --install-hook modes, idempotent S6 with uv lock auto-sync, 4-gate G1-G4). Auto-migrating to canonical templates would clobber these deliberate customisations. Needs a careful diff-and-port pass, not a wholesale replace. Worth its own TRDD. |
| - | Remaining 12 untested runtime features (after this TRDD lands the first wave of 5) | Each needs a dedicated dev-browser test file with anchor discovery, event simulation, assertion. ~85 new tests is multi-session work. Fan out into 4 TRDDs of ~3 features each. |

## 5. Phase plan

### Phase A — Quick safety/correctness fixes

| # | ID | File | Fix |
|---|----|------|-----|
| A1 | content-length DoS | `scripts/amvcp-select.py` POST handlers + `tests/server.py` POST handlers | Cap `int(self.headers.get("content-length") or 0)` at a sane upper bound (e.g. 2 MB for `/__ve-select`, 256 KB for `/__ve-comment*`). Reject with 413 Payload Too Large above the cap. |
| A2 | webbrowser.open UX | `scripts/amvcp-select.py:577-580` | When the Chromium fallback is used and selection is received, redirect the page to a "Selection received — close this tab" view (HTTP 302 to `/__ve-thanks` rendered server-side) so the user knows the script terminated even though `window.close()` is denied for opener-unattached tabs. |

### Phase B — CI/CD additions

| # | ID | File | Fix |
|---|----|------|-----|
| B1 | actionlint | `.github/workflows/ci.yml` | Add `rhysd/actionlint@<sha>` step in the `lint` job. Would have caught the SCANDIR `env:` regression. Tag-pin to latest stable. |
| B2 | conventional-commit gate | `.github/workflows/ci.yml` | Add `wagoid/commitlint-github-action@<sha>` (or equivalent) to PR runs only — non-conventional commits get rejected before they enter the CHANGELOG. |
| B3 | macOS matrix | `.github/workflows/ci.yml` | Add `runs-on: ${{ matrix.os }}` with `strategy.matrix.os: [ubuntu-latest, macos-latest]` to the `test` job (smoke check is just `python -m py_compile`, runs cleanly on macOS in seconds). |
| B4 | SHA-pin third-party actions | `.github/workflows/ci.yml`, `.github/workflows/notify-marketplace.yml` | Resolve current commit SHAs for `peter-evans/repository-dispatch@v4` and `ludeeus/action-shellcheck@2.0.0`; replace tag pins with `<sha> # vX.Y.Z` per the `~/.claude/rules/gh-actions.md` rule. |

### Phase C — Reliability

| # | ID | File | Fix |
|---|----|------|-----|
| C1 | regex flake | `tests/scripts/test-regex-panels.js` (the `regex_live_value_edit` test) | Investigate the flaky assertion (typed input not registered before snapshot). Likely fix: increase `waitForTimeout` after `keyboard.type`, OR poll for the expected `[abc]` value in the input field with a short timeout instead of a fixed sleep. |

### Phase D — Test-coverage first wave (5 of 17)

Add dev-browser tests for these 5 highest-impact features (one new test
per file at minimum, verifying happy path):

| # | Feature | New test file or extension |
|---|---------|---------------------------|
| D1 | Element click + multi-select toggling | `tests/scripts/test-multiselect.js` (new) — 3 tests: single click, ctrl-click multi, ESC clears |
| D2 | Submit/Exit buttons + ESC | extend `tests/scripts/test-multiselect.js` — 3 tests: Submit posts payload, Exit posts payload, ESC clears |
| D3 | Table-form (single/multi/free-text) | `tests/scripts/test-table-form.js` (new) — 3 tests: single-radio submit, multi-checkbox submit, free-text submit |
| D4 | Code-gutter line ranges | `tests/scripts/test-code-gutter.js` (new) — 2 tests: single-line click selects 1 line, drag selects range |
| D5 | Multi-click depth grammar 1-7 | extend an existing prose-related test — verify depth=1 (letter) → 2 (word) → 3 (block) all paint distinct selections |

The remaining 12 untested features (drag-text, math snippet, TikZ
regions, Graphviz click + zoom + pan, Chart.js wiring, paragraph
numbering, finding-reply textareas, free-text snippet popup, touch /
mobile, etc.) move to a follow-up TRDD.

### Phase E — Verify + publish

| # | Step |
|---|------|
| E1 | `python3 tests/run-all-tests.py` → all green (33 + new tests from D1-D5) |
| E2 | `ruff check scripts/ tests/` → clean |
| E3 | `uvx --from git+https://github.com/Emasoft/claude-plugins-validation --with pyyaml cpv-remote-validate plugin . --strict` → CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 |
| E4 | Commit, then `publish.py --patch --push` → v1.1.9, all 3 GitHub workflows green |

## 6. Hard constraints (same as prior TRDDs)

1. `vendor/regex-vis/` untouched.
2. DOM/CSS namespace `data-ve-*`, `.ve-comment-pill`, `.ve-decision`, `.ve-toggle*`, `ve-comment-thread:` localStorage prefix all stay.
3. All existing tests must pass (33/33 → 33+N/33+N where N is the count of new tests).
4. `ruff check scripts/ tests/` clean.
5. No `--no-verify`, no skipped CPV gates.
6. CHANGELOG history immutable.
7. Minimally invasive — do NOT refactor anything outside this TRDD's scope.
8. Use `git mv` if any rename happens.
9. Stage with explicit file names.
10. Do NOT bump version, do NOT commit, do NOT push from inside the kraken — the orchestrator does that after review.

## 7. Open questions

None blocking. All design decisions explicit.
