# Facebook: My OneDrive's problem was 322,219 files, not 268 GB

Draft only. Mike schedules it himself.

So I tried to get my OneDrive organized to cut down the mental clutter, and I asked Microsoft 365 Copilot to help. Somewhere along the way "help me pick a folder structure" turned into planning a giant 500-to-1000-line audit program, and I kept saying yes to more features. The version that ran spit out 218 MB of reports, which was not helpful.

What finally worked was boring: fix the script I already had, get it to finish once, and actually read the summary. Turns out I had 322,219 files, and about 92% of them were one code project that took up less than 1% of the space. The 268 GB I was worried about was mostly photos. Deleting the project took a couple of minutes. OneDrive was still catching up on the deletes hours later. 😅

Lesson learned: start with the small version. Full story here: https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/
