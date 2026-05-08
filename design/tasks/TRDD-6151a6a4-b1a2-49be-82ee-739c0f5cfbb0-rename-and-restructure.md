# TRDD-6151a6a4 — Plugin rename + structural cleanup (`amvcp-` namespace)

**TRDD ID:** `6151a6a4-b1a2-49be-82ee-739c0f5cfbb0`
**Filename:** `design/tasks/TRDD-6151a6a4-b1a2-49be-82ee-739c0f5cfbb0-rename-and-restructure.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)
**Status:** In progress (2026-05-09)

## 1. Original user request (verbatim)

> my god, no wonder the plugin was not found.. it was all wrong.. i fixed
> something, but i leave the rest to you:
>
> - rename all prefixes from aimvc-  to  amvcp-
> - rename the references to the plugin ai-maestro-visual-comunicator or
>   ai-maestro-visual-communicator, etc. to ai-maestro-visual-communicator-plugin
> - rename the references to the skill ai-maestro-visual-communicator or
>   ai-maestro-visual-communication, etc. to amvcp-visual-communication
> - rename the commands to have the prefix amvcp-
> - all skills must be under $CLAUDE_PLUGIN_ROOT/skills/
> - all commands must be under $CLAUDE_PLUGIN_ROOT/commands/
> - all scripts must be under $CLAUDE_PLUGIN_ROOT/scripts/
> - all hooks must be defined in $CLAUDE_PLUGIN_ROOT/hooks/hooks.json
> - all outputs generated must be saved in
>   $CLAUDE_PROJECT_ROOT/reports/visual-communicator/  (or subfolders)
> - all names references in the .md files must be changed
> - all the scripts beginning with vc_ or vc- must be renamed with the
>   prefix amvcp_ or amvcp-
> - all internal references must be updated
>
> even the manifest is probably in need to be updated, and so do all the
> various readme, docs, etc.

## 2. Problem and goal

The plugin currently fails to load in Claude Code sessions. Root cause:
the user deleted root `SKILL.md` and moved skill files into
`skills/amvcp-visual-communication/`, but `.claude-plugin/plugin.json`
still has `"skills": ["./"]` (pointing to root). The plugin manifest is
also wrong: `"name": "ai-maestro-visual-communicator"` instead of the
canonical `"ai-maestro-visual-communicator-plugin"` that matches the
GitHub repo.

The user has also begun renaming `aimvc-*` commands to `amvcp-*` and
established the `amvcp-visual-communication` skill folder. We need to
**finish the rename atomically** so:

- The plugin loads (manifest points at the right skill folder).
- Every textual reference matches the new namespace.
- Slash commands (`/amvcp-*`) are discoverable.
- All scripts owned by the plugin live under `scripts/`.
- The dev-browser test suite (32 tests) keeps passing.
- No stale `aimvc-` or non-`-plugin` plugin name references remain in
  user-facing surfaces (manifest, README, SKILL.md, commands, scripts,
  templates, configs, design docs).

## 3. Naming map

| Surface                          | Old                                   | New                                       |
|----------------------------------|---------------------------------------|-------------------------------------------|
| Plugin name (manifest)           | `ai-maestro-visual-communicator`      | `ai-maestro-visual-communicator-plugin`   |
| Plugin name in package.json/pyproject.toml | same as above                  | same as above                             |
| Skill name (Skill tool ID)       | (was implicit root SKILL.md)          | `amvcp-visual-communication`              |
| Skill folder                     | (root)                                | `skills/amvcp-visual-communication/`      |
| Slash-command prefix             | `aimvc-`                              | `amvcp-`                                  |
| Command files (10)               | `commands/aimvc-*.md`                 | `commands/amvcp-*.md` (already user-done) |
| Plugin-owned scripts (file names)| `scripts/ve-runtime.js`               | `scripts/amvcp-runtime.js`                |
|                                  | `scripts/ve-select.py`                | `scripts/amvcp-select.py`                 |
|                                  | `scripts/ve-regex.umd.js`             | `scripts/amvcp-regex.umd.js`              |
|                                  | `scripts/ve-regex.css`                | `scripts/amvcp-regex.css`                 |
|                                  | `scripts/ve-regex.LICENSE`            | `scripts/amvcp-regex.LICENSE`             |
| Default report output dir        | varies / `reports/<component>/`       | `reports/visual-communicator/<sub>/`      |
| References folder                | `references/` (root)                  | `skills/amvcp-visual-communication/references/` |

## 4. Things deliberately NOT renamed

- **`vendor/regex-vis/`** — frozen upstream MIT-licensed code (per
  `THIRD_PARTY_NOTICES.md` and the v1.0.0 publish contract). Hands off.
- **DOM attribute namespace `data-ve-*`, `data-ve-comment-id`, etc.**
  Internal symbol; renaming would break persisted localStorage keys
  (`ve-comment-thread:<id>`), test fixtures, and serialized payloads.
  Also referenced by vendor code.
- **CSS class namespace `.ve-comment-pill`, `.ve-decision`,
  `.ve-toggle*`, `.ve-finding-*`, etc.** Same reason — internal CSS
  classes consumed only by the runtime, with no user-facing leak.
- **JSONL queue payload field names** (`commentId`, `threadId`,
  `anchorId`, `decision`, etc.) — wire format is stable.
- **localStorage key prefix `ve-comment-thread:`** — would orphan any
  user's persisted draft threads.
- **Test/queue dir names** — `.ve-comments/` (production default),
  `/tmp/ve-comments-tests/` (test default). Internal paths.
- **The local working directory `visual-comunicator/`** (typo'd) — it's
  the user's checkout path; renaming it is outside the repo's authority.
- **Anything under `tests/`, `templates/`, `vendor/`, `configs/`** stays
  at root — only "scripts" move under `scripts/` per the user's spec.
  Templates are HTML templates, not scripts. Tests are tests.
- **Existing `design/tasks/TRDD-*.md`** files — historical specs, the
  rename is documented in the relevant TRDDs but old names stay in
  prose context (e.g. "v1 shipped as ai-maestro-visual-communicator
  v1.0.0" remains accurate as historical record).

## 5. Phased build plan

| Phase | Scope                                                                       | Risk |
|-------|-----------------------------------------------------------------------------|------|
| 1     | TRDD spec (this file)                                                       | low  |
| 2     | `.claude-plugin/plugin.json` — name + skills array fix (CRITICAL)           | low  |
| 3     | Move `references/` → `skills/amvcp-visual-communication/references/` via git mv (delete user's identical duplicate first) | low |
| 4     | Rename `scripts/ve-*` → `scripts/amvcp-*` via git mv, update all refs       | med  |
| 5     | Update plugin name (`ai-maestro-visual-communicator` → `…-plugin`) in `package.json`, `pyproject.toml`, `README.md`, `CHANGELOG.md` (only future entries; historical entries kept verbatim), `SKILL.md`, every `commands/amvcp-*.md`, every `scripts/*.py`, every `templates/*.html`, every config under `configs/`, design tasks (only forward-pointing references; keep historical context lines) | med |
| 6     | Update skill name references (any `ai-maestro-visual-communicator` in a "skill" sentence → `amvcp-visual-communication`) — in commands, SKILL.md, scripts/render-interactive-report.py, templates | med  |
| 7     | Default report output paths in scripts → `reports/visual-communicator/<sub>/` | med  |
| 8     | Update tests: `tests/run-tests.py`, `tests/server.py`, `tests/scripts/*.js`, `tests/README.md` to read the renamed runtime/select/regex assets | med  |
| 9     | Bump and publish via `publish.py --patch --push`                            | low  |

## 6. Hard constraints

1. **All 32 dev-browser tests must still pass** after the rename.
   `python3 tests/run-all-tests.py` → `32/32 passed.  All green.`
2. **`ruff check scripts/ tests/`** clean.
3. **`vendor/regex-vis/` left untouched** (frozen upstream).
4. **No file deleted that isn't either tracked + replaced via git mv,
   OR an exact untracked duplicate of a tracked file** (per CLAUDE.md
   RULE 0).
5. **CHANGELOG.md historical entries preserved verbatim** — the
   git-cliff regen for the next release will append the new entry; old
   entries describing the v1.0.0…v1.1.5 work stay as-is to preserve the
   release-note record. Only forward-looking statements get rewritten.
6. **Internal DOM/CSS namespace `ve-*` stays** — see §4.
7. **No `--no-verify` push, no skipped gates** — `publish.py --patch
   --push` runs the full canonical pipeline.

## 7. Test strategy

The existing 32-test dev-browser suite is the contract. After every
phase:

- `ruff check scripts/ tests/`
- `python3 tests/run-all-tests.py`

For the script-rename phase (§5 step 4), the most likely failure mode
is a broken `<script src="ve-runtime.js">` path in a template, or a
stale `import "ve-select"` import. Catch with the smoke check first:

- `node -c scripts/amvcp-runtime.js`
- `python3 -m py_compile scripts/amvcp-select.py scripts/render-interactive-report.py`
- Then full test suite.

## 8. Out of scope

- Vendor build pipeline changes (no `vite.config.ts` edits).
- DOM/CSS namespace migration (`.ve-*` → `.amvcp-*`) — risk-reward
  doesn't justify it.
- Migrating the on-disk plugin folder from `visual-comunicator/` to
  `visual-communicator-plugin/` (user's local cwd, not in scope).

## 9. Open questions

- **None blocking.** All naming decisions explicit in §3 and §4.

## 10. Acceptance criteria

- [ ] `cat .claude-plugin/plugin.json` shows
      `"name": "ai-maestro-visual-communicator-plugin"` and
      `"skills": ["./skills/amvcp-visual-communication"]`.
- [ ] Plugin loads in a fresh Claude Code session and `Skill(skill:
      "amvcp-visual-communication")` resolves.
- [ ] `/amvcp-interactive-report` (and the other 9 amvcp-*) appear in
      slash-command discovery.
- [ ] No `aimvc-` references remain (excluding history-fixed CHANGELOG
      lines and design/tasks/TRDD historical context).
- [ ] No bare `ai-maestro-visual-communicator` (without `-plugin` suffix
      and not in a skill-name context) remains except where it documents
      a historical fact.
- [ ] `ls scripts/` shows `amvcp-runtime.js`, `amvcp-select.py`,
      `amvcp-regex.{umd.js,css,LICENSE}` and NO `ve-*` files.
- [ ] `python3 tests/run-all-tests.py` → `32/32 passed`.
- [ ] `publish.py --patch --push` lands a release with all 3 workflows
      green (ci, Notify Marketplace, release).
