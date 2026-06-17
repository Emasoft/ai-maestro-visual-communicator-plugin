---
name: amvcp-doc-wiki
description: "Turns a project's design/memory markdown — TRDD task docs, the PRRD rules file, the kanban board, and wikimem notes — into ONE self-contained navigable HTML wiki with Wikipedia-style cross-file links, browser back/forward, a breadcrumb trail, and search; opens via file://, no server, light+dark. Use when visualizing TRDD/PRRD/kanban/wikimem docs, building a navigable design-doc wiki, or browsing project docs with clickable cross-references. Trigger with 'doc wiki', 'design-doc wiki', 'visualize TRDD', 'render the kanban board', 'browse the design docs', 'navigable PRRD', 'wikimem viewer'."
license: MIT
metadata:
  author: Emasoft
---

# Doc-wiki — the design-docs navigable-wiki coordinator

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills. This is a **supporting / coordinator** skill, not one of the 13 generic primitives.

## Overview

This skill builds ONE self-contained `.html` "wiki" of a project's design and
memory artifacts — **TRDD** task docs, the **PRRD** rules file, the **Kanban**
board derived from them, and **wikimem** notes — with Wikipedia-style
cross-file navigation: clickable links between docs, browser back / forward via
hash history, a sticky breadcrumb trail, and search. The output opens straight
from `file://` (no server, no build step beyond the one Python command), is
themed light + dark, and embeds every rendered doc so it is fully portable.

It is a **coordinator**: it composes the markdown-rendering of
[`amvcp-prose-pages`](../amvcp-prose-pages/SKILL.md), the tabular frontmatter
cards of [`amvcp-tables`](../amvcp-tables/SKILL.md), the board UX of
[`amvcp-interactive-controls`](../amvcp-interactive-controls/SKILL.md), and the
comment layer of [`amvcp-modal-comments`](../amvcp-modal-comments/SKILL.md) into
one navigable artifact, plus a small hash-routed SPA shell that the other skills
do not provide. It does not introduce a new content primitive.

## When to choose this skill

| Job | Use this skill | Use a different skill |
|---|---|---|
| A **set of TRDD / PRRD / kanban / wikimem markdown** files to browse as one cross-linked wiki | YES | A single report page → prose-pages |
| Cross-file navigation (click a `TRDD-<id>` / `PRRD G<n>` / `[[note]]` ref → jump to its page) | YES | One static doc with no inter-doc links → prose-pages |
| A kanban board of TRDD cards, each clicking through to its full task page | YES | A free-standing editable triage board → amvcp-editor-kanban |
| Browser back/forward + breadcrumb across many embedded docs | YES | Single-page scroll-spy TOC → prose-pages / layout |
| One TRDD or PRRD rendered as a lone page (no wiki) | Reach for prose-pages | — |

Mnemonic: **if the deliverable is a *navigable set* of design/memory docs**, you
are in doc-wiki territory. A lone document the reader scrolls top-to-bottom is
prose-pages territory.

## Architecture

```
scripts/amvcp-docwiki.js          — the SPA shell: hash-router, breadcrumb trail,
                                     ◀ ▶ buttons, search box, client-side search.
                                     ES5-safe, dependency-free, self-injects its CSS.
scripts/amvcp-docwiki-build.py    — stdlib-only builder: scans the sources, parses
                                     v2 frontmatter (no yaml dep), renders each doc
                                     with a focused markdown→HTML converter, wires
                                     cross-links, emits ONE self-contained .html
                                     (inlines the shell + token CSS verbatim).
scripts/amvcp-docwiki-search.py   — stdlib-only: memgrep output → wiki results HTML
                                     fragment (the agent search recipe; ≈0 context).
```

The build inlines the shell, so the produced `.html` has zero external
dependencies. Every doc is one `<section data-ve-doc="<route>">`; the shell
shows the active route and hides the rest on each `#/<route>` hashchange.

## Prerequisites

- Python 3.12+ (stdlib only — no pip installs, no `uv --with`, no network).
- A browser to open the result (or the dev-browser for screenshot QA).
- The three scripts above shipped beside each other in `scripts/` (the builder
  locates the shell relative to its own path and inlines it).
- Sources: at least one of `--trdd-dir`, `--mem-dir`, or `--prrd` (below).

## Build CLI

```
python3 scripts/amvcp-docwiki-build.py OUT.html \
    --trdd-dir <dir>        # directory of TRDD-*.md (repeatable)
    [--mem-dir <dir>]       # directory of wikimem *.md notes (repeatable)
    [--prrd <PRRD.md>]      # path to the PRRD rules file
    [--title "…"]           # wiki <title> + home heading (default: "Design Wiki")
```

