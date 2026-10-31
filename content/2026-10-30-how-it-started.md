---
title: "How it started: nine bots in a week, then back to one"
date: 2026-10-30
tags: [ai-agents, grok-bot, bot-design, build-log]
summary: "I started with one Grok Bot and a rule that the work would tell me what bots I needed. Within a week I had a team of nine, each with one job and written anti-jobs. On October 30 I deleted all of them and handed the build log to one bot, HQ. These are the rules worth keeping."
canonical_url: "https://mikepred.github.io/build-log/how-it-started/"
---

## Case file

- **Symptom:** I wanted AI help with my PC and my projects, and a public record of it, without designing a whole system up front or tracking everything by hand.
- **Evidence:** one week, one Windows PC, and a pile of chats: one bot on the first night, three by sunrise, seven by the next morning, nine by the end. Fourteen draft entries sat in pull requests, none of them merged.
- **Cause:** every bot was added for a real reason, but each one was another chat to visit, another set of instructions to keep current, and another place for work to get stuck. And I had the team architect minting new bots before I fully understood what we were building.
- **Fix:** on October 30, 2026 I deleted the whole team and handed the build log to one bot, HQ. It's my main workbench, and this log is a byproduct of the work I do there.
- **Prevention:** the rules the team taught me stay, even with one bot: evidence before structure, one job per role with written anti-jobs, a checker that owns no code, a second round of arguing, real fixes as the only content, code for anything with no judgment in it, and respect for how much context one bot can hold.
- **Lesson:** the team was the scaffolding. The rules are what I'm keeping.

## The story

### Night one: Patient Zero

At 1:59 AM on Saturday, October 24, I opened a chat with dr eggbot, a Grok Bot whose whole job is designing other Grok Bots, and gave it a strange first message:

> Let's consider you "Patient Zero." I don't yet know what kind of bot I want or need yet. It will emerge at your discretion based on what I ask of you.

I didn't want to spec out a team I'd never used. dr eggbot turned that into a rule: when the same kind of ask came back a few times, it would tell me which bot it should become, and I'd say yes or no.

Ten minutes later my freshly reinstalled Windows 11 PC became "Patient One," and the night turned into real work: setup scripts I could rerun, a boot loop caused by a Windows Update driver, crash dumps that actually stick around, and a small menu of admin tasks the assistant could start but not edit. Around 4:21 AM I added a side note: I wanted all this to turn into a public journal, a portfolio, without tracking it by hand. By 5:23 AM dr eggbot had made the first new bot, Case Notes, which turns real sessions into entries and never publishes anything itself.

At 6:16 AM I asked whether there was enough for a bot to run the build-log sessions. I was half expecting a do-anything worker. dr eggbot said no to that and yes to something narrower: nearly every case so far had been my PC, and "a general 'do any session' bot would just duplicate me." At 6:18 AM Bench Tech existed, with one machine to look after and a list of things it must never do without my yes: restarts, BIOS, firmware, driver installs, apps I didn't ask for.

Then I nearly added a third bot for no reason. Should Case Notes draft *and* publish, or should a publisher bot do that? dr eggbot said publishing "is fixed steps with no judgment in them, so code does it more reliably than a bot." The bot I was tempted to add turned out to be a GitHub Action. By sunrise I had three bots, each with one job.

### Night two: lanes

By early Sunday I had five: dr eggbot, Bench Tech, Case Notes, and two I was still testing.

One was **QA bot**. It came from a marketplace template built to gate production deploys, and I'd been using it to check PowerShell that Microsoft 365 Copilot wrote for me. When I tried to say what it was for, the honest word was "confusing." Sorting that out gave me a rule: bots that write code are makers, one bot checks, and the checker owns no code. QA bot was rebuilt as **Inspector**: verdict first, findings marked proven or reasoned, a minimal patch handed back and never applied.

The other was **Grok Sparring**. It takes a question to Grok on grok.com, pushes back on the first answer, and brings back one settled answer plus a list of what nobody verified. In one night of four rounds, Grok reversed itself once, dropped a bad idea once, and cited sources nobody had checked. Every bit of the value was in round two.

At 3:50 AM, with five bots and a dozen open threads, I typed that I was "jumping between things, getting confused, and getting a little frustrated with myself." dr eggbot's answer is the line I remember most from the whole week:

> getting lost isn't a you problem. there's just no one bot whose job is the big picture.

So the big picture got a lane. **Front Desk** tracked and routed work but couldn't create bots. dr eggbot stretched from "bot minter" to "team architect." **Stacks** became the librarian for private notes. Every bot got the same two standing rules: off-scope asks get a short answer plus a quiet note to the architect, and half-formed ideas get parked with Stacks. By 4:45 AM it was, in the team page's own words, "seven bots, split into lanes: one front door, three makers, one checker, one second opinion, and an architect."

