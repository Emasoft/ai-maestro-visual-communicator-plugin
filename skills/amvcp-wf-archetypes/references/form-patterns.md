# Form patterns — inputs, fields, layouts, validation states

## Table of Contents

- [Single-column form (the default)](#single-column-form-the-default)
- [Two-column form (wide screens)](#two-column-form-wide-screens)
- [Field group — related inputs share a section](#field-group--related-inputs-share-a-section)
- [Input variants — textarea, select, file, multi-line](#input-variants--textarea-select-file-multi-line)
- [Inline help — `wf-label` + small text](#inline-help--wf-label--small-text)
- [Error state — invalid input + error message](#error-state--invalid-input--error-message)
- [Success state — saved confirmation](#success-state--saved-confirmation)
- [Required-field marker](#required-field-marker)
- [Optional-field marker (inverted convention)](#optional-field-marker-inverted-convention)
- [Multi-step wizard (progress bar + per-step forms)](#multi-step-wizard-progress-bar--per-step-forms)
- [Login + signup pair (the auth duo)](#login--signup-pair-the-auth-duo)
- [Search form (single input + filter row)](#search-form-single-input--filter-row)
- [Action bar — sticky save / cancel at the bottom](#action-bar--sticky-save--cancel-at-the-bottom)
- [Overview](#overview)

## Overview

The full form authoring vocabulary for wireframes: single-column
layouts, two-column layouts, field groups, error states, success
states, the multi-step wizard. All driven by `wf-input`, `wf-label`,
and `wf-button` from the kit.

## Table of contents

- [Single-column form (the default)](#single-column-form-the-default)
- [Two-column form (wide screens)](#two-column-form-wide-screens)
- [Field group — related inputs share a section](#field-group--related-inputs-share-a-section)
- [Input variants — textarea, select, file, multi-line](#input-variants--textarea-select-file-multi-line)
- [Inline help — `wf-label` + small text](#inline-help--wf-label--small-text)
- [Error state — invalid input + error message](#error-state--invalid-input--error-message)
- [Success state — saved confirmation](#success-state--saved-confirmation)
- [Required-field marker](#required-field-marker)
- [Optional-field marker (inverted convention)](#optional-field-marker-inverted-convention)
- [Multi-step wizard (progress bar + per-step forms)](#multi-step-wizard-progress-bar--per-step-forms)
- [Login + signup pair (the auth duo)](#login--signup-pair-the-auth-duo)
- [Search form (single input + filter row)](#search-form-single-input--filter-row)
- [Action bar — sticky save / cancel at the bottom](#action-bar--sticky-save--cancel-at-the-bottom)

---

## Single-column form (the default)

The standard form layout — one label per row, one input per row.
Use this 90% of the time. The card scopes the form; the wf-label
and wf-input pairs stack vertically.

```html
<article class="wf-card" data-ve-id="form-signup"
         data-ve-type="wireframe-block">

  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Create your account</span>
  </header>

  <label class="wf-label">Email</label>
  <input class="wf-input" type="email" placeholder="you@example.com">

  <label class="wf-label">Password</label>
  <input class="wf-input" type="password" placeholder="••••••••">

  <label class="wf-label">Display name</label>
  <input class="wf-input" placeholder="Anna Chen">

  <footer class="wf-card__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button">Create account</button>
  </footer>

</article>
```

### Notes

- Each label-input pair is rendered as TWO STACKED ELEMENTS, not
  via flex / grid. The `wf-card`'s vertical flex layout handles
  the spacing.
- The `<label class="wf-label">` is visually above its input but
  NOT semantically linked (`for=` is optional in wireframes). For
  production accessibility, add `for="email"` and `id="email"` on
  the input.
- The actions footer is right-aligned via `wf-card__actions`
  (which uses `display: flex; gap: 12px; margin-top: 8px`).

---

## Two-column form (wide screens)

For long forms on wide layouts, split into two columns. Each column
is a single-column form; CSS grid lays them side-by-side.

```html
<article class="wf-card">

  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Profile</span>
  </header>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">

    <div>
      <label class="wf-label">First name</label>
      <input class="wf-input">
    </div>

    <div>
      <label class="wf-label">Last name</label>
      <input class="wf-input">
    </div>

    <div style="grid-column:1/-1;">
      <label class="wf-label">Email</label>
      <input class="wf-input">
    </div>

    <div>
      <label class="wf-label">Phone</label>
      <input class="wf-input">
    </div>

    <div>
      <label class="wf-label">Time zone</label>
      <input class="wf-input">
    </div>

  </div>

</article>
```

### Notes

- `grid-template-columns: 1fr 1fr` for a 50/50 split. Use
  `1fr 2fr` for an asymmetric split (e.g. label-narrower).
- A field spanning the full width uses `grid-column: 1/-1` (which
  spans from the first to the last column line).
- On narrow viewports, swap to single-column by overriding the
  grid: `@media (max-width: 600px) { grid-template-columns: 1fr; }`.

---

## Field group — related inputs share a section

When 3-5 related fields belong together (address: street + city +
state + zip), wrap them in a sub-section with a small section
heading.

```html
<article class="wf-card">

  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Shipping address</span>
  </header>

  <fieldset style="border:none; padding:0; display:flex; flex-direction:column; gap:8px;">

    <legend class="wf-label">Address</legend>

    <input class="wf-input" placeholder="Street address">

    <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:8px;">
      <input class="wf-input" placeholder="City">
      <input class="wf-input" placeholder="State">
      <input class="wf-input" placeholder="ZIP">
    </div>

    <input class="wf-input" placeholder="Country">

  </fieldset>

</article>
```

### Notes

- `<fieldset>` + `<legend>` is the semantic HTML for grouping.
  Style the fieldset to remove its default border + padding.
- The legend doubles as the group label — small uppercase
  (`wf-label` styling).
- Inside the fieldset, mix single-column rows and multi-column
  grids (street is full-width; city/state/zip share a row).

---

## Input variants — textarea, select, file, multi-line

`wf-input` is the visual base; the actual HTML element type
controls the input MODE.

```html
<!-- single-line text -->
<input class="wf-input" placeholder="Username">

<!-- multi-line text -->
<textarea class="wf-input" placeholder="Tell us about yourself"
          style="min-height:80px; resize:vertical;"></textarea>

<!-- select dropdown (wireframe shows it closed) -->
<select class="wf-input">
  <option>Choose a country</option>
</select>

<!-- file upload -->
<input class="wf-input" type="file">

<!-- date / time -->
<input class="wf-input" type="date">
<input class="wf-input" type="time">

<!-- range / slider — pair with explicit min/max -->
<input class="wf-input" type="range" min="0" max="100" value="50">

<!-- color picker — for a design tool -->
<input class="wf-input" type="color" value="#888">

<!-- search (renders with a clear button on most browsers) -->
<input class="wf-input" type="search" placeholder="Search">

<!-- checkbox / radio — paired with a separate label -->
<div style="display:flex; gap:8px; align-items:center;">
  <input type="checkbox" id="agree">
  <label for="agree" class="wf-text" data-wf-lines="1">
    I agree to the terms
  </label>
</div>
```

### Notes

- `wf-input` is generic — applying it to any `<input>` / `<textarea>`
  / `<select>` gives them the same sunken-well visual.
- Checkboxes and radios are TINY (~18px) and don't carry the
  `wf-input` styling; pair them with an inline-flex layout + a
  `wf-text` label.
- For a wireframe, the EXACT input type matters less than showing
  the FIELD's purpose. A `<input type="text">` with placeholder
  "you@example.com" is read as "email field" without the actual
  `type="email"`.

---

## Inline help — `wf-label` + small text

Help text below a field — a sub-label that explains constraints.

```html
<label class="wf-label">Password</label>
<input class="wf-input" type="password">
<span class="wf-text" data-wf-lines="1"
      style="font-size:12px; color:var(--vc-color-content-subtle);">
  8+ characters, including a number and a symbol
</span>
```

### Notes

- Help text uses `wf-text` with explicit `font-size: 12px` and
  `--vc-color-content-subtle` — subtle but readable.
- Place the help text DIRECTLY below the input, BEFORE the next
  label. Don't put it above the input — it reads as an obstacle to
  the field.
- For inline help INSIDE the field (placeholder text), use the
  `placeholder` attribute.

---

## Error state — invalid input + error message

A field that failed validation gets a left-border accent color
override and an error message below.

```html
<label class="wf-label">Email</label>
<input class="wf-input"
       value="not-an-email"
       style="border-color: var(--vc-color-danger);
              border-left-width: 4px;">
<span class="wf-text" data-wf-lines="1"
      style="font-size:12px; color:var(--vc-color-danger);">
  Please enter a valid email address.
</span>
```

### Notes

- Border tinted with `--vc-color-danger` (clay red at hi fidelity,
  desaturated to grey at wireframe). The 4px left border is the
  attention pattern.
- The error message uses `--vc-color-danger` too — same color
  ties the message to the field.
- At wireframe fidelity the danger color desaturates to a slightly-
  darker grey — the error STILL visually distinct (the 4px
  left-border is the chief signal), without leaking brand color.

For a multi-field form with errors, group them with a single
top-of-form summary:

```html
<article class="wf-card">

  <div class="wf-toast"
       style="background-color: var(--vc-color-danger);
              color: var(--vc-color-on-accent, white);">
    There are 2 problems with this form.
  </div>

  <label class="wf-label">Email</label>
  <input class="wf-input" value="not-an-email"
         style="border-color: var(--vc-color-danger);">
  <span class="wf-text" data-wf-lines="1"
        style="color:var(--vc-color-danger);">
    Please enter a valid email address.
  </span>

  <label class="wf-label">Password</label>
  <input class="wf-input" type="password" value=""
         style="border-color: var(--vc-color-danger);">
  <span class="wf-text" data-wf-lines="1"
        style="color:var(--vc-color-danger);">
    Password is required.
  </span>

</article>
```

---

## Success state — saved confirmation

A toast appears after a save action. The toast is GREEN
(`--vc-color-success`) at hi fidelity, grey at wireframe.

```html
<div class="wf-toast"
     style="background-color: var(--vc-color-success);
            color: var(--vc-color-on-accent, white);">
  ✓ Profile saved.
</div>
```

For inline field success (e.g. an "available" check on a username
field), put a small green chip next to the input:

```html
<label class="wf-label">Username</label>
<div style="display:flex; gap:8px; align-items:center;">
  <input class="wf-input" value="anna" style="flex:1;">
  <span class="wf-chip" style="background:var(--vc-color-success);
                                color:var(--vc-color-on-accent);">
    ✓ Available
  </span>
</div>
```

---

## Required-field marker

Convention: required fields are NOT marked (since most fields are
required); OPTIONAL fields are marked with "(optional)" in the
label. This is the inverted convention favored by modern UX.

```html
<!-- required, no marker -->
<label class="wf-label">Email</label>
<input class="wf-input">

<!-- optional, marked -->
<label class="wf-label">Display name (optional)</label>
<input class="wf-input">
```

If your design system uses the OLDER required-marker convention,
add a red asterisk to the label:

```html
<label class="wf-label">
  Email
  <span style="color:var(--vc-color-danger);">*</span>
</label>
<input class="wf-input">
```

Pick ONE convention per form — mixing makes the form confusing.

---

## Optional-field marker (inverted convention)

See above. The optional marker is the favored modern UX
convention — reduces visual noise (most fields are required, so
they don't need a marker) and explicitly calls out the few fields
that aren't.

---

## Multi-step wizard (progress bar + per-step forms)

A form too long for one screen — split into steps. The progress
indicator at the top shows the user where they are.

```html
<section class="wf-screen" id="screen-wizard-1"
         data-ve-id="screen-wizard-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:560px;">

      <nav style="display:flex; gap:8px; align-items:center;">
        <span class="wf-chip" style="background:var(--vc-color-content);
                                       color:var(--vc-color-canvas);">1</span>
        <span class="wf-text" data-wf-lines="1">Account</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">2</span>
        <span class="wf-text" data-wf-lines="1">Profile</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">3</span>
        <span class="wf-text" data-wf-lines="1">Verify</span>
      </nav>

      <article class="wf-card">

        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Step 1: Account</span>
        </header>

        <label class="wf-label">Email</label>
        <input class="wf-input">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password">

        <footer class="wf-card__actions">
          <button class="wf-button wf-button--ghost">Cancel</button>
          <a class="wf-button" href="#screen-wizard-2">Continue →</a>
        </footer>

      </article>

    </main>

  </div>
</section>
```

### Notes

- The CURRENT step's chip is INVERTED (dark background, light
  text). Subsequent steps stay default-chip.
- The dividers between steps grow (`flex: 1`) to fill the
  available width.
- The continue button is an ANCHOR (not a `<button>`) so it
  navigates to the next screen via fragment.
- For COMPLETED steps (after the user advances), swap the chip
  for a checkmark: `<span class="wf-chip">✓</span>`.

---

## Login + signup pair (the auth duo)

The login and signup screens are the most common auth screens.
They pair naturally — signup links to login, login links to signup.

### Login

```html
<section class="wf-screen" id="screen-login"
         data-ve-id="screen-login" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px;">

      <h1 class="wf-text" data-wf-lines="1" style="text-align:center;">
        Welcome back
      </h1>

      <article class="wf-card">

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password">

        <a href="#screen-forgot" class="wf-text" data-wf-lines="1"
           style="font-size:12px; text-align:right;">
          Forgot password?
        </a>

        <button class="wf-button">Log in</button>

        <p class="wf-text" data-wf-lines="1" style="text-align:center;">
          New here? <a href="#screen-signup">Create an account</a>
        </p>

      </article>

    </main>

  </div>
</section>
```

### Signup

```html
<section class="wf-screen" id="screen-signup"
         data-ve-id="screen-signup" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px;">

      <h1 class="wf-text" data-wf-lines="1" style="text-align:center;">
        Create your account
      </h1>

      <article class="wf-card">

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px; color:var(--vc-color-content-subtle);">
          8+ characters, including a number and a symbol
        </span>

        <div style="display:flex; gap:8px; align-items:center;">
          <input type="checkbox" id="terms">
          <label for="terms" class="wf-text" data-wf-lines="1">
            I agree to the <a href="#screen-terms">terms</a>
          </label>
        </div>

        <button class="wf-button">Sign up</button>

        <p class="wf-text" data-wf-lines="1" style="text-align:center;">
          Have an account? <a href="#screen-login">Log in</a>
        </p>

      </article>

    </main>

  </div>
</section>
```

### Notes

- `max-width: 400px` on `wf-main` — auth forms are NARROW.
- The "Forgot password?" link is right-aligned BELOW the password
  field.
- The toggle link at the bottom (between login and signup) is the
  conventional pair link.

---

## Search form (single input + filter row)

```html
<form>
  <input class="wf-input" type="search" placeholder="Search products">

  <nav style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
    <span class="wf-chip">Category: All</span>
    <span class="wf-chip">Price: any</span>
    <span class="wf-chip">In stock</span>
    <a href="#" class="wf-text" data-wf-lines="1" style="font-size:12px;">
      Clear all
    </a>
  </nav>
</form>
```

### Notes

- `<input type="search">` gets browser-default clear button.
- Filter chips below; the "Clear all" link is the conventional
  reset affordance.

---

## Action bar — sticky save / cancel at the bottom

For long forms, a sticky action bar at the bottom keeps Save / Cancel
visible without scrolling.

```html
<footer class="wf-statusbar"
        style="position:sticky; bottom:0; gap:8px;">
  <span class="wf-text" data-wf-lines="1" style="flex:1;">
    You have unsaved changes.
  </span>
  <button class="wf-button wf-button--ghost">Discard</button>
  <button class="wf-button">Save changes</button>
</footer>
```

### Notes

- `position: sticky; bottom: 0` keeps it at the bottom of the
  viewport while scrolling.
- The dirty-state message ("You have unsaved changes") is the
  conventional left-aligned text.
- For very long forms with multiple sections, put save bars at
  the END of each section instead of one global sticky bar.
