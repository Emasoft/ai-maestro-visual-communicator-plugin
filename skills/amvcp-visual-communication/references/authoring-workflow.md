# Authoring Workflow — Steps 1-5

Detailed walkthrough for the five-step page generation flow referenced from the
main `amvcp-visual-communication` SKILL.md. Read this each time you build a
page; patterns evolve and a stale memory of the boilerplate produces broken
output.

## Table of contents

- [Step 1 — Pick a direction (5 seconds)](#step-1--pick-a-direction-5-seconds)
- [Step 2 — Read the reference material](#step-2--read-the-reference-material)
- [Step 3 — Author the page](#step-3--author-the-page)
- [Step 4 — Open with the interactive runner (always)](#step-4--open-with-the-interactive-runner-always)
- [Step 5 — React to the selection](#step-5--react-to-the-selection)
- [Output: file location, format, stdout shape](#output-file-location-format-stdout-shape)

---

## Step 1 — Pick a direction (5 seconds)

Before writing HTML, commit to a direction. Don't default to "dark theme with
blue accents" every time.

- **Visual is always default.** Even essays, blog posts, and articles get
  visual treatment — extract structure into cards, diagrams, grids, tables.
  Prose patterns (lead paragraphs, pull quotes, callout boxes) are accent
  elements within visual pages, not a separate mode.
- **Who is looking?** A developer understanding a system? A PM seeing the big
  picture? A team reviewing a proposal? This shapes information density and
  visual complexity.
- **What type of content?** Pick the matching diagram type from the
  `${CLAUDE_PLUGIN_ROOT}/references/diagram-types.md` reference.
- **What aesthetic?** Pick one from `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md`
  and commit. Vary the choice each generation.

## Step 2 — Read the reference material

Read the references each time — don't memorize.

- **Always** read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`
  — every page must wire up element selection. For per-engine specifics see
  the sub-skill cookbooks (Mermaid, Graphviz, Chart.js, math/LaTeX, TikZ,
  regex, prose, choice-tables).
- For text-heavy architecture overviews: open `${CLAUDE_PLUGIN_ROOT}/templates/architecture.html`.
- For flowcharts, sequence diagrams, ER, state machines, mind maps, class
  diagrams, C4: open `${CLAUDE_PLUGIN_ROOT}/templates/mermaid-flowchart.html`.
- For data tables (passive or form): open `${CLAUDE_PLUGIN_ROOT}/templates/data-table.html`.
- For slide decks: open `${CLAUDE_PLUGIN_ROOT}/templates/slide-deck.html` and read the slide-deck-mode
  and slide-patterns references inside the `amvcp-slide-decks` sub-skill.
- For prose-heavy publishable pages: read the "Prose Page Elements" section
  in `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md` and the "Typography
  by Content Voice" notes in `${CLAUDE_PLUGIN_ROOT}/references/libraries.md`.
- For pages with 4+ sections: read the responsive-nav reference inside the
  `amvcp-prose-pages` sub-skill.

### Template inventory

- `${CLAUDE_PLUGIN_ROOT}/templates/architecture.html` — text-heavy architecture overviews.
- `${CLAUDE_PLUGIN_ROOT}/templates/mermaid-flowchart.html` — flowcharts, sequence, ER, state, mind maps, class, C4.
- `${CLAUDE_PLUGIN_ROOT}/templates/data-table.html` — passive tables and table-form (radio/checkbox) mode.
- `${CLAUDE_PLUGIN_ROOT}/templates/slide-deck.html` — slide-deck reference with all 10 slide types.

## Step 3 — Author the page

Build a single self-contained `.html` file. Inline the CSS and any minor JS in
`<style>` and `<script>` tags. The only externals allowed are CDN links
(fonts, optional libraries).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Descriptive Title</title>
  <link href="https://fonts.googleapis.com/css2?family=...&display=swap" rel="stylesheet">
  <style>/* CSS custom properties, theme, layout, components — all inline */</style>
</head>
<body>
  <!-- Semantic HTML: sections, headings, lists, tables, inline SVG -->
  <!-- Optional: <script> for Mermaid, Chart.js, or anime.js when used -->
  <script src="amvcp-runtime.js"></script>
</body>
</html>
```

**Mandatory boilerplate** (full details in
`${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`):

1. The `<script src="amvcp-runtime.js"></script>` tag at the end of `<body>`.
   The selection runner auto-copies the runtime into the same directory as
   the served HTML so a relative `src` always resolves.
2. `data-ve-id` on every meaningful element, with optional `data-ve-type` and
   `data-ve-label`.
3. `--ve-accent` set on `:root` (in both light and dark palettes) so the
   runtime's hover glow paints in your accent colour, not in dark grey:
   ```css
   :root { --gold: #b8861f; --ve-accent: var(--gold); }
   @media (prefers-color-scheme: dark) {
     :root { --gold: #e0bf5b; --ve-accent: var(--gold); }
   }
   ```
4. For Mermaid diagrams: `mermaid.initialize({securityLevel: 'loose', …})`
   plus a `click X call veSelectMermaid("X","Label")` directive on every
   meaningful node.
5. For tables that ASK a question: `data-ve-type="table-form"` +
   `data-ve-mode="single"` (radio) or `"multi"` (checkbox). The runtime
   injects the controls + Submit button.
6. For prose-heavy pages: wrap the article in `<article data-ve-prose>` (or
   `<main data-ve-prose>`).

## Step 4 — Open with the interactive runner (always)

Always open generated pages with the bundled Python runner — never with `open`
/ `xdg-open`:

```bash
python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<file>.html
```

The runner serves the file on a free localhost port, launches Chromium in
app-mode, and blocks until the user clicks something or the timeout (default
600s) elapses. It prints a single line of JSON to stdout and exits 0.

If the page is purely explanatory (not interrogative), use a shorter timeout
(`VE_SELECT_TIMEOUT=180`); if the response is `{"id":null,"reason":"timeout"}`,
just open your reply with "I generated the page; let me know what you want to
do" — don't ask about a phantom selection.

## Step 5 — React to the selection

The runner returns either the legacy single-shot shape or the new multi-select
shape. Branch on whether the top-level payload has `selections[]` (new) or
`id` (legacy).

**New multi-select shape** (`{kind, count, selections[]}`):

- `kind: "exit"` (count 0) — *"You closed without selecting anything. Want me
  to regenerate / change the layout / something else?"*
- `kind: "submit"` with count 1 — *"You selected the element «label»
  (`«type»: «id»`). What do you want me to do about it?"*
- `kind: "submit"` with count ≥ 2 — recap each selection (label + type) and
  ask what to do with them.

For the full payload schema (text snippets, math snippets, regex edits,
finding-reply turns, etc.) read
`${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`.

## Output: file location, format, stdout shape

**File location.** Write generated pages to
`$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`. Use a
descriptive filename based on content (`modem-architecture.html`,
`pipeline-flow.html`, `schema-overview.html`). The directory persists across
project sessions.

**File format.** Every diagram is a single self-contained `.html` file. No
external assets except CDN links (fonts, optional libraries).

**Stdout from the runner.** A single line of JSON, exit 0:

```json
{"kind":"submit","count":3,"selections":[
  {"kind":"element","id":"ve-node-H","type":"graph-node","label":"HUMAN","data":{}},
  {"kind":"element","id":"ve-edge-H-to-M","type":"graph-edge","label":"H->M","data":null},
  {"kind":"text","text":"10,000,000.00","depth":3,"paragraphId":"1.2.1","paragraphText":"…"}
]}
```

…or, if the user closed the window or the timeout elapsed without a click:

```json
{"id":null,"reason":"timeout"}
```

For the v2 modal-comment flow, the queue dir, sidecar files, and atomic-write
pattern are documented in the `amvcp-modal-comments` sub-skill references.

**Tell the user the file path** so they can re-open or share it later.
