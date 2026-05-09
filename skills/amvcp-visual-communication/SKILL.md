---
name: amvcp-visual-communication
description: "Generate beautiful, self-contained interactive HTML pages — diagrams, diff reviews, plan reviews, slide decks, data tables, and modal-comment agent reports. Use when the user asks for a diagram, architecture overview, diff review, comparison, or any visual explanation, or proactively for ASCII tables with 4+ rows or 3+ columns. Trigger with /amvcp-generate-web-diagram, /amvcp-diff-review, /amvcp-generate-slides, or requests like \"make a diagram\" or \"render as HTML\"."
license: MIT
compatibility: "Requires a browser (Chromium-based browser strongly recommended for auto-close on click). Python 3 for the selection runner."
metadata:
  author: Emasoft
---

# Visual Communication

## Overview

Generate self-contained HTML files for technical diagrams, visualizations, and data tables. Always open the result in the browser. Never fall back to ASCII art when this skill is loaded.

**Every page is interactive.** This is not a flag, not an opt-in. The user clicks any meaningful element (a Mermaid node, a card, a chart point, a table row), the browser window closes automatically, and the selection is returned to you. You then ask the user what to do about it.

**Proactive table rendering.** When you're about to present tabular data as an ASCII box-drawing table in the terminal (comparisons, audits, feature matrices, status reports, any structured rows/columns), generate an HTML page instead. The threshold: if the table has 4+ rows or 3+ columns, it belongs in the browser. Don't wait for the user to ask — render it as HTML automatically and tell them the file path.

**Two interaction flows are supported:**

1. **Single-shot interactive selection** — the default for diagrams, diff reviews, plan reviews, slide decks. The page opens, the user clicks ONE element (or multi-selects with toggling), the runtime POSTs the selection back, and the window closes.
2. **Per-finding modal-comment threads (v2/v3)** — for agent reports where the user wants to comment on each finding inline and receive per-finding replies. See the modal-comments reference in the Resources section below.

## Prerequisites

- **Python 3** (for `scripts/amvcp-select.py`, the selection runner that serves the HTML and captures the click).
- **A Chromium-based browser** (Chrome, Chromium, Edge, Brave) is strongly recommended. The runner launches the browser in `--app=URL` mode so `window.close()` works after the click. If no Chromium browser is available the runner falls back to the system default; the runtime then shows a "selection sent — close this tab" overlay instead of auto-closing.
- **The bundled runtime** (`scripts/amvcp-runtime.js`) is auto-copied next to the served HTML by `amvcp-select.py`. Do NOT try to recreate it.
- **Optional:** a `surf` CLI for AI image generation in pages and slides. Always check `which surf` first and degrade gracefully if absent.
- **Optional for `/amvcp-share-page`:** the `vercel-deploy` skill installed (`npm skills install vercel-deploy`).

The full catalogue of reference files (with their tables of contents) lives in the Resources section at the bottom of this document. Read the relevant reference each time you generate a page — patterns evolve and memorising stale snippets produces broken output.

## Instructions

### Step 1 — Pick a direction (5 seconds)

Before writing HTML, commit to a direction. Don't default to "dark theme with blue accents" every time.

- **Visual is always default.** Even essays, blog posts, and articles get visual treatment — extract structure into cards, diagrams, grids, tables. Prose patterns (lead paragraphs, pull quotes, callout boxes) are accent elements within visual pages, not a separate mode.
- **Who is looking?** A developer understanding a system? A PM seeing the big picture? A team reviewing a proposal? This shapes information density and visual complexity.
- **What type of content?** Pick the matching diagram type from the diagram-types reference.
- **What aesthetic?** Pick one from the styling-guide reference and commit. Vary the choice each generation.

### Step 2 — Read the reference material

Read the references each time — don't memorize.

- **Always** read the interactive-selection reference — every page must wire up element selection.
- For text-heavy architecture overviews: open `templates/architecture.html`.
- For flowcharts, sequence diagrams, ER, state machines, mind maps, class diagrams, C4: open `templates/mermaid-flowchart.html`.
- For data tables (passive or form): open `templates/data-table.html`.
- For slide decks: open `templates/slide-deck.html` and read the slide-deck-mode and slide-patterns references.
- For prose-heavy publishable pages: read the "Prose Page Elements" section in css-patterns and the "Typography by Content Voice" notes in libraries.
- For pages with 4+ sections: read the responsive-nav reference.

