use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::{AppHandle, Manager};

use super::errors::err_key;

/// Directory that contains scrcpy/adb executables and their DLLs / scrcpy-server.
pub fn binaries_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        let dev_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries");
        if dev_dir.exists() {
            return Ok(dev_dir);
        }
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| err_key("errors.resource_dir", &[("detail", &e.to_string())]))?;

    let nested = resource_dir.join("binaries");
    if nested.exists() {
        Ok(nested)
    } else if resource_dir.exists() {
        Ok(resource_dir)
    } else {
        Err("errors.binaries_missing".into())
    }
}

fn exe_suffix() -> &'static str {
    if cfg!(windows) {
        ".exe"
    } else {
        ""
    }
}

/// Resolve `adb` / `scrcpy` binary path (supports Tauri externalBin target-triple names).
pub fn resolve_binary(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = binaries_dir(app)?;
    let suffix = exe_suffix();

    let mut candidates: Vec<PathBuf> = Vec::new();

    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    candidates.push(dir.join(format!("{name}-x86_64-pc-windows-msvc{suffix}")));

    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    candidates.push(dir.join(format!("{name}-aarch64-pc-windows-msvc{suffix}")));

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    candidates.push(dir.join(format!("{name}-aarch64-apple-darwin")));

    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    candidates.push(dir.join(format!("{name}-x86_64-apple-darwin")));

    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    candidates.push(dir.join(format!("{name}-x86_64-unknown-linux-gnu")));

    candidates.push(dir.join(format!("{name}{suffix}")));
    candidates.push(dir.join(name));

    // Production externalBin: next to the app executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(app_dir) = exe.parent() {
            candidates.push(app_dir.join(format!("{name}{suffix}")));
            candidates.push(app_dir.join(name));
        }
    }

    candidates
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| err_key("errors.binary_not_found", &[("name", name)]))
}

fn prepend_path(dir: &Path) -> String {
    let current = std::env::var("PATH").unwrap_or_default();
    let sep = if cfg!(windows) { ";" } else { ":" };
    format!("{}{sep}{current}", dir.display())
}

/// Command for a bundled tool, running from the binaries dir without a console window.
pub fn tool_command(app: &AppHandle, name: &str) -> Result<Command, String> {
    let binary = resolve_binary(app, name)?;
    let dir = binaries_dir(app)?;

    let mut cmd = Command::new(binary);
    cmd.current_dir(&dir).env("PATH", prepend_path(&dir));

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    Ok(cmd)
}
