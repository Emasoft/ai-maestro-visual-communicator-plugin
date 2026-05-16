# Modal & overlay patterns — dialogs, drawers, popovers, toasts

The full vocabulary for "stuff that floats over the rest". Six
patterns: confirmation modal, form modal, side drawer, popover/
dropdown menu, toast notification, tooltip. All composable; all
respect the no-nested-scrollbars rule.

## Table of contents

- [Pattern 1 — Confirmation modal](#pattern-1--confirmation-modal)
- [Pattern 2 — Form modal (short data entry)](#pattern-2--form-modal-short-data-entry)
- [Pattern 3 — Side drawer (full-height panel)](#pattern-3--side-drawer-full-height-panel)
- [Pattern 4 — Popover / dropdown menu](#pattern-4--popover--dropdown-menu)
- [Pattern 5 — Toast notification](#pattern-5--toast-notification)
- [Pattern 6 — Tooltip (small hover hint)](#pattern-6--tooltip-small-hover-hint)
- [Modal stacking — what wins when two open at once](#modal-stacking--what-wins-when-two-open-at-once)
- [The dismiss patterns — ×, Esc, click-outside](#the-dismiss-patterns----esc-click-outside)
- [Destructive confirm — typed-name pattern](#destructive-confirm--typed-name-pattern)
- [Toast queue — multiple stacked toasts](#toast-queue--multiple-stacked-toasts)

---

## Pattern 1 — Confirmation modal

The simplest modal — title, message, two buttons (Cancel + Confirm).

```html
<div class="wf-overlay" data-ve-id="ovl-delete"
     data-ve-type="wireframe-block">
  <div class="wf-modal" data-ve-id="mdl-delete"
       data-ve-type="wireframe-block">

    <h2 class="wf-text" data-wf-lines="1"
        style="font-size:18px;">Delete this draft?</h2>

    <p class="wf-text" data-wf-lines="2"
       style="color:var(--vc-color-content-muted);">
      This action cannot be undone.
    </p>

    <footer class="wf-modal__actions">
      <a href="#screen-list" class="wf-button wf-button--ghost">
        Cancel
      </a>
      <a href="#screen-deleted" class="wf-button"
         style="background:var(--vc-color-danger);
                color:var(--vc-color-on-accent);
                border-color:var(--vc-color-danger);">
        Delete
      </a>
    </footer>

  </div>
</div>
```

### Notes

- Width is `min(440px, 90vw)` (from the kit's `wf-modal` default).
- Title is bold, body is muted color.
- Cancel = ghost button (de-emphasized), Confirm = primary.
- For DESTRUCTIVE confirms, the confirm button uses the danger
  color override (the inline style above). At wireframe fidelity
  it desaturates to grey, the BUTTON SHAPE + LABEL signals the
  action.

### Variants

- **Two-button neutral**: Cancel + Save / Cancel + Continue
- **Two-button destructive**: Cancel + Delete
- **Single-button** (informational): "Got it" — for "here's what
  happened, no choice needed"
- **Three-button**: Cancel + Save as draft + Publish (uncommon —
  prefer two)

---

## Pattern 2 — Form modal (short data entry)

A modal for entering 3-6 fields. Anything longer should be a
full-screen form, not a modal.

```html
<div class="wf-overlay">
  <div class="wf-modal" style="width:min(520px, 90vw);">

    <header style="display:flex; justify-content:space-between;
                   align-items:center;">
      <h2 class="wf-text" data-wf-lines="1"
          style="font-size:18px;">Invite teammate</h2>
      <a href="#screen-team" class="wf-text" data-wf-lines="1">×</a>
    </header>

    <label class="wf-label">Email</label>
    <input class="wf-input" type="email" placeholder="teammate@example.com">

    <label class="wf-label">Role</label>
    <select class="wf-input">
      <option>Member</option>
      <option>Admin</option>
      <option>Viewer</option>
    </select>

    <label class="wf-label">Personal message (optional)</label>
    <textarea class="wf-input" style="min-height:80px;"></textarea>

    <footer class="wf-modal__actions">
      <button class="wf-button wf-button--ghost">Cancel</button>
      <button class="wf-button">Send invite</button>
    </footer>

  </div>
</div>
```

### Notes

- Slightly wider than confirm modal (520px) — needs room for inputs.
- Header has title (left) + close × (right).
- Form fields stack vertically with default `wf-modal` gap.
- The optional-field convention: "(optional)" in the label.

---

## Pattern 3 — Side drawer (full-height panel)

A drawer slides in from a side (usually right). Used for filters,
details preview, settings without leaving the current page.

```html
<section class="wf-screen" id="screen-with-drawer"
         data-ve-id="screen-with-drawer" data-ve-type="wireframe-screen">

  <!-- main screen content -->
  <div class="wf-archetype--app">
    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>
    <main class="wf-main">…</main>
    <footer class="wf-statusbar">…</footer>
  </div>

  <!-- the side drawer (positioned right) -->
  <aside style="position:absolute; top:0; right:0;
                width:min(420px, 100vw);
                height:100%;
                background:var(--vc-color-surface);
                border-left:1px solid var(--vc-color-border);
                box-shadow:-8px 0 24px rgba(0,0,0,0.1);
                display:flex; flex-direction:column;">

    <header style="display:flex; justify-content:space-between;
                   align-items:center;
                   padding:16px;
                   border-bottom:1px solid var(--vc-color-border);">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;">Filters</span>
      <a href="#screen-app" class="wf-text" data-wf-lines="1">×</a>
    </header>

    <div style="padding:16px;
                display:flex; flex-direction:column; gap:16px;
                overflow:visible;">

      <article class="wf-card" style="padding:0; border:none;">
        <span class="wf-label">Status</span>
        <label style="display:flex; gap:8px;"><input type="checkbox"> Active</label>
        <label style="display:flex; gap:8px;"><input type="checkbox"> Archived</label>
      </article>

      <article class="wf-card" style="padding:0; border:none;">
        <span class="wf-label">Owner</span>
        <select class="wf-input">
          <option>Anyone</option>
          <option>Me</option>
          <option>Team</option>
        </select>
      </article>

      <article class="wf-card" style="padding:0; border:none;">
        <span class="wf-label">Date range</span>
        <input class="wf-input" type="date">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; text-align:center;">to</span>
        <input class="wf-input" type="date">
      </article>

    </div>

    <footer style="padding:16px;
                   border-top:1px solid var(--vc-color-border);
                   display:flex; gap:8px;">
      <button class="wf-button wf-button--ghost"
              style="flex:1;">Reset</button>
      <button class="wf-button" style="flex:1;">Apply</button>
    </footer>

  </aside>

</section>
```

### Notes

- Positioned absolutely from the right edge. Width is `min(420px,
  100vw)` — caps at 420 on wide screens, full-width on narrow.
- 3-row layout: header (with title + close), content (scrollable),
  footer (with actions).
- The drawer has a SUBTLE box-shadow on its left edge (depth signal
  for "this is floating over the rest").
- For mobile, the drawer slides from BOTTOM (bottom-sheet pattern)
  — see [`mobile-screens.md`](mobile-screens.md).

---

## Pattern 4 — Popover / dropdown menu

A small floating panel anchored to a button. Used for context
menus, share menus, account dropdowns.

```html
<div style="position:relative; display:inline-block;">

  <!-- the trigger button -->
  <button class="wf-button wf-button--ghost">
    More ▾
  </button>

  <!-- the popover (positioned absolutely below) -->
  <div style="position:absolute;
              top:100%; right:0;
              min-width:200px;
              background:var(--vc-color-surface-raised);
              border:1px solid var(--vc-color-border);
              border-radius:6px;
              box-shadow:0 4px 24px rgba(0,0,0,0.15);
              padding:4px;
              display:flex; flex-direction:column;
              z-index:10;">

    <a href="#" style="padding:8px 12px;
                       text-decoration:none;
                       color:var(--vc-color-content);
                       display:block;">
      Edit
    </a>
    <a href="#" style="padding:8px 12px;
                       text-decoration:none;
                       display:block;">
      Duplicate
    </a>
    <a href="#" style="padding:8px 12px;
                       text-decoration:none;
                       display:block;">
      Share…
    </a>

    <hr class="wf-divider" style="margin:4px 0;">

    <a href="#" style="padding:8px 12px;
                       text-decoration:none;
                       color:var(--vc-color-danger);
                       display:block;">
      Delete
    </a>

  </div>

</div>
```

### Notes

- Container has `position: relative` so the absolute popover
  positions relative to it.
- Popover is below the trigger (`top: 100%`) and right-aligned
  (`right: 0`). For left-aligned, use `left: 0` instead.
- Min-width 200px so labels don't crowd.
- Items are `<a>` blocks with consistent padding (8 × 12).
- `wf-divider` separates the destructive section.

For a wireframe showing the popover, render it always-open. The
real UX (click trigger to open, click outside to close) is JS that
isn't relevant at wireframe-fidelity.

---

## Pattern 5 — Toast notification

A transient banner that appears (usually at top-right) after an
action and auto-dismisses after a few seconds.

```html
<!-- single toast -->
<div class="wf-toast" data-ve-id="toast-saved"
     data-ve-type="wireframe-block"
     style="position:fixed; top:16px; right:16px;
            min-width:280px;
            background:var(--vc-color-success);
            color:var(--vc-color-on-accent);">
  <span style="flex:1;">✓ Profile saved.</span>
  <a href="#" class="wf-text" data-wf-lines="1"
     style="color:inherit;">×</a>
</div>
```

### Variants by type

```html
<!-- success -->
<div class="wf-toast"
     style="background:var(--vc-color-success);
            color:var(--vc-color-on-accent);">
  ✓ Saved
</div>

<!-- error -->
<div class="wf-toast"
     style="background:var(--vc-color-danger);
            color:var(--vc-color-on-accent);">
  ✗ Could not save. Please try again.
</div>

<!-- warning -->
<div class="wf-toast"
     style="background:var(--vc-color-warning);
            color:var(--vc-color-on-accent);">
  ⚠ Your trial expires in 3 days.
</div>

<!-- info (with undo action) -->
<div class="wf-toast"
     style="background:var(--vc-color-info);
            color:var(--vc-color-on-accent);">
  <span style="flex:1;">Message deleted.</span>
  <a href="#" style="color:inherit; font-weight:600;">Undo</a>
</div>
```

### Notes

- Toast color KEYS off the type: success / danger / warning / info.
  At wireframe fidelity all desaturate to grey; the GLYPH (✓/✗/⚠)
  carries the meaning.
- Undo actions are RIGHT-aligned, white text, bold.
- The × close button is optional — auto-dismiss handles most cases.
- For wireframes showing the toast position, use `position: fixed`
  and inline the offset.

---

## Pattern 6 — Tooltip (small hover hint)

A tiny floating label that appears on hover. Used to explain icon
buttons or truncated text.

```html
<div style="position:relative;
            display:inline-block;">

  <button class="wf-button wf-button--ghost"
          style="padding:6px 8px;">📋</button>

  <div style="position:absolute;
              bottom:100%;
              left:50%;
              transform:translateX(-50%);
              margin-bottom:6px;
              padding:4px 8px;
              background:var(--vc-color-content);
              color:var(--vc-color-canvas);
              font-size:12px;
              border-radius:4px;
              white-space:nowrap;
              pointer-events:none;">
    Copy to clipboard

    <!-- pointer triangle -->
    <span style="position:absolute;
                 top:100%;
                 left:50%;
                 transform:translateX(-50%);
                 width:0; height:0;
                 border:4px solid transparent;
                 border-top-color:var(--vc-color-content);"></span>
  </div>

</div>
```

### Notes

- Background is INVERTED (`--vc-color-content` for bg, `--vc-color-canvas`
  for text) — tooltips are dark on light themes, light on dark.
- Small text (12px).
- Pointer triangle uses the same border-trick pattern as coachmarks.
- `pointer-events: none` so the tooltip doesn't interfere with the
  hover state of the trigger.

For wireframe showing the tooltip, always-on. Real UX uses
`@hover` CSS or JS positioning.

---

## Modal stacking — what wins when two open at once

If a CONFIRM modal opens on top of a FORM modal (e.g. "discard
unsaved changes?"), the second modal should:

1. Have a HIGHER `z-index` than the first.
2. Render its own backdrop overlay (so the form modal underneath
   is dimmed in addition to the page).

```html
<!-- form modal (z-index 100) -->
<div class="wf-overlay" style="z-index:100;">
  <div class="wf-modal">…</div>
</div>

<!-- confirm modal stacked on top (z-index 200) -->
<div class="wf-overlay"
     style="z-index:200;
            background:color-mix(in srgb,
              var(--vc-color-content) 55%, transparent);">
  <div class="wf-modal">…</div>
</div>
```

Avoid stacking MORE than 2 modals — the UX becomes hostile. Use a
side drawer or full-screen view for deeper interactions.

---

## The dismiss patterns — ×, Esc, click-outside

Every modal should be dismissable in THREE ways:

1. **× close button** in the modal header (most discoverable).
2. **Esc key** (keyboard-user expectation).
3. **Click outside the modal** (mouse-user expectation).

For wireframes, the × close button is the visible affordance. Esc
and click-outside are JS behaviors not visible in the wireframe.

For DESTRUCTIVE modals (delete confirmation, lose-work warnings),
DISABLE click-outside dismissal — the user should make a deliberate
choice via the buttons. The wireframe annotation should call this
out:

```html
<div class="wf-modal" data-ve-id="mdl-delete">
  …
  <!-- Wireframe note: this modal is NOT dismissable by clicking
       outside; the user must click Cancel or Delete. -->
</div>
```

---

## Destructive confirm — typed-name pattern

For very destructive actions (delete account, delete production
database), require the user to TYPE the entity name to confirm.

```html
<div class="wf-modal" style="width:min(480px, 90vw);">

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:18px;
             color:var(--vc-color-danger);">
    Delete workspace permanently
  </h2>

  <p class="wf-text" data-wf-lines="3"
     style="color:var(--vc-color-content-muted);">
    This will permanently delete <strong>"acme-staging"</strong> and
    all its data. This action <strong>cannot be undone</strong>.
  </p>

  <label class="wf-label">
    Type <strong>acme-staging</strong> to confirm
  </label>
  <input class="wf-input" placeholder="acme-staging">

  <footer class="wf-modal__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button"
            style="background:var(--vc-color-danger);
                   color:var(--vc-color-on-accent);
                   opacity:0.5; cursor:not-allowed;"
            disabled>
      I understand, delete this workspace
    </button>
  </footer>

</div>
```

### Notes

- Title in danger color.
- Body explicitly names what's being deleted + that it can't be
  undone.
- Confirmation input — labeled with the EXACT NAME the user must
  type.
- Submit button is DISABLED + grayed-out until the input matches.
  At wireframe fidelity, show the disabled state (this signals
  "you can't accidentally click this").

This pattern is standard for GitHub (delete repo), Stripe (delete
account), Vercel (delete project), etc.

---

## Toast queue — multiple stacked toasts

If multiple toasts fire in quick succession, stack them vertically:

```html
<div style="position:fixed; top:16px; right:16px;
            display:flex; flex-direction:column; gap:8px;
            width:min(360px, calc(100vw - 32px));">

  <div class="wf-toast"
       style="background:var(--vc-color-success);
              color:var(--vc-color-on-accent);">
    ✓ Profile saved
  </div>

  <div class="wf-toast"
       style="background:var(--vc-color-info);
              color:var(--vc-color-on-accent);">
    📨 New message from Anna
  </div>

  <div class="wf-toast"
       style="background:var(--vc-color-warning);
              color:var(--vc-color-on-accent);">
    ⚠ Storage 80% full
  </div>

</div>
```

### Notes

- Container is positioned fixed.
- Flex column with gap of 8px between toasts.
- Each toast keeps its own background color (status-based).
- Cap at ~5 visible toasts; older ones should auto-dismiss to make
  room.
