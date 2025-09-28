<script lang="ts">
  export let projects: { title: string; href: string; tech: string[] }[] = [];
  let q = "";
  let tag = "All";
  $: tags = ["All", ...Array.from(new Set(projects.flatMap(p => p.tech)))];
  $: filtered = projects.filter(p =>
    (tag === "All" || p.tech.includes(tag)) &&
    p.title.toLowerCase().includes(q.toLowerCase())
  );
</script>

<div class="mb-3 flex gap-2">
  <input class="border p-2 rounded w-full" placeholder="Search…" bind:value={q} />
  <select class="border p-2 rounded" bind:value={tag}>
    {#each tags as t}<option>{t}</option>{/each}
  </select>
</div>

<ul class="grid gap-3">
  {#each filtered as p}
    <li class="rounded-2xl border p-4 hover:shadow-md">
      <a class="font-semibold underline" href={p.href}>{p.title}</a>
      <div class="text-xs opacity-70 mt-1">{p.tech.join(" • ")}</div>
    </li>
  {/each}
</ul>
