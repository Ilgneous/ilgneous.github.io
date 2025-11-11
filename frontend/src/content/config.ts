// src/content/config.ts
import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content", // .md/.mdx entries
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tech: z.array(z.string()),
    date: z.string().optional(),
    image: z.string().optional(),
    repo: z.string().optional(),
    links: z.string().optional(),
    demo: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { projects };
