# Onboarding flows — wizards, tours, empty states, progress

## Table of Contents

- [Pattern 1 — Multi-step wizard (3-7 steps)](#pattern-1--multi-step-wizard-3-7-steps)
- [Pattern 2 — In-product tour (coachmarks)](#pattern-2--in-product-tour-coachmarks)
- [Pattern 3 — Empty state with CTA](#pattern-3--empty-state-with-cta)
- [Pattern 4 — Progressive disclosure (expandable sections)](#pattern-4--progressive-disclosure-expandable-sections)
- [Pattern 5 — Skeleton loaders (placeholder while fetching)](#pattern-5--skeleton-loaders-placeholder-while-fetching)
- [Pattern 6 — Success celebration ("you're all set")](#pattern-6--success-celebration-youre-all-set)
- [Progress indicators — bar, dots, stepper, checklist](#progress-indicators--bar-dots-stepper-checklist)
- [The skip-this-step affordance](#the-skip-this-step-affordance)
- [Conditional fields (show field B only if A is checked)](#conditional-fields-show-field-b-only-if-a-is-checked)
- [Save-and-continue-later anchor](#save-and-continue-later-anchor)

The 0-to-1 user experience. Six patterns: multi-step wizard,
in-product tour (coachmarks), empty state → CTA, progressive
disclosure, skeleton loaders, the "you're all set" celebration.

## Table of contents

- [Pattern 1 — Multi-step wizard (3-7 steps)](#pattern-1--multi-step-wizard-3-7-steps)
- [Pattern 2 — In-product tour (coachmarks)](#pattern-2--in-product-tour-coachmarks)
- [Pattern 3 — Empty state with CTA](#pattern-3--empty-state-with-cta)
- [Pattern 4 — Progressive disclosure (expandable sections)](#pattern-4--progressive-disclosure-expandable-sections)
- [Pattern 5 — Skeleton loaders (placeholder while fetching)](#pattern-5--skeleton-loaders-placeholder-while-fetching)
- [Pattern 6 — Success celebration ("you're all set")](#pattern-6--success-celebration-youre-all-set)
- [Progress indicators — bar, dots, stepper, checklist](#progress-indicators--bar-dots-stepper-checklist)
- [The skip-this-step affordance](#the-skip-this-step-affordance)
- [Conditional fields (show field B only if A is checked)](#conditional-fields-show-field-b-only-if-a-is-checked)
- [Save-and-continue-later anchor](#save-and-continue-later-anchor)

---

## Pattern 1 — Multi-step wizard (3-7 steps)

A long form split across N screens. Each step is its own `wf-screen`
so the user can navigate via fragment anchors (Back, Continue).

```html
<!-- Step 1 — Account -->
<section class="wf-screen" id="screen-wizard-1"
         data-ve-id="screen-wizard-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:560px; margin:48px auto;">

      <nav style="display:flex; gap:8px; align-items:center;">
        <span class="wf-chip"
              style="background:var(--vc-color-content);
                     color:var(--vc-color-canvas);">1</span>
        <span class="wf-text" data-wf-lines="1">Account</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">2</span>
        <span class="wf-text" data-wf-lines="1">Profile</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">3</span>
        <span class="wf-text" data-wf-lines="1">Workspace</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">4</span>
        <span class="wf-text" data-wf-lines="1">Invite team</span>
      </nav>

      <article class="wf-card">

        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">Step 1 of 4: Account</span>
        </header>
        <p class="wf-text" data-wf-lines="1"
           style="color:var(--vc-color-content-subtle);">
          Let's start with the basics.
        </p>

        <label class="wf-label">Email</label>
        <input class="wf-input">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password">

        <footer class="wf-card__actions">
          <a class="wf-button wf-button--ghost" href="#screen-marketing">Cancel</a>
          <a class="wf-button" href="#screen-wizard-2">Continue →</a>
        </footer>

      </article>

    </main>

  </div>
</section>

<!-- Step 2, 3, 4 — same shape, different chip-active and form -->
```

### Notes

- 4 chip-with-label pairs at the top, separated by growing dividers.
- The active step's chip is INVERTED (dark bg, light fg). Inactive
  chips use default styling.
- Each step's card has: "Step N of M: Title", description, form
  fields, Back/Continue footer.
- For COMPLETED steps (after the user has moved past), swap the
  number for a checkmark: `<span class="wf-chip">✓</span>`.

### Step count guidance

| Steps | When |
|---|---|
| 3 | Short flow — sign up + verify + done |
| 4-5 | Standard onboarding (account / profile / workspace / invite) |
| 6-7 | Long but structured (a SaaS setup wizard) |
| 8+ | Reconsider — split into TWO wizards, or use a checklist |

---

## Pattern 2 — In-product tour (coachmarks)

A guided tour overlaid on the LIVE product UI — coachmarks point to
real elements with explanatory bubbles.

```html
<section class="wf-screen" id="screen-tour-1"
         data-ve-id="screen-tour-1" data-ve-type="wireframe-screen">

  <!-- the underlying app screen, dimmed -->
  <div class="wf-archetype--app"
       style="filter:brightness(0.55);
              pointer-events:none;">
    <header class="wf-titlebar">…</header>
    <aside class="wf-sidebar">…</aside>
    <main class="wf-main">…</main>
  </div>

  <!-- the coachmark callout (positioned absolutely) -->
  <div style="position:absolute;
              top:80px; left:264px;
              max-width:320px;">

    <!-- the pointer triangle -->
    <span style="position:absolute;
                 top:-8px; left:24px;
                 width:0; height:0;
                 border-left:8px solid transparent;
                 border-right:8px solid transparent;
                 border-bottom:8px solid var(--vc-color-surface-raised);"></span>

    <article class="wf-card"
             style="background:var(--vc-color-surface-raised);
                    box-shadow:0 4px 24px rgba(0,0,0,0.2);">

      <header style="display:flex; justify-content:space-between;">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);
                     text-transform:uppercase;
                     letter-spacing:0.1em;">1 of 4</span>
        <a href="#screen-app" class="wf-text" data-wf-lines="1">×</a>
      </header>

      <h3 class="wf-text" data-wf-lines="1">Your sidebar lives here</h3>

      <p class="wf-text" data-wf-lines="2"></p>

      <footer class="wf-card__actions">
        <button class="wf-button wf-button--ghost">Skip tour</button>
        <a class="wf-button" href="#screen-tour-2">Next →</a>
      </footer>

    </article>

  </div>

</section>
```

### Notes

- The underlying UI is dimmed via `filter: brightness(0.55)` and
  inert via `pointer-events: none` — coachmark mode prevents
  accidental clicks.
- The coachmark is positioned ABSOLUTELY at coordinates that point
  to the highlighted element.
- The pointer triangle is a CSS pseudo-element / dummy span with
  border tricks (no SVG needed).
- Tour position indicator ("1 of 4") + close button (×) in the
  header.
- Skip tour / Next buttons in the footer.

For SPOTLIGHT effect (the highlighted element stays bright, the
rest dims), use a `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)` on
the highlighted element's clone — but at wireframe fidelity, the
brightness-filter approach is simpler and reads correctly.

---

## Pattern 3 — Empty state with CTA

A screen with no data yet — guide the user toward creating
something. Already covered in `mobile-screens.md`; here's the
desktop variant.

```html
<main class="wf-main" style="display:flex;
                              flex-direction:column;
                              align-items:center;
                              justify-content:center;
                              min-height:480px;
                              text-align:center;">

  <figure class="wf-image" style="width:160px; height:160px;
                                    margin:0 auto;
                                    border-radius:50%;"></figure>

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:24px; margin-top:24px;">
    No projects yet
  </h2>

  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);
            max-width:400px;
            margin:8px auto 24px;"></p>

  <div style="display:flex; gap:8px;">
    <button class="wf-button">Create your first project</button>
    <button class="wf-button wf-button--ghost">Import from CSV</button>
  </div>

  <p class="wf-text" data-wf-lines="1"
     style="font-size:12px;
            color:var(--vc-color-content-subtle);
            margin-top:24px;">
    Or <a href="#screen-templates">browse templates</a>
  </p>

</main>
```

### Notes

- Centered, generous vertical space.
- Image is round + 160px — empty states use spot illustrations,
  not full hero images.
- Two CTAs: primary "Create" + secondary "Import". For very
  simple empty states, drop the secondary.
- Tertiary action ("browse templates") as a small text link below.

---

## Pattern 4 — Progressive disclosure (expandable sections)

Show the basics by default; expand to reveal advanced options. Uses
native `<details>` elements (no JS).

```html
<article class="wf-card">

  <label class="wf-label">Project name</label>
  <input class="wf-input">

  <label class="wf-label">Visibility</label>
  <select class="wf-input">
    <option>Private</option>
    <option>Team</option>
    <option>Public</option>
  </select>

  <details>
    <summary class="wf-text" data-wf-lines="1"
             style="cursor:pointer;
                    color:var(--vc-color-content-muted);
                    font-size:14px;">
      ▸ Advanced options
    </summary>

    <div style="margin-top:16px; display:flex; flex-direction:column; gap:16px;">

      <div>
        <label class="wf-label">Branch protection</label>
        <input class="wf-input"
               placeholder="main, release/*">
      </div>

      <div>
        <label class="wf-label">Default reviewer</label>
        <input class="wf-input">
      </div>

      <div>
        <label class="wf-label">CI integration</label>
        <select class="wf-input">
          <option>None</option>
          <option>GitHub Actions</option>
          <option>CircleCI</option>
        </select>
      </div>

    </div>
  </details>

  <footer class="wf-card__actions">
    <button class="wf-button wf-button--ghost">Cancel</button>
    <button class="wf-button">Create project</button>
  </footer>

</article>
```

### Notes

- `<details>` + `<summary>` is the semantic HTML for collapse/expand.
  Native browser support — no JS.
- The summary content includes a manual `▸` arrow (the browser-
  default disclosure triangle is small and varies by OS).
- Inside the `<details>`, lay out the form fields with the same
  spacing as the main form.

For multi-section progressive disclosure, use multiple `<details>`
elements in sequence. Each opens/closes independently.

---

## Pattern 5 — Skeleton loaders (placeholder while fetching)

While async data loads, show a skeleton — placeholder shapes that
match the eventual layout.

```html
<article class="wf-card">

  <!-- skeleton avatar + name row -->
  <header style="display:flex; gap:12px; align-items:center;">
    <span class="wf-avatar"
          style="background:var(--vc-color-surface-sunken);
                 animation:wf-shimmer 1.5s infinite linear;"></span>
    <div style="flex:1;">
      <span class="wf-text" data-wf-lines="1"
            style="max-width:120px;
                   animation:wf-shimmer 1.5s infinite linear;"></span>
      <span class="wf-text" data-wf-lines="1"
            style="max-width:80px;
                   animation:wf-shimmer 1.5s infinite linear;"></span>
    </div>
  </header>

  <!-- skeleton image -->
  <figure class="wf-image"
          style="animation:wf-shimmer 1.5s infinite linear;"></figure>

  <!-- skeleton body -->
  <p class="wf-text" data-wf-lines="3"
     style="animation:wf-shimmer 1.5s infinite linear;"></p>

</article>

<style>
@keyframes wf-shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { opacity: 0.5; }
}

@media (prefers-reduced-motion: reduce) {
  [style*="wf-shimmer"] { animation: none !important; }
}
</style>
```

### Notes

- Skeleton uses the SAME `wf-*` blocks as the eventual content —
  same shapes, same proportions. The user sees the layout being
  built.
- The pulse animation cycles opacity 0.5 → 0.8 → 0.5 (subtle, not
  distracting).
- Respect `prefers-reduced-motion` — kill the animation for users
  with motion sensitivity.

For a static wireframe of the loading state, drop the animation
keyframes — the skeleton shape itself communicates "this is the
loading state".

---

## Pattern 6 — Success celebration ("you're all set")

The final screen of onboarding — confirm success, set next-action
expectations.

```html
<section class="wf-screen" id="screen-onboarding-done"
         data-ve-id="screen-onboarding-done" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:560px;
                                  margin:48px auto;
                                  text-align:center;">

      <span class="wf-chip"
            style="background:var(--vc-color-success);
                   color:var(--vc-color-on-accent);
                   font-size:36px;
                   width:96px; height:96px;
                   border-radius:50%;
                   justify-content:center;
                   margin:0 auto;">
        ✓
      </span>

      <h1 class="wf-text" data-wf-lines="1"
          style="font-size:32px; margin-top:24px;">
        You're all set
      </h1>

      <p class="wf-text" data-wf-lines="2"
         style="color:var(--vc-color-content-muted);
                max-width:400px;
                margin:8px auto 32px;"></p>

      <a class="wf-button" href="#screen-app"
         style="padding:14px 32px; font-size:16px;">
        Go to your dashboard →
      </a>

      <hr class="wf-divider" style="max-width:300px; margin:32px auto;">

      <p class="wf-text" data-wf-lines="1"
         style="font-size:12px;
                color:var(--vc-color-content-subtle);">
        Need help? <a href="#screen-docs">Check the getting-started guide</a>
      </p>

    </main>

  </div>
</section>
```

### Notes

- Big green check chip — 96 × 96, the centerpiece.
- Big headline + sub-headline.
- ONE primary CTA — "Go to your dashboard". No competing actions.
- Secondary "Need help?" link below the divider — for users who
  want guidance.

---

## Progress indicators — bar, dots, stepper, checklist

Four ways to show progress through a flow. Pick by step count and
flow shape.

### Linear bar (used for known-percentage tasks)

```html
<div style="background:var(--vc-color-border);
            border-radius:4px; height:8px;
            overflow:visible;">
  <div style="background:var(--vc-color-accent);
              width:60%; height:100%;
              border-radius:4px;"></div>
</div>
```

Best for: upload progress, percent-complete tasks, file processing.

### Dots (compact, no labels)

```html
<nav style="display:flex; gap:8px; justify-content:center;">
  <span class="wf-avatar" style="width:8px; height:8px;
                                   background:var(--vc-color-content);"></span>
  <span class="wf-avatar" style="width:8px; height:8px;
                                   background:var(--vc-color-content);"></span>
  <span class="wf-avatar" style="width:8px; height:8px;
                                   background:var(--vc-color-border);"></span>
  <span class="wf-avatar" style="width:8px; height:8px;
                                   background:var(--vc-color-border);"></span>
</nav>
```

Best for: image carousels, onboarding tours (5+ slides).

### Stepper (labeled chips with dividers)

See [Pattern 1](#pattern-1--multi-step-wizard-3-7-steps). Best for:
multi-step wizards with named steps.

### Checklist (multi-task setup)

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Setup checklist (2/5)</span>
  </header>

  <div style="background:var(--vc-color-border);
              border-radius:4px; height:6px;
              margin-bottom:16px;">
    <div style="background:var(--vc-color-accent);
                width:40%; height:100%; border-radius:4px;"></div>
  </div>

  <label style="display:flex; gap:8px; align-items:center; padding:8px 0;">
    <input type="checkbox" checked>
    <span class="wf-text" data-wf-lines="1"
          style="text-decoration:line-through;
                 color:var(--vc-color-content-subtle);">
      Create your account
    </span>
  </label>

  <label style="display:flex; gap:8px; align-items:center; padding:8px 0;">
    <input type="checkbox" checked>
    <span class="wf-text" data-wf-lines="1"
          style="text-decoration:line-through;
                 color:var(--vc-color-content-subtle);">
      Set up your profile
    </span>
  </label>

  <a href="#screen-workspace"
     style="display:flex; gap:8px; align-items:center; padding:8px 0;">
    <input type="checkbox">
    <span class="wf-text" data-wf-lines="1"
          style="font-weight:600;">
      Create your first workspace →
    </span>
  </a>

  <label style="display:flex; gap:8px; align-items:center; padding:8px 0;">
    <input type="checkbox">
    <span class="wf-text" data-wf-lines="1">Invite teammates</span>
  </label>

  <label style="display:flex; gap:8px; align-items:center; padding:8px 0;">
    <input type="checkbox">
    <span class="wf-text" data-wf-lines="1">Install the extension</span>
  </label>

</article>
```

Best for: non-linear setup tasks the user can complete in any
order.

---

## The skip-this-step affordance

Every wizard / tour should let the user SKIP. Two patterns:

### Skip-this-step (continue to next)

A small ghost button in the footer:

```html
<footer style="display:flex; justify-content:space-between;">
  <button class="wf-button wf-button--ghost">Skip this step</button>
  <a class="wf-button" href="#screen-wizard-3">Continue →</a>
</footer>
```

### Skip-entire-tour (escape the whole flow)

A small link in the top-right:

```html
<header style="display:flex; justify-content:space-between;">
  <span></span>
  <a href="#screen-app" class="wf-text" data-wf-lines="1"
     style="font-size:12px;
            color:var(--vc-color-content-subtle);">
    Skip tour
  </a>
</header>
```

Show BOTH on long flows — per-step skip + global skip.

---

## Conditional fields (show field B only if A is checked)

For forms with conditional logic, use a wrapper that's hidden until
the trigger condition is met. In a wireframe, just show both states:

```html
<!-- The trigger -->
<div style="display:flex; gap:8px; align-items:center;">
  <input type="checkbox" id="ship-elsewhere" checked>
  <label for="ship-elsewhere" class="wf-text" data-wf-lines="1">
    Ship to a different address
  </label>
</div>

<!-- The conditional fields (shown when checked) -->
<div style="margin-left:24px;
            padding-left:16px;
            border-left:2px solid var(--vc-color-border);
            display:flex; flex-direction:column; gap:12px;">

  <div>
    <label class="wf-label">Recipient name</label>
    <input class="wf-input">
  </div>

  <div>
    <label class="wf-label">Address</label>
    <input class="wf-input">
  </div>

</div>
```

### Notes

- The conditional fields are INDENTED + have a left border — visual
  signal "these belong to the toggle above".
- For a wireframe showing the COLLAPSED state, omit the conditional
  div entirely. For the EXPANDED state (shown above), include both.
- Authors annotate which state is being shown ("Expanded state
  shown" as a wireframe note).

---

## Save-and-continue-later anchor

For long wizards, let the user save progress and return later. A
small text link in the footer:

```html
<footer class="wf-card__actions">
  <a href="#screen-marketing" class="wf-text" data-wf-lines="1"
     style="font-size:12px;
            color:var(--vc-color-content-muted);">
    Save and continue later
  </a>
  <a class="wf-button" href="#screen-wizard-3">Continue →</a>
</footer>
```

Or, more explicitly, a confirmation modal showing what was saved:

```html
<div class="wf-modal">
  <h2 class="wf-text" data-wf-lines="1">Progress saved</h2>
  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);">
    We saved where you left off. Return any time from the link in
    your email.
  </p>
  <button class="wf-button">Got it</button>
</div>
```

This pattern is especially valuable for setups requiring data the
user doesn't have on hand (an API key, a payment method, a team
member's email).