### Step 3 — Author the page

Build a single self-contained `.html` file. Inline the CSS and any minor JS in `<style>` and `<script>` tags. The only externals allowed are CDN links (fonts, optional libraries).

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

**Mandatory boilerplate** (full details in the interactive-selection reference):

1. The `<script src="amvcp-runtime.js"></script>` tag at the end of `<body>`. The selection runner auto-copies the runtime into the same directory as the served HTML so a relative `src` always resolves.
2. `data-ve-id` on every meaningful element, with optional `data-ve-type` and `data-ve-label`.
3. `--ve-accent` set on `:root` (in both light and dark palettes) so the runtime's hover glow paints in your accent colour, not in dark grey:
   ```css
   :root { --gold: #b8861f; --ve-accent: var(--gold); }
   @media (prefers-color-scheme: dark) {
     :root { --gold: #e0bf5b; --ve-accent: var(--gold); }
   }
   ```
4. For Mermaid diagrams: `mermaid.initialize({securityLevel: 'loose', …})` plus a `click X call veSelectMermaid("X","Label")` directive on every meaningful node.
5. For tables that ASK a question: `data-ve-type="table-form"` + `data-ve-mode="single"` (radio) or `"multi"` (checkbox). The runtime injects the controls + Submit button.
6. For prose-heavy pages: wrap the article in `<article data-ve-prose>` (or `<main data-ve-prose>`).

### Step 4 — Open with the interactive runner (always)

Always open generated pages with the bundled Python runner — never with `open` / `xdg-open`:

```bash
python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<file>.html
```

The runner serves the file on a free localhost port, launches Chromium in app-mode, and blocks until the user clicks something or the timeout (default 600s) elapses. It prints a single line of JSON to stdout and exits 0.

If the page is purely explanatory (not interrogative), use a shorter timeout (`VE_SELECT_TIMEOUT=180`); if the response is `{"id":null,"reason":"timeout"}`, just open your reply with "I generated the page; let me know what you want to do" — don't ask about a phantom selection.

### Step 5 — React to the selection

The runner returns either the legacy single-shot shape or the new multi-select shape. Branch on whether the top-level payload has `selections[]` (new) or `id` (legacy).

**New multi-select shape** (`{kind, count, selections[]}`):
- `kind: "exit"` (count 0) — *"You closed without selecting anything. Want me to regenerate / change the layout / something else?"*
- `kind: "submit"` with count 1 — *"You selected the element «label» (`«type»: «id»`). What do you want me to do about it?"*
- `kind: "submit"` with count ≥ 2 — recap each selection (label + type) and ask what to do with them.

For the full payload schema (text snippets, math snippets, regex edits, finding-reply turns, etc.) read the interactive-selection reference.

### Choosing a rendering approach (quick reference)

| Content type | Approach | Why |
|---|---|---|
| Architecture (text-heavy) | CSS Grid cards + flow arrows | Rich card content needs CSS control |
| Architecture (topology-focused) | **Mermaid** | Visible connections need automatic edge routing |
| Flowchart / pipeline | **Mermaid** | Automatic node positioning and edge routing |
| Sequence diagram | **Mermaid** `sequenceDiagram` | Lifelines/messages need automatic layout |
| Data flow | **Mermaid** with edge labels | Connections + descriptions need auto-routing |
| ER / schema | **Mermaid** `erDiagram` | Relationship lines need auto-routing |
| State machine | **Mermaid** `stateDiagram-v2` | State transitions with labeled edges |
| Mind map | **Mermaid** `mindmap` | Hierarchical branching auto-positioning |
| Class diagram | **Mermaid** `classDiagram` | Inheritance/composition lines |
| C4 architecture | **Mermaid** `graph TD` + `subgraph` | Native `C4Context` ignores themes |
| Data table | HTML `<table>` | Semantic markup, accessibility, copy-paste |
| Timeline | CSS (central line + cards) | Simple linear layout, no engine needed |
| Dashboard | CSS Grid + Chart.js | Card grid with embedded charts |

