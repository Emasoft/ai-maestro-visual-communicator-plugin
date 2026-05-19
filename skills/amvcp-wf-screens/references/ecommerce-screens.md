# E-commerce screens — catalog, product, cart, checkout

## Table of Contents

- [Pattern 1 — Catalog (filter sidebar + product grid)](#pattern-1--catalog-filter-sidebar--product-grid)
- [Pattern 2 — Product detail (gallery + info + add-to-cart)](#pattern-2--product-detail-gallery--info--add-to-cart)
- [Pattern 3 — Cart (line items + subtotal + checkout button)](#pattern-3--cart-line-items--subtotal--checkout-button)
- [Pattern 4 — Checkout (address + payment + review)](#pattern-4--checkout-address--payment--review)
- [Pattern 5 — Order confirmation (success + summary + next steps)](#pattern-5--order-confirmation-success--summary--next-steps)
- [Pattern 6 — Account orders (table + status chips)](#pattern-6--account-orders-table--status-chips)
- [The price block — current + compare-at + sale chip](#the-price-block--current--compare-at--sale-chip)
- [Quantity stepper (− input +)](#quantity-stepper--input-)
- [Variant picker (color swatches, size buttons)](#variant-picker-color-swatches-size-buttons)
- [Stock status badge](#stock-status-badge)
- [Promo / discount bar](#promo--discount-bar)

The shopping-flow shapes. Six canonical screens: product catalog
grid, product detail page (PDP), shopping cart, checkout, order
confirmation, account orders. All driven by `wf-archetype--web` for
desktop, optionally framed in `wf-frame--browser` for marketing
screenshots.

## Table of contents

- [Pattern 1 — Catalog (filter sidebar + product grid)](#pattern-1--catalog-filter-sidebar--product-grid)
- [Pattern 2 — Product detail (gallery + info + add-to-cart)](#pattern-2--product-detail-gallery--info--add-to-cart)
- [Pattern 3 — Cart (line items + subtotal + checkout button)](#pattern-3--cart-line-items--subtotal--checkout-button)
- [Pattern 4 — Checkout (address + payment + review)](#pattern-4--checkout-address--payment--review)
- [Pattern 5 — Order confirmation (success + summary + next steps)](#pattern-5--order-confirmation-success--summary--next-steps)
- [Pattern 6 — Account orders (table + status chips)](#pattern-6--account-orders-table--status-chips)
- [The price block — current + compare-at + sale chip](#the-price-block--current--compare-at--sale-chip)
- [Quantity stepper (− input +)](#quantity-stepper----input-)
- [Variant picker (color swatches, size buttons)](#variant-picker-color-swatches-size-buttons)
- [Stock status badge](#stock-status-badge)
- [Promo / discount bar](#promo--discount-bar)

---

## Pattern 1 — Catalog (filter sidebar + product grid)

The most-visited screen on an e-commerce site. Sidebar with filters
on the left, scrollable product grid on the right.

```html
<section class="wf-screen" id="screen-catalog"
         data-ve-id="screen-catalog" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <nav class="wf-nav">
        <a class="wf-nav-item" href="#screen-shop">Shop</a>
        <a class="wf-nav-item" href="#screen-about">About</a>
        <a class="wf-nav-item" href="#screen-cart">Cart (3)</a>
      </nav>
    </header>

    <main class="wf-main" style="max-width:1200px;">

      <header style="display:flex; align-items:center; gap:16px;">
        <h1 class="wf-text" data-wf-lines="1" style="flex:1;">All products</h1>
        <span class="wf-text" data-wf-lines="1"
              style="color:var(--vc-color-content-subtle);">
          234 results
        </span>
        <select class="wf-input" style="width:auto;">
          <option>Sort: Featured</option>
        </select>
      </header>

      <div style="display:grid;
                  grid-template-columns:240px 1fr;
                  gap:32px;">

        <aside style="display:flex; flex-direction:column; gap:16px;">

          <article class="wf-card">
            <span class="wf-label">Category</span>
            <label style="display:flex; gap:8px; align-items:center;">
              <input type="checkbox">
              <span class="wf-text" data-wf-lines="1">All (234)</span>
            </label>
            <label style="display:flex; gap:8px; align-items:center;">
              <input type="checkbox">
              <span class="wf-text" data-wf-lines="1">Tops (89)</span>
            </label>
            <label style="display:flex; gap:8px; align-items:center;">
              <input type="checkbox">
              <span class="wf-text" data-wf-lines="1">Bottoms (76)</span>
            </label>
            <label style="display:flex; gap:8px; align-items:center;">
              <input type="checkbox">
              <span class="wf-text" data-wf-lines="1">Accessories (69)</span>
            </label>
          </article>

          <article class="wf-card">
            <span class="wf-label">Price</span>
            <div style="display:flex; gap:8px;">
              <input class="wf-input" placeholder="Min" style="flex:1;">
              <input class="wf-input" placeholder="Max" style="flex:1;">
            </div>
          </article>

          <article class="wf-card">
            <span class="wf-label">Size</span>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">
              <span class="wf-chip">XS</span>
              <span class="wf-chip">S</span>
              <span class="wf-chip">M</span>
              <span class="wf-chip">L</span>
              <span class="wf-chip">XL</span>
            </div>
          </article>

        </aside>

        <div style="display:grid;
                    grid-template-columns:repeat(3, 1fr);
                    gap:16px;">

          <a href="#screen-product-1" class="wf-card"
             data-ve-id="card-product-1" data-ve-type="wireframe-block">
            <figure class="wf-image" style="min-height:200px;
                                              aspect-ratio: 1;"></figure>
            <span class="wf-text" data-wf-lines="1"
                  style="margin-top:8px;">Product name</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">$49.00</span>
          </a>

          <a href="#screen-product-2" class="wf-card">
            <figure class="wf-image" style="min-height:200px;
                                              aspect-ratio: 1;"></figure>
            <span class="wf-text" data-wf-lines="1">Product name</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-weight:600;">$89.00</span>
          </a>

          <a href="#screen-product-3" class="wf-card">…</a>
          <a href="#screen-product-4" class="wf-card">…</a>
          <a href="#screen-product-5" class="wf-card">…</a>
          <a href="#screen-product-6" class="wf-card">…</a>

        </div>

      </div>

    </main>

  </div>
</section>
```

### Notes

- The header row has 3 elements: title, result count, sort
  dropdown.
- Sidebar uses 240px column; product grid takes the rest. For
  4-column product grid on wider viewports, use
  `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.
- Each product card has: square image (aspect-ratio: 1), name,
  price.
- Filter sections are individual `wf-card`s in the sidebar —
  category checkboxes, price range inputs, size chips.

---

## Pattern 2 — Product detail (gallery + info + add-to-cart)

The product detail page (PDP). Large gallery on the left, product
info + add-to-cart on the right.

```html
<section class="wf-screen" id="screen-product-1"
         data-ve-id="screen-product-1" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">…</header>

    <main class="wf-main" style="max-width:1200px;">

      <nav style="display:flex; gap:8px;
                  font-size:12px;
                  color:var(--vc-color-content-subtle);">
        <a href="#screen-catalog">Shop</a> /
        <a href="#screen-catalog-tops">Tops</a> /
        <span class="wf-text" data-wf-lines="1">Product name</span>
      </nav>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:48px;">

        <div style="display:flex; flex-direction:column; gap:8px;">
          <figure class="wf-image" style="min-height:480px;
                                            aspect-ratio: 1;"></figure>
          <div style="display:flex; gap:8px;">
            <figure class="wf-image" style="width:80px; height:80px;"></figure>
            <figure class="wf-image" style="width:80px; height:80px;"></figure>
            <figure class="wf-image" style="width:80px; height:80px;"></figure>
            <figure class="wf-image" style="width:80px; height:80px;"></figure>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">

          <span class="wf-label">CATEGORY</span>
          <h1 class="wf-text" data-wf-lines="2"
              style="font-size:32px; margin:0;"></h1>

          <div style="display:flex; gap:8px; align-items:center;">
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:24px; font-weight:600;">$49.00</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:16px;
                         color:var(--vc-color-content-subtle);
                         text-decoration:line-through;">$89.00</span>
            <span class="wf-chip">SAVE 45%</span>
          </div>

          <div>
            <label class="wf-label">Color</label>
            <div style="display:flex; gap:8px;">
              <span class="wf-avatar" style="width:32px; height:32px;
                                              background:#1f1a14;
                                              border:2px solid var(--vc-color-accent);"></span>
              <span class="wf-avatar" style="width:32px; height:32px;
                                              background:#c9bfa3;"></span>
              <span class="wf-avatar" style="width:32px; height:32px;
                                              background:#a84a32;"></span>
            </div>
          </div>

          <div>
            <label class="wf-label">Size</label>
            <div style="display:flex; gap:4px;">
              <button class="wf-button wf-button--ghost">XS</button>
              <button class="wf-button">S</button>
              <button class="wf-button wf-button--ghost">M</button>
              <button class="wf-button wf-button--ghost">L</button>
              <button class="wf-button wf-button--ghost">XL</button>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:center;">
            <label class="wf-label" style="margin:0;">Qty</label>
            <button class="wf-button wf-button--ghost">−</button>
            <input class="wf-input" value="1"
                   style="width:60px; text-align:center;">
            <button class="wf-button wf-button--ghost">+</button>
          </div>

          <button class="wf-button" style="padding:16px;
                                            font-size:18px;">
            Add to cart
          </button>

          <p class="wf-text" data-wf-lines="1"
             style="font-size:12px;
                    color:var(--vc-color-success);">
            ✓ In stock — ships in 1-2 days
          </p>

          <hr class="wf-divider">

          <details>
            <summary class="wf-text" data-wf-lines="1"
                     style="cursor:pointer; font-weight:600;">
              Description
            </summary>
            <p class="wf-text" data-wf-lines="6" style="margin-top:8px;"></p>
          </details>

          <details>
            <summary class="wf-text" data-wf-lines="1"
                     style="cursor:pointer; font-weight:600;">
              Shipping & returns
            </summary>
            <p class="wf-text" data-wf-lines="3" style="margin-top:8px;"></p>
          </details>

        </div>

      </div>

    </main>

  </div>
</section>
```

### Notes

- Breadcrumb at the top — Shop / Category / Product.
- 50/50 grid: gallery left, info right.
- Gallery: 1 main image + 4 thumbnail row below.
- Info column has 8+ children: category eyebrow, title, price block,
  color picker, size picker, quantity stepper, Add to cart button,
  stock status, divider, expandable description, expandable
  shipping.
- The current color has a 2px accent outline (matching the
  fidelity-lock accent treatment).

---

## Pattern 3 — Cart (line items + subtotal + checkout button)

The shopping cart — line items in a table-like layout, totals
summary, checkout CTA.

```html
<section class="wf-screen" id="screen-cart"
         data-ve-id="screen-cart" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">…</header>

    <main class="wf-main" style="max-width:1100px;">

      <h1 class="wf-text" data-wf-lines="1">Your cart (3 items)</h1>

      <div style="display:grid; grid-template-columns:2fr 1fr;
                  gap:32px;">

        <section style="display:flex; flex-direction:column; gap:16px;">

          <article class="wf-card" style="display:grid;
                                            grid-template-columns:80px 1fr auto;
                                            gap:16px; align-items:center;">
            <figure class="wf-image" style="width:80px; height:80px;"></figure>
            <div>
              <span class="wf-text" data-wf-lines="1"
                    style="font-weight:600;">Product name</span>
              <span class="wf-text" data-wf-lines="1"
                    style="font-size:12px;
                           color:var(--vc-color-content-subtle);">
                Size M · Black
              </span>
              <div style="display:flex; gap:4px; margin-top:8px;
                          align-items:center;">
                <button class="wf-button wf-button--ghost">−</button>
                <span class="wf-text" data-wf-lines="1">2</span>
                <button class="wf-button wf-button--ghost">+</button>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="wf-text" data-wf-lines="1"
                    style="font-weight:600;">$98.00</span>
              <br>
              <a class="wf-text" data-wf-lines="1"
                 style="font-size:12px;
                        color:var(--vc-color-danger);">Remove</a>
            </div>
          </article>

          <article class="wf-card">…second item…</article>
          <article class="wf-card">…third item…</article>

        </section>

        <aside style="display:flex; flex-direction:column; gap:16px;">

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Order summary</span>
            </header>

            <div style="display:flex; justify-content:space-between;">
              <span class="wf-text" data-wf-lines="1">Subtotal</span>
              <span class="wf-text" data-wf-lines="1">$235.00</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span class="wf-text" data-wf-lines="1">Shipping</span>
              <span class="wf-text" data-wf-lines="1">$8.00</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span class="wf-text" data-wf-lines="1">Tax</span>
              <span class="wf-text" data-wf-lines="1">$24.30</span>
            </div>

            <hr class="wf-divider">

            <div style="display:flex; justify-content:space-between;
                        font-size:18px; font-weight:600;">
              <span class="wf-text" data-wf-lines="1">Total</span>
              <span class="wf-text" data-wf-lines="1">$267.30</span>
            </div>

            <button class="wf-button" style="margin-top:16px;
                                              padding:14px;
                                              font-size:16px;">
              Checkout
            </button>

            <p class="wf-text" data-wf-lines="1"
               style="font-size:12px;
                      text-align:center;
                      color:var(--vc-color-content-subtle);">
              Secure checkout · Free returns
            </p>
          </article>

          <article class="wf-card">
            <label class="wf-label">Promo code</label>
            <div style="display:flex; gap:8px;">
              <input class="wf-input" placeholder="ENTER CODE" style="flex:1;">
              <button class="wf-button wf-button--ghost">Apply</button>
            </div>
          </article>

        </aside>

      </div>

    </main>

  </div>
</section>
```

### Notes

- 2/3 column split: line items left, summary right.
- Each line item is a 3-column grid: image / details / price-and-
  remove.
- Quantity stepper inside each line item.
- Order summary card has: subtotal, shipping, tax, divider, total
  (bold + larger), Checkout button, reassurance text.
- Promo code is a separate card below the summary.

---

## Pattern 4 — Checkout (address + payment + review)

The checkout form. Single column on mobile, two-column on desktop
(form left, order summary right).

```html
<section class="wf-screen" id="screen-checkout"
         data-ve-id="screen-checkout" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">
      <span class="wf-text" data-wf-lines="1">brand</span>
      <span class="wf-text" data-wf-lines="1">Secure checkout</span>
    </header>

    <main class="wf-main" style="max-width:1100px;">

      <nav style="display:flex; gap:8px; align-items:center;
                  margin-bottom:24px;">
        <span class="wf-chip" style="background:var(--vc-color-content);
                                       color:var(--vc-color-canvas);">1</span>
        <span class="wf-text" data-wf-lines="1">Address</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">2</span>
        <span class="wf-text" data-wf-lines="1">Payment</span>
        <hr style="flex:1;" class="wf-divider">
        <span class="wf-chip">3</span>
        <span class="wf-text" data-wf-lines="1">Review</span>
      </nav>

      <div style="display:grid; grid-template-columns:2fr 1fr;
                  gap:32px;">

        <section style="display:flex; flex-direction:column; gap:24px;">

          <article class="wf-card">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Shipping address</span>
            </header>

            <label class="wf-label">Email</label>
            <input class="wf-input" type="email">

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <label class="wf-label">First name</label>
                <input class="wf-input">
              </div>
              <div>
                <label class="wf-label">Last name</label>
                <input class="wf-input">
              </div>
            </div>

            <label class="wf-label">Address</label>
            <input class="wf-input">

            <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:16px;">
              <div>
                <label class="wf-label">City</label>
                <input class="wf-input">
              </div>
              <div>
                <label class="wf-label">State</label>
                <input class="wf-input">
              </div>
              <div>
                <label class="wf-label">ZIP</label>
                <input class="wf-input">
              </div>
            </div>

            <footer class="wf-card__actions">
              <a class="wf-button wf-button--ghost" href="#screen-cart">← Cart</a>
              <a class="wf-button" href="#screen-payment">Continue to payment</a>
            </footer>
          </article>

        </section>

        <aside>
          <article class="wf-card" style="position:sticky; top:24px;">
            <header class="wf-card__title">
              <span class="wf-text" data-wf-lines="1">Order summary</span>
            </header>

            <div style="display:flex; gap:8px;">
              <figure class="wf-image" style="width:48px; height:48px;"></figure>
              <div style="flex:1;">
                <span class="wf-text" data-wf-lines="1">Item</span>
                <span class="wf-text" data-wf-lines="1"
                      style="font-size:12px;">Qty 2</span>
              </div>
              <span class="wf-text" data-wf-lines="1">$98.00</span>
            </div>

            <hr class="wf-divider">

            <div style="display:flex; justify-content:space-between;">
              <span>Subtotal</span><span>$235.00</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Shipping</span><span>$8.00</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Tax</span><span>$24.30</span>
            </div>

            <hr class="wf-divider">

            <div style="display:flex; justify-content:space-between;
                        font-weight:600;">
              <span>Total</span><span>$267.30</span>
            </div>
          </article>
        </aside>

      </div>

    </main>

  </div>
</section>
```

### Notes

- Header is simplified — brand name + "Secure checkout". Drop the
  navigation; the user is in checkout, they shouldn't be tempted
  away.
- 3-step progress indicator at the top (Address / Payment /
  Review).
- The form is the 2-column main; the order summary is in a sticky
  sidebar (always visible while scrolling).
- Form structure mirrors the address pattern from
  [`form-patterns.md`](../../amvcp-wf-archetypes/references/form-patterns.md).

---

## Pattern 5 — Order confirmation (success + summary + next steps)

After successful payment. Big success message, order details, what
happens next.

```html
<section class="wf-screen" id="screen-confirm"
         data-ve-id="screen-confirm" data-ve-type="wireframe-screen">
  <div class="wf-archetype--web">

    <header class="wf-header">…</header>

    <main class="wf-main" style="max-width:640px;">

      <header style="text-align:center;">
        <span class="wf-chip" style="background:var(--vc-color-success);
                                       color:var(--vc-color-on-accent);
                                       font-size:24px;
                                       padding:8px 16px;">
          ✓
        </span>
        <h1 class="wf-text" data-wf-lines="1"
            style="font-size:32px; margin-top:16px;">
          Thank you for your order
        </h1>
        <p class="wf-text" data-wf-lines="2"
           style="color:var(--vc-color-content-subtle);"></p>
      </header>

      <article class="wf-card">
        <header style="display:flex; justify-content:space-between;">
          <span class="wf-text" data-wf-lines="1"
                style="font-weight:600;">Order #ABC1234</span>
          <span class="wf-text" data-wf-lines="1"
                style="font-size:12px;">May 16, 2026</span>
        </header>

        <hr class="wf-divider">

        <div style="display:flex; gap:12px;">
          <figure class="wf-image" style="width:64px; height:64px;"></figure>
          <div style="flex:1;">
            <span class="wf-text" data-wf-lines="1">Product name</span>
            <span class="wf-text" data-wf-lines="1"
                  style="font-size:12px;">Qty 2 · Size M</span>
          </div>
          <span class="wf-text" data-wf-lines="1">$98.00</span>
        </div>

        <hr class="wf-divider">

        <div style="display:flex; justify-content:space-between;
                    font-weight:600;">
          <span>Total</span>
          <span>$267.30</span>
        </div>
      </article>

      <article class="wf-card">
        <header class="wf-card__title">
          <span class="wf-text" data-wf-lines="1">What happens next</span>
        </header>
        <ol style="display:flex; flex-direction:column; gap:12px; padding-left:24px;">
          <li class="wf-text" data-wf-lines="1">
            You'll receive an order confirmation by email.
          </li>
          <li class="wf-text" data-wf-lines="1">
            Your order ships in 1-2 business days.
          </li>
          <li class="wf-text" data-wf-lines="1">
            Track your shipment from your account page.
          </li>
        </ol>
      </article>

      <footer style="display:flex; gap:8px; justify-content:center;">
        <a class="wf-button wf-button--ghost" href="#screen-orders">My orders</a>
        <a class="wf-button" href="#screen-shop">Continue shopping</a>
      </footer>

    </main>

  </div>
</section>
```

### Notes

- Centered narrow column (640px).
- Header: green check chip + "Thank you" headline + sub-headline.
- Order details card with item summary + total.
- "What happens next" card with numbered list of follow-up steps.
- Footer actions: View orders (ghost) + Continue shopping (primary).

---

## Pattern 6 — Account orders (table + status chips)

The account "your orders" screen — a list of past orders.

```html
<main class="wf-main">

  <h1 class="wf-text" data-wf-lines="1">Your orders</h1>

  <article class="wf-card" style="padding:0;">
    <div class="wf-table">

      <div class="wf-table-row wf-table-row--head">
        <span class="wf-text" data-wf-lines="1">Order</span>
        <span class="wf-text" data-wf-lines="1">Date</span>
        <span class="wf-text" data-wf-lines="1">Total</span>
        <span class="wf-text" data-wf-lines="1">Status</span>
        <span class="wf-text" data-wf-lines="1"></span>
      </div>

      <div class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">#ABC1234</span>
        <span class="wf-text" data-wf-lines="1">May 16</span>
        <span class="wf-text" data-wf-lines="1">$267.30</span>
        <span class="wf-chip" style="background:var(--vc-color-success);
                                      color:var(--vc-color-on-accent);">Delivered</span>
        <a class="wf-text" data-wf-lines="1" href="#screen-order-ABC1234">View</a>
      </div>

      <div class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">#DEF5678</span>
        <span class="wf-text" data-wf-lines="1">May 12</span>
        <span class="wf-text" data-wf-lines="1">$48.00</span>
        <span class="wf-chip" style="background:var(--vc-color-warning);
                                      color:var(--vc-color-on-accent);">Shipped</span>
        <a class="wf-text" data-wf-lines="1" href="#screen-order-DEF5678">View</a>
      </div>

      <div class="wf-table-row">
        <span class="wf-text" data-wf-lines="1"
              style="font-family:monospace;">#GHI9012</span>
        <span class="wf-text" data-wf-lines="1">May 9</span>
        <span class="wf-text" data-wf-lines="1">$129.00</span>
        <span class="wf-chip" style="background:var(--vc-color-content);
                                      color:var(--vc-color-canvas);">Processing</span>
        <a class="wf-text" data-wf-lines="1" href="#screen-order-GHI9012">View</a>
      </div>

    </div>
  </article>

</main>
```

### Notes

- Order IDs use monospace font — convention for IDs.
- Status chips use color: green for delivered (`--vc-color-success`),
  amber for shipped (`--vc-color-warning`), neutral for processing.
- The "View" link is a text-only link in the last column.
- At wireframe fidelity, all chips desaturate to grey — the status
  is read from the TEXT, not the color, which is correct UX (color
  reinforces but doesn't carry meaning).

---

## The price block — current + compare-at + sale chip

```html
<div style="display:flex; gap:8px; align-items:center;">
  <span style="font-size:24px; font-weight:600;">$49.00</span>
  <span style="font-size:16px;
               color:var(--vc-color-content-subtle);
               text-decoration:line-through;">$89.00</span>
  <span class="wf-chip">SAVE 45%</span>
</div>
```

Three elements: current price (big + bold), compare-at price
(smaller + struck-through), discount chip.

For non-sale prices, drop the compare-at + chip:

```html
<div style="font-size:24px; font-weight:600;">$49.00</div>
```

For pricing-per-unit, append the unit:

```html
<div style="font-size:24px; font-weight:600;">
  $49.00 <span style="font-size:14px;">/month</span>
</div>
```

---

## Quantity stepper (− input +)

```html
<div style="display:flex; gap:4px; align-items:center;">
  <button class="wf-button wf-button--ghost"
          style="padding:8px 12px;">−</button>
  <input class="wf-input" value="1"
         style="width:60px; text-align:center;">
  <button class="wf-button wf-button--ghost"
          style="padding:8px 12px;">+</button>
</div>
```

Three elements: minus button, narrow input (60px), plus button.
The input is editable — type a number directly.

---

## Variant picker (color swatches, size buttons)

### Color (avatar circles)

```html
<div style="display:flex; gap:8px;">
  <span class="wf-avatar" style="width:32px; height:32px;
                                   background:#1f1a14;
                                   border:2px solid var(--vc-color-accent);"
        title="Black"></span>
  <span class="wf-avatar" style="width:32px; height:32px;
                                   background:#c9bfa3;"
        title="Beige"></span>
  <span class="wf-avatar" style="width:32px; height:32px;
                                   background:#a84a32;"
        title="Brick"></span>
</div>
```

The SELECTED color has a 2px accent outline. Use real hex colors
for the swatches (this is the one place a wireframe shows actual
color — the color IS the product attribute).

### Size (button row)

```html
<div style="display:flex; gap:4px;">
  <button class="wf-button wf-button--ghost">XS</button>
  <button class="wf-button">S</button>
  <button class="wf-button wf-button--ghost">M</button>
  <button class="wf-button wf-button--ghost">L</button>
  <button class="wf-button wf-button--ghost">XL</button>
</div>
```

The SELECTED size uses the primary `wf-button` (filled at mid+),
others use ghost. For OUT-OF-STOCK sizes, add opacity + struck-
through:

```html
<button class="wf-button wf-button--ghost"
        style="opacity:0.5; text-decoration:line-through;"
        disabled>M</button>
```

---

## Stock status badge

```html
<!-- in stock -->
<p style="font-size:12px; color:var(--vc-color-success);">
  ✓ In stock — ships in 1-2 days
</p>

<!-- low stock -->
<p style="font-size:12px; color:var(--vc-color-warning);">
  ⚠ Only 3 left
</p>

<!-- out of stock -->
<p style="font-size:12px; color:var(--vc-color-danger);">
  ✗ Out of stock — notify me
</p>
```

Uses the semantic color tokens; at wireframe fidelity all
desaturate to greys but the GLYPHS (✓/⚠/✗) make the status clear.

---

## Promo / discount bar

A top-of-page banner promoting a discount.

```html
<div class="wf-toast"
     style="background:var(--vc-color-accent);
            color:var(--vc-color-on-accent);
            border-radius:0;
            text-align:center;
            justify-content:center;">
  FREE SHIPPING on orders over $50 — code FREE50
</div>
```

Sits ABOVE the header — full-width, accent background, white text.
At wireframe fidelity it desaturates to grey (still readable, just
not loud).
