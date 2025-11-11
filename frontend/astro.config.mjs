import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel/serverless';
import svelte from "@astrojs/svelte";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ilgneous.github.io",
  base: "/",
  integrations: [svelte()],
  vite: { plugins: [tailwind()] },
  // output: 'server',
  // adapter: vercel(),
});