# Downloads official scrcpy win64 (includes adb) into src-tauri/binaries.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "src-tauri\binaries"
$Triple = "x86_64-pc-windows-msvc"

Write-Host "Resolving latest scrcpy release..."
$Release = Invoke-RestMethod -Uri "https://api.github.com/repos/Genymobile/scrcpy/releases/latest" -Headers @{ "User-Agent" = "pixmirror-setup" }
$Asset = $Release.assets | Where-Object { $_.name -match '^scrcpy-win64-.*\.zip$' } | Select-Object -First 1
if (-not $Asset) { throw "No scrcpy-win64 zip found on the latest release." }

$Url = $Asset.browser_download_url
$ZipName = $Asset.name

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Temp = Join-Path $env:TEMP "pixmirror-scrcpy"
$ZipPath = Join-Path $Temp $ZipName
$Extract = Join-Path $Temp "extract"

if (Test-Path $Temp) { Remove-Item -Recurse -Force $Temp }
New-Item -ItemType Directory -Force -Path $Extract | Out-Null

Write-Host "Downloading $($Release.tag_name): $ZipName ..."
Invoke-WebRequest -Uri $Url -OutFile $ZipPath -UseBasicParsing

Write-Host "Extracting..."
Expand-Archive -Path $ZipPath -DestinationPath $Extract -Force

$Payload = Get-ChildItem $Extract -Directory | Select-Object -First 1
if (-not $Payload) {
  # Some zips extract files at the root
  $Payload = Get-Item $Extract
}

$AdbSrc = Get-ChildItem -Path $Payload.FullName -Recurse -Filter "adb.exe" | Select-Object -First 1
$ScrcpySrc = Get-ChildItem -Path $Payload.FullName -Recurse -Filter "scrcpy.exe" | Select-Object -First 1
if (-not $AdbSrc) { throw "adb.exe missing from scrcpy package." }
if (-not $ScrcpySrc) { throw "scrcpy.exe missing from scrcpy package." }

$PayloadDir = $ScrcpySrc.Directory.FullName
Copy-Item -Force (Join-Path $PayloadDir "*") -Destination $OutDir

# Prefer renamed Tauri externalBin names
$AdbOut = Join-Path $OutDir "adb.exe"
$ScrcpyOut = Join-Path $OutDir "scrcpy.exe"
if (Test-Path $AdbOut) {
  Move-Item -Force $AdbOut (Join-Path $OutDir "adb-$Triple.exe")
}
if (Test-Path $ScrcpyOut) {
  Move-Item -Force $ScrcpyOut (Join-Path $OutDir "scrcpy-$Triple.exe")
}

# tauri.conf bundles binaries/icon.png; newer scrcpy zips may omit it.
# Prefer the app icon so CI/local builds always have a stable file.
$IconOut = Join-Path $OutDir "icon.png"
$IconCandidates = @(
  (Join-Path $Root "src-tauri\icons\128x128.png"),
  (Join-Path $Root "src-tauri\icons\icon.png"),
  (Join-Path $PayloadDir "icon.png")
)
$IconSrc = $IconCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $IconSrc) {
  throw "No icon.png source found (expected src-tauri/icons/128x128.png)."
}
Copy-Item -Force $IconSrc $IconOut
Write-Host "Bundled icon: $IconSrc -> $IconOut"

Remove-Item -Recurse -Force $Temp
Write-Host "Done. Binaries are in src-tauri/binaries (gitignored)."
