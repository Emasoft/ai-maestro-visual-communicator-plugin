# Troubleshooting

Failure-mode matrix for the `amvcp-visual-communication` coordinator and the
selection runner. Eight common breakages, each with the symptom and the fix.

## Table of contents

- [No Chromium browser found](#no-chromium-browser-found)
- [Page opened directly via file:// (not via the runner)](#page-opened-directly-via-file-not-via-the-runner)
- [Timeout without a click](#timeout-without-a-click)
- [`surf` CLI missing](#surf-cli-missing)
- [Mermaid render failure](#mermaid-render-failure)
- [TikZ / MathJax silent failures](#tikz--mathjax-silent-failures)
- [Vercel deploy errors (`/amvcp-share-page`)](#vercel-deploy-errors-amvcp-share-page)
- [Always check the browser console first](#always-check-the-browser-console-first)

---

## No Chromium browser found

The runner falls back to the user's default browser. The page still wires up
clicks, but `window.close()` is denied by the user's default browser
profile — the runtime then shows a clean *"selection sent — close this
tab"* overlay so the flow still terminates cleanly. The user dismisses the
tab manually; the runner still receives the POST and exits 0.

To force a specific browser, set `VE_SELECT_BROWSER=/abs/path/to/chrome`
before invoking the runner.

## Page opened directly via file:// (not via the runner)

The runtime detects the missing back-channel (no `/__ve-select` endpoint
reachable) and shows an overlay with the JSON payload + a *Copy JSON*
button so the user can paste the selection back into the chat. The user
loses auto-close but the selection contract still works.

This is a "you forgot to use the runner" mode — always invoke the runner;
never tell the user to double-click the file.

## Timeout without a click

The runner returns `{"id":null,"reason":"timeout"}` after `VE_SELECT_TIMEOUT`
seconds (default 600).

For purely explanatory pages this is fine — open your reply with *"I
generated the page; let me know what you want to do"* instead of asking
about a phantom selection. For interrogative pages (diagrams, choice
tables, slide decks where you genuinely expect a click), ask the user
whether they wanted to click something and the click silently failed.

## `surf` CLI missing

Skip image generation; the page must stand on its own with CSS and
typography. Never let an absent `surf` block page generation. Always check
`which surf` first; if absent, fall back to typography-only design and
inline SVG ornaments.

## Mermaid render failure

Inspect the JS console for `Syntax error in text` (typically a
`stateDiagram-v2` label with parens, colons, or `<br/>`) — switch to
`flowchart TD` for richer label support. See the `stateDiagram-v2` notes in
`${CLAUDE_PLUGIN_ROOT}/references/diagram-types.md`.

## TikZ / MathJax silent failures

A single LaTeX error inside any `.ve-tikz` block crashes the WASM runtime
and silently blocks every later diagram on the same page. If the user
reports *"I see only the title and the legend"*, inspect the JS console
for `! LaTeX Error` lines and identify which diagram crashed the run. See
`${CLAUDE_PLUGIN_ROOT}/skills/amvcp-math-and-latex/references/tikz-substitutions.md`
for the substitution table that prevents the most common crashes.

## Vercel deploy errors (`/amvcp-share-page`)

Confirm the `vercel-deploy` skill is installed (`npm skills install
vercel-deploy`). Other harnesses can generate and open HTML normally
without it; only `/amvcp-share-page` requires it. The first deploy in a
project also requires interactive Vercel CLI login — run `npx vercel
login` once outside the runner.

## Always check the browser console first

When something visible is missing — a Mermaid diagram, a regex panel, a
math equation, a snippet popup — the JS console almost always tells you
which block crashed. The runtime logs every crash with a clear marker:
`[ve-mermaid] failed`, `[ve-regex] failed`, `[ve-math] failed`,
`[ve-tikz] failed`, etc. Copy the message into your reply and the user
can fix the source markup.
