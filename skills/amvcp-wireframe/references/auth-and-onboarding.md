# Auth & onboarding screens — login, signup, recovery, welcome

## Table of Contents

- [Pattern 1 — Login (email + password)](#pattern-1--login-email--password)
- [Pattern 2 — Signup (account creation)](#pattern-2--signup-account-creation)
- [Pattern 3 — Forgot password (request reset link)](#pattern-3--forgot-password-request-reset-link)
- [Pattern 4 — Password reset (new password form)](#pattern-4--password-reset-new-password-form)
- [Pattern 5 — Email verification (check inbox)](#pattern-5--email-verification-check-inbox)
- [Pattern 6 — Welcome / first-run tour (carousel)](#pattern-6--welcome--first-run-tour-carousel)
- [SSO buttons (Google, GitHub, Apple)](#sso-buttons-google-github-apple)
- [Two-factor / OTP input](#two-factor--otp-input)
- [Magic-link signin pattern](#magic-link-signin-pattern)
- [The "you're logged in elsewhere" disambiguation](#the-youre-logged-in-elsewhere-disambiguation)

Auth + onboarding is the gateway flow into any product. Six
canonical screens: login, signup, forgot password, password reset,
email verification, welcome / first-run.

## Table of contents

- [Pattern 1 — Login (email + password)](#pattern-1--login-email--password)
- [Pattern 2 — Signup (account creation)](#pattern-2--signup-account-creation)
- [Pattern 3 — Forgot password (request reset link)](#pattern-3--forgot-password-request-reset-link)
- [Pattern 4 — Password reset (new password form)](#pattern-4--password-reset-new-password-form)
- [Pattern 5 — Email verification (check inbox)](#pattern-5--email-verification-check-inbox)
- [Pattern 6 — Welcome / first-run tour (carousel)](#pattern-6--welcome--first-run-tour-carousel)
- [SSO buttons (Google, GitHub, Apple)](#sso-buttons-google-github-apple)
- [Two-factor / OTP input](#two-factor--otp-input)
- [Magic-link signin pattern](#magic-link-signin-pattern)
- [The "you're logged in elsewhere" disambiguation](#the-youre-logged-in-elsewhere-disambiguation)

---

## Pattern 1 — Login (email + password)

The simplest auth screen. Email + password + forgot link + sign-up
link + log-in button.

```html
<section class="wf-screen" id="screen-login"
         data-ve-id="screen-login" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px; margin:48px auto;">

      <div style="text-align:center; margin-bottom:32px;">
        <figure class="wf-image" style="width:64px; height:64px;
                                          margin:0 auto;
                                          border-radius:12px;"></figure>
        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:24px; margin-top:16px;">Welcome back</h1>
        <p class="wf-text" data-wf-lines="1"
           style="color:var(--vc-color-content-subtle);">
          Log in to your account
        </p>
      </div>

      <article class="wf-card">

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email" placeholder="you@example.com">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password" placeholder="••••••••">

        <a href="#screen-forgot" class="wf-text" data-wf-lines="1"
           style="font-size:12px; text-align:right;
                  color:var(--vc-color-content-muted);">
          Forgot password?
        </a>

        <button class="wf-button" style="padding:14px; font-size:16px;">
          Log in
        </button>

      </article>

      <div style="display:flex; align-items:center; gap:8px; margin:24px 0;">
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">OR</span>
        <hr style="flex:1;" class="wf-divider">
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <button class="wf-button wf-button--ghost">
          Continue with Google
        </button>
        <button class="wf-button wf-button--ghost">
          Continue with GitHub
        </button>
        <button class="wf-button wf-button--ghost">
          Continue with Apple
        </button>
      </div>

      <p class="wf-text" data-wf-lines="1"
         style="text-align:center; margin-top:24px;">
        New here? <a href="#screen-signup">Create an account</a>
      </p>

    </main>

  </div>
</section>
```

### Notes

- Narrow column (400px) — auth forms don't need width.
- Brand logo + "Welcome back" + sub-headline above the form.
- Form card has 5 children: email label/input, password label/input,
  forgot link (right-aligned, small), Log in button.
- OR divider + 3 SSO buttons (see [SSO section
  below](#sso-buttons-google-github-apple)).
- Toggle link at the bottom to signup.

---

## Pattern 2 — Signup (account creation)

Slightly bigger than login — adds at least one more field (name
and/or display name) plus a ToS checkbox.

```html
<section class="wf-screen" id="screen-signup"
         data-ve-id="screen-signup" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px; margin:48px auto;">

      <div style="text-align:center; margin-bottom:32px;">
        <figure class="wf-image" style="width:64px; height:64px;
                                          margin:0 auto;
                                          border-radius:12px;"></figure>
        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:24px; margin-top:16px;">Create your account</h1>
        <p class="wf-text" data-wf-lines="1"
           style="color:var(--vc-color-content-subtle);">
          Get started in seconds
        </p>
      </div>

      <article class="wf-card">

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email" placeholder="you@example.com">

        <label class="wf-label">Password</label>
        <input class="wf-input" type="password" placeholder="••••••••">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          8+ characters, including a number and a symbol
        </span>

        <label class="wf-label">Display name</label>
        <input class="wf-input" placeholder="Anna Chen">

        <div style="display:flex; gap:8px; align-items:flex-start;
                    margin-top:8px;">
          <input type="checkbox" id="terms">
          <label for="terms" class="wf-text" data-wf-lines="2"
                 style="font-size:12px;">
            I agree to the <a href="#screen-terms">Terms of Service</a>
            and <a href="#screen-privacy">Privacy Policy</a>.
          </label>
        </div>

        <button class="wf-button" style="padding:14px; font-size:16px;">
          Sign up
        </button>

      </article>

      <p class="wf-text" data-wf-lines="1"
         style="text-align:center; margin-top:24px;">
        Have an account? <a href="#screen-login">Log in</a>
      </p>

    </main>

  </div>
</section>
```

### Notes

- Mirror of login — same chrome, same width, same SSO options (omit
  for brevity in the snippet above).
- ToS checkbox is REQUIRED — pre-check it only if your jurisdiction
  allows (most don't).
- Password helper text below the input.
- Toggle link at the bottom to login.

---

## Pattern 3 — Forgot password (request reset link)

A single field — email — and a "send reset link" button.

```html
<section class="wf-screen" id="screen-forgot"
         data-ve-id="screen-forgot" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px; margin:48px auto;">

      <div style="text-align:center; margin-bottom:32px;">
        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:24px;">Reset your password</h1>
        <p class="wf-text" data-wf-lines="2"
           style="color:var(--vc-color-content-subtle);">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <article class="wf-card">

        <label class="wf-label">Email</label>
        <input class="wf-input" type="email" placeholder="you@example.com">

        <button class="wf-button" style="padding:14px; font-size:16px;">
          Send reset link
        </button>

      </article>

      <p class="wf-text" data-wf-lines="1"
         style="text-align:center; margin-top:24px;">
        Remember now? <a href="#screen-login">Log in</a>
      </p>

    </main>

  </div>
</section>
```

### Notes

- Single field — the reset flow is the simplest.
- Sub-headline explains WHAT WILL HAPPEN ("we'll send you a reset
  link").
- Back-to-login link at the bottom.

After submission, the screen often shows a "check your inbox"
confirmation (see [Email verification pattern](#pattern-5--email-verification-check-inbox)).

---

## Pattern 4 — Password reset (new password form)

The screen the user lands on after clicking the reset link. Two
password fields (new + confirm) + a save button.

```html
<section class="wf-screen" id="screen-reset"
         data-ve-id="screen-reset" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px; margin:48px auto;">

      <div style="text-align:center; margin-bottom:32px;">
        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:24px;">Choose a new password</h1>
        <p class="wf-text" data-wf-lines="1"
           style="color:var(--vc-color-content-subtle);">
          For account: you@example.com
        </p>
      </div>

      <article class="wf-card">

        <label class="wf-label">New password</label>
        <input class="wf-input" type="password" placeholder="••••••••">
        <span class="wf-text" data-wf-lines="1"
              style="font-size:12px;
                     color:var(--vc-color-content-subtle);">
          8+ characters, including a number and a symbol
        </span>

        <label class="wf-label">Confirm new password</label>
        <input class="wf-input" type="password" placeholder="••••••••">

        <button class="wf-button" style="padding:14px; font-size:16px;">
          Save and log in
        </button>

      </article>

    </main>

  </div>
</section>
```

### Notes

- Display the email of the account being reset (avoid confusion if
  the user has multiple accounts).
- Two password fields — new + confirm. The form should validate
  they match (in production).
- Button text is "Save and log in" — the action does BOTH (set the
  password AND log the user in).

---

## Pattern 5 — Email verification (check inbox)

The "we sent you an email" screen. Used after signup, after
password reset request, after email change.

```html
<section class="wf-screen" id="screen-verify"
         data-ve-id="screen-verify" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:400px; margin:48px auto;
                                  text-align:center;">

      <figure class="wf-image" style="width:96px; height:96px;
                                        margin:0 auto;
                                        border-radius:50%;"></figure>

      <h1 class="wf-text" data-wf-lines="1"
          style="font-size:24px; margin-top:24px;">
        Check your inbox
      </h1>

      <p class="wf-text" data-wf-lines="2"
         style="color:var(--vc-color-content-muted);">
        We sent a verification link to <strong>you@example.com</strong>.
        Click the link to verify your account.
      </p>

      <p class="wf-text" data-wf-lines="1"
         style="font-size:12px;
                color:var(--vc-color-content-subtle);
                margin-top:32px;">
        Didn't receive it? <a href="#">Resend</a> · <a href="#">Use a different email</a>
      </p>

    </main>

  </div>
</section>
```

### Notes

- Image is a spot illustration (envelope, paper plane, etc.) — at
  wireframe it's just a circle placeholder.
- Headline + sub-headline explaining what happened.
- Two follow-up actions in small text: Resend + Use a different
  email.
- No button — the next action is in the email client, not on this
  screen.

---

## Pattern 6 — Welcome / first-run tour (carousel)

After successful signup, an onboarding carousel — 3-5 screens
introducing the product.

```html
<section class="wf-screen" id="screen-welcome-1"
         data-ve-id="screen-welcome-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <main class="wf-main" style="max-width:560px; margin:48px auto;
                                  min-height:500px;
                                  display:flex; flex-direction:column;
                                  justify-content:space-between;">

      <header style="text-align:right;">
        <a class="wf-text" data-wf-lines="1" href="#screen-app">Skip</a>
      </header>

      <div style="text-align:center;">

        <figure class="wf-image" style="min-height:240px;
                                          max-width:320px;
                                          margin:0 auto;"></figure>

        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:28px; margin-top:32px;">
          Welcome to the product
        </h1>

        <p class="wf-text" data-wf-lines="3"
           style="color:var(--vc-color-content-muted);
                  max-width:400px; margin:16px auto 0;"></p>

      </div>

      <footer style="display:flex; justify-content:space-between;
                     align-items:center;">

        <nav style="display:flex; gap:8px;">
          <span class="wf-avatar" style="width:8px; height:8px;
                                           background:var(--vc-color-content);"></span>
          <span class="wf-avatar" style="width:8px; height:8px;
                                           background:var(--vc-color-border);"></span>
          <span class="wf-avatar" style="width:8px; height:8px;
                                           background:var(--vc-color-border);"></span>
        </nav>

        <div style="display:flex; gap:8px;">
          <button class="wf-button wf-button--ghost">Back</button>
          <a class="wf-button" href="#screen-welcome-2">Next →</a>
        </div>

      </footer>

    </main>

  </div>
</section>
```

### Notes

- Tall column (`min-height: 500px`) with header / content / footer
  layout via `justify-content: space-between`.
- Skip link top-right — let the user escape the tour.
- Centered content: image + headline + body.
- Pagination dots at the bottom-left (the FIRST dot is the active
  one — content color; the rest are border color).
- Back + Next buttons at the bottom-right.
- Step 2, 3, etc. reuse the same layout — just swap the image,
  headline, body, and update the active dot.

---

## SSO buttons (Google, GitHub, Apple)

The "Continue with X" buttons. Convention is ONE button per provider,
each labeled with the provider name.

```html
<div style="display:flex; flex-direction:column; gap:8px;">
  <button class="wf-button wf-button--ghost"
          style="justify-content:flex-start; padding:12px 16px;">
    <span style="width:20px; height:20px;
                 background:#4285f4;
                 border-radius:4px; flex-shrink:0;"></span>
    <span style="margin-left:12px;">Continue with Google</span>
  </button>

  <button class="wf-button wf-button--ghost"
          style="justify-content:flex-start; padding:12px 16px;">
    <span style="width:20px; height:20px;
                 background:#1f1a14;
                 border-radius:4px; flex-shrink:0;"></span>
    <span style="margin-left:12px;">Continue with GitHub</span>
  </button>

  <button class="wf-button wf-button--ghost"
          style="justify-content:flex-start; padding:12px 16px;">
    <span style="width:20px; height:20px;
                 background:#1f1a14;
                 border-radius:4px; flex-shrink:0;"></span>
    <span style="margin-left:12px;">Continue with Apple</span>
  </button>
</div>
```

### Notes

- Left-aligned content (`justify-content: flex-start`) so the icon
  + label read left-to-right.
- Provider icons are small (20×20) colored squares — in production
  these are the brand SVGs. At wireframe they're solid color
  placeholders (the COLOR is the brand signal).
- Ghost variant — SSO buttons should NOT compete with the primary
  Log in button. Leave the primary visually dominant.

---

## Two-factor / OTP input

The "enter the 6-digit code" screen.

```html
<article class="wf-card" style="max-width:400px; margin:0 auto;">

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:20px; text-align:center;">
    Enter the 6-digit code
  </h2>
  <p class="wf-text" data-wf-lines="2"
     style="text-align:center;
            color:var(--vc-color-content-subtle);">
    We sent a code to your phone ending in •• 89.
  </p>

  <div style="display:flex; gap:8px; justify-content:center;
              margin:24px 0;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
    <input class="wf-input" maxlength="1"
           style="width:48px; height:56px;
                  text-align:center; font-size:24px;">
  </div>

  <button class="wf-button" style="width:100%;
                                    padding:14px;
                                    font-size:16px;">
    Verify
  </button>

  <p class="wf-text" data-wf-lines="1"
     style="text-align:center; font-size:12px;
            color:var(--vc-color-content-subtle);
            margin-top:16px;">
    Didn't get it? <a href="#">Resend code</a>
  </p>

</article>
```

### Notes

- 6 individual `<input maxlength="1">` boxes, each 48px wide.
- Big centered text (font-size: 24px) — codes should be readable
  from across the room.
- Verify button is full-width, primary.
- Resend link below for the "the code didn't arrive" case.

In production, JS auto-advances focus between boxes as the user
types. The wireframe shows the SHAPE, not the behavior.

---

## Magic-link signin pattern

A passwordless signin — the user enters their email, gets a magic
link.

```html
<article class="wf-card">

  <h1 class="wf-text" data-wf-lines="1"
      style="font-size:24px; text-align:center;">
    Sign in with magic link
  </h1>
  <p class="wf-text" data-wf-lines="2"
     style="text-align:center;
            color:var(--vc-color-content-muted);">
    We'll email you a secure link to sign in. No password required.
  </p>

  <label class="wf-label">Email</label>
  <input class="wf-input" type="email" placeholder="you@example.com">

  <button class="wf-button">Send magic link</button>

</article>
```

After submission, the user sees the [check-your-inbox screen](#pattern-5--email-verification-check-inbox)
with copy adjusted to "We sent a magic link to your email."

---

## The "you're logged in elsewhere" disambiguation

When a user opens the app from a different device, sometimes they're
already logged in elsewhere — show a disambiguation screen.

```html
<article class="wf-card">

  <h1 class="wf-text" data-wf-lines="1"
      style="font-size:20px;">
    You're already signed in
  </h1>
  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-muted);">
    We detected another active session. Choose what to do:
  </p>

  <div style="display:flex; flex-direction:column; gap:12px;
              margin-top:16px;">

    <a class="wf-card" href="#screen-app">
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="wf-avatar"></span>
        <div style="flex:1;">
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
            Continue as Anna
          </span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;
                       color:var(--vc-color-content-subtle);">
            anna@example.com
          </span>
        </div>
        <span>→</span>
      </div>
    </a>

    <a class="wf-card" href="#screen-login">
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="wf-avatar"
              style="background:var(--vc-color-border);"></span>
        <div style="flex:1;">
          <span class="wf-text" data-wf-lines="1" style="font-weight:600;">
            Sign in with a different account
          </span>
        </div>
        <span>→</span>
      </div>
    </a>

  </div>

</article>
```

### Notes

- Each option is a CLICKABLE CARD (`<a class="wf-card">`).
- First option: continue as the current user (shows avatar + name).
- Second option: sign in with a different account (shows a generic
  avatar placeholder).
- The right-arrow `→` is the conventional "this is clickable" hint.
