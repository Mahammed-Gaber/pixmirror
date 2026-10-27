# Runtime binaries (not in Git)

PixMirror expects Windows x86_64 builds of **scrcpy** and **adb** here.

## Setup

From the repo root:

```powershell
npm run setup:binaries
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fetch-binaries.ps1
```

This downloads the official scrcpy win64 release (includes adb + DLLs) and renames the executables for Tauri `externalBin`.

## Expected files

- `adb-x86_64-pc-windows-msvc.exe`
- `scrcpy-x86_64-pc-windows-msvc.exe`
- `scrcpy-server`
- `AdbWinApi.dll`, `AdbWinUsbApi.dll`
- `SDL2.dll`, `avcodec-*.dll`, `avformat-*.dll`, `avutil-*.dll`, `swresample-*.dll`
- `libusb-1.0.dll`
- `icon.png`