The detailed catalogue (Architecture three-tier strategy, Mermaid scaling rules, layout direction, theming, the C4 flowchart pattern) lives in the diagram-types reference. Mermaid theming and container patterns are in the styling-guide reference. Library details and CDN URLs are in the libraries reference.

### When to switch into modal-comment mode (v2/v3)

If the user asks "make this commentable", "let me reply to each finding", "interactive report", "let me ask Claude follow-ups on individual paragraphs", or attaches an agent report and asks for a clickable HTML version, switch to the v2 modal-comment flow. The modal-comments reference covers the full wire format, the renderer + responder split, atomic write pattern, and v3 per-element approve/reject toggles.

### Available commands

Detailed prompt templates in `commands/`. In Pi these are slash commands (`/amvcp-diff-review`); in Claude Code they're namespaced; in Codex use `/prompts:amvcp-diff-review` (if installed) or invoke `$amvcp-visual-communication`.

| Command | What it does |
|---------|-------------|
| `amvcp-generate-web-diagram` | Generate an HTML diagram for any topic |
| `amvcp-generate-visual-plan` | Generate a visual implementation plan for a feature |
| `amvcp-generate-slides` | Generate a magazine-quality slide deck |
| `amvcp-diff-review` | Visual diff review with architecture comparison and code review |
| `amvcp-plan-review` | Compare a plan against the codebase with risk assessment |
| `amvcp-project-recap` | Mental model snapshot for context-switching back to a project |
| `amvcp-fact-check` | Verify accuracy of a document against actual code |
| `amvcp-interactive-report` | Render an agent report as an interactive HTML page (v2 renderer + transport) |
| `amvcp-respond-to-comment` | Watch the comment queue and write per-turn agent replies (v2 responder) |
| `amvcp-share-page` | Deploy an HTML page to Vercel and get a live URL |

## Output

**File location.** Write generated pages to `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`. Use a descriptive filename based on content (`modem-architecture.html`, `pipeline-flow.html`, `schema-overview.html`). The directory persists across project sessions.

**File format.** Every diagram is a single self-contained `.html` file. No external assets except CDN links (fonts, optional libraries).

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

For the v2 modal-comment flow, the queue dir, sidecar files, and atomic-write pattern are documented in the modal-comments reference.

**Tell the user the file path** so they can re-open or share it later.

## Error Handling

- **No Chromium browser found.** The runner falls back to the user's default browser. The page still wires up clicks, but `window.close()` is denied — the runtime shows a clean "selection sent — close this tab" overlay so the flow still terminates cleanly.
- **Page opened directly via `file://` (not via the runner).** The runtime detects the missing back-channel and shows an overlay with the JSON payload + a "Copy JSON" button so the user can paste the selection back into the chat.
- **Timeout without a click.** The runner returns `{"id":null,"reason":"timeout"}`. For purely explanatory pages, this is fine — open your reply with "I generated the page; let me know what you want to do" instead of asking about a phantom selection.
- **`surf` CLI missing.** Skip image generation; the page must stand on its own with CSS and typography. Never let an absent `surf` block page generation.
- **Mermaid render failure.** Inspect the JS console for `Syntax error in text` (typically a `stateDiagram-v2` label with parens/colons/`<br/>`) — switch to `flowchart TD` for richer label support. See the `stateDiagram-v2` notes in the diagram-types reference.
- **TikZ/MathJax silent failures.** A single LaTeX error inside any `.ve-tikz` block crashes the WASM runtime and silently blocks every later diagram on the same page. If the user reports "I see only the title and the legend", inspect the JS console for `! LaTeX Error` lines and identify which diagram crashed the run. See "TikZJax limitations & substitutions" in the interactive-selection reference.
- **Vercel deploy errors (`/amvcp-share-page`).** Confirm the `vercel-deploy` skill is installed (`npm skills install vercel-deploy`). Other harnesses can generate and open HTML normally without it.
- **Always check the browser console first** when something visible is missing — most failures (Mermaid, TikZ, regex panel, snippet popup) emit a console message identifying which block crashed.

