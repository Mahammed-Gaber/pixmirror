use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::shared::errors::err_key;

#[derive(Serialize, Deserialize, Default)]
pub struct Settings {
    pub save_dir: Option<String>,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| err_key("errors.settings_dir", &[("detail", &e.to_string())]))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> Result<Settings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(Settings::default());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

pub fn persist_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

fn default_save_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .document_dir()
        .map_err(|e| err_key("errors.documents_dir", &[("detail", &e.to_string())]))
        .map(|d| d.join("PixMirror"))
}

pub fn timestamp() -> String {
    chrono::Local::now().format("%Y%m%d_%H%M%S").to_string()
}

pub fn ensure_capture_dirs(base: &Path) -> Result<(), String> {
    fs::create_dir_all(base.join("screenshots")).map_err(|e| e.to_string())?;
    fs::create_dir_all(base.join("recordings")).map_err(|e| e.to_string())?;
    Ok(())
}

/// Save directory with `screenshots/` and `recordings/` guaranteed to exist.
pub fn resolve_save_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = load_settings(app)?
        .save_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| default_save_dir(app).unwrap_or_else(|_| PathBuf::from("PixMirror")));
    ensure_capture_dirs(&dir)?;
    Ok(dir)
}
