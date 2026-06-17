# Phase 2.5 contract — atom-emitting techniques

Every visual the agent emits MUST surface itself to the runtime as a click-to-select **atom**. The runtime then layers four standard affordances on top with zero per-category code:

| Affordance | Stamp on the atom | Reads | Mounted by |
|---|---|---|---|
| **3-state selection** (none → selected → hover preview) | `data-ve-id` + `data-ve-type` | Runtime CSS in `amvcp-runtime.js` | Runtime auto |
| **Comment handle** (28 px gold pill at the figure's left edge) | One+ atoms selected inside a figure | `.ve-comment-handle` class | Runtime auto |
| **Decision-mini pill** (S / A / D — Skip / Approve / Decline, 3-state) | `data-ve-id` on a row / paragraph / chart-point | `.ve-decision-mini-*` classes | Runtime auto |
| **Leader-line** (anchor in prose → visual) | `data-ve-leader-from` / `data-ve-leader-to` | `.ve-leader-line` SVG path | Runtime auto |
| **9-level multi-click for text** (paragraph → sentence → word → char etc.) | Plain prose, no extra stamp | Runtime drag-paint detector | Runtime auto |

Cross-references for the atom contract:
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — the canonical payload + selection model
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-modal-comments/SKILL.md` — the per-element comment-thread layer
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-self-debug-rules/SKILL.md` — visual verification

If a category SKILL.md tells you to emit `<figure data-ve-id="…" data-ve-type="chart">` or `<tr data-ve-id="…" data-ve-type="row">`, that is the atom contract — those stamps make the four affordances above appear automatically.
