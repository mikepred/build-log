---
title: "My OneDrive's problem was 322,219 files, not 268 GB"
date: 2026-10-31
tags: [onedrive, powershell, windows-11, ai-assistants]
summary: "A OneDrive reorganization turned into a spec for a 500-1000+ line audit tool before anything had finished a full run. Narrowing it to fix-and-run got me a real inventory, and it showed one local code repo was 92% of my files and under 1% of the space."
canonical_url: "https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/"
---

## Case file

- **Incident:** Oct 25, 2026
- **Symptom:** I wanted a folder plan for OneDrive. Instead I had a growing audit-tool spec, scripts with bugs, a 218 MB report I couldn't use, and later OneDrive saying "there are too many files in your "OneDrive" folder."
- **Evidence:** the fixed audit counted 322,219 files and 105,150 folders (267.82 GB). All but 14 files were online-only. One local code repo held 296,714 of those files but only about 2.4 GB.
- **Cause:** a code repo with git worktrees and `node_modules` was syncing inside OneDrive. Getting there took longer than it should have because the audit's scope kept growing (classifiers, clustering, checkpoints, ZIP packaging) before any version had produced an inventory I could use. Separately, the duplicate step crawled on that many files, most likely because of `Group-Object`.
- **Fix:** narrowed the job to "fix the existing script and get one complete run." Rewrote the audit (never download online-only files, log errors, write output outside OneDrive, Dictionary grouping, progress bars), then deleted the repo.
- **Prevention:** keep code repos out of OneDrive, check item counts and not just GB (Microsoft recommends syncing no more than 300,000 items), and ask for the smallest script that answers the question before adding features.
- **Lesson:** fix and run the narrow thing first. One honest full run answered what the spec was designing around. And OneDrive cares about how many items it tracks; size was never the issue.

## The story

This started as a cleanup, not a coding project. I asked Microsoft 365 Copilot to help me redo how my files are organized, starting with OneDrive, because I wanted to cut down the mental clutter of never knowing where anything lives. It proposed PARA (Projects, Areas, Resources, Archive). I wanted to keep the folders Windows already ships with, like Documents, Pictures, Music, and Videos, so we settled on a hybrid: Windows' libraries for media, and PARA-style folders next to them for everything else.

To design that hierarchy, Copilot wanted an inventory, and it laid out options from a folder list up to "Option 3: Full Digital Archaeology." It actually recommended the middle one. I picked Option 3. Then I asked whether it could see any content or metadata, and it described levels of visibility up to content previews. Then I asked for one script that pulled everything. So I said yes to a lot of the scope myself.

After that, each turn added more. The first script had a typo, so I asked Copilot to fix it and review the rest before writing a new one. It came back with a plan for "a production-grade audit script," and noted that a truly comprehensive one "gets large quickly (500-1000+ lines if done cleanly)," with SHA256 verification, ZIP packaging, parallel hashing, and Git and Obsidian detection. I asked it to plan v2 before writing it. The plan added a classifier, topic and project clustering, privacy levels, and a resume and checkpoint strategy. Copilot itself suggested freezing the scope there, and I agreed: "Freeze it. Write the ps1." It said a script that size should be a file, not a chat message, and told me the exact request to send for a downloadable .ps1. I sent it. The v2 it delivered came labeled as a "v2-alpha," with 13 features listed as still missing.

So I took v2 to QA bot, one of my own Grok Bot assistants at the time (it was later rebuilt as Inspector, which is part of [how it started](/build-log/how-it-started/)), with a narrower question: would this actually run? It would, but it had problems:

- It saved its report to `$HOME\Desktop`. With my Desktop backed up to OneDrive, that isn't my real Desktop, so I'd never have seen the report. And the obvious fix, the real Desktop, is inside OneDrive, where the report would show up in its own scan.
- The content-preview option ran `Get-Content` on online-only files, which makes OneDrive quietly download every one of them.
- `$ErrorActionPreference='SilentlyContinue'` meant anything it couldn't read just vanished from the counts.
- `-HashDuplicates` was declared and never used.
- If nothing was a duplicate, it never wrote the duplicates CSV.

I got a fixed v3 back and showed it to Copilot. Its review was fair. It called v3 "a significant improvement over the version I generated" and singled out the output-outside-OneDrive fix and the cloud-only handling. Then it proposed a v3-beta, said again it would likely run 500-1000+ lines, and generated it. That one also came with a list of what was missing, including checkpoint/resume and memory optimizations for libraries over 100,000 files.

v3-beta ran. While it did, I asked Copilot what upload size it could handle. It said it didn't have "a published hard limit" and gave rough ranges. The output came to 218 MB. The biggest pieces were Files.csv at about 80 MB and AgeAnalysis.csv at about 59 MB. Copilot's read of that output was accurate: it called AgeAnalysis.csv a "redundant data explosion; essentially re-listing every file" that should have been a few-KB summary. It also guessed my OneDrive held around 100,000 files. The real number turned out to be more than three times that.

At that point I had a lot of plans and still no hierarchy, so I changed approach. I went back to QA bot with one job: get one complete run I could trust.

