---
trdd-id: 292ddcd9-bb3b-4cf3-bf09-1ebbb34cc2e8
title: Fix slide delegated-block renderInto API (G1) + correct false CSV/mermaid doc claims (G4)
column: complete
created: 2026-06-10T11:50:00+0200
updated: 2026-06-10T11:50:00+0200
current-owner: amvcp-dev
assignee: amvcp-dev
priority: 2
severity: HIGH
effort: M
labels: [audit-gaps, slide-decks, code-highlight, doc-truth, G1, G4]
task-type: bugfix
parent-trdd: TRDD-503fb3af
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
last-test-at: 2026-06-10T11:46:00+0200
implementation-commits: []
external-refs: []
---

# TRDD-292ddcd9 — slide delegated-block renderInto (G1) + CSV/mermaid doc truth (G4)

**Filename:** `design/tasks/TRDD-20260610_115000+0200-292ddcd9-slide-delegated-renderInto-and-csv-docfix.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)

Resolves two of the parent audit's deferred gaps (`TRDD-503fb3af`), records one
CPV finding as a verified FALSE POSITIVE, and corrects one CPV finding this work
initially mischaracterized (the 0x00 byte is REAL, but pre-existing and benign).

## Method (mandate: verify each fact, no groundless assumptions)

Every audit claim was re-verified against CURRENT code before acting — the
audit is ~2 weeks old. This caught two false positives AND corrected the
audit's own wrong recommendation on G4.

## G1 — slide delegated-block `renderInto` API (was broken end-to-end) — FIXED

**Verified real:** `scripts/amvcp-slide.js` renders a deck `code`/`diagram`/
`chart` block by calling `window.<module>.renderInto(host, spec)` and throws
if absent (`renderDelegated()` ~line 998). `grep -rn renderInto scripts/`
returned ONLY amvcp-slide.js — NO renderer defined it, so every delegated
block threw `"window.amvcp*.renderInto is not available"` at render time. The
JSON-deck headline feature never worked. The global map also named phantom
globals/files (`amvcpCodeBlock` / `amvcp-codeblock.js`, etc.).

**Fix (audit recommendation A — implement):**
- Added `renderInto(el, spec)` to the THREE real renderers, each reusing
  existing internals (no duplicate logic), fail-fast on bad `el`/missing source:
  - `scripts/amvcp-code-highlight.js` — `spec={lang,source}`; reuses
    `highlightBlock` + reproduces the `initCodeGutter` `.ve-code-block`
    `<pre><code>` DOM; sets the double-process guards.
  - `scripts/amvcp-chart.js` — `spec={chartType,data}`; converts the deck's
    Chart.js-shaped `{labels,datasets}` (verified the deck contract uses this,
    12-layout-data-story.md) to the module's native `{title,series:[{x,y}]}`
    and reuses `render(spec,type,host)`.
  - `scripts/amvcp-diagram.js` — `spec={notation,source}`; routes scene-graph
    JSON (`reRenderScene`) + ASCII (`.ve-ascii-diagram` selectable host);
    fail-fasts on mermaid/graphviz (this module has no such parser — see below).
- Fixed `amvcp-slide.js` `DELEGATED_BLOCKS` global map to the REAL globals +
  filenames (`amvcpCodeHighlight`/amvcp-code-highlight.js, amvcp-diagram.js,
  amvcp-chart.js).
- Reconciled 7 deck docs that cited the 3 non-existent renderer filenames
  (`amvcp-codeblock.js`/`amvcp-graphdiagram.js`/`amvcp-charts.js`).
- Added `tests/scripts/test-slide-delegated.js` + `tests/fixtures/
  slide-delegated-fixture.html` — renders a deck with all 3 delegated block
  types and asserts each produces real DOM (4 tests, all PASS).

**Sub-finding (mermaid):** the deck docs showed `diagram` blocks with
`notation:"mermaid"`, but `window.amvcpDiagram` (amvcp-diagram.js) renders
ONLY scene-graph + ASCII — it *themes* Mermaid but does not bundle/render it.
Mermaid/Graphviz live in `amvcp-graph-diagrams` (Mermaid v11 ESM/CDN, via
`/amvcp-generate-web-diagram`), NOT in slide delegated blocks. Corrected the
false mermaid examples to supported notations + a clarifying note (3 docs).

## G4 — CSV/YAML "tokenizer styling" claim — audit was WRONG; doc-truth fix

**Audit recommended (A) implement a CSV/YAML tokenizer. Verification proved
that wrong:** the plugin's own reference (`csv-and-data-fences.md:65-68`) and
`amvcp-code-fences/SKILL.md:53` state — correctly — that CSV/YAML are DATA
fences that **opt OUT** of source-code tokenization and render plain (the
tokenizer returns null by design). Only `SKILL.md:105-107` falsely claimed
`language-csv` "tells the tokenizer to apply CSV-specific row/column styling".
Implementing a tokenizer would CONTRADICT the deliberate data-fence design.

**Fix:** corrected `amvcp-code-fences/SKILL.md:105-107` to state the truth
(data-fence declaration → plain, byte-exact; `data-ve-no-gutter` suppresses the
gutter). No code change.

## Verified FALSE POSITIVE (no action — recorded so it's not re-chased)

- "Reference to non-existent skill `amvcp-wf`" (amvcp-wireframe/SKILL.md): the
  validator strips a real reference to the `amvcp-wf-*` FAMILY down to the
  `amvcp-wf` prefix and fails to find a skill by that exact name. VERIFIED: every
  occurrence in that SKILL.md is one of the 4 real skills `amvcp-wf-fidelity`/
  `-devices`/`-screens`/`-archetypes` (all dirs exist); there is NO bare
  `amvcp-wf` reference and no bare `skills/amvcp-wf` dir. Prefix-match FP.

## Real-but-pre-existing benign finding (corrected — NOT a false positive, NOT from this change)

- "Raw control characters (0x00) in scripts/amvcp-diagram.js" is REAL: there are
  exactly 2 NUL bytes, at lines 1238 & 1256, used as a deliberate composite-key
  delimiter sentinel (`reachedEdges[cur + '\x00' + outs[k]]` … `ek.split('\x00')`)
  in the edge-reachability traversal. VERIFIED pre-existing on `main` (`main` NUL
  count = 2) and OUTSIDE this branch's diff (my only hunks are the renderInto add
  at ~2350 and the export at ~2826) — so this MINOR is a pre-existing condition,
  not introduced here. (It is also why plain `grep` treats the file as binary —
  a NUL byte is the classic binary marker; an earlier note wrongly blamed
  box-drawing unicode and wrongly claimed "no NUL byte" — both corrected here.)
  A behavior-preserving cleanup (literal `0x00` → the runtime String.fromCharCode(0) form,
  identical runtime string, pure-ASCII source, mirrors the house-style sentinels
  in amvcp-code-highlight.js) is a LOW-priority candidate; DEFERRED here rather
  than risk a fiddly control-byte edit on a benign pre-existing sentinel during
  the G1/G4 landing.

## Verification

- `python3 tests/run-tests.py --only test-slide-delegated,test-slide` → 21/21 PASS.
- `python3 tests/run-all-tests.py` → **386/386 PASS**, all green, zero leaked
  renderers — the 3 renderer edits broke no existing code/chart/diagram tests.
- CPV: no new blocking findings in the changed files (pre-existing findings are
  the documented scanner-self-match FP class).

## Parent backlog status (TRDD-503fb3af)

- G1 → DONE (implemented, this TRDD).
- G4 → DONE (doc-truth fix; audit's "implement tokenizer" rec corrected).
- G2/G3/G5/G6/G7/G8 → still open; G2/G5 natural homes are DO-NOT-TOUCH
  (amvcp-tokens.js / amvcp-runtime.js) so they are doc-or-defer decisions.

## Delivery

The repo's `git-hooks/pre-push` forbids direct branch pushes (only publish.py
may push), so this branch stays LOCAL on `feat/audit-gap-fixes` (off `main`),
awaiting the user's local merge + publish.py release. No push, no PR.
