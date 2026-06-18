<script>
  import { onMount, onDestroy } from 'svelte';

  // ──────────────────────────────────────────────────────────────
  //  Project Lykos — Attitude Control Loop (interactive)
  //
  //  A live single-axis (roll) attitude controller for the flight
  //  controller. The PID gains drive a real closed-loop simulation
  //  of the rigid-body dynamics  J·θ̈ = τ , integrated with a fixed
  //  timestep at the 400 Hz firmware loop rate. Drag the craft to
  //  perturb it, fire a disturbance, or command a step, and watch
  //  the loop recover. These are the same gains you'd flash to the
  //  MCU — tune here first, then port the numbers.
  //
  //  Styling follows the Ilgneous DS tokens: --accent (ember),
  //  --signal-400 (labels), --surface-raised (panels),
  //  --border (hairlines), display + mono pairing.
  // ──────────────────────────────────────────────────────────────

  // ── Tunable gains (real, portable numbers) ──
  // Optional initial-gain props let a page pass a preset (Balanced / Aggressive
  // / Damped). They seed the sliders; the user can still tune freely from there.
  export let kp = 1.28;
  export let ki = 0.8;
  export let kd = 0.18;
  let Kp = kp;
  let Ki = ki;
  let Kd = kd;

  // ── Plant constants ──
  const J = 0.02;          // kg·m²  effective single-axis inertia
  const LOOP_HZ = 400;     // firmware control-loop rate
  const dt = 1 / LOOP_HZ;
  const TAU_MAX = 0.6;     // N·m    motor differential saturation
  const I_CLAMP = 3.0;     // anti-windup integral clamp

  // ── Live state ──
  let theta = 0, omega = 0, integral = 0, prevTheta = 0;
  let setpoint = 0, dragging = false;

  // ── Rolling trace ──
  const TRACE_LEN = 240;
  let trace = new Array(TRACE_LEN).fill(0);
  let spTrace = new Array(TRACE_LEN).fill(0);

  // ── Live metrics ──
  let peakErr = 0, settleClock = 0, settled = false, satFrac = 0;

  let raf, lastT = 0, acc = 0;
  let craftCanvas, traceCanvas;
  let cw = 0, ch = 0, tw = 0, th = 0, dpr = 1;
  let glowSprite;

  // resolve theme tokens at runtime so canvas matches CSS
  let C = { torque: '#E08A3C', blueprint: '#6E93C4', paper: '#F2EFE6', dim: '#9A968B' };

  function readTokens(el) {
    const cs = getComputedStyle(el);
    const get = (n, fb) => (cs.getPropertyValue(n).trim() || fb);
    C = {
      torque: get('--accent', C.torque),
      blueprint: get('--signal-400', C.blueprint),
      paper: get('--text-display', C.paper),
      dim: get('--text-muted', C.dim),
    };
  }

  function hexToRGBA(hex, a) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function makeGlow() {
    const s = document.createElement('canvas');
    const R = 40; s.width = s.height = R * 2;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(R, R, 0, R, R, R);
    grad.addColorStop(0, hexToRGBA(C.torque, 0.9));
    grad.addColorStop(0.4, hexToRGBA(C.torque, 0.35));
    grad.addColorStop(1, hexToRGBA(C.torque, 0));
    g.fillStyle = grad; g.fillRect(0, 0, R * 2, R * 2);
    glowSprite = s;
  }

  // ── One firmware tick ──
  function tick() {
    const err = setpoint - theta;
    integral += err * dt;
    if (integral > I_CLAMP) integral = I_CLAMP;
    if (integral < -I_CLAMP) integral = -I_CLAMP;

    const deriv = -(theta - prevTheta) / dt;  // derivative on measurement
    prevTheta = theta;

    let tau = Kp * err + Ki * integral + Kd * deriv;
    const saturated = Math.abs(tau) > TAU_MAX;
    if (tau > TAU_MAX) tau = TAU_MAX;
    if (tau < -TAU_MAX) tau = -TAU_MAX;

    if (!dragging) { omega += (tau / J) * dt; theta += omega * dt; }
    else { omega = 0; }

    const errDeg = Math.abs(err) * 180 / Math.PI;
    if (errDeg > peakErr) peakErr = errDeg;
    if (errDeg < 1.0) { settled = true; }
    else { settled = false; settleClock = 0; }
    if (!settled) settleClock += dt;
    satFrac = satFrac * 0.98 + (saturated ? 0.02 : 0);
  }

  function step() {
    const now = performance.now();
    let el = (now - lastT) / 1000; lastT = now;
    if (el > 0.1) el = 0.1;
    acc += el;
    let steps = 0;
    while (acc >= dt && steps < 800) { tick(); acc -= dt; steps++; }
    trace.push(theta * 180 / Math.PI); trace.shift();
    spTrace.push(setpoint * 180 / Math.PI); spTrace.shift();
    drawCraft(); drawTrace();
    peakErr = peakErr; settleClock = settleClock; satFrac = satFrac; settled = settled;
    raf = requestAnimationFrame(step);
  }

  function drawCraft() {
    if (!craftCanvas) return;
    const g = craftCanvas.getContext('2d');
    g.clearRect(0, 0, cw, ch);
    const cx = cw / 2, cy = ch / 2, arm = Math.min(cw, ch) * 0.30;

    g.strokeStyle = hexToRGBA(C.blueprint, 0.16); g.lineWidth = 1;
    g.beginPath(); g.moveTo(cw * 0.12, cy); g.lineTo(cw * 0.88, cy); g.stroke();

    g.save(); g.translate(cx, cy); g.rotate(setpoint);
    g.strokeStyle = hexToRGBA(C.torque, 0.35); g.setLineDash([4, 5]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-arm, 0); g.lineTo(arm, 0); g.stroke(); g.restore();

    g.save(); g.translate(cx, cy); g.rotate(theta); g.setLineDash([]);
    g.strokeStyle = hexToRGBA(C.paper, 0.85); g.lineWidth = 3;
    g.beginPath(); g.moveTo(-arm, 0); g.lineTo(arm, 0); g.stroke();
    g.fillStyle = hexToRGBA(C.paper, 0.9);
    g.beginPath(); g.arc(0, 0, 5, 0, Math.PI * 2); g.fill();

    g.globalCompositeOperation = 'lighter';
    for (const sx of [-1, 1]) {
      if (glowSprite) { const s = 34; g.drawImage(glowSprite, sx * arm - s, -s, s * 2, s * 2); }
    }
    g.globalCompositeOperation = 'source-over';
    for (const sx of [-1, 1]) {
      g.fillStyle = hexToRGBA(C.torque, 0.95);
      g.beginPath(); g.arc(sx * arm, 0, 4, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    g.fillStyle = hexToRGBA(C.dim, 0.7);
    g.font = "11px 'Geist Mono', ui-monospace, monospace";
    g.textAlign = 'center';
    g.fillText(`${(theta * 180 / Math.PI).toFixed(1)}°`, cx, cy + arm + 26);
  }

  function drawTrace() {
    if (!traceCanvas) return;
    const g = traceCanvas.getContext('2d');
    g.clearRect(0, 0, tw, th);
    const pad = 8, mid = th / 2, scale = (th / 2 - pad) / 45, xs = tw / (TRACE_LEN - 1);

    g.strokeStyle = hexToRGBA(C.blueprint, 0.16); g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, mid); g.lineTo(tw, mid); g.stroke();

    g.strokeStyle = hexToRGBA(C.torque, 0.4); g.setLineDash([3, 4]); g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < TRACE_LEN; i++) { const y = mid - spTrace[i] * scale; i ? g.lineTo(i * xs, y) : g.moveTo(0, y); }
    g.stroke(); g.setLineDash([]);

    g.strokeStyle = hexToRGBA(C.paper, 0.9); g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < TRACE_LEN; i++) { const y = mid - trace[i] * scale; i ? g.lineTo(i * xs, y) : g.moveTo(0, y); }
    g.stroke();
  }

  // ── Interaction ──
  function angleFromEvent(e) {
    const r = craftCanvas.getBoundingClientRect();
    const cxp = (e.touches ? e.touches[0].clientX : e.clientX) - r.left - r.width / 2;
    const cyp = (e.touches ? e.touches[0].clientY : e.clientY) - r.top - r.height / 2;
    return Math.atan2(cyp, cxp);
  }
  function clampTilt(a) { const lim = Math.PI * 0.42; return Math.max(-lim, Math.min(lim, a)); }
  function onDown(e) { dragging = true; theta = clampTilt(angleFromEvent(e)); omega = 0; resetMetrics(); }
  function onMove(e) { if (!dragging) return; theta = clampTilt(angleFromEvent(e)); e.preventDefault(); }
  function onUp() { dragging = false; }

  function kick() { omega += (Math.random() > 0.5 ? 1 : -1) * 14; resetMetrics(); }
  function commandStep() { setpoint = setpoint === 0 ? (20 * Math.PI / 180) : 0; resetMetrics(); }
  function resetMetrics() { peakErr = 0; settleClock = 0; settled = false; }
  function resetAll() {
    Kp = kp; Ki = ki; Kd = kd;
    setpoint = 0; theta = 0; omega = 0; integral = 0; resetMetrics();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (craftCanvas) {
      const r = craftCanvas.getBoundingClientRect();
      cw = r.width; ch = r.height;
      craftCanvas.width = cw * dpr; craftCanvas.height = ch * dpr;
      craftCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (traceCanvas) {
      const r = traceCanvas.getBoundingClientRect();
      tw = r.width; th = r.height;
      traceCanvas.width = tw * dpr; traceCanvas.height = th * dpr;
      traceCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  onMount(() => {
    readTokens(craftCanvas);
    makeGlow();
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    lastT = performance.now();
    raf = requestAnimationFrame(step);
  });
  onDestroy(() => {
    if (typeof window === 'undefined') return;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
  });

  $: zeta = Kd / (2 * Math.sqrt(Math.max(Kp, 1e-6) * J));
  $: character =
      zeta > 1.15 ? 'OVERDAMPED' :
      zeta > 0.85 ? 'NEAR-CRITICAL' :
      zeta > 0.45 ? 'UNDERDAMPED' :
      zeta > 0.15 ? 'LIGHTLY DAMPED' : 'OSCILLATORY';
</script>

<div class="panel">
  <div class="head mono">
    <span class="l">// ATTITUDE LOOP · ROLL AXIS</span>
    <span class="r">{LOOP_HZ} Hz · J {J} kg·m²</span>
  </div>

  <div class="stage">
    <div class="frame craft-frame">
      <canvas
        bind:this={craftCanvas}
        on:pointerdown={onDown}
        on:touchstart={onDown}
        class:grab={!dragging}
        class:grabbing={dragging}
      ></canvas>
      <span class="hint mono">drag to perturb</span>
    </div>
    <div class="frame trace-frame">
      <div class="frame-label mono">THETA RESPONSE → SETPOINT</div>
      <canvas bind:this={traceCanvas}></canvas>
    </div>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="m-n">{peakErr.toFixed(1)}°</div>
      <div class="m-k mono">peak error</div>
    </div>
    <div class="metric">
      <div class="m-n">{settled ? 'LOCKED' : settleClock.toFixed(2) + 's'}</div>
      <div class="m-k mono">settle</div>
    </div>
    <div class="metric">
      <div class="m-n">{Math.round(satFrac * 100)}%</div>
      <div class="m-k mono">saturation</div>
    </div>
    <div class="metric">
      <div class="m-n small">{character}</div>
      <div class="m-k mono">ζ ≈ {zeta.toFixed(2)}</div>
    </div>
  </div>

  <div class="gains">
    <label class="gain">
      <div class="g-top"><span class="g-name mono">Kp</span><span class="g-val mono">{Kp.toFixed(2)}</span></div>
      <input type="range" min="0" max="4" step="0.01" bind:value={Kp} aria-label="Proportional gain Kp" />
      <span class="g-sub mono">proportional · stiffness</span>
    </label>
    <label class="gain">
      <div class="g-top"><span class="g-name mono">Ki</span><span class="g-val mono">{Ki.toFixed(2)}</span></div>
      <input type="range" min="0" max="4" step="0.01" bind:value={Ki} aria-label="Integral gain Ki" />
      <span class="g-sub mono">integral · trim drift</span>
    </label>
    <label class="gain">
      <div class="g-top"><span class="g-name mono">Kd</span><span class="g-val mono">{Kd.toFixed(3)}</span></div>
      <input type="range" min="0" max="0.6" step="0.001" bind:value={Kd} aria-label="Derivative gain Kd" />
      <span class="g-sub mono">derivative · damping</span>
    </label>
  </div>

  <div class="actions">
    <button class="primary mono" on:click={kick}>Disturbance kick</button>
    <button class="mono" on:click={commandStep}>Step ±20°</button>
    <button class="mono" on:click={resetAll}>Reset</button>
  </div>
</div>

<style>
  .panel {
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--surface-raised);
    padding: 22px;
    max-width: 1000px;
  }
  .mono { font-family: var(--font-mono); }

  .head {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 11px; letter-spacing: 0.08em; margin-bottom: 18px;
  }
  .head .l { color: var(--accent); }
  .head .r { color: var(--text-muted); }

  .stage { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .frame {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 2px;
    background: var(--surface-sunken);
    overflow: hidden;
  }
  .craft-frame { aspect-ratio: 1 / 0.82; }
  .trace-frame { aspect-ratio: 1 / 0.82; display: flex; flex-direction: column; }
  canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  .grab { cursor: grab; } .grabbing { cursor: grabbing; }
  .hint { position: absolute; bottom: 8px; left: 10px; font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted); pointer-events: none; }
  .frame-label { padding: 8px 10px 2px; font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted); }
  .trace-frame canvas { flex: 1; }

  .metrics {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 2px; overflow: hidden; margin-bottom: 20px;
  }
  .metric { background: var(--surface-raised); padding: 14px 16px; }
  .m-n {
    font-family: var(--font-display); font-weight: 600; font-size: 20px;
    color: var(--accent); letter-spacing: -0.01em;
  }
  .m-n.small { font-size: 13px; }
  .m-k { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 5px; }

  .gains { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 20px; }
  .gain { display: flex; flex-direction: column; gap: 8px; }
  .g-top { display: flex; justify-content: space-between; align-items: baseline; }
  .g-name { font-size: 13px; font-weight: 500; color: var(--text-display); }
  .g-val { font-size: 13px; color: var(--accent); }
  .g-sub { font-size: 10px; letter-spacing: 0.04em; color: var(--text-muted); }

  input[type="range"] {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 2px; background: var(--border); outline: none;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px; background: var(--accent);
    border: none; cursor: pointer; border-radius: 0; transform: rotate(45deg);
  }
  input[type="range"]::-moz-range-thumb {
    width: 13px; height: 13px; background: var(--accent);
    border: none; cursor: pointer; border-radius: 0;
  }
  input[type="range"]:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--signal-400); outline-offset: 2px; }

  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .actions button {
    font-size: 11px; letter-spacing: 0.04em;
    color: var(--text-display); background: transparent;
    border: 1px solid var(--border); border-radius: 2px;
    padding: 9px 14px; cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
  }
  .actions button:hover { border-color: var(--accent); color: var(--accent); }
  .actions button:focus-visible { outline: 2px solid var(--signal-400); outline-offset: 2px; }
  .actions button.primary { border-color: var(--accent); color: var(--accent); }
  .actions button.primary:hover { background: var(--surface-sunken); }

  @media (max-width: 560px) {
    .stage { grid-template-columns: 1fr; }
    .metrics { grid-template-columns: repeat(2, 1fr); }
    .gains { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    input[type="range"]::-webkit-slider-thumb { transform: none; }
  }
</style>
