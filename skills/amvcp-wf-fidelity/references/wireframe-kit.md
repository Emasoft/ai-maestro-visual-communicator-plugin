# Wireframe kit — the 19 fidelity-locked CSS classes

## Table of Contents

- [The 19 classes — at a glance](#the-19-classes--at-a-glance)
- [Authoring a `.wf-root`](#authoring-a-wf-root)
- [Per-class HTML contract](#per-class-html-contract)
- [The `--vc-*` token contract — what the wireframe consumes](#the---vc--token-contract--what-the-wireframe-consumes)
- [The `--wf-*` geometry tokens](#the---wf--geometry-tokens)
- [The grayscale rule — why no class hardcodes a hex](#the-grayscale-rule--why-no-class-hardcodes-a-hex)
- [The fidelity-lock attribute mechanics](#the-fidelity-lock-attribute-mechanics)
- [Avatar exception — why `.wf-avatar` stays round at every fidelity](#avatar-exception--why-wf-avatar-stays-round-at-every-fidelity)
- [Selection contract — every block is a `data-ve-id` atom](#selection-contract--every-block-is-a-data-ve-id-atom)

The semantic vocabulary every wireframe screen is built from. Each
class is a labelled grey placeholder block; geometry is shared, color
is driven through the desaturation engine. Author the markup below;
the runtime + the fidelity engine (`amvcp-wireframe.js`) own every
visual transition between the four fidelity stages.

## Table of contents

- [The 19 classes — at a glance](#the-19-classes--at-a-glance)
- [Authoring a `.wf-root`](#authoring-a-wf-root)
- [Per-class HTML contract](#per-class-html-contract)
- [The `--vc-*` token contract — what the wireframe consumes](#the---vc--token-contract--what-the-wireframe-consumes)
- [The `--wf-*` geometry tokens](#the---wf--geometry-tokens)
- [The grayscale rule — why no class hardcodes a hex](#the-grayscale-rule--why-no-class-hardcodes-a-hex)
- [The fidelity-lock attribute mechanics](#the-fidelity-lock-attribute-mechanics)
- [Avatar exception — why `.wf-avatar` stays round at every fidelity](#avatar-exception--why-wf-avatar-stays-round-at-every-fidelity)
- [Selection contract — every block is a `data-ve-id` atom](#selection-contract--every-block-is-a-data-ve-id-atom)

---

## The 19 classes — at a glance

| # | Class | Role | Used in archetype |
|---|---|---|---|
| 1 | `wf-header` | Top page band — logo + nav links | web, app |
| 2 | `wf-titlebar` | OS window title bar | app |
| 3 | `wf-nav` | Horizontal nav row | web, mobile bottom tab |
| 4 | `wf-sidebar` | Vertical nav column | app |
| 5 | `wf-main` | Primary content region | every archetype |
| 6 | `wf-statusbar` | Bottom status strip | app |
| 7 | `wf-card` | Content card | every archetype |
| 8 | `wf-button` | Button placeholder | every archetype |
| 9 | `wf-input` | Text input well | forms |
| 10 | `wf-label` | Field or section label | forms |
| 11 | `wf-text` | N stacked placeholder bars | every archetype |
| 12 | `wf-image` | Image placeholder with diagonal X | hero, cards |
| 13 | `wf-table` | Header row + body rows | dashboards |
| 14 | `wf-modal` | Centered dialog | modal archetype |
| 15 | `wf-overlay` | Scrim behind a modal | modal archetype |
| 16 | `wf-toast` | Transient notification | every archetype |
| 17 | `wf-chip` | Tag, pill, badge | every archetype |
| 18 | `wf-avatar` | Circular user placeholder | nav, comments |
| 19 | `wf-divider` | Horizontal rule | every archetype |

Two helper classes round out the kit:

- `wf-traffic-lights` — three dots inside a titlebar or browser chrome
  (red / amber / green at mid+ fidelity, grey at wireframe / low).
- `wf-nav-item` — a single nav entry, paired with `wf-nav` or
  `wf-sidebar`. `aria-current="page"` or `.is-active` marks the
  current entry.

That is the complete kit. Nothing more should be authored from raw
HTML for a wireframe — extend by composing existing classes inside a
`wf-card`, never by reaching for a `<div>` with custom CSS.

---

## Authoring a `.wf-root`

Every wireframe document begins with a single `.wf-root` element. It
carries the fidelity attribute, scopes the desaturated token set, and
is the boundary of the navigation engine.

```html
<div class="wf-root"
     data-wf-root
     data-wf-fidelity="wireframe"
     data-wf-nav="scroll">
  <section class="wf-screen" id="screen-home" data-ve-id="screen-home"
           data-ve-type="wireframe-screen">
    <!-- one or more wf-* blocks here -->
  </section>
</div>
```

- `data-wf-root` is the marker the engine walks. Required.
- `data-wf-fidelity` is one of `wireframe` / `low` / `mid` / `hi`.
  Missing attribute defaults to `wireframe` (the safe default — a
  bare `.wf-root` is a wireframe).
- `data-wf-nav` is `scroll` (default) or `paged`. See
  [`multi-screen-navigation.md`](../../amvcp-wf-screens/references/multi-screen-navigation.md) for the
  difference.
- `data-ve-id` + `data-ve-type` on each screen and block makes it a
  selectable atom — the runtime auto-stamps `data-ve-comment-id` and
  `tabindex` so the user can click, comment, or decision-mark it.

A second `.wf-root` may appear later in the same document (for
side-by-side comparisons), but `.wf-root` is **not nestable** — one
wireframe per subtree.

---

## Per-class HTML contract

### 1. `wf-header` — top page band

```html
<header class="wf-header" data-ve-id="hdr-home" data-ve-type="wireframe-block">
  <span class="wf-text" data-wf-lines="1">logo</span>
  <nav class="wf-nav">
    <a class="wf-nav-item is-active" href="#screen-home">Home</a>
    <a class="wf-nav-item" href="#screen-pricing">Pricing</a>
    <a class="wf-nav-item" href="#screen-contact">Contact</a>
  </nav>
</header>
```

Flex row, `space-between`. Wrap the brand on the left, nav on the
right. Inside a `wf-archetype--web` it sits above `wf-main`.

### 2. `wf-titlebar` — OS window title bar

```html
<header class="wf-titlebar" data-ve-id="tb-app" data-ve-type="wireframe-block">
  <span class="wf-traffic-lights">
    <span></span><span></span><span></span>
  </span>
  <span class="wf-text" data-wf-lines="1">app title</span>
</header>
```

The traffic-lights helper paints three dots. At wireframe / low
fidelity they are grey via `--vc-color-border-strong`; at mid / hi
they paint red / amber / green from `--vc-color-danger/warning/success`.

### 3. `wf-nav` — horizontal nav row

```html
<nav class="wf-nav" data-ve-id="nav-main" data-ve-type="wireframe-block">
  <a class="wf-nav-item is-active" href="#screen-1">Home</a>
  <a class="wf-nav-item" href="#screen-2">Library</a>
  <a class="wf-nav-item" href="#screen-3">Profile</a>
</nav>
```

`gap: var(--vc-space-3, 16px)` between items. Inside a mobile
archetype, the parent's rule overrides `justify-content` to
`space-around` — the bottom tab bar pattern.

### 4. `wf-sidebar` — vertical nav column

```html
<aside class="wf-sidebar" data-ve-id="side-main" data-ve-type="wireframe-block">
  <a class="wf-nav-item is-active" href="#screen-inbox">Inbox</a>
  <a class="wf-nav-item" href="#screen-sent">Sent</a>
  <a class="wf-nav-item" href="#screen-drafts">Drafts</a>
  <hr class="wf-divider">
  <a class="wf-nav-item" href="#screen-settings">Settings</a>
</aside>
```

`flex-direction: column; gap: var(--vc-space-1, 8px)`. Width is
`--wf-sidebar-w` (`~240px`). Use `wf-divider` to group sections.

### 5. `wf-main` — primary content region

```html
<main class="wf-main" data-ve-id="main-home" data-ve-type="wireframe-block">
  <!-- wf-cards, wf-tables, wf-text blocks here -->
</main>
```

Vertical stack with `gap: var(--vc-space-4, 24px)`. Inside
`wf-archetype--web` it is centered with `max-inline-size: 72ch`
(`--wf-measure`).

### 6. `wf-statusbar` — bottom status strip

```html
<footer class="wf-statusbar" data-ve-id="sb-main" data-ve-type="wireframe-block">
  <span>Ready</span>
  <span>120 items</span>
</footer>
```

Short, muted, `font-size: --vc-text-0`. App archetype only.

### 7. `wf-card` — content card

```html
<article class="wf-card" data-ve-id="card-stats" data-ve-type="wireframe-block">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Section title</span>
  </header>
  <p class="wf-text" data-wf-lines="3">…</p>
  <footer class="wf-card__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button">Save</button>
  </footer>
</article>
```

Vertical stack of children. `--wf-block-pad` padding. The two
canonical sub-elements are `wf-card__title` (a one-line title) and
`wf-card__actions` (a right-aligned button row).

### 8. `wf-button` — button placeholder

```html
<button class="wf-button">Primary action</button>
<button class="wf-button wf-button--ghost">Cancel</button>
```

`wf-button--ghost` flips background to transparent. At fidelity `low`
the primary button gains an accent border; at `mid` / `hi` it fills
with `--vc-color-accent`. The ghost variant never fills.

### 9. `wf-input` — text input well

```html
<label class="wf-label">Email</label>
<input class="wf-input" placeholder="you@example.com">
```

Renders as a sunken bar. `placeholder` text is the natural label.
Always pair with a `wf-label` element above.

### 10. `wf-label` — field / section label

```html
<label class="wf-label">Display name</label>
```

Small uppercase-ish caption. Use above `wf-input`, above a stat in a
card, anywhere a short label sits above content.

### 11. `wf-text` — N stacked placeholder bars

```html
<p class="wf-text" data-wf-lines="3"></p>
<p class="wf-text" data-wf-lines="1"></p>     <!-- one-line, no ragged tail -->
<p class="wf-text" data-wf-lines="7"></p>     <!-- long paragraph -->
```

The bar count is `data-wf-lines` (mirrored into `--wf-lines` by the
JS). With JS off, the CSS fallback renders 3 bars. The last bar is
60%-width via a `::after` — the classic ragged-last-line wireframe
convention. A `data-wf-lines="1"` block omits the ragged tail.

### 12. `wf-image` — image placeholder with diagonal X

```html
<figure class="wf-image" data-ve-id="hero-image"
        data-ve-type="wireframe-block"></figure>
```

`min-height: calc(var(--vc-space-7) * 2)` (about 128px). The
universal diagonal-X is two crossed `linear-gradient`s. No content
inside; the X IS the placeholder.

### 13. `wf-table` — header row + body rows

```html
<div class="wf-table" data-ve-id="tbl-users" data-ve-type="wireframe-block">
  <div class="wf-table-row wf-table-row--head">
    <span class="wf-text" data-wf-lines="1">Name</span>
    <span class="wf-text" data-wf-lines="1">Role</span>
    <span class="wf-text" data-wf-lines="1">Last seen</span>
  </div>
  <div class="wf-table-row">
    <span class="wf-text" data-wf-lines="1"></span>
    <span class="wf-text" data-wf-lines="1"></span>
    <span class="wf-text" data-wf-lines="1"></span>
  </div>
  <div class="wf-table-row">…</div>
</div>
```

Not a `<table>` — flex rows so the wireframe stays grid-quick to
edit. Each row has 1px `border-bottom`; the `--head` modifier flips
to a sunken background + 600 weight.

### 14. `wf-modal` — centered dialog

```html
<div class="wf-overlay" data-ve-id="ovl-confirm" data-ve-type="wireframe-block">
  <div class="wf-modal" data-ve-id="mdl-confirm" data-ve-type="wireframe-block">
    <h2 class="wf-text" data-wf-lines="1">Confirm action</h2>
    <p class="wf-text" data-wf-lines="2"></p>
    <div class="wf-modal__actions">
      <button class="wf-button wf-button--ghost">Cancel</button>
      <button class="wf-button">Confirm</button>
    </div>
  </div>
</div>
```

`max-inline-size: min(440px, 90vw)`. Always pair with `wf-overlay`
(the scrim) — the overlay provides the dimming background.

### 15. `wf-overlay` — scrim behind a modal

See above. The scrim is `color-mix(in srgb, var(--vc-color-content) 45%, transparent)`
so it themes off the foreground content color (light theme → soft
black scrim; dark theme → soft white scrim).

### 16. `wf-toast` — transient notification

```html
<div class="wf-toast" data-ve-id="toast-saved"
     data-ve-type="wireframe-block">
  <span class="wf-text" data-wf-lines="1">Changes saved.</span>
  <button class="wf-button wf-button--ghost">Undo</button>
</div>
```

Inline-flex; sits as part of the page flow (no `position: fixed` —
the wireframe shows where a toast WOULD be, not a live overlay).

### 17. `wf-chip` — tag / pill / badge

```html
<span class="wf-chip">draft</span>
<span class="wf-chip">v1.2.0</span>
<span class="wf-chip">3 open</span>
```

Small inline-flex pill. Use for tags, status chips, version badges.

### 18. `wf-avatar` — circular user placeholder

```html
<span class="wf-avatar" aria-label="Anna Chen"></span>
```

Round at EVERY fidelity (avatars are round) — see the avatar
exception below. Pair with a `wf-text` for the name.

### 19. `wf-divider` — horizontal rule

```html
<hr class="wf-divider">
```

A 1px line with vertical margins. Inside a `wf-sidebar` it groups
nav sections; inside a `wf-card` it separates body from actions.

---

## The `--vc-*` token contract — what the wireframe consumes

The skill is a pure CONSUMER of the DESIGN.md engine. Every visible
color reads `var(--vc-color-*, <fallback hex>)`. The comma-fallback
is graceful degradation of appearance ONLY — a wireframe opened with
no engine still renders a legible grayscale page. With the engine
present, the engine's `--vc-color-*` set is what the wireframe sees
— EXCEPT inside a `[data-wf-root]`, where the desaturation engine
publishes a SCOPED set onto the root, so descendants read the grey
values at fidelity `wireframe` / `low`.

| Token | Used for |
|---|---|
| `--vc-color-canvas` | Page background, screen background |
| `--vc-color-surface` | Card / input / button background |
| `--vc-color-surface-raised` | Modal background |
| `--vc-color-surface-sunken` | Titlebar, statusbar, sidebar, input well, table header row |
| `--vc-color-content` | Headings, primary text |
| `--vc-color-content-muted` | Nav items, labels, card actions |
| `--vc-color-content-subtle` | Statusbar text, input placeholder, the `wf-text` bars themselves |
| `--vc-color-border` | Every 1px border |
| `--vc-color-border-strong` | Traffic-light dots at wireframe / low, avatar background |
| `--vc-color-accent` | Primary button background at mid / hi |
| `--vc-color-on-accent` | Primary button text at mid / hi |
| `--vc-color-success` | Traffic-light green at mid / hi |
| `--vc-color-warning` | Traffic-light amber at mid / hi |
| `--vc-color-danger` | Traffic-light red at mid / hi |
| `--vc-color-info` | Reserved — not used by the kit |

A wireframe NEVER carries a raw hex outside the comma-fallback. A
hardcoded hex bypasses the desaturation engine (the engine only
rewrites `--vc-color-*` custom properties, not literal hex in rule
bodies) and leaks brand color into a fidelity=wireframe block. The
ONE sanctioned non-token value is the device-frame dark bezel — a
real device is dark in every OS theme; see
[`device-frames.md`](../../amvcp-wf-devices/references/device-frames.md).

---

## The `--wf-*` geometry tokens

All geometry lives in one `:root` block. Rule bodies further down
read `--wf-*`; they NEVER hardcode a px. A denser DESIGN.md spacing
scale yields a denser wireframe automatically.

| Token | Default `calc()` | Resolved (with default `--vc-space-*`) |
|---|---|---|
| `--wf-titlebar-h` | `calc(var(--vc-space-5, 32px) * 1.0)` | ~32px |
| `--wf-statusbar-h` | `calc(var(--vc-space-4, 24px) * 1.0)` | ~24px |
| `--wf-sidebar-w` | `calc(var(--vc-space-6, 48px) * 5)` | ~240px |
| `--wf-measure` | `72ch` | a readable web column |
| `--wf-mobile-w` | `390px` | iPhone-class width |
| `--wf-block-pad` | `var(--vc-space-3, 16px)` | 16px |
| `--wf-block-gap` | `var(--vc-space-2, 12px)` | 12px |
| `--wf-bar-h` | `calc(var(--vc-text-1, 14px) * 0.62)` | ~9px |
| `--wf-avatar-d` | `calc(var(--vc-space-5, 32px) * 1.25)` | ~40px |
| `--wf-dot-d` | `12px` | traffic-light / punch-hole dot |
| `--wf-frame-w` | `393px` | per-frame override below |
| `--wf-frame-h` | `852px` | per-frame override below |
| `--wf-frame-radius` | `47px` | per-frame override below |
| `--wf-frame-border` | `12px` | per-frame override below |

Override at the document root to tune ALL wireframes on a page:

```css
:root {
  --wf-sidebar-w: 280px;   /* wider nav for an enterprise feel */
  --wf-mobile-w: 414px;    /* iPhone 15 Plus instead of 15 Pro */
}
```

---

## The grayscale rule — why no class hardcodes a hex

The fidelity-lock makes a strong promise: at fidelity `wireframe` no
brand color leaks through. The implementation is a one-line idea —
desaturate the `--vc-color-*` token set and publish the result on the
wireframe root. Every kit class reads through those tokens, so
turning the saturation knob to zero on `--vc-color-accent` turns the
primary button grey AUTOMATICALLY — no per-class rule needed.

A hardcoded hex (`background: #b8861f;`) bypasses this — the
desaturation only rewrites custom properties, not literal values. The
button stays gold inside a fidelity=wireframe block. This is the
single most common "wireframe leaks color" bug; always check the
class CSS uses `var(--vc-color-*, …)` if you suspect a leak.

The comma-fallback hex IS allowed — it's the engine-absent path. If
no DESIGN.md engine is present, `var(--vc-color-accent)` resolves to
nothing and the fallback hex paints. With the engine present, the
fallback is dead code (the variable always resolves).

---

## The fidelity-lock attribute mechanics

Every kit class is restated as a child of a `[data-wf-fidelity="…"]`
attribute selector. The CSS rules paint differently per stage, even
though the class is unchanged. Authors get fidelity guarantees from
the cascade, not from author discipline.

```css
/* The wireframe stage — radius forced to 0, shadows suppressed.
   Color is already grey because the JS published a desaturated
   --vc-color-* set onto [data-wf-root]. */
[data-wf-fidelity="wireframe"] .wf-card,
.wf-root:not([data-wf-fidelity]) .wf-card {
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* The mid stage — real accent fill, radius, shadow. */
[data-wf-fidelity="mid"] .wf-card {
  border-radius: var(--vc-radius-md, 8px);
  box-shadow: var(--vc-shadow-sm, …);
}
```

An absent `data-wf-fidelity` defaults to `wireframe` (the safe
default — a bare `.wf-root` is a wireframe). The cascade is
deliberate: a `wireframe` block CANNOT be styled into looking like a
mid-fi mockup, because the `!important` radius-0 / no-shadow rules
fire whenever the attribute is `wireframe` or absent. Strict by
structure, not by author care.

See [`fidelity-ramp.md`](fidelity-ramp.md) for the desaturation
algorithm and the per-stage `k`-factor table.

---

## Avatar exception — why `.wf-avatar` stays round at every fidelity

The fidelity-lock CSS forces `border-radius: 0` on every kit block at
fidelity `wireframe`. `wf-avatar` is the deliberate exception: avatars
are round in EVERY UI, in EVERY fidelity stage. A round avatar at
wireframe-fi is recognized faster than a square placeholder.

The avatar rule lives OUTSIDE the per-stage attribute selectors —
it always paints `border-radius: 50%`. This is the only kit class
with a per-class radius override.

If you need a square placeholder (an icon, a thumbnail), use
`wf-image` (which keeps `border-radius: 0` at wireframe and gains
`--vc-radius-md` at mid+).

---

## Selection contract — every block is a `data-ve-id` atom

A wireframe block becomes a SELECTABLE ATOM with two attributes:

```html
<article class="wf-card"
         data-ve-id="card-stats"
         data-ve-type="wireframe-block">
```

The runtime auto-stamps three more attributes on every
`[data-wf-root] [data-ve-id]`:

1. `data-ve-comment-id="wireframe-block:card-stats"` — derived from
   `data-ve-type:data-ve-id` so the thread key is stable across
   reloads. An author can pre-set this to a custom value.
2. `tabindex="0"` — so non-button elements (`<section>`, `<div>`,
   `<article>`) become keyboard-reachable.
3. `role="button"` — so screen readers announce the element as
   actionable.

The atom then participates in the full runtime contract: click to
select (turquoise outline), hover (glow), comment (Ctrl-+), decision
mini-pill (3-radio Skip/Approve/Deny). See the runtime's selection
documentation for the four visual states.

The auto-stamp ALSO calls `attachDecisionMini(el, id)` for every
atom — so every wireframe block gets a Skip / Approve / Deny mini
pill by default, fulfilling Phase 2.5 User Req #10 without any
per-block markup.

`refresh(root)` re-runs the auto-stamp, so dynamically-inserted
wireframe blocks pick up the contract after their parent has been
mounted.
