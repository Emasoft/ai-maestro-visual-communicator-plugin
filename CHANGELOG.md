# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.4] — 2026-05-11

### Bug Fixes

- Actually navigate the Web Browser pane via Python API + safe close

## [1.2.2] — 2026-05-11

### Features

- Disable pane dimming + name preview pane + bright-gray tab color
- Add amvcp-iterm2-preview + auto-prefer iTerm2 split-pane in runner

## [1.2.1] — 2026-05-11

### Bug Fixes

- Comment modal responsive at narrow viewports + clamp gutters
- Theme-leak in injected UI + native-input visibility + comment-pill scroll race

### Chores

- V1.2.1 — comment modal responsive at narrow viewports + CPV strict-mode hygiene
- Regenerate uv.lock after pyproject version sync
- Sync pyproject.toml + package.json versions to plugin.json (1.2.0)
- V1.2.0 — 10-skill multi-split (1 coordinator + 9 sub-skills)

### Documentation

- Add TRDD-5c230516 for 10-skill multi-split

### Features

- Segmented decision control + draggable modal + anchor connector
- Add amvcp-modal-comments sub-skill (v2/v3 agent-report flow)
- Add amvcp-prose-pages sub-skill (article-style publishable pages)
- Add amvcp-slide-decks sub-skill (magazine-quality slide decks)
- Add amvcp-share-pages sub-skill (Vercel deploy)
- Add amvcp-math-and-latex sub-skill (KaTeX, mhchem, TikZJax)
- Add amvcp-charts-and-dashboards sub-skill (Chart.js)
- Add amvcp-regex-vis sub-skill (regex visualizer + editor)
- Add amvcp-choice-tables sub-skill (table-form Q&A)
- Add amvcp-graph-diagrams sub-skill (Mermaid + Graphviz)

### Refactoring

- Satisfy CPV strict-mode rules added since v1.2.0
- Restructure all 10 SKILL.md files for CPV 2.80.1 strict mode
- Slim main SKILL.md to <=4000 chars + 5 main-only refs
- Extract comment-chat-box.md from modal-comments.md
- Split interactive-selection.md into 8 topic files
- Update plugin-ref-internal cross-references to use ${CLAUDE_PLUGIN_ROOT}
- Move 6 cross-cutting refs to plugin-level references/

### Testing

- Update modal_page_scrolls_while_open for new draggable layout + add 2 fixture files

## [1.1.9] — 2026-05-09

### Bug Fixes

- TRDD-5f41ad36 remaining deferred items — Phase A-D

### Chores

- V1.1.9

### Documentation

- Add TRDD-5f41ad36 — remaining deferred items

## [1.1.8] — 2026-05-09

### Chores

- V1.1.8

### Refactoring

- Extract showCloseConfirmation() helper — dedupe inline

## [1.1.7] — 2026-05-09

### Bug Fixes

- TRDD-1dcd0bd7 comprehensive audit — Phase A-F

### Chores

- V1.1.7

### Documentation

- Add TRDD-1dcd0bd7 — comprehensive audit fixes (v1.1.7 target)

## [1.1.6] — 2026-05-09

### Bug Fixes

- Satisfy CPV strict-mode after plugin rename

### Chores

- V1.1.6

### Documentation

- Add TRDD-6151a6a4 — plugin rename + structural cleanup

### Refactoring

- Plugin → ai-maestro-visual-communicator-plugin (TRDD-6151a6a4)

## [1.1.5] — 2026-05-08

### Chores

- V1.1.5

### Features

- Swap radios for two toggle switches with mutex (TRDD-7a2dab03 §6.5)

## [1.1.4] — 2026-05-08

### Chores

- V1.1.4

### Documentation

- Add TRDD-7a2dab03 — per-element approve/reject/skip decision

### Features

- Per-element approve/reject/skip pills (TRDD-7a2dab03)

## [1.1.3] — 2026-05-08

### Bug Fixes

- Auto-sync uv.lock during version bump

### Chores

- V1.1.3

## [1.1.2] — 2026-05-08

### Bug Fixes

- Make GitHub Release step idempotent

### Chores

- V1.1.2

## [1.1.1] — 2026-05-08

### Bug Fixes

- Pin astral-sh/setup-uv to v8.1.0

### Chores

- V1.1.1
- Sync to pyproject.toml v1.1.0

## [1.1.0] — 2026-05-08

### Bug Fixes

- Clear MD004/MD024/MD028/Ruff-I001 findings in tracked docs
- Add name: frontmatter to every aimvc-* command

### Build System

- Rewrite pre-push as thin delegator to publish.py --gate
- Add --gate / --install-hook + 10-stage publish pipeline

### Chores

- Pin markdownlint config to CPV-canonical rule set
- Disable MD013/MD032 for prose-heavy command/skill files
- Convert all bash scripts to Python (eliminates POSIX-only constraint)
- Scope per-tool configs around vendor + Mermaid templates
- Scaffold canonical plugin pipeline files

### Continuous Integration

- Restructure into canonical Lint/Validate/Test jobs + add release.yml

### Documentation

- Rewrite — concise feature list + install instructions only

## [1.0.0] — 2026-05-08

### Bug Fixes

- Null-safe pollForCommentReply + harden test server
- Comment-modal v2 — hover-bridge, polling resume, atomic save
- Per-mount undo/redo, shift+click, overflow, ⌘⇧Z
- Prose typography + multi-click grammar shifted-by-1
- Edit-only panel + gold selection paint
- Exclude .ve-regex wrappers from element-toggle hijack

### Chores

- Rebrand to ai-maestro-visual-communicator (v1.0.0)
- Gitignore .claude/ session artefacts + .tldr/ runtime state
- Remove install-pi.sh
- Gitignore _dev/ folders, reports, and runtime caches

### Documentation

- Integrate v2 modal-comment workflow into the skill
- V2 spec — modal comment threads with live in-place reply
- Add TRDD-eff1aa87 — interactive agent reports
- Phase 4 — SKILL.md + cookbook docs (.ve-regex)
- Third-party notice for vendored regex-vis (MIT)
- Add TRDD-7a98 multi-select + TRDD-bdf0 regex-vis specs
- TikZJax preload audit + multi-select wire format

### Features

- V2 — modal comment threads with live in-place reply
- --mode auto for any-H2-as-finding
- Interactive agent reports v1 (TRDD-eff1aa87)
- Phase 7 — touch / mobile compatibility
- Phase 6 — code line-number gutter
- Phase 5 — table row/column handles
- Phase 4 — drag text selection toggles entries
- Phase 3 — ve-runtime.js lazy-loads + mounts on .ve-regex
- Phase 2 — themed to plugin palette (gold/cream/coffee)
- Phase 1 — first working UMD bundle (484 KB / 151 KB gz)
- Vendor source + skeleton (Phase 0)
- Code click depths 1-7 inside <pre> blocks
- Math click depths 1-7 + numbered-prose restyle + forced sel contrast
- Prose multi-click depths 4-7 (paragraph/section/chapter/all)
- Multi-select runtime + PWA-manifest runner

### Refactoring

- Move vendor/regex-vis out of plugin tree

### Testing

- Formal dev-browser test suite (28 tests, all green)

### Release

- V0.8.0 — interactive selection (default for every page)


