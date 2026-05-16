# ASCII tree and hierarchy

The ASCII variant of `tree-hierarchy-diagram.md` — file-system
trees, package hierarchies, taxonomies, drawn with monospace
characters. Use when the audience reads in a terminal, in a code
comment, or when the diagram needs to survive plain-text rendering.

## When to choose ASCII trees

Use ASCII trees when:

- Showing a **file-system structure** in a README, a code
  comment, or a CLI output (the canonical `tree` command shape).
- The output must survive with JavaScript disabled.
- The tree has 5-25 nodes (past that, ASCII gets visually
  noisy).
- The audience prefers terminal aesthetics (developer-facing
  docs).

Do NOT use ASCII trees when:

- The tree has 50+ nodes (use SVG with collapse).
- The hierarchy has rich per-node metadata (badges, dates,
  authors) — ASCII can't render those well.
- The reader expects interactivity (click to expand) — that's
  SVG territory.

## Authoring

```html
<pre class="ve-ascii-diagram"
     data-ve-ascii-style="detailed"
     data-ve-ascii-selectable="1">
src/
├── components/
│   ├── Button.tsx          ← 142 LOC
│   ├── Form.tsx            ← 88 LOC
│   └── Modal.tsx           ← 312 LOC ⚡ hot
├── hooks/
│   ├── useAuth.ts
│   └── useDebounce.ts
├── lib/
│   ├── api.ts
│   ├── db.ts               ← 540 LOC ⚡ hot
│   └── utils.ts
└── pages/
    ├── index.tsx
    ├── login.tsx           ← changed in PR
    └── dashboard.tsx       ← changed in PR
</pre>
```

## Glyph vocabulary

The four standard tree glyphs:

| Glyph | Use |
|---|---|
| `├──` | branch with more siblings below |
| `└──` | last branch (no more siblings below) |
| `│  ` | vertical bar continuing the parent's path |
| `   ` | three spaces where the parent had no more siblings |

Combined, they produce the classic Unix `tree` look:

```
parent/
├── child1
├── child2
│   ├── grand1
│   └── grand2
└── child3
```

Notice how `child2`'s subtree uses `│   ` to keep the parent's
column visible, but `child3`'s subtree (if it had children)
would use `    ` (three spaces) because there are no more
siblings below `child3`.

## Annotations

ASCII trees benefit from inline annotations:

- File sizes: `Button.tsx     ← 142 LOC`
- Status markers: `db.ts          ⚡ hot`
- Change markers: `login.tsx      ← changed in PR`
- Badges: `index.tsx      [route]` or `index.tsx      [+12 −3]`

Keep the column for annotations aligned (pad with spaces so all
annotations start at the same column). This makes the tree
scannable.

## Alternative glyph styles

| Style | Glyphs | Use |
|---|---|---|
| `detailed` (default) | `├──`, `└──`, `│  ` | the standard Unix tree |
| `unicode` | same, no annotations | compact |
| `classic` | `|+--`, `|--`, `|  ` | ASCII-only (pre-Unicode terminals) |
| `compact` | `parent/child/grandchild` | path-style, one node per line |

The `classic` style:

```
src/
|-- components/
|   |-- Button.tsx
|   |-- Form.tsx
|   `-- Modal.tsx
|-- hooks/
|   |-- useAuth.ts
|   `-- useDebounce.ts
`-- pages/
    |-- index.tsx
    `-- dashboard.tsx
```

(Use a backtick for the last branch, hyphens for horizontal,
pipes for vertical.)

The `compact` style is for inline references in prose:

```
The auth flow lives in src/lib/api.ts and src/hooks/useAuth.ts,
called from src/pages/login.tsx.
```

## Indentation depth

Each nesting level is **4 characters wide** by convention:

- `├──` is 3 chars + 1 space = 4 chars.
- The next level's bar (`│   ` for non-last sibling) is also 4
  chars.

This 4-char width is the most common convention and works well
visually. Some authors use 2-char width for very deep trees:

```
src/
+- a/
|  +- aa/
|  |  +- aaa/
|  |  `- aab/
|  `- ab/
`- b/
```

Pick one and stick with it across the project.

## Folder vs file distinction

Convention: folders end with `/`:

```
src/
├── components/
│   └── Button.tsx
└── utils.ts
```

`utils.ts` is a file (no trailing `/`); `components/` is a
folder (trailing `/`). The trailing slash mirrors the shell
`ls -F` convention and is universally readable.

## Hot files / changed files highlighting

For a PR review or audit, mark hot files with a glyph and color
in CSS:

```css
.ve-ascii-diagram .hot-line {
  color: var(--vc-color-danger);
  font-weight: var(--vc-weight-bold);
}
```

Apply via a post-process step that wraps `← changed in PR` and
`⚡ hot` annotations in `<span class="hot-line">`.

Caveat: spans inside `<pre>` work fine; the monospace assumption
is preserved. But you lose the pure-plain-text property (copy-
paste preserves the text but not the highlighting).

## Authoring with the `tree` command

For a real file-system tree, generate the ASCII automatically:

```bash
tree -L 3 --noreport --dirsfirst src/
```

Then paste the output into the `<pre>`. Match the conventions
the `tree` command uses (which align with the conventions above).

## DESIGN.md tokens consumed

Same as `ascii-diagrams.md`:

| Group | Tokens |
|---|---|
| color | `--vc-color-content`, `--vc-color-surface-sunken`, `--vc-color-border` |
| typography | `--vc-font-mono`, `--vc-text-1` |
| radius | `--vc-radius-md` |

## Selection atoms

The whole `<pre>` is one optional atom. Per-line selection (each
file is a clickable atom) requires manual wiring — wrap each line
in a `<span data-ve-id="...">` and bind click handlers. Most use
cases don't need per-line selection.

## Variations

### Tree with code-block siblings

A common composition: an ASCII tree explaining a structure, with
a code block showing the actual file content:

```html
<div class="ve-tree-with-code">
  <pre class="ve-ascii-diagram">
src/lib/
├── api.ts
└── db.ts          ← this file
  </pre>
  <pre class="ve-code-block"><code>
// src/lib/db.ts
export async function query(sql: string) { ... }
  </code></pre>
</div>
```

CSS grids them side-by-side at wide viewports, stacks at narrow.

### Tree with hover-link-to-file

For doc pages where each file in the tree should link to its
own page, wrap each leaf in an `<a>`:

```html
<pre class="ve-ascii-diagram">
src/
├── components/
│   ├── <a href="/docs/components/Button">Button.tsx</a>
│   └── <a href="/docs/components/Modal">Modal.tsx</a>
└── ...
</pre>
```

Inline `<a>` inside `<pre>` works correctly; the monospace
layout is preserved.

## Anti-patterns

- Mixing 2-char and 4-char indentation in the same tree:
  visually broken.
- Forgetting the trailing `/` on folders: ambiguous.
- Tabs instead of spaces: tabs render at different widths in
  different fonts; the alignment breaks.
- Annotations at different columns per line: the eye can't
  scan; pad annotations to a consistent column.
- Emoji folders (`📁 src/`): double-width breaks the
  alignment.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- All branches align vertically (the `│` column is consistent).
- Annotations align at one column (scannable).
- Hot-line highlighting (if used) renders correctly at both
  themes.
- The `<pre>` is `overflow: visible` (no inner scrollbar).