![The team over one week: one bot on night one, three by sunrise, seven after night two, nine at the peak, then back to one on October 30](/build-log/images/how-it-started/team-timeline.svg)

### The rest of the week

The last two showed up the way the rest did, some on the same day and some spread over a few days. I honestly don't remember the exact order. One was **Student Discount Finder**. The other was **Hermes Agent Fixer**. Neither came from a pile of repeated asks. I just liked the idea that every bot should have its own lane, so that when one conversation got long, the history wouldn't be stuck in one place and another bot could pick it up.

The build log itself came out of that week too. A PRD I'd been handed for an "autonomous content engine" wanted ten channels, affiliate links, daily posts "even when no article is released," and 50 articles in six months. It got called what it was, a content farm. What survived is one markdown file per real problem, a pull request, and my merge as the only approval. My own words from that session are basically this log's mission statement: "Errors come up through some course of work, the process of fixing it becomes the content."

By the end of the week the team had drafted fourteen entries. All of them were still open pull requests. None had shipped.

### October 30: back to one

On October 30, 2026 I deleted all nine bots.

What tipped it: I had the librarian, Stacks, start working with the debate partner, Grok Sparring, to go outside the platform and ask for more revisions to my Obsidian vault. What came back were revisions I couldn't follow. When I can't follow what my own bots did to my own notes, there are too many of them.

The work moves to one bot, **HQ**. It's my main workbench: I do the actual work there, and this build log is a byproduct of that work instead of a separate team's job. Its first act was a survey of what the team left behind: an Astro site that had never published a post, fourteen draft pull requests, and a cross-posting pipeline that had never run. The plan: a running log page, this retro, then the three drafts closest to done, then archive the rest as attempt #1.

![Then and now: nine bots with separate lanes, versus one workbench where the work happens, a draft entry, my merge, and a GitHub Action that ships it](/build-log/images/how-it-started/then-and-now.svg)

Deleting the team doesn't mean the week was wasted. Nearly every rule I'd keep came out of a specific moment with a specific bot. I just don't need nine chats to follow them. Less is more.

## Do it yourself

These are the seven rules I'm keeping. They work with one assistant or with ten.

**1. Evidence before you add a bot.** Start with one general assistant and tell it the rule:

```text
I don't know what bots I need yet. Do the work yourself.
When the same kind of ask comes back two or three times,
tell me which bot it should become, and I'll say yes or no.
Don't suggest a bot on a single ask.
```

When it proposes one, ask what asks it's counting. "Nearly every case was this one PC" is evidence. "You might want..." isn't. The flip side: if the asks stop coming, the bot shouldn't exist anymore either.

**2. One job per bot, with written anti-jobs.** For every bot (or every role, if you only have one bot), write one line for its job and a short list of what it never does:

| Role | One job | Never does |
|---|---|---|
| PC tech | keeps one Windows PC healthy | restarts, BIOS, firmware, or driver installs without a yes |
| Writer | drafts entries from real sessions | publishes or merges on its own; invents steps or numbers |
| Checker | reviews code and scripts | applies, pushes, merges, or deploys |
| Second opinion | pressure-tests a question with another AI | acts on that AI's advice |

**3. Makers and one checker.** Whoever writes the code owns it and is the only one who changes it. The checker owns nothing and reviews everything: verdict first, each finding marked proven or reasoned, a minimal patch handed back and never applied. A bot checking its own work misses things.

**4. Argue for a second round.** Don't act on a first answer. Push back with specifics (your own rules, its sources, the smallest version that would work), then keep a short list of what nobody verified:

```text
Here's your answer. Push on it:
- Does it break any rule you set in the same answer?
- Which sources did you actually check?
- What's the smallest version of this that would work?
Give me one settled answer, what changed, and what's still unverified.
```

**5. The process of fixing is the content.** If you want your work to double as a portfolio, publish the real problem and the real fix, one entry per case, and make your own merge the only approval. No daily filler, no affiliate links, no fifty-articles goal.

**6. Code over bots for deterministic jobs.** If a step has no judgment in it, like publishing on merge or cross-posting, use a CI job or a script. A bot in that spot is one more thing that can go wrong.

**7. Don't underestimate context.** Know how much one bot can hold and still be useful before another has to take over. A long conversation slowly stops being useful, and that limit arrives sooner than you'd think. Splitting into bots doesn't fix it either: you just get more places to lose track. Plan for the handoff (a short written summary, a log, a pull request) before you need it.

**Caveats**

- "Two or three asks" is a judgment call. Count on purpose.
- More bots means more instructions to keep in sync, and more chats to check. Every split has a cost; the rules above are worth more than the count.
- If you share bot instructions publicly, strip out machine names, usernames, and folder paths first.