At least one source is required. `--trdd-dir` and `--mem-dir` are repeatable to
merge several folders; duplicate ids/names are de-duped (first wins, warned on
stderr). A file with no derivable id is skipped with a stderr warning rather
than emitting a broken route. On success the script writes `OUT.html` and prints
a one-line summary to stderr.

## The 4 render mappings

| Thing | Source | Rendered as | Clickable cross-links |
|---|---|---|---|
| **TRDD** | `design/tasks/TRDD-*.md` | frontmatter card (key scalar fields) + body markdown, at route `#/trdd/<8hex>` | `npt` / `eht` / `blocked-by` / `parent-trdd` / `supersedes` / `superseded-by` → target TRDD pages; `relevant-rules` + inline `PRRD G/S<n>` citations → `#/prrd#G<n>` rule anchors |
| **PRRD** | `design/requirements/PRRD.md` | prose + each `- **G64.1** — …` rule as an anchored block (`id="G64"`, by NUMBER so the letter can flip) at `#/prrd` | incoming TRDD citations; in-body `PRRD G/S<n>` → rule anchors |
| **Kanban** | derived from the TRDD `column:` fields | `#/kanban` — a 14-stage board (`backburner … superseded`), non-empty columns as lanes of clickable cards | each card → its `#/trdd/<8hex>` page |
| **wikimem** | a memory dir's `*.md` notes (minus `MEMORY.md` / `memory-index.md`) | frontmatter strip (name / tier / type / description) + body, at `#/mem/<name>` | `[[name]]` / `[[name\|label]]` wikilinks → `#/mem/<name>` |

The id for a TRDD route is its 8-hex (from frontmatter `trdd-id:`, a v1
`**TRDD ID:**` line, or the filename token). A link whose target is **not in the
built set** renders as plain text with a muted "(not in set)" note — the build
NEVER emits a dangling `data-ve-navigate` anchor.

## Search — two paths

1. **Client-side instant search (built into the SPA).** Type in the top-bar box
   → the shell renders a Wikipedia-style results list on `#/search?q=…`, matching
   all whitespace-split terms (AND, case-insensitive, title-hits ranked above
   body-hits) against the already-embedded section text. No separate index, no
   server — fully self-contained. The box prefills from `q` on direct navigation.

2. **Agent recipe for richer / semantic search (≈0 Claude context).** Pipe a
   memgrep run through the helper, which emits the same results-fragment markup:

   ```
   memgrep recall "QUERY" <memdir> --json \
     | python3 scripts/amvcp-docwiki-search.py --query "QUERY" > frag.html
   ```

   Then paste `frag.html` into the wiki's `<section data-ve-doc="search">`
   element. The script maps each result path to its route (`*PRRD.md`→`prrd`,
   `TRDD-*.md`→`trdd/<8hex>`, other `*.md`→`mem/<stem>`, unknown→a plain
   non-navigating row) — so Claude spends ≈0 tokens generating the HTML; the
   script makes it.

## Instructions

1. **Confirm the shape** — a navigable *set* of TRDD / PRRD / kanban / wikimem
   docs (see "When to choose this skill"). A lone doc → prose-pages instead.
2. **Locate the sources** — the TRDD dir(s), optionally the PRRD path and the
   wikimem note dir(s). For an AI-Maestro project these are `design/tasks/`,
   `design/requirements/PRRD.md`, and the `memory/` scope dirs.
3. **Build** — run the Build CLI with the sources you have (≥1). Pick a `--title`
   that names the project.
4. **Open & verify** — open `OUT.html` from `file://`; confirm the home index
   groups TRDDs by column, the board renders, links navigate, and back/forward +
   breadcrumb track the trail. Screenshot light + dark (see Visual verification).
5. **(Optional) richer search** — run the memgrep recipe and paste the fragment
   into the search section.
6. **(Optional) edit round-trip** — to change a doc, edit its source markdown and
   re-build, OR use the comment round-trip (below) to ask Claude to re-emit it.

## Output

A single self-contained `.html`: token CSS + doc CSS in one `<style>`, every doc
as an embedded `<section data-ve-doc>`, the shell inlined in one `<script>`. No
CDN, no build artifacts, no server. Light + dark are both correct because every
paint reads a `--vc-*` / `--ve-control-*` token swapped by the theme attribute
(`html[data-ve-theme]`); a bottom-right toggle flips it. Opens by double-click.

The selection payload (Exportable facet) is the standard amvcp shape — a clicked
`[data-ve-id]` atom feeds `{selections:[…]}` back to Claude via the comment
round-trip.

## The two modes (CLAUDE.md §4)

- **Interaction Design Mode — FIXED.** The signature amvcp UX — selection, hover,
  triple-state feedback, the comment-box round-trip via `scripts/amvcp-runtime.js`
  — is unchanged. The wiki navigation (hash-router, breadcrumb, ◀ ▶, search) is
  **added chrome layered on top**, never a replacement for the fixed interaction
  model. The shell's links are plain `<a href="#/…">` so the browser records real
  history; selection/comment still works on every rendered atom.
