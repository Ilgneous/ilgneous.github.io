import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  // your GH Pages root
  site: 'https://sivansyed.github.io',

  // <-- set to your repo name
  base: '/sivansyed.github.io/',

  integrations: [svelte(), tailwind()],

  vite: {
    plugins: [tailwind()],
  },
});