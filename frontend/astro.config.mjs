import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://ilgneous.github.io/sivansyed.github.io/',   // your GH Pages root
  base: '/sivansyed.github.io/',                      // <-- set to your repo name
  integrations: [svelte(), tailwind()],
});
