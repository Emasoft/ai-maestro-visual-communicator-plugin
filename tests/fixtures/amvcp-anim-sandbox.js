/*!
 * ai-maestro-visual-communicator-plugin — animation sandbox.
 *
 * THE THING: "ONE transition shown in isolation, with LIVE duration +
 * easing tuners, a replay button, and an export of the tuned values."
 * It is the interactive *tuning tool* for a single transition — distinct
 * from the amvcp-animation siblings (foundation / entry-scroll /
 * ambient-hover / perf / handoffs), which author entrance / scroll /
 * loop motion on a real page. Here the motion is deliberately decoupled
 * from any layout so the author can dial in the timing in isolation and
 * hand the chosen `{duration, easing}` back to the agent.
 *
 * It sits on top of the Phase-1 engine (amvcp-designmd.js): every colour,
 * radius and motion default is read from the resolved --vc-* tokens via
 * `var(--vc-…, fallback)`, light + dark both, with NO hardcoded palette.
 * The engine is not a hard dependency of THIS module — the demo runs
 * standalone in the test harness; the tokens simply fall back.
 *
 * Two modes (project CLAUDE.md):
 *   - Interaction Design Mode = FIXED. The demo stage is stamped
 *     data-ve-id="anim-sandbox:<id>" + data-ve-type="anim-tuning"; the
 *     RUNTIME (amvcp-runtime.js) supplies selection · highlight ·
 *     triple-state feedback · comment-box with zero code here. This
 *     module NEVER injects selection / hover / highlight CSS, never adds
 *     a foreign selection / drag / export paradigm. The CONTROLS (slider,
 *     easing <select>, replay button) are <input>/<select>/<button> — the
 *     runtime explicitly skips interactive controls, so they never become
 *     selection atoms and never fight the browser's default behaviour.
 *     "Exportable" = the Export button rides the EXISTING selection
 *     channel: it calls window.veToggle({ … data:{duration, easing} }),
 *     pushing one kind:"element" entry into veSelection (the same array
 *     the agent reads back). No bespoke export wire is invented.
 *   - Graphic Style Mode = VARIABLE via DESIGN.md. The stage, demo
 *     element, control chrome and read-outs are themed entirely from
 *     --vc-* custom properties; a theme swap / hot-swap re-themes live.
 *
 * Declarative markup contract — the author writes ONE container with a
 * fenced sandbox spec, e.g.:
 *
 *   <div class="ve-anim-sandbox" data-ve-anim-sandbox>
 *   ```anim-sandbox
 *   demo: A card sliding up and fading in (transform + opacity)
 *   property: transform, opacity
 *   from: translateY(28px); opacity:0
 *   to: translateY(0); opacity:1
 *   duration: 420
 *   easings: standard, decel, accel, spring, linear, ease, ease-in-out
 *   ```
 *   </div>
 *
 * mountAll() scans every [data-ve-anim-sandbox], parses its fenced
 * `anim-sandbox` block, and renders a stage + duration slider + easing
 * <select> + Replay + Export.
 *
 * prefers-reduced-motion: the controls ALWAYS render (the author can
 * still tune values), but under `reduce` the transition is NOT auto-run
 * on slider input — it only runs on an EXPLICIT Replay (and even then the
 * stage marks data-ve-reduced so the page can choose to honour the OS
 * preference). Per amvcp-anim-foundation: substitute, never silently
 * disable; here the substitute for "auto-preview on every keystroke" is
 * "preview only when the user explicitly asks (Replay)".
 *
 * Dual export:
 *   - browser: `window.amvcpAnimSandbox = { … }`
 *   - Node:    `module.exports = { … }` (for the test harness)
 *
 * Style matches scripts/amvcp-component-variants.js — ES5-safe `var` /
 * function declarations, no arrow functions, no template literals, no
 * classes, no build step, no npm deps.
 *
 * Public API:
 *   parseSandboxSpec(text)               -> { ok, spec, errors }
 *   renderSandbox(spec, opts)            -> HTMLElement (root)
 *   mountSandbox(spec, container, opts)
 *   mountAll(root)                       -> number mounted
 *
 * No nested scrollbars: the stage and read-outs use overflow:visible; no
 * element gets max-height + overflow:auto. Wide content extends the
 * document's single scroll axis (no-nested-scrollbars rule).
 */
