# Reference test cases

## Table of Contents

- [Test functions](#test-functions)
- [Fixture](#fixture)

## Test functions

See `tests/scripts/test-form-inputs.js`:

- `form_inputs_all_init` — every kind mounts (radio, multi, numeric,
  date, color, rank) with correct `data-ve-type`.
- `form_inputs_radio_change` — click fires `ve-form-change`, persists
  to LS.
- `form_inputs_multi_change` — checkbox toggles emit ARRAY payloads.
- `form_inputs_numeric_change` — value + unit changes emit
  `{value, unit}`.
- `form_inputs_date_color_change` — native inputs fire; hex readout
  updates live with color.
- `form_inputs_rank_drag` — drag last → first emits the new order.
- `form_inputs_persistence` — radio default is overridden by
  LS-saved value after reload.
- `form_inputs_theme_tokens` — light → dark flips card / border /
  hex color via `--vc-*`.
- `form_inputs_fail_fast_no_id` — missing `data-ve-id` paints
  `[form-input error]` and renders nothing.
- `form_inputs_slider_change` — slider renders ticks; input event
  fires; LS persists.
- `form_inputs_toggle_change` — toggle flips on click + Space;
  caption + LS update.
- `form_inputs_rating_change` — rating click fills N + emits N;
  clear empties + emits 0.
- `form_inputs_card_picker` — card-picker renders rich cards; click
  swaps selection + emits.
- `form_inputs_tag_input` — type+Enter adds; click suggestion adds;
  ✕ removes.
- `form_inputs_text_pattern` — regex pattern flags invalid + clears
  on valid; event carries `.valid`.
- `form_inputs_textarea_counter` — counter formats N/max and
  near-limit flag past 90%.
- `form_inputs_url_validation` — preview link visible only when
  URL is valid; honours `allowedProtocols`.
- `form_inputs_tree_picker` — mounts branches/leaves, caret toggles
  open/closed, leaf click selects + emits.
- `form_inputs_tree_persistence` — collapsing a branch persists
  across reload via the `:expanded` LS key.
- `form_inputs_password` — meter colors bars by strength; toggle
  flips type + aria.
- `form_inputs_currency` — renders symbol + Intl preview; typing +
  currency switch both emit.
- `form_inputs_gallery` — gallery picker mounts cards; click swaps
  selection + emits.
- `form_inputs_tier_list` — tier-list mounts S-D + unranked; drag
  moves item between buckets + emits assignment map.

## Fixture

The fixture is `tests/fixtures/form-inputs-fixture.html` (one of
each widget kind).
