import assert from 'node:assert/strict';
import { test } from 'node:test';
import { absolutizeSiteUrls, siteRootFromCanonical } from './absolute-urls.mjs';

const root = { origin: 'https://mikepred.github.io', base: '/build-log' };
const abs = 'https://mikepred.github.io/build-log';

test('derives origin and base from canonical_url', () => {
  assert.deepEqual(
    siteRootFromCanonical('https://mikepred.github.io/build-log/how-it-started/', 'how-it-started'),
    root,
  );
  assert.deepEqual(siteRootFromCanonical('https://example.com/my-post/', 'my-post'), {
    origin: 'https://example.com',
    base: '',
  });
  assert.equal(siteRootFromCanonical('https://example.com/other/', 'my-post'), null);
});

test('rewrites markdown images, links, reference definitions and raw html', () => {
  const input = [
    '![chart](/build-log/images/a/chart.svg)',
    '![alt](</build-log/images/a/b.svg> "title")',
    'see [the log](/build-log/log/) and [a post](/build-log/other-post/#fix)',
    '[ref]: /build-log/images/a/ref.png',
    '<img src="/build-log/images/a/c.png" alt="c"> <a href=\'/build-log/\'>home</a>',
  ].join('\n');
  const expected = [
    `![chart](${abs}/images/a/chart.svg)`,
    `![alt](<${abs}/images/a/b.svg> "title")`,
    `see [the log](${abs}/log/) and [a post](${abs}/other-post/#fix)`,
    `[ref]: ${abs}/images/a/ref.png`,
    `<img src="${abs}/images/a/c.png" alt="c"> <a href='${abs}/'>home</a>`,
  ].join('\n');
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('leaves absolute urls, anchors, other paths and code alone', () => {
  const input = [
    '[abs](https://mikepred.github.io/build-log/x/) [anchor](#case-file)',
    '[elsewhere](/other/path) [lookalike](/build-logs/x) [proto](//cdn.example.com/x.png)',
    'inline `![x](/build-log/images/x.svg)` stays',
    '```md',
    '![x](/build-log/images/x.svg)',
    '```',
    '~~~~',
    '<img src="/build-log/images/y.svg">',
    '~~~~',
    'plain text mentioning /build-log/images/z.svg is not a link',
  ].join('\n');
  assert.equal(absolutizeSiteUrls(input, root), input);
});

test('site at the domain root rewrites any root-relative path', () => {
  const out = absolutizeSiteUrls('![x](/images/x.svg) [p](//cdn.example.com/x)', {
    origin: 'https://example.com',
    base: '',
  });
  assert.equal(out, '![x](https://example.com/images/x.svg) [p](//cdn.example.com/x)');
});
