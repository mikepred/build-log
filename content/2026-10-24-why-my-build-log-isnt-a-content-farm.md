---
title: "Why my build log isn't a content farm"
date: 2026-10-24
tags: [ai-agents, grok-bot, build-log, writing, github, astro]
summary: "I wanted my AI work to double as a portfolio without hand-tracking it. A PRD for a ten-channel 'autonomous content engine' got called what it was, a content farm, and what's left is one markdown file per real problem, a PR, and my merge as the only approval."
canonical_url: "https://mikepred.github.io/build-log/why-my-build-log-isnt-a-content-farm/"
---

## Case file

- **Symptom:** I wanted a public record of what I was learning with AI tools, but tracking it by hand was too much work, and the plan I had for automating it was built for volume.
- **Evidence:** the PRD aimed for ten outputs per piece, daily social posts "even when no article is released," affiliate income on the dashboard, and "50+ articles" by month 6.
- **Cause:** the plan optimized for reach and monetization, not for the real input: the sessions where I actually hit a problem and fixed it.
- **Fix:** keep the PRD's one good rule (one canonical markdown file in GitHub), drop Substack and Medium, and make each entry one real problem-to-fix case, drafted by Case Notes and published only when I merge.
- **Prevention:** written anti-jobs for the writing bot: never publish without my merge, never invent steps or numbers, no affiliate links or sales calls to action, no filler.
- **Lesson:** for a portfolio, honest beats prolific. The fixing is the content.

## The story

At 4:21 on a Saturday morning I was a couple of hours into a Windows 11 rebuild with dr eggbot, one of my Grok Bot assistants. The session had already turned up real lessons: a Windows Update driver that broke boot, and how to let an assistant run admin tasks without turning off UAC. That's portfolio material, and I knew I'd never keep a journal by hand. So I tacked a sidenote onto a reply:

> I'm interested in automating the process of my "progress" with these things on a public journal... this session has some valuable insights that could become part of my "portfolio" if you will. But it would be too laborious to manually track.

dr eggbot (I'd named it "Patient Zero," more on that in another entry) suggested a journal bot that drafts from our sessions, strips private details, and never publishes on its own. It asked where the journal should live, laid out the options, and leaned toward my own site with a cross-post to dev.to or Hashnode.

Then I got ambitious. Under an hour later I dropped in a PRD I'd written with Microsoft 365 Copilot, with one word: "Thoughts?"

<!-- SHOT (hero): my sidenote message to dr eggbot asking about a public journal. See shots.md #1. -->

It was titled "PRD: Autonomous Technical Content Engine," and it opened by saying you could hand it "directly to Grok, Codex, Claude Code, or an agentic coding system." To be fair to it, it was thorough. The objective, quoted:

> Build an autonomous content generation, publishing, distribution, and monetization platform that converts developer activity and ideas into content published across multiple channels.

It wanted one source to become a blog post, dev.to, Hashnode, Medium, a newsletter, LinkedIn, an X thread, Bluesky, GitHub commit history, and SEO metadata. That's ten outputs. It scheduled one LinkedIn post, one X thread and one Bluesky post a day, "Even when no article is released." The dashboard tracked revenue and "Affiliate income." The six-month targets included "50+ articles," 1,000 newsletter subscribers, and "5 qualified consulting leads/month." And it said "The human's role should be limited to approving content or occasionally supplying topic prompts."

It also had a genuinely good rule, which it called non-negotiable: every piece of content starts as one canonical Markdown file in GitHub, and everything else gets generated from it. And it picked Astro on GitHub Pages.

dr eggbot kept both of those and was blunt about the rest:

> this is a content farm with a revenue plan: ten channels, affiliate links, sales calls to action on every post, daily social posts "even when no article is released," and goals like 50 articles in 6 months.

The line that stuck with me: "readers and employers can spot volume-generated AI articles fast." It also said the PRD was missing the sessions themselves, so it would have to invent topics. And it listed practical snags: Substack has no official publishing API, Medium has mostly shut its publishing API to new integrations, and the X connection it had could only draft posts, not publish them.

Its counter-proposal: a weekly run that drafts one honest entry and opens it as a pull request. "You approve by merging."

I pushed back on one part. A weekly run made sense, but my work doesn't come in weeks. It comes in sessions:

> Nix Substack and Medium. Drafts on X are fine. I like the idea of a weekly run, but I also know that I will be having an entire session on 1 topic... Errors come up through some course of work, the process of fixing it becomes the content.

That became the format: one case per entry. Something broke during real work, I investigated it, fixed it, and put something in place so it doesn't happen again.

![The PRD's ten-output plan next to what got built: one session, one entry, one pull request, and my merge as the only approval](/build-log/images/why-my-build-log-isnt-a-content-farm/prd-vs-build.svg)

Then the voice. I'm mikepred on GitHub, and the repo would be `build-log`. I couldn't decide on a tone, so I asked to see options side by side. dr eggbot wrote three samples: A, a casual first-person story; B, a polished tutorial; C, terse field notes (Symptom, Evidence, Cause, Fix, Prevention, Lesson). I read them and said:

> Honestly, I kind of like having all 3.

So every entry, including this one, has all three: a case file up top, the story in my voice, and a do-it-yourself section. dr eggbot named the writing bot Case Notes, to fit the patient theme, and created it a little after 5:20 AM. Case Notes couldn't create the GitHub repo itself, so I made it by hand.

### Coda

I'll admit the PRD wasn't all wrong. Later that morning I told dr eggbot I still wanted "the tiered propagation and source of truth," and "more platform distribution and cross-posting the merrier." That turned into a one-way fan-out: the repo is the source, merging publishes to the site, dev.to and Hashnode, Notion and Linear are private mirrors, and X, LinkedIn and Reddit get drafts I post myself. It's more channels than dr eggbot started with, but every one of them is fed by a real entry, and nothing goes out without my merge.

## Do it yourself

**1. One source of truth.** One markdown file per entry in a public GitHub repo, with frontmatter like this:

```yaml
---
title: "One real problem, stated plainly"
date: 2026-10-24
tags: [topic-a, topic-b]
summary: "One or two sentences: what broke and what fixed it."
canonical_url: "https://<you>.github.io/<repo>/<slug>/"
---
```

**2. One case per entry.** Symptom, investigation, cause, fix, prevention. If you can't fill in the fix, it isn't ready to be an entry yet.

**3. Write anti-jobs for the writing bot, not just jobs.** Mine, from Case Notes' instructions:

- never merge, publish, or post anything; a merge by me is the only approval
- never invent steps, numbers, errors, or fixes that aren't in the source
- no affiliate links, sales calls to action, or newsletters
- strip machine names, usernames, paths, keys, IDs and serials before anything leaves the chat

**4. Make the merge the approval.** The bot opens a pull request. Merging is your sign-off and your audit trail at once. Publishing is code (a GitHub Action), not another bot.

**Caveats**

- Check API access before you plan a channel around it. When I looked, Substack had no official publishing API and Medium's was closed to new integrations. For those, draft and post by hand.
- Canonical URLs matter. Point every cross-post back to your own site so search engines know which copy is the original.
- Fewer, real entries beat a schedule. If a week has nothing worth writing, write nothing.
