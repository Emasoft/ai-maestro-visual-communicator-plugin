# Changelog

All notable changes to this project will be documented in this file.

## [1.5.2] — 2026-08-25

### Documentation

- Archive TRDD-YY5ISKCJ → published (v1.5.1 shipped the G1 fail-closed fix)
- Archive two terminal cards out of the OPEN zone (bac00789 superseded, 9GUATJL7 published)
- Archive 8 terminal-DONE TRDDs out of the OPEN zone
- Track proposal TRDD-JEFLY6H4 (janitor GHCFG-001, awaiting owner decision)
- Triage + archive the 13 legacy pre-v2 TRDDs — OPEN zone 24 cards -> 3
- TRDD-1627a698 tests green (457/457) — todo -> ai_review
- PROJECT note — absence-by-grep is not evidence of absence
- Refuse TRDD-JEFLY6H4 → refused (GHCFG-001 NO_PR_REVIEW is a false positive)
- Close TRDD-503fb3af audit gaps G2/G5/G6/G7/G8 — remove false doc claims (TRDD-503fb3af)
- Archive TRDD-503fb3af → complete (all audit gaps decided + executed)
- Archive TRDD-1627a698 → published (ai_review passed, shipped in v1.5.1)
- Mechanical MD004 reflow in archived TRDD-1627a698 (wrapped '+' parsed as bullet; unblocks CPV gate)
## [1.5.1] — 2026-08-18

### Bug Fixes

- Tokenize base36 TRDD ids, not just hex (TRDD-103a53e0)
- G1 fails CLOSED on unreadable remote (TRDD-YY5ISKCJ)
- Reflow docwiki fixture so hash-form citation is not at column 1

### Documentation

- Close TRDD-9GUATJL7 — v1.5.0 published (column: published)
- Make the board state honest — 503fb3af parked, 1627a698 unclaimed
- Add TRDD-LSHTWMTU — resolver-tag backfill blocked by G1 ordering
- Add TRDD-YY5ISKCJ — G1 version gate fails open on network failure
- TRDD-YY5ISKCJ — answer the blocking question, fix is safe
## [1.5.0] — 2026-08-15

### Bug Fixes

- Restore the progressive-disclosure split and route doc-wiki from the references
- Clear the 5 strict findings the merged doc-wiki content introduced, and wire its test gate
- Bound the browser to one suite, and close it at the end of the run
- Close the cross-run daemon leak; drop the per-suite restart that made it worse
- Stop the changelog being erased on every release; restore the lost history
- Recall-before-render, a real share-page privacy warning, and the frozen-CLI invariant
- Classify refs by REMOTE_REF + accept resolver tag twin (TRDD-9GUATJL7)
- Accept resolver-twin backfill pushes, fail-closed (TRDD-9GUATJL7)

### Documentation

- Close TRDD-371558fd — memory migration was shipped in v1.4.0
- Track CPV-FP remediation + 3-pillars publish-readiness (TRDD-158a7937)
- Add TRDD-1627a698 — capture 6 remaining html-effectiveness gaps (5 interactive-editor skills + approaches-comparison)
- TRDD-1627a698 backburner→dev — record impl commits c886a6a/c19c1b1, add STATE (built, unverified, publish-gated)
- Add TRDD-103a53e0 — navigable document wiki (TRDD/PRRD/Kanban/wikimem visualizer)
- TRDD-103a53e0 phase 1 done → phase 2 next; record commit 1986bc5
- TRDD-103a53e0 phase 2 done → phase 3 next; record 3aede10
- TRDD-103a53e0 phase 3 done → phase 4 next; record f00bc26
- TRDD-103a53e0 phase 4 done → phase 5 (skill) next; record 54b5597
- TRDD-103a53e0 → complete — all 5 phases done; record 065288f
- Capture the two lessons this session cost the most to learn
- Add TRDD-9GUATJL7 — v1.5.0 release blocked on host load, plus 6 open owner decisions
- V1.5.0 blocker is the pre-push hook, not host load
- Testing -> human_review; the card was claiming work nobody was doing
- Capture why the v1.5.0 push was refused by our own pre-push hook
- Capture panel-push delivery contract and the doc-wiki base36 link defect
- Docwiki-search's ~0-token design, and the base36 defect's SECOND site
- How to test an OPTIONAL integration with zero mocks

