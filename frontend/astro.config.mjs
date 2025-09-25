import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';

// If your site is hosted at https://<user>.github.io/<repo>/, set base to "/<repo>/"
// export default defineConfig({ base: '/<repo>/', integrations: [svelte(), tailwind()] });

export default defineConfig({
  site: 'https://yourname.github.io',
  integrations: [svelte(), tailwind()],
  outDir: './dist',
});
