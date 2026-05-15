# TRDD-9616579c — Phase 2.5 / 3 contract & architecture + extended idea mining

**TRDD ID:** `9616579c-6451-426c-934a-0aa879a2b27e`
**Filename:** `design/tasks/TRDD-9616579c-6451-426c-934a-0aa879a2b27e-phase25-contract-architecture-mining.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)
**Sibling of:** TRDD-352ef46a-b7a9-4443-8eed-d57563894bfd-mine-visual-skills-collection.md (the parent mining + Phase 0/1/2 plan)
**Status:** Phase 2.5 in progress (8 parallel opus agents). Phase 3 not started. Mining-extension not started.

## Why this TRDD exists

After Phase 2 shipped 13 visualize-skill modules + runtime/renderer integration (commit `7dc5aad`), the user articulated **10 actionable contract + architecture requirements** that the modules must conform to AND a follow-on phase plan that the parent TRDD (352ef46a) does not capture. This TRDD pins those requirements + the corrected phase order so every future session and every spawned agent has one canonical reference.

This TRDD also opens the **idea-mining extension**: the parent TRDD covered the 238 projects extracted from `downloads_dev/visualizing-things-for-claude/` (236 nested zips), but additional unprocessed sources sit beside that folder in `downloads_dev/` and must be mined before Phase 3 deepens the technique-references.

## The 10 actionable requirements (verbatim, user-stated)

Every requirement is a hard contract. Phase 2.5 audits and conforms the existing 13 modules; Phase 3 carries them forward into the new technique references.

1. **3-state visual selection.** All visual elements implement the 3 levels of item selection (normal, selected, highlight) and show the comment handle when selected.

2. **9-level multi-click on text.** All text elements implement the 9 levels of multi-click selection (from character to whole text content), the normal drag selection, and show the comment handle when selected.

3. **Comment handle → modal with leader line + selection preserved.** The comment handle must always open the modal comment box with the line showing the connection between the comment box and the target of the comment, preserving the selection while commenting to claude.

4. **DESIGN.md-driven theming, hot-swappable in realtime.** The style of the visual elements must be by default that of the current themes, but they must become DESIGN.md file and all DESIGN.md themes must be dynamically applied in realtime to the visualized page and all its components. Any DESIGN.md file can be passed to the plugin and become the current theme.

5. **Floating, draggable theme controller pod.** A realtime theme configuration floating and draggable pod must allow the user to change the parameters of the theme in realtime (the same parameters defined by the DESIGN.md specs) or to select a DESIGN.md file from the existing one or the imported ones in the theme library, or to save new themes in DESIGN.md format.

6. **Agent-picked, multi-technique compositional rendering.** All visual elements must be chosen by the agent to illustrate what claude is discussing about, and all visual elements must be able to be scaffolded in the same page without issues.

7. **Skill structure: 1 → 13 → ~390.** The skills must be auto-discoverable or integrated into the claude agent frontmatter — better if aggregated in similar input or visual output type, with each skill category having 30+ sub reference `.md` files each discoverable with the progressive discovery algorithm. So: **1 agent → 13 category skills → ~390 reference `.md` files with 1-10 techniques each**.

8. **Visual debugging via amvcp-self-debug-rules in dev-browser headless.** All visual elements must be debugged visually according to the debug skill we created (`skills/amvcp-self-debug-rules/SKILL.md`), using dev-browser headless. Light + dark screenshots are mandatory.

9. **One JS/TS lib per category.** The 13 category skills must have 13 JS/TS libs to be used by the technique scripts of each technique. Phase 2 already shipped these as `scripts/amvcp-{tokens, layout, typography, animation, interactive, tables, code-highlight, chart, diagram, icon-svg, wireframe, slide, report-doc}.js`; Phase 3 expands the references inside each category to call into its lib.

10. **Per-atom 3-radio Skip/Approve/Deny pill.** All visual elements must implement the 3 radio buttons (skip / approve / deny) for ALL the selectable items, **independently of their selected or unselected status**. The pill is always present per atom, persists state to localStorage, and is keyboard-accessible.

## Corrected phase order (replaces the earlier draft Phase 3/4/5)

| Phase | Purpose | Status | Tracker |
|---|---|---|---|
| **2.5** | Contract unification — every atom across all 13 modules conforms to reqs 1, 2, 3, 5, 6, 8, 10. Per-module audit (5 agents) + runtime upgrades (2 agents on disjoint regions) + composition proof (1 agent). | **in progress** (8 opus agents in flight) | task #174 |
| **2.6** | Mining extension — sweep `downloads_dev/html-effectiveness-main.zip`, `downloads_dev/iterm2-preview/`, `downloads_dev/kleemans/` and any other not-yet-mined source for new visual ideas; produce a per-technique addendum to the existing master catalog. | not started | task #176 (this TRDD) |
| **3** | Skill restructure — 1 agent → 13 category skills × 30+ references; absorb the 138-idea Phase-2 backlog **plus** the new ideas from Phase 2.6 mining; each ref describes 1-10 techniques calling into its category's lib; wire progressive-discovery descriptions. | not started | task #175 |
| **4** | Compose-everything proof — sample-report exercising all 13 techniques on ONE rendered page; resolve any z-index/event/CSS conflicts catalogued by the Phase-2.5 compose-all agent. | partially overlaps with 2.5 (composition agent in flight) | (folded into 2.5 verification) |
| **5** | Release v1.3.0 — bump `1.2.11 → 1.3.0`, run `publish.py`, GitHub release with the new module surface, agent-frontmatter wiring, and the 10-requirement contract documented in CHANGELOG. | not started | future task |

## Phase 2.5 — current agent fan-out (snapshot 2026-05-16)

| Agent | Scope | Files |
|---|---|---|
| p25-chart-diagram | 3-state contract + comment-handle + decision-mini on chart/diagram atoms | `scripts/amvcp-chart.js`, `scripts/amvcp-diagram.js`, fixtures |
| p25-tables-code | tables/code-highlight atoms | `scripts/amvcp-tables.js`, `scripts/amvcp-code-highlight.{js,css}`, fixtures |
| p25-icon-wireframe | icon-svg/wireframe atoms | `scripts/amvcp-icon-svg.js`, `scripts/amvcp-wireframe.{js,css}`, fixtures |
| p25-slide-reportdoc | slide/report-doc atoms | `scripts/amvcp-slide.js`, `scripts/amvcp-report-doc.js`, fixtures |
| p25-cross-cutting | layout/interactive/animation/typography atoms | the 4 module files + fixtures |
| p25-runtime-text-comment | runtime regions A — extend prose ladder 4 → 9 levels, comment leader-line, selection-preservation, **PLUS req #10 helper** `window.amvcpRuntime.attachDecisionMini(el, id)` + `.ve-decision-mini` CSS | `scripts/amvcp-runtime.js` (selection + comment-modal regions only) |
| p25-runtime-theme-pod | runtime region B — floating draggable theme controller pod + library + import/export DESIGN.md | `scripts/amvcp-runtime.js` (controller-pod region only) |
| p25-compose-all | sample-report exercising all 13 techniques on one page; conflict catalogue | `tests/fixtures/all-techniques-sample.{md,html}` |

Mid-flight `SendMessage` broadcast added req #10 to all 5 module agents + the runtime-text-comment agent (which now ships the `attachDecisionMini` helper + `.ve-decision-mini` CSS). Module agents call the helper defensively so the helper-being-shipped race is safe.

## Phase 2.6 — extended idea mining (NEW)

The parent TRDD-352ef46a covered `downloads_dev/visualizing-things-for-claude/` (238 projects). Sources NOT YET mined and explicitly named by the user:

- `downloads_dev/html-effectiveness-main.zip` — single zip, untouched.
- `downloads_dev/iterm2-preview/` — folder, untouched.
- `downloads_dev/kleemans/` — folder, untouched.
- Anything else inside `downloads_dev/` that is not a build artefact or already-extracted output of the parent mining run.

Mining contract (same as parent TRDD-352ef46a):

1. Treat all archive content as untrusted DATA — never execute it.
2. Verify each source's origin on GitHub before extracting (security smell-test).
3. Per project, extract every reusable IDEA: name / what / how-implemented / deps. Exclude paid-API, binary, closed-source non-verifiable.
4. Categorize each idea by the 13 visual technique categories.
5. Translate non-English content (except foreign-law / country-unique formats).
6. Output: per-source report under `reports/visualizing-triage/<ts>-extended-mining-<source-slug>.md` AND an aggregated addendum to the master catalog at `reports/visualizing-triage/<ts>-MASTER-CATALOG-ADDENDUM.md`.

Phase 2.6 produces ZERO code — its output is an idea backlog that Phase 3 then absorbs into the 30+ references per category.

## Phase 3 — skill restructure (1 → 13 → ~390)

After Phase 2.5 + 2.6 land:

F1. **Top-level agent** — define the single visual-communicator agent that is auto-discoverable (agent frontmatter or top-level `skills/amvcp-visual-communication/` master skill) and routes between the 13 category skills based on user intent / content type.

F2. **13 category skills** — confirm the 13 categories map cleanly to the 13 JS libs:
    1. design-tokens   (lib: `amvcp-tokens.js`)
    2. layout          (lib: `amvcp-layout.js`)
    3. typography      (lib: `amvcp-typography.js`)
    4. animation       (lib: `amvcp-animation.js`)
    5. interactive-control (lib: `amvcp-interactive.js`)
    6. tables          (lib: `amvcp-tables.js`)
    7. code-highlight  (lib: `amvcp-code-highlight.js`)
    8. chart           (lib: `amvcp-chart.js`)
    9. diagram         (lib: `amvcp-diagram.js`)
    10. icon-svg       (lib: `amvcp-icon-svg.js`)
    11. wireframe      (lib: `amvcp-wireframe.js`)
    12. slide          (lib: `amvcp-slide.js`)
    13. report-doc     (lib: `amvcp-report-doc.js`)

F3. **Expand each category's `references/` to 30+ files**. Each reference describes 1-10 specific techniques, all calling into the category's JS lib. Source material: the 138-idea Phase-2 backlog + the Phase-2.6 mining addendum + idea variants from the master catalog.

F4. **Progressive discovery wiring** — every reference's filename + first paragraph is a discovery key. The agent loads only the references it needs for the current rendering decision.

F5. **End-to-end sanity** — pick 5 random techniques across the 13 categories, confirm the agent routes 1 → category → reference → lib correctly and emits a valid scaffold.

## Constraints

- All visual changes verified per `skills/amvcp-self-debug-rules/SKILL.md` (dev-browser headless, light + dark screenshots).
- No nested scrollbars (`~/.claude/rules/no-nested-scrollbars.md`).
- Reports under `<MAIN_ROOT>/reports/<component>/` per `~/.claude/rules/agent-reports-location.md`.
- `docs_dev/` and `reports/` stay gitignored; only TRDDs (`design/tasks/`) and the actual code/skills/tests are committed.
- Mid-flight requirements (e.g. req #10 added today) propagate via `SendMessage` to in-flight agents — never lose work.