It went through v3-beta. The new reports were genuinely good: empty folders, folders with more than 1,000 files, folder sizes, files older than five years, and common words in file names. But v3-beta had also broken things that already worked. The preview switch did nothing again. Scan errors were collected and never written anywhere. Duplicate hashing hashed every single file instead of only same-size ones, built its list with `$hashed +=` (which copies the whole array on every add), and flagged every empty file as a duplicate of every other one. The folder tree, the age breakdown, and the total size dropped out of the summary. And its CSV-safety function rewrote real file names that start with `-` or `@`. So we kept v3 as the base and merged Copilot's five reports in properly. That was v3.1.

v3.1 ran, and then it seemed to stop. The output folder had 12 files, then sat there. Task Manager showed pwsh at 2.6 GB of memory. Twelve minutes later it was still going. The 12th file was the file-name topics report, which meant it was on the duplicate step, and that step used `Group-Object Name, Length` across every file. `Group-Object` gets very slow at that scale, so it was the likely culprit. v3.2 swapped it for a plain Dictionary keyed on name and size. It also added a live progress bar to the scan and every long step, plus a "Done in hh:mm:ss" line, so I'd never again be staring at a silent window wondering whether it was dead.

v3.2 finished in about 11 minutes with zero skipped paths. On this run the duplicate step took about a minute.

![Two ways the audit went: the wide path stacked up the biggest options, a 500-1000+ line spec, alpha and beta scripts with lists of missing features, and 218 MB of reports. The narrow path fixed the existing script, found the stall in Group-Object, swapped in a Dictionary with progress bars, and got one full 11-minute run whose summary showed the answer](/build-log/images/onedrive-audit-file-count-not-size/wide-vs-narrow.svg)

The numbers:

- 322,219 files in 105,150 folders, 267.82 GB
- 322,205 of those files online-only, so the scan read metadata and downloaded nothing
- Pictures: about 251 GB, including 78 GB in just 13 Google Takeout zips
- Top file types by count: `.html`, `.pf_fragment`, `.js`, `.ts`

That last line didn't look like my stuff. It was one local code repo, git worktrees and their `node_modules` included, with 296,714 files. That's about 92% of every file in my OneDrive, and it took up only about 2.4 GB, less than 1% of the space.

