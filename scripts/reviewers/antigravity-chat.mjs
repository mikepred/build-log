#!/usr/bin/env node

/**
 * Antigravity Interactive Comment Responder
 * Responds to @antigravity mentions in PRs and issues.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { callGemini } from './antigravity-review.mjs';

export async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error('GITHUB_EVENT_PATH environment variable is required.');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured in repository secrets.');
    process.exit(0);
  }

  const event = JSON.parse(readFileSync(eventPath, 'utf-8'));
  const comment = event.comment || event.review || event.issue;
  const commentBody = comment?.body || '';

  if (!commentBody.toLowerCase().includes('@antigravity')) {
    console.log('Comment does not contain @antigravity mention. Exiting.');
    process.exit(0);
  }

  const isPr = Boolean(event.issue?.pull_request || event.pull_request);
  const issueOrPrNumber = event.issue?.number || event.pull_request?.number;

  console.log(`🛸 Antigravity mentioned on ${isPr ? 'PR' : 'Issue'} #${issueOrPrNumber}`);

  // If comment specifically asks for a code review (e.g., "@antigravity review")
  if (isPr && /\b(review|re-review|check)\b/i.test(commentBody)) {
    console.log('Triggering full PR review via antigravity-review.mjs...');
    execFileSync('node', ['scripts/reviewers/antigravity-review.mjs', '--pr', String(issueOrPrNumber)], {
      stdio: 'inherit',
      env: process.env
    });
    return;
  }

  // Otherwise, handle as interactive assistant response
  const prompt = `You are Antigravity, Google DeepMind's expert software engineering agent for mikepred/build-log.
The user tagged you in a comment on ${isPr ? 'Pull Request' : 'Issue'} #${issueOrPrNumber}:

User Comment:
"""
${commentBody}
"""

Please provide a helpful, concise, technically accurate response in GitHub markdown.
Context:
- Project: Astro-based static blog publishing developer case notes.
- Focus: Technical accuracy, Astro 5+/7+, TypeScript, cross-posting automation, and zero-bloat static sites.
Sign your reply with:
> *🛸 Antigravity Assistant (Gemini)*
`;

  console.log('Querying Gemini...');
  const reply = await callGemini({
    prompt,
    apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  });

  console.log('Posting comment reply...');
  try {
    execFileSync('gh', [isPr ? 'pr' : 'issue', 'comment', String(issueOrPrNumber), '--body', reply], {
      encoding: 'utf-8'
    });
    console.log('✓ Reply posted successfully.');
  } catch (err) {
    console.error('Failed to post comment:', err.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error('Antigravity chat handler error:', err);
    process.exit(1);
  });
}
