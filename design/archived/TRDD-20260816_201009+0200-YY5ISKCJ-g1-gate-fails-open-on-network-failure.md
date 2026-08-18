---
trdd-id: YY5ISKCJ
title: Gate G1 fails open on network failure and can let a duplicate-version publish through
column: published
created: 2026-08-16T20:10:09+0200
updated: 2026-08-18T22:20:00+0200
current-owner: ai-maestro-visual-communicator-plugin
task-type: bugfix
priority: 1
severity: HIGH
effort: S
release-via: publish
labels: [release, publish-pipeline, gate, fail-open]
implementation-commits: [807fbbc, c1571ee]
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

### Blocking question — ANSWERED 2026-08-16, the risk does not materialise

Measured on a scratch bare repo by the ai-maestro hub session, then reproduced
INDEPENDENTLY here (the hub's unreachable case was a local path; the reproduction below
used a real DNS failure over https, which the hub explicitly had not run):

| case | exit | stdout |
|---|---|---|
| A — remote EXISTS, zero tags | `0` | empty |
| B — control, same remote WITH `v1.0.0` | `0` | `<sha>\trefs/tags/v1.0.0` |
| C — unresolvable host (network failure) | `128` | `fatal: … Could not resolve host` |

Case B is the positive control: it proves the probe can discriminate, so A's empty result
is a real zero and not a broken instrument.

**Therefore `returncode != 0` NEVER fires for a legitimately tag-less remote.** A
first-ever publish exits 0 with empty stdout, reaches the parse loop, and yields no
versions — unaffected by the fix. The two cases are ALREADY distinguishable at the
syscall; the current code discards that distinction by collapsing both into one `None`.

So the fix is small and safe: reserve `None` for READ SUCCEEDED + ZERO TAGS → PASS, and
give READ FAILED a distinct value that G1 treats as FAIL CLOSED. `git_with_retry` then
does what its docstring already claims.

## IMPLEMENTED — Phase 2, 2026-08-18

Phase 2 authorized: the hub card TRDD-BRRJK57P STATE block records the hold as
SUPERSEDED 2026-08-18T19:53:29+0200 (USER direct delegation, quoted in its Approval
log), verified first-hand in `~/ai-maestro`; the USER additionally granted "go on,
permission granted" in this session.

Fix shipped exactly per the measured shape: `_read_remote_latest_tag()` now raises
`RemoteTagReadError` on a non-zero `ls-remote` exit (read FAILED) instead of returning
`None`; `None` is reserved for read-succeeded-zero-tags, so a first-ever publish still
passes. `_gate_version_bump()` catches the error and FAILS CLOSED with an explicit log.

Proven by `tests/scripts/test-publish-gates.py` — three real-git cases mirroring the
measurement table (no mocks: real bare-repo origin for A/B, real DNS failure for C;
the only test adaptation is `max_attempts=1` on the real retry wrapper so case C does
not spin 240s). Full suite 457/457 green after the change.

## Related

- `TRDD-LSHTWMTU` (resolver-tag backfill blocked by G1 ordering) shares the same root
  shape: both collapse distinguishable states into one value (no-tags vs no-network
  here; before-push vs after-push there). Cross-linked per the Phase-2 blindspot note.

## Provenance

Found by amvcp's axis-4 self-audit worker; re-verified at `publish.py:164-183` and
`:255-268` by the amvcp session; re-verified independently at all three line ranges by the
ai-maestro hub session, which also supplied the 1-of-22 measurement. Report:
`reports/plugin-self-audit/20260816_195757+0200-axis4-bugs-and-conflicts.md` (F1).

## Approval log

- 2026-08-18T22:20:00+0200 — PUBLISHED in v1.5.1 (`chore(release): v1.5.1`, tag `v1.5.1`,
  GitHub release live, main == origin/main verified). Fix `807fbbc`; `c1571ee` cleared the
  one CPV NIT (docwiki fixture MD018) that blocked the first publish attempt. Executed
  under fleet mandate TRDD-BRRJK57P Phase 2 (USER delegation recorded in the hub card)
  plus the USER's direct "go on, permission granted" in this session.

## Notes and lessons learned

A gate designed to protect against transient failure must treat "retries exhausted" as a
distinct outcome from "confirmed no data" — collapsing both into the same sentinel value
(`None`) reintroduces the exact failure the retry wrapper exists to prevent.