![Three bars from the audit. Items OneDrive tracks: 427,369 files and folders, past Microsoft's 300,000-item sync recommendation. Files: 322,219, and one code repo is 296,714 of them, about 92%. Space: 267.82 GB, and the same repo is about 2.4 GB, under 1%](/build-log/images/onedrive-audit-file-count-not-size/count-vs-size.svg)

I'd already decided all code could leave OneDrive, so the repo got deleted. Deleting the files locally took about two and a half minutes. An empty top folder stayed behind because another app still had it open. That was the easy part.

A few hours later I asked why it was still deleting files. It wasn't my delete. It was OneDrive telling the cloud about every one of those roughly 297,000 deletions. Then OneDrive popped up: "there are too many files in your "OneDrive" folder." QA bot explained that the warning is about how many items OneDrive tracks, not about storage. Microsoft [recommends syncing no more than 300,000 items](https://support.microsoft.com/en-us/office/restrictions-and-limitations-in-onedrive-and-sharepoint-64883a5d-228e-48f5-b3d2-eb39e07630fa), files and folders together, and says performance can suffer past that. It's a guideline, not a hard cap, but my audit had counted about 427,000. Once the deletions finished syncing I'd be down to about 25,000 files. When I wrote this up that morning, more than three hours after the delete, OneDrive was still working through them.

So the 268 GB number I'd been worried about was mostly photos, and that's a normal storage problem. The thing actually slowing OneDrive down was a 2.4 GB folder. No classifier or clustering engine found that. A script that finished, and a summary I actually read, did.

## Do it yourself

These snippets are trimmed from my v3.2 script. Run them in order in one PowerShell window (Windows PowerShell 5.1 or PowerShell 7, no admin needed), since each step uses variables from the one before. Steps 1 to 6 only read OneDrive (step 3 writes one error CSV outside it). Step 7 deletes.

**1. Find OneDrive and keep the report out of it.** With Known Folder Move on, `$HOME\Desktop` is the old, unused folder. `[Environment]::GetFolderPath('Desktop')` returns the Desktop you actually see, which may be inside OneDrive, so check before writing there.

```powershell
foreach ($candidate in @($env:OneDrive, $env:OneDriveCommercial, $env:OneDriveConsumer)) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) { $OneDrivePath = $candidate; break }
}
$desktop = [Environment]::GetFolderPath('Desktop')
$inOneDrive = $desktop -and $desktop.StartsWith($OneDrivePath.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)
if ($desktop -and -not $inOneDrive) { $OutputDir = $desktop } else { $OutputDir = $env:USERPROFILE }
```

**2. Flag online-only files instead of opening them.**

```powershell
$RecallOnDataAccess = 0x400000
$RecallOnOpen       = 0x40000
function Test-CloudOnly($Item) {
    $a = [int]$Item.Attributes
    return (($a -band $RecallOnDataAccess) -ne 0) -or (($a -band $RecallOnOpen) -ne 0) -or
           (($a -band [int][IO.FileAttributes]::Offline) -ne 0)
}
```

Skip hashing and previews for anything this returns `$true` for.

**3. Scan with errors logged and a live count.** Do not use `Get-ChildItem -Recurse` on Windows PowerShell 5.1: it follows directory junctions and directory symlinks, which can inflate counts (git worktrees, some `node_modules` layouts) or walk outside OneDrive. PowerShell 7 only follows them if you pass `-FollowSymlink`. This walk lists every item, including the junction folder itself and online-only files (also reparse points), but only descends into ordinary directories.

```powershell
$scanErrors = @()
$allList = New-Object 'System.Collections.Generic.List[object]'
$dirs = New-Object 'System.Collections.Generic.Queue[string]'
$dirs.Enqueue($OneDrivePath)
while ($dirs.Count -gt 0) {
    $dir = $dirs.Dequeue()
    Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue -ErrorVariable +scanErrors |
        ForEach-Object {
            $allList.Add($_)
            if ($allList.Count % 2000 -eq 0) {
                Write-Progress -Activity 'Scanning OneDrive' -Status "$($allList.Count) items"
            }
            if ($_.PSIsContainer -and (($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0)) {
                $dirs.Enqueue($_.FullName)
            }
        }
}
Write-Progress -Activity 'Scanning OneDrive' -Completed
$fileRows = @($allList | Where-Object { -not $_.PSIsContainer })
$scanErrors | ForEach-Object { [pscustomobject]@{ Path = $_.TargetObject; Error = $_.Exception.Message } } |
    Export-Csv (Join-Path $OutputDir 'onedrive-scan-errors.csv') -NoTypeInformation
"Skipped paths: $($scanErrors.Count)"
```

`SilentlyContinue` is fine here because `-ErrorVariable` still collects every skipped path, and the CSV shows you what's missing from the counts.

**4. Group duplicates with a Dictionary, not `Group-Object`.**

```powershell
$byNameSize = New-Object 'System.Collections.Generic.Dictionary[string,System.Collections.Generic.List[object]]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($f in $fileRows) {
    $key = $f.Name + '|' + $f.Length
    $list = $null
    if (-not $byNameSize.TryGetValue($key, [ref]$list)) {
        $list = New-Object 'System.Collections.Generic.List[object]'
        $byNameSize[$key] = $list
    }
    $list.Add($f)
}
$dupeGroups = @($byNameSize.Values | Where-Object { $_.Count -gt 1 })
"Name + size matches: $($dupeGroups.Count) groups"
```

**5. If you hash, hash only files that share a size with another file.** Empty files all "match" each other, and online-only files would download, so leave both out.

```powershell
$sizeCount = @{}
foreach ($f in $fileRows) { $sizeCount[[long]$f.Length] = 1 + [int]$sizeCount[[long]$f.Length] }
$toHash = @($fileRows | Where-Object { $_.Length -gt 0 -and $sizeCount[[long]$_.Length] -gt 1 -and -not (Test-CloudOnly $_) })
"Files worth hashing: $($toHash.Count)"
```

**6. Count items, not just gigabytes.** Files plus folders is the number Microsoft's 300,000-item sync recommendation is about.

```powershell
$folderCount = $allList.Count - $fileRows.Count
$gb = ($fileRows | Measure-Object Length -Sum).Sum / 1GB
'{0:N0} files + {1:N0} folders = {2:N0} items, {3:N2} GB' -f $fileRows.Count, $folderCount, $allList.Count, $gb
```

No script handy? Right-click the OneDrive folder in File Explorer, pick **Properties**, and read the **Contains** line. That's Microsoft's own quick check, and it counts the local folder only.

**7. Deleting a big folder.** I used `rd` with the long-path prefix. Close anything that has the folder open first (editors, terminals, dev servers).

```powershell
$repo = Join-Path $OneDrivePath 'path\to\the-repo'   # set this to the exact folder
cmd.exe /c rd /s /q "\\?\$repo"
```

**Caveats**

- Start small. Ask for (or write) the smallest script that answers your actual question, run it on the whole thing, and only then add features. Classification, clustering, and checkpoints can wait until a full run shows you need them.
- Reading an online-only file's contents (previews, `Get-FileHash`, `Get-Content`) downloads it. On a mostly cloud OneDrive, that can mean a lot of downloading.
- `rd /s /q` doesn't ask, and it skips the Windows Recycle Bin. Double-check `$repo` first.
- Deletions inside OneDrive still sync to the OneDrive recycle bin online. You can restore from there for 30 days on a personal account (93 on work or school, unless an admin changed it). Don't count on it as a backup.
- Deleting locally is quick. Syncing hundreds of thousands of deletions to the cloud can take hours. Leave OneDrive running, and don't re-run the audit until it says it's up to date.
- The 300,000-item number is Microsoft's performance guideline, not a hard limit. Past it, expect slow syncing, not lost files.
- The scan holds every item in memory. Mine had pwsh at 2.6 GB with about 427,000 items.
- Junction folders still appear in the inventory once. Their targets are not walked, so linked worktrees are not counted twice and a junction out of OneDrive is not followed.
