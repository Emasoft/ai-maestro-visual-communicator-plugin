# Streaming codeview — rendering generated code as it lands

## Table of Contents

- When to pick FileStream over FileDiff
- Minimal example
- Append semantics
- Performance — when to virtualize
- Cursor & input
- Stream + annotations
- Selection payload
- Cross-references

Pierre ships a `FileStream` class for the case where the agent is
GENERATING code (streaming token-by-token) and the user wants to
see the output as it lands, with Shiki highlighting reapplied on
each chunk. This is the "live agent terminal" pattern — different
from `FileDiff`, which compares two completed files.

## When to pick `FileStream` over `FileDiff`

| You want… | Pick |
|---|---|
| To show a code generation step-by-step | `FileStream` |
| To show a finished diff (before / after) | `FileDiff` |
| To show generation + final review in one page | Both — `FileStream` first, then on completion swap the container with a `FileDiff` view |
| Streaming WITH a live diff against an existing file | NOT supported in Pierre 1.x — render `FileStream`, on completion compute the diff client-side, then mount a fresh `FileDiff` |

## Minimal example

```js
import { FileStream } from './amvcp-pierre-diff.mjs';

const container = document.querySelector('[data-ve-id="stream-1"]');
const stream = new FileStream({
  container,
  options: {
    lang: 'typescript',
    theme: { dark: 'pierre-dark', light: 'pierre-light' },
    lineNumbers: true,
    // Streaming-only options:
    wrap: false,
    autoScroll: true,   // pin the viewport to the latest line
    cursorBlink: true,  // render a blinking cursor at the tail
  },
});

// As the agent produces output, append it chunk-by-chunk.
// Each call re-highlights ONLY the changed tail (incremental Shiki).
async function consume(reader) {
  const dec = new TextDecoder();
  // Read tokens from a fetch response body / SSE stream / WebSocket.
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    stream.append(dec.decode(value, { stream: true }));
  }
  // Flush + lock — disables further appends, removes the cursor.
  stream.finalize();
}
```

## Append semantics

- `stream.append(text)` is additive — `text` is concatenated to the
  current buffer, the tail (the chunk you just appended) is
  re-tokenised via Shiki's incremental highlighter, the head
  remains untouched.
- Calling `append` after `finalize` throws `FileStream.LockedError`.
- The container's `data-ve-id` is preserved across appends; the
  selection contract (per-line click → multi-select entry) works
  identically to `FileDiff` once the stream is finalized.

## Performance — when to virtualize

`FileStream` is virtualized by default — it renders only the lines
inside the viewport plus a buffer of 20 above / 20 below. The
buffer is automatically sized up to 100 if the user is scrolling
fast. For very tall streams (10k+ lines), pass
`virtualizer: { rowHeight: 22 }` explicitly so Pierre doesn't have
to measure the first 100 lines to estimate.

If the stream is short (< 200 lines) and you want the page to grow
naturally without an inner scroller (per the no-nested-scrollbars
rule), pass `virtualizer: false`. Pierre falls back to plain DOM
rendering; the document's own scrollbars handle the overflow.

## Cursor & input

- `cursorBlink: true` renders a CSS blinking caret after the last
  character. The caret colour is `--vc-accent`.
- The container is NOT contenteditable — `FileStream` is one-way
  (agent → user). If you need user input, use
  `amvcp-form-inputs` for an entry box and wire its `onSubmit` into
  your agent transport.

## Stream + annotations

`FileStream` does NOT accept `lineAnnotations` while streaming —
the line numbers are unstable until `finalize()` is called. If you
need annotations on the streamed output:

1. `await consume(reader)` until `finalize()` succeeds.
2. Inspect the rendered text via `stream.getText()`.
3. Dispose the `FileStream`: `stream.dispose()`.
4. Mount a `FileDiff` (with the now-final text as both sides for a
   read-only render, OR against the original target file for a
   diff view) at the same container, with the desired
   `lineAnnotations`.

## Selection payload

While streaming, the per-line selection contract is INERT —
clicking a line is a no-op. Once `finalize()` runs, every line
becomes selectable and emits the standard:

```json
{
  "kind": "pierre-diff-line",
  "diffId": "stream-1",
  "file": "<inferred-or-options.file>",
  "side": "new",
  "lineNew": 17,
  "content": "  return value;",
  "annotation": null
}
```

Note `side: 'new'` — every stream is single-pane and treated as the
post-image. If you need an explicit `'old'` side for downstream
processing, set `options.streamSide: 'old'` on construction.

## Cross-references

- [`layout-choice`](./layout-choice.md) — streams are always stacked (single-pane).
- [`annotation-contract`](./annotation-contract.md) — applies after `finalize()`.
- [`virtualizer-tradeoffs`](./virtualizer-tradeoffs.md) — `FileStream` virtualizes by default; opt out for short streams.
- Parent: [`SKILL.md`](../SKILL.md).
- Sibling: [`amvcp-code-syntax`](../../amvcp-code-syntax/SKILL.md) — non-streaming static highlight; cheaper if you don't need incremental updates.
