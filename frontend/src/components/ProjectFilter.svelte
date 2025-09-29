<script lang="ts">
  export let projects: { title: string; href: string; tech?: string[] }[] = [];

  // Distinct, sorted skills
  $: skills = Array.from(new Set(projects.flatMap(p => p.tech ?? []))).sort();

  // Controls
  let skill = "All";
  let query = "";

  // Make query a reactive, lowercased token so Svelte tracks it
  $: q = query.trim().toLowerCase();

  // Reactively compute filtered list; depends on skill and q
  $: filtered =
    projects
      .filter(p => skill === "All" || (p.tech ?? []).includes(skill))
      .filter(p => {
        if (!q) return true;
        if (p.title?.toLowerCase().includes(q)) return true;
        return (p.tech ?? []).some(t => t.toLowerCase().includes(q));
      });
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center gap-3">
    <!-- Keyword search -->
    <div class="relative">
      <input
        type="text"
        placeholder="Search title or tech…"
        bind:value={query}
        class="block w-72 rounded-2xl border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm leading-6 text-zinc-900 shadow-sm
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="Search projects"
      />
      {#if query}
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          on:click={() => (query = "")}
          aria-label="Clear search"
          type="button"
        >
          ×
        </button>
      {/if}
    </div>

    <!-- Skills dropdown -->
    <label class="text-sm opacity-80" for="skill">Skill:</label>
    <div class="relative">
      <select
        id="skill"
        bind:value={skill}
        class="appearance-none block w-56 rounded-2xl border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm leading-6 text-zinc-900 shadow-sm
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option>All</option>
        {#each skills as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
      <svg
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.24 3.36a.75.75 0 0 1-.94 0L5.25 8.39a.75.75 0 0 1-.02-1.18z"
          clip-rule="evenodd" />
      </svg>
    </div>

    <span class="text-sm opacity-70">Showing {filtered.length} / {projects.length}</span>
  </div>

  <ul class="grid gap-3">
    {#each filtered as p}
      <li class="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60">
        <a class="underline font-medium" href={p.href}>{p.title}</a>
        {#if p.tech?.length}
          <div class="mt-1 text-sm opacity-70">{p.tech.join(" • ")}</div>
        {/if}
      </li>
    {/each}
  </ul>

  {#if filtered.length === 0}
    <p class="opacity-70 text-sm">No projects match that filter.</p>
  {/if}
</div>

<style>
  /* Normalize select across browsers without @tailwindcss/forms */
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: none;
  }
  select:-moz-focusring {
    color: transparent;
    text-shadow: 0 0 0 currentColor;
  }
  button[aria-label="Clear search"] { line-height: 1; }
</style>
