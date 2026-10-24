import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { byDateDesc, entryHref } from '../lib/entries';
import { siteDescription, siteTitle } from '../lib/site';

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error('site must be set in astro.config to build the RSS feed.');
  }

  const entries = (await getCollection('entries')).sort(byDateDesc);
  const site = new URL(import.meta.env.BASE_URL, context.site);

  return rss({
    title: siteTitle,
    description: siteDescription,
    site,
    customData: '<language>en-us</language>',
    items: entries.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link: entryHref(entry.id),
      categories: entry.data.tags,
    })),
  });
}
