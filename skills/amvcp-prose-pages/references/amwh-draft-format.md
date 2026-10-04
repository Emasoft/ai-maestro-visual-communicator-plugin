# amwh draft format — the extended Markdown the vendored CLI renders

The Draft→render fast path (see SKILL.md) writes a short **draft** in
extended Markdown and renders it with the vendored CLI
(`scripts/am-render.mjs`). You never hand-write HTML/CSS/SVG on this
path — the CLI owns layout, theming (light + dark both shipped), and
an STE controlled-writing lint.

## Panel skeleton

- `---` frontmatter: `title:` (page title), optional `lang: en|zh`
  (defaults to the draft language), optional `theme:` (default
  blueprint; `3b1b` for the dark lecture style).
- `## Panel Title` starts each panel (3–8 panels; one sub-question
  each). Panel letter IDs are optional (`## A Title {span=2
  meta="corner note"}`) and auto-assigned when omitted.
- Under each heading: ONE component (or one Markdown table/list) as
  the visual, plus 2–5 lines of narration prose.

## Component cheat sheet (pick by information shape)

| Shape | Component | Minimal syntax |
|---|---|---|
| Who connects to whom, architecture, decision branches | `flow [LR]` | `A -> B: label`, `A --> C` dashed, `A -> B & C` fan-out, `{cond?}` decision, `[(db)]` store, `*emphasis`, `group name: A, B` |
| Messages between actors over time | `sequence [num]` | `A -> B: request`, `B --> A: response`, `note A, B: text`, `== stage ==` |
| Hierarchy / tree / taxonomy | `tree [list]` | indentation = depth, `label \| note`, backticked IDs |
| History / phases | `timeline [v]` | `when \| title \| note`, `*` highlights |
| Numbers against limits | `limits` | `label \| 13 / 20 \| unit`, cap-only: `label \| max 20` |
| Word-by-word commentary | `annot` | `# subtitle \| right note`, `[snippet]{note}`, `[wrong]{!red note}`, `> footnote` |
| Meta / key-value header | `kv [cols=2]` | `key: value`, `* wide: value` |
| Conclusion / warning | `callout <info\|ok\|warn\|err> Title` | body is Markdown |
| Multi-dimension comparison, can/cannot lists | Markdown table | status column values ok / no / warn |

## STE controlled writing

`am render` lints the draft automatically: `style: 80` warns (default),
`style: strict` refuses to render, `style: off` disables. Rules: one
idea per sentence; short sentences; plain words over jargon. Fix
findings and re-render — at most TWO rounds, then ship with the page
and note the residue in the reply.

## Workflow (one Bash call)

    node "${CLAUDE_PLUGIN_ROOT}/skills/amvcp-prose-pages/scripts/am-render.mjs" render - <<'AM_EOF' --no-open -o <project-local-output-dir>
    ---
    title: The page title
    ---
    ## Panel A
    ```flow
    A -> B: label
    ```
    2-5 lines of narration.
    AM_EOF

- Read the output: a `✗ L<n> [component] …` line means a draft error —
  the message includes a correct example; fix and re-render (≤2 rounds).
- Output goes PROJECT-LOCAL (a `reports/` or `_dev` folder), never
  `~/.answer-me-with-html/` — the comment→edit-draft→re-render loop
  needs the draft next to the project.
- The emitted page is one self-contained HTML file, themed light +
  dark, with a copy-the-source-Markdown button (that button is the
  exportable channel).

## Known gap — stated, not papered over

CLI-rendered pages carry **no `data-ve-*` atoms**, so per-atom screen
selection is unavailable there. Selection happens by referencing the
draft: the user comments → Claude edits the draft → re-render (the
plugin standard comment→re-emit channel, source-level instead of
atom-level).

## Video mode (opt-in only)

`am video` renders the same draft plus `>` narration lines into an
animated, narrated player page (3b1b style with `theme: 3b1b`). MP4
export needs Chrome + ffmpeg + Node 22+. ElevenLabs TTS only when
`ELEVENLABS_API_KEY` is set; otherwise system TTS; `--voice off` for
silent. Use ONLY when the user asks for an explainer video — never
auto-triggered. Full syntax: `node scripts/am-render.mjs help video`.
