# X thread: Giving my Grok Bot assistant admin rights without switching off UAC

Draft only. Mike schedules it himself. Post after the entry is live.

**1/5**
dr eggbot, one of my Grok Bot assistants, kept handing me admin commands to paste. The easy fix was SSH to localhost. On Windows an admin's SSH session runs fully elevated with no UAC prompt, and the key sits in my profile, so anything running as me could get silent admin. 🧵

**2/5**
So no SSH. It gets a fixed menu of five elevated scheduled tasks instead: RestorePoint, Tweaks, Apps, SaveDumps, Check. A runner script refuses anything else, and it lives in a folder only admins can change.

**3/5**
Each task's permissions let my normal account start it but not edit it. Tested from that account: writing to the folder, blocked. Editing the runner, blocked. Re-registering a task, access denied.

**4/5**
The first real run "hung," and I blamed winget. Its own log said it never ran: a bad flag combo made it quit instantly, and PowerShell was stuck on an output pipe. Read the tool's log before you blame it.

**5/5**
Adding a new action means rerunning the installer from an admin window. That paste is my approval step. Give the assistant verbs, not a shell.

Write-up + scripts: https://mikepred.github.io/build-log/ai-assistant-admin-without-breaking-uac/
