---
name: publish-gate-and-release-invariants
description: "plugin dependency reports no git tag satisfying range on a repo full of tags; CHANGELOG.md shows only one release after publishing; publish.py tags, git-cliff, resolver tag, release gates"
ocd: 2026-08-08
lmd: 2026-08-08
metadata:
  node_type: memory
  type: reference
  tier: component
---

# publish-gate-and-release-invariants

See also [[test-suite-flakes-are-host-load]] — the G4 browser gate is the one
release gate that fails for reasons that have nothing to do with the release.


^ATOM-K4DO-E7XL [desc:"every release needs the {name}--v{version} twin or dependents cannot resolve it", keywords: no_git_tag_satisfying plugin_uninstallable dependency_resolver_tag double_hyphen_tag plugin-name--v_version, ocd: 2026-08-08, lmd: 2026-08-08]

Every amvcp release must carry TWO refs: `v{version}` and `{plugin-name}--v{version}` (DOUBLE hyphen). Since Claude Code 2.1.110 a version-constrained plugin dependency resolves by listing this repo tags, keeping ONLY the `{name}--v{version}` form and taking the highest that satisfies the range; the plain `v{version}` tag is ignored entirely, so a repo full of tags still reports "no git tag satisfying <range>". amvcp shipped 6 releases with ZERO resolver tags and nobody noticed, because the failure is silent from BOTH sides: nothing breaks here, and an already-installed dependent keeps working, so it only surfaces the first time someone new installs. scripts/publish.py now emits both in one --atomic push (_release_tags) and backfills historical releases (_push_resolver_backfill) so a future ^1.3.0 resolves 1.3.6 rather than nothing. [^1]

## Notes and lessons learned

[^1]: [id:ATOM-64OS-3Z08, status:valid, keywords:"changelog_only_has_one_release CHANGELOG.md_overwritten git-cliff_unreleased history_disappeared release_notes_missing", ocd:2026-08-08, lmd:2026-08-08] DO NOT pass `--unreleased` to git-cliff alongside `--output`, BECAUSE `--unreleased` scopes the render to not-yet-released commits and `--output` overwrites, so every publish leaves a CHANGELOG.md containing ONLY the release just made — amvcp had 6 tagged releases and 1 section, and the same defect was measured fleet-wide (one repo: 1 section against 381 releases). DO render the full history (`git-cliff --bump --tag <v> --output`), and note this class of bug survives indefinitely because the source of truth (the commit log) is undamaged, so every automated gate stays green while only the artifact a human reads is destroyed.
