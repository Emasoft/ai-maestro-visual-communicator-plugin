# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-05-19

### Bug Fixes

- Clear remaining 17 NITs (MD004, MD009, MD018, MD024, MD056)
- Clear 20 MD004 NIT bullets — replace prose '+' continuations with words
- Embed phase-graph-preset TOC in amvcp-diag-architecture SKILL.md
- Offload Resources catalogs to references/resources-index.md
- Move LaTeX macros into fenced block; correct slate-bg path
- Merge sub-headings in 2 refs to fit TOC budget
- Scope TOC to header section in 3 self-debug-rules refs
- Embed missing TOCs in code-snippets/code-diff/prose-pages router SKILL.md
- Embed missing TOCs in wf-screens/wf-fidelity/wf-devices/wf-archetypes/tables-special router SKILL.md
- Trim description / add example in diag-flow / form-inputs / icon-svg / interactive-controls / visual-communication
- Trim description in code-diff / code-fences / code-highlight / code-snippets / code-syntax
- Wireframe refs cross-sibling path updates + umbrella SKILL.md
- Rewrite cross-sibling ref links to point at the new sibling owners
- Embed per-link TOCs across 12 split skills (89 → 38 TOC MINORs)
- Clear 7 MAJORs — XML-in-descriptions, missing Examples, numbered Instructions
- Convert anti-slop + contact-sheet Examples to Input/Output blocks
- Convert Examples bullets to code-fenced Input/Output blocks
- Validation cleanup — Nixtla description + complete TOC embeds
- Add 'Use when ...' to descriptions, fix 3 MINOR TOC links
- Plain-text refs in routing matrices (4 siblings)
- Normalize Use-when phrasing in dashboards + layout-chrome SKILL.md
- Restore Use-when phrase, plain-text refs in matrix
- Add code-fenced Examples to 3 siblings
- Tighten descriptions + add code Examples
- Embed complete TOCs after each Resources link
- Batch 14a — NIT markdownlint fixes (dash bullets, table columns, blockquote spacing)
- Batch 13 — clear 9 word-cap MAJORs from TOC-embed bloat
- Batch 12 — unwrap 7 broken markdown link URLs
- Batch 11 — tighten 17 SKILL.md descriptions to under 500 chars
- Batch 10 — terminate TOC sections with ## Overview heading
- Batch 9 — extend TOC embedding to cross-skill + plugin-root refs
- Batch 8 — emit per-link TOC blocks for multi-link table rows
- Batch 7 — embed 733 TOC blocks into 22 SKILL.md files
- Batch 6 — add Table of Contents to 370 reference files
- Batch 5 — final MAJORs cleared (split debug-rules + structural fixes)
- Batch 4 — add missing Nixtla sections + description fixes (8 SKILL.md)
- Batch 3 — expand allow_orchestrator_traversal + add Nixtla sections to amvcp-self-debug-rules
- Batch 2 — convert 354 backtick refs to markdown links across 8 SKILL.md
- Batch 1 — config + chmod + .gitignore + amvcp-prose-pages
- Clear 4 CRITICAL privacy leaks + amvcp-show structure
- Pass --mode auto to render-interactive-report.py
- Product-dashboard preset polish — IBM Plex + navy + warm cream
- Corner buttons visible — surface tokens + saturated shadow
- Strip Tier 4 :hover rules — R29 owns 3-state visuals
- Wait for image decode before hotspot measurement
- Bulletproof fire-once contract for reveal targets
- V2 — hide entirely + tiny 🎨 handle when idle (TRDD-9616579c #2)
- Auto-stamp data-ve-comment-id on missing body atoms (TRDD-9616579c #3)
- Default-collapsed + auto-fade-when-idle (TRDD-9616579c #2)
- Slide deck — explicit Prev/Next/Exit buttons
- Palette swatch → select-for-comment (not clipboard copy)
- Per-row decision-mini, container exclusion, blueprint preset, restored multi-layer glow

### Chores

- Register 23 new split sibling skills in allow_orchestrator_traversal
- Register 5 new chart-family siblings in plugin.json allow_orchestrator_traversal
- Fix 4 pre-existing ruff errors in scan-for-prompt-injection.py
- Commit symphony-current.html audit snapshot
- Re-render all-techniques-sample with regression fixes applied

### Documentation

- Mark Done — all 6 fixes + amvcp-show router landed
- Add TRDD-4c300620 — amvcp-show smart router + 6 fixes
- Add TRDD-6fdf6ad2 — visualize-plugin absorption plan
- Add TRDD-9616579c — Phase 2.5/2.6/3 contract + architecture + extended mining

### Features

- Add R41 (dev-browser never headless) + fix amvcp-show R26
- Smart-router skill + dispatch.py
- Finding-reply submit payload carries 3-state decision
- ITerm-first launcher for split-pane preview
- Tier 4 — visual-component atoms (KPI/tier/VS/stack/timeline)
- Tier 5 — data-ve-chart-type atom with lazy Chart.js
- Tier 1B — per-theme DESIGN.md preset assignment
- Tier 3 — responsive utilities + .ve-hero component
- R40 — accessibility + @media print primitives
- Product-dashboard preset — Manrope + indigo (TRDD-6fdf6ad2 Tier 1)
- Tier 0 corner buttons — theme/PNG/print/pod 36x36 SVG row
- Generalize chain-highlight to flow presets + initial minimap paint
- R38 + R24 — overlay-mode runtime for true-HTML element selection
- R28 — saveUserPreset / renameUserPreset / deleteUserPreset
- Theme MutationObserver + auto-load default DESIGN.md
- R27/R29/R33/R37/R39 — pod always-mounted + summon gesture + selection-wins + font-floor
- Add R27-R39 pod+UX rules + prompt-injection scanner
- Add R19-R26 function/logic rules + enforce across the plugin
- Export menu — Copy PNG / Download PNG/JPEG/WebP/SVG (archify, MIT)
- Gallery picker + tier-list (batch 7)
- Password + currency widgets (batch 6)
- Tree picker — hierarchical single-select (batch 5)
- Text + textarea + URL widgets (batch 4)
- Card-picker + tag-input (batch 3)
- Slider + toggle + rating (batch 2)
- Structured-response widgets — quiz / numeric / date / color / rank (Phase 5 batch 1)
- Viewport scaffold — pan, zoom, mini-map for dense diagrams
- Umbrella routing agent + 8 compose-all defects fixed (322/322 green)
- 1 → 13 categories × 30+ technique references (~502 ref files)
- Unified selection/comment/theme contract across all 13 modules
- 13 visualize-skill modules + DESIGN.md-driven runtime/renderer integration
- Bind heading + body typography to DESIGN.md tokens (Phase 1d)
- DESIGN.md realtime style engine — parser, hot-swap, style-controller pad
- Responsive code-blocks, dual bubble handles, copy-button + self-debug skill

### Refactoring

- Rewrite parent SKILL.md as slim router (final/N)
- Split amvcp-tokens-presets (5c/N)
- Split amvcp-tokens-presets (5b/N)
- Split amvcp-tokens-presets sibling (5a/N)
- Split amvcp-tokens-color (4c/N)
- Split amvcp-tokens-color (4b/N)
- Split amvcp-tokens-color sibling (4a/N)
- Rewrite parent SKILL.md as slim router
- Update SKILL.md Resources after batch 5b
- Split amvcp-tokens-scales (3b/N)
- Split out amvcp-diag-flow sibling skill (2/2)
- Split amvcp-tokens-scales sibling (3a/N)
- Split out amvcp-diag-flow sibling skill (1/2)
- Split amvcp-tokens-contact-sheet (2c/N)
- Split amvcp-tokens-contact-sheet (2b/N)
- Split out amvcp-diag-architecture sibling skill
- Split amvcp-tokens-contact-sheet sibling (2a/N)
- Split out amvcp-diag-time sibling skill
- Split amvcp-tokens-anti-slop sibling (1/N)
- Split out amvcp-diag-network sibling skill
- Rewrite parent SKILL.md as slim router
- Remove obsolete refs (8/N)
- Remove obsolete refs (7/N)
- Remove obsolete refs (6/N)
- Remove obsolete refs (5/N)
- Remove obsolete refs (4/N)
- Remove obsolete refs (3/N)
- Remove obsolete refs (2/N)
- Split into 5 focused sibling skills
- Remove obsolete refs (1/N)
- Finish amvcp-anim-foundation sibling (2/N)
- Expand amvcp-anim-foundation sibling (1/N)
- Finish amvcp-anim-handoffs sibling (2/N)
- Create amvcp-anim-handoffs sibling (1/N)
- Create amvcp-anim-perf sibling (1/1)
- Move 5 more dashboards infra refs
- Finish amvcp-anim-ambient-hover sibling (2/N)
- Create amvcp-anim-ambient-hover sibling (1/N)
- Remove last 2 dup refs (cleanup complete)
- Remove 5 dup refs from amvcp-wireframe/references/
- Rewrite parent SKILL.md as slim router (1 file)
- Finish amvcp-anim-entry-scroll sibling (3/N)
- Create amvcp-anim-entry-scroll sibling (2/N)
- Create amvcp-anim-entry-scroll sibling (1/N)
- Split into 4 focused sibling skills
- Split into 4 focused sibling skills (10/n)
- Split into 4 focused sibling skills (9/n)
- Wf-screens batch 4/4 — last ref + SKILL.md
- Split into 4 focused sibling skills (8/n)
- Wf-screens batch 3/4 — 5 cross-cutting refs
- Wf-screens batch 2/4 — 5 domain-pattern refs
- Split into 4 focused sibling skills (7/n)
- Split into 4 focused sibling skills (6/n)
- Create dashboards sibling (commit 1/N)
- Wf-archetypes SKILL.md — slim router (Nixtla-strict)
- Split into 4 focused sibling skills (5/n)
- Rewrite parent SKILL.md as slim router
- Split into 4 focused sibling skills (4/n)
- Split into 4 focused sibling skills (3/n)
- Split into 4 focused sibling skills (2/n)
- Split into 4 focused sibling skills (1/n)
- Finish amvcp-layout-grids (4/4)
- Finish amvcp-layout-grids (3/4)
- Finish amvcp-layout-grids (2/4)
- Move 3 final multi-dim refs
- Create amvcp-layout-grids (1/4)
- Wf-archetypes batch 1/3 — move 5 archetype-shaped refs
- Create charts-multi-dim sibling
- Create wf-devices sibling — device frames + responsive
- Split wf-fidelity bucket part 2/2 — SKILL.md + theme ref
- Finish amvcp-layout-chrome (3/3)
- Finish amvcp-layout-chrome (2/3)
- Create charts-part-of-whole sibling
- Create amvcp-layout-chrome (1/3)
- Move chart-bump to charts-line-area
- Create charts-line-area sibling
- Finish amvcp-layout-print-hero (2/2)
- Create amvcp-layout-print-hero (1/2)
- Move 4 more bar-family refs to charts-bar (commit 2/N)
- Create charts-bar sibling (commit 1/N)
- Create amvcp-layout-kpi sibling skill
- Split wf-fidelity bucket part 1/2 — move 5 refs
- Split out amvcp-diag-ascii sibling skill
- Create amvcp-layout-shells sibling skill
- Split into 5 focused sibling skills
- Split into 6 focused sibling skills

### Testing

- Symlink tests/fixtures/amvcp-overlay.js → scripts/amvcp-overlay.js

## [1.2.11] — 2026-05-13

### Bug Fixes

- Bulk-default switch + selection-model + renderer fidelity

### Chores

- V1.2.11

## [1.2.10] — 2026-05-12

### Chores

- V1.2.10

### Features

- Per-element 3-state mini-switch (S/A/D) on every selectable atom

## [1.2.9] — 2026-05-12

### Chores

- V1.2.9

### Documentation

- V4 status — P1+P3+P4+P5 shipped, P2 deferred to v4.1

## [1.2.8] — 2026-05-12

### Bug Fixes

- ESC clears data-ve-pressed + removes orphan group handles

### Chores

- V1.2.8

## [1.2.7] — 2026-05-12

### Chores

- V1.2.7

### Documentation

- TRDD-3d1570ab v4 spec + no-scrollbars + selection-model gate

### Features

- Faithful render + table styling + group-selection model

### Testing

- Real-world rendered example for v4 visualizer work

## [1.2.6] — 2026-05-12

### Bug Fixes

- Code block is non-selectable — no hover state, no hover ring

### Chores

- V1.2.6

## [1.2.5] — 2026-05-12

### Bug Fixes

- Unify selection on individual codeline entries; full-row block highlight
- Replace 2-column architecture with CSS-counter ::before
- Sync typographic props from <pre>; wrap each code line in span
- Theme-aware seamless table-form selection + dev preview tooling

### Chores

- V1.2.5

### Features

- Code-gutter polish + drag-paint + comment handle + frosted page bg
- Two standalone floating buttons (top-right + bottom-(L|R)) replacing single bar
- Auto-close pane on selection received + file:// URL fallback

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


