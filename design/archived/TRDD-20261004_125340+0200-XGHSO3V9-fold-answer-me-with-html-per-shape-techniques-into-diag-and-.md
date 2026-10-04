---
trdd-id: XGHSO3V9
title: Fold answer-me-with-html per-shape techniques into diag and choice skills
column: complete
status: archived
created: 2026-10-04T12:53:40+0200
updated: 2026-10-04T14:50:34+0200
current-owner: main-agent@autonomous
created-by: main-agent@autonomous
task-type: refactor
min-approval-requirement: none
scope: project
project-id: autonomous
assignee: main-agent@autonomous
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@autonomous
approval-datetime: 2026-10-04T12:53:40+0200
---

# Fold answer-me-with-html per-shape techniques into diag and choice skills

Follow-on of VWZSUOJM, separate proposal per review: fold adopted graphic-style techniques (flow A->B & C fan-out, sequence ==stages== and notes, ok/no/warn badge states, limits bars) into amvcp-diag-flow, amvcp-diag-time (owns sequence; amvcp-diag-sequence does NOT exist), amvcp-diag-network, amvcp-choice-tables as reference enrichments. Graphic-style only; interaction model untouched (S3.1).

## Acceptance checklist

- [x] Each of the five targets assessed against its current coverage (520db9c commit body records the per-target verdicts)
- [x] Genuine enrichments folded: sequence phase dividers (diag-time ref), ok/no/warn status vocabulary (choice-tables)
- [x] Non-folds recorded with reasons: diag-flow fan-out already first-class; diag-network no transferable technique; limits-bars has no owner — new-skill decision out of augment-only scope
- [x] Graphic-style only; interaction model untouched (S3.1)

## Approval log

- 2026-10-04T12:53:40+0200 — MANDATE issued by main-agent@autonomous (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-04T14:50:34+0200 — COMPLETE by main-agent@autonomous. Two genuine folds landed (520db9c); three targets honestly assessed as no-op with reasons in the card; augment-only scope respected..
