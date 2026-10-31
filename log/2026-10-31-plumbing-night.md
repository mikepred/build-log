---
date: 2026-10-31
title: a long night of plumbing
---

the "how it started" retro (#16) went out around 1:40am. getting it to actually land on dev.to and hashnode took five more small PRs, all merged between midnight and 2am:

- #17: links and images in the crossposts were site-relative, so they broke off-site. now they get rewritten to absolute URLs first.
- #18: the crosspost job died on `npm ci` because my lockfile came from a newer npm than the runner has. resynced it with npm 10.
- #19: hashnode moved its API. the old endpoint now just redirects to a notice about paid API access, so the script points at `gql-beta.hashnode.com` (same one their own CLI uses).
- #20: a one-line change to the retro so it would crosspost again.
- #21: a site rejecting a post used to be just a log line and the run still went green. now the run fails.

it's live on [the site](https://mikepred.github.io/build-log/how-it-started/), [dev.to](https://dev.to/mikepred/how-it-started-nine-bots-in-a-week-then-back-to-one-18e1) and [hashnode](https://mikepred.hashnode.dev/how-it-started-nine-bots-in-a-week-then-back-to-one).

the mishap: i canceled some old linear issues and linear's github integration closed the six draft PRs linked to them (#3, #4, #7, #9, #12, #15). they were headed for the archive anyway, so they stay closed with a note on each. lesson learned: unlink before you cancel.

the AMD boot-loop post (#2) got its last pass: tags cut to four, diagrams, social drafts. codex also caught a real mistake. i'd written that the last driver in `ntbtlog.txt` is the one that hung the boot. it isn't, necessarily. the fix compares that log against a safe mode boot and looks at drivers that load only in the normal one. it's ready to merge.

the reviewers keep piling up. copilot and cursor bugbot were already on PRs, and a small automation reads their comments, checks anything technical against a real source, and fixes what holds up. codex got added to it tonight. #22 adds claude code too: one workflow reviews every PR, another answers `@claude` mentions. it runs on a `CLAUDE_CODE_OAUTH_TOKEN` repo secret, and like any secret it isn't passed to PRs from forks.

housekeeping: my other agents will post their own transcripts to notion, kept private. the obsidian vault (plain markdown) is still on the list.
