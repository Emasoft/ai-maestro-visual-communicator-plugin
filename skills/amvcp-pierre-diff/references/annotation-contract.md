# Annotation contract — line comments, accept/reject, suggested changes

## Table of Contents

- Schema
- Anchoring rules
- Discriminator field — what the agent emits, what the user clicks
- Wiring annotations into the page
- Selection payload shape
- Author / theme integration
- Cross-references

Pierre's `FileDiff` accepts a `lineAnnotations` option (and per-side
`oldLineAnnotations` / `newLineAnnotations` for split layouts) that
lets the agent inject inline markers on specific diff lines. The
markers appear as a small badge inside the gutter; clicking one opens
an inline annotation card where the user can type a reply or pick
from `accept` / `reject` buttons.

## Schema

`lineAnnotations` is an array of `LineAnnotation` objects:

```ts
type LineAnnotation = {
  /** Side of the diff this anchors to. */
  side: 'old' | 'new' | 'both';
  /** 1-based line number on the chosen side. */
  line: number;
  /** Discriminator for downstream selection-payload routing. */
  kind: 'comment' | 'suggestion' | 'review';
  /** Required for `kind: 'comment'` — the prefilled comment body. */
  body?: string;
  /** Required for `kind: 'suggestion'` — the proposed replacement text. */
  replacement?: string;
  /** Optional reviewer ID / avatar URL — appears in the bubble header. */
  author?: { name: string; avatar?: string };
  /** Optional accept/reject pair — when present, renders the two-button UI. */
  decision?: 'pending' | 'accepted' | 'rejected';
  /** Optional resolver-state — when `true`, renders the bubble as resolved. */
  resolved?: boolean;
};
```

A single line MAY carry multiple annotations (e.g. one comment +
one suggestion); they stack vertically in their own column to the
right of the line.

## Anchoring rules

- `side: 'old'` anchors to the pre-image only; when the diff is in
  `layout: 'stacked'` the annotation appears next to the `-` line.
- `side: 'new'` anchors to the post-image only; in `stacked` it
  appears next to the `+` line.
- `side: 'both'` anchors to a context (`ctx`) line — required when
  the annotation is on an unchanged line that's present on both
  sides. The annotation appears once, anchored to the right of the
  unchanged line in stacked layout, or in the gutter between the two
  columns in split layout.

If `side` is `'old'` or `'new'` but the corresponding line is
absent from the patch (e.g. the file was deleted), the annotation
is silently dropped — the renderer logs a `console.warn` but does
not throw.

## Discriminator field — what the agent emits, what the user clicks

| `kind` | Renders as | User interaction | Multi-select entry |
|---|---|---|---|
| `comment` | Speech-bubble badge with the comment body inline | Click the bubble → focus a textarea pre-seeded with `body` → Submit appends `{action: 'comment-reply', text}` to the selection | `{kind: 'pierre-diff-line', annotation: {kind: 'comment', text}}` |
| `suggestion` | Replacement-block badge with the proposed text inline | Click the badge → see a diff between the original line and `replacement` → Accept / Reject buttons | `{kind: 'pierre-diff-line', annotation: {kind: 'suggestion', decision: 'accepted' \| 'rejected'}}` |
| `review` | Compact reviewer-status pill | Click → opens the legacy comment-thread modal (parity with `amvcp-modal-comments`) | `{kind: 'pierre-diff-line', annotation: {kind: 'review', resolved, decision}}` |

## Wiring annotations into the page

```js
import { FileDiff } from './amvcp-pierre-diff.mjs';

const annotations = [
  // Plain comment on a new-side line
  { side: 'new', line: 42, kind: 'comment',
    body: 'Should this also handle the null case?' },

  // Suggested change on an old-side line
  { side: 'old', line: 17, kind: 'suggestion',
    replacement: 'return value ?? 0;',
    author: { name: 'agent' } },

  // Approval pill on a context line
  { side: 'both', line: 85, kind: 'review',
    decision: 'accepted', resolved: true,
    author: { name: 'reviewer-bot' } },
];

const instance = new FileDiff({
  container: document.querySelector('[data-ve-id="diff-1"]'),
  patch,
  options: {
    layout: 'split',
    lang: 'typescript',
    lineAnnotations: annotations,
  },
});
await instance.render();
```

## Selection payload shape

When the user submits, each annotation interaction lands in the
multi-select payload alongside the per-line selections:

```json
[
  {
    "kind": "pierre-diff-line",
    "diffId": "diff-1",
    "file": "src/foo.ts",
    "side": "new",
    "lineNew": 42,
    "content": "  return value + 1;",
    "annotation": {
      "kind": "comment",
      "text": "Should this also handle the null case?\n\n— user reply: yes, add an `?? 0` fallback"
    }
  },
  {
    "kind": "pierre-diff-line",
    "diffId": "diff-1",
    "file": "src/foo.ts",
    "side": "old",
    "lineOld": 17,
    "content": "  return value;",
    "annotation": {
      "kind": "suggestion",
      "decision": "accepted",
      "replacement": "return value ?? 0;"
    }
  }
]
```

The orchestrator agent reads the `annotation.kind` field first to
route the action (apply the suggestion, reply to the comment,
mark the review resolved).

## Author / theme integration

- `author.name` is rendered with the page's `--vc-font-mono` token
  when present, falling back to system-ui.
- `author.avatar` (when set to an HTTPS URL) is loaded `eager`
  with `referrerpolicy="no-referrer"` and `crossorigin="anonymous"`
  to avoid leaking the diff page URL upstream.
- Bubble colours derive from `--vc-accent`, `--vc-success`,
  `--vc-danger` (the same tokens used by `amvcp-modal-comments`).

## Cross-references

- [`layout-choice`](./layout-choice.md) — picking between split vs stacked changes annotation column placement.
- [`streaming-codeview`](./streaming-codeview.md) — `FileStream` doesn't support annotations (single-pane, in-progress code).
- [`merge-conflict`](./merge-conflict.md) — `UnresolvedFile` uses its own resolution UI, NOT `lineAnnotations`.
- Parent: [`SKILL.md`](../SKILL.md).
- Sibling: [`amvcp-modal-comments`](../../amvcp-modal-comments/SKILL.md) — the standalone per-element comment thread that `kind: 'review'` mirrors.
