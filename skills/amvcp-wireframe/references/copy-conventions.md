# Copy conventions — realistic placeholder text and labels

A wireframe with "Lorem ipsum dolor sit amet" lies about the
design. Real-looking labels reveal real problems (a 60-char button
label that fits the wireframe but overflows in production).

## Table of contents

- [The "no lorem" rule](#the-no-lorem-rule)
- [Realistic placeholders by field type](#realistic-placeholders-by-field-type)
- [Button labels — verb + object](#button-labels--verb--object)
- [Empty-state copy formulas](#empty-state-copy-formulas)
- [Error message conventions](#error-message-conventions)
- [Success / confirmation messages](#success--confirmation-messages)
- [Heading hierarchy and tone](#heading-hierarchy-and-tone)
- [Microcopy length budgets](#microcopy-length-budgets)
- [Internationalization considerations](#internationalization-considerations)
- [Sample data realism](#sample-data-realism)

---

## The "no lorem" rule

NEVER use lorem ipsum, "Title Here", or "[FIRST NAME]" placeholders
in a wireframe. Every label MUST be realistic.

Why:
- **Sizing**: Real labels are LONGER than lorem suggests. "Account
  settings" is wider than "Lorem ipsum" — a wireframe with lorem
  hides the overflow.
- **Tone**: The reviewer can judge whether the copy MATCHES the
  product's voice. "Get started" reads differently from "Start your
  journey" — but lorem hides both.
- **Translation**: Real English copy gives a realistic baseline for
  i18n. Lorem doesn't translate.
- **Realism**: A reviewer reading "Lorem ipsum" mentally checks out;
  a reviewer reading "Schedule a sync" stays engaged.

The wireframe is a CONVERSATION, not a SKELETON. Real copy makes
the conversation possible.

---

## Realistic placeholders by field type

| Field type | Realistic placeholder |
|---|---|
| Email | `you@example.com` |
| Password | `••••••••` (8 bullets) |
| Username | `@anna` or `anna_chen` |
| Display name | `Anna Chen` |
| Phone | `(555) 123-4567` (US) or `+44 20 1234 5678` (intl) |
| Address | `1234 Main St, Apt 4B` |
| City | `San Francisco` |
| State | `CA` |
| ZIP | `94107` |
| Country | `United States` |
| Credit card | `4242 4242 4242 4242` (Stripe test card) |
| CVC | `123` |
| Date (today) | `2026-05-16` or `May 16, 2026` |
| Date (future) | `2026-05-20` or `May 20, 2026` |
| URL | `https://example.com` |
| Search query | `Search products` (not "Search…") |
| Multi-line text | A real-feeling paragraph (3-4 lines) |

### Example

```html
<label class="wf-label">Email</label>
<input class="wf-input" type="email" placeholder="you@example.com">

<label class="wf-label">Display name</label>
<input class="wf-input" placeholder="Anna Chen">

<label class="wf-label">Address</label>
<input class="wf-input" placeholder="1234 Main St">

<label class="wf-label">ZIP</label>
<input class="wf-input" placeholder="94107">
```

For the WIREFRAME body content (the wf-text bars), the actual text
content is INVISIBLE (the bars are decorative). But the LABEL above
the input is visible — use real labels.

---

## Button labels — verb + object

Button labels should be VERB + OBJECT — the user's action made
specific:

| Generic (bad) | Specific (good) |
|---|---|
| Submit | Send invite |
| OK | Confirm payment |
| Cancel | Discard changes |
| Save | Save profile |
| Continue | Continue to payment |
| Next | Review and confirm |
| Done | Publish post |
| Yes | Delete this draft |

The user knows EXACTLY what tapping the button will do. No
mid-action surprise.

### Ghost button labels

For SECONDARY actions, the label often inverts the primary:

| Primary | Secondary |
|---|---|
| Save changes | Discard changes |
| Sign up | Log in instead |
| Continue | Go back |
| Delete | Cancel |

The pair frames the choice.

### Length guidance

| Button length | When |
|---|---|
| 1-2 words | Common actions (Save, Cancel, Send) |
| 3-4 words | Most cases (Save changes, Send invite) |
| 5+ words | When clarity is critical (I understand, delete this workspace) |

Keep button labels under 24 characters. Longer = the button wraps,
which looks awkward.

---

## Empty-state copy formulas

Empty-state copy has 3 elements: headline + sub-headline + CTA.

### First-run empty state

**Formula**: "No <noun> yet" + "Get started by <action>" + "<CTA verb> <noun>"

Examples:
- "No projects yet" / "Create your first to begin" / "Create project"
- "No teammates" / "Invite someone to collaborate" / "Invite teammate"
- "No saved items" / "Save items to revisit them" / "Browse items"

### Search empty state

**Formula**: "No results for "<query>"" + "<action suggestion>" + "<CTA verb>"

Examples:
- "No results for "xyz"" / "Try a different search or clear filters." / "Clear filters"
- "No matches" / "Adjust your filters or browse all items." / "Show all"

### Filter empty state

**Formula**: "No <noun> match these filters" + "<action suggestion>" + "<CTA verb>"

Examples:
- "No users match these filters" / "Try removing some filters or invite a new user." / "Clear filters"

### Completion empty state

**Formula**: "<celebration>" + "<context>" + (no CTA)

Examples:
- "Inbox zero" / "You've processed everything. Nice work." / (no CTA)
- "All done" / "Every task in this list is complete." / (no CTA)

---

## Error message conventions

Error messages have 4 elements: what + why + how to fix + (optional) link.

### Validation error (single field)

**Formula**: "<Field> <constraint>"

Examples:
- "Please enter a valid email address." (what + why combined)
- "Password must be at least 8 characters." (what + constraint)
- "Username is taken. Try anna_chen2 or pick another." (what + suggestion)

### Action error (operation failed)

**Formula**: "Could not <action>." + "<reason>" + "<recovery>"

Examples:
- "Could not save changes." / "Connection lost. Please try again."
- "Payment failed." / "Your card was declined. Try a different card."
- "Upload failed." / "File is too large (25MB). Max is 10MB."

### System error (something deeper broke)

**Formula**: "<Symptom>." + "(generic apology)" + "Try again or contact support."

Examples:
- "Something went wrong." / "We're working on it. Try again in a moment, or contact support@example.com."

### Tone

| DO | DON'T |
|---|---|
| "Could not save changes." | "ERROR: Save failed!" |
| "Please enter a valid email." | "INVALID INPUT" |
| "File is too large (25MB)." | "Bad file" |

Be SPECIFIC, BLAME THE SYSTEM (not the user), and OFFER A WAY
FORWARD.

---

## Success / confirmation messages

Success messages are SHORT — the user already knows their action
succeeded. Just confirm.

| Formula | Example |
|---|---|
| "<Action> <past tense>." | "Saved." / "Sent." / "Deleted." |
| "✓ <Action> <past tense>" | "✓ Profile saved" |
| "<Noun> <verb in past>" | "Invite sent." / "Order placed." |

Avoid unnecessary words: "Successfully saved your changes!" → just
"Saved." The user gets it.

For UNDO-able actions, append "Undo":

- "Message deleted. <Undo>"
- "5 items archived. <Undo>"
- "Comment removed. <Undo>"

The Undo link is the conventional last-chance affordance.

---

## Heading hierarchy and tone

| Level | Use for | Tone |
|---|---|---|
| h1 (32-48px) | Page title | Descriptive, sentence case |
| h2 (24-32px) | Major section | Descriptive |
| h3 (18-24px) | Sub-section / card title | Descriptive |
| h4 (16-18px) | Inline group | Descriptive |
| Eyebrow (12-13px, uppercase) | Category label | UPPERCASE TRACKED |

### Sentence case vs Title Case

| Sentence case (recommended) | Title Case |
|---|---|
| "Get started in seconds" | "Get Started in Seconds" |
| "Your projects" | "Your Projects" |
| "Choose a plan" | "Choose A Plan" |

Sentence case is friendlier and easier to read. Title Case is more
formal — use only when matching a brand voice that demands it.

### Tone by product type

| Product | Tone |
|---|---|
| Consumer (Instagram, Spotify) | Friendly, casual, contraction-heavy |
| Productivity (Notion, Linear) | Direct, no-nonsense, lowercase-y |
| Finance (Stripe, Plaid) | Clear, precise, full sentences |
| Healthcare | Reassuring, formal, sentence-case |
| Enterprise SaaS | Direct, helpful, no jargon |

For a wireframe, match the TARGET PRODUCT'S TONE. Don't ship a
playful copy in a serious B2B context.

---

## Microcopy length budgets

Different UI elements have different length constraints:

| Element | Max length | Why |
|---|---|---|
| Button label | 24 chars | Wraps awkwardly past 24 |
| Nav item | 16 chars | Wraps in horizontal nav |
| Card title | 40 chars | Truncates with ellipsis past 40 |
| Page title (h1) | 60 chars | One line on most viewports |
| Toast | 80 chars | Auto-dismisses in a few seconds; long text doesn't get read |
| Tooltip | 60 chars | Should be quick |
| Modal title | 50 chars | One line in modal width |
| Empty-state body | 120 chars | Two-line max |
| Form label | 24 chars | Stays on one line above the input |
| Form helper text | 80 chars | One-line hint below input |

For RECYCLED text (table cells, list items), give them realistic
LENGTH RANGES:

```html
<!-- in a feed, vary item lengths -->
<article class="wf-card">
  <h3 class="wf-text" data-wf-lines="1">A short title</h3>
</article>

<article class="wf-card">
  <h3 class="wf-text" data-wf-lines="2">A medium-length title that wraps to two lines</h3>
</article>

<article class="wf-card">
  <h3 class="wf-text" data-wf-lines="2">An especially long title that really stretches the layout to its limits</h3>
</article>
```

The variation REVEALS layout bugs (the longest title might overlap
the avatar).

---

## Internationalization considerations

English is COMPACT. Other languages take more space:

| Language | Avg length vs English |
|---|---|
| German | +30% |
| French | +20% |
| Spanish | +25% |
| Russian | +20% |
| Japanese | -50% (but tall characters) |
| Chinese | -50% (very compact) |
| Arabic | +20% (and right-to-left) |

For a wireframe targeting international audiences:

1. **Author with FAT English copy.** Use the longest realistic
   English copy — a wireframe that fits THIS will likely fit
   German.
2. **Allow text to wrap.** Don't force `white-space: nowrap` on
   labels and buttons.
3. **Test with `lang="de"`.** German is the longest Western
   European language; if it fits, French/Spanish will.
4. **For RTL languages (Arabic, Hebrew)**, mirror the entire layout.
   Use `dir="rtl"` on `<html>` and `start` / `end` logical
   properties instead of `left` / `right`.

Example using logical properties:

```css
/* BAD — breaks RTL */
.button { padding-left: 16px; }

/* GOOD — works in both LTR and RTL */
.button { padding-inline-start: 16px; }
```

The kit uses logical properties throughout (`padding-inline`,
`margin-inline`, `max-inline-size`) — it's RTL-ready by
construction.

---

## Sample data realism

When showing data in tables, charts, KPI cards — use REAL-LOOKING
data, not "100" or "$$$$".

### Numbers

| Bad | Good |
|---|---|
| "$$$$" | "$2,348.50" |
| "100" | "1,247" |
| "0%" | "12.4%" |
| "X/Y" | "42 of 234" |

Use realistic precision — currency to 2 decimals, percentages to 1
decimal, counts as whole numbers, dates in a consistent format.

### Names (avatars, contributors, users)

Use names that REPRESENT diverse cultures + genders:

| Names | Why |
|---|---|
| Anna Chen | Common Chinese-American name |
| Ben Park | Common Korean-American name |
| Diana Yu | Common Chinese-American name |
| Carlos Reyes | Common Hispanic name |
| Aisha Khan | Common South Asian name |
| Liam O'Brien | Common Irish name |
| Yuki Tanaka | Common Japanese name |

Avoid only using Anglo names ("John Smith", "Mary Jones") — your
wireframe should look like a real product's user base.

### Companies

Use believable company names (not "ACME Corp"):

- "Globex Industries"
- "Massive Dynamic"
- "Initech"
- "Wonka Industries"

OR use real well-known companies (with a "demo data" note):

- "Stripe", "Notion", "Linear", "Vercel"

### Locations

Use real cities — they read better than "City, ST":

- "San Francisco, CA"
- "Brooklyn, NY"
- "London, UK"
- "Tokyo, JP"

---

## Common copy bugs in wireframes

### Bug 1: "Title goes here" / "Lorem ipsum"

Replace with real-looking copy. See sections above.

### Bug 2: Inconsistent date formats

Pick ONE format per wireframe:

- "May 16, 2026" — long form, friendly.
- "May 16" — short form, current year implied.
- "2026-05-16" — ISO, technical contexts.
- "2h ago" — relative, recent activity.

Don't mix "May 16, 2026" with "2026-05-16" — pick one.

### Bug 3: Made-up jargon

Avoid "synergy", "ideate", "leverage" — they read as fake. Use the
target product's real domain vocabulary ("commit", "deploy",
"merge" for dev tools; "campaign", "audience", "convert" for
marketing).

### Bug 4: Marketing fluff in app UI

"Welcome to your dashboard! Let's get started on something amazing
together!" → "Dashboard" (app UI shouldn't sell, just inform).

### Bug 5: Question marks in button labels

"Save?" → "Save". A button performs an action; it doesn't ask a
question. Questions belong in MODAL TITLES, not button labels.
