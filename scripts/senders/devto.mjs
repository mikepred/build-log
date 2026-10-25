import { ScriptError } from '../errors.mjs';

const ARTICLES_URL = 'https://dev.to/api/articles';
const TAG_LIMIT = 4;
const TAG_LENGTH = 30;
const USER_AGENT = 'mikepred-build-log';

export const id = 'devto';

let cachedArticles = null;

export function disabledReason() {
  if (!process.env.DEVTO_API_KEY?.trim()) {
    return 'DEVTO_API_KEY is not set. Skipping dev.to.';
  }
  return null;
}

export function sanitizeTags(tags) {
  const cleaned = [];
  const notes = [];
  for (const tag of tags) {
    const alphanumeric = String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, TAG_LENGTH);
    if (!alphanumeric) {
      notes.push(`dropped "${tag}" (empty after sanitizing)`);
      continue;
    }
    if (cleaned.includes(alphanumeric)) {
      notes.push(`dropped "${tag}" (duplicate of ${alphanumeric})`);
      continue;
    }
    if (cleaned.length >= TAG_LIMIT) {
      notes.push(`dropped "${tag}" (dev.to allows ${TAG_LIMIT} tags)`);
      continue;
    }
    if (alphanumeric !== String(tag)) notes.push(`${tag} -> ${alphanumeric}`);
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

/** Prefer the stored id. Otherwise update a canonical_url match, or create. */
export function resolveDevtoTarget(previous, matches) {
  if (previous?.id) return { action: 'update', id: String(previous.id) };
  if (matches?.length) return { action: 'update', id: String(matches[0].id) };
  return { action: 'create', id: null };
}

export function plan(entry, previous) {
  const { tags, notes } = sanitizeTags(entry.tags);
  if (previous?.id) notes.push(`updating article ${previous.id}`);
  else notes.push('no stored id; a live run updates a canonical_url match before creating');
  const request = {
    article: {
      title: entry.title,
      body_markdown: entry.body,
      published: true,
      tags,
      description: entry.summary,
      canonical_url: entry.canonicalUrl,
    },
  };
  return {
    operation: previous?.id ? 'update' : 'create',
    request,
    notes,
  };
}

export async function publish({ entry, previous }) {
  const planned = plan(entry, previous);
  const apiKey = process.env.DEVTO_API_KEY.trim();
  const target = await resolveLiveTarget(apiKey, entry, previous);
  if (target.action === 'update') {
    const updated = await foremRequest('PUT', `${ARTICLES_URL}/${target.id}`, apiKey, planned.request);
    return { ...remoteFrom(updated, entry.canonicalUrl), action: 'update' };
  }
  const created = await foremRequest('POST', ARTICLES_URL, apiKey, planned.request);
  if (cachedArticles) {
    cachedArticles.push({ id: created?.id, canonical_url: entry.canonicalUrl });
  }
  return { ...remoteFrom(created, entry.canonicalUrl), action: 'create' };
}

async function resolveLiveTarget(apiKey, entry, previous) {
  if (previous?.id) {
    return { action: 'update', id: String(previous.id) };
  }
  const matches = findExistingArticles(await listMyArticles(apiKey), entry.canonicalUrl);
  if (matches.length > 1) {
    const ids = matches.map((article) => article.id).join(', ');
    console.warn(
      `::warning::${matches.length} dev.to articles share canonical_url ${entry.canonicalUrl} (ids ${ids}). Updating ${matches[0].id}.`,
    );
  }
  return resolveDevtoTarget(null, matches);
}

function remoteFrom(article, fallbackUrl) {
  if (!article?.id) throw new ScriptError('dev.to did not return an article id.');
  return { id: String(article.id), url: article.url || fallbackUrl };
}

async function listMyArticles(apiKey) {
  if (cachedArticles) return cachedArticles;
  const articles = [];
  for (let page = 1; page <= 50; page += 1) {
    const url = new URL(`${ARTICLES_URL}/me/all`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '1000');
    const batch = await foremRequest('GET', url, apiKey);
    if (!Array.isArray(batch)) {
      throw new ScriptError('GET /api/articles/me/all did not return a list.');
    }
    articles.push(...batch);
    if (batch.length < 1000) {
      cachedArticles = articles;
      return articles;
    }
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
