---
trdd-id: 1627a698-c822-4729-9d1a-1b3296327623
title: Build the 6 remaining html-effectiveness gaps — 5 interactive-editor skills + approaches-comparison
column: backburner
created: 2026-06-08T18:00:29+0200
updated: 2026-06-08T18:00:29+0200
current-owner: amvcp-dev
assignee: null
priority: 5
severity: LOW
effort: L
labels: [html-effectiveness-import, interactive-editor, backlog]
task-type: feature
parent-trdd: TRDD-7a2dab03
npt: []
eht: []
blocked-by: []
relevant-rules: []
release-via: publish
delivery: pull-request
target-branch: main
test-requirements: [dev-browser-headless]
review-requirements: [human-review]
runtime-targets: [macos]
impacts: []
attempts: 0
last-test-result: not-run
---

# TRDD-1627a698 — Build the 6 remaining html-effectiveness gaps

**Filename:** `design/tasks/TRDD-20260608_180029+0200-1627a698-html-effectiveness-editor-gaps.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)

## Why this TRDD exists

The 2026-05-25 **"html-effectiveness import"** (Anthropic's *"The unreasonable
effectiveness of HTML"* companion set, 20 interactive HTML artifacts) was
catalogued and partially integrated (graphic-style refinements landed in commit
`e5004db`; the component-variant matrix landed as `amvcp-component-variant-matrix`
in `4c9c9c8`). Its decision artifact — `reports/html-effectiveness/coverage-matrix.md`
— records the remaining work, **but `reports/` is gitignored**, so that decision is
invisible to future sessions. Per the report→TRDD conversion rule, the decision is
captured here as a tracked backlog.

Verified 2026-06-08 against the actual `skills/` tree: none of the 5 proposed
gap-closing skills exist; the matrix's own summary miscounts its table (says
"14/20 + 6 gaps"; the table is **13 ✅ / 2 🟡 / 5 ❌**).

## The 6 remaining items

All ❌ items are the **interactive "custom tool / live editor"** class. Their
defining trait (per the source's *Custom Editing Interfaces* section): *manipulate
state in the UI, then **export** it back to something the agent can read* — which is
EXACTLY amvcp's existing selection-payload round-trip
(`amvcp-select.py` → `{selections:[…]}` JSON → Claude). So each becomes a skill
whose editor's **export/submit** flows through the existing runtime selection
channel — honoring the FIXED Interaction-Design Mode (select → triple-feedback →
comment/edit → re-emit), never a foreign interaction paradigm.

| # | Artifact | Status | Proposed skill | What it emits |
|---|----------|--------|----------------|---------------|
| 07 | Animation sandbox (transition isolated + live duration/easing sliders) | ❌ | `amvcp-anim-sandbox` (or a mode of `amvcp-anim-foundation`) | live easing/duration tuner |
| 15 | Concept explainer (LIVE manipulable demo + table + glossary) | ❌ | `amvcp-concept-demo` (prose-pages sibling) | manipulable concept-demo widget |
| 18 | Ticket triage board (drag Now/Next/Later/Cut → export md) | ❌ | `amvcp-editor-kanban` | drag triage board → export ordering |
| 19 | Feature-flag editor (grouped toggles + dep warnings + copy-diff) | ❌ | `amvcp-editor-toggles` | grouped flag editor + dep warnings + copy-diff |
| 20 | Prompt tuner (editable template + var slots + live re-render) | ❌ | `amvcp-editor-template` | prompt/template tuner with live var-slot re-render |
| 01 | Three code approaches (side-by-side + inline trade-offs) | 🟡 | mode/reference under `amvcp-tables-matrix-compare` + `amvcp-code-highlight` | dedicated approaches-comparison path |

## Per-element decision (architecture compliance)

- **One skill per THING.** Each ❌ is a distinct *thing* with no existing home →
  a new skill is justified (not a mode-variant of an existing one). #01 is NOT a
  new thing (comparison already lives in `tables-matrix-compare`) → a mode/reference,
  not a new skill.
- **Augment, never replace.** Each editor's interaction maps onto OUR fixed model
  (selection → triple-state feedback → comment/edit → re-emit); the export rides the
  existing selection payload. No foreign selection/drag/export UX is adopted wholesale.
- **Composable primitives.** Build as simple HTML+SVG primitives with their own
  `data-ve-*` atoms + DESIGN.md theming; the single runtime scan inits them.

## Build plan (each skill follows plugin standards)

For each new skill: `SKILL.md` + `references/` + runtime support in a `scripts/`
module (or a mode of an existing module) + dev-browser test(s) + **light + dark**.

1. `amvcp-anim-sandbox` — live easing/duration tuner; export the chosen
   timing-function/duration as a selection payload.
2. `amvcp-concept-demo` — manipulable concept-visualization scaffold; export the
   manipulated state.
3. `amvcp-editor-kanban` — drag Now/Next/Later/Cut; export the column ordering as
   markdown.
4. `amvcp-editor-toggles` — grouped flag editor + dependency warnings; export a
   copy-diff of toggled flags.
5. `amvcp-editor-template` — prompt/template tuner with live var-slot re-render;
   export the filled template.
6. (01) approaches-comparison → a mode/reference under `amvcp-tables-matrix-compare`
   + `amvcp-code-highlight` (no new skill).

## Derived tasks / consequences to verify when built

- **Runtime selection channel load:** confirm `amvcp-select.py` round-trip handles
  the new editors' export payloads without schema drift (one source of truth for the
  selection JSON).
- **Composability:** verify each new editor nests cleanly via `<foreignObject>` /
  overlays alongside existing elements (no rigid bespoke container).
- **Theme parity:** every editor ships light + dark (single-theme = correctness defect).
- **Screenshot-test** each in both themes (dev-browser, headless).
- **the-skills-menu / routing:** register each new skill in the umbrella routing so
  the agent can discover it.

## Durable artifacts to read before acting

- `reports/html-effectiveness/coverage-matrix.md` — the decision (gitignored; source of truth for this TRDD).
- `reports/html-effectiveness/20260525_204926+0200-build-refinements.md` — what the graphic-style refinements were.
- `reports/html-effectiveness/_ANALYSIS-BRIEF.md`, `catalogue-*.md` — the full per-artifact catalogue.
- `design/tasks/TRDD-7a2dab03-*-per-element-decision.md` — the parent import-decision TRDD.

## Status

Parked (`backburner`). Not started; unrelated to the current
`fix/ed5e8cc2-chartjs-resize-wedge` branch. Promote to `todo` when the user picks it up.
