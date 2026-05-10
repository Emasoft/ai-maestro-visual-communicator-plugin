# TRDD-5c230516-d2f4-48b2-95a4-17106e10c356 — 10-skill multi-split for ai-maestro-visual-communicator-plugin

**TRDD ID:** `5c230516-d2f4-48b2-95a4-17106e10c356`
**Filename:** `design/tasks/TRDD-5c230516-d2f4-48b2-95a4-17106e10c356-skill-multisplit.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)

**Status:** In progress (Phase A in flight; Phase B + C deferred to subsequent sessions)

## Plan content

# Plan: 10-skill multi-split for ai-maestro-visual-communicator-plugin

## Context

The `ai-maestro-visual-communicator-plugin` v1.1.9 ships a single skill
`amvcp-visual-communication` whose SKILL.md is **24,457 chars** (the CPV cap is
4,000). The current `cpv-doctor` validation flags this as a WARNING. The
plugin already has 12 reference files totalling ~286 KB but they all live
inside this one skill, so every visual ask pays the full skill-load cost.

**Why split into multiple skills (not just progressive disclosure):**

The user explicitly wants **multi-skill partitioning by scope** — splitting by
the *type of visualization* the skill handles, with **shared references at
the plugin root** for cross-cutting patterns (the comment-chat-box UI used by
multiple workflows, the selection wire format, theme/styling conventions,
etc.). This is architecturally cleaner than progressive disclosure within one
skill because:

- Each new skill loads on **distinct triggers** — Claude pulls only what's
  relevant. A LaTeX request loads `amvcp-math-and-latex`; a Mermaid request
  loads `amvcp-graph-diagrams`; a slide-deck request loads `amvcp-slide-decks`.
  No more 24K-char skill payload on every visual ask.
- Reusable patterns (comment-chat-box, atomic-write, hover-bridge, the
  selection wire format) live at plugin level so a future sub-skill that
  wants commentable elements doesn't have to copy them out of `modal-comments`.
- No information sacrificed — the full content is preserved across the new
  structure, just **owned by the right skill**.
- Each new SKILL.md naturally fits ≤4K chars because it carries only its own
  scope, not the union of every workflow.

**Outcome:** 1 monolithic skill → 1 slim coordinator + 9 focused sub-skills,
each ≤4K-char SKILL.md, with plugin-level shared references for cross-cutting
patterns. CPV WARNING for SKILL.md size goes away. The 2 other WARNINGs
(RC-DATA-INSTALLER-001, RC-PIPELINE-DRIFT-001) remain as documented
false-positives — out of scope.

---

## Final architecture

### Tree (what lands on disk)

```
${CLAUDE_PLUGIN_ROOT}/
├── .claude-plugin/plugin.json         # version bump 1.1.9 → 1.2.0
├── references/                        # NEW — PLUGIN-LEVEL SHARED
│   ├── interactive-selection-base.md  # extracted base sections from interactive-selection.md
│   ├── comment-chat-box.md            # NEW — extracted reusable UI from modal-comments.md
│   ├── css-patterns.md                # MOVED from skill folder, content unchanged
│   ├── libraries.md                   # MOVED, content unchanged
│   ├── styling-guide.md               # MOVED, content unchanged
│   ├── anti-patterns.md               # MOVED, content unchanged
│   ├── runtime-bug-patterns.md        # MOVED, content unchanged
│   └── diagram-types.md               # MOVED, content unchanged (cross-cutting catalogue)
├── skills/
│   ├── amvcp-visual-communication/    # SLIMMED main coordinator
│   │   ├── SKILL.md                   # ≤4K chars — base contract + dispatch + commands
│   │   └── references/
│   │       ├── authoring-workflow.md  # NEW — Steps 1-5 + HTML scaffold + boilerplate
│   │       ├── environment-and-runner.md  # NEW — env vars + runner CLI
│   │       ├── example-flows.md       # NEW — 4 worked examples
│   │       ├── quality-checklist.md   # NEW — pre-delivery checks
│   │       └── troubleshooting.md     # NEW — 8-case error matrix
│   ├── amvcp-graph-diagrams/          # NEW — Mermaid + Graphviz (.ve-graph)
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── mermaid-integration.md     # extracted from interactive-selection.md
│   │       └── graphviz-cookbook.md       # extracted from interactive-selection.md
│   ├── amvcp-charts-and-dashboards/   # NEW — Chart.js
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── chartjs-integration.md     # extracted from interactive-selection.md
│   ├── amvcp-math-and-latex/          # NEW — KaTeX + mhchem + TikZJax
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── math-cookbook.md           # extracted from interactive-selection.md
│   │       └── tikz-substitutions.md      # extracted from interactive-selection.md
│   ├── amvcp-choice-tables/           # NEW — table-form mode (radio/checkbox Q&A)
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── table-form-schema.md       # extracted from interactive-selection.md
│   ├── amvcp-modal-comments/          # NEW — v2/v3 agent-report flow
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── agent-report-flow.md       # extracted from modal-comments.md
│   │       └── v3-decision-toggles.md     # extracted from modal-comments.md
│   ├── amvcp-slide-decks/             # NEW — slide decks
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── slide-deck-mode.md         # MOVED, content unchanged
│   │       └── slide-patterns.md          # MOVED, content unchanged
│   ├── amvcp-share-pages/             # NEW — Vercel deploy
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── sharing-pages.md           # MOVED, content unchanged
│   ├── amvcp-prose-pages/             # NEW — article-style publishable pages
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── prose-mode.md              # extracted from interactive-selection.md
│   │       └── responsive-nav.md          # MOVED from main skill (4+ section nav)
│   └── amvcp-regex-vis/               # NEW — regex-vis vendored editor
│       ├── SKILL.md
│       └── references/
│           └── regex-vis-cookbook.md      # extracted from interactive-selection.md
└── commands/                          # UNCHANGED — slash commands stay plugin-level
    ├── amvcp-diff-review.md           # owner: amvcp-visual-communication (coordinator)
    ├── amvcp-fact-check.md            # owner: coordinator
    ├── amvcp-generate-slides.md       # owner: amvcp-slide-decks
    ├── amvcp-generate-visual-plan.md  # owner: coordinator
    ├── amvcp-generate-web-diagram.md  # owner: coordinator
    ├── amvcp-interactive-report.md    # owner: amvcp-modal-comments
    ├── amvcp-plan-review.md           # owner: coordinator
    ├── amvcp-project-recap.md         # owner: coordinator
    ├── amvcp-respond-to-comment.md    # owner: amvcp-modal-comments
    └── amvcp-share-page.md            # owner: amvcp-share-pages
