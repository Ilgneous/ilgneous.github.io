<script lang="ts">
  // Props
  export let baseUrl = "/";                 // pass import.meta.env.BASE_URL from Astro
  export let soundSrc: string = "leaf-crunch.mp3"; // default single sound
  export let soundsByCount: Record<number, string> = {}; // optional: per-count sounds
  export let volume = 1.0;                  // 0.0–1.0
  export let initial = 0;

  let count = initial;
  let pool: HTMLAudioElement[] = [];
  let poolIdx = 0;
  const overlap = 4; // allow up to 4 overlapping plays for rapid clicks

  function resolveSrc(next: number, prev: number) {
    const rel = soundsByCount[next] ?? soundSrc; // per-count > default
    // keep absolute URLs as-is; otherwise prefix with baseUrl
    return /^(https?:)?\/\//.test(rel) || rel.startsWith("/") ? rel : `${baseUrl}${rel}`;
  }

  function primePool(src: string) {
    pool = Array.from({ length: overlap }, () => {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = volume;
      return a;
    });
    poolIdx = 0;
  }

  function play(src: string) {
    // (Re)build the pool if empty or src changed
    if (!pool.length || pool[0].src !== new URL(src, document.baseURI).href) {
      primePool(src);
    }
    const a = pool[poolIdx];
    poolIdx = (poolIdx + 1) % pool.length;
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      // Autoplay policies may block first play until a gesture; this runs on click so should be fine.
    }
  }

  function handleClick() {
    const prev = count;
    count += 1;
    play(resolveSrc(count, prev));
  }
</script>

<button
  class="rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
  on:click={handleClick}
>
  Clicked {count} times
</button>