## Examples

### Example 1 — Quick architecture diagram

User: *"Show me the architecture of the auth subsystem."*

1. Author `auth-architecture.html` with `flowchart TD` (8 nodes, gold accent, Editorial aesthetic).
2. Wire each node with `click X call veSelectMermaid("X","Label")`.
3. Run the selection runner with the default 600s timeout.
4. The user clicks the `JWT` node → runner emits `{"kind":"submit","count":1,"selections":[{"kind":"element","id":"ve-node-JWT","type":"mermaid-node","label":"JWT"}]}`.
5. Reply: *"You selected the element **JWT** (`mermaid-node: ve-node-JWT`). What do you want me to do about it?"*

### Example 2 — Comparison table that asks a question

User: *"Compare these three caching strategies and let me pick one."*

1. Author `caching-comparison.html` with a `<table data-ve-type="table-form" data-ve-mode="single">`. Each row is a strategy. The runtime injects radio controls + a Submit button.
2. Open with the runner.
3. The user picks "LRU with TTL" → runner emits `{...,"selections":[{"kind":"element","data":{"question":"Pick a strategy","selected":[{"label":"LRU with TTL"}]}}]}`.
4. Reply: *"You answered **Pick a strategy** with **LRU with TTL**. Proceeding."*

### Example 3 — Agent report as a commentable interactive page

User: *"Render this audit report as an interactive page so I can comment on each finding."*

1. Run `/amvcp-interactive-report audit.md` (renderer + transport).
2. In a separate session, run `/amvcp-respond-to-comment --queue-dir <q> --watch --source audit.md` (responder loop).
3. The user opens the page, types a reply on Finding 3, hits Submit.
4. The responder picks up `<threadId>.jsonl`, dereferences `commentId` via `audit.idmap.json`, writes `<threadId>.reply.2.json` atomically.
5. The page polls and renders the reply within ~2s. Per-finding decision toggles (approve/reject — both off = skip) emit decision-only turns into per-finding JSONL files. See the modal-comments reference for the full schema.

### Example 4 — Slide deck from a plan

User: *"Turn this implementation plan into a slide deck."*

1. Read the slide-deck-mode and slide-patterns references. Inventory the source (sections, decisions, file lists, etc.).
2. Pick a preset (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean) and commit.
3. Author the deck — every section, decision, data point from the source must appear as a slide. A 22-slide deck that covers everything beats a 13-slide deck that drops 40% of content.
4. Open with the runner (the deck is interactive; clicking a slide element returns its label).

## Resources

### Reference files (in this skill)

All reference files live in `./references/` next to this SKILL.md. Each ships with its own complete table of contents at the top — open the file and read the relevant section. Names below are the kebab-case file stems (the file name minus `.md`).

