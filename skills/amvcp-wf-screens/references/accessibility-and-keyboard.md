# Accessibility & keyboard navigation in wireframes

A wireframe is the FIRST place to commit to accessibility — if the
shape can't be navigated by keyboard or read by screen reader at
wireframe-fi, the production app won't be either. The kit is
accessibility-first by construction; this file documents the
commitments and the per-pattern keyboard map.

## Table of contents

- [The accessibility-first commitments built into the kit](#the-accessibility-first-commitments-built-into-the-kit)
- [Semantic HTML — what each kit class maps to](#semantic-html--what-each-kit-class-maps-to)
- [Focus order — the tab key path](#focus-order--the-tab-key-path)
- [Focus rings — visible at every fidelity](#focus-rings--visible-at-every-fidelity)
- [Keyboard map per pattern](#keyboard-map-per-pattern)
- [ARIA roles and properties — when to add them](#aria-roles-and-properties--when-to-add-them)
- [Color contrast — verified at every fidelity](#color-contrast--verified-at-every-fidelity)
- [Reduced motion — the universal opt-out](#reduced-motion--the-universal-opt-out)
- [Screen reader testing checklist](#screen-reader-testing-checklist)
- [The "every atom is keyboard-focusable" auto-stamp](#the-every-atom-is-keyboard-focusable-auto-stamp)

---

## The accessibility-first commitments built into the kit

The wireframe kit makes 5 explicit accessibility commitments:

1. **Semantic HTML everywhere.** Buttons are `<button>`, anchors are
   `<a>`, headings are `<h1>`-`<h6>`, lists are `<ul>`/`<ol>`. No
   `<div onclick>`.
2. **Focus is always visible.** The runtime injects 4 visual states
   (normal / hover / selected / focus) for every atom; the focus
   ring is the same outline as `selected`.
3. **Every interactive element is keyboard-reachable.** The runtime
   auto-stamps `tabindex="0"` on selectable atoms that aren't
   naturally tabbable.
4. **`prefers-reduced-motion` is universally respected.** Every
   animation in the wireframe layer (skeleton shimmer, drawer
   slide, modal fade) has a `@media (prefers-reduced-motion)` killswitch.
5. **Themes preserve contrast.** The desaturation engine preserves
   LIGHTNESS, so the contrast ratio between content and canvas
   stays constant across themes.

These are baked into the kit — you get them by USING the classes,
not by adding extra ARIA.

---

## Semantic HTML — what each kit class maps to

| Kit class | Recommended element | Why |
|---|---|---|
| `wf-header` | `<header>` | Page-level banner; landmark role auto |
| `wf-titlebar` | `<header>` | Same |
| `wf-nav` | `<nav>` | Landmark, screen reader skip target |
| `wf-sidebar` | `<aside>` | Complementary content |
| `wf-main` | `<main>` | Main content landmark |
| `wf-statusbar` | `<footer>` | Page or section footer |
| `wf-card` | `<article>` or `<section>` | Discrete content block |
| `wf-button` | `<button>` or `<a class="wf-button">` | Action — button if it triggers JS, anchor if it navigates |
| `wf-input` | `<input>`, `<textarea>`, `<select>` | Form control |
| `wf-label` | `<label>` (with `for=`) | Field label |
| `wf-text` | `<p>`, `<span>`, `<h1>-<h6>` | Plain text — pick by role |
| `wf-image` | `<figure>` + `<img>` | Image with optional caption |
| `wf-table` | A grid div is fine; use `<table>` for real tabular data | Real tables require `<th scope>` |
| `wf-modal` | `<dialog>` (HTML5) | Native modal semantics |
| `wf-toast` | `<div role="status">` | Live region for announcements |
| `wf-chip` | `<span>` | Inline label/tag |
| `wf-avatar` | `<img alt="Anna Chen">` or `<span>` | Image if real, span if placeholder |
| `wf-divider` | `<hr>` | Native separator |

Picking the right element gets you ARIA roles for FREE — `<header>`
gets `role="banner"`, `<nav>` gets `role="navigation"`, etc.

---

## Focus order — the tab key path

The tab order follows the DOM order. For most wireframes this is
correct — top-to-bottom, left-to-right. EXCEPTIONS:

### Modals — focus should be TRAPPED inside

When a modal opens, tabbing should cycle within the modal — never
escape to the underlying page. This is JS behavior (focus-trap),
but the wireframe should ANNOTATE it:

```html
<div class="wf-overlay">
  <div class="wf-modal" aria-modal="true" role="dialog"
       data-wireframe-note="focus is trapped inside this modal">
    …
  </div>
</div>
```

### Skip-link — let keyboard users jump to main

Add a skip-link as the FIRST focusable element on every page:

```html
<a href="#screen-main"
   style="position:absolute;
          top:-100px; left:0;
          background:var(--vc-color-content);
          color:var(--vc-color-canvas);
          padding:8px 16px;
          z-index:1000;"
   onfocus="this.style.top='0'">
  Skip to main content
</a>
```

The link is positioned off-screen by default; when focused (the
user tabbed to it), it slides into view. Activating it jumps
focus past the nav into main content.

### Sidebar collapse — focus order across responsive shifts

A collapsible sidebar should KEEP its keyboard order even when
collapsed. Don't reorder elements in the DOM based on layout
changes — that breaks tab paths.

---

## Focus rings — visible at every fidelity

Every focusable element gets a visible focus ring via the runtime:

```css
[data-ve-id]:focus-visible,
[data-ve-id][data-ve-selected="1"] {
  outline: 2px solid var(--ve-accent);
  outline-offset: 2px;
}
```

The ring uses `--ve-accent` which the runtime computes from
`--vc-color-accent`. At wireframe fidelity, the wireframe engine
re-publishes the scoped accent on every `[data-wf-root]`, so the
focus ring desaturates to a grey ring (still visible against the
canvas background).

DON'T override `outline: none` on any focusable element. If you
want a different style, replace it with another visible indicator
— never SUPPRESS focus.

---

## Keyboard map per pattern

### Buttons + anchors

| Key | Action |
|---|---|
| Tab | Move focus forward |
| Shift + Tab | Move focus backward |
| Enter / Space | Activate (button or anchor) |

### Inputs

| Key | Action |
|---|---|
| Tab | Move focus to next field |
| Esc | Cancel changes (form-level) |
| Enter | Submit form |

### Modals

| Key | Action |
|---|---|
| Tab | Cycle focus within modal (trapped) |
| Esc | Close modal (returns focus to trigger) |

### Menus / popovers

| Key | Action |
|---|---|
| Down | Move to next menu item |
| Up | Move to previous menu item |
| Enter | Activate item |
| Esc | Close menu |
| Home / End | First / last item |
| Letter | Jump to matching item |

### Tabs (in-page tab strip)

| Key | Action |
|---|---|
| Tab | Move focus past tab list |
| Left / Right | Move between tabs |
| Enter / Space | Activate focused tab |
| Home / End | First / last tab |

### Tables

| Key | Action |
|---|---|
| Tab | Move past table |
| Arrow keys | Move between cells (if grid-role) |
| Enter | Activate row link |
| Space | Toggle row selection |

### Slider (fidelity slider)

| Key | Action |
|---|---|
| Tab | Move focus to slider |
| Left / Right | Decrease / increase by 1 step |
| Home / End | Minimum / maximum |
| Page Up / Down | Larger step (rare) |

---

## ARIA roles and properties — when to add them

Most of the kit gets ARIA for free from semantic HTML. ADD ARIA
when:

### A control is custom (not semantic)

A div-based toggle needs `role="switch"` + `aria-checked`:

```html
<div role="switch" aria-checked="true" tabindex="0"
     class="wf-toggle">
  …
</div>
```

### State is dynamic

The active tab needs `aria-selected="true"`:

```html
<a class="wf-nav-item is-active"
   role="tab"
   aria-selected="true"
   href="#tab-overview">Overview</a>
```

The current page needs `aria-current="page"`:

```html
<a class="wf-nav-item is-active"
   aria-current="page"
   href="#screen-home">Home</a>
```

A form error needs `aria-invalid` + `aria-describedby`:

```html
<input class="wf-input" type="email" id="email"
       aria-invalid="true"
       aria-describedby="email-error">
<span class="wf-text" id="email-error"
      style="color:var(--vc-color-danger);">
  Please enter a valid email.
</span>
```

### A control needs a label that isn't a `<label>` element

```html
<button class="wf-button wf-button--ghost"
        aria-label="Close modal">×</button>
```

### A status message should be announced

```html
<div class="wf-toast" role="status">
  ✓ Profile saved
</div>
```

### A live region needs to update

```html
<div role="status" aria-live="polite">
  <span class="wf-text" data-wf-lines="1">3 unread messages</span>
</div>
```

---

## Color contrast — verified at every fidelity

The wireframe maintains WCAG AA contrast (4.5:1 for body text, 3:1
for large text) at EVERY fidelity stage. Verified by:

1. **DESIGN.md tokens are AA-compliant.** The `--vc-color-*` set
   the engine ships passes WCAG AA for every text-on-background
   pair.
2. **Desaturation preserves lightness.** The wireframe engine
   zeros out chroma but keeps lightness — so contrast ratios are
   identical to the source theme.
3. **Wireframe-specific overrides preserve the pair.** Inline
   styles always use TWO tokens together: `background:
   var(--vc-color-content); color: var(--vc-color-canvas);` — never
   one without the other.

To verify the wireframe yourself, use a contrast checker:

```bash
# WebAIM Contrast Checker
# https://webaim.org/resources/contrastchecker/
```

Test these pairs:
- `--vc-color-content` on `--vc-color-canvas` (body text on page)
- `--vc-color-content-muted` on `--vc-color-canvas` (secondary text)
- `--vc-color-content-subtle` on `--vc-color-canvas` (tertiary text)
- `--vc-color-on-accent` on `--vc-color-accent` (button text)

At wireframe fidelity, all 4 pairs should still pass AA — the
desaturation preserves the contrast.

---

## Reduced motion — the universal opt-out

Every animation in the wireframe MUST respect
`prefers-reduced-motion`. Pattern:

```css
.my-animation {
  animation: my-keyframe 1.5s infinite linear;
}

@media (prefers-reduced-motion: reduce) {
  .my-animation {
    animation: none;
  }
}
```

For skeleton shimmer:

```css
@keyframes wf-shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.85; }
  100% { opacity: 0.5; }
}

@media (prefers-reduced-motion: reduce) {
  [style*="wf-shimmer"] { animation: none !important; }
}
```

For toast slide-in:

```css
.wf-toast {
  animation: wf-toast-slide-in 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .wf-toast {
    animation: none;
  }
}
```

The reduced-motion path should always render the FINAL STATE
without the animation — never make the element invisible if
animation is disabled.

---

## Screen reader testing checklist

Before considering a wireframe accessibility-complete:

- [ ] Every interactive element is keyboard-reachable (tab through
  the whole page; nothing skipped).
- [ ] Focus indicator is visible on every focused element.
- [ ] Tab order matches visual order (left-to-right,
  top-to-bottom).
- [ ] Every form input has an associated `<label>` (via `for=`).
- [ ] Every image has descriptive `alt` text (or `alt=""` for
  decorative).
- [ ] Every button has a discernible name (text content OR
  `aria-label`).
- [ ] Headings are in order (h1 → h2 → h3; no skipping).
- [ ] Lists use `<ul>` / `<ol>` (not styled `<div>`s).
- [ ] Modal traps focus + closes on Esc + returns focus to trigger.
- [ ] Toast / banner messages use `role="status"` or
  `role="alert"`.
- [ ] No element relies on COLOR alone to convey meaning (always
  pair color with text or icon).
- [ ] All animations honor `prefers-reduced-motion`.

For automated checks, use **axe-core** or **WAVE** browser
extension. Run them on the wireframe HTML and address every
warning.

---

## The "every atom is keyboard-focusable" auto-stamp

The wireframe engine auto-stamps `tabindex="0"` and `role="button"`
on every `[data-ve-id]` inside a `[data-wf-root]` that isn't
naturally tabbable:

```js
if (!el.hasAttribute('tabindex')
    && !el.matches('button, input, select, textarea, a[href]')) {
  el.setAttribute('tabindex', '0');
  if (!el.hasAttribute('role')) {
    el.setAttribute('role', 'button');
  }
}
```

This means: a `<section class="wf-screen" data-ve-id="screen-home">`
becomes keyboard-reachable WITHOUT the author needing to remember
`tabindex`. The user can Tab to any screen-level atom and trigger
its select / comment / decision flow.

The auto-stamp runs in `init()` AND in `refresh()` — so
dynamically-added wireframe atoms also become keyboard-reachable
after re-init.

If you DON'T want an element to be focusable, give it a NEGATIVE
tabindex:

```html
<div data-ve-id="screen-x"
     data-ve-type="wireframe-screen"
     tabindex="-1">
  …
</div>
```

The auto-stamp respects existing `tabindex` — `-1` keeps it
unfocusable (but still programmatically focusable via JS).
