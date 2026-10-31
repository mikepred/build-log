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
  const match = url.pathname.match(new RegExp(`^(.*)/${escapeRegExp(slug)}/?$`));
  if (!match) return null;
  return { origin: url.origin, base: match[1].replace(/\/+$/, '') };
}

/**
 * Rewrite root-relative URLs under `base` to `${origin}${path}` in markdown
 * image/link destinations, reference definitions, and raw HTML src/href.
 * Absolute URLs, anchors, other paths, fenced code, and inline code are left alone.
 */
export function absolutizeSiteUrls(markdown, { origin, base }) {
  const prefix = `${base}/`;
  const path = `${escapeRegExp(prefix)}(?!/)[^\\s)"'<>]*`;
  const patterns = [
    // ![alt](/base/...) and [text](/base/...), optionally <wrapped>
    new RegExp(`(\\]\\(\\s*<?)(${path})`, 'g'),
    // [ref]: /base/...
    new RegExp(`(^[ \\t]{0,3}\\[[^\\]\\n]+\\]:[ \\t]*<?)(${path})`, 'gm'),
    // <img src="/base/..."> and <a href='/base/...'>
    new RegExp(`(\\b(?:src|href)\\s*=\\s*["']?)(${path})`, 'gi'),
  ];
  const rewrite = (text) =>
    patterns.reduce((out, re) => out.replace(re, (_, lead, url) => `${lead}${origin}${url}`), text);

  return splitFencedCode(markdown)
    .map((part) => (part.code ? part.text : mapOutsideInlineCode(part.text, rewrite)))
    .join('');
}

/** Split into fenced-code and prose parts (``` or ~~~ fences, CommonMark-style). */
function splitFencedCode(markdown) {
  const lines = markdown.split(/(?<=\n)/);
  const parts = [];
  let fence = null;
  let buffer = '';
  const flush = (code) => {
    if (buffer) parts.push({ code, text: buffer });
    buffer = '';
  };
  for (const line of lines) {
    if (!fence) {
      const open = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (open && !(open[1][0] === '`' && line.slice(open.index + open[0].length).includes('`'))) {
        flush(false);
        fence = open[1];
        buffer = line;
        continue;
      }
      buffer += line;
    } else {
      buffer += line;
      const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*\r?\n?$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
        flush(true);
        fence = null;
      }
    }
  }
  flush(fence !== null);
  return parts;
}

/** Apply fn to text outside `inline code` spans. */
function mapOutsideInlineCode(text, fn) {
  let out = '';
  let last = 0;
  const span = /(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g;
  for (const m of text.matchAll(span)) {
    out += fn(text.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + fn(text.slice(last));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
