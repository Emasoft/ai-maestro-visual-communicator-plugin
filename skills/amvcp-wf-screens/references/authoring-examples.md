# Authoring examples — spec → multi-screen wireframe

## Table of Contents

- [Example — wireframe a 3-screen checkout flow](#example--wireframe-a-3-screen-checkout-flow)
- [Example — translate a written spec into a wireframe](#example--translate-a-written-spec-into-a-wireframe)

Worked input → output examples for the multi-screen wireframe skill. Each
shows the user's request and the wireframe structure it maps to.

## Example — wireframe a 3-screen checkout flow

**Input:** "wireframe a 3-screen checkout flow."

**Output:** one `.wf-root` with `data-wf-nav="paged"` containing three
`.wf-screen` blocks (`screen-cart`, `screen-payment`, `screen-confirm`);
Continue/Back anchors wire forward/back. See `ecommerce-screens.md` for the
per-screen patterns and `clickable-prototype.md` for the linear-flow shape.

## Example — translate a written spec into a wireframe

**Input:** "translate this spec into a wireframe."

**Output:** the 5-step `wireframe-from-spec.md` workflow — identify screens →
map archetypes → pick blocks → wire navigation → add states (loading / error /
empty).
