---
name: absence-by-grep-is-not-evidence
description: "grep for a feature returns nothing but the feature IS implemented; a test suite looks like it never ran; a spec symbol name is missing from the runtime — verifying amvcp claims with the CLAIM's vocabulary instead of the CODE's — the false-absent that gets acted on, reopening finished work or re-implementing what already ships"
ocd: 2026-08-20
lmd: 2026-08-20
metadata:
  node_type: memory
  type: reference
  tier: aspect
publish-globally: false
---

# absence-by-grep-is-not-evidence


^ATOM-170B-SJ3G [desc: "A TRDD spec sketches symbol names the implementation never adopted, so grepping the spec's vocabulary reports a false absence.", keywords: grep_returns_nothing feature_not_implemented symbol_not_found spec_symbol_names doc_claims_no_implementation verify_TRDD_phase_landed, type: reference, ocd: 2026-08-20, lmd: 2026-08-20]

**Spec names are not runtime names.** TRDD-7a980994 §3.4 specifies a `clickCount` multi-click
depth ladder. `grep clickCount scripts/amvcp-runtime.js` returns nothing — and the feature is
fully implemented: `amvcp-runtime.js:4973` ("Phase 2 — multi-click text selection"), `:4995`
(the §3.4 never-deselect rule), `:5015` (the §3.4 European locale list verbatim), `:5863` (§3.5
"the ONLY path that can DESELECT a text entry").

The asymmetry is what makes this expensive: a false PRESENT is usually caught downstream when
someone uses the thing, but a false ABSENT gets acted on — reopening finished work, or
re-implementing what already ships. Search for the BEHAVIOUR (a distinctive literal, a comment
quoting the spec section) rather than the identifier the spec proposed. [^1]


^ATOM-YXSN-VNHE [desc: "amvcp test suites name their tests by short prefix, not by filename — so grepping the log by suite name looks exactly like the suite never running.", keywords: test_suite_never_ran suite_missing_from_test_log run-all-tests_output cd__tpl__prefix which_tests_ran grep_test_log_returns_zero, type: reference, ocd: 2026-08-20, lmd: 2026-08-20]

**In `tests/run-all-tests.py` output, test names do not contain the suite name.** Suites use
short prefixes of their own: `test-concept-demo.js` emits `cd_*`, `test-editor-template.js`
emits `tpl_*`, `test-editor-kanban.js` emits bare `renders_columns_tickets` /
`touch_drag_moves`. So `grep concept_demo <log>` returns zero, which reads identically to "that
suite never ran".

The authoritative per-suite record is the runner's own `running <file> …` lines — check those,
then read the rows beneath each. Measured 2026-08-20: a 457/457 green run momentarily looked
like 3 of 5 new-skill suites had silently not executed.


^ATOM-5UOG-ZNL8 [desc: "12 of the 13 category libs sit in scripts/; amvcp-typography.js sits under its skill dir, so a scripts-scoped check reports a false 12/13.", keywords: amvcp_typography_lib_missing 12_of_13_category_libs scripts/amvcp-typography.js_not_found category_lib_location, type: reference, ocd: 2026-08-20, lmd: 2026-08-20]

**`scripts/amvcp-typography.js` does not exist — and that is not a gap.** 12 of the 13 category
JS libs live at `scripts/amvcp-<cat>.js`; the 13th lives at
`skills/amvcp-typography/scripts/amvcp-typography.js`. TRDD-9616579c's check F2 ("13 categories
map to 13 JS libs") therefore PASSES, but any `scripts/`-scoped count reports 12/13 and invites
someone to create a file that already ships.

13 docs across the skill corpus reference the lib by bare filename (e.g.
`skills/amvcp-typo-foundation/references/type-scale-engine.md:81`, and
`skills/amvcp-prose-pages/references/composing-with-other-skills.md:93` emits
`<script src="amvcp-typography.js">`). Bare filenames are relative to the emitted artifact, so
the off-pattern location is harmless at runtime — it only breaks repo-scoped audits.

## Notes and lessons learned

[^1]: [id: ATOM-3RLQ-NAFN, status: valid, desc: "Closing a triage on a negative grep — measured 3x in one session on this repo", keywords: "is_this_implemented feature_missing verify_before_reopening grep_proved_absence agent_said_not_implemented doc_claim_no_implementation", ocd: 2026-08-20, lmd: 2026-08-20] DO NOT conclude a feature is unimplemented because a grep for its NAME returned nothing, BECAUSE in this repo the spec, the tests, and the code each name the same thing differently, so an empty result measures your vocabulary and not the tree. DO search for the behaviour — a distinctive string literal, a comment quoting the spec section, the runner's own `running <file>` line — and only then call it absent.
