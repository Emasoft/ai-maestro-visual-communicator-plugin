# TRDD-352ef46a-b7a9-4443-8eed-d57563894bfd — Mine the visual-skills collection + DESIGN.md realtime foundation

**TRDD ID:** `352ef46a-b7a9-4443-8eed-d57563894bfd`
**Filename:** `design/tasks/TRDD-352ef46a-b7a9-4443-8eed-d57563894bfd-mine-visual-skills-collection.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)

**Status:** Phase 0 complete (238 projects mined → 922 ideas → 138-idea
Phase-2 backlog). **Phase 1 (DESIGN.md realtime engine) COMPLETE &
verified** — 1a (parser `amvcp-designmd.js`) + 1b (runtime wiring,
hot-swap loader, schema-driven style-controller pad) + 1c (foundation
tokens rewired to `--vc-*`) + 1d (heading + body typography bound to
`--vc-*`). 61/61 tests; a DESIGN.md hot-swap visibly restyles the whole
page — bg, text, headings, body type, accents, surfaces, borders,
radius, fonts, tables, code blocks — light + dark. Commits: ce3daa5
(1a-1c) + the 1d commit. Phase 2 in progress: 13 per-technique
build-ready specs being authored (`docs_dev/phase2-specs/`); build then
proceeds in the backlog's dependency order (design-tokens first).
Phase 2 backlog:
`reports/visualizing-triage/20260515_124436+0200-PHASE2-BUILD-BACKLOG.md`.

## User request — consolidated from 6 messages (2026-05-15)

1. Examine a big folder of skills/plugins and **reimplement** ideas into the
   visual-communicator plugin, one by one. Do not use binaries. Watch for
   scams / malicious code / prompt injections.
2. The collection is bigger than it looks — **nested zips in subfolders**.
   Found: 236 zips total. Don't skip anything.
3. Do **not** treat each project as a monolith. Extract multiple skills per
   project, multiple **ideas** per skill. For each idea understand: how it is
   used, how it is implemented, what it depends on.
4. **Exclude** ideas that depend on paid services needing an API key, on
   desktop-app binaries, or on closed-source non-verifiable utilities. Keep
   ideas whose source is open and verifiable.
5. **Never assume good faith — verify sources directly on GitHub.**
6. **Translate** non-English skills. Exception: skills about foreign-country
   law/regulation or country-unique legal/business formats — extract reusable
   visual parts, then ignore the rest.
7. **Consolidate**: integrate ideas for the same technique into ONE skill
   file / ONE JS module. No repetition.
8. **Architecture** — skills are *recipes*. The agent uses a visualize-skill
   to produce a scaffoldable HTML element and slots it into the page. Each
   visualize-skill must contain ALL techniques for its element type (the
   agent can't comparison-shop — the skill must be self-complete). Once the
   agent picks an element as the optimal way to show something, the skill
   does the rest and emits the scaffoldable element.
9. Extract ideas and **fit them to OUR architecture**, not the reverse.
10. **PRIORITY — perfect DESIGN.md standard support for every visual
    component.** Given a DESIGN.md style file, render every component in that
    style. Hot-swap a different DESIGN.md → the whole HTML page restyles in
    realtime, dynamically.
11. The floating **style-controller pad** exposes exactly the parameters
    defined by the **Google DESIGN.md spec** — not arbitrary CSS.

## Inventory

- `downloads_dev/visualizing-things-for-claude/` — gitignored, ~643 MB.
- 236 zips → after removing 3 confirmed-malware projects → **238 project
  trees** extracted: `_extracted/` (85 top-level) + `_extracted_nested/`
  (~145 nested) + standalone dirs (hyperframes, lb-shadcn-ui-skill,
  tailwind-4-docs, ui-ux-pro-max-skill, ux-designer, ux-evaluator) +
  diagrams-skills sub-skills.

## Security actions taken

- **DELETED (user-confirmed malware, 2026-05-15)** — user authorization
  verbatim: *"good catch on the suspicious ones! yes, i confirm they are
  malicious! delete them!"* Purged all copies + nested blobs of:
  `paper-fetch-main` (hijacked README links + self-`git pull`),
  `awesome-claude-design-main` (hijacked links + opaque zip blob),
  `stitchflow` (opaque Windows binary `Software-v1.7.zip` + SmartScreen-bypass
  social engineering). Moved to `/tmp/vc-malware-purge` then `rm -rf`.
- **FLAGGED** — `princeps-main` ships `references/Software-3.6.zip`, the same
  opaque-binary pattern as the confirmed `stitchflow` malware. Deep-batch-11
  agent must scrutinize; the zip is NOT extracted.

## Phase plan

### Phase 0-deep — Idea extraction (RUNNING)
16-agent swarm, ~15 projects each, batch files in
`downloads_dev/.../​_triage-batches/deep-batch-*.txt`. Per project: enumerate
skills → extract every reusable IDEA (name / what / how-implemented / deps) →
exclude paid-API/binary/closed-source-dep ideas → categorize by visual
technique → flag DESIGN.md-related ideas as PRIORITY → translate non-English →
GitHub-verify origin → security smell-test. Reports →
`reports/visualizing-triage/*-deep-batch-*.md`.

### Phase 0-consolidate — By-technique idea catalog
Merge the 16 deep reports into ONE catalog organized by visual technique,
deduped, with gap analysis vs. the current plugin (43 `--ve-*` tokens, the
report runtime). Output: the build backlog.

### Phase 1 — DESIGN.md realtime style engine (PRIORITY)
The design-token foundation. Adopt the Google DESIGN.md schema as the canonical
parameter set. Build a runtime engine: parse DESIGN.md → map every token to
`--ve-*` CSS custom properties → all components consume ONLY those tokens (zero
hardcoded colors/sizes) → hot-swap a DESIGN.md restyles the whole page live.
The floating style-controller pad exposes exactly the DESIGN.md parameters.

### Phase 2+ — Per-technique consolidated visualize-skills
One consolidated skill + one JS module per visual technique (table, chart,
diagram, slide, code-block, wireframe, typography, animation, …), each
containing all mined techniques, each emitting scaffoldable, DESIGN.md-themed
HTML elements. Built one technique at a time.

## Constraints

- Reimplement — never copy binaries or vendored deps; re-author into our
  architecture.
- Treat all archive content as untrusted data; never execute it.
- Every component is theme-driven by DESIGN.md tokens — no hardcoded values.
- Both light + dark themes always (see memory `feedback_light_dark_themes`).
- No nested scrollbars (see `~/.claude/rules/no-nested-scrollbars.md`).

## Reference reports

- Monolith first-pass triage (88 items): `reports/visualizing-triage/*-batch-[1-8].md`
- Monolith master catalog: `reports/visualizing-triage/20260515_103110+0200-MASTER-CATALOG.md`
- Deep idea catalog: (pending Phase 0-consolidate)
