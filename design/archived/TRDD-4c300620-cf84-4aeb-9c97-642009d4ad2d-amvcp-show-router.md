# TRDD-4c300620-cf84-4aeb-9c97-642009d4ad2d — amvcp-show smart router + 6 fixes

**TRDD ID:** `4c300620-cf84-4aeb-9c97-642009d4ad2d`
**Filename:** `design/tasks/TRDD-4c300620-cf84-4aeb-9c97-642009d4ad2d-amvcp-show-router.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)
**Status:** COMPLETED — Done (2026-05-18 — all 6 fixes + amvcp-show router committed; tests
360/360); re-verified on 2026-08-20 (commits d586446 + 2bd1f32, `skills/amvcp-show/scripts/
dispatch.py` on disk) and archived.
**Created:** 2026-05-18
**Owner:** Emasoft

## Context

The previous session's `/amvcp-visual-communication` invocation on the
Symphony-vs-AMOA markdown report produced a hand-authored dashboard
that **reinterpreted** the source content (KPI cards, scoreboard
tables, etc.) instead of preserving it verbatim. The user identified
six concrete violations:

1. **Content reinterpreted.** The fundamental amvcp contract is "add
   things, never remove things." The page should have been routed
   to `amvcp-interactive-report` (preserves every paragraph / table
   / list / code-block) and AUGMENTED with interaction affordances,
   not rebuilt from cherry-picked facts.

2. **Hover glow on atoms missing.** The runtime's
   `filter: drop-shadow(0 0 4px var(--ve-accent))` was either
   invisible or overridden. Likely culprit: my Tier 4
   `.ve-stat:hover` rule added its own `box-shadow + translateY`
   which visually drowned the runtime's softer drop-shadow. Per R29,
   the 3-state selection visual ALWAYS overrides DESIGN.md palette —
   page-CSS `:hover` rules on selectable atoms violate that contract.

3. **Tier 0 corner-button row missing.** The four corner buttons
   `[🌙][📸][🖨️][🎨]` did not appear. Root cause unconfirmed but
   most likely: the runtime's `_ensureCornerControlsRow()` ran but
   the buttons rendered behind / under the hero section (clipped),
   OR one of the four script tags failed to load and bootEverything
   never completed.

4. **Safari was launched.** `amvcp-select.py` launches Chromium /
   default browser unconditionally. When iTerm is detected
   (`$TERM_PROGRAM=iTerm.app`), the page MUST land in a split pane
   in the current iTerm tab (via `amvcp-iterm2-preview` or
   equivalent). Spawning a browser when iTerm is available is a
   UX violation.

5. **Theme is horrible.** The `product-dashboard` preset (Tier 1)
   needs a second pass: indigo is too aggressive, Manrope at
   weight-400 reads as thin, and the gradient title looks
   corporate-templated. Suggested fixes: drop accent saturation,
   bump body weight to 500, drop the gradient-text rule for
   headings (it's anti-slop on second look).

6. **No 3-state accept/reject controls on findings.** The page
   used the v2 multi-select contract (click toggles atom in/out of
   selection set). For an agent **report**, each finding needs a
   per-finding `[Accept] / [Reject] / [Comment]` 3-state radio
   plus a textarea. The current `amvcp-interactive-report`
   renderer ships the textarea but not the 3-state.

## Goals

- **Build `amvcp-show`** — a smart-router skill that takes ANY
  input (file path, URL, plain text) and intelligently dispatches
  to the correct sub-skill of `ai-maestro-visual-communicator-plugin`.
  Always uses iTerm split-pane when iTerm is detected; always
  preserves source content for markdown reports; never reinterprets.
- **Fix the six violations** above as a precondition for `amvcp-show`
  doing the right thing on a real input.

## Routing matrix (the heart of amvcp-show)

| Input shape | Detection cue | Routes to | Why |
|---|---|---|---|
| `.md` / `.markdown` file | extension + heading scan | `amvcp-interactive-report` | Preserves every word; adds per-finding 3-state + textarea |
| `.html` file | extension | (no dispatch — open as-is) | Already a rendered page |
| `.py` / `.ts` / `.js` / `.go` / `.rs` / `.java` / `.cpp` etc. | code extension | `amvcp-prose-pages` with `data-ve-code` blocks | Code highlight + line-level commenting |
| `.svg` / `.png` / `.jpg` / `.webp` | image extension | `amvcp-prose-pages` with image wrapper + hotspot affordance | Visual annotation |
| `.csv` / `.tsv` / `.json` array of objects | content sniff | `amvcp-charts-and-dashboards` | Auto-chart appropriate type |
| `.json` non-array | content sniff | `amvcp-prose-pages` (pretty-printed JSON code-block) | Read-only inspection |
| URL (`http(s)://...`) | starts with http | fetch → recurse on content type | Treat as remote file |
| Mermaid source (`graph TD` etc.) | first non-blank line | `amvcp-graph-diagrams` | Diagram render |
| Regex source (`/.../flags` or matches regex syntax) | content sniff | `amvcp-regex-vis` | Visualizer |
| LaTeX source (`\documentclass`, `\begin{...}`) | content sniff | `amvcp-math-and-latex` | KaTeX/TikZ |
| Plain text idea (no file path) | not a path | `amvcp-visual-communication` (the original coordinator) | Author from scratch |
| Argument is `--diff` or path looks like `.diff`/`.patch` | extension or flag | `amvcp-diff-review` | Side-by-side diff |
| Slides marker (`---` between blocks of markdown) | content sniff | `amvcp-generate-slides` | Slide deck |
| `(skill, args)` two-token form | explicit | call that sub-skill directly | Power-user escape hatch |

