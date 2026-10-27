use tauri::AppHandle;

use super::service;
use super::state::{MirrorOptions, MirrorStatus};
use crate::shared::task::run_blocking;
use crate::toolbar::restore;

#[tauri::command]
pub async fn start_mirroring(app: AppHandle, options: MirrorOptions) -> Result<(), String> {
    run_blocking(move || service::start(&app, options)).await
}

#[tauri::command]
pub async fn stop_mirroring(app: AppHandle) -> Result<Option<String>, String> {
    let path = run_blocking({
        let app = app.clone();
        move || service::stop(&app)
    })
    .await?;
    // Restore on the command thread (not the blocking pool) so window APIs are safe.
    let _ = restore::restore_if_needed(&app);
    Ok(path)
}

#[tauri::command]
pub fn get_mirror_status(app: AppHandle) -> MirrorStatus {
    let status = service::status(&app);
    // scrcpy may have quit on its own (Wi‑Fi drop, phone off, user closed it).
    if !status.active {
        let _ = restore::restore_if_needed(&app);
    }
    status
}

#[tauri::command]
pub async fn start_recording(app: AppHandle) -> Result<String, String> {
    run_blocking(move || service::start_recording(&app)).await
}

#[tauri::command]
pub async fn stop_recording(app: AppHandle) -> Result<String, String> {
    run_blocking(move || service::stop_recording(&app)).await
}
