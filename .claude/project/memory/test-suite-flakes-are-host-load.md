---
name: test-suite-flakes-are-host-load
description: "browser tests fail randomly with Target crashed, Browser default is not running, Daemon connection closed unexpectedly, or Resource temporarily unavailable os error 35, while every accused suite passes in isolation; publish gate G4 fails on a different suite each run"
ocd: 2026-08-08
lmd: 2026-08-08
metadata:
  node_type: memory
  type: reference
  tier: component
---

# test-suite-flakes-are-host-load

When amvcp's browser suite fails on a suite that passes in isolation, suspect the
HOST before the code. The 36 `.js` suites drive one shared `dev-browser` daemon
holding one Chromium; under machine-wide contention that browser gets OOM-killed
or refused a fork, and the failure lands on whichever suite was running.

**The diagnostic that separates it from a real bug: does the accusation MOVE?**
A real defect fails the same test every time. Across four publish attempts on
2026-08-08 the failures were 11, then 2, then 3, then 1 — on
`test-decision-pills`, `test-diagram`, `test-designmd-engine`, then
`test-editor-toggles` + `test-form-inputs`, then `test-component-variants` +
`test-report-doc`, then `test-tokens-sheet` — and every one of them passed 100%
when re-run alone. Moving accusation + innocent accused = shared resource, not
a defect with an address.

Measure the host, do not guess: `uptime` (this box reached load average **197**
with 40 concurrent Claude sessions) and `vm_stat | sed -n '2p'` (free pages fell
to ~16k ≈ 260 MB). At load >~20 the gate is not trustworthy in either direction.

**What is real and fixed** (`scripts/../tests/run-tests.py`): the runner used to
leave its daemon running at the end, so orphaned daemons accumulated ACROSS runs
and starved the next one — 10 Chromium + 6 daemons were found alive at once. It
now stops the daemon in `main()`'s `finally` **before** taking the leak count, so
"leaked" means a genuine orphan rather than the runner's own live browser, and
`dev-browser stop` is followed by a bounded poll until the process is actually
gone (it returns early, and the next suite then connects to a dying daemon).

See also [[publish-gate-and-release-invariants]].


^ATOM-UD6K-ZZ97 [desc:"moving accusation + innocent accused = host contention, not a test defect", keywords: test_passes_in_isolation Target_crashed Browser_default_is_not_running publish_gate_fails_on_a_different_suite host_load dev-browser_daemon, ocd: 2026-08-08, lmd: 2026-08-08]

A browser suite that fails in the full run but passes 100% when re-run alone is almost never a defect in that suite. amvcp drives 36 .js suites through ONE shared dev-browser daemon holding ONE Chromium; under machine-wide contention that browser is OOM-killed or refused a fork, and the failure lands on whichever suite happened to be running. The tell is that the ACCUSATION MOVES: a real defect fails the same test every time. Measure the host before touching code — uptime (this box hit load average 197 with 40 concurrent Claude sessions) and vm_stat (free pages fell to ~16k, about 260 MB). Above roughly load 20 the gate is untrustworthy in BOTH directions, so a green run proves as little as a red one. [^1] [^2]

## Notes and lessons learned

[^1]: [id:ATOM-HYMZ-4CBD, status:valid, keywords:"flaky_test retry_until_green re-run_the_failing_test gate_keeps_failing publish_blocked_by_tests", ocd:2026-08-08, lmd:2026-08-08] DO NOT add a retry when a suite fails on an infrastructure error, BECAUSE a gate you re-roll until it passes is not a gate — it converts a real resource leak into "weather" and lets the release go green with the defect still in. DO bound the resource lifetime, or stop and measure the host, instead.
[^2]: [id:ATOM-B7XH-F7VJ, status:valid, keywords:"fix_made_it_worse new_error_after_fix EAGAIN os_error_35 partial_fix symptom_changed", ocd:2026-08-08, lmd:2026-08-08] DO NOT accept a fix whose only evidence is "the old symptom stopped", BECAUSE a change can trade one failure for another: restarting the dev-browser daemon per-suite removed "Target crashed" and introduced EAGAIN ("Resource temporarily unavailable, os error 35") from 35x the process churn. DO check whether the NEW error existed before the change — a changed signature means a new cause, not residual old cause.
