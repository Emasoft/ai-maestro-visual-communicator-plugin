# Environment and Runner

Prerequisites, environment variables, and the runner CLI for the
`amvcp-visual-communication` coordinator and every sub-skill that generates
HTML pages.

## Table of contents

- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Runner CLI](#runner-cli)
- [Timeout knob — explanatory vs interrogative pages](#timeout-knob--explanatory-vs-interrogative-pages)
- [Optional dependencies](#optional-dependencies)

---

## Prerequisites

- **Python 3.12+** (for `scripts/amvcp-select.py`, the selection runner that
  serves the HTML and captures the click).
- **A Chromium-based browser** (Chrome, Chromium, Edge, Brave) is strongly
  recommended. The runner launches the browser in `--app=URL` mode so
  `window.close()` works after the click. If no Chromium browser is available
  the runner falls back to the system default; the runtime then shows a
  "selection sent — close this tab" overlay instead of auto-closing.
- **The bundled runtime** (`scripts/amvcp-runtime.js`) is auto-copied next to
  the served HTML by `amvcp-select.py`. Do NOT try to recreate it.
- **Optional:** a `surf` CLI for AI image generation in pages and slides.
  Always check `which surf` first and degrade gracefully if absent.
- **Optional for `/amvcp-share-page`:** the `vercel-deploy` skill installed
  (`pi install npm:vercel-deploy`).

## Environment variables

The selection runner (`scripts/amvcp-select.py`) honours these environment
variables. None is required for default behaviour, but `VE_COMMENT_DIR` is
critical for the v2/v3 modal-comment workflow when the renderer and
responder run from different shells (see the `amvcp-modal-comments` sub-skill
references and the `/amvcp-interactive-report` command for the full
queue-dir contract).

| Variable | Default | Effect |
|----------|---------|--------|
| `VE_COMMENT_DIR` | `<cwd>/.ve-comments` | Absolute path of the v2/v3 comment-queue directory. Set this in BOTH the renderer's shell AND the responder's shell to a shared path so they never miss each other's files. |
| `VE_SELECT_BROWSER` | (auto-detect) | Absolute path to a specific Chromium-based browser, overriding the auto-detection chain. Useful when multiple Chrome variants are installed. |
| `VE_SELECT_NO_APP` | (unset) | Set to `1` to skip `--app=URL` mode and open in the user's default browser instead. Selection still works but the window will not auto-close (user dismisses the "Selection sent" overlay manually). |
| `VE_SELECT_NO_BROWSER` | (unset) | Set to `1` to start the HTTP server only — never launch a browser. Designed for smoke tests where the test harness POSTs the selection itself. |
| `VE_SELECT_TIMEOUT` | `600` | Seconds to wait for a selection before returning `{"id":null,"reason":"timeout"}`. Lower this for explanatory pages where no click is expected. |

## Runner CLI

Always open generated pages with the bundled Python runner — never with
`open` / `xdg-open`:

```bash
python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<file>.html
```

The runner:

1. Picks a free localhost port.
2. Serves the HTML file (auto-copying `amvcp-runtime.js` next to it so the
   relative `<script src="amvcp-runtime.js">` always resolves).
3. Injects a stub PWA manifest so Chrome's `--app=URL` mode works on
   Chrome ≥120.
4. Launches the resolved Chromium-based browser in `--app=URL` mode (a
   clean, borderless app-mode window that allows `window.close()`).
5. Blocks until the user clicks something OR until `VE_SELECT_TIMEOUT`
   elapses.
6. Prints exactly one line of JSON to stdout, then exits 0.

If no Chromium-based browser is available, the runner falls back to the
user's default browser; the runtime detects this and shows a "copy this
JSON, paste to the agent" overlay so the flow still terminates cleanly.

## Timeout knob — explanatory vs interrogative pages

- **Interrogative pages** (the user is expected to click something — diagrams,
  diff reviews, plan reviews, choice tables, slide decks). Keep the default
  `VE_SELECT_TIMEOUT=600`. The runner will wait up to ten minutes for a
  click.
- **Purely explanatory pages** (no click expected — a "here is the
  visualization" handoff). Use `VE_SELECT_TIMEOUT=180` (or even shorter)
  and, when the response is `{"id":null,"reason":"timeout"}`, open your
  reply with *"I generated the page; let me know what you want to do"*
  instead of asking about a phantom selection.

## Optional dependencies

- **`surf` CLI** — used by some sub-skills (slide decks especially) to
  generate AI imagery embedded in the page. Always check `which surf`
  before invoking, and fall back to a typography-only design when absent.
  Never let a missing `surf` block page generation.
- **`vercel-deploy` skill** — required by `/amvcp-share-page` to publish a
  page to a public URL. Install with `pi install npm:vercel-deploy`.
  All other commands work without it.

## External libraries (CDN, optional)

The runtime auto-loads these libraries when their corresponding marker
elements are present on the page. You don't need to add `<script>` tags
yourself for the auto-loaded ones; just include the marker class and the
runtime fetches the CDN bundle.

- **Mermaid.js** — flowcharts, sequence, ER, state, mind maps, class diagrams.
  See the `amvcp-graph-diagrams` sub-skill cookbook.
- **Chart.js** — bar, line, pie, area charts in dashboards. See the
  `amvcp-charts-and-dashboards` sub-skill cookbook.
- **anime.js** — orchestrated multi-element animations.
- **KaTeX** + **mhchem** — math and chemistry notation (auto-loaded by the
  runtime when a `.ve-math` element is present). See the `amvcp-math-and-latex`
  sub-skill cookbook.
- **TikZJax** — static TikZ figures (auto-loaded when a `.ve-tikz` element is
  present, ~3 MB). See the `amvcp-math-and-latex` sub-skill cookbook.
- **Graphviz** (via viz.js) — directed graphs (auto-loaded when a `.ve-graph`
  element is present). See the `amvcp-graph-diagrams` sub-skill cookbook.
- **regex-vis** (vendored) — interactive regex visualizer + editor (auto-loaded
  when a `.ve-regex` element is present). See the `amvcp-regex-vis` sub-skill
  cookbook.
- **Google Fonts** — DM Sans, Instrument Serif, IBM Plex, Bricolage Grotesque,
  Plus Jakarta Sans, Fira Code, JetBrains Mono, Azeret Mono, Fragment Mono.
  See `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` for typography pairings
  and `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` for aesthetic
  presets.
