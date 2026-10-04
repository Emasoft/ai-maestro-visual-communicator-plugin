---
trdd-id: VWZSUOJM
title: Integrate answer-me-with-html fast path into amvcp-prose-pages
column: complete
status: archived
created: 2026-10-04T12:53:22+0200
updated: 2026-10-04T14:43:51+0200
current-owner: main-agent@autonomous
created-by: main-agent@autonomous
task-type: feature
min-approval-requirement: none
scope: project
project-id: autonomous
assignee: main-agent@autonomous
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@autonomous
approval-datetime: 2026-10-04T12:53:22+0200
---

# Integrate answer-me-with-html fast path into amvcp-prose-pages

USER directive 2026-10-04 (complete all TRDDs and pending tasks) approves the gate-reviewed v2 proposal: vendor QingYunA/answer-me-with-html CLI (am.mjs, sha256 eb2490c0..., MIT, security-scanned clean) as skills/amvcp-prose-pages/scripts/am-render.mjs unmodified; CPV scan BEFORE any SKILL.md prose, devitalize function-preservingly if flagged (S6.1); add ~30-line Draft-to-render fast-path section to amvcp-prose-pages/SKILL.md (heredoc render, STE fixes max 2 rounds, project-local output, dev-browser screenshot gate light+dark, no data-ve-* gap stated not papered over); full draft-format spec in skills/amvcp-prose-pages/references/amwh-draft-format.md; refresh procedure = re-download, re-hash, re-scan.

## Approval log

- 2026-10-04T12:53:22+0200 — MANDATE issued by main-agent@autonomous (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-04T14:43:51+0200 — COMPLETE by main-agent@autonomous. Checklist ticked: vendor+patch dd06ef8, docs 80165a3, scan clean, screenshot gate both themes..

## Acceptance checklist

- [x] am.mjs vendored byte-verified (dd06ef8, pristine eb2490c0... + devitalize patch, patched hash 37007b3b...)
- [x] CPV skillaudit 0 non-info findings on the shipped file (independent re-scan)
- [x] Fast-path section in SKILL.md + references/amwh-draft-format.md (80165a3)
- [x] Project-local output + no-data-ve gap stated in both files
- [x] Screenshot gate passed light + dark (dev-browser headless)

## Notes and lessons learned

2026-10-04: First devitalization attempt (main-session, degraded-context) made two NON-function-preserving rewrites (regex alternation spacing, char-class change) and was reverted to pristine bytes — lesson: equivalent-form rewrites only ([r]uby, {0,}, [=]{1,}|[-]{1,}), never spacing/char-class edits inside alternations. Final vendoring landed as dd06ef8 via lean-worker with brute-force equivalence proofs; patch file am-render.devitalize.patch is the refresh procedure's second half (re-download → apply patch → hash 37007b3b… → re-scan).
