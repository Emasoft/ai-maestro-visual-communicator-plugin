# Sub-technique B4 — Code block with file-path label

A mono-font header line inside a code block that names the file the
code came from. Mined from `12-incident-report`, `16-implementation-
plan`, `17-pr-writeup` — the provenance pattern used by every PR-
review / postmortem / implementation-plan composition.

The pattern: `<span class="path">infra/config/workers.yaml</span>` as a
gray-500 mono header inside the code block. Adopted as the
`.ve-code-path` element this skill scaffolds.

## B4.1 What it does

Renders a file path as a small mono-font label above a code block,
visually attached to the block (shared corners, shared background-on-
slate-panel, shared file-type-icon row when present). The reader can
tell at a glance which file the snippet came from — essential for any
multi-file context.

Common contexts:
- PR-review diff cards (every file gets its name)
- Postmortem code excerpts (the file that contains the buggy line)
- Architecture explainer steps (`auth.ts:42-67`)
- Implementation-plan code samples (the migration SQL is in `db/migrations/202604_task_comments.sql`)

## B4.2 The markup

```html
<div class="ve-code-block ve-code-panel-slate">
  <div class="ve-code-path">
    <svg class="ve-code-path__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <!-- inline file-type icon — see B4.4 -->
    </svg>
    <span class="ve-code-path__name">src/auth/middleware.ts</span>
    <span class="ve-code-path__lines">L42-L67</span>      <!-- optional -->
  </div>
  <pre><code class="language-typescript">…</code></pre>
</div>
```

The three children of `.ve-code-path`:

| Element | Purpose |
|---|---|
| `.ve-code-path__icon` | Optional file-type SVG (yaml / ts / sql / md / py glyph). 14×14, stroke=currentColor. |
| `.ve-code-path__name` | The path itself, mono-font, gray-500. ALWAYS present. |
| `.ve-code-path__lines` | Optional line range (`L42-L67`, `L42` for one line). Smaller, dimmer. |

The path is selectable (highlight + copy) — readers often want to paste
the path into their terminal. NOT a link by default; the parent
composition skill decides whether to make it one.

## B4.3 The CSS

```css
.ve-code-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  color: var(--vc-color-neutral-500);
  padding: 8px 12px 4px;
}
.ve-code-path__icon {
  flex: 0 0 auto;
  color: var(--vc-color-neutral-500);
}
.ve-code-path__name {
  font-weight: 400;
  letter-spacing: -0.005em;
  flex: 1 1 auto;
  /* No truncation — let it wrap if the path is very long (no-nested-
     scrollbars rule applies even to a one-line label) */
  overflow-wrap: anywhere;
}
.ve-code-path__lines {
  flex: 0 0 auto;
  font-size: calc(var(--vc-text-small) - 1px);
  color: var(--vc-color-neutral-400);
}
```

On a slate panel, the path inherits the panel's background — see
[slate-bg-code-panel.md](./slate-bg-code-panel.md) §B3.8 for the
combined CSS.

On a default (non-slate) code block, the path renders ABOVE the `<pre>`
border with its own light background:

```css
.ve-code-block:not(.ve-code-panel-slate) > .ve-code-path {
  background-color: var(--vc-color-neutral-50);
  border: 1px solid var(--ve-accent);
  border-bottom: none;
  border-radius: var(--vc-radius-md) var(--vc-radius-md) 0 0;
}
.ve-code-block:not(.ve-code-panel-slate) > .ve-code-path + pre {
  border-radius: 0 0 var(--vc-radius-md) var(--vc-radius-md);
}
```

## B4.4 The file-type icon glyphs

A small set of inline SVGs keyed on file extension. The icon is
optional — a label without the icon is still correct.

| Extension | Glyph (semantic) | When to render |
|---|---|---|
| `.ts` / `.tsx` / `.js` / `.jsx` / `.mjs` | curly braces `{}` | Default for "source code" |
| `.py` | small `>>>` REPL prompt | Python files |
| `.sql` | small database cylinder | SQL migrations |
| `.json` / `.yaml` / `.toml` | curly braces with a dot inside | Config files |
| `.md` | sheet with horizontal lines | Markdown |
| `.sh` / `.bash` / `.zsh` | `$_` prompt | Shell scripts |
| `.html` / `.svg` / `.xml` | `< >` angle brackets | Markup |
| `.css` / `.scss` / `.less` | `:` colon (the CSS property delimiter) | Stylesheets |
| no extension or unknown | generic file outline | Fallback |

