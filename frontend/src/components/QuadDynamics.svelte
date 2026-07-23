<script>
  // ──────────────────────────────────────────────────────────────
  //  Project RipWing — Body-frame force & torque map (interactive)
  //
  //  Top-down X-configuration quad. Four rotors, thrust bars that
  //  grow/shrink per view, and a resultant glyph at the body center
  //  showing what that differential actually produces: net thrust,
  //  roll, pitch, or yaw. Static geometry, no live physics — this is
  //  the explainer for FIG.01, not the closed-loop sim (that's the
  //  tuner station).
  // ──────────────────────────────────────────────────────────────

  export let mode = 'forces'; // 'forces' | 'roll' | 'pitch' | 'yaw'

  const VIEWS = [
    { id: 'forces', label: 'Forces' },
    { id: 'roll', label: 'Roll' },
    { id: 'pitch', label: 'Pitch' },
    { id: 'yaw', label: 'Yaw' },
  ];

  // Motor layout — X config. FL/RR spin CCW, FR/RL spin CW (diagonal pairs match).
  // Top row sits 126px down (not flush with the viewBox edge) so the thrust-value
  // label, which is drawn *above* the bar, never clips off the top at max thrust.
  const MOTORS = [
    { id: 'FL', x: 100, y: 126, spin: 'ccw' },
    { id: 'FR', x: 320, y: 126, spin: 'cw' },
    { id: 'RL', x: 100, y: 314, spin: 'cw' },
    { id: 'RR', x: 320, y: 314, spin: 'ccw' },
  ];
  const CX = 210, CY = 220;

  const THRUST = {
    forces: { FL: 1, FR: 1, RL: 1, RR: 1 },
    roll:   { FL: 1.32, FR: 0.68, RL: 1.32, RR: 0.68 },
    pitch:  { FL: 0.68, FR: 0.68, RL: 1.32, RR: 1.32 },
    yaw:    { FL: 1, FR: 1, RL: 1, RR: 1 },
  };
  // Yaw view: thrust stays level, spin authority is what shifts (drag imbalance).
  const SPINRATE = {
    forces: { FL: 1, FR: 1, RL: 1, RR: 1 },
    roll:   { FL: 1, FR: 1, RL: 1, RR: 1 },
    pitch:  { FL: 1, FR: 1, RL: 1, RR: 1 },
    yaw:    { FL: 0.62, FR: 1.42, RL: 1.42, RR: 0.62 },
  };

  const DESCRIPTIONS = {
    forces: 'All four rotors spin equal. Thrust sums straight up the body +z axis — this is hover / vertical throttle, the baseline every other axis perturbs from.',
    roll:   'Left pair up, right pair down. The differential tips the body about its front-to-back axis — this is what banks the craft into a turn.',
    pitch:  'Front pair down, rear pair up. The differential tips the body about its left-right axis — this is what noses the craft forward or back.',
    yaw:    'Thrust stays level. CW motors (FR, RL) spin up while CCW motors (FL, RR) spin down — the drag-torque imbalance twists the body about +z with no net thrust change.',
  };

  const LABELS = { forces: 'ΣTᵢ = T_B', roll: 'ROLL', pitch: 'PITCH', yaw: 'YAW · reaction torque' };

  $: thrustFor = THRUST[mode];
  $: spinFor = SPINRATE[mode];
  $: barH = (id) => 26 + thrustFor[id] * 34;
  $: barColor = (id) => (thrustFor[id] > 1.05 ? 'var(--ember-400)' : thrustFor[id] < 0.95 ? 'var(--signal-400)' : 'var(--text-muted)');
  $: spinR = (id) => 13 + spinFor[id] * 7;
  $: spinColor = (id) => (spinFor[id] > 1.05 ? 'var(--ember-400)' : spinFor[id] < 0.95 ? 'var(--signal-400)' : 'var(--text-faint)');
</script>

