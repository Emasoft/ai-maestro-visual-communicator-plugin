// test-anim-sandbox.js
//
// Dev-browser suite for scripts/amvcp-anim-sandbox.js (backlog #07,
// TRDD-1627a698) — the animation sandbox: ONE transition shown in
// isolation with live duration/easing tuners, a Replay button, and an
// export of the tuned values that rides the EXISTING selection channel.
//
// The fixture loads amvcp-designmd.js → amvcp-runtime.js →
// amvcp-anim-sandbox.js. The runtime auto-inits on DOMContentLoaded and
// exposes window.veToggle (push a kind:"element" entry into veSelection)
// and the read-only test hook window.amvcpRuntime.buildSubmissionPayload
// (returns the canonical submit payload WITHOUT firing the POST). The
// sandbox module auto-mounts every declarative [data-ve-anim-sandbox]
// fenced spec.
//
// Coverage (5 tests):
//   1  renders stage + controls (slider + easing select + replay +
//      export) from the declarative fenced spec
//   2  slider input updates the demo's computed transition-duration
//   3  easing pick updates the demo's computed transition-timing-function
//   4  Replay re-triggers the transition (play-count + class observable)
//   5  Export payload in veSelection carries the tuned {duration, easing}
//      AND interactions add NO new DOM elements + a theme flip re-paints
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>

const FIXTURE = "http://127.0.0.1:8767/anim-sandbox-fixture.html";

const results = [];
function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

// Load the fixture and wait until the module + runtime are installed AND
// the declarative sandbox has auto-mounted (its stage exists).
async function setup(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() =>
      typeof window.amvcpAnimSandbox === 'object'
      && typeof window.amvcpAnimSandbox.mountAll === 'function'
      && !!document.querySelector('.ve-anim-sandbox__stage'));
    if (ready) { return { ok: true }; }
    await page.waitForTimeout(80);
  }
  return { ok: false, error: 'sandbox never mounted (module/runtime not ready?)' };
}

// ── Tests ───────────────────────────────────────────────────────────

async function testRendersStageAndControls(page) {
  // 1 — the fenced [data-ve-anim-sandbox] spec rendered a stage (the
  // selection atom) + a duration slider + an easing <select> + Replay +
  // Export. The caption text comes from the spec's `demo:` line.
  const s = await setup(page);
  if (!s.ok) {
    record('anim_sandbox_renders_stage_and_controls', 'FAIL',
      'renders stage + controls from the declarative spec', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('sandbox-card');
    const stage = host.querySelector('.ve-anim-sandbox__stage');
    const slider = host.querySelector('input[type="range"].ve-anim-sandbox__slider');
    const select = host.querySelector('select.ve-anim-sandbox__select');
    const demo = host.querySelector('.ve-anim-sandbox__demo');
    const caption = host.querySelector('.ve-anim-sandbox__caption');
    const btns = host.querySelectorAll('button.ve-anim-sandbox__btn');
    const labels = [];
    for (let i = 0; i < btns.length; i++) { labels.push(btns[i].textContent.trim()); }
    const opts = [];
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        opts.push(select.options[i].value);
      }
    }
    return {
      stageAtom: !!stage
        && stage.getAttribute('data-ve-id') === 'anim-sandbox:sandbox-card'
        && stage.getAttribute('data-ve-type') === 'anim-tuning',
      hasSlider: !!slider,
      sliderStart: slider ? slider.value : null,
      hasDemo: !!demo,
      captionFromSpec: caption
        ? caption.textContent.indexOf('sliding up and fading in') !== -1
        : false,
      btnLabels: labels,
      easingOpts: opts
    };
  });
  const ok = res.stageAtom && res.hasSlider && res.hasDemo
    && res.captionFromSpec
    && res.sliderStart === '420'
    && res.btnLabels.indexOf('Replay') !== -1
    && res.btnLabels.indexOf('Export values') !== -1
    && res.easingOpts.indexOf('spring') !== -1
    && res.easingOpts.indexOf('decel') !== -1;
  record('anim_sandbox_renders_stage_and_controls', ok ? 'PASS' : 'FAIL',
    'fenced spec → stage atom + duration slider + easing select + Replay/Export',
    JSON.stringify(res));
}

