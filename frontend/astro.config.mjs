import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ilgneous.github.io",
  base: "/sivansyed.github.io/",
  integrations: [svelte()],
  vite: { plugins: [tailwind()] },
});