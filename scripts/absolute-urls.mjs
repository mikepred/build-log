import { fromMarkdown } from 'mdast-util-from-markdown';

/**
 * Cross-posted markdown lands on another domain, so root-relative URLs under
 * the site base (like /build-log/images/x.svg) would point at dev.to or
 * Hashnode. These helpers rewrite them to absolute URLs on the site.
 * The site build never calls this; Astro renders the original markdown.
 */

/**
 * The site root (origin + base) from an entry's canonical_url, which is
 * <origin><base>/<slug>/ for every entry. Returns null if it doesn't match.
 */
export function siteRootFromCanonical(canonicalUrl, slug) {
  let url;
  try {
    url = new URL(canonicalUrl);
  } catch {
    return null;
  }
  const match = url.pathname.match(new RegExp(`^(.*)/${escapeRegExp(slug)}/$`));
  if (!match) return null;
  return { origin: url.origin, base: match[1].replace(/\/+$/, '') };
}

/**
 * Rewrite root-relative URLs under `base` (including the bare base itself)
 * to `${origin}${path}` in link, image, and definition destinations and in raw
 * HTML src/href. The markdown is parsed (CommonMark), and the parser reports
 * the exact source range of every destination, so only those ranges (and raw
 * HTML nodes) are edited. Titles, labels, alt text, code blocks, inline code,
 * indentation and blockquotes are kept byte-for-byte.
 */
export function absolutizeSiteUrls(markdown, { origin, base }) {
  const underBase = base === '' ? /^\/(?!\/)/ : new RegExp(`^${escapeRegExp(base)}(?:[/?#]|$)`);
  const path =
    base === ''
      ? `/(?!/)[^\\s)"'<>]*`
      : `${escapeRegExp(base)}(?:[/?#][^\\s)"'<>]*)?(?=[\\s)"'<>]|$)`;
  const htmlUrl = new RegExp(`(\\b(?:src|href)\\s*=\\s*["']?)(${path})`, 'gi');

  // [start, end, replacement] edits on the original source.
  const edits = [];
  const destination = (start, end) => {
    if (underBase.test(markdown.slice(start, end))) edits.push([start, start, origin]);
  };
  // micromark tokens for destinations: the raw form is the URL itself, the
  // literal form is <URL> with its angle brackets. from-markdown has no
  // handlers for these token types, so hooking them changes nothing else.
  const raw = (token) => destination(token.start.offset, token.end.offset);
  const literal = (token) => destination(token.start.offset + 1, token.end.offset - 1);
  const root = fromMarkdown(markdown, {
    mdastExtensions: [{
      enter: {
        resourceDestinationRaw: raw,
        resourceDestinationLiteral: literal,
        definitionDestinationRaw: raw,
        definitionDestinationLiteral: literal,
      },
    }],
  });

  // Raw HTML (block or inline, including inside link labels) gets the
  // src/href rewrite. Code nodes are never html nodes, so they stay verbatim.
  const visit = (node) => {
    if (node.type === 'html' && node.position) {
      const { start, end } = node.position;
      const source = markdown.slice(start.offset, end.offset);
      const rewritten = source.replace(htmlUrl, (_, lead, url) => `${lead}${origin}${url}`);
      if (rewritten !== source) edits.push([start.offset, end.offset, rewritten]);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);

  edits.sort((a, b) => a[0] - b[0]);
  let out = '';
  let cursor = 0;
  for (const [start, end, text] of edits) {
    out += markdown.slice(cursor, start) + text;
    cursor = end;
  }
  return out + markdown.slice(cursor);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
