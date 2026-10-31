import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDiff, formatPrompt, parseVerdict } from './antigravity-review.mjs';

test('filterDiff: suppresses package-lock.json diff noise', () => {
  const mockDiff = `diff --git a/package-lock.json b/package-lock.json
index 123..456 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,5 +1,6 @@
+ "new-dep": "1.0.0"
diff --git a/src/index.ts b/src/index.ts
--- a/src/index.ts
+++ b/src/index.ts
+console.log('hello');`;

  const filtered = filterDiff(mockDiff);
  assert.match(filtered, /\[Lockfile \/ auto-sync file omitted from review\]/);
  assert.match(filtered, /console\.log\('hello'\)/);
});

test('filterDiff: handles binary image files cleanly', () => {
  const mockDiff = `diff --git a/public/og-image.png b/public/og-image.png
Binary files a/public/og-image.png and b/public/og-image.png differ`;

  const filtered = filterDiff(mockDiff);
  assert.match(filtered, /\[Binary asset modified\]/);
});

test('formatPrompt: compiles PR metadata and instructions', () => {
  const pr = {
    number: 42,
    title: 'Add social card generator',
    body: 'Generates SVG-based cards with satori',
    author: { login: 'mikepred' },
    baseRefName: 'main',
    headRefName: 'feature/cards'
  };

  const prompt = formatPrompt({ pr, diff: '+const test = 1;' });
  assert.match(prompt, /PR #42: Add social card generator/);
  assert.match(prompt, /mikepred/);
  assert.match(prompt, /Astro/);
  assert.match(prompt, /\+const test = 1;/);
});

test('parseVerdict: accurately classifies review verdicts', () => {
  assert.equal(parseVerdict('Verdict: ✅ Approve'), 'APPROVE');
  assert.equal(parseVerdict('Verdict: ⚠️ Needs Changes - broken types'), 'REQUEST_CHANGES');
  assert.equal(parseVerdict('Verdict: 💬 Suggestions regarding styles'), 'COMMENT');
});
