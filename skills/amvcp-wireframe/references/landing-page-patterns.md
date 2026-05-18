# Landing page patterns — marketing site wireframes

## Table of Contents

- [Hero (image + headline + CTA)](#hero-image--headline--cta)
- [Feature trio (3 cards in a row)](#feature-trio-3-cards-in-a-row)
- [Feature-with-image (alternating left-right rows)](#feature-with-image-alternating-left-right-rows)
- [Social proof (logo grid)](#social-proof-logo-grid)
- [Testimonial card (quote + avatar + attribution)](#testimonial-card-quote--avatar--attribution)
- [Pricing table (3 tiers, comparison rows)](#pricing-table-3-tiers-comparison-rows)
- [FAQ accordion (collapsed by default)](#faq-accordion-collapsed-by-default)
- [Bottom CTA (full-width band)](#bottom-cta-full-width-band)
- [Footer (multi-column links + brand)](#footer-multi-column-links--brand)
- [Newsletter signup (inline form)](#newsletter-signup-inline-form)
- [Newsletter HTML skeletons (email-safe variants)](#newsletter-html-skeletons-email-safe-variants)
- [Full-bleed sections — escaping the 72ch cap](#full-bleed-sections--escaping-the-72ch-cap)

The canonical landing-page screen shapes — hero, features, social
proof, pricing, FAQ, CTA. Use `wf-archetype--web` (centered column
capped at 72ch); for full-bleed hero / feature sections, extend the
main with sub-sections that opt out of the cap.

## Table of contents

- [Hero (image + headline + CTA)](#hero-image--headline--cta)
- [Feature trio (3 cards in a row)](#feature-trio-3-cards-in-a-row)
- [Feature-with-image (alternating left-right rows)](#feature-with-image-alternating-left-right-rows)
- [Social proof (logo grid)](#social-proof-logo-grid)
- [Testimonial card (quote + avatar + attribution)](#testimonial-card-quote--avatar--attribution)
- [Pricing table (3 tiers, comparison rows)](#pricing-table-3-tiers-comparison-rows)
- [FAQ accordion (collapsed by default)](#faq-accordion-collapsed-by-default)
- [Bottom CTA (full-width band)](#bottom-cta-full-width-band)
- [Footer (multi-column links + brand)](#footer-multi-column-links--brand)
- [Newsletter signup (inline form)](#newsletter-signup-inline-form)
- [Newsletter HTML skeletons (email-safe variants)](#newsletter-html-skeletons-email-safe-variants)
- [Full-bleed sections — escaping the 72ch cap](#full-bleed-sections--escaping-the-72ch-cap)

---

## Hero (image + headline + CTA)

The opening section. Above-the-fold real estate — needs an image,
a headline, a sub-headline, and a primary CTA.

```html
<section class="wf-screen" id="screen-landing"
         data-ve-id="screen-landing" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <nav class="wf-nav">
        <a class="wf-nav-item is-active" href="#screen-landing">Home</a>
        <a class="wf-nav-item" href="#screen-pricing">Pricing</a>
        <a class="wf-nav-item" href="#screen-docs">Docs</a>
        <a class="wf-nav-item" href="#screen-login">Log in</a>
        <a class="wf-nav-item is-active" href="#screen-signup">Sign up</a>
      </nav>
    </header>

    <main class="wf-main">

      <section style="display:grid;
                       grid-template-columns:1fr 1fr;
                       gap:48px;
                       align-items:center;">

        <div style="display:flex; flex-direction:column; gap:16px;">
          <span class="wf-chip">NEW</span>
          <h1 class="wf-text" data-wf-lines="2"
              style="font-size:48px; line-height:1.1;"></h1>
          <p class="wf-text" data-wf-lines="3"
             style="font-size:18px; color:var(--vc-color-content-muted);"></p>
          <div style="display:flex; gap:12px;">
            <button class="wf-button">Get started</button>
            <button class="wf-button wf-button--ghost">See demo</button>
          </div>
        </div>

        <figure class="wf-image" style="min-height:320px;"></figure>

      </section>

    </main>

  </div>
</section>
```

### Notes

- Two-column grid: text-left, image-right. Reverse for visual
  variety (`grid-template-columns: 1fr 1fr; direction: rtl;` or
  re-order the children).
- The `wf-chip` above the headline is the "eyebrow" — a small
  category label.
- The headline overrides `font-size: 48px` for hero scale (the
  default `wf-text` is body-size).
- Two buttons: primary (Get started, filled) + secondary
  (See demo, ghost).
- The image is bigger than default (320px) — heroes need real
  visual weight.

---

## Feature trio (3 cards in a row)

The "three reasons to use us" section — a row of three feature
cards.

```html
<main class="wf-main">

  <h2 class="wf-text" data-wf-lines="1" style="text-align:center; font-size:32px;">
    Why choose this?
  </h2>
  <p class="wf-text" data-wf-lines="2" style="text-align:center;
                                              max-width:560px;
                                              margin:0 auto;"></p>

  <div style="display:grid;
              grid-template-columns:repeat(3, 1fr);
              gap:24px;
              margin-top:32px;">

    <article class="wf-card">
      <figure class="wf-image" style="min-height:120px;"></figure>
      <h3 class="wf-text" data-wf-lines="1"></h3>
      <p class="wf-text" data-wf-lines="3"></p>
    </article>

    <article class="wf-card">
      <figure class="wf-image" style="min-height:120px;"></figure>
      <h3 class="wf-text" data-wf-lines="1"></h3>
      <p class="wf-text" data-wf-lines="3"></p>
    </article>

    <article class="wf-card">
      <figure class="wf-image" style="min-height:120px;"></figure>
      <h3 class="wf-text" data-wf-lines="1"></h3>
      <p class="wf-text" data-wf-lines="3"></p>
    </article>

  </div>

</main>
```

### Notes

- Section header is centered + max-width-560px (read as a
  "section intro" not a body paragraph).
- Each feature card has 3 children: image (or icon), title, body.
- The image is smaller than the hero (120px) — feature illustrations
  are small spots, not focal points.
- For 4-card variant, use `repeat(4, 1fr)`. For 2-card variant
  (compare-and-contrast), use `repeat(2, 1fr)`.

---

## Feature-with-image (alternating left-right rows)

Long-form feature sections — alternating image-left and image-right
rows. Each row tells one story.

```html
<main class="wf-main">

  <!-- Row 1: image-left -->
  <section style="display:grid; grid-template-columns:1fr 1fr;
                  gap:48px; align-items:center; padding-block:48px;">
    <figure class="wf-image" style="min-height:240px;"></figure>
    <div>
      <span class="wf-chip">FEATURE 1</span>
      <h2 class="wf-text" data-wf-lines="2" style="font-size:32px;"></h2>
      <p class="wf-text" data-wf-lines="4"></p>
      <a class="wf-button wf-button--ghost" href="#feature-1">Learn more →</a>
    </div>
  </section>

  <!-- Row 2: image-right -->
  <section style="display:grid; grid-template-columns:1fr 1fr;
                  gap:48px; align-items:center; padding-block:48px;">
    <div>
      <span class="wf-chip">FEATURE 2</span>
      <h2 class="wf-text" data-wf-lines="2" style="font-size:32px;"></h2>
      <p class="wf-text" data-wf-lines="4"></p>
      <a class="wf-button wf-button--ghost" href="#feature-2">Learn more →</a>
    </div>
    <figure class="wf-image" style="min-height:240px;"></figure>
  </section>

  <!-- Row 3: image-left again -->
  <section style="display:grid; grid-template-columns:1fr 1fr;
                  gap:48px; align-items:center; padding-block:48px;">
    <figure class="wf-image" style="min-height:240px;"></figure>
    <div>
      <span class="wf-chip">FEATURE 3</span>
      <h2 class="wf-text" data-wf-lines="2" style="font-size:32px;"></h2>
      <p class="wf-text" data-wf-lines="4"></p>
      <a class="wf-button wf-button--ghost" href="#feature-3">Learn more →</a>
    </div>
  </section>

</main>
```

### Notes

- `padding-block: 48px` on each row gives breathing room — these
  sections are deliberately tall.
- The image and text columns swap per row (image-left, image-right,
  image-left). This pattern reads as "more is coming" — the
  asymmetry keeps the eye scanning.
- Each section uses an `<h2>`-level heading + body + a "Learn more"
  ghost link (not a primary CTA — feature sections explain, the
  hero/footer asks for action).

---

## Social proof (logo grid)

A row of customer logos — "trusted by these companies".

```html
<main class="wf-main">

  <p class="wf-text" data-wf-lines="1" style="text-align:center;
                                               font-size:12px;
                                               color:var(--vc-color-content-subtle);
                                               text-transform:uppercase;
                                               letter-spacing:0.1em;">
    Trusted by teams at
  </p>

  <div style="display:grid;
              grid-template-columns:repeat(6, 1fr);
              gap:32px;
              align-items:center;
              justify-items:center;
              opacity:0.6;
              margin-top:16px;">
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
    <figure class="wf-image" style="min-height:48px; max-width:120px;"></figure>
  </div>

</main>
```

### Notes

- The intro text is small + uppercase + tracked — the conventional
  "trusted by" label.
- `opacity: 0.6` on the logo grid is the conventional softening —
  customer logos should feel SUBTLE, not loud.
- 6 logos is the standard count. 5 or 8 also work. Avoid 7 (looks
  unbalanced) or 4 (too few to feel like proof).

---

## Testimonial card (quote + avatar + attribution)

A single testimonial in a card.

```html
<article class="wf-card" style="max-width:560px; margin:0 auto;">

  <p class="wf-text" data-wf-lines="4"
     style="font-size:20px; font-style:italic;"></p>

  <footer style="display:flex; gap:12px; align-items:center; margin-top:16px;">
    <span class="wf-avatar"></span>
    <div>
      <span class="wf-text" data-wf-lines="1"
            style="font-weight:600;"></span>
      <span class="wf-text" data-wf-lines="1"
            style="font-size:12px;
                   color:var(--vc-color-content-subtle);"></span>
    </div>
  </footer>

</article>
```

For a 3-testimonial row, wrap in a grid:

```html
<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:24px;">
  <article class="wf-card">…testimonial 1…</article>
  <article class="wf-card">…testimonial 2…</article>
  <article class="wf-card">…testimonial 3…</article>
</div>
```

---

## Pricing table (3 tiers, comparison rows)

The classic 3-tier pricing page — Starter, Pro, Enterprise.

```html
<main class="wf-main">

  <h1 class="wf-text" data-wf-lines="1" style="text-align:center;
                                                font-size:40px;">
    Pricing
  </h1>
  <p class="wf-text" data-wf-lines="1" style="text-align:center;">
    Simple plans. No surprises.
  </p>

  <div style="display:grid; grid-template-columns:repeat(3, 1fr);
              gap:24px; margin-top:32px;">

    <article class="wf-card">
      <h2 class="wf-text" data-wf-lines="1">Starter</h2>
      <p class="wf-text" data-wf-lines="1"
         style="font-size:36px; font-weight:600;">$0</p>
      <p class="wf-text" data-wf-lines="1"
         style="color:var(--vc-color-content-subtle);">per month</p>
      <ul style="list-style:none; padding:0; display:flex;
                 flex-direction:column; gap:8px; margin-top:16px;">
        <li class="wf-text" data-wf-lines="1">✓ 100 requests / mo</li>
        <li class="wf-text" data-wf-lines="1">✓ Community support</li>
        <li class="wf-text" data-wf-lines="1">✓ Basic analytics</li>
      </ul>
      <button class="wf-button wf-button--ghost" style="margin-top:16px;">
        Get started
      </button>
    </article>

    <article class="wf-card"
             style="outline:2px solid var(--vc-color-accent);
                    outline-offset:-2px;">
      <span class="wf-chip" style="background:var(--vc-color-accent);
                                   color:var(--vc-color-on-accent);
                                   align-self:flex-start;">
        POPULAR
      </span>
      <h2 class="wf-text" data-wf-lines="1">Pro</h2>
      <p class="wf-text" data-wf-lines="1"
         style="font-size:36px; font-weight:600;">$29</p>
      <p class="wf-text" data-wf-lines="1"
         style="color:var(--vc-color-content-subtle);">per month</p>
      <ul style="list-style:none; padding:0; display:flex;
                 flex-direction:column; gap:8px; margin-top:16px;">
        <li class="wf-text" data-wf-lines="1">✓ 10,000 requests / mo</li>
        <li class="wf-text" data-wf-lines="1">✓ Email support</li>
        <li class="wf-text" data-wf-lines="1">✓ Advanced analytics</li>
        <li class="wf-text" data-wf-lines="1">✓ Custom domain</li>
      </ul>
      <button class="wf-button" style="margin-top:16px;">Start Pro trial</button>
    </article>

    <article class="wf-card">
      <h2 class="wf-text" data-wf-lines="1">Enterprise</h2>
      <p class="wf-text" data-wf-lines="1"
         style="font-size:36px; font-weight:600;">Custom</p>
      <p class="wf-text" data-wf-lines="1"
         style="color:var(--vc-color-content-subtle);">contact us</p>
      <ul style="list-style:none; padding:0; display:flex;
                 flex-direction:column; gap:8px; margin-top:16px;">
        <li class="wf-text" data-wf-lines="1">✓ Unlimited requests</li>
        <li class="wf-text" data-wf-lines="1">✓ SLA + priority support</li>
        <li class="wf-text" data-wf-lines="1">✓ Custom integrations</li>
        <li class="wf-text" data-wf-lines="1">✓ Dedicated CSM</li>
      </ul>
      <button class="wf-button wf-button--ghost" style="margin-top:16px;">
        Contact sales
      </button>
    </article>

  </div>

</main>
```

### Notes

- The middle (recommended) tier has a 2px accent outline + a
  "POPULAR" chip. Direct the user to the tier you want them to
  pick.
- Each tier: title, price, period, feature list, CTA.
- The free tier ($0) uses ghost CTA ("Get started"). The popular
  tier uses primary CTA ("Start Pro trial"). The enterprise tier
  uses ghost ("Contact sales").
- Feature lists use `✓` for included items. For some-tiers-only
  features, use `—` or `×` in the missing tiers.

---

## FAQ accordion (collapsed by default)

Use native `<details>` elements — no JS needed.

```html
<main class="wf-main">

  <h2 class="wf-text" data-wf-lines="1" style="font-size:32px;">
    Frequently asked questions
  </h2>

  <article class="wf-card">
    <details>
      <summary class="wf-text" data-wf-lines="1"
               style="cursor:pointer; font-weight:600;">
        What is this?
      </summary>
      <p class="wf-text" data-wf-lines="3" style="margin-top:8px;"></p>
    </details>
  </article>

  <article class="wf-card">
    <details>
      <summary class="wf-text" data-wf-lines="1"
               style="cursor:pointer; font-weight:600;">
        How do I get started?
      </summary>
      <p class="wf-text" data-wf-lines="3" style="margin-top:8px;"></p>
    </details>
  </article>

  <article class="wf-card">
    <details>
      <summary class="wf-text" data-wf-lines="1"
               style="cursor:pointer; font-weight:600;">
        Can I cancel anytime?
      </summary>
      <p class="wf-text" data-wf-lines="3" style="margin-top:8px;"></p>
    </details>
  </article>

</main>
```

### Notes

- `<details>` + `<summary>` is the semantic HTML for collapsible
  content. Browsers ship a default disclosure triangle on the
  summary.
- Use `cursor: pointer` so the summary feels clickable.
- The body content (paragraph) is shown when the user clicks the
  summary. No JS.
- For an "all expanded" variant, add `open` attribute to each
  `<details>`.

---

## Bottom CTA (full-width band)

The page's final ask. Full-width band, large headline, single CTA.

```html
<section style="background:var(--vc-color-surface-sunken);
                padding:64px 16px;
                text-align:center;
                margin-top:64px;">

  <h2 class="wf-text" data-wf-lines="2" style="font-size:36px;
                                                max-width:560px;
                                                margin:0 auto 16px;"></h2>
  <p class="wf-text" data-wf-lines="2" style="max-width:480px;
                                               margin:0 auto 24px;"></p>
  <button class="wf-button" style="font-size:18px; padding:16px 32px;">
    Start your free trial
  </button>

</section>
```

### Notes

- Full-width (no `wf-main` cap) — break out of the 72ch column.
- `background: var(--vc-color-surface-sunken)` ties this band to
  the page's tonal palette.
- Single CTA — the bottom band asks for ONE thing. Don't add a
  secondary action here.

---

## Footer (multi-column links + brand)

The end-of-page footer — 4 columns of links + brand info.

```html
<footer style="background:var(--vc-color-surface-sunken);
               padding:48px 16px;">
  <div style="max-width:1100px; margin:0 auto;
              display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr;
              gap:32px;">

    <div>
      <span class="wf-text" data-wf-lines="1" style="font-weight:600;">brand</span>
      <p class="wf-text" data-wf-lines="2"
         style="color:var(--vc-color-content-subtle);
                margin-top:8px;"></p>
    </div>

    <div>
      <span class="wf-label">Product</span>
      <nav style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <a class="wf-nav-item" href="#screen-features">Features</a>
        <a class="wf-nav-item" href="#screen-pricing">Pricing</a>
        <a class="wf-nav-item" href="#screen-docs">Docs</a>
      </nav>
    </div>

    <div>
      <span class="wf-label">Company</span>
      <nav style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <a class="wf-nav-item" href="#screen-about">About</a>
        <a class="wf-nav-item" href="#screen-careers">Careers</a>
        <a class="wf-nav-item" href="#screen-press">Press</a>
      </nav>
    </div>

    <div>
      <span class="wf-label">Resources</span>
      <nav style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <a class="wf-nav-item" href="#screen-blog">Blog</a>
        <a class="wf-nav-item" href="#screen-changelog">Changelog</a>
        <a class="wf-nav-item" href="#screen-support">Support</a>
      </nav>
    </div>

    <div>
      <span class="wf-label">Legal</span>
      <nav style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <a class="wf-nav-item" href="#screen-terms">Terms</a>
        <a class="wf-nav-item" href="#screen-privacy">Privacy</a>
        <a class="wf-nav-item" href="#screen-security">Security</a>
      </nav>
    </div>

  </div>

  <hr class="wf-divider" style="max-width:1100px; margin:32px auto;">

  <div style="max-width:1100px; margin:0 auto;
              display:flex; justify-content:space-between;">
    <span class="wf-text" data-wf-lines="1"
          style="font-size:12px;
                 color:var(--vc-color-content-subtle);">
      © 2026 brand inc.
    </span>
    <nav style="display:flex; gap:12px;">
      <a class="wf-text" data-wf-lines="1">Twitter</a>
      <a class="wf-text" data-wf-lines="1">GitHub</a>
      <a class="wf-text" data-wf-lines="1">LinkedIn</a>
    </nav>
  </div>

</footer>
```

### Notes

- 5-column grid: brand (2fr) + 4 link columns (1fr each).
- Each link column has a small uppercase `wf-label` header + a
  vertical stack of `wf-nav-item` links.
- The bottom strip after the divider has copyright (left) and
  social links (right).

---

## Newsletter signup (inline form)

A 1-input form for email subscription. Inline at the bottom of a
section, or in the footer.

```html
<article class="wf-card" style="max-width:480px; margin:0 auto;">
  <h3 class="wf-text" data-wf-lines="1">Get monthly updates</h3>
  <p class="wf-text" data-wf-lines="2"
     style="color:var(--vc-color-content-subtle);"></p>

  <form style="display:flex; gap:8px; margin-top:16px;">
    <input class="wf-input" type="email" placeholder="you@example.com"
           style="flex:1;">
    <button class="wf-button">Subscribe</button>
  </form>

  <span class="wf-text" data-wf-lines="1"
        style="font-size:12px;
               color:var(--vc-color-content-subtle);">
    No spam. Unsubscribe anytime.
  </span>
</article>
```

### Notes

- The form is a flex row — input takes remaining space, button
  has natural width.
- The reassurance text below ("No spam. Unsubscribe anytime.") is
  the conventional confidence builder.

---

## Newsletter HTML skeletons (email-safe variants)

Email clients DON'T support modern CSS. Newsletter wireframes use
table-based layouts:

```html
<table cellspacing="0" cellpadding="0" border="0"
       style="width:100%; max-width:600px; margin:0 auto;
              background:var(--vc-color-canvas);">

  <tr>
    <td style="padding:24px;">
      <h1 style="margin:0;">Newsletter title</h1>
      <p style="margin:8px 0 0;
                color:#666;">
        Issue 42 · April 2026
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding:0 24px 24px;">
      <article style="border:1px solid #ddd; padding:16px;">
        <h2 style="margin:0 0 8px;">Article title</h2>
        <p style="margin:0;">Article body…</p>
        <a href="#">Read more →</a>
      </article>
    </td>
  </tr>

  <tr>
    <td style="padding:0 24px 24px;">
      <article style="border:1px solid #ddd; padding:16px;">
        <h2 style="margin:0 0 8px;">Article title</h2>
        <p style="margin:0;">Article body…</p>
        <a href="#">Read more →</a>
      </article>
    </td>
  </tr>

  <tr>
    <td style="padding:24px; background:#f5f5f5; text-align:center;">
      <p style="margin:0; color:#666; font-size:12px;">
        © 2026 brand · <a href="#">unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
```

For wireframe purposes, the table-based layout still uses
`--vc-color-*` tokens — but be aware the production newsletter will
render WITHOUT them (inline CSS only).

4 canonical newsletter shapes:

1. **Single-column editorial** — one article, full width.
2. **Two-column product** — image left, text right per article.
3. **Header-hero-CTA-footer** — single big hero + one CTA.
4. **Digest with sections** — multiple categorized article blocks.

---

## Full-bleed sections — escaping the 72ch cap

`wf-archetype--web > .wf-main` is capped at `--wf-measure` (72ch).
For full-width sections (hero, CTA band, footer), break out of the
cap by putting the section OUTSIDE `wf-main`:

```html
<div class="wf-archetype--web">

  <header class="wf-header">…</header>

  <!-- Full-width hero — OUTSIDE wf-main -->
  <section style="background:var(--vc-color-surface-sunken);
                  padding:64px 16px;
                  text-align:center;">
    <h1>…</h1>
  </section>

  <!-- Capped content INSIDE wf-main -->
  <main class="wf-main">
    <p>…</p>
  </main>

  <!-- Full-width CTA band — OUTSIDE wf-main -->
  <section style="background:var(--vc-color-accent);
                  color:var(--vc-color-on-accent);
                  padding:64px 16px;">
    <h2>…</h2>
  </section>

  <!-- Full-width footer — OUTSIDE wf-main -->
  <footer style="background:var(--vc-color-surface-sunken);">
    …
  </footer>

</div>
```

The body content stays narrow + readable; the hero / CTA / footer
go edge-to-edge. This is the canonical landing-page rhythm.
