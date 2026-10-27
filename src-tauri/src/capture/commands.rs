use std::fs;

use tauri::AppHandle;

use crate::shared::adb::adb_device_bytes;
use crate::shared::errors::err_key;
use crate::shared::task::run_blocking;
use crate::settings::store::{resolve_save_dir, timestamp};

#[tauri::command]
pub async fn take_screenshot(app: AppHandle, serial: String) -> Result<String, String> {
    run_blocking(move || {
        let png = adb_device_bytes(&app, &serial, &["exec-out", "screencap", "-p"])?;
        if png.len() < 100 {
            return Err("errors.screenshot_invalid".into());
        }

        let path = resolve_save_dir(&app)?
            .join("screenshots")
            .join(format!("screenshot_{}.png", timestamp()));
        fs::write(&path, png)
            .map_err(|e| err_key("errors.screenshot_save", &[("detail", &e.to_string())]))?;

        Ok(path.to_string_lossy().to_string())
    })
    .await
}
