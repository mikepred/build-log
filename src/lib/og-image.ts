import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { formatDate } from './entries';
import { authorUsername, ogImageHeight, ogImageWidth, siteTitle } from './site';
import { base, site } from '../../scripts/site-settings.mjs';

// Same palette as the dark theme in global.css and public/og-default.png.
const colors = {
  bg: '#161513',
  text: '#f3f0e8',
  muted: '#a8a29e',
  line: '#3a3732',
  tagBg: '#2a2825',
  tagText: '#c5d4ea',
};

// Bundled in the repo (Inter, SIL OFL 1.1, see src/assets/fonts/OFL.txt) so the build never fetches fonts.
// Astro runs the build from the project root.
const fontDir = resolve(process.cwd(), 'src/assets/fonts');
let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | undefined;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(resolve(fontDir, 'Inter-Regular.ttf')),
    readFile(resolve(fontDir, 'Inter-Bold.ttf')),
  ]).then(([regular, bold]) => ({ regular, bold }));
  return fontsPromise;
}

type Node = { type: string; props: Record<string, unknown> };
function h(type: string, style: Record<string, unknown>, ...children: unknown[]): Node {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } };
}

function titleSize(title: string): number {
  if (title.length <= 40) return 76;
  if (title.length <= 70) return 64;
  if (title.length <= 100) return 54;
  return 46;
}

const siteHost = `${new URL(site).host}${base}`;

// Document glyph from og-default.png, drawn as an SVG so it stays crisp.
const docIcon = {
  type: 'svg',
  props: {
    width: 30,
    height: 36,
    viewBox: '0 0 30 36',
    fill: 'none',
    stroke: colors.text,
    'stroke-width': 3,
    children: [
      { type: 'path', props: { d: 'M2 2h18l8 8v24H2z' } },
      { type: 'path', props: { d: 'M8 18h14M8 25h9' } },
    ],
  },
};

export interface OgPost {
  title: string;
  date: Date;
  tags: string[];
}

export async function renderOgImage(post: OgPost): Promise<Uint8Array> {
  const fonts = await loadFonts();

  const tree = h(
    'div',
    {
      width: ogImageWidth,
      height: ogImageHeight,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 80px 56px',
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: 'Inter',
    },
    // Top: site name, like the header on every page.
    h(
      'div',
      { display: 'flex', alignItems: 'center', gap: '18px' },
      docIcon,
      h('div', { fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }, siteTitle.toLowerCase()),
      h('div', { fontSize: 28, color: colors.muted }, `by ${authorUsername}`),
    ),
    // Middle: title, date and tags.
    h(
      'div',
      { display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' },
      h(
        'div',
        {
          fontSize: titleSize(post.title),
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          display: 'block',
          lineClamp: 4,
        },
        post.title,
      ),
      h(
        'div',
        { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', fontSize: 26 },
        h('div', { color: colors.muted, marginRight: '10px' }, formatDate(post.date)),
        ...post.tags.map((tag) =>
          h(
            'div',
            {
              color: colors.tagText,
              backgroundColor: colors.tagBg,
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: 22,
            },
            `#${tag}`,
          ),
        ),
      ),
    ),
    // Bottom: rule and site URL, as in og-default.png.
    h(
      'div',
      {
        display: 'flex',
        borderTop: `2px solid ${colors.line}`,
        paddingTop: '22px',
        fontSize: 24,
        color: colors.muted,
      },
      siteHost,
    ),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: ogImageWidth,
    height: ogImageHeight,
    fonts: [
      { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: 'width', value: ogImageWidth } }).render().asPng();
}
