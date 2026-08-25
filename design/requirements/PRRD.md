---
prrd-version: 1.8
updated: "2026-08-25T14:45:00+0200"
project: ai-maestro-visual-communicator-plugin
project-id: autonomous
require-pull-request: false
canonical-source: design/requirements/PRRD.md
mirrors: []
---

# Project Requirements & Rules

## §I. How to read this document

Rule citation form: `PRRD G<n>.<v>` or `PRRD S<n>.<v>`. See
`~/.claude/rules/prrd-design-rules.md` for the full spec.

## 🥇 GOLDEN — set by the USER (immutable to MANAGER)

- **G1.1** — Every agent that writes to GitHub (issue, comment, PR, review, discussion, release note) MUST begin the body with a one-line self-identification: 'I'm the Claude responsible for the ai-maestro-visual-communicator-plugin project.' Commit messages SHOULD carry an Agent: ai-maestro-visual-communicator-plugin trailer.

## 🥈 SILVER — MANAGER-mutable (agents propose via COS)

- **S2.1** — Exactly one visual-element skill per THING visualized; editor/viewer/exporter/gallery are facets of that one skill, never separate skills.
- **S3.1** — Interaction Design Mode (selection, triple-state normal/hover/selected feedback, comment round-trip) is FIXED and uniform across every element; imported ideas may augment the Graphic Style Mode only, never replace the interaction model.
- **S4.1** — Every visual ships BOTH light and dark themes; single-theme output is a correctness defect.
- **S5.1** — Screenshot-test every visual change in dev-browser, light and dark, before claiming done.
- **S6.1** — CPV (claude-plugins-validation) is the sole validator; clear findings by devitalize-or-remove or by filing a CPV detector issue, never by exempt/suppress.
- **S7.1** — No direct pushes; the pre-push hook permits only scripts/publish.py. Feature branches stay local awaiting the owner's merge and publish.py release.
- **S8.1** — amvcp-runtime.js is exempt from the CPV LOC cap; over-cap SKILL.md files are split into smaller focused skills, never by trimming TOCs.