When no rule matches, default to `amvcp-prose-pages` (the safest
"preserve verbatim + add commenting" path).

## iTerm-first launcher

A new wrapper script `scripts/amvcp-show-launcher.py` chooses the
right runner based on `$TERM_PROGRAM`:

```python
if os.environ.get('TERM_PROGRAM') == 'iTerm.app':
    run(['python3', PLUGIN_ROOT / 'scripts' / 'amvcp-iterm2-pane.py', html_path])
else:
    run(['python3', PLUGIN_ROOT / 'scripts' / 'amvcp-select.py', html_path, '--timeout', '600'])
```

If `amvcp-iterm2-pane.py` doesn't exist yet in the plugin, it must be
authored: it splits the current iTerm tab into a horizontal pane,
launches a headless/headful Chromium inside that pane via the iTerm
inline-image protocol OR via `osascript` controlling a small
embedded WebKit view — TBD which approach is cleanest. Fallback:
print a warning and use `amvcp-select.py`.

## 6 fixes — implementation notes

### #1 (preservation) — already solved by routing markdown to
`amvcp-interactive-report`. No code change needed beyond `amvcp-show`
making the right dispatch decision.

### #2 (hover glow) — strip every `:hover` rule from the Tier 4
visual-component CSS in `scripts/amvcp-runtime.js`. The runtime's
own R29 selection styling owns hover/selected visuals exclusively.

### #3 (corner buttons missing) — verify by rendering a tiny test
fixture and inspecting the DOM in iTerm pane. Likely fixes:
- ensure `_ensureCornerControlsRow()` runs AFTER any in-progress
  hero `overflow:hidden` parent
- raise the corner-row z-index above `2147483645` (it's already at
  max-1; verify nothing else competes)
- add a console.log on boot for diagnosis

### #4 (iTerm) — see launcher above. amvcp-show ALWAYS calls the
launcher, never amvcp-select.py directly.

### #5 (product-dashboard theme) — revise the preset entry in
`scripts/amvcp-tokens.js`:
- accent: indigo-600 → a less saturated variant
- font-body: Manrope → keep but make weight-medium the default
- drop `.ve-hero-title-gradient` as a default; leave it as an opt-in class

### #6 (3-state) — extend `render-interactive-report.py`:
- per-finding HTML emits `<fieldset class="ve-finding-decision">`
  with three `<input type="radio" name="decision-{N}" value="accept|reject|comment">`
- sidecar `<report>.replies.json` schema gains `decision: "accept"|"reject"|"comment"|null`
- on submit, the payload includes `selections[i].decision` for each
  finding-reply selection

## Files to modify / add

- `scripts/amvcp-runtime.js` — strip Tier 4 `:hover` rules; verify
  corner-row positioning
- `scripts/amvcp-tokens.js` — revise `product-dashboard` preset
- `scripts/amvcp-show-launcher.py` (NEW) — iTerm-first runner
- `scripts/amvcp-iterm2-pane.py` (NEW) — split-pane preview
- `skills/amvcp-show/SKILL.md` (NEW) — the router skill
- `skills/amvcp-show/scripts/dispatch.py` (NEW) — input-type detection
  and routing logic
- `scripts/render-interactive-report.py` — add 3-state controls per finding

## Verification

For each fix:

1. Tests: `cd tests && python3 run-tests.py` — full suite stays green.
2. Re-render the original Symphony-vs-AMOA markdown via
   `/amvcp-show <report.md>` and confirm:
   - Page opens in iTerm split-pane (not Safari)
   - Every paragraph / table / list from the source markdown is
     present verbatim
   - Each `## section` has the 3-state accept/reject/comment radio
     and textarea
   - Corner-button row is visible at bottom-right
   - Hover on any atom shows the drop-shadow glow
   - Theme reads as polished, not corporate-templated

## Commit strategy

One commit per atomic fix:

1. `fix(runtime): strip Tier 4 :hover rules — R29 belongs to runtime`
2. `fix(runtime): corner buttons not clipped by hero overflow`
3. `feat(tokens): revise product-dashboard preset polish`
4. `feat(amvcp-show): iTerm-first launcher + split-pane runner`
5. `feat(amvcp-show): smart-router skill + dispatch.py`
6. `feat(interactive-report): per-finding 3-state accept/reject/comment`

## Out of scope

- Adding new sub-skills (the router calls existing ones only).
- Replacing `amvcp-select.py` (the iTerm-first launcher wraps it).
- New visual components beyond what Tier 4 already shipped.
