<script>
  import { onMount } from 'svelte';

  let panel;
  let canvas;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    let W, H, dpr;
    let raf;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const C = {
      paper: '#f6f2e9', dim: '#8b8474', torque: '#f26a28',
      blue: '#5fafc2', graphite: '#0c0e11',
    };
    const DEG = (r) => r * 180 / Math.PI;

    // readout elements
    const elSteer = panel.querySelector('[data-steer]');
    const elOut = panel.querySelector('[data-out]');
    const elIn = panel.querySelector('[data-in]');

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = panel.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // Acute angle of tie rod from horizontal (rack axis). Both args are [x,y] canvas points.
    function rodAngleRad(re, J) {
      const a = Math.abs(Math.atan2(J[1] - re[1], J[0] - re[0]));
      return a > Math.PI / 2 ? Math.PI - a : a;
    }

    // --- Linkage solver: ball joint = intersection of circle(kingpin, armLen)
    //     and circle(rackEnd, rodLen). Pick branch continuous with rest pose. ---
    function solveJoint(kp, armLen, rodLen, rackEnd, rest) {
      const dx = rackEnd[0] - kp[0], dy = rackEnd[1] - kp[1], d = Math.hypot(dx, dy);
      if (d > armLen + rodLen || d < Math.abs(armLen - rodLen)) return null;
      const a = (armLen * armLen - rodLen * rodLen + d * d) / (2 * d);
      const h2 = armLen * armLen - a * a;
      if (h2 < 0) return null;
      const h = Math.sqrt(h2), xm = kp[0] + a * dx / d, ym = kp[1] + a * dy / d;
      const c = [
        [xm - h * dy / d, ym + h * dx / d],
        [xm + h * dy / d, ym - h * dx / d],
      ];
      const ang = (J) => Math.atan2(J[1] - kp[1], J[0] - kp[0]);
      c.sort((A, B) =>
        Math.abs(((ang(A) - rest + Math.PI) % (2 * Math.PI)) - Math.PI) -
        Math.abs(((ang(B) - rest + Math.PI) % (2 * Math.PI)) - Math.PI));
      return { J: c[0], theta: ang(c[0]) };
    }

    function geom() {
      const cx = W / 2, axleY = H * 0.46, rackY = H * 0.545;
      const half = Math.min(W, H) * 0.42, lx = cx - half, rx = cx + half;
      const armLen = Math.min(W, H) * 0.04; // short enough to stay within wheel footprint
      const beta = 12 * Math.PI / 180; // inboard-rear → anti-Ackermann, ball joint inside wheel
      const restR = Math.PI / 2 + beta, restL = Math.PI / 2 - beta;
      const jR0 = [rx + armLen * Math.cos(restR), axleY + armLen * Math.sin(restR)];
      const jL0 = [lx + armLen * Math.cos(restL), axleY + armLen * Math.sin(restL)];
      const run = Math.min(W, H) * 0.26;
      const rackR0 = [jR0[0] - run, rackY], rackL0 = [jL0[0] + run, rackY];
      const rodLen = Math.hypot(rackR0[0] - jR0[0], rackR0[1] - jR0[1]);
      return { cx, axleY, rackY, half, lx, rx, armLen, restR, restL, rackR0, rackL0, rodLen, run };
    }

    let G = null, travelLimit = 0;
    const MAX_ROD_ANGLE = 20 * Math.PI / 180;
    function calcLimit() {
      G = geom();
      let lo = 0, hi = G.run;
      for (let i = 0; i < 28; i++) {
        const m = (lo + hi) / 2;
        const ok = [1, -1].every((s) => {
          const reR = [G.rackR0[0] + s * m, G.rackY];
          const reL = [G.rackL0[0] + s * m, G.rackY];
          const sR = solveJoint([G.rx, G.axleY], G.armLen, G.rodLen, reR, G.restR);
          const sL = solveJoint([G.lx, G.axleY], G.armLen, G.rodLen, reL, G.restL);
          if (!sR || !sL) return false;
          return rodAngleRad(reR, sR.J) <= MAX_ROD_ANGLE && rodAngleRad(reL, sL.J) <= MAX_ROD_ANGLE;
        });
        if (ok) lo = m; else hi = m;
      }
      travelLimit = lo; // 40° rod-angle cap is the binding constraint
    }

    function drawWheel(cx, cy, ang, active) {
      const w = 22, h = 34;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.strokeStyle = active ? C.torque : C.paper;
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = active ? 1 : 0.82;
      roundRect(-w / 2, -h / 2, w, h, 4);
      ctx.stroke();
      ctx.globalAlpha = active ? 0.5 : 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 + 4);
      ctx.lineTo(0, h / 2 - 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = active ? C.torque : C.paper;
      ctx.beginPath();
      ctx.arc(0, 0, 2.6, 0, 7);
      ctx.fill();
      ctx.strokeStyle = active ? C.torque : C.paper;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, 7);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function ball(p) {
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.2, 0, 7);
      ctx.fill();
      ctx.strokeStyle = C.graphite;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.2, 0, 7);
      ctx.stroke();
    }

    let target = 0, cur = 0, idle = true, t0 = performance.now();

    function onMove(e) {
      const r = panel.getBoundingClientRect();
      target = -((e.clientX - r.left) / r.width - 0.5) * 2; // cursor right → steer right
    }
    function onEnter() { idle = false; }
    function onLeave() { target = 0; idle = true; t0 = performance.now(); }

    function frame(now) {
      if (idle && !reduceMotion) target = Math.sin((now - t0) / 1600) * 0.85;
      cur += (target - cur) * 0.10;
      const travel = cur * travelLimit;

      ctx.clearRect(0, 0, W, H);
      const { cx, axleY, rackY, lx, rx, armLen, restR, restL, rackR0, rackL0, rodLen } = G;

      const reR = [rackR0[0] + travel, rackY], reL = [rackL0[0] + travel, rackY];
      const sR = solveJoint([rx, axleY], armLen, rodLen, reR, restR);
      const sL = solveJoint([lx, axleY], armLen, rodLen, reL, restL);
      if (!sR || !sL) { raf = requestAnimationFrame(frame); return; }
      const steerR = sR.theta - restR, steerL = sL.theta - restL;

      // axle datum
      ctx.strokeStyle = 'rgba(91,138,166,.40)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(lx, axleY);
      ctx.lineTo(rx, axleY);
      ctx.stroke();
      ctx.setLineDash([]);

      // rack beam
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(reL[0], rackY);
      ctx.lineTo(reR[0], rackY);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(cx, rackY, 3.5, 0, 7);
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, rackY, 6, 0, 7);
      ctx.stroke();

      const active = Math.abs(steerR) > 0.03 || Math.abs(steerL) > 0.03;

      // tie rods — orange warning above 15° signals approaching the 20° hard cap
      const raL = DEG(rodAngleRad(reL, sL.J)), raR = DEG(rodAngleRad(reR, sR.J));
      ctx.lineWidth = 1.7;
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = raL <= 15 ? C.paper : C.torque;
      ctx.beginPath();
      ctx.moveTo(reL[0], reL[1]);
      ctx.lineTo(sL.J[0], sL.J[1]);
      ctx.stroke();
      ctx.strokeStyle = raR <= 15 ? C.paper : C.torque;
      ctx.beginPath();
      ctx.moveTo(reR[0], reR[1]);
      ctx.lineTo(sR.J[0], sR.J[1]);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // steering arms
      ctx.strokeStyle = active ? C.torque : C.paper;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx, axleY);
      ctx.lineTo(sL.J[0], sL.J[1]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx, axleY);
      ctx.lineTo(sR.J[0], sR.J[1]);
      ctx.stroke();
      ctx.lineCap = 'butt';

      drawWheel(lx, axleY, steerL, active);
      drawWheel(rx, axleY, steerR, active);
      ball(sL.J); ball(sR.J); ball(reL); ball(reR);

      // labels
      ctx.fillStyle = C.dim;
      ctx.font = "9.5px 'Space Mono', monospace";
      ctx.textAlign = 'center';
      const labY = axleY - 30;
      if (active) {
        const lOuter = Math.abs(steerL) >= Math.abs(steerR);
        ctx.fillText(lOuter ? 'OUT' : 'IN', lx, labY);
        ctx.fillText(lOuter ? 'IN' : 'OUT', rx, labY);
      } else {
        ctx.fillText('L', lx, labY);
        ctx.fillText('R', rx, labY);
      }

      const outA = Math.max(Math.abs(steerL), Math.abs(steerR));
      const inA = Math.min(Math.abs(steerL), Math.abs(steerR));
      if (elSteer) elSteer.textContent = DEG((Math.abs(steerL) + Math.abs(steerR)) / 2 * Math.sign(steerR || 1)).toFixed(1) + '°';
      if (elOut) elOut.textContent = DEG(outA).toFixed(1) + '°';
      if (elIn) elIn.textContent = DEG(inA).toFixed(1) + '°';

      raf = requestAnimationFrame(frame);
    }

    size();
    calcLimit();
    const onResize = () => { size(); calcLimit(); };
    window.addEventListener('resize', onResize);
    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerenter', onEnter);
    panel.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerenter', onEnter);
      panel.removeEventListener('pointerleave', onLeave);
    };
  });
