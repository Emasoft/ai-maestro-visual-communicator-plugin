---
name: project_selection_roundtrip
description: "how does the user's selection get back to the agent / comment box never reaching the agent"
metadata:
  node_type: memory
  type: project
---
The universal edit channel is the selection round-trip: the page's pick layer
feeds `amvcp-select.py`, which emits a `{selections:[…]}` JSON payload the
agent reads — per-element comment threads ride the same channel.

**Why:** every element is editable-via-comments by design; reinventing a
per-skill channel would fork the protocol.

**How to apply:** when a comment or selection "never arrives", check the
queue dir the test server wipes between suites before suspecting the page.
