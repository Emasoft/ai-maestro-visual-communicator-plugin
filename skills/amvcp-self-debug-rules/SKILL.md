---
name: amvcp-self-debug-rules
description: "Self-debugging checklist for visual-communicator pages. Use when verifying a rendered HTML/SVG visualization (report, slide, diagram, table) adheres to the universal rules from prior debug sessions. Trigger with 'verify the visualization', 'self-debug', 'check the rendered page', 'audit the visualization'. Run via dev-browser in visible mode (never headless per R41) — every rule maps to a CDP measurement."
license: MIT
metadata:
  author: Emasoft
---

# Self-debug rules — visual-communicator

## Overview

Every visualization the plugin emits MUST satisfy a fixed set of universal rules. This skill is the canonical checklist + the exact dev-browser snippets to verify each rule. Use it BEFORE telling the user "wrap is fixed", "selection works", "the chip is sized right" — measure, don't claim.

## Prerequisites

- `dev-browser` plugin installed (visible/windowed mode, never headless — R41).
- Page rendered to a file path (HTML or SVG) the dev-browser can open.
- Node `puppeteer` available if running snippets via CLI; otherwise the embedded dev-browser MCP works directly.

## Instructions

1. Open the rendered page via dev-browser.
2. Walk the Universal Rules (R1 - R41) in sequence; run each rule's embedded CDP snippet from the corresponding reference file (see the "Rules index" table below).
3. After every measurement that flags a rule as failing, fix the source code (CSS / runtime / authoring) and re-render.
4. Re-run the relevant rule's snippet to confirm the fix.
5. Take a screenshot via `page.screenshot({clip: ...})` after each fix and read it back with the `Read` tool for a visual sanity check.
6. When all rules pass, the page is publishable — repeat for the dark theme and for `prefers-reduced-motion: reduce` emulated.

## How to debug

1. Open the page via `dev-browser` (visible mode) so the Chromium instance can be inspected from JS — this is faster than the iTerm preview pane and gives byte-level measurements.
2. For EVERY change that touches CSS / DOM / runtime behaviour, walk the relevant section of the checklist and run the embedded snippets. If any check fails, fix the code, then re-run from the top.
3. Take a screenshot AFTER each fix using `page.screenshot({clip: ...})` and read it back with the `Read` tool to do a visual sanity check too — measurements alone miss layout regressions.
4. For interactions that need real mouse paths (hover-bridge, drag-paint, snippet handle), use `page.mouse.move(x, y, {steps: N})` not `el.click()`. Programmatic clicks bypass the move/leave/over event sequence and hide hover-state bugs.

## Rules index

The full rule bodies + dev-browser verify snippets live in the four reference files below. Read the one for the area you're touching before claiming a fix. Each row links to its full rule list — the validator's progressive-discovery walker indexes the TOC of the linked file directly, so no per-rule TOC duplication is needed in this index.

- [css-rules-r1-r18](references/css-rules-r1-r18.md) — R1 Light + dark themes · R2 No nested scrollbars · R3 3-state visual model (normal · selected ±Δ · hover ±Δ + glow) · R4 Atom selection model · R5 Two independent bubble handles · R6 Snippet selection survives the modal · R7 One bubble handle per shell · R8 Atom-vs-text-selection disambiguation · R9 Code-block soft-wrap rules · R10 Code-block copy contract · R11 Line numbers NOT selectable · R12 Tables responsive + decision column · R13 LaTeX / math / TikZ · R14 Regex-vis inline · R15 Comment-modal connector line · R16 Page left-padding for handles · R17 Mini decision chip is responsive · R18 Dispatched-event vs real-mouse-path.
- [function-logic-rules-r19-r25](references/function-logic-rules-r19-r25.md) — R19 Skill output is structural, not text-only · R20 Selection ≠ choice · R21 Choice cardinality enforced · R22 Skill composability · R23 Mode declared explicitly · R24 Overlay-mode runtime non-destructive · R25 Submission payload unambiguous.
- [pod-and-ux-rules-r26-r41](references/pod-and-ux-rules-r26-r41.md) — R26 Skill discoverability · R27 DESIGN.md pod always MOUNTED · R28 Pod library save / rename / delete · R29 3-state selection overrides palette · R30 Touch parity on mobile · R31 Responsive viewport widths · R32 Retina 2× / 3× bitmap density · R33 Corner buttons always present · R34 No overlap between surfaces · R35 No text hidden or truncated · R36 Diagrams zoom / pan + mini-map · R37 Font size ≥ 14 px body, ≥ 12 px chips · R38 Live-page overlay selects TRUE HTML · R39 Pod summon gesture · R40 Accessibility primitives + print export · R41 dev-browser NEVER headless.
- [verification-protocol-and-anti-patterns](references/verification-protocol-and-anti-patterns.md) — the 11-step verify sequence to run before claiming any change is "fixed", plus the running anti-patterns list.

