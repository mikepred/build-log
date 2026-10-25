---
title: "Sorting images by what's in them with Windows' own OCR (half built)"
date: 2026-10-25
tags: [windows-11, powershell, ocr, onedrive, organization, ai-assistants]
summary: "I wanted to sort images, PDFs and videos by their content, offline, without learning a new platform. Inspector, one of my Grok Bot assistants, built a PowerShell script on the OCR engine already in Windows. It sorts receipts from tax forms, but it can't tell a beach from a birthday, and the picture-recognition half isn't built yet."
canonical_url: "https://mikepred.github.io/build-log/offline-ocr-content-routing/"
---

## Case file

- **Symptom:** I want my files filed by what's in them, offline, and every suggestion was another platform to learn.
- **Evidence:** a test on three made-up images. The receipt went to `Finance\Receipts`, the W-2 to `Finance\Taxes`, and the blank one was called a photo. The PC has an RTX 5070 Ti but no NPU.
- **Cause:** Windows ships a text reader (OCR) that works offline. Its built-in photo description needs a Copilot+ PC with an NPU, which mine isn't.
- **Fix (partial):** `Image-OCR-Index.ps1` reads each image's text with `Windows.Media.Ocr`, suggests a folder from simple rules, and writes a CSV. It moves nothing.
- **Prevention (planned, unproven):** picture recognition with Windows ML and a CLIP model, scored against plain-English labels that match my folders. Not built.
- **Lesson:** use what's already on the machine first, and be honest about where it stops. OCR reads text, not pictures.

![What's built and what's still dashed](/build-log/images/offline-ocr-content-routing/ocr-routing.svg)

## The story

While cleaning up OneDrive (that's [its own entry](https://mikepred.github.io/build-log/onedrive-audit-file-count-not-size/)), I wanted the next step to be sorting by content. Receipts go one place, tax forms another, photos somewhere else, without me opening each file. And offline.

I asked Inspector, one of my Grok Bot assistants (it was still called QA bot then). It came back with the usual list: OCRmyPDF, Docling, Apache Tika, local vision models through Ollama, paperless-ngx, Immich or digiKam, LlamaFS. All real, and every one of them a new thing to install and learn. So I said: "I don't want to learn another type of platform. I want to use the tools that are available in Windows, like the OCR engine, but for images."

Windows does have one. `Windows.Media.Ocr` is the engine behind text recognition in Windows, and PowerShell can call it. Inspector wrote `Image-OCR-Index.ps1` around it and tested it on my PC with three images it generated: a fake corner-market receipt, a fake W-2, and a blank one. The receipt landed in `Finance\Receipts`, the W-2 in `Finance\Taxes`, and the blank one was "Photos (little or no text)." It took under a second.

It doesn't move anything. It writes a CSV with each file's suggested folder, word count, and a text preview, so I can check before anything happens. The routing rules are a short list at the top of the script, and the starter categories were only Inspector's guess at mine. Most of my pictures are online-only in OneDrive, so by default it skips those instead of downloading them. `-IncludeCloudOnly` opts in, one folder at a time.

Then the catch. OCR reads text. It can tell a receipt from a screenshot, but not a beach from a birthday. Windows can describe what's in a photo on its own only on Copilot+ PCs with an NPU, and mine doesn't have one.

For video, Inspector suggested metadata (date, length, resolution, camera model) plus a few frame grabs at 10%, 50% and 90% of the way through, run through the same OCR. That covers screen recordings well. But I wasn't after the text: "it's not the text in the frame, it's the picture that would be necessary."

That takes a model. Inspector's closest no-new-platform option is Windows ML, which is already part of Windows 11 and can run on my GPU, plus one downloaded model, CLIP. You give it plain-English labels like "receipt," "beach," "birthday party," or "screenshot," and it scores each picture against them. The labels can be my folder names. OneDrive does tag photo content itself, but that happens in the cloud.

Inspector offered to build it. I said "Not yet." Later I decided to hold this entry until picture recognition is built and tested end to end. So this is the half that exists.

### Not built yet / still open

- No picture recognition. Windows ML + CLIP is a proposal only.
- No video support. The frame-grab plan hasn't been written.
- No PDFs yet, even though they were part of the original ask.
- So far the script has only run on three made-up test images, not my real folders.
- Nothing moves files. A move step would come after I trust the CSV.

## Do it yourself

This uses only what ships with Windows 11 and runs in Windows PowerShell 5.1. You need at least one OCR language installed (Settings > Time & language > Language).

**1. Load the Windows Runtime types.**

```powershell
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
```

**2. Add a small helper to wait on the async calls.**

```powershell
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Await($op, [Type]$type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); [void]$t.Wait(-1); $t.Result }
```

**3. Read one image's text.**

```powershell
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$file   = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync('C:\path\to\image.png')) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec    = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bmp    = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
(Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])).Text
```

**4. Route by rules, first match wins.** Keep them editable at the top of the script:

```powershell
$Rules = @(
  @{ Folder = 'Finance\Taxes';    Pattern = '\b(W-?2|1099|1040|IRS|tax return|withholding)\b' }
  @{ Folder = 'Finance\Receipts'; Pattern = '\b(subtotal|total due|receipt|order #|visa|mastercard|amex|change due)\b' }
)
```

Treat fewer than about five words as a photo, not a document.

**5. Don't download online-only files by accident.** Skip files with these attribute bits unless you mean to download them:

```powershell
$a = [int]$f.Attributes
$cloudOnly = ($a -band 0x400000) -or ($a -band 0x40000) -or ($a -band 0x1000)
```

**6. Write a CSV, not moves.** Review it first. Moving files is a separate step.

**Caveats**

- OCR reads text only. Photos with no text all land in one bucket.
- Very large images have to be scaled down to `OcrEngine.MaxImageDimension` first.
- Reading online-only files downloads them.
- My test was three synthetic images. Real scans and phone photos will be messier.
