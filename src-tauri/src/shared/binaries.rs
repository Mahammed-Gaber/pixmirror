use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::{AppHandle, Manager};

use super::errors::err_key;

/// Strip Windows verbatim prefix (`\\?\C:\...` → `C:\...`).
/// scrcpy's `stat()` rejects `\\?\` paths (common from `current_exe` / Tauri).
fn for_external(path: &Path) -> PathBuf {
    #[cfg(windows)]
    {
        let s = path.to_string_lossy();
        if let Some(rest) = s.strip_prefix(r"\\?\") {
            if let Some(unc) = rest.strip_prefix(r"UNC\") {
                return PathBuf::from(format!(r"\\{unc}"));
            }
            return PathBuf::from(rest);
        }
    }
    path.to_path_buf()
}

/// Folder with scrcpy/adb DLLs and `scrcpy-server`.
///
/// Dev: `src-tauri/binaries`. Release: exe dir (flat bundle), or legacy `binaries/`.
pub fn binaries_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        let dev_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries");
        if dev_dir.exists() {
            return Ok(for_external(&dev_dir));
        }
    }

    let resource_dir = for_external(
        &app.path()
            .resource_dir()
            .map_err(|e| err_key("errors.resource_dir", &[("detail", &e.to_string())]))?,
    );

    let nested = resource_dir.join("binaries");
    if resource_dir.join("scrcpy-server").is_file() {
        Ok(resource_dir)
    } else if nested.exists() {
        Ok(nested)
    } else {
        Ok(resource_dir)
    }
}

fn exe_suffix() -> &'static str {
    if cfg!(windows) {
        ".exe"
    } else {
        ""
    }
}

/// Resolve `adb` / `scrcpy` (Tauri externalBin triple names + plain names).
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

    // Production externalBin: next to the app executable.
    if let Ok(exe) = std::env::current_exe() {
        if let Some(app_dir) = for_external(&exe).parent() {
            candidates.push(app_dir.join(format!("{name}{suffix}")));
            candidates.push(app_dir.join(name));
        }
    }

    candidates
        .into_iter()
        .find(|p| p.exists())
        .map(|p| for_external(&p))
        .ok_or_else(|| err_key("errors.binary_not_found", &[("name", name)]))
}

fn prepend_path(dir: &Path) -> String {
    let current = std::env::var("PATH").unwrap_or_default();
    let sep = if cfg!(windows) { ";" } else { ":" };
    format!("{}{sep}{current}", dir.display())
}

/// Spawn a bundled tool from its own directory (DLLs / scrcpy-server beside the exe).
pub fn tool_command(app: &AppHandle, name: &str) -> Result<Command, String> {
    let binary = resolve_binary(app, name)?;
    let bin_dir = binary
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| err_key("errors.binary_not_found", &[("name", name)]))?;

    let mut cmd = Command::new(&binary);
    cmd.current_dir(&bin_dir).env("PATH", prepend_path(&bin_dir));

    if name == "scrcpy" {
        // Prefer bundled adb over whatever else is on PATH.
        if let Ok(adb) = resolve_binary(app, "adb") {
            cmd.env("ADB", adb);
        }
        let server = bin_dir.join("scrcpy-server");
        if server.is_file() {
            cmd.env("SCRCPY_SERVER_PATH", server);
        }
        let icon = bin_dir.join("icon.png");
        if icon.is_file() {
            cmd.env("SCRCPY_ICON_PATH", icon);
        }
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    Ok(cmd)
}
