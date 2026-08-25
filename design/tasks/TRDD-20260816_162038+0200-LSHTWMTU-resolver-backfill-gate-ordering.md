---
trdd-id: LSHTWMTU
title: Resolver-tag backfill can never pass gate G1 because it runs after the release push
column: backburner
created: 2026-08-16T16:20:38+0200
updated: 2026-08-25T14:35:00+0200
current-owner: ai-maestro-visual-communicator-plugin
task-type: infra
priority: 6
severity: LOW
effort: S
release-via: publish
labels: [release, publish-pipeline, resolver-tags]
implementation-commits: []
---

## Symptom

Every `publish.py --push` ends with `resolver-tag backfill push failed (exit 1)`.
Non-fatal by design (`check=False`) — the release itself ships fine. Observed on
the v1.5.0 release, 2026-08-16.

## Root cause (ordering, NOT the tag guard)

`scripts/publish.py::_push_resolver_backfill()` (~line 758) is called from
`_stage_commit_tag_push()` AFTER `_git_push()`. It tag-only-pushes the
historical resolver twins `{name}--v<version>` for every already-released
version. That push re-enters the pre-push hook, which delegates to
`publish.py --gate`; gate G1 requires local plugin.json version STRICTLY
GREATER than the latest remote tag. Because the release push already landed,
remote == local (1.5.0 == 1.5.0), so G1 fails. It can NEVER pass in this
position — it is not flaky, it is structurally impossible.

## Not the cause (rule this out explicitly so nobody re-fixes it)

The pre-push tag guard is fine. Commit 75f1fe1 taught it the backfill shape,
fail-closed — accepted all 46 twins in the v1.5.0 run, logged `[pre-push]
Tag(s) accepted (current version or verified backfill twin): ...`. The
failure is one gate LATER.

## Consequence

Historical twins `v0.1.0`..`v1.4.0` never reach the remote, so a
version-constrained dependent cannot resolve old amvcp releases. The publish
log's own line "the next publish retries the backfill" is misleading — the
retry is guaranteed to fail too.

## Why deferred (not a stall — this is the decision)

The ai-maestro hub session measured ZERO version-range dependents on amvcp in
the hub repo (no version pin in `lib/ecosystem-constants.ts`, absent from
`PREDEFINED_ROLE_PLUGIN_NAMES`). It did NOT scan the other ~12 fleet repos,
and nobody has checked consumers off this machine — so "not measured" is not
"none". Fixing it means changing release-GATE semantics for zero measured
consumers, which fails YAGNI. Hub TRDD-JT3U4ZVM is the same FAMILY (missing
historical twins fleet-wide) but is NOT a solved precedent: `column:
ai_review`, `implementation-commits: []`, delivery `cross-repo-issues` —
routed as issues to 9 repos, never implemented. There is no shape to copy.

## Candidate fix (hypothesis, UNTRIED — label it as such)

Move the `_push_resolver_backfill()` call to BEFORE `_git_push()`, where the
remote still holds the OLD version so G1 passes on its own terms — no gate
weakened, no guard touched. Unevaluated risks: it inverts the function's own
design comment ("a backfill of historical refs must not be able to fail a
release that is otherwise complete"), and the new version's own twin (minted
by `_release_tags()`, pushed atomically) must not be double-pushed.

## Related

- `TRDD-YY5ISKCJ` (G1 fails open on network failure — FIXED in Phase 2, 2026-08-18)
  shares the same root shape: both collapse distinguishable states into one value
  (before-push vs after-push here; no-tags vs no-network there). Cross-linked per the
  Phase-2 blindspot note. Note the G1 fix changed nothing about THIS card's ordering
  problem — an unreadable remote now fails G1 closed, but a post-push backfill still
  sees remote == local and fails for the structural reason above.

## Trigger to promote off backburner

Any fleet repo adding a version-pinned amvcp dependency, or a confirmed
off-machine consumer.

Re-measured 2026-08-25 (hub ai-maestro-e5, manifest scan across ~/Code, depth 4):
still ZERO version-range dependents — the only external reference is the
marketplace entry, which pins an exact version. Trigger unmet; card stays parked.

## Notes and lessons learned

The backfill's own `check=False` swallow makes this failure invisible unless
someone reads the publish log closely — worth remembering next time a
"non-fatal" step in a pipeline is dismissed without checking whether it is
non-fatal because it is optional, or non-fatal because someone already gave
up on it succeeding.