</script>

<div class="panel" bind:this={panel}>
  <div class="tag"><b>FIG.01</b> — FSAE STEERING · ANTI-ACKERMANN</div>
  <canvas bind:this={canvas}></canvas>
  <div class="hint">↹ move to steer</div>
  <div class="readout">
    STEER <span data-steer>0.0°</span><br />
    OUT <span data-out>0.0°</span> · IN <span data-in>0.0°</span>
  </div>
</div>

<style>
  .panel {
    position: relative;
    width: min(560px, 100%);
    aspect-ratio: 1 / 0.66;
    border: 1px solid var(--border, rgba(236,231,217,.12));
    border-radius: 3px;
    background:
      linear-gradient(var(--border, rgba(236,231,217,.12)) 1px, transparent 1px) 0 0 / 100% 30px,
      linear-gradient(90deg, var(--border, rgba(236,231,217,.12)) 1px, transparent 1px) 0 0 / 30px 100%,
      var(--surface-sunken, #111418);
    overflow: hidden;
    touch-action: none;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .tag {
    position: absolute;
    left: 13px;
    top: 11px;
    z-index: 2;
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--text-muted, #b3ac9b);
  }
  .tag b { color: var(--signal-400, #5fafc2); font-weight: 400; }
  .readout {
    position: absolute;
    right: 13px;
    bottom: 11px;
    z-index: 2;
    text-align: right;
    font-family: var(--font-mono, monospace);
    font-size: 10.5px;
    line-height: 1.7;
    color: var(--text-muted, #b3ac9b);
  }
  .readout span { color: var(--accent, #f26a28); }
  .hint {
    position: absolute;
    left: 13px;
    bottom: 11px;
    z-index: 2;
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faint, #8b8474);
  }
</style>