async function testSliderUpdatesDuration(page) {
  // 2 — moving the duration slider updates the demo element's INLINE
  // transition-duration (read via getComputedStyle → transitionDuration).
  const s = await setup(page);
  if (!s.ok) {
    record('anim_sandbox_slider_updates_duration', 'FAIL',
      'slider input updates computed transition-duration', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('sandbox-card');
    const slider = host.querySelector('input[type="range"].ve-anim-sandbox__slider');
    const demo = host.querySelector('.ve-anim-sandbox__demo');
    const readout = host.querySelector('.ve-anim-sandbox__readout');
    // Set the slider to 880ms and dispatch a real 'input' event.
    slider.value = '880';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    return {
      computedDuration: getComputedStyle(demo).transitionDuration,
      readout: readout ? readout.textContent.trim() : null,
      inlineDuration: demo.style.transitionDuration
    };
  });
  // Chromium normalizes 880ms → "0.88s".
  const ok = (res.computedDuration === '0.88s' || res.computedDuration === '880ms')
    && res.readout === '880ms'
    && res.inlineDuration === '880ms';
  record('anim_sandbox_slider_updates_duration', ok ? 'PASS' : 'FAIL',
    'slider input → demo transition-duration becomes 880ms (computed 0.88s)',
    JSON.stringify(res));
}

async function testEasingUpdatesTimingFunction(page) {
  // 3 — picking a different easing preset updates the demo's computed
  // transition-timing-function. We pick "spring" → the overshoot
  // cubic-bezier (0.34, 1.56, 0.64, 1), resolved live through the
  // --vc-easing-spring DESIGN.md token.
  const s = await setup(page);
  if (!s.ok) {
    record('anim_sandbox_easing_updates_timing_function', 'FAIL',
      'easing pick updates computed transition-timing-function', s.error);
    return;
  }
  const res = await page.evaluate(() => {
    const host = document.getElementById('sandbox-card');
    const select = host.querySelector('select.ve-anim-sandbox__select');
    const demo = host.querySelector('.ve-anim-sandbox__demo');
    select.value = 'spring';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      computedTiming: getComputedStyle(demo).transitionTimingFunction,
      inlineTiming: demo.style.transitionTimingFunction
    };
  });
  // The spring curve — Chromium echoes the cubic-bezier verbatim. The
  // token value in the fixture's DESIGN.md is cubic-bezier(0.34,1.56,0.64,1).
  const looksSpring = (s) => typeof s === 'string'
    && s.indexOf('cubic-bezier') !== -1
    && s.indexOf('1.56') !== -1;
  const ok = looksSpring(res.computedTiming) && looksSpring(res.inlineTiming);
  record('anim_sandbox_easing_updates_timing_function', ok ? 'PASS' : 'FAIL',
    'easing → spring updates transition-timing-function to the overshoot curve',
    JSON.stringify(res));
}

async function testReplayRetriggersTransition(page) {
  // 4 — clicking Replay re-runs the transition: the demo's play-count
  // attribute on the stage increments and the --playing marker class is
  // (re)applied. Two replays bump the count by 2 from its post-setup
  // baseline.
  const s = await setup(page);
  if (!s.ok) {
    record('anim_sandbox_replay_retriggers_transition', 'FAIL',
      'Replay re-triggers the transition (class toggles observable)', s.error);
    return;
  }
  const res = await page.evaluate(async () => {
    const host = document.getElementById('sandbox-card');
    const stage = host.querySelector('.ve-anim-sandbox__stage');
    const demo = host.querySelector('.ve-anim-sandbox__demo');
    const btns = host.querySelectorAll('button.ve-anim-sandbox__btn');
    let replay = null;
    for (let i = 0; i < btns.length; i++) {
      if (btns[i].textContent.trim() === 'Replay') { replay = btns[i]; }
    }
    const before = parseInt(stage.getAttribute('data-ve-play-count') || '0', 10);
    // Observe that the --playing class is removed-then-added on a replay.
    let classToggled = false;
    const mo = new MutationObserver((recs) => {
      for (let i = 0; i < recs.length; i++) {
        if (recs[i].attributeName === 'class'
          && demo.classList.contains('ve-anim-sandbox__demo--playing')) {
          classToggled = true;
        }
      }
    });
    mo.observe(demo, { attributes: true, attributeFilter: ['class'] });
    replay.click();
    await new Promise(r => setTimeout(r, 30));
    replay.click();
    await new Promise(r => setTimeout(r, 30));
    mo.disconnect();
    const after = parseInt(stage.getAttribute('data-ve-play-count') || '0', 10);
    return {
      before, after,
      classPlaying: demo.classList.contains('ve-anim-sandbox__demo--playing'),
      classToggled
    };
  });
  const ok = res.after === res.before + 2
    && res.classPlaying === true
    && res.classToggled === true;
  record('anim_sandbox_replay_retriggers_transition', ok ? 'PASS' : 'FAIL',
    'two Replay clicks bump play-count by 2 and re-apply the --playing class',
    JSON.stringify(res));
}

