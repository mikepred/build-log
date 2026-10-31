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
  // The trailing slash is required, matching the entry.mjs error.
  assert.equal(
    siteRootFromCanonical('https://mikepred.github.io/build-log/how-it-started', 'how-it-started'),
    null,
  );
});

test('rewrites the bare base but not lookalike paths', () => {
  const input = [
    '[home](/build-log) [home2](/build-log "Home") [q](/build-log?x=1) [h](/build-log#top)',
    '![i](/build-log)',
    '',
    '[ref]: /build-log',
    '',
    '<a href="/build-log">home</a> <img src=\'/build-log\'>',
    '[nope](/build-logs) [nope2](/build-logs/x) [nope3](/build-log-old/)',
  ].join('\n');
  const expected = [
    `[home](${abs}) [home2](${abs} "Home") [q](${abs}?x=1) [h](${abs}#top)`,
    `![i](${abs})`,
    '',
    `[ref]: ${abs}`,
    '',
    `<a href="${abs}">home</a> <img src='${abs}'>`,
    '[nope](/build-logs) [nope2](/build-logs/x) [nope3](/build-log-old/)',
  ].join('\n');
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('leaves code alone in lists, blockquotes and indented blocks', () => {
  const input = [
    '1. Step one:',
    '',
    '    ```md',
    '    ![x](/build-log/images/x.svg)',
    '    ```',
    '',
    '   - nested:',
    '',
    '         ~~~',
    '         <img src="/build-log/images/n.svg">',
    '         ~~~',
    '',
    '> quoted:',
    '>',
    '> ```',
    '> [l](/build-log/log/)',
    '> ```',
    '',
    'Indented code block:',
    '',
    '    [l](/build-log/log/)',
    '    <img src="/build-log/images/i.svg">',
    '',
    '> but a quoted [link](/build-log/log/) and `[code](/build-log/log/)`',
    '- a listed ![img](/build-log/images/y.svg)',
  ].join('\n');
  const expected = input
    .replace('> but a quoted [link](/build-log/log/)', `> but a quoted [link](${abs}/log/)`)
    .replace('- a listed ![img](/build-log/images/y.svg)', `- a listed ![img](${abs}/images/y.svg)`);
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('handles an image inside a link and inline code in a link label', () => {
  const input = '[![badge](/build-log/images/b.svg)](/build-log/) [`/build-log/x` docs](/build-log/x/)';
  const expected = `[![badge](${abs}/images/b.svg)](${abs}/) [\`/build-log/x\` docs](${abs}/x/)`;
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('rewrites markdown images, links, reference definitions and raw html', () => {
  const input = [
    '![chart](/build-log/images/a/chart.svg)',
    '![alt](</build-log/images/a/b.svg> "title")',
    'see [the log](/build-log/log/) and [a post](/build-log/other-post/#fix)',
    '',
    '[ref]: /build-log/images/a/ref.png',
    '',
    '<img src="/build-log/images/a/c.png" alt="c"> <a href=\'/build-log/\'>home</a>',
  ].join('\n');
  const expected = [
    `![chart](${abs}/images/a/chart.svg)`,
    `![alt](<${abs}/images/a/b.svg> "title")`,
    `see [the log](${abs}/log/) and [a post](${abs}/other-post/#fix)`,
    '',
    `[ref]: ${abs}/images/a/ref.png`,
    '',
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

test('rewrites raw html nested inside links as well as the link itself', () => {
  const input = [
    '[<img src="/build-log/x.svg">](/build-log/y/)',
    '[<img src="/build-log/a.svg" alt="a"> and <a href=\'/build-log\'>home</a>](/build-log)',
    '[![i](/build-log/i.svg) <img src="/build-log/j.svg">](/build-log/k/)',
    '[`<img src="/build-log/code.svg">` <img src="/build-log/real.svg">](/build-log/z/)',
  ].join('\n\n');
  const expected = [
    `[<img src="${abs}/x.svg">](${abs}/y/)`,
    `[<img src="${abs}/a.svg" alt="a"> and <a href='${abs}'>home</a>](${abs})`,
    `[![i](${abs}/i.svg) <img src="${abs}/j.svg">](${abs}/k/)`,
    `[\`<img src="/build-log/code.svg">\` <img src="${abs}/real.svg">](${abs}/z/)`,
  ].join('\n\n');
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('returns empty and whitespace-only input unchanged', () => {
  for (const input of ['', '\n', '  \n\n']) assert.equal(absolutizeSiteUrls(input, root), input);
});

test('leaves inline code in image alt text alone and rewrites only the destination', () => {
  const input = '![`](/build-log/x)`](/build-log/images/o.png) ![`](/build-log/x)`](/other.png)';
  const expected = `![\`](/build-log/x)\`](${abs}/images/o.png) ![\`](/build-log/x)\`](/other.png)`;
  assert.equal(absolutizeSiteUrls(input, root), expected);
});

test('leaves escaped link syntax in link text alone', () => {
  assert.equal(
    absolutizeSiteUrls('[see \\](/build-log/x) here](/build-log/y)', root),
    `[see \\](/build-log/x) here](${abs}/y)`,
  );
});
