# Clickable prototype — making a wireframe behave like an app

A wireframe BECOMES a clickable prototype when its screens link to
each other and each screen MIMICS the real interactive behavior of
the final app. No JS framework, no signed builds — just `<a href>`,
`:target`, and clever `wf-screen` structure.

## Table of contents

- [The clickable contract — what makes it "feel real"](#the-clickable-contract--what-makes-it-feel-real)
- [Pattern 1 — Hub-and-spoke (one home, many sub-flows)](#pattern-1--hub-and-spoke-one-home-many-sub-flows)
- [Pattern 2 — Linear flow (cart → payment → confirm)](#pattern-2--linear-flow-cart--payment--confirm)
- [Pattern 3 — Branching flow (a yes/no decision splits paths)](#pattern-3--branching-flow-a-yesno-decision-splits-paths)
- [Pattern 4 — Modal-over-screen (overlay pattern)](#pattern-4--modal-over-screen-overlay-pattern)
- [Pattern 5 — Multi-step wizard with back-stop](#pattern-5--multi-step-wizard-with-back-stop)
- [Pattern 6 — Stateful mocks (toggle, expand, filter)](#pattern-6--stateful-mocks-toggle-expand-filter)
- [The "happy path + 1 error" rule](#the-happy-path--1-error-rule)
- [Annotated callouts — show design rationale](#annotated-callouts--show-design-rationale)
- [Open-questions panel — collect feedback inline](#open-questions-panel--collect-feedback-inline)
- [Screen inventory — name every screen up front](#screen-inventory--name-every-screen-up-front)

---

## The clickable contract — what makes it "feel real"

Five rules — follow all of them and a wireframe becomes a tool a
stakeholder can USE, not just look at:

1. **Every clickable element navigates.** Every button is an `<a>`
   with `href="#screen-…"`. A reviewer expects to be able to click
   anything.
2. **No "lorem ipsum" — every label is realistic.** Use real-
   looking text that matches the app's domain ("$49.00" not
   "$xx.xx"; "May 16, 2026" not "DD/MM/YYYY").
3. **Every screen ENDS with an action.** Each screen has at least
   one Continue / Cancel / Done / Back link visible — the reviewer
   never gets stuck.
4. **Failure paths exist.** At least one "what if this fails" path
   per flow (error screen, retry banner, validation error). A
   wireframe that ONLY shows the happy path lies about the design.
5. **Annotate design decisions.** Add inline "design notes" panels
   (small text boxes) explaining non-obvious choices — the reviewer
   sees the WHY, not just the WHAT.

These rules turn a static set of screens into a self-documenting
prototype.

---

## Pattern 1 — Hub-and-spoke (one home, many sub-flows)

A dashboard / home screen with multiple cards, each linking to a
different sub-flow. The user returns to the hub between flows.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <!-- the hub -->
  <section class="wf-screen" id="screen-home"
           data-ve-id="screen-home" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1 class="wf-text" data-wf-lines="1">Dashboard</h1>

        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px;">

          <a class="wf-card" href="#screen-billing">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Billing →</span>
            </header>
            <p class="wf-text" data-wf-lines="2"></p>
          </a>

          <a class="wf-card" href="#screen-team">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Team →</span>
            </header>
            <p class="wf-text" data-wf-lines="2"></p>
          </a>

          <a class="wf-card" href="#screen-settings">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Settings →</span>
            </header>
            <p class="wf-text" data-wf-lines="2"></p>
          </a>

        </div>
      </main>
    </div>
  </section>

  <!-- billing sub-flow -->
  <section class="wf-screen" id="screen-billing"
           data-ve-id="screen-billing" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-home" class="wf-text" data-wf-lines="1">← Back to dashboard</a>
        <h1 class="wf-text" data-wf-lines="1">Billing</h1>
        <!-- billing content -->
      </main>
    </div>
  </section>

  <!-- team sub-flow -->
  <section class="wf-screen" id="screen-team"
           data-ve-id="screen-team" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-home" class="wf-text" data-wf-lines="1">← Back to dashboard</a>
        <h1 class="wf-text" data-wf-lines="1">Team</h1>
        <!-- team content -->
      </main>
    </div>
  </section>

  <!-- settings sub-flow -->
  <section class="wf-screen" id="screen-settings"
           data-ve-id="screen-settings" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-home" class="wf-text" data-wf-lines="1">← Back to dashboard</a>
        <h1 class="wf-text" data-wf-lines="1">Settings</h1>
        <!-- settings content -->
      </main>
    </div>
  </section>

</div>
```

### Notes

- Paged nav (`data-wf-nav="paged"`) — only one screen visible at
  a time.
- Every sub-screen has a "← Back to dashboard" link at the top.
- The hub uses cards as the navigation grid.

---

## Pattern 2 — Linear flow (cart → payment → confirm)

A sequential flow — each screen leads to the next, no branching.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <section class="wf-screen" id="screen-cart"
           data-ve-id="screen-cart" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1 class="wf-text" data-wf-lines="1">Cart (3 items)</h1>
        <!-- cart contents -->
        <footer style="display:flex; justify-content:flex-end;">
          <a class="wf-button" href="#screen-payment">Continue to payment →</a>
        </footer>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-payment"
           data-ve-id="screen-payment" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-cart" class="wf-text" data-wf-lines="1">← Back</a>
        <h1 class="wf-text" data-wf-lines="1">Payment</h1>
        <!-- payment form -->
        <footer style="display:flex; justify-content:flex-end;">
          <a class="wf-button" href="#screen-confirm">Place order →</a>
        </footer>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-confirm"
           data-ve-id="screen-confirm" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1 class="wf-text" data-wf-lines="1">Order confirmed</h1>
        <p class="wf-text" data-wf-lines="2"></p>
        <a class="wf-button" href="#screen-cart">Back to shop</a>
      </main>
    </div>
  </section>

</div>
```

### Notes

- Each screen has a "← Back" link (except the first and last).
- Each screen has a "Continue →" / "Place order" / similar primary
  CTA pointing to the next screen.
- The final screen has a "back to start" CTA — closes the loop.

---

## Pattern 3 — Branching flow (a yes/no decision splits paths)

A decision point — the user chooses, and the flow branches.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <section class="wf-screen" id="screen-question"
           data-ve-id="screen-question" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1 class="wf-text" data-wf-lines="1">Do you have an account?</h1>
        <div style="display:flex; gap:16px;">
          <a class="wf-card" href="#screen-login"
             style="flex:1; text-align:center; padding:32px;">
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">Yes, log in</span>
            <p class="wf-text" data-wf-lines="1"></p>
          </a>
          <a class="wf-card" href="#screen-signup"
             style="flex:1; text-align:center; padding:32px;">
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">No, sign up</span>
            <p class="wf-text" data-wf-lines="1"></p>
          </a>
        </div>
      </main>
    </div>
  </section>

  <!-- Path A: login -->
  <section class="wf-screen" id="screen-login"
           data-ve-id="screen-login" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-question">← Back</a>
        <h1>Log in</h1>
        <!-- login form -->
        <button class="wf-button" onclick="location.hash='#screen-success-login'">Log in</button>
      </main>
    </div>
  </section>

  <!-- Path B: signup -->
  <section class="wf-screen" id="screen-signup"
           data-ve-id="screen-signup" data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <a href="#screen-question">← Back</a>
        <h1>Sign up</h1>
        <!-- signup form -->
        <button class="wf-button" onclick="location.hash='#screen-success-signup'">Sign up</button>
      </main>
    </div>
  </section>

  <!-- Both paths converge here -->
  <section class="wf-screen" id="screen-success-login"
           data-ve-id="screen-success-login"
           data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1>Welcome back!</h1>
        <p>(from login path)</p>
        <a class="wf-button" href="#screen-app">Go to app →</a>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-success-signup"
           data-ve-id="screen-success-signup"
           data-ve-type="wireframe-screen">
    <div class="wf-archetype--web">
      <main class="wf-main">
        <h1>Welcome!</h1>
        <p>(from signup path — start onboarding)</p>
        <a class="wf-button" href="#screen-onboarding-1">Get started →</a>
      </main>
    </div>
  </section>

</div>
```

### Notes

- The decision screen shows TWO cards, each linking to a different
  flow.
- Each branch ends at a different success screen (login → app;
  signup → onboarding).
- The two branches may CONVERGE later (both eventually land in the
  main app).

---

## Pattern 4 — Modal-over-screen (overlay pattern)

A modal IS a screen — the user navigates to it (the modal screen
shows the underlying screen dimmed plus the modal on top), and
back-navigation closes the modal.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <section class="wf-screen" id="screen-inbox"
           data-ve-id="screen-inbox" data-ve-type="wireframe-screen">
    <div class="wf-archetype--app">
      <main class="wf-main">
        <h1>Inbox</h1>

        <article class="wf-card">
          <span class="wf-text" data-wf-lines="1">Important message</span>
          <button>
            <a href="#screen-confirm-delete" class="wf-button">Delete</a>
          </button>
        </article>

      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-confirm-delete"
           data-ve-id="screen-confirm-delete"
           data-ve-type="wireframe-screen">

    <!-- the inbox content shown DIMMED behind the modal -->
    <div class="wf-archetype--app"
         style="filter:brightness(0.5); pointer-events:none;">
      <main class="wf-main">
        <h1>Inbox</h1>
        <article class="wf-card">
          <span>Important message</span>
        </article>
      </main>
    </div>

    <!-- the modal on top -->
    <div class="wf-overlay">
      <div class="wf-modal">
        <h2 class="wf-text" data-wf-lines="1">Delete this message?</h2>
        <p class="wf-text" data-wf-lines="2"></p>
        <footer class="wf-modal__actions">
          <a class="wf-button wf-button--ghost" href="#screen-inbox">Cancel</a>
          <a class="wf-button" href="#screen-deleted"
             style="background:var(--vc-color-danger);
                    color:var(--vc-color-on-accent);">Delete</a>
        </footer>
      </div>
    </div>

  </section>

  <section class="wf-screen" id="screen-deleted"
           data-ve-id="screen-deleted"
           data-ve-type="wireframe-screen">
    <div class="wf-archetype--app">
      <main class="wf-main">
        <h1>Inbox</h1>
        <div class="wf-toast"
             style="background:var(--vc-color-success);
                    color:var(--vc-color-on-accent);">
          Message deleted. <a href="#screen-inbox" style="color:inherit;">Undo</a>
        </div>
        <!-- inbox WITHOUT the deleted message -->
      </main>
    </div>
  </section>

</div>
```

### Notes

- The modal screen DUPLICATES the underlying screen markup but
  dims it via `filter: brightness(0.5)` + `pointer-events: none`.
- Cancel links back to the original screen.
- Delete links to the AFTER-state (deleted message gone, success
  toast visible).

For wireframes with many modals, this duplication gets verbose.
Two alternatives:

1. **Scrolling nav** (`data-wf-nav="scroll"`) — render the modal
   AFTER the underlying screen in document flow, with a dashed
   separator. Less realistic but less verbose.
2. **Annotation-only** — render the modal screen WITHOUT the dimmed
   background, with a small note "(this modal opens over the inbox
   screen)".

---

## Pattern 5 — Multi-step wizard with back-stop

A wizard where the user can go back to previous steps to edit. Each
step is a screen.

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <section class="wf-screen" id="screen-wizard-1">
    <div class="wf-archetype--web">
      <main class="wf-main" style="max-width:560px; margin:0 auto;">
        <nav><!-- step indicator: 1 active --></nav>
        <article class="wf-card">
          <h2>Step 1: Account</h2>
          <!-- form -->
          <footer class="wf-card__actions">
            <a href="#screen-cancel" class="wf-button wf-button--ghost">Cancel</a>
            <a href="#screen-wizard-2" class="wf-button">Continue →</a>
          </footer>
        </article>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-wizard-2">
    <div class="wf-archetype--web">
      <main class="wf-main" style="max-width:560px; margin:0 auto;">
        <nav><!-- step indicator: 1 done, 2 active --></nav>
        <article class="wf-card">
          <h2>Step 2: Profile</h2>
          <!-- form -->
          <footer class="wf-card__actions">
            <a href="#screen-wizard-1" class="wf-button wf-button--ghost">← Back</a>
            <a href="#screen-wizard-3" class="wf-button">Continue →</a>
          </footer>
        </article>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-wizard-3">
    <div class="wf-archetype--web">
      <main class="wf-main" style="max-width:560px; margin:0 auto;">
        <nav><!-- step indicator: 1, 2 done, 3 active --></nav>
        <article class="wf-card">
          <h2>Step 3: Review and submit</h2>

          <!-- summary of choices from steps 1 + 2 -->
          <div style="display:flex; justify-content:space-between;">
            <span><strong>Email</strong>: you@example.com</span>
            <a href="#screen-wizard-1">Edit</a>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span><strong>Display name</strong>: Anna Chen</span>
            <a href="#screen-wizard-2">Edit</a>
          </div>

          <footer class="wf-card__actions">
            <a href="#screen-wizard-2" class="wf-button wf-button--ghost">← Back</a>
            <a href="#screen-wizard-done" class="wf-button">Submit</a>
          </footer>
        </article>
      </main>
    </div>
  </section>

  <section class="wf-screen" id="screen-wizard-done">
    <div class="wf-archetype--web">
      <main class="wf-main" style="max-width:560px; margin:0 auto; text-align:center;">
        <span style="font-size:48px; color:var(--vc-color-success);">✓</span>
        <h1>You're all set</h1>
        <a class="wf-button" href="#screen-app">Go to app →</a>
      </main>
    </div>
  </section>

</div>
```

### Notes

- Each step has Back + Continue links. Step 1 has Cancel (not
  Back) — there's no step 0.
- The REVIEW step (3 of 3) summarizes choices from earlier steps
  with inline "Edit" links that jump back.
- The success screen is the terminal — no Back link from there.

---

## Pattern 6 — Stateful mocks (toggle, expand, filter)

A wireframe usually shows ONE state of a control. To mock a TOGGLE,
ACCORDION, FILTER state, create two screens:

```html
<!-- "filter open" state -->
<section class="wf-screen" id="screen-list-filtered">
  <div class="wf-archetype--app">
    <main class="wf-main">

      <header style="display:flex; gap:12px;">
        <h1>Items</h1>
        <a class="wf-button" href="#screen-list-all">×  Active filter: Status=Active</a>
      </header>

      <article class="wf-card">
        <!-- list with ONLY active items -->
      </article>

    </main>
  </div>
</section>

<!-- "filter cleared" state -->
<section class="wf-screen" id="screen-list-all">
  <div class="wf-archetype--app">
    <main class="wf-main">

      <header>
        <h1>Items</h1>
        <a class="wf-button wf-button--ghost" href="#screen-list-filtered">Filter</a>
      </header>

      <article class="wf-card">
        <!-- full list — all statuses -->
      </article>

    </main>
  </div>
</section>
```

The filter chip in the filtered state acts as both an indicator
AND the link to remove the filter (clicking it navigates to the
unfiltered screen).

For COMPLEX state (sortable table sorted ASC vs DESC), each
combination becomes its own screen. This gets verbose for wide
state spaces — limit to the 3-4 MOST IMPORTANT states.

---

## The "happy path + 1 error" rule

For every flow, include at least ONE error path. The minimum
error-path coverage:

| Flow | Happy path | Error path |
|---|---|---|
| Sign up | Account created → onboarding | Email taken → "Already have an account? Log in" |
| Checkout | Payment succeeds → confirm | Payment fails → "Try a different card" |
| Upload | File uploads → preview | File too big → "Max 10MB; this is 25MB" |
| Form save | Save succeeds → toast | Validation fails → red-bordered fields + error toast |
| Search | Results found → list | No results → empty state with "Try clearing filters" |

The error path is a SEPARATE screen with the validation error
visible. Link to it from the appropriate trigger ("Submit" button
when the email is invalid, etc.).

---

## Annotated callouts — show design rationale

Add inline "design notes" panels — small text boxes explaining
non-obvious choices. The reviewer learns the WHY without asking.

```html
<aside style="background:var(--vc-color-surface-sunken);
              border-left:3px solid var(--vc-color-info);
              padding:12px 16px;
              margin:16px 0;
              font-size:12px;
              color:var(--vc-color-content-muted);">
  <strong style="color:var(--vc-color-info);">DESIGN NOTE</strong>
  <p>The Save button is on the LEFT here (not right) because the
     user just edited text in the field to the right; left-side
     Save reduces mouse travel.</p>
</aside>
```

### Notes

- Yellow / amber / blue tinted (semantic color is fine — they
  desaturate at wireframe-fi to a clear grey background).
- 3px left border indicates "this is a callout, not main content".
- Small font (12px) — doesn't compete with the main UI.

For ALTERNATIVE-DESIGN notes:

```html
<aside style="background:var(--vc-color-surface-sunken);
              border-left:3px solid var(--vc-color-warning);
              padding:12px 16px; margin:16px 0;
              font-size:12px;">
  <strong style="color:var(--vc-color-warning);">ALTERNATE</strong>
  <p>Considered putting the Filter chip in the sidebar instead.
     Decided against it because users often switch filters
     mid-task; sidebar would require a click + a scroll.</p>
</aside>
```

---

## Open-questions panel — collect feedback inline

A panel at the BOTTOM of each screen with numbered open questions
for the reviewer.

```html
<aside style="background:var(--vc-color-surface-sunken);
              border:1px solid var(--vc-color-border);
              border-radius:8px;
              padding:16px;
              margin-top:48px;">

  <h3 style="font-size:14px;
             text-transform:uppercase;
             letter-spacing:0.05em;
             color:var(--vc-color-content-muted);">
    OPEN QUESTIONS FOR REVIEW
  </h3>

  <ol style="display:flex; flex-direction:column; gap:8px;
             margin-top:8px;
             padding-left:20px;">
    <li class="wf-text" data-wf-lines="1">
      Should the primary CTA say "Continue" or "Save"?
    </li>
    <li class="wf-text" data-wf-lines="1">
      Is the 3-step indicator necessary, or should we drop it for
      visual simplicity?
    </li>
    <li class="wf-text" data-wf-lines="1">
      What happens if the user has 0 saved cards — do we show the
      "Add new card" form inline or as a modal?
    </li>
  </ol>

</aside>
```

### Notes

- Borderless box with sunken background.
- Header is small + uppercase + tracked.
- Numbered list of specific design questions.
- Place AFTER the screen content, BEFORE the screen separator.

Reviewer leaves answers as comments on the wireframe (via the
runtime's modal-comment thread), tying answers to specific
questions.

---

## Screen inventory — name every screen up front

For prototypes with 10+ screens, start the document with a
SCREEN INVENTORY — a table-of-contents-style list of every screen,
its purpose, and its IDs.

```html
<section style="padding:24px;
                background:var(--vc-color-surface-sunken);
                border-radius:8px;
                margin-bottom:48px;">

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:20px;">Screen inventory (12 screens)</h2>

  <ol style="display:flex; flex-direction:column; gap:4px;
             margin-top:16px;
             padding-left:20px;">
    <li><a href="#screen-home">home</a> — dashboard hub</li>
    <li><a href="#screen-billing">billing</a> — current plan + invoices</li>
    <li><a href="#screen-billing-change-plan">billing-change-plan</a> — pricing table picker</li>
    <li><a href="#screen-billing-payment">billing-payment</a> — payment method form</li>
    <li><a href="#screen-billing-confirm">billing-confirm</a> — confirm-and-charge modal</li>
    <li><a href="#screen-team">team</a> — team member list</li>
    <li><a href="#screen-team-invite">team-invite</a> — invite-by-email modal</li>
    <li><a href="#screen-team-detail">team-detail</a> — single member detail</li>
    <li><a href="#screen-team-remove-confirm">team-remove-confirm</a> — destructive confirm</li>
    <li><a href="#screen-settings">settings</a> — preferences hub</li>
    <li><a href="#screen-error-403">error-403</a> — forbidden</li>
    <li><a href="#screen-error-500">error-500</a> — server error</li>
  </ol>

  <p class="wf-text" data-wf-lines="1"
     style="font-size:12px;
            color:var(--vc-color-content-subtle);
            margin-top:16px;">
    Each screen is fully clickable. Use the back-link in each
    screen to navigate.
  </p>

</section>
```

### Notes

- Numbered list of every screen.
- Each entry has the screen ID (linked) + a one-line description.
- Footer note explains the navigation contract.

The reviewer can JUMP to any screen via the inventory — useful for
large prototypes where linear scrolling would be tedious.