```

### Per-skill triggers (frontmatter `description`)

| Skill | Primary triggers (Claude loads when…) |
|-------|----------------------------------------|
| `amvcp-visual-communication` | "make a diagram", "render as HTML", "visual explanation", proactive table threshold (4+ rows / 3+ cols), or any of the coordinator-owned slash commands |
| `amvcp-graph-diagrams` | "architecture", "flowchart", "sequence diagram", "ER", "state machine", "mind map", "class diagram", "C4", "data flow", "Mermaid", "directed graph" |
| `amvcp-charts-and-dashboards` | "dashboard", "chart", "bar chart", "line chart", "pie chart", "metrics", "KPI grid" |
| `amvcp-math-and-latex` | "render this equation", "LaTeX", "math notation", "chemistry equation", "TikZ figure", "KaTeX" |
| `amvcp-choice-tables` | "let me pick from", "comparison table where I can choose", "form to select from", "radio/checkbox list" |
| `amvcp-modal-comments` | "make commentable", "interactive report", "reply per finding", `/amvcp-interactive-report`, `/amvcp-respond-to-comment` |
| `amvcp-slide-decks` | "slide deck", "presentation", `/amvcp-generate-slides`, `--slides` flag |
| `amvcp-share-pages` | "deploy to vercel", "share this page", `/amvcp-share-page` |
| `amvcp-prose-pages` | "publishable article", "blog post", "essay with pull quotes", paragraph-numbered prose |
| `amvcp-regex-vis` | "visualize this regex", "regex editor", "regex tree" |

### Per-file ownership map (final)

| Existing file | Size | New location | Why |
|---------------|------|--------------|-----|
| `anti-patterns.md` | 4 KB | `references/anti-patterns.md` (plugin) | Slop test for every page |
| `css-patterns.md` | 45 KB | `references/css-patterns.md` (plugin) | Theme/layout/components used by all sub-skills; too cross-cutting to split |
| `diagram-types.md` | 10 KB | `references/diagram-types.md` (plugin) | 15-type catalogue used by graph-diagrams, charts, choice-tables, prose-pages |
| `interactive-selection.md` | **119 KB** | **SPLIT into 9 files** | See below |
| `libraries.md` | 22 KB | `references/libraries.md` (plugin) | CDN URLs used by graph-diagrams, charts, math-and-latex, slide-decks |
| `modal-comments.md` | 8 KB | `skills/amvcp-modal-comments/references/agent-report-flow.md` + EXTRACT comment-chat-box.md to plugin shared | Agent-report workflow specific; chat-box UI reusable |
| `responsive-nav.md` | 6 KB | `skills/amvcp-prose-pages/references/responsive-nav.md` | Multi-section nav primarily for long-form prose |
| `runtime-bug-patterns.md` | 8 KB | `references/runtime-bug-patterns.md` (plugin) | Internal/dev — for editing runtime.js, orthogonal to user skills |
| `sharing-pages.md` | 1.5 KB | `skills/amvcp-share-pages/references/sharing-pages.md` | Tiny, deploy-specific |
| `slide-deck-mode.md` | 4 KB | `skills/amvcp-slide-decks/references/slide-deck-mode.md` | Slide-decks owner |
| `slide-patterns.md` | 46 KB | `skills/amvcp-slide-decks/references/slide-patterns.md` | Slide-decks owner |
| `styling-guide.md` | 11 KB | `references/styling-guide.md` (plugin) | Aesthetics for every page |

### `interactive-selection.md` (119 KB) section-level split

The file's 22 sections distribute as follows. Each extracted file targeted ≤4 KB
where possible; a few larger ones (Mermaid integration, regex-vis) are
acceptable since they're skill-specific reference depth, not SKILL.md.

| Section in original | New owner | New file |
|---------------------|-----------|----------|
| How it works (one paragraph) | plugin shared | `references/interactive-selection-base.md` |
| Mandatory boilerplate | plugin shared | `references/interactive-selection-base.md` |
| The selection payload | plugin shared | `references/interactive-selection-base.md` |
| What to make selectable | plugin shared | `references/interactive-selection-base.md` |
| Marking elements | plugin shared | `references/interactive-selection-base.md` |
| Engine routing | plugin shared | `references/interactive-selection-base.md` |
| Runner-process pitfalls | plugin shared | `references/interactive-selection-base.md` |
| Anti-patterns | plugin shared | `references/anti-patterns.md` (already exists) |
| Inlining the runtime | plugin shared | `references/interactive-selection-base.md` |
| Future extensions | plugin shared | `references/interactive-selection-base.md` |
| **Mermaid integration** | `amvcp-graph-diagrams` | `references/mermaid-integration.md` |
| **Chart.js integration** | `amvcp-charts-and-dashboards` | `references/chartjs-integration.md` |
| **Regex visualizer + editor** | `amvcp-regex-vis` | `references/regex-vis-cookbook.md` |
| **Tables — three modes** | `amvcp-choice-tables` (form mode) + plugin shared (passive mode) | `skills/amvcp-choice-tables/references/table-form-schema.md` + section in `references/interactive-selection-base.md` |
| **When to use form vs passive** | `amvcp-choice-tables` | `skills/amvcp-choice-tables/references/table-form-schema.md` |
| **Prose mode** | `amvcp-prose-pages` | `references/prose-mode.md` |
| **Math/LaTeX** | `amvcp-math-and-latex` | `references/math-cookbook.md` |
| **Graphviz cookbook** | `amvcp-graph-diagrams` | `references/graphviz-cookbook.md` |
| **TikZJax limitations** | `amvcp-math-and-latex` | `references/tikz-substitutions.md` |
| **Directed graphs (.ve-graph)** | `amvcp-graph-diagrams` | `references/graphviz-cookbook.md` (merged with above) |
| **Slides** | `amvcp-slide-decks` | append to existing `slide-patterns.md` |

### Cross-cutting patterns extracted as new shared files

| New file | Source | Purpose | Reused by |
|----------|--------|---------|-----------|
| `references/comment-chat-box.md` | extracted from `modal-comments.md` | Modal/textarea/Send UI component, wire format, atomic-write pattern, page-side guarantees | `amvcp-modal-comments` (today); future sub-skills that want commentable elements |
| `references/interactive-selection-base.md` | extracted from `interactive-selection.md` | Selection wire format + boilerplate that EVERY skill needs to wire up clicks | All 10 sub-skills |

### Reference path conventions

In each SKILL.md or sub-skill SKILL.md, references use:

- `${CLAUDE_PLUGIN_ROOT}/references/X.md` for **plugin-level shared** refs
- `./references/X.md` (relative) for **skill-specific** refs

Example pointer in `skills/amvcp-modal-comments/SKILL.md`:
```markdown
- Read `${CLAUDE_PLUGIN_ROOT}/references/comment-chat-box.md` for the modal UI pattern.
- Read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` for the selection wire format.
- Read `./references/agent-report-flow.md` for the v2/v3 renderer + responder loop.
```

