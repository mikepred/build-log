import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugFromEntryPath } from '../scripts/entry-file.mjs';

const entries = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './content',
    generateId: ({ entry }) => {
      if (entry.includes('/') || entry.includes('\\')) {
        throw new Error(`Entries must live directly in content/ (got ${entry}).`);
      }
      return slugFromEntryPath(entry);
    },
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    summary: z.string(),
    canonical_url: z.url(),
  }),
});

/**
 * Running log: short dated notes in log/YYYY-MM-DD-anything.md at the repo root.
 * Outside content/, so the cross-post script never sees them.
 */
const log = defineCollection({
  loader: glob({ pattern: '*.md', base: './log' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string().optional(),
  }),
});

export const collections = { entries, log };
