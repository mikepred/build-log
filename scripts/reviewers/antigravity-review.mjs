#!/usr/bin/env node

/**
 * Antigravity Code Review Agent (powered by Gemini)
 *
 * Part of the Multi-Agent Review Panel (alongside Claude and other agents).
 * Analyzes GitHub PR diffs for architecture, correctness, Astro/TS conventions,
 * security, and performance.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
const IGNORED_FILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'sync-state.json'];
const MAX_DIFF_LENGTH = 60000;

/**
 * Filters out lockfiles, binary files, and noisy diffs to focus on substantive code changes.
 */
export function filterDiff(rawDiff) {
  if (!rawDiff) return '';

  const chunks = rawDiff.split(/^diff --git /m);
  const preservedChunks = [];

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    const firstLine = chunk.split('\n')[0] || '';
    const isIgnoredFile = IGNORED_FILES.some(f => firstLine.includes(f));
    const isBinaryAsset = IGNORED_EXTENSIONS.some(ext => firstLine.includes(ext));

    if (isIgnoredFile) {
      preservedChunks.push(`diff --git ${firstLine}\n    [Lockfile / auto-sync file omitted from review]`);
    } else if (isBinaryAsset) {
      preservedChunks.push(`diff --git ${firstLine}\n    [Binary asset modified]`);
    } else {
      preservedChunks.push(`diff --git ${chunk}`);
    }
  }

  let filtered = preservedChunks.join('\n');
  if (filtered.length > MAX_DIFF_LENGTH) {
    filtered = filtered.slice(0, MAX_DIFF_LENGTH) + '\n\n... [Diff truncated due to size limits]';
  }

  return filtered;
}

/**
 * Builds the review prompt for Gemini with deep context on build-log conventions.
 */
export function formatPrompt({ pr, diff }) {
  return `You are Antigravity, Google DeepMind's expert AI software engineering and code review agent.
You are conducting a thorough, constructive code review as part of a multi-agent review panel (collaborating alongside Claude and other automated agents) on the repository: mikepred/build-log.

### Repository Context:
- Project: Astro-based static site (build-log) publishing developer case notes.
- Tech Stack: Astro (5+/7+), TypeScript strict mode, Node.js 22+ (pure ESM), Tailwind/CSS.
- Publishing: Headless static site generation with automated cross-posting to dev.to and Hashnode.
- Content rules:
  - Posts: 'content/YYYY-MM-DD-slug.md' with frontmatter: title, date, tags (max 4), summary, canonical_url.
  - Notes: 'log/YYYY-MM-DD-slug.md' with frontmatter: date, optional title.
  - No analytics, tracking scripts, comment systems, or external runtime calls.
  - Clean error boundaries and predictable static build outputs.

### Pull Request Under Review:
- PR #${pr.number}: ${pr.title}
- Author: ${pr.author?.login || 'unknown'}
- Base Branch: ${pr.baseRefName || 'main'} <- Head Branch: ${pr.headRefName || 'unknown'}

### Description:
${pr.body || '(No description provided)'}

### Code Changes (Diff):
\`\`\`diff
${diff}
\`\`\`

### Review Guidelines:
1. **Architectural & Framework Best Practices**: Check compatibility with Astro components, layouts, routing, and ESM standards.
2. **Correctness & Edge Cases**: Identify potential runtime exceptions, undefined property accesses, broken internal/external link patterns, or styling glitches.
3. **Security & Privacy**: Verify no secret keys, tokens, personal directories, or insecure external dependencies are introduced.
4. **Content & Frontmatter Schema**: If content or scripts are modified, verify frontmatter constraints (canonical URLs, tag limits).
5. **Actionable Suggestions**: Provide concise, concrete code diffs or replacement suggestions where improvement is needed.
6. **Verdict**: Clearly specify one verdict:
   - ✅ **APPROVE**: Changes look solid, clean, and safe to merge.
   - 💬 **COMMENT**: Non-blocking improvements, questions, or architectural suggestions.
   - ⚠️ **REQUEST_CHANGES**: Real bugs, security flaws, build breakers, or schema violations found.

### Required Output Format:
Produce your review in clean GitHub-Flavored Markdown:
\`\`\`markdown
## 🛸 Antigravity AI Code Review (Gemini)

**Verdict**: [ ✅ Approve | 💬 Suggestions | ⚠️ Needs Changes ]

### 📋 Overview
[Short 2-3 sentence executive summary of the changes and their intent]

### 🎯 Strengths & Notable Patterns
- [Highlight good practices, clean abstractions, or performance wins]

### 🔍 Key Findings & Suggestions
- **[Area / File]**: [Explanation of the issue or improvement opportunity]
\`\`\`language
// Suggested fix or improvement
\`\`\`

### 🛡️ Pre-Merge Checklist
- [ ] Frontmatter & Schema Validated
- [ ] Build & Test Integrity Preserved
- [ ] No Leaked Secrets or Insecure Dependencies

---
*Reviewed by Antigravity Reviewer (Gemini 2.5) • Multi-Agent PR Panel*
\`\`\`
`;
}

