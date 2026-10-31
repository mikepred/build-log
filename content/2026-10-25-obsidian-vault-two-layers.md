---
title: "An Obsidian vault in two layers, so my bots don't step on each other (design only)"
date: 2026-10-25
tags: [obsidian, knowledge-management, publishing, ai-assistants]
summary: "I didn't want Obsidian to be a plain copy of my build log. dr eggbot, one of my Grok Bot assistants, proposed two layers: the public entries, unchanged, and a private graph of topic notes and links around them, kept by a new librarian bot called Stacks. It's a design so far."
canonical_url: "https://mikepred.github.io/build-log/obsidian-vault-two-layers/"
---

## Case file

- **Symptom:** the plan was to clone the build-log repo into Obsidian. That gives you a folder of files with no links between them, which isn't much of a knowledge base.
- **Evidence:** Obsidian's `[[wikilinks]]` don't render on the public site or on dev.to, so links can't live inside the public entries.
- **Cause:** one set of files was being asked to be both a clean public post and a private, linked notebook.
- **Fix (design only):** two layers in one vault. The entries layer is the public posts, unchanged, written by Case Notes. The graph layer is private topic notes, index pages and links, written by Stacks.
- **Prevention (planned, unproven):** entries are never edited inside the vault. A link I want public goes back through a pull request. Nothing is built yet beyond an empty vault.
- **Lesson:** when two writers share a space, give each one its own layer, and decide which one is public.

![Two layers in one vault](/build-log/images/obsidian-vault-two-layers/two-layers.svg)

## The story

The original idea was simple: Obsidian would mirror the build-log repo. Then I thought about what Obsidian is actually good at. I told dr eggbot, one of my Grok Bot assistants: "Obsidian needs to be written to (not just cloned--considering it's like a graph knowledge base and requires a whole different type of organization?)" I figured Case Notes would still do most of the writing, "but maybe not the design." And I admitted I was "still unsure yet."

dr eggbot agreed a plain clone would just be files with no links. Its proposal was two layers.

The **entries layer** belongs to Case Notes. Each build-log entry goes into the vault when it merges, with the same text as the repo and tags in the frontmatter.

The **graph layer** belongs to a librarian. It holds topic notes like winget, scoped admin, crash dumps and Hermes, plus index pages that tie them together and links from the entries out to my private notes. None of it is public. This layer is what turns a folder into a knowledge base.

The one rule that makes it work: no `[[double-bracket]]` links inside the entries, because they'd show up broken on the site and on dev.to. The librarian adds links *around* the entries instead. If I add a link in Obsidian that should be public, that change goes back through a PR like any other edit.

dr eggbot then created the librarian, Stacks, another Grok Bot assistant. Its first move was a wrong turn, and partly mine: it started inventorying the Obsidian vault already in my OneDrive. That vault is from an old attempt. I stopped it: "we're starting fresh." There's a new, empty vault on another drive for this.

Stacks looked at the new one. It had Obsidian's default welcome note, core plugins only, and the build-log repo wasn't cloned in yet (Bench Tech, the bot that owns my PC, handles that). Stacks wrote a design page and left a few calls for me: eight starter tags, an "Index - " prefix for index pages, sentence-case topic titles, and daily notes off for now. I haven't signed off.

### Not built yet / still open

- When Stacks wrote the design, the vault held only Obsidian's welcome note. No folders, templates or topic notes yet. (Stacks has since been asked to start an `Ideas` folder in it. That's a separate thread, and this draft doesn't cover it.)
- The build-log repo isn't cloned into it.
- I haven't approved Stacks' design choices (tags, naming, daily notes).
- Moving the vault into OneDrive for safekeeping is undecided.
- How entries get from the repo into the vault on merge isn't settled.

## Do it yourself

This is the rule set, not a tested setup.

**1. Decide which notes are public.** Anything that gets published elsewhere is an "entry." Keep entries byte-for-byte the same as the published version.

**2. Keep links out of public notes.** Use frontmatter `tags` in entries. Put `[[wikilinks]]` only in private notes.

**3. Build the graph around the entries.** One topic note per idea, with links to the entries that mention it. Add index pages as entry points.

**4. One writer per layer.** In my setup, Case Notes writes entries and Stacks writes the graph. Neither edits the other's notes.

**5. Route public edits back to the source.** If an entry needs a change, change it in the repo and let it flow back into the vault.

**Caveats**

- I haven't run this yet. I'll update the entry once the vault is in use.
- If you sync the vault with a cloud folder, think about which notes are private before you do.