Authors should NOT use emoji file icons (`📄`, `🐍`, etc.) — they
render inconsistently across platforms and break screen-reader
announcements. Inline SVG only.

## B4.5 The line range

When the snippet shows only PART of a file, the line range tells the
reader where to find the source. Format:

| Range | Render |
|---|---|
| One line | `L42` |
| Multiple consecutive | `L42-L67` |
| Multiple ranges | `L42-L67, L91-L98` (rare; usually use two snippets) |

The line range is **informational** — the actual line numbers in the
gutter restart at 1 (or whatever the runtime renders). To preserve the
source line numbers, see the `data-ve-line-start` opt-in pattern in
[gutter-anatomy.md](./gutter-anatomy.md) (line-start offset).

## B4.6 Multi-language file paths

A `tsx` path correctly named: `src/components/Button.tsx`. The icon is
the JS-family curly-braces (since `tsx` shares the `js` table — see
[language-resolution.md](./language-resolution.md)). The language class
on the `<code>` is `language-tsx` for clarity.

A multi-language file (e.g. an HTML file with embedded `<script>` and
`<style>`): use one path label + one code block with `language-html`.
The HTML language's tag-aware sub-pass handles tag colouring; the
embedded script/style content stays plain. If the script content is
critical and you want it highlighted, render two separate blocks with
two paths (`src/page.html#L1-L15` and `src/page.html#L16-L40 [script]`).

## B4.7 The selection contract

The `.ve-code-path` is NOT a `.ve-code-line` — it's not part of the
runtime's gutter machinery, not part of the selection model. Clicking
on the path doesn't enter the code-block selection state. Hovering the
path doesn't trigger the 3-state outline.

If the parent composition (e.g. PR review) wants the file label to be
clickable (jump to the file's section, anchor link), wrap the path in
an `<a>`:

```html
<div class="ve-code-path">
  <a href="#file-auth-middleware" class="ve-code-path__name">src/auth/middleware.ts</a>
  <span class="ve-code-path__lines">L42-L67</span>
</div>
```

The `<a>` should be the path NAME only (not the line range — line
ranges usually anchor to a different target).

## B4.8 The provenance discipline

A file-path label IS a provenance marker. The reader sees "this code
comes from THIS file at THESE lines". Don't lie:

- The path must EXIST in the project. A path that doesn't exist is a
  bug in the docs.
- The line range must MATCH what the snippet shows.
- The icon must MATCH the extension.

When the AI Maestro agent generates a code-display fixture, it should
verify all three before publishing — these are correctness gates, not
cosmetic details. A wrong path makes the entire snippet untrustworthy.

## B4.9 Pair with code-block-with-tab-bar

When the same file has multiple variants (e.g. "before" and "after"
versions), the tab-bar pattern (see
[code-block-with-tab-bar.md](./code-block-with-tab-bar.md)) supersedes
the file-path label — the tab bar serves both as title AND as variant
selector. A single file-path label is for single-snippet blocks.

## B4.10 Tokens consumed

- `--vc-font-mono` — the mono font
- `--vc-text-small` — the small font size
- `--vc-color-neutral-500` — the path text colour
- `--vc-color-neutral-400` — the line-range text colour (dimmer)
- `--vc-color-neutral-50` — the non-slate path label bg
- `--vc-radius-md` — the shared corner radius
- `--ve-accent` — the non-slate path label border

## B4.11 Author rules

| Rule | Why |
|---|---|
| Always include the path on PR-review, postmortem, implementation-plan code blocks | Provenance is load-bearing for these compositions |
| Optionally include the line range when the snippet shows partial file | Cheap, useful |
| Use the inline SVG icon, not emoji | Cross-platform / screen-reader correctness |
| Keep the path FULL (`src/auth/middleware.ts`, not `middleware.ts`) | Disambiguates files with the same name in different dirs |
| Don't truncate via CSS — wrap is correct | No-nested-scrollbars; very long paths are rare |
| Do NOT add the path to inline-prose code chips | Inline code is by definition pathless |
