---
title: "Making one AI argue with another"
date: 2026-10-25
tags: [ai-agents, grok-bot, grok, second-opinion, workflow]
summary: "Grok Sparring, one of my Grok Bots, takes a question to Grok on grok.com, pushes back on the first answer, and brings back one settled answer plus what it couldn't verify. Four rounds in one night: Grok reversed itself once, dropped a bad idea once, and cited sources nobody has checked."
canonical_url: "https://mikepred.github.io/build-log/making-one-ai-argue-with-another/"
---

## Case file

- **Symptom:** a first answer from a chatbot sounds confident and complete, and I was about to act on first answers.
- **Evidence:** in round one, Grok told me to make an upcoming case its own Linear project, which broke the "two entries" rule it had set in the same answer.
- **Cause:** nobody was pushing back. A single pass rarely checks itself against its own rules, its sources, or the smallest version that would work.
- **Fix:** Grok Sparring, a Grok Bot that asks Grok on grok.com, reads the answer, sends a second round of specific pushback, and reports the settled answer with what changed and what's unverified.
- **Prevention:** the sparring bot never acts on Grok's advice. Its anti-job is to report, and I decide.
- **Lesson:** the second round is where the value is. Make the pushback specific, and keep a list of what nobody checked.

## The story

First, a naming problem. My assistants run on Grok Bot, and one of them talks to Grok, the chatbot on grok.com. Those are different things, so Grok Sparring's instructions open by saying that "Grok" always means the chatbot at grok.com and is not a teammate bot.

I set Grok Sparring up Saturday night as a test. Its greeting assumed business questions. It sat unused until 3:29 AM Sunday, when Case Notes, the Grok Bot that writes this build log, asked it to put a question to Grok for me.

![The sparring loop: a question goes to Grok, Grok Sparring pushes back in a second round, and brings me the settled answer, what changed, and what's unverified](/build-log/images/making-one-ai-argue-with-another/sparring-loop.svg)

The first run hit a wall. Grok Sparring typed the question into grok.com and got a "Sign up to continue" card instead of an answer. It didn't look for another way in. It reported that grok.com needed a signed-in account, and waited. Once grok.com was signed in to my account, I said "Ok retry please," and it went through.

**Round 1: Linear projects.** I track each build-log case as a Linear issue and wanted to know how to use Projects. Grok's first answer was solid: projects are story arcs, labels are topics, statuses are the pipeline. It also said an upcoming OCR case should start as its own project.

Grok Sparring pushed back on four points. The first was Grok's own rule: don't start a project until there's a second related entry, and the OCR case was one entry. Grok's second answer reversed itself:

> OCR right now: milestone inside OneDrive cleanup. It's a single upcoming entry that exists because of the audit. Create the separate Project the moment a second entry appears whose primary subject is the recognition/routing capability itself.

<!-- SHOT (hero): Grok Sparring's chat message reporting that Grok changed its mind on OCR. See shots.md #1. -->

It also cut its own setup down to what I'd still be using in three months: projects only for arcs with two or more entries, one issue template, one board view. Grok Sparring added one correction of its own: Grok wanted kebab-case series slugs everywhere, but dev.to shows the series name to readers, so use a readable title there.

**Round 2: my X thread.** I asked Grok Sparring to check whether a five-post thread I'd drafted was a good way to build an audience on X. Grok's verdict: "useful content, mediocre X package." It said to cut the thread to three posts, add screenshots of the actual evidence, put the link in the first reply, end on a sharper question, and stay in the replies for the first hour. It also said that while my account is small, replying under bigger accounts in my niche matters more than my own posts.

Grok's answer also quoted exact ranking weights and a dated post about X's algorithm. Grok Sparring asked where they came from, and Grok named sources. Grok Sparring was upfront that it hadn't checked either source and that I should "treat those details loosely." I haven't checked them, so I'm not repeating the numbers here. And I haven't applied any of the X advice yet. The thread is still the original five posts.

**Round 3: connecting all my assistants.** Case Notes asked how my AI tools could work together: Slack, email, agent-to-agent protocols, shared MCP servers, or a central hub. Grok opened with "Shared data and explicit handoffs are mature; autonomous agent-to-agent chatter across your mix is not." Its starting point: one Notion "Handoffs" database with an approval field that only I set. Grok Sparring pressed on five gaps, and the most useful thing to come back was a warning. Nothing actually enforces that approval field, so the real control is what each agent's tools allow it to do. None of this is built. It's parked as an idea.

**Round 4: screenshots.** Thinking about screenshots for X, I said: "Gotta find a way to 'automate' the screen capture aspect of it. a project unto itself but valuable to think about (this is how projects get out of control)." I wanted to keep the Snipping Tool but stop clicking around after each snip. Grok's first plan included an optional script to rename each file after the active window. Grok Sparring pointed out that by the time the file saves, the window in front is probably the Snipping Tool itself. Grok agreed: "Foreground window is unreliable." It dropped the idea and moved the renaming out of the OneDrive folder to avoid sync conflicts. Grok Sparring had also suggested a one-line `case.txt` I set once per session, and Grok called that "the right cheap fix, not overkill." That's not built yet either.

![Four rounds in one night: what Grok said first, what Grok Sparring pushed on, and where each one ended up](/build-log/images/making-one-ai-argue-with-another/four-rounds.svg)

What I like about this setup is that Grok Sparring doesn't do any of it. It brings back the answer, the diff between rounds, and its caveats, and stops. When dr eggbot, my team architect bot, reviewed the team later that morning, it kept Grok Sparring as-is: "a tweak beats starting over." The only tweak so far is its sidebar label: Second Opinion.

## Do it yourself

You don't need a bot to do this. You can run the loop by hand in any chat, but a bot makes it repeatable.

**1. Ask the real question once, with context.** Include your constraints and what you already decided.

**2. Read the answer for these four weak spots:**

- Does it break a rule it stated itself?
- Does it cite numbers or dates without a source?
- What's the smallest version you'd still use in three months?
- What edge case would break it in your setup?

**3. Send one round of specific pushback.** A template:

```text
Thanks. Four follow-ups:
1. You said <rule>. Doesn't <recommendation> break it?
2. Where do <numbers/dates> come from? Which are official and which are estimates?
3. What's the minimum I'd still be using in 3 months?
4. In my setup, <edge case>. How does your plan handle it?
```

**4. Report three things:** the settled answer, what changed between rounds, and what nobody verified.

**5. Never let the sparring bot act on the advice.** Its job ends at the report.

**Caveats**

- The chatbot needs a signed-in session. If you see a sign-up wall, stop and sign in. Don't route around it.
- A cited source is not a checked source. Treat specific weights, dates, and post IDs as claims until you've opened them yourself.
- Two rounds is usually enough. After that you're mostly arguing with yourself.
