# Quality Checklist

Pre-delivery verification. Run every page through this list before handing
the file path back to the user. A page that fails any check is not ready.

## Table of contents

- [The squint test](#the-squint-test)
- [The swap test](#the-swap-test)
- [Both themes](#both-themes)
- [Information completeness](#information-completeness)
- [No overflow](#no-overflow)
- [Mermaid zoom controls](#mermaid-zoom-controls)
- [No anti-patterns](#no-anti-patterns)
- [File opens cleanly](#file-opens-cleanly)

---

## The squint test

Blur your eyes. Can you still perceive hierarchy? Are sections visually
distinct? If everything melts into a uniform grey wash, the page lacks
typographic and chromatic contrast — push the type scale and the surface
elevations further apart.

## The swap test

Would replacing your fonts and colors with a generic dark theme make this
indistinguishable from a template? If yes, push the aesthetic further.
Commit to the chosen direction; don't water it down.

## Both themes

Toggle the OS between light and dark mode. Both should look intentional, not
broken. Watch for: text that vanishes against the background, accent colours
that wash out, drop shadows that look correct in dark mode but become heavy
black smudges in light mode.

## Information completeness

Does the diagram actually convey what the user asked for? Pretty but
incomplete is a failure. A 22-slide deck that covers everything beats a
13-slide deck that drops 40% of content; an 8-node Mermaid that omits the
auth provider beats a 5-node Mermaid that "looks cleaner".

## No overflow

Resize the browser to different widths. No content should clip or escape its
container. Every grid and flex child needs `min-width: 0`. See "Overflow
Protection" in `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md`.

## Mermaid zoom controls

Every `.mermaid-wrap` container must have +/−/reset/expand buttons,
Ctrl/Cmd+scroll zoom, click-and-drag panning, and click-to-expand. The full
pattern (including `openMermaidInNewTab()`) is in
`${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md`.

## No anti-patterns

Run the page against `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md`.
The Slop Test: would a developer immediately think "AI generated this"? If
yes, the typography is probably Inter/Roboto, the accent is probably violet
or cyan with a gradient, and the section headers probably have emoji icons
— rework all three.

## File opens cleanly

No console errors, no broken font loads, no layout shifts. Open the page
once with the runner, then check the JS console. If anything is red, fix it
before delivering. Most failures (Mermaid, TikZ, regex panel, snippet popup)
emit a console message identifying which block crashed — see
`./troubleshooting.md` for the failure modes.
