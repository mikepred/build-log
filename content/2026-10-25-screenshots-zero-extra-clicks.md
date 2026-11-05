---
title: "Screenshots for the build log with zero extra clicks (skeleton, not built)"
date: 2026-10-25
tags: [windows-11, snipping-tool, powershell, onedrive, automation, grok]
summary: "Grok's advice for this build log was to post screenshots, and capturing them by hand is the slow part. Grok Sparring, one of my Grok Bot assistants, worked out a plan with Grok: the Snipping Tool stays the one shortcut, and a small PowerShell watcher handles naming and filing. Nothing is built yet."
canonical_url: "https://mikepred.github.io/build-log/screenshots-zero-extra-clicks/"
---

> **Skeleton.** The plan exists, the watcher doesn't. This gets rewritten after it's built and tested.

## Case file

- **Symptom:** every screenshot for an entry means capturing, finding the file, renaming it, and moving it somewhere my assistants can see.
- **Evidence:** Grok's advice on my first X thread was to post a shorter version with screenshots. The two it asked for were really just text, a log line and an update-history entry.
- **Cause:** the Snipping Tool's capture is fine. Everything after the capture is manual.
- **Fix (planned, not built):** turn on Snipping Tool auto-save into a **local** inbox folder. A one-line `case.txt` names the case I'm on. A PowerShell watcher renames each snip to `YYYYMMDD-HHMMSS_<case>.png` and moves it into a synced OneDrive Proofs folder.
- **Prevention (planned, unproven):** text evidence goes in as code blocks, not images. Drafting assistants flag usernames, machine names, paths and serials before an image counts as ready, and I still glance at it.
- **Lesson so far:** rename outside the synced folder, and don't trust the foreground window to tell you what was captured.

![The planned flow](/build-log/images/screenshots-zero-extra-clicks/snip-flow.svg)

## The story

Grok Sparring, one of my Grok Bot assistants, had just brought back Grok's take on my first X thread: tighten it to three posts, add screenshots. My reaction: "Gotta find a way to 'automate' the screen capture aspect of it. a project unto itself but valuable to think about (this is how projects get out of control)."

Grok Sparring pointed out that both screenshots were really text, which could be rendered as images or pasted as code. Then it offered to ask Grok for the smallest version worth building. I wanted to keep native tools: "I would prefer using native capabilities like the Snipping Tool, but that is very manual... I want to be able to minimize clicking and thinking about it, and process it as much as possible hands-off."

Grok's first answer was to turn on Snipping Tool's "Automatically save original screenshots," point it at a dedicated OneDrive folder, and optionally add a watcher that names files after the window you captured.

Grok Sparring pushed back on four things. The window in front when the file lands is usually the Snipping Tool itself, not the app you captured. Timestamps alone still leave the matching to me later. Renaming inside a OneDrive folder might cause sync conflicts. And "crop tightly" for privacy is exactly the manual step I wanted gone.

Grok's second answer took on all four. It dropped the window-title idea, called a per-session "current case" tag "the right cheap fix, not overkill," moved the renaming to a local folder before the move into OneDrive, and called assistant flagging "a gate, not a fix."

### Not built yet / still open

- No watcher script exists. Bench Tech, the Grok Bot assistant that owns my PC, is the likely builder.
- Grok's Snipping Tool setting names come from web sources and haven't been checked against my Windows build.
- Assistant flagging can miss small or low-contrast text.
- Not tested: two snips under two different case values is the planned first test.

## Do it yourself

Only steps 1 and 2 are things you can do today. The rest is the plan.

**1. Turn on auto-save in Snipping Tool.** Snipping Tool > ... > Settings, turn on automatic saving of screenshots, and change the save folder to a local, non-synced folder. (Setting names may differ on your build.)

**2. Paste text evidence as text.** Log lines, registry values and command output go in as code blocks. Screenshot only when the screen itself is the proof.

**3. (Planned) Set a case once per session.** One line in `case.txt`, like a ticket ID.

**4. (Planned) A watcher renames and moves.** It renames each new snip to `YYYYMMDD-HHMMSS_<case>.png` in the local folder, then moves it to a synced folder. It starts at login.

**5. (Planned) Review before publishing.** Have an assistant flag usernames, machine names, paths, serials, emails and phone numbers, then look yourself.

**Caveats**

- Don't name files from the foreground window at save time. It's usually the wrong window.
- Renaming files that are already inside a synced folder can create duplicates or conflicted copies.
- I'll add the watcher script here once it's built and tested.
