---
trdd-id: YY5ISKCJ
title: Gate G1 fails open on network failure and can let a duplicate-version publish through
column: todo
created: 2026-08-16T20:10:09+0200
updated: 2026-08-16T20:10:09+0200
current-owner: ai-maestro-visual-communicator-plugin
task-type: bugfix
priority: 1
severity: HIGH
effort: S
release-via: publish
labels: [release, publish-pipeline, gate, fail-open]
implementation-commits: []
impacts: [public-api]
---

## Defect

`scripts/publish.py::_read_remote_latest_tag()` (lines 164-183) returns `None` on ANY
non-zero exit from `git ls-remote --tags origin`, with no distinction between "the repo
genuinely has no tags" and "the network was down through every retry". Its own inline
comment says so: "Network failure / no remote — caller treats as 'no remote tag known'".
`_gate_version_bump()` (lines ~255-268) then does `if remote is None: PASS (no remote tag
yet); return True`.

## Why it is serious, in its own words

The docstring at lines 170-172 states the retry wrapper exists precisely so "a transient
network glitch shouldn't make G1 falsely think there's no remote tag (which would let a
duplicate-version push slip through)". `git_with_retry` retries up to GIT_MAX_ATTEMPTS=60
(~240s); on a persistent outage the retries EXHAUST and the non-zero result still collapses
to `None`. So the gate performs exactly the failure its own comment says it was built to
prevent. It fails OPEN, not closed.

## Fleet context

Measured by the ai-maestro hub session, 2026-08-16, reported to us; we did not measure it
ourselves and should say so. Of 22 `publish.py` copies across the fleet, exactly ONE has
`_read_remote_latest_tag` and exactly ONE has a version-bump gate of any kind — both are
amvcp's. The hub broadened past the function name
(`_gate_version_bump|def .*version_bump|G1: version`, plus how each copy learns the remote
version at all: `ls-remote` / `gh release` / `git tag -l` / `describe --tags`) to avoid a
rename-blind needle, and got the same answer. Consequence: this is not one weak gate among
many — it is the fleet's ONLY duplicate-version guard, so nothing else catches what it
misses. That RAISES severity rather than lowering it.

## Trigger condition

`origin` unreachable for the whole retry window (DNS, GitHub outage, flaky link) at the
moment `publish.py --push` runs.

## Candidate fix (UNTRIED — hypothesis, not decided)

Distinguish the failure modes instead of collapsing them. A genuinely tag-less remote
returns success with empty stdout; an outage returns non-zero. So a non-zero exit should
FAIL the gate closed (or raise), while only exit-0-with-no-matching-tags yields `None` →
PASS. Unevaluated risk: a first-ever publish to a brand-new empty remote must still be able
to pass — confirm which exit code `ls-remote` gives on a repo that exists but has zero tags
before implementing.

## Not to be fixed in this phase

Discovery is frozen under the fleet mandate TRDD-BRRJK57P (`mandate: true`,
`mandated-by: user`); remediation is Phase 2. This card IS the deliverable.

## Provenance

Found by amvcp's axis-4 self-audit worker; re-verified at `publish.py:164-183` and
`:255-268` by the amvcp session; re-verified independently at all three line ranges by the
ai-maestro hub session, which also supplied the 1-of-22 measurement. Report:
`reports/plugin-self-audit/20260816_195757+0200-axis4-bugs-and-conflicts.md` (F1).

## Notes and lessons learned

A gate designed to protect against transient failure must treat "retries exhausted" as a
distinct outcome from "confirmed no data" — collapsing both into the same sentinel value
(`None`) reintroduces the exact failure the retry wrapper exists to prevent.
