---
name: architecture
description: "how does amvcp (the ai-maestro-visual-communicator-plugin) work — overview, the one-skill-per-thing palette, the runtime + selection round-trip, DESIGN.md theming, where the key pieces live; artifact reported delivered but nothing on screen (panel delivered=0 is a drop); TRDD link renders as plain text in the doc-wiki"
ocd: 2026-06-14
lmd: 2026-06-14
metadata:
  node_type: memory
  type: project
  tier: hub
  functionality: architecture
  globs: ["skills/**", "scripts/**", "commands/**", "agents/**"]
---
amvcp gives an agent a palette of **visual-element skills**; each generates a
self-contained, interactive HTML artifact. The axis of uniqueness is THE THING a
skill visualizes (a report, a diff, a chart, a kanban, a slide deck, …) — exactly
one skill per thing, never a mode-variant ("editor"/"viewer"/"exporter" are
facets every element already has, not separate skills). Every element is — by
design — Editable · Commentable · Compilable · Stylizable · Pickable · Exportable.
Composition is by nesting HTML+SVG primitives (SVG is a superset of HTML via
`<foreignObject>`), never a bespoke combined component per request.

## Parts map
- **Runtime** — `scripts/amvcp-runtime.js` (one DOM scan inits every element type
  on the page; exempt from the CPV LOC cap). 
- **Selection round-trip** (the universal edit channel) — `scripts/amvcp-select.py`
  → `{selections:[…]}` JSON → Claude re-emits. Reuse it; never reinvent per-skill.
- **Theming** — DESIGN.md tokens drive the *Graphic Style Mode* (palette, scale,
  spacing, motion); always ship light + dark.
- **Two modes** — *Interaction Design Mode* is FIXED (select → triple-state
  feedback → comment/edit → re-emit, uniform across every element); *Graphic
  Style Mode* is VARIABLE (DESIGN.md-driven).


^ATOM-LDU7-XXK8 [desc:"amvcp-panel-push.py: optional side-panel delivery whose absence is exit 0, but whose delivered=0 is a DROP, not a success", keywords: artifact_says_delivered_but_nothing_is_on_screen delivered_0_from_the_panel panel_unavailable_exit_0 amvcp_side_panel_delivery aimaestro-panel.sh_first_caller optional_harness_integration panel_no-target artifact_dropped_not_queued, type: reference, ocd: 2026-08-12, lmd: 2026-08-12]

`scripts/amvcp-panel-push.py` delivers a generated `.html` to the AI Maestro dashboard side panel through the frozen skill-facing CLI `aimaestro-panel.sh` (never `/api/*`), and amvcp is its FIRST caller — the CLI had zero callers before (Emasoft/ai-maestro#132). Two axes govern its behaviour and they are deliberately OPPOSITE. Absence is normal: no CLI on PATH prints `panel: unavailable` and exits 0; no resolvable target prints `panel: no-target` and exits 0 — because amvcp is a UNIVERSAL standalone plugin and ai-maestro depends on amvcp, not the reverse. Presence is strict: once the CLI exists and a target is known, a delivery problem is a real failure with a non-zero exit. Critically `delivered: 0` is NOT success — the panel is a LIVE SURFACE, not a queue, so zero means no dashboard had that channel open and the artifact was DROPPED, never stored; `delivered_count()` therefore also distinguishes None (unparseable / key absent) from 0 and refuses to treat an unknown count as delivered. Discovery is PATH-only via `shutil.which` on purpose: ai-maestro installs to `~/.local/bin`, and hardcoding an absolute path would both break other machines and silently promote an optional integration into a required one. amvcp never handles a credential — the CLI reads `AID_AUTH` / `AIMAESTRO_SUDO_TOKEN` from the environment itself. [^1]


^ATOM-WDOE-6I0R [desc:"the doc-wiki builder renders TRDDs/PRRD/wikimem into one self-contained html, but its cross-link tokenizer is hex-only and misses base36 TRDD ids", keywords: doc-wiki_cross_link_not_clickable TRDD_reference_renders_as_plain_text_in_the_wiki base36_TRDD_id_not_linked docwiki_build_script TRDD-9GUATJL7_no_link hex_only_token_regex amvcp-docwiki-build, type: reference, ocd: 2026-08-12, lmd: 2026-08-12]

`scripts/amvcp-docwiki-build.py` (TRDD-103a53e0) scans `design/tasks/TRDD-*.md` plus an optional PRRD and optional wikimem note dirs, parses the grep-friendly v2 frontmatter with NO yaml dependency, converts markdown with a small pure-python renderer, and emits ONE self-contained `.html` driven by the inlined shell `scripts/amvcp-docwiki.js`. Stdlib only, no network. It HTML-escapes all doc text so the wiki can never execute markup embedded in a doc, and it carries a synthetic `_other` column bucket so a TRDD whose column cannot be determined is still listed rather than silently dropped. DEFECT (measured 2026-08-12): its cross-link tokenizers are `\bTRDD-([0-9a-f]{8})` and `#([0-9a-f]{8})` — LOWERCASE HEX ONLY, with no `re.IGNORECASE` and no base36 class — but the current TRDD id scheme is 8-char UPPERCASE base36 (`A-Z0-9`). Probed live: `TRDD-503fb3af`/`1627a698`/`371558fd` match, `TRDD-9GUATJL7` does NOT. Every TRDD minted under the current scheme therefore renders as inert plain text instead of a link, silently — the same `_other` defensiveness that protects the column path has no counterpart on the id path. [^2]

## Applies to
- (radiates down to component/aspect pages as they are written — e.g. a
  per-element page, the publish pipeline page; wire the reciprocal `## Governed by`)

## See also
- (lateral links to other functionality hubs, once they exist)

## Notes and lessons learned

[^1]: [id:ATOM-NLHC-6QCQ, status:valid, desc:"a live delivery surface has no queue, so a zero/unknown count must fail loudly rather than read as success", keywords:"reported_delivered_but_the_user_sees_nothing zero_count_treated_as_success live_surface_has_no_queue silent_drop_on_a_push_target unknown_count_assumed_delivered", ocd:2026-08-12, lmd:2026-08-12] DO NOT treat a `delivered: 0` — or an unparseable/absent count — from a LIVE delivery surface as success, BECAUSE a live surface has no queue: zero listeners means the artifact was dropped on the floor, and calling that "delivered" leaves the user believing something is on screen when nothing ever received it. DO fail loudly, print the artifact's path so the work is still reachable, and keep the `status` pre-check that turns a silent drop into an up-front answer.
[^2]: [id:ATOM-2ALZ-4E5Z, status:valid, desc:"an id-format change must be swept through every consumer regex, and a link that silently renders as text is invisible to tests", keywords:"id_scheme_changed_and_consumers_still_match_the_old_shape hex_regex_outlives_a_base36_id cross_link_silently_renders_as_plain_text no_error_when_a_token_fails_to_match sweep_every_regex_after_an_identifier_format_change", ocd:2026-08-12, lmd:2026-08-12] DO NOT change an identifier's FORMAT (uuid-hex to base36) without grepping every consumer regex in the same change, BECAUSE a tokenizer that no longer matches does not raise — it emits the token as ordinary text, so the wiki still builds, every test still passes, and the loss shows up only as links a human notices are missing. DO sweep for the old character class (`0-9a-f`, `0-9a-fA-F`) whenever an id scheme changes, and prefer a shared id pattern constant over the same class re-typed at six call sites.
