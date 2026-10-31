import { appendFileSync } from 'node:fs';
import { HashnodeApiError } from '../errors.mjs';

// Hashnode retired gql.hashnode.com (it 301s to a paid-API notice); the
// official @hashnode/cli uses gql-beta.hashnode.com.
const ENDPOINT = 'https://gql-beta.hashnode.com';
const USER_AGENT = 'mikepred-build-log';
const PAGE_SIZE = 50;
const MAX_PAGES = 40;

// Post.canonicalUrl is the stored originalArticleURL from PublishPostInput.
// https://apidocs.hashnode.com/ — publication(id).posts(first, after) is cursor-paginated.
const POSTS_QUERY = `query PublicationPosts($id: ObjectId!, $first: Int!, $after: String) {
  publication(id: $id) {
    posts(first: $first, after: $after) {
      edges {
        node { id slug url canonicalUrl }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const PUBLISH_MUTATION = `mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post { id url }
  }
}`;

const UPDATE_MUTATION = `mutation UpdatePost($input: UpdatePostInput!) {
  updatePost(input: $input) {
    post { id url }
  }
}`;

export const id = 'hashnode';

let cachedPosts = null;

export function disabledReason() {
  const missing = [];
  if (!process.env.HASHNODE_TOKEN?.trim()) missing.push('HASHNODE_TOKEN');
  if (!process.env.HASHNODE_PUBLICATION_ID?.trim()) missing.push('HASHNODE_PUBLICATION_ID');
  if (missing.length === 0) return null;
  const verb = missing.length === 1 ? 'is' : 'are';
  return `${missing.join(' and ')} ${verb} not set. Skipping Hashnode.`;
}

export function hashnodeTags(tags) {
  const cleaned = [];
  const notes = [];
  const seen = new Set();
  for (const tag of tags) {
    const name = String(tag).trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!name || !slug) {
      notes.push(`dropped "${tag}" (empty slug)`);
      continue;
    }
    if (seen.has(slug)) {
      notes.push(`dropped "${tag}" (duplicate of ${slug})`);
      continue;
    }
    seen.add(slug);
    cleaned.push({ slug, name });
  }
  return { tags: cleaned, notes };
}

/** Prefer an originalArticleURL match. Otherwise the same slug. */
export function findExistingHashnodePosts(posts, entry) {
  const canonical = entry.canonicalUrl.trim();
  const byCanonical = posts.filter((post) => canonicalOf(post) === canonical);
  if (byCanonical.length > 0) return byCanonical;
  return posts.filter((post) => post?.slug === entry.slug);
}

export function plan(entry, previous) {
  const { tags, notes } = hashnodeTags(entry.tags);
  const fields = {
    title: entry.title,
    subtitle: entry.summary,
    contentMarkdown: entry.body,
    originalArticleURL: entry.canonicalUrl,
    tags,
  };
  if (previous?.id) {
    notes.push(`updating post ${previous.id}`);
    return {
      operation: 'updatePost',
      request: {
        query: UPDATE_MUTATION,
        variables: { input: { id: String(previous.id), ...fields } },
      },
      notes,
    };
  }
  notes.push('no stored id; a live run updates a post with the same originalArticleURL or slug before creating');
  return {
    operation: 'publishPost',
    request: {
      query: PUBLISH_MUTATION,
      variables: {
        input: {
          ...fields,
          publicationId: process.env.HASHNODE_PUBLICATION_ID?.trim() || null,
        },
      },
    },
    notes,
  };
}

export async function publish({ entry, previous }) {
  try {
    const token = process.env.HASHNODE_TOKEN.trim();
    const publicationId = process.env.HASHNODE_PUBLICATION_ID.trim();
    const targetId = previous?.id
      ? String(previous.id)
      : await lookupExistingId(token, publicationId, entry);
    const planned = plan(entry, targetId ? { id: targetId } : null);
    const data = await graphql(planned.request, token);
    const post = targetId ? data.updatePost?.post : data.publishPost?.post;
    if (!post?.id || !post?.url) {
      throw new HashnodeApiError(`${planned.operation} did not return a post id and url`);
    }
    const remote = {
      id: String(post.id),
      url: String(post.url),
      action: targetId ? 'update' : 'create',
    };
    rememberListedPost(remote, entry);
    if (remote.action === 'create') reportPublished(remote.url);
    return remote;
  } catch (error) {
    if (error instanceof HashnodeApiError) return reportFailure(error.detail);
    throw error;
  }
}

async function lookupExistingId(token, publicationId, entry) {
  const posts = await listPublicationPosts(token, publicationId);
  const matches = findExistingHashnodePosts(posts, entry);
  if (matches.length > 1) {
    const ids = matches.map((post) => post.id).join(', ');
    console.warn(
      `::warning::${matches.length} Hashnode posts match ${entry.canonicalUrl} or slug ${entry.slug} (ids ${ids}). Updating ${matches[0].id}.`,
    );
  }
  return matches[0]?.id ? String(matches[0].id) : null;
}

async function listPublicationPosts(token, publicationId) {
  if (cachedPosts) return cachedPosts;
  const posts = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await graphql(
      { query: POSTS_QUERY, variables: { id: publicationId, first: PAGE_SIZE, after } },
      token,
    );
    if (!data.publication) throw new HashnodeApiError('publication not found');
    const connection = data.publication.posts;
    for (const edge of connection?.edges ?? []) {
      if (edge?.node) posts.push(edge.node);
    }
    if (!connection?.pageInfo?.hasNextPage) {
      cachedPosts = posts;
      return posts;
    }
    after = connection.pageInfo.endCursor;
    if (!after) throw new HashnodeApiError('publication posts page is missing endCursor');
  }
  throw new HashnodeApiError(
    `stopped after ${MAX_PAGES} pages of publication posts; refusing to risk a duplicate`,
  );
}

function rememberListedPost(remote, entry) {
  if (!cachedPosts) return;
  cachedPosts.push({
    id: remote.id,
    slug: entry.slug,
    url: remote.url,
    canonicalUrl: entry.canonicalUrl,
  });
}

function canonicalOf(post) {
  const value = post?.canonicalUrl ?? post?.originalArticleURL;
  return typeof value === 'string' ? value.trim() : '';
}

function reportFailure(detail) {
  const line = `Hashnode FAILED: ${detail}`;
  console.error(line);
  writeStepSummary(line);
  return { failed: true, message: line };
}

function reportPublished(url) {
  const line = `Hashnode published: ${url}`;
  console.log(line);
  writeStepSummary(line);
}

function writeStepSummary(line) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  appendFileSync(path, `${line}\n`);
}

async function graphql(request, token) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: token,
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': USER_AGENT,
      },
      body: JSON.stringify(request),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/redirect/i.test(message)) throw new HashnodeApiError('redirect');
    throw new HashnodeApiError(message);
  }

  const text = await response.text();
  let body;
  try {
    body = text.trim() === '' ? {} : JSON.parse(text);
  } catch {
    if (!response.ok) throw new HashnodeApiError(`${response.status} ${text.slice(0, 500)}`.trim());
    throw new HashnodeApiError(`${response.status} non-JSON response`);
  }
  const messages = Array.isArray(body.errors)
    ? body.errors.map((error) => error?.message).filter(Boolean).join('; ')
    : '';
  if (!response.ok || messages) {
    throw new HashnodeApiError(`${response.status} ${messages || text.slice(0, 500)}`.trim());
  }
  return body.data ?? {};
}
