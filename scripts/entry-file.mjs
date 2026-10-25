const ENTRY_FILENAME = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

/** Slugs that would collide with site routes. */
export const RESERVED_SLUGS = new Set(['index', 'tags', '404', 'rss.xml']);

/**
 * Slug for an entry file. `content/2026-10-24-foo-bar.md` and
 * `2026-10-24-foo-bar.md` both yield `foo-bar`.
 */
export function slugFromEntryPath(entryPath) {
  const normalized = entryPath.replace(/\\/g, '/');
  const filename = normalized.split('/').pop() ?? normalized;
  const match = ENTRY_FILENAME.exec(filename);
  if (!match?.[2]) {
    throw new Error(`Entry file must be named YYYY-MM-DD-slug.md (got ${entryPath}).`);
  }
  const slug = match[2];
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`Entry slug "${slug}" is reserved and cannot be used in the site URL.`);
  }
  return slug;
}

/** True for `content/YYYY-MM-DD-slug.md` directly inside `content/`. */
export function isContentEntryPath(filePath) {
  return /^content\/\d{4}-\d{2}-\d{2}-[^/]+\.md$/.test(filePath.replace(/\\/g, '/'));
}
