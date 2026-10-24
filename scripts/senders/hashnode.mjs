import { ScriptError } from '../errors.mjs';

const ENDPOINT = 'https://gql.hashnode.com';
const USER_AGENT = 'mikepred-build-log';

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
    return {
      operation: 'updatePost',
      request: {
        query: UPDATE_MUTATION,
        variables: { input: { id: String(previous.id), ...fields } },
      },
      notes,
    };
  }
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
  const planned = plan(entry, previous);
  const token = process.env.HASHNODE_TOKEN.trim();
  const data = await graphql(planned.request, token);
  const post = planned.operation === 'updatePost' ? data.updatePost?.post : data.publishPost?.post;
  if (!post?.id || !post?.url) {
    throw new ScriptError(`Hashnode ${planned.operation} did not return a post id and url.`);
  }
  return {
    id: String(post.id),
    url: String(post.url),
    action: previous?.id ? 'update' : 'create',
  };
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
    throw new ScriptError(`Hashnode request failed: ${message}`);
  }

  const text = await response.text();
  let body;
  try {
    body = text.trim() === '' ? {} : JSON.parse(text);
  } catch {
    throw new ScriptError(`Hashnode returned non-JSON (${response.status}): ${text.slice(0, 500)}`);
  }
  if (!response.ok || (Array.isArray(body.errors) && body.errors.length > 0)) {
    const messages = Array.isArray(body.errors)
      ? body.errors.map((error) => error.message).join('; ')
      : text.slice(0, 500);
    throw new ScriptError(`Hashnode request failed (${response.status}): ${messages}`);
  }
  return body.data ?? {};
}