---

## Implementation steps (commit-by-commit)

Each commit is small, focused, and verifiable. Total: ~13 commits.

1. **`docs: add TRDD for 10-skill multi-split (TRDD-<uuid>)`** — write the
   TRDD at `design/tasks/TRDD-<uuid>-skill-multisplit.md` capturing this plan
   verbatim. No code changes.

2. **`refactor(skills): create plugin-level references/ folder and move 6 cross-cutting refs`** —
   move `anti-patterns.md`, `css-patterns.md`, `libraries.md`, `styling-guide.md`,
   `runtime-bug-patterns.md`, `diagram-types.md` from
   `skills/amvcp-visual-communication/references/` to `references/` at plugin
   root. Update main SKILL.md cross-references to `${CLAUDE_PLUGIN_ROOT}/references/`.
   No content changes; just file relocations + path updates.

3. **`refactor(skills): split interactive-selection.md into 8 topic files`** —
   - Create `references/interactive-selection-base.md` with the universal sections.
   - Create the 7 topic files in their target sub-skill `references/` folders
     (mermaid-integration, graphviz-cookbook, chartjs-integration, math-cookbook,
     tikz-substitutions, regex-vis-cookbook, prose-mode, table-form-schema).
   - Delete the original 119 KB file once all sections are accounted for.
   - Verify with line-by-line audit: every section in original = one section in new files.

