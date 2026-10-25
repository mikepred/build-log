import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import matter from 'gray-matter';
import { ScriptError } from './errors.mjs';
import { isContentEntryPath, slugFromEntryPath } from './entry-file.mjs';

/**
 * One parsed entry. Senders receive this object and do not read frontmatter.
 * The markdown schema stays title, date, tags, summary, and canonical_url.
 */
export function entryFromFile(filePath) {
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
  const date = requireDate(data.date, filePath);
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

  return {
    file: normalized,
    slug: slugFromEntryPath(normalized),
    title,
    date: date.toISOString(),
    tags,
    summary,
    canonicalUrl,
    body,
  };
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
  return date;
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
