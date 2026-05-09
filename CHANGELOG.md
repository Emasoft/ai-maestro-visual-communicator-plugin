# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.7] — 2026-05-09

### Bug Fixes

- TRDD-1dcd0bd7 comprehensive audit — Phase A-F

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