4. **`refactor(skills): extract comment-chat-box.md from modal-comments.md`** —
   - Create `references/comment-chat-box.md` with: queue-dir contract, wire
     format, polling cycle, page-side guarantees, atomic-write pattern.
   - Trim `modal-comments.md` to the agent-report-specific content.
   - File still in main skill at this point.

5. **`feat(skills): add amvcp-modal-comments sub-skill`** — create
   `skills/amvcp-modal-comments/{SKILL.md,references/}`. Move trimmed
   `modal-comments.md` → `agent-report-flow.md`. Extract v3 toggles section
   into `v3-decision-toggles.md`. Remove modal-comment content from main
   SKILL.md, leave a single `see amvcp-modal-comments skill` pointer.

6. **`feat(skills): add amvcp-slide-decks sub-skill`** — create
   `skills/amvcp-slide-decks/{SKILL.md,references/}`. Move `slide-deck-mode.md`
   and `slide-patterns.md`. Append the "Slides" section from
   `interactive-selection.md` into `slide-patterns.md`. Trim main SKILL.md.

7. **`feat(skills): add amvcp-share-pages sub-skill`** — create
   `skills/amvcp-share-pages/{SKILL.md,references/}`. Move `sharing-pages.md`.

8. **`feat(skills): add amvcp-graph-diagrams sub-skill`** — create
   `skills/amvcp-graph-diagrams/{SKILL.md,references/}`. Already populated by
   step 3 with `mermaid-integration.md` and `graphviz-cookbook.md`. Write
   SKILL.md with Mermaid/graphviz triggers.

