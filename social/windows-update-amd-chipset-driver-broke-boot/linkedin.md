# LinkedIn: Windows Update pushed an AMD chipset driver over mine and broke boot

Draft only. Mike schedules it himself.

I reinstalled Windows 11, installed my motherboard vendor's chipset drivers, then ran Windows Update. One restart later the PC was stuck in a boot loop.

The Startup Repair log (SrtTrail.txt) said a recent driver update could be keeping Windows from starting. Update history showed which one: Windows Update had installed its own AMD driver right on top of the vendor package. Startup Repair rolled it back, and the PC booted normally.

What I changed:
• Windows Update no longer installs drivers on this PC (one policy value, ExcludeWUDriversInQualityUpdate). Security and feature updates still arrive; I get drivers from the vendor myself.
• Crash evidence sticks around now: the blue screen stays up long enough to read, boot logging is on, and a startup task copies any crash dump to a safe folder.

The order matters: on a fresh install, run Windows Update before vendor drivers, or block its drivers entirely.

Full write-up with the PowerShell commands: https://mikepred.github.io/build-log/windows-update-amd-chipset-driver-broke-boot/
