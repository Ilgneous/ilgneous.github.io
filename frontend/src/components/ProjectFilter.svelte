<script>
  export let projects = [];
  export let baseUrl = "/"; // pass import.meta.env.BASE_URL from Astro

  let query = "";
  let openFilters = false;
  const allTech = Array.from(
    new Set(projects.flatMap((p) => (p.tech ?? [])))
  ).sort((a, b) => a.localeCompare(b));
  let activeTech = new Set();

  function toggleTech(tag) {
    const next = new Set(activeTech);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    activeTech = next; // trigger reactivity
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
      class="w-full rounded-xl border border-zinc-300 bg-white/70 px-4 py-2 shadow-sm outline-none placeholder:opacity-60 focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:focus:ring-zinc-700"
      type="search"
      placeholder="Search title, tech, summary…"
      bind:value={query}
      aria-label="Search projects"
    />
  </div>

  <div class="flex items-center gap-2">
    <button
      class="rounded-xl border border-zinc-300 px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      on:click={() => (openFilters = !openFilters)}
      aria-expanded={openFilters}
      aria-controls="tech-filter"
    >
      {openFilters ? "Hide filters" : "Filter by tech"}
    </button>

    {#if activeTech.size}
      <button
        class="rounded-xl border border-zinc-300 px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        on:click={() => (activeTech = new Set())}
      >
        Clear ({activeTech.size})
      </button>
    {/if}
  </div>
</div>

{#if openFilters}
  <div id="tech-filter" class="mb-4 flex flex-wrap gap-2">
    {#each allTech as tag}
      <button
        class="rounded-full border px-3 py-1 text-sm transition-colors border-zinc-300 hover:bg-zinc-50 aria-pressed:bg-zinc-900 aria-pressed:text-white dark:border-zinc-800 dark:hover:bg-zinc-900"
        class:!bg-zinc-900={activeTech.has(tag)}
        class:!text-white={activeTech.has(tag)}
        on:click={() => toggleTech(tag)}
        aria-pressed={activeTech.has(tag)}
      >
        {tag}
      </button>
    {/each}
  </div>
{/if}

<!-- Grid of project cards with preview image -->
<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
  {#each filtered as p}
    <a
      class="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      href={p.href}
    >
      <div class="relative aspect-[16/9] w-full overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
        <img
          src={p.image}
          alt={`${p.title}`}
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          on:error={(e) => (e.currentTarget.src = `${baseUrl}favicon.svg`)}
        />
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <div class="p-4">
        <h3 class="text-lg font-semibold leading-tight">
          {p.title}
        </h3>
        {#if p.summary}
          <p class="mt-1 line-clamp-2 text-sm opacity-80">{p.summary}</p>
        {/if}
        {#if p.tech?.length}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each p.tech.slice(0, 4) as t}
              <span class="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{t}</span>
            {/each}
            {#if p.tech.length > 4}
              <span class="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">+{p.tech.length - 4}</span>
            {/if}
          </div>
        {/if}
      </div>
    </a>
  {/each}
</div>

{#if !filtered.length}
  <p class="mt-8 text-center opacity-70">No projects match your filters.</p>
{/if}

<style>
  /* line-clamp without Tailwind plugin */
  .line-clamp-2 {
    display: -webkit-box;
    /* -webkit-line-clamp: 2; */
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
