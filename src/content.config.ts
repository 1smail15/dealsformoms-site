import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const shared = {
  title: z.string().max(70),
  description: z.string().max(165),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  /** Set false to keep a finished draft out of the build entirely. */
  published: z.boolean().default(true),
  heroImage: z.string().optional(),
  heroAlt: z.string().optional(),
  /** REQUIRED: proof this post came from a real store visit. */
  firsthand: z.object({
    type: z.enum(['store-photo', 'receipt', 'shelf-tag', 'app-screenshot']),
    note: z.string(),
  }),
  tags: z.array(z.string()).default([]),
};

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...shared,
    pillar: z.enum(['mechanics', 'calendar', 'tools', 'buying']),
  }),
});

const deals = defineCollection({
  loader: glob({ base: './src/content/deals', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...shared,
    store: z.string().default('Walmart'),
    /** deal ids from src/data/deals.json */
    dealIds: z.array(z.string()).default([]),
  }),
});

export const collections = { guides, deals };
