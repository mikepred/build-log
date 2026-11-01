# LinkedIn: Giving my Grok Bot assistant admin rights without switching off UAC

Draft only. Mike schedules it himself.

dr eggbot, one of my Grok Bot assistants, runs PowerShell on my Windows 11 PC from a normal, non-admin terminal. So every admin step came back to me as "paste this into an elevated window." After a few of those, I asked about setting up SSH so it could run them itself.

It talked me out of it. On Windows, an SSH session to localhost for an admin account runs fully elevated with no UAC prompt, and the key would sit in my profile where anything running as me could use it. That's UAC switched off in all but name.

What we built instead is a fixed menu: five elevated scheduled tasks (restore point, settings, apps, crash-dump copy, and a read-only check), running scripts from a folder only admins can change. My normal account can start those tasks but not edit them. We tested that from the normal account: writing to the folder, editing the runner, and re-registering a task were all blocked.

Adding a new action means rerunning the installer from an admin window, and that's my approval step.

It's not a sandbox. Anything running as me can still start those five tasks. But "five verbs I chose" is a much smaller blast radius than "any command as admin."

There's also a side story about a "winget hang" that turned out to be a bad flag combination. The lesson there: read the tool's own log before you blame it.

Give the assistant verbs, not a shell.

https://mikepred.github.io/build-log/ai-assistant-admin-without-breaking-uac/
