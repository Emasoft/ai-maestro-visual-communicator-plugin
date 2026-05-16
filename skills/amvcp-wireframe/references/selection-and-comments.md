# Selection & comments — every wireframe block is reviewable

Every wireframe atom is a SELECTABLE TARGET that the user can
click, comment on, approve, or deny. The runtime + the wireframe
engine's auto-stamp give this for free — author just adds
`data-ve-id` + `data-ve-type` to the markup.

## Table of contents

- [The selection contract — 5 attributes on every atom](#the-selection-contract--5-attributes-on-every-atom)
- [Auto-stamp — what the engine adds for you](#auto-stamp--what-the-engine-adds-for-you)
- [The 4 visual states (normal, hover, selected, focused)](#the-4-visual-states-normal-hover-selected-focused)
- [Per-atom decision mini-pill (Skip / Approve / Deny)](#per-atom-decision-mini-pill-skip--approve--deny)
- [Comment thread per atom (Ctrl-+)](#comment-thread-per-atom-ctrl)
- [Group-handle pattern (selected child → outlined parent)](#group-handle-pattern-selected-child--outlined-parent)
- [Atom naming convention](#atom-naming-convention)
- [Atom-types in the wireframe skill](#atom-types-in-the-wireframe-skill)
- [When NOT to make something an atom](#when-not-to-make-something-an-atom)
- [Comment thread lifecycle](#comment-thread-lifecycle)

---

## The selection contract — 5 attributes on every atom

A wireframe block becomes a SELECTION ATOM with these attributes:

```html
<article class="wf-card"
         data-ve-id="card-stats"
         data-ve-type="wireframe-block"
         data-ve-comment-id="wireframe-block:card-stats"
         tabindex="0"
         role="button">
  …
</article>
```

| Attribute | Required? | Author or auto? | What it does |
|---|---|---|---|
| `data-ve-id` | YES | Author | Stable ID for the atom; used by selection state, URL fragments, comment storage |
| `data-ve-type` | YES | Author | Type discriminator (`wireframe-screen`, `wireframe-block`, etc.); used by group rules and reports |
| `data-ve-comment-id` | NO | Auto | Thread key; defaults to `<type>:<id>`. Override for custom thread routing |
| `tabindex="0"` | NO | Auto | Keyboard reachable (auto-stamped on non-tabbable elements) |
| `role="button"` | NO | Auto | Screen reader announcement (auto-stamped on non-tabbable elements) |

You ONLY author the first two. The engine handles the rest.

---

## Auto-stamp — what the engine adds for you

The wireframe engine's `stampSelectionAtoms()` runs as part of
`init()` and `refresh()`. For every `[data-wf-root] [data-ve-id]`
that LACKS the auto-stamped attributes, it adds them:

```js
function stampSelectionAtoms(root) {
  var atoms = root.querySelectorAll('[data-wf-root] [data-ve-id]');
  for (var i = 0; i < atoms.length; i++) {
    var el = atoms[i];

    // 1. data-ve-comment-id (if missing)
    if (!el.hasAttribute('data-ve-comment-id')) {
      var id = el.getAttribute('data-ve-id');
      var typ = el.getAttribute('data-ve-type') || 'wireframe-atom';
      el.setAttribute('data-ve-comment-id', typ + ':' + id);
    }

    // 2. tabindex (if missing AND element isn't naturally tabbable)
    if (!el.hasAttribute('tabindex')
        && !el.matches('button, input, select, textarea, a[href]')) {
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) {
        el.setAttribute('role', 'button');
      }
    }
  }

  attachDecisionMinisToAtoms(root);
}
```

Idempotent — re-running on the same DOM is a no-op (the `hasAttribute`
guards skip already-stamped atoms).

### When YOU should override the auto-stamp

#### Custom `data-ve-comment-id`

If you renamed the atom but want to preserve the comment thread:

```html
<!-- Old: data-ve-id="card-stats" -->
<!-- New: data-ve-id="card-kpi" — but comments stay attached to old name -->
<article class="wf-card"
         data-ve-id="card-kpi"
         data-ve-type="wireframe-block"
         data-ve-comment-id="wireframe-block:card-stats">
  …
</article>
```

#### Custom `tabindex`

To exclude an element from the tab order:

```html
<div data-ve-id="screen-decorative"
     data-ve-type="wireframe-screen"
     tabindex="-1">
  <!-- still programmatically focusable, but not in tab order -->
</div>
```

#### Custom `role`

If the element is a complex widget (a slider, a toggle), give it
the right ARIA role:

```html
<div data-ve-id="ratings-slider"
     data-ve-type="wireframe-block"
     role="slider"
     aria-valuenow="3"
     aria-valuemin="0"
     aria-valuemax="5">
  …
</div>
```

---

## The 4 visual states (normal, hover, selected, focused)

The runtime ships CSS for 4 visual states per atom:

```css
/* normal */
[data-ve-id] {
  /* no special styling */
}

/* hover */
[data-ve-id]:hover {
  background: color-mix(in srgb,
    var(--ve-accent, var(--vc-color-accent)) 8%,
    transparent);
}

/* selected */
[data-ve-id][data-ve-selected="1"] {
  outline: 2px solid var(--ve-accent, var(--vc-color-accent));
  outline-offset: 2px;
}

/* selected + hover */
[data-ve-id][data-ve-selected="1"]:hover {
  outline: 2px solid var(--ve-accent, var(--vc-color-accent));
  background: color-mix(in srgb,
    var(--ve-accent, var(--vc-color-accent)) 12%,
    transparent);
}

/* focused (keyboard) */
[data-ve-id]:focus-visible {
  outline: 2px solid var(--ve-accent, var(--vc-color-accent));
  outline-offset: 2px;
}
```

At wireframe fidelity, the wireframe engine re-publishes the
scoped `--vc-color-accent` (and re-declares `--ve-accent` from it
on `[data-wf-root]`), so the outline desaturates to grey. The
SHAPE of the outline (2px solid, 2px offset) stays the same — only
the color changes.

The 4 states give the user:
- **Normal**: "this is a wireframe atom".
- **Hover**: "I can interact with this".
- **Selected**: "I've clicked on this; my comments will attach
  here".
- **Selected + hover**: "I'm hovering over the selected atom".
- **Focused**: keyboard equivalent of hover/selected.

---

## Per-atom decision mini-pill (Skip / Approve / Deny)

Every wireframe atom (regardless of selection state) gets a 3-radio
mini-pill — Skip / Approve / Deny — for asynchronous review.

The wireframe engine's `attachDecisionMinisToAtoms()` calls the
runtime's `attachDecisionMini(el, id)` helper for every atom:

```js
function attachDecisionMinisToAtoms(root) {
  if (typeof window === 'undefined') { return; }
  var rt = window.amvcpRuntime;
  if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
  var atoms = root.querySelectorAll('[data-wf-root] [data-ve-id]');
  for (var i = 0; i < atoms.length; i++) {
    var el = atoms[i];
    var id = el.getAttribute('data-ve-id');
    try { rt.attachDecisionMini(el, id); } catch (e) { /* defensive */ }
  }
}
```

Defensive — the helper may not exist (standalone fixture pages
without the runtime). The wireframe still works; just no mini-pill.

The mini-pill appears as a tiny floating chip near the atom:

```
┌──────────┐
│ wireframe │ ⊝ ✓ ✗
│   atom    │ Skip Approve Deny
└──────────┘
```

The user clicks one of the three radios to record a decision. The
decision is stored in localStorage keyed by atom ID — survives
page reloads. The runtime exposes the decisions to the agent for
the next iteration.

---

## Comment thread per atom (Ctrl-+)

Each atom has its OWN comment thread. The user:

1. Selects the atom (click).
2. Presses Ctrl-+ (or clicks a comment icon).
3. A modal opens with the thread for that atom.
4. User types a comment; saves to localStorage keyed by
   `data-ve-comment-id`.

Default thread key: `<data-ve-type>:<data-ve-id>`. Override with
explicit `data-ve-comment-id` for custom routing.

Threads survive page reloads (localStorage) and shared links (the
URL fragment can carry the active screen + the active atom).

For the wireframe author, this means: every block you mark as an
atom becomes a separately-commentable target. A reviewer can
comment on the HEADER, the CARD inside the header, the BUTTON
inside the card — each gets its own thread.

---

## Group-handle pattern (selected child → outlined parent)

When a CHILD atom is selected, the WRAPPING atom (also a
`data-ve-id`) gets a faint outline — visual "the thing you
selected is inside THIS group":

```css
[data-wf-root] [data-ve-id]:has([data-ve-selected="1"]) {
  outline: 1px dashed
    color-mix(in srgb, var(--vc-color-accent, #b8861f) 60%, transparent);
  outline-offset: 4px;
}
```

Read the selector: "a wireframe atom whose descendant is selected
gets a dashed outer outline".

This makes nested atoms navigable — the user can SEE the hierarchy
(card → button selected → card outlined; screen → card outlined →
screen also outlined).

Don't nest more than 2-3 levels of atoms — the outlines stack and
get noisy. Pick the MEANINGFUL levels for your wireframe:

- Screen-level atom (the whole `wf-screen`).
- Major section atom (a `wf-card` containing a stat band).
- Individual element atom (a `wf-button`, a `wf-input`).

Skip the in-between levels (the `wf-main`, the `wf-card__title`).

---

## Atom naming convention

Use `kebab-case-purpose-y` IDs:

```html
<section class="wf-screen"
         data-ve-id="screen-cart"
         data-ve-type="wireframe-screen">

  <article class="wf-card"
           data-ve-id="card-cart-items"
           data-ve-type="wireframe-block">

    <button class="wf-button"
            data-ve-id="btn-checkout"
            data-ve-type="wireframe-block">
      Checkout
    </button>

  </article>
</section>
```

ID prefixes by atom type:

| Prefix | For |
|---|---|
| `screen-` | A `wf-screen` |
| `card-` | A `wf-card` |
| `hdr-` | A `wf-header` |
| `nav-` | A `wf-nav` |
| `side-` | A `wf-sidebar` |
| `btn-` | A `wf-button` |
| `inp-` | A `wf-input` |
| `tbl-` | A `wf-table` |
| `mdl-` | A `wf-modal` |
| `toast-` | A `wf-toast` |

IDs MUST be unique within the document — two atoms with the same
ID is invalid HTML AND breaks the comment system (both will get
the same thread).

---

## Atom-types in the wireframe skill

| `data-ve-type` | Meaning |
|---|---|
| `wireframe-screen` | A `wf-screen` element (top-level) |
| `wireframe-block` | Any kit block inside a screen (card, button, etc.) |
| `wireframe-atom` | Generic fallback (used by the auto-stamp when type is missing) |

Pick `wireframe-screen` for top-level screens, `wireframe-block`
for everything else. The type is used by:

- The auto-stamped `data-ve-comment-id` (e.g.
  `wireframe-block:card-stats`).
- Reports — the agent can filter by type to count
  "comments on screens" vs "comments on individual blocks".
- Group rules — the `:has` rule treats all
  `[data-ve-id]` the same way regardless of type.

---

## When NOT to make something an atom

Just because something IS interactive doesn't mean it should be a
selection atom. Skip:

### 1. Decorative elements

```html
<!-- dividers, separators, spacers -->
<hr class="wf-divider">
```

A divider doesn't carry meaning the reviewer would comment on.

### 2. Plain text without distinct purpose

```html
<!-- a paragraph in the middle of a section -->
<p class="wf-text" data-wf-lines="3"></p>
```

If the surrounding `wf-card` is an atom, the paragraph inside it
doesn't need to be its own atom — comments attach at card level.

### 3. Repeating list items (>5 of the same shape)

```html
<!-- if you have 100 table rows, NOT every row needs to be an atom -->
<div class="wf-table-row">…</div>
```

Make the `wf-table` an atom; individual rows can be atoms when
the reviewer specifically needs to comment on rows.

### 4. Form field labels

```html
<!-- the input IS the atom; the label is part of it -->
<label class="wf-label">Email</label>
<input class="wf-input" data-ve-id="inp-email"
       data-ve-type="wireframe-block">
```

### The rule of thumb

If a reviewer might say "this thing should be different" about an
element, MAKE IT AN ATOM. If they'd say "this paragraph should
say something different" but you couldn't separately move/restyle
it, DON'T make it an atom.

Aim for 5-15 atoms per screen. Fewer = too coarse-grained (no
specific feedback possible); more = comment noise.

---

## Comment thread lifecycle

A comment thread tied to an atom goes through these states:

1. **Empty** — no comments yet. Selection icon shows a "+" badge.
2. **Open** — one or more comments, the latest is unresolved.
   Selection icon shows a number badge.
3. **Resolved** — all comments addressed. Selection icon shows a
   checkmark badge.
4. **Reopened** — a resolved thread re-opened (new comment after
   resolution). Selection icon shows the number badge again.

The runtime stores all of this in localStorage; survives reloads.

For an AGENT-AUTHORED wireframe being reviewed:

- The author (the agent) ships the wireframe with NO comments.
- The reviewer adds comments per atom.
- The reviewer clicks "Send for revision" — the agent receives the
  thread snapshots.
- The agent revises the wireframe, addresses each comment,
  resolves the threads.
- Next iteration: only the un-resolved threads need attention.

This loop is the WHOLE POINT of the wireframe → review → revise
cycle. The selection contract makes it possible.
