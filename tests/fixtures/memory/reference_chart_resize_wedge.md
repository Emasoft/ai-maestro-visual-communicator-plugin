---
name: reference_chart_resize_wedge
description: "chart looks frozen / stops resizing after switching the page theme"
metadata:
  node_type: memory
  type: reference
---
Live theme flips re-create the chart canvas, so the Chart.js instance must be
destroyed and re-instantiated against the NEW canvas node — a plain
`chart.update()` keeps observing the detached element and the chart wedges.[^1]

## Notes and lessons learned
[^1]: [ocd:2026-05-25 lmd:2026-05-25] earlier this page said "call
  chart.resize() after the flip" — wrong: the canvas node is replaced during
  the re-theme, so the old instance's ResizeObserver watches a detached
  element. Lesson: verify which DOM node an instance is bound to before tuning
  its options.
