# LinkedIn: One markdown file, three sites: what broke the first time my crosspost ran

Draft only. Mike schedules it himself.

My build log is one markdown file per post in a public GitHub repo. When I merge a post, a GitHub Action builds the site on GitHub Pages and sends the same file to dev.to and Hashnode, each with a canonical link back to the original.

I built that in a weekend and then it sat for a week with nothing to send. The first real post broke it in four places:

1. Image links were site-relative, so they'd have broken on the other two sites.
2. The fix for that came with a lockfile from a newer npm than the CI runner uses, so the install step refused it.
3. Hashnode retired its old API host. It now redirects to a paid-API notice.
4. When Hashnode failed, the run still finished green. I only found out by reading the log.

Five small pull requests later, all merged between 12:29 and 2:04 AM, it works. The next post went to all three sites on its first try with nobody touching it.

What I'd tell anyone building something similar: make every send safe to repeat, test the parts you can, make the run fail loudly when any site rejects a post, and watch the first real run. A pipeline that has never run isn't done.

The full write-up, with the workflow and code:
https://mikepred.github.io/build-log/one-markdown-file-three-sites/
