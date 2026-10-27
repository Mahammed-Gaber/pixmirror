use std::ffi::OsStr;
use std::process::Stdio;

use tauri::AppHandle;

use super::binaries::tool_command;
use super::errors::{err_key, friendly_error};

fn run<I, S>(app: &AppHandle, args: I) -> Result<Vec<u8>, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let output = tool_command(app, "adb")?
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| err_key("errors.adb_start_failed", &[("detail", &e.to_string())]))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        // dumpsys scripts may exit non-zero via `head` while stdout is still usable.
        if stdout.contains("---MEM---") {
            return Ok(output.stdout);
        }
        let raw = if stderr.trim().is_empty() {
            stdout.as_ref()
        } else {
            stderr.as_ref()
        };
        return Err(friendly_error(raw));
    }

    Ok(output.stdout)
}

/// Run a global adb command (e.g. `devices`) and return stdout as text.
pub fn adb<I, S>(app: &AppHandle, args: I) -> Result<String, String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    run(app, args).map(|out| String::from_utf8_lossy(&out).to_string())
}

/// Run an adb command against a specific device and return stdout as text.
pub fn adb_device(app: &AppHandle, serial: &str, args: &[&str]) -> Result<String, String> {
    adb_device_bytes(app, serial, args).map(|out| String::from_utf8_lossy(&out).to_string())
}

/// Run an adb command against a specific device and return raw stdout (binary-safe).
pub fn adb_device_bytes(app: &AppHandle, serial: &str, args: &[&str]) -> Result<Vec<u8>, String> {
    if serial.is_empty() {
        return Err("errors.select_device".into());
    }
    let mut full = vec!["-s", serial];
    full.extend_from_slice(args);
    run(app, full)
}
