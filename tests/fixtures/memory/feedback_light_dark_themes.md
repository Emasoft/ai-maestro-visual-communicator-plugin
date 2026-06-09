---
name: feedback_light_dark_themes
description: "which theme should the page use / user complained page only has one theme"
metadata:
  node_type: memory
  type: feedback
---
Every generated visual must ship BOTH light and dark themes; a single-theme
page is a correctness defect, not a style choice.

**Why:** the user reviews pages in whichever OS appearance is active and
flagged single-theme pages as broken.

**How to apply:** wire both palettes through DESIGN.md tokens and verify the
page under each theme before delivering. See [[reference_chart_resize_wedge]]
for a live-flip gotcha.
