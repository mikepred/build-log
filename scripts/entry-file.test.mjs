import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RESERVED_SLUGS, slugFromEntryPath } from './entry-file.mjs';

test('RESERVED_SLUGS covers static page routes that collide with entry URLs', () => {
  for (const slug of ['about', 'start-here', 'projects', 'index', 'tags', '404', 'rss.xml', 'log']) {
    assert.equal(RESERVED_SLUGS.has(slug), true, `expected "${slug}" to be reserved`);
  }
});

test('slugFromEntryPath rejects reserved static page slugs', () => {
  for (const slug of ['about', 'start-here', 'projects']) {
    assert.throws(
      () => slugFromEntryPath(`content/2026-01-01-${slug}.md`),
      /reserved and cannot be used/,
    );
  }
});
