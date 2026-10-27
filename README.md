# PixMirror

Desktop app to mirror and control an Android phone over USB.

Built with Tauri 2, React, TypeScript, and Rust. Uses [scrcpy](https://github.com/Genymobile/scrcpy) and ADB under the hood.

## Features

- USB device detection with USB debugging
- One-click screen mirror with a docked toolbar
- Performance presets (High / Gaming / Eco)
- Optional phone screen-off while controlling from the PC
- Screenshot and screen recording
- Live battery / CPU / RAM hints
- English and Arabic (follows Windows language by default)

## Requirements

- Windows 10/11
- [Node.js](https://nodejs.org/) + npm
- [Rust](https://www.rust-lang.org/) + Visual Studio C++ Build Tools
- Android phone with USB debugging enabled
- A data USB cable (not charge-only)

## Quick start

```bash
npm install
npm run tauri dev
```

Build an installer:

```bash
npm run tauri build
```

`adb` and `scrcpy` are bundled under `src-tauri/binaries/` for Windows x86_64.

## Connect a phone

1. Enable Developer options (tap Build number seven times).
2. Enable USB debugging.
3. Plug in a data cable.
4. Accept “Allow USB debugging” on the phone (prefer *Always allow*).
5. Select the device in PixMirror → **Start mirror**.

## License

Application code: see [LICENSE](LICENSE).

Bundled [scrcpy](https://github.com/Genymobile/scrcpy) is under the Apache License 2.0. Keep its license and attribution when redistributing binaries.
