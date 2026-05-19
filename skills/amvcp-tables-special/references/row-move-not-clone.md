# Row reordering — move the node, never clone it

The single most important sort-safety property in `amvcp-tables.js`.
A sort that **clones** rows silently destroys selection state, comment
threads, attached listeners, and the decision-mini pill. A sort that
**moves** rows preserves every one of them. The module always moves.

## Table of contents

- [What "move vs clone" actually means in the DOM](#what-move-vs-clone-actually-means-in-the-dom)
- [The one-liner that makes it work](#the-one-liner-that-makes-it-work)
- [Why cloning is forbidden](#why-cloning-is-forbidden)
- [Stable-sort decorate / sort / undecorate](#stable-sort-decorate--sort--undecorate)
- [Spacing rows under virtualization](#spacing-rows-under-virtualization)
- [Selection survives a sort](#selection-survives-a-sort)
- [Comment threads survive a sort](#comment-threads-survive-a-sort)
- [Decision-mini pills survive a sort](#decision-mini-pills-survive-a-sort)
- [What an author can safely do mid-sort](#what-an-author-can-safely-do-mid-sort)
- [The escalation we did NOT take](#the-escalation-we-did-not-take)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## What "move vs clone" actually means in the DOM

The browser's `Node.appendChild(node)` method has two behaviours
depending on whether the argument is **already in the tree**:

1. `parent.appendChild(detachedNode)` — inserts `detachedNode` as the
   last child of `parent`. A fresh node, fresh listeners.
2. `parent.appendChild(attachedNode)` — first **removes**
   `attachedNode` from its previous parent (silently), then appends
   it. The node identity is preserved. Every attribute, every
   listener, every data-* attribute, every inline style, every
   pseudo-state (`:focus`, `:hover` — not strictly attributes but
   tracked by the layout tree) rides along.

The same is true of `parent.insertBefore(node, ref)`. The native API
calls this a "move" — and that's the safety property the sort relies
on.

The opposite is `node.cloneNode(true)` — a fresh node with the same
**attributes** but no listeners, no pseudo-state, no internal
references that downstream code might hold. Cloning is the wrong tool
for "rearrange rows".

## The one-liner that makes it work

```js
// decorated is [{row, index}, …] sorted into the desired order.
var tbody = decorated[0].row.parentNode;
for (var i = 0; i < decorated.length; i++) {
  tbody.appendChild(decorated[i].row);  // ← MOVE, not clone
}
```

That's it. The `appendChild` call inside the loop sees the row is
already in the same `tbody`, removes it from its current position,
and re-appends it at the end. After N iterations, the rows are in the
sorted order — and every row is **the same node object** it was
before the sort.

The browser's layout engine is happy too: there is no node creation,
no listener re-binding, no observer churn. The mutation observers
that the runtime uses to manage selection painting see a sequence of
`childList` mutations whose `addedNodes` and `removedNodes` reference
the **same** node — exactly the "move" event the runtime is prepared
for.

## Why cloning is forbidden

A clone-based sort looks tempting because the implementation reads
cleanly:

```js
// ❌ NEVER DO THIS — silently destroys selection state
var sortedHtml = sortedRows.map(r => r.outerHTML).join('');
tbody.innerHTML = sortedHtml;
```

Or, equivalently:

```js
// ❌ NEVER DO THIS — also breaks selection state
sortedRows.forEach(r => tbody.appendChild(r.cloneNode(true)));
```

Both produce visually correct output. Both silently break:

1. **Selection.** Every `data-ve-pressed="1"` attribute clones, so a
   visual "still selected" state survives — but the runtime's
   internal selection set holds references to the OLD nodes, which
   are now detached. The next click on a "selected" row sees no
   match in the runtime's set and treats it as a fresh selection.
2. **Comment threads.** The `data-ve-comment-id` clones, but the
   comment-modal anchor (an in-memory `Map` from element → thread)
   keyed on the original node points to a now-detached element. The
   comment handle on the next render points to nothing.
3. **Listeners.** Every `addEventListener` registration is on the
   original node. Cloned nodes have NO listeners — the row's click,
   keyboard, focus, drag handlers are all dead.
4. **Decision-mini pill.** The pill is an absolutely-positioned
   sibling stamped during enhancement. A clone has no pill until
   the next `init()` re-stamps; in between, the pill points at a
   detached row and is invisible.
5. **`:focus` state.** A clone of the currently-focused row is
   created, then the original is removed — the browser drops focus
   to `<body>`. The reader's keyboard navigation context is lost.

The move-based sort has none of these failure modes. It is the
single hard invariant that lets sort coexist with selection, comments,
and the decision pill.

## Stable-sort decorate / sort / undecorate

`Array.prototype.sort` is stable in every browser since ES2019 — equal
keys keep their input order. To stay correct on a hypothetical
pre-2019 engine (and to make the property explicit in the code), the
module decorates each row with its original index before sorting:

```js
var decorated = [];
for (var i = 0; i < bodyRows.length; i++) {
  decorated.push({ row: bodyRows[i], index: i });
}
decorated.sort(makeComparator(isNumeric, dir, cellTextOf));
```

The comparator falls back to the original index on a tie, never
multiplied by the sort sign:

```js
if (primary !== 0) return sign * primary;
return a.index - b.index;   // tie-break — NOT negated by sign
```

Equal keys keep DOM order in both `asc` and `desc`. The decorate /
sort / undecorate is a guarantee, not a hope.

## Spacing rows under virtualization

The virtualization mode (see [virtualization-window-scroll.md](
../../amvcp-tables-sort-virt/references/virtualization-window-scroll.md)) keeps two **spacer rows** in the
live `<tbody>` to reserve the off-screen height. Spacers carry
`data-ve-table-spacer="1"` and `aria-hidden="true"`. The sort + the
selection scan both skip them:

```js
if (rows[i].getAttribute('data-ve-table-spacer')) continue;
```

The same `appendChild` mechanism (move, never clone) is used to
re-rebuild the live `tbody` when the visible window shifts — the
top spacer, then the visible rows in order, then the bottom spacer.
Every row that was "off-screen" was being held in a JS array — not
detached destroyed — so re-appending preserves its listeners just
like a sort does.

## Selection survives a sort

The runtime's row-atom contract paints selection via two attributes
(both set on the `<tr>`):

- `data-ve-pressed="1"` — runtime row-selectable pressed state
- `data-ve-comment-id="row:<table-tag>:<row-index>"` — runtime
  selectable identifier; the comment handle queries this.

The sort moves the node; both attributes ride along; selection
visuals never blink. The selection payload at next commit records the
selected rows by `data-ve-comment-id`, not by `:nth-child(N)`, so
post-sort positions are not relied on by the payload format.

## Comment threads survive a sort

A comment thread is keyed on `data-ve-comment-id`. The runtime's
modal-comment subsystem holds a `Map` from this id → thread. The id
is on the `<tr>` element. The sort moves the element; the id is
intact; the runtime sees the same row and the same thread on the next
modal-open.

If the comment-handle DOM element (the small bubble that hovers off
the row's right edge) is positioned via `getBoundingClientRect()`
each frame — which the runtime does for every group handle — then
the new visual position is correctly computed post-sort too.

## Decision-mini pills survive a sort

The S/A/D decision pill (Skip / Approve / Deny) is attached at
enhancement time by the runtime helper
`window.amvcpRuntime.attachDecisionMini(atomEl, atomId)`. The
helper writes state to localStorage keyed on `atomId` — the
`data-ve-comment-id` for rows. The pill is an `<button>` inserted as
a sibling/child of the atom.

After a sort:
- The `<tr>` moved — the pill's DOM relationship rode along.
- The `atomId` is unchanged — localStorage state is intact.
- The pill's `data-state` attribute is unchanged — its visual segment
  is correct.

Nothing extra needs to happen. The pill is "right" automatically.

## What an author can safely do mid-sort

- **Read the sort state.** `table.__veSort` is a plain object,
  inspectable.
- **Inspect a row's index post-sort.** `[...tbody.children]
  .indexOf(row)` returns the live position.
- **Trigger a sort programmatically.** Synthesize a click on the
  header — `headerCell.click()` — and the cycle advances exactly as
  for a real user click.

Author code MUST NOT:
- Replace `<tbody>.innerHTML` to "reset" rows.
- Call `row.cloneNode(true)` and re-insert.
- Hold a reference to a `<tr>` and re-create it later.
- Use `:nth-child(N)` selectors to address rows after a sort — the
  position has moved; address the row by `data-ve-comment-id` or
  another attribute.

## The escalation we did NOT take

The temptation to use `<tbody>.replaceChildren(...sortedRows)` looks
clean. It is also a **move** — `replaceChildren` calls the same
"remove from old parent, append to new" semantics as `appendChild`
when the argument is an already-attached node. The reason the module
uses the loop instead: `replaceChildren` is a relatively new method
(2020+ in Safari) and the module targets every browser the runtime
supports. The loop is portable; the semantics are identical.

## DESIGN.md tokens consumed

None — this is a pure DOM-manipulation contract, not a visual one.
Theming attaches to whatever attributes the row carries; if a row
was tinted with `--vc-color-accent`-derived `data-ve-pressed`, the
tint reads from that token whether the row is at index 0 or index N
post-sort. The "move, not clone" rule is what lets that work without
re-applying any style.

## Selection / comment / decision-mini notes

This entire reference exists for the selection / comment /
decision-mini contracts. The summary:

| Concern | What rides along | What does NOT |
|---|---|---|
| `data-ve-pressed` | survives | n/a |
| `data-ve-comment-id` | survives | n/a |
| comment-thread `Map` | survives (keyed on `data-ve-comment-id`) | n/a |
| decision-mini state | survives (keyed on `data-ve-comment-id`, in localStorage) | n/a |
| attached listeners | survive | n/a |
| `:focus` state | survives if the focused node moves | drops if a CLONED node replaces the original |
| `data-ve-id` (cell-level) | survives | n/a |
| `aria-label` on cells | survives | n/a |
