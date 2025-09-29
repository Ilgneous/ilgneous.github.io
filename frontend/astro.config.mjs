// astro.config.mjs
import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

// --- choose ONE Tailwind setup (see below) ---
import tailwind from '@tailwindcss/vite' // if you're on Tailwind v4

export default defineConfig({
  site: 'https://ilgneous.github.io',   // <-- your GH username host
  base: '/sivansyed.github.io/',        // <-- your repo name
  integrations: [svelte()],             // don't put the Vite plugin here
  vite: {
    plugins: [tailwind()],              // Tailwind v4 path (pick ONE approach)
  },
})
