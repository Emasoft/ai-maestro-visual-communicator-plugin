---
name: beta-component
description: one widget's component page
metadata:
  node_type: memory
  tier: component
  type: reference
---

The widget component page. It receives governing rules from the hub and the
aspect, and never re-copies them.

Governed by [[alpha-hub]] and constrained by [[gamma-aspect]].

The widget retries 3× then fails — verify the constant against the source.

## Notes and lessons learned
