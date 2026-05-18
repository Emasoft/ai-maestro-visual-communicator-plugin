# Settings screens — preferences, account, billing, security

## Table of Contents

- [Pattern 1 — Settings hub (sidebar + content)](#pattern-1--settings-hub-sidebar--content)
- [Pattern 2 — Single section (full-page form)](#pattern-2--single-section-full-page-form)
- [Pattern 3 — Preferences (toggles + radios)](#pattern-3--preferences-toggles--radios)
- [Pattern 4 — Security (2FA + active sessions)](#pattern-4--security-2fa--active-sessions)
- [Pattern 5 — Billing (plan + payment + invoices)](#pattern-5--billing-plan--payment--invoices)
- [Pattern 6 — Notifications (per-channel matrix)](#pattern-6--notifications-per-channel-matrix)
- [The toggle switch — CSS-only pattern](#the-toggle-switch--css-only-pattern)
- [Danger-zone section convention](#danger-zone-section-convention)
- [Save-bar convention (sticky vs inline)](#save-bar-convention-sticky-vs-inline)
- [Permission row pattern (label + description + toggle)](#permission-row-pattern-label--description--toggle)

The settings hub is one of the most-iterated screens in any
product. Six canonical shapes: section list (sidebar nav), single
section (form), preferences with toggles, security (2FA + sessions),
billing (plan + payment + invoices), notifications (matrix toggle).

## Table of contents

- [Pattern 1 — Settings hub (sidebar + content)](#pattern-1--settings-hub-sidebar--content)
- [Pattern 2 — Single section (full-page form)](#pattern-2--single-section-full-page-form)
- [Pattern 3 — Preferences (toggles + radios)](#pattern-3--preferences-toggles--radios)
- [Pattern 4 — Security (2FA + active sessions)](#pattern-4--security-2fa--active-sessions)
- [Pattern 5 — Billing (plan + payment + invoices)](#pattern-5--billing-plan--payment--invoices)
- [Pattern 6 — Notifications (per-channel matrix)](#pattern-6--notifications-per-channel-matrix)
- [The toggle switch — CSS-only pattern](#the-toggle-switch--css-only-pattern)
- [Danger-zone section convention](#danger-zone-section-convention)
- [Save-bar convention (sticky vs inline)](#save-bar-convention-sticky-vs-inline)
- [Permission row pattern (label + description + toggle)](#permission-row-pattern-label--description--toggle)

---

## Pattern 1 — Settings hub (sidebar + content)

The classic settings layout — categories on the left, current
section's form on the right.

```html
<section class="wf-screen" id="screen-settings"
         data-ve-id="screen-settings" data-ve-type="wireframe-screen">
  <div class="wf-archetype--app">

    <header class="wf-titlebar">
      <span class="wf-traffic-lights"><span></span><span></span><span></span></span>
      <span class="wf-text" data-wf-lines="1">Settings</span>
    </header>

    <aside class="wf-sidebar">
      <a class="wf-nav-item is-active" href="#screen-settings-profile">Profile</a>
      <a class="wf-nav-item" href="#screen-settings-account">Account</a>
      <a class="wf-nav-item" href="#screen-settings-notifications">Notifications</a>
      <a class="wf-nav-item" href="#screen-settings-security">Security</a>
      <a class="wf-nav-item" href="#screen-settings-billing">Billing</a>
      <a class="wf-nav-item" href="#screen-settings-team">Team</a>
      <hr class="wf-divider">
      <a class="wf-nav-item" href="#screen-settings-integrations">Integrations</a>
      <a class="wf-nav-item" href="#screen-settings-api">API keys</a>
      <hr class="wf-divider">
      <a class="wf-nav-item" href="#screen-settings-danger"
         style="color:var(--vc-color-danger);">Danger zone</a>
    </aside>

    <main class="wf-main" style="max-width:640px;">

      <h1 class="wf-text" data-wf-lines="1">Profile</h1>
      <p class="wf-text" data-wf-lines="1"
         style="color:var(--vc-color-content-subtle);">
        Your public profile information
      </p>

      <article class="wf-card">

        <div style="display:flex; gap:16px; align-items:center;">
          <span class="wf-avatar" style="width:80px; height:80px;"></span>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="wf-button wf-button--ghost">Upload photo</button>
            <button class="wf-button wf-button--ghost"
                    style="color:var(--vc-color-danger);">Remove</button>
          </div>
        </div>

        <label class="wf-label">Display name</label>
        <input class="wf-input" value="Anna Chen">

        <label class="wf-label">Username</label>
        <input class="wf-input" value="@anna">

        <label class="wf-label">Bio</label>
        <textarea class="wf-input" style="min-height:80px;"></textarea>

        <footer class="wf-card__actions">
          <button class="wf-button wf-button--ghost">Cancel</button>
          <button class="wf-button">Save changes</button>
        </footer>

      </article>

    </main>

    <footer class="wf-statusbar">…</footer>

  </div>
</section>
```

### Notes

- App archetype — sidebar holds settings categories.
- Sidebar uses `wf-divider` to group related categories (basic /
  developer / dangerous).
- Danger zone link is tinted `--vc-color-danger` — even in the
  sidebar, the destructive section signals.
- Right column (main) has the SECTION header + description above
  the form card.
- The avatar uploader is the classic 3-element row: image + upload
  + remove buttons.

---

## Pattern 2 — Single section (full-page form)

When settings has only ONE section worth showing, skip the sidebar
and use a centered single-column form.

```html
<section class="wf-screen" id="screen-edit-profile"
         data-ve-id="screen-edit-profile" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <nav class="wf-nav">
        <a class="wf-nav-item" href="#screen-app">← Back to app</a>
      </nav>
    </header>

    <main class="wf-main" style="max-width:560px;">

      <h1 class="wf-text" data-wf-lines="1">Edit profile</h1>

      <article class="wf-card">

        <label class="wf-label">Display name</label>
        <input class="wf-input">

        <label class="wf-label">Bio</label>
        <textarea class="wf-input" style="min-height:120px;"></textarea>

        <label class="wf-label">Location</label>
        <input class="wf-input">

        <label class="wf-label">Website</label>
        <input class="wf-input" type="url">

        <footer class="wf-card__actions">
          <a class="wf-button wf-button--ghost" href="#screen-app">Cancel</a>
          <button class="wf-button">Save</button>
        </footer>

      </article>

    </main>

  </div>
</section>
```

### Notes

- Web archetype — narrow column, no sidebar.
- "← Back to app" link in the header (top right) — explicit exit.
- Same form structure as the settings-hub right column.

---

## Pattern 3 — Preferences (toggles + radios)

A preferences page — feature flags, theme selection, language. Heavy
use of toggle switches.

```html
<main class="wf-main" style="max-width:640px;">

  <h1 class="wf-text" data-wf-lines="1">Preferences</h1>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Appearance</span>
    </header>

    <div>
      <label class="wf-label">Theme</label>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">
        <button class="wf-button">Light</button>
        <button class="wf-button wf-button--ghost">Dark</button>
        <button class="wf-button wf-button--ghost">System</button>
      </div>
    </div>

    <label class="wf-label">Density</label>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">
      <button class="wf-button wf-button--ghost">Comfortable</button>
      <button class="wf-button">Default</button>
      <button class="wf-button wf-button--ghost">Compact</button>
    </div>

  </article>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Editor</span>
    </header>

    <div style="display:flex; gap:12px; align-items:flex-start;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Auto-save drafts
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          Save your work every 30 seconds
        </span>
      </div>
      <span class="wf-chip"
            style="background:var(--vc-color-content);
                   color:var(--vc-color-canvas);">On</span>
    </div>

    <div style="display:flex; gap:12px; align-items:flex-start;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Spell check
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          Underline misspelled words
        </span>
      </div>
      <span class="wf-chip"
            style="background:var(--vc-color-content);
                   color:var(--vc-color-canvas);">On</span>
    </div>

    <div style="display:flex; gap:12px; align-items:flex-start;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Vim keybindings
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          Navigate with hjkl, modal editing
        </span>
      </div>
      <span class="wf-chip">Off</span>
    </div>

  </article>

</main>
```

### Notes

- Multi-button group for mutually-exclusive options (Theme, Density)
  — the SELECTED option uses primary button (filled), others ghost.
- Toggle row pattern: title + description on the left (flex:1),
  chip on the right showing On/Off.
- ON chips use inverted styling (dark bg, light fg); OFF chips use
  default chip styling.

---

## Pattern 4 — Security (2FA + active sessions)

The security settings — password change, two-factor auth, active
sessions list.

```html
<main class="wf-main" style="max-width:640px;">

  <h1 class="wf-text" data-wf-lines="1">Security</h1>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Password</span>
    </header>
    <p class="wf-text" data-wf-lines="1"
       style="color:var(--vc-color-content-subtle);">
      Last changed 3 months ago
    </p>
    <button class="wf-button wf-button--ghost"
            style="align-self:flex-start;">Change password</button>
  </article>

  <article class="wf-card">
    <header style="display:flex; justify-content:space-between;
                   align-items:center;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
        Two-factor authentication
      </span>
      <span class="wf-chip"
            style="background:var(--vc-color-success);
                   color:var(--vc-color-on-accent);">Enabled</span>
    </header>
    <p class="wf-text" data-wf-lines="2"
       style="color:var(--vc-color-content-muted);"></p>

    <div style="display:flex; gap:12px;">
      <button class="wf-button wf-button--ghost">View recovery codes</button>
      <button class="wf-button wf-button--ghost"
              style="color:var(--vc-color-danger);">Disable 2FA</button>
    </div>
  </article>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Active sessions</span>
    </header>

    <div style="display:flex; gap:12px; align-items:center;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          MacBook Pro · Chrome
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          San Francisco · Current session
        </span>
      </div>
      <span class="wf-chip"
            style="background:var(--vc-color-success);
                   color:var(--vc-color-on-accent);">Active now</span>
    </div>

    <hr class="wf-divider">

    <div style="display:flex; gap:12px; align-items:center;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          iPhone · Safari
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          San Francisco · 2h ago
        </span>
      </div>
      <button class="wf-button wf-button--ghost"
              style="color:var(--vc-color-danger);
                     padding:4px 8px;">Revoke</button>
    </div>

    <hr class="wf-divider">

    <div style="display:flex; gap:12px; align-items:center;">
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Windows · Firefox
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          New York · 5 days ago
        </span>
      </div>
      <button class="wf-button wf-button--ghost"
              style="color:var(--vc-color-danger);
                     padding:4px 8px;">Revoke</button>
    </div>

    <button class="wf-button wf-button--ghost"
            style="color:var(--vc-color-danger);">
      Sign out all other sessions
    </button>

  </article>

</main>
```

### Notes

- Password section is small — just the last-changed time + Change
  button.
- 2FA section has a status chip in the header (Enabled / Disabled).
  Disabled has additional setup CTA.
- Active sessions list shows device + location + last-seen +
  Revoke button. The CURRENT session has "Active now" green chip
  instead of a Revoke button.
- "Sign out all other sessions" full-width button at the bottom.

---

## Pattern 5 — Billing (plan + payment + invoices)

The billing settings — current plan, payment method, invoice
history.

```html
<main class="wf-main" style="max-width:640px;">

  <h1 class="wf-text" data-wf-lines="1">Billing</h1>

  <article class="wf-card">
    <header style="display:flex; justify-content:space-between;
                   align-items:center;">
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600; font-size:20px;">
        Pro plan
      </span>
      <span class="wf-chip">$29 / month</span>
    </header>

    <p class="wf-text" data-wf-lines="1"
       style="color:var(--vc-color-content-subtle);">
      Renews on June 15, 2026
    </p>

    <div style="display:flex; gap:8px; margin-top:16px;">
      <button class="wf-button wf-button--ghost">Change plan</button>
      <button class="wf-button wf-button--ghost"
              style="color:var(--vc-color-danger);">Cancel subscription</button>
    </div>
  </article>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Payment method</span>
    </header>

    <div style="display:flex; gap:12px; align-items:center;">
      <figure class="wf-image" style="width:48px; height:32px;"></figure>
      <div style="flex:1;">
        <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
          Visa ending in 4242
        </span>
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          Expires 12/27
        </span>
      </div>
      <button class="wf-button wf-button--ghost">Update</button>
    </div>
  </article>

  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Billing history</span>
    </header>

    <div class="wf-table">
      <div class="wf-table-row wf-table-row--head">
        <span class="wf-text" data-wf-lines="1">Invoice</span>
        <span class="wf-text" data-wf-lines="1">Date</span>
        <span class="wf-text" data-wf-lines="1">Amount</span>
        <span class="wf-text" data-wf-lines="1"></span>
      </div>
      <div class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">INV-001</span>
        <span class="wf-text" data-wf-lines="1">May 15</span>
        <span class="wf-text" data-wf-lines="1">$29.00</span>
        <a class="wf-text" data-wf-lines="1" href="#">Download PDF</a>
      </div>
      <div class="wf-table-row">…</div>
      <div class="wf-table-row">…</div>
    </div>

  </article>

</main>
```

### Notes

- Plan card has: plan name + price chip + renewal date + 2 actions
  (Change plan / Cancel).
- Payment method card: card image placeholder + brand+last4 +
  expiry + Update button.
- Billing history uses `wf-table` with monospace invoice IDs +
  Download PDF link in the last column.

---

## Pattern 6 — Notifications (per-channel matrix)

A 2-axis matrix: notification TYPES (rows) × CHANNELS (columns).

```html
<main class="wf-main" style="max-width:720px;">

  <h1 class="wf-text" data-wf-lines="1">Notifications</h1>

  <article class="wf-card">

    <div class="wf-table">

      <div class="wf-table-row wf-table-row--head">
        <span class="wf-text" data-wf-lines="1">Notification</span>
        <span class="wf-text" data-wf-lines="1" style="text-align:center;">In-app</span>
        <span class="wf-text" data-wf-lines="1" style="text-align:center;">Email</span>
        <span class="wf-text" data-wf-lines="1" style="text-align:center;">Push</span>
      </div>

      <div class="wf-table-row">
        <div>
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Comments on your posts</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;
                       color:var(--vc-color-content-subtle);">
            When someone replies to you
          </span>
        </div>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
        <span style="text-align:center;">
          <input type="checkbox">
        </span>
      </div>

      <div class="wf-table-row">
        <div>
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">Mentions</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;
                       color:var(--vc-color-content-subtle);">
            When you're @mentioned
          </span>
        </div>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
      </div>

      <div class="wf-table-row">
        <div>
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
            Weekly digest
          </span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;
                       color:var(--vc-color-content-subtle);">
            Summary of the week's activity
          </span>
        </div>
        <span style="text-align:center;">—</span>
        <span style="text-align:center;">
          <input type="checkbox" checked>
        </span>
        <span style="text-align:center;">—</span>
      </div>

    </div>

  </article>

</main>
```

### Notes

- Header row labels the channels (In-app, Email, Push) — centered.
- Body rows: notification name (left, with description below) +
  one checkbox per channel.
- For notifications that DON'T support a channel (e.g. Weekly
  digest is only via Email), show `—` (em dash) in that cell.
- Inputs are real `<input type="checkbox">` — wireframe shows the
  ON/OFF state.

---

## The toggle switch — CSS-only pattern

For a real toggle switch in mid-fi+ wireframes, use this CSS-only
pattern:

```html
<label class="wf-toggle">
  <input type="checkbox" checked>
  <span class="wf-toggle__track"></span>
</label>

<style>
.wf-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
  cursor: pointer;
}
.wf-toggle input {
  opacity: 0;
  width: 0; height: 0;
}
.wf-toggle__track {
  position: absolute;
  inset: 0;
  background: var(--vc-color-border-strong);
  border-radius: 12px;
  transition: background 0.2s;
}
.wf-toggle__track::before {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 20px; height: 20px;
  background: var(--vc-color-canvas);
  border-radius: 50%;
  transition: transform 0.2s;
}
.wf-toggle input:checked + .wf-toggle__track {
  background: var(--vc-color-accent);
}
.wf-toggle input:checked + .wf-toggle__track::before {
  transform: translateX(16px);
}
</style>
```

At wireframe fidelity, the accent desaturates to grey — the
toggle looks grey-on for ON state, lighter-grey for OFF state.
At mid+ fidelity, the accent re-emerges as brand color.

---

## Danger-zone section convention

A "danger zone" is the section for irreversible actions — delete
account, delete workspace, transfer ownership.

```html
<article class="wf-card"
         style="border:1px solid var(--vc-color-danger);">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1"
          style="color:var(--vc-color-danger);
                 font-weight:600;">Danger zone</span>
  </header>

  <div style="display:flex; gap:16px; align-items:center;">
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
        Transfer workspace
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">
        Transfer ownership to another member.
      </span>
    </div>
    <button class="wf-button wf-button--ghost"
            style="color:var(--vc-color-danger);">Transfer</button>
  </div>

  <hr class="wf-divider">

  <div style="display:flex; gap:16px; align-items:center;">
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
        Delete workspace
      </span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);">
        This action is permanent. All data will be lost.
      </span>
    </div>
    <button class="wf-button wf-button--ghost"
            style="color:var(--vc-color-danger);">Delete</button>
  </div>

</article>
```

### Notes

- Card has a `--vc-color-danger` border (desaturates to grey at
  wireframe).
- Section title is danger-tinted.
- Each action row has a description + a danger-tinted ghost button.
- Use this only for IRREVERSIBLE actions. Reversible actions
  belong in the main settings section.

---

## Save-bar convention (sticky vs inline)

### Inline save bar (per-card)

The default — Save / Cancel buttons at the BOTTOM of each card via
`wf-card__actions`:

```html
<article class="wf-card">
  <label class="wf-label">Display name</label>
  <input class="wf-input">

  <footer class="wf-card__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button">Save</button>
  </footer>
</article>
```

Each section saves independently. Good for unrelated sections.

### Sticky save bar (page-wide)

For settings with MANY sections that should save together, use a
sticky bottom bar:

```html
<footer class="wf-statusbar"
        style="position:sticky; bottom:0; gap:8px;">
  <span class="wf-text" data-wf-lines="1" style="flex:1;">
    You have unsaved changes in 2 sections.
  </span>
  <button class="wf-button wf-button--ghost">Discard all</button>
  <button class="wf-button">Save all</button>
</footer>
```

The dirty-state message names HOW MANY sections have changes; the
two actions are global Discard / Save.

Pick ONE convention per settings page. Mixing per-card AND sticky
bar confuses the user (which one saves what?).

---

## Permission row pattern (label + description + toggle)

The most-used row pattern in settings — used in preferences, in
notifications, in feature flags, in integrations.

```html
<div style="display:flex; gap:16px; align-items:flex-start;
            padding:12px 0;
            border-bottom:1px solid var(--vc-color-border);">

  <div style="flex:1;">
    <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
      Setting name
    </span>
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;
                 color:var(--vc-color-content-subtle);">
      Brief description of what this does
    </span>
  </div>

  <span class="wf-chip"
        style="background:var(--vc-color-content);
               color:var(--vc-color-canvas);">On</span>

</div>
```

### Notes

- Flex row with `align-items: flex-start` (so the label aligns
  with the top of the description, not the middle).
- Label is BOLD; description is SMALL and SUBTLE.
- Toggle / chip on the right at the same vertical alignment as the
  label.
- For VERY long descriptions, the row grows in height — the
  toggle stays at the top.

This pattern scales: 5 rows of the same shape make a coherent
preferences section without needing wrapper `<fieldset>` elements.
