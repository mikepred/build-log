# X thread: Windows Update pushed an AMD chipset driver over mine and broke boot

Draft only. Mike schedules it himself. Post after the entry is live.

**1/5**
Fresh Windows 11 install. Chipset drivers straight from Gigabyte, then the NVIDIA driver, then Windows Update. One restart later: black screen, boot loop, Automatic Repair. 🧵

**2/5**
The clue was in SrtTrail.txt, the Startup Repair log: "a recent driver update installation could be preventing Windows from starting." Update history pointed at the likely culprit: "AMD - System 20.50.0.0," installed at 3:07 AM right over the Gigabyte package.

**3/5**
Startup Repair had already uninstalled it, which is why hitting Continue just worked. Lesson: run Windows Update before vendor drivers, or don't let it send drivers at all.

**4/5**
The fix is one policy value: ExcludeWUDriversInQualityUpdate = 1. Same as the Group Policy "Do not include drivers with Windows Updates." Security and feature updates still come through. You own your drivers now.

**5/5**
I also lost a crash dump that night, so now the PC keeps them: AutoReboot off, boot logging on, and a startup task that copies dumps somewhere safe. Commands for all of it: https://mikepred.github.io/build-log/windows-update-amd-chipset-driver-broke-boot/
