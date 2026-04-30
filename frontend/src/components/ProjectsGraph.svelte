<!--
  ProjectsGraph.svelte
  Force-directed graph: each project is a node, edges connect projects that
  share at least one tech tag. Edge stiffness scales with how many tags two
  projects share, so heavily-overlapping projects pull together visually.

  Interactions:
    • Hover a node      → highlight its neighborhood, show tooltip
    • Drag a node       → physics responds; release returns it to the sim
    • Click a node      → navigate to its href
    • Hover a tag chip  → highlight every project using that tag
    • Mobile (coarse pointer) → drag disabled, but tap still navigates

  Place at: frontend/src/components/ProjectsGraph.svelte
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  type ProjectInput = {
    slug: string;
    title: string;
    tech: string[];
    href?: string;
  };

  // Props
  export let projects: ProjectInput[] = [];
  export let height: number = 640;
  let className: string = '';
  export { className as class };

  // DOM refs
  let wrap: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  // Top-level reactive state (drives template — tooltip, tag chips)
  let hoverIdx = -1;
  let pointerX = 0;
  let pointerY = 0;
  let activeTag: string | null = null;
  let allTags: string[] = [];

  // Internal node array — populated on mount, mutated by physics
  type Node = {
    id: string;
    title: string;
    tech: string[];
    href: string;
    x: number; y: number;
    vx: number; vy: number;
    fx: number | null; fy: number | null;
    r: number;
    degree: number;
  };
  type Edge = { a: number; b: number; shared: number };

  let nodes: Node[] = [];
  let edges: Edge[] = [];

  let cleanup: (() => void) | null = null;

  // Reactive: tooltip data driven by hoverIdx
  $: hoverNode = hoverIdx >= 0 && hoverIdx < nodes.length ? nodes[hoverIdx] : null;

  // Reactive: extract sorted unique tag list whenever projects change
  $: {
    const set = new Set<string>();
    for (const p of projects) for (const t of p.tech ?? []) set.add(t);
    allTags = [...set].sort((a, b) => a.localeCompare(b));
  }

  onMount(() => {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;

    // ── Build graph from projects ───────────────────────────────────
    nodes = projects.map((p) => ({
      id: p.slug,
      title: p.title,
      tech: p.tech ?? [],
      href: p.href ?? `/projects/${p.slug}`,
      x: 0, y: 0,
      vx: 0, vy: 0,
      fx: null, fy: null,
      r: 0,
      degree: 0,
    }));

    edges = [];
    for (let i = 0; i < nodes.length; i++) {
      const ti = new Set(nodes[i].tech);
      for (let j = i + 1; j < nodes.length; j++) {
        let shared = 0;
        for (const t of nodes[j].tech) if (ti.has(t)) shared++;
        if (shared > 0) {
          edges.push({ a: i, b: j, shared });
          nodes[i].degree++;
          nodes[j].degree++;
        }
      }
    }
    // Node radius scales gently with degree
    for (const n of nodes) n.r = 7 + Math.sqrt(n.degree + 1) * 2.4;

    // ── Canvas / animation state ────────────────────────────────────
    let dpr = 1, w = 0, h = 0;
    let raf = 0, running = true;
    let dragIdx = -1;
    let dragOffsetX = 0, dragOffsetY = 0;
    let dragMoved = false;
    let downX = 0, downY = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initLayout() {
      // Place nodes around a circle to avoid initial chaos
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.32;
      for (let i = 0; i < nodes.length; i++) {
        const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
        // Add small jitter so symmetric layouts break naturally
        nodes[i].x = cx + R * Math.cos(angle) + (Math.random() - 0.5) * 30;
        nodes[i].y = cy + R * Math.sin(angle) + (Math.random() - 0.5) * 30;
        nodes[i].vx = nodes[i].vy = 0;
      }
    }

    // ── Physics step ────────────────────────────────────────────────
    function physics() {
      const cx = w / 2, cy = h / 2;
      const REPULSION = 6500;        // strength of node-node repulsion
      const SPRING_K = 0.012;        // base spring stiffness
      const SPRING_REST = 250;       // ideal edge length (px)
      const CENTER_K = 0.005;        // pull toward canvas center
      const DAMPING = 0.25  ;          // velocity damping per frame

      // Reset accumulators (we'll add to vx/vy directly — fine for stable sims)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.fx !== null) continue;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            d2 = 1;
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
          }
          const inv = 1 / Math.sqrt(d2);
          const f = REPULSION / d2;
          a.vx += dx * inv * f * 0.001;
          a.vy += dy * inv * f * 0.001;
        }
        // Gentle pull toward center
        a.vx += (cx - a.x) * CENTER_K;
        a.vy += (cy - a.y) * CENTER_K;
      }

      // Spring force along each edge (more shared tags → stronger spring)
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const k = SPRING_K * (1 + (e.shared - 1) * 0.5);
        const f = (d - SPRING_REST) * k;
        const ux = dx / d, uy = dy / d;
        if (a.fx === null) { a.vx += ux * f; a.vy += uy * f; }
        if (b.fx === null) { b.vx -= ux * f; b.vy -= uy * f; }
      }

      // Integrate
      const pad = 36;
      for (const n of nodes) {
        if (n.fx !== null) {
          n.x = n.fx;
          n.y = n.fy!;
          n.vx = n.vy = 0;
          continue;
        }
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
        // Soft edge bounds
        if (n.x < pad)       n.vx += (pad - n.x) * 0.05;
        if (n.x > w - pad)   n.vx -= (n.x - (w - pad)) * 0.05;
        if (n.y < pad)       n.vy += (pad - n.y) * 0.05;
        if (n.y > h - pad)   n.vy -= (n.y - (h - pad)) * 0.05;
      }
    }

    // ── Highlight bookkeeping ───────────────────────────────────────
    function getHighlight(): { ns: Set<number>; es: Set<number> } {
      const ns = new Set<number>();
      const es = new Set<number>();

      // Hover takes priority over tag filter
      if (hoverIdx >= 0) {
        ns.add(hoverIdx);
        for (let k = 0; k < edges.length; k++) {
          const e = edges[k];
          if (e.a === hoverIdx || e.b === hoverIdx) {
            es.add(k);
            ns.add(e.a);
            ns.add(e.b);
          }
        }
      } else if (activeTag) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].tech.includes(activeTag)) ns.add(i);
        }
        for (let k = 0; k < edges.length; k++) {
          const e = edges[k];
          if (ns.has(e.a) && ns.has(e.b)) es.add(k);
        }
      }
      return { ns, es };
    }

    // ── Render ──────────────────────────────────────────────────────
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const hl = getHighlight();
      const hasHL = hl.ns.size > 0;

      // Edges (additive; brighter when many tags shared)
      ctx!.globalCompositeOperation = 'lighter';
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k];
        const a = nodes[e.a], b = nodes[e.b];
        const isHL = hl.es.has(k);
        const dim = hasHL && !isHL;
        const baseAlpha = 0.16 + 0.10 * (e.shared - 1);
        const alpha = dim ? 0.04 : baseAlpha;
        ctx!.strokeStyle = `rgba(165, 180, 252, ${alpha.toFixed(3)})`;
        ctx!.lineWidth = isHL ? 1.4 : 0.8;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      // Node glows (additive radial gradients)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHL = hl.ns.has(i);
        const dim = hasHL && !isHL;
        const glowR = (n.r + 10) * (isHL ? 1.7 : 1);
        const grd = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        const baseA = dim ? 0.15 : 0.7;
        grd.addColorStop(0, `rgba(129, 140, 248, ${baseA})`);
        grd.addColorStop(0.45, `rgba(129, 140, 248, ${(baseA * 0.4).toFixed(3)})`);
        grd.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx!.fillStyle = grd;
        ctx!.fillRect(n.x - glowR, n.y - glowR, glowR * 2, glowR * 2);
      }
      ctx!.globalCompositeOperation = 'source-over';

      // Bright cores (top of each node)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHL = hl.ns.has(i);
        const dim = hasHL && !isHL;
        ctx!.fillStyle = dim ? 'rgba(220, 220, 230, 0.45)' : 'rgba(245, 245, 255, 0.95)';
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * (isHL ? 0.85 : 0.62), 0, Math.PI * 2);
        ctx!.fill();
      }

      // Labels (Geist Mono). Show all when nothing highlighted; otherwise
      // only highlighted to reduce clutter.
      ctx!.font = '500 11.5px "Geist Mono Variable", ui-monospace, "SF Mono", monospace';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'top';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHL = hl.ns.has(i);
        if (hasHL && !isHL) continue;

        const text = n.title;
        const ty = n.y + n.r + 8;
        const m = ctx!.measureText(text);
        const padX = 6, padY = 3;
        // Pill background for legibility against background stars
        ctx!.fillStyle = 'rgba(9, 9, 11, 0.72)';
        const bgX = n.x - m.width / 2 - padX;
        const bgY = ty - padY;
        const bgW = m.width + padX * 2;
        const bgH = 13 + padY * 2;
        const radius = 4;
        ctx!.beginPath();
        ctx!.moveTo(bgX + radius, bgY);
        ctx!.lineTo(bgX + bgW - radius, bgY);
        ctx!.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
        ctx!.lineTo(bgX + bgW, bgY + bgH - radius);
        ctx!.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
        ctx!.lineTo(bgX + radius, bgY + bgH);
        ctx!.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
        ctx!.lineTo(bgX, bgY + radius);
        ctx!.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx!.closePath();
        ctx!.fill();

        ctx!.fillStyle = isHL ? 'rgb(196, 181, 253)' : 'rgba(220, 220, 230, 0.85)';
        ctx!.fillText(text, n.x, ty);
      }
    }

    function frame() {
      if (!running) return;
      physics();
      draw();
      raf = requestAnimationFrame(frame);
    }

    // ── Hit testing & pointer handlers ──────────────────────────────
    function nodeAt(px: number, py: number): number {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = px - n.x, dy = py - n.y;
        const hr = n.r + 6;
        if (dx * dx + dy * dy < hr * hr) return i;
      }
      return -1;
    }

    function localPos(e: PointerEvent): [number, number] {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    function onMove(e: PointerEvent) {
      const [x, y] = localPos(e);
      pointerX = x;
      pointerY = y;

      if (dragIdx >= 0) {
        nodes[dragIdx].fx = x - dragOffsetX;
        nodes[dragIdx].fy = y - dragOffsetY;
        if (Math.hypot(x - downX, y - downY) > 4) dragMoved = true;
        return;
      }

      const idx = nodeAt(x, y);
      if (idx !== hoverIdx) {
        hoverIdx = idx;
        canvas.style.cursor = idx >= 0 ? (isCoarse ? 'pointer' : 'grab') : 'default';
      }
    }

    function onDown(e: PointerEvent) {
      const [x, y] = localPos(e);
      downX = x; downY = y;
      const idx = nodeAt(x, y);
      if (idx < 0) return;
      dragIdx = idx;
      dragMoved = false;
      // Pin to current position; drag updates via fx/fy
      nodes[idx].fx = nodes[idx].x;
      nodes[idx].fy = nodes[idx].y;
      dragOffsetX = x - nodes[idx].x;
      dragOffsetY = y - nodes[idx].y;
      canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }

    function onUp(e: PointerEvent) {
      if (dragIdx < 0) return;
      const released = dragIdx;
      nodes[released].fx = null;
      nodes[released].fy = null;
      dragIdx = -1;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      canvas.style.cursor = hoverIdx >= 0 ? 'grab' : 'default';
      // Treat as click if pointer barely moved
      if (!dragMoved) {
        window.location.href = nodes[released].href;
      }
    }

    function onLeave() {
      hoverIdx = -1;
    }

    // Initial setup
    resize();
    initLayout();

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          if (!running) { running = true; frame(); }
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      }
    }, { threshold: 0 });
    io.observe(wrap);

    if (reduceMotion) {
      // Pre-settle the layout silently then stop
      for (let i = 0; i < 240; i++) physics();
      draw();
      running = false;
    } else {
      frame();
    }

    cleanup = () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  });

  onDestroy(() => {
    if (cleanup) cleanup();
  });

  // Helpers used in template
  function setTag(t: string | null) {
    activeTag = t;
  }
