import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgImage } from '../../lib/og-image';

// One social card per post, rendered at build time to /og/<slug>.png.
export const getStaticPaths = (async () => {
  const entries = await getCollection('entries');
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { title: entry.data.title, date: entry.data.date, tags: entry.data.tags },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props as { title: string; date: Date; tags: string[] });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