### Features

- Optional AI Maestro side-panel delivery for generated artifacts
- Adopt TRDD/PRRD/kanban via depend-on-base (resolver + bootstrap + PRRD seed)
- Declare ratified ai-maestro-plugin dependency in plugin.json
- Phase 1 — navigable-wiki nav shell runtime (TRDD-103a53e0)
- Phase 2 — build pipeline + TRDD & PRRD renderers (TRDD-103a53e0)
- Phase 3 — Kanban board + wikimem renderers (TRDD-103a53e0)
- Phase 4 — search (client-side instant + memgrep→HTML script) (TRDD-103a53e0)
- Phase 5 (FINAL) — amvcp-doc-wiki skill + umbrella wiring + tests (TRDD-103a53e0)
- Mint the dependency-resolver tag, and backfill the six releases that lack it

### Miscellaneous Tasks

- Remove orphaned prompt-injection scanner fixtures

### Styling

- Clear 56 UP031 ruff violations in the merged doc-wiki scripts

### Merge

- Close TRDD-371558fd and land the optional AI Maestro panel caller
- Adopt PRRD/TRDD/kanban tooling — WITHOUT declaring a plugin dependency
- Land the amvcp-doc-wiki coordinator skill and its build/search scripts
## [1.4.0] — 2026-06-20

### Bug Fixes

- Stash pristine scene-graph JSON before host wipe
- Drop dead vc-state class
- Implement delegated-block renderInto so JSON-deck code/diagram/chart render (TRDD-292ddcd9, G1)
- Selection/hover never adds elements — scope HTML state rules with :not(svg *) (TRDD-10db8f1c)
- Stop Chart.js responsive-RO wedge on live theme flip (TRDD-ed5e8cc2)
- Devitalize template ZWSP + drop dead plugin.json size keys
- Clear mechanical strict-gate findings; drop self-exemption block
- Clear htmlhint + markdownlint blocking findings
- Split amvcp-code-snippets SKILL.md body under 5000 tok
- Devitalize TOKEN_STEAL needle in the security checklist
- Clear phantom 'amvcp-wf' broken-ref (xref extractor)
- Skill-size split round 1 — progressive disclosure (partial)
- Skill-size split round 2 — icon-svg, interactive-controls, visual-communication
- Tighten anim-sandbox + editor-toggles descriptions <=180 tok
- Move resources-catalog TOC within first 200 chars (clears MINOR)
- Skill-size split round 2 — code-syntax, prose-pages, wf-screens, code-diff
- Residual NIT/MINOR cleanup — TOC sections + clickable TOC-200 + MD004
- Devitalize 3 strict-blocking FPs (REGEX_DOS + 2× EXFIL_COVERT)
- Drive amvcp to CPV --strict 0/0/0/0 (TRDD-158a7937)

### Documentation

- Add project CLAUDE.md — visual-element architecture principle (one skill per THING, no mode-skills, every element editable/exportable by design)
- Two modes — fixed Interaction Design Mode (selection/highlight/triple-feedback/comment-box, never changes) vs variable Graphic Style Mode (DESIGN.md); imports augment never replace
- Composability via HTML+SVG superset — simple/modular/orthogonal primitives, nest via foreignObject, no rigid structure (combinations are unbounded)
- Track composed-page live-theme-swap loop (TRDD-ed5e8cc2)
- Record local-merge delivery — pre-push hook forbids branch pushes
- Correct false language-csv tokenizer claim (TRDD-292ddcd9, G4)
- Plan G3 touch-parity pointer-sortable (TRDD-7114fb4e)
- Plan visualize-fast-path — quickstarts, graphviz template, parallel reads (TRDD-5d31a249)
- Route the 5 new interactive-editor skills + approaches-comparison (TRDD-1627a698 wiring)

