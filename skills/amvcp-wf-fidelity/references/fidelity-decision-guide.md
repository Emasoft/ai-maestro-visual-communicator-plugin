# Fidelity decision guide — which stage to ship at

The 4-fidelity ramp (wireframe → low → mid → hi) is THE knob you
turn per audience and per phase. This file is the decision tree
for "which fidelity do I ship?".

## Table of contents

- [The 4 stages — recap](#the-4-stages--recap)
- [Decision matrix: audience × phase → fidelity](#decision-matrix-audience--phase--fidelity)
- [When to use `wireframe` fidelity](#when-to-use-wireframe-fidelity)
- [When to use `low` fidelity](#when-to-use-low-fidelity)
- [When to use `mid` fidelity](#when-to-use-mid-fidelity)
- [When to use `hi` fidelity](#when-to-use-hi-fidelity)
- [When to ship a fidelity RAMP (multiple side-by-side)](#when-to-ship-a-fidelity-ramp-multiple-side-by-side)
- [When to ship a fidelity SLIDER (interactive)](#when-to-ship-a-fidelity-slider-interactive)
- [The "promote to next fidelity" workflow](#the-promote-to-next-fidelity-workflow)
- [Anti-patterns to avoid](#anti-patterns-to-avoid)

---

## The 4 stages — recap

| Stage | Visual | Audience | Phase |
|---|---|---|---|
| `wireframe` | Pure grayscale | Internal designers, you | Exploring shape |
| `low` | Hint of accent | Designers + PMs | Early review |
| `mid` | Real accent + radius/shadow | PMs + execs | Design review |
| `hi` | Production-ready | Engineers + everyone | Handoff |

The stages are NOT phases of one project (the same project doesn't
linearly progress through all 4). They're TONE CHOICES per
audience.

---

## Decision matrix: audience × phase → fidelity

| Audience | Exploring | Reviewing | Confirming | Handing off |
|---|---|---|---|---|
| You alone | wireframe | wireframe | wireframe | n/a |
| Other designer | wireframe | low | mid | mid |
| PM | low | low | mid | hi |
| Exec | mid | mid | hi | hi |
| Engineer | mid | mid | hi | hi |
| External (customer, investor) | hi | hi | hi | hi |

Read this as: "I'm a designer SHOWING TO an exec; I'm in the
'reviewing' phase. → Ship at `mid`."

The rule of thumb: ship at the LOWEST fidelity the audience can
tolerate. Lower fidelity = clearer signal about WHAT'S BEING
ASKED ("react to the LAYOUT, not the COLOR").

---

## When to use `wireframe` fidelity

The default. Use for:

### Personal exploration

You're trying to figure out the SHAPE of a feature. No one else
will see it. Fidelity beyond grayscale is wasted effort.

### Pure-layout review

The reviewer should react to "is this the right layout?" — not
"is this the right color?" Wireframe-fidelity makes color invisible,
forcing layout-only feedback.

### Stakeholder protection

Some stakeholders see ANY color and start critiquing color choices.
Ship at `wireframe` to prevent the conversation from veering into
brand decisions before the underlying flow is right.

### Onboarding documentation

When teaching new team members the product's INFORMATION
ARCHITECTURE, wireframes are the right level — they show structure
without aesthetic baggage.

### Quick illustrations in technical docs

A wireframe IMAGE in a design-decision doc ("we considered Option
A above; here's Option B"). Wireframe-fi reads as "diagrammatic,
not final".

---

## When to use `low` fidelity

The "warm wireframe" — grayscale with a hint of accent. Use for:

### Mid-iteration design review

You've passed the wireframe-fi conversation. The shape is mostly
right. Now you're refining — and the audience deserves a HINT of
where color will land.

### Communicating "the primary action is here"

The accent re-emerges first on the primary CTA. A `low`-fidelity
screen shows ONE colored button — the most important action — and
nothing else. Stakeholders can confirm "yes, that's the primary
action" without arguing about color.

### Internal team check-ins

Showing your designer-peer where you are mid-week. `low` is enough
to convey progress; full hi-fi feels presumptuous for an unfinished
design.

---

## When to use `mid` fidelity

The "real but not final" stage. Use for:

### Design reviews with PMs / engineers

`mid` shows the real colors, the real radii, the real shadows. The
PM can react to the design as a STRANGER would; the engineer can
think about implementation.

### "Does this match our brand?" review

`mid` re-introduces the real accent + the real radius + the
real shadow — at THIS fidelity, brand consistency is judgeable.

### Slide decks for non-design audiences

A wireframe in a PM's exec deck looks LAZY ("you didn't finish
it?"). A `mid`-fidelity render looks PROFESSIONAL ("ah, this is a
real design").

### Stakeholder demos

Click-through demos for stakeholders should be at `mid`. They see
real design but the flow is still negotiable.

---

## When to use `hi` fidelity

Production-ready. Use for:

### Engineering handoff

The engineer needs to implement the EXACT colors, radii, shadows.
`hi` is the spec.

### Marketing screenshots

Final marketing materials should be at `hi` — full brand, full
polish. The audience is the public.

### App store screenshots

Apple / Google demand `hi` — they're showing the FINAL PRODUCT.

### Investor decks (when you have a real design)

Investors want to see what the product LOOKS like. `hi` shows
ambition.

### Sales demos

A sales rep showing the product to a customer should be at `hi` —
the customer is evaluating "would I buy this?".

---

## When to ship a fidelity RAMP (multiple side-by-side)

A 4-stage ramp (wireframe / low / mid / hi all side-by-side) is
useful for:

### Showing design progression

"Here's where we started (wireframe). Here's where we are now
(mid). Here's where we'll ship (hi)." — visualizes the design's
evolution in one image.

### Documentation pages explaining the fidelity model

A page about your design system. The ramp visually defines what
"low fidelity" vs "mid fidelity" actually MEAN.

### Onboarding for new designers

A new team member learns "this is what our design system looks like
at each stage of refinement".

### NOT for end-user-facing reports

End users see the same screen 4 times — looks redundant. Use a
slider instead.

---

## When to ship a fidelity SLIDER (interactive)

The slider lets the user PICK their fidelity. Useful for:

### Stakeholder-facing presentations

You give a demo. The exec wants to see the polished version; the
designer wants to see the wireframe. Slider lets both happen on the
same page.

### Click-through prototypes shared via link

The recipient can self-serve their preferred view.

### Documentation pages with interactive content

A "fidelity ramp" article where the reader can experiment.

### NOT for static slide decks

A slider needs interaction; in PDF/PNG it's just a screenshot of the
slider in one position. Use a ramp instead.

---

## The "promote to next fidelity" workflow

For a single design that evolves over multiple iterations:

### Iteration 1: ship at wireframe

You make the first pass. Layout is rough. Feedback focuses on
"is the SHAPE right?".

### Iteration 2: address layout feedback, still wireframe

Apply the layout feedback. Don't bump fidelity yet — get the
layout sign-off first.

### Iteration 3: promote to low

The layout is locked. Bump to `low` fidelity. Now feedback can
include "is the primary CTA placement right?" (the only colored
element).

### Iteration 4: promote to mid

The primary action is locked. Bump to `mid`. Now the audience can
react to full visual hierarchy.

### Iteration 5+: promote to hi

The visual hierarchy is locked. Bump to `hi`. Now the engineer
can implement.

This gives you a 4-iteration design pipeline aligned with the 4
fidelities. Each fidelity invites different feedback.

For a quick wireframe (one iteration, no review cycle), skip
straight to whatever fidelity matches the audience.

---

## Anti-patterns to avoid

### Ship at `hi` when you wanted layout feedback

Stakeholders see polished UI and react to colors, fonts, spacing
— never the LAYOUT. You wanted "is this the right flow?" but got
"can the gradient be more vibrant?".

**Fix**: Re-render at `wireframe` and re-share with the explicit
ask: "react to the layout, not the visual style."

### Ship at `wireframe` when you wanted brand feedback

The designer sees grayscale and doesn't know what brand colors
will look like. Can't react to brand harmony.

**Fix**: Render at `mid` or `hi` for brand reviews.

### Mix fidelities on the same page

Two screens at `wireframe` and one at `hi` — looks like the
designer ran out of time. Inconsistent.

**Fix**: Pick ONE fidelity per deliverable. For multi-fidelity
exploration, use the ramp.

### Use fidelity to hide unfinished work

"This part is still at `wireframe` because I haven't finished it"
— if it's not finished, don't show it. Stub it with an empty card
or annotation.

**Fix**: Either finish the design at the target fidelity, or mark
it explicitly: "(WIP — final visual TBD)".

### Bump fidelity AS the conversation evolves in real-time

Designer shows wireframe; reviewer asks about colors; designer
hot-bumps to hi mid-meeting. Now the reviewer's existing layout
feedback is lost in the new visual style.

**Fix**: Capture layout feedback FIRST. Then make a SEPARATE
revision at higher fidelity.

### Use `low` when you mean `mid`

`low` is "almost grey with one hint of accent". `mid` is "real
accent, real radius, real shadow". They're VERY different. Picking
the wrong one gives the wrong impression.

**Fix**: Use the decision matrix above. `low` = early review;
`mid` = design review.

### Ship at `hi` to investors when you don't actually have visual design

A polished-looking wireframe at `hi` LOOKS like a finished product.
If investors think you're further along than you are, they're
disappointed when they see the real thing.

**Fix**: Be HONEST about the design's state. Use `wireframe` if
you're still exploring. The conversation is better than the lie.

---

## Quick reference card

| Question | Answer |
|---|---|
| "I'm exploring on my own." | wireframe |
| "I want layout feedback." | wireframe |
| "I want primary-CTA feedback." | low |
| "I want full design feedback." | mid |
| "I'm doing engineering handoff." | hi |
| "I'm pitching to investors / customers / execs." | hi |
| "I'm in a multi-iteration review cycle." | start wireframe, promote per iteration |
| "I'm documenting the design system." | ramp (all 4) |
| "I'm sharing a clickable prototype." | slider (interactive) |
