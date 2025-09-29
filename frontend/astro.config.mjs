import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ilgneous.github.io",
  base: "/",
  integrations: [svelte()],
  vite: { plugins: [tailwind()] },
});