---
trdd-id: 503fb3af-3363-4683-b658-06771f332356
title: amvcp audit — deferred feature-level gaps (doc claims with no implementation)
column: complete
created: 2026-05-24T23:29:33+0200
updated: 2026-08-25T14:40:00+0200
---

# TRDD-503fb3af — amvcp audit: deferred feature-level gaps

**Filename:** `design/tasks/TRDD-20260524_232933+0200-503fb3af-amvcp-audit-deferred-feature-gaps.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)

## ⏵ STATE — CLOSED 2026-08-25 (authoritative; supersedes everything below)

**ALL GAPS DECIDED AND EXECUTED — card complete.** Owner delegated the decisions
this session ("complete all pending tasks and TRDDs... decide yourself... verify
first"). Every audit claim was re-verified against the live tree before acting;
several had already decayed (fixed by earlier sessions). Final per-gap record:

- **G1, G3, G4 — DONE earlier** (see the 2026-06-10 block below; unchanged).
- **G2 — DONE (B, refined).** `mixDesignMds` false-API claims removed from
  `amvcp-tokens-presets/SKILL.md` (prereq line, step 6, troubleshooting row,
  example, Overview sentence) and softened in `amvcp-design-tokens/SKILL.md`.
  `references/multi-brand-mixer.md` KEPT deliberately: it self-declares "NOT
  currently implemented in the lib" and is an honest inline-recipe design note —
  the Resources link now says so explicitly.
- **G5 — DONE (B).** All twin-gutter claims removed from `amvcp-code-diff`
  (SKILL.md description + body + step + checklist + troubleshooting;
  `references/diff-gutter-old-new.md` git-rm'd — recoverable, was shipped in
  v1.5.x; pr-review-page.md + diff-tints refs rewritten). Verified: zero
  `twin|diff-gutter` residuals, zero dangling links repo-wide. No script ever
  read `data-ve-diff-gutter` (re-verified 2026-08-25).
- **G6 — DECIDED: keep `veWireChart` as the documented legacy compat bridge.**
  The docs already frame it correctly ("LEGACY", migration section, "NEW work
  should use the fenced protocol") and the runtime comment at
  amvcp-runtime.js:3216 records that removing it silently broke a feature once.
  No edits.
- **G7 — DECIDED: keep the frontmatter-only license convention.** No inline
  SPDX headers; stop flagging.
- **G8 — ALL RESOLVED:** (a) `templates/data-table.html` marked standalone
  exemplar (header comment); (b) runtime-size pins — already gone, nothing to
  do; (c) gitignored `reports/` citations ACCEPTED as-is — spot-verified they
  are credit-style provenance or output-path instructions, not runtime reads;
  (d) diagram-router ambiguity — bidirectional tiebreak added
  (amvcp-diagram routing table row + amvcp-graph-diagrams Overview note);
  choice-tables hint already present; (e) SlideEngine routing — already fixed;
  (f) 6 stale fn refs fixed (`mountCommentPill` → runtime comment-pill layer in
  2 refs; `openMermaidInNewTab()`/"Mermaid Zoom Controls" citation → real
  css-patterns.md §"Mermaid Containers" in 3 commands + quality-checklist).
- **Tests: 457/457 green re-verified 2026-08-25** (full run had 2 dev-browser
  daemon-drop ERRORs; both suites 18/18 on isolated rerun — infra flake, not
  regression).

Ships in v1.5.2 via publish.py (the release also carries the stranded docs
commits — hub-approved route 5a).

## Approval log

- 2026-08-25T14:40:00+0200 — COMPLETED by main Claude (owner-delegated). All
  G1–G8 decided + executed; suite green; decisions above.

## ⏵ prior STATE — 2026-06-10 (historical)

**Per-gap status:**
- **G1 (slide delegated-block renderInto) — ✅ DONE** via `TRDD-292ddcd9`
  (branch `feat/audit-gap-fixes`). Verified the bug was REAL, implemented
  option (A): added `renderInto(el,spec)` to amvcp-code-highlight.js /
  amvcp-chart.js / amvcp-diagram.js, fixed the amvcp-slide.js global map,
  reconciled 7 deck docs + 3 mermaid-notation docs, added test-slide-delegated
  (4 tests). Full suite **386/386 PASS**.
- **G4 (csv/yaml fence tokenization) — ✅ DONE** via `TRDD-292ddcd9`. The
  audit's rec (A — implement a tokenizer) was WRONG: the plugin's own design
  (csv-and-data-fences.md, SKILL.md:53) makes csv/yaml DATA fences that render
  plain by design. Resolved as option (B): corrected the ONE false claim
  (SKILL.md:105-107). YAML docs were already truthful — no change needed.
- **G3 (touch parity) — ✅ DONE (rank-list + tier-list)** via `TRDD-7114fb4e`
  Opt 3: shared Pointer-Events makePointerSortable inside amvcp-form-inputs.js,
  HTML5 DnD removed, 30/30 green incl. 7 new touch tests. Kanban drag deferred
  (cross-module sharing decision taken when it's tackled).
- **G2, G5, G6 — OPEN, need a USER product decision** (G2/G5 build needs touching
  a do-not-touch file [amvcp-tokens.js / amvcp-runtime.js] or removing the doc
  promise; G6 is keep/deprecate/remove).
- **G7, G8 — OPEN** (low-priority hygiene; not started).

**Load-bearing facts / gotchas:**
- G2 (`mixDesignMds`) and G5 (twin-gutter diff) live in DO-NOT-TOUCH files
  (amvcp-tokens.js / amvcp-runtime.js) — their natural fix is implement-in-
  protected-file (needs a deliberate decision) OR doc-mark-unavailable (B).
- The renderInto contract is `code{lang,source}` · `diagram{notation,source}`
  · `chart{chartType,data}` (Chart.js-shaped `{labels,datasets}`). Mermaid/
  Graphviz are NOT slide delegated blocks — they live in amvcp-graph-diagrams.
- scripts/amvcp-diagram.js carries 2 pre-existing literal-NUL sentinels
  (lines 1238/1256, composite-key delimiter) — REAL but benign, pre-existing
  on main; CPV flags it MINOR. Cleanup deferred (see TRDD-292ddcd9).

**NEXT ACTION:** none required for G1/G4 (done, awaiting user merge + publish).
For the rest, take a per-gap implement-vs-doc-mark decision (G2/G5 first —
they're HIGH and gated on the DO-NOT-TOUCH-file question).

**SUPERSEDED — do NOT carry forward:** the body below still says G1/G4 are
"broken / not implemented (HIGH)" with open A/B options — that was the state at
audit time (2026-05-24). G1 and G4 are now DONE (above). The G1 symptom text
names old globals (`amvcpCodeBlock`) — that's the historical bug description,
not current code.

**Durable artifacts:** `design/tasks/TRDD-20260610_115000+0200-292ddcd9-*.md`
(the G1+G4 implementation TRDD); `reports/cpv/20260610_*-validate-gapfix.txt`.

## Context

A 12-agent parallel audit of the `ai-maestro-visual-communicator-plugin`
(v1.3.6) fixed ~114 doc/code issues in-place (all verified — dev-browser
suite stayed green at 364/364). The audit also surfaced cross-cutting
items. The **safe mechanical** ones (nested-scrollbar rule violations,
vercel install-command drift, a diagram-export doc contradiction) are
being fixed in the same session. This TRDD captures the **feature-level**
gaps that each require an **implement-vs-remove product decision** and/or
a runtime change with new tests — i.e. the work that must NOT be guessed
at by an audit agent. Each item below is a place where **docs promise a
feature the code does not implement** (a false-doc-claim class bug) OR a
policy call.

Full consolidated audit report (ensemble-generated):
`reports_dev/llm_externalizer/20260524_232716+0200-chat-*-charts-cd9116.md`
Per-slice reports: `reports/plugin-audit/20260524_*-{slice}.md`

## Items (each needs a decision, then implementation)

### G1 — Slide delegated-block API is broken end-to-end (HIGH) — ✅ DONE (TRDD-292ddcd9; option A implemented, 386/386 PASS)
- **Symptom (verified):** `scripts/amvcp-slide.js:124` declares the `code`
  block global as `amvcpCodeBlock` and calls `mod.renderInto(host, spec)`
  at `:1012`. The real renderer is `window.amvcpCodeHighlight`
  (`amvcp-code-highlight.js:1184`); `window.amvcpChart`
  (`amvcp-chart.js:3231`); `window.amvcpDiagram`. **NONE of them defines
  `renderInto`** — the only `renderInto` references in the whole `scripts/`
  tree are inside `amvcp-slide.js` itself. So any deck using a delegated
  `code`/`diagram`/`chart` block throws "window.amvcpCodeBlock.renderInto
  is not available" at runtime. The feature has never worked.
- **Docs that promise it:** `skills/amvcp-slide-decks/SKILL.md:30`,
  `references/03-json-deck-contract.md:82-84`,
  `references/20-layout-code-focus.md` (≈7 mentions), all naming
  non-existent files `amvcp-codeblock.js` / `amvcp-graphdiagram.js` /
  `amvcp-charts.js`.
- **Options:**
  - **(A) Implement** — add a `renderInto(el, spec)` entry point to
    `amvcp-code-highlight.js`, `amvcp-chart.js`, `amvcp-diagram.js`; fix
    `amvcp-slide.js` global map to the real names; fix all docs/filenames;
    add a dev-browser test per delegated block type.
  - **(B) Mark unavailable** — remove the delegated-block code path from
    `amvcp-slide.js` and the feature claims from all 7 docs (slides keep
    plain content blocks only).
- **Recommendation:** (A) — it's the headline feature of the JSON-deck;
  bounded to 4 scripts + docs + 3 tests.

### G2 — `mixDesignMds` multi-brand mixer documented, never implemented (HIGH)
- **Symptom (verified):** referenced in
  `skills/amvcp-tokens-presets/SKILL.md` (frontmatter, Overview, step 6,
  error-handling, example, Resources), `skills/amvcp-design-tokens/SKILL.md:120`,
  and a whole reference `…/multi-brand-mixer.md`; **0 definitions** in
  `scripts/`. `amvcp-tokens.js` is the natural home but is DO-NOT-TOUCH.
- **Options:** (A) implement `mixDesignMds` in `amvcp-tokens.js` + tests;
  (B) remove the feature from the 2 SKILLs + the reference file.
- **Recommendation:** (B) unless the multi-brand mixer is on the roadmap —
  it's a sizable token-algebra feature.

### G3 — Touch parity: drag-reorder widgets desktop-only (HIGH) — 📋 PLANNED (TRDD-7114fb4e; verified facts + design; one architecture decision pending: shared module vs dependency-free)
- **Symptom:** `ve-rank-list` + `ve-tier-list` (`amvcp-form-inputs.js`)
  and kanban drag (`amvcp-interactive.js`) use HTML5 drag-and-drop, which
  is non-functional on touch devices. The audit brief explicitly calls out
  "lack of touch-friendly mode".
- **Options:** (A) add a shared pointer-events-based reorder helper used by
  all three; (B) document desktop-only in each widget's docs.
- **Recommendation:** (A) — pointer-events reorder is reusable and removes
  a real mobile gap; single shared helper + tests.

### G4 — CSV/YAML fence tokenization promised, not implemented (HIGH) — ✅ DONE (TRDD-292ddcd9; option B — audit's "implement" rec corrected; csv/yaml are data fences by design)
- **Symptom:** `amvcp-code-highlight.js` tokenizer registers only
  `js, python, json, bash, html, css, diff`. `csv`/`yaml` render plain,
  but `skills/amvcp-code-fences/SKILL.md:105` + `references/csv-and-data-fences.md`
  promise CSV-specific styling.
- **Options:** (A) register `csv`+`yaml` tokenizers; (B) correct the docs
  and swap example languages (~7 files).
- **Recommendation:** (A) for yaml (common), (B)-or-(A) for csv.

### G5 — Twin-gutter diff documented, not implemented (HIGH)
- **Symptom:** `data-ve-diff-gutter="twin"` described in
  `skills/amvcp-code-diff/SKILL.md` + `references/diff-gutter-old-new.md`,
  but `amvcp-runtime.js` reads neither that attr nor `data-ve-diff-mode`.
- **Options:** (A) implement twin-gutter in runtime (DO-NOT-TOUCH file —
  needs careful change + test); (B) mark "not yet available" in docs.
- **Recommendation:** (B) now, (A) later if demanded.

### G6 — Legacy `veWireChart` Chart.js bridge: keep or deprecate? (MED)
- **Symptom:** `skills/amvcp-dashboards/SKILL.md:114-115` +
  `references/chartjs-integration.md` document a "compatibility-only"
  Chart.js bridge. Removal touches runtime + tests.
- **Decision needed:** keep as supported, formally deprecate, or remove.

### G7 — SPDX-License-Identifier policy (LOW, codebase-wide)
- **Symptom:** license is declared in skill frontmatter + plugin.json, but
  no first-party `scripts/amvcp-*.js` carries an inline
  `// SPDX-License-Identifier: MIT`. Consistent absence across all ~18
  scripts.
