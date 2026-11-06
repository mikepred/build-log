---
title: "Rebuilding my Windows setup as scripts I can rerun (half done)"
date: 2026-10-24
tags: [windows-11, winget, powershell, automation, reinstall]
summary: "After a fresh Windows 11 Pro install I wanted the whole setup silent and repeatable. dr eggbot, one of my Grok Bot assistants, turned a before/after diff of my GUI changes into a rerunnable tweaks script and wrapped winget in an apps script whose own tests caught three bugs. The fresh-install test hasn't happened yet."
canonical_url: "https://mikepred.github.io/build-log/rerunnable-windows-setup-winget/"
---

## Case file

- **Symptom:** every reinstall meant redoing the same Settings changes and app installs by hand, from memory.
- **Evidence:** a registry and power-settings diff from before and after my GUI changes. `C:\Windows.old` looked empty from dr eggbot's non-admin terminal, so there was no old app list to recover.
- **Cause:** my setup only existed in my head and in the Settings app.
- **Fix (partial):** `01-tweaks.ps1` changes only what doesn't match and has a `-Check` mode. `02-apps.ps1` plus an `apps.json` list updates the Store, waits for App Installer, installs with `winget import`, and upgrades the rest. Its install mode hasn't had a real run yet.
- **Prevention (planned, unproven):** an `autounattend.xml` that starts the scripts at first logon, and one clean run on a fresh install. Neither exists yet.
- **Lesson:** keep apps out of the install image and in a list winget reads. Then make each script check itself against the real machine before you trust it.

![02-apps.ps1 steps, and the pieces still open](/build-log/images/rerunnable-windows-setup-winget/setup-flow.svg)

## The story

I had just reinstalled Windows 11 Pro. The Gigabyte chipset drivers were in, the NVIDIA Studio driver was installing, and I'd run `powercfg hibernate off`. I reinstall Windows pretty often, so everything after that I wanted in a script I could run silently next time. So I asked dr eggbot, one of my Grok Bot assistants: "I'm thinking if it could/should be slipstreamed, but thinking it's better to use winget post-install for the latest versions."

It agreed with the second half. Apps baked into an install image are stale the day you use it, and every update means rebuilding the ISO. The only thing worth adding before setup is an `autounattend.xml` answer file that launches the scripts at first logon, and only if I want it fully hands-off. Drivers stay manual, since they change rarely and need a human to look at them.

Instead of typing out every tweak I make, I suggested a diff. dr eggbot saved a "before" snapshot of the registry and power settings, I made my usual changes in Settings, and it compared the two. Its diff script hit a bug on the first try, so it reran. The result was a list of what I'd actually changed: dark mode, transparency off, accent color on title bars, some animations off, Spotlight swapped for a folder slideshow, a bigger yellow pointer, sleep and display-off set to never on AC, Best Performance, long paths, clipboard history, End task on the taskbar, Game Mode off.

One item surprised it: advertising ID and tailored experiences had gone from off to **on**. dr eggbot flagged that as usually the opposite of what people want. I meant it, out of curiosity, so the script keeps them on and has a `-TailoredAds $false` switch to undo it. Two things won't script cleanly. The slideshow folder is stored in a format tied to this exact install, and Settings builds the colored pointer's files the first time you pick it. Those stay one-click manual steps.

`01-tweaks.ps1` reported every setting already matched. To prove the check worked, dr eggbot ran it with the ads switch flipped, and it caught exactly those two settings.

Apps were harder because I had no list. With no old list to recover, I'm starting from scratch: install things as I remember them, then run `02-apps.ps1 -Export` to rebuild `apps.json` from what's installed. Its first export picked up 18 entries, mostly things that ship with Windows or runtimes, which I'll prune. Out of curiosity I asked how big the catalog is: 15,773 packages in the main winget source, and `winget search` caps at 1,000 results. dr eggbot exported the whole thing to a spreadsheet so I could browse it.

The apps script's own tests caught three bugs before I ran it for real:

1. An empty `apps.json` was read as one blank app ID. Filtering out empty values fixed it, and the check then reported "All 0 app(s) installed."
2. `winget list` rejected `--accept-package-agreements`, so Edge showed as "not installed" until that flag was dropped from the check.
3. The wait-for-App-Installer loop never saw it as current, because the text it matched also appeared in winget's "Found App Installer..." line. It now waits for "No available upgrade" or "No installed package".

