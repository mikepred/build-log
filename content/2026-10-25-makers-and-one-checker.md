---
title: "Makers and one checker: rebuilding my QA bot as Inspector"
date: 2026-10-25
tags: [ai-agents, grok-bot, code-review, powershell, bot-design]
summary: "My QA bot came from a marketplace template built to gate production deploys, and I was using it to check Microsoft 365 Copilot's PowerShell. Untangling that gave me a rule: bots that write code are makers, one bot checks, and the checker owns no code. It's rebuilt, but it hasn't done a real review yet."
canonical_url: "https://mikepred.github.io/build-log/makers-and-one-checker/"
---

## Case file

- **Symptom:** I couldn't say what my QA bot was for, or where it ended and Bench Tech and a future code bot began. In my words: "confusing."
- **Evidence:** QA bot came from a marketplace template for a post-merge acceptance gate (watch a repo, check the live deploy, re-run acceptance tests), and I'd never used it for that. I'd used it to review a Microsoft 365 Copilot PowerShell script, and it couldn't run PowerShell on its own computer.
- **Cause:** the bot's instructions were a generic template line, not the job I actually needed done.
- **Fix:** split the team into makers (bots that write code) and one checker that owns no code, and rebuilt QA bot as Inspector: verdict first, findings marked proven or reasoned, a minimal patch handed back and never applied.
- **Prevention:** written anti-jobs (never apply, push, merge, or deploy), and the bot that owns the code is the only one that changes it.
- **Lesson:** keep the writer and the approver apart for code too. A bot checking its own work misses things. Not proven yet: Inspector hasn't done a real review under its new instructions.

## The story

QA bot wasn't something dr eggbot, my bot-designing Grok Bot, built. I added it from a marketplace template on Saturday night. The template was a "post-merge AC fail-gate": when a PR merges in a product repo, it confirms which commit is live in production, re-runs the blocking acceptance tests, and says pass or fail. On its first run it offered to add Vercel so it could check production commits. I said "Skip Vercel for now," because I didn't have a product. What I had was a PowerShell script.

I'd been working with Microsoft 365 Copilot on a OneDrive cleanup, and the scope kept growing (that's its own entry). So at 8:42 PM I handed QA bot Copilot's script with three words: "Will this work?"

<!-- SHOT (hero): QA bot's first review reply listing the findings. See shots.md #1. -->

It was a good review. Yes, it would run, and it only read OneDrive. But: a `-HashDuplicates` switch was declared and never used. The report was written to `$HOME\Desktop`, which could be inside OneDrive if Desktop backup is on. A preview option would quietly download online-only files. And `SilentlyContinue` hid errors, so counts could come up short. I said "send back a fixed version," and it did, with one honest line: "I couldn't test it because my computer doesn't have PowerShell." Over the next couple of hours it went through more versions while I ran them and reported back. When the duplicate step crawled, it swapped `Group-Object` for something faster and added status lines.

That worked, but it wasn't what the template was for. It was code review by a bot built to gate deploys, on a computer that couldn't run the code.

Early Sunday, while I was reorganizing the whole team with dr eggbot, I asked what to do with QA bot and Grok Sparring: "Not sure where to go with them, or what labels they could have, or if they need to be scrapped and built anew by you directly." dr eggbot's take on QA bot was short: it "is one line of text from a template, so there's nothing in it to tune." It asked what I actually hand it. My answer, at 4:38 AM:

> Frankly I don't think I'll be using M365 Copilot for much, maybe every now and then since it's a MS product and that's relevant to my studies. it's not just for copilot work to QA, it's really any kind of hardening of code/script (which is adjacent to the code bot mentioned earlier that hasn't been made yet, which also runs adjacent to Bench Tech).. confusing

dr eggbot untangled it by splitting the bots into makers and one checker:

> the overlap goes away because qa owns no code. it reviews everyone's. that's the same split between writing and approving you asked about for case notes, and for code it's worth it, because a bot checking its own work misses things.

Makers write things: Bench Tech writes the PC scripts, and the code-project bot, once it exists, will write repo code. The checker hardens anything, whoever wrote it, and hands back findings plus a fixed version. The owner applies it. That's the same rule as my build log, where Case Notes drafts and my merge is the only approval.

![Makers send code to Inspector, which owns no code and hands back a verdict, findings and a minimal patch; the owner applies it](/build-log/images/makers-and-one-checker/makers-checker.svg)

I said yes. At 4:40 AM dr eggbot rebuilt QA bot as Inspector. Same chat, new name, all-new instructions. The heart of them:

- **Verdict first:** pass, pass with fixes, or fail.
- **Findings worst first,** each with a concrete way it breaks ("the input or state, then what goes wrong"). If it can't name one, it's a nitpick and gets left out.
- **Proven or reasoned:** each finding says whether Inspector reproduced it or only reasoned it out. "Never claim a test passed if you didn't run it."
- **A minimal patch,** in the author's style. No rewrites, no new features.
- **Anti-jobs:** never apply fixes to my PC, push, merge, or deploy.

It also knows my script standards (silent, safe to rerun, PowerShell 5.1, admin only through the scoped tasks, no secrets), and Bench Tech was told it can ask Inspector for a pass after any non-trivial script change. Two minutes later Inspector set its own sidebar label: Checker.

Here's the honest part: as of this draft, that's where it stands. Since the rebuild, the only thing Inspector has done is change its label. It hasn't reviewed a single script under the new instructions. The old QA bot couldn't run PowerShell, and the new instructions tell Inspector to lint with PSScriptAnalyzer through `pwsh` and run small Pester tests on its own computer. Whether it can actually do that, I'll find out on the first real review. I'll update this entry when it happens.

![Before and after: a deploy-gate template used for code review, rebuilt as a checker whose first real review hasn't happened yet](/build-log/images/makers-and-one-checker/before-after.svg)

## Do it yourself

The pattern works for any team of AI assistants that write code.

**1. Name your makers.** Which bots (or people, or other AI tools like Microsoft 365 Copilot) write code or scripts? Each one owns its own code and is the only one that changes it.

**2. Make one checker that owns no code.** Core of its instructions:

```text
You harden code and scripts, no matter who wrote them. You never own code and never ship it.
Report: verdict (pass / pass with fixes / fail), then findings worst first.
Each finding: the problem, a concrete way it breaks (input or state, then what goes wrong),
and its status: proven (you reproduced it) or reasoned (you didn't).
If you can't name how it breaks, it's a nitpick. Leave it out.
Hand back a minimal patch in the author's style. No rewrites, no new features.
Say what you checked and what you couldn't check.
Never apply fixes, push, merge, or deploy. Never claim a test passed if you didn't run it.
```

**3. Give it your standards.** Mine for PowerShell: silent, safe to rerun, works on 5.1, admin only through fixed scheduled tasks, no UAC bypass, no hardcoded secrets.

**4. Give it a way to prove things.** For PowerShell, that's `pwsh` plus PSScriptAnalyzer and Pester on the checker's own machine:

```powershell
Install-Module PSScriptAnalyzer, Pester -Scope CurrentUser
Invoke-ScriptAnalyzer -Path .\script.ps1 -Severity Warning, Error
```

**5. Route the patch back to the owner.** The maker applies it and reruns it. The checker never touches the target machine.

**Caveats**

- A checker that can't run the code can only reason about it. Make it say so on every finding.
- `pwsh` on Linux isn't Windows PowerShell 5.1. Lint results carry over well; anything that touches the registry, scheduled tasks, or Windows-only cmdlets still needs a real run on Windows.
- Rebuilding a bot in the same chat keeps its old history. If the old job is very different, check that it isn't still acting on it.
- If you start from a template, read what it actually does. Mine was built to gate production deploys, which is a fine job, just not mine.