9. **`feat(skills): add amvcp-charts-and-dashboards sub-skill`** — create
   `skills/amvcp-charts-and-dashboards/{SKILL.md,references/}`. Step 3 moved
   `chartjs-integration.md` here.

10. **`feat(skills): add amvcp-math-and-latex sub-skill`** — create
    `skills/amvcp-math-and-latex/{SKILL.md,references/}`. Step 3 moved
    `math-cookbook.md` and `tikz-substitutions.md` here.

11. **`feat(skills): add amvcp-choice-tables sub-skill`** — create
    `skills/amvcp-choice-tables/{SKILL.md,references/}`. Step 3 moved
    `table-form-schema.md` here.

12. **`feat(skills): add amvcp-prose-pages and amvcp-regex-vis sub-skills`** —
    create both folders. `prose-pages` gets `prose-mode.md` (from step 3) and
    `responsive-nav.md` (moved from main). `regex-vis` gets
    `regex-vis-cookbook.md` (from step 3).

13. **`refactor(skills): slim main SKILL.md to ≤4000 chars + create 5 main-only refs`** —
    extract authoring-workflow, environment-and-runner, example-flows,
    quality-checklist, troubleshooting from current SKILL.md into
    `skills/amvcp-visual-communication/references/`. Trim SKILL.md to
    coordinator-only content with explicit pointers to the 9 sub-skills.
    Verify char count ≤4000.

14. **`chore(release): v1.2.0 — multi-skill split`** — bump plugin.json,
    update CHANGELOG/cliff.toml, run `/cpv-validate-plugin .` to confirm:
    - WARNING for SKILL.md size = 0 (was 1)
    - All other findings unchanged
    - All 46 dev-browser tests still pass
    - ruff + actionlint clean

---

## Critical files to modify

- `.claude-plugin/plugin.json` — version bump 1.1.9 → 1.2.0; no `skills`
  manifest needed (auto-discovery already in use)
- `skills/amvcp-visual-communication/SKILL.md` — slim to ≤4K chars
- `skills/amvcp-visual-communication/references/*.md` — 6 moved out, 5 new added
- 9 NEW `skills/amvcp-*/SKILL.md` files
- 9 NEW `skills/amvcp-*/references/*.md` files (some moved, some extracted)
- NEW `references/` folder at plugin root with 8 shared files

## Files reused / patterns preserved

- `scripts/amvcp-runtime.js` — UNCHANGED (browser runtime)
- `scripts/amvcp-select.py` — UNCHANGED (Python runner)
- `commands/*.md` — UNCHANGED (10 slash commands stay plugin-level)
- `tests/scripts/*.js` — UNCHANGED (46 dev-browser tests still target the same
  HTML/JS contracts)
- `.github/workflows/*.yml` — UNCHANGED (TRDD-5f41ad36 hardening preserved)
- `scripts/publish.py` — UNCHANGED
- All existing reference content — NOT REWRITTEN, only relocated/split (zero
  content loss)

---

## Verification (validation contract)

After all 13 commits land, run in this order:

