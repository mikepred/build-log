---
title: "Patient Zero: I didn't design my AI team, I let it show up"
date: 2026-10-24
tags: [ai-agents, grok-bot, bot-design, workflow, build-log]
summary: "I started with one Grok Bot, dr eggbot, and no plan beyond 'it will emerge.' By sunrise it had split off two bots, Case Notes and Bench Tech, each only after the work showed a real need, and it argued me out of a third."
canonical_url: "https://mikepred.github.io/build-log/patient-zero-let-the-bots-emerge/"
---

## Case file

- **Symptom:** I knew I wanted AI help with my PC and my projects, but I didn't know what bots I needed, and designing a team up front would have been guessing.
- **Evidence:** in one night, almost every ask was about the same Windows PC, and one side request (a public journal) turned into its own workflow.
- **Cause:** bots designed before the work exists end up with fuzzy jobs that overlap.
- **Fix:** start with one general bot, dr eggbot ("Patient Zero"), and only split off a new bot when the same kind of ask keeps coming back. Case Notes and Bench Tech came out of that.
- **Prevention:** a standing rule that a new bot needs repeated asks behind it, plus explicit anti-jobs for each bot.
- **Lesson:** let the work tell you what bots you need. Evidence first, bot second.

## The story

At 1:59 AM on a Saturday I opened a chat with dr eggbot, a Grok Bot whose whole job is designing other Grok Bots, and gave it a strange first message:

> Let's consider you "Patient Zero." I don't yet know what kind of bot I want or need yet. It will emerge at your discretion based on what I ask of you.

<!-- SHOT (hero): the "Patient Zero" opening message in dr eggbot's chat. See shots.md #1. -->

I didn't want to sit down and spec out an assistant team I'd never used. I wanted to just work and see what came up. dr eggbot took that as a rule: "when i see the same kind of ask come back a few times, i'll tell you which bot it should turn into, and you can say yes or no."

Ten minutes later I introduced "Patient One": my PC. I'd just reinstalled Windows 11 Pro and wanted the whole setup scripted so I could redo it silently from scratch. That kicked off hours of real work. We built setup scripts for my Windows tweaks and a winget app list. Instead of listing every setting I'd changed in the GUI, I suggested a diff of before-and-after snapshots. We dug into a boot loop that a Windows Update driver caused (that's its own entry). We set up crash dumps so the next one leaves evidence. And we set up a small menu of scoped admin tasks the assistant can start but not edit.

Around 4:21 AM I added a sidenote: I wanted my progress to become a public journal, a portfolio, without tracking it by hand. That became the build log, and by about 5:23 AM dr eggbot had created the first new bot: Case Notes, which turns real sessions into entries and never publishes anything itself. (Why it doesn't look like a content farm is another entry.)

At 6:16 AM I asked the obvious next question:

> Do you have enough here to create another bot for the actual build-log sessions?

I was half expecting a "do anything" worker bot. dr eggbot said no to that and yes to something narrower:

> nearly every case so far has been your Windows PC: the boot break, the scoped admin menu, the winget hang. that's Patient One...
>
> a general "do any session" bot would just duplicate me, so i'd keep it to the PC.

That made sense. The evidence was all one machine. I said "yes, give it a good name (drop the patient line)," and at 6:18 AM Bench Tech existed. Its job is one Windows PC, its voice is "evidence first," and its instructions carry what we'd learned that night: read the tool's own logs before blaming it, prove a fix by rerunning it, and keep scripts safe to rerun. They also carry hard anti-jobs: no restarts, BIOS, firmware, or driver installs without my yes; no apps I didn't ask for; no reaching for broader admin access; and no build-log writing, because that's Case Notes' job.

Its first act, a few minutes later, was a read-only health pass. It changed nothing and came back with the drift checks, the scheduled tasks, disk health, and one thing it couldn't explain: an earlier crash had logged a dump that was no longer on disk. It said so instead of guessing.

Then I nearly added a third bot for no reason. Around 7:10 AM I asked whether Case Notes should both draft and publish, or whether that should be split. dr eggbot said the split already existed, just not as a bot:

> So it's four roles: worker bots do the work, Case Notes writes it up, you approve, and code ships it.

![Four roles: worker bots do the work, Case Notes writes, I approve by merging, a GitHub Action ships](/build-log/images/patient-zero-let-the-bots-emerge/four-roles.svg)

And on a publisher bot: "Publishing is fixed steps with no judgment in them, so code does it more reliably than a bot, and a bot in that spot is just one more thing that can go wrong."

So by sunrise I had three bots, each with one job: dr eggbot designs bots, Bench Tech keeps the PC healthy, and Case Notes writes. Nobody approves their own work. And the bot I was tempted to add turned out to be a GitHub Action.

![How the first night went: Patient Zero at 1:59 AM, the PC work, the journal sidenote, Case Notes, then Bench Tech at 6:18 AM](/build-log/images/patient-zero-let-the-bots-emerge/emergence-timeline.svg)

### Coda

Somewhere between that morning and the next night, the next rule showed up: when Bench Tech gets asked about something outside the PC, it answers briefly and sends dr eggbot a quiet note. dr eggbot counts those notes across bots, and that count is what decides the next bot. The rest of the team grew out of that, and it's the next entry.

## Do it yourself

This works with any platform where one assistant can create or configure others. Mine is Grok Bot.

**1. Start with one bot and tell it the rule.** Something like:

```text
You're Patient Zero. I don't know what bots I need yet.
Do the work yourself. When the same kind of ask comes back
two or three times, tell me which bot it should become, and I'll say yes or no.
Don't suggest a bot on a single ask.
```

**2. Work normally for a while.** Real tasks, not hypotheticals. The point is to collect evidence.

**3. When it proposes a bot, check the evidence.** Ask what asks it's counting. "Nearly every case was this one PC" is evidence. "You might want..." isn't.

**4. Keep the new bot narrow.** One job, one voice, and written anti-jobs. For a PC bot, mine include:

- no restarts, BIOS, firmware, or driver installs without a yes in chat
- no apps the user didn't ask for
- no reaching for broader admin access
- no claiming a fix works before rerunning it

**5. Don't make a bot for fixed steps.** If a step has no judgment in it, like publishing on merge, use code (a CI job or a script). A bot there is just another thing that can fail.

**6. Keep writer and approver apart.** The bot that writes the thing shouldn't be the one that approves it. For me, approving means merging.

**Caveats**

- "Two or three times" is a judgment call. Count on purpose; don't let it be vibes.
- A narrow bot will get off-scope questions anyway. Decide up front what it does with them (mine: short answer, then a quiet note to the architect bot).
- Bot instructions that name your machine, username, or folders are fine privately, but strip them from anything you publish.