### Features

- Add amvcp-component-variant-matrix visual element
- Graphic-style refinements from the html-effectiveness import
- Adopt the markdown memory system (rule + recall/write skills)
- QUICKSTART + graphviz template + parallel-read rules + trap doc fixes (TRDD-5d31a249 S1-S4)
- Chart-dashboard template + QUICKSTART + tests (TRDD-5d31a249 S1/S2 extension)
- Touch parity — shared Pointer-Events sortable replaces HTML5 DnD (TRDD-7114fb4e, G3 Opt 3)
- The 6 html-effectiveness gaps — 5 interactive-editor skills + approaches-comparison mode (TRDD-1627a698)
- Abolish the validation-exemption mechanism — CPV plugin is the sole validator, devitalize-or-remove only (user policy 2026-06-11)
- Bootstrap global janitor PROJECT-scope wiki (Phase A; TRDD-371558fd)
- Cutover to global janitor wiki memory (Phase B; TRDD-371558fd)

### Miscellaneous Tasks

- Plugin-wide audit — real APIs in examples, discoverability, validation-clean
- Gitignore .codegraph/ (CodeGraph MCP index cache)
- Gitignore the stray .cpv-cisco-scan.json scan artifact

### Refactor

- Remove per-plugin memory system — amvcp is an independent visualizer

### Security

- Devitalize raw BOM literals in 2 BOM-strippers (INVISIBLE_UNICODE_RAW)

### Testing

- Permanent LAN map composing graph + icon-svg + chart

### Merge

- Adopt global janitor memory (memory-migration) into the CPV-strict remediation base
## [1.3.6] — 2026-05-23

### Bug Fixes

- Clear CPV v2.103.3 validation — allowlist self-scan FPs, complete Pierre skill

### Documentation

- Point self-scan allowlist at filed upstream #42 (was stale #38)

### Features

- Integrate Pierre's diff viewer as amvcp-pierre-diff (Apache-2.0)
## [1.3.5] — 2026-05-21

### Bug Fixes

- Unblock G3 — remove mypy unused-ignore + allowlist 6 false positives

### Features

- Integrate sanitizing skill auditor + visual renderer

### Testing

- Close browser pages in every test + add runner leak self-check
- Enforce headless dev-browser (R18) + stop daemon before suite
- De-flake chart_mark_selectable under headless
## [1.3.4] — 2026-05-20

### Bug Fixes

- Step 17 — pin historic .gitleaksignore self-finding
## [1.3.3] — 2026-05-20

### Bug Fixes

- Step 16 — finish taming Mega-Linter's gitleaks via .gitleaks.toml
## [1.3.2] — 2026-05-20

### Bug Fixes

- Step 15 — make CI honor publish.py G3 allowlist + tame Mega-Linter
## [1.3.1] — 2026-05-20

### Bug Fixes

- Step 8b — Mega-Linter v8+ schema compliance
- Step 8c — correct Mega-Linter schema key
- Step 13 — CHECK-06 SHA-pin + CHECK-15 ruff UP037

### Documentation

- Step 10b — document intentional pipeline drift
- Step 12 — document validator false-positive backtick paths

### Features

- Step 6 — release.yml pre-release validation gates
- Step 8 — Mega-Linter security scanners
- Step 9 — relocate + harden pre-push hook
- Step 10 — publish.py selective merge with canon
- Step 11 — wire cpv_network_resilience into publish.py
- Step 14 — G3 honors documented-known false-positive allowlist

### Miscellaneous Tasks

- Step 1 — add scripts/cpv_network_resilience.py
- Step 2 — adopt canon markdownlint disables + chmod fix
- Step 3 — extend markdownlint-cli2 ignores
- Step 4 — notify-marketplace branches + paths union
- Step 5 — ci.yml branches + exit-code classification
- Step 7 — regenerate cliff.toml from canon
## [1.3.0] — 2026-05-19

