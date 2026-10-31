# X thread: My OneDrive's problem was 322,219 files, not 268 GB

Draft only. Mike schedules it himself. Post after the entry is live.

**1/5**
I asked Microsoft 365 Copilot to help me reorganize OneDrive. A few turns later we had a spec for a 500-1000+ line "production-grade" audit tool and still no folder plan. What worked was narrower: fix the script, get one full run, read the numbers. 🧵

**2/5**
Copilot's v2 came labeled "alpha" with 13 features listed as missing. Its v3-beta ran but wrote 218 MB of reports, much of it re-listing every file. Its own read of that output was right: it needed summaries, not a 59 MB age report.

**3/5**
QA bot, one of my Grok Bots at the time, got one job: make it finish. Then a run looked stuck: pwsh at 2.6 GB, no new output for 12+ min, on the duplicate step. Most likely Group-Object at that scale. A plain Dictionary did that step in about a minute.

**4/5**
The full audit: 322,219 files, 105,150 folders, 268 GB. One local code repo (git worktrees + node_modules) was 296,714 files: about 92% of the count, under 1% of the space. Microsoft recommends syncing no more than 300,000 items. That counts items, not GB.

**5/5**
Deleting the repo took 2.5 min locally. OneDrive was still syncing the deletions 3+ hours later. Lessons: keep repos out of OneDrive, and ask for the smallest script that answers your question first. https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/
