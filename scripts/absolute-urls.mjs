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
 * HTML src/href. The markdown is parsed (CommonMark) to find those nodes, and
 * only their source ranges are edited, so everything else (code blocks,
 * inline code, indentation, blockquotes) is kept byte-for-byte.
 */
export function absolutizeSiteUrls(markdown, { origin, base }) {
  const path =
    base === ''
      ? `/(?!/)[^\\s)"'<>]*`
      : `${escapeRegExp(base)}(?:[/?#][^\\s)"'<>]*)?(?=[\\s)"'<>]|$)`;
  const destination = [
    // ](/base/...) for links and images, optionally <wrapped>
    new RegExp(`(\\]\\(\\s*<?)(${path})`, 'g'),
    // [ref]: /base/...
    new RegExp(`(^\\[[^\\]\\n]+\\]:\\s*<?)(${path})`, 'g'),
  ];
  const html = [new RegExp(`(\\b(?:src|href)\\s*=\\s*["']?)(${path})`, 'gi')];
  const apply = (patterns) => (text) =>
    patterns.reduce((out, re) => out.replace(re, (_, lead, url) => `${lead}${origin}${url}`), text);

  const edits = [];
  const visit = (node) => {
    const pos = node.position;
    if (pos && (node.type === 'link' || node.type === 'image' || node.type === 'definition')) {
      // Rewrite the node's own syntax but not text inside inline code in a link label.
      const skip = [];
      collect(node, 'inlineCode', skip);
      edits.push({ start: pos.start.offset, end: pos.end.offset, skip, fn: apply(destination) });
      for (const child of node.children ?? []) if (child.type !== 'inlineCode') visit(child);
      return;
    }
    if (pos && node.type === 'html') {
      edits.push({ start: pos.start.offset, end: pos.end.offset, skip: [], fn: apply(html) });
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(fromMarkdown(markdown));

  // Nested nodes (an image inside a link) overlap; keep outer ranges and
  // skip inner ones, since the outer rewrite already covers their text.
  edits.sort((a, b) => a.start - b.start || b.end - a.end);
  let out = '';
  let cursor = 0;
  for (const edit of edits) {
    if (edit.start < cursor) continue;
    out += markdown.slice(cursor, edit.start) + rewriteRange(markdown, edit);
    cursor = edit.end;
  }
  return out + markdown.slice(cursor);
}

function rewriteRange(markdown, { start, end, skip, fn }) {
  let out = '';
  let cursor = start;
  for (const node of skip) {
    const s = node.position.start.offset;
    const e = node.position.end.offset;
    out += fn(markdown.slice(cursor, s)) + markdown.slice(s, e);
    cursor = e;
  }
  return out + fn(markdown.slice(cursor, end));
}

function collect(node, type, into) {
  for (const child of node.children ?? []) {
    if (child.type === type) into.push(child);
    else collect(child, type, into);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
