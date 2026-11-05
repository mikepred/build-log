# Projects

These are the projects behind Build Log. Most started with something I wanted to fix or connect in my own setup. Some have published case notes; others are still being tested or written up.

## Build Log and its publishing pipeline

The original posts live in a GitHub repository alongside an Astro site and scripts that send copies to Hashnode and dev.to. I review and merge changes; GitHub Actions handles publishing.

The first real crosspost exposed broken image links, a retired endpoint, and a successful-looking run that had hidden a failure. [Read the publishing case](https://mikepred.github.io/build-log/one-markdown-file-three-sites/) or [browse the repository](https://github.com/mikepred/build-log).

## Shared memory across AI assistants

I want an assistant to pick up a project without making me explain every earlier decision. The system I’ve been working on takes transcripts through Notion into an add-only source folder, compiles a wiki in Obsidian, and makes selected material available through Hindsight.

The source trail matters as much as recall. Raw transcripts stay separate from the material shared through the memory bank. When sources disagree, the wiki records the conflict and waits for evidence that settles it. Articles about the pipeline and its source-based wiki are drafted and awaiting review.

## AI code review and controlled fixes

The design is several reviewers reading a change in parallel, with one assistant responsible for fixes and me responsible for merging. A cap on fix rounds keeps the process from going indefinitely.

The work also means checking whether a review actually happened. An installed reviewer or a green check doesn’t establish that anyone read the final change. An article about the trigger problems, skipped reviews, and fixer behavior is drafted and awaiting review.

## Independent drafts from the same evidence

I’m testing whether separate assistants can produce more useful drafts when they start from the same evidence without reading the existing article or each other’s work. The intended process is independent drafting, collation, fact-checking, and my review. This is an experiment, not a finished process.

The [running log](https://mikepred.github.io/build-log/log/#2026-11-05-blind-rework) records an early update; a fuller article is drafted and awaiting review.

## Windows troubleshooting and maintenance

This is an ongoing part of looking after my own PC. I use PowerShell and AI assistance to inspect evidence, narrow down causes, and make useful fixes repeatable.

- [AMD driver update and boot recovery](https://mikepred.github.io/build-log/windows-update-amd-chipset-driver-broke-boot/)
- [OneDrive file-count audit](https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/)
- [Assistant admin access without switching off UAC](https://mikepred.github.io/build-log/ai-assistant-admin-without-breaking-uac/)

## Follow the work

The [running log](https://mikepred.github.io/build-log/log/) has shorter updates between posts. For a reading guide, see [Start Here](/build-log/start-here/). For my background and how I use AI in the work, see [About](/build-log/about/).