async function testExportPayloadAndNoNewElementsAndTheme(page) {
  // 5 — (a) Export rides the EXISTING selection channel: clicking Export
  // calls window.veToggle, pushing a kind:"element" entry into
  // veSelection whose data carries the tuned {duration, easing}; verified
  // via the read-only window.amvcpRuntime.buildSubmissionPayload hook.
  // (b) tuning interactions add NO new DOM elements to the stage atom.
  // (c) a live data-ve-theme flip re-paints the chrome (dark surface).
  const s = await setup(page);
  if (!s.ok) {
    record('anim_sandbox_export_payload_no_new_els_theme', 'FAIL',
      'export rides selection channel; no new els; theme flip re-paints', s.error);
    return;
  }
  const res = await page.evaluate(async () => {
    const host = document.getElementById('sandbox-card');
    const stage = host.querySelector('.ve-anim-sandbox__stage');
    const slider = host.querySelector('input[type="range"].ve-anim-sandbox__slider');
    const select = host.querySelector('select.ve-anim-sandbox__select');
    const btns = host.querySelectorAll('button.ve-anim-sandbox__btn');
    let exportBtn = null;
    for (let i = 0; i < btns.length; i++) {
      if (btns[i].textContent.trim() === 'Export values') { exportBtn = btns[i]; }
    }

    // Count the stage's descendant elements BEFORE any tuning interaction.
    const childCountBefore = stage.querySelectorAll('*').length;

    // Tune: 640ms + decel, then export.
    slider.value = '640';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    select.value = 'decel';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    exportBtn.click();

    // (a) Read the canonical submit payload WITHOUT firing the POST.
    const payload = window.amvcpRuntime
      && typeof window.amvcpRuntime.buildSubmissionPayload === 'function'
      ? window.amvcpRuntime.buildSubmissionPayload('submit')
      : null;
    let exported = null;
    if (payload && payload.selections) {
      for (let i = 0; i < payload.selections.length; i++) {
        const e = payload.selections[i];
        if (e && e.id === 'anim-sandbox:sandbox-card') { exported = e; }
      }
    }

    // (b) No new DOM elements added to the stage by tuning + export.
    const childCountAfter = stage.querySelectorAll('*').length;

    // (c) Theme flip → the .ve-anim-sandbox shell background re-paints.
    const lightBg = getComputedStyle(host).backgroundColor;
    document.documentElement.setAttribute('data-ve-theme', 'dark');
    await new Promise(r => setTimeout(r, 700));
    const darkBg = getComputedStyle(host).backgroundColor;
    document.documentElement.setAttribute('data-ve-theme', 'light');

    return {
      exportKind: exported ? exported.kind : null,
      exportType: exported ? exported.type : null,
      exportDuration: exported && exported.data ? exported.data.duration : null,
      exportEasing: exported && exported.data ? exported.data.easing : null,
      exportDurationCss: exported && exported.data ? exported.data.durationCss : null,
      selectionCount: payload ? payload.count : null,
      childCountBefore, childCountAfter,
      lightBg, darkBg
    };
  });
  const ok = res.exportKind === 'element'
    && res.exportType === 'anim-tuning'
    && res.exportDuration === 640
    && res.exportEasing === 'decel'
    && res.exportDurationCss === '640ms'
    && res.childCountAfter === res.childCountBefore
    && res.lightBg && res.darkBg && res.lightBg !== res.darkBg;
  record('anim_sandbox_export_payload_no_new_els_theme', ok ? 'PASS' : 'FAIL',
    'export → veSelection kind:element carries {duration,easing}; no new els; theme re-paints',
    JSON.stringify(res));
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testRendersStageAndControls,
  testSliderUpdatesDuration,
  testEasingUpdatesTimingFunction,
  testReplayRetriggersTransition,
  testExportPayloadAndNoNewElementsAndTheme
];

const page = await browser.getPage("anim-sandbox-tests");

try {
  for (const t of tests) {
    try {
      await t(page);
    } catch (e) {
      record(t.name || 'unnamed', 'ERROR', t.name || '',
        String(e && e.message || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
