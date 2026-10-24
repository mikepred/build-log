import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { isContentEntryPath, slugFromEntryPath } from './entry-file.mjs';

const DEVTO_ARTICLES_URL = 'https://dev.to/api/articles';
const DEVTO_TAG_LIMIT = 4;
const DEVTO_TAG_LENGTH = 30;
const USER_AGENT = 'mikepred-build-log';

const USAGE = `Usage: node scripts/devto-crosspost.mjs [--dry-run] [content/YYYY-MM-DD-slug.md ...]

With no file arguments, changed entry files are taken from git diff
BEFORE_SHA...GITHUB_SHA (set by the GitHub Actions workflow).
A BEFORE_SHA of all zeros lists every entry file at GITHUB_SHA.

--dry-run parses entries and prints the Forem payload. It does not use the network.
If DEVTO_API_KEY is unset and this is not a dry run, the script warns and exits 0.`;

class ScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScriptError';
  }
}

export function sanitizeTags(tags) {
  const cleaned = [];
  const notes = [];
  for (const tag of tags) {
    const alphanumeric = String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, DEVTO_TAG_LENGTH);
    if (!alphanumeric) {
      notes.push(`dropped "${tag}" (empty after sanitizing)`);
      continue;
    }
    if (cleaned.includes(alphanumeric)) {
      notes.push(`dropped "${tag}" (duplicate of ${alphanumeric})`);
      continue;
    }
    if (cleaned.length >= DEVTO_TAG_LIMIT) {
      notes.push(`dropped "${tag}" (dev.to allows ${DEVTO_TAG_LIMIT} tags)`);
      continue;
    }
    if (alphanumeric !== String(tag)) {
      notes.push(`${tag} -> ${alphanumeric}`);
    }
    cleaned.push(alphanumeric);
  }
  return { tags: cleaned, notes };
}

export function findExistingArticles(articles, canonicalUrl) {
  const target = canonicalUrl.trim();
  return articles.filter(
    (article) =>
      typeof article?.canonical_url === 'string' && article.canonical_url.trim() === target,
  );
}

export function articleFromFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (!isContentEntryPath(normalized) || !isInsideContent(filePath)) {
    throw new ScriptError(
      `${filePath} is not an entry file. Expected content/YYYY-MM-DD-slug.md.`,
    );
  }

  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScriptError(`Could not read ${filePath}: ${message}`);
  }

  const parsed = matter(raw);
  const data = parsed.data ?? {};
  const title = requireNonEmptyString(data.title, 'title', filePath);
  requireDate(data.date, filePath);
  const summary = requireNonEmptyString(data.summary, 'summary', filePath);
  const canonicalUrl = requireUrl(data.canonical_url, filePath);
  const tags = requireTags(data.tags, filePath);
  const body = parsed.content.replace(/^\r?\n/, '');
  if (body.trim() === '') {
    throw new ScriptError(`${filePath}: entry body is empty.`);
  }
  if (body.startsWith('---')) {
    throw new ScriptError(`${filePath}: body still starts with frontmatter.`);
  }

  const { tags: devtoTags, notes } = sanitizeTags(tags);
  const slug = slugFromEntryPath(normalized);
  const article = {
    title,
    body_markdown: body,
    published: true,
    tags: devtoTags,
    description: summary,
    canonical_url: canonicalUrl,
  };

  return { file: normalized, slug, article, tagNotes: notes };
}

export function changedEntryPaths(before, after) {
  assertSha(after, 'GITHUB_SHA');
  const zero = /^0+$/.test(before);
  if (!zero) assertSha(before, 'BEFORE_SHA');
  const args = zero
    ? ['ls-tree', '-r', '--name-only', after, '--', 'content']
    : ['diff', '--name-only', '--diff-filter=ACMR', '-M', before, after, '--', 'content'];
  let output;
  try {
    output = execFileSync('git', args, { encoding: 'utf8' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScriptError(`Could not list changed entry files: ${message}`);
  }
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isContentEntryPath);
}

function isInsideContent(filePath) {
  const rel = relative(resolve('content'), resolve(filePath));
  return rel !== '' && !rel.startsWith('..');
}

function requireNonEmptyString(value, field, filePath) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ScriptError(`${filePath}: frontmatter ${field} must be a non-empty string.`);
  }
  return value;
}

function requireUrl(value, filePath) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ScriptError(`${filePath}: frontmatter canonical_url must be a URL string.`);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new ScriptError(`${filePath}: frontmatter canonical_url must be an http(s) URL.`);
  }
  return value.trim();
}

