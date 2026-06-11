---
trdd-id: 10db8f1c-25f8-429b-b316-fd2a016002c6
title: No-new-elements highlight rule — fix SVG bbox-outline leak, restore warm palette
column: complete
created: 2026-06-11T05:36:48+0200
updated: 2026-06-11T05:36:48+0200
current-owner: amvcp-dev
assignee: amvcp-dev
priority: 1
severity: HIGH
effort: M
labels: [interaction-design, runtime, selection, aesthetics, user-rule]
task-type: bugfix
parent-trdd: null
npt: []
eht: []
blocked-by: []
relevant-rules: []
release-via: publish
delivery: direct-push
target-branch: main
feature-branch: feat/audit-gap-fixes
merge-strategy: squash
must-pass-tests-before-merge: true
test-requirements: [dev-browser-headless]
review-requirements: [human-review]
runtime-targets: [macos, linux, windows]
impacts: []
attempts: 1
test-failures: 0
last-test-result: pass
last-test-at: 2026-06-11T05:33:00+0200
implementation-commits: []
external-refs: []
---

# TRDD-10db8f1c — no-new-elements highlight + warm palette restoration

**Filename:** `design/tasks/TRDD-20260611_053648+0200-10db8f1c-no-new-elements-highlight.md`

## The user's rule (verbatim intent, 2026-06-11, with screenshots)

> "highlight and selection should never add new elements on screen, but only
> increase the brightness and add glow/shadow to the existing ones."

Plus two more findings from the same feedback: a selected bezier edge showed a
TRUNCATED rectangle that panning could never reveal; and the beautiful warm
light style was replaced by "simple white and black" instead of fixing the one
contrast bug inside it ("you should have fixed that, not change everything"),
while the navy dark mode was "ugly".

## Root causes (all verified empirically in-browser)

1. **Runtime CSS specificity leak.** The generic HTML hover/selected rules
   (`[data-ve-id]:not(…):not(table):not(pre)[:hover|[data-ve-selected]]`,
   specificity (0,3,2), `!important`) BEAT the SVG suppression rule
   (`svg [data-ve-id]… { outline:none !important }`, (0,2,1)). Selected/hovered
   SVG `<g>` groups therefore received `outline` — and Chromium renders an SVG
   outline as the group's BOUNDING-BOX RECTANGLE: an extra gold frame around
   nodes; a huge clipped rectangle around a long bezier edge (its bbox spans
   the whole graph — pan can never reveal it). The g-level `filter` from the
   same leak ALSO stacked with the per-shape brightness (double-darkening).
2. **Page-side fill-tint stacking.** The fleet page's hover/selected CSS set a
   12% accent fill-mix on top of the runtime's `brightness(0.87)` → mud.
3. **Palette swap instead of contrast fix.** The graph-text contrast bug was
   "fixed" by replacing the whole approved warm palette with a white/navy one.

## Fixes

- **amvcp-runtime.js** (surgical, 4 selectors + autopsy comment): the generic
  HTML state rules now carry `:not(svg *)` — SVG state styling lives
  exclusively in the per-shape brightness/glow rules. Verified by the new
  regression test AND the FULL suite: **391/391 PASS** (zero regressions).
- **Page/template/fixture CSS**: hover/selected re-color the stroke ONLY (no
  fill-tint, no outline) — the runtime owns brightness/glow.
- **Fleet page + template + fixture re-paletted to the warm family** (the
  engine's built-in parchment light + burnished dark), light default; the
  contrast bug is fixed where it lived (nodes = surface fill + content text
  via `path,polygon,ellipse` token CSS), not by changing the look.
- **Fleet page DOT**: removed the two `constraint=false` rails edges whose
  circumnavigating beziers read as a giant clipped rectangle when highlighted.
- **Rule encoded** in: references/interactive-selection-base.md (Page CSS
  contract), references/QUICKSTART-web-diagram.md (trap 0), CLAUDE.md (FIXED
  interaction mode), templates/graphviz-diagram.html (comment), memory note
  `feedback_no_new_elements_highlight`.
- **Regression test**: `gvt_selection_no_new_elements` (real clicks on a node
  + an edge; asserts computed outline-style none on both groups, no g-level
  filter, no injected children).

## Verification

- test-graphviz-template 5/5 PASS; full suite **391/391 PASS** after the
  runtime change.
- Both themes screenshot-verified on the fleet page with live selections
  (reports/screenshots/fleet-workflow-warm-{light,dark}-selected.png).

## Deferred / follow-ups

- The brightness DIRECTION debate (user says "increase"; on near-white light
  surfaces only darkening is visible — today's behavior). If the user wants a
  glow-only light-theme treatment instead of darkening, that's a runtime
  `--ve-brightness-*` tuning task — separate decision.
- Mermaid pages: same no-new-elements audit for `.mermaid` content (the
  `:not(svg *)` fix already covers all SVG, but mermaid-specific page CSS in
  templates/mermaid-flowchart.html deserves the same stroke-only review).
