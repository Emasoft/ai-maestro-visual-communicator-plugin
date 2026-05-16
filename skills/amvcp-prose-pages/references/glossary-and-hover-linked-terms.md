# Glossary + hover-linked terms

The terms-and-definitions block (`<dl>` of `<dt>`/`<dd>` pairs)
plus the runtime that links body-prose terms to their glossary
entries via mouseover. Lifted from `html-effectiveness` demo #15
(concept-explainer). The pattern adds zero per-character cost to the
prose and pays off any time the document introduces ≥4 specialized
terms.

The glossary is **the cheapest cross-reference primitive in the
plugin**. Other primitives (callouts, pull-quotes, sidebars) cost
significant prose space; a glossary entry adds one line at the
bottom and a dotted underline in the body.

## When to add a glossary

| Add it | Skip it |
|---|---|
| Document introduces ≥4 domain-specific terms | ≤3 specialized terms (define inline) |
| Audience is mixed-experience (some readers know the terms, some don't) | Audience is uniformly expert |
| Terms recur throughout the document | Terms appear once and never again |
| The hover-link interaction adds learning value | The reader will read top-to-bottom |
| You can write 1-2 sentence definitions | Definitions need paragraphs (they belong inline) |

For a document with 1-2 specialized terms, define them inline using
parenthetical glosses ("…and the OIDC verifier (the service that
validates token signatures) sits behind the gateway."). For 4+ terms,
the glossary block + hover-link wins.

## Scaffold — body markup

In the body prose, wrap each glossable term in a `<span class="vc-term"
data-term="x">`:

```html
<p>Our shard router uses
   <span class="vc-term" data-term="consistent-hashing">consistent
   hashing</span> with
   <span class="vc-term" data-term="virtual-node">virtual nodes</span>
   to spread load…</p>
```

The `data-term` attribute is an opaque identifier; convention is
kebab-case matching the glossary `<dt>`'s `data-g` attribute.

## Scaffold — glossary block

```html
<aside class="vc-glossary">
  <h2 class="vc-glossary-title">Glossary</h2>
  <dl>
    <dt data-g="consistent-hashing">Consistent hashing</dt>
    <dd>A hash-based key-to-node assignment scheme where adding or
        removing a node reassigns only ~1/N of keys instead of all of
        them. See <a href="#concept-explainer">the explainer</a>.</dd>

    <dt data-g="virtual-node">Virtual node</dt>
    <dd>A logical node placed on the consistent-hashing ring multiple
        times to even out load distribution.</dd>

    <dt data-g="hot-key">Hot key</dt>
    <dd>A single key whose request rate exceeds what one node can
        handle; consistent hashing alone does not solve this.</dd>

    <dt data-g="rendezvous-hashing">Rendezvous hashing</dt>
    <dd>An alternative to consistent hashing that achieves similar
        properties without virtual nodes, by hashing each key against
        every node and picking the highest score.</dd>
  </dl>
</aside>
```

The glossary can sit:

- **At the bottom** of the document (the canonical placement; readers
  can scroll back).
- **In a sticky right sidebar** (the `concept-explainer-shape`
  pattern; readers see the glossary at all times).

Pick one per document; do not duplicate.

## CSS contract

```css
/* Body term — dotted underline in accent color */
.vc-term {
  border-bottom: 1px dotted var(--vc-color-accent, #b8861f);
  cursor: help;
}

/* Highlighted state — applied to BOTH the body term and the matching <dt> */
.vc-term--hl,
.vc-glossary-hl {
  background: color-mix(in srgb,
                         var(--vc-color-accent, #b8861f) 20%,
                         transparent);
  border-radius: var(--vc-radius-sm, 4px);
}

/* Glossary block */
.vc-glossary {
  margin-block: var(--vc-space-6, 48px);
  padding: var(--vc-space-4, 16px) var(--vc-space-5, 32px);
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  font-size: var(--vc-text-1, 14px);
}
.vc-glossary-title {
  font-size: var(--vc-text-3, 20px);
  margin-block: 0 var(--vc-space-3, 12px);
}
.vc-glossary dt {
  font-weight: var(--vc-weight-bold, 700);
  margin-block-start: var(--vc-space-3, 12px);
}
.vc-glossary dd {
  margin: 0 0 var(--vc-space-2, 8px);
  padding-inline-start: var(--vc-space-3, 12px);
  border-inline-start: 2px solid var(--vc-color-border, #e3dcc9);
  color: var(--vc-color-content-muted, #5b5343);
}
```

## The hover-link runtime

```js
document.querySelectorAll('.vc-term').forEach(term => {
  const g = term.dataset.term;
  if (!g) return;
  const dt = document.querySelector('dt[data-g="' + g + '"]');
  if (!dt) return;

  function on()  { term.classList.add('vc-term--hl'); dt.classList.add('vc-glossary-hl'); }
  function off() { term.classList.remove('vc-term--hl'); dt.classList.remove('vc-glossary-hl'); }

  term.addEventListener('mouseenter', on);
  term.addEventListener('mouseleave', off);
  // Symmetric: hovering the glossary entry highlights the body term
  dt.addEventListener('mouseenter', on);
  dt.addEventListener('mouseleave', off);

  // Keyboard support — focus also triggers the highlight
  term.addEventListener('focusin',  on);
  term.addEventListener('focusout', off);
});
```

The hover-link is bidirectional — hovering the glossary entry
highlights the matching body term too. This is useful when the reader
is browsing the glossary first and wants to see "where does this
appear in context?".

## Click-to-jump variant

For documents where the glossary is at the bottom (not in a sidebar),
clicking the body term scrolls to the glossary entry:

```js
term.addEventListener('click', e => {
  e.preventDefault();
  dt.scrollIntoView({ behavior: 'smooth', block: 'center' });
  dt.classList.add('vc-glossary--pulse');
  setTimeout(() => dt.classList.remove('vc-glossary--pulse'), 1400);
});
```

Pair with a CSS pulse animation:

```css
.vc-glossary--pulse {
  animation: vc-glossary-pulse 1.4s ease-out;
}
@keyframes vc-glossary-pulse {
  0%   { box-shadow: 0 0 0 4px var(--vc-color-accent, #b8861f); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .vc-glossary--pulse { animation: none; }
}
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Body term underline, highlight tint |
| `--vc-color-surface` | Glossary block background |
| `--vc-color-border` | Glossary block border, dd indent border |
| `--vc-color-content-muted` | dd text |
| `--vc-radius-md` | Glossary block corner |
| `--vc-radius-sm` | Highlight pill corner |
| `--vc-text-3` | Glossary title |
| `--vc-text-1` | Glossary body |

## Composition

| Containing shape | Glossary placement |
|---|---|
| `concept-explainer-shape` | Sticky right sidebar |
| `feature-explainer-shape` | At the bottom (after FAQ) — for terms not covered in FAQ |
| `whitepaper-shape` | At the bottom (after References) |
| `rfc-shape` | At the bottom (Definitions section is the equivalent) |
| `architecture-explainer-shape` | Optional — the Key Files panel often serves a similar role |
| Other shapes | Skip — terms are less likely to recur |

## Selection / comment notes

- Body terms are selectable individually
  (`{type:"term", term:"consistent-hashing"}`) — useful for "this
  definition is wrong" comments without highlighting the prose.
- Glossary entries are selectable per `<dt>`/`<dd>` pair.
- The glossary block as a whole is selectable
  (`{type:"glossary"}`) — useful for "the glossary is missing
  term X" comments.

## Decision-mini hook

Glossaries rarely host decision-minis (definitions are not
deliberative), but a definition open for revision can include one:

```html
<dt data-g="hot-key">Hot key
  <div class="ve-decision" data-decision-id="def-hotkey">
    <button data-choice="keep">Keep current definition</button>
    <button data-choice="narrow">Narrow to "single-key request rate"</button>
    <button data-choice="broaden">Broaden to include "tail keys"</button>
  </div>
</dt>
```

## QA notes

- A custom QA check can validate that every `data-term` matches a
  `data-g` in the glossary. The plugin's runGates does NOT include
  this check — implement it as a custom audit:

  ```js
  function checkGlossaryReferences(doc) {
    const terms = new Set(Array.from(doc.querySelectorAll('.vc-term'))
                             .map(t => t.dataset.term));
    const defs  = new Set(Array.from(doc.querySelectorAll('dt[data-g]'))
                             .map(d => d.dataset.g));
    const orphaned = [...terms].filter(t => !defs.has(t));
    const unused   = [...defs].filter(d => !terms.has(d));
    return { orphaned, unused };
  }
  ```

  Orphaned terms are bugs (broken references); unused glossary
  entries are smell (probably dead).

## Anti-patterns

- **`<span class="vc-term">` without `data-term`** — the runtime has
  no way to find the matching glossary entry; the term gets a dotted
  underline but no hover behavior.
- **Glossary entries without `data-g`** — same problem in reverse.
- **Glossary at the top of the document** — the reader meets terms
  before they have context. Always at the bottom (or in a sticky
  sidebar).
- **Inventing terms not in the body** — the glossary is a *reverse
  index*, not a vocabulary list. Every entry must point back to a
  body term.
- **Terms wrapped in `<span class="vc-term">` for words that aren't
  domain terms** ("the", "request", "system") — clutters the body
  with dotted underlines and dilutes the convention.
- **Hover-only interaction with no keyboard support** — keyboard
  users (and screen-reader users with hover off) are excluded. Add
  `focusin`/`focusout` on the term.
- **Click-to-jump that scrolls instantly with no pulse** — the
  reader's eye lost track of where the page jumped to. The 1.4s
  pulse highlight is a critical affordance.
- **Glossary `<dl>` styled as a flat paragraph** — readers cannot
  scan the term/definition pairs. Use the indent-with-border-left
  pattern.
- **Glossary entries longer than 2 sentences** — that's a body
  paragraph, not a glossary entry. Extract to a section.
