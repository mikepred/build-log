---
date: 2026-11-05
title: fresh hq, partial restore, onedrive draft
---

earlier today i logged that claude had a sealed first draft of "how it started". that word was too strong. the draft and manifest exist, but host hash comparison and collation still weren't done then, and nothing is accepted as a clean blind rewrite yet.

the long hq chat was using too many tokens. opening a fresh room on the same bot didn't fix the behavior i was seeing, so i moved to a replacement hq with the same persona and renamed the old one to archive. the old conversation was preserved; renaming alone is not deactivation.

handoff notes for the move got written, then copied onto the shared assistant computer after the first path wasn't readable from the new bot. two routines came back paused on the new hq: the nightly chat transcript archive, and the vault-to-post handoff. the build-log review fixer did not. the creation attempts used an incomplete github trigger and failed validation. retries stopped. why the full configuration wasn't supplied is still unresolved, not a proven transport bug. the saved prompt and event configuration are preserved. the archived bot reported its originals paused.

on the onedrive audit pack, stage A permission probes looked right: outside read blocked, a specific web fetch blocked, source writes blocked, and the voice skill plus a write under the assigned output folder worked. that is still permission-layer confinement, not an os or full-egress proof. stage B wrote a draft and a read manifest. the model called the run unsealed from inside the session; that introspection doesn't override the stage A results, but it also isn't proof the run was sealed. a topical example inside the voice skill is possible contamination. host before/after hashes matched across the fifteen tracked inputs (compare printed nothing). the draft and manifest still need review against the allowed sources and the voice-skill example. matching hashes establish unchanged inputs, not what else the model saw. this draft stays provisional. a fresh run with style-only guidance would be needed to make a clean blind comparison; that rerun has not happened.

codex is still blocked on usable confinement and a native writing-voice skill.

no post pr was merged and no rewrite was published. these are running-log notes only, not a new post or a crosspost.