- **interactive-selection** — selection wire format, payload schemas, Mermaid/Chart.js wiring, table-form mode, prose mode (paragraph numbering, text snippets), math/LaTeX with KaTeX + mhchem, the Graphviz cookbook, TikZJax limitations and substitutions, runner-process pitfalls, inlining the runtime for single-file portability, future extensions. Read this every time you generate HTML.
- **css-patterns** — theme setup, background atmosphere, link styling, card components, code blocks, directory tree, overflow protection, Mermaid container chrome, grid layouts, connectors, animations, sparklines, responsive breakpoints, badges, lists, KPI/metric cards, before/after panels, collapsible sections, prose elements, generated images.
- **libraries** — Mermaid.js (themed diagrams), Chart.js (bar/line/pie/area), anime.js (orchestrated animations), Google Fonts pairings.
- **styling-guide** — aesthetic directions, typography, colour and palette, surfaces and depth, background atmosphere, visual weight and hierarchy, animation rules, Mermaid theming and containers, AI-generated illustrations.
- **diagram-types** — when to use each approach: Architecture (text-heavy/topology/hybrid), flowcharts, sequence, data flow, schema/ER, state machines, mind maps, class diagrams, C4 (flowchart pattern), data tables, timeline/roadmap, dashboard, implementation plans, documentation, prose accents.
- **anti-patterns** — AI-slop tells to avoid: typography (Inter/Roboto), colour palette (violet/cyan/magenta accents, gradient text, glowing shadows), section headers (emoji icons), layout/hierarchy (uniform card grids), template patterns (three-dot chrome, KPI gradients), and the Slop Test.
- **responsive-nav** — layout structure, CSS, scroll-spy JavaScript, adaptation notes for multi-section pages.
- **runtime-bug-patterns** — v2 modal (hover-bridge, resume polling on reopen, atomic save of pending placeholder), ve-regex (per-mount undo/redo history, case-insensitive Z for Cmd-Shift-Z, shift+click extends selection, wide regex per-graph horizontal scroll), the common shape, running the test suite. Read before editing the runtime.
- **slide-patterns** — planning a deck from a source document, slide engine base, typography scale, cinematic transitions, navigation chrome, SlideEngine JavaScript, auto-fit, slide type layouts, decorative SVG, proactive imagery, compositional variety, presentation readability, content density limits, responsive height breakpoints, curated presets.
- **slide-deck-mode** — when to switch into slide-deck mode, content completeness, slide types and visual richness, compositional variety, curated presets, the `--slides` flag on existing prompts.
- **modal-comments** — when to use, two halves of the round-trip (renderer + responder), wire format on disk, responding to comments, page-side guarantees, v3 per-element decision toggles (approve/reject — both off = skip), when NOT to use v2 modal comments.
- **sharing-pages** — overview, usage, example, how `/amvcp-share-page` works, requirements, notes.

### Templates

- `templates/architecture.html` — text-heavy architecture overviews.
- `templates/mermaid-flowchart.html` — flowcharts, sequence, ER, state, mind maps, class, C4.
- `templates/data-table.html` — passive tables and table-form (radio/checkbox) mode.
- `templates/slide-deck.html` — slide-deck reference with all 10 slide types.

### External libraries (CDN, optional)

- **Mermaid.js** — flowcharts, sequence, ER, state, mind maps, class diagrams.
- **Chart.js** — bar, line, pie, area charts in dashboards.
- **anime.js** — orchestrated multi-element animations.
- **KaTeX** + **mhchem** — math and chemistry notation (auto-loaded by the runtime when a `.ve-math` element is present).
- **TikZJax** — static TikZ figures (auto-loaded when a `.ve-tikz` element is present, ~3 MB).
- **Graphviz** (via viz.js) — directed graphs (auto-loaded when a `.ve-graph` element is present).
- **regex-vis** (vendored) — interactive regex visualizer + editor (auto-loaded when a `.ve-regex` element is present).
- **Google Fonts** — DM Sans, Instrument Serif, IBM Plex, Bricolage Grotesque, Plus Jakarta Sans, Fira Code, JetBrains Mono, Azeret Mono, Fragment Mono.

## Quality Checks

Before delivering, verify:

- **The squint test.** Blur your eyes. Can you still perceive hierarchy? Are sections visually distinct?
- **The swap test.** Would replacing your fonts and colors with a generic dark theme make this indistinguishable from a template? If yes, push the aesthetic further.
- **Both themes.** Toggle the OS between light and dark mode. Both should look intentional, not broken.
- **Information completeness.** Does the diagram actually convey what the user asked for? Pretty but incomplete is a failure.
- **No overflow.** Resize the browser to different widths. No content should clip or escape its container. Every grid and flex child needs `min-width: 0`. See "Overflow Protection" in the css-patterns reference.
- **Mermaid zoom controls.** Every `.mermaid-wrap` container must have +/−/reset/expand buttons, Ctrl/Cmd+scroll zoom, click-and-drag panning, and click-to-expand. The full pattern (including `openMermaidInNewTab()`) is in the css-patterns reference.
- **No anti-patterns.** Run the page against the anti-patterns reference. The Slop Test: would a developer immediately think "AI generated this"?
- **File opens cleanly.** No console errors, no broken font loads, no layout shifts.
