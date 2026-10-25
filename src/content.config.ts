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

export const collections = { entries };
