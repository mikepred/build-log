---
title: "Connecting assistants across platforms: a Notion handoff board (skeleton, not built)"
date: 2026-10-25
tags: [ai-assistants, notion, mcp, microsoft-365-copilot, grok, workflow]
summary: "My assistants live on different platforms, and work moves between them by hand. Grok Sparring, one of my Grok Bot assistants, took the question to Grok on grok.com for two rounds. The answer: start with one Notion Handoffs database with an approval field only I set. Nothing is built yet."
canonical_url: "https://mikepred.github.io/build-log/notion-handoffs-across-assistants/"
---

> **Skeleton.** This is the plan and the reasoning so far. The story and the how-to get rewritten after the one-week test.

## Case file

- **Symptom:** work moves between my assistants by hand. That means transcripts dropped in a OneDrive folder, Notion pages, bot-to-bot messages inside Grok Bot, and Grok Sparring's back-and-forth with grok.com.
- **Evidence:** two rounds of Grok's answer on grok.com, run by Grok Sparring, comparing Slack, email, agent-to-agent protocols like A2A, shared MCP servers, and a central hub.
- **Cause:** there's no shared place where handoffs land with who wrote them, the source transcript, and my approval.
- **Fix (planned, not built):** one Notion database called Handoffs, with fields for the source agent, a link to the source transcript, an approval status only I set (pending, approved, rejected, default pending), redaction notes, and a Redacted? checkbox.
- **Prevention (planned, unproven):** a one-week test with three real handoffs, one involving Microsoft 365 Copilot. Stop and fix if anything needed more copy-paste than before, or if an agent acted on a pending entry.
- **Lesson so far:** an approval field is a convention, not a lock. What each assistant's tools can actually reach is the real control.

![The proposed Handoffs flow](/build-log/images/notion-handoffs-across-assistants/handoffs.svg)

## The story

I was connecting Notion to Microsoft 365 Copilot and had a thought: "I'm adding Notion to M365 Copilot, maybe that's the way to collaborate with other platforms, using MCP."

My assistants are spread out. There are the Grok Bot ones (dr eggbot, Bench Tech, Inspector, Case Notes, Grok Sparring), Microsoft 365 Copilot, grok.com itself, and maybe Hermes Agent later. So I asked Case Notes to send Grok Sparring, the Grok Bot assistant that argues with Grok on grok.com for me, a broader question: what about Slack, email, "a2a communication like in Hermes Agent," or a central hub like the back-and-forth Grok Sparring already has with Grok? "We want that throughout," not only for the build log.

Grok's first-round headline was blunt: "Shared data and explicit handoffs are mature; autonomous agent-to-agent chatter across your mix is not." It weighed each option on setup effort, keeping who-said-what (which this build log needs for attribution), privacy, and the risk of agents acting on each other's messages without me.

Grok Sparring pushed back on five gaps, and the second round changed things. Grok said Microsoft's Notion connector for Copilot is read-only, so Copilot's output would have to go through me or a bot that can write. It said the OneDrive drop folder only matters for an agent that can't write to Notion, since nothing watches that folder. And an approval field in Notion beats email for handoffs only I review. The line I keep coming back to: "Nothing in Notion or MCP enforces 'do not act if Approval = pending.'" The gate is only as good as each agent's instructions and the tools it's given.

Grok Sparring added one field of its own, a Redacted? checkbox.

### Not built yet / still open

- No Handoffs database exists yet, and nobody owns it.
- The one-week test hasn't run.
- **Unverified:** whether Copilot's Notion connector is really read-only, and how Hermes Agent does agent-to-agent. Both are Grok's claims and haven't been checked.
- Slack, email and A2A were deferred, not rejected.

## Do it yourself

Planned steps, not tested. I'll replace this section after the test.

**1. Make one Notion database for handoffs.** Fields: source agent, source transcript link, approval (pending / approved / rejected, default pending), redaction notes, and a Redacted? checkbox.

**2. Give write access only to assistants that need it.** Assistants that can't write (Grok says that includes Copilot's official Notion connector) hand their output to you or to one bot that can.

**3. Tell every reading assistant to act only on approved entries.** Remember this is an instruction, not a lock.

**4. Run three real handoffs in a week**, one involving your least-connected assistant. Check that each entry has the right source and transcript, that you can approve it in under a minute, and that nothing acted on a pending entry.

**Caveats**

- Nothing enforces the approval field. Limit tool access if it matters.
- Connector capabilities change. Check yours before you plan around them.