- **Decision needed:** adopt SPDX headers plugin-wide (one mechanical
  pass) OR keep the frontmatter-only convention and stop flagging it.

### G8 — Smaller doc/SSOT items (LOW, batch later)
- Parallel table styling: `templates/data-table.html` ships its own CSS
  independent of the token-driven `amvcp-tables.js` theming — two sources
  of truth. Decide: align to tokens, or document as a standalone exemplar.
- Runtime size hand-quoted in `README.md` +
  `references/interactive-selection-base.md` (≈570 KB actual, stale/
  conflicting numbers). Generate at build time or describe, don't pin.
- Gitignored provenance citations: ~7 typo refs + 8 slide-decks refs cite
  `reports/…` paths that don't ship. Inline the statistic or move to a
  committed `design/` note.
- Cross-skill discoverability: `amvcp-graph-diagrams` triggers on the same
  keywords as the `amvcp-diagram` router; `amvcp-choice-tables` is omitted
  from the tables router `description:`. Add preference hints.
- `commands/amvcp-generate-slides.md` still routes to the legacy
  `SlideEngine` template rather than the JSON-deck runtime.
- Stale doc refs to internal fns `mountCommentPill`
  (`references/code-atom-selection.md:A6.5`) and `openMermaidInNewTab`
  (`commands/amvcp-diff-review.md` vs `references/css-patterns.md`).

## Acceptance criteria

- Each of G1–G7 reaches an explicit decision (implement OR remove/document),
  recorded in this TRDD.
- For every "implement" decision: code + co-located docs + a dev-browser
  test; suite stays green.
- For every "remove/document" decision: the false claim is gone from all
  cited files; no orphan references remain.
- G8 items resolved or split into their own follow-up TRDD.
- Re-run `tests/run-all-tests.py` (green) + `publish.py --gate-validate`
  (no new blocking findings) before publish.

## Out of scope

- The ~114 in-place fixes already landed this session (per-slice reports).
- The 3 mechanical cross-cutting fixes (nested-scrollbar, vercel drift,
  diagram-export doc) landing this session.