After verifying the rules relevant to your change, run the [verification protocol](references/verification-protocol-and-anti-patterns.md#verification-protocol-run-before-claiming-fixed) and review the [anti-patterns](references/verification-protocol-and-anti-patterns.md#anti-patterns-never-do) to catch the common mistakes.

## Output

The skill itself emits no DOM and no files. The OUTPUT of running its checks is a pass/fail verdict per rule plus screenshots saved by the caller. Pass criteria: every applicable rule reports `pass` from its snippet OR the snippet's measured value falls inside the rule's tolerance band. Fail criteria: any rule reports `fail` or a measurement outside tolerance.

## Error Handling

| Symptom | Cause | Fix |
|---|---|---|
| `page.evaluate` throws "rule snippet" undefined | dev-browser cannot reach the page DOM | Wait for `DOMContentLoaded`; re-open via `page.goto(url, {waitUntil: 'networkidle0'})` |
| Screenshot is blank / mostly white | Light theme defaulted but CSS shipped only dark vars | Inject `<html data-theme="light">` and re-take; fix dual-theme parity per R1 |
| Hover-state rule fires false-positive | Programmatic click bypassed the hover-bridge timing | Use `page.mouse.move(x, y, {steps: 8})` then `page.mouse.click()` per R10 |
| Test passes locally but fails on CI | CI ran dev-browser in headless mode | Per R41, force visible/windowed mode — never `--headless`, never `HEADLESS=1` |
| New skill flagged "missing ## Modes / ## Composability" | SKILL.md skipped R26 mandatory sections | Add both sections at the end; even "Not applicable" content is acceptable |

## Examples

**Example 1 — verify a new chart skill**

```
Input: skills/amvcp-charts-and-dashboards rendered a bar chart at /tmp/q1-revenue.html
Walk: R1 (light+dark), R2 (no-nested-scrollbars), R22 (data-ve-id),
      R29 (3-state selection), R33 (corner buttons), R37 (font-size base).
Output: 6/6 pass — chart is publishable.
```

**Example 2 — diagnose a hover bug**

```
Input: tooltip on an icon flickers when user moves cursor onto it
Walk: R18 (real-mouse-path) — measure the 180 ms delay between mouseleave
      on anchor and hide-on-tooltip.
Output: measured delay is 60 ms (< 180 ms tolerance) → fix the hide-timer
      to default to 200 ms; re-run R18; now pass.
```

## Resources

The rule bodies live in four reference files under `references/`:

- [css-rules-r1-r18](references/css-rules-r1-r18.md) — universal CSS, layout, and direct-interaction rules (R1-R18). Light/dark parity, no nested scrollbars, 3-state visual, atom selection, bubble handles, snippet survives modal, code-block wrap, copy contract, line numbers, tables, math/LaTeX/TikZ, regex-vis, comment-modal connector, page left padding, real-mouse-path vs dispatched-event, mini decision chip.
  > R1 — Light + dark themes · R2 — No nested scrollbars · R3 — 3-state visual model (normal · selected ±Δ · hover ±Δ + glow) · R4 — Atom selection model (only the right things are selectable) · R5 — Two independent bubble handles, distinct colors · R6 — Snippet selection survives the modal · R7 — One bubble handle per shell (iTerm pane) · R8 — Atom selection vs text selection: disambiguation · R9 — Code-block soft-wrap rules · R10 — Code block: copy contract · R11 — Line numbers are NOT selectable · R12 — Tables: responsive, decision column · R13 — LaTeX / math / TikZ embedded elements · R14 — Regex-vis embedded as inline interactive div · R15 — Comment-modal connector line · R16 — Page left-padding for handles · R18 — Dispatched-event vs real-mouse-path · R17 — Mini decision chip is responsive
- [function-logic-rules-r19-r25](references/function-logic-rules-r19-r25.md) — plugin design contract (R19-R25). Skill output is structural, selection ≠ choice, choice cardinality, composability, mode declared explicitly, overlay-mode non-destructive, submission payload unambiguous.
  > R19 — Skill output is structural, not text-only · R20 — Selection ≠ choice (universal commentability vs explicit decision) · R21 — Choice cardinality enforced · R22 — Skill composability — same page, zero interference · R23 — Mode declared explicitly; default is read-only · R24 — Overlay-mode runtime — non-destructive contract · R25 — Submission payload identifies atoms unambiguously
- [pod-and-ux-rules-r26-r41](references/pod-and-ux-rules-r26-r41.md) — pod + universal UX + accessibility (R26-R41). Skill discoverability, DESIGN.md pod always-mounted, library save/rename/delete, 3-state-overrides-palette, touch parity, responsive viewports, retina density, corner buttons z-index, no overlap, no text truncation, diagram zoom/pan + mini-map, font-size minimums, live-page overlay, pod summon gesture, accessibility primitives + print, dev-browser-never-headless.
  > R27 — DESIGN.md style controller pod always MOUNTED (but hidden by default) · R28 — Pod library: save / rename / delete user presets · R29 — 3-state selection ALWAYS overrides DESIGN.md palette · R30 — Touch parity on mobile · R31 — Responsive at all common viewport widths · R32 — Retina (2× / 3×) bitmap density · R33 — Corner action buttons always present (even in slides / animations / video) · R34 — No overlap between scaffolded elements · R35 — No text hidden or truncated at the viewport edge · R36 — Diagrams: zoom / pan + draggable mini-map · R37 — Font size readable (≥ 14 px body, ≥ 12 px chips) · R38 — Live-page overlay: select TRUE HTML elements · R39 — Pod summon gesture (desktop key combo + mobile 3-finger tap) · R26 — Skill discoverability — SKILL.md declares modes + composability · R40 — Accessibility primitives + clean print export · R41 — dev-browser NEVER runs in headless mode
- [verification-protocol-and-anti-patterns](references/verification-protocol-and-anti-patterns.md) — the 11-step verify sequence + the running anti-patterns list (NEVER do).
  > Verification protocol — run before claiming "fixed" · Anti-patterns (NEVER do)

Sibling skills the verification loop frequently invokes:

- [amvcp-iterm2-preview](../amvcp-iterm2-preview/SKILL.md) — iTerm split-pane preview lifecycle
- [amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) — modal comment thread architecture
- [amvcp-math-and-latex](../amvcp-math-and-latex/SKILL.md) — KaTeX + TikZJax usage details
- [amvcp-regex-vis](../amvcp-regex-vis/SKILL.md) — regex visualizer
- [amvcp-prose-pages](../amvcp-prose-pages/SKILL.md) — multi-click text selection chain
- [amvcp-graph-diagrams](../amvcp-graph-diagrams/SKILL.md) — Graphviz / Mermaid embedding

## Modes

Not applicable — this is a rules/spec document, not a visual skill. It defines R1-R41 for the OTHER skills to follow. It does NOT emit DOM.

## Composability

Not applicable — this document is loaded by the developer/agent context, not by the runtime.

## See also

- `amvcp-iterm2-preview/SKILL.md` — pane lifecycle (open/close/screenshot)
- `amvcp-modal-comments/SKILL.md` — modal comment thread architecture
- `amvcp-math-and-latex/SKILL.md` — KaTeX + TikZJax usage details
- `amvcp-regex-vis/SKILL.md` — regex visualizer