</script>

<div bind:this={wrap} class="pg-wrap {className}" style="--h: {height}px">
  <canvas bind:this={canvas} class="pg-canvas" aria-label="Project graph — drag nodes, hover for details, click to open"></canvas>

  <!-- Tooltip — position follows pointer, content driven by hoverIdx -->
  <div
    class="pg-tooltip"
    class:visible={hoverNode !== null}
    style="left: {Math.min(pointerX + 16, 9999)}px; top: {Math.max(pointerY - 14, 0)}px"
    aria-hidden="true"
  >
    {#if hoverNode}
      <div class="t-title">{hoverNode.title}</div>
      {#if hoverNode.tech.length > 0}
        <div class="t-tags">
          {#each hoverNode.tech as t}<span>{t}</span>{/each}
        </div>
      {/if}
      <div class="t-hint">click to open ↗</div>
    {/if}
  </div>

  <!-- Tag legend / filter -->
  {#if allTags.length > 0}
    <div class="pg-legend">
      <p class="pg-legend-title">// FILTER BY TAG</p>
      <div class="pg-tags">
        {#each allTags as tag}
          <button
            type="button"
            class="pg-tag"
            class:active={activeTag === tag}
            on:mouseenter={() => setTag(tag)}
            on:mouseleave={() => setTag(null)}
            on:focus={() => setTag(tag)}
            on:blur={() => setTag(null)}
          >{tag}</button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .pg-wrap {
    position: relative;
    width: 100%;
    height: var(--h, 640px);
    max-height: 80vh;
    border-radius: 1rem;
    overflow: hidden;
    background: rgba(9, 9, 11, 0.30);
    border: 1px solid rgba(63, 63, 70, 0.45);
    box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
  }

  .pg-canvas {
    display: block;
    width: 100%;
    height: 100%;
    /* Allow vertical scroll past the graph; horizontal drag captured locally */
    touch-action: pan-y;
  }

  /* ── Tooltip ──────────────────────────────────────────────────── */
  .pg-tooltip {
    position: absolute;
    pointer-events: none;
    min-width: 180px;
    max-width: 240px;
    padding: 10px 12px;
    background: rgba(9, 9, 11, 0.92);
    border: 1px solid rgba(99, 102, 241, 0.35);
    border-radius: 8px;
    backdrop-filter: blur(6px);
    box-shadow: 0 8px 30px -10px rgba(99, 102, 241, 0.45);
    opacity: 0;
    transform: translateY(-100%);
    transition: opacity 150ms ease;
    z-index: 10;
  }
  .pg-tooltip.visible { opacity: 1; }

  .pg-tooltip :global(.t-title) {
    font-family: var(--font-display, "Space Grotesk Variable", sans-serif);
    font-size: 14px;
    font-weight: 600;
    color: rgb(244, 244, 245);
    line-height: 1.25;
    margin-bottom: 6px;
  }
  .pg-tooltip :global(.t-tags) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }
  .pg-tooltip :global(.t-tags span) {
    font-family: var(--font-mono, "Geist Mono Variable", monospace);
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 4px;
    color: rgba(165, 180, 252, 0.9);
  }
  .pg-tooltip :global(.t-hint) {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    color: rgba(161, 161, 170, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  /* ── Tag legend ──────────────────────────────────────────────── */
  .pg-legend {
    position: absolute;
    bottom: 14px;
    left: 14px;
    right: 14px;
    padding: 10px 12px 11px;
    background: rgba(9, 9, 11, 0.65);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(63, 63, 70, 0.55);
    border-radius: 8px;
    pointer-events: auto;
  }
  .pg-legend-title {
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: rgba(165, 180, 252, 0.55);
    margin: 0 0 7px;
  }
  .pg-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 70px;
    overflow-y: auto;
  }
  .pg-tag {
    appearance: none;
    cursor: pointer;
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    padding: 3px 8px;
    background: rgba(24, 24, 27, 0.6);
    border: 1px solid rgba(63, 63, 70, 0.7);
    border-radius: 4px;
    color: rgba(212, 212, 216, 0.85);
    transition: all 180ms ease;
  }
  .pg-tag:hover,
  .pg-tag:focus-visible,
  .pg-tag.active {
    background: rgba(99, 102, 241, 0.16);
    border-color: rgba(99, 102, 241, 0.55);
    color: rgb(165, 180, 252);
    outline: none;
  }
</style>
