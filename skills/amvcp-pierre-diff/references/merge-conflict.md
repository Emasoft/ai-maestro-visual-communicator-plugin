# Merge conflict viewer — `UnresolvedFile`

## Table of Contents

- When to use
- Minimal example
- Resolution UI
- Three-way (diff3) conflict markers
- Selection / Submit payload
- Streaming resolution to the agent
- Performance
- Cross-references

Pierre's `UnresolvedFile` class renders a three-way merge view for
git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). Each
conflict region exposes a resolve UI — pick `ours`, pick `theirs`,
edit the result, or split the region into two. The resolved file
emits as a single `text` payload on Submit.

## When to use

Use `UnresolvedFile` for any of:

- A `git merge` produced conflict the agent must help resolve.
- A patch the agent applied that resulted in `<<<<<<<` markers.
- A three-way merge surfaced from a parent agent (e.g. "the user
  edited the file in two branches simultaneously — render the
  conflict and ask which side to keep").

Do NOT use `UnresolvedFile` for:

- A plain unified diff with no conflict markers → use `FileDiff`.
- A multi-file conflict — instantiate one `UnresolvedFile` per
  conflicting file; the orchestrator joins the payloads.

## Minimal example

```js
import { UnresolvedFile } from './amvcp-pierre-diff.mjs';

const conflictText = `function greet(name) {
<<<<<<< ours
  return \`Hello, \${name}!\`;
=======
  return \`Hi \${name}!\`;
>>>>>>> theirs
}`;

const view = new UnresolvedFile({
  container: document.querySelector('[data-ve-id="merge-1"]'),
  text: conflictText,
  filename: 'src/greet.ts',
  options: {
    lang: 'typescript',
    theme: { dark: 'pierre-dark', light: 'pierre-light' },
    layout: 'stacked',   // ALWAYS stacked — three columns don't fit
    showBase: false,     // toggle on if a `|||||| base` marker is present
  },
});
await view.render();
```

## Resolution UI

Each conflict region renders three sub-blocks:

| Block | Label | Action |
|---|---|---|
| `ours` (top) | "Keep ours" button | Drop `theirs`, keep `ours` text |
| `theirs` (bottom) | "Keep theirs" button | Drop `ours`, keep `theirs` text |
| (combined region) | "Keep both" / "Edit" buttons | "Keep both" concatenates ours + theirs; "Edit" turns the region into a contenteditable textarea so the user can type the resolution |

If `showBase: true` is set AND the conflict marker block includes a
`||||||| base` section (git's diff3 style), a third "Keep base"
button appears.

## Three-way (diff3) conflict markers

Pierre handles BOTH the default two-way conflict format AND the
three-way (`diff3`) format git produces with `merge.conflictStyle =
diff3`:

```text
<<<<<<< HEAD
new code
||||||| merged common ancestors
original
=======
their code
>>>>>>> branch
```

Set `options.showBase: true` for diff3. When omitted on a diff3
file, the base block is hidden but still tracked in the resolved
payload (so an upstream consumer can re-mark or re-render the
base side later).

## Selection / Submit payload

`UnresolvedFile` does NOT emit per-line selection entries while the
user is resolving. On Submit, it emits ONE entry per file:

```json
{
  "kind": "pierre-merge-resolution",
  "diffId": "merge-1",
  "file": "src/greet.ts",
  "resolved": true,
  "text": "function greet(name) {\n  return `Hi ${name}!`;\n}",
  "regions": [
    {
      "lineStart": 2,
      "lineEnd": 4,
      "decision": "theirs",
      "ours": "  return `Hello, ${name}!`;",
      "theirs": "  return `Hi ${name}!`;"
    }
  ]
}
```

- `resolved: true` ONLY when every conflict region has a decision;
  otherwise `false` and `text` contains the original (still
  conflicted) content.
- `regions[]` records the per-region decision so the orchestrator
  can show "what did the user pick where" even if the resolved
  text alone doesn't preserve that.

## Streaming resolution to the agent

After a Submit, the orchestrator typically wants to immediately
write the resolved text back to disk:

```js
// agent-side after the selection lands
const entry = selection.find(s => s.kind === 'pierre-merge-resolution');
if (entry && entry.resolved) {
  await writeFile(entry.file, entry.text);
}
```

If only some regions were resolved (`resolved: false`), surface the
remaining regions in a follow-up prompt — do NOT auto-pick a side.

## Performance

`UnresolvedFile` uses the same virtualizer as `FileDiff`. For files
with many small conflict regions (40+), Pierre groups regions
visually but virtualizes per-line as usual.

## Cross-references

- [`annotation-contract`](./annotation-contract.md) — `UnresolvedFile` does NOT accept `lineAnnotations` (resolution UI replaces it).
- [`layout-choice`](./layout-choice.md) — `stacked` is mandatory; `split` raises a console warning and falls back.
- Parent: [`SKILL.md`](../SKILL.md).
- Sibling: [`amvcp-code-diff`](../../amvcp-code-diff/SKILL.md) — CSS-only two-pane diff (no merge support).
