# Changelog

## [1.0.0] — 2026-05-08

First release under the `ai-maestro-visual-communicator` identity. Forked from
[`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer)
v0.8.0; see that project's CHANGELOG for the pre-fork history of the v0.x
selection runtime, prose / table / math / TikZ rendering, and Graphviz +
viz.js wiring on which v1.0.0 builds.

### Identity

- **Plugin renamed**: `visual-explainer` → `ai-maestro-visual-communicator`.
  Now part of the [`Emasoft/ai-maestro-plugins`](https://github.com/Emasoft/ai-maestro-plugins)
  marketplace.
- **Slash command namespace**: every `/visual-explainer:X` becomes
  `/aimvc-X`. Ten commands renamed in lock-step: `aimvc-diff-review`,
  `aimvc-fact-check`, `aimvc-generate-slides`, `aimvc-generate-visual-plan`,
  `aimvc-generate-web-diagram`, `aimvc-interactive-report`,
  `aimvc-plan-review`, `aimvc-project-recap`, `aimvc-respond-to-comment`,
  `aimvc-share-page`.
- **Repository layout flattened**. The v0.x layout shipped the plugin
  under `plugins/visual-explainer/` and a wrapper `marketplace.json` at
  the root. v1.0.0 is a single-plugin repo: `.claude-plugin/plugin.json`
  is the manifest, `commands/`, `scripts/`, `templates/`, `references/`,
  and `tests/` are siblings of `SKILL.md`. The nested marketplace is gone.
- **Author + repository**: Emasoft `<713559+Emasoft@users.noreply.github.com>`,
  source at `https://github.com/Emasoft/ai-maestro-visual-communicator-plugin`.

### v2 modal-comment threads on agent reports (new in this fork)

`/aimvc-interactive-report <report.md>` renders any agent's report as an
HTML page where every paragraph, list item, table row, and `<pre>` block
is **commentable**. The user hovers, clicks a pill, types a comment in a
right-aligned modal, and the agent (running `/aimvc-respond-to-comment
--watch --queue-dir <q> --source <report.md>` in a separate session)
writes per-turn replies into a queue dir that the page polls.

- Hover-bridge pattern (180 ms timer + cancel-on-bridge-mouseover) so the
  hover pill is physically reachable when the pointer crosses the gap from
  anchor to pill.
- Polling resume on reopen — closing the modal while a reply is
  outstanding is safe; reopening restarts the poll loop for the pending
  agent turn.
- Atomic save of pending placeholder — pushing the pending agent turn
  before `saveThreadToStorage` so a refresh between SEND and reply
  arrival preserves the pending state, defeating the data-loss window.
- Stale-state self-detection — fetches that complete after the modal
  closes (or a different anchor's thread opens) bail without crashing
  via an `ownThreadId` guard captured at poll-start.
- Per-thread `localStorage` persistence (`ve-comment-thread:<commentId>`)
  + sidecar `<report>.idmap.json` mapping `commentId → {kind, sectionId,
  text}` so the responder can dereference unknown ids without re-reading
  the source doc every round.

The full wire format and responder workflow are documented in `SKILL.md`
under "Interactive Agent Reports & Modal Comments (v2)".

### Vendored regex-vis edit-panel fixes

The embedded `vendor/regex-vis/` (regex visualizer used by
`<div class="ve-regex">`) shipped with three quietly-broken edit-panel
behaviors that v1.0.0 fixes:

- **Per-mount undo/redo history.** Module-level `undoStack` / `redoStack`
  arrays were shared across every `.ve-regex` mount on the page —
  pressing ⌘Z on graph A could pop history pushed by graph B and corrupt
  its AST. Replaced with Jotai atoms (`undoStackAtom`, `redoStackAtom`)
  scoped to each `<Provider store={createStore()}>`.
- **⌘⇧Z (redo) silently no-op.** The Shift modifier case-shifts
  `KeyboardEvent.key` from `'z'` to `'Z'`. The strict equality check
  `key === 'z'` therefore never matched the redo combo. Now
  case-insensitive.
- **Shift+click multi-select.** The empty-state placeholder advertised
  "Hold shift while clicking to extend the selection," but the click
  handler ignored `event.shiftKey` and always replaced. New
  `toggleSelectNodeAtom` toggles a single id in/out of `selectedIdsAtom`;
  Backspace removes the entire multi-selection at once.
- **Wide-regex per-graph horizontal scroll.** Stress regexes with SVG
  widths 1150–1580 px previously pushed the page width past the viewport.
  `.ve-regex-app` is now `overflow: hidden; max-width: 100%`; the inner
  graph wrapper opts back into `overflow-x: auto` and shrinks to fit.

### Formal dev-browser test suite

`tests/run-all-tests.sh` now exercises every fixed bug end-to-end via
[dev-browser]. 28 named tests across two suites:

- `tests/scripts/test-regex-panels.js` — every panel surface R1–R22,
  per-mount undo/redo (incl. ⌘⇧Z), shift+click multi-select, wide-regex
  overflow.
- `tests/scripts/test-comment-modal.js` — hover-bridge, POST round-trip,
  polling reply, polling resume on reopen, atomic pending save,
  multi-turn dialogue, draft preservation, ESC/DONE close, every
  commentable element type (`p`, `li`, `tr`, `pre`).

The orchestrator (`tests/run-tests.py`) auto-syncs the production
bundle into fixtures/, regenerates the sample report via the renderer,
boots `tests/server.py` (production endpoints + a TEST-ONLY
`/__ve-test-reply` for the QuickJS sandbox to inject reply files),
and prints a Unicode-bordered results table tolerating empty-detail
trailing whitespace.

### Hardening

- `pollForCommentReply` now captures `ownThreadId` at poll-start;
  every async continuation self-detects a stale closure (modal closed
  or different thread opened during fetch) and bails without crashing.
- `tests/server.py` validates `threadId` against `[A-Za-z0-9._-]+`
  before interpolating into queue filenames; bad payloads return 400.
- `tests/run-tests.py` cleans the queue between scripts so residue
  from one suite cannot leak into another.

### Lessons (extracted from real bug hunts)

- `~/.claude/rules/browser-ui-test-techniques.md` — 12 reusable
  techniques (real mouse paths, hover-bridge, per-instance state,
  case-insensitive Shift keys, atomic save, polling resume, bundle
  sync, test-only endpoints, ps snapshot, table format, dynamic
  targets, three-place verification).
- `references/runtime-bug-patterns.md` — catalogue of every bug class
  fixed in this codebase, paired with the regression test that locks
  the fix in place.
- `SKILL.md` — new "Interactive Agent Reports & Modal Comments (v2)"
  section integrates the full responder workflow into the skill so
  any Claude that loads `ai-maestro-visual-communicator` learns the
  answer/reply contract automatically.

[dev-browser]: https://www.npmjs.com/package/dev-browser
