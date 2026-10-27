use std::fs;
use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use super::store::{ensure_capture_dirs, load_settings, persist_settings, resolve_save_dir};

#[tauri::command]
pub fn get_save_directory(app: AppHandle) -> Result<String, String> {
    Ok(resolve_save_dir(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn set_save_directory(app: AppHandle, path: String) -> Result<String, String> {
    let dir = PathBuf::from(path.trim());
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| {
            crate::shared::errors::err_key("errors.mkdir_failed", &[("detail", &e.to_string())])
        })?;
    }
    ensure_capture_dirs(&dir)?;

    let mut settings = load_settings(&app)?;
    settings.save_dir = Some(dir.to_string_lossy().to_string());
    persist_settings(&app, &settings)?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_save_directory(app: AppHandle, kind: Option<String>) -> Result<(), String> {
    let save_dir = resolve_save_dir(&app)?;
    let path = match kind.as_deref() {
        Some("screenshots") => save_dir.join("screenshots"),
        Some("recordings") => save_dir.join("recordings"),
        _ => save_dir,
    };

    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(|e| {
            crate::shared::errors::err_key("errors.open_folder_failed", &[("detail", &e.to_string())])
        })
}

/// Open Explorer with a saved capture selected.
#[tauri::command]
pub fn reveal_capture(app: AppHandle, path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if !path.starts_with(resolve_save_dir(&app)?) {
        return Err("errors.path_outside_save".into());
    }
    app.opener().reveal_item_in_dir(&path).map_err(|e| {
        crate::shared::errors::err_key("errors.open_folder_failed", &[("detail", &e.to_string())])
    })
}