(function () {
  'use strict';

  // ── canonical easing presets ───────────────────────────────────────
  // The five DESIGN.md curves (amvcp-anim-foundation/easing-curves.md)
  // PLUS the two stock CSS keywords the platform ships. Each preset
  // resolves its timing-function through a --vc-easing-* token first, so
  // a DESIGN.md that re-tunes the curve flows through live; the literal
  // cubic-bezier is the fallback when no engine is present. `value` is
  // what gets WRITTEN onto the demo element and EXPORTED (a concrete
  // timing-function the agent can paste), so it is the resolved CSS, not
  // the var() wrapper.
  var EASING_PRESETS = {
    standard: {
      label: 'standard (ease-in-out)',
      cssVar: '--vc-easing-standard',
      value: 'cubic-bezier(0.2, 0, 0, 1)'
    },
    decel: {
      label: 'decel (arrival)',
      cssVar: '--vc-easing-decel',
      value: 'cubic-bezier(0, 0, 0, 1)'
    },
    accel: {
      label: 'accel (departure)',
      cssVar: '--vc-easing-accel',
      value: 'cubic-bezier(0.3, 0, 1, 1)'
    },
    spring: {
      label: 'spring (overshoot)',
      cssVar: '--vc-easing-spring',
      value: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    linear: {
      label: 'linear (loops)',
      cssVar: '--vc-easing-linear',
      value: 'linear'
    },
    ease: { label: 'ease', cssVar: null, value: 'ease' },
    'ease-in': { label: 'ease-in', cssVar: null, value: 'ease-in' },
    'ease-out': { label: 'ease-out', cssVar: null, value: 'ease-out' },
    'ease-in-out': { label: 'ease-in-out', cssVar: null, value: 'ease-in-out' }
  };

  var DEFAULT_EASINGS = ['standard', 'decel', 'accel', 'spring', 'linear'];

  // Duration slider bounds (ms). The author's `duration:` seeds the
  // initial value; the slider always spans this informative range.
  var DURATION_MIN = 0;
  var DURATION_MAX = 2000;
  var DURATION_STEP = 10;

  // ── spec parsing ────────────────────────────────────────────────────

  // The fenced block is a tiny `key: value` list (one per line). We do
  // NOT use YAML — the value side may contain its own colons (e.g.
  // `opacity:0`), so we split on the FIRST colon only, and the value is
  // taken verbatim. `from` / `to` are CSS declaration fragments applied
  // to the demo element's start / end state.
  function parseSandboxSpec(text) {
    var errors = [];
    if (typeof text !== 'string' || !text.length) {
      return { ok: false, spec: null, errors: ['empty anim-sandbox spec'] };
    }
    // Strip an optional ```anim-sandbox … ``` fence so the same parser
    // accepts either the fenced block (markup contract) or a bare body.
    var body = text;
    var fence = body.match(
      /```[ \t]*anim-sandbox[ \t]*\r?\n([\s\S]*?)\r?\n```/i);
    if (fence) { body = fence[1]; }

    var spec = {
      demo: '',
      property: 'transform, opacity',
      from: 'translateY(24px); opacity:0',
      to: 'translateY(0); opacity:1',
      duration: 420,
      easings: DEFAULT_EASINGS.slice(),
      id: null
    };

    var lines = body.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line || !line.replace(/\s+/g, '').length) { continue; }
      var ci = line.indexOf(':');
      if (ci < 0) {
        errors.push('line ' + (i + 1) + ' has no "key: value" — ignored: '
          + trim(line));
        continue;
      }
      var key = trim(line.slice(0, ci)).toLowerCase();
      var val = trim(line.slice(ci + 1));
      switch (key) {
        case 'demo': spec.demo = val; break;
        case 'property': spec.property = val; break;
        case 'from': spec.from = val; break;
        case 'to': spec.to = val; break;
        case 'id': spec.id = val; break;
        case 'duration':
          var d = parseInt(val, 10);
          if (isFinite(d) && d >= 0) { spec.duration = clampDuration(d); }
          else { errors.push('duration "' + val + '" is not a non-negative integer'); }
          break;
        case 'easings':
          var picks = [];
          var parts = val.split(',');
          for (var p = 0; p < parts.length; p++) {
            var name = trim(parts[p]).toLowerCase();
            if (!name) { continue; }
            if (EASING_PRESETS.hasOwnProperty(name)) { picks.push(name); }
            else { errors.push('unknown easing preset "' + name + '" — skipped'); }
          }
          if (picks.length) { spec.easings = picks; }
          break;
        default:
          errors.push('unknown key "' + key + '" — ignored');
      }
    }

    // A spec is usable as long as it has at least one easing preset.
    // `demo`, `from`, `to` all have sane defaults, so a near-empty block
    // still renders a working sandbox (fail-soft on optional fields).
    if (!spec.easings.length) {
      spec.easings = DEFAULT_EASINGS.slice();
    }
    return { ok: true, spec: spec, errors: errors };
  }

  // ── render ──────────────────────────────────────────────────────────

  var STYLE_ID = 'vc-anim-sandbox-style';
  var _idCounter = 0;

  function nextId() {
    _idCounter += 1;
    return 'anim-sandbox-' + _idCounter;
  }

  // One scoped, --vc-*-themed stylesheet for the GRAPHIC chrome only.
  // It carries NO selection / hover / highlight rule — the runtime owns
  // every selected/hover paint on the [data-ve-id] stage.
  function injectStyle() {
    if (typeof document === 'undefined') { return; }
    if (document.getElementById(STYLE_ID)) { return; }
    var css = [
      '.ve-anim-sandbox {',
      '  display: block;',
      '  border: 1px solid var(--vc-color-border, #e3dcc9);',
      '  background: var(--vc-color-surface, #fffefb);',
      '  border-radius: var(--vc-radius-lg, 12px);',
      '  padding: 20px 18px 16px;',
      '  margin: 18px 0;',
      '  color: var(--vc-color-content, #1f1a14);',
      '  font: 15px/1.5 var(--vc-font-body, system-ui, sans-serif);',
      '}',
      '.ve-anim-sandbox__caption {',
      '  font-size: 13px;',
      '  color: var(--vc-color-content-muted, #5b5343);',
      '  margin: 0 0 14px;',
      '}',
      // The stage is the SELECTION ATOM. It only re-paints (brightness/
      // glow via the runtime) on hover/selected — no page-side outline.
      '.ve-anim-sandbox__stage {',
      '  position: relative;',
      '  min-height: 132px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: var(--vc-color-surface-sunken, #f1ece1);',
      '  border-radius: var(--vc-radius-md, 8px);',
      '  padding: 22px;',
      '  overflow: visible;',
      '}',
      '.ve-anim-sandbox__demo {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  min-width: 124px;',
      '  min-height: 56px;',
      '  padding: 14px 20px;',
      '  border-radius: var(--vc-radius-md, 8px);',
      '  background: var(--vc-color-accent, #b8861f);',
      '  color: var(--vc-color-on-accent, #fffdf9);',
      '  font-weight: 600;',
      '  font-family: var(--vc-font-heading, system-ui, sans-serif);',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.12);',
      // transition-property/duration/timing-function are set inline per
      // the live tuned values; we declare none here so the inline style
      // is authoritative.
      '}',
      '.ve-anim-sandbox__controls {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  align-items: center;',
      '  gap: 16px 22px;',
      '  margin-top: 16px;',
      '}',
      '.ve-anim-sandbox__field {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 5px;',
      '  flex: 1 1 200px;',
      '}',
      '.ve-anim-sandbox__field--shrink { flex: 0 0 auto; }',
      '.ve-anim-sandbox__label {',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  letter-spacing: 0.02em;',
      '  text-transform: uppercase;',
      '  color: var(--vc-color-content-muted, #5b5343);',
      '}',
      '.ve-anim-sandbox__row {',
      '  display: flex; align-items: center; gap: 10px;',
      '}',
      '.ve-anim-sandbox__slider {',
      '  flex: 1 1 auto;',
      '  accent-color: var(--vc-color-accent, #b8861f);',
      '}',
      '.ve-anim-sandbox__readout {',
      '  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);',
      '  font-size: 13px;',
      '  font-variant-numeric: tabular-nums;',
      '  min-width: 4.5ch;',
      '  text-align: right;',
      '  color: var(--vc-color-content, #1f1a14);',
      '}',
      '.ve-anim-sandbox__select {',
      '  font: inherit;',
      '  padding: 6px 10px;',
      '  border-radius: var(--vc-radius-sm, 4px);',
      '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
      '  background: var(--vc-color-surface-raised, #fffdf8);',
      '  color: var(--vc-color-content, #1f1a14);',
      '}',
      '.ve-anim-sandbox__btn {',
      '  font: inherit;',
      '  font-weight: 600;',
      '  cursor: pointer;',
      '  padding: 8px 16px;',
      '  border-radius: var(--vc-radius-sm, 4px);',
      '  border: 1px solid var(--vc-color-border-strong, #c9bfa3);',
      '  background: var(--vc-color-surface-raised, #fffdf8);',
      '  color: var(--vc-color-content, #1f1a14);',
      '  transition: filter 120ms ease;',
      '}',
      '.ve-anim-sandbox__btn:hover { filter: brightness(0.96); }',
      '.ve-anim-sandbox__btn--primary {',
      '  background: var(--vc-color-accent, #b8861f);',
      '  color: var(--vc-color-on-accent, #fffdf9);',
      '  border-color: var(--vc-color-accent, #b8861f);',
      '}',
      '.ve-anim-sandbox__export-note {',
      '  flex: 1 1 100%;',
      '  margin: 4px 0 0;',
      '  font-size: 12px;',
      '  color: var(--vc-color-content-subtle, #8a8170);',
      '}',
      // Reduced-motion: the page may choose to honour the OS preference.
      // The module DOES run the transition on explicit Replay even under
      // reduce (the author asked for it), but a page that wants a hard
      // gate can target this attribute. We deliberately do NOT set
      // `transition: none` ourselves — substitute, never disable.
      '@media (prefers-reduced-motion: reduce) {',
      '  .ve-anim-sandbox[data-ve-reduced="1"] .ve-anim-sandbox__caption::after {',
      '    content: " — reduced-motion: preview on Replay only";',
      '    color: var(--vc-color-content-subtle, #8a8170);',
      '  }',
      '}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  function resolveEasingValue(name) {
    var preset = EASING_PRESETS[name] || EASING_PRESETS.standard;
    // Prefer the live --vc-easing-* token (so a DESIGN.md re-tune flows
    // through); fall back to the literal cubic-bezier when no engine /
    // token is present. We resolve the token to a concrete string so the
    // EXPORTED value is a paste-ready timing-function, not a var() ref.
    if (preset.cssVar && typeof window !== 'undefined'
      && typeof getComputedStyle === 'function') {
      var resolved = trim(getComputedStyle(document.documentElement)
        .getPropertyValue(preset.cssVar));
      if (resolved) { return resolved; }
    }
    return preset.value;
  }

  function reducedMotion() {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Apply the START state instantly (no transition), force a reflow, then
  // apply the END state WITH the tuned transition so the browser tweens.
  function runTransition(stage) {
    var demo = stage.__demo;
    var spec = stage.__spec;
    var duration = stage.__duration;
    var easingName = stage.__easing;
    var easingValue = resolveEasingValue(easingName);

    // 1. snap to START with transition disabled.
    demo.style.transition = 'none';
    applyDecls(demo, spec.from);
    // 2. force reflow so the START state is committed before we tween.
    // Reading offsetWidth flushes pending style/layout.
    /* eslint-disable-next-line no-unused-expressions */
    demo.offsetWidth;
    // 3. arm the tuned transition and apply the END state.
    demo.style.transitionProperty = spec.property;
    demo.style.transitionDuration = duration + 'ms';
    demo.style.transitionTimingFunction = easingValue;
    // class toggle is observable by tests (we flip a marker class around
    // the END application so a MutationObserver / class check can see a
    // replay happened even for a 0ms / identical-value transition).
    demo.classList.remove('ve-anim-sandbox__demo--playing');
    /* eslint-disable-next-line no-unused-expressions */
    demo.offsetWidth;
    demo.classList.add('ve-anim-sandbox__demo--playing');
    applyDecls(demo, spec.to);
    stage.__playCount = (stage.__playCount || 0) + 1;
    stage.setAttribute('data-ve-play-count', String(stage.__playCount));
  }

  function renderSandbox(spec, opts) {
    if (!spec || typeof spec !== 'object') {
      throw new Error('renderSandbox: spec object required');
    }
    opts = opts || {};
    injectStyle();
    var sid = spec.id || opts.id || nextId();

    var root = el('div', 've-anim-sandbox');
    root.setAttribute('data-ve-anim-sandbox', '1');
    if (reducedMotion()) { root.setAttribute('data-ve-reduced', '1'); }

    // Caption.
    if (spec.demo) {
      var cap = el('p', 've-anim-sandbox__caption');
      cap.textContent = spec.demo;
      root.appendChild(cap);
    }

    // Stage — THE selection atom (data-ve-id / data-ve-type). The runtime
    // styles selection/hover/triple-state; we add NO such CSS here.
    var stage = el('div', 've-anim-sandbox__stage');
    stage.setAttribute('data-ve-id', 'anim-sandbox:' + sid);
    stage.setAttribute('data-ve-type', 'anim-tuning');
    stage.setAttribute('data-ve-label',
      'Animation sandbox — ' + (spec.demo || 'transition'));

    var demo = el('div', 've-anim-sandbox__demo');
    demo.textContent = opts.demoText || 'demo';
    // seed the END state so the element is at-rest before the first run.
    applyDecls(demo, spec.to);
    stage.appendChild(demo);
    root.appendChild(stage);

    // wire state onto the stage so runTransition is self-contained.
    stage.__demo = demo;
    stage.__spec = spec;
    stage.__duration = clampDuration(spec.duration);
    stage.__easing = spec.easings[0];
    stage.__playCount = 0;

    // Controls.
    var controls = el('div', 've-anim-sandbox__controls');

    // — duration field (slider + live read-out)
    var durField = el('div', 've-anim-sandbox__field');
    var durLabel = el('label', 've-anim-sandbox__label');
    durLabel.textContent = 'Duration';
    durLabel.setAttribute('for', 'vc-as-dur-' + sid);
    var durRow = el('div', 've-anim-sandbox__row');
    var slider = el('input', 've-anim-sandbox__slider');
    slider.type = 'range';
    slider.id = 'vc-as-dur-' + sid;
    slider.min = String(DURATION_MIN);
    slider.max = String(DURATION_MAX);
    slider.step = String(DURATION_STEP);
    slider.value = String(stage.__duration);
    slider.setAttribute('aria-label', 'Transition duration in milliseconds');
    var durReadout = el('span', 've-anim-sandbox__readout');
    durReadout.textContent = stage.__duration + 'ms';
    durRow.appendChild(slider);
    durRow.appendChild(durReadout);
    durField.appendChild(durLabel);
    durField.appendChild(durRow);
    controls.appendChild(durField);

    // — easing field (<select> of presets)
    var easeField = el('div', 've-anim-sandbox__field ve-anim-sandbox__field--shrink');
    var easeLabel = el('label', 've-anim-sandbox__label');
    easeLabel.textContent = 'Easing';
    easeLabel.setAttribute('for', 'vc-as-ease-' + sid);
    var select = el('select', 've-anim-sandbox__select');
    select.id = 'vc-as-ease-' + sid;
    select.setAttribute('aria-label', 'Transition easing preset');
    for (var e = 0; e < spec.easings.length; e++) {
      var name = spec.easings[e];
      var preset = EASING_PRESETS[name];
      if (!preset) { continue; }
      var opt = el('option');
      opt.value = name;
      opt.textContent = preset.label;
      select.appendChild(opt);
    }
    select.value = stage.__easing;
    easeField.appendChild(easeLabel);
    easeField.appendChild(select);
    controls.appendChild(easeField);

    // — buttons (Replay + Export)
    var btnField = el('div', 've-anim-sandbox__field ve-anim-sandbox__field--shrink');
    var btnLabel = el('span', 've-anim-sandbox__label');
    btnLabel.textContent = 'Actions';
    var btnRow = el('div', 've-anim-sandbox__row');
    var replayBtn = el('button', 've-anim-sandbox__btn');
    replayBtn.type = 'button';
    replayBtn.textContent = 'Replay';
    var exportBtn = el('button', 've-anim-sandbox__btn ve-anim-sandbox__btn--primary');
    exportBtn.type = 'button';
    exportBtn.textContent = 'Export values';
    btnRow.appendChild(replayBtn);
    btnRow.appendChild(exportBtn);
    btnField.appendChild(btnLabel);
    btnField.appendChild(btnRow);
    controls.appendChild(btnField);

    var note = el('p', 've-anim-sandbox__export-note');
    note.textContent = 'Export pushes the tuned {duration, easing} into the '
      + 'selection so the agent can apply it.';
    controls.appendChild(note);

    root.appendChild(controls);

    // ── interactions ──────────────────────────────────────────────────
    // The reduced-motion gate is re-read LIVE in each handler (not cached
    // at render time) so a runtime OS-preference flip is honoured without
    // a re-render — matching amvcp-anim-foundation's live-OS-preference
    // contract. matchMedia is a cheap synchronous check.

    // Slider input: update read-out + tuned duration, and live-preview
    // the transition — UNLESS reduced-motion, where preview is gated to
    // explicit Replay (substitute, not disable).
    slider.addEventListener('input', function () {
      var v = clampDuration(parseInt(slider.value, 10) || 0);
      stage.__duration = v;
      durReadout.textContent = v + 'ms';
      if (!reducedMotion()) { runTransition(stage); }
    });

    select.addEventListener('change', function () {
      stage.__easing = select.value;
      if (!reducedMotion()) { runTransition(stage); }
    });

    replayBtn.addEventListener('click', function () {
      // Explicit user request — always run, even under reduced-motion.
      runTransition(stage);
    });

    exportBtn.addEventListener('click', function () {
      exportTuning(stage, spec, sid);
    });

    return root;
  }

  // Push the tuned values onto the EXISTING selection channel. window.
  // veToggle(payload) (exposed by amvcp-runtime.js) appends a
  // kind:"element" entry to veSelection — the same array the agent reads
  // back on submit. We carry the concrete tuned values in `data` so the
  // agent can paste them directly. We do NOT invent a new wire kind.
  function exportTuning(stage, spec, sid) {
    var easingName = stage.__easing;
    var easingValue = resolveEasingValue(easingName);
    var payload = {
      id: 'anim-sandbox:' + sid,
      type: 'anim-tuning',
      label: 'Animation tuning — ' + stage.__duration + 'ms / ' + easingName,
      data: {
        kind: 'anim-tuning',
        duration: stage.__duration,
        durationCss: stage.__duration + 'ms',
        easing: easingName,
        easingValue: easingValue,
        property: spec.property,
        from: spec.from,
        to: spec.to
      }
    };
    if (typeof window !== 'undefined' && typeof window.veToggle === 'function') {
      window.veToggle(payload);
    }
    // Reflect the export on the stage so a test (and the user) can see it
    // happened even when the runtime is not present (standalone harness).
    stage.setAttribute('data-ve-exported', '1');
    stage.__lastExport = payload;
    return payload;
  }

  function mountSandbox(spec, container, opts) {
    if (!container) { throw new Error('mountSandbox: container required'); }
    var root = renderSandbox(spec, opts);
    container.appendChild(root);
    return root;
  }

  // Scan a subtree for declarative [data-ve-anim-sandbox] containers that
  // carry a fenced `anim-sandbox` spec as text, parse + render each, and
  // REPLACE the raw fenced text with the rendered sandbox. Idempotent —
  // a container already rendered (carries a .ve-anim-sandbox__stage) is
  // skipped.
  function mountAll(root) {
    if (typeof document === 'undefined') { return 0; }
    root = root || document;
    var hosts = root.querySelectorAll('[data-ve-anim-sandbox]');
    var mounted = 0;
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (host.querySelector('.ve-anim-sandbox__stage')) { continue; }
      var parsed = parseSandboxSpec(host.textContent || '');
      if (!parsed.ok) { continue; }
      // The host's own id attribute is the stable atom/export id, so a
      // page-authored `<div id="card-slide">` becomes
      // data-ve-id="anim-sandbox:card-slide" (the `id:` spec line still
      // overrides it). Without this, mountAll would mint an opaque
      // auto-id and the agent couldn't tie the export back to the markup.
      var hostId = host.getAttribute('id');
      // clear the raw spec text, then render in place.
      host.textContent = '';
      var rendered = renderSandbox(parsed.spec, hostId ? { id: hostId } : {});
      // unwrap one level: the host itself IS the sandbox shell, so move
      // the rendered children up rather than nesting .ve-anim-sandbox
      // inside [data-ve-anim-sandbox]. We copy the rendered root's
      // class + attributes onto the host for a single clean element.
      host.className = mergeClass(host.className, rendered.className);
      copyDataAttrs(rendered, host);
      while (rendered.firstChild) { host.appendChild(rendered.firstChild); }
      // re-bind the stage state (the closures were created against the
      // detached `rendered`; the stage node itself moved, so its __*
      // fields and listeners came with it — DOM moves preserve both).
      mounted += 1;
    }
    return mounted;
  }

  // ── small DOM helpers (mirror amvcp-component-variants.js) ───────────

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    return node;
  }

  function trim(s) {
    return String(s == null ? '' : s).replace(/^\s+|\s+$/g, '');
  }

  function clampDuration(d) {
    if (!isFinite(d)) { return 420; }
    if (d < DURATION_MIN) { return DURATION_MIN; }
    if (d > DURATION_MAX) { return DURATION_MAX; }
    return d;
  }

  // Apply a CSS-declaration fragment ("translateY(0); opacity:1") to an
  // element's inline style. We parse on ';' then ':' so the author writes
  // ordinary CSS. transform is special-cased: a bare function like
  // `translateY(0)` with no `prop:` is treated as a transform value.
  function applyDecls(node, fragment) {
    var decls = String(fragment || '').split(';');
    for (var i = 0; i < decls.length; i++) {
      var d = trim(decls[i]);
      if (!d) { continue; }
      var ci = d.indexOf(':');
      if (ci < 0) {
        // bare value → assume it's a transform function list.
        node.style.transform = d;
        continue;
      }
      var prop = trim(d.slice(0, ci));
      var val = trim(d.slice(ci + 1));
      if (!prop) { continue; }
      node.style.setProperty(prop, val);
    }
  }

  function mergeClass(a, b) {
    var seen = {};
    var out = [];
    var all = (trim(a) + ' ' + trim(b)).split(/\s+/);
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (c && !seen[c]) { seen[c] = 1; out.push(c); }
    }
    return out.join(' ');
  }

  function copyDataAttrs(from, to) {
    if (!from.attributes) { return; }
    for (var i = 0; i < from.attributes.length; i++) {
      var at = from.attributes[i];
      if (at.name.indexOf('data-ve-') === 0 && !to.hasAttribute(at.name)) {
        to.setAttribute(at.name, at.value);
      }
    }
  }

  // ── auto-init ────────────────────────────────────────────────────────
  // Render every declarative sandbox on the page once the DOM is ready.
  // A page that wants manual control sets window.__veAnimSandboxManual.
  function autoInit() {
    if (typeof window !== 'undefined' && window.__veAnimSandboxManual) { return; }
    mountAll(document);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }

  // ── export ───────────────────────────────────────────────────────────

  var api = {
    parseSandboxSpec: parseSandboxSpec,
    renderSandbox: renderSandbox,
    mountSandbox: mountSandbox,
    mountAll: mountAll,
    EASING_PRESETS: EASING_PRESETS
  };

  if (typeof window !== 'undefined') {
    window.amvcpAnimSandbox = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
