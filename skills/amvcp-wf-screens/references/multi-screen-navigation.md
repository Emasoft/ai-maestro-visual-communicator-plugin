# Multi-screen navigation — anchor links + paged vs stacked

One `.wf-root`, N `.wf-screen` elements, plain `<a href="#screen-id">`
between them. ZERO JS — both navigation modes are pure CSS. The
fragment in the URL drives which screen is visible.

## Table of contents

- [The two modes — scroll vs paged](#the-two-modes--scroll-vs-paged)
- [Mode `scroll` — every screen stacked, fragment scrolls](#mode-scroll--every-screen-stacked-fragment-scrolls)
- [Mode `paged` — pure CSS `:target`, one screen at a time](#mode-paged--pure-css-target-one-screen-at-a-time)
- [Anchor patterns — back, next, modal, drawer](#anchor-patterns--back-next-modal-drawer)
- [No-fragment fallback — `:has(...)` for the first screen](#no-fragment-fallback--has-for-the-first-screen)
- [Naming convention — `id="screen-<purpose>"`](#naming-convention--idscreen-purpose)
- [Deep-linking — sharable screen URLs](#deep-linking--sharable-screen-urls)
- [The `data-ve-id` overlap question](#the-data-ve-id-overlap-question)
- [Screen-level vs block-level selection](#screen-level-vs-block-level-selection)
- [JS-off accessibility](#js-off-accessibility)

---

## The two modes — scroll vs paged

| Mode | Set with | What the user sees |
|---|---|---|
| `scroll` (default) | `data-wf-nav="scroll"` or absent | Every screen stacked vertically with a dashed divider between |
| `paged` | `data-wf-nav="paged"` | Only the targeted screen is visible; clicking a link replaces the visible screen |

Both modes share the same `<a href="#screen-id">` anchor. The
attribute on `.wf-root` is the only thing that changes the
behavior.

---

## Mode `scroll` — every screen stacked, fragment scrolls

The default. Every `.wf-screen` is visible; an anchor click triggers
a NATIVE smooth scroll to the fragment.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe">

  <section class="wf-screen" id="screen-cart"
           data-ve-id="screen-cart" data-ve-type="wireframe-screen">
    <h2 class="wf-text" data-wf-lines="1">Cart</h2>
    <a class="wf-button" href="#screen-payment">Continue to payment</a>
  </section>

  <section class="wf-screen" id="screen-payment"
           data-ve-id="screen-payment" data-ve-type="wireframe-screen">
    <h2 class="wf-text" data-wf-lines="1">Payment</h2>
    <a class="wf-button" href="#screen-confirm">Place order</a>
  </section>

  <section class="wf-screen" id="screen-confirm"
           data-ve-id="screen-confirm" data-ve-type="wireframe-screen">
    <h2 class="wf-text" data-wf-lines="1">Confirmed</h2>
    <a class="wf-button" href="#screen-cart">Back to cart</a>
  </section>

</div>
```

### CSS

```css
.wf-root {
  scroll-behavior: smooth;     /* native smooth fragment scroll */
}
.wf-screen {
  scroll-margin-top: var(--vc-space-4, 24px);
}
.wf-root[data-wf-nav="scroll"] > .wf-screen + .wf-screen {
  border-top: 2px dashed var(--vc-color-border, #e3dcc9);
}
```

- `scroll-behavior: smooth` is the trick — clicking `#screen-payment`
  smoothly scrolls to that screen. No JS.
- `scroll-margin-top` keeps the screen-top a comfortable distance
  below any fixed page chrome.
- The dashed border between screens visually separates them — a
  signal to the reader that they're scrolling between SCREENS, not
  scrolling within a single long screen.

### When to use

- A wireframe the reader will read top-to-bottom (a documentation
  page showing every screen in a flow).
- A short flow (3-5 screens) where seeing them all at once is
  beneficial.
- A click-through preview where the user wants to compare adjacent
  screens.

### When NOT to use

- A flow with many screens (10+) — the page becomes very long.
- A flow with a destructive action (delete, sign out) — the user
  shouldn't see the "confirmation" screen before they perform the
  action.

---

## Mode `paged` — pure CSS `:target`, one screen at a time

The advanced mode. Only the screen whose `id` matches the URL
fragment is displayed. Clicking an anchor REPLACES the visible
screen.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <section class="wf-screen" id="screen-cart">…</section>
  <section class="wf-screen" id="screen-payment">…</section>
  <section class="wf-screen" id="screen-confirm">…</section>

</div>
```

### CSS

```css
.wf-root[data-wf-nav="paged"] > .wf-screen {
  display: none;
}
.wf-root[data-wf-nav="paged"] > .wf-screen:target {
  display: block;
}
.wf-root[data-wf-nav="paged"]:not(:has(> .wf-screen:target))
  > .wf-screen:first-of-type {
  display: block;
}
```

The third rule is the no-fragment fallback — when NO descendant is
targeted, `:has()` is false and the FIRST screen is revealed. This
makes the wireframe usable on first load (no URL fragment) without
JS. Browsers without `:has()` (very old, pre-2023) fall back to
showing NOTHING until a link is clicked — still JS-off-safe, just
needs one click to start.

### When to use

- A long flow with many screens (10+) — only the current screen is
  visible, no scrolling between.
- A wireframe that mimics a real app's screen-replace behavior
  (clicking a tab in a mobile app replaces the screen).
- A clickable prototype where you want the experience to feel like
  the final app.

### When NOT to use

- Documentation that the reader will scan top-to-bottom — the
  reader can't see all the screens at once.
- A short 2-3 screen flow — the paged mode adds friction for the
  reader (they need to click instead of scroll).

---

## Anchor patterns — back, next, modal, drawer

The pattern for "the user moves between screens" is just an anchor.
The class on the anchor styles it — `wf-button` for a primary CTA,
`wf-nav-item` for a nav link, `wf-text` for a back link.

### Forward / next

```html
<a class="wf-button" href="#screen-payment">Continue</a>
```

A primary `wf-button`. The button-fidelity rules paint it grey at
wireframe, accent at mid+.

### Back

```html
<a class="wf-button wf-button--ghost" href="#screen-cart">← Back</a>
```

A ghost button — transparent background, no accent at any
fidelity. The `←` Unicode arrow is the conventional back glyph.

### Tab bar entry

```html
<nav class="wf-nav">
  <a class="wf-nav-item is-active" href="#screen-feed">Feed</a>
  <a class="wf-nav-item" href="#screen-search">Search</a>
  <a class="wf-nav-item" href="#screen-profile">Profile</a>
</nav>
```

`wf-nav-item` paints a short text label. The `is-active` modifier
makes the current tab stand out (no underline; just bold + content
color instead of muted).

### Modal trigger

```html
<a class="wf-button" href="#screen-delete-confirm">Delete</a>

<section class="wf-screen" id="screen-delete-confirm">
  <div class="wf-archetype--modal">
    <div class="wf-overlay">
      <div class="wf-modal">
        <h2 class="wf-text" data-wf-lines="1">Delete this draft?</h2>
        <div class="wf-modal__actions">
          <a class="wf-button wf-button--ghost" href="#screen-list">Cancel</a>
          <a class="wf-button" href="#screen-deleted">Delete</a>
        </div>
      </div>
    </div>
  </div>
</section>
```

The modal IS a screen. Clicking the trigger anchor navigates to the
modal screen; the Cancel anchor navigates BACK to the original
screen. In paged mode, this looks like a real modal popping up.

### Drawer / sidebar (mobile)

A side drawer is just a screen with a different layout — usually a
narrow `wf-sidebar` block that fills the screen.

```html
<a class="wf-button wf-button--ghost" href="#screen-drawer">☰ Menu</a>

<section class="wf-screen" id="screen-drawer">
  <aside class="wf-sidebar">
    <a class="wf-nav-item" href="#screen-home">Home</a>
    <a class="wf-nav-item" href="#screen-library">Library</a>
    <a class="wf-nav-item" href="#screen-settings">Settings</a>
  </aside>
  <a class="wf-button wf-button--ghost" href="#screen-home">Close</a>
</section>
```

---

## No-fragment fallback — `:has(...)` for the first screen

Without the `:has()` rule, a fresh load of the page (no URL
fragment) would show NOTHING in paged mode — every screen would be
`display: none`. The `:has()` rule fixes this:

```css
.wf-root[data-wf-nav="paged"]:not(:has(> .wf-screen:target))
  > .wf-screen:first-of-type {
  display: block;
}
```

Read this as: "if the wireframe root does NOT have any targeted
screen as a direct child, then show the first screen by default."
The `:has()` query checks for `:target` matches inside the root;
the `:not(:has(…))` inverts it.

### `:has()` browser support

`:has()` shipped in all major browsers in late 2023 (Chrome 105+,
Firefox 121+, Safari 15.4+). The fixture documents this as the
minimum browser; older browsers degrade gracefully — they show
NOTHING until a link is clicked, which is JS-off-safe and
recoverable.

If you absolutely need the no-fragment fallback to work on a
pre-`:has()` browser, add ONE tiny script:

```html
<script>
  if (!location.hash) {
    var first = document.querySelector('.wf-root[data-wf-nav="paged"] > .wf-screen');
    if (first) { location.hash = first.id; }
  }
</script>
```

But this is a fork from the canonical no-JS contract — only add it
if your audience includes very old browsers.

---

## Naming convention — `id="screen-<purpose>"`

Every `wf-screen` MUST have an `id`. The pattern is
`screen-<purpose>` where `<purpose>` is a short kebab-case noun:

```html
<section class="wf-screen" id="screen-cart">…</section>
<section class="wf-screen" id="screen-payment">…</section>
<section class="wf-screen" id="screen-payment-success">…</section>
<section class="wf-screen" id="screen-payment-failure">…</section>
<section class="wf-screen" id="screen-onboarding-1">…</section>
<section class="wf-screen" id="screen-onboarding-2">…</section>
```

Why this convention:

- A glance at the markup tells you what each screen IS.
- Anchor links read naturally: `href="#screen-payment"` is
  obviously the payment screen.
- Numbered screens (`screen-onboarding-1` …-3) work for sequential
  flows; named screens work better for branching flows.
- IDs are global to the document — two `wf-screen`s with the same
  `id` is invalid HTML AND breaks the navigation (only the first
  matches the fragment).

For very large wireframes (50+ screens), namespace the IDs by
flow: `id="checkout-screen-cart"`, `id="checkout-screen-payment"`,
`id="onboarding-screen-welcome"`. This avoids collisions if you
later merge two wireframes.

---

## Deep-linking — sharable screen URLs

Every `wf-screen` URL is automatically deep-linkable. Users can
share `https://example.com/wireframe.html#screen-payment` and the
recipient lands directly on the payment screen.

This is a GENUINE benefit over a screenshots-only wireframe. The
reviewer can leave comments per-screen by sharing the URL; the
recipient sees exactly what was being commented on.

Combined with the runtime's `data-ve-comment-id` selection model,
this means: any screen's comments are tied to that screen's ID,
which is also its URL fragment. Comments survive a shared link.

---

## The `data-ve-id` overlap question

A `wf-screen` has both an `id` (the navigation target) AND a
`data-ve-id` (the selection atom marker). They're often the same
value:

```html
<section class="wf-screen"
         id="screen-payment"
         data-ve-id="screen-payment"
         data-ve-type="wireframe-screen">
```

This is INTENTIONAL — the screen is a single thing addressable by
two systems (navigation and selection). Keeping the values equal
makes the markup easier to scan and the comment threads easier to
reason about.

If you NEED them to differ (e.g. you renamed the screen but want
to keep the old comment thread alive), set `data-ve-id` to the
OLD name and `id` to the NEW name. The runtime auto-stamps
`data-ve-comment-id="wireframe-screen:<old-name>"` so the existing
comments stay tied to the old name; the new `id` provides the new
navigation URL.

---

## Screen-level vs block-level selection

Every `wf-screen` is a selection atom (`data-ve-id` on the
`<section>`). Every block inside (`wf-card`, `wf-header`, `wf-nav`,
etc.) can ALSO be a selection atom (`data-ve-id` on the block).

The runtime supports nested atoms with the group-handle pattern
(see the wireframe.css comment at the bottom): selecting an INNER
block paints the WRAPPING screen with a dashed outline, so the
reviewer sees the relationship.

For a wireframe-quality review, MOST atoms should be at block
level (per-card, per-header, per-button comments) and the screen-
level atom is the "comment on the whole screen" affordance. Don't
over-decorate — every `wf-text` paragraph being a selection atom
creates comment noise.

---

## JS-off accessibility

The navigation is keyboard-accessible by construction — anchors are
focusable, `Enter` follows them, fragment URLs work in every
browser.

Three accessibility wins from the JS-off design:

1. **Screen readers** announce anchor links as "link to payment"
   (the anchor's text content). No ARIA tricks needed.
2. **Keyboard users** tab through every anchor in document order;
   the visible focus indicator is the runtime's default
   `:focus-visible` outline.
3. **Reader mode** (Firefox / Safari reading view) collapses to a
   single-column document and the screen sections become visible
   `<section>` elements with `<h2>` headings — the wireframe is
   readable without any styling at all.

The paged mode's `display: none` is correctly INERT to screen
readers (announced as hidden); a keyboard user tabbing through the
page only encounters the visible screen's content. The non-visible
screens are skipped entirely.