1. **CPV strict validation:**
   ```bash
   uv run --with pyyaml python "${CPV_LAUNCHER}" plugin .
   ```
   Expected:
   - `CRITICAL=0 MAJOR=0 MINOR=0 NIT=0`
   - `WARNING=2` (only RC-DATA-INSTALLER-001 + RC-PIPELINE-DRIFT-001 remain;
     SKILL.md size warning is GONE)

2. **All 10 SKILL.md files under 4000 chars:**
   ```bash
   for f in skills/amvcp-*/SKILL.md; do
     chars=$(awk '/^---$/{c++; next} c>=2{print}' "$f" | wc -c | tr -d ' ')
     printf '%-60s %s chars\n' "$f" "$chars"
   done
   ```
   Each line should print < 4000.

3. **Dev-browser test suite:**
   ```bash
   cd tests && python3 run.py
   ```
   Expected: 46/46 PASS, no regressions.

4. **Lint suite:**
   ```bash
   ruff check . && (cd .github && actionlint workflows/*.yml)
   ```
   Expected: all clean.

5. **Manual skill activation smoke test** — open Claude Code in this repo,
   issue these prompts and verify the right sub-skill loads (visible via the
   skill activation indicator):
   - "Render this LaTeX equation: ∫f(x)dx" → `amvcp-math-and-latex`
   - "Make a flowchart of the auth subsystem" → `amvcp-graph-diagrams`
   - "Let me pick from these 3 caching strategies" → `amvcp-choice-tables`
   - "Render this audit report so I can comment on each finding" →
     `amvcp-modal-comments`
   - "Turn this plan into a slide deck" → `amvcp-slide-decks`
   - "Visualize this regex" → `amvcp-regex-vis`
   - "Make this article look like a publishable essay" → `amvcp-prose-pages`
   - "Show me a dashboard with these metrics" → `amvcp-charts-and-dashboards`
   - "Deploy this page to Vercel" → `amvcp-share-pages`
   - "Make me a diagram about X" (generic) → `amvcp-visual-communication`
     (coordinator)

6. **Cross-reference integrity** — grep for all `${CLAUDE_PLUGIN_ROOT}/` and
   `./references/` paths in every new SKILL.md; verify each path resolves to
   an existing file.

---

## Out of scope (NOT touched in this work)

- `RC-DATA-INSTALLER-001` WARNING — false positive for zero-deps plugin;
  user will handle with `cpv.installer_severity: "off"` override in a
  separate commit.
- `RC-PIPELINE-DRIFT-001` WARNING — pipeline files drifted **beyond**
  canonical (TRDD-5f41ad36 hardening). Documented "hardened beyond canonical."
- The empty `templates/` folder — SKILL.md mentions `templates/architecture.html`
  etc. but they don't exist. Separate cleanup task; not blocking.
- Any change to `commands/*.md` — slash commands stay at plugin level,
  unchanged.
- Any change to runtime/server (`scripts/amvcp-runtime.js`,
  `scripts/amvcp-select.py`) — pure documentation/skill restructure.
- Pipeline files (`.github/workflows/*`, `cliff.toml`, `.markdownlint.json`,
  `publish.py`) — unchanged.

---

## Dispatch strategy

This is a multi-file architectural refactor with **zero content loss** as a
hard requirement. Best executed by:

1. **Phase A (commits 1-4):** dispatch `claude-plugin:plugin-architect` agent
   to do the foundational extractions (TRDD + shared refs + interactive-selection
   split + comment-chat-box extraction). Architecture-heavy work; needs the
   full plugin context.

2. **Phase B (commits 5-13):** dispatch `claude-plugins-validation:plugin-fixer`
   (or 9 parallel `claude-plugin:create` calls) to scaffold each sub-skill.
   Each sub-skill is small + isolated, so parallelizable.

3. **Phase C (commit 14):** orchestrator does the version bump + final
   validation + commit (small + needs human sign-off on version bump).

DERIVED: each commit needs to verify SKILL.md char count BEFORE landing
(via the verification step #2 script above) — automate as a pre-commit
helper or add to plugin-fixer agent's verification loop.
