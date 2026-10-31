import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { execFileSync } from 'node:child_process';

const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const files = (await readdir('content')).filter(f => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f)).sort();
const entries = [];
for (const file of files) {
  const { data, content } = matter(await readFile(`content/${file}`, 'utf8'));
  const slug = file.slice(11, -3);
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
  entries.push({ slug, title: data.title, date, summary: data.summary, tags: data.tags, canonical_url: data.canonical_url, body: content });
}
const snapshot = JSON.stringify({ commit, entries });
if (process.argv.includes('--stdout')) process.stdout.write(snapshot);
else {
  const site = process.env.JOURNAL_URL, access = process.env.JOURNAL_SITE_ACCESS, secret = process.env.JOURNAL_SYNC_SECRET;
  if (!site || !access || !secret) throw new Error('Missing journal sync configuration');
  const response = await fetch(`${site}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'OAI-Sites-Authorization': `Bearer ${access}`, 'Authorization': `Bearer ${secret}` }, body: snapshot });
  if (!response.ok) throw new Error(`Journal sync failed: ${response.status} ${await response.text()}`);
  console.log(await response.text());
}