<div class="qd">
  <div class="qd__head mono">
    <span class="l">// BODY-FRAME FORCE &amp; TORQUE MAP · X CONFIG</span>
    <span class="r">{LABELS[mode]}</span>
  </div>

  <div class="qd__tabs" role="tablist" aria-label="Dynamics view">
    {#each VIEWS as v}
      <button
        class="qd__tab mono"
        class:active={mode === v.id}
        role="tab"
        aria-selected={mode === v.id}
        on:click={() => (mode = v.id)}
      >{v.label}</button>
    {/each}
  </div>

  <div class="qd__stage">
    <svg viewBox="0 0 420 390" class="qd__svg" role="img" aria-label={`Force diagram, ${mode} view`}>
      <defs>
        <marker id="qd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
        </marker>
      </defs>

      <!-- blueprint dashes -->
      <line x1="20" y1={CY} x2="400" y2={CY} stroke="var(--signal-400)" stroke-opacity="0.14" stroke-width="1" />
      <line x1={CX} y1="18" x2={CX} y2="372" stroke="var(--signal-400)" stroke-opacity="0.14" stroke-width="1" />

      <!-- nose marker -->
      <path d="M210,70 L200,88 L220,88 Z" fill="var(--text-faint)" opacity="0.55" />
      <text x="210" y="64" text-anchor="middle" class="qd__tag mono">FRONT</text>

      <!-- arms -->
      <line x1={MOTORS[0].x} y1={MOTORS[0].y} x2={MOTORS[3].x} y2={MOTORS[3].y} stroke="var(--border-strong)" stroke-width="3" />
      <line x1={MOTORS[1].x} y1={MOTORS[1].y} x2={MOTORS[2].x} y2={MOTORS[2].y} stroke="var(--border-strong)" stroke-width="3" />

      <!-- center resultant glyph -->
      {#if mode === 'forces'}
        <circle cx={CX} cy={CY} r="12" fill="none" stroke="var(--ember-400)" stroke-width="2" />
        <circle cx={CX} cy={CY} r="3" fill="var(--ember-400)" />
      {:else if mode === 'roll'}
        <path d="M 168 220 A 42 42 0 0 1 252 220" fill="none" stroke="var(--ember-400)" stroke-width="2" marker-end="url(#qd-arrow)" />
      {:else if mode === 'pitch'}
        <path d="M 210 178 A 42 42 0 0 1 210 262" fill="none" stroke="var(--ember-400)" stroke-width="2" marker-end="url(#qd-arrow)" />
      {:else}
        <path d="M 192 192 A 34 34 0 1 1 188 248" fill="none" stroke="var(--ember-400)" stroke-width="2" marker-end="url(#qd-arrow)" />
      {/if}

      <!-- motors -->
      {#each MOTORS as m}
        <g>
          <circle cx={m.x} cy={m.y} r="22" fill="var(--surface-sunken)" stroke="var(--border-strong)" stroke-width="1.5" />
          <circle cx={m.x} cy={m.y} r={spinR(m.id)} fill="none" stroke={spinColor(m.id)} stroke-width="1.5"
            stroke-dasharray={m.spin === 'cw' ? '3 4' : '7 3'} opacity="0.85" />
          <text x={m.x} y={m.y + 4} text-anchor="middle" class="qd__id mono">{m.id}</text>

          <!-- thrust bar -->
          <rect
            x={m.x - 6}
            y={m.y - 34 - barH(m.id)}
            width="12"
            height={barH(m.id)}
            rx="2"
            fill={barColor(m.id)}
            opacity="0.9"
          />
          <text x={m.x} y={m.y - 40 - barH(m.id)} text-anchor="middle" class="qd__val mono">{thrustFor[m.id].toFixed(2)}×</text>
          <text x={m.x} y={m.y + 38} text-anchor="middle" class="qd__spin mono">{m.spin.toUpperCase()}</text>
        </g>
      {/each}
    </svg>
  </div>

  <p class="qd__desc">{DESCRIPTIONS[mode]}</p>
</div>

<style>
  .qd { border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); padding: 22px; }
  .mono { font-family: var(--font-mono); }

  .qd__head { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; letter-spacing: 0.08em; margin-bottom: 16px; }
  .qd__head .l { color: var(--accent); }
  .qd__head .r { color: var(--text-muted); }

  .qd__tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .qd__tab {
    font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--text-muted); background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 7px 14px; cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  }
  .qd__tab:hover { border-color: var(--accent-line); color: var(--text-display); }
  .qd__tab.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .qd__tab:focus-visible { outline: 2px solid var(--signal-400); outline-offset: 2px; }

  .qd__stage {
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    background: var(--surface-sunken); overflow: hidden;
  }
  .qd__svg { width: 100%; height: auto; display: block; aspect-ratio: 420 / 390; }
  .qd__svg rect, .qd__svg circle, .qd__svg text, .qd__svg path {
    transition: height var(--dur) var(--ease-out), y var(--dur) var(--ease-out), r var(--dur) var(--ease-out),
      fill var(--dur) var(--ease-out), stroke var(--dur) var(--ease-out), opacity var(--dur) var(--ease-out);
  }
  .qd__tag { font-size: 9px; letter-spacing: 0.14em; fill: var(--text-faint); }
  .qd__id { font-size: 11px; font-weight: 600; fill: var(--text-secondary); }
  .qd__val { font-size: 10px; fill: var(--text-muted); }
  .qd__spin { font-size: 8px; letter-spacing: 0.08em; fill: var(--text-faint); }

  .qd__desc { font-size: 14px; line-height: 1.6; color: var(--text-muted); margin: 16px 0 0; }

  @media (prefers-reduced-motion: reduce) {
    .qd__svg rect, .qd__svg circle, .qd__svg text, .qd__svg path { transition: none; }
  }
</style>