### Bug Fixes

- Per-row decision-mini, container exclusion, blueprint preset, restored multi-layer glow
- Palette swatch → select-for-comment (not clipboard copy)
- Slide deck — explicit Prev/Next/Exit buttons
- Default-collapsed + auto-fade-when-idle (TRDD-9616579c #2)
- Auto-stamp data-ve-comment-id on missing body atoms (TRDD-9616579c #3)
- V2 — hide entirely + tiny 🎨 handle when idle (TRDD-9616579c #2)
- Bulletproof fire-once contract for reveal targets
- Wait for image decode before hotspot measurement
- Strip Tier 4 :hover rules — R29 owns 3-state visuals
- Corner buttons visible — surface tokens + saturated shadow
- Product-dashboard preset polish — IBM Plex + navy + warm cream
- Pass --mode auto to render-interactive-report.py
- Clear 4 CRITICAL privacy leaks + amvcp-show structure
- Batch 1 — config + chmod + .gitignore + amvcp-prose-pages
- Batch 2 — convert 354 backtick refs to markdown links across 8 SKILL.md
- Batch 3 — expand allow_orchestrator_traversal + add Nixtla sections to amvcp-self-debug-rules
- Batch 4 — add missing Nixtla sections + description fixes (8 SKILL.md)
- Batch 5 — final MAJORs cleared (split debug-rules + structural fixes)
- Batch 6 — add Table of Contents to 370 reference files
- Batch 7 — embed 733 TOC blocks into 22 SKILL.md files
- Batch 8 — emit per-link TOC blocks for multi-link table rows
- Batch 9 — extend TOC embedding to cross-skill + plugin-root refs
- Batch 10 — terminate TOC sections with ## Overview heading
- Batch 11 — tighten 17 SKILL.md descriptions to under 500 chars
- Batch 12 — unwrap 7 broken markdown link URLs
- Batch 13 — clear 9 word-cap MAJORs from TOC-embed bloat
- Batch 14a — NIT markdownlint fixes (dash bullets, table columns, blockquote spacing)
- Embed complete TOCs after each Resources link
- Tighten descriptions + add code Examples
- Add code-fenced Examples to 3 siblings
- Restore Use-when phrase, plain-text refs in matrix
- Normalize Use-when phrasing in dashboards + layout-chrome SKILL.md
- Plain-text refs in routing matrices (4 siblings)
- Add 'Use when ...' to descriptions, fix 3 MINOR TOC links
- Validation cleanup — Nixtla description + complete TOC embeds
- Convert Examples bullets to code-fenced Input/Output blocks
- Convert anti-slop + contact-sheet Examples to Input/Output blocks
- Clear 7 MAJORs — XML-in-descriptions, missing Examples, numbered Instructions
- Embed per-link TOCs across 12 split skills (89 → 38 TOC MINORs)
- Rewrite cross-sibling ref links to point at the new sibling owners
- Wireframe refs cross-sibling path updates + umbrella SKILL.md
- Trim description in code-diff / code-fences / code-highlight / code-snippets / code-syntax
- Trim description / add example in diag-flow / form-inputs / icon-svg / interactive-controls / visual-communication
- Embed missing TOCs in wf-screens/wf-fidelity/wf-devices/wf-archetypes/tables-special router SKILL.md
- Embed missing TOCs in code-snippets/code-diff/prose-pages router SKILL.md
- Scope TOC to header section in 3 self-debug-rules refs
- Merge sub-headings in 2 refs to fit TOC budget
- Move LaTeX macros into fenced block; correct slate-bg path
- Offload Resources catalogs to references/resources-index.md
- Embed phase-graph-preset TOC in amvcp-diag-architecture SKILL.md
- Clear 20 MD004 NIT bullets — replace prose '+' continuations with words
- Clear remaining 17 NITs (MD004, MD009, MD018, MD024, MD056)

### Documentation

- Add TRDD-9616579c — Phase 2.5/2.6/3 contract + architecture + extended mining
- Add TRDD-6fdf6ad2 — visualize-plugin absorption plan
- Add TRDD-4c300620 — amvcp-show smart router + 6 fixes
- Mark Done — all 6 fixes + amvcp-show router landed

### Features

- Responsive code-blocks, dual bubble handles, copy-button + self-debug skill
- DESIGN.md realtime style engine — parser, hot-swap, style-controller pad
- Bind heading + body typography to DESIGN.md tokens (Phase 1d)
- 13 visualize-skill modules + DESIGN.md-driven runtime/renderer integration
- Unified selection/comment/theme contract across all 13 modules
- 1 → 13 categories × 30+ technique references (~502 ref files)
- Umbrella routing agent + 8 compose-all defects fixed (322/322 green)
- Viewport scaffold — pan, zoom, mini-map for dense diagrams
- Structured-response widgets — quiz / numeric / date / color / rank (Phase 5 batch 1)
- Slider + toggle + rating (batch 2)
- Card-picker + tag-input (batch 3)
- Text + textarea + URL widgets (batch 4)
- Tree picker — hierarchical single-select (batch 5)
- Password + currency widgets (batch 6)
- Gallery picker + tier-list (batch 7)
- Export menu — Copy PNG / Download PNG/JPEG/WebP/SVG (archify, MIT)
- Add R19-R26 function/logic rules + enforce across the plugin
- Add R27-R39 pod+UX rules + prompt-injection scanner
- R27/R29/R33/R37/R39 — pod always-mounted + summon gesture + selection-wins + font-floor
- Theme MutationObserver + auto-load default DESIGN.md
- R28 — saveUserPreset / renameUserPreset / deleteUserPreset
- R38 + R24 — overlay-mode runtime for true-HTML element selection
- Generalize chain-highlight to flow presets + initial minimap paint
- Tier 0 corner buttons — theme/PNG/print/pod 36x36 SVG row
- Product-dashboard preset — Manrope + indigo (TRDD-6fdf6ad2 Tier 1)
- R40 — accessibility + @media print primitives
- Tier 3 — responsive utilities + .ve-hero component
- Tier 1B — per-theme DESIGN.md preset assignment
- Tier 5 — data-ve-chart-type atom with lazy Chart.js
- Tier 4 — visual-component atoms (KPI/tier/VS/stack/timeline)
- ITerm-first launcher for split-pane preview
- Finding-reply submit payload carries 3-state decision
- Smart-router skill + dispatch.py
- Add R41 (dev-browser never headless) + fix amvcp-show R26

### Miscellaneous Tasks

- Re-render all-techniques-sample with regression fixes applied
- Commit symphony-current.html audit snapshot
- Fix 4 pre-existing ruff errors in scan-for-prompt-injection.py
- Register 5 new chart-family siblings in plugin.json allow_orchestrator_traversal
- Register 23 new split sibling skills in allow_orchestrator_traversal

### Refactor

- Split into 6 focused sibling skills
- Split into 5 focused sibling skills
- Create amvcp-layout-shells sibling skill
- Split out amvcp-diag-ascii sibling skill
- Split wf-fidelity bucket part 1/2 — move 5 refs
- Create amvcp-layout-kpi sibling skill
- Create charts-bar sibling (commit 1/N)
- Move 4 more bar-family refs to charts-bar (commit 2/N)
- Create amvcp-layout-print-hero (1/2)
- Finish amvcp-layout-print-hero (2/2)
- Create charts-line-area sibling
- Move chart-bump to charts-line-area
- Create amvcp-layout-chrome (1/3)
- Create charts-part-of-whole sibling
- Finish amvcp-layout-chrome (2/3)
- Finish amvcp-layout-chrome (3/3)
- Split wf-fidelity bucket part 2/2 — SKILL.md + theme ref
- Create wf-devices sibling — device frames + responsive
- Create charts-multi-dim sibling
- Wf-archetypes batch 1/3 — move 5 archetype-shaped refs
- Create amvcp-layout-grids (1/4)
- Move 3 final multi-dim refs
- Finish amvcp-layout-grids (2/4)
- Finish amvcp-layout-grids (3/4)
- Finish amvcp-layout-grids (4/4)
- Split into 4 focused sibling skills (1/n)
- Split into 4 focused sibling skills (2/n)
- Split into 4 focused sibling skills (3/n)
- Split into 4 focused sibling skills (4/n)
- Rewrite parent SKILL.md as slim router
- Split into 4 focused sibling skills (5/n)
- Wf-archetypes SKILL.md — slim router (Nixtla-strict)
- Create dashboards sibling (commit 1/N)
- Split into 4 focused sibling skills (6/n)
- Split into 4 focused sibling skills (7/n)
- Wf-screens batch 2/4 — 5 domain-pattern refs
- Wf-screens batch 3/4 — 5 cross-cutting refs
- Split into 4 focused sibling skills (8/n)
- Wf-screens batch 4/4 — last ref + SKILL.md
- Split into 4 focused sibling skills (9/n)
- Split into 4 focused sibling skills (10/n)
- Split into 4 focused sibling skills
- Create amvcp-anim-entry-scroll sibling (1/N)
- Create amvcp-anim-entry-scroll sibling (2/N)
- Finish amvcp-anim-entry-scroll sibling (3/N)
- Rewrite parent SKILL.md as slim router (1 file)
- Remove 5 dup refs from amvcp-wireframe/references/
- Remove last 2 dup refs (cleanup complete)
- Create amvcp-anim-ambient-hover sibling (1/N)
- Finish amvcp-anim-ambient-hover sibling (2/N)
- Move 5 more dashboards infra refs
- Create amvcp-anim-perf sibling (1/1)
- Create amvcp-anim-handoffs sibling (1/N)
- Finish amvcp-anim-handoffs sibling (2/N)
- Expand amvcp-anim-foundation sibling (1/N)
- Finish amvcp-anim-foundation sibling (2/N)
- Remove obsolete refs (1/N)
- Split into 5 focused sibling skills
- Remove obsolete refs (2/N)
- Remove obsolete refs (3/N)
- Remove obsolete refs (4/N)
- Remove obsolete refs (5/N)
- Remove obsolete refs (6/N)
- Remove obsolete refs (7/N)
- Remove obsolete refs (8/N)
- Rewrite parent SKILL.md as slim router
- Split out amvcp-diag-network sibling skill
- Split amvcp-tokens-anti-slop sibling (1/N)
- Split out amvcp-diag-time sibling skill
- Split amvcp-tokens-contact-sheet sibling (2a/N)
- Split out amvcp-diag-architecture sibling skill
- Split amvcp-tokens-contact-sheet (2b/N)
- Split amvcp-tokens-contact-sheet (2c/N)
- Split out amvcp-diag-flow sibling skill (1/2)
- Split amvcp-tokens-scales sibling (3a/N)
- Split out amvcp-diag-flow sibling skill (2/2)
- Split amvcp-tokens-scales (3b/N)
- Update SKILL.md Resources after batch 5b
- Rewrite parent SKILL.md as slim router
- Split amvcp-tokens-color sibling (4a/N)
- Split amvcp-tokens-color (4b/N)
- Split amvcp-tokens-color (4c/N)
- Split amvcp-tokens-presets sibling (5a/N)
- Split amvcp-tokens-presets (5b/N)
- Split amvcp-tokens-presets (5c/N)
- Rewrite parent SKILL.md as slim router (final/N)

### Testing

- Symlink tests/fixtures/amvcp-overlay.js → scripts/amvcp-overlay.js
## [1.2.11] — 2026-05-13

### Bug Fixes

- Bulk-default switch + selection-model + renderer fidelity
## [1.2.10] — 2026-05-12

### Features

- Per-element 3-state mini-switch (S/A/D) on every selectable atom
## [1.2.9] — 2026-05-12

### Documentation

- V4 status — P1+P3+P4+P5 shipped, P2 deferred to v4.1
## [1.2.8] — 2026-05-12

### Bug Fixes

- ESC clears data-ve-pressed + removes orphan group handles
## [1.2.7] — 2026-05-12

### Documentation

- TRDD-3d1570ab v4 spec + no-scrollbars + selection-model gate

### Features

- Faithful render + table styling + group-selection model

### Testing

- Real-world rendered example for v4 visualizer work
## [1.2.6] — 2026-05-12

### Bug Fixes

- Code block is non-selectable — no hover state, no hover ring
## [1.2.5] — 2026-05-12

### Bug Fixes

- Theme-aware seamless table-form selection + dev preview tooling
- Sync typographic props from <pre>; wrap each code line in span
- Replace 2-column architecture with CSS-counter ::before
- Unify selection on individual codeline entries; full-row block highlight

### Features

- Auto-close pane on selection received + file:// URL fallback
- Two standalone floating buttons (top-right + bottom-(L|R)) replacing single bar
- Code-gutter polish + drag-paint + comment handle + frosted page bg
## [1.2.4] — 2026-05-11

### Bug Fixes

- Actually navigate the Web Browser pane via Python API + safe close
## [1.2.2] — 2026-05-11

### Features

- Add amvcp-iterm2-preview + auto-prefer iTerm2 split-pane in runner
- Disable pane dimming + name preview pane + bright-gray tab color
## [1.2.1] — 2026-05-11

### Bug Fixes

- Theme-leak in injected UI + native-input visibility + comment-pill scroll race
- Comment modal responsive at narrow viewports + clamp gutters

### Documentation

- Add TRDD-5c230516 for 10-skill multi-split

### Features

- Add amvcp-graph-diagrams sub-skill (Mermaid + Graphviz)
- Add amvcp-choice-tables sub-skill (table-form Q&A)
- Add amvcp-regex-vis sub-skill (regex visualizer + editor)
- Add amvcp-charts-and-dashboards sub-skill (Chart.js)
- Add amvcp-math-and-latex sub-skill (KaTeX, mhchem, TikZJax)
- Add amvcp-share-pages sub-skill (Vercel deploy)
- Add amvcp-slide-decks sub-skill (magazine-quality slide decks)
- Add amvcp-prose-pages sub-skill (article-style publishable pages)
- Add amvcp-modal-comments sub-skill (v2/v3 agent-report flow)
- Segmented decision control + draggable modal + anchor connector

### Miscellaneous Tasks

- Sync pyproject.toml + package.json versions to plugin.json (1.2.0)
- Regenerate uv.lock after pyproject version sync

### Refactor

- Move 6 cross-cutting refs to plugin-level references/
- Update plugin-ref-internal cross-references to use ${CLAUDE_PLUGIN_ROOT}
- Split interactive-selection.md into 8 topic files
- Extract comment-chat-box.md from modal-comments.md
- Slim main SKILL.md to <=4000 chars + 5 main-only refs
- Restructure all 10 SKILL.md files for CPV 2.80.1 strict mode
- Satisfy CPV strict-mode rules added since v1.2.0

### Testing

- Update modal_page_scrolls_while_open for new draggable layout + add 2 fixture files
## [1.1.9] — 2026-05-09

### Bug Fixes

- TRDD-5f41ad36 remaining deferred items — Phase A-D

### Documentation

- Add TRDD-5f41ad36 — remaining deferred items
## [1.1.8] — 2026-05-09

### Refactor

- Extract showCloseConfirmation() helper — dedupe inline
## [1.1.7] — 2026-05-09

### Bug Fixes

- TRDD-1dcd0bd7 comprehensive audit — Phase A-F

### Documentation

- Add TRDD-1dcd0bd7 — comprehensive audit fixes (v1.1.7 target)
## [1.1.6] — 2026-05-09

### Bug Fixes

- Satisfy CPV strict-mode after plugin rename

### Documentation

- Add TRDD-6151a6a4 — plugin rename + structural cleanup

### Refactor

- Plugin → ai-maestro-visual-communicator-plugin (TRDD-6151a6a4)
## [1.1.5] — 2026-05-08

### Features

- Swap radios for two toggle switches with mutex (TRDD-7a2dab03 §6.5)
## [1.1.4] — 2026-05-08

### Documentation

- Add TRDD-7a2dab03 — per-element approve/reject/skip decision

### Features

- Per-element approve/reject/skip pills (TRDD-7a2dab03)
## [1.1.3] — 2026-05-08

### Bug Fixes

- Auto-sync uv.lock during version bump
## [1.1.2] — 2026-05-08

### Bug Fixes

- Make GitHub Release step idempotent
## [1.1.1] — 2026-05-08

### Bug Fixes

- Pin astral-sh/setup-uv to v8.1.0

### Miscellaneous Tasks

- Sync to pyproject.toml v1.1.0
## [1.1.0] — 2026-05-08

### Bug Fixes

- Add name: frontmatter to every aimvc-* command
- Clear MD004/MD024/MD028/Ruff-I001 findings in tracked docs

### Documentation

- Rewrite — concise feature list + install instructions only

### Miscellaneous Tasks

- Scaffold canonical plugin pipeline files
- Scope per-tool configs around vendor + Mermaid templates
- Convert all bash scripts to Python (eliminates POSIX-only constraint)
- Restructure into canonical Lint/Validate/Test jobs + add release.yml
- Disable MD013/MD032 for prose-heavy command/skill files
- Pin markdownlint config to CPV-canonical rule set

### Build

- Add --gate / --install-hook + 10-stage publish pipeline
- Rewrite pre-push as thin delegator to publish.py --gate
## [1.0.0] — 2026-05-08

### Bug Fixes

- Exclude .ve-regex wrappers from element-toggle hijack
- Edit-only panel + gold selection paint
- Prose typography + multi-click grammar shifted-by-1
- Per-mount undo/redo, shift+click, overflow, ⌘⇧Z
- Comment-modal v2 — hover-bridge, polling resume, atomic save
- Null-safe pollForCommentReply + harden test server

### Documentation

- TikZJax preload audit + multi-select wire format
- Add TRDD-7a98 multi-select + TRDD-bdf0 regex-vis specs
- Third-party notice for vendored regex-vis (MIT)
- Phase 4 — SKILL.md + cookbook docs (.ve-regex)
- Add TRDD-eff1aa87 — interactive agent reports
- V2 spec — modal comment threads with live in-place reply
- Integrate v2 modal-comment workflow into the skill

### Features

- Multi-select runtime + PWA-manifest runner
- Prose multi-click depths 4-7 (paragraph/section/chapter/all)
- Math click depths 1-7 + numbered-prose restyle + forced sel contrast
- Code click depths 1-7 inside <pre> blocks
- Vendor source + skeleton (Phase 0)
- Phase 1 — first working UMD bundle (484 KB / 151 KB gz)
- Phase 2 — themed to plugin palette (gold/cream/coffee)
- Phase 3 — ve-runtime.js lazy-loads + mounts on .ve-regex
- Phase 4 — drag text selection toggles entries
- Phase 5 — table row/column handles
- Phase 6 — code line-number gutter
- Phase 7 — touch / mobile compatibility
- Interactive agent reports v1 (TRDD-eff1aa87)
- --mode auto for any-H2-as-finding
- V2 — modal comment threads with live in-place reply

### Miscellaneous Tasks

- Gitignore _dev/ folders, reports, and runtime caches
- Remove install-pi.sh
- Gitignore .claude/ session artefacts + .tldr/ runtime state
- Rebrand to ai-maestro-visual-communicator (v1.0.0)

### Refactor

- Move vendor/regex-vis out of plugin tree

### Security

- V0.8.0 — interactive selection (default for every page)

### Testing

- Formal dev-browser test suite (28 tests, all green)
---
*Generated by [git-cliff](https://git-cliff.org)*
