# Verification protocol + anti-patterns

The 11-step verification sequence to run before claiming any change is "fixed", plus the running list of anti-patterns (NEVER do) distilled from prior debug sessions. Updated as new violations are caught.

## Verification protocol — run before claiming "fixed"

For ANY change that touches the runtime, the renderer, or a visualization skill, run this sequence:

1. **Tests**: `cd tests && python3 run-tests.py` — full suite must pass (current baseline 358/358; periodic flakes: animation IO timing + icon-svg hotspot positioning are known unrelated).
2. **CSS sanity**: walk R1-R17 above; run the embedded snippets; record results.
3. **Function / logic sanity**: walk R19-R26; run the embedded snippets. Pay special attention to R20 + R23 (decision pills appear ONLY on `data-ve-mode=choice*` hosts).
4. **Pod + UX sanity**: walk R27-R39; run the embedded snippets. Pay special attention to R27/R39 (pod mounted but hidden until the `Ctrl+Shift+\` / 3-finger-tap gesture summons it), R29 (3-state selection always overrides palette), R33 (corner action buttons remain on top of every surface), R34/R35 (no overlap / no truncation).
5. **Screenshot per area**: take a screenshot of the changed surface AND read it back. Don't trust "the diff looks right" — visual layout regressions hide in correct-looking diffs.
6. **Narrow viewport**: force `.ve-code-block { max-width: 400px }` (or similar narrowing for the relevant element) and verify wrap/responsive behavior. Also test the canonical R31 width matrix (320 / 375 / 414 / 768 / 1024 / 1280 / 1920 / 2560) for any page-level change.
7. **Both themes**: flip `data-ve-theme` between `light` and `dark`, screenshot both. For per-preset coverage (R29), iterate `amvcpTokens.PRESETS` and screenshot each.
8. **Interaction sequences**: for hover/click/drag features, use real mouse paths (`page.mouse.move(x, y, {steps: 8})`) — `el.click()` hides hover-state bugs. For touch (R30), use `page.emulate({mobile: true, hasTouch: true})`.
9. **Composability**: when a runtime change touches a skill that ships alongside others, re-run R22's composite-fixture check (`all-techniques-sample.html`) to confirm zero interference with other skills.
10. **iTerm pane**: if you opened a preview pane during testing, run `open_preview` again with `${ITERM_SESSION_ID##*:}` (the safeguard auto-closes the previous pane).
11. **dev-browser visible mode (R41)**: when re-running tests / scenarios / screenshot scripts, verify dev-browser is launched in visible/windowed mode — never headless. Snapshot the runner script for `headless` flags before invocation.

## Anti-patterns (NEVER do)

- Claim "fixed" without running the verify snippet for the affected rule.
- Use `el.click()` instead of real mouse paths for hover-bridge features.
- Add `overflow:auto` / `overflow:scroll` to any inner element (see R2).
- Hardcode pixel widths/heights for chips, segments, cells (use em / % / max-content — see R17).
- Use `data-ve-accent-dark` (low-contrast brown) for outlines on dark theme — use `--ve-accent` (warm gold) so the selection reads.
- Define a single set of color values "and the dark mode will figure it out" — the dark equivalent of a teal is brighter+desaturated, not just a brightness shift (see R1).
- Ship a snippet popup chip that uses `display:none` and pass it to `openCommentModal` as the anchor — connector line draws to (0,0). Use a transient anchor div instead (see R15).
- Add a hover-pill duplicate of the bubble handle. The bubble handle is the SOLE comment-entry affordance for atoms; tests use `window.__veOpenCommentModal(anchor)` directly.
- Open multiple iTerm preview panes from the same shell. The safeguard in `open_preview.applescript` closes any existing preview pane in the caller's tab before splitting again — bypassing it stacks panes.
- **Ship a page that loads `amvcp-runtime.js` but lacks the DESIGN.md pod** (see R27). The runtime MUST auto-mount the pod if `amvcp-designmd.js` is absent — never let a page render without it.
- **Show the pod by default** (see R27/R39). The pod is hidden until the user summons it with `Ctrl+Shift+\` (or `Cmd+Shift+\` on macOS) on desktop or a 3-finger tap on mobile. No permanent always-visible pod affordance is allowed.
- **Bind the pod summon gesture to a single modifier or to a letter that conflicts with text writing** (see R39). The combo must require all of Ctrl + Shift + non-letter (or Cmd + Shift + non-letter on macOS) so it can never fire while the user is typing prose / code. On mobile, the gesture must require exactly 3 simultaneous touches so it does not collide with text selection (1-2 touches).
- **Build a DESIGN.md preset that overrides the 3-state hover / selected delta** (see R29). The palette is yours to change; the brightness DIRECTION (darker in light, brighter in dark) and the hover glow are non-negotiable. Use `:where()` for DESIGN.md selectors to keep specificity 0,0,0 — the runtime's selection CSS must always win.
- **Mask the corner action buttons with a fullscreen slide / animation / video** (see R33). Pin those buttons at the top z-layer (`z-index: 2147483646`). The pod handle is exempt because it lives behind the summon gesture (R39).
- **Render a bitmap `<img>` without a 2× `srcset` descriptor** on a page that may be viewed on a Retina screen (see R32). For pure-vector content (SVG / canvas) this doesn't apply.
- **Lay out two skill surfaces so their bounding rects overlap** (see R34). The page is a single document scroll; each surface stacks below the previous. Only floating overlays (pod, modal, snippet popup, corner buttons) live on a separate z-layer with known small footprints.
- **Truncate prose with `text-overflow: ellipsis` or let a paragraph extend past the body's right padding** (see R35). Chips and badges can ellipsis; prose cannot.
- **Skip touch-event listeners on interactive surfaces** (see R30). Every `mousedown` / `mousemove` / `mouseup` handler that drives selection / panning / drag-paint must also register `touchstart` / `touchmove` / `touchend` counterparts.
- **Use `font-size` smaller than 14 px for body prose, or smaller than 12 px for chips** (see R37). Fluid scales must clamp ≥ 14 px at 320 px viewport.
- **Attach `.ve-decision-mini` on a host whose `data-ve-mode` is not a choice variant** (see R20/R23). The default is `readonly` — decision pills are an OPT-IN by the agent, not the runtime's default.
- **Render a skill's output as plain `<p>` text** when the skill's content type warrants structural DOM (see R19). A "colors" skill emits swatches, a "graph" skill emits `<svg>` nodes, etc.
- **Declare a choice host without a cardinality** (see R21). `data-ve-mode="choice"` alone is acceptable as a back-compat alias for `multi`, but new code SHOULD say `single`, `multi`, or `max-N` explicitly.
- **Race two skills on the same `data-ve-id` namespace** (see R22). Use per-skill prefixes (`scene-foo-1`, `chart-bar-2`, `gallery-baz-3`); never let two skills both assign `data-ve-id="3"`.
- **Mutate the host page's DOM in overlay mode** (see R24). Inject ONE overlay-root sibling; arm/disarm cleanly; never touch existing elements' classes or inline styles.
- **Submit a selection payload missing `id` + `text/label` + `kind`** (see R25). The agent cannot map the user's choice back to the source if any of these is missing.
- **Add a new skill without `## Modes` and `## Composability` sections in its SKILL.md** (see R26). Future planner skills need to discover what each skill can do without grepping runtime files.
- **Launch dev-browser in headless mode** (see R41). Every dev-browser invocation — test runner, scenario runner, screenshot script, agent delegation — MUST run in visible/windowed mode so the user can watch. No `--headless`, no `HEADLESS=1`, no equivalent. Override headless defaults to visible before invocation; do not use tools that only support headless.

