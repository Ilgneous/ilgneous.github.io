<!--
  SpaceBackground.svelte
  Persistent ambient layer: starfield + slow drifting nebula clouds.
  Fixed full-viewport, sits behind the entire page at z-index -20.
  Designed to be cheap (runs on every page).

  Place at: frontend/src/components/SpaceBackground.svelte

  Usage in index.astro (and any other page where you want it):
    ---
    import SpaceBackground from "../components/SpaceBackground.svelte";
    ---
    <SpaceBackground client:load />

  Add the import + tag NEAR THE TOP of the body, replacing the
  existing decorative `<div aria-hidden ...>` block.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let canvas: HTMLCanvasElement;
  let cleanup: (() => void) | null = null;

  type Star = { x: number; y: number; a: number; phase: number; speed: number; size: number };
  type Blob = { x: number; y: number; vx: number; vy: number; r: number; sprite: HTMLCanvasElement };

  // Indigo / violet / blue tints — match the existing palette
  const TINTS: [number, number, number][] = [
    [99, 102, 241],
    [139, 92, 246],
    [59, 130, 246],
  ];

  function makeNebulaSprite(rgb: [number, number, number], size: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cctx = c.getContext('2d')!;
    const grd = cctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.10)`);
    grd.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.04)`);
    grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    cctx.fillStyle = grd;
    cctx.fillRect(0, 0, size, size);
    return c;
  }

  onMount(() => {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sprites = TINTS.map((t) => makeNebulaSprite(t, 600));

    let dpr = 1, w = 0, h = 0, raf = 0, running = true;
    let stars: Star[] = [];
    let blobs: Blob[] = [];
    const t0 = performance.now();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      // Lower density than ChargedField — this layer is ambient, not focal.
      const sn = Math.round(180 * Math.min(1.4, (w * h) / (1280 * 800)));
      stars = [];
      for (let i = 0; i < sn; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          a: 0.18 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.6,
          size: Math.random() < 0.85 ? 1 : 1.5,
        });
      }
      blobs = [];
      for (let i = 0; i < 2; i++) {
        blobs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04,
          r: 320 + Math.random() * 280,
          sprite: sprites[i % sprites.length],
        });
      }
    }

    function step() {
      if (!running) return;
      const t = (performance.now() - t0) / 1000;

      ctx!.clearRect(0, 0, w, h);

      // Nebula clouds (additive)
      ctx!.globalCompositeOperation = 'lighter';
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r) b.x = w + b.r;
        else if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        else if (b.y > h + b.r) b.y = -b.r;
        ctx!.drawImage(b.sprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx!.globalCompositeOperation = 'source-over';

      // Stars (twinkle)
      for (const s of stars) {
        const tw = 0.7 + 0.3 * Math.sin(t * s.speed + s.phase);
        ctx!.fillStyle = `rgba(220, 225, 255, ${(s.a * tw).toFixed(3)})`;
        ctx!.fillRect(s.x, s.y, s.size, s.size);
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    spawn();

    const onResize = () => { resize(); spawn(); };
    window.addEventListener('resize', onResize);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        step();
      }
    };
    document.addEventListener('visibilitychange', onVis);

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
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  });

  onDestroy(() => {
    if (cleanup) cleanup();
  });
</script>

<div class="space-bg" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .space-bg {
    position: fixed;
    inset: 0;
    z-index: -20;
    pointer-events: none;
    overflow: hidden;
  }
  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
  }
</style>
