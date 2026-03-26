<script>
  export let projects = [];
  export let baseUrl = "/";

  let query = "";
  let filtersVisible = false;
  const allTech = Array.from(
    new Set(projects.flatMap((p) => (p.tech ?? [])))
  ).sort((a, b) => a.localeCompare(b));
  let activeTech = new Set();

  function toggleTech(tag) {
    const next = new Set(activeTech);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    activeTech = next;
  }

  function clearFilters() {
    activeTech = new Set();
  }

  $: filtered = projects.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.summary ?? "").toLowerCase().includes(q) ||
      (p.tech ?? []).join(" ").toLowerCase().includes(q);

    const matchesTags =
      activeTech.size === 0 || (p.tech ?? []).some((t) => activeTech.has(t));

    return matchesQuery && matchesTags;
  });
</script>

<!-- Controls -->
<div class="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div class="relative w-full sm:max-w-sm">
    <input
      class="input w-full"
      type="search"
      placeholder="Search title, tech, summary…"
      bind:value={query}
      aria-label="Search projects"
    />
  </div>

  <div class="flex items-center gap-3 text-sm">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <span
      class="cursor-pointer select-none text-zinc-400 hover:text-zinc-200 transition-colors"
      on:click={() => (filtersVisible = !filtersVisible)}
      role="switch"
      aria-checked={filtersVisible}
      tabindex="0"
    >
      {filtersVisible ? "Hide filters" : "Show filters"}
    </span>

    {#if activeTech.size}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <span
        class="cursor-pointer select-none text-indigo-300/70 hover:text-indigo-200 transition-colors"
        on:click={clearFilters}
        role="button"
        tabindex="0"
      >
        Clear {activeTech.size} filter{activeTech.size > 1 ? 's' : ''}
      </span>
    {/if}
  </div>
</div>

{#if filtersVisible}
  <div class="mb-5 flex flex-wrap gap-2">
    {#each allTech as tag}
      <label
        class="inline-flex cursor-pointer select-none items-center rounded-md border px-3 py-1 text-xs transition-all duration-200
          {activeTech.has(tag)
            ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
            : 'border-zinc-800/70 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600/60 hover:text-zinc-300'}"
      >
        <input
          type="checkbox"
          class="sr-only"
          checked={activeTech.has(tag)}
          on:change={() => toggleTech(tag)}
        />
        {tag}
      </label>
    {/each}
  </div>
{/if}

<!-- Grid of project cards -->
<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
  {#each filtered as p}
    <a
      class="group block overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/40 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600/80 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_-4px_rgba(99,102,241,0.08)]"
      href={p.href}
    >
      <div class="relative aspect-[16/9] w-full overflow-hidden border-b border-zinc-800/50">
        <img
          src={p.image}
          alt={`${p.title}`}
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          on:error={(e) => (e.currentTarget.src = `${baseUrl}favicon.svg`)}
        />
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>

      <div class="p-4">
        <h3 class="text-lg font-semibold leading-tight text-zinc-100 group-hover:text-indigo-200/90 transition-colors">
          {p.title}
        </h3>
        {#if p.summary}
          <p class="mt-1 line-clamp-2 text-sm text-zinc-400">{p.summary}</p>
        {/if}
        {#if p.tech?.length}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each p.tech.slice(0, 4) as t}
              <span class="rounded-md border border-zinc-800/70 bg-zinc-900/50 px-2 py-0.5 text-xs text-zinc-400">{t}</span>
            {/each}
            {#if p.tech.length > 4}
              <span class="rounded-md border border-zinc-800/70 bg-zinc-900/50 px-2 py-0.5 text-xs text-zinc-400">+{p.tech.length - 4}</span>
            {/if}
          </div>
        {/if}
      </div>
    </a>
  {/each}
</div>

{#if !filtered.length}
  <p class="mt-8 text-center text-sm text-zinc-500">No projects match your filters.</p>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>