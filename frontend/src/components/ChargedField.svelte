<!--
  ChargedField.svelte — v3
  Changes from v2:
    1. stars and nebula now default to FALSE. The new SpaceBackground.svelte
       component owns the persistent ambient layer site-wide. Avoids
       double-rendering stars/nebula in the hero.
    2. Bottom of the canvas fades out via mask-image so the field
       transitions smoothly into the rest of the page instead of cutting
       off sharply.
    3. Vignette repositioned upward so it doesn't darken the bottom edge
       (the mask handles that now).

  Place at: frontend/src/components/ChargedField.svelte
  (Replaces the v2 file.)
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Public props
  export let density: 'low' | 'med' | 'high' = 'med';
  export let reactive: boolean = true;
  export let stars: boolean = false;   // ← default changed: SpaceBackground handles these
  export let nebula: boolean = false;  // ← default changed
  let className: string = '';
  export { className as class };

  let wrap: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let cleanup: (() => void) | null = null;

  type Particle = { x: number; y: number; vx: number; vy: number; q: 1 | -1; r: number };
  type Star = { x: number; y: number; a: number; phase: number; speed: number };
  type Blob = { x: number; y: number; vx: number; vy: number; r: number; sprite: HTMLCanvasElement };

  const C_POS: [number, number, number] = [129, 140, 248];
  const C_NEG: [number, number, number] = [196, 181, 253];
  const NEBULA_TINTS: [number, number, number][] = [
    [99, 102, 241],
    [139, 92, 246],
    [59, 130, 246],
  ];
  const LINK_DIST = 130;
  const PROBE_DIST = 180;

  function makeRadialSprite(
    rgb: [number, number, number],
    size: number,
    stops: Array<[number, number]>
  ): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cctx = c.getContext('2d')!;
    const grd = cctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [stop, alpha] of stops) {
      grd.addColorStop(stop, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    }
    cctx.fillStyle = grd;
    cctx.fillRect(0, 0, size, size);
    return c;
  }

  onMount(() => {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const baseCount = density === 'low' ? 50 : density === 'high' ? 110 : 80;

    let dpr = 1, w = 0, h = 0;
    let particles: Particle[] = [];
    let starList: Star[] = [];
    let blobs: Blob[] = [];
    const pointer = { x: -1e4, y: -1e4, active: false };
    let raf = 0, running = true;
    const t0 = performance.now();

    const SPRITE_SIZE = 64;
    const spritePos = makeRadialSprite(C_POS, SPRITE_SIZE, [
      [0, 1], [0.25, 0.55], [0.6, 0.15], [1, 0],
    ]);
    const spriteNeg = makeRadialSprite(C_NEG, SPRITE_SIZE, [
      [0, 1], [0.25, 0.55], [0.6, 0.15], [1, 0],
    ]);
    const NEBULA_SIZE = 512;
    const nebulaSprites = NEBULA_TINTS.map((tint) =>
      makeRadialSprite(tint, NEBULA_SIZE, [
        [0, 0.18], [0.5, 0.06], [1, 0],
      ])
    );

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const scale = Math.min(1.2, Math.max(0.4, (w * h) / (1280 * 720)));
      const n = Math.round(baseCount * scale);
      particles = [];
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          q: Math.random() < 0.5 ? 1 : -1,
          r: 1.4 + Math.random() * 1.6,
        });
      }
      starList = [];
      if (stars) {
        const sn = Math.round(220 * scale);
        for (let i = 0; i < sn; i++) {
          starList.push({
            x: Math.random() * w,
            y: Math.random() * h,
            a: 0.25 + Math.random() * 0.65,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
          });
        }
      }
      blobs = [];
      if (nebula) {
        for (let i = 0; i < 3; i++) {
          blobs.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.06,
            vy: (Math.random() - 0.5) * 0.06,
            r: 280 + Math.random() * 280,
            sprite: nebulaSprites[i % nebulaSprites.length],
          });
        }
      }
    }

    function step() {
      if (!running) return;
      const t = (performance.now() - t0) / 1000;

      ctx!.clearRect(0, 0, w, h);

      if (blobs.length) {
        ctx!.globalCompositeOperation = 'lighter';
        for (const b of blobs) {
          b.x += b.vx; b.y += b.vy;
          if (b.x < -b.r) b.x = w + b.r;
          else if (b.x > w + b.r) b.x = -b.r;
          if (b.y < -b.r) b.y = h + b.r;
          else if (b.y > h + b.r) b.y = -b.r;
          ctx!.drawImage(b.sprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
        }
        ctx!.globalCompositeOperation = 'source-over';
      }

      if (starList.length) {
        for (const s of starList) {
          const tw = 0.7 + 0.3 * Math.sin(t * s.speed + s.phase);
          ctx!.fillStyle = `rgba(220, 225, 255, ${(s.a * tw).toFixed(3)})`;
          ctx!.fillRect(s.x, s.y, 1, 1);
        }
      }

      const probeD2 = PROBE_DIST * PROBE_DIST;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (reactive && pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < probeD2 && d2 > 1) {
            const inv = 1 / Math.sqrt(d2);
            p.vx += dx * inv * 0.018;
            p.vy += dy * inv * 0.018;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;
      }

      ctx!.globalCompositeOperation = 'lighter';
      ctx!.lineWidth = 0.75;
      const linkD2 = LINK_DIST * LINK_DIST;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (a.q === b.q) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkD2) {
            const tt = 1 - d2 / linkD2;
            ctx!.strokeStyle = `rgba(165, 180, 252, ${(0.45 * tt).toFixed(3)})`;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalCompositeOperation = 'source-over';

      if (
        reactive && pointer.active &&
        pointer.x > -200 && pointer.x < w + 200 &&
        pointer.y > -200 && pointer.y < h + 200
      ) {
        ctx!.globalCompositeOperation = 'lighter';
        const grd = ctx!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 140);
        grd.addColorStop(0, 'rgba(129, 140, 248, 0.22)');
        grd.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx!.fillStyle = grd;
        ctx!.fillRect(pointer.x - 140, pointer.y - 140, 280, 280);
        ctx!.globalCompositeOperation = 'source-over';
      }

      ctx!.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const sprite = p.q === 1 ? spritePos : spriteNeg;
        const size = p.r * 12;
        ctx!.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx!.fillStyle = 'rgba(245, 245, 255, 0.95)';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(step);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }
    function onLeave() {
      pointer.active = false;
      pointer.x = pointer.y = -1e4;
    }

    resize();
    spawn();

    if (reactive) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    const ro = new ResizeObserver(() => { resize(); spawn(); });
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!running) { running = true; step(); }
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      }
    }, { threshold: 0 });
    io.observe(wrap);

    if (reduceMotion) {
      step();
      cancelAnimationFrame(raf);
      running = false;
    } else {
      step();
    }

    cleanup = () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (reactive) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerleave', onLeave);
      }
    };
  });

  onDestroy(() => {
    if (cleanup) cleanup();
  });
</script>

<div bind:this={wrap} class="cf-wrap {className}" aria-hidden="true">
  <canvas bind:this={canvas} class="cf-canvas"></canvas>
  <div class="cf-vignette"></div>
</div>

<style>
  /*
    The bottom 30% of the canvas fades to transparent via mask-image.
    Combined with the persistent SpaceBackground that sits behind, this
    gives a smooth handoff into the rest of the page instead of a hard cut.
  */
  .cf-wrap {
    overflow: hidden;
    contain: paint;
    -webkit-mask-image: linear-gradient(
      to bottom,
      black 0%,
      black 65%,
      rgba(0,0,0,0.6) 85%,
      transparent 100%
    );
            mask-image: linear-gradient(
      to bottom,
      black 0%,
      black 65%,
      rgba(0,0,0,0.6) 85%,
      transparent 100%
    );
  }
  .cf-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  /*
    Vignette is shifted upward so it darkens edges of the upper portion
    only. The mask handles the bottom; we don't want both effects piling
    on each other at the bottom edge.
  */
  .cf-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      ellipse 110% 75% at 50% 30%,
      transparent 0%,
      rgba(9, 9, 11, 0.20) 70%,
      rgba(9, 9, 11, 0.55) 100%
    );
  }
</style>
