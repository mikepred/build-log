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

  const rewriteDestinations = apply(destination);
  const rewriteHtml = apply(html);
  const slice = (node) => markdown.slice(node.position.start.offset, node.position.end.offset);

  // Render one node's source. Inside a link, image, or definition, the text
  // between children (the node's own syntax) gets the destination patterns,
  // and each child is rendered on its own: inline code verbatim, raw HTML with
  // the src/href patterns, nested links and images recursively. Every byte is
  // emitted exactly once, so nested edits are never dropped.
  const render = (node, inUrlNode) => {
    if (node.type === 'inlineCode' || node.type === 'code') return slice(node);
    if (node.type === 'html') return rewriteHtml(slice(node));
    if (node.type === 'image') {
      // Alt text is plain text with no child nodes, so only the destination
      // (the tail from the last `](`) is rewritten; inline code in alt stays.
      const source = slice(node);
      const at = source.lastIndexOf('](');
      return at < 0 ? source : source.slice(0, at) + rewriteDestinations(source.slice(at));
    }
    // Leaf nodes: a definition is all syntax, so its destination is rewritten.
    // Any other leaf (text, break, ...) is content and stays verbatim, so
    // escaped text like `\](/build-log/x)` inside a link label is never touched.
    if (!node.children) return node.type === 'definition' ? rewriteDestinations(slice(node)) : slice(node);
    const urlNode = node.type === 'link';
    const children = node.children;
    const gap = urlNode || inUrlNode ? rewriteDestinations : (text) => text;
    let out = '';
    let cursor = node.position.start.offset;
    for (const child of children) {
      if (!child.position) continue;
      out += gap(markdown.slice(cursor, child.position.start.offset)) + render(child, urlNode || inUrlNode);
      cursor = child.position.end.offset;
    }
    return out + gap(markdown.slice(cursor, node.position.end.offset));
  };

  const root = fromMarkdown(markdown);
  if (!root.position) return markdown;
  // The root's position can stop short of trailing whitespace; keep it as-is.
  return markdown.slice(0, root.position.start.offset) + render(root, false) +
    markdown.slice(root.position.end.offset);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
