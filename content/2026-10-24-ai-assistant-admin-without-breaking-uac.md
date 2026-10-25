---
title: "Giving my Grok Bot assistant admin rights without switching off UAC"
date: 2026-10-24
tags: [windows-11, uac, powershell, task-scheduler, security, ai-agents]
summary: "SSH to localhost would have given dr eggbot, one of my Grok Bot assistants, silent admin and quietly gutted UAC. Instead it gets a fixed menu of elevated scheduled tasks it can start but not change, and I tested that boundary from the normal account."
canonical_url: "https://mikepred.github.io/build-log/ai-assistant-admin-without-breaking-uac/" # PLACEHOLDER: site not live yet
---

## Case file

- **Symptom:** dr eggbot, one of my Grok Bot assistants, ran commands from a non-admin terminal, so every admin step became "paste this into an elevated window."
- **Evidence:** restore points, HKLM writes, `bcdedit`, and SYSTEM tasks all need admin.
- **Cause:** the obvious fix, SSH to localhost as an admin, means an elevated session with no prompt, plus a key in my profile that anything running as me could use.
- **Fix:** a fixed menu of elevated scheduled tasks under `\WinSetup\`, running scripts from an admins-only folder. My normal account can start them but not edit them.
- **Prevention:** new actions require rerunning the installer elevated, which is my approval step.
- **Lesson:** give the assistant verbs, not a shell. Check the boundary from the account it actually runs as.

## The story

I was rebuilding my Windows 11 setup with dr eggbot, one of my Grok Bot assistants. It runs PowerShell on my PC, but its terminal isn't elevated, so every admin-only step came back to me as a command to paste. After a few of those I asked: can we set up an SSH key pair so it can run these itself?

It's doable, but dr eggbot laid out the catch first. You turn on Windows' built-in SSH server, authorize a key, and dr eggbot runs `ssh` to my own machine. On Windows, an SSH session for an admin account runs fully elevated with no UAC prompt. So it would have admin. But the private key has to sit in my profile so its terminal can use it, which means *anything* running as me could use that key to get admin silently. That effectively switches UAC off on the machine.

My options were full SSH admin, a narrow set of admin tasks, or keep pasting. Could the narrow version run something like `Enable-ComputerRestore`? Yes, if it was on the menu. What it can't do is run a brand-new admin command on the spot. Adding anything new means updating the protected copy of the scripts, and that takes one paste from me. That paste is my approval step, so I went with the narrow version.

What it built: a folder only admins can change, holding a `runner.ps1` that accepts exactly five actions (RestorePoint, Tweaks, Apps, SaveDumps, and Check, which came later) and refuses anything else. There's one scheduled task per action under `\WinSetup\`. Each runs elevated as me, only while I'm signed in, only when started, and writes a log dr eggbot can read. My normal account can start those tasks but not edit them.

I pasted the installer once from an admin window. dr eggbot started the RestorePoint task from its non-admin terminal, and it worked: a fresh restore point, exit 0. Then it tested the boundary from my normal account. Writing a file into the folder: blocked. Appending to `runner.ps1`: blocked. Re-registering the task with a changed definition: access denied. It can start the tasks. It can't change what they do.

### Coda: the hang that wasn't winget

The first real job was applying my tweaks script through the Tweaks task. The registry changes landed, but the task just sat at "Running" for over five minutes with nothing in the log past the header. The last step was `winget configure --enable`, so we blamed winget: a hidden task has no console, and winget probably wanted one. We moved that step into its own process with a time cap, reran it, and it came back clean in two seconds. Case closed, I thought.

It wasn't. When dr eggbot finally read winget's own log, winget hadn't run at all on either attempt. I'd passed `--enable` together with `--disable-interactivity`, and winget rejects that combination: "Option '--enable' and '--disable' cannot be used with other arguments." It quit within milliseconds both times. On the first run, the thing actually hanging was PowerShell, still waiting on the inline `| Out-Null` pipe after winget had already exited. Why that pipe stayed open is still unproven. The "clean" rerun was only clean because `Start-Process` doesn't pipe output, and the feature I wanted was never turned on.

The real fix was the correct flag (`--enable` alone) plus running winget as its own process. On the next run winget's log showed "Leaf command succeeded: root:configure", and the task finished in about six seconds. The cap is now five minutes, since `--enable` can download from the Store, and it's there as insurance, not as the fix. It never fired. The lesson I'm keeping: read the tool's own log before blaming a hang on it.

It also turned up a second bug: run without admin, the check mode called a SYSTEM-owned task "missing" because it simply couldn't see it. Now it says "not checked (needs admin)".

I asked: didn't I give it admin? Sort of. It could *apply* settings through the menu, but not read admin-only state back. So we added a fifth task, **Check**. It's read-only and runs the tweaks drift check elevated. I reran the installer, dr eggbot started Check itself, and it came back with "All settings match." and exit 0. It verified admin-only state without getting any broader admin.

## Do it yourself

The scripts below are trimmed versions of what I run, cut down to the parts that matter for this setup. This assumes your everyday account is an administrator under UAC. Keep your scripts in a working folder such as `%USERPROFILE%\WinSetup`.

**1. The runner** (`runner.ps1`): a fixed menu, logged.

```powershell
param([Parameter(Mandatory)][ValidateSet('RestorePoint','Tweaks','Apps','SaveDumps','Check')][string]$Action)
$root = $PSScriptRoot
$logs = Join-Path $root 'logs'; New-Item $logs -ItemType Directory -Force | Out-Null
Start-Transcript -Path (Join-Path $logs ('{0}-{1:yyyyMMdd-HHmmss}.log' -f $Action, (Get-Date))) | Out-Null
$code = 0
try {
  switch ($Action) {
    'RestorePoint' {
      Enable-ComputerRestore -Drive 'C:\'
      New-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore' -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force | Out-Null
      Checkpoint-Computer -Description 'WinSetup: manual restore point' -RestorePointType MODIFY_SETTINGS
    }
    'Tweaks' { & (Join-Path $root '01-tweaks.ps1') }
    'Apps'   { & (Join-Path $root '02-apps.ps1') }
    'Check'  { & (Join-Path $root '01-tweaks.ps1') -Check }   # read-only drift report
    'SaveDumps' { <# PLACEHOLDER: in my setup this runs the dump-copy script from my crash-evidence entry. Put your own action here or remove it from the list. #> }
  }
} catch { $code = 1; "ERROR: $($_.Exception.Message)" }
"RESULT: $Action exit $code"
Stop-Transcript | Out-Null
exit $code
```

**2. The installer** (`install-admin-tasks.ps1`): rerun it whenever the scripts change.

```powershell
$ErrorActionPreference = 'Stop'
$id  = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run this from an admin PowerShell.' }
$src = $PSScriptRoot; $dst = 'C:\ProgramData\WinSetupAdmin'
$user = $id.Name; $sid = $id.User.Value

# Administrators + SYSTEM full control, Users read/run. Inheritance off. Owner = Administrators.
New-Item $dst -ItemType Directory -Force | Out-Null
icacls $dst /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX' | Out-Null
icacls $dst /setowner '*S-1-5-32-544' /T /C | Out-Null
foreach ($f in 'runner.ps1','01-tweaks.ps1','02-apps.ps1','apps.json') { Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force }

$svc = New-Object -ComObject 'Schedule.Service'; $svc.Connect()
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2) -MultipleInstances IgnoreNew
foreach ($a in 'RestorePoint','Tweaks','Apps','SaveDumps','Check') {
  $act = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$dst\runner.ps1`" -Action $a"
  Register-ScheduledTask -TaskPath '\WinSetup\' -TaskName $a -Action $act -Principal $principal -Settings $settings -Force | Out-Null
  # Admins + SYSTEM full; your account may read and start, not edit.
  $svc.GetFolder('\WinSetup').GetTask($a).SetSecurityDescriptor("D:(A;;FA;;;BA)(A;;FA;;;SY)(A;;FRFX;;;$sid)", 0)
}
```

Install it with: `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\WinSetup\install-admin-tasks.ps1"`

**3. Start a task from the normal account** with `Start-ScheduledTask -TaskPath '\WinSetup\' -TaskName 'Check'`, then read its log.

**4. Test the boundary from the normal account.** All three should fail.

```powershell
try { Set-Content C:\ProgramData\WinSetupAdmin\probe.txt 'x' -EA Stop; 'WRITE ALLOWED (bad)' } catch { "write blocked" }
try { Add-Content C:\ProgramData\WinSetupAdmin\runner.ps1 '#' -EA Stop; 'EDIT ALLOWED (bad)' } catch { "edit blocked" }
$svc = New-Object -ComObject Schedule.Service; $svc.Connect()
try { $d = $svc.GetFolder('\WinSetup').GetTask('Check').Definition; $d.RegistrationInfo.Description = 'probe'
      $svc.GetFolder('\WinSetup').RegisterTaskDefinition('Check', $d, 4, $null, $null, 3) | Out-Null; 'TASK EDIT ALLOWED (bad)' } catch { "task edit blocked" }
```

**5. Run external tools as their own process, with a cap, and check their exit code.** If it misbehaves, read the tool's own log before blaming it.

```powershell
# --enable must be the only option; adding --disable-interactivity makes winget exit with a usage error
$wg = Start-Process winget -ArgumentList 'configure','--enable' -WindowStyle Hidden -PassThru
if (-not $wg.WaitForExit(300000)) { $wg.Kill(); 'winget configure --enable timed out after 5 min (skipped)' }
elseif ($wg.ExitCode -ne 0) { "winget configure --enable exited with $($wg.ExitCode); check winget's log" }
```

**Caveats**

- The menu is only as narrow as the scripts behind it. An "Apps" action that installs from a list is effectively "install whatever's in the list," so keep that list inside the protected folder too.
- Updating the protected copy means rerunning the installer elevated. That's the approval step, and it's on purpose.
- Undo: `Get-ScheduledTask -TaskPath '\WinSetup\' | Unregister-ScheduledTask -Confirm:$false; Remove-Item C:\ProgramData\WinSetupAdmin -Recurse`
