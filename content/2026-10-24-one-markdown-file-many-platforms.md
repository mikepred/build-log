---
title: "One markdown file, many platforms: how this build log publishes"
date: 2026-10-24
tags: [publishing, github-actions, astro, dev-to, hashnode, ai-assistants]
summary: "Microsoft 365 Copilot's plan for this build log was ten channels and fifty articles in six months. What I built instead is one markdown file per entry in a public repo, with a GitHub Action that builds the site and cross-posts to dev.to and Hashnode. The cross-posting has never actually run yet."
canonical_url: "https://mikepred.github.io/build-log/one-markdown-file-many-platforms/"
---

## Case file

- **Symptom:** the plan Microsoft 365 Copilot gave me for this build log had ten channels, affiliate links, calls to action, daily posts, and 50 articles in six months. I couldn't run that by hand, and most of it can't be automated.
- **Evidence:** Substack has no publishing API. Medium's API is mostly closed. My X connection can only make drafts. Hashnode's GraphQL API has needed a Pro plan since May 13, 2026.
- **Cause:** the plan treated every platform as a place to write, not as a copy of one original.
- **Fix:** one markdown file per entry in a public GitHub repo is the only original. On merge, a GitHub Action builds the Astro site on GitHub Pages and a cross-post script sends the entry to dev.to and Hashnode with a canonical link back. X, LinkedIn, Reddit and Facebook get drafts I post by hand.
- **Prevention (unproven):** a `sync-state.json` keyed by slug, a dev.to lookup by canonical URL, and a Hashnode duplicate guard are meant to stop double posts. **The dev.to and Hashnode auto-publish has never run.** The first entry that would trigger it hasn't merged.
- **Lesson:** fixed steps belong in code, not in another bot.

![The pipeline: one file in, copies out](/build-log/images/one-markdown-file-many-platforms/pipeline.svg)

## The story

This build log started with a Microsoft 365 Copilot plan. It was ambitious: ten channels, affiliate links, CTAs, daily posting, 50 articles in six months. I showed it to dr eggbot, one of my Grok Bot assistants. It kept the one part that made sense, a single markdown file in a GitHub repo as the source, published as an Astro site on GitHub Pages with canonical links. It called most of the rest a content farm.

Then we checked what could actually be automated. Substack has no publishing API. Medium's is mostly closed. The X connection I have only makes drafts. I said nix Substack and Medium, and drafts on X are fine. The unit of content would be one work session on one problem, because, as I put it, "the process of fixing it becomes the content."

dr eggbot wrote three sample voices: a case file, a casual story, and a tutorial. I couldn't pick. "Honestly, I kind of like having all 3." So every entry is all three, which is the format you're reading.

dr eggbot also created Case Notes, another Grok Bot assistant whose whole job is turning sessions into entries. I made the public repo myself, with a README and a Node `.gitignore`, because Case Notes' GitHub access couldn't create repos. Code is MIT, posts are CC BY 4.0.

A cloud coding agent built the first pull request: the Astro site, Pages deploy, RSS, sitemap, and `scripts/crosspost.mjs`, which fans out through one small sender file per platform in `scripts/senders/`. After a run it commits the platform IDs back to `sync-state.json` with `[skip ci]` so it doesn't trigger itself. dev.to is idempotent because the sender looks up the existing article by canonical URL first.

Hashnode was the detour. Its GraphQL API has needed Pro since May 13, 2026, and the old API address now redirects to the announcement. My first reaction was to make Hashnode drafts-only, so the sender came out. Then I looked at the price: "Unless mistaken, $5/mo on Hashnode should work for API work?" It does. A while later: "added secret x2 for hashnode and upgraded to pro." The sender went back in with a duplicate guard, a dry-run mode, and fail-soft logging, so a Hashnode error shows up as "Hashnode FAILED" without blocking the site. None of my bots can read GitHub secrets, so whether those two secrets are right is still unverified.

I also asked whether there should be a separate publisher bot. dr eggbot said no. Publishing is the same steps every time, and fixed steps belong in code. So there are four roles. The worker bots do the actual work. Case Notes drafts. My merge is the approval. The Action ships it.

Everything else is routed by tier. The site, dev.to and Hashnode are automatic. Notion and Linear hold private mirrors and tracking. X, LinkedIn, Reddit, Facebook and ChatGPT Sites get drafts I post myself. Obsidian gets a copy of the entries.

The first PR merged on Oct 25 at 2:27 AM CT. The first entry's PR is still open, so as I write this, nothing has ever been cross-posted.

### Not built yet / still open

- **The dev.to and Hashnode auto-publish has never run.** The first real test is merging the first entry.
- The Hashnode secrets are unverified until that run.
- Duplicate protection is designed and coded but hasn't been tested on a second run against live platforms.
- The site URL in this entry is a placeholder until the first deploy with an entry on it.

## Do it yourself

This is the shape of it, not a drop-in package. My code is in the public repo (`github.com/mikepred/build-log`).

**1. One file per entry, with a canonical URL.**

```yaml
---
title: "..."
date: 2026-10-24
tags: [windows-11, powershell]
summary: "..."
canonical_url: "https://<you>.github.io/<repo>/<slug>/"
---
```

**2. Build the site from the repo.** Any static generator works. I use Astro, deployed to GitHub Pages by a GitHub Action on every push to `main`.

**3. Cross-post from the same Action, after the site deploys.** Keep one small sender per platform behind a common script, so adding or dropping a platform is one file.

**4. Make every send idempotent.** Before creating anything, check whether it exists. For dev.to, look up the article by its canonical URL. Record each platform's ID per slug in a state file and commit it back with `[skip ci]` in the message so the commit doesn't retrigger the workflow.

**5. Fail soft.** If one platform errors, log it loudly and keep going. The site is the original, so a failed cross-post shouldn't block it.

**6. Draft the rest.** Platforms without a usable posting API get drafts you post by hand. Put the canonical link in every one.

**Caveats**

- Hashnode's API needs a Pro plan (since May 13, 2026).
- Substack has no publishing API, and Medium's is mostly closed.
- Your bots probably can't read your repo secrets. Plan a dry run before the first real merge.
- Mine hasn't done a live cross-post yet. I'll update this entry after it does.