- **Graphic Style Mode — VARIABLE.** Every color, font, space, radius is a
  DESIGN.md token (`--vc-*` for content, `--ve-control-*` for chrome). Swap the
  preset / theme and the whole wiki re-themes live; light + dark are always both
  shipped. Zero hardcoded palette.

## The 6 facets (CLAUDE.md §3)

Every amvcp element is all six at once; the doc-wiki realizes them as:

- **Editable** — edit the source markdown and re-build, OR select a rendered
  element and tell Claude "change this …" via the comment round-trip → Claude
  re-emits and you re-build.
- **Commentable** — per-element comment threads via
  [`amvcp-modal-comments`](../amvcp-modal-comments/SKILL.md) (the runtime layer).
- **Compilable** — ONE self-contained `.html` that just opens (file://).
- **Stylizable** — themed live via DESIGN.md tokens (light + dark).
- **Pickable** — selectable `[data-ve-id]` atoms feed the selection payload.
- **Exportable** — the selection payload (and copy-as-markdown of any rendered
  doc) turns UI state back into something the agent can read / commit.

## No nested scrollbars

The board and every page **expand** — the document's own scrollbar is the only
one. There is no inner `overflow:auto` on the kanban board, code blocks, or
tables; a wide board widens the page (per the project no-nested-scrollbars rule).
Text wraps; non-wrappable content (board lanes, `<pre>`, tables) extends the
document instead of getting a private scroll viewport.

## Composability

Composes with every other amvcp-* skill on the same page (R22). The doc-wiki
itself reuses prose-pages (body markdown), tables (frontmatter cards),
interactive-controls (board UX), and modal-comments (threads) — it never
duplicates their primitives. Any rendered doc can in turn embed a chart, diagram,
or code block via the relevant element skill. The SPA shell is the only
wiki-specific layer.

## Error Handling

- **`at least one source is required`** → pass `--trdd-dir`, `--mem-dir`, and/or
  `--prrd`. The build refuses to produce an empty wiki.
- **`--trdd-dir does not exist` / `is not a directory`** → fail-fast on a bad
  path; check the source dir.
- **`shell runtime not found`** → `scripts/amvcp-docwiki.js` must sit beside the
  build script (the builder inlines it by relative path).
- **`WARN: no derivable 8hex id, skipping …`** → a TRDD file has no `trdd-id:`,
  no `**TRDD ID:**` line, and no id token in its filename; give it one of those.
- **`WARN: duplicate 8hex … keeping first`** → two TRDDs share an 8-hex id;
  rename one. Same for duplicate wikimem `name:`.
- **A cross-ref shows "(not in set)"** → the target doc isn't in the built set;
  include its dir in the build if you want the link live (this is correct
  behavior, not a bug — the build never emits a dangling anchor).
- **Links don't navigate / no breadcrumb** → the page wasn't opened as one
  self-contained file, or the inlined shell failed to parse; rebuild.

## Examples

1. **Full project wiki** — `python3 scripts/amvcp-docwiki-build.py wiki.html
   --trdd-dir design/tasks --prrd design/requirements/PRRD.md --mem-dir memory
   --title "My Project — design wiki"`. Home groups TRDDs by the 14 columns;
   `#/kanban` is the board; `#/prrd` the anchored rules; `#/mem/<name>` the notes.
2. **TRDDs only** — drop `--prrd` / `--mem-dir`; the build still emits home +
   kanban + one page per TRDD, and `PRRD G<n>` citations stay plain text (no PRRD
   page to link to).
3. **Memory-only wiki** — `--mem-dir memory` alone renders a wikimem-only wiki
   with `[[name]]` cross-links between notes (no kanban, no TRDD pages).
4. **Agent search** — `memgrep recall "rate limit" memory --json |
   python3 scripts/amvcp-docwiki-search.py --query "rate limit" > frag.html`,
   then paste `frag.html` into the wiki's search section for a richer hit list.
5. **Edit a TRDD via comment** — open the wiki, select the TRDD's frontmatter
   card, tell Claude "bump this to priority 1"; Claude edits the source TRDD and
   you re-build to refresh the wiki.

## Visual verification

For visual verification (does the wiki look right in light, dark, and at width?),
see [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md). Screenshot the
home index and at least one TRDD page in both themes.

## Resources

The three scripts are the whole implementation — this SKILL.md documents them in
full, so there are no extra reference files to open. Cross-referenced skills:

- [amvcp-prose-pages](../amvcp-prose-pages/SKILL.md) — markdown body rendering.
- [amvcp-tables](../amvcp-tables/SKILL.md) — frontmatter / tabular cards.
- [amvcp-interactive-controls](../amvcp-interactive-controls/SKILL.md) — board UX.
- [amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) — comment threads.
