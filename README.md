# build-log

Case notes from real work: things that broke, how I tracked them down, and what I changed so they don't break again. Windows, automation, AI agents, and dev tooling. Each post has a quick case file, the story, and copy-paste steps to do it yourself.

This repo is the source. Read it here:

- Site (the original): <https://mikepred.github.io/build-log/>
- dev.to: <https://dev.to/mikepred>
- Hashnode: <https://mikepred.hashnode.dev>
- RSS: <https://mikepred.github.io/build-log/rss.xml>

No analytics, newsletter, affiliate links, or calls to action.

## What's where

| Path | What it is |
| --- | --- |
| `content/` | Posts, one Markdown file each: `content/YYYY-MM-DD-slug.md`. The only originals. |
| `log/` | The [running log](https://mikepred.github.io/build-log/log/): short dated notes, site only. |
| `social/` | Draft social posts for each post, one folder per slug. Not published by anything here. |
| `src/` | The Astro site: layout, pages, RSS feed. |
| `scripts/` | Cross-posting (`crosspost.mjs` plus one sender per platform in `senders/`) and its tests. |
| `public/` | Static files: images, favicon, `og-default.png`, `robots.txt`. |

## How publishing works

- **Merge to `main` deploys the site.** GitHub Actions builds it with Astro and pushes it to GitHub Pages.
- **The same push cross-posts.** [`scripts/crosspost.mjs`](scripts/crosspost.mjs) looks at files in `content/` that were added or changed in that push and sends each one to dev.to and Hashnode with the post's `canonical_url`, so both point back to the site. Pushes that don't touch `content/` just find nothing to send.
- **`log/**` is ignored by the cross-post workflow,** so a log-only push just redeploys the site.
- Edit a post here and the next push updates the copies. Edits made on dev.to or Hashnode get overwritten.
- Remote post ids live in [`sync-state.json`](sync-state.json). The workflow commits it back with `[skip ci]`, so it doesn't loop.

The site also ships a sitemap (`sitemap-index.xml`), an RSS feed of posts (no log notes), and Open Graph/Twitter cards plus JSON-LD on every post.

## One-time setup

- **Pages source:** in **Settings → Pages**, set the source to **GitHub Actions**. Until then the deploy workflow has nowhere to publish.
- **Actions secrets** (Settings → Secrets and variables → Actions): `DEVTO_API_KEY` for dev.to, `HASHNODE_TOKEN` and `HASHNODE_PUBLICATION_ID` for Hashnode. A sender with a missing secret warns and is skipped; the site deploy doesn't use them.
- **Hashnode failures** (auth, plan, or API error) show up as one `Hashnode FAILED: …` line in the job log and step summary. That post isn't written to `sync-state.json`, the other senders still run, and the job exits 0.
- **Adding a platform:** add one file in `scripts/senders/` that exports `id`, `disabledReason`, `plan`, and `publish`. `plan` must not touch the network.

## Post frontmatter

All five fields are required:

```markdown
---
title: "Scheduled task that never fired"
date: 2026-10-24          # the day it's published
tags: [powershell, windows]   # 4 max (dev.to's limit)
summary: "One or two sentences. Used as the meta description, dev.to description and Hashnode subtitle."
canonical_url: "https://mikepred.github.io/build-log/scheduled-task-that-never-fired/"
---
```

The filename's date prefix is dropped from the URL: `content/2026-10-24-foo-bar.md` → `/build-log/foo-bar/`. Keep `canonical_url` pointing at that URL and don't change it later; dev.to and Hashnode use it as the post's identity. `tags`, `index`, `404`, `rss.xml`, and `log` are reserved slugs.

Log notes are lighter:

```markdown
---
date: 2026-10-30
title: optional heading
---

a few casual lines about what happened.
```

## Run it locally

Node.js 22.23.4 or newer.

```bash
npm install
npm run dev       # serves under /build-log/
npm run build     # writes dist/
npm test          # cross-post script tests
node scripts/crosspost.mjs --dry-run content/2026-10-24-foo-bar.md   # no network
```

## Licenses

Code and snippets (including the commands inside posts) are [MIT](LICENSE). The posts themselves in `content/` are [CC BY 4.0](LICENSE-content).
