export const siteTitle = 'Build log';

export const siteDescription =
  'Case notes from real work: things that broke, how I tracked them down, and what I changed so they don\'t break again. Windows, automation, AI agents, and dev tooling. Each entry has a quick case file, the story, and copy-paste steps to do it yourself.';

export const mitLicenseUrl = 'https://github.com/mikepred/build-log/blob/main/LICENSE';

export const contentLicenseUrl =
  'https://github.com/mikepred/build-log/blob/main/LICENSE-content';

export const authorName = 'Mike';
export const authorUsername = 'mikepred';
export const authorUrl = 'https://github.com/mikepred';

/** Default social card in public/, used for og:image and twitter:image on pages that aren't posts. */
export const ogImagePath = 'og-default.png';
export const ogImageWidth = 1200;
export const ogImageHeight = 630;
export const ogImageAlt = 'build log by mikepred';

/** Per-post social card generated at build time by src/pages/og/[slug].png.ts. Relative to the base path. */
export function postOgImagePath(slug: string): string {
  return `og/${encodeURIComponent(slug)}.png`;
}