App Installer had already updated itself to 1.29 by then anyway.

I suggested refreshing winget's sources before each run. `winget source reset --force` needs admin, so the script skips it when it isn't elevated and still runs `source update`. dr eggbot then added a restore point before installs, exact IDs, pins, verbose logs, and something called the wininet downloader. I had to ask: "I must have missed, wininet downloader?" By default winget usually hands downloads to Delivery Optimization, the same polite background service Windows Update uses, and it sometimes sits at 0%. wininet is a plain direct download, like a browser. The tradeoff is that it doesn't throttle itself.

Then the night went sideways. Windows Update pushed a driver that put the PC in a boot loop (that's [its own entry](https://mikepred.github.io/build-log/windows-update-amd-chipset-driver-broke-boot/)), and giving dr eggbot admin without killing UAC became [another one](https://mikepred.github.io/build-log/ai-assistant-admin-without-breaking-uac/). Bench Tech, a newer Grok Bot assistant that owns the PC, took over the app list. I agreed to hold this entry until there's an ending.

### Not built yet / still open

- No real run of `02-apps.ps1` in install mode. Only `-Check` and `-Export` have run.
- `apps.json` isn't final, and the stock and runtime entries haven't been pruned.
- No `autounattend.xml` and no master script that chains tweaks and apps.
- Never tested on a fresh install, which is the whole point.

## Do it yourself

These are trimmed from my scripts. Run them from an admin PowerShell, as the user who should get the settings.

**1. Diff your GUI changes instead of remembering them.** Export before, change things in Settings, export after, compare. (dr eggbot's own snapshot script was more thorough. This is the simple version.)

```powershell
reg export HKCU "$env:TEMP\before.reg" /y
# ...make your changes in Settings...
reg export HKCU "$env:TEMP\after.reg" /y
Compare-Object (Get-Content "$env:TEMP\before.reg") (Get-Content "$env:TEMP\after.reg")
```

**2. Write each setting so it only changes what differs, and can report drift.**

```powershell
param([switch]$Check)
$drift = New-Object System.Collections.Generic.List[string]
function Set-Reg([string]$Path, [string]$Name, $Value, [string]$Type = 'DWord') {
  $cur = (Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue).$Name
  if ("$cur" -eq "$Value") { return }
  if ($Check) { $drift.Add("$Path\$Name is '$cur', want '$Value'"); return }
  if (-not (Test-Path $Path)) { New-Item -Path $Path -Force | Out-Null }
  New-ItemProperty -Path $Path -Name $Name -Value $Value -PropertyType $Type -Force | Out-Null
}
Set-Reg 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' AppsUseLightTheme 0
```

To test the check, flip one value on purpose and confirm `-Check` reports exactly that one.

**3. Get App Installer current before winget does anything.** This is the same as "Get updates" in the Store:

```powershell
Get-CimInstance -Namespace 'Root\cimv2\mdm\dmmap' -ClassName 'MDM_EnterpriseModernAppManagement_AppManagement01' |
  Invoke-CimMethod -MethodName UpdateScanMethod | Out-Null
$deadline = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $deadline) {
  $out = winget upgrade --id Microsoft.AppInstaller --exact --accept-source-agreements --disable-interactivity | Out-String
  if ($out -match 'No available upgrade|No installed package') { break }
  Start-Sleep -Seconds 15
}
```

**4. Optional: switch winget to the wininet downloader.** Run `winget settings`, and under `"network"` add `"downloader": "wininet"`. Delete the line to go back.

**5. Install from a list, then upgrade the rest.**

```powershell
winget source update --disable-interactivity
winget import -i .\apps.json --ignore-unavailable --no-upgrade --accept-package-agreements --accept-source-agreements --disable-interactivity
winget upgrade --all --silent --include-unknown --accept-package-agreements --accept-source-agreements --disable-interactivity
```

**6. Build the list from your machine.** `winget export -o apps.json --source winget` writes what's installed now. Prune the stock apps and runtimes by hand.

**Caveats**

- `winget list` doesn't accept `--accept-package-agreements`. Keep that flag on install and upgrade commands only.
- An empty package list can come back as one blank ID. Filter with `Where-Object { $_ }`.
- `winget source reset --force` needs admin.
- `HKCU` changes apply to whoever runs the script.
- wininet doesn't throttle, so big installs can use all your bandwidth.
- I haven't run any of this on a fresh install yet. Treat it as a starting point.
