# amvcp-runtime + amvcp-regex bug patterns

## Table of contents

- [v2 modal bugs](#v2-modal-bugs)
- [ve-regex bugs](#ve-regex-bugs)
- [Runtime-injected UI must inherit host palette](#runtime-injected-ui-must-inherit-host-palette)
- [Common shape & Running tests](#common-shape--running-tests)

A catalogue of bug classes found in the ai-maestro-visual-communicator-plugin runtime,
the v2 modal-comment flow, and the embedded amvcp-regex visualizer —
each entry pairs the symptom with the fix and points at the
verification test that locks the fix in place.

When extending the runtime, glance through this file before writing
hover affordances, multi-mount React widgets, keyboard handlers,
or anything that posts to the comment queue.

---

## v2 modal bugs

### v2 modal — hover-bridge

**Symptom:** Clicking the hover pill never opens the modal under a
real mouse. The pill is visible the moment you stop moving, but by
the time `mousedown` fires the pill has been hidden because the
underlying paragraph already fired `mouseleave`.

**Why:** The pill lives on `document.body`, NOT inside the
commentable element. Crossing the pointer from anchor to pill IS
"leaving the anchor" as far as the DOM is concerned. The capture-
phase `mouseleave` listener cleared `commentHoverTarget` and
`pointer-events:none` before the click could land.

**Fix:** Defer the hide on a 180 ms timer; cancel it on `mouseover`
of the pill or its descendants.
(`scripts/amvcp-runtime.js`,
`scheduleHideCommentHoverPill` + `cancelCommentPillHide`.)

**Test:** `tests/scripts/test-comment-modal.js` →
`testHoverBridgeAndClick`. Drives a real-mouse-path from anchor
to pill via `page.mouse.move(.., { steps: 8 })` and asserts the
modal opens.

---

### v2 modal — resume polling on reopen

**Symptom:** User clicks ANSWER, closes the modal before the agent
reply arrives, the orchestrator writes the reply file to disk later.
On reopen the modal shows "Waiting for Claude to reply…" forever.

**Why:** `closeCommentModal` clears `pollHandle`. `openCommentModal`
rebuilds state from `localStorage` (which has the pending agent
placeholder) but never restarts the poll loop.

**Fix:** After rendering, scan `commentModalState.turns` for the
first `role: 'agent', pending: true` turn and call
`pollForCommentReply(turn)` for it.

**Test:** `testPollingResumeOnReopen`. Posts a comment, presses
DONE, writes a reply file via the test server's `__ve-test-reply`
endpoint, reopens the thread, asserts the modal renders the reply
within 2.2 s (one poll cycle + margin).

---

### v2 modal — atomic save of pending placeholder

**Symptom:** Page refresh between ANSWER and reply arrival drops
the pending placeholder from `localStorage`, defeating the
resume-polling fix.

**Why:** `handleAnswerButton` called `saveThreadToStorage` before
pushing the pending agent turn. The save persisted only the user
turn; the pending was added immediately afterwards but not
persisted until the modal closed.

**Fix:** Push the pending FIRST, save once. One save covers both
turns atomically.

**Test:** `testAtomicPendingSave`. Reads localStorage 150 ms after
ANSWER (before any subsequent saves can have fired) and asserts
both turn 1 (committed user) and turn 2 (pending agent) are present.

---

## ve-regex bugs

### ve-regex — per-mount undo / redo history

**Symptom:** Pressing ⌘Z on regex graph A pops history pushed by
graph B. Both graphs end up displaying the wrong AST.

**Why:** `undoStack` and `redoStack` were exported from
`vendor/regex-vis/src/atom/atoms.ts` as module-level mutable arrays.
The runtime mounts a fresh Jotai store per `.ve-regex` block via
`createStore()`, but the arrays are shared at the module level —
each mount's `undoAtom` writer pushes/pops the same stack.

**Fix:** Replace the arrays with Jotai atoms (`undoStackAtom`,
`redoStackAtom`). Each `<Provider store={createStore()}>` scopes
its own copy. `pushUndoAtom`, `undoAtom`, `redoAtom` all use
`get`/`set` on those atoms.

**Test:** `tests/scripts/test-regex-panels.js` →
`testUndoRedoPerMount`. Edits R1, presses ⌘Z, asserts R1 reverts
without disturbing other mounts.

---

### ve-regex — case-insensitive Z for Cmd-Shift-Z

**Symptom:** ⌘⇧Z silently no-ops. Undo works (`⌘Z` → revert), but
redo never restores the undone state.

**Why:** `KeyboardEvent.key` reflects the *produced character*, not
the physical key. Holding Shift case-shifts the value to `'Z'`. The
upstream check `key === 'z'` matched only ⌘Z, never ⌘⇧Z.

**Fix:** Compare case-insensitively: `key === 'z' || key === 'Z'`.

**Test:** `testUndoRedoPerMount` covers both ⌘Z and ⌘⇧Z and asserts
the redoOk branch.

---

### ve-regex — shift+click extends selection

**Symptom:** The empty-state placeholder advertised "Hold shift
while clicking to extend the selection," but shift-click replaced
the selection just like a plain click.

**Why:** `vendor/regex-vis/src/graph/content.tsx` `handleClick`
ignored `event.shiftKey` and always called `selectNode(id)`.

**Fix:** New atom `toggleSelectNodeAtom` in `atom/select.ts` that
toggles a single id in/out of `selectedIdsAtom`. `Content`'s click
handler routes shift-clicks to it.

**Test:** `testShiftClickMultiSelect`. Clicks `\d`, shift+clicks
`\w` in the `\d\w\s` graph, asserts both nodes carry the selection
class.

---

### ve-regex — wide regex per-graph horizontal scroll

**Symptom:** Stress regexes (R20–R22) with SVG widths 1150–1580 px
push the page width past the viewport, producing a window-level
horizontal scrollbar. The right-most graph nodes are unreachable
without page-scrolling.

**Why:** `.ve-regex-app` was `display: flex; overflow: visible`;
the inner graph wrapper was `display: inline-block` and
unconstrained. Wide SVGs grew their parent column unbounded.

**Fix:** In `vendor/regex-vis/src/global.css`:

```css
.ve-regex-app { overflow: hidden; max-width: 100%; }
.ve-regex-app > .relative.inline-block {
  flex: 1 1 0;
  min-width: 0;
  display: block;
  overflow-x: auto;
  overflow-y: visible;
}
```

The graph wrapper now takes the remaining flex space, can shrink
below the SVG's intrinsic width, and grows its own horizontal
scrollbar when needed.

**Test:** `testWideRegexOverflow`. Asserts every stress regex has
`overflow-x: auto` and `scrollWidth > clientWidth`, AND that
`document.body.scrollWidth === clientWidth` (no page-level
horizontal overflow).

---

## Runtime-injected UI must inherit host palette

**Symptom:** Every runtime-injected UI element (Submit / Exit
floating buttons, the form-mode radio + checkbox column, the
free-text input wrappers, the Mermaid / Graphviz zoom controls
toolbar, the comment-thread modal) shipped with hardcoded colours
(`background:#ffffff`, `color:#1f1a14`, `background:rgba(15,17,21,0.82)`,
native `<input type="radio">` chrome). On a host page using a
warm-cream palette (`--bg:#fbf6ee`), or a cool-slate technical
palette (`--bg:#e6f1f5`), or any other non-white theme, the runtime
chrome jumped out as obviously alien — white pills on warm cream,
black-on-white form controls in a green editorial layout, dark
glass toolbars on a light Apple-papery diagram. Worse: the
table-form Submit button used a `currentColor` fill +
`mix-blend-mode: difference` trick that collapsed to invisible on
several palettes.

**Why:** The runtime had two themable hooks already in place
(`--ve-accent` for the hover glow, `--ve-sel-text` for selected
text colour) but no namespace for surface, fg, border, radius,
font, shadow. Each injected element rolled its own hardcoded
defaults instead of reading from a shared palette.

**Fix:** Introduced a `--ve-control-*` CSS custom-property
namespace at the top of `injectStyles()`. Every runtime-injected
element now reads its colour, surface, border, radius, font, and
shadow from these variables, with two-tier fallbacks: the runtime
variables fall back to the host page's standard palette
(`--bg`, `--surface`, `--text`, `--border`, `--accent`); only when
the host exposes neither set do they fall back to hardcoded
neutral defaults. The host page can override any one variable to
brand the runtime UI; setting `--ve-control-bg: transparent`
suppresses the runtime backgrounds entirely.

The new namespace (`scripts/amvcp-runtime.js` `injectStyles()`):

| Variable | Default | Purpose |
|---|---|---|
| `--ve-control-bg` | `var(--surface, #ffffff)` | Runtime button / control surface |
| `--ve-control-bg-hover` | mix of bg + accent at 12% | Hover surface |
| `--ve-control-fg` | `var(--text, #14110b)` | Foreground text on runtime controls |
| `--ve-control-fg-dim` | `var(--text-dim, …)` | Secondary text (status, placeholders) |
| `--ve-control-border` | `var(--border, rgba(0,0,0,0.12))` | Runtime control borders |
| `--ve-control-border-strong` | `var(--border-bright, …)` | Stronger border for glyphs / focus |
| `--ve-control-radius` | `8px` | Standard runtime corner radius |
| `--ve-control-radius-sm` | `6px` | Smaller controls (text inputs, glyph buttons) |
| `--ve-control-font` | `inherit` | Runtime button typography (host font wins) |
| `--ve-control-shadow` | floating-bar elevation | Floating UI shadow |
| `--ve-control-shadow-soft` | subtle elevation | Inline button elevation |
| `--ve-control-overlay-bg` | `color-mix(--bg 82%, transparent)` | Backdrop-blur surface for floating bar / zoom toolbar |
| `--ve-control-overlay-blur` | `blur(10px)` | Backdrop-filter intensity |
| `--ve-control-accent-fg` | `var(--ve-sel-text, #14110b)` | Forced contrast text on accent fills |

Visual fixes shipped alongside the variable namespace:

1. **Submit/Exit pair**: collapsed from two physically-mirrored
   corner buttons (top-right + bottom-left) into a single
   `.ve-floating-bar` bottom-right with a backdrop-blur surface
   tinted to `--ve-control-overlay-bg`. The two button IDs
   (`ve-submit-tr`, `ve-submit-bl`) are PRESERVED as logical
   hooks so existing tests work; the bar visually shows just
   `[Exit]` when no selections exist (the secondary slot is
   `display:none`) and expands to `[Exit] [Submit (N)]` the
   moment the user picks anything.
2. **Form-mode radio/checkbox column**: keeps the real
   `<input type="radio">` / `<input type="checkbox">` (so screen
   readers and existing tests selecting on
   `input[data-ve-control]` keep working) but visually hides it
   under a styled `<span class="ve-form-glyph">`. The glyph
   inherits its border + fill from `--ve-accent` so the control
   sits inside the host palette instead of exposing OS native
   chrome (Mac/Win/Linux defaults that look out-of-theme on every
   palette).
3. **Free-text input wrapper**: the row `<td>` containing a free-
   text input now gets a `.ve-form-text-wrap` class so the
   `<input type="text">` and `<textarea>` inside read their
   surface, colour, border, focus ring from `--ve-control-*`.
4. **Mermaid / Graphviz zoom controls**: the `.ve-graph-controls`
   toolbar now reads its surface, border, blur, and font from
   the same `--ve-control-overlay-*` variables as the floating
   bar, so the toolbar tints to the host theme instead of
   shipping a hardcoded dark-translucent surface.
5. **Table-form Submit button**: the `currentColor` +
   `mix-blend-mode: difference` collapse-to-invisible trick is
   replaced by a `.ve-form-submit` class that uses
   `--ve-accent` for the primary fill and
   `--ve-control-accent-fg` for the forced-contrast text — so
   the button is always readable on every accent hue.
6. **Decision toggles**: hardcoded `#d6d1c5` (off track) and
   `#fbfaf6` (thumb) swapped to
   `var(--ve-control-border-strong, #d6d1c5)` and
   `var(--ve-control-bg, #fbfaf6)` so toggles tint to the host
   theme; the original warm-taupe / warm-off-white defaults
   remain when the host page does not expose any palette.

**Host-side opt-out / overrides:** Setting
`--ve-control-bg: transparent` on `:root` suppresses every
runtime button background (useful when the host page wants the
runtime to disappear into its own backdrop). Overriding
`--ve-control-radius`, `--ve-control-font`, or
`--ve-control-overlay-bg` alone is enough to re-skin the floating
bar without touching the buttons. The `--ve-accent` variable
remains the single most useful brand override — every primary
control derives its accent fill from it.

**Test:** No new dedicated tests; every existing test still
selects on the same IDs (`ve-submit-tr`, `ve-submit-bl`,
`[data-ve-form-submit]`) and the same input
(`input[data-ve-control]`). All 46 dev-browser tests pass after
the fix. Visual regression confirmed via cross-palette screenshots
under `reports/visual-test/choice-tables/*-after-fix.png`.

---

## Common shape & Running tests

### Common shape

Every bug above shares one structure:

1. The runtime did the obvious thing — single-line listener,
   module-level array, strict equality check.
2. A second instance, a modifier, or a different mouse path made
   the obvious thing wrong.
3. The fix is small (1–10 lines) but unobvious without the
   reproduction.

When in doubt, write the test FIRST. Most of these were found
because a Playwright test exposed timing the manual-click test
hid. See `~/.claude/rules/browser-ui-test-techniques.md` for the
generalised techniques.

### Running the test suite

```bash
tests/run-all-tests.py
```

Output: Unicode-bordered results table, exits 0 only if all pass.
See `tests/README.md` for prerequisites.
