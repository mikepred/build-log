import type { CollectionEntry } from 'astro:content';

export function byDateDesc(
  a: CollectionEntry<'entries'>,
  b: CollectionEntry<'entries'>,
): number {
  return b.data.date.getTime() - a.data.date.getTime();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function entryHref(id: string): string {
  return `${import.meta.env.BASE_URL}${encodeURI(id)}/`;
}

export function tagHref(tag: string): string {
  return `${import.meta.env.BASE_URL}tags/${encodeURIComponent(tag)}/`;
}