function requireDate(value, filePath) {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    throw new ScriptError(`${filePath}: frontmatter date must be a date.`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ScriptError(`${filePath}: frontmatter date must be a date.`);
  }
}

function requireTags(value, filePath) {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) {
    throw new ScriptError(`${filePath}: frontmatter tags must be an array of strings.`);
  }
  return value;
}

function assertSha(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/i.test(value)) {
    throw new ScriptError(`${name} must be a 40-character commit SHA.`);
  }
}

function resolveFiles(fileArgs) {
  if (fileArgs.length > 0) return fileArgs;
  const before = process.env.BEFORE_SHA ?? '';
  const after = process.env.GITHUB_SHA ?? '';
  if (!before || !after) {
    throw new ScriptError(`Pass entry files, or set BEFORE_SHA and GITHUB_SHA.\n\n${USAGE}`);
  }
  return changedEntryPaths(before, after);
}

async function listMyArticles(apiKey) {
  const articles = [];
  for (let page = 1; page <= 50; page += 1) {
    const url = new URL(`${DEVTO_ARTICLES_URL}/me/all`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '1000');
    const batch = await foremRequest('GET', url, apiKey);
    if (!Array.isArray(batch)) {
      throw new ScriptError('GET /api/articles/me/all did not return a list.');
    }
    articles.push(...batch);
    if (batch.length < 1000) return articles;
  }
  throw new ScriptError('Stopped after 50 pages of /api/articles/me/all; refusing to risk a duplicate.');
}

async function foremRequest(method, url, apiKey, payload) {
  const headers = {
    'api-key': apiKey,
    accept: 'application/json',
    'user-agent': USER_AGENT,
  };
  if (payload) headers['content-type'] = 'application/json';

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ScriptError(`${method} ${url} failed: ${message}`);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new ScriptError(`${method} ${url} failed (${response.status}): ${text}`);
  }
  if (text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ScriptError(`${method} ${url} returned non-JSON: ${text.slice(0, 500)}`);
  }
}

async function upsert(apiKey, entry, existing) {
  const matches = findExistingArticles(existing, entry.article.canonical_url);
  const payload = { article: entry.article };
  if (matches.length > 1) {
    const ids = matches.map((article) => article.id).join(', ');
    console.warn(
      `::warning::${matches.length} dev.to articles share canonical_url ${entry.article.canonical_url} (ids ${ids}). Updating ${matches[0].id}.`,
    );
  }

  if (matches.length > 0) {
    const id = matches[0].id;
    if (!Number.isInteger(id)) {
      throw new ScriptError(`Existing article for ${entry.file} has no numeric id.`);
    }
    const updated = await foremRequest('PUT', `${DEVTO_ARTICLES_URL}/${id}`, apiKey, payload);
    console.log(`Updated dev.to article ${id} from ${entry.file} (${updated?.url ?? entry.article.canonical_url}).`);
    return;
  }

  const created = await foremRequest('POST', DEVTO_ARTICLES_URL, apiKey, payload);
  console.log(
    `Created dev.to article ${created?.id ?? '(no id)'} from ${entry.file} (${created?.url ?? entry.article.canonical_url}).`,
  );
  existing.push({
    id: created?.id,
    canonical_url: entry.article.canonical_url,
  });
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const fileArgs = argv.filter((arg) => arg !== '--dry-run');
  const unknown = fileArgs.filter((arg) => arg.startsWith('--'));
  if (unknown.length > 0) {
    throw new ScriptError(`Unknown argument ${unknown[0]}.\n\n${USAGE}`);
  }
  return { dryRun, fileArgs };
}

async function main() {
  const { dryRun, fileArgs } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.DEVTO_API_KEY?.trim() ?? '';

  if (!dryRun && !apiKey) {
    console.warn('::warning::DEVTO_API_KEY is not set. Skipping dev.to cross-post.');
    return;
  }

  const files = resolveFiles(fileArgs);
  if (files.length === 0) {
    console.warn('No content entries to cross-post.');
    if (dryRun) console.log('[]');
    return;
  }

  const entries = files.map((file) => articleFromFile(file));
  for (const entry of entries) {
    if (entry.tagNotes.length > 0) {
      console.warn(`${entry.file} tags: ${entry.tagNotes.join('; ')}`);
    }
  }

  if (dryRun) {
    const payload = entries.map(({ file, slug, article }) => ({ file, slug, article }));
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const existing = await listMyArticles(apiKey);
  for (const entry of entries) {
    await upsert(apiKey, entry, existing);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(realpathSync(entry)).href;
}

if (isDirectRun()) {
  main().catch((error) => {
    if (error instanceof ScriptError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });
}
