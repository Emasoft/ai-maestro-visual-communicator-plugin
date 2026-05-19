# Wireframe from a written spec — translation patterns

Turn a written spec ("we need a checkout flow with cart, payment,
and confirmation") into a wireframe in 10-20 minutes. This file
covers the translation workflow, the placeholder strategy, and the
sanity checks.

## Table of contents

- [The translation workflow (5 steps)](#the-translation-workflow-5-steps)
- [Step 1 — Identify screens](#step-1--identify-screens)
- [Step 2 — Map screens to archetypes](#step-2--map-screens-to-archetypes)
- [Step 3 — Pick blocks per screen](#step-3--pick-blocks-per-screen)
- [Step 4 — Wire navigation](#step-4--wire-navigation)
- [Step 5 — Add states (loading / error / empty)](#step-5--add-states-loading--error--empty)
- [Translating common spec phrases](#translating-common-spec-phrases)
- [The "minimum viable wireframe" budget](#the-minimum-viable-wireframe-budget)
- [Sample translation walkthrough](#sample-translation-walkthrough)
- [What to clarify with the spec author](#what-to-clarify-with-the-spec-author)

---

## The translation workflow (5 steps)

1. **Identify screens.** What screens does the spec mention or
   imply? List them.
2. **Map screens to archetypes.** Each screen is a web page, a
   mobile screen, an app screen, or a modal.
3. **Pick blocks per screen.** Which kit blocks does each screen
   need?
4. **Wire navigation.** What goes from where to where?
5. **Add states.** What loading / error / empty paths exist?

A good wireframe takes 10-20 minutes for a 5-screen flow. Don't
over-engineer.

---

## Step 1 — Identify screens

Read the spec. Underline every UI surface the spec mentions or
implies.

> Spec: "Users should be able to add items to a cart, enter their
> shipping and payment info, and see a confirmation."

Implied screens:
1. **Product list** (where they ADD to cart)
2. **Product detail** (the click target before adding)
3. **Cart** (where they review items)
4. **Address form**
5. **Payment form**
6. **Order confirmation**

Plus implicit "what if it fails":
7. **Payment failure**

7 screens. List them.

---

## Step 2 — Map screens to archetypes

For each screen, pick an archetype:

| Screen | Archetype |
|---|---|
| Product list | `wf-archetype--web` (responsive page) |
| Product detail | `wf-archetype--web` (responsive page) |
| Cart | `wf-archetype--web` (responsive page) |
| Address form | `wf-archetype--web` (responsive page) |
| Payment form | `wf-archetype--web` (responsive page) |
| Order confirmation | `wf-archetype--web` (responsive page) |
| Payment failure | `wf-archetype--web` (modal-style) |

For an APP version (logged-in user, persistent nav):

| Screen | Archetype |
|---|---|
| All shopping screens | `wf-archetype--app` (titlebar + sidebar + main) |

The wireframe's TARGET context (web vs app) determines the
archetype.

---

## Step 3 — Pick blocks per screen

For each screen, list which kit blocks it needs:

### Product list

- `wf-header` — brand + nav + cart link
- `wf-main` — grid of `wf-card`s, each a product

### Product detail

- `wf-header`
- `wf-main` — `wf-image` (gallery) + `wf-text` (title + price +
  description) + `wf-button` (Add to cart)

### Cart

- `wf-header`
- `wf-main` — list of `wf-card`s (line items) + summary card +
  Checkout button

### Address form

- `wf-header`
- `wf-main` — form with `wf-input`s + Continue button

### Payment form

- Same shape as address form.

### Confirmation

- `wf-header`
- `wf-main` — success chip + `wf-card` with order details + Continue
  shopping link

### Payment failure

- `wf-overlay` + `wf-modal` (over the payment form) — error message
  + Try again button

This is the rough skeleton. Now write the HTML.

---

## Step 4 — Wire navigation

For each pair of related screens, write the anchor:

| From | To | Trigger |
|---|---|---|
| Product list | Product detail | Click on product card |
| Product detail | Cart | "Add to cart" button |
| Cart | Address form | "Continue to checkout" button |
| Address form | Payment form | "Continue to payment" button |
| Payment form | Confirmation | "Place order" button (success path) |
| Payment form | Payment failure | "Place order" button (failure path) |
| Payment failure | Payment form | "Try again" button |
| Confirmation | Product list | "Continue shopping" button |

Every screen should have AT LEAST ONE outbound link. Dead-end
screens (no way out) are bugs.

For the wireframe markup:

```html
<a class="wf-button" href="#screen-payment">Continue to payment</a>
```

---

## Step 5 — Add states (loading / error / empty)

For each major screen, ask: "what if the data isn't here yet, or
isn't here at all, or something failed?"

### Product list

- Loading: skeleton grid (see [`state-and-feedback-patterns.md`](state-and-feedback-patterns.md))
- Empty: "No products yet" with "Browse all" CTA
- Error: "Couldn't load products" with Retry

### Cart

- Empty: "Your cart is empty" with "Browse products" CTA
- Error: "Couldn't load cart" with Retry

### Payment form

- Validation error: red borders on bad fields + error toast
- Success: → confirmation
- Failure: → payment-failure modal

Cover the MOST IMPORTANT 2-3 states per screen. Don't try to
cover every edge case.

---

## Translating common spec phrases

A cheat sheet for converting spec language to wireframe blocks:

| Spec says | Wireframe uses |
|---|---|
| "Show a list of X" | `wf-table` or grid of `wf-card`s |
| "Display detail page" | `wf-archetype--web` + hero image + heading + body |
| "Allow user to enter X" | `wf-label` + `wf-input` |
| "Submit / send / save" | `wf-button` (primary) |
| "Cancel / back" | `wf-button --ghost` |
| "Confirm / are you sure" | `wf-overlay` + `wf-modal` |
| "Side menu / settings panel" | `wf-archetype--app` with `wf-sidebar` |
| "Mobile screen" | `wf-archetype--mobile` |
| "Pop-up / dialog / modal" | `wf-modal` inside `wf-overlay` |
| "Notification / toast" | `wf-toast` |
| "Status indicator" | `wf-chip` (semantic-colored) |
| "Loading state" | skeleton or spinner |
| "Empty state" | centered figure + heading + sub + CTA |
| "Error state" | error banner OR full error page |
| "Search results" | `wf-input` type="search" + result `wf-card`s |
| "Filter sidebar" | `wf-sidebar` with checkboxes + chips |
| "Tabbed view" | `wf-nav` with tabs + content area |
| "Wizard / multi-step" | step indicator + per-step `wf-card`s |
| "User profile" | avatar (large) + name + stats + tabbed sections |
| "Comment / reply" | nested cards with avatars + textareas |
| "Drag-to-reorder list" | rows with `⋮⋮` handles |
| "Date picker" | `wf-input` type="date" |
| "Choice picker (multiple)" | row of `wf-button`s with one primary |
| "Toggle on/off" | row with label + chip showing On/Off |

---

## The "minimum viable wireframe" budget

For a 5-7 screen flow, aim for:

| Resource | Budget |
|---|---|
| Time to author | 15-30 minutes |
| Lines of HTML | 300-600 |
| Screens | 5-10 |
| Atoms per screen | 5-15 |
| Total atoms | 30-100 |

If you blow the budget, you're either:

1. **Over-engineering** — adding states / variations the spec
   didn't ask for.
2. **Under-clarifying** — the spec is ambiguous and you're filling
   gaps by speculation.

Fix by either trimming back (over-engineered) or asking the spec
author (under-clarified).

---

## Sample translation walkthrough

> Spec: "An admin should be able to invite a new team member by
> email, choose their role, and optionally write a personal
> message. The new member receives an email with a join link."

### Step 1: Identify screens

- Admin clicks "Invite" → opens INVITE MODAL
- Admin submits → SENT CONFIRMATION (toast or screen)
- (The new member's email is OUTSIDE the wireframe scope)

2-3 screens.

### Step 2: Map screens to archetypes

| Screen | Archetype |
|---|---|
| Admin team page (where Invite button lives) | `wf-archetype--app` |
| Invite modal | `wf-modal` inside `wf-overlay` |
| Sent confirmation | toast (no separate screen) |

### Step 3: Pick blocks per screen

**Admin team page**:
- `wf-titlebar`, `wf-sidebar` (settings nav), `wf-main`
- `h1` "Team", "Invite" button
- `wf-table` listing existing members

**Invite modal**:
- `wf-overlay` + `wf-modal`
- Form: email input, role select, message textarea
- Footer: Cancel + Send invite buttons

### Step 4: Wire navigation

| From | To |
|---|---|
| Team page → Invite modal | "Invite" button anchor |
| Invite modal Cancel → Team page | back link |
| Invite modal Send → Team page + toast | submit anchor |

### Step 5: States

- Loading: spinner inside the Send button while submitting
- Error: "Could not send invite" toast
- Success: "Invite sent to [email]" toast

### Final wireframe markup

```html
<div class="wf-root" data-wf-root data-wf-fidelity="wireframe"
     data-wf-nav="paged">

  <!-- 1. team page (idle state) -->
  <section class="wf-screen" id="screen-team"
           data-ve-id="screen-team" data-ve-type="wireframe-screen">
    <div class="wf-archetype--app">
      <header class="wf-titlebar">…</header>
      <aside class="wf-sidebar">…</aside>
      <main class="wf-main">

        <header style="display:flex; gap:12px;">
          <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Team</h1>
          <a class="wf-button" href="#screen-invite">Invite teammate</a>
        </header>

        <article class="wf-card" style="padding:0;">
          <div class="wf-table">
            <div class="wf-table-row wf-table-row--head">
              <span class="wf-text" data-wf-lines="1">Name</span>
              <span class="wf-text" data-wf-lines="1">Email</span>
              <span class="wf-text" data-wf-lines="1">Role</span>
            </div>
            <div class="wf-table-row">
              <span class="wf-text" data-wf-lines="1"
                    style="font-weight:600;">Anna Chen</span>
              <span class="wf-text" data-wf-lines="1">anna@example.com</span>
              <span class="wf-text" data-wf-lines="1">Admin</span>
            </div>
            <div class="wf-table-row">…</div>
          </div>
        </article>

      </main>
    </div>
  </section>

  <!-- 2. team page with invite modal open -->
  <section class="wf-screen" id="screen-invite"
           data-ve-id="screen-invite" data-ve-type="wireframe-screen">

    <!-- underlying team page (dimmed) -->
    <div class="wf-archetype--app" style="filter:brightness(0.55);
                                            pointer-events:none;">
      <header class="wf-titlebar">…</header>
      <aside class="wf-sidebar">…</aside>
      <main class="wf-main">…</main>
    </div>

    <!-- modal -->
    <div class="wf-overlay">
      <div class="wf-modal">

        <header style="display:flex; justify-content:space-between;">
          <h2 class="wf-text" data-wf-lines="1">Invite teammate</h2>
          <a href="#screen-team">×</a>
        </header>

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email"
               placeholder="teammate@example.com">

        <label class="wf-label">Role</label>
        <select class="wf-input">
          <option>Member</option>
          <option>Admin</option>
          <option>Viewer</option>
        </select>

        <label class="wf-label">Personal message (optional)</label>
        <textarea class="wf-input" style="min-height:80px;"></textarea>

        <footer class="wf-modal__actions">
          <a class="wf-button wf-button--ghost" href="#screen-team">Cancel</a>
          <a class="wf-button" href="#screen-team-sent">Send invite</a>
        </footer>

      </div>
    </div>

  </section>

  <!-- 3. team page with success toast -->
  <section class="wf-screen" id="screen-team-sent"
           data-ve-id="screen-team-sent" data-ve-type="wireframe-screen">
    <div class="wf-archetype--app">
      <header class="wf-titlebar">…</header>
      <aside class="wf-sidebar">…</aside>
      <main class="wf-main">

        <div class="wf-toast"
             style="background:var(--vc-color-success);
                    color:var(--vc-color-on-accent);">
          ✓ Invite sent to teammate@example.com
        </div>

        <header style="display:flex; gap:12px;">
          <h1 class="wf-text" data-wf-lines="1" style="flex:1;">Team</h1>
          <a class="wf-button" href="#screen-invite">Invite teammate</a>
        </header>

        <article class="wf-card" style="padding:0;">
          <div class="wf-table">
            <div class="wf-table-row wf-table-row--head">
              <span class="wf-text" data-wf-lines="1">Name</span>
              <span class="wf-text" data-wf-lines="1">Email</span>
              <span class="wf-text" data-wf-lines="1">Role</span>
            </div>
            <div class="wf-table-row">…existing rows…</div>
            <!-- the new invite as a pending row -->
            <div class="wf-table-row">
              <span class="wf-text" data-wf-lines="1"
                    style="color:var(--vc-color-content-subtle);">
                (pending)
              </span>
              <span class="wf-text" data-wf-lines="1"
                    style="color:var(--vc-color-content-subtle);">
                teammate@example.com
              </span>
              <span class="wf-chip">Member · Invited</span>
            </div>
          </div>
        </article>

      </main>
    </div>
  </section>

</div>
```

~150 lines of HTML, 3 screens, full happy path. ~10 minutes of
authoring time. The wireframe communicates the WHOLE feature.

---

## What to clarify with the spec author

Common gaps in written specs — ask before authoring:

### 1. What happens on the "default" case?

"Should the invite list show ALL members or just ACTIVE ones?"

### 2. What's the success state?

"After clicking Send, what does the user see? A toast? A
confirmation modal? A whole-page success screen?"

### 3. What's the failure case?

"What happens if the email is already invited? Or if the inviter
has hit the team-size limit?"

### 4. What's the empty case?

"For an empty team list, show 'No members yet'? Or just an
empty table?"

### 5. What's the permission boundary?

"Can a Member invite, or only Admins? What does a Member see when
they try?"

### 6. What's the mobile experience?

"Should the invite modal work on mobile? Or is this admin-only on
desktop?"

### 7. What's the email content?

"Is the email template part of this spec? Or just the in-app UI?"

Ask 2-5 of these upfront. The answers TRANSLATE DIRECTLY to
specific wireframe states you need to author.

If the spec author can't answer, that's a SIGNAL that the design
needs more thinking before wireframes. Either back-and-forth a few
times to converge, or ship the wireframe with explicit OPEN
QUESTIONS at the bottom (see
[`rationale-and-design-notes.md`](rationale-and-design-notes.md)).
