# X thread: One markdown file, three sites: what broke the first time my crosspost ran

Draft only. Mike schedules it himself. Post after the entry is live.

**1/5**
I write each build log post once, as a markdown file. Merge it, and a GitHub Action puts it on my site, dev.to and Hashnode. The cross-posting sat untested for a week. The first real post broke it four ways. 🧵

**2/5**
Break 1: my image links were site-relative (/build-log/images/...). Fine on my site, broken anywhere else. Now the script rewrites them to full URLs before sending, with tests that run before every cross-post.

**3/5**
Break 2: that fix's lockfile came from a newer npm than the runner's, so npm ci refused it. Break 3: Hashnode's old API host now redirects to a paid-API notice. Moved to gql-beta.hashnode.com, the host their own CLI uses.

**4/5**
Break 4 was the sneaky one. Hashnode failed and the run still went green. Now any rejected post turns the run red, while the other sites still get their copy.

**5/5**
Five small PRs between 12:29 and 2:04 AM. The next post went to all three sites on the first try. A pipeline that has never run isn't done. https://mikepred.github.io/build-log/one-markdown-file-three-sites/
