import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { entryFromFile } from './entry.mjs';

test('cross-post canonical URL must match the site origin and base', () => {
  const original = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), 'build-log-entry-'));
  try {
    process.chdir(dir);
    mkdirSync('content');
    const path = 'content/2026-01-01-example.md';
    const writeEntry = (url) => writeFileSync(path, `---\ntitle: Example\ndate: 2026-01-01\ntags: []\nsummary: Example\ncanonical_url: ${url}\n---\n\n[home](/build-log/)\n`);
    writeEntry('https://mikepred.github.io/build-log/example/');
    assert.match(entryFromFile(path).body, /https:\/\/mikepred\.github\.io\/build-log\//);
    for (const url of ['https://example.com/build-log/example/', 'https://mikepred.github.io/wrong/example/']) {
      writeEntry(url);
      assert.throws(() => entryFromFile(path), /configured site origin and base/);
    }
  } finally {
    process.chdir(original);
    rmSync(dir, { recursive: true, force: true });
  }
});
