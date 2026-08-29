---
trdd-id: LSHTWMTU
title: Resolver-tag backfill can never pass gate G1 because it runs after the release push
column: backburner
created: 2026-08-16T16:20:38+0200
updated: 2026-08-29T23:45:00+0200
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

Historical twins never reach the remote, so a version-constrained dependent
cannot resolve old amvcp releases. The publish log's own line "the next publish
retries the backfill" is misleading — the retry is guaranteed to fail too.

MEASURED on the remote 2026-08-29 (`git ls-remote --tags origin`), which also
CORRECTS this section's previous range of `v0.1.0`..`v1.4.0`:

    plain release tags          33   (v1.0.0 … v1.5.2)
    resolver twins present       3   (1.5.0, 1.5.1, 1.5.2)
    twins MISSING               30   (1.0.0 … 1.4.0)

The gap is 1.0.0..1.4.0, exactly 30. No `v0.x` TAG or RELEASE exists — absent
from `git ls-remote --tags`, from the CHANGELOG (earliest `## [1.0.0]`), and
from `gh release list` (32 releases, 0 drafts, earliest v1.1.0; note tags and
releases are NOT in lockstep — v1.0.0 has a tag but no release).

A 0.x VERSION did exist, though, and an earlier revision of this section wrongly
said otherwise. `git log -S'"version": "0.'` over the manifests — the only check
here that does not key on tags — finds it: before `f30ee55` (`chore: rebrand to
ai-maestro-visual-communicator (v1.0.0)`) this plugin was
`visual-explainer-marketplace` at **0.7.1**. So the pre-1.0 era is real; what
never existed is a 0.x tag. Measured on the remote: every tag is one of exactly
two shapes, `v<N>` or `ai-maestro-visual-communicator-plugin--v<N>` — zero
old-name tags, zero 0.x tags of either shape.

Why that costs the backfill nothing, stated carefully because the obvious
argument is circular: it is NOT "a twin is `{plugin-name}--v{version}` and no
0.7.1 tag exists to carry one". The resolver filters by the DEPENDENT's declared
name, not by ours — so a dependent that declared `visual-explainer-marketplace`
at `^0.7.0` would look for `visual-explainer-marketplace--v0.7.1`, and the
absence of that tag would BE the failure, not the reason there isn't one. The
real safety is the promote trigger's own measurement: ZERO version-range
dependents exist, by two independent scans, and neither scan found the old name
pinned anywhere either. The rebrand widens the set of names a dependent could
have declared; it does not change that nothing declares any of them.

Recorded because the reasoning failed before the conclusion did: three sources
agreeing (tags, CHANGELOG, releases) looked like independent confirmation, but
CHANGELOG is generated from tags and a release hangs off one, so all three go
silent together on a deleted tag. They establish "no v0.x now", never "no v0.x
ever" — and the manifest history, which is genuinely tag-independent, says the
stronger claim was false.

The counts come from `comm` over two LC_ALL=C-sorted lists. Stated because the
first attempt used `sort -V`, which made `comm` print "input is not in sorted
order" — its output is untrustworthy after that warning even when the total
happens to look right, and 30 is only reported here because the re-run was
clean.

This is also the first production evidence that the FORWARD fix works: every
release from v1.5.0 on has its twin on the remote. That is the part GitHub
issue #8 asked for, and it is done — `_release_tags()` mints the new version's
twin and pushes it atomically with the release. Only the historical backfill,
the subject of this card, is outstanding.

## Why deferred (not a stall — this is the decision)

The ai-maestro hub session measured ZERO version-range dependents on amvcp in
the hub repo (no version pin in `lib/ecosystem-constants.ts`, absent from
`PREDEFINED_ROLE_PLUGIN_NAMES`). It did NOT scan the other ~12 fleet repos,
and nobody has checked consumers off this machine — so "not measured" is not
"none". Fixing it means changing release-GATE semantics for zero measured
consumers, which fails YAGNI. Hub TRDD-JT3U4ZVM is the same FAMILY (missing
historical twins fleet-wide) but is NOT a solved precedent: delivery
`cross-repo-issues` — routed as issues to 9 repos, `implementation-commits:
[]`, never implemented. There is no shape to copy.

Its `column:` is deliberately NOT asserted here. The hub repo is not present
on this machine (`find ~/Code -iname '*JT3U4ZVM*'` → nothing, 2026-08-29), so
no amvcp session can verify it firsthand. This card previously stated
`ai_review`; the hub session ai-maestro-d7 reported `blocked` on 2026-08-29.
Both are second-hand from here, and the newer one is at least sourced from the
session that owns the file — but neither is a fact this repo can stand behind,
and the distinction matters to whoever picks the card up (a blocked card and a
card awaiting review need different things). Read it from the hub, do not trust
a copy in this file. What IS load-bearing and independently checkable is the
sentence above: no implementation commits, so nothing to copy.

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

Re-measured again 2026-08-29, two independent passes, still ZERO:
- amvcp (this session): recursive grep for `ai-maestro-visual-communicator`
  across `~/Code` over `package.json` / `plugin.json` / `*.ts` / `*.toml`,
  node_modules excluded. Every hit is either a SELF-reference inside this repo
  or the marketplace entry, which carries `"version": "1.4.0"` — an exact pin,
  not a range. (Noted in passing, not this card's problem: that entry is stale
  against the shipped 1.5.2.)
- hub ai-maestro-d7: grep across its `lib/` `scripts/` `.claude/` filtered to
  version-shaped context (`^` `~` `>=` `<`, `version`, `dependenc`) → zero
  hits; 17 files mention the plugin, none as a pinned dependency.

d7 states the honest limit of its own half, and it is the limit that matters:
that pass covers the HUB repo, not every fleet repo — a pin living in another
plugin's own manifest would not appear in it. The amvcp pass above is the wider
one (all of `~/Code`), and it is still bounded by this machine. So the claim
this card rests on is "no dependant found on this machine, by two independent
scans", NOT "none exists". Trigger unmet; card stays parked.

## Notes and lessons learned

The backfill's own `check=False` swallow makes this failure invisible unless
someone reads the publish log closely — worth remembering next time a
"non-fatal" step in a pipeline is dismissed without checking whether it is
non-fatal because it is optional, or non-fatal because someone already gave
up on it succeeding.
