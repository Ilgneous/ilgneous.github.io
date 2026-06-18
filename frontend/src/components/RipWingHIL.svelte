<script>
  import { onMount, onDestroy } from 'svelte';

  // ──────────────────────────────────────────────────────────────────
  //  Project RipWing — Hardware-in-the-Loop simulator (browser edition)
  //
  //  This is a faithful port of the Python HIL rig's *software-in-the-
  //  loop* mode. The same three cooperating pieces run here, in one
  //  browser tab:
  //
  //    QuadPlant      — simplified rigid-body quad dynamics  J·ω̇ = τ
  //    FaultEngine    — injects sensor drift / single-motor degradation
  //    MockFirmware   — the STM32 stand-in: 400 Hz PID + 50 Hz anomaly
  //
  //  On real hardware these talk over a framed serial protocol; in the
  //  software-in-the-loop mode (Python and here) the link collapses to a
  //  direct call, so the physics, faults, and controller logic are
  //  identical. Visitors can click the fault buttons and watch the IMU
  //  drift, the motor PWMs diverge to compensate, and the anomaly score
  //  spike — the same demo that runs against the board.
  //
  //  Styling follows the site tokens: --color-torque (accent),
  //  --color-blueprint (labels), --color-graphite (panels),
  //  --color-neutral-line (hairlines), display + mono pairing.
  // ──────────────────────────────────────────────────────────────────

  // ---- simulation constants ----
  const LOOP_HZ = 400;
  const ANOMALY_HZ = 50;
  const SIM_DT = 1 / LOOP_HZ;
  const WINDOW_S = 8;            // seconds of history shown
  const ANOM_THRESHOLD = 0.6;

  // ---- live UI state ----
  let driftOn = false;
  let degradeOn = false;
  let linkSeq = 0;
  let flagsLabel = 'none';
  let running = true;

  // ---- canvas refs ----
  let imuCanvas, motorCanvas, anomCanvas;
  let dims = { imu: [0, 0], motor: [0, 0], anom: [0, 0] };
  let dpr = 1;

  // ---- resolved theme tokens (fall back to known hexes) ----
  let C = {
    torque: '#E08A3C', blueprint: '#6E93C4', paper: '#F2EFE6',
    dim: '#9A968B', line: '#34322C', warn: '#C0553A',
  };
  const MOTOR_COLORS = ['#E08A3C', '#6E93C4', '#C0553A', '#7Fae7f'];

  function readTokens(el) {
    const cs = getComputedStyle(el);
    const g = (n, fb) => (cs.getPropertyValue(n).trim() || fb);
    C = {
      torque: g('--color-torque', C.torque),
      blueprint: g('--color-blueprint', C.blueprint),
      paper: g('--color-paper', C.paper),
      dim: g('--color-paper-dim', C.dim),
      line: g('--color-neutral-line', C.line),
      warn: C.warn,
    };
  }
  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ════════════════════════════════════════════════════════════════
  //  Simulation core (ported 1:1 from the Python HIL)
  // ════════════════════════════════════════════════════════════════
  function gauss(sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  class FaultEngine {
    constructor() {
      this.driftActive = false; this.driftRate = 0; this.driftValue = 0;
      this.degradeActive = false; this.degradeMotor = 2; this.degradeFactor = 0.70;
    }
    armDrift(rate = 0.06) { this.driftRate = rate; this.driftActive = true; }
    clearDrift() { this.driftActive = false; this.driftRate = 0; this.driftValue = 0; }
    armDegrade(motor = 2, factor = 0.70) { this.degradeMotor = motor; this.degradeFactor = factor; this.degradeActive = true; }
    clearDegrade() { this.degradeActive = false; }
    stepDrift(dt) { if (this.driftActive) this.driftValue += this.driftRate * dt; }
    applyToSensors(gyro) {
      if (this.driftActive) return [gyro[0], gyro[1], gyro[2] + this.driftValue];
      return gyro;
    }
    applyToThrust(cmds) {
      const eff = cmds.slice();
      if (this.degradeActive) eff[this.degradeMotor] *= this.degradeFactor;
      return eff;
    }
  }

  class QuadPlant {
    constructor(fault) {
      this.fault = fault;
      this.I = [0.0123, 0.0123, 0.0224];
      this.kThrust = 6.0; this.kTorque = 0.08;
      const L = 0.13;
      this.mix = [
        [-L, +L, -L, +L],
        [+L, +L, -L, -L],
        [-this.kTorque, +this.kTorque, +this.kTorque, -this.kTorque],
      ];
      this.reset();
    }
    reset() { this.att = [4 * Math.PI / 180, 0, 0]; this.rate = [0, 0, 0]; }
    step(cmds, dt) {
      const c = cmds.map(x => Math.min(1, Math.max(0, x)));
      const eff = this.fault.applyToThrust(c);
      const th = eff.map(x => this.kThrust * x);
      const torque = this.mix.map(row => row.reduce((s, m, i) => s + m * th[i], 0));
      const w = this.rate, Iw = this.I.map((I, i) => I * w[i]);
      const cross = [
        w[1] * Iw[2] - w[2] * Iw[1],
        w[2] * Iw[0] - w[0] * Iw[2],
        w[0] * Iw[1] - w[1] * Iw[0],
      ];
      let aa = torque.map((t, i) => (t - cross[i]) / this.I[i]);
      aa = aa.map((a, i) => a - 0.6 * w[i]);
      this.rate = this.rate.map((r, i) => r + aa[i] * dt);
      this.att = this.att.map((a, i) => a + this.rate[i] * dt);
      this.fault.stepDrift(dt);
      const g = 9.81;
      let gyro = this.rate.slice().map(v => v + gauss(0.004));
      const accel = [
        -g * Math.sin(this.att[1]),
        g * Math.sin(this.att[0]) * Math.cos(this.att[1]),
        g * Math.cos(this.att[0]) * Math.cos(this.att[1]),
      ].map(v => v + gauss(0.03));
      gyro = this.fault.applyToSensors(gyro);
      return [gyro, accel];
    }
  }

  class MockFirmware {
    constructor() {
      this.dt = SIM_DT;
      this.Kp = [3.2, 3.2, 2.0]; this.Ki = [0.4, 0.4, 0.3]; this.Kd = [0.10, 0.10, 0.05];
      this.integ = [0, 0, 0]; this.prevErr = [0, 0, 0];
      this.attEst = [0, 0, 0]; this.hover = 0.5;
      this.mixInv = [[-1, +1, -1], [+1, +1, +1], [-1, -1, +1], [+1, -1, -1]].map(r => r.map(x => x * 0.5));
      this.anomDiv = Math.round(LOOP_HZ / ANOMALY_HZ);
      this.anomCtr = 0; this.anomalyScore = 0;
      this.gyroHist = []; this.motorHist = []; this.residEma = 0;
    }
    step(gyro, accel) {
      const rollAcc = Math.atan2(accel[1], accel[2]);
      const pitchAcc = Math.atan2(-accel[0], Math.hypot(accel[1], accel[2]));
      this.attEst[0] = 0.98 * (this.attEst[0] + gyro[0] * this.dt) + 0.02 * rollAcc;
      this.attEst[1] = 0.98 * (this.attEst[1] + gyro[1] * this.dt) + 0.02 * pitchAcc;
      this.attEst[2] += gyro[2] * this.dt;
      const err = this.attEst.map(a => -a);
      this.integ = this.integ.map((v, i) => Math.min(1, Math.max(-1, v + err[i] * this.dt)));
      const deriv = err.map((e, i) => (e - this.prevErr[i]) / this.dt);
      this.prevErr = err;
      const effort = err.map((e, i) => this.Kp[i] * e + this.Ki[i] * this.integ[i] + this.Kd[i] * deriv[i]);
      let motors = this.mixInv.map(row => this.hover + row.reduce((s, m, j) => s + m * effort[j], 0));
      motors = motors.map(m => Math.min(1, Math.max(0, m)));
      if (++this.anomCtr >= this.anomDiv) {
        this.anomCtr = 0;
        this.gyroHist.push(gyro[2]); if (this.gyroHist.length > 25) this.gyroHist.shift();
        this.motorHist.push(motors.slice()); if (this.motorHist.length > 25) this.motorHist.shift();
        if (this.gyroHist.length >= 5) {
          const gz = this.gyroHist;
          const mean = gz.slice(0, -1).reduce((a, b) => a + b, 0) / (gz.length - 1);
          const innov = Math.abs(gz[gz.length - 1] - mean);
          const last = this.motorHist[this.motorHist.length - 1];
          const spread = Math.max(...last) - Math.min(...last);
          const excess = Math.max(0, spread - 0.06);
          this.residEma = 0.85 * this.residEma + 0.15 * (2.5 * innov + 4.0 * excess);
          this.anomalyScore = Math.min(1, Math.max(0, this.residEma));
        }
      }
      return [motors, this.anomalyScore];
    }
  }

  // ---- instances + ring buffers ----
  let fault, plant, firmware;
  let motorCmds = [0.5, 0.5, 0.5, 0.5];
  let lastAnom = 0;

  const PLOT_HZ = 60;
  const N = Math.round(WINDOW_S * PLOT_HZ) + 1;
  let tBuf, gyroBuf, motorBuf, anomBuf, head = 0, filled = 0, simClock = 0;
  let latestSample = null;

  function initBuffers() {
    tBuf = new Float64Array(N);
    gyroBuf = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
    motorBuf = [new Float64Array(N), new Float64Array(N), new Float64Array(N), new Float64Array(N)];
    anomBuf = new Float64Array(N);
    head = 0; filled = 0; simClock = 0;
  }

  // ---- fixed-step physics integration accumulator ----
  let raf, lastT = 0, acc = 0, lastPlot = 0;

  function loop(now) {
    if (!running) { raf = requestAnimationFrame(loop); return; }
    let el = (now - lastT) / 1000; lastT = now;
    if (el > 0.1) el = 0.1;
    acc += el;
    let steps = 0;
    while (acc >= SIM_DT && steps < 800) {
      // controller reads latest motor command, advances physics, ships IMU
      const [gyro, accel] = plant.step(motorCmds, SIM_DT);
      const [m, anom] = firmware.step(gyro, accel);
      motorCmds = m; lastAnom = anom; linkSeq++;
      simClock += SIM_DT;
      latestSample = { gyro, accel, motors: m, anom };
      acc -= SIM_DT; steps++;
    }
    // throttle plotting to PLOT_HZ
    if (now - lastPlot >= 1000 / PLOT_HZ) {
      lastPlot = now;
      pushSample();
      drawAll();
    }
    raf = requestAnimationFrame(loop);
  }

  function pushSample() {
    if (!latestSample) return;
    const { gyro, motors, anom } = latestSample;
    tBuf[head] = simClock;
    gyroBuf[0][head] = gyro[0]; gyroBuf[1][head] = gyro[1]; gyroBuf[2][head] = gyro[2];
    for (let i = 0; i < 4; i++) motorBuf[i][head] = motors[i];
    anomBuf[head] = anom;
    head = (head + 1) % N;
    filled = Math.min(filled + 1, N);
  }

  // ════════════════════════════════════════════════════════════════
  //  Rendering
  // ════════════════════════════════════════════════════════════════
  function orderedIdx() {
    const out = new Array(filled);
    for (let k = 0; k < filled; k++) out[k] = (head - filled + k + N) % N;
    return out;
  }

  function drawGrid(g, w, h, yTicks) {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = rgba(C.line, 0.6); g.lineWidth = 1;
    for (const yt of yTicks) {
      g.beginPath(); g.moveTo(0, yt); g.lineTo(w, yt); g.stroke();
    }
  }

  function plot(g, w, h, idx, getY, y0, y1, color, lw, fill) {
    if (filled < 2) return;
    const tNow = tBuf[idx[idx.length - 1]];
    const xOf = (t) => ((t - (tNow - WINDOW_S)) / WINDOW_S) * w;
    const yOf = (v) => h - ((v - y0) / (y1 - y0)) * h;
    g.beginPath();
    for (let k = 0; k < idx.length; k++) {
      const x = xOf(tBuf[idx[k]]); const y = yOf(getY(idx[k]));
      k ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    if (fill) {
      g.lineTo(xOf(tBuf[idx[idx.length - 1]]), yOf(y0));
      g.lineTo(xOf(tBuf[idx[0]]), yOf(y0));
      g.closePath();
      g.fillStyle = rgba(color, 0.16); g.fill();
      g.beginPath();
      for (let k = 0; k < idx.length; k++) {
        const x = xOf(tBuf[idx[k]]); const y = yOf(getY(idx[k]));
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
    }
    g.strokeStyle = color; g.lineWidth = lw; g.stroke();
  }

  function drawAll() {
    const idx = orderedIdx();

    // IMU
    let [w, h] = dims.imu, g = imuCanvas.getContext('2d');
    drawGrid(g, w, h, [h * 0.25, h * 0.5, h * 0.75]);
    plot(g, w, h, idx, (i) => gyroBuf[0][i], -1.2, 1.2, rgba(C.blueprint, 0.85), 1.4, false);
    plot(g, w, h, idx, (i) => gyroBuf[1][i], -1.2, 1.2, rgba('#9aa7c0', 0.7), 1.4, false);
    plot(g, w, h, idx, (i) => gyroBuf[2][i], -1.2, 1.2, C.torque, 2.0, false);

    // Motors
    [w, h] = dims.motor; g = motorCanvas.getContext('2d');
    drawGrid(g, w, h, [h * 0.25, h * 0.5, h * 0.75]);
    for (let m = 0; m < 4; m++)
      plot(g, w, h, idx, (i) => motorBuf[m][i], 0, 1, MOTOR_COLORS[m], m === 2 ? 2.2 : 1.6, false);

    // Anomaly
    [w, h] = dims.anom; g = anomCanvas.getContext('2d');
    drawGrid(g, w, h, [h * 0.5]);
    // threshold
    const ty = h - ANOM_THRESHOLD * h;
    g.strokeStyle = rgba(C.warn, 0.8); g.setLineDash([4, 4]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, ty); g.lineTo(w, ty); g.stroke(); g.setLineDash([]);
    plot(g, w, h, idx, (i) => anomBuf[i], 0, 1.05, C.torque, 2.2, true);
  }

  // ---- controls ----
  function toggleDrift() {
    driftOn = !driftOn;
    driftOn ? fault.armDrift(0.06) : fault.clearDrift();
    updateFlags();
  }
  function toggleDegrade() {
    degradeOn = !degradeOn;
    degradeOn ? fault.armDegrade(2, 0.70) : fault.clearDegrade();
    updateFlags();
  }
  function clearFaults() {
    driftOn = false; degradeOn = false;
    fault.clearDrift(); fault.clearDegrade();
    updateFlags();
  }
  function updateFlags() {
    const a = [];
    if (driftOn) a.push('SENSOR_DRIFT');
    if (degradeOn) a.push('MOTOR_DEGRADE');
    flagsLabel = a.length ? a.join(' | ') : 'none';
  }
  function togglePause() { running = !running; lastT = performance.now(); }

  // ---- sizing ----
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const [c, key] of [[imuCanvas, 'imu'], [motorCanvas, 'motor'], [anomCanvas, 'anom']]) {
      if (!c) continue;
      const r = c.getBoundingClientRect();
      dims[key] = [r.width, r.height];
      c.width = r.width * dpr; c.height = r.height * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  onMount(() => {
    readTokens(imuCanvas);
    fault = new FaultEngine();
    plant = new QuadPlant(fault);
    firmware = new MockFirmware();
    initBuffers();
    resize();
    window.addEventListener('resize', resize);
    lastT = performance.now(); lastPlot = lastT;
    raf = requestAnimationFrame(loop);
  });
  onDestroy(() => {
    
    if (typeof window !== 'undefined') {
      if(raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    }
  });

  // derived live readouts
  $: m3Excess = latestSample ? (latestSample.motors[2] - 0.5) : 0;
</script>

<div class="hil">
  <div class="head mono">
    <span class="l">// PROJECT RIPWING · HIL SIMULATOR</span>
    <span class="r">{running ? `LINK OK · seq ${linkSeq}` : 'PAUSED'}</span>
  </div>

  <div class="plots">
    <div class="plot">
      <div class="plot-label mono">IMU — raw gyro (rad/s) <span class="legend"><i style="background:{C.blueprint}"></i>x <i style="background:#9aa7c0"></i>y <i style="background:{C.torque}"></i>z · drift</span></div>
      <canvas bind:this={imuCanvas}></canvas>
    </div>
    <div class="plot">
      <div class="plot-label mono">MOTOR PWM — normalised throttle <span class="legend"><i style="background:{MOTOR_COLORS[0]}"></i>M1 <i style="background:{MOTOR_COLORS[1]}"></i>M2 <i style="background:{MOTOR_COLORS[2]}"></i>M3 · degraded <i style="background:{MOTOR_COLORS[3]}"></i>M4</span></div>
      <canvas bind:this={motorCanvas}></canvas>
    </div>
    <div class="plot">
      <div class="plot-label mono">ANOMALY SCORE — TinyML inference (50 Hz) <span class="thresh mono">threshold {ANOM_THRESHOLD}</span></div>
      <canvas bind:this={anomCanvas}></canvas>
    </div>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="m-n">{(lastAnom).toFixed(2)}</div>
      <div class="m-k mono">anomaly score</div>
    </div>
    <div class="metric">
      <div class="m-n">{lastAnom >= ANOM_THRESHOLD ? 'FLAGGED' : 'NOMINAL'}</div>
      <div class="m-k mono">status</div>
    </div>
    <div class="metric">
      <div class="m-n">{degradeOn ? (m3Excess > 0 ? '+' : '') + Math.round(m3Excess * 100) + '%' : '—'}</div>
      <div class="m-k mono">M3 compensation</div>
    </div>
    <div class="metric">
      <div class="m-n small">{flagsLabel}</div>
      <div class="m-k mono">active faults</div>
    </div>
  </div>

  <div class="actions">
    <button class="mono" class:active={driftOn} on:click={toggleDrift}>Inject sensor drift</button>
    <button class="mono" class:active={degradeOn} on:click={toggleDegrade}>Degrade Motor 3 (−30%)</button>
    <button class="mono ghost" on:click={clearFaults}>Clear faults</button>
    <button class="mono ghost" on:click={togglePause}>{running ? 'Pause' : 'Resume'}</button>
  </div>
</div>

<style>
  .hil {
    border: 1px solid var(--color-neutral-line);
    border-radius: 3px;
    background: var(--color-graphite);
    padding: 22px;
    max-width: 1000px;
  }
  .mono { font-family: var(--font-mono); }

  .head {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 11px; letter-spacing: 0.08em; margin-bottom: 18px;
  }
  .head .l { color: var(--color-torque); }
  .head .r { color: var(--color-blueprint); }

  .plots { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  .plot {
    border: 1px solid var(--color-neutral-line);
    border-radius: 2px;
    background: var(--color-graphite-2);
    overflow: hidden;
  }
  .plot-label {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;
    padding: 8px 10px 4px; font-size: 10px; letter-spacing: 0.06em;
    color: var(--color-paper-dim);
  }
  .legend { display: inline-flex; align-items: center; gap: 10px; color: var(--color-paper-dim); }
  .legend i { display: inline-block; width: 9px; height: 2px; margin-right: 3px; vertical-align: middle; }
  .thresh { color: var(--color-paper-dim); }
  canvas { width: 100%; height: 110px; display: block; }
  .plot:nth-child(3) canvas { height: 96px; }

  .metrics {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
    background: var(--color-neutral-line);
    border: 1px solid var(--color-neutral-line);
    border-radius: 2px; overflow: hidden; margin-bottom: 20px;
  }
  .metric { background: var(--color-graphite); padding: 14px 16px; }
  .m-n {
    font-family: var(--font-display); font-weight: 600; font-size: 20px;
    color: var(--color-torque); letter-spacing: -0.01em;
  }
  .m-n.small { font-size: 12px; line-height: 1.5; }
  .m-k { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-paper-dim); margin-top: 5px; }

  .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .actions button {
    font-size: 11px; letter-spacing: 0.04em;
    color: var(--color-paper); background: transparent;
    border: 1px solid var(--color-neutral-line); border-radius: 2px;
    padding: 9px 14px; cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
  }
  .actions button:hover { border-color: var(--color-torque); color: var(--color-torque); }
  .actions button:focus-visible { outline: 2px solid var(--color-blueprint); outline-offset: 2px; }
  .actions button.active { border-color: var(--color-torque); color: var(--color-torque); background: rgba(224, 138, 60, 0.08); }
  .actions button.ghost { color: var(--color-paper-dim); }
  .actions button.ghost:hover { color: var(--color-torque); }

  @media (max-width: 560px) {
    .metrics { grid-template-columns: repeat(2, 1fr); }
    .plot-label .legend { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    /* the loop self-throttles; nothing further required */
  }
</style>
