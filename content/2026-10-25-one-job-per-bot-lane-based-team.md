---
title: "One job per bot: how my AI team got lanes"
date: 2026-10-25
tags: [ai-agents, grok-bot, bot-design, workflow, obsidian, build-log]
summary: "At 3:50 AM I was jumping between bots, confused and frustrated with myself. One hour later I had a lane-based team of seven Grok Bots: a front door that tracks but never builds, an architect that builds but never tracks, a librarian, and rules for off-scope asks and half-formed ideas."
canonical_url: "https://mikepred.github.io/build-log/one-job-per-bot-lane-based-team/"
---

## Case file

- **Symptom:** with four bots and a dozen open threads, I kept losing my place and getting frustrated with myself.
- **Evidence:** open items were scattered across chats (a site PR, a repo clone on hold, an app-list cleanup, a librarian still being scoped).
- **Cause:** no bot's job was the big picture, and the one bot that could have taken it on, dr eggbot, was the one that designs bots.
- **Fix:** split the work into lanes: Front Desk tracks and routes but can't create bots, dr eggbot became team architect, and Stacks became the notes librarian. Then add two standing rules: off-scope notes go to the architect, and half-formed ideas get parked with Stacks.
- **Prevention:** every bot has one job, written anti-jobs, and a sidebar label. A living team page logs every decision and why.
- **Lesson:** "getting lost" was a design gap, not a me problem. Give the big picture its own lane, and keep that lane away from the lane that builds things.

## The story

By early Sunday morning I had five Grok Bots: dr eggbot (designs bots), Bench Tech (my Windows PC), Case Notes (this build log), and two I was still testing, QA bot and Grok Sparring. At 3:27 AM I asked dr eggbot to give Case Notes the off-scope rule Bench Tech already had: answer briefly, then send dr eggbot a quiet note with the topic. dr eggbot counts those notes across bots to decide when a new bot is needed.

Then, at 3:50 AM, I typed this:

> Going back to your suggestions for two candidates, a code project bot and a notes librarian, I'm thinking we may want to create them sooner rather than later... That being said, is there a third one that might be good as the anchor, if you will? I'm jumping between things, getting confused, and getting a little frustrated with myself. Don't make anything yet, just riffing.

dr eggbot suggested a front desk bot: I dump anything there, it says which bot owns it, keeps a short board of what's open, and catches me up in three lines. And this:

> that's a lot to keep in your head while also doing the actual work, so getting lost isn't a you problem. there's just no one bot whose job is the big picture.

My first reaction was worry. dr eggbot was my anchor because it's good at making bots, and I didn't think a front desk bot "would be able to maintain that same kind of quality." dr eggbot agreed, so it kept the jobs apart: Front Desk tracks and routes, can't create bots, and sends gaps to dr eggbot. Doing both itself "waters down what i'm for. tracking is something you need every day, and building bots only comes up once in a while, so the daily stuff would end up crowding out the design work."

So at 4:20 I said: build Front Desk, hold the code bot until I have a real project, and let's talk more about the librarian. Front Desk's first move was to check its starting board against the other bots' actual chats. It found two items that were missing.

The librarian overlapped with Case Notes, so dr eggbot split them by direction: Case Notes faces outward (sessions in, public entries out), the librarian faces inward (private notes that never go public). I pushed on Obsidian, since a vault is a graph and a plain repo clone seemed pointless. That became two layers: Case Notes owns an entries layer that mirrors published posts, and the librarian owns a private graph layer of topic notes and links. Wikilinks stay out of public entries.

Then I overreached. I suggested a separate "designer" bot for the vault, and said the meta-project of building this team "deserves its own lane!" dr eggbot pushed back on both. The meta-project is really the same job as minting bots, so it stretched its own lane from "bot minter" to "team architect." And a vault-design bot "sits idle" once the design is done, so the librarian should do the design as its first project and then keep running what it built. I agreed. At 4:33 it built Stacks, the librarian. Stacks started on a fresh vault and came back with a design page and a list of calls for me to make before it touched anything.

QA bot got rebuilt as Inspector (separate entry). And when I asked for sidebar labels, dr eggbot could only set names and instructions, so it asked each bot to set its own label. Case Notes became Chronicler, which "beats 'scribe'."

Two more things came out of that hour. I clarified that the meta-project is "its own huge thing that needs to be documented along the way, with as little input from me as possible," so dr eggbot started a living team page: roster, a diagram of how work moves, handoff rules, and a dated log of every decision and why. And I asked how my half-formed ideas get captured, like my riffing with Grok Sparring about agent-to-agent communication. Nothing caught those. Now it's a standing rule on every bot: whichever bot hears an idea sends it to Stacks and adds "(parked the idea with stacks)" to its reply. Stacks keeps one note per idea. At three mentions, or when I say "let's build it," the idea goes on Front Desk's board, and if there's a story in it, Case Notes hears about it.

![Idea capture: any bot parks the idea with Stacks; three mentions puts it on Front Desk's board; a story goes to Case Notes](/build-log/images/one-job-per-bot-lane-based-team/idea-capture.svg)

Here's where it landed, from the team page: "Seven bots, split into lanes: one front door, three makers, one checker, one second opinion, and an architect." The code-project bot is still on hold.

![The team's lanes: everything enters through Front Desk, makers send code to Inspector, stories go to Case Notes, and my merge publishes](/build-log/images/one-job-per-bot-lane-based-team/team-lanes.svg)

<!-- SHOT (hero): Grok Bot sidebar showing all seven bots with their labels. See shots.md #1. -->

### Coda

At 4:45 AM I asked Front Desk to cross-check every bot for entries I'd missed, because I want this to be "a learning journey that anyone can follow (and it'll basically be my AI Resume Portfolio) no pressure!" Front Desk said finding entries is Case Notes' job and passed it along. That's the lanes working, and it's how this entry got drafted.

## Do it yourself

**1. Write a roster with anti-jobs.** One row per bot: name, label, one job, and what it never does. Mine:

| Bot | Label | One job | Never does |
|---|---|---|---|
| Front Desk | Home Base | intake, routing, the open-work board, catch-ups | the work itself, or making bots |
| dr eggbot | Team Architect | team shape, building bots | other bots' work, daily tracking |
| Bench Tech | PC Tech | the Windows PC | anything off the PC |
| Case Notes | Chronicler | build-log entries and fan-out | merging or publishing on its own |
| Stacks | Librarian | private notes and vault design | anything public, or editing entries |
| Inspector | Checker | hardens code and scripts | applying, pushing, shipping |
| Grok Sparring | Second Opinion | pressure-tests a question with Grok | acting on Grok's advice |

**2. Keep tracking and building in separate bots.** The tracker can't create bots. It sends gaps to the architect.

**3. Add an off-scope rule to every bot.** Paste this into each bot's instructions:

```text
When asked about something outside your job, give a short answer if it's quick,
otherwise say it's not your job. Either way, send the architect bot one quiet note:
the topic, the date, and whether it's a repeat. Don't pitch new bots yourself.
```

**4. Add an idea-capture rule.** Half-formed ideas go to one librarian bot, one note per idea, with a visible "(parked the idea...)" line. Promote an idea at three mentions or on your say-so. Log every team decision, with the why, on one page.

**Caveats**

- A tracker bot is only as good as its refresh. Mine reads the other bots' chats; if it can't, its board will drift.
- Seven bots is what my work needed in one weekend. Don't copy the count; copy the rule that each one needs evidence first.