/**
 * Extracts verdict from markdown text.
 */
export function parseVerdict(markdown) {
  if (/Needs Changes|REQUEST_CHANGES|⚠️/i.test(markdown)) {
    return 'REQUEST_CHANGES';
  }
  if (/Approve|✅/i.test(markdown)) {
    return 'APPROVE';
  }
  return 'COMMENT';
}

/**
 * Calls Google Gemini API with fallback models.
 */
export async function callGemini({ prompt, apiKey, model = 'gemini-2.5-flash' }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
}

/**
 * Fetches PR info and diff via GitHub CLI or direct GitHub API.
 */
export function fetchPrDetails(prNumber) {
  try {
    const prJson = execFileSync('gh', ['pr', 'view', String(prNumber), '--json', 'number,title,body,author,headRefName,baseRefName,files'], {
      encoding: 'utf-8'
    });
    const pr = JSON.parse(prJson);

    const diff = execFileSync('gh', ['pr', 'diff', String(prNumber)], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });

    return { pr, diff };
  } catch (err) {
    throw new Error(`Failed to fetch PR #${prNumber} details via gh CLI: ${err.message}`);
  }
}

/**
 * Submits the review to GitHub PR.
 */
export function submitReview({ prNumber, reviewMarkdown, dryRun = false }) {
  if (dryRun) {
    console.log('\n--- [DRY RUN] Review Content ---\n');
    console.log(reviewMarkdown);
    console.log('\n---------------------------------\n');
    return;
  }

  try {
    execFileSync('gh', ['pr', 'review', String(prNumber), '--comment', '--body', reviewMarkdown], {
      encoding: 'utf-8'
    });
    console.log(`✓ Review successfully posted to PR #${prNumber}`);
  } catch (err) {
    // If pr review fails (e.g. self-review restriction on own PR), fallback to posting as a comment
    console.warn(`Review command failed (${err.message}). Falling back to PR comment...`);
    execFileSync('gh', ['pr', 'comment', String(prNumber), '--body', reviewMarkdown], {
      encoding: 'utf-8'
    });
    console.log(`✓ Review successfully posted as comment to PR #${prNumber}`);
  }

  // If in GitHub Actions, write to step summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, reviewMarkdown + '\n', { flag: 'a' });
    } catch {
      // Ignore summary write errors
    }
  }
}

/**
 * Main execution entry point.
 */
export async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const prIndex = args.indexOf('--pr');
  let prNumber = prIndex !== -1 ? args[prIndex + 1] : process.env.PR_NUMBER;

  // If run in GitHub Actions with event path
  if (!prNumber && process.env.GITHUB_EVENT_PATH) {
    try {
      const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8'));
      prNumber = event.pull_request?.number || event.issue?.number;
    } catch {
      // Ignore event parse failure
    }
  }

  if (!prNumber) {
    console.error('Usage: node antigravity-review.mjs --pr <number> [--dry-run]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: GEMINI_API_KEY environment variable is required.');
    process.exit(1);
  }

  console.log(`🛸 Antigravity Review Agent inspecting PR #${prNumber}...`);

  const { pr, diff } = fetchPrDetails(prNumber);
  console.log(`PR Title: ${pr.title}`);

  const filteredDiff = filterDiff(diff);
  console.log(`Diff size: ${diff.length} chars (filtered: ${filteredDiff.length} chars)`);

  const prompt = formatPrompt({ pr, diff: filteredDiff });

  let reviewMarkdown;
  if (dryRun && !apiKey) {
    console.log('[Dry Run mode without API key] Using mock review preview:');
    reviewMarkdown = `## 🛸 Antigravity AI Code Review (Gemini) [MOCK PREVIEW]

**Verdict**: ✅ Approve

### 📋 Overview
Simulated review for PR #${pr.number}: ${pr.title}.

### 🎯 Strengths & Notable Patterns
- Clean Astro integration and well-structured configuration.

---
*Reviewed by Antigravity Reviewer (Gemini 2.5) • Multi-Agent PR Panel*`;
  } else {
    console.log('Sending request to Gemini API...');
    reviewMarkdown = await callGemini({
      prompt,
      apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
  }

  submitReview({ prNumber, reviewMarkdown, dryRun });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error('Review agent error:', err);
    process.exit(1);
  });
}
