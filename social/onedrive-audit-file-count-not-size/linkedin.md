# LinkedIn: My OneDrive's problem was 322,219 files, not 268 GB

Draft only. Mike schedules it himself.

I set out to reorganize my OneDrive and ended up with a lesson about scope.

I asked Microsoft 365 Copilot for help with the folder structure. To design it, it wanted an inventory. I said yes to the biggest option, then to content previews, then to "one script that pulls everything." Turn by turn the plan grew into a 500-1000+ line "production-grade" tool with a classifier, project clustering, checkpoints, and ZIP packaging. The scripts that came back were honestly labeled alpha and beta, each with a list of features still missing. The one that ran produced 218 MB of reports, much of it re-listing every file.

So I narrowed the job: fix the existing script and get one complete run I could trust. One of my Grok Bot assistants fixed the bugs (previews that downloaded online-only files, errors that vanished from the counts, a report location that didn't account for OneDrive) and replaced a duplicate step that stalled at scale, most likely in Group-Object, with a Dictionary. The full audit finished in about 11 minutes.

The answer was in the summary: 322,219 files and 268 GB, and one local code repo was 92% of the files and less than 1% of the space. Microsoft recommends syncing no more than 300,000 items in OneDrive, and that guideline is about item count, not storage.

Two takeaways: ask for the smallest thing that answers your question before building the big version, and if OneDrive feels slow, count items, not gigabytes.

Write-up with the PowerShell: https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/
